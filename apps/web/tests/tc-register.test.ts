/**
 * LIFECYCLE-6 and LIFECYCLE-7 (campaign of 4 October 2026): one TC register.
 *
 * The leaving record (school-record.ts) and a certificate issued from a TC
 * template (certificates.ts) once numbered from two counters, so
 * TC/2027–28/0001 was printed on two different pupils' papers; and undoing
 * a departure or readmitting the pupil deleted the record, so its number was
 * free to be handed out again. Now the two papers draw from one series under
 * one lock, a departure's two papers share its number, and a record is closed
 * rather than deleted.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { issueCertificate } from "@/lib/certificates";
import { recordDeparture, undoDeparture } from "@/lib/school-record";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const YEAR = "2026–27";
const ids = { school: "", admin: "", adminUser: "", template: "", a: "", b: "", c: "" };

function ctx(): ActiveContext {
  return { sessionId: "t", membershipId: ids.admin, schoolId: ids.school, role: "ADMIN", user: { id: ids.adminUser, name: "ZZ TC Admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } } };
}

const recordOf = (membershipId: string) => db.schoolRecord.findUniqueOrThrow({ where: { studentMembershipId: membershipId }, select: { id: true, serial: true } });
const issueTc = (membershipId: string) => issueCertificate(ctx(), { templateId: ids.template, studentMembershipId: membershipId } as never);
const leave = (membershipId: string) => recordDeparture(ctx(), membershipId, { reason: "TRANSFERRED", leftOn: new Date() });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TC Register ${STAMP}`, slug: `zz-tc-register-${STAMP}`, code: `ZTC${String(STAMP).slice(-6)}`, contactEmail: `zz-tc-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId: ids.school, name: YEAR, startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: true } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ TC ${who}`, email: `zz-tc-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const adminUser = await user("Admin");
  ids.adminUser = adminUser.id;
  ids.admin = (await db.membership.create({ data: { userId: adminUser.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  for (const k of ["a", "b", "c"] as const) {
    const u = await user(`Pupil${k}`);
    ids[k] = (await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", joinedAt: new Date("2026-06-01T00:00:00Z") }, select: { id: true } })).id;
  }
  ids.template = (await db.certificateTemplate.create({ data: { schoolId: ids.school, kind: "TC", name: "ZZ Transfer Certificate", title: "Transfer Certificate", intro: "[[pupil.name]] left this school.", serialPrefix: "TC" }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("one TC register", () => {
  it("a certificate and a leaving record of two pupils never share a serial", async () => {
    // A's TC certificate first (the leaving is not recorded yet), then B leaves.
    const certA = await issueTc(ids.a);
    expect(certA.serial).toBe(`TC/${YEAR}/0001`);
    expect((await leave(ids.b)).ok).toBe(true);
    // The old counter per table gave B TC/2026–27/0001 as well.
    expect((await recordOf(ids.b)).serial).toBe(`TC/${YEAR}/0002`);
  });

  it("a departure's two papers carry one number: the record takes the certificate's, the certificate the record's", async () => {
    expect((await leave(ids.a)).ok).toBe(true);
    expect((await recordOf(ids.a)).serial).toBe(`TC/${YEAR}/0001`);
    const certB = await issueTc(ids.b);
    expect(certB.serial).toBe(`TC/${YEAR}/0002`);
    // A second TC for B: the record's number is already on a certificate, so this paper takes the next.
    expect((await issueTc(ids.b)).serial).toBe(`TC/${YEAR}/0003`);
  });

  it("undoing a departure closes the record and keeps its number; leaving again takes a new one (LIFECYCLE-7)", async () => {
    expect((await leave(ids.c)).ok).toBe(true);
    const first = await recordOf(ids.c);
    expect(first.serial).toBe(`TC/${YEAR}/0004`);
    expect((await undoDeparture(ctx(), ids.c)).ok).toBe(true);
    const closed = await db.schoolRecord.findUniqueOrThrow({ where: { id: first.id } });
    expect(closed).toMatchObject({ serial: `TC/${YEAR}/0004`, studentMembershipId: null, formerMembershipId: ids.c, supersededReason: "UNDONE" });
    expect(closed.supersededAt).not.toBeNull();
    // Back on the roll: no live record, so no certificate prints the old leaving day.
    expect(await db.schoolRecord.count({ where: { studentMembershipId: ids.c } })).toBe(0);
    expect((await leave(ids.c)).ok).toBe(true);
    // The old code deleted the row and max+1 handed 0004 out a second time.
    expect((await recordOf(ids.c)).serial).toBe(`TC/${YEAR}/0005`);
    const serials = (await db.schoolRecord.findMany({ where: { schoolId: ids.school }, select: { serial: true } })).map((r) => r.serial).sort();
    expect(serials).toEqual([`TC/${YEAR}/0001`, `TC/${YEAR}/0002`, `TC/${YEAR}/0004`, `TC/${YEAR}/0005`]);
  });
});
