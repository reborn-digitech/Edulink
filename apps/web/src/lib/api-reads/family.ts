import "server-only";
import { db } from "@/lib/db";
import { AccessError, assertAssignmentAccess, assertGuardianAccess } from "@/lib/tenancy";
import { getSession, listContexts, DEFAULT_PREFS, type ActiveContext, type UserPrefs } from "@/lib/session";
import { getAttendanceSummary, computeStreak } from "@/lib/attendance";
import { examMarksFor, dateSheetsFor } from "@/lib/exams";
import { studentWeek, childWeek, weekStartKey, type WeekGrid } from "@/lib/timetable";
import { ownWorkScope, getStudentWork, childWork, overallForStudent } from "@/lib/grading";
import { myCards, cardsForChild, getCard } from "@/lib/report-cards";
import { pendingReviews, submitReview } from "@/lib/reviews";
import { openSlotsFor, myBookings } from "@/lib/meetings";
import { pendingConsents } from "@/lib/competitions";
import { listDirectory, directoryPlaces } from "@/lib/school-profile";
import { currentTerms } from "@/lib/terms";
import { getBadges } from "@/lib/badges";
import { myRecords } from "@/lib/school-record";
import { mayEditOwnBirthdate, setOwnBirthdate } from "@/lib/birthdate";
import { listTopics, normaliseLanguage } from "@/lib/quiz";
import {
  enrolledGradeLevel,
  continueCard,
  weeklyPracticeCount,
  WEEKLY_GOAL,
  revisionQueue,
  assignmentsForStudent,
  childPracticeProgress,
} from "@/lib/practice-insights";
import { MONTH_KEY, shiftMonth } from "@/lib/attendance-history";
import { addDaysToKey, isDateKey, isTeachingDay, isWithin, todayKey, weekdayOfKey } from "@/lib/dates";
import { readJson, writeJson } from "@/lib/json";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { publish, channel } from "@/lib/realtime";
import { AVATAR_PRESETS } from "@/components/ui/avatar";
import type { AttendanceStatus } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The reads behind /api/v1/family — the pupil's and the guardian's pages,
 * each reproduced from its page.tsx with the SAME access checks, so the JSON
 * says what the page says and refuses whom the page refuses.
 *
 * WHERE THE PAGE CALLS A LIBRARY FUNCTION, so does this file. Where the page
 * ran its own queries inline (the two overviews, the profile, the exams tab
 * logic), those queries are here under a name, unchanged. The guardian's
 * child is re-checked through `assertGuardianAccess` on every read that takes
 * one, exactly as the pages do — a `childId` in the query string is a claim.
 */

/* -------------------------------------------------------------------------- */
/* Gates                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The route-handler shape of `requireParent`: a signed-in PARENT session with
 * at least one ACTIVE guardianship. The page redirects a childless parent to
 * /parent/link; an API answers 403 and lets the app decide where to send them.
 */
export async function requireApiParent(): Promise<ActiveContext & { role: "PARENT" }> {
  const session = await getSession();
  if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
  if (session.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const hasChild = await db.guardianship.findFirst({
    where: { parentUserId: session.user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!hasChild) throw new AccessError("access.notAllowed");
  return session as ActiveContext & { role: "PARENT" };
}

/** A pupil or a guardian; anybody else is refused, the way the shared pages refuse them. */
export async function requireApiReader(): Promise<ActiveContext & { role: "STUDENT" | "PARENT" }> {
  const session = await getSession();
  if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
  if (session.role === "PARENT") return requireApiParent() as Promise<ActiveContext & { role: "PARENT" }>;
  if (session.role !== "STUDENT") throw new AccessError("access.wrongRoleForThisAction");
  if (!session.schoolId || !session.membershipId) throw new AccessError("access.noActiveSchoolSelected");
  return session as ActiveContext & { role: "STUDENT" };
}

export type FamilyChildRow = Awaited<ReturnType<typeof listContexts>>["children"][number];

/**
 * Which child a guardian page is about. The pages fall back to the first
 * child when the requested one is not theirs; an API says so instead — an id
 * that is not this parent's child is 404, never a hint that it exists.
 */
export async function selectChild(ctx: ActiveContext, childId?: string | null) {
  const { children } = await listContexts(ctx.user.id);
  const selectedId = childId ?? children[0]?.studentMembershipId;
  if (!selectedId) throw new AccessError("access.notAllowed");
  const link = await assertGuardianAccess(ctx.user.id, selectedId);
  return { children, selectedId, link };
}

export function childHeader(selectedId: string, link: Awaited<ReturnType<typeof assertGuardianAccess>>) {
  const student = link.student;
  return {
    studentMembershipId: selectedId,
    studentUserId: student.user.id,
    name: student.user.preferredName ?? student.user.name,
    avatarKey: student.user.avatarKey,
    schoolId: student.school.id,
    schoolName: student.school.name,
    gradeLevel: student.gradeLevel,
    leftAt: student.leftAt?.toISOString() ?? null,
  };
}

export function childRows(children: FamilyChildRow[]) {
  return children.map((c) => ({ ...c, leftAt: c.leftAt?.toISOString() ?? null }));
}

/* -------------------------------------------------------------------------- */
/* Pieces the overviews share                                                  */
/* -------------------------------------------------------------------------- */

/** The day's lessons in period order — the card both dashboards carry. */
function lessonsOn(week: WeekGrid, today: string) {
  const weekday = weekdayOfKey(today);
  const dayColumn = week.days.find((day) => day.weekday === weekday);
  const closedToday = dayColumn?.closed ?? false;
  const periodOrder = new Map(week.periods.map((period) => [period.id, period]));
  const lessons = closedToday
    ? []
    : week.slots
        .filter((slot) => slot.weekday === weekday)
        .sort((a, b) => (periodOrder.get(a.periodId)?.position ?? 0) - (periodOrder.get(b.periodId)?.position ?? 0));
  return {
    closedToday,
    closedName: dayColumn?.closedName ?? null,
    lessonsToday: lessons.map((slot) => {
      const period = periodOrder.get(slot.periodId);
      return {
        id: slot.id,
        periodId: slot.periodId,
        periodName: period?.name ?? null,
        startMinute: period?.startMinute ?? null,
        endMinute: period?.endMinute ?? null,
        subject: slot.subject,
        room: slot.room,
        teacherMembershipId: slot.teacherMembershipId,
        teacherName: slot.teacherName,
        coveringMembershipId: slot.coveringMembershipId,
        coveringName: slot.coveringName,
        uncovered: slot.uncovered,
      };
    }),
  };
}

/**
 * The same "to do" rule as the Assignments page: published homework not
 * handed in and not marked, exam sittings excluded, undated ones last.
 */
async function dueSoonFor(schoolId: string, studentMembershipId: string, take: number) {
  const rows = await db.assignment.findMany({
    where: {
      schoolId,
      publishedAt: { not: null },
      examSlotId: null,
      submissions: { none: { studentMembershipId, submittedAt: { not: null } } },
      grades: { none: { studentMembershipId } },
      ...(await ownWorkScope(schoolId, studentMembershipId)),
    },
    select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
    take,
  });
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    className: a.class.name,
    dueAt: a.dueAt?.toISOString() ?? null,
    dueSoon: Boolean(a.dueAt && isWithin(a.dueAt, 2 * 86_400_000)),
  }));
}

function summaryOut(summary: Awaited<ReturnType<typeof getAttendanceSummary>>) {
  return { counts: summary.counts, total: summary.total, percent: summary.percent, recent: summary.recent };
}

function weekOut(grid: WeekGrid) {
  return {
    periods: grid.periods.map((p) => ({ id: p.id, name: p.name, startMinute: p.startMinute, endMinute: p.endMinute, kind: p.kind, position: p.position })),
    days: grid.days,
    slots: grid.slots,
  };
}

/* -------------------------------------------------------------------------- */
/* STUDENT                                                                     */
/* -------------------------------------------------------------------------- */

type StudentCtx = ActiveContext & { role: "STUDENT"; schoolId: string; membershipId: string };

/** /student — the pupil's Today page. */
export async function studentOverview(ctx: StudentCtx) {
  const membership = await db.membership.findUniqueOrThrow({
    where: { id: ctx.membershipId },
    include: {
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      school: { select: { name: true, timezone: true } },
      enrollments: { where: { status: "ACTIVE" }, include: { class: { select: { name: true } } } },
    },
  });
  const today = todayKey(membership.school.timezone);
  const [attendance, todayRecord, upcoming, examMarks, week] = await Promise.all([
    getAttendanceSummary(ctx.schoolId, ctx.membershipId, addDaysToKey(today, -28), today),
    db.attendanceRecord.findFirst({
      where: { studentMembershipId: ctx.membershipId, session: { dateKey: today } },
      select: { status: true },
    }),
    dueSoonFor(ctx.schoolId, ctx.membershipId, 5),
    examMarksFor(ctx),
    studentWeek(ctx, ctx.membershipId, { weekOf: today, todayKey: today }),
  ]);
  return {
    name: membership.user.preferredName ?? membership.user.name,
    avatarKey: membership.user.avatarKey,
    today,
    className: membership.enrollments[0]?.class.name ?? null,
    todayStatus: (todayRecord?.status as AttendanceStatus | undefined) ?? null,
    streak: computeStreak(attendance.recent),
    attendance: summaryOut(attendance),
    ...lessonsOn(week, today),
    upcoming,
    examMarks,
  };
}

/** /student/assignments — the three tabs, from the one rule in getStudentWork. */
export async function studentAssignments(ctx: StudentCtx) {
  const { todo, handedIn, marked } = await getStudentWork(ctx);
  const out = (item: (typeof todo)[number]) => ({
    ...item,
    dueAt: item.dueAt?.toISOString() ?? null,
    submittedAt: item.submittedAt?.toISOString() ?? null,
  });
  return { todo: todo.map(out), handedIn: handedIn.map(out), marked: marked.map(out) };
}

/**
 * Hands a piece of work in — the submit action of /student/work, with its
 * refusals as errors rather than form messages. `assertAssignmentAccess` with
 * a STUDENT role admits only published work in classes the pupil is enrolled
 * in, so a copied id from another class or school is 404. Re-submitting
 * replaces the body until the teacher has marked it; after that it is refused,
 * because a new body would silently orphan the mark.
 */
export async function submitStudentWork(ctx: StudentCtx, assignmentId: string, body: string): Promise<{ submittedAt: Date }> {
  let assignment;
  try {
    assignment = await assertAssignmentAccess(ctx, assignmentId);
  } catch (error) {
    if (error instanceof AccessError) throw new AccessError("student.workNotAvailable", "NOT_FOUND");
    throw error;
  }

  const existingGrade = await db.grade.findUnique({
    where: { assignmentId_studentMembershipId: { assignmentId, studentMembershipId: ctx.membershipId } },
    select: { id: true },
  });
  if (existingGrade) throw new AccessError("student.alreadyMarked");

  const submittedAt = new Date();
  const submission = await db.submission.upsert({
    where: { assignmentId_studentMembershipId: { assignmentId, studentMembershipId: ctx.membershipId } },
    create: { schoolId: ctx.schoolId, assignmentId, studentMembershipId: ctx.membershipId, body, status: "SUBMITTED", submittedAt },
    update: { body, status: "SUBMITTED", submittedAt },
  });

  // Tell the author of the assignment, not every teacher at the school.
  const [author, student] = await Promise.all([
    db.membership.findUnique({ where: { id: assignment.authorMembershipId }, select: { userId: true } }),
    db.membership.findUniqueOrThrow({ where: { id: ctx.membershipId }, select: { user: { select: { name: true, preferredName: true } } } }),
  ]);
  if (author) {
    await notify({
      userId: author.userId,
      schoolId: ctx.schoolId,
      kind: "ASSIGNMENT",
      titleKey: "notifTitle.handedWorkIn",
      titleVars: { name: student.user.preferredName ?? student.user.name },
      body: assignment.title,
      url: `/teacher/assignments/${assignmentId}`,
    });
  }
  publish([channel.class(assignment.classId), channel.school(ctx.schoolId)], {
    type: "assignment.published",
    classId: assignment.classId,
    assignmentId,
  });
  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "submission.create",
    targetType: "Submission",
    targetId: submission.id,
    meta: { assignmentId, late: Boolean(assignment.dueAt && submittedAt > assignment.dueAt), api: true },
  });
  return { submittedAt };
}

/** /student/profile — how the pupil looks, and what the practising and competing added up to. */
export async function studentProfile(ctx: StudentCtx) {
  const membership = await db.membership.findUniqueOrThrow({
    where: { id: ctx.membershipId },
    include: {
      user: { select: { name: true, preferredName: true, bio: true, avatarKey: true, email: true, birthdate: true } },
      school: { select: { name: true, timezone: true } },
      enrollments: { where: { status: "ACTIVE" }, include: { class: { select: { name: true } } } },
    },
  });
  const [previous, badges, birthdateEditable, topicsPractised, topicsCompleted, competitionEntries] = await Promise.all([
    myRecords(ctx),
    getBadges(ctx.schoolId, ctx.membershipId, membership.school.timezone),
    mayEditOwnBirthdate(ctx),
    db.quizMastery.count({ where: { schoolId: ctx.schoolId, studentMembershipId: ctx.membershipId, seenCount: { gt: 0 } } }),
    db.quizMastery.count({ where: { schoolId: ctx.schoolId, studentMembershipId: ctx.membershipId, cleanCompletionAt: { not: null } } }),
    db.competitionEntry.findMany({
      where: { studentMembershipId: ctx.membershipId },
      select: { id: true, status: true, rank: true, competition: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);
  // A self-joined student's "email" is an internal handle, not a real address.
  const handle = membership.user.email?.endsWith("@edulink.local") ? membership.user.email.replace("@edulink.local", "") : null;
  return {
    name: membership.user.name,
    preferredName: membership.user.preferredName,
    bio: membership.user.bio,
    avatarKey: membership.user.avatarKey,
    birthdate: membership.user.birthdate?.toISOString().slice(0, 10) ?? null,
    birthdateEditable,
    handle,
    studentCode: membership.studentCode,
    schoolName: membership.school.name,
    className: membership.enrollments[0]?.class.name ?? null,
    previousSchools: previous.map((r) => ({
      id: r.id,
      schoolName: r.schoolName,
      gradeLevel: r.gradeLevel,
      joinedAt: r.joinedAt.toISOString(),
      leftAt: r.leftAt.toISOString(),
      reason: r.reason,
      attendancePercent: r.attendancePercent,
      reportCardCount: r.reportCardCount,
    })),
    practice: { topicsPractised, topicsCompleted },
    competitions: competitionEntries.map((e) => ({ id: e.id, title: e.competition.title, status: e.status, rank: e.rank })),
    badges,
  };
}

export type FieldIssues = Record<string, TranslationKey>;

/**
 * The profile form's save, for the pupil: preferred name, bio, avatar and —
 * within birthdate.ts's rule — the date of birth. The legal name is not here
 * on purpose; it belongs with the office. Returns the field that was refused
 * rather than throwing, because a wrong birthdate is a form error, not an
 * access error.
 */
export async function saveStudentProfile(
  ctx: StudentCtx,
  input: { preferredName: string; bio: string; avatarKey: string; birthdate?: string },
): Promise<{ ok: true } | { ok: false; issues: FieldIssues }> {
  const issues: FieldIssues = {};
  if (!AVATAR_PRESETS.includes(input.avatarKey)) issues.avatarKey = "common.checkTheForm";

  if (typeof input.birthdate === "string") {
    const current = await db.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { birthdate: true } });
    const before = current.birthdate?.toISOString().slice(0, 10) ?? "";
    if (input.birthdate !== before) {
      const result = await setOwnBirthdate(ctx, input.birthdate);
      if (!result.ok) issues.birthdate = result.errorKey;
    }
  }
  if (Object.keys(issues).length > 0) return { ok: false, issues };

  await db.user.update({
    where: { id: ctx.user.id },
    data: { preferredName: input.preferredName || null, bio: input.bio || null, avatarKey: input.avatarKey },
  });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "profile.update", targetType: "User", targetId: ctx.user.id, meta: { api: true } });
  return { ok: true };
}

/** /student/practice — every topic with this child's progress, and the cards above the list. */
export async function studentPractice(ctx: StudentCtx) {
  const language = normaliseLanguage(ctx.user.prefs.locale);
  const [topics, enrolledGrade, resume, weekly, revision, assigned] = await Promise.all([
    listTopics(ctx, { language }),
    enrolledGradeLevel(ctx),
    continueCard(ctx, language),
    weeklyPracticeCount(ctx),
    revisionQueue(ctx, { language }),
    assignmentsForStudent(ctx, language),
  ]);
  const grades = [...new Set(topics.map((t) => t.classLevel))];
  return {
    topics: topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      chapter: t.chapter,
      subject: t.subject,
      classLevel: t.classLevel,
      summary: t.summary,
      questionCount: t.questionCount,
      level: t.level,
      seenCount: t.seenCount,
      correctCount: t.correctCount,
      completed: t.completed,
      badgeEarned: t.badgeEarned,
      tierCount: t.tierCount,
    })),
    enrolledGrade,
    // No explicit choice lands on the child's OWN grade, when the bank has it.
    defaultGrade: enrolledGrade && grades.includes(enrolledGrade) ? enrolledGrade : null,
    resume,
    weekly,
    weeklyGoal: WEEKLY_GOAL,
    revision,
    assigned: assigned.map((a) => ({
      id: a.id,
      topicSlug: a.topicSlug,
      topicName: a.topicName,
      subject: a.subject,
      classLevel: a.classLevel,
      targetLevel: a.targetLevel,
      targetTierName: a.targetTierName,
      note: a.note,
      dueAt: a.dueAt?.toISOString() ?? null,
      myLevel: a.myLevel,
      reached: a.reached,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* PARENT                                                                      */
/* -------------------------------------------------------------------------- */

/** /parent — the guardian's dashboard for one child. A child who has left gets the header and nothing else. */
export async function parentOverview(ctx: ActiveContext, childId?: string | null) {
  const { children, selectedId, link } = await selectChild(ctx, childId);
  const student = link.student;
  const child = childHeader(selectedId, link);
  const today = todayKey(student.school.timezone);
  const empty = {
    children: childRows(children),
    child,
    left: true,
    today,
    todayRecord: null,
    attendance: null,
    streak: 0,
    averagePercent: null,
    scoredCount: 0,
    recentGrades: [],
    closedToday: false,
    closedName: null,
    lessonsToday: [],
    upcoming: [],
    threads: [],
    awaitingConsent: [],
    examMarks: [],
  };
  if (student.leftAt) return empty;

  const week = await childWeek(ctx, selectedId, { weekOf: today, todayKey: today });
  const [attendance, todayRecord, grades, upcoming, threads, awaitingConsent] = await Promise.all([
    getAttendanceSummary(student.schoolId, selectedId, addDaysToKey(today, -28), today),
    db.attendanceRecord.findFirst({
      where: { studentMembershipId: selectedId, session: { dateKey: today } },
      select: { status: true, note: true },
    }),
    // Homework only: an exam paper is also a Grade, but its marks belong to
    // the exam card, and the tile's "pieces" are the ongoing work.
    db.grade.findMany({
      where: { studentMembershipId: selectedId, schoolId: student.schoolId, assignment: { examSlotId: null } },
      include: { assignment: { select: { title: true, pointsMilli: true, category: true, classId: true } } },
      orderBy: { gradedAt: "desc" },
      take: 5,
    }),
    dueSoonFor(student.schoolId, selectedId, 4),
    db.remarkThread.findMany({
      where: { studentMembershipId: selectedId },
      include: { teacher: { include: { user: { select: { name: true, avatarKey: true } } } } },
      orderBy: { lastMessageAt: "desc" },
      take: 3,
    }),
    // Every child's, not just the one on screen: a consent request has a deadline.
    pendingConsents(ctx),
  ]);

  const scored = grades.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli);
  const classIds = [...new Set(grades.map((g) => g.assignment.classId))];
  const [weightRows, examMarks] = await Promise.all([
    db.gradeCategory.findMany({ where: { classId: { in: classIds } }, select: { classId: true, name: true, weightBps: true }, orderBy: { position: "asc" } }),
    examMarksFor(ctx),
  ]);
  const weightsByClass = new Map<string, { name: string; weightBps: number }[]>();
  for (const row of weightRows) {
    const list = weightsByClass.get(row.classId) ?? [];
    list.push({ name: row.name, weightBps: row.weightBps });
    weightsByClass.set(row.classId, list);
  }
  const overall = overallForStudent(
    grades.map((g) => ({ classId: g.assignment.classId, scoreMilli: g.scoreMilli, maxMilli: g.assignment.pointsMilli, category: g.assignment.category })),
    weightsByClass,
  );

  return {
    ...empty,
    left: false,
    todayRecord: todayRecord ? { status: todayRecord.status as AttendanceStatus, note: todayRecord.note } : null,
    attendance: summaryOut(attendance),
    streak: computeStreak(attendance.recent),
    averagePercent: overall.percent,
    scoredCount: scored.length,
    recentGrades: grades.map((g) => ({
      assignmentTitle: g.assignment.title,
      category: g.assignment.category,
      scoreMilli: g.scoreMilli,
      pointsMilli: g.assignment.pointsMilli,
      gradedAt: g.gradedAt.toISOString(),
    })),
    ...lessonsOn(week, today),
    upcoming,
    threads: threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      teacherName: t.teacher.user.name,
      teacherAvatarKey: t.teacher.user.avatarKey,
      lastMessageAt: t.lastMessageAt.toISOString(),
    })),
    awaitingConsent: awaitingConsent.map((c) => ({ ...c, closesAt: c.closesAt?.toISOString() ?? null })),
    examMarks,
  };
}

/** /parent/attendance — one month at a time, any month up to this one. */
export async function parentAttendance(ctx: ActiveContext, childId?: string | null, requestedMonth?: string | null) {
  const { children, selectedId, link } = await selectChild(ctx, childId);
  const student = link.student;
  const today = todayKey(student.school.timezone);
  const thisMonth = today.slice(0, 7);
  const month = requestedMonth && MONTH_KEY.test(requestedMonth) && requestedMonth <= thisMonth ? requestedMonth : thisMonth;
  const summary = await getAttendanceSummary(student.schoolId, selectedId, `${month}-01`, `${month}-31`);
  const next = shiftMonth(month, 1);
  return {
    children: childRows(children),
    child: childHeader(selectedId, link),
    month,
    thisMonth,
    previousMonth: shiftMonth(month, -1),
    nextMonth: next <= thisMonth ? next : null,
    summary: summaryOut(summary),
    // Only days that have a record, newest first.
    days: [...summary.recent]
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
      .map((day) => ({ ...day, teachingDay: isTeachingDay(day.dateKey) })),
  };
}

/** /parent/assignments — the child's three tabs, read-only, from childWork. */
export async function parentAssignments(ctx: ActiveContext, childId?: string | null) {
  const { children, selectedId } = await selectChild(ctx, childId);
  const { childName, todo, handedIn, marked } = await childWork(ctx.user.id, selectedId);
  const out = (item: (typeof todo)[number]) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    className: item.className,
    pointsMilli: item.pointsMilli,
    dueAt: item.dueAt?.toISOString() ?? null,
    submittedAt: item.submittedAt?.toISOString() ?? null,
    returned: item.returned,
    scoreMilli: item.scoreMilli,
    comment: item.comment,
    overdue: item.overdue,
  });
  return { children: childRows(children), childName, todo: todo.map(out), handedIn: handedIn.map(out), marked: marked.map(out) };
}

/** /parent/practice — every chapter the child has touched, for their guardian. */
export async function parentPractice(ctx: ActiveContext, childId?: string | null) {
  const { children, selectedId } = await selectChild(ctx, childId);
  const language = normaliseLanguage(ctx.user.prefs.locale);
  const { childName, topics, weeklyCount } = await childPracticeProgress(ctx.user.id, selectedId, language);
  return { children: childRows(children), childName, weeklyCount, topics };
}

/** /parent/meetings — the open windows of the children's teachers, and the family's own bookings. */
export async function parentMeetings(ctx: ActiveContext) {
  const { children } = await listContexts(ctx.user.id);
  const [open, mine, school] = await Promise.all([
    openSlotsFor(ctx.user.id),
    myBookings(ctx.user.id),
    children[0] ? db.school.findUnique({ where: { id: children[0].schoolId }, select: { timezone: true } }) : Promise.resolve(null),
  ]);
  return {
    timezone: school?.timezone ?? "UTC",
    children: childRows(children),
    open: open.map((s) => ({ ...s, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() })),
    mine: mine.map((b) => ({ ...b, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString() })),
  };
}

async function readPrefs(userId: string): Promise<UserPrefs> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { prefs: true } });
  return readJson<UserPrefs>(user.prefs, DEFAULT_PREFS);
}

/** /parent/settings — the channels a guardian is reached on, and the children they hear about. */
export async function familySettings(ctx: ActiveContext) {
  const [prefs, contexts] = await Promise.all([readPrefs(ctx.user.id), listContexts(ctx.user.id)]);
  return { channels: prefs.channels, quietHours: prefs.quietHours, children: childRows(contexts.children) };
}

/**
 * The notifications section of the preferences form, merged over the rest of
 * the row the way the account page's save does — appearance is untouched.
 * Quiet hours with identical start and end would silence everything forever.
 */
export async function saveFamilySettings(
  ctx: ActiveContext,
  input: { channels: { push: boolean; email: boolean; sms?: boolean; whatsapp?: boolean }; quietHours: { start: string; end: string } | null },
): Promise<{ ok: true } | { ok: false; issues: FieldIssues }> {
  if (input.quietHours && input.quietHours.start === input.quietHours.end) {
    return { ok: false, issues: { "quietHours.end": "account.quietSameTime" } };
  }
  const current = await readPrefs(ctx.user.id);
  await db.user.update({ where: { id: ctx.user.id }, data: { prefs: writeJson({ ...current, ...input }) } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "prefs.update", meta: { theme: current.theme, contrast: current.contrast, font: current.font, api: true } });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Shared by pupil and guardian                                                */
/* -------------------------------------------------------------------------- */

/** /timetable for a pupil, /parent/timetable for a guardian: the same dated, resolved week. */
export async function familyTimetable(ctx: ActiveContext & { role: "STUDENT" | "PARENT" }, childId?: string | null, week?: string | null) {
  let children: FamilyChildRow[] = [];
  let child: ReturnType<typeof childHeader> | null = null;
  let timezone: string;
  let grid: WeekGrid;
  let today: string;
  if (ctx.role === "PARENT") {
    const selected = await selectChild(ctx, childId);
    children = selected.children;
    child = childHeader(selected.selectedId, selected.link);
    timezone = selected.link.student.school.timezone;
    today = todayKey(timezone);
    const anchor = week && isDateKey(week) ? week : today;
    grid = await childWeek(ctx, selected.selectedId, { weekOf: weekStartKey(anchor), todayKey: today });
  } else {
    if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");
    const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
    today = todayKey(school.timezone);
    const anchor = week && isDateKey(week) ? week : today;
    grid = await studentWeek(ctx, ctx.membershipId, { weekOf: weekStartKey(anchor), todayKey: today });
  }
  const monday = weekStartKey(week && isDateKey(week) ? week : today);
  return {
    child,
    children: childRows(children),
    today,
    weekOf: monday,
    previous: addDaysToKey(monday, -7),
    next: addDaysToKey(monday, 7),
    isThisWeek: monday === weekStartKey(today),
    spansClasses: new Set(grid.slots.map((slot) => slot.classId)).size > 1,
    grid: weekOut(grid),
  };
}

const cardRow = (c: { id: string; title: string; publishedAt: Date | null; overallPercentMilli: number | null }) => ({
  id: c.id,
  title: c.title,
  publishedAt: c.publishedAt?.toISOString() ?? null,
  overallPercentMilli: c.overallPercentMilli,
});

/** The cards tab: a pupil's own published cards, or each child's, named per child only when there are several. */
export async function familyReportCards(ctx: ActiveContext & { role: "STUDENT" | "PARENT" }) {
  if (ctx.role === "STUDENT") {
    return { groups: [{ studentMembershipId: ctx.membershipId!, name: null, rows: (await myCards(ctx)).map(cardRow) }] };
  }
  const { children } = await listContexts(ctx.user.id);
  const groups = await Promise.all(
    children.map(async (child) => ({
      studentMembershipId: child.studentMembershipId,
      name: children.length > 1 ? child.name : null,
      rows: (await cardsForChild(ctx, child.studentMembershipId)).filter((c) => c.status === "PUBLISHED").map(cardRow),
    })),
  );
  return { groups };
}

/**
 * One card. `getCard` answers null when the reader may not see it — a draft to
 * a family, another child's card, another school's — and that is a 404 here
 * as on the page: a card somebody may not read should not confirm it exists.
 */
export async function familyReportCard(ctx: ActiveContext, cardId: string) {
  const card = await getCard(ctx, cardId);
  if (!card) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  return { ...card, publishedAt: card.publishedAt?.toISOString() ?? null };
}

/** /exams for a reader: marks as they come in, the sittings still ahead, and the report cards. */
export async function familyExams(ctx: ActiveContext & { role: "STUDENT" | "PARENT" }) {
  const [sheets, marks, { groups: cards }] = await Promise.all([dateSheetsFor(ctx), examMarksFor(ctx), familyReportCards(ctx)]);

  // Upcoming only, in each school's own zone; a sheet with nothing left to sit disappears.
  const schoolNames = [...new Set(sheets.map((s) => s.schoolName))];
  const zones = new Map(
    (await db.school.findMany({ where: { name: { in: schoolNames } }, select: { name: true, timezone: true } })).map((s) => [s.name, s.timezone] as const),
  );
  const upcoming = sheets
    .map((sheet) => {
      const today = todayKey(zones.get(sheet.schoolName) ?? "UTC");
      return { ...sheet, slots: sheet.slots.filter((slot) => slot.dateKey >= today) };
    })
    .filter((sheet) => sheet.slots.length > 0);

  // With no cards yet it matters WHY: a term still running means they are coming.
  let awaitingTermName: string | null = null;
  let termIsRunning = false;
  if (cards.reduce((n, c) => n + c.rows.length, 0) === 0) {
    const readerSchoolIds =
      ctx.role === "PARENT"
        ? [...new Set((await listContexts(ctx.user.id)).children.map((c) => c.schoolId))]
        : ctx.schoolId
          ? [ctx.schoolId]
          : [];
    if (readerSchoolIds.length > 0) {
      const tz = new Map((await db.school.findMany({ where: { id: { in: readerSchoolIds } }, select: { id: true, timezone: true } })).map((s) => [s.id, s.timezone]));
      const runningNames = new Set<string>();
      for (const schoolId of readerSchoolIds) {
        for (const term of await currentTerms(schoolId, tz.get(schoolId) ?? "UTC")) {
          if (term.current && !term.finishedAt) runningNames.add(term.name);
        }
      }
      termIsRunning = runningNames.size > 0;
      awaitingTermName = runningNames.size === 1 ? [...runningNames][0]! : null;
    }
  }
  return { marks, upcoming, cards, termIsRunning, awaitingTermName };
}

/** /reviews — a pupil answers within their school; a guardian's page walks each child's school. */
export async function familyReviews(ctx: ActiveContext & { role: "STUDENT" | "PARENT" }) {
  let waiting: Awaited<ReturnType<typeof pendingReviews>> = [];
  if (ctx.role === "STUDENT" && ctx.schoolId) {
    waiting = await pendingReviews(ctx, ctx.schoolId);
  } else if (ctx.role === "PARENT") {
    const children = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE" },
      select: { studentSchoolId: true },
      distinct: ["studentSchoolId"],
    });
    for (const child of children) waiting = waiting.concat(await pendingReviews(ctx, child.studentSchoolId));
  }
  return { pending: waiting };
}

/**
 * The rate action: submitReview's refusals as statuses. A round that is gone,
 * or a teacher who does not teach this family, is 404 — the id may well be
 * another school's, and the answer must not differ. A closed round or a
 * questionnaire not for this role is 403; an unanswered question is a form
 * error the route turns into 422.
 */
export async function rateTeacher(
  ctx: ActiveContext,
  input: { roundId: string; teacherMembershipId: string; scores: Record<string, number> },
): Promise<{ ok: true } | { ok: false; issues: FieldIssues }> {
  const result = await submitReview(ctx, input);
  if (result.ok) return { ok: true };
  if (result.errorKey === "reviews.roundGone" || result.errorKey === "reviews.notYourTeacher") throw new AccessError(result.errorKey, "NOT_FOUND");
  if (result.errorKey === "reviews.answerEverything") return { ok: false, issues: { scores: result.errorKey } };
  throw new AccessError(result.errorKey);
}

/** /explore — every published school, for anybody signed in with a role; filters are place and words. */
export async function exploreDirectory(ctx: ActiveContext, filters: { q?: string; country?: string; region?: string }) {
  if (!ctx.role) throw new AccessError("access.wrongRoleForThisAction");
  const places = await directoryPlaces();
  const country = filters.country ?? "";
  const regions = country ? (places.regionsByCountry[country] ?? []) : [];
  // A state belongs to its country: a switch of country must not carry the old state along.
  const region = filters.region && regions.includes(filters.region) ? filters.region : "";
  const schools = await listDirectory(ctx, { q: filters.q?.slice(0, 80) ?? "", country: country || undefined, region: region || undefined });
  return { schools, countries: places.countries, regionsByCountry: places.regionsByCountry };
}
