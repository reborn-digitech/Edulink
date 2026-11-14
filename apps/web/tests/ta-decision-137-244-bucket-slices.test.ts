/**
 * TA-137 and TA-244 of the testing analysis of 13 November 2026, the second guard of the decision of 14 November 2026,
 * over a bucket: a deployed server keeps its uploads in one, and there a range a player leaves open to the end was
 * asked of the bucket as it stood ("bytes=0-"), so the whole of a 100 MB video was downloaded into memory to answer it.
 *
 * A fake S3 lives inside this file, in the manner of tests/storage-s3.test.ts: an HTTP server that answers GET with
 * the Range it is asked, as a bucket does (206 with Content-Range, 416 past the end, the whole object for a range it
 * cannot read), and writes down every range asked and how many bytes it sent. The environment is set before anything
 * is read, and blob-store.ts reads it per call, so nothing here touches ./storage or the database.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { FILE_SLICE_BYTES, nameFor, readStoredRange, streamStoredRange } from "@/lib/storage";

const MB = 1024 * 1024;
const BUCKET = "zz-ta137-bucket";
const FILE = `${randomUUID()}.mp4`;
const BYTES = randomBytes(11 * MB);
const asks: { range: string | undefined; sent: number }[] = [];
let server: Server;
const saved: Record<string, string | undefined> = {};
const VARS = ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY", "STORAGE_S3_PREFIX"];

beforeAll(async () => {
  server = createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://x");
      const key = url.pathname.split("/").slice(2).map(decodeURIComponent).join("/");
      if (req.method !== "GET" || key !== `zz/files/${nameFor(FILE)}`) {
        res.writeHead(404, { "content-type": "application/xml" });
        res.end('<?xml version="1.0"?><Error><Code>NoSuchKey</Code></Error>');
        return;
      }
      const range = req.headers.range;
      const total = BYTES.byteLength;
      const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
      const send = (status: number, body: Buffer, headers: Record<string, string> = {}) => {
        asks.push({ range, sent: body.byteLength });
        res.writeHead(status, { "content-type": "video/mp4", ...headers });
        res.end(body);
      };
      if (!m || (m[1] === "" && m[2] === "")) return send(200, BYTES);
      const start = m[1] !== "" ? Number(m[1]) : Math.max(0, total - Number(m[2]));
      const end = m[1] !== "" && m[2] !== "" ? Math.min(Number(m[2]), total - 1) : total - 1;
      // A range whose end is before its start is one a bucket cannot read: it sends the whole object.
      if (m[1] !== "" && m[2] !== "" && Number(m[2]) < Number(m[1])) return send(200, BYTES);
      if (start >= total) return send(416, Buffer.alloc(0), { "content-range": `bytes */${total}` });
      send(206, BYTES.subarray(start, end + 1), { "content-range": `bytes ${start}-${end}/${total}` });
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  for (const k of VARS) saved[k] = process.env[k];
  process.env.STORAGE_BUCKET = BUCKET;
  process.env.STORAGE_S3_ENDPOINT = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.STORAGE_S3_REGION = "auto";
  process.env.STORAGE_S3_ACCESS_KEY_ID = "ZZTESTKEY";
  process.env.STORAGE_S3_SECRET_ACCESS_KEY = "zz-test-secret";
  process.env.STORAGE_S3_PREFIX = "zz";
});

afterAll(async () => {
  for (const k of VARS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  await new Promise<void>((r) => server.close(() => r()));
});

beforeEach(() => {
  asks.length = 0;
});

const largest = () => Math.max(0, ...asks.map((a) => a.sent));

async function drain(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    expect(value.byteLength).toBeLessThanOrEqual(FILE_SLICE_BYTES);
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

describe("TA-137 / TA-244: a bucket is asked for a slice at a time, never for the rest of a video", () => {
  it("TA-137: a slice of a range left open to the end asks the bucket for that slice and no more", async () => {
    const read = await readStoredRange(FILE, { first: 0, last: null }, FILE_SLICE_BYTES);
    expect(read && "bytes" in read ? { start: read.start, end: read.end, total: read.total, length: read.bytes.byteLength } : read).toEqual({ start: 0, end: FILE_SLICE_BYTES - 1, total: BYTES.byteLength, length: FILE_SLICE_BYTES });
    expect(read && "bytes" in read && read.bytes.equals(BYTES.subarray(0, FILE_SLICE_BYTES))).toBe(true);
    expect(asks).toEqual([{ range: `bytes=0-${FILE_SLICE_BYTES - 1}`, sent: FILE_SLICE_BYTES }]);

    // From the middle, the same; near the end, what is left.
    asks.length = 0;
    const mid = await readStoredRange(FILE, { first: 5 * MB, last: null }, FILE_SLICE_BYTES);
    expect(mid && "bytes" in mid && mid.bytes.equals(BYTES.subarray(5 * MB, 5 * MB + FILE_SLICE_BYTES))).toBe(true);
    const last = await readStoredRange(FILE, { first: BYTES.byteLength - 10, last: null }, FILE_SLICE_BYTES);
    expect(last && "bytes" in last ? { start: last.start, end: last.end } : last).toEqual({ start: BYTES.byteLength - 10, end: BYTES.byteLength - 1 });
    expect(largest()).toBeLessThanOrEqual(FILE_SLICE_BYTES);
  });

  it("TA-137: both ends named further apart than a slice, a long tail, a range past the end and one that names nothing", async () => {
    const long = await readStoredRange(FILE, { first: MB, last: BYTES.byteLength - 1 }, FILE_SLICE_BYTES);
    expect(long && "bytes" in long ? { start: long.start, end: long.end } : long).toEqual({ start: MB, end: MB + FILE_SLICE_BYTES - 1 });
    const short = await readStoredRange(FILE, { first: 100, last: 199 }, FILE_SLICE_BYTES);
    expect(short && "bytes" in short && short.bytes.equals(BYTES.subarray(100, 200))).toBe(true);
    const tail = await readStoredRange(FILE, { first: null, last: 10 }, FILE_SLICE_BYTES);
    expect(tail && "bytes" in tail && tail.bytes.equals(BYTES.subarray(BYTES.byteLength - 10))).toBe(true);
    expect(largest()).toBeLessThanOrEqual(FILE_SLICE_BYTES);

    // A tail longer than a slice: the size is asked first (one byte), then the slice from the tail's start.
    asks.length = 0;
    const longTail = await readStoredRange(FILE, { first: null, last: BYTES.byteLength - 5 }, FILE_SLICE_BYTES);
    expect(longTail && "bytes" in longTail ? { start: longTail.start, end: longTail.end } : longTail).toEqual({ start: 5, end: 5 + FILE_SLICE_BYTES - 1 });
    expect(longTail && "bytes" in longTail && longTail.bytes.equals(BYTES.subarray(5, 5 + FILE_SLICE_BYTES))).toBe(true);
    expect(asks).toEqual([{ range: "bytes=0-0", sent: 1 }, { range: `bytes=5-${5 + FILE_SLICE_BYTES - 1}`, sent: FILE_SLICE_BYTES }]);

    // Past the end, and an end before its start: no bytes, the size for the 416, and the object is not downloaded.
    asks.length = 0;
    expect(await readStoredRange(FILE, { first: BYTES.byteLength + 1, last: null }, FILE_SLICE_BYTES)).toMatchObject({ unsatisfiable: true, total: BYTES.byteLength });
    expect(await readStoredRange(FILE, { first: 500, last: 100 }, FILE_SLICE_BYTES)).toMatchObject({ unsatisfiable: true, total: BYTES.byteLength });
    expect(largest()).toBeLessThanOrEqual(1);
    // A file that is not there.
    expect(await readStoredRange(`${randomUUID()}.mp4`, { first: 0, last: null }, FILE_SLICE_BYTES)).toBeNull();
  });

  it("TA-137: a range is streamed from the bucket slice by slice, each asked only when the reader wants more, to the range's own end", async () => {
    const whole = await streamStoredRange(FILE, { first: 0, last: null });
    if (!whole || "unsatisfiable" in whole) throw new Error("the file was not found in the fake bucket");
    expect({ start: whole.start, end: whole.end, total: whole.total, mime: whole.mime }).toEqual({ start: 0, end: BYTES.byteLength - 1, total: BYTES.byteLength, mime: "video/mp4" });
    // Only the first slice has been asked for before anybody reads.
    expect(asks).toEqual([{ range: `bytes=0-${FILE_SLICE_BYTES - 1}`, sent: FILE_SLICE_BYTES }]);
    expect((await drain(whole.stream)).equals(BYTES)).toBe(true);
    expect(asks.map((a) => a.range)).toEqual([`bytes=0-${FILE_SLICE_BYTES - 1}`, `bytes=${FILE_SLICE_BYTES}-${2 * FILE_SLICE_BYTES - 1}`, `bytes=${2 * FILE_SLICE_BYTES}-${BYTES.byteLength - 1}`]);
    expect(largest()).toBeLessThanOrEqual(FILE_SLICE_BYTES);

    // A range with both ends named stops at its own end, not at the file's.
    asks.length = 0;
    const part = await streamStoredRange(FILE, { first: MB, last: 6 * MB });
    if (!part || "unsatisfiable" in part) throw new Error("the range was not read");
    expect({ start: part.start, end: part.end }).toEqual({ start: MB, end: 6 * MB });
    expect((await drain(part.stream)).equals(BYTES.subarray(MB, 6 * MB + 1))).toBe(true);
    expect(asks.map((a) => a.range)).toEqual([`bytes=${MB}-${MB + FILE_SLICE_BYTES - 1}`, `bytes=${MB + FILE_SLICE_BYTES}-${6 * MB}`]);
    // A tail longer than a slice, a range that names nothing, and a file that is not there.
    const tail = await streamStoredRange(FILE, { first: null, last: BYTES.byteLength - 5 });
    if (!tail || "unsatisfiable" in tail) throw new Error("the tail was not read");
    expect({ start: tail.start, end: tail.end }).toEqual({ start: 5, end: BYTES.byteLength - 1 });
    expect((await drain(tail.stream)).equals(BYTES.subarray(5))).toBe(true);
    expect(await streamStoredRange(FILE, { first: BYTES.byteLength, last: null })).toMatchObject({ unsatisfiable: true, total: BYTES.byteLength });
    expect(await streamStoredRange(`${randomUUID()}.mp4`, { first: 0, last: null })).toBeNull();
    expect(largest()).toBeLessThanOrEqual(FILE_SLICE_BYTES);
  });
});
