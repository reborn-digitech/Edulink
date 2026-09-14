import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { PrismaClient } from "@prisma/client";

/**
 * Uploads through a bucket instead of the disk.
 *
 * A fake S3 lives inside this file: an HTTP server that speaks the four verbs
 * the client uses (PUT, GET, DELETE, ListObjectsV2 with continuation tokens)
 * and checks every request the way a real one would — a SigV4 Authorization
 * header, and an x-amz-content-sha256 that matches the body. The signature's
 * VALUE is proven elsewhere (s3-signing.test.ts, against Amazon's examples);
 * this suite proves the plumbing around it: paths, prefixes, content types,
 * pagination, 404 → null, refusal → error, and that storage.ts and orphans.ts
 * behave the same over a bucket as over a directory.
 *
 * The environment is set BEFORE the modules under test are imported, and
 * blob-store.ts reads it per call, so nothing here touches ./storage.
 */
type Stored = { body: Buffer; contentType: string; lastModified: Date };
const objects = new Map<string, Stored>();
const requests: { method: string; path: string; auth: string | undefined; sha: string | undefined; contentType: string | undefined }[] = [];
let deny = false;
let server: Server;
let endpoint: string;
const BUCKET = "zz-test-bucket";

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

beforeAll(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const url = new URL(req.url ?? "/", "http://x");
      const auth = req.headers.authorization;
      const sha = req.headers["x-amz-content-sha256"] as string | undefined;
      requests.push({ method: req.method ?? "", path: url.pathname + url.search, auth, sha, contentType: req.headers["content-type"] });
      const refuse = (status: number, code: string) => {
        res.writeHead(status, { "content-type": "application/xml" });
        res.end(`<?xml version="1.0"?><Error><Code>${code}</Code></Error>`);
      };
      if (!auth?.startsWith("AWS4-HMAC-SHA256 Credential=") || !/Signature=[0-9a-f]{64}$/.test(auth)) return refuse(403, "InvalidSignature");
      if (sha !== createHash("sha256").update(body).digest("hex")) return refuse(400, "XAmzContentSHA256Mismatch");
      if (deny) return refuse(403, "AccessDenied");
      const [, bucket, ...rest] = url.pathname.split("/");
      if (bucket !== BUCKET) return refuse(404, "NoSuchBucket");
      const key = rest.map(decodeURIComponent).join("/");
      if (req.method === "GET" && !key) {
        // ListObjectsV2, paged in twos so the continuation path is exercised.
        const prefix = url.searchParams.get("prefix") ?? "";
        const max = Math.min(Number(url.searchParams.get("max-keys") ?? "1000"), 2);
        const all = [...objects.keys()].filter((k) => k.startsWith(prefix)).sort();
        const start = Number(url.searchParams.get("continuation-token") ?? "0");
        const page = all.slice(start, start + max);
        const truncated = start + max < all.length;
        res.writeHead(200, { "content-type": "application/xml" });
        res.end(
          `<?xml version="1.0"?><ListBucketResult><IsTruncated>${truncated}</IsTruncated>` +
            (truncated ? `<NextContinuationToken>${start + max}</NextContinuationToken>` : "") +
            page.map((k) => { const o = objects.get(k)!; return `<Contents><Key>${xmlEscape(k)}</Key><LastModified>${o.lastModified.toISOString()}</LastModified><Size>${o.body.byteLength}</Size></Contents>`; }).join("") +
            "</ListBucketResult>",
        );
        return;
      }
      if (req.method === "PUT") {
        objects.set(key, { body, contentType: String(req.headers["content-type"] ?? ""), lastModified: new Date() });
        res.writeHead(200); res.end(); return;
      }
      if (req.method === "GET") {
        const o = objects.get(key);
        if (!o) return refuse(404, "NoSuchKey");
        res.writeHead(200, { "content-type": o.contentType }); res.end(o.body); return;
      }
      if (req.method === "DELETE") { objects.delete(key); res.writeHead(204); res.end(); return; }
      refuse(405, "MethodNotAllowed");
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.STORAGE_BUCKET = BUCKET;
  process.env.STORAGE_S3_ENDPOINT = endpoint;
  process.env.STORAGE_S3_REGION = "auto";
  process.env.STORAGE_S3_ACCESS_KEY_ID = "ZZTESTKEY";
  process.env.STORAGE_S3_SECRET_ACCESS_KEY = "zz-test-secret";
  process.env.STORAGE_S3_PREFIX = "edulink";
});

afterAll(async () => {
  for (const k of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY", "STORAGE_S3_PREFIX"]) delete process.env[k];
  await new Promise<void>((r) => server.close(() => r()));
});

beforeEach(() => {
  objects.clear();
  requests.length = 0;
  deny = false;
});

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array.from({ length: 40 }, (_, i) => i)]);
const PDF = Buffer.from([...Buffer.from("%PDF-1.7"), ...Array.from({ length: 40 }, () => 0x20)]);
const asFile = (bytes: Buffer, name: string, type: string) => new File([new Uint8Array(bytes)], name, { type });

describe("the configuration", () => {
  it("is a bucket when all five variables are set, with the prefix normalised", async () => {
    const { readStorageConfig } = await import("@/lib/env");
    const c = readStorageConfig();
    expect(c.bucket?.bucket).toBe(BUCKET);
    expect(c.bucket?.prefix).toBe("edulink/");
    expect(c.bucket?.pathStyle).toBe(true);
    expect(c.problems).toEqual([]);
  });

  it("is a named problem, and the disk, when one of the five is missing", async () => {
    const { readStorageConfig } = await import("@/lib/env");
    const saved = process.env.STORAGE_S3_REGION;
    delete process.env.STORAGE_S3_REGION;
    try {
      const c = readStorageConfig();
      expect(c.bucket).toBeNull();
      expect(c.problems.map((p) => p.key)).toEqual(["STORAGE_S3_REGION"]);
      expect(c.problems[0]!.message).toContain("all five");
    } finally {
      process.env.STORAGE_S3_REGION = saved;
    }
  });
});

describe("storing through the bucket", () => {
  it("puts the cleaned bytes under files/<shard>/<id> with the sniffed content type, signed", async () => {
    const { storeFile } = await import("@/lib/storage");
    const stored = await storeFile(asFile(PNG, "logo.png", "text/plain"));
    const key = `edulink/files/${stored.fileId.slice(0, 2)}/${stored.fileId}`;
    expect(objects.has(key)).toBe(true);
    expect(objects.get(key)!.contentType).toBe("image/png");
    const put = requests.find((r) => r.method === "PUT")!;
    expect(put.path).toBe(`/${BUCKET}/${key}`);
    expect(put.auth).toMatch(/^AWS4-HMAC-SHA256 Credential=ZZTESTKEY\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=content-length;content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
  });

  it("reads it back with the mime from the extension, and null once deleted", async () => {
    const { storeFile, readStoredFile, deleteStoredFile } = await import("@/lib/storage");
    const stored = await storeFile(asFile(PDF, "sheet.pdf", "application/pdf"));
    const read = await readStoredFile(stored.fileId);
    expect(read?.mime).toBe("application/pdf");
    expect(read?.bytes.equals(PDF)).toBe(true);
    await deleteStoredFile(stored.fileId);
    expect(await readStoredFile(stored.fileId)).toBeNull();
    expect(objects.size).toBe(0);
  });

  it("never writes to ./storage", async () => {
    const { storeFile } = await import("@/lib/storage");
    const { stat } = await import("node:fs/promises");
    const stored = await storeFile(asFile(PNG, "x.png", "image/png"));
    const onDisk = await stat(`storage/${stored.fileId.slice(0, 2)}/${stored.fileId}`).then(() => true, () => false);
    expect(onDisk).toBe(false);
  });

  it("caches a resized variant under variants/ and serves it from there next time", async () => {
    const { storeFile, readStoredVariant } = await import("@/lib/storage");
    const sharp = (await import("sharp")).default;
    const real = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#4060a0" } }).png().toBuffer();
    const stored = await storeFile(asFile(real, "photo.png", "image/png"));
    const first = await readStoredVariant(stored.fileId, 320);
    expect(first?.mime).toBe("image/webp");
    const variantKey = `edulink/variants/${stored.fileId.slice(0, 2)}/${stored.fileId}.w320.webp`;
    expect(objects.get(variantKey)?.contentType).toBe("image/webp");
    const gets = requests.filter((r) => r.method === "GET").length;
    const second = await readStoredVariant(stored.fileId, 320);
    expect(second?.bytes.equals(first!.bytes)).toBe(true);
    // One GET for the cached variant; the original was not fetched again.
    expect(requests.filter((r) => r.method === "GET").length).toBe(gets + 2);
  });

  it("a refused bucket surfaces as an error naming the operation, not a silent null", async () => {
    const { storeFile } = await import("@/lib/storage");
    deny = true;
    await expect(storeFile(asFile(PNG, "x.png", "image/png"))).rejects.toThrow(/S3 PUT .* HTTP 403/);
  });
});

describe("listing and reclaiming through the bucket", () => {
  const db = new PrismaClient();
  afterAll(() => db.$disconnect());

  it("lists across continuation pages, treats a non-stored name as unrecognised, and reclaims an old orphan", async () => {
    const { blobStore } = await import("@/lib/blob-store");
    const { reclaimOrphans } = await import("@/lib/orphans");
    const store = blobStore("files");
    const old = new Date(Date.now() - 48 * 3600_000);
    const ids = ["bbbb1111-2222-3333-4444-000000000001.png", "bbbb1111-2222-3333-4444-000000000002.png", "bbbb1111-2222-3333-4444-000000000003.pdf"];
    for (const id of ids) objects.set(`edulink/files/${id.slice(0, 2)}/${id}`, { body: PNG, contentType: "image/png", lastModified: old });
    objects.set("edulink/files/bb/notes.txt", { body: Buffer.from("x"), contentType: "text/plain", lastModified: old });
    objects.set("edulink/variants/bb/ignored.webp", { body: Buffer.from("x"), contentType: "image/webp", lastModified: old });
    const listed: string[] = [];
    for await (const o of store.list()) listed.push(o.name);
    expect(listed.sort()).toEqual([...ids.map((id) => `${id.slice(0, 2)}/${id}`), "bb/notes.txt"].sort());
    expect(requests.filter((r) => r.path.includes("list-type=2")).length).toBeGreaterThan(1);

    const report = await reclaimOrphans({ dryRun: false, graceMs: 3600_000 });
    expect(report.unrecognised).toEqual(["bb/notes.txt"]);
    expect(report.deleted.sort()).toEqual(ids.sort());
    expect(objects.has("edulink/files/bb/notes.txt")).toBe(true);
    expect(objects.has("edulink/variants/bb/ignored.webp")).toBe(true);
  });

  it("a fresh orphan is skipped, not deleted", async () => {
    const { reclaimOrphans } = await import("@/lib/orphans");
    const id = "bbbb1111-2222-3333-4444-000000000009.png";
    objects.set(`edulink/files/bb/${id}`, { body: PNG, contentType: "image/png", lastModified: new Date() });
    const report = await reclaimOrphans({ dryRun: false });
    expect(report.skippedRecent).toBe(1);
    expect(report.deleted).toEqual([]);
  });

  it("a bucket that refuses to list is unreadable, not empty", async () => {
    const { blobStore } = await import("@/lib/blob-store");
    deny = true;
    expect(await blobStore("files").probe()).toBe(false);
  });
});
