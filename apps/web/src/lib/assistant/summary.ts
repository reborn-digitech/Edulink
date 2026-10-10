/**
 * A DOOR'S ANSWER, SUMMED UP BY CODE BEFORE THE MODEL READS IT (the data questions, 11 October 2026). The
 * model never counts: a door's JSON is reduced by its shape, whatever the door, to the lines a sentence
 * needs, and the model is told to take its numbers from them (prompt.ts DATA_RULES):
 *
 *   - a value is written as a person reads it: paise as rupees, minutes of the day as a clock, thousandths
 *     as the number, a day as "15 July 2026", yes and no;
 *   - an array becomes its count, then counts by the fields that sort it (status, kind, class, state, paid,
 *     unread, overdue…), the sums of its amounts in rupees, its earliest and latest day, and its first five
 *     rows — the rows the question's words, class, year or term pick out first;
 *   - a person's name is never a field the model reads (a row of a person keeps its class and its role, never
 *     who): the office gets counts and class names, never a list of children;
 *   - an id, a code, a link, a picture, a colour or a translation key is left out;
 *   - the rows that are a post, a circular or one of the person's own threads are numbered like passages
 *     ([7]) so the answer can cite them, and the service turns a cited row into a LINK citation (links.ts):
 *     the link is built by code from the row, never written by the model.
 *
 * The whole stays under TOOL_ANSWER_MAX_CHARS: rows go before counts do. Pure: tests/assistant-data.test.ts.
 */
import type { Role } from "../constants";
import { TOOL_ANSWER_MAX_CHARS } from "./config";
import type { QuestionHints } from "./doors";

export type LinkKind = "POST" | "CIRCULAR" | "CONVERSATION" | "THREAD" | "COMPOSE";

/** A numbered row the answer may cite: the service makes it a LINK citation when the answer does. */
export type RowLink = { n: number; kind: LinkKind; id: string | null; pagePath: string; at: string | null; who: string | null };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** The rows of these doors are numbered, with the page each opens (only ever the person's own page: links.ts checks the role). */
export const ROW_LINKS: { door: string; array: string; link: (row: Obj) => Omit<RowLink, "n"> | null }[] = [
  {
    door: "/api/v1/shared/bulletin",
    array: "items",
    // A post whose author's role the feed does not carry (the office's circulars) is the school's.
    link: (r) => (typeof r.id === "string" ? { kind: r.requiresAck ? "CIRCULAR" : "POST", id: r.id, pagePath: `/bulletin/${r.id}`, at: str(r.createdAt), who: str(r.authorRole) ?? "SCHOOL" } : null),
  },
  {
    door: "/api/v1/shared/bulletin/global",
    array: "items",
    link: (r) => (typeof r.id === "string" ? { kind: "POST", id: r.id, pagePath: `/bulletin/${r.id}`, at: str(r.createdAt), who: r.ours ? "SCHOOL" : "OTHER_SCHOOL" } : null),
  },
  {
    door: "/api/v1/office/circulars",
    array: "rows",
    link: (r) => (typeof r.postId === "string" ? { kind: "CIRCULAR", id: r.postId, pagePath: `/bulletin/${r.postId}`, at: str(r.publishedAt), who: "ADMIN" } : null),
  },
  {
    door: "/api/v1/shared/inbox",
    array: "conversations",
    link: (r) => {
      const other = Array.isArray(r.others) && isObj(r.others[0]) ? str(r.others[0].role) : null;
      return typeof r.id === "string" ? { kind: "CONVERSATION", id: r.id, pagePath: `/remarks/c/${r.id}`, at: str(r.lastMessageAt), who: other } : null;
    },
  },
  {
    door: "/api/v1/shared/inbox",
    array: "threads",
    link: (r) => (typeof r.id === "string" ? { kind: "THREAD", id: r.id, pagePath: `/remarks/${r.id}`, at: str(r.lastMessageAt), who: "TEACHER" } : null),
  },
];

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/* ---- what is left out ------------------------------------------------------ */

const SKIP_KEY = /^(?:id|ids|.+Id|.+Ids|avatar.*|.+Avatar|logo.*|.+Logo|.+Url|url|href|.+Href|color|colour|font|media|reactions|myReactions|.+Hash|hash|token|secret|.+Key(?<!dateKey|DateKey|todayKey|monthKey|weekKey)|code|(?!(?:course|subject|programme|paper)Code$).+Code|serial|reference|cursor|nextCursor|timezone|canModerate|canClose|schools|options|layout|scale|theme|brand.*|signatures?|website|.*[Aa]ddress.*|.*[Pp]hone.*|.*[Ee]mail.*|postalCode|pinCode|pincode|upi|upiId|bankNote|textKey|consent)$/;
/** Name fields that name a thing, never a person: kept. */
const THING_NAME = /^(?:class|school|subject|course|session|series|term|house|hostel|room|route|stop|company|drive|programme|program|department|division|offering|book|fee|head|plan|category|template|cycle|paper|exam|unit|chapter|stream|scheme|structure|year|month|kind|level|event|activity|committee|site|bank|venue|file|item|asset|vendor|scholarship|criterion|metric|survey|round|batch|group|award|competition|title|awaitingTerm|leave|badge|topic|practice|sheet|test|quiz|period|slot|bed|block|ward|lab)Name$/;
/** A row with one of these is a person's: its plain `name` is a person's name. */
const PERSON_MARKERS = ["userId", "membershipId", "studentMembershipId", "studentUserId", "email", "phone", "avatarKey", "avatar", "guardianshipId", "relation", "preferredName", "teacherMembershipId", "parentUserId"];

/** Keys whose text names who did something, never what: "by", "decidedBy", "author", "pointOfContact"… */
const PERSON_KEY = /^(?:by|.+By|author|applicant|student|teacher|parent|guardian|member|borrower|nominee|nominated|recipient|sender|owner|pointOfContact|contact|contactPerson|mentor|mentee|supervisor|signatory)$/;

function isPersonNameKey(key: string, row: Obj): boolean {
  if (key === "name" || key === "fullName" || key === "displayName" || key === "preferredName") return PERSON_MARKERS.some((m) => m in row) || key !== "name";
  if (PERSON_KEY.test(key) && typeof row[key] === "string") return true;
  return /Name$/.test(key) && !THING_NAME.test(key);
}

/* ---- values as a person reads them ----------------------------------------- */

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-07-15" → "15 July 2026": a day the stripper never reads as a phone number beside a clock time. */
export function readableDay(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  return `${Number(m[3])} ${MONTH_NAMES[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** An instant as its day in India (the product's zone for now): "11 October 2026". */
export function readableInstant(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return readableDay(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** One field as the model reads it: its key and its value, or null to leave it out. */
function field(key: string, value: unknown): [string, string] | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const paise = /^(.*?)(?:P|p)aise$/.exec(key);
    if (paise) return [paise[1] ? `${paise[1]} in rupees` : "rupees", rupees(value)];
    const minute = /^(.*?)Minute$/.exec(key);
    if (minute && Number.isInteger(value) && value >= 0 && value <= 1440) return [`${minute[1]} time`, `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`];
    const milli = /^(.*?)Milli$/.exec(key);
    if (milli) return [milli[1]!, String(Math.round(value) / 1000)];
    return [key, String(value)];
  }
  if (typeof value === "boolean") return [key, value ? "yes" : "no"];
  if (typeof value === "string") {
    if (ISO_INSTANT.test(value)) return [key, readableInstant(value)];
    if (ISO_DAY.test(value)) return [key, readableDay(value)];
    const flat = value.replace(/\s+/g, " ").trim();
    // A post's or a message's words are summed up, never quoted at length (the owner's rule).
    return [key, flat.length > 140 ? `${flat.slice(0, 137)}…` : flat];
  }
  return null;
}

/* ---- picking the rows ------------------------------------------------------ */

const GROUP_FIELDS = ["status", "state", "kind", "type", "category", "paid", "unread", "overdue", "taken", "className", "class", "gradeLevel", "grade", "role", "authorRole", "audience", "requiresAck", "method", "scope", "previewMine", "result", "outcome", "decision", "acked", "dueSoon"];
const STOP = new Set(["what", "which", "when", "where", "many", "much", "have", "does", "with", "from", "this", "that", "there", "their", "about", "still", "today", "show", "tell", "list", "give", "your", "mine", "my", "the", "and", "are", "for", "how", "any", "all", "did", "has", "was", "been", "were", "will", "into", "they", "them", "those", "these", "count", "number"]);

/** The question's own words that may pick out a row ("maths", "bonafide", "term"), four letters or more, their first four letters. */
export function rowWords(question: string): string[] {
  const words = (question.toLowerCase().match(/[\p{L}\p{M}]{4,}/gu) ?? []).filter((w) => !STOP.has(w));
  // A code the question names ("PHY301", "G-01") is matched whole.
  const codes = (question.toLowerCase().match(/[a-z]+-?\d+[a-z]*/g) ?? []).filter((w) => /[a-z]/.test(w) && /\d/.test(w));
  return [...new Set([...words.map((w) => (/^[a-z]+$/.test(w) ? w.slice(0, 4) : w)), ...codes])];
}

/** A row's words for picking it (its codes too, which the model is never shown, but the question may name). */
function textOf(row: Obj): string {
  return Object.entries(row)
    .filter(([k, v]) => typeof v === "string" && !/^(?:id|.+Id)$/.test(k))
    .map(([, v]) => String(v).toLowerCase())
    .join(" ");
}

/** How well a row answers the question: its class, year, term and the question's words. */
function rowScore(row: Obj, hints: QuestionHints, words: string[]): number {
  const text = textOf(row);
  let score = 0;
  if (hints.grade !== null && new RegExp(`(?:grade|class|std)\\s*${hints.grade}\\b|^${hints.grade}$`).test(text + " " + String(row.gradeLevel ?? row.grade ?? ""))) score += 4;
  if (hints.yearStart !== null && new RegExp(`${hints.yearStart}\\s*[-–/]\\s*(?:20)?${String((hints.yearStart + 1) % 100).padStart(2, "0")}`).test(text)) score += 3;
  if (hints.term !== null && new RegExp(`\\bterm\\s*${hints.term}\\b|\\bsem(?:ester)?\\s*${hints.term}\\b`).test(text)) score += 3;
  for (const w of words) if (text.includes(w)) score += 1;
  return score;
}

/* ---- the walk -------------------------------------------------------------- */

type Line = { text: string; row: boolean; link?: Omit<RowLink, "n"> };

function compactRow(row: Obj): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(row)) {
    if (SKIP_KEY.test(k) || isPersonNameKey(k, row)) continue;
    if (Array.isArray(v)) {
      if (v.length && v.every((x) => typeof x === "string" || typeof x === "number")) parts.push(`${k}: ${v.slice(0, 6).join(", ")}${v.length > 6 ? "…" : ""}`);
      else if (v.length && v.every(isObj) && k === "others") parts.push(`with: ${v.map((o) => str((o as Obj).role)?.toLowerCase() ?? "someone").join(", ")}`);
      else if (v.length) parts.push(`${k}: ${v.length}`);
      continue;
    }
    if (isObj(v)) {
      for (const [k2, v2] of Object.entries(v)) {
        if (SKIP_KEY.test(k2) || isPersonNameKey(k2, v) || isObj(v2) || Array.isArray(v2)) continue;
        const f = field(k2, v2);
        if (f) parts.push(`${k}.${f[0]}: ${f[1]}`);
      }
      continue;
    }
    const f = field(k, v);
    if (f) parts.push(`${f[0]}: ${f[1]}`);
  }
  return parts.join("; ");
}

function arrayLines(rows: unknown[], path: string, out: Line[], opts: WalkOpts, depth: number): void {
  if (!rows.length) {
    out.push({ text: `${path}: none`, row: false });
    return;
  }
  if (!rows.every(isObj)) {
    const scalars = rows.filter((r) => typeof r === "string" || typeof r === "number");
    out.push({ text: `${path}: ${rows.length}${scalars.length ? ` (${scalars.slice(0, 10).join(", ")}${scalars.length > 10 ? "…" : ""})` : ""}`, row: false });
    return;
  }
  const objs = rows as Obj[];
  const facts: string[] = [`${objs.length} ${objs.length === 1 ? "row" : "rows"}`];
  if (objs.length > 1) {
    for (const g of GROUP_FIELDS) {
      const values = objs.map((r) => r[g]).filter((v) => v !== undefined && v !== null && typeof v !== "object");
      if (values.length < 2) continue;
      const counts = new Map<string, number>();
      for (const v of values) counts.set(typeof v === "boolean" ? (v ? "yes" : "no") : String(v), (counts.get(typeof v === "boolean" ? (v ? "yes" : "no") : String(v)) ?? 0) + 1);
      if (counts.size > 12) continue;
      facts.push(`by ${g}: ${[...counts].map(([k, n]) => `${k} ${n}`).join(", ")}`);
    }
  }
  const paiseKeys = [...new Set(objs.flatMap((r) => Object.keys(r).filter((k) => /[Pp]aise$/.test(k) && typeof r[k] === "number")))];
  for (const k of paiseKeys) facts.push(`total ${field(k, 0)![0]}: ${rupees(objs.reduce((s, r) => s + (typeof r[k] === "number" ? (r[k] as number) : 0), 0))}`);
  const dateKeys = [...new Set(objs.flatMap((r) => Object.keys(r).filter((k) => typeof r[k] === "string" && (ISO_INSTANT.test(r[k] as string) || ISO_DAY.test(r[k] as string)))))];
  for (const k of dateKeys.slice(0, 2)) {
    const values = objs.map((r) => r[k]).filter((v): v is string => typeof v === "string").sort();
    if (values.length > 1) facts.push(`${k} from ${field(k, values[0])![1]} to ${field(k, values.at(-1))![1]}`);
  }
  out.push({ text: `${path}: ${facts.join("; ")}`, row: false });

  // The rows: the ones the question picks out first, then in the door's own order.
  const rule = ROW_LINKS.find((r) => r.door === opts.door && r.array === path.replace(/^.*\./, ""));
  // A list of things that happened (posts, messages, requests) newest first, so "the latest" is the first row shown.
  const when = dateKeys.find((k) => /(?:created|published|lastMessage|sent|filed|posted|decided|issued)At$|^at$/.test(k));
  const at = (r: Obj) => (when && typeof r[when] === "string" ? (r[when] as string) : "");
  const ranked = objs
    .map((row, i) => ({ row, i, score: rowScore(row, opts.hints, opts.words) }))
    .sort((a, b) => b.score - a.score || (when ? at(b.row).localeCompare(at(a.row)) : 0) || a.i - b.i);
  for (const { row } of ranked.slice(0, opts.rowsPerArray)) {
    const link = rule?.link(row) ?? undefined;
    out.push({ text: `  - ${compactRow(row)}`, row: true, link });
    // A row with a list of its own the question is about (a report card's subjects): its lines too, one level down.
    if (depth < 2) {
      for (const [k, v] of Object.entries(row)) {
        if (Array.isArray(v) && v.length && v.every(isObj) && k !== "others" && !SKIP_KEY.test(k)) {
          const inner: Line[] = [];
          arrayLines(v, `${path}.${k}`, inner, { ...opts, rowsPerArray: Math.max(1, Math.min(opts.rowsPerArray, 4)) }, depth + 1);
          out.push(...inner.map((l) => ({ ...l, text: `    ${l.text.trim()}`, row: true, link: undefined })));
        }
      }
    }
  }
}

type WalkOpts = { door: string; hints: QuestionHints; words: string[]; rowsPerArray: number };

function walk(value: unknown, path: string, out: Line[], opts: WalkOpts, depth: number): void {
  if (Array.isArray(value)) return arrayLines(value, path || "rows", out, opts, depth);
  if (!isObj(value)) {
    const f = field(path || "value", value);
    if (f) out.push({ text: `${f[0]}: ${f[1]}`, row: false });
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    if (SKIP_KEY.test(k) || isPersonNameKey(k, value)) continue;
    const p = path ? `${path}.${k}` : k;
    if (Array.isArray(v)) walk(v, p, out, opts, depth + 1);
    else if (isObj(v)) {
      if (depth < 4) walk(v, p, out, opts, depth + 1);
    } else {
      const f = field(k, v);
      if (f) out.push({ text: `${path ? `${path}.` : ""}${f[0]}: ${f[1]}`, row: false });
    }
  }
}

/** The envelope's data, whichever shape the door answers in. */
export function unwrapDoor(raw: unknown): unknown {
  return isObj(raw) && "data" in raw && Object.keys(raw).length <= 3 && (isObj(raw.data) || Array.isArray(raw.data)) ? raw.data : raw;
}

export type DoorSummary = { text: string; links: RowLink[] };

/**
 * A door's JSON as the lines the model reads. Numbered rows start at `firstNumber`; the summary uses as many
 * rows per list as fit under `maxChars` (five, three, one, none), counts first. Pure.
 */
export function summariseDoor(raw: unknown, opts: { door: string; hints: QuestionHints; question: string; firstNumber: number; maxChars?: number }): DoorSummary {
  const max = opts.maxChars ?? TOOL_ANSWER_MAX_CHARS;
  const data = unwrapDoor(raw);
  const words = rowWords(opts.question);
  let lines: Line[] = [];
  for (const rowsPerArray of [5, 3, 1, 0]) {
    lines = [];
    walk(data, "", lines, { door: opts.door, hints: opts.hints, words, rowsPerArray }, 0);
    if (lines.reduce((s, l) => s + l.text.length + 1, 0) <= max) break;
  }
  const links: RowLink[] = [];
  let n = opts.firstNumber;
  const text: string[] = [];
  let used = 0;
  for (const l of lines) {
    let t = l.text;
    if (l.link) {
      const link: RowLink = { ...l.link, n };
      t = t.replace(/^(\s*- )/, `$1[${n}] `);
      if (used + t.length + 1 > max) break;
      links.push(link);
      n += 1;
    }
    if (used + t.length + 1 > max) break;
    text.push(t);
    used += t.length + 1;
  }
  return { text: text.join("\n"), links };
}

/** The numbers in brackets that begin a row of the text (after stripping): the rows still there to cite. Pure. */
export function numberedRowsIn(text: string): Set<number> {
  return new Set([...text.matchAll(/^\s*- \[(\d{1,3})\]/gm)].map((m) => Number(m[1])));
}

/** Who the summary of a role's own row speaks for: never used for a name, only for the role word in a link's title. */
export type WhoWord = Role | "SCHOOL" | "OTHER_SCHOOL" | "STAFF";
