/**
 * QA-04 (QA campaign of 24 October 2026, E2E-A3): the office and the head
 * pressing Admit on one ACCEPTED application at the same moment made two
 * pupils: two accounts, two memberships, two enrolments, the guardian linked
 * to both, the roster up by two against a seat count of one of one. The
 * status and the seats were read before the transaction and not again inside.
 *
 * Now the cycle and the application are locked inside the transaction and
 * read again under the lock: the second press finds the application ADMITTED
 * and is answered with that admission as it stands, and two applications
 * racing for a grade's last seat give one pupil and one "seats full".
 *
 * At a ZZ school of this suite's own; the pupils it admits are removed by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { admit } from "@/lib/admissions";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const ids = { school: "", year: "", klass: "", cycle: "", admin: "", adminM: "", head: "", headM: "", family: "" };
let serial = 0;

function ctx(userId: string, membershipId: string, role: "ADMIN" | "PRINCIPAL"): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId: ids.school,
    role,
    user: { id: userId, name: "ZZ Admit Race", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const office = () => ctx(ids.admin, ids.adminM, "ADMIN");
const head = () => ctx(ids.head, ids.headM, "PRINCIPAL");

async function accepted(childName: string, grade: string): Promise<string> {
  serial += 1;
  return (
    await db.application.create({
      data: { schoolId: ids.school, cycleId: ids.cycle, number: serial, serial: `ZZR-${SUFFIX}-${serial}`, applicantUserId: ids.family, applicantName: "ZZ Race Family", childName, childBirthdate: new Date("2016-02-02T00:00:00Z"), gradeApplied: grade, status: "ACCEPTED", relation: "PARENT" },
      select: { id: true },
    })
  ).id;
}
const pupilsHere = () => db.membership.findMany({ where: { schoolId: ids.school, role: "STUDENT" }, select: { id: true, userId: true } });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Admit Race ${STAMP}`, slug: `zz-admit-race-${STAMP}`, code: `ZAR${SUFFIX}`, contactEmail: `zz-admit-race-${STAMP}@test.invalid`, timezone: TZ, locale: "en", verifiedAt: new Date(), gradeLow: "1", gradeHigh: "10" }, select: { id: true } })).id;
  const user = (who: string) => db.user.create({ data: { name: `ZZ Admit Race ${who}`, email: `zz-admit-race-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  ids.admin = (await user("Admin")).id;
  ids.head = (await user("Head")).id;
  ids.family = (await user("Family")).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.headM = (await db.membership.create({ data: { userId: ids.head, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZR5${SUFFIX}` }, select: { id: true } })).id;
  // Grade 5 has one seat (the report's mid-year cycle); grade 6 has one too, for the two-applications race.
  ids.cycle = (await db.admissionCycle.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ Mid-year", gradesJson: JSON.stringify([{ grade: "5", seats: 1 }, { grade: "6", seats: 1 }]), testRequired: false, status: "OPEN" }, select: { id: true } })).id;
});

afterAll(async () => {
  // The pupils this suite admitted, by id, then the school and its people.
  const pupils = await pupilsHere();
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { user: { email: { contains: `-${STAMP}@test.invalid` } } }] } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: pupils.map((p) => p.userId) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("QA-04: Admit pressed twice at once", () => {
  it("makes one pupil, and the second press is answered with that admission", async () => {
    const app = await accepted("ZZ Race Child", "5");
    const results = await Promise.allSettled([admit(office(), app, { classId: ids.klass }), admit(head(), app, { classId: ids.klass })]);
    const answers = results.map((r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason) }));
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const memberships = new Set(answers.map((a) => ("studentMembershipId" in a ? a.studentMembershipId : null)));
    expect(memberships.size).toBe(1);
    const pupils = await pupilsHere();
    expect(pupils).toHaveLength(1);
    expect(await db.enrollment.count({ where: { classId: ids.klass } })).toBe(1);
    expect(await db.guardianship.count({ where: { parentUserId: ids.family, studentSchoolId: ids.school } })).toBe(1);
    const row = await db.application.findUniqueOrThrow({ where: { id: app }, select: { status: true, admittedMembershipId: true } });
    expect(row).toEqual({ status: "ADMITTED", admittedMembershipId: pupils[0]!.id });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "admissions.admit", targetId: app } })).toBe(1);
    // A third press later is the same answer again.
    expect((await admit(office(), app, { classId: ids.klass })).studentMembershipId).toBe(pupils[0]!.id);
  });

  it("two applications racing for a grade's last seat: one pupil, one refusal", async () => {
    const before = (await pupilsHere()).length;
    const [a, b] = [await accepted("ZZ Race Six A", "6"), await accepted("ZZ Race Six B", "6")];
    const results = await Promise.allSettled([admit(office(), a, {}), admit(head(), b, {})]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const refused = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(refused).toHaveLength(1);
    expect(String(refused[0]!.reason)).toContain("admissions.refuseSeatsFull");
    expect((await pupilsHere()).length).toBe(before + 1);
    expect(await db.application.count({ where: { cycleId: ids.cycle, gradeApplied: "6", status: "ADMITTED" } })).toBe(1);
  });
});
