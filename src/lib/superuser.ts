import "server-only";
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
import { INVITE_TTL_DAYS } from "./constants";
import type { ActiveContext } from "./session";

/**
 * Whoever runs the server.
 *
 * THIS IS THE FIRST ACTOR IN THIS APP ABOVE A SCHOOL, and the README spent a
 * long time saying there wasn't one. So the shape of it matters more than the
 * feature: the temptation is a role that can do everything, and what is built
 * here is a key to two tables.
 *
 * A superuser can create a school, correct its details, and invite its first
 * administrator. That is the entire list. They cannot read a register, a mark, a
 * message or a child's name — not because the pages are hidden but because
 * Postgres will not return the rows: `app.is_superuser` appears in exactly two
 * policies, School and Invite. `npm run rls:verify` proves the absence.
 *
 * WHY THAT LINE. Setting a school up is administration; reading what happens
 * inside one is surveillance. The person hosting this software has no business
 * knowing how a particular eleven-year-old is doing, and "we only show what the
 * UI shows" is not an answer when the same person can open a database client.
 * The boundary has to be somewhere the UI cannot move, so it is in the policies.
 *
 * The one power deliberately NOT taken away is deletion: a superuser can drop a
 * school and everything it owns. Withholding that would be theatre — they
 * already have `psql`. It simply has no button.
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
export async function listSchools(session: ActiveContext): Promise<SchoolSummary[]> {
  assertSuperuser(session);

  const schools = await db.school.findMany({
    orderBy: { createdAt: "desc" },
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
    },
  });

  // Invite is the other superuser-readable table, so this count works without
  // being a member of any of these schools. Membership is NOT readable here,
  // deliberately — an operator sees that a school has nobody to run it yet, and
  // does not see who its people are.
  const invites = await db.invite.groupBy({
    by: ["schoolId"],
    where: { role: "ADMIN", status: "PENDING" },
    _count: true,
  });
  const pending = new Map(invites.map((i) => [i.schoolId, i._count]));

  return schools.map((school) => ({
    ...school,
    pendingAdminInvites: pending.get(school.id) ?? 0,
  }));
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
          region: details.region || null,
          postalCode: details.postalCode || null,
          country: details.country || null,
          gradeLow: details.gradeLow || null,
          gradeHigh: details.gradeHigh || null,
          timezone: details.timezone,
          brandPrimary: details.brandPrimary || null,
          onboardingState: writeJson({ createdSchool: true }),
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

  const existing = await db.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!existing) return { ok: false, errorKey: "root.noSuchSchool" };

  await db.school.update({
    where: { id: schoolId },
    data: {
      ...(details.name !== undefined ? { name: details.name.trim() } : {}),
      ...(details.contactEmail !== undefined ? { contactEmail: details.contactEmail.trim() } : {}),
      ...(details.contactPhone !== undefined ? { contactPhone: details.contactPhone || null } : {}),
      ...(details.website !== undefined ? { website: details.website || null } : {}),
      ...(details.addressLine !== undefined ? { addressLine: details.addressLine || null } : {}),
      ...(details.city !== undefined ? { city: details.city || null } : {}),
      ...(details.region !== undefined ? { region: details.region || null } : {}),
      ...(details.postalCode !== undefined ? { postalCode: details.postalCode || null } : {}),
      ...(details.country !== undefined ? { country: details.country || null } : {}),
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

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true },
  });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };

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
  await sendTeacherInvite(email, `${appUrl}/invite/${token}`, school.name, "EduLink");

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.invite.admin",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, email, role },
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
  actorName: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  at: Date;
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
 */
export async function listServerAudit(
  session: ActiveContext,
  opts: { take?: number } = {},
): Promise<ServerAuditRow[]> {
  assertSuperuser(session);

  const rows = await db.auditLog.findMany({
    // ⚠ AN ALLOWLIST, NOT "everything with no school". Sign-ins, signups and
    // account changes are also written with no schoolId — they belong to a
    // PERSON, not a tenant — and `schoolId: null` alone poured every user's
    // login history into the operator's log. The server log is what the
    // OPERATOR did to the server: schools, their administrators, the flag
    // itself, and the expert programme, which is the one thing that lives
    // outside every school on purpose.
    where: {
      schoolId: null,
      OR: [
        { action: { startsWith: "superuser." } },
        { action: { startsWith: "operator." } },
        { action: { in: ["expert.invite", "expert.profile.update"] } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.take ?? 200, 500),
  });

  // Same batch-lookup as the school-scoped reader: actorUserId has no relation,
  // because the actor may be gone by the time anybody reads this.
  const actorIds = [
    ...new Set(rows.map((r) => r.actorUserId).filter((id): id is string => Boolean(id))),
  ];
  const actors = await db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, preferredName: true },
  });
  const nameById = new Map(actors.map((a) => [a.id, a.preferredName ?? a.name]));

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actorName: row.actorUserId ? (nameById.get(row.actorUserId) ?? "Deleted user") : "System",
    targetType: row.targetType,
    targetId: row.targetId,
    meta: readJson<Record<string, unknown>>(row.meta, {}),
    ip: row.ip,
    at: row.createdAt,
  }));
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
 * months ago, and a queue nobody can find is a queue nobody works.
 */
export async function listExpertsForCuration(session: ActiveContext): Promise<CurationEntry[]> {
  assertSuperuser(session);

  const profiles = await db.expertProfile.findMany({
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
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
 * THE BOUNDARY THIS FILE SPENT ITS FIRST 150 LINES DEFENDING, OPENED ON PURPOSE.
 *
 * The header above says setting a school up is administration and reading what
 * happens inside one is surveillance, and that the person hosting this software
 * has no business knowing how a particular eleven-year-old is doing. That was
 * the right default and it is still the default. What it could not answer is the
 * ordinary reason a host needs to look: a school reports abuse it cannot see the
 * whole of, a safeguarding referral arrives about content on this installation,
 * a bug corrupts one school's register and somebody has to find out how.
 *
 * SO THE ANSWER IS NOT A MASTER KEY, IT IS A SIGNED-OUT ONE. An operator does
 * not hold every school open. They OPEN ONE, having written down why, for a
 * bounded time, and the school is told — opening, every action taken inside, and
 * closing are all audited against that school's id, so they surface in that
 * school's own Safety Centre next to everything else. The operator gains sight;
 * they give up doing it unobserved. That trade is the feature.
 *
 * WHAT DID NOT CHANGE. `app.is_superuser` still opens exactly two tables, School
 * and Invite. There is no policy anywhere that says "a superuser may read
 * grades". While a grant is live the operator is bound to that ONE school
 * through `asOperatorIn`, so every ordinary tenant policy applies to them exactly
 * as it does to that school's admin — including the part where the school next
 * door stays invisible. `npm run rls:verify` proves that specifically.
 *
 * AND WHAT REMAINS TRUE ABOUT ALL OF IT: whoever runs the server has `psql`.
 * None of this is a defence against them, and pretending otherwise would be the
 * dishonest version. It is a defence against doing it casually, against doing it
 * without saying why, and against doing it without the school ever knowing —
 * which are the three things that turn a support tool into surveillance.
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

/** How long a grant lasts before it has to be asked for again. */
export const OPERATOR_ACCESS_MINUTES = 60;

export type OperatorGrant = {
  id: string;
  schoolId: string;
  reason: string;
  startedAt: Date;
  expiresAt: Date;
};

/**
 * The grant this operator currently holds on this school, if any.
 *
 * Expiry is checked HERE rather than by a background job, because a grant that
 * lapses only when something sweeps it is a grant that is open for as long as
 * nothing runs.
 */
export async function activeGrant(
  session: ActiveContext,
  schoolId: string,
): Promise<OperatorGrant | null> {
  if (!session.user.isSuperuser) return null;

  const row = await db.operatorAccess.findFirst({
    where: {
      schoolId,
      userId: session.user.id,
      endedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { startedAt: "desc" },
    select: { id: true, schoolId: true, reason: true, startedAt: true, expiresAt: true },
  });
  return row;
}

export type OpenResult = { ok: true; grant: OperatorGrant } | { ok: false; errorKey: TranslationKey };

/**
 * Opens one school, for a stated reason.
 *
 * THE REASON IS REQUIRED AND IS NOT DECORATION. It is written into the row and
 * into the school's own audit log, so what the school reads is not "the operator
 * looked" but "the operator looked, on this date, because of this". A free-text
 * box somebody can type "x" into is admittedly weak; it is still the difference
 * between a decision somebody made and a habit nobody notices.
 */
export async function openSchool(
  session: ActiveContext,
  schoolId: string,
  reason: string,
): Promise<OpenResult> {
  assertSuperuser(session);

  const clean = reason.trim();
  if (clean.length < 10) {
    return {
      ok: false,
      errorKey: "root.sayWhyOpening",
    };
  }
  if (clean.length > 500) return { ok: false, errorKey: "root.reasonTooLong" };

  // The school has to exist, and reading it is something the operator flag
  // already permits — so this is not a widening, it is a spelling check.
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };

  const existing = await activeGrant(session, schoolId);
  if (existing) return { ok: true, grant: existing };

  const expiresAt = new Date(Date.now() + OPERATOR_ACCESS_MINUTES * 60_000);
  // Written INSIDE the school, because that is where the row lives and where the
  // policy expects it. Insert is permitted by the operator flag alone; see
  // OPERATOR_LOG_TABLES in gen-rls.ts.
  const grant = await asOperatorIn(session, schoolId, () =>
    db.operatorAccess.create({
      data: { schoolId, userId: session.user.id, reason: clean, expiresAt },
      select: { id: true, schoolId: true, reason: true, startedAt: true, expiresAt: true },
    }),
  );

  /**
   * AUDITED AGAINST THE SCHOOL, not against nothing.
   *
   * Every other operator action in this file is audited with `schoolId` null on
   * purpose, so an operator's own housekeeping does not clutter a tenant's
   * Safety Centre. This one is the exact opposite case and the reason is the
   * whole design: a school must be able to see that somebody outside it opened
   * their data. Filing it where only the operator can read it would make the
   * accountability half of this feature ornamental.
   */
  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "operator.school.open",
    targetType: "School",
    targetId: schoolId,
    meta: { reason: clean, minutes: OPERATOR_ACCESS_MINUTES },
  });

  return { ok: true, grant };
}

/** Closes a grant early. The row stays; only `endedAt` is set. */
export async function closeSchool(session: ActiveContext, schoolId: string): Promise<void> {
  assertSuperuser(session);

  const grant = await activeGrant(session, schoolId);
  if (!grant) return;

  await asOperatorIn(session, schoolId, () =>
    db.operatorAccess.update({ where: { id: grant.id }, data: { endedAt: new Date() } }),
  );

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "operator.school.close",
    targetType: "School",
    targetId: schoolId,
  });
}

/**
 * Runs `work` bound to a school the operator currently holds a grant on.
 *
 * THE ONLY WAY INTO A SCHOOL'S ROWS FROM THIS FILE, and everything that reads or
 * writes school data goes through it. Two separate things have to be true —
 * they run the server AND they have an open, unexpired grant for this school —
 * and both are checked here rather than at each call site, because a check
 * repeated in eight places is a check missing from the ninth.
 *
 * `asOperatorIn` narrows to exactly that school, so the tenant policies do the rest
 * and the school next door is as invisible to the operator as it is to anybody.
 */
export async function withSchoolAccess<T>(
  session: ActiveContext,
  schoolId: string,
  work: () => Promise<T>,
): Promise<T> {
  assertSuperuser(session);
  const grant = await activeGrant(session, schoolId);
  if (!grant) {
    throw new AccessError("access.openThisSchoolFirstAndSayWhy", "NOT_FOUND");
  }
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
