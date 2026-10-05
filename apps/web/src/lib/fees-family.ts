import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { forSchool } from "./tenant-context";
import { listContexts } from "./session";
import { currentAcademicYear } from "./academic-year";
import { addDaysToKey, ageInYears, todayKey } from "./dates";
import { assignPlansAs, dateToDay, toDemandRow, type DemandRow } from "./fees";
import type { ActiveContext } from "./session";

/**
 * Fees as the family sees them beyond the parent's own page: a guardian
 * choosing an OPEN fee structure for their child, the year's payment
 * calendar, and a pupil's own read of their dues.
 *
 * NOTHING HERE MOVES MONEY, AND A PUPIL NEVER PAYS. The pupil's read is a
 * read: dues, what is paid, the next due date, with the sentence "ask a
 * grown-up at home to pay" on the page. The guardian's choice of a plan
 * writes through `assignPlansAs` — the one writer of plans and demands in
 * fees.ts — after this file's own refusals, so a self-enrolment leaves the
 * ledger exactly as an office assignment would. See docs/decisions/0003.
 */

/* -------------------------------------------------------------------------- */
/* Which child                                                                 */
/* -------------------------------------------------------------------------- */

type ChildLink = Awaited<ReturnType<typeof assertGuardianAccess>>;

/** The guardian's child this call is about: the one named, or their first; re-checked against the guardianship. */
async function childOf(ctx: ActiveContext, studentMembershipId?: string | null): Promise<{ link: ChildLink; children: Awaited<ReturnType<typeof listContexts>>["children"] }> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const { children } = await listContexts(ctx.user.id);
  const selectedId = studentMembershipId ?? children.find((c) => !c.leftAt)?.studentMembershipId ?? children[0]?.studentMembershipId;
  if (!selectedId) throw new AccessError("access.notAllowed");
  const link = await assertGuardianAccess(ctx.user.id, selectedId, "MONEY");
  return { link, children };
}

/* -------------------------------------------------------------------------- */
/* Open plans and the family's choice                                          */
/* -------------------------------------------------------------------------- */

export type FamilyPlan = { id: string; name: string; gradeLevel: string | null; totalPaise: number; instalments: { id: string; label: string; dueDateKey: string; totalPaise: number }[] };

export type FamilyPlans = {
  student: { studentMembershipId: string; name: string; gradeLevel: string | null };
  year: { id: string; name: string } | null;
  current: { structureId: string; structureName: string; paidPaise: number } | null;
  canEnrol: boolean;
  plans: FamilyPlan[];
};

/**
 * The structures the office has opened to families, for this child's grade
 * (a structure for every grade, or for the child's own), this year — with
 * their instalments and dates so the family can see what they are choosing.
 */
export async function familyPlans(ctx: ActiveContext, studentMembershipId?: string | null): Promise<FamilyPlans> {
  const { link } = await childOf(ctx, studentMembershipId);
  const schoolId = link.student.schoolId;
  const student = { studentMembershipId: link.studentMembershipId, name: link.student.user.preferredName ?? link.student.user.name, gradeLevel: link.student.gradeLevel };
  return forSchool(schoolId, async () => {
    const year = await currentAcademicYear(schoolId);
    if (!year) return { student, year: null, current: null, canEnrol: false, plans: [] };
    const [plan, paid, open] = await Promise.all([
      db.studentFeePlan.findUnique({ where: { studentMembershipId_academicYearId: { studentMembershipId: student.studentMembershipId, academicYearId: year.id } }, select: { structureId: true, structure: { select: { name: true } } } }),
      db.feeDemand.aggregate({ where: { schoolId, studentMembershipId: student.studentMembershipId, academicYearId: year.id }, _sum: { paidPaise: true } }),
      db.feeStructure.findMany({
        where: { schoolId, academicYearId: year.id, selfEnrol: true, publishedAt: { not: null }, archivedAt: null, OR: [{ gradeLevel: null }, ...(student.gradeLevel ? [{ gradeLevel: student.gradeLevel }] : [])] },
        orderBy: [{ name: "asc" }],
        include: { instalments: { orderBy: { sortOrder: "asc" }, include: { lines: { select: { amountPaise: true } } } } },
      }),
    ]);
    const paidPaise = paid._sum.paidPaise ?? 0;
    const plans: FamilyPlan[] = open.map((s) => {
      const instalments = s.instalments.map((i) => ({ id: i.id, label: i.label, dueDateKey: dateToDay(i.dueDate), totalPaise: i.lines.reduce((a, l) => a + l.amountPaise, 0) }));
      return { id: s.id, name: s.name, gradeLevel: s.gradeLevel, totalPaise: instalments.reduce((a, i) => a + i.totalPaise, 0), instalments };
    });
    return {
      student,
      year: { id: year.id, name: year.name },
      current: plan ? { structureId: plan.structureId, structureName: plan.structure.name, paidPaise } : null,
      canEnrol: !plan && paidPaise === 0 && !link.student.leftAt,
      plans,
    };
  });
}

/**
 * A guardian puts their child on an open structure. Refused when the child is
 * already on a plan this year (the office moves pupils, not the family), when
 * anything is paid this year, when the structure is not open to families or
 * not for the child's grade. The write is `assignPlansAs` with the guardian
 * as the caller, so the plan and the demands are written by the one writer;
 * it is audited twice — fees.assign by that writer, and fees.plan.selfEnrolled
 * here, naming the guardian — and the office is told.
 */
export async function selfEnrolPlan(ctx: ActiveContext, input: { student: string; planId: string }): Promise<{ structureId: string; demands: number }> {
  const { link } = await childOf(ctx, input.student);
  const schoolId = link.student.schoolId;
  if (link.student.leftAt) throw new AccessError("fees.refuseSelfEnrolLeft");
  const childName = link.student.user.preferredName ?? link.student.user.name;
  const result = await forSchool(schoolId, async () => {
    const structure = await db.feeStructure.findFirst({ where: { id: input.planId, schoolId }, select: { id: true, name: true, academicYearId: true, gradeLevel: true, selfEnrol: true, publishedAt: true, archivedAt: true } });
    if (!structure || !structure.selfEnrol || !structure.publishedAt || structure.archivedAt) throw new AccessError("fees.refuseSelfEnrolClosed", "NOT_FOUND");
    const year = await currentAcademicYear(schoolId);
    if (!year || year.id !== structure.academicYearId) throw new AccessError("fees.refuseSelfEnrolClosed", "NOT_FOUND");
    if (structure.gradeLevel && structure.gradeLevel !== link.student.gradeLevel) throw new AccessError("fees.refuseSelfEnrolGrade");
    const existing = await db.studentFeePlan.findUnique({ where: { studentMembershipId_academicYearId: { studentMembershipId: link.studentMembershipId, academicYearId: year.id } }, select: { id: true } });
    if (existing) throw new AccessError("fees.refuseSelfEnrolHasPlan");
    const paid = await db.feeDemand.count({ where: { schoolId, studentMembershipId: link.studentMembershipId, academicYearId: year.id, paidPaise: { gt: 0 } } });
    if (paid > 0) throw new AccessError("fees.refuseSelfEnrolPaid");
    const assigned = await assignPlansAs({ schoolId, userId: ctx.user.id, role: ctx.role, membershipId: null }, { structureId: structure.id, studentMembershipIds: [link.studentMembershipId] });
    if (assigned.refused.length > 0) throw new AccessError("fees.refuseSelfEnrolPaid");
    const demands = await db.feeDemand.count({ where: { schoolId, studentMembershipId: link.studentMembershipId, academicYearId: year.id, instalmentId: { not: null } } });
    await audit({ schoolId, actorUserId: ctx.user.id, action: "fees.plan.selfEnrolled", targetType: "Membership", targetId: link.studentMembershipId, meta: { structureId: structure.id, structureName: structure.name, academicYearId: year.id, demands } });
    const office = await db.membership.findMany({ where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true } });
    await Promise.all(
      office.map((m) =>
        notify({ userId: m.userId, schoolId, kind: "FEES", titleKey: "notifTitle.feePlanSelfEnrolled", titleVars: { name: childName }, bodyKey: "notifBody.feePlanSelfEnrolled", bodyVars: { name: childName, plan: structure.name }, url: `/admin/fees/pupils/${link.studentMembershipId}`, meta: { structureId: structure.id } }).catch((error) => console.error("[fees-family] office notice failed", error)),
      ),
    );
    return { structureId: structure.id, demands };
  });
  return result;
}

/* -------------------------------------------------------------------------- */
/* The payment calendar                                                        */
/* -------------------------------------------------------------------------- */

export type CalendarRow = { date: string; title: string; amount: number; status: string; kind: "INSTALMENT" | "DUE" | "REMINDER"; demandId: string | null };

/** The days the daily reminder job writes to a family, relative to the due day (fees-reports.ts BUCKETS). */
export const REMINDER_OFFSETS = [-7, 0, 7, 30] as const;
const DUE_SOON_DAYS = 7;

function dueStatus(row: DemandRow, today: string): string {
  if (row.status === "PAID") return "PAID";
  if (row.status === "WAIVED" || row.status === "CARRIED" || row.status === "CANCELLED") return row.status;
  if (row.status === "PART") return row.overdue ? "OVERDUE" : "PART";
  if (row.overdue) return "OVERDUE";
  return row.dueDateKey <= addDaysToKey(today, DUE_SOON_DAYS) ? "DUE_SOON" : "UPCOMING";
}

/**
 * The year's dates, in order: every instalment of the child's plan with where
 * it stands (an instalment with no demand yet is UPCOMING at its gross), any
 * due that is not an instalment (a carried opening balance), and the
 * reminders still to come for whatever is unpaid, so a family knows when
 * they will be nudged. A cancelled demand asks nothing and is left out.
 */
export function buildCalendar(input: { instalments: { id: string; label: string; dueDateKey: string; totalPaise: number }[]; demands: DemandRow[]; demandInstalment: Map<string, string | null>; today: string }): CalendarRow[] {
  const rows: CalendarRow[] = [];
  const byInstalment = new Map<string, DemandRow>();
  for (const d of input.demands) {
    const instalmentId = input.demandInstalment.get(d.id) ?? null;
    if (instalmentId) byInstalment.set(instalmentId, d);
  }
  for (const i of input.instalments) {
    const d = byInstalment.get(i.id);
    if (d) {
      if (d.status === "CANCELLED") continue;
      rows.push({ date: d.dueDateKey, title: d.label, amount: d.netPaise, status: dueStatus(d, input.today), kind: "INSTALMENT", demandId: d.id });
    } else {
      rows.push({ date: i.dueDateKey, title: i.label, amount: i.totalPaise, status: i.dueDateKey < input.today ? "OVERDUE" : i.dueDateKey <= addDaysToKey(input.today, DUE_SOON_DAYS) ? "DUE_SOON" : "UPCOMING", kind: "INSTALMENT", demandId: null });
    }
  }
  for (const d of input.demands) {
    if (input.demandInstalment.get(d.id)) continue;
    if (d.status === "CANCELLED") continue;
    rows.push({ date: d.dueDateKey, title: d.label, amount: d.netPaise, status: dueStatus(d, input.today), kind: "DUE", demandId: d.id });
  }
  for (const d of input.demands) {
    if (d.outstandingPaise <= 0) continue;
    for (const offset of REMINDER_OFFSETS) {
      const date = addDaysToKey(d.dueDateKey, offset);
      if (date < input.today) continue;
      // A reminder still to come is UPCOMING, whichever side of the due day it falls: one after the day read "Overdue" on a
      // date in December (A3-journeys-40). The instalment's own row says when the money itself is overdue.
      rows.push({ date, title: d.label, amount: d.outstandingPaise, status: "UPCOMING", kind: "REMINDER", demandId: d.id });
    }
  }
  const order = { INSTALMENT: 0, DUE: 1, REMINDER: 2 } as const;
  return rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : order[a.kind] - order[b.kind]));
}

export type FamilyCalendar = { student: { studentMembershipId: string; name: string }; year: { id: string; name: string } | null; todayKey: string; rows: CalendarRow[] };

export async function paymentCalendar(ctx: ActiveContext, studentMembershipId?: string | null): Promise<FamilyCalendar> {
  const { link } = await childOf(ctx, studentMembershipId);
  const schoolId = link.student.schoolId;
  const student = { studentMembershipId: link.studentMembershipId, name: link.student.user.preferredName ?? link.student.user.name };
  const today = todayKey(link.student.school.timezone);
  return forSchool(schoolId, async () => {
    const year = await currentAcademicYear(schoolId);
    if (!year) return { student, year: null, todayKey: today, rows: [] };
    const [plan, demands] = await Promise.all([
      db.studentFeePlan.findUnique({ where: { studentMembershipId_academicYearId: { studentMembershipId: student.studentMembershipId, academicYearId: year.id } }, select: { structure: { select: { instalments: { orderBy: { sortOrder: "asc" }, include: { lines: { select: { amountPaise: true } } } } } } } }),
      db.feeDemand.findMany({ where: { schoolId, studentMembershipId: student.studentMembershipId, academicYearId: year.id }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    ]);
    const rows = buildCalendar({
      instalments: (plan?.structure.instalments ?? []).map((i) => ({ id: i.id, label: i.label, dueDateKey: dateToDay(i.dueDate), totalPaise: i.lines.reduce((a, l) => a + l.amountPaise, 0) })),
      demands: demands.map((d) => toDemandRow(d, today)),
      demandInstalment: new Map(demands.map((d) => [d.id, d.instalmentId])),
      today,
    });
    return { student, year: { id: year.id, name: year.name }, todayKey: today, rows };
  });
}

/* -------------------------------------------------------------------------- */
/* The pupil's own read                                                        */
/* -------------------------------------------------------------------------- */

export type PupilFeesView = {
  allowed: boolean;
  fromAge: number | null;
  reason: "OFF" | "NO_BIRTHDATE" | "UNDER_AGE" | null;
  schoolName: string;
  year: { id: string; name: string } | null;
  todayKey: string;
  demands: DemandRow[];
  totals: { outstandingPaise: number; overduePaise: number; paidPaise: number };
  nextDue: { label: string; dueDateKey: string; amountPaise: number } | null;
};

/** Whether a pupil of this age may read their fees under the school's setting. Exported for the test. */
export function pupilMaySeeFees(fromAge: number | null, birthdate: Date | null, now: Date = new Date()): { allowed: boolean; reason: PupilFeesView["reason"] } {
  if (fromAge === null) return { allowed: false, reason: "OFF" };
  if (!birthdate) return { allowed: false, reason: "NO_BIRTHDATE" };
  return ageInYears(birthdate, now) >= fromAge ? { allowed: true, reason: null } : { allowed: false, reason: "UNDER_AGE" };
}

/**
 * A pupil's own fees: only while the school lets pupils of their age see
 * them. Dues, what is paid and the next due date — no way to pay and no
 * payment history, because a pupil never pays.
 */
export async function pupilFees(ctx: ActiveContext, now: Date = new Date()): Promise<PupilFeesView> {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("fees.refusePupil");
  const membership = await db.membership.findFirst({ where: { id: ctx.membershipId, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true, user: { select: { birthdate: true } }, school: { select: { name: true, timezone: true, pupilFeeViewAge: true } } } });
  if (!membership) throw new AccessError("fees.notFound", "NOT_FOUND");
  const today = todayKey(membership.school.timezone, now);
  const gate = pupilMaySeeFees(membership.school.pupilFeeViewAge, membership.user.birthdate, now);
  const closed: PupilFeesView = { allowed: false, fromAge: membership.school.pupilFeeViewAge, reason: gate.reason, schoolName: membership.school.name, year: null, todayKey: today, demands: [], totals: { outstandingPaise: 0, overduePaise: 0, paidPaise: 0 }, nextDue: null };
  if (!gate.allowed) return closed;
  const year = await currentAcademicYear(ctx.schoolId);
  if (!year) return { ...closed, allowed: true };
  const demands = await db.feeDemand.findMany({ where: { schoolId: ctx.schoolId, studentMembershipId: membership.id, academicYearId: year.id, status: { in: ["OPEN", "PART", "PAID"] } }, orderBy: [{ dueDate: "asc" }] });
  const rows = demands.map((d) => toDemandRow(d, today));
  const next = rows.find((d) => d.outstandingPaise > 0) ?? null;
  return {
    allowed: true,
    fromAge: membership.school.pupilFeeViewAge,
    reason: null,
    schoolName: membership.school.name,
    year: { id: year.id, name: year.name },
    todayKey: today,
    demands: rows,
    totals: { outstandingPaise: rows.reduce((a, d) => a + d.outstandingPaise, 0), overduePaise: rows.filter((d) => d.overdue).reduce((a, d) => a + d.outstandingPaise, 0), paidPaise: rows.reduce((a, d) => a + d.paidPaise, 0) },
    nextDue: next ? { label: next.label, dueDateKey: next.dueDateKey, amountPaise: next.outstandingPaise } : null,
  };
}
