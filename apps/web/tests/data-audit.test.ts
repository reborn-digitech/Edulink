/**
 * The data-flow audit: every derived value the app shows or stores, recomputed
 * from the rows it comes from, against what the API answers and what the
 * tables hold. Runs only when asked — `npm run data:audit` — against the demo
 * schools and ZZ Northgate (or DATA_AUDIT_SCHOOLS=slug,slug), because it reads
 * a populated database rather than planting its own rows.
 *
 * Two kinds of check:
 *   STORED   — a denormalised copy (paidPaise, the report card's totals, the
 *              PEN mirror, a sitting's max marks) against its source rows.
 *   ON-READ  — an API answer (dues, coverage, readiness, the parent's
 *              attendance) against the same figure computed here from raw rows.
 *
 * A FAIL is a contradiction the code should never produce. A WARN is drift a
 * later edit can cause by design (a stale snapshot, a copy nobody refreshes),
 * or a population gap worth knowing about. Both land in the report the run
 * writes to docs/data-audit/latest.md; only FAILs fail the suite.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { bandFor, meanPercent, meanPoints, shownPercent } from "@/lib/report-card-rules";
import { REQUIRED_RECORD_FIELDS } from "@/lib/certificate-rules";
import { FILING_RECORD_FIELDS } from "@/lib/pupil-records";
import { PUPIL_CATEGORIES, eResourceNameKey } from "@edulink/contracts"; // eResourceNameKey: qb-C
import { todayKey } from "@/lib/dates";
import { HOLIDAY_KIND_META } from "@/lib/holiday-kinds";
import { GET as recordsGet } from "@/app/api/v1/office/pupil-records/route";
import { GET as filingsGet } from "@/app/api/v1/office/filings/route";
import { GET as duesGet } from "@/app/api/v1/fees/dues/route";
import { GET as feeOverviewGet } from "@/app/api/v1/fees/overview/route";
import { GET as ledgerGet } from "@/app/api/v1/fees/pupils/[studentMembershipId]/route";
import { GET as familyAttendanceGet } from "@/app/api/v1/family/attendance/route";
import { GET as coverageGet } from "@/app/api/v1/office/syllabus/coverage/route";
import { GET as familyCardsGet } from "@/app/api/v1/family/report-cards/route";
import { GET as boardGet } from "@/app/api/v1/office/substitutions/route";
import { GET as adminOverviewGet } from "@/app/api/v1/admin/overview/route";
import { GET as principalOverviewGet } from "@/app/api/v1/staff/principal/overview/route";
import { GET as cyclesGet } from "@/app/api/v1/office/admissions/cycles/route";
import { GET as circularsGet } from "@/app/api/v1/office/circulars/route";
import { GET as staffMonthGet } from "@/app/api/v1/office/staff-attendance/month/route";
import { computeUsage, loadStoredSizes, monthKeyFor } from "@/lib/plans";
import { AUTHORED_IN_THE_APP, CONTENT_TEAM_SOURCE_BEFORE_RENAME } from "@/lib/bank-source";
import { corpusChapters, titleVerdict } from "../scripts/topic-titles"; // owner-batch-item6
import { translatedNameFor } from "../scripts/quiz-queue-load"; // qb-A
import { unitNameRefusal } from "@/lib/college-syllabi"; // qb-A
import { admittedWithoutPayment } from "./data-audit-admission-fee";
import { keepsOneTruth } from "../scripts/zz-expert-standing"; // TA-583

const RUN = process.env.DATA_AUDIT === "1";
const d = RUN ? describe : describe.skip;
const db = new PrismaClient();

type Finding = { check: string; level: "FAIL" | "WARN" | "INFO"; school: string; detail: string };
const findings: Finding[] = [];
const note = (check: string, level: Finding["level"], school: string, detail: string) => findings.push({ check, level, school, detail });
const failsOf = (check: string) => findings.filter((f) => f.check === check && f.level === "FAIL").map((f) => `${f.school}: ${f.detail}`);

/**
 * THE SCOPE (S4B-3, 5 Oct 2026). Some checks also read fixture colleges the
 * default set (the demo schools and ZZ Northgate) does not name — ZZ Vidya and
 * ZZ Shastri, every ZZ college for the PRN — because the default set keeps
 * none of what they check. DATA_AUDIT_SCHOOLS names a run's scope exactly:
 * when it is set, those checks read the named schools and nothing else (a
 * lifecycle walk scoped to its own college used to report ZZ Shastri's
 * fixture SAR among its WARNs). The last check below holds it.
 */
const SCOPE = process.env.DATA_AUDIT_SCHOOLS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
async function alsoReading(slugs: string[]): Promise<{ id: string; name: string }[]> {
  const base = schools.map((s) => ({ id: s.id, name: s.name }));
  if (SCOPE.length) return base;
  const extra = await db.school.findMany({ where: { slug: { in: slugs } }, select: { id: true, name: true } });
  return [...base, ...extra.filter((e) => !base.some((b) => b.id === e.id))];
}

type School = { id: string; name: string; slug: string; timezone: string; reportCardConfig: string | null; staffCheckInMinute: number; staffLateGraceMinutes: number; teachingDays: string };
let schools: School[] = [];
const actors = new Map<string, { admin: string | null; principal: string | null; parent: { userId: string; childId: string } | null }>();

const get = (path: string) => new Request(`http://localhost${path}`);
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
/** The audit's own sign-ins carry this user agent (DS-14, 10 Oct 2026), so the run can delete exactly the sessions it made and no one else's. */
const AUDIT_USER_AGENT = "data-audit";
async function as(userId: string, schoolId: string | null, role: "ADMIN" | "PRINCIPAL" | "PARENT") {
  __resetCookies();
  __setHeaders({ "user-agent": AUDIT_USER_AGENT });
  await createSession(userId, { schoolId, role });
}
async function json<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(`${res.status}: ${text.slice(0, 200)}`); }
}
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const blank = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
const minuteInZone = (instant: Date, tz: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(instant);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
};

beforeAll(async () => {
  if (!RUN) return;
  const slugs = process.env.DATA_AUDIT_SCHOOLS?.split(",").map((s) => s.trim()).filter(Boolean);
  const where = slugs?.length ? { slug: { in: slugs } } : { OR: [{ contactEmail: { endsWith: "@demo.relay.test" } }, { slug: "zz-northgate-school" }] };
  schools = await db.school.findMany({ where, select: { id: true, name: true, slug: true, timezone: true, reportCardConfig: true, staffCheckInMinute: true, staffLateGraceMinutes: true, teachingDays: true }, orderBy: { name: "asc" } });
  for (const s of schools) {
    const admin = await db.membership.findFirst({ where: { schoolId: s.id, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true }, orderBy: { joinedAt: "asc" } });
    const principal = await db.membership.findFirst({ where: { schoolId: s.id, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, select: { userId: true }, orderBy: { joinedAt: "asc" } });
    const g = await db.guardianship.findFirst({ where: { studentSchoolId: s.id, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } }, select: { parentUserId: true, studentMembershipId: true }, orderBy: { createdAt: "asc" } });
    actors.set(s.id, { admin: admin?.userId ?? null, principal: principal?.userId ?? null, parent: g ? { userId: g.parentUserId, childId: g.studentMembershipId } : null });
  }
});

afterAll(async () => {
  if (RUN) {
    // Every session this run minted (DS-14): the actors' rows under the audit's own user agent. Before, the sessions were
    // minted with no user agent and the clean-up looked for "vitest", so each run left about 96 rows on the demo accounts.
    __setHeaders({});
    for (const a of actors.values()) await db.session.deleteMany({ where: { userId: { in: [a.admin, a.principal, a.parent?.userId].filter((x): x is string => !!x) }, userAgent: { in: ["", "vitest", AUDIT_USER_AGENT] } } });
    const dir = resolve(__dirname, "../../../docs/data-audit");
    mkdirSync(dir, { recursive: true });
    const by = (level: Finding["level"]) => findings.filter((f) => f.level === level);
    const lines = [
      "# Data-flow audit — latest run",
      "",
      `Run: ${new Date().toISOString()} · schools: ${schools.map((s) => s.name).join(", ")} · ${by("FAIL").length} FAIL · ${by("WARN").length} WARN · ${by("INFO").length} INFO`,
      "",
      "Regenerate with `npm run data:audit` from apps/web. FAIL = a contradiction the code should never produce; WARN = drift a later edit causes by design, or a population gap; INFO = a figure worth reading.",
      "",
    ];
    for (const level of ["FAIL", "WARN", "INFO"] as const) {
      const rows = by(level);
      if (!rows.length) continue;
      lines.push(`## ${level} (${rows.length})`, "", "| check | school | detail |", "|---|---|---|");
      for (const f of rows) lines.push(`| ${f.check} | ${f.school} | ${f.detail.replace(/\|/g, "\\|")} |`);
      lines.push("");
    }
    writeFileSync(resolve(dir, "latest.md"), lines.join("\n"));
  }
  __resetCookies();
  await db.$disconnect();
});

d("STORED copies against their source rows", () => {
  it("pen-mirror: the record's PEN never contradicts the account's", async () => {
    for (const s of schools) {
      const rows = await db.pupilRecord.findMany({ where: { schoolId: s.id }, select: { penNumber: true, student: { select: { id: true, leftAt: true, user: { select: { penNumber: true } } } } } });
      let lag = 0;
      for (const r of rows) {
        const account = r.student.user.penNumber;
        if (r.penNumber && account && r.penNumber !== account) note("pen-mirror", "FAIL", s.name, `record ${r.student.id} holds ${r.penNumber} but the account holds ${account}`);
        else if (!r.penNumber && account && !r.student.leftAt) lag += 1;
      }
      if (lag) note("pen-mirror", "WARN", s.name, `${lag} record(s) have no PEN while the account does — the view merges them, but officeRecords and the filing count read the raw record`);
      const noRecord = await db.membership.count({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null, user: { penNumber: { not: null } }, pupilRecord: null } });
      if (noRecord) note("pen-mirror", "WARN", s.name, `${noRecord} pupil(s) carry a PEN on the account but have no PupilRecord — a certificate prints "—" for them`);
    }
    expect(failsOf("pen-mirror")).toEqual([]);
  });

  it("gig-earnings: a question in the bank has one earning and a bank row, a payment is the sum of what it settles, and no month is over its limits", async () => {
    // The platform's own, not a school's: gigs carry no school (decision 0004).
    const where = "platform";
    const accepted = await db.questionContribution.findMany({ where: { status: "ACCEPTED" }, select: { id: true, questionId: true, earning: { select: { id: true } } } });
    for (const c of accepted) {
      if (!c.earning) note("gig-earnings", "FAIL", where, `contribution ${c.id} is ACCEPTED with no earning`);
      if (!c.questionId) note("gig-earnings", "FAIL", where, `contribution ${c.id} is ACCEPTED with no question in the bank`);
      else if (!(await db.quizQuestion.findUnique({ where: { id: c.questionId }, select: { id: true } }))) note("gig-earnings", "WARN", where, `contribution ${c.id} was added to the bank as ${c.questionId}, which is no longer there — the payment stands by design`);
    }
    const stray = await db.gigEarning.count({ where: { contribution: { status: { not: "ACCEPTED" } } } });
    if (stray) note("gig-earnings", "FAIL", where, `${stray} earning(s) hang from a contribution that is not in the bank`);
    const wrongBasis = await db.gigEarning.count({ where: { OR: [{ basis: "FREE_BLOCK", amountPaise: { not: 0 } }, { basis: "PAID", amountPaise: { lte: 0 } }] } });
    if (wrongBasis) note("gig-earnings", "FAIL", where, `${wrongBasis} earning(s) whose amount contradicts their basis`);
    const payments = await db.gigPayment.findMany({ select: { id: true, amountPaise: true, userId: true, earnings: { select: { amountPaise: true, userId: true } } } });
    for (const p of payments) {
      const settled = sum(p.earnings.map((e) => e.amountPaise));
      if (settled !== p.amountPaise) note("gig-earnings", "FAIL", where, `payment ${p.id} records ${p.amountPaise} paise but settles ${settled}`);
      if (p.earnings.some((e) => e.userId !== p.userId)) note("gig-earnings", "FAIL", where, `payment ${p.id} settles another person's earning`);
    }
    const settings = await db.gigSettings.findUnique({ where: { id: "gigs" } });
    if (settings) {
      const perTeacher = await db.gigEarning.groupBy({ by: ["userId", "month"], where: { basis: "PAID" }, _count: { _all: true } });
      const over = perTeacher.filter((g) => g._count._all > settings.questionMonthlyCap);
      if (over.length) note("gig-earnings", "WARN", where, `${over.length} teacher-month(s) hold more paid questions than today's limit of ${settings.questionMonthlyCap} — the limit was lowered after they were added, or the lock failed`);
      const perMonth = await db.gigEarning.groupBy({ by: ["month"], _sum: { amountPaise: true } });
      const spent = perMonth.filter((g) => (g._sum.amountPaise ?? 0) > settings.questionMonthlyBudgetPaise);
      if (spent.length) note("gig-earnings", "WARN", where, `${spent.length} month(s) committed more than today's budget of ${settings.questionMonthlyBudgetPaise} paise`);
    }
    note("gig-earnings", "INFO", where, `${accepted.length} contributed question(s) in the bank, ${payments.length} payment(s) recorded`);
    expect(failsOf("gig-earnings")).toEqual([]);
  });

  it("gig-seats: a slot's stored count of seats taken is the number of its seats not cancelled, and never more than it has", async () => {
    // Slots are no school's rows; read across the platform.
    const slots = await db.gigSlot.findMany({ select: { id: true, seats: true, seatsTaken: true, cancelledAt: true, _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } } } });
    for (const s of slots) {
      if (s.seatsTaken !== s._count.bookings) note("gig-seats", "FAIL", "platform", `slot ${s.id} stores ${s.seatsTaken} seat(s) taken but holds ${s._count.bookings} booking(s) not cancelled`);
      if (s.seatsTaken > s.seats) note("gig-seats", "FAIL", "platform", `slot ${s.id} has ${s.seatsTaken} of ${s.seats} seats taken`);
      if (s.cancelledAt && s._count.bookings > 0) note("gig-seats", "FAIL", "platform", `cancelled slot ${s.id} still holds ${s._count.bookings} live seat(s)`);
    }
    const drift = await db.gigBooking.count({ where: { status: "CANCELLED", cancelledAt: null } });
    if (drift) note("gig-seats", "WARN", "platform", `${drift} cancelled seat(s) with no time of cancelling`);
    note("gig-seats", "INFO", "platform", `${slots.length} slot(s) offered`);
    expect(failsOf("gig-seats")).toEqual([]);
  });

  it("mentor-places: an expert's stored count of mentee places is the number of their mentorships holding one (PENDING_CONSENT or ACTIVE)", async () => {
    // TA-532: ExpertProfile.activeMentorships is a stored copy (mentoring.ts claims and gives back each place); its
    // threads are every school's, read across the platform here as the owner, which no school's own binding could.
    const experts = await db.expertProfile.findMany({ select: { id: true, activeMentorships: true, _count: { select: { mentorships: { where: { status: { in: ["PENDING_CONSENT", "ACTIVE"] } } } } } } });
    for (const e of experts) {
      if (e.activeMentorships !== e._count.mentorships) note("mentor-places", "FAIL", "platform", `expert profile ${e.id} stores ${e.activeMentorships} mentee place(s) taken but holds ${e._count.mentorships} mentorship(s) pending or active`);
    }
    note("mentor-places", "INFO", "platform", `${experts.length} expert profile(s)`);
    expect(failsOf("mentor-places")).toEqual([]);
  });

  it("expert-badge: an expert is verified on verifiedAt and on kycStatus, or on neither (the badge's one truth)", async () => {
    // TA-583: the pairing form, the mentor queue and the pupil's list read verifiedAt; the marketplace and the paid
    // gate read kycStatus. The ZZ fixture wrote verifiedAt alone, so zz.expert1 was verified on one and not the other.
    const experts = await db.expertProfile.findMany({ select: { id: true, verifiedAt: true, kycStatus: true } });
    for (const e of experts) {
      if (!keepsOneTruth(e)) note("expert-badge", "FAIL", "platform", `expert profile ${e.id} has verifiedAt ${e.verifiedAt ? "set" : "empty"} but kycStatus ${e.kycStatus}`);
    }
    note("expert-badge", "INFO", "platform", `${experts.length} expert profile(s)`);
    expect(failsOf("expert-badge")).toEqual([]);
  });

  it("gig-money: a seat payment's stored net is gross − commission − GST (zero on a refund); a payout's net and count are its payments'; an invoice's taxable value is its payout's commission", async () => {
    // Razorpay Route (decision 0004, third amendment of 2 October 2026), and the company-collects rows before it: one writer, src/lib/gig-payments.ts, freezes the three figures with the order.
    const payments = await db.sessionPayment.findMany({ select: { id: true, status: true, path: true, transferId: true, amountPaise: true, commissionPaise: true, gstPaise: true, netPaise: true, receiptNumber: true, payoutId: true } });
    for (const p of payments) {
      if (p.status === "INITIATED" || p.status === "FAILED") continue;
      if (p.status === "REFUNDED" && (p.commissionPaise !== 0 || p.gstPaise !== 0 || p.netPaise !== 0)) note("gig-money", "FAIL", "platform", `refunded payment ${p.id} still carries commission ${p.commissionPaise}, GST ${p.gstPaise}, net ${p.netPaise}`);
      if (p.netPaise !== p.amountPaise - p.commissionPaise - p.gstPaise) note("gig-money", "FAIL", "platform", `payment ${p.id}: net ${p.netPaise} ≠ gross ${p.amountPaise} − commission ${p.commissionPaise} − GST ${p.gstPaise}`);
      if (!p.receiptNumber) note("gig-money", "WARN", "platform", `payment ${p.id} is ${p.status} with no receipt number — captured before receipts were numbered`);
      if (p.status === "REFUNDED" && p.payoutId) note("gig-money", "FAIL", "platform", `refunded payment ${p.id} sits in payout ${p.payoutId}`);
      if ((p.status === "DUE" || p.status === "PAID_OUT") && !p.payoutId) note("gig-money", "FAIL", "platform", `payment ${p.id} is ${p.status} with no payout`);
      if (p.status === "RELEASED" && !p.payoutId) note("gig-money", "WARN", "platform", `payment ${p.id} is RELEASED and not yet invoiced — the company's details may be missing`);
      if (p.path === "ROUTE" && (p.status === "HELD" || p.status === "RELEASED") && !p.transferId) note("gig-money", "FAIL", "platform", `payment ${p.id} is ${p.status} on Route with no transfer`);
      if (p.path === "ROUTE" && (p.status === "DUE" || p.status === "PAID_OUT")) note("gig-money", "FAIL", "platform", `payment ${p.id} is on Route but ${p.status}, a company-collects state`);
    }
    const payouts = await db.expertPayout.findMany({ select: { id: true, status: true, netPaise: true, paymentsCount: true, expertUserId: true, payments: { select: { status: true, netPaise: true, expertUserId: true, commissionPaise: true, gstPaise: true } }, invoice: { select: { id: true, taxableValuePaise: true, cgstPaise: true, sgstPaise: true, igstPaise: true, totalPaise: true } } } });
    for (const x of payouts) {
      const live = x.payments.filter((p) => p.status === "DUE" || p.status === "PAID_OUT" || p.status === "RELEASED");
      const net = sum(live.map((p) => p.netPaise));
      if (live.length > 0 && (net !== x.netPaise || live.length !== x.paymentsCount)) note("gig-money", "FAIL", "platform", `payout ${x.id} stores ${x.netPaise} for ${x.paymentsCount} seat(s) but holds ${net} over ${live.length}`);
      if (x.payments.some((p) => p.expertUserId !== x.expertUserId)) note("gig-money", "FAIL", "platform", `payout ${x.id} holds another expert's seat`);
      if (x.status === "PAID" && x.payments.some((p) => p.status !== "PAID_OUT")) note("gig-money", "FAIL", "platform", `payout ${x.id} is PAID with a seat not PAID_OUT`);
      if (x.status === "PAID" && !x.invoice) note("gig-money", "FAIL", "platform", `payout ${x.id} is PAID with no invoice`);
      if (x.status === "RELEASED" && x.payments.some((p) => p.status !== "RELEASED")) note("gig-money", "FAIL", "platform", `payout ${x.id} is RELEASED with a seat not RELEASED`);
      if (x.status === "RELEASED" && !x.invoice) note("gig-money", "FAIL", "platform", `payout ${x.id} is RELEASED with no invoice`);
      if (x.status === "OPEN" && x.invoice) note("gig-money", "FAIL", "platform", `payout ${x.id} is OPEN with invoice ${x.invoice.id}`);
      if (x.invoice && live.length > 0) {
        const commission = sum(live.map((p) => p.commissionPaise));
        const gst = sum(live.map((p) => p.gstPaise));
        const inv = x.invoice;
        if (inv.taxableValuePaise !== commission) note("gig-money", "FAIL", "platform", `invoice ${inv.id}: taxable ${inv.taxableValuePaise} ≠ the payout's commission ${commission}`);
        if (inv.cgstPaise + inv.sgstPaise + inv.igstPaise !== gst) note("gig-money", "FAIL", "platform", `invoice ${inv.id}: tax ${inv.cgstPaise + inv.sgstPaise + inv.igstPaise} ≠ the payout's GST ${gst}`);
        if (inv.totalPaise !== inv.taxableValuePaise + inv.cgstPaise + inv.sgstPaise + inv.igstPaise) note("gig-money", "FAIL", "platform", `invoice ${inv.id}: total ${inv.totalPaise} is not taxable plus tax`);
        if (inv.igstPaise > 0 && (inv.cgstPaise > 0 || inv.sgstPaise > 0)) note("gig-money", "FAIL", "platform", `invoice ${inv.id} carries both IGST and CGST/SGST`);
      }
    }
    const series = await db.gigInvoice.groupBy({ by: ["series"], _count: { _all: true }, _max: { serial: true } });
    for (const g of series) if (g._max.serial !== g._count._all) note("gig-money", "WARN", "platform", `invoice series ${g.series} holds ${g._count._all} invoice(s) but its last serial is ${g._max.serial} — a gap or a reuse`);
    note("gig-money", "INFO", "platform", `${payments.length} seat payment(s), ${payouts.length} payout(s), ${sum(payouts.map((x) => (x.invoice ? 1 : 0)))} invoice(s)`);
    expect(failsOf("gig-money")).toEqual([]);
  });

  it("pen-change: an applied request put its number on the account; a pending one still matches its snapshot", async () => {
    for (const s of schools) {
      const rows = await db.penChangeRequest.findMany({ where: { schoolId: s.id }, select: { id: true, status: true, fromPen: true, toPen: true, student: { select: { user: { select: { penNumber: true } } } } } });
      for (const r of rows) {
        const account = r.student.user.penNumber;
        if (r.status === "APPLIED" && (account ?? null) !== (r.toPen ?? null)) note("pen-change", "FAIL", s.name, `request ${r.id} APPLIED to ${r.toPen} but the account holds ${account}`);
        if (r.status === "PENDING" && (account ?? null) !== (r.fromPen ?? null)) note("pen-change", "WARN", s.name, `request ${r.id} PENDING from ${r.fromPen} but the account now holds ${account}`);
      }
    }
    expect(failsOf("pen-change")).toEqual([]);
  });

  it("fee-demand: paidPaise is the sum of settled allocations, status follows it, net = gross − concession", async () => {
    for (const s of schools) {
      const demands = await db.feeDemand.findMany({ where: { schoolId: s.id }, select: { id: true, label: true, grossPaise: true, concessionPaise: true, netPaise: true, paidPaise: true, status: true, instalmentId: true, allocations: { select: { amountPaise: true, payment: { select: { status: true } } } }, instalment: { select: { lines: { select: { amountPaise: true } } } } } });
      let stale = 0;
      for (const x of demands) {
        if (x.netPaise !== x.grossPaise - x.concessionPaise) note("fee-demand", "FAIL", s.name, `${x.label} ${x.id}: net ${x.netPaise} ≠ gross ${x.grossPaise} − concession ${x.concessionPaise}`);
        if (["WAIVED", "CANCELLED", "CARRIED"].includes(x.status)) continue;
        const paid = sum(x.allocations.filter((a) => a.payment.status === "PAID" || a.payment.status === "REFUNDED").map((a) => a.amountPaise));
        if (paid !== x.paidPaise) note("fee-demand", "FAIL", s.name, `${x.label} ${x.id}: paidPaise ${x.paidPaise} but settled allocations sum to ${paid}`);
        const expected = paid >= x.netPaise ? "PAID" : paid > 0 ? "PART" : "OPEN";
        if (x.status !== expected) note("fee-demand", "FAIL", s.name, `${x.label} ${x.id}: status ${x.status}, expected ${expected} (paid ${paid} of ${x.netPaise})`);
        if (x.instalment && x.status === "OPEN" && x.paidPaise === 0 && x.concessionPaise === 0) {
          const lines = sum(x.instalment.lines.map((l) => l.amountPaise));
          if (lines !== x.grossPaise) stale += 1;
        }
      }
      if (stale) note("fee-demand", "WARN", s.name, `${stale} untouched demand(s) no longer match their instalment's lines — the structure changed after generation and the plans were not regenerated`);
    }
    expect(failsOf("fee-demand")).toEqual([]);
  });

  it("fee-payment: a paid payment is fully allocated (less settled refunds), has a receipt, and receipt serials do not collide", async () => {
    for (const s of schools) {
      const payments = await db.feePayment.findMany({ where: { schoolId: s.id }, select: { id: true, status: true, method: true, amountPaise: true, reversedAt: true, allocations: { select: { amountPaise: true } }, refunds: { select: { amountPaise: true, status: true } }, receipt: { select: { id: true } } } });
      for (const p of payments) {
        const alloc = sum(p.allocations.map((a) => a.amountPaise));
        const refunded = sum(p.refunds.filter((r) => r.status === "DONE").map((r) => r.amountPaise));
        if (p.status === "PAID" || p.status === "REFUNDED") {
          if (alloc + refunded !== p.amountPaise) note("fee-payment", "FAIL", s.name, `payment ${p.id} ${p.status}: allocations ${alloc} + refunds ${refunded} ≠ amount ${p.amountPaise}`);
          if (!p.receipt) note("fee-payment", "WARN", s.name, `payment ${p.id} (${p.method}) is ${p.status} with no receipt`);
        } else if (p.status === "REVERSED") {
          // A reversal keeps its allocation rows by design (reversePayment: the trail stays, the demands are recomputed
          // from PAID payments only), so they are not drift (QA-40). Drift is a reversal with no stamp, or one holding
          // more than the payment was.
          if (!p.reversedAt) note("fee-payment", "WARN", s.name, `payment ${p.id} is REVERSED with no reversedAt`);
          if (alloc > p.amountPaise) note("fee-payment", "FAIL", s.name, `payment ${p.id} REVERSED: allocations ${alloc} exceed amount ${p.amountPaise}`);
        } else if (alloc > 0) note("fee-payment", "WARN", s.name, `payment ${p.id} is ${p.status} yet still holds ${alloc} in allocations`);
      }
      const years = await db.academicYear.findMany({ where: { schoolId: s.id }, select: { id: true, name: true, feeReceiptNext: true, feeReceipts: { select: { number: true, serial: true } } } });
      for (const y of years) {
        const max = Math.max(0, ...y.feeReceipts.map((r) => r.number));
        if (y.feeReceipts.length && y.feeReceiptNext <= max) note("fee-payment", "FAIL", s.name, `year ${y.name}: feeReceiptNext ${y.feeReceiptNext} ≤ highest receipt number ${max}`);
        const serials = new Set(y.feeReceipts.map((r) => r.serial));
        if (serials.size !== y.feeReceipts.length) note("fee-payment", "FAIL", s.name, `year ${y.name}: duplicate receipt serials`);
      }
    }
    expect(failsOf("fee-payment")).toEqual([]);
  });

  it("report-card: overall, letter and grade points agree with the subjects snapshot; item letters with the card's own scale", async () => {
    for (const s of schools) {
      const cards = await db.reportCard.findMany({ where: { schoolId: s.id }, select: { id: true, title: true, status: true, overallPercentMilli: true, overallLetter: true, gradePointsMilli: true, gradingMethod: true, subjects: true, scale: true, items: { select: { kind: true, title: true, scoreMilli: true, pointsMilli: true, letter: true } } } });
      let legacy = 0;
      for (const c of cards) {
        if (!c.subjects || !c.scale) { legacy += 1; continue; }
        const subjects = JSON.parse(c.subjects) as { subject: string; percent: number | null; letter: string | null; points: number | null }[];
        const bands = (JSON.parse(c.scale) as { bands: { label: string; minPercent: number; points: number | null; descriptor: string | null }[] }).bands;
        if (c.gradingMethod === "weighted") {
          // Every percent on a card is rounded once to what is shown, and the letter read from that (report-card-rules.ts shownPercent).
          const mean = shownPercent(meanPercent(subjects));
          const milli = mean === null ? null : Math.round(mean * 1000);
          if (milli !== c.overallPercentMilli) note("report-card", "FAIL", s.name, `card ${c.id} "${c.title}": overall ${c.overallPercentMilli} but the mean of its subjects is ${milli}`);
        }
        const band = bandFor(c.overallPercentMilli === null ? null : c.overallPercentMilli / 1000, bands);
        if ((band?.label ?? null) !== (c.overallLetter ?? null)) note("report-card", "FAIL", s.name, `card ${c.id}: letter ${c.overallLetter} but the scale gives ${band?.label ?? null}`);
        const points = meanPoints(subjects);
        const pointsMilli = points === null ? null : Math.round(points * 1000);
        if (pointsMilli !== c.gradePointsMilli) note("report-card", "FAIL", s.name, `card ${c.id}: grade points ${c.gradePointsMilli} but the subjects give ${pointsMilli}`);
        for (const sub of subjects) {
          const b = bandFor(sub.percent, bands);
          if ((b?.label ?? null) !== (sub.letter ?? null)) note("report-card", "FAIL", s.name, `card ${c.id} ${sub.subject}: letter ${sub.letter} but the scale gives ${b?.label ?? null}`);
        }
        for (const item of c.items.filter((i) => i.kind === "SCHOLASTIC" && i.scoreMilli !== null && i.pointsMilli)) {
          const b = bandFor(shownPercent((item.scoreMilli! / item.pointsMilli!) * 100), bands);
          if ((b?.label ?? null) !== (item.letter ?? null)) note("report-card", "FAIL", s.name, `card ${c.id} paper "${item.title}": letter ${item.letter} but the scale gives ${b?.label ?? null}`);
        }
      }
      if (legacy) note("report-card", "WARN", s.name, `${legacy} card(s) carry no subjects/scale snapshot and render with today's config`);
    }
    expect(failsOf("report-card")).toEqual([]);
  });

  it("report-card: the attendance on the card is the register between its dates", async () => {
    for (const s of schools) {
      const cards = await db.reportCard.findMany({ where: { schoolId: s.id }, select: { id: true, title: true, status: true, studentMembershipId: true, fromDateKey: true, toDateKey: true, attendancePresent: true, attendanceTotal: true, updatedAt: true, academicYearId: true } });
      const closedYears = new Set((await db.academicYear.findMany({ where: { schoolId: s.id, closedAt: { not: null } }, select: { id: true } })).map((y) => y.id));
      let stale = 0, closedNoRegister = 0;
      for (const c of cards) {
        const records = await db.attendanceRecord.findMany({ where: { schoolId: s.id, studentMembershipId: c.studentMembershipId, session: { dateKey: { gte: c.fromDateKey, lte: c.toDateKey } } }, select: { status: true, updatedAt: true } });
        const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
        if (present !== c.attendancePresent || records.length !== c.attendanceTotal) {
          // A closed year's card is frozen by design; with no register behind it there is nothing to recompute against.
          if (records.length === 0 && c.academicYearId && closedYears.has(c.academicYearId)) { closedNoRegister += 1; continue; }
          const newest = Math.max(0, ...records.map((r) => r.updatedAt.getTime()));
          if (newest > c.updatedAt.getTime()) stale += 1;
          else note("report-card-attendance", "FAIL", s.name, `card ${c.id} "${c.title}" (${c.status}): stored ${c.attendancePresent}/${c.attendanceTotal}, register says ${present}/${records.length}`);
        }
      }
      if (stale) note("report-card-attendance", "WARN", s.name, `${stale} card(s) predate a register edit inside their window — the snapshot is stale until regenerated`);
      if (closedNoRegister) note("report-card-attendance", "WARN", s.name, `${closedNoRegister} closed-year card(s) carry an attendance figure with no register behind it (the year's registers were never entered here)`);
    }
    expect(failsOf("report-card-attendance")).toEqual([]);
  });

  it("exam-sitting: the sitting mirrors its paper's max marks and title; the series' term holds its first paper", async () => {
    for (const s of schools) {
      const sittings = await db.assignment.findMany({ where: { schoolId: s.id, examSlotId: { not: null } }, select: { id: true, title: true, pointsMilli: true, examSlot: { select: { subject: true, pointsMilli: true, series: { select: { name: true } } } } } });
      let marks = 0, titles = 0;
      for (const a of sittings) {
        if (a.pointsMilli !== a.examSlot!.pointsMilli) marks += 1;
        if (a.title !== `${a.examSlot!.series.name} · ${a.examSlot!.subject}`) titles += 1;
      }
      if (marks) note("exam-sitting", "FAIL", s.name, `${marks} sitting(s) carry a different max from their paper`);
      if (titles) note("exam-sitting", "FAIL", s.name, `${titles} sitting(s) carry a stale title after a series rename`);
      const series = await db.examSeries.findMany({ where: { schoolId: s.id }, select: { id: true, name: true, termId: true, slots: { select: { dateKey: true }, orderBy: { dateKey: "asc" }, take: 1 } } });
      const terms = await db.term.findMany({ where: { schoolId: s.id }, select: { id: true, name: true, startDate: true, endDate: true } });
      for (const x of series) {
        const first = x.slots[0]?.dateKey;
        if (!first) continue;
        const covering = terms.find((t) => t.startDate.toISOString().slice(0, 10) <= first && first <= t.endDate.toISOString().slice(0, 10));
        // The term is derived from the earliest paper on every paper change (exams.ts), so a series off its term is a contradiction.
        if (x.termId && covering && covering.id !== x.termId) note("exam-sitting", "FAIL", s.name, `series "${x.name}" is on one term but its first paper (${first}) falls in "${covering.name}"`);
        if (!x.termId && covering) note("exam-sitting", "FAIL", s.name, `series "${x.name}" has no term although "${covering.name}" covers its first paper`);
      }
    }
    expect(failsOf("exam-sitting")).toEqual([]);
  });

  it("submission: RETURNED means a grade exists; a grade on a SUBMITTED row is a resubmission", async () => {
    for (const s of schools) {
      const subs = await db.submission.findMany({ where: { schoolId: s.id }, select: { id: true, status: true, assignmentId: true, studentMembershipId: true } });
      const grades = new Set((await db.grade.findMany({ where: { schoolId: s.id }, select: { assignmentId: true, studentMembershipId: true } })).map((g) => `${g.assignmentId}|${g.studentMembershipId}`));
      let resub = 0;
      for (const x of subs) {
        const graded = grades.has(`${x.assignmentId}|${x.studentMembershipId}`);
        if (x.status === "RETURNED" && !graded) note("submission", "FAIL", s.name, `submission ${x.id} is RETURNED with no grade`);
        if (x.status === "SUBMITTED" && graded) resub += 1;
      }
      if (resub) note("submission", "WARN", s.name, `${resub} graded submission(s) sit at SUBMITTED — resubmitted after marking, or the grade was cleared without the status`);
    }
    expect(failsOf("submission")).toEqual([]);
  });

  it("syllabus: a unit with a TAUGHT lesson is at least IN_PROGRESS", async () => {
    for (const s of schools) {
      const taught = await db.lessonPlan.findMany({ where: { schoolId: s.id, status: "TAUGHT", unitId: { not: null } }, select: { classId: true, unitId: true } });
      const progress = new Map((await db.syllabusProgress.findMany({ where: { schoolId: s.id }, select: { classId: true, unitId: true, status: true } })).map((p) => [`${p.classId}|${p.unitId}`, p.status]));
      const seen = new Set<string>();
      for (const l of taught) {
        const k = `${l.classId}|${l.unitId}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const st = progress.get(k) ?? "NOT_STARTED";
        if (st === "NOT_STARTED") note("syllabus", "FAIL", s.name, `unit ${l.unitId} in class ${l.classId} has a taught lesson but stands NOT_STARTED`);
      }
    }
    expect(failsOf("syllabus")).toEqual([]);
  });

  it("substitution: the cover row names the teacher the slot still has", async () => {
    for (const s of schools) {
      const rows = await db.substitution.findMany({ where: { schoolId: s.id }, select: { id: true, dateKey: true, absentMembershipId: true, slot: { select: { teacherMembershipId: true } } } });
      for (const r of rows) if (r.slot.teacherMembershipId !== r.absentMembershipId) note("substitution", "WARN", s.name, `cover ${r.id} on ${r.dateKey} names an absent teacher the slot no longer has`);
    }
    expect(failsOf("substitution")).toEqual([]);
  });

  it("membership: a leaver has no live enrolment; a pupil on the roll has no departure record; nobody sits in two classes", async () => {
    for (const s of schools) {
      const leftWithClass = await db.membership.count({ where: { schoolId: s.id, role: "STUDENT", leftAt: { not: null }, enrollments: { some: { status: "ACTIVE" } } } });
      if (leftWithClass) note("membership", "FAIL", s.name, `${leftWithClass} pupil(s) have left but still hold an ACTIVE enrolment`);
      // Every readmission path now deletes the departure record, so one behind a pupil on the roll is a contradiction.
      const stale = await db.schoolRecord.count({ where: { schoolId: s.id, membership: { status: "ACTIVE", leftAt: null } } });
      if (stale) note("membership", "FAIL", s.name, `${stale} departure record(s) belong to pupils back on the roll`);
      const doubled = await db.$queryRaw<{ n: bigint }[]>`select count(*)::bigint n from (select "studentMembershipId" from "Enrollment" where "schoolId" = ${s.id} and status = 'ACTIVE' group by 1 having count(*) > 1) x`;
      if (Number(doubled[0]?.n ?? 0)) note("membership", "WARN", s.name, `${doubled[0]?.n} pupil(s) hold two ACTIVE enrolments — attendance and marks count them twice`);
      // Membership.gradeLevel is a copy of the live class's grade (src/lib/grade-level.ts); a pupil on a roll whose copy disagrees is a contradiction.
      const enrolled = await db.membership.findMany({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { id: true, gradeLevel: true, enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, orderBy: { enrolledAt: "desc" }, take: 1, select: { class: { select: { gradeLevel: true } } } } } });
      const off = enrolled.filter((m) => (m.enrollments[0]?.class.gradeLevel ?? null) !== (m.gradeLevel ?? null));
      if (off.length) note("membership", "FAIL", s.name, `${off.length} pupil(s) carry a Membership.gradeLevel that is not their live class's grade (e.g. ${off[0]!.id})`);
    }
    expect(failsOf("membership")).toEqual([]);
  });

  it("user: isMinor follows the date of birth", async () => {
    // Exact: every writer of a date writes the flag with it, and accounts:tidy
    // (refreshMinority, daily) moves it when the calendar does. The one drift
    // allowed is an eighteenth birthday inside the job's own two-day window.
    const ids = schools.map((s) => s.id);
    const users = await db.user.findMany({ where: { birthdate: { not: null }, memberships: { some: { schoolId: { in: ids } } } }, select: { id: true, birthdate: true, isMinor: true } });
    const now = new Date();
    const GRACE_MS = 2 * 86_400_000;
    let wrong = 0;
    let pending = 0;
    let example = "";
    for (const u of users) {
      const b = u.birthdate!;
      let age = now.getUTCFullYear() - b.getUTCFullYear();
      if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) age -= 1;
      if (u.isMinor === age < 18) continue;
      const eighteenth = Date.UTC(b.getUTCFullYear() + 18, b.getUTCMonth(), b.getUTCDate());
      if (u.isMinor && now.getTime() - eighteenth < GRACE_MS) pending += 1;
      else {
        wrong += 1;
        example ||= u.id;
      }
    }
    if (wrong) note("user-minor", "FAIL", "all", `${wrong} dated account(s) have isMinor out of step with the birthdate (e.g. user ${example}) — a writer stamped it wrong or accounts:tidy has not run for two days`);
    if (pending) note("user-minor", "INFO", "all", `${pending} account(s) turned eighteen inside the last two days; tonight's accounts:tidy clears their flag`);
    note("user-minor", "INFO", "all", `${users.length} dated account(s) checked, ${wrong} out of step`);
    expect(failsOf("user-minor")).toEqual([]);
  });

  it("attendance-session: a taken register holds marks", async () => {
    for (const s of schools) {
      // A session is only written once a mark in the batch is valid (attendance.ts), so an empty one is a contradiction.
      const empty = await db.attendanceSession.count({ where: { schoolId: s.id, records: { none: {} } } });
      if (empty) note("attendance-session", "FAIL", s.name, `${empty} register(s) count as taken with no marks`);
    }
    expect(failsOf("attendance-session")).toEqual([]);
  });

  it("admission: an admitted application names its membership; offers past their date and dead bookings are counted", async () => {
    for (const s of schools) {
      const apps = await db.application.findMany({ where: { schoolId: s.id }, select: { id: true, serial: true, status: true, admittedMembershipId: true, offerExpiresAt: true, testSlotId: true, penNumber: true, childBirthdate: true } });
      for (const a of apps) if (a.status === "ADMITTED" && !a.admittedMembershipId) note("admission", "FAIL", s.name, `application ${a.serial} is ADMITTED with no membership`);
      // admissions:expire-offers runs hourly, so an offer more than a day past its date still OFFERED is a contradiction; one within the hour is the job's window.
      const expired = apps.filter((a) => a.status === "OFFERED" && a.offerExpiresAt && a.offerExpiresAt.getTime() < Date.now() - 86_400_000).length;
      if (expired) note("admission", "FAIL", s.name, `${expired} offer(s) are more than a day past their date and still OFFERED`);
      const dead = apps.filter((a) => a.testSlotId && ["DECLINED", "WITHDRAWN", "ADMITTED", "EXPIRED"].includes(a.status)).length;
      if (dead) note("admission", "INFO", s.name, `${dead} settled application(s) keep the slot they sat as a record; the booked count no longer counts them`);
      const noPen = apps.filter((a) => !a.penNumber).length;
      if (noPen) note("admission", "INFO", s.name, `${noPen} of ${apps.length} applications carry no PEN — the field is optional on the form`);
    }
    expect(failsOf("admission")).toEqual([]);
  });

  it("certificate: the snapshot's PEN and blanks against the account today", async () => {
    for (const s of schools) {
      const certs = await db.issuedCertificate.findMany({ where: { schoolId: s.id }, select: { id: true, serial: true, dataJson: true, student: { select: { user: { select: { penNumber: true } } } } } });
      for (const c of certs) {
        let data: Record<string, unknown> = {};
        try { data = JSON.parse(c.dataJson); } catch { note("certificate", "FAIL", s.name, `${c.serial}: dataJson is not JSON`); continue; }
        const pen = data["pupil.penNumber"];
        if (c.student.user.penNumber && (pen === "—" || blank(pen))) note("certificate", "WARN", s.name, `${c.serial} printed "—" for the PEN while the account holds one`);
        const missing = Array.isArray(data.missing) ? (data.missing as string[]) : [];
        if (missing.length) note("certificate", "INFO", s.name, `${c.serial} printed "—" for: ${missing.join(", ")}`);
      }
    }
    expect(failsOf("certificate")).toEqual([]);
  });

  it("staff-attendance: a self check-in is LATE exactly when it lands after the grace", async () => {
    for (const s of schools) {
      const rows = await db.staffAttendance.findMany({ where: { schoolId: s.id, source: "SELF", checkedInAt: { not: null } }, select: { id: true, dateKey: true, status: true, checkedInAt: true } });
      for (const r of rows) {
        const minute = minuteInZone(r.checkedInAt!, s.timezone);
        const late = minute > s.staffCheckInMinute + s.staffLateGraceMinutes;
        const expected = late ? "LATE" : "PRESENT";
        if (r.status !== expected && (r.status === "LATE" || r.status === "PRESENT")) note("staff-attendance", "FAIL", s.name, `${r.dateKey}: checked in at minute ${minute} (start ${s.staffCheckInMinute} + grace ${s.staffLateGraceMinutes}) but marked ${r.status}`);
      }
    }
    expect(failsOf("staff-attendance")).toEqual([]);
  });

  it("quiz-mastery: right answers never exceed questions seen; every attempt's pupil has a mastery row", async () => {
    for (const s of schools) {
      const bad = await db.quizMastery.count({ where: { schoolId: s.id, correctCount: { gt: db.quizMastery.fields.seenCount } } });
      if (bad) note("quiz", "FAIL", s.name, `${bad} mastery row(s) have more right answers than questions seen`);
      // A mastery row is written with the first ANSWER, so an attempt that was opened and never answered has none by design — and
      // a solution revealed before any answer leaves a response row with no chosen index (revealSolution), which is not an answer
      // either: a demo pupil did exactly that on 3 Oct 2026 and the check read it as an orphan.
      const orphan = await db.$queryRaw<{ n: bigint }[]>`select count(*)::bigint n from (select distinct a."studentMembershipId", a."topicId" from "QuizAttempt" a where a."schoolId" = ${s.id} and exists (select 1 from "QuizResponse" r where r."attemptId" = a.id and r."chosenIndex" is not null) and not exists (select 1 from "QuizMastery" m where m."studentMembershipId" = a."studentMembershipId" and m."topicId" = a."topicId")) x`;
      if (Number(orphan[0]?.n ?? 0)) note("quiz", "FAIL", s.name, `${orphan[0]?.n} pupil/topic pair(s) have answered attempts but no mastery row`);
      const unanswered = await db.$queryRaw<{ n: bigint }[]>`select count(*)::bigint n from "QuizAttempt" a where a."schoolId" = ${s.id} and not exists (select 1 from "QuizResponse" r where r."attemptId" = a.id)`;
      if (Number(unanswered[0]?.n ?? 0)) note("quiz", "INFO", s.name, `${unanswered[0]?.n} attempt(s) were opened and never answered`);
    }
    expect(failsOf("quiz")).toEqual([]);
  });

  /**
   * QuestionStat is the bank's own count of every school's answers, written by
   * the nightly bank:stats job alone (src/lib/bank-tools.ts, rebuildQuestionStats)
   * and read by the content team's bank page, where no school's rows are
   * readable. Server-wide, not per school: one bucket sums answers from every
   * school. A bucket that disagrees with the rows since the last run is a WARN
   * (the snapshot is nightly by design; answers given today, and a school
   * deleted since, show here until the next run); an impossibility — more
   * right than asked, more timed than asked, a negative — is a FAIL.
   */
  it("question-stat: every (question, grade) bucket is the sum of the answer rows; impossibilities never", async () => {
    const buckets = await db.questionStat.findMany({ select: { questionId: true, grade: true, asked: true, correct: true, seconds: true, timed: true, updatedAt: true } });
    const impossible = buckets.filter((b) => b.correct > b.asked || b.timed > b.asked || b.asked < 0 || b.seconds < 0);
    if (impossible.length) note("question-stat", "FAIL", "server", `${impossible.length} bucket(s) hold an impossible count (more right or timed than asked, or a negative)`);
    const sums = await db.$queryRaw<{ questionId: string; grade: number; asked: number; correct: number; seconds: number; timed: number }[]>`
      select r."questionId", coalesce(r."gradeLevel", 0)::int as grade, count(*)::int as asked, count(*) filter (where r."correct")::int as correct,
             coalesce(sum(r."seconds"), 0)::int as seconds, count(r."seconds")::int as timed
        from "QuizResponse" r where r."chosenIndex" is not null group by r."questionId", coalesce(r."gradeLevel", 0)`;
    const expected = new Map(sums.map((x) => [`${x.questionId}|${x.grade}`, x]));
    const stored = new Map(buckets.map((b) => [`${b.questionId}|${b.grade}`, b]));
    let drift = 0;
    for (const [key, want] of expected) {
      const have = stored.get(key);
      if (!have || have.asked !== want.asked || have.correct !== want.correct || have.seconds !== want.seconds || have.timed !== want.timed) drift++;
    }
    for (const key of stored.keys()) if (!expected.has(key)) drift++;
    if (drift) note("question-stat", "WARN", "server", `${drift} bucket(s) differ from the answer rows since the last bank:stats run (nightly; run \`npm run job -- bank:stats\` to refresh)`);
    else note("question-stat", "INFO", "server", `${buckets.length} bucket(s) over ${expected.size} (question, grade) pair(s) match the answer rows exactly`);
    expect(failsOf("question-stat")).toEqual([]);
  });

  // qb-C (31 Oct 2026, QB-12): LibraryEResource.nameKey is a stored copy of the name's comparison form, written by
  // eResourceNameKey alone. Every row's key is its name's, platform-wide (a college's e-resources are not in the
  // default school set, and the rule is the same everywhere).
  it("eresource-name-key: every e-resource's nameKey is its name as the desk compares it", async () => {
    const rows = await db.libraryEResource.findMany({ select: { id: true, schoolId: true, name: true, nameKey: true } });
    for (const r of rows) if (r.nameKey !== eResourceNameKey(r.name)) note("eresource-name-key", "FAIL", r.schoolId, `e-resource ${r.id} "${r.name}" keeps the key "${r.nameKey}", not "${eResourceNameKey(r.name)}"`);
    note("eresource-name-key", "INFO", "platform", `${rows.length} e-resource(s) checked`);
    expect(failsOf("eresource-name-key")).toEqual([]);
  });
});

d("ON-READ answers against a recomputation from raw rows", () => {
  it("office/pupil-records: totals and each pupil's missing list", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) { note("records-api", "INFO", s.name, "no admin to read as"); continue; }
      await as(a.admin, s.id, "ADMIN");
      const view = await json<{ rows: { studentMembershipId: string; missing: string[]; missingForFiling: string[] }[]; total: number; complete: number; incomplete: number }>(await recordsGet(get("/api/v1/office/pupil-records")));
      const pupils = await db.membership.findMany({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { id: true, pupilRecord: true } });
      if (view.total !== pupils.length) note("records-api", "FAIL", s.name, `total ${view.total} but ${pupils.length} pupils are on the roll`);
      if (view.complete + view.incomplete !== view.total) note("records-api", "FAIL", s.name, `complete ${view.complete} + incomplete ${view.incomplete} ≠ total ${view.total}`);
      const byId = new Map(view.rows.map((r) => [r.studentMembershipId, r]));
      let complete = 0;
      for (const p of pupils) {
        const rec = (p.pupilRecord ?? {}) as Record<string, unknown>;
        const missing = REQUIRED_RECORD_FIELDS.filter((f) => blank(rec[f]));
        const filing = FILING_RECORD_FIELDS.filter((f) => f === "category" ? !(PUPIL_CATEGORIES as readonly string[]).includes(String(rec[f] ?? "").trim().toUpperCase()) : blank(rec[f]));
        if (!missing.length) complete += 1;
        const row = byId.get(p.id);
        if (!row) { note("records-api", "FAIL", s.name, `pupil ${p.id} missing from the rows`); continue; }
        if (row.missing.join() !== missing.join()) note("records-api", "FAIL", s.name, `pupil ${p.id}: API missing [${row.missing}] vs raw [${missing}]`);
        if (row.missingForFiling.join() !== filing.join()) note("records-api", "FAIL", s.name, `pupil ${p.id}: API missingForFiling [${row.missingForFiling}] vs raw [${filing}]`);
      }
      if (complete !== view.complete) note("records-api", "FAIL", s.name, `complete ${view.complete} but raw says ${complete}`);
    }
    expect(failsOf("records-api")).toEqual([]);
  });

  it("office/filings: readiness counts per pupil and staff field, and pupils per grade", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) continue;
      await as(a.admin, s.id, "ADMIN");
      const view = await json<{ identityMissing: string[]; pupils: { total: number; ready: number; missing: Record<string, number>; withoutLocalName: number }; staff: { total: number; ready: number; missing: Record<string, number> }; grades: { gradeLevel: string; pupils: number }[] }>(await filingsGet());
      const pupils = await db.membership.findMany({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { pupilRecord: true, user: { select: { birthdate: true } }, enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { class: { select: { gradeLevel: true } } }, take: 1, orderBy: { enrolledAt: "desc" } } } });
      const missing: Record<string, number> = {};
      let ready = 0, withoutLocal = 0;
      for (const p of pupils) {
        const rec = (p.pupilRecord ?? {}) as Record<string, unknown>;
        // Ready is wider than the record: the sheet also needs the date of birth, both parents' names and a class whose grade codes (filings.ts).
        const gaps: string[] = FILING_RECORD_FIELDS.filter((f) => f === "category" ? !(PUPIL_CATEGORIES as readonly string[]).includes(String(rec[f] ?? "").trim().toUpperCase()) : blank(rec[f]));
        if (!p.user.birthdate) gaps.push("birthdate");
        if (blank(rec.fatherName) || blank(rec.motherName)) gaps.push("parents");
        const grade = p.enrollments[0]?.class.gradeLevel ?? "";
        if (!/^([1-9]|1[0-2]|PP[123])$/.test(grade) && !/nursery|kg|pre/i.test(grade)) gaps.push("classCode");
        if (!gaps.length) ready += 1;
        for (const g of gaps) missing[g] = (missing[g] ?? 0) + 1;
        if (blank(rec.nameLocal)) withoutLocal += 1;
      }
      if (view.pupils.total !== pupils.length || view.pupils.ready !== ready) note("filings-api", "FAIL", s.name, `pupils ${view.pupils.ready}/${view.pupils.total} ready but raw says ${ready}/${pupils.length}`);
      for (const f of [...FILING_RECORD_FIELDS, "birthdate", "parents", "classCode"]) if ((view.pupils.missing[f] ?? 0) !== (missing[f] ?? 0)) note("filings-api", "FAIL", s.name, `pupils missing ${f}: API ${view.pupils.missing[f] ?? 0} vs raw ${missing[f] ?? 0}`);
      if (view.pupils.withoutLocalName !== withoutLocal) note("filings-api", "FAIL", s.name, `withoutLocalName ${view.pupils.withoutLocalName} vs raw ${withoutLocal}`);
      const gradeRaw = await db.enrollment.groupBy({ by: ["classId"], where: { schoolId: s.id, status: "ACTIVE", class: { archivedAt: null } }, _count: true });
      const classes = new Map((await db.class.findMany({ where: { schoolId: s.id }, select: { id: true, gradeLevel: true } })).map((c) => [c.id, c.gradeLevel]));
      const perGrade = new Map<string, number>();
      for (const g of gradeRaw) { const gl = classes.get(g.classId); if (gl) perGrade.set(gl, (perGrade.get(gl) ?? 0) + g._count); }
      for (const g of view.grades) if ((perGrade.get(g.gradeLevel) ?? 0) !== g.pupils) note("filings-api", "FAIL", s.name, `grade ${g.gradeLevel}: ${g.pupils} pupils but raw enrolments say ${perGrade.get(g.gradeLevel) ?? 0}`);
      const gradeSum = sum(view.grades.map((g) => g.pupils));
      if (gradeSum !== view.pupils.total) note("filings-api", "WARN", s.name, `grades sum to ${gradeSum} pupils, the roll has ${view.pupils.total} — suspended or unclassed pupils, or a class with no grade`);
      if (view.identityMissing.length) note("filings-api", "INFO", s.name, `filing identity blank: ${view.identityMissing.join(", ")}`);
      const staffGaps = Object.entries(view.staff.missing).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`);
      note("filings-api", "INFO", s.name, `staff ready ${view.staff.ready}/${view.staff.total}${staffGaps.length ? `; missing ${staffGaps.join(", ")}` : ""}`);
    }
    expect(failsOf("filings-api")).toEqual([]);
  });

  it("fees/dues, fees/overview and a pupil's ledger: every sum from the demand rows", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) continue;
      await as(a.admin, s.id, "ADMIN");
      const year = await db.academicYear.findFirst({ where: { schoolId: s.id, isCurrent: true }, select: { id: true } });
      if (!year) { note("fees-api", "INFO", s.name, "no current year"); continue; }
      const today = todayKey(s.timezone);
      const demands = await db.feeDemand.findMany({ where: { schoolId: s.id, academicYearId: year.id }, select: { studentMembershipId: true, status: true, netPaise: true, paidPaise: true, dueDate: true } });
      const live = demands.filter((x) => x.status === "OPEN" || x.status === "PART" || x.status === "PAID");
      const outstandingOf = (x: (typeof demands)[number]) => (x.status === "OPEN" || x.status === "PART" ? Math.max(0, x.netPaise - x.paidPaise) : 0);
      const overdueOf = (x: (typeof demands)[number]) => (outstandingOf(x) > 0 && x.dueDate.toISOString().slice(0, 10) < today ? outstandingOf(x) : 0);

      const ov = await json<{ totals: { demandedPaise: number; collectedPaise: number; outstandingPaise: number; overduePaise: number }; pupils: { onPlan: number; withoutPlan: number } }>(await feeOverviewGet());
      // Collected counts a CARRIED demand's paid money in its own year (fees-reports.ts); demanded and outstanding do not include it.
      const carriedPaid = sum(demands.filter((x) => x.status === "CARRIED").map((x) => x.paidPaise));
      const exp = { demandedPaise: sum(live.map((x) => x.netPaise)), collectedPaise: sum(live.map((x) => x.paidPaise)) + carriedPaid, outstandingPaise: sum(live.map(outstandingOf)), overduePaise: sum(live.map(overdueOf)) };
      for (const k of Object.keys(exp) as (keyof typeof exp)[]) if (ov.totals[k] !== exp[k]) note("fees-api", "FAIL", s.name, `overview ${k} ${ov.totals[k]} vs raw ${exp[k]}`);
      const plans = await db.studentFeePlan.count({ where: { schoolId: s.id, academicYearId: year.id } });
      if (ov.pupils.onPlan !== plans) note("fees-api", "FAIL", s.name, `overview onPlan ${ov.pupils.onPlan} vs ${plans} plans`);
      const leaversOnPlan = await db.studentFeePlan.count({ where: { schoolId: s.id, academicYearId: year.id, student: { OR: [{ leftAt: { not: null } }, { status: { not: "ACTIVE" } }] } } });
      if (leaversOnPlan) note("fees-api", "WARN", s.name, `${leaversOnPlan} plan(s) belong to pupils off the roll — they count as onPlan and their dues drop out of the dues page`);

      const rows: { studentMembershipId: string; outstandingPaise: number; overduePaise: number; netPaise: number; paidPaise: number }[] = [];
      for (let page = 1; page <= 50; page += 1) {
        const r = await json<{ rows: typeof rows; total: number; pageSize: number }>(await duesGet(get(`/api/v1/fees/dues?page=${page}&pageSize=200`)));
        rows.push(...r.rows);
        if (rows.length >= r.total) break;
      }
      const byPupil = new Map<string, (typeof demands)[number][]>();
      for (const x of live) byPupil.set(x.studentMembershipId, [...(byPupil.get(x.studentMembershipId) ?? []), x]);
      for (const r of rows) {
        const mine = byPupil.get(r.studentMembershipId) ?? [];
        const e = { netPaise: sum(mine.map((x) => x.netPaise)), paidPaise: sum(mine.map((x) => x.paidPaise)), outstandingPaise: sum(mine.map(outstandingOf)), overduePaise: sum(mine.map(overdueOf)) };
        for (const k of Object.keys(e) as (keyof typeof e)[]) if (r[k] !== e[k]) note("fees-api", "FAIL", s.name, `dues ${r.studentMembershipId} ${k} ${r[k]} vs raw ${e[k]}`);
      }
      const sample = rows.slice(0, 3);
      for (const r of sample) {
        const l = await json<{ totals: { netPaise: number; paidPaise: number; outstandingPaise: number; overduePaise: number } }>(await ledgerGet(get(`/api/v1/fees/pupils/${r.studentMembershipId}`), params({ studentMembershipId: r.studentMembershipId })));
        const all = demands.filter((x) => x.studentMembershipId === r.studentMembershipId);
        // Net and paid over the same rows: a CARRIED or CANCELLED demand counts on neither side (README item 14).
        const counted = all.filter((x) => x.status !== "CANCELLED" && x.status !== "CARRIED");
        const e = { netPaise: sum(counted.map((x) => x.netPaise)), paidPaise: sum(counted.map((x) => x.paidPaise)), outstandingPaise: sum(all.map(outstandingOf)), overduePaise: sum(all.map(overdueOf)) };
        for (const k of Object.keys(e) as (keyof typeof e)[]) if (l.totals[k] !== e[k]) note("fees-api", "FAIL", s.name, `ledger ${r.studentMembershipId} ${k} ${l.totals[k]} vs raw ${e[k]}`);
      }
    }
    expect(failsOf("fees-api")).toEqual([]);
  });

  it("family/attendance: the guardian's month is the child's marks", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.parent) { note("attendance-api", "INFO", s.name, "no guardian to read as"); continue; }
      await as(a.parent.userId, null, "PARENT");
      const month = todayKey(s.timezone).slice(0, 7);
      const view = await json<{ summary: { counts: Record<string, number>; total: number; percent: number | null } }>(await familyAttendanceGet(get(`/api/v1/family/attendance?childId=${a.parent.childId}&month=${month}`)));
      const records = await db.attendanceRecord.findMany({ where: { schoolId: s.id, studentMembershipId: a.parent.childId, session: { dateKey: { gte: `${month}-01`, lte: `${month}-31` } } }, select: { status: true } });
      const counts: Record<string, number> & { PRESENT: number; LATE: number; ABSENT: number; EXCUSED: number } = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
      for (const r of records) counts[r.status] = (counts[r.status] ?? 0) + 1;
      for (const k of Object.keys(counts)) if (view.summary.counts[k] !== counts[k]) note("attendance-api", "FAIL", s.name, `${month} ${k}: API ${view.summary.counts[k]} vs raw ${counts[k]}`);
      const percent = records.length === 0 ? null : Math.round(((counts.PRESENT + counts.LATE) * 100) / records.length);
      if (view.summary.total !== records.length || view.summary.percent !== percent) note("attendance-api", "FAIL", s.name, `${month}: API ${view.summary.percent}% of ${view.summary.total} vs raw ${percent}% of ${records.length}`);
      if (counts.EXCUSED) note("attendance-api", "INFO", s.name, `${counts.EXCUSED} EXCUSED mark(s) sit in the denominator and lower the child's percent`);
    }
    expect(failsOf("attendance-api")).toEqual([]);
  });

  it("office/syllabus/coverage: units, done, expected and behind per class and subject", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) continue;
      await as(a.admin, s.id, "ADMIN");
      const view = await json<{ yearElapsedPercent: number; rows: { classId: string; subject: string; units: number; done: number; inProgress: number; percent: number; expected: number; behind: boolean }[] }>(await coverageGet());
      const year = await db.academicYear.findFirst({ where: { schoolId: s.id, isCurrent: true }, select: { startDate: true, endDate: true } });
      const span = year ? year.endDate.getTime() - year.startDate.getTime() : 0;
      const elapsed = !year || span <= 0 ? 0 : Math.min(1, Math.max(0, (Date.now() - year.startDate.getTime()) / span));
      if (Math.round(elapsed * 100) !== view.yearElapsedPercent) note("coverage-api", "FAIL", s.name, `yearElapsedPercent ${view.yearElapsedPercent} vs raw ${Math.round(elapsed * 100)}`);
      const units = await db.syllabusUnit.findMany({ where: { schoolId: s.id }, select: { id: true, gradeLevel: true, subject: true } });
      const classes = new Map((await db.class.findMany({ where: { schoolId: s.id }, select: { id: true, gradeLevel: true } })).map((c) => [c.id, c.gradeLevel]));
      const progress = await db.syllabusProgress.findMany({ where: { schoolId: s.id }, select: { classId: true, unitId: true, status: true } });
      for (const r of view.rows) {
        const ids = units.filter((u) => u.gradeLevel === classes.get(r.classId) && u.subject === r.subject).map((u) => u.id);
        const mine = progress.filter((p) => p.classId === r.classId && ids.includes(p.unitId));
        const done = mine.filter((p) => p.status === "DONE").length;
        const inProgress = mine.filter((p) => p.status === "IN_PROGRESS").length;
        const expected = Math.round(elapsed * ids.length);
        const e = { units: ids.length, done, inProgress, percent: ids.length ? Math.round((done / ids.length) * 100) : 0, expected, behind: expected - done >= 2 };
        for (const k of Object.keys(e) as (keyof typeof e)[]) if (r[k] !== e[k]) note("coverage-api", "FAIL", s.name, `${r.classId} ${r.subject} ${k}: API ${String(r[k])} vs raw ${String(e[k])}`);
      }
    }
    expect(failsOf("coverage-api")).toEqual([]);
  });

  it("family/report-cards: the percent shown is the stored milli value", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.parent) continue;
      await as(a.parent.userId, null, "PARENT");
      const view = await json<{ groups: { cards: { id: string; attendancePresent: number; attendanceTotal: number; attendancePercent: number | null; overallPercent: number | null }[] }[] }>(await familyCardsGet());
      const cards = view.groups.flatMap((g) => g.cards ?? []).filter((c) => (c as { studentMembershipId?: string }).studentMembershipId === a.parent!.childId);
      for (const c of cards) {
        const stored = await db.reportCard.findUniqueOrThrow({ where: { id: c.id }, select: { overallPercentMilli: true, attendancePresent: true, attendanceTotal: true } });
        const overall = stored.overallPercentMilli === null ? null : stored.overallPercentMilli / 1000;
        if (c.overallPercent !== overall) note("cards-api", "FAIL", s.name, `card ${c.id}: overallPercent ${c.overallPercent} vs stored ${overall}`);
        const pct = stored.attendanceTotal === 0 ? null : Math.round((stored.attendancePresent * 100) / stored.attendanceTotal);
        if (c.attendancePercent !== pct) note("cards-api", "FAIL", s.name, `card ${c.id}: attendancePercent ${c.attendancePercent} vs ${pct}`);
      }
      if (!cards.length) note("cards-api", "INFO", s.name, "the sampled child has no report card to read");
    }
    expect(failsOf("cards-api")).toEqual([]);
  });

  it("office/substitutions: who is away today is the staff register plus approved leave; cover counts match the rows", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) continue;
      await as(a.admin, s.id, "ADMIN");
      const today = todayKey(s.timezone);
      const view = await json<{ closed: boolean; absent: { membershipId: string; lessons: number; covered: number }[]; lessons: { slotId: string; absentMembershipId: string; substitute: unknown }[]; covered: number; uncovered: number }>(await boardGet(get(`/api/v1/office/substitutions?date=${today}`)));
      if (view.closed) { note("board-api", "INFO", s.name, `${today} is closed; no board`); continue; }
      const away = new Set<string>();
      for (const r of await db.staffAttendance.findMany({ where: { schoolId: s.id, dateKey: today, status: { in: ["ABSENT", "ON_LEAVE"] } }, select: { membershipId: true } })) away.add(r.membershipId);
      for (const l of await db.leaveRequest.findMany({ where: { schoolId: s.id, status: "APPROVED", fromDateKey: { lte: today }, toDateKey: { gte: today } }, select: { teacherMembershipId: true } })) away.add(l.teacherMembershipId);
      const present = new Set((await db.staffAttendance.findMany({ where: { schoolId: s.id, dateKey: today, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } }, select: { membershipId: true } })).map((r) => r.membershipId));
      for (const p of present) away.delete(p);
      const apiAway = new Set(view.absent.map((x) => x.membershipId));
      const staffed = new Set((await db.timetableSlot.findMany({ where: { schoolId: s.id, teacherMembershipId: { in: [...away] } }, select: { teacherMembershipId: true } })).map((x) => x.teacherMembershipId!));
      for (const id of away) if (staffed.has(id) && !apiAway.has(id)) note("board-api", "FAIL", s.name, `${id} is away on ${today} with lessons but not on the board`);
      for (const id of apiAway) if (!away.has(id)) note("board-api", "FAIL", s.name, `${id} is on the board for ${today} but neither the register nor leave says they are away`);
      const covers = await db.substitution.count({ where: { schoolId: s.id, dateKey: today } });
      if (view.covered !== view.lessons.filter((l) => l.substitute).length || view.covered + view.uncovered !== view.lessons.length) note("board-api", "FAIL", s.name, `covered ${view.covered} + uncovered ${view.uncovered} ≠ ${view.lessons.length} lessons`);
      if (covers < view.covered) note("board-api", "FAIL", s.name, `${view.covered} covered on the board but only ${covers} cover rows exist`);
      note("board-api", "INFO", s.name, `${today}: ${view.absent.length} away, ${view.lessons.length} lessons, ${view.covered} covered`);
    }
    expect(failsOf("board-api")).toEqual([]);
  });

  it("admin/overview and staff/principal/overview: the head counts", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      const students = await db.membership.count({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null } });
      const teachers = await db.membership.count({ where: { schoolId: s.id, role: "TEACHER", status: "ACTIVE", leftAt: null } });
      const classes = await db.class.count({ where: { schoolId: s.id, archivedAt: null } });
      if (a.admin) {
        await as(a.admin, s.id, "ADMIN");
        const v = await json<{ counts: { teachers: number; students: number; classes: number } }>(await adminOverviewGet());
        if (v.counts.students !== students) note("overview-api", "FAIL", s.name, `admin students ${v.counts.students} vs ${students}`);
        if (v.counts.teachers !== teachers) note("overview-api", "FAIL", s.name, `admin teachers ${v.counts.teachers} vs ${teachers}`);
        if (v.counts.classes !== classes) note("overview-api", "FAIL", s.name, `admin classes ${v.counts.classes} vs ${classes}`);
      }
      if (a.principal) {
        await as(a.principal, s.id, "PRINCIPAL");
        const v = await json<{ summary: { pupils: number; classes: number; attendancePercent: number | null; registersMissingToday: number } }>(await principalOverviewGet(get("/api/v1/staff/principal/overview")));
        if (v.summary.pupils !== students) note("overview-api", "FAIL", s.name, `principal pupils ${v.summary.pupils} vs ${students}`);
        if (v.summary.classes !== classes) note("overview-api", "FAIL", s.name, `principal classes ${v.summary.classes} vs ${classes}`);
        note("overview-api", "INFO", s.name, `principal: attendance ${v.summary.attendancePercent}%, registers missing today ${v.summary.registersMissingToday} (holidays and empty classes are not excluded)`);
      }
    }
    expect(failsOf("overview-api")).toEqual([]);
  });

  it("office/circulars: seen and acknowledged are the read and ack rows", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) continue;
      await as(a.admin, s.id, "ADMIN");
      const v = await json<{ rows: { postId: string; total: number; told: number; seen: number; acked: number }[] }>(await circularsGet());
      // The counts are FAMILIES at each state (the best state across a child's guardians and the child), and "seen" also counts a read notification, so
      // they are not raw row counts. What must hold: acked ⊆ seen ⊆ told ⊆ audience, and a family cannot be acked without an ack row from one of its people.
      for (const r of v.rows) {
        const ackRows = await db.postAck.count({ where: { postId: r.postId } });
        const readRows = await db.postRead.count({ where: { postId: r.postId } });
        if (!(r.acked <= r.seen && r.seen <= r.told && r.told <= r.total)) note("circulars-api", "FAIL", s.name, `post ${r.postId}: acked ${r.acked} ≤ seen ${r.seen} ≤ told ${r.told} ≤ audience ${r.total} does not hold`);
        if (r.acked > 0 && ackRows === 0) note("circulars-api", "FAIL", s.name, `post ${r.postId}: ${r.acked} families acked with no ack row`);
        if (r.seen > 0 && readRows === 0) note("circulars-api", "INFO", s.name, `post ${r.postId}: ${r.seen} families count as seen with no read row — a read notification counts as seen`);
      }
    }
    expect(failsOf("circulars-api")).toEqual([]);
  });

  it("office/staff-attendance/month: each member's marks", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) continue;
      await as(a.admin, s.id, "ADMIN");
      const month = todayKey(s.timezone).slice(0, 7);
      const v = await json<{ rows: { membershipId: string; present: number; late: number; halfDay: number; absent: number; onLeave: number; percent: number | null }[] }>(await staffMonthGet(get(`/api/v1/office/staff-attendance/month?month=${month}`)));
      const closed = new Set<string>();
      // Only a kind that closes the school takes a day out of the tally; an exam or an event span does not (holidays.ts).
      for (const h of await db.holiday.findMany({ where: { schoolId: s.id, startDateKey: { lte: `${month}-31` }, endDateKey: { gte: `${month}-01` } }, select: { startDateKey: true, endDateKey: true, kind: true } })) {
        if (!HOLIDAY_KIND_META[h.kind as keyof typeof HOLIDAY_KIND_META]?.closesSchool) continue;
        for (let dd = 1; dd <= 31; dd += 1) { const k = `${month}-${String(dd).padStart(2, "0")}`; if (k >= h.startDateKey && k <= h.endDateKey) closed.add(k); }
      }
      const week = s.teachingDays.split(",").map(Number);
      const rows = await db.staffAttendance.findMany({ where: { schoolId: s.id, dateKey: { startsWith: month } }, select: { membershipId: true, dateKey: true, status: true } });
      const isTeaching = (k: string) => week.includes(new Date(`${k}T00:00:00Z`).getUTCDay()) && !closed.has(k);
      for (const r of v.rows) {
        const mine = rows.filter((x) => x.membershipId === r.membershipId && isTeaching(x.dateKey));
        const c = (st: string) => mine.filter((x) => x.status === st).length;
        for (const [k, st] of [["present", "PRESENT"], ["late", "LATE"], ["halfDay", "HALF_DAY"], ["absent", "ABSENT"]] as const) {
          if (r[k] !== c(st)) note("staff-month-api", "FAIL", s.name, `${r.membershipId} ${month} ${k}: API ${r[k]} vs ${c(st)} rows`);
        }
        const marked = r.present + r.late + r.halfDay + r.absent;
        const pct = marked === 0 ? null : Math.round(((r.present + r.late + r.halfDay * 0.5) / marked) * 100);
        if (r.percent !== pct) note("staff-month-api", "FAIL", s.name, `${r.membershipId}: percent ${r.percent} vs ${pct}`);
      }
    }
    expect(failsOf("staff-month-api")).toEqual([]);
  });

  it("office/admissions/cycles: counts by status and seats by grade", async () => {
    for (const s of schools) {
      const a = actors.get(s.id)!;
      if (!a.admin) continue;
      await as(a.admin, s.id, "ADMIN");
      const v = await json<{ cycles: { id: string; counts: Record<string, number>; seats: { grade: string; seats: number; applied: number; admitted: number }[] }[] }>(await cyclesGet());
      for (const c of v.cycles) {
        const raw = await db.application.groupBy({ by: ["status"], where: { cycleId: c.id }, _count: true });
        for (const g of raw) if ((c.counts[g.status] ?? 0) !== g._count) note("cycles-api", "FAIL", s.name, `cycle ${c.id} ${g.status}: API ${c.counts[g.status] ?? 0} vs ${g._count}`);
        for (const seat of c.seats) {
          const admitted = await db.application.count({ where: { cycleId: c.id, gradeApplied: seat.grade, status: "ADMITTED" } });
          const applied = await db.application.count({ where: { cycleId: c.id, gradeApplied: seat.grade, status: { not: "WITHDRAWN" } } });
          if (seat.admitted !== admitted) note("cycles-api", "FAIL", s.name, `cycle ${c.id} grade ${seat.grade}: admitted ${seat.admitted} vs ${admitted}`);
          if (seat.applied !== applied) note("cycles-api", "FAIL", s.name, `cycle ${c.id} grade ${seat.grade}: applied ${seat.applied} vs ${applied}`);
        }
      }
    }
    expect(failsOf("cycles-api")).toEqual([]);
  });
});

d("usage: the nightly sample against the rows it counts", () => {
  it("usage-sample: this month's stored counts are what the roll, the texts and the files add up to", async () => {
    const sizes = await loadStoredSizes();
    for (const s of schools) {
      const month = monthKeyFor(s.timezone);
      const stored = await db.usageSample.findUnique({ where: { schoolId_month: { schoolId: s.id, month } } });
      if (!stored) { note("usage-sample", "INFO", s.name, `no row for ${month} yet (usage:sample has not run)`); continue; }
      const fresh = await computeUsage(s.id, month, { sizes });
      // A row is the night's picture, and anything the month gained since —
      // a text sent at five in the morning after the two o'clock sample, a
      // pupil admitted, a file attached — is drift, not a contradiction,
      // however young the row (the sweep of 2026-10-01 sent ten texts after
      // the sample and the "younger than a day must agree" rule failed on
      // them). What cannot happen is a stored count ABOVE the recomputed one
      // for a thing the month never loses: a text once sent stays sent.
      for (const key of ["pupils", "messages", "storageMb"] as const) {
        if (stored[key] === fresh[key]) continue;
        const impossible = key === "messages" && stored[key] > fresh[key];
        note("usage-sample", impossible ? "FAIL" : "WARN", s.name, `${month} ${key}: stored ${stored[key]} vs recomputed ${fresh[key]} (computed ${stored.computedAt.toISOString()})`);
      }
      // The audit's own sign-ins add sessions; the recomputed figure may only grow.
      if (fresh.activeUsers < stored.activeUsers) note("usage-sample", "WARN", s.name, `${month} activeUsers: stored ${stored.activeUsers} vs recomputed ${fresh.activeUsers}`);
    }
    expect(failsOf("usage-sample")).toEqual([]);
  });
});

d("population: what the demo data never fills", () => {
  it("columns nobody has populated in these schools", async () => {
    const ids = schools.map((s) => s.id);
    if (!ids.length) return;
    const list = ids.map((x) => `'${x}'`).join(",");
    const cols = await db.$queryRawUnsafe<{ table_name: string; column_name: string }[]>(`select table_name, column_name from information_schema.columns where table_schema='public' and is_nullable='YES' and table_name not like '\\_prisma%' order by table_name, ordinal_position`);
    const byTable = new Map<string, string[]>();
    for (const c of cols) byTable.set(c.table_name, [...(byTable.get(c.table_name) ?? []), c.column_name]);
    const schoolTables = new Set((await db.$queryRawUnsafe<{ table_name: string }[]>(`select table_name from information_schema.columns where table_schema='public' and column_name='schoolId'`)).map((r) => r.table_name));
    const never: string[] = [];
    const empty: string[] = [];
    for (const [t, cs] of byTable) {
      if (!schoolTables.has(t)) continue;
      const [cnt] = await db.$queryRawUnsafe<{ n: bigint }[]>(`select count(*)::bigint n from "${t}" where "schoolId" in (${list})`);
      if (Number(cnt?.n ?? 0) === 0) { empty.push(t); continue; }
      const [r] = await db.$queryRawUnsafe<Record<string, bigint>[]>(`select ${cs.map((c) => `count("${c}")::bigint as "${c}"`).join(", ")} from "${t}" where "schoolId" in (${list})`);
      for (const c of cs) if (Number(r?.[c] ?? 0) === 0) never.push(`${t}.${c}`);
    }
    note("population", "INFO", "all", `school tables with no rows: ${empty.join(", ") || "none"}`);
    note("population", "INFO", "all", `nullable columns never populated: ${never.join(", ") || "none"}`);
    expect(true).toBe(true);
  });
});

d("bank: the provenance tag every in-app question carries", () => {
  /**
   * QuizQuestion.source is a provenance tag with one reader, scripts/import-quiz.ts,
   * which deletes any question the content files no longer hold UNLESS the tag
   * is one of AUTHORED_IN_THE_APP (src/lib/bank-source.ts). The tag named the
   * product, and the product was renamed on 2 October 2026: a row still carrying
   * the old name is a question the next import would silently delete, so it is a
   * FAIL, not a WARN. Server-wide, not per school: the bank has no schoolId.
   */
  it("bank-source: no question carries the tag of a product name the importer no longer spares", async () => {
    const stale = await db.quizQuestion.count({ where: { source: CONTENT_TEAM_SOURCE_BEFORE_RENAME } });
    if (stale) note("bank-source", "FAIL", "server", `${stale} question(s) still carry "${CONTENT_TEAM_SOURCE_BEFORE_RENAME}", which scripts/import-quiz.ts would delete on its next run (migration bank_source_shalaghar rewrites them)`);
    const kept = await db.quizQuestion.groupBy({ by: ["source"], where: { source: { in: [...AUTHORED_IN_THE_APP] } }, _count: { _all: true } });
    note("bank-source", "INFO", "server", `in-app questions the importer spares: ${kept.map((k) => `${k._count._all} "${k.source}"`).join(", ") || "none"}`);
    expect(failsOf("bank-source")).toEqual([]);
  });

  /**
   * owner-batch-item6 (30 Oct 2026): a practice chapter's name is its book's chapter title (scripts/topic-titles.ts). FAIL
   * for a live school chapter named (or lined) with a fragment by corpus-titles' rules ("NIT", "In this chapter…", "22. On
   * the Move Again") or whose chapter line or slug spells its corpus chapter's known title while its name says something
   * else ("How a Leaf Spends Light"); the chapters whose name agrees with the title only in part, and those the corpus
   * cannot speak for, are counted. Server-wide: the bank has no schoolId.
   */
  it("bank-names: no practice chapter is named with a fragment or against the title its line or slug spells", async () => {
    const corpus = await corpusChapters(db);
    const topics = await db.quizTopic.findMany({
      where: { audience: "SCHOOL", retiredAt: null, board: { in: ["NCERT", "BALBHARATI"] }, NOT: { slug: { startsWith: "zz-" } } },
      select: { id: true, slug: true, board: true, classLevel: true, subject: true, chapter: true, name: true },
    });
    const counts: Record<string, number> = {};
    for (const t of topics) {
      const v = titleVerdict(t, corpus);
      counts[v.kind] = (counts[v.kind] ?? 0) + 1;
      if (v.kind === "FRAGMENT") note("bank-names", "FAIL", "server", `${t.slug}: "${t.name}" (${t.chapter}) is ${v.reason}${v.title ? `; the corpus's title is "${v.title}"` : ""}`);
      if (v.kind === "DIFFERS") note("bank-names", "FAIL", "server", `${t.slug}: named "${t.name}" where its line or slug is the book's title "${v.title}" (${v.chapter.path})`);
    }
    note("bank-names", "INFO", "server", `${topics.length} live school chapters: ${counts.OK ?? 0} named as their book, ${counts.CLOSE ?? 0} agreeing in part (a slug or a corpus title cut short), ${counts.UNKNOWN ?? 0} the corpus cannot speak for, ${corpus.filter((c) => c.refusal).length} of ${corpus.length} corpus chapters with no known title`);
    expect(failsOf("bank-names")).toEqual([]);
  });

  /**
   * qb-A (QB-01, QB-18, 31 Oct 2026): the names the QA pass found wrong. FAIL for a live Hindi or Marathi chapter name the
   * loader's cleaner would change (a class, subject or chapter label, a number in front, a run-on summary) or that is
   * written in the other language (scripts/quiz-queue-load.ts translatedNameFor); FAIL for a generated college unit still
   * serving questions under a name the unit rule refuses ("Notes:", "Syllabus", "Intake: 60 Duration: 4 Year";
   * src/lib/college-syllabi.ts unitNameRefusal). Server-wide: the bank has no schoolId.
   */
  it("bank-translation-names and college-unit-names: no label, number, summary or other language in a name; no college unit named after its document's furniture", async () => {
    const rows = await db.quizTopicTranslation.findMany({ where: { language: { in: ["hi", "mr"] }, topic: { retiredAt: null, NOT: { slug: { startsWith: "zz-" } } } }, select: { language: true, name: true, topic: { select: { slug: true } } } });
    for (const r of rows) {
      const clean = translatedNameFor(r.language, r.name);
      if (clean !== r.name) note("bank-translation-names", "FAIL", "server", `${r.topic.slug} ${r.language}: "${r.name}" ${clean ? `should read "${clean}"` : "is no name (a label alone, a summary, or the other language)"}`);
    }
    note("bank-translation-names", "INFO", "server", `${rows.length} live Hindi and Marathi chapter names read`);
    const units = await db.quizTopic.findMany({ where: { audience: "COLLEGE", retiredAt: null, slug: { startsWith: "college-" } }, select: { slug: true, name: true, _count: { select: { questions: { where: { takenDownAt: null } } } } } });
    for (const u of units) {
      const refusal = unitNameRefusal(u.name);
      if (refusal && u._count.questions > 0) note("college-unit-names", "FAIL", "server", `${u.slug}: "${u.name}" is ${refusal} and serves ${u._count.questions} question(s)`);
    }
    note("college-unit-names", "INFO", "server", `${units.length} generated college units read`);
    expect(failsOf("bank-translation-names")).toEqual([]);
    expect(failsOf("college-unit-names")).toEqual([]);
  });
});

d("modules: inventory and payroll (3 October 2026)", () => {
  /**
   * The stored copies the two modules keep, each recomputed from its rows:
   * a place's stock from its movements (and never below nothing), a bill's
   * total from its lines, a payslip's gross, deductions, employer's share
   * and net from its lines (net = gross − deductions), a run's totals from
   * its slips, and a LOCKED run's slips against the digest taken at the
   * lock — a locked run never changes.
   */
  it("inventory-stock: every place's stock is the sum of its movements, never below nothing", async () => {
    for (const s of schools) {
      const rows = await db.inventoryStock.findMany({ where: { schoolId: s.id }, select: { itemId: true, location: true, quantity: true, item: { select: { code: true } } } });
      const sums = await db.stockMovement.groupBy({ by: ["itemId", "location"], where: { schoolId: s.id }, _sum: { delta: true } });
      const byKey = new Map(sums.map((x) => [`${x.itemId}|${x.location}`, x._sum.delta ?? 0]));
      for (const r of rows) {
        const want = byKey.get(`${r.itemId}|${r.location}`) ?? 0;
        if (r.quantity !== want) note("inventory-stock", "FAIL", s.name, `${r.item.code} at ${r.location}: stored ${r.quantity}, movements add to ${want}`);
        if (r.quantity < 0) note("inventory-stock", "FAIL", s.name, `${r.item.code} at ${r.location} is ${r.quantity}`);
      }
      for (const [key, sum] of byKey) if (!rows.some((r) => `${r.itemId}|${r.location}` === key) && sum !== 0) note("inventory-stock", "FAIL", s.name, `movements at ${key} add to ${sum} with no stock row`);
      if (rows.length) note("inventory-stock", "INFO", s.name, `${rows.length} stock rows checked`);
    }
    expect(failsOf("inventory-stock")).toEqual([]);
  });

  it("inventory-purchase: a bill's total is the sum of its lines", async () => {
    for (const s of schools) {
      const bills = await db.purchaseRecord.findMany({ where: { schoolId: s.id }, select: { invoiceRef: true, linesJson: true, totalPaise: true } });
      for (const b of bills) {
        const lines = JSON.parse(b.linesJson) as { quantity: number; unitPaise: number; totalPaise: number }[];
        const sumLines = lines.reduce((a, l) => a + l.quantity * l.unitPaise, 0);
        if (sumLines !== b.totalPaise) note("inventory-purchase", "FAIL", s.name, `${b.invoiceRef}: stored ${b.totalPaise}, lines add to ${sumLines}`);
        for (const l of lines) if (l.totalPaise !== l.quantity * l.unitPaise) note("inventory-purchase", "FAIL", s.name, `${b.invoiceRef}: a line's total ${l.totalPaise} ≠ ${l.quantity} × ${l.unitPaise}`);
      }
    }
    expect(failsOf("inventory-purchase")).toEqual([]);
  });

  it("payroll-slip: each slip's figures are its lines', and net = gross − deductions", async () => {
    const { totalsOf } = await import("@/lib/payroll-rules");
    for (const s of schools) {
      const slips = await db.payslip.findMany({ where: { schoolId: s.id }, select: { staffName: true, linesJson: true, grossPaise: true, deductionsPaise: true, employerPaise: true, netPaise: true, run: { select: { month: true } } } });
      for (const p of slips) {
        const want = totalsOf(JSON.parse(p.linesJson));
        if (p.netPaise !== p.grossPaise - p.deductionsPaise) note("payroll-slip", "FAIL", s.name, `${p.run.month} ${p.staffName}: net ${p.netPaise} ≠ ${p.grossPaise} − ${p.deductionsPaise}`);
        for (const k of ["grossPaise", "deductionsPaise", "employerPaise", "netPaise"] as const) if (p[k] !== want[k]) note("payroll-slip", "FAIL", s.name, `${p.run.month} ${p.staffName}: stored ${k} ${p[k]}, lines add to ${want[k]}`);
      }
      if (slips.length) note("payroll-slip", "INFO", s.name, `${slips.length} payslips checked`);
    }
    expect(failsOf("payroll-slip")).toEqual([]);
  });

  it("payroll-run: a run's totals are its slips', and a locked run's slips are as they were at the lock", async () => {
    const { slipDigest } = await import("@/lib/payroll-rules");
    for (const s of schools) {
      const runs = await db.payrollRun.findMany({ where: { schoolId: s.id }, select: { id: true, month: true, status: true, headcount: true, grossPaise: true, deductionsPaise: true, employerPaise: true, netPaise: true, lockDigest: true } });
      for (const r of runs) {
        const slips = await db.payslip.findMany({ where: { runId: r.id } });
        const sum = (k: "grossPaise" | "deductionsPaise" | "employerPaise" | "netPaise") => slips.reduce((a, x) => a + x[k], 0);
        if (r.headcount !== slips.length) note("payroll-run", "FAIL", s.name, `${r.month}: headcount ${r.headcount}, ${slips.length} slips`);
        // The run's totals are stored 64-bit (TA-114) and come back as bigint: compared as bigint, exactly.
        for (const k of ["grossPaise", "deductionsPaise", "employerPaise", "netPaise"] as const) if (r[k] !== BigInt(sum(k))) note("payroll-run", "FAIL", s.name, `${r.month}: stored ${k} ${r[k]}, slips add to ${sum(k)}`);
        if (r.status === "LOCKED" || r.status === "PAID") {
          if (!r.lockDigest) note("payroll-run", "FAIL", s.name, `${r.month} is locked with no digest`);
          else if (slipDigest(slips) !== r.lockDigest) note("payroll-run", "FAIL", s.name, `${r.month} changed after it was locked`);
        }
      }
      if (runs.length) note("payroll-run", "INFO", s.name, `${runs.length} runs (${runs.filter((r) => r.status === "LOCKED").length} locked) checked`);
    }
    expect(failsOf("payroll-run")).toEqual([]);
  });

  it("payroll-paid: a run is PAID exactly when every slip with money due has one live payment for its whole net (owner-batch-item2b)", async () => {
    for (const s of schools) {
      const runs = await db.payrollRun.findMany({ where: { schoolId: s.id, status: { in: ["LOCKED", "PAID"] } }, select: { id: true, month: true, status: true, paidAt: true } });
      let payments = 0;
      for (const r of runs) {
        const [slips, live] = await Promise.all([db.payslip.findMany({ where: { runId: r.id }, select: { id: true, staffName: true, netPaise: true } }), db.salaryPayment.findMany({ where: { runId: r.id, voidedAt: null }, select: { payslipId: true, amountPaise: true, liveSlipId: true } })]);
        payments += live.length;
        const bySlip = new Map<string, number>();
        for (const p of live) bySlip.set(p.payslipId, (bySlip.get(p.payslipId) ?? 0) + 1);
        for (const sl of slips) {
          const n = bySlip.get(sl.id) ?? 0;
          if (n > 1) note("payroll-paid", "FAIL", s.name, `${r.month} ${sl.staffName}: ${n} live payments`);
          const p = live.find((x) => x.payslipId === sl.id);
          if (p && p.amountPaise !== sl.netPaise) note("payroll-paid", "FAIL", s.name, `${r.month} ${sl.staffName}: paid ${p.amountPaise}, net ${sl.netPaise}`);
          if (p && p.liveSlipId !== sl.id) note("payroll-paid", "FAIL", s.name, `${r.month} ${sl.staffName}: a live payment without its liveSlipId`);
        }
        const due = slips.filter((x) => x.netPaise > 0);
        const allPaid = due.length > 0 && due.every((x) => bySlip.has(x.id));
        if (allPaid !== (r.status === "PAID")) note("payroll-paid", "FAIL", s.name, `${r.month} is ${r.status} with ${due.filter((x) => bySlip.has(x.id)).length} of ${due.length} slips paid`);
        if ((r.status === "PAID") !== Boolean(r.paidAt)) note("payroll-paid", "FAIL", s.name, `${r.month} is ${r.status} with paidAt ${r.paidAt ? "set" : "empty"}`);
      }
      if (runs.length) note("payroll-paid", "INFO", s.name, `${runs.length} frozen runs, ${payments} live payments checked`);
    }
    expect(failsOf("payroll-paid")).toEqual([]);
  });
});

d("modules: the college's academics (4 October 2026)", () => {
  /**
   * The one stored derived value of the academics module: an offering's
   * internal totals, frozen into InternalLock by the HOD's lock (one writer,
   * lockInternal). Recomputed here from the marks and the components'
   * maxima and weights with the same arithmetic (lockTotals); after a lock
   * nothing may change, so a difference is a write that got past the 409.
   * Read at the audited schools and at ZZ Vidya College, where the fixture
   * locks PHY101. Attendance percentages and outcome attainment are computed
   * on read and stored nowhere, so they need no check.
   */
  it("academics-internal-lock: a locked offering's totals are its marks × weights, out of the scheme's internal total", async () => {
    const { lockTotals } = await import("@/lib/academics-assessment");
    const audited = await alsoReading(["zz-vidya-college"]);
    for (const s of audited) {
      const locks = await db.internalLock.findMany({ where: { schoolId: s.id }, select: { offeringId: true, outOf: true, totalsJson: true, offering: { select: { course: { select: { code: true, scheme: { select: { passingRules: true } } } } } } } });
      for (const l of locks) {
        const stored = JSON.parse(l.totalsJson) as { studentMembershipId: string; totalHundredths: number }[];
        const components = await db.internalComponent.findMany({ where: { offeringId: l.offeringId }, select: { id: true, maxMarks: true, weight: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } });
        const want = lockTotals(components, stored.map((x) => x.studentMembershipId));
        for (const w of want) {
          const got = stored.find((x) => x.studentMembershipId === w.studentMembershipId)!;
          if (got.totalHundredths !== w.totalHundredths) note("academics-internal-lock", "FAIL", s.name, `${l.offering.course.code}: stored ${got.totalHundredths / 100}, marks give ${w.totalHundredths / 100}`);
        }
        const weights = components.reduce((a, c) => a + c.weight, 0);
        if (weights !== l.outOf) note("academics-internal-lock", "FAIL", s.name, `${l.offering.course.code}: weights add to ${weights}, locked out of ${l.outOf}`);
        if (stored.some((x) => x.totalHundredths > l.outOf * 100)) note("academics-internal-lock", "FAIL", s.name, `${l.offering.course.code}: a total above ${l.outOf}`);
      }
      if (locks.length) note("academics-internal-lock", "INFO", s.name, `${locks.length} locked offerings checked`);
    }
    expect(failsOf("academics-internal-lock")).toEqual([]);
  });

  /**
   * ONE PRN (the integration builder, 4 Oct 2026). The office's record
   * (PupilRecord.prn, written by the admission and by the seat page) is the
   * truth; the academic seat's prn (StudentProgramme.prn) is its copy, written
   * in the same transaction. A seat whose PRN differs from its record's is a
   * write that went round the one writer.
   */
  it("college-prn: the seat's PRN is the record's", async () => {
    const colleges = await db.school.findMany({ where: { kind: { in: ["COLLEGE", "AUTONOMOUS_COLLEGE"] }, ...(SCOPE.length ? { id: { in: schools.map((s) => s.id) } } : { OR: [{ slug: { startsWith: "zz-" } }, { id: { in: schools.map((s) => s.id) } }, { slug: "saraswati-college" }] }) }, select: { id: true, name: true } });
    for (const s of colleges) {
      const seats = await db.studentProgramme.findMany({ where: { schoolId: s.id }, select: { prn: true, student: { select: { studentCode: true, pupilRecord: { select: { prn: true } } } } } });
      let checked = 0;
      for (const seat of seats) {
        const record = seat.student.pupilRecord;
        if (!record) continue;
        checked += 1;
        if (record.prn !== null && seat.prn !== record.prn) note("college-prn", "FAIL", s.name, `${seat.student.studentCode ?? "a student"}: seat ${seat.prn ?? "none"}, record ${record.prn}`);
        if (record.prn === null && seat.prn !== null) note("college-prn", "WARN", s.name, `${seat.student.studentCode ?? "a student"}: the seat holds ${seat.prn} and the record none`);
      }
      if (checked) note("college-prn", "INFO", s.name, `${checked} seats checked against their records`);
    }
    expect(failsOf("college-prn")).toEqual([]);
  });
});

d("modules: the college exam cell (4 October 2026)", () => {
  /**
   * The exam cell's stored copies, each recomputed from its rows, at the
   * audited schools and the two ZZ colleges: a term result's SGPA is
   * Σ credits × points ÷ Σ credits of the run's own course rows (the regular
   * courses; every course in a backlog-only sitting) — its one writer is the
   * run; and an autonomous college's printing list counts the seats in its
   * hall, with the spare on top.
   */
  const examSchools = () => alsoReading(["zz-vidya-college", "zz-shastri-college"]);

  it("exam-sgpa: a term result's SGPA is its course rows' Σ credits × points ÷ Σ credits", async () => {
    const { sgpaCourses } = await import("@/lib/exam-cell-marks");
    const { sgpaHundredths } = await import("@/lib/exam-cell-rules");
    for (const s of await examSchools()) {
      const terms = await db.termResult.findMany({ where: { schoolId: s.id }, select: { runId: true, studentMembershipId: true, sgpaHundredths: true, creditsAttemptedTenths: true, creditsEarnedTenths: true } });
      for (const term of terms) {
        const rows = await db.courseResult.findMany({ where: { runId: term.runId, studentMembershipId: term.studentMembershipId }, select: { kind: true, creditsTenths: true, pointsTenths: true, status: true } });
        const over = sgpaCourses(rows);
        const want = sgpaHundredths(over);
        if (term.sgpaHundredths !== want) note("exam-sgpa", "FAIL", s.name, `run ${term.runId} student ${term.studentMembershipId}: stored ${term.sgpaHundredths}, rows give ${want}`);
        const attempted = over.reduce((a, r) => a + r.creditsTenths, 0);
        const earned = over.filter((r) => r.status === "PASS").reduce((a, r) => a + r.creditsTenths, 0);
        if (term.creditsAttemptedTenths !== attempted || term.creditsEarnedTenths !== earned) note("exam-sgpa", "FAIL", s.name, `run ${term.runId} student ${term.studentMembershipId}: credits ${term.creditsEarnedTenths}/${term.creditsAttemptedTenths}, rows give ${earned}/${attempted}`);
      }
      if (terms.length) note("exam-sgpa", "INFO", s.name, `${terms.length} term results checked`);
    }
    expect(failsOf("exam-sgpa")).toEqual([]);
  });

  it("exam-printing: a printing list counts its hall's seats, with the spare on top", async () => {
    for (const s of await examSchools()) {
      const lists = await db.printingList.findMany({ where: { schoolId: s.id }, select: { examRoomId: true, seated: true, spare: true, count: true, room: { select: { name: true, _count: { select: { seats: true } } } } } });
      for (const l of lists) {
        if (l.seated !== l.room._count.seats) note("exam-printing", "WARN", s.name, `${l.room.name}: list says ${l.seated} seated, the hall seats ${l.room._count.seats} now (seating rebuilt after the list)`);
        if (l.count !== (l.seated > 0 ? l.seated + l.spare : 0)) note("exam-printing", "FAIL", s.name, `${l.room.name}: count ${l.count} ≠ ${l.seated} + ${l.spare}`);
      }
      if (lists.length) note("exam-printing", "INFO", s.name, `${lists.length} printing lists checked`);
    }
    expect(failsOf("exam-printing")).toEqual([]);
  });
});

d("modules: the IQAC desk (4 October 2026)", () => {
  /**
   * The IQAC module's stored copies, each recomputed from its rows: a NAAC
   * cycle's CGPA (one writer, writeCycleCgpa) against the CGPA of the latest
   * score of every metric; a filing's hash against its body, and the figures
   * a regenerated filing gives against the ones it printed (drift is a WARN:
   * the college's records moved on after it filed); a grievance's due date
   * against fifteen working days from its filing; the disclosure's hash
   * against its snapshot; that no anonymous survey's response names its
   * respondent; and a faculty record's PAN against payroll's copy (a WARN:
   * two sealed copies the office keeps). Read at the audited schools and at
   * ZZ Vidya College, where the fixture keeps a cycle and a filed AQAR, and ZZ
   * Shastri, where it keeps an engineering department's NBA SAR (5 Oct 2026).
   */
  const audited = () => alsoReading(["zz-vidya-college", "zz-shastri-college"]);
  const sha = async (text: string) => (await import("node:crypto")).createHash("sha256").update(text).digest("hex");

  it("iqac-cgpa: a cycle's stored CGPA is the CGPA of its latest metric scores", async () => {
    const { cgpaFromRows } = await import("@/lib/iqac");
    for (const s of await audited()) {
      const cycles = await db.accreditationCycle.findMany({ where: { schoolId: s.id }, select: { id: true, framework: true, cgpa: true } });
      for (const c of cycles) {
        const want = await cgpaFromRows(c.id, c.framework);
        if (c.cgpa !== null && Math.abs(c.cgpa - want) > 0.001) note("iqac-cgpa", "FAIL", s.name, `cycle ${c.id}: stored ${c.cgpa}, scores give ${want}`);
      }
      if (cycles.length) note("iqac-cgpa", "INFO", s.name, `${cycles.length} NAAC cycle(s) checked`);
    }
    expect(failsOf("iqac-cgpa")).toEqual([]);
  });

  // The simulator's saved scenarios (5 Oct 2026): IqacScenario.cgpa and .marks are stored copies with one writer
  // (iqac-insights.ts writeScenario); each is recomputed from the scenario's own inputs by the same pure functions.
  it("iqac-scenario: a saved scenario's stored result is the recompute of its own figures", async () => {
    const { NAAC_FRAMEWORKS, naacScenarioInputsSchema, nbaInputsSchema } = await import("@edulink/contracts");
    const { nbaTotals, simulateNaac } = await import("@/lib/accreditation-insights");
    for (const s of await audited()) {
      const rows = await db.iqacScenario.findMany({ where: { schoolId: s.id }, select: { id: true, kind: true, inputsJson: true, cgpa: true, marks: true, cycle: { select: { framework: true } } } });
      for (const r of rows) {
        if (r.kind === "NBA") {
          const inputs = nbaInputsSchema.safeParse(JSON.parse(r.inputsJson));
          if (!inputs.success) note("iqac-scenario", "FAIL", s.name, `scenario ${r.id}: its figures do not read`);
          else if (r.marks === null || Math.abs(r.marks - nbaTotals(inputs.data).total) > 0.001) note("iqac-scenario", "FAIL", s.name, `scenario ${r.id}: stored ${r.marks}, figures give ${nbaTotals(inputs.data).total}`);
          continue;
        }
        const inputs = naacScenarioInputsSchema.safeParse(JSON.parse(r.inputsJson));
        const fw = NAAC_FRAMEWORKS[(r.cycle?.framework ?? "AFFILIATED_UG") as keyof typeof NAAC_FRAMEWORKS];
        if (!inputs.success || !fw) note("iqac-scenario", "FAIL", s.name, `scenario ${r.id}: its figures do not read`);
        else if (r.cgpa === null || Math.abs(r.cgpa - simulateNaac(fw, inputs.data).cgpa) > 0.001) note("iqac-scenario", "FAIL", s.name, `scenario ${r.id}: stored ${r.cgpa}, figures give ${simulateNaac(fw, inputs.data).cgpa}`);
      }
      if (rows.length) note("iqac-scenario", "INFO", s.name, `${rows.length} saved scenario(s) checked`);
    }
    expect(failsOf("iqac-scenario")).toEqual([]);
  });

  // The attendance devices (R-2, risks batch, 5 Oct 2026): AttendanceDevice.keyLast4 is a stored copy of the sealed
  // key's last four with one writer (attendance-devices.ts issueDeviceKey); the key is opened here and compared.
  // A device whose key does not open (FEES_SECRET_KEY changed, or the row was moved) is a FAIL: it can punch nothing.
  it("punch-key: a device's last four are its sealed key's, and the key opens", async () => {
    const { open, sealingAvailable } = await import("@/lib/secret-box");
    if (!sealingAvailable()) {
      note("punch-key", "INFO", "server", "FEES_SECRET_KEY is not set: device keys not opened");
      return;
    }
    for (const s of await audited()) {
      const devices = await db.attendanceDevice.findMany({ where: { schoolId: s.id, keySealed: { not: "" } }, select: { id: true, name: true, keySealed: true, keyLast4: true } });
      for (const d of devices) {
        let key: string | null = null;
        try {
          key = open(d.keySealed, `punch:${s.id}:${d.id}`);
        } catch {
          key = null;
        }
        if (key === null) note("punch-key", "FAIL", s.name, `device ${d.name}: its key does not open`);
        else if (key.slice(-4) !== d.keyLast4) note("punch-key", "FAIL", s.name, `device ${d.name}: stored last four ${d.keyLast4}, the key ends ${key.slice(-4)}`);
      }
      if (devices.length) note("punch-key", "INFO", s.name, `${devices.length} device key(s) opened and checked`);
    }
    expect(failsOf("punch-key")).toEqual([]);
  });

  // The councils' returns (5 Oct 2026) are checked the same way: an NBA SAR is rebuilt for its own department.
  it("iqac-filing: a filing's hash is its body's, and regenerating it from the rows gives the figures it printed", async () => {
    const { buildFiling } = await import("@/lib/iqac-filings");
    for (const s of await audited()) {
      const filings = await db.collegeFiling.findMany({ where: { schoolId: s.id }, select: { id: true, kind: true, year: true, cycleId: true, departmentId: true, body: true, hash: true, figuresJson: true } });
      for (const f of filings) {
        if ((await sha(f.body)) !== f.hash) note("iqac-filing", "FAIL", s.name, `${f.kind} ${f.year}: the body no longer matches its hash`);
        const again = await buildFiling(s.id, f.kind as never, f.year, f.cycleId, f.departmentId);
        const stored = JSON.parse(f.figuresJson) as Record<string, number>;
        const moved = Object.keys({ ...stored, ...again.figures }).filter((k) => stored[k] !== again.figures[k]);
        if (moved.length) note("iqac-filing", "WARN", s.name, `${f.kind} ${f.year}: the records moved on since it was generated (${moved.slice(0, 5).map((k) => `${k} ${stored[k]}→${again.figures[k]}`).join(", ")})`);
      }
      if (filings.length) note("iqac-filing", "INFO", s.name, `${filings.length} filing(s) regenerated and compared`);
    }
    expect(failsOf("iqac-filing")).toEqual([]);
  });

  it("iqac-grievance: a grievance is due fifteen working days after it was filed; an anonymous survey names nobody; the disclosure is its snapshot", async () => {
    const { addWorkingDays } = await import("@/lib/iqac-rules");
    for (const s of await audited()) {
      const grievances = await db.grievance.findMany({ where: { schoolId: s.id }, select: { id: true, filedAt: true, dueOn: true } });
      for (const g of grievances) {
        const filed = new Date(g.filedAt.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
        if (g.dueOn !== addWorkingDays(filed, 15)) note("iqac-grievance", "FAIL", s.name, `grievance ${g.id}: due ${g.dueOn}, fifteen working days from ${filed} is ${addWorkingDays(filed, 15)}`);
      }
      const named = await db.surveyResponse.count({ where: { schoolId: s.id, respondentMembershipId: { not: null }, survey: { kind: { not: "COURSE_FEEDBACK" } } } });
      if (named) note("iqac-grievance", "FAIL", s.name, `${named} response(s) to an anonymous survey carry a membership id`);
      const page = await db.disclosurePage.findUnique({ where: { schoolId: s.id }, select: { snapshotJson: true, hash: true } });
      if (page && (await sha(page.snapshotJson)) !== page.hash) note("iqac-grievance", "FAIL", s.name, "the published disclosure no longer matches its hash");
      const records = await db.facultyRecord.findMany({ where: { schoolId: s.id, panLast4: { not: null } }, select: { membershipId: true, panLast4: true } });
      for (const r of records) {
        const salary = await db.staffSalary.findFirst({ where: { membershipId: r.membershipId, panLast4: { not: null } }, orderBy: { effectiveFromKey: "desc" }, select: { panLast4: true } });
        if (salary && salary.panLast4 !== r.panLast4) note("iqac-grievance", "WARN", s.name, `faculty record ${r.membershipId}: PAN ending ${r.panLast4}, payroll's ends ${salary.panLast4}`);
      }
      if (grievances.length) note("iqac-grievance", "INFO", s.name, `${grievances.length} grievance(s) checked`);
    }
    expect(failsOf("iqac-grievance")).toEqual([]);
  });
});

d("modules: placement (4 October 2026)", () => {
  /**
   * The placement module keeps one stored copy of derived figures: the
   * season row (PlacementSeason), the table as the cell published it. Each is
   * recomputed from the offers and the profiles (src/lib/placement-analytics.ts
   * `seasonDrift`): FAIL when nothing changed since it was published, WARN
   * when an offer or a profile changed afterwards (republish to bring it in
   * step). An AICTE programme's internship credits never pass the AICTE
   * maximum (TA-469, TA-495: other regulators' programmes are not held to it).
   */
  it("placement-season: a published season is what the offers and profiles give; internship credits stay within the policy", async () => {
    const { seasonDrift } = await import("@/lib/placement-analytics");
    const { AICTE_INTERNSHIP_BTECH } = await import("@edulink/contracts");
    const audited = await alsoReading(["zz-vidya-college"]);
    for (const s of audited) {
      const seasons = await db.placementSeason.count({ where: { schoolId: s.id } });
      for (const f of await seasonDrift(s.id)) note("placement-season", f.level, s.name, `batch ${f.batchYear}: ${f.detail}`);
      const credited = await db.internship.groupBy({ by: ["studentMembershipId"], where: { schoolId: s.id, status: "CREDITED" }, _sum: { credits: true } });
      // The 20 credits are AICTE's (the owner's decision on TA-469 and TA-495): read for a student of an AICTE programme and for one with no
      // seat, whom the library holds to it as before; a programme under another regulator stops at its own total credits, not checked here.
      const seats = await db.studentProgramme.findMany({ where: { schoolId: s.id, studentMembershipId: { in: credited.map((c) => c.studentMembershipId) } }, select: { studentMembershipId: true, programme: { select: { regulator: true } } } });
      const regulator = new Map(seats.map((x) => [x.studentMembershipId, x.programme.regulator]));
      for (const c of credited) if ((regulator.get(c.studentMembershipId) ?? "AICTE") === "AICTE" && (c._sum.credits ?? 0) > AICTE_INTERNSHIP_BTECH.creditsMax) note("placement-season", "FAIL", s.name, `student ${c.studentMembershipId}: ${c._sum.credits} internship credits, past the policy's ${AICTE_INTERNSHIP_BTECH.creditsMax}`);
      if (seasons || credited.length) note("placement-season", "INFO", s.name, `${seasons} season row(s) and ${credited.length} students' internship credits checked`);
    }
    expect(failsOf("placement-season")).toEqual([]);
  });
});

d("modules: college admissions (G4-18, 5 October 2026)", () => {
  /**
   * The admission fee is written to the ledger after the admission's own transaction (college-admissions.ts,
   * kept on 4 October): FAIL when an admitted seat had its fee recorded as received, with a fee structure, and
   * no payment row carries the admission's clientId (tests/data-audit-admission-fee.ts). Read at the audited
   * schools (the demo colleges among them); ZZ Vidya's fixture seat is written by hand, not admitted, and is not read.
   */
  it("admission-fee: an admitted seat with its fee recorded has its payment row", async () => {
    for (const s of schools) {
      const { checked, gaps } = await admittedWithoutPayment(db, s.id);
      for (const g of gaps) note("admission-fee", "FAIL", s.name, `application ${g.number} (${g.applicantName}): admitted with ₹${(g.feePaise / 100).toFixed(2)} recorded as received and no payment row`);
      if (checked) note("admission-fee", "INFO", s.name, `${checked} admitted seat(s) with a fee checked for their payment row`);
    }
    expect(failsOf("admission-fee")).toEqual([]);
  });
});

d("the audit's scope (S4B-3, 5 October 2026)", () => {
  // Runs last: every check above has noted what it found. Lines that name no school ("platform", "all", "server") are the platform's.
  it("scope: a run scoped by DATA_AUDIT_SCHOOLS reports on the schools it names and no other", async () => {
    if (!SCOPE.length) return;
    const named = new Set(schools.map((s) => s.name));
    const labels = [...new Set(findings.map((f) => f.school))].filter((l) => !named.has(l));
    const others = new Set((await db.school.findMany({ where: { name: { in: labels } }, select: { name: true } })).map((s) => s.name));
    expect([...new Set(findings.filter((f) => others.has(f.school)).map((f) => `${f.check}: ${f.school}`))]).toEqual([]);
  });
});
