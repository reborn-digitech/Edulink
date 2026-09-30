/**
 * The collection gaps the data-flow audit named, closed: category and
 * religion as coded choices the filings can code exactly; the previous
 * school's TC, the household and the roll number on the record; the
 * teacher's own two dates on the staff record and the DCF sheet; the grade
 * level kept in step with the pupil's class; and a departure record that
 * goes when the pupil is back on the roll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { POST as familyChangePost } from "@/app/api/v1/family/record/changes/route";
import { POST as changeDecidePost } from "@/app/api/v1/office/record-changes/[requestId]/decide/route";
import { udiseStudentsExport, udiseTeachersExport } from "@/lib/filings";
import { enrolStudents, removeFromCohort } from "@/lib/cohort";
import { setStaffRecord, staffRecordFor } from "@/lib/staff-records";
import { dataFor } from "@/lib/certificate-rules";
import { admitPupils } from "@/lib/intake";
import { parseCsvRecords } from "@/lib/csv";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let parentUserId = "";
let teacherMembershipId = "";
let pupil = "";
let pupilUserId = "";
let classId = "";
let otherClassId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
/** How a family's value reaches the record since 2026-09-29: they ask, and the office approves. */
async function askAndApprove(who: "PARENT", query: string, studentMembershipId: string, changes: Record<string, string>) {
  await as(who);
  const asked = await familyChangePost(json(`/api/v1/family/record/changes${query}`, { changes, reason: "ZZ test" }));
  expect(asked.status).toBe(200);
  const { id } = (await asked.json()) as { id: string };
  await as("ADMIN");
  expect((await changeDecidePost(json(`/api/v1/office/record-changes/${id}/decide`, { approve: true }), params({ requestId: id }))).status).toBe(200);
  return (await recordGet(get(`/api/v1/office/pupil-records/${studentMembershipId}`), params({ membershipId: studentMembershipId }))).json();
}

async function as(who: "ADMIN" | "PARENT" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
}
const rowsOf = (csv: string) => {
  const { records } = parseCsvRecords(csv);
  const [headers = [], ...rows] = records;
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])) as Record<string, string>);
};
const ctxOf = (role: "ADMIN" = "ADMIN"): ActiveContext => ({ user: { id: adminUserId, name: "x", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", locale: "en" } as never }, sessionId: "s", membershipId: adminMembershipId, schoolId, role });

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Gaps School ${STAMP}`, slug: `zz-gaps-${STAMP}`, code: `ZG${suffix}`, contactEmail: `zz-gaps-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", udiseCode: "27250100199", board: "MSBSHSE", medium: "Marathi" }, select: { id: true } })).id;
  const mk = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Gaps ${who}`, email: `zz-gaps-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [admin, parent, teacher, p] = await Promise.all([mk("Admin"), mk("Parent"), mk("Teacher", { birthdate: new Date("1985-03-09T00:00:00Z") }), mk("Riya Rane", { birthdate: new Date("2014-05-20T00:00:00Z") })]);
  adminUserId = admin.id; parentUserId = parent.id; pupilUserId = p.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  teacherMembershipId = (await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  pupil = (await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZGA${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupil, studentSchoolId: schoolId, status: "ACTIVE" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ 6A", gradeLevel: "6", section: "A", joinCode: `ZG1${suffix}` }, select: { id: true } })).id;
  otherClassId = (await db.class.create({ data: { schoolId, name: "ZZ 7A", gradeLevel: "7", section: "A", joinCode: `ZG2${suffix}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { schoolId, classId, studentMembershipId: pupil, status: "ACTIVE" } });
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, parentUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("⚠ the family's contact number", () => {
  it("the office writes it on the record, kept as E.164; rubbish is refused; blank clears; the account's own phone is never touched", async () => {
    await as("ADMIN");
    const save = (guardianPhone: string) => recordPost(json(`/api/v1/office/pupil-records/${pupil}`, { guardianPhone }), params({ membershipId: pupil }));
    const accountBefore = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true, phone: true, phoneVerifiedAt: true }, orderBy: { id: "asc" } });

    let res = await save("098765 43210");
    expect(res.status).toBe(200);
    expect((await res.json()).record.guardianPhone).toBe("+919876543210");
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } })).guardianPhone).toBe("+919876543210");

    for (const bad of ["call the office", "9+919876543210", "office@example.com"]) {
      res = await save(bad);
      expect(res.status, bad).toBe(403);
      expect((await res.json()).error).toMatch(/^Enter the contact number in digits/);
    }
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } })).guardianPhone).toBe("+919876543210");

    // Which field, never its value, in the log.
    const logged = await db.auditLog.findFirstOrThrow({ where: { action: "pupilRecord.update", targetId: pupil }, orderBy: { createdAt: "desc" } });
    expect(logged.meta).toContain("guardianPhone");
    expect(logged.meta).not.toContain("9876543210");
    // The record's number signs nobody in: no account's phone moved.
    expect(await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true, phone: true, phoneVerifiedAt: true }, orderBy: { id: "asc" } })).toEqual(accountBefore);

    expect((await (await save("")).json()).record.guardianPhone).toBeNull();
  });

  it("the family asks for their own and the office approves it, and the UDISE+ sheet prints the guardian's proved number first and the record's when there is none", async () => {
    const { parentsForTest } = await import("@/lib/filings");
    // A number that is not one is refused when it is asked, not when the office comes to approve it.
    await as("PARENT");
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { guardianPhone: "12" }, reason: "ZZ test" }))).status).toBe(403);
    expect((await askAndApprove("PARENT", `?childId=${pupil}`, pupil, { guardianPhone: "+91 91234 56789" })).record.guardianPhone).toBe("+919123456789");

    const row = { user: { phone: null }, pupilRecord: { fatherName: null, motherName: null, guardianPhone: "+919123456789" } };
    expect(parentsForTest({ ...row, guardianships: [] }).phone).toBe("+919123456789");
    expect(parentsForTest({ ...row, guardianships: [{ relation: "PARENT", parent: { name: "P", phone: null, email: null } }] }).phone).toBe("+919123456789");
    expect(parentsForTest({ ...row, guardianships: [{ relation: "PARENT", parent: { name: "P", phone: "+919000000001", email: null } }] }).phone).toBe("+919000000001");
    expect(parentsForTest({ user: { phone: "+919000000002" }, pupilRecord: null, guardianships: [] }).phone).toBe("+919000000002");
  });
});

describe("⚠ names from a list: the mother tongue, the nationality, the PIN", () => {
  const save = (body: Record<string, string>) => recordPost(json(`/api/v1/office/pupil-records/${pupil}`, body), params({ membershipId: pupil }));
  const stored = () => db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil }, select: { motherTongue: true, nationality: true, postalCode: true } });

  it("a language and a nationality are kept as the list's code, however the name was typed; a word off the list is refused and nothing changes", async () => {
    await as("ADMIN");
    expect((await save({ motherTongue: " marathi ", nationality: "sri lankan", postalCode: "411 001" })).status).toBe(200);
    expect(await stored()).toEqual({ motherTongue: "MARATHI", nationality: "SRI_LANKAN", postalCode: "411001" });
    expect((await save({ motherTongue: "KONKANI", nationality: "INDIAN" })).status).toBe(200);
    expect(await stored()).toMatchObject({ motherTongue: "KONKANI", nationality: "INDIAN" });

    for (const [body, sentence] of [
      [{ motherTongue: "Marathi and Hindi" }, "Choose the mother tongue from the list."],
      [{ nationality: "Earthling" }, "Choose the nationality from the list."],
      [{ postalCode: "41100" }, "A PIN code is six digits and does not start with 0."],
      [{ postalCode: "011001" }, "A PIN code is six digits and does not start with 0."],
      [{ postalCode: "41100A" }, "A PIN code is six digits and does not start with 0."],
    ] as const) {
      const res = await save(body);
      expect(res.status, JSON.stringify(body)).toBe(403);
      expect((await res.json()).error).toBe(sentence);
    }
    expect(await stored()).toEqual({ motherTongue: "KONKANI", nationality: "INDIAN", postalCode: "411001" });
  });

  it("a word typed before the lists may be sent back untouched, so the rest of an old record can be saved; it is a blank to a filing until it is picked", async () => {
    await as("ADMIN");
    await db.pupilRecord.update({ where: { studentMembershipId: pupil }, data: { motherTongue: "Ahirani", nationality: "Bharat", postalCode: "4110" } });
    const res = await save({ motherTongue: "Ahirani", nationality: "Bharat", postalCode: "4110", fatherOccupation: "Weaver" });
    expect(res.status).toBe(200);
    const view = await res.json();
    expect(view.record).toMatchObject({ motherTongue: "Ahirani", nationality: "Bharat", postalCode: "4110", fatherOccupation: "Weaver" });
    expect(view.missingForFiling).toEqual(expect.arrayContaining(["motherTongue", "postalCode"]));
    // A different word off the list is still refused.
    expect((await save({ motherTongue: "Khandeshi" })).status).toBe(403);

    expect((await (await save({ motherTongue: "OTHER", nationality: "INDIAN", postalCode: "425001" })).json()).missingForFiling).not.toEqual(expect.arrayContaining(["motherTongue", "postalCode"]));
  });

  it("the sheets print the language's name and code the national from the code; a paper prints both in its own language", async () => {
    const { languageName, indianNational } = await import("@/lib/filings");
    const { dataFor, wordsFor } = await import("@/lib/certificate-rules");
    expect([languageName("MARATHI"), languageName("odia"), languageName("OTHER"), languageName("Ahirani"), languageName(null)]).toEqual(["Marathi", "Odia", "Other", "Ahirani", ""]);
    expect([indianNational("INDIAN"), indianNational("NEPALI"), indianNational("OTHER"), indianNational("Indian"), indianNational("भारतीय"), indianNational("British"), indianNational(""), indianNational(null)]).toEqual(["1", "2", "2", "1", "1", "2", "", ""]);

    const facts = { name: "ZZ Pupil", studentCode: null, birthdateKey: null, ageYears: null, record: { motherTongue: "MARATHI", nationality: "INDIAN" } } as unknown as Parameters<typeof dataFor>[0];
    const paper = (locale: "en" | "hi" | "mr") => {
      const d = dataFor({ ...facts, school: {}, stay: {}, issue: {} } as unknown as Parameters<typeof dataFor>[0], locale, wordsFor(locale));
      return [d["pupil.motherTongue"], d["pupil.nationality"]];
    };
    expect(paper("en")).toEqual(["Marathi", "Indian"]);
    expect(paper("hi")).toEqual(["मराठी", "भारतीय"]);
    expect(paper("mr")).toEqual(["मराठी", "भारतीय"]);
  });
});

describe("⚠ the answers the filing used to guess", () => {
  it("the office says whether the pupil came in under the RTE quota, repeats the class, and has no impairment; a family's ask about the enrolment's answer is refused", async () => {
    await as("ADMIN");
    const save = (body: Record<string, string>) => recordPost(json(`/api/v1/office/pupil-records/${pupil}`, body), params({ membershipId: pupil }));
    let view = await (await save({ rte: "yes", repeating: "yes", cwsnType: "NONE" })).json();
    expect(view.record).toMatchObject({ rte: "yes", repeating: "yes", cwsnType: "NONE" });
    expect(view.missingForFiling).not.toEqual(expect.arrayContaining(["rte", "cwsnType"]));
    expect((await db.enrollment.findFirstOrThrow({ where: { studentMembershipId: pupil, status: "ACTIVE" } })).repeating).toBe(true);
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil } })).rte).toBe(true);

    // "Repeating" is the enrolment's and not the record's: an ask naming it is refused whole. The rest waits for the office and changes nothing until it approves.
    await as("PARENT");
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { repeating: "no", motherOccupation: "Nurse" }, reason: "ZZ test" }))).status).toBe(422);
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { rte: "no", motherOccupation: "Nurse" }, reason: "ZZ test" }))).status).toBe(200);
    await as("ADMIN");
    view = await (await recordGet(get(`/api/v1/office/pupil-records/${pupil}`), params({ membershipId: pupil }))).json();
    expect(view.record).toMatchObject({ rte: "yes", repeating: "yes", cwsnType: "NONE" });
    expect(view.change.changes.map((c: { field: string }) => c.field).sort()).toEqual(["motherOccupation", "rte"]);
    await db.recordChangeRequest.deleteMany({ where: { studentMembershipId: pupil } });

    await as("ADMIN");
    // Taken back: a blank is "nobody has asked", and the filing waits for an answer.
    view = await (await save({ rte: "", repeating: "no", cwsnType: "" })).json();
    expect(view.record).toMatchObject({ rte: null, repeating: "no", cwsnType: null });
    expect(view.missingForFiling).toEqual(expect.arrayContaining(["rte", "cwsnType"]));
    expect((await save({ cwsnType: "none at all" })).status).toBe(422);
  });
});

describe("the record's new fields and coded choices", () => {
  it("the office saves the TC, the household, coded category and religion and the roll number; a family cannot ask for the roll number; an uncodable category counts as missing", async () => {
    await as("ADMIN");
    const body = { fatherName: "Rahul Rane", motherName: "Rina Rane", category: "VJ", religion: "OTHER", previousSchoolTcNumber: "TC/2025/0042", previousSchoolTcDate: "2025-04-30", fatherOccupation: "Farmer", motherOccupation: "Tailor", annualIncome: "240000", rollNumber: "7" };
    let res = await recordPost(json(`/api/v1/office/pupil-records/${pupil}`, body), params({ membershipId: pupil }));
    expect(res.status).toBe(200);
    const view = await res.json();
    expect(view.record).toMatchObject({ category: "VJ", religion: "OTHER", previousSchoolTcNumber: "TC/2025/0042", previousSchoolTcDate: "2025-04-30", fatherOccupation: "Farmer", motherOccupation: "Tailor", annualIncome: "240000", rollNumber: "7" });
    expect((await db.enrollment.findFirstOrThrow({ where: { studentMembershipId: pupil, status: "ACTIVE" }, select: { rollNumber: true } })).rollNumber).toBe(7);
    expect((await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil }, select: { annualIncome: true } })).annualIncome).toBe(240000);
    // A value off the list is refused at the door.
    expect((await recordPost(json(`/api/v1/office/pupil-records/${pupil}`, { category: "Maratha" }), params({ membershipId: pupil }))).status).toBe(422);
    // The roll number is not the family's to ask about; the rest of what they ask reaches the record when the office approves.
    await as("PARENT");
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { rollNumber: "9", motherOccupation: "Nurse" }, reason: "ZZ test" }))).status).toBe(422);
    expect((await askAndApprove("PARENT", `?childId=${pupil}`, pupil, { ...body, rollNumber: undefined as unknown as string, motherOccupation: "Nurse" })).record).toMatchObject({ rollNumber: "7", motherOccupation: "Nurse" });
    // A category typed before the codes still shows; one the sheet can code ("General") passes, one it cannot ("Maratha") counts as blank.
    await db.pupilRecord.update({ where: { studentMembershipId: pupil }, data: { category: "General" } });
    await as("ADMIN");
    expect((await (await recordGet(get(`/api/v1/office/pupil-records/${pupil}`), params({ membershipId: pupil }))).json()).missingForFiling).not.toContain("category");
    await db.pupilRecord.update({ where: { studentMembershipId: pupil }, data: { category: "Maratha" } });
    await as("ADMIN");
    res = await recordGet(get(`/api/v1/office/pupil-records/${pupil}`), params({ membershipId: pupil }));
    const again = await res.json();
    expect(again.record.category).toBe("Maratha");
    expect(again.missingForFiling).toContain("category");
    await db.pupilRecord.update({ where: { studentMembershipId: pupil }, data: { category: "VJ" } });
  });

  it("the UDISE+ student sheet codes VJ as OBC, Other as not-minority, a stranger religion as blank, and prints the roll number the school assigned", async () => {
    const ctx = ctxOf();
    let sheet = rowsOf((await udiseStudentsExport(ctx)).csv);
    let row = sheet.find((r) => r["Name of Student"] === "ZZ GAPS RIYA RANE")!;
    expect(row).toBeTruthy();
    expect(row["SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)"]).toBe("4");
    expect(row["MINORITY GROUP (Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7)"]).toBe("7");
    expect(row["Roll no"]).toBe("7");
    await db.pupilRecord.update({ where: { studentMembershipId: pupil }, data: { religion: "Xyz", category: "SC" } });
    sheet = rowsOf((await udiseStudentsExport(ctx)).csv);
    row = sheet.find((r) => r["Name of Student"] === "ZZ GAPS RIYA RANE")!;
    expect(row["MINORITY GROUP (Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7)"]).toBe("");
    expect(row["SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)"]).toBe("2");
    await db.pupilRecord.update({ where: { studentMembershipId: pupil }, data: { religion: "BUDDHIST", category: "VJ" } });
  });

  it("a certificate prints the coded category and religion as words in its language, and a value from before the codes as typed", () => {
    const record = { fatherName: "R", motherName: "R", placeOfBirth: null, nationality: null, religion: "HINDU", caste: null, category: "VJ", motherTongue: null, addressLine: null, city: null, postalCode: null, admissionNumber: null, admissionDateKey: null, admittedToGrade: null, previousSchool: null, penNumber: null };
    const facts = { name: "Riya", studentCode: "S", birthdateKey: null, ageYears: null, record, className: null, gradeLevel: null, school: { name: "S", code: "C", address: null }, yearName: null, leaving: null, issue: { dateKey: "2026-09-24", serial: "X/1", purpose: null, remark: null } };
    const mr = dataFor(facts as never, "mr");
    expect(mr["pupil.religion"]).toBe("हिंदू");
    expect(mr["pupil.category"]).toBe("VJ (विमुक्त जाती)");
    const legacy = dataFor({ ...facts, record: { ...record, religion: "Hindu", category: "Maratha" } } as never, "en");
    expect(legacy["pupil.religion"]).toBe("Hindu");
    expect(legacy["pupil.category"]).toBe("Maratha");
  });
});

describe("the staff record's two dates", () => {
  it("are saved, read back, refused in the future, and the DCF sheet prints the date of birth and the service start from them", async () => {
    const ctx = ctxOf();
    expect(await setStaffRecord(ctx, teacherMembershipId, { birthdateKey: "1985-03-09", serviceJoinedOnKey: "2008-06-15", joinedOnKey: "2019-06-10", designation: "Assistant teacher" })).toEqual({ ok: true });
    expect(await staffRecordFor(ctx, teacherMembershipId)).toMatchObject({ birthdateKey: "1985-03-09", serviceJoinedOnKey: "2008-06-15", joinedOnKey: "2019-06-10" });
    expect(await setStaffRecord(ctx, teacherMembershipId, { serviceJoinedOnKey: "2099-01-01" })).toMatchObject({ ok: false, errorKey: "staff.joinedInFuture" });
    const sheet = rowsOf((await udiseTeachersExport(ctx)).csv);
    const row = sheet.find((r) => r["3.2.1 Name of the Teacher"] === "ZZ GAPS TEACHER")!;
    expect(row, JSON.stringify(sheet.map((r) => r["3.2.1 Name of the Teacher"]))).toBeTruthy();
    expect(row["3.2.3 Date of Birth (DD/MM/YYYY)"]).toBe("09/03/1985");
    expect(row["3.2.14 Date of Joining in Service (DD/MM/YYYY)"]).toBe("15/06/2008");
    expect(row["3.2.15 Date of Joining in Present School (DD/MM/YYYY)"]).toBe("10/06/2019");
  });

  it("a coded answer off the list is refused, not stored as null; NT is on the staff list and codes 4 on the DCF sheet", async () => {
    const ctx = ctxOf();
    expect(await setStaffRecord(ctx, teacherMembershipId, { socialCategory: "XYZ", gender: "M" })).toEqual({ ok: false, errorKey: "staff.badCode" });
    expect(await setStaffRecord(ctx, teacherMembershipId, { gender: "Q" })).toEqual({ ok: false, errorKey: "staff.badCode" });
    expect(await setStaffRecord(ctx, teacherMembershipId, { appointmentType: "GUEST" })).toEqual({ ok: false, errorKey: "staff.badCode" });
    // The subject appointed for is a name from the filing's own list, and the sheet prints its number.
    expect(await setStaffRecord(ctx, teacherMembershipId, { appointedSubject: "Maths" })).toEqual({ ok: false, errorKey: "staff.badCode" });
    expect((await setStaffRecord(ctx, teacherMembershipId, { designation: "Senior teacher", appointedSubject: "MATHEMATICS" })).ok).toBe(true);
    expect((await db.staffRecord.findUniqueOrThrow({ where: { membershipId: teacherMembershipId } })).appointedSubject).toBe("MATHEMATICS");
    const { APPOINTED_SUBJECT_CODE } = await import("@/lib/filings");
    const { STAFF_APPOINTED_SUBJECTS } = await import("@edulink/contracts");
    expect(Object.keys(APPOINTED_SUBJECT_CODE).sort()).toEqual([...STAFF_APPOINTED_SUBJECTS].sort());
    expect([APPOINTED_SUBJECT_CODE.MATHEMATICS, APPOINTED_SUBJECT_CODE.ENGLISH, APPOINTED_SUBJECT_CODE.PHYSICAL_EDUCATION]).toEqual(["3", "46", "92"]);
    expect(new Set(Object.values(APPOINTED_SUBJECT_CODE)).size).toBe(STAFF_APPOINTED_SUBJECTS.length);
    expect((await staffRecordFor(ctx, teacherMembershipId))?.gender).toBeNull();
    expect(await setStaffRecord(ctx, teacherMembershipId, { socialCategory: "nt", gender: "M" })).toEqual({ ok: true });
    expect(await staffRecordFor(ctx, teacherMembershipId)).toMatchObject({ socialCategory: "NT", gender: "M" });
    const sheet = rowsOf((await udiseTeachersExport(ctx)).csv);
    expect(sheet.find((r) => r["3.2.1 Name of the Teacher"] === "ZZ GAPS TEACHER")!["3.2.5 Social Category (General-1, SC-2, ST-3, OBC-4)"]).toBe("4");
    expect(await setStaffRecord(ctx, teacherMembershipId, { socialCategory: "" })).toEqual({ ok: true });
    expect((await staffRecordFor(ctx, teacherMembershipId))?.socialCategory).toBeNull();
  });
});

describe("the grade level follows the class", () => {
  it("the sheet's plain answers: the office saves a second number, the free uniform and textbooks, extracurricular activity, the stream and the vocational course, and the sheet prints them; the family may ask for them", async () => {
    await as("ADMIN");
    const save = (body: Record<string, string>) => recordPost(json(`/api/v1/office/pupil-records/${pupil}`, body), params({ membershipId: pupil }));
    expect((await save({ alternatePhone: "12" })).status).toBe(403);
    expect((await save({ stream: "9" })).status).toBe(422);
    expect((await save({ vocationalTradeId: "not an id!" })).status).toBe(422);
    const view = await (await save({ alternatePhone: "+91 98765 00000", freeUniform: "yes", freeTextbook: "no", extracurricular: "yes", stream: "2", vocationalCourse: "yes", vocationalTradeId: "SEC-12", vocationalJobRoleId: "JR-7", vocationalExamAppeared: "no" })).json();
    expect(view.record).toMatchObject({ alternatePhone: "+919876500000", freeUniform: "yes", freeTextbook: "no", extracurricular: "yes", stream: "2", vocationalCourse: "yes", vocationalTradeId: "SEC-12", vocationalJobRoleId: "JR-7", vocationalExamAppeared: "no" });
    const ctx = (await getSession())!;
    const row = rowsOf((await udiseStudentsExport(ctx)).csv).find((r) => r["Name of Student"] === "ZZ GAPS RIYA RANE")!;
    // A leading plus is quoted on the sheet so a spreadsheet does not read a formula, as the first number is.
    expect(row["ALTERNATE MOBILE NUMBER (Optional)"]).toBe("'+919876500000");
    expect(row["Free Uniform (Yes-1, No-2)"]).toBe("1");
    expect(row["Free TextBook (Yes-1, No-2)"]).toBe("2");
    expect(row["Extracurricular (Yes-1, No-2)"]).toBe("1");
    expect(row["STUDENT STREAM (HS only)"]).toBe("2");
    expect(row["Vocational course (Yes-1, No-2)"]).toBe("1");
    expect(row["Trade/Sector ID"]).toBe("SEC-12");
    expect(row["Job Role ID"]).toBe("JR-7");
    expect(row["Appeared for vocational exam"]).toBe("2");
    // What the sheet still leaves for the office: nothing of these reached it.
    expect(row["Aadhaar No of Child"]).toBe("");
    expect(row["Whether AAY beneficiary"]).toBe("");
    expect(row["Central scholarship (Yes-1, No-2)"]).toBe("");
    // A family may ask for these as for any field; a blank clears.
    await as("PARENT");
    expect((await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { freeUniform: "", extracurricular: "no" }, reason: "ZZ test" }))).status).toBe(200);
    await db.recordChangeRequest.deleteMany({ where: { studentMembershipId: pupil } });
    await as("ADMIN");
    expect((await (await save({ alternatePhone: "", freeUniform: "", freeTextbook: "", extracurricular: "", stream: "", vocationalCourse: "", vocationalTradeId: "", vocationalJobRoleId: "", vocationalExamAppeared: "" })).json()).record).toMatchObject({ alternatePhone: null, freeUniform: null, stream: null, vocationalTradeId: null });
  });

  it("is set when a pupil is enrolled, moves with a change of class, and clears when they leave the roll", async () => {
    const ctx = ctxOf();
    const grade = async () => (await db.membership.findUniqueOrThrow({ where: { id: pupil }, select: { gradeLevel: true } })).gradeLevel;
    await db.membership.update({ where: { id: pupil }, data: { gradeLevel: null } });
    await removeFromCohort(ctx, classId, pupil);
    expect(await grade()).toBeNull();
    await enrolStudents(ctx, otherClassId, [pupil]);
    expect(await grade()).toBe("7");
    await removeFromCohort(ctx, otherClassId, pupil);
    await enrolStudents(ctx, classId, [pupil]);
    expect(await grade()).toBe("6");
  });
});

describe("a pupil back on the roll", () => {
  it("loses the departure record and the scheduled leaving when intake brings them back", async () => {
    // The pupil leaves: a departure record and a scheduled leaving stand behind them.
    await db.enrollment.updateMany({ where: { studentMembershipId: pupil, status: "ACTIVE" }, data: { status: "REMOVED", removedAt: new Date() } });
    await db.membership.update({ where: { id: pupil }, data: { leftAt: new Date("2026-04-30T00:00:00Z") } });
    await db.schoolRecord.create({ data: { schoolId, studentUserId: pupilUserId, studentMembershipId: pupil, schoolName: "ZZ Gaps School", joinedAt: new Date("2020-06-01T00:00:00Z"), leftAt: new Date("2026-04-30T00:00:00Z"), reason: "TRANSFER", attendanceMarked: 0, attendancePresent: 0, reportCardCount: 0 } });
    await db.scheduledDeparture.create({ data: { schoolId, membershipId: pupil, leaveOnKey: "2026-04-30", reason: "TRANSFER" } });
    const row = { line: 1, name: "ZZ Gaps Riya Rane", birthdateKey: "2014-05-20", className: "ZZ 7A", pupilEmail: null, guardianEmail: null, guardianName: null, relation: "PARENT" as const, studentCode: `ZGA${STAMP}` };
    const result = await admitPupils(ctxOf(), [row as never]);
    expect(result.outcomes[0]?.status, JSON.stringify(result.outcomes[0])).toBe("admitted");
    expect(await db.schoolRecord.count({ where: { studentMembershipId: pupil } })).toBe(0);
    expect(await db.scheduledDeparture.count({ where: { membershipId: pupil } })).toBe(0);
    expect((await db.membership.findUniqueOrThrow({ where: { id: pupil }, select: { leftAt: true, gradeLevel: true } })).leftAt).toBeNull();
  });
});
