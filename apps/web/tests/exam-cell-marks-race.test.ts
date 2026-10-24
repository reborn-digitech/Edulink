/**
 * QA-10 (QA campaign of 24 October 2026, E2E-B4).
 *
 * Two people keying the same course's sheet at the same moment is the
 * double-entry design's normal case. At sac the controller and the registrar
 * each entered PHY301's three marks at once: the registrar's answered 200 and
 * the controller's 500 ("Something went wrong"), every row was entry one by
 * the registrar and the controller's marks were lost, because both
 * transactions saw no version 1 and the second hit the version-1 unique key.
 * Now enterMarks takes the session row first, so the second waits and
 * becomes entry two: both land, and the marks stand where the two agree.
 *
 * At a ZZ college of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { enterMarks } from "@/lib/exam-cell-marks";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const id: Record<string, string> = {};
const COURSES = ["c1", "c2", "c3"] as const;

const as = (userKey: "ctrl" | "reg", role: "EXAM_CONTROLLER" | "ADMIN"): ActiveContext => ({
  sessionId: "test-session",
  membershipId: id[`${userKey}M`]!,
  schoolId: id.college!,
  role,
  user: { id: id[userKey]!, name: `ZZ Marks ${userKey}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
});

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ Marks Race ${STAMP}`, slug: `zz-marks-race-${STAMP}`, code: `ZMR${SUFFIX}`, contactEmail: `zz-marks-race-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id);
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "EXAMS" }, { schoolId: c, module: "ACADEMICS" }] });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Marks ${who}`, email: `zz-marks-race-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  id.ctrl = (await user("Controller")).id;
  id.ctrlM = (await db.membership.create({ data: { userId: id.ctrl, schoolId: c, role: "EXAM_CONTROLLER", status: "ACTIVE" }, select: { id: true } })).id;
  id.reg = (await user("Registrar")).id;
  id.regM = (await db.membership.create({ data: { userId: id.reg, schoolId: c, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  for (const n of [1, 2, 3]) {
    const u = (await user(`Student${n}`)).id;
    id[`s${n}`] = (await db.membership.create({ data: { userId: u, schoolId: c, role: "STUDENT", status: "ACTIVE", studentCode: `ZMR${n}${SUFFIX}` }, select: { id: true } })).id;
  }
  const dept = await db.department.create({ data: { schoolId: c, code: "ZMR", name: "ZZ Marks Science" }, select: { id: true } });
  const prog = await db.programme.create({ data: { schoolId: c, departmentId: dept.id, code: "ZMRP", name: "ZZ BSc Marks", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } });
  const scheme = await db.scheme.create({ data: { schoolId: c, programmeId: prog.id, name: "ZZ Marks scheme", effectiveYear: 2024, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 2, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 0, maxTermCredits: 30 }) }, select: { id: true } });
  for (const [i, k] of COURSES.entries()) id[k] = (await db.course.create({ data: { schoolId: c, schemeId: scheme.id, code: `ZMR${i}${SUFFIX}`, name: `ZZ Paper ${i}`, semester: 5, creditsL: 4 }, select: { id: true } })).id;
  id.term = (await db.academicTerm.create({ data: { schoolId: c, name: `ZZ Odd ${STAMP}`, academicYear: "2026–27", startsOn: "2026-06-15", endsOn: "2026-11-30", registrationOpensOn: "2026-06-01", registrationClosesOn: "2026-06-30" }, select: { id: true } })).id;
  id.session = (await db.examSession.create({ data: { schoolId: c, name: `ZZ Odd ${STAMP}`, kind: "REGULAR", termId: id.term, status: "CONDUCT" }, select: { id: true } })).id;
  const courses = COURSES.map((k) => ({ courseId: id[k]!, kind: "REGULAR" }));
  for (const n of [1, 2, 3]) await db.examForm.create({ data: { schoolId: c, sessionId: id.session, studentMembershipId: id[`s${n}`]!, coursesJson: JSON.stringify(courses), eligibilityJson: "{}", eligible: true, noDues: true, status: "APPROVED", submittedAt: new Date() } });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("QA-10: two people's first mark entries at the same moment", () => {
  it.each(COURSES)("both land on %s: one is entry one, the other entry two, and the agreed marks stand", async (k) => {
    const entries = [1, 2, 3].map((n) => ({ studentMembershipId: id[`s${n}`]!, marks: 40 + n, absent: false }));
    const [a, b] = await Promise.allSettled([
      enterMarks(as("ctrl", "EXAM_CONTROLLER"), id.session!, { courseId: id[k]!, entries }),
      enterMarks(as("reg", "ADMIN"), id.session!, { courseId: id[k]!, entries }),
    ]);
    expect(a.status, a.status === "rejected" ? String(a.reason) : "").toBe("fulfilled");
    expect(b.status, b.status === "rejected" ? String(b.reason) : "").toBe("fulfilled");
    const rows = await db.examMark.findMany({ where: { sessionId: id.session, courseId: id[k] }, select: { version: true, entry1ByUserId: true, entry2ByUserId: true, matched: true, externalMilli: true } });
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.version).toBe(1);
      expect(new Set([r.entry1ByUserId, r.entry2ByUserId])).toEqual(new Set([id.ctrl, id.reg]));
      expect(r.matched).toBe(true);
    }
    expect(rows.map((r) => r.externalMilli).sort()).toEqual([41_000, 42_000, 43_000]);
  });
});
