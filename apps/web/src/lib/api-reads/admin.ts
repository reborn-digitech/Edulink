import "server-only";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiErrorSchema } from "@edulink/contracts";
import { db } from "@/lib/db";
import type { ActiveContext } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { getChecklist } from "@/lib/onboarding";
import { currentAcademicYear, listAcademicYears } from "@/lib/academic-year";
import { currentTerms, termsOfYear } from "@/lib/terms";
import { unstaffedLessons, listPeriods, timetableClasses, classWeek, schoolBusyMap, teachingLoad } from "@/lib/timetable";
import { listHolidays, nextEntry } from "@/lib/holidays";
import { todayKey, addDaysToKey, parseTeachingDays } from "@/lib/dates";
import { schoolJobStory } from "@/lib/job-health";
import { pendingParentInvites } from "@/lib/parent-link";
import { readJsonArray } from "@/lib/json";
import { promotionPlan } from "@/lib/promotion";
import { listSeries } from "@/lib/exams";
import { absenceFlags, attendanceTrend } from "@/lib/attendance-intel";
import { attendanceHistory, historyClassesFor, MONTH_KEY } from "@/lib/attendance-history";
import { approvedLeaveBetween, schoolLeave, coverCandidates } from "@/lib/leave";
import { birthdaysBetween } from "@/lib/birthdays";
import { listReviewRounds, schoolReviewDashboard } from "@/lib/reviews";
import { listReports, listAudit, openReportCount } from "@/lib/safety";
import { accessHistory } from "@/lib/superuser";
import { readOwnProfileSettings, listContactCandidates } from "@/lib/school-profile";
import { AUTO_READ_AFTER_DAYS, EXPIRE_READ_AFTER_DAYS } from "@/lib/notification-housekeeping";
import { listOurPostings } from "@/lib/vacancies";
import { leaveBalancesFor, STAFF_ROLES } from "@/lib/staff-records";
import { SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";

/**
 * The admin pages' reads, as functions.
 *
 * Every page under /admin ran its queries inline in page.tsx; the /api/v1
 * handlers need the same rows without the JSX, so each read here reproduces
 * one page's queries — the same WHERE, the same access check the page has —
 * and returns the plain shape the contract in @edulink/contracts describes.
 * A read that the page already got from src/lib is called through, not
 * copied. The caller has already passed `requireApiRole`; the `ctx` here is
 * therefore a school-scoped one, and `schoolId` is read from it and never
 * from a parameter. (§6)
 */

type Scoped = ActiveContext & { schoolId: string; membershipId: string };

const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/* -------------------------------------------------------------------------- */
/* Action outcomes                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A server action's "no" as an API answer. The actions hand back `errorKey`
 * (theirs), `error` (an AccessError's sentence) or `errors` (a form's field
 * messages, already translated); none of those is an exception, so
 * `apiFailure` never sees them. This is the 422 they become: the same
 * envelope, the sentence in the caller's language, the field issues kept.
 */
export async function apiRefused(
  refusal: { errorKey?: TranslationKey; errorVars?: Record<string, string | number>; error?: string; issues?: Record<string, string> },
): Promise<NextResponse> {
  const t = await getT();
  const sentence = refusal.errorKey ? t(refusal.errorKey, refusal.errorVars) : (refusal.error ?? t("common.checkTheForm"));
  const issues = refusal.issues && Object.keys(refusal.issues).length > 0 ? refusal.issues : undefined;
  return NextResponse.json(apiErrorSchema.parse({ error: sentence, code: "BAD_REQUEST", ...(issues ? { issues } : {}) }), {
    status: 422,
    headers: { "Cache-Control": "no-store" },
  });
}

/* -------------------------------------------------------------------------- */
/* /admin                                                                      */
/* -------------------------------------------------------------------------- */

export async function adminOverview(ctx: Scoped) {
  const [school, jobStory] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { name: true, code: true, timezone: true } }),
    schoolJobStory(ctx),
  ]);
  const dateKey = todayKey(school.timezone);
  const [
    examSeriesCount,
    examPublishedCount,
    reportCardsPublished,
    checklist,
    teacherCount,
    studentCount,
    classCount,
    pendingInvites,
    todaySessions,
    academicYear,
    calendar,
  ] = await Promise.all([
    db.examSeries.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
    db.examSeries.count({ where: { schoolId: ctx.schoolId, archivedAt: null, publishedAt: { not: null } } }),
    db.reportCard.count({ where: { schoolId: ctx.schoolId, status: "PUBLISHED" } }),
    getChecklist(ctx.schoolId),
    // On roll / on staff, not "ever": a leaver keeps status ACTIVE and gets a leftAt.
    db.membership.count({ where: { schoolId: ctx.schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null } }),
    db.membership.count({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
    db.class.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
    db.invite.count({ where: { schoolId: ctx.schoolId, status: "PENDING" } }),
    db.attendanceSession.count({ where: { schoolId: ctx.schoolId, dateKey } }),
    currentAcademicYear(ctx.schoolId),
    listHolidays(ctx.schoolId, { fromKey: dateKey }),
  ]);
  const coming = nextEntry(calendar, dateKey);
  const terms = academicYear ? await currentTerms(ctx.schoolId, school.timezone) : [];
  const runningTerm = terms.find((term) => term.current && !term.finishedAt) ?? terms.filter((term) => !term.finishedAt).at(-1) ?? null;
  const staffing = classCount > 0 ? await unstaffedLessons(ctx.schoolId) : { slots: 0, classes: 0 };

  return {
    school: { name: school.name, code: school.code, timezone: school.timezone, todayKey: dateKey },
    academicYear: academicYear ? { id: academicYear.id, name: academicYear.name } : null,
    runningTerm: runningTerm ? { id: runningTerm.id, name: runningTerm.name } : null,
    nextUp: coming ? { name: coming.name, startDateKey: coming.startDateKey } : null,
    checklist: {
      done: checklist.done,
      total: checklist.total,
      complete: checklist.complete,
      steps: checklist.steps.map((step) => ({
        id: step.id,
        done: step.done,
        href: step.href,
        titleKey: step.titleKey,
        descriptionKey: step.descriptionKey,
        ...(step.descriptionVars ? { descriptionVars: step.descriptionVars } : {}),
        ctaKey: step.ctaKey,
        blockedBy: step.blockedBy ?? null,
      })),
    },
    counts: {
      teachers: teacherCount,
      students: studentCount,
      classes: classCount,
      pendingInvites,
      registersTakenToday: todaySessions,
      examSeries: examSeriesCount,
      examSeriesPublished: examPublishedCount,
      reportCardsPublished,
    },
    attendanceTakenPercent: classCount === 0 ? null : Math.round((todaySessions / classCount) * 100),
    staffingGap: staffing,
    jobStory: {
      attention: jobStory.attention,
      entries: jobStory.entries.map((entry) => ({ job: entry.job, at: iso(entry.at), counts: entry.counts })),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* /admin/people, /admin/invites                                               */
/* -------------------------------------------------------------------------- */

const PEOPLE_PAGE_SIZE = 50;

export async function adminPeople(
  ctx: Scoped,
  filters: { q?: string; role?: SchoolRole; status: "ACTIVE" | "SUSPENDED" | "LEFT"; classId?: string; sort: "name" | "recent"; page: number },
) {
  const query = (filters.q ?? "").trim().slice(0, 80);
  const roleFilter = filters.role && SCHOOL_ROLES.includes(filters.role) ? filters.role : null;
  const classFilter = filters.classId
    ? await db.class.findFirst({ where: { id: filters.classId, schoolId: ctx.schoolId }, select: { id: true, name: true } })
    : null;

  // schoolId first and always — the filters below only ever narrow it. (§6)
  const where: Prisma.MembershipWhereInput = {
    schoolId: ctx.schoolId,
    ...(filters.status === "LEFT" ? { leftAt: { not: null } } : { status: filters.status, leftAt: null }),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(classFilter
      ? {
          OR: [
            { enrollments: { some: { classId: classFilter.id, status: "ACTIVE" } } },
            { classTeachers: { some: { classId: classFilter.id } } },
          ],
        }
      : {}),
    ...(query
      ? {
          user: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { preferredName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [parentInvites, members, total, classes, roleCounts, suspendedCount, leftCount] = await Promise.all([
    pendingParentInvites(ctx),
    db.membership.findMany({
      where,
      include: {
        user: { select: { name: true, preferredName: true, email: true, avatarKey: true, birthdate: true } },
        enrollments: { where: { status: "ACTIVE" }, include: { class: { select: { name: true } } } },
        classTeachers: { include: { class: { select: { name: true } } } },
        schoolRecord: { select: { id: true, destination: true } },
        staffRecord: true,
        scheduledDeparture: { select: { leaveOnKey: true } },
      },
      orderBy: filters.sort === "recent" ? { joinedAt: "desc" } : [{ user: { name: "asc" } }],
      skip: (filters.page - 1) * PEOPLE_PAGE_SIZE,
      take: PEOPLE_PAGE_SIZE,
    }),
    db.membership.count({ where }),
    db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.membership.groupBy({ by: ["role"], where: { schoolId: ctx.schoolId, status: "ACTIVE", leftAt: null }, _count: true }),
    db.membership.count({ where: { schoolId: ctx.schoolId, status: "SUSPENDED", leftAt: null } }),
    db.membership.count({ where: { schoolId: ctx.schoolId, leftAt: { not: null } } }),
  ]);
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  classes.sort((a, b) => collator.compare(a.name, b.name));

  return {
    members: members.map((m) => ({
      membershipId: m.id,
      role: m.role,
      status: m.status,
      name: m.user.name,
      preferredName: m.user.preferredName,
      email: m.user.email,
      avatarKey: m.user.avatarKey,
      birthdateKey: m.user.birthdate ? dayKey(m.user.birthdate) : null,
      studentCode: m.studentCode,
      title: m.title,
      subjects: readJsonArray<string>(m.subjects),
      joinedAt: iso(m.joinedAt),
      leftAt: isoOrNull(m.leftAt),
      suspendedAt: isoOrNull(m.suspendedAt),
      suspendedReason: m.suspendedReason,
      enrolledIn: m.enrollments.map((e) => e.class.name),
      teaches: m.classTeachers.map((ct) => ct.class.name),
      staffRecord: m.staffRecord
        ? { designation: m.staffRecord.designation, joinedOnKey: m.staffRecord.joinedOn ? dayKey(m.staffRecord.joinedOn) : null }
        : null,
      schoolRecord: m.schoolRecord ? { id: m.schoolRecord.id, destination: m.schoolRecord.destination } : null,
      scheduledDeparture: m.scheduledDeparture ? { leaveOnKey: m.scheduledDeparture.leaveOnKey } : null,
      pendingParentInvites: parentInvites.get(m.id) ?? [],
    })),
    total,
    page: filters.page,
    pages: Math.max(1, Math.ceil(total / PEOPLE_PAGE_SIZE)),
    pageSize: PEOPLE_PAGE_SIZE,
    classes,
    roleCounts: roleCounts.map((c) => ({ role: c.role, count: c._count })),
    suspendedCount,
    leftCount,
    filters: { q: query, role: roleFilter, status: filters.status, classId: classFilter?.id ?? null, sort: filters.sort },
  };
}

export async function adminInvites(
  ctx: Scoped,
  filters: { status: "PENDING" | "ACCEPTED" | "REVOKED"; role?: SchoolRole; q?: string; expired?: boolean },
) {
  const q = filters.q?.trim() ?? "";
  const roleFilter = filters.role && SCHOOL_ROLES.includes(filters.role) ? filters.role : null;
  const expiredOnly = filters.status === "PENDING" && filters.expired === true;
  const now = new Date();
  const [invites, counts] = await Promise.all([
    db.invite.findMany({
      where: {
        schoolId: ctx.schoolId,
        status: filters.status,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(expiredOnly ? { expiresAt: { lt: now } } : {}),
        ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, role: true, email: true, name: true, classId: true, status: true, expiresAt: true, createdAt: true, acceptedAt: true },
    }),
    db.invite.groupBy({ by: ["status"], where: { schoolId: ctx.schoolId }, _count: true }),
  ]);
  const countFor = (status: string) => counts.find((c) => c.status === status)?._count ?? 0;
  return {
    invites: invites.map((i) => ({
      id: i.id,
      role: i.role,
      email: i.email,
      name: i.name,
      classId: i.classId,
      status: i.status,
      expiresAt: iso(i.expiresAt),
      expired: i.expiresAt.getTime() < now.getTime(),
      createdAt: iso(i.createdAt),
      acceptedAt: isoOrNull(i.acceptedAt),
    })),
    counts: { PENDING: countFor("PENDING"), ACCEPTED: countFor("ACCEPTED"), REVOKED: countFor("REVOKED") },
  };
}

/* -------------------------------------------------------------------------- */
/* /admin/classes, /admin/promotion                                            */
/* -------------------------------------------------------------------------- */

export async function adminClasses(ctx: Scoped, filters: { archived?: boolean; q?: string; sort: "name" | "size"; leaderlessOnly?: boolean }) {
  const q = filters.q?.trim() ?? "";
  const rows = await db.class.findMany({
    where: {
      schoolId: ctx.schoolId,
      archivedAt: filters.archived ? { not: null } : null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { room: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      teachers: { include: { teacher: { include: { user: { select: { name: true, preferredName: true } } } } } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { name: "asc" },
  });
  const [archivedCount, activeCount] = await Promise.all([
    db.class.count({ where: { schoolId: ctx.schoolId, archivedAt: { not: null } } }),
    db.class.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
  ]);
  const isLeaderless = (k: (typeof rows)[number]) => !k.archivedAt && k._count.enrollments > 0 && !k.teachers.some((ct) => ct.role === "LEAD");
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const shaped = rows
    .filter((k) => !filters.leaderlessOnly || isLeaderless(k))
    .map((k) => ({
      id: k.id,
      name: k.name,
      subject: k.subject,
      gradeLevel: k.gradeLevel,
      section: k.section,
      room: k.room,
      color: k.color,
      joinCode: k.joinCode,
      archivedAt: isoOrNull(k.archivedAt),
      pupils: k._count.enrollments,
      teachers: k.teachers.map((ct) => ({
        membershipId: ct.teacherMembershipId,
        name: ct.teacher.user.preferredName ?? ct.teacher.user.name,
        role: ct.role,
      })),
      leaderless: isLeaderless(k),
    }))
    .sort((a, b) => (filters.sort === "size" ? b.pupils - a.pupils || collator.compare(a.name, b.name) : collator.compare(a.name, b.name)));
  return { classes: shaped, activeCount, archivedCount, leaderlessCount: rows.filter(isLeaderless).length };
}

export async function adminPromotionPlan(ctx: Scoped) {
  const [plan, year] = await Promise.all([promotionPlan(ctx), currentAcademicYear(ctx.schoolId)]);
  return { academicYear: year ? { id: year.id, name: year.name } : null, classes: plan };
}

/* -------------------------------------------------------------------------- */
/* /admin/timetable                                                            */
/* -------------------------------------------------------------------------- */

export async function adminTimetable(ctx: Scoped, opts: { classId?: string }) {
  const [periods, classes] = await Promise.all([listPeriods(ctx.schoolId, { includeArchived: true }), timetableClasses(ctx)]);
  // The named class if it is real and in this school, otherwise the first —
  // never a 404, the way the page never dead-ends on a stale link. (§7)
  const selected = classes.find((klass) => klass.id === opts.classId) ?? classes[0] ?? null;
  const [grid, staff, busy, load] = selected
    ? await Promise.all([
        classWeek(ctx, selected.id),
        db.membership.findMany({
          where: { schoolId: ctx.schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null },
          select: { id: true, user: { select: { name: true, preferredName: true } } },
          take: 500,
        }),
        schoolBusyMap(ctx, selected.id),
        teachingLoad(ctx),
      ])
    : [null, [], {}, new Map<string, number>()];
  const shapePeriod = (p: (typeof periods)[number]) => ({ ...p, archivedAt: isoOrNull(p.archivedAt) });
  return {
    periods: periods.map(shapePeriod),
    classes,
    selectedClassId: selected?.id ?? null,
    grid: grid ? { periods: grid.periods.map(shapePeriod), days: grid.days, slots: grid.slots } : null,
    staff: staff
      .map((row) => ({ membershipId: row.id, name: row.user.preferredName ?? row.user.name, load: load.get(row.id) ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    busy,
  };
}

/* -------------------------------------------------------------------------- */
/* /admin/exams                                                                */
/* -------------------------------------------------------------------------- */

export async function adminExams(ctx: Scoped, filters: { kind?: string; grade?: string; state?: "draft" | "published" }) {
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const gradeFilter = filters.grade?.trim() || undefined;
  const [series, total, gradeRows, terms] = await Promise.all([
    listSeries(ctx, { kind: filters.kind, gradeLevel: gradeFilter, state: filters.state }),
    db.examSeries.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
    db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null, gradeLevel: { not: null } }, select: { gradeLevel: true }, distinct: ["gradeLevel"] }),
    currentTerms(ctx.schoolId, school.timezone),
  ]);
  return {
    series: series.map((s) => ({
      id: s.id,
      name: s.name,
      gradeLevel: s.gradeLevel,
      kind: s.kind,
      term: s.term ? { id: s.term.id, name: s.term.name } : null,
      publishedAt: isoOrNull(s.publishedAt),
      createdAt: iso(s.createdAt),
      slots: s.slots.map((slot) => ({
        id: slot.id,
        subject: slot.subject,
        dateKey: slot.dateKey,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        maxMarks: slot.pointsMilli / 1000,
        position: slot.position,
      })),
    })),
    total,
    grades: gradeRows.map((c) => c.gradeLevel!).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
    terms: terms.map(shapeTerm),
  };
}

function shapeTerm(term: { id: string; name: string; startDateKey: string; endDateKey: string; current: boolean; finishedAt: Date | null }) {
  return { id: term.id, name: term.name, startDateKey: term.startDateKey, endDateKey: term.endDateKey, current: term.current, finished: term.finishedAt !== null };
}

/* -------------------------------------------------------------------------- */
/* /admin/attendance, /attendance/history                                      */
/* -------------------------------------------------------------------------- */

export async function adminAttendance(ctx: Scoped, opts: { days: 30 | 60 | 90; sort: "percent" | "run" | "name" }) {
  const [trend, rawFlags, classes] = await Promise.all([
    attendanceTrend(ctx),
    absenceFlags(ctx, { days: opts.days }),
    db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const flags = [...rawFlags].sort((a, b) =>
    opts.sort === "run"
      ? b.currentRun - a.currentRun || a.percent - b.percent
      : opts.sort === "name"
        ? a.name.localeCompare(b.name)
        : a.percent - b.percent || b.currentRun - a.currentRun,
  );
  return { windowDays: opts.days, trend, flags, classes };
}

export async function adminAttendanceHistory(ctx: Scoped, opts: { classId?: string; month?: string }) {
  const [classes, school] = await Promise.all([
    historyClassesFor(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);
  const thisMonth = todayKey(school.timezone).slice(0, 7);
  const month = opts.month && MONTH_KEY.test(opts.month) ? opts.month : thisMonth;
  // A class that is not one of theirs is a 404, never a leak of another
  // school's rows; no class at all is the picker — the list and nothing else.
  if (opts.classId && !classes.some((c) => c.id === opts.classId)) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
  const selectedId = opts.classId ?? (classes.length === 1 ? classes[0]!.id : null);
  const history = selectedId ? await attendanceHistory(ctx, selectedId, month) : null;
  return { classes, month, history };
}

/* -------------------------------------------------------------------------- */
/* /admin/calendar                                                             */
/* -------------------------------------------------------------------------- */

export async function adminCalendar(ctx: Scoped, opts: { all?: boolean }) {
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const [years, entries] = await Promise.all([listAcademicYears(ctx), listHolidays(ctx.schoolId)]);
  const current = years.find((year) => year.isCurrent) ?? null;
  const terms = current ? await termsOfYear(ctx.schoolId, current.id, school.timezone) : [];
  const [leave, birthdays] = await Promise.all([
    approvedLeaveBetween(ctx, today, addDaysToKey(today, 120)),
    birthdaysBetween(ctx, today, addDaysToKey(today, 120)),
  ]);
  const shown = opts.all ? entries : entries.filter((entry) => entry.endDateKey >= today);
  return {
    todayKey: today,
    years: years.map((year) => ({
      id: year.id,
      name: year.name,
      startDateKey: dayKey(year.startDate),
      endDateKey: dayKey(year.endDate),
      isCurrent: year.isCurrent,
      closedAt: isoOrNull(year.closedAt),
    })),
    currentYearId: current?.id ?? null,
    terms: terms.map(shapeTerm),
    entries: shown.map((entry) => ({
      id: entry.id,
      name: entry.name,
      startDateKey: entry.startDateKey,
      endDateKey: entry.endDateKey,
      kind: entry.kind,
      note: entry.note,
      academicYearId: entry.academicYearId,
    })),
    leave: leave.map(shapeLeaveQuietly),
    birthdays,
  };
}

function shapeLeave<T extends { decidedAt: Date | null }>(row: T) {
  return { ...row, decidedAt: isoOrNull(row.decidedAt) };
}

/**
 * The calendar and the decided list show who is away and when, never why:
 * the principal read the reason when deciding, and the staff room does not
 * need to know whose absence is medical. Only the pending cards carry it.
 */
function shapeLeaveQuietly<T extends { decidedAt: Date | null; reason?: string; decisionNote?: string | null }>(row: T) {
  const { reason: _reason, decisionNote: _note, ...rest } = shapeLeave(row);
  void _reason;
  void _note;
  return rest;
}

/* -------------------------------------------------------------------------- */
/* /admin/reviews                                                              */
/* -------------------------------------------------------------------------- */

export async function adminReviews(ctx: Scoped, opts: { status: "open" | "closed" | "all" }) {
  const status = opts.status === "closed" ? "CLOSED" : opts.status === "all" ? undefined : "OPEN";
  const [rounds, allRounds, dashboard, school] = await Promise.all([
    listReviewRounds(ctx, { status }),
    listReviewRounds(ctx),
    schoolReviewDashboard(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);
  const today = todayKey(school.timezone);
  return {
    rounds: rounds.map((r) => ({ ...r, createdAt: iso(r.createdAt) })),
    counts: { open: allRounds.filter((r) => r.status === "OPEN").length, closed: allRounds.filter((r) => r.status !== "OPEN").length },
    dashboard,
    teacherOptions: dashboard.map((row) => ({ membershipId: row.membershipId, name: row.name })),
    defaultCloseDateKey: addDaysToKey(today, 14),
  };
}

/* -------------------------------------------------------------------------- */
/* /admin/safety                                                               */
/* -------------------------------------------------------------------------- */

export async function adminSafety(ctx: Scoped, opts: { tab: "open" | "closed" | "audit" }) {
  const visits = await accessHistory(ctx.schoolId, 10);
  const [openCount, reports, audit] = await Promise.all([
    openReportCount(ctx),
    opts.tab === "open"
      ? listReports(ctx, "OPEN")
      : opts.tab === "closed"
        ? Promise.all([listReports(ctx, "ACTIONED"), listReports(ctx, "DISMISSED")]).then(([actioned, dismissed]) =>
            [...actioned, ...dismissed].sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime()),
          )
        : Promise.resolve([]),
    opts.tab === "audit" ? listAudit(ctx, { take: 200 }) : Promise.resolve([]),
  ]);
  return {
    openCount,
    // What the page shows: who, whether live, when, why. Not the operator's
    // email, which is theirs and not the school's.
    visits: visits.map(({ operatorEmail: _email, ...v }) => (void _email, { ...v, startedAt: iso(v.startedAt), expiresAt: iso(v.expiresAt), endedAt: isoOrNull(v.endedAt) })),
    reports: reports.map((g) => ({
      ...g,
      target: "createdAt" in g.target ? { ...g.target, createdAt: iso(g.target.createdAt) } : g.target,
      details: g.details.map((d) => ({ ...d, at: iso(d.at) })),
      firstAt: iso(g.firstAt),
      latestAt: iso(g.latestAt),
    })),
    audit: audit.map((a) => ({ ...a, at: iso(a.at) })),
  };
}

/* -------------------------------------------------------------------------- */
/* /admin/settings                                                             */
/* -------------------------------------------------------------------------- */

export async function adminSettings(ctx: Scoped) {
  const [school, directory, freshCandidates] = await Promise.all([
    db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: {
        notifAutoReadDays: true,
        notifExpireDays: true,
        name: true,
        code: true,
        logoPath: true,
        brandPrimary: true,
        contactEmail: true,
        contactPhone: true,
        website: true,
        addressLine: true,
        city: true,
        region: true,
        postalCode: true,
        country: true,
        gradeLow: true,
        gradeHigh: true,
        timezone: true,
        teachingDays: true,
      },
    }),
    readOwnProfileSettings(ctx),
    listContactCandidates(ctx),
  ]);
  // The current contact stays choosable even after leaving the candidate list.
  const contactCandidates =
    directory.admissionsContactMembershipId &&
    directory.contactName &&
    !freshCandidates.some((c) => c.membershipId === directory.admissionsContactMembershipId)
      ? [{ membershipId: directory.admissionsContactMembershipId, name: directory.contactName, role: "" }, ...freshCandidates]
      : freshCandidates;
  return {
    school: { ...school, teachingDays: parseTeachingDays(school.teachingDays) },
    directory,
    contactCandidates,
    notifDefaults: { autoReadDays: AUTO_READ_AFTER_DAYS, expireDays: EXPIRE_READ_AFTER_DAYS },
  };
}

/* -------------------------------------------------------------------------- */
/* /admin/vacancies                                                            */
/* -------------------------------------------------------------------------- */

export async function adminVacancies(ctx: Scoped, opts: { status: "open" | "closed" | "all" }) {
  const status = opts.status === "closed" ? "CLOSED" : opts.status === "all" ? "ALL" : "OPEN";
  const [postings, all] = await Promise.all([listOurPostings(ctx, { status }), listOurPostings(ctx, { status: "ALL" })]);
  return {
    postings: postings.map((p) => ({ ...p, createdAt: iso(p.createdAt), closedAt: isoOrNull(p.closedAt) })),
    counts: { open: all.filter((p) => p.status === "OPEN").length, closed: all.filter((p) => p.status !== "OPEN").length },
  };
}

/* -------------------------------------------------------------------------- */
/* /principal/leave, /principal/staff                                          */
/* -------------------------------------------------------------------------- */

export async function adminLeave(ctx: Scoped) {
  const [all, staff] = await Promise.all([
    schoolLeave(ctx),
    db.membership.findMany({
      where: { schoolId: ctx.schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      orderBy: { joinedAt: "asc" },
    }),
  ]);
  const pending = all.filter((row) => row.status === "PENDING");
  const decided = all.filter((row) => row.status !== "PENDING");
  const balances = await leaveBalancesFor(ctx.schoolId, pending.map((r) => r.applicantMembershipId));

  // Classes each applicant is due in, from BOTH the registers they mark and
  // the lessons they hold — the same union decideLeave writes cover rows for.
  const dutyCounts = new Map<string, number>();
  if (pending.length > 0) {
    const applicants = pending.map((p) => p.applicantMembershipId);
    const [registers, lessons] = await Promise.all([
      db.classTeacher.findMany({
        where: { schoolId: ctx.schoolId, canTakeAttendance: true, class: { archivedAt: null }, teacherMembershipId: { in: applicants } },
        select: { teacherMembershipId: true, classId: true },
      }),
      db.timetableSlot.findMany({
        where: { schoolId: ctx.schoolId, class: { archivedAt: null }, teacherMembershipId: { in: applicants } },
        select: { teacherMembershipId: true, classId: true },
        distinct: ["teacherMembershipId", "classId"],
      }),
    ]);
    const byApplicant = new Map<string, Set<string>>();
    for (const row of [...registers, ...lessons]) {
      if (!row.teacherMembershipId) continue;
      const set = byApplicant.get(row.teacherMembershipId) ?? new Set<string>();
      set.add(row.classId);
      byApplicant.set(row.teacherMembershipId, set);
    }
    for (const [membershipId, classes] of byApplicant) dutyCounts.set(membershipId, classes.size);
  }
  const suggestions = await Promise.all(
    pending.map((request) => coverCandidates(ctx, request.applicantMembershipId, request.fromDateKey, request.toDateKey)),
  );

  return {
    pending: pending.map((row, i) => ({
      ...shapeLeave(row),
      balance: balances.get(row.applicantMembershipId) ?? null,
      dutyClasses: dutyCounts.get(row.applicantMembershipId) ?? 0,
      suggestions: suggestions[i]!,
    })),
    decided: decided.map(shapeLeaveQuietly),
    staff: staff.map((person) => ({ membershipId: person.id, name: person.user.preferredName ?? person.user.name })),
  };
}

export async function adminStaff(ctx: Scoped, filters: { q?: string; role?: string; subject?: string }) {
  const allStaff = await db.membership.findMany({
    where: { schoolId: ctx.schoolId, role: { in: [...STAFF_ROLES] }, status: "ACTIVE", leftAt: null },
    select: {
      id: true,
      role: true,
      subjects: true,
      staffRecord: true,
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      classTeachers: { where: { role: "LEAD" }, select: { class: { select: { name: true } } } },
    },
    orderBy: [{ role: "asc" }],
  });
  allStaff.sort((a, b) => (a.user.preferredName ?? a.user.name).localeCompare(b.user.preferredName ?? b.user.name, undefined, { sensitivity: "base" }));

  const roleFilter = filters.role && (STAFF_ROLES as readonly string[]).includes(filters.role) ? filters.role : null;
  const subjectCounts = new Map<string, number>();
  for (const member of allStaff) for (const subject of readJsonArray<string>(member.subjects)) subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1);
  const subjectFilter = filters.subject && subjectCounts.has(filters.subject) ? filters.subject : null;
  const needle = (filters.q ?? "").trim().toLowerCase();
  const staff = allStaff.filter((member) => {
    if (roleFilter && member.role !== roleFilter) return false;
    if (subjectFilter && !readJsonArray<string>(member.subjects).includes(subjectFilter)) return false;
    if (needle) {
      const hay = [member.user.name, member.user.preferredName ?? "", member.staffRecord?.staffNumber ?? "", member.staffRecord?.designation ?? ""].join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  const balances = await leaveBalancesFor(ctx.schoolId, staff.map((m) => m.id));

  return {
    staff: staff.map((m) => ({
      membershipId: m.id,
      role: m.role,
      name: m.user.name,
      preferredName: m.user.preferredName,
      avatarKey: m.user.avatarKey,
      subjects: readJsonArray<string>(m.subjects),
      staffRecord: m.staffRecord
        ? {
            staffNumber: m.staffRecord.staffNumber,
            designation: m.staffRecord.designation,
            qualification: m.staffRecord.qualification,
            joinedOnKey: m.staffRecord.joinedOn ? dayKey(m.staffRecord.joinedOn) : null,
            leaveDaysPerYear: m.staffRecord.leaveDaysPerYear,
          }
        : null,
      leadClasses: m.classTeachers.map((ct) => ct.class.name),
      balance: balances.get(m.id) ?? null,
    })),
    total: allStaff.length,
    roleCounts: STAFF_ROLES.map((role) => ({ role, count: allStaff.filter((m) => m.role === role).length })).filter((o) => o.count > 0),
    subjectOptions: [...subjectCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([subject, count]) => ({ subject, count })),
  };
}
