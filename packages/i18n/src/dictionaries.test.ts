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
    // A sentence that ends in a full stop in English ends in । in Hindi and . in Marathi.
    const sample = [...E.entries()].filter(([, v]) => /[a-z]\.$/.test(v)).slice(0, 400);
    const hiWrong = sample.filter(([k]) => /[^\s]\.$/.test(H.get(k)!) && !/\.\.\.$/.test(H.get(k)!)).map(([k]) => k);
    const mrWrong = sample.filter(([k]) => /।$/.test(M.get(k)!)).map(([k]) => k);
    expect({ hiEndsWithFullStop: hiWrong.length, mrEndsWithDanda: mrWrong.length }).toEqual({ hiEndsWithFullStop: 0, mrEndsWithDanda: 0 });
  });
});
