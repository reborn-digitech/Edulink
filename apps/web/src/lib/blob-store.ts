import { mkdir, open, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { readStorageConfig } from "./env";
import { S3Client } from "./s3";

/**
 * Where uploaded bytes live: a directory on this machine, or a bucket.
 *
 * `storage.ts` decides what may be stored and under what name; `orphans.ts`
 * decides what may be reclaimed. Neither should know whether the bytes are on
 * a disk or in R2, so both go through this one interface. Two namespaces,
 * because the reclaim sweep walks the originals and must never mistake a
 * resized copy for something it did not write:
 *
 *   disk    files → <STORAGE_DIR>/<shard>/<fileId>          (the layout since Phase 1, unchanged)
 *           variants → <STORAGE_DIR>-variants/<shard>/<name>
 *   bucket  files → <prefix>files/<shard>/<fileId>
 *           variants → <prefix>variants/<shard>/<name>
 *
 * RESOLVED PER CALL, not at import. The disk root used to be bound once at
 * import in storage.ts, and the orphans test could only point the sweep at a
 * scratch directory because orphans.ts re-read the environment on every call.
 * One rule for both now: read the environment when asked, so a test — or a
 * release that flips from a volume to a bucket — takes effect without a
 * process restart.
 */
export type StoredObject = { name: string; size: number; modifiedAt: Date };

/**
 * A Range header's two numbers (TA-341): `bytes=<first>-<last>`, either empty (null); null for a header that is not a
 * single byte range at all. Resolved against the object's size by `resolveRange`, the one reading of it.
 */
export type ByteRange = { first: number | null; last: number | null } | null;
/** A ranged read: the bytes from `start` to `end` inclusive, or that the range cannot be satisfied; the object's size either way. */
export type RangeRead = { bytes: Buffer; start: number; end: number; total: number } | { unsatisfiable: true; total: number };

/**
 * The bytes a range names in an object of `total` bytes, or null when it names none (the file route's rule since Phase 1).
 * TA-137: with `maxBytes`, at most that many from the range's start: one slice of it, so that a range a player leaves
 * open to the end ("bytes=0-" on a 100 MB video) is read a slice at a time (storage.ts streamStoredRange) and not whole.
 */
export function resolveRange(range: ByteRange, total: number, maxBytes?: number): { start: number; end: number } | null {
  if (!range) return null;
  const start = range.first !== null ? range.first : range.last !== null ? total - range.last : NaN;
  const end = range.first !== null && range.last !== null ? Math.min(range.last, total - 1) : total - 1;
  if (Number.isNaN(start) || start < 0 || start > end || start >= total) return null;
  return { start, end: maxBytes && maxBytes > 0 ? Math.min(end, start + maxBytes - 1) : end };
}

export type BlobStore = {
  put(name: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(name: string): Promise<Buffer | null>;
  /**
   * TA-341: only the bytes a range names, read from the disk by offset or asked of the bucket with Range; null when there is no such object.
   * TA-137: with `maxBytes`, no more than that many of them (resolveRange), and no more than that is read or asked for.
   */
  getRange?(name: string, range: ByteRange, maxBytes?: number): Promise<RangeRead | null>;
  delete(name: string): Promise<void>;
  /** Every stored object, as `<shard>/<name>` relative names, with size and mtime. */
  list(): AsyncGenerator<StoredObject>;
  /** Whether the store can be listed at all — a missing directory or a refused bucket is false, not empty. */
  probe(): Promise<boolean>;
  /** For messages: where this store is. Never a secret. */
  describe(): string;
};

export type Namespace = "files" | "variants";

export function blobStore(ns: Namespace): BlobStore {
  const config = readStorageConfig();
  if (config.bucket) return s3Store(ns, new S3Client(config.bucket), config.bucket.prefix);
  const root = resolve(process.cwd(), config.dir);
  return diskStore(ns === "files" ? root : `${root}-variants`);
}

/** True when uploads go to a bucket rather than this machine's disk. */
export function storageIsBucket(): boolean {
  return Boolean(readStorageConfig().bucket);
}

function diskStore(root: string): BlobStore {
  const pathFor = (name: string) => join(root, name);
  return {
    async put(name, bytes) {
      const target = pathFor(name);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    },
    async get(name) {
      try {
        return await readFile(pathFor(name));
      } catch {
        return null;
      }
    },
    async getRange(name, range, maxBytes) {
      const handle = await open(pathFor(name), "r").catch(() => null);
      if (!handle) return null;
      try {
        const total = (await handle.stat()).size;
        const span = resolveRange(range, total, maxBytes);
        if (!span) return { unsatisfiable: true, total };
        const bytes = Buffer.alloc(span.end - span.start + 1);
        const { bytesRead } = await handle.read(bytes, 0, bytes.byteLength, span.start);
        return { bytes: bytes.subarray(0, bytesRead), start: span.start, end: span.start + bytesRead - 1, total };
      } finally {
        await handle.close();
      }
    },
    async delete(name) {
      await unlink(pathFor(name)).catch(() => {
        // Already gone is the desired end state.
      });
    },
    async *list() {
      const shards = await readdir(root).catch(() => [] as string[]);
      for (const shard of shards) {
        const entries = await readdir(join(root, shard)).catch(() => [] as string[]);
        for (const entry of entries) {
          const info = await stat(join(root, shard, entry)).catch(() => null);
          if (!info?.isFile()) continue;
          // Built apart from the object literal: the i18n audit reads a `name:` string as copy.
          const name = [shard, entry].join("/");
          yield { name, size: info.size, modifiedAt: info.mtime };
        }
      }
    },
    async probe() {
      return readdir(root).then(
        () => true,
        () => false,
      );
    },
    describe: () => root,
  };
}

function s3Store(ns: Namespace, client: S3Client, prefix: string): BlobStore {
  const base = `${prefix}${ns}/`;
  return {
    put: (name, bytes, contentType) => client.put(base + name, bytes, contentType),
    get: (name) => client.get(base + name),
    async getRange(name, range, maxBytes) {
      // A header that names no range still needs the size for the 416: the first byte is asked for that.
      let asked = range && (range.first !== null || range.last !== null) ? `bytes=${range.first ?? ""}-${range.last ?? ""}` : "bytes=0-0";
      if (maxBytes && maxBytes > 0 && range) {
        // TA-137: the bucket is asked for the slice, not for everything the header names.
        if (range.first !== null && range.last !== null && range.last < range.first) {
          // Names no bytes: only the size is needed, for the 416 (a bucket sends the whole object for a range it cannot read).
          asked = "bytes=0-0";
        } else if (range.first !== null) {
          asked = `bytes=${range.first}-${Math.min(range.last ?? Number.MAX_SAFE_INTEGER, range.first + maxBytes - 1)}`;
        } else if (range.last !== null && range.last > maxBytes) {
          // A tail longer than a slice: where it starts depends on the size, which is asked first.
          const size = await client.getRange(base + name, "bytes=0-0");
          if (!size) return null;
          const tail = resolveRange(range, size.total, maxBytes);
          if (!tail) return { unsatisfiable: true, total: size.total };
          asked = `bytes=${tail.start}-${tail.end}`;
        }
      }
      const answer = await client.getRange(base + name, asked);
      if (!answer) return null;
      const span = resolveRange(range, answer.total, maxBytes);
      if (!span) return { unsatisfiable: true, total: answer.total };
      // The bucket's own answer when it served exactly the range; otherwise (the whole object, or its reading of an
      // edge case) cut by the rule above from what it sent.
      if (answer.start === span.start && answer.end === span.end) return { bytes: answer.bytes, start: span.start, end: span.end, total: answer.total };
      if (answer.start === 0 && answer.bytes.byteLength === answer.total) return { bytes: answer.bytes.subarray(span.start, span.end + 1), start: span.start, end: span.end, total: answer.total };
      const full = await client.get(base + name);
      if (!full) return null;
      return { bytes: full.subarray(span.start, span.end + 1), start: span.start, end: span.end, total: full.byteLength };
    },
    delete: (name) => client.delete(base + name),
    async *list() {
      for await (const object of client.list(base)) {
        if (!object.key.startsWith(base)) continue;
        yield { name: object.key.slice(base.length), size: object.size, modifiedAt: object.lastModified };
      }
    },
    probe: () => client.probe(base),
    describe: () => `bucket ${client["config"].bucket}, ${base}`,
  };
}
