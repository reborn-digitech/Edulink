import { createHash, createHmac } from "node:crypto";

/**
 * A minimal S3 client: PUT, GET, DELETE, ListObjectsV2, and a probe. Signature
 * Version 4 by hand over `fetch`, the way `sms.ts` talks to Twilio and `sso.ts`
 * to the providers — no SDK, because the SDK is forty packages for four verbs
 * and every one of them is on the dependency audit.
 *
 * Works against anything that speaks the S3 API with SigV4: AWS S3, Cloudflare
 * R2 (region "auto"), Backblaze B2, MinIO. Path-style addressing by default
 * (`https://endpoint/bucket/key`), which every one of those accepts; virtual
 * hosted (`https://bucket.endpoint/key`) when `pathStyle` is false.
 *
 * `signRequest` is exported on its own so the signature can be checked against
 * the worked examples in Amazon's documentation — the only way to know a
 * signer is right without a bucket to try it on.
 */

export type S3Config = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  pathStyle: boolean;
};

export type S3Object = { key: string; size: number; lastModified: Date };

export const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const sha256 = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const hmac = (key: string | Buffer, data: string) => createHmac("sha256", key).update(data).digest();

/** RFC 3986, which is stricter than encodeURIComponent about `!'()*`. */
export function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** A key's path: each segment encoded, the slashes kept. */
function canonicalPath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => encodeRfc3986(decodeURIComponent(segment)))
    .join("/");
}

function canonicalQuery(url: URL): string {
  const pairs: [string, string][] = [];
  url.searchParams.forEach((value, key) => pairs.push([encodeRfc3986(key), encodeRfc3986(value)]));
  pairs.sort(([a, av], [b, bv]) => (a < b ? -1 : a > b ? 1 : av < bv ? -1 : av > bv ? 1 : 0));
  return pairs.map(([k, v]) => `${k}=${v}`).join("&");
}

function amzDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export type SignInput = {
  method: string;
  url: URL;
  /** Extra headers to send and sign; host, x-amz-date and x-amz-content-sha256 are added. */
  headers?: Record<string, string>;
  payloadHash: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  date?: Date;
};

/** The headers to send, Authorization included. Lower-case names, as fetch sends them. */
export function signRequest(input: SignInput): Record<string, string> {
  const date = input.date ?? new Date();
  const stamp = amzDate(date);
  const day = stamp.slice(0, 8);
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.headers ?? {})) headers[k.toLowerCase()] = v.trim().replace(/\s+/g, " ");
  headers.host = input.url.host;
  headers["x-amz-date"] = stamp;
  headers["x-amz-content-sha256"] = input.payloadHash;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k}:${headers[k]}\n`)
    .join("");
  const canonicalRequest = [
    input.method.toUpperCase(),
    canonicalPath(input.url.pathname),
    canonicalQuery(input.url),
    canonicalHeaders,
    signedHeaders,
    input.payloadHash,
  ].join("\n");

  const scope = `${day}/${input.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", stamp, scope, sha256(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${input.secretAccessKey}`, day);
  const kRegion = hmac(kDate, input.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  headers.authorization = `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return headers;
}

export class S3Error extends Error {
  constructor(
    readonly status: number,
    readonly op: string,
    readonly key: string,
    body: string,
  ) {
    // The first line of the body is enough to say which of S3's errors it was; never the request that caused it.
    super(`S3 ${op} ${key}: HTTP ${status} ${body.replace(/\s+/g, " ").slice(0, 160)}`);
    this.name = "S3Error";
  }
}

const REQUEST_TIMEOUT_MS = 120_000;

export class S3Client {
  constructor(private readonly config: S3Config) {}

  private url(key: string, query?: Record<string, string>): URL {
    const base = new URL(this.config.endpoint);
    const encodedKey = key
      .split("/")
      .map((s) => encodeRfc3986(s))
      .join("/");
    const path = this.config.pathStyle ? `/${this.config.bucket}${key ? `/${encodedKey}` : ""}` : `/${encodedKey}`;
    const url = new URL(path, base);
    if (!this.config.pathStyle) url.host = `${this.config.bucket}.${base.host}`;
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    return url;
  }

  private async send(method: string, key: string, opts: { query?: Record<string, string>; body?: Uint8Array; headers?: Record<string, string> } = {}): Promise<Response> {
    const url = this.url(key, opts.query);
    const payloadHash = opts.body ? sha256(opts.body) : EMPTY_SHA256;
    const headers = signRequest({
      method,
      url,
      headers: opts.headers,
      payloadHash,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      region: this.config.region,
    });
    return fetch(url, {
      method,
      headers,
      body: opts.body ? new Uint8Array(opts.body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    const res = await this.send("PUT", key, { body: bytes, headers: { "content-type": contentType, "content-length": String(bytes.byteLength) } });
    if (!res.ok) throw new S3Error(res.status, "PUT", key, await res.text().catch(() => ""));
  }

  /** null for a key that is not there; anything else that is not 2xx throws. */
  async get(key: string): Promise<Buffer | null> {
    const res = await this.send("GET", key);
    if (res.status === 404) return null;
    if (!res.ok) throw new S3Error(res.status, "GET", key, await res.text().catch(() => ""));
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * TA-341: a GET with a Range header (`bytes=…`), so a player's range is not a download of the whole object. The bytes
   * sent with where they start and end and the object's size (from Content-Range); a 416 is no bytes with the size; a
   * bucket that ignored the range answers the whole object. null for a key that is not there.
   */
  async getRange(key: string, range: string): Promise<{ bytes: Buffer; start: number; end: number; total: number } | null> {
    const res = await this.send("GET", key, { headers: { range } });
    if (res.status === 404) return null;
    const contentRange = res.headers.get("content-range") ?? "";
    if (res.status === 416) {
      const total = Number(/\/(\d+)$/.exec(contentRange)?.[1]);
      await res.arrayBuffer().catch(() => null);
      if (Number.isFinite(total)) return { bytes: Buffer.alloc(0), start: -1, end: -1, total };
      const whole = await this.get(key);
      return whole ? { bytes: whole, start: 0, end: whole.byteLength - 1, total: whole.byteLength } : null;
    }
    if (!res.ok) throw new S3Error(res.status, "GET", key, await res.text().catch(() => ""));
    const bytes = Buffer.from(await res.arrayBuffer());
    const parts = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(contentRange);
    if (res.status === 206) {
      if (parts) return { bytes, start: Number(parts[1]), end: Number(parts[2]), total: Number(parts[3]) };
      // A part with no size said: the whole object, once.
      const whole = await this.get(key);
      return whole ? { bytes: whole, start: 0, end: whole.byteLength - 1, total: whole.byteLength } : null;
    }
    // A 200: the bucket sent the whole object.
    return { bytes, start: 0, end: bytes.byteLength - 1, total: bytes.byteLength };
  }

  async delete(key: string): Promise<void> {
    const res = await this.send("DELETE", key);
    // S3 answers 204 whether or not the key existed; anything else is a real refusal.
    if (!res.ok && res.status !== 404) throw new S3Error(res.status, "DELETE", key, await res.text().catch(() => ""));
  }

  /** Every object under the prefix, following continuation tokens. */
  async *list(prefix: string): AsyncGenerator<S3Object> {
    let token: string | null = null;
    do {
      const query: Record<string, string> = { "list-type": "2", prefix, "max-keys": "1000" };
      if (token) query["continuation-token"] = token;
      const res: Response = await this.send("GET", "", { query });
      const xml = await res.text();
      if (!res.ok) throw new S3Error(res.status, "LIST", prefix, xml);
      for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
        const block = m[1]!;
        const key = unescapeXml(block.match(/<Key>([\s\S]*?)<\/Key>/)?.[1] ?? "");
        const size = Number(block.match(/<Size>(\d+)<\/Size>/)?.[1] ?? "0");
        // A listing with no LastModified, or one that does not parse, is taken as written just now, never as 1970
        // (TA-586): the reclaim's one-hour grace is all that keeps an upload not yet attached from being deleted.
        const stamped = new Date(block.match(/<LastModified>([^<]*)<\/LastModified>/)?.[1] ?? Number.NaN);
        const lastModified = Number.isNaN(stamped.getTime()) ? new Date() : stamped;
        if (key) yield { key, size, lastModified };
      }
      const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
      token = truncated ? unescapeXml(xml.match(/<NextContinuationToken>([^<]*)<\/NextContinuationToken>/)?.[1] ?? "") || null : null;
    } while (token);
  }

  /** Can this configuration list the bucket at all? A wrong key, region or bucket answers no. */
  async probe(prefix: string): Promise<boolean> {
    try {
      const res = await this.send("GET", "", { query: { "list-type": "2", prefix, "max-keys": "1" } });
      return res.ok;
    } catch {
      return false;
    }
  }
}

function unescapeXml(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
