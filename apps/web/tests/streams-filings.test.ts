/**
 * The filings by stream and the councils' returns (5 October 2026), through
 * the /api/v1 doors with primed sessions, at two ZZ colleges of this suite's
 * own, removed afterwards:
 *
 *   ZZ CF Law — streams LAW: one law department, an LLB of three years, a
 *     law teacher, two students, a library of two titles, two moot courts
 *     (one in the year), two internships (one refused);
 *   ZZ CF Tech — streams ENGINEERING, PHARMACY and EDUCATION: a mechanical
 *     department (its head a professor with a doctorate, an assistant
 *     professor with a master's, a visiting associate professor), eight first
 *     years and two graduates of the 2021 batch (one gone on to higher
 *     studies); a pharmacy department with two laboratories, the asset
 *     register and the practical record; an education department with its
 *     practice schools and postings.
 *
 * What is proved: the gate by stream (the law college is answered 404 with
 * its sentence for the AICTE disclosure, its publication and the NBA SAR, and
 * the engineering one is not; the overview greys what the streams do not
 * bring and names the councils not built); each new return's figures against
 * the hand computation below; the NBA SAR's formulas by hand; the HOD's
 * worksheet (their own department only, no computed item, no mark above the
 * item's); the SAR one per department and year, rebuilt in place while a
 * draft and refused once the principal has it; every filing's hash is its
 * body's and regenerating it gives the figures it printed (the data audit's
 * iqac-filing check); the regulators' calendar and the IQAC's own calendar
 * filtered by stream; the audit rows.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { REGULATOR_DEADLINES, applicableFilings, deadlineApplies, filingApplies, streamsBringing, worksheetItems } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { actionKey } from "@/lib/safety-labels";
import { buildFiling } from "@/lib/iqac-filings";
import { nbaFacts } from "@/lib/council-filings";
import { regulatorCalendar } from "@/lib/operator-college";
import { academicPerformance, apiMarks, cadreMarks, enrolmentMarks, firstYearSfrMarks, placementMarks, qualificationMarks, sfrMarks, successIndex, successMarks } from "@/lib/council-rules";
import { GET as filingsGet, POST as filingsPost } from "@/app/api/v1/iqac/filings/route";
import { POST as submitPost } from "@/app/api/v1/iqac/filings/[filingId]/submit/route";
import { GET as fileGet } from "@/app/api/v1/iqac/filings/[filingId]/file/route";
import { POST as signoffPost } from "@/app/api/v1/iqac/filings/[filingId]/signoff/route";
import { GET as disclosureGet, POST as disclosurePost } from "@/app/api/v1/iqac/disclosure/route";
import { GET as overviewGet } from "@/app/api/v1/iqac/overview/route";
import { GET as councilGet } from "@/app/api/v1/iqac/council/route";
import { GET as pciGet } from "@/app/api/v1/iqac/council/pci/route";
import { GET as bciGet, POST as bciPost } from "@/app/api/v1/iqac/council/bci/route";
import { GET as ncteGet, POST as nctePost } from "@/app/api/v1/iqac/council/ncte/route";
import { GET as nbaGet, POST as nbaPost } from "@/app/api/v1/iqac/council/nba/route";
import { GET as nbaInsightsGet } from "@/app/api/v1/iqac/insights/nba/route";
import { GET as simulateNbaGet } from "@/app/api/v1/iqac/simulate/nba/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const YEAR = 2025; // the academic year 2025-26: 1 June 2025 to 31 May 2026
const NOT_APPLICABLE = "This college's streams do not bring that filing.";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
async function as(userId: string, schoolId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
}
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

const ids = {
  law: "",
  tech: "",
  operator: "",
  lawIqac: "",
  techIqac: "",
  techAdmin: "",
  techPrincipal: "",
  hodUser: "",
  facultyUser: "",
  mech: "",
  pharm: "",
  edu: "",
};

beforeAll(async () => {
  const college = (tag: string, streams: string[]) =>
    db.school.create({ data: { name: `ZZ CF ${tag} ${STAMP}`, slug: `zz-cf-${tag.toLowerCase()}-${STAMP}`, code: `ZCF${tag[0]}${SUFFIX}`, contactEmail: `zz-cf-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", streamsJson: JSON.stringify(streams) }, select: { id: true } });
  ids.law = (await college("Law", ["LAW"])).id;
  ids.tech = (await college("Tech", ["ENGINEERING", "PHARMACY", "EDUCATION"])).id;
  await db.schoolModule.createMany({ data: [ids.law, ids.tech].flatMap((schoolId) => [{ schoolId, module: "ACADEMICS" }, { schoolId, module: "IQAC" }]) });
  let n = 0;
  const user = async (who: string) => (await db.user.create({ data: { name: `ZZ CF ${who}`, email: `zz-cf-${who.toLowerCase().replace(/\W/g, "")}-${n++}-${STAMP}@test.invalid`, ...(who === "Operator" ? { isSuperuser: true } : {}) }, select: { id: true } })).id;
  const member = async (schoolId: string, role: string, who: string) => {
    const userId = await user(who);
    const m = await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } });
    return { userId, membershipId: m.id };
  };
  ids.operator = await user("Operator");
  ids.lawIqac = (await member(ids.law, "IQAC", "LawIqac")).userId;
  ids.techIqac = (await member(ids.tech, "IQAC", "TechIqac")).userId;
  ids.techAdmin = (await member(ids.tech, "ADMIN", "TechAdmin")).userId;
  ids.techPrincipal = (await member(ids.tech, "PRINCIPAL", "TechPrincipal")).userId;
  const record = (schoolId: string, membershipId: string, designation: string, highestQualification: string, appointment = "REGULAR") => db.facultyRecord.create({ data: { schoolId, membershipId, designation, highestQualification, appointment } });
  const seat = async (schoolId: string, programmeId: string, schemeId: string, entryYear: number, status = "ACTIVE", yearOfStudy = 1) => {
    const s = await member(schoolId, "STUDENT", "Student");
    await db.studentProgramme.create({ data: { schoolId, studentMembershipId: s.membershipId, programmeId, schemeId, entryYear, status, yearOfStudy } });
    return s.membershipId;
  };
  const term = (schoolId: string) => db.academicTerm.create({ data: { schoolId, name: `ZZ CF Odd ${STAMP}`, academicYear: "2025-26", startsOn: "2025-07-01", endsOn: "2025-11-30", registrationOpensOn: "2025-06-20", registrationClosesOn: "2025-07-15" }, select: { id: true } });

  /* ---- ZZ CF Law ---- */
  {
    const s = ids.law;
    const dept = await db.department.create({ data: { schoolId: s, code: "LAW", name: "ZZ Law" }, select: { id: true } });
    const llb = await db.programme.create({ data: { schoolId: s, departmentId: dept.id, code: "LLB", name: "ZZ LLB", level: "UG", durationYears: 3, intake: 60, regulator: "BCI", stream: "LAW" }, select: { id: true } });
    const scheme = await db.scheme.create({ data: { schoolId: s, programmeId: llb.id, name: "ZZ LLB 2025", effectiveYear: 2025 }, select: { id: true } });
    const l1 = await member(s, "FACULTY", "LawTeacher");
    await db.departmentFaculty.create({ data: { schoolId: s, departmentId: dept.id, membershipId: l1.membershipId } });
    await record(s, l1.membershipId, "ASSOCIATE_PROFESSOR", "PHD");
    const s1 = await seat(s, llb.id, scheme.id, 2025);
    const s2 = await seat(s, llb.id, scheme.id, 2025);
    const t1 = await db.libraryTitle.create({ data: { schoolId: s, title: "ZZ Constitutional Law", category: "LAW" }, select: { id: true } });
    const t2 = await db.libraryTitle.create({ data: { schoolId: s, title: "ZZ General Reader", category: "GENERAL" }, select: { id: true } });
    await db.libraryCopy.createMany({ data: [{ schoolId: s, titleId: t1.id, accession: `ZZCF-1-${SUFFIX}` }, { schoolId: s, titleId: t1.id, accession: `ZZCF-2-${SUFFIX}`, status: "WITHDRAWN" }, { schoolId: s, titleId: t2.id, accession: `ZZCF-3-${SUFFIX}`, status: "ISSUED" }] });
    await db.mootCourt.createMany({ data: [{ schoolId: s, name: "ZZ Intra moot", at: "2025-09-10", kind: "INTRA", teamsJson: JSON.stringify([{ membershipIds: [s1, s2] }]) }, { schoolId: s, name: "ZZ Old moot", at: "2024-02-01", kind: "INTER", teamsJson: "[]" }] });
    await db.internship.createMany({
      data: [
        { schoolId: s, studentMembershipId: s1, companyName: "ZZ District Court", kind: "COURT", fromKey: "2025-12-01", toKey: "2025-12-28", hours: 120, windowSemester: 3, supervisorName: "ZZ Judge", status: "EVALUATED" },
        { schoolId: s, studentMembershipId: s2, companyName: "ZZ Chambers", kind: "FIRM", fromKey: "2025-11-01", toKey: "2025-11-14", hours: 60, windowSemester: 3, supervisorName: "ZZ Advocate", status: "REFUSED" },
      ],
    });
  }

  /* ---- ZZ CF Tech ---- */
  {
    const s = ids.tech;
    const t = await term(s);
    // Mechanical engineering.
    ids.mech = (await db.department.create({ data: { schoolId: s, code: "MECH", name: "ZZ Mechanical" }, select: { id: true } })).id;
    const be = await db.programme.create({ data: { schoolId: s, departmentId: ids.mech, code: "BEME", name: "ZZ BE Mechanical", level: "UG", durationYears: 4, intake: 10, regulator: "AICTE", stream: "ENGINEERING" }, select: { id: true } });
    const beScheme = await db.scheme.create({ data: { schoolId: s, programmeId: be.id, name: "ZZ BE 2021", effectiveYear: 2021 }, select: { id: true } });
    const hod = await member(s, "HOD", "MechHod");
    ids.hodUser = hod.userId;
    await db.department.update({ where: { id: ids.mech }, data: { hodMembershipId: hod.membershipId } });
    await record(s, hod.membershipId, "PROFESSOR", "PHD");
    const f2 = await member(s, "FACULTY", "MechAssistant");
    ids.facultyUser = f2.userId;
    const f3 = await member(s, "FACULTY", "MechVisiting");
    await db.departmentFaculty.createMany({ data: [{ schoolId: s, departmentId: ids.mech, membershipId: f2.membershipId }, { schoolId: s, departmentId: ids.mech, membershipId: f3.membershipId }] });
    await record(s, f2.membershipId, "ASSISTANT_PROFESSOR", "PG");
    await record(s, f3.membershipId, "ASSOCIATE_PROFESSOR", "PG", "VISITING");
    for (let i = 0; i < 8; i++) await seat(s, be.id, beScheme.id, 2025);
    const grads = [await seat(s, be.id, beScheme.id, 2021, "COMPLETED", 4), await seat(s, be.id, beScheme.id, 2021, "COMPLETED", 4)];
    // R-20 (10 Oct 2026): 4.2 reads the enrolment's COMPLETED with the leaving date, as leaveCollege writes them;
    // the 2021 batch's final year is 2024-25, so both left on 20 May 2025, inside it.
    for (const g of grads) {
      await db.programmeEnrolment.create({ data: { schoolId: s, studentMembershipId: g, programmeId: be.id, yearOfEntry: 2021, category: "OPEN", quota: "GENERAL", status: "COMPLETED" } });
      await db.membership.update({ where: { id: g }, data: { leftAt: new Date("2025-05-20T12:00:00Z") } });
    }
    await db.placementProfile.create({ data: { schoolId: s, studentMembershipId: grads[0]!, higherStudies: true } });
    const me101 = await db.course.create({ data: { schoolId: s, schemeId: beScheme.id, code: "ME101", name: "ZZ Engineering Mechanics", semester: 1 }, select: { id: true } });
    await db.courseOffering.create({ data: { schoolId: s, termId: t.id, courseId: me101.id, facultyMembershipId: f2.membershipId } });

    // Pharmacy.
    ids.pharm = (await db.department.create({ data: { schoolId: s, code: "PHARM", name: "ZZ Pharmaceutics" }, select: { id: true } })).id;
    const bp = await db.programme.create({ data: { schoolId: s, departmentId: ids.pharm, code: "BPHARM", name: "ZZ B Pharm", level: "UG", durationYears: 4, intake: 60, regulator: "PCI", stream: "PHARMACY" }, select: { id: true } });
    const bpScheme = await db.scheme.create({ data: { schoolId: s, programmeId: bp.id, name: "ZZ BPharm 2025", effectiveYear: 2025 }, select: { id: true } });
    const p1 = await member(s, "FACULTY", "PharmTeacher1");
    const p2 = await member(s, "FACULTY", "PharmTeacher2");
    await db.departmentFaculty.createMany({ data: [{ schoolId: s, departmentId: ids.pharm, membershipId: p1.membershipId }, { schoolId: s, departmentId: ids.pharm, membershipId: p2.membershipId }] });
    await record(s, p1.membershipId, "ASSOCIATE_PROFESSOR", "PHD");
    const ph = [await seat(s, bp.id, bpScheme.id, 2025), await seat(s, bp.id, bpScheme.id, 2025), await seat(s, bp.id, bpScheme.id, 2025), await seat(s, bp.id, bpScheme.id, 2024, "ACTIVE", 2)];
    await db.room.createMany({ data: [{ schoolId: s, name: "ZZ Pharmaceutics Lab", capacity: 30, kind: "LAB" }, { schoolId: s, name: "ZZ Pharmacognosy Lab", capacity: 20, kind: "LAB" }, { schoolId: s, name: "ZZ Room 1", capacity: 60, kind: "CLASSROOM" }] });
    await db.asset.createMany({
      data: [
        { schoolId: s, tagNumber: `ZZCF-A1-${SUFFIX}`, name: "ZZ Tablet press", location: "ZZ Pharmaceutics Lab", status: "IN_USE" },
        { schoolId: s, tagNumber: `ZZCF-A2-${SUFFIX}`, name: "ZZ Dissolution tester", location: "ZZ Pharmaceutics Lab", status: "IN_USE" },
        { schoolId: s, tagNumber: `ZZCF-A3-${SUFFIX}`, name: "ZZ Old microscope", location: "ZZ Pharmacognosy Lab", status: "DISPOSED" },
        { schoolId: s, tagNumber: `ZZCF-A4-${SUFFIX}`, name: "ZZ Projector", location: "ZZ Room 1", status: "IN_USE" },
      ],
    });
    const item = await db.inventoryItem.create({ data: { schoolId: s, code: `ZZCF-I-${SUFFIX}`, name: "ZZ Lactose", unit: "kg" }, select: { id: true } });
    const item2 = await db.inventoryItem.create({ data: { schoolId: s, code: `ZZCF-J-${SUFFIX}`, name: "ZZ Starch", unit: "kg" }, select: { id: true } });
    await db.inventoryStock.createMany({ data: [{ schoolId: s, itemId: item.id, location: "ZZ Pharmaceutics Lab", quantity: 5 }, { schoolId: s, itemId: item2.id, location: "ZZ Pharmaceutics Lab", quantity: 0 }] });
    const bp101 = await db.course.create({ data: { schoolId: s, schemeId: bpScheme.id, code: "BP101", name: "ZZ Pharmaceutics I", semester: 1, creditsP: 2 }, select: { id: true } });
    const bpOff = await db.courseOffering.create({ data: { schoolId: s, termId: t.id, courseId: bp101.id, facultyMembershipId: p1.membershipId }, select: { id: true } });
    await db.practicalRecord.createMany({
      data: [
        { schoolId: s, offeringId: bpOff.id, studentMembershipId: ph[0]!, experimentNo: 1, title: "ZZ Tablets", performedOn: "2025-08-01", signedAt: new Date("2025-08-02T00:00:00Z"), signedByMembershipId: p1.membershipId },
        { schoolId: s, offeringId: bpOff.id, studentMembershipId: ph[1]!, experimentNo: 1, title: "ZZ Tablets", performedOn: "2025-08-01" },
        { schoolId: s, offeringId: bpOff.id, studentMembershipId: ph[2]!, experimentNo: 1, title: "ZZ Old", performedOn: "2024-01-10" },
      ],
    });

    // Teacher education.
    ids.edu = (await db.department.create({ data: { schoolId: s, code: "EDU", name: "ZZ Pedagogy" }, select: { id: true } })).id;
    const bed = await db.programme.create({ data: { schoolId: s, departmentId: ids.edu, code: "BED", name: "ZZ B Ed", level: "UG", durationYears: 2, intake: 50, regulator: "NCTE", stream: "EDUCATION" }, select: { id: true } });
    const bedScheme = await db.scheme.create({ data: { schoolId: s, programmeId: bed.id, name: "ZZ BEd 2025", effectiveYear: 2025 }, select: { id: true } });
    const e1 = await member(s, "FACULTY", "EduTeacher1");
    const e2 = await member(s, "FACULTY", "EduTeacher2");
    await db.departmentFaculty.createMany({ data: [{ schoolId: s, departmentId: ids.edu, membershipId: e1.membershipId }, { schoolId: s, departmentId: ids.edu, membershipId: e2.membershipId }] });
    const b1 = await seat(s, bed.id, bedScheme.id, 2025);
    const b2 = await seat(s, bed.id, bedScheme.id, 2025);
    const school = await db.practiceSchool.create({ data: { schoolId: s, name: "ZZ Practice School", udise: "27000000001" }, select: { id: true } });
    await db.practiceSchool.create({ data: { schoolId: s, name: "ZZ Closed School", archivedAt: new Date() } });
    const posting = await db.teachingPracticePosting.create({ data: { schoolId: s, studentMembershipId: b1, practiceSchoolId: school.id, fromKey: "2025-07-01", toKey: "2025-09-30", lessonsPlanned: 12 }, select: { id: true } });
    await db.teachingPracticePosting.create({ data: { schoolId: s, studentMembershipId: b2, practiceSchoolId: school.id, fromKey: "2024-07-01", toKey: "2024-08-01", lessonsPlanned: 5 } });
    await db.lessonObservation.createMany({ data: [{ schoolId: s, postingId: posting.id, at: "2025-07-15", observerMembershipId: e1.membershipId, grade: "A" }, { schoolId: s, postingId: posting.id, at: "2025-08-15", observerMembershipId: e2.membershipId, grade: "B" }] });
  }
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.law, ids.tech] } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.law, ids.tech] } } }).catch(() => undefined);
  await db.school.deleteMany({ where: { id: { in: [ids.law, ids.tech] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the preset and the formulas", () => {
  it("brings each council's return with its stream, the AICTE disclosure with management, engineering and pharmacy, the university's return with every college, and keeps the seven where no stream is recorded", () => {
    expect(applicableFilings(["LAW"])).toEqual(["SSR", "AQAR", "IIQA", "NIRF", "AISHE", "AFFILIATION_RETURN", "BCI_RETURN"]);
    expect(applicableFilings(["ENGINEERING"])).toContain("NBA_SAR");
    expect(applicableFilings(["PHARMACY"])).toEqual(expect.arrayContaining(["AICTE_DISCLOSURE", "AFFILIATION_RETURN", "PCI_INSPECTION"]));
    expect(applicableFilings(["EDUCATION"])).toContain("NCTE_RETURN");
    expect(applicableFilings(["HEALTH_SCIENCES"])).toEqual(["SSR", "AQAR", "IIQA", "NIRF", "AISHE", "AFFILIATION_RETURN"]);
    expect(applicableFilings([])).toEqual(expect.arrayContaining(["SSR", "AQAR", "IIQA", "NIRF", "AISHE", "AICTE_DISCLOSURE", "AFFILIATION_RETURN"]));
    expect(streamsBringing("AFFILIATION_RETURN")).toContain("LAW");
    expect(streamsBringing("AICTE_DISCLOSURE")).toEqual(["MANAGEMENT", "ENGINEERING", "PHARMACY"]);
    expect(filingApplies("AICTE_DISCLOSURE", ["LAW"])).toBe(false);
    // NBA SAR Tier-II is 1,000 marks over its items.
    expect(worksheetItems("NBA_SAR").reduce((a, i) => a + (i.marks ?? 0), 0)).toBe(1000);
    expect(worksheetItems("BCI_RETURN")).toHaveLength(14);
    expect(worksheetItems("NCTE_RETURN")).toHaveLength(14);
  });

  it("scores the SAR's quantitative items as the format's formulas do by hand", () => {
    // 4.1: 45 admitted to an intake of 60 is 75 % — 16 marks.
    expect(enrolmentMarks(45, 60)).toEqual({ ratio: 75, marks: 16 });
    expect(enrolmentMarks(0, 0)).toEqual({ ratio: null, marks: 0 });
    // 4.2: batches at 0.8 and 0.6 (and one nobody joined) average 0.7: 25 × 0.7 = 17.5.
    expect(successMarks([successIndex(8, 10), successIndex(6, 10), successIndex(0, 0)], 25)).toEqual({ mean: 0.7, marks: 17.5 });
    // 4.3: GPAs 8 and 6 succeed of four who sat: 7 × 2/4 = 3.5; × 1.5 = 5.25.
    expect(academicPerformance([8, 6], 4)).toBe(3.5);
    expect(apiMarks(3.5, 1.5, 15)).toBe(5.25);
    // 4.5: indices 0.5 and 1 average 0.75: 30 marks.
    expect(placementMarks([0.5, 1, null])).toEqual({ mean: 0.75, marks: 30 });
    // 5.1: 20:1 is 15 marks (20 at 15:1 falling to 10 at 25:1), 30:1 is none.
    expect(sfrMarks(200, 10)).toEqual({ ratio: 20, marks: 15 });
    expect(sfrMarks(300, 10)).toEqual({ ratio: 30, marks: 0 });
    // 5.2: 180 students need 9 (1:2:6); 1 professor, 1 associate, 3 assistants: (1 + 0.6 × 0.5 + 0.4 × 0.5) × 12.5 = 18.75.
    expect(cadreMarks(180, 1, 1, 3)).toBe(18.75);
    expect(cadreMarks(180, 0, 0, 9)).toBe(0);
    // 5.3: 180 students need 9; 2 PhDs and 4 masters: 2.5 × (20 + 16) / 9 = 10.
    expect(qualificationMarks(180, 2, 4)).toEqual({ fq: 10, marks: 10 });
    // 8.1: 22 first years a teacher is 3 marks.
    expect(firstYearSfrMarks(44, 2)).toEqual({ ratio: 22, marks: 3 });
  });
});

describe("the gate by stream", () => {
  it("answers a law college 404 with its sentence for the AICTE disclosure, its publication and the NBA SAR, and lets its BCI return through", async () => {
    await as(ids.lawIqac, ids.law, "IQAC");
    const refused = await filingsPost(json("/api/v1/iqac/filings", { kind: "AICTE_DISCLOSURE", year: YEAR }));
    expect(refused.status).toBe(404);
    expect(await body(refused)).toMatchObject({ error: NOT_APPLICABLE, code: "NOT_FOUND" });
    expect((await disclosureGet()).status).toBe(404);
    expect((await disclosurePost(json("/x", { publish: true }))).status).toBe(404);
    expect((await nbaGet(get("/api/v1/iqac/council/nba"))).status).toBe(404);
    expect((await pciGet(get("/api/v1/iqac/council/pci"))).status).toBe(404);
    expect((await bciGet(get(`/api/v1/iqac/council/bci?year=${YEAR}`))).status).toBe(200);
    // The overview greys what law does not bring, with the streams that would, and names the councils not built.
    const o = await body<{ streams: string[]; items: { kind: string; applies: boolean; streams: string[] }[]; notBuilt: { stream: string; councils: string[]; here: boolean }[]; nbaDepartments: unknown[] }>(await councilGet());
    expect(o.streams).toEqual(["LAW"]);
    expect(o.items.find((i) => i.kind === "AICTE_DISCLOSURE")).toEqual(expect.objectContaining({ applies: false, streams: ["MANAGEMENT", "ENGINEERING", "PHARMACY"] }));
    expect(o.items.find((i) => i.kind === "BCI_RETURN")?.applies).toBe(true);
    expect(o.notBuilt.map((n) => [n.stream, n.councils, n.here])).toEqual([
      ["HEALTH_SCIENCES", ["NMC", "DCI", "INC"], false],
      ["ARCHITECTURE", ["COA"], false],
      ["AGRICULTURE", ["ICAR"], false],
    ]);
    expect(o.nbaDepartments).toEqual([]);
  });

  it("lets an engineering college make the AICTE disclosure and refuses it the BCI return", async () => {
    await as(ids.techIqac, ids.tech, "IQAC");
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "AICTE_DISCLOSURE", year: YEAR }))).status).toBe(200);
    expect((await disclosureGet()).status).toBe(200);
    const bci = await bciGet(get("/api/v1/iqac/council/bci"));
    expect(bci.status).toBe(404);
    expect((await body(bci)).error).toBe(NOT_APPLICABLE);
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "BCI_RETURN", year: YEAR }))).status).toBe(404);
    const o = await body<{ nbaDepartments: { id: string }[] }>(await councilGet());
    expect(o.nbaDepartments.map((d) => d.id)).toEqual([ids.mech]);
  });
});

describe("the councils' returns against the hand computation", () => {
  it("BCI: one law teacher, two students, two titles and two volumes (one withdrawn), one moot court of two, one internship in the year, and the office's answers", async () => {
    await as(ids.lawIqac, ids.law, "IQAC");
    // A score on a checklist, and an unknown item, are refused; nothing is written.
    expect((await bciPost(json("/x", { year: YEAR, items: [{ code: "MOOT_COURT_HALL", score: 3 }] }))).status).toBe(422);
    expect((await bciPost(json("/x", { year: YEAR, items: [{ code: "NOT_AN_ITEM", answer: "YES" }] }))).status).toBe(422);
    const saved = await bciPost(json("/x", { year: YEAR, items: [{ code: "MOOT_COURT_HALL", answer: "YES" }, { code: "LEGAL_AID_CLINIC", answer: "YES", note: "ZZ Saturdays" }, { code: "LEGAL_DATABASES", answer: "NO" }] }));
    expect(saved.status).toBe(200);
    const view = await body<{ figures: Record<string, number>; items: { code: string; answer: string | null; note: string }[]; canEdit: boolean }>(saved);
    expect(view.figures).toEqual({ faculty: 1, students: 2, titles: 2, volumes: 2, mootCourts: 1, mootParticipants: 2, internships: 1, meetingMinimum: 0, checklistComplied: 2, checklistItems: 14 });
    expect(view.items.find((i) => i.code === "LEGAL_AID_CLINIC")).toMatchObject({ answer: "YES", note: "ZZ Saturdays" });
    expect(view.canEdit).toBe(true);
    // The filing prints the same figures.
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "BCI_RETURN", year: YEAR }))).status).toBe(200);
    const row = await db.collegeFiling.findFirstOrThrow({ where: { schoolId: ids.law, kind: "BCI_RETURN" }, select: { figuresJson: true, body: true, format: true } });
    expect(JSON.parse(row.figuresJson)).toEqual(view.figures);
    expect(row.format).toBe("PDF");
    expect(row.body).toContain("Return to the Bar Council of India");
    expect(row.body).toContain("A legal aid clinic run by the college");
  });

  it("PCI: two pharmacy teachers (one with a doctorate), four students, two laboratories with two pieces of equipment, two experiments in the year (one signed)", async () => {
    await as(ids.techIqac, ids.tech, "IQAC");
    const res = await pciGet(get(`/api/v1/iqac/council/pci?year=${YEAR}`));
    expect(res.status).toBe(200);
    const view = await body<{ figures: Record<string, number>; items: unknown[]; total: unknown }>(res);
    expect(view.figures).toEqual({ programmes: 1, intake: 60, enrolled: 4, faculty: 2, phd: 1, labs: 2, equipment: 2, practicalRecords: 2, practicalSigned: 1, practicalStudents: 2 });
    expect(view.items).toEqual([]);
    expect(view.total).toBeNull();
    const built = await buildFiling(ids.tech, "PCI_INSPECTION", YEAR, null);
    expect(built.figures).toEqual(view.figures);
    const doc = JSON.parse(built.body) as { sections: { heading: string; table?: { rows: (string | number)[][] } }[] };
    const labs = doc.sections.find((x) => x.heading === "Laboratories and equipment")!;
    // Each lab with its equipment and its stock lines; the classroom's projector and the disposed microscope are not counted.
    expect(labs.table!.rows).toEqual([["ZZ Pharmaceutics Lab", 30, 2, 1], ["ZZ Pharmacognosy Lab", 20, 0, 0]]);
  });

  it("NCTE: two teachers of education, two students, one practice school open, one posting in the year with twelve lessons planned and two observed", async () => {
    await as(ids.techAdmin, ids.tech, "ADMIN");
    const saved = await nctePost(json("/x", { year: YEAR, items: [{ code: "CLASSROOMS", answer: "YES" }, { code: "ICT_CENTRE", answer: "YES" }, { code: "CURRICULUM_LAB", answer: "YES" }, { code: "BARRIER_FREE", answer: "NO", note: "ZZ Ramp in next year's budget" }] }));
    expect(saved.status).toBe(200);
    const view = await body<{ figures: Record<string, number> }>(saved);
    expect(view.figures).toEqual({ faculty: 2, students: 2, practiceSchools: 1, postings: 1, lessonsPlanned: 12, lessonsObserved: 2, meetingMinimum: 0, checklistComplied: 3, checklistItems: 14 });
    expect((await body<{ figures: Record<string, number> }>(await ncteGet(get(`/api/v1/iqac/council/ncte?year=${YEAR}`)))).figures).toEqual(view.figures);
  });
});

describe("the NBA SAR of an engineering department", () => {
  /*
   * By hand, MECH in 2025-26: intake 10, 8 admitted (80 %: 4.1 = 18); the 2021 batch of two both graduated with no
   * backlog (4.2.1 = 25, 4.2.2 = 15); no results published in the year (4.3, 4.4, 8.3 = 0); batch 2025's two
   * graduates, one gone on to higher studies (index 0.5: 4.5 = 20); 8 active students to 2 teachers, the visiting one
   * not counted (SFR 4: 5.1 = 20); RF 0.4 — a professor and an assistant (cadre (22.5 + 1.5) × 12.5, at most 25: 5.2 =
   * 25); FQ 2.5 × (10 + 4) / 0.4 = 87.5, at most 25 (5.3 = 25); 8 first years to the one teacher of ME101 (8.1 = 5).
   * 18 + 25 + 15 + 20 + 20 + 25 + 25 + 5 = 153 from the records.
   */
  const COMPUTED = { "4.1": 18, "4.2.1": 25, "4.2.2": 15, "4.3": 0, "4.4": 0, "4.5": 20, "5.1": 20, "5.2": 25, "5.3": 25, "8.1": 5, "8.3": 0 };

  it("computes the quantitative items from the rows, and the HOD writes their own department's criteria only", async () => {
    await as(ids.hodUser, ids.tech, "HOD");
    const res = await nbaGet(get(`/api/v1/iqac/council/nba?year=${YEAR}`));
    expect(res.status).toBe(200);
    const view = await body<{ departmentId: string; departments: { id: string }[]; figures: Record<string, number>; items: { code: string; computed: boolean; score: number | null }[]; total: { computed: number; self: number; max: number } }>(res);
    expect(view.departmentId).toBe(ids.mech);
    expect(view.departments.map((d) => d.id)).toEqual([ids.mech]);
    expect(Object.fromEntries(view.items.filter((i) => i.computed).map((i) => [i.code, i.score]))).toEqual(COMPUTED);
    expect(view.figures).toMatchObject({ students: 8, faculty: 2, enrolmentRatio: 80, successNoBacklog: 1, successStipulated: 1, placementIndex: 0.5, sfr: 4, cadreMarks: 25, fq: 87.5, fysfr: 8, offerings: 1, computedMarks: 153, selfMarks: 0 });
    expect(view.total).toEqual({ computed: 153, self: 0, max: 1000 });
    // Another department's report is not the HOD's to read.
    expect((await nbaGet(get(`/api/v1/iqac/council/nba?departmentId=${ids.pharm}`))).status).toBe(403);
    // A computed item, a mark above the item's and an unknown item are refused.
    expect((await nbaPost(json("/x", { year: YEAR, items: [{ code: "4.1", score: 20 }] }))).status).toBe(422);
    expect((await nbaPost(json("/x", { year: YEAR, items: [{ code: "1", score: 61 }] }))).status).toBe(422);
    expect((await nbaPost(json("/x", { year: YEAR, items: [{ code: "11", score: 1 }] }))).status).toBe(422);
    const saved = await nbaPost(json("/x", { year: YEAR, items: [{ code: "1", score: 45, note: "ZZ Vision reviewed by the board." }, { code: "6", score: 60 }] }));
    expect(saved.status).toBe(200);
    expect((await body<{ total: { computed: number; self: number } }>(saved)).total).toEqual({ computed: 153, self: 105, max: 1000 });
    // A FACULTY member is not given the door at all.
    await as(ids.facultyUser, ids.tech, "FACULTY");
    expect((await nbaGet(get("/api/v1/iqac/council/nba"))).status).toBe(403);
  });

  it("is one per department and year: rebuilt in place while a draft, refused once the principal has it; a department that is not engineering is refused", async () => {
    await as(ids.techIqac, ids.tech, "IQAC");
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "NBA_SAR", year: YEAR }))).status).toBe(422);
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "NBA_SAR", year: YEAR, departmentId: ids.pharm }))).status).toBe(422);
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "NBA_SAR", year: YEAR, departmentId: ids.mech }))).status).toBe(200);
    const first = await db.collegeFiling.findFirstOrThrow({ where: { schoolId: ids.tech, kind: "NBA_SAR" }, select: { id: true, departmentId: true, figuresJson: true, body: true } });
    expect(first.departmentId).toBe(ids.mech);
    expect(JSON.parse(first.figuresJson)).toMatchObject({ computedMarks: 153, selfMarks: 105, totalMarks: 258 });
    expect(first.body).toContain("ZZ Vision reviewed by the board.");
    // The file itself: the PDF drawn from the frozen record.
    const pdf = await fileGet(get("/x"), params({ filingId: first.id }));
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toContain("application/pdf");
    expect(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "NBA_SAR", year: YEAR, departmentId: ids.mech }))).status).toBe(200);
    expect(await db.collegeFiling.count({ where: { schoolId: ids.tech, kind: "NBA_SAR" } })).toBe(1);
    const list = await body<{ items: { id: string; kind: string; departmentId: string | null }[] }>(await filingsGet());
    expect(list.items.find((f) => f.kind === "NBA_SAR")).toMatchObject({ id: first.id, departmentId: ids.mech });
    // To the principal, who signs it off; then it is not made again.
    expect((await submitPost(json("/x", {}), params({ filingId: first.id }))).status).toBe(200);
    await as(ids.techPrincipal, ids.tech, "PRINCIPAL");
    expect((await signoffPost(json("/x", { decision: "SIGN", note: "ZZ Approved." }), params({ filingId: first.id }))).status).toBe(200);
    await as(ids.techIqac, ids.tech, "IQAC");
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "NBA_SAR", year: YEAR, departmentId: ids.mech }))).status).toBe(409);
  });

  /*
   * S4B-1 (5 Oct 2026): a past SAR rebuilt later reads its own year. After the SAR for 2025-26 is built, the college
   * moves on: three students enter in 2026, a teacher joins MECH in July 2026, one of the eight 2025 entrants leaves in
   * July 2026 (after the year: still one of its students), and a 2024 entrant who left in May 2025 (before the year)
   * is found on the roll. The rebuilt SAR prints the same figures; the 2026-27 SAR counts 8 + 3 = 11 students to
   * 3 teachers. The old code counted every ACTIVE seat today (12, then SFR 4 → 6 with the new teacher counted too).
   */
  it("reads the SAR's own year, not today's: later entrants, a later teacher and later leavers change nothing it printed", async () => {
    const s = ids.tech;
    const before = await buildFiling(s, "NBA_SAR", YEAR, null, ids.mech);
    expect(before.figures).toMatchObject({ students: 8, faculty: 2, sfr: 4, fysfr: 8 });
    const be = await db.programme.findFirstOrThrow({ where: { schoolId: s, code: "BEME" }, select: { id: true } });
    const scheme = await db.scheme.findFirstOrThrow({ where: { schoolId: s, programmeId: be.id }, select: { id: true } });
    const made: string[] = [];
    const person = async (who: string, role: string, leftAt: Date | null = null) => {
      const u = await db.user.create({ data: { name: `ZZ CF ${who}`, email: `zz-cf-later-${who.toLowerCase()}-${made.length}-${STAMP}@test.invalid` }, select: { id: true } });
      const m = await db.membership.create({ data: { userId: u.id, schoolId: s, role, status: "ACTIVE", leftAt }, select: { id: true } });
      made.push(m.id);
      return m.id;
    };
    for (let i = 0; i < 3; i++) await db.studentProgramme.create({ data: { schoolId: s, studentMembershipId: await person(`Entrant${i}`, "STUDENT"), programmeId: be.id, schemeId: scheme.id, entryYear: YEAR + 1 } });
    await db.studentProgramme.create({ data: { schoolId: s, studentMembershipId: await person("EarlyLeaver", "STUDENT", new Date(`${YEAR}-05-20T12:00:00Z`)), programmeId: be.id, schemeId: scheme.id, entryYear: YEAR - 1, yearOfStudy: 2 } });
    const teacher = await person("LaterTeacher", "FACULTY");
    await db.departmentFaculty.create({ data: { schoolId: s, departmentId: ids.mech, membershipId: teacher } });
    await db.facultyRecord.create({ data: { schoolId: s, membershipId: teacher, designation: "ASSISTANT_PROFESSOR", highestQualification: "PG", appointment: "REGULAR", joinedOn: `${YEAR + 1}-07-01` } });
    const leaver = await db.studentProgramme.findFirstOrThrow({ where: { schoolId: s, programmeId: be.id, entryYear: YEAR }, select: { studentMembershipId: true } });
    await db.membership.update({ where: { id: leaver.studentMembershipId }, data: { leftAt: new Date(`${YEAR + 1}-07-15T12:00:00Z`) } });
    try {
      const again = await buildFiling(s, "NBA_SAR", YEAR, null, ids.mech);
      expect(again.figures).toEqual(before.figures);
      expect(again.body).toBe(before.body);
      const next = await nbaFacts(s, ids.mech, YEAR + 1);
      expect([next.S, next.F, next.admitted, next.firstYearStudents]).toEqual([11, 3, 3, 3]);
    } finally {
      await db.membership.update({ where: { id: leaver.studentMembershipId }, data: { leftAt: null } });
      await db.membership.deleteMany({ where: { id: { in: made } } });
    }
  });
});

describe("the SAR after its sign-off, and the year it opens on (audit of 5 October 2026)", () => {
  it("keeps the worksheet read-only once the SAR is signed off, and opens the page, the insights and the simulator on the latest year with a report (A3-S-15, A3-journeys-34)", async () => {
    // YEAR's SAR was signed off above: its worksheet is no longer written, and the page says so.
    await as(ids.hodUser, ids.tech, "HOD");
    const locked = await nbaPost(json("/x", { year: YEAR, items: [{ code: "1", score: 50 }] }));
    expect(locked.status).toBe(409);
    expect((await body(locked)).error).toBe("This report is signed off or filed, so its worksheet is read-only.");
    const view = await body<{ canEdit: boolean; signedOff: boolean; items: { code: string; score: number | null }[] }>(await nbaGet(get(`/api/v1/iqac/council/nba?year=${YEAR}`)));
    expect([view.canEdit, view.signedOff]).toEqual([false, true]);
    expect(view.items.find((i) => i.code === "1")!.score).toBe(45);
    // A report for the next year (a draft): with no year asked, every NBA page opens on it, not on the year today's date gives.
    await as(ids.techIqac, ids.tech, "IQAC");
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "NBA_SAR", year: YEAR + 1, departmentId: ids.mech }))).status).toBe(200);
    const opened = await body<{ year: number; canEdit: boolean; signedOff: boolean }>(await nbaGet(get("/api/v1/iqac/council/nba")));
    expect([opened.year, opened.canEdit, opened.signedOff]).toEqual([YEAR + 1, true, false]);
    expect((await body<{ year: number }>(await nbaInsightsGet(get("/api/v1/iqac/insights/nba")))).year).toBe(YEAR + 1);
    expect((await body<{ year: number }>(await simulateNbaGet(get("/api/v1/iqac/simulate/nba")))).year).toBe(YEAR + 1);
    // The draft's worksheet is still written, and the draft rebuilt in place with it.
    expect((await nbaPost(json("/x", { year: YEAR + 1, departmentId: ids.mech, items: [{ code: "1", score: 40 }] }))).status).toBe(200);
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "NBA_SAR", year: YEAR + 1, departmentId: ids.mech }))).status).toBe(200);
  });
});

describe("the fingerprint and the audit", () => {
  it("keeps every filing's hash its body's, and regenerating it from the rows gives the figures it printed (the data audit's iqac-filing check)", async () => {
    await as(ids.techIqac, ids.tech, "IQAC");
    for (const kind of ["PCI_INSPECTION", "NCTE_RETURN", "AFFILIATION_RETURN"]) expect((await filingsPost(json("/api/v1/iqac/filings", { kind, year: YEAR }))).status).toBe(200);
    const filings = await db.collegeFiling.findMany({ where: { schoolId: { in: [ids.law, ids.tech] } }, select: { schoolId: true, kind: true, year: true, cycleId: true, departmentId: true, body: true, hash: true, figuresJson: true } });
    expect(new Set(filings.map((f) => f.kind))).toEqual(new Set(["AICTE_DISCLOSURE", "BCI_RETURN", "NBA_SAR", "PCI_INSPECTION", "NCTE_RETURN", "AFFILIATION_RETURN"]));
    for (const f of filings) {
      expect(sha(f.body), f.kind).toBe(f.hash);
      const again = await buildFiling(f.schoolId, f.kind as never, f.year, f.cycleId, f.departmentId);
      expect(again.figures, f.kind).toEqual(JSON.parse(f.figuresJson));
    }
    // The worksheet saves and the generations are in the colleges' own logs, with words for the audit page.
    const saves = await db.auditLog.findMany({ where: { schoolId: { in: [ids.law, ids.tech] }, action: "iqac.worksheet.save" }, select: { meta: true } });
    // NBA_SAR twice: the HOD's YEAR criteria, and the next year's draft written after the sign-off of YEAR's (A3-S-15 above).
    expect(saves.map((s) => (JSON.parse(s.meta) as { kind: string }).kind).sort()).toEqual(["BCI_RETURN", "NBA_SAR", "NBA_SAR", "NCTE_RETURN"]);
    expect(await db.auditLog.count({ where: { schoolId: ids.tech, action: "iqac.filing.generate", targetType: "CollegeFiling" } })).toBeGreaterThanOrEqual(5);
    expect(actionKey("iqac.worksheet.save")).toBe("audit.iqacWorksheetSave");
  });
});

describe("the regulators' calendar by stream", () => {
  it("does not remind a law college of AICTE's extension, even with an approval reference; the streams decide where they are known", () => {
    const eoa = REGULATOR_DEADLINES.find((r) => r.code === "AICTE_EOA")!;
    const cap = REGULATOR_DEADLINES.find((r) => r.code === "CET_CAP")!;
    const law = { kind: "COLLEGE", aicteApprovalRef: "ZZ/AICTE/1", naacGrade: null, iqacOn: true, streams: ["LAW"] };
    expect(deadlineApplies(eoa, law)).toBe(false);
    expect(deadlineApplies(cap, law)).toBe(true);
    expect(deadlineApplies(eoa, { ...law, aicteApprovalRef: null, streams: ["ENGINEERING"] })).toBe(true);
    // No stream recorded: the approval reference decides, as before.
    expect(deadlineApplies(eoa, { ...law, streams: [] })).toBe(true);
    expect(deadlineApplies(eoa, { ...law, aicteApprovalRef: null, streams: [] })).toBe(false);
  });

  it("puts the AICTE extension before the engineering college alone and the affiliation return before both on the operator's calendar, and on each IQAC's", async () => {
    const operator = { user: { id: ids.operator, isSuperuser: true, email: `zz-cf-operator-${STAMP}@test.invalid` } } as unknown as Parameters<typeof regulatorCalendar>[0];
    const calendar = await regulatorCalendar(operator, { schoolIds: [ids.law, ids.tech], now: new Date("2027-01-20T06:00:00.000Z") });
    const colleges = (code: string) => calendar.items.filter((i) => i.code === code).flatMap((i) => i.colleges.map((c) => c.schoolId));
    expect(colleges("AICTE_EOA")).toEqual([ids.tech]);
    expect(colleges("AFFILIATION").sort()).toEqual([ids.law, ids.tech].sort());
    expect(colleges("AISHE").sort()).toEqual([ids.law, ids.tech].sort());
    await as(ids.lawIqac, ids.law, "IQAC");
    const lawCodes = (await body<{ calendar: { code: string }[] }>(await overviewGet())).calendar.map((c) => c.code);
    expect(lawCodes).not.toContain("AICTE_EOA");
    expect(lawCodes).toContain("AFFILIATION");
    expect(lawCodes).toEqual(expect.arrayContaining(["AQAR", "AISHE", "NIRF"]));
    await as(ids.techIqac, ids.tech, "IQAC");
    expect((await body<{ calendar: { code: string }[] }>(await overviewGet())).calendar.map((c) => c.code)).toEqual(expect.arrayContaining(["AICTE_EOA", "AFFILIATION"]));
  });
});
