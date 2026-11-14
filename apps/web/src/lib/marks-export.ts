import "server-only";
import { db } from "./db";
import { toCsv } from "./csv";
import { audit } from "./audit";
import { AccessError, assertClassAccess } from "./tenancy";
import { readReportCardConfig } from "./report-card-config";
import { bandFor, shownPercent } from "./report-card-rules";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * A class's marks as a file: one exam's papers side by side, or the whole
 * gradebook with every assignment as a column. Both are the register-shaped
 * sheet a teacher keeps in a drawer and the office asks for at the end of a
 * term, built from the same Grade rows the marks grid and the gradebook read.
 * Both are audited here, once, because the sheet carries children's names
 * beside their marks.
 *
 * WHO MAY TAKE ONE is the gradebook's own rule (assertClassAccess): a teacher
 * of the class (lead or co), and the office and the head for any class of the
 * school. A teacher the timetable sends to one lesson may enter that paper's
 * marks on the grid, but the sheet holds every paper, so it stays with the
 * class's teachers (`formTeacher`, owner's item 1 of 27 Oct 2026: the same
 * teacher sets and grades their own work there, and still takes no sheet).
 */
export type MarksExport = { filename: string; csv: string; rows: number };

export type ExportCaller = ActiveContext & { schoolId: string; membershipId: string; role: Role };

/** Thousandths to the number a teacher wrote: 87500 → 87.5, 80000 → 80. */
function fromMilli(milli: number): number {
  return Math.round(milli / 10) / 100;
}

/**
 * A class or exam name as a file name: nothing a file system refuses, Devanagari kept — its vowel signs and
 * virama too (\p{M}, TA-135), which the letters-and-digits class alone cut "पाटील" into "प_ट_ल". The header that
 * carries it is contentDisposition's (export-file.ts).
 */
export function fileToken(name: string): string {
  return name.replace(/[^\p{L}\p{M}\p{N}-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "export";
}

/** The class's roll, by name, with the roll and admission numbers the school keeps when it keeps them. */
async function rollOf(schoolId: string, classId: string) {
  const roll = await db.enrollment.findMany({
    where: { schoolId, classId, status: "ACTIVE" },
    select: { studentMembershipId: true, rollNumber: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
  });
  const records = await db.pupilRecord.findMany({
    where: { schoolId, studentMembershipId: { in: roll.map((r) => r.studentMembershipId) } },
    select: { studentMembershipId: true, admissionNumber: true },
  });
  const admissionBy = new Map(records.map((r) => [r.studentMembershipId, r.admissionNumber]));
  return roll
    .map((r) => ({
      membershipId: r.studentMembershipId,
      name: r.student.user.preferredName ?? r.student.user.name,
      rollNumber: r.rollNumber,
      admissionNumber: admissionBy.get(r.studentMembershipId) ?? null,
    }))
    .sort((a, b) => (a.rollNumber ?? Number.MAX_SAFE_INTEGER) - (b.rollNumber ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/**
 * One exam's marks for one class: a row per pupil, a column per paper with
 * its maximum beside it, then the total, the percentage and the grade band
 * the school's report-card rules give that percentage. A paper not sat is a
 * blank, not a nought, and is left out of the total and its maximum — the
 * same arithmetic the family's exams page uses.
 */
export async function marksExport(ctx: ExportCaller, classId: string, seriesId: string): Promise<MarksExport> {
  const klass = await assertClassAccess(ctx, classId, { formTeacher: true });
  const series = await db.examSeries.findFirst({
    where: { id: seriesId, schoolId: ctx.schoolId, archivedAt: null },
    select: { id: true, name: true, gradeLevel: true, slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }], select: { id: true, subject: true, pointsMilli: true } } },
  });
  // Another school's exam, or one set for another grade, is not this class's: the answer is the same either way.
  if (!series || series.gradeLevel !== klass.gradeLevel) throw new AccessError("access.examNotFound", "NOT_FOUND");

  const [roll, sittings, config] = await Promise.all([
    rollOf(ctx.schoolId, classId),
    db.assignment.findMany({
      where: { schoolId: ctx.schoolId, classId, examSlotId: { in: series.slots.map((s) => s.id) } },
      select: { examSlotId: true, grades: { select: { studentMembershipId: true, scoreMilli: true } } },
    }),
    readReportCardConfig(ctx.schoolId),
  ]);
  const marksBy = new Map<string, Map<string, number>>();
  for (const sitting of sittings) {
    if (!sitting.examSlotId) continue;
    // A grade row with no score is a cleared mark: the paper was not sat.
    marksBy.set(sitting.examSlotId, new Map(sitting.grades.flatMap((g) => (g.scoreMilli === null ? [] : [[g.studentMembershipId, g.scoreMilli] as const]))));
  }

  const subjectColumns = series.slots.map((slot) => ({ slot, header: slot.subject, maxHeader: `${slot.subject} (max)` }));
  const headers = ["name", "roll_no", "admission_no", ...subjectColumns.flatMap((c) => [c.header, c.maxHeader]), "total", "total_max", "percent", "grade"];
  const rows = roll.map((pupil) => {
    const row: Record<string, unknown> = { name: pupil.name, roll_no: pupil.rollNumber ?? "", admission_no: pupil.admissionNumber ?? "" };
    let total = 0;
    let totalMax = 0;
    for (const column of subjectColumns) {
      const milli = marksBy.get(column.slot.id)?.get(pupil.membershipId);
      row[column.header] = milli === undefined ? "" : fromMilli(milli);
      row[column.maxHeader] = fromMilli(column.slot.pointsMilli);
      if (milli !== undefined) {
        total += milli;
        totalMax += column.slot.pointsMilli;
      }
    }
    const percent = totalMax > 0 ? shownPercent((total / totalMax) * 100) : null;
    row.total = totalMax > 0 ? fromMilli(total) : "";
    row.total_max = totalMax > 0 ? fromMilli(totalMax) : "";
    row.percent = percent ?? "";
    row.grade = bandFor(percent, config.bands)?.label ?? "";
    return row;
  });

  const csv = toCsv(rows, headers);
  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "marks.export",
    targetType: "Class",
    targetId: classId,
    meta: { kind: "marks", seriesId: series.id, rows: rows.length },
  });
  return { filename: `relay-marks-${fileToken(klass.name)}-${fileToken(series.name)}.csv`, csv, rows: rows.length };
}

/** What a hand-in column says beside the marks: `submitted`, `late`, `missing`; blank for an exam sitting, which is never handed in. */
export type HandInStatus = "submitted" | "late" | "missing" | "";

/**
 * The class's gradebook: a row per pupil, two columns per assignment — the
 * marks, and whether the work came in, late, or not at all — newest work
 * last, so the sheet reads left to right as the term went. Exam sittings are
 * assignments too and keep their place, with the hand-in column blank.
 */
export async function gradebookExport(ctx: ExportCaller, classId: string): Promise<MarksExport> {
  const klass = await assertClassAccess(ctx, classId, { formTeacher: true });
  const [roll, assignments] = await Promise.all([
    rollOf(ctx.schoolId, classId),
    db.assignment.findMany({
      where: { schoolId: ctx.schoolId, classId },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        pointsMilli: true,
        dueAt: true,
        examSlotId: true,
        submissions: { select: { studentMembershipId: true, submittedAt: true } },
        grades: { select: { studentMembershipId: true, scoreMilli: true, letter: true } },
      },
    }),
  ]);

  // Two assignments may share a title; the column must not.
  const seen = new Map<string, number>();
  const columns = assignments.map((a) => {
    // The column names are the sheet's keys, as the marks export's "(max)" is: the maximum rides in the name.
    const base = a.pointsMilli ? `${a.title} (max ${fromMilli(a.pointsMilli)})` : a.title;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const header = n === 1 ? base : `${base} #${n}`;
    return {
      assignment: a,
      header,
      statusHeader: `${header} status`,
      submittedBy: new Map(a.submissions.map((s) => [s.studentMembershipId, s.submittedAt])),
      gradeBy: new Map(a.grades.map((g) => [g.studentMembershipId, g])),
    };
  });
  const headers = ["name", "roll_no", "admission_no", ...columns.flatMap((c) => [c.header, c.statusHeader])];
  const rows = roll.map((pupil) => {
    const row: Record<string, unknown> = { name: pupil.name, roll_no: pupil.rollNumber ?? "", admission_no: pupil.admissionNumber ?? "" };
    for (const column of columns) {
      const grade = column.gradeBy.get(pupil.membershipId);
      row[column.header] = grade?.scoreMilli != null ? fromMilli(grade.scoreMilli) : (grade?.letter ?? "");
      let status: HandInStatus = "";
      if (!column.assignment.examSlotId) {
        const submittedAt = column.submittedBy.get(pupil.membershipId) ?? null;
        status = !submittedAt ? "missing" : column.assignment.dueAt && submittedAt > column.assignment.dueAt ? "late" : "submitted";
      }
      row[column.statusHeader] = status;
    }
    return row;
  });

  const csv = toCsv(rows, headers);
  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "marks.export",
    targetType: "Class",
    targetId: classId,
    meta: { kind: "gradebook", assignments: assignments.length, rows: rows.length },
  });
  return { filename: `relay-gradebook-${fileToken(klass.name)}.csv`, csv, rows: rows.length };
}

/** Files a person may take in an hour, across both exports: a sheet is a second of work, and a loop over the door would be the office's afternoon. */
export const EXPORT_BUDGET = { limit: 60, windowMs: 60 * 60 * 1000 };
