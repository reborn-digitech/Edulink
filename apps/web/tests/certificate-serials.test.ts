/**
 * A CERTIFICATE'S SERIAL (QA campaign of 24 October 2026, unit layer; src/lib/certificates.ts `issueCertificate`).
 *
 * The TC register (tests/tc-register.test.ts) and the appointment letters (two at once take two numbers) are held;
 * a pupil's ordinary certificate — a bonafide, a character certificate — had no test of its numbering under load.
 * A serial is printed on a paper the family hands to a bank or another school and checked by the public, so it
 * must never repeat and should not skip. Held here: a burst of issues at once takes consecutive numbers with none
 * repeated; each prefix is its own series, and two templates sharing a prefix share one; a revoked paper keeps its
 * number; a new academic year starts again at 0001 under its own name; the office alone issues.
 *
 * As the owner (tests/setup.ts). One ZZ school of this file's own, removed after with everything under it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { issueCertificate, revokeCertificate } from "@/lib/certificates";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids: Record<string, string> = {};
const pupils: string[] = [];

const ctx = (userKey: string, role: string): ActiveContext =>
  ({ sessionId: "test", membershipId: ids[`${userKey}Membership`]!, schoolId: ids.school!, role, user: { id: ids[userKey]!, name: userKey, preferredName: null, email: `zz-serial-${userKey}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as unknown as ActiveContext;
const admin = () => ctx("admin", "ADMIN");
const principal = () => ctx("principal", "PRINCIPAL");
const teacher = () => ctx("teacher", "TEACHER");
const numberOf = (serial: string) => Number(serial.slice(serial.lastIndexOf("/") + 1));

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Serial School ${STAMP}`, slug: `zz-serial-${STAMP}`, code: `ZR${SUFFIX}`, contactEmail: `zz-serial-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  for (const [key, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["teacher", "TEACHER"]] as const) {
    ids[key] = (await db.user.create({ data: { name: `ZZ Serial ${key}`, email: `zz-serial-${key}-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
    ids[`${key}Membership`] = (await db.membership.create({ data: { userId: ids[key]!, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  for (let i = 0; i < 10; i++) {
    const u = await db.user.create({ data: { name: `ZZ Serial Pupil ${i}`, email: `zz-serial-pupil${i}-${STAMP}@test.invalid`, isTestFixture: true, birthdate: new Date("2014-01-01T00:00:00Z") }, select: { id: true } });
    pupils.push((await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZRS${i}${STAMP}` }, select: { id: true } })).id);
  }
  ids.year1 = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const template = (name: string, kind: string, prefix: string) => db.certificateTemplate.create({ data: { schoolId: ids.school!, kind, name, title: name, intro: "[[pupil.name]] is a pupil of this school.", serialPrefix: prefix }, select: { id: true } });
  ids.bonafide = (await template("ZZ Bonafide", "BONAFIDE", "BC")).id;
  // A second template on the same prefix: one series between them.
  ids.bonafideHindi = (await template("ZZ Bonafide Hindi", "BONAFIDE", "BC")).id;
  ids.character = (await template("ZZ Character", "CHARACTER", "CC")).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a certificate's serial", () => {
  it("⚠ eight issued at once take eight consecutive numbers, none repeated", async () => {
    const issued = await Promise.all(pupils.slice(0, 8).map((p, i) => issueCertificate(i % 2 ? principal() : admin(), { templateId: ids.bonafide!, studentMembershipId: p, purpose: "ZZ bank account" })));
    const serials = issued.map((c) => c.serial);
    expect(new Set(serials).size).toBe(8);
    expect(serials.every((s) => s.startsWith("BC/2026–27/"))).toBe(true);
    expect(serials.map(numberOf).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(serials).toContain("BC/2026–27/0001");
  });

  it("a second template on the same prefix continues the series; another prefix starts its own at 0001", async () => {
    const hindi = await issueCertificate(admin(), { templateId: ids.bonafideHindi!, studentMembershipId: pupils[8]! });
    expect(hindi.serial).toBe("BC/2026–27/0009");
    const character = await issueCertificate(admin(), { templateId: ids.character!, studentMembershipId: pupils[8]! });
    expect(character.serial).toBe("CC/2026–27/0001");
  });

  it("a revoked paper keeps its number: the next one does not take it again", async () => {
    const paper = await issueCertificate(admin(), { templateId: ids.character!, studentMembershipId: pupils[9]! });
    expect(paper.serial).toBe("CC/2026–27/0002");
    await revokeCertificate(admin(), paper.id, "ZZ issued in error");
    expect((await issueCertificate(admin(), { templateId: ids.character!, studentMembershipId: pupils[9]! })).serial).toBe("CC/2026–27/0003");
  });

  it("a new academic year starts each series again at 0001, under the year's own name", async () => {
    await db.academicYear.update({ where: { id: ids.year1 }, data: { isCurrent: false } });
    ids.year2 = (await db.academicYear.create({ data: { schoolId: ids.school!, name: "2027–28", startDate: new Date("2027-06-01T00:00:00Z"), endDate: new Date("2028-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
    const next = await issueCertificate(admin(), { templateId: ids.bonafide!, studentMembershipId: pupils[0]! });
    expect(next.serial).toBe("BC/2027–28/0001");
    // Every serial at the school is distinct, across years and prefixes.
    const all = await db.issuedCertificate.findMany({ where: { schoolId: ids.school }, select: { serial: true } });
    expect(new Set(all.map((c) => c.serial)).size).toBe(all.length);
  });

  it("only the office and the head issue; a teacher is refused and no number is taken", async () => {
    const before = await db.issuedCertificate.count({ where: { schoolId: ids.school } });
    await expect(issueCertificate(teacher(), { templateId: ids.bonafide!, studentMembershipId: pupils[1]! })).rejects.toMatchObject({ key: "access.notAllowed" });
    expect(await db.issuedCertificate.count({ where: { schoolId: ids.school } })).toBe(before);
    expect((await issueCertificate(admin(), { templateId: ids.bonafide!, studentMembershipId: pupils[1]! })).serial).toBe("BC/2027–28/0002");
  });
});
