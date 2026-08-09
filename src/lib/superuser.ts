import "server-only";
import { cache } from "react";
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
      removedAt: true,
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
};

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
          note: "The school was removed from this EduLink installation.",
          attendanceMarked: marked.get(s.id) ?? 0,
          attendancePresent: present.get(s.id) ?? 0,
          reportCardCount: cards.get(s.id) ?? 0,
          issuedByMembershipId: null,
        })),
        skipDuplicates: true,
      });

      // REMOVED rather than deleted, as cohort.ts does it, so last term's marks
      // still have a class to belong to.
      await t.enrollment.updateMany({
        where: { schoolId, status: "ACTIVE" },
        data: { status: "REMOVED" },
      });

      // Staff and pupils alike: everybody's post at this school has ended.
      await t.membership.updateMany({
        where: { schoolId, leftAt: null },
        data: { leftAt },
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
