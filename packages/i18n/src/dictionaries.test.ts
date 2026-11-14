import { describe, expect, it } from "vitest";
import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

/**
 * The three dictionaries are one dictionary in three languages. The web
 * folds English under the reader's language at request time, so a missing
 * key would show English rather than break; that is exactly why it needs a
 * test, because nobody would notice. The phone folds the same way.
 */
type Tree = Record<string, unknown>;
function flatten(tree: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (!tree || typeof tree !== "object") return out;
  for (const [k, v] of Object.entries(tree as Tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
    else out.set(key, String(v));
  }
  return out;
}
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");

const E = flatten(en);
const H = flatten(hi);
const M = flatten(mr);

/** Strings that are the same in every language on purpose: e-mail and URL placeholders, a name, a code, a board's initials. */
const SAME_ON_PURPOSE = new Set([
  "filings.boardCISCE",
  "enquiries.threadTitleVacancy", "competitions.exampleUrlPlaceholder", "avatar.name", "join.genericEmailPlaceholder",
  "register.contactEmailPlaceholder", "register.websitePlaceholder", "register.yourEmailPlaceholder", "login.emailPlaceholder",
  "login.loginNamePlaceholder", "settings.emailPlaceholder", "root.emailPlaceholder", "invite.emailPlaceholder", "expert.emailPlaceholder",
]);

/** Hindi values that end in a full stop because they end in an abbreviation or are a label, not a sentence (TA-334). */
const HI_ABBREVIATION_ENDS = new Set(["staff.aq6", "staff.pq2", "staff.pq10", "staff.qualificationPlaceholder", "examCell.pdfAnswerBook"]);

describe("the dictionaries", () => {
  it("say every English key in Hindi and in Marathi, and nothing English does not say", () => {
    expect([...E.keys()].filter((k) => !H.has(k))).toEqual([]);
    expect([...E.keys()].filter((k) => !M.has(k))).toEqual([]);
    expect([...H.keys()].filter((k) => !E.has(k))).toEqual([]);
    expect([...M.keys()].filter((k) => !E.has(k))).toEqual([]);
    expect(E.size).toBeGreaterThan(4000);
  });

  it("keep every {placeholder} of the English sentence in the other two", () => {
    const wrong: string[] = [];
    for (const [k, v] of E) {
      if (placeholders(H.get(k)!) !== placeholders(v)) wrong.push(`hi:${k}`);
      if (placeholders(M.get(k)!) !== placeholders(v)) wrong.push(`mr:${k}`);
    }
    expect(wrong).toEqual([]);
  });

  it("do not leave an English sentence standing in Hindi or Marathi", () => {
    const left: string[] = [];
    for (const [k, v] of E) {
      // Placeholders and URLs are not English; what is left must have a word in it to count.
      const words = v.replace(/\{\w+\}/g, "").replace(/https?:\S+/g, "");
      if (v.length <= 12 || !/[A-Za-z]{4}/.test(words) || SAME_ON_PURPOSE.has(k)) continue;
      if (H.get(k) === v) left.push(`hi:${k}`);
      if (M.get(k) === v) left.push(`mr:${k}`);
    }
    expect(left).toEqual([]);
  });

  it("use the danda in Hindi and the full stop in Marathi, as the house style says", () => {
    // A sentence that ends in a full stop in English ends in । in Hindi and . in Marathi. Every one of them is read
    // (TA-334): the first 400 alone left the newest five thousand, at the end of the file, unread.
    const sample = [...E.entries()].filter(([, v]) => /[a-z]\.$/.test(v));
    const hiWrong = sample.filter(([k]) => !HI_ABBREVIATION_ENDS.has(k) && /[^\s]\.$/.test(H.get(k)!) && !/\.\.\.$/.test(H.get(k)!)).map(([k]) => k);
    const mrWrong = sample.filter(([k]) => /।$/.test(M.get(k)!)).map(([k]) => k);
    expect({ hiEndsWithFullStop: hiWrong, mrEndsWithDanda: mrWrong }).toEqual({ hiEndsWithFullStop: [], mrEndsWithDanda: [] });
    expect(sample.length).toBeGreaterThan(5000);
  });

  it("keep Marathi words out of Hindi and Hindi words out of Marathi (TA-331, TA-334)", () => {
    // Hindi has no ळ: शाळा is Marathi, and Hindi says स्कूल. Marathi says शाळा, never स्कूल, and its verbs are not है and और.
    const word = (w: string) => new RegExp(`(^|[\\s,;:(—])${w}($|[\\s,;:।.)—])`);
    const hiMarathi = [...H.entries()].filter(([, v]) => /ळ/.test(v) || word("आहे").test(v) || word("आणि").test(v)).map(([k]) => k);
    const mrHindi = [...M.entries()].filter(([, v]) => /स्कूल/.test(v) || word("है").test(v) || word("और").test(v)).map(([k]) => k);
    expect({ hiMarathi, mrHindi }).toEqual({ hiMarathi: [], mrHindi: [] });
  });
});
