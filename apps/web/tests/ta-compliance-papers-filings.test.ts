/**
 * The UDISE+ sheets of the compliance-papers batch (testing analysis of 13 November 2026), each case failing while
 * its finding stands:
 *
 *   TA-112  Grade 1's previous class filed PP3, the code classCode gives nursery, and a pre-primary pupil filed no
 *           previous class at all. In the order classCode uses (PP3, PP2, PP1, 1) the class below 1 is PP1.
 *   TA-518  A pupil with no stored roll took a counter from 1 over the name order, so they could share a roll with a
 *           pupil of the class who held that number; and the pupil record wrote any roll with no clash check.
 *   TA-578  The enrolment tables counted a pupil recorded as transgender under "No gender on record".
 *
 * One scratch ZZ school of this suite's own, through the owner connection, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { parseCsvRecords } from "@/lib/csv";
import { GET as studentsGet } from "@/app/api/v1/office/filings/export/udise-students/route";
import { GET as enrolmentGet } from "@/app/api/v1/office/filings/export/udise-enrolment/route";
import { POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
let schoolId = "";
let adminUserId = "";
const pupil: Record<string, string> = {};

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
const rowsOf = (csv: string) => {
  const { records } = parseCsvRecords(csv);
  const [headers = [], ...rows] = records;
  return { headers, rows: rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))) };
};
const nameOf = (key: string) => `ZZ TACP ${key} ${STAMP}`;

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ TA Filing Papers ${STAMP}`, slug: `zz-tacp-filing-${STAMP}`, code: `ZCF${SUFFIX}`, contactEmail: `zz-tacp-filing-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  adminUserId = (await db.user.create({ data: { name: nameOf("Admin"), email: `zz-tacp-filing-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.academicYear.createMany({ data: [{ schoolId, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false }, { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }] });
  const klass = async (key: string, gradeLevel: string) => (await db.class.create({ data: { schoolId, name: `ZZ ${key}`, gradeLevel, section: "A", joinCode: `ZCF${SUFFIX}${key}` }, select: { id: true } })).id;
  const classes = { g1: await klass("G1", "1"), ukg: await klass("UKG", "UKG"), lkg: await klass("LKG", "LKG"), nur: await klass("NUR", "Nursery"), g6: await klass("G6", "6"), g3: await klass("G3", "3") };
  // Each pupil joined in 2024, so each was here last year and files a previous class.
  const add = async (key: string, classId: string, roll: number | null, gender: string | null) => {
    const user = await db.user.create({ data: { name: nameOf(key), email: `zz-tacp-filing-${key.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
    pupil[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE", joinedAt: new Date("2024-06-10T00:00:00Z") }, select: { id: true } })).id;
    await db.enrollment.create({ data: { schoolId, classId, studentMembershipId: pupil[key]!, status: "ACTIVE", rollNumber: roll } });
    if (gender) await db.pupilRecord.create({ data: { schoolId, studentMembershipId: pupil[key]!, gender } });
  };
  await add("Gopal", classes.g1, null, null);
  await add("Usha", classes.ukg, null, null);
  await add("Lata", classes.lkg, null, null);
  await add("Neha", classes.nur, null, null);
  // 6A: Aarav first by name with no roll, Bina holding 1, Chetan with none.
  await add("Aarav", classes.g6, null, null);
  await add("Bina", classes.g6, 1, null);
  await add("Chetan", classes.g6, null, null);
  // 3A: one pupil of each gender on record and one with none.
  await add("Mohan", classes.g3, null, "M");
  await add("Fatima", classes.g3, null, "F");
  await add("Tara", classes.g3, null, "T");
  await add("Ravi", classes.g3, null, null);
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: adminUserId } });
  await db.auditLog.deleteMany({ where: { schoolId } }).catch(() => {});
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

async function asAdmin() {
  __resetCookies();
  await createSession(adminUserId, { schoolId, role: "ADMIN" });
}

async function studentsSheet() {
  await asAdmin();
  const res = await studentsGet();
  expect(res.status).toBe(200);
  const { rows } = rowsOf(((await res.json()) as { csv: string }).csv);
  return (key: string) => rows.find((r) => r["Name of Student"] === nameOf(key).toUpperCase())!;
}

describe("the UDISE+ students sheet", () => {
  it("TA-112: grade 1's previous class is PP1, the class below 1 in classCode's order, not nursery's PP3", async () => {
    const row = await studentsSheet();
    expect(row("Gopal")).toMatchObject({ "Grade/Class": "1", "PREVIOUS ACADEMIC YEAR SCHOOLING STATUS": "1", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "PP1" });
  });

  it("TA-112: a pre-primary pupil here last year files the class below theirs: UKG (PP1) PP2, LKG (PP2) PP3, nursery (PP3) none", async () => {
    const row = await studentsSheet();
    expect(row("Usha")).toMatchObject({ "Grade/Class": "PP1", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "PP2" });
    expect(row("Lata")).toMatchObject({ "Grade/Class": "PP2", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "PP3" });
    expect(row("Neha")).toMatchObject({ "Grade/Class": "PP3", "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": "" });
  });

  it("TA-518: a pupil with no stored roll never takes a number another pupil of the class holds", async () => {
    const row = await studentsSheet();
    const rolls = ["Aarav", "Bina", "Chetan"].map((k) => row(k)["Roll no"]);
    expect(row("Bina")["Roll no"]).toBe("1");
    expect(new Set(rolls).size).toBe(3);
  });
});

describe("the pupil record's roll number", () => {
  it("TA-518: a roll another pupil of the class holds is refused 409 naming rollNumber; the holder may send their own again", async () => {
    await asAdmin();
    const clash = await recordPost(json(`/api/v1/office/pupil-records/${pupil.Chetan}`, { rollNumber: "1" }), params({ membershipId: pupil.Chetan! }));
    expect(clash.status).toBe(409);
    const body = (await clash.json()) as { code: string; issues?: Record<string, string> };
    expect(body.code).toBe("CONFLICT");
    expect(body.issues).toHaveProperty("rollNumber");
    expect((await db.enrollment.findFirstOrThrow({ where: { studentMembershipId: pupil.Chetan!, status: "ACTIVE" }, select: { rollNumber: true } })).rollNumber).toBeNull();
    const own = await recordPost(json(`/api/v1/office/pupil-records/${pupil.Bina}`, { rollNumber: "1" }), params({ membershipId: pupil.Bina! }));
    expect(own.status).toBe(200);
    const free = await recordPost(json(`/api/v1/office/pupil-records/${pupil.Chetan}`, { rollNumber: "7" }), params({ membershipId: pupil.Chetan! }));
    expect(free.status).toBe(200);
    expect((await db.enrollment.findFirstOrThrow({ where: { studentMembershipId: pupil.Chetan!, status: "ACTIVE" }, select: { rollNumber: true } })).rollNumber).toBe(7);
  });
});

describe("the UDISE+ enrolment tables", () => {
  it("TA-578: a pupil recorded as transgender is counted in a Transgender column, and No gender on record keeps only the blank", async () => {
    await asAdmin();
    const res = await enrolmentGet();
    expect(res.status).toBe(200);
    const { headers, rows } = rowsOf(((await res.json()) as { csv: string }).csv);
    expect(headers).toContain("III Transgender");
    const total = rows.find((r) => r.table === "4.2 Enrolment by social category" && r.row === "Total")!;
    expect(total).toMatchObject({ "III Boys": "1", "III Girls": "1", "III Transgender": "1", "III No gender on record": "1" });
  });
});
