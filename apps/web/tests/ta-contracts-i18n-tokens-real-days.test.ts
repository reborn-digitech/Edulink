/**
 * Days and times that exist, and the doors' coded values: findings TA-113, TA-420, TA-546, TA-382, TA-329, TA-544
 * and TA-333 of the testing analysis of 13 November 2026, held by cases that FAIL while the defect stands and pass
 * once it is fixed.
 *
 *   TA-113  The pupil-record, certificate and college leaving doors took a day by its pattern alone: 2019-06-31
 *           was stored as 1 July, 2019-13-01 was a 500, and 2026-11-31 was frozen onto a numbered paper.
 *   TA-420  The same doors' contracts (certificates.ts) kept the pattern-only day QA-55 had left.
 *   TA-546  An absence note was kept for 2026-11-31, a day no register will ever match.
 *   TA-382  The stream records', clinical and studio writes took a day by pattern: a posting ending in month 13
 *           was stored and turned the teaching-practice desk's weeks to NaN.
 *   TA-329  A guardian's settings door saved quiet hours of 24:00 or 25:99, which the notifier reads as none.
 *   TA-544  The slot and clear doors refused weekday 0 (Sunday), which the school week, the library and the web take.
 *   TA-333  GET /api/v1/fees/structures?includeArchived=false coerced "false" to true.
 *
 * Two scratch ZZ institutions of this suite's own (a school and a college, its stamp in every name and address),
 * made through the owner connection and removed in afterAll; the doors are called with sessions minted for this
 * suite's own people.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  absenceNoteCreateSchema,
  certificateIssueSchema,
  clinicalPostingSaveSchema,
  clinicalSiteSaveSchema,
  collegeLeavingBodySchema,
  corpsActivitySaveSchema,
  corpsLeaveSchema,
  familySettingsSaveSchema,
  feeStructuresQuerySchema,
  lessonObservationSaveSchema,
  logbookEntrySaveSchema,
  officeSlotClearBodySchema,
  practicePostingSaveSchema,
  pupilRecordSaveSchema,
  slotSaveBodySchema,
  studioJurySaveSchema,
  studioSaveSchema,
} from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { savePupilRecord } from "@/lib/pupil-records";
import { issueCertificate } from "@/lib/certificates";
import { leaveCollege } from "@/lib/college-records";
import { POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { POST as certificatePost } from "@/app/api/v1/office/certificates/route";
import { POST as collegeLeavingPost } from "@/app/api/v1/accounts/leaving/[studentMembershipId]/route";
import { POST as absencePost } from "@/app/api/v1/family/students/[membershipId]/absence-notes/route";
import { POST as settingsPost } from "@/app/api/v1/family/settings/route";
import { POST as slotPost } from "@/app/api/v1/admin/timetable/slots/route";
import { POST as slotClearPost } from "@/app/api/v1/office/timetable/slots/clear/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-7);
const MAIL = (who: string) => `zz-ta-cit-days-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const CUID = `c${"a".repeat(24)}`;

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

async function as(who: "admin" | "parent" | "collegeAdmin") {
  __resetCookies();
  __setHeaders({});
  if (who === "parent") await createSession(ids.parent!, { schoolId: null, role: "PARENT" });
  else if (who === "admin") await createSession(ids.admin!, { schoolId: ids.school!, role: "ADMIN" });
  else await createSession(ids.collegeAdmin!, { schoolId: ids.college!, role: "ADMIN" });
  const session = await getSession();
  if (!session) throw new Error(`no session for ${who}`);
  return session;
}

async function refusal(res: Response): Promise<{ status: number; issues: string[] }> {
  const body = (await res.json()) as { issues?: Record<string, string> };
  return { status: res.status, issues: Object.keys(body.issues ?? {}) };
}

/** The fields a schema refuses for this body, by their path. */
function refusedFields(schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: (string | number)[] }[] } } }, body: unknown): string[] {
  const r = schema.safeParse(body);
  return r.success ? [] : (r.error?.issues ?? []).map((i) => i.path.join("."));
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA-CIT Days School ${STAMP}`, slug: `zz-ta-cit-days-${STAMP}`, code: `ZZCD${SUFFIX}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true, teachingDays: "1,2,3,4,5,6,0" }, select: { id: true } })).id;
  ids.college = (await db.school.create({ data: { name: `ZZ TA-CIT Days College ${STAMP}`, slug: `zz-ta-cit-days-c-${STAMP}`, code: `ZZCC${SUFFIX}`, contactEmail: MAIL("college"), timezone: "Asia/Kolkata", isTestFixture: true, kind: "COLLEGE" }, select: { id: true } })).id;
  for (const who of ["admin", "parent", "pupil", "collegeAdmin", "collegeStudent"]) {
    ids[who] = (await db.user.create({ data: { name: `ZZ CIT ${who}`, email: MAIL(who), prefs: "{}", isTestFixture: true }, select: { id: true } })).id;
  }
  await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZCDP${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, relation: "PARENT", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: ids.collegeAdmin!, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" } });
  ids.collegeStudentM = (await db.membership.create({ data: { userId: ids.collegeStudent!, schoolId: ids.college, role: "STUDENT", status: "ACTIVE", studentCode: `ZCDS${STAMP}` }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  ids.template = (await db.certificateTemplate.create({ data: { schoolId: ids.school, kind: "BONAFIDE", name: "ZZ Bonafide", title: "ZZ Bonafide", intro: "[[pupil.name]] is a pupil of this school.", serialPrefix: "ZB" }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ Class 5", section: "A", gradeLevel: "5", joinCode: `ZD${SUFFIX}` }, select: { id: true } })).id;
  ids.period = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "ZZ Period 1", startMinute: 510, endMinute: 555, kind: "LESSON", position: 0 }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  const schools = [ids.school, ids.college].filter((s): s is string => Boolean(s));
  if (schools.length) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: { in: schools } } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-113: a day that does not exist is refused by the pupil-record, certificate and college leaving doors", () => {
  it("TA-113: the pupil-record door answers 2019-06-31 and 2019-13-01 with a 422 naming admissionDate, and writes nothing", async () => {
    await as("admin");
    for (const day of ["2019-06-31", "2019-13-01"]) {
      expect(await refusal(await recordPost(json(`/api/v1/office/pupil-records/${ids.pupilM}`, { admissionDate: day }), params({ membershipId: ids.pupilM! }))), day).toEqual({ status: 422, issues: ["admissionDate"] });
    }
    const row = await db.pupilRecord.findUnique({ where: { studentMembershipId: ids.pupilM }, select: { admissionDate: true } });
    expect(row?.admissionDate ?? null).toBeNull();
  });

  it("TA-113: savePupilRecord itself refuses an unreal admission or previous-school TC day, on the path the family's ask takes", async () => {
    const admin = await as("admin");
    await expect(savePupilRecord(admin, ids.pupilM!, { admissionDate: "2019-06-31" })).rejects.toMatchObject({ key: "pupilRecord.dayNotReal", field: "admissionDate" });
    await expect(savePupilRecord(admin, ids.pupilM!, { previousSchoolTcDate: "2026-02-30" })).rejects.toMatchObject({ key: "pupilRecord.dayNotReal", field: "previousSchoolTcDate" });
    const row = await db.pupilRecord.findUnique({ where: { studentMembershipId: ids.pupilM }, select: { admissionDate: true, previousSchoolTcDate: true } });
    expect(row?.admissionDate ?? null).toBeNull();
    expect(row?.previousSchoolTcDate ?? null).toBeNull();
  });

  it("TA-113: the certificate issue answers leftOn 2026-11-31 with a 422 naming leftOn, and the library refuses it too; no paper is numbered", async () => {
    const admin = await as("admin");
    expect(await refusal(await certificatePost(json("/api/v1/office/certificates", { templateId: ids.template, studentMembershipId: ids.pupilM, leftOn: "2026-11-31" })))).toEqual({ status: 422, issues: ["leftOn"] });
    await expect(issueCertificate(admin, { templateId: ids.template!, studentMembershipId: ids.pupilM!, leftOn: "2026-11-31" })).rejects.toMatchObject({ key: "refusal.leaveDateInvalid" });
    expect(await db.issuedCertificate.count({ where: { schoolId: ids.school } })).toBe(0);
  });

  it("TA-113: the college leaving door answers 2026-02-30 with a 422 naming leftOn, and leaveCollege refuses it before anything else", async () => {
    const collegeAdmin = await as("collegeAdmin");
    expect(await refusal(await collegeLeavingPost(json(`/api/v1/accounts/leaving/${ids.collegeStudentM}`, { leftOn: "2026-02-30", reason: "LEFT" }), params({ studentMembershipId: ids.collegeStudentM! })))).toEqual({ status: 422, issues: ["leftOn"] });
    await expect(leaveCollege(collegeAdmin, ids.collegeStudentM!, { leftOn: "2026-02-30", reason: "LEFT" })).rejects.toMatchObject({ key: "refusal.leaveDateInvalid" });
    expect((await db.membership.findUniqueOrThrow({ where: { id: ids.collegeStudentM }, select: { leftAt: true } })).leftAt).toBeNull();
  });
});

describe("TA-420: the certificates contract checks every day it takes against the calendar", () => {
  it("TA-420: admissionDate, previousSchoolTcDate and leftOn refuse 2027-02-30 and 2026-04-31, and take 2028-02-29", () => {
    expect(refusedFields(pupilRecordSaveSchema, { admissionDate: "2026-04-31" })).toEqual(["admissionDate"]);
    expect(refusedFields(pupilRecordSaveSchema, { previousSchoolTcDate: "2027-02-30" })).toEqual(["previousSchoolTcDate"]);
    expect(refusedFields(certificateIssueSchema, { templateId: CUID, studentMembershipId: CUID, leftOn: "2027-02-30" })).toEqual(["leftOn"]);
    expect(refusedFields(certificateIssueSchema, { templateId: CUID, studentMembershipId: CUID, leftOn: "2027-13-05" })).toEqual(["leftOn"]);
    expect(refusedFields(collegeLeavingBodySchema, { leftOn: "2027-02-29", reason: "LEFT" })).toEqual(["leftOn"]);
    expect(refusedFields(pupilRecordSaveSchema, { admissionDate: "2028-02-29", previousSchoolTcDate: null })).toEqual([]);
    expect(refusedFields(certificateIssueSchema, { templateId: CUID, studentMembershipId: CUID, leftOn: "2028-02-29" })).toEqual([]);
  });
});

describe("TA-546: an absence note is for a day on the calendar", () => {
  it("TA-546: the door answers 2026-11-31 with a 422 naming dateKey and keeps no note", async () => {
    expect(refusedFields(absenceNoteCreateSchema, { dateKey: "2026-11-31", reason: "ILLNESS" })).toEqual(["dateKey"]);
    expect(refusedFields(absenceNoteCreateSchema, { dateKey: "2026-12-01", reason: "ILLNESS" })).toEqual([]);
    await as("parent");
    expect(await refusal(await absencePost(json(`/api/v1/family/students/${ids.pupilM}/absence-notes`, { dateKey: "2026-11-31", reason: "ILLNESS" }), params({ membershipId: ids.pupilM! })))).toEqual({ status: 422, issues: ["dateKey"] });
    expect(await db.absenceNote.count({ where: { studentMembershipId: ids.pupilM } })).toBe(0);
  });
});

describe("TA-382: the stream records', clinical and studio writes take days that exist", () => {
  it("TA-382: a posting ending 2027-13-01, a lesson on 2026-10-32 and an activity on 2026-11-00 are refused naming the field", () => {
    expect(refusedFields(practicePostingSaveSchema, { studentMembershipId: CUID, practiceSchoolId: CUID, from: "2026-11-01", to: "2027-13-01", lessonsPlanned: 10 })).toEqual(["to"]);
    expect(refusedFields(lessonObservationSaveSchema, { at: "2026-10-32", grade: "A", note: "ZZ" })).toEqual(["at"]);
    expect(refusedFields(corpsActivitySaveSchema, { title: "ZZ camp", at: "2026-11-00", hours: 2, camp: false, participantMembershipIds: [] })).toEqual(["at"]);
    expect(refusedFields(corpsLeaveSchema, { studentMembershipIds: [CUID], on: "2026-02-30" })).toEqual(["on"]);
    expect(refusedFields(clinicalPostingSaveSchema, { departmentId: CUID, divisionId: CUID, labBatchId: null, supervisorMembershipId: CUID, from: "2026-02-30", to: "2026-03-10", rotationOrder: 1 })).toEqual(["from"]);
    expect(refusedFields(clinicalSiteSaveSchema, { name: "ZZ Hospital", kind: "HOSPITAL", address: "ZZ", agreementFrom: "2026-13-01", agreementTo: null, contactRole: "MEDICAL_SUPERINTENDENT" })).toEqual(["agreementFrom"]);
    expect(refusedFields(logbookEntrySaveSchema, { clientId: "zz-client-1", postingId: CUID, on: "2026-04-31", kind: "CASE", count: 1, note: "" })).toEqual(["on"]);
    expect(refusedFields(studioSaveSchema, { offeringId: CUID, title: "ZZ Studio", brief: "", maxMarks: 100, briefIssuedOn: "2026-06-31", interimOn: null, finalOn: null, juryOn: null })).toEqual(["briefIssuedOn"]);
    expect(refusedFields(studioJurySaveSchema, { on: "2026-09-31", title: "ZZ Jury", jurorMembershipIds: [CUID], chairMembershipId: CUID, externalJurors: [] })).toEqual(["on"]);
    expect(refusedFields(practicePostingSaveSchema, { studentMembershipId: CUID, practiceSchoolId: CUID, from: "2026-11-01", to: "2027-01-31", lessonsPlanned: 10 })).toEqual([]);
  });
});

describe("TA-329: a guardian's quiet hours are times on the clock", () => {
  it("TA-329: 24:00 and 25:99 are a 422 naming the field, and the guardian's prefs are left as they were", async () => {
    expect(refusedFields(familySettingsSaveSchema, { channels: { push: true, email: true }, quietHours: { start: "21:00", end: "24:00" } })).toEqual(["quietHours.end"]);
    expect(refusedFields(familySettingsSaveSchema, { channels: { push: true, email: true }, quietHours: { start: "25:99", end: "06:00" } })).toEqual(["quietHours.start"]);
    expect(refusedFields(familySettingsSaveSchema, { channels: { push: true, email: true }, quietHours: { start: "21:00", end: "6:30" } })).toEqual([]);
    await as("parent");
    expect(await refusal(await settingsPost(json("/api/v1/family/settings", { channels: { push: true, email: true }, quietHours: { start: "21:00", end: "24:00" } })))).toEqual({ status: 422, issues: ["quietHours.end"] });
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.parent }, select: { prefs: true } })).prefs).toBe("{}");
  });
});

describe("TA-544: a school that teaches on Sunday sets and clears a Sunday lesson through the API", () => {
  it("TA-544: weekday 0 is taken by the slot door and the clear door at a school whose week holds Sunday, and refused by the school's week otherwise", async () => {
    expect(refusedFields(slotSaveBodySchema, { classId: CUID, periodId: CUID, weekday: 0, subject: "ZZ" })).toEqual([]);
    expect(refusedFields(officeSlotClearBodySchema, { classId: CUID, periodId: CUID, weekday: 0 })).toEqual([]);
    expect(refusedFields(slotSaveBodySchema, { classId: CUID, periodId: CUID, weekday: 7, subject: "ZZ" })).toEqual(["weekday"]);
    await as("admin");
    const set = await slotPost(json("/api/v1/admin/timetable/slots", { classId: ids.klass, periodId: ids.period, weekday: 0, subject: "ZZ Sunday Maths" }));
    expect(set.status).toBe(200);
    expect(await db.timetableSlot.count({ where: { schoolId: ids.school, classId: ids.klass, weekday: 0 } })).toBe(1);
    const cleared = await slotClearPost(json("/api/v1/office/timetable/slots/clear", { classId: ids.klass, periodId: ids.period, weekday: 0 }));
    expect(cleared.status).toBe(200);
    expect(await db.timetableSlot.count({ where: { schoolId: ids.school, classId: ids.klass, weekday: 0 } })).toBe(0);
    await db.school.update({ where: { id: ids.school }, data: { teachingDays: "1,2,3,4,5,6" } });
    try {
      const refused = await slotPost(json("/api/v1/admin/timetable/slots", { classId: ids.klass, periodId: ids.period, weekday: 0, subject: "ZZ Sunday Maths" }));
      expect(refused.status).toBe(422);
      expect(await db.timetableSlot.count({ where: { schoolId: ids.school, classId: ids.klass, weekday: 0 } })).toBe(0);
    } finally {
      await db.school.update({ where: { id: ids.school }, data: { teachingDays: "1,2,3,4,5,6,0" } });
    }
  });
});

describe("TA-333: includeArchived is the word true or false", () => {
  it("TA-333: 'false' reads as false, 'true' as true, none as unset, and another word is refused", () => {
    expect(feeStructuresQuerySchema.parse({ includeArchived: "false" }).includeArchived).toBe(false);
    expect(feeStructuresQuerySchema.parse({ includeArchived: "true" }).includeArchived).toBe(true);
    expect(feeStructuresQuerySchema.parse({}).includeArchived).toBeUndefined();
    expect(refusedFields(feeStructuresQuerySchema, { includeArchived: "maybe" })).toEqual(["includeArchived"]);
    expect(refusedFields(feeStructuresQuerySchema, { includeArchived: "0" })).toEqual(["includeArchived"]);
  });
});
