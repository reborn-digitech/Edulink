import "server-only";
import { db } from "./db";
import { publish, channel } from "./realtime";
import { notifyGuardians } from "./notify";
import { audit } from "./audit";
import { formatDateKey } from "./dates";
import { ATTENDANCE_META, type AttendanceStatus } from "./constants";

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
  sessionId: string;
};

export async function saveAttendanceBatch(opts: {
  schoolId: string;
  classId: string;
  dateKey: string;
  marks: MarkInput[];
  takenByMembershipId: string;
  actorUserId: string;
  /** Guardians are told about absences, but not about a replayed no-op. */
  notify?: boolean;
}): Promise<MergeResult> {
  const { schoolId, classId, dateKey, marks, takenByMembershipId, actorUserId } = opts;

  // Only students actually enrolled in THIS class, in THIS school, may be
  // marked. Anything else in the payload is rejected rather than silently
  // dropped, so a bug upstream is visible instead of quietly losing a child.
  const enrolled = await db.enrollment.findMany({
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

  // The session row is the unit that makes (class, date) unique. upsert rather
  // than create so two teachers opening the register at once do not collide.
  const session = await db.attendanceSession.upsert({
    where: { classId_dateKey: { classId, dateKey } },
    create: { schoolId, classId, dateKey, takenByMembershipId },
    update: { takenByMembershipId, takenAt: new Date() },
  });

  const existing = await db.attendanceRecord.findMany({
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

  for (const mark of valid) {
    const previous = byStudent.get(mark.studentMembershipId);
    const markedAt = mark.markedAt ? new Date(mark.markedAt) : new Date();

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

    await db.attendanceRecord.upsert({
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

    const becameNotPresent = mark.status !== "PRESENT";
    const wasPresent = !previous || previous.status === "PRESENT";
    if (becameNotPresent && wasPresent) {
      newlyAbsent.push({ studentMembershipId: mark.studentMembershipId, status: mark.status });
    }
  }

  if (applied > 0) {
    publish([channel.class(classId), channel.school(schoolId)], {
      type: "attendance.updated",
      classId,
      dateKey,
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
  if (opts.notify !== false) {
    const pretty = formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" });
    await Promise.all(
      newlyAbsent.map(({ studentMembershipId, status }) =>
        notifyGuardians(studentMembershipId, (childName) => ({
          kind: "ATTENDANCE",
          schoolId,
          title: `${childName} was marked ${ATTENDANCE_META[status].label.toLowerCase()}`,
          body: `${pretty}. Tap to see the details or message the teacher.`,
          url: "/parent/attendance",
          meta: { dateKey, status },
        })),
      ),
    );
  }

  return { applied, skipped, rejected, sessionId: session.id };
}

/** Roster plus any marks already recorded for the day. */
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

/** Consecutive school days present, ending today. Powers the student streak. */
export function computeStreak(
  recent: { dateKey: string; status: AttendanceStatus }[],
): number {
  const sorted = [...recent].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
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
