import "server-only";
import { db } from "./db";
import { toCsv } from "./csv";
import { dateToDay } from "./fees";
import { currentAcademicYear } from "./academic-year";
import { claimReceivable } from "./college-fees";
import { ageingBucket } from "./scholarships";
import { collegeDesk, MONEY_READ, nameOf, rupeesCell, yearKeyOf } from "./college-office";
import { todayKey } from "./dates";
import type { ActiveContext } from "./session";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * THE ACCOUNTS DESK'S READS (4 October 2026; role ACCOUNTS, the office and
 * the principal): collection against demand by programme and term, the
 * defaulters, the scholarship receivable by age, income and expense by head,
 * the auditor's schedules as sheets, and the three-year finance table the
 * AICTE disclosure, NAAC criterion 4 and NIRF ask for.
 *
 * EVERYTHING HERE IS WORKED OUT ON READ from the ledger (FeeDemand,
 * FeePayment), the scholarship claims, the payroll runs and the purchase
 * records; nothing is stored, so there is nothing for data:audit to check.
 * The money itself is the college's, in its own bank (decision 0003): these
 * are the books, not the till.
 *
 * `financeTable(schoolId, years)` is the function the IQAC builder reads.
 */

type Year = { id: string; name: string; startDate: Date; endDate: Date };

const outstanding = (d: { status: string; netPaise: number; paidPaise: number }) => (d.status === "OPEN" || d.status === "PART" ? Math.max(0, d.netPaise - d.paidPaise) : 0);

export async function accountsOverview(ctx: ActiveContext) {
  const d = await collegeDesk(ctx, MONEY_READ);
  const year = await currentAcademicYear(d.schoolId);
  const today = todayKey((await db.school.findUniqueOrThrow({ where: { id: d.schoolId }, select: { timezone: true } })).timezone);
  const now = new Date();
  const empty = { year: null, collection: [], defaulters: [], receivableAgeing: [], incomeExpense: { feesCollectedPaise: 0, scholarshipsDisbursedPaise: 0, purchasesPaise: 0, payrollGrossPaise: 0 }, pendingConcessions: 0 };
  if (!year) return empty;
  const [demands, enrolments, claims, pending] = await Promise.all([
    db.feeDemand.findMany({ where: { schoolId: d.schoolId, academicYearId: year.id, status: { notIn: ["CANCELLED", "CARRIED"] } }, select: { studentMembershipId: true, label: true, dueDate: true, status: true, netPaise: true, paidPaise: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } }),
    db.programmeEnrolment.findMany({ where: { schoolId: d.schoolId, status: "ACTIVE" }, select: { studentMembershipId: true, programmeId: true } }),
    db.scholarshipClaim.findMany({ where: { schoolId: d.schoolId, status: { in: ["APPLIED", "SANCTIONED"] } }, select: { status: true, expectedPaise: true, sanctionedPaise: true, disbursedPaise: true, appliedAt: true, sanctionedAt: true, createdAt: true } }),
    db.feeConcession.count({ where: { schoolId: d.schoolId, approvalStatus: "PENDING", revokedAt: null } }),
  ]);
  const programmeOf = new Map(enrolments.map((e) => [e.studentMembershipId, e.programmeId]));
  const collection = new Map<string, { programmeId: string | null; term: string; demandPaise: number; collectedPaise: number; outstandingPaise: number }>();
  const overdue = new Map<string, { studentMembershipId: string; name: string; overduePaise: number; oldestDueKey: string }>();
  for (const x of demands) {
    const programmeId = programmeOf.get(x.studentMembershipId) ?? null;
    const key = `${programmeId ?? ""}|${x.label}`;
    const row = collection.get(key) ?? { programmeId, term: x.label, demandPaise: 0, collectedPaise: 0, outstandingPaise: 0 };
    row.demandPaise += x.netPaise;
    row.collectedPaise += x.paidPaise;
    row.outstandingPaise += outstanding(x);
    collection.set(key, row);
    const dueKey = dateToDay(x.dueDate);
    if (outstanding(x) > 0 && dueKey < today) {
      const o = overdue.get(x.studentMembershipId) ?? { studentMembershipId: x.studentMembershipId, name: nameOf(x.student.user), overduePaise: 0, oldestDueKey: dueKey };
      o.overduePaise += outstanding(x);
      if (dueKey < o.oldestDueKey) o.oldestDueKey = dueKey;
      overdue.set(x.studentMembershipId, o);
    }
  }
  const buckets = new Map<string, { claims: number; receivablePaise: number }>();
  for (const c of claims) {
    const from = c.status === "SANCTIONED" ? (c.sanctionedAt ?? c.createdAt) : (c.appliedAt ?? c.createdAt);
    const b = ageingBucket(Math.max(0, Math.floor((now.getTime() - from.getTime()) / 86_400_000)));
    const row = buckets.get(b) ?? { claims: 0, receivablePaise: 0 };
    row.claims += 1;
    row.receivablePaise += claimReceivable(c);
    buckets.set(b, row);
  }
  const ie = await incomeExpense(d.schoolId, year);
  return {
    year: { id: year.id, name: year.name },
    collection: [...collection.values()].sort((a, b) => (a.programmeId ?? "").localeCompare(b.programmeId ?? "") || a.term.localeCompare(b.term)),
    defaulters: [...overdue.values()].sort((a, b) => b.overduePaise - a.overduePaise).slice(0, 200),
    receivableAgeing: (["0_30", "31_90", "91_180", "OVER_180"] as const).map((bucket) => ({ bucket, ...(buckets.get(bucket) ?? { claims: 0, receivablePaise: 0 }) })),
    incomeExpense: { feesCollectedPaise: ie.feesCollectedPaise, scholarshipsDisbursedPaise: ie.scholarshipsDisbursedPaise, purchasesPaise: ie.purchasesPaise, payrollGrossPaise: ie.salariesPaise },
    pendingConcessions: pending,
  };
}

/** The months of an academic year as "YYYY-MM" keys, and its day range. */
function rangeOf(year: Year) {
  const from = dateToDay(year.startDate);
  const to = dateToDay(year.endDate);
  return { from, to, fromMonth: from.slice(0, 7), toMonth: to.slice(0, 7) };
}

/** Income and expense for one year: fees received, the state's disbursements, purchases (and the library's), salaries with the employer's share. */
async function incomeExpense(schoolId: string, year: Year) {
  const r = rangeOf(year);
  const paidIn = { schoolId, status: "PAID", paidAt: { gte: year.startDate, lte: new Date(`${r.to}T23:59:59Z`) } };
  const [paid, refunded, disbursed, purchases, runs, demanded] = await Promise.all([
    db.feePayment.aggregate({ where: paidIn, _sum: { amountPaise: true } }),
    // What went back out of a payment still PAID (part of it refunded; one refunded whole is REFUNDED and already out
    // of the sum): a cancelled seat's refund is such a row since TA-079, and that money is no longer collected.
    db.feeRefund.aggregate({ where: { schoolId, status: "DONE", payment: paidIn }, _sum: { amountPaise: true } }),
    db.scholarshipClaim.aggregate({ where: { schoolId, status: "DISBURSED", academicYear: yearKeyOf(year.startDate) }, _sum: { disbursedPaise: true } }),
    db.purchaseRecord.findMany({ where: { schoolId, dateKey: { gte: r.from, lte: r.to } }, select: { totalPaise: true, location: true } }),
    db.payrollRun.findMany({ where: { schoolId, status: { in: ["LOCKED", "PAID"] }, month: { gte: r.fromMonth, lte: r.toMonth } }, select: { grossPaise: true, employerPaise: true } }),
    db.feeDemand.aggregate({ where: { schoolId, academicYearId: year.id, status: { notIn: ["CANCELLED", "CARRIED"] } }, _sum: { netPaise: true } }),
  ]);
  return {
    feesDemandedPaise: demanded._sum.netPaise ?? 0,
    feesCollectedPaise: (paid._sum.amountPaise ?? 0) - (refunded._sum.amountPaise ?? 0),
    scholarshipsDisbursedPaise: disbursed._sum.disbursedPaise ?? 0,
    purchasesPaise: purchases.reduce((a, p) => a + p.totalPaise, 0),
    // The library's spend: purchases kept at a place whose name says library. The stores name places freely; a library that keeps its books elsewhere reads 0 here.
    libraryPaise: purchases.filter((p) => /librar|ग्रंथालय|पुस्तकालय/i.test(p.location)).reduce((a, p) => a + p.totalPaise, 0),
    salariesPaise: runs.reduce((a, x) => a + x.grossPaise + x.employerPaise, 0),
  };
}

/**
 * THE FINANCE TABLE (AICTE mandatory disclosure, NAAC criterion 4, NIRF's
 * financial resources): the last `years` academic years the college has, newest
 * first — fees demanded and collected, the state's scholarship disbursements,
 * salaries (gross with the employer's PF and ESI), purchases and the
 * library's share of them. For the IQAC builder; plain reads.
 */
export async function financeTable(schoolId: string, years = 3) {
  const rows = await db.academicYear.findMany({ where: { schoolId }, orderBy: { startDate: "desc" }, take: Math.max(1, Math.min(5, years)), select: { id: true, name: true, startDate: true, endDate: true } });
  const out = [];
  for (const y of rows) {
    const ie = await incomeExpense(schoolId, y);
    out.push({ academicYear: yearKeyOf(y.startDate), feesDemandedPaise: ie.feesDemandedPaise, feesCollectedPaise: ie.feesCollectedPaise, scholarshipsDisbursedPaise: ie.scholarshipsDisbursedPaise, salariesPaise: ie.salariesPaise, purchasesPaise: ie.purchasesPaise, libraryPaise: ie.libraryPaise });
  }
  return { years: out };
}

/** The three-year finance table, for the desk and for the IQAC that files it (NAAC criterion 4, the AICTE disclosure; campaign W-8): totals only, no student. */
export async function financeTableFor(ctx: ActiveContext, years = 3) {
  const d = await collegeDesk(ctx, [...MONEY_READ, "IQAC"]);
  return financeTable(d.schoolId, years);
}

/**
 * THE AUDITOR'S SCHEDULES as sheets: collection against demand, the
 * defaulters, the scholarship receivable by age, income and expense, the
 * finance table. Headings in the college's own language.
 */
export async function accountsReport(ctx: ActiveContext, report: "collection" | "defaulters" | "receivable" | "income-expense" | "finance-table", t: Translate): Promise<{ filename: string; csv: string }> {
  const d = await collegeDesk(ctx, MONEY_READ);
  const H = (k: string) => t(`collegeOffice.sheet${k}` as TranslationKey);
  if (report === "finance-table") {
    const f = await financeTable(d.schoolId, 3);
    const headers = [H("Year"), H("Demanded"), H("Collected"), H("Scholarships"), H("Salaries"), H("Purchases"), H("Library")];
    return { filename: "finance-table.csv", csv: toCsv(f.years.map((y) => ({ [headers[0]!]: y.academicYear, [headers[1]!]: rupeesCell(y.feesDemandedPaise), [headers[2]!]: rupeesCell(y.feesCollectedPaise), [headers[3]!]: rupeesCell(y.scholarshipsDisbursedPaise), [headers[4]!]: rupeesCell(y.salariesPaise), [headers[5]!]: rupeesCell(y.purchasesPaise), [headers[6]!]: rupeesCell(y.libraryPaise) })), headers) };
  }
  const o = await accountsOverview(ctx);
  const programmes = new Map((await db.programme.findMany({ where: { schoolId: d.schoolId }, select: { id: true, code: true } })).map((p) => [p.id, p.code]));
  if (report === "collection") {
    const headers = [H("Programme"), H("Term"), H("Demand"), H("Collected"), H("Outstanding")];
    return { filename: "collection-against-demand.csv", csv: toCsv(o.collection.map((r) => ({ [headers[0]!]: r.programmeId ? (programmes.get(r.programmeId) ?? "") : "", [headers[1]!]: r.term, [headers[2]!]: rupeesCell(r.demandPaise), [headers[3]!]: rupeesCell(r.collectedPaise), [headers[4]!]: rupeesCell(r.outstandingPaise) })), headers) };
  }
  if (report === "defaulters") {
    const headers = [H("Name"), H("Overdue"), H("OldestDue")];
    return { filename: "defaulters.csv", csv: toCsv(o.defaulters.map((r) => ({ [headers[0]!]: r.name, [headers[1]!]: rupeesCell(r.overduePaise), [headers[2]!]: r.oldestDueKey })), headers) };
  }
  if (report === "receivable") {
    const headers = [H("Bucket"), H("Claims"), H("Receivable")];
    return { filename: "scholarship-receivable-ageing.csv", csv: toCsv(o.receivableAgeing.map((r) => ({ [headers[0]!]: t(`collegeOffice.ageing${r.bucket}` as TranslationKey), [headers[1]!]: r.claims, [headers[2]!]: rupeesCell(r.receivablePaise) })), headers) };
  }
  const headers = [H("Head"), H("Amount")];
  const ie = o.incomeExpense;
  return {
    filename: "income-expense.csv",
    csv: toCsv(
      [
        { [headers[0]!]: H("Collected"), [headers[1]!]: rupeesCell(ie.feesCollectedPaise) },
        { [headers[0]!]: H("Scholarships"), [headers[1]!]: rupeesCell(ie.scholarshipsDisbursedPaise) },
        { [headers[0]!]: H("Purchases"), [headers[1]!]: rupeesCell(ie.purchasesPaise) },
        { [headers[0]!]: H("Salaries"), [headers[1]!]: rupeesCell(ie.payrollGrossPaise) },
      ],
      headers,
    ),
  };
}
