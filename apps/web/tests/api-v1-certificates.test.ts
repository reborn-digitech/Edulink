/**
 * Certificates through their handlers: the office's templates from a preset
 * in a chosen language, the pupil record the family fills and the office
 * asks for, a certificate issued from a template — filled from the record,
 * numbered per year and prefix, frozen, told to the family — read and
 * downloaded by the guardian, refused to a stranger, checked by its printed
 * code, and revoked.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as templatesGet, POST as templatesPost } from "@/app/api/v1/office/certificate-templates/route";
import { POST as templatePut } from "@/app/api/v1/office/certificate-templates/[templateId]/route";
import { POST as templateArchive } from "@/app/api/v1/office/certificate-templates/[templateId]/archive/route";
import { GET as recordsGet } from "@/app/api/v1/office/pupil-records/route";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { POST as requestPost } from "@/app/api/v1/office/pupil-records/request/route";
import { GET as familyRecordGet, POST as familyRecordPost } from "@/app/api/v1/family/record/route";
import { GET as certsGet, POST as issuePost } from "@/app/api/v1/office/certificates/route";
import { POST as revokePost } from "@/app/api/v1/office/certificates/[certificateId]/revoke/route";
import { GET as sharedGet } from "@/app/api/v1/shared/certificates/[certificateId]/route";
import { GET as sharedPdf } from "@/app/api/v1/shared/certificates/[certificateId]/pdf/route";
import { GET as familyCertsGet } from "@/app/api/v1/family/certificates/route";
import { GET as verifyGet } from "@/app/api/v1/public/certificates/[code]/route";
import { presetsFor } from "@/lib/certificate-rules";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let teacherUserId = "";
let parentUserId = "";
let strangerUserId = "";
let pupilAUserId = "";
let pupilA = "";
let pupilB = "";
let classId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "ADMIN" | "TEACHER" | "PARENT" | "STRANGER" | "PUPIL" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerUserId, { schoolId: null, role: "PARENT" });
  if (who === "PUPIL") await createSession(pupilAUserId, { schoolId, role: "STUDENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Cert School ${STAMP}`, slug: `zz-cert-${STAMP}`, code: `ZT${suffix}`, contactEmail: `zz-cert-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", addressLine: "12 Lake Road", city: "Pune", locale: "mr" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Cert ${who}`, email: `zz-cert-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, teacher, parent, stranger, a, b] = await Promise.all([mk("Admin"), mk("Teacher"), mk("Parent"), mk("Stranger"), mk("Aarav Apte"), mk("Bhakti Bhosale")]);
  adminUserId = admin.id;
  teacherUserId = teacher.id;
  parentUserId = parent.id;
  strangerUserId = stranger.id;
  pupilAUserId = a.id;
  await db.user.update({ where: { id: a.id }, data: { birthdate: new Date("2016-03-10T00:00:00Z") } });
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
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
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, teacherUserId, parentUserId, strangerUserId, pupilAUserId] } } });
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
    expect(view.placeholders).toHaveLength(38);
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
});

describe("the pupil record", () => {
  it("is blank until the family fills it; the guardian and the pupil may, a stranger may not; the office sees who is incomplete and asks the families, who are told", async () => {
    await as("ADMIN");
    let res = await recordGet(get(`/api/v1/office/pupil-records/${pupilA}`), params({ membershipId: pupilA }));
    expect(res.status).toBe(200);
    let view = await res.json();
    expect(view).toMatchObject({ record: null, complete: false, canEdit: true, birthdate: "2016-03-10", studentName: "ZZ Cert Aarav Apte", className: "ZZ 4A" });
    expect(view.missing).toHaveLength(9);

    await as("STRANGER");
    expect((await familyRecordGet(get(`/api/v1/family/record?childId=${pupilA}`))).status).toBe(403);
    await as("PARENT");
    res = await familyRecordPost(json(`/api/v1/family/record?childId=${pupilA}`, { fatherName: "Rohan Apte", motherName: "Sneha Apte", placeOfBirth: "Pune", nationality: "Indian", motherTongue: "Marathi", addressLine: "12 Lake Road", city: "Pune", admissionNumber: "GR-1042", religion: "Hindu", category: "General" }));
    expect(res.status).toBe(200);
    view = await res.json();
    expect(view.missing).toEqual(["admissionDate"]);
    expect(view.record.familyFilledAt).not.toBeNull();
    expect(view.canEdit).toBe(true);
    await as("PUPIL");
    res = await familyRecordPost(json("/api/v1/family/record", { previousSchool: "Sunrise Nursery" }));
    expect(res.status).toBe(200);
    const own = await res.json();
    expect(own.record.previousSchool).toBe("Sunrise Nursery");
    expect(own.record.fatherName).toBe("Rohan Apte");

    await as("TEACHER");
    expect((await recordsGet(get("/api/v1/office/pupil-records"))).status).toBe(403);
    await as("ADMIN");
    const all = await (await recordsGet(get("/api/v1/office/pupil-records"))).json();
    expect(all).toMatchObject({ total: 2, complete: 0, incomplete: 2 });
    const onlyMissing = await (await recordsGet(get("/api/v1/office/pupil-records?missing=1"))).json();
    expect(onlyMissing.rows.map((r: { studentMembershipId: string; missing: string[] }) => [r.studentMembershipId, r.missing.length])).toEqual([[pupilA, 1], [pupilB, 9]]);

    res = await requestPost(json("/api/v1/office/pupil-records/request", {}));
    expect(await res.json()).toEqual({ asked: 2, families: 1 });
    const told = await db.notification.findMany({ where: { userId: { in: [parentUserId, pupilAUserId] }, schoolId }, select: { userId: true, url: true, kind: true } });
    expect(told.map((n) => [n.userId === parentUserId ? "parent" : "pupil", n.url]).sort()).toEqual([["parent", `/parent/record?child=${pupilA}`], ["pupil", "/student/record"]]);
    expect(told.every((n) => n.kind === "SYSTEM")).toBe(true);
    const asked = await (await recordGet(get(`/api/v1/office/pupil-records/${pupilB}`), params({ membershipId: pupilB }))).json();
    expect(asked.record.requestedAt).not.toBeNull();

    res = await recordPost(json(`/api/v1/office/pupil-records/${pupilA}`, { admissionDate: "2022-06-15", admittedToGrade: "1" }), params({ membershipId: pupilA }));
    view = await res.json();
    expect(view.complete).toBe(true);
    expect(view.record.admissionDate).toBe("2022-06-15");
    expect(view.record.fatherName).toBe("Rohan Apte");
    const audits = await db.auditLog.findMany({ where: { schoolId, action: { in: ["pupilRecord.update", "pupilRecord.request"] } }, select: { action: true, meta: true } });
    expect(audits.map((a) => a.action).sort()).toEqual(["pupilRecord.request", "pupilRecord.update", "pupilRecord.update", "pupilRecord.update"]);
    expect(audits.every((a) => !a.meta.includes("Rohan") && !a.meta.includes("Lake"))).toBe(true);
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
    let check = await (await verifyGet(get(`/api/v1/public/certificates/${code}`), params({ code }))).json();
    expect(check).toMatchObject({ valid: true, kind: "BONAFIDE", serial: "BC/2026–27/0001", schoolName: `ZZ Cert School ${STAMP}`, revokedAt: null });
    expect(Object.keys(check)).not.toContain("studentName");
    expect(await (await verifyGet(get("/api/v1/public/certificates/NOSUCHCODE"), params({ code: "NOSUCHCODE" }))).json()).toMatchObject({ valid: false, serial: null });

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
    check = await (await verifyGet(get(`/api/v1/public/certificates/${code}`), params({ code }))).json();
    expect(check.valid).toBe(false);
    expect(check.revokedAt).not.toBeNull();
    const audits = await db.auditLog.findMany({ where: { schoolId, action: { in: ["certificate.issue", "certificate.revoke", "certificate.template"] } }, select: { action: true, meta: true } });
    expect(audits.filter((a) => a.action === "certificate.issue")).toHaveLength(3);
    expect(audits.every((a) => !a.meta.includes("Aarav") && !a.meta.includes("Rohan"))).toBe(true);
  });
});
