import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
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

export type BlobStore = {
  put(name: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(name: string): Promise<Buffer | null>;
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
          yield { name: `${shard}/${entry}`, size: info.size, modifiedAt: info.mtime };
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
