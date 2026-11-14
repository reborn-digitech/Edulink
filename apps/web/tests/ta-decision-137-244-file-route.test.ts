/**
 * TA-137 and TA-244 of the testing analysis of 13 November 2026, the second guard of the decision of 14 November 2026:
 * with the upload door taking videos of up to 100 MB, the file route must not hold one whole in memory to play it. A
 * range a player leaves open to the end ("bytes=0-", what a browser sends for a video) was read to the end of the
 * object and copied, and a request with no range read the whole object; a video asked with ?w= was read whole too,
 * since only a picture has sized copies.
 *
 * The route now answers in slices of a few megabytes, each read from the store only when the reader has taken the one
 * before. The answer is still the range that was asked, to its last byte: what changes is how much is held at once.
 *
 * The store is watched (vi.mock of src/lib/blob-store wraps the real one): the largest read the route makes of it must
 * be one slice, and the whole-object read must not be made for a video at all. The bytes live in a scratch directory
 * under the system's temp folder (STORAGE_DIR, no bucket); the file is a scratch ZZ school's logo, which is public, so
 * the read rule is not what is measured. Removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  for (const key of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) delete process.env[key];
  const store = join(tmpdir(), `zz-ta137-files-${Date.now()}`);
  process.env.STORAGE_DIR = store;
  return { store };
});

const seen = vi.hoisted(() => ({ whole: 0, ranges: 0, largest: 0 }));

vi.mock("@/lib/blob-store", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/blob-store")>();
  return {
    ...real,
    blobStore: (ns: Parameters<typeof real.blobStore>[0]) => {
      const store = real.blobStore(ns);
      const watched: typeof store = {
        ...store,
        get: async (name) => {
          seen.whole += 1;
          const bytes = await store.get(name);
          if (bytes) seen.largest = Math.max(seen.largest, bytes.byteLength);
          return bytes;
        },
      };
      if (store.getRange) {
        const ranged = store.getRange.bind(store);
        watched.getRange = async (...args: Parameters<typeof ranged>) => {
          seen.ranges += 1;
          const read = await ranged(...args);
          if (read && "bytes" in read) seen.largest = Math.max(seen.largest, read.bytes.byteLength);
          return read;
        };
      }
      return watched;
    },
  };
});

import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { nameFor } from "@/lib/storage";
import { resolveRange } from "@/lib/blob-store";
import { GET as fileGet } from "@/app/api/files/[fileId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MB = 1024 * 1024;
/** "A few megabytes": the most the route may read of the store, or hand the reader, at once. */
const SLICE_CEILING = 8 * MB;
const FILE = `${randomUUID()}.mp4`;
// Twenty megabytes: more than two slices whatever the slice is, and small enough to compare byte for byte.
const BYTES = randomBytes(20 * MB);
let schoolId = "";

const get = (headers: Record<string, string> = {}, query = "") => fileGet(new Request(`http://localhost/api/files/${FILE}${query}`, { headers }), { params: Promise.resolve({ fileId: FILE }) });
const reset = () => {
  seen.whole = 0;
  seen.ranges = 0;
  seen.largest = 0;
};

/** Reads an answer to its end the way a player does, a piece at a time: the bytes, how many pieces, and the largest. */
async function drain(res: Response): Promise<{ bytes: Buffer; pieces: number; largest: number }> {
  const reader = res.body!.getReader();
  const chunks: Buffer[] = [];
  let largest = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    largest = Math.max(largest, value.byteLength);
    chunks.push(Buffer.from(value));
  }
  return { bytes: Buffer.concat(chunks), pieces: chunks.length, largest };
}

beforeAll(async () => {
  const path = join(ENV.store, nameFor(FILE));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, BYTES);
  schoolId = (await db.school.create({ data: { name: `ZZ TA File Slices ${STAMP}`, slug: `zz-ta137f-${STAMP}`, code: `ZT7F${String(STAMP).slice(-6)}`, contactEmail: `zz-ta137f-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", logoPath: FILE, isTestFixture: true }, select: { id: true } })).id;
  __resetCookies();
  __setHeaders({});
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
  await rm(ENV.store, { recursive: true, force: true });
});

describe("TA-137 / TA-244: the file route answers a video in slices", () => {
  it("TA-137: a range left open to the end is answered to the end, in slices of a few megabytes, and never read whole", async () => {
    reset();
    const open = await get({ range: "bytes=0-" });
    expect(open.status).toBe(206);
    // Only the first slice has been read before the player takes a byte.
    expect(seen.ranges).toBe(1);
    expect(seen.largest).toBeLessThanOrEqual(SLICE_CEILING);
    const played = await drain(open);
    expect(seen.whole).toBe(0);
    expect(seen.largest).toBeLessThanOrEqual(SLICE_CEILING);
    expect(played.largest).toBeLessThanOrEqual(SLICE_CEILING);
    expect(played.pieces).toBeGreaterThan(2);
    // What the player asked for, whole: the range is not cut short.
    expect(open.headers.get("content-range")).toBe(`bytes 0-${BYTES.byteLength - 1}/${BYTES.byteLength}`);
    expect(open.headers.get("content-length")).toBe(String(BYTES.byteLength));
    expect(open.headers.get("accept-ranges")).toBe("bytes");
    expect(played.bytes.equals(BYTES)).toBe(true);

    // From the middle (a seek), the same.
    reset();
    const from = 7 * MB + 3;
    const seek = await get({ range: `bytes=${from}-` });
    expect(seek.status).toBe(206);
    expect(seek.headers.get("content-range")).toBe(`bytes ${from}-${BYTES.byteLength - 1}/${BYTES.byteLength}`);
    const rest = await drain(seek);
    expect(rest.bytes.equals(BYTES.subarray(from))).toBe(true);
    expect(seen.whole).toBe(0);
    expect(seen.largest).toBeLessThanOrEqual(SLICE_CEILING);
  });

  it("TA-137: a player that stops after the first slice stops the reading", async () => {
    reset();
    const open = await get({ range: "bytes=0-" });
    const reader = open.body!.getReader();
    const first = await reader.read();
    expect(first.value!.byteLength).toBeLessThanOrEqual(SLICE_CEILING);
    await reader.cancel();
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Twenty megabytes were asked for; a slice or two were read.
    expect(seen.ranges).toBeLessThanOrEqual(2);
    expect(seen.whole).toBe(0);
  });

  it("TA-137: a range that names both ends, a tail and a range past the end are answered as before, a long one in slices", async () => {
    reset();
    const exact = await get({ range: "bytes=100-199" });
    expect(exact.status).toBe(206);
    expect(exact.headers.get("content-range")).toBe(`bytes 100-199/${BYTES.byteLength}`);
    expect(exact.headers.get("content-length")).toBe("100");
    expect(Buffer.from(await exact.arrayBuffer()).equals(BYTES.subarray(100, 200))).toBe(true);
    const tail = await get({ range: "bytes=-10" });
    expect(tail.status).toBe(206);
    expect(tail.headers.get("content-range")).toBe(`bytes ${BYTES.byteLength - 10}-${BYTES.byteLength - 1}/${BYTES.byteLength}`);
    expect(Buffer.from(await tail.arrayBuffer()).equals(BYTES.subarray(BYTES.byteLength - 10))).toBe(true);
    const past = await get({ range: `bytes=${BYTES.byteLength + 10}-` });
    expect(past.status).toBe(416);
    expect(past.headers.get("content-range")).toBe(`bytes */${BYTES.byteLength}`);
    const backwards = await get({ range: "bytes=500-100" });
    expect(backwards.status).toBe(416);
    const notARange = await get({ range: "lines=1-2" });
    expect(notARange.status).toBe(416);
    // Both ends named, further apart than a slice; and a tail longer than one.
    const long = await get({ range: `bytes=${MB}-${BYTES.byteLength - 2}` });
    expect(long.status).toBe(206);
    expect(long.headers.get("content-range")).toBe(`bytes ${MB}-${BYTES.byteLength - 2}/${BYTES.byteLength}`);
    const longRead = await drain(long);
    expect(longRead.bytes.equals(BYTES.subarray(MB, BYTES.byteLength - 1))).toBe(true);
    expect(longRead.largest).toBeLessThanOrEqual(SLICE_CEILING);
    const longTail = await get({ range: `bytes=-${BYTES.byteLength - 5}` });
    expect(longTail.status).toBe(206);
    expect(longTail.headers.get("content-range")).toBe(`bytes 5-${BYTES.byteLength - 1}/${BYTES.byteLength}`);
    expect((await drain(longTail)).bytes.equals(BYTES.subarray(5))).toBe(true);
    expect(seen.whole).toBe(0);
    expect(seen.largest).toBeLessThanOrEqual(SLICE_CEILING);
  });

  it("TA-137: a whole file is streamed slice by slice, never read whole", async () => {
    reset();
    const whole = await get();
    expect(whole.status).toBe(200);
    const read = await drain(whole);
    expect(seen.whole).toBe(0);
    expect(seen.largest).toBeLessThanOrEqual(SLICE_CEILING);
    expect(read.largest).toBeLessThanOrEqual(SLICE_CEILING);
    expect(read.pieces).toBeGreaterThan(2);
    expect(read.bytes.equals(BYTES)).toBe(true);
    expect(whole.headers.get("content-length")).toBe(String(BYTES.byteLength));
    expect(whole.headers.get("content-type")).toBe("video/mp4");
    expect(whole.headers.get("accept-ranges")).toBe("bytes");
    expect(whole.headers.get("etag")).toBeTruthy();

    // A reader that stops after the first slice does not make the route read the rest.
    reset();
    const dropped = await get();
    const one = dropped.body!.getReader();
    await one.read();
    await one.cancel();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(seen.ranges).toBeLessThanOrEqual(2);
    expect(seen.whole).toBe(0);
  });

  it("TA-137: a video asked for with a width has no sized copy and is streamed like any other, not read whole", async () => {
    reset();
    const sized = await get({}, "?w=640");
    expect(sized.status).toBe(200);
    const read = await drain(sized);
    expect(seen.whole).toBe(0);
    expect(seen.largest).toBeLessThanOrEqual(SLICE_CEILING);
    expect(read.bytes.equals(BYTES)).toBe(true);
    expect(sized.headers.get("content-type")).toBe("video/mp4");
    expect(sized.headers.get("content-length")).toBe(String(BYTES.byteLength));
    const part = await get({ range: "bytes=0-" }, "?w=640");
    expect(part.status).toBe(206);
    expect((await drain(part)).largest).toBeLessThanOrEqual(SLICE_CEILING);
    expect(seen.whole).toBe(0);
    expect(seen.largest).toBeLessThanOrEqual(SLICE_CEILING);
  });

  it("TA-137: the one reading of a range takes the most bytes to read at once", () => {
    const total = 100 * MB;
    expect(resolveRange({ first: 0, last: null }, total)).toEqual({ start: 0, end: total - 1 });
    const cut = resolveRange as (range: { first: number | null; last: number | null }, total: number, maxBytes?: number) => { start: number; end: number } | null;
    expect(cut({ first: 0, last: null }, total, 4 * MB)).toEqual({ start: 0, end: 4 * MB - 1 });
    expect(cut({ first: 10, last: 19 }, total, 4 * MB)).toEqual({ start: 10, end: 19 });
    expect(cut({ first: total - 5, last: null }, total, 4 * MB)).toEqual({ start: total - 5, end: total - 1 });
    expect(cut({ first: null, last: 6 * MB }, total, 4 * MB)).toEqual({ start: total - 6 * MB, end: total - 2 * MB - 1 });
    expect(cut({ first: total, last: null }, total, 4 * MB)).toBeNull();
  });
});
