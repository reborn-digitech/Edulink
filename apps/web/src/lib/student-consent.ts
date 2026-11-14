import "server-only";
import { isCollegeKind, STUDENT_CONSENT_GRANTS, type StudentConsentGrant } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { isMinorOn } from "./adulthood";
import type { ActiveContext } from "./session";
import { GUARDIAN_RELATIONS, type GuardianRelation } from "./constants";

export { STUDENT_CONSENT_GRANTS, type StudentConsentGrant };

/**
 * WHAT AN ADULT STUDENT LETS A GUARDIAN SEE (the owner's college plan of 4
 * October 2026). At a school a guardian sees their child's day without
 * asking, and that does not change. At a college the student is usually an
 * adult, and an adult's attendance, results, money, hostel and bus, placement
 * and messages are theirs: the guardian sees each only while the student has
 * granted it, and the student may take any grant back whenever they like.
 *
 * WHO IT APPLIES TO. A student whose institution is a COLLEGE or an
 * AUTONOMOUS_COLLEGE and whose own row says they are not a minor
 * (User.isMinor, kept to the birthday by refreshMinority). A minor at a
 * college — a seventeen-year-old in the first year — and every pupil at a
 * school or a junior college: the guardian keeps everything, no grant asked.
 *
 * THE DEFAULT IS NOTHING. An adult who has never opened the consent page has
 * granted nothing, so their guardian sees nothing that a grant guards; the
 * student is the only writer (`setStudentConsent`), and every change is in the
 * audit log.
 *
 * A GRANT IS ONE GUARDIAN'S (TA-555, testing analysis of 13 November 2026; the
 * owner's decision of 14 November 2026). A grant used to be one row per student
 * and grant, so it covered every guardian the student had and every one they
 * would ever have: a guardian approved later read at once whatever had been
 * granted to the first. A row is now keyed to the GUARDIANSHIP (one per
 * student, link and grant), so:
 *   - a new guardian has no row and starts with nothing until the student
 *     grants it to them;
 *   - only an ACTIVE link reads under its rows, and a link that ends has its
 *     rows revoked in the same transaction (`revokeGrantsOfLink`, called by
 *     the three endings in guardianship.ts), so a link made again by a later
 *     yes starts with nothing too;
 *   - the school's stand-in (relation SCHOOL) is never offered a grant: staff
 *     read an adult's record through their own role, not as a guardian.
 * A row whose guardianshipId is NULL is a grant from before this change that
 * no link could take (the migration's data step): kept as the record, read by
 * nobody.
 *
 * WHAT A FAMILY DOOR CALLS: `parentMaySee(studentMembershipId, grant,
 * guardianUserId)` — true or false, for the guardian reading — or
 * `assertParentMaySee`, which throws a 403 with the reason. The guardianship
 * check itself (`assertGuardianAccess` in tenancy.ts) is still the door's
 * first lock; this is the second, for an adult at a college. A NOTICE asks
 * `guardiansToTell`, which answers the guardians who hold the grant.
 */

type ConsentSubject = { schoolId: string; isMinor: boolean; kind: string };

/**
 * The facts that decide whether a grant is needed at all, for one student
 * membership; null when there is no such student. Adulthood is decided from
 * the date of birth on the school's own calendar day at the moment of reading
 * (LIFECYCLE-2): the stored `isMinor` is refreshed by the night's job, which
 * left a guardian reading an adult's results until the next night's run. An
 * account with no date keeps the stored flag.
 */
async function subjectOf(studentMembershipId: string, now: Date = new Date()): Promise<ConsentSubject | null> {
  const m = await db.membership.findFirst({
    where: { id: studentMembershipId, role: "STUDENT" },
    select: { schoolId: true, user: { select: { isMinor: true, birthdate: true } }, school: { select: { kind: true, timezone: true } } },
  });
  if (!m) return null;
  return { schoolId: m.schoolId, isMinor: isMinorToday(m.user, m.school.timezone, now), kind: m.school.kind };
}

/** A minor today on the school's calendar, from the date of birth when there is one, else the stored flag. */
export function isMinorToday(user: { birthdate: Date | null; isMinor: boolean }, timeZone: string, now: Date = new Date()): boolean {
  return user.birthdate ? isMinorOn(user.birthdate, now, timeZone) : user.isMinor;
}

/** Whether the grants apply to this student at all: an adult at a college. */
export async function consentApplies(studentMembershipId: string, now: Date = new Date()): Promise<boolean> {
  const subject = await subjectOf(studentMembershipId, now);
  return subject !== null && isCollegeKind(subject.kind) && !subject.isMinor;
}

/**
 * Of these memberships, the students there are, each with whether the grants apply to them (an adult at a college).
 * One query however many; an id that is not a student is not in the answer.
 */
async function guardedFacts(studentMembershipIds: readonly string[], now: Date): Promise<Map<string, boolean>> {
  const ids = [...new Set(studentMembershipIds)];
  if (ids.length === 0) return new Map();
  const rows = await db.membership.findMany({
    where: { id: { in: ids }, role: "STUDENT" },
    select: { id: true, user: { select: { isMinor: true, birthdate: true } }, school: { select: { kind: true, timezone: true } } },
  });
  return new Map(rows.map((m) => [m.id, isCollegeKind(m.school.kind) && !isMinorToday(m.user, m.school.timezone, now)]));
}

/** `consentApplies` for many at once: of these memberships, the adults at a college. */
export async function consentAppliesMany(studentMembershipIds: readonly string[], now: Date = new Date()): Promise<Set<string>> {
  const facts = await guardedFacts(studentMembershipIds, now);
  return new Set([...facts].filter(([, guarded]) => guarded).map(([id]) => id));
}

/**
 * Whether THIS guardian may see what `grant` guards of this student: always for a minor or a pupil at a school or a
 * junior college; for an adult at a college, only while the student has granted it to this guardian's own link and
 * the link is ACTIVE (TA-555). Does NOT check that the caller is the student's guardian where no grant applies — the
 * door's guardianship check does that first.
 */
export async function parentMaySee(studentMembershipId: string, grant: StudentConsentGrant, guardianUserId: string, now: Date = new Date()): Promise<boolean> {
  const subject = await subjectOf(studentMembershipId, now);
  if (!subject) return false;
  if (!isCollegeKind(subject.kind) || subject.isMinor) return true;
  const row = await db.studentConsent.findFirst({
    where: { studentMembershipId, grant, revokedAt: null, guardianship: { parentUserId: guardianUserId, studentMembershipId, status: "ACTIVE" } },
    select: { id: true },
  });
  return row !== null;
}

/**
 * `parentMaySee` for ONE guardian's children at once: of these students, the ones whose `grant` is open to this
 * guardian. Two queries however many; order kept; an id that is not a student is dropped.
 */
export async function studentsGuardianMaySee(studentMembershipIds: readonly string[], grant: StudentConsentGrant, guardianUserId: string, now: Date = new Date()): Promise<string[]> {
  if (studentMembershipIds.length === 0) return [];
  const facts = await guardedFacts(studentMembershipIds, now);
  const ask = [...facts].filter(([, guarded]) => guarded).map(([id]) => id);
  const granted =
    ask.length > 0
      ? await db.studentConsent.findMany({
          where: { studentMembershipId: { in: ask }, grant, revokedAt: null, guardianship: { parentUserId: guardianUserId, status: "ACTIVE" } },
          select: { studentMembershipId: true },
        })
      : [];
  const open = new Set(granted.map((g) => g.studentMembershipId));
  return studentMembershipIds.filter((id) => facts.get(id) === false || open.has(id));
}

/**
 * WHO IS TOLD (5 Oct 2026, the campaign's guardian-notice follow-up; per guardian since TA-555): for each of these
 * students, the guardians (user ids, each once) a notice about `grant` may go to. A minor's, and a pupil's at a
 * school or a junior college: every ACTIVE guardian, the school's stand-in included, as before. An adult's at a
 * college: the guardians whose own ACTIVE link holds the grant, and with no grant named nobody (default-deny,
 * TA-262). Three queries however many students; a student nobody may be told about has an empty list, and an id that
 * is not a student is not in the answer.
 */
export async function guardiansToTell(studentMembershipIds: readonly string[], grant?: StudentConsentGrant, now: Date = new Date()): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const facts = await guardedFacts(studentMembershipIds, now);
  if (facts.size === 0) return out;
  const guarded = [...facts].filter(([, g]) => g).map(([id]) => id);
  const [links, consents] = await Promise.all([
    db.guardianship.findMany({ where: { studentMembershipId: { in: [...facts.keys()] }, status: "ACTIVE" }, select: { id: true, parentUserId: true, studentMembershipId: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] }),
    grant && guarded.length > 0 ? db.studentConsent.findMany({ where: { studentMembershipId: { in: guarded }, grant, revokedAt: null, guardianshipId: { not: null } }, select: { guardianshipId: true } }) : Promise.resolve([]),
  ]);
  const holds = new Set(consents.map((c) => c.guardianshipId));
  for (const id of facts.keys()) out.set(id, []);
  for (const link of links) {
    if (facts.get(link.studentMembershipId) && !holds.has(link.id)) continue;
    const list = out.get(link.studentMembershipId)!;
    if (!list.includes(link.parentUserId)) list.push(link.parentUserId);
  }
  return out;
}

/** `parentMaySee`, as a refusal a door answers 403. */
export async function assertParentMaySee(studentMembershipId: string, grant: StudentConsentGrant, guardianUserId: string): Promise<void> {
  if (!(await parentMaySee(studentMembershipId, grant, guardianUserId))) throw new AccessError("consent.refuseNotGranted");
}

/**
 * A LINK THAT ENDS TAKES ITS GRANTS WITH IT (TA-555): every grant given to this guardianship is revoked, in the
 * caller's transaction, so the ending and the revoking are one act and a link made again later starts with nothing.
 * Answers how many were on. The rows stay (revokedAt set), as a grant the student took back does.
 */
export async function revokeGrantsOfLink(tx: Pick<typeof db, "studentConsent">, guardianshipId: string, now: Date = new Date()): Promise<number> {
  return (await tx.studentConsent.updateMany({ where: { guardianshipId, revokedAt: null }, data: { revokedAt: now } })).count;
}

type GrantLine = { grant: StudentConsentGrant; on: boolean; grantedAt: Date | null };

export type StudentConsentView = {
  applies: boolean;
  /** The whole-list line: on when at least one guardian holds the grant (everything, where no grant applies). */
  grants: GrantLine[];
  /** The student's family guardians on the app, oldest link first, each with what the student has granted THEM. */
  guardians: { guardianshipId: string; name: string; relation: GuardianRelation; since: Date; grants: GrantLine[] }[];
};

function assertStudent(ctx: ActiveContext): asserts ctx is ActiveContext & { schoolId: string; membershipId: string } {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
}

/** The student's family guardians (never the school's stand-in), oldest link first. */
function familyLinksOf(studentMembershipId: string) {
  return db.guardianship.findMany({
    where: { studentMembershipId, status: "ACTIVE", relation: { not: "SCHOOL" } },
    select: { id: true, relation: true, createdAt: true, parent: { select: { name: true, preferredName: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

/** The student's own grants: every guardian with each grant on or off for them, and the whole-list line. */
export async function myStudentConsent(ctx: ActiveContext): Promise<StudentConsentView> {
  assertStudent(ctx);
  const [applies, links] = await Promise.all([consentApplies(ctx.membershipId), familyLinksOf(ctx.membershipId)]);
  const rows =
    links.length > 0
      ? await db.studentConsent.findMany({
          where: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId, revokedAt: null, guardianshipId: { in: links.map((l) => l.id) } },
          select: { guardianshipId: true, grant: true, grantedAt: true },
        })
      : [];
  const on = new Map(rows.map((r) => [`${r.guardianshipId}|${r.grant}`, r.grantedAt]));
  // Where the grants do not apply the guardian sees everything, and the list says so.
  const linesFor = (guardianshipId: string): GrantLine[] =>
    STUDENT_CONSENT_GRANTS.map((grant) => {
      const at = on.get(`${guardianshipId}|${grant}`);
      return applies ? { grant, on: at !== undefined, grantedAt: at ?? null } : { grant, on: true, grantedAt: null };
    });
  const guardians = links.map((l) => ({
    guardianshipId: l.id,
    name: l.parent.preferredName ?? l.parent.name,
    relation: (GUARDIAN_RELATIONS as readonly string[]).includes(l.relation) ? (l.relation as GuardianRelation) : ("OTHER" as const),
    since: l.createdAt,
    grants: linesFor(l.id),
  }));
  return {
    applies,
    grants: STUDENT_CONSENT_GRANTS.map((grant) => {
      if (!applies) return { grant, on: true, grantedAt: null };
      const given = guardians.map((g) => g.grants.find((x) => x.grant === grant)!).filter((x) => x.on);
      return { grant, on: given.length > 0, grantedAt: given[0]?.grantedAt ?? null };
    }),
    guardians,
  };
}

/**
 * Grant or revoke one, TO ONE GUARDIAN (`guardianshipId`, one of the student's own family links) or, with none
 * named, to every family guardian linked to the student NOW — never to one linked later, who starts with nothing
 * (TA-555). The student's alone, and only where the grants apply (an adult at a college): a minor's guardian already
 * sees everything, and a page that let them "revoke" would be telling them something false.
 * Idempotent: granting what is granted, or revoking what is not, changes nothing and writes no audit row. The rows
 * and the audit row (which names the links changed) are written in one transaction.
 */
export async function setStudentConsent(ctx: ActiveContext, grant: StudentConsentGrant, on: boolean, guardianshipId?: string): Promise<{ changed: boolean }> {
  assertStudent(ctx);
  if (!(STUDENT_CONSENT_GRANTS as readonly string[]).includes(grant)) throw new AccessError("consent.refuseUnknownGrant");
  if (!(await consentApplies(ctx.membershipId))) throw new AccessError("consent.refuseNotAdult");
  const { schoolId, membershipId } = ctx;
  const links = await db.guardianship.findMany({
    where: { studentMembershipId: membershipId, status: "ACTIVE", relation: { not: "SCHOOL" }, ...(guardianshipId ? { id: guardianshipId } : {}) },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  // A link that is not this student's own family guardian's (another student's, the stand-in's, an ended one) is not found.
  if (guardianshipId && links.length === 0) throw new AccessError("consent.refuseNotYourGuardian", "NOT_FOUND");
  if (links.length === 0) {
    // Nobody to share with: a grant would be a row no guardian reads, and one linked later must start with nothing.
    if (on) throw new AccessError("consent.noGuardians");
    return { changed: false };
  }
  const linkIds = links.map((l) => l.id);
  const now = new Date();
  const changed = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const existing = await tx.studentConsent.findMany({ where: { studentMembershipId: membershipId, grant, guardianshipId: { in: linkIds } }, select: { id: true, guardianshipId: true, revokedAt: true } });
    const byLink = new Map(existing.map((r) => [r.guardianshipId, r]));
    const touched: string[] = [];
    for (const id of linkIds) {
      const row = byLink.get(id);
      const isOn = row !== undefined && row.revokedAt === null;
      if (isOn === on) continue;
      if (on) {
        await tx.studentConsent.upsert({
          where: { studentMembershipId_guardianshipId_grant: { studentMembershipId: membershipId, guardianshipId: id, grant } },
          create: { schoolId, studentMembershipId: membershipId, guardianshipId: id, grant, grantedAt: now },
          update: { grantedAt: now, revokedAt: null },
        });
      } else {
        await tx.studentConsent.updateMany({ where: { id: row!.id, schoolId, revokedAt: null }, data: { revokedAt: now } });
      }
      touched.push(id);
    }
    if (touched.length === 0) return false;
    await audit(
      {
        schoolId,
        actorUserId: ctx.user.id,
        action: on ? "student.consent.grant" : "student.consent.revoke",
        targetType: "Membership",
        targetId: membershipId,
        meta: { grant, guardianshipIds: touched },
      },
      tx,
    );
    return true;
  });
  return { changed };
}
