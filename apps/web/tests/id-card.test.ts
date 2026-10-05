/**
 * The student's identity card (5 Oct 2026; the campaign's office, student and registrar recommendation): a PDF per
 * student drawn from the rows on every read, with a QR carrying only the student's code and the staff check's
 * address; the student their own, a guardian their child's (never an adult's at a college), the office anyone; the
 * gate's check reads the student at the checker's own school, as the school holds them now.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { checkIdCode, idCardFor } from "@/lib/id-card";
import { renderIdCardPdf } from "@/lib/id-card-pdf";
import { translator } from "@/lib/i18n/dictionary";
import { GET as pdfGet } from "@/app/api/v1/id-cards/pdf/route";
import { GET as checkGet } from "@/app/api/v1/id-cards/check/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { school: "", college: "", users: [] as string[], pupil: "", pupilUser: "", other: "", left: "", adult: "", parent: "", adultParent: "", admin: "", teacher: "" };

async function as(userId: string, schoolId: string | null, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

beforeAll(async () => {
  const mk = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ Card ${tag} ${STAMP}`, slug: `zz-card-${tag.toLowerCase()}-${STAMP}`, code: `ZC${tag[0]}${SUFFIX}`, contactEmail: `zz-card-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind, brandPrimary: "#7c3aed" }, select: { id: true } });
  ids.school = (await mk("School", "SCHOOL")).id;
  ids.college = (await mk("College", "COLLEGE")).id;
  const user = async (who: string, extra: Record<string, unknown> = {}) => {
    const u = await db.user.create({ data: { name: `ZZ Card ${who}`, email: `zz-card-${who.toLowerCase().replace(/\W/g, "")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
    ids.users.push(u.id);
    return u.id;
  };
  const member = (userId: string, schoolId: string, role: string, extra: Record<string, unknown> = {}) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } }).then((m) => m.id);
  ids.pupilUser = await user("Pupil", { isMinor: true, birthdate: new Date("2014-03-01T00:00:00Z") });
  ids.pupil = await member(ids.pupilUser, ids.school, "STUDENT", { studentCode: `ZZC-${SUFFIX}-01` });
  ids.other = await member(await user("Other Pupil", { isMinor: true }), ids.school, "STUDENT", { studentCode: `ZZC-${SUFFIX}-02` });
  ids.left = await member(await user("Left Pupil", { isMinor: true }), ids.school, "STUDENT", { studentCode: `ZZC-${SUFFIX}-03`, leftAt: new Date("2026-04-30T00:00:00Z") });
  ids.adult = await member(await user("Adult Student", { isMinor: false, birthdate: new Date("2004-01-01T00:00:00Z") }), ids.college, "STUDENT", { studentCode: `ZZC-${SUFFIX}-09` });
  ids.admin = await user("Admin");
  await member(ids.admin, ids.school, "ADMIN");
  ids.teacher = await user("Teacher");
  await member(ids.teacher, ids.school, "TEACHER");
  ids.parent = await user("Parent");
  ids.adultParent = await user("Adult Parent");
  await db.guardianship.createMany({
    data: [
      { parentUserId: ids.parent, studentMembershipId: ids.pupil, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.adultParent, studentMembershipId: ids.adult, studentSchoolId: ids.college, status: "ACTIVE" },
    ],
  });
  const klass = await db.class.create({ data: { schoolId: ids.school, name: "ZZ Grade 6 A", gradeLevel: "6", joinCode: `ZZCARD${SUFFIX}` }, select: { id: true } });
  await db.enrollment.create({ data: { classId: klass.id, schoolId: ids.school, studentMembershipId: ids.pupil } });
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
});

afterAll(async () => {
  __resetCookies();
  await db.rateLimit.deleteMany({ where: { bucket: { in: ids.users.map((u) => `pdf:${u}`) } } });
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.school, ids.college] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.college] } } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("the identity card", () => {
  it("carries the name, class, code and year, and a QR with nothing but the code's check", async () => {
    const pupil = await as(ids.pupilUser, ids.school, "STUDENT");
    const card = await idCardFor(pupil);
    expect(card).toMatchObject({ name: "ZZ Card Pupil", group: "ZZ Grade 6 A", studentCode: `ZZC-${SUFFIX}-01`, prn: null, year: "2026–27", validUntil: "2027-04-30", checkPath: `/id-check?c=ZZC-${SUFFIX}-01` });
    expect(JSON.stringify(card)).not.toMatch(/2014-03-01|birth/i);
    const pdf = await renderIdCardPdf(card, translator("mr"), "http://localhost", "mr");
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "idCard.print", targetId: ids.pupil } })).toBe(1);
  });

  it("is the student's own, a minor's guardian's, the office's — and never another pupil's or an adult's guardian's", async () => {
    const pupil = await as(ids.pupilUser, ids.school, "STUDENT");
    await expect(idCardFor(pupil, ids.other)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const parent = await as(ids.parent, null, "PARENT");
    expect((await idCardFor(parent, ids.pupil)).name).toBe("ZZ Card Pupil");
    await expect(idCardFor(parent, ids.other)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const adultParent = await as(ids.adultParent, null, "PARENT");
    await expect(idCardFor(adultParent, ids.adult)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
    const admin = await as(ids.admin, ids.school, "ADMIN");
    expect((await idCardFor(admin, ids.other)).studentCode).toBe(`ZZC-${SUFFIX}-02`);
    // The office cannot print another school's student.
    await expect(idCardFor(admin, ids.adult)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("answers the door as a PDF for the student, and the check door to staff only", async () => {
    await as(ids.pupilUser, ids.school, "STUDENT");
    const res = await pdfGet(new Request("http://localhost/api/v1/id-cards/pdf"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect((await checkGet(new Request(`http://localhost/api/v1/id-cards/check?c=ZZC-${SUFFIX}-02`))).status).toBe(403);
  });
});

describe("the gate's check of a scanned card", () => {
  it("finds the student at the checker's own school, says when they have left, and nothing elsewhere", async () => {
    const teacher = await as(ids.teacher, ids.school, "TEACHER");
    expect(await checkIdCode(teacher, `ZZC-${SUFFIX}-01`)).toMatchObject({ found: true, onRoll: true, name: "ZZ Card Pupil", group: "ZZ Grade 6 A" });
    expect(await checkIdCode(teacher, `ZZC-${SUFFIX}-03`)).toMatchObject({ found: true, onRoll: false });
    // The college's student, scanned at the school: not found, as a made-up code is.
    expect(await checkIdCode(teacher, `ZZC-${SUFFIX}-09`)).toMatchObject({ found: false, name: null });
    expect(await checkIdCode(teacher, "ZZ-MADE-UP")).toMatchObject({ found: false });
  });
});
