/**
 * The councils' returns: three findings of the testing analysis of 13 November 2026 in
 * lib/council-filings.ts.
 *
 *   TA-273  The PCI inspection data counted every lab and every practical record of the college, the
 *           engineering ones too, as the pharmacy programmes'.
 *   TA-073  The NBA SAR picked its three graduated batches by entry year across programmes of different
 *           length, so a department with an M.Tech beside its B.Tech reported the M.Tech's cohorts.
 *   TA-480  An HOD who heads two engineering departments reached only one department's SAR.
 *
 * One scratch ZZ college of this suite's own (made through the owner connection, removed after) with
 * pharmacy and engineering: a pharmacy lab and an engineering lab, each used by its own course with one
 * practical record; a mechanical department with a four-year B.Tech and a two-year M.Tech; an IT
 * department; one HOD heading mechanical and IT.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { councilDocument, councilOverview, nbaDepartmentFor, nbaFacts } from "@/lib/council-filings";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-taiqc-${who}-${STAMP}@test.invalid`;
const YEAR = 2026;
const ids = { school: "", ph: "", me: "", it: "", btech: "", mtech: "", btechScheme: "", mtechScheme: "", hodU: "", hodM: "" };

async function seat(who: string, programmeId: string, schemeId: string, entryYear: number) {
  const u = await db.user.create({ data: { name: `ZZ TA Council ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } });
  const m = await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  await db.studentProgramme.create({ data: { schoolId: ids.school, studentMembershipId: m.id, programmeId, schemeId, entryYear, status: "ACTIVE" } });
  return m.id;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA IQAC Council ${STAMP}`, slug: `zz-taiqc-${STAMP}`, code: `ZTQC${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true, streamsJson: JSON.stringify(["ENGINEERING", "PHARMACY"]) }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "ACADEMICS" }, { schoolId: ids.school, module: "IQAC" }] });
  ids.hodU = (await db.user.create({ data: { name: "ZZ TA Council Hod", email: MAIL("hod"), prefs: "{}" }, select: { id: true } })).id;
  ids.hodM = (await db.membership.create({ data: { userId: ids.hodU, schoolId: ids.school, role: "HOD", status: "ACTIVE" }, select: { id: true } })).id;
  ids.ph = (await db.department.create({ data: { schoolId: ids.school, code: "ZPH", name: "ZZ Pharmacy" }, select: { id: true } })).id;
  ids.me = (await db.department.create({ data: { schoolId: ids.school, code: "ZME", name: "ZZ Mechanical", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  ids.it = (await db.department.create({ data: { schoolId: ids.school, code: "ZIT", name: "ZZ Information Technology", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  const bpharm = (await db.programme.create({ data: { schoolId: ids.school, departmentId: ids.ph, code: "ZBPH", name: "ZZ B.Pharm", level: "UG", durationYears: 4, intake: 60, regulator: "PCI", stream: "PHARMACY" }, select: { id: true } })).id;
  ids.btech = (await db.programme.create({ data: { schoolId: ids.school, departmentId: ids.me, code: "ZBME", name: "ZZ B.Tech Mechanical", level: "UG", durationYears: 4, intake: 60, regulator: "AICTE", stream: "ENGINEERING" }, select: { id: true } })).id;
  ids.mtech = (await db.programme.create({ data: { schoolId: ids.school, departmentId: ids.me, code: "ZMME", name: "ZZ M.Tech Mechanical", level: "PG", durationYears: 2, intake: 18, regulator: "AICTE", stream: "ENGINEERING" }, select: { id: true } })).id;
  await db.programme.create({ data: { schoolId: ids.school, departmentId: ids.it, code: "ZBIT", name: "ZZ B.Tech IT", level: "UG", durationYears: 4, intake: 60, regulator: "AICTE", stream: "ENGINEERING" } });
  const phScheme = (await db.scheme.create({ data: { schoolId: ids.school, programmeId: bpharm, name: "ZZ BPharm 2026", effectiveYear: YEAR }, select: { id: true } })).id;
  ids.btechScheme = (await db.scheme.create({ data: { schoolId: ids.school, programmeId: ids.btech, name: "ZZ BTech 2020", effectiveYear: 2020 }, select: { id: true } })).id;
  ids.mtechScheme = (await db.scheme.create({ data: { schoolId: ids.school, programmeId: ids.mtech, name: "ZZ MTech 2023", effectiveYear: 2023 }, select: { id: true } })).id;
  // Two labs, each used by its own stream's course, and one practical record on each.
  const term = (await db.academicTerm.create({ data: { schoolId: ids.school, name: "ZZ Odd", academicYear: "2026-27", startsOn: `${YEAR}-07-01`, endsOn: `${YEAR}-11-30`, registrationOpensOn: `${YEAR}-07-01`, registrationClosesOn: `${YEAR}-07-15` }, select: { id: true } })).id;
  const labPh = (await db.room.create({ data: { schoolId: ids.school, name: "ZZ Pharmaceutics Lab", capacity: 30, kind: "LAB" }, select: { id: true } })).id;
  const labMe = (await db.room.create({ data: { schoolId: ids.school, name: "ZZ Fluid Mechanics Lab", capacity: 30, kind: "LAB" }, select: { id: true } })).id;
  const bp101 = (await db.course.create({ data: { schoolId: ids.school, schemeId: phScheme, code: "ZBP101", name: "ZZ Pharmaceutics", semester: 1 }, select: { id: true } })).id;
  const me201 = (await db.course.create({ data: { schoolId: ids.school, schemeId: ids.btechScheme, code: "ZME201", name: "ZZ Fluid Mechanics", semester: 3 }, select: { id: true } })).id;
  const oPh = (await db.courseOffering.create({ data: { schoolId: ids.school, termId: term, courseId: bp101, roomId: labPh }, select: { id: true } })).id;
  const oMe = (await db.courseOffering.create({ data: { schoolId: ids.school, termId: term, courseId: me201, roomId: labMe }, select: { id: true } })).id;
  const phStudent = await seat("ph1", bpharm, phScheme, YEAR);
  const meStudent = await seat("me1", ids.btech, ids.btechScheme, 2025);
  await db.practicalRecord.create({ data: { schoolId: ids.school, offeringId: oPh, studentMembershipId: phStudent, experimentNo: 1, title: "ZZ tablets", performedOn: `${YEAR}-08-01` } });
  await db.practicalRecord.create({ data: { schoolId: ids.school, offeringId: oMe, studentMembershipId: meStudent, experimentNo: 1, title: "ZZ Bernoulli", performedOn: `${YEAR}-08-01` } });
  // Mechanical: B.Tech batches of 2020, 2021 and 2022 (final years 2023, 2024, 2025); M.Tech batches of 2023 and 2024 (final years 2024, 2025).
  for (const e of [2020, 2021, 2022]) await seat(`bt${e}`, ids.btech, ids.btechScheme, e);
  for (const e of [2023, 2024]) await seat(`mt${e}`, ids.mtech, ids.mtechScheme, e);
}, 120_000);

afterAll(async () => {
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-273: the PCI return is the pharmacy programmes'", () => {
  it("TA-273: the engineering lab and the engineering practical are left out: labs 1, practical records 1", async () => {
    const built = await councilDocument(ids.school, "PCI_INSPECTION", YEAR, null, { snapshot: "live" });
    expect(built.figures.labs).toBe(1);
    expect(built.figures.practicalRecords).toBe(1);
    expect(built.figures.practicalStudents).toBe(1);
    expect(JSON.stringify(built.document)).not.toContain("Fluid Mechanics");
  }, 60_000);
});

describe("TA-073: the SAR's graduated batches", () => {
  it("TA-073: the batches are the B.Tech's whose final years were 2025, 2024 and 2023, not the M.Tech's entries", async () => {
    const f = await nbaFacts(ids.school, ids.me, YEAR);
    expect(f.batches.map((b) => b.entryYear)).toEqual([2022, 2021, 2020]);
    expect(f.batches.every((b) => b.admitted === 1)).toBe(true);
  }, 60_000);
});

describe("TA-480: an HOD of two departments", () => {
  const ctx = (): ActiveContext => ({
    sessionId: "test",
    membershipId: ids.hodM,
    schoolId: ids.school,
    role: "HOD" as ActiveContext["role"],
    user: { id: ids.hodU, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  });

  it("TA-480: reaches both departments' SARs, and the overview lists both", async () => {
    const desk = { schoolId: ids.school, userId: ids.hodU, role: "HOD" as const, membershipId: ids.hodM };
    await expect(nbaDepartmentFor(desk, ids.it)).resolves.toMatchObject({ id: ids.it });
    await expect(nbaDepartmentFor(desk, ids.me)).resolves.toMatchObject({ id: ids.me });
    const o = await councilOverview(ctx());
    expect(o.nbaDepartments.map((d) => d.id).sort()).toEqual([ids.it, ids.me].sort());
  }, 60_000);
});
