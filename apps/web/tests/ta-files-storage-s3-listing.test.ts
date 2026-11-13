/**
 * TA-586 (testing analysis of 13 November 2026, Low): a bucket listing entry with no LastModified, or
 * one that does not parse, was read as 1 January 1970 (src/lib/s3.ts), so the reclaim took an upload
 * made a minute ago and not yet attached for an old orphan, past its one-hour grace.
 *
 * A fake bucket lives inside this file: an HTTP server answering ListObjectsV2 with two unreferenced
 * originals, one listed without LastModified and one with "garbage" in it. The reclaim runs as a DRY
 * RUN (it reads which files the database references and deletes nothing); nothing touches ./storage.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";

const BUCKET = "zz-tafs-bucket";
const NO_STAMP = `${randomUUID()}.png`;
const GARBAGE = `${randomUUID()}.png`;
const OLD = `${randomUUID()}.png`;
const listed = [
  `<Contents><Key>edulink/files/${NO_STAMP.slice(0, 2)}/${NO_STAMP}</Key><Size>48</Size></Contents>`,
  `<Contents><Key>edulink/files/${GARBAGE.slice(0, 2)}/${GARBAGE}</Key><LastModified>garbage</LastModified><Size>48</Size></Contents>`,
  `<Contents><Key>edulink/files/${OLD.slice(0, 2)}/${OLD}</Key><LastModified>2026-11-01T00:00:00.000Z</LastModified><Size>48</Size></Contents>`,
];
let server: Server;

beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    if (req.method === "GET" && url.searchParams.get("list-type") === "2") {
      const files = (url.searchParams.get("prefix") ?? "").endsWith("files/");
      res.writeHead(200, { "content-type": "application/xml" });
      res.end(`<?xml version="1.0"?><ListBucketResult><IsTruncated>false</IsTruncated>${files ? listed.join("") : ""}</ListBucketResult>`);
      return;
    }
    res.writeHead(405);
    res.end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  process.env.STORAGE_BUCKET = BUCKET;
  process.env.STORAGE_S3_ENDPOINT = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.STORAGE_S3_REGION = "auto";
  process.env.STORAGE_S3_ACCESS_KEY_ID = "ZZTESTKEY";
  process.env.STORAGE_S3_SECRET_ACCESS_KEY = "zz-test-secret";
  process.env.STORAGE_S3_PREFIX = "edulink";
});

afterAll(async () => {
  for (const k of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY", "STORAGE_S3_PREFIX"]) delete process.env[k];
  await new Promise<void>((r) => server.close(() => r()));
});

describe("TA-586: an unreadable LastModified is recent, not 1970", () => {
  it("TA-586: the bucket's listing dates a missing or unparseable LastModified to now", async () => {
    const { blobStore } = await import("@/lib/blob-store");
    const before = Date.now();
    const seen = new Map<string, Date>();
    for await (const object of blobStore("files").list()) seen.set(object.name.split("/").pop()!, object.modifiedAt);
    expect([...seen.keys()].sort()).toEqual([NO_STAMP, GARBAGE, OLD].sort());
    for (const id of [NO_STAMP, GARBAGE]) expect(seen.get(id)!.getTime(), id).toBeGreaterThanOrEqual(before);
    expect(seen.get(OLD)!.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("TA-586: the reclaim skips both as recent and still finds the dated old orphan", async () => {
    const { reclaimOrphans } = await import("@/lib/orphans");
    const report = await reclaimOrphans({ dryRun: true, graceMs: 3600_000 });
    expect(report.orphans.map((o) => o.fileId)).toEqual([OLD]);
    expect(report.skippedRecent).toBe(2);
    expect(report.deleted).toEqual([]);
  }, 60_000);
});
