/**
 * The clinical desk's findings of the testing analysis of 13 November 2026 (batch streams-duties).
 *
 * One ZZ college of this suite's own with HEALTH_SCIENCES and SCIENCE, made through the operator's createSchool and
 * removed after: a coordinator holding CLINICAL_COORDINATOR, a supervising teacher, a nursing division of four with a
 * lab batch A (s1, s2) and an empty batch B, a physics division, two sites and two wards. Proved:
 *   - TA-484: a Hindi or Marathi note naming the patient after the word for patient is refused;
 *   - TA-207: a student moved out of a batch posting keeps it, corrects their entries and stays on its roster; a
 *     student moved in writes no entry for days before they came;
 *   - TA-386: the desk reads its rosters in a fixed number of reads whatever the number of postings;
 *   - TA-208: a signature and a return pressed at once decide the entry once;
 *   - TA-381: a posting with entries keeps its division, batch and the days that hold them;
 *   - TA-483: a ward with postings stays at its site;
 *   - TA-486: a division outside the clinical programmes is refused at a college with another stream;
 *   - TA-267: the desk's forms correct a site, a ward and a posting by their id.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";
import { db as appDb } from "@/lib/db";
import { clinicalDesk, myClinical, noteCarriesIdentifier, returnLogbookEntry, saveClinicalDepartment, saveClinicalPosting, saveClinicalSite, saveLogbookEntry, signLogbookEntry, submitLogbookEntry } from "@/lib/clinical";
import { clinicalDepartmentAction, clinicalPostingAction, clinicalSiteAction } from "@/app/(app)/duties/clinical/actions";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-sdclin-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const D = (n: number) => addDaysToKey(TODAY, n);
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.H!, role: role as never });
  return (await getSession())!;
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ SD CL ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.H!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

/** The URL a desk action redirects to (runAction answers by redirect). */
async function redirected(run: Promise<unknown>): Promise<string> {
  try {
    await run;
  } catch (error) {
    const url = (error as { url?: string }).url;
    if (url) return url;
    throw error;
  }
  throw new Error("no redirect");
}

const form = (fields: Record<string, string>): FormData => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ SD CL Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { contactEmail: MAIL("contact"), timezone: TZ, name: `ZZ SD CL College ${STAMP}`, kind: "COLLEGE", streams: ["HEALTH_SCIENCES", "SCIENCE"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.H = made.schoolId;
  await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
  const H = ids.H;
  for (const [who, role] of [["admin", "ADMIN"], ["coord", "FACULTY"], ["super", "FACULTY"]] as const) await person(who, role);
  for (let n = 1; n <= 4; n += 1) await person(`s${n}`, "STUDENT");
  ids.dept = (await db.department.create({ data: { schoolId: H, code: "NUR", name: "ZZ SD CL Nursing" }, select: { id: true } })).id;
  ids.prog = (await db.programme.create({ data: { schoolId: H, departmentId: ids.dept!, code: "BSCN", name: "ZZ SD CL BSc Nursing", level: "UG", durationYears: 4, intake: 60, regulator: "INC", stream: "HEALTH_SCIENCES" }, select: { id: true } })).id;
  ids.phys = (await db.programme.create({ data: { schoolId: H, departmentId: ids.dept!, code: "BSCP", name: "ZZ SD CL BSc Physics", level: "UG", durationYears: 3, intake: 60, regulator: "UGC", stream: "SCIENCE" }, select: { id: true } })).id;
  ids.scheme = (await db.scheme.create({ data: { schoolId: H, programmeId: ids.prog!, name: "ZZ SD CL scheme", effectiveYear: 2025 }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: H, name: "ZZ SD CL SY Nursing", gradeLevel: "2", subject: "BSCN", joinCode: classCode() }, select: { id: true } });
  ids.klass = klass.id;
  ids.division = (await db.division.create({ data: { schoolId: H, classId: klass.id, programmeId: ids.prog!, yearOfStudy: 2, academicYear: "2026–27" }, select: { id: true } })).id;
  const physClass = await db.class.create({ data: { schoolId: H, name: "ZZ SD CL FY Physics", gradeLevel: "1", subject: "BSCP", joinCode: classCode() }, select: { id: true } });
  ids.physDivision = (await db.division.create({ data: { schoolId: H, classId: physClass.id, programmeId: ids.phys!, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } })).id;
  for (let n = 1; n <= 4; n += 1) {
    await db.studentProgramme.create({ data: { schoolId: H, studentMembershipId: ids[`s${n}M`]!, programmeId: ids.prog!, schemeId: ids.scheme!, entryYear: 2025, divisionId: ids.division } });
    await db.enrollment.create({ data: { schoolId: H, classId: klass.id, studentMembershipId: ids[`s${n}M`]!, rollNumber: n } });
  }
  ids.batchA = (await db.labBatch.create({ data: { schoolId: H, divisionId: ids.division!, name: "A", capacity: 2 }, select: { id: true } })).id;
  ids.batchB = (await db.labBatch.create({ data: { schoolId: H, divisionId: ids.division!, name: "B", capacity: 2 }, select: { id: true } })).id;
  for (const n of [1, 2]) await db.labBatchMember.create({ data: { schoolId: H, batchId: ids.batchA!, divisionId: ids.division!, studentMembershipId: ids[`s${n}M`]! } });
  await setDuties(await as("admin", "ADMIN"), ids.coordM!, ["CLINICAL_COORDINATOR"]);
  const coord = await as("coord", "FACULTY");
  ids.site = (await saveClinicalSite(coord, { name: "ZZ SD Civil Hospital", kind: "HOSPITAL", address: "", agreementFrom: D(-400), agreementTo: D(-1), contactRole: "MEDICAL_SUPERINTENDENT" })).id;
  ids.site2 = (await saveClinicalSite(coord, { name: "ZZ SD PHC", kind: "PRIMARY_HEALTH_CENTRE", address: "", agreementFrom: null, agreementTo: null, contactRole: "MEDICAL_OFFICER" })).id;
  ids.w1 = (await saveClinicalDepartment(coord, { siteId: ids.site!, name: "ZZ SD Medical ward", beds: 40 })).id;
  ids.w2 = (await saveClinicalDepartment(coord, { siteId: ids.site!, name: "ZZ SD Surgical ward", beds: 30 })).id;
  ids.p = (await saveClinicalPosting(coord, { departmentId: ids.w1!, divisionId: ids.division!, labBatchId: ids.batchA!, supervisorMembershipId: ids.superM!, from: D(-10), to: D(10), rotationOrder: 1 })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.H }, { targetId: ids.H }, { actorUserId: { in: users.map((u) => u.id) } }] } });
  await db.invite.deleteMany({ where: { schoolId: ids.H } });
  await db.school.deleteMany({ where: { id: ids.H } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 120_000);

const entry = (who: string, n: number, over: Record<string, unknown> = {}) => ({ clientId: `zz-sd-cl-${STAMP}-${who}-${n}`, postingId: ids.p!, on: D(-5), kind: "CASE" as const, count: 1, note: "ZZ Vitals charted.", ...over });

describe("the note rule", () => {
  it("TA-484: refuses a Hindi or Marathi note that names the patient after the word for patient, and keeps ordinary ones", () => {
    for (const named of ["रुग्ण रमेश गायकवाड यांचे ड्रेसिंग केले.", "मरीज़ रमेश को इंजेक्शन दिया।", "रोगी सुनीता का बुखार उतरा।", "रुग्ण: सुनीता पाटील, खाट 4."]) expect(noteCarriesIdentifier(named), named).toBe(true);
    for (const clinical of ["रुग्णाचे ड्रेसिंग केले; श्रीखंड नाही.", "रुग्ण तपासले, रक्तदाब नोंदवला.", "मरीज़ को दवा दी।", "रुग्ण दाखल झाला.", "रुग्णालयात दोन फेऱ्या.", "रुग्णसेवा शिकलो.", "Patient education given on diabetic foot care."]) expect(noteCarriesIdentifier(clinical), clinical).toBe(false);
  });
});

describe("a batch posting's students, read by its days", () => {
  it("TA-207: a student moved out of the batch keeps the posting and corrects their entries; one moved in writes nothing before they came", async () => {
    const s1 = await as("s1", "STUDENT");
    ids.e1 = (await saveLogbookEntry(s1, entry("s1", 1))).id;
    ids.e2 = (await saveLogbookEntry(s1, entry("s1", 2, { on: D(-4), kind: "SKILL" }))).id;
    await submitLogbookEntry(s1, ids.e2!);
    await returnLogbookEntry(await as("super", "FACULTY"), ids.e2!, { remark: "ZZ Say which ward." });
    // The office moved s1 from A to B today and s4 into A today (rows dated as a move after a marked lab is dated).
    await db.labBatchMember.updateMany({ where: { batchId: ids.batchA, studentMembershipId: ids.s1M }, data: { untilKey: D(-1) } });
    await db.labBatchMember.create({ data: { schoolId: ids.H!, batchId: ids.batchB!, divisionId: ids.division!, studentMembershipId: ids.s1M!, fromKey: TODAY } });
    await db.labBatchMember.create({ data: { schoolId: ids.H!, batchId: ids.batchA!, divisionId: ids.division!, studentMembershipId: ids.s4M!, fromKey: TODAY } });
    const again = await as("s1", "STUDENT");
    await expect(saveLogbookEntry(again, { ...entry("s1", 2, { on: D(-4), kind: "SKILL" }), id: ids.e2!, note: "ZZ Vitals charted on the medical ward." })).resolves.toEqual({ id: ids.e2 });
    await expect(saveLogbookEntry(again, { ...entry("s1", 1), id: ids.e1!, count: 2 })).resolves.toEqual({ id: ids.e1 });
    expect((await myClinical(again)).postings.map((p) => p.id)).toContain(ids.p);
    const desk = await clinicalDesk(await as("coord", "FACULTY"));
    const roster = desk.postings.find((p) => p.id === ids.p)!.students;
    expect(roster.find((s) => s.membershipId === ids.s1M)).toMatchObject({ draft: 1, returned: 1 });
    expect(roster.map((s) => s.membershipId)).toContain(ids.s4M);
    const s4 = await as("s4", "STUDENT");
    await expect(saveLogbookEntry(s4, entry("s4", 1))).rejects.toMatchObject({ key: "duties.clinical.refusePosting", status: 422 });
    await expect(saveLogbookEntry(s4, entry("s4", 2, { on: TODAY }))).resolves.toMatchObject({ id: expect.any(String) });
  });

  it("TA-386: the desk reads its rosters in a fixed number of reads whatever the number of postings", async () => {
    const coord = await as("coord", "FACULTY");
    // Counted through the delegates the library calls, each call passed on to the real read.
    const enrolmentRead = appDb.enrollment.findMany.bind(appDb.enrollment);
    const memberRead = appDb.labBatchMember.findMany.bind(appDb.labBatchMember);
    const enrolments = vi.spyOn(appDb.enrollment, "findMany").mockImplementation(((args: never) => enrolmentRead(args)) as never);
    const members = vi.spyOn(appDb.labBatchMember, "findMany").mockImplementation(((args: never) => memberRead(args)) as never);
    await clinicalDesk(coord);
    const few = enrolments.mock.calls.length + members.mock.calls.length;
    for (const n of [1, 2, 3, 4]) await saveClinicalPosting(coord, { departmentId: ids.w2!, divisionId: ids.division!, labBatchId: ids.batchB!, supervisorMembershipId: ids.superM!, from: D(100 + n * 10), to: D(105 + n * 10), rotationOrder: 1 + n });
    enrolments.mockClear();
    members.mockClear();
    await clinicalDesk(coord);
    const many = enrolments.mock.calls.length + members.mock.calls.length;
    // Left in place, passing every call on (a restore leaves the extended client's delegate without its method).
    enrolments.mockClear();
    members.mockClear();
    expect(many).toBe(few);
  });
});

describe("sign and return pressed at once", () => {
  it("TA-208: of a signature and a return pressed together the entry is decided once, with one audit row", async () => {
    const s3 = await as("s3", "STUDENT");
    // s3 is on the whole division; a posting of the whole division in a span of its own.
    const whole = (await saveClinicalPosting(await as("coord", "FACULTY"), { departmentId: ids.w2!, divisionId: ids.division!, labBatchId: null, supervisorMembershipId: ids.superM!, from: D(-30), to: D(-20), rotationOrder: 9 })).id;
    for (const round of [1, 2, 3]) {
      const id = (await saveLogbookEntry(s3, { clientId: `zz-sd-cl-${STAMP}-race-${round}`, postingId: whole, on: D(-25), kind: "CASE", count: 1, note: "ZZ Oral care." })).id;
      await submitLogbookEntry(s3, id);
      const [supervisor, coord] = [await as("super", "FACULTY"), await as("coord", "FACULTY")];
      const results = await Promise.allSettled([signLogbookEntry(supervisor, id, { remark: "" }), returnLogbookEntry(coord, id, { remark: "ZZ Again." })]);
      expect(results.filter((r) => r.status === "fulfilled"), `round ${round}`).toHaveLength(1);
      expect((results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason).toMatchObject({ key: "duties.clinical.refuseNotSubmitted", status: 409 });
      expect(await db.auditLog.count({ where: { targetId: id, action: { in: ["duties.clinical.sign", "duties.clinical.return"] } } })).toBe(1);
    }
  });
});

describe("corrections by id", () => {
  it("TA-381: a posting with logbook entries keeps its division, batch and the days that hold them; its supervisor and a wider span change", async () => {
    const coord = await as("coord", "FACULTY");
    const base = { id: ids.p!, departmentId: ids.w1!, divisionId: ids.division!, labBatchId: ids.batchA!, supervisorMembershipId: ids.superM!, from: D(-10), to: D(10), rotationOrder: 1 };
    await expect(saveClinicalPosting(coord, { ...base, labBatchId: ids.batchB! })).rejects.toMatchObject({ key: "duties.clinical.refusePostingHasEntries", status: 409, field: "labBatchId" });
    await expect(saveClinicalPosting(coord, { ...base, from: D(-3) })).rejects.toMatchObject({ key: "duties.clinical.refusePostingHasEntries", status: 409, field: "from" });
    expect(await db.clinicalPosting.findUniqueOrThrow({ where: { id: ids.p }, select: { labBatchId: true, fromKey: true } })).toEqual({ labBatchId: ids.batchA, fromKey: D(-10) });
    await saveClinicalPosting(coord, { ...base, supervisorMembershipId: ids.coordM!, from: D(-12), to: D(12) });
    expect(await db.clinicalPosting.findUniqueOrThrow({ where: { id: ids.p }, select: { supervisorMembershipId: true, fromKey: true } })).toEqual({ supervisorMembershipId: ids.coordM, fromKey: D(-12) });
  });

  it("TA-483: a ward with postings stays at its site; a ward without one moves", async () => {
    const admin = await as("admin", "ADMIN");
    await expect(saveClinicalDepartment(admin, { id: ids.w1!, siteId: ids.site2!, name: "ZZ SD Medical ward", beds: 40 })).rejects.toMatchObject({ key: "duties.clinical.refuseWardMoved", status: 409, field: "siteId" });
    expect((await db.clinicalDepartment.findUniqueOrThrow({ where: { id: ids.w1 }, select: { siteId: true } })).siteId).toBe(ids.site);
    const w3 = (await saveClinicalDepartment(admin, { siteId: ids.site!, name: "ZZ SD OPD", beds: null })).id;
    await saveClinicalDepartment(admin, { id: w3, siteId: ids.site2!, name: "ZZ SD OPD", beds: null });
    expect((await db.clinicalDepartment.findUniqueOrThrow({ where: { id: w3 }, select: { siteId: true } })).siteId).toBe(ids.site2);
  });

  it("TA-486: a division outside the clinical programmes is not posted at a college with another stream", async () => {
    const coord = await as("coord", "FACULTY");
    await expect(saveClinicalPosting(coord, { departmentId: ids.w1!, divisionId: ids.physDivision!, labBatchId: null, supervisorMembershipId: ids.superM!, from: D(200), to: D(210), rotationOrder: 1 })).rejects.toMatchObject({ key: "duties.clinical.refuseDivision", status: 422, field: "divisionId" });
    expect(await db.clinicalPosting.count({ where: { divisionId: ids.physDivision } })).toBe(0);
    expect((await clinicalDesk(coord)).divisions.map((d) => d.id)).toEqual([ids.division]);
  });

  it("TA-267: the desk's forms correct a site's agreement, a ward and a posting by their id", async () => {
    await as("coord", "FACULTY");
    const site = await redirected(clinicalSiteAction(form({ id: ids.site!, name: "ZZ SD Civil Hospital", kind: "HOSPITAL", address: "ZZ Station Road", agreementFrom: D(-1), agreementTo: D(729), contactRole: "MEDICAL_SUPERINTENDENT" })));
    expect(site).toContain("done=duties.clinical.siteSaved");
    expect(await db.clinicalSite.findMany({ where: { schoolId: ids.H, name: "ZZ SD Civil Hospital" }, select: { id: true, agreementToKey: true } })).toEqual([{ id: ids.site, agreementToKey: D(729) }]);
    expect((await clinicalDesk(await as("coord", "FACULTY"))).sites.find((s) => s.id === ids.site)!.agreementLapsed).toBe(false);
    const audit = await db.auditLog.findFirst({ where: { action: "duties.clinical.site", targetId: ids.site }, orderBy: { createdAt: "desc" }, select: { meta: true } });
    expect(JSON.parse(audit!.meta)).toMatchObject({ edit: true });
    await as("coord", "FACULTY");
    expect(await redirected(clinicalDepartmentAction(form({ id: ids.w2!, siteId: ids.site!, name: "ZZ SD Surgical ward", beds: "32" })))).toContain("done=duties.clinical.departmentSaved");
    expect((await db.clinicalDepartment.findUniqueOrThrow({ where: { id: ids.w2 }, select: { beds: true } })).beds).toBe(32);
    expect(await db.clinicalDepartment.count({ where: { siteId: ids.site, name: "ZZ SD Surgical ward" } })).toBe(1);
    await as("coord", "FACULTY");
    expect(await redirected(clinicalPostingAction(form({ id: ids.p!, division: `${ids.division}|${ids.batchA}`, departmentId: ids.w1!, supervisorMembershipId: ids.superM!, from: D(-12), to: D(12), rotationOrder: "1" })))).toContain("done=duties.clinical.postingSaved");
    expect((await db.clinicalPosting.findUniqueOrThrow({ where: { id: ids.p }, select: { supervisorMembershipId: true } })).supervisorMembershipId).toBe(ids.superM);
    expect(await db.clinicalPosting.count({ where: { divisionId: ids.division, departmentId: ids.w1 } })).toBe(1);
  });
});
