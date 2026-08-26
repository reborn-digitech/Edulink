import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { CONTACTABLE_ROLES } from "./constants";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The school directory — a school's public face on the platform.
 *
 * PUBLISHING IS AN ACT, NOT A DEFAULT. Registering a school does not put it in
 * a list every parent on the platform can browse; an admin publishing the
 * profile does, and unpublishing takes it straight back out — in the DATABASE
 * (the School global-read clause and the Enquiry insert policy both key on
 * `profilePublishedAt`), not in a page's `if`.
 *
 * PUBLISHING REQUIRES A PERSON. A profile invites admissions enquiries, and an
 * enquiry into a void teaches parents the platform doesn't answer. So the
 * admissions contact — an ACTIVE admin, principal or teacher of this school —
 * must be named before the profile can go up, and the checklist step that
 * points here says so.
 *
 * WHAT THE DIRECTORY SHOWS IS THE PROSPECTUS. Name, place, grades, website,
 * the school's own words, and how many vacancies are open. Nothing that names
 * a pupil or a teacher crosses; the RLS clause behind this cannot reach any
 * other table.
 */

export type ProfileResult = { ok: true } | { ok: false; errorKey: TranslationKey };

function requireAdmin(ctx: ActiveContext): { schoolId: string } {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminEditsTheProfile");
  }
  return { schoolId: ctx.schoolId };
}

/**
 * Is this membership somebody enquiries may land on? ACTIVE, of this school,
 * and staff — the shared gate for the admissions contact and every vacancy's
 * hiring contact.
 */
export async function contactableMembership(
  schoolId: string,
  membershipId: string,
): Promise<{ id: string; userId: string; role: string } | null> {
  const membership = await db.membership.findFirst({
    where: {
      id: membershipId,
      schoolId,
      status: "ACTIVE",
      role: { in: [...CONTACTABLE_ROLES] },
    },
    select: { id: true, userId: true, role: true },
  });
  return membership;
}

/** The picker: who could be named as a contact. Admin and principal both —
 *  the principal posts vacancies and needs the same list. */
export async function listContactCandidates(
  ctx: ActiveContext,
): Promise<{ membershipId: string; name: string; role: string }[]> {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) {
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan");
  }
  const schoolId = ctx.schoolId;
  const rows = await db.membership.findMany({
    where: { schoolId, status: "ACTIVE", role: { in: [...CONTACTABLE_ROLES] } },
    select: { id: true, role: true, user: { select: { name: true, preferredName: true } } },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });
  return rows.map((m) => ({
    membershipId: m.id,
    name: m.user.preferredName ?? m.user.name,
    role: m.role,
  }));
}

export async function updateSchoolProfile(
  ctx: ActiveContext,
  input: { about: string; admissionsContactMembershipId: string | null },
): Promise<ProfileResult> {
  const { schoolId } = requireAdmin(ctx);

  const about = input.about.trim().slice(0, 4000);
  let contactId: string | null = null;
  if (input.admissionsContactMembershipId) {
    const contact = await contactableMembership(schoolId, input.admissionsContactMembershipId);
    if (!contact) return { ok: false, errorKey: "explore.contactMustBeActiveStaff" };
    contactId = contact.id;
  }

  // Clearing the contact while published would leave a live profile with
  // nobody behind it — the exact state publishing refuses to create.
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { profilePublishedAt: true },
  });
  if (school.profilePublishedAt && !contactId) {
    return { ok: false, errorKey: "explore.publishedNeedsAContact" };
  }

  await db.school.update({
    where: { id: schoolId },
    data: { profileAbout: about, admissionsContactMembershipId: contactId },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "school.profile.update",
    targetType: "School",
    targetId: schoolId,
    meta: { contactSet: Boolean(contactId) },
  });

  return { ok: true };
}

export async function setProfilePublished(
  ctx: ActiveContext,
  publish: boolean,
): Promise<ProfileResult> {
  const { schoolId } = requireAdmin(ctx);

  if (publish) {
    const school = await db.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { admissionsContactMembershipId: true },
    });
    const contact = school.admissionsContactMembershipId
      ? await contactableMembership(schoolId, school.admissionsContactMembershipId)
      : null;
    if (!contact) return { ok: false, errorKey: "explore.publishNeedsAContact" };
  }

  await db.school.update({
    where: { id: schoolId },
    data: { profilePublishedAt: publish ? new Date() : null },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: publish ? "school.profile.publish" : "school.profile.unpublish",
    targetType: "School",
    targetId: schoolId,
  });

  return { ok: true };
}

export type DirectoryEntry = {
  schoolId: string;
  name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  logoPath: string | null;
  gradeLow: string | null;
  gradeHigh: string | null;
  about: string;
  openVacancies: number;
  /** The reader's own school, when they have one. */
  ours: boolean;
};

/**
 * Every published school, for anybody signed in. The `where` repeats what the
 * RLS clause already enforces — deliberately, so the list means the same
 * thing even read by a member whose own (unpublished) school the tenant
 * clause would otherwise let through.
 */
export async function listDirectory(ctx: ActiveContext): Promise<DirectoryEntry[]> {
  const rows = await db.school.findMany({
    where: { profilePublishedAt: { not: null }, removedAt: null },
    select: {
      id: true,
      name: true,
      city: true,
      region: true,
      country: true,
      logoPath: true,
      gradeLow: true,
      gradeHigh: true,
      profileAbout: true,
      _count: { select: { jobPostings: { where: { status: "OPEN" } } } },
    },
    orderBy: { name: "asc" },
    take: 200,
  });
  return rows.map((s) => ({
    schoolId: s.id,
    name: s.name,
    city: s.city,
    region: s.region,
    country: s.country,
    logoPath: s.logoPath,
    gradeLow: s.gradeLow,
    gradeHigh: s.gradeHigh,
    about: s.profileAbout,
    openVacancies: s._count.jobPostings,
    ours: s.id === ctx.schoolId,
  }));
}

export type SchoolProfile = DirectoryEntry & {
  addressLine: string | null;
  postalCode: string | null;
  website: string | null;
  contactEmail: string;
  contactPhone: string | null;
  published: boolean;
  /** Whether THIS reader may open an admissions enquiry here. */
  canEnquire: boolean;
  vacancies: { id: string; title: string; employmentType: string; createdAt: Date }[];
};

/**
 * One school's profile page. Readable when the school is published OR holds
 * an open vacancy (a teacher clicking a vacancy deserves to see whose it is)
 * — the same two arms as the RLS clause, repeated here so the page's answer
 * cannot drift from the database's.
 */
export async function readSchoolProfile(
  ctx: ActiveContext,
  schoolId: string,
): Promise<SchoolProfile | null> {
  const school = await db.school.findFirst({
    where: {
      id: schoolId,
      removedAt: null,
      OR: [
        { profilePublishedAt: { not: null } },
        { jobPostings: { some: { status: "OPEN" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      city: true,
      region: true,
      country: true,
      addressLine: true,
      postalCode: true,
      website: true,
      contactEmail: true,
      contactPhone: true,
      logoPath: true,
      gradeLow: true,
      gradeHigh: true,
      profileAbout: true,
      profilePublishedAt: true,
      jobPostings: {
        where: { status: "OPEN" },
        select: { id: true, title: true, employmentType: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!school) return null;
  return {
    schoolId: school.id,
    name: school.name,
    city: school.city,
    region: school.region,
    country: school.country,
    addressLine: school.addressLine,
    postalCode: school.postalCode,
    website: school.website,
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone,
    logoPath: school.logoPath,
    gradeLow: school.gradeLow,
    gradeHigh: school.gradeHigh,
    about: school.profileAbout,
    openVacancies: school.jobPostings.length,
    ours: school.id === ctx.schoolId,
    published: Boolean(school.profilePublishedAt),
    // A parent may knock only on a door that is open — published, and not
    // their own school's (their own school already has /remarks for them).
    canEnquire: ctx.role === "PARENT" && Boolean(school.profilePublishedAt),
    vacancies: school.jobPostings.map((j) => ({
      id: j.id,
      title: j.title,
      employmentType: j.employmentType,
      createdAt: j.createdAt,
    })),
  };
}

/** The admin's own view for the settings page, published or not. */
export async function readOwnProfileSettings(ctx: ActiveContext): Promise<{
  about: string;
  published: boolean;
  admissionsContactMembershipId: string | null;
  contactName: string | null;
  contactStillValid: boolean;
}> {
  const { schoolId } = requireAdmin(ctx);
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { profileAbout: true, profilePublishedAt: true, admissionsContactMembershipId: true },
  });
  const contact = school.admissionsContactMembershipId
    ? await db.membership.findFirst({
        where: { id: school.admissionsContactMembershipId, schoolId },
        select: {
          status: true,
          role: true,
          user: { select: { name: true, preferredName: true } },
        },
      })
    : null;
  return {
    about: school.profileAbout,
    published: Boolean(school.profilePublishedAt),
    admissionsContactMembershipId: school.admissionsContactMembershipId,
    contactName: contact ? (contact.user.preferredName ?? contact.user.name) : null,
    contactStillValid: Boolean(
      contact &&
        contact.status === "ACTIVE" &&
        (CONTACTABLE_ROLES as readonly string[]).includes(contact.role),
    ),
  };
}
