/**
 * ONE WRITER OF A PAN (G4-14, the risks batch of 5 October 2026). A college
 * teacher's PAN was sealed in the faculty record (iqac.ts) and in payroll's
 * salary revisions (payroll.ts) by two writers, so typing it into one left
 * the other on the old number (data:audit's WARN "PAN ending X, payroll's
 * ends Y"); the expert's payee row had a third. Every path now calls
 * src/lib/pan.ts `writePan`: written through either desk, both copies carry
 * the same last four and open to the same number; and a `seal(…pan…)`
 * anywhere else in the app is refused by the source rule below.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { saveFacultyRecord } from "@/lib/iqac";
import { saveSalary, saveStructure } from "@/lib/payroll";
import { openPan } from "@/lib/pan";
import { sealingAvailable } from "@/lib/secret-box";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const id: Record<string, string> = {};
const users: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(users[who]!, { schoolId: id.college!, role: role as never });
  return (await getSession())!;
}
const copies = async () => ({
  record: await db.facultyRecord.findUniqueOrThrow({ where: { membershipId: id.faculty! }, select: { panSealed: true, panLast4: true } }),
  salary: await db.staffSalary.findFirstOrThrow({ where: { membershipId: id.faculty! }, orderBy: { effectiveFromKey: "desc" }, select: { panSealed: true, panLast4: true } }),
});

beforeAll(async () => {
  id.college = (await db.school.create({ data: { name: `ZZ Pan ${STAMP}`, slug: `zz-pan-${STAMP}`, code: `ZPN${SUFFIX}`, contactEmail: `zz-pan-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", affiliatingUniversity: "ZZ University" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["IQAC", "PAYROLL", "ACADEMICS"].map((module) => ({ schoolId: id.college!, module })) });
  for (const [who, role] of [["Admin", "ADMIN"], ["Faculty", "FACULTY"]] as const) {
    users[who] = (await db.user.create({ data: { name: `ZZ Pan ${who}`, email: `zz-pan-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    id[who === "Admin" ? "admin" : "faculty"] = (await db.membership.create({ data: { userId: users[who]!, schoolId: id.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a college teacher's PAN, written through either desk (G4-14)", () => {
  it("lands in the faculty record and every salary revision alike", async () => {
    expect(sealingAvailable()).toBe(true);
    const admin = await as("Admin", "ADMIN");
    const structure = await saveStructure(admin, { name: `ZZ Pan structure ${SUFFIX}`, components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }] });
    const blank = { pfUan: "", esiNumber: "", pan: "", bankAccount: "", bankIfsc: "", bankName: "", paymentMode: "CASH" as const, overrides: {}, basicPaise: 4_000_000, structureId: structure.id, membershipId: id.faculty! };
    await saveSalary(admin, { ...blank, effectiveFrom: "2026-04-01" });
    await saveSalary(admin, { ...blank, effectiveFrom: "2026-07-01" });
    const record = { membershipId: id.faculty!, designation: "ASSISTANT_PROFESSOR" as const, appointment: "REGULAR" as const, highestQualification: "PHD" as const, netSetQualified: false, experienceBeforeYears: 0, joinedOn: null, departmentId: null, apaarFacultyId: null, apiScoreInputs: { teaching: 0, research: 0, service: 0 } };

    // Through the IQAC's faculty record: payroll's copies follow.
    await saveFacultyRecord(admin, { ...record, pan: "ABCDE1234F" });
    let now = await copies();
    expect([now.record.panLast4, now.salary.panLast4]).toEqual(["234F", "234F"]);
    expect(await db.staffSalary.count({ where: { membershipId: id.faculty!, panLast4: "234F" } })).toBe(2);
    const staff = { kind: "STAFF" as const, schoolId: id.college!, membershipId: id.faculty! };
    expect(openPan(staff, "FACULTY_RECORD", now.record.panSealed)).toBe("ABCDE1234F");
    expect(openPan(staff, "SALARY", now.salary.panSealed)).toBe("ABCDE1234F");

    // Through payroll: the faculty record follows.
    const saved = await saveSalary(admin, { ...blank, effectiveFrom: "2026-07-01", pan: "PQRST5678Z" });
    expect(saved.salary?.panLast4).toBe("678Z");
    now = await copies();
    expect([now.record.panLast4, now.salary.panLast4]).toEqual(["678Z", "678Z"]);
    expect(openPan(staff, "FACULTY_RECORD", now.record.panSealed)).toBe("PQRST5678Z");
    expect(await db.staffSalary.count({ where: { membershipId: id.faculty!, panLast4: "678Z" } })).toBe(2);

    // A blank PAN on a new revision keeps the one held.
    await saveSalary(admin, { ...blank, effectiveFrom: "2026-10-01" });
    expect((await copies()).salary.panLast4).toBe("678Z");
  });
});

describe("the source rule (G4-14)", () => {
  it("no file of the app seals a PAN but src/lib/pan.ts", () => {
    const root = join(__dirname, "..", "src");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(path);
      }
    };
    walk(root);
    const offenders = files
      .filter((f) => relative(root, f) !== join("lib", "pan.ts"))
      .flatMap((f) => (readFileSync(f, "utf8").match(/\bseal\([^;\n]*\bpan/gi) ?? []).map((m) => `${relative(root, f)}: ${m}`));
    expect(offenders).toEqual([]);
  });
});
