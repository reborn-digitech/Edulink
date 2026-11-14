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
 *
 * THE PUBLIC INTERNET ONLY (TA-105): the crawl runs on the machine that holds the database, the dev server and
 * the model servers, so no request goes to a loopback, private, link-local, shared or unique-local address.
 * The client refuses an IP literal in such a range on every request and every redirect hop (redirects are
 * followed here, not in the transport, so each hop waits the gap of its host and passes the caller's robots
 * check), and the machine's transport resolves every name through guardedLookup, which refuses a name whose
 * addresses include such a range at the moment of connecting (so a name cannot be re-pointed between check
 * and connection).
 */
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import type { CrawlRefusal } from "@edulink/contracts";

/** The `lookup` a request's socket resolves its host through (node:net's LookupFunction). */
type LookupFunction = NonNullable<http.RequestOptions["lookup"]>;

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

export const MAX_REDIRECTS = 5;

/** A request the crawler will not make, with the refusal the source's line records. */
export class CrawlRefused extends Error {
  constructor(
    message: string,
    readonly refusal: CrawlRefusal,
  ) {
    super(message);
    this.name = "CrawlRefused";
  }
}

/** An IPv6 address as eight 16-bit groups, or null. Takes an embedded dotted IPv4 tail (::ffff:1.2.3.4). */
function v6Groups(addr: string): number[] | null {
  let s = addr.toLowerCase();
  const tail = s.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (tail) {
    const [a, b, c, d] = tail.slice(1).map(Number) as [number, number, number, number];
    s = `${s.slice(0, tail.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const part = (h: string) => (h ? h.split(":").map((g) => parseInt(g, 16)) : []);
  const head = part(halves[0]!);
  const rest = halves.length === 2 ? part(halves[1]!) : [];
  const groups = halves.length === 2 ? [...head, ...new Array<number>(8 - head.length - rest.length).fill(0), ...rest] : head;
  return groups.length === 8 && groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

function privateV4(addr: string): boolean {
  const [a, b] = addr.split(".").map(Number) as [number, number];
  return (
    a === 0 || // "this network"
    a === 10 ||
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // shared address space (carrier NAT)
    (a === 169 && b === 254) || // link-local, the cloud metadata address
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && Number(addr.split(".")[2]) === 0) || // IETF protocol assignments
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast, reserved, broadcast
  );
}

/**
 * Whether an address (as a resolver answers it, or a URL's host without brackets) is one the crawler must not
 * reach: loopback, private, link-local, shared, unique-local, multicast or unspecified, IPv4 or IPv6, including
 * an IPv4 address carried in IPv6 (::ffff:a.b.c.d, 64:ff9b::/96). Anything that is not an address is false.
 */
export function isPrivateAddress(raw: string): boolean {
  const addr = raw.replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const kind = isIP(addr);
  if (kind === 4) return privateV4(addr);
  if (kind !== 6) return false;
  const g = v6Groups(addr);
  if (!g) return true;
  const v4Of = (hi: number, lo: number) => `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return privateV4(v4Of(g[6]!, g[7]!)); // ::ffff:a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return privateV4(v4Of(g[6]!, g[7]!)); // NAT64
  if (g.slice(0, 6).every((x) => x === 0)) return true; // ::, ::1 and the old IPv4-compatible form
  return (g[0]! & 0xffc0) === 0xfe80 || (g[0]! & 0xfe00) === 0xfc00 || (g[0]! & 0xff00) === 0xff00; // link-local, unique-local, multicast
}

/** Throws CrawlRefused for a URL the client must not request: not http(s), or a host that is a private address. */
export function refuseTarget(url: string): void {
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new CrawlRefused(`refused: ${u.protocol} is not a web address`, "UNREACHABLE");
  if (isPrivateAddress(u.hostname)) throw new CrawlRefused(`refused: ${u.hostname} is a private or local address`, "UNREACHABLE");
}

type Resolved = { address: string; family: number };
const systemResolve = (host: string): Promise<Resolved[]> => dns.promises.lookup(host, { all: true, verbatim: true });

/**
 * The lookup the machine's sockets connect through: every address the name resolves to is checked, and a name
 * with any private one (or none) is refused before a connection is opened. The resolver is injectable for the
 * suites.
 */
export function guardedLookup(resolve: (host: string) => Promise<Resolved[]> = systemResolve): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname).then(
      (list) => {
        const bad = list.find((a) => isPrivateAddress(a.address));
        if (bad || list.length === 0) {
          callback(new CrawlRefused(`refused: ${hostname} resolves to ${bad ? "a private or local address" : "no address"}`, "UNREACHABLE"), "", undefined);
          return;
        }
        if (options.all) callback(null, list.map((a) => ({ address: a.address, family: a.family })));
        else callback(null, list[0]!.address, list[0]!.family);
      },
      (error: NodeJS.ErrnoException) => callback(error, "", undefined),
    );
  };
}

/**
 * One GET on node:http(s), the body read up to the cap. A redirect is answered as it came (its Location in the
 * headers) and followed by PoliteClient, which checks each hop (TA-105). Names resolve through guardedLookup.
 */
export function nodeTransport(timeoutMs = 45_000, maxBytes = MAX_PAGE_BYTES): Transport {
  const lookup = guardedLookup();
  const once = (url: string, headers: Record<string, string>): Promise<HttpAnswer> =>
    new Promise((resolve, reject) => {
      const target = new URL(url);
      const lib = target.protocol === "http:" ? http : https;
      const req = lib.request(target, { method: "GET", headers, timeout: timeoutMs, lookup }, (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && status !== 304 && location) {
          res.resume();
          return resolve({ status, url, headers: { location, "content-type": header(res.headers, "content-type") }, body: Buffer.alloc(0), truncated: false });
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
  return (url, headers) => once(url, headers);
}

export type ClientDeps = {
  transport: Transport;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  gapMs?: number;
};

export type Conditional = { etag?: string | null; lastModified?: string | null };

/** What a redirect hop must pass besides the address rule: the caller's robots.txt for the hop's site (TA-105). */
export type HopCheck = { allowed?: (to: URL) => Promise<boolean> };

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

  /**
   * A GET, following up to five redirects itself: every request and every hop is refused if it is not http(s)
   * or names a private address, a hop must pass `hop.allowed` (the caller's robots.txt), and each hop queues
   * behind its own host's gap. The conditional headers go with the first request only.
   */
  async get(url: string, conditional: Conditional = {}, hop: HopCheck = {}): Promise<HttpAnswer> {
    let current = url;
    for (let redirects = 0; ; redirects += 1) {
      refuseTarget(current);
      const answer = await this.once(current, redirects === 0 ? conditional : {});
      const location = answer.headers.location;
      if (!(answer.status >= 300 && answer.status < 400 && answer.status !== 304 && location)) return answer;
      if (redirects >= MAX_REDIRECTS) throw new Error("too many redirects");
      const next = new URL(location, current);
      refuseTarget(next.toString());
      if (hop.allowed && !(await hop.allowed(next))) throw new CrawlRefused(`refused: robots.txt disallows the redirect to ${next.host}${next.pathname}`, "ROBOTS");
      current = next.toString();
    }
  }

  private async once(url: string, conditional: Conditional): Promise<HttpAnswer> {
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
