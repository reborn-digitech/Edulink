/**
 * THE COLLEGE FAMILY PAGES (the stream demos' walk, DS-1 to DS-7; fixed 10
 * October 2026) on a ZZ college of this suite's own, removed afterwards.
 *
 * DS-1: a guardian whose first-claimed child is an adult who shares nothing
 * opens on the minor instead of a 404 (`familyChildren`, `pickChild`,
 * `childAccess`, and the family doors' `selectChild`); an adult's refusal
 * comes back as a value for the page to draw "Not shared with you".
 * DS-2: the family attendance door carries the lecture attendance at a college.
 * DS-3: the student's and the guardian's week is the registered offerings' slots.
 * DS-4: `kinds` on a nav entry hides the school's exams, syllabus, substitutions
 * and admissions at a college, and a family keeps them while any child is at a school.
 * DS-5: an adult at a college reads their own health card with the dial at never;
 * a college is made with the dial at 18.
 * DS-6: the HOD's peer-team visits are an engineering college's entry.
 * DS-7: the HOD's home says whether PLACEMENT is on, so the projects card can go.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NAV, SCHOOL_KINDS, hiddenByKind } from "@/lib/nav";
import { childAccess, familyChildren, institutionKindsForFamily, pickChild } from "@/lib/family-child";
import { familyCollegeWeek, myCollegeWeek } from "@/lib/family-college";
import { parentAttendance, selectChild } from "@/lib/api-reads/family";
import { setStudentConsent } from "@/lib/student-consent";
import { assertSelfRead, maySelfRead, selfReadAgeDefault } from "@/lib/self-read";
import { hodHome } from "@/lib/academics-homes";
import { AccessError } from "@/lib/access-error";
import { addDaysToKey, todayKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = todayKey("Asia/Kolkata");
const ids = { college: "", parent: "", adultUser: "", minorUser: "", hodUser: "", adult: "", minor: "", hod: "", offering: "" };

const yearsAgo = (years: number) => new Date(Date.UTC(new Date().getUTCFullYear() - years, new Date().getUTCMonth(), 1) - 40 * 86_400_000);
const PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
const ctxOf = (userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null): ActiveContext =>
  ({ sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: PREFS } }) as ActiveContext;

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ FamilyGaps ${STAMP}`, slug: `zz-familygaps-${STAMP}`, code: `ZFG${SUFFIX}`, contactEmail: `zz-familygaps-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", streamsJson: JSON.stringify(["SCIENCE"]), verifiedAt: new Date() }, select: { id: true } })).id;
  const c = ids.college;
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "ACADEMICS" }, { schoolId: c, module: "ALUMNI" }] });
  const user = (who: string, data: { birthdate?: Date; isMinor?: boolean } = {}) => db.user.create({ data: { name: `ZZ FamilyGaps ${who}`, email: `zz-familygaps-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: false, ...data }, select: { id: true } });
  const [parent, adult, minor, hod, faculty] = await Promise.all([user("Parent"), user("Adult", { birthdate: yearsAgo(20) }), user("Minor", { birthdate: yearsAgo(17), isMinor: true }), user("Hod"), user("Faculty")]);
  Object.assign(ids, { parent: parent.id, adultUser: adult.id, minorUser: minor.id, hodUser: hod.id });
  ids.adult = (await db.membership.create({ data: { userId: adult.id, schoolId: c, role: "STUDENT", status: "ACTIVE", studentCode: `ZFGA${SUFFIX}` }, select: { id: true } })).id;
  ids.minor = (await db.membership.create({ data: { userId: minor.id, schoolId: c, role: "STUDENT", status: "ACTIVE", studentCode: `ZFGM${SUFFIX}` }, select: { id: true } })).id;
  ids.hod = (await db.membership.create({ data: { userId: hod.id, schoolId: c, role: "HOD", status: "ACTIVE" }, select: { id: true } })).id;
  const fac = await db.membership.create({ data: { userId: faculty.id, schoolId: c, role: "FACULTY", status: "ACTIVE" }, select: { id: true } });
  // The adult was claimed FIRST: that is the order every family page used to open on.
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.adult, studentSchoolId: c, relation: "PARENT", status: "ACTIVE", createdAt: new Date(STAMP - 60_000) } });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.minor, studentSchoolId: c, relation: "PARENT", status: "ACTIVE", createdAt: new Date(STAMP) } });
  // One registered offering with one weekly slot for the minor, on a term that is running.
  const dept = await db.department.create({ data: { schoolId: c, code: "PHY", name: "ZZ Physics", hodMembershipId: ids.hod, condoneFloorPercent: 75 }, select: { id: true } });
  const programme = await db.programme.create({ data: { schoolId: c, departmentId: dept.id, code: "BSC", name: "ZZ BSc", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } });
  const scheme = await db.scheme.create({ data: { schoolId: c, programmeId: programme.id, name: "ZZ BSc 2024", effectiveYear: 2024, passingRules: JSON.stringify({ minSgpa: 4, maxBacklogs: 2 }) }, select: { id: true } });
  const course = await db.course.create({ data: { schoolId: c, schemeId: scheme.id, code: "ZZPHY101", name: "ZZ Mechanics", semester: 1, creditsL: 3, kind: "CORE", outcomes: "[]" }, select: { id: true } });
  const term = await db.academicTerm.create({ data: { schoolId: c, name: "ZZ Odd", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -30), endsOn: addDaysToKey(TODAY, 90), registrationOpensOn: addDaysToKey(TODAY, -40), registrationClosesOn: addDaysToKey(TODAY, -10) }, select: { id: true } });
  ids.offering = (await db.courseOffering.create({ data: { schoolId: c, termId: term.id, courseId: course.id, facultyMembershipId: fac.id, lectureHours: 3 }, select: { id: true } })).id;
  const period = await db.timetablePeriod.create({ data: { schoolId: c, name: "ZZ P1", startMinute: 540, endMinute: 590, position: 1 }, select: { id: true } });
  await db.offeringSlot.create({ data: { schoolId: c, offeringId: ids.offering, weekday: 1, periodId: period.id, kind: "LECTURE" } });
  await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: ids.minor, programmeId: programme.id, schemeId: scheme.id, entryYear: 2026 } });
  await db.courseRegistration.create({ data: { schoolId: c, studentMembershipId: ids.minor, offeringId: ids.offering, termId: term.id, kind: "CORE" } });
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("DS-1: which child a family page opens on", () => {
  it("tells an adult who shares nothing from a minor who shares everything, and opens on the minor though the adult was claimed first", async () => {
    const children = await familyChildren(ids.parent);
    expect(children.map((c) => c.studentMembershipId)).toEqual([ids.adult, ids.minor]);
    const [adult, minor] = children;
    expect(adult).toMatchObject({ college: true, adult: true, guarded: true, grants: [], readable: false });
    expect(minor).toMatchObject({ college: true, adult: false, guarded: false, readable: true });
    expect(minor!.grants).toHaveLength(6);
    expect(pickChild(children)?.studentMembershipId).toBe(ids.minor);
    // Asked for by name, the adult is the page's subject — the page then says "not shared".
    expect(pickChild(children, ids.adult)?.studentMembershipId).toBe(ids.adult);
    expect(pickChild(children, "c00000000000000000000000")?.studentMembershipId).toBe(ids.minor);
    expect(pickChild([])).toBeNull();
  });

  it("returns the adult's refusal as a value and the minor's link; a stranger's id still throws", async () => {
    const refused = await childAccess(ids.parent, ids.adult);
    expect(refused.link).toBeNull();
    expect(refused.refused?.key).toBe("consent.refuseNotGranted");
    expect((await childAccess(ids.parent, ids.adult, "ATTENDANCE")).refused?.key).toBe("consent.refuseNotGranted");
    const ok = await childAccess(ids.parent, ids.minor);
    expect(ok.refused).toBeNull();
    expect(ok.link?.studentMembershipId).toBe(ids.minor);
    await expect(childAccess(ids.parent, "c00000000000000000000000")).rejects.toBeInstanceOf(AccessError);
  });

  it("the family doors open on the readable child too, and refuse an adult asked for by id with the consent sentence", async () => {
    const ctx = ctxOf(ids.parent, "PARENT", null, null);
    expect((await selectChild(ctx)).selectedId).toBe(ids.minor);
    await expect(selectChild(ctx, ids.adult)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
  });

  it("once the adult grants ATTENDANCE they are readable, and only the pages that grant covers open", async () => {
    await setStudentConsent(ctxOf(ids.adultUser, "STUDENT", ids.college, ids.adult), "ATTENDANCE", true);
    const adult = (await familyChildren(ids.parent)).find((c) => c.studentMembershipId === ids.adult)!;
    expect(adult).toMatchObject({ guarded: true, grants: ["ATTENDANCE"], readable: true });
    expect((await childAccess(ids.parent, ids.adult, "ATTENDANCE")).link?.studentMembershipId).toBe(ids.adult);
    expect((await childAccess(ids.parent, ids.adult, "RESULTS")).refused?.key).toBe("consent.refuseNotGranted");
    expect((await childAccess(ids.parent, ids.adult)).refused?.key).toBe("consent.refuseNotGranted");
    await setStudentConsent(ctxOf(ids.adultUser, "STUDENT", ids.college, ids.adult), "ATTENDANCE", false);
    expect((await familyChildren(ids.parent)).find((c) => c.studentMembershipId === ids.adult)!.readable).toBe(false);
  });

  it("DS-4: a family's menu follows the children's institutions", async () => {
    expect(await institutionKindsForFamily(ids.parent)).toEqual(["COLLEGE"]);
    expect(await institutionKindsForFamily("c00000000000000000000000")).toEqual([]);
  });
});

describe("DS-2 and DS-3: a college child's attendance and week", () => {
  it("the family attendance door carries the lecture attendance at a college", async () => {
    const view = await parentAttendance(ctxOf(ids.parent, "PARENT", null, null), ids.minor, null);
    expect(view.child.studentMembershipId).toBe(ids.minor);
    expect(view.summary.total).toBe(0);
    expect(Array.isArray(view.lectures)).toBe(true);
    expect(view.lectures!.map((l) => l.courseCode)).toEqual(["ZZPHY101"]);
  });

  it("the guardian's and the student's week are the registered offerings' slots; an adult's guardian needs ATTENDANCE", async () => {
    const week = await familyCollegeWeek(ctxOf(ids.parent, "PARENT", null, null), ids.minor);
    expect(week.termName).toBe("ZZ Odd");
    expect(week.cells.map((c) => [c.courseCode, c.weekday, c.startMinute])).toEqual([["ZZPHY101", 1, 540]]);
    const mine = await myCollegeWeek(ctxOf(ids.minorUser, "STUDENT", ids.college, ids.minor));
    expect(mine.cells.map((c) => c.offeringId)).toEqual([ids.offering]);
    // The adult is registered on nothing: an empty week, and only once ATTENDANCE is granted.
    await expect(familyCollegeWeek(ctxOf(ids.parent, "PARENT", null, null), ids.adult)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
  });
});

describe("DS-4: school-only entries at a college", () => {
  it("hides the school's exams, syllabus, substitutions and admissions at a college and keeps them at a school or with no kind in scope", () => {
    expect(hiddenByKind(NAV.ADMIN, ["COLLEGE"]).sort()).toEqual(["/admin/admissions", "/admin/exams", "/admin/substitutions", "/admin/syllabus"]);
    expect(hiddenByKind(NAV.PRINCIPAL, ["AUTONOMOUS_COLLEGE"]).sort()).toEqual(["/admin/admissions", "/admin/substitutions", "/admin/syllabus", "/exams"]);
    expect(hiddenByKind(NAV.STUDENT, ["COLLEGE"])).toEqual(["/exams"]);
    expect(hiddenByKind(NAV.PARENT, ["COLLEGE"])).toEqual(["/exams"]);
    for (const role of ["ADMIN", "PRINCIPAL", "STUDENT", "PARENT"] as const) {
      expect(hiddenByKind(NAV[role], ["SCHOOL"])).toEqual([]);
      expect(hiddenByKind(NAV[role], ["JUNIOR_COLLEGE"])).toEqual([]);
      expect(hiddenByKind(NAV[role], [])).toEqual([]);
    }
    // A family with a child at a school and one at a college keeps the school's entry.
    expect(hiddenByKind(NAV.PARENT, ["COLLEGE", "SCHOOL"])).toEqual([]);
    expect(SCHOOL_KINDS).toEqual(["SCHOOL", "JUNIOR_COLLEGE"]);
    // The college's own entries carry no kinds and stay.
    expect(NAV.ADMIN.find((i) => i.href === "/admin/college-admissions")?.kinds).toBeUndefined();
  });

  it("DS-6: the HOD's peer-team visits are an engineering college's entry", () => {
    expect(NAV.HOD.find((i) => i.href === "/hod/visits")?.streams).toEqual(["ENGINEERING"]);
  });
});

describe("DS-5: an adult's own card at a college", () => {
  it("an adult reads their own with the dial at never; a seventeen-year-old still asks a grown-up; a new college starts at 18", async () => {
    expect((await db.school.findUniqueOrThrow({ where: { id: ids.college }, select: { selfReadAge: true } })).selfReadAge).toBeNull();
    await expect(assertSelfRead(ctxOf(ids.adultUser, "STUDENT", ids.college, ids.adult), ids.adult)).resolves.toMatchObject({ membershipId: ids.adult });
    expect(await maySelfRead(ctxOf(ids.minorUser, "STUDENT", ids.college, ids.minor), ids.minor)).toBe(false);
    // Somebody else's card is still nobody's.
    expect(await maySelfRead(ctxOf(ids.adultUser, "STUDENT", ids.college, ids.adult), ids.minor)).toBe(false);
    expect(selfReadAgeDefault("COLLEGE")).toBe(18);
    expect(selfReadAgeDefault("AUTONOMOUS_COLLEGE")).toBe(18);
    expect(selfReadAgeDefault("SCHOOL")).toBeNull();
    expect(selfReadAgeDefault("JUNIOR_COLLEGE")).toBeNull();
  });
});

describe("DS-7: the HOD's projects card", () => {
  it("the home says whether PLACEMENT is on", async () => {
    const ctx = ctxOf(ids.hodUser, "HOD", ids.college, ids.hod);
    expect((await hodHome(ctx)).placementOn).toBe(false);
    await db.schoolModule.create({ data: { schoolId: ids.college, module: "PLACEMENT" } });
    expect((await hodHome(ctx)).placementOn).toBe(true);
    await db.schoolModule.deleteMany({ where: { schoolId: ids.college, module: "PLACEMENT" } });
  });
});
