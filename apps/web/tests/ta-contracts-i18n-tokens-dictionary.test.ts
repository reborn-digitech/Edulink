/**
 * The dictionaries' words: findings TA-331, TA-332, TA-334 and TA-482 of the testing analysis of 13 November 2026,
 * held by cases that FAIL while the defect stands and pass once it is fixed. Pure: the three dictionaries are read,
 * nothing is written and no database is touched.
 *
 *   TA-331  Six Hindi sentences added with the competitions on the calendar said शाळा, the Marathi word for school;
 *           Hindi has no ळ and says स्कूल everywhere else.
 *   TA-332  Counted English sentences with no form for one: "Due in 1 days", "1 days overdue", "1 pupils taught",
 *           "1 schools removed". Each of these now has a One sentence its caller chooses at one; the rest of the
 *           dictionary's counted sentences are held at the number standing today, so no new one is added unnoticed.
 *   TA-334  The house-style test read the first 400 sentences only; it now reads every one (packages/i18n).
 *   TA-482  Hindi named the engineering stream two ways along the NBA pages: अभियांत्रिकी on the chip and the SAR's
 *           refusals, इंजीनियरिंग in the simulator's refusal and the visit form.
 */
import { describe, expect, it } from "vitest";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { dueLabel } from "@/app/root/subscription-words";
import type { Translate } from "@/lib/i18n/dictionary";

function flatten(tree: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (!tree || typeof tree !== "object") return out;
  for (const [k, v] of Object.entries(tree as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
    else out.set(key, String(v));
  }
  return out;
}
const E = flatten(en);
const H = flatten(hi);
const M = flatten(mr);

/** An English translator over the flattened dictionary, as the operator's page uses it. */
const tEn = ((key: string, vars?: Record<string, string | number>) => (E.get(key) ?? key).replace(/\{(\w+)\}/g, (_, name: string) => String(vars?.[name] ?? `{${name}}`))) as unknown as Translate;

describe("TA-331: Hindi says स्कूल, never the Marathi शाळा", () => {
  it("TA-331: no Hindi value holds ळ, a letter Hindi does not have", () => {
    expect([...H.entries()].filter(([, v]) => /ळ/.test(v)).map(([k]) => k)).toEqual([]);
  });

  it("TA-331: the competitions' six sentences say स्कूल in Hindi and keep शाळा in Marathi", () => {
    for (const key of ["competitions.internalBoard", "calendar.competitionHint", "calendar.competitionOption", "calendar.boardSchool", "calendar.boardSchoolHint", "platformFeatures.competitionsWhat"]) {
      expect(H.get(key), key).toMatch(/स्कूल/);
    }
    expect([...M.values()].some((v) => /स्कूल/.test(v))).toBe(false);
  });
});

describe("TA-482: Hindi names the engineering stream one way along the NBA pages", () => {
  it("TA-482: the simulator's refusal and the visit form use the stream's own name, अभियांत्रिकी", () => {
    const stream = H.get("streams.ENGINEERING.name");
    expect(stream).toBe("अभियांत्रिकी");
    for (const key of ["insights.simNoEngineering", "peerVisit.newIntro", "peerVisit.refuseDepartment", "councilFilings.refuseDepartment"]) {
      const value = H.get(key) ?? "";
      expect(value, key).toContain(stream!);
      expect(value, key).not.toContain("इंजीनियरिंग");
    }
  });
});

/** A placeholder followed by a plural noun: a counted sentence that reads wrongly at one unless it has a One form. */
const COUNTED = /\{\w+\} (?:[a-z-]+ )?(?:days|weeks|months|years|hours|minutes|pupils|students|schools|questions|sessions|teachers|classes|files|items|entries|people|children|lessons|subjects|members|records|rows|times|seats|papers|books|messages|notices)\b/;
/**
 * Counted English sentences without a One sibling, as they stood once TA-332's reached sentences had theirs: 299 when
 * only `<key>One` counted as a sibling, 248 once a `<base>Many` with its `<base>One` counts too (the coordinator, on
 * merging TA-388's report counts, 14 November 2026), so the ratchet stays at today's number.
 */
const COUNTED_WITHOUT_ONE_CEILING = 248;

describe("TA-332: a counted English sentence reads correctly at one", () => {
  it("TA-332: the operator's due line, the teacher's pupils and the bulk removal each have a sentence for one", () => {
    for (const key of ["root.subscriptionDueIn", "root.subscriptionOverdue", "person.pupilsTaught", "root.bulkRemoved", "root.bulkDeleted"]) {
      expect(E.has(`${key}One`), key).toBe(true);
      expect(H.has(`${key}One`), key).toBe(true);
      expect(M.has(`${key}One`), key).toBe(true);
    }
    expect(dueLabel(tEn, 1)).toBe("Due in 1 day");
    expect(dueLabel(tEn, -1)).toBe("1 day overdue");
    expect(dueLabel(tEn, 3)).toBe("Due in 3 days");
    expect(dueLabel(tEn, -4)).toBe("4 days overdue");
    expect(dueLabel(tEn, 0)).toBe("Due today");
  });

  it("TA-332: no new counted sentence without a form for one is added (the rest are held at today's number)", () => {
    // A form for one is `<key>One`, or, for a pair named `<base>Many`, `<base>One` (TA-388's report counts use that pair).
    const hasOne = (k: string) => E.has(`${k}One`) || (k.endsWith("Many") && E.has(`${k.slice(0, -"Many".length)}One`));
    const without = [...E.entries()].filter(([k, v]) => COUNTED.test(v) && !k.endsWith("One") && !hasOne(k)).map(([k]) => k);
    expect(without.length).toBeLessThanOrEqual(COUNTED_WITHOUT_ONE_CEILING);
  });
});
