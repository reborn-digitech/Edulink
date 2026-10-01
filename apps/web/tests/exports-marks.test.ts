/**
 * A class's marks and gradebook as files — GET /api/v1/teaching/classes/
 * {classId}/marks/export and …/gradebook/export — invoked directly with a
 * primed session the way api-v1-teaching.test.ts does. A ZZ school with two
 * pupils and an exam of two papers: the CSV carries the header and a row per
 * pupil with the total, the percentage and the band; the workbook parses back
 * to the same cells; a teacher of another class is 404 (the gradebook's own
 * answer), a pupil 403, another grade's exam 404; and the hour's budget,
 * filled by hand, refuses with 429 and a Retry-After.
 *
 * Everything created here is ZZ-prefixed and deleted in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { consume } from "@/lib/rate-limit";
import { parseCsvRecords } from "@/lib/csv";
import { parseXlsx } from "@/lib/xlsx";
import { EXPORT_BUDGET } from "@/lib/marks-export";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as marksGet } from "@/app/api/v1/teaching/classes/[classId]/marks/export/route";
import { GET as gradebookGet } from "@/app/api/v1/teaching/classes/[classId]/gradebook/export/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);

let schoolId = "";
let classId = "";
let otherClassId = "";
let seriesId = "";
let otherGradeSeriesId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let adminUserId = "";
let principalUserId = "";
let pupilUserId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
/** The CSV as the header line and a record per pupil keyed by it; parseCsv itself is the importer's and lower-cases headers. */
function readCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const [headers = [], ...records] = parseCsvRecords(text).records;
  return { headers, rows: records.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))) };
}
const params = (classId: string) => ({ params: Promise.resolve({ classId }) });

async function as(userId: string, role: "TEACHER" | "ADMIN" | "PRINCIPAL" | "STUDENT") {
  __resetCookies();
  await createSession(userId, { schoolId, role });
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Exports School ${STAMP}`, slug: `zz-exports-${STAMP}`, code: `ZX${tail}`, contactEmail: `zz-exports-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;

  const [teacher, otherTeacher, admin, principal, asha, bhav] = await Promise.all([
    db.user.create({ data: { name: "ZZ Exports Teacher", email: `zz-exports-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Exports Other Teacher", email: `zz-exports-other-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Exports Admin", email: `zz-exports-admin-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Exports Principal", email: `zz-exports-principal-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Asha Exports", email: `zz-exports-asha-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Bhavesh Exports", email: `zz-exports-bhav-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  teacherUserId = teacher.id;
  otherTeacherUserId = otherTeacher.id;
  adminUserId = admin.id;
  principalUserId = principal.id;
  pupilUserId = asha.id;

  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const otm = await db.membership.create({ data: { userId: otherTeacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principal.id, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const am = await db.membership.create({ data: { userId: asha.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZXA${STAMP}` }, select: { id: true } });
  const bm = await db.membership.create({ data: { userId: bhav.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZXB${STAMP}` }, select: { id: true } });

  const klass = await db.class.create({ data: { schoolId, name: "ZZ Exports 7A", gradeLevel: "7", joinCode: `ZX${tail}` }, select: { id: true } });
  classId = klass.id;
  const other = await db.class.create({ data: { schoolId, name: "ZZ Exports 8B", gradeLevel: "8", joinCode: `ZY${tail}` }, select: { id: true } });
  otherClassId = other.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.classTeacher.create({ data: { classId: otherClassId, schoolId, teacherMembershipId: otm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: am.id, status: "ACTIVE", rollNumber: 2 } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: bm.id, status: "ACTIVE", rollNumber: 1 } });
  await db.pupilRecord.create({ data: { schoolId, studentMembershipId: am.id, admissionNumber: "GR/0042" } });

  // Two papers; Asha sat both, Bhavesh missed Science.
  const series = await db.examSeries.create({ data: { schoolId, name: "ZZ Exports Mid-term", gradeLevel: "7", kind: "MID_TERM" }, select: { id: true } });
  seriesId = series.id;
  const maths = await db.examSlot.create({ data: { schoolId, seriesId, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 80_000 }, select: { id: true } });
  const science = await db.examSlot.create({ data: { schoolId, seriesId, subject: "Science", dateKey: "2026-09-02", pointsMilli: 50_000, position: 1 }, select: { id: true } });
  const sitMaths = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: tm.id, title: "ZZ Exports Mid-term · Mathematics", category: "Exam", pointsMilli: 80_000, examSlotId: maths.id, publishedAt: new Date() }, select: { id: true } });
  const sitScience = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: tm.id, title: "ZZ Exports Mid-term · Science", category: "Exam", pointsMilli: 50_000, examSlotId: science.id, publishedAt: new Date() }, select: { id: true } });
  await db.grade.createMany({
    data: [
      { schoolId, assignmentId: sitMaths.id, studentMembershipId: am.id, scoreMilli: 72_000 },
      { schoolId, assignmentId: sitScience.id, studentMembershipId: am.id, scoreMilli: 37_500 },
      { schoolId, assignmentId: sitMaths.id, studentMembershipId: bm.id, scoreMilli: 40_000 },
    ],
  });
  const otherGrade = await db.examSeries.create({ data: { schoolId, name: "ZZ Exports Grade 8 test", gradeLevel: "8" }, select: { id: true } });
  otherGradeSeriesId = otherGrade.id;

  // Homework: Asha handed in late and was marked; Bhavesh never handed in.
  const due = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const homework = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: tm.id, title: "ZZ Exports fractions", pointsMilli: 20_000, dueAt: due, publishedAt: new Date() }, select: { id: true } });
  await db.submission.create({ data: { schoolId, assignmentId: homework.id, studentMembershipId: am.id, body: "ZZ working", status: "SUBMITTED", submittedAt: new Date(due.getTime() + 3600 * 1000) } });
  await db.grade.create({ data: { schoolId, assignmentId: homework.id, studentMembershipId: am.id, scoreMilli: 17_500 } });
});

afterAll(async () => {
  __resetCookies();
  const userIds = [teacherUserId, otherTeacherUserId, adminUserId, principalUserId, pupilUserId];
  await db.rateLimit.deleteMany({ where: { bucket: { in: userIds.map((id) => `export:${id}`) } } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the marks export", () => {
  it("is a CSV attachment named for the class and the exam, a row per pupil in roll order with the total, the percentage and the band", async () => {
    await as(teacherUserId, "TEACHER");
    const res = await marksGet(get(`/x?exam=${seriesId}`), params(classId));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="relay-marks-ZZ_Exports_7A-ZZ_Exports_Mid-term.csv"');
    expect(res.headers.get("cache-control")).toContain("no-store");
    const { headers, rows } = readCsv(await res.text());
    expect(headers).toEqual(["name", "roll_no", "admission_no", "Mathematics", "Mathematics (max)", "Science", "Science (max)", "total", "total_max", "percent", "grade"]);
    expect(rows).toHaveLength(2);
    // Bhavesh is roll 1: Science not sat is a blank, and out of the total.
    expect(rows[0]).toMatchObject({ name: "ZZ Bhavesh Exports", roll_no: "1", admission_no: "", Mathematics: "40", "Mathematics (max)": "80", Science: "", total: "40", total_max: "80", percent: "50" });
    expect(rows[1]).toMatchObject({ name: "ZZ Asha Exports", roll_no: "2", admission_no: "GR/0042", Mathematics: "72", Science: "37.5", "Science (max)": "50", total: "109.5", total_max: "130", percent: "84.2" });
    // The default rules band every percent; the labels are the school's and may change, so only their presence is held.
    expect(rows[0]!.grade).not.toBe("");
    expect(rows[1]!.grade).not.toBe("");
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "marks.export", targetId: classId }, orderBy: { createdAt: "desc" } });
    expect(audit).not.toBeNull();
  });

  it("as a workbook parses back to the same cells, with the numbers as numbers", async () => {
    await as(adminUserId, "ADMIN");
    const res = await marksGet(get(`/x?exam=${seriesId}&format=xlsx`), params(classId));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml");
    expect(res.headers.get("content-disposition")).toContain(".xlsx");
    const sheets = await parseXlsx(new Uint8Array(await res.arrayBuffer()));
    expect(sheets).toHaveLength(1);
    const [header, ...rows] = sheets[0]!.rows;
    expect(header).toEqual(["name", "roll_no", "admission_no", "Mathematics", "Mathematics (max)", "Science", "Science (max)", "total", "total_max", "percent", "grade"]);
    expect(rows[1]!.slice(0, 7)).toEqual(["ZZ Asha Exports", "2", "GR/0042", "72", "80", "37.5", "50"]);
  });

  it("the head may take it too; a teacher of another class is not found, a pupil is refused, another grade's exam is not found", async () => {
    await as(principalUserId, "PRINCIPAL");
    expect((await marksGet(get(`/x?exam=${seriesId}`), params(classId))).status).toBe(200);
    await as(otherTeacherUserId, "TEACHER");
    expect((await marksGet(get(`/x?exam=${seriesId}`), params(classId))).status).toBe(404);
    await as(pupilUserId, "STUDENT");
    expect((await marksGet(get(`/x?exam=${seriesId}`), params(classId))).status).toBe(403);
    await as(teacherUserId, "TEACHER");
    expect((await marksGet(get(`/x?exam=${otherGradeSeriesId}`), params(classId))).status).toBe(404);
    expect((await marksGet(get("/x"), params(classId))).status).toBe(422);
    __resetCookies();
    expect((await marksGet(get(`/x?exam=${seriesId}`), params(classId))).status).toBe(401);
  });
});

describe("the gradebook export", () => {
  it("has two columns per assignment — the marks and whether the work came in — and an exam sitting leaves the second blank", async () => {
    await as(teacherUserId, "TEACHER");
    const res = await gradebookGet(get("/x"), params(classId));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="relay-gradebook-ZZ_Exports_7A.csv"');
    const { headers, rows } = readCsv(await res.text());
    expect(headers).toEqual([
      "name",
      "roll_no",
      "admission_no",
      "ZZ Exports Mid-term · Mathematics (max 80)",
      "ZZ Exports Mid-term · Mathematics (max 80) status",
      "ZZ Exports Mid-term · Science (max 50)",
      "ZZ Exports Mid-term · Science (max 50) status",
      "ZZ Exports fractions (max 20)",
      "ZZ Exports fractions (max 20) status",
    ]);
    expect(rows[0]).toMatchObject({ name: "ZZ Bhavesh Exports", "ZZ Exports fractions (max 20)": "", "ZZ Exports fractions (max 20) status": "missing", "ZZ Exports Mid-term · Science (max 50) status": "" });
    expect(rows[1]).toMatchObject({ name: "ZZ Asha Exports", "ZZ Exports fractions (max 20)": "17.5", "ZZ Exports fractions (max 20) status": "late" });
    await as(otherTeacherUserId, "TEACHER");
    expect((await gradebookGet(get("/x"), params(classId))).status).toBe(404);
    // Their own class has nobody on the roll and no work: a header line alone.
    const own = await gradebookGet(get("/x?format=xlsx"), params(otherClassId));
    expect(own.status).toBe(200);
    expect((await parseXlsx(new Uint8Array(await own.arrayBuffer())))[0]!.rows).toEqual([["name", "roll_no", "admission_no"]]);
  });

  it("the hour's budget, once spent, refuses with 429 and a Retry-After, and counts the person not the school", async () => {
    await as(adminUserId, "ADMIN");
    for (let i = 0; i < EXPORT_BUDGET.limit; i++) await consume(`export:${adminUserId}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    const refused = await gradebookGet(get("/x"), params(classId));
    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await refused.json()).toMatchObject({ code: "RATE_LIMITED" });
    await as(principalUserId, "PRINCIPAL");
    expect((await gradebookGet(get("/x"), params(classId))).status).toBe(200);
  });
});
