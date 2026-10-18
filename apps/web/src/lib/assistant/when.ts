/**
 * WEEK AND DAY OFFSETS IN THE DATA ROUTER (docs/plans/vidura.md, the owner's decision 5; pass 2, 17 Oct 2026): "next
 * week", "tomorrow", "last month", "this term" — in English, Hindi and Marathi — resolved to a window of days in the
 * SCHOOL's own calendar: today is the school's today (its timezone), a week runs Monday to Sunday, a month is the
 * calendar month, and a term is the school's own term (Term) or the college's (AcademicTerm) where the office has
 * recorded one. The router fills a door's date, week, days, from and to, month and term parameters from the window
 * (doors.ts `callsFor`), the summary picks the rows that fall in it first and says how many do (summary.ts), and a door
 * that cannot be narrowed to it says so (service.ts).
 *
 * Pure: no database, no clock of its own (tests/vidura-two.test.ts).
 */
import { addDaysToKey } from "../dates";

export type WindowLabel =
  | "TODAY"
  | "TOMORROW"
  | "YESTERDAY"
  | "DAY_AFTER"
  | "DAY_BEFORE"
  | "WEEKDAY"
  | "THIS_WEEK"
  | "NEXT_WEEK"
  | "LAST_WEEK"
  | "THIS_MONTH"
  | "NEXT_MONTH"
  | "LAST_MONTH"
  | "THIS_TERM"
  | "NEXT_TERM"
  | "LAST_TERM";

export type TimeWindow = {
  kind: "DAY" | "WEEK" | "MONTH" | "TERM";
  /** Inclusive, YYYY-MM-DD in the school's zone. */
  from: string;
  to: string;
  label: WindowLabel;
  /** For a term: the recorded term it is (its id for a door's termId) and its place in the year from 1. */
  termId?: string | null;
  termN?: number | null;
};

/** One recorded term of the school's or the college's year, its days as keys in the school's zone. */
export type CalendarTerm = { id: string; n: number; from: string; to: string };

/** What the router knows of the school's calendar: its today and its terms (none recorded, none). */
export type SchoolCalendar = { today: string; terms: CalendarTerm[] };

const DEVANAGARI_DIGITS = "०१२३४५६७८९";
const NO_LETTER_BEFORE = "(?<![\\p{L}\\p{M}])";
const NO_LETTER_AFTER = "(?![\\p{L}\\p{M}])";
/** A Devanagari word, whole (Devanagari has no \b). */
const word = (alternatives: string) => new RegExp(`${NO_LETTER_BEFORE}(?:${alternatives})${NO_LETTER_AFTER}`, "u");
/** A Devanagari word's start (a weekday with its ending: "सोमवारी", "सोमवार को"). */
const stem = (alternatives: string) => new RegExp(`${NO_LETTER_BEFORE}(?:${alternatives})`, "u");

/** Monday of the week that holds this day (weeks run Monday to Sunday). Pure. */
export function mondayOf(key: string): string {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sunday
  return addDaysToKey(key, -((dow + 6) % 7));
}

/** 0 Monday … 6 Sunday. */
function weekdayOf(key: string): number {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

function monthWindow(today: string, offset: number): { from: string; to: string } {
  const [y, m] = today.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, m - 1 + offset, 1));
  const last = new Date(Date.UTC(y, m + offset, 0));
  const key = (d: Date) => d.toISOString().slice(0, 10);
  return { from: key(first), to: key(last) };
}

const WEEKDAYS: { en: string; hi: string; mr: string }[] = [
  { en: "monday", hi: "सोमवार", mr: "सोमवार" },
  { en: "tuesday", hi: "मंगलवार", mr: "मंगळवार" },
  { en: "wednesday", hi: "बुधवार", mr: "बुधवार" },
  { en: "thursday", hi: "गुरुवार|बृहस्पतिवार|वीरवार", mr: "गुरुवार" },
  { en: "friday", hi: "शुक्रवार", mr: "शुक्रवार" },
  { en: "saturday", hi: "शनिवार", mr: "शनिवार" },
  { en: "sunday", hi: "रविवार|इतवार", mr: "रविवार" },
];

/** A Hindi sentence in the past tense ("कल … था", "… गया"), which makes "कल" yesterday and "परसों" the day before. */
const HINDI_PAST = word("था|थी|थे|थीं|गया|गई|गयी|गए|गये|हुआ|हुई|हुए|किया|लिया|आया|आई|आए|मिला|मिली|मिले|रहा था|रही थी");
/** A Marathi sentence in the past tense, which makes "परवा" the day before yesterday. */
const MARATHI_PAST = word("होता|होती|होते|होतो|झाला|झाली|झाले|केला|केली|केले|गेला|गेली|गेले|आला|आली|आले|मिळाला|मिळाली|मिळाले");

function termWindow(terms: readonly CalendarTerm[], today: string, which: -1 | 0 | 1): TimeWindow | null {
  const sorted = [...terms].sort((a, b) => a.from.localeCompare(b.from));
  const nowIndex = sorted.findIndex((t) => t.from <= today && today <= t.to);
  let index: number;
  if (nowIndex >= 0) index = nowIndex + which;
  else {
    // Between two terms: "this term" is the next to start, "last term" the last to end.
    const nextIndex = sorted.findIndex((t) => t.from > today);
    const lastIndex = nextIndex === -1 ? sorted.length - 1 : nextIndex - 1;
    index = which === -1 ? lastIndex : nextIndex;
  }
  const t = sorted[index];
  if (!t) return null;
  return { kind: "TERM", from: t.from, to: t.to, label: which === 1 ? "NEXT_TERM" : which === -1 ? "LAST_TERM" : "THIS_TERM", termId: t.id, termN: t.n };
}

/**
 * The window a question names, or null when it names none (or a term the calendar does not record). `today` is the
 * school's today; `terms` its recorded terms. The first match in the order below wins. Pure.
 */
export function timeWindowOf(question: string, today: string, terms: readonly CalendarTerm[] = []): TimeWindow | null {
  const q = question.toLowerCase().replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
  const day = (offset: number, label: WindowLabel): TimeWindow => {
    const k = addDaysToKey(today, offset);
    return { kind: "DAY", from: k, to: k, label };
  };
  const week = (offset: number, label: WindowLabel): TimeWindow => {
    const monday = addDaysToKey(mondayOf(today), 7 * offset);
    return { kind: "WEEK", from: monday, to: addDaysToKey(monday, 6), label };
  };
  const month = (offset: number, label: WindowLabel): TimeWindow => ({ kind: "MONTH", ...monthWindow(today, offset), label });

  // Days.
  if (/\bday after tomorrow\b/.test(q)) return day(2, "DAY_AFTER");
  if (/\bday before yesterday\b/.test(q)) return day(-2, "DAY_BEFORE");
  if (word("परसों|परसो").test(q)) return HINDI_PAST.test(q) ? day(-2, "DAY_BEFORE") : day(2, "DAY_AFTER");
  if (word("परवा").test(q)) return MARATHI_PAST.test(q) ? day(-2, "DAY_BEFORE") : day(2, "DAY_AFTER");
  if (/\btomorrow\b/.test(q) || word("उद्या|उद्याचा|उद्याची|उद्याचे|उद्याच्या").test(q)) return day(1, "TOMORROW");
  if (/\byesterday\b/.test(q) || word("काल|कालचा|कालची|कालचे|कालच्या").test(q)) return day(-1, "YESTERDAY");
  if (word("कल").test(q)) return HINDI_PAST.test(q) ? day(-1, "YESTERDAY") : day(1, "TOMORROW");

  // Weeks.
  if (/\bnext week\b|\bcoming week\b/.test(q) || stem("अगले (?:हफ़्ते|हफ्ते|सप्ताह)|अगला (?:हफ़्ता|हफ्ता|सप्ताह)|आने वाले (?:हफ़्ते|हफ्ते|सप्ताह)|पुढच्या आठवड|पुढील आठवड|पुढचा आठवडा|येत्या आठवड").test(q)) return week(1, "NEXT_WEEK");
  if (/\b(?:last|previous|past) week\b/.test(q) || stem("पिछले (?:हफ़्ते|हफ्ते|सप्ताह)|पिछला (?:हफ़्ता|हफ्ता|सप्ताह)|मागच्या आठवड|मागील आठवड|गेल्या आठवड|मागचा आठवडा").test(q)) return week(-1, "LAST_WEEK");
  if (/\bthis week\b|\bcurrent week\b/.test(q) || stem("इस (?:हफ़्ते|हफ्ते|सप्ताह)|यह (?:हफ़्ता|हफ्ता|सप्ताह)|या आठवड|चालू आठवड|हा आठवडा").test(q)) return week(0, "THIS_WEEK");

  // Weekdays: "on Friday" is the coming one (today included), "next Friday" the one in next week, "last Friday" the one before today.
  for (const [i, w] of WEEKDAYS.entries()) {
    const en = new RegExp(`\\b(next|last|this|coming|on)?\\s*${w.en}\\b`).exec(q);
    const deva = stem(`${w.hi}|${w.mr}`).test(q);
    if (!en && !deva) continue;
    const next = (en?.[1] === "next") || stem(`(?:अगले|अगला|पुढच्या|पुढील) (?:${w.hi}|${w.mr})`).test(q);
    const last = (en?.[1] === "last") || stem(`(?:पिछले|पिछला|मागच्या|मागील|गेल्या) (?:${w.hi}|${w.mr})`).test(q);
    const todayDow = weekdayOf(today);
    let key: string;
    if (next) key = addDaysToKey(mondayOf(today), 7 + i);
    else if (last) key = addDaysToKey(today, -(((todayDow - i + 7) % 7) || 7));
    else key = addDaysToKey(today, (i - todayDow + 7) % 7);
    return { kind: "DAY", from: key, to: key, label: "WEEKDAY" };
  }

  if (/\btoday\b|\btonight\b|\bthis (?:morning|afternoon|evening)\b/.test(q) || word("आज|आजचा|आजची|आजचे|आजच्या").test(q)) return day(0, "TODAY");

  // Months.
  if (/\bnext month\b|\bcoming month\b/.test(q) || stem("अगले महीने|अगला महीना|पुढच्या महिन्|पुढील महिन्|येत्या महिन्").test(q)) return month(1, "NEXT_MONTH");
  if (/\b(?:last|previous|past) month\b/.test(q) || stem("पिछले महीने|पिछला महीना|मागील महिन्|मागच्या महिन्|गेल्या महिन्").test(q)) return month(-1, "LAST_MONTH");
  if (/\bthis month\b|\bcurrent month\b/.test(q) || stem("इस महीने|यह महीना|या महिन्|चालू महिन्|हा महिना").test(q)) return month(0, "THIS_MONTH");

  // Terms, where the calendar records them.
  const TERM = "(?:term|semester|sem)";
  if (new RegExp(`\\bnext ${TERM}\\b`).test(q) || stem("अगले (?:सत्र|टर्म|सेमेस्टर)|अगला (?:सत्र|टर्म|सेमेस्टर)|पुढच्या सत्र|पुढील सत्र|पुढच्या सेमिस्टर|पुढील सेमिस्टर").test(q)) return termWindow(terms, today, 1);
  if (new RegExp(`\\b(?:last|previous|past) ${TERM}\\b`).test(q) || stem("पिछले (?:सत्र|टर्म|सेमेस्टर)|पिछला (?:सत्र|टर्म|सेमेस्टर)|मागील सत्र|मागच्या सत्र|गेल्या सत्र|मागील सेमिस्टर|मागच्या सेमिस्टर|गेल्या सेमिस्टर").test(q)) return termWindow(terms, today, -1);
  if (new RegExp(`\\b(?:this|current) ${TERM}\\b`).test(q) || stem("इस (?:सत्र|टर्म|सेमेस्टर)|यह (?:सत्र|टर्म|सेमेस्टर)|चालू (?:सत्र|सेमिस्टर)|या सत्र|या सेमिस्टर|हे सत्र").test(q)) return termWindow(terms, today, 0);
  return null;
}

/** Does a day key fall in the window? Pure. */
export function inWindow(key: string, w: Pick<TimeWindow, "from" | "to">): boolean {
  return key >= w.from && key <= w.to;
}

/** Does the window lie inside one Monday-to-Sunday week (a door's `week` parameter can serve it)? Pure. */
export function withinOneWeek(w: Pick<TimeWindow, "from" | "to">): boolean {
  return mondayOf(w.from) === mondayOf(w.to);
}

/** Days from `today` to the window's end, inclusive, for an agenda's `days` ahead; null for a window already past. Pure. */
export function daysAhead(w: Pick<TimeWindow, "from" | "to">, today: string): number | null {
  if (w.to < today) return null;
  const [a, b] = [today, w.to].map((k) => Date.UTC(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))));
  return Math.round((b! - a!) / 86_400_000) + 1;
}

/** The window as the model reads it beside the data: "next week, Monday 19 October 2026 to Sunday 25 October 2026". Pure. */
export function windowWords(w: TimeWindow): string {
  const name: Record<WindowLabel, string> = {
    TODAY: "today",
    TOMORROW: "tomorrow",
    YESTERDAY: "yesterday",
    DAY_AFTER: "the day after tomorrow",
    DAY_BEFORE: "the day before yesterday",
    WEEKDAY: "the day asked about",
    THIS_WEEK: "this week",
    NEXT_WEEK: "next week",
    LAST_WEEK: "last week",
    THIS_MONTH: "this month",
    NEXT_MONTH: "next month",
    LAST_MONTH: "last month",
    THIS_TERM: "this term",
    NEXT_TERM: "next term",
    LAST_TERM: "last term",
  };
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const say = (k: string) => `${DAYS[weekdayOf(k)]} ${Number(k.slice(8, 10))} ${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
  return w.from === w.to ? `${name[w.label]}, ${say(w.from)}` : `${name[w.label]}, ${say(w.from)} to ${say(w.to)}`;
}
