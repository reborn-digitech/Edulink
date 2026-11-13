/**
 * TA-269 (testing analysis of 13 November 2026, Medium, Functional): a college
 * could run the school's admission cycle beside its own.
 *
 * admissions.ts never read the institution's kind and its doors carried none,
 * so a college's registrar could create and open a school cycle (the phone's
 * menu offers it; the web page opened by its address), and a family could
 * apply from the public page and be admitted: a student with a class
 * enrolment and a school fee plan, and no CET list, no scrutiny, no
 * anti-ragging undertaking and no academic seat. Now the library refuses a
 * cycle, an application, a walk-in and an admission at a college (404, as a
 * door for another kind of institution is answered), the public read lists no
 * school cycle there, and the office's admission doors name a school's kinds,
 * so the session's gate answers them 404 at a college.
 *
 * One ZZ college of this suite's own, removed afterwards with its people.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { admit, apply, createCycle, schoolAdmissions } from "@/lib/admissions";
import { AccessError } from "@/lib/access-error";
import { GET as cyclesGet } from "@/app/api/v1/office/admissions/cycles/route";
import { menuFor } from "../../mobile/src/lib/nav";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tapia-college-${who}-${STAMP}@test.invalid`;
const ids = { college: "", year: "", cycle: "", admin: "", adminM: "", family: "", accepted: "" };
let office: ActiveContext;

const family = (): ActiveContext => ({
  sessionId: "test-session",
  membershipId: null,
  schoolId: null,
  role: "PARENT",
  user: { id: ids.family, name: "ZZ TAPIA College Family", preferredName: null, email: MAIL("family"), avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: false, email: false }, quietHours: null } as never },
});
const refusalOf = (work: () => Promise<unknown>) => work().then(() => null, (error: unknown) => (error instanceof AccessError ? { key: error.key, code: error.code } : { key: String(error), code: "" }));
const NOT_HERE = { key: "schoolCampus.refuseNotThisKind", code: "NOT_FOUND" };

beforeAll(async () => {
  ids.college = (
    await db.school.create({
      data: { name: `ZZ TAPIA College ${STAMP}`, slug: `zz-tapia-college-${STAMP}`, code: `ZPV${SUFFIX}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", locale: "en", kind: "COLLEGE", verifiedAt: new Date(), profilePublishedAt: new Date(), isTestFixture: true },
      select: { id: true },
    })
  ).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ TAPIA College Registrar", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.family = (await db.user.create({ data: { name: "ZZ TAPIA College Family", email: MAIL("family"), prefs: "{}" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  // A school cycle left from before the fix, open, and an application in it the family accepted.
  ids.cycle = (await db.admissionCycle.create({ data: { schoolId: ids.college, academicYearId: ids.year, name: "ZZ TAPIA stray cycle", gradesJson: JSON.stringify([{ grade: "11", seats: 5 }]), testRequired: false, status: "OPEN" }, select: { id: true } })).id;
  ids.accepted = (
    await db.application.create({
      data: { schoolId: ids.college, cycleId: ids.cycle, number: 1, serial: `ZZV-${SUFFIX}-1`, applicantUserId: ids.family, applicantName: "ZZ TAPIA College Family", childName: "ZZ TAPIA College Student", childBirthdate: new Date("2010-02-02T00:00:00Z"), gradeApplied: "11", status: "ACCEPTED", relation: "PARENT" },
      select: { id: true },
    })
  ).id;
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.college, role: "ADMIN" });
  office = (await getSession())!;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const pupils = ids.college ? await db.membership.findMany({ where: { schoolId: ids.college, role: "STUDENT" }, select: { userId: true } }) : [];
  const userIds = [ids.admin, ids.family, ...pupils.map((p) => p.userId)].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { bucket: `admissions-apply:${ids.family}` } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.college }, { userId: { in: userIds } }] } });
  if (ids.college) {
    await db.guardianship.deleteMany({ where: { studentSchoolId: ids.college } });
    await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-269: the school's admission road is not a college's", () => {
  it("TA-269: the college's admin cannot create a school cycle, and none is made", async () => {
    const before = await db.admissionCycle.count({ where: { schoolId: ids.college } });
    const refused = await refusalOf(() => createCycle(office, { academicYearId: ids.year, name: "ZZ TAPIA New cycle", grades: [{ grade: "11", seats: 3 }], documents: [], testRequired: false, notice: "", feeStructureId: null, opensAt: null, closesAt: null }));
    expect(refused).toEqual(NOT_HERE);
    expect(await db.admissionCycle.count({ where: { schoolId: ids.college } })).toBe(before);
  });

  it("TA-269: the college's public page lists no school cycle, and a family cannot apply to the stray one", async () => {
    expect((await schoolAdmissions(family(), ids.college)).cycles).toEqual([]);
    const refused = await refusalOf(() => apply(family(), { schoolId: ids.college, cycleId: ids.cycle, childName: "ZZ TAPIA Another Student", childBirthdate: "2010-03-03", gradeApplied: "11" }));
    expect(refused).toEqual(NOT_HERE);
    expect(await db.application.count({ where: { cycleId: ids.cycle } })).toBe(1);
  });

  it("TA-269: an application accepted in the stray cycle is not admitted: no student, no seat outside the college's desk", async () => {
    const refused = await refusalOf(() => admit(office, ids.accepted, {}));
    expect(refused).toEqual(NOT_HERE);
    expect(await db.membership.count({ where: { schoolId: ids.college, role: "STUDENT" } })).toBe(0);
    expect((await db.application.findUniqueOrThrow({ where: { id: ids.accepted }, select: { status: true } })).status).toBe("ACCEPTED");
  });

  it("TA-269: GET /api/v1/office/admissions/cycles at the college answers 404", async () => {
    __resetCookies();
    __setHeaders({ "x-edulink-route": "GET /api/v1/office/admissions/cycles" });
    await createSession(ids.admin, { schoolId: ids.college, role: "ADMIN" });
    const res = await cyclesGet();
    expect(res.status).toBe(404);
  });

  it("TA-269: the phone's More menu offers the school's Admissions at a school and not at a college, where the college's admissions stay", () => {
    const labels = (role: "ADMIN" | "PRINCIPAL", college: boolean) => menuFor(role, ["ADMISSIONS", "ACADEMICS"], [], [], undefined, college).flatMap((g) => g.items.map((i) => i.labelKey));
    for (const role of ["ADMIN", "PRINCIPAL"] as const) {
      expect(labels(role, false)).toContain("nav.admissions");
      expect(labels(role, true)).not.toContain("nav.admissions");
      expect(labels(role, true)).toContain("collegeOffice.admissionsTitle");
    }
  });
});
