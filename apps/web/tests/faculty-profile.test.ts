/**
 * A faculty member's public page (5 Oct 2026; integration decision 10, migration faculty_profile_optin): the
 * teacher's own opt-in (FacultyRecord.publicProfileAt), a frozen snapshot anyone may read signed out
 * (FacultyPublicProfile, GLOBAL_READABLE in gen-rls.ts) with nothing but the work — no PAN, no contact — linked from
 * the published disclosure; only the teacher puts it up, the office may only take it down; the page is indexed.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { myPublicProfile, officeTakeDownProfile, publicFaculty, setMyPublicProfile } from "@/lib/faculty-profile";
import { robotsFor } from "@/lib/robots";
import { suspendMembership } from "@/lib/membership";
import { GET as publicGet } from "@/app/api/v1/public/faculty/[slug]/route";

const owner = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const SLUG = `zz-profile-${STAMP}`;
const ids = { college: "", users: [] as string[], teacher: "", teacherM: "", hod: "", admin: "", record: "" };

function appRoleUrl(): string | null {
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL ?? app;
  if (!app || !admin) return null;
  try {
    return new URL(app).username === new URL(admin).username ? null : app;
  } catch {
    return null;
  }
}
const APP_URL = appRoleUrl();
const app = APP_URL ? new PrismaClient({ datasourceUrl: APP_URL }) : null;

async function ctxAs(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.college, role: role as never });
  return (await getSession())!;
}

beforeAll(async () => {
  ids.college = (await owner.school.create({ data: { name: `ZZ Profile College ${STAMP}`, slug: SLUG, code: `ZPF${SUFFIX}`, contactEmail: `zz-profile-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await owner.schoolModule.createMany({ data: ["ACADEMICS", "IQAC"].map((module) => ({ schoolId: ids.college, module })) });
  let n = 0;
  const person = async (who: string, role: string) => {
    n += 1;
    // A phone on the account, so the test can show it never reaches the page.
    const u = await owner.user.create({ data: { name: `ZZ Profile ${who}`, email: `zz-profile-${who.toLowerCase()}-${STAMP}@test.invalid`, phone: `+9197${SUFFIX}${n}0` }, select: { id: true } });
    ids.users.push(u.id);
    const m = await owner.membership.create({ data: { userId: u.id, schoolId: ids.college, role, status: "ACTIVE" }, select: { id: true } });
    return { userId: u.id, membershipId: m.id };
  };
  const teacher = await person("Teacher", "FACULTY");
  ids.teacher = teacher.userId;
  ids.teacherM = teacher.membershipId;
  ids.hod = (await person("Hod", "HOD")).userId;
  ids.admin = (await person("Admin", "ADMIN")).userId;
  const dept = await owner.department.create({ data: { schoolId: ids.college, code: `ZPD${SUFFIX}`, name: "ZZ Physics" }, select: { id: true } });
  ids.record = (await owner.facultyRecord.create({ data: { schoolId: ids.college, membershipId: teacher.membershipId, designation: "ASSISTANT_PROFESSOR", appointment: "REGULAR", highestQualification: "PHD", netSetQualified: true, experienceBeforeYears: 2, departmentId: dept.id, panSealed: "zz-sealed", panLast4: "4321" }, select: { id: true } })).id;
  await owner.researchItem.create({ data: { schoolId: ids.college, kind: "PUBLICATION", title: "ZZ Low-cost interferometer", indexing: "SCOPUS", year: 2025, facultyMembershipId: teacher.membershipId } });
});

afterAll(async () => {
  __resetCookies();
  await owner.session.deleteMany({ where: { userId: { in: ids.users } } });
  await owner.auditLog.deleteMany({ where: { schoolId: ids.college } });
  await owner.school.deleteMany({ where: { id: ids.college } });
  await owner.user.deleteMany({ where: { id: { in: ids.users } } });
  await owner.$disconnect();
  await app?.$disconnect();
});

describe("my public page", () => {
  it("previews from my record and the research register, and is not up until I publish", async () => {
    const teacher = await ctxAs(ids.teacher, "FACULTY");
    const mine = await myPublicProfile(teacher);
    expect(mine).toMatchObject({ hasRecord: true, publishedAt: null, url: null });
    expect(mine.preview).toMatchObject({ name: "ZZ Profile Teacher", designation: "ASSISTANT_PROFESSOR", qualification: "PHD", netSetQualified: true, departmentName: "ZZ Physics", research: [{ kind: "PUBLICATION", title: "ZZ Low-cost interferometer", year: 2025, indexing: "SCOPUS" }] });
    expect((await publicFaculty(SLUG)).profiles).toEqual([]);
  });

  it("an HOD with no record is told so, and nobody else may publish for a teacher", async () => {
    const hod = await ctxAs(ids.hod, "HOD");
    expect((await myPublicProfile(hod)).hasRecord).toBe(false);
    await expect(setMyPublicProfile(hod, true)).rejects.toMatchObject({ key: "collegeDesks.refuseProfileNoRecord" });
    const admin = await ctxAs(ids.admin, "ADMIN");
    await expect(setMyPublicProfile(admin, true)).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
  });

  it("publishes a snapshot with the work and nothing else, readable signed out through the door", async () => {
    const teacher = await ctxAs(ids.teacher, "FACULTY");
    const after = await setMyPublicProfile(teacher, true);
    expect(after.url).toBe(`/public/faculty/${SLUG}`);
    expect((await owner.facultyRecord.findUniqueOrThrow({ where: { id: ids.record }, select: { publicProfileAt: true } })).publicProfileAt).not.toBeNull();
    const row = await owner.facultyPublicProfile.findUniqueOrThrow({ where: { facultyRecordId: ids.record }, select: { snapshotJson: true } });
    expect(row.snapshotJson).not.toMatch(/4321|sealed|\+9197|@test\.invalid/);
    __resetCookies();
    const res = await publicGet(new Request(`http://localhost/api/v1/public/faculty/${SLUG}`), { params: Promise.resolve({ slug: SLUG }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { collegeName: string; profiles: { name: string }[] };
    expect(body.collegeName).toBe(`ZZ Profile College ${STAMP}`);
    expect(body.profiles.map((p) => p.name)).toEqual(["ZZ Profile Teacher"]);
    expect(robotsFor(`GET /public/faculty/${SLUG}`)).toEqual({ index: true, follow: true });
  });

  it("is readable by the app role with nothing bound, and nothing else of the college is", async () => {
    if (!app) return; // a single-role configuration has no row security to prove
    const [profiles, records] = await app.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.school_ids', '', true)`;
      await tx.$executeRaw`SELECT set_config('app.user_id', '', true)`;
      return Promise.all([tx.facultyPublicProfile.count({ where: { schoolSlug: SLUG } }), tx.facultyRecord.count({ where: { schoolId: ids.college } })]);
    });
    expect([profiles, records]).toEqual([1, 0]);
  });

  it("is taken down by the teacher, or by the office, and never put up by the office", async () => {
    const admin = await ctxAs(ids.admin, "ADMIN");
    await officeTakeDownProfile(admin, ids.teacherM);
    expect((await publicFaculty(SLUG)).profiles).toEqual([]);
    const teacher = await ctxAs(ids.teacher, "FACULTY");
    await setMyPublicProfile(teacher, true);
    const down = await setMyPublicProfile(teacher, false);
    expect(down.publishedAt).toBeNull();
    expect((await publicFaculty(SLUG)).profiles).toEqual([]);
    expect(await owner.auditLog.count({ where: { schoolId: ids.college, action: { in: ["faculty.profile.publish", "faculty.profile.unpublish", "faculty.profile.takedown"] } } })).toBe(4);
  });
});

describe("a page outlives nobody (A3-S-5)", () => {
  it("comes down when the office pauses the teacher, audited, and the teacher may still take theirs down with IQAC off", async () => {
    const teacher = await ctxAs(ids.teacher, "FACULTY");
    await setMyPublicProfile(teacher, true);
    expect((await publicFaculty(SLUG)).profiles).toHaveLength(1);
    // IQAC switched off: publishing is refused, taking the page down is not.
    await owner.schoolModule.deleteMany({ where: { schoolId: ids.college, module: "IQAC" } });
    try {
      await expect(setMyPublicProfile(await ctxAs(ids.teacher, "FACULTY"), true)).rejects.toMatchObject({ code: "MODULE_OFF" });
      expect((await setMyPublicProfile(await ctxAs(ids.teacher, "FACULTY"), false)).publishedAt).toBeNull();
      expect((await publicFaculty(SLUG)).profiles).toEqual([]);
    } finally {
      await owner.schoolModule.create({ data: { schoolId: ids.college, module: "IQAC" } });
    }
    await setMyPublicProfile(await ctxAs(ids.teacher, "FACULTY"), true);
    expect((await publicFaculty(SLUG)).profiles).toHaveLength(1);
    expect(await suspendMembership(await ctxAs(ids.admin, "ADMIN"), ids.teacherM, "ZZ left the college")).toEqual({ ok: true });
    expect((await publicFaculty(SLUG)).profiles).toEqual([]);
    expect((await owner.facultyRecord.findUniqueOrThrow({ where: { id: ids.record }, select: { publicProfileAt: true } })).publicProfileAt).toBeNull();
    const row = await owner.auditLog.findFirstOrThrow({ where: { schoolId: ids.college, action: "faculty.profile.takedown", targetId: ids.record }, orderBy: { createdAt: "desc" }, select: { meta: true } });
    expect(JSON.parse(row.meta ?? "{}")).toEqual({ reason: "membership.suspend" });
  });
});
