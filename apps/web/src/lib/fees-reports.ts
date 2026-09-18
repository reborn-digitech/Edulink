import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notifyGuardians } from "./notify";
import { AccessError } from "./tenancy";
import { forSchool } from "./tenant-context";
import { currentAcademicYear } from "./academic-year";
import { addDaysToKey, todayKey } from "./dates";
import { toCsv } from "./csv";
import { writeJson } from "./json";
import { officeOrHead, requireFeesOffice, dateToDay, dayToDate } from "./fees";
import { FEE_CLAIM_STALE_DAYS } from "./constants";
import type { ActiveContext } from "./session";
import { translator } from "./i18n/dictionary";
import { normaliseLocale } from "@edulink/i18n";

/**
 * Fees: reading the ledger — the office's overview and dues list, the two
 * CSV exports, the reminder job and the office's own "remind now", and the
 * year-end carry-forward. Nothing here takes money; the one write is the
 * carry-forward, which moves what is owed from one year's rows to the next.
 */

const rupees = (paise: number) => {
  const r = paise / 100;
  return `₹${new Intl.NumberFormat("en-IN", { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 }).format(r)}`;
};

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

export type FeeOverview = {
  year: { id: string; name: string } | null;
  todayKey: string;
  totals: { demandedPaise: number; collectedPaise: number; outstandingPaise: number; overduePaise: number };
  pupils: { onPlan: number; withoutPlan: number };
  byGrade: { gradeLevel: string; pupils: number; demandedPaise: number; collectedPaise: number; outstandingPaise: number; overduePaise: number }[];
  ageing: { current: number; d30: number; d90: number; d90plus: number };
  methodsThisMonth: { method: string; count: number; amountPaise: number }[];
  recent: { paymentId: string; pupilName: string; amountPaise: number; method: string; status: string; when: Date; serial: string | null; receiptId: string | null }[];
  claims: { waiting: number; stale: number };
  initiatedOnline: number;
  structures: number;
  heads: number;
  options: { online: boolean; upi: boolean };
};

export async function feeOverview(ctx: ActiveContext): Promise<FeeOverview> {
  const caller = officeOrHead(ctx);
  const schoolId = caller.schoolId;
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, feeUpiId: true } });
  const today = todayKey(school.timezone);
  const year = await currentAcademicYear(schoolId);
  const empty: FeeOverview = {
    year: year ? { id: year.id, name: year.name } : null,
    todayKey: today,
    totals: { demandedPaise: 0, collectedPaise: 0, outstandingPaise: 0, overduePaise: 0 },
    pupils: { onPlan: 0, withoutPlan: 0 },
    byGrade: [],
    ageing: { current: 0, d30: 0, d90: 0, d90plus: 0 },
    methodsThisMonth: [],
    recent: [],
    claims: { waiting: 0, stale: 0 },
    initiatedOnline: 0,
    structures: 0,
    heads: 0,
    options: { online: false, upi: Boolean(school.feeUpiId) },
  };
  const [heads, gateway, structures] = await Promise.all([
    db.feeHead.count({ where: { schoolId, retiredAt: null } }),
    db.feeGatewayAccount.findUnique({ where: { schoolId }, select: { id: true } }),
    year ? db.feeStructure.count({ where: { schoolId, academicYearId: year.id, archivedAt: null } }) : 0,
  ]);
  empty.heads = heads;
  empty.options.online = Boolean(gateway);
  empty.structures = structures;
  if (!year) return empty;

  const [demands, onPlan, pupilsTotal, monthPayments, recent, claims, initiatedOnline] = await Promise.all([
    db.feeDemand.findMany({ where: { schoolId, academicYearId: year.id, status: { in: ["OPEN", "PART", "PAID"] } }, select: { studentMembershipId: true, netPaise: true, paidPaise: true, dueDate: true, status: true, student: { select: { gradeLevel: true } } } }),
    db.studentFeePlan.count({ where: { schoolId, academicYearId: year.id } }),
    db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
    db.feePayment.groupBy({ by: ["method"], where: { schoolId, status: { in: ["PAID", "REFUNDED"] }, paidAt: { gte: dayToDate(`${today.slice(0, 7)}-01`) } }, _count: { _all: true }, _sum: { amountPaise: true } }),
    db.feePayment.findMany({ where: { schoolId, status: { in: ["PAID", "CLAIMED", "REVERSED", "REFUNDED"] } }, orderBy: { updatedAt: "desc" }, take: 8, include: { student: { select: { user: { select: { name: true, preferredName: true } } } }, receipt: { select: { id: true, serial: true } } } }),
    db.feePayment.findMany({ where: { schoolId, method: "UPI", status: "CLAIMED" }, select: { claimedAt: true } }),
    db.feePayment.count({ where: { schoolId, method: "ONLINE", status: "INITIATED" } }),
  ]);

  const grades = new Map<string, FeeOverview["byGrade"][number] & { ids: Set<string> }>();
  const ageing = { current: 0, d30: 0, d90: 0, d90plus: 0 };
  let demanded = 0;
  let collected = 0;
  let outstanding = 0;
  let overdue = 0;
  const d30Key = addDaysToKey(today, -30);
  const d90Key = addDaysToKey(today, -90);
  for (const d of demands) {
    const grade = d.student.gradeLevel ?? "—";
    const row = grades.get(grade) ?? { gradeLevel: grade, pupils: 0, demandedPaise: 0, collectedPaise: 0, outstandingPaise: 0, overduePaise: 0, ids: new Set<string>() };
    row.ids.add(d.studentMembershipId);
    const left = d.status === "PAID" ? 0 : Math.max(0, d.netPaise - d.paidPaise);
    const dueKey = dateToDay(d.dueDate);
    const isOverdue = left > 0 && dueKey < today;
    demanded += d.netPaise;
    collected += d.paidPaise;
    outstanding += left;
    row.demandedPaise += d.netPaise;
    row.collectedPaise += d.paidPaise;
    row.outstandingPaise += left;
    if (isOverdue) {
      overdue += left;
      row.overduePaise += left;
      if (dueKey < d90Key) ageing.d90plus += left;
      else if (dueKey < d30Key) ageing.d90 += left;
      else ageing.d30 += left;
    } else if (left > 0) ageing.current += left;
    grades.set(grade, row);
  }
  const staleBefore = Date.now() - FEE_CLAIM_STALE_DAYS * 86_400_000;
  return {
    ...empty,
    totals: { demandedPaise: demanded, collectedPaise: collected, outstandingPaise: outstanding, overduePaise: overdue },
    pupils: { onPlan, withoutPlan: Math.max(0, pupilsTotal - onPlan) },
    byGrade: [...grades.values()].map(({ ids, ...row }) => ({ ...row, pupils: ids.size })).sort((a, b) => Number(a.gradeLevel) - Number(b.gradeLevel) || a.gradeLevel.localeCompare(b.gradeLevel)),
    ageing,
    methodsThisMonth: monthPayments.map((m) => ({ method: m.method, count: m._count._all, amountPaise: m._sum.amountPaise ?? 0 })),
    recent: recent.map((p) => ({ paymentId: p.id, pupilName: p.student.user.preferredName ?? p.student.user.name, amountPaise: p.amountPaise, method: p.method, status: p.status, when: p.paidAt ?? p.claimedAt ?? p.updatedAt, serial: p.receipt?.serial ?? null, receiptId: p.receipt?.id ?? null })),
    claims: { waiting: claims.length, stale: claims.filter((c) => (c.claimedAt?.getTime() ?? 0) < staleBefore).length },
    initiatedOnline,
  };
}

/* -------------------------------------------------------------------------- */
/* Dues                                                                        */
/* -------------------------------------------------------------------------- */

export type DuesFilter = { status?: "all" | "open" | "overdue" | "paid"; classId?: string; q?: string; page?: number; pageSize?: number };

export type DuesRow = { studentMembershipId: string; name: string; studentCode: string | null; className: string | null; gradeLevel: string | null; netPaise: number; paidPaise: number; outstandingPaise: number; overduePaise: number; nextDueKey: string | null; hasPlan: boolean };

export async function duesList(ctx: ActiveContext, filter: DuesFilter): Promise<{ rows: DuesRow[]; total: number; page: number; pageSize: number; year: { id: string; name: string } | null; todayKey: string; classes: { id: string; name: string }[] }> {
  const caller = officeOrHead(ctx);
  const schoolId = caller.schoolId;
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const year = await currentAcademicYear(schoolId);
  const classes = await db.class.findMany({ where: { schoolId, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const pageSize = Math.min(Math.max(filter.pageSize ?? 50, 10), 200);
  const page = Math.max(filter.page ?? 1, 1);
  if (!year) return { rows: [], total: 0, page, pageSize, year: null, todayKey: today, classes };
  const q = filter.q?.trim();
  const pupils = await db.membership.findMany({
    where: {
      schoolId,
      role: "STUDENT",
      status: "ACTIVE",
      leftAt: null,
      ...(filter.classId ? { enrollments: { some: { classId: filter.classId, status: "ACTIVE" } } } : {}),
      ...(q ? { OR: [{ user: { name: { contains: q, mode: "insensitive" } } }, { studentCode: { contains: q, mode: "insensitive" } }] } : {}),
    },
    select: { id: true, studentCode: true, gradeLevel: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } },
    orderBy: { user: { name: "asc" } },
  });
  const ids = pupils.map((p) => p.id);
  const [demands, plans] = await Promise.all([
    db.feeDemand.findMany({ where: { schoolId, academicYearId: year.id, studentMembershipId: { in: ids }, status: { in: ["OPEN", "PART", "PAID"] } }, select: { studentMembershipId: true, netPaise: true, paidPaise: true, dueDate: true, status: true } }),
    db.studentFeePlan.findMany({ where: { schoolId, academicYearId: year.id, studentMembershipId: { in: ids } }, select: { studentMembershipId: true } }),
  ]);
  const planned = new Set(plans.map((p) => p.studentMembershipId));
  const byPupil = new Map<string, typeof demands>();
  for (const d of demands) {
    const list = byPupil.get(d.studentMembershipId) ?? [];
    list.push(d);
    byPupil.set(d.studentMembershipId, list);
  }
  let rows: DuesRow[] = pupils.map((p) => {
    const mine = byPupil.get(p.id) ?? [];
    const netPaise = mine.reduce((a, d) => a + d.netPaise, 0);
    const paidPaise = mine.reduce((a, d) => a + d.paidPaise, 0);
    const open = mine.filter((d) => d.status !== "PAID" && d.netPaise > d.paidPaise);
    const overduePaise = open.filter((d) => dateToDay(d.dueDate) < today).reduce((a, d) => a + d.netPaise - d.paidPaise, 0);
    const next = open.map((d) => dateToDay(d.dueDate)).sort()[0] ?? null;
    return { studentMembershipId: p.id, name: p.user.preferredName ?? p.user.name, studentCode: p.studentCode, className: p.enrollments[0]?.class.name ?? null, gradeLevel: p.gradeLevel, netPaise, paidPaise, outstandingPaise: Math.max(0, netPaise - paidPaise), overduePaise, nextDueKey: next, hasPlan: planned.has(p.id) };
  });
  const status = filter.status ?? "all";
  if (status === "open") rows = rows.filter((r) => r.outstandingPaise > 0);
  if (status === "overdue") rows = rows.filter((r) => r.overduePaise > 0);
  if (status === "paid") rows = rows.filter((r) => r.hasPlan && r.outstandingPaise === 0);
  const total = rows.length;
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, year: { id: year.id, name: year.name }, todayKey: today, classes };
}

/* -------------------------------------------------------------------------- */
/* Exports                                                                     */
/* -------------------------------------------------------------------------- */

export type CsvExport = { filename: string; csv: string };

/** Every PAID/REVERSED/REFUNDED payment between two days, one row each — the day's collection register. */
export async function collectionsExport(ctx: ActiveContext, range: { fromKey: string; toKey: string }): Promise<CsvExport> {
  const caller = requireFeesOffice(ctx);
  const from = dayToDate(range.fromKey);
  const to = new Date(dayToDate(range.toKey).getTime() + 86_400_000);
  if (to.getTime() - from.getTime() > 400 * 86_400_000) throw new AccessError("fees.refuseDate");
  const rows = await db.feePayment.findMany({
    where: { schoolId: caller.schoolId, status: { in: ["PAID", "REVERSED", "REFUNDED"] }, paidAt: { gte: from, lt: to } },
    orderBy: { paidAt: "asc" },
    include: { student: { select: { studentCode: true, gradeLevel: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } }, receipt: { select: { serial: true } }, collectedBy: { select: { name: true } }, refunds: { where: { status: "DONE" }, select: { amountPaise: true } } },
  });
  const csv = toCsv(
    rows.map((p) => ({
      date: p.paidAt ? dateToDay(p.paidAt) : "",
      receipt: p.receipt?.serial ?? "",
      pupil: p.student.user.preferredName ?? p.student.user.name,
      code: p.student.studentCode ?? "",
      class: p.student.enrollments[0]?.class.name ?? "",
      grade: p.student.gradeLevel ?? "",
      method: p.method,
      reference: p.reference ?? "",
      amount: (p.amountPaise / 100).toFixed(2),
      status: p.status,
      refunded: (p.refunds.reduce((a, r) => a + r.amountPaise, 0) / 100).toFixed(2),
      collectedBy: p.collectedBy?.name ?? "",
      note: p.note ?? "",
    })),
    ["date", "receipt", "pupil", "code", "class", "grade", "method", "reference", "amount", "status", "refunded", "collectedBy", "note"],
  );
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.exportCollections", targetType: "School", targetId: caller.schoolId, meta: { fromKey: range.fromKey, toKey: range.toKey, rows: rows.length } });
  return { filename: `fees-collections-${range.fromKey}-to-${range.toKey}.csv`, csv };
}

/** Everyone with something outstanding this year, with ageing — the defaulter list. */
export async function outstandingExport(ctx: ActiveContext): Promise<CsvExport> {
  const caller = requireFeesOffice(ctx);
  const list = await duesList(ctx, { status: "open", pageSize: 200, page: 1 });
  // duesList pages; pull every page for the file.
  const all = [...list.rows];
  for (let page = 2; (page - 1) * list.pageSize < list.total; page++) all.push(...(await duesList(ctx, { status: "open", pageSize: 200, page })).rows);
  const csv = toCsv(
    all.map((r) => ({ pupil: r.name, code: r.studentCode ?? "", class: r.className ?? "", grade: r.gradeLevel ?? "", due: (r.netPaise / 100).toFixed(2), paid: (r.paidPaise / 100).toFixed(2), outstanding: (r.outstandingPaise / 100).toFixed(2), overdue: (r.overduePaise / 100).toFixed(2), nextDue: r.nextDueKey ?? "" })),
    ["pupil", "code", "class", "grade", "due", "paid", "outstanding", "overdue", "nextDue"],
  );
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.exportOutstanding", targetType: "School", targetId: caller.schoolId, meta: { rows: all.length } });
  return { filename: `fees-outstanding-${list.todayKey}.csv`, csv };
}

/* -------------------------------------------------------------------------- */
/* Reminders                                                                   */
/* -------------------------------------------------------------------------- */

type Bucket = { key: "D-7" | "D0" | "D+7" | "D+30"; titleKey: "notifTitle.feeDueSoon" | "notifTitle.feeDueToday" | "notifTitle.feeOverdue"; bodyKey: "notifBody.feeDueSoon" | "notifBody.feeDueToday" | "notifBody.feeOverdue" };
const BUCKETS: { offsetDays: number; bucket: Bucket }[] = [
  { offsetDays: 7, bucket: { key: "D-7", titleKey: "notifTitle.feeDueSoon", bodyKey: "notifBody.feeDueSoon" } },
  { offsetDays: 0, bucket: { key: "D0", titleKey: "notifTitle.feeDueToday", bodyKey: "notifBody.feeDueToday" } },
  { offsetDays: -7, bucket: { key: "D+7", titleKey: "notifTitle.feeOverdue", bodyKey: "notifBody.feeOverdue" } },
  { offsetDays: -30, bucket: { key: "D+30", titleKey: "notifTitle.feeOverdue", bodyKey: "notifBody.feeOverdue" } },
];

async function remindDemand(schoolId: string, d: { id: string; studentMembershipId: string; label: string; dueDate: Date; netPaise: number; paidPaise: number }, bucket: Bucket, stamp: string): Promise<void> {
  const dueKey = dateToDay(d.dueDate);
  await notifyGuardians(d.studentMembershipId, (childName) => ({
    schoolId,
    kind: "FEES",
    titleKey: bucket.titleKey,
    titleVars: { name: childName },
    bodyKey: bucket.bodyKey,
    bodyVars: { amount: rupees(d.netPaise - d.paidPaise), date: dueKey, label: d.label },
    url: "/parent/fees",
    meta: { demandId: d.id, bucket: bucket.key },
    text: { templateKey: bucket.key === "D-7" || bucket.key === "D0" ? "feeDueSoon" : "feeOverdue", vars: { child: childName, amount: rupees(d.netPaise - d.paidPaise), date: dueKey }, purpose: bucket.key === "D-7" || bucket.key === "D0" ? "fees:dueSoon" : "fees:overdue" },
  }));
  await db.feeDemand.update({ where: { id: d.id }, data: { lastReminderKey: `${bucket.key}:${stamp}` } });
}

/**
 * The daily job. In each school's own zone: a week before the due day, on
 * it, a week after and a month after — each bucket once per demand, which
 * `lastReminderKey` remembers, so a job run twice in a day sends nothing new.
 */
export async function sendFeeReminders(now: Date = new Date()): Promise<{ sent: number; perSchool: Record<string, { reminders: number }> }> {
  const schools = await db.school.findMany({ where: { removedAt: null }, select: { id: true, timezone: true } });
  const perSchool: Record<string, { reminders: number }> = {};
  let sent = 0;
  for (const school of schools) {
    const today = todayKey(school.timezone, now);
    await forSchool(school.id, async () => {
      for (const { offsetDays, bucket } of BUCKETS) {
        const dueKey = addDaysToKey(today, offsetDays);
        const due = await db.feeDemand.findMany({
          // `OR null` spelled out: `NOT LIKE` on a NULL column is NULL, not
          // true, so a demand never reminded would otherwise be skipped.
          where: { schoolId: school.id, status: { in: ["OPEN", "PART"] }, dueDate: dayToDate(dueKey), OR: [{ lastReminderKey: null }, { NOT: { lastReminderKey: { startsWith: `${bucket.key}:` } } }] },
          select: { id: true, studentMembershipId: true, label: true, dueDate: true, netPaise: true, paidPaise: true },
          take: 2000,
        });
        for (const d of due) {
          if (d.netPaise - d.paidPaise <= 0) continue;
          await remindDemand(school.id, d, bucket, today);
          sent += 1;
          (perSchool[school.id] ??= { reminders: 0 }).reminders += 1;
        }
      }
    });
  }
  return { sent, perSchool };
}

/** The office's button: everyone overdue now (or the pupils named), whatever the buckets say. */
export async function remindNow(ctx: ActiveContext, input: { studentMembershipIds?: string[] } = {}): Promise<{ families: number; demands: number }> {
  const caller = requireFeesOffice(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const year = await currentAcademicYear(caller.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  const demands = await db.feeDemand.findMany({
    where: { schoolId: caller.schoolId, academicYearId: year.id, status: { in: ["OPEN", "PART"] }, dueDate: { lt: dayToDate(today) }, ...(input.studentMembershipIds?.length ? { studentMembershipId: { in: input.studentMembershipIds } } : {}) },
    select: { id: true, studentMembershipId: true, label: true, dueDate: true, netPaise: true, paidPaise: true },
    take: 5000,
  });
  // One notice per pupil, about their oldest overdue instalment, so a family
  // three terms behind reads one line and not three.
  const oldest = new Map<string, (typeof demands)[number]>();
  for (const d of demands) {
    const cur = oldest.get(d.studentMembershipId);
    if (!cur || d.dueDate < cur.dueDate) oldest.set(d.studentMembershipId, d);
  }
  const bucket: Bucket = { key: "D+7", titleKey: "notifTitle.feeOverdue", bodyKey: "notifBody.feeOverdue" };
  for (const d of oldest.values()) await remindDemand(caller.schoolId, d, bucket, `${today}:manual`);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.remindNow", targetType: "School", targetId: caller.schoolId, meta: { families: oldest.size, demands: demands.length } });
  return { families: oldest.size, demands: demands.length };
}

/* -------------------------------------------------------------------------- */
/* Year end                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * What is still owed from one year becomes an opening balance in the next,
 * due on the new year's first day; the old demands are marked CARRIED and
 * point at it, so the old year's outstanding drops to zero and nothing is
 * counted twice. Runs once per pupil per pair of years: a second run finds
 * nothing OPEN in the old year.
 */
export async function carryForward(ctx: ActiveContext, input: { fromYearId: string; toYearId: string }): Promise<{ pupils: number; carriedPaise: number }> {
  const caller = requireFeesOffice(ctx);
  if (input.fromYearId === input.toYearId) throw new AccessError("fees.refuseYearSame");
  // The label is stored text a family reads for a year, so it is written in
  // the school's own language at the moment it is made.
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { locale: true } });
  const t = translator(normaliseLocale(school.locale));
  const [from, to] = await Promise.all([
    db.academicYear.findFirst({ where: { id: input.fromYearId, schoolId: caller.schoolId }, select: { id: true, name: true, startDate: true } }),
    db.academicYear.findFirst({ where: { id: input.toYearId, schoolId: caller.schoolId }, select: { id: true, name: true, startDate: true } }),
  ]);
  if (!from || !to) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (to.startDate <= from.startDate) throw new AccessError("fees.refuseYearOrder");
  const open = await db.feeDemand.findMany({ where: { schoolId: caller.schoolId, academicYearId: from.id, status: { in: ["OPEN", "PART"] } }, select: { id: true, studentMembershipId: true, label: true, netPaise: true, paidPaise: true, linesJson: true } });
  const byPupil = new Map<string, typeof open>();
  for (const d of open) {
    if (d.netPaise - d.paidPaise <= 0) continue;
    const list = byPupil.get(d.studentMembershipId) ?? [];
    list.push(d);
    byPupil.set(d.studentMembershipId, list);
  }
  let carriedPaise = 0;
  const dueDate = dayToDate(to.startDate.toISOString().slice(0, 10));
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    for (const [studentMembershipId, list] of byPupil) {
      const amount = list.reduce((a, d) => a + d.netPaise - d.paidPaise, 0);
      const created = await tx.feeDemand.create({
        data: {
          schoolId: caller.schoolId,
          studentMembershipId,
          academicYearId: to.id,
          instalmentId: null,
          label: [t("fees.openingBalance"), from.name].join(" "),
          dueDate,
          grossPaise: amount,
          concessionPaise: 0,
          netPaise: amount,
          status: "OPEN",
          linesJson: writeJson(list.map((d) => ({ headId: d.id, code: "OB", name: [from.name, d.label].join(" · "), grossPaise: d.netPaise - d.paidPaise, concessionPaise: 0 }))),
        },
        select: { id: true },
      });
      await tx.feeDemand.updateMany({ where: { id: { in: list.map((d) => d.id) } }, data: { status: "CARRIED", carriedToDemandId: created.id } });
      carriedPaise += amount;
    }
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.carryForward", targetType: "AcademicYear", targetId: to.id, meta: { fromYearId: from.id, pupils: byPupil.size, carriedPaise } });
  return { pupils: byPupil.size, carriedPaise };
}
