/**
 * The owner's follow-up to TA-070 (testing analysis of 13 November 2026; option 1, chosen 14 November 2026): no
 * guessing. A scheme whose pass rules were never saved locks no internal marks and runs no results until the office
 * saves them, with a sentence in en, hi and mr; the scheme form starts the office from 40 internal and 60 external,
 * which the office confirms or changes. This replaces the one silent fallback of 30, 70 and 3 that the first fix left.
 *
 * Scratch ZZ colleges of this suite's own (the exam-cell batch's fixture), removed afterwards.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { passingRulesSchema } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { runResults } from "@/lib/exam-cell-marks";
import { examRulesSaved } from "@/lib/exam-cell-rules";
import { lockInternal } from "@/lib/academics-assessment";
import { passingRulesSaved, saveScheme, schemesWithoutRules, SUGGESTED_PASSING_RULES } from "@/lib/academics";
import { db, makeCollege, refusalOf, type College } from "./ta-college-exam-cell-fixture";

let r: College;
let h: College;

/** The office of a college: an ADMIN membership for the fixture's second controller's account. */
async function office(c: College) {
  c.member["ctrl2:ADMIN"] ??= (await db.membership.create({ data: { userId: c.user.ctrl2!, schoolId: c.id, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  return c.ctx("ctrl2", "ADMIN");
}

/** The scheme saved through the office's own door, with the given internal maximum and the rest of a whole set. */
const rulesInput = (c: College, internalMax: number) => ({
  id: c.schemeId,
  programmeId: c.programmeId,
  name: `ZZ TACEC scheme ${c === r ? "F070R" : "F070H"}`,
  effectiveYear: 2024,
  gradingTable: [
    { grade: "A" as const, points: 10, minPercent: 50 },
    { grade: "F" as const, points: 0, minPercent: 0 },
  ],
  passingRules: { minPercentPerCourse: 40, atktLimit: 2, totalCredits: 120, internalMax, externalMax: 100 - internalMax, minTermCredits: 0, maxTermCredits: 30 },
});

beforeAll(async () => {
  r = await makeCollege("F070R");
  h = await makeCollege("F070H");
  // Both schemes as a row written outside the product leaves them: the column's default, no rules saved.
  await db.scheme.updateMany({ where: { id: { in: [r.schemeId, h.schemeId] } }, data: { passingRules: "{}" } });
});

afterAll(async () => {
  await r?.drop();
  await h?.drop();
  await db.$disconnect();
});

describe("TA-070 (owner's follow-up): a scheme with no saved pass rules runs no results", () => {
  it("TA-070: a run under a scheme whose pass rules were never saved is refused, naming the scheme, and no run is stored", async () => {
    const session = await r.session("ZZ Unsaved");
    for (const s of r.students) {
      await r.mark(session, r.c1, s, 50_000);
      await r.mark(session, r.c2, s, 50_000);
    }
    const refused = await refusalOf(runResults(r.ctx("ctrl"), session));
    expect(refused).toMatchObject({ key: "academics.refuseRulesUnsaved", status: 409 });
    expect((refused.vars as { schemes: string }).schemes).toBe("ZZ TACEC scheme F070R");
    expect(await db.resultRun.count({ where: { sessionId: session } })).toBe(0);

    // Once the office saves the scheme's rules (here the 30 its locks were taken out of), the same run is computed.
    await saveScheme(await office(r), rulesInput(r, 30));
    const run = await runResults(r.ctx("ctrl"), session);
    expect(run.ok).toBe(true);
    expect(await db.resultRun.count({ where: { sessionId: session } })).toBe(1);
  });
});

describe("TA-070 (owner's follow-up): a scheme with no saved pass rules locks no internal marks", () => {
  it("TA-070: the HOD's lock under a scheme whose pass rules were never saved is refused with the sentence, and nothing is frozen until the office saves them", async () => {
    // The HOD of the fixture's department, and a third course whose one component weighs the old fallback's 30.
    const dept = (await db.programme.findUniqueOrThrow({ where: { id: h.programmeId }, select: { departmentId: true } })).departmentId;
    h.member["ctrl2:HOD"] = (await db.membership.create({ data: { userId: h.user.ctrl2!, schoolId: h.id, role: "HOD", status: "ACTIVE" }, select: { id: true } })).id;
    await db.department.update({ where: { id: dept }, data: { hodMembershipId: h.member["ctrl2:HOD"] } });
    const course = (await db.course.create({ data: { schoolId: h.id, schemeId: h.schemeId, code: `ZCC${h.suffix}`, name: "ZZ Waves", semester: 1, creditsL: 2 }, select: { id: true } })).id;
    const offering = (await db.courseOffering.create({ data: { schoolId: h.id, termId: h.term, courseId: course }, select: { id: true } })).id;
    await db.internalComponent.create({ data: { schoolId: h.id, offeringId: offering, name: "ZZ Whole", kind: "UNIT_TEST", maxMarks: 30, weight: 30, coCodes: "[]", moderatedAt: new Date(), moderatedByUserId: h.user.ctrl! } });
    const hod = h.ctx("ctrl2", "HOD");

    const refused = await refusalOf(lockInternal(hod, offering));
    expect(refused).toMatchObject({ key: "academics.refuseRulesUnsaved", status: 409, vars: { schemes: "ZZ TACEC scheme F070H" } });
    expect(await db.internalLock.count({ where: { offeringId: offering } })).toBe(0);

    // The office saves the rules (it confirms an internal maximum of 30 here); the lock then goes through on that figure.
    await saveScheme(await office(h), rulesInput(h, 30));
    expect(await lockInternal(hod, offering)).toEqual({ changed: true });
    expect((await db.internalLock.findUniqueOrThrow({ where: { offeringId: offering }, select: { outOf: true } })).outOf).toBe(30);
  });
});

describe("TA-070 (owner's follow-up): the office is shown the scheme and started from 40 and 60", () => {
  it("TA-070: a scheme with no saved rules is listed as such until the office saves them; the suggestion is 40 internal and 60 external, a whole set of rules", async () => {
    const c = await makeCollege("F070L");
    try {
      // A scheme as the one on the dev database without rules stands: no rules and nothing locked under it.
      await db.scheme.update({ where: { id: c.schemeId }, data: { passingRules: "{}" } });
      await db.internalLock.deleteMany({ where: { schoolId: c.id, offeringId: { in: [c.o1, c.o2] } } });
      const admin = await office(c);
      expect(passingRulesSaved("{}")).toBe(false);
      expect(await schemesWithoutRules(admin)).toEqual([c.schemeId]);
      expect({ internalMax: SUGGESTED_PASSING_RULES.internalMax, externalMax: SUGGESTED_PASSING_RULES.externalMax }).toEqual({ internalMax: 40, externalMax: 60 });
      expect(passingRulesSchema.safeParse(SUGGESTED_PASSING_RULES).success).toBe(true);
      // The office confirms the suggestion as it stands (no lock under the scheme refuses a first maximum).
      await saveScheme(admin, { ...rulesInput(c, 40), name: "ZZ TACEC scheme F070L", passingRules: SUGGESTED_PASSING_RULES });
      expect(await schemesWithoutRules(admin)).toEqual([]);
      const saved = (await db.scheme.findUniqueOrThrow({ where: { id: c.schemeId }, select: { passingRules: true } })).passingRules;
      expect(passingRulesSaved(saved)).toBe(true);
      expect(JSON.parse(saved)).toMatchObject({ internalMax: 40, externalMax: 60 });
    } finally {
      await c.drop();
    }
  });

  it("TA-070: a run asks for the four figures it grades by; a paper with no internal part (an internal maximum of nought) has saved them", () => {
    expect(examRulesSaved("{}")).toBe(false);
    expect(examRulesSaved(null)).toBe(false);
    expect(examRulesSaved(JSON.stringify({ internalMax: 40, externalMax: 60 }))).toBe(false);
    expect(examRulesSaved(JSON.stringify({ minPercentPerCourse: 40, atktLimit: 2, totalCredits: 120, internalMax: 0, externalMax: 100, minTermCredits: 0, maxTermCredits: 30 }))).toBe(true);
    expect(examRulesSaved(JSON.stringify(SUGGESTED_PASSING_RULES))).toBe(true);
  });

  it("TA-070: the programmes page says a scheme has no saved rules and offers the form to save them, started from the suggestion", () => {
    const page = readFileSync("src/app/(app)/admin/academics/programmes/page.tsx", "utf8");
    expect(page).toContain("schemesWithoutRules(ctx)");
    expect(page).toContain('t("academics.rulesUnsaved")');
    expect(page).toContain('t("academics.saveRules")');
    expect(page).toContain('<input type="hidden" name="id" value={sc.id} />');
    expect(page).toContain("defaultValue={R.internalMax}");
    expect(page).toContain("defaultValue={R.externalMax}");
    expect(page).not.toContain('name="internalMax" type="number" min={1} max={200} defaultValue={40}');
  });

  it("TA-070: the refusal and the page's sentences are in en, hi and mr, Hindi with the danda and Marathi with a full stop", () => {
    for (const d of [en, hi, mr]) {
      const a = d.academics as Record<string, string>;
      for (const k of ["refuseRulesUnsaved", "rulesUnsaved", "rulesSuggestedHint", "saveRules"]) expect(typeof a[k], k).toBe("string");
    }
    expect((hi.academics as Record<string, string>).refuseRulesUnsaved).toMatch(/।$/);
    expect((mr.academics as Record<string, string>).refuseRulesUnsaved).toMatch(/\.$/);
    expect((en.academics as Record<string, string>).refuseRulesUnsaved).toContain("{schemes}");
  });
});
