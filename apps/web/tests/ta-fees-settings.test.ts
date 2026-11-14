/**
 * The fees batch of the testing analysis of 13 November 2026, TA-131: a change of the UPI id that families pay to
 * was audited without the id ("upi: true" before and after), and nobody else was told. At a ZZ school of this
 * suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { saveFeeSettings } from "@/lib/fees";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tafees-settings-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function ctx(userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.school!, ids.adminM!);

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TAF Settings ${STAMP}`, slug: `zz-taf-settings-${STAMP}`, code: `ZTS${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  for (const who of ["admin", "admin2", "head"]) ids[who] = (await db.user.create({ data: { name: `ZZ TAF Settings ${who}`, email: mail(who) }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.admin2!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: ids.head!, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" } });
}, 60_000);

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
}, 60_000);

describe("TA-131: the payee on record", { timeout: 60_000 }, () => {
  it("TA-131: replacing the UPI id is audited with the old and the new id, masked, and the head and the other admin are told", async () => {
    await saveFeeSettings(admin(), { upiId: "zzschoolfees@okaxis", upiPayee: "ZZ School Fees" });
    await saveFeeSettings(admin(), { upiId: "zzsomeoneelse@okicici", upiPayee: "Some One" });
    const rows = await db.auditLog.findMany({ where: { schoolId: ids.school, action: "fees.settings" }, orderBy: { createdAt: "asc" }, select: { meta: true } });
    expect(rows).toHaveLength(2);
    const second = JSON.parse(rows[1]!.meta) as Record<string, unknown>;
    expect(second).toMatchObject({ payeeChanged: true, upiFrom: "zz**********@okaxis", upiTo: "zz***********@okicici", payeeFrom: "Z***", payeeTo: "S***" });
    // Masked: the bank and the first two letters, never the whole id.
    expect(JSON.stringify(second)).not.toContain("zzsomeoneelse");
    for (const who of [ids.head!, ids.admin2!]) expect(await db.notification.count({ where: { userId: who, titleKey: "notifTitle.feeUpiChanged" } })).toBe(2);
    expect(await db.notification.count({ where: { userId: ids.admin, titleKey: "notifTitle.feeUpiChanged" } })).toBe(0);
    // The same id saved again is no change and tells nobody.
    await saveFeeSettings(admin(), { upiId: "zzsomeoneelse@okicici", upiPayee: "Some One", bankNote: "A/c 1" });
    const third = JSON.parse((await db.auditLog.findMany({ where: { schoolId: ids.school, action: "fees.settings" }, orderBy: { createdAt: "asc" }, select: { meta: true } }))[2]!.meta) as Record<string, unknown>;
    expect(third.payeeChanged).toBe(false);
    expect(await db.notification.count({ where: { userId: ids.head, titleKey: "notifTitle.feeUpiChanged" } })).toBe(2);
  });
});
