/**
 * THE CRAWLER'S RULES IN CODE (competitions-crawler, 12 October 2026; docs/plans/competitions-crawler.md).
 * Pure functions, shared by the crawler (scripts/competitions-crawl/) and the desk, and proved by
 * tests/competitions-crawl.test.ts:
 *
 *   - what code refuses of an entry the model extracted (whatever the model's own confidence): no date
 *     and no link; a link off the source's host unless it is the organiser's own site; a phone number
 *     or an e-mail anywhere in it (the organiser's site is the contact, and nothing the platform shows a
 *     child should carry a stranger's number); a confidence under 0.6;
 *   - how an entry becomes a platform competition's columns (classes as "1".."12", college as "13", the
 *     subject a platform code or none, https links only);
 *   - the dedupe key (organiser + title, by embedding similarity of at least 0.9, and the year) and the
 *     field-by-field diff a re-crawl keeps on a published competition instead of editing it.
 */
import type { CompetitionDiff, CompetitionExtractEntry, CrawlRejectReason, StreamCode } from "@edulink/contracts";
import { sourceKindAudience, STREAMS } from "@edulink/contracts"; // college-content (12 Oct 2026)
import { addDaysToKey, zonedStartOfDay } from "./dates";

export const MIN_CONFIDENCE = 0.6;
export const DUPLICATE_SIMILARITY = 0.9;
/** The college "class" in gradeLow/gradeHigh: the practice bank's convention (class 13 and above reads "College"). */
export const COLLEGE_GRADE = "13";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
/** Ten or more digits with spaces, dashes or dots between (a phone number), or a landline with its STD code in brackets. */
const PHONE = /(?<![\d.])\+?\d(?:[\s.-]?\d){9,}(?![\d])|\(0\d{2,4}\)\s?\d{5,8}/;
/** "Ph:", "Mob.", "Tel", "WhatsApp" followed by digits. */
const PHONE_LABELLED = /\b(?:ph|phone|mob|mobile|tel|telephone|whatsapp|helpline|call)\b\.?\s*(?:no\.?|number)?\s*[:-]?\s*\+?\d[\d\s-]{6,}/i;

/** Dates written with separators ("01.09.2026", "2026-10-31", "1/9/26") are taken out before the phone test: two of them side by side are ten digits too. */
const DATES = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g;

/** Whether a text carries a phone number or an e-mail address. */
export function carriesContact(text: string): boolean {
  const undated = text.replace(DATES, " ");
  return EMAIL.test(text) || PHONE.test(undated) || PHONE_LABELLED.test(undated);
}

/** "YYYY-MM-DD" to a Date at noon UTC (a day, not an instant), or null when it is not a real day. */
export function dayToDate(day: string | null | undefined): Date | null {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const d = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== day) return null;
  return d;
}

/**
 * TA-102: a closing or end day as the last instant of that day in India, the platform's zone, so entries close and
 * work stops at the end of the day the page prints and not at noon UTC (17:30). It is 18:29:59.999 UTC of the same
 * date, so it still reads as that day wherever a day is read off the UTC date (dateToDay, the desk).
 */
export function dayEndToDate(day: string | null | undefined): Date | null {
  if (!dayToDate(day)) return null;
  return new Date(zonedStartOfDay(addDaysToKey(day!, 1), "Asia/Kolkata").getTime() - 1);
}

export function dateToDay(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

const SECOND_LEVEL = new Set(["gov", "nic", "res", "ac", "edu", "org", "co", "net", "ernet"]);

/** The registrable part of a host: "olympiads.hbcse.tifr.res.in" → "tifr.res.in", "www.sofworld.org" → "sofworld.org". */
export function siteOf(host: string): string {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const tld = parts[parts.length - 1]!;
  const second = parts[parts.length - 2]!;
  if (tld.length === 2 && SECOND_LEVEL.has(second)) return parts.slice(-3).join(".");
  return parts.slice(-2).join(".");
}

function hostOf(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Whether a link stays with the organiser: on the source's own site (its host or another host of the
 * same registrable site — hbcse.tifr.res.in beside olympiads.hbcse.tifr.res.in), or on the root site of
 * another source the desk lists as an organiser (an IAPT page linking HBCSE's olympiad site).
 */
export function linkAllowed(url: string, sourceRoot: string, organiserRoots: string[] = []): boolean {
  const host = hostOf(url);
  const own = hostOf(sourceRoot);
  if (!host || !own) return false;
  if (siteOf(host) === siteOf(own)) return true;
  return organiserRoots.some((root) => {
    const h = hostOf(root);
    return h !== null && (h === host || h.replace(/^www\./, "") === host.replace(/^www\./, ""));
  });
}

const MONTHS = ["jan(?:uary)?", "feb(?:ruary)?", "mar(?:ch)?", "apr(?:il)?", "may", "june?", "july?", "aug(?:ust)?", "sep(?:t(?:ember)?)?", "oct(?:ober)?", "nov(?:ember)?", "dec(?:ember)?"];

/**
 * Whether the page prints a day: as 2026-10-31, 31.10.2026, 31/10/26 or 31-10-2026; or as a day number
 * beside the month's name ("31st October", "October 31", "16th November- 5th December, 2026") with its
 * year somewhere on the page. Devanagari month names are not read: such a date is not confirmed. Pure.
 */
export function dayOnPage(day: string, text: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return false;
  const [, y, mo, d] = m;
  const dn = Number(d);
  const mn = Number(mo);
  if (text.includes(day)) return true;
  const dd = `0?${dn}`;
  const mm = `0?${mn}`;
  const numeric = new RegExp(`(?<!\\d)${dd}\\s*[./-]\\s*${mm}\\s*[./-]\\s*(?:${y}|${y!.slice(2)})(?!\\d)`);
  if (numeric.test(text)) return true;
  if (!text.includes(y!)) return false;
  const month = MONTHS[mn - 1]!;
  // "24 th September": a superscript ordinal (24<sup>th</sup>) reads with a space once the tags are gone.
  const named = new RegExp(`(?<!\\d)${dn}\\s?(?:st|nd|rd|th)?\\s*(?:of\\s+)?[-–,]?\\s*${month}\\b|\\b${month}\\.?\\s+${dn}\\s?(?:st|nd|rd|th)?(?!\\d)`, "i");
  return named.test(text);
}

/**
 * The entry with every date the page does not print taken out (the first live crawl, 12 Oct 2026: the
 * model filled registration windows a page never gave, and put "today" as an opening date). What is left
 * is then judged by rejectReason like any entry.
 */
export function groundDates<T extends Pick<CompetitionExtractEntry, "registrationOpens" | "registrationCloses" | "eventStarts" | "eventEnds">>(entry: T, pageText: string): { entry: T; dropped: number } {
  let dropped = 0;
  const out = { ...entry };
  for (const k of ["registrationOpens", "registrationCloses", "eventStarts", "eventEnds"] as const) {
    const v = out[k];
    if (v && !dayOnPage(v, pageText)) {
      out[k] = null;
      dropped++;
    }
  }
  return { entry: out, dropped };
}

/** Every date the entry carries. */
export function entryDates(e: Pick<CompetitionExtractEntry, "registrationOpens" | "registrationCloses" | "eventStarts" | "eventEnds">): Date[] {
  return [e.registrationOpens, e.registrationCloses, e.eventStarts, e.eventEnds].map(dayToDate).filter((d): d is Date => d !== null);
}

/* ---- college-content (12 Oct 2026): classes and streams the page prints, the audience, and what nobody can enter ---- */

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const DEV_DIGITS = "०१२३४५६७८९";
const toDevanagari = (n: number) => String(n).replace(/\d/g, (d) => DEV_DIGITS[Number(d)]!);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CLASS_WORD = "(?:class(?:es)?|std\\.?|standards?|grades?|इयत्ता|कक्षा|वर्ग)";

/**
 * Whether the page prints a class: the number (in figures, Roman or Devanagari) after a class word within one
 * clause ("Classes 6 to 10", "Class VI–X", "Std. 8", "इयत्ता ५ वी") or before one ("8th class", "10th std"). Pure.
 */
export function classOnPage(n: number, text: string): boolean {
  if (!Number.isInteger(n) || n < 1 || n > 12) return false;
  const num = `(?:${[String(n), ROMAN[n]!, toDevanagari(n)].map(escapeRe).join("|")})`;
  const after = new RegExp(`${CLASS_WORD}[^.\\n]{0,40}?(?<![\\w०-९])${num}(?![\\w०-९])`, "i");
  const before = new RegExp(`(?<![\\w०-९])${num}\\s?(?:st|nd|rd|th|वी)?\\s*${CLASS_WORD}`, "i");
  return after.test(text) || before.test(text);
}

/** The words that name a college stream on a page. */
const STREAM_WORDS: Record<StreamCode, RegExp> = {
  ARTS: /\barts\b|humanities|\bB\.?\s?A\.?\s|social sciences/i,
  SCIENCE: /\bB\.?\s?Sc\b|\bM\.?\s?Sc\b|science students|natural sciences/i,
  COMMERCE: /commerce|\bB\.?\s?Com\b|accountan/i,
  MANAGEMENT: /management|\bMBA\b|\bBBA\b|\bPGDM\b|business school/i,
  // TA-478: case-sensitive, so the abbreviations need their capitals and B.E. its dot: with the i flag and the dots
  // optional, "\bB\.?\s?E\.?\b" was the English word "be" and kept a wrongly given stream on almost every page.
  ENGINEERING: /[Ee]ngineer|ENGINEER|\bB\.?\s?Tech\b|\bM\.?\s?Tech\b|\bB\.?\s?TECH\b|\bM\.?\s?TECH\b|\bB\.\s?E\b|[Pp]olytechnic|POLYTECHNIC|[Tt]echnical [Ii]nstitutions?|TECHNICAL INSTITUTIONS?/,
  PHARMACY: /pharm/i,
  LAW: /\blaws?\b|legal|moot|\bLL\.?\s?[BM]\b|advocate|bar council/i,
  EDUCATION: /teacher education|\bB\.?\s?Ed\b|\bM\.?\s?Ed\b|student teachers?/i,
  HEALTH_SCIENCES: /medical|\bMBBS\b|nursing|dental|health sciences?|\bBDS\b/i,
  ARCHITECTURE: /architect/i,
  AGRICULTURE: /agricultur|horticultur|veterinar|\bICAR\b|fisheries|agri\b/i,
  VOCATIONAL: /vocational|\bB\.?\s?Voc\b|skill development/i,
};

/** College words on a page: who may enter is a college's students. */
const COLLEGE_WORDS = /\bcolleges?\b|universit|undergraduate|post-?graduate|\bdegree\b|\bUG\b|\bPG\b|\bB\.?\s?Tech\b|\bLL\.?\s?B\b|moot court|institutions? of higher/i;

/**
 * The entry with every class and stream the page does not print taken out (the crawler's hand check of 12 October:
 * 13 of 20 entries carried classes the model filled in). A class the page does not print goes; a stream the
 * page's words do not name goes. Pure.
 */
export function groundClasses<T extends Pick<CompetitionExtractEntry, "classFrom" | "classTo" | "streams">>(entry: T, pageText: string): { entry: T; dropped: number } {
  let dropped = 0;
  const out = { ...entry };
  for (const k of ["classFrom", "classTo"] as const) {
    const v = out[k];
    if (v !== null && v !== undefined && !classOnPage(v, pageText)) {
      out[k] = null;
      dropped++;
    }
  }
  if (out.streams?.length) {
    const kept = out.streams.filter((s) => STREAM_WORDS[s]?.test(pageText));
    dropped += out.streams.length - kept.length;
    out.streams = kept;
  }
  return { entry: out, dropped };
}

/**
 * Who a crawled entry is for: the page first (classes it prints → SCHOOL, unless it also lets college students in →
 * both; college students named and the page's words say college → COLLEGE; BOTH → both), else the source's kind
 * (a school organiser's SCHOOL, a college organiser's COLLEGE, OTHER: both). A COLLEGE entry's streams are the ones
 * the page names, else the source's. Run after groundClasses. Pure.
 */
export function crawledAudience(
  entry: Pick<CompetitionExtractEntry, "classFrom" | "classTo" | "forCollege" | "audience" | "streams">,
  pageText: string | null,
  source: { kind: string; streams?: readonly string[] | null } | null,
): { audience: "SCHOOL" | "COLLEGE" | null; streams: StreamCode[] } {
  const printedClasses = entry.classFrom !== null || entry.classTo !== null;
  const college = (entry.audience === "COLLEGE" || entry.forCollege) && (pageText === null || COLLEGE_WORDS.test(pageText));
  const fromSource = source ? sourceKindAudience(source.kind) : null;
  let audience: "SCHOOL" | "COLLEGE" | null;
  if (entry.audience === "BOTH" || (printedClasses && college)) audience = null;
  else if (printedClasses) audience = "SCHOOL";
  else if (college) audience = "COLLEGE";
  else audience = fromSource;
  if (audience !== "COLLEGE") return { audience, streams: [] };
  const named = (entry.streams ?? []).filter((s): s is StreamCode => (STREAMS as readonly string[]).includes(s));
  const own = (source?.streams ?? []).filter((s): s is StreamCode => (STREAMS as readonly string[]).includes(s));
  const streams = named.length ? named : own;
  return { audience, streams: STREAMS.filter((s) => streams.includes(s)) };
}

/** A heading over several exams, an award ceremony, a results or merit-list notice: nothing a person enters. */
const NOT_ENTERABLE_WORDS = /award (?:ceremony|function|distribution)|felicitation|prize distribution|results? (?:declared|announced|of)|\bresults\b|toppers|merit list|winners? (?:list|announced)|convocation|award function|annual function/i;

/** Whether an entry is something nobody can enter: the model said so, or its title or summary names a ceremony or results. Pure. */
export function notEnterable(entry: Pick<CompetitionExtractEntry, "title" | "summary" | "enterable">): boolean {
  if (entry.enterable === false) return true;
  return NOT_ENTERABLE_WORDS.test(entry.title) || NOT_ENTERABLE_WORDS.test(entry.summary ?? "");
}

/** Whether every date an entry carries is before the day of the crawl (none: not past). Pure. */
export function allDatesPast(entry: Pick<CompetitionExtractEntry, "registrationOpens" | "registrationCloses" | "eventStarts" | "eventEnds">, today: Date): boolean {
  const dates = entryDates(entry);
  if (!dates.length) return false;
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return dates.every((d) => d.getTime() < start);
}

/** The year a competition belongs to: the year of its earliest date; null when it gives none. */
export function yearOf(dates: (Date | null | undefined)[]): number | null {
  const real = dates.filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));
  if (!real.length) return null;
  return new Date(Math.min(...real.map((d) => d.getTime()))).getUTCFullYear();
}

/**
 * Why code refuses an entry, or null to keep it. The order is fixed so a count by reason is stable:
 * confidence, contact details, no date and no link, a link off the organiser's site.
 */
export function rejectReason(entry: CompetitionExtractEntry, ctx: { sourceRoot: string; organiserRoots?: string[]; /** college-content: the crawl's day, for PAST; absent, PAST is not judged. */ today?: Date }): CrawlRejectReason | null {
  if (!(entry.confidence >= MIN_CONFIDENCE)) return "LOW_CONFIDENCE";
  // The words, not the link: an address's own digits (a notice's number in its path) are not a phone number, and a
  // mailto: or tel: "website" is refused below as a link off the organiser's site.
  const texts = [entry.title, entry.organiser, entry.summary, entry.fee, entry.eligibility, entry.prizes].filter((t): t is string => typeof t === "string");
  if (texts.some(carriesContact)) return "CONTACT_DETAILS";
  const website = entry.website?.trim() || null;
  if (entryDates(entry).length === 0 && !website) return "NO_DATE_NO_LINK";
  if (website && !linkAllowed(website, ctx.sourceRoot, ctx.organiserRoots)) return "OFF_HOST_LINK";
  // college-content (12 Oct 2026, the coordinator's rules from the hand check): nothing to enter, or all over already.
  if (notEnterable(entry)) return "NOT_ENTERABLE";
  if (ctx.today && allDatesPast(entry, ctx.today)) return "PAST";
  return null;
}

/** The columns a crawled entry gives a platform competition. */
export type CrawledFields = {
  title: string;
  summary: string;
  organizerName: string;
  subject: string | null;
  gradeLow: string | null;
  gradeHigh: string | null;
  eligibility: string | null;
  prizes: string | null;
  externalUrl: string | null;
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
  startsAt: Date | null;
  endsAt: Date | null;
  // college-content (12 Oct 2026): who it is for (crawledAudience) and a COLLEGE one's streams.
  /** SCHOOL | COLLEGE | null (both); typed as the column is, so a stored row compares with it. */
  audience: string | null;
  streams: string[];
};

const clean = (s: string | null | undefined, max: number): string | null => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
};

const httpsOrNull = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" && u.hostname ? u.toString() : null;
  } catch {
    return null;
  }
};

/** An entry as a competition's columns. The organiser's page is the link (https only); the page read stands in when the entry names none. */
export function toCompetitionFields(entry: CompetitionExtractEntry, pageUrl: string, /** college-content: the audience as resolved from the page and the source; absent, from the entry alone. */ who?: { audience: "SCHOOL" | "COLLEGE" | null; streams: StreamCode[] }): CrawledFields {
  const resolved = who ?? crawledAudience(entry, null, null);
  let low = entry.classFrom;
  let high = entry.classTo ?? entry.classFrom;
  if (low !== null && high !== null && low > high) [low, high] = [high, low];
  const gradeLow = low !== null ? String(low) : entry.forCollege ? COLLEGE_GRADE : null;
  const gradeHigh = entry.forCollege ? COLLEGE_GRADE : high !== null ? String(high) : null;
  const title = clean(entry.title, 140) ?? "";
  return {
    title,
    summary: clean(entry.summary, 200) ?? title,
    organizerName: clean(entry.organiser, 120) ?? "",
    subject: entry.subject === "OTHER" ? null : entry.subject,
    gradeLow,
    gradeHigh,
    eligibility: clean(entry.eligibility, 600),
    prizes: clean(entry.prizes, 300),
    externalUrl: httpsOrNull(entry.website) ?? httpsOrNull(pageUrl),
    registrationOpensAt: dayToDate(entry.registrationOpens),
    registrationClosesAt: dayEndToDate(entry.registrationCloses),
    startsAt: dayToDate(entry.eventStarts),
    endsAt: dayEndToDate(entry.eventEnds),
    audience: resolved.audience,
    streams: resolved.streams,
  };
}

/** The text the dedupe embeds: the organiser and the title, lower-cased, years taken out (the year is compared on its own). */
export function dedupeText(organiser: string, title: string): string {
  return `${organiser} — ${title}`
    .toLowerCase()
    .replace(/\b(19|20)\d{2}(\s*[-–/]\s*\d{2,4})?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The title alone, the same way: the second half of the dedupe (see findDuplicate). */
export function titleText(title: string): string {
  return dedupeText("", title).replace(/^—\s*/, "");
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export type DedupeCandidate = { competitionId: string; vector: number[]; titleVector: number[]; year: number | null };

/**
 * The existing competition this one is: organiser and title together at least 0.9 similar, THE TITLE ALONE
 * at least 0.9 too, and the same year (no year matches no year); the closest wins. The title check was
 * added after the first live crawl (12 Oct 2026): with the local embedder one organiser's two olympiads
 * ("Mathematical Olympiad", "Science Olympiad" of HBCSE) were 0.945 similar together and 0.760 apart, so
 * the joint text alone merged different competitions. `exclude` names the competitions already landed from
 * the same page in this crawl: the model listed them as different, and a page is not its own duplicate.
 */
export function findDuplicate(vector: number[], titleVector: number[], year: number | null, index: DedupeCandidate[], exclude: ReadonlySet<string> = new Set()): { competitionId: string; similarity: number } | null {
  let best: { competitionId: string; similarity: number } | null = null;
  for (const c of index) {
    if (c.year !== year || exclude.has(c.competitionId)) continue;
    const similarity = cosine(vector, c.vector);
    if (similarity < DUPLICATE_SIMILARITY || cosine(titleVector, c.titleVector) < DUPLICATE_SIMILARITY) continue;
    if (!best || similarity > best.similarity) best = { competitionId: c.competitionId, similarity };
  }
  return best;
}

/** The facts compared on a re-crawl, as text (days as YYYY-MM-DD). */
export const DIFF_FIELDS = ["title", "organizerName", "subject", "gradeLow", "gradeHigh", "eligibility", "prizes", "externalUrl", "registrationOpensAt", "registrationClosesAt", "startsAt", "endsAt", "fee"] as const;
export type DiffField = (typeof DIFF_FIELDS)[number];
export type Comparable = Partial<Record<DiffField, string | null>>;

export function comparable(f: Partial<CrawledFields> & { fee?: string | null }): Comparable {
  const out: Comparable = {};
  for (const k of DIFF_FIELDS) {
    if (!(k in f)) continue;
    const v = (f as Record<string, unknown>)[k];
    out[k] = v instanceof Date ? dateToDay(v) : typeof v === "string" ? v : v === null ? null : null;
  }
  return out;
}

const norm = (v: string | null | undefined) => (v ?? "").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * What changed between what the platform holds and what the page now says. A field the page is silent
 * on (null) is not a change: a page that stops printing a date has not moved it. Only the fields both
 * sides carry are compared, so a hand-posted competition is compared on its dates and classes.
 */
export function diffFields(before: Comparable, after: Comparable): CompetitionDiff {
  const diff: CompetitionDiff = {};
  for (const k of DIFF_FIELDS) {
    if (!(k in before) || !(k in after)) continue;
    const a = after[k] ?? null;
    if (a === null) continue;
    const b = before[k] ?? null;
    if (norm(a) !== norm(b)) diff[k] = { before: b, after: a };
  }
  return diff;
}
