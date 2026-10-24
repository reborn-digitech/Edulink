/**
 * QA-29 (QA campaign of 24 October 2026, E2E-B6).
 *
 * At sac the controller pressed Publish on a DRAFT run twice at once: both
 * answered 200, the second press re-ran the whole publication after waiting
 * on the session lock, and every student was told twice (10 notices for 5),
 * the minor's guardian too, because the run's DRAFT status was read before
 * the lock. Now publishRun reads the status again under the lock and answers
 * a run already published as it stands: one publication, one audit row, one
 * notice each.
 *
 * At a ZZ college of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { publishRun } from "@/lib/exam-cell-marks";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-publish-race-${who.toLowerCase()}-${STAMP}@test.invalid`;
const id: Record<string, string> = {};
const STUDENTS = ["s1", "s2", "s3"] as const;

const controller = (): ActiveContext => ({
  sessionId: "test-session",
  membershipId: id.ctrlM!,
  schoolId: id.college!,
  role: "EXAM_CONTROLLER",
  user: { id: id.ctrl!, name: "ZZ Publish Controller", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
});

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ Publish Race ${STAMP}`, slug: `zz-publish-race-${STAMP}`, code: `ZPR${SUFFIX}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata", kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id);
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "EXAMS" }, { schoolId: c, module: "ACADEMICS" }] });
  id.ctrl = (await db.user.create({ data: { name: "ZZ Publish Controller", email: MAIL("ctrl") }, select: { id: true } })).id;
  id.ctrlM = (await db.membership.create({ data: { userId: id.ctrl, schoolId: c, role: "EXAM_CONTROLLER", status: "ACTIVE" }, select: { id: true } })).id;
  for (const key of STUDENTS) {
    // s3 is seventeen, with a guardian, as the minor at sac was.
    const minor = key === "s3";
    id[`${key}User`] = (await db.user.create({ data: { name: `ZZ Publish ${key}`, email: MAIL(key), ...(minor ? { isMinor: true, birthdate: new Date(Date.now() - 17 * 365 * 86_400_000) } : {}) }, select: { id: true } })).id;
    id[key] = (await db.membership.create({ data: { userId: id[`${key}User`]!, schoolId: c, role: "STUDENT", status: "ACTIVE", studentCode: `ZPR${key}${SUFFIX}` }, select: { id: true } })).id;
  }
  id.parent = (await db.user.create({ data: { name: "ZZ Publish Parent", email: MAIL("parent") }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: id.parent, studentMembershipId: id.s3!, studentSchoolId: c, status: "ACTIVE" } });
  id.term = `zz-publish-term-${STAMP}`;
  id.session = (await db.examSession.create({ data: { schoolId: c, name: `ZZ Odd ${STAMP}`, kind: "REGULAR", termId: id.term, status: "ASSESSMENT" }, select: { id: true } })).id;
  id.run = (await db.resultRun.create({ data: { schoolId: c, sessionId: id.session, number: 1, status: "DRAFT", computedByUserId: id.ctrl }, select: { id: true } })).id;
  for (const key of STUDENTS) {
    await db.courseResult.create({ data: { schoolId: c, runId: id.run, studentMembershipId: id[key]!, courseId: `zz-publish-course-${STAMP}`, creditsTenths: 40, internalMilli: 30_000, externalMilli: 40_000, totalMilli: 70_000, maxMilli: 100_000, grade: "A", pointsTenths: 80, status: "PASS" } });
    await db.termResult.create({ data: { schoolId: c, runId: id.run, termId: id.term, studentMembershipId: id[key]!, sgpaHundredths: 800, creditsAttemptedTenths: 40, creditsEarnedTenths: 40, status: "PASS", cls: "DISTINCTION" } });
  }
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("QA-29: Publish pressed twice at the same moment", () => {
  it("publishes once and tells each student and guardian once", async () => {
    const results = await Promise.allSettled([publishRun(controller(), id.session!, id.run!), publishRun(controller(), id.session!, id.run!)]);
    expect(results.map((r) => (r.status === "rejected" ? String(r.reason) : "ok"))).toEqual(["ok", "ok"]);
    const run = await db.resultRun.findUniqueOrThrow({ where: { id: id.run }, select: { status: true } });
    expect(run.status).toBe("PUBLISHED");
    expect(await db.auditLog.count({ where: { schoolId: id.college, action: "exam.result.publish" } })).toBe(1);
    for (const key of STUDENTS) expect(await db.notification.count({ where: { userId: id[`${key}User`], titleKey: "examCell.notifyResult" } }), key).toBe(1);
    expect(await db.notification.count({ where: { userId: id.parent, titleKey: "riskDecisions.notifResultFamily" } })).toBe(1);
  });

  it("a press after it is answered as it stands and tells nobody again", async () => {
    const again = await publishRun(controller(), id.session!, id.run!);
    expect(again).toMatchObject({ ok: true, id: id.run, count: null });
    expect(await db.auditLog.count({ where: { schoolId: id.college, action: "exam.result.publish" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: id.s1User, titleKey: "examCell.notifyResult" } })).toBe(1);
  });
});
