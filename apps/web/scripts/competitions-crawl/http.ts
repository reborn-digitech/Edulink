/**
 * The crawler's HTTP, polite by construction (the corpus fetcher's rules, scripts/corpus-fetch.ts):
 * ONE REQUEST AT A TIME PER HOST with a gap of at least one second between the end of one and the start
 * of the next (more when the site's robots.txt asks a Crawl-delay), a User-Agent that names the platform
 * and what it is doing, conditional requests (If-None-Match, If-Modified-Since) so an unchanged page
 * costs the site a 304, and a size cap. GET only: no form is ever posted, no cookie kept, no login tried.
 *
 * Node's own sockets rather than fetch, as the corpus fetcher learned (a government server closing a
 * socket early killed undici's parser past any try/catch). The transport is injectable so the suites
 * prove the politeness without the network.
 */
import http from "node:http";
import https from "node:https";

export const CRAWL_GAP_MS = 1_000;
export const MAX_PAGE_BYTES = 8 * 1024 * 1024;
const CONTACT = process.env.CRAWLER_CONTACT?.trim() || process.env.CORPUS_CONTACT?.trim() || "";
export const USER_AGENT = `Shalaghar-competitions/1.0 (school platform's competitions listing; reads organisers' public pages; one request at a time${CONTACT ? `; ${CONTACT}` : ""})`;

export type HttpAnswer = {
  status: number;
  /** The URL that answered, after redirects. */
  url: string;
  headers: Record<string, string | undefined>;
  body: Buffer;
  /** The body was cut at the size cap. */
  truncated: boolean;
};

export type Transport = (url: string, headers: Record<string, string>) => Promise<HttpAnswer>;

const header = (h: http.IncomingHttpHeaders, name: string): string | undefined => {
  const v = h[name];
  return Array.isArray(v) ? v.join(", ") : v;
};

/** One GET on node:http(s), following up to five redirects, the body read up to the cap. */
export function nodeTransport(timeoutMs = 45_000, maxBytes = MAX_PAGE_BYTES): Transport {
  const once = (url: string, headers: Record<string, string>, redirects: number): Promise<HttpAnswer> =>
    new Promise((resolve, reject) => {
      const target = new URL(url);
      const lib = target.protocol === "http:" ? http : https;
      const req = lib.request(target, { method: "GET", headers, timeout: timeoutMs }, (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && status !== 304 && location) {
          res.resume();
          if (redirects >= 5) return reject(new Error("too many redirects"));
          return once(new URL(location, url).toString(), headers, redirects + 1).then(resolve, reject);
        }
        const parts: Buffer[] = [];
        let size = 0;
        let truncated = false;
        res.on("data", (chunk: Buffer) => {
          if (truncated) return;
          size += chunk.length;
          if (size > maxBytes) {
            truncated = true;
            parts.push(chunk.subarray(0, Math.max(0, chunk.length - (size - maxBytes))));
            res.destroy();
            resolve({ status, url, headers: { etag: header(res.headers, "etag"), "last-modified": header(res.headers, "last-modified"), "content-type": header(res.headers, "content-type") }, body: Buffer.concat(parts), truncated: true });
            return;
          }
          parts.push(chunk);
        });
        res.on("end", () => {
          if (truncated) return;
          resolve({ status, url, headers: { etag: header(res.headers, "etag"), "last-modified": header(res.headers, "last-modified"), "content-type": header(res.headers, "content-type") }, body: Buffer.concat(parts), truncated: false });
        });
        res.on("error", (e) => (truncated ? undefined : reject(e)));
      });
      req.on("timeout", () => req.destroy(Object.assign(new Error("timed out"), { name: "TimeoutError" })));
      req.on("error", reject);
      req.end();
    });
  return (url, headers) => once(url, headers, 0);
}

export type ClientDeps = {
  transport: Transport;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  gapMs?: number;
};

export type Conditional = { etag?: string | null; lastModified?: string | null };

/**
 * The polite client: requests to one host queue behind each other; each starts no sooner than the gap
 * after the previous one to that host ended. Different hosts do not wait for each other (the crawler
 * reads one source at a time anyway).
 */
export class PoliteClient {
  private readonly chains = new Map<string, Promise<void>>();
  private readonly lastEnd = new Map<string, number>();
  private readonly delays = new Map<string, number>();
  /** Every request as it started: host and time. The suites read it. */
  readonly log: { host: string; url: string; at: number }[] = [];

  constructor(private readonly deps: ClientDeps) {}

  /** A site's robots.txt asked for more than the gap. */
  setDelay(host: string, ms: number): void {
    this.delays.set(host, ms);
  }

  async get(url: string, conditional: Conditional = {}): Promise<HttpAnswer> {
    const host = new URL(url).host;
    const before = this.chains.get(host) ?? Promise.resolve();
    let release!: () => void;
    const mine = new Promise<void>((r) => (release = r));
    this.chains.set(host, before.then(() => mine));
    await before;
    try {
      const gap = Math.max(this.deps.gapMs ?? CRAWL_GAP_MS, this.delays.get(host) ?? 0);
      const wait = (this.lastEnd.get(host) ?? -Infinity) + gap - this.deps.now();
      if (wait > 0) await this.deps.sleep(wait);
      const headers: Record<string, string> = { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,text/plain;q=0.8,*/*;q=0.5" };
      if (conditional.etag) headers["If-None-Match"] = conditional.etag;
      if (conditional.lastModified) headers["If-Modified-Since"] = conditional.lastModified;
      this.log.push({ host, url, at: this.deps.now() });
      return await this.deps.transport(url, headers);
    } finally {
      this.lastEnd.set(host, this.deps.now());
      release();
    }
  }
}

export function machineClient(): PoliteClient {
  return new PoliteClient({ transport: nodeTransport(), now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) });
}
