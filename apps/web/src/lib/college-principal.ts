import "server-only";
import { db } from "./db";
import { AccessError } from "./access-error";
import { enabledModules, institutionKindOf } from "./modules";
import { isCollegeKind } from "@edulink/contracts";
import { todayKey } from "./dates";
import type { ActiveContext } from "./session";
import { academicsSettings, currentTerm, loadAndRatios } from "./academics";
import { lectureDayByDepartment, listCondonations } from "./academics-attendance";
import { listLateRegistrations } from "./academics-registration";
import { attainmentForOffering } from "./academics-coursefile";
import { staffRegister } from "./staff-attendance";
import { schoolLeave } from "./leave";
import { listIncidents } from "./incidents";
import { accountsOverview, financeTable } from "./accounts";
import { pendingConcessions } from "./college-fees";
import { listClaims } from "./scholarships";
import { hostelTable } from "./college-campus";
import { iqacOverview, listCommittees } from "./iqac";
import { listFilings } from "./iqac-filings";
import { examCellHome } from "./exam-cell";
import { examAnalytics, resultsForDepartment } from "./exam-cell-marks";
import { placementSummary } from "./placement-analytics";
import { alumniCollegeAdmin } from "./placement-alumni";
import { payrollSummary } from "./payroll";
import { headApprovalCounts } from "./head-approvals";

/**
 * THE PRINCIPAL'S COLLEGE (the integration builder, 4 October 2026).
 *
 * One read of the whole college for the head, at /principal/college (and
 * /principal sends a college's head there). NOTHING IS COMPUTED HERE: every
 * figure is a call to the function the owning module exposes — academics'
 * lectures by department, load and ratios and CO/PO attainment; the staff
 * register; the leave queue; the accounts overview and finance table; the
 * scholarship claims; the hostel table; the IQAC overview (the predictor's
 * grade, the ten cheapest metrics, NIRF, grievances, filings); the exam cell's
 * grace queue, analytics and department results; the placement summary and
 * the alumni office's batches; payroll's summary — or a plain count of rows
 * the module already keeps (the payroll runs shared with the head).
 *
 * A MODULE THAT IS OFF IS A NULL SECTION, not an error: each read runs in
 * `section()`, which returns null for a module the college has not switched
 * on and logs anything else, so one module's fault never blanks the page.
 *
 * APPROVALS are counts with the page where the decision is made; the
 * decision itself is the owning module's action, written as its audit row,
 * which the decision log (decision-log.ts) reads back. Not built anywhere,
 * so not shown: a refund outside the slab and a hostel expulsion (the office
 * builder's "not built" list) — built since (5 Oct 2026, head-approvals.ts), each a line here with its page.
 */

async function section<T>(label: string, read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof AccessError) return null;
    console.error(`[principal college: ${label}]`, error);
    return null;
  }
}

export type ApprovalLine = { key: "leave" | "condonation" | "concession" | "grace" | "lateRegistration" | "signoff" | "payroll" | "refundException" | "expulsion"; count: number; href: string };

export async function principalCollege(ctx: ActiveContext) {
  if (!ctx.schoolId || (ctx.role !== "PRINCIPAL" && ctx.role !== "ADMIN")) throw new AccessError("access.wrongRoleForThisAction");
  const schoolId = ctx.schoolId;
  const kind = await institutionKindOf(schoolId);
  if (!isCollegeKind(kind)) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const [school, modules] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, timezone: true, affiliatingUniversity: true, naacGrade: true, naacValidUntil: true } }),
    enabledModules(schoolId),
  ]);
  const on = (m: string) => (modules as readonly string[]).includes(m);
  const today = todayKey(school.timezone);
  const term = await currentTerm(schoolId, today);

  // The college at a glance, and the queues (one wave).
  const [lectures, register, leave, incidents, accounts, claims, hostel, iqac, filings, examHome, condonations, concessions, lates, sharedRuns] = await Promise.all([
    section("lectures", () => lectureDayByDepartment(schoolId, today)),
    section("staff register", () => staffRegister(ctx)),
    section("leave", () => schoolLeave(ctx, "PENDING")),
    section("incidents", () => listIncidents(ctx, { status: "OPEN", page: 1 })),
    section("accounts", () => accountsOverview(ctx)),
    on("SCHOLARSHIPS") ? section("scholarships", () => listClaims(ctx, {})) : null,
    on("HOSTEL") ? section("hostel", () => hostelTable(schoolId)) : null,
    on("IQAC") ? section("iqac", () => iqacOverview(ctx)) : null,
    on("IQAC") ? section("filings", () => listFilings(ctx)) : null,
    on("EXAMS") ? section("exam cell", () => examCellHome(ctx)) : null,
    section("condonations", () => listCondonations(ctx, "OPEN")),
    section("concessions", () => pendingConcessions(ctx)),
    section("late registrations", () => listLateRegistrations(ctx)),
    on("PAYROLL") ? section("payroll shared", () => db.payrollRun.count({ where: { schoolId, status: "DRAFT", sharedWithPrincipal: true } })) : null,
  ]);

  const faculty = register ? register.rows.filter((r) => r.role === "FACULTY" || r.role === "HOD") : null;
  const facultyToday = faculty
    ? {
        total: faculty.length,
        present: faculty.filter((r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "HALF_DAY").length,
        onLeave: faculty.filter((r) => r.status === "ON_LEAVE").length,
        absent: faculty.filter((r) => r.status === "ABSENT").length,
        unmarked: faculty.filter((r) => r.status === null).length,
        closed: register!.closed,
      }
    : null;

  const fees = accounts
    ? {
        year: accounts.year?.name ?? null,
        demandPaise: accounts.collection.reduce((a, c) => a + c.demandPaise, 0),
        collectedPaise: accounts.collection.reduce((a, c) => a + c.collectedPaise, 0),
        outstandingPaise: accounts.collection.reduce((a, c) => a + c.outstandingPaise, 0),
        defaulters: accounts.defaulters.length,
        receivablePaise: accounts.receivableAgeing.reduce((a, b) => a + b.receivablePaise, 0),
        scholarshipsDisbursedPaise: accounts.incomeExpense.scholarshipsDisbursedPaise,
      }
    : null;
  const scholarships = claims
    ? {
        applied: claims.items.filter((c) => c.status === "APPLIED").length,
        sanctioned: claims.items.filter((c) => c.status === "SANCTIONED").length,
        disbursed: claims.items.filter((c) => c.status === "DISBURSED").length,
        sanctionedPaise: claims.items.reduce((a, c) => a + (c.sanctionedPaise ?? 0), 0),
        disbursedPaise: claims.items.reduce((a, c) => a + (c.disbursedPaise ?? 0), 0),
      }
    : null;

  const heads = await headApprovalCounts(schoolId);
  const approvals: ApprovalLine[] = [
    { key: "leave", count: leave?.length ?? 0, href: "/principal/leave" },
    { key: "condonation", count: condonations?.items.length ?? 0, href: "/admin/academics/condonations" },
    { key: "concession", count: concessions?.items.length ?? 0, href: "/accounts/concessions" },
    { key: "grace", count: examHome?.graceWaiting.length ?? 0, href: "/exam-cell" },
    { key: "lateRegistration", count: lates?.items.filter((l) => l.status === "ASKED").length ?? 0, href: "/admin/academics/registration" },
    { key: "signoff", count: iqac?.counts.awaitingSignoff ?? 0, href: "/principal/accreditation" },
    { key: "payroll", count: sharedRuns ?? 0, href: "/admin/payroll" },
    // The two the college office left (5 Oct 2026, head-approvals.ts), each on its own page.
    ...(on("ADMISSIONS") ? [{ key: "refundException" as const, count: heads.refundException, href: "/admin/college-admissions/refunds" }] : []),
    ...(on("HOSTEL") ? [{ key: "expulsion" as const, count: heads.expulsion, href: "/hostel/expulsions" }] : []),
  ];

  // Results and outcomes: the latest term the exam cell published, by department; the CO/PO attainment of this term's offerings.
  const latestRun = on("EXAMS") ? await db.resultRun.findFirst({ where: { schoolId, status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, select: { session: { select: { termId: true } } } }) : null;
  const resultTermId = latestRun?.session.termId ?? null;
  const departments = await db.department.findMany({ where: { schoolId }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const settings = await academicsSettings(schoolId);
  const offerings = term ? await db.courseOffering.findMany({ where: { schoolId, termId: term.id }, select: { id: true, course: { select: { code: true } } }, orderBy: { course: { code: "asc" } }, take: 24 }) : [];
  const [analytics, byDepartment, loads, attainment, committees, placement, alumni, finance, payroll, resultTerm] = await Promise.all([
    resultTermId ? section("exam analytics", () => examAnalytics(ctx, resultTermId)) : null,
    resultTermId ? Promise.all(departments.map(async (d) => ({ departmentId: d.id, name: d.name, ...(await resultsForDepartment(schoolId, d.id, resultTermId)) }))) : null,
    section("load and ratios", () => loadAndRatios(schoolId, term?.id ?? null, settings)),
    Promise.all(offerings.map(async (o) => ({ offeringId: o.id, code: o.course.code, ...(await attainmentForOffering(o.id)) }))),
    on("IQAC") ? section("committees", () => listCommittees(ctx)) : null,
    on("PLACEMENT") ? section("placement", () => placementSummary(schoolId)) : null,
    on("ALUMNI") ? section("alumni", () => alumniCollegeAdmin(ctx)) : null,
    section("finance table", () => financeTable(schoolId, 3)),
    on("PAYROLL") ? section("payroll", () => payrollSummary(ctx)) : null,
    resultTermId ? db.academicTerm.findFirst({ where: { id: resultTermId, schoolId }, select: { name: true } }) : null,
  ]);

  return {
    school: { name: school.name, affiliatingUniversity: school.affiliatingUniversity, naacGrade: school.naacGrade, naacValidUntil: school.naacValidUntil?.toISOString().slice(0, 10) ?? null },
    today,
    term: term ? { id: term.id, name: term.name } : null,
    modules: [...modules],
    glance: {
      lectures: lectures ?? [],
      faculty: facultyToday,
      fees,
      scholarships,
      hostel,
      grievances: iqac ? { open: iqac.counts.openGrievances, overdue: iqac.counts.overdueGrievances } : null,
      incidentsOpen: incidents?.openCount ?? null,
      predictor: iqac ? { cycle: iqac.cycle, nextBand: iqac.nextBand, cheapest: iqac.cheapest } : null,
      nirf: iqac?.nirf ?? null,
    },
    approvals,
    results: resultTermId
      ? {
          termName: resultTerm?.name ?? "—",
          analytics,
          byDepartment: byDepartment ?? [],
          attainment: attainment.filter((a) => a.pos.length > 0 || a.cos.length > 0),
        }
      : { termName: null, analytics: null, byDepartment: [], attainment: attainment.filter((a) => a.pos.length > 0 || a.cos.length > 0) },
    faculty: {
      load: loads?.load ?? [],
      ratios: loads?.ratios ?? [],
      research: iqac ? { items: iqac.counts.research, activities: iqac.counts.activities } : null,
    },
    governance: { committees: committees?.items ?? null },
    placement,
    alumni: alumni ? { total: alumni.alumni.length, mentors: alumni.batches.reduce((a, b) => a + b.mentors, 0), listed: alumni.batches.reduce((a, b) => a + b.listed, 0), gifts: alumni.gifts.length, meets: alumni.meets.length } : null,
    money: { finance: finance?.years ?? [], payrollByDepartment: payroll?.costByDepartment ?? null, latestPayrollMonth: payroll?.latestLockedMonth ?? null },
    accreditation: filings ? filings.items.filter((f) => f.status === "AWAITING_SIGNOFF" || f.status === "SIGNED_OFF" || f.status === "FILED").slice(0, 8) : null,
  };
}

export type PrincipalCollege = Awaited<ReturnType<typeof principalCollege>>;
