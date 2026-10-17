import "server-only";
import { isCollegeKind, type FacultyProfileSnapshot } from "@edulink/contracts";
import type { z } from "zod";
import type { myFacultyPublicProfileSchema, publicFacultySchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { assertModuleOn } from "./modules";
import type { ActiveContext } from "./session";
// website-three (17 Oct 2026)
import { deleteStoredFile, storeFile, UploadError } from "./storage";
import type { TranslationKey } from "./i18n/dictionary";
// end website-three

/**
 * A FACULTY MEMBER'S PUBLIC PROFILE (5 October 2026; integration decision 10,
 * docs/college.md "Not built"). A teacher may publish a page about their
 * work for the college's website: their name, designation, department,
 * highest qualification, NET/SET, years of teaching and the research
 * register's titles — what the published AICTE disclosure already lists by
 * name, designation and qualification, with their own work beside it. Nothing
 * else: no contact detail, no PAN, no student.
 *
 * THE OPT-IN IS THEIRS. Only the faculty member (or an HOD, for themself)
 * publishes, refreshes or takes their page down; the office may take a page
 * down (a member who has left), never put one up. `FacultyRecord.publicProfileAt`
 * is the opt-in, set and cleared only here.
 *
 * A SNAPSHOT, LIKE THE DISCLOSURE. Publishing writes one frozen row to
 * FacultyPublicProfile, which a signed-out reader may read (gen-rls.ts,
 * GLOBAL_READABLE) — a signed-out request can read no college's own rows, so
 * the page cannot be computed on read. It is what the teacher published on
 * that day; "Refresh my page" writes it again from today's rows. This file is
 * its one writer.
 */

type MyProfile = z.infer<typeof myFacultyPublicProfileSchema>;
type PublicFaculty = z.infer<typeof publicFacultySchema>;

const SELF = ["FACULTY", "HOD"] as const;

/** The member themself. `module: false` for taking a page DOWN, which a college that switched IQAC off must still allow (A3-S-5). */
async function me(ctx: ActiveContext, opts: { module: boolean } = { module: true }) {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(SELF as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  if (opts.module) await assertModuleOn(ctx.schoolId, "IQAC");
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId, userId: ctx.user.id };
}

/** The snapshot of one record, from today's rows. */
export async function snapshotOf(schoolId: string, membershipId: string, now: Date): Promise<FacultyProfileSnapshot | null> {
  const record = await db.facultyRecord.findFirst({ where: { schoolId, membershipId }, select: { designation: true, highestQualification: true, netSetQualified: true, experienceBeforeYears: true, joinedOn: true, departmentId: true } });
  if (!record) return null;
  const [member, school, department, research] = await Promise.all([
    db.membership.findUniqueOrThrow({ where: { id: membershipId }, select: { user: { select: { name: true, preferredName: true } } } }),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true } }),
    // The record's department, else the one the teacher is placed in (DepartmentFaculty): the page promises the
    // department and showed none for a record that left it blank (A3-journeys-38).
    record.departmentId
      ? db.department.findFirst({ where: { id: record.departmentId, schoolId }, select: { name: true } })
      : db.departmentFaculty.findFirst({ where: { membershipId, schoolId }, select: { department: { select: { name: true } } } }).then((row) => row?.department ?? null),
    db.researchItem.findMany({ where: { schoolId, facultyMembershipId: membershipId }, orderBy: [{ year: "desc" }, { title: "asc" }], take: 30, select: { kind: true, title: true, year: true, indexing: true } }),
  ]);
  const joined = record.joinedOn ? new Date(`${record.joinedOn}T00:00:00Z`) : null;
  const here = joined ? Math.max(0, (now.getTime() - joined.getTime()) / (365.25 * 86_400_000)) : 0;
  return {
    name: member.user.preferredName ?? member.user.name,
    collegeName: school.name,
    departmentName: department?.name ?? null,
    designation: record.designation,
    qualification: record.highestQualification,
    netSetQualified: record.netSetQualified,
    experienceYears: Math.round((record.experienceBeforeYears + here) * 10) / 10,
    research: research.map((r) => ({ kind: r.kind, title: r.title, year: r.year, indexing: r.indexing })),
  };
}

/** My page: whether the office has written my record, what would be published from it today, and whether it is up. */
export async function myPublicProfile(ctx: ActiveContext, now: Date = new Date()): Promise<MyProfile> {
  return profileOf(await me(ctx), now);
}

async function profileOf(m: { schoolId: string; membershipId: string }, now: Date): Promise<MyProfile> {
  const [preview, row, school, record] = await Promise.all([
    snapshotOf(m.schoolId, m.membershipId, now),
    db.facultyPublicProfile.findFirst({ where: { schoolId: m.schoolId, record: { membershipId: m.membershipId } }, select: { publishedAt: true } }),
    db.school.findUniqueOrThrow({ where: { id: m.schoolId }, select: { slug: true } }),
    db.facultyRecord.findFirst({ where: { schoolId: m.schoolId, membershipId: m.membershipId }, select: { publicPhotoFileId: true, publicPhotoConsentAt: true } }),
  ]);
  const photo = record?.publicPhotoFileId && record.publicPhotoConsentAt ? { fileId: record.publicPhotoFileId, consentAt: record.publicPhotoConsentAt.toISOString() } : null;
  return { hasRecord: preview !== null, publishedAt: row?.publishedAt.toISOString() ?? null, preview, url: row ? `/public/faculty/${school.slug}` : null, photo };
}

/** Publish (or refresh) my page from today's rows, or take it down. Taking down what is not up is the same. */
export async function setMyPublicProfile(ctx: ActiveContext, publish: boolean, now: Date = new Date()): Promise<MyProfile> {
  const m = await me(ctx, { module: publish });
  const school = await db.school.findUniqueOrThrow({ where: { id: m.schoolId }, select: { slug: true, kind: true } });
  if (!isCollegeKind(school.kind)) throw new AccessError("collegeOffice.refuseNotCollege");
  const record = await db.facultyRecord.findFirst({ where: { schoolId: m.schoolId, membershipId: m.membershipId }, select: { id: true } });
  if (!record) throw new AccessError("collegeDesks.refuseProfileNoRecord");
  if (publish) {
    const snapshot = await snapshotOf(m.schoolId, m.membershipId, now);
    // website-three (17 Oct 2026): the page carries the member's own photo when they set one, with their consent.
    const photo = await db.facultyRecord.findFirst({ where: { id: record.id }, select: { publicPhotoFileId: true, publicPhotoConsentAt: true } });
    const publicPhotoFileId = photo?.publicPhotoFileId && photo.publicPhotoConsentAt ? photo.publicPhotoFileId : null;
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.facultyPublicProfile.upsert({
        where: { facultyRecordId: record.id },
        create: { schoolId: m.schoolId, schoolSlug: school.slug, facultyRecordId: record.id, snapshotJson: JSON.stringify(snapshot), publishedAt: now, publicPhotoFileId },
        update: { schoolSlug: school.slug, snapshotJson: JSON.stringify(snapshot), publishedAt: now, publicPhotoFileId },
      });
      await tx.facultyRecord.update({ where: { id: record.id }, data: { publicProfileAt: now } });
    });
    await audit({ schoolId: m.schoolId, actorUserId: m.userId, action: "faculty.profile.publish", targetType: "FacultyRecord", targetId: record.id, meta: { research: snapshot?.research.length ?? 0 } });
  } else {
    const gone = await db.facultyPublicProfile.deleteMany({ where: { facultyRecordId: record.id } });
    await db.facultyRecord.update({ where: { id: record.id }, data: { publicProfileAt: null } });
    if (gone.count > 0) await audit({ schoolId: m.schoolId, actorUserId: m.userId, action: "faculty.profile.unpublish", targetType: "FacultyRecord", targetId: record.id, meta: {} });
  }
  // website-three (17 Oct 2026): the college's live website shows its faculty as they are now.
  await refreshCollegeSite(m.schoolId);
  return profileOf(m, now);
}

/* ------------------------------------------------------------------------------------------------ */
/* website-three (17 October 2026): the member's own public photo                                   */
/* ------------------------------------------------------------------------------------------------ */

/** A photo of one face needs no more: the website shows it small. */
export const FACULTY_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export type FacultyPhotoResult = { ok: true; profile: MyProfile } | { ok: false; errorKey: TranslationKey; vars?: Record<string, string | number> };

/**
 * The live website re-rendered from the config it was published with when what its Faculty page shows changed (a page
 * published or taken down, a photo set or removed), so a photo withdrawn stops being public at once rather than at the
 * nightly refresh. A college with no live site, or with WEBSITE off, is left alone; a failure is logged, never the
 * member's problem (the nightly refresh tries again).
 */
async function refreshCollegeSite(schoolId: string): Promise<void> {
  try {
    const { refreshPublishedSites } = await import("./site-publish");
    await refreshPublishedSites(new Date(), { schoolIds: [schoolId] });
  } catch (error) {
    console.error("[faculty-profile] site refresh", schoolId, error);
  }
}

/**
 * SET MY PUBLIC PHOTO (website-three, 17 Oct 2026): a picture of me for the college website's Faculty page and the public
 * faculty page, uploaded by me with my own consent tick — nobody else may put up my photo (the office may take my page
 * down, which takes the photo with it). A PNG, JPEG or WebP (EXIF stripped by the store), 2 MB at most. A page already
 * published shows it at once, and the live website is re-rendered; the photo before it is no longer named anywhere and the
 * orphan sweep reclaims it. Audited faculty.photo.set.
 */
export async function setMyPublicPhoto(ctx: ActiveContext, file: File, consent: boolean, now: Date = new Date()): Promise<FacultyPhotoResult> {
  const m = await me(ctx);
  if (!consent) return { ok: false, errorKey: "facultyPhoto.refuseConsent" };
  const record = await db.facultyRecord.findFirst({ where: { schoolId: m.schoolId, membershipId: m.membershipId }, select: { id: true } });
  if (!record) throw new AccessError("collegeDesks.refuseProfileNoRecord");
  let stored;
  try {
    stored = await storeFile(file, { maxBytes: FACULTY_PHOTO_MAX_BYTES });
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, errorKey: error.key, vars: error.vars };
    throw error;
  }
  if (stored.kind !== "image" || stored.mime === "image/gif") {
    await deleteStoredFile(stored.fileId);
    return { ok: false, errorKey: "facultyPhoto.refuseNotPicture" };
  }
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.facultyRecord.update({ where: { id: record.id }, data: { publicPhotoFileId: stored.fileId, publicPhotoConsentAt: now } });
    await tx.facultyPublicProfile.updateMany({ where: { facultyRecordId: record.id }, data: { publicPhotoFileId: stored.fileId } });
  });
  await audit({ schoolId: m.schoolId, actorUserId: m.userId, action: "faculty.photo.set", targetType: "FacultyRecord", targetId: record.id, meta: { consent: true } });
  await refreshCollegeSite(m.schoolId);
  return { ok: true, profile: await profileOf(m, now) };
}

/** Remove my public photo: off my record and my published page at once, and the live website re-rendered. Audited faculty.photo.remove when there was one. */
export async function removeMyPublicPhoto(ctx: ActiveContext, now: Date = new Date()): Promise<MyProfile> {
  // As taking the page down: allowed with IQAC switched off, so a member can always withdraw their photo.
  const m = await me(ctx, { module: false });
  const record = await db.facultyRecord.findFirst({ where: { schoolId: m.schoolId, membershipId: m.membershipId }, select: { id: true, publicPhotoFileId: true } });
  if (!record) throw new AccessError("collegeDesks.refuseProfileNoRecord");
  if (record.publicPhotoFileId) {
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.facultyRecord.update({ where: { id: record.id }, data: { publicPhotoFileId: null, publicPhotoConsentAt: null } });
      await tx.facultyPublicProfile.updateMany({ where: { facultyRecordId: record.id }, data: { publicPhotoFileId: null } });
    });
    await audit({ schoolId: m.schoolId, actorUserId: m.userId, action: "faculty.photo.remove", targetType: "FacultyRecord", targetId: record.id, meta: {} });
    await refreshCollegeSite(m.schoolId);
  }
  return profileOf(m, now);
}

/** The office takes a page down — a member who has left, a page that should not be up. Never puts one up. */
export async function officeTakeDownProfile(ctx: ActiveContext, membershipId: string): Promise<void> {
  if (!ctx.schoolId || ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  if (!(await takeDownProfileOf(ctx.schoolId, membershipId, ctx.user.id, "office"))) throw new AccessError("collegeDesks.refuseProfileNoRecord", "NOT_FOUND");
}

/**
 * A PAGE COMES DOWN WITH ITS MEMBER (A3-S-5, 5 Oct 2026). A teacher whose
 * access the office ends (membership.ts suspendMembership — a member of staff
 * leaves by being paused; a pupil's departure is another path) can no longer
 * reach "take my page down", and the signed-out page went on naming them as
 * the college's staff. The office's pause calls this; so does the office's own
 * takedown. False when the member has no record (nothing could be up).
 */
export async function takeDownProfileOf(schoolId: string, membershipId: string, actorUserId: string, reason: "office" | "membership.suspend"): Promise<boolean> {
  const record = await db.facultyRecord.findFirst({ where: { schoolId, membershipId }, select: { id: true } });
  if (!record) return false;
  const gone = await db.facultyPublicProfile.deleteMany({ where: { facultyRecordId: record.id } });
  await db.facultyRecord.update({ where: { id: record.id }, data: { publicProfileAt: null } });
  if (gone.count > 0) await audit({ schoolId, actorUserId, action: "faculty.profile.takedown", targetType: "FacultyRecord", targetId: record.id, meta: { reason } });
  // website-three (17 Oct 2026): a page taken down leaves the live website's Faculty page (and its photo) at once.
  if (gone.count > 0) await refreshCollegeSite(schoolId);
  return true;
}

/**
 * For the signed-out page: a college's published profiles by its slug, by name. Reads only the rows the policy opens to anyone.
 * website-three (17 Oct 2026): a profile's photo is named only while the college's website is live, which is when the file
 * route serves it to anyone (`photos: "whenLive"`, the public page); the website's own render asks for it always (`"always"`),
 * since the draft's preview is read by the office and a published version makes it public with itself.
 */
export async function publicFaculty(slug: string, opts: { photos: "whenLive" | "always" } = { photos: "whenLive" }): Promise<PublicFaculty> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return { collegeName: null, profiles: [] };
  const rows = await db.facultyPublicProfile.findMany({ where: { schoolSlug: slug }, select: { id: true, schoolId: true, snapshotJson: true, publishedAt: true, publicPhotoFileId: true } });
  const withPhoto = rows.find((r) => r.publicPhotoFileId);
  const photos = Boolean(withPhoto) && (opts.photos === "always" || Boolean(await db.schoolSiteVersion.findFirst({ where: { schoolId: withPhoto!.schoolId, liveAt: { not: null } }, select: { id: true } })));
  const profiles = rows
    .map((r) => ({ id: r.id, publishedAt: r.publishedAt.toISOString(), ...(JSON.parse(r.snapshotJson) as FacultyProfileSnapshot), photoFileId: photos ? r.publicPhotoFileId : null }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { collegeName: profiles[0]?.collegeName ?? null, profiles };
}
