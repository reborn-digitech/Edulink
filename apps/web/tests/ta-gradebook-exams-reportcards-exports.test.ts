/**
 * TA-135 (testing analysis of 13 November 2026, batch gradebook-exams-reportcards): the marks export, the
 * gradebook export and a person's own data export put a file name made of a class, an exam or a pupil's name
 * straight into Content-Disposition, and a header value above U+00FF makes the Response throw, so a name in
 * Devanagari answered 500. Fixed: an ASCII stand-in in filename="…" and the real name in filename*=UTF-8''….
 *
 * One scratch ZZ school of this suite's own (made through the owner connection, removed after): a class
 * "ZZ ७ अ", an exam series "ZZ प्रथम सत्र" with one marked paper, a teacher, and a pupil named in Devanagari.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { contentDisposition } from "@/lib/export-file";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as marksGet } from "@/app/api/v1/teaching/classes/[classId]/marks/export/route";
import { GET as gradebookGet } from "@/app/api/v1/teaching/classes/[classId]/gradebook/export/route";
import { GET as familyExportGet } from "@/app/api/v1/family/export/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tagx-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const params = (classId: string) => ({ params: Promise.resolve({ classId }) });

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA Gradebook Exports ${STAMP}`, slug: `zz-tagx-${STAMP}`, code: `ZTGX${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  ids.teacher = (await db.user.create({ data: { name: "ZZ TA Gradebook Exports Teacher", email: MAIL("teacher") }, select: { id: true } })).id;
  ids.pupil = (await db.user.create({ data: { name: "ZZ आशा पाटील", email: MAIL("pupil") }, select: { id: true } })).id;
  ids.teacherM = (await db.membership.create({ data: { userId: ids.teacher, schoolId: S, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil, schoolId: S, role: "STUDENT", status: "ACTIVE", studentCode: `ZTGX${TAIL}` }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: S, name: "ZZ ७ अ", gradeLevel: "7", joinCode: `ZTGX${TAIL}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.klass, schoolId: S, teacherMembershipId: ids.teacherM, role: "LEAD" } });
  await db.enrollment.create({ data: { classId: ids.klass, schoolId: S, studentMembershipId: ids.pupilM, status: "ACTIVE" } });
  ids.series = (await db.examSeries.create({ data: { schoolId: S, name: "ZZ प्रथम सत्र", gradeLevel: "7", kind: "MID_TERM" }, select: { id: true } })).id;
  const slot = await db.examSlot.create({ data: { schoolId: S, seriesId: ids.series, subject: "गणित", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } });
  const sitting = await db.assignment.create({
    data: { schoolId: S, classId: ids.klass, authorMembershipId: ids.teacherM, title: "ZZ प्रथम सत्र · गणित", category: "Exam", pointsMilli: 50_000, examSlotId: slot.id, publishedAt: new Date() },
    select: { id: true },
  });
  await db.grade.create({ data: { schoolId: S, assignmentId: sitting.id, studentMembershipId: ids.pupilM, scoreMilli: 41_000 } });
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = [ids.teacher, ids.pupil].filter((id): id is string => Boolean(id));
  await db.rateLimit.deleteMany({ where: { bucket: { in: users.flatMap((id) => [`export:${id}`, `family-export:${id}`]) } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-135: a file named in Devanagari", () => {
  it("TA-135: the header keeps an ASCII stand-in and the real name in filename*, and a plain ASCII name is sent as before", () => {
    expect(contentDisposition("attachment", "relay-marks-7A.csv")).toBe('attachment; filename="relay-marks-7A.csv"');
    const header = contentDisposition("attachment", "relay-marks-ZZ_७_अ.csv");
    expect(header).toMatch(/^attachment; filename="relay-marks-ZZ__+\.csv"; filename\*=UTF-8''/);
    expect(decodeURIComponent(header.split("filename*=UTF-8''")[1]!)).toBe("relay-marks-ZZ_७_अ.csv");
    // A header built from it is a valid byte string.
    expect(() => new Headers({ "content-disposition": header })).not.toThrow();
  });

  it("TA-135: the marks export of class \"ZZ ७ अ\" and exam \"ZZ प्रथम सत्र\" answers 200 with filename*", async () => {
    __resetCookies();
    await createSession(ids.teacher!, { schoolId: ids.school!, role: "TEACHER" });
    const res = await marksGet(new Request(`http://localhost/x?exam=${ids.series}`), params(ids.klass!));
    expect(res.status).toBe(200);
    const header = res.headers.get("content-disposition") ?? "";
    expect(header).toContain("filename*=UTF-8''");
    expect(decodeURIComponent(header.split("filename*=UTF-8''")[1]!)).toBe("relay-marks-ZZ_७_अ-ZZ_प्रथम_सत्र.csv");
    expect(await res.text()).toContain("ZZ आशा पाटील");
  });

  it("TA-135: the gradebook export of the class answers 200, as a workbook too", async () => {
    __resetCookies();
    await createSession(ids.teacher!, { schoolId: ids.school!, role: "TEACHER" });
    const csv = await gradebookGet(new Request("http://localhost/x"), params(ids.klass!));
    expect(csv.status).toBe(200);
    expect(csv.headers.get("content-disposition")).toContain("filename*=UTF-8''");
    const xlsx = await gradebookGet(new Request("http://localhost/x?format=xlsx"), params(ids.klass!));
    expect(xlsx.status).toBe(200);
    expect(decodeURIComponent((xlsx.headers.get("content-disposition") ?? "").split("filename*=UTF-8''")[1]!)).toBe("relay-gradebook-ZZ_७_अ.xlsx");
  });

  it("TA-135: a pupil named in Devanagari takes their own data export with a 200", async () => {
    __resetCookies();
    await createSession(ids.pupil!, { schoolId: ids.school!, role: "STUDENT" });
    const res = await familyExportGet(new Request("http://localhost/api/v1/family/export"));
    expect(res.status).toBe(200);
    const header = res.headers.get("content-disposition") ?? "";
    expect(header).toContain("filename*=UTF-8''");
    expect(decodeURIComponent(header.split("filename*=UTF-8''")[1]!)).toMatch(/^relay-export-ZZ_आशा_पाटील-/);
  });
});
