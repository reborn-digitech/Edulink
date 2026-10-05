import "server-only";
import type { TranslationKey } from "./i18n/dictionary";
import { db } from "./db";
import { publish, channel } from "./realtime";
import { notifyGuardians } from "./notify";
import { audit } from "./audit";
import { noticeDate } from "./notice-dates";
import { schoolDayOn } from "./holidays";
import { absenceNotesOn } from "./absence-notes";
import type { AttendanceStatus } from "./constants";

/** Per-status notification titles — one key each, so "was marked late"
 * reaches a Hindi parent as a sentence, not an English word in a Hindi one. */
const ATTENDANCE_NOTIF_KEY: Record<AttendanceStatus, TranslationKey> = {
  PRESENT: "notifTitle.markedPresent",
  LATE: "notifTitle.markedLate",
  ABSENT: "notifTitle.markedAbsent",
  EXCUSED: "notifTitle.markedExcused",
};


/**
 * Attendance write path.
 *
 * The hard requirement is idempotency. A batch marked offline can be replayed
 * by Background Sync after a partial delivery, on an unreliable connection, or
 * twice by two tabs. None of those may double-write, and none may resurrect an
 * older value over a newer one.
 *
 * Two mechanisms, together:
 *   * `clientId` — a UUID minted on the device per mark. A replay carrying a
 *     clientId already stored on that row is a no-op.
 *   * `markedAt` — the device's clock at the moment of the tap. A late-arriving
 *     replay of an OLDER mark loses to the newer stored one, so reconnecting
 *     after a correction cannot undo the correction.
 */

export type MarkInput = {
  studentMembershipId: string;
  status: AttendanceStatus;
  note?: string;
  clientId: string;
  markedAt?: string;
};

export type MergeResult = {
  applied: number;
  skipped: number;
  rejected: { studentMembershipId: string; reason: string }[];
  /** Null when nothing in the batch could be stored — no register exists for a save of nothing. */
  sessionId: string | null;
};

/** The slice of the transaction client the register uses; the same idiom as `TenantTx` in membership.ts. */
type RegisterTx = {
  enrollment: { findMany(args: unknown): Promise<{ studentMembershipId: string }[]> };
  attendanceSession: { upsert(args: unknown): Promise<{ id: string }> };
  attendanceRecord: {
    findMany(args: unknown): Promise<{ id: string; studentMembershipId: string; status: string; clientId: string | null; markedAt: Date }[]>;
    upsert(args: unknown): Promise<unknown>;
  };
};

export async function saveAttendanceBatch(opts: {
  schoolId: string;
  classId: string;
  dateKey: string;
  marks: MarkInput[];
  /**
   * Who took the register. Null for an attendance device's punch (R-2, 5 Oct
   * 2026; attendance-devices.ts): a device starts the day's register without
   * becoming its taker, never replaces the person who took it, and a register
   * only a device has written is still due from its teacher (`registersDue`).
   */
  takenByMembershipId: string | null;
  /** The person whose act this is; null for a device, audited as the device's. */
  actorUserId: string | null;
  /** Guardians are told about absences, but not about a replayed no-op. */
  notify?: boolean;
}): Promise<MergeResult> {
  const { schoolId, classId, dateKey, marks, takenByMembershipId, actorUserId } = opts;

  /**
   * ONE TRANSACTION FOR THE WHOLE REGISTER. Each call on `db` sets the
   * tenant and runs in a transaction of its own — four round-trips before
   * the statement, and a wait for a pooled connection every time. Written as
   * fifty separate upserts, a fifty-pupil register was fifty of those, and
   * under a fleet's parent traffic each one queued behind the pool: the
   * load test measured 12 s per register at thirty teachers, 64 s at fifty.
   * Inside `$tenantTransaction` the tenant is set once and the marks ride one
   * connection; the notifications and the live-update publish stay outside,
   * after the commit, so a guardian is never told about a mark that rolled
   * back. Nothing about which marks apply changes: the replay and stale-mark
   * rules below are the same, only now they run on `tx`.
   */
  const { rejected, session, applied, skipped, newlyAbsent, appliedClientIds } = await db.$tenantTransaction(async (raw: unknown) => {
    const tx = raw as RegisterTx;

    // Only students actually enrolled in THIS class, in THIS school, may be
    // marked. Anything else in the payload is rejected rather than silently
    // dropped, so a bug upstream is visible instead of quietly losing a child.
    const enrolled = await tx.enrollment.findMany({
      where: {
        classId,
        status: "ACTIVE",
        class: { schoolId },
        studentMembershipId: { in: marks.map((m) => m.studentMembershipId) },
      },
      select: { studentMembershipId: true },
    });
    const allowed = new Set(enrolled.map((e) => e.studentMembershipId));

    const rejected: MergeResult["rejected"] = [];
    const valid = marks.filter((mark) => {
      if (allowed.has(mark.studentMembershipId)) return true;
      rejected.push({
        studentMembershipId: mark.studentMembershipId,
        reason: "Not enrolled in this class",
      });
      return false;
    });

    // NOTHING VALID, NO SESSION. The session row is what every "was the
    // register taken" reader counts, so a batch of only rejected marks — or an
    // empty one — must not leave one behind: the audit found eighteen registers
    // "taken" that held no marks at all. The rejections are still reported.
    if (valid.length === 0) {
      return { rejected, session: null, applied: 0, skipped: 0, newlyAbsent: [], appliedClientIds: [] };
    }

    // The session row is the unit that makes (class, date) unique. upsert rather
    // than create so two teachers opening the register at once do not collide.
    const session = await tx.attendanceSession.upsert({
      where: { classId_dateKey: { classId, dateKey } },
      create: { schoolId, classId, dateKey, takenByMembershipId },
      update: takenByMembershipId ? { takenByMembershipId, takenAt: new Date() } : {},
    });

    const existing = await tx.attendanceRecord.findMany({
      where: { sessionId: session.id, studentMembershipId: { in: valid.map((m) => m.studentMembershipId) } },
      select: {
        id: true,
        studentMembershipId: true,
        status: true,
        clientId: true,
        markedAt: true,
      },
    });
    const byStudent = new Map(existing.map((row) => [row.studentMembershipId, row]));

    let applied = 0;
    let skipped = 0;
    const newlyAbsent: { studentMembershipId: string; status: AttendanceStatus }[] = [];
    // Handed to the live event so the register that sent them knows the save was its own.
    const appliedClientIds: string[] = [];

    for (const mark of valid) {
      const previous = byStudent.get(mark.studentMembershipId);
      const parsedAt = mark.markedAt ? new Date(mark.markedAt) : null;
      // A device that sends garbage for its clock is not a reason to refuse
      // the mark, and an Invalid Date would have thrown from the upsert.
      const markedAt = parsedAt && !Number.isNaN(parsedAt.getTime()) ? parsedAt : new Date();

      if (previous) {
        // Exact replay of a mark we already stored.
        if (previous.clientId && previous.clientId === mark.clientId) {
          skipped++;
          continue;
        }
        // A stale replay must not overwrite a newer correction. Equal timestamps
        // fall through and apply, so a same-millisecond retry still converges.
        if (previous.markedAt.getTime() > markedAt.getTime()) {
          skipped++;
          continue;
        }
      }

      await tx.attendanceRecord.upsert({
        where: {
          sessionId_studentMembershipId: {
            sessionId: session.id,
            studentMembershipId: mark.studentMembershipId,
          },
        },
        create: {
          sessionId: session.id,
          schoolId,
          studentMembershipId: mark.studentMembershipId,
          status: mark.status,
          note: mark.note?.trim() || null,
          clientId: mark.clientId,
          markedAt,
        },
        update: {
          status: mark.status,
          note: mark.note?.trim() || null,
          clientId: mark.clientId,
          markedAt,
        },
      });

      applied++;
      appliedClientIds.push(mark.clientId);

      // Told on every change INTO an absence: present → late, and also late →
      // absent, which used to slip through as "already not present".
      const becameNotPresent = mark.status !== "PRESENT";
      const changed = !previous || previous.status !== mark.status;
      if (becameNotPresent && changed) {
        newlyAbsent.push({ studentMembershipId: mark.studentMembershipId, status: mark.status });
      }
    }

    return { rejected, session, applied, skipped, newlyAbsent, appliedClientIds };
  });

  if (applied > 0 && session) {
    publish([channel.class(classId), channel.school(schoolId)], {
      type: "attendance.updated",
      classId,
      dateKey,
      clientIds: appliedClientIds,
    });

    await audit({
      schoolId,
      actorUserId,
      action: "attendance.mark",
      targetType: "AttendanceSession",
      targetId: session.id,
      meta: { dateKey, applied, skipped, rejected: rejected.length },
    });
  }

  // Guardians hear about a change TO an absence, never about a re-save of one
  // they were already told about — otherwise a flaky connection spams parents.
  // And never about a day the family told the school about first: a pupil
  // with an absence note for the day (absence-notes.ts) is skipped.
  if (opts.notify !== false && newlyAbsent.length > 0) {
    const told = await absenceNotesOn(schoolId, newlyAbsent.map((n) => n.studentMembershipId), dateKey);
    // The date said in each guardian's language, here and on their notifications page later (B-15, 5 Oct 2026).
    const pretty = noticeDate(dateKey, "long");
    /**
     * Rendered in the GUARDIAN's language by `notify` (it reads the
     * recipient's prefs, not the teacher's), and the key is kept on the row
     * so the notifications page can say it again if they change language.
     */
    await Promise.all(
      newlyAbsent.filter(({ studentMembershipId }) => !told.has(studentMembershipId)).map(({ studentMembershipId, status }) =>
        notifyGuardians(studentMembershipId, (childName) => ({
          kind: "ATTENDANCE",
          schoolId,
          titleKey: ATTENDANCE_NOTIF_KEY[status] ?? "notifTitle.markedAbsent",
          titleVars: { name: childName },
          bodyKey: "notifBody.attendanceTap",
          bodyVars: { date: pretty },
          url: "/parent/attendance",
          meta: { dateKey, status },
        })),
      ),
    );
  }

  return { applied, skipped, rejected, sessionId: session?.id ?? null };
}

/**
 * The registers a school expects today, and which of them are still to take.
 *
 * Three things the plain "sessions today vs classes" subtraction got wrong,
 * each of which the audit saw on a real school:
 *   * a CLOSED DAY — a non-teaching weekday per School.teachingDays, or a
 *     closing holiday on the calendar — expects no register at all, so nothing
 *     is missing and nobody is chased for it;
 *   * a class with NO ACTIVE ENROLMENT has nobody to mark, so it is not
 *     expected either — a freshly made class or an emptied one is not a
 *     register the principal can still take;
 *   * a teacher's own list is only the classes they MAY take, per
 *     ClassTeacher.canTakeAttendance, which the caller narrows with `classIds`.
 *
 * `taken` counts the sessions actually stored for the expected classes; on a
 * closed day it is whatever was taken out of habit, and `expected` is empty.
 */
export async function registersDue(
  schoolId: string,
  dateKey: string,
  opts: { classIds?: string[] } = {},
): Promise<{ open: boolean; holidayName: string | null; expected: string[]; taken: string[]; missing: string[] }> {
  const { open, holidayName } = await schoolDayOn(schoolId, dateKey);

  const classes = await db.class.findMany({
    where: {
      schoolId,
      archivedAt: null,
      enrollments: { some: { status: "ACTIVE" } },
      ...(opts.classIds ? { id: { in: opts.classIds } } : {}),
    },
    select: { id: true },
    orderBy: { name: "asc" },
  });
  const expected = open ? classes.map((c) => c.id) : [];
  if (expected.length === 0) return { open, holidayName, expected, taken: [], missing: [] };

  // Taken by a person: a register an attendance device started (no taker) is still due (R-2, 5 Oct 2026).
  const sessions = await db.attendanceSession.findMany({
    where: { schoolId, dateKey, classId: { in: expected }, takenByMembershipId: { not: null } },
    select: { classId: true },
  });
  const taken = new Set(sessions.map((s) => s.classId));

  return {
    open,
    holidayName,
    expected,
    taken: [...taken],
    missing: expected.filter((id) => !taken.has(id)),
  };
}

/**
 * One pupil's mark today, for the pupil's and the family's homes, with
 * whether there is school today at all.
 *
 * Without the second half, a Sunday or a holiday read as "not marked yet"
 * — a register the family was told to expect that nobody was ever going to
 * take (B-11). A mark taken on a closed day out of habit is still shown:
 * it exists, and hiding it would be the opposite lie.
 */
export async function todayAttendanceFor(
  schoolId: string,
  studentMembershipId: string,
  dateKey: string,
): Promise<{ open: boolean; holidayName: string | null; record: { status: string; note: string | null } | null }> {
  const [day, record] = await Promise.all([
    schoolDayOn(schoolId, dateKey),
    db.attendanceRecord.findFirst({
      where: { schoolId, studentMembershipId, session: { dateKey } },
      select: { status: true, note: true },
    }),
  ]);
  return { ...day, record };
}

/** Roster plus any marks already recorded for the day, and the family's absence note for the day beside each pupil who filed one. */
export async function getRegister(schoolId: string, classId: string, dateKey: string) {
  const [klass, enrollments, session] = await Promise.all([
    db.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true, name: true, subject: true, color: true },
    }),
    db.enrollment.findMany({
      where: { classId, status: "ACTIVE", class: { schoolId } },
      include: {
        student: {
          include: { user: { select: { name: true, preferredName: true, avatarKey: true } } },
        },
      },
    }),
    db.attendanceSession.findUnique({
      where: { classId_dateKey: { classId, dateKey } },
      include: { records: true },
    }),
  ]);

  if (!klass) return null;

  const marks = new Map(session?.records.map((r) => [r.studentMembershipId, r]) ?? []);
  const notes = await absenceNotesOn(schoolId, enrollments.map((e) => e.studentMembershipId), dateKey);

  const roster = enrollments
    .map((enrollment) => {
      const record = marks.get(enrollment.studentMembershipId);
      return {
        membershipId: enrollment.studentMembershipId,
        name: enrollment.student.user.preferredName ?? enrollment.student.user.name,
        fullName: enrollment.student.user.name,
        avatarKey: enrollment.student.user.avatarKey,
        status: (record?.status as AttendanceStatus | undefined) ?? null,
        note: record?.note ?? null,
        absenceNote: notes.get(enrollment.studentMembershipId) ?? null,
      };
    })
    // Sorted by the name actually shown, using locale rules so accented names
    // land where a teacher expects them rather than after Z.
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return {
    class: klass,
    dateKey,
    roster,
    finalizedAt: session?.finalizedAt ?? null,
    takenAt: session?.takenAt ?? null,
  };
}

/** Per-student attendance summary over a range, for parent and admin views. */
export async function getAttendanceSummary(
  schoolId: string,
  studentMembershipId: string,
  fromKey: string,
  toKey: string,
) {
  const records = await db.attendanceRecord.findMany({
    where: {
      schoolId,
      studentMembershipId,
      session: { dateKey: { gte: fromKey, lte: toKey } },
    },
    include: { session: { select: { dateKey: true } } },
    orderBy: { markedAt: "desc" },
  });

  const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
  for (const record of records) {
    counts[record.status as AttendanceStatus]++;
  }

  const total = records.length;
  // "Attended" counts late arrivals: a child who was there deserves to be
  // counted as there, and a parent reading 91% wants that to mean days present.
  const attended = counts.PRESENT + counts.LATE;

  return {
    counts,
    total,
    // Integer percent — no float drift in a number families will compare.
    percent: total === 0 ? null : Math.round((attended * 100) / total),
    recent: records.slice(0, 30).map((r) => ({
      dateKey: r.session.dateKey,
      status: r.status as AttendanceStatus,
      note: r.note,
    })),
    // The whole window, uncapped. `recent` is a display list and is deliberately
    // trimmed; asking "was there ever a five-day run" over a trimmed list would
    // quietly answer a different question near the edge of the window.
    days: records.map((r) => ({
      dateKey: r.session.dateKey,
      status: r.status as AttendanceStatus,
    })),
  };
}

/**
 * The run the child is on now, read from every mark back to the first day
 * not attended. The home pages used to hand `computeStreak` the summary's
 * `recent` list — thirty marks of a four-week window — so a run longer than
 * that read as 30, or as 28 school days, whichever the window cut first. This
 * walks the marks newest first and stops at the break, however far back it is.
 */
export async function currentStreakFor(schoolId: string, studentMembershipId: string, todayKey: string): Promise<number> {
  const records = await db.attendanceRecord.findMany({
    where: { schoolId, studentMembershipId, session: { dateKey: { lte: todayKey } } },
    select: { status: true, session: { select: { dateKey: true } } },
    orderBy: { session: { dateKey: "desc" } },
  });
  return computeStreak(records.map((r) => ({ dateKey: r.session.dateKey, status: r.status as AttendanceStatus })), todayKey);
}

/** How long a run stays "current" after its last mark: a week covers a weekend and a short holiday, not a term. */
const STREAK_STALE_AFTER_DAYS = 7;

/**
 * Consecutive school days present, ending today. Powers the student streak.
 * With `todayKey` given, a run whose last mark is more than a week old is
 * over — the parent's overview once said "No records yet" for the month
 * beside "56 school days in a row" from a term that had ended.
 */
export function computeStreak(
  recent: { dateKey: string; status: AttendanceStatus }[],
  todayKey?: string,
): number {
  const sorted = [...recent].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  if (todayKey && sorted[0] && (Date.parse(todayKey) - Date.parse(sorted[0].dateKey)) / 86_400_000 > STREAK_STALE_AFTER_DAYS) return 0;
  let streak = 0;
  for (const day of sorted) {
    if (day.status === "PRESENT" || day.status === "LATE") streak++;
    else break;
  }
  return streak;
}

function attended(status: AttendanceStatus): boolean {
  return status === "PRESENT" || status === "LATE";
}

/**
 * The longest run of days present anywhere in the window.
 *
 * `computeStreak` answers "are you on a run right now", which is the honest
 * number for a teacher and the wrong one for a child's badge: it drops to zero
 * the morning after a day off sick. This answers "did you ever have a run",
 * which is a fact about what happened and does not stop being true because the
 * child later caught a cold.
 */
export function computeBestStreak(
  days: { dateKey: string; status: AttendanceStatus }[],
): number {
  const sorted = [...days].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  let best = 0;
  let run = 0;
  for (const day of sorted) {
    run = attended(day.status) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/**
 * The best attendance percentage over any unbroken stretch of at least
 * `minDays` school days in the window.
 *
 * Same reasoning as above, for a percentage rather than a run. Taking the whole
 * window means one bad fortnight erases a term of turning up; taking the best
 * stretch means the good spell still counts.
 *
 * `minDays` exists because a percentage over one or two days is not a fact about
 * anything — a single day present is "100% attendance" and would hand out the
 * badge on a child's first morning. Returns null when there is not enough
 * history to judge, which the caller must treat as "not yet", not as zero.
 */
export function bestAttendanceSpell(
  days: { dateKey: string; status: AttendanceStatus }[],
  minDays: number,
): number | null {
  const sorted = [...days].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (sorted.length < minDays) return null;

  let best = 0;
  for (let start = 0; start + minDays <= sorted.length; start++) {
    let present = 0;
    for (let end = start; end < sorted.length; end++) {
      if (attended(sorted[end]!.status)) present++;
      const length = end - start + 1;
      if (length < minDays) continue;
      // Integer percent, same rounding as the summary families compare against.
      const percent = Math.round((present * 100) / length);
      if (percent > best) best = percent;
    }
  }
  return best;
}

/**
 * Attendance over the MOST RECENT `minDays` school days.
 *
 * The counterpart to `bestAttendanceSpell`, and it exists because the school
 * asked for the opposite policy: a badge should say how things stand, not how
 * they once stood. Where the "best spell" version let a clean month keep its
 * badge through a fortnight of illness, this one takes the badge away — and the
 * academic year is what makes that fair, because whatever a child holds when the
 * year closes is archived and kept for good.
 *
 * `minDays` still matters for the same reason: a percentage over one or two days
 * is not a fact about anything, and a single day present would hand out a 100%
 * badge on a child's first morning. Null means "not enough history to say",
 * which a caller must treat as "not yet" rather than as zero.
 */
export function currentAttendanceRate(
  days: { dateKey: string; status: AttendanceStatus }[],
  minDays: number,
): number | null {
  const sorted = [...days].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (sorted.length < minDays) return null;

  const recent = sorted.slice(-minDays);
  const present = recent.filter((day) => attended(day.status)).length;
  return Math.round((present * 100) / recent.length);
}
