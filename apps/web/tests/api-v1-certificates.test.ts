/**
 * Certificates through their handlers: the office's templates from a preset
 * in a chosen language, the pupil record the family fills and the office
 * asks for, a certificate issued from a template — filled from the record,
 * numbered per year and prefix, frozen, told to the family — read and
 * downloaded by the guardian, refused to a stranger, checked by its printed
 * code, and revoked.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as templatesGet, POST as templatesPost } from "@/app/api/v1/office/certificate-templates/route";
import { POST as templatePut } from "@/app/api/v1/office/certificate-templates/[templateId]/route";
import { POST as templateArchive } from "@/app/api/v1/office/certificate-templates/[templateId]/archive/route";
import { GET as recordsGet } from "@/app/api/v1/office/pupil-records/route";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { POST as requestPost } from "@/app/api/v1/office/pupil-records/request/route";
import { GET as familyRecordGet } from "@/app/api/v1/family/record/route";
import { POST as familyChangePost } from "@/app/api/v1/family/record/changes/route";
import { POST as changeDecidePost } from "@/app/api/v1/office/record-changes/[requestId]/decide/route";
import { GET as certsGet, POST as issuePost } from "@/app/api/v1/office/certificates/route";
import { POST as revokePost } from "@/app/api/v1/office/certificates/[certificateId]/revoke/route";
import { GET as sharedGet } from "@/app/api/v1/shared/certificates/[certificateId]/route";
import { GET as sharedPdf } from "@/app/api/v1/shared/certificates/[certificateId]/pdf/route";
import { GET as familyCertsGet } from "@/app/api/v1/family/certificates/route";
import { GET as verifyGet } from "@/app/api/v1/public/certificates/[code]/route";
import { presetsFor } from "@/lib/certificate-rules";
import { issuedOnFor } from "@/lib/certificate-pdf";
import { recordDeparture } from "@/lib/school-record";
import { getSession } from "@/lib/session";
import { todayKey } from "@/lib/dates";
import { dateInFigures } from "@/lib/words";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let parentUserId = "";
let strangerUserId = "";
let pupilAUserId = "";
let pupilA = "";
let pupilB = "";
let classId = "";
let teacherMembershipId = "";

/**
 * The public check exactly as a stranger holding the paper reaches it: the
 * route's module graph loaded afresh with the APPLICATION role's connection
 * and no session, so row-level security is in force. Every other call in this
 * file runs as the owner (tests/setup.ts), which bypasses RLS — and that is how
 * this check once passed here while every printed QR answered "not valid"
 * (campaign 2026-10-04, C-1). Falls back to the owner's route, and says so,
 * only where the configuration has a single role.
 */
async function verifySignedOut(code: string): Promise<Record<string, unknown>> {
  const appUrl = process.env.DATABASE_APP_URL;
  const adminUrl = process.env.DATABASE_ADMIN_URL;
  const twoRoles = !!appUrl && !!adminUrl && new URL(appUrl).username !== new URL(adminUrl).username;
  __resetCookies();
  if (!twoRoles) {
    console.warn("verifySignedOut: one database role configured; the check ran as the owner");
    return (await verifyGet(get(`/api/v1/public/certificates/${code}`), params({ code }))).json();
  }
  type Disconnectable = { $disconnect(): Promise<void> } | undefined;
  const globals = globalThis as unknown as { prisma?: { $disconnect(): Promise<void> } };
  const ownerClient = globals.prisma;
  const ownerUrl = process.env.DATABASE_URL;
  globals.prisma = undefined;
  process.env.DATABASE_URL = appUrl;
  vi.resetModules();
  try {
    const fresh = await import("@/app/api/v1/public/certificates/[code]/route");
    return await (await fresh.GET(get(`/api/v1/public/certificates/${code}`), params({ code }))).json();
  } finally {
    // The client the fresh module graph made, as the app role: closed, and the owner's put back.
    await (globals.prisma as Disconnectable)?.$disconnect();
    globals.prisma = ownerClient;
    process.env.DATABASE_URL = ownerUrl;
  }
}

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
/** How a family's value reaches the record since 2026-09-29: they ask, and the office approves. */
async function askAndApprove(who: "PARENT" | "PUPIL", query: string, studentMembershipId: string, changes: Record<string, string>) {
  await as(who);
  const asked = await familyChangePost(json(`/api/v1/family/record/changes${query}`, { changes, reason: "ZZ test" }));
  expect(asked.status).toBe(200);
  const { id } = (await asked.json()) as { id: string };
  await as("ADMIN");
  expect((await changeDecidePost(json(`/api/v1/office/record-changes/${id}/decide`, { approve: true }), params({ requestId: id }))).status).toBe(200);
  return (await recordGet(get(`/api/v1/office/pupil-records/${studentMembershipId}`), params({ membershipId: studentMembershipId }))).json();
}

async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT" | "STRANGER" | "PUPIL" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerUserId, { schoolId: null, role: "PARENT" });
  if (who === "PUPIL") await createSession(pupilAUserId, { schoolId, role: "STUDENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Cert School ${STAMP}`, slug: `zz-cert-${STAMP}`, code: `ZT${suffix}`, contactEmail: `zz-cert-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", addressLine: "12 Lake Road", city: "Pune", locale: "mr" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Cert ${who}`, email: `zz-cert-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, parent, stranger, a, b] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Parent"), mk("Stranger"), mk("Aarav Apte"), mk("Bhakti Bhosale")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  parentUserId = parent.id;
  strangerUserId = stranger.id;
  pupilAUserId = a.id;
  await db.user.update({ where: { id: a.id }, data: { birthdate: new Date("2016-03-10T00:00:00Z") } });
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  teacherMembershipId = tm.id;
  pupilA = (await db.membership.create({ data: { userId: a.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZTA${STAMP}` }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: b.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZTB${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilA, studentSchoolId: schoolId, status: "ACTIVE" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ 4A", gradeLevel: "4", joinCode: `ZT1${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId, classId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.createMany({ data: [{ schoolId, classId, studentMembershipId: pupilA, status: "ACTIVE" }, { schoolId, classId, studentMembershipId: pupilB, status: "ACTIVE" }] });
  await db.academicYear.create({ data: { schoolId, name: `2026–27`, startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, parentUserId, strangerUserId, pupilAUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

let bonafideId = "";
let tcHindiId = "";

describe("templates", () => {
  it("401 signed out and a teacher refused; the office reads the presets in three languages with sample values in its own, creates from a preset, refuses a repeated name, reworks and retires", async () => {
    await as(null);
    expect((await templatesGet()).status).toBe(401);
    await as("TEACHER");
    expect((await templatesGet()).status).toBe(403);
    await as("ADMIN");
    let res = await templatesGet();
    expect(res.status).toBe(200);
    const view = await res.json();
    expect(view.templates).toEqual([]);
    expect(view.presets).toHaveLength(15);
    expect(view.presets.map((p: { key: string }) => p.key)).toContain("NIRGAM-mr");
    // Thirty-eight before the two codes left the list: a certificate carries no code that opens anything.
    // 36 a school's, and the seven [[college.*]] a college's paper names (4 Oct 2026), which print a dash at a school.
    expect(view.placeholders).toHaveLength(43);
    expect(view.placeholders.map((p: { key: string }) => p.key)).not.toContain("pupil.studentCode");
    expect(view.placeholders.map((p: { key: string }) => p.key)).not.toContain("school.code");
    expect(view.placeholders.find((p: { key: string }) => p.key === "pupil.name").label).toBe("विद्यार्थ्याचे नाव");
    // The school writes Marathi: the sample pupil's date of birth is in Marathi words.
    expect(view.placeholders.find((p: { key: string }) => p.key === "pupil.dobWords").sample).toBe("दहा मार्च दोन हजार सोळा");

    const bonafide = presetsFor("en").find((p) => p.kind === "BONAFIDE")!;
    res = await templatesPost(json("/api/v1/office/certificate-templates", { ...bonafide, active: true }));
    expect(res.status).toBe(200);
    const created = await res.json();
    bonafideId = created.id;
    expect(created).toMatchObject({ kind: "BONAFIDE", locale: "en", serialPrefix: "BC", issuedCount: 0, active: true });
    expect(created.rows).toHaveLength(4);
    // The same template word for word again is the one that stands; a different one under the name is refused.
    const repeat = await templatesPost(json("/api/v1/office/certificate-templates", { ...bonafide, active: true }));
    expect(repeat.status).toBe(200);
    expect((await repeat.json()).id).toBe(bonafideId);
    expect((await templatesPost(json("/api/v1/office/certificate-templates", { ...bonafide, title: "Another heading", active: true }))).status).toBe(403);
    expect((await templatesPost(json("/api/v1/office/certificate-templates", { kind: "TC" }))).status).toBe(422);
    // A code the certificate cannot fill is refused and named, wherever in the template it is; nothing is saved.
    for (const bad of [{ intro: "Certified that [[pupil.nmae]] is a pupil." }, { outro: "Issued to [[pupil.studentCode]]." }, { rows: [{ label: "Name", value: "[[pupil.name]] [[school.joinCode]]" }] }, { title: "[[nothing.here]]" }]) {
      const refused = await templatesPost(json("/api/v1/office/certificate-templates", { ...bonafide, name: "ZZ Unknown code", ...bad, active: true }));
      expect(refused.status).toBe(403);
      expect((await refused.json()).error).toMatch(/\[\[(pupil\.nmae|pupil\.studentCode|school\.joinCode|nothing\.here)\]\]/);
    }
    expect(await db.certificateTemplate.count({ where: { schoolId, name: "ZZ Unknown code" } })).toBe(0);

    const tc = presetsFor("hi").find((p) => p.kind === "TC")!;
    res = await templatesPost(json("/api/v1/office/certificate-templates", { ...tc, name: "ZZ TC Hindi", serialPrefix: "tc", active: true }));
    const tcCreated = await res.json();
    tcHindiId = tcCreated.id;
    expect(tcCreated.serialPrefix).toBe("TC");
    res = await templatePut(json(`/api/v1/office/certificate-templates/${tcHindiId}`, { ...tc, name: "ZZ TC Hindi", intro: "प्रमाणित किया जाता है कि [[pupil.name]] इस विद्यालय में था/थी।", active: true }), params({ templateId: tcHindiId }));
    expect(res.status).toBe(200);
    expect((await res.json()).intro).toContain("[[pupil.name]]");

    const study = presetsFor("mr").find((p) => p.kind === "STUDY")!;
    const retired = await (await templatesPost(json("/api/v1/office/certificate-templates", { ...study, active: true }))).json();
    res = await templateArchive(get(`/api/v1/office/certificate-templates/${retired.id}/archive`), params({ templateId: retired.id }));
    expect(await res.json()).toEqual({ ok: true });
    expect((await templateArchive(get(`/api/v1/office/certificate-templates/${retired.id}/archive`), params({ templateId: retired.id }))).status).toBe(200);
    const again = await (await templatesGet()).json();
    expect(again.templates.map((t: { name: string; active: boolean }) => [t.name, t.active])).toEqual([["Bonafide Certificate", true], ["ZZ TC Hindi", true], [study.name, false]]);
    expect((await issuePost(json("/api/v1/office/certificates", { templateId: retired.id, studentMembershipId: pupilA }))).status).toBe(403);
  });

  it("the head reads the templates and issues from them, and neither designs, rewords nor retires one", async () => {
    await as("PRINCIPAL");
    const res = await templatesGet();
    expect(res.status).toBe(200);
    expect((await res.json()).templates).toHaveLength(3);
    const bonafide = presetsFor("en").find((p) => p.kind === "BONAFIDE")!;
    expect((await templatesPost(json("/api/v1/office/certificate-templates", { ...bonafide, name: "ZZ Head's own", active: true }))).status).toBe(403);
    expect((await templatePut(json(`/api/v1/office/certificate-templates/${bonafideId}`, { ...bonafide, title: "Reworded by the head", active: true }), params({ templateId: bonafideId }))).status).toBe(403);
    expect((await templateArchive(get(`/api/v1/office/certificate-templates/${bonafideId}/archive`), params({ templateId: bonafideId }))).status).toBe(403);
    const untouched = await db.certificateTemplate.findUniqueOrThrow({ where: { id: bonafideId }, select: { title: true, active: true } });
    expect(untouched).toEqual({ title: bonafide.title, active: true });
    await as("ADMIN");
  });
});

describe("the pupil record", () => {
  it("is blank until the family's details are approved; the guardian and the pupil may read and ask, a stranger may not; the office sees who is incomplete and asks the families, who are told", async () => {
    await as("ADMIN");
    let res = await recordGet(get(`/api/v1/office/pupil-records/${pupilA}`), params({ membershipId: pupilA }));
    expect(res.status).toBe(200);
    let view = await res.json();
    expect(view).toMatchObject({ record: null, complete: false, canEdit: true, birthdate: "2016-03-10", studentName: "ZZ Cert Aarav Apte", className: "ZZ 4A" });
    expect(view.missing).toHaveLength(9);

    await as("STRANGER");
    expect((await familyRecordGet(get(`/api/v1/family/record?childId=${pupilA}`))).status).toBe(403);
    await as("PARENT");
    // The guardian reads and does not write: the record stays blank while their ask waits, and says that one does.
    const details = { fatherName: "Rohan Apte", motherName: "Sneha Apte", placeOfBirth: "Pune", nationality: "Indian", motherTongue: "Marathi", addressLine: "12 Lake Road", city: "Pune", religion: "HINDU" };
    res = await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupilA}`, { changes: details, reason: "ZZ the admission form" }));
    expect(res.status).toBe(200);
    const ask = await res.json();
    expect(ask).toMatchObject({ status: "PENDING", byPupil: false, can: { decide: false, withdraw: true } });
    // Coded when ask: the language and the nationality are the list's codes before the office has seen them.
    expect(ask.changes).toEqual(expect.arrayContaining([{ field: "motherTongue", from: null, to: "MARATHI" }, { field: "nationality", from: null, to: "INDIAN" }]));
    view = await (await familyRecordGet(get(`/api/v1/family/record?childId=${pupilA}`))).json();
    expect(view).toMatchObject({ record: null, canEdit: false, canRequest: true, change: { id: ask.id } });
    // Nothing that differs from the record is nothing to ask.
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupilA}`, { changes: { fatherName: "" }, reason: "ZZ" }))).status).toBe(403);
    // Only the office decides.
    expect((await changeDecidePost(json(`/api/v1/office/record-changes/${ask.id}/decide`, { approve: true }), params({ requestId: ask.id }))).status).toBe(403);
    await as("TEACHER");
    expect((await changeDecidePost(json(`/api/v1/office/record-changes/${ask.id}/decide`, { approve: true }), params({ requestId: ask.id }))).status).toBe(403);
    await as("ADMIN");
    res = await changeDecidePost(json(`/api/v1/office/record-changes/${ask.id}/decide`, { approve: true }), params({ requestId: ask.id }));
    expect(await res.json()).toMatchObject({ status: "APPLIED", can: { decide: false, withdraw: false } });
    // Deciding it again answers it as it stands.
    res = await changeDecidePost(json(`/api/v1/office/record-changes/${ask.id}/decide`, { approve: false, reason: "too late" }), params({ requestId: ask.id }));
    expect(await res.json()).toMatchObject({ status: "APPLIED", declineReason: null });
    view = await (await recordGet(get(`/api/v1/office/pupil-records/${pupilA}`), params({ membershipId: pupilA }))).json();
    expect(view.missing).toEqual(["admissionNumber", "admissionDate"]);
    expect(view.record).toMatchObject({ fatherName: "Rohan Apte", religion: "HINDU", motherTongue: "MARATHI", admissionNumber: null, category: null, ews: null, gender: null, admittedToGrade: null });
    expect(view.record.familyFilledAt).not.toBeNull();
    expect(view.change).toBeNull();
    const own = await askAndApprove("PUPIL", "", pupilA, { previousSchool: "Sunrise Nursery" });
    expect(own.record.previousSchool).toBe("Sunrise Nursery");
    expect(own.record.fatherName).toBe("Rohan Apte");
    const heard = await db.notification.findMany({ where: { schoolId, titleKey: { startsWith: "recordChanges." } }, select: { userId: true, titleKey: true } });
    expect(heard.filter((n) => n.titleKey === "recordChanges.notifAsked").every((n) => n.userId !== parentUserId && n.userId !== pupilAUserId)).toBe(true);
    expect(heard.filter((n) => n.titleKey === "recordChanges.notifApplied").map((n) => (n.userId === parentUserId ? "parent" : n.userId === pupilAUserId ? "pupil" : "other")).sort()).toEqual(["parent", "parent", "pupil"]);
    await db.notification.deleteMany({ where: { schoolId, titleKey: { startsWith: "recordChanges." } } });

    await as("TEACHER");
    expect((await recordsGet(get("/api/v1/office/pupil-records"))).status).toBe(403);
    await as("ADMIN");
    const all = await (await recordsGet(get("/api/v1/office/pupil-records"))).json();
    expect(all).toMatchObject({ total: 2, complete: 0, incomplete: 2 });
    const onlyMissing = await (await recordsGet(get("/api/v1/office/pupil-records?missing=1"))).json();
    expect(onlyMissing.rows.map((r: { studentMembershipId: string; missing: string[] }) => [r.studentMembershipId, r.missing.length])).toEqual([[pupilA, 2], [pupilB, 9]]);

    res = await requestPost(json("/api/v1/office/pupil-records/request", {}));
    expect(await res.json()).toEqual({ asked: 2, families: 1 });
    const told = await db.notification.findMany({ where: { userId: { in: [parentUserId, pupilAUserId] }, schoolId }, select: { userId: true, url: true, kind: true } });
    expect(told.map((n) => [n.userId === parentUserId ? "parent" : "pupil", n.url]).sort()).toEqual([["parent", `/parent/record?child=${pupilA}`], ["pupil", "/student/record"]]);
    expect(told.every((n) => n.kind === "SYSTEM")).toBe(true);
    const asked = await (await recordGet(get(`/api/v1/office/pupil-records/${pupilB}`), params({ membershipId: pupilB }))).json();
    expect(asked.record.requestedAt).not.toBeNull();

    // The office's save sets the rest; a family's later ask to clear them changes nothing while it waits, and nothing when it is declined.
    res = await recordPost(json(`/api/v1/office/pupil-records/${pupilA}`, { admissionNumber: "GR-1042", admissionDate: "2022-06-15", admittedToGrade: "1", category: "GENERAL", ews: "yes" }), params({ membershipId: pupilA }));
    view = await res.json();
    expect(view.complete).toBe(true);
    expect(view.record).toMatchObject({ admissionNumber: "GR-1042", admissionDate: "2022-06-15", admittedToGrade: "1", category: "GENERAL", ews: "yes", fatherName: "Rohan Apte" });
    await as("PARENT");
    res = await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupilA}`, { changes: { fatherName: "Rohan Apte", admissionNumber: "", category: "", ews: "" }, reason: "ZZ a mistake" }));
    const clearing = await res.json();
    // What does not differ is not kept: the father's name is as it was.
    expect(clearing.changes.map((c: { field: string }) => c.field).sort()).toEqual(["admissionNumber", "category", "ews"]);
    await as("ADMIN");
    res = await changeDecidePost(json(`/api/v1/office/record-changes/${clearing.id}/decide`, { approve: false, reason: "These are from the admission register." }), params({ requestId: clearing.id }));
    expect(await res.json()).toMatchObject({ status: "DECLINED", declineReason: "These are from the admission register." });
    expect((await (await recordGet(get(`/api/v1/office/pupil-records/${pupilA}`), params({ membershipId: pupilA }))).json()).record).toMatchObject({ admissionNumber: "GR-1042", category: "GENERAL", ews: "yes" });
    const changeAudits = await db.auditLog.findMany({ where: { schoolId, action: { startsWith: "pupilRecord.change." } }, select: { action: true, meta: true } });
    expect(changeAudits.map((a) => a.action).sort()).toEqual(["pupilRecord.change.apply", "pupilRecord.change.apply", "pupilRecord.change.decline", "pupilRecord.change.request", "pupilRecord.change.request", "pupilRecord.change.request"]);
    // Which fields and whether a sentence was given, never the values or the sentence.
    expect(changeAudits.every((a) => !a.meta.includes("Rohan") && !a.meta.includes("Lake") && !a.meta.includes("admission register") && !a.meta.includes("ZZ"))).toBe(true);
    const audits = await db.auditLog.findMany({ where: { schoolId, action: { in: ["pupilRecord.update", "pupilRecord.request"] } }, select: { action: true, meta: true } });
    expect(audits.map((a) => a.action).sort()).toEqual(["pupilRecord.request", "pupilRecord.update", "pupilRecord.update", "pupilRecord.update"]);
    expect(audits.every((a) => !a.meta.includes("Rohan") && !a.meta.includes("Lake"))).toBe(true);
    // The rows that came from a family's ask say so, and name only the fields it applied.
    const familyRows = audits.filter((a) => a.action === "pupilRecord.update" && a.meta.includes('"family":true'));
    expect(familyRows).toHaveLength(2);
    expect(familyRows.every((a) => !a.meta.includes("admissionNumber") && !a.meta.includes("category") && !a.meta.includes("ews"))).toBe(true);
  });
});

describe("issuing", () => {
  let certA = "";
  let certTc = "";
  it("fills the template from the record with the date of birth in words, numbers per year and prefix, names what was blank, tells the family, and the Hindi transfer certificate writes its dates in Hindi", async () => {
    await as("ADMIN");
    let res = await issuePost(json("/api/v1/office/certificates", { templateId: bonafideId, studentMembershipId: pupilA, purpose: "a passport" }));
    expect(res.status).toBe(200);
    const cert = await res.json();
    certA = cert.id;
    expect(cert).toMatchObject({ kind: "BONAFIDE", locale: "en", serial: "BC/2026–27/0001", title: "Bonafide Certificate", studentName: "ZZ Cert Aarav Apte", className: "ZZ 4A", revokedAt: null, canRevoke: true, missing: [] });
    expect(cert.intro).toContain("ZZ Cert Aarav Apte, child of Rohan Apte and Sneha Apte, is a bonafide pupil of this school, studying in ZZ 4A during the academic year 2026–27");
    expect(cert.intro).toContain("10/03/2016 (Tenth March Two Thousand and Sixteen)");
    expect(cert.outro).toContain("for the purpose of a passport");
    expect(cert.rows.map((r: { value: string }) => r.value)).toEqual(["GR-1042", "ZZ 4A", "2026–27", "10/03/2016"]);
    expect(cert.code).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
    expect(cert.school.city).toBe("Pune");

    const second = await (await issuePost(json("/api/v1/office/certificates", { templateId: bonafideId, studentMembershipId: pupilB }))).json();
    expect(second.serial).toBe("BC/2026–27/0002");
    expect(second.missing).toEqual(expect.arrayContaining(["pupil.parentage", "pupil.admissionNumber", "pupil.dob", "pupil.dobWords"]));
    expect(second.rows[0].value).toBe("—");

    res = await issuePost(json("/api/v1/office/certificates", { templateId: tcHindiId, studentMembershipId: pupilA, leftOn: "2027-04-30", remark: "No dues" }));
    expect(res.status).toBe(200);
    const tc = await res.json();
    certTc = tc.id;
    expect(tc.serial).toBe("TC/2026–27/0001");
    expect(tc.locale).toBe("hi");
    const rowValue = (label: string) => tc.rows.find((r: { label: string }) => r.label === label)?.value;
    expect(rowValue("जन्म तिथि (शब्दों में)")).toBe("दस मार्च दो हज़ार सोलह");
    expect(rowValue("विद्यालय छोड़ने की तिथि")).toBe("30/04/2027 (तीस अप्रैल दो हज़ार सत्ताईस)");
    expect(rowValue("टिप्पणी")).toBe("No dues");
    expect(rowValue("पिता का नाम")).toBe("Rohan Apte");
    expect(tc.missing).toEqual(expect.arrayContaining(["pupil.caste", "record.reason"]));

    const told = await db.notification.findMany({ where: { userId: parentUserId, schoolId, url: { startsWith: "/certificates/" } }, select: { url: true } });
    expect(told.map((n) => n.url).sort()).toEqual([`/certificates/${certA}`, `/certificates/${certTc}`].sort());
    const list = await (await certsGet(get("/api/v1/office/certificates"))).json();
    expect(list.items).toHaveLength(3);
    const mine = await (await certsGet(get(`/api/v1/office/certificates?membershipId=${pupilA}`))).json();
    expect(mine.items.map((i: { serial: string }) => i.serial)).toEqual(["TC/2026–27/0001", "BC/2026–27/0001"]);
    const templates = await (await templatesGet()).json();
    expect(templates.templates.find((t: { id: string }) => t.id === bonafideId).issuedCount).toBe(2);
  });

  it("the guardian, the pupil and the class teacher read it and the guardian downloads the PDF; a stranger and another pupil get 404; anyone checks the code; revoking marks it and the check says so", async () => {
    await as("PARENT");
    let res: Response = await sharedGet(get(`/api/v1/shared/certificates/${certA}`), params({ certificateId: certA }));
    expect(res.status).toBe(200);
    expect((await res.json()).canRevoke).toBe(false);
    res = await sharedPdf(get(`/api/v1/shared/certificates/${certA}/pdf`), params({ certificateId: certA }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    const bytes = Buffer.from(await res.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    const hindi = await sharedPdf(get(`/api/v1/shared/certificates/${certTc}/pdf`), params({ certificateId: certTc }));
    expect(hindi.status).toBe(200);
    expect(Buffer.from(await hindi.arrayBuffer()).length).toBeGreaterThan(5_000);
    const family = await (await familyCertsGet()).json();
    expect(family.items.map((i: { serial: string }) => i.serial).sort()).toEqual(["BC/2026–27/0001", "TC/2026–27/0001"]);
    await as("PUPIL");
    expect((await sharedGet(get(`/api/v1/shared/certificates/${certA}`), params({ certificateId: certA }))).status).toBe(200);
    expect((await familyCertsGet()).status).toBe(200);
    await as("TEACHER");
    expect((await sharedGet(get(`/api/v1/shared/certificates/${certA}`), params({ certificateId: certA }))).status).toBe(200);
    await as("STRANGER");
    expect((await sharedGet(get(`/api/v1/shared/certificates/${certA}`), params({ certificateId: certA }))).status).toBe(404);
    expect((await sharedPdf(get(`/api/v1/shared/certificates/${certA}/pdf`), params({ certificateId: certA }))).status).toBe(404);
    await as(null);
    expect((await sharedGet(get(`/api/v1/shared/certificates/${certA}`), params({ certificateId: certA }))).status).toBe(401);

    const code = (await db.issuedCertificate.findUniqueOrThrow({ where: { id: certA }, select: { code: true } })).code;
    let check = await verifySignedOut(code);
    // The KIND'S label, not the template's filled title, which may carry the pupil's name.
    expect(check).toMatchObject({ valid: true, kind: "BONAFIDE", title: "Bonafide certificate", serial: "BC/2026–27/0001", schoolName: `ZZ Cert School ${STAMP}`, revokedAt: null });
    expect(Object.keys(check)).not.toContain("studentName");
    expect(JSON.stringify(check)).not.toContain("Aarav");
    expect(await verifySignedOut("NOSUCHCODE")).toMatchObject({ valid: false, serial: null });
    // In lower case with spaces, as a person types it off the paper.
    expect(await verifySignedOut(` ${code.toLowerCase()} `)).toMatchObject({ valid: true, serial: "BC/2026–27/0001" });

    await as("TEACHER");
    expect((await revokePost(json(`/api/v1/office/certificates/${certA}/revoke`, { reason: "Wrong pupil" }), params({ certificateId: certA }))).status).toBe(403);
    await as("ADMIN");
    res = await revokePost(json(`/api/v1/office/certificates/${certA}/revoke`, { reason: "Wrong pupil" }), params({ certificateId: certA }));
    expect(res.status).toBe(200);
    const revoked = await res.json();
    expect(revoked.revokedReason).toBe("Wrong pupil");
    expect(revoked.canRevoke).toBe(false);
    const again = await revokePost(json(`/api/v1/office/certificates/${certA}/revoke`, { reason: "Again" }), params({ certificateId: certA }));
    expect(again.status).toBe(200);
    expect((await again.json()).revokedReason).toBe("Wrong pupil");
    check = await verifySignedOut(code);
    expect(check.valid).toBe(false);
    expect(check.revokedAt).not.toBeNull();
    const audits = await db.auditLog.findMany({ where: { schoolId, action: { in: ["certificate.issue", "certificate.revoke", "certificate.template"] } }, select: { action: true, meta: true } });
    expect(audits.filter((a) => a.action === "certificate.issue")).toHaveLength(3);
    expect(audits.every((a) => !a.meta.includes("Aarav") && !a.meta.includes("Rohan"))).toBe(true);
  });
});

describe("a leaver from an earlier year, and the day of issue", () => {
  it("the certificate's attendance is the whole stay, equal to the leaving certificate's, not a dash; the leaving day is the school's; the PDF's issued-on is the body's date; the legal name is on both papers", async () => {
    await as("ADMIN");
    const adminCtx = (await getSession())!;
    // A preferred name on the account, and a stay that began the year before: the papers print the legal name.
    await db.user.update({ where: { id: (await db.membership.findUniqueOrThrow({ where: { id: pupilB }, select: { userId: true } })).userId }, data: { preferredName: "Bee" } });
    await db.membership.update({ where: { id: pupilB }, data: { joinedAt: new Date("2025-06-01T00:00:00Z") } });
    // A term of registers the year before the current one.
    const marks = [["2025-11-03", "PRESENT"], ["2025-11-04", "ABSENT"], ["2025-11-05", "LATE"], ["2025-11-06", "PRESENT"]] as const;
    for (const [dateKey, status] of marks) {
      const session = await db.attendanceSession.create({ data: { schoolId, classId, dateKey, takenByMembershipId: teacherMembershipId } });
      await db.attendanceRecord.create({ data: { schoolId, sessionId: session.id, studentMembershipId: pupilB, status, clientId: `zz-cert-${dateKey}-${STAMP}` } });
    }
    // Left on the 5th of November 2025, 20:00 UTC — the 6th in Kolkata, so the 6th's register counts too.
    const left = await recordDeparture(adminCtx, pupilB, { reason: "TRANSFERRED", destination: "Elsewhere", leftOn: new Date("2025-11-05T20:00:00Z") });
    expect(left.ok).toBe(true);
    const record = await db.schoolRecord.findUniqueOrThrow({ where: { studentMembershipId: pupilB } });
    expect(record).toMatchObject({ attendanceMarked: 4, attendancePresent: 3, studentName: "ZZ Cert Bhakti Bhosale" });

    const res = await issuePost(json("/api/v1/office/certificates", { templateId: tcHindiId, studentMembershipId: pupilB }));
    expect(res.status).toBe(200);
    const tc = await res.json();
    expect(tc.studentName).toBe("ZZ Cert Bhakti Bhosale");
    const values: string[] = tc.rows.map((r: { value: string }) => r.value);
    expect(values).toContain(`${record.attendancePresent} / ${record.attendanceMarked}`);
    expect(values.some((v) => v.startsWith("06/11/2025"))).toBe(true);
    expect(tc.missing).not.toContain("record.attendance");
    expect(tc.missing).not.toContain("record.leftOn");

    // "Issued on" is the frozen issue.date of the body, the day in the school's zone.
    const row = await db.issuedCertificate.findUniqueOrThrow({ where: { id: tc.id }, select: { dataJson: true } });
    const body = JSON.parse(row.dataJson) as Record<string, string | null>;
    expect(body["issue.date"]).toBe(dateInFigures(todayKey("Asia/Kolkata")));
    expect(await issuedOnFor(tc)).toBe(body["issue.date"]);
    // The office's list prints the legal name too.
    const list = await (await certsGet(get(`/api/v1/office/certificates?membershipId=${pupilB}`))).json();
    expect(list.items.map((i: { studentName: string }) => i.studentName)).toEqual(["ZZ Cert Bhakti Bhosale", "ZZ Cert Bhakti Bhosale"]);
  });
});

describe("⚠ the head of the paper is the paper's", () => {
  it("keeps the class and the school's name it was issued with, when the class is renamed, the school is, and the pupil is in no class at all", async () => {
    await as("ADMIN");
    const cert = await db.issuedCertificate.findFirstOrThrow({ where: { schoolId, studentMembershipId: pupilA, kind: "BONAFIDE" }, orderBy: { issuedAt: "asc" }, select: { id: true } });
    const read = async () => (await (await sharedGet(get(`/api/v1/shared/certificates/${cert.id}`), params({ certificateId: cert.id }))).json()) as { className: string | null; school: { name: string; city: string | null } };
    const before = await read();
    expect(before.className).toBe("ZZ 4A");
    const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true } });
    try {
      await db.class.update({ where: { id: classId }, data: { name: "ZZ 4 Tulip" } });
      await db.school.update({ where: { id: schoolId }, data: { name: "ZZ Renamed Academy" } });
      expect(await read()).toMatchObject({ className: "ZZ 4A", school: { name: school.name, city: "Pune" } });
      await db.enrollment.updateMany({ where: { studentMembershipId: pupilA }, data: { status: "REMOVED" } });
      expect((await read()).className).toBe("ZZ 4A");
    } finally {
      await db.enrollment.updateMany({ where: { studentMembershipId: pupilA }, data: { status: "ACTIVE" } });
      await db.class.update({ where: { id: classId }, data: { name: "ZZ 4A" } });
      await db.school.update({ where: { id: schoolId }, data: { name: school.name } });
    }
  });
});

describe("⚠ the office corrects a legal name", () => {
  const OLD = "ZZ Cert Aarav Apte";
  const NEW = "ZZ Cert Aarav Aapte";

  it("is the admin's alone, wants a name in letters and a reason from the list, and changes nothing until it has both", async () => {
    const { correctLegalName } = await import("@/lib/legal-name");
    for (const who of ["TEACHER", "PRINCIPAL", "PARENT", "PUPIL"] as const) {
      await as(who);
      await expect(correctLegalName((await getSession())!, pupilA, NEW, "SPELLING")).rejects.toMatchObject({ key: "access.onlyTheOfficeCorrectsLegalNames" });
    }
    await as("ADMIN");
    const admin = (await getSession())!;
    expect(await correctLegalName(admin, pupilA, "Aarav 2", "SPELLING")).toEqual({ ok: false, errorKey: "people.legalNameNotAName" });
    expect(await correctLegalName(admin, pupilA, "A", "SPELLING")).toEqual({ ok: false, errorKey: "people.legalNameNotAName" });
    expect(await correctLegalName(admin, pupilA, "<b>Aarav</b>", "SPELLING")).toEqual({ ok: false, errorKey: "people.legalNameNotAName" });
    expect(await correctLegalName(admin, pupilA, NEW, "because I say so")).toEqual({ ok: false, errorKey: "people.legalNameChooseReason" });
    expect(await correctLegalName(admin, "no-such-membership", NEW, "SPELLING")).toEqual({ ok: false, errorKey: "refusal.notAMemberHere" });
    // The same name is no correction: nothing is written and nobody is told.
    expect(await correctLegalName(admin, pupilA, `  ${OLD}  `, "SPELLING")).toEqual({ ok: true, changed: false });
    expect((await db.user.findUniqueOrThrow({ where: { id: pupilAUserId } })).name).toBe(OLD);
    expect(await db.auditLog.count({ where: { schoolId, action: "user.legalname.set" } })).toBe(0);
  });

  it("a name in Devanagari, and one with an apostrophe and a hyphen, are names", async () => {
    const { cleanLegalName } = await import("@/lib/legal-name");
    expect(cleanLegalName("  आरव   आपटे ")).toBe("आरव आपटे");
    expect(cleanLegalName("Mary-Anne O’Brien")).toBe("Mary-Anne O’Brien");
    expect(cleanLegalName("Dr. A. P. J. Kalam")).toBe("Dr. A. P. J. Kalam");
    expect(cleanLegalName("-Aarav")).toBeNull();
  });

  it("⚠ the paper already out keeps the name it was issued with; the next paper prints the corrected one; the pupil and the guardian are told", async () => {
    const { correctLegalName } = await import("@/lib/legal-name");
    await as("ADMIN");
    const admin = (await getSession())!;
    // A paper issued under the old name carries its own copy of it.
    const certA = (await db.issuedCertificate.findFirstOrThrow({ where: { schoolId, studentMembershipId: pupilA, kind: "BONAFIDE" }, orderBy: { issuedAt: "asc" }, select: { id: true } })).id;
    expect((await db.issuedCertificate.findUniqueOrThrow({ where: { id: certA } })).studentName).toBe(OLD);
    await db.notification.deleteMany({ where: { userId: { in: [pupilAUserId, parentUserId] } } });

    try {
      expect(await correctLegalName(admin, pupilA, NEW, "ADMISSION_RECORD")).toEqual({ ok: true, changed: true });
      expect((await db.user.findUniqueOrThrow({ where: { id: pupilAUserId } })).name).toBe(NEW);

      const before = await (await sharedGet(get(`/api/v1/shared/certificates/${certA}`), params({ certificateId: certA }))).json();
      expect(before.studentName).toBe(OLD);
      const after = await (await issuePost(json("/api/v1/office/certificates", { templateId: bonafideId, studentMembershipId: pupilA, purpose: "a bank account" }))).json();
      expect(after.studentName).toBe(NEW);
      expect(after.intro).toContain(NEW);
      const list = await (await certsGet(get(`/api/v1/office/certificates?membershipId=${pupilA}`))).json();
      expect(new Set(list.items.map((i: { studentName: string }) => i.studentName))).toEqual(new Set([OLD, NEW]));

      const logged = await db.auditLog.findFirstOrThrow({ where: { schoolId, action: "user.legalname.set" } });
      expect(logged.actorUserId).toBe(adminUserId);
      expect(JSON.parse(logged.meta ?? "{}")).toEqual({ from: OLD, to: NEW, reason: "ADMISSION_RECORD" });
      for (const userId of [pupilAUserId, parentUserId]) {
        const told = await db.notification.findFirst({ where: { userId, titleKey: "notifTitle.legalNameSet" } });
        expect(told?.body, userId).toContain(NEW);
      }
    } finally {
      await db.user.update({ where: { id: pupilAUserId }, data: { name: OLD } });
    }
  });

  it("⚠ another school's office finds nobody by that id", async () => {
    const { correctLegalName } = await import("@/lib/legal-name");
    await as("ADMIN");
    const admin = (await getSession())!;
    const elsewhere = await db.school.create({ data: { name: `ZZ Cert Elsewhere ${STAMP}`, slug: `zz-cert-else-${STAMP}`, code: `ZCE${String(STAMP).slice(-6)}`, contactEmail: `zz-cert-else-${STAMP}@test.invalid` }, select: { id: true } });
    try {
      expect(await correctLegalName({ ...admin, schoolId: elsewhere.id }, pupilA, NEW, "SPELLING")).toEqual({ ok: false, errorKey: "refusal.notAMemberHere" });
      expect((await db.user.findUniqueOrThrow({ where: { id: pupilAUserId } })).name).toBe(OLD);
    } finally {
      await db.school.delete({ where: { id: elsewhere.id } });
    }
  });
});
