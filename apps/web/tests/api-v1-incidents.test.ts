/**
 * The incident log's six endpoints, invoked directly with a primed session:
 * who may record, read, follow up and close; that the family is told at
 * once and the record says so; that the record is never edited; and that
 * a teacher of another class, a stranger's guardian and another school's
 * office all get 404.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as listGet, POST as recordPost } from "@/app/api/v1/staff/incidents/route";
import { GET as oneGet } from "@/app/api/v1/staff/incidents/[incidentId]/route";
import { POST as notePost } from "@/app/api/v1/staff/incidents/[incidentId]/notes/route";
import { POST as closePost } from "@/app/api/v1/staff/incidents/[incidentId]/close/route";
import { GET as familyGet } from "@/app/api/v1/family/incidents/route";
import { openIncidentCounts } from "@/lib/incidents";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let otherAdminUserId = "";
let parentUserId = "";
let strangerParentUserId = "";
let pupilMembershipId = "";
let incidentId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const params = (incidentId: string) => ({ params: Promise.resolve({ incidentId }) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER_TEACHER" | "OTHER_ADMIN" | "PARENT" | "STRANGER" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER_TEACHER") await createSession(otherTeacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER_ADMIN") await createSession(otherAdminUserId, { schoolId: otherSchoolId, role: "ADMIN" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerParentUserId, { schoolId: null, role: "PARENT" });
}

beforeAll(async () => {
  process.env.SMS_TRANSPORT = "devbox";
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Incident School ${STAMP}`, slug: `zz-inc-${STAMP}`, code: `ZJ${suffix}`, contactEmail: `zz-inc-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", msgSmsEnabled: true }, select: { id: true } })).id;
  otherSchoolId = (await db.school.create({ data: { name: `ZZ Incident Other ${STAMP}`, slug: `zz-inc-o-${STAMP}`, code: `ZK${suffix}`, contactEmail: `zz-inc-o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string, phone?: string) => db.user.create({ data: { name: `ZZ Incident ${who}`, email: `zz-inc-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid`, phone }, select: { id: true } });
  const [admin, principal, teacher, otherTeacher, otherAdmin, parent, stranger, pupil, otherPupil] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Other Teacher"), mk("Other Admin"), mk("Parent", `+9198712${suffix}`), mk("Stranger"), mk("Pupil"), mk("Other Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = otherTeacher.id;
  otherAdminUserId = otherAdmin.id;
  parentUserId = parent.id;
  strangerParentUserId = stranger.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }, { userId: otherAdminUserId, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" }] });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: otherTeacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZJP${STAMP}`, gradeLevel: "4" }, select: { id: true } });
  pupilMembershipId = pm.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Incident Class 4", gradeLevel: "4", joinCode: `ZJ${suffix}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: pm.id, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
  const opm = await db.membership.create({ data: { userId: otherPupil.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZJO${STAMP}` }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId: strangerParentUserId, studentMembershipId: opm.id, studentSchoolId: otherSchoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, otherTeacherUserId, otherAdminUserId, parentUserId, strangerParentUserId] } } });
  await db.school.deleteMany({ where: { slug: { in: [`zz-inc-${STAMP}`, `zz-inc-o-${STAMP}`] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const body = { studentMembershipId: "", kind: "INJURY", severity: "MINOR", place: "Playground", title: "Fell on the steps, grazed knee", body: "Slipped on the wet steps at break.", actionTaken: "Cleaned and dressed." };

describe("recording", () => {
  it("401 signed out; a guardian may not record; a teacher of another class is 404; the future is refused; an empty body is 422", async () => {
    await as(null);
    expect((await recordPost(json("/x", { ...body, studentMembershipId: pupilMembershipId }))).status).toBe(401);
    await as("PARENT");
    expect((await recordPost(json("/x", { ...body, studentMembershipId: pupilMembershipId }))).status).toBe(403);
    await as("OTHER_TEACHER");
    expect((await recordPost(json("/x", { ...body, studentMembershipId: pupilMembershipId }))).status).toBe(404);
    await as("TEACHER");
    expect((await recordPost(json("/x", {}))).status).toBe(422);
    const future = await recordPost(json("/x", { ...body, studentMembershipId: pupilMembershipId, occurredAt: new Date(Date.now() + 3_600_000).toISOString() }));
    expect(future.status).toBe(403);
  });

  it("the class teacher records it; the family is told by push and text and the record says when; the audit row carries the kind, never the words", async () => {
    await as("TEACHER");
    const before = await db.notification.count({ where: { userId: parentUserId } });
    const res = await recordPost(json("/x", { ...body, studentMembershipId: pupilMembershipId }));
    expect(res.status).toBe(201);
    const view = await res.json();
    incidentId = view.id;
    expect(view).toMatchObject({ studentName: "ZZ Incident Pupil", className: "ZZ Incident Class 4", reportedByName: "ZZ Incident Teacher", kind: "INJURY", severity: "MINOR", place: "Playground", status: "OPEN", notes: [], canNote: true, canClose: false });
    expect(view.guardiansNotifiedAt).toEqual(expect.any(String));
    expect(await db.notification.count({ where: { userId: parentUserId } })).toBe(before + 1);
    const note = await db.notification.findFirst({ where: { userId: parentUserId }, orderBy: { createdAt: "desc" }, select: { kind: true, title: true, body: true, url: true } });
    expect(note).toMatchObject({ kind: "INCIDENT", title: "ZZ Incident Pupil: an incident at school", body: "Fell on the steps, grazed knee", url: `/parent/incidents?child=${pupilMembershipId}&incident=${incidentId}` });
    const text = await db.outboundMessage.findFirst({ where: { schoolId, userId: parentUserId, templateKey: "incident" }, select: { body: true, status: true } });
    expect(text?.body).toContain("Fell on the steps, grazed knee");
    expect(text?.body).toContain("ZZ Incident Pupil");
    const audits = await db.auditLog.findMany({ where: { schoolId, action: "incident.record" }, select: { meta: true } });
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits[0]!.meta)).not.toContain("grazed");
    expect(JSON.parse(String(audits[0]!.meta))).toMatchObject({ kind: "INJURY", notified: true });
  });

  it("with notifyGuardians off, nothing is sent and the record says the family was not told", async () => {
    await as("ADMIN");
    const before = await db.notification.count({ where: { userId: parentUserId } });
    const res = await recordPost(json("/x", { ...body, studentMembershipId: pupilMembershipId, kind: "BEHAVIOUR", title: "Pushed in the lunch queue", notifyGuardians: false }));
    expect(res.status).toBe(201);
    expect((await res.json()).guardiansNotifiedAt).toBeNull();
    expect(await db.notification.count({ where: { userId: parentUserId } })).toBe(before);
  });
});

describe("reading and following up", () => {
  it("the office lists the school's, a teacher their own pupils', another school's office nothing; a stranger's guardian sees nothing", async () => {
    await as("ADMIN");
    const list = await (await listGet(get("/api/v1/staff/incidents?status=ALL"))).json();
    expect(list.total).toBe(2);
    expect(list.openCount).toBe(2);
    expect(list.rows.map((r: { title: string; noteCount: number }) => [r.title, r.noteCount])).toEqual([["Pushed in the lunch queue", 0], ["Fell on the steps, grazed knee", 0]]);
    await as("TEACHER");
    expect((await (await listGet(get("/api/v1/staff/incidents"))).json()).total).toBe(2);
    await as("OTHER_TEACHER");
    expect((await (await listGet(get("/api/v1/staff/incidents"))).json()).total).toBe(0);
    expect((await oneGet(get("/x"), params(incidentId))).status).toBe(404);
    await as("OTHER_ADMIN");
    expect((await oneGet(get("/x"), params(incidentId))).status).toBe(404);
    expect((await (await listGet(get("/api/v1/staff/incidents"))).json()).total).toBe(0);
    await as("STRANGER");
    expect((await familyGet(get(`/api/v1/family/incidents?childId=${pupilMembershipId}`))).status).toBe(404);
    expect((await openIncidentCounts(schoolId, [pupilMembershipId])).get(pupilMembershipId)).toBe(2);
  });

  it("a teacher adds a note but cannot close; the head closes; nothing can be added after; the guardian reads it all read-only", async () => {
    await as("TEACHER");
    expect((await notePost(json("/x", { body: "" }), params(incidentId))).status).toBe(422);
    const noted = await notePost(json("/x", { body: "Mother telephoned; knee fine." }), params(incidentId));
    expect(noted.status).toBe(200);
    expect((await noted.json()).notes).toEqual([expect.objectContaining({ authorName: "ZZ Incident Teacher", body: "Mother telephoned; knee fine." })]);
    expect((await closePost(get("/x"), params(incidentId))).status).toBe(403);
    await as("PRINCIPAL");
    const closed = await (await closePost(get("/x"), params(incidentId))).json();
    expect(closed).toMatchObject({ status: "CLOSED", closedByName: "ZZ Incident Principal", canNote: false, canClose: false });
    expect(closed.closedAt).toEqual(expect.any(String));
    expect((await notePost(json("/x", { body: "Too late." }), params(incidentId))).status).toBe(403);
    // The record itself is what was written on the day.
    const row = await db.incident.findUniqueOrThrow({ where: { id: incidentId } });
    expect(row.body).toBe("Slipped on the wet steps at break.");
    await as("PARENT");
    const fam = await (await familyGet(get("/api/v1/family/incidents"))).json();
    expect(fam.childName).toBe("ZZ Incident Pupil");
    expect(fam.incidents.map((i: { title: string; status: string; canNote: boolean }) => [i.title, i.status, i.canNote])).toEqual([["Pushed in the lunch queue", "OPEN", false], ["Fell on the steps, grazed knee", "CLOSED", false]]);
    expect(fam.incidents[1].notes).toHaveLength(1);
    await as("ADMIN");
    const list = await (await listGet(get("/api/v1/staff/incidents?status=CLOSED"))).json();
    expect(list.rows.map((r: { id: string }) => r.id)).toEqual([incidentId]);
  });
});
