/**
 * Certificate requests through their handlers: a pupil asks for a bonafide
 * and a guardian for a study certificate, only for kinds the school has a
 * template for; the same ask twice is one; the office sees the queue with
 * pending first and is told; it issues from the ask so the request points
 * at the paper and takes its purpose; it declines another with a reason
 * and the family is told; the family takes one back; a stranger and a
 * teacher are refused; every step is audited with the kind and no purpose.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { presetsFor } from "@/lib/certificate-rules";
import { POST as templatesPost } from "@/app/api/v1/office/certificate-templates/route";
import { GET as familyGet, POST as familyPost } from "@/app/api/v1/family/certificate-requests/route";
import { POST as cancelPost } from "@/app/api/v1/family/certificate-requests/[requestId]/cancel/route";
import { GET as queueGet } from "@/app/api/v1/office/certificate-requests/route";
import { POST as declinePost } from "@/app/api/v1/office/certificate-requests/[requestId]/decline/route";
import { POST as issuePost } from "@/app/api/v1/office/certificates/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let teacherUserId = "";
let parentUserId = "";
let strangerUserId = "";
let pupilUserId = "";
let pupil = "";
let templateId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "ADMIN" | "TEACHER" | "PARENT" | "STRANGER" | "PUPIL" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerUserId, { schoolId: null, role: "PARENT" });
  if (who === "PUPIL") await createSession(pupilUserId, { schoolId, role: "STUDENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Req School ${STAMP}`, slug: `zz-req-${STAMP}`, code: `ZQ${suffix}`, contactEmail: `zz-req-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Req ${who}`, email: `zz-req-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, teacher, parent, stranger, p] = await Promise.all([mk("Admin"), mk("Teacher"), mk("Parent"), mk("Stranger"), mk("Riya Rane")]);
  adminUserId = admin.id; teacherUserId = teacher.id; parentUserId = parent.id; strangerUserId = stranger.id; pupilUserId = p.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  pupil = (await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZQA${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupil, studentSchoolId: schoolId, status: "ACTIVE" } });
  const classId = (await db.class.create({ data: { schoolId, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZQ1${suffix}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { schoolId, classId, studentMembershipId: pupil, status: "ACTIVE" } });
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  await db.pupilRecord.create({ data: { schoolId, studentMembershipId: pupil, fatherName: "Rahul Rane", motherName: "Rina Rane", nationality: "Indian", admissionNumber: "GR-9" } });
  await as("ADMIN");
  const bonafide = presetsFor("en").find((x) => x.kind === "BONAFIDE")!;
  templateId = (await (await templatesPost(json("/api/v1/office/certificate-templates", { ...bonafide, active: true }))).json()).id;
  const study = presetsFor("en").find((x) => x.kind === "STUDY")!;
  await templatesPost(json("/api/v1/office/certificate-templates", { ...study, active: true }));
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, teacherUserId, parentUserId, strangerUserId, pupilUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

let bonafideRequestId = "";
let studyRequestId = "";

describe("asking", () => {
  it("a pupil asks once, a guardian asks for the child, a kind with no template is refused, a stranger 404, a teacher 403; the office is told and sees the queue", async () => {
    await as(null);
    expect((await familyGet(get("/api/v1/family/certificate-requests"))).status).toBe(401);
    await as("TEACHER");
    expect((await familyGet(get("/api/v1/family/certificate-requests"))).status).toBe(403);
    await as("PUPIL");
    let res = await familyGet(get("/api/v1/family/certificate-requests"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], kinds: ["BONAFIDE", "STUDY"] });
    res = await familyPost(json("/api/v1/family/certificate-requests", { kind: "BONAFIDE", purpose: "a bus pass" }));
    expect(res.status).toBe(201);
    const first = await res.json();
    bonafideRequestId = first.id;
    expect(first).toMatchObject({ studentMembershipId: pupil, studentName: "ZZ Req Riya Rane", className: "ZZ 5A", kind: "BONAFIDE", purpose: "a bus pass", status: "PENDING", requestedByName: "ZZ Req Riya Rane", certificateId: null, serial: null });
    expect((await (await familyPost(json("/api/v1/family/certificate-requests", { kind: "BONAFIDE", purpose: "again" }))).json()).id).toBe(bonafideRequestId);
    expect((await familyPost(json("/api/v1/family/certificate-requests", { kind: "TC", purpose: "leaving" }))).status).toBe(403);
    expect((await familyPost(json("/api/v1/family/certificate-requests", { kind: "BONAFIDE" }))).status).toBe(422);

    await as("PARENT");
    // No child named: the first child, as on the record form. Named afterwards: the same ask.
    res = await familyPost(json("/api/v1/family/certificate-requests", { kind: "STUDY", purpose: "a scholarship" }));
    expect(res.status).toBe(201);
    studyRequestId = (await res.json()).id;
    expect((await (await familyPost(json(`/api/v1/family/certificate-requests?childId=${pupil}`, { kind: "STUDY", purpose: "again" }))).json()).id).toBe(studyRequestId);
    res = await familyGet(get(`/api/v1/family/certificate-requests?childId=${pupil}`));
    expect((await res.json()).items.map((r: { kind: string; requestedByName: string }) => [r.kind, r.requestedByName])).toEqual([["STUDY", "ZZ Req Parent"], ["BONAFIDE", "ZZ Req Riya Rane"]]);
    // A guardian account with no child anywhere is stopped at the family door itself.
    await as("STRANGER");
    expect((await familyPost(json(`/api/v1/family/certificate-requests?childId=${pupil}`, { kind: "STUDY", purpose: "x" }))).status).toBe(403);
    expect((await familyGet(get(`/api/v1/family/certificate-requests?childId=${pupil}`))).status).toBe(403);

    const told = await db.notification.findMany({ where: { userId: adminUserId, titleKey: "certificateRequests.notifNew" }, select: { body: true, url: true } });
    expect(told.map((n) => n.body).sort()).toEqual(["a bus pass", "a scholarship"]);
    expect(told[0]!.url).toContain(`/admin/certificates/issue?membershipId=${pupil}&requestId=`);
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "certificate.request", targetId: bonafideRequestId } });
    expect(JSON.parse(audit!.meta)).toEqual({ kind: "BONAFIDE", membershipId: pupil, byGuardian: false });
    expect(audit!.meta).not.toContain("bus pass");

    await as("TEACHER");
    expect((await queueGet(get("/api/v1/office/certificate-requests"))).status).toBe(403);
    await as("ADMIN");
    res = await queueGet(get("/api/v1/office/certificate-requests"));
    const queue = await res.json();
    expect(queue.pending).toBe(2);
    expect(queue.items.map((r: { kind: string }) => r.kind)).toEqual(["STUDY", "BONAFIDE"]);
  });

  it("issuing from the ask answers it and takes its purpose; declining with a reason tells the family; the family takes one back; settled asks are answered as they stand", async () => {
    await as("ADMIN");
    let res = await issuePost(json("/api/v1/office/certificates", { templateId, studentMembershipId: pupil, requestId: bonafideRequestId }));
    expect(res.status).toBe(200);
    const issued = await res.json();
    expect(issued.purpose).toBe("a bus pass");
    res = await queueGet(get("/api/v1/office/certificate-requests?status=ISSUED"));
    const answered = (await res.json()).items[0];
    expect(answered).toMatchObject({ id: bonafideRequestId, status: "ISSUED", certificateId: issued.id, serial: issued.serial });

    res = await declinePost(json(`/api/v1/office/certificate-requests/${studyRequestId}/decline`, { reason: "Fees for Term 1 are outstanding." }), params({ requestId: studyRequestId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "DECLINED", declineReason: "Fees for Term 1 are outstanding." });
    expect((await declinePost(json(`/api/v1/office/certificate-requests/${studyRequestId}/decline`, { reason: "Again" }), params({ requestId: studyRequestId }))).status).toBe(200);
    expect((await db.certificateRequest.findUniqueOrThrow({ where: { id: studyRequestId } })).declineReason).toBe("Fees for Term 1 are outstanding.");
    expect((await declinePost(json(`/api/v1/office/certificate-requests/${studyRequestId}/decline`, {}), params({ requestId: studyRequestId }))).status).toBe(422);
    const toldPupil = await db.notification.findFirst({ where: { userId: pupilUserId, titleKey: "certificateRequests.notifDeclined" } });
    const toldParent = await db.notification.findFirst({ where: { userId: parentUserId, titleKey: "certificateRequests.notifDeclined" } });
    expect(toldPupil?.body).toBe("Fees for Term 1 are outstanding.");
    expect(toldParent?.url).toBe("/parent/certificates");
    expect((await queueGet(get("/api/v1/office/certificate-requests"))).status).toBe(200);
    expect((await (await queueGet(get("/api/v1/office/certificate-requests"))).json()).pending).toBe(0);

    await as("PUPIL");
    res = await familyPost(json("/api/v1/family/certificate-requests", { kind: "STUDY", purpose: "a sports trial" }));
    const third = await res.json();
    expect(third.status).toBe("PENDING");
    await as("STRANGER");
    expect((await cancelPost(get(`/api/v1/family/certificate-requests/${third.id}/cancel`), params({ requestId: third.id }))).status).toBe(403);
    await as("PARENT");
    res = await cancelPost(get(`/api/v1/family/certificate-requests/${third.id}/cancel`), params({ requestId: third.id }));
    expect((await res.json()).status).toBe("CANCELLED");
    expect((await (await cancelPost(get(`/api/v1/family/certificate-requests/${third.id}/cancel`), params({ requestId: third.id }))).json()).status).toBe("CANCELLED");
    expect((await (await cancelPost(get(`/api/v1/family/certificate-requests/${bonafideRequestId}/cancel`), params({ requestId: bonafideRequestId }))).json()).status).toBe("ISSUED");
    await as("ADMIN");
    const kinds = (await db.auditLog.findMany({ where: { schoolId, action: { in: ["certificate.requestCancel", "certificate.requestDecline"] } }, select: { action: true, meta: true } })).map((r) => [r.action, JSON.parse(r.meta).kind]);
    expect(kinds).toEqual(expect.arrayContaining([["certificate.requestDecline", "STUDY"], ["certificate.requestCancel", "STUDY"]]));
  });
});
