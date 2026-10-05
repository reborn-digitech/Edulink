/**
 * THE EXAM CELL AFTER A RESULT, as the app role (audit of 5 October 2026,
 * A3-journeys-10, -11 and -17), at a ZZ college of this suite's own.
 *
 *   - A revaluation's fee is raised as a demand. `raiseDemand` read the
 *     current academic year through the app's `db` from INSIDE the tenant
 *     transaction, which runs on another pooled connection with no tenant
 *     set, so row-level security answered nothing and the demand was skipped
 *     while the student read "the fee is on your ledger". Every other suite
 *     runs as the owner, which is why none of them saw it: this one runs the
 *     library as the app role. And a fee that cannot be raised (no current
 *     year here) refuses the request instead of passing silently.
 *   - A revaluation that changes the marks says a corrected run is due (to
 *     the controller: RUN_DUE, then PUBLISH_DUE once computed) and "under
 *     correction" to the student, until a run published after the decision.
 *   - The result-file import names each row it did not write, with its
 *     reason; a mark over the course's maximum says so.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const OWNER_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = process.env.DATABASE_APP_URL;

const { db: appDb } = await import("@/lib/db");
const { createSession } = await import("@/lib/session");
const { __resetCookies, __setHeaders } = await import("./stubs/next-headers");
const { requireApiRoles } = await import("@/lib/api-roles");
const { askRevaluation, afterView, correctionsDue, decideRevaluation, myExams } = await import("@/lib/exam-cell-after");
const { importMarks, importReport } = await import("@/lib/exam-cell-marks");
const { RuleRefusal } = await import("@/lib/rule-refusal");
const { getT } = await import("@/lib/i18n/server");

const db = new PrismaClient({ datasourceUrl: OWNER_URL });
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const id: Record<string, string> = {};
const users: Record<string, string> = {};
const PRN = `ZZAF${SUFFIX}`;

async function as(who: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(users[who]!, { schoolId: id.college!, role: role as never });
  return requireApiRoles(role as never);
}

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ Exam After ${STAMP}`, slug: `zz-examafter-${STAMP}`, code: `ZEA${SUFFIX}`, contactEmail: `zz-examafter-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id);
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "EXAMS" }, { schoolId: c, module: "ACADEMICS" }] });
  for (const [who, role] of [["Controller", "EXAM_CONTROLLER"], ["Principal", "PRINCIPAL"], ["Student", "STUDENT"]] as const) {
    users[who] = (await db.user.create({ data: { name: `ZZ After ${who}`, email: `zz-examafter-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    id[who] = (await db.membership.create({ data: { userId: users[who]!, schoolId: c, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZEAS${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
  const dept = await db.department.create({ data: { schoolId: c, code: "ZEA", name: "ZZ After Physics" }, select: { id: true } });
  const prog = await db.programme.create({ data: { schoolId: c, departmentId: dept.id, code: "ZEAP", name: "ZZ BSc After", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } });
  const scheme = await db.scheme.create({ data: { schoolId: c, programmeId: prog.id, name: "ZZ After scheme", effectiveYear: 2024, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 1, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 0, maxTermCredits: 30 }) }, select: { id: true } });
  id.course = (await db.course.create({ data: { schoolId: c, schemeId: scheme.id, code: `ZEA${SUFFIX}`, name: "ZZ Optics", semester: 1, creditsL: 4 }, select: { id: true } })).id;
  id.term = (await db.academicTerm.create({ data: { schoolId: c, name: `ZZ After term ${STAMP}`, academicYear: "2025–26", startsOn: "2025-12-01", endsOn: "2026-04-30", registrationOpensOn: "2025-11-20", registrationClosesOn: "2025-12-10" }, select: { id: true } })).id;
  await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: id.Student!, programmeId: prog.id, schemeId: scheme.id, entryYear: 2025, prn: PRN } });
  // Not current to begin with: the first ask is refused for want of a year to raise the fee in.
  id.year = (await db.academicYear.create({ data: { schoolId: c, name: "2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: false }, select: { id: true } })).id;
  id.head = (await db.feeHead.create({ data: { schoolId: c, name: "ZZ Exam fees", code: "ZEXM", kind: "EXAM" }, select: { id: true } })).id;
  id.session = (await db.examSession.create({ data: { schoolId: c, name: `ZZ Summer ${STAMP}`, kind: "REGULAR", termId: id.term, photocopyFeePaise: 10000, revalFeePaise: 40000, feeHeadId: id.head, status: "PUBLISHED" }, select: { id: true } })).id;
  await db.examForm.create({ data: { schoolId: c, sessionId: id.session, studentMembershipId: id.Student!, coursesJson: JSON.stringify([{ courseId: id.course, kind: "REGULAR" }]), eligibilityJson: "{}", eligible: true, noDues: true, status: "APPROVED", submittedAt: new Date(Date.now() - 20 * 86_400_000) } });
  await db.examMark.create({ data: { schoolId: c, sessionId: id.session, courseId: id.course, studentMembershipId: id.Student!, internalMilli: 30000, externalMilli: 45000, matched: true, source: "IMPORT", version: 1, enteredByUserId: users.Controller! } });
  const run = await db.resultRun.create({ data: { schoolId: c, sessionId: id.session, number: 1, computedByUserId: users.Controller!, computedAt: new Date(Date.now() - 3 * 86_400_000), status: "PUBLISHED", publishedAt: new Date(Date.now() - 2 * 86_400_000), publishedByUserId: users.Controller! }, select: { id: true } });
  id.run1 = run.id;
  await db.courseResult.create({ data: { schoolId: c, runId: run.id, studentMembershipId: id.Student!, courseId: id.course, creditsTenths: 40, internalMilli: 30000, externalMilli: 45000, totalMilli: 75000, maxMilli: 100000, grade: "A", pointsTenths: 80, status: "PASS" } });
  await db.termResult.create({ data: { schoolId: c, runId: run.id, termId: id.term, studentMembershipId: id.Student!, sgpaHundredths: 800, creditsAttemptedTenths: 40, creditsEarnedTenths: 40, status: "PASS", cls: "DISTINCTION" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
  process.env.DATABASE_URL = OWNER_URL;
});

describe("a revaluation's fee (A3-journeys-10)", () => {
  it("runs as the app role, not the owner", async () => {
    const [app] = await appDb.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    const [owner] = await db.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    expect(app!.u).not.toBe(owner!.u);
  });

  it("refuses the request when the fee cannot be raised, and records nothing", async () => {
    const ctx = await as("Student", "STUDENT");
    const err = await askRevaluation(ctx, { sessionId: id.session!, courseId: id.course!, kind: "PHOTOCOPY" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RuleRefusal);
    expect((err as InstanceType<typeof RuleRefusal>).key).toBe("examCell.refuseFeeNotRaised");
    expect(await db.revaluation.count({ where: { schoolId: id.college! } })).toBe(0);
  });

  it("raises the fee as a demand on the student's ledger, as the app role", async () => {
    await db.academicYear.update({ where: { id: id.year! }, data: { isCurrent: true } });
    const ctx = await as("Student", "STUDENT");
    const r = await askRevaluation(ctx, { sessionId: id.session!, courseId: id.course!, kind: "REVAL" });
    const row = await db.revaluation.findUniqueOrThrow({ where: { id: r.id! } });
    expect(row.feeDemandId).not.toBeNull();
    const demand = await db.feeDemand.findUniqueOrThrow({ where: { id: row.feeDemandId! } });
    expect(demand).toMatchObject({ studentMembershipId: id.Student, academicYearId: id.year, netPaise: 40000, status: "OPEN" });
    id.reval = r.id!;
  });
});

describe("a corrected run after a revaluation changes the marks (A3-journeys-11)", () => {
  const rowFor = async (role: "EXAM_CONTROLLER" | "STUDENT") => {
    if (role === "STUDENT") {
      const mine = await myExams(await as("Student", "STUDENT"));
      return { row: mine.revaluations.find((x) => x.id === id.reval)!, result: mine.results.find((x) => x.sessionId === id.session)! };
    }
    return { row: (await afterView(await as("Controller", "EXAM_CONTROLLER"))).revaluations.find((x) => x.id === id.reval)!, result: null };
  };

  it("says a run is due once the marks change, to the controller and the student", async () => {
    expect((await rowFor("EXAM_CONTROLLER")).row.correction ?? null).toBeNull();
    const ctx = await as("Controller", "EXAM_CONTROLLER");
    await decideRevaluation(ctx, id.reval!, { outcome: "CHANGED", marks: 52 });
    expect((await rowFor("EXAM_CONTROLLER")).row.correction).toBe("RUN_DUE");
    expect(await correctionsDue(await as("Controller", "EXAM_CONTROLLER"), id.session!)).toEqual({ runDue: 1, publishDue: 0 });
    const student = await rowFor("STUDENT");
    expect(student.row.correction).toBe("RUN_DUE");
    expect(student.result!.underCorrection).toEqual([id.course]);
  });

  it("waits for the publication once a run is computed, and clears when one is published after the decision", async () => {
    const run2 = await db.resultRun.create({ data: { schoolId: id.college!, sessionId: id.session!, number: 2, computedByUserId: users.Controller!, reason: "ZZ revaluation", status: "DRAFT" }, select: { id: true } });
    expect((await rowFor("EXAM_CONTROLLER")).row.correction).toBe("PUBLISH_DUE");
    expect(await correctionsDue(await as("Controller", "EXAM_CONTROLLER"), id.session!)).toEqual({ runDue: 0, publishDue: 1 });
    expect((await rowFor("STUDENT")).row.correction).toBe("PUBLISH_DUE");
    await db.resultRun.update({ where: { id: id.run1! }, data: { status: "SUPERSEDED" } });
    await db.resultRun.update({ where: { id: run2.id }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedByUserId: users.Principal! } });
    expect((await rowFor("EXAM_CONTROLLER")).row.correction).toBeNull();
    expect(await correctionsDue(await as("Controller", "EXAM_CONTROLLER"), id.session!)).toEqual({ runDue: 0, publishDue: 0 });
    // The published run 2 carries no course rows here, so the student's last standing is run 1's; nothing reads "under correction".
    const mine = await myExams(await as("Student", "STUDENT"));
    expect(mine.revaluations.find((x) => x.id === id.reval)!.correction).toBeNull();
    expect(mine.results.every((x) => x.underCorrection.length === 0)).toBe(true);
  });
});

describe("the result file's unmatched rows (A3-journeys-17)", () => {
  it("names each row it did not write with its reason, and an over-maximum mark as over the maximum", async () => {
    const ctx = await as("Controller", "EXAM_CONTROLLER");
    const file = ["PRN,SEAT_NO,COURSE_CODE,INTERNAL,EXTERNAL", `${PRN},S1,ZEA${SUFFIX},25,75`, `ZZNOBODY${SUFFIX},S9,ZEA${SUFFIX},20,30`].join("\n");
    const r = await importMarks(ctx, id.session!, file);
    const t = await getT();
    expect(r).toMatchObject({ created: 0, updated: 0, unchanged: 0 });
    expect(r.unmatched).toEqual([
      { line: 2, key: `${PRN}/ZEA${SUFFIX}`, reason: t("examCell.importOverExternal", { max: 60 }) },
      { line: 3, key: `ZZNOBODY${SUFFIX}/ZEA${SUFFIX}`, reason: t("examCell.importNoStudent") },
    ]);
    const report = importReport(t, r);
    expect(report).toContain(t("examCell.importOverExternal", { max: 60 }));
    expect(report).toContain(t("examCell.importNoStudent"));
    expect(report).toContain(`ZZNOBODY${SUFFIX}/ZEA${SUFFIX}`);
  });
});
