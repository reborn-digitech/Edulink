import "server-only";
import type { ExamActionResult, ExamAnalytics, ExamMarksSheet, ExamResults, PassRateRow, TermResultView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertModuleOn } from "./modules";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { getT } from "./i18n/server";
import { RuleRefusal } from "./rule-refusal";
import type { ActiveContext } from "./session";
import type { Translate } from "./i18n/dictionary";
import { cellOf, formCourses, runView, sessionOf, statusAtLeast, type Cell } from "./exam-cell";
import { coursesOf, internalsFor, lockedInternalsFor, offeringsOfTerm, seatsOf, studentIdsOf, termsOf, type CourseFacts } from "./exam-cell-academics";
import { classFor, courseOutcome, csvFileName, csvLine, entriesAgree, milliText, parseResultFile, sgpaHundredths, sgpaNumber, tenths, termStatusOf, toMilli } from "./exam-cell-rules";
import { internshipCreditsForTerm } from "./placement-internships";

/**
 * THE EXAM CELL'S MARKS AND RESULTS (module EXAMS, 4 October 2026).
 *
 * EXTERNAL MARKS ARE ENTERED TWICE, by two different people (the controller
 * and the office, or two controllers): the first entry is one, a second
 * person's is two, and the mark stands only when they agree. Disagreements
 * are listed until one of the two corrects theirs. An affiliated college
 * may instead import the university's result file, reconciled student by
 * student (PRN, the hall ticket's number or the roll). Internal marks are
 * never entered here: they come from the academics module's InternalLock.
 *
 * NOTHING PUBLISHED IS EDITED. A grace the principal approves, a
 * revaluation that changes a mark and a correction after publication each
 * write a NEW ExamMark row (version + 1) with its reason; the run reads the
 * highest version. A result is a ResultRun; publishing one supersedes the
 * one before, which is kept with its rows.
 */

type Tx = typeof db;
const ENTRY_ROLES = ["EXAM_CONTROLLER", "ADMIN"] as const;

/** Whether the session has ever published a result. */
async function everPublished(sessionId: string): Promise<boolean> {
  return (await db.resultRun.count({ where: { sessionId, status: { in: ["PUBLISHED", "SUPERSEDED"] } } })) > 0;
}

/**
 * Whether a draft run of the session is the principal's to publish, as publishRun decides it: after a publication,
 * or before the first one once a correction stands (TA-560). The results page draws Publish for the one who may press it.
 */
export async function publishNeedsPrincipal(ctx: ActiveContext, sessionId: string): Promise<boolean> {
  const s = await sessionOf(await cellOf(ctx, "read"), sessionId);
  return (await everPublished(s.id)) || (await db.examMark.count({ where: { sessionId: s.id, source: "CORRECTION" } })) > 0;
}

/**
 * The students of a sheet whose mark the correction form may take, as correctMark allows it (TA-560): every one after
 * a publication; before it, while marks are taken, only those a later version (an approved grace) stands over, whose
 * double entry is closed to them; none otherwise.
 */
export function correctableRows<R extends { version: number }>(sheet: { published: boolean; rows: readonly R[] }, status: string): R[] {
  if (sheet.published) return [...sheet.rows];
  return status === "CONDUCT" || status === "ASSESSMENT" ? sheet.rows.filter((r) => r.version > 1) : [];
}

/** The latest version of each (course, student) mark in a session. */
async function latestMarks(sessionId: string, courseId?: string) {
  const rows = await db.examMark.findMany({ where: { sessionId, ...(courseId ? { courseId } : {}) }, orderBy: { version: "asc" } });
  const latest = new Map<string, (typeof rows)[number]>();
  const first = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const k = `${r.courseId}|${r.studentMembershipId}`;
    latest.set(k, r);
    if (r.version === 1) first.set(k, r);
  }
  return { latest, first };
}

/**
 * What a session's marks and unfair-means decisions are at this moment, as one comparable string (TA-063): how many
 * mark rows and when the last was written, how many decisions and when the last was taken. Read before a run reads
 * the marks and again under the session's lock, so a change in between refuses the run instead of being missed.
 */
async function marksStamp(client: Tx, sessionId: string): Promise<string> {
  const m = await client.examMark.aggregate({ where: { sessionId }, _count: { _all: true }, _max: { updatedAt: true } });
  const d = await client.malpractice.aggregate({ where: { sessionId }, _count: { decision: true }, _max: { decidedAt: true } });
  return `${m._count._all}|${m._max.updatedAt?.getTime() ?? 0}|${d._count.decision}|${d._max.decidedAt?.getTime() ?? 0}`;
}

/** The approved forms of a session that carry a course, by student. */
async function sittingFor(sessionId: string, courseId: string) {
  const forms = await db.examForm.findMany({ where: { sessionId, status: "APPROVED" }, select: { id: true, studentMembershipId: true, coursesJson: true, student: { select: { studentCode: true, user: { select: { name: true } } } }, ticket: { select: { number: true } } } });
  return forms.filter((f) => formCourses(f.coursesJson).some((c) => c.courseId === courseId)).sort((a, b) => (a.student.studentCode ?? a.student.user.name).localeCompare(b.student.studentCode ?? b.student.user.name));
}

async function courseIn(cell: Pick<Cell, "schoolId">, courseId: string): Promise<CourseFacts> {
  const c = (await coursesOf(cell.schoolId, [courseId])).get(courseId);
  if (!c) throw new RuleRefusal("examCell.refuseCourse", 422, undefined, "courseId");
  return c;
}

/* -------------------------------------------------------------------------- */
/* The sheet and the double entry                                               */
/* -------------------------------------------------------------------------- */

export async function marksSheet(ctx: ActiveContext, sessionId: string, courseId: string): Promise<ExamMarksSheet> {
  const cell = await cellOf(ctx, "read");
  const s = await sessionOf(cell, sessionId);
  const course = await courseIn(cell, courseId);
  const [sitting, marks, internals, published] = await Promise.all([sittingFor(s.id, course.id), latestMarks(s.id, course.id), internalsFor(cell.schoolId, [course.id]), everPublished(s.id)]);
  const users = [...new Set([...marks.first.values()].flatMap((m) => [m.entry1ByUserId, m.entry2ByUserId]).filter((x): x is string => Boolean(x)))];
  const names = new Map((users.length ? await db.user.findMany({ where: { id: { in: users } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name]));
  let mismatches = 0;
  const rows = sitting.map((f) => {
    const k = `${course.id}|${f.studentMembershipId}`;
    const latest = marks.latest.get(k);
    const first = marks.first.get(k);
    const both = Boolean(first?.entry1ByUserId && first?.entry2ByUserId);
    if (latest && !latest.matched && both) mismatches += 1;
    // ⚠ THE LOCK'S OWN KEY (QA-09, 24 Oct 2026): `internalsFor` keys a lock `<student>|<course>`, the reverse of the
    // marks' key above. Looked up under `k`, every locked internal read null and unlocked, so the sheet disagreed with
    // the run and the controller could not see which courses had no internals (how QA-05 went unseen).
    const locked = internals.get(`${f.studentMembershipId}|${course.id}`);
    return {
      studentMembershipId: f.studentMembershipId,
      name: f.student.user.name,
      code: f.student.studentCode,
      ticket: f.ticket?.number ?? null,
      internalMilli: latest?.internalMilli ?? locked ?? null,
      internalLocked: locked !== undefined,
      // BLIND until both have entered (campaign S-23): an entry's value is shown to its own author
      // alone while the other entry is missing, so the second entrant cannot copy the first. Once
      // both stand, both are shown, which is what settling a mismatch needs.
      entry1: first?.entry1ByUserId ? (both || first.entry1ByUserId === ctx.user.id ? { milli: first.entry1Milli, absent: first.entry1Absent, by: names.get(first.entry1ByUserId) ?? "—" } : { milli: null, absent: false, by: names.get(first.entry1ByUserId) ?? "—" }) : null,
      entry2: first?.entry2ByUserId ? (both || first.entry2ByUserId === ctx.user.id ? { milli: first.entry2Milli, absent: first.entry2Absent, by: names.get(first.entry2ByUserId) ?? "—" } : { milli: null, absent: false, by: names.get(first.entry2ByUserId) ?? "—" }) : null,
      externalMilli: latest?.matched ? latest.externalMilli : null,
      absent: Boolean(latest?.matched && latest.absent),
      matched: Boolean(latest?.matched),
      graceMilli: latest?.graceMilli ?? 0,
      version: latest?.version ?? 0,
      source: (latest?.source as ExamMarksSheet["rows"][number]["source"]) ?? null,
    };
  });
  const canEnter = (ENTRY_ROLES as readonly string[]).includes(ctx.role ?? "") && !published && (s.status === "CONDUCT" || s.status === "ASSESSMENT");
  return { courseId: course.id, code: course.code, name: course.name, externalMaxMilli: course.rules.externalMax * 1000, internalMaxMilli: course.rules.internalMax * 1000, published, canEnter, rows, mismatches };
}

/**
 * One person's entry of a course's external marks. The first person to
 * enter a student's mark writes entry one; anyone else, entry two; either
 * may correct their own; a third person is refused while both stand. The
 * mark stands (matched) only when the two agree. Before publication only:
 * after it, a change is a correction with a reason.
 */
export async function enterMarks(ctx: ActiveContext, sessionId: string, input: { courseId: string; entries: { studentMembershipId: string; marks: number | null; absent: boolean }[] }): Promise<{ matched: number; mismatched: number; pending: number }> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(ENTRY_ROLES as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  const cell = { schoolId: ctx.schoolId };
  const s = await sessionOf(cell, sessionId);
  if (s.status !== "CONDUCT" && s.status !== "ASSESSMENT") throw new RuleRefusal("examCell.refuseMarksNow", 409);
  if (await everPublished(s.id)) throw new RuleRefusal("examCell.refusePublishedUseCorrection", 409);
  const course = await courseIn(cell, input.courseId);
  const sitting = new Set((await sittingFor(s.id, course.id)).map((f) => f.studentMembershipId));
  const me = ctx.user.id;
  const parsed = input.entries.map((e) => {
    if (!sitting.has(e.studentMembershipId)) throw new RuleRefusal("examCell.refuseNotSitting", 422, undefined, "entries");
    if (e.absent) return { studentMembershipId: e.studentMembershipId, milli: null as number | null, absent: true };
    const milli = e.marks === null ? null : toMilli(e.marks, course.rules.externalMax);
    if (milli === null) throw new RuleRefusal("examCell.refuseMarksRange", 422, { max: course.rules.externalMax }, "entries");
    return { studentMembershipId: e.studentMembershipId, milli, absent: false };
  });
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // Two people keying the same sheet at once is the double-entry design's normal case (QA-10): the
    // session row is taken first, as runResults and publishRun take it, so the second waits, reads the
    // first's version-1 rows and becomes entry two instead of colliding on the version-1 unique key.
    // The status and the publication are read again under the lock (a run or a publish may have landed).
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${s.id} FOR UPDATE`;
    const locked = await tx.examSession.findUnique({ where: { id: s.id }, select: { status: true } });
    if (locked?.status !== "CONDUCT" && locked?.status !== "ASSESSMENT") throw new RuleRefusal("examCell.refuseMarksNow", 409);
    if ((await tx.resultRun.count({ where: { sessionId: s.id, status: { in: ["PUBLISHED", "SUPERSEDED"] } } })) > 0) throw new RuleRefusal("examCell.refusePublishedUseCorrection", 409);
    for (const e of parsed) {
      const rows = await tx.examMark.findMany({ where: { sessionId: s.id, courseId: course.id, studentMembershipId: e.studentMembershipId }, orderBy: { version: "asc" } });
      const v1 = rows[0];
      if (!v1) {
        await tx.examMark.create({ data: { schoolId: s.schoolId, sessionId: s.id, courseId: course.id, studentMembershipId: e.studentMembershipId, source: "DOUBLE_ENTRY", entry1Milli: e.milli, entry1Absent: e.absent, entry1ByUserId: me, entry1At: new Date(), enteredByUserId: me } });
        continue;
      }
      if (v1.source === "IMPORT") throw new RuleRefusal("examCell.refuseImported", 409);
      if (rows.length > 1) throw new RuleRefusal("examCell.refuseLaterVersion", 409);
      let data: Record<string, unknown>;
      let one = { milli: v1.entry1Milli, absent: v1.entry1Absent };
      let two = { milli: v1.entry2Milli, absent: v1.entry2Absent };
      if (v1.entry1ByUserId === me) {
        data = { entry1Milli: e.milli, entry1Absent: e.absent, entry1At: new Date() };
        one = { milli: e.milli, absent: e.absent };
      } else if (!v1.entry2ByUserId || v1.entry2ByUserId === me) {
        data = { entry2Milli: e.milli, entry2Absent: e.absent, entry2ByUserId: me, entry2At: new Date() };
        two = { milli: e.milli, absent: e.absent };
      } else throw new RuleRefusal("examCell.refuseThirdEntrant", 409);
      const second = Boolean(data.entry2ByUserId ?? v1.entry2ByUserId);
      const agree = second && entriesAgree(one, two);
      await tx.examMark.update({ where: { id: v1.id }, data: { ...data, matched: agree, externalMilli: agree ? (one.absent ? null : one.milli) : null, absent: agree ? one.absent : false } });
    }
  });
  await audit({ schoolId: s.schoolId, actorUserId: me, action: "exam.marks.enter", targetType: "ExamSession", targetId: s.id, meta: { courseId: course.id, entries: parsed.length } });
  const sheetRows = await latestMarks(s.id, course.id);
  let matched = 0;
  let mismatched = 0;
  for (const [k, m] of sheetRows.latest) {
    if (!sitting.has(k.split("|")[1]!)) continue;
    if (m.matched) matched += 1;
    else if (sheetRows.first.get(k)?.entry2ByUserId) mismatched += 1;
  }
  return { matched, mismatched, pending: Math.max(0, sitting.size - matched - mismatched) };
}

/**
 * THE UNIVERSITY'S RESULT FILE (exam-cell-rules.ts `parseResultFile`),
 * reconciled student by student — the PRN, else the hall ticket's number,
 * else the roll — and course by code among the session's papers. Before
 * publication an imported row is written or rewritten in place; after it, a
 * differing row is a new version. Rows that match nobody are listed.
 */
export async function importMarks(ctx: ActiveContext, sessionId: string, textIn: string): Promise<{ created: number; updated: number; unchanged: number; unmatched: { line: number; key: string; reason: string }[] }> {
  const cell = await cellOf(ctx);
  // The university's file is an affiliated college's: at an autonomous college one controller's
  // paste would stand as matched marks with no second entrant, over the HOD's internal lock (campaign S-10).
  if (cell.autonomous) throw new AccessError("examCell.refuseImportAutonomous");
  const s = await sessionOf(cell, sessionId);
  if (!statusAtLeast(s.status, "CONDUCT")) throw new RuleRefusal("examCell.refuseMarksNow", 409);
  const t = await getT();
  const file = parseResultFile(textIn);
  const forms = await db.examForm.findMany({ where: { sessionId: s.id, status: "APPROVED" }, select: { studentMembershipId: true, coursesJson: true, student: { select: { studentCode: true } }, ticket: { select: { number: true } } } });
  const ids = await studentIdsOf(cell.schoolId, forms.map((f) => f.studentMembershipId));
  const byKey = new Map<string, (typeof forms)[number]>();
  // Two forms whose PRNs fold to one key (zzv2026001 and ZZV2026001, or one PRN entered twice) name nobody (TA-531):
  // their rows are left unmatched rather than all landing on the later form.
  const twice = new Set<string>();
  for (const f of forms) {
    const prn = ids.get(f.studentMembershipId)?.prn;
    const pKey = prn ? `P:${prn.toUpperCase()}` : null;
    if (pKey && byKey.has(pKey) && byKey.get(pKey)!.studentMembershipId !== f.studentMembershipId) twice.add(pKey);
    if (pKey) byKey.set(pKey, f);
    if (f.ticket) byKey.set(`S:${f.ticket.number.toUpperCase()}`, f);
    if (f.student.studentCode) byKey.set(`S:${f.student.studentCode.toUpperCase()}`, f);
  }
  for (const k of twice) byKey.delete(k);
  const courses = await coursesOf(cell.schoolId, forms.flatMap((f) => formCourses(f.coursesJson).map((c) => c.courseId)));
  const byCode = new Map([...courses.values()].map((c) => [c.code.toUpperCase(), c]));
  const published = await everPublished(s.id);
  const unmatched: { line: number; key: string; reason: string }[] = file.bad.map((b) => ({ line: b.line, key: b.key, reason: t(b.reason === "columns" ? "examCell.importBadColumns" : "examCell.importBadMarks") }));
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // The same session lock as enterMarks (QA-10), so an import and a first entry never both write version 1.
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${s.id} FOR UPDATE`;
    for (const r of file.rows) {
      const key = `${r.prn || r.seatNo}/${r.courseCode}`;
      const form = (r.prn ? byKey.get(`P:${r.prn.toUpperCase()}`) : undefined) ?? (r.seatNo ? byKey.get(`S:${r.seatNo.toUpperCase()}`) : undefined);
      if (!form) {
        unmatched.push({ line: r.line, key, reason: t("examCell.importNoStudent") });
        continue;
      }
      const course = byCode.get(r.courseCode.toUpperCase());
      if (!course || !formCourses(form.coursesJson).some((c) => c.courseId === course.id)) {
        unmatched.push({ line: r.line, key, reason: t("examCell.importNoCourse") });
        continue;
      }
      const internal = r.internal === null ? null : toMilli(r.internal, course.rules.internalMax);
      const external = r.absent || r.external === null ? null : toMilli(r.external, course.rules.externalMax);
      if ((r.internal !== null && internal === null) || (!r.absent && external === null)) {
        // Over the course's maximum says so, with the maximum (A3-journeys-17); anything else is not a mark.
        const over =
          r.internal !== null && internal === null && r.internal > course.rules.internalMax
            ? t("examCell.importOverInternal", { max: course.rules.internalMax })
            : !r.absent && external === null && r.external !== null && r.external > course.rules.externalMax
              ? t("examCell.importOverExternal", { max: course.rules.externalMax })
              : null;
        unmatched.push({ line: r.line, key, reason: over ?? t("examCell.importBadMarks") });
        continue;
      }
      const rows = await tx.examMark.findMany({ where: { sessionId: s.id, courseId: course.id, studentMembershipId: form.studentMembershipId }, orderBy: { version: "desc" }, take: 1 });
      const latest = rows[0];
      const values = { internalMilli: internal, externalMilli: external, absent: r.absent };
      if (!latest) {
        await tx.examMark.create({ data: { schoolId: s.schoolId, sessionId: s.id, courseId: course.id, studentMembershipId: form.studentMembershipId, ...values, matched: true, source: "IMPORT", enteredByUserId: cell.userId } });
        created += 1;
        continue;
      }
      const same = latest.internalMilli === values.internalMilli && latest.externalMilli === values.externalMilli && latest.absent === values.absent;
      if (same) {
        unchanged += 1;
        continue;
      }
      if (latest.source === "DOUBLE_ENTRY" && latest.version === 1 && !published) {
        unmatched.push({ line: r.line, key, reason: t("examCell.importAlreadyEntered") });
        continue;
      }
      if (!published && latest.version === 1 && latest.source === "IMPORT") {
        await tx.examMark.update({ where: { id: latest.id }, data: values });
        updated += 1;
      } else {
        // A re-import changes the mark, so an approved grace to pass comes off where it no longer makes the pass (TA-069).
        const kept = await carriedGrace(tx, { ...latest, internalMilli: values.internalMilli ?? latest.internalMilli }, values, { course, lockMilli: null, note: t("examCell.graceDroppedNote") });
        await tx.examMark.create({ data: { schoolId: s.schoolId, sessionId: s.id, courseId: course.id, studentMembershipId: form.studentMembershipId, ...values, graceMilli: kept.graceMilli, matched: true, source: "IMPORT", version: latest.version + 1, reason: kept.dropped ? `${t("examCell.importReason")} ${t("examCell.graceDroppedNote")}` : t("examCell.importReason"), enteredByUserId: cell.userId } });
        created += 1;
      }
    }
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.marks.import", targetType: "ExamSession", targetId: s.id, meta: { created, updated, unchanged, unmatched: unmatched.length } });
  return { created, updated, unchanged, unmatched };
}

/**
 * The sentence the page shows after an import (A3-journeys-17): the counts, then each row not written
 * with its line, its PRN or seat and course, and the reason — the first twenty, and how many more.
 */
export function importReport(t: Translate, r: { created: number; updated: number; unchanged: number; unmatched: { line: number; key: string; reason: string }[] }): string {
  const head = t("examCell.importDone", { created: r.created, updated: r.updated, unchanged: r.unchanged, unmatched: r.unmatched.length });
  const lines = r.unmatched.slice(0, 20).map((u) => t("examCell.importUnmatchedLine", { line: u.line, key: u.key, reason: u.reason }));
  if (r.unmatched.length > 20) lines.push(t("examCell.importUnmatchedMore", { count: r.unmatched.length - 20 }));
  return [head, ...lines].join(" ");
}

/**
 * A mark changed after publication: a new version with its reason (then a new run), never an edit. Before
 * publication a mark is changed by entering it again, except where a later version (an approved grace) stands over
 * the double entry, which then refuses re-entry (TA-560): there the correction is the way too, under the session's
 * lock, and the run carrying it is the principal's to publish (publishRun).
 */
export async function correctMark(ctx: ActiveContext, sessionId: string, input: { courseId: string; studentMembershipId: string; marks: number | null; absent: boolean; reason: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  const published = await everPublished(s.id);
  if (!published) {
    if (s.status !== "CONDUCT" && s.status !== "ASSESSMENT") throw new RuleRefusal("examCell.refuseMarksNow", 409);
    if ((await db.examMark.count({ where: { sessionId: s.id, courseId: input.courseId, studentMembershipId: input.studentMembershipId } })) < 2) throw new RuleRefusal("examCell.refuseCorrectBeforePublish", 409);
  }
  const course = await courseIn(cell, input.courseId);
  const external = input.absent ? null : input.marks === null ? null : toMilli(input.marks, course.rules.externalMax);
  if (!input.absent && external === null) throw new RuleRefusal("examCell.refuseMarksRange", 422, { max: course.rules.externalMax }, "marks");
  const carry = await graceCarry(cell.schoolId, course, input.studentMembershipId);
  const id = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${s.id} FOR UPDATE`;
    return newVersion(s.schoolId, s.id, course.id, input.studentMembershipId, cell.userId, { source: "CORRECTION", reason: input.reason, externalMilli: external, absent: input.absent, carry }, tx);
  });
  // The reason is on the mark's row; the log says only that one was given (TA-409, decision 0002).
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.marks.correct", targetType: "ExamMark", targetId: id, meta: { courseId: course.id, studentMembershipId: input.studentMembershipId, reasonGiven: true, beforePublication: !published } });
  return { ok: true, id, count: null };
}

/** What a new version needs to judge whether an approved grace to pass still applies (TA-069). */
export type GraceCarry = { course: Pick<CourseFacts, "rules" | "table">; lockMilli: number | null; note: string };

/** The course's rules and the student's locked internal, read before a transaction that writes a changed mark. */
export async function graceCarry(schoolId: string, course: CourseFacts, studentMembershipId: string): Promise<GraceCarry> {
  const t = await getT();
  return { course, lockMilli: (await internalsFor(schoolId, [course.id])).get(`${studentMembershipId}|${course.id}`) ?? null, note: t("examCell.graceDroppedNote") };
}

/**
 * GRACE TO PASS IS ONLY WHERE IT MAKES THE COURSE PASS (TA-069). A version that changes the external mark (a
 * revaluation, a correction, a re-import) carried the approved grace whatever the new mark was, so a mark raised
 * past the pass kept marks nobody earned. An APPROVED TO_PASS grace is carried only while the new mark still fails
 * without it and passes with it; otherwise it comes off. TO_CLASS grace, and a mark whose internal cannot be read,
 * keep what they had.
 */
export function graceAfterChange(m: { internalMilli: number | null; graceMilli: number }, grace: { graceMilli: number; rule: string; status: string } | null, next: { externalMilli: number | null; absent: boolean }, course: Pick<CourseFacts, "rules" | "table">): { graceMilli: number; dropped: boolean } {
  const keep = { graceMilli: m.graceMilli, dropped: false };
  if (!grace || grace.status !== "APPROVED" || grace.rule !== "TO_PASS" || m.graceMilli < grace.graceMilli) return keep;
  const rest = m.graceMilli - grace.graceMilli;
  if (next.absent || next.externalMilli === null) return { graceMilli: rest, dropped: true };
  if (m.internalMilli === null && course.rules.internalMax > 0) return keep;
  const base = { internalMilli: m.internalMilli, externalMilli: next.externalMilli, absent: false };
  const without = courseOutcome({ ...base, graceMilli: rest }, course.rules, course.table);
  const withGrace = courseOutcome({ ...base, graceMilli: m.graceMilli }, course.rules, course.table);
  return without.passed || !withGrace.passed ? { graceMilli: rest, dropped: true } : keep;
}

/** The grace a changed mark carries, read on the transaction's client (TA-069). */
async function carriedGrace(client: Tx, latest: { sessionId: string; courseId: string; studentMembershipId: string; internalMilli: number | null; graceMilli: number }, next: { externalMilli: number | null; absent: boolean }, carry: GraceCarry): Promise<{ graceMilli: number; dropped: boolean }> {
  if (latest.graceMilli === 0) return { graceMilli: 0, dropped: false };
  const grace = await client.examGrace.findUnique({ where: { sessionId_courseId_studentMembershipId: { sessionId: latest.sessionId, courseId: latest.courseId, studentMembershipId: latest.studentMembershipId } }, select: { graceMilli: true, rule: true, status: true } });
  return graceAfterChange({ internalMilli: latest.internalMilli ?? carry.lockMilli, graceMilli: latest.graceMilli }, grace, next, carry.course);
}

/** A new version of a mark from the latest, with what changes; refused when there is no standing mark to change. */
export async function newVersion(schoolId: string, sessionId: string, courseId: string, studentMembershipId: string, userId: string, change: { source: string; reason: string; externalMilli?: number | null; absent?: boolean; graceMilli?: number; carry?: GraceCarry }, client: Tx = db): Promise<string> {
  const latest = (await client.examMark.findMany({ where: { sessionId, courseId, studentMembershipId }, orderBy: { version: "desc" }, take: 1 }))[0];
  if (!latest || !latest.matched) throw new RuleRefusal("examCell.refuseNoMark", 409);
  const externalMilli = change.externalMilli !== undefined ? change.externalMilli : latest.externalMilli;
  const absent = change.absent ?? latest.absent;
  let graceMilli = change.graceMilli ?? latest.graceMilli;
  let reason = change.reason;
  if (change.graceMilli === undefined && change.carry) {
    const kept = await carriedGrace(client, latest, { externalMilli, absent }, change.carry);
    if (kept.dropped) {
      graceMilli = kept.graceMilli;
      reason = `${reason} ${change.carry.note}`;
    }
  }
  const row = await client.examMark.create({
    data: {
      schoolId,
      sessionId,
      courseId,
      studentMembershipId,
      internalMilli: latest.internalMilli,
      externalMilli,
      absent,
      graceMilli,
      matched: true,
      source: change.source,
      version: latest.version + 1,
      reason,
      enteredByUserId: userId,
    },
    select: { id: true },
  });
  return row.id;
}

/* -------------------------------------------------------------------------- */
/* Grace and moderation                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A grace proposal under the scheme's rule (at most `graceMaxPerCourse` marks
 * a course and `graceMaxPerSession` a session for one student; TO_PASS only
 * where the grace is what makes the course pass). Nothing changes until the
 * principal approves it.
 */
export async function proposeGrace(ctx: ActiveContext, sessionId: string, input: { courseId: string; studentMembershipId: string; marks: number; rule: "TO_PASS" | "TO_CLASS"; reason: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  const course = await courseIn(cell, input.courseId);
  const graceMilli = Math.round(input.marks * 1000);
  if (graceMilli > course.rules.graceMaxPerCourse * 1000) throw new RuleRefusal("examCell.refuseGraceCap", 422, { max: course.rules.graceMaxPerCourse }, "marks");
  const latest = (await db.examMark.findMany({ where: { sessionId: s.id, courseId: course.id, studentMembershipId: input.studentMembershipId }, orderBy: { version: "desc" }, take: 1 }))[0];
  if (!latest || !latest.matched || latest.absent) throw new RuleRefusal("examCell.refuseNoMark", 409);
  if (input.rule === "TO_PASS") {
    const internal = latest.internalMilli ?? (await internalsFor(cell.schoolId, [course.id])).get(`${input.studentMembershipId}|${course.id}`) ?? null;
    // Whether grace makes a course pass cannot be judged on an internal taken as nought (QA-05).
    if (internal === null && course.rules.internalMax > 0) throw new RuleRefusal("examCell.refuseInternalsMissing", 409, { count: 1, courses: course.code });
    const base = { internalMilli: internal, externalMilli: latest.externalMilli, absent: false };
    const without = courseOutcome({ ...base, graceMilli: latest.graceMilli }, course.rules, course.table);
    const withGrace = courseOutcome({ ...base, graceMilli: latest.graceMilli + graceMilli }, course.rules, course.table);
    if (without.passed || !withGrace.passed) throw new RuleRefusal("examCell.refuseGraceNotNeeded", 422, undefined, "marks");
  }
  // The session's cap is added up and the proposal written under the session's lock (TA-530), so two proposals for
  // one student in two courses at once cannot both pass it; an edit claims the row only while it is still PROPOSED,
  // so it never lands under the principal's approval.
  const row = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${s.id} FOR UPDATE`;
    const others = await tx.examGrace.findMany({ where: { sessionId: s.id, studentMembershipId: input.studentMembershipId, status: { in: ["PROPOSED", "APPROVED"] }, courseId: { not: course.id } }, select: { graceMilli: true } });
    if (others.reduce((a, g) => a + g.graceMilli, 0) + graceMilli > course.rules.graceMaxPerSession * 1000) throw new RuleRefusal("examCell.refuseGraceCap", 422, { max: course.rules.graceMaxPerSession }, "marks");
    const existing = await tx.examGrace.findUnique({ where: { sessionId_courseId_studentMembershipId: { sessionId: s.id, courseId: course.id, studentMembershipId: input.studentMembershipId } } });
    if (existing && existing.status !== "PROPOSED") throw new RuleRefusal("examCell.refuseDecided", 409);
    if (!existing) return tx.examGrace.create({ data: { schoolId: cell.schoolId, sessionId: s.id, courseId: course.id, studentMembershipId: input.studentMembershipId, graceMilli, rule: input.rule, reason: input.reason, proposedByUserId: cell.userId }, select: { id: true } });
    const edited = await tx.examGrace.updateMany({ where: { id: existing.id, status: "PROPOSED" }, data: { graceMilli, rule: input.rule, reason: input.reason, proposedByUserId: cell.userId } });
    if (edited.count !== 1) throw new RuleRefusal("examCell.refuseDecided", 409);
    return { id: existing.id };
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.grace.propose", targetType: "ExamGrace", targetId: row.id, meta: { courseId: course.id, studentMembershipId: input.studentMembershipId, graceMilli, rule: input.rule } });
  const heads = await db.membership.findMany({ where: { schoolId: cell.schoolId, role: "PRINCIPAL", status: "ACTIVE" }, select: { userId: true } });
  await Promise.all(heads.map((h) => notify({ userId: h.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyGrace", titleVars: { session: s.name }, bodyKey: "examCell.notifyGraceBody", bodyVars: { course: course.code }, url: "/exam-cell" })));
  return { ok: true, id: row.id, count: null };
}

/** The principal's decision on a grace proposal. Approved, it writes the mark's next version with the grace. */
export async function decideGrace(ctx: ActiveContext, graceId: string, input: { approve: boolean; note?: string }): Promise<ExamActionResult> {
  if (!ctx.schoolId || ctx.role !== "PRINCIPAL") throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "EXAMS");
  const schoolId = ctx.schoolId;
  const g = await db.examGrace.findFirst({ where: { id: graceId, schoolId } });
  if (!g) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  // R-7's four eyes (TA-237): an account holding EXAM_CONTROLLER and PRINCIPAL does not approve the grace it proposed.
  if (g.proposedByUserId === ctx.user.id) throw new AccessError("collegeDesks.refuseOwnAsk");
  if (g.status !== "PROPOSED") {
    if ((g.status === "APPROVED") === input.approve) return { ok: true, id: g.id, count: null };
    throw new RuleRefusal("examCell.refuseDecided", 409);
  }
  const t = await getT();
  const cap = (await coursesOf(schoolId, [g.courseId])).get(g.courseId)?.rules.graceMaxPerSession ?? null;
  let graceMilli = g.graceMilli;
  const decided = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // Under the session's lock, as proposeGrace writes (TA-530): the marks added to the mark are the row's as it
    // stands now, not as read before, so the approved row and the mark's version agree; and the session's cap is
    // added up again with the approval in it.
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${g.sessionId} FOR UPDATE`;
    const now = await tx.examGrace.findUnique({ where: { id: g.id }, select: { graceMilli: true, status: true, proposedByUserId: true } });
    if (!now || now.status !== "PROPOSED") return now?.status ?? null;
    if (now.proposedByUserId === ctx.user.id) throw new AccessError("collegeDesks.refuseOwnAsk");
    graceMilli = now.graceMilli;
    if (input.approve && cap !== null) {
      const approved = await tx.examGrace.findMany({ where: { sessionId: g.sessionId, studentMembershipId: g.studentMembershipId, status: "APPROVED", id: { not: g.id } }, select: { graceMilli: true } });
      if (approved.reduce((a, x) => a + x.graceMilli, 0) + now.graceMilli > cap * 1000) throw new RuleRefusal("examCell.refuseGraceCap", 422, { max: cap });
    }
    const flipped = await tx.examGrace.updateMany({ where: { id: g.id, status: "PROPOSED" }, data: { status: input.approve ? "APPROVED" : "REFUSED", decidedByUserId: ctx.user.id, decidedAt: new Date(), decisionNote: input.note?.trim() || null } });
    if (flipped.count !== 1 || !input.approve) return "DECIDED";
    const latest = (await tx.examMark.findMany({ where: { sessionId: g.sessionId, courseId: g.courseId, studentMembershipId: g.studentMembershipId }, orderBy: { version: "desc" }, take: 1 }))[0];
    await newVersion(schoolId, g.sessionId, g.courseId, g.studentMembershipId, ctx.user.id, { source: "GRACE", reason: t("examCell.graceReason", { reason: g.reason }), graceMilli: (latest?.graceMilli ?? 0) + now.graceMilli }, tx);
    return "DECIDED";
  });
  // Decided by someone else meanwhile: answered as the first check above answers it.
  if (decided !== "DECIDED") {
    if ((decided === "APPROVED") === input.approve) return { ok: true, id: g.id, count: null };
    throw new RuleRefusal("examCell.refuseDecided", 409);
  }
  // The note is on the grace's row; the log says only that one was given (TA-409, decision 0002).
  await audit({ schoolId, actorUserId: ctx.user.id, action: input.approve ? "exam.grace.approve" : "exam.grace.refuse", targetType: "ExamGrace", targetId: g.id, meta: { graceMilli, noteGiven: Boolean(input.note?.trim()) } });
  await notify({ userId: g.proposedByUserId, schoolId, kind: "SYSTEM", titleKey: input.approve ? "examCell.notifyGraceApproved" : "examCell.notifyGraceRefused", bodyKey: "examCell.notifyGraceDecidedBody", url: `/exam-cell/sessions/${g.sessionId}/marks` });
  if (input.approve) await tellGrace(schoolId, { ...g, graceMilli }).catch((error) => console.error("[exam-cell] grace notice failed", error));
  return { ok: true, id: g.id, count: null };
}

export async function addModerationNote(ctx: ActiveContext, sessionId: string, input: { courseId?: string | null; note: string }): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  if (input.courseId) await courseIn(cell, input.courseId);
  const row = await db.examModerationNote.create({ data: { schoolId: cell.schoolId, sessionId: s.id, courseId: input.courseId ?? null, note: input.note, writtenByUserId: cell.userId }, select: { id: true } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.moderation.note", targetType: "ExamModerationNote", targetId: row.id, meta: { courseId: input.courseId ?? null } });
  return { ok: true, id: row.id, count: null };
}

/* -------------------------------------------------------------------------- */
/* The run                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A term result's class (distinction, first …): the whole term's, so only on a pass in a REGULAR session. A
 * supplementary session re-sits a course or two, and labelled a one-course pass "First class with distinction"
 * (A3-journeys-40).
 */
export function termClass(status: string, sessionKind: string, sgpa: number | null, bands: Parameters<typeof classFor>[1]): ReturnType<typeof classFor> | null {
  return status === "PASS" && sessionKind !== "SUPPLEMENTARY" ? classFor(sgpa, bands) : null;
}

type ComputedCourse = { studentMembershipId: string; courseId: string; kind: "REGULAR" | "BACKLOG"; creditsTenths: number; internalMilli: number | null; externalMilli: number | null; graceMilli: number; totalMilli: number; maxMilli: number; grade: string; pointsTenths: number; status: "PASS" | "FAIL" | "ATKT" | "ABSENT" };
type ComputedTerm = { studentMembershipId: string; sgpaHundredths: number | null; creditsAttemptedTenths: number; creditsEarnedTenths: number; status: "PASS" | "ATKT" | "FAIL"; cls: string | null };

/** The courses a term's SGPA is over: the regular ones, or every one when the session examined only backlogs. */
export const sgpaCourses = <T extends { kind: string }>(rows: readonly T[]): T[] => {
  const regular = rows.filter((r) => r.kind === "REGULAR");
  return regular.length > 0 ? regular : [...rows];
};

/**
 * THE RUN: every approved form's courses graded under each course's scheme —
 * internal (locked, or the university's imported figure) + external + grace
 * — then the term's SGPA over its courses, ATKT by the scheme's limit and the
 * class by its bands. A paper cancelled for malpractice fails that course; a
 * session cancelled fails every course. Refused while any mark is still
 * unmatched. After a publication it needs a reason, and it is a new run.
 */
export async function runResults(ctx: ActiveContext, sessionId: string, reason?: string): Promise<ExamActionResult> {
  const cell = await cellOf(ctx);
  const s = await sessionOf(cell, sessionId);
  const published = await everPublished(s.id);
  // A CLOSED session's revaluations, corrections and grace go on from After results (the guide), so a closed session
  // that has published computes a corrected run, with a reason and for the principal, as a published one does (TA-064).
  if (!statusAtLeast(s.status, "CONDUCT") || (s.status === "CLOSED" && !published)) throw new RuleRefusal("examCell.refuseRunNow", 409);
  if (published && !reason?.trim()) throw new RuleRefusal("examCell.refuseRerunReason", 422, undefined, "reason");
  // What the marks were when they were read (TA-063): taken again under the session's lock below, and a run is refused
  // if a mark or a decision changed in between, rather than stored as a draft that misses it.
  const readStamp = await marksStamp(db, s.id);
  const forms = await db.examForm.findMany({ where: { sessionId: s.id, status: "APPROVED" }, select: { studentMembershipId: true, coursesJson: true } });
  if (forms.length === 0) throw new RuleRefusal("examCell.refuseNoForms", 409);
  // An unfair-means case not yet decided holds the result (TA-303): a cancelled paper decided after publication would
  // need a corrected run and the principal, and the student's result would have gone out meanwhile.
  const undecided = await db.malpractice.count({ where: { sessionId: s.id, decision: null } });
  if (undecided > 0) throw new RuleRefusal("examCell.refuseMalpracticeUndecided", 409, { count: undecided });
  const allCourses = [...new Set(forms.flatMap((f) => formCourses(f.coursesJson).map((c) => c.courseId)))];
  const [courses, locks, marks, malpractice] = await Promise.all([
    coursesOf(cell.schoolId, allCourses),
    lockedInternalsFor(cell.schoolId, allCourses),
    latestMarks(s.id),
    db.malpractice.findMany({ where: { sessionId: s.id, decision: { in: ["CANCEL_PAPER", "CANCEL_SESSION"] } }, select: { studentMembershipId: true, decision: true, schedule: { select: { courseId: true } } } }),
  ]);
  const internals = new Map([...locks].map(([k, v]) => [k, v.milli]));
  let pending = 0;
  for (const f of forms) for (const c of formCourses(f.coursesJson)) if (!marks.latest.get(`${c.courseId}|${f.studentMembershipId}`)?.matched) pending += 1;
  if (pending > 0) throw new RuleRefusal("examCell.refuseMarksPending", 409, { count: pending });
  // A LOCK READ ON ITS OWN MAXIMUM (TA-070): the HOD's totals are out of the lock's `outOf`, the scheme's internal
  // maximum when it was locked. Where the scheme now reads another maximum (changed after the lock, or a scheme whose
  // rules fell back differently in the two modules), the totals would be added as marks on the wrong scale, so the
  // run is refused naming the courses, as a missing internal is.
  const offScale = new Set<string>();
  for (const f of forms) {
    for (const c of formCourses(f.coursesJson)) {
      const course = courses.get(c.courseId);
      const m = marks.latest.get(`${c.courseId}|${f.studentMembershipId}`)!;
      const lock = locks.get(`${f.studentMembershipId}|${c.courseId}`);
      if (course && m.internalMilli === null && lock && lock.outOf !== course.rules.internalMax) offScale.add(course.code);
    }
  }
  if (offScale.size > 0) throw new RuleRefusal("examCell.refuseInternalOutOf", 409, { courses: [...offScale].sort().join(", ") });
  // ⚠ NO RESULT WITH A MISSING INTERNAL (QA-05, QA campaign of 24 October 2026). A course whose scheme has an internal
  // part needs each sitting student's internal: the university's imported figure or the HOD's lock. A missing one was
  // taken as nought, so at sac five of five students went ATKT, a 53/60 external was graded F, and publishing opened
  // nine backlogs and told the families. Refused like an unmatched external, naming the courses; not needed where the
  // scheme has no internal part, or where the result is AB or cancelled for malpractice whatever the internal is.
  const missingIn = new Set<string>();
  let missing = 0;
  for (const f of forms) {
    for (const c of formCourses(f.coursesJson)) {
      const course = courses.get(c.courseId);
      if (!course || course.rules.internalMax === 0) continue;
      const m = marks.latest.get(`${c.courseId}|${f.studentMembershipId}`)!;
      if (m.absent || m.externalMilli === null) continue;
      if (malpractice.some((x) => x.studentMembershipId === f.studentMembershipId && (x.decision === "CANCEL_SESSION" || x.schedule.courseId === c.courseId))) continue;
      if (m.internalMilli !== null || internals.has(`${f.studentMembershipId}|${c.courseId}`)) continue;
      missing += 1;
      missingIn.add(course.code);
    }
  }
  if (missing > 0) throw new RuleRefusal("examCell.refuseInternalsMissing", 409, { count: missing, courses: [...missingIn].sort().join(", ") });
  const computedCourses: ComputedCourse[] = [];
  const computedTerms: ComputedTerm[] = [];
  for (const f of forms) {
    const mine: ComputedCourse[] = [];
    const cancelledAll = malpractice.some((m) => m.studentMembershipId === f.studentMembershipId && m.decision === "CANCEL_SESSION");
    let rules = null as CourseFacts["rules"] | null;
    for (const c of formCourses(f.coursesJson)) {
      const course = courses.get(c.courseId);
      if (!course) continue;
      rules ??= course.rules;
      const m = marks.latest.get(`${c.courseId}|${f.studentMembershipId}`)!;
      const internal = m.internalMilli ?? internals.get(`${f.studentMembershipId}|${c.courseId}`) ?? null;
      const out = courseOutcome({ internalMilli: internal, externalMilli: m.externalMilli, absent: m.absent, graceMilli: m.graceMilli }, course.rules, course.table);
      const cancelled = cancelledAll || malpractice.some((x) => x.studentMembershipId === f.studentMembershipId && x.decision === "CANCEL_PAPER" && x.schedule.courseId === c.courseId);
      const passed = out.passed && !cancelled;
      mine.push({
        studentMembershipId: f.studentMembershipId,
        courseId: c.courseId,
        kind: c.kind,
        creditsTenths: course.creditsTenths,
        internalMilli: internal,
        externalMilli: m.absent ? null : m.externalMilli,
        graceMilli: m.graceMilli,
        totalMilli: out.totalMilli,
        maxMilli: out.maxMilli,
        grade: passed ? out.grade : out.absent ? "AB" : "F",
        pointsTenths: passed ? out.pointsTenths : 0,
        status: passed ? "PASS" : out.absent ? "ABSENT" : "FAIL",
      });
    }
    const failed = mine.filter((x) => x.status !== "PASS").length;
    const status = termStatusOf(failed, rules?.atktLimit ?? 0);
    for (const x of mine) if (x.status === "FAIL" && status === "ATKT") x.status = "ATKT";
    const over = sgpaCourses(mine);
    const sgpa = sgpaHundredths(over);
    computedCourses.push(...mine);
    computedTerms.push({
      studentMembershipId: f.studentMembershipId,
      sgpaHundredths: sgpa,
      creditsAttemptedTenths: over.reduce((a, x) => a + x.creditsTenths, 0),
      creditsEarnedTenths: over.filter((x) => x.status === "PASS").reduce((a, x) => a + x.creditsTenths, 0),
      status,
      cls: termClass(status, s.kind, sgpa, rules?.classBands ?? []),
    });
  }
  const summary = { students: computedTerms.length, passed: computedTerms.filter((x) => x.status === "PASS").length, atkt: computedTerms.filter((x) => x.status === "ATKT").length, failed: computedTerms.filter((x) => x.status === "FAIL").length };
  const runId = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${s.id} FOR UPDATE`;
    if (readStamp !== (await marksStamp(tx, s.id))) throw new RuleRefusal("examCell.refuseRunStale", 409);
    await tx.resultRun.deleteMany({ where: { sessionId: s.id, status: "DRAFT" } });
    const last = await tx.resultRun.findFirst({ where: { sessionId: s.id }, orderBy: { number: "desc" }, select: { number: true } });
    const run = await tx.resultRun.create({ data: { schoolId: s.schoolId, sessionId: s.id, number: (last?.number ?? 0) + 1, reason: reason?.trim() || null, computedByUserId: cell.userId, summaryJson: JSON.stringify(summary) }, select: { id: true } });
    await tx.courseResult.createMany({ data: computedCourses.map((x) => ({ schoolId: s.schoolId, runId: run.id, ...x })) });
    await tx.termResult.createMany({ data: computedTerms.map((x) => ({ schoolId: s.schoolId, runId: run.id, termId: s.termId, ...x })) });
    if (s.status === "CONDUCT") await tx.examSession.update({ where: { id: s.id }, data: { status: "ASSESSMENT" } });
    return run.id;
  });
  // The reason stays on the run row; the log says only that one was given (TA-409, decision 0002: no sentences about a student).
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.result.run", targetType: "ResultRun", targetId: runId, meta: { ...summary, reasonGiven: Boolean(reason?.trim()) } });
  // A run that changes a published result waits for the principal (publishRun), who is told.
  if (published) {
    const principals = await db.membership.findMany({ where: { schoolId: cell.schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, select: { userId: true } });
    await Promise.all(principals.map((p) => notify({ userId: p.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "examCell.notifyRepublishAsk", body: reason?.trim() ?? "", url: `/exam-cell/sessions/${s.id}/results` }).catch(() => undefined)));
  }
  return { ok: true, id: runId, count: summary.students };
}

/**
 * Publish a run: the one published before is SUPERSEDED (and kept), the
 * session is PUBLISHED, backlogs open for what failed and close for what
 * passed (a failure this same session reversed — by revaluation — is no
 * backlog at all), each student's earned credits wait for the Academic Bank,
 * and the students are told.
 */
/**
 * THE STUDENT AND THE FAMILY HEAR OF GRACE AND OF RESULTS (G4-13, risks batch 5 Oct 2026; 08's recommended option:
 * the controller works on the web, the phone shows the status). An approved grace tells the student (a push and a
 * notification) and their guardians under the RESULTS grant (an adult college student's guardians only with it); a
 * published run tells the guardians as `publishRun` already told the students. The links open the student's exams
 * and the family's results; the phone maps them to its screens.
 */
async function tellGrace(schoolId: string, g: { sessionId: string; courseId: string; studentMembershipId: string; graceMilli: number }): Promise<void> {
  const [session, course, student] = await Promise.all([
    db.examSession.findUnique({ where: { id: g.sessionId }, select: { name: true } }),
    db.course.findUnique({ where: { id: g.courseId }, select: { code: true } }),
    db.membership.findUnique({ where: { id: g.studentMembershipId }, select: { userId: true } }),
  ]);
  const vars = { course: course?.code ?? "", session: session?.name ?? "", marks: milliText(g.graceMilli) };
  if (student) await notify({ userId: student.userId, schoolId, kind: "GRADE", titleKey: "riskDecisions.notifGraceStudent", titleVars: { course: vars.course }, bodyKey: "riskDecisions.notifGraceStudentBody", bodyVars: vars, url: "/student/exams" });
  await notifyGuardians(g.studentMembershipId, (name) => ({ schoolId, kind: "GRADE", titleKey: "riskDecisions.notifGraceFamily", titleVars: { name, course: vars.course }, bodyKey: "riskDecisions.notifGraceStudentBody", bodyVars: vars, url: "/parent/results" }), "RESULTS");
}

export async function publishRun(ctx: ActiveContext, sessionId: string, runId: string): Promise<ExamActionResult> {
  // THE SECOND SIGNATORY (campaign S-10). The first publication is the controller's. After it, a
  // run carries corrections or revaluations one controller made alone, so it is published by the
  // principal — the run row's publishedByUserId is that approval — and not by the controller.
  const cell = await cellOf(ctx, "read");
  if (!cell.canWrite && cell.role !== "PRINCIPAL") throw new AccessError("access.wrongRoleForThisAction");
  const s = await sessionOf(cell, sessionId);
  const run = await db.resultRun.findFirst({ where: { id: runId, sessionId: s.id } });
  if (!run) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (run.status === "PUBLISHED") return { ok: true, id: run.id, count: null };
  const wasPublished = await everPublished(s.id);
  // A correction made before the first publication (TA-560) is one controller's alone as much as one after it, so a
  // run of a session holding one is the principal's to publish too.
  const corrected = !wasPublished && (await db.examMark.count({ where: { sessionId: s.id, source: "CORRECTION" } })) > 0;
  if (wasPublished || corrected) {
    if (cell.role !== "PRINCIPAL") throw new AccessError(wasPublished ? "examCell.refuseRepublishPrincipal" : "examCell.refuseCorrectedPublishPrincipal");
    // R-7's four eyes (TA-237): the second signatory is not the account that made a change the run carries — one
    // holding EXAM_CONTROLLER and PRINCIPAL corrects, revalues or re-imports as controller and is refused here.
    const since = wasPublished ? (await db.resultRun.findFirst({ where: { sessionId: s.id, status: "PUBLISHED" }, select: { publishedAt: true } }))?.publishedAt : null;
    const own = await db.examMark.count({ where: { sessionId: s.id, enteredByUserId: cell.userId, version: { gt: 1 }, source: { in: ["CORRECTION", "REVALUATION", "IMPORT"] }, ...(since ? { createdAt: { gt: since } } : {}) } });
    if (own > 0) throw new AccessError("collegeDesks.refuseOwnAsk");
  } else if (!cell.canWrite) throw new AccessError("access.wrongRoleForThisAction");
  if (run.status !== "DRAFT") throw new RuleRefusal("examCell.refuseRunSuperseded", 409);
  const [courseRows, termRows] = await Promise.all([db.courseResult.findMany({ where: { runId: run.id } }), db.termResult.findMany({ where: { runId: run.id } })]);
  const ids = await studentIdsOf(cell.schoolId, termRows.map((r) => r.studentMembershipId));
  // Internship credits CREDITED within the term's dates (a B.Tech's AICTE internship, a management summer
  // internship, a law student's court internship — placement-internships.ts, 5 Oct 2026) go to the Academic
  // Bank with the term's course credits: the credit push carries both.
  const internshipTenths = new Map(await Promise.all(termRows.map(async (r) => [`${r.studentMembershipId}|${r.termId}`, (await internshipCreditsForTerm(r.studentMembershipId, r.termId)) * 10] as const)));
  const now = new Date();
  // A double press of Publish (QA-29): both presses read DRAFT above, the second waited on the session lock and then
  // re-ran the publication, so every student and guardian was told twice. The run's status is read again under the
  // lock: one already published is answered as it stands, with no notice and no audit row; one superseded meanwhile
  // is refused as before.
  const published = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "ExamSession" WHERE "id" = ${s.id} FOR UPDATE`;
    const current = await tx.resultRun.findUnique({ where: { id: run.id }, select: { status: true } });
    if (current?.status === "PUBLISHED") return false;
    if (current?.status !== "DRAFT") throw new RuleRefusal("examCell.refuseRunSuperseded", 409);
    // A DRAFT stands for the marks as the run read them (TA-063): a grace approved, an entry changed, a correction or
    // a revaluation written, or an unfair-means case decided after it was computed is left out of it, so it is
    // refused and computed again. Both stamps of a mark are compared, the database's and the client's.
    const after = { gt: run.computedAt };
    const stale = (await tx.examMark.count({ where: { sessionId: s.id, OR: [{ createdAt: after }, { updatedAt: after }] } })) + (await tx.malpractice.count({ where: { sessionId: s.id, decidedAt: after } }));
    if (stale > 0) throw new RuleRefusal("examCell.refuseRunStale", 409);
    await tx.resultRun.updateMany({ where: { sessionId: s.id, status: "PUBLISHED" }, data: { status: "SUPERSEDED" } });
    await tx.resultRun.update({ where: { id: run.id }, data: { status: "PUBLISHED", publishedAt: now, publishedByUserId: cell.userId } });
    // A corrected run of a CLOSED session (TA-064) publishes without opening the session again.
    await tx.examSession.updateMany({ where: { id: s.id, status: { not: "CLOSED" } }, data: { status: "PUBLISHED" } });
    for (const r of courseRows) {
      const b = await tx.backlog.findUnique({ where: { studentMembershipId_courseId: { studentMembershipId: r.studentMembershipId, courseId: r.courseId } } });
      const counted = b && b.lastSessionId !== s.id ? 1 : 0;
      if (r.status === "PASS") {
        if (!b || b.status !== "OPEN") continue;
        if (b.firstFailedSessionId === s.id) await tx.backlog.delete({ where: { id: b.id } });
        else await tx.backlog.update({ where: { id: b.id }, data: { status: "CLEARED", clearedSessionId: s.id, clearedAt: now, attempts: b.attempts + counted, lastSessionId: s.id } });
      } else if (!b) {
        await tx.backlog.create({ data: { schoolId: s.schoolId, studentMembershipId: r.studentMembershipId, courseId: r.courseId, firstFailedSessionId: s.id, firstFailedAt: now, attempts: 1, lastSessionId: s.id } });
      } else if (b.status === "OPEN") {
        await tx.backlog.update({ where: { id: b.id }, data: { attempts: b.attempts + counted, lastSessionId: s.id } });
      } else if (b.status === "CLEARED" && b.clearedSessionId === s.id) {
        await tx.backlog.update({ where: { id: b.id }, data: { status: "OPEN", clearedSessionId: null, clearedAt: null } });
      }
    }
    // THE TERM'S CREDITS FOR THE ACADEMIC BANK (TA-066): the row is one per student and term, so it is the credits of
    // every course passed in a PUBLISHED run of ANY of the term's sessions (this one now among them), each course once
    // — not this run's alone, which a supplementary session of the same term overwrote with its re-sat course, and
    // not only its regular courses, which left a backlog passed beside them in no term's row.
    const passedRows = termRows.length
      ? await tx.courseResult.findMany({ where: { schoolId: s.schoolId, studentMembershipId: { in: termRows.map((r) => r.studentMembershipId) }, status: "PASS", run: { status: "PUBLISHED", session: { termId: s.termId } } }, select: { studentMembershipId: true, courseId: true, creditsTenths: true } })
      : [];
    const passedCredits = new Map<string, Map<string, number>>();
    for (const p of passedRows) passedCredits.set(p.studentMembershipId, (passedCredits.get(p.studentMembershipId) ?? new Map<string, number>()).set(p.courseId, p.creditsTenths));
    for (const r of termRows) {
      const had = await tx.creditPush.findUnique({ where: { studentMembershipId_termId: { studentMembershipId: r.studentMembershipId, termId: r.termId } } });
      const apaarId = ids.get(r.studentMembershipId)?.apaarId ?? null;
      const earnedTenths = [...(passedCredits.get(r.studentMembershipId)?.values() ?? [])].reduce((a, x) => a + x, 0);
      const creditsTenths = earnedTenths + (internshipTenths.get(`${r.studentMembershipId}|${r.termId}`) ?? 0);
      if (!had) await tx.creditPush.create({ data: { schoolId: s.schoolId, studentMembershipId: r.studentMembershipId, termId: r.termId, runId: run.id, creditsTenths, apaarId } });
      else if (had.creditsTenths !== creditsTenths || had.runId !== run.id) await tx.creditPush.update({ where: { id: had.id }, data: { runId: run.id, creditsTenths, apaarId, ...(had.creditsTenths !== creditsTenths ? { status: "PENDING", pushedAt: null, abcRef: null, error: null } : {}) } });
    }
    return true;
  });
  if (!published) return { ok: true, id: run.id, count: null };
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.result.publish", targetType: "ResultRun", targetId: run.id, meta: { number: run.number } });
  const people = await db.membership.findMany({ where: { id: { in: termRows.map((r) => r.studentMembershipId) } }, select: { userId: true } });
  await Promise.all(people.map((p) => notify({ userId: p.userId, schoolId: cell.schoolId, kind: "GRADE", titleKey: "examCell.notifyResult", titleVars: { session: s.name }, bodyKey: "examCell.notifyResultBody", url: "/student/exams" })));
  // The families too (G4-13): once per student, under the RESULTS grant; a notice that fails does not undo the publication.
  for (const studentMembershipId of new Set(termRows.map((r) => r.studentMembershipId))) {
    await notifyGuardians(studentMembershipId, (name) => ({ schoolId: cell.schoolId, kind: "GRADE", titleKey: "riskDecisions.notifResultFamily", titleVars: { name, session: s.name }, bodyKey: "riskDecisions.notifResultFamilyBody", url: "/parent/results" }), "RESULTS").catch((error) => console.error("[exam-cell] result notice failed", error));
  }
  return { ok: true, id: run.id, count: termRows.length };
}

/* -------------------------------------------------------------------------- */
/* Reading results                                                              */
/* -------------------------------------------------------------------------- */

type CourseRow = { courseId: string; creditsTenths: number; internalMilli: number | null; externalMilli: number | null; graceMilli: number; totalMilli: number; maxMilli: number; grade: string; pointsTenths: number; status: string };
export function termResultView(term: { studentMembershipId: string; sgpaHundredths: number | null; creditsAttemptedTenths: number; creditsEarnedTenths: number; status: string; cls: string | null }, rows: readonly CourseRow[], courses: Map<string, CourseFacts>, who: { name: string; code: string | null }): TermResultView {
  return {
    studentMembershipId: term.studentMembershipId,
    name: who.name,
    code: who.code,
    sgpa: sgpaNumber(term.sgpaHundredths),
    creditsAttempted: tenths(term.creditsAttemptedTenths),
    creditsEarned: tenths(term.creditsEarnedTenths),
    status: term.status as TermResultView["status"],
    cls: (term.cls as TermResultView["cls"]) ?? null,
    courses: rows
      .map((r) => ({ courseId: r.courseId, code: courses.get(r.courseId)?.code ?? "—", name: courses.get(r.courseId)?.name ?? "—", credits: tenths(r.creditsTenths), internalMilli: r.internalMilli, externalMilli: r.externalMilli, graceMilli: r.graceMilli, totalMilli: r.totalMilli, maxMilli: r.maxMilli, grade: r.grade, points: r.pointsTenths / 10, status: r.status as TermResultView["courses"][number]["status"] }))
      .sort((a, b) => a.code.localeCompare(b.code)),
  };
}

export async function resultsView(ctx: ActiveContext, sessionId: string, runId?: string): Promise<ExamResults> {
  const cell = await cellOf(ctx, "read");
  const s = await sessionOf(cell, sessionId);
  const run = runId ? await db.resultRun.findFirst({ where: { id: runId, sessionId: s.id } }) : await db.resultRun.findFirst({ where: { sessionId: s.id }, orderBy: { number: "desc" } });
  if (runId && !run) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  if (!run) return { run: null, rows: [] };
  const [terms, rows] = await Promise.all([
    db.termResult.findMany({ where: { runId: run.id }, include: { student: { select: { studentCode: true, user: { select: { name: true } } } } } }),
    db.courseResult.findMany({ where: { runId: run.id } }),
  ]);
  const courses = await coursesOf(cell.schoolId, rows.map((r) => r.courseId));
  return {
    run: runView(run),
    rows: terms
      .map((t) => termResultView(t, rows.filter((r) => r.studentMembershipId === t.studentMembershipId), courses, { name: t.student.user.name, code: t.student.studentCode }))
      .sort((a, b) => (a.code ?? a.name).localeCompare(b.code ?? b.name)),
  };
}

/**
 * THE RESULT AS THE UNIVERSITY TAKES IT: one line per student and course,
 * PRN, seat number, name, course, the heads, total, grade, points, credits,
 * the course's result, then the term's SGPA and class. The column order
 * follows SPPU's result ledger as the owner described it; UNTESTED against
 * the university's upload. File headings stay in English.
 */
export const RESULT_EXPORT_COLUMNS = ["PRN", "SEAT_NO", "NAME", "COURSE_CODE", "INTERNAL", "EXTERNAL", "GRACE", "TOTAL", "MAX", "GRADE", "GRADE_POINTS", "CREDITS", "COURSE_RESULT", "SGPA", "TERM_RESULT", "CLASS"] as const;
export async function resultsCsv(ctx: ActiveContext, sessionId: string, runId?: string): Promise<{ name: string; csv: string }> {
  const cell = await cellOf(ctx, "read");
  const s = await sessionOf(cell, sessionId);
  const view = await resultsView(ctx, sessionId, runId);
  const ids = await studentIdsOf(cell.schoolId, view.rows.map((r) => r.studentMembershipId));
  const tickets = new Map((await db.hallTicket.findMany({ where: { sessionId: s.id }, select: { studentMembershipId: true, number: true } })).map((t) => [t.studentMembershipId, t.number]));
  const lines = [csvLine([...RESULT_EXPORT_COLUMNS])];
  for (const r of view.rows)
    for (const c of r.courses)
      lines.push(csvLine([ids.get(r.studentMembershipId)?.prn ?? "", tickets.get(r.studentMembershipId) ?? r.code ?? "", r.name, c.code, milliText(c.internalMilli), c.status === "ABSENT" ? "AB" : milliText(c.externalMilli), milliText(c.graceMilli), milliText(c.totalMilli), milliText(c.maxMilli), c.grade, c.points, c.credits, c.status, r.sgpa === null ? "" : r.sgpa.toFixed(2), r.status, r.cls ?? ""]));
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "exam.result.export", targetType: "ExamSession", targetId: s.id, meta: { runId: view.run?.id ?? null, rows: view.rows.length } });
  return { name: csvFileName("results", s.name), csv: lines.join("\n") + "\n" };
}

/* -------------------------------------------------------------------------- */
/* Analytics, and what the HOD's and the principal's pages read                 */
/* -------------------------------------------------------------------------- */

const rate = (key: string, label: string, appeared: number, passed: number): PassRateRow => ({ key, label, appeared, passed, passRatePercent: appeared > 0 ? Math.round((passed / appeared) * 1000) / 10 : 0 });

/** The course rows of every PUBLISHED run of the term's sessions (or of every session), with the term of each. */
async function publishedRows(schoolId: string, termId?: string) {
  const runs = await db.resultRun.findMany({ where: { schoolId, status: "PUBLISHED", ...(termId ? { session: { termId } } : {}) }, select: { id: true, publishedAt: true, session: { select: { id: true, name: true, termId: true } } }, orderBy: { publishedAt: "asc" } });
  const runIds = runs.map((r) => r.id);
  const [courseRows, termRows] = runIds.length ? await Promise.all([db.courseResult.findMany({ where: { runId: { in: runIds } } }), db.termResult.findMany({ where: { runId: { in: runIds } } })]) : [[], []];
  return { runs, courseRows, termRows };
}

/**
 * PASS RATES BY OFFERING for a term, from its published results: each
 * offering's registered students' course results. For the HOD's and the
 * principal's pages (the academics builder's), read with the plain client —
 * the caller has already bound the person and the college.
 */
export async function passRateByOffering(schoolId: string, termId: string): Promise<{ offeringId: string; courseId: string; code: string; facultyName: string | null; divisionName: string | null; appeared: number; passed: number; passRatePercent: number }[]> {
  const [{ courseRows }, offerings] = await Promise.all([publishedRows(schoolId, termId), offeringsOfTerm(schoolId, termId)]);
  const courses = await coursesOf(schoolId, offerings.map((o) => o.courseId));
  return offerings.map((o) => {
    const rows = courseRows.filter((r) => r.courseId === o.courseId && o.students.includes(r.studentMembershipId));
    const r = rate(o.offeringId, courses.get(o.courseId)?.code ?? "—", rows.length, rows.filter((x) => x.status === "PASS").length);
    return { offeringId: o.offeringId, courseId: o.courseId, code: r.label, facultyName: o.facultyName, divisionName: o.divisionName, appeared: r.appeared, passed: r.passed, passRatePercent: r.passRatePercent };
  });
}

/**
 * A DEPARTMENT'S RESULTS for a term (the HOD's "results and outcomes"):
 * pass rate overall and by course, the toppers by SGPA, and the backlogs its
 * students carry. Plain client; the caller binds the HOD to the department.
 */
export async function resultsForDepartment(schoolId: string, departmentId: string, termId: string): Promise<{ appeared: number; passed: number; passRatePercent: number; byCourse: PassRateRow[]; toppers: { studentMembershipId: string; name: string; sgpa: number }[]; openBacklogs: number }> {
  const [{ courseRows, termRows }, offerings, deptCourses] = await Promise.all([
    publishedRows(schoolId, termId),
    offeringsOfTerm(schoolId, termId, departmentId),
    // The department's own courses (its programmes' schemes): an affiliated college's imported results name courses the
    // term may hold no offering of (the integration builder, 4 Oct 2026 — the hand-off from the result import read nothing).
    db.course.findMany({ where: { schoolId, scheme: { programme: { departmentId } } }, select: { id: true } }),
  ]);
  const ownCourses = new Set(deptCourses.map((c) => c.id));
  const students = new Set([...offerings.flatMap((o) => o.students), ...courseRows.filter((r) => ownCourses.has(r.courseId)).map((r) => r.studentMembershipId)]);
  const courseIds = new Set([...offerings.map((o) => o.courseId), ...courseRows.filter((r) => ownCourses.has(r.courseId)).map((r) => r.courseId)]);
  const rows = courseRows.filter((r) => courseIds.has(r.courseId) && students.has(r.studentMembershipId));
  const courses = await coursesOf(schoolId, [...courseIds]);
  const byCourse = [...courseIds].map((id) => {
    const mine = rows.filter((r) => r.courseId === id);
    return rate(id, courses.get(id)?.code ?? "—", mine.length, mine.filter((r) => r.status === "PASS").length);
  });
  const terms = termRows.filter((t) => students.has(t.studentMembershipId) && t.sgpaHundredths !== null).sort((a, b) => (b.sgpaHundredths ?? 0) - (a.sgpaHundredths ?? 0)).slice(0, 5);
  const names = new Map((terms.length ? await db.membership.findMany({ where: { id: { in: terms.map((t) => t.studentMembershipId) } }, select: { id: true, user: { select: { name: true } } } }) : []).map((m) => [m.id, m.user.name]));
  const openBacklogs = students.size ? await db.backlog.count({ where: { schoolId, status: "OPEN", studentMembershipId: { in: [...students] } } }) : 0;
  const all = rate("all", "all", rows.length, rows.filter((r) => r.status === "PASS").length);
  return { appeared: all.appeared, passed: all.passed, passRatePercent: all.passRatePercent, byCourse, toppers: terms.map((t) => ({ studentMembershipId: t.studentMembershipId, name: names.get(t.studentMembershipId) ?? "—", sgpa: sgpaNumber(t.sgpaHundredths)! })), openBacklogs };
}

/** GET /api/v1/exam-cell/analytics — pass rate by course, faculty and division, the trend over sessions, the first-year figures. */
export async function examAnalytics(ctx: ActiveContext, termId?: string): Promise<ExamAnalytics> {
  const cell = await cellOf(ctx, "read");
  const terms = await termsOf(cell.schoolId);
  const chosen = termId ?? terms[0]?.id ?? null;
  const [scoped, all] = await Promise.all([chosen ? publishedRows(cell.schoolId, chosen) : Promise.resolve({ runs: [], courseRows: [], termRows: [] }), publishedRows(cell.schoolId)]);
  const courses = await coursesOf(cell.schoolId, scoped.courseRows.map((r) => r.courseId));
  const byCourse = [...new Set(scoped.courseRows.map((r) => r.courseId))].map((id) => {
    const rows = scoped.courseRows.filter((r) => r.courseId === id);
    return rate(id, courses.get(id)?.code ?? "—", rows.length, rows.filter((r) => r.status === "PASS").length);
  });
  const offerings = chosen ? await offeringsOfTerm(cell.schoolId, chosen) : [];
  const group = (keyOf: (o: (typeof offerings)[number]) => string | null, labelOf: (o: (typeof offerings)[number]) => string | null) => {
    const by = new Map<string, { label: string; appeared: number; passed: number }>();
    for (const o of offerings) {
      const key = keyOf(o);
      if (!key) continue;
      const rows = scoped.courseRows.filter((r) => r.courseId === o.courseId && o.students.includes(r.studentMembershipId));
      const had = by.get(key) ?? { label: labelOf(o) ?? "—", appeared: 0, passed: 0 };
      had.appeared += rows.length;
      had.passed += rows.filter((r) => r.status === "PASS").length;
      by.set(key, had);
    }
    return [...by.entries()].map(([k, v]) => rate(k, v.label, v.appeared, v.passed));
  };
  const trend = all.runs.map((r) => {
    const rows = all.termRows.filter((t) => t.runId === r.id);
    const passed = rows.filter((t) => t.status === "PASS").length;
    return { sessionId: r.session.id, sessionName: r.session.name, publishedAt: r.publishedAt?.toISOString() ?? null, passRatePercent: rows.length ? Math.round((passed / rows.length) * 1000) / 10 : 0, appeared: rows.length };
  });
  // NBA's first-year figures: the students in their first year of study among this term's published results.
  const seats = await seatsOf(cell.schoolId, scoped.termRows.map((t) => t.studentMembershipId));
  const firsts = scoped.termRows.filter((t) => (seats.get(t.studentMembershipId)?.semester ?? 99) <= 2);
  const withSgpa = firsts.filter((t) => t.sgpaHundredths !== null);
  const meanSgpa = withSgpa.length ? Math.round(withSgpa.reduce((a, t) => a + (t.sgpaHundredths ?? 0), 0) / withSgpa.length) / 100 : null;
  const passedFirst = firsts.filter((t) => t.status === "PASS").length;
  return {
    termId: chosen,
    terms: terms.map((t) => ({ id: t.id, name: t.name })),
    byCourse: byCourse.sort((a, b) => a.label.localeCompare(b.label)),
    byFaculty: group((o) => o.facultyMembershipId, (o) => o.facultyName),
    byDivision: group((o) => o.divisionId, (o) => o.divisionName),
    trend,
    firstYear: { appeared: firsts.length, meanSgpa, api: meanSgpa !== null && firsts.length ? Math.round(meanSgpa * (passedFirst / firsts.length) * 100) / 100 : null, successRatePercent: firsts.length ? Math.round((passedFirst / firsts.length) * 1000) / 10 : null },
  };
}
