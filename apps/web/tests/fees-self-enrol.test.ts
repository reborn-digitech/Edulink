/**
 * A family choosing an open fee plan for their child, against the database:
 * the office opens a published structure, the guardian sees it for the
 * child's grade (not a closed one, not another grade's), enrols once, is
 * refused a second time, and is refused altogether once anything is paid.
 * The plan and the demands are written by the same writer the office uses,
 * so the pupil's ledger reads exactly as an office assignment would; the
 * payment calendar lists the instalments and the reminders still to come.
 *
 * Scoped to its own ZZ school, deleted in afterAll. tests/fees-invariants.test.ts
 * (money never through the platform) is unchanged by this feature and is run
 * beside it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { todayKey, addDaysToKey } from "@/lib/dates";
import { assignPlans, createStructure, publishStructure, pupilLedger, saveHead, setStructureSelfEnrol, listStructures } from "@/lib/fees";
import { recordCounterPayment } from "@/lib/fees-payments";
import { buildCalendar, familyPlans, paymentCalendar, selfEnrolPlan } from "@/lib/fees-family";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);

let schoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let parentUserId = "";
let otherParentUserId = "";
let pupilA = "";
let pupilB = "";
let pupilOther = "";
let tuitionId = "";
let openId = "";
let closedId = "";
let otherGradeId = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ Self Enrol Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });
const parent = () => ctx({ userId: parentUserId, role: "PARENT" });
const otherParent = () => ctx({ userId: otherParentUserId, role: "PARENT" });

beforeAll(async () => {
  const school = await db.school.create({ data: { name: `ZZ SelfEnrol School ${STAMP}`, slug: `zz-selfenrol-${STAMP}`, code: `ZSE${String(STAMP).slice(-5)}`, contactEmail: `zz-selfenrol-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  schoolId = school.id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ SelfEnrol ${who}`, email: `zz-selfenrol-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, par, par2, pa, pb, po] = await Promise.all([mk("Admin"), mk("Parent"), mk("Parent2"), mk("PupilA"), mk("PupilB"), mk("PupilOther")]);
  adminUserId = a.id;
  parentUserId = par.id;
  otherParentUserId = par2.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  pupilA = (await db.membership.create({ data: { userId: pa.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSA${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: pb.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSB${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  pupilOther = (await db.membership.create({ data: { userId: po.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSO${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  await db.guardianship.createMany({
    data: [
      { parentUserId, studentMembershipId: pupilA, studentSchoolId: schoolId, status: "ACTIVE" },
      { parentUserId, studentMembershipId: pupilB, studentSchoolId: schoolId, status: "ACTIVE" },
      { parentUserId: otherParentUserId, studentMembershipId: pupilOther, studentSchoolId: schoolId, status: "ACTIVE" },
    ],
  });
  tuitionId = await saveHead(admin(), { name: "Tuition", code: "TUI", kind: "TUITION" });
  const instalments = [
    { label: "Term 1", dueDateKey: addDaysToKey(TODAY, 20), lines: [{ headId: tuitionId, amountPaise: 1_000_00 }] },
    { label: "Term 2", dueDateKey: addDaysToKey(TODAY, 120), lines: [{ headId: tuitionId, amountPaise: 1_000_00 }] },
  ];
  openId = await createStructure(admin(), { name: "Grade 3 open", gradeLevel: "3", instalments });
  closedId = await createStructure(admin(), { name: "Grade 3 office only", gradeLevel: "3", instalments });
  otherGradeId = await createStructure(admin(), { name: "Grade 7 open", gradeLevel: "7", instalments });
  await publishStructure(admin(), openId);
  await publishStructure(admin(), closedId);
  await publishStructure(admin(), otherGradeId);
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("opening a structure to families", () => {
  it("only the office opens a published structure; a draft is refused; the list says which are open", async () => {
    const draftId = await createStructure(admin(), { name: "Draft", gradeLevel: "3", instalments: [{ label: "T", dueDateKey: TODAY, lines: [{ headId: tuitionId, amountPaise: 100 }] }] });
    await expect(setStructureSelfEnrol(admin(), draftId, true)).rejects.toThrow("fees.refuseSelfEnrolDraft");
    await expect(setStructureSelfEnrol(parent(), openId, true)).rejects.toThrow("fees.refuseOffice");
    await setStructureSelfEnrol(admin(), openId, true);
    await setStructureSelfEnrol(admin(), otherGradeId, true);
    const list = await listStructures(admin(), {});
    expect(Object.fromEntries(list.map((s) => [s.name, s.selfEnrol]))).toEqual({ "Grade 3 open": true, "Grade 3 office only": false, "Grade 7 open": true, Draft: false });
  });
});

describe("a guardian choosing a plan", () => {
  it("sees the open plans for the child's grade — not the closed one, not another grade's — with instalments and dates", async () => {
    const plans = await familyPlans(parent(), pupilA);
    expect(plans.student.studentMembershipId).toBe(pupilA);
    expect(plans.current).toBeNull();
    expect(plans.canEnrol).toBe(true);
    expect(plans.plans.map((p) => p.name)).toEqual(["Grade 3 open"]);
    expect(plans.plans[0]!.instalments.map((i) => [i.label, i.dueDateKey, i.totalPaise])).toEqual([
      ["Term 1", addDaysToKey(TODAY, 20), 1_000_00],
      ["Term 2", addDaysToKey(TODAY, 120), 1_000_00],
    ]);
    expect(plans.plans[0]!.totalPaise).toBe(2_000_00);
  });

  it("enrols in an open plan exactly as the office's assign does, audits it, and tells the office", async () => {
    const result = await selfEnrolPlan(parent(), { student: pupilA, planId: openId });
    expect(result).toEqual({ structureId: openId, demands: 2 });
    const ledger = await pupilLedger(schoolId, pupilA, { todayKey: TODAY });
    expect(ledger.plan?.structureId).toBe(openId);
    expect(ledger.demands.map((d) => [d.label, d.netPaise, d.status])).toEqual([
      ["Term 1", 1_000_00, "OPEN"],
      ["Term 2", 1_000_00, "OPEN"],
    ]);
    const audits = await db.auditLog.findMany({ where: { schoolId, targetId: pupilA, action: { in: ["fees.plan.selfEnrolled", "fees.assign"] } }, select: { action: true, actorUserId: true } });
    expect(audits.some((a) => a.action === "fees.plan.selfEnrolled" && a.actorUserId === parentUserId)).toBe(true);
    const notice = await db.notification.findFirst({ where: { userId: adminUserId, schoolId, kind: "FEES" }, orderBy: { createdAt: "desc" }, select: { url: true } });
    expect(notice?.url).toBe(`/admin/fees/pupils/${pupilA}`);
    // The office's own assign of the same structure now counts the pupil as unchanged — one writer, one plan.
    expect(await assignPlans(admin(), { structureId: openId, studentMembershipIds: [pupilA] })).toEqual({ assigned: 0, moved: 0, unchanged: 1, refused: [] });
  });

  it("a second enrolment is refused, and so are a closed plan, another grade's plan and somebody else's child", async () => {
    await expect(selfEnrolPlan(parent(), { student: pupilA, planId: openId })).rejects.toThrow("fees.refuseSelfEnrolHasPlan");
    const plans = await familyPlans(parent(), pupilA);
    expect(plans.current?.structureId).toBe(openId);
    expect(plans.canEnrol).toBe(false);
    await expect(selfEnrolPlan(parent(), { student: pupilB, planId: closedId })).rejects.toThrow("fees.refuseSelfEnrolClosed");
    await expect(selfEnrolPlan(parent(), { student: pupilB, planId: otherGradeId })).rejects.toThrow("fees.refuseSelfEnrolGrade");
    await expect(selfEnrolPlan(otherParent(), { student: pupilB, planId: openId })).rejects.toThrow("access.notYourChild");
    await expect(selfEnrolPlan(admin(), { student: pupilB, planId: openId })).rejects.toThrow("fees.refuseFamily");
    expect((await pupilLedger(schoolId, pupilB, { todayKey: TODAY })).plan).toBeNull();
  });

  it("a paid instalment blocks: the office assigned and took a payment, so the family cannot choose", async () => {
    await assignPlans(admin(), { structureId: closedId, studentMembershipIds: [pupilB] });
    await db.studentFeePlan.deleteMany({ where: { studentMembershipId: pupilB } });
    // The plan row is gone but the demands stay; a payment against one is what blocks.
    await db.studentFeePlan.create({ data: { schoolId, studentMembershipId: pupilB, structureId: closedId, academicYearId: (await db.academicYear.findFirstOrThrow({ where: { schoolId } })).id } });
    await recordCounterPayment(admin(), { studentMembershipId: pupilB, amountPaise: 500_00, method: "CASH", clientId: `zz-selfenrol-${STAMP}` });
    await db.studentFeePlan.deleteMany({ where: { studentMembershipId: pupilB } });
    const plans = await familyPlans(parent(), pupilB);
    expect(plans.current).toBeNull();
    expect(plans.canEnrol).toBe(false);
    await expect(selfEnrolPlan(parent(), { student: pupilB, planId: openId })).rejects.toThrow("fees.refuseSelfEnrolPaid");
  });
});

describe("the payment calendar", () => {
  it("lists the child's instalments with their state and the reminders still to come, in date order", async () => {
    const cal = await paymentCalendar(parent(), pupilA);
    expect(cal.student.studentMembershipId).toBe(pupilA);
    const instalments = cal.rows.filter((r) => r.kind === "INSTALMENT");
    expect(instalments.map((r) => [r.date, r.title, r.amount, r.status])).toEqual([
      [addDaysToKey(TODAY, 20), "Term 1", 1_000_00, "UPCOMING"],
      [addDaysToKey(TODAY, 120), "Term 2", 1_000_00, "UPCOMING"],
    ]);
    const reminders = cal.rows.filter((r) => r.kind === "REMINDER" && r.title === "Term 1").map((r) => r.date);
    expect(reminders).toEqual([addDaysToKey(TODAY, 13), addDaysToKey(TODAY, 20), addDaysToKey(TODAY, 27), addDaysToKey(TODAY, 50)]);
    expect(cal.rows.map((r) => r.date)).toEqual([...cal.rows.map((r) => r.date)].sort());
  });

  it("a paid instalment is PAID with no reminders; an unpaid one past its day is OVERDUE; a reminder day already gone is not listed", () => {
    const today = "2026-09-15";
    const demand = (over: Partial<Parameters<typeof buildCalendar>[0]["demands"][number]>) => ({ id: "d", label: "T", dueDateKey: "2026-09-10", grossPaise: 100, concessionPaise: 0, netPaise: 100, paidPaise: 0, outstandingPaise: 100, status: "OPEN", overdue: true, lines: [], ...over });
    const paid = buildCalendar({ instalments: [{ id: "i1", label: "T", dueDateKey: "2026-09-10", totalPaise: 100 }], demands: [demand({ id: "d1", paidPaise: 100, outstandingPaise: 0, status: "PAID", overdue: false })], demandInstalment: new Map([["d1", "i1"]]), today });
    expect(paid.map((r) => [r.kind, r.status])).toEqual([["INSTALMENT", "PAID"]]);
    const overdue = buildCalendar({ instalments: [{ id: "i1", label: "T", dueDateKey: "2026-09-10", totalPaise: 100 }], demands: [demand({ id: "d1" })], demandInstalment: new Map([["d1", "i1"]]), today });
    expect(overdue.map((r) => [r.date, r.kind, r.status])).toEqual([
      ["2026-09-10", "INSTALMENT", "OVERDUE"],
      ["2026-09-17", "REMINDER", "OVERDUE"],
      ["2026-10-10", "REMINDER", "OVERDUE"],
    ]);
    // A carried opening balance is a DUE row, not an instalment; a cancelled demand asks nothing.
    const carried = buildCalendar({ instalments: [], demands: [demand({ id: "d2", label: "Opening balance", dueDateKey: "2026-09-20", overdue: false }), demand({ id: "d3", status: "CANCELLED", outstandingPaise: 0 })], demandInstalment: new Map([["d2", null], ["d3", null]]), today });
    expect(carried.filter((r) => r.kind !== "REMINDER").map((r) => [r.kind, r.title, r.status])).toEqual([["DUE", "Opening balance", "DUE_SOON"]]);
  });
});
