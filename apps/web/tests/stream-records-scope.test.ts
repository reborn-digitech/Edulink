/**
 * DEPARTMENT ROLES READ AND WRITE THEIR OWN DEPARTMENT'S RECORDS (A3-S-10,
 * A3-S-11; audit of 5 October 2026).
 *
 * The security layer found a FACULTY or HOD of a law college could overwrite
 * any moot court by its id (the BCI return reads them), and that four reads
 * gave a department role the whole college: every division's lab batches with
 * names, every teacher's API-score inputs to the research dean, every law
 * student's internship weeks to any HOD, and the whole college's "what you
 * did last" feed to an HOD. A college of this suite's own (law and
 * engineering), two departments each with its HOD, division and students,
 * proves what each role now gets.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { classCode } from "@/lib/codes";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { labBatches, lawInternships, mootCourts, saveMootCourt } from "@/lib/stream-records";
import { researchDesk } from "@/lib/duty-desks";
import { nbaInsights } from "@/lib/iqac-insights";
import { NAV } from "@/lib/nav";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-srscope-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  return (await getSession()) as ActiveContext;
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ SRS ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ SRS Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { contactEmail: MAIL("contact"), timezone: TZ, name: `ZZ SRS Law College ${STAMP}`, kind: "COLLEGE", streams: ["LAW", "ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
  const C = ids.college!;
  for (const [who, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["mechHod", "HOD"], ["lawHod", "HOD"], ["teacher", "FACULTY"], ["other", "FACULTY"], ["dean", "FACULTY"]] as const) await person(who, role);
  for (let n = 1; n <= 4; n += 1) await person(`s${n}`, "STUDENT");
  ids.mech = (await db.department.create({ data: { schoolId: C, code: "MECH", name: "ZZ SRS Mechanical", hodMembershipId: ids.mechHodM }, select: { id: true } })).id;
  ids.law = (await db.department.create({ data: { schoolId: C, code: "LAW", name: "ZZ SRS Law", hodMembershipId: ids.lawHodM }, select: { id: true } })).id;
  const programme = (departmentId: string, code: string, stream: string, years: number, regulator: string) => db.programme.create({ data: { schoolId: C, departmentId, code, name: `ZZ SRS ${code}`, level: "UG", durationYears: years, intake: 60, regulator, stream }, select: { id: true } });
  ids.btech = (await programme(ids.mech!, "BTECH", "ENGINEERING", 4, "AICTE")).id;
  ids.llb = (await programme(ids.law!, "LLB", "LAW", 3, "BCI")).id;
  for (const [key, programmeId] of [["btech", ids.btech!], ["llb", ids.llb!]] as const) {
    ids[`${key}Scheme`] = (await db.scheme.create({ data: { schoolId: C, programmeId, name: "ZZ SRS scheme", effectiveYear: 2025 }, select: { id: true } })).id;
    const klass = await db.class.create({ data: { schoolId: C, name: `ZZ SRS FY ${key} A`, gradeLevel: "1", subject: key.toUpperCase(), joinCode: classCode() }, select: { id: true } });
    ids[`${key}Division`] = (await db.division.create({ data: { schoolId: C, classId: klass.id, programmeId, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } })).id;
    const students = key === "btech" ? ["s1", "s2"] : ["s3", "s4"];
    for (const [i, s] of students.entries()) {
      await db.studentProgramme.create({ data: { schoolId: C, studentMembershipId: ids[`${s}M`]!, programmeId, schemeId: ids[`${key}Scheme`]!, entryYear: 2026, divisionId: ids[`${key}Division`]! } });
      await db.enrollment.create({ data: { schoolId: C, classId: klass.id, studentMembershipId: ids[`${s}M`]!, rollNumber: i + 1 } });
    }
  }
  // The teacher teaches one engineering lab course in the BTech division and nothing in law.
  const course = await db.course.create({ data: { schoolId: C, schemeId: ids.btechScheme!, code: "ME101", name: "ZZ SRS Mechanics", semester: 1, creditsL: 3, creditsP: 1 }, select: { id: true } });
  const term = await db.academicTerm.create({ data: { schoolId: C, name: "ZZ SRS term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -40), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -50), registrationClosesOn: addDaysToKey(TODAY, -30) }, select: { id: true } });
  await db.courseOffering.create({ data: { schoolId: C, termId: term.id, courseId: course.id, divisionId: ids.btechDivision!, facultyMembershipId: ids.teacherM!, practicalHours: 2 } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }] } });
    await db.invite.deleteMany({ where: { schoolId: ids.college } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const divisionsOf = async (who: string, role: string) => (await labBatches(await as(who, role))).divisions.map((d) => d.divisionId).sort();

describe("lab batches (A3-S-11)", () => {
  it("are the whole college's to the office and the head, a teacher's own divisions to a FACULTY, the department's to an HOD", async () => {
    const both = [ids.btechDivision!, ids.llbDivision!].sort();
    expect(await divisionsOf("admin", "ADMIN")).toEqual(both);
    expect(await divisionsOf("principal", "PRINCIPAL")).toEqual(both);
    expect(await divisionsOf("teacher", "FACULTY")).toEqual([ids.btechDivision]);
    expect(await divisionsOf("other", "FACULTY")).toEqual([]);
    expect(await divisionsOf("mechHod", "HOD")).toEqual([ids.btechDivision]);
    expect(await divisionsOf("lawHod", "HOD")).toEqual([ids.llbDivision]);
    // Asking for another department's division by its id reads nothing either.
    expect((await labBatches(await as("teacher", "FACULTY"), { divisionId: ids.llbDivision! })).divisions).toEqual([]);
  });
});

describe("a moot court (A3-S-10)", () => {
  const moot = (name: string) => ({ name, at: addDaysToKey(TODAY, -3), kind: "INTRA" as const, teams: [{ name: "ZZ Team A", membershipIds: [ids.s3M!], outcome: "WINNER" as const }, { name: "ZZ Team B", membershipIds: [ids.s4M!], outcome: "RUNNER_UP" as const }], result: "ZZ A won", judgeNotes: "" });

  it("is recorded by a faculty member and corrected only by its author, the office or the law department's HOD", async () => {
    const { id } = await saveMootCourt(await as("teacher", "FACULTY"), moot("ZZ SRS moot"));
    for (const [who, role] of [["other", "FACULTY"], ["mechHod", "HOD"]] as const) {
      await expect(saveMootCourt(await as(who, role), { ...moot("ZZ SRS rewritten"), id })).rejects.toMatchObject({ key: "streamRecords.refuseNotYourMoot" });
    }
    expect((await db.mootCourt.findUniqueOrThrow({ where: { id }, select: { name: true } })).name).toBe("ZZ SRS moot");
    for (const [who, role, name] of [["teacher", "FACULTY", "ZZ SRS by author"], ["lawHod", "HOD", "ZZ SRS by law HOD"], ["admin", "ADMIN", "ZZ SRS by office"]] as const) {
      await saveMootCourt(await as(who, role), { ...moot(name), id });
      expect((await db.mootCourt.findUniqueOrThrow({ where: { id }, select: { name: true } })).name).toBe(name);
    }
    // A FACULTY and an HOD read the college's moots (the page they record them on).
    expect((await mootCourts(await as("other", "FACULTY"))).items.map((m) => m.id)).toContain(id);
  });
});

describe("a page for a faculty member's and an HOD's moots (A3-inventory-4)", () => {
  it("is in the FACULTY and HOD menus at a law college, and draws the office's form", () => {
    for (const role of ["FACULTY", "HOD"] as const) expect(NAV[role].find((n) => n.href === "/faculty/moot-courts")).toMatchObject({ module: "ACADEMICS", streams: ["LAW"] });
    const page = join(process.cwd(), "src/app/(app)/faculty/moot-courts/page.tsx");
    expect(existsSync(page)).toBe(true);
    expect(readFileSync(page, "utf8")).toMatch(/MootCourtsPage roles=\{\["FACULTY", "HOD"\]\}/);
  });
});

describe("the research dean (A3-S-11)", () => {
  it("reads the register and the counts but no teacher's API score; the office keeps the detail", async () => {
    await setDuties(await as("admin", "ADMIN"), ids.deanM!, ["RESEARCH_DEAN"]);
    await db.researchItem.create({ data: { schoolId: ids.college!, kind: "PUBLICATION", title: "ZZ SRS Paper", indexing: "SCOPUS", year: 2026, facultyMembershipId: ids.teacherM! } });
    await db.facultyRecord.create({ data: { schoolId: ids.college!, membershipId: ids.teacherM!, designation: "ASSISTANT_PROFESSOR", appointment: "REGULAR", highestQualification: "PHD", apiScoreJson: JSON.stringify({ teaching: 60, research: 40, service: 15 }) } });
    const dean = await researchDesk(await as("dean", "FACULTY"));
    const row = dean.perFaculty.find((f) => f.membershipId === ids.teacherM)!;
    expect(row).toMatchObject({ publications: 1, apiScore: null, apiScoreInputs: null });
    expect(dean.perFaculty.every((f) => f.apiScore === null && f.apiScoreInputs === null)).toBe(true);
    const office = await researchDesk(await as("admin", "ADMIN"));
    expect(office.perFaculty.find((f) => f.membershipId === ids.teacherM)).toMatchObject({ apiScore: 115, apiScoreInputs: { teaching: 60, research: 40, service: 15 } });
  });
});

describe("law internships (A3-S-11)", () => {
  it("give an HOD the weeks of their own department's students only; the office every law student", async () => {
    const names = async (who: string, role: string) => (await lawInternships(await as(who, role))).perStudent.map((s) => s.studentMembershipId).sort();
    const law = [ids.s3M!, ids.s4M!].sort();
    expect(await names("admin", "ADMIN")).toEqual(law);
    expect(await names("lawHod", "HOD")).toEqual(law);
    expect(await names("mechHod", "HOD")).toEqual([]);
  });
});

describe("the HOD's 'what you did last' (A3-S-11)", () => {
  it("is their department's worksheet and their own actions, not the college's audit log", async () => {
    const year = 2026;
    await db.auditLog.createMany({
      data: [
        { schoolId: ids.college!, actorUserId: ids.admin!, action: "iqac.worksheet.save", targetType: "FilingWorksheet", targetId: `NBA_SAR:${year}:${ids.mech}`, meta: "{}" },
        { schoolId: ids.college!, actorUserId: ids.admin!, action: "iqac.worksheet.save", targetType: "FilingWorksheet", targetId: `NBA_SAR:${year}:${ids.law}`, meta: "{}" },
        { schoolId: ids.college!, actorUserId: ids.admin!, action: "iqac.research.save", targetType: "ResearchItem", targetId: "zz-other", meta: "{}" },
        { schoolId: ids.college!, actorUserId: ids.mechHod!, action: "academics.course.save", targetType: "Course", targetId: "zz-own", meta: "{}" },
      ],
    });
    const hod = await nbaInsights(await as("mechHod", "HOD"), { year });
    expect(hod.lastDone.map((r) => r.action).sort()).toEqual(["academics.course.save", "iqac.worksheet.save"]);
    expect(hod.lastDone.every((r) => r.by === "ZZ SRS admin" || r.by === "ZZ SRS mechHod")).toBe(true);
    const admin = await nbaInsights(await as("admin", "ADMIN"), { year });
    expect(admin.lastDone.length).toBe(4);
  });
});
