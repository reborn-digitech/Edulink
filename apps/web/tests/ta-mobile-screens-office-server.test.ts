/**
 * The server halves of the phone office screens' findings (testing analysis of 13 November 2026, batch
 * mobile-screens-office): TA-156, TA-158, TA-160, TA-161, TA-353, TA-354, TA-500 and TA-520.
 *
 * One stamped ZZ school of this suite's own (open every day, TRANSPORT and HOSTEL on), with an admin, a head, a
 * teacher, a driver and an attendant, two pupils on a fee structure and on a bus route, and three classes of two
 * grades; the school and its people are deleted in afterAll and nothing outside them is read or written.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { assignPlans, createStructure, publishStructure, saveFeeSettings, saveHead } from "@/lib/fees";
import { recordCounterPayment } from "@/lib/fees-payments";
import { copyWeekToSections, createPeriod, setSlot } from "@/lib/timetable";
import { allotPupils, consentToLocation, createAssignment, driverToday, endTrip, recordPositions, saveBus, saveRoute, startTrip } from "@/lib/transport";
import { adminLeave, adminSafety } from "@/lib/api-reads/admin";
import { listLeave } from "@/lib/hostel";
import { nightRegister } from "@/lib/hostel-night";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids = { school: "", admin: "", adminM: "", head: "", headM: "", teacher: "", teacherM: "", driver: "", driverM: "", attendant: "", attendantM: "", pupilA: "", pupilB: "", class5A: "", class5B: "", class6A: "", period: "" };
const STOPS = [
  { name: "ZZ MSO Corner", lat: 18.5, lng: 73.8, morningMinute: 0, eveningMinute: 960, radiusM: 150 },
  { name: "ZZ MSO Gate", lat: 18.52, lng: 73.82, morningMinute: 10, eveningMinute: 940, radiusM: 150 },
];

function ctx(userId: string, membershipId: string, role: string): ActiveContext & { schoolId: string; membershipId: string } {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId: ids.school,
    role: role as never,
    user: { id: userId, name: "ZZ MSO", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const admin = () => ctx(ids.admin, ids.adminM, "ADMIN");
const head = () => ctx(ids.head, ids.headM, "PRINCIPAL");
const driver = () => ctx(ids.driver, ids.driverM, "DRIVER");
const attendant = () => ctx(ids.attendant, ids.attendantM, "DRIVER");

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ MSO School ${STAMP}`, slug: `zz-mso-${STAMP}`, code: `ZMS${String(STAMP).slice(-5)}`, contactEmail: `zz-mso-${STAMP}@test.invalid`, timezone: TZ, teachingDays: "0,1,2,3,4,5,6" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "TRANSPORT" }, { schoolId: ids.school, module: "HOSTEL" }] });
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ MSO ${who}`, email: `zz-mso-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, h, t, d, at, pa, pb] = await Promise.all(["Admin", "Head", "Teacher", "Driver", "Attendant", "PupilA", "PupilB"].map(mk));
  ids.admin = a!.id;
  ids.head = h!.id;
  ids.teacher = t!.id;
  ids.driver = d!.id;
  ids.attendant = at!.id;
  const member = async (userId: string, role: string, extra: Record<string, unknown> = {}) => (await db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  ids.adminM = await member(ids.admin, "ADMIN");
  ids.headM = await member(ids.head, "PRINCIPAL");
  ids.teacherM = await member(ids.teacher, "TEACHER");
  ids.driverM = await member(ids.driver, "DRIVER");
  ids.attendantM = await member(ids.attendant, "DRIVER");
  ids.pupilA = await member(pa!.id, "STUDENT", { studentCode: `ZMSA${STAMP}`, gradeLevel: "5" });
  ids.pupilB = await member(pb!.id, "STUDENT", { studentCode: `ZMSB${STAMP}`, gradeLevel: "5" });
  const suffix = String(STAMP).slice(-6);
  ids.class5A = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ MSO 5 A", section: "A", gradeLevel: "5", joinCode: `ZQ${suffix}` }, select: { id: true } })).id;
  ids.class5B = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ MSO 5 B", section: "B", gradeLevel: "5", joinCode: `ZR${suffix}` }, select: { id: true } })).id;
  ids.class6A = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ MSO 6 A", section: "A", gradeLevel: "6", joinCode: `ZS${suffix}` }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the fee settings", () => {
  it("TA-156: saving the pupil fee-view age alone leaves the UPI id, payee, receipt prefix and bank note as they are", async () => {
    await saveFeeSettings(admin(), { upiId: "zzmso@upi", upiPayee: "ZZ MSO School", receiptPrefix: "ZZM", bankNote: "ZZ bank note" });
    await saveFeeSettings(admin(), { pupilFeeViewAge: 12 });
    const row = await db.school.findUniqueOrThrow({ where: { id: ids.school }, select: { feeUpiId: true, feeUpiPayee: true, feeReceiptPrefix: true, feeBankNote: true, pupilFeeViewAge: true } });
    expect(row).toEqual({ feeUpiId: "zzmso@upi", feeUpiPayee: "ZZ MSO School", feeReceiptPrefix: "ZZM", feeBankNote: "ZZ bank note", pupilFeeViewAge: 12 });
    // A field named as empty still clears it.
    await saveFeeSettings(admin(), { bankNote: null });
    expect((await db.school.findUniqueOrThrow({ where: { id: ids.school }, select: { feeBankNote: true, feeUpiId: true } }))).toEqual({ feeBankNote: null, feeUpiId: "zzmso@upi" });
  });
});

describe("the counter's client id", () => {
  it("TA-353: another pupil or another amount under a client id already used is refused, and the same payment again answers its receipt", async () => {
    const tuition = await saveHead(admin(), { name: "ZZ Tuition", code: "ZTU", kind: "TUITION" });
    const structureId = await createStructure(admin(), { name: "ZZ MSO fees", gradeLevel: null, instalments: [{ label: "Term 1", dueDateKey: addDaysToKey(TODAY, 10), lines: [{ headId: tuition, amountPaise: 10_000_00 }] }] });
    await publishStructure(admin(), structureId);
    await assignPlans(admin(), { structureId, studentMembershipIds: [ids.pupilA, ids.pupilB] });
    const clientId = `zz-mso-${STAMP}`;
    const first = await recordCounterPayment(admin(), { studentMembershipId: ids.pupilA, amountPaise: 5_000_00, method: "CASH", clientId });
    expect(first.already).toBe(false);
    await expect(recordCounterPayment(admin(), { studentMembershipId: ids.pupilB, amountPaise: 3_000_00, method: "CASH", clientId })).rejects.toThrow("fees.refuseClientIdReused");
    await expect(recordCounterPayment(admin(), { studentMembershipId: ids.pupilA, amountPaise: 3_000_00, method: "CASH", clientId })).rejects.toThrow("fees.refuseClientIdReused");
    expect(await db.feePayment.count({ where: { schoolId: ids.school, studentMembershipId: ids.pupilB } })).toBe(0);
    await expect(recordCounterPayment(admin(), { studentMembershipId: ids.pupilA, amountPaise: 5_000_00, method: "CASH", clientId })).resolves.toMatchObject({ paymentId: first.paymentId, receiptId: first.receiptId, already: true });
  });
});

describe("copy a week to sister sections", () => {
  it("TA-158: a class of another grade is refused and its week stands", async () => {
    const period = await createPeriod(admin(), { name: "Period 1", startMinute: 540, endMinute: 580, kind: "LESSON" });
    if (!period.ok || !period.id) throw new Error(period.errorKey);
    ids.period = period.id;
    expect((await setSlot(admin(), { classId: ids.class6A, periodId: ids.period, weekday: 1, subject: "ZZ Geography", teacherMembershipId: null })).ok).toBe(true);
    expect((await setSlot(admin(), { classId: ids.class5B, periodId: ids.period, weekday: 1, subject: "ZZ Maths", teacherMembershipId: ids.teacherM, room: "12" })).ok).toBe(true);
    const result = await copyWeekToSections(admin(), ids.class6A, [ids.class5B]);
    expect(result).toMatchObject({ ok: false, errorKey: "officeBulk.copyRefuseOtherGrade" });
    const kept = await db.timetableSlot.findMany({ where: { schoolId: ids.school, classId: ids.class5B }, select: { subject: true, teacherMembershipId: true, room: true } });
    expect(kept).toEqual([{ subject: "ZZ Maths", teacherMembershipId: ids.teacherM, room: "12" }]);
    // A sister of the same grade is copied as before.
    expect((await setSlot(admin(), { classId: ids.class5A, periodId: ids.period, weekday: 2, subject: "ZZ English", teacherMembershipId: null })).ok).toBe(true);
    await expect(copyWeekToSections(admin(), ids.class5A, [ids.class5B])).resolves.toMatchObject({ ok: true, copied: 1 });
  });
});

describe("the bus's positions", () => {
  let tripId = "";

  it("TA-160: only the starter's phone is the bus's GPS, and a member who has not said yes to the location sentence sends nothing", async () => {
    const route = await saveRoute(admin(), null, { name: "ZZ MSO Route", direction: "BOTH", active: true, note: "", stops: STOPS });
    const stops = await db.transportStop.findMany({ where: { routeId: route.id }, orderBy: { order: "asc" }, select: { id: true } });
    const bus = await saveBus(admin(), null, { registration: `MH 12 ZM ${String(STAMP).slice(-4)}`, capacity: 30, note: "", active: true });
    await createAssignment(admin(), { busId: bus.id, routeId: route.id, driverMembershipId: ids.driverM, attendantMembershipId: ids.attendantM, fromDateKey: "2026-01-01" });
    await allotPupils(admin(), { studentMembershipIds: [ids.pupilA], routeId: route.id, stopId: stops[1]!.id, boards: true, alights: true, feeHeadId: null, fromDateKey: "2026-01-01" });
    tripId = (await driverToday(driver())).trips.find((t) => t.direction === "MORNING")!.id;
    await consentToLocation(driver());
    await expect(startTrip(driver(), tripId, { lat: STOPS[0]!.lat, lng: STOPS[0]!.lng, accuracy: 10 })).resolves.toEqual({ status: "LIVE" });
    expect((await driverToday(driver())).trips.find((t) => t.id === tripId)!.startedByMe).toBe(true);
    const seen = await driverToday(attendant());
    expect(seen.consent.needed).toBe(true);
    expect(seen.trips.find((t) => t.id === tripId)!.startedByMe).toBe(false);
    const before = await db.tripPosition.count({ where: { tripId } });
    await expect(recordPositions(attendant(), tripId, { positions: [{ at: new Date().toISOString(), lat: 19.1, lng: 72.9 }] })).rejects.toThrow("transport.refuseConsent");
    expect(await db.tripPosition.count({ where: { tripId } })).toBe(before);
  });

  it("TA-520: positions taken before End and arriving after it are stored; one after End is still refused", async () => {
    const taken = new Date(Date.now() - 5_000).toISOString();
    const { endedAt } = await endTrip(driver(), tripId);
    await expect(recordPositions(driver(), tripId, { positions: [{ at: taken, lat: STOPS[1]!.lat, lng: STOPS[1]!.lng }] })).resolves.toEqual({ accepted: 1, duplicates: 0, rejected: 0 });
    expect(await db.tripPosition.count({ where: { tripId, at: new Date(taken) } })).toBe(1);
    const after = new Date(new Date(endedAt).getTime() + 60_000).toISOString();
    await expect(recordPositions(driver(), tripId, { positions: [{ at: after, lat: 18.5, lng: 73.8 }] })).rejects.toThrow("transport.refuseEnded");
    expect(await db.tripPosition.count({ where: { tripId, at: new Date(after) } })).toBe(0);
  });
});

describe("the head's leave desk", () => {
  it("TA-161: each pending request carries the days it draws from the entitlement: school days for sick leave, none for unpaid", async () => {
    await db.school.update({ where: { id: ids.school }, data: { teachingDays: "1,2,3,4,5,6" } });
    try {
      await db.leaveRequest.createMany({
        data: [
          { schoolId: ids.school, teacherMembershipId: ids.teacherM, fromDateKey: "2026-11-14", toDateKey: "2026-11-16", kind: "SICK", reason: "ZZ fever", status: "PENDING" },
          { schoolId: ids.school, teacherMembershipId: ids.teacherM, fromDateKey: "2026-12-05", toDateKey: "2026-12-07", kind: "UNPAID", reason: "ZZ travel", status: "PENDING" },
        ],
      });
      const desk = await adminLeave(head());
      const byKind = Object.fromEntries(desk.pending.map((r) => [r.kind, r.countedDays]));
      // Saturday 14 and Monday 16 November 2026 are school days; Sunday 15 is not.
      expect(byKind).toEqual({ SICK: 2, UNPAID: 0 });
    } finally {
      await db.school.update({ where: { id: ids.school }, data: { teachingDays: "0,1,2,3,4,5,6" } });
    }
  });
});

describe("the safety centre's audit trail", () => {
  it("TA-354: each row carries the web's words and its sensitive flag", async () => {
    await db.auditLog.createMany({
      data: [
        { schoolId: ids.school, actorUserId: ids.admin, action: "fees.counterPayment", targetType: "FeePayment", targetId: "zz", meta: "{}" },
        { schoolId: ids.school, actorUserId: ids.head, action: "auth.totp.failed", targetType: "User", targetId: ids.head, meta: "{}" },
      ],
    });
    const view = await adminSafety(admin(), { tab: "audit" });
    const row = (action: string) => view.audit.find((a) => a.action === action)!;
    expect(row("fees.counterPayment")).toMatchObject({ actionKey: "audit.feesCounterPayment", sensitive: false });
    expect(row("auth.totp.failed")).toMatchObject({ actionKey: "audit.authTotpFailed", sensitive: true });
  });
});

describe("the hostel's clock", () => {
  it("TA-500: the warden's leave list and the night board carry the school's zone", async () => {
    await expect(listLeave(admin(), "OPEN")).resolves.toMatchObject({ timeZone: TZ });
    await expect(nightRegister(admin())).resolves.toMatchObject({ timeZone: TZ });
  });
});
