/**
 * The demo AUTONOMOUS ENGINEERING college (5 October 2026, the streams batch's
 * seventh commit), beside the arts and science demo college, behind the demo
 * schools' ONE shared password.
 *
 *   npm run demo:college-engineering
 *
 * Saraswati Institute of Technology, Pune (slug `saraswati-tech`, kind
 * AUTONOMOUS_COLLEGE, streams ENGINEERING): affiliated to Savitribai Phule Pune
 * University for the degree but autonomous in conduct, an AICTE approval with
 * its extension-of-approval reference recorded, NBA for Computer Engineering.
 * The modules the ENGINEERING preset turns on (alumni, academics, exams,
 * admissions, scholarships, IQAC, placement, inventory) and the four the roster's
 * module roles work in (library, hostel, transport, payroll) — every module a
 * college is offered. Computer and Mechanical Engineering, each with a head; BE
 * programmes on the institute's own autonomous scheme with outcomes; this odd
 * term and last even term; two divisions of each programme's second year and
 * one first-year division; lab batches A and B (capacity 20) in each
 * second-year division; offerings with lecture hours and one LAB hour per batch;
 * four weeks of lecture registers (the LAB hours registered for the batch only);
 * a practical record for every lab student (experiment 1 signed by the
 * department's lab in-charge, experiment 2 of CE301 in division A waiting for
 * a signature); internal marks locked on CE301 (SE Computer A), ME302's unit
 * test waiting for a countersign; this term's session IN CONDUCT with the
 * CE301 paper set and SEALED (the autonomous cell's own paper) and ME302's
 * assigned to its setter; last term's session PUBLISHED from marks the cell
 * entered by double entry, with a grade card for every student who sat; a
 * verified recruiter's OPEN drive with two applicants, last season's closed
 * drive with the alumnus's accepted offer, one SUMMER internship credited; an
 * AUTONOMOUS NAAC cycle computed by the IQAC library; the NBA SAR for Computer
 * Engineering (this academic year's draft, three criteria self-assessed by the
 * HOD); the AICTE mandatory disclosure published; fee structures under the fee
 * regulating authority with a scholarship claim sanctioned; a boys' hostel with
 * four boarders; a bus route with three riders; inventory with lab equipment
 * (stock, assets, one breakage written off); payroll for every member of staff
 * with September locked; duties: a LAB_INCHARGE per department, an
 * ANTI_RAGGING_SQUAD member, a RESEARCH_DEAN, an EXAM_SQUAD member and an
 * NSS_OFFICER with three students enrolled.
 *
 * WHY A SECOND SCRIPT, NOT A FLAG ON demo-college.ts: the two colleges share no
 * row but the password, and demo-college.ts writes its own roster block; this
 * one writes the block between `demo-college-engineering` markers in
 * docs/demo-schools.md and leaves the arts college's alone.
 *
 * IDEMPOTENT. Every write is find-or-create keyed on something stable (the
 * slug, an email, a code, a unique pair, a name within the college); a second
 * run adds nothing and prints the same counts. The NAAC cycle is computed once
 * (append-only scores); the NBA SAR is a DRAFT rebuilt in place on each run, as
 * the desk rebuilds one.
 *
 * WHAT IT NEVER TOUCHES: any row that is not this college's or a
 * `sit.*@demo.relay.test` person's; the one shared row it writes — the
 * recruiter's company — by its own identifier. Runs on the ADMIN connection.
 */
import { hash } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { COMPONENT_KIND, SCHOOL_MODULES, STATUTORY_CODES, gstinCheckChar, type SalaryComponentCode, type SalaryFormula } from "@edulink/contracts";
import { classCode, schoolCode } from "../src/lib/codes";
import { openAlumnus } from "../src/lib/alumni-membership";
import { lockTotals } from "../src/lib/academics-assessment";
import { checkCode, classFor, courseOutcome, gradingTableOf, rulesOf, sgpaHundredths, sgpaNumber, tenths, termStatusOf } from "../src/lib/exam-cell-rules";
import { placementTable } from "../src/lib/placement-analytics";
import { seasonBatchFor } from "../src/lib/placement-rules";
import { iqacHash, recomputeAsSystem } from "../src/lib/iqac";
import { buildFiling, disclosureDocument } from "../src/lib/iqac-filings";
import { defaultFilingYear } from "../src/lib/council-filings";
import { computeSlip, daysInMonthOf, slipDigest } from "../src/lib/payroll-rules";
import { db, link, refuseUnlessLocal, switchModulesOn, upsertMembership, upsertUser, type Ctx } from "./zz-fixtures";
import { PASSWORD } from "./demo-schools";

const DOMAIN = "demo.relay.test";
const SLUG = "saraswati-tech";
const NAME = "Saraswati Institute of Technology";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const day = (key: string) => new Date(`${key}T00:00:00Z`);
const mail = (local: string) => `${local}@${DOMAIN}`;
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/* -------------------------------------------------------------------------- */
/* the people                                                                  */
/* -------------------------------------------------------------------------- */

type StaffKey = "registrar" | "principal" | "hodComp" | "hodMech" | "f1" | "f2" | "f3" | "f4" | "exams" | "iqac" | "tpo" | "accounts" | "librarian" | "warden" | "driver";
type StaffSpec = { key: StaffKey; email: string; name: string; role: string; title: string; home: string; look: string; duties?: string[]; basic: number };
const STAFF: StaffSpec[] = [
  { key: "registrar", email: mail("sit.registrar"), name: "Madhavi Ranade", role: "ADMIN", title: "Registrar", home: "/admin", look: "/admin (the engineering home), /admin/academics, /admin/stream-records (lab batches, practicals), /admin/people (duties on the row menu), /accounts, /admin/inventory", basic: 4_800_000 },
  { key: "principal", email: mail("sit.principal"), name: "Dr Shrikant Gokhale", role: "PRINCIPAL", title: "Principal", home: "/principal", look: "/principal/college, /principal/accreditation (the autonomous NAAC cycle), /exam-cell, /iqac/documents (the NBA SAR to sign off once sent)", basic: 9_500_000 },
  { key: "hodComp", email: mail("sit.hod.comp"), name: "Dr Anagha Kelkar", role: "HOD", title: "Head, Department of Computer Engineering", home: "/hod", look: "/hod/nba?year=2026 (this year's SAR draft, three criteria written; the page opens on last year's, empty), /hod/practicals, /duties/research (holds RESEARCH_DEAN), /faculty (teaches CE302)", duties: ["RESEARCH_DEAN"], basic: 8_200_000 },
  { key: "hodMech", email: mail("sit.hod.mech"), name: "Dr Vikas Phadnis", role: "HOD", title: "Head, Department of Mechanical Engineering", home: "/hod", look: "/hod (Mechanical), /hod/practicals, /faculty (teaches ME301 in SE Mechanical A)", basic: 8_000_000 },
  { key: "f1", email: mail("sit.faculty1"), name: "Prof Nikhil Bapat", role: "FACULTY", title: "Assistant professor, Computer Engineering", home: "/faculty", look: "CE301 in SE Computer A (internal marks locked) and CE102; /duties/lab (LAB_INCHARGE, Computer Lab 1: stock, the breakage, rows to sign), /faculty/practicals", duties: ["LAB_INCHARGE"], basic: 5_600_000 },
  { key: "f2", email: mail("sit.faculty2"), name: "Prof Rasika Dixit", role: "FACULTY", title: "Assistant professor, Computer Engineering", home: "/faculty", look: "CE301 in SE Computer B and CE101; the CE301 paper set and sealed (/faculty/exams); /duties/anti-ragging and /duties/nss (ANTI_RAGGING_SQUAD, NSS_OFFICER)", duties: ["ANTI_RAGGING_SQUAD", "NSS_OFFICER"], basic: 5_400_000 },
  { key: "f3", email: mail("sit.faculty3"), name: "Prof Sameer Kulkarni", role: "FACULTY", title: "Assistant professor, Mechanical Engineering", home: "/faculty", look: "ME302 in both SE Mechanical divisions (A's unit test waiting for a countersign), the ME302 paper assigned; /duties/lab (LAB_INCHARGE, Strength of Materials Lab)", duties: ["LAB_INCHARGE"], basic: 5_500_000 },
  { key: "f4", email: mail("sit.faculty4"), name: "Prof Pallavi Sathe", role: "FACULTY", title: "Assistant professor, Mechanical Engineering", home: "/faculty", look: "ME301 in SE Mechanical B; /duties/exam-squad (EXAM_SQUAD: the Winter 2026 papers ahead)", duties: ["EXAM_SQUAD"], basic: 5_200_000 },
  { key: "exams", email: mail("sit.exams"), name: "Dr Hemant Joshi", role: "EXAM_CONTROLLER", title: "Controller of examinations", home: "/exam-cell", look: "Winter 2026 in CONDUCT (the sealed CE301 paper, the ME302 paper assigned, hall tickets); Summer 2026 published (marks by double entry, grade cards, one ATKT)", basic: 6_800_000 },
  { key: "iqac", email: mail("sit.iqac"), name: "Dr Swati Marathe", role: "IQAC", title: "IQAC coordinator", home: "/iqac", look: "/iqac/predictor (the autonomous cycle), /iqac/documents (the engineering filings, the NBA SAR draft, the AICTE disclosure published), /iqac/documents/nba?year=2026 (the SAR draft with its figures)", basic: 6_500_000 },
  { key: "tpo", email: mail("sit.tpo"), name: "Rahul Wagh", role: "TPO", title: "Training and placement officer", home: "/placement", look: "/placement/drives (Deccan Robotics' OPEN drive, two applicants), /placement/internships (the SUMMER internship), /placement/analytics (2025 season)", basic: 4_500_000 },
  { key: "accounts", email: mail("sit.accounts"), name: "Kavita Deshmukh", role: "ACCOUNTS", title: "Accounts officer", home: "/accounts", look: "/accounts (collection, defaulters), /accounts/structures (FRA approvals), /accounts/scholarships, /admin/payroll (September locked)", basic: 4_200_000 },
  { key: "librarian", email: mail("sit.librarian"), name: "Sunanda Apte", role: "LIBRARIAN", title: "Librarian", home: "/library", look: "the catalogue (engineering titles), one book out with Rohan", basic: 3_800_000 },
  { key: "warden", email: mail("sit.warden"), name: "Ganesh Pawar", role: "WARDEN", title: "Warden, Visvesvaraya Hostel", home: "/hostel", look: "four boarders (one a minor), the anti-ragging squad's round", basic: 3_200_000 },
  { key: "driver", email: mail("sit.driver"), name: "Dattatray Kale", role: "DRIVER", title: "Driver, Route 1", home: "/driver", look: "Route 1 — Hadapsar to campus, three riders", basic: 2_400_000 },
];

type Prog = "BECOMP" | "BEMECH";
type StudentSpec = { n: number; name: string; gender: "M" | "F"; birth: string; programme: Prog; year: 1 | 2; div: string; category: "OPEN" | "OBC"; paidOdd: boolean };
/** Six second-year Computer (two divisions), four second-year Mechanical (two divisions), two first-year Computer (both seventeen). */
const STUDENTS: StudentSpec[] = [
  { n: 1, name: "Aarya Kulkarni", gender: "F", birth: "2006-08-11", programme: "BECOMP", year: 2, div: "SECA", category: "OPEN", paidOdd: true },
  { n: 2, name: "Rohan Deshpande", gender: "M", birth: "2007-01-19", programme: "BECOMP", year: 2, div: "SECA", category: "OBC", paidOdd: false },
  { n: 3, name: "Ishita Patil", gender: "F", birth: "2006-10-02", programme: "BECOMP", year: 2, div: "SECA", category: "OPEN", paidOdd: true },
  { n: 4, name: "Siddharth Joshi", gender: "M", birth: "2006-12-27", programme: "BECOMP", year: 2, div: "SECB", category: "OPEN", paidOdd: true },
  { n: 5, name: "Neha Gaikwad", gender: "F", birth: "2007-03-15", programme: "BECOMP", year: 2, div: "SECB", category: "OPEN", paidOdd: false },
  { n: 6, name: "Varun Shinde", gender: "M", birth: "2006-09-08", programme: "BECOMP", year: 2, div: "SECB", category: "OBC", paidOdd: false },
  { n: 7, name: "Aditya Pawar", gender: "M", birth: "2006-07-21", programme: "BEMECH", year: 2, div: "SEMA", category: "OPEN", paidOdd: true },
  { n: 8, name: "Shruti More", gender: "F", birth: "2007-02-03", programme: "BEMECH", year: 2, div: "SEMA", category: "OBC", paidOdd: false },
  { n: 9, name: "Omkar Jadhav", gender: "M", birth: "2006-11-30", programme: "BEMECH", year: 2, div: "SEMB", category: "OPEN", paidOdd: false },
  { n: 10, name: "Pratik Bhosale", gender: "M", birth: "2007-04-18", programme: "BEMECH", year: 2, div: "SEMB", category: "OPEN", paidOdd: true },
  { n: 11, name: "Anushka Kale", gender: "F", birth: "2009-02-14", programme: "BECOMP", year: 1, div: "FECA", category: "OPEN", paidOdd: true },
  { n: 12, name: "Yash Thorat", gender: "M", birth: "2009-06-30", programme: "BECOMP", year: 1, div: "FECA", category: "OPEN", paidOdd: false },
];
const MINORS = new Set([11, 12]);
const studentEmail = (n: number) => mail(`sit.student${pad(n)}`);
const GUARDIAN = { email: mail("sit.parent11"), name: "Suresh Kale", phone: "+919822081011", of: 11 };
const ALUMNUS = { email: mail("sit.alumni01"), name: "Kedar Limaye", birth: "2003-04-12", joined: "2021-08-02T04:00:00Z", left: "2025-05-31T06:30:00Z" };
const RECRUITER = { email: mail("sit.recruiter"), name: "Meera Iyer", company: "Deccan Robotics Pvt Ltd" };
const BOARDERS = [4, 7, 9, 12];
const RIDERS = [1, 3, 11];
const NSS = [1, 6, 8];

/* -------------------------------------------------------------------------- */
/* the academic structure                                                      */
/* -------------------------------------------------------------------------- */

const GRADES = [
  { grade: "O", points: 10, minPercent: 90 },
  { grade: "A+", points: 9, minPercent: 80 },
  { grade: "A", points: 8, minPercent: 70 },
  { grade: "B+", points: 7, minPercent: 60 },
  { grade: "B", points: 6, minPercent: 55 },
  { grade: "C", points: 5, minPercent: 50 },
  { grade: "P", points: 4, minPercent: 40 },
  { grade: "F", points: 0, minPercent: 0 },
];
const RULES = { minPercentPerCourse: 40, atktLimit: 4, totalCredits: 160, internalMax: 40, externalMax: 60, minTermCredits: 16, maxTermCredits: 28 };
const SCHEME = "SIT Autonomous 2024";

type CourseSpec = { code: string; name: string; semester: number; l: number; t: number; p: number; cos: string[] };
const PROGRAMMES: { code: Prog; name: string; dept: { code: "COMP" | "MECH"; name: string }; intake: number; pos: [string, string][]; courses: CourseSpec[] }[] = [
  {
    code: "BECOMP",
    name: "BE Computer Engineering",
    dept: { code: "COMP", name: "Department of Computer Engineering" },
    intake: 120,
    pos: [["PO1", "Engineering knowledge: apply mathematics, science and computing to engineering problems."], ["PO2", "Problem analysis: formulate and analyse computing problems."], ["PO3", "Design and development of software and digital systems."]],
    courses: [
      { code: "CE101", name: "Engineering Mathematics I", semester: 1, l: 3, t: 1, p: 0, cos: ["Apply differential calculus to engineering problems.", "Solve systems of linear equations by matrices."] },
      { code: "CE102", name: "Programming and Problem Solving", semester: 1, l: 3, t: 0, p: 1, cos: ["Write structured programs in Python.", "Trace and debug a program's flow."] },
      { code: "CE201", name: "Engineering Mathematics II", semester: 2, l: 3, t: 1, p: 0, cos: ["Solve ordinary differential equations.", "Apply multiple integrals."] },
      { code: "CE202", name: "Basic Electronics Engineering", semester: 2, l: 3, t: 0, p: 1, cos: ["Analyse diode and transistor circuits.", "Build simple logic circuits."] },
      { code: "CE301", name: "Data Structures", semester: 3, l: 3, t: 0, p: 1, cos: ["Implement stacks, queues and linked lists.", "Choose a data structure for a problem.", "Analyse the cost of an algorithm."] },
      { code: "CE302", name: "Discrete Mathematics", semester: 3, l: 3, t: 1, p: 0, cos: ["Reason with sets, relations and logic.", "Solve counting and graph problems."] },
    ],
  },
  {
    code: "BEMECH",
    name: "BE Mechanical Engineering",
    dept: { code: "MECH", name: "Department of Mechanical Engineering" },
    intake: 60,
    pos: [["PO1", "Engineering knowledge of mechanics, materials and thermal sciences."], ["PO2", "Problem analysis of mechanical systems."], ["PO3", "Design of components and processes."]],
    courses: [
      { code: "ME201", name: "Engineering Mechanics", semester: 2, l: 3, t: 0, p: 1, cos: ["Resolve force systems.", "Analyse friction and trusses."] },
      { code: "ME202", name: "Engineering Graphics", semester: 2, l: 2, t: 0, p: 2, cos: ["Draw orthographic projections.", "Read a machine drawing."] },
      { code: "ME301", name: "Thermodynamics", semester: 3, l: 3, t: 1, p: 0, cos: ["Apply the first and second laws.", "Analyse power and refrigeration cycles."] },
      { code: "ME302", name: "Strength of Materials", semester: 3, l: 3, t: 0, p: 1, cos: ["Compute stresses and strains in members.", "Test materials in tension and torsion."] },
    ],
  },
];
const CURRENT_TERM = { name: "Odd term 2026–27", academicYear: "2026–27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-06-20", registrationClosesOn: "2026-07-15" };
const PAST_TERM = { name: "Even term 2025–26", academicYear: "2025–26", startsOn: "2025-12-01", endsOn: "2026-04-30", registrationOpensOn: "2025-11-20", registrationClosesOn: "2025-12-10" };
const DIVISIONS: { key: string; name: string; programme: Prog; year: 1 | 2; room: string }[] = [
  { key: "SECA", name: "SE Computer A", programme: "BECOMP", year: 2, room: "Room 101" },
  { key: "SECB", name: "SE Computer B", programme: "BECOMP", year: 2, room: "Room 102" },
  { key: "SEMA", name: "SE Mechanical A", programme: "BEMECH", year: 2, room: "Room 201" },
  { key: "SEMB", name: "SE Mechanical B", programme: "BEMECH", year: 2, room: "Room 202" },
  { key: "FECA", name: "FE Computer A", programme: "BECOMP", year: 1, room: "Room 103" },
];
const LABS = { BECOMP: "Computer Lab 1", BEMECH: "Strength of Materials Lab" } as const;
/**
 * This term's offerings: [course, division, teacher, lecture hours [weekday, bell][], LAB hours per batch {A, B}].
 * Weekday 1 = Monday. No teacher, room, division or batch is in two places at once.
 */
const OFFERINGS: [string, string, StaffKey, [number, number][], { A?: [number, number]; B?: [number, number] }][] = [
  ["CE301", "SECA", "f1", [[1, 1], [3, 1]], { A: [5, 1], B: [5, 2] }],
  ["CE302", "SECA", "hodComp", [[2, 1], [4, 1]], {}],
  ["CE301", "SECB", "f2", [[1, 2], [3, 2]], { A: [6, 1], B: [6, 2] }],
  ["CE302", "SECB", "hodComp", [[2, 2], [4, 2]], {}],
  ["ME301", "SEMA", "hodMech", [[1, 4], [3, 4]], {}],
  ["ME302", "SEMA", "f3", [[2, 4], [4, 4]], { A: [5, 4], B: [5, 5] }],
  ["ME301", "SEMB", "f4", [[1, 5], [3, 5]], {}],
  ["ME302", "SEMB", "f3", [[2, 5], [4, 5]], { A: [6, 4], B: [6, 5] }],
  ["CE101", "FECA", "f2", [[1, 3], [3, 3]], {}],
  ["CE102", "FECA", "f1", [[2, 3], [4, 3]], { A: [5, 3] }],
];
const REGISTER_FROM = "2026-09-07";
const REGISTER_TO = "2026-10-03";
const COUNTERSIGNED_AT = new Date("2026-09-30T10:00:00Z");
const LOCKED_AT = new Date("2026-10-01T10:00:00Z");
const PUBLISHED_AT = new Date("2026-05-25T06:30:00Z");
const PAYROLL_MONTH = "2026-09";

type Member = { id: string; userId: string };
type College = { id: string; name: string; code: string };

/* -------------------------------------------------------------------------- */

async function buildCollege(): Promise<College> {
  const existing = await db.school.findUnique({ where: { slug: SLUG }, select: { id: true, name: true, code: true } });
  // A demo tenant lists like a real customer (B-28): not a test fixture.
  const profile = {
    kind: "AUTONOMOUS_COLLEGE",
    affiliatingUniversity: "Savitribai Phule Pune University",
    aisheCode: "C-41902",
    // The AICTE approval with this session's extension of approval (made up, in the shape AICTE's letters carry).
    aicteApprovalRef: "F.No. Western/1-9318274/2026/EOA, 30 April 2026",
    naacGrade: "A",
    naacValidUntil: day("2029-03-31"),
    nirfCategory: "ENGINEERING",
    isTestFixture: false,
    streamsJson: JSON.stringify(["ENGINEERING"]),
  };
  if (existing) {
    await db.school.update({ where: { id: existing.id }, data: profile });
    return existing;
  }
  return db.school.create({
    data: { name: NAME, slug: SLUG, code: schoolCode(NAME), city: "Pune", region: "Maharashtra", country: "India", contactEmail: mail("office.sit"), contactPhone: "+912026981450", addressLine: "Survey No. 44, Hadapsar", timezone: "Asia/Kolkata", locale: "en", brandPrimary: "#0f766e", verifiedAt: new Date(), ...profile },
    select: { id: true, name: true, code: true },
  });
}

async function buildPeople(ctx: Ctx, college: College) {
  const staff = {} as Record<StaffKey, Member>;
  for (const p of STAFF) {
    const user = await upsertUser(ctx, p.email, p.name);
    const m = await upsertMembership(user.id, college.id, p.role, { title: p.title });
    // Duties sit on the membership (S0's framework); written each run so the roster is what the page says.
    if (p.role === "FACULTY" || p.role === "HOD") await db.membership.update({ where: { id: m.id }, data: { dutiesJson: JSON.stringify(p.duties ?? []) } });
    staff[p.key] = { id: m.id, userId: user.id };
  }
  const students: (StudentSpec & Member)[] = [];
  for (const s of STUDENTS) {
    const birthdate = day(s.birth);
    const isMinor = MINORS.has(s.n);
    const user = await upsertUser(ctx, studentEmail(s.n), s.name, { birthdate, isMinor });
    await db.user.update({ where: { id: user.id }, data: { birthdate, isMinor } });
    const m = await upsertMembership(user.id, college.id, "STUDENT", { gradeLevel: String(s.year) });
    const entry = s.year === 2 ? 2025 : 2026;
    await db.membership.updateMany({ where: { id: m.id, studentCode: null }, data: { studentCode: `SIT-${entry}-${pad(s.n)}` } });
    students.push({ ...s, id: m.id, userId: user.id });
  }
  const guardian = await upsertUser(ctx, GUARDIAN.email, GUARDIAN.name, { phone: GUARDIAN.phone, phoneVerifiedAt: new Date() });
  await link(guardian.id, students.find((s) => s.n === GUARDIAN.of)!.id, college.id);

  // The alumnus: a closed STUDENT row and the open ALUMNUS row, as a departure leaves them.
  const alumnus = await upsertUser(ctx, ALUMNUS.email, ALUMNUS.name, { birthdate: day(ALUMNUS.birth), isMinor: false });
  const leftAt = new Date(ALUMNUS.left);
  const wasStudent =
    (await db.membership.findUnique({ where: { userId_schoolId_role: { userId: alumnus.id, schoolId: college.id, role: "STUDENT" } }, select: { id: true } })) ??
    (await db.membership.create({ data: { userId: alumnus.id, schoolId: college.id, role: "STUDENT", status: "ACTIVE", gradeLevel: "4", joinedAt: new Date(ALUMNUS.joined), leftAt, studentCode: "SIT-2021-17" }, select: { id: true } }));
  await openAlumnus(db as unknown as Parameters<typeof openAlumnus>[0], alumnus.id, college.id, leftAt);
  const alumnusRow = await db.membership.findUniqueOrThrow({ where: { userId_schoolId_role: { userId: alumnus.id, schoolId: college.id, role: "ALUMNUS" } }, select: { id: true } });
  await db.alumniProfile.upsert({
    where: { membershipId: alumnusRow.id },
    create: { schoolId: college.id, membershipId: alumnusRow.id, userId: alumnus.id, listed: true, listedAt: new Date("2025-08-01T06:00:00Z"), city: "Pune", occupation: "Embedded software engineer, Deccan Robotics", mentor: true, mentorAt: new Date("2025-09-01T06:00:00Z"), mentorByUserId: staff.registrar.userId },
    update: {},
  });

  const recruiter = await upsertUser(ctx, RECRUITER.email, RECRUITER.name);
  await db.recruiterProfile.upsert({ where: { userId: recruiter.id }, create: { userId: recruiter.id, companyName: RECRUITER.company }, update: { disabledAt: null } });

  return { staff, students, guardianUserId: guardian.id, alumnus: { userId: alumnus.id, studentId: wasStudent.id, alumnusId: alumnusRow.id }, recruiterUserId: recruiter.id };
}

type People = Awaited<ReturnType<typeof buildPeople>>;

/* -------------------------------------------------------------------------- */
/* academics: structure, batches, offerings, registers, practicals, internals  */
/* -------------------------------------------------------------------------- */

async function buildAcademics(college: College, people: People) {
  const s = college.id;
  const { staff, students } = people;
  await db.academicsSettings.upsert({ where: { schoolId: s }, create: { schoolId: s, loadMinHours: 14, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 }, update: {} });

  const programmes: Record<string, { id: string; schemeId: string; deptId: string }> = {};
  const courses: Record<string, { id: string; credits: number; name: string; programme: Prog; semester: number; p: number }> = {};
  for (const p of PROGRAMMES) {
    const hod = p.code === "BECOMP" ? staff.hodComp : staff.hodMech;
    const dept = await db.department.upsert({ where: { schoolId_code: { schoolId: s, code: p.dept.code } }, create: { schoolId: s, code: p.dept.code, name: p.dept.name, hodMembershipId: hod.id, condoneFloorPercent: 65 }, update: { hodMembershipId: hod.id }, select: { id: true } });
    const programme = await db.programme.upsert({ where: { schoolId_code: { schoolId: s, code: p.code } }, create: { schoolId: s, departmentId: dept.id, code: p.code, name: p.name, level: "UG", durationYears: 4, intake: p.intake, regulator: "AICTE", stream: "ENGINEERING", attendanceThreshold: 75, exitPoints: "[]" }, update: { stream: "ENGINEERING" }, select: { id: true } });
    for (const [code, text] of p.pos) await db.programmeOutcome.upsert({ where: { programmeId_code: { programmeId: programme.id, code } }, create: { schoolId: s, programmeId: programme.id, code, text }, update: {} });
    const scheme = await db.scheme.upsert({ where: { programmeId_name: { programmeId: programme.id, name: SCHEME } }, create: { schoolId: s, programmeId: programme.id, name: SCHEME, effectiveYear: 2024, gradingTable: JSON.stringify(GRADES), passingRules: JSON.stringify(RULES) }, update: {}, select: { id: true } });
    programmes[p.code] = { id: programme.id, schemeId: scheme.id, deptId: dept.id };
    for (const c of p.courses) {
      const outcomes = c.cos.map((text, i) => ({ code: `CO${i + 1}`, text }));
      const row = await db.course.upsert({ where: { schemeId_code: { schemeId: scheme.id, code: c.code } }, create: { schoolId: s, schemeId: scheme.id, code: c.code, name: c.name, semester: c.semester, creditsL: c.l, creditsT: c.t, creditsP: c.p, kind: "CORE", outcomes: JSON.stringify(outcomes) }, update: {}, select: { id: true } });
      await db.courseOutcomeMap.createMany({ data: [...outcomes.map((o, i) => ({ schoolId: s, courseId: row.id, coCode: o.code, poCode: `PO${Math.min(i + 1, 3)}`, level: 3 })), { schoolId: s, courseId: row.id, coCode: "CO1", poCode: "PO2", level: 2 }], skipDuplicates: true });
      courses[c.code] = { id: row.id, credits: (c.l + c.t + c.p) * 10, name: c.name, programme: p.code, semester: c.semester, p: c.p };
    }
  }
  for (const [key, prog] of [["hodComp", "BECOMP"], ["f1", "BECOMP"], ["f2", "BECOMP"], ["hodMech", "BEMECH"], ["f3", "BEMECH"], ["f4", "BEMECH"]] as const) {
    await db.departmentFaculty.upsert({ where: { membershipId: staff[key].id }, create: { schoolId: s, membershipId: staff[key].id, departmentId: programmes[prog]!.deptId }, update: {} });
  }

  const current = await db.academicTerm.upsert({ where: { schoolId_name: { schoolId: s, name: CURRENT_TERM.name } }, create: { schoolId: s, ...CURRENT_TERM }, update: {}, select: { id: true } });
  const past = await db.academicTerm.upsert({ where: { schoolId_name: { schoolId: s, name: PAST_TERM.name } }, create: { schoolId: s, ...PAST_TERM }, update: {}, select: { id: true } });

  // Six fifty-minute hours from 9:00.
  const bells: { id: string; startMinute: number; endMinute: number }[] = [];
  for (let k = 0; k < 6; k += 1) {
    const name = `Hour ${k + 1}`;
    const start = 540 + k * 60;
    const bell = (await db.timetablePeriod.findFirst({ where: { schoolId: s, name }, select: { id: true, startMinute: true, endMinute: true } })) ?? (await db.timetablePeriod.create({ data: { schoolId: s, name, startMinute: start, endMinute: start + 50, kind: "LESSON", position: k + 1 }, select: { id: true, startMinute: true, endMinute: true } }));
    bells.push(bell);
  }
  const rooms: Record<string, string> = {};
  for (const [name, capacity, kind] of [["Room 101", 72, "CLASSROOM"], ["Room 102", 72, "CLASSROOM"], ["Room 103", 72, "CLASSROOM"], ["Room 201", 72, "CLASSROOM"], ["Room 202", 72, "CLASSROOM"], [LABS.BECOMP, 24, "LAB"], [LABS.BEMECH, 24, "LAB"]] as const) {
    rooms[name] = (await db.room.upsert({ where: { schoolId_name: { schoolId: s, name } }, create: { schoolId: s, name, capacity, kind }, update: {}, select: { id: true } })).id;
  }

  // Divisions, seats (roll number and PRN), and lab batches A and B in every second-year division (A in the first year's).
  const divisions: Record<string, { id: string; classId: string }> = {};
  for (const d of DIVISIONS) {
    const klass = (await db.class.findFirst({ where: { schoolId: s, name: d.name }, select: { id: true } })) ?? (await db.class.create({ data: { schoolId: s, name: d.name, gradeLevel: String(d.year), subject: d.programme, joinCode: classCode() }, select: { id: true } }));
    const division = await db.division.upsert({ where: { classId: klass.id }, create: { schoolId: s, classId: klass.id, programmeId: programmes[d.programme]!.id, yearOfStudy: d.year, academicYear: "2026–27" }, update: {}, select: { id: true } });
    divisions[d.key] = { id: division.id, classId: klass.id };
  }
  const rollOf = (st: StudentSpec) => students.filter((x) => x.div === st.div).findIndex((x) => x.n === st.n) + 1;
  for (const st of students) {
    const entryYear = st.year === 2 ? 2025 : 2026;
    const seat = { programmeId: programmes[st.programme]!.id, schemeId: programmes[st.programme]!.schemeId, entryYear, yearOfStudy: st.year, semester: st.year === 2 ? 3 : 1, divisionId: divisions[st.div]!.id, prn: `SIT${entryYear}${pad(st.n, 3)}`, status: "ACTIVE" };
    await db.studentProgramme.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...seat }, update: {} });
    await db.enrollment.upsert({ where: { classId_studentMembershipId: { classId: divisions[st.div]!.classId, studentMembershipId: st.id } }, create: { schoolId: s, classId: divisions[st.div]!.classId, studentMembershipId: st.id, rollNumber: rollOf(st) }, update: {} });
  }
  const batches: Record<string, Record<"A" | "B", string | undefined>> = {};
  let batchMembers = 0;
  for (const d of DIVISIONS) {
    const roster = students.filter((x) => x.div === d.key).sort((a, b) => rollOf(a) - rollOf(b));
    // By roll number, as the office splits a division; the second year's few demo students go half to A and half to B.
    const names: ("A" | "B")[] = d.year === 2 ? ["A", "B"] : ["A"];
    batches[d.key] = { A: undefined, B: undefined };
    for (const name of names) batches[d.key]![name] = (await db.labBatch.upsert({ where: { divisionId_name: { divisionId: divisions[d.key]!.id, name } }, create: { schoolId: s, divisionId: divisions[d.key]!.id, name, capacity: 20 }, update: {}, select: { id: true } })).id;
    const half = Math.ceil(roster.length / names.length);
    for (const [i, st] of roster.entries()) {
      const name = names[Math.min(names.length - 1, Math.floor(i / half))]!;
      await db.labBatchMember.upsert({ where: { divisionId_studentMembershipId: { divisionId: divisions[d.key]!.id, studentMembershipId: st.id } }, create: { schoolId: s, batchId: batches[d.key]![name]!, divisionId: divisions[d.key]!.id, studentMembershipId: st.id }, update: {} });
      batchMembers += 1;
    }
  }
  const batchOf = async (studentId: string) => (await db.labBatchMember.findFirst({ where: { studentMembershipId: studentId, schoolId: s }, select: { batchId: true } }))?.batchId ?? null;

  // This term's offerings, their lecture hours and one LAB hour per batch, every student of the division registered.
  type Slot = { id: string; weekday: number; bell: number; batchId: string | null };
  const offerings: { key: string; code: string; div: string; id: string; teacher: Member; teacherKey: StaffKey; roster: (StudentSpec & Member)[]; slots: Slot[] }[] = [];
  for (const [code, divKey, teacherKey, hours, labs] of OFFERINGS) {
    const c = courses[code]!;
    const spec = PROGRAMMES.find((p) => p.code === c.programme)!.courses.find((x) => x.code === code)!;
    const teacher = staff[teacherKey];
    const room = DIVISIONS.find((d) => d.key === divKey)!.room;
    const data = { facultyMembershipId: teacher.id, lectureHours: spec.l, tutorialHours: spec.t, practicalHours: spec.p * 2, roomId: rooms[room]!, capacity: null };
    const offering = await db.courseOffering.upsert({ where: { termId_courseId_divisionId: { termId: current.id, courseId: c.id, divisionId: divisions[divKey]!.id } }, create: { schoolId: s, termId: current.id, courseId: c.id, divisionId: divisions[divKey]!.id, ...data }, update: {}, select: { id: true } });
    const slots: Slot[] = [];
    const wanted: [number, number, string, string | null, string | null][] = [
      ...hours.map(([w, b]) => [w, b, "LECTURE", null, null] as [number, number, string, string | null, string | null]),
      ...(["A", "B"] as const).filter((n) => labs[n]).map((n) => [labs[n]![0], labs[n]![1], "LAB", batches[divKey]![n] ?? null, rooms[LABS[c.programme]]!] as [number, number, string, string | null, string | null]),
    ];
    for (const [weekday, bell, kind, labBatchId, roomId] of wanted) {
      const slot = await db.offeringSlot.upsert({ where: { offeringId_weekday_periodId: { offeringId: offering.id, weekday, periodId: bells[bell - 1]!.id } }, create: { schoolId: s, offeringId: offering.id, weekday, periodId: bells[bell - 1]!.id, kind, labBatchId, roomId }, update: {}, select: { id: true } });
      slots.push({ id: slot.id, weekday, bell, batchId: labBatchId });
    }
    const roster = students.filter((st) => st.div === divKey);
    for (const st of roster) {
      await db.courseRegistration.upsert({ where: { offeringId_studentMembershipId: { offeringId: offering.id, studentMembershipId: st.id } }, create: { schoolId: s, studentMembershipId: st.id, offeringId: offering.id, termId: current.id, kind: "CORE", byUserId: staff.registrar.userId, registeredAt: new Date("2026-07-05T05:00:00Z") }, update: {} });
    }
    offerings.push({ key: `${code}|${divKey}`, code, div: divKey, id: offering.id, teacher, teacherKey, roster, slots });
  }

  // Four weeks of registers. A LAB hour is its batch's: its lecture names the batch and registers only the batch's students.
  // Most students miss one hour in eleven; Pratik misses every third ME302 lecture (under 75 %).
  const days: string[] = [];
  for (let t = day(REGISTER_FROM).getTime(); t <= day(REGISTER_TO).getTime(); t += 86_400_000) if (new Date(t).getUTCDay() !== 0) days.push(new Date(t).toISOString().slice(0, 10));
  const labDays: Record<string, string[]> = {};
  for (const o of offerings) {
    let index = 0;
    for (const dateKey of days) {
      for (const slot of o.slots.filter((x) => x.weekday === day(dateKey).getUTCDay())) {
        index += 1;
        const bell = bells[slot.bell - 1]!;
        const lab = slot.batchId !== null;
        const lecture = await db.lecture.upsert({
          where: { offeringId_dateKey_slotId: { offeringId: o.id, dateKey, slotId: slot.id } },
          create: { schoolId: s, offeringId: o.id, slotId: slot.id, dateKey, startMinute: bell.startMinute, endMinute: bell.endMinute, kind: lab ? "LAB" : "LECTURE", labBatchId: slot.batchId },
          update: {},
          select: { id: true },
        });
        if (lab) labDays[`${o.key}|${slot.batchId}`] = [...(labDays[`${o.key}|${slot.batchId}`] ?? []), dateKey];
        for (const [k, st] of o.roster.entries()) {
          if (lab && (await batchOf(st.id)) !== slot.batchId) continue;
          const absent = o.code === "ME302" && st.n === 10 ? index % 3 === 0 : (st.n * 7 + index * 3) % 11 === 0;
          await db.lectureAttendance.upsert({
            where: { lectureId_studentMembershipId: { lectureId: lecture.id, studentMembershipId: st.id } },
            create: { schoolId: s, lectureId: lecture.id, studentMembershipId: st.id, status: absent ? "ABSENT" : "PRESENT", markedByMembershipId: o.teacher.id, markedAt: new Date(`${dateKey}T${pad(3 + slot.bell)}:${k % 2 ? "35" : "40"}:00Z`) },
            update: {},
          });
        }
      }
    }
  }

  // The practical record: experiment 1 for every lab student, performed on their batch's first LAB day, signed by the
  // department's lab in-charge; CE301 in SE Computer A also has experiment 2, waiting for a signature (the lab desk's queue).
  const EXPERIMENTS: Record<string, [string, string]> = {
    CE301: ["Stack using an array: push, pop and overflow", "Singly linked list: insert, delete and reverse"],
    CE102: ["Python: conditionals and loops", "Python: functions and lists"],
    ME302: ["Tension test on mild steel (universal testing machine)", "Torsion test on a mild steel rod"],
  };
  const inCharge = { BECOMP: staff.f1, BEMECH: staff.f3 } as const;
  for (const o of offerings.filter((x) => x.slots.some((sl) => sl.batchId))) {
    const programme = courses[o.code]!.programme;
    const experiments = o.key === "CE301|SECA" ? [1, 2] : [1];
    for (const exp of experiments) {
      for (const [k, st] of o.roster.entries()) {
        const batchId = await batchOf(st.id);
        const labDates = labDays[`${o.key}|${batchId}`] ?? [];
        const performedOn = labDates[exp - 1] ?? REGISTER_FROM;
        const signed = exp === 1 ? { signedByMembershipId: inCharge[programme].id, signedAt: new Date(`${performedOn}T11:30:00Z`) } : {};
        await db.practicalRecord.upsert({
          where: { offeringId_studentMembershipId_experimentNo: { offeringId: o.id, studentMembershipId: st.id, experimentNo: exp } },
          create: { schoolId: s, offeringId: o.id, studentMembershipId: st.id, experimentNo: exp, title: EXPERIMENTS[o.code]![exp - 1]!, performedOn, marks: 6 + ((st.n * 3 + k + exp) % 5), createdByUserId: o.teacher.userId, ...signed },
          update: {},
        });
      }
    }
  }

  // Internal marks: CE301 in SE Computer A entered by its teacher, countersigned by the head, released and locked;
  // ME302 in SE Mechanical A's unit test entered, waiting for a countersign.
  const internal: [string, StaffKey, boolean][] = [["CE301|SECA", "hodComp", true], ["ME302|SEMA", "hodMech", false]];
  for (const [key, signerKey, lock] of internal) {
    const o = offerings.find((x) => x.key === key)!;
    const signer = staff[signerKey];
    const parts = lock
      ? [{ name: "Unit test 1", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: '["CO1","CO2"]', position: 0, mark: (k: number) => 120 + ((k * 23) % 80) }, { name: "Lab journal", kind: "ASSIGNMENT", maxMarks: 10, weight: 20, coCodes: '["CO3"]', position: 1, mark: (k: number) => 65 + ((k * 13) % 35) }]
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

  return { programmes, courses, currentTermId: current.id, pastTermId: past.id, offerings, rooms, batchMembers };
}

type Academics = Awaited<ReturnType<typeof buildAcademics>>;

/* -------------------------------------------------------------------------- */
/* the office: years, fees under the FRA, a scholarship, admission records      */
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
  for (const [code, name, kind, sortOrder] of [["TUI", "Tuition", "TUITION", 1], ["DEV", "Development", "DEVELOPMENT", 2], ["EXM", "Examination", "EXAM", 3], ["LAB", "Laboratory", "LABORATORY", 4], ["CAU", "Caution deposit", "CAUTION_DEPOSIT", 5]] as const) {
    head[code] = (await db.feeHead.upsert({ where: { schoolId_code: { schoolId: s, code } }, create: { schoolId: s, code, name, kind, sortOrder }, update: {}, select: { id: true } })).id;
  }
  // The year's fee per programme, year and category, in the shape the Fee Regulating Authority approves (made-up
  // figures; an OBC student's tuition is half, the state reimbursing the rest); the caution deposit in the first year only.
  const STRUCTURES: { programme: Prog; year: 1 | 2; category: "OPEN" | "OBC"; lines: [string, number][] }[] = [
    { programme: "BECOMP", year: 2, category: "OPEN", lines: [["TUI", 11_200_000], ["DEV", 1_800_000], ["EXM", 300_000], ["LAB", 400_000]] },
    { programme: "BECOMP", year: 2, category: "OBC", lines: [["TUI", 5_600_000], ["DEV", 1_800_000], ["EXM", 300_000], ["LAB", 400_000]] },
    { programme: "BEMECH", year: 2, category: "OPEN", lines: [["TUI", 10_400_000], ["DEV", 1_800_000], ["EXM", 300_000], ["LAB", 400_000]] },
    { programme: "BEMECH", year: 2, category: "OBC", lines: [["TUI", 5_200_000], ["DEV", 1_800_000], ["EXM", 300_000], ["LAB", 400_000]] },
    { programme: "BECOMP", year: 1, category: "OPEN", lines: [["TUI", 11_200_000], ["DEV", 1_800_000], ["EXM", 300_000], ["LAB", 400_000], ["CAU", 500_000]] },
  ];
  const structureOf: Record<string, string> = {};
  for (const st of STRUCTURES) {
    const name = `${PROGRAMMES.find((p) => p.code === st.programme)!.name} ${st.year === 1 ? "FE" : "SE"} · ${st.category}`;
    const found = await db.feeStructure.findFirst({ where: { schoolId: s, academicYearId: year.id, name }, select: { id: true } });
    const made =
      found ??
      (await db.feeStructure.create({
        data: {
          schoolId: s, academicYearId: year.id, name, publishedAt: new Date("2026-06-10T06:00:00Z"), programmeId: academics.programmes[st.programme]!.id, yearOfStudy: st.year, category: st.category,
          approvalRef: `FRA/2026-27/SIT/${st.programme}/${st.year}/${st.category}`, lateFeeSlabsJson: JSON.stringify([{ afterDays: 15, paise: 100_000 }, { afterDays: 30, paise: 200_000 }]),
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

  for (const st of students) {
    const programmeId = academics.programmes[st.programme]!.id;
    const entry = st.year === 2 ? 2025 : 2026;
    await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: st.id, programmeId } }, create: { schoolId: s, studentMembershipId: st.id, programmeId, yearOfEntry: entry, category: st.category, quota: "CAP" }, update: {} });
    const record = { prn: `SIT${entry}${pad(st.n, 3)}`, admissionCategory: st.category, admissionQuota: "CAP", yearOfEntry: entry, admissionNumber: `${entry}/E${pad(st.n, 4)}`, admissionDate: day(`${entry}-08-05`), gender: st.gender, annualIncome: st.category === "OBC" ? 180_000 : 900_000, city: "Pune" };
    await db.pupilRecord.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...record }, update: {} });
    const structureId = structureOf[`${st.programme}-${st.year}-${st.category}`]!;
    await db.studentFeePlan.upsert({ where: { studentMembershipId_academicYearId: { studentMembershipId: st.id, academicYearId: year.id } }, create: { schoolId: s, studentMembershipId: st.id, structureId, academicYearId: year.id }, update: {} });
    const instalments = await db.feeInstalment.findMany({ where: { structureId }, orderBy: { sortOrder: "asc" }, include: { lines: { include: { head: { select: { code: true, name: true } } } } } });
    for (const inst of instalments) {
      const lines = inst.lines.map((l) => ({ headId: l.headId, code: l.head.code, name: l.head.name, grossPaise: l.amountPaise, concessionPaise: 0 }));
      const gross = lines.reduce((a, l) => a + l.grossPaise, 0);
      await db.feeDemand.upsert({ where: { studentMembershipId_instalmentId: { studentMembershipId: st.id, instalmentId: inst.id } }, create: { schoolId: s, studentMembershipId: st.id, academicYearId: year.id, instalmentId: inst.id, label: inst.label, dueDate: inst.dueDate, grossPaise: gross, netPaise: gross, linesJson: JSON.stringify(lines) }, update: {} });
    }
    if (!st.paidOdd) continue;
    const clientId = `demo-sit-odd-${pad(st.n)}`;
    if (await db.feePayment.findUnique({ where: { schoolId_clientId: { schoolId: s, clientId } }, select: { id: true } })) continue;
    const odd = await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: st.id, academicYearId: year.id }, orderBy: { dueDate: "asc" } });
    const reference = `UTR2026072${pad(st.n, 4)}`;
    const y = await db.academicYear.update({ where: { id: year.id }, data: { feeReceiptNext: { increment: 1 } }, select: { feeReceiptNext: true } });
    const number = y.feeReceiptNext - 1;
    const paidAt = new Date(`2026-07-${pad(2 + st.n)}T06:00:00Z`);
    const payment = await db.feePayment.create({ data: { schoolId: s, studentMembershipId: st.id, amountPaise: odd.netPaise, method: "BANK", status: "PAID", clientId, reference, collectedByUserId: staff.accounts.userId, paidAt, intentJson: JSON.stringify([odd.id]) }, select: { id: true } });
    await db.feeAllocation.create({ data: { schoolId: s, paymentId: payment.id, demandId: odd.id, amountPaise: odd.netPaise } });
    await db.feeReceipt.create({ data: { schoolId: s, paymentId: payment.id, academicYearId: year.id, number, serial: `RCPT/${year.name}/${pad(number, 6)}`, issuedAt: paidAt, snapshotJson: JSON.stringify({ school: college.name, pupil: st.name, lines: [{ label: odd.label, amountPaise: odd.netPaise }], method: "BANK", reference }) } });
    await db.feeDemand.update({ where: { id: odd.id }, data: { paidPaise: odd.netPaise, status: "PAID" } });
  }

  // Rohan's OBC post-matric claim, sanctioned on MahaDBT: the state's half of the tuition, the receivable on his ledger.
  const rohan = students.find((x) => x.n === 2)!;
  await db.scholarshipClaim.upsert({
    where: { studentMembershipId_scheme_academicYear: { studentMembershipId: rohan.id, scheme: "OBC_POST_MATRIC", academicYear: "2026-27" } },
    create: { schoolId: s, studentMembershipId: rohan.id, scheme: "OBC_POST_MATRIC", academicYear: "2026-27", portalApplicationId: "MDBT2026PUN0071344", appliedAt: day("2026-08-04"), expectedPaise: 5_600_000, sanctionedPaise: 5_600_000, sanctionedAt: day("2026-09-21"), status: "SANCTIONED", createdByUserId: staff.accounts.userId },
    update: {},
  });
  await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: people.alumnus.studentId, programmeId: academics.programmes.BECOMP!.id } }, create: { schoolId: s, studentMembershipId: people.alumnus.studentId, programmeId: academics.programmes.BECOMP!.id, yearOfEntry: 2021, category: "OPEN", quota: "CAP", status: "COMPLETED" }, update: {} });
  return { yearId: year.id, examHeadId: head.EXM! };
}

/* -------------------------------------------------------------------------- */
/* the exam cell: last term published (double entry), this term in conduct     */
/* -------------------------------------------------------------------------- */

/** A small, valid one-page PDF: the sealed paper's contents. */
function paperPdf(text: string): Buffer {
  const stream = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

async function buildExams(college: College, people: People, academics: Academics, examHeadId: string) {
  const s = college.id;
  const ctrl = people.staff.exams;
  const second = people.staff.registrar;
  const sitters = people.students.filter((st) => st.year === 2);

  /* ---- last term: Summer 2026, the cell's own marks by double entry, published, grade cards */
  const name = "Summer 2026 (even term 2025–26)";
  const session = await db.examSession.upsert({
    where: { schoolId_name: { schoolId: s, name } },
    create: { schoolId: s, name, kind: "REGULAR", termId: academics.pastTermId, formOpensAt: new Date("2026-03-01T04:00:00Z"), formClosesAt: new Date("2026-03-20T18:00:00Z"), feePerCoursePaise: 50_000, feePerBacklogPaise: 60_000, photocopyFeePaise: 20_000, revalFeePaise: 50_000, feeHeadId: examHeadId, status: "PUBLISHED", createdByUserId: ctrl.userId },
    update: {},
    select: { id: true },
  });
  const pastCourses = (programme: Prog) => Object.entries(academics.courses).filter(([, c]) => c.programme === programme && c.semester === 2).map(([code, c]) => ({ code, ...c }));
  for (const [i, c] of [...pastCourses("BECOMP"), ...pastCourses("BEMECH")].entries()) {
    await db.examSchedule.upsert({ where: { sessionId_courseId: { sessionId: session.id, courseId: c.id } }, create: { schoolId: s, sessionId: session.id, courseId: c.id, courseCode: c.code, courseName: c.name, at: new Date(Date.UTC(2026, 3, 20 + i, 4, 30)), durationMin: 180 }, update: {} });
  }
  for (const [k, st] of sitters.entries()) {
    const mine = pastCourses(st.programme);
    const form = await db.examForm.upsert({
      where: { sessionId_studentMembershipId: { sessionId: session.id, studentMembershipId: st.id } },
      create: { schoolId: s, sessionId: session.id, studentMembershipId: st.id, coursesJson: JSON.stringify(mine.map((c) => ({ courseId: c.id, kind: "REGULAR" }))), eligibilityJson: JSON.stringify({ eligible: true, courses: [], noDues: [] }), eligible: true, noDues: true, feePaise: mine.length * 50_000, status: "APPROVED", submittedAt: new Date("2026-03-06T06:00:00Z"), decidedAt: new Date("2026-03-07T06:00:00Z"), decidedByUserId: ctrl.userId, lockedAt: new Date("2026-04-01T06:00:00Z") },
      update: {},
      select: { id: true },
    });
    await db.hallTicket.upsert({ where: { formId: form.id }, create: { schoolId: s, sessionId: session.id, formId: form.id, studentMembershipId: st.id, number: `HT${pad(k + 1, 4)}`, code: `SITHT26S${pad(k + 1, 4)}`, issuedByUserId: ctrl.userId, issuedAt: new Date("2026-04-10T06:00:00Z") }, update: {} });
  }
  // The cell's marks: entry one by the controller, entry two by the registrar, matched; internal of 40, external of 60.
  // Omkar falls short in ME201's external (an ATKT and a backlog).
  const scheme = await db.scheme.findUniqueOrThrow({ where: { id: academics.programmes.BECOMP!.schemeId }, select: { gradingTable: true, passingRules: true } });
  const rules = rulesOf(scheme.passingRules);
  const table = gradingTableOf(scheme.gradingTable);
  const marksOf = (k: number, j: number, st: StudentSpec, code: string): [number, number] => [25 + ((k * 5 + j * 3) % 14), st.n === 9 && code === "ME201" ? 17 : 31 + ((k * 7 + j * 5) % 26)];
  const computed = [];
  for (const [k, st] of sitters.entries()) {
    const rows = [];
    for (const [j, c] of pastCourses(st.programme).entries()) {
      const [internal, external] = marksOf(k, j, st, c.code);
      await db.examMark.upsert({
        where: { sessionId_courseId_studentMembershipId_version: { sessionId: session.id, courseId: c.id, studentMembershipId: st.id, version: 1 } },
        create: { schoolId: s, sessionId: session.id, courseId: c.id, studentMembershipId: st.id, internalMilli: internal * 1000, externalMilli: external * 1000, matched: true, source: "DOUBLE_ENTRY", version: 1, entry1Milli: external * 1000, entry1ByUserId: ctrl.userId, entry1At: new Date("2026-05-12T06:00:00Z"), entry2Milli: external * 1000, entry2ByUserId: second.userId, entry2At: new Date("2026-05-13T06:00:00Z"), enteredByUserId: ctrl.userId },
        update: {},
      });
      const out = courseOutcome({ internalMilli: internal * 1000, externalMilli: external * 1000, absent: false, graceMilli: 0 }, rules, table);
      rows.push({ courseId: c.id, code: c.code, name: c.name, kind: "REGULAR", creditsTenths: c.credits, internalMilli: internal * 1000, externalMilli: external * 1000, graceMilli: 0, totalMilli: out.totalMilli, maxMilli: out.maxMilli, grade: out.passed ? out.grade : "F", pointsTenths: out.passed ? out.pointsTenths : 0, status: out.passed ? "PASS" : "FAIL" });
    }
    const status = termStatusOf(rows.filter((r) => r.status !== "PASS").length, rules.atktLimit);
    for (const r of rows) if (r.status === "FAIL" && status === "ATKT") r.status = "ATKT";
    const sgpa = sgpaHundredths(rows);
    computed.push({ st, rows, status, sgpa, attempted: rows.reduce((a, r) => a + r.creditsTenths, 0), earned: rows.filter((r) => r.status === "PASS").reduce((a, r) => a + r.creditsTenths, 0), cls: status === "PASS" ? classFor(sgpa, rules.classBands) : null });
  }
  const summary = { students: computed.length, passed: computed.filter((c) => c.status === "PASS").length, atkt: computed.filter((c) => c.status === "ATKT").length, failed: computed.filter((c) => c.status === "FAIL").length };
  const run = await db.resultRun.upsert({ where: { sessionId_number: { sessionId: session.id, number: 1 } }, create: { schoolId: s, sessionId: session.id, number: 1, status: "PUBLISHED", computedAt: PUBLISHED_AT, computedByUserId: ctrl.userId, publishedAt: PUBLISHED_AT, publishedByUserId: ctrl.userId, summaryJson: JSON.stringify(summary) }, update: {}, select: { id: true } });
  let gradeCards = 0;
  for (const [i, c] of computed.entries()) {
    for (const r of c.rows) {
      const row = { courseId: r.courseId, kind: r.kind, creditsTenths: r.creditsTenths, internalMilli: r.internalMilli, externalMilli: r.externalMilli, graceMilli: r.graceMilli, totalMilli: r.totalMilli, maxMilli: r.maxMilli, grade: r.grade, pointsTenths: r.pointsTenths, status: r.status };
      await db.courseResult.upsert({ where: { runId_studentMembershipId_courseId: { runId: run.id, studentMembershipId: c.st.id, courseId: r.courseId } }, create: { schoolId: s, runId: run.id, studentMembershipId: c.st.id, ...row }, update: {} });
    }
    await db.termResult.upsert({ where: { runId_studentMembershipId: { runId: run.id, studentMembershipId: c.st.id } }, create: { schoolId: s, runId: run.id, studentMembershipId: c.st.id, termId: academics.pastTermId, sgpaHundredths: c.sgpa, creditsAttemptedTenths: c.attempted, creditsEarnedTenths: c.earned, status: c.status, cls: c.cls }, update: {} });
    await db.creditPush.upsert({ where: { studentMembershipId_termId: { studentMembershipId: c.st.id, termId: academics.pastTermId } }, create: { schoolId: s, studentMembershipId: c.st.id, termId: academics.pastTermId, runId: run.id, creditsTenths: c.earned }, update: {} });
    for (const r of c.rows.filter((x) => x.status !== "PASS")) {
      await db.backlog.upsert({ where: { studentMembershipId_courseId: { studentMembershipId: c.st.id, courseId: r.courseId } }, create: { schoolId: s, studentMembershipId: c.st.id, courseId: r.courseId, firstFailedSessionId: session.id, firstFailedAt: PUBLISHED_AT, lastSessionId: session.id }, update: {} });
    }
    // The grade card, as the cell issues one (exam-cell-after.ts issueDocument's data): once per student and run.
    if (!(await db.examDocument.findFirst({ where: { schoolId: s, studentMembershipId: c.st.id, kind: "GRADE_CARD", runId: run.id }, select: { id: true } }))) {
      const data = {
        kind: "GRADE_CARD",
        college: { name: college.name, university: "Savitribai Phule Pune University", autonomous: true },
        student: { name: c.st.name, code: `SIT-2025-${pad(c.st.n)}`, prn: `SIT2025${pad(c.st.n, 3)}`, programme: PROGRAMMES.find((p) => p.code === c.st.programme)!.name },
        terms: [{ sessionName: name, publishedOn: PUBLISHED_AT.toISOString().slice(0, 10), sgpa: sgpaNumber(c.sgpa), credits: tenths(c.earned), status: c.status, cls: c.cls, courses: c.rows.map((r) => ({ code: r.code, name: r.name, credits: tenths(r.creditsTenths), grade: r.grade, points: r.pointsTenths / 10, status: r.status })).sort((a, b) => a.code.localeCompare(b.code)) }],
        cgpa: sgpaNumber(c.sgpa),
        creditsEarned: tenths(c.earned),
        cls: c.status === "PASS" ? classFor(c.sgpa, rules.classBands) : null,
        yearOfPassing: null,
      };
      const last = await db.examDocument.findFirst({ where: { schoolId: s, kind: "GRADE_CARD", yearLabel: "2025–26" }, orderBy: { number: "desc" }, select: { number: true } });
      const number = (last?.number ?? 0) + 1;
      await db.examDocument.create({ data: { schoolId: s, studentMembershipId: c.st.id, kind: "GRADE_CARD", sessionId: session.id, runId: run.id, yearLabel: "2025–26", number, serial: `GC/2025–26/${pad(number, 4)}`, code: checkCode(randomBytes(10)), studentName: c.st.name, dataJson: JSON.stringify(data), issuedByUserId: ctrl.userId, issuedAt: new Date(PUBLISHED_AT.getTime() + (i + 1) * 60_000 + 2 * 86_400_000) } });
    }
    gradeCards += 1;
  }

  /* ---- this term: Winter 2026, in CONDUCT, the autonomous cell's own papers */
  const wname = "Winter 2026 (odd term 2026–27)";
  const winter = await db.examSession.upsert({
    where: { schoolId_name: { schoolId: s, name: wname } },
    create: { schoolId: s, name: wname, kind: "REGULAR", termId: academics.currentTermId, formOpensAt: new Date("2026-09-01T04:00:00Z"), formClosesAt: new Date("2026-09-20T18:00:00Z"), feePerCoursePaise: 50_000, feePerBacklogPaise: 60_000, photocopyFeePaise: 20_000, revalFeePaise: 50_000, feeHeadId: examHeadId, status: "CONDUCT", createdByUserId: ctrl.userId },
    update: { status: "CONDUCT" },
    select: { id: true },
  });
  const thisTerm = (programme: Prog, semester: number) => Object.entries(academics.courses).filter(([, c]) => c.programme === programme && c.semester === semester).map(([code, c]) => ({ code, ...c }));
  const papers = [...thisTerm("BECOMP", 3), ...thisTerm("BEMECH", 3), ...thisTerm("BECOMP", 1)];
  const schedules: Record<string, string> = {};
  for (const [i, c] of papers.entries()) {
    schedules[c.code] = (await db.examSchedule.upsert({ where: { sessionId_courseId: { sessionId: winter.id, courseId: c.id } }, create: { schoolId: s, sessionId: winter.id, courseId: c.id, courseCode: c.code, courseName: c.name, at: new Date(Date.UTC(2026, 10, 16 + i, 4, 30)), durationMin: 180 }, update: {}, select: { id: true } })).id;
    await db.examRoom.upsert({ where: { scheduleId_name: { scheduleId: schedules[c.code]!, name: "Main Hall" } }, create: { schoolId: s, sessionId: winter.id, scheduleId: schedules[c.code]!, name: "Main Hall", capacity: 60 }, update: {} });
  }
  for (const [k, st] of people.students.entries()) {
    const mine = thisTerm(st.programme, st.year === 2 ? 3 : 1);
    const form = await db.examForm.upsert({
      where: { sessionId_studentMembershipId: { sessionId: winter.id, studentMembershipId: st.id } },
      create: { schoolId: s, sessionId: winter.id, studentMembershipId: st.id, coursesJson: JSON.stringify(mine.map((c) => ({ courseId: c.id, kind: "REGULAR" }))), eligibilityJson: JSON.stringify({ eligible: true, courses: [], noDues: [] }), eligible: true, noDues: true, feePaise: mine.length * 50_000, status: "APPROVED", submittedAt: new Date("2026-09-08T06:00:00Z"), decidedAt: new Date("2026-09-10T06:00:00Z"), decidedByUserId: ctrl.userId, lockedAt: new Date("2026-09-25T06:00:00Z") },
      update: {},
      select: { id: true },
    });
    await db.hallTicket.upsert({ where: { formId: form.id }, create: { schoolId: s, sessionId: winter.id, formId: form.id, studentMembershipId: st.id, number: `HT${pad(k + 1, 4)}`, code: `SITHT26W${pad(k + 1, 4)}`, issuedByUserId: ctrl.userId, issuedAt: new Date("2026-10-01T06:00:00Z") }, update: {} });
  }
  // CE301's paper: set by Prof Rasika Dixit, SEALED at once (secret-box bound to the row, as submitPaper seals it);
  // ME302's assigned to Prof Sameer Kulkarni, not yet set.
  const ce301 = await db.questionPaper.upsert({ where: { scheduleId_setterMembershipId: { scheduleId: schedules.CE301!, setterMembershipId: people.staff.f2.id } }, create: { schoolId: s, sessionId: winter.id, scheduleId: schedules.CE301!, setterMembershipId: people.staff.f2.id, assignedByUserId: ctrl.userId }, update: {}, select: { id: true, sealedBody: true } });
  let sealed = Boolean(ce301.sealedBody);
  if (!sealed) {
    const pdf = paperPdf("CE301 Data Structures, Winter 2026: Q1 (CO1, 10 marks) Implement a stack with an array.");
    try {
      const { seal } = await import("../src/lib/secret-box");
      const sealedBody = seal(pdf.toString("base64"), `${s}|QuestionPaper|${ce301.id}`);
      await db.questionPaper.update({ where: { id: ce301.id }, data: { status: "SUBMITTED", sealedBody, fileName: "ce301-winter-2026.pdf", mime: "application/pdf", sizeBytes: pdf.length, sha256: createHash("sha256").update(pdf).digest("hex"), coMapJson: JSON.stringify([{ question: "Q1", co: "CO1", marks: 10 }, { question: "Q2", co: "CO2", marks: 15 }, { question: "Q3", co: "CO3", marks: 15 }]), submittedAt: new Date("2026-10-02T09:00:00Z") } });
      sealed = true;
    } catch (e) {
      console.warn(`  CE301's paper left ASSIGNED: sealing is not available here (${(e as Error).message})`);
    }
  }
  await db.questionPaper.upsert({ where: { scheduleId_setterMembershipId: { scheduleId: schedules.ME302!, setterMembershipId: people.staff.f3.id } }, create: { schoolId: s, sessionId: winter.id, scheduleId: schedules.ME302!, setterMembershipId: people.staff.f3.id, assignedByUserId: ctrl.userId }, update: {} });

  return { sessionId: session.id, conductSessionId: winter.id, sealed, gradeCards, sgpa: Object.fromEntries(computed.map((c) => [c.st.n, c.sgpa])) as Record<number, number | null> };
}

/* -------------------------------------------------------------------------- */
/* placement and the summer internship                                         */
/* -------------------------------------------------------------------------- */

async function buildPlacement(college: College, people: People, academics: Academics, sgpa: Record<number, number | null>) {
  const s = college.id;
  const { staff, students } = people;
  await db.schoolModule.updateMany({ where: { schoolId: s, module: "PLACEMENT" }, data: { settingsJson: JSON.stringify({ seasonBatchYear: seasonBatchFor(new Date().toISOString().slice(0, 10)), dreamRatio: 1.5, allowGenderRule: false }) } });
  const first14 = "27AAECD4821R1Z";
  const identifier = `${first14}${gstinCheckChar(first14)}`;
  const company = await db.company.upsert({
    where: { identifier },
    create: { name: RECRUITER.company, identifier, sectors: JSON.stringify(["IT_SOFTWARE", "MANUFACTURING"]), pointOfContact: `${RECRUITER.name}, ${RECRUITER.email}`, createdByUserId: people.recruiterUserId, verifiedAt: new Date("2026-08-24T06:00:00Z"), verifiedByUserId: staff.tpo.userId },
    update: {},
    select: { id: true },
  });
  await db.companyRecruiter.upsert({ where: { companyId_userId: { companyId: company.id, userId: people.recruiterUserId } }, create: { companyId: company.id, userId: people.recruiterUserId, acceptedAt: new Date() }, update: { removedAt: null, acceptedAt: new Date() } });
  await db.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId: s, companyId: company.id } }, create: { schoolId: s, companyId: company.id, firstVisitYear: 2024 }, update: {} });

  const rule = { cgpaMin: 6.5, noLiveBacklogs: true, programmeIds: [academics.programmes.BECOMP!.id, academics.programmes.BEMECH!.id], batchYear: null, genders: [] };
  const rounds = [{ n: 1, kind: "APTITUDE", note: "", at: "2026-10-22T05:00:00.000Z" }, { n: 2, kind: "TECHNICAL_INTERVIEW", note: "", at: null }];
  const role = "Graduate engineer trainee — embedded systems";
  const requirement =
    (await db.requirement.findFirst({ where: { companyId: company.id, role }, select: { id: true } })) ??
    (await db.requirement.create({ data: { companyId: company.id, byUserId: people.recruiterUserId, role, packageRupees: 650_000, locations: "Pune, Chakan", eligibilityAsked: JSON.stringify(rule), rounds: JSON.stringify(rounds.map((r) => ({ kind: r.kind, note: "" }))), datesProposed: "Fourth week of October", targetSchoolIds: JSON.stringify([s]) }, select: { id: true } }));
  const openTitle = "Graduate engineer trainee — embedded systems 2028";
  const open =
    (await db.drive.findFirst({ where: { schoolId: s, title: openTitle }, select: { id: true } })) ??
    (await db.drive.create({ data: { schoolId: s, companyId: company.id, requirementId: requirement.id, kind: "ON_CAMPUS", title: openTitle, jd: "Firmware for motor controllers in C; test rigs in Python. Six months' training on the shop floor at Chakan.", packageMinRupees: 600_000, packageMaxRupees: 700_000, rounds: JSON.stringify(rounds), schedule: JSON.stringify([{ label: "Pre-placement talk", at: "2026-10-14T05:30:00.000Z" }]), venues: "Seminar hall, Block B", eligibilityRule: JSON.stringify(rule), status: "OPEN", invitedAt: new Date("2026-09-29T06:00:00Z"), createdByUserId: staff.tpo.userId }, select: { id: true } }));
  for (const n of [1, 7]) {
    const st = students.find((x) => x.n === n)!;
    const record = { cgpa: sgpa[n] === null || sgpa[n] === undefined ? null : sgpa[n]! / 100, liveBacklogs: 0, attendancePct: 91, programmeId: academics.programmes[st.programme]!.id, programmeName: PROGRAMMES.find((p) => p.code === st.programme)!.name, batchYear: 2028, gender: st.gender, category: st.category };
    await db.driveApplication.upsert({ where: { driveId_studentMembershipId: { driveId: open.id, studentMembershipId: st.id } }, create: { schoolId: s, driveId: open.id, studentMembershipId: st.id, studentUserId: st.userId, schoolName: college.name, appliedAt: new Date("2026-10-02T09:00:00Z"), consentAt: new Date("2026-10-02T09:00:00Z"), recordJson: JSON.stringify(record) }, update: {} });
    await db.placementProfile.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, skills: JSON.stringify(n === 1 ? ["C", "Python", "Data structures"] : ["SolidWorks", "C", "Arduino"]), certifications: JSON.stringify(n === 1 ? ["NPTEL Programming in C"] : ["CSWA (SolidWorks associate)"]), projects: JSON.stringify([{ title: n === 1 ? "Line-following robot's controller" : "Gearbox test rig", note: "" }]), consentAt: new Date("2026-10-02T09:00:00Z") }, update: {} });
  }

  // Last season: the alumnus through the closed drive with an accepted offer, and the 2025 season from the table.
  const closedTitle = "Graduate engineer trainee 2025";
  const closed =
    (await db.drive.findFirst({ where: { schoolId: s, title: closedTitle }, select: { id: true } })) ??
    (await db.drive.create({ data: { schoolId: s, companyId: company.id, kind: "ON_CAMPUS", title: closedTitle, packageMinRupees: 580_000, packageMaxRupees: 580_000, rounds: JSON.stringify([{ n: 1, kind: "TECHNICAL_INTERVIEW", note: "", at: "2025-01-20T05:30:00.000Z" }]), eligibilityRule: JSON.stringify({ cgpaMin: 6.5, noLiveBacklogs: true, programmeIds: [], batchYear: 2025, genders: [] }), status: "CLOSED", invitedAt: new Date("2025-01-06T05:30:00Z"), closedAt: new Date("2025-02-28T05:30:00Z"), recruiterRating: 5, recruiterFeedback: "Strong in C and in the lab; ready for the shop floor.", createdByUserId: staff.tpo.userId, createdAt: new Date("2025-01-03T05:30:00Z") }, select: { id: true } }));
  const graduate = people.alumnus.studentId;
  await db.driveApplication.upsert({ where: { driveId_studentMembershipId: { driveId: closed.id, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, studentMembershipId: graduate, studentUserId: people.alumnus.userId, schoolName: college.name, appliedAt: new Date("2025-01-09T05:30:00Z"), consentAt: new Date("2025-01-09T05:30:00Z"), recordJson: JSON.stringify({ cgpa: 8.4, liveBacklogs: 0, attendancePct: 92, programmeId: academics.programmes.BECOMP!.id, programmeName: "BE Computer Engineering", batchYear: 2025, gender: "M", category: "OPEN" }) }, update: {} });
  for (const round of [0, 1]) await db.roundResult.upsert({ where: { driveId_round_studentMembershipId: { driveId: closed.id, round, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, round, studentMembershipId: graduate, outcome: "PASSED", byUserId: people.recruiterUserId }, update: {} });
  await db.offer.upsert({ where: { driveId_studentMembershipId: { driveId: closed.id, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, studentMembershipId: graduate, packageRupees: 580_000, acceptedAt: new Date("2025-02-10T05:30:00Z"), joinedAt: new Date("2025-07-01T04:00:00Z"), byUserId: people.recruiterUserId, createdAt: new Date("2025-02-05T05:30:00Z") }, update: {} });
  if (!(await db.placementSeason.findUnique({ where: { schoolId_batchYear: { schoolId: s, batchYear: 2025 } }, select: { id: true } }))) {
    const t = await placementTable(s, 2025);
    await db.placementSeason.create({ data: { schoolId: s, batchYear: 2025, finalYear: t.finalYear, placed: t.placed, higherStudies: t.higherStudies, entrepreneurs: t.entrepreneurs, offers: t.offers, medianSalaryRupees: t.medianSalaryRupees, computedByUserId: staff.tpo.userId } });
  }

  // Ishita's summer internship after semester 2, at the recruiter's company: guided by her lab teacher, credited.
  const ishita = students.find((x) => x.n === 3)!;
  if (!(await db.internship.findFirst({ where: { schoolId: s, studentMembershipId: ishita.id, kind: "SUMMER" }, select: { id: true } }))) {
    await db.internship.create({ data: { schoolId: s, studentMembershipId: ishita.id, companyId: company.id, companyName: RECRUITER.company, kind: "SUMMER", fromKey: "2026-05-18", toKey: "2026-06-26", hours: 240, credits: 2, windowSemester: 2, supervisorName: "Meera Iyer", facultyMembershipId: staff.f1.id, diary: JSON.stringify([{ on: "2026-05-18", hours: 6, text: "Induction; the motor controller's test bench." }, { on: "2026-06-10", hours: 7, text: "Wrote the PWM driver's unit tests." }]), industryGrade: "A", facultyVisitAt: new Date("2026-06-12T06:00:00Z"), vivaMarks: 42, status: "CREDITED", decidedByUserId: staff.hodComp.userId, decidedAt: new Date("2026-05-10T06:00:00Z"), creditedAt: new Date("2026-07-08T06:00:00Z"), creditedByUserId: staff.hodComp.userId } });
  }
  return { companyId: company.id, openDriveId: open.id };
}

/* -------------------------------------------------------------------------- */
/* the IQAC desk: records, the autonomous cycle, the NBA SAR, the disclosure   */
/* -------------------------------------------------------------------------- */

async function buildIqac(college: College, people: People, academics: Academics) {
  const s = college.id;
  const { staff } = people;
  const deptOf = (p: Prog) => academics.programmes[p]!.deptId;
  const records: [StaffKey, string, string, boolean, number, string, Prog][] = [
    ["principal", "PRINCIPAL", "PHD", true, 14, "2012-06-15", "BECOMP"],
    ["hodComp", "PROFESSOR", "PHD", true, 11, "2013-07-01", "BECOMP"],
    ["f1", "ASSISTANT_PROFESSOR", "PG", true, 3, "2019-07-15", "BECOMP"],
    ["f2", "ASSISTANT_PROFESSOR", "PHD", true, 2, "2020-08-01", "BECOMP"],
    ["hodMech", "ASSOCIATE_PROFESSOR", "PHD", false, 9, "2014-06-20", "BEMECH"],
    ["f3", "ASSISTANT_PROFESSOR", "PG", true, 4, "2018-07-02", "BEMECH"],
    ["f4", "ASSISTANT_PROFESSOR", "PG", false, 1, "2022-07-11", "BEMECH"],
  ];
  for (const [key, designation, highestQualification, netSetQualified, experienceBeforeYears, joinedOn, dept] of records) {
    await db.facultyRecord.upsert({ where: { membershipId: staff[key].id }, create: { schoolId: s, membershipId: staff[key].id, designation, appointment: "REGULAR", highestQualification, netSetQualified, experienceBeforeYears, joinedOn, departmentId: deptOf(dept), apiScoreJson: JSON.stringify({ teaching: 85, research: key === "hodComp" || key === "f2" ? 60 : 30, service: 20 }), updatedByUserId: staff.registrar.userId }, update: {} });
  }
  const research: [string, string, string, number, number | null, StaffKey, Prog][] = [
    ["PUBLICATION", "Lock-free queues for embedded controllers", "SCOPUS", 2026, null, "hodComp", "BECOMP"],
    ["PUBLICATION", "Teaching data structures with visual traces", "UGC_CARE", 2025, null, "f2", "BECOMP"],
    ["PROJECT", "Low-cost vibration monitor for small foundries (AICTE RPS)", "NONE", 2025, 14.5, "hodMech", "BEMECH"],
    ["PATENT", "A clamp for torsion specimens of varying diameter", "NONE", 2026, null, "f3", "BEMECH"],
  ];
  for (const [kind, title, indexing, year, amountLakhs, by, dept] of research) {
    if (await db.researchItem.findFirst({ where: { schoolId: s, title }, select: { id: true } })) continue;
    await db.researchItem.create({ data: { schoolId: s, kind, title, indexing, year, amountLakhs, facultyMembershipId: staff[by].id, departmentId: deptOf(dept), createdByUserId: staff.iqac.userId } });
  }
  const committees: [string, string, { name: string; role: string; membershipId: string | null }[], string, string][] = [
    ["ANTI_RAGGING", "Anti-ragging Committee and Squad", [{ name: "Dr Shrikant Gokhale", role: "Chair", membershipId: staff.principal.id }, { name: "Prof Rasika Dixit", role: "Squad member", membershipId: staff.f2.id }, { name: "Ganesh Pawar", role: "Warden", membershipId: staff.warden.id }], "2026-08-05", "Undertakings collected from every first-year student; the squad's night rounds of the hostel fixed."],
    ["GRIEVANCE", "Students' Grievance Redressal Committee", [{ name: "Dr Shrikant Gokhale", role: "Chair", membershipId: staff.principal.id }, { name: "Dr Vikas Phadnis", role: "Member", membershipId: staff.hodMech.id }], "2026-09-02", "No case pending."],
    ["IQAC", "Internal Quality Assurance Cell", [{ name: "Dr Shrikant Gokhale", role: "Chair", membershipId: staff.principal.id }, { name: "Dr Swati Marathe", role: "Coordinator", membershipId: staff.iqac.id }, { name: "Dr Anagha Kelkar", role: "Member", membershipId: staff.hodComp.id }], "2026-09-12", "The NBA SAR for Computer Engineering assigned to the department; the autonomous cycle's metrics reviewed."],
  ];
  for (const [kind, name, members, at, actionTaken] of committees) {
    const committee = (await db.committee.findFirst({ where: { schoolId: s, kind, name }, select: { id: true } })) ?? (await db.committee.create({ data: { schoolId: s, kind, name, membersJson: JSON.stringify(members) }, select: { id: true } }));
    if (!(await db.committeeMeeting.findFirst({ where: { committeeId: committee.id, at }, select: { id: true } }))) await db.committeeMeeting.create({ data: { schoolId: s, committeeId: committee.id, at, actionTaken, createdByUserId: staff.registrar.userId } });
  }
  // The NSS unit: three students enrolled by the officer and the unit's first activity, with its hours.
  for (const n of NSS) {
    const st = people.students.find((x) => x.n === n)!;
    await db.corpsEnrolment.upsert({ where: { corps_studentMembershipId: { corps: "NSS", studentMembershipId: st.id } }, create: { schoolId: s, corps: "NSS", studentMembershipId: st.id, unit: "SIT NSS Unit 1", enrolledOn: "2026-08-10", createdByUserId: staff.f2.userId }, update: {} });
  }
  const nssTitle = "Tree plantation and a water audit at Phursungi";
  if (!(await db.activity.findFirst({ where: { schoolId: s, title: nssTitle }, select: { id: true } }))) {
    await db.activity.create({ data: { schoolId: s, kind: "NSS", title: nssTitle, at: "2026-09-19", participants: 3, participantIdsJson: JSON.stringify(NSS.map((n) => people.students.find((x) => x.n === n)!.id)), hours: 6, camp: false, createdByUserId: staff.f2.userId } });
  }

  // The cycle: NAAC's AUTONOMOUS framework over 2023–28, two figures the platform does not hold entered by the desk; computed once.
  const entered = JSON.stringify({ SANCTIONED_POSTS: { value: 12, byUserId: staff.iqac.userId, at: "2026-09-01T06:00:00.000Z", fileIds: [] }, BANDWIDTH_MBPS: { value: 500, byUserId: staff.iqac.userId, at: "2026-09-01T06:00:00.000Z", fileIds: [] } });
  const cycle =
    (await db.accreditationCycle.findFirst({ where: { schoolId: s, framework: "AUTONOMOUS" }, select: { id: true } })) ??
    (await db.accreditationCycle.create({ data: { schoolId: s, framework: "AUTONOMOUS", institutionType: "AUTONOMOUS_COLLEGE", windowFrom: "2023-06-01", windowTo: "2028-05-31", status: "OPEN", enteredJson: entered, createdByUserId: staff.iqac.userId }, select: { id: true } }));
  if ((await db.metricScore.count({ where: { cycleId: cycle.id } })) === 0) await recomputeAsSystem(s, cycle.id, staff.iqac.userId);

  // The NBA SAR for Computer Engineering: this academic year's (its students, faculty and offerings are this year's),
  // three qualitative criteria written by the HOD, generated as a DRAFT and rebuilt in place on every run while one.
  const year = defaultFilingYear() + 1;
  const deptId = deptOf("BECOMP");
  const NOTES: Record<string, { score: number; note: string }> = {
    "1": { score: 50, note: "Vision and mission displayed in every laboratory and on the website; the PEOs reviewed by the department advisory board on 12 August 2026 with two recruiters and an alumnus." },
    "6": { score: 62, note: "Computer Lab 1 with 24 machines and batches of up to twenty; the oscilloscopes and trainer kits are on the asset register; a breakage log kept by the lab in-charge." },
    "9": { score: 40, note: "A mentor for every twenty students; the anti-ragging squad's rounds and the grievance committee's minutes are on record; NSS unit active." },
  };
  const items = Object.fromEntries(Object.entries(NOTES).map(([code, v]) => [code, { answer: null, score: v.score, note: v.note }]));
  const key = { schoolId: s, kind: "NBA_SAR", year, departmentId: deptId };
  await db.filingWorksheet.upsert({ where: { schoolId_kind_year_departmentId: key }, create: { ...key, itemsJson: JSON.stringify(items), updatedByUserId: staff.hodComp.userId }, update: { itemsJson: JSON.stringify(items) } });
  const built = await buildFiling(s, "NBA_SAR", year, null, deptId);
  const sarData = { format: built.format, body: built.body, hash: iqacHash(built.body), figuresJson: JSON.stringify(built.figures) };
  const sar = await db.collegeFiling.findFirst({ where: { schoolId: s, kind: "NBA_SAR", year, departmentId: deptId }, select: { id: true, status: true } });
  if (!sar) await db.collegeFiling.create({ data: { schoolId: s, kind: "NBA_SAR", year, departmentId: deptId, generatedByUserId: staff.iqac.userId, ...sarData } });
  else if (sar.status === "DRAFT") await db.collegeFiling.update({ where: { id: sar.id }, data: sarData });

  // The AICTE mandatory disclosure, published (an engineering college's streams bring it), its snapshot hashed.
  const { document } = await disclosureDocument(s, year);
  const snapshotJson = JSON.stringify(document);
  const page = await db.disclosurePage.findUnique({ where: { schoolId: s }, select: { hash: true } });
  if (page?.hash !== iqacHash(snapshotJson)) await db.disclosurePage.upsert({ where: { schoolId: s }, create: { schoolId: s, schoolSlug: SLUG, publishedAt: new Date(), snapshotJson, hash: iqacHash(snapshotJson) }, update: { schoolSlug: SLUG, publishedAt: new Date(), snapshotJson, hash: iqacHash(snapshotJson) } });

  return { cycleId: cycle.id, sarYear: year, sarComputed: built.figures.computedMarks ?? 0, sarSelf: built.figures.selfMarks ?? 0 };
}

/* -------------------------------------------------------------------------- */
/* the campus: library, hostel, transport, inventory, payroll                   */
/* -------------------------------------------------------------------------- */

async function buildCampus(college: College, people: People) {
  const s = college.id;
  const { staff, students } = people;
  const student = (n: number) => students.find((x) => x.n === n)!;

  // The library: four titles, their copies, one book out with Rohan.
  await db.librarySettings.upsert({ where: { schoolId: s }, create: { schoolId: s, pupilLimit: 3, pupilLoanDays: 14, staffLimit: 6, staffLoanDays: 30, maxRenewals: 1, finePerDayPaise: 200, fineHeadId: null }, update: {} });
  const TITLES: [string, string, string, string, number, string][] = [
    ["9789352866373", "Data Structures Using C", "Reema Thareja", "Oxford University Press", 2014, "Computer Engineering"],
    ["9788131808153", "Discrete Mathematics and Its Applications", "Kenneth H. Rosen", "McGraw Hill", 2017, "Computer Engineering"],
    ["9788122438581", "Strength of Materials", "R. K. Rajput", "S. Chand", 2018, "Mechanical Engineering"],
    ["9789339221652", "Engineering Thermodynamics", "P. K. Nag", "McGraw Hill", 2017, "Mechanical Engineering"],
  ];
  let accession = 0;
  for (const [isbn, title, author, publisher, year, subject] of TITLES) {
    const t = await db.libraryTitle.upsert({ where: { schoolId_isbn: { schoolId: s, isbn } }, create: { schoolId: s, isbn, title, author, publisher, year, subject, language: "EN", category: "GENERAL" }, update: {}, select: { id: true } });
    for (let c = 0; c < 3; c += 1) {
      accession += 1;
      await db.libraryCopy.upsert({ where: { schoolId_accession: { schoolId: s, accession: `SIT-${pad(accession, 5)}` } }, create: { schoolId: s, titleId: t.id, accession: `SIT-${pad(accession, 5)}`, rack: subject.startsWith("Computer") ? "C1" : "M1" }, update: {} });
    }
  }
  const rohan = student(2);
  const card = await db.libraryMember.upsert({ where: { membershipId: rohan.id }, create: { schoolId: s, membershipId: rohan.id, kind: "PUPIL", cardNumber: "SIT-L0002" }, update: {}, select: { id: true } });
  const copy = await db.libraryCopy.findUniqueOrThrow({ where: { schoolId_accession: { schoolId: s, accession: "SIT-00001" } }, select: { id: true } });
  if (!(await db.libraryIssue.findFirst({ where: { schoolId: s, copyId: copy.id }, select: { id: true } }))) {
    await db.libraryIssue.create({ data: { schoolId: s, copyId: copy.id, memberId: card.id, issuedAt: new Date("2026-09-28T06:00:00Z"), dueOn: "2026-10-12", issuedByUserId: staff.librarian.userId } });
    await db.libraryCopy.update({ where: { id: copy.id }, data: { status: "ISSUED" } });
  }

  // The hostel: Visvesvaraya Hostel (boys), four boarders, one of them a minor; the anti-ragging squad's night round.
  const hostel = await db.hostel.upsert({ where: { schoolId_name: { schoolId: s, name: "Visvesvaraya Hostel" } }, create: { schoolId: s, name: "Visvesvaraya Hostel", kind: "BOYS", wardenMembershipId: staff.warden.id, capacity: 8, messAttendance: false, curfewMinute: 22 * 60, nightOutAllowed: true }, update: { wardenMembershipId: staff.warden.id }, select: { id: true } });
  const roomIds: string[] = [];
  for (const [number, floor] of [["G-01", "Ground"], ["G-02", "Ground"]] as const) roomIds.push((await db.hostelRoom.upsert({ where: { hostelId_number: { hostelId: hostel.id, number } }, create: { schoolId: s, hostelId: hostel.id, number, floor, beds: 4, kind: "SHARED" }, update: {}, select: { id: true } })).id);
  for (const [i, n] of BOARDERS.entries()) {
    const st = student(n);
    if (await db.hostelAllotment.findFirst({ where: { schoolId: s, membershipId: st.id, status: "ACTIVE" }, select: { id: true } })) continue;
    const roomId = roomIds[i < 2 ? 0 : 1]!;
    const bed = (i % 2) + 1;
    await db.hostelAllotment.create({ data: { schoolId: s, membershipId: st.id, roomId, bed, fromDate: "2026-07-01", status: "ACTIVE", activePupilKey: st.id, activeBedKey: `${roomId}:${bed}`, allottedByUserId: staff.registrar.userId } });
  }
  if (!(await db.hostelSquadRound.findFirst({ where: { schoolId: s, hostelId: hostel.id }, select: { id: true } }))) {
    await db.hostelSquadRound.create({ data: { schoolId: s, hostelId: hostel.id, at: new Date("2026-09-25T16:30:00Z"), members: "Prof Rasika Dixit, Ganesh Pawar", note: "First-year rooms visited after dinner; nothing to report.", flagged: false, loggedByUserId: staff.f2.userId } });
  }

  // Transport: Route 1 from Hadapsar, three stops, one bus driven by the driver, three riders.
  let route = await db.transportRoute.findFirst({ where: { schoolId: s, name: "Route 1 — Hadapsar to campus" }, select: { id: true } });
  if (!route) {
    route = await db.transportRoute.create({ data: { schoolId: s, name: "Route 1 — Hadapsar to campus", direction: "BOTH", note: "Two public stops and the institute's gate." }, select: { id: true } });
    const STOPS: [string, number, number, number, number][] = [
      ["Hadapsar Gadital bus stop", 18.50213, 73.92584, 7 * 60 + 35, 17 * 60 + 25],
      ["Magarpatta city gate 2", 18.51402, 73.92781, 7 * 60 + 45, 17 * 60 + 15],
      ["Saraswati Institute of Technology, main gate", 18.48911, 73.94120, 8 * 60 + 15, 16 * 60 + 50],
    ];
    for (const [i, [name, lat, lng, morning, evening]] of STOPS.entries()) await db.transportStop.create({ data: { schoolId: s, routeId: route.id, order: i + 1, name, lat, lng, morningMinute: morning, eveningMinute: evening, radiusM: 150 } });
  }
  const bus = await db.bus.upsert({ where: { schoolId_registration: { schoolId: s, registration: "MH 12 SIT 4021" } }, create: { schoolId: s, registration: "MH 12 SIT 4021", capacity: 42, note: "The institute's own bus." }, update: {}, select: { id: true } });
  if (!(await db.busAssignment.findFirst({ where: { schoolId: s, busId: bus.id, routeId: route.id }, select: { id: true } }))) await db.busAssignment.create({ data: { schoolId: s, busId: bus.id, routeId: route.id, driverMembershipId: staff.driver.id, fromDateKey: "2026-07-01", createdByUserId: staff.registrar.userId } });
  const stops = await db.transportStop.findMany({ where: { routeId: route.id }, orderBy: { order: "asc" }, select: { id: true } });
  for (const [i, n] of RIDERS.entries()) {
    const st = student(n);
    if (await db.transportAllotment.findFirst({ where: { schoolId: s, studentMembershipId: st.id, routeId: route.id }, select: { id: true } })) continue;
    await db.transportAllotment.create({ data: { schoolId: s, studentMembershipId: st.id, routeId: route.id, stopId: stops[i % 2]!.id, fromDateKey: "2026-07-01", createdByUserId: staff.registrar.userId } });
  }

  // Inventory: the labs' equipment. One purchase into each lab, the stock the sum of its movements, the assets by
  // room (the lab desk reads stock and assets at the lab's room name), and one breadboard written off as a breakage.
  const category = await db.inventoryCategory.upsert({ where: { schoolId_name: { schoolId: s, name: "Laboratory equipment" } }, create: { schoolId: s, name: "Laboratory equipment", depreciationRateBp: 1500 }, update: {}, select: { id: true } });
  const vendor = await db.vendor.upsert({ where: { schoolId_name: { schoolId: s, name: "Deccan Scientific Suppliers" } }, create: { schoolId: s, name: "Deccan Scientific Suppliers", phone: "+912026870044" }, update: {}, select: { id: true, name: true } });
  const item = (code: string, name: string, unit: string, reorderLevel: number, kind = "CONSUMABLE") => db.inventoryItem.upsert({ where: { schoolId_code: { schoolId: s, code } }, create: { schoolId: s, code, name, unit, reorderLevel, kind, categoryId: category.id }, update: {}, select: { id: true } });
  const breadboard = await item("CE-BREADBOARD", "Solderless breadboard (830 points)", "piece", 10);
  const arduino = await item("CE-ARDUINO", "Arduino Uno board", "piece", 5);
  const vernier = await item("ME-VERNIER", "Vernier calliper, 150 mm", "piece", 4);
  const scope = await item("CE-SCOPE", "Digital storage oscilloscope, 50 MHz", "piece", 0, "ASSET");
  const utm = await item("ME-UTM", "Universal testing machine, 400 kN", "piece", 0, "ASSET");
  for (const [ref, location, lines, moves] of [
    ["SIT/LAB/2026/014", LABS.BECOMP, [{ itemCode: "CE-BREADBOARD", description: "Solderless breadboard (830 points)", quantity: 30, unitPaise: 18_000, totalPaise: 540_000 }, { itemCode: "CE-ARDUINO", description: "Arduino Uno board", quantity: 15, unitPaise: 95_000, totalPaise: 1_425_000 }], [[breadboard.id, 30], [arduino.id, 15]]],
    ["SIT/LAB/2026/015", LABS.BEMECH, [{ itemCode: "ME-VERNIER", description: "Vernier calliper, 150 mm", quantity: 12, unitPaise: 65_000, totalPaise: 780_000 }], [[vernier.id, 12]]],
  ] as const) {
    if (await db.purchaseRecord.findFirst({ where: { schoolId: s, invoiceRef: ref }, select: { id: true } })) continue;
    await db.$transaction(async (tx) => {
      const bill = await tx.purchaseRecord.create({ data: { schoolId: s, vendorId: vendor.id, vendorName: vendor.name, dateKey: "2026-07-20", invoiceRef: ref, location, linesJson: JSON.stringify(lines), totalPaise: lines.reduce((a, l) => a + l.totalPaise, 0), note: "Odd-term lab stock.", createdByUserId: staff.registrar.userId }, select: { id: true } });
      for (const [itemId, qty] of moves) {
        await tx.stockMovement.create({ data: { schoolId: s, itemId, kind: "PURCHASE", delta: qty, location, purchaseRecordId: bill.id, reference: ref, byUserId: staff.registrar.userId, note: "" } });
        await tx.inventoryStock.upsert({ where: { itemId_location: { itemId, location } }, create: { schoolId: s, itemId, location, quantity: qty }, update: { quantity: { increment: qty } } });
      }
    });
  }
  if (!(await db.stockMovement.findFirst({ where: { schoolId: s, kind: "WRITE_OFF", reference: "BREAKAGE" }, select: { id: true } }))) {
    await db.$transaction(async (tx) => {
      await tx.stockMovement.create({ data: { schoolId: s, itemId: breadboard.id, kind: "WRITE_OFF", delta: -1, location: LABS.BECOMP, reference: "BREAKAGE", note: "Burnt through during experiment 2 (SE Computer A, batch B).", byUserId: staff.f1.userId } });
      await tx.inventoryStock.update({ where: { itemId_location: { itemId: breadboard.id, location: LABS.BECOMP } }, data: { quantity: { decrement: 1 } } });
    });
  }
  for (const [tagNumber, name, itemId, location, costPaise, purchaseDate, custodian] of [
    ["SIT-A-0001", "Digital storage oscilloscope, 50 MHz (bench 1)", scope.id, LABS.BECOMP, 4_200_000, "2024-07-10", staff.f1.id],
    ["SIT-A-0002", "Digital storage oscilloscope, 50 MHz (bench 2)", scope.id, LABS.BECOMP, 4_200_000, "2024-07-10", staff.f1.id],
    ["SIT-A-0003", "Universal testing machine, 400 kN", utm.id, LABS.BEMECH, 285_000_000, "2019-12-02", staff.f3.id],
  ] as const) {
    const existing = await db.asset.findUnique({ where: { schoolId_tagNumber: { schoolId: s, tagNumber } }, select: { id: true } });
    if (existing) continue;
    const a = await db.asset.create({ data: { schoolId: s, tagNumber, name, itemId, categoryId: category.id, vendorId: vendor.id, purchaseDate: day(purchaseDate), costPaise, location, custodianMembershipId: custodian, status: "IN_USE" }, select: { id: true } });
    await db.assetEvent.create({ data: { schoolId: s, assetId: a.id, kind: "CREATED", byUserId: staff.registrar.userId } });
  }

  // Payroll: the statutory settings, one structure, a salary for every member of staff, September locked.
  const settings = { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH" as const, employerName: "Saraswati Education Society", pfEstablishmentCode: "PUPUN0071234000", esiEmployerCode: "33000716540001001" };
  await db.payrollSettings.upsert({ where: { schoolId: s }, create: { schoolId: s, ...settings }, update: {} });
  const STRUCTURE: { code: SalaryComponentCode; formula: SalaryFormula; value: number }[] = [
    { code: "BASIC", formula: "FIXED", value: 0 },
    { code: "HRA", formula: "PERCENT_OF_BASIC", value: 2400 },
    { code: "DA", formula: "PERCENT_OF_BASIC", value: 1200 },
    { code: "CONVEYANCE", formula: "FIXED", value: 200_000 },
    { code: "PF_EMPLOYEE", formula: "FIXED", value: 0 },
    { code: "PF_EMPLOYER", formula: "FIXED", value: 0 },
    { code: "ESI_EMPLOYEE", formula: "FIXED", value: 0 },
    { code: "ESI_EMPLOYER", formula: "FIXED", value: 0 },
    { code: "PT", formula: "FIXED", value: 0 },
    { code: "TDS", formula: "FIXED", value: 0 },
  ];
  const structure = await db.salaryStructure.upsert({ where: { schoolId_name: { schoolId: s, name: "Institute staff" } }, create: { schoolId: s, name: "Institute staff" }, update: {}, select: { id: true } });
  if ((await db.salaryComponent.count({ where: { structureId: structure.id } })) === 0) {
    await db.salaryComponent.createMany({ data: STRUCTURE.map((c, i) => ({ schoolId: s, structureId: structure.id, code: c.code, label: "", kind: COMPONENT_KIND[c.code], formula: c.formula, value: c.value, statutory: STATUTORY_CODES.includes(c.code), position: i })) });
  }
  for (const [i, p] of STAFF.entries()) {
    await db.staffSalary.upsert({ where: { membershipId_effectiveFromKey: { membershipId: staff[p.key].id, effectiveFromKey: "2026-04-01" } }, create: { schoolId: s, membershipId: staff[p.key].id, effectiveFromKey: "2026-04-01", structureId: structure.id, basicPaise: p.basic, pfUan: `10120${pad(i + 1, 7)}`, paymentMode: "CASH" }, update: {} });
  }
  if (!(await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId: s, month: PAYROLL_MONTH } }, select: { id: true } }))) {
    const comps = STRUCTURE.map((c) => ({ code: c.code, label: "", formula: c.formula, value: c.value }));
    const slips = STAFF.map((p) => {
      const f = computeSlip({ month: PAYROLL_MONTH, daysInMonth: daysInMonthOf(PAYROLL_MONTH), lopHalfDays: 0, basicPaise: p.basic, components: comps, overrides: {}, settings, gender: null, arrearsPaise: 0, tdsOverridePaise: p.basic >= 8_000_000 ? 900_000 : null, advances: [] });
      return { schoolId: s, membershipId: staff[p.key].id, staffName: p.name, department: p.role, designation: p.title, daysInMonth: daysInMonthOf(PAYROLL_MONTH), lopHalfDays: 0, lopOverrideHalfDays: null, linesJson: JSON.stringify(f.lines), grossPaise: f.grossPaise, deductionsPaise: f.deductionsPaise, employerPaise: f.employerPaise, netPaise: f.netPaise, arrearsPaise: 0, tdsOverridePaise: p.basic >= 8_000_000 ? 900_000 : null, notes: "", paymentMode: "CASH", bankLast4: null as string | null };
    });
    const sum = (k: "grossPaise" | "deductionsPaise" | "employerPaise" | "netPaise") => slips.reduce((a, x) => a + x[k], 0);
    await db.$transaction(async (tx) => {
      const r = await tx.payrollRun.create({ data: { schoolId: s, month: PAYROLL_MONTH, status: "LOCKED", headcount: slips.length, grossPaise: sum("grossPaise"), deductionsPaise: sum("deductionsPaise"), employerPaise: sum("employerPaise"), netPaise: sum("netPaise"), lockDigest: slipDigest(slips), sharedWithPrincipal: true, createdByUserId: staff.accounts.userId, lockedByUserId: staff.accounts.userId, lockedAt: new Date("2026-09-30T11:00:00Z") }, select: { id: true } });
      await tx.payslip.createMany({ data: slips.map((x) => ({ ...x, runId: r.id })) });
    });
  }

}

/* -------------------------------------------------------------------------- */
/* counts and the roster                                                       */
/* -------------------------------------------------------------------------- */

async function countBlock(schoolId: string, emails: string[], companyId: string, cycleId: string) {
  const s = { schoolId };
  const cycle = await db.accreditationCycle.findUniqueOrThrow({ where: { id: cycleId }, select: { cgpa: true } });
  const dutyHolders = await db.membership.findMany({ where: { schoolId, role: { in: ["FACULTY", "HOD"] } }, select: { dutiesJson: true } });
  return {
    users: await db.user.count({ where: { email: { in: emails } } }),
    memberships: await db.membership.count({ where: s }),
    duties: dutyHolders.reduce((a, m) => a + (JSON.parse(m.dutiesJson) as string[]).length, 0),
    modulesOn: await db.schoolModule.count({ where: s }),
    guardianships: await db.guardianship.count({ where: { studentSchoolId: schoolId } }),
    departments: await db.department.count({ where: s }),
    programmes: await db.programme.count({ where: s }),
    courses: await db.course.count({ where: s }),
    divisions: await db.division.count({ where: s }),
    labBatches: await db.labBatch.count({ where: s }),
    labBatchMembers: await db.labBatchMember.count({ where: s }),
    offerings: await db.courseOffering.count({ where: s }),
    offeringSlots: await db.offeringSlot.count({ where: s }),
    labSlots: await db.offeringSlot.count({ where: { ...s, kind: "LAB" } }),
    registrations: await db.courseRegistration.count({ where: s }),
    lectures: await db.lecture.count({ where: s }),
    labLectures: await db.lecture.count({ where: { ...s, labBatchId: { not: null } } }),
    lectureMarks: await db.lectureAttendance.count({ where: s }),
    practicalRecords: await db.practicalRecord.count({ where: s }),
    practicalSigned: await db.practicalRecord.count({ where: { ...s, signedAt: { not: null } } }),
    internalMarks: await db.internalMark.count({ where: s }),
    internalLocks: await db.internalLock.count({ where: s }),
    examSessions: await db.examSession.count({ where: s }),
    conductSessions: await db.examSession.count({ where: { ...s, status: "CONDUCT" } }),
    questionPapers: await db.questionPaper.count({ where: s }),
    sealedPapers: await db.questionPaper.count({ where: { ...s, sealedBody: { not: null } } }),
    examForms: await db.examForm.count({ where: s }),
    hallTickets: await db.hallTicket.count({ where: s }),
    examMarks: await db.examMark.count({ where: s }),
    publishedRuns: await db.resultRun.count({ where: { ...s, status: "PUBLISHED" } }),
    termResults: await db.termResult.count({ where: s }),
    backlogs: await db.backlog.count({ where: s }),
    gradeCards: await db.examDocument.count({ where: { ...s, kind: "GRADE_CARD" } }),
    companyRecruiters: await db.companyRecruiter.count({ where: { companyId } }),
    drives: await db.drive.count({ where: s }),
    applications: await db.driveApplication.count({ where: s }),
    offers: await db.offer.count({ where: s }),
    internships: await db.internship.count({ where: s }),
    placementSeasons: await db.placementSeason.count({ where: s }),
    accreditationCycles: await db.accreditationCycle.count({ where: s }),
    metricScores: await db.metricScore.count({ where: s }),
    cycleCgpa: (cycle.cgpa ?? 0).toFixed(2),
    facultyRecords: await db.facultyRecord.count({ where: s }),
    researchItems: await db.researchItem.count({ where: s }),
    committees: await db.committee.count({ where: s }),
    corpsEnrolments: await db.corpsEnrolment.count({ where: s }),
    collegeFilings: await db.collegeFiling.count({ where: s }),
    filingWorksheets: await db.filingWorksheet.count({ where: s }),
    disclosurePublished: await db.disclosurePage.count({ where: { ...s, publishedAt: { not: null } } }),
    feeStructures: await db.feeStructure.count({ where: s }),
    feeDemands: await db.feeDemand.count({ where: s }),
    feeReceipts: await db.feeReceipt.count({ where: s }),
    scholarshipClaims: await db.scholarshipClaim.count({ where: s }),
    libraryCopies: await db.libraryCopy.count({ where: s }),
    libraryIssues: await db.libraryIssue.count({ where: s }),
    hostelAllotments: await db.hostelAllotment.count({ where: { ...s, status: "ACTIVE" } }),
    transportRiders: await db.transportAllotment.count({ where: s }),
    inventoryItems: await db.inventoryItem.count({ where: s }),
    stockMovements: await db.stockMovement.count({ where: s }),
    assets: await db.asset.count({ where: s }),
    staffSalaries: await db.staffSalary.count({ where: s }),
    payslips: await db.payslip.count({ where: s }),
    alumniProfiles: await db.alumniProfile.count({ where: s }),
  };
}

function roster(college: College, sgpa: Record<number, number | null>, sar: { year: number; computed: number; self: number }): string {
  const sg = (n: number) => (sgpa[n] === null || sgpa[n] === undefined ? "—" : (sgpa[n]! / 100).toFixed(2));
  const divName = (key: string) => DIVISIONS.find((d) => d.key === key)!.name;
  const studentLine = (st: StudentSpec) => {
    const notes: string[] = [];
    if (st.year === 2) notes.push(`last term's SGPA ${sg(st.n)} (grade card)`);
    if (st.n === 2) notes.push("OBC post-matric scholarship sanctioned; a library book out");
    if (st.n === 3) notes.push("summer internship at Deccan Robotics, credited (/student/placement)");
    if (st.n === 9) notes.push("ATKT in ME201 with a backlog");
    if (st.n === 10) notes.push("under 75 % in ME302");
    if (st.n === 1 || st.n === 7) notes.push("applied to the open drive");
    if (BOARDERS.includes(st.n)) notes.push("boards at Visvesvaraya Hostel");
    if (RIDERS.includes(st.n)) notes.push("rides Route 1");
    if (NSS.includes(st.n)) notes.push("NSS volunteer");
    if (MINORS.has(st.n)) notes.push(st.n === GUARDIAN.of ? "a minor of 17; her guardian sees everything" : "a minor of 17");
    if (st.paidOdd) notes.push("odd semester paid");
    return `| ${studentEmail(st.n)} | ${st.name} | Student, ${divName(st.div)} (${st.category}) | /student | /student/academics (lab batch, practicals), /student/exams (hall ticket for Winter 2026)${notes.length ? `; ${notes.join("; ")}` : ""} |`;
  };
  return `<!-- demo-college-engineering:begin -->
## Saraswati Institute of Technology (the demo engineering college)

Built by \`npm run demo:college-engineering\` (from \`apps/web\`; \`scripts/demo-college-engineering.ts\`, a second script beside the arts college's; idempotent, run it again to put things back). Slug \`${SLUG}\`, join code \`${college.code}\`, kind AUTONOMOUS_COLLEGE, streams ENGINEERING, Pune, affiliated to Savitribai Phule Pune University for the degree and autonomous in conduct, AISHE C-41902 and an AICTE extension-of-approval reference (both made up), NAAC A until 31 March 2029. Every module a college is offered is on: the eight the ENGINEERING preset turns on and the four the roster's librarian, warden, driver and payroll need. The password is the demo schools' shared one, \`${PASSWORD}\`. For a browser check mint a session: \`npm run zz:token -- ROLE email@${DOMAIN}\` (then \`--purge\`).

What is in it: Computer Engineering (head Dr Anagha Kelkar) and Mechanical Engineering (head Dr Vikas Phadnis); BE programmes (AICTE, four years) on the institute's autonomous scheme "${SCHEME}" with programme and course outcomes; the odd term 2026–27 (current) and the even term 2025–26; divisions SE Computer A and B, SE Mechanical A and B and FE Computer A; lab batches A and B (capacity 20) in every second-year division and A in the first year's; ten offerings on a Mon–Sat grid, each lab course with one LAB hour per batch in Computer Lab 1 or the Strength of Materials Lab; registers from 7 September to 3 October 2026, the LAB hours registered for their batch only; a practical record for every lab student (experiment 1 signed by the department's lab in-charge, CE301 experiment 2 in SE Computer A waiting for a signature); internal marks locked on CE301 in SE Computer A, ME302's unit test in SE Mechanical A waiting for a countersign; Winter 2026 in CONDUCT with hall tickets, the CE301 paper set by Prof Rasika Dixit and sealed, ME302's assigned to Prof Sameer Kulkarni; Summer 2026 published from marks the cell entered by double entry, a grade card for each of the ten who sat, one ATKT; ${RECRUITER.company} (verified by the TPO) with an OPEN drive and two applicants, last season's closed drive with the alumnus's offer and the 2025 season, a SUMMER internship credited; NAAC's autonomous cycle (2023–28) computed; the NBA SAR for Computer Engineering for ${sar.year}–${String((sar.year + 1) % 100).padStart(2, "0")} as a draft (${sar.computed} marks from the records and ${sar.self} self-assessed by the HOD on three criteria, of 1,000); the AICTE mandatory disclosure published at /public/disclosure/${SLUG}; fee structures under the FRA, a demand per semester, six odd semesters paid by bank, one scholarship claim sanctioned; Visvesvaraya Hostel (boys) with four boarders and the squad's night round; Route 1 with three riders; lab stock, three assets and one breadboard written off as a breakage; a salary for each of the fifteen staff and September's payroll locked; duties: a LAB_INCHARGE per department (Prof Nikhil Bapat, Prof Sameer Kulkarni), ANTI_RAGGING_SQUAD and NSS_OFFICER (Prof Rasika Dixit, three students enrolled, one activity), RESEARCH_DEAN (Dr Anagha Kelkar), EXAM_SQUAD (Prof Pallavi Sathe).

| Account | Name | Role | Home | What to look at |
|---|---|---|---|---|
${STAFF.map((p) => `| ${p.email} | ${p.name} | ${p.role === "ADMIN" ? "Admin (registrar)" : p.role}${p.duties?.length ? ` · ${p.duties.join(", ")}` : ""} | ${p.home} | ${p.look} |`).join("\n")}
${STUDENTS.map(studentLine).join("\n")}
| ${GUARDIAN.email} | ${GUARDIAN.name} | Parent of Anushka Kale (a minor) | /parent | /parent/academics, /parent/results, /parent/fees, the bus (Route 1) |
| ${ALUMNUS.email} | ${ALUMNUS.name} | Alumnus (BE Computer, left May 2025) | /alumni | /alumni/college (placed through last season's drive, a mentor) |
| ${RECRUITER.email} | ${RECRUITER.name} | Recruiter, ${RECRUITER.company} (no membership) | /recruiter | the OPEN drive and its two consented applicants |
<!-- demo-college-engineering:end -->
`;
}

async function writeRoster(block: string): Promise<string> {
  const docPath = join(process.cwd(), "..", "..", "docs", "demo-schools.md");
  await mkdir(join(process.cwd(), "..", "..", "docs"), { recursive: true });
  const before = await readFile(docPath, "utf8").catch(() => "");
  const marked = /<!-- demo-college-engineering:begin -->[\s\S]*?<!-- demo-college-engineering:end -->\n?/;
  const after = marked.test(before) ? before.replace(marked, block) : `${before.trimEnd()}${before ? "\n\n" : ""}${block}`;
  if (after !== before) await writeFile(docPath, after);
  return docPath;
}

async function main() {
  await refuseUnlessLocal("demo:college-engineering");
  const ctx: Ctx = { passwordHash: await hash(PASSWORD, ARGON), setPassword: true };
  const college = await buildCollege();
  const people = await buildPeople(ctx, college);
  // Every module a college is offered: the ENGINEERING preset's eight and the four the module roles work in.
  await switchModulesOn(college, SCHOOL_MODULES, people.staff.registrar.userId);
  const academics = await buildAcademics(college, people);
  const office = await buildOffice(college, people, academics);
  const exams = await buildExams(college, people, academics, office.examHeadId);
  const placement = await buildPlacement(college, people, academics, exams.sgpa);
  const iqac = await buildIqac(college, people, academics);
  await buildCampus(college, people);

  const emails = [...STAFF.map((p) => p.email), ...STUDENTS.map((st) => studentEmail(st.n)), GUARDIAN.email, ALUMNUS.email, RECRUITER.email];
  const counts = await countBlock(college.id, emails, placement.companyId, iqac.cycleId);
  const docPath = await writeRoster(roster(college, exams.sgpa, { year: iqac.sarYear, computed: iqac.sarComputed, self: iqac.sarSelf }));

  console.log(`
  Demo engineering college ready. Password for EVERY account below: ${PASSWORD}

  ── ${college.name} ──────────────────────────────────────────
     school id   ${college.id}   join code ${college.code}   slug ${SLUG}
     staff       ${STAFF.map((p) => p.email.split("@")[0]).join(", ")} @${DOMAIN}
     students    sit.student01..12@${DOMAIN} — 6 SE Computer (A, B), 4 SE Mechanical (A, B), 2 FE Computer (both 17; guardian ${GUARDIAN.email})
     alumnus     ${ALUMNUS.email}; recruiter ${RECRUITER.email} (no membership)
     academics   ${counts.offerings} offerings, ${counts.labBatches} lab batches, ${counts.lectures} lectures (${counts.labLectures} LAB hours by batch) with ${counts.lectureMarks} marks, ${counts.practicalRecords} practical records (${counts.practicalSigned} signed)
     exams       Winter 2026 in CONDUCT (${counts.sealedPapers} paper sealed${exams.sealed ? "" : " — sealing unavailable"}); Summer 2026 published: ${counts.termResults} term results, ${counts.gradeCards} grade cards, ${counts.backlogs} backlog
     IQAC        autonomous cycle ${iqac.cycleId}, CGPA ${counts.cycleCgpa}; NBA SAR ${iqac.sarYear} draft: ${iqac.sarComputed} computed + ${iqac.sarSelf} self-assessed
     placement   OPEN drive ${placement.openDriveId}; 1 SUMMER internship credited

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
