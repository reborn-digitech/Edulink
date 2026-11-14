/**
 * LIFECYCLE-2 (campaign of 4 October 2026): the eighteenth birthday turns at
 * midnight on the school's calendar, not at UTC midnight.
 *
 * accounts:tidy runs at 03:45 in Asia/Kolkata, which is 22:15 UTC the day
 * before; the old cutoff was built from the UTC date, so the flag flipped at
 * the next night's run and a guardian kept reading an adult college
 * student's results for about 28 hours. The four instants are the finding's:
 * the day before at 03:45 IST, the birthday at 03:45 and at 23:00 IST, and the
 * next day at 03:45 IST.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { adultCutoff, isMinorOn } from "@/lib/adulthood";
import { refreshMinority } from "@/lib/birthdate";
import { parentMaySee } from "@/lib/student-consent";
import { assertGuardianAccess } from "@/lib/tenancy";

const db = new PrismaClient();
const STAMP = Date.now();
const BORN = new Date("2009-01-15T00:00:00.000Z");
const INSTANTS = [
  { label: "day before, 03:45 IST", at: new Date("2027-01-13T22:15:00Z"), minor: true },
  { label: "birthday, 03:45 IST", at: new Date("2027-01-14T22:15:00Z"), minor: false },
  { label: "birthday, 23:00 IST", at: new Date("2027-01-15T17:30:00Z"), minor: false },
  { label: "next day, 03:45 IST", at: new Date("2027-01-15T22:15:00Z"), minor: false },
] as const;
const ids = { college: "", student: "", studentUser: "", parent: "" };

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ Adulthood ${STAMP}`, slug: `zz-adulthood-${STAMP}`, code: `ZAD${String(STAMP).slice(-6)}`, contactEmail: `zz-adulthood-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  const student = await db.user.create({ data: { name: "ZZ Adulthood Student", email: `zz-adulthood-student-${STAMP}@test.invalid`, birthdate: BORN, isMinor: true }, select: { id: true } });
  const parent = await db.user.create({ data: { name: "ZZ Adulthood Parent", email: `zz-adulthood-parent-${STAMP}@test.invalid` }, select: { id: true } });
  ids.studentUser = student.id;
  ids.parent = parent.id;
  ids.student = (await db.membership.create({ data: { userId: student.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.student, studentSchoolId: ids.college, relation: "PARENT", status: "ACTIVE" } });
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the cutoff is the local calendar day", () => {
  it("in Asia/Kolkata at the four instants", () => {
    for (const i of INSTANTS) expect([i.label, isMinorOn(BORN, i.at)]).toEqual([i.label, i.minor]);
    expect(adultCutoff(new Date("2027-01-14T22:15:00Z")).toISOString().slice(0, 10)).toBe("2009-01-15");
  });
  it("a 29 February birthday turns on 1 March in a common year", () => {
    const leap = new Date("2008-02-29T00:00:00.000Z");
    expect(isMinorOn(leap, new Date("2026-02-28T12:00:00Z"))).toBe(true);
    expect(isMinorOn(leap, new Date("2026-03-01T00:00:00Z"))).toBe(false);
  });
});

describe("refreshMinority at 03:45 IST", () => {
  it("flips the flag on the birthday's own run, not the next night's", async () => {
    const scope = { userIds: [ids.studentUser] };
    await refreshMinority(INSTANTS[0].at, scope);
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.studentUser } })).isMinor).toBe(true);
    await refreshMinority(INSTANTS[1].at, scope);
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.studentUser } })).isMinor).toBe(false);
    // Put the stale flag back: the guardian's read below must not depend on the job having run.
    await db.user.update({ where: { id: ids.studentUser }, data: { isMinor: true } });
  });
});

describe("the guardian's read decides adulthood from the birthdate", () => {
  it("sees results the day before and nothing from the birthday on, even with the stored flag still saying minor", async () => {
    // Asked for the guardian reading (a grant is one guardian's, TA-555); the instant is the fourth argument now.
    for (const i of INSTANTS) expect([i.label, await parentMaySee(ids.student, "RESULTS", ids.parent, i.at)]).toEqual([i.label, i.minor]);
  });
  it("the guardianship assertion refuses a door that names no grant once the student is eighteen today", async () => {
    // The assertion reads the real clock: an adult by the date today while the stored flag still says minor.
    await db.user.update({ where: { id: ids.studentUser }, data: { birthdate: new Date("2000-01-01T00:00:00.000Z"), isMinor: true } });
    await expect(assertGuardianAccess(ids.parent, ids.student)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
    await db.user.update({ where: { id: ids.studentUser }, data: { birthdate: BORN } });
  });
});
