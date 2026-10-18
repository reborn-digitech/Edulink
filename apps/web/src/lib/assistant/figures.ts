/**
 * A RECORDS ANSWER STATES ONLY THE FIGURES ITS DATA HOLDS (F-1 of the loose-ends walk, 18 October 2026). A guardian
 * asked "How much fee is still due for my child this term?" and was told ₹16,000 twice: the fee door said ₹12,500
 * outstanding (Term 2) and ₹0 in this term, and nothing anywhere said ₹16,000. The model had composed a figure, and
 * the answer gate checked links, contacts, addresses and names, never figures.
 *
 * So, for a "My records" answer: every amount (₹, Rs, INR or rupees; a bare number with thousands separators or two
 * decimals), every date and every count the answer states must be in the data the doors returned for the question —
 * the rows themselves (their paise read as rupees, their thousandths as the number) and the summary's own totals,
 * which code made (summary.ts) — compared after the digits (Devanagari or Latin), the separators (Indian or Western
 * grouping) and the currency marks are normalised. Not figures: a percentage, a page path, a citation mark, a clock
 * time, a code glued to letters (PHY301), and the word "one" (an article as often as a count). A bare count may also
 * be one the question itself names ("in Grade 9"); an amount or a date may not.
 *
 * Cheap by design: one walk of the data into a set of normalised figures, one scan of the answer. Pure:
 * tests/vidura-figures.test.ts.
 */

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/** Devanagari digits as Latin ones. Pure. */
export function latinDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
}

/* ---- dates ----------------------------------------------------------------- */

/** Month names and their common spellings in en, hi and mr, by month number from 1. */
const MONTH_WORDS: [string, number][] = [
  ...["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].map((m, i) => [m, i + 1] as [string, number]),
  ["jan", 1], ["feb", 2], ["mar", 3], ["apr", 4], ["jun", 6], ["jul", 7], ["aug", 8], ["sep", 9], ["sept", 9], ["oct", 10], ["nov", 11], ["dec", 12],
  ...(
    [
      ["जनवरी", 1], ["फ़रवरी", 2], ["फरवरी", 2], ["मार्च", 3], ["अप्रैल", 4], ["अप्रेल", 4], ["मई", 5], ["जून", 6], ["जुलाई", 7], ["अगस्त", 8],
      ["सितंबर", 9], ["सितम्बर", 9], ["अक्टूबर", 10], ["अक्तूबर", 10], ["नवंबर", 11], ["नवम्बर", 11], ["दिसंबर", 12], ["दिसम्बर", 12],
      ["जानेवारी", 1], ["फेब्रुवारी", 2], ["एप्रिल", 4], ["मे", 5], ["जुलै", 7], ["ऑगस्ट", 8], ["सप्टेंबर", 9], ["ऑक्टोबर", 10], ["नोव्हेंबर", 11], ["डिसेंबर", 12],
    ] as [string, number][]
  ),
];
const MONTH_OF = new Map(MONTH_WORDS.map(([w, n]) => [w, n]));
const MONTH_ALT = [...MONTH_OF.keys()].sort((a, b) => b.length - a.length).join("|");
const NOT_LETTER_AFTER = "(?![\\p{L}\\p{M}])";
/** "15 December 2026", "15th of Dec", "१५ डिसेंबर २०२६" (after latinDigits), with an optional weekday before it left alone. */
const DAY_MONTH = new RegExp(`(?<![\\d.,])(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+(${MONTH_ALT})\\.?${NOT_LETTER_AFTER}(?:,?\\s+(\\d{4})(?!\\d))?`, "giu");
/** "December 15, 2026", "Dec 15". */
const MONTH_DAY = new RegExp(`(?<![\\p{L}\\p{M}])(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?![\\d:])(?:,?\\s+(\\d{4})(?!\\d))?`, "giu");
const ISO_DAY = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g;
/** 15/12/2026 or 15-12-2026: India writes the day first; either reading may match. */
const SLASH_DAY = /(?<![\d/])(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?![\d/])/g;
/** An academic year: 2026–27, 2026-2027. */
const YEAR_RANGE = /(?<!\d)((?:19|20)\d{2})\s*[-–—/]\s*(\d{4}|\d{2})(?!\d)/g;

type FoundDate = { d: number; m: number; y: number | null };

const pad = (n: number) => String(n).padStart(2, "0");
const validDay = (d: number, m: number) => m >= 1 && m <= 12 && d >= 1 && d <= 31;

/** The dates a text writes, each with its span, and the text with them blanked out. Pure. */
function takeDates(text: string): { dates: FoundDate[][]; rest: string } {
  const dates: FoundDate[][] = [];
  const blank = (m: string) => " ".repeat(m.length);
  let rest = text.replace(ISO_DAY, (all, y: string, m: string, d: string) => {
    if (validDay(Number(d), Number(m))) dates.push([{ d: Number(d), m: Number(m), y: Number(y) }]);
    return blank(all);
  });
  rest = rest.replace(SLASH_DAY, (all, a: string, b: string, y: string) => {
    const options = [
      { d: Number(a), m: Number(b), y: Number(y) },
      { d: Number(b), m: Number(a), y: Number(y) },
    ].filter((o) => validDay(o.d, o.m));
    if (options.length) dates.push(options);
    return blank(all);
  });
  rest = rest.replace(DAY_MONTH, (all, d: string, mo: string, y?: string) => {
    const m = MONTH_OF.get(mo.toLowerCase());
    if (m && validDay(Number(d), m)) dates.push([{ d: Number(d), m, y: y ? Number(y) : null }]);
    else return all;
    return blank(all);
  });
  rest = rest.replace(MONTH_DAY, (all, mo: string, d: string, y?: string) => {
    const m = MONTH_OF.get(mo.toLowerCase());
    if (m && validDay(Number(d), m)) dates.push([{ d: Number(d), m, y: y ? Number(y) : null }]);
    else return all;
    return blank(all);
  });
  return { dates, rest };
}

/** "2026–27" and "2026-2027" as one key, "2026-27". */
function yearRangeKey(a: string, b: string): string | null {
  const start = Number(a);
  const end = b.length === 2 ? Math.floor(start / 100) * 100 + Number(b) : Number(b);
  return end === start + 1 ? `${start}-${pad(end % 100)}` : null;
}

/* ---- numbers --------------------------------------------------------------- */

/** A number as written, grouping separators gone: "1,25,000" and "125,000" are 125000. */
const NUMBER = String.raw`\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
const MULTIPLIER: Record<string, number> = { thousand: 1_000, "हज़ार": 1_000, "हजार": 1_000, lakh: 100_000, lakhs: 100_000, lac: 100_000, "लाख": 100_000, crore: 10_000_000, crores: 10_000_000, "करोड़": 10_000_000, "करोड": 10_000_000, "कोटी": 10_000_000 };
const MULT_ALT = Object.keys(MULTIPLIER).sort((a, b) => b.length - a.length).join("|");
const CURRENCY_BEFORE = new RegExp(`(?:₹|\\brs\\.?|\\binr\\b|रु\\.?|रू\\.?)\\s*(${NUMBER})(?:\\s*(${MULT_ALT})${NOT_LETTER_AFTER})?(?:\\s*/-)?`, "giu");
const CURRENCY_AFTER = new RegExp(`(?<![\\d.,])(${NUMBER})(?:\\s*(${MULT_ALT}))?\\s*(?:rupees?|रुपये|रुपए|रुपया|रुपयांचा|रुपयांची|रुपयांचे|रुपयांनी|रुपयां|/-)${NOT_LETTER_AFTER}`, "giu");
const PERCENT = new RegExp(`(?<![\\d.,])(?:${NUMBER})\\s*(?:%|per\\s?cent\\b|percentage\\b|प्रतिशत|टक्के|टक्का)`, "giu");
/** A clock time: 09:30, 9:30 am, 9 am. */
const CLOCK = /(?<!\d)\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:am|pm|a\.m\.|p\.m\.))?|(?<![\d.,])\d{1,2}\s*(?:am|pm|a\.m\.|p\.m\.)(?![a-z])/gi;
/** A page path (/parent/fees, /bulletin/abc123) and a citation mark ([3]). */
const PATH = /(?<![\w.])\/[A-Za-z][\w\-./{}[\]]*/g;
const CITATION = /\[\d{1,3}\]/g;
/** A bare number not glued to letters (PHY301, cmut2zw…, 10A are codes), its ordinal ending allowed. */
const BARE = new RegExp(`(?<![\\w.,/])(${NUMBER})(?:st|nd|rd|th)?(?![\\w/]|\\.\\d)`, "g");

/** Counts written as words. "one" is left out: it is an article or a pronoun as often as a count ("the one due in
 * December"); Hindi दो is "give" as well as "two" and is left out too. */
const COUNT_WORDS: [RegExp, number][] = [
  ...(["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"] as const).map((w, i) => [new RegExp(`\\b${w}\\b`, "gi"), i + 2] as [RegExp, number]),
  ...([["तीन", 3], ["चार", 4], ["पाँच", 5], ["पांच", 5], ["छह", 6], ["छः", 6], ["सात", 7], ["आठ", 8], ["नौ", 9], ["दस", 10], ["दोन", 2], ["पाच", 5], ["सहा", 6], ["नऊ", 9], ["दहा", 10]] as [string, number][]).map(
    ([w, n]) => [new RegExp(`(?<![\\p{L}\\p{M}])${w}(?![\\p{L}\\p{M}])`, "gu"), n] as [RegExp, number],
  ),
];

function numberOf(written: string): number {
  return Number(written.replace(/,/g, ""));
}

const decimalsOf = (written: string) => (written.includes(".") ? written.split(".")[1]!.length : 0);

/* ---- the data's figures ----------------------------------------------------- */

export type FigureSet = {
  /** Every number the data carries, normalised. */
  numbers: number[];
  /** Its days, YYYY-MM-DD; and its days without the year, MM-DD, for an answer that writes none. */
  days: Set<string>;
  monthDays: Set<string>;
  /** Its academic years, "2026-27". */
  years: Set<string>;
};

const IN_INDIA = (iso: string): string | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

/** The figures of the data the model was given and of the doors' own rows. Pure. */
export function figureSet(texts: readonly string[], raws: readonly unknown[] = []): FigureSet {
  const numbers = new Set<number>();
  const days = new Set<string>();
  const monthDays = new Set<string>();
  const years = new Set<string>();
  const addDay = (y: number, m: number, d: number) => {
    days.add(`${y}-${pad(m)}-${pad(d)}`);
    monthDays.add(`${pad(m)}-${pad(d)}`);
    numbers.add(y);
  };
  const fromText = (raw: string) => {
    let text = latinDigits(raw);
    text = text.replace(YEAR_RANGE, (all, a: string, b: string) => {
      const key = yearRangeKey(a, b);
      if (key) years.add(key);
      return all;
    });
    const { dates, rest } = takeDates(text);
    for (const options of dates) {
      for (const o of options) {
        if (o.y !== null) addDay(o.y, o.m, o.d);
        else monthDays.add(`${pad(o.m)}-${pad(o.d)}`);
      }
    }
    for (const m of rest.matchAll(new RegExp(`(${NUMBER})(?:\\s*(${MULT_ALT}))?`, "giu"))) {
      const n = numberOf(m[1]!);
      numbers.add(n);
      if (m[2]) numbers.add(n * (MULTIPLIER[m[2].toLowerCase()] ?? 1));
    }
    // "none" and "no" are the data's zero.
    if (/:\s*(?:none|no)\b|\b0\b/i.test(rest)) numbers.add(0);
  };
  for (const t of texts) if (t) fromText(t);

  let budget = 20_000;
  const walk = (value: unknown, key: string, depth: number) => {
    if (budget-- <= 0 || depth > 8 || value === null || value === undefined) return;
    if (typeof value === "number" && Number.isFinite(value)) {
      numbers.add(value);
      if (/paise$/i.test(key)) numbers.add(value / 100);
      if (/milli$/i.test(key)) numbers.add(value / 1000);
      if (value === 0) numbers.add(0);
      return;
    }
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        for (const day of [IN_INDIA(value), value.slice(0, 10)]) {
          if (!day) continue;
          const [y, m, d] = day.split("-").map(Number) as [number, number, number];
          addDay(y, m, d);
        }
        return;
      }
      if (value.length <= 400) fromText(value);
      return;
    }
    if (typeof value === "boolean") {
      if (!value) numbers.add(0);
      return;
    }
    if (Array.isArray(value)) {
      numbers.add(value.length);
      for (const v of value.slice(0, 500)) walk(v, key, depth + 1);
      return;
    }
    if (typeof value === "object") for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(v, k, depth + 1);
  };
  for (const raw of raws) walk(raw, "", 0);
  return { numbers: [...numbers], days, monthDays, years };
}

/* ---- the answer's figures --------------------------------------------------- */

export type Figure = { kind: "AMOUNT" | "DATE" | "COUNT"; written: string };

/** Does the data carry this number, at the precision the answer wrote it (₹12,499.50 may be written ₹12,499.5 or ₹12,500)? */
function carried(n: number, decimals: number, set: FigureSet): boolean {
  const scale = 10 ** Math.min(decimals, 6);
  return set.numbers.some((x) => Math.abs(x - n) < 1e-9 || Math.round(x * scale) / scale === n || (decimals === 0 && Math.round(x) === n));
}

/**
 * The figures an answer states that its data does not carry; empty when every figure is the data's. `question` is
 * the person's own words: a bare count they named ("Grade 9", "semester 3") may be said back. Pure.
 */
export function unsupportedFigures(answer: string, set: FigureSet, question = ""): Figure[] {
  const out: Figure[] = [];
  const blank = (m: string) => " ".repeat(m.length);
  let text = latinDigits(answer).replace(CITATION, blank).replace(PATH, blank).replace(PERCENT, blank).replace(CLOCK, blank);

  text = text.replace(YEAR_RANGE, (all, a: string, b: string) => {
    const key = yearRangeKey(a, b);
    if (!key) return all;
    if (!set.years.has(key)) out.push({ kind: "DATE", written: all });
    return blank(all);
  });

  const { dates, rest } = takeDates(text);
  for (const options of dates) {
    const ok = options.some((o) => (o.y !== null ? set.days.has(`${o.y}-${pad(o.m)}-${pad(o.d)}`) : set.monthDays.has(`${pad(o.m)}-${pad(o.d)}`)));
    if (!ok) {
      const o = options[0]!;
      out.push({ kind: "DATE", written: o.y !== null ? `${o.y}-${pad(o.m)}-${pad(o.d)}` : `${pad(o.m)}-${pad(o.d)}` });
    }
  }
  text = rest;

  const amount = (all: string, written: string, mult?: string) => {
    const n = numberOf(written) * (mult ? (MULTIPLIER[mult.toLowerCase()] ?? 1) : 1);
    if (!carried(n, mult ? 6 : decimalsOf(written), set)) out.push({ kind: "AMOUNT", written: all.trim() });
    return blank(all);
  };
  text = text.replace(CURRENCY_BEFORE, (all, written: string, mult?: string) => amount(all, written, mult));
  text = text.replace(CURRENCY_AFTER, (all, written: string, mult?: string) => amount(all, written, mult));

  const asked = new Set([...latinDigits(question).matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0])));
  for (const m of text.matchAll(BARE)) {
    const written = m[1]!;
    const n = numberOf(written);
    // A bare number with separators or two decimals is an amount; any other is a count (a class, a term, a row).
    const kind: Figure["kind"] = /,/.test(written) || decimalsOf(written) === 2 ? "AMOUNT" : "COUNT";
    if (carried(n, decimalsOf(written), set)) continue;
    if (kind === "COUNT" && asked.has(n)) continue;
    out.push({ kind, written });
  }
  for (const [re, n] of COUNT_WORDS) {
    for (const m of answer.matchAll(re)) if (!set.numbers.includes(n) && !asked.has(n)) out.push({ kind: "COUNT", written: m[0] });
  }
  return out;
}
