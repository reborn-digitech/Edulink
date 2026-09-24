/**
 * Admissions through their handlers: the office opens a cycle for the
 * year, a guardian with no child anywhere applies from the school's page,
 * attaches documents through tickets, books a sitting the office
 * published, the office checks, tests, offers, the family answers, and the
 * seat becomes a pupil with a guardian, a record and a fee plan in one
 * transaction — every repeated step a no-op, every stranger a 404.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { authorizeFileRead } from "@/lib/files";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as cyclesGet, POST as cyclesPost } from "@/app/api/v1/office/admissions/cycles/route";
import { POST as cyclePut } from "@/app/api/v1/office/admissions/cycles/[cycleId]/route";
import { POST as cycleStatus } from "@/app/api/v1/office/admissions/cycles/[cycleId]/status/route";
import { POST as cyclePurge } from "@/app/api/v1/office/admissions/cycles/[cycleId]/purge/route";
import { GET as slotsGet, POST as slotsPost } from "@/app/api/v1/office/admissions/cycles/[cycleId]/slots/route";
import { POST as slotCancel } from "@/app/api/v1/office/admissions/slots/[slotId]/cancel/route";
import { GET as pipelineGet, POST as walkInPost } from "@/app/api/v1/office/admissions/applications/route";
import { GET as officeAppGet } from "@/app/api/v1/office/admissions/applications/[applicationId]/route";
import { POST as verifyPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/verify/route";
import { POST as testPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/test/route";
import { POST as offerPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/offer/route";
import { POST as decidePost } from "@/app/api/v1/office/admissions/applications/[applicationId]/decide/route";
import { POST as admitPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/admit/route";
import { GET as mineGet, POST as applyPost } from "@/app/api/v1/family/applications/route";
import { GET as familyAppGet } from "@/app/api/v1/family/applications/[applicationId]/route";
import { POST as documentsPost } from "@/app/api/v1/family/applications/[applicationId]/documents/route";
import { POST as bookPost } from "@/app/api/v1/family/applications/[applicationId]/book/route";
import { POST as respondPost } from "@/app/api/v1/family/applications/[applicationId]/respond/route";
import { POST as withdrawPost } from "@/app/api/v1/family/applications/[applicationId]/withdraw/route";
import { GET as schoolGet } from "@/app/api/v1/shared/schools/[schoolId]/admissions/route";
import { expireOffers } from "@/lib/admissions";
import { todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
let yearId = "";
let structureId = "";
let classId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let parentAUserId = "";
let parentBUserId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT_A" | "PARENT_B" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId: otherSchoolId, role: "TEACHER" });
  if (who === "PARENT_A") await createSession(parentAUserId, { schoolId: null, role: "PARENT" });
  if (who === "PARENT_B") await createSession(parentBUserId, { schoolId: null, role: "PARENT" });
}
const dayKey = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Adm School ${STAMP}`, slug: `zz-adm-${STAMP}`, code: `ZA${suffix}`, contactEmail: `zz-adm-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "Pune", locale: "en", profilePublishedAt: new Date(), gradeLow: "1", gradeHigh: "10" }, select: { id: true } })).id;
  otherSchoolId = (await db.school.create({ data: { name: `ZZ Adm Other ${STAMP}`, slug: `zz-adm-other-${STAMP}`, code: `ZB${suffix}`, contactEmail: `zz-adm-other-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Adm ${who}`, email: `zz-adm-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, a, b] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Parent A"), mk("Parent B")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  parentAUserId = a.id;
  parentBUserId = b.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: teacherUserId, schoolId: otherSchoolId, role: "TEACHER", status: "ACTIVE" } });
  yearId = (await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  classId = (await db.class.create({ data: { schoolId, name: "ZZ 3A", gradeLevel: "3", joinCode: `ZA1${suffix}` }, select: { id: true } })).id;
  const head = await db.feeHead.create({ data: { schoolId, name: "Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } });
  structureId = (await db.feeStructure.create({ data: { schoolId, academicYearId: yearId, name: "ZZ Grade 3 fees", gradeLevel: "3", publishedAt: new Date(), instalments: { create: [{ schoolId, label: "Term 1", sortOrder: 0, dueDate: new Date("2026-07-15T00:00:00Z"), lines: { create: [{ schoolId, headId: head.id, amountPaise: 12_000_00 }] } }] } }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, parentAUserId, parentBUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { name: { startsWith: `ZZ Adm Child ${STAMP}` } } });
  await db.$disconnect();
});

let cycleId = "";
let riyaId = ""; // parent A's, grade 3: the one that goes all the way
let samId = ""; // parent B's, grade 3: declined
let taraId = ""; // parent B's, grade 6: expired offer, withdrawn
let slotA = "";
let slotB = "";
const cycleBody = () => ({ academicYearId: yearId, name: "Admissions 2026–27", grades: [{ grade: "3", seats: 1 }, { grade: "6", seats: 2 }], documents: [{ key: "birth_certificate", name: "Birth certificate", required: true }, { key: "photo", name: "Photograph", required: false }], testRequired: true, notice: "Bring the originals.", feeStructureId: structureId, opensAt: null, closesAt: null });

describe("the cycle", () => {
  it("401 signed out, a teacher and a guardian refused; the office creates it once, refuses backwards dates and a taken name, rewrites it, opens it, and cannot purge it while open", async () => {
    await as(null);
    expect((await cyclesGet()).status).toBe(401);
    await as("TEACHER");
    expect((await cyclesGet()).status).toBe(403);
    await as("PARENT_A");
    expect((await cyclesGet()).status).toBe(403);
    await as("ADMIN");
    let res = await cyclesGet();
    expect(res.status).toBe(200);
    const view = await res.json();
    expect(view.cycles).toEqual([]);
    expect(view.years.map((y: { id: string }) => y.id)).toEqual([yearId]);
    expect(view.structures.map((s: { id: string }) => s.id)).toEqual([structureId]);

    res = await cyclesPost(json("/api/v1/office/admissions/cycles", cycleBody()));
    expect(res.status).toBe(201);
    const created = await res.json();
    cycleId = created.id;
    expect(created).toMatchObject({ status: "DRAFT", academicYearName: "2026–27", feeStructureName: "ZZ Grade 3 fees", testRequired: true });
    expect(created.seats).toEqual([{ grade: "3", seats: 1, applied: 0, offered: 0, accepted: 0, admitted: 0, waitlisted: 0 }, { grade: "6", seats: 2, applied: 0, offered: 0, accepted: 0, admitted: 0, waitlisted: 0 }]);
    expect((await (await cyclesPost(json("/api/v1/office/admissions/cycles", cycleBody()))).json()).id).toBe(cycleId);
    expect((await cyclesPost(json("/api/v1/office/admissions/cycles", { ...cycleBody(), name: "Backwards", opensAt: "2026-09-10", closesAt: "2026-09-01" }))).status).toBe(403);
    expect((await cyclesPost(json("/api/v1/office/admissions/cycles", { name: "Half a body" }))).status).toBe(422);
    const other = await (await cyclesPost(json("/api/v1/office/admissions/cycles", { ...cycleBody(), name: "Late admissions" }))).json();
    expect((await cyclePut(json(`/api/v1/office/admissions/cycles/${other.id}`, cycleBody()), params({ cycleId: other.id }))).status).toBe(403);
    res = await cyclePut(json(`/api/v1/office/admissions/cycles/${cycleId}`, { ...cycleBody(), notice: "Bring the originals to the test." }), params({ cycleId }));
    expect(res.status).toBe(200);
    expect((await res.json()).notice).toBe("Bring the originals to the test.");

    expect((await cyclePurge(get(`/api/v1/office/admissions/cycles/${cycleId}/purge`), params({ cycleId }))).status).toBe(403);
    res = await cycleStatus(json(`/api/v1/office/admissions/cycles/${cycleId}/status`, { status: "OPEN" }), params({ cycleId }));
    expect((await res.json()).status).toBe("OPEN");
    expect((await (await cycleStatus(json(`/api/v1/office/admissions/cycles/${cycleId}/status`, { status: "OPEN" }), params({ cycleId }))).json()).status).toBe("OPEN");
    await db.admissionCycle.delete({ where: { id: other.id } });
  });

  it("shows on the school's page to any signed-in reader, with the seats left and the documents asked for", async () => {
    await as("TEACHER");
    let res = await schoolGet(get(`/api/v1/shared/schools/${schoolId}/admissions`), params({ schoolId }));
    expect(res.status).toBe(200);
    const page = await res.json();
    expect(page.open).toMatchObject({ cycleId, name: "Admissions 2026–27", testRequired: true, notice: "Bring the originals to the test." });
    expect(page.open.grades).toEqual([{ grade: "3", seats: 1, remaining: 1 }, { grade: "6", seats: 2, remaining: 2 }]);
    expect(page.mine).toEqual([]);
    await as(null);
    expect((await schoolGet(get(`/api/v1/shared/schools/${schoolId}/admissions`), params({ schoolId }))).status).toBe(401);
    await as("PARENT_A");
    res = await schoolGet(get(`/api/v1/shared/schools/${otherSchoolId}/admissions`), params({ schoolId: otherSchoolId }));
    expect((await res.json()).open).toBeNull();
  });
});

describe("applying", () => {
  it("a guardian with no child anywhere applies from the account's details; the same child again is the same application; a grade not taken is refused; the office is told; a stranger reads nothing", async () => {
    await as("PARENT_A");
    let res = await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `ZZ Adm Child ${STAMP} Riya`, childBirthdate: "2019-04-12", gradeApplied: "3", previousSchool: "Sunrise Nursery", addressLine: "14 Lake Road", city: "Pune" }));
    expect(res.status).toBe(201);
    const riya = await res.json();
    riyaId = riya.id;
    expect(riya).toMatchObject({ serial: "APP/2026–27/0001", status: "SUBMITTED", applicantName: "ZZ Adm Parent A", applicantUserId: parentAUserId, gradeApplied: "3", childBirthdate: "2019-04-12", documentsMissing: ["birth_certificate"], testSlot: null, openSlots: [] });
    expect(riya.can).toMatchObject({ uploadDocuments: true, bookTest: true, respond: false, withdraw: true, verifyDocuments: false, offer: false, admit: false });
    expect((await (await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `zz adm child ${STAMP} riya`, childBirthdate: null, gradeApplied: "3" }))).json()).id).toBe(riyaId);
    expect((await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: "Nobody", childBirthdate: null, gradeApplied: "9" }))).status).toBe(403);
    expect((await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, gradeApplied: "3" }))).status).toBe(422);
    expect((await applyPost(json("/api/v1/family/applications", { schoolId: otherSchoolId, cycleId, childName: "Nobody", childBirthdate: null, gradeApplied: "3" }))).status).toBe(404);

    await as("PARENT_B");
    samId = (await (await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `ZZ Adm Child ${STAMP} Sam`, childBirthdate: "2019-01-30", gradeApplied: "3" }))).json()).id;
    taraId = (await (await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `ZZ Adm Child ${STAMP} Tara`, childBirthdate: "2016-02-02", gradeApplied: "6" }))).json()).id;
    expect((await familyAppGet(get(`/api/v1/family/applications/${riyaId}`), params({ applicationId: riyaId }))).status).toBe(404);
    res = await mineGet();
    expect((await res.json()).items.map((r: { serial: string }) => r.serial)).toEqual(["APP/2026–27/0003", "APP/2026–27/0002"]);
    await as("TEACHER");
    expect((await familyAppGet(get(`/api/v1/family/applications/${riyaId}`), params({ applicationId: riyaId }))).status).toBe(403);
    expect((await officeAppGet(get(`/api/v1/office/admissions/applications/${riyaId}`), params({ applicationId: riyaId }))).status).toBe(403);

    const told = await db.notification.findMany({ where: { userId: adminUserId, kind: "ADMISSION" }, select: { url: true, body: true } });
    expect(told).toHaveLength(3);
    expect(told.map((n) => n.url)).toContain(`/admin/admissions/applications/${riyaId}`);
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "admissions.apply", targetId: riyaId } });
    expect(audit?.actorUserId).toBe(parentAUserId);
    expect(JSON.parse(audit!.meta)).toEqual({ cycleId, grade: "3", byOffice: false });

    await as("ADMIN");
    res = await cyclesGet();
    expect((await res.json()).cycles[0].seats[0]).toMatchObject({ grade: "3", applied: 2 });
    res = await pipelineGet(get("/api/v1/office/admissions/applications?grade=6"));
    expect((await res.json()).items.map((r: { childName: string }) => r.childName)).toEqual([`ZZ Adm Child ${STAMP} Tara`]);
    res = await walkInPost(json("/api/v1/office/admissions/applications", { cycleId, childName: `ZZ Adm Child ${STAMP} Walk`, childBirthdate: "2016-06-06", gradeApplied: "6", applicantName: "Sujata Kulkarni", applicantPhone: "+91 98764 00077" }));
    expect(res.status).toBe(201);
    const walk = await res.json();
    expect(walk).toMatchObject({ serial: "APP/2026–27/0004", applicantUserId: null, applicantName: "Sujata Kulkarni" });
    expect((await (await walkInPost(json("/api/v1/office/admissions/applications", { cycleId, childName: `ZZ Adm Child ${STAMP} Walk`, childBirthdate: null, gradeApplied: "6", applicantName: "sujata kulkarni" }))).json()).id).toBe(walk.id);
    expect((await walkInPost(json("/api/v1/office/admissions/applications", { cycleId, childName: "Nobody", childBirthdate: null, gradeApplied: "6" }))).status).toBe(403);
  });

  it("documents come through the applicant's own tickets, one per key the cycle asks for; a key sent again replaces the file; the file opens for the applicant and the office and nobody else", async () => {
    const mine1 = `zz-adm-${STAMP}-a1.pdf`;
    const mine2 = `zz-adm-${STAMP}-a2.jpg`;
    const mine3 = `zz-adm-${STAMP}-a3.pdf`;
    const theirs = `zz-adm-${STAMP}-b1.pdf`;
    await db.uploadTicket.createMany({ data: [{ userId: parentAUserId, fileId: mine1, mime: "application/pdf", size: 2048 }, { userId: parentAUserId, fileId: mine2, mime: "image/jpeg", size: 4096 }, { userId: parentAUserId, fileId: mine3, mime: "application/pdf", size: 1024 }, { userId: parentBUserId, fileId: theirs, mime: "application/pdf", size: 2048 }] });
    try {
      await as("PARENT_A");
      expect((await documentsPost(json(`/api/v1/family/applications/${riyaId}/documents`, { documents: [{ key: "birth_certificate", fileId: theirs, name: "x.pdf" }] }), params({ applicationId: riyaId }))).status).toBe(404);
      expect((await documentsPost(json(`/api/v1/family/applications/${riyaId}/documents`, { documents: [{ key: "aadhaar", fileId: mine1, name: "x.pdf" }] }), params({ applicationId: riyaId }))).status).toBe(403);
      let res = await documentsPost(json(`/api/v1/family/applications/${riyaId}/documents`, { documents: [{ key: "birth_certificate", fileId: mine1, name: "birth.pdf" }, { key: "photo", fileId: mine2, name: "riya.jpg" }] }), params({ applicationId: riyaId }));
      expect(res.status).toBe(200);
      let view = await res.json();
      expect(view.documents.map((d: { key: string; fileId: string; mime: string; size: number }) => [d.key, d.fileId, d.mime, d.size])).toEqual([["birth_certificate", mine1, "application/pdf", 2048], ["photo", mine2, "image/jpeg", 4096]]);
      expect(view.documentsMissing).toEqual([]);
      expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: mine1 } })).consumedAt).not.toBeNull();
      res = await documentsPost(json(`/api/v1/family/applications/${riyaId}/documents`, { documents: [{ key: "birth_certificate", fileId: mine3, name: "birth-v2.pdf" }] }), params({ applicationId: riyaId }));
      view = await res.json();
      expect(view.documents.map((d: { key: string; fileId: string }) => [d.key, d.fileId])).toEqual([["birth_certificate", mine3], ["photo", mine2]]);

      const asParentA = await getSession();
      expect(await authorizeFileRead(mine3, asParentA)).toEqual({ allowed: true, kind: "application", public: false });
      await as("PARENT_B");
      expect((await authorizeFileRead(mine3, await getSession())).allowed).toBe(false);
      await as("TEACHER");
      expect((await authorizeFileRead(mine3, await getSession())).allowed).toBe(false);
      await as("PRINCIPAL");
      expect(await authorizeFileRead(mine3, await getSession())).toEqual({ allowed: true, kind: "application", public: false });
      const audit = await db.auditLog.findFirst({ where: { schoolId, action: "admissions.documents", targetId: riyaId }, orderBy: { createdAt: "desc" } });
      expect(JSON.parse(audit!.meta)).toEqual({ keys: ["birth_certificate"], byOffice: false });
    } finally {
      await db.uploadTicket.deleteMany({ where: { fileId: { in: [mine1, mine2, mine3, theirs] } } });
    }
  });

  it("sittings: the office publishes them once, a family books one and the count holds under the capacity, a move to a full one is refused, cancelling releases and tells the family", async () => {
    await as("ADMIN");
    const startsAt = new Date(Date.now() + 7 * 86_400_000);
    startsAt.setUTCSeconds(0, 0);
    let res = await slotsPost(json(`/api/v1/office/admissions/cycles/${cycleId}/slots`, { startsAt: startsAt.toISOString(), durationMinutes: 30, count: 2, capacity: 1, location: "Room 3" }), params({ cycleId }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ created: 2 });
    expect(await (await slotsPost(json(`/api/v1/office/admissions/cycles/${cycleId}/slots`, { startsAt: startsAt.toISOString(), durationMinutes: 30, count: 2, capacity: 1 }), params({ cycleId }))).json()).toEqual({ created: 0 });
    res = await slotsGet(get(`/api/v1/office/admissions/cycles/${cycleId}/slots`), params({ cycleId }));
    const { slots } = await res.json();
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({ startsAt: startsAt.toISOString(), capacity: 1, booked: 0, location: "Room 3", cancelledAt: null });
    slotA = slots[0].id;
    slotB = slots[1].id;

    await as("PARENT_A");
    res = await familyAppGet(get(`/api/v1/family/applications/${riyaId}`), params({ applicationId: riyaId }));
    expect((await res.json()).openSlots).toHaveLength(2);
    res = await bookPost(json(`/api/v1/family/applications/${riyaId}/book`, { slotId: slotA }), params({ applicationId: riyaId }));
    expect(res.status).toBe(200);
    expect((await res.json()).testSlot).toMatchObject({ id: slotA, booked: 1 });
    expect((await (await bookPost(json(`/api/v1/family/applications/${riyaId}/book`, { slotId: slotA }), params({ applicationId: riyaId }))).json()).testSlot.id).toBe(slotA);
    await as("PARENT_B");
    expect((await bookPost(json(`/api/v1/family/applications/${samId}/book`, { slotId: slotA }), params({ applicationId: samId }))).status).toBe(403);
    expect((await (await bookPost(json(`/api/v1/family/applications/${samId}/book`, { slotId: slotB }), params({ applicationId: samId }))).json()).testSlot.id).toBe(slotB);
    await as("PARENT_A");
    expect((await bookPost(json(`/api/v1/family/applications/${riyaId}/book`, { slotId: slotB }), params({ applicationId: riyaId }))).status).toBe(403);
    // Only the sittings with room, plus the one already held, are offered.
    res = await familyAppGet(get(`/api/v1/family/applications/${riyaId}`), params({ applicationId: riyaId }));
    expect((await res.json()).openSlots.map((s: { id: string }) => s.id)).toEqual([slotA]);

    await as("ADMIN");
    res = await slotCancel(get(`/api/v1/office/admissions/slots/${slotA}/cancel`), params({ slotId: slotA }));
    expect(await res.json()).toEqual({ ok: true, released: 1 });
    expect(await (await slotCancel(get(`/api/v1/office/admissions/slots/${slotA}/cancel`), params({ slotId: slotA }))).json()).toEqual({ ok: true, released: 0 });
    res = await officeAppGet(get(`/api/v1/office/admissions/applications/${riyaId}`), params({ applicationId: riyaId }));
    expect((await res.json()).testSlot).toBeNull();
    const told = await db.notification.findFirst({ where: { userId: parentAUserId, kind: "ADMISSION" }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toContain("test sitting was cancelled");
    expect(told?.url).toBe(`/parent/applications/${riyaId}`);
    // The family books the sitting that is left.
    await as("PARENT_A");
    await as("PARENT_B");
    await db.application.update({ where: { id: samId }, data: { testSlotId: null } });
    await as("PARENT_A");
    expect((await (await bookPost(json(`/api/v1/family/applications/${riyaId}/book`, { slotId: slotB }), params({ applicationId: riyaId }))).json()).testSlot.id).toBe(slotB);
  });
});

describe("the office's steps", () => {
  it("checks documents (not none), records the test, offers with a date (and mails it), waitlists and declines, and answers a repeated step as it stands; a teacher is refused every one", async () => {
    await as("TEACHER");
    expect((await verifyPost(get(`/api/v1/office/admissions/applications/${riyaId}/verify`), params({ applicationId: riyaId }))).status).toBe(403);
    expect((await offerPost(json(`/api/v1/office/admissions/applications/${riyaId}/offer`, { expiresOn: null }), params({ applicationId: riyaId }))).status).toBe(403);
    await as("PRINCIPAL");
    expect((await verifyPost(get(`/api/v1/office/admissions/applications/${samId}/verify`), params({ applicationId: samId }))).status).toBe(403);
    let res = await verifyPost(get(`/api/v1/office/admissions/applications/${riyaId}/verify`), params({ applicationId: riyaId }));
    expect(res.status).toBe(200);
    const verifiedAt = (await res.json()).documentsVerifiedAt;
    expect(verifiedAt).not.toBeNull();
    expect((await (await verifyPost(get(`/api/v1/office/admissions/applications/${riyaId}/verify`), params({ applicationId: riyaId }))).json()).documentsVerifiedAt).toBe(verifiedAt);
    await as("PARENT_A");
    const late = `zz-adm-${STAMP}-late.pdf`;
    await db.uploadTicket.create({ data: { userId: parentAUserId, fileId: late, mime: "application/pdf", size: 512 } });
    try {
      expect((await documentsPost(json(`/api/v1/family/applications/${riyaId}/documents`, { documents: [{ key: "photo", fileId: late, name: "x.pdf" }] }), params({ applicationId: riyaId }))).status).toBe(403);
      expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: late } })).consumedAt).toBeNull();
    } finally {
      await db.uploadTicket.delete({ where: { fileId: late } });
    }

    await as("ADMIN");
    res = await testPost(json(`/api/v1/office/admissions/applications/${riyaId}/test`, { score: "38/50", note: "Reads fluently." }), params({ applicationId: riyaId }));
    expect((await res.json())).toMatchObject({ testScore: "38/50", testNote: "Reads fluently." });
    res = await testPost(json(`/api/v1/office/admissions/applications/${riyaId}/test`, { score: "39/50" }), params({ applicationId: riyaId }));
    expect((await res.json())).toMatchObject({ testScore: "39/50", testNote: null });

    res = await offerPost(json(`/api/v1/office/admissions/applications/${riyaId}/offer`, { expiresOn: dayKey(7), note: "Welcome." }), params({ applicationId: riyaId }));
    expect(res.status).toBe(200);
    const offered = await res.json();
    expect(offered).toMatchObject({ status: "OFFERED", offerNote: "Welcome.", feeStructureName: "ZZ Grade 3 fees" });
    expect(offered.offerExpiresAt.slice(0, 10)).toBe(dayKey(7));
    expect(offered.can).toMatchObject({ offer: false, decide: true, admit: false });
    expect((await (await offerPost(json(`/api/v1/office/admissions/applications/${riyaId}/offer`, { expiresOn: null }), params({ applicationId: riyaId }))).json()).offeredAt).toBe(offered.offeredAt);
    const mail = await db.outboundEmail.findFirst({ where: { purpose: "ADMISSION", to: `zz-adm-parent-a-${STAMP}@test.invalid` }, orderBy: { createdAt: "desc" } });
    expect(mail?.subject).toBe(`ZZ Adm School ${STAMP} offers ZZ Adm Child ${STAMP} Riya a place in grade 3`);
    expect(mail?.text).toContain(`/parent/applications/${riyaId}`);
    const told = await db.notification.findFirst({ where: { userId: parentAUserId, kind: "ADMISSION" }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toContain("offered a place in grade 3");

    res = await decidePost(json(`/api/v1/office/admissions/applications/${samId}/decide`, { status: "WAITLISTED", note: "Second for grade 3." }), params({ applicationId: samId }));
    expect((await res.json())).toMatchObject({ status: "WAITLISTED", decisionNote: "Second for grade 3." });
    expect((await (await decidePost(json(`/api/v1/office/admissions/applications/${samId}/decide`, { status: "WAITLISTED" }), params({ applicationId: samId }))).json()).decisionNote).toBe("Second for grade 3.");
    expect((await (await decidePost(json(`/api/v1/office/admissions/applications/${samId}/decide`, { status: "SUBMITTED" }), params({ applicationId: samId }))).json()).status).toBe("SUBMITTED");
    expect((await (await decidePost(json(`/api/v1/office/admissions/applications/${samId}/decide`, { status: "DECLINED" }), params({ applicationId: samId }))).json()).status).toBe("DECLINED");
    expect((await offerPost(json(`/api/v1/office/admissions/applications/${samId}/offer`, { expiresOn: null }), params({ applicationId: samId }))).status).toBe(403);
    expect((await decidePost(json(`/api/v1/office/admissions/applications/${samId}/decide`, { status: "WAITLISTED" }), params({ applicationId: samId }))).status).toBe(403);
    expect((await offerPost(json(`/api/v1/office/admissions/applications/${riyaId}/offer`, { expiresOn: null, feeStructureId: "c" + "x".repeat(24) }), params({ applicationId: riyaId }))).status).toBe(200);

    const audits = await db.auditLog.findMany({ where: { schoolId, action: { in: ["admissions.test", "admissions.offer", "admissions.decide"] } } });
    for (const row of audits) {
      expect(row.meta).not.toContain("38/50");
      expect(row.meta).not.toContain("Riya");
    }
  });

  it("the family answers the offer once, cannot answer an expired one, withdraws once; the office cannot withdraw", async () => {
    await as("PARENT_B");
    expect((await respondPost(json(`/api/v1/family/applications/${samId}/respond`, { answer: "ACCEPT" }), params({ applicationId: samId }))).status).toBe(403);
    await as("PARENT_A");
    let res = await respondPost(json(`/api/v1/family/applications/${riyaId}/respond`, { answer: "ACCEPT" }), params({ applicationId: riyaId }));
    expect(res.status).toBe(200);
    const accepted = await res.json();
    expect(accepted).toMatchObject({ status: "ACCEPTED" });
    expect(accepted.can).toMatchObject({ respond: false, withdraw: true });
    expect((await (await respondPost(json(`/api/v1/family/applications/${riyaId}/respond`, { answer: "ACCEPT" }), params({ applicationId: riyaId }))).json()).respondedAt).toBe(accepted.respondedAt);
    expect((await respondPost(json(`/api/v1/family/applications/${riyaId}/respond`, { answer: "DECLINE" }), params({ applicationId: riyaId }))).status).toBe(403);
    const told = await db.notification.findFirst({ where: { userId: adminUserId, kind: "ADMISSION" }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toContain("accepted the offer");

    await as("ADMIN");
    await offerPost(json(`/api/v1/office/admissions/applications/${taraId}/offer`, { expiresOn: dayKey(-1) }), params({ applicationId: taraId }));
    await as("PARENT_B");
    expect((await respondPost(json(`/api/v1/family/applications/${taraId}/respond`, { answer: "ACCEPT" }), params({ applicationId: taraId }))).status).toBe(403);
    res = await withdrawPost(get(`/api/v1/family/applications/${taraId}/withdraw`), params({ applicationId: taraId }));
    expect((await res.json()).status).toBe("WITHDRAWN");
    expect((await (await withdrawPost(get(`/api/v1/family/applications/${taraId}/withdraw`), params({ applicationId: taraId }))).json()).status).toBe("WITHDRAWN");
    await as("ADMIN");
    expect((await withdrawPost(get(`/api/v1/family/applications/${riyaId}/withdraw`), params({ applicationId: riyaId }))).status).toBe(403);
    res = await pipelineGet(get("/api/v1/office/admissions/applications?status=WITHDRAWN"));
    expect((await res.json()).items.map((r: { id: string }) => r.id)).toEqual([taraId]);
  });

  it("a declined application keeps its sitting on the record and not on the count; an offer past its date reads as expired at once, the hourly job writes it, tells the family and audits a count with no name, changes nothing the second time, and the family still cannot answer it", async () => {
    // Two more of parent B's, both for grade 6, on a sitting of their own.
    await as("ADMIN");
    const startsAt = new Date(Date.now() + 14 * 86_400_000);
    startsAt.setUTCSeconds(0, 0);
    let res = await slotsPost(json(`/api/v1/office/admissions/cycles/${cycleId}/slots`, { startsAt: startsAt.toISOString(), durationMinutes: 30, count: 1, capacity: 2 }), params({ cycleId }));
    expect(await res.json()).toEqual({ created: 1 });
    const slotC = (await (await slotsGet(get(`/api/v1/office/admissions/cycles/${cycleId}/slots`), params({ cycleId }))).json()).slots.find((s: { startsAt: string }) => s.startsAt === startsAt.toISOString()).id as string;
    await as("PARENT_B");
    const umaId = (await (await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `ZZ Adm Child ${STAMP} Uma`, childBirthdate: "2016-03-03", gradeApplied: "6" }))).json()).id as string;
    const veerId = (await (await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `ZZ Adm Child ${STAMP} Veer`, childBirthdate: "2016-04-04", gradeApplied: "6" }))).json()).id as string;
    expect((await (await bookPost(json(`/api/v1/family/applications/${umaId}/book`, { slotId: slotC }), params({ applicationId: umaId }))).json()).testSlot).toMatchObject({ id: slotC, booked: 1 });
    expect((await (await bookPost(json(`/api/v1/family/applications/${veerId}/book`, { slotId: slotC }), params({ applicationId: veerId }))).json()).testSlot).toMatchObject({ id: slotC, booked: 2 });

    // Declined: Uma's row still says where she sat; the sitting counts one fewer, and is offered again to a family still looking.
    await as("ADMIN");
    res = await decidePost(json(`/api/v1/office/admissions/applications/${umaId}/decide`, { status: "DECLINED" }), params({ applicationId: umaId }));
    expect(await res.json()).toMatchObject({ status: "DECLINED", testSlot: { id: slotC, booked: 1 } });
    expect((await db.application.findUniqueOrThrow({ where: { id: umaId }, select: { testSlotId: true } })).testSlotId).toBe(slotC);
    res = await slotsGet(get(`/api/v1/office/admissions/cycles/${cycleId}/slots`), params({ cycleId }));
    expect((await res.json()).slots.find((s: { id: string }) => s.id === slotC)).toMatchObject({ capacity: 2, booked: 1 });

    // Veer is offered with a date already gone: every reader says EXPIRED before any job runs, and the seat is not counted as offered.
    res = await offerPost(json(`/api/v1/office/admissions/applications/${veerId}/offer`, { expiresOn: dayKey(-1) }), params({ applicationId: veerId }));
    expect(res.status).toBe(200);
    const lapsed = await res.json();
    expect(lapsed.status).toBe("EXPIRED");
    expect(lapsed.can).toMatchObject({ respond: false, offer: true, decide: true, admit: false });
    expect((await db.application.findUniqueOrThrow({ where: { id: veerId }, select: { status: true } })).status).toBe("OFFERED");
    res = await cyclesGet();
    const cycle = (await res.json()).cycles.find((c: { id: string }) => c.id === cycleId);
    expect(cycle.counts.EXPIRED).toBe(1);
    expect(cycle.seats.find((s: { grade: string }) => s.grade === "6")).toMatchObject({ offered: 0 });
    expect((await (await pipelineGet(get("/api/v1/office/admissions/applications?status=OFFERED"))).json()).items.map((r: { id: string }) => r.id)).not.toContain(veerId);
    expect((await (await pipelineGet(get("/api/v1/office/admissions/applications?status=EXPIRED"))).json()).items.map((r: { id: string; status: string }) => [r.id, r.status])).toEqual([[veerId, "EXPIRED"]]);
    await as("PARENT_B");
    res = await respondPost(json(`/api/v1/family/applications/${veerId}/respond`, { answer: "ACCEPT" }), params({ applicationId: veerId }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("expired");

    // The job writes it down, once.
    const toldBefore = await db.notification.count({ where: { userId: parentBUserId, kind: "ADMISSION" } });
    const first = await expireOffers();
    expect(first.summary.expired).toBeGreaterThanOrEqual(1);
    expect(first.perSchool[schoolId]).toEqual({ expired: 1 });
    const written = await db.application.findUniqueOrThrow({ where: { id: veerId }, select: { status: true, decidedAt: true, decisionNote: true, testSlotId: true } });
    expect(written).toMatchObject({ status: "EXPIRED", decisionNote: null, testSlotId: slotC });
    expect(written.decidedAt).not.toBeNull();
    await as("ADMIN");
    res = await slotsGet(get(`/api/v1/office/admissions/cycles/${cycleId}/slots`), params({ cycleId }));
    expect((await res.json()).slots.find((s: { id: string }) => s.id === slotC)).toMatchObject({ capacity: 2, booked: 0 });
    await as("PARENT_B");
    const told = await db.notification.findFirst({ where: { userId: parentBUserId, kind: "ADMISSION" }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toContain("has expired");
    expect(told?.url).toBe(`/parent/applications/${veerId}`);
    expect(await db.notification.count({ where: { userId: parentBUserId, kind: "ADMISSION" } })).toBe(toldBefore + 1);
    const audit = await db.auditLog.findFirst({ where: { action: "admissions.expireOffers" }, orderBy: { createdAt: "desc" } });
    expect(audit?.schoolId).toBeNull();
    expect(JSON.parse(audit!.meta)).toMatchObject({ expired: first.summary.expired });
    expect(audit!.meta).not.toContain("Veer");
    expect(audit!.meta).not.toContain(veerId);

    // The second run finds nothing here and changes nothing.
    const second = await expireOffers();
    expect(second.perSchool[schoolId]).toBeUndefined();
    expect((await db.application.findUniqueOrThrow({ where: { id: veerId }, select: { decidedAt: true } })).decidedAt).toEqual(written.decidedAt);
    expect(await db.notification.count({ where: { userId: parentBUserId, kind: "ADMISSION" } })).toBe(toldBefore + 1);
    res = await respondPost(json(`/api/v1/family/applications/${veerId}/respond`, { answer: "ACCEPT" }), params({ applicationId: veerId }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("expired");
    res = await familyAppGet(get(`/api/v1/family/applications/${veerId}`), params({ applicationId: veerId }));
    expect((await res.json()).can).toMatchObject({ respond: false, withdraw: true });

    // Not a dead end for the office: a lapsed offer may be made again, or the child put back or waitlisted.
    await as("ADMIN");
    res = await offerPost(json(`/api/v1/office/admissions/applications/${veerId}/offer`, { expiresOn: dayKey(7) }), params({ applicationId: veerId }));
    expect(await res.json()).toMatchObject({ status: "OFFERED", decidedAt: null });
    expect((await (await decidePost(json(`/api/v1/office/admissions/applications/${veerId}/decide`, { status: "WAITLISTED" }), params({ applicationId: veerId }))).json())).toMatchObject({ status: "WAITLISTED", offeredAt: null, offerExpiresAt: null });
  });

  it("admits: pupil account, membership, enrolment, the applicant as guardian, the record from the form and the fee plan with its demand in one go; again answers as it stands; the seat count holds; then the closed cycle is purged of the rest", async () => {
    await as("ADMIN");
    expect((await admitPost(json(`/api/v1/office/admissions/applications/${samId}/admit`, {}), params({ applicationId: samId }))).status).toBe(403);
    // ⚠ The admission date is TODAY ON THE SCHOOL'S CLOCK, not Kolkata's: for
    // the admit, the school sits in whichever far zone is on a different
    // calendar day from Kolkata right now (one of the two always is), so a
    // hard-coded zone would write the wrong day.
    const farZone = todayKey("Pacific/Kiritimati") !== todayKey("Asia/Kolkata") ? "Pacific/Kiritimati" : "Etc/GMT+12";
    await db.school.update({ where: { id: schoolId }, data: { timezone: farZone } });
    let res: Response;
    try {
      res = await admitPost(json(`/api/v1/office/admissions/applications/${riyaId}/admit`, { classId, admissionNumber: "GR-77" }), params({ applicationId: riyaId }));
    } finally {
      await db.school.update({ where: { id: schoolId }, data: { timezone: "Asia/Kolkata" } });
    }
    expect(res.status).toBe(200);
    const admitted = await res.json();
    expect(admitted).toMatchObject({ className: "ZZ 3A", feePlan: true, guardianLinked: true });
    expect(admitted.studentCode).toMatch(/^[A-Z0-9-]{6,}$/);
    expect(typeof admitted.firstSignInCode).toBe("string");
    const membership = await db.membership.findUniqueOrThrow({ where: { id: admitted.studentMembershipId }, include: { user: true, enrollments: true, guardianships: true, pupilRecord: true, feePlans: true } });
    expect(membership).toMatchObject({ role: "STUDENT", status: "ACTIVE", studentCode: admitted.studentCode });
    expect(membership.user.name).toBe(`ZZ Adm Child ${STAMP} Riya`);
    expect(membership.user.birthdate?.toISOString().slice(0, 10)).toBe("2019-04-12");
    expect(membership.user.isMinor).toBe(true);
    expect(membership.enrollments.map((e) => [e.classId, e.status])).toEqual([[classId, "ACTIVE"]]);
    expect(membership.guardianships.map((g) => [g.parentUserId, g.status, g.relation])).toEqual([[parentAUserId, "ACTIVE", "PARENT"]]);
    expect(membership.pupilRecord).toMatchObject({ admissionNumber: "GR-77", admittedToGrade: "3", previousSchool: "Sunrise Nursery", addressLine: "14 Lake Road", city: "Pune" });
    expect(membership.pupilRecord?.admissionDate?.toISOString().slice(0, 10)).toBe(todayKey(farZone));
    expect(membership.pupilRecord?.admissionDate?.toISOString().slice(0, 10)).not.toBe(todayKey("Asia/Kolkata"));
    expect(membership.feePlans.map((p) => p.structureId)).toEqual([structureId]);
    expect(await db.feeDemand.count({ where: { studentMembershipId: membership.id } })).toBe(1);
    const application = await db.application.findUniqueOrThrow({ where: { id: riyaId } });
    expect(application).toMatchObject({ status: "ADMITTED", admittedMembershipId: membership.id });
    const again = await (await admitPost(json(`/api/v1/office/admissions/applications/${riyaId}/admit`, {}), params({ applicationId: riyaId }))).json();
    expect(again).toMatchObject({ studentMembershipId: membership.id, firstSignInCode: null, feePlan: true, guardianLinked: true });
    expect(await db.membership.count({ where: { schoolId, role: "STUDENT" } })).toBe(1);
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "admissions.admit", targetId: riyaId } });
    expect(JSON.parse(audit!.meta)).toMatchObject({ membershipId: membership.id, classId, feePlan: true, guardianLinked: true, hasBirthdate: true });
    expect(audit!.meta).not.toContain("Riya");
    const told = await db.notification.findFirst({ where: { userId: parentAUserId, kind: "ADMISSION" }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toContain("admitted to grade 3");

    // The applicant is now a guardian: the family's list and the school's page both say so.
    await as("PARENT_A");
    res = await mineGet();
    expect((await res.json()).items.map((r: { id: string; status: string }) => [r.id, r.status])).toEqual([[riyaId, "ADMITTED"]]);
    res = await schoolGet(get(`/api/v1/shared/schools/${schoolId}/admissions`), params({ schoolId }));
    const page = await res.json();
    expect(page.open.grades[0]).toEqual({ grade: "3", seats: 1, remaining: 0 });
    expect(page.mine).toHaveLength(1);
    expect((await familyAppGet(get(`/api/v1/family/applications/${riyaId}`), params({ applicationId: riyaId }))).status).toBe(200);
    expect((await withdrawPost(get(`/api/v1/family/applications/${riyaId}/withdraw`), params({ applicationId: riyaId }))).status).toBe(403);

    // Grade 3 had one seat: the next accepted child is refused by the count.
    await as("PARENT_B");
    const zoyaId = (await (await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: `ZZ Adm Child ${STAMP} Zoya`, childBirthdate: null, gradeApplied: "3" }))).json()).id;
    await as("ADMIN");
    await offerPost(json(`/api/v1/office/admissions/applications/${zoyaId}/offer`, { expiresOn: null }), params({ applicationId: zoyaId }));
    await as("PARENT_B");
    await respondPost(json(`/api/v1/family/applications/${zoyaId}/respond`, { answer: "ACCEPT" }), params({ applicationId: zoyaId }));
    await as("ADMIN");
    expect((await admitPost(json(`/api/v1/office/admissions/applications/${zoyaId}/admit`, {}), params({ applicationId: zoyaId }))).status).toBe(403);
    res = await cyclesGet();
    expect((await res.json()).cycles[0].seats[0]).toMatchObject({ grade: "3", seats: 1, applied: 3, admitted: 1, accepted: 1 });

    await cycleStatus(json(`/api/v1/office/admissions/cycles/${cycleId}/status`, { status: "CLOSED" }), params({ cycleId }));
    await as("PARENT_B");
    expect((await applyPost(json("/api/v1/family/applications", { schoolId, cycleId, childName: "Late", childBirthdate: null, gradeApplied: "6" }))).status).toBe(403);
    await as("ADMIN");
    res = await cyclePurge(get(`/api/v1/office/admissions/cycles/${cycleId}/purge`), params({ cycleId }));
    expect(await res.json()).toEqual({ ok: true, removed: 6 });
    expect(await db.application.findMany({ where: { cycleId }, select: { id: true } })).toEqual([{ id: riyaId }]);
    expect(await (await cyclePurge(get(`/api/v1/office/admissions/cycles/${cycleId}/purge`), params({ cycleId }))).json()).toEqual({ ok: true, removed: 0 });
  });
});
