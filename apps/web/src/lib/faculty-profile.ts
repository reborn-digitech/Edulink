import "server-only";
import { isCollegeKind, type FacultyProfileSnapshot } from "@edulink/contracts";
import type { z } from "zod";
import type { myFacultyPublicProfileSchema, publicFacultySchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { assertModuleOn } from "./modules";
import type { ActiveContext } from "./session";

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
async function snapshotOf(schoolId: string, membershipId: string, now: Date): Promise<FacultyProfileSnapshot | null> {
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
  const [preview, row, school] = await Promise.all([
    snapshotOf(m.schoolId, m.membershipId, now),
    db.facultyPublicProfile.findFirst({ where: { schoolId: m.schoolId, record: { membershipId: m.membershipId } }, select: { publishedAt: true } }),
    db.school.findUniqueOrThrow({ where: { id: m.schoolId }, select: { slug: true } }),
  ]);
  return { hasRecord: preview !== null, publishedAt: row?.publishedAt.toISOString() ?? null, preview, url: row ? `/public/faculty/${school.slug}` : null };
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
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.facultyPublicProfile.upsert({
        where: { facultyRecordId: record.id },
        create: { schoolId: m.schoolId, schoolSlug: school.slug, facultyRecordId: record.id, snapshotJson: JSON.stringify(snapshot), publishedAt: now },
        update: { schoolSlug: school.slug, snapshotJson: JSON.stringify(snapshot), publishedAt: now },
      });
      await tx.facultyRecord.update({ where: { id: record.id }, data: { publicProfileAt: now } });
    });
    await audit({ schoolId: m.schoolId, actorUserId: m.userId, action: "faculty.profile.publish", targetType: "FacultyRecord", targetId: record.id, meta: { research: snapshot?.research.length ?? 0 } });
  } else {
    const gone = await db.facultyPublicProfile.deleteMany({ where: { facultyRecordId: record.id } });
    await db.facultyRecord.update({ where: { id: record.id }, data: { publicProfileAt: null } });
    if (gone.count > 0) await audit({ schoolId: m.schoolId, actorUserId: m.userId, action: "faculty.profile.unpublish", targetType: "FacultyRecord", targetId: record.id, meta: {} });
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
  return true;
}

/** For the signed-out page: a college's published profiles by its slug, by name. Reads only the rows the policy opens to anyone. */
export async function publicFaculty(slug: string): Promise<PublicFaculty> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return { collegeName: null, profiles: [] };
  const rows = await db.facultyPublicProfile.findMany({ where: { schoolSlug: slug }, select: { id: true, snapshotJson: true, publishedAt: true } });
  const profiles = rows
    .map((r) => ({ id: r.id, publishedAt: r.publishedAt.toISOString(), ...(JSON.parse(r.snapshotJson) as FacultyProfileSnapshot) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { collegeName: profiles[0]?.collegeName ?? null, profiles };
}
