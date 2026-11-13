import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { consentApplies, studentsGuardiansMaySee } from "./student-consent";
import { notify, notifyGuardians } from "./notify";
import { audit } from "./audit";
import type { ActiveContext } from "./session";
import { fitsAnyTenant, readerTenants } from "./competition-audience"; // college-content (12 Oct 2026)
// competitions on the calendar (decision 0007, 6 Nov 2026)
import { COMPETITION_INTERNAL_BOARDS, type CompetitionBoard, type CompetitionInternalBoard, type PlanCode } from "@edulink/contracts";
import { assertChildMayUse, assertFeatureOn, featureOn, lockOf } from "./platform-features";
import { syncCalendarRow } from "./competition-events";
import { institutionKindOf } from "./modules";
import { COLLEGE_GRADE } from "./competition-crawl-rules";
import { PLATFORM_ZONE } from "./competition-forms";
import { isCollegeKind } from "@edulink/contracts";

/**
 * The competitions marketplace.
 *
 * ONE THING HERE IS UNLIKE EVERYTHING ELSE IN THIS CODEBASE, so it is worth
 * stating before anything else: a competition is NOT school-owned. `Competition`
 * carries no `schoolId` and no row-level policy (see the foot of prisma/rls.sql);
 * `organizerSchoolId` is nullable because most competitions come from outside
 * any school entirely. That is what makes it a marketplace rather than a notice
 * board — a maths challenge is the same maths challenge at both schools, and
 * copying it per school would mean two rows that drift apart.
 *
 * THE ENTRIES ARE THE OPPOSITE, and the split is the whole design. A
 * `CompetitionEntry` names a child, so it carries `schoolId` and IS policied.
 * Riverside sees every competition and only Riverside's entries. A shared
 * catalogue and private participation, enforced by Postgres rather than by
 * remembering to write a `WHERE`.
 *
 * PARENT CONSENT IS NOT DECORATION. Entering a competition sends a child's name
 * out of the school, usually to an organisation neither the school nor this app
 * controls, and `requiresParentConsent` defaults to TRUE in the schema for that
 * reason. So an entry starts life inert: it exists, the child can see they asked
 * for it, and it counts for nothing until a guardian says yes. `enteredCount`
 * and every "who is going" list therefore ask for consent, not for existence —
 * an entry that skipped the gate must never be able to pass for a real one.
 *
 * SINCE DECISION 0007 (6 November 2026) a school's own competition is a CALENDAR EVENT (competition-events.ts
 * makes the Competition and its Holiday row together) and the family enrols from the agenda: a pupil for
 * themself, as before, or a GUARDIAN for their own child, which counts as the guardian's consent. The office's
 * `enrolmentOpen` switch stands above the dates, and the office may choose an INTERNAL BOARD (`internalBoard`:
 * OFF, STAFF or SCHOOL) of the school's own entries — read under the tenant fence and the person binding, never
 * across schools. The platform's marketplace (organizerSchoolId null) is behind the COMPETITIONS feature switch
 * and in the STUDENT plan; a school's own competitions are never behind either.
 */

export type CompetitionSummary = {
  id: string;
  title: string;
  summary: string;
  organizerName: string;
  organizerSchoolId: string | null;
  subject: string | null;
  gradeLow: string | null;
  gradeHigh: string | null;
  verified: boolean;
  requiresParentConsent: boolean;
  registrationClosesAt: Date | null;
  startsAt: Date | null;
  endsAt: Date | null;
  /** Null when this caller has no entry. Students and guardians only. */
  entry: EntryState | null;
  /** decision 0007: the office's switches on a school's own competition, and its calendar row. */
  enrolmentOpen: boolean;
  internalBoard: CompetitionInternalBoard;
  calendarEntryId: string | null;
  /**
   * competitions-crawler (12 Oct 2026): where a competition suggested from the web was read, and when the
   * crawler last checked its page; null for one posted by hand. It is shown, never a reason to treat the
   * competition differently: the same consent rule and the same link rule hold.
   */
  source: CrawlSource | null;
  /** college-content (12 Oct 2026): SCHOOL | COLLEGE, or null (not set: everyone); a COLLEGE one's streams. */
  audience: string | null;
  streams: string[];
};

export type CrawlSource = { organiser: string; lastCheckedAt: Date };

const CRAWL_SOURCE = { select: { matchedExisting: true, lastCheckedAt: true, source: { select: { organiser: true } } } } as const;

function crawlSourceOf(crawl: { matchedExisting: boolean; lastCheckedAt: Date; source: { organiser: string } } | null | undefined): CrawlSource | null {
  return crawl && !crawl.matchedExisting ? { organiser: crawl.source.organiser, lastCheckedAt: crawl.lastCheckedAt } : null;
}

export type EntryState = {
  id: string;
  status: string;
  awaitingConsent: boolean;
  consentedAt: Date | null;
  studentMembershipId: string;
  studentName: string;
  submissionUrl: string | null;
  scoreMilli: number | null;
  rank: number | null;
};

/**
 * Whether registration is still open.
 *
 * An absent `registrationClosesAt` means "no stated deadline", which is open —
 * not closed. Reading a missing date as a closed door would hide every
 * competition that simply never published one.
 */
export function registrationOpen(
  competition: { registrationOpensAt: Date | null; registrationClosesAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (competition.registrationOpensAt && competition.registrationOpensAt > now) return false;
  if (competition.registrationClosesAt && competition.registrationClosesAt < now) return false;
  return true;
}

/**
 * Whether anyone may enrol now: the office's switch (decision 0007; off, the event is for information) AND the
 * dates. A platform competition has the switch on, so for it this is `registrationOpen` as before.
 */
export function enrolmentAllowed(
  competition: { enrolmentOpen: boolean; registrationOpensAt: Date | null; registrationClosesAt: Date | null },
  now: Date = new Date(),
): boolean {
  return competition.enrolmentOpen && registrationOpen(competition, now);
}

/** The office's board setting as the row holds it, read as the coded list. */
export function boardSettingOf(value: string): CompetitionInternalBoard {
  return (COMPETITION_INTERNAL_BOARDS as readonly string[]).includes(value) ? (value as CompetitionInternalBoard) : "OFF";
}

/**
 * TA-103: a student's grade as a platform competition's band reads it. At a college a degree student's year of
 * study is college (13), but a junior college's class 11 or 12 (ZZ Vidya's) is that class, as at a school.
 */
export function platformBandGrade(collegeKind: boolean, gradeLevel: string | null | undefined): string | null | undefined {
  if (!collegeKind) return gradeLevel;
  const g = gradeLevel?.trim();
  return g === "11" || g === "12" ? g : COLLEGE_GRADE;
}

/** Whether a pupil's class is inside the competition's band; a band left open, or a grade not known, fits. */
export function gradeFits(competition: { gradeLow: string | null; gradeHigh: string | null }, gradeLevel: string | null | undefined): boolean {
  if (!competition.gradeLow && !competition.gradeHigh) return true;
  const grade = Number(gradeLevel ?? NaN);
  if (!Number.isFinite(grade)) return true;
  const low = competition.gradeLow ? Number(competition.gradeLow) : NaN;
  const high = competition.gradeHigh ? Number(competition.gradeHigh) : NaN;
  if (Number.isFinite(low) && grade < low) return false;
  if (Number.isFinite(high) && grade > high) return false;
  return true;
}

export type EnrolState = "OPEN" | "ENROLLED" | "CONSENT_WAITING" | "CLOSED";

/**
 * What the agenda's row offers (decision 0007): ENROLLED or CONSENT_WAITING by the pupil's entry, else OPEN while
 * the office's switch, the dates and the class band allow, else CLOSED.
 */
export function enrolStateFor(
  competition: { enrolmentOpen: boolean; registrationOpensAt: Date | null; registrationClosesAt: Date | null; gradeLow: string | null; gradeHigh: string | null; requiresParentConsent: boolean; status: string },
  entry: { parentConsentAt: Date | null } | null,
  gradeLevel: string | null | undefined,
  now: Date = new Date(),
): EnrolState {
  if (entry) return competition.requiresParentConsent && entry.parentConsentAt === null ? "CONSENT_WAITING" : "ENROLLED";
  if (competition.status !== "PUBLISHED") return "CLOSED";
  if (!enrolmentAllowed(competition, now)) return "CLOSED";
  if (!gradeFits(competition, gradeLevel)) return "CLOSED";
  return "OPEN";
}

/**
 * Which schools' OWN competitions this session may see.
 *
 * The visibility rule of the whole surface: a school-posted competition
 * belongs to that school's students, a platform-posted one to everybody. For
 * most sessions the set is just the active school. A guardian gets every
 * school an ACTIVE guardianship points at — via `studentSchoolId`, which is
 * denormalised on Guardianship precisely so this question can be answered
 * without a policied join — because the consent notification links straight
 * to the competition and a parent must be able to follow it whatever their
 * active context happens to be.
 */
async function visibleSchoolIds(session: ActiveContext): Promise<string[]> {
  const ids = new Set<string>();
  if (session.schoolId) ids.add(session.schoolId);
  if (session.role === "PARENT" || !session.schoolId) {
    const guardianships = await db.guardianship.findMany({
      where: { parentUserId: session.user.id, status: "ACTIVE" },
      select: { studentSchoolId: true },
    });
    for (const g of guardianships) ids.add(g.studentSchoolId);
  }
  return [...ids];
}

export type CompetitionSections = {
  /** Posted by this school's admins — its own students only. */
  school: CompetitionSummary[];
  /** Posted by the platform (operator or app admin) — every school. Empty while the COMPETITIONS feature is off. */
  platform: CompetitionSummary[];
  /**
   * decision 0007: the plan this reader lacks for the platform's competitions while the feature is on (a pupil
   * without the STUDENT plan), or null. The page draws the plan card where the platform section would be; the
   * school's own competitions above it are never locked.
   */
  platformLock: PlanCode | null;
};

/**
 * The catalogue, in two sections: the reader's own school's competitions and
 * the platform's. A competition another school posted for its own students is
 * not a third section — it is not served at all, which is the point.
 */
export async function listCompetitions(
  session: ActiveContext,
  opts: { openOnly?: boolean } = {},
): Promise<CompetitionSections> {
  const schoolIds = await visibleSchoolIds(session);
  // decision 0007: the marketplace is behind the platform's COMPETITIONS switch; the school's own never are.
  const marketplaceOn = await featureOn("COMPETITIONS");
  const platformLock = marketplaceOn ? await lockOf("COMPETITIONS", session) : null;

  const competitions = await db.competition.findMany({
    where: {
      status: "PUBLISHED",
      OR: [...(marketplaceOn && platformLock === null ? [{ organizerSchoolId: null }] : []), { organizerSchoolId: { in: schoolIds } }],
    },
    orderBy: [{ registrationClosesAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { crawl: CRAWL_SOURCE, calendarEntry: { select: { id: true } } },
  });

  const now = new Date();
  // college-content (12 Oct 2026): a platform competition lists only where its audience fits (a school's SCHOOL ones, a
  // college's COLLEGE ones of its streams; a guardian's, any child's school's); one with no audience set lists everywhere.
  const tenants = await readerTenants(schoolIds);
  const fitting = competitions.filter((c) => c.organizerSchoolId !== null || fitsAnyTenant(c, tenants));
  const visible = opts.openOnly
    ? fitting.filter((c) => registrationOpen(c, now))
    : fitting;

  const entries = await entriesFor(session, visible.map((c) => c.id));

  const summaries = visible.map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    organizerName: c.organizerName,
    organizerSchoolId: c.organizerSchoolId,
    subject: c.subject,
    gradeLow: c.gradeLow,
    gradeHigh: c.gradeHigh,
    verified: c.verified,
    requiresParentConsent: c.requiresParentConsent,
    registrationClosesAt: c.registrationClosesAt,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    entry: entries.get(c.id) ?? null,
    enrolmentOpen: c.enrolmentOpen,
    internalBoard: boardSettingOf(c.internalBoard),
    calendarEntryId: c.calendarEntry?.id ?? null,
    source: crawlSourceOf(c.crawl),
    // college-content (12 Oct 2026)
    audience: c.audience,
    streams: c.streams,
  }));

  return {
    school: summaries.filter((c) => c.organizerSchoolId !== null),
    platform: summaries.filter((c) => c.organizerSchoolId === null),
    platformLock,
  };
}

/**
 * One competition, with everything the caller is allowed to know about it.
 *
 * A DRAFT or ARCHIVED competition is NOT FOUND rather than forbidden, for the
 * same reason as everywhere else: a distinguishable error confirms the row
 * exists. The organising school's own admins are the exception — they need to
 * see their draft to publish it.
 */
export async function getCompetition(session: ActiveContext, competitionId: string) {
  const found = await db.competition.findUnique({ where: { id: competitionId }, include: { crawl: CRAWL_SOURCE, calendarEntry: { select: { id: true } }, organizerSchool: { select: { timezone: true } } } });
  if (!found) throw new AccessError("access.competitionNotFound", "NOT_FOUND");
  const { crawl, calendarEntry, organizerSchool, ...competition } = found;

  // decision 0007: a platform competition is not here while the marketplace is off (FeatureOffError, NOT_FOUND), and
  // meets the plan (PlanRequiredError) for a role whose plan carries it; the school's own are never asked.
  if (competition.organizerSchoolId === null) await assertFeatureOn("COMPETITIONS", session);

  const isOrganiser =
    session.role === "ADMIN" &&
    session.schoolId !== null &&
    competition.organizerSchoolId === session.schoolId;

  if (competition.status !== "PUBLISHED" && !isOrganiser) {
    throw new AccessError("access.competitionNotFound", "NOT_FOUND");
  }

  // college-content (12 Oct 2026): a platform competition for another audience is not found either, as the list does not show it.
  if (competition.organizerSchoolId === null && !fitsAnyTenant(competition, await readerTenants(await visibleSchoolIds(session)))) {
    throw new AccessError("access.competitionNotFound", "NOT_FOUND");
  }

  // Another school's own competition is NOT FOUND, not forbidden — the same
  // no-confirmation rule as drafts, and the same visibility rule as the list.
  if (competition.organizerSchoolId !== null && !isOrganiser) {
    const schoolIds = await visibleSchoolIds(session);
    if (!schoolIds.includes(competition.organizerSchoolId)) {
      throw new AccessError("access.competitionNotFound", "NOT_FOUND");
    }
  }

  const entries = await entriesFor(session, [competition.id]);

  return {
    ...competition,
    internalBoard: boardSettingOf(competition.internalBoard),
    calendarEntryId: calendarEntry?.id ?? null,
    source: crawlSourceOf(crawl),
    /**
     * TA-319: the zone its days are read in: the organising school's (a calendar event's start is that school's
     * midnight, the evening before in UTC), or India's for the platform's. The page prints its dates in it.
     */
    timeZone: organizerSchool?.timezone ?? PLATFORM_ZONE,
    isOrganiser,
    /** The office's switch and the dates together (decision 0007). */
    open: enrolmentAllowed(competition),
    acceptingWork: submissionOpen(competition),
    entry: entries.get(competition.id) ?? null,
    /** Only ever this school's, because CompetitionEntry is policied. */
    enteredCount: await db.competitionEntry.count({
      where: {
        competitionId: competition.id,
        // Consent is the bar only where the competition asks for it; a
        // consent-free competition never stamps it, and counted nobody.
        ...(competition.requiresParentConsent ? { parentConsentAt: { not: null } } : {}),
      },
    }),
  };
}

/**
 * The caller's own entries, keyed by competition.
 *
 * A STUDENT gets their own. A PARENT gets their children's — which is what makes
 * the consent request findable: they are told about it, and they land on a page
 * that already knows which child it is about.
 */
async function entriesFor(
  session: ActiveContext,
  competitionIds: string[],
): Promise<Map<string, EntryState>> {
  const found = new Map<string, EntryState>();
  if (competitionIds.length === 0) return found;

  const membershipIds = await ownStudentMembershipIds(session);
  if (membershipIds.length === 0) return found;

  const rows = await db.competitionEntry.findMany({
    where: {
      competitionId: { in: competitionIds },
      studentMembershipId: { in: membershipIds },
    },
    include: { student: { include: { user: { select: { name: true, preferredName: true } } } }, competition: { select: { requiresParentConsent: true } } },
  });

  for (const row of rows) {
    found.set(row.competitionId, {
      id: row.id,
      status: row.status,
      // TA-100: waiting only where the competition asks for a guardian's yes; a consent-free one never stamps it.
      awaitingConsent: row.competition.requiresParentConsent && row.parentConsentAt === null,
      consentedAt: row.parentConsentAt,
      studentMembershipId: row.studentMembershipId,
      studentName: row.student.user.preferredName ?? row.student.user.name,
      submissionUrl: row.submissionUrl,
      scoreMilli: row.scoreMilli,
      rank: row.rank,
    });
  }
  return found;
}

async function ownStudentMembershipIds(session: ActiveContext): Promise<string[]> {
  if (session.role === "STUDENT" && session.membershipId) return [session.membershipId];
  if (session.role === "PARENT") {
    const guardianships = await db.guardianship.findMany({
      where: { parentUserId: session.user.id, status: "ACTIVE" },
      select: { studentMembershipId: true },
    });
    // An adult college student's entries and results are theirs until they grant RESULTS (TA-099).
    return studentsGuardiansMaySee(guardianships.map((g) => g.studentMembershipId), "RESULTS");
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Entering                                                                    */
/* -------------------------------------------------------------------------- */

export type EnterResult = { entryId: string; awaitingConsent: boolean };

/**
 * A child asks to enter — or, since decision 0007, a guardian enrols their own child.
 *
 * Deliberately idempotent: the unique constraint on
 * (competitionId, studentMembershipId) already makes a second press impossible,
 * so this returns the existing entry rather than an error. A child pressing a
 * button twice because the first tap felt slow should not be told off.
 *
 * A PUPIL'S entry is created WITHOUT consent even when a guardian will obviously
 * give it. Nothing on the pupil's path may set `parentConsentAt` — only a
 * guardian does, through `giveConsent` or by enrolling the child themself here,
 * and only once proved to be that child's guardian (`assertGuardianAccess`). A
 * GUARDIAN'S enrolment IS the consent: the entry is made with `parentConsentAt`
 * and `parentConsentBy` stamped, and a pupil's entry still waiting is stamped
 * rather than refused. A pupil's body naming a child is ignored: they enrol
 * themself and nobody else.
 *
 * The office's `enrolmentOpen` switch stands above the dates (enrolmentAllowed);
 * the platform's competitions are behind the COMPETITIONS feature and, for a
 * pupil, the STUDENT plan — a guardian's own role needs no plan, but the CHILD
 * must hold it (assertChildMayUse), as for a child's practice.
 */
export async function enterCompetition(
  session: ActiveContext,
  competitionId: string,
  opts: { studentMembershipId?: string | null } = {},
): Promise<EnterResult> {
  let who: { studentMembershipId: string; schoolId: string; gradeLevel: string | null; byGuardian: boolean };
  if (session.role === "STUDENT" && session.membershipId && session.schoolId) {
    const me = await db.membership.findUnique({
      where: { id: session.membershipId },
      select: { gradeLevel: true, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { gradeLevel: true } } }, take: 1 } },
    });
    who = { studentMembershipId: session.membershipId, schoolId: session.schoolId, gradeLevel: me?.gradeLevel ?? me?.enrollments[0]?.class.gradeLevel ?? null, byGuardian: false };
  } else if (session.role === "PARENT") {
    if (!opts.studentMembershipId) throw new AccessError("competitions.chooseAChild");
    // Throws NOT_FOUND when this is not their child: a route param cannot widen a guardian past their own.
    const link = await assertGuardianAccess(session.user.id, opts.studentMembershipId);
    who = { studentMembershipId: link.studentMembershipId, schoolId: link.student.schoolId, gradeLevel: link.student.gradeLevel, byGuardian: true };
  } else {
    throw new AccessError("access.onlyAStudentCanEnterACompetition");
  }

  // The WHERE carries the visibility rule, so another school's competition is
  // indistinguishable from one that does not exist — entering is gated by the
  // same line that gates seeing.
  const competition = await db.competition.findFirst({
    where: {
      id: competitionId,
      status: "PUBLISHED",
      OR: [{ organizerSchoolId: null }, { organizerSchoolId: who.schoolId }],
    },
  });
  if (!competition) throw new AccessError("access.competitionNotFound", "NOT_FOUND");

  // decision 0007: the marketplace's switch and the pupil's plan, for a platform competition alone.
  if (competition.organizerSchoolId === null) {
    if (who.byGuardian) await assertChildMayUse("COMPETITIONS", who.studentMembershipId);
    else await assertFeatureOn("COMPETITIONS", session);
  }

  if (!enrolmentAllowed(competition)) {
    throw new AccessError("access.entriesForThisCompetitionHaveClosed");
  }

  // The grade band, when the organiser set one and the pupil's grade is
  // known: a Class 3 child cannot enter a Classes 9–12 olympiad.
  // TA-103: a platform competition's band is the platform's convention (classes 1 to 12, college 13), so a college
  // student is 13 there whatever year of study their membership holds; a school's own band is read as it keeps them.
  const bandGrade = competition.organizerSchoolId === null ? platformBandGrade(isCollegeKind(await institutionKindOf(who.schoolId)), who.gradeLevel) : who.gradeLevel;
  if (!gradeFits(competition, bandGrade)) throw new AccessError("access.notForYourGrade");

  const now = new Date();
  const existing = await db.competitionEntry.findUnique({
    where: { competitionId_studentMembershipId: { competitionId, studentMembershipId: who.studentMembershipId } },
  });
  // An adult at a college enters on their own word: no guardian is asked, and none could answer (TA-101).
  const ownWord = !who.byGuardian && (await consentApplies(who.studentMembershipId));
  if (existing) {
    if (ownWord && existing.parentConsentAt === null) {
      await db.competitionEntry.update({ where: { id: existing.id }, data: { parentConsentAt: now, parentConsentBy: session.user.id } });
      await refreshStanding(existing.schoolId, competitionId);
      // The adult's own word stands for the guardian's yes, on the record as giveConsent's is.
      await audit({ schoolId: existing.schoolId, actorUserId: session.user.id, action: "competition.consent", meta: { entryId: existing.id, competitionId, by: "STUDENT" } });
      return { entryId: existing.id, awaitingConsent: false };
    }
    if (who.byGuardian && existing.parentConsentAt === null) {
      // The child asked first; the guardian's enrolment is their yes.
      await giveConsent(session, existing.id);
      return { entryId: existing.id, awaitingConsent: false };
    }
    return { entryId: existing.id, awaitingConsent: competition.requiresParentConsent && existing.parentConsentAt === null };
  }

  const entry = await db.competitionEntry.create({
    data: {
      competitionId,
      studentMembershipId: who.studentMembershipId,
      schoolId: who.schoolId,
      status: "REGISTERED",
      ...(who.byGuardian || ownWord ? { parentConsentAt: now, parentConsentBy: session.user.id } : {}),
    },
  });

  await audit({
    schoolId: who.schoolId,
    actorUserId: session.user.id,
    action: "competition.enter",
    meta: { competitionId, entryId: entry.id, title: competition.title, by: who.byGuardian ? "PARENT" : "STUDENT", studentMembershipId: who.studentMembershipId },
  });

  if (who.byGuardian) {
    // The child learns they are in, as they do when a guardian says yes to their own ask.
    const student = await db.membership.findUnique({ where: { id: who.studentMembershipId }, select: { userId: true } });
    if (student) {
      await notify({
        userId: student.userId,
        schoolId: who.schoolId,
        kind: "COMPETITION",
        titleKey: "notifTitle.youAreEntered",
        titleVars: { competition: competition.title },
        bodyKey: "notifBody.grownUpEnrolledYou",
        url: `/competitions/${competitionId}`,
      });
    }
    return { entryId: entry.id, awaitingConsent: false };
  }

  if (competition.requiresParentConsent && !ownWord) {
    // The one link that proves this moved: without it a child presses "Enter"
    // and nothing whatsoever happens anywhere a grown-up can see.
    await notifyGuardians(who.studentMembershipId, (childName) => ({
      schoolId: who.schoolId,
      kind: "COMPETITION",
      titleKey: "notifTitle.childWantsToEnter",
      titleVars: { name: childName, competition: competition.title },
      bodyKey: "notifBody.untilYouSayYes",
      url: `/competitions/${competitionId}`,
    }));
  }

  return { entryId: entry.id, awaitingConsent: competition.requiresParentConsent && !ownWord };
}

/**
 * A guardian says yes.
 *
 * `assertGuardianAccess` is the whole security of this function: it re-queries
 * the guardianship with the session's user id, so an entry id belonging to
 * somebody else's child simply does not resolve. A parent may consent for their
 * own children and nobody else's, and no route param can change that.
 */
export async function giveConsent(session: ActiveContext, entryId: string): Promise<void> {
  if (session.role !== "PARENT") throw new AccessError("access.onlyAGuardianCanGiveConsent");

  const entry = await db.competitionEntry.findUnique({
    where: { id: entryId },
    include: { competition: { select: { title: true } } },
  });
  if (!entry) throw new AccessError("access.entryNotFound", "NOT_FOUND");

  // Throws NOT_FOUND when this is not their child.
  await assertGuardianAccess(session.user.id, entry.studentMembershipId);

  if (entry.parentConsentAt) return; // Already given; pressing again is not an error.

  // TA-416: stamped only while still waiting, so two guardians pressing together stamp it, audit it and tell the
  // child once; the one that lost the race has nothing left to do.
  const stamped = await db.competitionEntry.updateMany({
    where: { id: entry.id, parentConsentAt: null },
    data: { parentConsentAt: new Date(), parentConsentBy: session.user.id },
  });
  if (stamped.count === 0) return;

  // A result recorded before the guardian said yes was kept off the board by
  // the consent rule in `refreshStanding`; the yes puts it on. A recompute, so
  // for the usual entry with no result yet it changes nothing.
  await refreshStanding(entry.schoolId, entry.competitionId);

  await audit({
    schoolId: entry.schoolId,
    actorUserId: session.user.id,
    action: "competition.consent",
    meta: { entryId: entry.id, competitionId: entry.competitionId },
  });

  const student = await db.membership.findUnique({
    where: { id: entry.studentMembershipId },
    select: { userId: true },
  });
  if (student) {
    await notify({
      userId: student.userId,
      schoolId: entry.schoolId,
      kind: "COMPETITION",
      titleKey: "notifTitle.youAreEntered",
      titleVars: { competition: entry.competition.title },
      bodyKey: "notifBody.grownUpSaidYes",
      url: `/competitions/${entry.competitionId}`,
    });
  }
}

/**
 * A guardian says no, or changes their mind.
 *
 * Withdrawing DELETES the entry rather than flagging it, which is the one place
 * this codebase's "archive, don't delete" rule does not apply: an entry holds no
 * history worth keeping, and a refused consent that lingered as a row would keep
 * showing up in "who asked" lists. The child may ask again, which is the point —
 * a no today is not a no forever.
 */
export async function withdrawEntry(session: ActiveContext, entryId: string): Promise<void> {
  // The role before the id (SWEEPS-1, 4 Oct 2026): anyone but the child or a guardian is refused 403 whatever entry they name.
  if (session.role !== "PARENT" && session.role !== "STUDENT") throw new AccessError("access.onlyTheChildOrTheirGuardianCan");
  const entry = await db.competitionEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new AccessError("access.entryNotFound", "NOT_FOUND");

  if (session.role === "PARENT") {
    await assertGuardianAccess(session.user.id, entry.studentMembershipId);
  } else if (session.role === "STUDENT") {
    if (entry.studentMembershipId !== session.membershipId) {
      throw new AccessError("access.entryNotFound", "NOT_FOUND");
    }
  } else {
    throw new AccessError("access.onlyTheChildOrTheirGuardianCan");
  }

  await db.competitionEntry.delete({ where: { id: entry.id } });

  /**
   * A WITHDRAWAL CAN CHANGE THE BOARD, and forgetting this is how a leaderboard
   * ends up counting a child who is no longer in the competition — or, worse,
   * keeps a school's best place that was won by an entry that no longer exists.
   * Only matters when the entry actually had a result; `refreshStanding` is a
   * recompute, so calling it when nothing changed is a no-op rather than a
   * special case to get right here.
   */
  await refreshStanding(entry.schoolId, entry.competitionId);

  await audit({
    schoolId: entry.schoolId,
    actorUserId: session.user.id,
    action: "competition.withdraw",
    meta: { entryId: entry.id, competitionId: entry.competitionId, by: session.role },
  });
}

/* -------------------------------------------------------------------------- */
/* Handing in, and what it scored                                              */
/* -------------------------------------------------------------------------- */

/**
 * Whether a competition is still taking work.
 *
 * Deliberately NOT `registrationOpen`. Entries close so the organiser knows who
 * is coming; the thing itself happens afterwards, and a child who registered in
 * time must still be able to hand in. What closes the door is the competition
 * ENDING — and, as with registration, a missing date means "no stated end",
 * which is open.
 */
export function submissionOpen(
  competition: { endsAt: Date | null },
  now: Date = new Date(),
): boolean {
  return !competition.endsAt || competition.endsAt >= now;
}

/**
 * A child hands in their entry.
 *
 * CONSENT GATES THIS, and that is the whole reason it is a separate step from
 * entering. Registering says a child would like to take part; handing in sends
 * their actual work to whoever is running it. An entry still waiting on a
 * guardian has not been agreed to, so there is nothing to send.
 *
 * A link rather than a file: `submissionUrl` is what the schema has, and a
 * competition's own site is where work almost always goes. Uploading through
 * Shalaghar would mean storing a child's work for an organiser who cannot read it
 * — see Later in the README.
 */
export async function submitEntry(
  session: ActiveContext,
  competitionId: string,
  submissionUrl: string,
): Promise<void> {
  if (session.role !== "STUDENT" || !session.membershipId) {
    throw new AccessError("access.onlyTheChildTakingPartCanHand");
  }

  const competition = await db.competition.findFirst({
    where: { id: competitionId, status: "PUBLISHED" },
  });
  if (!competition) throw new AccessError("access.competitionNotFound", "NOT_FOUND");
  if (!submissionOpen(competition)) throw new AccessError("access.thisCompetitionHasFinished");

  const entry = await db.competitionEntry.findUnique({
    where: {
      competitionId_studentMembershipId: {
        competitionId,
        studentMembershipId: session.membershipId,
      },
    },
  });
  if (!entry) throw new AccessError("access.youHaveNotEnteredThisCompetition", "NOT_FOUND");

  if (competition.requiresParentConsent && entry.parentConsentAt === null) {
    throw new AccessError("access.aGrownUpNeedsToSayYes");
  }
  // The comment below promised this and nothing did it: a hand-in after a
  // result would leave a ranked entry reading as merely submitted.
  if (entry.rank !== null || entry.scoreMilli !== null) {
    throw new AccessError("access.resultAlreadyRecorded");
  }

  // TA-416: the check above read the row earlier; the write asks it again, so a result recorded in between (the
  // update waits on the row, then finds a rank or a score) refuses the hand-in rather than undoing the result.
  const handed = await db.competitionEntry.updateMany({
    where: { id: entry.id, rank: null, scoreMilli: null },
    data: {
      submissionUrl,
      // Handing in again replaces the link — a child who pasted the wrong one
      // should fix it, not be told off. Re-handing in after a result is
      // refused below, because that would orphan the score.
      status: "SUBMITTED",
    },
  });
  if (handed.count === 0) throw new AccessError("access.resultAlreadyRecorded");

  await audit({
    schoolId: entry.schoolId,
    actorUserId: session.user.id,
    action: "competition.submit",
    meta: { entryId: entry.id, competitionId },
  });
}

export type ScorableEntry = {
  entryId: string;
  studentMembershipId: string;
  studentName: string;
  status: string;
  submissionUrl: string | null;
  scoreMilli: number | null;
  rank: number | null;
  awaitingConsent: boolean;
};

/**
 * The entries a member of staff may record results against.
 *
 * THIS SCHOOL'S OWN, and only this school's — which is not a restriction this
 * function imposes so much as one it inherits. `CompetitionEntry.schoolId` is
 * the ENTRANT's school and is policied, so a competition organised by Riverside
 * and entered by an Oakfield pupil produces a row Riverside cannot read at all.
 *
 * That is the right default and it is why results are recorded by the child's
 * own school rather than by the organiser: a school records what its own pupils
 * scored, in its own competitions and in the national ones it sits.
 *
 * IT IS ALSO WHY THE LEADERBOARD RANKS SCHOOLS. This function is the only place
 * a child's name and their score appear together, and it is school-scoped by
 * policy. The cross-school board is built from `CompetitionStanding` — a school,
 * a count, a place — precisely so that nothing here has to be widened to make it
 * work. See the note above `refreshStanding`.
 */
export async function listEntriesForResults(
  session: ActiveContext,
  competitionId: string,
): Promise<ScorableEntry[]> {
  if (session.role !== "ADMIN" && session.role !== "TEACHER") return [];

  const rows = await db.competitionEntry.findMany({
    where: { competitionId },
    include: { student: { include: { user: { select: { name: true, preferredName: true } } } }, competition: { select: { requiresParentConsent: true } } },
    orderBy: [{ rank: "asc" }, { scoreMilli: "desc" }, { createdAt: "asc" }],
  });

  return rows.map((row) => ({
    entryId: row.id,
    studentMembershipId: row.studentMembershipId,
    studentName: row.student.user.preferredName ?? row.student.user.name,
    status: row.status,
    submissionUrl: row.submissionUrl,
    scoreMilli: row.scoreMilli,
    rank: row.rank,
    // TA-100: as entriesFor reads it.
    awaitingConsent: row.competition.requiresParentConsent && row.parentConsentAt === null,
  }));
}

/**
 * Staff record what an entry scored.
 *
 * ADMIN or TEACHER at the child's own school. A teacher is NOT narrowed to their
 * own classes here, unlike everywhere else in this codebase, and that is a
 * deliberate exception with a reason: a competition entry belongs to no class.
 * The child entered as a pupil of the school, the school sat the paper, and the
 * member of staff running it is frequently not the one who teaches them.
 *
 * Passing null for the score CLEARS a result rather than recording a zero —
 * those are different things, and a competition where zero is a real score would
 * otherwise have no way to undo a typo.
 */
export async function recordResult(
  session: ActiveContext,
  entryId: string,
  result: { scoreMilli: number | null; rank: number | null },
): Promise<void> {
  if (session.role !== "ADMIN" && session.role !== "TEACHER") {
    throw new AccessError("access.onlySchoolStaffCanRecordAResult");
  }
  if (result.scoreMilli !== null && result.scoreMilli < 0) {
    throw new AccessError("access.aScoreCannotBeNegative");
  }
  if (result.rank !== null && (!Number.isInteger(result.rank) || result.rank < 1)) {
    throw new AccessError("access.aPlaceHasToBeAWhole");
  }

  // Scoped by the policy rather than by a WHERE this function writes: an entry
  // from another school does not come back at all.
  const entry = await db.competitionEntry.findUnique({
    where: { id: entryId },
    include: { competition: { select: { title: true } } },
  });
  if (!entry) throw new AccessError("access.entryNotFound", "NOT_FOUND");

  const cleared = result.scoreMilli === null && result.rank === null;

  await db.competitionEntry.update({
    where: { id: entry.id },
    data: {
      scoreMilli: result.scoreMilli,
      rank: result.rank,
      // Clearing a result puts the entry back where it was, so the child is not
      // left looking at a "results are in" state with nothing in it.
      status: cleared ? (entry.submissionUrl ? "SUBMITTED" : "REGISTERED") : "RESULTS",
    },
  });

  /**
   * The school's own summary, recomputed from its own entries.
   *
   * BEFORE the audit and the notifications rather than after, so that a failure
   * to send a push cannot leave a recorded result missing from the board. It is
   * also the reason CLEARING a result runs this too: a cleared score has to come
   * off the school's standing, and the early `return` for `cleared` is below
   * this line for exactly that reason.
   */
  await refreshStanding(entry.schoolId, entry.competitionId);

  await audit({
    schoolId: entry.schoolId,
    actorUserId: session.user.id,
    action: cleared ? "competition.result.clear" : "competition.result",
    meta: { entryId: entry.id, competitionId: entry.competitionId, scoreMilli: result.scoreMilli, rank: result.rank },
  });

  if (cleared) return;

  const student = await db.membership.findUnique({
    where: { id: entry.studentMembershipId },
    select: { userId: true },
  });
  if (student) {
    await notify({
      userId: student.userId,
      schoolId: entry.schoolId,
      kind: "COMPETITION",
      titleKey: "notifTitle.yourResult",
      titleVars: { competition: entry.competition.title },
      ...(result.rank
        ? { bodyKey: "notifBody.youPlaced" as const, bodyVars: { rank: result.rank } }
        : { bodyKey: "notifBody.yourScoreRecorded" as const }),
      url: `/competitions/${entry.competitionId}`,
    });
  }

  // A result is news for home too, and the guardian already agreed to the entry.
  await notifyGuardians(entry.studentMembershipId, (childName) => ({
    schoolId: entry.schoolId,
    kind: "COMPETITION",
    titleKey: "notifTitle.childResult",
    titleVars: { name: childName, competition: entry.competition.title },
    ...(result.rank
      ? { bodyKey: "notifBody.theyPlaced" as const, bodyVars: { rank: result.rank } }
      : { bodyKey: "notifBody.theirScoreRecorded" as const }),
    url: `/competitions/${entry.competitionId}`,
    // An adult college student's result is theirs until they grant RESULTS (TA-099).
  }), "RESULTS");
}

/** 1 → "1st". Written out because a result read by a child should say "3rd". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/* -------------------------------------------------------------------------- */
/* Organising one                                                              */
/* -------------------------------------------------------------------------- */

export type CompetitionInput = {
  title: string;
  summary: string;
  body?: string | null;
  subject?: string | null;
  gradeLow?: string | null;
  gradeHigh?: string | null;
  eligibility?: string | null;
  rules?: string | null;
  prizes?: string | null;
  externalUrl?: string | null;
  registrationClosesAt?: Date | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  requiresParentConsent: boolean;
  /** Publish a cross-school leaderboard. Schools are ranked, never children. */
  leaderboardEnabled?: boolean;
};

/** TA-102: the zone a school's typed competition days are read in (competitionFormSchema): its own, else the platform's. */
export async function competitionZoneOf(session: ActiveContext): Promise<string> {
  if (!session.schoolId) return PLATFORM_ZONE;
  return (await db.school.findUnique({ where: { id: session.schoolId }, select: { timezone: true } }))?.timezone ?? PLATFORM_ZONE;
}

/**
 * A school posts a competition of its own.
 *
 * Created as a DRAFT, always. Publishing is a separate, deliberate press —
 * because publishing puts this in front of every child on every school on the
 * installation, and a half-typed title should not be able to get there by
 * autosave or a stray Enter.
 *
 * `organizerSchoolId` is stamped from the SESSION, never from the form. It is
 * what lets the organising school edit and withdraw its own competition later,
 * so accepting it from a client would let one school take over another's.
 *
 * `verified` is deliberately NOT settable here. It means "somebody running this
 * installation looked at it", and a school marking its own competition as
 * checked-by-Shalaghar would make the badge meaningless.
 */
export async function createCompetition(
  session: ActiveContext,
  input: CompetitionInput,
): Promise<string> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyASchoolAdminCanPostA");
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: session.schoolId },
    select: { name: true },
  });

  const competition = await db.competition.create({
    data: {
      title: input.title,
      summary: input.summary,
      body: input.body ?? "",
      organizerName: school.name,
      organizerSchoolId: session.schoolId,
      subject: input.subject ?? null,
      gradeLow: input.gradeLow ?? null,
      gradeHigh: input.gradeHigh ?? null,
      eligibility: input.eligibility ?? null,
      rules: input.rules ?? null,
      prizes: input.prizes ?? null,
      externalUrl: input.externalUrl ?? null,
      registrationClosesAt: input.registrationClosesAt ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      requiresParentConsent: input.requiresParentConsent,
      leaderboardEnabled: input.leaderboardEnabled ?? false,
      status: "DRAFT",
    },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "competition.create",
    meta: { competitionId: competition.id, title: input.title },
  });

  return competition.id;
}

/**
 * Publish or withdraw one this school organises.
 *
 * Scoped by `organizerSchoolId` in the WHERE, so an id belonging to another
 * school's competition — or to an externally-organised one, which no school
 * owns — simply matches nothing. That is the same shape as every other
 * assert in this codebase: the caller supplies the id, we supply the scope.
 *
 * Withdrawing does NOT delete. Children may already have entered and their
 * guardians may already have consented, and deleting would take that away
 * without telling anybody; ARCHIVED leaves the entries intact, drops it out of
 * the catalogue, and stops it appearing on a parent's waiting list.
 */
export async function setCompetitionStatus(
  session: ActiveContext,
  competitionId: string,
  status: "PUBLISHED" | "ARCHIVED" | "DRAFT",
): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyASchoolAdminCanDoThat");
  }

  const updated = await db.competition.updateMany({
    where: { id: competitionId, organizerSchoolId: session.schoolId },
    data: { status },
  });

  if (updated.count === 0) throw new AccessError("access.competitionNotFound", "NOT_FOUND");

  // decision 0007: a published school competition with a start date is on the calendar; a withdrawn one is not.
  await syncCalendarRow(competitionId);

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: `competition.${status.toLowerCase()}`,
    meta: { competitionId },
  });
}

/** The ones this school organises, for the admin's own list. */
export async function listOwnCompetitions(session: ActiveContext) {
  if (session.role !== "ADMIN" || !session.schoolId) return [];

  return db.competition.findMany({
    where: { organizerSchoolId: session.schoolId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, registrationClosesAt: true },
  });
}

/**
 * Consent requests waiting on this guardian — the thing that makes the whole
 * loop findable from the parent's home page rather than only from a
 * notification they may have missed.
 */
export async function pendingConsents(session: ActiveContext) {
  if (session.role !== "PARENT") return [];

  const membershipIds = await ownStudentMembershipIds(session);
  if (membershipIds.length === 0) return [];

  const rows = await db.competitionEntry.findMany({
    // TA-100: only where the competition asks a guardian; a consent-free one has nothing to say yes to.
    where: { studentMembershipId: { in: membershipIds }, parentConsentAt: null, competition: { requiresParentConsent: true } },
    include: {
      competition: { select: { id: true, title: true, organizerName: true, registrationClosesAt: true, status: true, organizerSchoolId: true } },
      student: { include: { user: { select: { name: true, preferredName: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // A competition pulled after a child asked should not sit on a parent's home
  // page forever asking them to approve something that no longer exists; nor a
  // platform one while the marketplace is off (decision 0007).
  const marketplaceOn = await featureOn("COMPETITIONS");
  return rows
    .filter((r) => r.competition.status === "PUBLISHED" && (marketplaceOn || r.competition.organizerSchoolId !== null))
    .map((r) => ({
      entryId: r.id,
      competitionId: r.competition.id,
      title: r.competition.title,
      organizerName: r.competition.organizerName,
      closesAt: r.competition.registrationClosesAt,
      childName: r.student.user.preferredName ?? r.student.user.name,
    }));
}

/* -------------------------------------------------------------------------- */
/* The cross-school leaderboard                                                */
/* -------------------------------------------------------------------------- */

/**
 * SCHOOLS ARE RANKED, CHILDREN ARE NOT.
 *
 * This is the decision the README deferred, made. A ranking across schools would
 * otherwise be the first thing in this app to show one school another school's
 * children, and every other cross-boundary feature here — the global feed, the
 * leaving certificate, the expert marketplace — is narrow, deliberate and
 * accountable. A leaderboard that named other people's eleven-year-olds and
 * their marks would be none of those things, and no competition needs it: what a
 * school wants to know is how IT did, and what a child wants to know is how they
 * did, which their own school already tells them by name.
 *
 * So what crosses the boundary is a school-level summary — entrants with a
 * result, best place, best score — held in `CompetitionStanding` and opened by a
 * policy keyed on the organiser's `leaderboardEnabled` flag. `CompetitionEntry`,
 * where the names and individual scores live, is not widened by one row.
 *
 * THE HONEST LIMIT, stated because it is real: a school that enters exactly one
 * child and places first has told every other school the winner's school. It has
 * not told them the winner's name, class, age or score-by-name, and a published
 * competition result is a public thing. That is a different order of disclosure
 * from a table of named children, which is the one being refused.
 */

export type StandingRow = {
  schoolId: string;
  schoolName: string;
  entrants: number;
  bestRank: number | null;
  bestScoreMilli: number | null;
  /** This is the reader's own school — the row they can also see by name. */
  isOwnSchool: boolean;
};

/**
 * Recomputes ONE school's standing in ONE competition, from its own entries.
 *
 * FROM SCRATCH EVERY TIME rather than adjusted incrementally, and that is worth
 * a sentence: a running total has to be right after a clear, after a withdrawal,
 * after a correction of a typo'd score, and after two of those racing. A
 * recompute is right after all of them by construction, and the query it costs
 * is one indexed read over a handful of rows.
 *
 * The read is scoped by the POLICY, not by a WHERE this function writes — so it
 * cannot accidentally aggregate another school's entries even if called with the
 * wrong school id. It writes the row for the school it just counted.
 */
export async function refreshStanding(
  schoolId: string,
  competitionId: string,
): Promise<void> {
  // TA-416: the read and the write in one tenant transaction, one school's standing in one competition at a time,
  // so of two results recorded together the second recompute waits and counts both rather than writing last a
  // count read before the other's result.
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Prisma.TransactionClient;
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`competition-standing:${competitionId}:${schoolId}`}))`;
    await recomputeStanding(tx, schoolId, competitionId);
  });
}

async function recomputeStanding(db: Prisma.TransactionClient, schoolId: string, competitionId: string): Promise<void> {
  const competition = await db.competition.findUnique({
    where: { id: competitionId },
    select: { requiresParentConsent: true },
  });
  const scored = await db.competitionEntry.findMany({
    where: {
      competitionId,
      schoolId,
      // A result means a place, a score, or both. An entry that is merely
      // registered is not a standing — counting it would let a school climb the
      // board by entering people. Nor is a result on an entry whose guardian
      // never said yes, where the competition asked them to.
      OR: [{ rank: { not: null } }, { scoreMilli: { not: null } }],
      ...(competition?.requiresParentConsent ? { parentConsentAt: { not: null } } : {}),
    },
    select: { rank: true, scoreMilli: true },
  });

  if (scored.length === 0) {
    // Every result cleared or withdrawn: the school is off the board rather than
    // sitting on it with a zero, which would read as having competed and lost.
    await db.competitionStanding.deleteMany({ where: { competitionId, schoolId } });
    return;
  }

  const ranks = scored.map((e) => e.rank).filter((r): r is number => r !== null);
  const scores = scored.map((e) => e.scoreMilli).filter((s): s is number => s !== null);

  const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;
  const bestScoreMilli = scores.length > 0 ? Math.max(...scores) : null;

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { name: true },
  });
  // Falls back rather than throwing: a standing with a placeholder name is worth
  // more than a recorded result that failed to save because a display string
  // could not be read.
  const schoolName = school?.name ?? "A school";

  await db.competitionStanding.upsert({
    where: { competitionId_schoolId: { competitionId, schoolId } },
    create: {
      competitionId,
      schoolId,
      schoolName,
      entrants: scored.length,
      bestRank,
      bestScoreMilli,
    },
    update: {
      // The name is refreshed too, so a school that renames itself appears under
      // its current name in competitions it is still competing in.
      schoolName,
      entrants: scored.length,
      bestRank,
      bestScoreMilli,
    },
  });
}

/**
 * The leaderboard, as any school may read it.
 *
 * Returns EMPTY when the organiser has not switched the leaderboard on. That is
 * belt and braces rather than the real defence — the policy on
 * `CompetitionStanding` already refuses other schools' rows for a competition
 * whose flag is off, so this returning rows would take a policy change and not
 * merely a mistake here.
 *
 * ORDERED BY BEST PLACE, then by best score, then by name. Schools with no place
 * at all sort last rather than first, which is what `null` would do naturally in
 * ascending order and is exactly wrong.
 */
export async function leaderboard(
  session: ActiveContext,
  competitionId: string,
): Promise<StandingRow[]> {
  const competition = await db.competition.findUnique({
    where: { id: competitionId },
    select: { leaderboardEnabled: true, status: true },
  });
  if (!competition?.leaderboardEnabled) return [];
  // A draft competition's board is nobody's business but its organiser's, and
  // they can see their own school's row on their own entries page.
  if (competition.status === "DRAFT") return [];

  const rows = await db.competitionStanding.findMany({
    where: { competitionId },
    select: {
      schoolId: true,
      schoolName: true,
      entrants: true,
      bestRank: true,
      bestScoreMilli: true,
    },
    take: 500,
  });

  return rows
    .map((row) => ({ ...row, isOwnSchool: row.schoolId === session.schoolId }))
    .sort((a, b) => {
      // Unranked last. `a.bestRank - b.bestRank` on nulls coerces to 0 and
      // silently interleaves them among the medals.
      if (a.bestRank !== b.bestRank) {
        if (a.bestRank === null) return 1;
        if (b.bestRank === null) return -1;
        return a.bestRank - b.bestRank;
      }
      if (a.bestScoreMilli !== b.bestScoreMilli) {
        if (a.bestScoreMilli === null) return 1;
        if (b.bestScoreMilli === null) return -1;
        return b.bestScoreMilli - a.bestScoreMilli;
      }
      return a.schoolName.localeCompare(b.schoolName);
    });
}

/**
 * The organiser switches the leaderboard on or off.
 *
 * Scoped by `organizerSchoolId`, like `setCompetitionStatus` — a school may only
 * do this to a competition it actually organises, and an externally-organised
 * one belongs to nobody and so belongs to no school's switch.
 *
 * NOTHING IS DELETED WHEN IT GOES OFF. The standings keep being maintained and
 * simply stop being readable outside their own school, because that is what the
 * policy is keyed on. An organiser who switches it off by mistake, or off for a
 * week while results are checked, does not destroy the board.
 */
export async function setLeaderboard(
  session: ActiveContext,
  competitionId: string,
  enabled: boolean,
): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyASchoolAdminCanDoThat");
  }

  const updated = await db.competition.updateMany({
    where: { id: competitionId, organizerSchoolId: session.schoolId },
    data: { leaderboardEnabled: enabled },
  });
  if (updated.count === 0) throw new AccessError("access.competitionNotFound", "NOT_FOUND");

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: enabled ? "competition.leaderboard.on" : "competition.leaderboard.off",
    meta: { competitionId },
  });
}

/* -------------------------------------------------------------------------- */
/* The internal board (decision 0007, 6 November 2026)                        */
/* -------------------------------------------------------------------------- */

/**
 * THE SCHOOL'S OWN BOARD, OPTIONAL, AND NEVER ACROSS SCHOOLS.
 *
 * The office chooses it when the calendar event is made (`Competition.internalBoard`): OFF, STAFF or SCHOOL. It
 * is built from `CompetitionEntry`, which is the ENTRANT's school's and policied — so whatever the setting, the
 * rows can only ever be this school's own pupils, and the cross-school rule (`CompetitionStanding`: schools
 * ranked, children never named across schools) is untouched by it.
 *
 *   STAFF   the organising school's ADMIN, PRINCIPAL and TEACHER read every entry with a result: full name,
 *           class, score, place (the entries page already showed them that much).
 *   SCHOOL  staff as above; a PUPIL of that school and a GUARDIAN of a pupil there additionally read the top
 *           places by FIRST NAME and class, and their own (the pupil's own, the guardian's child's) place.
 *   OFF     nobody reads a board; the entries page stays the staff's.
 *
 * The person binding: a pupil's "mine" is their own membership; a guardian's is a child of theirs at the school
 * (the one asked for, else the first with an entry), proved by the guardianship. Anyone outside the organising
 * school, and every reader of a platform competition, gets the setting and no rows.
 */
const BOARD_TOP = 5;

export async function internalBoard(
  session: ActiveContext,
  competitionId: string,
  opts: { studentMembershipId?: string | null } = {},
): Promise<CompetitionBoard> {
  const competition = await db.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, organizerSchoolId: true, status: true, internalBoard: true, requiresParentConsent: true },
  });
  if (!competition) throw new AccessError("access.competitionNotFound", "NOT_FOUND");
  const setting = boardSettingOf(competition.internalBoard);
  const none: CompetitionBoard = { setting, full: false, rows: [], mine: null };
  if (setting === "OFF" || competition.organizerSchoolId === null || competition.status === "DRAFT") return none;
  const schoolId = competition.organizerSchoolId;

  // Who is asking, and which pupil is "mine".
  let full = false;
  let mineId: string | null = null;
  if (session.role === "ADMIN" || session.role === "PRINCIPAL" || session.role === "TEACHER") {
    if (session.schoolId !== schoolId) return none;
    full = true;
  } else if (session.role === "STUDENT") {
    if (session.schoolId !== schoolId || !session.membershipId || setting !== "SCHOOL") return none;
    mineId = session.membershipId;
  } else if (session.role === "PARENT") {
    if (setting !== "SCHOOL") return none;
    const links = await db.guardianship.findMany({ where: { parentUserId: session.user.id, status: "ACTIVE", studentSchoolId: schoolId }, select: { studentMembershipId: true } });
    // An adult college student's place is theirs until they grant RESULTS (TA-099).
    const ids = await studentsGuardiansMaySee(links.map((l) => l.studentMembershipId), "RESULTS");
    if (ids.length === 0) return none;
    if (opts.studentMembershipId && ids.includes(opts.studentMembershipId)) mineId = opts.studentMembershipId;
    else {
      const withEntry = await db.competitionEntry.findFirst({ where: { competitionId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true } });
      mineId = withEntry?.studentMembershipId ?? ids[0]!;
    }
  } else {
    return none;
  }

  // The school's results, in board order. Scoped by the policy and by the organiser's school alike.
  const rows = await db.competitionEntry.findMany({
    where: {
      competitionId,
      schoolId,
      OR: [{ rank: { not: null } }, { scoreMilli: { not: null } }],
      ...(competition.requiresParentConsent ? { parentConsentAt: { not: null } } : {}),
    },
    select: {
      studentMembershipId: true,
      scoreMilli: true,
      rank: true,
      student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } },
    },
  });
  rows.sort((a, b) => {
    if (a.rank !== b.rank) {
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank;
    }
    if (a.scoreMilli !== b.scoreMilli) {
      if (a.scoreMilli === null) return 1;
      if (b.scoreMilli === null) return -1;
      return b.scoreMilli - a.scoreMilli;
    }
    return (a.student.user.preferredName ?? a.student.user.name).localeCompare(b.student.user.preferredName ?? b.student.user.name);
  });
  const nameOf = (r: (typeof rows)[number]) => {
    const whole = r.student.user.preferredName ?? r.student.user.name;
    return full ? whole : (whole.trim().split(/\s+/)[0] ?? whole);
  };
  const shaped = rows.map((r, i) => ({
    place: i + 1,
    name: nameOf(r),
    className: r.student.enrollments[0]?.class.name ?? null,
    // TA-321: a pupil or a guardian learns the others' first name, class and place, and only their own score.
    scoreMilli: full || r.studentMembershipId === mineId ? r.scoreMilli : null,
    rank: r.rank,
    mine: r.studentMembershipId === mineId,
  }));
  if (full) return { setting, full: true, rows: shaped, mine: null };
  const top = shaped.slice(0, BOARD_TOP);
  const own = shaped.find((r) => r.mine) ?? null;
  return { setting, full: false, rows: top, mine: own && !top.includes(own) ? own : null };
}
