/**
 * The curriculum corpus downloader (docs/plans/assistant.md §3, Phase A; runbook docs/runbooks/assistant-local.md).
 *
 *   npm run corpus:fetch -- --source=ncert|balbharati|nios|syllabi|glossaries|all [--grade=8[,9]] [--first=9,8] [--dry [--list]]
 *
 * WHAT IT COLLECTS. The English NCERT textbooks, classes 1 to 12, chapter by chapter, and the
 * exemplar problems, from ncert.nic.in; the Balbharati English-medium textbooks, standards 1 to 12,
 * from books.ebalbharati.in; the NIOS secondary and senior secondary course books in English; the
 * boards' bilingual glossaries (NCERT's trilingual dictionaries, Balbharati's word lists where its
 * library carries any); and the syllabus PDFs the affiliating universities and councils publish
 * (SPPU, MUHS, MPKV, AICTE's model curriculum, BCI, PCI, NCTE, COA, ICAR). No Hindi or Marathi
 * book, no commercial book, no login, no CAPTCHA: a site that will not answer a plain request is
 * written down with `fetched: false` and the run moves on.
 *
 * WHERE IT LANDS. storage/corpus/<board>/<grade or programme>/<subject>/<file>, with the folder's
 * manifest.json beside it (scripts/corpus-lib.ts): title, board, grade or programme, subject,
 * language, edition and year as the site states them, source URL, the licence as published,
 * retrieval date, SHA-256, size.
 *
 * IDEMPOTENT AND RESUMABLE. A file whose manifest entry says fetched, with the same size and
 * checksum on disk, is not fetched again. Bytes go to `<file>.part` and are renamed only when
 * complete, so an interrupted run leaves nothing that looks finished.
 *
 * POLITE. One request at a time per host and a pause between them (CORPUS_PAUSE_MS, 1500 by
 * default); the sources run side by side because they are different hosts. The User-Agent names
 * the project and the contact address in CORPUS_CONTACT. Nothing is sent anywhere but the sites
 * named above.
 *
 * --dry discovers (it reads the sites' index pages, politely) and counts, and downloads nothing.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import type { IncomingMessage } from "node:http";
import { dirname, join, posix } from "node:path";
import { pipeline } from "node:stream/promises";
import { config } from "dotenv";
import { CORPUS_ROOT, SOURCES, readFolderManifest, removeManifestEntries, slug, writeManifestEntry, type ContentKind, type Licence, type ManifestEntry, type SourceKey } from "./corpus-lib";

config();

/* ---- arguments ------------------------------------------------------------ */

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

const DRY = arg("dry") === "true";
/** With --dry: print every file the run would fetch (folder, file, title). */
const LIST = arg("list") === "true";
/** --grade=8 or --grade=8,9: only those classes. --first=9,8: those classes first, then the rest. */
const GRADES: number[] | null = arg("grade") ? (arg("grade") ?? "").split(",").map(Number) : null;
const FIRST: number[] = arg("first") ? (arg("first") ?? "").split(",").map(Number) : [];
const gradeWanted = (g: number) => !GRADES || GRADES.includes(g);
/** Sort key: a class named in --first comes before the rest, in the order named. */
const gradeOrder = (g: number) => (FIRST.includes(g) ? FIRST.indexOf(g) : FIRST.length + g);
const SOURCE_ARG = arg("source") ?? "all";
const PAUSE_MS = Number(process.env.CORPUS_PAUSE_MS ?? 1500) || 1500;
const CONTACT = process.env.CORPUS_CONTACT?.trim() || "contact address not configured (set CORPUS_CONTACT)";
const USER_AGENT = `Shalaghar-corpus/1.0 (school platform curriculum index; one request at a time; ${CONTACT})`;

/* ---- polite HTTP ---------------------------------------------------------- */

const hostChains = new Map<string, Promise<void>>();
const lastHit = new Map<string, number>();
const cookies = new Map<string, Map<string, string>>();

/** One request at a time per host, with a pause between them; different hosts proceed side by side. */
async function politely<T>(url: string, work: () => Promise<T>): Promise<T> {
  const host = new URL(url).host;
  const before = hostChains.get(host) ?? Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>((r) => (release = r));
  hostChains.set(host, before.then(() => mine));
  await before;
  try {
    const wait = (lastHit.get(host) ?? 0) + PAUSE_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return await work();
  } finally {
    lastHit.set(host, Date.now());
    release();
  }
}

function cookieHeader(url: string): string | undefined {
  const jar = cookies.get(new URL(url).host);
  if (!jar || jar.size === 0) return undefined;
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

function keepCookies(url: string, setCookie: string[] | undefined) {
  if (!setCookie?.length) return;
  const host = new URL(url).host;
  const jar = cookies.get(host) ?? new Map<string, string>();
  for (const line of setCookie) {
    const pair = line.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  cookies.set(host, jar);
}

type Answer = { status: number; url: string; headers: IncomingMessage["headers"]; body: IncomingMessage };

/**
 * One request on node:http(s), following up to five redirects. Node's own sockets rather than
 * fetch: the run of 8 October died inside undici's parser on a socket a government server closed
 * early, an assertion no try/catch could reach. Here a broken socket is an ordinary error.
 */
function request(url: string, init: { method?: "GET" | "POST"; headers?: Record<string, string>; body?: string; timeoutMs: number }, redirects = 0): Promise<Answer> {
  return new Promise((resolveAnswer, reject) => {
    const target = new URL(url);
    const lib = target.protocol === "http:" ? http : https;
    const headers: Record<string, string> = { "User-Agent": USER_AGENT, ...(init.headers ?? {}) };
    const cookie = cookieHeader(url);
    if (cookie) headers.Cookie = cookie;
    if (init.body !== undefined) headers["Content-Length"] = String(Buffer.byteLength(init.body));
    const req = lib.request(target, { method: init.method ?? "GET", headers, timeout: init.timeoutMs }, (res) => {
      keepCookies(url, res.headers["set-cookie"]);
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        if (redirects >= 5) return reject(new Error("too many redirects"));
        // A redirected POST becomes a GET, as browsers do.
        const next = new URL(location, url).toString();
        return request(next, { ...init, method: "GET", body: undefined }, redirects + 1).then(resolveAnswer, reject);
      }
      resolveAnswer({ status, url, headers: res.headers, body: res });
    });
    req.on("timeout", () => req.destroy(Object.assign(new Error("timed out"), { name: "TimeoutError" })));
    req.on("error", reject);
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}

function readAll(stream: IncomingMessage, timeoutMs: number): Promise<string> {
  return new Promise((resolveText, reject) => {
    const parts: Buffer[] = [];
    const timer = setTimeout(() => stream.destroy(new Error("timed out reading the page")), timeoutMs);
    stream.on("data", (c: Buffer) => parts.push(c));
    stream.on("end", () => {
      clearTimeout(timer);
      resolveText(Buffer.concat(parts).toString("utf8"));
    });
    stream.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

type PageResult = { ok: true; text: string; url: string } | { ok: false; error: string };

async function getPage(url: string, init: { method?: "GET" | "POST"; form?: Record<string, string>; timeoutMs?: number } = {}): Promise<PageResult> {
  const timeoutMs = init.timeoutMs ?? 60_000;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await politely(url, async (): Promise<PageResult | "retry"> => {
      try {
        const headers: Record<string, string> = { Accept: "text/html,application/xhtml+xml,application/xml,*/*" };
        let body: string | undefined;
        if (init.form) {
          headers["Content-Type"] = "application/x-www-form-urlencoded";
          body = new URLSearchParams(init.form).toString();
        }
        const res = await request(url, { method: init.method ?? (init.form ? "POST" : "GET"), headers, body, timeoutMs });
        if (res.status >= 500) {
          res.body.resume();
          return attempt < 3 ? "retry" : { ok: false, error: `HTTP ${res.status}` };
        }
        if (res.status < 200 || res.status >= 300) {
          res.body.resume();
          return { ok: false, error: `HTTP ${res.status}` };
        }
        return { ok: true, text: await readAll(res.body, timeoutMs), url: res.url };
      } catch (e) {
        return attempt < 3 ? "retry" : { ok: false, error: describeError(e) };
      }
    });
    if (result !== "retry") return result;
    await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
  return { ok: false, error: "no answer after three attempts" };
}

function describeError(e: unknown): string {
  if (e instanceof Error) {
    const code = (e as Error & { code?: string; cause?: { code?: string } }).code ?? (e as Error & { cause?: { code?: string } }).cause?.code;
    if (e.name === "TimeoutError" || e.name === "AbortError") return "timed out";
    return code && !e.message.includes(code) ? `${e.message} (${code})` : e.message;
  }
  return String(e);
}

type DownloadResult = { ok: true; sha256: string; bytes: number; lastModified: string | null } | { ok: false; error: string; status?: number };

async function download(url: string, dest: string): Promise<DownloadResult> {
  mkdirSync(dirname(dest), { recursive: true });
  const part = `${dest}.part`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await politely(url, async (): Promise<DownloadResult | "retry"> => {
      try {
        const res = await request(url, { timeoutMs: 120_000 });
        if (res.status >= 500) {
          res.body.resume();
          return attempt < 3 ? "retry" : { ok: false, error: `HTTP ${res.status}`, status: res.status };
        }
        if (res.status < 200 || res.status >= 300) {
          res.body.resume();
          return { ok: false, error: `HTTP ${res.status}`, status: res.status };
        }
        const type = String(res.headers["content-type"] ?? "");
        if (/text\/html/i.test(type)) {
          res.body.resume();
          return { ok: false, error: `the site answered with a web page (${type}), not the file` };
        }
        const hash = createHash("sha256");
        let bytes = 0;
        res.body.on("data", (c: Buffer) => {
          hash.update(c);
          bytes += c.length;
        });
        await pipeline(res.body, createWriteStream(part));
        const expected = Number(res.headers["content-length"] ?? NaN);
        if (Number.isFinite(expected) && expected !== bytes) throw new Error(`short read: ${bytes} of ${expected} bytes`);
        renameSync(part, dest);
        const lastModified = res.headers["last-modified"];
        return { ok: true, sha256: hash.digest("hex"), bytes, lastModified: typeof lastModified === "string" ? lastModified : null };
      } catch (e) {
        try { if (existsSync(part)) unlinkSync(part); } catch { /* nothing to tidy */ }
        return attempt < 3 ? "retry" : { ok: false, error: describeError(e) };
      }
    });
    if (result !== "retry") return result;
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
  return { ok: false, error: "no answer after three attempts" };
}

/* ---- items ---------------------------------------------------------------- */

type Item = Omit<ManifestEntry, "retrievedAt" | "sha256" | "bytes" | "fetched" | "error" | "file"> & {
  /** Folder under the corpus root: <board>/<grade or programme>/<subject>. */
  folder: string;
  file: string;
  /** A file the site may or may not have (an answers appendix): a 404 is not recorded as a refusal. */
  optional?: boolean;
};

type Refusal = { source: SourceKey; board: string; url: string; error: string; folder: string };

type Tally = { discovered: number; fetched: number; present: number; failed: number; optionalMissing: number; bytes: number };
const tallies = new Map<SourceKey, Tally>();
const refusals: Refusal[] = [];

function tally(source: SourceKey): Tally {
  let t = tallies.get(source);
  if (!t) tallies.set(source, (t = { discovered: 0, fetched: 0, present: 0, failed: 0, optionalMissing: 0, bytes: 0 }));
  return t;
}

/** A site or index page that would not answer: written to the board's own manifest as `fetched: false`. */
function refuse(source: SourceKey, board: string, boardFolder: string, url: string, error: string, licence: Licence, kind: ContentKind) {
  refusals.push({ source, board, url, error, folder: boardFolder });
  if (DRY) return;
  const folder = join(CORPUS_ROOT, boardFolder, "_refused", "index");
  writeManifestEntry(folder, {
    file: slug(url.replace(/^https?:\/\//, ""), 120) + ".html",
    title: `Index page of ${board} (not fetched)`,
    board,
    gradeOrProgramme: "_refused",
    subject: "index",
    language: "en",
    edition: null,
    year: null,
    sourceUrl: url,
    licence,
    retrievedAt: new Date().toISOString(),
    sha256: null,
    bytes: null,
    fetched: false,
    error,
    source,
    kind,
  });
}

async function fetchItem(item: Item): Promise<void> {
  const t = tally(item.source);
  t.discovered++;
  const dir = join(CORPUS_ROOT, item.folder);
  const dest = join(dir, item.file);
  const known = readFolderManifest(dir).files[item.file];
  if (known?.fetched && existsSync(dest) && known.bytes === statSync(dest).size) {
    t.present++;
    return;
  }
  if (DRY) return;
  const got = await download(item.sourceUrl, dest);
  const { folder: _folder, optional, ...rest } = item;
  void _folder;
  if (!got.ok) {
    if (optional && got.status === 404) {
      t.optionalMissing++;
      return;
    }
    t.failed++;
    writeManifestEntry(dir, { ...rest, retrievedAt: new Date().toISOString(), sha256: null, bytes: null, fetched: false, error: got.error });
    return;
  }
  // The same bytes as last time (a re-fetch after a lost manifest): say so rather than counting it new.
  if (known?.sha256 === got.sha256) t.present++;
  else t.fetched++;
  t.bytes += got.bytes;
  writeManifestEntry(dir, {
    ...rest,
    retrievedAt: new Date().toISOString(),
    sha256: got.sha256,
    bytes: got.bytes,
    fetched: true,
    extra: { ...(rest.extra ?? {}), lastModified: got.lastModified },
  });
}

/** Runs the items one after another (each host is serial anyway), printing progress every 25. */
async function fetchAll(source: SourceKey, items: Item[]) {
  let n = 0;
  if (LIST) for (const i of items) console.log(`  ${i.folder}/${i.file}  ${i.title}${i.optional ? " (optional)" : ""}`);
  for (const item of items) {
    await fetchItem(item);
    n++;
    if (!DRY && n % 25 === 0) {
      const t = tally(source);
      console.log(`  [${source}] ${n}/${items.length} — new ${t.fetched}, present ${t.present}, failed ${t.failed}`);
    }
  }
}

/* ---- small HTML helpers --------------------------------------------------- */

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

function anchors(html: string, base: string): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  const re = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const raw = decodeEntities((m[1] ?? "").trim());
    if (/^(javascript:|mailto:|#)/i.test(raw)) continue;
    try {
      out.push({ href: new URL(raw.replace(/^~\/\.\.\/\.\.\//, "/"), base).toString(), text: stripTags(m[2] ?? "") });
    } catch {
      /* an href no URL parser accepts is not a link to follow */
    }
  }
  return out;
}

function fileNameFrom(url: string): string {
  const base = decodeURIComponent(posix.basename(new URL(url).pathname));
  return base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").slice(0, 120) || "file.pdf";
}

const licenceCache = new Map<string, Licence>();

/** The site's terms page as published, trimmed to 3,000 characters; the link alone when it will not load. */
async function licenceFrom(url: string, fallbackText?: string): Promise<Licence> {
  const cached = licenceCache.get(url);
  if (cached) return cached;
  let licence: Licence = { url, ...(fallbackText ? { text: fallbackText } : {}) };
  if (!fallbackText) {
    const page = await getPage(url, { timeoutMs: 45_000 });
    if (page.ok) {
      const text = stripTags(page.text);
      if (text.length > 40) licence = { url, text: text.slice(0, 3000) };
    }
  }
  licenceCache.set(url, licence);
  return licence;
}

/* ---- NCERT ---------------------------------------------------------------- */

const NCERT = "https://ncert.nic.in/";
const NCERT_LICENCE_URL = "https://ncert.nic.in/textbook.php";
const CLASS_LETTER = "abcdefghijkl";

/** The textbook page's own words about copyright and use, read from the page itself. */
function ncertLicenceText(page: string): string | undefined {
  const start = page.indexOf("Copyright of NCERT Textbooks and terms of use");
  if (start < 0) return undefined;
  const slice = page.slice(start, start + 4000);
  const parts = [...slice.matchAll(/document\.write\("([^"]*)"\)/g)].map((m) => stripTags(m[1] ?? "")).filter(Boolean);
  return ["Copyright of NCERT Textbooks and terms of use", ...parts].join(" ").slice(0, 3000);
}

type NcertBook = { grade: number; subject: string; title: string; code: string; first: number; last: number };

/** The book list lives in the textbook page's own script: one block per class and subject, one option per book. */
function ncertBooks(page: string): NcertBook[] {
  const books = new Map<string, NcertBook>();
  // Comment lines carry retired books; they are not on the site any more.
  const live = page.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
  const blockRe = /tclass\.value\s*==\s*(\d+)\)\s*&&\s*\(document\.test\.tsubject\.options\[sind\]\.text\s*==\s*"([^"]+)"\)\)([\s\S]*?)(?=else\s+if\s*\(\(document\.test\.tclass|\n\s*}\s*\n\s*}\s*\n|$)/g;
  for (let m = blockRe.exec(live); m; m = blockRe.exec(live)) {
    const grade = Number(m[1]);
    const subject = (m[2] ?? "").trim();
    const body = m[3] ?? "";
    const texts = new Map<string, string>();
    for (const t of body.matchAll(/options\[(\d+)\]\.text\s*=\s*"([^"]*)"/g)) texts.set(t[1] ?? "", (t[2] ?? "").trim());
    for (const v of body.matchAll(/options\[(\d+)\]\.value\s*=\s*"textbook\.php\?([a-z]{4}\d)=(\d+)-(\d+)"/g)) {
      const code = v[2] ?? "";
      if (code[1] !== "e") continue; // English only: the second letter is the language (e, h, u)
      if (code[0] !== CLASS_LETTER[grade - 1]) continue;
      if (/hindi|urdu|sanskrit/i.test(subject)) continue;
      books.set(code, { grade, subject, title: texts.get(v[1] ?? "") ?? code, code, first: Number(v[3]), last: Number(v[4]) });
    }
  }
  return [...books.values()].sort((a, b) => a.grade - b.grade || a.code.localeCompare(b.code));
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

async function discoverNcert(): Promise<Item[]> {
  const items: Item[] = [];
  const page = await getPage(`${NCERT}textbook.php`);
  const fallbackLicence: Licence = { url: NCERT_LICENCE_URL };
  if (!page.ok) {
    refuse("ncert", "NCERT", "ncert", `${NCERT}textbook.php`, page.error, fallbackLicence, "textbook");
    return items;
  }
  const licence: Licence = { url: NCERT_LICENCE_URL, text: ncertLicenceText(page.text) };
  for (const book of ncertBooks(page.text)) {
    if (!gradeWanted(book.grade)) continue;
    const folder = join("ncert", String(book.grade), slug(book.subject));
    ncertBooksListed.push({ folder, code: book.code, title: book.title, grade: book.grade, subject: book.subject, licence });
    // A book already taken from its complete-book zip (ncertZipFallback) has no chapter files to ask for.
    if (readFolderManifest(join(CORPUS_ROOT, folder)).files[`${book.code}dd.zip`]?.fetched) continue;
    const base = { title: book.title, board: "NCERT", gradeOrProgramme: String(book.grade), subject: book.subject, language: "en", edition: null, year: null, licence, source: "ncert" as const, kind: "textbook" as const, folder };
    items.push({ ...base, file: `${book.code}ps.pdf`, sourceUrl: `${NCERT}textbook/pdf/${book.code}ps.pdf`, optional: true, extra: { bookCode: book.code, part: "prelims" } });
    for (let ch = Math.max(1, book.first); ch <= book.last; ch++) {
      const n = String(ch).padStart(2, "0");
      items.push({ ...base, file: `${book.code}${n}.pdf`, sourceUrl: `${NCERT}textbook/pdf/${book.code}${n}.pdf`, extra: { bookCode: book.code, chapter: ch } });
    }
    items.push({ ...base, file: `${book.code}an.pdf`, sourceUrl: `${NCERT}textbook/pdf/${book.code}an.pdf`, optional: true, extra: { bookCode: book.code, part: "answers" } });
  }

  // The exemplar problems: their own page, plain links, one PDF per chapter.
  const ex = await getPage(`${NCERT}exemplar-problems.php`);
  if (!ex.ok) {
    refuse("ncert", "NCERT", "ncert", `${NCERT}exemplar-problems.php`, ex.error, licence, "exemplar");
    return items;
  }
  for (const a of anchors(ex.text, NCERT)) {
    const m = /\/exemplarproblem\/class([IVX]+)\/([^/]+)\/([a-z]{4}\d(?:\d\d|an|ps))\.pdf$/i.exec(new URL(a.href).pathname);
    if (!m) continue;
    const subjectDir = decodeURIComponent(m[2] ?? "");
    const code = m[3] ?? "";
    if (code[1] !== "e" || /hindi|urdu/i.test(subjectDir)) continue;
    const grade = ROMAN[(m[1] ?? "").toUpperCase()];
    if (!grade || !gradeWanted(grade)) continue;
    const subject = subjectDir.replace(/\(.*\)/, "").trim();
    const chapter = /\d\d$/.test(code) ? Number(code.slice(-2)) : null;
    items.push({
      title: `Exemplar Problems — ${subject}, Class ${grade}${a.text ? ` — ${a.text.replace(/^\d+\.\s*/, "")}` : ""}`.slice(0, 200),
      board: "NCERT",
      gradeOrProgramme: String(grade),
      subject,
      language: "en",
      edition: null,
      year: null,
      licence,
      source: "ncert",
      kind: "exemplar",
      folder: join("ncert", String(grade), `${slug(subject)}-exemplar`),
      file: `${code}.pdf`,
      sourceUrl: a.href,
      extra: { bookCode: code.slice(0, 5), chapter },
    });
  }
  return dedupe(items).map((item, i) => ({ item, i })).sort((a, b) => gradeOrder(Number(a.item.gradeOrProgramme)) - gradeOrder(Number(b.item.gradeOrProgramme)) || a.i - b.i).map(({ item }) => item);
}

function dedupe(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.folder}/${i.file}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ---- NCERT: the complete-book zip when the chapter files are not served ---- */

type NcertBookPlace = { folder: string; code: string; title: string; grade: number; subject: string; licence: Licence };
const ncertBooksListed: NcertBookPlace[] = [];

function sha256Of(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/**
 * Some books (the new class 3 readers, for one) have no per-chapter files behind the page's own
 * chapter range: every chapter answers 404. The page also offers "Download complete book", the
 * book's zip of chapter PDFs; that is fetched once, unpacked beside the refusals it replaces, and
 * each PDF gets its own manifest entry naming the zip as its source. The zip itself is not kept.
 */
async function ncertZipFallback(): Promise<void> {
  for (const book of ncertBooksListed) {
    const dir = join(CORPUS_ROOT, book.folder);
    const manifest = readFolderManifest(dir);
    const zipName = `${book.code}dd.zip`;
    if (manifest.files[zipName]?.fetched) continue;
    const chapters = Object.values(manifest.files).filter((e) => e.extra?.bookCode === book.code && typeof e.extra?.chapter === "number");
    if (chapters.length === 0 || chapters.some((e) => e.fetched) || !chapters.some((e) => e.error === "HTTP 404")) continue;
    const zipUrl = `${NCERT}textbook/pdf/${zipName}`;
    const zipPath = join(dir, zipName);
    const got = await download(zipUrl, zipPath);
    const t = tally("ncert");
    const base = { title: book.title, board: "NCERT", gradeOrProgramme: String(book.grade), subject: book.subject, language: "en", edition: null, year: null, licence: book.licence, source: "ncert" as const, kind: "textbook" as const };
    if (!got.ok) {
      t.failed++;
      writeManifestEntry(dir, { ...base, file: zipName, sourceUrl: zipUrl, retrievedAt: new Date().toISOString(), sha256: null, bytes: null, fetched: false, error: got.error, extra: { bookCode: book.code, part: "complete book" } });
      continue;
    }
    const unpack = join(dir, `.unzip-${book.code}`);
    mkdirSync(unpack, { recursive: true });
    try {
      execFileSync("unzip", ["-o", "-j", "-q", zipPath, "*.pdf", "-d", unpack], { stdio: "pipe" });
    } catch {
      /* unzip exits non-zero on a warning; the files it did write are checked below */
    }
    const members = readdirSync(unpack).filter((f) => /\.pdf$/i.test(f));
    const replaced: string[] = [];
    for (const m of members) {
      const name = m.replace(/[^A-Za-z0-9._-]+/g, "_");
      const target = join(dir, name);
      renameSync(join(unpack, m), target);
      const n = /(\d\d)\.pdf$/i.exec(name);
      const part = /ps\.pdf$/i.test(name) ? "prelims" : /an\.pdf$/i.test(name) ? "answers" : null;
      writeManifestEntry(dir, {
        ...base,
        file: name,
        sourceUrl: `${zipUrl}#${m}`,
        retrievedAt: new Date().toISOString(),
        sha256: sha256Of(target),
        bytes: statSync(target).size,
        fetched: true,
        extra: { bookCode: book.code, ...(part ? { part } : n ? { chapter: Number(n[1]) } : {}), fromZip: zipUrl, lastModified: got.lastModified },
      });
      replaced.push(name);
      t.fetched++;
    }
    rmSync(unpack, { recursive: true, force: true });
    rmSync(zipPath, { force: true });
    // The 404s the zip made good, and any chapter number the zip does not carry, leave the manifest.
    removeManifestEntries(dir, chapters.filter((e) => !e.fetched).map((e) => e.file).filter((f) => !replaced.includes(f)));
    t.failed = Math.max(0, t.failed - chapters.length);
    writeManifestEntry(dir, { ...base, file: zipName, sourceUrl: zipUrl, retrievedAt: new Date().toISOString(), sha256: got.sha256, bytes: got.bytes, fetched: true, error: undefined, extra: { bookCode: book.code, part: "complete book", unpacked: members.length, note: "unpacked into this folder and not kept" } });
    console.log(`  [ncert] ${book.code}: chapters not served one by one; the complete book's zip gave ${members.length} PDFs`);
  }
}

/* ---- Balbharati ----------------------------------------------------------- */

const BALBHARATI_LIBRARY = "https://books.ebalbharati.in/";
const BALBHARATI_LICENCE = "https://ebalbharati.in/main/copyright.html";
const DEVANAGARI_DIGITS = "०१२३४५६७८९";
/** A language book of another medium's language: not the English-medium curriculum. */
const OTHER_LANGUAGE = /मराठी|हिंदी|हिन्दी|उर्दू|उर्दु|संस्कृत|गुजराती|कन्नड|सिंधी|तेलुगु|तामिळ|बंगाली|अरबी|पाली|अर्धमागधी|फ्रेंच|जर्मन|रशियन|जपानी|स्पॅनिश|पर्शियन|फारसी|चिनी/;

/** The subject a title names, most specific first; the medium word at the end of every title is cut before matching. */
const BALBHARATI_SUBJECTS: [RegExp, string][] = [
  [/माहिती तंत्रज्ञान|संगणक/, "Information Technology"],
  [/अन्नविज्ञान/, "Food Science and Technology"],
  [/कृषि|कृषी/, "Agriculture"],
  [/पशु विज्ञान/, "Animal Science"],
  [/भौतिकशास्त्र|भौतिक/, "Physics"],
  [/रसायनशास्त्र|रसायन/, "Chemistry"],
  [/जीवशास्त्र/, "Biology"],
  [/भूशास्त्र/, "Geology"],
  [/गणित/, "Mathematics"],
  [/विज्ञान/, "Science"],
  [/इतिहास/, "History"],
  [/भूगोल/, "Geography"],
  [/राज्यशास्त्र|नागरिकशास्त्र/, "Political Science"],
  [/अर्थशास्त्र/, "Economics"],
  [/समाजशास्त्र/, "Sociology"],
  [/मानसशास्त्र/, "Psychology"],
  [/तत्त्वज्ञान|तत्वज्ञान/, "Philosophy"],
  [/तर्कशास्त्र/, "Logic"],
  [/शिक्षणशास्त्र/, "Education"],
  [/संरक्षणशास्त्र/, "Defence Studies"],
  [/बाल विकास/, "Child Development"],
  [/गृहव्यवस्थापन/, "Home Management"],
  [/वस्त्रशास्त्र/, "Textiles"],
  [/पुस्तपालन|लेखाकर्म/, "Book-keeping and Accountancy"],
  [/चिटणिस/, "Secretarial Practice"],
  [/वाणिज्य/, "Organisation of Commerce and Management"],
  [/सहकार/, "Co-operation"],
  [/पर्यावरण/, "Environment Education"],
  [/परिसर अभ्यास|सभोवतालचे जग|आ\.स\.ज/, "Environmental Studies"],
  [/आरोग्य|आरॊग्य|शारीरिक/, "Health and Physical Education"],
  [/कार्यशिक्षण|कार्यानुभव/, "Work Education"],
  [/कला/, "Art Education"],
  [/बालभारती|कुमारभारती|युवकभारती|इंग्रजी/, "English"],
];

function balbharatiGrade(title: string): number | null {
  const m = /^\s*([०-९]{1,2})/.exec(title);
  if (!m) return null;
  return Number([...(m[1] ?? "")].map((c) => DEVANAGARI_DIGITS.indexOf(c)).join(""));
}

function hidden(html: string, name: string): string {
  const re = new RegExp(`id="${name}"\\s+value="([^"]*)"`);
  return decodeEntities(re.exec(html)?.[1] ?? "");
}

type BalbharatiBook = { id: string; title: string; url: string };

function balbharatiBooks(html: string): BalbharatiBook[] {
  const out: BalbharatiBook[] = [];
  const re = /title='([^']*)'>[\s\S]*?SaveToDisk\("([^"]+\/pdfs\/(\d+)\.pdf)"/g;
  for (let m = re.exec(html); m; m = re.exec(html)) out.push({ title: (m[1] ?? "").replace(/\s+/g, " ").trim(), url: m[2] ?? "", id: m[3] ?? "" });
  return out;
}

/** The library pages by ASP.NET postback: the filter ("303 101" is English medium, textbooks) and a page number. */
async function balbharatiListing(filter: string): Promise<{ books: BalbharatiBook[]; year: string } | { error: string }> {
  const first = await getPage(BALBHARATI_LIBRARY, { timeoutMs: 90_000 });
  if (!first.ok) return { error: first.error };
  let html = first.text;
  const year = hidden(html, "txtyear") || /id="txtyear"[^>]*value="(\d{4})"/.exec(html)?.[1] || "";
  const books = new Map<string, BalbharatiBook>();
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const res = await getPage(BALBHARATI_LIBRARY, {
      timeoutMs: 90_000,
      form: {
        __EVENTTARGET: "upMain",
        __EVENTARGUMENT: `${filter}#${page}`,
        __VIEWSTATE: hidden(html, "__VIEWSTATE"),
        __VIEWSTATEGENERATOR: hidden(html, "__VIEWSTATEGENERATOR"),
        __EVENTVALIDATION: hidden(html, "__EVENTVALIDATION"),
        txtSelected: filter,
        txtyear: year,
      },
    });
    if (!res.ok) {
      if (books.size === 0) return { error: res.error };
      break;
    }
    html = res.text;
    pages = Number(/id="lblNoOfPages"[^>]*>(\d+)</.exec(html)?.[1] ?? 1);
    for (const b of balbharatiBooks(html)) books.set(b.id, b);
  }
  return { books: [...books.values()], year };
}

async function discoverBalbharati(): Promise<Item[]> {
  const licence = await licenceFrom(BALBHARATI_LICENCE);
  const listing = await balbharatiListing("303 101");
  if ("error" in listing) {
    refuse("balbharati", "Balbharati", "balbharati", BALBHARATI_LIBRARY, listing.error, licence, "textbook");
    return [];
  }
  const items: Item[] = [];
  for (const book of listing.books) {
    if (OTHER_LANGUAGE.test(book.title)) continue;
    const grade = balbharatiGrade(book.title);
    if (!grade || grade > 12 || !gradeWanted(grade)) continue;
    const named = book.title.replace(/^\s*[०-९]{1,2}\s*\S+\s*/, "").replace(/\s*इंग्रजी\s*$/, "");
    const subject = BALBHARATI_SUBJECTS.find(([re]) => re.test(named))?.[1] ?? "Other";
    items.push({
      title: book.title,
      board: "Balbharati (Maharashtra State Bureau of Textbook Production and Curriculum Research)",
      gradeOrProgramme: String(grade),
      subject,
      language: "en",
      edition: null,
      year: listing.year || null,
      licence,
      source: "balbharati",
      kind: "textbook",
      folder: join("balbharati", String(grade), slug(subject)),
      file: `${book.id}.pdf`,
      sourceUrl: book.url,
      extra: { bookId: book.id, medium: "English" },
    });
  }
  return items;
}

/* ---- NIOS ----------------------------------------------------------------- */

const NIOS = "https://nios.ac.in/";
const NIOS_LICENCE = "https://nios.ac.in/terms-conditions.aspx";
const NIOS_LANGUAGE_COURSE = /hindi|urdu|sanskrit|arabic|persian|regional|telugu|gujrati|gujarati|bengali|bangla|marathi|tamil|kannada|malayalam|odia|oriya|punjabi|assamese|nepali|sindhi|BGP|medium/i;
const NIOS_NOT_COURSE = /notification|prospectus|Course_Bifurcation|DAISY|worksheet|_WS_|FAQ|circular|admission|result|Sample|QP|question/i;
const NIOS_OTHER_LANGUAGE = /hindi|\/H\/|_H_|_hin|urdu|marathi|gujarati|bengali|tamil|telugu|kannada|malayalam|odia|punjabi|assamese/i;

async function discoverNios(): Promise<Item[]> {
  const licence = await licenceFrom(NIOS_LICENCE);
  const items: Item[] = [];
  for (const [level, grade] of [["secondary-courses", 10], ["sr-secondary-courses", 12]] as const) {
    if (!gradeWanted(grade)) continue;
    const index = `${NIOS}online-course-material/${level}.aspx`;
    const page = await getPage(index);
    if (!page.ok) {
      refuse("nios", "NIOS", "nios", index, page.error, licence, "course");
      continue;
    }
    const courses = new Map<string, string>();
    for (const a of anchors(page.text, index)) {
      const path = new URL(a.href).pathname;
      if (!path.toLowerCase().startsWith(`/online-course-material/${level}/`)) continue;
      if (NIOS_LANGUAGE_COURSE.test(path) && !/english/i.test(path)) continue;
      if (!a.text || NIOS_LANGUAGE_COURSE.test(a.text) && !/english/i.test(a.text)) continue;
      if (!courses.has(a.href)) courses.set(a.href, a.text);
    }
    for (const [courseUrl, courseName] of courses) {
      const course = await getPage(courseUrl);
      if (!course.ok) {
        refuse("nios", "NIOS", "nios", courseUrl, course.error, licence, "course");
        continue;
      }
      const subject = courseName.replace(/\s+/g, " ").trim();
      const seen = new Set<string>();
      for (const a of anchors(course.text, courseUrl)) {
        const url = new URL(a.href);
        if (!/\.pdf$/i.test(url.pathname) || !/nios\.ac\.in$/i.test(url.hostname)) continue;
        if (!url.pathname.toLowerCase().startsWith("/media/documents/")) continue;
        if (NIOS_NOT_COURSE.test(url.pathname) || NIOS_OTHER_LANGUAGE.test(decodeURIComponent(url.pathname))) continue;
        // The link's own words say the medium when the path does not ("Book 1 (Hindi Medium)"), and a
        // title in Devanagari is a Hindi or Sanskrit book (Natyakala's chapters).
        if (NIOS_OTHER_LANGUAGE.test(a.text) || /sanskrit/i.test(a.text + url.pathname) || /[\u0900-\u097F]/.test(a.text)) continue;
        const parts = decodeURIComponent(url.pathname).split("/").filter(Boolean);
        const file = `${slug(parts.at(-2) ?? "", 30)}-${fileNameFrom(a.href)}`.replace(/^-/, "");
        if (seen.has(file)) continue;
        seen.add(file);
        items.push({
          title: `${subject} — ${a.text || parts.at(-1)}`.slice(0, 200),
          board: "NIOS",
          gradeOrProgramme: String(grade),
          subject,
          language: "en",
          edition: null,
          year: null,
          licence,
          source: "nios",
          kind: "course",
          folder: join("nios", String(grade), slug(subject)),
          file,
          sourceUrl: a.href,
          extra: { level: level === "secondary-courses" ? "Secondary" : "Senior Secondary", coursePage: courseUrl },
        });
      }
    }
  }
  return items;
}

/* ---- glossaries ----------------------------------------------------------- */

async function discoverGlossaries(): Promise<Item[]> {
  const items: Item[] = [];
  const ncertLicence: Licence = { url: NCERT_LICENCE_URL };
  const page = `${NCERT}trilingual_dictionaries.php?ln=en`;
  const tri = await getPage(page);
  if (!tri.ok) refuse("glossaries", "NCERT", "ncert", page, tri.error, ncertLicence, "glossary");
  else {
    for (const a of anchors(tri.text, NCERT)) {
      const path = new URL(a.href).pathname;
      if (!/\/otherpublications\/[^/]+\.pdf$/i.test(path) || /urdu/i.test(path)) continue;
      const name = fileNameFrom(a.href);
      const subject = /socio/i.test(name) ? "Sociology" : /eco/i.test(name) ? "Economics" : /hist/i.test(name) ? "History" : /geo|tidog/i.test(name) ? "Geography" : "General";
      items.push({
        title: `NCERT trilingual dictionary — ${subject}`,
        board: "NCERT",
        gradeOrProgramme: "glossary",
        subject,
        language: "en+hi",
        edition: null,
        year: null,
        licence: ncertLicence,
        source: "glossaries",
        kind: "glossary",
        folder: join("ncert", "glossary", slug(subject)),
        file: name,
        sourceUrl: a.href,
        extra: { listedOn: page },
      });
    }
  }
  // Balbharati: word lists in the library's "Other Books" (107) in any medium; bilingual by nature.
  const licence = await licenceFrom(BALBHARATI_LICENCE);
  const listing = await balbharatiListing("107");
  if ("error" in listing) refuse("glossaries", "Balbharati", "balbharati", BALBHARATI_LIBRARY, listing.error, licence, "glossary");
  else {
    for (const book of listing.books) {
      if (!/शब्दकोश|शब्दसंग्रह|पारिभाषिक|परिभाषा|कोश|glossary|dictionary/i.test(book.title)) continue;
      items.push({
        title: book.title,
        board: "Balbharati (Maharashtra State Bureau of Textbook Production and Curriculum Research)",
        gradeOrProgramme: "glossary",
        subject: "Glossary",
        language: "mr+en",
        edition: null,
        year: listing.year || null,
        licence,
        source: "glossaries",
        kind: "glossary",
        folder: join("balbharati", "glossary", "glossary"),
        file: `${book.id}.pdf`,
        sourceUrl: book.url,
        extra: { bookId: book.id },
      });
    }
    if (!items.some((i) => i.board.startsWith("Balbharati"))) {
      refusals.push({ source: "glossaries", board: "Balbharati", url: BALBHARATI_LIBRARY, error: "the library's Other Books list carries no glossary or word list by title", folder: "balbharati" });
    }
  }
  return items;
}

/* ---- syllabi -------------------------------------------------------------- */

type SyllabusSite = {
  key: string;
  board: string;
  seeds: string[];
  licence: string;
  /** Keeps a PDF link from a seed or followed page. */
  keep: (href: string, text: string) => boolean;
  /** Follows an HTML link from a seed page one level down (same host only). */
  follow?: (href: string, text: string) => boolean;
  programme?: (href: string, text: string) => string;
};

const SYLLABUS_WORDS = /syllab|curricul|course[-_ ]?structure/i;

const SYLLABUS_SITES: SyllabusSite[] = [
  {
    key: "aicte",
    board: "AICTE",
    seeds: ["https://www.aicte.gov.in/education/model-syllabus"],
    licence: "https://www.aicte.gov.in/terms-conditions",
    keep: (href) => /\/downloads\/msyllabus\//i.test(href) || /model[_ -]?curricul/i.test(href),
    programme: (href) => {
      const p = decodeURIComponent(new URL(href).pathname).split("/");
      const i = p.findIndex((s) => /msyllabus/i.test(s));
      return (i >= 0 && p.length - i > 2 ? p[i + 1] : undefined) ?? "model-curriculum";
    },
  },
  {
    key: "pci",
    board: "PCI",
    seeds: ["https://www.pci.nic.in/"],
    licence: "https://www.pci.nic.in/",
    keep: (href, text) => SYLLABUS_WORDS.test(href) || SYLLABUS_WORDS.test(text),
    programme: (href) => (/m[_ ]?pharm/i.test(href) ? "M.Pharm" : /b[_ ]?pharm/i.test(href) ? "B.Pharm" : /ER|D[_ .]?Pharm/i.test(href) ? "D.Pharm" : "pharmacy"),
  },
  {
    key: "mpkv",
    board: "MPKV (Mahatma Phule Krishi Vidyapeeth)",
    seeds: ["https://mpkv.ac.in/Education/EduCourseBachlor", "https://mpkv.ac.in/Education/EduCourseDiploma", "https://mpkv.ac.in/Education/EduCourseDoctoral", "https://mpkv.ac.in/Education/EduCirtificateCourse", "https://mpkv.ac.in/Education/EduAcademicRegulations"],
    licence: "https://mpkv.ac.in/",
    keep: (href) => /\/Uploads\/Education\//i.test(href) || SYLLABUS_WORDS.test(href),
    programme: (_href, text) => text || "agriculture",
  },
  {
    key: "icar",
    board: "ICAR",
    seeds: ["https://icar.org.in/"],
    licence: "https://icar.org.in/",
    keep: (href, text) => SYLLABUS_WORDS.test(href) || /dean/i.test(text) || SYLLABUS_WORDS.test(text),
    follow: (href, text) => /education|dean|syllab|curricul/i.test(href + " " + text),
  },
  { key: "muhs", board: "MUHS", seeds: ["https://www.muhs.ac.in/"], licence: "https://www.muhs.ac.in/", keep: (href, text) => SYLLABUS_WORDS.test(href + " " + text), follow: (href, text) => SYLLABUS_WORDS.test(href + " " + text) },
  { key: "bci", board: "BCI", seeds: ["https://www.barcouncilofindia.org/"], licence: "https://www.barcouncilofindia.org/", keep: (href, text) => SYLLABUS_WORDS.test(href + " " + text) || /legal[-_ ]education/i.test(href), follow: (href, text) => /legal[-_ ]education|rules/i.test(href + " " + text) },
  { key: "ncte", board: "NCTE", seeds: ["https://ncte.gov.in/"], licence: "https://ncte.gov.in/", keep: (href, text) => SYLLABUS_WORDS.test(href + " " + text), follow: (href, text) => /curricul|syllab|regulation/i.test(href + " " + text) },
  { key: "coa", board: "COA (Council of Architecture)", seeds: ["https://coa.gov.in/"], licence: "https://coa.gov.in/", keep: (href, text) => SYLLABUS_WORDS.test(href + " " + text), follow: (href, text) => /curricul|syllab|regulation|education/i.test(href + " " + text) },
];

/** A page with no links at all and a script root is a single-page app: a plain fetch cannot see its documents. */
function renderedByScript(html: string): boolean {
  return anchors(html, "https://x.invalid/").length < 3 && /<div id="root"|<app-root|static\/js\/main|umi\.[a-f0-9]+\.js/i.test(html);
}

async function discoverSyllabusSite(site: SyllabusSite): Promise<Item[]> {
  const licence = await licenceFrom(site.licence);
  const items: Item[] = [];
  const pdfs = new Map<string, string>();
  let anySeed = false;
  for (const seed of site.seeds) {
    const page = await getPage(seed, { timeoutMs: 45_000 });
    if (!page.ok) {
      refuse("syllabi", site.board, site.key, seed, page.error, licence, "syllabus");
      continue;
    }
    if (renderedByScript(page.text)) {
      refuse("syllabi", site.board, site.key, seed, "the page is rendered by script; a plain fetch sees no documents to follow", licence, "syllabus");
      continue;
    }
    anySeed = true;
    const links = anchors(page.text, page.url);
    const follow: string[] = [];
    for (const a of links) {
      if (/\.pdf($|\?)/i.test(a.href)) {
        if (site.keep(a.href, a.text)) pdfs.set(a.href, a.text);
      } else if (site.follow?.(a.href, a.text) && new URL(a.href).host === new URL(page.url).host) follow.push(a.href);
    }
    for (const next of [...new Set(follow)].slice(0, 12)) {
      const sub = await getPage(next, { timeoutMs: 45_000 });
      if (!sub.ok) continue;
      for (const a of anchors(sub.text, sub.url)) if (/\.pdf($|\?)/i.test(a.href) && site.keep(a.href, a.text)) pdfs.set(a.href, a.text);
    }
  }
  for (const [href, text] of pdfs) {
    const programme = site.programme?.(href, text) ?? "syllabus";
    items.push({
      title: (text || fileNameFrom(href).replace(/\.pdf$/i, "").replace(/_/g, " ")).slice(0, 200),
      board: site.board,
      gradeOrProgramme: programme.slice(0, 80),
      subject: "syllabus",
      language: "en",
      edition: null,
      year: null,
      licence,
      source: "syllabi",
      kind: "syllabus",
      folder: join(site.key, slug(programme), "syllabus"),
      file: fileNameFrom(href),
      sourceUrl: href,
    });
  }
  if (anySeed && pdfs.size === 0) {
    refusals.push({ source: "syllabi", board: site.board, url: site.seeds[0] ?? "", error: "no syllabus document linked from the pages a plain fetch can read", folder: site.key });
  }
  return dedupe(items);
}

/**
 * SPPU publishes its syllabi in SharePoint document libraries (collegecirculars.unipune.ac.in), one
 * library per academic year. The list views load their rows by script, but each item's display
 * form is a plain page naming the file; the library's RSS feed gives the newest item id, and the
 * ids below it are read one by one. The libraries in force: 2024, 2025, 2026.
 */
const SPPU_HOST = "http://collegecirculars.unipune.ac.in";
const SPPU_LIBRARIES = ["Syllabus2024", "Syllabus2025", "Syllabus%202026"];

async function discoverSppu(): Promise<Item[]> {
  const licence: Licence = { url: "https://www.unipune.ac.in/" };
  const items: Item[] = [];
  for (const library of SPPU_LIBRARIES) {
    const view = `${SPPU_HOST}/sites/documents/${library}/Forms/AllItems.aspx`;
    const page = await getPage(view, { timeoutMs: 60_000 });
    if (!page.ok) {
      refuse("syllabi", "SPPU", "sppu", view, page.error, licence, "syllabus");
      continue;
    }
    const listId = /ctx\.listName = "(\{[0-9A-F-]+\})"/i.exec(page.text)?.[1];
    if (!listId) {
      refuse("syllabi", "SPPU", "sppu", view, "no list id on the library page", licence, "syllabus");
      continue;
    }
    const feed = await getPage(`${SPPU_HOST}/sites/documents/_layouts/listfeed.aspx?List=${encodeURIComponent(listId)}`, { timeoutMs: 60_000 });
    const ids = feed.ok ? [...feed.text.matchAll(/DispForm\.aspx\?ID=(\d+)/g)].map((m) => Number(m[1])) : [];
    const top = ids.length ? Math.max(...ids) : 0;
    if (!top) {
      refuse("syllabi", "SPPU", "sppu", view, feed.ok ? "the library's feed lists no items" : feed.error, licence, "syllabus");
      continue;
    }
    const year = /(\d{4})/.exec(decodeURIComponent(library))?.[1] ?? null;
    if (DRY) {
      // Reading every display form is the slow part of a real run; a dry run counts by the newest id.
      tally("syllabi").discovered += top;
      console.log(`[syllabi] SPPU ${decodeURIComponent(library)}: up to ${top} items (by the feed's newest id; not read in a dry run)`);
      continue;
    }
    let misses = 0;
    for (let id = top; id >= 1; id--) {
      const form = await getPage(`${SPPU_HOST}/sites/documents/${library}/Forms/DispForm.aspx?ID=${id}`, { timeoutMs: 60_000 });
      if (!form.ok) {
        if (++misses > 400) break;
        continue;
      }
      const href = /href="(\/sites\/documents\/[^"]+\.pdf)"/i.exec(form.text)?.[1];
      if (!href) continue;
      const text = stripTags(form.text);
      const faculty = /Faculty\s+(Faculty of [A-Za-z ,&;-]+?)(?:\s+Course|\s+Date|$)/.exec(text)?.[1]?.trim() ?? "faculty";
      const course = /Course\s+([A-Z]{1,4}\)\s*[\s\S]+?)(?:\s+Date|\s+Circular|\s+Created|$)/.exec(text)?.[1]?.trim().slice(0, 80) ?? "";
      const url = `${SPPU_HOST}${href}`;
      const file = fileNameFrom(url);
      items.push({
        title: decodeURIComponent(posix.basename(href)).replace(/\.pdf$/i, ""),
        board: "SPPU (Savitribai Phule Pune University)",
        gradeOrProgramme: faculty,
        subject: course || "syllabus",
        language: "en",
        edition: null,
        year,
        licence,
        source: "syllabi",
        kind: "syllabus",
        folder: join("sppu", slug(faculty), slug(course || "syllabus")),
        file,
        sourceUrl: url,
        extra: { library: decodeURIComponent(library), itemId: id },
      });
    }
  }
  return dedupe(items);
}

/* ---- the run -------------------------------------------------------------- */

async function runSource(source: SourceKey): Promise<void> {
  const started = Date.now();
  console.log(`[${source}] discovering…`);
  if (source === "syllabi") {
    // Each site is its own host: discover and fetch them side by side, one request at a time per host.
    await Promise.all([
      (async () => {
        const items = await discoverSppu();
        console.log(`[syllabi] SPPU: ${items.length} files listed`);
        await fetchAll("syllabi", items);
      })(),
      ...SYLLABUS_SITES.map(async (site) => {
        const items = await discoverSyllabusSite(site);
        console.log(`[syllabi] ${site.board}: ${items.length} files listed`);
        await fetchAll("syllabi", items);
      }),
    ]);
  } else {
    const items = source === "ncert" ? await discoverNcert() : source === "balbharati" ? await discoverBalbharati() : source === "nios" ? await discoverNios() : await discoverGlossaries();
    console.log(`[${source}] ${items.length} files listed`);
    await fetchAll(source, items);
    if (source === "ncert" && !DRY) await ncertZipFallback();
  }
  console.log(`[${source}] done in ${Math.round((Date.now() - started) / 1000)} s`);
}

function printTable() {
  const rows = SOURCES.filter((s) => tallies.has(s) || refusals.some((r) => r.source === s));
  const head = ["source", "listed", "new", "present", "failed", "absent (optional)", "MB this run"];
  const body = rows.map((s) => {
    const t = tally(s);
    return [s, t.discovered, t.fetched, t.present, t.failed, t.optionalMissing, (t.bytes / 1e6).toFixed(1)].map(String);
  });
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((r) => (r[i] ?? "").length)));
  const line = (r: string[]) => r.map((c, i) => c.padEnd(widths[i] ?? 0)).join("  ");
  console.log(`\nCorpus ${DRY ? "dry run (nothing downloaded)" : "fetch"} — ${CORPUS_ROOT}`);
  console.log(line(head));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const r of body) console.log(line(r));
  if (refusals.length) {
    console.log(`\nRefused or unreadable (${refusals.length}), recorded with fetched: false:`);
    for (const r of refusals) console.log(`  ${r.source.padEnd(10)} ${r.board.padEnd(12)} ${r.url} — ${r.error}`);
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("corpus:fetch is a laptop job; refusing under NODE_ENV=production");
  const wanted: SourceKey[] = SOURCE_ARG === "all" ? SOURCES : (SOURCE_ARG.split(",") as SourceKey[]);
  for (const s of wanted) if (!SOURCES.includes(s)) throw new Error(`unknown source "${s}" — one of ${SOURCES.join(", ")} or all`);
  for (const g of [...(GRADES ?? []), ...FIRST]) if (!(g >= 1 && g <= 12)) throw new Error("--grade and --first take classes from 1 to 12, comma-separated");
  mkdirSync(CORPUS_ROOT, { recursive: true });
  console.log(`User-Agent: ${USER_AGENT}\nPause between requests to one host: ${PAUSE_MS} ms${DRY ? "\nDRY RUN: index pages only, no downloads" : ""}`);
  await Promise.all(wanted.map((s) => runSource(s).catch((e) => console.error(`[${s}] stopped: ${describeError(e)}`))));
  printTable();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
