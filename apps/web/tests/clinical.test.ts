/**
 * The clinical coordinator's desk (R-56, the clinical half; 10 October 2026).
 *
 * Two ZZ colleges of this suite's own, made through the operator's
 * createSchool and removed after: a health-sciences college (H) with a
 * nursing division of three, a coordinator, a supervising teacher with no
 * duty, a plain teacher and an HOD; and a law college (L) that offers no
 * clinical desk. Proved, each against a hand count:
 *   - the duty is given only where a stream offers it;
 *   - a note that names a patient (a phone, an e-mail, a hospital number, an
 *     MRN-style code) is refused; an ordinary note is not;
 *   - sites and departments: the coordinator and the office keep them, a
 *     second of one name is refused, the agreement's dates must run forward;
 *   - postings: the coordinator alone posts a division or a batch, two
 *     postings of the same students may not overlap, the supervisor must be
 *     a teacher of the college; the desk lists today's postings first with
 *     each student's counts from the rows;
 *   - the student's logbook: an entry on a day of their posting, idempotent
 *     by clientId, handed in once, corrected only while a draft or returned;
 *   - sign and return: the posting's supervisor without the duty may, another
 *     teacher may not, the coordinator may; only a handed-in entry; the
 *     student is told; the returned entry is corrected and handed in again;
 *   - the doors: the desk's door opens to a teacher only with the duty, the
 *     sign door to any teacher (the handler decides), the family door to a
 *     student alone; every write is labelled in the safety log.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { clinicalDeskSchema, familyClinicalSchema } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { endpointFor, gateRequest, modulePagePermitted } from "@/lib/role-gate";
import { permits } from "@/lib/api-catalog/types";
import { ENDPOINTS } from "@/lib/api-catalog";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { enabledModules } from "@/lib/modules";
import { actionKey } from "@/lib/safety-labels";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";
import { clinicalDesk, clinicalSupervision, myClinical, noteCarriesIdentifier, returnLogbookEntry, saveClinicalDepartment, saveClinicalPosting, saveClinicalSite, saveLogbookEntry, signLogbookEntry, submitLogbookEntry } from "@/lib/clinical";
import { GET as deskGet } from "@/app/api/v1/duties/clinical/route";
import { GET as familyGet } from "@/app/api/v1/family/clinical/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-clin-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string, schoolId: string, route: string | null = null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(ids[who]!, { schoolId, role: role as never });
  return (await getSession().catch(() => null)) as ActiveContext;
}

async function person(schoolId: string, who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ CL ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ CL Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  for (const [key, name, streams] of [["H", "Nursing", ["HEALTH_SCIENCES"]], ["L", "Law", ["LAW"]]] as const) {
    const made = await createSchool(operator(), { contactEmail: MAIL(`contact-${key}`), timezone: TZ, name: `ZZ CL ${name} College ${STAMP}`, kind: "COLLEGE", streams: [...streams] });
    if (!made.ok) throw new Error(made.errorKey);
    ids[key] = made.schoolId;
    await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
  }
  const H = ids.H!;
  for (const [who, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["coord", "FACULTY"], ["super", "FACULTY"], ["plain", "FACULTY"], ["hod", "HOD"]] as const) await person(H, who, role);
  for (let n = 1; n <= 4; n += 1) await person(H, `s${n}`, "STUDENT");
  for (const [who, role] of [["lAdmin", "ADMIN"], ["lTeacher", "FACULTY"], ["lStudent", "STUDENT"]] as const) await person(ids.L!, who, role);
  // The nursing division: three of the four students enrolled; s4 has a seat but no enrolment, so no posting is theirs.
  ids.dept = (await db.department.create({ data: { schoolId: H, code: "NUR", name: "ZZ CL Nursing", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  ids.prog = (await db.programme.create({ data: { schoolId: H, departmentId: ids.dept!, code: "BSCN", name: "ZZ CL BSc Nursing", level: "UG", durationYears: 4, intake: 60, regulator: "INC", stream: "HEALTH_SCIENCES" }, select: { id: true } })).id;
  ids.scheme = (await db.scheme.create({ data: { schoolId: H, programmeId: ids.prog!, name: "ZZ CL scheme", effectiveYear: 2025 }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: H, name: "ZZ CL SY Nursing A", gradeLevel: "2", subject: "BSCN", joinCode: classCode() }, select: { id: true } });
  ids.division = (await db.division.create({ data: { schoolId: H, classId: klass.id, programmeId: ids.prog!, yearOfStudy: 2, academicYear: "2026–27" }, select: { id: true } })).id;
  for (let n = 1; n <= 4; n += 1) {
    await db.studentProgramme.create({ data: { schoolId: H, studentMembershipId: ids[`s${n}M`]!, programmeId: ids.prog!, schemeId: ids.scheme!, entryYear: 2025, divisionId: n <= 3 ? ids.division : null } });
    if (n <= 3) await db.enrollment.create({ data: { schoolId: H, classId: klass.id, studentMembershipId: ids[`s${n}M`]!, rollNumber: n } });
  }
  // A lab batch of s1 alone, for a batch posting.
  ids.batch = (await db.labBatch.create({ data: { schoolId: H, divisionId: ids.division!, name: "A", capacity: 2 }, select: { id: true } })).id;
  await db.labBatchMember.create({ data: { schoolId: H, batchId: ids.batch!, divisionId: ids.division!, studentMembershipId: ids.s1M! } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = [ids.H, ids.L].filter((x): x is string => Boolean(x));
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the duty and the note rule", () => {
  it("is given only where a stream offers the desk", async () => {
    await setDuties(await as("admin", "ADMIN", ids.H!), ids.coordM!, ["CLINICAL_COORDINATOR"]);
    await expect(setDuties(await as("lAdmin", "ADMIN", ids.L!), ids.lTeacherM!, ["CLINICAL_COORDINATOR"])).rejects.toMatchObject({ key: "duties.refuseNotOffered" });
  });

  it("refuses a note that names a patient and keeps an ordinary one", () => {
    expect(noteCarriesIdentifier("Two admissions with fever; vitals charted four-hourly.")).toBe(false);
    expect(noteCarriesIdentifier("Bed 12, 3 patients seen, BP 120/80.")).toBe(false);
    expect(noteCarriesIdentifier("Patient on 98765 43210 asked for a report.")).toBe(true);
    expect(noteCarriesIdentifier("Spoke to ravi.p@example.com about the discharge.")).toBe(true);
    expect(noteCarriesIdentifier("MRN/2026/0041 admitted with fever.")).toBe(true);
    expect(noteCarriesIdentifier("UHID 2026004123 on the surgical side.")).toBe(true);
    expect(noteCarriesIdentifier("Case 004123 seen in OPD.")).toBe(true);
  });
});

describe("sites, departments and postings", () => {
  it("are kept by the coordinator and the office, with the rules", async () => {
    const coord = await as("coord", "FACULTY", ids.H!);
    const site = await saveClinicalSite(coord, { name: "ZZ Civil Hospital", kind: "HOSPITAL", address: "ZZ Station Road", agreementFrom: addDaysToKey(TODAY, -100), agreementTo: addDaysToKey(TODAY, 265), contactRole: "MEDICAL_SUPERINTENDENT" });
    ids.site = site.id;
    await expect(saveClinicalSite(coord, { name: "ZZ Civil Hospital", kind: "CLINIC", address: "", agreementFrom: null, agreementTo: null, contactRole: "MEDICAL_OFFICER" })).rejects.toMatchObject({ key: "duties.clinical.refuseDuplicateSite", status: 409 });
    await expect(saveClinicalSite(coord, { name: "ZZ PHC Wagholi", kind: "PRIMARY_HEALTH_CENTRE", address: "", agreementFrom: "2026-09-01", agreementTo: "2026-08-01", contactRole: "MEDICAL_OFFICER" })).rejects.toMatchObject({ key: "duties.clinical.refuseAgreementDates", status: 422 });
    // The office keeps sites too; a teacher without the duty and the law college do not.
    const admin = await as("admin", "ADMIN", ids.H!);
    ids.phc = (await saveClinicalSite(admin, { name: "ZZ PHC Wagholi", kind: "PRIMARY_HEALTH_CENTRE", address: "", agreementFrom: null, agreementTo: null, contactRole: "MEDICAL_OFFICER" })).id;
    await expect(saveClinicalSite(await as("plain", "FACULTY", ids.H!), { name: "ZZ X", kind: "CLINIC", address: "", agreementFrom: null, agreementTo: null, contactRole: "ADMINISTRATOR" })).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    await expect(saveClinicalSite(await as("lAdmin", "ADMIN", ids.L!), { name: "ZZ X", kind: "CLINIC", address: "", agreementFrom: null, agreementTo: null, contactRole: "ADMINISTRATOR" })).rejects.toMatchObject({ key: "duties.clinical.refuseNotOffered", status: 409 });
    ids.medical = (await saveClinicalDepartment(coord, { siteId: ids.site!, name: "ZZ Medical ward", beds: 40 })).id;
    ids.surgical = (await saveClinicalDepartment(admin, { siteId: ids.site!, name: "ZZ Surgical ward", beds: 30 })).id;
    await expect(saveClinicalDepartment(coord, { siteId: ids.site!, name: "ZZ Medical ward", beds: null })).rejects.toMatchObject({ key: "duties.clinical.refuseDuplicateDepartment", status: 409 });
    await expect(saveClinicalDepartment(coord, { siteId: ids.phc!.replace(/.$/, "x"), name: "ZZ OPD", beds: null })).rejects.toMatchObject({ key: "duties.clinical.refuseSite", status: 422 });
  });

  it("post a division or a batch under a teacher, never overlapping, by the coordinator alone", async () => {
    const coord = await as("coord", "FACULTY", ids.H!);
    const base = { departmentId: ids.medical!, divisionId: ids.division!, labBatchId: null, supervisorMembershipId: ids.superM!, rotationOrder: 1 };
    ids.p1 = (await saveClinicalPosting(coord, { ...base, from: addDaysToKey(TODAY, -20), to: addDaysToKey(TODAY, 8) })).id;
    await expect(saveClinicalPosting(coord, { ...base, from: addDaysToKey(TODAY, 5), to: addDaysToKey(TODAY, 30) })).rejects.toMatchObject({ key: "duties.clinical.refuseOverlap", status: 409 });
    // A batch of the division inside the whole division's span overlaps too; after the span it does not.
    await expect(saveClinicalPosting(coord, { ...base, labBatchId: ids.batch!, from: TODAY, to: addDaysToKey(TODAY, 3) })).rejects.toMatchObject({ key: "duties.clinical.refuseOverlap" });
    ids.p2 = (await saveClinicalPosting(coord, { ...base, departmentId: ids.surgical!, supervisorMembershipId: ids.coordM!, rotationOrder: 2, from: addDaysToKey(TODAY, 9), to: addDaysToKey(TODAY, 37) })).id;
    ids.p3 = (await saveClinicalPosting(coord, { ...base, labBatchId: ids.batch!, rotationOrder: 3, from: addDaysToKey(TODAY, 38), to: addDaysToKey(TODAY, 45) })).id;
    await expect(saveClinicalPosting(coord, { ...base, from: "2026-08-10", to: "2026-08-01" })).rejects.toMatchObject({ key: "duties.clinical.refuseDates", status: 422 });
    await expect(saveClinicalPosting(coord, { ...base, supervisorMembershipId: ids.s1M!, from: "2027-01-01", to: "2027-01-10" })).rejects.toMatchObject({ key: "duties.clinical.refuseSupervisor", status: 422 });
    await expect(saveClinicalPosting(coord, { ...base, labBatchId: ids.medical!, from: "2027-01-01", to: "2027-01-10" })).rejects.toMatchObject({ key: "duties.clinical.refuseBatch", status: 422 });
    await expect(saveClinicalPosting(await as("admin", "ADMIN", ids.H!), { ...base, from: "2027-02-01", to: "2027-02-10" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
  });

  it("are read on the desk with today's posting first and each student's counts; the law college is offered none", async () => {
    const d = clinicalDeskSchema.parse(await clinicalDesk(await as("coord", "FACULTY", ids.H!)));
    expect(d).toMatchObject({ offered: true, canManage: true, canPost: true, today: TODAY });
    expect(d.sites.map((s) => [s.name, s.agreementLapsed, s.departments.length])).toEqual([["ZZ Civil Hospital", false, 2], ["ZZ PHC Wagholi", true, 0]]);
    expect(d.postings.map((p) => [p.rotationOrder, p.current, p.students.length, p.batchName])).toEqual([[1, true, 3, null], [2, false, 3, null], [3, false, 1, "A"]]);
    expect(d.postings[0]!.students.map((s) => s.rollNumber)).toEqual([1, 2, 3]);
    expect(d.divisions.map((x) => [x.name, x.students, x.batches.length])).toEqual([["ZZ CL SY Nursing A", 3, 1]]);
    expect(d.supervisors.length).toBe(4);
    expect(d.requirements).toEqual([]);
    const office = await clinicalDesk(await as("admin", "ADMIN", ids.H!));
    expect(office).toMatchObject({ canManage: true, canPost: false });
    await expect(clinicalDesk(await as("hod", "HOD", ids.H!))).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    expect((await clinicalDesk(await as("lAdmin", "ADMIN", ids.L!))).offered).toBe(false);
    // The supervising teacher's own read: rotation 1 is theirs, without the duty.
    const mine = await clinicalSupervision(await as("super", "FACULTY", ids.H!));
    expect(mine.postings.map((p) => p.id)).toEqual([ids.p1, ids.p3]);
    expect((await clinicalSupervision(await as("plain", "FACULTY", ids.H!))).postings).toEqual([]);
  });
});

describe("the student's logbook", () => {
  it("takes an entry on a day of the posting, once per clientId, with no patient named, and hands it in once", async () => {
    const s1 = await as("s1", "STUDENT", ids.H!);
    const base = { clientId: `zz-cl-${STAMP}-1`, postingId: ids.p1!, on: addDaysToKey(TODAY, -3), kind: "CASE" as const, count: 2, note: "ZZ Two admissions with fever; vitals charted." };
    const e1 = await saveLogbookEntry(s1, base);
    ids.e1 = e1.id;
    expect((await saveLogbookEntry(s1, base)).id).toBe(e1.id);
    await expect(saveLogbookEntry(s1, { ...base, clientId: "zz-cl-bad-day", on: addDaysToKey(TODAY, -30) })).rejects.toMatchObject({ key: "duties.clinical.refuseDay", status: 422 });
    await expect(saveLogbookEntry(s1, { ...base, clientId: "zz-cl-future", on: addDaysToKey(TODAY, 1) })).rejects.toMatchObject({ key: "duties.clinical.refuseDay" });
    await expect(saveLogbookEntry(s1, { ...base, clientId: "zz-cl-phone", note: "ZZ Patient on 98765 43210 asked for the report." })).rejects.toMatchObject({ key: "duties.clinical.refuseIdentifier", status: 422 });
    await expect(saveLogbookEntry(s1, { ...base, clientId: "zz-cl-ahead", postingId: ids.p2! })).rejects.toMatchObject({ key: "duties.clinical.refuseDay" });
    // s4 is not enrolled in the division; the law student is at a college with no desk.
    await expect(saveLogbookEntry(await as("s4", "STUDENT", ids.H!), { ...base, clientId: "zz-cl-s4" })).rejects.toMatchObject({ key: "duties.clinical.refusePosting", status: 422 });
    await expect(saveLogbookEntry(await as("lStudent", "STUDENT", ids.L!), { ...base, clientId: "zz-cl-law" })).rejects.toMatchObject({ key: "duties.clinical.refuseNotOffered", status: 409 });
    // Corrected while a draft; handed in; a second hand-in is a no-op; corrected no more.
    await saveLogbookEntry(s1, { ...base, id: e1.id, count: 3 });
    await submitLogbookEntry(s1, e1.id);
    await submitLogbookEntry(s1, e1.id);
    await expect(saveLogbookEntry(s1, { ...base, id: e1.id, count: 4 })).rejects.toMatchObject({ key: "duties.clinical.refuseNotEditable", status: 409 });
    const mine = familyClinicalSchema.parse(await myClinical(s1));
    expect(mine.postings.map((p) => [p.id, p.current])).toEqual([[ids.p1, true], [ids.p2, false], [ids.p3, false]]);
    expect(mine.entries.map((e) => [e.id, e.state, e.count])).toEqual([[e1.id, "SUBMITTED", 3]]);
    expect(mine.summary).toEqual({ signed: 0, waiting: 1, returned: 0, draft: 0 });
    // s2 is not in batch A, so the batch posting is not theirs.
    expect((await myClinical(await as("s2", "STUDENT", ids.H!))).postings.map((p) => p.id)).toEqual([ids.p1, ids.p2]);
    const s2 = await as("s2", "STUDENT", ids.H!);
    ids.e2 = (await saveLogbookEntry(s2, { ...base, clientId: `zz-cl-${STAMP}-2`, kind: "PROCEDURE", count: 1, note: "ZZ Assisted a cannulation." })).id;
    await submitLogbookEntry(s2, ids.e2!);
    ids.e3 = (await saveLogbookEntry(s2, { ...base, clientId: `zz-cl-${STAMP}-3`, kind: "SKILL", count: 1, note: "ZZ A bed bath." })).id;
  });
});

describe("sign and return", () => {
  it("are the posting's supervisor's or the coordinator's, on a handed-in entry only, and tell the student", async () => {
    const supervisor = await as("super", "FACULTY", ids.H!);
    const queue = (await clinicalSupervision(supervisor)).queue;
    expect(queue.map((q) => [q.id, q.canSign])).toEqual([[ids.e1, true], [ids.e2, true]]);
    await expect(signLogbookEntry(await as("plain", "FACULTY", ids.H!), ids.e1!, { remark: "" })).rejects.toMatchObject({ key: "duties.clinical.refuseNotSupervisor" });
    await expect(signLogbookEntry(await as("admin", "ADMIN", ids.H!), ids.e1!, { remark: "" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    await expect(signLogbookEntry(supervisor, ids.e3!, { remark: "" })).rejects.toMatchObject({ key: "duties.clinical.refuseNotSubmitted", status: 409 });
    await signLogbookEntry(supervisor, ids.e1!, { remark: "ZZ Good charting." });
    await expect(signLogbookEntry(supervisor, ids.e1!, { remark: "" })).rejects.toMatchObject({ key: "duties.clinical.refuseNotSubmitted" });
    const coord = await as("coord", "FACULTY", ids.H!);
    await returnLogbookEntry(coord, ids.e2!, { remark: "ZZ Say which site." });
    const desk = await clinicalDesk(coord);
    expect(desk.queue).toEqual([]);
    expect(desk.postings[0]!.students.map((s) => [s.rollNumber, s.signed, s.waiting, s.returned, s.draft])).toEqual([[1, 1, 0, 0, 0], [2, 0, 0, 1, 1], [3, 0, 0, 0, 0]]);
    expect(desk.summary).toMatchObject({ entries: 3, signed: 1, waiting: 0 });
    // The student sees the remark, corrects the returned entry and hands it in again; a signed one cannot be.
    const s2 = await as("s2", "STUDENT", ids.H!);
    const mine = await myClinical(s2);
    expect(mine.entries.find((e) => e.id === ids.e2)).toMatchObject({ state: "RETURNED", remark: "ZZ Say which site." });
    await saveLogbookEntry(s2, { id: ids.e2!, clientId: `zz-cl-${STAMP}-2`, postingId: ids.p1!, on: addDaysToKey(TODAY, -3), kind: "PROCEDURE", count: 1, note: "ZZ Assisted a cannulation on the left forearm." });
    await submitLogbookEntry(s2, ids.e2!);
    expect((await clinicalSupervision(supervisor)).queue.map((q) => q.id)).toEqual([ids.e2]);
    const s1 = await as("s1", "STUDENT", ids.H!);
    await expect(submitLogbookEntry(s1, ids.e1!)).rejects.toMatchObject({ key: "duties.clinical.refuseSigned", status: 409 });
    expect((await myClinical(s1)).entries[0]).toMatchObject({ state: "SIGNED", signedByName: "ZZ CL super", remark: "ZZ Good charting." });
    const told = await db.notification.findMany({ where: { userId: { in: [ids.s1!, ids.s2!] }, url: "/student/clinical" }, select: { userId: true } });
    expect(told.map((n) => n.userId).sort()).toEqual([ids.s1, ids.s2].sort());
  });
});

describe("the doors", () => {
  it("open as the catalog says: the desk with the duty, signing to any teacher, the logbook to a student", async () => {
    const desk = endpointFor("GET", "/api/v1/duties/clinical")!;
    expect(desk.duties).toEqual(["CLINICAL_COORDINATOR"]);
    expect(permits(desk, "FACULTY")).toBe(false);
    expect(permits(desk, "HOD", ["CLINICAL_COORDINATOR"])).toBe(true);
    expect(permits(desk, "PRINCIPAL")).toBe(true);
    await expect(gateRequest("GET /api/v1/duties/clinical", { role: "FACULTY", schoolId: ids.H!, duties: [] })).rejects.toMatchObject({ key: "duties.refuseNoDuty" });
    await expect(gateRequest("GET /api/v1/duties/clinical", { role: "FACULTY", schoolId: ids.H!, duties: ["CLINICAL_COORDINATOR"] })).resolves.toBe("pass");
    for (const path of ["/api/v1/duties/clinical/supervising", "/api/v1/duties/clinical/logbook/{entryId}/sign", "/api/v1/duties/clinical/logbook/{entryId}/return"]) {
      const door = endpointFor(path.includes("{") ? "POST" : "GET", path)!;
      expect({ path, duties: door.duties }).toEqual({ path, duties: undefined });
      expect(permits(door, "FACULTY")).toBe(true);
      expect(permits(door, "ADMIN")).toBe(false);
    }
    const family = endpointFor("GET", "/api/v1/family/clinical")!;
    expect(permits(family, "STUDENT")).toBe(true);
    expect(permits(family, "PARENT")).toBe(false);
    expect(ENDPOINTS.filter((e) => e.path.startsWith("/api/v1/duties/clinical") || e.path.startsWith("/api/v1/family/clinical")).length).toBe(10);
    const on = await enabledModules(ids.H);
    expect(modulePagePermitted("FACULTY", "/duties/clinical", on, ["CLINICAL_COORDINATOR"])).toBe(true);
    expect(modulePagePermitted("FACULTY", "/duties/clinical", on, [])).toBe(false);
    expect(modulePagePermitted("FACULTY", "/faculty/clinical", on, [])).toBe(true);
    expect(modulePagePermitted("STUDENT", "/student/clinical", on, [])).toBe(true);
    // Through the handlers, with the session's gate stamped.
    await as("coord", "FACULTY", ids.H!, "GET /api/v1/duties/clinical");
    expect((await deskGet()).status).toBe(200);
    await as("super", "FACULTY", ids.H!, "GET /api/v1/duties/clinical");
    expect((await deskGet()).status).toBe(403);
    await as("principal", "PRINCIPAL", ids.H!, "GET /api/v1/duties/clinical");
    expect((await deskGet()).status).toBe(200);
    await as("s1", "STUDENT", ids.H!, "GET /api/v1/family/clinical");
    expect((await familyGet()).status).toBe(200);
    await as("coord", "FACULTY", ids.H!, "GET /api/v1/family/clinical");
    expect((await familyGet()).status).toBe(403);
  });

  it("label every write in the safety log", async () => {
    const actions = ["duties.clinical.site", "duties.clinical.department", "duties.clinical.posting", "duties.clinical.sign", "duties.clinical.return", "clinical.logbook.save", "clinical.logbook.submit"];
    for (const action of actions) expect({ action, label: actionKey(action) }).toEqual({ action, label: expect.stringMatching(/^audit\./) });
    const logged = await db.auditLog.groupBy({ by: ["action"], where: { schoolId: ids.H!, action: { in: actions } }, _count: { _all: true } });
    expect(logged.map((l) => l.action).sort()).toEqual([...actions].sort());
  });
});
