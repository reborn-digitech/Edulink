import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError, assertClassAccess } from "./tenancy";
import { isDateKey } from "./dates";
import type { ActiveContext } from "./session";

/**
 * Term exams — the date sheet, and the bridge into marks.
 *
 * AN EXAM IS NOT A NEW KIND OF MARK (see the schema note). A sitting of a paper
 * is an Assignment with category "Exam", found-or-created per (slot, class) at
 * marks-entry time, and the marks are ordinary Grade rows. Everything
 * downstream — category weighting, report-card snapshots, the child's own
 * grades page — already knows what to do with those. What this module owns is
 * the date sheet (per-grade, published to families) and the marks grid.
 */

const EXAM_CATEGORY = "Exam";

/** Marks arrive as plain numbers ("out of 80") and are stored as thousandths. */
function toMilli(marks: number): number {
  return Math.round(marks * 1000);
}

function requireAdmin(ctx: ActiveContext): { schoolId: string; membershipId: string } {
  if (ctx.role !== "ADMIN" || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("access.onlyAdminsSetExams");
  }
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId };
}

/* -------------------------------------------------------------------------- */
/* The admin's series                                                          */
/* -------------------------------------------------------------------------- */

export async function listSeries(ctx: ActiveContext) {
  const { schoolId } = requireAdmin(ctx);
  return db.examSeries.findMany({
    where: { schoolId, archivedAt: null },
    orderBy: [{ gradeLevel: "asc" }, { createdAt: "desc" }],
    include: {
      slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }] },
    },
  });
}

export async function createSeries(
  ctx: ActiveContext,
  input: { name: string; gradeLevel: string },
): Promise<string> {
  const { schoolId } = requireAdmin(ctx);
  const name = input.name.trim().slice(0, 120);
  const gradeLevel = input.gradeLevel.trim().slice(0, 20);
  if (name.length < 2) throw new AccessError("access.giveTheExamAName");
  if (!gradeLevel) throw new AccessError("access.chooseAGradeForTheExam");

  const existing = await db.examSeries.findUnique({
    where: { schoolId_gradeLevel_name: { schoolId, gradeLevel, name } },
    select: { id: true, archivedAt: true },
  });
  if (existing) {
    // Same name, same grade: an archived one comes back rather than colliding.
    if (existing.archivedAt) {
      await db.examSeries.update({ where: { id: existing.id }, data: { archivedAt: null } });
      return existing.id;
    }
    throw new AccessError("access.thatExamAlreadyExists");
  }

  const series = await db.examSeries.create({
    data: { schoolId, name, gradeLevel, createdByMembershipId: ctx.membershipId },
    select: { id: true },
  });
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "exam.seriesCreate",
    targetType: "ExamSeries",
    targetId: series.id,
    meta: { name, gradeLevel },
  });
  return series.id;
}

export async function addSlot(
  ctx: ActiveContext,
  seriesId: string,
  input: { subject: string; dateKey: string; maxMarks: number; startMinute?: number | null; endMinute?: number | null },
): Promise<void> {
  const { schoolId } = requireAdmin(ctx);
  const series = await db.examSeries.findFirst({
    where: { id: seriesId, schoolId, archivedAt: null },
    select: { id: true, _count: { select: { slots: true } } },
  });
  if (!series) throw new AccessError("access.examNotFound", "NOT_FOUND");

  const subject = input.subject.trim().slice(0, 80);
  if (!subject) throw new AccessError("access.giveTheSubjectAName");
  if (!isDateKey(input.dateKey)) throw new AccessError("access.pickADayForThePaper");
  if (!Number.isFinite(input.maxMarks) || input.maxMarks <= 0 || input.maxMarks > 1000) {
    throw new AccessError("access.maxMarksOutOfRange");
  }
  const startMinute =
    input.startMinute != null && input.startMinute >= 0 && input.startMinute < 1440
      ? Math.round(input.startMinute)
      : null;
  const endMinute =
    input.endMinute != null && startMinute !== null && input.endMinute > startMinute && input.endMinute <= 1440
      ? Math.round(input.endMinute)
      : null;

  await db.examSlot.upsert({
    where: { seriesId_subject: { seriesId, subject } },
    // Re-adding a subject updates its paper rather than refusing: "we moved
    // maths to Monday" is an edit, not an error.
    update: { dateKey: input.dateKey, pointsMilli: toMilli(input.maxMarks), startMinute, endMinute },
    create: {
      schoolId,
      seriesId,
      subject,
      dateKey: input.dateKey,
      pointsMilli: toMilli(input.maxMarks),
      startMinute,
      endMinute,
      position: series._count.slots,
    },
  });
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "exam.slotChange",
    targetType: "ExamSeries",
    targetId: seriesId,
    meta: { subject, dateKey: input.dateKey, maxMarks: input.maxMarks },
  });
}

export async function removeSlot(ctx: ActiveContext, slotId: string): Promise<void> {
  const { schoolId } = requireAdmin(ctx);
  const slot = await db.examSlot.findFirst({
    where: { id: slotId, schoolId },
    select: { id: true, seriesId: true, subject: true },
  });
  if (!slot) throw new AccessError("access.examNotFound", "NOT_FOUND");
  // Entered marks survive: the sitting's Assignment keeps its rows, its
  // examSlotId simply becomes null (SetNull on the relation).
  await db.examSlot.delete({ where: { id: slot.id } });
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "exam.slotChange",
    targetType: "ExamSeries",
    targetId: slot.seriesId,
    meta: { subject: slot.subject, removed: true },
  });
}

export async function publishSeries(ctx: ActiveContext, seriesId: string): Promise<void> {
  const { schoolId } = requireAdmin(ctx);
  const series = await db.examSeries.findFirst({
    where: { id: seriesId, schoolId, archivedAt: null },
    select: { id: true, publishedAt: true, _count: { select: { slots: true } } },
  });
  if (!series) throw new AccessError("access.examNotFound", "NOT_FOUND");
  if (series.publishedAt) return; // already out; publishing twice is a no-op
  if (series._count.slots === 0) throw new AccessError("access.aDateSheetNeedsAtLeastOnePaper");

  await db.examSeries.update({ where: { id: seriesId }, data: { publishedAt: new Date() } });
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "exam.seriesPublish",
    targetType: "ExamSeries",
    targetId: seriesId,
  });
}

export async function archiveSeries(ctx: ActiveContext, seriesId: string): Promise<void> {
  const { schoolId } = requireAdmin(ctx);
  const series = await db.examSeries.findFirst({
    where: { id: seriesId, schoolId, archivedAt: null },
    select: { id: true },
  });
  if (!series) throw new AccessError("access.examNotFound", "NOT_FOUND");
  await db.examSeries.update({ where: { id: seriesId }, data: { archivedAt: new Date() } });
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "exam.seriesArchive",
    targetType: "ExamSeries",
    targetId: seriesId,
  });
}

/* -------------------------------------------------------------------------- */
/* The date sheet, for the people sitting it                                   */
/* -------------------------------------------------------------------------- */

export type DateSheet = {
  id: string;
  name: string;
  gradeLevel: string;
  slots: {
    id: string;
    subject: string;
    dateKey: string;
    startMinute: number | null;
    endMinute: number | null;
    maxMarks: number;
  }[];
};

/**
 * Published, unarchived series relevant to the viewer: a pupil sees their own
 * grades' sheets, a guardian their children's, staff see every grade.
 */
export async function dateSheetsFor(ctx: ActiveContext): Promise<DateSheet[]> {
  const { schoolId, membershipId, role, user } = ctx;
  if (!schoolId) return [];

  let grades: string[] | null = null; // null = unrestricted (staff)
  if (role === "STUDENT" && membershipId) {
    const rows = await db.enrollment.findMany({
      where: { studentMembershipId: membershipId, status: "ACTIVE", class: { schoolId } },
      select: { class: { select: { gradeLevel: true } } },
    });
    grades = [...new Set(rows.map((r) => r.class.gradeLevel).filter((g): g is string => g !== null))];
  } else if (role === "PARENT") {
    const rows = await db.enrollment.findMany({
      where: {
        status: "ACTIVE",
        class: { schoolId },
        student: { guardianships: { some: { parentUserId: user.id, status: "ACTIVE" } } },
      },
      select: { class: { select: { gradeLevel: true } } },
    });
    grades = [...new Set(rows.map((r) => r.class.gradeLevel).filter((g): g is string => g !== null))];
  }

  const series = await db.examSeries.findMany({
    where: {
      schoolId,
      archivedAt: null,
      publishedAt: { not: null },
      ...(grades !== null ? { gradeLevel: { in: grades } } : {}),
    },
    orderBy: [{ gradeLevel: "asc" }, { createdAt: "desc" }],
    include: { slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }] } },
  });

  return series.map((s) => ({
    id: s.id,
    name: s.name,
    gradeLevel: s.gradeLevel,
    slots: s.slots.map((slot) => ({
      id: slot.id,
      subject: slot.subject,
      dateKey: slot.dateKey,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      maxMarks: slot.pointsMilli / 1000,
    })),
  }));
}

/* -------------------------------------------------------------------------- */
/* The marks grid                                                              */
/* -------------------------------------------------------------------------- */

function requireStaffScope(ctx: ActiveContext): {
  schoolId: string;
  membershipId: string;
  role: "ADMIN" | "TEACHER";
} {
  const { schoolId, membershipId, role } = ctx;
  if (!schoolId || !membershipId || (role !== "ADMIN" && role !== "TEACHER")) {
    throw new AccessError("access.onlyTeachersEnterMarks");
  }
  return { schoolId, membershipId, role };
}

/** The classes this teacher can enter exam marks for, with the series that fit. */
export async function examClassesFor(ctx: ActiveContext) {
  const { schoolId, membershipId, role } = requireStaffScope(ctx);
  const classes = await db.class.findMany({
    where: {
      schoolId,
      archivedAt: null,
      gradeLevel: { not: null },
      ...(role === "TEACHER" ? { teachers: { some: { teacherMembershipId: membershipId } } } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, gradeLevel: true },
  });
  if (classes.length === 0) return [];

  const series = await db.examSeries.findMany({
    where: { schoolId, archivedAt: null, gradeLevel: { in: classes.map((c) => c.gradeLevel!) } },
    orderBy: { createdAt: "desc" },
    include: { slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }] } },
  });

  return classes.map((klass) => ({
    ...klass,
    series: series.filter((s) => s.gradeLevel === klass.gradeLevel),
  }));
}

export type MarksGrid = {
  seriesName: string;
  subject: string;
  maxMarks: number;
  assignmentId: string | null;
  pupils: { membershipId: string; name: string; marks: number | null }[];
};

export async function marksGrid(ctx: ActiveContext, slotId: string, classId: string): Promise<MarksGrid> {
  const { schoolId, membershipId, role } = requireStaffScope(ctx);
  await assertClassAccess({ schoolId, membershipId, role }, classId);

  const slot = await db.examSlot.findFirst({
    where: { id: slotId, schoolId },
    select: {
      id: true,
      subject: true,
      pointsMilli: true,
      series: { select: { name: true, gradeLevel: true } },
    },
  });
  if (!slot) throw new AccessError("access.examNotFound", "NOT_FOUND");

  const klass = await db.class.findFirst({
    where: { id: classId, schoolId },
    select: { gradeLevel: true },
  });
  if (!klass || klass.gradeLevel !== slot.series.gradeLevel) {
    // A Grade 5 paper cannot be entered against 7B, however the form was forged.
    throw new AccessError("access.thatPaperIsForAnotherGrade");
  }

  const sitting = await db.assignment.findUnique({
    where: { examSlotId_classId: { examSlotId: slotId, classId } },
    select: { id: true },
  });

  const roll = await db.enrollment.findMany({
    where: { schoolId, classId, status: "ACTIVE" },
    select: {
      studentMembershipId: true,
      student: { select: { user: { select: { name: true, preferredName: true } } } },
    },
  });

  const grades = sitting
    ? await db.grade.findMany({
        where: { assignmentId: sitting.id },
        select: { studentMembershipId: true, scoreMilli: true },
      })
    : [];
  const gradeBy = new Map(grades.map((g) => [g.studentMembershipId, g.scoreMilli]));

  return {
    seriesName: slot.series.name,
    subject: slot.subject,
    maxMarks: slot.pointsMilli / 1000,
    assignmentId: sitting?.id ?? null,
    pupils: roll
      .map((r) => ({
        membershipId: r.studentMembershipId,
        name: r.student.user.preferredName ?? r.student.user.name,
        marks: (() => {
          const milli = gradeBy.get(r.studentMembershipId);
          return milli == null ? null : milli / 1000;
        })(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/**
 * Save one class's marks for one paper.
 *
 * The sitting's Assignment is found-or-created on the (slot, class) unique key,
 * so two teachers pressing save together converge on one row. A BLANK CLEARS:
 * an empty cell means "no mark recorded" — an absent child — and deletes any
 * grade, because a child who missed the paper did not score nought. (The same
 * rule report-card generation applies from the other side.)
 */
export async function saveMarks(
  ctx: ActiveContext,
  slotId: string,
  classId: string,
  entries: { membershipId: string; marks: number | null }[],
): Promise<{ saved: number; cleared: number }> {
  const { schoolId, membershipId, role } = requireStaffScope(ctx);
  await assertClassAccess({ schoolId, membershipId, role }, classId);

  const slot = await db.examSlot.findFirst({
    where: { id: slotId, schoolId },
    select: {
      id: true,
      subject: true,
      dateKey: true,
      pointsMilli: true,
      series: { select: { name: true, gradeLevel: true } },
    },
  });
  if (!slot) throw new AccessError("access.examNotFound", "NOT_FOUND");
  const klass = await db.class.findFirst({
    where: { id: classId, schoolId },
    select: { gradeLevel: true },
  });
  if (!klass || klass.gradeLevel !== slot.series.gradeLevel) {
    throw new AccessError("access.thatPaperIsForAnotherGrade");
  }

  const max = slot.pointsMilli / 1000;
  for (const entry of entries) {
    if (entry.marks !== null && (!Number.isFinite(entry.marks) || entry.marks < 0 || entry.marks > max)) {
      throw new AccessError("access.marksOutOfRange", "FORBIDDEN", { max });
    }
  }

  // Marks may only be written against this class's own roll — a forged
  // membership id from another class is dropped, not written.
  const roll = new Set(
    (
      await db.enrollment.findMany({
        where: { schoolId, classId, status: "ACTIVE" },
        select: { studentMembershipId: true },
      })
    ).map((r) => r.studentMembershipId),
  );

  const sitting = await db.assignment.upsert({
    where: { examSlotId_classId: { examSlotId: slotId, classId } },
    update: { pointsMilli: slot.pointsMilli },
    create: {
      schoolId,
      classId,
      authorMembershipId: membershipId,
      title: `${slot.series.name} · ${slot.subject}`,
      category: EXAM_CATEGORY,
      pointsMilli: slot.pointsMilli,
      examSlotId: slotId,
      publishedAt: new Date(),
    },
    select: { id: true },
  });

  let saved = 0;
  let cleared = 0;
  for (const entry of entries) {
    if (!roll.has(entry.membershipId)) continue;
    if (entry.marks === null) {
      const gone = await db.grade.deleteMany({
        where: { assignmentId: sitting.id, studentMembershipId: entry.membershipId },
      });
      cleared += gone.count;
      continue;
    }
    await db.grade.upsert({
      where: {
        assignmentId_studentMembershipId: {
          assignmentId: sitting.id,
          studentMembershipId: entry.membershipId,
        },
      },
      update: { scoreMilli: toMilli(entry.marks), gradedByMembershipId: membershipId },
      create: {
        schoolId,
        assignmentId: sitting.id,
        studentMembershipId: entry.membershipId,
        scoreMilli: toMilli(entry.marks),
        gradedByMembershipId: membershipId,
      },
    });
    saved += 1;
  }

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "exam.marksSave",
    targetType: "Assignment",
    targetId: sitting.id,
    meta: { series: slot.series.name, subject: slot.subject, classId, saved, cleared },
  });

  return { saved, cleared };
}
