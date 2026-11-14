import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { REVALUATION_WINDOW_DAYS, type BacklogRow, type CreditPushRow, type ExamActionResult, type ExamAfter, type ExamConduct, type ExamDocumentCheck, type ExamDocumentRow, type ExamDuties, type MyExams, type RevaluationRow } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertGuardianAccess } from "./tenancy";
import { parentMaySee } from "./student-consent";
import { assertModuleOn, isAutonomous } from "./modules";
import { audit } from "./audit";
import { notify } from "./notify";
import { addDaysToKey, dateKeyInZone, todayKey } from "./dates";
import { dayToDate } from "./fees";
import { currentAcademicYear } from "./academic-year";
import { readJson, readJsonArray, writeJson } from "./json";
import { getT } from "./i18n/server";
import { RuleRefusal } from "./rule-refusal";
import { open as openSealed, seal, sealingAvailable } from "./secret-box";
import { pngFrom, SIGNATURE_LIMIT } from "./signatures";
import { forSchool } from "./tenant-context";
import { readPassingRules } from "./academics";
import { internshipCredits } from "./placement-internships";
import { EXAM_CODE_SHAPE, examDocumentByCode } from "./exam-document-check";
import type { ActiveContext } from "./session";
import { assertAutonomous, cellOf, formCourses, sessionOf, statusAtLeast, type FormCourse } from "./exam-cell";
import { graceCarry, newVersion, termResultView } from "./exam-cell-marks";
import { coursesOf, seatsOf, studentIdsOf, termNames } from "./exam-cell-academics";
import { backlogLapsed, backlogLastDay, cgpaHundredths, checkCode, classFor, sgpaNumber, tenths, toMilli } from "./exam-cell-rules";

/**
 * THE EXAM CELL AFTER A RESULT, THE AUTONOMOUS COLLEGE'S CONDUCT, AND THE
 * STUDENT'S OWN (module EXAMS, 4 October 2026): revaluation and photocopy
 * with their fees; backlogs registered into a session within the limit;
 * grade cards, transcripts and (autonomous) degree certificates numbered
 * under a lock with the controller's signature and a public check; credits
 * for the Academic Bank; the convocation; question papers in a sealed store;
 * printing lists; central assessment; a faculty member's duties; and what a
 * student — or a consented guardian — reads of it all.
 */

type Tx = typeof db;
const DOC_PREFIX = { GRADE_CARD: "GC", TRANSCRIPT: "TR", DEGREE: "DC" } as const;
const SETTER_ROLES = ["FACULTY", "HOD"] as const;

/* -------------------------------------------------------------------------- */
/* Shared reads                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Where a CHANGED revaluation stands on its way to the result (A3-journeys-11): the new mark reaches
 * the result only through a run, so RUN_DUE until a run of its session is computed after the decision,
 * PUBLISH_DUE until one is published after it, and null once one is (or for any other outcome).
 * Derived on read from the session's runs; nothing is stored.
 */
async function correctionOf(rows: readonly { sessionId: string; outcome: string | null; decidedAt: Date | null }[]): Promise<(r: { sessionId: string; outcome: string | null; decidedAt: Date | null }) => "RUN_DUE" | "PUBLISH_DUE" | null> {
  const changed = rows.filter((r) => r.outcome === "CHANGED" && r.decidedAt);
  const runs = changed.length ? await db.resultRun.findMany({ where: { sessionId: { in: [...new Set(changed.map((r) => r.sessionId))] } }, select: { sessionId: true, computedAt: true, publishedAt: true } }) : [];
  return (r) => {
    if (r.outcome !== "CHANGED" || !r.decidedAt) return null;
    const after = (d: Date | null) => d !== null && d.getTime() > r.decidedAt!.getTime();
    const mine = runs.filter((x) => x.sessionId === r.sessionId);
    if (mine.some((x) => after(x.publishedAt))) return null;
    return mine.some((x) => after(x.computedAt)) ? "PUBLISH_DUE" : "RUN_DUE";
  };
}

async function revaluationRows(where: { schoolId: string; studentMembershipId?: string; sessionId?: string; status?: string | { not: string } }, take: number | null = 300): Promise<RevaluationRow[]> {
  const rows = await db.revaluation.findMany({ where, orderBy: { createdAt: "desc" }, take: take ?? undefined, include: { session: { select: { name: true, schoolId: true } }, student: { select: { user: { select: { name: true } } } } } });
  if (rows.length === 0) return [];
  const courses = await coursesOf(rows[0]!.session.schoolId, rows.map((r) => r.courseId));
  const demands = rows.map((r) => r.feeDemandId).filter((x): x is string => Boolean(x));
  const [status, correction] = await Promise.all([
    demands.length ? db.feeDemand.findMany({ where: { id: { in: demands } }, select: { id: true, status: true } }).then((ds) => new Map(ds.map((d) => [d.id, d.status]))) : Promise.resolve(new Map<string, string>()),
    correctionOf(rows),
  ]);
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    sessionName: r.session.name,
    courseId: r.courseId,
    courseCode: courses.get(r.courseId)?.code ?? "—",
    studentMembershipId: r.studentMembershipId,
    studentName: r.student.user.name,
    kind: r.kind as RevaluationRow["kind"],
    feePaise: r.feePaise,
    demandStatus: r.feeDemandId ? (status.get(r.feeDemandId) ?? null) : null,
    status: r.status as RevaluationRow["status"],
    outcome: (r.outcome as RevaluationRow["outcome"]) ?? null,
    oldExternalMilli: r.oldExternalMilli,
    newExternalMilli: r.newExternalMilli,
    askedAt: r.createdAt.toISOString(),
    decidedAt: r.decidedAt?.toISOString() ?? null,
    correction: correction(r),
  }));
}

/**
 * The results page's notice (A3-journeys-11): how many CHANGED revaluations of one session wait for a
 * corrected run to be computed, and how many for the computed one to be published.
 */
export async function correctionsDue(ctx: ActiveContext, sessionId: string): Promise<{ runDue: number; publishDue: number }> {
  const cell = await cellOf(ctx, "read");
  const s = await sessionOf(cell, sessionId);
  const rows = await revaluationRows({ schoolId: cell.schoolId, sessionId: s.id });
  return { runDue: rows.filter((r) => r.correction === "RUN_DUE").length, publishDue: rows.filter((r) => r.correction === "PUBLISH_DUE").length };
}

async function backlogRows(schoolId: string, where: { studentMembershipId?: string }, today: string): Promise<BacklogRow[]> {
  const rows = await db.backlog.findMany({ where: { schoolId, ...where }, orderBy: [{ status: "desc" }, { firstFailedAt: "asc" }], take: 300, include: { student: { select: { user: { select: { name: true } } } } } });
  const courses = await coursesOf(schoolId, rows.map((r) => r.courseId));
  return rows.map((r) => ({
    id: r.id,
    studentMembershipId: r.studentMembershipId,
    studentName: r.student.user.name,
    courseId: r.courseId,
    courseCode: courses.get(r.courseId)?.code ?? "—",
    courseName: courses.get(r.courseId)?.name ?? "—",
    // Past the limit reads as LAPSED; the row itself is written only by a publication.
    status: r.status === "OPEN" && backlogLapsed(r.firstFailedAt, today) ? "LAPSED" : (r.status as BacklogRow["status"]),
    attempts: r.attempts,
    firstFailedAt: r.firstFailedAt.toISOString(),
    lastDay: backlogLastDay(r.firstFailedAt),
    clearedAt: r.clearedAt?.toISOString() ?? null,
  }));
}

async function creditRows(schoolId: string, where: { studentMembershipId?: string }): Promise<CreditPushRow[]> {
  const rows = await db.creditPush.findMany({ where: { schoolId, ...where }, orderBy: { createdAt: "desc" }, take: 300, include: { student: { select: { user: { select: { name: true } } } } } });
  const terms = await termNames(schoolId, rows.map((r) => r.termId));
  return rows.map((r) => ({ id: r.id, studentMembershipId: r.studentMembershipId, studentName: r.student.user.name, termId: r.termId, termName: terms.get(r.termId) ?? "—", credits: tenths(r.creditsTenths), apaarId: r.apaarId, abcRef: r.abcRef, status: r.status as CreditPushRow["status"], pushedAt: r.pushedAt?.toISOString() ?? null }));
}

const docRow = (d: { id: string; kind: string; serial: string; code: string; studentMembershipId: string; studentName: string; issuedAt: Date; revokedAt: Date | null }): ExamDocumentRow => ({ id: d.id, kind: d.kind as ExamDocumentRow["kind"], serial: d.serial, code: d.code, studentMembershipId: d.studentMembershipId, studentName: d.studentName, issuedAt: d.issuedAt.toISOString(), revokedAt: d.revokedAt?.toISOString() ?? null });

/**
 * WHEN EACH SESSION'S RESULT FIRST CAME OUT (TA-065), by session: the earliest publication of any of its runs. A
 * session's place among a student's results is this, not its current run's publishedAt, which every corrected run
 * moves to the day it is published — so a corrected run of an earlier session read as later than the supplementary
 * session that cleared its failure, and brought the failure back into the CGPA, the grade card and the placement cell.
 */
export async function sessionsFirstPublished(sessionIds: readonly string[]): Promise<Map<string, number>> {
  const ids = [...new Set(sessionIds)];
  if (ids.length === 0) return new Map();
  const rows = await db.resultRun.groupBy({ by: ["sessionId"], where: { sessionId: { in: ids }, publishedAt: { not: null } }, _min: { publishedAt: true } });
  return new Map(rows.map((r) => [r.sessionId, r._min.publishedAt?.getTime() ?? 0]));
}

/** Every published result of one student: the PUBLISHED run of each session, its term row and course rows, in the order the sessions' results first came out. */
async function publishedResultsOf(schoolId: string, studentMembershipId: string) {
  const found = await db.termResult.findMany({ where: { schoolId, studentMembershipId, run: { status: "PUBLISHED" } }, include: { run: { select: { id: true, publishedAt: true, session: { select: { id: true, name: true, termId: true } } } } }, orderBy: { run: { publishedAt: "asc" } } });
  const first = await sessionsFirstPublished(found.map((t) => t.run.session.id));
  const firstAt = (t: (typeof found)[number]) => first.get(t.run.session.id) ?? t.run.publishedAt?.getTime() ?? 0;
  const terms = [...found].sort((a, b) => firstAt(a) - firstAt(b));
  const rows = terms.length ? await db.courseResult.findMany({ where: { studentMembershipId, runId: { in: terms.map((t) => t.runId) } } }) : [];
  return { terms, rows, firstAt };
}

/** The CGPA and credits of one student from every published result: each course at its latest result, sessions in the order their results first came out. */
async function cgpaOf(schoolId: string, studentMembershipId: string) {
  const { terms, rows, firstAt } = await publishedResultsOf(schoolId, studentMembershipId);
  const at = new Map(terms.map((t) => [t.runId, firstAt(t)]));
  const withAt = rows.map((r) => ({ courseId: r.courseId, creditsTenths: r.creditsTenths, pointsTenths: r.pointsTenths, at: at.get(r.runId) ?? 0, passed: r.status === "PASS" }));
  const latest = new Map<string, (typeof withAt)[number]>();
  for (const r of withAt) if (!latest.has(r.courseId) || latest.get(r.courseId)!.at <= r.at) latest.set(r.courseId, r);
  return { cgpa: cgpaHundredths(withAt), creditsEarnedTenths: [...latest.values()].filter((r) => r.passed).reduce((a, r) => a + r.creditsTenths, 0), terms, rows };
}

/**
 * WHETHER A STUDENT HAS FINISHED THE PROGRAMME (TA-068): the credits earned in published results (cgpaOf's, each
 * course once) and every CREDITED internship's credits (the ones publishRun's credit push carries to the Academic
 * Bank, which a B.Tech's total under the AICTE scheme counts) reach the total their scheme sets. A degree certificate
 * and the convocation list read it beside "no open backlog", which a first-year student with one clean term also
 * met. No seat, no scheme to read: not finished.
 */
async function programmeFinished(schoolId: string, studentMembershipId: string, earnedTenths: number): Promise<{ done: boolean; earned: number; needed: number | null }> {
  const [seat, internships] = await Promise.all([db.studentProgramme.findFirst({ where: { schoolId, studentMembershipId }, select: { scheme: { select: { passingRules: true } } } }), internshipCredits(studentMembershipId)]);
  const needed = seat ? readPassingRules(seat.scheme.passingRules).totalCredits : null;
  const totalTenths = earnedTenths + internships.reduce((a, r) => a + r.credits * 10, 0);
  return { done: needed !== null && totalTenths >= needed * 10, earned: tenths(totalTenths), needed };
}

/** The first day a session's result was published, as a date key in the college's zone. */
async function firstPublishedKey(sessionId: string, timeZone: string): Promise<string | null> {
  const first = await db.resultRun.findFirst({ where: { sessionId, publishedAt: { not: null } }, orderBy: { publishedAt: "asc" }, select: { publishedAt: true } });
  return first?.publishedAt ? dateKeyInZone(first.publishedAt, timeZone) : null;
}

/**
 * A fee as a demand on the student's ledger: none for a free request (no fee),
 * and a refusal (never a silent null) when there is a fee and it cannot be
 * raised — the session's head gone, or no current academic year — so the student is never told "the fee is on your ledger" for nothing
 * (A3-journeys-10). The year is read ON the transaction: the app's `db` inside
 * a tenant transaction runs on another connection with no tenant set, where
 * row-level security answers nothing, which is how every demand was skipped.
 */
async function raiseDemand(tx: Tx, schoolId: string, studentMembershipId: string, feeHeadId: string | null, paise: number, label: string, today: string): Promise<string | null> {
  // A session with no fee head raises nothing, by its own setting (schema: "none raises nothing").
  if (paise <= 0 || !feeHeadId) return null;
  const [head, year] = await Promise.all([
    tx.feeHead.findFirst({ where: { id: feeHeadId, schoolId }, select: { id: true, code: true, name: true } }),
    tx.academicYear.findFirst({ where: { schoolId, isCurrent: true }, orderBy: { startDate: "desc" }, select: { id: true } }),
  ]);
  if (!head || !year) throw new RuleRefusal("examCell.refuseFeeNotRaised", 409);
  const d = await tx.feeDemand.create({ data: { schoolId, studentMembershipId, academicYearId: year.id, instalmentId: null, label, dueDate: dayToDate(today), grossPaise: paise, concessionPaise: 0, netPaise: paise, linesJson: writeJson([{ headId: head.id, code: head.code, name: head.name, grossPaise: paise, concessionPaise: 0 }]), status: "OPEN" }, select: { id: true } });
  return d.id;
}

async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}

/* -------------------------------------------------------------------------- */
/* The student's own                                                            */
/* -------------------------------------------------------------------------- */

/** Whose exams the reader may see: their own as a STUDENT, or a guardian's child under the RESULTS grant. */
async function whoseExams(ctx: ActiveContext, childId?: string): Promise<{ studentMembershipId: string; schoolId: string; name: string; canAct: boolean; seesAttendance: boolean; seesMoney: boolean }> {
  if (ctx.role === "PARENT") {
    // The first child when none is named, as every family door reads it.
    const child = childId ?? (await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE", student: { status: "ACTIVE" } }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true } }))?.studentMembershipId;
    if (!child) throw new AccessError("access.notYourChild", "NOT_FOUND");
    const link = await assertGuardianAccess(ctx.user.id, child, "RESULTS");
    await assertModuleOn(link.student.schoolId, "EXAMS");
    // RESULTS opens the forms; an adult's attendance and what each desk is owed are grants of their own (TA-067).
    const [seesAttendance, seesMoney] = await Promise.all([parentMaySee(child, "ATTENDANCE", ctx.user.id), parentMaySee(child, "MONEY", ctx.user.id)]);
    return { studentMembershipId: child, schoolId: link.student.schoolId, name: link.student.user.preferredName ?? link.student.user.name, canAct: false, seesAttendance, seesMoney };
  }
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  return { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId, name: ctx.user.name, canAct: true, seesAttendance: true, seesMoney: true };
}

/**
 * A student's exams in one read — the web's /student/exams, the phone's
 * screen, and a guardian's /parent/results: the forms (with the fee, the
 * no-dues lines and the backlogs that may still be added), hall tickets and
 * seats, each published result with the window for revaluation, the CGPA,
 * the papers issued, revaluations, backlogs and credits.
 */
export async function myExams(ctx: ActiveContext, childId?: string): Promise<MyExams> {
  const who = await whoseExams(ctx, childId);
  const sid = who.studentMembershipId;
  const timeZone = await zoneOf(who.schoolId);
  const today = todayKey(timeZone);
  const t = await getT();
  const [forms, tickets, seats, docs, openBacklogs, revaluations, backlogs, credits, standing] = await Promise.all([
    db.examForm.findMany({ where: { schoolId: who.schoolId, studentMembershipId: sid }, include: { session: true }, orderBy: { createdAt: "desc" } }),
    db.hallTicket.findMany({ where: { schoolId: who.schoolId, studentMembershipId: sid }, include: { session: { select: { name: true } } }, orderBy: { issuedAt: "desc" } }),
    db.seating.findMany({ where: { schoolId: who.schoolId, studentMembershipId: sid, schedule: { session: { status: { notIn: ["CLOSED"] } } } }, include: { schedule: { select: { courseCode: true, courseName: true, at: true } }, room: { select: { name: true } } }, orderBy: { schedule: { at: "asc" } } }),
    db.examDocument.findMany({ where: { schoolId: who.schoolId, studentMembershipId: sid, revokedAt: null }, orderBy: { issuedAt: "desc" } }),
    db.backlog.findMany({ where: { schoolId: who.schoolId, studentMembershipId: sid, status: "OPEN" }, select: { courseId: true, firstFailedAt: true } }),
    revaluationRows({ schoolId: who.schoolId, studentMembershipId: sid }),
    backlogRows(who.schoolId, { studentMembershipId: sid }, today),
    creditRows(who.schoolId, { studentMembershipId: sid }),
    cgpaOf(who.schoolId, sid),
  ]);
  const courseIds = [...forms.flatMap((f) => formCourses(f.coursesJson).map((c) => c.courseId)), ...openBacklogs.map((b) => b.courseId), ...standing.rows.map((r) => r.courseId)];
  // The fee line says open, paid or waived (QA-42), read from the forms' demands as the cell's session page reads them.
  const formDemands = forms.map((f) => f.feeDemandId).filter((x): x is string => Boolean(x));
  const [courses, demandStatus] = await Promise.all([
    coursesOf(who.schoolId, courseIds),
    formDemands.length ? db.feeDemand.findMany({ where: { schoolId: who.schoolId, id: { in: formDemands } }, select: { id: true, status: true } }).then((ds) => new Map(ds.map((d) => [d.id, d.status]))) : Promise.resolve(new Map<string, string>()),
  ]);
  const name = (await db.membership.findUnique({ where: { id: sid }, select: { studentCode: true, user: { select: { name: true } } } })) ?? { studentCode: null, user: { name: who.name } };
  const results = await Promise.all(
    standing.terms.map(async (term) => {
      const first = await firstPublishedKey(term.run.session.id, timeZone);
      const until = first ? addDaysToKey(first, REVALUATION_WINDOW_DAYS) : null;
      return {
        sessionId: term.run.session.id,
        sessionName: term.run.session.name,
        publishedAt: term.run.publishedAt?.toISOString() ?? null,
        revaluationOpenUntil: until && today <= until ? until : null,
        result: termResultView(term, standing.rows.filter((r) => r.runId === term.runId), courses, { name: name.user.name, code: name.studentCode }),
        // Read as "under correction", not as the old result beside "Marks changed", until the corrected run is published.
        underCorrection: [...new Set(revaluations.filter((r) => r.sessionId === term.run.session.id && r.correction).map((r) => r.courseId))],
      };
    }),
  );
  return {
    name: who.name,
    canAct: who.canAct,
    forms: forms.map((f) => {
      const cs = formCourses(f.coursesJson);
      const snap = readJson<{ courses?: { courseId: string; percent: number | null; threshold: number; condoned: boolean }[]; noDues?: { desk: string; cleared: boolean; owedPaise: number; itemsOut: number }[] }>(f.eligibilityJson, {});
      const short = (snap.courses ?? []).filter((c) => !c.condoned && c.percent !== null && c.percent < c.threshold);
      const open = f.session.status === "FORMS" && (!f.session.formOpensAt || f.session.formOpensAt <= new Date()) && (!f.session.formClosesAt || new Date() <= f.session.formClosesAt);
      return {
        id: f.id,
        sessionId: f.sessionId,
        sessionName: f.session.name,
        status: f.status as MyExams["forms"][number]["status"],
        courses: cs.map((c) => ({ courseId: c.courseId, code: courses.get(c.courseId)?.code ?? "—", name: courses.get(c.courseId)?.name ?? "—", kind: c.kind })),
        eligible: f.status === "DRAFT" && short.length === 0 ? true : f.eligible || f.status !== "DRAFT",
        eligibilityNote: short.length && who.seesAttendance ? t("examCell.shortNote", { courses: short.map((c) => `${courses.get(c.courseId)?.code ?? "—"} ${c.percent}%`).join(", ") }) : null,
        // Without MONEY a guardian is told neither the desks' dues nor the form's fee, late fee or whether it is paid (TA-067).
        noDues: (who.seesMoney && f.noDues) || f.status !== "DRAFT",
        noDuesLines: who.seesMoney ? (snap.noDues ?? []) : [],
        feePaise: who.seesMoney ? f.feePaise : 0,
        lateFeePaise: who.seesMoney ? f.lateFeePaise : 0,
        demandStatus: who.seesMoney && f.feeDemandId ? (demandStatus.get(f.feeDemandId) ?? null) : null,
        ...(who.seesMoney ? {} : { moneyWithheld: true }),
        opensAt: f.session.formOpensAt?.toISOString() ?? null,
        closesAt: f.session.formClosesAt?.toISOString() ?? null,
        windowOpen: open,
        refusalReason: f.refusalReason,
        backlogsToAdd:
          f.status === "DRAFT" && f.session.status === "FORMS"
            ? openBacklogs.filter((b) => !backlogLapsed(b.firstFailedAt, today) && !cs.some((c) => c.courseId === b.courseId)).map((b) => ({ courseId: b.courseId, code: courses.get(b.courseId)?.code ?? "—", name: courses.get(b.courseId)?.name ?? "—" }))
            : [],
      };
    }),
    tickets: tickets.map((x) => ({ id: x.id, number: x.number, sessionName: x.session.name })),
    seating: seats.map((x) => ({ courseCode: x.schedule.courseCode, courseName: x.schedule.courseName, at: x.schedule.at.toISOString(), roomName: x.room.name, seatNo: x.seatNo })),
    results: results.reverse(),
    cgpa: sgpaNumber(standing.cgpa),
    creditsEarned: tenths(standing.creditsEarnedTenths),
    documents: docs.map(docRow),
    revaluations,
    backlogs,
    credits,
  };
}

/** A student asks for a photocopy or a revaluation of a published course, within the window; the fee becomes a demand. */
export async function askRevaluation(ctx: ActiveContext, input: { sessionId: string; courseId: string; kind: "PHOTOCOPY" | "REVAL" }): Promise<ExamActionResult> {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  const schoolId = ctx.schoolId;
  const sid = ctx.membershipId;
  const s = await sessionOf({ schoolId }, input.sessionId);
  const result = await db.courseResult.findFirst({ where: { studentMembershipId: sid, courseId: input.courseId, run: { sessionId: s.id, status: "PUBLISHED" } }, select: { id: true } });
  if (!result) throw new RuleRefusal("examCell.refuseNoResult", 409);
  const timeZone = await zoneOf(schoolId);
  const today = todayKey(timeZone);
  const first = await firstPublishedKey(s.id, timeZone);
  if (!first || today > addDaysToKey(first, REVALUATION_WINDOW_DAYS)) throw new RuleRefusal("examCell.refuseRevalWindow", 409, { days: REVALUATION_WINDOW_DAYS });
  if (await db.revaluation.findUnique({ where: { sessionId_courseId_studentMembershipId_kind: { sessionId: s.id, courseId: input.courseId, studentMembershipId: sid, kind: input.kind } }, select: { id: true } })) throw new RuleRefusal("examCell.refuseRevalAsked", 409);
  const fee = input.kind === "PHOTOCOPY" ? s.photocopyFeePaise : s.revalFeePaise;
  const t = await getT();
  const course = (await coursesOf(schoolId, [input.courseId])).get(input.courseId);
  const { id, demandId } = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const demandId = await raiseDemand(tx, schoolId, sid, s.feeHeadId, fee, t(input.kind === "PHOTOCOPY" ? "examCell.photocopyFeeLabel" : "examCell.revalFeeLabel", { course: course?.code ?? "—", session: s.name }), today);
    return { id: (await tx.revaluation.create({ data: { schoolId, sessionId: s.id, courseId: input.courseId, studentMembershipId: sid, kind: input.kind, feePaise: fee, feeDemandId: demandId }, select: { id: true } })).id, demandId };
  });
  await audit({ schoolId, actorUserId: ctx.user.id, action: "exam.revaluation.ask", targetType: "Revaluation", targetId: id, meta: { kind: input.kind, courseId: input.courseId } });
  const controllers = await db.membership.findMany({ where: { schoolId, role: "EXAM_CONTROLLER", status: "ACTIVE" }, select: { userId: true } });
  await Promise.all(controllers.map((c) => notify({ userId: c.userId, schoolId, kind: "SYSTEM", titleKey: "examCell.notifyRevalAsked", bodyKey: "examCell.notifyRevalAskedBody", bodyVars: { course: course?.code ?? "—" }, url: "/exam-cell/after" })));
  // `count` is the demands raised (0 or 1), so the page says "the fee is on your ledger" only when it is.
  return { ok: true, id, count: demandId ? 1 : 0 };
}

/**
 * The controller decides: a photocopy PROVIDED; a revaluation UNCHANGED or
 * CHANGED with the new external marks — which is a new version of the mark
 * (never an edit), so the change reaches the result through the next run.
 */
export async function decideRevaluation(ctx: ActiveContext, revaluationId: string, input: { outcome: "PROVIDED" | "UNCHANGED" | "CHANGED"; marks?: number | null; note?: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const r = await db.revaluation.findFirst({ where: { id: revaluationId, schoolId: cell.schoolId } });
  if (!r) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  const course = (await coursesOf(cell.schoolId, [r.courseId])).get(r.courseId);
  if (r.status !== "ASKED") {
    // The same decision again is answered as it stands; CHANGED with other marks is not that (TA-570): it was answered
    // 200 and changed nothing, so the controller believed a typo fixed. A decided mark changes through a correction.
    const sameMarks = input.outcome !== "CHANGED" || (input.marks !== null && input.marks !== undefined && course !== undefined && toMilli(input.marks, course.rules.externalMax) === r.newExternalMilli);
    if (r.outcome === input.outcome && sameMarks) return { ok: true, id: r.id, count: null };
    throw new RuleRefusal(r.outcome === input.outcome ? "examCell.refuseRevalRedecide" : "examCell.refuseDecided", 409);
  }
  if ((r.kind === "PHOTOCOPY") !== (input.outcome === "PROVIDED")) throw new RuleRefusal("examCell.refuseOutcome", 422, undefined, "outcome");
  const latest = (await db.examMark.findMany({ where: { sessionId: r.sessionId, courseId: r.courseId, studentMembershipId: r.studentMembershipId }, orderBy: { version: "desc" }, take: 1 }))[0];
  const carry = input.outcome === "CHANGED" && course ? await graceCarry(cell.schoolId, course, r.studentMembershipId) : undefined;
  let newMilli: number | null = null;
  if (input.outcome === "CHANGED") {
    newMilli = input.marks === null || input.marks === undefined || !course ? null : toMilli(input.marks, course.rules.externalMax);
    if (newMilli === null) throw new RuleRefusal("examCell.refuseMarksRange", 422, { max: course?.rules.externalMax ?? 0 }, "marks");
    if (latest && latest.externalMilli === newMilli) throw new RuleRefusal("examCell.refuseRevalSame", 422, undefined, "marks");
  }
  const t = await getT();
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const flipped = await tx.revaluation.updateMany({ where: { id: r.id, status: "ASKED" }, data: { status: "DECIDED", outcome: input.outcome, oldExternalMilli: latest?.externalMilli ?? null, newExternalMilli: newMilli, note: input.note?.trim() || null, decidedByUserId: cell.userId, decidedAt: new Date() } });
    if (flipped.count !== 1 || input.outcome !== "CHANGED") return;
    await newVersion(cell.schoolId, r.sessionId, r.courseId, r.studentMembershipId, cell.userId, { source: "REVALUATION", reason: t("examCell.revalReason"), externalMilli: newMilli, absent: false, carry }, tx);
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.revaluation.decide", targetType: "Revaluation", targetId: r.id, meta: { outcome: input.outcome, newExternalMilli: newMilli } });
  const student = await db.membership.findUnique({ where: { id: r.studentMembershipId }, select: { userId: true } });
  if (student) await notify({ userId: student.userId, schoolId: cell.schoolId, kind: "GRADE", titleKey: "examCell.notifyRevalDecided", bodyKey: input.outcome === "CHANGED" ? "examCell.notifyRevalChangedBody" : "examCell.notifyRevalSameBody", bodyVars: { course: course?.code ?? "—" }, url: "/student/exams" });
  return { ok: true, id: r.id, count: null };
}

/** A student puts an open backlog on their form for a session taking forms — refused once the limit has passed. */
export async function addBacklog(ctx: ActiveContext, input: { sessionId: string; courseId: string }): Promise<ExamActionResult> {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  const schoolId = ctx.schoolId;
  const sid = ctx.membershipId;
  const s = await sessionOf({ schoolId }, input.sessionId);
  if (s.status !== "FORMS") throw new RuleRefusal("examCell.refuseFormsClosed", 409);
  const b = await db.backlog.findUnique({ where: { studentMembershipId_courseId: { studentMembershipId: sid, courseId: input.courseId } } });
  if (!b || b.status !== "OPEN") throw new RuleRefusal("examCell.refuseNoBacklog", 409);
  const today = todayKey(await zoneOf(schoolId));
  if (backlogLapsed(b.firstFailedAt, today)) throw new RuleRefusal("examCell.refuseBacklogLapsed", 409, { day: backlogLastDay(b.firstFailedAt) });
  const form = await db.examForm.upsert({ where: { sessionId_studentMembershipId: { sessionId: s.id, studentMembershipId: sid } }, create: { schoolId, sessionId: s.id, studentMembershipId: sid, coursesJson: "[]" }, update: {}, select: { id: true, status: true, coursesJson: true } });
  if (form.status !== "DRAFT") throw new RuleRefusal("examCell.refuseFormNotDraft", 409);
  const courses = formCourses(form.coursesJson);
  if (!courses.some((c) => c.courseId === input.courseId)) {
    const next: FormCourse[] = [...courses, { courseId: input.courseId, kind: "BACKLOG" }];
    await db.examForm.updateMany({ where: { id: form.id, status: "DRAFT" }, data: { coursesJson: writeJson(next) } });
    await audit({ schoolId, actorUserId: ctx.user.id, action: "exam.backlog.register", targetType: "ExamForm", targetId: form.id, meta: { courseId: input.courseId } });
  }
  return { ok: true, id: form.id, count: null };
}

/* -------------------------------------------------------------------------- */
/* After results: the controller's desk                                         */
/* -------------------------------------------------------------------------- */

/**
 * The desk after results. `q` finds a student for a grade card, transcript or degree by name or roll number (TA-302:
 * the list stops at 500 in name order, and a college past that had no way to reach the rest from the page); every
 * revaluation still ASKED is listed, however old, before the 300 newest decided ones.
 */
export async function afterView(ctx: ActiveContext, opts: { q?: string } = {}): Promise<ExamAfter> {
  const cell = await cellOf(ctx, "read");
  const today = todayKey(cell.timeZone);
  const q = opts.q?.trim().slice(0, 100) ?? "";
  const [asked, decided, backlogs, docs, credits, students, convocations] = await Promise.all([
    revaluationRows({ schoolId: cell.schoolId, status: "ASKED" }, null),
    revaluationRows({ schoolId: cell.schoolId, status: { not: "ASKED" } }),
    backlogRows(cell.schoolId, {}, today),
    db.examDocument.findMany({ where: { schoolId: cell.schoolId }, orderBy: { issuedAt: "desc" }, take: 200 }),
    creditRows(cell.schoolId, {}),
    db.membership.findMany({
      where: { schoolId: cell.schoolId, role: "STUDENT", termResults: { some: { run: { status: "PUBLISHED" } } }, ...(q ? { OR: [{ user: { name: { contains: q, mode: "insensitive" as const } } }, { studentCode: { contains: q, mode: "insensitive" as const } }] } : {}) },
      select: { id: true, studentCode: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
      take: 500,
    }),
    cell.autonomous ? db.convocation.findMany({ where: { schoolId: cell.schoolId }, orderBy: { year: "desc" } }) : Promise.resolve([]),
  ]);
  return {
    autonomous: cell.autonomous,
    canWrite: cell.canWrite,
    revaluations: [...asked, ...decided],
    backlogs,
    documents: docs.map(docRow),
    credits,
    abcConnected: process.env.ABC_STUB_SEND === "1",
    students: students.map((m) => ({ membershipId: m.id, name: m.user.name, code: m.studentCode })),
    convocations: convocations.map((c) => ({ year: c.year, status: c.status as "DRAFT" | "FINAL", graduates: readJsonArray(c.listJson).length, finalizedAt: c.finalizedAt?.toISOString() ?? null })),
  };
}

export type ExamDocumentData = {
  kind: "GRADE_CARD" | "TRANSCRIPT" | "DEGREE";
  college: { name: string; university: string | null; autonomous: boolean };
  student: { name: string; code: string | null; prn: string | null; programme: string | null };
  terms: { sessionName: string; publishedOn: string | null; sgpa: number | null; credits: number; status: string; cls: string | null; courses: { code: string; name: string; credits: number; grade: string; points: number; status: string }[] }[];
  cgpa: number | null;
  creditsEarned: number;
  cls: string | null;
  yearOfPassing: number | null;
};

/**
 * Issue a grade card (the latest published term), a transcript (every
 * published term) or — an autonomous college's alone — a degree certificate
 * (no open backlog). Numbered per kind and year under the year's lock (the
 * current academic year's row, as certificates are; the college's own row
 * when it keeps no academic year), frozen as printed, with the issuing
 * controller's signature and the seal copied in, and a code for the check.
 */
export async function issueDocument(ctx: ActiveContext, input: { kind: "GRADE_CARD" | "TRANSCRIPT" | "DEGREE"; studentMembershipId: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  if (input.kind === "DEGREE") assertAutonomous(cell);
  const student = await db.membership.findFirst({ where: { id: input.studentMembershipId, schoolId: cell.schoolId, role: "STUDENT" }, select: { id: true, userId: true, studentCode: true, user: { select: { name: true } } } });
  if (!student) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  const standing = await cgpaOf(cell.schoolId, student.id);
  if (standing.terms.length === 0) throw new RuleRefusal("examCell.refuseNoResult", 409);
  if (input.kind === "DEGREE" && (await db.backlog.count({ where: { studentMembershipId: student.id, status: "OPEN" } })) > 0) throw new RuleRefusal("examCell.refuseDegreeBacklogs", 409);
  if (input.kind === "DEGREE") {
    const finished = await programmeFinished(cell.schoolId, student.id, standing.creditsEarnedTenths);
    if (!finished.done) throw new RuleRefusal("examCell.refuseDegreeCredits", 409, { earned: finished.earned, needed: finished.needed ?? "—" });
  }
  const [school, seats, ids, courses, signature, sealImg, year] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: cell.schoolId }, select: { name: true, affiliatingUniversity: true } }),
    seatsOf(cell.schoolId, [student.id]),
    studentIdsOf(cell.schoolId, [student.id]),
    coursesOf(cell.schoolId, standing.rows.map((r) => r.courseId)),
    db.signatureImage.findFirst({ where: { schoolId: cell.schoolId, membershipId: cell.membershipId, kind: "PERSON" }, select: { png: true } }),
    db.signatureImage.findFirst({ where: { schoolId: cell.schoolId, kind: "SEAL" }, select: { png: true } }),
    currentAcademicYear(cell.schoolId),
  ]);
  const terms = (input.kind === "GRADE_CARD" ? standing.terms.slice(-1) : standing.terms).map((term) => ({
    sessionName: term.run.session.name,
    publishedOn: term.run.publishedAt ? dateKeyInZone(term.run.publishedAt, cell.timeZone) : null,
    sgpa: sgpaNumber(term.sgpaHundredths),
    credits: tenths(term.creditsEarnedTenths),
    status: term.status,
    cls: term.cls,
    courses: standing.rows.filter((r) => r.runId === term.runId).map((r) => ({ code: courses.get(r.courseId)?.code ?? "—", name: courses.get(r.courseId)?.name ?? "—", credits: tenths(r.creditsTenths), grade: r.grade, points: r.pointsTenths / 10, status: r.status })).sort((a, b) => a.code.localeCompare(b.code)),
  }));
  const anyCourse = [...courses.values()][0];
  const lastPublished = standing.terms[standing.terms.length - 1]?.run.publishedAt ?? null;
  const data: ExamDocumentData = {
    kind: input.kind,
    college: { name: school.name, university: school.affiliatingUniversity, autonomous: cell.autonomous },
    student: { name: student.user.name, code: student.studentCode, prn: ids.get(student.id)?.prn ?? null, programme: seats.get(student.id)?.programmeName ?? null },
    terms,
    cgpa: sgpaNumber(standing.cgpa),
    creditsEarned: tenths(standing.creditsEarnedTenths),
    cls: classFor(standing.cgpa, anyCourse?.rules.classBands ?? []),
    yearOfPassing: input.kind === "DEGREE" && lastPublished ? Number(dateKeyInZone(lastPublished, cell.timeZone).slice(0, 4)) : null,
  };
  const yearLabel = year?.name ?? todayKey(cell.timeZone).slice(0, 4);
  const prefix = DOC_PREFIX[input.kind];
  const issued = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    if (year) await tx.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
    else await tx.$queryRaw`SELECT "id" FROM "School" WHERE "id" = ${cell.schoolId} FOR UPDATE`;
    const last = await tx.examDocument.findFirst({ where: { schoolId: cell.schoolId, kind: input.kind, yearLabel }, orderBy: { number: "desc" }, select: { number: true } });
    const number = (last?.number ?? 0) + 1;
    return tx.examDocument.create({
      data: { schoolId: cell.schoolId, studentMembershipId: student.id, kind: input.kind, sessionId: standing.terms[standing.terms.length - 1]?.run.session.id ?? null, runId: standing.terms[standing.terms.length - 1]?.runId ?? null, yearLabel, number, serial: `${prefix}/${yearLabel}/${String(number).padStart(4, "0")}`, code: checkCode(randomBytes(10)), studentName: student.user.name, dataJson: JSON.stringify(data), signaturePng: signature?.png ?? null, sealPng: sealImg?.png ?? null, issuedByUserId: cell.userId },
      select: { id: true, serial: true },
    });
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.document.issue", targetType: "ExamDocument", targetId: issued.id, meta: { kind: input.kind, serial: issued.serial, studentMembershipId: student.id } });
  await notify({ userId: student.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyDocument", bodyKey: "examCell.notifyDocumentBody", bodyVars: { serial: issued.serial }, url: "/student/exams" });
  return { ok: true, id: issued.id, count: null };
}

/**
 * A PAPER WITHDRAWN (TA-068): a grade card, transcript or degree issued by mistake, or one whose result was corrected
 * since, had no way to stop answering "valid" at the public check. The controller withdraws it with a reason: the row
 * keeps when and why (the words on the row only; the log, in the same transaction, says one was given), the public
 * check then answers that it was revoked, and the student's own list stops offering it. Withdrawn once and for good;
 * the same request again is answered as it stands.
 */
export async function revokeDocument(ctx: ActiveContext, documentId: string, input: { reason: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const d = await db.examDocument.findFirst({ where: { id: documentId, schoolId: cell.schoolId }, select: { id: true, kind: true, serial: true, revokedAt: true } });
  if (!d) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (d.revokedAt) return { ok: true, id: d.id, count: null };
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const claimed = await tx.examDocument.updateMany({ where: { id: d.id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: input.reason.trim() } });
    if (claimed.count === 1) await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.document.revoke", targetType: "ExamDocument", targetId: d.id, meta: { kind: d.kind, serial: d.serial, reasonGiven: true } }, tx);
  });
  return { ok: true, id: d.id, count: null };
}

/** Who may read an exam paper's PDF: its student, a guardian under RESULTS, and the cell's readers at its college. */
async function mayReadStudentPaper(ctx: ActiveContext, row: { schoolId: string; studentMembershipId: string }): Promise<void> {
  if (ctx.role === "STUDENT" && ctx.membershipId === row.studentMembershipId) return assertModuleOn(row.schoolId, "EXAMS");
  if (ctx.role === "PARENT") {
    await assertGuardianAccess(ctx.user.id, row.studentMembershipId, "RESULTS");
    return assertModuleOn(row.schoolId, "EXAMS");
  }
  if (ctx.schoolId === row.schoolId && (ctx.role === "EXAM_CONTROLLER" || ctx.role === "ADMIN" || ctx.role === "PRINCIPAL")) return assertModuleOn(row.schoolId, "EXAMS");
  throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
}

export async function documentForPdf(ctx: ActiveContext, documentId: string) {
  const row = await db.examDocument.findUnique({ where: { id: documentId } });
  if (!row) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  await mayReadStudentPaper(ctx, row);
  const issuer = await db.user.findUnique({ where: { id: row.issuedByUserId }, select: { name: true } });
  return { row, data: JSON.parse(row.dataJson) as ExamDocumentData, issuerName: issuer?.name ?? "—" };
}

/** A hall ticket's facts for its PDF: the student, the photo (an uploaded picture), the papers with hall and seat. */
export async function hallTicketForPdf(ctx: ActiveContext, ticketId: string) {
  const ticket = await db.hallTicket.findUnique({ where: { id: ticketId }, include: { session: { select: { name: true } }, form: { select: { coursesJson: true } }, student: { select: { studentCode: true, status: true, leftAt: true, user: { select: { name: true, avatarKey: true } } } } } });
  if (!ticket) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  await mayReadStudentPaper(ctx, ticket);
  // A ticket admits to the hall: none is printed for a student who has left (A3-S-15).
  if (ticket.student.status !== "ACTIVE" || ticket.student.leftAt !== null) throw new AccessError("examCell.refuseTicketLeft");
  const [school, schedules, seats, ids, programme] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: ticket.schoolId }, select: { name: true, timezone: true, affiliatingUniversity: true } }),
    db.examSchedule.findMany({ where: { sessionId: ticket.sessionId }, select: { id: true, courseId: true, courseCode: true, courseName: true, at: true } }),
    db.seating.findMany({ where: { formId: ticket.formId }, select: { scheduleId: true, seatNo: true, room: { select: { name: true } } } }),
    studentIdsOf(ticket.schoolId, [ticket.studentMembershipId]),
    seatsOf(ticket.schoolId, [ticket.studentMembershipId]),
  ]);
  const courseIds = formCourses(ticket.form.coursesJson);
  const courses = await coursesOf(ticket.schoolId, courseIds.map((c) => c.courseId));
  const papers = courseIds
    .map((c) => {
      const sch = schedules.find((x) => x.courseId === c.courseId);
      const seat = sch ? seats.find((x) => x.scheduleId === sch.id) : undefined;
      return { code: sch?.courseCode ?? courses.get(c.courseId)?.code ?? "—", name: sch?.courseName ?? courses.get(c.courseId)?.name ?? "—", kind: c.kind, at: sch?.at ?? null, room: seat?.room.name ?? null, seatNo: seat?.seatNo ?? null };
    })
    .sort((a, b) => (a.at?.getTime() ?? Infinity) - (b.at?.getTime() ?? Infinity));
  // No photo from the avatar key: an `upload:` key read any stored blob, unchecked (A3-S-1; id-card.ts says why).
  const avatar: string | null = null;
  return { ticket, school, papers, prn: ids.get(ticket.studentMembershipId)?.prn ?? null, programme: programme.get(ticket.studentMembershipId)?.programmeName ?? null, photoFileId: avatar };
}

/** A hall's attendance sheet for one paper: the seats in order with names and ticket numbers, and a column to sign. */
export async function attendanceSheetData(ctx: ActiveContext, examRoomId: string) {
  const cell = await cellOf(ctx, "read");
  const room = await db.examRoom.findFirst({ where: { id: examRoomId, schoolId: cell.schoolId }, include: { session: { select: { name: true } }, schedule: { select: { courseCode: true, courseName: true, at: true, durationMin: true } }, seats: { orderBy: { seatNo: "asc" }, include: { student: { select: { studentCode: true, user: { select: { name: true } } } }, form: { select: { ticket: { select: { number: true } } } } } }, invigilation: { include: { staff: { select: { user: { select: { name: true } } } } } } } });
  if (!room) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({ where: { id: cell.schoolId }, select: { name: true, timezone: true } });
  return { room, school };
}

/** Credits waiting for the Academic Bank, sent. The transport is a stub (ABC_STUB_SEND=1 marks SENT with a made-up reference); a student with no APAAR id FAILS. */
export async function pushCredits(ctx: ActiveContext, termId?: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  // What was sent is checked before whether the bank is connected (W-12): a term that is not the college's is 404 either way.
  if (termId && !(await db.academicTerm.findFirst({ where: { id: termId, schoolId: cell.schoolId }, select: { id: true } }))) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (process.env.ABC_STUB_SEND !== "1") throw new RuleRefusal("examCell.refuseAbcNotConnected", 409);
  const rows = await db.creditPush.findMany({ where: { schoolId: cell.schoolId, status: { in: ["PENDING", "FAILED"] }, ...(termId ? { termId } : {}) }, select: { id: true, studentMembershipId: true, apaarId: true } });
  const ids = await studentIdsOf(cell.schoolId, rows.map((r) => r.studentMembershipId));
  let sent = 0;
  for (const r of rows) {
    const apaarId = r.apaarId ?? ids.get(r.studentMembershipId)?.apaarId ?? null;
    if (!apaarId) await db.creditPush.update({ where: { id: r.id }, data: { status: "FAILED", error: "NO_APAAR" } });
    else {
      await db.creditPush.update({ where: { id: r.id }, data: { status: "SENT", apaarId, abcRef: `ABC-STUB-${randomBytes(5).toString("hex").toUpperCase()}`, pushedAt: new Date(), error: null } });
      sent += 1;
    }
  }
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.credits.push", targetType: "School", targetId: cell.schoolId, meta: { rows: rows.length, sent, stub: true } });
  return { ok: true, id: null, count: sent };
}

/**
 * An autonomous college's convocation list for a year: every student whose
 * latest published term result passed in a run published that year, who
 * carries no open backlog and who has earned the programme's credits
 * (TA-068), with the CGPA and class. Drawn again while a draft; final once
 * finalised.
 */
export async function buildConvocation(ctx: ActiveContext, input: { year: number; finalize: boolean }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  assertAutonomous(cell);
  const existing = await db.convocation.findUnique({ where: { schoolId_year: { schoolId: cell.schoolId, year: input.year } } });
  if (existing?.status === "FINAL") throw new RuleRefusal("examCell.refuseConvocationFinal", 409);
  const from = new Date(Date.UTC(input.year, 0, 1));
  const to = new Date(Date.UTC(input.year + 1, 0, 1));
  const terms = await db.termResult.findMany({ where: { schoolId: cell.schoolId, status: "PASS", run: { status: "PUBLISHED", publishedAt: { gte: from, lt: to } } }, select: { studentMembershipId: true } });
  const candidates = [...new Set(terms.map((t) => t.studentMembershipId))];
  const [open, people, seats] = await Promise.all([
    db.backlog.findMany({ where: { schoolId: cell.schoolId, status: "OPEN", studentMembershipId: { in: candidates } }, select: { studentMembershipId: true } }),
    db.membership.findMany({ where: { id: { in: candidates } }, select: { id: true, user: { select: { name: true } } } }),
    seatsOf(cell.schoolId, candidates),
  ]);
  const blocked = new Set(open.map((b) => b.studentMembershipId));
  const list = [];
  for (const p of people.filter((x) => !blocked.has(x.id)).sort((a, b) => a.user.name.localeCompare(b.user.name))) {
    const standing = await cgpaOf(cell.schoolId, p.id);
    // The year's graduates are those who finished the programme (TA-068), not every student with a clean term.
    if (!(await programmeFinished(cell.schoolId, p.id, standing.creditsEarnedTenths)).done) continue;
    const rules = (await coursesOf(cell.schoolId, standing.rows.slice(0, 1).map((r) => r.courseId))).values().next().value?.rules;
    list.push({ studentMembershipId: p.id, name: p.user.name, programme: seats.get(p.id)?.programmeName ?? null, cgpa: sgpaNumber(standing.cgpa), cls: classFor(standing.cgpa, rules?.classBands ?? []) });
  }
  const row = await db.convocation.upsert({ where: { schoolId_year: { schoolId: cell.schoolId, year: input.year } }, create: { schoolId: cell.schoolId, year: input.year, listJson: JSON.stringify(list), status: input.finalize ? "FINAL" : "DRAFT", finalizedAt: input.finalize ? new Date() : null, createdByUserId: cell.userId }, update: { listJson: JSON.stringify(list), status: input.finalize ? "FINAL" : "DRAFT", finalizedAt: input.finalize ? new Date() : null }, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: input.finalize ? "exam.convocation.final" : "exam.convocation.build", targetType: "Convocation", targetId: row.id, meta: { year: input.year, graduates: list.length } });
  return { ok: true, id: row.id, count: list.length };
}

/* -------------------------------------------------------------------------- */
/* Autonomous conduct                                                           */
/* -------------------------------------------------------------------------- */

export async function conductView(ctx: ActiveContext, sessionId: string): Promise<ExamConduct> {
  const cell = await cellOf(ctx, "read");
  assertAutonomous(cell);
  const s = await sessionOf(cell, sessionId);
  const [papers, printing, allocations] = await Promise.all([
    db.questionPaper.findMany({ where: { sessionId: s.id }, include: { schedule: { select: { courseCode: true } }, setter: { select: { user: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } }),
    db.printingList.findMany({ where: { sessionId: s.id }, include: { room: { select: { name: true, schedule: { select: { courseCode: true } } } } } }),
    db.assessmentAllocation.findMany({ where: { sessionId: s.id }, include: { schedule: { select: { courseCode: true } }, assessor: { select: { user: { select: { name: true } } } } }, orderBy: { bundle: "asc" } }),
  ]);
  return {
    papers: papers.map((p) => ({ id: p.id, scheduleId: p.scheduleId, courseCode: p.schedule.courseCode, setterMembershipId: p.setterMembershipId, setterName: p.setter.user.name, status: p.status as ExamConduct["papers"][number]["status"], coMap: readJsonArray(p.coMapJson), fileName: p.fileName, sizeBytes: p.sizeBytes, submittedAt: p.submittedAt?.toISOString() ?? null, moderatedAt: p.moderatedAt?.toISOString() ?? null, moderationNote: p.moderationNote, opens: readJsonArray(p.accessLogJson).length })),
    printing: printing.map((p) => ({ id: p.id, scheduleId: p.scheduleId, courseCode: p.room.schedule.courseCode, roomName: p.room.name, seated: p.seated, spare: p.spare, count: p.count })).sort((a, b) => a.courseCode.localeCompare(b.courseCode) || a.roomName.localeCompare(b.roomName)),
    allocations: allocations.map((a) => ({ id: a.id, scheduleId: a.scheduleId, courseCode: a.schedule.courseCode, assessorMembershipId: a.assessorMembershipId, assessorName: a.assessor.user.name, bundle: a.bundle, count: a.count, status: a.status as "ALLOTTED" | "RETURNED" })),
  };
}

async function facultyAt(schoolId: string, membershipId: string) {
  const m = await db.membership.findFirst({ where: { id: membershipId, schoolId, status: "ACTIVE", role: { in: [...SETTER_ROLES] } }, select: { id: true, userId: true } });
  if (!m) throw new RuleRefusal("examCell.refuseStaff", 422, undefined, "setterMembershipId");
  return m;
}

export async function assignPaper(ctx: ActiveContext, sessionId: string, input: { scheduleId: string; setterMembershipId: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  assertAutonomous(cell);
  const s = await sessionOf(cell, sessionId);
  const schedule = await db.examSchedule.findFirst({ where: { id: input.scheduleId, sessionId: s.id }, select: { id: true, courseCode: true } });
  if (!schedule) throw new RuleRefusal("examCell.refuseSchedule", 422, undefined, "scheduleId");
  const setter = await facultyAt(cell.schoolId, input.setterMembershipId);
  const row = await db.questionPaper.upsert({ where: { scheduleId_setterMembershipId: { scheduleId: schedule.id, setterMembershipId: setter.id } }, create: { schoolId: cell.schoolId, sessionId: s.id, scheduleId: schedule.id, setterMembershipId: setter.id, assignedByUserId: cell.userId }, update: {}, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.paper.assign", targetType: "QuestionPaper", targetId: row.id, meta: { courseCode: schedule.courseCode, setterMembershipId: setter.id } });
  await notify({ userId: setter.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyPaper", titleVars: { course: schedule.courseCode }, bodyKey: "examCell.notifyPaperBody", url: "/faculty/exams" });
  return { ok: true, id: row.id, count: null };
}

const paperBound = (schoolId: string, paperId: string) => `${schoolId}|QuestionPaper|${paperId}`;

/**
 * The setter's paper, sealed at once: a PDF (at most 2 MB) and its outcome
 * map. Kept only sealed (secret-box, bound to this row); the setter may
 * replace it until it is moderated.
 */
export async function submitPaper(ctx: ActiveContext, paperId: string, input: { fileName: string; mime: string; dataBase64: string; coMap: { question: string; co: string; marks: number }[] }): Promise<ExamActionResult> {
  if (!ctx.schoolId || !ctx.membershipId || !(SETTER_ROLES as readonly string[]).includes(ctx.role ?? "")) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  if (!(await isAutonomous(ctx.schoolId))) throw new AccessError("examCell.refuseNotAutonomous");
  const p = await db.questionPaper.findFirst({ where: { id: paperId, schoolId: ctx.schoolId, setterMembershipId: ctx.membershipId } });
  if (!p) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (p.status === "MODERATED") throw new RuleRefusal("examCell.refusePaperModerated", 409);
  if (!sealingAvailable()) throw new RuleRefusal("examCell.refuseSealing", 409);
  const bytes = Buffer.from(input.dataBase64, "base64");
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024 || bytes.subarray(0, 5).toString("latin1") !== "%PDF-") throw new RuleRefusal("examCell.refusePaperFile", 422, undefined, "dataBase64");
  // Written only while the paper is still not moderated (TA-529): an upload racing the exam cell's Moderate replaced
  // the sealed body and set it back to SUBMITTED under a moderation of a text no longer stored. A new body clears any
  // earlier moderation's fields with it.
  const stored = await db.questionPaper.updateMany({ where: { id: p.id, schoolId: p.schoolId, status: { not: "MODERATED" } }, data: { status: "SUBMITTED", sealedBody: seal(bytes.toString("base64"), paperBound(p.schoolId, p.id)), fileName: input.fileName, mime: "application/pdf", sizeBytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), coMapJson: writeJson(input.coMap), submittedAt: new Date(), moderatedByUserId: null, moderatedAt: null, moderationNote: null } });
  if (stored.count === 0) throw new RuleRefusal("examCell.refusePaperModerated", 409);
  await audit({ schoolId: p.schoolId, actorUserId: ctx.user.id, action: "exam.paper.submit", targetType: "QuestionPaper", targetId: p.id, meta: { sizeBytes: bytes.length, questions: input.coMap.length } });
  return { ok: true, id: p.id, count: null };
}

export async function moderatePaper(ctx: ActiveContext, paperId: string, note: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  assertAutonomous(cell);
  const p = await db.questionPaper.findFirst({ where: { id: paperId, schoolId: cell.schoolId }, select: { id: true, status: true } });
  if (!p) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (p.status === "ASSIGNED") throw new RuleRefusal("examCell.refusePaperNotSubmitted", 409);
  if (p.status !== "MODERATED") {
    // On the submitted paper only (TA-529); one moderated meanwhile by another press is answered as it stands.
    const moved = await db.questionPaper.updateMany({ where: { id: p.id, schoolId: cell.schoolId, status: "SUBMITTED" }, data: { status: "MODERATED", moderatedByUserId: cell.userId, moderatedAt: new Date(), moderationNote: note } });
    if (moved.count === 0) return { ok: true, id: p.id, count: null };
    await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.paper.moderate", targetType: "QuestionPaper", targetId: p.id });
  }
  return { ok: true, id: p.id, count: null };
}

/**
 * THE SEALED STORE, OPENED: the controller's alone, at an autonomous college,
 * straight into the response that sends it. Every opening is appended to the
 * paper's access log and audited before the bytes leave.
 */
export async function openPaper(ctx: ActiveContext, paperId: string): Promise<{ bytes: Buffer; fileName: string }> {
  const cell = await cellOf(ctx);
  assertAutonomous(cell);
  const p = await db.questionPaper.findFirst({ where: { id: paperId, schoolId: cell.schoolId } });
  if (!p) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (!p.sealedBody) throw new RuleRefusal("examCell.refusePaperNotSubmitted", 409);
  const bytes = Buffer.from(openSealed(p.sealedBody, paperBound(p.schoolId, p.id)), "base64");
  // Appended under the paper's row lock (TA-498): two openings at once each read the log as the other left it, so
  // neither line is lost; the audit row goes in the same transaction.
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "QuestionPaper" WHERE "id" = ${p.id} FOR UPDATE`;
    const now = await tx.questionPaper.findUniqueOrThrow({ where: { id: p.id }, select: { accessLogJson: true } });
    const log = [...readJsonArray<{ userId: string; at: string }>(now.accessLogJson), { userId: cell.userId, at: new Date().toISOString() }];
    await tx.questionPaper.update({ where: { id: p.id }, data: { accessLogJson: writeJson(log) } });
    await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.paper.open", targetType: "QuestionPaper", targetId: p.id, meta: { opens: log.length } }, tx);
  });
  return { bytes, fileName: p.fileName ?? "paper.pdf" };
}

/** The printing list of every hall: who sits there and a few spare. Its one writer (data:audit checks seated against the seats). */
export async function buildPrintingLists(ctx: ActiveContext, sessionId: string, spare: number): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  assertAutonomous(cell);
  const s = await sessionOf(cell, sessionId);
  const rooms = await db.examRoom.findMany({ where: { sessionId: s.id }, select: { id: true, scheduleId: true, _count: { select: { seats: true } } } });
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    for (const r of rooms) {
      const seated = r._count.seats;
      const count = seated > 0 ? seated + spare : 0;
      await tx.printingList.upsert({ where: { scheduleId_examRoomId: { scheduleId: r.scheduleId, examRoomId: r.id } }, create: { schoolId: cell.schoolId, sessionId: s.id, scheduleId: r.scheduleId, examRoomId: r.id, seated, spare, count }, update: { seated, spare, count } });
    }
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.printing.build", targetType: "ExamSession", targetId: s.id, meta: { rooms: rooms.length, spare } });
  return { ok: true, id: s.id, count: rooms.length };
}

export async function saveAllocation(ctx: ActiveContext, sessionId: string, input: { scheduleId: string; assessorMembershipId: string; bundle: string; count: number }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  assertAutonomous(cell);
  const s = await sessionOf(cell, sessionId);
  const schedule = await db.examSchedule.findFirst({ where: { id: input.scheduleId, sessionId: s.id }, select: { id: true, courseCode: true } });
  if (!schedule) throw new RuleRefusal("examCell.refuseSchedule", 422, undefined, "scheduleId");
  const assessor = await facultyAt(cell.schoolId, input.assessorMembershipId);
  const row = await db.assessmentAllocation.upsert({ where: { scheduleId_bundle: { scheduleId: schedule.id, bundle: input.bundle } }, create: { schoolId: cell.schoolId, sessionId: s.id, scheduleId: schedule.id, assessorMembershipId: assessor.id, bundle: input.bundle, count: input.count }, update: { assessorMembershipId: assessor.id, count: input.count }, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.assessment.allot", targetType: "AssessmentAllocation", targetId: row.id, meta: { bundle: input.bundle, count: input.count } });
  await notify({ userId: assessor.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyBundle", titleVars: { course: schedule.courseCode, bundle: input.bundle }, bodyKey: "examCell.notifyBundleBody", url: "/faculty/exams" });
  return { ok: true, id: row.id, count: null };
}

export async function returnAllocation(ctx: ActiveContext, allocationId: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  assertAutonomous(cell);
  const a = await db.assessmentAllocation.findFirst({ where: { id: allocationId, schoolId: cell.schoolId }, select: { id: true, status: true } });
  if (!a) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (a.status !== "RETURNED") {
    await db.assessmentAllocation.update({ where: { id: a.id }, data: { status: "RETURNED", returnedAt: new Date() } });
    await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.assessment.return", targetType: "AssessmentAllocation", targetId: a.id });
  }
  return { ok: true, id: a.id, count: null };
}

/* -------------------------------------------------------------------------- */
/* A faculty member's duties; the controller's signature; the public check      */
/* -------------------------------------------------------------------------- */

export async function myDuties(ctx: ActiveContext): Promise<ExamDuties> {
  if (!ctx.schoolId || !ctx.membershipId || (ctx.role !== "FACULTY" && ctx.role !== "HOD")) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  const me = ctx.membershipId;
  const [inv, papers, bundles, pay] = await Promise.all([
    db.invigilation.findMany({ where: { schoolId: ctx.schoolId, staffMembershipId: me }, include: { session: { select: { name: true } }, room: { select: { name: true, schedule: { select: { courseCode: true, at: true } } } } }, orderBy: { room: { schedule: { at: "asc" } } } }),
    db.questionPaper.findMany({ where: { schoolId: ctx.schoolId, setterMembershipId: me }, include: { session: { select: { name: true } }, schedule: { select: { courseCode: true, at: true } } } }),
    db.assessmentAllocation.findMany({ where: { schoolId: ctx.schoolId, assessorMembershipId: me }, include: { session: { select: { name: true } }, schedule: { select: { courseCode: true } } } }),
    db.remuneration.findMany({ where: { schoolId: ctx.schoolId, staffMembershipId: me }, include: { session: { select: { name: true } } } }),
  ]);
  return {
    invigilation: inv.map((i) => ({ id: i.id, sessionName: i.session.name, courseCode: i.room.schedule.courseCode, at: i.room.schedule.at.toISOString(), roomName: i.room.name, status: i.status as "ASSIGNED" | "SWAPPED" | "DONE" })),
    papers: papers.map((p) => ({ id: p.id, sessionName: p.session.name, courseCode: p.schedule.courseCode, at: p.schedule.at.toISOString(), status: p.status as "ASSIGNED" | "SUBMITTED" | "MODERATED" })),
    bundles: bundles.map((b) => ({ id: b.id, sessionName: b.session.name, courseCode: b.schedule.courseCode, bundle: b.bundle, count: b.count, status: b.status as "ALLOTTED" | "RETURNED" })),
    remuneration: pay.map((r) => ({ sessionName: r.session.name, kind: r.kind as "SETTER" | "MODERATOR" | "INVIGILATOR" | "ASSESSOR", count: r.count, amountPaise: r.count * r.ratePaise })),
  };
}

/** The controller's own signature, for the grade cards and transcripts they issue (the signatures module's picture rules). */
export async function saveControllerSignature(ctx: ActiveContext, image: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const png = pngFrom(image, SIGNATURE_LIMIT);
  await db.signatureImage.upsert({ where: { membershipId: cell.membershipId }, create: { schoolId: cell.schoolId, kind: "PERSON", membershipId: cell.membershipId, png }, update: { png, schoolId: cell.schoolId } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "signature.set", targetType: "Membership", targetId: cell.membershipId });
  return { ok: true, id: null, count: null };
}

/**
 * THE PUBLIC CHECK of a grade card, transcript, degree or hall ticket: that
 * the paper is real, from which college, of which kind and when — never
 * whose. A grade card, transcript or degree is found by its code alone
 * (A3-journeys-21: someone typing the code by hand has no college id; the
 * row is code-readable, exam-document-check.ts). A hall ticket's printed
 * address carries the college's id beside the code, so that lookup runs
 * inside the college's fence (a signed-out caller has no tenant of their
 * own); with no college id a hall ticket's code answers "not found".
 */
export async function checkExamDocument(schoolId: string | null | undefined, code: string): Promise<ExamDocumentCheck> {
  const none: ExamDocumentCheck = { valid: false, kind: null, serial: null, schoolName: null, issuedAt: null, revokedAt: null };
  const clean = code.trim().toUpperCase();
  if (!EXAM_CODE_SHAPE.test(clean)) return none;
  const byCode = await examDocumentByCode(clean);
  if (byCode) return byCode;
  if (!schoolId || !/^c[a-z0-9]{20,}$/.test(schoolId)) return none;
  return forSchool(schoolId, async () => {
    const ticket = await db.hallTicket.findFirst({ where: { schoolId, code: clean }, select: { number: true, issuedAt: true, session: { select: { status: true } }, student: { select: { status: true, leftAt: true } } } });
    if (!ticket) return none;
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } });
    // A ticket admits to the hall: one of a student who has left is not valid (TA-569), as its PDF is no longer printed (A3-S-15).
    const stillHere = ticket.student.status === "ACTIVE" && ticket.student.leftAt === null;
    return { valid: ticket.session.status !== "CLOSED" && stillHere, kind: "HALL_TICKET", serial: ticket.number, schoolName: school?.name ?? null, issuedAt: ticket.issuedAt.toISOString(), revokedAt: null };
  });
}

export { statusAtLeast };
