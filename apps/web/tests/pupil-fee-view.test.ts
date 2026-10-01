/**
 * A pupil's own read of their fees: nothing until the office sets an age;
 * nothing below that age or without a date of birth; at or past it, the
 * dues, what is paid and the next due date — and never a way to pay (the
 * view carries no payment options and no payment history, by shape).
 *
 * Scoped to its own ZZ school, deleted in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { todayKey, addDaysToKey } from "@/lib/dates";
import { assignPlans, createStructure, feeSettings, publishStructure, saveFeeSettings, saveHead } from "@/lib/fees";
import { recordCounterPayment } from "@/lib/fees-payments";
import { pupilFees, pupilMaySeeFees } from "@/lib/fees-family";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);

let schoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let pupilUserId = "";
let pupilId = "";
let youngUserId = "";
let youngId = "";
let structureId = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ Pupil View Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });
const pupil = () => ctx({ userId: pupilUserId, membershipId: pupilId, schoolId, role: "STUDENT" });
const young = () => ctx({ userId: youngUserId, membershipId: youngId, schoolId, role: "STUDENT" });

const yearsAgo = (years: number) => new Date(Date.UTC(new Date().getUTCFullYear() - years, 0, 15));

beforeAll(async () => {
  const school = await db.school.create({ data: { name: `ZZ PupilView School ${STAMP}`, slug: `zz-pupilview-${STAMP}`, code: `ZPV${String(STAMP).slice(-5)}`, contactEmail: `zz-pupilview-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  schoolId = school.id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const mk = (who: string, birthdate: Date | null) => db.user.create({ data: { name: `ZZ PupilView ${who}`, email: `zz-pupilview-${who.toLowerCase()}-${STAMP}@test.invalid`, birthdate }, select: { id: true } });
  const [a, p, y] = await Promise.all([mk("Admin", null), mk("Pupil", yearsAgo(16)), mk("Young", yearsAgo(9))]);
  adminUserId = a.id;
  pupilUserId = p.id;
  youngUserId = y.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  pupilId = (await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZPV${STAMP}`, gradeLevel: "10" }, select: { id: true } })).id;
  youngId = (await db.membership.create({ data: { userId: youngUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZPY${STAMP}`, gradeLevel: "4" }, select: { id: true } })).id;
  const tuition = await saveHead(admin(), { name: "Tuition", code: "TUI", kind: "TUITION" });
  structureId = await createStructure(admin(), {
    name: "Every grade",
    gradeLevel: null,
    instalments: [
      { label: "Term 1", dueDateKey: addDaysToKey(TODAY, -10), lines: [{ headId: tuition, amountPaise: 1_000_00 }] },
      { label: "Term 2", dueDateKey: addDaysToKey(TODAY, 30), lines: [{ headId: tuition, amountPaise: 1_000_00 }] },
    ],
  });
  await publishStructure(admin(), structureId);
  await assignPlans(admin(), { structureId, studentMembershipIds: [pupilId, youngId] });
  await recordCounterPayment(admin(), { studentMembershipId: pupilId, amountPaise: 1_000_00, method: "CASH", clientId: `zz-pupilview-${STAMP}` });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the gate", () => {
  it("is decided by the school's age and the pupil's date of birth", () => {
    const now = new Date("2026-10-01T00:00:00Z");
    expect(pupilMaySeeFees(null, new Date("2010-01-01T00:00:00Z"), now)).toEqual({ allowed: false, reason: "OFF" });
    expect(pupilMaySeeFees(14, null, now)).toEqual({ allowed: false, reason: "NO_BIRTHDATE" });
    expect(pupilMaySeeFees(14, new Date("2013-06-01T00:00:00Z"), now)).toEqual({ allowed: false, reason: "UNDER_AGE" });
    expect(pupilMaySeeFees(14, new Date("2012-10-01T00:00:00Z"), now)).toEqual({ allowed: true, reason: null });
    expect(pupilMaySeeFees(14, new Date("2010-01-01T00:00:00Z"), now)).toEqual({ allowed: true, reason: null });
  });

  it("the office sets the age in the fee settings, within 5–25, and may clear it; the other settings are untouched", async () => {
    await saveFeeSettings(admin(), { upiId: "zzschool@upi", upiPayee: "ZZ School", receiptPrefix: "ZZ" });
    await expect(saveFeeSettings(admin(), { pupilFeeViewAge: 3 })).rejects.toThrow("fees.refusePupilViewAge");
    await expect(saveFeeSettings(admin(), { pupilFeeViewAge: 12.5 })).rejects.toThrow("fees.refusePupilViewAge");
    await saveFeeSettings(admin(), { upiId: "zzschool@upi", upiPayee: "ZZ School", receiptPrefix: "ZZ", pupilFeeViewAge: 14 });
    let s = await feeSettings(schoolId);
    expect([s.pupilFeeViewAge, s.upiId, s.receiptPrefix]).toEqual([14, "zzschool@upi", "ZZ"]);
    await saveFeeSettings(admin(), { upiId: "zzschool@upi", upiPayee: "ZZ School", receiptPrefix: "ZZ" });
    s = await feeSettings(schoolId);
    expect(s.pupilFeeViewAge).toBe(14);
    await expect(saveFeeSettings(pupil(), { pupilFeeViewAge: 14 })).rejects.toThrow("fees.refuseOffice");
  });
});

describe("the pupil's view", () => {
  it("shows nothing while the school has set no age", async () => {
    await saveFeeSettings(admin(), { upiId: "zzschool@upi", upiPayee: "ZZ School", receiptPrefix: "ZZ", pupilFeeViewAge: null });
    const view = await pupilFees(pupil());
    expect([view.allowed, view.reason, view.fromAge, view.demands.length]).toEqual([false, "OFF", null, 0]);
  });

  it("at or past the age: dues, paid and the next due date, with no way to pay; under it: nothing", async () => {
    await saveFeeSettings(admin(), { upiId: "zzschool@upi", upiPayee: "ZZ School", receiptPrefix: "ZZ", pupilFeeViewAge: 14 });
    const view = await pupilFees(pupil());
    expect(view.allowed).toBe(true);
    expect(view.schoolName).toContain("ZZ PupilView School");
    expect(view.demands.map((d) => [d.label, d.status, d.paidPaise, d.outstandingPaise])).toEqual([
      ["Term 1", "PAID", 1_000_00, 0],
      ["Term 2", "OPEN", 0, 1_000_00],
    ]);
    expect(view.totals).toEqual({ outstandingPaise: 1_000_00, overduePaise: 0, paidPaise: 1_000_00 });
    expect(view.nextDue).toEqual({ label: "Term 2", dueDateKey: addDaysToKey(TODAY, 30), amountPaise: 1_000_00 });
    // By shape: nothing a page could turn into a payment.
    expect(Object.keys(view).sort()).toEqual(["allowed", "demands", "fromAge", "nextDue", "reason", "schoolName", "todayKey", "totals", "year"]);
    const under = await pupilFees(young());
    expect([under.allowed, under.reason, under.fromAge, under.demands.length, under.nextDue]).toEqual([false, "UNDER_AGE", 14, 0, null]);
  });

  it("a pupil with no date of birth is told to ask the office; a guardian or the office cannot use the pupil's door", async () => {
    await db.user.update({ where: { id: youngUserId }, data: { birthdate: null } });
    const view = await pupilFees(young());
    expect([view.allowed, view.reason]).toEqual([false, "NO_BIRTHDATE"]);
    await expect(pupilFees(admin())).rejects.toThrow("fees.refusePupil");
    await expect(pupilFees(ctx({ userId: pupilUserId, role: "PARENT" }))).rejects.toThrow("fees.refusePupil");
  });
});
