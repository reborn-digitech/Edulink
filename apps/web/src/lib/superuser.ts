import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { forTenant } from "./tenant-context";
import { generateToken, hashToken } from "./crypto";
import { schoolCode, slugify } from "./codes";
import { sendTeacherInvite } from "./email";
import { readJson, writeJson } from "./json";
import { syncStandinGuardian } from "./standin-guardian";
import { INVITE_TTL_DAYS } from "./constants";
import { normaliseLocation } from "./places";
import type { ActiveContext } from "./session";

/**
 * Whoever runs the server.
 *
 * THIS IS THE FIRST ACTOR IN THIS APP ABOVE A SCHOOL, and the README spent a
 * long time saying there wasn't one. So the shape of it matters more than the
 * feature: the temptation is a role that can do everything, and what is built
 * here is a key to two tables.
 *
 * A superuser can create a school, correct its details, invite its first
 * administrator, remove a school from the installation, and look inside any
 * school — see "THE OPERATOR'S SIGHT INTO A SCHOOL" further down. The flag
 * itself still opens exactly two tables (`app.is_superuser` appears in the
 * School and Invite policies and nowhere else); sight into a school's rows is
 * always through `withSchoolAccess`, which binds that one school and records
 * the visit where the school can read it.
 *
 * Removal is a button now, and deliberately not a delete: `removeSchool` runs
 * the ordinary departure machinery for the whole roll so every pupil leaves the
 * way an alumnus does — account intact, certificate issued — and the School row
 * itself is only flagged `removedAt`.
 */

export type SchoolSummary = {
  id: string;
  name: string;
  slug: string;
  code: string;
  city: string | null;
  country: string | null;
  logoPath: string | null;
  gradeLow: string | null;
  gradeHigh: string | null;
  timezone: string;
  verifiedAt: Date | null;
  createdAt: Date;
  /** Set when the operator took this school off the installation. */
  removedAt: Date | null;
  /** Pending admin invitations, so an operator can see a school with no admin yet. */
  pendingAdminInvites: number;
};

/** Throws unless this session belongs to somebody who runs the server. */
export function assertSuperuser(session: ActiveContext): void {
  if (!session.user.isSuperuser) {
    throw new AccessError("access.thisAreaBelongsToWhoeverRunsThe", "NOT_FOUND");
  }
}

/**
 * Every school on this installation.
 *
 * Works only because School is in SUPERUSER_TABLES — for anybody else this
 * returns the one school on their session, which is the whole point of the
 * tenancy model and is left completely intact.
 */
export type SchoolListOpts = {
  q?: string;
  /** live (default): not removed; removed; noadmin: live with no admin yet; unverified: live and not yet checked by the operator; all. */
  state?: "live" | "removed" | "noadmin" | "unverified" | "all";
  country?: string;
  sort?: "newest" | "oldest" | "name";
};

export async function listSchools(session: ActiveContext, opts: SchoolListOpts = {}): Promise<SchoolSummary[]> {
  assertSuperuser(session);
  const q = opts.q?.trim();
  const state = opts.state ?? "live";

  const schools = await db.school.findMany({
    where: {
      ...(state === "removed" ? { removedAt: { not: null } } : state === "all" ? {} : { removedAt: null }),
      ...(state === "unverified" ? { verifiedAt: null } : {}),
      ...(opts.country ? { country: opts.country } : {}),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: opts.sort === "name" ? { name: "asc" } : { createdAt: opts.sort === "oldest" ? "asc" : "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      code: true,
      city: true,
      country: true,
      logoPath: true,
      gradeLow: true,
      gradeHigh: true,
      timezone: true,
      verifiedAt: true,
      createdAt: true,
      removedAt: true,
    },
  });

  // Invite is the other superuser-readable table, so this count works without
  // being a member of any of these schools. Membership is NOT readable here,
  // deliberately — an operator sees that a school has nobody to run it yet, and
  // does not see who its people are.
  const invites = await db.invite.groupBy({
    by: ["schoolId"],
    where: { role: "ADMIN", status: "PENDING", expiresAt: { gt: new Date() } },
    _count: true,
  });
  const pending = new Map(invites.map((i) => [i.schoolId, i._count]));

  const rows = schools.map((school) => ({
    ...school,
    pendingAdminInvites: pending.get(school.id) ?? 0,
  }));
  // "No admin yet" is a fact about invitations, which the query above cannot
  // join on, so it narrows the rows rather than the where clause.
  return state === "noadmin" ? rows.filter((s) => s.pendingAdminInvites > 0) : rows;
}

/** Every country the server's schools name, for the operator's filter. */
export async function schoolCountries(session: ActiveContext): Promise<string[]> {
  assertSuperuser(session);
  const rows = await db.school.findMany({ where: { country: { not: null } }, select: { country: true }, distinct: ["country"], orderBy: { country: "asc" } });
  return rows.map((r) => r.country).filter((c): c is string => Boolean(c));
}

export async function getSchool(session: ActiveContext, schoolId: string) {
  assertSuperuser(session);
  return db.school.findUnique({ where: { id: schoolId } });
}

export type SchoolDetails = {
  name: string;
  contactEmail: string;
  contactPhone?: string | null;
  website?: string | null;
  addressLine?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  gradeLow?: string | null;
  gradeHigh?: string | null;
  timezone: string;
  brandPrimary?: string | null;
};

/** ⚠ `errorKey`, not a sentence — the leave.ts pattern; the action boundary
    translates into the reader's language. */
export type CreateResult =
  | { ok: true; schoolId: string; code: string }
  | { ok: false; errorKey: TranslationKey };

/**
 * Creates a school.
 *
 * COLLISIONS ARE HANDLED BY TRYING, not by looking first, and that is inherited
 * from the registration flow for a reason worth repeating: a pre-check asks
 * about OTHER schools, which the policies hide from an ordinary caller, so it
 * saw nothing, reported no clash, and left the unique index to fail the insert.
 * A superuser CAN see them all — but a pre-check would still be a race between
 * two operators, so this does the same race-free thing either way.
 */
export async function createSchool(
  session: ActiveContext,
  details: SchoolDetails,
): Promise<CreateResult> {
  assertSuperuser(session);

  const name = details.name.trim();
  if (name.length < 2) return { ok: false, errorKey: "root.giveSchoolName" };
  if (!details.contactEmail.trim()) return { ok: false, errorKey: "root.contactEmailRequired" };

  const rangeProblem = checkGradeRange(details.gradeLow, details.gradeHigh);
  if (rangeProblem) return { ok: false, errorKey: rangeProblem };

  const baseSlug = slugify(name);
  const location = normaliseLocation(details);

  for (let attempt = 0; attempt < 6; attempt++) {
    const schoolId = randomUUID();
    const code = schoolCode(name);
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    try {
      await db.school.create({
        data: {
          id: schoolId,
          name,
          slug,
          code,
          contactEmail: details.contactEmail.trim(),
          contactPhone: details.contactPhone || null,
          website: details.website || null,
          addressLine: details.addressLine || null,
          city: details.city || null,
          region: location.region,
          postalCode: details.postalCode || null,
          country: location.country,
          gradeLow: details.gradeLow || null,
          gradeHigh: details.gradeHigh || null,
          timezone: details.timezone,
          brandPrimary: details.brandPrimary || null,
          onboardingState: writeJson({ createdSchool: true }),
          // The operator's own mark, made by the operator's own hand: a
          // school added from /root is checked by the act of adding it. The
          // queue is for schools that registered themselves.
          verifiedAt: new Date(),
        },
      });

      // schoolId NULL, with the school named in meta. An operator's actions
      // belong to the operator, not to the tenant — so this appears in nobody's
      // Safety Centre. See NULL_SCHOOL_WRITABLE in scripts/gen-rls.ts.
      await audit({
        schoolId: null,
        actorUserId: session.user.id,
        action: "superuser.school.create",
        targetType: "School",
        targetId: schoolId,
        meta: { schoolId, name, code },
      });

      return { ok: true, schoolId, code };
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  return { ok: false, errorKey: "root.nameCollides" };
}

export async function updateSchool(
  session: ActiveContext,
  schoolId: string,
  details: Partial<SchoolDetails> & { logoPath?: string | null },
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);

  if (details.name !== undefined && details.name.trim().length < 2) {
    return { ok: false, errorKey: "root.giveSchoolName" };
  }
  const rangeProblem = checkGradeRange(details.gradeLow, details.gradeHigh);
  if (rangeProblem) return { ok: false, errorKey: rangeProblem };

  const existing = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, country: true, region: true },
  });
  if (!existing) return { ok: false, errorKey: "root.noSuchSchool" };

  // A partial correction that touches either half of the location is
  // normalised against the other half the row already holds, so "country:
  // Gujarat" alone still lands as India / Gujarat.
  const touchesLocation = details.country !== undefined || details.region !== undefined;
  const location = touchesLocation
    ? normaliseLocation({
        country: details.country !== undefined ? details.country : existing.country,
        region: details.region !== undefined ? details.region : existing.region,
      })
    : null;

  await db.school.update({
    where: { id: schoolId },
    data: {
      ...(details.name !== undefined ? { name: details.name.trim() } : {}),
      ...(details.contactEmail !== undefined ? { contactEmail: details.contactEmail.trim() } : {}),
      ...(details.contactPhone !== undefined ? { contactPhone: details.contactPhone || null } : {}),
      ...(details.website !== undefined ? { website: details.website || null } : {}),
      ...(details.addressLine !== undefined ? { addressLine: details.addressLine || null } : {}),
      ...(details.city !== undefined ? { city: details.city || null } : {}),
      ...(location ? { region: location.region, country: location.country } : {}),
      ...(details.postalCode !== undefined ? { postalCode: details.postalCode || null } : {}),
      ...(details.gradeLow !== undefined ? { gradeLow: details.gradeLow || null } : {}),
      ...(details.gradeHigh !== undefined ? { gradeHigh: details.gradeHigh || null } : {}),
      ...(details.timezone !== undefined ? { timezone: details.timezone } : {}),
      ...(details.brandPrimary !== undefined ? { brandPrimary: details.brandPrimary || null } : {}),
      ...(details.logoPath !== undefined ? { logoPath: details.logoPath } : {}),
    },
  });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.school.update",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, fields: Object.keys(details) },
  });

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* The content team, appointed by the operator                                 */
/* -------------------------------------------------------------------------- */

/**
 * The operator appoints and dismisses the content team from /root.
 *
 * THIS USED TO BE CLI-ONLY, deliberately — make-app-admin.ts kept "who can
 * write to every school's question bank" out of reach of any web session. The
 * product decision has since been made the other way: the operator, who can
 * already remove a whole school from a browser, appoints the content team from
 * one too. What the CLI keeps is the bootstrap and the recovery path — the
 * first superuser still cannot be appointed from the web, and an installation
 * whose operator locked themselves out still has the machine.
 *
 * APPOINT BY EMAIL, TO AN EXISTING ACCOUNT. There is no invite token here on
 * purpose: an app-admin invite would need a school-less Invite row (the model
 * requires a schoolId), and the flag on a half-created account is a standing
 * key nobody is using. The person registers through the ordinary flow first,
 * then the operator flips the flag — same order the CLI imposes, and the error
 * message says exactly that.
 *
 * The User table carries no row-level policy (a parent must see themselves
 * before any school is known), so these writes need no tenant binding; the
 * boundary is `assertSuperuser`, the same application boundary that guards
 * every other operator power. Every change is audited with no school id —
 * this is a server-level appointment and belongs in the server log.
 */

export type AppAdminSummary = {
  id: string;
  name: string;
  email: string | null;
  disabledAt: Date | null;
  isSuperuser: boolean;
};

/** Everybody holding the content-team flag, for the operator's list. */
export async function listAppAdmins(session: ActiveContext): Promise<AppAdminSummary[]> {
  assertSuperuser(session);
  return db.user.findMany({
    where: { isAppAdmin: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, disabledAt: true, isSuperuser: true },
  });
}

/** Flips the flag on for the account behind an email address. */
export async function appointAppAdmin(
  session: ActiveContext,
  emailRaw: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);

  const email = emailRaw.trim().toLowerCase();
  if (!email) return { ok: false, errorKey: "root.contentTeamNoEmail" };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, isAppAdmin: true, disabledAt: true },
  });
  // One error for "no account", worded as the instruction it implies: the
  // person registers first, the operator appoints second.
  if (!user) return { ok: false, errorKey: "root.contentTeamNoAccount" };
  if (user.disabledAt) return { ok: false, errorKey: "root.contentTeamDisabledAccount" };
  if (user.isAppAdmin) return { ok: false, errorKey: "root.contentTeamAlready" };

  await db.user.update({ where: { id: user.id }, data: { isAppAdmin: true } });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.appadmin.appoint",
    targetType: "User",
    targetId: user.id,
    meta: { email },
  });

  return { ok: true };
}

/**
 * Flips the flag off. No last-one guard, matching the CLI: an installation
 * with no app admin still runs — the bank is simply not being curated. The
 * operator can also dismiss themselves harmlessly; their own gate is the
 * superuser flag, not this one.
 */
export async function dismissAppAdmin(
  session: ActiveContext,
  userId: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isAppAdmin: true, email: true },
  });
  if (!user || !user.isAppAdmin) return { ok: false, errorKey: "root.contentTeamNotAMember" };

  await db.user.update({ where: { id: user.id }, data: { isAppAdmin: false } });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.appadmin.dismiss",
    targetType: "User",
    targetId: user.id,
    meta: { email: user.email },
  });

  return { ok: true };
}

/** The delegates the removal transaction touches — see school-record.ts. */
type RemovalTx = {
  schoolRecord: { createMany(args: unknown): Promise<unknown> };
  membership: { updateMany(args: unknown): Promise<unknown> };
  enrollment: { updateMany(args: unknown): Promise<unknown> };
  guardianship: { updateMany(args: unknown): Promise<unknown> };
  jobPosting: { updateMany(args: unknown): Promise<unknown> };
  enquiry: { updateMany(args: unknown): Promise<unknown> };
};

type RestoreTx = {
  schoolRecord: { deleteMany(args: unknown): Promise<{ count: number }> };
  membership: { updateMany(args: unknown): Promise<{ count: number }> };
  enrollment: { updateMany(args: unknown): Promise<{ count: number }> };
};

/**
 * Written onto every certificate a removal mints, and the marker `restoreSchool`
 * uses to take back exactly those and no other — an organic leaver's
 * certificate never carries it. One constant so the two can never drift.
 */
const REMOVAL_NOTE = "The school was removed from this Relay installation.";

/**
 * Takes a school off the installation.
 *
 * REMOVED, NOT DELETED. A hard delete cascades through everything the school
 * owns — including every SchoolRecord it ever issued, which is the one document
 * a pupil is supposed to carry away. So removal is the departure machinery from
 * school-record.ts run for the whole roll at once: every pupil still on it gets
 * a leaving certificate with their snapshot figures, every membership gets its
 * `leftAt`, and the school itself gets `removedAt` and drops out of every
 * listing, join code and switcher.
 *
 * THE CHILDREN KEEP THEIR ACCOUNTS. A User belongs to no school; what ends here
 * is the membership, exactly as it does for a pupil who transfers. Their
 * certificate, report cards and badges stay reachable through the same
 * user-keyed policies every alumnus already relies on (see CHILD-PORTABLE in
 * gen-rls.ts).
 *
 * ONE TRANSACTION for the roll, for the same reason recordDeparture is one: a
 * membership ended without its certificate is a child who vanished with nothing
 * to show for their years. `removedAt` is set after and outside it — if that
 * one write fails the school is left fully intact and the operation can simply
 * be pressed again (certificates already issued are skipped as duplicates).
 */
export async function removeSchool(
  session: ActiveContext,
  schoolId: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, removedAt: true },
  });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };

  const leftAt = new Date();

  const counts = await withSchoolAccess(session, schoolId, async () => {
    const roll = await db.membership.findMany({
      where: { schoolId, leftAt: null },
      select: { id: true, userId: true, role: true, gradeLevel: true, joinedAt: true },
    });
    const students = roll.filter((m) => m.role === "STUDENT");

    // Snapshot figures for every certificate in two GROUP BYs, not two queries
    // per child — the same counts recordDeparture takes, taken once for the roll.
    const [attendance, reportCards] = await Promise.all([
      db.attendanceRecord.groupBy({
        by: ["studentMembershipId", "status"],
        where: { schoolId, studentMembershipId: { in: students.map((s) => s.id) } },
        _count: { _all: true },
      }),
      db.reportCard.groupBy({
        by: ["studentMembershipId"],
        where: {
          schoolId,
          status: "PUBLISHED",
          studentMembershipId: { in: students.map((s) => s.id) },
        },
        _count: { _all: true },
      }),
    ]);

    const marked = new Map<string, number>();
    const present = new Map<string, number>();
    for (const row of attendance) {
      const id = row.studentMembershipId;
      marked.set(id, (marked.get(id) ?? 0) + row._count._all);
      // LATE COUNTS AS PRESENT, matching every other attendance figure here.
      if (row.status === "PRESENT" || row.status === "LATE") {
        present.set(id, (present.get(id) ?? 0) + row._count._all);
      }
    }
    const cards = new Map(reportCards.map((r) => [r.studentMembershipId, r._count._all]));

    await db.$tenantTransaction(async (tx: unknown) => {
      const t = tx as RemovalTx;
      // `skipDuplicates` is what makes re-running safe: a pupil whose departure
      // was already recorded keeps the certificate that was written then.
      await t.schoolRecord.createMany({
        data: students.map((s) => ({
          schoolId,
          studentUserId: s.userId,
          studentMembershipId: s.id,
          schoolName: school.name,
          gradeLevel: s.gradeLevel,
          joinedAt: s.joinedAt,
          leftAt,
          reason: "LEFT",
          destination: null,
          note: REMOVAL_NOTE,
          attendanceMarked: marked.get(s.id) ?? 0,
          attendancePresent: present.get(s.id) ?? 0,
          reportCardCount: cards.get(s.id) ?? 0,
          issuedByMembershipId: null,
        })),
        skipDuplicates: true,
      });

      // REMOVED rather than deleted, as cohort.ts does it, so last term's marks
      // still have a class to belong to. Stamped with the removal moment —
      // the same instant every membership gets — which is both the house
      // style (cohort and promotion stamp too) and what lets `restoreSchool`
      // revive exactly these enrolments and no organically-removed one.
      await t.enrollment.updateMany({
        where: { schoolId, status: "ACTIVE" },
        data: { status: "REMOVED", removedAt: leftAt },
      });

      // Staff and pupils alike: everybody's post at this school has ended.
      await t.membership.updateMany({
        where: { schoolId, leftAt: null },
        data: { leftAt },
      });

      // The school's stand-in guardianships end with the school, the same rule
      // recordDeparture applies per pupil: a teacher is guardian of a pupil
      // they teach, never of an alumnus. Family guardianships deliberately
      // survive — they are what keeps each child's record reachable to their
      // own parents after the school is gone.
      await t.guardianship.updateMany({
        where: { studentSchoolId: schoolId, relation: "SCHOOL", status: "ACTIVE" },
        data: { status: "REVOKED" },
      });

      // The school leaves the marketplace with the same stamp. This is not
      // just tidiness: JobPosting's global-read clause is `status = 'OPEN'`
      // and DELIBERATELY does not check the school (a policy pair that
      // reference each other is infinite recursion — see gen-rls.ts), so
      // closing here is what actually takes a removed school's vacancies off
      // every teacher's board. Enquiries close with the same stamp: the desk
      // that would have answered them has just stopped existing, and an
      // OPEN thread nobody can ever answer is a promise the platform would
      // be making on behalf of nobody. Restore reopens neither — a vacancy
      // is timely, and a school that returns can post and answer afresh.
      await t.jobPosting.updateMany({
        where: { schoolId, status: "OPEN" },
        data: { status: "CLOSED", closedAt: leftAt },
      });
      await t.enquiry.updateMany({
        where: { schoolId, status: "OPEN" },
        data: { status: "CLOSED", closedAt: leftAt },
      });
    });

    return { members: roll.length, certificates: students.length };
  });

  await db.school.update({ where: { id: schoolId }, data: { removedAt: leftAt } });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.school.remove",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, name: school.name, ...counts },
  });

  return { ok: true };
}

/**
 * Puts a removed school back.
 *
 * THE REMOVAL MOMENT IS THE UNDO LIST. `removeSchool` stamps one timestamp —
 * `School.removedAt` — onto every membership it closes and every enrolment it
 * removes, and writes `REMOVAL_NOTE` onto every certificate it mints. So the
 * restore needs no bookkeeping table: everything carrying exactly that stamp
 * is the removal's work and comes back; everything else — the pupil who left
 * in June with a real certificate, the enrolment a teacher ended by hand — is
 * somebody's decision and stays exactly as they left it.
 *
 * STAND-INS ARE REBUILT, NOT REVIVED. The removal revoked the school-relation
 * guardianships, and Guardianship carries no revocation stamp — but reviving
 * old rows would be wrong anyway: the right stand-in is whoever teaches the
 * child NOW, and `syncStandinGuardian` already computes that from scratch.
 * Reconcile, don't choreograph — the rule that file wrote down.
 *
 * Schools removed before enrolment stamping existed restore their people but
 * not their class lists — the counts in the audit row say so honestly, and
 * the admin re-enrols from the class pages.
 */
/**
 * MANY SCHOOLS, ONE PRESS, TWO DOORS — the same two the single-school page
 * has. Removal is the flag that turns a roll into leavers and can be put
 * back; erasure is the shredder. Each school goes through the door it would
 * have gone through alone, so every refusal, audit row and cascade is the
 * one already proven for one; this only loops, and reports per school.
 */
export type BulkOutcome = { done: number; failed: { id: string; name: string | null; errorKey: TranslationKey }[] };

export async function removeSchools(session: ActiveContext, schoolIds: string[]): Promise<BulkOutcome> {
  assertSuperuser(session);
  const ids = [...new Set(schoolIds)].slice(0, 100);
  const names = new Map((await db.school.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map((s) => [s.id, s.name]));
  const out: BulkOutcome = { done: 0, failed: [] };
  for (const id of ids) {
    const result = await removeSchool(session, id);
    if (result.ok) out.done++;
    else out.failed.push({ id, name: names.get(id) ?? null, errorKey: result.errorKey ?? "root.noSuchSchool" });
  }
  return out;
}

/**
 * The bulk shredder's gate is the COUNT, typed: "DELETE 3" for three
 * schools. Checked here rather than only in the dialog, because a POST is
 * its own entry point; each school's own name gate is then satisfied from
 * the row, since the operator has already said, in words, how many go.
 */
export async function deleteSchoolsEntirely(
  session: ActiveContext,
  schoolIds: string[],
  confirmPhrase: string,
): Promise<BulkOutcome & { ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);
  const ids = [...new Set(schoolIds)].slice(0, 100);
  if (ids.length === 0) return { ok: false, errorKey: "root.noSuchSchool", done: 0, failed: [] };
  if (confirmPhrase.trim().toUpperCase() !== `DELETE ${ids.length}`) {
    return { ok: false, errorKey: "root.bulkDeleteMismatch", done: 0, failed: [] };
  }
  const rows = await db.school.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const names = new Map(rows.map((s) => [s.id, s.name]));
  const out: BulkOutcome = { done: 0, failed: [] };
  for (const id of ids) {
    const name = names.get(id);
    if (!name) {
      out.failed.push({ id, name: null, errorKey: "root.noSuchSchool" });
      continue;
    }
    const result = await deleteSchoolEntirely(session, id, name);
    if (result.ok) out.done++;
    else out.failed.push({ id, name, errorKey: result.errorKey ?? "root.noSuchSchool" });
  }
  return { ok: out.failed.length === 0, ...out };
}

export async function restoreSchool(
  session: ActiveContext,
  schoolId: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, removedAt: true },
  });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  const removedAt = school.removedAt;
  if (!removedAt) return { ok: false, errorKey: "root.schoolNotRemoved" };

  const counts = await withSchoolAccess(session, schoolId, async () => {
    const revived = await db.membership.findMany({
      where: { schoolId, leftAt: removedAt },
      select: { id: true, role: true },
    });

    const result = { members: revived.length, certificates: 0, enrollments: 0 };
    await db.$tenantTransaction(async (tx: unknown) => {
      const t = tx as RestoreTx;
      result.certificates = (
        await t.schoolRecord.deleteMany({
          where: { schoolId, leftAt: removedAt, note: REMOVAL_NOTE },
        })
      ).count;
      await t.membership.updateMany({
        where: { schoolId, leftAt: removedAt },
        data: { leftAt: null },
      });
      result.enrollments = (
        await t.enrollment.updateMany({
          where: { schoolId, status: "REMOVED", removedAt },
          data: { status: "ACTIVE", removedAt: null },
        })
      ).count;
    });

    // Every revived pupil gets the stand-in reconciler, which puts a school
    // guardian back only where no family holds one — the ordinary rule.
    for (const membership of revived) {
      if (membership.role !== "STUDENT") continue;
      await syncStandinGuardian({
        schoolId,
        studentMembershipId: membership.id,
        actorUserId: session.user.id,
      });
    }

    return result;
  });

  // The flag comes off LAST — the mirror of removal, which flags last too. A
  // restore that fails midway leaves the school still marked removed, so the
  // operator can simply run it again: every predicate above keys on the stamp
  // and is idempotent, and nothing here checks the flag once inside.
  await db.school.update({ where: { id: schoolId }, data: { removedAt: null } });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.school.restore",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, name: school.name, ...counts },
  });

  return { ok: true };
}

/**
 * The operator's mark on a school: somebody has checked that it is real.
 *
 * WHAT THE MARK OPENS is one thing, and `mayBringOver` in pen.ts is where it
 * is read: a school may attach a membership to a pupil's EXISTING account, by
 * student code or PEN, only if it carries this mark. Anybody can register a
 * school and be its admin at once, so without the mark a self-registered
 * school adds new pupils and does everything else, and cannot reach a child
 * who already has an account elsewhere. The security assessment of 2026-09-24
 * put the check in; nothing in the app could set the mark until this.
 *
 * WITHDRAWING IS THE SAME DOOR, the other way, for a mark given by mistake.
 * It ends nothing: pupils already brought over keep their memberships, and a
 * pupil returning to a school that already knew them needs no mark at all.
 *
 * A school already in the state asked for is left as it is, first stamp and
 * all, and no second audit row is written: the press was harmless and the
 * log says what changed, not what was pressed. A removed school is refused,
 * since every door that would grow it again is shut until it is restored.
 *
 * The School table is one of the two the superuser flag opens, so this needs
 * no tenant binding and records no visit: nothing inside the school is read.
 */
export async function setSchoolVerified(
  session: ActiveContext,
  schoolId: string,
  verified: boolean,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, removedAt: true, verifiedAt: true },
  });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };
  if (Boolean(school.verifiedAt) === verified) return { ok: true };

  await db.school.update({ where: { id: schoolId }, data: { verifiedAt: verified ? new Date() : null } });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: verified ? "superuser.school.verify" : "superuser.school.unverify",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, name: school.name },
  });

  return { ok: true };
}

/**
 * Invites somebody to be an administrator of a school.
 *
 * THE ONLY WAY A SCHOOL GETS ITS FIRST ADMIN, which is why Invite is the second
 * superuser table. Note what this does NOT do: it does not create the user, set
 * their password, or make them a member. It writes an invitation, and the person
 * accepts it themselves through the ordinary `/invite/[token]` flow. An operator
 * who could mint memberships directly could give themselves one.
 *
 * `createdByMembershipId` is null, which is correct and slightly unusual: a
 * superuser has no membership anywhere. The audit log carries who it really was.
 */
export async function inviteAdmin(
  session: ActiveContext,
  schoolId: string,
  input: { email: string; name?: string | null; role?: "ADMIN" | "PRINCIPAL" },
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, errorKey: "root.emailLooksWrong" };
  }
  // NOT THEMSELVES. The invitation is the one door into a school's admin
  // seat that the operator holds the key to, and an operator who could
  // address it to their own account would be minting themselves a
  // membership in two clicks — exactly what "no membership is created here"
  // below exists to prevent. Refused by address, the only identity an
  // invitation carries. (The sentence is the generic refusal: a dedicated
  // one needs the three dictionaries.)
  const own = session.user.email?.trim().toLowerCase();
  if (own && own === email) return { ok: false, errorKey: "root.didNotWork" };

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, removedAt: true },
  });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  // A removed school must not quietly grow a new administrator.
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };

  const role = input.role ?? "ADMIN";

  const already = await db.invite.findFirst({
    where: { schoolId, email, status: "PENDING" },
    select: { id: true },
  });
  if (already) return { ok: false, errorKey: "root.inviteAlreadyWaiting" };

  const token = generateToken();
  await db.invite.create({
    data: {
      schoolId,
      role,
      email,
      name: input.name || null,
      tokenHash: hashToken(token),
      // Deliberately null: whoever runs the server is a member of no school.
      createdByMembershipId: null,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendTeacherInvite(email, `${appUrl}/invite/${token}`, school.name, "Relay");

  // TWICE, ON PURPOSE. The unattributed row is the operator's own record and
  // is what /root/audit lists; the row bound to the school is what puts "the
  // Relay team invited an administrator" in THAT school's Safety Centre —
  // the same standing as a takedown or a suspension. Until it was written the
  // school could not see the one operator action that hands out its keys.
  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.invite.admin",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, email, role },
  });
  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "superuser.invite.admin",
    targetType: "School",
    targetId: schoolId,
    meta: { email, role },
  });

  return { ok: true };
}

/** Pending admin/principal invitations for one school. */
export async function listAdminInvites(session: ActiveContext, schoolId: string) {
  assertSuperuser(session);
  return db.invite.findMany({
    where: { schoolId, role: { in: ["ADMIN", "PRINCIPAL"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      expiresAt: true,
    },
    take: 50,
  });
}

export async function revokeInvite(
  session: ActiveContext,
  inviteId: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  assertSuperuser(session);
  const result = await db.invite.updateMany({
    where: { id: inviteId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (result.count === 0) return { ok: false, errorKey: "root.inviteNotPending" };

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.invite.revoke",
    targetType: "Invite",
    targetId: inviteId,
  });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Grade ranges                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The grades a school actually teaches, e.g. 3–10, 5–12, K–5.
 *
 * FREE-FORM STRINGS, NOT NUMBERS, and the schema has said so since the
 * beginning: "K", "Nursery", "LKG", "Reception" and "I" are all real first
 * years, and a school that teaches 3 to 10 is not describing the same thing as
 * one that teaches K to 5. So the range is compared numerically when BOTH ends
 * are numeric, and otherwise accepted as written. Refusing "K" because it will
 * not parse would be the software telling a school it is named wrong.
 */
export function gradeToNumber(grade: string | null | undefined): number | null {
  const trimmed = (grade ?? "").trim();
  if (!trimmed) return null;
  const asNumber = Number(trimmed);
  return Number.isInteger(asNumber) ? asNumber : null;
}

export function checkGradeRange(
  low: string | null | undefined,
  high: string | null | undefined,
): TranslationKey | null {
  const lowNum = gradeToNumber(low);
  const highNum = gradeToNumber(high);
  if (lowNum === null || highNum === null) return null; // not both numeric: accept as written
  if (lowNum > highNum) return "root.lowestAboveHighest";
  return null;
}

/**
 * Every grade in a school's range, as strings, for the class-creation form.
 *
 * Returns an empty list when either end is non-numeric — a school using "LKG"
 * to "V" gets a free-text box instead of a dropdown, which is the honest
 * fallback rather than a guessed sequence.
 */
export function gradesInRange(
  low: string | null | undefined,
  high: string | null | undefined,
): string[] {
  const lowNum = gradeToNumber(low);
  const highNum = gradeToNumber(high);
  if (lowNum === null || highNum === null || lowNum > highNum) return [];
  // A guard rather than a limit: 40 grades means the range is wrong, and
  // rendering 900 options would only hide that.
  if (highNum - lowNum > 40) return [];
  return Array.from({ length: highNum - lowNum + 1 }, (_, i) => String(lowNum + i));
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/* -------------------------------------------------------------------------- */
/* The operator's own trail                                                    */
/* -------------------------------------------------------------------------- */

export type ServerAuditRow = {
  id: string;
  action: string;
  /** Null when the row was written by a script with no actor — the page says "System". */
  actorUserId: string | null;
  /** Null when the actor's account no longer exists — the page says "Deleted user". */
  actorName: string | null;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  at: Date;
};

export type ServerAuditFilter = {
  /** An exact action, or a family with a trailing dot: "superuser." */
  action?: string;
  /** Matches the actor's name, the target's name/email in meta, or the ip. */
  q?: string;
  from?: Date;
  to?: Date;
  /** Leave out rows whose actor account has since been deleted. */
  liveActorsOnly?: boolean;
  skip?: number;
  take?: number;
};

export type ServerAuditPage = {
  rows: ServerAuditRow[];
  total: number;
  skip: number;
  take: number;
  /** Every action present in the log, for the filter menu. */
  actions: string[];
};

/** The families of action the server log shows. One place, so the filter menu and the query agree. */
export const SERVER_AUDIT_WHERE: Prisma.AuditLogWhereInput = {
  schoolId: null,
  OR: [
    { action: { startsWith: "superuser." } },
    { action: { startsWith: "operator." } },
    { action: { in: ["expert.invite", "expert.profile.update"] } },
  ],
};

/**
 * Everything done from outside any school.
 *
 * THE ROWS EXISTED AND NOTHING COULD READ THEM. Every operator action is
 * audited with `schoolId` NULL so it appears in no tenant's Safety Centre —
 * correct, and it meant the trail had no reader anywhere in the app. A record
 * that only `psql` can see is one that will not be looked at after an incident,
 * which is the only time it matters.
 *
 * `schoolId: null` in the WHERE is not the security boundary — the policy is,
 * and it lets a superuser read exactly these rows. The filter is here so the
 * query says what it means, and so that a superuser who ALSO administers a
 * school does not find their own school's history mixed into the server log.
 *
 * "DELETED USER" ON EVERY ROW is not a lookup failing: it is what a server
 * whose test suites create an operator, act, and delete the operator again
 * looks like after a month. The actor id is kept on the row (there is no
 * foreign key, on purpose — an audit row must outlive its actor), the name
 * is resolved at read time, and a name that no longer resolves is reported
 * as null so the page can say so honestly and the filter can hide it.
 */
export async function listServerAudit(
  session: ActiveContext,
  opts: ServerAuditFilter = {},
): Promise<ServerAuditPage> {
  assertSuperuser(session);

  const take = Math.min(Math.max(opts.take ?? 50, 1), 200);
  const skip = Math.max(opts.skip ?? 0, 0);
  const q = opts.q?.trim();

  const where: Prisma.AuditLogWhereInput = {
    AND: [
      SERVER_AUDIT_WHERE,
      ...(opts.action
        ? [opts.action.endsWith(".") ? { action: { startsWith: opts.action } } : { action: opts.action }]
        : []),
      ...(opts.from ? [{ createdAt: { gte: opts.from } }] : []),
      ...(opts.to ? [{ createdAt: { lte: opts.to } }] : []),
    ],
  };

  // A text search has to see actor names, which live on User, not on the row.
  // Resolve the matching people first and search by id; the meta string is
  // searched as text because it is JSON in a text column.
  if (q) {
    const people = await db.user.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { preferredName: { contains: q, mode: "insensitive" } }] },
      select: { id: true },
      take: 200,
    });
    (where.AND as Prisma.AuditLogWhereInput[]).push({
      OR: [
        { actorUserId: { in: people.map((p) => p.id) } },
        { meta: { contains: q, mode: "insensitive" } },
        { ip: { contains: q } },
        { action: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const [candidates, actionRows] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: opts.liveActorsOnly ? 2000 : take, skip: opts.liveActorsOnly ? 0 : skip }),
    db.auditLog.findMany({ where: SERVER_AUDIT_WHERE, distinct: ["action"], select: { action: true } }),
  ]);

  const actorIds = [...new Set(candidates.map((r) => r.actorUserId).filter((id): id is string => Boolean(id)))];
  const actors = await db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, preferredName: true },
  });
  const nameById = new Map(actors.map((a) => [a.id, a.preferredName ?? a.name]));

  const shaped = candidates.map((row) => ({
    id: row.id,
    action: row.action,
    actorUserId: row.actorUserId,
    actorName: row.actorUserId ? (nameById.get(row.actorUserId) ?? null) : null,
    targetType: row.targetType,
    targetId: row.targetId,
    meta: readJson<Record<string, unknown>>(row.meta, {}),
    ip: row.ip,
    at: row.createdAt,
  }));

  if (opts.liveActorsOnly) {
    // Filtered in memory over a bounded window: "live" is a property of the
    // User table, not of the row, and joining the two is what an audit log
    // deliberately does not do.
    const live = shaped.filter((r) => r.actorUserId === null || r.actorName !== null);
    return { rows: live.slice(skip, skip + take), total: live.length, skip, take, actions: actionRows.map((a) => a.action).sort() };
  }

  const total = await db.auditLog.count({ where });
  return { rows: shaped, total, skip, take, actions: actionRows.map((a) => a.action).sort() };
}

/* -------------------------------------------------------------------------- */
/* Curating the expert marketplace                                             */
/* -------------------------------------------------------------------------- */

/**
 * THE MISSING HALF OF A FEATURE THAT WAS OTHERWISE FINISHED.
 *
 * `ExpertProfile.publishedAt` has always been the curation gate, and it works:
 * an unpublished expert is invisible to every school, cannot be booked, and
 * cannot be paired with a child. What did not exist was anything that SET it.
 * Only `prisma/seed.ts` ever wrote the column, so on a real installation no
 * expert could reach the marketplace at all without somebody opening psql — a
 * whole built feature standing behind a door with no handle. The same class of
 * bug as the empty VAPID keys and the unused AUTH_SECRET, and found the same
 * way: by asking what proves the data moved end to end.
 *
 * WHY THIS BELONGS TO THE OPERATOR AND NOT TO A SCHOOL. An expert belongs to no
 * school — that is the point of the marketplace — so no school is in a position
 * to vouch for one, and a school that could publish would be publishing an
 * adult to every OTHER school on the installation. Admins and teachers may
 * still INVITE an expert; what an invitation buys is a profile, not an
 * audience. Approval is the operator's, which is what makes "subject to
 * approval" true rather than a sentence in a document.
 *
 * NO POLICY CHANGE WAS NEEDED, and that is worth saying because the rest of
 * this file is about a boundary held in Postgres. ExpertProfile is in
 * NO_SCHOOL_POLICY — it holds no school-owned rows — so an operator writing it
 * is not a widening of `SUPERUSER_TABLES`, and they still cannot read a single
 * register. `verifiedAt` is set alongside because the two answer different
 * questions: published is "may schools see this person", verified is "has a
 * human checked who they are", and a marketplace that conflates them is one
 * where being listed implies being checked.
 */

export type CurationEntry = {
  profileId: string;
  userId: string;
  name: string;
  email: string | null;
  headline: string;
  bio: string;
  organisation: string | null;
  specialisms: string[];
  offering: string;
  mentorCapacity: number | null;
  activeMentorships: number;
  publishedAt: Date | null;
  verifiedAt: Date | null;
  createdAt: Date;
};

/**
 * Every expert profile on the installation, unpublished first.
 *
 * UNPUBLISHED FIRST because that is the queue. A list sorted by name buries the
 * three people waiting to be looked at underneath forty who were dealt with
 * months ago, and a queue nobody can find is a queue nobody works. Postgres
 * puts NULL last in an ascending sort, so "first" has to be said: without it
 * the queue sat under everyone already dealt with.
 */
export async function listExpertsForCuration(session: ActiveContext): Promise<CurationEntry[]> {
  assertSuperuser(session);

  const profiles = await db.expertProfile.findMany({
    orderBy: [{ publishedAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
    take: 500,
    select: {
      id: true,
      userId: true,
      headline: true,
      bio: true,
      organisation: true,
      specialisms: true,
      offering: true,
      mentorCapacity: true,
      activeMentorships: true,
      publishedAt: true,
      verifiedAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return profiles.map((profile) => ({
    profileId: profile.id,
    userId: profile.userId,
    name: profile.user.name,
    email: profile.user.email,
    headline: profile.headline,
    bio: profile.bio,
    organisation: profile.organisation,
    specialisms: readJson<string[]>(profile.specialisms, []),
    offering: profile.offering,
    mentorCapacity: profile.mentorCapacity,
    activeMentorships: profile.activeMentorships,
    publishedAt: profile.publishedAt,
    verifiedAt: profile.verifiedAt,
    createdAt: profile.createdAt,
  }));
}

export type CurationResult = { ok: true } | { ok: false; errorKey: TranslationKey };

/**
 * Puts an expert in front of schools, or takes them back out.
 *
 * `verified` is a SEPARATE argument rather than being implied by publishing,
 * because they are separate claims and the marketplace shows a badge for the
 * second. An operator who has read a profile and thinks it is reasonable may
 * publish; only one who has actually checked an identity should verify.
 *
 * REFUSES TO PUBLISH AN EMPTY PROFILE. `updateOwnProfile` requires a headline,
 * but a profile created by accepting an invitation has whatever the invitation
 * carried — which can be nothing. Publishing that puts a blank card in a
 * marketplace and tells a school it has been curated.
 */
export async function setExpertStanding(
  session: ActiveContext,
  profileId: string,
  next: { published: boolean; verified: boolean },
): Promise<CurationResult> {
  assertSuperuser(session);

  const profile = await db.expertProfile.findUnique({
    where: { id: profileId },
    select: { id: true, headline: true, publishedAt: true, user: { select: { name: true } } },
  });
  if (!profile) return { ok: false, errorKey: "root.noSuchExpert" };

  if (next.published && profile.headline.trim().length < 3) {
    return {
      ok: false,
      errorKey: "root.noHeadline",
    };
  }

  // UNPUBLISHING DOES NOT END ANYTHING ALREADY AGREED. Existing bookings and
  // mentorships stay exactly as they were: a school that has arranged an hour
  // next Tuesday, or a child who has a mentor, must not have it removed
  // silently because somebody was taken off a list. It stops them being found.
  await db.expertProfile.update({
    where: { id: profileId },
    data: {
      publishedAt: next.published ? (profile.publishedAt ?? new Date()) : null,
      verifiedAt: next.verified ? new Date() : null,
      verifiedBy: next.verified ? session.user.id : null,
    },
  });

  // No schoolId: an operator's actions belong to the operator and land in no
  // tenant's Safety Centre. See the NULL_SCHOOL_WRITABLE note in gen-rls.ts.
  await audit({
    actorUserId: session.user.id,
    action: next.published ? "expert.publish" : "expert.unpublish",
    targetType: "ExpertProfile",
    targetId: profileId,
    meta: { name: profile.user.name, verified: next.verified },
  });

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Looking inside a school                                                     */
/* -------------------------------------------------------------------------- */

/**
 * THE OPERATOR'S SIGHT INTO A SCHOOL, ALWAYS ON.
 *
 * This used to be a request flow: the operator opened one school at a time, for
 * a written reason, on a sixty-minute grant. The product decision has since
 * been made the other way — the operator holds total access to every school on
 * the installation, down to the individual, with no door to knock on first.
 *
 * WHAT SURVIVES FROM THE OLD DESIGN is the part that made it accountable: the
 * school is still told. Every look inside writes an OperatorAccess row (one per
 * hour rather than one per query, so the school reads "the operator was here
 * this afternoon" and not five hundred lines of it), and that row surfaces in
 * the school's own Safety Centre exactly as before. Actions taken inside —
 * takedowns, suspensions — are audited against the school's id as they always
 * were. The operator no longer asks; they are still seen.
 *
 * MECHANICALLY, `app.is_superuser` still opens exactly two tables, School and
 * Invite. Everything else is reached by binding the ONE school being looked at
 * through `asOperatorIn`, so the ordinary tenant policies govern the operator
 * exactly as they govern that school's admin — including the part where the
 * school next door stays invisible to the queries of this one.
 */

/**
 * Binds one school AS THE OPERATOR, carrying the flag with it.
 *
 * NOT `forSchool`, and the difference cost a real bug. `forSchool` derives
 * `userId` and `isSuperuser` from the OVERRIDE STORE — which is exactly right
 * when it is narrowing inside an existing context, and empty on a fresh request.
 * So an operator writing their own grant arrived at Postgres with
 * `app.is_superuser` unset, and the INSERT policy refused it: `new row violates
 * row-level security policy for table "OperatorAccess"`.
 *
 * WHICH IS THE POLICY DOING ITS JOB. The application intended to write that row
 * and the database would not let it, because nothing had said who was asking.
 * The fix is to say so — explicitly, from the session in hand — rather than to
 * loosen the policy, and it is worth writing down because the failure was loud
 * only by luck: a SELECT in the same state returns zero rows and looks like an
 * empty school.
 */
function asOperatorIn<T>(session: ActiveContext, schoolId: string, work: () => Promise<T>): Promise<T> {
  return forTenant(
    { schoolIds: [schoolId], userId: session.user.id, joinCode: null, isSuperuser: true },
    work,
  );
}

/** How long one recorded visit covers before the next look writes a new row. */
export const OPERATOR_ACCESS_MINUTES = 60;

/**
 * Notes in the school's visitor book that the operator is looking, at most once
 * per hour.
 *
 * NOT A GATE — access no longer has one. This exists so the always-on key does
 * not become an unobserved one: the row surfaces in the school's own Safety
 * Centre, which is the half of the old grant flow worth keeping. Reusing an
 * open row keeps a working session from writing a line per query.
 *
 * WRAPPED IN REACT'S `cache`, and that is load-bearing, not a speed-up: a page
 * fetches its numbers, posts and people in one Promise.all, so three
 * `withSchoolAccess` calls race through here concurrently. Each would see "no
 * open row yet" and write its own line — three visits in the school's book for
 * one look. `cache` collapses the concurrent calls of one request into a
 * single promise; the open-row check below handles reuse ACROSS requests.
 */
const recordVisit = cache(async (userId: string, schoolId: string): Promise<void> => {
  const asOperator = { schoolIds: [schoolId], userId, joinCode: null, isSuperuser: true };

  const open = await forTenant(asOperator, () =>
    db.operatorAccess.findFirst({
      where: {
        schoolId,
        userId,
        endedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    }),
  );
  if (open) return;

  await forTenant(asOperator, () =>
    db.operatorAccess.create({
      data: {
        schoolId,
        userId,
        reason: "Operator access",
        expiresAt: new Date(Date.now() + OPERATOR_ACCESS_MINUTES * 60_000),
      },
      select: { id: true },
    }),
  );
});

/**
 * Erases a school and everything it owns. Permanently.
 *
 * NOT THE SAME AS removeSchool, and the difference is the whole reason both
 * exist. Removal is a flag: the roll becomes leavers, each pupil keeps their
 * account and certificate, and the operator can put it all back. This is the
 * shredder — for a school that should never have existed on this server (a
 * test school, a duplicate registered by mistake) — and there is no undo, so
 * it asks for the school's exact name and refuses anything else.
 *
 * WHAT GOES: every row the school owns, through the schema's own cascades —
 * memberships, classes, registers, marks, cards, series, posts, threads,
 * postings, enquiries, alumni certificates issued BY this school. Nothing is
 * enumerated here by hand: a table added tomorrow with the same
 * `onDelete: Cascade` every school-owned table already carries goes with it.
 *
 * WHAT STAYS: people. A user is not school-owned — a teacher at two schools
 * must keep the other one — so accounts survive the cascade. The one
 * exception is the account that existed ONLY for this school: a pupil the
 * school admitted who belongs nowhere else, guards nobody, holds no expert
 * profile, no alumni record from any other school, and no platform flag.
 * Those are shredded too, because leaving them is leaving the test school's
 * children behind as ownerless logins. The audit row is written UNATTRIBUTED
 * (schoolId null, the id in meta) — an attributed one would cascade away with
 * the school it describes.
 */
export async function deleteSchoolEntirely(
  session: ActiveContext,
  schoolId: string,
  confirmName: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey; removedUsers?: number }> {
  assertSuperuser(session);

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true } });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (confirmName.trim() !== school.name) return { ok: false, errorKey: "root.deleteMismatch" };

  // Who was here, read through the operator's one door into the school —
  // needed after the cascade, when the memberships are already gone.
  const { userIds, memberships, classes } = await withSchoolAccess(session, schoolId, async () => {
    const roll = await db.membership.findMany({ where: { schoolId }, select: { userId: true } });
    const classes = await db.class.count({ where: { schoolId } });
    return { userIds: [...new Set(roll.map((m) => m.userId))], memberships: roll.length, classes };
  });

  await db.school.delete({ where: { id: schoolId } });

  // Accounts that existed only for this school, and now belong to nothing.
  const orphans = await db.user.findMany({
    where: {
      id: { in: userIds },
      isSuperuser: false,
      isAppAdmin: false,
      memberships: { none: {} },
      guardianships: { none: {} },
      schoolRecords: { none: {} },
      operatorAccess: { none: {} },
      expertProfile: null,
    },
    select: { id: true },
  });
  const removedUsers = orphans.length
    ? (await db.user.deleteMany({ where: { id: { in: orphans.map((u) => u.id) } } })).count
    : 0;

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.school.delete",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, name: school.name, memberships, classes, removedUsers },
  });

  return { ok: true, removedUsers };
}

/**
 * Runs `work` bound to one school, as the operator.
 *
 * THE ONLY WAY INTO A SCHOOL'S ROWS FROM THIS FILE, and everything that reads or
 * writes school data goes through it — the check lives here rather than at each
 * call site, because a check repeated in eight places is a check missing from
 * the ninth. The visit is recorded on the way in, so the school can always see
 * that somebody outside it was looking.
 *
 * `asOperatorIn` narrows to exactly that school, so the tenant policies do the
 * rest and the school next door is as invisible to the operator's queries as it
 * is to anybody.
 */
export async function withSchoolAccess<T>(
  session: ActiveContext,
  schoolId: string,
  work: () => Promise<T>,
): Promise<T> {
  assertSuperuser(session);
  await recordVisit(session.user.id, schoolId);
  return asOperatorIn(session, schoolId, work);
}

/** Every time this school has been opened, newest first. For the school to read. */
export async function accessHistory(schoolId: string, take = 50) {
  const rows = await db.operatorAccess.findMany({
    where: { schoolId },
    orderBy: { startedAt: "desc" },
    take,
    select: {
      id: true,
      reason: true,
      startedAt: true,
      expiresAt: true,
      endedAt: true,
      user: { select: { name: true, email: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    reason: row.reason,
    startedAt: row.startedAt,
    expiresAt: row.expiresAt,
    endedAt: row.endedAt,
    operatorName: row.user.name,
    operatorEmail: row.user.email,
    live: row.endedAt === null && row.expiresAt.getTime() > Date.now(),
  }));
}
