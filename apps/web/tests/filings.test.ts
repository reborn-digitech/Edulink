/**
 * Filings through their handlers: the school's identity set and read back,
 * the readiness counting what is blank, the UDISE+ student sheet in the
 * portal's fifty-four columns and codes with Aadhaar blank, the enrolment
 * tables by class and gender, the teacher profile in the DCF's order, the
 * two board sheets with subject codes, every cut audited as the sensitive
 * compliance export and refused to a teacher and (the sheets) to the head.
 * And the audit's filing gaps: "was here last year" from the admission date
 * and the academic year, attended DAYS not marks, grade 1's previous class
 * PP3, VJ/NT/SBC under OBC with the class columns summing to Total, the
 * medium matched inside a phrase, the classes-taught code for a span the
 * DCF does not list, a subject code in 3.2.18, CBSE's two mathematics, and
 * readiness that needs a birthdate, both parents and a coded class.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { parseCsvRecords } from "@/lib/csv";
import { GET as filingsGet } from "@/app/api/v1/office/filings/route";
import { POST as identityPost } from "@/app/api/v1/office/filings/identity/route";
import { GET as studentsGet } from "@/app/api/v1/office/filings/export/udise-students/route";
import { GET as enrolmentGet } from "@/app/api/v1/office/filings/export/udise-enrolment/route";
import { GET as teachersGet } from "@/app/api/v1/office/filings/export/udise-teachers/route";
import { GET as cbseGet } from "@/app/api/v1/office/filings/export/cbse-candidates/route";
import { GET as msbshseGet } from "@/app/api/v1/office/filings/export/msbshse-candidates/route";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { GET as download } from "@/app/(app)/admin/filings/export/[kind]/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let teacherMembershipId = "";
let pupilA = "";
let pupilB = "";
let pupilC = "";
let pupilD = "";
let classId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
}
const rowsOf = (csv: string) => {
  const { records } = parseCsvRecords(csv);
  const [headers = [], ...rows] = records;
  return { headers, rows: rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))) };
};

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Filing School ${STAMP}`, slug: `zz-filing-${STAMP}`, code: `ZF${suffix}`, contactEmail: `zz-filing-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "Pune", region: "Maharashtra", postalCode: "411005", locale: "mr", medium: "Marathi" }, select: { id: true } })).id;
  const mk = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Filing ${who}`, email: `zz-filing-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [admin, principal, teacher, a, b, parent] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher", { birthdate: new Date("1988-04-02T00:00:00Z"), phone: `+91 98765 ${suffix.slice(0, 5)}` }), mk("Aarav Patil", { birthdate: new Date("2010-03-10T00:00:00Z") }), mk("Bhakti Bhosale", { birthdate: new Date("2010-11-21T00:00:00Z") }), mk("Parent", { phone: "+91 98764 00011" })]);
  // C: admitted this June, no date of birth, NT, in a class whose grade is no UDISE+ class. D: in grade 1 since 2024.
  const [c, d, teacherTwo] = await Promise.all([mk("Chaitra Kamble"), mk("Dev Jadhav", { birthdate: new Date("2019-07-01T00:00:00Z") }), mk("Teacher Two", { birthdate: new Date("1990-01-15T00:00:00Z") })]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  teacherMembershipId = (await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE", subjects: JSON.stringify(["Mathematics", "Science"]) }, select: { id: true } })).id;
  pupilA = (await db.membership.create({ data: { userId: a.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFA${STAMP}`, joinedAt: new Date("2024-06-10T00:00:00Z") }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: b.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFB${STAMP}` }, select: { id: true } })).id;
  pupilC = (await db.membership.create({ data: { userId: c.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFC${STAMP}`, joinedAt: new Date("2026-06-15T00:00:00Z") }, select: { id: true } })).id;
  pupilD = (await db.membership.create({ data: { userId: d.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFD${STAMP}`, joinedAt: new Date("2024-06-10T00:00:00Z") }, select: { id: true } })).id;
  const teacherTwoMembershipId = (await db.membership.create({ data: { userId: teacherTwo.id, schoolId, role: "TEACHER", status: "ACTIVE", subjects: JSON.stringify(["Physics"]) }, select: { id: true } })).id;
  await db.academicYear.createMany({ data: [{ schoolId, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false }, { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }] });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pupilA, studentSchoolId: schoolId, status: "ACTIVE", relation: "GUARDIAN" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ 10A", gradeLevel: "10", section: "A", joinCode: `ZF1${suffix}` }, select: { id: true } })).id;
  const diplomaClassId = (await db.class.create({ data: { schoolId, name: "ZZ Diploma", gradeLevel: "Diploma", section: "A", joinCode: `ZF2${suffix}` }, select: { id: true } })).id;
  const grade1ClassId = (await db.class.create({ data: { schoolId, name: "ZZ 1A", gradeLevel: "1", section: "A", joinCode: `ZF3${suffix}` }, select: { id: true } })).id;
  const grade3ClassId = (await db.class.create({ data: { schoolId, name: "ZZ 3A", gradeLevel: "3", section: "A", joinCode: `ZF4${suffix}` }, select: { id: true } })).id;
  const grade9ClassId = (await db.class.create({ data: { schoolId, name: "ZZ 9A", gradeLevel: "9", section: "A", joinCode: `ZF5${suffix}` }, select: { id: true } })).id;
  const archivedClassId = (await db.class.create({ data: { schoolId, name: "ZZ 12A", gradeLevel: "12", section: "A", joinCode: `ZF6${suffix}`, archivedAt: new Date("2026-05-01T00:00:00Z") }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [{ schoolId, classId, studentMembershipId: pupilA, status: "ACTIVE" }, { schoolId, classId, studentMembershipId: pupilB, status: "ACTIVE" }, { schoolId, classId: diplomaClassId, studentMembershipId: pupilC, status: "ACTIVE" }, { schoolId, classId: grade1ClassId, studentMembershipId: pupilD, status: "ACTIVE" }] });
  await db.classTeacher.createMany({ data: [{ schoolId, classId, teacherMembershipId, role: "LEAD" }, { schoolId, classId: grade3ClassId, teacherMembershipId: teacherTwoMembershipId, role: "LEAD" }, { schoolId, classId: archivedClassId, teacherMembershipId: teacherTwoMembershipId, role: "LEAD" }] });
  const period = await db.timetablePeriod.create({ data: { schoolId, name: "P1", position: 1, startMinute: 540, endMinute: 585 }, select: { id: true } });
  const period2 = await db.timetablePeriod.create({ data: { schoolId, name: "P2", position: 2, startMinute: 585, endMinute: 630 }, select: { id: true } });
  await db.timetableSlot.createMany({ data: [{ schoolId, classId, periodId: period.id, weekday: 1, subject: "Mathematics", teacherMembershipId }, { schoolId, classId, periodId: period.id, weekday: 2, subject: "Marathi", teacherMembershipId }, { schoolId, classId, periodId: period.id, weekday: 3, subject: "English", teacherMembershipId }, { schoolId, classId, periodId: period.id, weekday: 4, subject: "Science", teacherMembershipId }, { schoolId, classId, periodId: period.id, weekday: 5, subject: "Social Science", teacherMembershipId },
    // Two more spellings of one CBSE paper, and the Basic paper: the sheet must code 041 once and 241 once.
    { schoolId, classId, periodId: period2.id, weekday: 1, subject: "Maths", teacherMembershipId }, { schoolId, classId, periodId: period2.id, weekday: 2, subject: "Basic Mathematics", teacherMembershipId },
    { schoolId, classId: grade9ClassId, periodId: period.id, weekday: 1, subject: "Physics", teacherMembershipId: teacherTwoMembershipId }] });
  // Last year's registers for Aarav: two registers on the 4th (one day), LATE on the 5th, ABSENT on the 6th; and one this year, outside the window.
  const session = (dateKey: string, cls = classId) => db.attendanceSession.create({ data: { schoolId, classId: cls, dateKey }, select: { id: true } });
  const [s4a, s4b, s5, s6, sNow] = await Promise.all([session("2025-08-04"), session("2025-08-04", diplomaClassId), session("2025-08-05"), session("2025-08-06"), session("2026-06-10")]);
  await db.attendanceRecord.createMany({ data: [{ schoolId, sessionId: s4a.id, studentMembershipId: pupilA, status: "PRESENT" }, { schoolId, sessionId: s4b.id, studentMembershipId: pupilA, status: "PRESENT" }, { schoolId, sessionId: s5.id, studentMembershipId: pupilA, status: "LATE" }, { schoolId, sessionId: s6.id, studentMembershipId: pupilA, status: "ABSENT" }, { schoolId, sessionId: sNow.id, studentMembershipId: pupilA, status: "PRESENT" }] });
  await db.pupilRecord.createMany({ data: [
    { schoolId, studentMembershipId: pupilC, fatherName: "Kiran Kamble", motherName: "Asha Kamble", nationality: "Indian", religion: "BUDDHIST", category: "NT", motherTongue: "Marathi", addressLine: "9 Station Road", city: "Pune", postalCode: "411002", admissionNumber: "GR-1003", admissionDate: new Date("2026-06-15T00:00:00Z"), gender: "F", bpl: false, ews: false, rte: false, cwsnType: "NONE" },
    { schoolId, studentMembershipId: pupilD, fatherName: "Sunil Jadhav", motherName: "Mina Jadhav", nationality: "Indian", religion: "HINDU", category: "GENERAL", motherTongue: "Marathi", addressLine: "2 Mill Lane", city: "Pune", postalCode: "411003", admissionNumber: "GR-1004", admissionDate: new Date("2024-06-10T00:00:00Z"), gender: "M", bpl: false, ews: false, rte: false, cwsnType: "NONE" },
  ] });
  await db.staffRecord.create({ data: { schoolId, membershipId: teacherTwoMembershipId, designation: "PGT", gender: "M", socialCategory: "NT", academicQualification: "6", professionalQualification: "4", appointmentType: "CONTRACT", serviceJoinedOn: new Date("2015-06-08T00:00:00Z"), joinedOn: new Date("2020-06-01T00:00:00Z") } });
  await db.pupilRecord.create({ data: { schoolId, studentMembershipId: pupilA, fatherName: "Rohan Patil", motherName: "Sneha Patil", nationality: "Indian", religion: "Hindu", category: "OBC", motherTongue: "Marathi", addressLine: "14 Shivaji Nagar", city: "Pune", postalCode: "411005", admissionNumber: "GR-1001", admissionDate: new Date("2024-06-10T00:00:00Z"), penNumber: "12345678901", gender: "M", bpl: false, ews: true, rte: false, cwsnType: "NONE", nameLocal: "आरव रोहन पाटील", fatherNameLocal: "रोहन पाटील", motherNameLocal: "स्नेहा पाटील" } });
  await db.staffRecord.create({ data: { schoolId, membershipId: teacherMembershipId, designation: "TGT Mathematics", qualification: "M.Sc", gender: "F", socialCategory: "GENERAL", academicQualification: "5", professionalQualification: "3", serviceJoinedOn: new Date("2012-06-11T00:00:00Z"), appointmentType: "REGULAR", joinedOn: new Date("2016-06-01T00:00:00Z") } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the identity and the readiness", () => {
  it("401 signed out and a teacher refused; the head reads, only the admin writes; blanks named; a bad UDISE code 422", async () => {
    await as(null);
    expect((await filingsGet()).status).toBe(401);
    await as("TEACHER");
    expect((await filingsGet()).status).toBe(403);
    await as("PRINCIPAL");
    let res = await filingsGet();
    expect(res.status).toBe(200);
    let view = await res.json();
    expect(view.identity).toMatchObject({ udiseCode: null, board: null, medium: "Marathi", state: "Maharashtra", city: "Pune" });
    expect(view.identityMissing).toEqual(["udiseCode", "board", "affiliationNumber", "district", "block", "managementType"]);
    // Bhakti has no record (and so no parents); Chaitra has no date of birth and no class the portal knows; Aarav and Dev are ready.
    expect(view.pupils).toEqual({ total: 4, ready: 2, missing: { gender: 1, category: 1, motherTongue: 1, bpl: 1, ews: 1, rte: 1, cwsnType: 1, admissionNumber: 1, admissionDate: 1, addressLine: 1, postalCode: 1, parents: 1, birthdate: 1, classCode: 1 }, withoutLocalName: 3 });
    expect(view.staff).toEqual({ total: 3, ready: 2, missing: { gender: 1, socialCategory: 1, academicQualification: 1, professionalQualification: 1, appointmentType: 1, joinedOn: 1, serviceJoinedOn: 1 } });
    // Every live class's grade, the archived grade-12 class left out; the two grades with no pupils are the second teacher's.
    expect(view.grades).toEqual([{ gradeLevel: "1", pupils: 1 }, { gradeLevel: "3", pupils: 0 }, { gradeLevel: "9", pupils: 0 }, { gradeLevel: "10", pupils: 2 }, { gradeLevel: "Diploma", pupils: 1 }]);
    expect((await identityPost(json("/api/v1/office/filings/identity", { udiseCode: "27250100101" }))).status).toBe(403);
    await as("ADMIN");
    expect((await identityPost(json("/api/v1/office/filings/identity", { udiseCode: "2725" }))).status).toBe(422);
    res = await identityPost(json("/api/v1/office/filings/identity", { udiseCode: "27250100101", board: "MSBSHSE", affiliationNumber: "25.01.001", district: "Pune", block: "Haveli", managementType: "PRIVATE_UNAIDED" }));
    expect(res.status).toBe(200);
    view = await res.json();
    expect(view.identity).toMatchObject({ udiseCode: "27250100101", board: "MSBSHSE", affiliationNumber: "25.01.001", district: "Pune", block: "Haveli", medium: "Marathi", managementType: "PRIVATE_UNAIDED" });
    expect(view.identityMissing).toEqual([]);
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "school.filings.set" } });
    expect(JSON.parse(audit!.meta).fields).toEqual(["udiseCode", "board", "affiliationNumber", "district", "block", "managementType"]);
    expect(audit!.meta).not.toContain("27250100101");
  });

  it("the record form carries the filing fields; the office view names what the filing still lacks", async () => {
    await as("ADMIN");
    let res = await recordPost(json(`/api/v1/office/pupil-records/${pupilB}`, { gender: "F", category: "SC", motherTongue: "Marathi", bpl: "yes", ews: "no", rte: "no", cwsnType: "2", bloodGroup: "O+", addressLine: "3 Lake Road", postalCode: "411001", admissionNumber: "GR-1002", admissionDate: "2024-06-12" }), params({ membershipId: pupilB }));
    expect(res.status).toBe(200);
    let view = await res.json();
    expect(view.record).toMatchObject({ gender: "F", category: "SC", bpl: "yes", ews: "no", cwsnType: "2", bloodGroup: "O+" });
    expect(view.missingForFiling).toEqual([]);
    expect(view.missing).toContain("fatherName");
    res = await recordPost(json(`/api/v1/office/pupil-records/${pupilB}`, { bpl: "", cwsnType: "" }), params({ membershipId: pupilB }));
    view = await res.json();
    expect(view.record).toMatchObject({ bpl: null, cwsnType: null, gender: "F" });
    // A blank impairment is "nobody has asked", and the record waits for an answer as it does for the card.
    expect(view.missingForFiling).toEqual(["bpl", "cwsnType"]);
    expect((await recordPost(json(`/api/v1/office/pupil-records/${pupilB}`, { gender: "X" }), params({ membershipId: pupilB }))).status).toBe(422);
    await recordPost(json(`/api/v1/office/pupil-records/${pupilB}`, { bpl: "yes", cwsnType: "2" }), params({ membershipId: pupilB }));
    res = await recordGet(get(`/api/v1/office/pupil-records/${pupilB}`), params({ membershipId: pupilB }));
    expect((await res.json()).missingForFiling).toEqual([]);
    // The record's own list is done, yet the sheet still wants both parents' names: not ready until they are on the record.
    let view2 = await (await filingsGet()).json();
    expect(view2.pupils.ready).toBe(2);
    expect(view2.pupils.missing).toEqual({ parents: 1, birthdate: 1, classCode: 1 });
    await recordPost(json(`/api/v1/office/pupil-records/${pupilB}`, { fatherName: "Baban Bhosale", motherName: "Lata Bhosale" }), params({ membershipId: pupilB }));
    view2 = await (await filingsGet()).json();
    expect(view2.pupils.ready).toBe(3);
    expect(view2.pupils.missing).toEqual({ birthdate: 1, classCode: 1 });
  });
});

describe("the sheets", () => {
  it("the UDISE+ student sheet: the portal's columns in order and its codes, Aadhaar blank, dates DD-MM-YYYY, names in capitals, the guardian's phone; refused to the head and a teacher; audited with a count", async () => {
    await as("PRINCIPAL");
    expect((await studentsGet()).status).toBe(403);
    await as("TEACHER");
    expect((await studentsGet()).status).toBe(403);
    await as("ADMIN");
    const res = await studentsGet();
    expect(res.status).toBe(200);
    const file = await res.json();
    expect(file.rows).toBe(4);
    expect(file.filename).toMatch(/^udise-students-27250100101-\d{4}-\d{2}-\d{2}\.csv$/);
    const { headers, rows } = rowsOf(file.csv);
    expect(headers).toHaveLength(54);
    expect(headers.slice(0, 6)).toEqual(["Grade/Class", "SECTION", "Roll no", "Name of Student", "GENDER", "DOB (DD-MM-YYYY)"]);
    expect(headers[9]).toBe("Aadhaar No of Child");
    expect(headers[27]).toBe("Admission Number");
    expect(headers[53]).toBe("Appeared for vocational exam");
    const aarav = rows.find((r) => r["Name of Student"] === `ZZ FILING AARAV PATIL`)!;
    expect(aarav).toMatchObject({ "Grade/Class": "10", SECTION: "A", "Roll no": "1", GENDER: "1", "DOB (DD-MM-YYYY)": "10-03-2010", "MOTHER NAME": "SNEHA PATIL", "FATHER NAME": "ROHAN PATIL", "GUARDIAN NAME (Optional)": "ZZ FILING PARENT", "Aadhaar No of Child": "", "STUDENT NAME AS PER AADHAR": "", "PRESENT ADDRESS": "14 Shivaji Nagar, Pune", PINCODE: "411005", "MOBILE NUMBER": "9876400011", "MOTHER TONGUE": "Marathi", "SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)": "4", "Is BPL BENEFICIARY (Yes-1, No-2)": "2", "BELONGS TO EWS/DISADVANTAGED GROUP (Yes-1, No-2)": "1", "IS CWSN (Yes-1, No-2)": "2", "CWSN IMPAIRMENT TYPE": "", "CHILD IS INDIAN NATIONAL (Yes-1, No-2)": "1", "Admission Number": "GR-1001", "ADMISSION DATE (DD-MM-YYYY)": "10-06-2024", "PREVIOUS ACADEMIC YEAR SCHOOLING STATUS": "1", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "9", "ADMITTED/ENROLLED UNDER RTE/EWS": "2", "CLASS ATTENDED DAYS (Previous Year)": "2" });
    expect(aarav["MINORITY GROUP (Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7)"]).toBe("7");
    const bhakti = rows.find((r) => r["Name of Student"] === `ZZ FILING BHAKTI BHOSALE`)!;
    expect(bhakti).toMatchObject({ "Roll no": "2", GENDER: "2", "SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)": "2", "IS CWSN (Yes-1, No-2)": "1", "CWSN IMPAIRMENT TYPE": "2", "Is BPL BENEFICIARY (Yes-1, No-2)": "1", "MOTHER NAME": "LATA BHOSALE", "MOBILE NUMBER": "", "PREVIOUS ACADEMIC YEAR SCHOOLING STATUS": "1", "CLASS ATTENDED DAYS (Previous Year)": "" });
    // Admitted this June, in the school's first year on the app: a new admission, no previous class. Grade 1 since 2024: the previous class is the portal's PP3.
    const chaitra = rows.find((r) => r["Name of Student"] === "ZZ FILING CHAITRA KAMBLE")!;
    expect(chaitra).toMatchObject({ "Grade/Class": "DIPLOMA", "DOB (DD-MM-YYYY)": "", "SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)": "4", "MINORITY GROUP (Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7)": "4", "ADMISSION DATE (DD-MM-YYYY)": "15-06-2026", "PREVIOUS ACADEMIC YEAR SCHOOLING STATUS": "2", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "", "APPEARED FOR EXAM IN PREVIOUS CLASS": "" });
    const dev = rows.find((r) => r["Name of Student"] === "ZZ FILING DEV JADHAV")!;
    expect(dev).toMatchObject({ "Grade/Class": "1", "PREVIOUS ACADEMIC YEAR SCHOOLING STATUS": "1", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "PP3" });
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "compliance.export" }, orderBy: { createdAt: "desc" } });
    expect(JSON.parse(audit!.meta)).toEqual({ kind: "udise-students", rows: 4, udise: true });

    // ⚠ WHAT THE SHEET USED TO GUESS. Aarav was asked and has no impairment; he is not an RTE admission, and his family is EWS.
    const RTE = "ADMITTED/ENROLLED UNDER RTE/EWS";
    expect(aarav).toMatchObject({ "IS CWSN (Yes-1, No-2)": "2", "CWSN IMPAIRMENT TYPE": "", [RTE]: "2", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "9" });
    const was = await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupilA }, select: { cwsnType: true, rte: true, ews: true } });
    const klass = await db.class.findFirstOrThrow({ where: { enrollments: { some: { studentMembershipId: pupilA, status: "ACTIVE" } }, gradeLevel: "10" }, select: { id: true, section: true } });
    try {
      // Nobody has asked about an impairment or the quota, the class has no section, and he is repeating the year.
      await db.pupilRecord.update({ where: { studentMembershipId: pupilA }, data: { cwsnType: null, rte: null, ews: false } });
      await db.class.update({ where: { id: klass.id }, data: { section: null } });
      await db.enrollment.updateMany({ where: { studentMembershipId: pupilA, classId: klass.id }, data: { repeating: true } });
      let again = rowsOf((await (await studentsGet()).json()).csv).rows.find((r) => r["Name of Student"] === "ZZ FILING AARAV PATIL")!;
      expect(again).toMatchObject({ SECTION: "", "IS CWSN (Yes-1, No-2)": "", "CWSN IMPAIRMENT TYPE": "", [RTE]: "", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "10", "RESULT FOR PREVIOUS EXAM": "" });
      // The office says he came in under the quota, and that neither applies to nobody.
      await db.pupilRecord.update({ where: { studentMembershipId: pupilA }, data: { rte: true } });
      again = rowsOf((await (await studentsGet()).json()).csv).rows.find((r) => r["Name of Student"] === "ZZ FILING AARAV PATIL")!;
      expect(again[RTE]).toBe("1");
      await db.pupilRecord.update({ where: { studentMembershipId: pupilA }, data: { rte: false } });
      again = rowsOf((await (await studentsGet()).json()).csv).rows.find((r) => r["Name of Student"] === "ZZ FILING AARAV PATIL")!;
      expect(again[RTE]).toBe("0");
    } finally {
      await db.pupilRecord.update({ where: { studentMembershipId: pupilA }, data: was });
      await db.class.update({ where: { id: klass.id }, data: { section: klass.section } });
      await db.enrollment.updateMany({ where: { studentMembershipId: pupilA, classId: klass.id }, data: { repeating: false } });
    }
    expect(audit!.meta).not.toContain("Aarav");
  });

  it("the enrolment tables count boys and girls per class by category, minority, age and impairment, naming nobody; NT lands in the OBC row; an unlisted grade has a column, so the classes sum to Total", async () => {
    await as("ADMIN");
    const { rows, headers } = rowsOf((await (await enrolmentGet()).json()).csv);
    expect(headers.slice(0, 2)).toEqual(["table", "row"]);
    expect(headers).toContain("X Boys");
    expect(headers).toContain("Pre-Primary Girls");
    expect(headers).toContain("Not in a listed class Girls");
    const category = rows.filter((r) => r.table === "4.2 Enrolment by social category");
    expect(category.map((r) => [r.row, r["X Boys"], r["X Girls"], r["I Boys"], r["Not in a listed class Girls"], r["Total Boys"], r["Total Girls"]])).toEqual([["GENERAL", "0", "0", "1", "0", "1", "0"], ["OBC", "1", "0", "0", "1", "1", "1"], ["SC", "0", "1", "0", "0", "0", "1"], ["Total", "1", "1", "1", "1", "2", "2"]]);
    expect(category.map((r) => r.row)).not.toContain("NT");
    const classColumns = headers.filter((h) => /^(Pre-Primary|[IVX]+|Not in a listed class) (Boys|Girls|No gender on record)$/.test(h));
    expect(classColumns).toHaveLength(14 * 3);
    for (const r of rows) {
      const sum = classColumns.reduce((n, h) => n + Number(r[h]), 0);
      expect(sum, `${r.table} / ${r.row}`).toBe(Number(r["Total Boys"]) + Number(r["Total Girls"]) + Number(r["Total No gender on record"]));
    }
    expect(rows.filter((r) => r.table === "4.2(b) Minority groups").map((r) => [r.row, r["Not in a listed class Girls"]])).toEqual([["BUDDHIST", "1"]]);
    const ages = rows.filter((r) => r.table === "4.4 Enrolment by age").map((r) => r.row);
    expect(ages).toHaveLength(4);
    expect(ages).toEqual(expect.arrayContaining(["7", "15", "16", "Age not on record"]));
    expect(rows.filter((r) => r.table === "4.6 CWSN by impairment").map((r) => [r.row, r["X Girls"]])).toEqual([["2 Low vision", "1"]]);
    expect(JSON.stringify(rows)).not.toContain("Aarav");
  });

  it("the teacher profile: the DCF's fields in order and its codes, the head as type 6, subjects coded from the timetable, classes-taught from the grades; 3.2.18 a subject code, never a title; a span the DCF does not list files its lowest band; an archived class does not count; NT codes 4", async () => {
    await as("ADMIN");
    const file = await (await teachersGet()).json();
    const { headers, rows } = rowsOf(file.csv);
    expect(headers.slice(0, 4)).toEqual(["UDISE Code of School", "Teacher National Code", "3.2.1 Name of the Teacher", "3.2.2 Gender (Male-1, Female-2, Transgender-3)"]);
    expect(rows).toHaveLength(3);
    const two = rows.find((r) => r["3.2.1 Name of the Teacher"] === "ZZ FILING TEACHER TWO")!;
    // "PGT" names no subject, so the subject they say they teach is coded; grades 3 and 9 have no DCF code of their own, so primary (1), not "primary and upper primary"; the archived grade-12 class is not on the timetable.
    expect(two).toMatchObject({ "3.2.5 Social Category (General-1, SC-2, ST-3, OBC-4)": "4", "3.2.12 Nature of Appointment (Regular-1, Contract-2, Part-Time-3)": "2", "3.2.16 Classes Taught": "1", "3.2.18 Appointed for Subject": "22", "3.2.19(a) Main Subject Taught 1": "22", "Classes on the timetable": "3 9" });
    const teacher = rows.find((r) => r["3.2.1 Name of the Teacher"] === "ZZ FILING TEACHER")!;
    expect(teacher).toMatchObject({ "UDISE Code of School": "27250100101", "3.2.2 Gender (Male-1, Female-2, Transgender-3)": "2", "3.2.3 Date of Birth (DD/MM/YYYY)": "02/04/1988", "3.2.5 Social Category (General-1, SC-2, ST-3, OBC-4)": "1", "3.2.6(a) Highest Academic Qualification": "5", "3.2.6(b) Trade/Degree": "M.Sc", "3.2.7(a) Highest Professional Qualification": "3", "3.2.9(a) Aadhaar Number": "", "3.2.12 Nature of Appointment (Regular-1, Contract-2, Part-Time-3)": "1", "3.2.13 Type of Teacher": "3", "3.2.14 Date of Joining in Service (DD/MM/YYYY)": "11/06/2012", "3.2.16 Classes Taught": "5", "3.2.18 Appointed for Subject": "3", "3.2.19(a) Main Subject Taught 1": "3", "3.2.19(b) Main Subject Taught 2": "7", "Classes on the timetable": "10" });
    const head = rows.find((r) => r["3.2.1 Name of the Teacher"] === "ZZ FILING PRINCIPAL")!;
    expect(head).toMatchObject({ "3.2.13 Type of Teacher": "6", "3.2.2 Gender (Male-1, Female-2, Transgender-3)": "", "3.2.16 Classes Taught": "", "3.2.18 Appointed for Subject": "" });
  });

  it("the board sheets: CBSE with Annexure H codes for class X (Basic Mathematics 241, one 041 for two spellings), the Maharashtra pre-list with names in both scripts and SSC codes (Marathi as the first language, matched inside \"Marathi Medium\"); the grade required", async () => {
    await as("ADMIN");
    expect((await cbseGet(get("/api/v1/office/filings/export/cbse-candidates"))).status).toBe(422);
    const cbse = rowsOf((await (await cbseGet(get("/api/v1/office/filings/export/cbse-candidates?grade=10"))).json()).csv);
    expect(cbse.rows).toHaveLength(2);
    const a = cbse.rows.find((r) => r["Candidate's Name"] === "ZZ FILING AARAV PATIL")!;
    expect(a).toMatchObject({ "Affiliation No.": "25.01.001", Class: "10", "Mother's Name": "SNEHA PATIL", "Father's / Guardian's Name": "ROHAN PATIL", "Date of Birth (DD/MM/YYYY)": "10/03/2010", Gender: "Male", Category: "OBC", CWSN: "No", PEN: "12345678901" });
    const codes = Object.entries(a).filter(([k]) => /^Subject \d code$/.test(k)).map(([, v]) => v).sort();
    expect(codes).toEqual(["009", "041", "086", "087", "184", "241"]);
    expect(a["Subject 7 code"]).toBeUndefined();
    const empty = rowsOf((await (await cbseGet(get("/api/v1/office/filings/export/cbse-candidates?grade=7"))).json()).csv);
    expect(empty.rows).toEqual([]);
    expect(empty.headers[3]).toBe("Candidate's Name");

    expect((await identityPost(json("/api/v1/office/filings/identity", { medium: "Marathi Medium" }))).status).toBe(200);
    const mh = rowsOf((await (await msbshseGet(get("/api/v1/office/filings/export/msbshse-candidates?grade=10"))).json()).csv);
    // The fixture's name is "ZZ Filing Aarav Patil", so the board's first name is its first word and the surname its last.
    const m = mh.rows.find((r) => r.Surname === "PATIL")!;
    expect(m).toMatchObject({ "School index no.": "25.01.001", UDISE: "27250100101", "Std.": "10", Division: "A", "First name": "ZZ", "Father's name": "ROHAN", "Mother's name": "SNEHA PATIL", "आडनाव": "पाटील", "नाव": "आरव", "वडिलांचे नाव": "रोहन", "आईचे नाव": "स्नेहा पाटील", Medium: "Marathi Medium", Category: "OBC" });
    // Chaitra's father is on the record, so no middle name from her own name; Bhakti's record has no local father, so her Marathi middle name is blank rather than her own first name.
    const b = mh.rows.find((r) => r.Surname === "BHOSALE")!;
    expect(b).toMatchObject({ "First name": "ZZ", "Father's name": "BABAN", "वडिलांचे नाव": "" });
    const pairs = Object.entries(m).filter(([k]) => /^Subject \d$/.test(k)).map(([k, v]) => [v, m[`${k} code`]]);
    expect(pairs).toEqual(expect.arrayContaining([["Marathi", "01"], ["English", "17"], ["Mathematics", "71"], ["Science", "72"], ["Social Science", "73"]]));
    const kinds = (await db.auditLog.findMany({ where: { schoolId, action: "compliance.export" }, select: { meta: true } })).map((r) => JSON.parse(r.meta).kind);
    expect(kinds).toEqual(expect.arrayContaining(["udise-students", "udise-enrolment", "udise-teachers", "cbse-candidates", "msbshse-candidates"]));
  });

  it("the web download answers a workbook when asked, 404 for a kind it does not have, and 403 to the head", async () => {
    await as("ADMIN");
    let res = await download(get("/admin/filings/export/udise-teachers?format=xlsx"), params({ kind: "udise-teachers" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml");
    expect(res.headers.get("content-disposition")).toMatch(/udise-teachers-.*\.xlsx/);
    res = await download(get("/admin/filings/export/msbshse-candidates?grade=10"), params({ kind: "msbshse-candidates" }));
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect((await download(get("/admin/filings/export/cbse-candidates"), params({ kind: "cbse-candidates" }))).status).toBe(404);
    expect((await download(get("/admin/filings/export/nothing"), params({ kind: "nothing" }))).status).toBe(404);
    await as("PRINCIPAL");
    expect((await download(get("/admin/filings/export/udise-students"), params({ kind: "udise-students" }))).status).toBe(403);
  });
});
