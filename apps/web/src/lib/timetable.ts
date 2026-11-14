import type { TranslationKey } from "./i18n/dictionary";
import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { isDateKey, addDaysToKey, weekdayOfKey, parseTeachingDays } from "./dates";
import { listHolidays, closedDayKeys } from "./holidays";
import {
  PERIOD_KINDS,
  WEEK_DAYS,
  isWeekdayNumber,
  periodTimeError,
  SUGGESTED_DAY,
  type PeriodKind,
} from "./school-day";
import type { ActiveContext } from "./session";
import { parseCsv } from "./csv";

/**
 * The weekly timetable: the school's day, the grid of lessons, and who is
 * actually standing in front of each class on a given date.
 *
 * THREE LAYERS, AND KEEPING THEM APART IS THE DESIGN.
 *
 *   1. THE PERIODS are the school's bells. School-wide, set once.
 *   2. THE GRID is a TEMPLATE — "Class 5A does maths with Mrs Rao at period 1
 *      on Mondays". It has no dates in it at all, because a timetable is a
 *      recurring statement rather than a list of events. Storing one row per
 *      lesson per week would mean a term's worth of rows to edit when one
 *      lesson moves, and a timetable that stops existing the moment somebody
 *      forgets to generate next term's.
 *   3. THE RESOLVED WEEK applies real dates to the template — and this is the
 *      only layer that knows about leave, cover and holidays. A cover NEVER
 *      changes the grid; it changes what the grid RESOLVES TO on the days it
 *      applies. Editing the template because somebody is ill for two days is
 *      how a timetable quietly becomes wrong for the rest of the year.
 *
 * WHO MAY DO WHAT. An ADMIN edits any class's grid and the school's periods. A
 * PRINCIPAL reads any class's grid and edits nothing — the same split as the
 * calendar, and for the same reason. A TEACHER reads their own week, including
 * lessons they are covering. A STUDENT reads their own. Nobody but an admin
 * writes.
 */

/* -------------------------------------------------------------------------- */
/* Shapes                                                                      */
/* -------------------------------------------------------------------------- */

export type PeriodRow = {
  id: string;
  name: string;
  startMinute: number;
  endMinute: number;
  kind: PeriodKind;
  position: number;
  archivedAt: Date | null;
};

/** One cell of a resolved grid. */
export type SlotView = {
  id: string;
  classId: string;
  className: string;
  periodId: string;
  weekday: number;
  subject: string;
  room: string | null;
  teacherMembershipId: string | null;
  teacherName: string | null;
  /** The person actually taking it, when the assigned teacher is away. */
  coveringMembershipId: string | null;
  coveringName: string | null;
  /** Assigned teacher is on approved leave and nobody was arranged. */
  uncovered: boolean;
  /** True on a teacher's own week for a lesson that is not theirs this week. */
  borrowed: boolean;
};

export type DayColumn = {
  weekday: number;
  /** Present only on a dated week. */
  dateKey: string | null;
  /** The school is shut, per the calendar. */
  closed: boolean;
  closedName: string | null;
  isToday: boolean;
};

export type WeekGrid = {
  periods: PeriodRow[];
  days: DayColumn[];
  slots: SlotView[];
};

/* -------------------------------------------------------------------------- */
/* The school's day                                                            */
/* -------------------------------------------------------------------------- */

const MAX_PERIODS = 20;
const NAME_MAX = 60;

function assertAdmin(ctx: ActiveContext): asserts ctx is ActiveContext & { schoolId: string } {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanChangeTheTimetable");
  }
}

/**
 * The school's periods.
 *
 * Archived ones are included only when asked for, because every reader except
 * the builder wants the day as it is now — and a grid that renders a retired
 * period as an empty row looks like a bug rather than like history.
 */
/**
 * How much of the timetable has no teacher — the gap between a grid that is
 * drawn and a grid that is staffed.
 *
 * A slot with a subject and no `teacherMembershipId` is a lesson on the board
 * that nobody is down to teach: the honest vacancy a school of ten grades and
 * five teachers necessarily carries. The grid editor shows this per class; the
 * office needs the school-wide number, because the answer to "nobody teaches
 * these fourteen periods" is to HIRE, and the hire lives on the vacancies
 * board, a page away. Counted over LIVING classes only — an archived class's
 * empty slots are history, not a vacancy — and reported as both the raw slot
 * count and the number of distinct classes affected, which is the sentence a
 * head actually thinks in ("four classes are short a teacher").
 */
export async function unstaffedLessons(schoolId: string): Promise<{ slots: number; classes: number }> {
  const rows = await db.timetableSlot.findMany({
    where: { schoolId, teacherMembershipId: null, class: { archivedAt: null }, period: { kind: "LESSON", archivedAt: null } },
    select: { classId: true },
  });
  return { slots: rows.length, classes: new Set(rows.map((r) => r.classId)).size };
}

export async function listPeriods(
  schoolId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<PeriodRow[]> {
  const rows = await db.timetablePeriod.findMany({
    where: { schoolId, ...(opts.includeArchived ? {} : { archivedAt: null }) },
    orderBy: [{ position: "asc" }, { startMinute: "asc" }],
    take: MAX_PERIODS * 4,
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    startMinute: row.startMinute,
    endMinute: row.endMinute,
    kind: (PERIOD_KINDS as readonly string[]).includes(row.kind)
      ? (row.kind as PeriodKind)
      : "LESSON",
    position: row.position,
    archivedAt: row.archivedAt,
  }));
}

export type PeriodInput = {
  name: string;
  startMinute: number;
  endMinute: number;
  kind: PeriodKind;
};

/**
 * ⚠ `errorKey` AND `errorVars`, NOT A SENTENCE. Every write path here is
 * reached from a form, and the message it hands back is read by whoever is
 * standing at that form — see the note on `periodTimeError`.
 */
export type Result = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  /**
   * The one message this layer cannot key: an `AccessError` from the tenancy
   * layer, whose text is minted app-wide and shared by every route. See the
   * same note on `CreateInvitesState`.
   */
  error?: string;
  id?: string;
};

function cleanPeriodInput(
  input: PeriodInput,
): { errorKey?: TranslationKey; errorVars?: Record<string, string | number>; data?: PeriodInput } {
  const name = input.name.trim().slice(0, NAME_MAX);
  if (name.length < 1) return { errorKey: "timetable.needPeriodName" };
  if (!(PERIOD_KINDS as readonly string[]).includes(input.kind)) {
    return { errorKey: "timetable.lessonOrBreak" };
  }
  const timeError = periodTimeError(input);
  if (timeError) return { errorKey: timeError.key, errorVars: timeError.vars };
  return {
    data: {
      name,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      kind: input.kind,
    },
  };
}

export async function createPeriod(ctx: ActiveContext, input: PeriodInput): Promise<Result> {
  assertAdmin(ctx);
  const cleaned = cleanPeriodInput(input);
  if (cleaned.errorKey || !cleaned.data) {
    return { ok: false, errorKey: cleaned.errorKey, errorVars: cleaned.errorVars };
  }

  const existing = await db.timetablePeriod.count({
    where: { schoolId: ctx.schoolId, archivedAt: null },
  });
  if (existing >= MAX_PERIODS) {
    return {
      ok: false,
      errorKey: "timetable.tooManyPeriods",
      errorVars: { max: MAX_PERIODS },
    };
  }

  const created = await db.timetablePeriod.create({
    data: {
      schoolId: ctx.schoolId,
      ...cleaned.data,
      // Appended, then re-sorted by time below, so a period typed out of order
      // still lands where the day actually puts it.
      position: existing,
    },
    select: { id: true },
  });
  await resequence(ctx.schoolId);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.period.create",
    targetType: "TimetablePeriod",
    targetId: created.id,
    meta: { name: cleaned.data.name, start: cleaned.data.startMinute },
  });

  return { ok: true, id: created.id };
}

export async function updatePeriod(
  ctx: ActiveContext,
  periodId: string,
  input: PeriodInput,
): Promise<Result> {
  assertAdmin(ctx);
  const cleaned = cleanPeriodInput(input);
  if (cleaned.errorKey || !cleaned.data) {
    return { ok: false, errorKey: cleaned.errorKey, errorVars: cleaned.errorVars };
  }

  const result = await db.timetablePeriod.updateMany({
    where: { id: periodId, schoolId: ctx.schoolId },
    data: cleaned.data,
  });
  if (result.count === 0) return { ok: false, errorKey: "timetable.periodNotHere" };
  await resequence(ctx.schoolId);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.period.update",
    targetType: "TimetablePeriod",
    targetId: periodId,
    meta: { name: cleaned.data.name },
  });

  return { ok: true, id: periodId };
}

/**
 * Retires a period, keeping every lesson that was in it.
 *
 * NOT A DELETE, and the cascade is why. `TimetableSlot.periodId` cascades, so
 * deleting period 4 in March would take every class's fourth lesson with it —
 * silently, and with no way back. Archiving takes the column off the grid and
 * leaves the rows underneath, exactly as archiving a class leaves its register.
 */
export async function archivePeriod(ctx: ActiveContext, periodId: string): Promise<Result> {
  assertAdmin(ctx);
  const result = await db.timetablePeriod.updateMany({
    where: { id: periodId, schoolId: ctx.schoolId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, errorKey: "timetable.alreadyRetired" };
  await resequence(ctx.schoolId);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.period.archive",
    targetType: "TimetablePeriod",
    targetId: periodId,
  });
  return { ok: true, id: periodId };
}

export async function restorePeriod(ctx: ActiveContext, periodId: string): Promise<Result> {
  assertAdmin(ctx);
  const result = await db.timetablePeriod.updateMany({
    where: { id: periodId, schoolId: ctx.schoolId, archivedAt: { not: null } },
    data: { archivedAt: null },
  });
  if (result.count === 0) return { ok: false, errorKey: "timetable.notRetired" };
  await resequence(ctx.schoolId);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.period.restore",
    targetType: "TimetablePeriod",
    targetId: periodId,
  });
  return { ok: true, id: periodId };
}

/**
 * Lays out a first school day for a school that has none.
 *
 * REFUSES IF ANY PERIOD ALREADY EXISTS, including a retired one. The point is to
 * remove the blank-page problem, not to be an "undo my afternoon" button that
 * appends eight more rows to a day somebody has already built.
 */
export async function applySuggestedDay(ctx: ActiveContext): Promise<Result & { created?: number }> {
  assertAdmin(ctx);
  const existing = await db.timetablePeriod.count({ where: { schoolId: ctx.schoolId } });
  if (existing > 0) {
    return { ok: false, errorKey: "timetable.dayExists" };
  }

  let created = 0;
  for (const [index, period] of SUGGESTED_DAY.entries()) {
    await db.timetablePeriod.create({
      data: { schoolId: ctx.schoolId, ...period, position: index },
      select: { id: true },
    });
    created++;
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.period.seed",
    targetType: "School",
    targetId: ctx.schoolId,
    meta: { created },
  });

  return { ok: true, created };
}

/**
 * Renumbers `position` so it agrees with the clock.
 *
 * Run after every write rather than trusting the number an admin was shown: a
 * period edited from 08:00 to 14:00 would otherwise stay at the top of the grid
 * while the times below it went backwards, which reads as data corruption.
 * Retired periods are ordered too, so restoring one puts it back in its place.
 */
async function resequence(schoolId: string): Promise<void> {
  const rows = await db.timetablePeriod.findMany({
    where: { schoolId },
    orderBy: [{ startMinute: "asc" }, { endMinute: "asc" }],
    select: { id: true, position: true },
  });
  for (const [index, row] of rows.entries()) {
    if (row.position === index) continue;
    await db.timetablePeriod.update({ where: { id: row.id }, data: { position: index } });
  }
}

/* -------------------------------------------------------------------------- */
/* The grid                                                                    */
/* -------------------------------------------------------------------------- */

const SUBJECT_MAX = 60;
const ROOM_MAX = 40;

export type SlotInput = {
  classId: string;
  periodId: string;
  weekday: number;
  subject: string;
  teacherMembershipId?: string | null;
  room?: string | null;
};

/**
 * Puts a lesson in a cell, or changes the one that is there.
 *
 * THE DOUBLE-BOOKING CHECK IS THE INTERESTING PART. A teacher cannot be in two
 * rooms at 11:15 on a Tuesday, and a timetable that says otherwise is worse than
 * no timetable — somebody builds a term around it. It is refused here with a
 * message naming the class they are already in, and refused again by a unique
 * index underneath, because two admins saving at the same moment would both pass
 * the check and only one can be right. The database is the one that holds.
 */
export async function setSlot(ctx: ActiveContext, input: SlotInput): Promise<Result> {
  assertAdmin(ctx);

  if (!isWeekdayNumber(input.weekday)) return { ok: false, errorKey: "timetable.notAWeekday" };
  if (!(await schoolWeek(ctx.schoolId)).includes(input.weekday)) {
    return { ok: false, errorKey: "timetable.mondayToSaturday" };
  }

  const subject = input.subject.trim().slice(0, SUBJECT_MAX);
  if (subject.length < 1) return { ok: false, errorKey: "timetable.saySubject" };

  const [klass, period] = await Promise.all([
    db.class.findFirst({
      where: { id: input.classId, schoolId: ctx.schoolId, archivedAt: null },
      select: { id: true, name: true },
    }),
    db.timetablePeriod.findFirst({
      where: { id: input.periodId, schoolId: ctx.schoolId, archivedAt: null },
      select: { id: true, name: true, kind: true },
    }),
  ]);
  if (!klass) return { ok: false, errorKey: "timetable.classNotHere" };
  if (!period) return { ok: false, errorKey: "timetable.periodNotOnDay" };
  if (period.kind === "BREAK") {
    return {
      ok: false,
      errorKey: "timetable.isABreak",
      errorVars: { name: period.name },
    };
  }

  // The teacher is re-read against the school and the role, like every id that
  // arrives from a form. A principal may teach; an admin may not.
  let teacherMembershipId: string | null = null;
  if (input.teacherMembershipId) {
    const teacher = await db.membership.findFirst({
      where: {
        id: input.teacherMembershipId,
        schoolId: ctx.schoolId,
        role: { in: ["TEACHER", "PRINCIPAL"] },
        status: "ACTIVE",
        leftAt: null,
      },
      select: { id: true },
    });
    if (!teacher) return { ok: false, errorKey: "timetable.notTeachingStaff" };
    teacherMembershipId = teacher.id;
  }

  if (teacherMembershipId) {
    const clash = await db.timetableSlot.findFirst({
      where: {
        schoolId: ctx.schoolId,
        weekday: input.weekday,
        periodId: input.periodId,
        teacherMembershipId,
        classId: { not: input.classId },
        // A LIVING class's lesson. Archived classes release their teachers
        // when they archive, so this filter is normally redundant — but it
        // states the rule, and it keeps the refusal from naming a class the
        // school can no longer see anywhere.
        class: { archivedAt: null },
      },
      select: { subject: true, class: { select: { name: true } } },
    });
    if (clash) {
      return {
        ok: false,
        errorKey: "timetable.teacherClash",
        errorVars: { class: clash.class.name, subject: clash.subject },
      };
    }
    /**
     * SELF-HEAL FOR ROWS ARCHIVED BEFORE RELEASING EXISTED. A class archived
     * under the old code still holds its teachers, and the database unique on
     * (school, weekday, period, teacher) would refuse the row below with a
     * crash the clash filter above no longer predicts. Freeing the dead
     * class's claim here — exactly where it is contested, one row at a time —
     * fixes deployed data without a migration.
     */
    await db.timetableSlot.updateMany({
      where: {
        schoolId: ctx.schoolId,
        weekday: input.weekday,
        periodId: input.periodId,
        teacherMembershipId,
        class: { archivedAt: { not: null } },
      },
      data: { teacherMembershipId: null },
    });
  }

  const slot = await db.timetableSlot.upsert({
    where: {
      classId_weekday_periodId: {
        classId: input.classId,
        weekday: input.weekday,
        periodId: input.periodId,
      },
    },
    create: {
      schoolId: ctx.schoolId,
      classId: input.classId,
      periodId: input.periodId,
      weekday: input.weekday,
      subject,
      teacherMembershipId,
      room: input.room?.trim().slice(0, ROOM_MAX) || null,
    },
    update: {
      subject,
      teacherMembershipId,
      room: input.room?.trim().slice(0, ROOM_MAX) || null,
    },
    select: { id: true },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.slot.set",
    targetType: "Class",
    targetId: input.classId,
    meta: { weekday: input.weekday, periodId: input.periodId, subject, teacherMembershipId },
  });

  return { ok: true, id: slot.id };
}

/** Empties a cell. */
export async function clearSlot(
  ctx: ActiveContext,
  classId: string,
  weekday: number,
  periodId: string,
): Promise<Result> {
  assertAdmin(ctx);
  const result = await db.timetableSlot.deleteMany({
    where: { schoolId: ctx.schoolId, classId, weekday, periodId },
  });
  if (result.count === 0) return { ok: false, errorKey: "timetable.noLessonThere" };

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.slot.clear",
    targetType: "Class",
    targetId: classId,
    meta: { weekday, periodId },
  });
  return { ok: true };
}

/**
 * Copies one day's lessons onto another day.
 *
 * The single most repetitive thing about building a timetable by hand, and the
 * reason a "tool" is different from a form. OVERWRITES the target day — a copy
 * that merged would leave yesterday's lessons interleaved with today's and no
 * way to tell which was meant. Slots whose teacher is already busy on the target
 * day are copied WITHOUT the teacher rather than skipped: the lesson is what the
 * admin asked for, and an unstaffed cell is visible and fixable where a missing
 * one is not.
 */
export async function copyDay(
  ctx: ActiveContext,
  classId: string,
  fromWeekday: number,
  toWeekday: number,
): Promise<Result & { copied?: number; unstaffed?: number }> {
  assertAdmin(ctx);
  if (fromWeekday === toWeekday) return { ok: false, errorKey: "timetable.sameDay" };
  const week = await schoolWeek(ctx.schoolId);
  if (!week.includes(fromWeekday) || !week.includes(toWeekday)) {
    return { ok: false, errorKey: "timetable.mondayToSaturday" };
  }

  const klass = await db.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId, archivedAt: null },
    select: { id: true },
  });
  if (!klass) return { ok: false, errorKey: "timetable.classNotHere" };

  const source = await db.timetableSlot.findMany({
    where: { schoolId: ctx.schoolId, classId, weekday: fromWeekday },
    select: { periodId: true, subject: true, teacherMembershipId: true, room: true },
  });
  if (source.length === 0) return { ok: false, errorKey: "timetable.nothingToCopy" };

  // ONE TRANSACTION FOR THE BUSY READ, THE DELETE AND THE CREATES (TA-284). Statement by statement, a create that
  // failed half-way (a teacher another admin placed at that time after the busy read, the unique on school,
  // weekday, period and teacher refusing it) left the class's day deleted and partly written; now the day is
  // either copied whole or left as it was, and the refusal reaches the action as before.
  const schoolId = ctx.schoolId;
  const { copied, unstaffed } = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // Everyone already teaching somebody else at these times on the target day.
    const busy = await tx.timetableSlot.findMany({
      where: {
        schoolId,
        weekday: toWeekday,
        classId: { not: classId },
        teacherMembershipId: { not: null },
      },
      select: { periodId: true, teacherMembershipId: true },
    });
    const busyAt = new Set(busy.map((row) => `${row.periodId}:${row.teacherMembershipId}`));

    await tx.timetableSlot.deleteMany({
      where: { schoolId, classId, weekday: toWeekday },
    });

    let copied = 0;
    let unstaffed = 0;
    for (const row of source) {
      const free =
        row.teacherMembershipId && !busyAt.has(`${row.periodId}:${row.teacherMembershipId}`);
      if (row.teacherMembershipId && !free) unstaffed++;
      await tx.timetableSlot.create({
        data: {
          schoolId,
          classId,
          periodId: row.periodId,
          weekday: toWeekday,
          subject: row.subject,
          teacherMembershipId: free ? row.teacherMembershipId : null,
          room: row.room,
        },
        select: { id: true },
      });
      copied++;
    }
    return { copied, unstaffed };
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "timetable.day.copy",
    targetType: "Class",
    targetId: classId,
    meta: { fromWeekday, toWeekday, copied, unstaffed },
  });

  return { ok: true, copied, unstaffed };
}

/* -------------------------------------------------------------------------- */
/* Who is free                                                                 */
/* -------------------------------------------------------------------------- */

export type TeacherOption = {
  membershipId: string;
  name: string;
  /** Null when they are free at this time. */
  busyWith: string | null;
};

/**
 * Every member of teaching staff, and what each is doing at this time.
 *
 * SHOWS THE BUSY ONES RATHER THAN HIDING THEM. A picker that silently omits
 * three names leaves an admin wondering whether Mrs Rao has left the school; one
 * that says "Class 6B — Science" answers the question they were about to ask and
 * tells them what would have to move. The busy entries are not selectable, which
 * is the same information the double-booking refusal carries, delivered before
 * the mistake instead of after it.
 */
export async function teacherAvailability(
  ctx: ActiveContext,
  weekday: number,
  periodId: string,
  opts: { forClassId?: string } = {},
): Promise<TeacherOption[]> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanSeeWhoIs");
  }

  const [staff, taken] = await Promise.all([
    db.membership.findMany({
      where: {
        schoolId: ctx.schoolId,
        role: { in: ["TEACHER", "PRINCIPAL"] },
        status: "ACTIVE",
        leftAt: null,
      },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      take: 500,
    }),
    db.timetableSlot.findMany({
      where: {
        schoolId: ctx.schoolId,
        weekday,
        periodId,
        teacherMembershipId: { not: null },
        // The lesson being edited does not count as a clash with itself.
        ...(opts.forClassId ? { classId: { not: opts.forClassId } } : {}),
      },
      select: {
        teacherMembershipId: true,
        subject: true,
        class: { select: { name: true } },
      },
    }),
  ]);

  const busy = new Map(
    taken.map((row) => [row.teacherMembershipId!, `${row.class.name} — ${row.subject}`]),
  );

  return staff
    .map((row) => ({
      membershipId: row.id,
      name: row.user.preferredName ?? row.user.name,
      busyWith: busy.get(row.id) ?? null,
    }))
    .sort((a, b) => {
      // Free first — the list exists to answer "who can take this".
      if ((a.busyWith === null) !== (b.busyWith === null)) return a.busyWith === null ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Everyone who is already teaching, at every time of the week, EXCEPT in one
 * class. Keyed `weekday:periodId` → membershipId → what they are doing.
 *
 * ONE QUERY FOR THE WHOLE BUILDER. `teacherAvailability` answers the question
 * for a single cell, which is right for a form and wrong for a grid: an admin
 * clicking around forty cells would fire forty round trips, each one a pause
 * before the list of names appears. The grid is edited as a whole, so the
 * answer is computed for the whole grid once and the picker reads it locally.
 *
 * Bounded by the school's own size — one row per staffed lesson in the school,
 * which for twenty classes over a six-day week is under a thousand small rows.
 */
export async function schoolBusyMap(
  ctx: ActiveContext,
  exceptClassId: string | null,
): Promise<Record<string, Record<string, string>>> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanSeeWhoIs");
  }
  const rows = await db.timetableSlot.findMany({
    where: {
      schoolId: ctx.schoolId,
      teacherMembershipId: { not: null },
      ...(exceptClassId ? { classId: { not: exceptClassId } } : {}),
    },
    select: {
      weekday: true,
      periodId: true,
      teacherMembershipId: true,
      subject: true,
      class: { select: { name: true } },
    },
    take: 5000,
  });

  const busy: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    const key = `${row.weekday}:${row.periodId}`;
    busy[key] ??= {};
    busy[key]![row.teacherMembershipId!] = `${row.class.name} — ${row.subject}`;
  }
  return busy;
}

/**
 * How many lessons a week each teacher is carrying.
 *
 * The other half of "assign based on availability": free at 11:15 on Tuesday is
 * a different question from carrying a fair share of the week, and an admin
 * building a timetable is answering both. Counts LESSONS, not hours — periods
 * differ in length and a school talks in periods.
 */
export async function teachingLoad(ctx: ActiveContext): Promise<Map<string, number>> {
  if (!ctx.schoolId) return new Map();
  const rows = await db.timetableSlot.groupBy({
    by: ["teacherMembershipId"],
    where: { schoolId: ctx.schoolId, teacherMembershipId: { not: null } },
    _count: { _all: true },
  });
  const load = new Map<string, number>();
  for (const row of rows) {
    if (row.teacherMembershipId) load.set(row.teacherMembershipId, row._count._all);
  }
  return load;
}

/* -------------------------------------------------------------------------- */
/* Reading a week                                                              */
/* -------------------------------------------------------------------------- */

/** The Monday on or before `dateKey`. */
export function weekStartKey(dateKey: string): string {
  if (!isDateKey(dateKey)) throw new AccessError("access.thatIsNotADate");
  const weekday = weekdayOfKey(dateKey);
  // 0 is Sunday, which belongs to the week that has just finished — a pupil
  // opening this on Sunday evening wants tomorrow, not six days ago.
  const backTo = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToKey(dateKey, backTo);
}

/**
 * The school's teaching week as weekday numbers, Monday first. `WEEK_DAYS`
 * in school-day.ts is the default a school starts with; this is the one the
 * office has set, and every grid, check and column below reads it.
 */
export async function schoolWeek(schoolId: string | null | undefined): Promise<number[]> {
  if (!schoolId) return [...WEEK_DAYS];
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { teachingDays: true } });
  return parseTeachingDays(school?.teachingDays);
}

/**
 * The date key each weekday column falls on, for a week starting Monday. A
 * Sunday, when the school teaches on one, is the last column: six days on
 * from the Monday, not the day before it.
 */
function dayKeysFrom(mondayKey: string, week: readonly number[]): Map<number, string> {
  const keys = new Map<number, string>();
  for (const weekday of week) {
    keys.set(weekday, addDaysToKey(mondayKey, (weekday + 6) % 7));
  }
  return keys;
}

type RawSlot = {
  id: string;
  classId: string;
  periodId: string;
  weekday: number;
  subject: string;
  room: string | null;
  teacherMembershipId: string | null;
  class: { name: string };
  teacher: { user: { name: string; preferredName: string | null } } | null;
};

const SLOT_SELECT = {
  id: true,
  classId: true,
  periodId: true,
  weekday: true,
  subject: true,
  room: true,
  teacherMembershipId: true,
  class: { select: { name: true } },
  teacher: { select: { user: { select: { name: true, preferredName: true } } } },
} as const;

/**
 * Applies real dates to a template, and with them leave, cover and holidays.
 *
 * THE RULE, in one place so it cannot be spelled differently on two pages:
 *
 *   - the assigned teacher is on APPROVED leave on that date, and a cover was
 *     arranged for that class → the covering teacher is shown, in their place;
 *   - on leave, and no cover → `uncovered`, said loudly. A class with nobody in
 *     front of it is the one thing this feature exists to make visible;
 *   - otherwise the assigned teacher, unchanged.
 *
 * THE BOARD'S ANSWER COMES FIRST. A `Substitution` names who takes THIS
 * lesson on THIS day, and the office wrote it against the board's own view of
 * who is away — the register's ABSENT as well as approved leave. Where one
 * exists it is the covering teacher, whatever the register-duty cover says;
 * `AttendanceCover` is per class and per range, and answers only the lessons
 * the board has not.
 *
 * THE COVER IS MATCHED TO THE ABSENCE WHERE IT CAN BE. `AttendanceCover` carries
 * `leaveRequestId` when approving leave created it, so the replacement for THIS
 * absence is preferred over any other cover that happens to overlap the class
 * that week. Cover arranged by hand, with no leave behind it, is still used —
 * it just cannot be attributed, so it is the fallback rather than the first
 * answer.
 */
async function resolveWeek(
  schoolId: string,
  slots: RawSlot[],
  dayKeys: Map<number, string>,
  opts: { borrowedIds?: Set<string> } = {},
): Promise<SlotView[]> {
  const dates = [...dayKeys.values()].sort();
  const from = dates[0]!;
  const to = dates[dates.length - 1]!;

  const teacherIds = [
    ...new Set(slots.map((s) => s.teacherMembershipId).filter((id): id is string => Boolean(id))),
  ];
  const classIds = [...new Set(slots.map((s) => s.classId))];
  const slotIds = slots.map((s) => s.id);

  const [leave, covers, substitutions] = await Promise.all([
    teacherIds.length === 0
      ? Promise.resolve([])
      : db.leaveRequest.findMany({
          where: {
            schoolId,
            status: "APPROVED",
            teacherMembershipId: { in: teacherIds },
            fromDateKey: { lte: to },
            toDateKey: { gte: from },
          },
          select: { id: true, teacherMembershipId: true, fromDateKey: true, toDateKey: true },
        }),
    db.attendanceCover.findMany({
      where: {
        schoolId,
        classId: { in: classIds },
        fromDateKey: { lte: to },
        toDateKey: { gte: from },
      },
      select: {
        classId: true,
        coveringMembershipId: true,
        fromDateKey: true,
        toDateKey: true,
        leaveRequestId: true,
        covering: { select: { user: { select: { name: true, preferredName: true } } } },
      },
    }),
    slotIds.length === 0
      ? Promise.resolve([])
      : db.substitution.findMany({
          where: { schoolId, slotId: { in: slotIds }, dateKey: { in: dates } },
          select: {
            slotId: true,
            dateKey: true,
            absentMembershipId: true,
            substituteMembershipId: true,
            declinedAt: true,
            substitute: { select: { user: { select: { name: true, preferredName: true } } } },
          },
        }),
  ]);
  /* A SUBSTITUTION STANDS ONLY WHILE ITS REASON DOES (TA-282), as the board and myCovers read it: not once the
   * substitute declined, not once the absent teacher is in after all by the staff register (PRESENT, LATE or
   * HALF_DAY, the register being authoritative in both directions), and not once the slot has another teacher. */
  const absentIds = [...new Set(substitutions.map((row) => row.absentMembershipId))];
  const cameIn = new Set(
    absentIds.length === 0
      ? []
      : (
          await db.staffAttendance.findMany({
            where: { schoolId, membershipId: { in: absentIds }, dateKey: { in: dates }, status: { in: ["PRESENT", "LATE", "HALF_DAY"] } },
            select: { membershipId: true, dateKey: true },
          })
        ).map((row) => `${row.membershipId}|${row.dateKey}`),
  );
  const substitutionFor = new Map(
    substitutions
      .filter((row) => !row.declinedAt && !cameIn.has(`${row.absentMembershipId}|${row.dateKey}`))
      .map((row) => [`${row.slotId}|${row.dateKey}`, row]),
  );

  return slots.map((slot) => {
    const dateKey = dayKeys.get(slot.weekday) ?? null;
    const teacherName = slot.teacher
      ? (slot.teacher.user.preferredName ?? slot.teacher.user.name)
      : null;

    const base: SlotView = {
      id: slot.id,
      classId: slot.classId,
      className: slot.class.name,
      periodId: slot.periodId,
      weekday: slot.weekday,
      subject: slot.subject,
      room: slot.room,
      teacherMembershipId: slot.teacherMembershipId,
      teacherName,
      coveringMembershipId: null,
      coveringName: null,
      uncovered: false,
      borrowed: opts.borrowedIds?.has(slot.id) ?? false,
    };

    if (!dateKey || !slot.teacherMembershipId) return base;

    const substitution = substitutionFor.get(`${slot.id}|${dateKey}`);
    if (substitution && substitution.absentMembershipId === slot.teacherMembershipId) {
      return {
        ...base,
        coveringMembershipId: substitution.substituteMembershipId,
        coveringName: substitution.substitute.user.preferredName ?? substitution.substitute.user.name,
      };
    }

    const absence = leave.find(
      (row) =>
        row.teacherMembershipId === slot.teacherMembershipId &&
        row.fromDateKey <= dateKey &&
        row.toDateKey >= dateKey,
    );
    if (!absence) return base;

    const applicable = covers.filter(
      (row) => row.classId === slot.classId && row.fromDateKey <= dateKey && row.toDateKey >= dateKey,
    );
    const cover =
      applicable.find((row) => row.leaveRequestId === absence.id) ?? applicable[0] ?? null;

    if (!cover) return { ...base, uncovered: true };

    return {
      ...base,
      coveringMembershipId: cover.coveringMembershipId,
      coveringName: cover.covering.user.preferredName ?? cover.covering.user.name,
    };
  });
}

/** The day columns, with the holidays marked. */
async function buildDays(
  schoolId: string,
  dayKeys: Map<number, string> | null,
  todayDateKey: string | null,
  week: readonly number[],
): Promise<DayColumn[]> {
  if (!dayKeys) {
    return week.map((weekday) => ({
      weekday,
      dateKey: null,
      closed: false,
      closedName: null,
      isToday: false,
    }));
  }

  const window = [...dayKeys.values()].sort();
  const entries = await listHolidays(schoolId, {
    fromKey: window[0],
    toKey: window[window.length - 1],
  });
  const closed = closedDayKeys(entries);
  // A name for the banner, so "closed" is not an unexplained grey column.
  const nameFor = (dateKey: string): string | null => {
    const hit = entries.find(
      (entry) => entry.startDateKey <= dateKey && entry.endDateKey >= dateKey && entry.kind === "HOLIDAY",
    );
    return hit?.name ?? null;
  };

  return week.map((weekday) => {
    const dateKey = dayKeys.get(weekday) ?? null;
    return {
      weekday,
      dateKey,
      closed: dateKey ? closed.has(dateKey) : false,
      closedName: dateKey ? nameFor(dateKey) : null,
      isToday: dateKey !== null && dateKey === todayDateKey,
    };
  });
}

/**
 * One class's week.
 *
 * `weekOf` null gives the bare TEMPLATE — no dates, no cover, no holidays —
 * which is what the builder edits. A date key gives the resolved week, which is
 * what everybody else reads.
 */
export async function classWeek(
  ctx: ActiveContext,
  classId: string,
  opts: { weekOf?: string | null; todayKey?: string | null } = {},
): Promise<WeekGrid> {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  if (ctx.role === "STUDENT" || ctx.role === "TEACHER") {
    // A pupil and a teacher read their OWN week through the functions below.
    // Letting them name a class here would hand a pupil every class's timetable,
    // which is not a secret but is not theirs to browse either.
    throw new AccessError("access.onlyStaffCanLookUpAClass");
  }

  const klass = await db.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    select: { id: true },
  });
  if (!klass) throw new AccessError("access.thatClassIsNotInThisSchool", "NOT_FOUND");

  const week = await schoolWeek(ctx.schoolId);
  const dayKeys = opts.weekOf ? dayKeysFrom(weekStartKey(opts.weekOf), week) : null;

  const [periods, rows, days] = await Promise.all([
    listPeriods(ctx.schoolId),
    db.timetableSlot.findMany({
      // Dated, a retired period's lessons are none of that week's (TA-283); the template keeps them.
      where: { schoolId: ctx.schoolId, classId, ...(dayKeys ? { period: { archivedAt: null } } : {}) },
      select: SLOT_SELECT,
    }),
    buildDays(ctx.schoolId, dayKeys, opts.todayKey ?? null, week),
  ]);

  const slots = dayKeys
    ? await resolveWeek(ctx.schoolId, rows, dayKeys)
    : rows.map(bareView);

  return { periods, days, slots };
}

/** The template view — used where there are no dates to resolve against. */
function bareView(slot: RawSlot): SlotView {
  return {
    id: slot.id,
    classId: slot.classId,
    className: slot.class.name,
    periodId: slot.periodId,
    weekday: slot.weekday,
    subject: slot.subject,
    room: slot.room,
    teacherMembershipId: slot.teacherMembershipId,
    teacherName: slot.teacher
      ? (slot.teacher.user.preferredName ?? slot.teacher.user.name)
      : null,
    coveringMembershipId: null,
    coveringName: null,
    uncovered: false,
    borrowed: false,
  };
}

/**
 * A teacher's own week — including the lessons they are covering.
 *
 * THE BORROWED HALF IS THE POINT. Cover has always told the person covering that
 * they are marking a register; it never told them WHEN, or what the lesson is.
 * Here, a lesson whose assigned teacher is away and whose cover is you appears
 * in your week, at the right time, marked as somebody else's. Without it, the
 * replacement showing up on the timetable would only be true from the outside —
 * visible to the class and invisible to the person who has to be in the room.
 */
export async function teacherWeek(
  ctx: ActiveContext,
  teacherMembershipId: string,
  opts: { weekOf: string; todayKey?: string | null },
): Promise<WeekGrid> {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");

  const week = await schoolWeek(ctx.schoolId);
  const dayKeys = dayKeysFrom(weekStartKey(opts.weekOf), week);
  const dates = [...dayKeys.values()].sort();
  const from = dates[0]!;
  const to = dates[dates.length - 1]!;

  const [periods, own, covers] = await Promise.all([
    listPeriods(ctx.schoolId),
    db.timetableSlot.findMany({
      // A dated week: a lesson left in a retired period is no lesson of it (TA-283).
      where: { schoolId: ctx.schoolId, teacherMembershipId, period: { archivedAt: null } },
      select: SLOT_SELECT,
    }),
    db.attendanceCover.findMany({
      where: {
        schoolId: ctx.schoolId,
        coveringMembershipId: teacherMembershipId,
        fromDateKey: { lte: to },
        toDateKey: { gte: from },
      },
      select: { classId: true, fromDateKey: true, toDateKey: true },
    }),
  ]);

  const borrowed: RawSlot[] = [];
  if (covers.length > 0) {
    // Only the days this cover actually applies to. A Monday-to-Wednesday cover
    // must not put Friday's lesson in somebody's week.
    const coveredDays = new Map<string, Set<number>>();
    for (const cover of covers) {
      for (const [weekday, dateKey] of dayKeys) {
        if (cover.fromDateKey <= dateKey && cover.toDateKey >= dateKey) {
          const set = coveredDays.get(cover.classId) ?? new Set<number>();
          set.add(weekday);
          coveredDays.set(cover.classId, set);
        }
      }
    }

    const candidates = await db.timetableSlot.findMany({
      where: {
        schoolId: ctx.schoolId,
        classId: { in: [...coveredDays.keys()] },
        teacherMembershipId: { not: null },
        period: { archivedAt: null },
      },
      select: SLOT_SELECT,
    });

    const ownIds = new Set(own.map((row) => row.id));
    for (const slot of candidates) {
      if (ownIds.has(slot.id)) continue;
      if (!coveredDays.get(slot.classId)?.has(slot.weekday)) continue;
      borrowed.push(slot);
    }
  }

  const combined = [...own, ...borrowed];
  const borrowedIds = new Set(borrowed.map((row) => row.id));
  const resolved = await resolveWeek(ctx.schoolId, combined, dayKeys, { borrowedIds });

  // A borrowed lesson only belongs in this week if the cover is ACTUALLY in
  // force — that is, the assigned teacher turned out to be on leave. A cover
  // arranged for an absence that was later cancelled leaves the row behind, and
  // resolveWeek is the one place that knows the difference.
  const kept = resolved.filter(
    (slot) => !slot.borrowed || slot.coveringMembershipId === teacherMembershipId,
  );

  const days = await buildDays(ctx.schoolId, dayKeys, opts.todayKey ?? null, week);
  return { periods, days, slots: kept };
}

/**
 * One pupil's week, merged across every class they are enrolled in.
 *
 * TAKES A SCHOOL ID RATHER THAN A CONTEXT, so that the two callers can each
 * establish their own right to be here. A pupil's own claim comes from the
 * school on their session; a guardian's comes from an ACTIVE Guardianship and
 * from nothing else — a parent's session has no school at all. Passing a
 * context in would have meant one of the two synthesising a fake one, which is
 * how an authorisation check quietly becomes a formality.
 */
async function weekForStudent(
  schoolId: string,
  studentMembershipId: string,
  opts: { weekOf: string; todayKey?: string | null },
): Promise<WeekGrid> {
  const week = await schoolWeek(schoolId);
  const dayKeys = dayKeysFrom(weekStartKey(opts.weekOf), week);

  const enrolments = await db.enrollment.findMany({
    where: { schoolId, studentMembershipId, status: "ACTIVE" },
    select: { classId: true },
  });
  const classIds = enrolments.map((row) => row.classId);

  const [periods, rows, days] = await Promise.all([
    listPeriods(schoolId),
    classIds.length === 0
      ? Promise.resolve([] as RawSlot[])
      : db.timetableSlot.findMany({
          where: { schoolId, classId: { in: classIds }, period: { archivedAt: null } },
          select: SLOT_SELECT,
        }),
    buildDays(schoolId, dayKeys, opts.todayKey ?? null, week),
  ]);

  const slots = await resolveWeek(schoolId, rows, dayKeys);
  return { periods, days, slots };
}

/** A pupil's own week. */
export async function studentWeek(
  ctx: ActiveContext,
  studentMembershipId: string,
  opts: { weekOf: string; todayKey?: string | null },
): Promise<WeekGrid> {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  return weekForStudent(ctx.schoolId, studentMembershipId, opts);
}

/**
 * A guardian reading their child's week.
 *
 * THE GUARDIANSHIP IS THE AUTHORISATION, and it is re-read here rather than
 * trusted from the page — the same rule every other id arriving from a request
 * follows. A parent holds no membership and no school, so there is no tenant on
 * their session to check the child against; the link row IS the check, and the
 * school comes out of it rather than going into it.
 *
 * WHAT A PARENT GETS is exactly what their child gets: the same resolved week,
 * cover and closures included. Not more — there is no class picker here, so a
 * guardian cannot read the timetable of a class their child is not in.
 *
 * The database agrees separately: a parent's request is bound to their
 * children's schools and to no others (see resolveRequestTenant), so a forged
 * membership id from a school they have no child at returns nothing at all.
 */
export async function childWeek(
  ctx: ActiveContext,
  studentMembershipId: string,
  opts: { weekOf: string; todayKey?: string | null },
): Promise<WeekGrid> {
  const link = await db.guardianship.findFirst({
    where: {
      parentUserId: ctx.user.id,
      studentMembershipId,
      status: "ACTIVE",
    },
    select: { student: { select: { schoolId: true } } },
  });
  if (!link) throw new AccessError("access.notYourChild", "NOT_FOUND");

  return weekForStudent(link.student.schoolId, studentMembershipId, opts);
}

/** Classes an admin or principal can pick from, for the class picker. */
export async function timetableClasses(ctx: ActiveContext) {
  if (!ctx.schoolId) return [];
  if (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") {
    throw new AccessError("access.onlyStaffCanListClassTimetables");
  }
  const rows = await db.class.findMany({
    where: { schoolId: ctx.schoolId, archivedAt: null },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    select: { id: true, name: true, gradeLevel: true, section: true, room: true },
    take: 300,
  });
  return rows;
}

/* -------------------------------------------------------------------------- */
/* Bulk: a pasted sheet, and a section's week copied to its sisters            */
/* -------------------------------------------------------------------------- */

/**
 * THE SHEET. A school that already has a timetable has it in a spreadsheet,
 * one row per lesson: day, period, class, subject, teacher, room. Pasted
 * here it is previewed first — every row resolved against the school's own
 * periods, classes and staff, every cell that cannot be resolved named with
 * its line — and written only when the office says so, in one transaction,
 * each cell upserted on (class, day, period) so the same sheet twice leaves
 * the same grid.
 *
 * WHAT STOPS A ROW and what does not. A day, period or class the school
 * does not have, a break, a blank subject: the row is not written, because
 * there is nowhere to put it. A teacher who is not on staff, two of the
 * same name, or one already teaching another class then: the LESSON is
 * written and the teacher left blank, exactly as the day-copy tool does —
 * an unstaffed cell is visible and fixable where a missing one is not — and
 * the preview says so against the line.
 */

export type TimetableImportProblem = { line: number; value: string; reasonKey: TranslationKey; reasonVars?: Record<string, string | number> };
export type TimetableImportRow = {
  line: number;
  weekday: number;
  periodId: string;
  periodName: string;
  classId: string;
  className: string;
  subject: string;
  room: string | null;
  teacherMembershipId: string | null;
  teacherName: string | null;
  teacherIssueKey: TranslationKey | null;
  teacherIssueVars?: Record<string, string | number>;
  /** A lesson is already in that cell; the sheet's replaces it. */
  replaces: boolean;
};
export type TimetableImportPreview = {
  rows: TimetableImportRow[];
  problems: TimetableImportProblem[];
  recognised: { day: boolean; period: boolean; className: boolean; subject: boolean; teacher: boolean; room: boolean };
};

const IMPORT_MAX_ROWS = 3000;
const DAY_WORDS: Record<string, number> = {
  sun: 0, sunday: 0, "रवि": 0, "रविवार": 0,
  mon: 1, monday: 1, "सोम": 1, "सोमवार": 1,
  tue: 2, tues: 2, tuesday: 2, "मंगल": 2, "मंगलवार": 2, "मंगळ": 2, "मंगळवार": 2,
  wed: 3, wednesday: 3, "बुध": 3, "बुधवार": 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, "गुरु": 4, "गुरुवार": 4,
  fri: 5, friday: 5, "शुक्र": 5, "शुक्रवार": 5,
  sat: 6, saturday: 6, "शनि": 6, "शनिवार": 6,
};

function pickColumn(headers: string[], ...patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const hit = headers.find((h) => pattern.test(h));
    if (hit) return hit;
  }
  return null;
}

const fold = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** "Monday", "Mon", "1", "सोमवार" → the weekday number; null when it is none of those. */
export function parseWeekdayWord(raw: string): number | null {
  const text = fold(raw);
  if (text === "") return null;
  if (/^[0-6]$/.test(text)) return Number(text);
  if (text in DAY_WORDS) return DAY_WORDS[text]!;
  const head = text.replace(/[^a-zऀ-ॿ]/g, "");
  return head in DAY_WORDS ? DAY_WORDS[head]! : null;
}

/**
 * Resolves the sheet against the school. Pure of writes; the commit calls it
 * and then writes what it returns.
 */
export async function previewTimetableImport(ctx: ActiveContext, csv: string): Promise<TimetableImportPreview> {
  assertAdmin(ctx);
  const parsed = parseCsv(csv.slice(0, 500_000));
  const headers = parsed.headers;
  const dayCol = pickColumn(headers, /^(week)?day$/, /day/);
  const periodCol = pickColumn(headers, /^period/, /period|slot|hour/);
  const classCol = pickColumn(headers, /^class$/, /class|section|division/);
  const subjectCol = pickColumn(headers, /^subject$/, /subject|lesson/);
  const teacherCol = pickColumn(headers, /^teacher$/, /teacher|staff|email/);
  const roomCol = pickColumn(headers, /^room$/, /room|venue/);
  const recognised = { day: Boolean(dayCol), period: Boolean(periodCol), className: Boolean(classCol), subject: Boolean(subjectCol), teacher: Boolean(teacherCol), room: Boolean(roomCol) };
  const problems: TimetableImportProblem[] = [];
  if (!dayCol || !periodCol || !classCol || !subjectCol) {
    problems.push({ line: 1, value: headers.join(", "), reasonKey: "officeBulk.timetableNeedColumns" });
    return { rows: [], problems, recognised };
  }

  const [week, periods, classes, staff, existing] = await Promise.all([
    schoolWeek(ctx.schoolId),
    db.timetablePeriod.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, orderBy: [{ position: "asc" }, { startMinute: "asc" }], select: { id: true, name: true, kind: true } }),
    db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { id: true, name: true, section: true } }),
    db.membership.findMany({
      where: { schoolId: ctx.schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null },
      select: { id: true, user: { select: { name: true, preferredName: true, email: true } } },
      take: 1000,
    }),
    db.timetableSlot.findMany({ where: { schoolId: ctx.schoolId, class: { archivedAt: null } }, select: { classId: true, weekday: true, periodId: true, teacherMembershipId: true, class: { select: { name: true } } } }),
  ]);
  const lessonPeriods = periods.filter((p) => p.kind === "LESSON");
  const periodByName = new Map(periods.map((p) => [fold(p.name), p]));
  const classByName = new Map<string, { id: string; name: string }>();
  for (const k of classes) {
    classByName.set(fold(k.name), k);
    if (k.section) classByName.set(fold(`${k.name} ${k.section}`), k);
  }
  const staffByEmail = new Map<string, { id: string; name: string }>();
  const staffByName = new Map<string, { id: string; name: string }[]>();
  for (const m of staff) {
    const name = m.user.preferredName ?? m.user.name;
    if (m.user.email) staffByEmail.set(fold(m.user.email), { id: m.id, name });
    for (const n of new Set([fold(m.user.name), fold(m.user.preferredName ?? "")])) {
      if (!n) continue;
      staffByName.set(n, [...(staffByName.get(n) ?? []), { id: m.id, name }]);
    }
  }
  const cellOf = (classId: string, weekday: number, periodId: string) => `${classId}:${weekday}:${periodId}`;
  const existingCells = new Set(existing.map((e) => cellOf(e.classId, e.weekday, e.periodId)));
  /** `weekday:periodId:teacher` → the class they already teach then, for the clash check. */
  const busy = new Map<string, { classId: string; className: string }>();
  for (const e of existing) if (e.teacherMembershipId) busy.set(`${e.weekday}:${e.periodId}:${e.teacherMembershipId}`, { classId: e.classId, className: e.class.name });

  const rows: TimetableImportRow[] = [];
  const seenCell = new Map<string, number>();
  const claimedInSheet = new Map<string, string>();
  parsed.rows.slice(0, IMPORT_MAX_ROWS).forEach((cells, index) => {
    const line = parsed.lineNumbers[index] ?? index + 2;
    const dayText = cells[dayCol] ?? "";
    const periodText = cells[periodCol] ?? "";
    const classText = cells[classCol] ?? "";
    const subject = (cells[subjectCol] ?? "").trim().slice(0, SUBJECT_MAX);
    const teacherText = teacherCol ? (cells[teacherCol] ?? "").trim() : "";
    const room = roomCol ? (cells[roomCol] ?? "").trim().slice(0, ROOM_MAX) || null : null;
    const label = [dayText, periodText, classText, subject].filter(Boolean).join(" · ");

    const weekday = parseWeekdayWord(dayText);
    if (weekday === null) return void problems.push({ line, value: label, reasonKey: "officeBulk.timetableUnknownDay", reasonVars: { day: dayText } });
    if (!week.includes(weekday)) return void problems.push({ line, value: label, reasonKey: "timetable.mondayToSaturday" });

    const periodKey = fold(periodText);
    let period = periodByName.get(periodKey) ?? null;
    if (!period && /^\d{1,2}$/.test(periodKey)) period = lessonPeriods[Number(periodKey) - 1] ?? null;
    if (!period) return void problems.push({ line, value: label, reasonKey: "officeBulk.timetableUnknownPeriod", reasonVars: { period: periodText } });
    if (period.kind === "BREAK") return void problems.push({ line, value: label, reasonKey: "timetable.isABreak", reasonVars: { name: period.name } });

    const klass = classByName.get(fold(classText)) ?? null;
    if (!klass) return void problems.push({ line, value: label, reasonKey: "officeBulk.timetableUnknownClass", reasonVars: { class: classText } });
    if (subject.length < 1) return void problems.push({ line, value: label, reasonKey: "timetable.saySubject" });

    const cell = cellOf(klass.id, weekday, period.id);
    const earlier = seenCell.get(cell);
    if (earlier !== undefined) return void problems.push({ line, value: label, reasonKey: "officeBulk.timetableCellTwice", reasonVars: { line: earlier } });
    seenCell.set(cell, line);

    let teacherMembershipId: string | null = null;
    let teacherName: string | null = null;
    let teacherIssueKey: TranslationKey | null = null;
    let teacherIssueVars: Record<string, string | number> | undefined;
    if (teacherText) {
      const byEmail = staffByEmail.get(fold(teacherText));
      const byName = byEmail ? [byEmail] : (staffByName.get(fold(teacherText)) ?? []);
      if (byName.length === 0) teacherIssueKey = "timetable.notTeachingStaff";
      else if (byName.length > 1) {
        teacherIssueKey = "officeBulk.timetableTeacherAmbiguous";
        teacherIssueVars = { teacher: teacherText };
      } else {
        const found = byName[0]!;
        const at = `${weekday}:${period.id}:${found.id}`;
        const elsewhere = busy.get(at);
        const inSheet = claimedInSheet.get(at);
        if (elsewhere && elsewhere.classId !== klass.id) {
          teacherIssueKey = "timetable.teacherClash";
          teacherIssueVars = { class: elsewhere.className, subject };
        } else if (inSheet && inSheet !== klass.id) {
          teacherIssueKey = "officeBulk.timetableTeacherClashInSheet";
          teacherIssueVars = { teacher: found.name };
        } else {
          teacherMembershipId = found.id;
          teacherName = found.name;
          claimedInSheet.set(at, klass.id);
        }
      }
    }
    rows.push({ line, weekday, periodId: period.id, periodName: period.name, classId: klass.id, className: klass.name, subject, room, teacherMembershipId, teacherName, teacherIssueKey, ...(teacherIssueVars ? { teacherIssueVars } : {}), replaces: existingCells.has(cell) });
  });
  if (parsed.rows.length > IMPORT_MAX_ROWS) problems.push({ line: IMPORT_MAX_ROWS + 2, value: "", reasonKey: "officeBulk.timetableTooManyRows", reasonVars: { max: IMPORT_MAX_ROWS } });
  return { rows, problems, recognised };
}

export type TimetableImportResult = { written: number; replaced: number; unstaffed: number; classes: number; problems: TimetableImportProblem[] };

/**
 * Writes the sheet: the preview run again (the office may have changed a
 * class name since it looked) and every resolved row upserted in one tenant
 * transaction. A row with a teacher problem is written without the teacher.
 * Idempotent: the same sheet twice upserts the same cells.
 */
export async function commitTimetableImport(ctx: ActiveContext, csv: string): Promise<TimetableImportResult> {
  assertAdmin(ctx);
  const preview = await previewTimetableImport(ctx, csv);
  const schoolId = ctx.schoolId;
  if (preview.rows.length > 0) {
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      // A class archived before releasing its teachers would make the unique on (school, weekday, period, teacher) refuse a row below; free its claims first, as setSlot does.
      const teachers = [...new Set(preview.rows.map((r) => r.teacherMembershipId).filter((id): id is string => Boolean(id)))];
      if (teachers.length > 0) await tx.timetableSlot.updateMany({ where: { schoolId, teacherMembershipId: { in: teachers }, class: { archivedAt: { not: null } } }, data: { teacherMembershipId: null } });
      for (const row of preview.rows) {
        await tx.timetableSlot.upsert({
          where: { classId_weekday_periodId: { classId: row.classId, weekday: row.weekday, periodId: row.periodId } },
          create: { schoolId, classId: row.classId, periodId: row.periodId, weekday: row.weekday, subject: row.subject, teacherMembershipId: row.teacherMembershipId, room: row.room },
          update: { subject: row.subject, teacherMembershipId: row.teacherMembershipId, room: row.room },
          select: { id: true },
        });
      }
    });
  }
  const result: TimetableImportResult = {
    written: preview.rows.length,
    replaced: preview.rows.filter((r) => r.replaces).length,
    unstaffed: preview.rows.filter((r) => !r.teacherMembershipId).length,
    classes: new Set(preview.rows.map((r) => r.classId)).size,
    problems: preview.problems,
  };
  await audit({ schoolId, actorUserId: ctx.user.id, action: "timetable.import", targetType: "School", targetId: schoolId, meta: { written: result.written, replaced: result.replaced, unstaffed: result.unstaffed, classes: result.classes, problems: result.problems.length } });
  return result;
}

export type TimetableCopyResult = { copied: number; unstaffed: number; classes: { classId: string; className: string; copied: number }[] };

/**
 * Copies one section's whole week onto its sister sections — 5A's grid
 * onto 5B and 5C, the single most repetitive thing about a school of many
 * sections. The subjects and periods are what the sisters share; the
 * TEACHER never is, because 5A's maths teacher is in 5A at that very
 * period, so every copied lesson is written without one, for the office to
 * fill from the free list. Rooms are the source's and are not copied either.
 * OVERWRITES each target's week, as the day copy does and for its reason.
 */
export async function copyWeekToSections(ctx: ActiveContext, fromClassId: string, toClassIds: string[]): Promise<Result & TimetableCopyResult> {
  assertAdmin(ctx);
  const schoolId = ctx.schoolId;
  const targets = [...new Set(toClassIds)].filter((id) => id !== fromClassId).slice(0, 40);
  if (targets.length === 0) return { ok: false, errorKey: "officeBulk.copyNeedSections", copied: 0, unstaffed: 0, classes: [] };
  const [source, sisters, slots] = await Promise.all([
    db.class.findFirst({ where: { id: fromClassId, schoolId, archivedAt: null }, select: { id: true, name: true } }),
    db.class.findMany({ where: { id: { in: targets }, schoolId, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.timetableSlot.findMany({ where: { schoolId, classId: fromClassId }, select: { periodId: true, weekday: true, subject: true } }),
  ]);
  if (!source) return { ok: false, errorKey: "timetable.classNotHere", copied: 0, unstaffed: 0, classes: [] };
  if (sisters.length !== targets.length) return { ok: false, errorKey: "timetable.classNotHere", copied: 0, unstaffed: 0, classes: [] };
  if (slots.length === 0) return { ok: false, errorKey: "timetable.nothingToCopy", copied: 0, unstaffed: 0, classes: [] };

  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.timetableSlot.deleteMany({ where: { schoolId, classId: { in: sisters.map((k) => k.id) } } });
    await tx.timetableSlot.createMany({
      data: sisters.flatMap((k) => slots.map((s) => ({ schoolId, classId: k.id, periodId: s.periodId, weekday: s.weekday, subject: s.subject, teacherMembershipId: null, room: null }))),
    });
  });
  const classes = sisters.map((k) => ({ classId: k.id, className: k.name, copied: slots.length }));
  const copied = slots.length * sisters.length;
  await audit({ schoolId, actorUserId: ctx.user.id, action: "timetable.sections.copy", targetType: "Class", targetId: fromClassId, meta: { from: source.name, to: sisters.map((k) => k.name), copied } });
  return { ok: true, copied, unstaffed: copied, classes };
}
