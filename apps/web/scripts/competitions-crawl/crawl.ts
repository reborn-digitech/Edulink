/**
 * ONE SOURCE, CRAWLED (competitions-crawler, 12 October 2026). Its robots.txt first; then its root page
 * and the pages the root links to ONE LEVEL DOWN ON THE SAME HOST, at most forty pages in all, one
 * request at a time with the gap (scripts/competitions-crawl/http.ts). Every page is cached by URL with
 * its SHA-256 and the server's validators (CompetitionCrawlPage), and asked for again conditionally: a 304,
 * or the same bytes, is a cached hit and is not read again. Only a page that is new or changed is handed
 * on (`onPage`) for extraction; its hash is stored only once that succeeded, so a page whose extraction
 * failed is read again next time.
 *
 * REFUSED, NEVER WORKED AROUND: a robots.txt that disallows the page (or that could not be read: a 5xx or
 * no answer disallows the whole site for this crawl), a page that asks for a password, a page whose words
 * a script draws, a file too large, a type that is neither a page nor a PDF. A root page refused refuses
 * the source, with the reason, as the corpus fetcher records a site that would not answer.
 */
import { createHash } from "node:crypto";
import type { CrawlRefusal } from "@edulink/contracts";
import { ALLOW_ALL, DISALLOW_ALL, looksLikeRobots, parseRobots, type Robots } from "./robots";
import type { HttpAnswer, PoliteClient } from "./http";
import { htmlToText, linksOf, needsLogin, pdfToText, renderedByScript, worthReading } from "./text";

export const MAX_PAGES_PER_SOURCE = 40;

export type CachedPage = { url: string; etag: string | null; lastModified: string | null; sha256: string | null; links: string[]; status: number; refused: string | null };
export type PageCache = {
  get(url: string): Promise<CachedPage | null>;
  put(sourceId: string, page: CachedPage & { contentType: string | null; fetched: boolean }): Promise<void>;
};

export type ReadPage = { url: string; text: string; sha256: string; kind: "html" | "pdf" };
export type PageRefusal = { url: string; reason: CrawlRefusal; detail: string };
export type SourceOutcome = {
  /** Pages read anew (new or changed) and handed on. */
  pagesRead: number;
  /** Pages the server or the hash said were unchanged. */
  cachedHits: number;
  refused: { reason: CrawlRefusal; detail: string } | null;
  pageRefusals: PageRefusal[];
  stopped: boolean;
};

export type CrawlDeps = {
  client: PoliteClient;
  cache: PageCache;
  shouldStop: () => boolean;
  /** A new or changed page, for extraction. Throwing leaves the page's hash unstored (read again next time). */
  onPage: (page: ReadPage) => Promise<void>;
  log: (line: string) => void;
  pdfText?: (bytes: Uint8Array) => Promise<string>;
  maxPages?: number;
};

const bare = (host: string) => host.toLowerCase().replace(/^www\./, "");
const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

function describe(e: unknown): string {
  const err = e as Error & { code?: string };
  if (err?.name === "TimeoutError") return "timed out";
  return (err?.code && !String(err.message).includes(err.code) ? `${err.message} (${err.code})` : String(err?.message ?? e)).slice(0, 200);
}

/** robots.txt for an origin: 4xx = no rules; an HTML page = no rules; 5xx or no answer = everything disallowed. */
export async function robotsFor(client: PoliteClient, origin: string): Promise<{ robots: Robots; note: string }> {
  try {
    const res = await client.get(`${origin}/robots.txt`);
    if (res.status >= 200 && res.status < 300) {
      const body = res.body.toString("utf8");
      if (!looksLikeRobots(res.headers["content-type"] ?? null, body)) return { robots: ALLOW_ALL, note: "robots.txt is an HTML page (no rules)" };
      return { robots: parseRobots(body), note: "robots.txt read" };
    }
    if (res.status >= 400 && res.status < 500) return { robots: ALLOW_ALL, note: `robots.txt answered ${res.status} (no rules)` };
    return { robots: DISALLOW_ALL, note: `robots.txt answered ${res.status}` };
  } catch (e) {
    return { robots: DISALLOW_ALL, note: `robots.txt did not answer: ${describe(e)}` };
  }
}

type Fetched =
  | { kind: "changed"; page: ReadPage; links: string[]; finalUrl: string; answer: HttpAnswer }
  | { kind: "same"; links: string[]; finalUrl: string }
  | { kind: "refused"; reason: CrawlRefusal; detail: string };

async function fetchPage(url: string, sourceId: string, deps: CrawlDeps): Promise<Fetched> {
  const cached = await deps.cache.get(url);
  let res: HttpAnswer;
  try {
    res = await deps.client.get(url, { etag: cached?.etag, lastModified: cached?.lastModified });
  } catch (e) {
    const detail = describe(e);
    await deps.cache.put(sourceId, { url, etag: cached?.etag ?? null, lastModified: cached?.lastModified ?? null, sha256: cached?.sha256 ?? null, links: cached?.links ?? [], status: 0, refused: detail, contentType: null, fetched: false });
    return { kind: "refused", reason: "UNREACHABLE", detail };
  }
  const contentType = res.headers["content-type"] ?? null;
  const keep = (over: Partial<CachedPage> & { fetched: boolean }) =>
    deps.cache.put(sourceId, { url, etag: res.headers.etag ?? cached?.etag ?? null, lastModified: res.headers["last-modified"] ?? cached?.lastModified ?? null, sha256: cached?.sha256 ?? null, links: cached?.links ?? [], status: res.status, refused: null, contentType, ...over });

  if (res.status === 304 && cached) {
    await keep({ fetched: false });
    return { kind: "same", links: cached.links, finalUrl: url };
  }
  if (res.status < 200 || res.status >= 300) {
    await keep({ refused: `HTTP ${res.status}`, fetched: false });
    return { kind: "refused", reason: "HTTP_ERROR", detail: `HTTP ${res.status}` };
  }
  if (res.truncated) {
    await keep({ refused: "larger than the size cap", fetched: false });
    return { kind: "refused", reason: "TOO_LARGE", detail: "larger than the size cap" };
  }
  const hash = sha256(res.body);
  const isPdf = /pdf/i.test(contentType ?? "") || (/\.pdf(?:$|\?)/i.test(new URL(res.url).pathname) && res.body.subarray(0, 5).toString() === "%PDF-");
  const isHtml = !isPdf && (/html|xml/i.test(contentType ?? "") || (!contentType && /^\s*</.test(res.body.subarray(0, 200).toString("utf8"))));
  if (!isPdf && !isHtml) {
    await keep({ refused: `not a page or a PDF (${contentType ?? "no type"})`, fetched: false });
    return { kind: "refused", reason: "UNSUPPORTED_TYPE", detail: contentType ?? "no content type" };
  }
  let text: string;
  let links: string[] = [];
  if (isHtml) {
    const html = res.body.toString("utf8");
    if (needsLogin(html)) {
      await keep({ refused: "asks for a password", fetched: false });
      return { kind: "refused", reason: "LOGIN", detail: "the page asks for a password" };
    }
    if (renderedByScript(html)) {
      await keep({ refused: "rendered by script", fetched: false });
      return { kind: "refused", reason: "RENDERED_BY_SCRIPT", detail: "the page's words are drawn by a script" };
    }
    links = linksOf(html, res.url);
    text = htmlToText(html);
  } else {
    try {
      text = await (deps.pdfText ?? pdfToText)(new Uint8Array(res.body));
    } catch (e) {
      await keep({ refused: `the PDF could not be read: ${describe(e)}`, fetched: false });
      return { kind: "refused", reason: "UNSUPPORTED_TYPE", detail: `the PDF could not be read: ${describe(e)}` };
    }
  }
  if (cached?.sha256 && cached.sha256 === hash) {
    await keep({ links, sha256: hash, fetched: true });
    return { kind: "same", links, finalUrl: res.url };
  }
  return { kind: "changed", page: { url, text, sha256: hash, kind: isPdf ? "pdf" : "html" }, links, finalUrl: res.url, answer: res };
}

/** Hands a changed page on; stores its hash and links only when that succeeded. */
async function handOn(sourceId: string, f: Extract<Fetched, { kind: "changed" }>, deps: CrawlDeps): Promise<boolean> {
  const base = { url: f.page.url, etag: f.answer.headers.etag ?? null, lastModified: f.answer.headers["last-modified"] ?? null, links: f.links, status: f.answer.status, refused: null, contentType: f.answer.headers["content-type"] ?? null, fetched: true };
  try {
    await deps.onPage(f.page);
  } catch (e) {
    deps.log(`  ${f.page.url}: not extracted (${describe(e)}); read again next time`);
    // The validators are dropped too, so the next crawl asks for the whole page again.
    await deps.cache.put(sourceId, { ...base, etag: null, lastModified: null, sha256: null });
    return false;
  }
  await deps.cache.put(sourceId, { ...base, sha256: f.page.sha256 });
  return true;
}

/** Words in a link's address that promise a competition page. */
const PROMISING = /olympiad|exam|test|contest|competition|quiz|award|talent|scholar|fair|exhibition|register|registration|schedule|date|calendar|notice|circular|announce|nse|nstse|ntse|inspire|manak|challenge|bebras|syllab|eligib|apply/i;

/** The root's links, the promising ones first (in page order within each group): the forty-page cap keeps the right forty. */
export function byPromise(links: string[]): string[] {
  const score = (url: string) => {
    try {
      const u = new URL(url);
      return PROMISING.test(decodeURIComponent(u.pathname + u.search)) ? 1 : 0;
    } catch {
      return 0;
    }
  };
  return links.map((l, i) => ({ l, i, s: score(l) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.l);
}

export async function crawlSource(source: { id: string; rootUrl: string }, deps: CrawlDeps): Promise<SourceOutcome> {
  const out: SourceOutcome = { pagesRead: 0, cachedHits: 0, refused: null, pageRefusals: [], stopped: false };
  const root = new URL(source.rootUrl);
  const { robots, note } = await robotsFor(deps.client, root.origin);
  deps.log(`  ${note}`);
  if (robots.crawlDelaySeconds && robots.crawlDelaySeconds * 1000 > 1000) deps.client.setDelay(root.host, Math.min(robots.crawlDelaySeconds, 30) * 1000);
  if (!robots.allowed(root.pathname + root.search)) {
    out.refused = { reason: "ROBOTS", detail: note === "robots.txt read" ? "robots.txt disallows the root page" : note };
    return out;
  }

  const first = await fetchPage(source.rootUrl, source.id, deps);
  if (first.kind === "refused") {
    out.refused = { reason: first.reason, detail: first.detail };
    return out;
  }
  if (first.kind === "changed") {
    if (await handOn(source.id, first, deps)) out.pagesRead++;
  } else out.cachedHits++;

  const hosts = new Set([bare(root.host), bare(new URL(first.finalUrl).host)]);
  const seen = new Set([source.rootUrl, first.finalUrl]);
  const children: string[] = [];
  for (const link of byPromise(first.links)) {
    const u = new URL(link);
    if (!hosts.has(bare(u.host)) || seen.has(link) || !worthReading(link)) continue;
    seen.add(link);
    if (!robots.allowed(u.pathname + u.search)) {
      out.pageRefusals.push({ url: link, reason: "ROBOTS", detail: "robots.txt disallows it" });
      continue;
    }
    children.push(link);
    if (children.length >= (deps.maxPages ?? MAX_PAGES_PER_SOURCE) - 1) break;
  }

  for (const url of children) {
    if (deps.shouldStop()) {
      out.stopped = true;
      break;
    }
    const f = await fetchPage(url, source.id, deps);
    if (f.kind === "refused") out.pageRefusals.push({ url, reason: f.reason, detail: f.detail });
    else if (f.kind === "same") out.cachedHits++;
    else if (await handOn(source.id, f, deps)) out.pagesRead++;
  }
  return out;
}
