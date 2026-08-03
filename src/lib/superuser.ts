import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { generateToken, hashToken } from "./crypto";
import { schoolCode, slugify } from "./codes";
import { sendTeacherInvite } from "./email";
import { writeJson } from "./json";
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
    throw new AccessError("This area belongs to whoever runs the server", "NOT_FOUND");
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

export type CreateResult = { ok: true; schoolId: string; code: string } | { ok: false; error: string };

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
  if (name.length < 2) return { ok: false, error: "Give the school a name." };
  if (!details.contactEmail.trim()) return { ok: false, error: "A contact email is required." };

  const rangeProblem = checkGradeRange(details.gradeLow, details.gradeHigh);
  if (rangeProblem) return { ok: false, error: rangeProblem };

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

  return { ok: false, error: "That name keeps colliding. Try a slightly different one." };
}

export async function updateSchool(
  session: ActiveContext,
  schoolId: string,
  details: Partial<SchoolDetails> & { logoPath?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  assertSuperuser(session);

  if (details.name !== undefined && details.name.trim().length < 2) {
    return { ok: false, error: "Give the school a name." };
  }
  const rangeProblem = checkGradeRange(details.gradeLow, details.gradeHigh);
  if (rangeProblem) return { ok: false, error: rangeProblem };

  const existing = await db.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!existing) return { ok: false, error: "No such school." };

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
): Promise<{ ok: boolean; error?: string }> {
  assertSuperuser(session);

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That does not look like an email address." };
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true },
  });
  if (!school) return { ok: false, error: "No such school." };

  const role = input.role ?? "ADMIN";

  const already = await db.invite.findFirst({
    where: { schoolId, email, status: "PENDING" },
    select: { id: true },
  });
  if (already) return { ok: false, error: "An invitation is already waiting for them." };

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
): Promise<{ ok: boolean; error?: string }> {
  assertSuperuser(session);
  const result = await db.invite.updateMany({
    where: { id: inviteId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (result.count === 0) return { ok: false, error: "That invitation is no longer pending." };

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
): string | null {
  const lowNum = gradeToNumber(low);
  const highNum = gradeToNumber(high);
  if (lowNum === null || highNum === null) return null; // not both numeric: accept as written
  if (lowNum > highNum) return "The lowest grade cannot be above the highest.";
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
