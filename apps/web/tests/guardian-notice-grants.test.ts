/**
 * The guardian notices the campaign named as still unguarded for an adult (5 Oct 2026; fixes-security.md "For the
 * other builders"): the library's, the hostel's and grading's notices to a college student's guardians now follow
 * the same grants as the family's pages — a class's "new work set" and a marked piece of work under RESULTS, the
 * hostel's under HOSTEL_TRANSPORT, and the library's not at all for an adult (its family page names no grant, so
 * it is refused to an adult's guardians). A minor's guardians, and every guardian at a school, are told as before.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { notifyGuardians, notifyGuardiansOfClass } from "@/lib/notify";
import { guardiansToTell, studentsGuardianMaySee } from "@/lib/student-consent";
import { grantToGuardians } from "./consent-grants";
import { remindDueTomorrow } from "@/lib/library";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", adult: "", minor: "", adultParent: "", minorParent: "", users: [] as string[] };

async function person(name: string, birthdate: Date | null, isMinor: boolean): Promise<string> {
  const u = await db.user.create({ data: { name, email: `zz-grants-${name.toLowerCase().replace(/\W/g, "")}-${STAMP}@test.invalid`, birthdate, isMinor }, select: { id: true } });
  ids.users.push(u.id);
  return u.id;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Grants College ${STAMP}`, slug: `zz-grants-${STAMP}`, code: `ZGR${String(STAMP).slice(-6)}`, contactEmail: `zz-grants-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  const now = new Date();
  const adultUser = await person("Adult Student", new Date(Date.UTC(now.getUTCFullYear() - 20, 0, 15)), false);
  const minorUser = await person("Minor Student", new Date(Date.UTC(now.getUTCFullYear() - 17, 0, 15)), true);
  ids.adultParent = await person("Adult Parent", null, false);
  ids.minorParent = await person("Minor Parent", null, false);
  ids.adult = (await db.membership.create({ data: { userId: adultUser, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  ids.minor = (await db.membership.create({ data: { userId: minorUser, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await db.guardianship.createMany({
    data: [
      { parentUserId: ids.adultParent, studentMembershipId: ids.adult, studentSchoolId: ids.school, status: "ACTIVE", relation: "PARENT" },
      { parentUserId: ids.minorParent, studentMembershipId: ids.minor, studentSchoolId: ids.school, status: "ACTIVE", relation: "PARENT" },
    ],
  });
  // The adult lets their guardian see the hostel and bus, and nothing else.
  // (TA-555: a grant is one guardian's, so the row names the guardian's link.)
  await grantToGuardians(db, ids.school, ids.adult, "HOSTEL_TRANSPORT");
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId: { in: ids.users } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

const toldParents = async (title: string) =>
  (await db.notification.findMany({ where: { userId: { in: [ids.adultParent, ids.minorParent] }, body: title }, select: { userId: true } })).map((n) => n.userId).sort();

describe("which students' guardians may hear of a grant", () => {
  it("a minor's always, an adult's only under the grant they gave", async () => {
    // Per guardian since TA-555: who is told about each student, and what one guardian may read of a list.
    const told = async (grant: "RESULTS" | "HOSTEL_TRANSPORT") => [...(await guardiansToTell([ids.adult, ids.minor], grant))].filter(([, guardians]) => guardians.length > 0).map(([id]) => id).sort();
    expect(await told("RESULTS")).toEqual([ids.minor]);
    expect(await told("HOSTEL_TRANSPORT")).toEqual([ids.adult, ids.minor].sort());
    expect((await guardiansToTell([ids.adult], "HOSTEL_TRANSPORT")).get(ids.adult)).toEqual([ids.adultParent]);
    expect(await studentsGuardianMaySee([ids.adult, ids.minor], "HOSTEL_TRANSPORT", ids.adultParent)).toEqual([ids.adult, ids.minor]);
    expect(await studentsGuardianMaySee([ids.adult, ids.minor], "RESULTS", ids.adultParent)).toEqual([ids.minor]);
    // The other student's guardian holds no grant of the adult's.
    expect(await studentsGuardianMaySee([ids.adult], "HOSTEL_TRANSPORT", ids.minorParent)).toEqual([]);
    expect(await studentsGuardianMaySee([], "RESULTS", ids.adultParent)).toEqual([]);
    expect((await guardiansToTell([], "RESULTS")).size).toBe(0);
  });
});

describe("a class's notice under a grant", () => {
  it("tells the minor's guardian and not the adult's who granted nothing for results", async () => {
    const told = await notifyGuardiansOfClass([ids.adult, ids.minor], () => ({ kind: "ASSIGNMENT", schoolId: ids.school, titleKey: "notifTitle.newWorkSet", body: `zz-work-${STAMP}` }), "RESULTS");
    expect(told).toBe(1);
    expect(await toldParents(`zz-work-${STAMP}`)).toEqual([ids.minorParent]);
  });

  // Naming no grant is default-deny since TA-262 (13 Nov 2026), as assertGuardianAccess is: the minor's guardian alone.
  it("without a grant the minor's guardian is told and the adult's is not", async () => {
    expect(await notifyGuardiansOfClass([ids.adult, ids.minor], () => ({ kind: "ASSIGNMENT", schoolId: ids.school, titleKey: "notifTitle.newWorkSet", body: `zz-all-${STAMP}` }))).toBe(1);
    expect(await toldParents(`zz-all-${STAMP}`)).toEqual([ids.minorParent]);
  });

  it("a hostel notice reaches the adult's guardian under the grant they gave", async () => {
    await notifyGuardians(ids.adult, (name) => ({ kind: "SYSTEM", schoolId: ids.school, titleKey: "hostel.notifAbsentTitle", titleVars: { name }, body: `zz-hostel-${STAMP}` }), "HOSTEL_TRANSPORT");
    await notifyGuardians(ids.adult, (name) => ({ kind: "GRADE", schoolId: ids.school, titleKey: "notifTitle.childWorkMarked", titleVars: { name }, body: `zz-marked-${STAMP}` }), "RESULTS");
    expect(await toldParents(`zz-hostel-${STAMP}`)).toEqual([ids.adultParent]);
    expect(await toldParents(`zz-marked-${STAMP}`)).toEqual([]);
  });
});

describe("the library's due-tomorrow notice", () => {
  it("tells both borrowers and the minor's guardian, never an adult's guardian", async () => {
    await db.schoolModule.create({ data: { schoolId: ids.school, module: "LIBRARY" } });
    const title = await db.libraryTitle.create({ data: { schoolId: ids.school, title: `ZZ Grants Book ${STAMP}` }, select: { id: true } });
    const tomorrow = addDaysToKey(todayKey("Asia/Kolkata"), 1);
    for (const [i, membershipId] of [ids.adult, ids.minor].entries()) {
      const copy = await db.libraryCopy.create({ data: { schoolId: ids.school, titleId: title.id, accession: `ZZG-${STAMP}-${i}` }, select: { id: true } });
      const member = await db.libraryMember.create({ data: { schoolId: ids.school, membershipId, kind: "PUPIL", cardNumber: `ZZG${i}` }, select: { id: true } });
      await db.libraryIssue.create({ data: { schoolId: ids.school, copyId: copy.id, memberId: member.id, dueOn: tomorrow, issuedByUserId: ids.adultParent } });
    }
    const r = await remindDueTomorrow(new Date(), { schoolId: ids.school });
    expect(r.sent).toBe(2);
    const guardians = await db.notification.findMany({ where: { userId: { in: [ids.adultParent, ids.minorParent] }, schoolId: ids.school, title: { contains: "due" } }, select: { userId: true } });
    expect(guardians.map((g) => g.userId)).toEqual([ids.minorParent]);
  });
});
