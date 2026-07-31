import "server-only";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { notify, notifyGuardians } from "./notify";
import { audit } from "./audit";
import type { ActiveContext } from "./session";

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
};

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

/** The catalogue: published competitions, newest deadline first. */
export async function listCompetitions(
  session: ActiveContext,
  opts: { openOnly?: boolean } = {},
): Promise<CompetitionSummary[]> {
  const competitions = await db.competition.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ registrationClosesAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const now = new Date();
  const visible = opts.openOnly
    ? competitions.filter((c) => registrationOpen(c, now))
    : competitions;

  const entries = await entriesFor(session, visible.map((c) => c.id));

  return visible.map((c) => ({
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
  }));
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
  const competition = await db.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw new AccessError("Competition not found", "NOT_FOUND");

  const isOrganiser =
    session.role === "ADMIN" &&
    session.schoolId !== null &&
    competition.organizerSchoolId === session.schoolId;

  if (competition.status !== "PUBLISHED" && !isOrganiser) {
    throw new AccessError("Competition not found", "NOT_FOUND");
  }

  const entries = await entriesFor(session, [competition.id]);

  return {
    ...competition,
    isOrganiser,
    open: registrationOpen(competition),
    acceptingWork: submissionOpen(competition),
    entry: entries.get(competition.id) ?? null,
    /** Only ever this school's, because CompetitionEntry is policied. */
    enteredCount: await db.competitionEntry.count({
      where: { competitionId: competition.id, parentConsentAt: { not: null } },
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
    include: { student: { include: { user: { select: { name: true, preferredName: true } } } } },
  });

  for (const row of rows) {
    found.set(row.competitionId, {
      id: row.id,
      status: row.status,
      awaitingConsent: row.parentConsentAt === null,
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
    return guardianships.map((g) => g.studentMembershipId);
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Entering                                                                    */
/* -------------------------------------------------------------------------- */

export type EnterResult = { entryId: string; awaitingConsent: boolean };

/**
 * A child asks to enter.
 *
 * Deliberately idempotent: the unique constraint on
 * (competitionId, studentMembershipId) already makes a second press impossible,
 * so this returns the existing entry rather than an error. A child pressing a
 * button twice because the first tap felt slow should not be told off.
 *
 * The entry is created WITHOUT consent even when a guardian will obviously give
 * it. Nothing here may set `parentConsentAt` — only `giveConsent` does, and only
 * for somebody proved to be that child's guardian.
 */
export async function enterCompetition(
  session: ActiveContext,
  competitionId: string,
): Promise<EnterResult> {
  if (session.role !== "STUDENT" || !session.membershipId || !session.schoolId) {
    throw new AccessError("Only a student can enter a competition");
  }

  const competition = await db.competition.findFirst({
    where: { id: competitionId, status: "PUBLISHED" },
  });
  if (!competition) throw new AccessError("Competition not found", "NOT_FOUND");

  if (!registrationOpen(competition)) {
    throw new AccessError("Entries for this competition have closed");
  }

  const existing = await db.competitionEntry.findUnique({
    where: {
      competitionId_studentMembershipId: {
        competitionId,
        studentMembershipId: session.membershipId,
      },
    },
  });
  if (existing) {
    return { entryId: existing.id, awaitingConsent: existing.parentConsentAt === null };
  }

  const entry = await db.competitionEntry.create({
    data: {
      competitionId,
      studentMembershipId: session.membershipId,
      schoolId: session.schoolId,
      status: "REGISTERED",
    },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "competition.enter",
    meta: { competitionId, entryId: entry.id, title: competition.title },
  });

  if (competition.requiresParentConsent) {
    // The one link that proves this moved: without it a child presses "Enter"
    // and nothing whatsoever happens anywhere a grown-up can see.
    await notifyGuardians(session.membershipId, (childName) => ({
      schoolId: session.schoolId,
      kind: "COMPETITION",
      title: `${childName} wants to enter ${competition.title}`,
      body: "They cannot take part until you say yes.",
      url: `/competitions/${competitionId}`,
    }));
  }

  return { entryId: entry.id, awaitingConsent: competition.requiresParentConsent };
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
  if (session.role !== "PARENT") throw new AccessError("Only a guardian can give consent");

  const entry = await db.competitionEntry.findUnique({
    where: { id: entryId },
    include: { competition: { select: { title: true } } },
  });
  if (!entry) throw new AccessError("Entry not found", "NOT_FOUND");

  // Throws NOT_FOUND when this is not their child.
  await assertGuardianAccess(session.user.id, entry.studentMembershipId);

  if (entry.parentConsentAt) return; // Already given; pressing again is not an error.

  await db.competitionEntry.update({
    where: { id: entry.id },
    data: { parentConsentAt: new Date(), parentConsentBy: session.user.id },
  });

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
      title: `You are entered for ${entry.competition.title}`,
      body: "A grown-up said yes.",
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
  const entry = await db.competitionEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new AccessError("Entry not found", "NOT_FOUND");

  if (session.role === "PARENT") {
    await assertGuardianAccess(session.user.id, entry.studentMembershipId);
  } else if (session.role === "STUDENT") {
    if (entry.studentMembershipId !== session.membershipId) {
      throw new AccessError("Entry not found", "NOT_FOUND");
    }
  } else {
    throw new AccessError("Only the child or their guardian can withdraw an entry");
  }

  await db.competitionEntry.delete({ where: { id: entry.id } });

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
 * EduLink would mean storing a child's work for an organiser who cannot read it
 * — see Later in the README.
 */
export async function submitEntry(
  session: ActiveContext,
  competitionId: string,
  submissionUrl: string,
): Promise<void> {
  if (session.role !== "STUDENT" || !session.membershipId) {
    throw new AccessError("Only the child taking part can hand in their entry");
  }

  const competition = await db.competition.findFirst({
    where: { id: competitionId, status: "PUBLISHED" },
  });
  if (!competition) throw new AccessError("Competition not found", "NOT_FOUND");
  if (!submissionOpen(competition)) throw new AccessError("This competition has finished");

  const entry = await db.competitionEntry.findUnique({
    where: {
      competitionId_studentMembershipId: {
        competitionId,
        studentMembershipId: session.membershipId,
      },
    },
  });
  if (!entry) throw new AccessError("You have not entered this competition", "NOT_FOUND");

  if (competition.requiresParentConsent && entry.parentConsentAt === null) {
    throw new AccessError("A grown-up needs to say yes before you can hand this in");
  }

  await db.competitionEntry.update({
    where: { id: entry.id },
    data: {
      submissionUrl,
      // Handing in again replaces the link — a child who pasted the wrong one
      // should fix it, not be told off. Re-handing in after a result is
      // refused below, because that would orphan the score.
      status: "SUBMITTED",
    },
  });

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
 * scored, in its own competitions and in the national ones it sits. Anything
 * else is the cross-school question that leaderboards raise, and that is a
 * decision before it is code — see Not built in the README.
 */
export async function listEntriesForResults(
  session: ActiveContext,
  competitionId: string,
): Promise<ScorableEntry[]> {
  if (session.role !== "ADMIN" && session.role !== "TEACHER") return [];

  const rows = await db.competitionEntry.findMany({
    where: { competitionId },
    include: { student: { include: { user: { select: { name: true, preferredName: true } } } } },
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
    awaitingConsent: row.parentConsentAt === null,
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
    throw new AccessError("Only school staff can record a result");
  }
  if (result.scoreMilli !== null && result.scoreMilli < 0) {
    throw new AccessError("A score cannot be negative");
  }
  if (result.rank !== null && (!Number.isInteger(result.rank) || result.rank < 1)) {
    throw new AccessError("A place has to be a whole number, first or better");
  }

  // Scoped by the policy rather than by a WHERE this function writes: an entry
  // from another school does not come back at all.
  const entry = await db.competitionEntry.findUnique({
    where: { id: entryId },
    include: { competition: { select: { title: true } } },
  });
  if (!entry) throw new AccessError("Entry not found", "NOT_FOUND");

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
      title: `Your result for ${entry.competition.title}`,
      body: result.rank ? `You came ${ordinal(result.rank)}.` : "Your score has been recorded.",
      url: `/competitions/${entry.competitionId}`,
    });
  }

  // A result is news for home too, and the guardian already agreed to the entry.
  await notifyGuardians(entry.studentMembershipId, (childName) => ({
    schoolId: entry.schoolId,
    kind: "COMPETITION",
    title: `${childName}'s result for ${entry.competition.title}`,
    body: result.rank ? `They came ${ordinal(result.rank)}.` : "Their score has been recorded.",
    url: `/competitions/${entry.competitionId}`,
  }));
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
};

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
 * checked-by-EduLink would make the badge meaningless.
 */
export async function createCompetition(
  session: ActiveContext,
  input: CompetitionInput,
): Promise<string> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("Only a school admin can post a competition");
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
    throw new AccessError("Only a school admin can do that");
  }

  const updated = await db.competition.updateMany({
    where: { id: competitionId, organizerSchoolId: session.schoolId },
    data: { status },
  });

  if (updated.count === 0) throw new AccessError("Competition not found", "NOT_FOUND");

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
    where: { studentMembershipId: { in: membershipIds }, parentConsentAt: null },
    include: {
      competition: { select: { id: true, title: true, organizerName: true, registrationClosesAt: true, status: true } },
      student: { include: { user: { select: { name: true, preferredName: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // A competition pulled after a child asked should not sit on a parent's home
  // page forever asking them to approve something that no longer exists.
  return rows
    .filter((r) => r.competition.status === "PUBLISHED")
    .map((r) => ({
      entryId: r.id,
      competitionId: r.competition.id,
      title: r.competition.title,
      organizerName: r.competition.organizerName,
      closesAt: r.competition.registrationClosesAt,
      childName: r.student.user.preferredName ?? r.student.user.name,
    }));
}
