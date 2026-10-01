/**
 * The head's notes on a member of staff (appraisal.ts, through the
 * /principal/staff/{membershipId}/appraisals, /principal/appraisals/{id}
 * and /staff/me/appraisals doors): the head writes, rewrites and removes;
 * the office reads and cannot write; the member of staff reads only the
 * entries marked visible to them; the head cannot appraise themselves; a
 * teacher of another school never sees a thing; every write is audited.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as listGet, POST as createPost } from "@/app/api/v1/principal/staff/[membershipId]/appraisals/route";
import { DELETE as entryDelete, PUT as entryPut } from "@/app/api/v1/principal/appraisals/[id]/route";
import { GET as mineGet } from "@/app/api/v1/staff/me/appraisals/route";
import { todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let otherSchoolId = "";
let adminUserId = "";
let principalUserId = "";
let principalMembershipId = "";
let teacherUserId = "";
let teacherMembershipId = "";
let otherTeacherUserId = "";
let pupilMembershipId = "";
let entryId = "";
const today = todayKey(TZ);

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown, method = "POST") => new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const list = (membershipId: string) => listGet(get(`/api/v1/principal/staff/${membershipId}/appraisals`), { params: Promise.resolve({ membershipId }) });
const create = (membershipId: string, body: unknown) => createPost(json(`/api/v1/principal/staff/${membershipId}/appraisals`, body), { params: Promise.resolve({ membershipId }) });
const update = (id: string, body: unknown) => entryPut(json(`/api/v1/principal/appraisals/${id}`, body, "PUT"), { params: Promise.resolve({ id }) });
const remove = (id: string) => entryDelete(new Request(`http://localhost/api/v1/principal/appraisals/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER") await createSession(otherTeacherUserId, { schoolId: otherSchoolId, role: "PRINCIPAL" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Appraisal School ${STAMP}`, slug: `zz-appraisal-${STAMP}`, code: `ZA${suffix}`, contactEmail: `zz-appraisal-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  otherSchoolId = (await db.school.create({ data: { name: `ZZ Appraisal Other ${STAMP}`, slug: `zz-appraisal-other-${STAMP}`, code: `ZB${suffix}`, contactEmail: `zz-appraisal-other-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Appraisal ${who}`, email: `zz-appraisal-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, other, pupil] = await Promise.all([mk("Admin"), mk("Head"), mk("Teacher"), mk("Other"), mk("Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = other.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  principalMembershipId = (await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  teacherMembershipId = (await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: otherTeacherUserId, schoolId: otherSchoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  pupilMembershipId = (await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAP${STAMP}` }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId, name: "ZZ 2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: true } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, otherTeacherUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("who writes and who reads", () => {
  it("401 signed out; a teacher is refused the timeline; the office reads but cannot write; a pupil is not a member of staff; the head cannot appraise themselves", async () => {
    await as(null);
    expect((await list(teacherMembershipId)).status).toBe(401);
    await as("TEACHER");
    expect((await list(teacherMembershipId)).status).toBe(403);
    await as("ADMIN");
    const res = await list(teacherMembershipId);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ staffMembershipId: teacherMembershipId, name: "ZZ Appraisal Teacher", role: "TEACHER", year: "ZZ 2026–27", canEdit: false, items: [] });
    expect((await create(teacherMembershipId, { kind: "OBSERVATION", dateKey: today, summary: "Office cannot." })).status).toBe(403);
    await as("PRINCIPAL");
    expect((await list(pupilMembershipId)).status).toBe(404);
    expect((await create(principalMembershipId, { kind: "TARGET", dateKey: today, summary: "Myself." })).status).toBe(403);
    expect((await create(teacherMembershipId, { kind: "LESSON", dateKey: today, summary: "Not a kind." })).status).toBe(422);
    expect((await create(teacherMembershipId, {})).status).toBe(422);
    expect(await db.staffAppraisal.count({ where: { schoolId } })).toBe(0);
  });

  it("the head writes an observation, filed under the year, private by default; the office reads it; the teacher sees nothing until it is shown", async () => {
    await as("PRINCIPAL");
    const res = await create(teacherMembershipId, { kind: "OBSERVATION", dateKey: today, summary: "A lively lesson on fractions.", strengths: "Questions to every row.", targets: "  ", rating: 4 });
    expect(res.status).toBe(201);
    entryId = (await res.json()).id;
    const mine = await (await list(teacherMembershipId)).json();
    expect(mine.canEdit).toBe(true);
    expect(mine.items).toHaveLength(1);
    expect(mine.items[0]).toMatchObject({ id: entryId, kind: "OBSERVATION", dateKey: today, year: "ZZ 2026–27", summary: "A lively lesson on fractions.", strengths: "Questions to every row.", targets: null, rating: 4, visibleToStaff: false, appraiserName: "ZZ Appraisal Head" });
    await as("ADMIN");
    expect((await (await list(teacherMembershipId)).json()).items).toHaveLength(1);
    await as("TEACHER");
    expect(await (await mineGet()).json()).toEqual({ items: [] });
    expect(await db.auditLog.count({ where: { schoolId, action: "appraisal.create", targetId: teacherMembershipId } })).toBe(1);
  });

  it("the head rewrites it and marks it visible; the teacher then reads it, and only it; the office cannot rewrite", async () => {
    await as("ADMIN");
    expect((await update(entryId, { kind: "OBSERVATION", dateKey: today, summary: "Office cannot." })).status).toBe(403);
    await as("PRINCIPAL");
    const hidden = await create(teacherMembershipId, { kind: "TARGET", dateKey: today, summary: "A private target." });
    expect(hidden.status).toBe(201);
    const res = await update(entryId, { kind: "APPRAISAL", dateKey: "2026-09-15", summary: "The year's appraisal.", rating: 5, visibleToStaff: true });
    expect(res.status).toBe(200);
    await as("TEACHER");
    const mine = await (await mineGet()).json();
    expect(mine.items).toHaveLength(1);
    expect(mine.items[0]).toMatchObject({ id: entryId, kind: "APPRAISAL", dateKey: "2026-09-15", summary: "The year's appraisal.", rating: 5, visibleToStaff: true });
    expect(await db.auditLog.count({ where: { schoolId, action: "appraisal.update", targetId: teacherMembershipId } })).toBe(1);
  });

  it("another school's head sees nothing of it: the timeline is 404 and the entry is 404", async () => {
    await as("OTHER");
    expect((await list(teacherMembershipId)).status).toBe(404);
    expect((await update(entryId, { kind: "TARGET", dateKey: today, summary: "Across the fence." })).status).toBe(404);
    expect(await (await remove(entryId)).json()).toEqual({ changed: false });
    expect(await db.staffAppraisal.count({ where: { id: entryId } })).toBe(1);
  });

  it("the head removes an entry; nothing there is a no-op; the teacher no longer sees it", async () => {
    await as("PRINCIPAL");
    expect(await (await remove(entryId)).json()).toEqual({ changed: true });
    expect(await (await remove(entryId)).json()).toEqual({ changed: false });
    await as("TEACHER");
    expect((await (await mineGet()).json()).items).toEqual([]);
    expect(await db.auditLog.count({ where: { schoolId, action: "appraisal.delete", targetId: teacherMembershipId } })).toBe(1);
    expect(await db.staffAppraisal.count({ where: { schoolId } })).toBe(1);
  });
});
