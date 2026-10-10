/**
 * SETTLE ON LEAVING (R-61 Q2, the owner's decision of 10 October 2026).
 *
 * A pupil leaves with Term 1 paid, Term 2 (due after the leaving day) part
 * paid and Term 3 (due after it) untouched. The departure itself cancels
 * Term 3, as A3-journeys-15 built it; Term 2 is the office's to settle. The
 * three cases: the step lists what is cancelled and what is owed; the
 * office cancels the balance (the demand goes WAIVED, the paid amount kept,
 * nothing outstanding, the family reads "cancelled"); the office keeps it
 * owed (the demand stays PART, still outstanding, the family reads "still
 * owed"). One writer, once: a second settlement is refused; an undecided
 * line is refused; a pupil still on the roll cannot be settled.
 *
 * At a ZZ school of this suite's own, through the libraries.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { familyLeavingOutcome, leavingSettlementFor, settleOnLeaving } from "@/lib/leaving-settlement";
import { recordDeparture } from "@/lib/school-record";
import { assignPlansAs, pupilLedger } from "@/lib/fees";
import { RuleRefusal } from "@/lib/rule-refusal";
import { addDaysToKey, todayKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const LEFT_ON = addDaysToKey(TODAY, -5);
const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
const ids = { school: "", admin: "", adminMembership: "", parent: "", year: "", structure: "", cancels: "", keeps: "", stays: "", t2Cancels: "", t2Keeps: "" };

function ctx(role: "ADMIN" | "PARENT" | "PRINCIPAL", userId: string, membershipId: string | null, schoolId: string | null): ActiveContext {
  return {
    sessionId: "test",
    membershipId,
    schoolId,
    role,
    user: { id: userId, name: "ZZ Settle", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}
const admin = () => ctx("ADMIN", ids.admin, ids.adminMembership, ids.school);

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Settle ${STAMP}`, slug: `zz-settle-${STAMP}`, code: `ZST${SUFFIX}`, contactEmail: `zz-settle-${STAMP}@test.invalid`, timezone: TZ, locale: "en" }, select: { id: true } })).id;
  const user = (who: string) => db.user.create({ data: { name: `ZZ Settle ${who}`, email: `zz-settle-${who.toLowerCase()}-${STAMP}@test.invalid`, birthdate: who.startsWith("Pupil") ? new Date("2018-01-01T00:00:00Z") : null }, select: { id: true } });
  const [a, p, c, k, s] = await Promise.all([user("Admin"), user("Parent"), user("PupilCancels"), user("PupilKeeps"), user("PupilStays")]);
  ids.admin = a.id;
  ids.parent = p.id;
  ids.adminMembership = (await db.membership.create({ data: { userId: a.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  const longAgo = new Date(Date.now() - 400 * 86_400_000);
  const pupil = async (userId: string, code: string) => (await db.membership.create({ data: { userId, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `${code}${STAMP}`, joinedAt: longAgo, gradeLevel: "3" }, select: { id: true } })).id;
  ids.cancels = await pupil(c.id, "ZSC");
  ids.keeps = await pupil(k.id, "ZSK");
  ids.stays = await pupil(s.id, "ZSS");
  await db.guardianship.createMany({ data: [ids.cancels, ids.keeps].map((studentMembershipId) => ({ parentUserId: p.id, studentMembershipId, studentSchoolId: ids.school, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() })) });
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "ZZ 2026–27", startDate: day(addDaysToKey(TODAY, -120)), endDate: day(addDaysToKey(TODAY, 240)), isCurrent: true }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: ids.school, name: "ZZ Settle 3A", gradeLevel: "3", joinCode: `ZS3${SUFFIX}` }, select: { id: true } });
  await db.enrollment.createMany({ data: [ids.cancels, ids.keeps, ids.stays].map((studentMembershipId) => ({ classId: klass.id, schoolId: ids.school, studentMembershipId, status: "ACTIVE" })) });
  const head = await db.feeHead.create({ data: { schoolId: ids.school, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } });
  ids.structure = (await db.feeStructure.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ Grade 3 fees", gradeLevel: "3", publishedAt: new Date() }, select: { id: true } })).id;
  for (const [label, offset, paise, order] of [["ZZ Term 1", -80, 15_000_00, 0], ["ZZ Term 2", 20, 12_500_00, 1], ["ZZ Term 3", 70, 10_000_00, 2]] as const) {
    await db.feeInstalment.create({ data: { schoolId: ids.school, structureId: ids.structure, label, sortOrder: order, dueDate: day(addDaysToKey(TODAY, offset)), lines: { create: [{ schoolId: ids.school, headId: head.id, amountPaise: paise }] } } });
  }
  await assignPlansAs({ schoolId: ids.school, userId: ids.admin, role: "ADMIN", membershipId: ids.adminMembership }, { structureId: ids.structure, studentMembershipIds: [ids.cancels, ids.keeps, ids.stays] });
  // Term 1 paid in full, Term 2 part paid (₹5,000 of ₹12,500), Term 3 untouched — for the two leavers.
  for (const id of [ids.cancels, ids.keeps]) {
    await db.feeDemand.updateMany({ where: { studentMembershipId: id, label: "ZZ Term 1" }, data: { paidPaise: 15_000_00, status: "PAID" } });
    await db.feeDemand.updateMany({ where: { studentMembershipId: id, label: "ZZ Term 2" }, data: { paidPaise: 5_000_00, status: "PART" } });
  }
  for (const id of [ids.cancels, ids.keeps]) {
    const left = await recordDeparture(admin(), id, { reason: "TRANSFERRED", conduct: "GOOD", leftOn: day(LEFT_ON) });
    if (!left.ok) throw new Error(`recordDeparture refused: ${left.errorKey}`);
  }
  ids.t2Cancels = (await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: ids.cancels, label: "ZZ Term 2" }, select: { id: true } })).id;
  ids.t2Keeps = (await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: ids.keeps, label: "ZZ Term 2" }, select: { id: true } })).id;
}, 120_000);

afterAll(async () => {
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 60_000);

describe("the step lists what the departure cancelled and what is still owed", () => {
  it("Term 3 (unpaid, due after the leaving day) is cancelled by the departure; Term 2 (part paid, due after) is owed and marked later; Term 1 is neither", async () => {
    const view = await leavingSettlementFor(admin(), ids.cancels);
    expect(view.leftOnKey).toBe(LEFT_ON);
    expect(view.cancelled.map((c) => [c.label, c.netPaise])).toEqual([["ZZ Term 3", 10_000_00]]);
    expect(view.owed.map((l) => [l.label, l.balancePaise, l.later, l.choice])).toEqual([["ZZ Term 2", 7_500_00, true, null]]);
    expect(view.items).toEqual([]);
    expect(view.settled).toBeNull();
    expect(view.canSettle).toBe(true);
  }, 60_000);

  it("a pupil still on the roll has nothing to settle, and the principal reads without the form", async () => {
    const stays = await leavingSettlementFor(admin(), ids.stays);
    expect(stays.leftOnKey).toBeNull();
    expect(stays.canSettle).toBe(false);
    await expect(settleOnLeaving(admin(), ids.stays, { lines: [] })).rejects.toMatchObject({ key: "ownerDecisions.refuseNotLeft" });
    const head = await leavingSettlementFor(ctx("PRINCIPAL", ids.admin, ids.adminMembership, ids.school), ids.cancels);
    expect(head.canSettle).toBe(false);
    expect(head.owed).toHaveLength(1);
  }, 60_000);
});

describe("the office's choice, once", () => {
  it("CANCEL: the balance is cancelled — the demand goes WAIVED with the paid amount kept, nothing outstanding, the family reads cancelled, the audit row has the totals", async () => {
    await expect(settleOnLeaving(admin(), ids.cancels, { lines: [] })).rejects.toMatchObject({ key: "ownerDecisions.refuseLineMissing" });
    const view = await settleOnLeaving(admin(), ids.cancels, { lines: [{ demandId: ids.t2Cancels, choice: "CANCEL" }] });
    expect(view.settled).toMatchObject({ cancelledPaise: 7_500_00, keptPaise: 0 });
    expect(view.owed[0]).toMatchObject({ demandId: ids.t2Cancels, choice: "CANCEL", balancePaise: 7_500_00 });
    expect(view.canSettle).toBe(false);
    const demand = await db.feeDemand.findUniqueOrThrow({ where: { id: ids.t2Cancels }, select: { status: true, paidPaise: true, netPaise: true } });
    expect(demand).toEqual({ status: "WAIVED", paidPaise: 5_000_00, netPaise: 12_500_00 });
    const ledger = await pupilLedger(ids.school, ids.cancels, { todayKey: TODAY });
    expect(ledger.totals.outstandingPaise).toBe(0);
    expect(ledger.totals.paidPaise).toBe(20_000_00);
    const audit = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "fees.leavingSettled", targetId: ids.cancels }, select: { meta: true } });
    expect(JSON.parse(audit!.meta)).toMatchObject({ lines: 1, cancelled: 1, cancelledPaise: 7_500_00, keptPaise: 0, byDeparture: 1 });
    // Once: a second settlement is refused and changes nothing.
    await expect(settleOnLeaving(admin(), ids.cancels, { lines: [{ demandId: ids.t2Cancels, choice: "KEEP" }] })).rejects.toBeInstanceOf(RuleRefusal);
    expect((await db.leavingSettlement.count({ where: { studentMembershipId: ids.cancels } }))).toBe(1);
    const family = await familyLeavingOutcome(ctx("PARENT", ids.parent, null, null), ids.cancels);
    expect(family.cancelledByDeparture.map((c) => c.label)).toEqual(["ZZ Term 3"]);
    expect(family.settlement).toMatchObject({ cancelledPaise: 7_500_00, keptPaise: 0 });
    expect(family.settlement!.lines).toEqual([{ label: "ZZ Term 2", dueDateKey: addDaysToKey(TODAY, 20), balancePaise: 7_500_00, choice: "CANCEL" }]);
  }, 60_000);

  it("KEEP: the demand stays PART and outstanding, the family reads still owed; a line that is not the pupil's is refused", async () => {
    await expect(settleOnLeaving(admin(), ids.keeps, { lines: [{ demandId: ids.t2Cancels, choice: "KEEP" }] })).rejects.toMatchObject({ key: "ownerDecisions.refuseLineUnknown" });
    const view = await settleOnLeaving(admin(), ids.keeps, { lines: [{ demandId: ids.t2Keeps, choice: "KEEP" }] });
    expect(view.settled).toMatchObject({ cancelledPaise: 0, keptPaise: 7_500_00 });
    const demand = await db.feeDemand.findUniqueOrThrow({ where: { id: ids.t2Keeps }, select: { status: true, paidPaise: true } });
    expect(demand).toEqual({ status: "PART", paidPaise: 5_000_00 });
    const ledger = await pupilLedger(ids.school, ids.keeps, { todayKey: TODAY });
    expect(ledger.totals.outstandingPaise).toBe(7_500_00);
    const family = await familyLeavingOutcome(ctx("PARENT", ids.parent, null, null), ids.keeps);
    expect(family.settlement!.lines[0]).toMatchObject({ label: "ZZ Term 2", choice: "KEEP", balancePaise: 7_500_00 });
    expect(family.settlement).toMatchObject({ keptPaise: 7_500_00 });
    // The guardians were told once per settlement.
    expect(await db.notification.count({ where: { userId: ids.parent, titleKey: "ownerDecisions.notifSettledTitle" } })).toBe(2);
  }, 60_000);
});
