import "server-only";
import {
  COLLEGE_KINDS,
  parseStreams,
  deadlineApplies,
  deadlineWindows,
  modulesForKind,
  REGULATOR_DEADLINES,
  SCHOOL_MODULES,
  tierYearPaise,
  type CollegeHealth,
  type InstitutionKind,
  type OperatorCollegeCalendar,
  type OperatorCollegeRow,
  type OperatorSchoolModules,
  type SchoolModuleCode,
} from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { notify } from "./notify";
import { sendStandingNotice } from "./email";
import { readJson } from "./json";
import { translator } from "./i18n/dictionary";
import { normaliseLocale } from "./i18n/locales";
import { DEFAULT_PREFS, revokeAllAccess, type ActiveContext, type UserPrefs } from "./session";
import { forTenant } from "./tenant-context";
import { assertSuperuser, withSchoolAccess } from "./superuser";
import { isAlwaysOn, switchModuleFor } from "./modules";
import { MODULE_META } from "./module-meta";
import { placementSummary } from "./placement-analytics";
import { gradeOf } from "./iqac-rules";
import { addDaysToKey, safeTimeZone, todayKey, zonedStartOfDay } from "./dates";

/**
 * THE OPERATOR'S COLLEGE CONSOLE (4 October 2026). Whoever runs the server
 * sees the colleges beside the schools — their regulators, programmes and
 * roll, their subscription at the college tiers — and how each is doing in
 * numbers; switches a module on or off for an institution on its behalf;
 * reads the regulators' calendar across every college and reminds each
 * college's IQAC and office as a window opens; and shuts a recruiter out of
 * every college at once.
 *
 * READS GO THROUGH THE ONE DOOR. The operator is above tenancy only for the
 * School, Invite and SchoolModule rows (SUPERUSER_TABLES) and the usage
 * samples; everything else a college holds is reached by binding that ONE
 * college with `withSchoolAccess` (superuser.ts), which notes the visit in
 * the college's visitor book at most once an hour — so a college always sees
 * that the platform looked — and each read writes `operator.read.college` in
 * the college's log with COUNTS ONLY, never a name (operator-oversight.ts's
 * rule). The numbers are the rows' own, or another builder's function
 * (placementSummary, the IQAC desk's stored CGPA and NAAC_BANDS); nothing
 * here is stored.
 *
 * WRITES ARE AUDITED TWICE, as every operator write is: the operator's own
 * unattributed row (schoolId NULL) and, for a module switch, the school's
 * own `school.module.on|off` with `byOperator: true`, its office told.
 */

/** The operator, bound to one school without a visit: a switch, not a look (plans.ts tells an office the same way). */
function asOperator<T>(session: ActiveContext, schoolId: string, work: () => Promise<T>): Promise<T> {
  return forTenant({ schoolIds: [schoolId], userId: session.user.id, joinCode: null, isSuperuser: true }, work);
}

type Refusal = { ok: false; errorKey: TranslationKey };

/* -------------------------------------------------------------------------- */
/* The colleges and their health                                               */
/* -------------------------------------------------------------------------- */

const COLLEGE_SELECT = {
  id: true,
  name: true,
  city: true,
  kind: true,
  streamsJson: true,
  timezone: true,
  isTestFixture: true,
  affiliatingUniversity: true,
  aisheCode: true,
  aicteApprovalRef: true,
  ugcApprovalRef: true,
  naacGrade: true,
  naacValidUntil: true,
  subscriptionStatus: true,
  subscriptionDueAt: true,
  plan: { select: { code: true, name: true } },
} as const;

const SUBSCRIPTION = ["TRIAL", "ACTIVE", "DUE", "SUSPENDED", "ENDED"] as const;
const dayOf = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export type CollegesOpts = {
  /** The ZZ fixtures too (the page's ?test=1). */
  fixtures?: boolean;
  /** Only these institutions (a test's own); fixtures included. */
  schoolIds?: string[];
  now?: Date;
};

/** One college's health in numbers, read inside its own binding. Exported for the test that checks it against the rows. */
export async function healthOf(schoolId: string, timezone: string, now: Date = new Date()): Promise<CollegeHealth> {
  const today = todayKey(timezone, now);
  const weekStart = addDaysToKey(today, -6);
  const [lectures, examFormsOpen, term, cycle, scholarshipsPending, grievancesPastDue, placement] = await Promise.all([
    db.lecture.findMany({ where: { schoolId, cancelledAt: null, dateKey: { gte: weekStart, lte: today } }, select: { _count: { select: { attendance: true } } } }),
    db.examSession.count({ where: { schoolId, status: "FORMS" } }),
    db.academicTerm.findFirst({ where: { schoolId, startsOn: { lte: today }, endsOn: { gte: today } }, orderBy: { startsOn: "desc" }, select: { name: true, startsOn: true, endsOn: true } }),
    db.accreditationCycle.findFirst({ where: { schoolId, status: { in: ["OPEN", "SUBMITTED"] } }, orderBy: { createdAt: "desc" }, select: { cgpa: true } }),
    db.scholarshipClaim.count({ where: { schoolId, status: { in: ["APPLIED", "SANCTIONED"] }, disbursedAt: null } }),
    db.grievance.count({ where: { schoolId, status: { in: ["OPEN", "ACKNOWLEDGED"] }, dueOn: { lt: today } } }),
    placementSummary(schoolId),
  ]);
  const resultsPublishedThisTerm = term
    ? await db.resultRun.count({ where: { schoolId, status: "PUBLISHED", publishedAt: { gte: zonedStartOfDay(term.startsOn, timezone), lt: zonedStartOfDay(addDaysToKey(term.endsOn, 1), timezone) } } })
    : null;
  return {
    lecturesScheduled: lectures.length,
    lecturesMarked: lectures.filter((l) => l._count.attendance > 0).length,
    examFormsOpen,
    resultsPublishedThisTerm,
    termName: term?.name ?? null,
    naac: cycle ? { cgpa: cycle.cgpa, grade: cycle.cgpa === null ? null : gradeOf(cycle.cgpa) } : null,
    placement,
    scholarshipsPending,
    grievancesPastDue,
  };
}

/**
 * Every college, by name, with its profile, programmes and intake, students
 * enrolled (ACTIVE STUDENT memberships on the roll), modules on, subscription,
 * tier and health. The real ones by default; the ZZ fixtures with `fixtures`.
 */
export async function listColleges(session: ActiveContext, opts: CollegesOpts = {}): Promise<{ today: string; items: OperatorCollegeRow[] }> {
  assertSuperuser(session);
  const now = opts.now ?? new Date();
  const schools = await db.school.findMany({
    where: { kind: { in: [...COLLEGE_KINDS] }, removedAt: null, ...(opts.schoolIds ? { id: { in: opts.schoolIds } } : opts.fixtures ? {} : { isTestFixture: false }) },
    orderBy: { name: "asc" },
    select: COLLEGE_SELECT,
  });
  const modules = await db.schoolModule.findMany({ where: { schoolId: { in: schools.map((s) => s.id) } }, select: { schoolId: true, module: true } });
  const items: OperatorCollegeRow[] = [];
  for (const s of schools) {
    const on = new Set(modules.filter((m) => m.schoolId === s.id).map((m) => m.module));
    const row = await withSchoolAccess(session, s.id, async () => {
      const [programmes, students, health] = await Promise.all([
        db.programme.findMany({ where: { schoolId: s.id, archivedAt: null }, orderBy: { code: "asc" }, select: { code: true, name: true, intake: true } }),
        db.membership.count({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
        // One row's unknown zone (A3-journeys-2) must not take down the list for every college: read it as India's.
        healthOf(s.id, safeTimeZone(s.timezone), now),
      ]);
      // The college's log says the platform read its numbers — counts only.
      await audit({
        schoolId: s.id,
        actorUserId: session.user.id,
        action: "operator.read.college",
        targetType: "School",
        targetId: s.id,
        meta: { programmes: programmes.length, students, lecturesScheduled: health.lecturesScheduled, grievancesPastDue: health.grievancesPastDue },
      });
      return { programmes, students, health };
    });
    items.push({
      id: s.id,
      name: s.name,
      city: s.city,
      kind: s.kind as InstitutionKind,
      // The college's streams (5 Oct 2026), chosen at onboarding.
      streams: parseStreams(s.streamsJson),
      isTestFixture: s.isTestFixture,
      affiliatingUniversity: s.affiliatingUniversity,
      aisheCode: s.aisheCode,
      regulators: { aicte: s.aicteApprovalRef, ugc: s.ugcApprovalRef, naacGrade: s.naacGrade, naacValidUntil: dayOf(s.naacValidUntil) },
      programmes: row.programmes,
      intake: row.programmes.reduce((sum, p) => sum + p.intake, 0),
      students: row.students,
      modulesOn: SCHOOL_MODULES.filter((m) => on.has(m)),
      subscription: { status: (SUBSCRIPTION as readonly string[]).includes(s.subscriptionStatus ?? "") ? (s.subscriptionStatus as (typeof SUBSCRIPTION)[number]) : null, dueAt: dayOf(s.subscriptionDueAt) },
      plan: s.plan,
      tierYearPaise: tierYearPaise(s.plan?.code, row.students),
      health: row.health,
    });
  }
  return { today: todayKey("UTC", now), items };
}

/* -------------------------------------------------------------------------- */
/* Modules on an institution's behalf                                          */
/* -------------------------------------------------------------------------- */

/** What this institution is offered (modulesForKind), on or off, since when, and whether the platform switched it on. */
export async function operatorSchoolModules(session: ActiveContext, schoolId: string): Promise<OperatorSchoolModules | null> {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { kind: true } });
  if (!school) return null;
  const rows = await db.schoolModule.findMany({ where: { schoolId }, select: { module: true, enabledAt: true, enabledByUserId: true } });
  const enablers = [...new Set(rows.map((r) => r.enabledByUserId).filter((id): id is string => Boolean(id)))];
  const members = enablers.length
    ? new Set((await asOperator(session, schoolId, () => db.membership.findMany({ where: { schoolId, userId: { in: enablers } }, select: { userId: true } }))).map((m) => m.userId))
    : new Set<string>();
  const byModule = new Map(rows.map((r) => [r.module, r]));
  return {
    kind: school.kind as InstitutionKind,
    modules: modulesForKind(school.kind).map((module) => {
      const row = byModule.get(module);
      return { module, on: Boolean(row), alwaysOn: isAlwaysOn(module, school.kind), enabledAt: row?.enabledAt.toISOString() ?? null, byPlatform: Boolean(row?.enabledByUserId && !members.has(row.enabledByUserId)) };
    }),
  };
}

/**
 * Switch one module for an institution, as the operator: the admin's own path
 * (switchModuleFor in modules.ts) with the same refusals — a college module
 * refused at a school, ACADEMICS kept on at a college — bound to that one
 * school. Audited in the school's log (school.module.on|off, byOperator) and
 * the operator's own (superuser.school.module); the office's admins are told.
 * Switching what is already so changes nothing and tells nobody.
 */
export async function setModuleAsOperator(session: ActiveContext, schoolId: string, module: SchoolModuleCode, on: boolean): Promise<{ ok: true; changed: boolean } | Refusal> {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, removedAt: true } });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };
  if (!(SCHOOL_MODULES as readonly string[]).includes(module)) return { ok: false, errorKey: "common.tryAgain" };
  let changed: boolean;
  try {
    ({ changed } = await asOperator(session, schoolId, () => switchModuleFor(schoolId, session.user.id, module, on, { byOperator: true })));
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key };
    throw error;
  }
  if (!changed) return { ok: true, changed: false };
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.module", targetType: "School", targetId: schoolId, meta: { schoolId, name: school.name, module, on } });

  // Told, best-effort: a notification that fails must not undo the switch.
  try {
    await asOperator(session, schoolId, async () => {
      const admins = await db.membership.findMany({ where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true, user: { select: { prefs: true } } }, distinct: ["userId"] });
      for (const admin of admins) {
        // The module's name in the reader's own language, as their notification is written.
        const t = translator(normaliseLocale(readJson<UserPrefs>(admin.user.prefs, DEFAULT_PREFS).locale));
        const vars = { module: t(MODULE_META[module].nameKey), school: school.name };
        await notify({
          userId: admin.userId,
          schoolId,
          kind: "SYSTEM",
          titleKey: on ? "operatorCollege.notifModuleOnTitle" : "operatorCollege.notifModuleOffTitle",
          titleVars: vars,
          bodyKey: on ? "operatorCollege.notifModuleOnBody" : "operatorCollege.notifModuleOffBody",
          bodyVars: vars,
          url: "/admin/settings/modules",
          meta: { event: "school.module.byOperator", module, on },
        });
      }
    });
  } catch (error) {
    console.error("[operator-college] module notification failed", error instanceof Error ? error.message : error);
  }
  return { ok: true, changed: true };
}

/* -------------------------------------------------------------------------- */
/* The regulators' calendar                                                    */
/* -------------------------------------------------------------------------- */

/** How far ahead the operator's calendar looks. */
export const REGULATOR_CALENDAR_DAYS = 120;
/** A college is reminded once a window is this close, or already open. */
export const REGULATOR_REMIND_AHEAD_DAYS = 14;

async function collegeSubjects(where: { fixtures?: boolean; schoolIds?: string[] }) {
  const schools = await db.school.findMany({
    where: { kind: { in: [...COLLEGE_KINDS] }, removedAt: null, ...(where.schoolIds ? { id: { in: where.schoolIds } } : where.fixtures ? {} : { isTestFixture: false }) },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true, timezone: true, aicteApprovalRef: true, naacGrade: true, streamsJson: true },
  });
  const iqac = new Set((await db.schoolModule.findMany({ where: { schoolId: { in: schools.map((s) => s.id) }, module: "IQAC" }, select: { schoolId: true } })).map((r) => r.schoolId));
  // The streams (5 Oct 2026) decide which rows apply where they are recorded: a law college is not reminded of AICTE's extension.
  return schools.map(({ streamsJson, ...s }) => ({ ...s, streams: parseStreams(streamsJson), iqacOn: iqac.has(s.id) }));
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * The next 120 days across every college: one entry per row of
 * REGULATOR_DEADLINES and window, with the colleges it applies to. Read from
 * the School and SchoolModule rows only (the operator's own tables), so
 * opening the calendar is no visit to any college.
 */
export async function regulatorCalendar(session: ActiveContext, opts: { fixtures?: boolean; schoolIds?: string[]; now?: Date } = {}): Promise<OperatorCollegeCalendar> {
  assertSuperuser(session);
  const today = todayKey("UTC", opts.now ?? new Date());
  const until = addDaysToKey(today, REGULATOR_CALENDAR_DAYS);
  const colleges = await collegeSubjects(opts);
  const items: OperatorCollegeCalendar["items"] = [];
  for (const row of REGULATOR_DEADLINES) {
    const applies = colleges.filter((c) => deadlineApplies(row, c));
    if (applies.length === 0) continue;
    for (const w of deadlineWindows(row, today, until)) {
      items.push({
        code: row.code,
        from: w.from,
        to: w.to,
        openNow: w.from <= today && today <= w.to,
        daysToOpen: Math.max(0, daysBetween(today, w.from)),
        remind: [...row.remind],
        source: row.source,
        colleges: applies.map((c) => ({ schoolId: c.id, name: c.name, kind: c.kind })),
      });
    }
  }
  items.sort((a, b) => a.from.localeCompare(b.from) || a.code.localeCompare(b.code));
  return { today, until, items };
}

export type RegulatorRemindOutcome = { colleges: number; windows: number; reminded: number; muted: number; people: number };

/**
 * accounts:tidy's daily question (no job of its own, which would cost a name
 * on the jobs page and a line in three dictionaries): for each real college,
 * every window of a row that applies to it and is open or opens within
 * fourteen days is told to the college's IQAC coordinators and admins (as the
 * row names) — ONCE per college, row and window. The memory is the
 * operator's own log, a `superuser.regulator.remind` row whose target is
 * "college:code:window-start", as remindSubscriptions keeps its week. A
 * scope narrows to a test's institutions (fixtures included); unscoped, the
 * fixtures are never reminded.
 */
export async function remindRegulatorDeadlines(now: Date = new Date(), scope: { schoolIds?: string[] } = {}): Promise<RegulatorRemindOutcome> {
  const colleges = await collegeSubjects({ schoolIds: scope.schoolIds });
  const out: RegulatorRemindOutcome = { colleges: colleges.length, windows: 0, reminded: 0, muted: 0, people: 0 };
  for (const college of colleges) {
    const today = todayKey(safeTimeZone(college.timezone), now);
    const horizon = addDaysToKey(today, REGULATOR_REMIND_AHEAD_DAYS);
    for (const row of REGULATOR_DEADLINES) {
      if (!deadlineApplies(row, college)) continue;
      for (const w of deadlineWindows(row, today, horizon)) {
        out.windows++;
        const targetId = `${college.id}:${row.code}:${w.from}`;
        const done = await db.auditLog.findFirst({ where: { action: "superuser.regulator.remind", targetId }, select: { id: true } });
        if (done) {
          out.muted++;
          continue;
        }
        const members = await db.membership.findMany({
          where: { schoolId: college.id, role: { in: [...row.remind] }, status: "ACTIVE", leftAt: null },
          select: { userId: true, role: true },
        });
        // One notice a person: the IQAC desk's link when they hold that role, else the office's.
        const people = new Map<string, string>();
        for (const m of members) if (!people.has(m.userId) || m.role === "IQAC") people.set(m.userId, m.role);
        const open = w.from <= today;
        const vars = { from: w.from, to: w.to, college: college.name };
        for (const [userId, role] of people) {
          await notify({
            userId,
            schoolId: college.id,
            kind: "SYSTEM",
            titleKey: `operatorCollege.deadline.${row.code}` as const,
            titleVars: vars,
            bodyKey: open ? "operatorCollege.remindBodyOpen" : "operatorCollege.remindBodySoon",
            bodyVars: vars,
            url: role === "IQAC" ? "/iqac" : "/admin/settings/college",
            meta: { event: "regulator.deadline", code: row.code, from: w.from },
          }).catch((error) => console.error("[accounts:tidy] regulator notify", error instanceof Error ? error.message : error));
        }
        await audit({ schoolId: null, actorUserId: null, action: "superuser.regulator.remind", targetType: "RegulatorWindow", targetId, meta: { schoolId: college.id, name: college.name, code: row.code, from: w.from, to: w.to, people: people.size } });
        out.reminded++;
        out.people += people.size;
      }
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Recruiters across every college                                             */
/* -------------------------------------------------------------------------- */

export type RecruiterRow = { userId: string; name: string; email: string | null; companyName: string; createdAt: Date; disabledAt: Date | null; liveSessions: number };

/** Every recruiter account, disabled first, then by company. RecruiterProfile belongs to no college (no policy, like ExpertProfile). */
export async function listRecruiters(session: ActiveContext): Promise<RecruiterRow[]> {
  assertSuperuser(session);
  const profiles = await db.recruiterProfile.findMany({
    orderBy: [{ companyName: "asc" }],
    select: { userId: true, companyName: true, createdAt: true, disabledAt: true, user: { select: { name: true, email: true } } },
  });
  if (profiles.length === 0) return [];
  const sessions = await db.session.groupBy({ by: ["userId"], where: { userId: { in: profiles.map((p) => p.userId) }, revokedAt: null, expiresAt: { gt: new Date() } }, _count: { _all: true } });
  const live = new Map(sessions.map((s) => [s.userId, s._count._all]));
  return profiles
    .map((p) => ({ userId: p.userId, name: p.user.name, email: p.user.email, companyName: p.companyName, createdAt: p.createdAt, disabledAt: p.disabledAt, liveSessions: live.get(p.userId) ?? 0 }))
    .sort((a, b) => Number(Boolean(b.disabledAt)) - Number(Boolean(a.disabledAt)) || a.companyName.localeCompare(b.companyName));
}

/**
 * Shut a recruiter out of every college at once, or let them back. Disabling
 * sets RecruiterProfile.disabledAt — which every recruiter door already
 * refuses (myRecruiterProfile, requireRecruiter, placement-recruiter.ts's
 * recruiterOf) — and ends every session, unspent token and push registration
 * the way the operator's "sign an admin out everywhere" does. The account
 * itself stays (it may also be somebody's alumnus or parent): only the
 * recruiter's standing changes. Audited in the operator's own log with the
 * reason; idempotent.
 */
export async function setRecruiterStanding(session: ActiveContext, userId: string, input: { disabled: boolean; reason?: string }): Promise<{ ok: true; sessionsEnded: number } | Refusal> {
  assertSuperuser(session);
  const profile = await db.recruiterProfile.findUnique({ where: { userId }, select: { companyName: true, disabledAt: true } });
  if (!profile) return { ok: false, errorKey: "operatorCollege.refuseNoRecruiter" };
  if (Boolean(profile.disabledAt) === input.disabled) return { ok: true, sessionsEnded: 0 };
  await db.recruiterProfile.update({ where: { userId }, data: { disabledAt: input.disabled ? new Date() : null } });
  const sessionsEnded = input.disabled ? await revokeAllAccess(userId, { tokens: true }) : 0;
  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: input.disabled ? "superuser.recruiter.disable" : "superuser.recruiter.enable",
    targetType: "User",
    targetId: userId,
    meta: { companyName: profile.companyName, sessionsEnded, reason: input.reason?.trim() || null },
  });
  await tellStanding(userId, "RECRUITER", input.disabled, input.reason);
  return { ok: true, sessionsEnded };
}

/**
 * AN EXPERT CLOSED OR OPENED AGAIN (G4-28, risks batch 5 Oct 2026), the recruiter's rule for the other outside
 * account: closed, they sign in to nothing (auth-login.ts says why), every session and token ends, no school finds
 * or books them (the marketplace and the booking path read `disabledAt`), and they are told by email. What a school
 * already arranged with them stays as the unpublishing rule keeps it (superuser.ts setExpertStanding): the school
 * cancels it. Publishing and verifying are untouched; opening again restores the sign-in. Audited
 * superuser.expert.disable|enable with the reason.
 */
export async function setExpertAccess(session: ActiveContext, profileId: string, input: { disabled: boolean; reason?: string }): Promise<{ ok: true; sessionsEnded: number } | Refusal> {
  assertSuperuser(session);
  const profile = await db.expertProfile.findUnique({ where: { id: profileId }, select: { userId: true, disabledAt: true, user: { select: { name: true } } } });
  if (!profile) return { ok: false, errorKey: "riskDecisions.refuseNoExpert" };
  if (Boolean(profile.disabledAt) === input.disabled) return { ok: true, sessionsEnded: 0 };
  await db.expertProfile.update({ where: { id: profileId }, data: { disabledAt: input.disabled ? new Date() : null } });
  const sessionsEnded = input.disabled ? await revokeAllAccess(profile.userId, { tokens: true }) : 0;
  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: input.disabled ? "superuser.expert.disable" : "superuser.expert.enable",
    targetType: "ExpertProfile",
    targetId: profileId,
    meta: { name: profile.user.name, sessionsEnded, reason: input.reason?.trim() || null },
  });
  await tellStanding(profile.userId, "EXPERT", input.disabled, input.reason);
  return { ok: true, sessionsEnded };
}

/** The closed (or reopened) outside account told by email in its own language; a mail that fails is logged, the decision stands. */
async function tellStanding(userId: string, kind: "RECRUITER" | "EXPERT", disabled: boolean, reason?: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, prefs: true } });
  if (!user?.email) return;
  const locale = normaliseLocale(readJson<UserPrefs>(user.prefs, DEFAULT_PREFS).locale);
  const t = translator(locale);
  const why = reason?.trim();
  const lines = disabled
    ? [t(kind === "RECRUITER" ? "riskDecisions.closedBodyRecruiter" : "riskDecisions.closedBodyExpert"), ...(why ? [t("riskDecisions.closedReason", { reason: why })] : []), t("riskDecisions.closedWriteBack")]
    : [t("riskDecisions.reopenedBody")];
  const subject = disabled ? t(kind === "RECRUITER" ? "riskDecisions.closedSubjectRecruiter" : "riskDecisions.closedSubjectExpert") : t("riskDecisions.reopenedSubject");
  await sendStandingNotice({ to: user.email, subject, lines, locale }).catch((error) => console.error("[operator-college] standing notice failed", error));
}
