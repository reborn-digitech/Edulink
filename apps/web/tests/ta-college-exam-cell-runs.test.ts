/**
 * The exam cell's marks, grace and runs: findings of the college-exam-cell
 * batch of the testing analysis of 13 November 2026, each held by a case that
 * failed on the code of that day.
 *
 *   TA-063  a draft run was published as computed after a grace or an entry changed the marks
 *   TA-064  a CLOSED session took revaluations and corrections, and refused every corrected run
 *   TA-560  an approved grace before publication left a mistyped mark no way to be corrected
 *   TA-069  a grace to pass stayed on a mark a revaluation raised past the pass
 *   TA-570  deciding a revaluation again with other marks answered 200 and changed nothing
 *   TA-530  the session's grace cap was added up outside any lock; an edit landed under the approval
 *   TA-303  an undecided unfair-means case did not hold the result; DEBAR_NEXT was never applied
 *   TA-070  a locked internal was read without its out-of; the two modules' fallback rules differed
 *
 * Scratch ZZ colleges of this suite's own, removed afterwards.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_PASSING_RULES } from "@edulink/contracts";
import { correctableRows, correctMark, decideGrace, marksSheet, proposeGrace, publishNeedsPrincipal, publishRun, runResults } from "@/lib/exam-cell-marks";
import { askRevaluation, decideRevaluation } from "@/lib/exam-cell-after";
import { decideForm, decideMalpractice, submitForm } from "@/lib/exam-cell";
import { readPassingRules, saveScheme } from "@/lib/academics";
import { rulesOf } from "@/lib/exam-cell-rules";
import { db, makeCollege, refusalOf, type College } from "./ta-college-exam-cell-fixture";

let c: College;
let g: College;

const latestMark = async (sessionId: string, courseId: string, student: string) => (await db.examMark.findMany({ where: { sessionId, courseId, studentMembershipId: student }, orderBy: { version: "desc" }, take: 1 }))[0]!;
const runStatus = async (id: string) => (await db.resultRun.findUniqueOrThrow({ where: { id }, select: { status: true } })).status;

/** A session with s1 at `s1c1` in the first course and everyone else (and every other paper) on 50/70. */
async function marked(name: string, s1c1: number, opts: Parameters<College["session"]>[1] = {}) {
  const session = await c.session(name, opts);
  for (const s of opts.students ?? c.students) {
    await c.mark(session, c.c1, s, s === c.students[0] ? s1c1 : 50_000);
    await c.mark(session, c.c2, s, 50_000);
  }
  return session;
}

beforeAll(async () => {
  c = await makeCollege("Runs");
  g = await makeCollege("Grace", { graceMaxPerSession: 6 });
});

afterAll(async () => {
  await c?.drop();
  await g?.drop();
  await db.$disconnect();
});

describe("TA-063: a draft is published only as the marks stand", () => {
  it("TA-063: a run computed before a grace was approved is refused at publication, and a new run carries the grace", async () => {
    const session = await marked("ZZ Stale", 25_000);
    const run = await runResults(c.ctx("ctrl"), session);
    const grace = await proposeGrace(c.ctx("ctrl"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 3, rule: "TO_PASS", reason: "ZZ three to pass" });
    await decideGrace(c.ctx("principal"), grace.id!, { approve: true });
    const refused = await refusalOf(publishRun(c.ctx("ctrl"), session, run.id!));
    expect(refused).toMatchObject({ key: "examCell.refuseRunStale", status: 409 });
    expect(await runStatus(run.id!)).toBe("DRAFT");
    expect(await db.backlog.count({ where: { studentMembershipId: c.students[0]!, courseId: c.c1 } })).toBe(0);
    const again = await runResults(c.ctx("ctrl"), session);
    expect((await publishRun(c.ctx("ctrl"), session, again.id!)).ok).toBe(true);
    const row = await db.courseResult.findFirstOrThrow({ where: { runId: again.id!, studentMembershipId: c.students[0]!, courseId: c.c1 }, select: { graceMilli: true, status: true } });
    expect(row).toEqual({ graceMilli: 3000, status: "PASS" });
  });
});

describe("TA-064: a closed session's corrections reach a result", () => {
  it("TA-064: after a closed session's mark is corrected, a corrected run is computed and the principal publishes it, the session staying closed", async () => {
    const session = await marked("ZZ Closed", 50_000);
    const first = await runResults(c.ctx("ctrl"), session);
    await publishRun(c.ctx("ctrl"), session, first.id!);
    await db.examSession.update({ where: { id: session }, data: { status: "CLOSED" } });
    await correctMark(c.ctx("ctrl"), session, { courseId: c.c2, studentMembershipId: c.students[1]!, marks: 60, absent: false, reason: "ZZ re-totalled after closing" });
    const rerun = await runResults(c.ctx("ctrl"), session, "ZZ the correction");
    expect(rerun.ok).toBe(true);
    expect((await publishRun(c.ctx("principal"), session, rerun.id!)).ok).toBe(true);
    const row = await db.courseResult.findFirstOrThrow({ where: { runId: rerun.id!, studentMembershipId: c.students[1]!, courseId: c.c2 }, select: { externalMilli: true } });
    expect(row.externalMilli).toBe(60_000);
    expect((await db.examSession.findUniqueOrThrow({ where: { id: session }, select: { status: true } })).status).toBe("CLOSED");
  });
});

describe("TA-560 and TA-069: a graced mark can be corrected, and grace to pass comes off a mark that no longer needs it", () => {
  it("TA-560: before publication, a correction over an approved grace writes version 3, and the run carrying it is the principal's to publish", async () => {
    const session = await marked("ZZ Mistyped", 24_000);
    const grace = await proposeGrace(c.ctx("ctrl"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 4, rule: "TO_PASS", reason: "ZZ four to pass" });
    await decideGrace(c.ctx("principal"), grace.id!, { approve: true });
    const fixed = await correctMark(c.ctx("ctrl"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 34, absent: false, reason: "ZZ answer book mis-totalled" });
    expect(fixed.ok).toBe(true);
    const m = await latestMark(session, c.c1, c.students[0]!);
    expect({ version: m.version, source: m.source, externalMilli: m.externalMilli }).toEqual({ version: 3, source: "CORRECTION", externalMilli: 34_000 });
    // TA-069 on the way: 34 passes without the grace, so it is not carried.
    expect(m.graceMilli).toBe(0);
    const run = await runResults(c.ctx("ctrl"), session);
    expect((await refusalOf(publishRun(c.ctx("ctrl"), session, run.id!))).key).toBe("examCell.refuseCorrectedPublishPrincipal");
    expect((await publishRun(c.ctx("principal"), session, run.id!)).ok).toBe(true);
  });

  it("TA-560: on the web, the correction form offers a graced mark before publication and Publish is drawn for the principal once a correction stands", async () => {
    const session = await marked("ZZ Web form", 24_000);
    const sheet = async () => marksSheet(c.ctx("ctrl"), session, c.c1);
    // No grace yet: nothing to correct before publication (the entry is the way), and the controller publishes.
    expect(correctableRows(await sheet(), "CONDUCT")).toHaveLength(0);
    expect(await publishNeedsPrincipal(c.ctx("ctrl"), session)).toBe(false);
    const grace = await proposeGrace(c.ctx("ctrl"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 4, rule: "TO_PASS", reason: "ZZ four to pass" });
    await decideGrace(c.ctx("principal"), grace.id!, { approve: true });
    // The graced mark, and only it, is offered; the form appears for it (the page drew it after publication alone).
    expect(correctableRows(await sheet(), "CONDUCT").map((r) => r.studentMembershipId)).toEqual([c.students[0]!]);
    expect(correctableRows(await sheet(), "FORMS")).toHaveLength(0);
    await correctMark(c.ctx("ctrl"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 34, absent: false, reason: "ZZ answer book mis-totalled" });
    // The run carrying the correction is the principal's: the page draws Publish for them, not the controller.
    expect(await publishNeedsPrincipal(c.ctx("ctrl"), session)).toBe(true);
    const marksPage = readFileSync("src/app/(app)/exam-cell/sessions/[sessionId]/marks/page.tsx", "utf8");
    expect(marksPage).toContain("correctableRows(sheet, s.status)");
    expect(marksPage).not.toContain("w && sheet && s.published ?");
    const resultsPage = readFileSync("src/app/(app)/exam-cell/sessions/[sessionId]/results/page.tsx", "utf8");
    expect(resultsPage).toContain("publishNeedsPrincipal(ctx, s.id)");
    expect(resultsPage).toContain('(principalPublishes ? ctx.role === "PRINCIPAL" : s.canWrite)');
    expect(resultsPage).not.toContain('(s.published ? ctx.role === "PRINCIPAL" : s.canWrite)');
  });

  it("TA-069: a revaluation that raises a graced mark past the pass takes the grace to pass off", async () => {
    const session = await marked("ZZ Revalued", 24_000);
    const grace = await proposeGrace(c.ctx("ctrl"), session, { courseId: c.c1, studentMembershipId: c.students[0]!, marks: 4, rule: "TO_PASS", reason: "ZZ four to pass" });
    await decideGrace(c.ctx("principal"), grace.id!, { approve: true });
    const first = await runResults(c.ctx("ctrl"), session);
    await publishRun(c.ctx("ctrl"), session, first.id!);
    const asked = await askRevaluation(c.ctx("s1"), { sessionId: session, courseId: c.c1, kind: "REVAL" });
    await decideRevaluation(c.ctx("ctrl"), asked.id!, { outcome: "CHANGED", marks: 40 });
    const m = await latestMark(session, c.c1, c.students[0]!);
    expect({ externalMilli: m.externalMilli, graceMilli: m.graceMilli }).toEqual({ externalMilli: 40_000, graceMilli: 0 });
    const rerun = await runResults(c.ctx("ctrl"), session, "ZZ revaluation");
    const row = await db.courseResult.findFirstOrThrow({ where: { runId: rerun.id!, studentMembershipId: c.students[0]!, courseId: c.c1 }, select: { externalMilli: true, graceMilli: true } });
    expect(row).toEqual({ externalMilli: 40_000, graceMilli: 0 });
  });

  it("TA-570: deciding the revaluation again with other marks is refused and the mark stays; the same marks again are the same", async () => {
    const r = await db.revaluation.findFirstOrThrow({ where: { schoolId: c.id, studentMembershipId: c.students[0]!, status: "DECIDED", outcome: "CHANGED" }, select: { id: true, sessionId: true } });
    const refused = await refusalOf(decideRevaluation(c.ctx("ctrl"), r.id, { outcome: "CHANGED", marks: 45 }));
    expect(refused).toMatchObject({ key: "examCell.refuseRevalRedecide", status: 409 });
    expect((await latestMark(r.sessionId, c.c1, c.students[0]!)).externalMilli).toBe(40_000);
    expect((await decideRevaluation(c.ctx("ctrl"), r.id, { outcome: "CHANGED", marks: 40 })).ok).toBe(true);
  });
});

describe("TA-530: the session's grace cap holds under concurrency", () => {
  it("TA-530: two proposals of 4 in two courses at once, cap 6, leave one refused, round after round", async () => {
    const session = await g.session("ZZ Cap");
    for (const s of g.students) for (const course of [g.c1, g.c2]) await g.mark(session, course, s, s === g.students[0] ? 24_000 : 50_000);
    let refusals = 0;
    for (let round = 0; round < 5; round += 1) {
      await db.examGrace.deleteMany({ where: { sessionId: session } });
      const settled = await Promise.allSettled([
        proposeGrace(g.ctx("ctrl"), session, { courseId: g.c1, studentMembershipId: g.students[0]!, marks: 4, rule: "TO_PASS", reason: "ZZ four" }),
        proposeGrace(g.ctx("ctrl2"), session, { courseId: g.c2, studentMembershipId: g.students[0]!, marks: 4, rule: "TO_PASS", reason: "ZZ four" }),
      ]);
      refusals += settled.filter((x) => x.status === "rejected" && (x.reason as { key?: string }).key === "examCell.refuseGraceCap").length;
      const sum = (await db.examGrace.findMany({ where: { sessionId: session, status: { in: ["PROPOSED", "APPROVED"] } }, select: { graceMilli: true } })).reduce((a, x) => a + x.graceMilli, 0);
      expect(sum).toBeLessThanOrEqual(6000);
    }
    expect(refusals).toBe(5);
  });

  it("TA-530: an edit racing the approval never leaves the row and the mark disagreeing", async () => {
    const session = await g.session("ZZ Edit race", { students: [g.students[1]!] });
    await g.mark(session, g.c1, g.students[1]!, 26_000);
    await g.mark(session, g.c2, g.students[1]!, 50_000);
    const grace = await proposeGrace(g.ctx("ctrl"), session, { courseId: g.c1, studentMembershipId: g.students[1]!, marks: 2, rule: "TO_PASS", reason: "ZZ two" });
    await Promise.allSettled([decideGrace(g.ctx("principal"), grace.id!, { approve: true }), proposeGrace(g.ctx("ctrl"), session, { courseId: g.c1, studentMembershipId: g.students[1]!, marks: 5, rule: "TO_PASS", reason: "ZZ five" })]);
    const row = await db.examGrace.findUniqueOrThrow({ where: { id: grace.id! }, select: { status: true, graceMilli: true } });
    expect(row.status).toBe("APPROVED");
    expect((await latestMark(session, g.c1, g.students[1]!)).graceMilli).toBe(row.graceMilli);
  });
});

describe("TA-303: unfair means hold the result and debar the next session", () => {
  it("TA-303: a run waits while a case of the session is undecided", async () => {
    const session = await marked("ZZ Undecided", 50_000);
    const schedule = await db.examSchedule.create({ data: { schoolId: c.id, sessionId: session, courseId: c.c1, courseCode: "ZCA", courseName: "ZZ Mechanics", at: new Date("2026-11-02T04:30:00Z") }, select: { id: true } });
    const m = await db.malpractice.create({ data: { schoolId: c.id, sessionId: session, scheduleId: schedule.id, studentMembershipId: c.students[1]!, note: "ZZ chit found", reportedByUserId: c.user.ctrl! }, select: { id: true } });
    const refused = await refusalOf(runResults(c.ctx("ctrl"), session));
    expect(refused).toMatchObject({ key: "examCell.refuseMalpracticeUndecided", status: 409, vars: { count: 1 } });
    expect(await db.resultRun.count({ where: { sessionId: session } })).toBe(0);
    await decideMalpractice(c.ctx("ctrl"), m.id, { decision: "WARNING", note: "ZZ warned" });
    expect((await runResults(c.ctx("ctrl"), session)).ok).toBe(true);
  });

  it("TA-303: a student debarred from the next session cannot submit a form there, nor have one approved", async () => {
    const before = await c.session("ZZ Debarring", { students: [c.students[1]!, c.students[2]!] });
    const schedule = await db.examSchedule.create({ data: { schoolId: c.id, sessionId: before, courseId: c.c1, courseCode: "ZCA", courseName: "ZZ Mechanics", at: new Date("2026-11-03T04:30:00Z") }, select: { id: true } });
    for (const s of [c.students[1]!, c.students[2]!]) await db.malpractice.create({ data: { schoolId: c.id, sessionId: before, scheduleId: schedule.id, studentMembershipId: s, note: "ZZ copying", reportedByUserId: c.user.ctrl!, decision: "DEBAR_NEXT", decidedByUserId: c.user.ctrl!, decidedAt: new Date() } });
    const next = (await db.examSession.create({ data: { schoolId: c.id, name: `ZZ Next ${c.stamp}`, kind: "REGULAR", termId: c.term, status: "FORMS" }, select: { id: true } })).id;
    const courses = JSON.stringify([{ courseId: c.c1, kind: "REGULAR" }]);
    const draft = await db.examForm.create({ data: { schoolId: c.id, sessionId: next, studentMembershipId: c.students[2]!, coursesJson: courses }, select: { id: true } });
    const submitted = await db.examForm.create({ data: { schoolId: c.id, sessionId: next, studentMembershipId: c.students[1]!, coursesJson: courses, status: "SUBMITTED", submittedAt: new Date(), eligible: true, noDues: true }, select: { id: true } });
    const one = await refusalOf(submitForm(c.ctx("ctrl"), draft.id));
    expect(one).toMatchObject({ key: "examCell.refuseDebarred", status: 409 });
    const two = await refusalOf(decideForm(c.ctx("ctrl"), submitted.id, { approve: true, waiveFee: false }));
    expect(two).toMatchObject({ key: "examCell.refuseDebarred", status: 409 });
    expect((await db.examForm.findUniqueOrThrow({ where: { id: submitted.id }, select: { status: true } })).status).toBe("SUBMITTED");
    // Refusing the form stays open to the controller.
    expect((await decideForm(c.ctx("ctrl"), submitted.id, { approve: false, waiveFee: false, reason: "ZZ debarred" })).ok).toBe(true);
  });
});

describe("TA-070: a locked internal is read on its own maximum", () => {
  it("TA-070: the two modules fall back to the same maxima and ATKT limit for a scheme with no rules", () => {
    const academics = readPassingRules("{}");
    const exams = rulesOf("{}");
    expect({ internalMax: academics.internalMax, externalMax: academics.externalMax, atktLimit: academics.atktLimit }).toEqual({ internalMax: exams.internalMax, externalMax: exams.externalMax, atktLimit: exams.atktLimit });
    expect(exams.internalMax).toBe(DEFAULT_PASSING_RULES.internalMax);
  });

  it("TA-070: a run is refused, naming the course, while a lock's out-of differs from the scheme's internal maximum", async () => {
    const session = await marked("ZZ Scale", 50_000);
    await db.internalLock.update({ where: { offeringId: c.o1 }, data: { outOf: 40 } });
    try {
      const refused = await refusalOf(runResults(c.ctx("ctrl"), session));
      expect(refused).toMatchObject({ key: "examCell.refuseInternalOutOf", status: 409 });
      expect((refused.vars as { courses: string }).courses).toContain(`ZCA${c.suffix}`);
      expect(await db.resultRun.count({ where: { sessionId: session } })).toBe(0);
    } finally {
      await db.internalLock.update({ where: { offeringId: c.o1 }, data: { outOf: 30 } });
    }
  });

  it("TA-070: a scheme's internal maximum does not change once internals are locked under it", async () => {
    await db.membership.create({ data: { userId: c.user.ctrl2!, schoolId: c.id, role: "ADMIN", status: "ACTIVE" } });
    const admin = c.ctx("ctrl2", "ADMIN");
    admin.membershipId = (await db.membership.findFirstOrThrow({ where: { userId: c.user.ctrl2!, schoolId: c.id, role: "ADMIN" }, select: { id: true } })).id;
    const input = (internalMax: number) => ({ id: c.schemeId, programmeId: c.programmeId, name: `ZZ TACEC scheme Runs`, effectiveYear: 2024, gradingTable: [{ grade: "A" as const, points: 10, minPercent: 50 }, { grade: "F" as const, points: 0, minPercent: 0 }], passingRules: { minPercentPerCourse: 40, atktLimit: 2, totalCredits: 120, internalMax, externalMax: 100 - internalMax, minTermCredits: 0, maxTermCredits: 30 } });
    const refused = await refusalOf(saveScheme(admin, input(40)));
    expect(refused).toMatchObject({ key: "academics.refuseInternalMaxLocked", status: 409 });
    expect(rulesOf((await db.scheme.findUniqueOrThrow({ where: { id: c.schemeId }, select: { passingRules: true } })).passingRules).internalMax).toBe(30);
  });

  it("TA-070: a scheme with no rules of its own, locked out of the old fallback's 40, may be set to the 40 its locks carry", async () => {
    const found = await db.membership.findFirst({ where: { userId: c.user.ctrl2!, schoolId: c.id, role: "ADMIN" }, select: { id: true } });
    const adminId = found?.id ?? (await db.membership.create({ data: { userId: c.user.ctrl2!, schoolId: c.id, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
    const admin = c.ctx("ctrl2", "ADMIN");
    admin.membershipId = adminId;
    const input = (internalMax: number) => ({ id: c.schemeId, programmeId: c.programmeId, name: `ZZ TACEC scheme Runs`, effectiveYear: 2024, gradingTable: [{ grade: "A" as const, points: 10, minPercent: 50 }, { grade: "F" as const, points: 0, minPercent: 0 }], passingRules: { minPercentPerCourse: 40, atktLimit: 2, totalCredits: 120, internalMax, externalMax: 100 - internalMax, minTermCredits: 0, maxTermCredits: 30 } });
    const kept = (await db.scheme.findUniqueOrThrow({ where: { id: c.schemeId }, select: { passingRules: true } })).passingRules;
    // The scheme as an older office left it ('{}', read on today's fallback of 30) and its locks out of the 40 of then.
    await db.scheme.update({ where: { id: c.schemeId }, data: { passingRules: "{}" } });
    await db.internalLock.updateMany({ where: { offeringId: { in: [c.o1, c.o2] } }, data: { outOf: 40 } });
    try {
      expect(readPassingRules("{}").internalMax).toBe(30);
      // Another maximum than the locks' is still refused, naming the locks' 40.
      expect(await refusalOf(saveScheme(admin, input(35)))).toMatchObject({ key: "academics.refuseInternalMaxLocked", status: 409, vars: { max: 40 } });
      // The locks' own 40 goes through, so the scheme and the locks agree and a run can be computed again.
      expect((await saveScheme(admin, input(40))).id).toBe(c.schemeId);
      expect(rulesOf((await db.scheme.findUniqueOrThrow({ where: { id: c.schemeId }, select: { passingRules: true } })).passingRules).internalMax).toBe(40);
    } finally {
      await db.internalLock.updateMany({ where: { offeringId: { in: [c.o1, c.o2] } }, data: { outOf: 30 } });
      await db.scheme.update({ where: { id: c.schemeId }, data: { passingRules: kept } });
    }
  });
});
