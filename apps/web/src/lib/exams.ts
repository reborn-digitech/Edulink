import "server-only";
import { db } from "./db";
import { termForDate } from "./terms";
import { finishedYearContaining } from "./academic-year";
import { listHolidays, isSchoolClosed } from "./holidays";
import { formatDateKey, parseTeachingDays } from "./dates";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { studentsGuardianMaySee } from "./student-consent";
import { isDateKey } from "./dates";
import { EXAM_KINDS, type ExamKind } from "./constants";
import { markChange, workLabel, type MarkChange } from "./grading";
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

export const EXAM_CATEGORY = "Exam";

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

/** The sitting's title as the grades page and the card show it. */
function sittingTitle(seriesName: string, subject: string): string {
  return `${seriesName} · ${subject}`;
}

/**
 * THE TERM IS DERIVED FROM THE DATE SHEET, NOT REMEMBERED. A series reports
 * into the term its EARLIEST paper falls in, and that is recomputed every
 * time the sheet changes — a paper added, moved or removed — rather than
 * filled once from the first paper dated and left. The old fill-once rule
 * left two ZZ series with no term at all (the API made them, the papers
 * came after, and nothing looked again), and a series with no term is on
 * no term card and no annual card. No term over the earliest paper, or no
 * paper, means null: the round belongs to no term until it does.
 */
async function syncSeriesTerm(schoolId: string, seriesId: string): Promise<void> {
  const series = await db.examSeries.findFirst({
    where: { id: seriesId, schoolId },
    select: {
      termId: true,
      slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }], take: 1, select: { dateKey: true } },
    },
  });
  if (!series) return;
  const earliest = series.slots[0];
  const term = earliest ? await termForDate(schoolId, earliest.dateKey) : null;
  const termId = term?.id ?? null;
  if (termId !== series.termId) {
    await db.examSeries.update({ where: { id: seriesId }, data: { termId } });
  }
}

/**
 * A SITTING'S COPIES FOLLOW THEIR SOURCE. The Assignment row of a sitting
 * carries the paper's max marks and a title made of the series' name and
 * the subject; both are copies, and a copy nobody refreshes drifts. "Out of
 * 80" corrected to "out of 100" on the sheet left the sitting — and the
 * card's denominator — at 80 unless a teacher happened to save marks again;
 * a renamed series kept its old name on every sitting. Every sitting of the
 * given slots is brought back in line here. Grades are never touched.
 */
async function syncSittings(where: { seriesId: string } | { slotId: string }): Promise<void> {
  const slots = await db.examSlot.findMany({
    where: "seriesId" in where ? { seriesId: where.seriesId } : { id: where.slotId },
    select: { id: true, subject: true, pointsMilli: true, series: { select: { name: true } } },
  });
  for (const slot of slots) {
    await db.assignment.updateMany({
      where: { examSlotId: slot.id },
      data: { title: sittingTitle(slot.series.name, slot.subject), pointsMilli: slot.pointsMilli },
    });
  }
}

/* -------------------------------------------------------------------------- */
/* The admin's series                                                          */
/* -------------------------------------------------------------------------- */

export async function listSeries(
  ctx: ActiveContext,
  opts: { kind?: string; gradeLevel?: string; state?: "draft" | "published" } = {},
) {
  const { schoolId } = requireAdmin(ctx);
  return db.examSeries.findMany({
    where: {
      schoolId,
      archivedAt: null,
      ...(opts.kind ? { kind: opts.kind } : {}),
      ...(opts.gradeLevel ? { gradeLevel: opts.gradeLevel } : {}),
      ...(opts.state === "draft" ? { publishedAt: null } : opts.state === "published" ? { publishedAt: { not: null } } : {}),
    },
    orderBy: [{ gradeLevel: "asc" }, { createdAt: "desc" }],
    include: {
      slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }] },
      term: { select: { id: true, name: true } },
    },
  });
}

export async function createSeries(
  ctx: ActiveContext,
  input: { name: string; gradeLevel: string; kind?: string; termId?: string | null },
): Promise<string> {
  const { schoolId } = requireAdmin(ctx);
  const name = input.name.trim().slice(0, 120);
  const gradeLevel = input.gradeLevel.trim().slice(0, 20);
  if (name.length < 2) throw new AccessError("access.giveTheExamAName");
  if (!gradeLevel) throw new AccessError("access.chooseAGradeForTheExam");
  // UNIT_TEST when unsaid — what most rounds are, and what every series
  // scheduled before kinds existed is recorded as.
  const kind: ExamKind = EXAM_KINDS.includes(input.kind as ExamKind) ? (input.kind as ExamKind) : "UNIT_TEST";

  const existing = await db.examSeries.findUnique({
    where: { schoolId_gradeLevel_name: { schoolId, gradeLevel, name } },
    select: { id: true, archivedAt: true },
  });
  if (existing) {
    // Same name, same grade, ARCHIVED: last year's "Unit Test 1". Bringing it
    // back would put last year's papers and marks on this year's sheet, so
    // the old one is renamed with the year it was archived in and this one
    // is made fresh. Collision with a live series is still a refusal.
    if (existing.archivedAt) {
      /**
       * The stamp is the ARCHIVE date, and two years can share one: a school
       * closing two overdue years on the same afternoon archives both years'
       * "Unit Test 1" with the same date, and the second rename collided with
       * the first — a unique-constraint crash that shut series creation for
       * that grade and name for good. Found by the third year of a three-year
       * simulation. A counter breaks the tie the way the eye expects.
       */
      const stamp = existing.archivedAt.toISOString().slice(0, 10);
      let renamed = `${name} (${stamp})`;
      for (let n = 2; ; n++) {
        const taken = await db.examSeries.findFirst({
          where: { schoolId, gradeLevel, name: renamed },
          select: { id: true },
        });
        if (!taken) break;
        renamed = `${name} (${stamp}) ${n}`;
      }
      await db.examSeries.update({ where: { id: existing.id }, data: { name: renamed } });
      // The old series' sittings carry its name in their title; they follow.
      await syncSittings({ seriesId: existing.id });
    } else {
      throw new AccessError("access.thatExamAlreadyExists");
    }
  }

  // A term named in THIS call is kept as the office's word, verified to be
  // this school's. Otherwise the term is derived: null now, with no paper
  // to place it by, and the term of the earliest paper from the first paper
  // on (see syncSeriesTerm) — the term the sheet falls in is the term the
  // round reports into.
  let termId: string | null = null;
  if (input.termId) {
    const term = await db.term.findFirst({ where: { id: input.termId, schoolId }, select: { id: true } });
    if (!term) throw new AccessError("access.termNotFound", "NOT_FOUND");
    termId = term.id;
  }

  const series = await db.examSeries.create({
    data: { schoolId, name, gradeLevel, kind, termId, createdByMembershipId: ctx.membershipId },
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
  input: {
    subject: string;
    dateKey: string;
    maxMarks: number;
    startMinute?: number | null;
    endMinute?: number | null;
    /** The office insists: an entrance test on a Sunday, a board paper in a break. */
    evenIfClosed?: boolean;
  },
): Promise<void> {
  const { schoolId } = requireAdmin(ctx);
  const series = await db.examSeries.findFirst({
    where: { id: seriesId, schoolId, archivedAt: null },
    select: { id: true, gradeLevel: true, _count: { select: { slots: true } } },
  });
  if (!series) throw new AccessError("access.examNotFound", "NOT_FOUND");

  const typedSubject = input.subject.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!typedSubject) throw new AccessError("access.giveTheSubjectAName");
  /**
   * ONE SUBJECT, ONE SPELLING (TA-143, 13 Nov 2026). The card groups a class's papers by subject, and "Maths" on the
   * unit test beside "maths" on the mid-term made two rows that the kind weights never combined. A subject typed
   * as a paper of this series or of another series of the grade already spells it, case and spacing aside, takes
   * that spelling, so re-adding "maths" edits the "Maths" paper rather than making a second one.
   */
  const spelled =
    (await db.examSlot.findFirst({ where: { schoolId, seriesId, subject: { equals: typedSubject, mode: "insensitive" } }, select: { subject: true } })) ??
    (await db.examSlot.findFirst({
      where: { schoolId, subject: { equals: typedSubject, mode: "insensitive" }, series: { gradeLevel: series.gradeLevel } },
      orderBy: { createdAt: "asc" },
      select: { subject: true },
    }));
  const subject = spelled?.subject ?? typedSubject;
  if (!isDateKey(input.dateKey)) throw new AccessError("access.pickADayForThePaper");
  if (!Number.isFinite(input.maxMarks) || input.maxMarks <= 0 || input.maxMarks > 1000) {
    throw new AccessError("access.maxMarksOutOfRange");
  }
  /**
   * THE DATE SHEET WARNS LIKE THE REGISTER DOES. Science went onto
   * 10/11/2026 — the middle of the Diwali break — without a murmur, and the
   * school found out when families did. A paper on a closed day is refused
   * BY NAME, with an override for the school that truly sits one then; a
   * paper that CLASHES with another of the same grade at the same time is
   * refused outright, because no child can sit two.
   */
  if (!input.evenIfClosed) {
    const [spans, school] = await Promise.all([
      listHolidays(schoolId, { fromKey: input.dateKey, toKey: input.dateKey }),
      db.school.findUnique({ where: { id: schoolId }, select: { teachingDays: true } }),
    ]);
    if (isSchoolClosed(spans, input.dateKey, parseTeachingDays(school?.teachingDays))) {
      const holiday = spans.find((h) => h.kind === "HOLIDAY");
      throw new AccessError(
        holiday ? "access.paperOnHoliday" : "access.paperOnSunday",
        "FORBIDDEN",
        { date: formatDateKey(input.dateKey, { dateStyle: "medium" }), name: holiday?.name ?? "" },
      );
    }
  }

  const startMinute =
    input.startMinute != null && input.startMinute >= 0 && input.startMinute < 1440
      ? Math.round(input.startMinute)
      : null;
  const endMinute =
    input.endMinute != null && startMinute !== null && input.endMinute > startMinute && input.endMinute <= 1440
      ? Math.round(input.endMinute)
      : null;

  if (startMinute !== null && endMinute !== null) {
    // EVERY series of the grade, INCLUDING this one — a child cannot sit
    // Maths and History at once whichever sheet they are filed under. Only
    // the very paper being written is excluded, so moving a subject's own
    // time never clashes with its old self. (A battery scheduled an
    // overlapping paper into the same series and the first guard let it by.)
    const sameDay = await db.examSlot.findMany({
      where: {
        schoolId,
        dateKey: input.dateKey,
        NOT: { seriesId, subject },
        series: { gradeLevel: (await db.examSeries.findUniqueOrThrow({ where: { id: seriesId }, select: { gradeLevel: true } })).gradeLevel, archivedAt: null },
        startMinute: { not: null },
        endMinute: { not: null },
      },
      select: { subject: true, startMinute: true, endMinute: true, series: { select: { name: true } } },
    });
    const clash = sameDay.find((other) => other.startMinute! < endMinute && startMinute < other.endMinute!);
    if (clash) {
      throw new AccessError("access.papersClash", "FORBIDDEN", { subject: clash.subject, series: clash.series.name });
    }
  }

  /**
   * A MAXIMUM UNDER THE MARKS ALREADY SAVED IS REFUSED (TA-347). "Out of 100" made "out of 80" after the marking left
   * a 92 standing as 92/80 on the family's page and 115 % on a card built after; the office is told how many marks
   * stand above the new maximum, as removing a marked paper tells it how many it would orphan.
   */
  const newMaxMilli = toMilli(input.maxMarks);
  const above = await db.grade.count({
    where: { schoolId, scoreMilli: { gt: newMaxMilli }, assignment: { examSlot: { seriesId, subject } } },
  });
  if (above > 0) throw new AccessError("access.maxBelowSavedMarks", "FORBIDDEN", { count: above, max: input.maxMarks });

  const slot = await db.examSlot.upsert({
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
    select: { id: true },
  });
  // The sheet changed: the series' term follows its earliest paper, and the
  // paper's sittings — if any class has one yet — follow its max marks.
  await syncSeriesTerm(schoolId, series.id);
  await syncSittings({ slotId: slot.id });

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
  /**
   * A PAPER WITH MARKS IS A FACT, NOT FURNITURE. Removing the slot used to
   * orphan the sitting's assignment quietly (SetNull) — with thirty marks
   * saved, that is thirty results whose paper vanished from the sheet the
   * marks were entered against. Refused with the count; the school that
   * really wants it gone withdraws the marks first, on the record.
   */
  const marked = await db.grade.count({ where: { schoolId, assignment: { examSlotId: slot.id } } });
  if (marked > 0) throw new AccessError("access.paperHasMarks", "FORBIDDEN", { count: marked });
  // An unmarked sitting's Assignment survives; its examSlotId becomes null
  // (SetNull on the relation).
  await db.examSlot.delete({ where: { id: slot.id } });
  // The earliest paper may have been this one; the term follows the rest.
  await syncSeriesTerm(schoolId, slot.seriesId);
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
  kind: ExamKind;
  gradeLevel: string;
  /** Which school's sheet this is — a family can straddle two. */
  schoolName: string;
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
 *
 * A GUARDIAN'S SESSION CARRIES NO SCHOOL — parents are cross-school by design
 * (see setActiveContext) — so their sheets are resolved from guardianship:
 * every (school, grade) their children are enrolled in, merged into one list.
 * Requiring ctx.schoolId here was the bug that showed a parent
 * "No exams announced" while their child could read the sheet.
 */
export async function dateSheetsFor(ctx: ActiveContext): Promise<DateSheet[]> {
  const { schoolId, membershipId, role, user } = ctx;

  // (schoolId, grades) the viewer is connected to; grades null = every grade.
  let scopes: { schoolId: string; grades: string[] | null }[];

  if (role === "PARENT") {
    const rows = await db.enrollment.findMany({
      where: {
        status: "ACTIVE",
        student: { guardianships: { some: { parentUserId: user.id, status: "ACTIVE" } } },
      },
      select: { schoolId: true, class: { select: { gradeLevel: true } } },
    });
    const bySchool = new Map<string, Set<string>>();
    for (const row of rows) {
      if (row.class.gradeLevel === null) continue;
      const set = bySchool.get(row.schoolId) ?? new Set<string>();
      set.add(row.class.gradeLevel);
      bySchool.set(row.schoolId, set);
    }
    scopes = [...bySchool.entries()].map(([id, grades]) => ({ schoolId: id, grades: [...grades] }));
  } else if (role === "STUDENT" && membershipId && schoolId) {
    const rows = await db.enrollment.findMany({
      where: { studentMembershipId: membershipId, status: "ACTIVE", class: { schoolId } },
      select: { class: { select: { gradeLevel: true } } },
    });
    const grades = [
      ...new Set(rows.map((r) => r.class.gradeLevel).filter((g): g is string => g !== null)),
    ];
    scopes = [{ schoolId, grades }];
  } else if (schoolId) {
    scopes = [{ schoolId, grades: null }]; // staff: the whole school
  } else {
    scopes = [];
  }
  if (scopes.length === 0) return [];

  const series = await db.examSeries.findMany({
    where: {
      archivedAt: null,
      publishedAt: { not: null },
      OR: scopes.map((scope) => ({
        schoolId: scope.schoolId,
        ...(scope.grades !== null ? { gradeLevel: { in: scope.grades } } : {}),
      })),
    },
    orderBy: [{ gradeLevel: "asc" }, { createdAt: "desc" }],
    include: {
      slots: { orderBy: [{ dateKey: "asc" }, { position: "asc" }] },
      school: { select: { name: true } },
    },
  });

  return series.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind as ExamKind,
    gradeLevel: s.gradeLevel,
    schoolName: s.school.name,
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

/**
 * EVERY TEACHER OF THE LESSON MAY ENTER ITS MARKS. The class teachers (LEAD or
 * CO) may enter any paper for their class, as before — and, new, the teacher
 * the timetable puts in that room for that subject may enter THAT paper,
 * because the mathematician who taught 7A its Maths is the person who marked
 * the Maths paper, whether or not they take 7A's register. Admins may enter
 * anything. Anybody else is told the class is not theirs.
 */
export async function assertMayEnterMarks(
  ctx: { schoolId: string; membershipId: string; role: "ADMIN" | "TEACHER" },
  classId: string,
  slotId: string,
): Promise<void> {
  if (ctx.role === "ADMIN") {
    const klass = await db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!klass) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
    return;
  }
  const slot = await db.examSlot.findFirst({
    where: { id: slotId, schoolId: ctx.schoolId },
    select: { subject: true },
  });
  if (!slot) throw new AccessError("access.examNotFound", "NOT_FOUND");

  const [classTeacher, lesson] = await Promise.all([
    db.classTeacher.findFirst({
      where: { classId, schoolId: ctx.schoolId, teacherMembershipId: ctx.membershipId },
      select: { id: true },
    }),
    db.timetableSlot.findFirst({
      where: {
        classId,
        schoolId: ctx.schoolId,
        teacherMembershipId: ctx.membershipId,
        subject: { equals: slot.subject, mode: "insensitive" },
      },
      select: { id: true },
    }),
  ]);
  if (!classTeacher && !lesson) throw new AccessError("access.notYourPaperToMark");
}

/** The classes this teacher can enter exam marks for, with the series that fit. */
export async function examClassesFor(ctx: ActiveContext) {
  const { schoolId, membershipId, role } = requireStaffScope(ctx);

  /* A teacher's classes for marks are the union of two lists: the classes
   * they take the register for (every paper) and the classes the timetable
   * sends them to (that subject's paper). `subjects` is null where every
   * paper is theirs, else the lower-cased subjects they may mark. */
  const subjectsBy = new Map<string, Set<string> | null>();
  if (role === "TEACHER") {
    const [taught, timetabled] = await Promise.all([
      db.classTeacher.findMany({
        where: { schoolId, teacherMembershipId: membershipId },
        select: { classId: true },
      }),
      db.timetableSlot.findMany({
        where: { schoolId, teacherMembershipId: membershipId },
        select: { classId: true, subject: true },
      }),
    ]);
    for (const row of taught) subjectsBy.set(row.classId, null);
    for (const row of timetabled) {
      if (subjectsBy.has(row.classId) && subjectsBy.get(row.classId) === null) continue;
      const set = subjectsBy.get(row.classId) ?? new Set<string>();
      set.add(row.subject.toLowerCase());
      subjectsBy.set(row.classId, set);
    }
    if (subjectsBy.size === 0) return [];
  }

  const classes = await db.class.findMany({
    where: {
      schoolId,
      archivedAt: null,
      gradeLevel: { not: null },
      ...(role === "TEACHER" ? { id: { in: [...subjectsBy.keys()] } } : {}),
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

  return classes.map((klass) => {
    const allowed = role === "TEACHER" ? (subjectsBy.get(klass.id) ?? null) : null;
    return {
      ...klass,
      series: series
        .filter((s) => s.gradeLevel === klass.gradeLevel)
        .map((s) => ({
          ...s,
          kind: s.kind as ExamKind,
          // Only the papers this person may mark; a series with none left is
          // dropped rather than shown empty.
          slots: allowed ? s.slots.filter((slot) => allowed.has(slot.subject.toLowerCase())) : s.slots,
        }))
        .filter((s) => s.slots.length > 0),
    };
  });
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
  await assertMayEnterMarks({ schoolId, membershipId, role }, classId, slotId);

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
 *
 * AN OLDER SHEET DOES NOT UNDO A NEWER ONE (TA-010, 13 Nov 2026). A sheet that
 * names `basedOn` — the version it was typed on, the server's clock when the
 * grid was read or the last save answered — leaves alone every pupil whose
 * grade was written after it (counted as `skipped`), so a sheet replayed late
 * from a phone's outbox cannot put its blanks over marks saved since, from
 * the phone or the web. Such a sheet is answered with the sheet's new
 * `version` for the next save. A sheet without it (an older phone, a caller
 * of the door that names none) is applied whole, as before; the web's form
 * names the version its page was drawn on, online and from its outbox alike
 * (TA-248 / TA-515).
 *
 * The audit row names the cells that changed, with the mark before and after
 * (TA-345, markChange in grading.ts).
 */
export async function saveMarks(
  ctx: ActiveContext,
  slotId: string,
  classId: string,
  entries: { membershipId: string; marks: number | null }[],
  options: { basedOn?: string } = {},
): Promise<{ saved: number; cleared: number; skipped?: number; version?: string }> {
  const { schoolId, membershipId, role } = requireStaffScope(ctx);
  await assertMayEnterMarks({ schoolId, membershipId, role }, classId, slotId);

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

  /**
   * A FINISHED YEAR'S MARKS ARE THE RECORD. Once the office closes the year,
   * a teacher's edit here is refused by name; the office and the head keep
   * the pen, and the reopen door on the calendar page is the correction path
   * for everyone else.
   */
  if (role === "TEACHER") {
    const finished = await finishedYearContaining(schoolId, new Date(`${slot.dateKey}T00:00:00.000Z`));
    if (finished) {
      throw new AccessError("access.yearFinishedMarksLocked", "FORBIDDEN", { year: finished.name });
    }
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
    // Both copies follow the sheet (see syncSittings).
    update: { pointsMilli: slot.pointsMilli, title: sittingTitle(slot.series.name, slot.subject) },
    create: {
      schoolId,
      classId,
      authorMembershipId: membershipId,
      title: sittingTitle(slot.series.name, slot.subject),
      category: EXAM_CATEGORY,
      pointsMilli: slot.pointsMilli,
      examSlotId: slotId,
      publishedAt: new Date(),
    },
    select: { id: true },
  });

  const basedOn = options.basedOn ? new Date(options.basedOn) : null;
  const stamped = basedOn !== null && !Number.isNaN(basedOn.getTime());
  const writtenSince = stamped
    ? new Set(
        (
          await db.grade.findMany({
            where: { assignmentId: sitting.id, updatedAt: { gt: basedOn } },
            select: { studentMembershipId: true },
          })
        ).map((g) => g.studentMembershipId),
      )
    : new Set<string>();
  // The marks as they stood, for the audit row's changed cells (TA-345).
  const before = new Map(
    (
      await db.grade.findMany({
        where: { assignmentId: sitting.id },
        select: { studentMembershipId: true, scoreMilli: true },
      })
    ).map((g) => [g.studentMembershipId, g.scoreMilli]),
  );
  const changes: MarkChange[] = [];

  let saved = 0;
  let cleared = 0;
  let skipped = 0;
  for (const entry of entries) {
    if (!roll.has(entry.membershipId)) continue;
    if (writtenSince.has(entry.membershipId)) {
      skipped += 1;
      continue;
    }
    if (entry.marks === null) {
      const gone = await db.grade.deleteMany({
        where: { assignmentId: sitting.id, studentMembershipId: entry.membershipId },
      });
      cleared += gone.count;
      if (gone.count > 0) changes.push(markChange(entry.membershipId, before.get(entry.membershipId) ?? null, null));
      continue;
    }
    const previous = before.get(entry.membershipId) ?? null;
    if (!before.has(entry.membershipId) || previous !== toMilli(entry.marks)) changes.push(markChange(entry.membershipId, previous, toMilli(entry.marks)));
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
    meta: { series: slot.series.name, subject: slot.subject, classId, saved, cleared, ...(stamped ? { skipped } : {}), changes },
  });

  // Taken after every write above: a grade written later than this is newer than what this sheet knew.
  return stamped ? { saved, cleared, skipped, version: new Date().toISOString() } : { saved, cleared };
}

/* -------------------------------------------------------------------------- */
/* Pupils admitted part-way through the year                                   */
/* -------------------------------------------------------------------------- */

/**
 * A PAPER SAT BEFORE THE CHILD JOINED IS NOT THEIRS TO MARK (A3-journeys-16, audit of 5 October 2026). A child
 * admitted on 5 October inherited September's mid-term papers as "awaiting marks" on the family's home, and the
 * teacher's sheets read "5 of 7 marked · 2 to mark" for two children who were not yet on the roll. The joining day
 * is the pupil record's admission date (written by admissions, the college's admit and the office) — date-only,
 * at UTC midnight; a pupil with none on file is taken to have been there all along.
 *
 * By class: the admission day of each pupil now on it who has one.
 */
export async function admissionDaysByClass(classIds: readonly string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (classIds.length === 0) return out;
  const rows = await db.enrollment.findMany({
    where: { classId: { in: [...classIds] }, status: "ACTIVE", student: { pupilRecord: { admissionDate: { not: null } } } },
    select: { classId: true, student: { select: { pupilRecord: { select: { admissionDate: true } } } } },
  });
  for (const r of rows) {
    const day = r.student.pupilRecord?.admissionDate?.toISOString().slice(0, 10);
    if (day) out.set(r.classId, [...(out.get(r.classId) ?? []), day]);
  }
  return out;
}

/** The class's roll for a paper or piece of work dated `dayKey`: the pupils on it now, less those admitted after that day. */
export function rollOn(size: number, admissionDays: readonly string[] | undefined, dayKey: string): number {
  return size - (admissionDays ?? []).filter((d) => d > dayKey).length;
}

/* -------------------------------------------------------------------------- */
/* The reader's marks — what a pupil or a family sees                          */
/* -------------------------------------------------------------------------- */

export type ExamMarks = {
  /** Whose marks, for a parent with several children; the pupil's own name otherwise. */
  studentMembershipId: string;
  studentName: string;
  schoolName: string;
  className: string;
  series: {
    id: string;
    name: string;
    kind: ExamKind;
    papers: { subject: string; dateKey: string; marks: number | null; maxMarks: number }[];
    /** Summed over the papers that have a mark — an unsat paper is absent, not nought. */
    totalMarks: number;
    totalMax: number;
    percent: number | null;
  }[];
};

/**
 * Exam marks as the pupil and their guardians read them: every published
 * series of their grade, paper by paper, AS SOON AS A TEACHER SAVES THEM. No
 * waiting for a report card — the card is the term's document; this is the
 * week's news. Assignment marks are deliberately not here: they live on the
 * grades page as the running picture, and mixing the two is how a parent
 * mistakes a homework score for an exam result.
 */
export async function examMarksFor(ctx: ActiveContext): Promise<ExamMarks[]> {
  const { schoolId, membershipId, role, user } = ctx;

  type Target = { studentMembershipId: string; schoolId: string; classId: string };
  let targets: Target[] = [];
  if (role === "STUDENT" && membershipId && schoolId) {
    const rows = await db.enrollment.findMany({
      where: { studentMembershipId: membershipId, status: "ACTIVE", schoolId },
      select: { classId: true },
    });
    targets = rows.map((r) => ({ studentMembershipId: membershipId, schoolId, classId: r.classId }));
  } else if (role === "PARENT") {
    const rows = await db.enrollment.findMany({
      where: {
        status: "ACTIVE",
        student: { guardianships: { some: { parentUserId: user.id, status: "ACTIVE" } } },
      },
      select: { studentMembershipId: true, schoolId: true, classId: true },
    });
    // An adult college student's marks are theirs until they grant RESULTS (TA-459).
    const open = new Set(await studentsGuardianMaySee([...new Set(rows.map((r) => r.studentMembershipId))], "RESULTS", user.id));
    targets = rows.filter((r) => open.has(r.studentMembershipId));
  }
  if (targets.length === 0) return [];

  const out: ExamMarks[] = [];
  for (const target of targets) {
    const klass = await db.class.findFirst({
      where: { id: target.classId, schoolId: target.schoolId },
      select: { name: true, gradeLevel: true, school: { select: { name: true } } },
    });
    if (!klass?.gradeLevel) continue;
    const student = await db.membership.findUnique({
      where: { id: target.studentMembershipId },
      select: { user: { select: { name: true, preferredName: true } }, pupilRecord: { select: { admissionDate: true } } },
    });
    if (!student) continue;
    // A paper sat before the child was admitted, with no mark, is not one they are waiting on (admissionDaysByClass).
    const admittedKey = student.pupilRecord?.admissionDate?.toISOString().slice(0, 10) ?? null;

    const series = await db.examSeries.findMany({
      where: {
        schoolId: target.schoolId,
        gradeLevel: klass.gradeLevel,
        archivedAt: null,
        publishedAt: { not: null },
      },
      orderBy: { createdAt: "asc" },
      include: {
        slots: {
          orderBy: [{ dateKey: "asc" }, { position: "asc" }],
          include: {
            assignments: {
              where: { classId: target.classId },
              select: {
                grades: {
                  where: { studentMembershipId: target.studentMembershipId },
                  select: { scoreMilli: true },
                },
              },
            },
          },
        },
      },
    });

    out.push({
      studentMembershipId: target.studentMembershipId,
      studentName: student.user.preferredName ?? student.user.name,
      schoolName: klass.school.name,
      className: klass.name,
      series: series.flatMap((s) => {
        const papers = s.slots
          .map((slot) => {
            const milli = slot.assignments[0]?.grades[0]?.scoreMilli ?? null;
            return {
              subject: slot.subject,
              dateKey: slot.dateKey,
              marks: milli === null ? null : milli / 1000,
              maxMarks: slot.pointsMilli / 1000,
            };
          })
          .filter((p) => p.marks !== null || !admittedKey || p.dateKey >= admittedKey);
        if (papers.length === 0) return [];
        const marked = papers.filter((p) => p.marks !== null);
        const totalMarks = marked.reduce((a, p) => a + (p.marks ?? 0), 0);
        const totalMax = marked.reduce((a, p) => a + p.maxMarks, 0);
        return [{
          id: s.id,
          name: s.name,
          kind: s.kind as ExamKind,
          papers,
          totalMarks,
          totalMax,
          percent: totalMax > 0 ? Math.round((totalMarks / totalMax) * 1000) / 10 : null,
        }];
      }),
    });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* The teacher's to-do — papers still waiting for marks                        */
/* -------------------------------------------------------------------------- */

export type MarksTodo = {
  classId: string;
  className: string;
  slotId: string;
  seriesName: string;
  kind: ExamKind;
  subject: string;
  dateKey: string;
  marked: number;
  classSize: number;
};

/**
 * Every paper this teacher may mark whose date has passed and whose marks are
 * not all in. The Today page's "marks to enter" card — the redundancy the
 * feature asks for: the grid is one click from the place a teacher already
 * looks every morning, not only from the Exams menu.
 */
export async function marksTodoFor(ctx: ActiveContext, todayKey: string): Promise<MarksTodo[]> {
  const classes = await examClassesFor(ctx);
  const admitted = await admissionDaysByClass(classes.map((c) => c.id));
  const out: MarksTodo[] = [];
  for (const klass of classes) {
    const onRollNow = await db.enrollment.count({ where: { classId: klass.id, status: "ACTIVE" } });
    if (onRollNow === 0) continue;
    for (const series of klass.series) {
      for (const slot of series.slots) {
        if (slot.dateKey > todayKey) continue;
        // Those admitted after the paper's day were not there to sit it (A3-journeys-16).
        const classSize = rollOn(onRollNow, admitted.get(klass.id), slot.dateKey);
        if (classSize <= 0) continue;
        const sitting = await db.assignment.findUnique({
          where: { examSlotId_classId: { examSlotId: slot.id, classId: klass.id } },
          select: { _count: { select: { grades: true } } },
        });
        const marked = sitting?._count.grades ?? 0;
        if (marked >= classSize) continue;
        out.push({
          classId: klass.id,
          className: klass.name,
          slotId: slot.id,
          seriesName: series.name,
          kind: series.kind,
          subject: slot.subject,
          dateKey: slot.dateKey,
          marked,
          classSize,
        });
      }
    }
  }
  return out.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.className.localeCompare(b.className));
}

/**
 * Make sure every scheduled paper of this class's grade has its sitting row,
 * so a report card built from the schedule lists every subject — marked or
 * still blank — rather than only the ones whose grid somebody happened to
 * open. Idempotent on the (slot, class) unique key — and a sitting already
 * there has its max marks and title brought level with the sheet, so a paper
 * corrected after the grids were opened reaches the card at its new value.
 */
export async function ensureSittings(
  schoolId: string,
  classId: string,
  authorMembershipId: string,
): Promise<void> {
  const klass = await db.class.findFirst({ where: { id: classId, schoolId }, select: { gradeLevel: true } });
  if (!klass?.gradeLevel) return;
  const slots = await db.examSlot.findMany({
    where: { schoolId, series: { gradeLevel: klass.gradeLevel, archivedAt: null } },
    select: { id: true, subject: true, pointsMilli: true, series: { select: { name: true } } },
  });
  for (const slot of slots) {
    const title = sittingTitle(slot.series.name, slot.subject);
    await db.assignment.upsert({
      where: { examSlotId_classId: { examSlotId: slot.id, classId } },
      update: { pointsMilli: slot.pointsMilli, title },
      create: {
        schoolId,
        classId,
        authorMembershipId,
        title,
        category: EXAM_CATEGORY,
        pointsMilli: slot.pointsMilli,
        examSlotId: slot.id,
        publishedAt: new Date(),
      },
    });
  }
}

/* -------------------------------------------------------------------------- */
/* The reader's assignments — the running picture, beside the exams           */
/* -------------------------------------------------------------------------- */

export type AssignmentOverview = {
  studentMembershipId: string;
  studentName: string;
  /** Marked homework and classwork, newest first. Exam sittings excluded —
   * those are the exam-marks card's business. */
  graded: {
    id: string;
    title: string;
    className: string;
    category: string | null;
    marks: number;
    maxMarks: number | null;
    gradedAt: Date;
  }[];
  /** Published work due later than now that has not been handed in. */
  upcoming: {
    id: string;
    title: string;
    className: string;
    category: string | null;
    dueAt: Date;
    maxMarks: number | null;
  }[];
};

/**
 * Assignment marks and what is due, for a pupil or for each of a parent's
 * children — the ongoing-progress half of the Exams & Assignments page. Kept
 * deliberately separate from exam marks: the same page shows both, under
 * different headings, so a homework score is never mistaken for a result.
 */
export async function assignmentOverviewFor(ctx: ActiveContext): Promise<AssignmentOverview[]> {
  const { schoolId, membershipId, role, user } = ctx;

  let targets: { studentMembershipId: string; schoolId: string }[] = [];
  if (role === "STUDENT" && membershipId && schoolId) {
    targets = [{ studentMembershipId: membershipId, schoolId }];
  } else if (role === "PARENT") {
    const rows = await db.guardianship.findMany({
      where: { parentUserId: user.id, status: "ACTIVE" },
      select: { studentMembershipId: true, studentSchoolId: true },
    });
    targets = rows.map((r) => ({ studentMembershipId: r.studentMembershipId, schoolId: r.studentSchoolId }));
  }
  if (targets.length === 0) return [];

  const now = new Date();
  const out: AssignmentOverview[] = [];
  for (const target of targets) {
    const student = await db.membership.findUnique({
      where: { id: target.studentMembershipId },
      select: { user: { select: { name: true, preferredName: true } } },
    });
    if (!student) continue;

    const [grades, due] = await Promise.all([
      db.grade.findMany({
        where: {
          schoolId: target.schoolId,
          studentMembershipId: target.studentMembershipId,
          scoreMilli: { not: null },
          assignment: { examSlotId: null },
        },
        select: {
          scoreMilli: true,
          gradedAt: true,
          assignment: {
            select: { id: true, title: true, category: true, pointsMilli: true, class: { select: { name: true } }, offering: { select: { course: { select: { code: true, name: true } } } } },
          },
        },
        orderBy: { gradedAt: "desc" },
        take: 20,
      }),
      db.assignment.findMany({
        where: {
          schoolId: target.schoolId,
          publishedAt: { not: null },
          examSlotId: null,
          dueAt: { gte: now },
          class: { enrollments: { some: { studentMembershipId: target.studentMembershipId, status: "ACTIVE" } } },
          submissions: { none: { studentMembershipId: target.studentMembershipId, submittedAt: { not: null } } },
        },
        select: { id: true, title: true, category: true, pointsMilli: true, dueAt: true, class: { select: { name: true } } },
        orderBy: { dueAt: "asc" },
        take: 20,
      }),
    ]);

    out.push({
      studentMembershipId: target.studentMembershipId,
      studentName: student.user.preferredName ?? student.user.name,
      graded: grades.map((g) => ({
        id: g.assignment.id,
        title: g.assignment.title,
        className: workLabel(g.assignment),
        category: g.assignment.category,
        marks: g.scoreMilli! / 1000,
        maxMarks: g.assignment.pointsMilli === null ? null : g.assignment.pointsMilli / 1000,
        gradedAt: g.gradedAt,
      })),
      upcoming: due.map((a) => ({
        id: a.id,
        title: a.title,
        className: a.class?.name ?? "",
        category: a.category,
        dueAt: a.dueAt!,
        maxMarks: a.pointsMilli === null ? null : a.pointsMilli / 1000,
      })),
    });
  }
  return out;
}
