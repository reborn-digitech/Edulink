/**
 * The "papers" source of the corpus fetcher (10 October 2026; docs/plans/assistant-and-quiz-bank.md §8
 * item 6, runbook docs/runbooks/assistant-local.md §8): the PUBLIC past question papers of the national
 * and state entrance tests and the olympiads, and the boards' sample papers, from the bodies' own sites
 * only — never a coaching site or a mirror. A STYLE corpus for the quiz bank's difficulty levels 5
 * (competitive) and 6 (olympiad): the ingest marks every document styleOnly, the tutor never cites it,
 * and the generator reads it through papersStyleFor (src/lib/quiz-style.ts).
 *
 *   JEE (Advanced)  jeeadv.ac.in/archive.html                  the organising IIT's archive, 2007 on, English
 *   JEE (Main)      jeemain.nta.nic.in (its "Question Papers")  NTA; the current session's B.Tech papers
 *   NEET (UG)       neet.nta.nic.in/archive/                    NTA; one English set a year
 *   MHT-CET         cetcell.mahacet.org                         the State CET Cell
 *   NTSE            ncert.nic.in/national-talent-examination    NCERT
 *   CUET (UG)       cuet.nta.nic.in                             NTA's sample papers
 *   INMO, RMO, IOQM and the Indian National Olympiads           olympiads.hbcse.tifr.res.in (HBCSE)
 *   NSEP, NSEC, NSEB, NSEA, NSEJS                               iapt.org.in (IAPT), its NSE year pages
 *   CBSE Class X and XII sample papers and marking schemes      cbseacademic.nic.in, sessions 2022-23 on
 *   MSBSHSE sample papers                                       mahahsscboard.in
 *
 * Every file is English (or bilingual with English); a Hindi or regional-language copy of a paper the
 * page also gives in English is not taken. Result lists, admit cards, OMR sheets, answer booklets and
 * notices are never taken: a result list names children. A site that will not show its papers to a plain
 * request is recorded with `fetched: false` and the reason (refuse()), never fetched around; a PDF the
 * page says is locked with a password is recorded and not opened.
 *
 * Discovery is pure where it can be (the page parsers below take HTML and return items, for the
 * tests); the network goes through the fetcher's own polite helpers, passed in as `PapersNet`.
 */
import { join, posix } from "node:path";
import { slug, type ContentKind, type Licence, type ManifestEntry, type PaperKind, type PaperMeta } from "./corpus-lib";

export type PaperItem = Omit<ManifestEntry, "retrievedAt" | "sha256" | "bytes" | "fetched" | "error" | "file"> & {
  folder: string;
  file: string;
  optional?: boolean;
  paper: PaperMeta;
};

type PageResult = { ok: true; text: string; url: string } | { ok: false; error: string };

/** The fetcher's helpers: one request at a time per host, its User-Agent, its refusal rows. */
export type PapersNet = {
  getPage: (url: string, init?: { timeoutMs?: number }) => Promise<PageResult>;
  /** Writes `<folder>/_refused/index/manifest.json` with `fetched: false`, as the fetcher does for MUHS. */
  refuse: (board: string, folder: string, url: string, error: string, licence: Licence, kind: ContentKind) => void;
  log: (line: string) => void;
};

/* ---- small HTML helpers (pure) -------------------------------------------- */

export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

export function textOf(html: string): string {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** A link with the words around it: its cell's, its table column's heading, the page heading above it. */
export type LinkInContext = { href: string; text: string; before: string; after: string; cell: string; column: string; heading: string };

/**
 * Every link of a page with its context, read in one pass over the tags: the text of the table cell or
 * list item it sits in, the text just before and after it within that cell (up to the neighbouring
 * links), its column's heading when the table's first row is a heading row, and the last h1–h4 above it.
 */
export function linksWithContext(html: string, base: string): LinkInContext[] {
  const out: LinkInContext[] = [];
  const clean = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  const re = /<(\/?)(a|td|th|tr|table|li|p|h[1-4])\b([^>]*)>/gi;
  let pos = 0;
  let heading = "";
  let headingBuf: string | null = null;
  let cellBuf = "";
  let cellLinks: LinkInContext[] = [];
  let sinceLink = "";
  let link: { href: string; text: string; before: string } | null = null;
  let rowIndex = 0;
  let cellIndex = -1;
  let headers: string[] = [];
  let rowCells: string[] = [];
  /** Inside a table cell, a paragraph or a list item is part of the cell, not a cell of its own. */
  let inCell = 0;
  let rowHasLinks = false;
  const closeCell = () => {
    const cell = cellBuf.replace(/\s+/g, " ").trim();
    for (const l of cellLinks) l.cell = cell;
    if (cellLinks.length) cellLinks[cellLinks.length - 1]!.after = sinceLink.replace(/\s+/g, " ").trim();
    rowCells.push(cell);
    cellBuf = "";
    cellLinks = [];
    sinceLink = "";
  };
  for (let m = re.exec(clean); m; m = re.exec(clean)) {
    const text = decodeEntities(clean.slice(pos, m.index).replace(/<[^>]+>/g, " "));
    pos = m.index + m[0].length;
    cellBuf += text;
    sinceLink += text;
    if (link) link.text += text;
    if (headingBuf !== null) headingBuf += text;
    const closing = m[1] === "/";
    const tag = (m[2] ?? "").toLowerCase();
    if (tag === "a") {
      if (!closing) {
        const href = /href\s*=\s*["']([^"']+)["']/i.exec(m[3] ?? "")?.[1];
        if (href && !/^(javascript:|mailto:|#)/i.test(href.trim())) {
          if (cellLinks.length) cellLinks[cellLinks.length - 1]!.after = sinceLink.replace(/\s+/g, " ").trim();
          link = { href: decodeEntities(href.trim()), text: "", before: sinceLink.replace(/\s+/g, " ").trim() };
        }
      } else if (link) {
        let href: string | null = null;
        try {
          href = new URL(link.href, base).toString();
        } catch {
          href = null;
        }
        if (href) {
          const l: LinkInContext = { href, text: link.text.replace(/\s+/g, " ").trim(), before: link.before, after: "", cell: "", column: headers[cellIndex] ?? "", heading };
          out.push(l);
          cellLinks.push(l);
          rowHasLinks = true;
        }
        link = null;
        sinceLink = "";
      }
    } else if (/^h[1-4]$/.test(tag)) {
      if (!closing) headingBuf = "";
      else if (headingBuf !== null) {
        heading = headingBuf.replace(/\s+/g, " ").trim();
        headingBuf = null;
      }
    } else if (tag === "td" || tag === "th" || ((tag === "li" || tag === "p") && inCell === 0)) {
      const isCell = tag === "td" || tag === "th";
      if (!closing) {
        if (isCell) {
          cellIndex++;
          inCell++;
        }
        if (cellLinks.length || cellBuf.trim()) closeCell();
        else {
          cellBuf = "";
          sinceLink = "";
        }
      } else {
        if (isCell) inCell = Math.max(0, inCell - 1);
        closeCell();
      }
    } else if (tag === "tr") {
      if (!closing) {
        cellIndex = -1;
        rowCells = [];
        inCell = 0;
        rowHasLinks = false;
      } else {
        // The first row of a table whose cells carry no links is its heading row.
        if (rowIndex === 0 && rowCells.length && !rowHasLinks) headers = [...rowCells];
        rowIndex++;
      }
    } else if (tag === "table") {
      rowIndex = 0;
      headers = [];
    }
  }
  if (cellLinks.length) closeCell();
  return out;
}

export function fileNameFrom(url: string): string {
  const base = decodeURIComponent(posix.basename(new URL(url).pathname));
  return base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").slice(0, 120) || "file.pdf";
}

const isPdf = (href: string) => /\.pdf(?:$|[?#])/i.test(new URL(href).pathname + new URL(href).search);
const basenameOf = (href: string) => decodeURIComponent(posix.basename(new URL(href).pathname));

/** A four-digit year from 1980 to 2039 not inside a longer number ("INAO2025-Question" → 2025; "20220215100" → none). */
export function fourDigitYear(s: string): string | null {
  return /(?<!\d)(19[89]\d|20[0-3]\d)(?!\d)/.exec(s)?.[1] ?? null;
}

/** The year of a date stamped in a file's name ("INAO-Solutions-20250221.pdf" → 2025). */
export function stampedYear(s: string): string | null {
  return /(?<!\d)(20[0-3]\d)(?:0[1-9]|1[0-2])(?:[0-2]\d|3[01])(?!\d)/.exec(s)?.[1] ?? null;
}

/** The page's own copyright line ("© 2026 Olympiads, HBCSE"), the published terms when a site prints nothing more. */
export function copyrightLine(html: string): string | undefined {
  const t = textOf(html);
  const m = /(?:©|\(c\)|copyright)\s*[^|]{0,200}?(?:reserved\.?|\d{4}[^.|]{0,80}|$)/i.exec(t);
  return m ? m[0].trim().slice(0, 300) : undefined;
}

/** A terms page's own paragraph, from its first words to its last, as published. */
export function termsSlice(html: string, from: string, to: string): string | undefined {
  const t = textOf(html);
  const i = t.indexOf(from);
  if (i < 0) return undefined;
  const j = t.indexOf(to, i);
  return t.slice(i, j < 0 ? i + 1500 : j + to.length).slice(0, 3000);
}

/** A single-page app: a plain fetch sees a script and no documents (the MSBSHSE site is SvelteKit). */
export function renderedByScript(html: string): boolean {
  const links = (html.match(/<a\b[^>]*href/gi) ?? []).length;
  return links < 3 && /<div id="root"|<app-root|static\/js\/main|data-sveltekit|__sveltekit|_next\/static|ng-version/i.test(html);
}

/* ---- the item --------------------------------------------------------------- */

type Draft = {
  href: string;
  title: string;
  body: string;
  bodyKey: string;
  board: string;
  test: string;
  sitting: string | null;
  part: PaperMeta["part"];
  kind: PaperKind;
  band: string;
  subject: string;
  year: string | null;
  language?: string;
  licence: Licence;
  listedOn: string;
  linkText: string;
  textInPictures?: boolean;
  twoColumns?: boolean;
};

export function itemOf(d: Draft): PaperItem {
  const level: 5 | 6 = d.kind === "olympiad-paper" ? 6 : 5;
  const file = `${slug(d.test, 24)}-${d.year ? slug(d.year, 9) : "undated"}-${fileNameFrom(d.href)}`.slice(0, 160);
  return {
    title: d.title.slice(0, 200),
    board: d.board,
    gradeOrProgramme: d.band,
    subject: d.subject,
    language: d.language ?? "en",
    edition: null,
    year: d.year,
    sourceUrl: d.href,
    licence: d.licence,
    source: "papers",
    kind: d.kind,
    folder: join("papers", d.bodyKey, slug(d.band), slug(d.test, 30)),
    file,
    paper: { body: d.body, test: d.test, sitting: d.sitting, part: d.part, level, listedOn: d.listedOn, linkText: d.linkText.slice(0, 300), ...(d.textInPictures ? { textInPictures: true } : {}), ...(d.twoColumns ? { twoColumns: true } : {}) },
    extra: { body: d.body, test: d.test, sitting: d.sitting, part: d.part, level },
  };
}

function dedupe(items: PaperItem[]): PaperItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.folder}/${i.file}`;
    const u = i.sourceUrl;
    if (seen.has(k) || seen.has(u)) return false;
    seen.add(k);
    seen.add(u);
    return true;
  });
}

/* ---- JEE (Advanced): the organising IIT's archive ---------------------------- */

export const JEE_ADVANCED_ARCHIVE = "https://jeeadv.ac.in/archive.html";

/** past_qps/2025_1_English.pdf, past_qps/2018_2.pdf; the Hindi copies and the architecture test (AAT, a drawing test) are not taken. */
export function parseJeeAdvanced(html: string, base: string, licence: Licence): PaperItem[] {
  const organiser = /Indian Institute of Technology [A-Z][a-z]+(?: [A-Z][a-z]+)?/.exec(textOf(html))?.[0] ?? null;
  const items: PaperItem[] = [];
  for (const l of linksWithContext(html, base)) {
    if (!isPdf(l.href)) continue;
    const m = /past_qps\/(\d{4})_(\d)(?:_(English|Hindi))?\.pdf$/i.exec(new URL(l.href).pathname);
    if (!m || m[3]?.toLowerCase() === "hindi") continue;
    const [, year, paper] = m;
    items.push(itemOf({
      href: l.href,
      title: `JEE (Advanced) ${year}, Paper ${paper}`,
      body: organiser ? `JEE (Advanced), the organising IIT (${organiser} in the archive's current year)` : "JEE (Advanced), the organising IIT",
      bodyKey: "jee-advanced",
      board: "JEE (Advanced) (the organising IIT)",
      test: "JEE (Advanced)",
      sitting: `Paper ${paper}`,
      part: "paper",
      kind: "entrance-paper",
      band: "11-12",
      subject: "Physics, Chemistry, Mathematics",
      year: year ?? null,
      licence,
      listedOn: base,
      linkText: `${l.cell || l.before} ${l.text}`.trim(),
    }));
  }
  return dedupe(items);
}

/* ---- NTA: JEE (Main), NEET (UG), CUET (UG) ----------------------------------- */

export const JEE_MAIN_HOME = "https://jeemain.nta.nic.in/";
export const NEET_ARCHIVE = "https://neet.nta.nic.in/archive/";
export const CUET_HOME = "https://cuet.nta.nic.in/";
const NTA_TERMS = ["Material featured on this site", "copyright holders concerned."] as const;

/** NTA's "Question Papers" menu on the JEE (Main) home page: "B Tech 2nd Apr 2026 Shift 1". The B.Arch / B.Planning papers (drawing) are not taken. */
export function parseJeeMain(html: string, base: string, licence: Licence): PaperItem[] {
  const items: PaperItem[] = [];
  for (const l of linksWithContext(html, base)) {
    if (!isPdf(l.href)) continue;
    const m = /^B\.?\s*Tech\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(\d{4})\s+Shift\s*(\d)$/i.exec(l.text);
    if (!m) continue;
    const [, day, month, year, shift] = m;
    items.push(itemOf({
      href: l.href,
      title: `JEE (Main) ${year}, Paper 1 (B.E./B.Tech.), ${day} ${month} ${year}, Shift ${shift}`,
      body: "NTA (National Testing Agency)",
      bodyKey: "nta",
      board: "NTA (National Testing Agency)",
      test: "JEE (Main)",
      sitting: `Paper 1 (B.E./B.Tech.), ${day} ${month} ${year}, Shift ${shift}`,
      part: "paper",
      kind: "entrance-paper",
      band: "11-12",
      subject: "Physics, Chemistry, Mathematics",
      year: year ?? null,
      licence,
      listedOn: base,
      linkText: l.text,
      textInPictures: true,
    }));
  }
  return dedupe(items);
}

/** NEET's archive: "English Set E1 NEET QP 2020". One English set a year (the sets are the same questions reordered); the first by set code. */
export function parseNeet(html: string, base: string, licence: Licence): PaperItem[] {
  const byYear = new Map<string, { l: LinkInContext; set: string }>();
  for (const l of linksWithContext(html, base)) {
    if (!isPdf(l.href)) continue;
    const m = /^English\s+Set\s+([A-Z]\d{1,2})\s+NEET\s+QP\s+(\d{4})$/i.exec(l.text);
    if (!m) continue;
    const [, set, year] = m as unknown as [string, string, string];
    const have = byYear.get(year);
    if (!have || set.localeCompare(have.set, "en", { numeric: true }) < 0) byYear.set(year, { l, set });
  }
  return [...byYear].map(([year, { l, set }]) => itemOf({
    href: l.href,
    title: `NEET (UG) ${year}, English, Set ${set}`,
    body: "NTA (National Testing Agency)",
    bodyKey: "nta",
    board: "NTA (National Testing Agency)",
    test: "NEET (UG)",
    sitting: `Set ${set}`,
    part: "paper",
    kind: "entrance-paper",
    band: "11-12",
    subject: "Physics, Chemistry, Biology",
    year,
    licence,
    listedOn: base,
    linkText: l.text,
    twoColumns: true,
  }));
}

/** CUET (UG) sample papers, if NTA links any: a PDF whose link says sample, mock or model paper; the answer-key notices are not papers. */
export function parseCuet(html: string, base: string, licence: Licence): PaperItem[] {
  const items: PaperItem[] = [];
  for (const l of linksWithContext(html, base)) {
    if (!isPdf(l.href) || !/sample|mock|model (?:question )?paper/i.test(l.text) || /answer key|recorded response|challenge|notice/i.test(l.text)) continue;
    const year = fourDigitYear(l.text) ?? fourDigitYear(l.before);
    items.push(itemOf({ href: l.href, title: `CUET (UG) ${l.text}`, body: "NTA (National Testing Agency)", bodyKey: "nta", board: "NTA (National Testing Agency)", test: "CUET (UG)", sitting: l.text, part: "paper", kind: "entrance-paper", band: "12", subject: "General", year, licence, listedOn: base, linkText: l.text }));
  }
  return dedupe(items);
}

/* ---- HBCSE: the olympiads' past papers ------------------------------------- */

export const HBCSE_PAST_PAPERS = "https://olympiads.hbcse.tifr.res.in/how-to-prepare/past-papers/";

type Olympiad = { re: RegExp; test: string; subject: string; band: string };
/** Most specific first: PRMO before RMO, the IOQ Part II papers of 2021–22 under the olympiad they stood for. */
const OLYMPIADS: Olympiad[] = [
  { re: /IOQM/i, test: "IOQM", subject: "Mathematics", band: "8-12" },
  { re: /PRMO|prermo/i, test: "PRMO", subject: "Mathematics", band: "8-12" },
  { re: /INMO/i, test: "INMO", subject: "Mathematics", band: "8-12" },
  { re: /C?RMO/i, test: "RMO", subject: "Mathematics", band: "8-12" },
  { re: /INJSO|IOQJS/i, test: "INJSO", subject: "Science", band: "9-10" },
  { re: /INPhO|IOQP/i, test: "INPhO", subject: "Physics", band: "11-12" },
  { re: /INChO|IOQC/i, test: "INChO", subject: "Chemistry", band: "11-12" },
  { re: /INBO|IOQB/i, test: "INBO", subject: "Biology", band: "11-12" },
  { re: /INAO|IOQA/i, test: "INAO", subject: "Astronomy", band: "11-12" },
];

function olympiadOf(...texts: string[]): Olympiad | null {
  for (const t of texts) {
    const o = OLYMPIADS.find((x) => x.re.test(t));
    if (o) return o;
  }
  return null;
}

/** "crmo-15-1", "INMO21FINAL", "IOQM_22", "sol-inmo16": a two-digit year right after the test's name. */
function twoDigitYear(name: string): string | null {
  const m = /(?:ioqm|prmo|prermo|inmo|rmo|incho|inpho|inbo|injso|inao)[-_ ]?(?:sol[-_]?)?(\d{2})(?!\d)/i.exec(name) ?? /(?:sol|qp)[-_]?(?:c?rmo|inmo)[-_]?(\d{2})(?!\d)/i.exec(name);
  return m ? `20${m[1]}` : null;
}

const HINDI = /(?:^|[-_. ])(?:hi|hin|hindi)(?:[-_. ]|$)|hindi/i;
const NOT_A_PAPER = /answer[-_ ]?booklet|answerbooklet|omr|broch|infosys|invitation|syllabus|result|merit|selected|shortlist|award|certificate|camp|admit/i;
const ANSWERS = /sol(?:ution)?s?\b|sol[-_]|[-_]sol|key|answer|anskey|ans[-_]?key|frozen/i;
const BOTH = /[-_]Q[-_]S\b|Q-S\.pdf|with[-_ ]answer[-_ ]key|paper\s*&(?:amp;)?\s*solution|problems?\s+with\s+solutions?|question\s+paper\s*&\s*(?:model\s+)?solutions?|questions?\s*&\s*solutions?|question[-_]paper[-_]with/i;

/** One olympiad file from its link and the cell around it, or null when it is not an English paper, key or solution. */
export function classifyHbcse(l: LinkInContext): { olympiad: Olympiad; part: PaperMeta["part"]; year: string | null; locked: boolean } | null {
  if (!isPdf(l.href)) return null;
  const name = basenameOf(l.href);
  const words = `${l.text} ${l.before}`;
  if (NOT_A_PAPER.test(name) || NOT_A_PAPER.test(l.text) || /sample/i.test(name)) return null;
  // A Hindi copy: by its link ("QP (Hindi)", "Hindi") or its name ("-hi.pdf", "hi.M1.pdf"); a bilingual file naming English stays.
  if ((/hindi/i.test(l.text) || HINDI.test(name)) && !/english/i.test(name)) return null;
  const olympiad = olympiadOf(name, l.before, l.text, l.cell, l.column, l.heading);
  if (!olympiad) return null;
  const part: PaperMeta["part"] = BOTH.test(name) || BOTH.test(words) ? "paper+answers" : ANSWERS.test(name) || /solution|key|answer/i.test(l.text) ? "answer-key" : "paper";
  const year = fourDigitYear(name) ?? stampedYear(name) ?? twoDigitYear(name) ?? fourDigitYear(l.before) ?? fourDigitYear(l.text) ?? fourDigitYear(l.cell);
  const locked = /password/i.test(l.after) || /password/i.test(l.text);
  return { olympiad, part, year, locked };
}

/** "CRMO 2016 Paper 3", "RMO-2025-Paper-1.pdf": which paper of a sitting with several. */
function paperNumber(s: string): string | null {
  const m = /paper[\s_-]*(\d)\b/i.exec(s);
  return m ? `Paper ${m[1]}` : null;
}

export function parseHbcse(html: string, base: string, licence: Licence): { items: PaperItem[]; locked: PaperItem[] } {
  const items: PaperItem[] = [];
  const locked: PaperItem[] = [];
  for (const l of linksWithContext(html, base)) {
    if (!/olympiads\.hbcse\.tifr\.res\.in$/i.test(new URL(l.href).hostname)) continue;
    const c = classifyHbcse(l);
    if (!c) continue;
    const what = c.part === "paper" ? "question paper" : c.part === "answer-key" ? "solutions or answer key" : "question paper and solutions";
    const item = itemOf({
      href: l.href,
      title: `${c.olympiad.test} ${c.year ?? ""} — ${what}`.replace(/\s+/g, " "),
      body: "HBCSE (Homi Bhabha Centre for Science Education, TIFR)",
      bodyKey: "hbcse",
      board: "HBCSE (Homi Bhabha Centre for Science Education, TIFR)",
      test: c.olympiad.test,
      sitting: paperNumber(`${l.before} ${l.text} ${basenameOf(l.href)}`),
      part: c.part,
      kind: "olympiad-paper",
      band: c.olympiad.band,
      subject: c.olympiad.subject,
      year: c.year,
      licence,
      listedOn: base,
      linkText: [l.column, l.before, l.text].filter(Boolean).join(" | "),
    });
    (c.locked ? locked : items).push(item);
  }
  return { items: dedupe(items), locked: dedupe(locked) };
}

/* ---- IAPT: the National Standard Examinations ------------------------------- */

export const IAPT_HOME = "https://iapt.org.in/";
export const IAPT_PAPERS = "https://iapt.org.in/papers-solution/";

type Nse = { re: RegExp; test: string; subject: string; band: string };
const NSES: Nse[] = [
  { re: /NSEJS|IOQJS|\bJS\d|junior\s*science|juniorscience/i, test: "NSEJS", subject: "Science", band: "9-10" },
  { re: /NSEA|IOQA|astronomy/i, test: "NSEA", subject: "Astronomy", band: "11-12" },
  { re: /NSEB|IOQB|biology/i, test: "NSEB", subject: "Biology", band: "11-12" },
  { re: /NSEC|IOQC|IQOC|chemistry/i, test: "NSEC", subject: "Chemistry", band: "11-12" },
  { re: /NSEP|IOQP|physics/i, test: "NSEP", subject: "Physics", band: "11-12" },
];
const IAPT_NOT_A_PAPER = /shortlist|top[_ -]?10|_ST_|_NT_|[-_ ]list|group|MAS_|result|merit|centre|center|certificate|brochure|poster|booklet|syllabus|NCIEP|NCEWP|NCICP|essay|introduction|invitation|schedule|notice|circular/i;

/** The year an NSE year page stands for: "nse-2024-25" → 2024 (the examination sits in November of the first year). */
export function iaptPageYear(url: string): string | null {
  return /nse-(\d{4})-\d{2}/i.exec(url)?.[1] ?? null;
}

export function parseIapt(html: string, base: string, licence: Licence): PaperItem[] {
  const items: PaperItem[] = [];
  const pageYear = iaptPageYear(base);
  for (const l of linksWithContext(html, base)) {
    if (!isPdf(l.href) || !/(^|\.)iapt\.org\.in$/i.test(new URL(l.href).hostname)) continue;
    const name = basenameOf(l.href);
    if (IAPT_NOT_A_PAPER.test(name) || IAPT_NOT_A_PAPER.test(l.text)) continue;
    if (!/question|paper|key|answer|solution|\d{3}\.pdf$/i.test(`${name} ${l.text}`)) continue;
    if (HINDI.test(name) || /hindi/i.test(l.text)) continue;
    // The file's own name first: a link's words are sometimes another paper's (NSE 2025's page labels NSEP's key "NSEJS").
    const nse = NSES.find((x) => x.re.test(name)) ?? NSES.find((x) => x.re.test(l.text)) ?? NSES.find((x) => x.re.test(l.before));
    if (!nse) continue;
    const part: PaperMeta["part"] = /key|answer|solution/i.test(name) || /key|answer|solution|correction/i.test(l.text) ? "answer-key" : "paper";
    const year = fourDigitYear(name) ?? pageYear ?? fourDigitYear(l.text);
    items.push(itemOf({
      href: l.href,
      title: `${nse.test} ${year ?? ""} — ${part === "paper" ? "question paper" : /correction/i.test(`${name} ${l.text}`) ? "corrections to the answer key" : /solution/i.test(`${name} ${l.text}`) ? "solutions" : "answer key"}`.replace(/\s+/g, " "),
      body: "IAPT (Indian Association of Physics Teachers)",
      bodyKey: "iapt",
      board: "IAPT (Indian Association of Physics Teachers)",
      test: nse.test,
      sitting: /code\s*(\d+)/i.exec(l.text)?.[1] ? `Code ${/code\s*(\d+)/i.exec(l.text)![1]}` : null,
      part,
      kind: "olympiad-paper",
      band: nse.band,
      subject: nse.subject,
      year,
      licence,
      listedOn: base,
      linkText: [l.before, l.text].filter(Boolean).join(" | "),
    }));
  }
  return dedupe(items);
}

/** The NSE year pages the IAPT home page links ("nse-2024-25"). */
export function iaptYearPages(html: string, base: string): string[] {
  const out = new Set<string>();
  for (const l of linksWithContext(html, base)) if (/\/nse-\d{4}-\d{2}\/?$/i.test(new URL(l.href).pathname) && /(^|\.)iapt\.org\.in$/i.test(new URL(l.href).hostname)) out.add(l.href.replace(/\/?$/, "/"));
  return [...out];
}

/* ---- CBSE: sample question papers and marking schemes ----------------------- */

export const CBSE_ACADEMIC = "https://cbseacademic.nic.in/";
export const CBSE_FIRST_SESSION = 2022;

/** The subjects taken, as CBSE's tables name them, with the subject the corpus files them under. */
const CBSE_SUBJECTS: [RegExp, string][] = [
  [/^science$/i, "Science"],
  [/^mathematics\s*\((?:standard|basic)\)$|^mathematics$|^applied mathematics$/i, "Mathematics"],
  [/^social science$/i, "Social Science"],
  [/^physics$/i, "Physics"],
  [/^chemistry$/i, "Chemistry"],
  [/^biology$/i, "Biology"],
  [/^accountancy$/i, "Accountancy"],
  [/^business studies$/i, "Business Studies"],
  [/^economics$/i, "Economics"],
  [/^geography$/i, "Geography"],
  [/^history$/i, "History"],
  [/^political science$/i, "Political Science"],
  [/^psychology$/i, "Psychology"],
  [/^sociology$/i, "Sociology"],
  [/^computer science$/i, "Computer Science"],
  [/^informatics practices$/i, "Informatics Practices"],
  [/^english\s*\(language\s*(?:&|and)\s*literature\)$|^english core$/i, "English"],
];

/** The session pages the home page and the archive link: SQP_CLASSX_2025-26.html, SQP_CLASSXII_2023-24.html. */
export function cbseSessionPages(html: string, base: string): { url: string; grade: "10" | "12"; session: string }[] {
  const out = new Map<string, { url: string; grade: "10" | "12"; session: string }>();
  for (const l of linksWithContext(html, base)) {
    const m = /SQP_CLASS(XII|X)_(\d{4})[-_](\d{2})(?:_final)?\.html$/i.exec(new URL(l.href).pathname);
    if (!m) continue;
    if (Number(m[2]) < CBSE_FIRST_SESSION) continue;
    out.set(l.href, { url: l.href, grade: m[1]!.toUpperCase() === "XII" ? "12" : "10", session: `${m[2]}-${m[3]}` });
  }
  return [...out.values()];
}

/** One session page's table: subject, SQP, MS. English copies only; the visually impaired versions and the practical papers are not taken. */
export function parseCbseSession(html: string, base: string, grade: "10" | "12", session: string, licence: Licence): PaperItem[] {
  const items: PaperItem[] = [];
  const rows = html.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    const cells = row.match(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi) ?? [];
    const subjectCell = textOf(cells[0] ?? "");
    const subject = CBSE_SUBJECTS.find(([re]) => re.test(subjectCell))?.[1];
    if (!subject || /visually|VIC/i.test(subjectCell)) continue;
    for (const l of linksWithContext(row, base)) {
      if (!isPdf(l.href)) continue;
      const name = basenameOf(l.href);
      if (/_hi\.pdf$|-hi\.pdf$|hindi/i.test(name) || /VIC/i.test(name)) continue;
      const kindOf = /-SQP\.pdf$|_SQP\.pdf$|SQP/i.test(name) ? "paper" : /-MS\.pdf$|_MS\.pdf$|MS/i.test(name) ? "answer-key" : null;
      if (!kindOf) continue;
      const variant = /\((standard|basic)\)/i.exec(subjectCell)?.[1];
      const sitting = variant ? `${subject} (${variant[0]!.toUpperCase()}${variant.slice(1).toLowerCase()})` : subjectCell !== subject ? subjectCell : null;
      const cls = grade === "10" ? "X" : "XII";
      items.push(itemOf({
        href: l.href,
        title: `CBSE Class ${cls} ${subjectCell}, ${kindOf === "paper" ? "sample question paper" : "marking scheme"}, ${session}`,
        body: "CBSE (Central Board of Secondary Education)",
        bodyKey: "cbse",
        board: "CBSE (Central Board of Secondary Education)",
        test: `CBSE Class ${cls}`,
        sitting,
        part: kindOf,
        kind: "board-sample-paper",
        band: grade,
        subject,
        year: session,
        licence,
        listedOn: base,
        linkText: `${subjectCell} | ${l.text}`,
      }));
    }
  }
  return dedupe(items);
}

/* ---- NTSE (NCERT), MHT-CET (the State CET Cell), MSBSHSE: what their pages give -- */

export const NTSE_PAGE = "https://ncert.nic.in/national-talent-examination.php?ln=en";
export const MHTCET_PAGES = ["https://cetcell.mahacet.org/", "https://cetcell.mahacet.org/syllabus-and-marking-scheme/", "https://cetcell.mahacet.org/cet/"];
export const MSBSHSE_HOME = "https://mahahsscboard.in/";

/** A question paper a page links by its words: "question paper", "test booklet", "sample paper", "previous year". */
export function questionPaperLinks(html: string, base: string): LinkInContext[] {
  return linksWithContext(html, base).filter((l) => isPdf(l.href) && /question paper|test booklet|sample (?:question )?paper|previous year|model (?:question )?paper/i.test(`${l.text} ${l.before}`) && !/setter|answer key|recorded response|challenge|notice|result|admit/i.test(l.text));
}

/* ---- discovery ----------------------------------------------------------------- */

type BodyRun = { key: string; name: string; discover: (net: PapersNet) => Promise<PaperItem[]> };

async function licenceOf(net: PapersNet, pageHtml: string | null, pageUrl: string, terms?: { url: string; from: string; to: string }): Promise<Licence> {
  if (terms) {
    const t = await net.getPage(terms.url, { timeoutMs: 45_000 });
    const text = t.ok ? termsSlice(t.text, terms.from, terms.to) : undefined;
    if (text) return { url: terms.url, text };
  }
  const line = pageHtml ? copyrightLine(pageHtml) : undefined;
  return { url: terms?.url ?? pageUrl, ...(line ? { text: line } : {}) };
}

const PAPERS_FOLDER = (key: string) => join("papers", key);

export const PAPER_BODIES: BodyRun[] = [
  {
    key: "jee-advanced",
    name: "JEE (Advanced)",
    discover: async (net) => {
      const page = await net.getPage(JEE_ADVANCED_ARCHIVE);
      const licence = await licenceOf(net, page.ok ? page.text : null, JEE_ADVANCED_ARCHIVE);
      if (!page.ok) {
        net.refuse("JEE (Advanced)", PAPERS_FOLDER("jee-advanced"), JEE_ADVANCED_ARCHIVE, page.error, licence, "entrance-paper");
        return [];
      }
      return parseJeeAdvanced(page.text, page.url, licence);
    },
  },
  {
    key: "nta",
    name: "NTA: JEE (Main), NEET (UG), CUET (UG)",
    discover: async (net) => {
      const items: PaperItem[] = [];
      for (const [site, label, parse] of [
        [JEE_MAIN_HOME, "JEE (Main)", parseJeeMain],
        [NEET_ARCHIVE, "NEET (UG)", parseNeet],
        [CUET_HOME, "CUET (UG)", parseCuet],
      ] as const) {
        const origin = new URL(site).origin;
        const licence = await licenceOf(net, null, site, { url: `${origin}/copyright-policy/`, from: NTA_TERMS[0], to: NTA_TERMS[1] });
        const page = await net.getPage(site);
        if (!page.ok) {
          net.refuse(`NTA ${label}`, PAPERS_FOLDER("nta"), site, page.error, licence, "entrance-paper");
          continue;
        }
        let found = parse(page.text, page.url, licence);
        if (label === "CUET (UG)" && found.length === 0) {
          // The syllabus page is where a sample paper would sit if NTA published one.
          const syl = await net.getPage(`${origin}/syllabus/`);
          if (syl.ok) found = parseCuet(syl.text, syl.url, licence);
        }
        if (found.length === 0) {
          net.refuse(`NTA ${label}`, PAPERS_FOLDER("nta"), site, `no ${label} question or sample paper is linked from the pages a plain fetch can read`, licence, "entrance-paper");
        }
        items.push(...found);
      }
      return items;
    },
  },
  {
    key: "mht-cet",
    name: "MHT-CET (State CET Cell, Maharashtra)",
    discover: async (net) => {
      const items: PaperItem[] = [];
      let first: string | null = null;
      const read: string[] = [];
      for (const url of MHTCET_PAGES) {
        const page = await net.getPage(url);
        if (!page.ok) continue;
        first ??= page.text;
        read.push(url);
        for (const l of questionPaperLinks(page.text, page.url)) {
          const year = fourDigitYear(l.text) ?? fourDigitYear(l.before);
          items.push(itemOf({ href: l.href, title: `MHT-CET ${l.text}`, body: "State Common Entrance Test Cell, Maharashtra", bodyKey: "mht-cet", board: "State CET Cell, Maharashtra", test: "MHT-CET", sitting: l.text, part: "paper", kind: "entrance-paper", band: "11-12", subject: /pcb/i.test(l.text) ? "Physics, Chemistry, Biology" : "Physics, Chemistry, Mathematics", year, licence: { url: MHTCET_PAGES[0]! }, listedOn: page.url, linkText: l.text }));
        }
      }
      const licence = await licenceOf(net, first, MHTCET_PAGES[0]!);
      if (items.length === 0) net.refuse("MHT-CET (State CET Cell)", PAPERS_FOLDER("mht-cet"), MHTCET_PAGES[0]!, read.length ? `the CET Cell links no question paper from the pages a plain fetch can read (${read.join(", ")}); its candidates see their own paper in the login, which is not used` : "the CET Cell's pages did not answer", licence, "entrance-paper");
      return dedupe(items).map((i) => ({ ...i, licence }));
    },
  },
  {
    key: "ntse",
    name: "NTSE (NCERT)",
    discover: async (net) => {
      const page = await net.getPage(NTSE_PAGE);
      const licence = await licenceOf(net, page.ok ? page.text : null, NTSE_PAGE);
      if (!page.ok) {
        net.refuse("NCERT (NTSE)", PAPERS_FOLDER("ncert-ntse"), NTSE_PAGE, page.error, licence, "entrance-paper");
        return [];
      }
      const papers = questionPaperLinks(page.text, page.url);
      if (papers.length === 0) {
        // The keys alone carry no question; the "MAT" and "SAT" links are blank OMR sheets (read 10 Oct 2026).
        net.refuse("NCERT (NTSE)", PAPERS_FOLDER("ncert-ntse"), NTSE_PAGE, "NCERT's NTSE page links scoring keys and blank OMR sheets but no question paper; a key without its paper is not taken", licence, "entrance-paper");
        return [];
      }
      return dedupe(papers.map((l) => itemOf({ href: l.href, title: `NTSE ${l.text}`, body: "NCERT (National Talent Search Examination)", bodyKey: "ncert-ntse", board: "NCERT (National Talent Search Examination)", test: "NTSE", sitting: l.text, part: "paper", kind: "entrance-paper", band: "10", subject: /mental|MAT/i.test(l.text) ? "Mental Ability" : "Science, Mathematics, Social Science", year: fourDigitYear(l.text) ?? fourDigitYear(l.href), licence, listedOn: page.url, linkText: l.text })));
    },
  },
  {
    key: "hbcse",
    name: "HBCSE (INMO, RMO, IOQM and the national olympiads)",
    discover: async (net) => {
      const page = await net.getPage(HBCSE_PAST_PAPERS);
      const licence = await licenceOf(net, page.ok ? page.text : null, HBCSE_PAST_PAPERS);
      if (!page.ok) {
        net.refuse("HBCSE", PAPERS_FOLDER("hbcse"), HBCSE_PAST_PAPERS, page.error, licence, "olympiad-paper");
        return [];
      }
      const { items, locked } = parseHbcse(page.text, page.url, licence);
      for (const l of locked) net.refuse("HBCSE", PAPERS_FOLDER("hbcse"), l.sourceUrl, "the PDF is locked with a password the page prints beside it; not opened", licence, "olympiad-paper");
      return items;
    },
  },
  {
    key: "iapt",
    name: "IAPT (the National Standard Examinations)",
    discover: async (net) => {
      const home = await net.getPage(IAPT_HOME);
      const licence = await licenceOf(net, home.ok ? home.text : null, IAPT_HOME);
      if (!home.ok) {
        net.refuse("IAPT", PAPERS_FOLDER("iapt"), IAPT_HOME, home.error, licence, "olympiad-paper");
        return [];
      }
      const items: PaperItem[] = [];
      for (const url of [IAPT_PAPERS, ...iaptYearPages(home.text, home.url)]) {
        const page = await net.getPage(url);
        if (!page.ok) {
          net.refuse("IAPT", PAPERS_FOLDER("iapt"), url, page.error, licence, "olympiad-paper");
          continue;
        }
        items.push(...parseIapt(page.text, page.url, licence));
      }
      return dedupe(items);
    },
  },
  {
    key: "cbse",
    name: "CBSE sample question papers",
    discover: async (net) => {
      const home = await net.getPage(CBSE_ACADEMIC);
      const licence = await licenceOf(net, home.ok ? home.text : null, CBSE_ACADEMIC);
      if (!home.ok) {
        net.refuse("CBSE", PAPERS_FOLDER("cbse"), CBSE_ACADEMIC, home.error, licence, "board-sample-paper");
        return [];
      }
      const sessions = new Map(cbseSessionPages(home.text, home.url).map((s) => [s.url, s]));
      const archive = await net.getPage(new URL("sqp_archive.html", CBSE_ACADEMIC).toString());
      if (archive.ok) for (const s of cbseSessionPages(archive.text, archive.url)) sessions.set(s.url, s);
      const items: PaperItem[] = [];
      for (const s of [...sessions.values()].sort((a, b) => a.url.localeCompare(b.url))) {
        const page = await net.getPage(s.url);
        if (!page.ok) {
          net.refuse("CBSE", PAPERS_FOLDER("cbse"), s.url, page.error, licence, "board-sample-paper");
          continue;
        }
        items.push(...parseCbseSession(page.text, page.url, s.grade, s.session, licence));
      }
      return dedupe(items);
    },
  },
  {
    key: "msbshse",
    name: "MSBSHSE sample papers",
    discover: async (net) => {
      const page = await net.getPage(MSBSHSE_HOME);
      const licence: Licence = { url: MSBSHSE_HOME };
      if (!page.ok) {
        net.refuse("MSBSHSE", PAPERS_FOLDER("msbshse"), MSBSHSE_HOME, page.error, licence, "board-sample-paper");
        return [];
      }
      if (renderedByScript(page.text)) {
        net.refuse("MSBSHSE", PAPERS_FOLDER("msbshse"), MSBSHSE_HOME, "the board's site is rendered by script (SvelteKit); a plain fetch sees no documents to follow", licence, "board-sample-paper");
        return [];
      }
      const papers = questionPaperLinks(page.text, page.url);
      if (papers.length === 0) net.refuse("MSBSHSE", PAPERS_FOLDER("msbshse"), MSBSHSE_HOME, "no sample paper linked from the pages a plain fetch can read", licence, "board-sample-paper");
      return dedupe(papers.map((l) => itemOf({ href: l.href, title: `MSBSHSE ${l.text}`, body: "MSBSHSE (Maharashtra State Board of Secondary and Higher Secondary Education)", bodyKey: "msbshse", board: "MSBSHSE", test: "MSBSHSE", sitting: l.text, part: "paper", kind: "board-sample-paper", band: /12|xii|hsc/i.test(l.text) ? "12" : "10", subject: "General", year: fourDigitYear(l.text), licence: { url: MSBSHSE_HOME }, listedOn: page.url, linkText: l.text })));
    },
  },
];
