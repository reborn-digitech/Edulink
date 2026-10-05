/**
 * A GRADE CARD CHECKED BY ITS CODE ALONE, as a stranger reaches it
 * (A3-journeys-21, audit of 5 October 2026). A college's grade card,
 * transcript or degree prints a code and an address carrying the college's
 * id; someone typing the code by hand had nothing to type the id into, and
 * /certificates/check said no certificate carries that code. ExamDocument is
 * now code-readable (scripts/gen-rls.ts CODE_READABLE), so the check finds
 * the paper by its code, signed out, as the APPLICATION role with row-level
 * security in force: valid, its kind and serial and the college's name, and
 * nothing about the student. A code no paper carries is not valid; a revoked
 * paper says so. Runs the library and both doors as the app role.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const OWNER_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = process.env.DATABASE_APP_URL;

const { db: appDb } = await import("@/lib/db");
const { __resetCookies, __setHeaders } = await import("./stubs/next-headers");
const { checkExamDocument } = await import("@/lib/exam-cell-after");
const { verifyByCode } = await import("@/lib/certificates");
const { GET: examDocGet } = await import("@/app/api/v1/public/exam-documents/[code]/route");
const { GET: certGet } = await import("@/app/api/v1/public/certificates/[code]/route");

const db = new PrismaClient({ datasourceUrl: OWNER_URL });
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const CODE = `ZZGC${SUFFIX}`;
const REVOKED = `ZZGR${SUFFIX}`;
let collegeId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const params = (code: string) => ({ params: Promise.resolve({ code }) });

beforeAll(async () => {
  __resetCookies();
  __setHeaders({});
  collegeId = (await db.school.create({ data: { name: `ZZ Grade Check ${STAMP}`, slug: `zz-gradecheck-${STAMP}`, code: `ZGC${SUFFIX}`, contactEmail: `zz-gradecheck-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id;
  const user = await db.user.create({ data: { name: "ZZ Grade Student", email: `zz-gradecheck-student-${STAMP}@test.invalid` }, select: { id: true } });
  const student = await db.membership.create({ data: { userId: user.id, schoolId: collegeId, role: "STUDENT", status: "ACTIVE", studentCode: `ZGCS${SUFFIX}` }, select: { id: true } });
  const paper = (code: string, number: number, revoked: boolean) =>
    db.examDocument.create({
      data: {
        schoolId: collegeId,
        studentMembershipId: student.id,
        kind: "GRADE_CARD",
        yearLabel: "2025–26",
        number,
        serial: `GC/2025–26/${String(number).padStart(4, "0")}`,
        code,
        studentName: "ZZ Grade Student",
        dataJson: JSON.stringify({ college: { name: `ZZ Grade Check ${STAMP}` } }),
        issuedByUserId: user.id,
        ...(revoked ? { revokedAt: new Date(), revokedReason: "ZZ test" } : {}),
      },
    });
  await paper(CODE, 1, false);
  await paper(REVOKED, 2, true);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.school.deleteMany({ where: { id: collegeId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
  process.env.DATABASE_URL = OWNER_URL;
});

describe("a grade card checked by its code alone, signed out (A3-journeys-21)", () => {
  it("runs as the app role, not the owner", async () => {
    const [app] = await appDb.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    const [owner] = await db.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    expect(app!.u).not.toBe(owner!.u);
  });

  it("the exam check finds the paper with no college id: valid, kind, serial and the college, nothing about the student", async () => {
    const result = await checkExamDocument("", CODE);
    expect(result).toEqual({ valid: true, kind: "GRADE_CARD", serial: "GC/2025–26/0001", schoolName: `ZZ Grade Check ${STAMP}`, issuedAt: expect.any(String), revokedAt: null });
    expect(JSON.stringify(result)).not.toContain("ZZ Grade Student");
    // Typed in lower case with spaces, as a person types it.
    expect((await checkExamDocument(null, ` ${CODE.toLowerCase()} `)).valid).toBe(true);
    // The college's id beside it changes nothing.
    expect((await checkExamDocument(collegeId, CODE)).valid).toBe(true);
  });

  it("another code is not valid, and a revoked paper says so", async () => {
    expect(await checkExamDocument("", `ZZNO${SUFFIX}`)).toMatchObject({ valid: false, serial: null });
    expect(await checkExamDocument("", REVOKED)).toMatchObject({ valid: false, serial: "GC/2025–26/0002", revokedAt: expect.any(String) });
  });

  it("the door answers by code alone, without ?school=", async () => {
    const body = await (await examDocGet(get(`/api/v1/public/exam-documents/${CODE}`), params(CODE))).json();
    expect(body).toMatchObject({ valid: true, kind: "GRADE_CARD", schoolName: `ZZ Grade Check ${STAMP}` });
    const none = await (await examDocGet(get(`/api/v1/public/exam-documents/ZZNO${SUFFIX}`), params(`ZZNO${SUFFIX}`))).json();
    expect(none).toMatchObject({ valid: false });
  });

  it("the certificate check answers a grade card's code too, named by examKind", async () => {
    expect(await verifyByCode(CODE)).toMatchObject({ valid: true, kind: null, examKind: "GRADE_CARD", serial: "GC/2025–26/0001", schoolName: `ZZ Grade Check ${STAMP}` });
    const body = await (await certGet(get(`/api/v1/public/certificates/${CODE}`), params(CODE))).json();
    expect(body).toMatchObject({ valid: true, examKind: "GRADE_CARD", schoolName: `ZZ Grade Check ${STAMP}` });
    expect(await verifyByCode(`ZZNO${SUFFIX}`)).toMatchObject({ valid: false, serial: null });
  });
});
