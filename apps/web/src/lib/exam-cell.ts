import "server-only";
import { randomBytes } from "node:crypto";
import type {
  ExamActionResult,
  ExamCellHome,
  ExamFormRow,
  ExamSeating,
  ExamSessionSave,
  ExamSessionStatus,
  ExamSessionView,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertModuleOn, isAutonomous } from "./modules";
import { audit } from "./audit";
import { notify } from "./notify";
import { todayKey } from "./dates";
import { dayToDate } from "./fees";
import { currentAcademicYear } from "./academic-year";
import { writeJson, readJsonArray } from "./json";
import { getT } from "./i18n/server";
import type { TranslationKey } from "./i18n/dictionary";
import { RuleRefusal } from "./rule-refusal";
import { noDuesFor } from "./no-dues";
import { SCHOOL_STAFF_ROLES } from "./staff-records";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { coursesOf, eligibilityOf, registrationsOf, seatsOf, termCourses, termNames, termOf, termsOf } from "./exam-cell-academics";
import { alternateSeats, backlogLapsed, checkCode, csvFileName, csvLine, formFee, lateFeeOn, parseSlabs, sgpaNumber, tenths } from "./exam-cell-rules";

/**
 * THE EXAM CELL (module EXAMS, role EXAM_CONTROLLER; the owner's plan of
 * 4 October 2026) — who, sessions, forms and the logistics of a sitting.
 * Marks and results are in exam-cell-marks.ts; what follows a result, the
 * autonomous college's conduct and the student's own view in
 * exam-cell-after.ts; the arithmetic in exam-cell-rules.ts; what is read of
 * the academics module in exam-cell-academics.ts.
 *
 * WHO. The EXAM_CONTROLLER runs the cell and is the only writer; the office
 * (ADMIN) and the head (PRINCIPAL) read it, and the head alone decides a
 * grace proposal. A student reads and acts on their own (the form, a
 * revaluation, a backlog); a guardian reads a child's under the RESULTS
 * grant (an adult's) or always (a minor's). Faculty read their own duties.
 * Every door also answers MODULE_OFF while the college has EXAMS off.
 *
 * AFFILIATED OR AUTONOMOUS (isAutonomous, the tenant's kind): an affiliated
 * college's university conducts, and the cell imports its result file; an
 * autonomous college conducts — question papers, printing lists, central
 * assessment, the convocation and the degree — and those doors refuse an
 * affiliated college.
 *
 * MONEY NEVER TOUCHES THE PLATFORM (decision 0003): an exam fee is a
 * FeeDemand on the student's ledger under the session's EXAM head, paid by
 * the family's usual routes; waiving it marks the demand WAIVED.
 */

const WRITERS: readonly Role[] = ["EXAM_CONTROLLER"];
const READERS: readonly Role[] = ["EXAM_CONTROLLER", "ADMIN", "PRINCIPAL"];
export const STATUS_ORDER: readonly ExamSessionStatus[] = ["DRAFT", "FORMS", "CONDUCT", "ASSESSMENT", "PUBLISHED", "CLOSED"];

type Tx = typeof db;
export type Cell = { schoolId: string; userId: string; role: Role; membershipId: string; timeZone: string; autonomous: boolean; canWrite: boolean };

async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}

/** The cell at the session's college with EXAMS on; `read` lets the office and the head in. */
export async function cellOf(ctx: ActiveContext, mode: "write" | "read" = "write"): Promise<Cell> {
  const roles = mode === "write" ? WRITERS : READERS;
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  const [timeZone, autonomous] = await Promise.all([zoneOf(ctx.schoolId), isAutonomous(ctx.schoolId)]);
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId, timeZone, autonomous, canWrite: WRITERS.includes(ctx.role) };
}

/** An autonomous college's alone: the doors of conduct refuse an affiliated college with 403. */
export function assertAutonomous(cell: Cell): void {
  if (!cell.autonomous) throw new AccessError("examCell.refuseNotAutonomous");
}

export async function sessionOf(cell: Pick<Cell, "schoolId">, sessionId: string) {
  const s = await db.examSession.findFirst({ where: { id: sessionId, schoolId: cell.schoolId } });
  if (!s) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  return s;
}

export const statusAtLeast = (status: string, floor: ExamSessionStatus) => STATUS_ORDER.indexOf(status as ExamSessionStatus) >= STATUS_ORDER.indexOf(floor);

export type FormCourse = { courseId: string; kind: "REGULAR" | "BACKLOG" };
export const formCourses = (raw: string): FormCourse[] =>
  readJsonArray<FormCourse>(raw).filter((c) => c && typeof c.courseId === "string" && (c.kind === "REGULAR" || c.kind === "BACKLOG"));

const done = (id: string | null = null, count: number | null = null): ExamActionResult => ({ ok: true, id, count });

/* -------------------------------------------------------------------------- */
/* Home and sessions                                                           */
/* -------------------------------------------------------------------------- */

export async function examCellHome(ctx: ActiveContext): Promise<ExamCellHome> {
  const cell = await cellOf(ctx, "read");
  const [terms, sessions, heads, signature, graces, counts] = await Promise.all([
    termsOf(cell.schoolId),
    db.examSession.findMany({ where: { schoolId: cell.schoolId }, orderBy: [{ createdAt: "desc" }], include: { runs: { where: { status: "PUBLISHED" }, select: { publishedAt: true } } } }),
    db.feeHead.findMany({ where: { schoolId: cell.schoolId, retiredAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.signatureImage.findFirst({ where: { schoolId: cell.schoolId, membershipId: cell.membershipId, kind: "PERSON" }, select: { id: true } }),
    db.examGrace.findMany({ where: { schoolId: cell.schoolId, status: "PROPOSED" }, orderBy: { createdAt: "asc" }, include: { session: { select: { name: true } }, student: { select: { user: { select: { name: true } } } } } }),
    db.examForm.groupBy({ by: ["sessionId", "status"], where: { schoolId: cell.schoolId }, _count: { _all: true } }),
  ]);
  const termName = new Map(terms.map((t) => [t.id, t.name]));
  const courses = await coursesOf(cell.schoolId, graces.map((g) => g.courseId));
  const count = (sessionId: string, statuses?: string[]) => counts.filter((c) => c.sessionId === sessionId && (!statuses || statuses.includes(c.status))).reduce((a, c) => a + c._count._all, 0);
  return {
    autonomous: cell.autonomous,
    canWrite: cell.canWrite,
    canApproveGrace: ctx.role === "PRINCIPAL",
    signatureSet: Boolean(signature),
    terms: terms.map((t) => ({ id: t.id, name: t.name })),
    feeHeads: heads,
    sessions: sessions.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind as "REGULAR" | "SUPPLEMENTARY",
      termId: s.termId,
      termName: termName.get(s.termId) ?? "—",
      status: s.status as ExamSessionStatus,
      formOpensAt: s.formOpensAt?.toISOString() ?? null,
      formClosesAt: s.formClosesAt?.toISOString() ?? null,
      forms: count(s.id),
      submitted: count(s.id, ["SUBMITTED"]),
      approved: count(s.id, ["APPROVED"]),
      publishedAt: s.runs[0]?.publishedAt?.toISOString() ?? null,
    })),
    graceWaiting: graces.map((g) => ({ id: g.id, sessionName: g.session.name, courseCode: courses.get(g.courseId)?.code ?? "—", studentName: g.student.user.name, marks: g.graceMilli / 1000, reason: g.reason, rule: g.rule as "TO_PASS" | "TO_CLASS" })),
  };
}

async function checkSessionInput(cell: Cell, input: ExamSessionSave): Promise<void> {
  if (!(await termOf(cell.schoolId, input.termId))) throw new RuleRefusal("examCell.refuseTerm", 422, undefined, "termId");
  if (input.feeHeadId && !(await db.feeHead.findFirst({ where: { id: input.feeHeadId, schoolId: cell.schoolId, retiredAt: null }, select: { id: true } }))) throw new RuleRefusal("examCell.refuseFeeHead", 422, undefined, "feeHeadId");
  if (input.formOpensAt && input.formClosesAt && input.formClosesAt <= input.formOpensAt) throw new RuleRefusal("examCell.refuseWindow", 422, undefined, "formClosesAt");
}

const sessionData = (input: ExamSessionSave) => ({
  name: input.name,
  kind: input.kind,
  termId: input.termId,
  formOpensAt: input.formOpensAt ? new Date(input.formOpensAt) : null,
  formClosesAt: input.formClosesAt ? new Date(input.formClosesAt) : null,
  feePerCoursePaise: input.feePerCoursePaise,
  feePerBacklogPaise: input.feePerBacklogPaise,
  photocopyFeePaise: input.photocopyFeePaise,
  revalFeePaise: input.revalFeePaise,
  lateFeeSlabsJson: writeJson(input.lateFeeSlabs),
  feeHeadId: input.feeHeadId ?? null,
});

export async function createSession(ctx: ActiveContext, input: ExamSessionSave): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  await checkSessionInput(cell, input);
  if (await db.examSession.findFirst({ where: { schoolId: cell.schoolId, name: input.name }, select: { id: true } })) throw new RuleRefusal("examCell.refuseSessionName", 409, { name: input.name }, "name");
  const row = await db.examSession.create({ data: { schoolId: cell.schoolId, ...sessionData(input), createdByUserId: cell.userId }, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.session.create", targetType: "ExamSession", targetId: row.id, meta: { name: input.name, kind: input.kind, termId: input.termId } });
  return done(row.id);
}

/** A session's dates, fees and term, while it is a draft or its forms are open. */
export async function updateSession(ctx: ActiveContext, sessionId: string, input: ExamSessionSave): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  if (statusAtLeast(s.status, "CONDUCT")) throw new RuleRefusal("examCell.refuseSessionLocked", 409);
  await checkSessionInput(cell, input);
  const clash = await db.examSession.findFirst({ where: { schoolId: cell.schoolId, name: input.name, id: { not: s.id } }, select: { id: true } });
  if (clash) throw new RuleRefusal("examCell.refuseSessionName", 409, { name: input.name }, "name");
  if (input.termId !== s.termId && (await db.examForm.count({ where: { sessionId: s.id } })) > 0) throw new RuleRefusal("examCell.refuseTermChange", 409, undefined, "termId");
  await db.examSession.update({ where: { id: s.id }, data: sessionData(input) });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.session.update", targetType: "ExamSession", targetId: s.id, meta: { name: input.name } });
  return done(s.id);
}

/**
 * Forward through the session's steps. Moving to CONDUCT locks every
 * approved form (and refuses while a submitted form is undecided); CLOSED
 * follows a publication. PUBLISHED is the result's to set, never this.
 */
export async function setSessionStatus(ctx: ActiveContext, sessionId: string, status: "FORMS" | "CONDUCT" | "ASSESSMENT" | "CLOSED"): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  if (s.status === status) return done(s.id);
  if (STATUS_ORDER.indexOf(status) <= STATUS_ORDER.indexOf(s.status as ExamSessionStatus)) throw new RuleRefusal("examCell.refuseStatusBack", 409);
  if (status === "CLOSED" && s.status !== "PUBLISHED") throw new RuleRefusal("examCell.refuseCloseUnpublished", 409);
  if (statusAtLeast(status, "CONDUCT") && !statusAtLeast(s.status, "CONDUCT")) {
    const undecided = await db.examForm.count({ where: { sessionId: s.id, status: "SUBMITTED" } });
    if (undecided > 0) throw new RuleRefusal("examCell.refuseFormsUndecided", 409, { count: undecided });
  }
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.examSession.update({ where: { id: s.id }, data: { status } });
    if (statusAtLeast(status, "CONDUCT")) await tx.examForm.updateMany({ where: { sessionId: s.id, status: "APPROVED", lockedAt: null }, data: { lockedAt: new Date() } });
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.session.status", targetType: "ExamSession", targetId: s.id, meta: { from: s.status, to: status } });
  return done(s.id);
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Every student's form for the session, from what they are registered on
 * this term (a regular session) and every backlog they may still sit, as
 * DRAFTs. Idempotent: a draft is brought up to date, a submitted or decided
 * form is left alone, and nobody gets two.
 */
export async function generateForms(ctx: ActiveContext, sessionId: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  if (statusAtLeast(s.status, "CONDUCT")) throw new RuleRefusal("examCell.refuseSessionLocked", 409);
  const today = todayKey(cell.timeZone);
  const [regs, backlogs, existing] = await Promise.all([
    s.kind === "REGULAR" ? registrationsOf(cell.schoolId, s.termId) : Promise.resolve(new Map<string, string[]>()),
    db.backlog.findMany({ where: { schoolId: cell.schoolId, status: "OPEN", student: { status: "ACTIVE" } }, select: { studentMembershipId: true, courseId: true, firstFailedAt: true } }),
    db.examForm.findMany({ where: { sessionId: s.id }, select: { id: true, studentMembershipId: true, status: true, coursesJson: true } }),
  ]);
  const want = new Map<string, FormCourse[]>();
  for (const [student, courseIds] of regs) want.set(student, courseIds.map((courseId) => ({ courseId, kind: "REGULAR" as const })));
  for (const b of backlogs) {
    if (backlogLapsed(b.firstFailedAt, today)) continue;
    const list = want.get(b.studentMembershipId) ?? [];
    if (!list.some((c) => c.courseId === b.courseId)) list.push({ courseId: b.courseId, kind: "BACKLOG" });
    want.set(b.studentMembershipId, list);
  }
  const have = new Map(existing.map((f) => [f.studentMembershipId, f]));
  let written = 0;
  for (const [student, courses] of want) {
    const f = have.get(student);
    const json = writeJson(courses);
    if (!f) {
      await db.examForm.upsert({ where: { sessionId_studentMembershipId: { sessionId: s.id, studentMembershipId: student } }, create: { schoolId: cell.schoolId, sessionId: s.id, studentMembershipId: student, coursesJson: json }, update: {} });
      written += 1;
    } else if (f.status === "DRAFT" && f.coursesJson !== json) {
      await db.examForm.updateMany({ where: { id: f.id, status: "DRAFT" }, data: { coursesJson: json } });
      written += 1;
    }
  }
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.form.generate", targetType: "ExamSession", targetId: s.id, meta: { written, students: want.size } });
  return done(s.id, written);
}

/**
 * DEBARRED FROM THE NEXT SESSION (TA-303): the committee's DEBAR_NEXT was recorded and never applied. It holds the
 * student out of the next session they would sit — the first one created after the deciding session in which they
 * hold a form. The deciding session's name, or null when the student is not debarred from this one.
 */
async function debarredFrom(schoolId: string, studentMembershipId: string, session: { id: string; createdAt: Date }): Promise<string | null> {
  const cases = await db.malpractice.findMany({ where: { schoolId, studentMembershipId, decision: "DEBAR_NEXT", sessionId: { not: session.id }, session: { createdAt: { lt: session.createdAt } } }, select: { session: { select: { name: true, createdAt: true } } } });
  for (const c of cases) {
    const between = await db.examForm.count({ where: { schoolId, studentMembershipId, sessionId: { not: session.id }, session: { createdAt: { gt: c.session.createdAt, lt: session.createdAt } } } });
    if (between === 0) return c.session.name;
  }
  return null;
}

/** Whether the window is open now: the session takes forms and the day is inside its dates. */
function windowOpen(s: { status: string; formOpensAt: Date | null; formClosesAt: Date | null }, now = new Date()): boolean {
  return s.status === "FORMS" && (!s.formOpensAt || s.formOpensAt <= now) && (!s.formClosesAt || now <= s.formClosesAt);
}

/**
 * A form submitted: the student's own (within the window) or the controller's
 * for them (at any time the session takes forms). REFUSED, 409, when any
 * regular course is short of attendance and not condoned, or the student's
 * no-dues for the exam form is not complete — the snapshot of what was read
 * is kept on the form either way. Submitted, the fee (late fee from the
 * slabs) is raised as a demand on the student's ledger.
 */
export async function submitForm(ctx: ActiveContext, formId: string): Promise<ExamActionResult> {
  if (!ctx.schoolId || !ctx.membershipId || (ctx.role !== "STUDENT" && ctx.role !== "EXAM_CONTROLLER")) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  const schoolId = ctx.schoolId;
  const form = await db.examForm.findFirst({ where: { id: formId, schoolId, ...(ctx.role === "STUDENT" ? { studentMembershipId: ctx.membershipId } : {}) }, include: { session: true } });
  if (!form) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  const s = form.session;
  if (form.status !== "DRAFT") throw new RuleRefusal("examCell.refuseFormNotDraft", 409);
  if (s.status !== "FORMS") throw new RuleRefusal("examCell.refuseFormsClosed", 409);
  if (ctx.role === "STUDENT" && !windowOpen(s)) throw new RuleRefusal("examCell.refuseWindowClosed", 409);
  const debarred = await debarredFrom(schoolId, form.studentMembershipId, s);
  if (debarred) throw new RuleRefusal("examCell.refuseDebarred", 409, { session: debarred });
  const courses = formCourses(form.coursesJson);
  if (courses.length === 0) throw new RuleRefusal("examCell.refuseFormEmpty", 409);
  const timeZone = await zoneOf(schoolId);
  const today = todayKey(timeZone);
  const regular = courses.filter((c) => c.kind === "REGULAR").map((c) => c.courseId);
  const elig = regular.length > 0 ? (await eligibilityOf(schoolId, s.termId, [form.studentMembershipId])).get(form.studentMembershipId) : undefined;
  const eligible = !elig || elig.courses.filter((c) => regular.includes(c.courseId)).every((c) => c.condoned || c.percent === null || c.percent >= c.threshold);
  const dues = await noDuesFor(form.studentMembershipId, "EXAM_FORM");
  const snapshot = writeJson({ eligible, courses: elig?.courses ?? [], noDues: dues.lines.map((l) => ({ desk: l.desk, cleared: l.cleared, owedPaise: l.owedPaise, itemsOut: l.itemsOut })) });
  if (!eligible || !dues.completed) {
    await db.examForm.updateMany({ where: { id: form.id, status: "DRAFT" }, data: { eligibilityJson: snapshot, eligible, noDues: dues.completed } });
    await audit({ schoolId, actorUserId: ctx.user.id, action: "exam.form.refuse", targetType: "ExamForm", targetId: form.id, meta: { at: "submit", eligible, noDues: dues.completed } });
    if (!eligible) throw new RuleRefusal("examCell.refuseNotEligible", 409);
    // Say which desk still holds a line, so the student knows whom to see (LIFECYCLE-3).
    const tr = await getT();
    const desks = dues.lines.filter((l) => !l.cleared).map((l) => tr(`collegeOffice.desk${l.desk}` as TranslationKey));
    throw new RuleRefusal("examCell.refuseNoDuesDesks", 409, { desks: desks.join(", ") });
  }
  const fee = formFee(courses, s);
  const late = lateFeeOn(parseSlabs(s.lateFeeSlabsJson), today);
  const total = fee + late;
  const [head, year] = await Promise.all([s.feeHeadId ? db.feeHead.findFirst({ where: { id: s.feeHeadId, schoolId }, select: { id: true, code: true, name: true } }) : null, currentAcademicYear(schoolId)]);
  const t = await getT();
  const submitted = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const flipped = await tx.examForm.updateMany({ where: { id: form.id, status: "DRAFT" }, data: { status: "SUBMITTED", submittedAt: new Date(), eligibilityJson: snapshot, eligible: true, noDues: true, feePaise: fee, lateFeePaise: late, refusalReason: null } });
    if (flipped.count !== 1) return false;
    if (head && year && total > 0) {
      const demand = await tx.feeDemand.create({
        data: { schoolId, studentMembershipId: form.studentMembershipId, academicYearId: year.id, instalmentId: null, label: t("examCell.feeLabel", { session: s.name }), dueDate: dayToDate(today), grossPaise: total, concessionPaise: 0, netPaise: total, linesJson: writeJson([{ headId: head.id, code: head.code, name: head.name, grossPaise: total, concessionPaise: 0 }]), status: "OPEN" },
        select: { id: true },
      });
      await tx.examForm.update({ where: { id: form.id }, data: { feeDemandId: demand.id } });
    }
    return true;
  });
  if (!submitted) throw new RuleRefusal("examCell.refuseFormNotDraft", 409);
  await audit({ schoolId, actorUserId: ctx.user.id, action: "exam.form.submit", targetType: "ExamForm", targetId: form.id, meta: { feePaise: fee, lateFeePaise: late, byController: ctx.role === "EXAM_CONTROLLER" } });
  return done(form.id);
}

/** The controller approves a submitted form (waiving the fee with a reason, if so) or refuses it with one. */
export async function decideForm(ctx: ActiveContext, formId: string, input: { approve: boolean; waiveFee: boolean; reason?: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const form = await db.examForm.findFirst({ where: { id: formId, schoolId: cell.schoolId }, include: { session: { select: { name: true, status: true, createdAt: true } } } });
  if (!form) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (form.lockedAt || statusAtLeast(form.session.status, "CONDUCT")) throw new RuleRefusal("examCell.refuseFormLocked", 409);
  if (form.status !== "SUBMITTED") throw new RuleRefusal("examCell.refuseFormNotSubmitted", 409);
  if (input.approve) {
    const debarred = await debarredFrom(cell.schoolId, form.studentMembershipId, { id: form.sessionId, createdAt: form.session.createdAt });
    if (debarred) throw new RuleRefusal("examCell.refuseDebarred", 409, { session: debarred });
  }
  const reason = input.reason?.trim() || null;
  const demand = form.feeDemandId ? await db.feeDemand.findUnique({ where: { id: form.feeDemandId }, select: { id: true, status: true, paidPaise: true } }) : null;
  if (input.approve && input.waiveFee && demand && demand.paidPaise > 0) throw new RuleRefusal("examCell.refuseWaivePaid", 409);
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const flipped = await tx.examForm.updateMany({ where: { id: form.id, status: "SUBMITTED" }, data: { status: input.approve ? "APPROVED" : "REFUSED", decidedAt: new Date(), decidedByUserId: cell.userId, waiverReason: input.approve && input.waiveFee ? reason : null, refusalReason: input.approve ? null : reason } });
    if (flipped.count !== 1) return;
    if (demand && demand.status === "OPEN" && demand.paidPaise === 0 && (!input.approve || input.waiveFee)) {
      // TA-517: the demand's own lock, then a write only while nothing is paid on it: a payment that went first keeps
      // its PAID (a waiver then refused whole; a refused form leaves the paid fee to the office's refund).
      await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${demand.id} AND "schoolId" = ${cell.schoolId} FOR UPDATE`;
      const moved = await tx.feeDemand.updateMany({ where: { id: demand.id, schoolId: cell.schoolId, status: "OPEN", paidPaise: 0, allocations: { none: {} } }, data: { status: input.approve ? "WAIVED" : "CANCELLED" } });
      if (moved.count === 0 && input.approve) throw new RuleRefusal("examCell.refuseWaivePaid", 409);
    }
  });
  // The reason is on the form (waiverReason or refusalReason); the log says only that one was given (TA-409).
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: input.approve ? "exam.form.approve" : "exam.form.refuse", targetType: "ExamForm", targetId: form.id, meta: { waiveFee: input.approve && input.waiveFee, reasonGiven: reason !== null } });
  const student = await db.membership.findUnique({ where: { id: form.studentMembershipId }, select: { userId: true } });
  if (student) {
    await notify({ userId: student.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: input.approve ? "examCell.notifyFormApproved" : "examCell.notifyFormRefused", titleVars: { session: form.session.name }, bodyKey: input.approve ? "examCell.notifyFormApprovedBody" : "examCell.notifyFormRefusedBody", bodyVars: { reason: reason ?? "—" }, url: "/student/exams" });
  }
  return done(form.id);
}

/**
 * THE EXAM-FORM LIST AS THE UNIVERSITY TAKES IT: one line per approved form,
 * PRN, roll (the college's student code), name, programme, semester, the
 * regular and backlog course codes, fee and late fee in rupees. The column
 * order follows SPPU's exam-form register as the owner described it;
 * UNTESTED against the university's upload. File headings are the
 * university's and stay in English.
 */
export const FORMS_FILE_COLUMNS = ["PRN", "ROLL", "NAME", "PROGRAMME", "SEMESTER", "REGULAR_COURSES", "BACKLOG_COURSES", "FEE", "LATE_FEE", "STATUS"] as const;
export async function formsCsv(ctx: ActiveContext, sessionId: string): Promise<{ name: string; csv: string }> {
  const cell = await cellOf(ctx, "read");
  const s = await sessionOf(cell, sessionId);
  const forms = await db.examForm.findMany({ where: { sessionId: s.id, status: { in: ["SUBMITTED", "APPROVED"] } }, include: { student: { select: { studentCode: true, user: { select: { name: true } } } } }, orderBy: { student: { studentCode: "asc" } } });
  const all = forms.flatMap((f) => formCourses(f.coursesJson).map((c) => c.courseId));
  const [courses, seats] = await Promise.all([coursesOf(cell.schoolId, all), seatsOf(cell.schoolId, forms.map((f) => f.studentMembershipId))]);
  const lines = [csvLine([...FORMS_FILE_COLUMNS])];
  for (const f of forms) {
    const cs = formCourses(f.coursesJson);
    const seat = seats.get(f.studentMembershipId);
    const codes = (kind: string) => cs.filter((c) => c.kind === kind).map((c) => courses.get(c.courseId)?.code ?? c.courseId).join(" ");
    lines.push(csvLine([seat?.prn ?? "", f.student.studentCode ?? "", f.student.user.name, seat?.programmeName ?? "", seat?.semester ?? "", codes("REGULAR"), codes("BACKLOG"), (f.feePaise / 100).toFixed(2), (f.lateFeePaise / 100).toFixed(2), f.status]));
  }
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.form.export", targetType: "ExamSession", targetId: s.id, meta: { rows: forms.length } });
  return { name: csvFileName("exam-forms", s.name), csv: lines.join("\n") + "\n" };
}

/* -------------------------------------------------------------------------- */
/* Logistics                                                                    */
/* -------------------------------------------------------------------------- */

function assertLogistics(s: { status: string }): void {
  if (statusAtLeast(s.status, "PUBLISHED")) throw new RuleRefusal("examCell.refuseSessionLocked", 409);
}

/** One course's paper on the date sheet, written or moved. */
export async function saveSchedule(ctx: ActiveContext, sessionId: string, input: { courseId: string; at: string; durationMin: number }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  assertLogistics(s);
  const course = (await coursesOf(cell.schoolId, [input.courseId])).get(input.courseId);
  if (!course) throw new RuleRefusal("examCell.refuseCourse", 422, undefined, "courseId");
  const row = await db.examSchedule.upsert({
    where: { sessionId_courseId: { sessionId: s.id, courseId: course.id } },
    create: { schoolId: cell.schoolId, sessionId: s.id, courseId: course.id, courseCode: course.code, courseName: course.name, at: new Date(input.at), durationMin: input.durationMin },
    update: { at: new Date(input.at), durationMin: input.durationMin, courseCode: course.code, courseName: course.name },
    select: { id: true },
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.schedule.save", targetType: "ExamSchedule", targetId: row.id, meta: { courseCode: course.code, at: input.at } });
  return done(row.id);
}

/** A hall for a paper, with how many it seats; never fewer than already sit in it. */
export async function saveRoom(ctx: ActiveContext, sessionId: string, input: { scheduleId: string; name: string; capacity: number; roomId?: string | null }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  assertLogistics(s);
  const schedule = await db.examSchedule.findFirst({ where: { id: input.scheduleId, sessionId: s.id }, select: { id: true } });
  if (!schedule) throw new RuleRefusal("examCell.refuseSchedule", 422, undefined, "scheduleId");
  const existing = await db.examRoom.findUnique({ where: { scheduleId_name: { scheduleId: schedule.id, name: input.name } }, select: { id: true, _count: { select: { seats: true } } } });
  if (existing && existing._count.seats > Math.ceil(input.capacity / 2)) throw new RuleRefusal("examCell.refuseCapacity", 409, { seated: existing._count.seats }, "capacity");
  const row = existing
    ? await db.examRoom.update({ where: { id: existing.id }, data: { capacity: input.capacity, roomId: input.roomId ?? null }, select: { id: true } })
    : await db.examRoom.create({ data: { schoolId: cell.schoolId, sessionId: s.id, scheduleId: schedule.id, name: input.name, capacity: input.capacity, roomId: input.roomId ?? null }, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.room.save", targetType: "ExamRoom", targetId: row.id, meta: { name: input.name, capacity: input.capacity } });
  return done(row.id);
}

/**
 * THE SEATING, rebuilt for one paper or all: the approved forms that carry
 * the course, by roll, into the paper's halls in name order on alternate
 * seats (exam-cell-rules.ts `alternateSeats`). A hall named alike for two
 * papers at the same hour gives the first (by course code) the odd seats
 * and the second the even; a third paper there finds no seat. Who did not
 * fit is answered, so the controller adds a hall.
 */
export async function buildSeating(ctx: ActiveContext, sessionId: string, scheduleId?: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  assertLogistics(s);
  const schedules = await db.examSchedule.findMany({ where: { sessionId: s.id }, orderBy: [{ at: "asc" }, { courseCode: "asc" }], include: { rooms: { orderBy: { name: "asc" } } } });
  const targets = scheduleId ? schedules.filter((x) => x.id === scheduleId) : schedules;
  if (scheduleId && targets.length === 0) throw new RuleRefusal("examCell.refuseSchedule", 422, undefined, "scheduleId");
  const forms = await db.examForm.findMany({ where: { sessionId: s.id, status: "APPROVED" }, select: { id: true, studentMembershipId: true, coursesJson: true, student: { select: { studentCode: true, user: { select: { name: true } } } } } });
  forms.sort((a, b) => (a.student.studentCode ?? a.student.user.name).localeCompare(b.student.studentCode ?? b.student.user.name));
  let seated = 0;
  let left = 0;
  for (const sch of targets) {
    const sitting = forms.filter((f) => formCourses(f.coursesJson).some((c) => c.courseId === sch.courseId));
    const sameHour = schedules.filter((o) => o.at.getTime() === sch.at.getTime());
    const rows: { examRoomId: string; seatNo: number; formId: string; studentMembershipId: string }[] = [];
    let queue = sitting;
    for (const room of sch.rooms) {
      const sharing = sameHour.filter((o) => o.rooms.some((r) => r.name === room.name));
      const index = sharing.findIndex((o) => o.id === sch.id);
      if (index < 0 || index > 1) continue;
      const placed = alternateSeats(queue, room.capacity, index as 0 | 1);
      for (const p of placed.seated) rows.push({ examRoomId: room.id, seatNo: p.seatNo, formId: p.who.id, studentMembershipId: p.who.studentMembershipId });
      queue = placed.left;
    }
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      await tx.seating.deleteMany({ where: { scheduleId: sch.id } });
      if (rows.length) await tx.seating.createMany({ data: rows.map((r) => ({ ...r, schoolId: cell.schoolId, scheduleId: sch.id })) });
    });
    seated += rows.length;
    left += queue.length;
  }
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.seating.build", targetType: "ExamSession", targetId: s.id, meta: { schedules: targets.length, seated, unseated: left } });
  return done(s.id, left);
}

export async function seatingView(ctx: ActiveContext, scheduleId: string): Promise<ExamSeating> {
  const cell = await cellOf(ctx, "read");
  const sch = await db.examSchedule.findFirst({ where: { id: scheduleId, schoolId: cell.schoolId }, include: { rooms: { orderBy: { name: "asc" }, include: { seats: { orderBy: { seatNo: "asc" }, include: { student: { select: { user: { select: { name: true } } } }, form: { select: { ticket: { select: { number: true } } } } } } } } } });
  if (!sch) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  const forms = await db.examForm.findMany({ where: { sessionId: sch.sessionId, status: "APPROVED" }, select: { id: true, studentMembershipId: true, coursesJson: true, student: { select: { user: { select: { name: true } } } } } });
  const seatedIds = new Set(sch.rooms.flatMap((r) => r.seats.map((x) => x.formId)));
  return {
    scheduleId: sch.id,
    code: sch.courseCode,
    name: sch.courseName,
    at: sch.at.toISOString(),
    rooms: sch.rooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity, seats: r.seats.map((x) => ({ seatNo: x.seatNo, studentMembershipId: x.studentMembershipId, name: x.student.user.name, ticket: x.form.ticket?.number ?? null })) })),
    unseated: forms.filter((f) => !seatedIds.has(f.id) && formCourses(f.coursesJson).some((c) => c.courseId === sch.courseId)).map((f) => ({ studentMembershipId: f.studentMembershipId, name: f.student.user.name })),
  };
}

/** Hall tickets for every approved form that has none, numbered in the session in roll order, each with a code for the public check. */
export async function issueHallTickets(ctx: ActiveContext, sessionId: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  if (s.status !== "FORMS" && s.status !== "CONDUCT") throw new RuleRefusal("examCell.refuseTicketsNow", 409);
  const issued = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${s.id} FOR UPDATE`;
    // No ticket for a student who has left (A3-S-15): their approved form stays, and a ticket is made if they come back.
    const forms = await tx.examForm.findMany({ where: { sessionId: s.id, status: "APPROVED", ticket: null, student: { status: "ACTIVE", leftAt: null } }, select: { id: true, studentMembershipId: true, student: { select: { studentCode: true, user: { select: { name: true } } } } } });
    forms.sort((a, b) => (a.student.studentCode ?? a.student.user.name).localeCompare(b.student.studentCode ?? b.student.user.name));
    const taken = await tx.hallTicket.count({ where: { sessionId: s.id } });
    const made: { id: string; studentMembershipId: string }[] = [];
    for (const [i, f] of forms.entries()) {
      const number = `HT${String(taken + i + 1).padStart(4, "0")}`;
      const row = await tx.hallTicket.create({ data: { schoolId: cell.schoolId, sessionId: s.id, formId: f.id, studentMembershipId: f.studentMembershipId, number, code: checkCode(randomBytes(10)), issuedByUserId: cell.userId }, select: { id: true, studentMembershipId: true } });
      made.push(row);
    }
    return made;
  });
  if (issued.length) {
    await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.hallTicket.issue", targetType: "ExamSession", targetId: s.id, meta: { count: issued.length } });
    const people = await db.membership.findMany({ where: { id: { in: issued.map((i) => i.studentMembershipId) } }, select: { userId: true } });
    await Promise.all(people.map((p) => notify({ userId: p.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyTicket", titleVars: { session: s.name }, bodyKey: "examCell.notifyTicketBody", url: "/student/exams" })));
  }
  return done(s.id, issued.length);
}

async function staffAt(schoolId: string, membershipId: string) {
  const m = await db.membership.findFirst({ where: { id: membershipId, schoolId, status: "ACTIVE", role: { in: [...SCHOOL_STAFF_ROLES] } }, select: { id: true, userId: true, user: { select: { name: true } } } });
  if (!m) throw new RuleRefusal("examCell.refuseStaff", 422, undefined, "staffMembershipId");
  return m;
}

/** Whether this member of staff already watches another hall at the paper's hour. */
async function busyAt(schoolId: string, staffMembershipId: string, at: Date, exceptRoomId: string): Promise<boolean> {
  return Boolean(await db.invigilation.findFirst({ where: { schoolId, staffMembershipId, examRoomId: { not: exceptRoomId }, room: { schedule: { at } } }, select: { id: true } }));
}

export async function assignInvigilator(ctx: ActiveContext, sessionId: string, input: { examRoomId: string; staffMembershipId: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  assertLogistics(s);
  const room = await db.examRoom.findFirst({ where: { id: input.examRoomId, sessionId: s.id }, select: { id: true, name: true, schedule: { select: { at: true, courseCode: true } } } });
  if (!room) throw new RuleRefusal("examCell.refuseRoom", 422, undefined, "examRoomId");
  const staff = await staffAt(cell.schoolId, input.staffMembershipId);
  if (await busyAt(cell.schoolId, staff.id, room.schedule.at, room.id)) throw new RuleRefusal("examCell.refuseInvigilatorBusy", 409, { name: staff.user.name });
  const row = await db.invigilation.upsert({ where: { examRoomId_staffMembershipId: { examRoomId: room.id, staffMembershipId: staff.id } }, create: { schoolId: cell.schoolId, sessionId: s.id, examRoomId: room.id, staffMembershipId: staff.id }, update: {}, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.invigilation.assign", targetType: "Invigilation", targetId: row.id, meta: { room: room.name, staffMembershipId: staff.id } });
  await notify({ userId: staff.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyDuty", titleVars: { course: room.schedule.courseCode, room: room.name }, bodyKey: "examCell.notifyDutyBody", url: "/faculty/exams" });
  return done(row.id);
}

/** A swap: another member of staff takes the duty, with the reason; the one replaced is named on the row. */
export async function swapInvigilator(ctx: ActiveContext, invigilationId: string, input: { staffMembershipId: string; note: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const row = await db.invigilation.findFirst({ where: { id: invigilationId, schoolId: cell.schoolId }, include: { room: { select: { id: true, name: true, schedule: { select: { at: true, courseCode: true } } } }, session: { select: { status: true } } } });
  if (!row) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  assertLogistics(row.session);
  if (row.status === "DONE") throw new RuleRefusal("examCell.refuseDutyDone", 409);
  const staff = await staffAt(cell.schoolId, input.staffMembershipId);
  if (staff.id === row.staffMembershipId) return done(row.id);
  if (await busyAt(cell.schoolId, staff.id, row.room.schedule.at, row.room.id)) throw new RuleRefusal("examCell.refuseInvigilatorBusy", 409, { name: staff.user.name });
  if (await db.invigilation.findUnique({ where: { examRoomId_staffMembershipId: { examRoomId: row.room.id, staffMembershipId: staff.id } }, select: { id: true } })) throw new RuleRefusal("examCell.refuseInvigilatorBusy", 409, { name: staff.user.name });
  await db.invigilation.update({ where: { id: row.id }, data: { staffMembershipId: staff.id, swappedFromMembershipId: row.staffMembershipId, status: "SWAPPED", note: input.note } });
  // The note is on the duty's row; the log says only that one was given (TA-409, decision 0002).
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.invigilation.swap", targetType: "Invigilation", targetId: row.id, meta: { from: row.staffMembershipId, to: staff.id, noteGiven: true } });
  await notify({ userId: staff.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyDuty", titleVars: { course: row.room.schedule.courseCode, room: row.room.name }, bodyKey: "examCell.notifyDutyBody", url: "/faculty/exams" });
  return done(row.id);
}

export async function markDutyDone(ctx: ActiveContext, invigilationId: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const row = await db.invigilation.findFirst({ where: { id: invigilationId, schoolId: cell.schoolId }, select: { id: true, status: true } });
  if (!row) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (row.status !== "DONE") {
    await db.invigilation.update({ where: { id: row.id }, data: { status: "DONE" } });
    await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.invigilation.done", targetType: "Invigilation", targetId: row.id });
  }
  return done(row.id);
}

export async function reportMalpractice(ctx: ActiveContext, sessionId: string, input: { scheduleId: string; studentMembershipId: string; note: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  const [schedule, form] = await Promise.all([
    db.examSchedule.findFirst({ where: { id: input.scheduleId, sessionId: s.id }, select: { id: true, courseId: true } }),
    db.examForm.findFirst({ where: { sessionId: s.id, studentMembershipId: input.studentMembershipId }, select: { id: true, coursesJson: true } }),
  ]);
  if (!schedule) throw new RuleRefusal("examCell.refuseSchedule", 422, undefined, "scheduleId");
  if (!form || !formCourses(form.coursesJson).some((c) => c.courseId === schedule.courseId)) throw new RuleRefusal("examCell.refuseNotSitting", 422, undefined, "studentMembershipId");
  const row = await db.malpractice.create({ data: { schoolId: cell.schoolId, sessionId: s.id, scheduleId: schedule.id, studentMembershipId: input.studentMembershipId, note: input.note, reportedByUserId: cell.userId }, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.malpractice.report", targetType: "Malpractice", targetId: row.id, meta: { scheduleId: schedule.id } });
  return done(row.id);
}

/** The unfair-means committee's decision, recorded once. CANCEL_PAPER fails that course in the run; CANCEL_SESSION every course of the session. */
export async function decideMalpractice(ctx: ActiveContext, malpracticeId: string, input: { decision: string; note: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const row = await db.malpractice.findFirst({ where: { id: malpracticeId, schoolId: cell.schoolId }, select: { id: true, decision: true, studentMembershipId: true, student: { select: { userId: true } } } });
  if (!row) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (row.decision) {
    if (row.decision === input.decision) return done(row.id);
    throw new RuleRefusal("examCell.refuseDecided", 409);
  }
  await db.malpractice.update({ where: { id: row.id }, data: { decision: input.decision, decisionNote: input.note, decidedByUserId: cell.userId, decidedAt: new Date() } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.malpractice.decide", targetType: "Malpractice", targetId: row.id, meta: { decision: input.decision } });
  await notify({ userId: row.student.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyMalpractice", bodyKey: "examCell.notifyMalpracticeBody", url: "/student/exams" });
  return done(row.id);
}

export async function saveRemuneration(ctx: ActiveContext, sessionId: string, input: { staffMembershipId: string; kind: string; count: number; ratePaise: number }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  await staffAt(cell.schoolId, input.staffMembershipId);
  const row = await db.remuneration.upsert({
    where: { sessionId_staffMembershipId_kind: { sessionId: s.id, staffMembershipId: input.staffMembershipId, kind: input.kind } },
    create: { schoolId: cell.schoolId, sessionId: s.id, staffMembershipId: input.staffMembershipId, kind: input.kind, count: input.count, ratePaise: input.ratePaise },
    update: { count: input.count, ratePaise: input.ratePaise },
    select: { id: true },
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.remuneration.save", targetType: "Remuneration", targetId: row.id, meta: { kind: input.kind, count: input.count, ratePaise: input.ratePaise } });
  return done(row.id);
}

/* -------------------------------------------------------------------------- */
/* The session read                                                             */
/* -------------------------------------------------------------------------- */

export async function sessionView(ctx: ActiveContext, sessionId: string): Promise<ExamSessionView> {
  const cell = await cellOf(ctx, "read");
  const s = await sessionOf(cell, sessionId);
  const [names, termCourseRows, forms, schedules, malpractice, remuneration, staff, runs, graces, notes, marks, papers, allocations] = await Promise.all([
    termNames(cell.schoolId, [s.termId]),
    termCourses(cell.schoolId, s.termId),
    db.examForm.findMany({ where: { sessionId: s.id }, include: { student: { select: { studentCode: true, user: { select: { name: true } } } }, ticket: { select: { id: true, number: true } } } }),
    db.examSchedule.findMany({ where: { sessionId: s.id }, orderBy: [{ at: "asc" }, { courseCode: "asc" }], include: { rooms: { orderBy: { name: "asc" }, include: { _count: { select: { seats: true } }, invigilation: { include: { staff: { select: { user: { select: { name: true } } } } } } } } } }),
    db.malpractice.findMany({ where: { sessionId: s.id }, orderBy: { createdAt: "desc" }, include: { schedule: { select: { courseCode: true } }, student: { select: { user: { select: { name: true } } } } } }),
    db.remuneration.findMany({ where: { sessionId: s.id }, include: { staff: { select: { user: { select: { name: true } } } } } }),
    db.membership.findMany({ where: { schoolId: cell.schoolId, status: "ACTIVE", role: { in: ["FACULTY", "HOD", "TEACHER", "EXAM_CONTROLLER", "PRINCIPAL", "ADMIN"] } }, select: { id: true, role: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
    db.resultRun.findMany({ where: { sessionId: s.id }, orderBy: { number: "desc" } }),
    db.examGrace.findMany({ where: { sessionId: s.id }, orderBy: { createdAt: "desc" }, include: { student: { select: { user: { select: { name: true } } } } } }),
    db.examModerationNote.findMany({ where: { sessionId: s.id }, orderBy: { createdAt: "desc" } }),
    db.examMark.findMany({ where: { sessionId: s.id }, select: { courseId: true, studentMembershipId: true, version: true, matched: true, entry1ByUserId: true, entry2ByUserId: true } }),
    db.questionPaper.groupBy({ by: ["setterMembershipId"], where: { sessionId: s.id }, _count: { _all: true } }),
    db.assessmentAllocation.groupBy({ by: ["assessorMembershipId"], where: { sessionId: s.id }, _count: { _all: true } }),
  ]);
  const writerIds = [...new Set(notes.map((n) => n.writtenByUserId))];
  const writers = new Map((writerIds.length ? await db.user.findMany({ where: { id: { in: writerIds } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name]));
  const allCourseIds = [...new Set([...termCourseRows.map((c) => c.courseId), ...forms.flatMap((f) => formCourses(f.coursesJson).map((c) => c.courseId)), ...graces.map((g) => g.courseId), ...notes.map((n) => n.courseId).filter((x): x is string => Boolean(x))])];
  const courses = await coursesOf(cell.schoolId, allCourseIds);
  const demands = forms.map((f) => f.feeDemandId).filter((x): x is string => Boolean(x));
  const demandStatus = new Map((demands.length ? await db.feeDemand.findMany({ where: { id: { in: demands } }, select: { id: true, status: true } }) : []).map((d) => [d.id, d.status]));
  const approved = forms.filter((f) => f.status === "APPROVED");
  const expectedFor = (courseId: string) => approved.filter((f) => formCourses(f.coursesJson).some((c) => c.courseId === courseId)).length;
  const latest = new Map<string, (typeof marks)[number]>();
  const firsts = new Map<string, (typeof marks)[number]>();
  for (const m of marks) {
    const k = `${m.courseId}|${m.studentMembershipId}`;
    if (!latest.has(k) || latest.get(k)!.version < m.version) latest.set(k, m);
    if (m.version === 1) firsts.set(k, m);
  }
  const markCourses = [...new Set([...schedules.map((x) => x.courseId), ...approved.flatMap((f) => formCourses(f.coursesJson).map((c) => c.courseId))])];
  const dutyCount = (membershipId: string, kind: string) =>
    kind === "INVIGILATOR"
      ? schedules.reduce((a, x) => a + x.rooms.reduce((b, r) => b + r.invigilation.filter((i) => i.staffMembershipId === membershipId).length, 0), 0)
      : kind === "SETTER"
        ? (papers.find((p) => p.setterMembershipId === membershipId)?._count._all ?? 0)
        : kind === "ASSESSOR"
          ? (allocations.find((a) => a.assessorMembershipId === membershipId)?._count._all ?? 0)
          : 0;
  const published = runs.some((r) => r.status === "PUBLISHED" || r.status === "SUPERSEDED");
  return {
    id: s.id,
    name: s.name,
    kind: s.kind as "REGULAR" | "SUPPLEMENTARY",
    termId: s.termId,
    termName: names.get(s.termId) ?? "—",
    status: s.status as ExamSessionStatus,
    formOpensAt: s.formOpensAt?.toISOString() ?? null,
    formClosesAt: s.formClosesAt?.toISOString() ?? null,
    feePerCoursePaise: s.feePerCoursePaise,
    feePerBacklogPaise: s.feePerBacklogPaise,
    photocopyFeePaise: s.photocopyFeePaise,
    revalFeePaise: s.revalFeePaise,
    lateFeeSlabs: parseSlabs(s.lateFeeSlabsJson),
    feeHeadId: s.feeHeadId,
    autonomous: cell.autonomous,
    canWrite: cell.canWrite,
    published,
    courses: termCourseRows.map((c) => ({ courseId: c.courseId, code: c.code, name: c.name, credits: tenths(c.creditsTenths), registered: c.registered })),
    forms: forms
      .map((f): ExamFormRow => ({
        id: f.id,
        studentMembershipId: f.studentMembershipId,
        name: f.student.user.name,
        code: f.student.studentCode,
        status: f.status as ExamFormRow["status"],
        eligible: f.eligible,
        noDues: f.noDues,
        courses: formCourses(f.coursesJson).map((c) => ({ courseId: c.courseId, code: courses.get(c.courseId)?.code ?? "—", name: courses.get(c.courseId)?.name ?? "—", kind: c.kind })),
        feePaise: f.feePaise,
        lateFeePaise: f.lateFeePaise,
        feeDemandId: f.feeDemandId,
        demandStatus: f.feeDemandId ? (demandStatus.get(f.feeDemandId) ?? null) : null,
        submittedAt: f.submittedAt?.toISOString() ?? null,
        lockedAt: f.lockedAt?.toISOString() ?? null,
        refusalReason: f.refusalReason,
        waiverReason: f.waiverReason,
        hallTicket: f.ticket ? { id: f.ticket.id, number: f.ticket.number } : null,
      }))
      .sort((a, b) => (a.code ?? a.name).localeCompare(b.code ?? b.name)),
    schedule: schedules.map((x) => ({
      id: x.id,
      courseId: x.courseId,
      code: x.courseCode,
      name: x.courseName,
      at: x.at.toISOString(),
      durationMin: x.durationMin,
      expected: expectedFor(x.courseId),
      rooms: x.rooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity, seated: r._count.seats, invigilators: r.invigilation.map((i) => ({ id: i.id, membershipId: i.staffMembershipId, name: i.staff.user.name, status: i.status as "ASSIGNED" | "SWAPPED" | "DONE" })) })),
    })),
    malpractice: malpractice.map((m) => ({ id: m.id, scheduleId: m.scheduleId, courseCode: m.schedule.courseCode, studentMembershipId: m.studentMembershipId, studentName: m.student.user.name, note: m.note, decision: (m.decision as ExamSessionView["malpractice"][number]["decision"]) ?? null, decisionNote: m.decisionNote, decidedAt: m.decidedAt?.toISOString() ?? null })),
    remuneration: remuneration.map((r) => ({ id: r.id, staffMembershipId: r.staffMembershipId, name: r.staff.user.name, kind: r.kind as "SETTER" | "MODERATOR" | "INVIGILATOR" | "ASSESSOR", count: r.count, ratePaise: r.ratePaise, amountPaise: r.count * r.ratePaise, duties: dutyCount(r.staffMembershipId, r.kind) })),
    staff: staff.map((m) => ({ membershipId: m.id, name: m.user.name, role: m.role })),
    runs: runs.map(runView),
    graces: graces.map((g) => ({ id: g.id, courseId: g.courseId, courseCode: courses.get(g.courseId)?.code ?? "—", studentMembershipId: g.studentMembershipId, studentName: g.student.user.name, marks: g.graceMilli / 1000, rule: g.rule as "TO_PASS" | "TO_CLASS", reason: g.reason, status: g.status as "PROPOSED" | "APPROVED" | "REFUSED", decisionNote: g.decisionNote, decidedAt: g.decidedAt?.toISOString() ?? null })),
    notes: notes.map((n) => ({ id: n.id, courseCode: n.courseId ? (courses.get(n.courseId)?.code ?? "—") : null, note: n.note, at: n.createdAt.toISOString(), by: writers.get(n.writtenByUserId) ?? "—" })),
    marks: markCourses
      .map((courseId) => {
        const expected = expectedFor(courseId);
        let matched = 0;
        let mismatched = 0;
        for (const [k, m] of latest) {
          if (!k.startsWith(`${courseId}|`)) continue;
          if (m.matched) matched += 1;
          else if (firsts.get(k)?.entry1ByUserId && firsts.get(k)?.entry2ByUserId) mismatched += 1;
        }
        return { courseId, code: courses.get(courseId)?.code ?? "—", expected, matched, mismatched, pending: Math.max(0, expected - matched - mismatched) };
      })
      .sort((a, b) => a.code.localeCompare(b.code)),
  };
}

export function runView(r: { id: string; number: number; status: string; computedAt: Date; publishedAt: Date | null; reason: string | null; summaryJson: string }) {
  let sum: { students?: number; passed?: number; atkt?: number; failed?: number } = {};
  try {
    sum = JSON.parse(r.summaryJson) as typeof sum;
  } catch {
    sum = {};
  }
  const students = sum.students ?? 0;
  const passed = sum.passed ?? 0;
  return {
    id: r.id,
    number: r.number,
    status: r.status as "DRAFT" | "PUBLISHED" | "SUPERSEDED",
    computedAt: r.computedAt.toISOString(),
    publishedAt: r.publishedAt?.toISOString() ?? null,
    reason: r.reason,
    students,
    passed,
    atkt: sum.atkt ?? 0,
    failed: sum.failed ?? 0,
    passRatePercent: students > 0 ? Math.round((passed / students) * 1000) / 10 : 0,
  };
}

export { sgpaNumber };
