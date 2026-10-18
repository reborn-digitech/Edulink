/**
 * THE DATA QUESTIONS' DOORS (the owner's decisions of 10 October 2026, built 11 October): which of the
 * catalog's GET doors the assistant may read for a person, and how a door's parameters are filled from the
 * person's own context and the words of the question. The catalog is the truth (src/lib/api-catalog): a door
 * is a candidate for a role when the catalog lets that role pass it (`permits`, with the person's duties),
 * it answers JSON (never a PDF, a file, a CSV, an image or a stream), reading it changes nothing (never a
 * door that marks a thread read, records a circular as seen or is audited), and every parameter it needs is
 * one the context fills: the person's own membership, the guardian's chosen child, a month, a year or a
 * class the question names, or a report card listed by the person's own cards door (FOLLOW). Which of the
 * candidates answers a question is decided by embedding similarity in router.ts, never by a keyword table.
 *
 * Pure: no database, no network. tests/assistant-data.test.ts reads it role by role.
 */
import type { ZodTypeAny } from "zod";
import { ENDPOINTS } from "../api-catalog";
import { permits, type Endpoint } from "../api-catalog/types";
import type { Role } from "../constants";
// Vidura pass 2 (17 Oct 2026): week and day offsets, resolved in the school's own calendar.
import { daysAhead, timeWindowOf, withinOneWeek, type SchoolCalendar, type TimeWindow } from "./when";

export type DoorPath = `/api/v1/${string}`;

/**
 * Doors never read for a person, by path, each with its reason. A door here may be perfectly cheap; it is
 * kept out because reading it does something (marks read, records a view, starts a sitting), returns
 * something that is not data for a sentence, or would echo the question somewhere.
 */
export const NEVER_DOORS: { path: RegExp; why: string }[] = [
  { path: /^\/api\/v1\/assistant(?:\/|$)/, why: "the assistant's own doors" },
  { path: /^\/api\/v1\/events(?:\/|$)/, why: "a server-sent stream" },
  { path: /^\/api\/v1\/auth\//, why: "sign-in" },
  { path: /^\/api\/v1\/admin\/site(?:\/|$)/, why: "the school website's draft, preview HTML and domain, not a person's data (15 Oct 2026)" },
  { path: /^\/api\/v1\/admin\/social(?:\/|$)/, why: "the school's Facebook connection and its copies of posts, not a person's data (16 Oct 2026)" },
  // plans-pay (17 Oct 2026)
  { path: /^\/api\/v1\/account\/pass(?:\/|$)/, why: "a person's passes, payments and invoices: the account's Plans page shows them, a chat does not (17 Oct 2026)" },
  // end plans-pay
  { path: /^\/api\/v1\/(?:me\/sessions|account\/totp)(?:\/|$)/, why: "the account's security, never read for a chat" },
  { path: /\/export(?:\/|$)/, why: "an export: a file, or a person's whole data (DPDP s.11)" },
  { path: /^\/api\/v1\/search(?:\/|$)/, why: "the search door would carry the question's words" },
  { path: /^\/api\/v1\/practice\/(?:next|revision\/question|worksheets\/sheet)(?:\/|$)/, why: "a question in a sitting or an answer key: the assessment rule" },
  { path: /^\/api\/v1\/shared\/bulletin\/\{postId\}$/, why: "opening a circular records it as seen (circulars.ts recordPostRead)" },
  { path: /^\/api\/v1\/shared\/(?:conversations|threads)\/\{/, why: "opening a conversation or a thread marks it read; the inbox list carries what a data question needs" },
  { path: /^\/api\/v1\/(?:uploads|files|voice\/[^/]+)(?:\/|$)/, why: "files" },
  { path: /^\/api\/v1\/(?:id-cards\/check|library\/lookup)(?:\/|$)/, why: "a scanner's lookup by a code the question would carry" },
  { path: /\/(?:pdf|image|receipt|sheet|open|statement)$|\.ics$|\/calendar\/token$/, why: "a file, a PDF, an image or a feed" },
  { path: /^\/api\/v1\/academics\/attendance$/, why: "an HOD's read of the defaulters tells the students not told this week" },
  { path: /^\/api\/v1\/(?:teaching\/remarks|shared\/people|alumni\/staff)$/, why: "a list of the people one may write to: names alone, which an answer never gives (the compose link stands for it)" },
];

/** What a door's summary says that keeps it out: a file, a stream, or a read that writes. */
const NEVER_SUMMARY = /application\/pdf|image\/png|text\/csv|\bCSV\b|\bPDF\b|\bPNG\b|server-sent|iCalendar|marks it read|\baudited\b|\blogged\b|as one JSON document/i;

/** Why a door is never read for anybody, or null when it may be (by role still to be decided). Pure. */
export function neverReadWhy(e: Pick<Endpoint, "method" | "path" | "summary" | "access">): string | null {
  if (e.method !== "GET") return "not a read";
  if (!e.path.startsWith("/api/v1/")) return "outside /api/v1";
  // The operator's, the content team's and the public's doors are nobody's own data (and `permits` passes them for any role, leaving the handler to refuse).
  if (e.access === "operator" || e.access === "app-admin" || e.access === "anyone") return "not a school person's door";
  const rule = NEVER_DOORS.find((r) => r.path.test(e.path));
  if (rule) return rule.why;
  if (NEVER_SUMMARY.test(e.summary)) return "the summary names a file, a stream, or a read that writes";
  return null;
}

/* -------------------------------------------------------------------------- */
/* The request schema's fields                                                 */
/* -------------------------------------------------------------------------- */

export type QueryField = { key: string; optional: boolean; schema: ZodTypeAny };

type ZodDef = { typeName?: string; schema?: ZodTypeAny; in?: ZodTypeAny; innerType?: ZodTypeAny; getter?: () => ZodTypeAny; shape?: () => Record<string, ZodTypeAny> };

/** The fields of a door's query schema (an object, under refinements, pipes, defaults), or [] when it has none. Pure. */
export function queryFields(schema: ZodTypeAny | undefined): QueryField[] {
  let cur: ZodTypeAny | undefined = schema;
  for (let i = 0; i < 8 && cur; i++) {
    const def = (cur as unknown as { _def: ZodDef })._def;
    if (def.typeName === "ZodObject") {
      const shape = (cur as unknown as { shape: Record<string, ZodTypeAny> }).shape;
      return Object.entries(shape).map(([key, s]) => ({ key, optional: s.isOptional(), schema: s }));
    }
    cur = def.typeName === "ZodEffects" ? def.schema : def.typeName === "ZodPipeline" ? def.in : def.typeName === "ZodLazy" && def.getter ? def.getter() : def.innerType;
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* What the question names: a class, a year, a term, a month                   */
/* -------------------------------------------------------------------------- */

export type QuestionHints = {
  /** "class 4", "grade 4", "4th class", "चौथी कक्षा", "इयत्ता चौथी". */
  grade: number | null;
  /** The academic year's start (June to May): "last year" is the one before this, "2025-26" itself. */
  yearStart: number | null;
  /** "term 1", "second term", "सत्र 2". */
  term: number | null;
  /** YYYY-MM: "this month", "last month", a month by its name. */
  month: string | null;
  /**
   * The days the question asks about (Vidura pass 2, when.ts): "tomorrow", "next week", "last month", "this term", in
   * the school's own calendar; null when it names none.
   */
  window?: TimeWindow | null;
  /** The school's today (YYYY-MM-DD in its zone), for a door's days ahead. */
  today?: string;
};

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  जनवरी: 1, फरवरी: 2, फ़रवरी: 2, मार्च: 3, अप्रैल: 4, मई: 5, जून: 6, जुलाई: 7, अगस्त: 8, सितंबर: 9, सितम्बर: 9, अक्टूबर: 10, अक्तूबर: 10, नवंबर: 11, नवम्बर: 11, दिसंबर: 12, दिसम्बर: 12,
  जानेवारी: 1, फेब्रुवारी: 2, एप्रिल: 4, मे: 5, जुलै: 7, ऑगस्ट: 8, सप्टेंबर: 9, ऑक्टोबर: 10, नोव्हेंबर: 11, डिसेंबर: 12,
};
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
  पहली: 1, दूसरी: 2, तीसरी: 3, चौथी: 4, पांचवीं: 5, पाँचवीं: 5, छठी: 6, सातवीं: 7, आठवीं: 8, नौवीं: 9, दसवीं: 10,
  पहिली: 1, दुसरी: 2, तिसरी: 3, पाचवी: 5, सहावी: 6, सातवी: 7, आठवी: 8, नववी: 9, दहावी: 10,
};
const DEVANAGARI_DIGITS = "०१२३४५६७८९";
const asciiDigits = (s: string) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));

/** The academic year (June to May, India's school and college year) that holds this day. */
export function academicYearStart(now: Date): number {
  return now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

/**
 * What a question names about time and class, for a door's parameters and the rows kept. `calendar` is the school's
 * today and terms (Vidura pass 2); without it, today is the UTC day of `now` and no term is known. Pure.
 */
export function hintsOf(question: string, now: Date, calendar?: SchoolCalendar | null): QuestionHints {
  const q = asciiDigits(question.toLowerCase());
  let grade: number | null = null;
  const g = /\b(?:class|grade|std\.?|standard)\s*(\d{1,2})\b|\b(\d{1,2})(?:st|nd|rd|th)\s+(?:class|grade|std|standard)\b|(?:कक्षा|इयत्ता|वर्ग)\s*(\d{1,2})|(\d{1,2})\s*(?:वीं|वी)\s*(?:कक्षा|इयत्ता)/.exec(q);
  if (g) grade = Number(g[1] ?? g[2] ?? g[3] ?? g[4]);
  if (grade === null) {
    const o = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+(?:class|grade|standard)\b|(पहली|दूसरी|तीसरी|चौथी|पांचवीं|पाँचवीं|छठी|सातवीं|आठवीं|नौवीं|दसवीं|पहिली|दुसरी|तिसरी|पाचवी|सहावी|सातवी|आठवी|नववी|दहावी)\s*(?:कक्षा|इयत्ता|वर्ग)|(?:कक्षा|इयत्ता|वर्ग)\s*(पहली|दूसरी|तीसरी|चौथी|पांचवीं|पाँचवीं|छठी|सातवीं|आठवीं|नौवीं|दसवीं|पहिली|दुसरी|तिसरी|पाचवी|सहावी|सातवी|आठवी|नववी|दहावी)/.exec(q);
    if (o) grade = ORDINALS[(o[1] ?? o[2] ?? o[3])!] ?? null;
  }
  if (grade !== null && (grade < 1 || grade > 12)) grade = null;

  const thisYear = academicYearStart(now);
  let yearStart: number | null = null;
  const span = /\b(20\d{2})\s*[-–/]\s*(?:20)?(\d{2})\b/.exec(q);
  if (span) yearStart = Number(span[1]);
  else if (/\b(?:last|previous|past) (?:academic |school )?year\b|पिछले (?:साल|वर्ष)|पिछला (?:साल|वर्ष)|मागील वर्ष|मागच्या वर्षी|गेल्या वर्षी/.test(q)) yearStart = thisYear - 1;
  else if (/\b(?:this|current) (?:academic |school )?year\b|इस (?:साल|वर्ष)|या वर्षी|चालू वर्ष/.test(q)) yearStart = thisYear;

  let term: number | null = null;
  const t = /\b(?:term|semester|sem)\s*(\d)\b|\b(first|second|third)\s+(?:term|semester)\b|(?:सत्र)\s*(\d)/.exec(q);
  if (t) term = t[1] ? Number(t[1]) : t[2] ? ORDINALS[t[2]]! : Number(t[3]);

  let month: string | null = null;
  const ym = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const nowY = now.getUTCFullYear();
  const nowM = now.getUTCMonth() + 1;
  if (/\bthis month\b|इस महीने|या महिन्यात|चालू महिन्यात/.test(q)) month = ym(nowY, nowM);
  else if (/\b(?:last|previous) month\b|पिछले महीने|मागील महिन्यात|गेल्या महिन्यात/.test(q)) month = nowM === 1 ? ym(nowY - 1, 12) : ym(nowY, nowM - 1);
  else {
    for (const [name, m] of Object.entries(MONTHS)) {
      const re = /^[a-z]/.test(name) ? new RegExp(`\\b${name}\\b`) : new RegExp(`(?<![\\p{L}\\p{M}])${name}(?![\\p{L}\\p{M}])`, "u");
      // "may" is a month only beside a number or a year ("may 2026", "3 may"), never "may I".
      if (name === "may" && !/\b\d{1,2}\s+may\b|\bmay\s+(?:20\d{2}|\d{1,2})\b/.test(q)) continue;
      if (re.test(q)) {
        // The month by name is the latest one not after today.
        month = ym(m > nowM ? nowY - 1 : nowY, m);
        break;
      }
    }
  }
  // Vidura pass 2: the window of days asked about, in the school's own calendar; a month or a term it names fills
  // those hints where the words above did not.
  const today = calendar?.today ?? now.toISOString().slice(0, 10);
  const window = timeWindowOf(question, today, calendar?.terms ?? []);
  if (window && month === null && window.kind !== "TERM") month = window.from.slice(0, 7);
  if (window?.kind === "TERM" && term === null && window.termN) term = window.termN;
  return { grade, yearStart, term, month, window, today };
}

/* -------------------------------------------------------------------------- */
/* Filling a door's parameters from the person's context                       */
/* -------------------------------------------------------------------------- */

export type DataContext = {
  role: Role;
  /** The person's own membership at the school (a guardian has none). */
  membershipId: string | null;
  /** A guardian's children at the conversation's school, each with its class name (never a name). */
  children: { id: string; className: string | null }[];
  /** The guardian's child the question is about, when it names one of them (or there is only one). */
  childId: string | null;
  duties: readonly string[];
  /** The modules the school has on; a door behind another is no candidate. Absent: decided at run time. */
  modules?: ReadonlySet<string>;
  now: Date;
  /** The school's today and its recorded terms (Vidura pass 2), for "tomorrow", "next week", "this term". */
  calendar?: SchoolCalendar;
};

/** Report cards: the listing door's rows give the {cardId} of the one-card door (a pupil's past marks by subject). */
export const FOLLOW: Record<string, { from: DoorPath; rows: (raw: unknown) => { id: string; title: string }[]; param: string }> = {
  "/api/v1/family/report-cards/{cardId}": {
    from: "/api/v1/family/report-cards",
    param: "cardId",
    rows: (raw) => {
      const d = (raw as { data?: { groups?: { rows?: { id?: string; title?: string; publishedAt?: string | null }[] }[] } })?.data ?? (raw as { groups?: { rows?: { id?: string; title?: string }[] }[] });
      return (d?.groups ?? []).flatMap((g) => (g.rows ?? []).filter((r): r is { id: string; title: string } => typeof r.id === "string" && typeof r.title === "string"));
    },
  },
};

/** At most this many of a listing's rows are opened for one question (a pupil's cards: this year's and last year's). */
export const FOLLOW_MAX = 3;

export type DoorCall = {
  /** The catalog's path, `{param}` and all: the door's identity. */
  door: DoorPath;
  /** The concrete path with its query string, as the handler is called. */
  url: string;
  /** The path parameters, for the handler's second argument. */
  params: Record<string, string>;
  /** Which of a guardian's children this call reads, by its class (never a name); null for the person's own. */
  child: { id: string; className: string | null; n: number } | null;
  /** The question's window of days filled one of the door's parameters (Vidura pass 2): the door was asked for those days. */
  windowed?: boolean;
};

const CHILD_KEYS = new Set(["childId", "child", "student", "studentMembershipId"]);

function accepts(schema: ZodTypeAny, value: unknown): boolean {
  return schema.safeParse(value).success;
}

/**
 * The calls one door takes for this question, or null when a parameter it needs cannot be filled from the
 * context (the door is then no candidate). A guardian's door that takes a child is called once per child at
 * the school when the question names none of them (at most three: "fees due for each child"). Pure.
 */
export function callsFor(e: Pick<Endpoint, "path" | "request">, ctx: DataContext, hints: QuestionHints): DoorCall[] | null {
  const door = e.path as DoorPath;
  const pathParams = [...door.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  const fields = queryFields(e.request);
  const childField = fields.find((f) => CHILD_KEYS.has(f.key));
  const childPath = pathParams.find((p) => p === "membershipId" || p === "studentMembershipId" || p === "childId");
  for (const p of pathParams) if (p !== childPath && !FOLLOW[door]) return null;

  // Whose record: the person's own, the named child, or each child.
  let children: DoorCall["child"][] = [null];
  if (ctx.role === "PARENT" && (childField || childPath)) {
    const pool = ctx.childId ? ctx.children.filter((c) => c.id === ctx.childId) : ctx.children;
    if (!pool.length) return null;
    children = pool.slice(0, 3).map((c) => ({ id: c.id, className: c.className, n: ctx.children.findIndex((x) => x.id === c.id) + 1 }));
  } else if (childPath) {
    if (!ctx.membershipId || ctx.role !== "STUDENT") return null;
  }

  const query: Record<string, string> = {};
  const w = hints.window ?? null;
  let windowed = false;
  for (const f of fields) {
    if (CHILD_KEYS.has(f.key)) continue;
    let value: string | null = null;
    // Vidura pass 2: the window of days asked about fills a day, a week, the days ahead, a span or a term.
    const fromWindow = w ? windowValue(f, w, hints.today ?? null) : null;
    if (fromWindow !== null) {
      value = fromWindow;
      windowed = true;
    } else if (f.key === "month" && hints.month && accepts(f.schema, hints.month)) {
      value = hints.month;
      if (w?.kind === "MONTH") windowed = true;
    } else if (/^(?:year|academicYear)$/.test(f.key) && hints.yearStart !== null) {
      const y = hints.yearStart;
      value = [`${y}-${String((y + 1) % 100).padStart(2, "0")}`, `${y}–${String((y + 1) % 100).padStart(2, "0")}`, String(y)].find((v) => accepts(f.schema, v)) ?? null;
    } else if (/^(?:grade|gradeLevel)$/.test(f.key) && hints.grade !== null && accepts(f.schema, String(hints.grade))) value = String(hints.grade);
    else if (f.key === "term" && hints.term !== null && accepts(f.schema, String(hints.term))) value = String(hints.term);
    if (value !== null) query[f.key] = value;
    else if (!f.optional) return null;
  }

  return children.map((child) => {
    const params: Record<string, string> = {};
    let path: string = door;
    if (childPath) {
      const id = child ? child.id : ctx.membershipId!;
      params[childPath] = id;
      path = path.replace(`{${childPath}}`, encodeURIComponent(id));
    }
    const q = new URLSearchParams(query);
    if (child && childField) q.set(childField.key, child.id);
    const qs = q.toString();
    return { door, url: `${path}${qs ? `?${qs}` : ""}`, params, child, ...(w ? { windowed } : {}) };
  });
}

/**
 * The value the question's window gives one of a door's parameters, or null (Vidura pass 2): a single day fills
 * `date` and `day`; a window inside one week fills `week` (any day of it); a window ahead fills an agenda's `days`; a
 * span fills `from` and `to`; a recorded term fills `termId`. Each only where the door's own schema accepts it. Pure.
 */
function windowValue(f: QueryField, w: TimeWindow, today: string | null): string | null {
  const ok = (v: string | null) => (v !== null && accepts(f.schema, v) ? v : null);
  if ((f.key === "date" || f.key === "day") && w.kind === "DAY") return ok(w.from);
  if (f.key === "week" && withinOneWeek(w)) return ok(w.from);
  if (f.key === "days" && today && w.from >= today) {
    const n = daysAhead(w, today);
    return n === null ? null : ok(String(n));
  }
  if (f.key === "from" && w.kind !== "DAY") return ok(w.from);
  if (f.key === "to" && w.kind !== "DAY") return ok(w.to);
  if (f.key === "termId" && w.termId) return ok(w.termId);
  return null;
}

/* -------------------------------------------------------------------------- */
/* A role's candidates                                                          */
/* -------------------------------------------------------------------------- */

const BY_DOOR = new Map<string, Endpoint>();
function catalogEntry(door: string): Endpoint | null {
  if (!BY_DOOR.size) for (const e of ENDPOINTS) if (e.method === "GET" && !BY_DOOR.has(e.path)) BY_DOOR.set(e.path, e);
  return BY_DOOR.get(door) ?? null;
}

/** The catalog's GET door at this path, if it is one the role may have read for it (module aside: that is the school's, at run time). Pure. */
export function readableDoor(door: string, role: Role, duties: readonly string[]): Endpoint | null {
  const e = catalogEntry(door);
  if (!e || neverReadWhy(e) || !permits(e, role, duties)) return null;
  return e;
}

/** What a <data> block is called for the model: the door's catalog summary (never its /api/ path), or the name it came with. Pure. */
export function doorTitle(door: string): string {
  const summary = catalogEntry(door)?.summary;
  if (!summary) return door.startsWith("/api/") ? "the person's own record" : door;
  return (summary.length > 120 ? `${summary.slice(0, 117)}…` : summary).replace(/"/g, "'");
}

/** Every door the role may have read for it, before the parameters and the module: for the tests and the docs. Pure. */
export function readableDoorsFor(role: Role, duties: readonly string[] = []): Endpoint[] {
  return ENDPOINTS.filter((e) => e.method === "GET" && !neverReadWhy(e) && permits(e, role, duties));
}

/* -------------------------------------------------------------------------- */
/* What a door answers, in words: for the help index's door entries             */
/* -------------------------------------------------------------------------- */

const WORDLESS = /^(?:id|ids|.+Id|.+Ids|.+Key|.+Url|url|href|avatar.*|.+Avatar|logo.*|color|font|cursor|nextCursor|schoolId|hash)$/;

/**
 * The field names of a door's response schema as words ("unreadTotal" → "unread total"), deduplicated, at most
 * `max`: what the door answers, beside its summary, so a question in a person's words ("did my teacher reply")
 * meets the door that holds it (the inbox's "preview", "unread", "last message at"). Read from the catalog's
 * own schema, never written by hand. scripts/help-index.ts puts them on the door's entry. Pure.
 */
export function responseWords(schema: ZodTypeAny | undefined, max = 40): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (s: ZodTypeAny | undefined, depth: number) => {
    let cur = s;
    for (let i = 0; i < 8 && cur; i++) {
      const def = (cur as unknown as { _def: ZodDef & { type?: ZodTypeAny; options?: ZodTypeAny[]; left?: ZodTypeAny; right?: ZodTypeAny } })._def;
      if (def.typeName === "ZodObject") {
        const shape = (cur as unknown as { shape: Record<string, ZodTypeAny> }).shape;
        for (const [k, v] of Object.entries(shape)) {
          if (WORDLESS.test(k)) continue;
          const words = k.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/Paise$/i, "").toLowerCase().trim();
          if (words && !seen.has(words) && out.length < max) {
            seen.add(words);
            out.push(words);
          }
          if (depth < 3) visit(v, depth + 1);
        }
        return;
      }
      if (def.typeName === "ZodArray") cur = def.type;
      else if (def.typeName === "ZodUnion" || def.typeName === "ZodDiscriminatedUnion") {
        for (const o of def.options ?? []) visit(o, depth);
        return;
      } else if (def.typeName === "ZodIntersection") {
        visit(def.left, depth);
        visit(def.right, depth);
        return;
      } else cur = def.typeName === "ZodEffects" ? def.schema : def.typeName === "ZodPipeline" ? def.in : def.typeName === "ZodLazy" && def.getter ? def.getter() : def.innerType;
    }
  };
  visit(schema, 0);
  return out;
}
