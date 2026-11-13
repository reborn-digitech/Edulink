/**
 * TA-341 of the testing analysis of 13 November 2026: the file route read the whole stored object and hashed it on
 * every request, a revalidation that ends in 304 and every range a video player asks for included; with a bucket that
 * is a full download per request.
 *
 * The store is counted (vi.mock of src/lib/blob-store wraps the real one): a revalidation with the ETag the route gave
 * must read nothing, and a range must ask the store for that range, not the whole object. The bytes live in a scratch
 * directory under the system's temp folder (STORAGE_DIR, no bucket); the file is a scratch ZZ school's logo, which is
 * public, so the read rule is not what is measured. Removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  for (const key of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) delete process.env[key];
  const store = join(tmpdir(), `zz-ta341-store-${Date.now()}`);
  process.env.STORAGE_DIR = store;
  return { store };
});

const counts = vi.hoisted(() => ({ get: 0, range: 0 }));

vi.mock("@/lib/blob-store", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/blob-store")>();
  return {
    ...real,
    blobStore: (ns: Parameters<typeof real.blobStore>[0]) => {
      const store = real.blobStore(ns);
      const counted: typeof store = {
        ...store,
        get: async (name) => {
          counts.get += 1;
          return store.get(name);
        },
      };
      if (store.getRange) {
        const ranged = store.getRange.bind(store);
        counted.getRange = async (name, range) => {
          counts.range += 1;
          return ranged(name, range);
        };
      }
      return counted;
    },
  };
});

import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { nameFor } from "@/lib/storage";
import { GET as fileGet } from "@/app/api/files/[fileId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const FILE = `${randomUUID()}.mp4`;
const BYTES = randomBytes(64 * 1024);
let schoolId = "";

const get = (headers: Record<string, string> = {}) => fileGet(new Request(`http://localhost/api/files/${FILE}`, { headers }), { params: Promise.resolve({ fileId: FILE }) });

beforeAll(async () => {
  const path = join(ENV.store, nameFor(FILE));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, BYTES);
  schoolId = (await db.school.create({ data: { name: `ZZ TA File Route ${STAMP}`, slug: `zz-tawsf-${STAMP}`, code: `ZTWF${String(STAMP).slice(-6)}`, contactEmail: `zz-tawsf-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", logoPath: FILE, isTestFixture: true }, select: { id: true } })).id;
  __resetCookies();
  __setHeaders({});
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
  await rm(ENV.store, { recursive: true, force: true });
});

describe("TA-341: the file route reads only what it answers with", () => {
  it("TA-341: answers a revalidation with the route's own ETag as 304 without reading the object", async () => {
    const first = await get();
    expect(first.status).toBe(200);
    expect(Buffer.from(await first.arrayBuffer()).equals(BYTES)).toBe(true);
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();
    counts.get = 0;
    counts.range = 0;
    const again = await get({ "if-none-match": etag! });
    expect(again.status).toBe(304);
    expect(again.headers.get("etag")).toBe(etag);
    expect(counts.get + counts.range).toBe(0);
  });

  it("TA-341: asks the store for the range a player wants, not the whole object", async () => {
    counts.get = 0;
    counts.range = 0;
    const part = await get({ range: "bytes=100-199" });
    expect(part.status).toBe(206);
    expect(part.headers.get("content-range")).toBe(`bytes 100-199/${BYTES.byteLength}`);
    expect(Buffer.from(await part.arrayBuffer()).equals(BYTES.subarray(100, 200))).toBe(true);
    expect(counts.get).toBe(0);
    expect(counts.range).toBe(1);
    // The tail, an open end, and a range past the end, as before.
    const tail = await get({ range: "bytes=-10" });
    expect(tail.status).toBe(206);
    expect(Buffer.from(await tail.arrayBuffer()).equals(BYTES.subarray(BYTES.byteLength - 10))).toBe(true);
    const open = await get({ range: `bytes=${BYTES.byteLength - 5}-` });
    expect(open.headers.get("content-range")).toBe(`bytes ${BYTES.byteLength - 5}-${BYTES.byteLength - 1}/${BYTES.byteLength}`);
    const past = await get({ range: `bytes=${BYTES.byteLength + 10}-` });
    expect(past.status).toBe(416);
    expect(past.headers.get("content-range")).toBe(`bytes */${BYTES.byteLength}`);
    expect(counts.get).toBe(0);
  });
});
