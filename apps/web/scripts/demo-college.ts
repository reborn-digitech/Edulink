/**
 * A complete demo college with plain names, every college role populated and
 * every college module carrying data, behind the demo schools' ONE shared
 * password.
 *
 *   npm run demo:college
 *
 * Saraswati Arts and Science College, Pune (slug `saraswati-college`, kind
 * COLLEGE, affiliated to Savitribai Phule Pune University, a made-up AISHE
 * code, NAAC A): every module the college is offered switched on; Physics and
 * Commerce, each with a head; BSc Physics and BCom on the SPPU NEP 2024
 * scheme, their courses with outcomes; this odd term and last even term; a
 * division per year (SY BSc Physics A, SY BCom A, FY BCom A); ten students —
 * one a minor of seventeen with a guardian; three faculty, the two heads, the
 * registrar, the principal, the controller of examinations, the IQAC
 * coordinator, the placement officer and the accounts officer; four weeks of
 * lecture registers; internal marks countersigned and locked on PHY301 and
 * COM301 (PHY302's entered and waiting); last term's sitting with the
 * university's result file imported and run 1 PUBLISHED (SGPA for every
 * second-year student, one ATKT with a backlog); an OPEN placement drive by a
 * verified company with a recruiter bound to it and two applicants, last
 * season's closed drive with the alumna's accepted offer and the 2025 season;
 * a NAAC cycle with its metrics computed by the IQAC library; fee structures by
 * programme, year and category with a demand per term, four odd terms paid by
 * bank, and one scholarship claim sanctioned; and an alumna who left in 2025.
 *
 * WHY NOT THE ZZ COLLEGE BUILDERS. `zz-college.ts`, `zz-academics.ts`,
 * `zz-exams.ts`, `zz-college-office.ts`, `zz-placement.ts` and `zz-iqac.ts`
 * find ZZ Vidya by slug, its people by @zz.test and write by the catalog's
 * fixed ids. This script copies their row shapes, keys every write on this
 * college's own natural keys, and calls the libraries where they work without
 * a session: `lockTotals` (the internal lock's arithmetic), the exam cell's
 * rules (`courseOutcome`, `sgpaHundredths`, `termStatusOf`, `classFor`),
 * `placementTable` (the season row, so data:audit's drift check agrees) and
 * `recomputeAsSystem` / `scoreQualitativeAs` (the NAAC cycle).
 *
 * IDEMPOTENT. Every write is find-or-create keyed on something stable (the
 * slug, an email, a code, a unique pair, a name within the college); a second
 * run adds nothing and prints the same counts. The NAAC cycle is computed
 * once: its scores are an append-only trend, so a re-run leaves them be.
 *
 * WHAT IT NEVER TOUCHES: any row that is not this college's or a
 * @demo.relay.test person's. It finds the college by its slug alone, and the
 * one shared row it writes — the company — by its own identifier.
 *
 * Runs on the ADMIN connection, like the demo schools: it creates a tenant.
 */
import { hash } from "@node-rs/argon2";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SCHOOL_MODULES, gstinCheckChar } from "@edulink/contracts";
import { classCode, schoolCode } from "../src/lib/codes";
import { openAlumnus } from "../src/lib/alumni-membership";
import { lockTotals } from "../src/lib/academics-assessment";
import { classFor, courseOutcome, gradingTableOf, rulesOf, sgpaHundredths, termStatusOf } from "../src/lib/exam-cell-rules";
import { placementTable } from "../src/lib/placement-analytics";
import { seasonBatchFor } from "../src/lib/placement-rules";
import { iqacHash, recomputeAsSystem, respondentHash, scoreQualitativeAs } from "../src/lib/iqac";
import { buildFiling } from "../src/lib/iqac-filings";
import { addWorkingDays } from "../src/lib/iqac-rules";
import { db, link, refuseUnlessLocal, switchModulesOn, upsertMembership, upsertUser, type Ctx } from "./zz-fixtures";
import { PASSWORD } from "./demo-schools";

const DOMAIN = "demo.relay.test";
const SLUG = "saraswati-college";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const day = (key: string) => new Date(`${key}T00:00:00Z`);
const mail = (local: string) => `${local}@${DOMAIN}`;

/* -------------------------------------------------------------------------- */
/* the people                                                                  */
/* -------------------------------------------------------------------------- */

type StaffKey = "registrar" | "principal" | "hodPhy" | "hodCom" | "f1" | "f2" | "f3" | "exams" | "iqac" | "tpo" | "accounts";
const STAFF: { key: StaffKey; email: string; name: string; role: string; title: string; home: string; look: string }[] = [
  { key: "registrar", email: mail("sac.registrar"), name: "Smita Kulkarni", role: "ADMIN", title: "Registrar", home: "/admin", look: "/admin/academics (programmes, terms, divisions, timetable), /admin/college-admissions, /accounts, /exam-cell, /placement" },
  { key: "principal", email: mail("sac.principal"), name: "Dr Anil Deshpande", role: "PRINCIPAL", title: "Principal", home: "/principal", look: "/principal/accreditation (the NAAC cycle), /exam-cell (results), /accounts/concessions" },
  { key: "hodPhy", email: mail("sac.hod.physics"), name: "Dr Vasudha Paranjpe", role: "HOD", title: "Head, Department of Physics", home: "/hod", look: "/hod/defaulters (Rutuja under 75 % in PHY301), /faculty (teaches PHY302, marks waiting for a countersign)" },
  { key: "hodCom", email: mail("sac.hod.commerce"), name: "Dr Sanjay Bhide", role: "HOD", title: "Head, Department of Commerce", home: "/hod", look: "/hod (Commerce: COM301 locked), /faculty (teaches COM302 and COM102)" },
  { key: "f1", email: mail("sac.faculty1"), name: "Dr Neelima Gadgil", role: "FACULTY", title: "Assistant professor, Physics", home: "/faculty", look: "PHY301: four weeks of registers, internal marks locked" },
  { key: "f2", email: mail("sac.faculty2"), name: "Prof Rahul Shirole", role: "FACULTY", title: "Assistant professor, Physics", home: "/faculty", look: "MAT301's registers" },
  { key: "f3", email: mail("sac.faculty3"), name: "Prof Ashwini Mane", role: "FACULTY", title: "Assistant professor, Commerce", home: "/faculty", look: "COM301 (locked) and COM101 (the first years)" },
  { key: "exams", email: mail("sac.exams"), name: "Prakash Joglekar", role: "EXAM_CONTROLLER", title: "Controller of examinations", home: "/exam-cell", look: "Summer 2026 sitting: result file imported, run 1 published, one ATKT and its backlog" },
  { key: "iqac", email: mail("sac.iqac"), name: "Dr Meghana Phadke", role: "IQAC", title: "IQAC coordinator", home: "/iqac", look: "/iqac/predictor (the NAAC cycle's metrics and CGPA), /iqac/registers, /iqac/surveys (the closed Student Satisfaction Survey 2025–26, ten responses, its action-taken report), /iqac/grievances (two resolved), /iqac/documents (the 2025 AQAR, filed and signed off)" },
  { key: "tpo", email: mail("sac.tpo"), name: "Nitin Kale", role: "TPO", title: "Training and placement officer", home: "/placement", look: "/placement/drives (the OPEN drive with two applicants), /placement/companies, /placement/analytics (2025 season)" },
  { key: "accounts", email: mail("sac.accounts"), name: "Sushma Rane", role: "ACCOUNTS", title: "Accounts officer", home: "/accounts", look: "/accounts (collection, defaulters), /accounts/structures, /accounts/scholarships" },
];

type StudentSpec = { n: number; name: string; gender: "M" | "F"; birth: string; programme: "BSCPHY" | "BCOM"; year: 1 | 2; category: "OPEN" | "OBC"; paidOdd: boolean };
/** Five second-year BSc Physics, three second-year BCom, two first-year BCom (Pooja is seventeen). */
const STUDENTS: StudentSpec[] = [
  { n: 1, name: "Aditya Patil", gender: "M", birth: "2006-08-14", programme: "BSCPHY", year: 2, category: "OPEN", paidOdd: true },
  { n: 2, name: "Sakshi Jadhav", gender: "F", birth: "2007-01-22", programme: "BSCPHY", year: 2, category: "OBC", paidOdd: false },
  { n: 3, name: "Omkar Shinde", gender: "M", birth: "2006-11-03", programme: "BSCPHY", year: 2, category: "OPEN", paidOdd: true },
  { n: 4, name: "Pranav Kulkarni", gender: "M", birth: "2007-03-09", programme: "BSCPHY", year: 2, category: "OPEN", paidOdd: false },
  { n: 5, name: "Rutuja Pawar", gender: "F", birth: "2006-12-18", programme: "BSCPHY", year: 2, category: "OBC", paidOdd: false },
  { n: 6, name: "Tejas More", gender: "M", birth: "2006-09-25", programme: "BCOM", year: 2, category: "OPEN", paidOdd: true },
  { n: 7, name: "Snehal Gaikwad", gender: "F", birth: "2007-02-11", programme: "BCOM", year: 2, category: "OBC", paidOdd: false },
  { n: 8, name: "Yash Chavan", gender: "M", birth: "2006-10-30", programme: "BCOM", year: 2, category: "OPEN", paidOdd: false },
  { n: 9, name: "Pooja Bhosale", gender: "F", birth: "2009-05-10", programme: "BCOM", year: 1, category: "OPEN", paidOdd: true },
  { n: 10, name: "Kunal Deshmukh", gender: "M", birth: "2008-04-02", programme: "BCOM", year: 1, category: "OPEN", paidOdd: false },
];
const studentEmail = (n: number) => mail(`sac.student${String(n).padStart(2, "0")}`);
const GUARDIAN = { email: mail("sac.parent09"), name: "Ravindra Bhosale", phone: "+919822071009", of: 9 };
const ALUMNA = { email: mail("sac.alumni01"), name: "Shreya Wagh", birth: "2003-06-20", joined: "2022-07-01T04:00:00Z", left: "2025-05-31T06:30:00Z" };
const RECRUITER = { email: mail("recruiter.sahyadri"), name: "Kiran Mehendale", company: "Sahyadri Data Labs Pvt Ltd" };

/* -------------------------------------------------------------------------- */
/* the academic structure                                                      */
/* -------------------------------------------------------------------------- */

const GRADES = [
  { grade: "O", points: 10, minPercent: 90 },
  { grade: "A+", points: 9, minPercent: 80 },
  { grade: "A", points: 8, minPercent: 70 },
  { grade: "B+", points: 7, minPercent: 60 },
  { grade: "B", points: 6, minPercent: 50 },
  { grade: "C", points: 5, minPercent: 45 },
  { grade: "P", points: 4, minPercent: 40 },
  { grade: "F", points: 0, minPercent: 0 },
];
const RULES = { minPercentPerCourse: 40, atktLimit: 4, totalCredits: 132, internalMax: 40, externalMax: 60, minTermCredits: 10, maxTermCredits: 26 };
const EXITS = JSON.stringify([{ afterYear: 1, award: "CERTIFICATE", credits: 44 }, { afterYear: 2, award: "DIPLOMA", credits: 88 }, { afterYear: 3, award: "DEGREE", credits: 132 }]);

type CourseSpec = { code: string; name: string; semester: number; l: number; t: number; p: number; cos: string[] };
const PROGRAMMES: { code: "BSCPHY" | "BCOM"; name: string; dept: { code: string; name: string }; intake: number; pos: [string, string][]; courses: CourseSpec[] }[] = [
  {
    code: "BSCPHY",
    name: "BSc Physics",
    dept: { code: "PHY", name: "Department of Physics" },
    intake: 60,
    pos: [["PO1", "Disciplinary knowledge of physics and its mathematical methods."], ["PO2", "Problem solving with quantitative reasoning."], ["PO3", "Experimental and laboratory skills."]],
    courses: [
      { code: "PHY201", name: "Waves and Oscillations", semester: 2, l: 3, t: 0, p: 1, cos: ["Describe simple harmonic and damped motion.", "Analyse travelling and standing waves."] },
      { code: "PHY202", name: "Electricity and Magnetism", semester: 2, l: 3, t: 0, p: 1, cos: ["Apply Gauss's and Ampère's laws.", "Solve simple DC and AC circuits."] },
      { code: "MAT201", name: "Linear Algebra", semester: 2, l: 3, t: 1, p: 0, cos: ["Solve systems of linear equations.", "Find eigenvalues and eigenvectors."] },
      { code: "PHY301", name: "Mathematical Physics", semester: 3, l: 3, t: 1, p: 0, cos: ["Use vector calculus in physical problems.", "Solve ordinary differential equations met in physics.", "Apply Fourier series to periodic systems."] },
      { code: "PHY302", name: "Thermal Physics", semester: 3, l: 3, t: 0, p: 1, cos: ["State and apply the laws of thermodynamics.", "Measure specific heat and thermal conductivity."] },
      { code: "MAT301", name: "Differential Equations", semester: 3, l: 3, t: 1, p: 0, cos: ["Solve first- and second-order equations."] },
    ],
  },
  {
    code: "BCOM",
    name: "BCom",
    dept: { code: "COM", name: "Department of Commerce" },
    intake: 120,
    pos: [["PO1", "Knowledge of accounting, finance and business law."], ["PO2", "Analysis of business data for decisions."], ["PO3", "Communication and ethics in business."]],
    courses: [
      { code: "COM101", name: "Financial Accounting I", semester: 1, l: 4, t: 0, p: 0, cos: ["Record transactions by double entry.", "Prepare a trial balance and final accounts."] },
      { code: "COM102", name: "Business Economics I", semester: 1, l: 3, t: 0, p: 0, cos: ["Explain demand, supply and elasticity."] },
      { code: "COM201", name: "Financial Accounting II", semester: 2, l: 4, t: 0, p: 0, cos: ["Account for partnerships.", "Prepare branch and departmental accounts."] },
      { code: "COM202", name: "Business Economics II", semester: 2, l: 3, t: 0, p: 0, cos: ["Explain national income and money."] },
      { code: "COM301", name: "Corporate Accounting", semester: 3, l: 4, t: 0, p: 0, cos: ["Account for the issue of shares and debentures.", "Prepare a company's final accounts."] },
      { code: "COM302", name: "Business Statistics", semester: 3, l: 3, t: 1, p: 0, cos: ["Summarise data with averages and dispersion.", "Fit and use simple correlation and regression."] },
    ],
  },
];
const CURRENT_TERM = { name: "Odd term 2026–27", academicYear: "2026–27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-06-20", registrationClosesOn: "2026-07-15" };
const PAST_TERM = { name: "Even term 2025–26", academicYear: "2025–26", startsOn: "2025-12-01", endsOn: "2026-04-30", registrationOpensOn: "2025-11-20", registrationClosesOn: "2025-12-10" };
const DIVISIONS: { key: string; name: string; programme: "BSCPHY" | "BCOM"; year: 1 | 2 }[] = [
  { key: "SYB", name: "SY BSc Physics A", programme: "BSCPHY", year: 2 },
  { key: "SYC", name: "SY BCom A", programme: "BCOM", year: 2 },
  { key: "FYC", name: "FY BCom A", programme: "BCOM", year: 1 },
];
/** This term's offerings: [course, division, teacher, room, [weekday, bell][]]. Weekday 1 = Monday; no teacher, room or division is in two places at once. */
const OFFERINGS: [string, string, StaffKey, string, [number, number][]][] = [
  ["PHY301", "SYB", "f1", "Room 12", [[1, 1], [3, 1], [5, 1]]],
  ["PHY302", "SYB", "hodPhy", "Physics Lab", [[2, 1], [4, 1], [6, 2]]],
  ["MAT301", "SYB", "f2", "Room 12", [[2, 2], [4, 2]]],
  ["COM301", "SYC", "f3", "Room 21", [[1, 3], [3, 3], [5, 3]]],
  ["COM302", "SYC", "hodCom", "Room 21", [[2, 3], [4, 3]]],
  ["COM101", "FYC", "f3", "Room 22", [[2, 4], [4, 4]]],
  ["COM102", "FYC", "hodCom", "Room 22", [[1, 4], [3, 4], [5, 4]]],
];
/** The four weeks of registers before the first run: Monday 7 September to Saturday 3 October 2026. Fixed, so a later run writes the same lectures. */
const REGISTER_FROM = "2026-09-07";
const REGISTER_TO = "2026-10-03";
const COUNTERSIGNED_AT = new Date("2026-09-30T10:00:00Z");
const LOCKED_AT = new Date("2026-10-01T10:00:00Z");
const PUBLISHED_AT = new Date("2026-05-22T06:30:00Z");

/* -------------------------------------------------------------------------- */

type Member = { id: string; userId: string };
type College = { id: string; name: string; code: string };

async function buildCollege(): Promise<College> {
  const existing = await db.school.findUnique({ where: { slug: SLUG }, select: { id: true, name: true, code: true } });
  // A demo tenant is not a test fixture (B-28, 4 Oct 2026): Sunrise and Saraswati Vidya Mandir never were, and the
  // demo college as one was hidden from the operator's /root/colleges while the recruiter's form offered it. The ZZ
  // tenants are the fixtures; the demo ones are what a prospect is shown, so they list like a real customer.
  const profile = { kind: "COLLEGE", affiliatingUniversity: "Savitribai Phule Pune University", aisheCode: "C-41873", naacGrade: "A", naacValidUntil: day("2028-12-31"), nirfCategory: "COLLEGE", isTestFixture: false, streamsJson: JSON.stringify(["ARTS", "SCIENCE", "COMMERCE"]) };
  if (existing) {
    await db.school.update({ where: { id: existing.id }, data: profile });
    return existing;
  }
  return db.school.create({
    data: {
      name: "Saraswati Arts and Science College",
      slug: SLUG,
      code: schoolCode("Saraswati Arts and Science College"),
      city: "Pune",
      region: "Maharashtra",
      country: "India",
      contactEmail: mail("office.sac"),
      contactPhone: "+912025431870",
      addressLine: "Karve Road, Erandwane",
      timezone: "Asia/Kolkata",
      locale: "en",
      brandPrimary: "#7c3aed",
      verifiedAt: new Date(),
      ...profile,
    },
    select: { id: true, name: true, code: true },
  });
}

async function buildPeople(ctx: Ctx, college: College) {
  const staff = {} as Record<StaffKey, Member>;
  for (const p of STAFF) {
    const user = await upsertUser(ctx, p.email, p.name);
    const m = await upsertMembership(user.id, college.id, p.role, { title: p.title });
    staff[p.key] = { id: m.id, userId: user.id };
  }
  const students: (StudentSpec & Member)[] = [];
  for (const s of STUDENTS) {
    const birthdate = day(s.birth);
    const isMinor = s.n === 9;
    const user = await upsertUser(ctx, studentEmail(s.n), s.name, { birthdate, isMinor });
    await db.user.update({ where: { id: user.id }, data: { birthdate, isMinor } });
    const m = await upsertMembership(user.id, college.id, "STUDENT", { gradeLevel: String(s.year) });
    const entry = s.year === 2 ? 2025 : 2026;
    await db.membership.updateMany({ where: { id: m.id, studentCode: null }, data: { studentCode: `SAC-${entry}-${String(s.n).padStart(2, "0")}` } });
    students.push({ ...s, id: m.id, userId: user.id });
  }
  const guardian = await upsertUser(ctx, GUARDIAN.email, GUARDIAN.name, { phone: GUARDIAN.phone, phoneVerifiedAt: new Date() });
  await link(guardian.id, students.find((s) => s.n === GUARDIAN.of)!.id, college.id);

  // The alumna: a closed STUDENT row and the open ALUMNUS row, as a departure leaves them.
  const alumna = await upsertUser(ctx, ALUMNA.email, ALUMNA.name, { birthdate: day(ALUMNA.birth), isMinor: false });
  const leftAt = new Date(ALUMNA.left);
  const wasStudent =
    (await db.membership.findUnique({ where: { userId_schoolId_role: { userId: alumna.id, schoolId: college.id, role: "STUDENT" } }, select: { id: true } })) ??
    (await db.membership.create({ data: { userId: alumna.id, schoolId: college.id, role: "STUDENT", status: "ACTIVE", gradeLevel: "3", joinedAt: new Date(ALUMNA.joined), leftAt, studentCode: "SAC-2022-31" }, select: { id: true } }));
  await openAlumnus(db as unknown as Parameters<typeof openAlumnus>[0], alumna.id, college.id, leftAt);
  const alumnus = await db.membership.findUniqueOrThrow({ where: { userId_schoolId_role: { userId: alumna.id, schoolId: college.id, role: "ALUMNUS" } }, select: { id: true } });
  await db.alumniProfile.upsert({
    where: { membershipId: alumnus.id },
    create: { schoolId: college.id, membershipId: alumnus.id, userId: alumna.id, listed: true, listedAt: new Date("2025-08-01T06:00:00Z"), city: "Pune", occupation: "Analyst, Sahyadri Data Labs", mentor: true, mentorAt: new Date("2025-09-01T06:00:00Z"), mentorByUserId: staff.registrar.userId },
    update: {},
  });

  // The recruiter: an account and its profile, no membership anywhere.
  const recruiter = await upsertUser(ctx, RECRUITER.email, RECRUITER.name);
  await db.recruiterProfile.upsert({ where: { userId: recruiter.id }, create: { userId: recruiter.id, companyName: RECRUITER.company }, update: { disabledAt: null } });

  return { staff, students, guardianUserId: guardian.id, alumna: { userId: alumna.id, studentId: wasStudent.id, alumnusId: alumnus.id }, recruiterUserId: recruiter.id };
}

type People = Awaited<ReturnType<typeof buildPeople>>;

/* -------------------------------------------------------------------------- */
/* academics                                                                   */
/* -------------------------------------------------------------------------- */

async function buildAcademics(college: College, people: People) {
  const s = college.id;
  const { staff, students } = people;
  await db.academicsSettings.upsert({ where: { schoolId: s }, create: { schoolId: s, loadMinHours: 14, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 }, update: {} });

  const programmes: Record<string, { id: string; schemeId: string; deptId: string }> = {};
  const courses: Record<string, { id: string; credits: number; name: string; programme: string; semester: number }> = {};
  for (const p of PROGRAMMES) {
    const hod = p.code === "BSCPHY" ? staff.hodPhy : staff.hodCom;
    const dept = await db.department.upsert({ where: { schoolId_code: { schoolId: s, code: p.dept.code } }, create: { schoolId: s, code: p.dept.code, name: p.dept.name, hodMembershipId: hod.id, condoneFloorPercent: 65 }, update: { hodMembershipId: hod.id }, select: { id: true } });
    const programme = await db.programme.upsert({ where: { schoolId_code: { schoolId: s, code: p.code } }, create: { schoolId: s, departmentId: dept.id, code: p.code, name: p.name, level: "UG", durationYears: 3, intake: p.intake, regulator: "UGC", stream: p.code === "BCOM" ? "COMMERCE" : "SCIENCE", attendanceThreshold: 75, exitPoints: EXITS }, update: { stream: p.code === "BCOM" ? "COMMERCE" : "SCIENCE" }, select: { id: true } });
    for (const [code, text] of p.pos) await db.programmeOutcome.upsert({ where: { programmeId_code: { programmeId: programme.id, code } }, create: { schoolId: s, programmeId: programme.id, code, text }, update: {} });
    const scheme = await db.scheme.upsert({ where: { programmeId_name: { programmeId: programme.id, name: "SPPU NEP 2024" } }, create: { schoolId: s, programmeId: programme.id, name: "SPPU NEP 2024", effectiveYear: 2024, gradingTable: JSON.stringify(GRADES), passingRules: JSON.stringify(RULES) }, update: {}, select: { id: true } });
    programmes[p.code] = { id: programme.id, schemeId: scheme.id, deptId: dept.id };
    for (const c of p.courses) {
      const outcomes = c.cos.map((text, i) => ({ code: `CO${i + 1}`, text }));
      const row = await db.course.upsert({ where: { schemeId_code: { schemeId: scheme.id, code: c.code } }, create: { schoolId: s, schemeId: scheme.id, code: c.code, name: c.name, semester: c.semester, creditsL: c.l, creditsT: c.t, creditsP: c.p, kind: "CORE", outcomes: JSON.stringify(outcomes) }, update: {}, select: { id: true } });
      // Each course outcome feeds the programme outcome of the same number, strongly; CO1 also feeds PO2 a little.
      await db.courseOutcomeMap.createMany({ data: [...outcomes.map((o, i) => ({ schoolId: s, courseId: row.id, coCode: o.code, poCode: `PO${Math.min(i + 1, 3)}`, level: 3 })), { schoolId: s, courseId: row.id, coCode: "CO1", poCode: "PO2", level: 1 }], skipDuplicates: true });
      courses[c.code] = { id: row.id, credits: (c.l + c.t + c.p) * 10, name: c.name, programme: p.code, semester: c.semester };
    }
  }
  for (const [key, dept] of [["hodPhy", "BSCPHY"], ["f1", "BSCPHY"], ["f2", "BSCPHY"], ["hodCom", "BCOM"], ["f3", "BCOM"]] as const) {
    await db.departmentFaculty.upsert({ where: { membershipId: staff[key].id }, create: { schoolId: s, membershipId: staff[key].id, departmentId: programmes[dept]!.deptId }, update: {} });
  }

  const current = await db.academicTerm.upsert({ where: { schoolId_name: { schoolId: s, name: CURRENT_TERM.name } }, create: { schoolId: s, ...CURRENT_TERM }, update: {}, select: { id: true } });
  const past = await db.academicTerm.upsert({ where: { schoolId_name: { schoolId: s, name: PAST_TERM.name } }, create: { schoolId: s, ...PAST_TERM }, update: {}, select: { id: true } });

  // The college's bells: five fifty-minute lectures from 9:00.
  const bells: { id: string; startMinute: number; endMinute: number }[] = [];
  for (let k = 0; k < 5; k += 1) {
    const name = `Lecture ${k + 1}`;
    const start = 540 + k * 60;
    const bell = (await db.timetablePeriod.findFirst({ where: { schoolId: s, name }, select: { id: true, startMinute: true, endMinute: true } })) ?? (await db.timetablePeriod.create({ data: { schoolId: s, name, startMinute: start, endMinute: start + 50, kind: "LESSON", position: k + 1 }, select: { id: true, startMinute: true, endMinute: true } }));
    bells.push(bell);
  }
  const rooms: Record<string, string> = {};
  for (const [name, capacity, kind] of [["Room 12", 60, "CLASSROOM"], ["Room 21", 80, "CLASSROOM"], ["Room 22", 80, "CLASSROOM"], ["Physics Lab", 30, "LAB"]] as const) {
    rooms[name] = (await db.room.upsert({ where: { schoolId_name: { schoolId: s, name } }, create: { schoolId: s, name, capacity, kind }, update: {}, select: { id: true } })).id;
  }

  // Divisions: a class of the college's and its Division row; each student seated with a roll number and a PRN.
  const divisions: Record<string, { id: string; classId: string }> = {};
  for (const d of DIVISIONS) {
    const klass = (await db.class.findFirst({ where: { schoolId: s, name: d.name }, select: { id: true } })) ?? (await db.class.create({ data: { schoolId: s, name: d.name, gradeLevel: String(d.year), subject: d.programme, joinCode: classCode() }, select: { id: true } }));
    const division = await db.division.upsert({ where: { classId: klass.id }, create: { schoolId: s, classId: klass.id, programmeId: programmes[d.programme]!.id, yearOfStudy: d.year, academicYear: "2026–27" }, update: {}, select: { id: true } });
    divisions[d.key] = { id: division.id, classId: klass.id };
  }
  const divisionOf = (st: StudentSpec) => DIVISIONS.find((d) => d.programme === st.programme && d.year === st.year)!.key;
  for (const st of students) {
    const key = divisionOf(st);
    const roll = students.filter((x) => divisionOf(x) === key).findIndex((x) => x.n === st.n) + 1;
    const entryYear = st.year === 2 ? 2025 : 2026;
    const seat = { programmeId: programmes[st.programme]!.id, schemeId: programmes[st.programme]!.schemeId, entryYear, yearOfStudy: st.year, semester: st.year === 2 ? 3 : 1, divisionId: divisions[key]!.id, prn: `SAC${entryYear}${String(st.n).padStart(3, "0")}`, status: "ACTIVE" };
    await db.studentProgramme.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...seat }, update: {} });
    await db.enrollment.upsert({ where: { classId_studentMembershipId: { classId: divisions[key]!.classId, studentMembershipId: st.id } }, create: { schoolId: s, classId: divisions[key]!.classId, studentMembershipId: st.id, rollNumber: roll }, update: {} });
  }

  // This term's offerings, their hours on the grid, every student of the division registered.
  const offerings: Record<string, { id: string; teacher: Member; roster: (StudentSpec & Member)[]; slots: { id: string; weekday: number; bell: number }[] }> = {};
  for (const [code, divKey, teacherKey, room, hours] of OFFERINGS) {
    const c = courses[code]!;
    const spec = PROGRAMMES.find((p) => p.code === c.programme)!.courses.find((x) => x.code === code)!;
    const teacher = staff[teacherKey];
    const data = { facultyMembershipId: teacher.id, lectureHours: spec.l, tutorialHours: spec.t, practicalHours: spec.p * 2, roomId: rooms[room]!, capacity: null };
    const offering = await db.courseOffering.upsert({ where: { termId_courseId_divisionId: { termId: current.id, courseId: c.id, divisionId: divisions[divKey]!.id } }, create: { schoolId: s, termId: current.id, courseId: c.id, divisionId: divisions[divKey]!.id, ...data }, update: {}, select: { id: true } });
    const slots: { id: string; weekday: number; bell: number }[] = [];
    for (const [weekday, bell] of hours) {
      const slot = await db.offeringSlot.upsert({ where: { offeringId_weekday_periodId: { offeringId: offering.id, weekday, periodId: bells[bell - 1]!.id } }, create: { schoolId: s, offeringId: offering.id, weekday, periodId: bells[bell - 1]!.id, kind: code === "PHY302" && weekday === 6 ? "LAB" : "LECTURE" }, update: {}, select: { id: true } });
      slots.push({ id: slot.id, weekday, bell });
    }
    const roster = students.filter((st) => divisionOf(st) === divKey);
    for (const st of roster) {
      await db.courseRegistration.upsert({ where: { offeringId_studentMembershipId: { offeringId: offering.id, studentMembershipId: st.id } }, create: { schoolId: s, studentMembershipId: st.id, offeringId: offering.id, termId: current.id, kind: "CORE", byUserId: staff.registrar.userId, registeredAt: new Date("2026-07-05T05:00:00Z") }, update: {} });
    }
    offerings[code] = { id: offering.id, teacher, roster, slots };
  }

  // Four weeks of lecture registers. Most students miss one lecture in eleven; Rutuja misses every third PHY301 lecture (under 75 %).
  const days: string[] = [];
  for (let t = day(REGISTER_FROM).getTime(); t <= day(REGISTER_TO).getTime(); t += 86_400_000) {
    const key = new Date(t).toISOString().slice(0, 10);
    if (new Date(t).getUTCDay() !== 0) days.push(key);
  }
  let lectures = 0;
  for (const [code, o] of Object.entries(offerings)) {
    let index = 0;
    for (const dateKey of days) {
      for (const slot of o.slots.filter((x) => x.weekday === day(dateKey).getUTCDay())) {
        index += 1;
        const bell = bells[slot.bell - 1]!;
        const lecture = await db.lecture.upsert({
          where: { offeringId_dateKey_slotId: { offeringId: o.id, dateKey, slotId: slot.id } },
          create: { schoolId: s, offeringId: o.id, slotId: slot.id, dateKey, startMinute: bell.startMinute, endMinute: bell.endMinute, kind: code === "PHY302" && slot.weekday === 6 ? "LAB" : "LECTURE" },
          update: {},
          select: { id: true },
        });
        lectures += 1;
        for (const [k, st] of o.roster.entries()) {
          const absent = code === "PHY301" && st.n === 5 ? index % 3 === 0 : (st.n * 7 + index * 3) % 11 === 0;
          await db.lectureAttendance.upsert({
            where: { lectureId_studentMembershipId: { lectureId: lecture.id, studentMembershipId: st.id } },
            create: { schoolId: s, lectureId: lecture.id, studentMembershipId: st.id, status: absent ? "ABSENT" : "PRESENT", markedByMembershipId: o.teacher.id, markedAt: new Date(`${dateKey}T${String(3 + slot.bell).padStart(2, "0")}:${k % 2 ? "35" : "40"}:00Z`) },
            update: {},
          });
        }
      }
    }
  }

  // Internal marks: PHY301 and COM301 entered, countersigned by their head, released and locked; PHY302's unit test entered, waiting for a countersign.
  const internal: [string, StaffKey, boolean][] = [["PHY301", "hodPhy", true], ["COM301", "hodCom", true], ["PHY302", "f1", false]];
  for (const [code, signerKey, lock] of internal) {
    const o = offerings[code]!;
    const signer = staff[signerKey];
    const parts = lock
      ? [{ name: "Unit test 1", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: '["CO1","CO2"]', position: 0, mark: (k: number) => 110 + ((k * 23) % 90) }, { name: "Assignment", kind: "ASSIGNMENT", maxMarks: 10, weight: 20, coCodes: '["CO2"]', position: 1, mark: (k: number) => 60 + ((k * 13) % 40) }]
      : [{ name: "Unit test 1", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: '["CO1"]', position: 0, mark: (k: number) => 100 + ((k * 31) % 95) }];
    for (const c of parts) {
      const signed = lock ? { moderatedByUserId: signer.userId, moderatedAt: COUNTERSIGNED_AT, releasedByUserId: signer.userId, releasedAt: COUNTERSIGNED_AT } : {};
      const component = await db.internalComponent.upsert({ where: { offeringId_name: { offeringId: o.id, name: c.name } }, create: { schoolId: s, offeringId: o.id, name: c.name, kind: c.kind, maxMarks: c.maxMarks, weight: c.weight, coCodes: c.coCodes, position: c.position, ...signed }, update: {}, select: { id: true } });
      for (const [k, st] of o.roster.entries()) {
        await db.internalMark.upsert({ where: { componentId_studentMembershipId: { componentId: component.id, studentMembershipId: st.id } }, create: { schoolId: s, componentId: component.id, studentMembershipId: st.id, marksTenths: c.mark(k + st.n), enteredByUserId: o.teacher.userId, ...(lock ? { moderatedByUserId: signer.userId, moderatedAt: COUNTERSIGNED_AT } : {}) }, update: {} });
      }
    }
    if (!lock) continue;
    const components = await db.internalComponent.findMany({ where: { offeringId: o.id }, select: { id: true, maxMarks: true, weight: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } });
    const totals = lockTotals(components, o.roster.map((st) => st.id));
    await db.internalLock.upsert({ where: { offeringId: o.id }, create: { schoolId: s, offeringId: o.id, termId: current.id, outOf: RULES.internalMax, totalsJson: JSON.stringify(totals), lockedByUserId: signer.userId, lockedAt: LOCKED_AT }, update: {} });
  }

  return { programmes, courses, currentTermId: current.id, pastTermId: past.id, offerings, lectures };
}

type Academics = Awaited<ReturnType<typeof buildAcademics>>;

/* -------------------------------------------------------------------------- */
/* the office: years, fees, a scholarship, admission records                   */
/* -------------------------------------------------------------------------- */

async function buildOffice(college: College, people: People, academics: Academics) {
  const s = college.id;
  const { staff, students } = people;
  const yearRow = async (name: string, from: string, to: string, data: { isCurrent: boolean; closedAt: Date | null }) =>
    (await db.academicYear.findUnique({ where: { schoolId_name: { schoolId: s, name } }, select: { id: true, name: true } })) ??
    (await db.academicYear.create({ data: { schoolId: s, name, startDate: day(from), endDate: day(to), ...data }, select: { id: true, name: true } }));
  await yearRow("2025–26", "2025-06-01", "2026-05-31", { isCurrent: false, closedAt: new Date("2026-06-01T00:00:00Z") });
  const year = await yearRow("2026–27", "2026-06-01", "2027-05-31", { isCurrent: true, closedAt: null });

  const head: Record<string, string> = {};
  for (const [code, name, kind, sortOrder] of [["TUI", "Tuition", "TUITION", 1], ["DEV", "Development", "DEVELOPMENT", 2], ["EXM", "Examination", "EXAM", 3], ["LIB", "Library", "LIBRARY", 4], ["CAU", "Caution deposit", "CAUTION_DEPOSIT", 5]] as const) {
    head[code] = (await db.feeHead.upsert({ where: { schoolId_code: { schoolId: s, code } }, create: { schoolId: s, code, name, kind, sortOrder }, update: {}, select: { id: true } })).id;
  }
  // The year's fee per programme, year of study and category (made-up figures in the shape the fee regulating authority approves); the caution deposit in the first year only.
  const STRUCTURES: { programme: "BSCPHY" | "BCOM"; year: 1 | 2; category: "OPEN" | "OBC"; lines: [string, number][] }[] = [
    { programme: "BSCPHY", year: 2, category: "OPEN", lines: [["TUI", 2_200_000], ["DEV", 400_000], ["EXM", 150_000], ["LIB", 100_000]] },
    { programme: "BSCPHY", year: 2, category: "OBC", lines: [["TUI", 1_100_000], ["DEV", 400_000], ["EXM", 150_000], ["LIB", 100_000]] },
    { programme: "BCOM", year: 2, category: "OPEN", lines: [["TUI", 1_600_000], ["DEV", 400_000], ["EXM", 150_000], ["LIB", 100_000]] },
    { programme: "BCOM", year: 2, category: "OBC", lines: [["TUI", 800_000], ["DEV", 400_000], ["EXM", 150_000], ["LIB", 100_000]] },
    { programme: "BCOM", year: 1, category: "OPEN", lines: [["TUI", 1_600_000], ["DEV", 400_000], ["EXM", 150_000], ["LIB", 100_000], ["CAU", 200_000]] },
  ];
  const structureOf: Record<string, string> = {};
  for (const st of STRUCTURES) {
    const name = `${PROGRAMMES.find((p) => p.code === st.programme)!.name} ${st.year === 1 ? "FY" : "SY"} · ${st.category}`;
    const found = await db.feeStructure.findFirst({ where: { schoolId: s, academicYearId: year.id, name }, select: { id: true } });
    const made =
      found ??
      (await db.feeStructure.create({
        data: {
          schoolId: s, academicYearId: year.id, name, publishedAt: new Date("2026-06-10T06:00:00Z"), programmeId: academics.programmes[st.programme]!.id, yearOfStudy: st.year, category: st.category,
          approvalRef: `FRA/2026-27/${st.programme}/${st.year}/${st.category}`, lateFeeSlabsJson: JSON.stringify([{ afterDays: 15, paise: 50_000 }, { afterDays: 30, paise: 100_000 }]),
          instalments: {
            create: [
              { schoolId: s, label: "Odd semester", sortOrder: 0, dueDate: day("2026-07-15"), lines: { create: st.lines.map(([c, p]) => ({ schoolId: s, headId: head[c]!, amountPaise: c === "CAU" ? p : Math.round(p / 2) })) } },
              { schoolId: s, label: "Even semester", sortOrder: 1, dueDate: day("2026-12-15"), lines: { create: st.lines.filter(([c]) => c !== "CAU").map(([c, p]) => ({ schoolId: s, headId: head[c]!, amountPaise: Math.round(p / 2) })) } },
            ],
          },
        },
        select: { id: true },
      }));
    structureOf[`${st.programme}-${st.year}-${st.category}`] = made.id;
  }

  // Each student: the admission record (category, quota, year of entry), the record's college columns, a plan and a demand per term.
  for (const st of students) {
    const programmeId = academics.programmes[st.programme]!.id;
    const entry = st.year === 2 ? 2025 : 2026;
    await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: st.id, programmeId } }, create: { schoolId: s, studentMembershipId: st.id, programmeId, yearOfEntry: entry, category: st.category, quota: "CAP" }, update: {} });
    const record = { prn: `SAC${entry}${String(st.n).padStart(3, "0")}`, admissionCategory: st.category, admissionQuota: "CAP", yearOfEntry: entry, admissionNumber: `${entry}/${String(st.n).padStart(4, "0")}`, admissionDate: day(`${entry}-07-02`), gender: st.gender, annualIncome: st.category === "OBC" ? 95_000 : 650_000, city: "Pune" };
    await db.pupilRecord.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...record }, update: {} });
    const structureId = structureOf[`${st.programme}-${st.year}-${st.category}`]!;
    await db.studentFeePlan.upsert({ where: { studentMembershipId_academicYearId: { studentMembershipId: st.id, academicYearId: year.id } }, create: { schoolId: s, studentMembershipId: st.id, structureId, academicYearId: year.id }, update: {} });
    const instalments = await db.feeInstalment.findMany({ where: { structureId }, orderBy: { sortOrder: "asc" }, include: { lines: { include: { head: { select: { code: true, name: true } } } } } });
    for (const inst of instalments) {
      const lines = inst.lines.map((l) => ({ headId: l.headId, code: l.head.code, name: l.head.name, grossPaise: l.amountPaise, concessionPaise: 0 }));
      const gross = lines.reduce((a, l) => a + l.grossPaise, 0);
      await db.feeDemand.upsert({ where: { studentMembershipId_instalmentId: { studentMembershipId: st.id, instalmentId: inst.id } }, create: { schoolId: s, studentMembershipId: st.id, academicYearId: year.id, instalmentId: inst.id, label: inst.label, dueDate: inst.dueDate, grossPaise: gross, netPaise: gross, linesJson: JSON.stringify(lines) }, update: {} });
    }
    // The odd semester paid by bank transfer, with its receipt (once: the clientId is the key).
    if (!st.paidOdd) continue;
    const clientId = `demo-sac-odd-${String(st.n).padStart(2, "0")}`;
    if (await db.feePayment.findUnique({ where: { schoolId_clientId: { schoolId: s, clientId } }, select: { id: true } })) continue;
    const odd = await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: st.id, academicYearId: year.id }, orderBy: { dueDate: "asc" } });
    const reference = `UTR2026071${String(st.n).padStart(4, "0")}`;
    const y = await db.academicYear.update({ where: { id: year.id }, data: { feeReceiptNext: { increment: 1 } }, select: { feeReceiptNext: true } });
    const number = y.feeReceiptNext - 1;
    const paidAt = new Date(`2026-07-${String(5 + st.n).padStart(2, "0")}T06:00:00Z`);
    const payment = await db.feePayment.create({ data: { schoolId: s, studentMembershipId: st.id, amountPaise: odd.netPaise, method: "BANK", status: "PAID", clientId, reference, collectedByUserId: staff.accounts.userId, paidAt, intentJson: JSON.stringify([odd.id]) }, select: { id: true } });
    await db.feeAllocation.create({ data: { schoolId: s, paymentId: payment.id, demandId: odd.id, amountPaise: odd.netPaise } });
    await db.feeReceipt.create({ data: { schoolId: s, paymentId: payment.id, academicYearId: year.id, number, serial: `RCPT/${year.name}/${String(number).padStart(6, "0")}`, issuedAt: paidAt, snapshotJson: JSON.stringify({ school: college.name, pupil: st.name, lines: [{ label: odd.label, amountPaise: odd.netPaise }], method: "BANK", reference }) } });
    await db.feeDemand.update({ where: { id: odd.id }, data: { paidPaise: odd.netPaise, status: "PAID" } });
  }

  // Sakshi's OBC post-matric claim, sanctioned on MahaDBT: the receivable on her ledger.
  const sakshi = students.find((x) => x.n === 2)!;
  await db.scholarshipClaim.upsert({
    where: { studentMembershipId_scheme_academicYear: { studentMembershipId: sakshi.id, scheme: "OBC_POST_MATRIC", academicYear: "2026-27" } },
    create: { schoolId: s, studentMembershipId: sakshi.id, scheme: "OBC_POST_MATRIC", academicYear: "2026-27", portalApplicationId: "MDBT2026PUN0045821", appliedAt: day("2026-08-03"), expectedPaise: 1_100_000, sanctionedPaise: 1_100_000, sanctionedAt: day("2026-09-18"), status: "SANCTIONED", createdByUserId: staff.accounts.userId },
    update: {},
  });
  // The alumna's admission record, completed.
  await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: people.alumna.studentId, programmeId: academics.programmes.BCOM!.id } }, create: { schoolId: s, studentMembershipId: people.alumna.studentId, programmeId: academics.programmes.BCOM!.id, yearOfEntry: 2022, category: "OPEN", quota: "CAP", status: "COMPLETED" }, update: {} });
  return { yearId: year.id, examHeadId: head.EXM! };
}

/* -------------------------------------------------------------------------- */
/* the exam cell: last term's sitting, published                               */
/* -------------------------------------------------------------------------- */

async function buildExams(college: College, people: People, academics: Academics, examHeadId: string) {
  const s = college.id;
  const ctrl = people.staff.exams;
  const sitters = people.students.filter((st) => st.year === 2);
  const name = "Summer 2026 (even term 2025–26)";
  const session = await db.examSession.upsert({
    where: { schoolId_name: { schoolId: s, name } },
    create: { schoolId: s, name, kind: "REGULAR", termId: academics.pastTermId, formOpensAt: new Date("2026-03-01T04:00:00Z"), formClosesAt: new Date("2026-03-20T18:00:00Z"), feePerCoursePaise: 25_000, feePerBacklogPaise: 30_000, photocopyFeePaise: 10_000, revalFeePaise: 40_000, feeHeadId: examHeadId, status: "PUBLISHED", createdByUserId: ctrl.userId },
    update: {},
    select: { id: true },
  });
  const pastCourses = (programme: string) => Object.entries(academics.courses).filter(([, c]) => c.programme === programme && c.semester === 2).map(([code, c]) => ({ code, ...c }));
  // The date sheet: one paper a day from 20 April.
  for (const [i, c] of [...pastCourses("BSCPHY"), ...pastCourses("BCOM")].entries()) {
    await db.examSchedule.upsert({ where: { sessionId_courseId: { sessionId: session.id, courseId: c.id } }, create: { schoolId: s, sessionId: session.id, courseId: c.id, courseCode: c.code, courseName: c.name, at: new Date(Date.UTC(2026, 3, 20 + i, 4, 30)), durationMin: 180 }, update: {} });
  }
  // Forms, approved and locked, and a hall ticket each.
  for (const [k, st] of sitters.entries()) {
    const mine = pastCourses(st.programme);
    const form = await db.examForm.upsert({
      where: { sessionId_studentMembershipId: { sessionId: session.id, studentMembershipId: st.id } },
      create: { schoolId: s, sessionId: session.id, studentMembershipId: st.id, coursesJson: JSON.stringify(mine.map((c) => ({ courseId: c.id, kind: "REGULAR" }))), eligibilityJson: JSON.stringify({ eligible: true, courses: [], noDues: [] }), eligible: true, noDues: true, feePaise: mine.length * 25_000, status: "APPROVED", submittedAt: new Date("2026-03-06T06:00:00Z"), decidedAt: new Date("2026-03-07T06:00:00Z"), decidedByUserId: ctrl.userId, lockedAt: new Date("2026-04-01T06:00:00Z") },
      update: {},
      select: { id: true },
    });
    const number = `HT${String(k + 1).padStart(4, "0")}`;
    await db.hallTicket.upsert({ where: { formId: form.id }, create: { schoolId: s, sessionId: session.id, formId: form.id, studentMembershipId: st.id, number, code: `SACHT26S${String(k + 1).padStart(4, "0")}`, issuedByUserId: ctrl.userId, issuedAt: new Date("2026-04-10T06:00:00Z") }, update: {} });
  }

  // The university's result file, imported: internal of 40 and external of 60. Rutuja falls short in PHY202's external (an ATKT and a backlog).
  const scheme = await db.scheme.findUniqueOrThrow({ where: { id: academics.programmes.BSCPHY!.schemeId }, select: { gradingTable: true, passingRules: true } });
  const rules = rulesOf(scheme.passingRules);
  const table = gradingTableOf(scheme.gradingTable);
  const marksOf = (k: number, j: number, st: StudentSpec, code: string): [number, number] => [24 + ((k * 5 + j * 3) % 15), st.n === 5 && code === "PHY202" ? 18 : 30 + ((k * 7 + j * 5) % 27)];
  const computed = [];
  for (const [k, st] of sitters.entries()) {
    const rows = [];
    for (const [j, c] of pastCourses(st.programme).entries()) {
      const [internal, external] = marksOf(k, j, st, c.code);
      await db.examMark.upsert({
        where: { sessionId_courseId_studentMembershipId_version: { sessionId: session.id, courseId: c.id, studentMembershipId: st.id, version: 1 } },
        create: { schoolId: s, sessionId: session.id, courseId: c.id, studentMembershipId: st.id, internalMilli: internal * 1000, externalMilli: external * 1000, matched: true, source: "IMPORT", version: 1, enteredByUserId: ctrl.userId },
        update: {},
      });
      const out = courseOutcome({ internalMilli: internal * 1000, externalMilli: external * 1000, absent: false, graceMilli: 0 }, rules, table);
      rows.push({ courseId: c.id, kind: "REGULAR", creditsTenths: c.credits, internalMilli: internal * 1000, externalMilli: external * 1000, graceMilli: 0, totalMilli: out.totalMilli, maxMilli: out.maxMilli, grade: out.passed ? out.grade : "F", pointsTenths: out.passed ? out.pointsTenths : 0, status: out.passed ? "PASS" : "FAIL" });
    }
    const status = termStatusOf(rows.filter((r) => r.status !== "PASS").length, rules.atktLimit);
    for (const r of rows) if (r.status === "FAIL" && status === "ATKT") r.status = "ATKT";
    const sgpa = sgpaHundredths(rows);
    computed.push({ st, rows, status, sgpa, attempted: rows.reduce((a, r) => a + r.creditsTenths, 0), earned: rows.filter((r) => r.status === "PASS").reduce((a, r) => a + r.creditsTenths, 0), cls: status === "PASS" ? classFor(sgpa, rules.classBands) : null });
  }
  // Run 1, computed under the scheme as the run computes it, and published.
  const summary = { students: computed.length, passed: computed.filter((c) => c.status === "PASS").length, atkt: computed.filter((c) => c.status === "ATKT").length, failed: computed.filter((c) => c.status === "FAIL").length };
  const run = await db.resultRun.upsert({ where: { sessionId_number: { sessionId: session.id, number: 1 } }, create: { schoolId: s, sessionId: session.id, number: 1, status: "PUBLISHED", computedAt: PUBLISHED_AT, computedByUserId: ctrl.userId, publishedAt: PUBLISHED_AT, publishedByUserId: ctrl.userId, summaryJson: JSON.stringify(summary) }, update: {}, select: { id: true } });
  for (const c of computed) {
    for (const r of c.rows) await db.courseResult.upsert({ where: { runId_studentMembershipId_courseId: { runId: run.id, studentMembershipId: c.st.id, courseId: r.courseId } }, create: { schoolId: s, runId: run.id, studentMembershipId: c.st.id, ...r }, update: {} });
    await db.termResult.upsert({ where: { runId_studentMembershipId: { runId: run.id, studentMembershipId: c.st.id } }, create: { schoolId: s, runId: run.id, studentMembershipId: c.st.id, termId: academics.pastTermId, sgpaHundredths: c.sgpa, creditsAttemptedTenths: c.attempted, creditsEarnedTenths: c.earned, status: c.status, cls: c.cls }, update: {} });
    await db.creditPush.upsert({ where: { studentMembershipId_termId: { studentMembershipId: c.st.id, termId: academics.pastTermId } }, create: { schoolId: s, studentMembershipId: c.st.id, termId: academics.pastTermId, runId: run.id, creditsTenths: c.earned }, update: {} });
    for (const r of c.rows.filter((x) => x.status !== "PASS")) {
      await db.backlog.upsert({ where: { studentMembershipId_courseId: { studentMembershipId: c.st.id, courseId: r.courseId } }, create: { schoolId: s, studentMembershipId: c.st.id, courseId: r.courseId, firstFailedSessionId: session.id, firstFailedAt: PUBLISHED_AT, lastSessionId: session.id }, update: {} });
    }
  }
  return { sessionId: session.id, sgpa: Object.fromEntries(computed.map((c) => [c.st.n, c.sgpa])) as Record<number, number | null> };
}

/* -------------------------------------------------------------------------- */
/* placement                                                                   */
/* -------------------------------------------------------------------------- */

async function buildPlacement(college: College, people: People, academics: Academics, sgpa: Record<number, number | null>) {
  const s = college.id;
  const { staff, students } = people;
  await db.schoolModule.updateMany({ where: { schoolId: s, module: "PLACEMENT" }, data: { settingsJson: JSON.stringify({ seasonBatchYear: seasonBatchFor(new Date().toISOString().slice(0, 10)), dreamRatio: 1.5, allowGenderRule: false }) } });

  // The company: one row for every college, keyed by its GSTIN (made up, its check character computed), checked by this college's TPO, the recruiter bound to it.
  const first14 = "27AADCS7319K1Z";
  const identifier = `${first14}${gstinCheckChar(first14)}`;
  const company = await db.company.upsert({
    where: { identifier },
    create: { name: RECRUITER.company, identifier, sectors: JSON.stringify(["IT_SOFTWARE", "CONSULTING"]), pointOfContact: `${RECRUITER.name}, ${RECRUITER.email}`, createdByUserId: people.recruiterUserId, verifiedAt: new Date("2026-08-20T06:00:00Z"), verifiedByUserId: staff.tpo.userId },
    update: {},
    select: { id: true },
  });
  await db.companyRecruiter.upsert({ where: { companyId_userId: { companyId: company.id, userId: people.recruiterUserId } }, create: { companyId: company.id, userId: people.recruiterUserId, acceptedAt: new Date() }, update: { removedAt: null, acceptedAt: new Date() } });
  await db.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId: s, companyId: company.id } }, create: { schoolId: s, companyId: company.id, firstVisitYear: 2025 }, update: {} });

  // This season: the recruiter's requirement to the college, and the OPEN drive the TPO made of it.
  const rule = { cgpaMin: 6, noLiveBacklogs: true, programmeIds: [academics.programmes.BSCPHY!.id, academics.programmes.BCOM!.id], batchYear: null, genders: [] };
  const rounds = [{ n: 1, kind: "APTITUDE", note: "", at: "2026-10-20T05:00:00.000Z" }, { n: 2, kind: "TECHNICAL_INTERVIEW", note: "", at: null }];
  const role = "Graduate trainee — data analytics";
  const requirement =
    (await db.requirement.findFirst({ where: { companyId: company.id, role }, select: { id: true } })) ??
    (await db.requirement.create({ data: { companyId: company.id, byUserId: people.recruiterUserId, role, packageRupees: 450_000, locations: "Pune", eligibilityAsked: JSON.stringify(rule), rounds: JSON.stringify(rounds.map((r) => ({ kind: r.kind, note: "" }))), datesProposed: "Third week of October", targetSchoolIds: JSON.stringify([s]) }, select: { id: true } }));
  const openTitle = "Graduate trainee — data analytics 2027";
  const open =
    (await db.drive.findFirst({ where: { schoolId: s, title: openTitle }, select: { id: true } })) ??
    (await db.drive.create({ data: { schoolId: s, companyId: company.id, requirementId: requirement.id, kind: "ON_CAMPUS", title: openTitle, jd: "Clean, analyse and present client data; Excel, SQL and a little Python. Training for the first three months.", packageMinRupees: 420_000, packageMaxRupees: 480_000, rounds: JSON.stringify(rounds), schedule: JSON.stringify([{ label: "Pre-placement talk", at: "2026-10-12T05:30:00.000Z" }]), venues: "Seminar hall, first floor", eligibilityRule: JSON.stringify(rule), status: "OPEN", invitedAt: new Date("2026-09-28T06:00:00Z"), createdByUserId: staff.tpo.userId }, select: { id: true } }));
  // Two applicants, with the record they consented to share; Rutuja is kept out by her live backlog.
  for (const n of [1, 6]) {
    const st = students.find((x) => x.n === n)!;
    const record = { cgpa: sgpa[n] === null || sgpa[n] === undefined ? null : sgpa[n]! / 100, liveBacklogs: 0, attendancePct: 90, programmeId: academics.programmes[st.programme]!.id, programmeName: PROGRAMMES.find((p) => p.code === st.programme)!.name, batchYear: 2028, gender: st.gender, category: st.category };
    await db.driveApplication.upsert({ where: { driveId_studentMembershipId: { driveId: open.id, studentMembershipId: st.id } }, create: { schoolId: s, driveId: open.id, studentMembershipId: st.id, studentUserId: st.userId, schoolName: college.name, appliedAt: new Date("2026-10-01T09:00:00Z"), consentAt: new Date("2026-10-01T09:00:00Z"), recordJson: JSON.stringify(record) }, update: {} });
    await db.placementProfile.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, skills: JSON.stringify(n === 1 ? ["Python", "Excel", "Data analysis"] : ["Tally", "Excel", "SQL"]), certifications: JSON.stringify(n === 1 ? ["NPTEL Python for Data Science"] : ["GST practitioner basics"]), projects: JSON.stringify([{ title: n === 1 ? "Rainfall data of Pune, 1990–2020" : "Cash-flow model for a family shop", note: "" }]), consentAt: new Date("2026-10-01T09:00:00Z") }, update: {} });
  }

  // Last season: the closed drive, the alumna through it with an accepted offer, and the 2025 season from the placement table.
  const closedTitle = "Graduate trainee — finance operations 2025";
  const closed =
    (await db.drive.findFirst({ where: { schoolId: s, title: closedTitle }, select: { id: true } })) ??
    (await db.drive.create({ data: { schoolId: s, companyId: company.id, kind: "ON_CAMPUS", title: closedTitle, packageMinRupees: 420_000, packageMaxRupees: 420_000, rounds: JSON.stringify([{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: "2025-01-22T05:30:00.000Z" }]), eligibilityRule: JSON.stringify({ cgpaMin: 6, noLiveBacklogs: true, programmeIds: [], batchYear: 2025, genders: [] }), status: "CLOSED", invitedAt: new Date("2025-01-06T05:30:00Z"), closedAt: new Date("2025-02-28T05:30:00Z"), recruiterRating: 4, recruiterFeedback: "Good grounding in accounts; confident in the interview.", createdByUserId: staff.tpo.userId, createdAt: new Date("2025-01-03T05:30:00Z") }, select: { id: true } }));
  const graduate = people.alumna.studentId;
  await db.driveApplication.upsert({ where: { driveId_studentMembershipId: { driveId: closed.id, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, studentMembershipId: graduate, studentUserId: people.alumna.userId, schoolName: college.name, appliedAt: new Date("2025-01-09T05:30:00Z"), consentAt: new Date("2025-01-09T05:30:00Z"), recordJson: JSON.stringify({ cgpa: 8.1, liveBacklogs: 0, attendancePct: 91, programmeId: academics.programmes.BCOM!.id, programmeName: "BCom", batchYear: 2025, gender: "F", category: "OPEN" }) }, update: {} });
  for (const round of [0, 1]) {
    await db.roundResult.upsert({ where: { driveId_round_studentMembershipId: { driveId: closed.id, round, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, round, studentMembershipId: graduate, outcome: "PASSED", byUserId: people.recruiterUserId }, update: {} });
  }
  await db.offer.upsert({ where: { driveId_studentMembershipId: { driveId: closed.id, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, studentMembershipId: graduate, packageRupees: 420_000, acceptedAt: new Date("2025-02-12T05:30:00Z"), joinedAt: new Date("2025-07-01T04:00:00Z"), byUserId: people.recruiterUserId, createdAt: new Date("2025-02-06T05:30:00Z") }, update: {} });
  if (!(await db.placementSeason.findUnique({ where: { schoolId_batchYear: { schoolId: s, batchYear: 2025 } }, select: { id: true } }))) {
    const t = await placementTable(s, 2025);
    await db.placementSeason.create({ data: { schoolId: s, batchYear: 2025, finalYear: t.finalYear, placed: t.placed, higherStudies: t.higherStudies, entrepreneurs: t.entrepreneurs, offers: t.offers, medianSalaryRupees: t.medianSalaryRupees, computedByUserId: staff.tpo.userId } });
  }
  return { companyId: company.id, openDriveId: open.id };
}

/* -------------------------------------------------------------------------- */
/* the IQAC desk                                                               */
/* -------------------------------------------------------------------------- */

async function buildIqac(college: College, people: People, academics: Academics) {
  const s = college.id;
  const { staff } = people;
  const deptOf = (p: "BSCPHY" | "BCOM") => academics.programmes[p]!.deptId;
  const records: [StaffKey, string, string, boolean, number, string, "BSCPHY" | "BCOM"][] = [
    ["hodPhy", "ASSOCIATE_PROFESSOR", "PHD", true, 9, "2011-06-20", "BSCPHY"],
    ["f1", "ASSISTANT_PROFESSOR", "PHD", true, 2, "2018-07-01", "BSCPHY"],
    ["f2", "ASSISTANT_PROFESSOR", "PG", true, 0, "2023-07-10", "BSCPHY"],
    ["hodCom", "ASSOCIATE_PROFESSOR", "PHD", false, 6, "2009-06-15", "BCOM"],
    ["f3", "ASSISTANT_PROFESSOR", "PG", true, 1, "2020-07-01", "BCOM"],
  ];
  for (const [key, designation, highestQualification, netSetQualified, experienceBeforeYears, joinedOn, dept] of records) {
    await db.facultyRecord.upsert({ where: { membershipId: staff[key].id }, create: { schoolId: s, membershipId: staff[key].id, designation, appointment: "REGULAR", highestQualification, netSetQualified, experienceBeforeYears, joinedOn, departmentId: deptOf(dept), apiScoreJson: JSON.stringify({ teaching: 80, research: 35, service: 15 }), updatedByUserId: staff.registrar.userId }, update: {} });
  }
  const research: [string, string, string, number, number | null, StaffKey | null, "BSCPHY" | "BCOM"][] = [
    ["PUBLICATION", "Low-cost Michelson interferometer for undergraduate labs", "UGC_CARE", 2026, null, "f1", "BSCPHY"],
    ["PUBLICATION", "Thermal conductivity of laterite soils of the Western Ghats", "SCOPUS", 2025, null, "hodPhy", "BSCPHY"],
    ["PROJECT", "Rooftop solar monitoring for the campus (state grant)", "NONE", 2025, 8.5, "hodPhy", "BSCPHY"],
    ["PUBLICATION", "GST compliance among small traders in Pune", "UGC_CARE", 2025, null, "f3", "BCOM"],
  ];
  for (const [kind, title, indexing, year, amountLakhs, by, dept] of research) {
    if (await db.researchItem.findFirst({ where: { schoolId: s, title }, select: { id: true } })) continue;
    await db.researchItem.create({ data: { schoolId: s, kind, title, indexing, year, amountLakhs, facultyMembershipId: by ? staff[by].id : null, departmentId: deptOf(dept), createdByUserId: staff.iqac.userId } });
  }
  const activities: [string, string, string, number, StaffKey[]][] = [
    ["NSS", "NSS village camp at Khanapur", "2026-01-12", 50, []],
    ["EXTENSION", "Science day at the Zilla Parishad school, Warje", "2026-02-28", 35, []],
    ["FDP", "FDP on outcome-based education", "2026-06-15", 5, ["hodPhy", "f1", "f2", "hodCom", "f3"]],
    ["VALUE_ADDED_COURSE", "Tally and GST (value-added course)", "2026-08-10", 40, []],
  ];
  for (const [kind, title, at, participants, ids] of activities) {
    if (await db.activity.findFirst({ where: { schoolId: s, title }, select: { id: true } })) continue;
    await db.activity.create({ data: { schoolId: s, kind, title, at, participants, participantIdsJson: JSON.stringify(ids.map((k) => staff[k].id)), createdByUserId: staff.iqac.userId } });
  }
  const committees: [string, string, { name: string; role: string; membershipId: string | null }[], string, string][] = [
    ["GRIEVANCE", "Students' Grievance Redressal Committee", [{ name: "Dr Anil Deshpande", role: "Chair", membershipId: staff.principal.id }, { name: "Dr Sanjay Bhide", role: "Member", membershipId: staff.hodCom.id }, { name: "Student representative", role: "Special invitee", membershipId: null }], "2026-08-20", "Reviewed the term's two cases; both closed within the limit."],
    ["ANTI_RAGGING", "Anti-ragging Committee", [{ name: "Dr Anil Deshpande", role: "Chair", membershipId: staff.principal.id }, { name: "Smita Kulkarni", role: "Member", membershipId: staff.registrar.id }], "2026-07-10", "Undertakings collected from every first-year student; squad rota fixed."],
    ["IQAC", "Internal Quality Assurance Cell", [{ name: "Dr Anil Deshpande", role: "Chair", membershipId: staff.principal.id }, { name: "Dr Meghana Phadke", role: "Coordinator", membershipId: staff.iqac.id }, { name: "Dr Vasudha Paranjpe", role: "Member", membershipId: staff.hodPhy.id }], "2026-09-05", "Reviewed the feedback analysis and the action taken; the AQAR plan agreed."],
  ];
  let iqacMeeting = "";
  for (const [kind, name, members, at, actionTaken] of committees) {
    const committee = (await db.committee.findFirst({ where: { schoolId: s, kind, name }, select: { id: true } })) ?? (await db.committee.create({ data: { schoolId: s, kind, name, membersJson: JSON.stringify(members) }, select: { id: true } }));
    const meeting = (await db.committeeMeeting.findFirst({ where: { committeeId: committee.id, at }, select: { id: true } })) ?? (await db.committeeMeeting.create({ data: { schoolId: s, committeeId: committee.id, at, actionTaken, createdByUserId: staff.registrar.userId }, select: { id: true } }));
    if (kind === "IQAC") iqacMeeting = meeting.id;
  }

  // The IQAC desk's own pages had nothing to show (the link walk of 5 Oct 2026: /iqac/surveys, /iqac/grievances and
  // /iqac/documents each said "nothing yet" while the committee's minutes spoke of the term's two cases). Last year's
  // satisfaction survey, closed with every student's answers and its action taken; the two grievances the minutes
  // name, both closed within the fifteen working days; written before the cycle is computed so the predictor reads them.
  const SSS_TITLE = "Student Satisfaction Survey 2025–26";
  const sss =
    (await db.survey.findFirst({ where: { schoolId: s, kind: "SSS", title: SSS_TITLE }, select: { id: true } })) ??
    (await db.survey.create({ data: { schoolId: s, kind: "SSS", title: SSS_TITLE, opensOn: "2026-03-02", closesOn: "2026-03-31", questionsJson: JSON.stringify(Array.from({ length: 20 }, (_, i) => `Q${String(i + 1).padStart(2, "0")}`)), salt: "demo-college-sss-2025", createdByUserId: staff.iqac.userId }, select: { id: true } }));
  for (const st of people.students) {
    const respondent = respondentHash(sss.id, st.id, "demo-college-sss-2025");
    const base = st.n % 3 === 0 ? 3 : 4;
    const answers = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`Q${String(i + 1).padStart(2, "0")}`, Math.max(1, base - (i % 4 === 0 ? 1 : 0))]));
    await db.surveyResponse.upsert({ where: { surveyId_respondentHash: { surveyId: sss.id, respondentHash: respondent } }, create: { schoolId: s, surveyId: sss.id, respondentHash: respondent, answersJson: JSON.stringify(answers), createdAt: new Date("2026-03-20T06:00:00Z") }, update: {} });
  }
  // Closed as the desk closes one: the salt wiped, so nobody can work back from a hash to a student.
  await db.survey.updateMany({ where: { id: sss.id, closedAt: null }, data: { closedAt: new Date("2026-04-01T06:00:00Z"), salt: "" } });
  await db.actionTakenReport.upsert({ where: { surveyId: sss.id }, create: { schoolId: s, surveyId: sss.id, text: "Library hours extended to 8 pm before the semester examinations; two remedial tutorials a week in Mathematical Physics.", publishedAt: new Date("2026-04-15T06:00:00Z"), createdByUserId: staff.iqac.userId }, update: {} });
  const grievances: [number, string, string, string, string, string][] = [
    [3, "ACADEMIC", "The practical batch for PHY302 clashes with the Mathematics elective on Wednesdays.", "2026-07-20", "The timetable committee moved the practical to Thursday afternoon.", "2026-07-29"],
    [7, "FEES", "My scholarship is not shown against the odd-semester demand.", "2026-07-27", "The accounts office recorded the sanction against the demand; the net due is corrected.", "2026-08-05"],
  ];
  for (const [n, kind, text, filed, response, resolved] of grievances) {
    if (await db.grievance.findFirst({ where: { schoolId: s, text }, select: { id: true } })) continue;
    const by = people.students.find((x) => x.n === n)!;
    await db.grievance.create({ data: { schoolId: s, byMembershipId: by.id, kind, committeeKind: "GRIEVANCE", text, status: "RESOLVED", filedAt: new Date(`${filed}T05:00:00Z`), dueOn: addWorkingDays(filed, 15), response, acknowledgedAt: new Date(`${filed}T09:00:00Z`), resolvedAt: new Date(`${resolved}T06:00:00Z`), decidedByUserId: staff.registrar.userId } });
  }

  // The cycle: the affiliated framework over 2022–27, two figures the platform does not hold entered by the desk.
  const entered = JSON.stringify({ SANCTIONED_POSTS: { value: 8, byUserId: staff.iqac.userId, at: "2026-09-01T06:00:00.000Z", fileIds: [] }, BANDWIDTH_MBPS: { value: 200, byUserId: staff.iqac.userId, at: "2026-09-01T06:00:00.000Z", fileIds: [] } });
  const cycle =
    (await db.accreditationCycle.findFirst({ where: { schoolId: s, framework: "AFFILIATED_UG" }, select: { id: true } })) ??
    (await db.accreditationCycle.create({ data: { schoolId: s, framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: "2022-06-01", windowTo: "2027-05-31", status: "OPEN", enteredJson: entered, createdByUserId: staff.iqac.userId }, select: { id: true } }));
  // Computed once, by the IQAC library, after every other module's rows exist; the scores are an append-only trend, so a re-run leaves them.
  if ((await db.metricScore.count({ where: { cycleId: cycle.id } })) === 0) {
    await recomputeAsSystem(s, cycle.id, staff.iqac.userId);
    await scoreQualitativeAs({ schoolId: s, userId: staff.iqac.userId, role: "IQAC", membershipId: staff.iqac.id }, cycle.id, "6.5.1", { score: 3, note: "The IQAC meets every term, reviews feedback and acts on it; minutes and the action taken are on record.", fileIds: [], evidence: [{ type: "CommitteeMeeting", id: iqacMeeting }] });
  }
  // Last year's AQAR, cut from the rows by the filings library, signed off by the principal and filed (the desk's
  // /iqac/documents showed "No filing generated yet"). Built once; data:audit's iqac-filing check re-cuts it.
  if (!(await db.collegeFiling.findFirst({ where: { schoolId: s, kind: "AQAR", year: 2025 }, select: { id: true } }))) {
    const built = await buildFiling(s, "AQAR", 2025, cycle.id);
    await db.collegeFiling.create({ data: { schoolId: s, kind: "AQAR", cycleId: cycle.id, year: 2025, format: built.format, body: built.body, hash: iqacHash(built.body), figuresJson: JSON.stringify(built.figures), status: "FILED", checked: true, principalNote: "Approved for submission to the NAAC portal.", generatedAt: new Date("2026-09-08T06:00:00Z"), submittedAt: new Date("2026-09-10T06:00:00Z"), signedOffAt: new Date("2026-09-12T06:00:00Z"), signedOffByUserId: staff.principal.userId, generatedByUserId: staff.iqac.userId } });
  }
  // Generated before it was sent and signed (a first run of this script stamped it the day it ran).
  await db.collegeFiling.updateMany({ where: { schoolId: s, kind: "AQAR", year: 2025, generatedAt: { gt: new Date("2026-09-10T06:00:00Z") } }, data: { generatedAt: new Date("2026-09-08T06:00:00Z") } });
  return { cycleId: cycle.id };
}

/* -------------------------------------------------------------------------- */
/* counts and the roster                                                       */
/* -------------------------------------------------------------------------- */

async function countBlock(schoolId: string, emails: string[], companyId: string, cycleId: string) {
  const s = { schoolId };
  const cycle = await db.accreditationCycle.findUniqueOrThrow({ where: { id: cycleId }, select: { cgpa: true } });
  return {
    users: await db.user.count({ where: { email: { in: emails } } }),
    memberships: await db.membership.count({ where: s }),
    modulesOn: await db.schoolModule.count({ where: s }),
    guardianships: await db.guardianship.count({ where: { studentSchoolId: schoolId } }),
    departments: await db.department.count({ where: s }),
    programmes: await db.programme.count({ where: s }),
    courses: await db.course.count({ where: s }),
    academicTerms: await db.academicTerm.count({ where: s }),
    divisions: await db.division.count({ where: s }),
    seats: await db.studentProgramme.count({ where: s }),
    offerings: await db.courseOffering.count({ where: s }),
    offeringSlots: await db.offeringSlot.count({ where: s }),
    registrations: await db.courseRegistration.count({ where: s }),
    lectures: await db.lecture.count({ where: s }),
    lectureMarks: await db.lectureAttendance.count({ where: s }),
    internalComponents: await db.internalComponent.count({ where: s }),
    internalMarks: await db.internalMark.count({ where: s }),
    internalLocks: await db.internalLock.count({ where: s }),
    examSessions: await db.examSession.count({ where: s }),
    examForms: await db.examForm.count({ where: s }),
    hallTickets: await db.hallTicket.count({ where: s }),
    examMarks: await db.examMark.count({ where: s }),
    publishedRuns: await db.resultRun.count({ where: { ...s, status: "PUBLISHED" } }),
    courseResults: await db.courseResult.count({ where: s }),
    termResults: await db.termResult.count({ where: s }),
    backlogs: await db.backlog.count({ where: s }),
    companyRecruiters: await db.companyRecruiter.count({ where: { companyId } }),
    drives: await db.drive.count({ where: s }),
    openDrives: await db.drive.count({ where: { ...s, status: "OPEN" } }),
    applications: await db.driveApplication.count({ where: s }),
    offers: await db.offer.count({ where: s }),
    placementSeasons: await db.placementSeason.count({ where: s }),
    accreditationCycles: await db.accreditationCycle.count({ where: s }),
    metricScores: await db.metricScore.count({ where: s }),
    cycleCgpa: (cycle.cgpa ?? 0).toFixed(2),
    facultyRecords: await db.facultyRecord.count({ where: s }),
    researchItems: await db.researchItem.count({ where: s }),
    activities: await db.activity.count({ where: s }),
    committees: await db.committee.count({ where: s }),
    feeHeads: await db.feeHead.count({ where: s }),
    feeStructures: await db.feeStructure.count({ where: s }),
    feePlans: await db.studentFeePlan.count({ where: s }),
    feeDemands: await db.feeDemand.count({ where: s }),
    feePayments: await db.feePayment.count({ where: s }),
    feeReceipts: await db.feeReceipt.count({ where: s }),
    scholarshipClaims: await db.scholarshipClaim.count({ where: s }),
    programmeEnrolments: await db.programmeEnrolment.count({ where: s }),
    pupilRecords: await db.pupilRecord.count({ where: s }),
    alumniProfiles: await db.alumniProfile.count({ where: s }),
    surveys: await db.survey.count({ where: s }),
    surveyResponses: await db.surveyResponse.count({ where: s }),
    grievances: await db.grievance.count({ where: s }),
    collegeFilings: await db.collegeFiling.count({ where: s }),
  };
}

function roster(college: College, sgpa: Record<number, number | null>): string {
  const sg = (n: number) => (sgpa[n] === null || sgpa[n] === undefined ? "—" : (sgpa[n]! / 100).toFixed(2));
  const studentLine = (st: StudentSpec) => {
    const notes: string[] = [];
    if (st.year === 2) notes.push(`last term's SGPA ${sg(st.n)}`);
    if (st.n === 2) notes.push("OBC post-matric scholarship sanctioned (/student/scholarships, /student/money)");
    if (st.n === 5) notes.push("ATKT in PHY202 with a backlog; under 75 % in PHY301; not eligible for the open drive");
    if (st.n === 1 || st.n === 6) notes.push("applied to the open drive (/student/placement)");
    if (st.n === 9) notes.push("a minor of 17; her guardian sees everything");
    if (st.paidOdd) notes.push("odd semester paid");
    return `| ${studentEmail(st.n)} | ${st.name} | Student, ${st.year === 2 ? "SY" : "FY"} ${PROGRAMMES.find((p) => p.code === st.programme)!.name} (${st.category}) | /student | /student/academics, /student/exams, /student/money${notes.length ? `; ${notes.join("; ")}` : ""} |`;
  };
  return `<!-- demo-college:begin -->
## Saraswati Arts and Science College (the demo college)

Built by \`npm run demo:college\` (from \`apps/web\`; idempotent, run it again to put things back; it does not need \`demo:schools\` first). Slug \`${SLUG}\`, join code \`${college.code}\`, kind COLLEGE, Pune, affiliated to Savitribai Phule Pune University, AISHE C-41873 (made up), NAAC A until 31 December 2028. Every module the college is offered is on. The password is the demo schools' shared one, \`${PASSWORD}\`, for every account below. Sign in by hand, or for a browser check mint a session: \`npm run zz:token -- ROLE email@${DOMAIN}\` (then \`--purge\`).

What is in it: Physics (head Dr Vasudha Paranjpe) and Commerce (head Dr Sanjay Bhide); BSc Physics and BCom on the SPPU NEP 2024 scheme with programme and course outcomes; the odd term 2026–27 (current) and the even term 2025–26; divisions SY BSc Physics A, SY BCom A and FY BCom A; seven offerings on a Mon–Sat grid with lecture registers from 7 September to 3 October 2026; internal marks countersigned and locked on PHY301 and COM301, PHY302's unit test waiting for a countersign; the Summer 2026 sitting with the university's result file imported and run 1 published (SGPA for every second-year student, one ATKT and its backlog); ${RECRUITER.company} (GSTIN checked by the TPO) with an OPEN drive and two applicants, last season's closed drive with the alumna's accepted offer and the 2025 season; a NAAC cycle (affiliated UG, 2022–27) computed by the IQAC desk, with faculty records, research, activities and three committees; the IQAC's own rows: the Student Satisfaction Survey 2025–26 closed with ten responses (the salt wiped, as the desk closes one) and its action-taken report, two RESOLVED grievances (a timetable clash and a scholarship not shown on a demand, both closed within fifteen working days, as the grievance committee's minutes say), and the 2025 AQAR built by the filings library, sent, signed off by the principal and FILED; fee structures by programme, year and category, a demand per semester for every student, four odd semesters paid by bank and one scholarship claim sanctioned.

| Account | Name | Role | Home | What to look at |
|---|---|---|---|---|
${STAFF.map((p) => `| ${p.email} | ${p.name} | ${p.role === "ADMIN" ? "Admin (registrar)" : p.role} | ${p.home} | ${p.look} |`).join("\n")}
${STUDENTS.map(studentLine).join("\n")}
| ${GUARDIAN.email} | ${GUARDIAN.name} | Parent of Pooja Bhosale (a minor) | /parent | /parent/academics, /parent/results, /parent/fees |
| ${ALUMNA.email} | ${ALUMNA.name} | Alumna (BCom, left May 2025) | /alumni | /alumni/college (placed through last season's drive, a mentor), the directory |
| ${RECRUITER.email} | ${RECRUITER.name} | Recruiter, ${RECRUITER.company} (no membership) | /recruiter | the OPEN drive and its two consented applicants |
<!-- demo-college:end -->
`;
}

async function writeRoster(block: string): Promise<string> {
  const docPath = join(process.cwd(), "..", "..", "docs", "demo-schools.md");
  await mkdir(join(process.cwd(), "..", "..", "docs"), { recursive: true });
  const before = await readFile(docPath, "utf8").catch(() => "");
  const marked = /<!-- demo-college:begin -->[\s\S]*?<!-- demo-college:end -->\n?/;
  const after = marked.test(before) ? before.replace(marked, block) : `${before.trimEnd()}${before ? "\n\n" : ""}${block}`;
  if (after !== before) await writeFile(docPath, after);
  return docPath;
}

async function main() {
  await refuseUnlessLocal("demo:college");
  const ctx: Ctx = { passwordHash: await hash(PASSWORD, ARGON), setPassword: true };
  const college = await buildCollege();
  const people = await buildPeople(ctx, college);
  // Every module a college is offered: the school version's six and the college's six.
  await switchModulesOn(college, SCHOOL_MODULES, people.staff.registrar.userId);
  const academics = await buildAcademics(college, people);
  const office = await buildOffice(college, people, academics);
  const exams = await buildExams(college, people, academics, office.examHeadId);
  const placement = await buildPlacement(college, people, academics, exams.sgpa);
  const iqac = await buildIqac(college, people, academics);

  const emails = [...STAFF.map((p) => p.email), ...STUDENTS.map((st) => studentEmail(st.n)), GUARDIAN.email, ALUMNA.email, RECRUITER.email];
  const counts = await countBlock(college.id, emails, placement.companyId, iqac.cycleId);
  const docPath = await writeRoster(roster(college, exams.sgpa));

  console.log(`
  Demo college ready. Password for EVERY account below: ${PASSWORD}

  ── ${college.name} ──────────────────────────────────────────
     school id   ${college.id}   join code ${college.code}   slug ${SLUG}
     office      ${STAFF[0]!.email} (registrar), ${STAFF[1]!.email}
     staff       ${STAFF.slice(2).map((p) => `${p.email.split("@")[0]} (${p.role})`).join(", ")} @${DOMAIN}
     students    sac.student01..10@${DOMAIN} — 5 SY BSc Physics, 3 SY BCom, 2 FY BCom (sac.student09 a minor; guardian ${GUARDIAN.email})
     alumna      ${ALUMNA.email}; recruiter ${RECRUITER.email} (no membership)
     academics   ${counts.offerings} offerings this term, ${counts.lectures} lectures with ${counts.lectureMarks} marks, ${counts.internalLocks} offerings' internal marks locked
     exams       Summer 2026 sitting published: ${counts.termResults} term results, ${counts.backlogs} backlog
     placement   ${counts.openDrives} OPEN drive (${placement.openDriveId}) with ${counts.applications - 1} applicants; 2025 season from last year's closed drive
     IQAC        NAAC cycle ${iqac.cycleId}, CGPA ${counts.cycleCgpa}
     fees        ${counts.feeStructures} structures, ${counts.feeDemands} demands, ${counts.feeReceipts} receipts, ${counts.scholarshipClaims} scholarship claim

  Roster written to ${docPath}

  ── Counts (compare two runs line for line) ──────────────────────────
${Object.entries(counts).map(([k, v]) => `     ${k.padEnd(22)} ${v}`).join("\n")}
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
