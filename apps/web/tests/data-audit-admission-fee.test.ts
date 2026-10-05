/**
 * G4-18 (5 Oct 2026, risks batch): the data:audit check "admitted with the fee recorded but no payment row"
 * (tests/data-audit-admission-fee.ts) fails on a seat built to be wrong and passes once the payment row exists.
 * Its own ZZ college, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { admissionPaymentClientId, admittedWithoutPayment } from "./data-audit-admission-fee";

const db = new PrismaClient();
const STAMP = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
let schoolId = "";
let admitted = "";
let notPaid = "";
let pupil = "";

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ P4 AdmFee ${STAMP}`, slug: `zz-p4-admfee-${STAMP}`, code: `ZPF${STAMP.slice(-5).toUpperCase()}`, contactEmail: `zz-p4-admfee-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en", kind: "COLLEGE" }, select: { id: true } })).id;
  const year = (await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const structure = (await db.feeStructure.create({ data: { schoolId, academicYearId: year, name: "ZZ BSc first year" }, select: { id: true } })).id;
  const dept = (await db.department.create({ data: { schoolId, code: "PHY", name: "ZZ Physics" }, select: { id: true } })).id;
  const programme = (await db.programme.create({ data: { schoolId, departmentId: dept, code: "BSCPHY", name: "ZZ BSc Physics", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  const round = (await db.admissionRound.create({ data: { schoolId, programmeId: programme, intakeYear: 2026, kind: "INSTITUTE", name: "ZZ round", opensAt: new Date("2026-06-01T00:00:00Z"), closesAt: new Date("2026-07-31T00:00:00Z") }, select: { id: true } })).id;
  const userId = (await db.user.create({ data: { name: "ZZ P4 Admitted", email: `zz-p4-admitted-${STAMP}@test.invalid` }, select: { id: true } })).id;
  pupil = (await db.membership.create({ data: { userId, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  const base = { schoolId, roundId: round, programmeId: programme, category: "OPEN", quota: "INSTITUTE", feeStructureId: structure, admissionFeePaise: 1_350_000, admissionFeeMethod: "BANK", admissionFeeRef: "ZZUTR1", admissionFeePaidAt: new Date("2026-07-01T06:00:00Z") };
  // Admitted, fee recorded as received, and the ledger write never happened: the seat built to be wrong.
  admitted = (await db.collegeApplication.create({ data: { ...base, number: 1, applicantName: "ZZ P4 Admitted", status: "ADMITTED", admittedMembershipId: pupil, admittedAt: new Date("2026-07-02T06:00:00Z") }, select: { id: true } })).id;
  // Fee recorded but not admitted yet (FEE_DUE with the fee in): nothing is owed to the ledger.
  notPaid = (await db.collegeApplication.create({ data: { ...base, number: 2, applicantName: "ZZ P4 Not yet", status: "FEE_DUE" }, select: { id: true } })).id;
});

afterAll(async () => {
  if (schoolId) await db.school.delete({ where: { id: schoolId } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: `zz-p4-admitted-${STAMP}@test.invalid` } });
  await db.$disconnect();
});

describe("data:audit admission-fee (G4-18)", () => {
  it("fails on an admitted seat whose fee was recorded and never reached the ledger", async () => {
    const out = await admittedWithoutPayment(db, schoolId);
    expect(out.checked).toBe(1);
    expect(out.gaps.map((g) => g.applicationId)).toEqual([admitted]);
    expect(out.gaps.map((g) => g.applicationId)).not.toContain(notPaid);
  });

  it("passes once the payment row with the admission's clientId exists, whatever became of it later", async () => {
    await db.feePayment.create({ data: { schoolId, studentMembershipId: pupil, amountPaise: 1_350_000, method: "BANK", status: "REVERSED", clientId: admissionPaymentClientId(admitted), reference: "ZZUTR1" } });
    expect(await admittedWithoutPayment(db, schoolId)).toEqual({ checked: 1, gaps: [] });
  });

  it("uses the clientId the admission's ledger write uses, and runs in data:audit", () => {
    const lib = readFileSync(join(process.cwd(), "src", "lib", "college-admissions.ts"), "utf8");
    expect(lib).toContain("clientId: `college-admission-${a.id}`");
    expect(admissionPaymentClientId("abc")).toBe("college-admission-abc");
    const audit = readFileSync(join(process.cwd(), "tests", "data-audit.test.ts"), "utf8");
    expect(audit).toMatch(/await admittedWithoutPayment\(db, s\.id\)/);
  });
});
