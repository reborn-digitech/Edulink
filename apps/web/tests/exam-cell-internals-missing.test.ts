/**
 * QA-05 and QA-09 (QA campaign of 24 October 2026, E2E-B1 and E2E-B5).
 *
 * QA-05: a result was computed and published with missing internal marks
 * counted as nought. At sac only two of seven courses had internals locked by
 * their HOD; the run answered 200 with five of five students ATKT, a 53/60
 * external graded F, and publishing opened nine backlogs and told the
 * families. Now the run is refused (409) while a sitting course whose scheme
 * has an internal part has no internal mark for a student who sat it, and the
 * refusal names the courses; a course whose scheme has no internal part needs
 * none, and an absent student's missing internal does not hold the run up
 * (the result is AB either way).
 *
 * QA-09: the marks sheet looked the HOD's lock up under `<course>|<student>`
 * while `internalsFor` keys it `<student>|<course>`, so every locked internal
 * read null and unlocked, which is how QA-05 went unseen.
 *
 * At a ZZ college of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { marksSheet, runResults } from "@/lib/exam-cell-marks";
import { RuleRefusal } from "@/lib/rule-refusal";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const id: Record<string, string> = {};
const code = (c: string) => `${c}${SUFFIX}`;

const controller = (): ActiveContext => ({
  sessionId: "test-session",
  membershipId: id.ctrlM!,
  schoolId: id.college!,
  role: "EXAM_CONTROLLER",
  user: { id: id.ctrl!, name: "ZZ Internals Controller", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
});

async function refusal(p: Promise<unknown>): Promise<RuleRefusal> {
  try {
    await p;
  } catch (error) {
    if (error instanceof RuleRefusal) return error;
    throw error;
  }
  throw new Error("expected a RuleRefusal, the run was computed");
}

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ Internals ${STAMP}`, slug: `zz-internals-${STAMP}`, code: `ZIN${SUFFIX}`, contactEmail: `zz-internals-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id);
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "EXAMS" }, { schoolId: c, module: "ACADEMICS" }] });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Internals ${who}`, email: `zz-internals-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  id.ctrl = (await user("Controller")).id;
  id.ctrlM = (await db.membership.create({ data: { userId: id.ctrl, schoolId: c, role: "EXAM_CONTROLLER", status: "ACTIVE" }, select: { id: true } })).id;
  for (const n of [1, 2, 3]) {
    const u = (await user(`Student${n}`)).id;
    id[`s${n}`] = (await db.membership.create({ data: { userId: u, schoolId: c, role: "STUDENT", status: "ACTIVE", studentCode: `ZIN${n}${SUFFIX}` }, select: { id: true } })).id;
  }
  const dept = await db.department.create({ data: { schoolId: c, code: "ZIN", name: "ZZ Internals Science" }, select: { id: true } });
  const prog = await db.programme.create({ data: { schoolId: c, departmentId: dept.id, code: "ZINP", name: "ZZ BSc Internals", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } });
  // Internal 40 + external 60, 40 % of each to pass (sac's scheme); and an external-only scheme for the paper with no internal part.
  const scheme = await db.scheme.create({ data: { schoolId: c, programmeId: prog.id, name: "ZZ Internals scheme", effectiveYear: 2024, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 2, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 0, maxTermCredits: 30 }) }, select: { id: true } });
  const externalOnly = await db.scheme.create({ data: { schoolId: c, programmeId: prog.id, name: "ZZ External-only scheme", effectiveYear: 2024, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 2, totalCredits: 120, internalMax: 0, externalMax: 100, minTermCredits: 0, maxTermCredits: 30 }) }, select: { id: true } });
  id.phy = (await db.course.create({ data: { schoolId: c, schemeId: scheme.id, code: code("PHY"), name: "ZZ Optics", semester: 5, creditsL: 4 }, select: { id: true } })).id;
  id.mat = (await db.course.create({ data: { schoolId: c, schemeId: scheme.id, code: code("MAT"), name: "ZZ Analysis", semester: 5, creditsL: 4 }, select: { id: true } })).id;
  id.com = (await db.course.create({ data: { schoolId: c, schemeId: scheme.id, code: code("COM"), name: "ZZ Accounts", semester: 5, creditsL: 4 }, select: { id: true } })).id;
  id.env = (await db.course.create({ data: { schoolId: c, schemeId: externalOnly.id, code: code("EVS"), name: "ZZ Environment", semester: 5, creditsL: 2 }, select: { id: true } })).id;
  id.term = (await db.academicTerm.create({ data: { schoolId: c, name: `ZZ Odd ${STAMP}`, academicYear: "2026–27", startsOn: "2026-06-15", endsOn: "2026-11-30", registrationOpensOn: "2026-06-01", registrationClosesOn: "2026-06-30" }, select: { id: true } })).id;
  for (const course of ["phy", "mat", "com"] as const) id[`o_${course}`] = (await db.courseOffering.create({ data: { schoolId: c, termId: id.term, courseId: id[course]! }, select: { id: true } })).id;
  // The HOD locked PHY's internals (27.9, 37.7, 30.5 of 40, as at sac). MAT has none; COM's lock leaves out student 3.
  await db.internalLock.create({ data: { schoolId: c, offeringId: id.o_phy!, termId: id.term, outOf: 40, totalsJson: JSON.stringify([{ studentMembershipId: id.s1, totalHundredths: 2790 }, { studentMembershipId: id.s2, totalHundredths: 3770 }, { studentMembershipId: id.s3, totalHundredths: 3050 }]), lockedByUserId: id.ctrl } });
  await db.internalLock.create({ data: { schoolId: c, offeringId: id.o_com!, termId: id.term, outOf: 40, totalsJson: JSON.stringify([{ studentMembershipId: id.s1, totalHundredths: 3000 }, { studentMembershipId: id.s2, totalHundredths: 3000 }]), lockedByUserId: id.ctrl } });
  id.session = (await db.examSession.create({ data: { schoolId: c, name: `ZZ Odd ${STAMP}`, kind: "REGULAR", termId: id.term, status: "CONDUCT" }, select: { id: true } })).id;
  const courses = ["phy", "mat", "com", "env"].map((k) => ({ courseId: id[k]!, kind: "REGULAR" }));
  for (const n of [1, 2, 3]) {
    const s = id[`s${n}`]!;
    await db.examForm.create({ data: { schoolId: c, sessionId: id.session, studentMembershipId: s, coursesJson: JSON.stringify(courses), eligibilityJson: "{}", eligible: true, noDues: true, status: "APPROVED", submittedAt: new Date() } });
    for (const k of ["phy", "mat", "com", "env"]) {
      // Double-entered and matched; student 3 was absent from COM's paper. 53/60 is Aditya Patil's MAT301.
      const absent = n === 3 && k === "com";
      const external = k === "env" ? 70_000 : 53_000;
      await db.examMark.create({ data: { schoolId: c, sessionId: id.session, courseId: id[k]!, studentMembershipId: s, internalMilli: null, externalMilli: absent ? null : external, absent, entry1Milli: absent ? null : external, entry1Absent: absent, entry1ByUserId: id.ctrl, entry2Milli: absent ? null : external, entry2Absent: absent, entry2ByUserId: id.ctrl, matched: true, source: "DOUBLE_ENTRY", version: 1, enteredByUserId: id.ctrl } });
    }
  }
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("QA-09: the marks sheet shows the HOD's locked internals", () => {
  it("reads PHY's locked internals and says they are locked", async () => {
    const sheet = await marksSheet(controller(), id.session!, id.phy!);
    const bySid = new Map(sheet.rows.map((r) => [r.studentMembershipId, r]));
    expect(bySid.get(id.s1!)).toMatchObject({ internalMilli: 27_900, internalLocked: true });
    expect(bySid.get(id.s2!)).toMatchObject({ internalMilli: 37_700, internalLocked: true });
    expect(bySid.get(id.s3!)).toMatchObject({ internalMilli: 30_500, internalLocked: true });
  });

  it("shows a course with no lock as missing, so the controller can see it before the run", async () => {
    const sheet = await marksSheet(controller(), id.session!, id.mat!);
    expect(sheet.rows.every((r) => r.internalMilli === null && !r.internalLocked)).toBe(true);
  });
});

describe("QA-05: no result while an internal mark the scheme needs is missing", () => {
  it("refuses the run with 409 and names the courses; nothing is computed", async () => {
    const refused = await refusal(runResults(controller(), id.session!));
    expect(refused.key).toBe("examCell.refuseInternalsMissing");
    expect(refused.status).toBe(409);
    // MAT (no lock at all) and COM (student 3 left out of the lock, but absent from the paper, so not needed): MAT alone.
    expect(refused.vars).toEqual({ count: 3, courses: code("MAT") });
    expect(await db.resultRun.count({ where: { sessionId: id.session } })).toBe(0);
    expect((await db.examSession.findUniqueOrThrow({ where: { id: id.session }, select: { status: true } })).status).toBe("CONDUCT");
  });

  it("names a course whose lock leaves out a student who sat the paper", async () => {
    // Student 3 now sat COM: their internal is needed and missing.
    await db.examMark.updateMany({ where: { sessionId: id.session, courseId: id.com, studentMembershipId: id.s3 }, data: { absent: false, externalMilli: 53_000, entry1Absent: false, entry1Milli: 53_000, entry2Absent: false, entry2Milli: 53_000 } });
    const refused = await refusal(runResults(controller(), id.session!));
    expect(refused.vars).toEqual({ count: 4, courses: [code("COM"), code("MAT")].sort().join(", ") });
    await db.examMark.updateMany({ where: { sessionId: id.session, courseId: id.com, studentMembershipId: id.s3 }, data: { absent: true, externalMilli: null, entry1Absent: true, entry1Milli: null, entry2Absent: true, entry2Milli: null } });
  });

  it("computes once MAT's internals are locked, and a 53/60 external passes on its real internal", async () => {
    await db.internalLock.create({ data: { schoolId: id.college!, offeringId: id.o_mat!, termId: id.term!, outOf: 40, totalsJson: JSON.stringify([id.s1, id.s2, id.s3].map((studentMembershipId) => ({ studentMembershipId, totalHundredths: 2500 }))), lockedByUserId: id.ctrl! } });
    const run = await runResults(controller(), id.session!);
    expect(run.ok).toBe(true);
    const mat = await db.courseResult.findFirstOrThrow({ where: { runId: run.id!, courseId: id.mat, studentMembershipId: id.s1 }, select: { internalMilli: true, externalMilli: true, status: true } });
    expect(mat).toEqual({ internalMilli: 25_000, externalMilli: 53_000, status: "PASS" });
    // The external-only paper needed no internal and passed on its external.
    const env = await db.courseResult.findFirstOrThrow({ where: { runId: run.id!, courseId: id.env, studentMembershipId: id.s1 }, select: { internalMilli: true, status: true } });
    expect(env).toEqual({ internalMilli: null, status: "PASS" });
    expect(await db.termResult.count({ where: { runId: run.id!, status: "PASS" } })).toBe(2);
  });
});
