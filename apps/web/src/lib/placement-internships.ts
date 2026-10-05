import "server-only";
import { AICTE_INTERNSHIP_BTECH, INTERNSHIP_DIARY_DAY_HOURS, LAW_INTERNSHIP_WINDOWS, internshipKindsFor, isLawInternshipKind, type InternshipPropose, type InternshipView } from "@edulink/contracts";
import { streamsOf } from "./streams";
import { db } from "./db";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn } from "./modules";
import { readJson, writeJson } from "./json";
import { nameOf, spendTicket } from "./placement";
import { todayKey } from "./dates";
import { zoneOf } from "./academics";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * INTERNSHIPS UNDER THE AICTE POLICY (the placement module, 4 October 2026;
 * the rule and its source are AICTE_INTERNSHIP_BTECH in packages/contracts).
 *
 *   PROPOSED   the student names the company or institution, the kind
 *              (industry, research, the family's business), the dates, the
 *              hours and the window — after semester 2, 4 or 6
 *   APPROVED   the cell (TPO) or the HOD approves it, naming the faculty
 *              member who supervises; or REFUSED with a reason
 *   SUBMITTED  the student has kept the diary and handed in the report
 *   EVALUATED  the industry supervisor's grade, the faculty visit and the
 *              viva are recorded (the supervising faculty, the HOD or the cell)
 *   CREDITED   the cell or the HOD decides the credits — never computed from
 *              the hours here — and the programme's running total may not
 *              pass the policy's maximum. A family business needs the
 *              parent's declaration first.
 *
 * `credits` has ONE WRITER, `evaluateInternship`; the exam cell reads it
 * through `internshipCredits` / `internshipCreditsForTerm` below.
 */

type Tx = typeof db;
const DECIDERS: readonly Role[] = ["TPO", "HOD"];
const EVALUATORS: readonly Role[] = ["TPO", "HOD", "FACULTY"];
const READERS: readonly Role[] = ["TPO", "HOD", "FACULTY", "ADMIN", "PRINCIPAL"];

async function staffOf(ctx: ActiveContext, roles: readonly Role[]) {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PLACEMENT");
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId, userId: ctx.user.id, role: ctx.role };
}

/**
 * An HOD reads and decides the internships of their own department's
 * students (the academics module's Department they head, by the programme
 * of each student's seat); an HOD who heads no department yet reads the
 * college's. Null means "no narrowing".
 */
export async function hodStudents(me: { schoolId: string; membershipId: string; role: Role }): Promise<Set<string> | null> {
  if (me.role !== "HOD") return null;
  const dept = await db.department.findFirst({ where: { schoolId: me.schoolId, hodMembershipId: me.membershipId }, select: { id: true } });
  if (!dept) return null;
  const seats = await db.studentProgramme.findMany({ where: { schoolId: me.schoolId, programme: { departmentId: dept.id } }, select: { studentMembershipId: true } });
  return new Set(seats.map((x) => x.studentMembershipId));
}

type Row = Awaited<ReturnType<typeof db.internship.findFirstOrThrow>>;

export async function internshipViews(rows: readonly Row[]): Promise<InternshipView[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.flatMap((r) => [r.studentMembershipId, r.facultyMembershipId].filter((x): x is string => Boolean(x))))];
  const members = await db.membership.findMany({ where: { id: { in: ids } }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  const name = new Map(members.map((m) => [m.id, nameOf(m.user)]));
  return rows.map((r) => ({
    id: r.id,
    studentMembershipId: r.studentMembershipId,
    studentName: name.get(r.studentMembershipId) ?? "",
    companyName: r.companyName,
    kind: r.kind as InternshipView["kind"],
    from: r.fromKey,
    to: r.toKey,
    hours: r.hours,
    credits: r.credits,
    windowSemester: r.windowSemester,
    supervisorName: r.supervisorName,
    facultyMembershipId: r.facultyMembershipId,
    facultyName: r.facultyMembershipId ? (name.get(r.facultyMembershipId) ?? null) : null,
    diary: readJson<{ on: string; hours: number; text: string }[]>(r.diary, []),
    hasReport: Boolean(r.reportFileId),
    reportFileId: r.reportFileId,
    industryGrade: (r.industryGrade as InternshipView["industryGrade"]) ?? null,
    facultyVisitAt: r.facultyVisitAt?.toISOString() ?? null,
    vivaMarks: r.vivaMarks,
    status: r.status as InternshipView["status"],
    needsDeclaration: r.kind === "FAMILY_BUSINESS",
    hasDeclaration: Boolean(r.parentDeclarationFileId),
    declarationFileId: r.parentDeclarationFileId,
    creditedAt: r.creditedAt?.toISOString() ?? null,
  }));
}

export const internshipRule = { creditsMin: AICTE_INTERNSHIP_BTECH.creditsMin, creditsMax: AICTE_INTERNSHIP_BTECH.creditsMax, hoursMin: AICTE_INTERNSHIP_BTECH.hoursMin, hoursMax: AICTE_INTERNSHIP_BTECH.hoursMax, windows: [...AICTE_INTERNSHIP_BTECH.windows] };

async function creditsSoFar(studentMembershipId: string, exceptId?: string): Promise<number> {
  const rows = await db.internship.findMany({ where: { studentMembershipId, status: "CREDITED", ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { credits: true } });
  return rows.reduce((a, r) => a + (r.credits ?? 0), 0);
}

/** A student's own internships, with the credits CREDITED so far. */
export async function myInternships(studentMembershipId: string) {
  const rows = await db.internship.findMany({ where: { studentMembershipId }, orderBy: { fromKey: "desc" } });
  return { internships: await internshipViews(rows), creditsTotal: await creditsSoFar(studentMembershipId) };
}

/** The staff's list: the cell, the HOD, the office and the principal read the college's; a faculty member the internships they supervise. */
export async function listInternships(ctx: ActiveContext) {
  const me = await staffOf(ctx, READERS);
  const department = await hodStudents(me);
  const rows = await db.internship.findMany({
    where: { schoolId: me.schoolId, ...(me.role === "FACULTY" ? { facultyMembershipId: me.membershipId } : {}), ...(department ? { studentMembershipId: { in: [...department] } } : {}) },
    orderBy: [{ status: "asc" }, { fromKey: "desc" }],
    take: 500,
  });
  return { internships: await internshipViews(rows), creditsTotal: null, rule: internshipRule, canDecide: DECIDERS.includes(me.role) };
}

export async function proposeInternship(ctx: ActiveContext, input: InternshipPropose): Promise<InternshipView> {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PLACEMENT");
  if (input.to < input.from) throw new RuleRefusal("placement.refuseInternshipDates", 422, undefined, "to");
  // The kinds a college offers follow its streams (stream records, 5 Oct 2026): a law college's COURT, FIRM and
  // LEGAL_AID, which may sit after semester 8 or 10 too; a management college's SUMMER.
  if (!internshipKindsFor(await streamsOf(ctx.schoolId)).includes(input.kind)) throw new RuleRefusal("streamRecords.refuseInternshipKind", 422, undefined, "kind");
  const windows: readonly number[] = isLawInternshipKind(input.kind) ? LAW_INTERNSHIP_WINDOWS : AICTE_INTERNSHIP_BTECH.windows;
  if (!windows.includes(input.windowSemester)) throw new RuleRefusal("placement.refuseInternshipWindow", 422, undefined, "windowSemester");
  const row = await db.internship.create({
    data: { schoolId: ctx.schoolId, studentMembershipId: ctx.membershipId, companyName: input.companyName, kind: input.kind, fromKey: input.from, toKey: input.to, hours: input.hours, windowSemester: input.windowSemester, supervisorName: input.supervisorName },
  });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "placement.internship.propose", targetType: "Internship", targetId: row.id, meta: { kind: input.kind, window: input.windowSemester } });
  const tpos = await db.membership.findMany({ where: { schoolId: ctx.schoolId, role: { in: ["TPO", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } });
  await Promise.all(tpos.map((p) => notify({ userId: p.userId, schoolId: ctx.schoolId, kind: "SYSTEM", titleKey: "placement.notifInternshipProposed", titleVars: { company: input.companyName }, url: "/placement/internships" }).catch(() => undefined)));
  return (await internshipViews([row]))[0]!;
}

async function ownInternship(ctx: ActiveContext, id: string) {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PLACEMENT");
  const row = await db.internship.findFirst({ where: { id, studentMembershipId: ctx.membershipId } });
  if (!row) throw new AccessError("placement.noSuchInternship", "NOT_FOUND");
  return row;
}

/** A day in the diary: only while the internship is approved or submitted. */
export async function addDiaryEntry(ctx: ActiveContext, id: string, entry: { on: string; hours: number; text: string }): Promise<InternshipView> {
  const row = await ownInternship(ctx, id);
  if (!["APPROVED", "SUBMITTED"].includes(row.status)) throw new RuleRefusal("placement.refuseDiaryState", 409);
  if (entry.on < row.fromKey || entry.on > row.toKey) throw new RuleRefusal("placement.refuseDiaryDate", 422, undefined, "on");
  // A day's hours, all its entries together, stop at the cap the form's field shows (A3-journeys-22): the server's rule, not the browser's.
  const before = readJson<{ on: string; hours: number; text: string }[]>(row.diary, []);
  const that = before.filter((d) => d.on === entry.on).reduce((a, d) => a + (Number(d.hours) || 0), 0);
  if (!(entry.hours > 0) || that + entry.hours > INTERNSHIP_DIARY_DAY_HOURS) throw new RuleRefusal("placement.refuseDiaryHours", 422, { max: INTERNSHIP_DIARY_DAY_HOURS, date: entry.on, have: that }, "hours");
  const diary = [...before, entry].sort((a, b) => a.on.localeCompare(b.on));
  const updated = await db.internship.update({ where: { id }, data: { diary: writeJson(diary) } });
  return (await internshipViews([updated]))[0]!;
}

/** The report (which moves an approved internship to SUBMITTED) or, for a family business, the parent's declaration — each an upload ticket of the student's. */
export async function attachInternshipFile(ctx: ActiveContext, id: string, input: { kind: "REPORT" | "DECLARATION"; fileId: string | null }, opts: { storedFileId?: string | null } = {}): Promise<InternshipView> {
  const row = await ownInternship(ctx, id);
  if (input.kind === "DECLARATION" && row.kind !== "FAMILY_BUSINESS") throw new RuleRefusal("placement.refuseDeclarationKind", 422, undefined, "kind");
  if (input.kind === "REPORT" && !["APPROVED", "SUBMITTED"].includes(row.status)) throw new RuleRefusal("placement.refuseReportState", 409);
  const fileId = opts.storedFileId ?? (await spendTicket(ctx.user.id, input.fileId, "fileId"));
  if (!fileId) throw new RuleRefusal("placement.refuseTicket", 422, undefined, "fileId");
  const updated = await db.internship.update({
    where: { id },
    data: input.kind === "REPORT" ? { reportFileId: fileId, status: row.status === "APPROVED" ? "SUBMITTED" : row.status } : { parentDeclarationFileId: fileId },
  });
  await audit({ schoolId: row.schoolId, actorUserId: ctx.user.id, action: "placement.internship.file", targetType: "Internship", targetId: id, meta: { kind: input.kind } });
  return (await internshipViews([updated]))[0]!;
}

/** The cell or the HOD approves (naming the supervising faculty member) or refuses a proposed internship. */
export async function decideInternship(ctx: ActiveContext, id: string, input: { approve: boolean; facultyMembershipId: string | null; reason: string }): Promise<InternshipView> {
  const me = await staffOf(ctx, DECIDERS);
  const row = await db.internship.findFirst({ where: { id, schoolId: me.schoolId } });
  if (!row) throw new AccessError("placement.noSuchInternship", "NOT_FOUND");
  const department = await hodStudents(me);
  if (department && !department.has(row.studentMembershipId)) throw new AccessError("placement.noSuchInternship", "NOT_FOUND");
  if (row.status !== "PROPOSED") throw new RuleRefusal("placement.refuseInternshipDecided", 409);
  if (input.approve) {
    if (!input.facultyMembershipId) throw new RuleRefusal("placement.refuseNeedSupervisor", 422, undefined, "facultyMembershipId");
    const fac = await db.membership.findFirst({ where: { id: input.facultyMembershipId, schoolId: me.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true } });
    if (!fac) throw new RuleRefusal("placement.refuseNeedSupervisor", 422, undefined, "facultyMembershipId");
  } else if (input.reason.trim().length < 3) throw new RuleRefusal("placement.refuseNeedReason", 422, undefined, "reason");
  const updated = await db.internship.update({
    where: { id },
    data: input.approve ? { status: "APPROVED", facultyMembershipId: input.facultyMembershipId, decidedByUserId: me.userId, decidedAt: new Date() } : { status: "REFUSED", refusedReason: input.reason.trim(), decidedByUserId: me.userId, decidedAt: new Date() },
  });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: input.approve ? "placement.internship.approve" : "placement.internship.refuse", targetType: "Internship", targetId: id });
  if (input.approve && row.kind === "FAMILY_BUSINESS") await askForDeclaration(row.studentMembershipId, me.schoolId, row.companyName);
  const student = await db.membership.findUnique({ where: { id: row.studentMembershipId }, select: { userId: true } });
  if (student) await notify({ userId: student.userId, schoolId: me.schoolId, kind: "SYSTEM", titleKey: input.approve ? "placement.notifInternshipApproved" : "placement.notifInternshipRefused", titleVars: { company: row.companyName }, body: input.approve ? undefined : input.reason, url: "/student/placement" }).catch(() => undefined);
  return (await internshipViews([updated]))[0]!;
}

/**
 * The grade, the visit and the viva — by the supervising faculty member, the
 * HOD or the cell — and, last, the credits (the cell or the HOD alone): only
 * once the report is in, the grade and the viva are recorded and, for a
 * family business, the parent's declaration; and never past the policy's
 * programme maximum.
 */
export async function evaluateInternship(ctx: ActiveContext, id: string, input: { industryGrade?: string | null; facultyVisitOn?: string | null; vivaMarks?: number | null; credits?: number | null }): Promise<InternshipView> {
  const me = await staffOf(ctx, EVALUATORS);
  const row = await db.internship.findFirst({ where: { id, schoolId: me.schoolId } });
  if (!row) throw new AccessError("placement.noSuchInternship", "NOT_FOUND");
  if (me.role === "FACULTY" && row.facultyMembershipId !== me.membershipId) throw new AccessError("placement.noSuchInternship", "NOT_FOUND");
  const department = await hodStudents(me);
  if (department && !department.has(row.studentMembershipId) && row.facultyMembershipId !== me.membershipId) throw new AccessError("placement.noSuchInternship", "NOT_FOUND");
  if (!["SUBMITTED", "EVALUATED"].includes(row.status)) throw new RuleRefusal("placement.refuseEvaluateState", 409);
  const next = {
    industryGrade: input.industryGrade !== undefined ? input.industryGrade : row.industryGrade,
    facultyVisitAt: input.facultyVisitOn !== undefined ? (input.facultyVisitOn ? new Date(`${input.facultyVisitOn}T00:00:00Z`) : null) : row.facultyVisitAt,
    vivaMarks: input.vivaMarks !== undefined ? input.vivaMarks : row.vivaMarks,
  };
  const evaluated = next.industryGrade !== null && next.vivaMarks !== null;
  let credited: { credits: number } | null = null;
  if (input.credits !== undefined && input.credits !== null) {
    if (!DECIDERS.includes(me.role)) throw new AccessError("access.wrongRoleForThisAction");
    if (!evaluated || !row.reportFileId) throw new RuleRefusal("placement.refuseCreditIncomplete", 409);
    if (row.kind === "FAMILY_BUSINESS" && !row.parentDeclarationFileId) throw new RuleRefusal("placement.refuseNeedDeclaration", 409);
    // Credited once it has ended (A3-journeys-22): from its last day, by the college's own calendar.
    if (todayKey(await zoneOf(me.schoolId)) < row.toKey) throw new RuleRefusal("placement.refuseCreditBeforeEnd", 409, { date: row.toKey });
    const before = await creditsSoFar(row.studentMembershipId, row.id);
    if (before + input.credits > AICTE_INTERNSHIP_BTECH.creditsMax) throw new RuleRefusal("placement.refuseCreditsOverMax", 409, { max: AICTE_INTERNSHIP_BTECH.creditsMax, have: before });
    credited = { credits: input.credits };
  }
  const updated = await db.$tenantTransaction(async (raw) =>
    (raw as Tx).internship.update({
      where: { id },
      data: {
        ...next,
        status: credited ? "CREDITED" : evaluated ? "EVALUATED" : row.status,
        ...(credited ? { credits: credited.credits, creditedAt: new Date(), creditedByUserId: me.userId } : {}),
      },
    }),
  );
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: credited ? "placement.internship.credit" : "placement.internship.evaluate", targetType: "Internship", targetId: id, meta: { grade: next.industryGrade, viva: next.vivaMarks, credits: credited?.credits ?? null } });
  return (await internshipViews([updated]))[0]!;
}

/* ------------------------------------------------- what the exam cell reads */

/** Every CREDITED internship of a student, for the credit statement. */
export async function internshipCredits(studentMembershipId: string): Promise<{ internshipId: string; windowSemester: number; credits: number; hours: number; creditedAt: Date }[]> {
  const rows = await db.internship.findMany({ where: { studentMembershipId, status: "CREDITED", credits: { not: null }, creditedAt: { not: null } }, orderBy: { creditedAt: "asc" }, select: { id: true, windowSemester: true, credits: true, hours: true, creditedAt: true } });
  return rows.map((r) => ({ internshipId: r.id, windowSemester: r.windowSemester, credits: r.credits!, hours: r.hours, creditedAt: r.creditedAt! }));
}

/** The credits CREDITED within one academic term's dates (AcademicTerm.startsOn..endsOn, the academics module's), for that term's credit push. */
export async function internshipCreditsForTerm(studentMembershipId: string, termId: string): Promise<number> {
  const term = await db.academicTerm.findUnique({ where: { id: termId }, select: { startsOn: true, endsOn: true } });
  if (!term) return 0;
  const from = new Date(`${term.startsOn}T00:00:00Z`);
  const to = new Date(`${term.endsOn}T23:59:59Z`);
  const rows = await db.internship.findMany({ where: { studentMembershipId, status: "CREDITED", creditedAt: { gte: from, lte: to } }, select: { credits: true } });
  return rows.reduce((a, r) => a + (r.credits ?? 0), 0);
}

/** A guardian's view of a child's internships (the caller has checked the PLACEMENT grant). */
export async function childInternships(studentMembershipId: string): Promise<InternshipView[]> {
  return internshipViews(await db.internship.findMany({ where: { studentMembershipId }, orderBy: { fromKey: "desc" } }));
}

/** Tells a minor's family, too, when an internship in the family's business is approved: the declaration is theirs to sign. */
export async function askForDeclaration(studentMembershipId: string, schoolId: string, company: string): Promise<void> {
  await notifyGuardians(studentMembershipId, (name) => ({ schoolId, kind: "SYSTEM", titleKey: "placement.notifDeclaration", titleVars: { name, company }, url: "/parent/placement" })).catch(() => undefined);
}
