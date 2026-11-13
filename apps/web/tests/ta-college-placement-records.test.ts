/**
 * What the placement cell counts and what the exam cell sends: two findings
 * of the college-placement batch of the testing analysis of 13 November 2026,
 * each held by a case that FAILED on the code of that day.
 *
 *   TA-089  the batch's N (the final-year students, NBA's denominator) counted
 *           every student who ever held a seat of the batch, those who left in
 *           their first years included
 *   TA-091  an internship credited between two terms (the summer vacation the
 *           policy's windows sit in), or before 05:30 on a term's first day by
 *           the college's clock, reached no term's credit push
 *
 * A scratch ZZ college of this suite's own, removed after; the reads run bound
 * to it (forSchool), as the cell's and the exam cell's do.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { forSchool } from "@/lib/tenant-context";
import { batchStudents } from "@/lib/placement-record";
import { placementTable } from "@/lib/placement-analytics";
import { internshipCreditsForTerm } from "@/lib/placement-internships";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tacr-${who.toLowerCase()}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TACR College ${STAMP}`, slug: `zz-tacr-${STAMP}`, code: `ZR${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["PLACEMENT", "ACADEMICS"].map((module) => ({ schoolId: ids.school!, module })) });
  const dept = await db.department.create({ data: { schoolId: ids.school!, code: `ZRD${SUFFIX}`, name: "ZZ TACR dept" }, select: { id: true } });
  ids.programme = (await db.programme.create({ data: { schoolId: ids.school!, departmentId: dept.id, code: `ZRP${SUFFIX}`, name: "ZZ TACR BTech", level: "UG", durationYears: 4, regulator: "AICTE" }, select: { id: true } })).id;
  const scheme = await db.scheme.create({ data: { schoolId: ids.school!, programmeId: ids.programme, name: "ZZ TACR scheme", effectiveYear: 2023 }, select: { id: true } });
  // Five of the 2023 entry, the batch of 2027 (final year from June 2026): two still studying, one who left in the
  // second year, one who transferred out in the final year, and one who graduated.
  const seat: [string, Date | null, string][] = [
    ["stayer1", null, "ACTIVE"],
    ["stayer2", null, "ACTIVE"],
    ["early", new Date("2024-11-15T12:00:00Z"), "LEFT"],
    ["finalYearLeaver", new Date("2026-09-10T12:00:00Z"), "LEFT"],
    ["graduate", new Date("2027-05-20T12:00:00Z"), "COMPLETED"],
  ];
  for (const [who, leftAt, enrolment] of seat) {
    const u = await db.user.create({ data: { name: `ZZ TACR ${who}`, email: MAIL(who) }, select: { id: true } });
    ids[who] = (await db.membership.create({ data: { userId: u.id, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", leftAt }, select: { id: true } })).id;
    await db.studentProgramme.create({ data: { schoolId: ids.school!, studentMembershipId: ids[who]!, programmeId: ids.programme!, schemeId: scheme.id, entryYear: 2023 } });
    await db.programmeEnrolment.create({ data: { schoolId: ids.school!, studentMembershipId: ids[who]!, programmeId: ids.programme!, yearOfEntry: 2023, category: "OPEN", quota: "INSTITUTE", status: enrolment } });
  }

  // Two terms with the summer between them.
  const term = (name: string, startsOn: string, endsOn: string) => db.academicTerm.create({ data: { schoolId: ids.school!, name, academicYear: "2025–26", startsOn, endsOn, registrationOpensOn: startsOn, registrationClosesOn: startsOn }, select: { id: true } });
  ids.termA = (await term("ZZ TACR even term", "2026-01-05", "2026-05-31")).id;
  ids.termB = (await term("ZZ TACR odd term", "2026-07-01", "2026-11-30")).id;
  const credited = (credits: number, at: string) =>
    db.internship.create({ data: { schoolId: ids.school!, studentMembershipId: ids.stayer1!, companyName: `ZZ TACR Co ${credits}`, kind: "INDUSTRY", fromKey: "2026-01-10", toKey: "2026-01-20", hours: 120, windowSemester: 4, supervisorName: "ZZ", status: "CREDITED", credits, creditedAt: new Date(at) } });
  await credited(5, "2026-03-10T06:00:00Z"); // inside the even term
  await credited(3, "2026-05-31T20:00:00Z"); // 01:30 on 1 June in India: after the even term ended
  await credited(4, "2026-06-22T06:00:00Z"); // the summer vacation, between the terms
  await credited(2, "2026-06-30T21:00:00Z"); // 02:30 on 1 July in India: the odd term's first day
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: ids.school! } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-089: the batch is its final-year students", () => {
  it("TA-089: a student who left before the final year, or left in it, is not in N; one who graduated is", async () => {
    const batch = await forSchool(ids.school!, () => batchStudents(ids.school!, 2027));
    expect(batch.map((s) => s.id).sort()).toEqual([ids.stayer1!, ids.stayer2!, ids.graduate!].sort());
    const table = await forSchool(ids.school!, () => placementTable(ids.school!, 2027));
    expect(table.finalYear).toBe(3);
    expect(table.byProgramme.map((p) => p.finalYear)).toEqual([3]);
  });
});

describe("TA-091: every credited internship reaches a term's credit push", () => {
  it("TA-091: a credit is the first term's ending on or after its day by the college's clock, a vacation's included", async () => {
    const [a, b] = await forSchool(ids.school!, async () => [await internshipCreditsForTerm(ids.stayer1!, ids.termA!), await internshipCreditsForTerm(ids.stayer1!, ids.termB!)]);
    expect({ even: a, odd: b }).toEqual({ even: 5, odd: 9 });
  });
});
