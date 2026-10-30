/**
 * THE DEMO COLLEGES FOR EVERY STREAM (6 October 2026), beside the arts and
 * science college (demo-college.ts) and the engineering one
 * (demo-college-engineering.ts), behind the demo schools' ONE shared password.
 *
 *   npm run demo:college-stream -- --stream=LAW        one college
 *   npm run demo:college-stream -- --all               the eight
 *   npm run demo:college-stream -- --calendar          the dates it would write, nothing written
 *
 * ONE GENERIC SCRIPT, never one per stream: what a college of a stream is
 * switched on for, which filings it owes and which duties it may give is read
 * from STREAM_PRESETS and DUTY_BUILT (packages/contracts v1/streams.ts and
 * duties.ts); the names, departments, programmes, courses, the affiliating
 * university and the roster's people are the spec table
 * (scripts/demo-college-stream-specs.ts). Each tenant is a separate school row
 * (MANAGEMENT, LAW, EDUCATION, PHARMACY, ARCHITECTURE, AGRICULTURE,
 * VOCATIONAL, HEALTH_SCIENCES) with:
 *
 *   - the operator onboarding path's result: the kind (COLLEGE, or
 *     AUTONOMOUS_COLLEGE for architecture), the stream, the affiliating
 *     university and AISHE code, an active subscription, and the modules the
 *     preset switches on at the making (writeDefaultModules, the function
 *     createSchool calls) plus LIBRARY, HOSTEL, TRANSPORT and PAYROLL for the
 *     roster's librarian, warden, driver and payroll;
 *   - a registrar, the principal, two HODs, four FACULTY carrying every duty
 *     the stream offers (the preset's duties, DUTY_BUILT already applied, set
 *     through lib/duties.ts setDuties as the registrar, so the gate and the
 *     audit row are real), the controller of examinations, the IQAC
 *     coordinator, a TPO where PLACEMENT is on, accounts, a librarian, a
 *     warden and a driver; eight students (two minor twins with their parent,
 *     six adults, the twins' elder sibling a guardian's adult child who has
 *     granted ATTENDANCE and RESULTS through lib/student-consent.ts), the
 *     parent, an alumnus, and a recruiter where PLACEMENT is on (an outside
 *     account, a verified company, an OPEN drive);
 *   - two departments, a scheme with programmes and courses, this odd term's
 *     offerings with registers from the term's register window to the week
 *     before the run, internal marks locked on one offering and waiting on
 *     another, last term's sitting published with grade cards (marks imported
 *     at an affiliated college, entered by double entry at an autonomous one),
 *     this term's sitting in CONDUCT (an autonomous college's paper sealed),
 *     fee structures with a sanctioned scholarship, a NAAC cycle computed, the
 *     year's filings generated through lib/iqac-filings.ts generateFiling
 *     (the council's return — PCI, BCI, NCTE — where the preset brings one,
 *     NIRF for every college, the AICTE disclosure where AICTE approves), the
 *     stream's records (two moots and the internships for LAW; practice
 *     schools, postings and observations for EDUCATION; lab batches and
 *     practical records for PHARMACY, AGRICULTURE, VOCATIONAL,
 *     HEALTH_SCIENCES; NSS and NCC units with enrolments and an activity where
 *     offered; research for the dean; a flying-squad visit), the campus
 *     modules' rows, and a NAAC peer-team visit file for the IQAC
 *     (lib/peer-visits.ts).
 *
 * WHAT IS NOT BUILT, SAID IN THE ROSTER (the clinical desk is built since
 * 10 Oct 2026, R-56: a health-sciences or pharmacy college gets a hospital,
 * a rotation and logbook entries below): a pharmacy college's clinical coordinator,
 * an architecture college's studios and juries (R-5, R-56: DUTY_BUILT is false
 * for CLINICAL_COORDINATOR and STUDIO_COORDINATOR, so no clinical or studio
 * duty is given), an agriculture college's farm and field work (NOT_BUILT).
 * The councils of architecture and agriculture (COA, ICAR) have no return
 * kind in the app; those colleges file the base set.
 *
 * THE BCI RETURN IS LAST YEAR'S. Generating a year's BCI return freezes that
 * year's moots (R-53, stream-records.ts), so the law college files the
 * academic year that ended (2025–26, its moot and its court internship) and
 * this year's moot stays open for the owner to add to. Every other filing is
 * the current academic year's.
 *
 * IDEMPOTENT. Every write is find-or-create keyed on something stable; the
 * library calls are made only when their row is missing; a second run adds
 * nothing and prints the same counts. Dates through scripts/demo-calendar.ts.
 * Only `@demo.relay.test` people and the eight slugs are written; the walk's
 * sessions (userAgent "zz-walk") are deleted at the end. Runs on the ADMIN
 * connection; refuses a database that is not local.
 */
import { hash } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { COMPONENT_KIND, DUTY_BUILT, STATUTORY_CODES, STREAM_PRESETS, eResourceNameKey, gstinCheckChar, type DutyCode, type SalaryComponentCode, type SalaryFormula } from "@edulink/contracts";
import type { ActiveContext } from "../src/lib/session";
import { classCode, schoolCode } from "../src/lib/codes";
import { openAlumnus } from "../src/lib/alumni-membership";
import { lockTotals } from "../src/lib/academics-assessment";
import { checkCode, classFor, courseOutcome, gradingTableOf, rulesOf, sgpaHundredths, sgpaNumber, tenths, termStatusOf } from "../src/lib/exam-cell-rules";
import { placementTable } from "../src/lib/placement-analytics";
import { seasonBatchFor } from "../src/lib/placement-rules";
import { iqacHash, recomputeAsSystem, respondentHash } from "../src/lib/iqac";
import { buildFiling, generateFiling, setDisclosure } from "../src/lib/iqac-filings";
import { addWorkingDays } from "../src/lib/iqac-rules";
import { computeSlip, daysInMonthOf, slipDigest } from "../src/lib/payroll-rules";
import { writeDefaultModules } from "../src/lib/modules";
import { setDuties } from "../src/lib/duties";
import { setStudentConsent } from "../src/lib/student-consent";
import { addVisitItem, createVisit } from "../src/lib/peer-visits";
import { sendAlumniNote } from "../src/lib/alumni";
import { giveHeadPages, HEAD_PAGES_NOTE } from "./head-pages"; // owner-batch-item9
import { db, link, refuseUnlessLocal, switchModulesOn, upsertMembership, upsertUser, type Ctx } from "./zz-fixtures";
import { PASSWORD } from "./demo-schools";
import { demoCalendar, describeCalendar, refuseAnotherYear, registerDays } from "./demo-calendar";
import { STREAM_SPECS, specOf, type CourseRow, type StreamSpec } from "./demo-college-stream-specs";

const DOMAIN = "demo.relay.test";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const CAL = demoCalendar();
const { y: Y, key: K, at: T, iso: TI } = CAL;
const day = (key: string) => new Date(`${key}T00:00:00Z`);
const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const LAB_STREAMS = ["PHARMACY", "AGRICULTURE", "VOCATIONAL", "HEALTH_SCIENCES"] as const;
const CAMPUS_MODULES = ["LIBRARY", "HOSTEL", "TRANSPORT", "PAYROLL"] as const;

/* -------------------------------------------------------------------------- */
/* who is who                                                                  */
/* -------------------------------------------------------------------------- */

export type StaffKey = "registrar" | "principal" | "hodA" | "hodB" | "f1" | "f2" | "f3" | "f4" | "exams" | "iqac" | "tpo" | "accounts" | "librarian" | "warden" | "driver";
export type StaffPerson = { key: StaffKey; email: string; name: string; role: string; title: string; basic: number };

export const mail = (spec: StreamSpec, local: string) => `${spec.prefix}.${local}@${DOMAIN}`;
export const placementOn = (spec: StreamSpec) => STREAM_PRESETS[spec.stream].modulesOn.includes("PLACEMENT");
export const inventoryOn = (spec: StreamSpec) => STREAM_PRESETS[spec.stream].modulesOn.includes("INVENTORY");
export const labStream = (spec: StreamSpec) => (LAB_STREAMS as readonly string[]).includes(spec.stream);
/** The duties this stream offers its teachers: the preset's, which DUTY_BUILT already filters. */
export const dutiesOffered = (spec: StreamSpec): DutyCode[] => STREAM_PRESETS[spec.stream].duties.filter((d) => DUTY_BUILT[d]);
/** Every offered duty on one of the four faculty, in turn: f1 the first, f2 the second… */
export function dutyPlan(spec: StreamSpec): Record<"f1" | "f2" | "f3" | "f4", DutyCode[]> {
  const plan: Record<"f1" | "f2" | "f3" | "f4", DutyCode[]> = { f1: [], f2: [], f3: [], f4: [] };
  const keys = ["f1", "f2", "f3", "f4"] as const;
  dutiesOffered(spec).forEach((d, i) => plan[keys[i % 4]!].push(d));
  return plan;
}
export const dutyHolder = (spec: StreamSpec, duty: DutyCode): "f1" | "f2" | "f3" | "f4" | null => {
  const plan = dutyPlan(spec);
  return (["f1", "f2", "f3", "f4"] as const).find((k) => plan[k].includes(duty)) ?? null;
};

export function staffOf(spec: StreamSpec): StaffPerson[] {
  const [a, b] = spec.depts;
  const short = (name: string) => name.replace(/^Department of /, "");
  const list: StaffPerson[] = [
    { key: "registrar", email: mail(spec, "registrar"), name: spec.staff.registrar, role: "ADMIN", title: "Registrar", basic: 4_400_000 },
    { key: "principal", email: mail(spec, "principal"), name: spec.staff.principal, role: "PRINCIPAL", title: spec.staff.principalTitle, basic: 9_000_000 },
    { key: "hodA", email: mail(spec, `hod.${a.code.toLowerCase()}`), name: a.hod, role: "HOD", title: `Head, ${a.name}`, basic: 7_800_000 },
    { key: "hodB", email: mail(spec, `hod.${b.code.toLowerCase()}`), name: b.hod, role: "HOD", title: `Head, ${b.name}`, basic: 7_600_000 },
    { key: "f1", email: mail(spec, "faculty1"), name: spec.staff.f1, role: "FACULTY", title: `Assistant professor, ${short(a.name)}`, basic: 5_400_000 },
    { key: "f2", email: mail(spec, "faculty2"), name: spec.staff.f2, role: "FACULTY", title: `Assistant professor, ${short(a.name)}`, basic: 5_200_000 },
    { key: "f3", email: mail(spec, "faculty3"), name: spec.staff.f3, role: "FACULTY", title: `Assistant professor, ${short(b.name)}`, basic: 5_300_000 },
    { key: "f4", email: mail(spec, "faculty4"), name: spec.staff.f4, role: "FACULTY", title: `Assistant professor, ${short(b.name)}`, basic: 5_000_000 },
    { key: "exams", email: mail(spec, "exams"), name: spec.staff.exams, role: "EXAM_CONTROLLER", title: "Controller of examinations", basic: 6_400_000 },
    { key: "iqac", email: mail(spec, "iqac"), name: spec.staff.iqac, role: "IQAC", title: "IQAC coordinator", basic: 6_200_000 },
    { key: "tpo", email: mail(spec, "tpo"), name: spec.staff.tpo, role: "TPO", title: "Training and placement officer", basic: 4_300_000 },
    { key: "accounts", email: mail(spec, "accounts"), name: spec.staff.accounts, role: "ACCOUNTS", title: "Accounts officer", basic: 4_000_000 },
    { key: "librarian", email: mail(spec, "librarian"), name: spec.staff.librarian, role: "LIBRARIAN", title: "Librarian", basic: 3_600_000 },
    { key: "warden", email: mail(spec, "warden"), name: spec.staff.warden, role: "WARDEN", title: `Warden, ${spec.hostel.name}`, basic: 3_000_000 },
    { key: "driver", email: mail(spec, "driver"), name: spec.staff.driver, role: "DRIVER", title: "Driver, Route 1", basic: 2_300_000 },
  ];
  return list.filter((p) => p.key !== "tpo" || placementOn(spec));
}

/** n 1–8: 1–3 the first programme's second year, 4–6 the second's, 7–8 the twins in the first programme's first year. */
export type StudentSeat = { n: number; name: string; gender: "M" | "F"; birth: string; category: "OPEN" | "OBC"; prog: 0 | 1; year: 1 | 2; div: "A2" | "B2" | "A1"; minor: boolean };
export function studentsOf(spec: StreamSpec): StudentSeat[] {
  return spec.students.map((s, i) => {
    const n = i + 1;
    const prog = n >= 4 && n <= 6 ? 1 : 0;
    const year = n >= 7 ? 1 : 2;
    return { n, name: s.name, gender: s.gender, birth: s.birth, category: s.category, prog, year, div: year === 1 ? "A1" : prog === 0 ? "A2" : "B2", minor: n >= 7 };
  });
}
export const studentEmail = (spec: StreamSpec, n: number) => mail(spec, `student${pad(n)}`);
export const parentEmail = (spec: StreamSpec) => mail(spec, "parent");
export const alumnusEmail = (spec: StreamSpec) => mail(spec, "alumni01");
export const recruiterEmail = (spec: StreamSpec) => mail(spec, "recruiter");
/** The parent's children: the twins and their elder sibling, student 1, an adult who decides what the parent sees. */
export const CHILDREN = [1, 7, 8];
export const CONSENTS = ["ATTENDANCE", "RESULTS"] as const;
const PAID_ODD = [1, 2, 4, 7];
const SCHOLAR = 3;
const APPLICANTS = [2, 4];
const ATKT_STUDENT = 6;
const SHORT_STUDENT = 5;
const RIDERS = [3, 7, 8];
const LIBRARY_BORROWER = 2;
const NSS_STUDENTS = [1, 2, 4];
const NCC_STUDENTS = [3, 5];

/* -------------------------------------------------------------------------- */
/* actors for the library calls (as demo-transfer.ts does), deleted at the end */
/* -------------------------------------------------------------------------- */

const PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
const sessionIds: string[] = [];
async function actor(userId: string, schoolId: string, role: string, membershipId: string): Promise<ActiveContext> {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, isMinor: true, isSuperuser: true, isAppAdmin: true } });
  const session = await db.session.create({ data: { userId, tokenHash: `zz-walk-${randomBytes(24).toString("hex")}`, activeSchoolId: schoolId, activeRole: role, userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });
  sessionIds.push(session.id);
  return { sessionId: session.id, membershipId, schoolId, role: role as ActiveContext["role"], user: { id: u.id, name: u.name, preferredName: null, email: u.email, avatarKey: null, isMinor: u.isMinor, isSuperuser: u.isSuperuser, isAppAdmin: u.isAppAdmin, prefs: PREFS as unknown as ActiveContext["user"]["prefs"] } };
}

type Member = { id: string; userId: string };
type College = { id: string; name: string; code: string; slug: string };

/* -------------------------------------------------------------------------- */
/* the college, as the operator's onboarding leaves it                         */
/* -------------------------------------------------------------------------- */

async function buildCollege(spec: StreamSpec): Promise<College> {
  const existing = await db.school.findUnique({ where: { slug: spec.slug }, select: { id: true, name: true, code: true, slug: true } });
  const profile = {
    kind: spec.kind,
    streamsJson: JSON.stringify([spec.stream]),
    affiliatingUniversity: spec.university,
    aisheCode: spec.aishe,
    aicteApprovalRef: spec.aicte ? `F.No. Western/1-94${spec.aishe.slice(2)}/${Y(2026)}/EOA, 30 April ${Y(2026)}` : null,
    naacGrade: spec.naacGrade,
    naacValidUntil: day(K("2029-03-31")),
    nirfCategory: spec.nirf,
    // A demo tenant lists like a real customer (B-28): not a test fixture.
    isTestFixture: false,
    subscriptionStatus: "ACTIVE",
    subscriptionStartsAt: day(K("2026-07-01")),
    subscriptionDueAt: day(K("2027-06-30")),
    // The office's own setting (lib/self-read.ts): a college's adult students read their own health card and incidents.
    selfReadAge: 18,
  };
  let college: College;
  if (existing) {
    await db.school.update({ where: { id: existing.id }, data: profile });
    college = existing;
  } else {
    college = await db.school.create({
      data: { name: spec.name, slug: spec.slug, code: schoolCode(spec.name), city: spec.city, region: "Maharashtra", country: "India", contactEmail: mail(spec, "office"), contactPhone: spec.phone, addressLine: spec.address, timezone: "Asia/Kolkata", locale: "en", brandPrimary: spec.brand, verifiedAt: new Date(), onboardingState: JSON.stringify({ createdSchool: true }), ...profile },
      select: { id: true, name: true, code: true, slug: true },
    });
  }
  // The modules createSchool writes for a college of this stream (its preset's modulesOn), skipDuplicates on a re-run.
  await writeDefaultModules(college.id, db as unknown as Parameters<typeof writeDefaultModules>[1], spec.kind, [spec.stream]);
  return college;
}

/* -------------------------------------------------------------------------- */
/* the people                                                                  */
/* -------------------------------------------------------------------------- */

async function buildPeople(ctx: Ctx, spec: StreamSpec, college: College) {
  const staff = {} as Record<StaffKey, Member>;
  for (const p of staffOf(spec)) {
    const user = await upsertUser(ctx, p.email, p.name);
    const m = await upsertMembership(user.id, college.id, p.role, { title: p.title });
    staff[p.key] = { id: m.id, userId: user.id };
  }
  const P = spec.prefix.toUpperCase();
  const students: (StudentSeat & Member)[] = [];
  for (const s of studentsOf(spec)) {
    const birthdate = day(K(s.birth));
    const user = await upsertUser(ctx, studentEmail(spec, s.n), s.name, { birthdate, isMinor: s.minor });
    await db.user.update({ where: { id: user.id }, data: { birthdate, isMinor: s.minor } });
    const m = await upsertMembership(user.id, college.id, "STUDENT", { gradeLevel: String(s.year) });
    const entry = s.year === 2 ? Y(2025) : Y(2026);
    await db.membership.updateMany({ where: { id: m.id, studentCode: null }, data: { studentCode: `${P}-${entry}-${pad(s.n)}` } });
    students.push({ ...s, id: m.id, userId: user.id });
  }
  // The parent of the twins and of their elder sibling (an adult, who decides what the parent sees).
  const parent = await upsertUser(ctx, parentEmail(spec), spec.parent, { phone: `+9198220${spec.aishe.slice(2)}`, phoneVerifiedAt: new Date() });
  for (const n of CHILDREN) await link(parent.id, students.find((s) => s.n === n)!.id, college.id);

  // The alumnus: a closed STUDENT row and the open ALUMNUS row, as a departure leaves them.
  const alumnus = await upsertUser(ctx, alumnusEmail(spec), spec.alumnus.name, { birthdate: day(K("2003-05-20")), isMinor: false });
  const leftAt = T("2025-05-31T06:30:00Z");
  const wasStudent =
    (await db.membership.findUnique({ where: { userId_schoolId_role: { userId: alumnus.id, schoolId: college.id, role: "STUDENT" } }, select: { id: true } })) ??
    (await db.membership.create({ data: { userId: alumnus.id, schoolId: college.id, role: "STUDENT", status: "ACTIVE", gradeLevel: String(spec.depts[0].programme.years), joinedAt: T("2021-08-02T04:00:00Z"), leftAt, studentCode: `${P}-${Y(2021)}-17` }, select: { id: true } }));
  await openAlumnus(db as unknown as Parameters<typeof openAlumnus>[0], alumnus.id, college.id, leftAt);
  const alumnusRow = await db.membership.findUniqueOrThrow({ where: { userId_schoolId_role: { userId: alumnus.id, schoolId: college.id, role: "ALUMNUS" } }, select: { id: true } });
  await db.alumniProfile.upsert({
    where: { membershipId: alumnusRow.id },
    create: { schoolId: college.id, membershipId: alumnusRow.id, userId: alumnus.id, listed: true, listedAt: T("2025-08-01T06:00:00Z"), city: spec.city, occupation: spec.recruiter ? `${spec.recruiter.role}, ${spec.recruiter.company}` : "Working in the trade", mentor: true, mentorAt: T("2025-09-01T06:00:00Z"), mentorByUserId: staff.registrar.userId },
    update: {},
  });

  let recruiterUserId: string | null = null;
  if (spec.recruiter && placementOn(spec)) {
    const r = await upsertUser(ctx, recruiterEmail(spec), spec.recruiter.name);
    await db.recruiterProfile.upsert({ where: { userId: r.id }, create: { userId: r.id, companyName: spec.recruiter.company }, update: { disabledAt: null } });
    recruiterUserId = r.id;
  }
  return { staff, students, parentUserId: parent.id, alumnus: { userId: alumnus.id, studentId: wasStudent.id, alumnusId: alumnusRow.id }, recruiterUserId };
}
type People = Awaited<ReturnType<typeof buildPeople>>;

/** The duties, through the registrar's own function (audited `people.duties.set`, the teacher told). */
async function giveDuties(spec: StreamSpec, college: College, people: People) {
  const registrar = await actor(people.staff.registrar.userId, college.id, "ADMIN", people.staff.registrar.id);
  const plan = dutyPlan(spec);
  for (const key of ["f1", "f2", "f3", "f4"] as const) {
    const done = await setDuties(registrar, people.staff[key].id, plan[key]);
    const want = [...plan[key]].sort().join(",");
    if ([...done.duties].sort().join(",") !== want) throw new Error(`${spec.slug}: ${key}'s duties are ${done.duties.join(",")}, wanted ${want}`);
  }
}

/* -------------------------------------------------------------------------- */
/* academics                                                                   */
/* -------------------------------------------------------------------------- */

type Course = { id: string; code: string; name: string; credits: number; prog: 0 | 1; semester: number; p: number; l: number; t: number };
type Offering = { key: string; code: string; div: "A2" | "B2" | "A1"; id: string; teacher: Member; teacherKey: StaffKey; roster: (StudentSeat & Member)[]; slots: { id: string; weekday: number; bell: number; batchId: string | null }[]; lab: boolean };

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
const RULES = { minPercentPerCourse: 40, atktLimit: 4, totalCredits: 160, internalMax: 40, externalMax: 60, minTermCredits: 12, maxTermCredits: 28 };
/** [division, course index in its semester, teacher]: the first course of each division is the lab course at a lab stream. */
const TEACHING: ["A2" | "B2" | "A1", 0 | 1, StaffKey][] = [["A2", 0, "f1"], ["A2", 1, "hodA"], ["B2", 0, "f3"], ["B2", 1, "hodB"], ["A1", 0, "f2"], ["A1", 1, "f4"]];
const DIV_BELL = { A2: 1, B2: 3, A1: 5 } as const;

export function divisionNames(spec: StreamSpec): Record<"A2" | "B2" | "A1", string> {
  const [a, b] = spec.depts;
  return { A2: `${a.programme.code} year 2 · A`, B2: `${b.programme.code} year 2 · A`, A1: `${a.programme.code} year 1 · A` };
}
export const schemeName = (spec: StreamSpec) => `${spec.prefix.toUpperCase()} ${spec.kind === "AUTONOMOUS_COLLEGE" ? "Autonomous" : "NEP"} 2024`;
export const coursesOf = (spec: StreamSpec, prog: 0 | 1, semester: number): CourseRow[] => spec.depts[prog].programme.courses.filter((c) => c[2] === semester);

async function buildAcademics(spec: StreamSpec, college: College, people: People) {
  const s = college.id;
  const { staff, students } = people;
  const lab = labStream(spec);
  await db.academicsSettings.upsert({ where: { schoolId: s }, create: { schoolId: s, loadMinHours: 14, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 }, update: {} });

  const programmes: { id: string; schemeId: string; deptId: string }[] = [];
  const courses: Record<string, Course> = {};
  for (const [i, d] of spec.depts.entries()) {
    const hod = i === 0 ? staff.hodA : staff.hodB;
    const p = d.programme;
    const dept = await db.department.upsert({ where: { schoolId_code: { schoolId: s, code: d.code } }, create: { schoolId: s, code: d.code, name: d.name, hodMembershipId: hod.id, condoneFloorPercent: 65 }, update: { hodMembershipId: hod.id }, select: { id: true } });
    const programme = await db.programme.upsert({ where: { schoolId_code: { schoolId: s, code: p.code } }, create: { schoolId: s, departmentId: dept.id, code: p.code, name: p.name, level: p.level, durationYears: p.years, intake: p.intake, regulator: p.regulator, stream: spec.stream, attendanceThreshold: 75, exitPoints: "[]" }, update: { stream: spec.stream }, select: { id: true } });
    for (const [k, text] of spec.pos.entries()) await db.programmeOutcome.upsert({ where: { programmeId_code: { programmeId: programme.id, code: `PO${k + 1}` } }, create: { schoolId: s, programmeId: programme.id, code: `PO${k + 1}`, text }, update: {} });
    const scheme = await db.scheme.upsert({ where: { programmeId_name: { programmeId: programme.id, name: schemeName(spec) } }, create: { schoolId: s, programmeId: programme.id, name: schemeName(spec), effectiveYear: 2024, gradingTable: JSON.stringify(GRADES), passingRules: JSON.stringify(RULES) }, update: {}, select: { id: true } });
    programmes.push({ id: programme.id, schemeId: scheme.id, deptId: dept.id });
    for (const [code, name, semester, l, t, pr] of p.courses) {
      const outcomes = [{ code: "CO1", text: `Explain the core ideas of ${name.toLowerCase()}.` }, { code: "CO2", text: `Apply ${name.toLowerCase()} to a real case.` }];
      const row = await db.course.upsert({ where: { schemeId_code: { schemeId: scheme.id, code } }, create: { schoolId: s, schemeId: scheme.id, code, name, semester, creditsL: l, creditsT: t, creditsP: pr, kind: "CORE", outcomes: JSON.stringify(outcomes) }, update: {}, select: { id: true } });
      await db.courseOutcomeMap.createMany({ data: [{ schoolId: s, courseId: row.id, coCode: "CO1", poCode: "PO1", level: 3 }, { schoolId: s, courseId: row.id, coCode: "CO2", poCode: "PO2", level: 2 }], skipDuplicates: true });
      courses[code] = { id: row.id, code, name, credits: (l + t + pr) * 10, prog: i as 0 | 1, semester, p: pr, l, t };
    }
  }
  for (const [key, prog] of [["hodA", 0], ["f1", 0], ["f2", 0], ["hodB", 1], ["f3", 1], ["f4", 1]] as const) {
    await db.departmentFaculty.upsert({ where: { membershipId: staff[key].id }, create: { schoolId: s, membershipId: staff[key].id, departmentId: programmes[prog]!.deptId }, update: {} });
  }
  const current = await db.academicTerm.upsert({ where: { schoolId_name: { schoolId: s, name: CAL.currentTerm.name } }, create: { schoolId: s, ...CAL.currentTerm }, update: {}, select: { id: true } });
  const past = await db.academicTerm.upsert({ where: { schoolId_name: { schoolId: s, name: CAL.pastTerm.name } }, create: { schoolId: s, ...CAL.pastTerm }, update: {}, select: { id: true } });

  const bells: { id: string; startMinute: number; endMinute: number }[] = [];
  for (let k = 0; k < 6; k += 1) {
    const name = `Hour ${k + 1}`;
    const start = 540 + k * 60;
    bells.push((await db.timetablePeriod.findFirst({ where: { schoolId: s, name }, select: { id: true, startMinute: true, endMinute: true } })) ?? (await db.timetablePeriod.create({ data: { schoolId: s, name, startMinute: start, endMinute: start + 50, kind: "LESSON", position: k + 1 }, select: { id: true, startMinute: true, endMinute: true } })));
  }
  const ROOM_OF = { A2: "Room 101", B2: "Room 102", A1: "Room 103" } as const;
  const rooms: Record<string, string> = {};
  const roomRows: [string, number, string][] = [["Room 101", 60, "CLASSROOM"], ["Room 102", 60, "CLASSROOM"], ["Room 103", 60, "CLASSROOM"]];
  if (lab) for (const d of spec.depts) if (d.lab) roomRows.push([d.lab, 24, "LAB"]);
  for (const [name, capacity, kind] of roomRows) rooms[name] = (await db.room.upsert({ where: { schoolId_name: { schoolId: s, name } }, create: { schoolId: s, name, capacity, kind }, update: {}, select: { id: true } })).id;

  const names = divisionNames(spec);
  const divisions: Record<string, { id: string; classId: string }> = {};
  for (const key of ["A2", "B2", "A1"] as const) {
    const prog = key === "B2" ? 1 : 0;
    const year = key === "A1" ? 1 : 2;
    const klass = (await db.class.findFirst({ where: { schoolId: s, name: names[key] }, select: { id: true } })) ?? (await db.class.create({ data: { schoolId: s, name: names[key], gradeLevel: String(year), subject: spec.depts[prog].programme.code, joinCode: classCode() }, select: { id: true } }));
    const division = await db.division.upsert({ where: { classId: klass.id }, create: { schoolId: s, classId: klass.id, programmeId: programmes[prog]!.id, yearOfStudy: year, academicYear: CAL.ay(0) }, update: {}, select: { id: true } });
    divisions[key] = { id: division.id, classId: klass.id };
  }
  const P = spec.prefix.toUpperCase();
  const rollOf = (st: StudentSeat) => students.filter((x) => x.div === st.div).findIndex((x) => x.n === st.n) + 1;
  for (const st of students) {
    const entryYear = st.year === 2 ? Y(2025) : Y(2026);
    const seat = { programmeId: programmes[st.prog]!.id, schemeId: programmes[st.prog]!.schemeId, entryYear, yearOfStudy: st.year, semester: st.year === 2 ? 3 : 1, divisionId: divisions[st.div]!.id, prn: `${P}${entryYear}${pad(st.n, 3)}`, status: "ACTIVE" };
    await db.studentProgramme.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...seat }, update: {} });
    await db.enrollment.upsert({ where: { classId_studentMembershipId: { classId: divisions[st.div]!.classId, studentMembershipId: st.id } }, create: { schoolId: s, classId: divisions[st.div]!.classId, studentMembershipId: st.id, rollNumber: rollOf(st) }, update: {} });
  }

  // Lab batches at a lab stream: A and B in each second-year division (by roll number), A alone in the first year's.
  const batches: Record<string, { A?: string; B?: string }> = {};
  if (lab) {
    for (const key of ["A2", "B2", "A1"] as const) {
      const roster = students.filter((x) => x.div === key).sort((a, b) => rollOf(a) - rollOf(b));
      const bn: ("A" | "B")[] = key === "A1" ? ["A"] : ["A", "B"];
      batches[key] = {};
      for (const name of bn) batches[key]![name] = (await db.labBatch.upsert({ where: { divisionId_name: { divisionId: divisions[key]!.id, name } }, create: { schoolId: s, divisionId: divisions[key]!.id, name, capacity: 20 }, update: {}, select: { id: true } })).id;
      const half = Math.ceil(roster.length / bn.length);
      for (const [i, st] of roster.entries()) {
        const name = bn[Math.min(bn.length - 1, Math.floor(i / half))]!;
        await db.labBatchMember.upsert({ where: { divisionId_studentMembershipId_fromKey: { divisionId: divisions[key]!.id, studentMembershipId: st.id, fromKey: "" } }, create: { schoolId: s, batchId: batches[key]![name]!, divisionId: divisions[key]!.id, studentMembershipId: st.id }, update: {} });
      }
    }
  }
  const batchOf = async (studentId: string) => (await db.labBatchMember.findFirst({ where: { studentMembershipId: studentId, schoolId: s, untilKey: null }, select: { batchId: true } }))?.batchId ?? null;

  // The offerings: two lecture hours a week each (Mon/Wed the first course, Tue/Thu the second) at the division's own
  // bell, and at a lab stream the first course's LAB hour per batch on Friday. No teacher, room or division is double-booked.
  const offerings: Offering[] = [];
  for (const [div, idx, teacherKey] of TEACHING) {
    const prog = div === "B2" ? 1 : 0;
    const semester = div === "A1" ? 1 : 3;
    const [code] = coursesOf(spec, prog, semester)[idx]!;
    const c = courses[code]!;
    const teacher = staff[teacherKey];
    const labRoom = spec.depts[prog].lab;
    const hasLab = lab && c.p > 0 && Boolean(labRoom);
    const data = { facultyMembershipId: teacher.id, lectureHours: c.l, tutorialHours: c.t, practicalHours: c.p * 2, roomId: rooms[ROOM_OF[div]]!, capacity: null };
    const offering = await db.courseOffering.upsert({ where: { termId_courseId_divisionId: { termId: current.id, courseId: c.id, divisionId: divisions[div]!.id } }, create: { schoolId: s, termId: current.id, courseId: c.id, divisionId: divisions[div]!.id, ...data }, update: {}, select: { id: true } });
    const bell = DIV_BELL[div];
    const wanted: [number, number, string, string | null, string | null][] = idx === 0 ? [[1, bell, "LECTURE", null, null], [3, bell, "LECTURE", null, null]] : [[2, bell, "LECTURE", null, null], [4, bell, "LECTURE", null, null]];
    if (hasLab) {
      if (batches[div]?.A) wanted.push([5, bell, "LAB", batches[div]!.A!, rooms[labRoom!]!]);
      if (batches[div]?.B) wanted.push([5, bell + 1, "LAB", batches[div]!.B!, rooms[labRoom!]!]);
    }
    const slots: Offering["slots"] = [];
    for (const [weekday, b, kind, labBatchId, roomId] of wanted) {
      const slot = await db.offeringSlot.upsert({ where: { offeringId_weekday_periodId: { offeringId: offering.id, weekday, periodId: bells[b - 1]!.id } }, create: { schoolId: s, offeringId: offering.id, weekday, periodId: bells[b - 1]!.id, kind, labBatchId, roomId }, update: {}, select: { id: true } });
      slots.push({ id: slot.id, weekday, bell: b, batchId: labBatchId });
    }
    const roster = students.filter((st) => st.div === div);
    for (const st of roster) {
      await db.courseRegistration.upsert({ where: { offeringId_studentMembershipId: { offeringId: offering.id, studentMembershipId: st.id } }, create: { schoolId: s, studentMembershipId: st.id, offeringId: offering.id, termId: current.id, kind: "CORE", byUserId: staff.registrar.userId, registeredAt: T("2026-07-05T05:00:00Z") }, update: {} });
    }
    offerings.push({ key: `${code}|${div}`, code, div, id: offering.id, teacher, teacherKey, roster, slots, lab: hasLab });
  }

  // The registers: every slot on every register day. Most miss one hour in eleven; student 5 misses every third
  // lecture of the second programme's first course (under 75 %).
  const days = registerDays(CAL);
  const labDays: Record<string, string[]> = {};
  for (const o of offerings) {
    let index = 0;
    for (const dateKey of days) {
      for (const slot of o.slots.filter((x) => x.weekday === day(dateKey).getUTCDay())) {
        index += 1;
        const bell = bells[slot.bell - 1]!;
        const isLab = slot.batchId !== null;
        const lecture = await db.lecture.upsert({
          where: { offeringId_dateKey_slotId: { offeringId: o.id, dateKey, slotId: slot.id } },
          create: { schoolId: s, offeringId: o.id, slotId: slot.id, dateKey, startMinute: bell.startMinute, endMinute: bell.endMinute, kind: isLab ? "LAB" : "LECTURE", labBatchId: slot.batchId },
          update: {},
          select: { id: true },
        });
        if (isLab) labDays[`${o.key}|${slot.batchId}`] = [...(labDays[`${o.key}|${slot.batchId}`] ?? []), dateKey];
        for (const [k, st] of o.roster.entries()) {
          if (isLab && (await batchOf(st.id)) !== slot.batchId) continue;
          const absent = o.div === "B2" && o === offerings.find((x) => x.div === "B2") && st.n === SHORT_STUDENT ? index % 3 === 0 : (st.n * 7 + index * 3) % 11 === 0;
          await db.lectureAttendance.upsert({
            where: { lectureId_studentMembershipId: { lectureId: lecture.id, studentMembershipId: st.id } },
            create: { schoolId: s, lectureId: lecture.id, studentMembershipId: st.id, status: absent ? "ABSENT" : "PRESENT", markedByMembershipId: o.teacher.id, markedAt: new Date(`${dateKey}T${pad(3 + slot.bell)}:${k % 2 ? "35" : "40"}:00Z`) },
            update: {},
          });
        }
      }
    }
  }

  // The practical record (lab streams): experiment 1 for every lab student on their batch's first LAB day, signed by
  // the lab in-charge; the first second-year lab course's experiment 2 waiting for a signature (the lab desk's queue).
  const inCharge = dutyHolder(spec, "LAB_INCHARGE");
  for (const o of offerings.filter((x) => x.lab)) {
    const experiments = o.div === "A2" ? [1, 2] : [1];
    const titles = spec.experiments[o.code] ?? [`${o.code} experiment 1`, `${o.code} experiment 2`];
    for (const exp of experiments) {
      for (const [k, st] of o.roster.entries()) {
        const batchId = await batchOf(st.id);
        const labDates = labDays[`${o.key}|${batchId}`] ?? [];
        const performedOn = labDates[exp - 1] ?? CAL.registerFrom;
        const signed = exp === 1 && inCharge ? { signedByMembershipId: staff[inCharge].id, signedAt: new Date(`${performedOn}T11:30:00Z`) } : {};
        await db.practicalRecord.upsert({
          where: { offeringId_studentMembershipId_experimentNo: { offeringId: o.id, studentMembershipId: st.id, experimentNo: exp } },
          create: { schoolId: s, offeringId: o.id, studentMembershipId: st.id, experimentNo: exp, title: titles[exp - 1]!, performedOn, marks: 6 + ((st.n * 3 + k + exp) % 5), createdByUserId: o.teacher.userId, ...signed },
          update: {},
        });
      }
    }
  }

  // Internal marks: the first programme's second-year first course entered, countersigned by its head and locked;
  // the second programme's second-year first course's unit test entered, waiting for a countersign.
  const internal: [Offering, Member, boolean][] = [[offerings.find((o) => o.div === "A2")!, staff.hodA, true], [offerings.find((o) => o.div === "B2")!, staff.hodB, false]];
  for (const [o, signer, lock] of internal) {
    const at = T("2026-09-30T10:00:00Z");
    const parts = lock
      ? [{ name: "Unit test 1", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: '["CO1"]', position: 0, mark: (k: number) => 120 + ((k * 23) % 80) }, { name: "Assignment", kind: "ASSIGNMENT", maxMarks: 10, weight: 20, coCodes: '["CO2"]', position: 1, mark: (k: number) => 65 + ((k * 13) % 35) }]
      : [{ name: "Unit test 1", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: '["CO1"]', position: 0, mark: (k: number) => 100 + ((k * 31) % 95) }];
    for (const c of parts) {
      const signed = lock ? { moderatedByUserId: signer.userId, moderatedAt: at, releasedByUserId: signer.userId, releasedAt: at } : {};
      const component = await db.internalComponent.upsert({ where: { offeringId_name: { offeringId: o.id, name: c.name } }, create: { schoolId: s, offeringId: o.id, name: c.name, kind: c.kind, maxMarks: c.maxMarks, weight: c.weight, coCodes: c.coCodes, position: c.position, ...signed }, update: {}, select: { id: true } });
      for (const [k, st] of o.roster.entries()) {
        await db.internalMark.upsert({ where: { componentId_studentMembershipId: { componentId: component.id, studentMembershipId: st.id } }, create: { schoolId: s, componentId: component.id, studentMembershipId: st.id, marksTenths: c.mark(k + st.n), enteredByUserId: o.teacher.userId, ...(lock ? { moderatedByUserId: signer.userId, moderatedAt: at } : {}) }, update: {} });
      }
    }
    if (!lock) continue;
    const components = await db.internalComponent.findMany({ where: { offeringId: o.id }, select: { id: true, maxMarks: true, weight: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } });
    const totals = lockTotals(components, o.roster.map((st) => st.id));
    await db.internalLock.upsert({ where: { offeringId: o.id }, create: { schoolId: s, offeringId: o.id, termId: current.id, outOf: RULES.internalMax, totalsJson: JSON.stringify(totals), lockedByUserId: signer.userId, lockedAt: T("2026-10-01T10:00:00Z") }, update: {} });
  }
  return { programmes, courses, currentTermId: current.id, pastTermId: past.id, offerings, rooms };
}
type Academics = Awaited<ReturnType<typeof buildAcademics>>;

/* -------------------------------------------------------------------------- */
/* the office: years, fees, a scholarship, admission records                   */
/* -------------------------------------------------------------------------- */

async function buildOffice(spec: StreamSpec, college: College, people: People, academics: Academics) {
  const s = college.id;
  const { staff, students } = people;
  const P = spec.prefix.toUpperCase();
  const yearRow = async (name: string, from: string, to: string, data: { isCurrent: boolean; closedAt: Date | null }) =>
    (await db.academicYear.findUnique({ where: { schoolId_name: { schoolId: s, name } }, select: { id: true, name: true } })) ??
    (await db.academicYear.create({ data: { schoolId: s, name, startDate: day(from), endDate: day(to), ...data }, select: { id: true, name: true } }));
  await yearRow(CAL.ay(-1), K("2025-06-01"), K("2026-05-31"), { isCurrent: false, closedAt: T("2026-06-01T00:00:00Z") });
  const year = await yearRow(CAL.ay(0), K("2026-06-01"), K("2027-05-31"), { isCurrent: true, closedAt: null });

  const lab = labStream(spec);
  const head: Record<string, string> = {};
  const HEADS: [string, string, string, number][] = [["TUI", "Tuition", "TUITION", 1], ["DEV", "Development", "DEVELOPMENT", 2], ["EXM", "Examination", "EXAM", 3], ["CAU", "Caution deposit", "CAUTION_DEPOSIT", 5]];
  if (lab) HEADS.push(["LAB", "Laboratory", "LABORATORY", 4]);
  for (const [code, name, kind, sortOrder] of HEADS) head[code] = (await db.feeHead.upsert({ where: { schoolId_code: { schoolId: s, code } }, create: { schoolId: s, code, name, kind, sortOrder }, update: {}, select: { id: true } })).id;
  const linesOf = (prog: 0 | 1, category: "OPEN" | "OBC", first: boolean): [string, number][] => {
    const tuition = spec.tuition[prog];
    const lines: [string, number][] = [["TUI", category === "OBC" ? tuition / 2 : tuition], ["DEV", 1_200_000], ["EXM", 300_000]];
    if (lab) lines.push(["LAB", 400_000]);
    if (first) lines.push(["CAU", 500_000]);
    return lines;
  };
  // The year's fee per programme, year and category (an OBC student's tuition half, the state reimbursing the rest).
  const STRUCTURES: { prog: 0 | 1; year: 1 | 2; category: "OPEN" | "OBC" }[] = [{ prog: 0, year: 2, category: "OPEN" }, { prog: 0, year: 2, category: "OBC" }, { prog: 1, year: 2, category: "OPEN" }, { prog: 1, year: 2, category: "OBC" }, { prog: 0, year: 1, category: "OPEN" }];
  const structureOf: Record<string, string> = {};
  for (const st of STRUCTURES) {
    const p = spec.depts[st.prog].programme;
    const name = `${p.name} · year ${st.year} · ${st.category}`;
    const lines = linesOf(st.prog, st.category, st.year === 1);
    const found = await db.feeStructure.findFirst({ where: { schoolId: s, academicYearId: year.id, name }, select: { id: true } });
    const made =
      found ??
      (await db.feeStructure.create({
        data: {
          schoolId: s, academicYearId: year.id, name, publishedAt: T("2026-06-10T06:00:00Z"), programmeId: academics.programmes[st.prog]!.id, yearOfStudy: st.year, category: st.category,
          approvalRef: `FRA/${CAL.ayHyphen(0)}/${P}/${p.code}/${st.year}/${st.category}`, lateFeeSlabsJson: JSON.stringify([{ afterDays: 15, paise: 100_000 }, { afterDays: 30, paise: 200_000 }]),
          instalments: {
            create: [
              { schoolId: s, label: "Odd semester", sortOrder: 0, dueDate: day(K("2026-07-15")), lines: { create: lines.map(([c, pa]) => ({ schoolId: s, headId: head[c]!, amountPaise: c === "CAU" ? pa : Math.round(pa / 2) })) } },
              { schoolId: s, label: "Even semester", sortOrder: 1, dueDate: day(K("2026-12-15")), lines: { create: lines.filter(([c]) => c !== "CAU").map(([c, pa]) => ({ schoolId: s, headId: head[c]!, amountPaise: Math.round(pa / 2) })) } },
            ],
          },
        },
        select: { id: true },
      }));
    structureOf[`${st.prog}-${st.year}-${st.category}`] = made.id;
  }

  for (const st of students) {
    const programmeId = academics.programmes[st.prog]!.id;
    const entry = st.year === 2 ? Y(2025) : Y(2026);
    await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: st.id, programmeId } }, create: { schoolId: s, studentMembershipId: st.id, programmeId, yearOfEntry: entry, category: st.category, quota: "CAP" }, update: {} });
    const record = { prn: `${P}${entry}${pad(st.n, 3)}`, admissionCategory: st.category, admissionQuota: "CAP", yearOfEntry: entry, admissionNumber: `${entry}/${P}${pad(st.n, 4)}`, admissionDate: day(`${entry}-08-05`), gender: st.gender, annualIncome: st.category === "OBC" ? 180_000 : 900_000, city: spec.city };
    await db.pupilRecord.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...record }, update: {} });
    const structureId = structureOf[`${st.prog}-${st.year}-${st.year === 1 ? "OPEN" : st.category}`]!;
    await db.studentFeePlan.upsert({ where: { studentMembershipId_academicYearId: { studentMembershipId: st.id, academicYearId: year.id } }, create: { schoolId: s, studentMembershipId: st.id, structureId, academicYearId: year.id }, update: {} });
    const instalments = await db.feeInstalment.findMany({ where: { structureId }, orderBy: { sortOrder: "asc" }, include: { lines: { include: { head: { select: { code: true, name: true } } } } } });
    for (const inst of instalments) {
      const lines = inst.lines.map((l) => ({ headId: l.headId, code: l.head.code, name: l.head.name, grossPaise: l.amountPaise, concessionPaise: 0 }));
      const gross = lines.reduce((a, l) => a + l.grossPaise, 0);
      await db.feeDemand.upsert({ where: { studentMembershipId_instalmentId: { studentMembershipId: st.id, instalmentId: inst.id } }, create: { schoolId: s, studentMembershipId: st.id, academicYearId: year.id, instalmentId: inst.id, label: inst.label, dueDate: inst.dueDate, grossPaise: gross, netPaise: gross, linesJson: JSON.stringify(lines) }, update: {} });
    }
    if (!PAID_ODD.includes(st.n)) continue;
    const clientId = `demo-${spec.prefix}-odd-${pad(st.n)}`;
    if (await db.feePayment.findUnique({ where: { schoolId_clientId: { schoolId: s, clientId } }, select: { id: true } })) continue;
    const odd = await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: st.id, academicYearId: year.id }, orderBy: { dueDate: "asc" } });
    const reference = `UTR2026072${spec.aishe.slice(-2)}${pad(st.n, 2)}`;
    const y = await db.academicYear.update({ where: { id: year.id }, data: { feeReceiptNext: { increment: 1 } }, select: { feeReceiptNext: true } });
    const number = y.feeReceiptNext - 1;
    const paidAt = T(`2026-07-${pad(2 + st.n)}T06:00:00Z`);
    const payment = await db.feePayment.create({ data: { schoolId: s, studentMembershipId: st.id, amountPaise: odd.netPaise, method: "BANK", status: "PAID", clientId, reference, collectedByUserId: staff.accounts.userId, paidAt, intentJson: JSON.stringify([odd.id]) }, select: { id: true } });
    await db.feeAllocation.create({ data: { schoolId: s, paymentId: payment.id, demandId: odd.id, amountPaise: odd.netPaise } });
    await db.feeReceipt.create({ data: { schoolId: s, paymentId: payment.id, academicYearId: year.id, number, serial: `RCPT/${year.name}/${pad(number, 6)}`, issuedAt: paidAt, snapshotJson: JSON.stringify({ school: college.name, pupil: st.name, lines: [{ label: odd.label, amountPaise: odd.netPaise }], method: "BANK", reference }) } });
    await db.feeDemand.update({ where: { id: odd.id }, data: { paidPaise: odd.netPaise, status: "PAID" } });
  }

  // The OBC student's post-matric claim, sanctioned on MahaDBT: the state's half of the tuition.
  const scholar = students.find((x) => x.n === SCHOLAR)!;
  const half = spec.tuition[scholar.prog] / 2;
  await db.scholarshipClaim.upsert({
    where: { studentMembershipId_scheme_academicYear: { studentMembershipId: scholar.id, scheme: "OBC_POST_MATRIC", academicYear: CAL.ayHyphen(0) } },
    create: { schoolId: s, studentMembershipId: scholar.id, scheme: "OBC_POST_MATRIC", academicYear: CAL.ayHyphen(0), portalApplicationId: `MDBT2026${P}00${spec.aishe.slice(-3)}`, appliedAt: day(K("2026-08-04")), expectedPaise: half, sanctionedPaise: half, sanctionedAt: day(K("2026-09-21")), status: "SANCTIONED", createdByUserId: staff.accounts.userId },
    update: {},
  });
  await db.programmeEnrolment.upsert({ where: { studentMembershipId_programmeId: { studentMembershipId: people.alumnus.studentId, programmeId: academics.programmes[0]!.id } }, create: { schoolId: s, studentMembershipId: people.alumnus.studentId, programmeId: academics.programmes[0]!.id, yearOfEntry: Y(2021), category: "OPEN", quota: "CAP", status: "COMPLETED" }, update: {} });
  return { yearId: year.id, examHeadId: head.EXM! };
}

/* -------------------------------------------------------------------------- */
/* the exam cell                                                               */
/* -------------------------------------------------------------------------- */

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

async function buildExams(spec: StreamSpec, college: College, people: People, academics: Academics, examHeadId: string) {
  const s = college.id;
  const P = spec.prefix.toUpperCase();
  const ctrl = people.staff.exams;
  const autonomous = spec.kind === "AUTONOMOUS_COLLEGE";
  const sitters = people.students.filter((st) => st.year === 2);
  const courseList = (prog: 0 | 1, semester: number) => Object.values(academics.courses).filter((c) => c.prog === prog && c.semester === semester);

  /* ---- last term: its sitting, marks imported (affiliated) or entered twice (autonomous), published, grade cards */
  const name = `Summer ${Y(2026)} (even term ${CAL.ay(-1)})`;
  const session = await db.examSession.upsert({
    where: { schoolId_name: { schoolId: s, name } },
    create: { schoolId: s, name, kind: "REGULAR", termId: academics.pastTermId, formOpensAt: T("2026-03-01T04:00:00Z"), formClosesAt: T("2026-03-20T18:00:00Z"), feePerCoursePaise: 40_000, feePerBacklogPaise: 50_000, photocopyFeePaise: 20_000, revalFeePaise: 50_000, feeHeadId: examHeadId, status: "PUBLISHED", createdByUserId: ctrl.userId },
    update: {},
    select: { id: true },
  });
  const pastSchedules: string[] = [];
  for (const [i, c] of [...courseList(0, 2), ...courseList(1, 2)].entries()) {
    const sch = await db.examSchedule.upsert({ where: { sessionId_courseId: { sessionId: session.id, courseId: c.id } }, create: { schoolId: s, sessionId: session.id, courseId: c.id, courseCode: c.code, courseName: c.name, at: new Date(Date.UTC(Y(2026), 3, 20 + i, 4, 30)), durationMin: 180 }, update: {}, select: { id: true } });
    await db.examRoom.upsert({ where: { scheduleId_name: { scheduleId: sch.id, name: "Main Hall" } }, create: { schoolId: s, sessionId: session.id, scheduleId: sch.id, name: "Main Hall", capacity: 60 }, update: {} });
    pastSchedules.push(sch.id);
  }
  for (const [k, st] of sitters.entries()) {
    const mine = courseList(st.prog, 2);
    const form = await db.examForm.upsert({
      where: { sessionId_studentMembershipId: { sessionId: session.id, studentMembershipId: st.id } },
      create: { schoolId: s, sessionId: session.id, studentMembershipId: st.id, coursesJson: JSON.stringify(mine.map((c) => ({ courseId: c.id, kind: "REGULAR" }))), eligibilityJson: JSON.stringify({ eligible: true, courses: [], noDues: [] }), eligible: true, noDues: true, feePaise: mine.length * 40_000, status: "APPROVED", submittedAt: T("2026-03-06T06:00:00Z"), decidedAt: T("2026-03-07T06:00:00Z"), decidedByUserId: ctrl.userId, lockedAt: T("2026-04-01T06:00:00Z") },
      update: {},
      select: { id: true },
    });
    await db.hallTicket.upsert({ where: { formId: form.id }, create: { schoolId: s, sessionId: session.id, formId: form.id, studentMembershipId: st.id, number: `HT${pad(k + 1, 4)}`, code: `${P}HT26S${pad(k + 1, 4)}`, issuedByUserId: ctrl.userId, issuedAt: T("2026-04-10T06:00:00Z") }, update: {} });
  }
  const scheme = await db.scheme.findUniqueOrThrow({ where: { id: academics.programmes[0]!.schemeId }, select: { gradingTable: true, passingRules: true } });
  const rules = rulesOf(scheme.passingRules);
  const table = gradingTableOf(scheme.gradingTable);
  // Student 6 falls short in the first course's external (an ATKT and a backlog).
  const marksOf = (k: number, j: number, st: StudentSeat): [number, number] => [25 + ((k * 5 + j * 3) % 14), st.n === ATKT_STUDENT && j === 0 ? 17 : 31 + ((k * 7 + j * 5) % 26)];
  const computed = [];
  for (const [k, st] of sitters.entries()) {
    const rows = [];
    for (const [j, c] of courseList(st.prog, 2).entries()) {
      const [internal, external] = marksOf(k, j, st);
      const entry = autonomous
        ? { source: "DOUBLE_ENTRY", entry1Milli: external * 1000, entry1ByUserId: ctrl.userId, entry1At: T("2026-05-12T06:00:00Z"), entry2Milli: external * 1000, entry2ByUserId: people.staff.registrar.userId, entry2At: T("2026-05-13T06:00:00Z") }
        : { source: "IMPORT" };
      await db.examMark.upsert({
        where: { sessionId_courseId_studentMembershipId_version: { sessionId: session.id, courseId: c.id, studentMembershipId: st.id, version: 1 } },
        create: { schoolId: s, sessionId: session.id, courseId: c.id, studentMembershipId: st.id, internalMilli: internal * 1000, externalMilli: external * 1000, matched: true, version: 1, enteredByUserId: ctrl.userId, ...entry },
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
  const PUBLISHED_AT = T("2026-05-25T06:30:00Z");
  const summary = { students: computed.length, passed: computed.filter((c) => c.status === "PASS").length, atkt: computed.filter((c) => c.status === "ATKT").length, failed: computed.filter((c) => c.status === "FAIL").length };
  const run = await db.resultRun.upsert({ where: { sessionId_number: { sessionId: session.id, number: 1 } }, create: { schoolId: s, sessionId: session.id, number: 1, status: "PUBLISHED", computedAt: PUBLISHED_AT, computedByUserId: ctrl.userId, publishedAt: PUBLISHED_AT, publishedByUserId: ctrl.userId, summaryJson: JSON.stringify(summary) }, update: {}, select: { id: true } });
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
        college: { name: college.name, university: spec.university, autonomous },
        student: { name: c.st.name, code: `${P}-${Y(2025)}-${pad(c.st.n)}`, prn: `${P}${Y(2025)}${pad(c.st.n, 3)}`, programme: spec.depts[c.st.prog].programme.name },
        terms: [{ sessionName: name, publishedOn: PUBLISHED_AT.toISOString().slice(0, 10), sgpa: sgpaNumber(c.sgpa), credits: tenths(c.earned), status: c.status, cls: c.cls, courses: c.rows.map((r) => ({ code: r.code, name: r.name, credits: tenths(r.creditsTenths), grade: r.grade, points: r.pointsTenths / 10, status: r.status })).sort((a, b) => a.code.localeCompare(b.code)) }],
        cgpa: sgpaNumber(c.sgpa),
        creditsEarned: tenths(c.earned),
        cls: c.status === "PASS" ? classFor(c.sgpa, rules.classBands) : null,
        yearOfPassing: null,
      };
      const last = await db.examDocument.findFirst({ where: { schoolId: s, kind: "GRADE_CARD", yearLabel: CAL.ay(-1) }, orderBy: { number: "desc" }, select: { number: true } });
      const number = (last?.number ?? 0) + 1;
      await db.examDocument.create({ data: { schoolId: s, studentMembershipId: c.st.id, kind: "GRADE_CARD", sessionId: session.id, runId: run.id, yearLabel: CAL.ay(-1), number, serial: `GC/${CAL.ay(-1)}/${pad(number, 4)}`, code: checkCode(randomBytes(10)), studentName: c.st.name, dataJson: JSON.stringify(data), issuedByUserId: ctrl.userId, issuedAt: new Date(PUBLISHED_AT.getTime() + (i + 1) * 60_000 + 2 * 86_400_000) } });
    }
  }

  /* ---- this term: Winter, in CONDUCT */
  const wname = `Winter ${Y(2026)} (odd term ${CAL.ay(0)})`;
  const winter = await db.examSession.upsert({
    where: { schoolId_name: { schoolId: s, name: wname } },
    create: { schoolId: s, name: wname, kind: "REGULAR", termId: academics.currentTermId, formOpensAt: T("2026-09-01T04:00:00Z"), formClosesAt: T("2026-09-20T18:00:00Z"), feePerCoursePaise: 40_000, feePerBacklogPaise: 50_000, photocopyFeePaise: 20_000, revalFeePaise: 50_000, feeHeadId: examHeadId, status: "CONDUCT", createdByUserId: ctrl.userId },
    update: { status: "CONDUCT" },
    select: { id: true },
  });
  const papers = [...courseList(0, 3), ...courseList(1, 3), ...courseList(0, 1)];
  const schedules: Record<string, string> = {};
  for (const [i, c] of papers.entries()) {
    schedules[c.code] = (await db.examSchedule.upsert({ where: { sessionId_courseId: { sessionId: winter.id, courseId: c.id } }, create: { schoolId: s, sessionId: winter.id, courseId: c.id, courseCode: c.code, courseName: c.name, at: new Date(Date.UTC(Y(2026), 10, 16 + i, 4, 30)), durationMin: 180 }, update: {}, select: { id: true } })).id;
    await db.examRoom.upsert({ where: { scheduleId_name: { scheduleId: schedules[c.code]!, name: "Main Hall" } }, create: { schoolId: s, sessionId: winter.id, scheduleId: schedules[c.code]!, name: "Main Hall", capacity: 60 }, update: {} });
  }
  for (const [k, st] of people.students.entries()) {
    const mine = courseList(st.prog, st.year === 2 ? 3 : 1);
    const form = await db.examForm.upsert({
      where: { sessionId_studentMembershipId: { sessionId: winter.id, studentMembershipId: st.id } },
      create: { schoolId: s, sessionId: winter.id, studentMembershipId: st.id, coursesJson: JSON.stringify(mine.map((c) => ({ courseId: c.id, kind: "REGULAR" }))), eligibilityJson: JSON.stringify({ eligible: true, courses: [], noDues: [] }), eligible: true, noDues: true, feePaise: mine.length * 40_000, status: "APPROVED", submittedAt: T("2026-09-08T06:00:00Z"), decidedAt: T("2026-09-10T06:00:00Z"), decidedByUserId: ctrl.userId, lockedAt: T("2026-09-25T06:00:00Z") },
      update: {},
      select: { id: true },
    });
    await db.hallTicket.upsert({ where: { formId: form.id }, create: { schoolId: s, sessionId: winter.id, formId: form.id, studentMembershipId: st.id, number: `HT${pad(k + 1, 4)}`, code: `${P}HT26W${pad(k + 1, 4)}`, issuedByUserId: ctrl.userId, issuedAt: T("2026-10-01T06:00:00Z") }, update: {} });
  }
  // An autonomous college sets its own papers: the first second-year course's set by its teacher and SEALED, the
  // second programme's assigned to its setter, not yet set.
  let sealed = 0;
  if (autonomous) {
    const a = academics.offerings.find((o) => o.div === "A2")!;
    const b = academics.offerings.find((o) => o.div === "B2")!;
    const setA = await db.questionPaper.upsert({ where: { scheduleId_setterMembershipId: { scheduleId: schedules[a.code]!, setterMembershipId: a.teacher.id } }, create: { schoolId: s, sessionId: winter.id, scheduleId: schedules[a.code]!, setterMembershipId: a.teacher.id, assignedByUserId: ctrl.userId }, update: {}, select: { id: true, sealedBody: true } });
    if (!setA.sealedBody) {
      const pdf = paperPdf(`${a.code} ${academics.courses[a.code]!.name}, Winter ${Y(2026)}: Q1 (CO1, 10 marks).`);
      const { seal } = await import("../src/lib/secret-box");
      const sealedBody = seal(pdf.toString("base64"), `${s}|QuestionPaper|${setA.id}`);
      await db.questionPaper.update({ where: { id: setA.id }, data: { status: "SUBMITTED", sealedBody, fileName: `${a.code.toLowerCase()}-winter-${Y(2026)}.pdf`, mime: "application/pdf", sizeBytes: pdf.length, sha256: createHash("sha256").update(pdf).digest("hex"), coMapJson: JSON.stringify([{ question: "Q1", co: "CO1", marks: 10 }, { question: "Q2", co: "CO2", marks: 15 }]), submittedAt: T("2026-10-02T09:00:00Z") } });
    }
    await db.questionPaper.upsert({ where: { scheduleId_setterMembershipId: { scheduleId: schedules[b.code]!, setterMembershipId: b.teacher.id } }, create: { schoolId: s, sessionId: winter.id, scheduleId: schedules[b.code]!, setterMembershipId: b.teacher.id, assignedByUserId: ctrl.userId }, update: {} });
    sealed = await db.questionPaper.count({ where: { schoolId: s, sealedBody: { not: null } } });
  }

  // The flying squad's visit to last term's first paper's hall, logged by the member holding EXAM_SQUAD.
  const squad = dutyHolder(spec, "EXAM_SQUAD");
  if (squad && pastSchedules[0]) {
    const sch = await db.examSchedule.findUniqueOrThrow({ where: { id: pastSchedules[0] }, select: { id: true, at: true, rooms: { select: { id: true } } } });
    const by = people.staff[squad];
    if (!(await db.examSquadVisit.findFirst({ where: { schoolId: s, scheduleId: sch.id, byMembershipId: by.id }, select: { id: true } }))) {
      await db.examSquadVisit.create({ data: { schoolId: s, scheduleId: sch.id, examRoomId: sch.rooms[0]?.id ?? null, at: new Date(sch.at.getTime() + 75 * 60_000), byMembershipId: by.id, members: `${spec.staff[squad]}, ${spec.staff.exams}`, flagged: false, note: "Every candidate seated by the hall ticket's number; no material found." } });
    }
  }
  return { sessionId: session.id, conductSessionId: winter.id, sealed, sgpa: Object.fromEntries(computed.map((c) => [c.st.n, c.sgpa])) as Record<number, number | null> };
}

/* -------------------------------------------------------------------------- */
/* placement, the internships and the stream's own records                     */
/* -------------------------------------------------------------------------- */

async function buildPlacement(spec: StreamSpec, college: College, people: People, academics: Academics, sgpa: Record<number, number | null>) {
  if (!spec.recruiter || !placementOn(spec) || !people.recruiterUserId) return { companyId: null as string | null };
  const s = college.id;
  const { staff, students } = people;
  const R = spec.recruiter;
  await db.schoolModule.updateMany({ where: { schoolId: s, module: "PLACEMENT" }, data: { settingsJson: JSON.stringify({ seasonBatchYear: seasonBatchFor(CAL.today), dreamRatio: 1.5, allowGenderRule: false }) } });
  const identifier = `${R.pan14}${gstinCheckChar(R.pan14)}`;
  const company = await db.company.upsert({
    where: { identifier },
    create: { name: R.company, identifier, sectors: JSON.stringify([R.sector]), pointOfContact: `${R.name}, ${recruiterEmail(spec)}`, createdByUserId: people.recruiterUserId, verifiedAt: T("2026-08-24T06:00:00Z"), verifiedByUserId: staff.tpo.userId },
    update: {},
    select: { id: true },
  });
  await db.companyRecruiter.upsert({ where: { companyId_userId: { companyId: company.id, userId: people.recruiterUserId } }, create: { companyId: company.id, userId: people.recruiterUserId, acceptedAt: new Date() }, update: { removedAt: null } });
  await db.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId: s, companyId: company.id } }, create: { schoolId: s, companyId: company.id, firstVisitYear: Y(2024) }, update: {} });

  const rule = { cgpaMin: 6, noLiveBacklogs: true, programmeIds: academics.programmes.map((p) => p.id), batchYear: null, genders: [] };
  const rounds = [{ n: 1, kind: "APTITUDE", note: "", at: TI("2026-10-22T05:00:00.000Z") }, { n: 2, kind: "HR_INTERVIEW", note: "", at: null }];
  const requirement =
    (await db.requirement.findFirst({ where: { companyId: company.id, role: R.role }, select: { id: true } })) ??
    (await db.requirement.create({ data: { companyId: company.id, byUserId: people.recruiterUserId, role: R.role, packageRupees: R.packageRupees, locations: spec.city, eligibilityAsked: JSON.stringify(rule), rounds: JSON.stringify(rounds.map((r) => ({ kind: r.kind, note: "" }))), datesProposed: "Fourth week of October", targetSchoolIds: JSON.stringify([s]) }, select: { id: true } }));
  const openTitle = `${R.role} ${Y(2027)}`;
  const open =
    (await db.drive.findFirst({ where: { schoolId: s, title: openTitle }, select: { id: true } })) ??
    (await db.drive.create({ data: { schoolId: s, companyId: company.id, requirementId: requirement.id, kind: "ON_CAMPUS", title: openTitle, jd: R.jd, packageMinRupees: Math.round(R.packageRupees * 0.9), packageMaxRupees: R.packageRupees, rounds: JSON.stringify(rounds), schedule: JSON.stringify([{ label: "Pre-placement talk", at: TI("2026-10-14T05:30:00.000Z") }]), venues: "Seminar hall", eligibilityRule: JSON.stringify(rule), status: "OPEN", invitedAt: T("2026-09-29T06:00:00Z"), createdByUserId: staff.tpo.userId }, select: { id: true } }));
  for (const n of APPLICANTS) {
    const st = students.find((x) => x.n === n)!;
    const record = { cgpa: sgpa[n] === null || sgpa[n] === undefined ? null : sgpa[n]! / 100, liveBacklogs: 0, attendancePct: 90, programmeId: academics.programmes[st.prog]!.id, programmeName: spec.depts[st.prog].programme.name, batchYear: Y(2027), gender: st.gender, category: st.category };
    await db.driveApplication.upsert({ where: { driveId_studentMembershipId: { driveId: open.id, studentMembershipId: st.id } }, create: { schoolId: s, driveId: open.id, studentMembershipId: st.id, studentUserId: st.userId, schoolName: college.name, appliedAt: T("2026-10-02T09:00:00Z"), consentAt: T("2026-10-02T09:00:00Z"), recordJson: JSON.stringify(record) }, update: {} });
    await db.placementProfile.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, skills: JSON.stringify(["Excel", "Presentation", "Report writing"]), certifications: JSON.stringify([]), projects: JSON.stringify([{ title: `${spec.depts[st.prog].programme.code} field project`, note: "" }]), consentAt: T("2026-10-02T09:00:00Z") }, update: {} });
  }
  // Last season: the alumnus through the closed drive with an accepted offer, and the season's row from the table.
  const closedTitle = `${R.role} ${Y(2025)}`;
  const closed =
    (await db.drive.findFirst({ where: { schoolId: s, title: closedTitle }, select: { id: true } })) ??
    (await db.drive.create({ data: { schoolId: s, companyId: company.id, kind: "ON_CAMPUS", title: closedTitle, packageMinRupees: Math.round(R.packageRupees * 0.9), packageMaxRupees: Math.round(R.packageRupees * 0.9), rounds: JSON.stringify([{ n: 1, kind: "HR_INTERVIEW", note: "", at: TI("2025-01-20T05:30:00.000Z") }]), eligibilityRule: JSON.stringify({ cgpaMin: 6, noLiveBacklogs: true, programmeIds: [], batchYear: Y(2025), genders: [] }), status: "CLOSED", invitedAt: T("2025-01-06T05:30:00Z"), closedAt: T("2025-02-28T05:30:00Z"), recruiterRating: 4, recruiterFeedback: "Well prepared; we would come back.", createdByUserId: staff.tpo.userId, createdAt: T("2025-01-03T05:30:00Z") }, select: { id: true } }));
  const graduate = people.alumnus.studentId;
  await db.driveApplication.upsert({ where: { driveId_studentMembershipId: { driveId: closed.id, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, studentMembershipId: graduate, studentUserId: people.alumnus.userId, schoolName: college.name, appliedAt: T("2025-01-09T05:30:00Z"), consentAt: T("2025-01-09T05:30:00Z"), recordJson: JSON.stringify({ cgpa: 8.2, liveBacklogs: 0, attendancePct: 92, programmeId: academics.programmes[0]!.id, programmeName: spec.depts[0].programme.name, batchYear: Y(2025), gender: spec.alumnus.gender, category: "OPEN" }) }, update: {} });
  await db.roundResult.upsert({ where: { driveId_round_studentMembershipId: { driveId: closed.id, round: 0, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, round: 0, studentMembershipId: graduate, outcome: "PASSED", byUserId: people.recruiterUserId }, update: {} });
  await db.offer.upsert({ where: { driveId_studentMembershipId: { driveId: closed.id, studentMembershipId: graduate } }, create: { schoolId: s, driveId: closed.id, studentMembershipId: graduate, packageRupees: Math.round(R.packageRupees * 0.9), acceptedAt: T("2025-02-10T05:30:00Z"), joinedAt: T("2025-07-01T04:00:00Z"), byUserId: people.recruiterUserId, createdAt: T("2025-02-05T05:30:00Z") }, update: {} });
  if (!(await db.placementSeason.findUnique({ where: { schoolId_batchYear: { schoolId: s, batchYear: Y(2025) } }, select: { id: true } }))) {
    const t = await placementTable(s, Y(2025));
    await db.placementSeason.create({ data: { schoolId: s, batchYear: Y(2025), finalYear: t.finalYear, placed: t.placed, higherStudies: t.higherStudies, entrepreneurs: t.entrepreneurs, offers: t.offers, medianSalaryRupees: t.medianSalaryRupees, computedByUserId: staff.tpo.userId } });
  }
  return { companyId: company.id };
}

type InternshipRow = { n: number; kind: string; company: string; from: string; to: string; hours: number; window: number; status: "CREDITED" | "APPROVED"; diary: string };
/** The stream's internships: the BCI's court and legal-aid weeks at a law college, the MBA's summer internship, an industry one elsewhere. */
function internshipsOf(spec: StreamSpec): InternshipRow[] {
  const company = spec.recruiter?.company ?? "";
  if (spec.stream === "LAW") {
    return [
      { n: 4, kind: "COURT", company: "Civil Court (Senior Division), Pune", from: K("2026-05-04"), to: K("2026-05-29"), hours: 120, window: 2, status: "CREDITED", diary: "Watched the day's board with a sitting judge's staff; noted three civil appeals." },
      { n: 1, kind: "LEGAL_AID", company: "District Legal Services Authority, Pune", from: K("2026-09-07"), to: K("2026-10-02"), hours: 100, window: 4, status: "APPROVED", diary: "Legal-aid camp at Hadapsar; helped draft two maintenance applications." },
    ];
  }
  if (spec.stream === "MANAGEMENT") return [{ n: 4, kind: "SUMMER", company, from: K("2026-05-11"), to: K("2026-06-26"), hours: 280, window: 2, status: "CREDITED", diary: "Market-sizing model for a client's dairy business; presented to the partner." }];
  return [{ n: 2, kind: "INDUSTRY", company, from: K("2026-05-18"), to: K("2026-06-19"), hours: 200, window: 2, status: "CREDITED", diary: "Induction and shadowing; kept the daily log the supervisor signed." }];
}

async function buildInternships(spec: StreamSpec, college: College, people: People, companyId: string | null) {
  if (!placementOn(spec) || !spec.recruiter) return;
  const s = college.id;
  for (const row of internshipsOf(spec)) {
    const st = people.students.find((x) => x.n === row.n)!;
    if (await db.internship.findFirst({ where: { schoolId: s, studentMembershipId: st.id, kind: row.kind }, select: { id: true } })) continue;
    const hod = st.prog === 0 ? people.staff.hodA : people.staff.hodB;
    const guide = st.prog === 0 ? people.staff.f1 : people.staff.f3;
    const credited = row.status === "CREDITED" ? { industryGrade: "A", facultyVisitAt: new Date(`${row.from}T06:00:00Z`), vivaMarks: 40, creditedAt: new Date(`${row.to}T06:00:00Z`), creditedByUserId: hod.userId, credits: 2 } : {};
    await db.internship.create({ data: { schoolId: s, studentMembershipId: st.id, companyId: row.company === spec.recruiter.company ? companyId : null, companyName: row.company, kind: row.kind, fromKey: row.from, toKey: row.to, hours: row.hours, windowSemester: row.window, supervisorName: row.company === spec.recruiter.company ? spec.recruiter.name : "The officer in charge", facultyMembershipId: guide.id, diary: JSON.stringify([{ on: row.from, hours: 6, text: row.diary }]), status: row.status, decidedByUserId: hod.userId, decidedAt: new Date(`${row.from}T04:00:00Z`), ...credited } });
  }
}

async function buildStreamRecords(spec: StreamSpec, college: College, people: People) {
  const s = college.id;
  const st = (n: number) => people.students.find((x) => x.n === n)!;
  if (spec.stream === "LAW") {
    // Two moots: last year's intra-college round and this year's inter-college one (this year's stays open: the BCI
    // return filed is last year's).
    const moots: [string, string, string, { name: string; ids: number[]; outcome: string }[], string, string][] = [
      ["Intra-college moot court: the right to privacy", K("2026-02-14"), "INTRA", [{ name: "Team Petitioner", ids: [1, 2], outcome: "WINNER" }, { name: "Team Respondent", ids: [4, 5], outcome: "RUNNER_UP" }], "The petitioners carried the bench on proportionality.", "Both teams cited well; the respondents' rejoinder ran over time."],
      ["Inter-college moot on the law of torts", K("2026-09-26"), "INTER", [{ name: "Saraswati Law College", ids: [3, 6], outcome: "BEST_MEMORIAL" }], "Best memorial among twelve teams.", "Sharp issues in the memorial; oral submissions need more authority."],
    ];
    for (const [name, at, kind, teams, result, judgeNotes] of moots) {
      if (await db.mootCourt.findFirst({ where: { schoolId: s, name }, select: { id: true } })) continue;
      await db.mootCourt.create({ data: { schoolId: s, name, at, kind, teamsJson: JSON.stringify(teams.map((t) => ({ name: t.name, membershipIds: t.ids.map((n) => st(n).id), outcome: t.outcome }))), result, judgeNotes, createdByUserId: people.staff.f1.userId } });
    }
  }
  if (spec.stream === "EDUCATION") {
    // Two practice schools, the B.Ed second years posted for four weeks, two lessons observed each by the coordinator.
    const coordinator = dutyHolder(spec, "PRACTICE_TEACHING_COORDINATOR");
    const observer = people.staff[coordinator ?? "f1"];
    const schools: [string, string, string][] = [["Zilla Parishad Primary School, Warje", "27250501104", "Head teacher, 020 2523 0000"], ["New Model English School, Karve Road", "27250502209", "Supervisor, 020 2544 0000"]];
    const ids: string[] = [];
    for (const [name, udise, contact] of schools) ids.push((await db.practiceSchool.upsert({ where: { schoolId_name: { schoolId: s, name } }, create: { schoolId: s, name, udise, contact }, update: {}, select: { id: true } })).id);
    for (const [i, n] of [4, 5, 6].entries()) {
      const pupil = st(n);
      const from = K("2026-08-17");
      const posting =
        (await db.teachingPracticePosting.findFirst({ where: { schoolId: s, studentMembershipId: pupil.id, fromKey: from }, select: { id: true } })) ??
        (await db.teachingPracticePosting.create({ data: { schoolId: s, studentMembershipId: pupil.id, practiceSchoolId: ids[i % 2]!, fromKey: from, toKey: K("2026-09-12"), lessonsPlanned: 20, createdByUserId: observer.userId }, select: { id: true } }));
      const lessons: [string, string, string][] = [[K("2026-08-24"), "B", "Clear objectives; the questions went to the same three children."], [K("2026-09-07"), "A", "Good use of the blackboard and of a number line made in class."]];
      for (const [at, grade, note] of lessons) {
        if (await db.lessonObservation.findFirst({ where: { postingId: posting.id, at }, select: { id: true } })) continue;
        await db.lessonObservation.create({ data: { schoolId: s, postingId: posting.id, at, observerMembershipId: observer.id, grade, note } });
      }
    }
  }
  if (spec.stream === "HEALTH_SCIENCES" || spec.stream === "PHARMACY") {
    // The clinical desk (R-56, the clinical half; 10 Oct 2026): one hospital with two departments, a rotation of two postings
    // of the first programme's second-year division (students 1–3) under the coordinator and another teacher, and an entry
    // in each state — SIGNED and RETURNED (student 1), SUBMITTED (2), DRAFT (3). No patient is named in any note.
    const coordinatorKey = dutyHolder(spec, "CLINICAL_COORDINATOR") ?? "f1";
    const coordinator = people.staff[coordinatorKey];
    const other = people.staff[coordinatorKey === "f2" ? "f1" : "f2"];
    const pharmacy = spec.stream === "PHARMACY";
    const siteName = pharmacy ? "District Civil Hospital, Pune — Pharmacy" : "District Civil Hospital, Nashik";
    const site = await db.clinicalSite.upsert({ where: { schoolId_name: { schoolId: s, name: siteName } }, create: { schoolId: s, name: siteName, kind: pharmacy ? "PHARMACY" : "HOSPITAL", address: pharmacy ? "Sassoon Road, Pune" : "Trimbak Road, Nashik", agreementFromKey: K("2026-06-01"), agreementToKey: K("2027-05-31"), contactRole: pharmacy ? "CHIEF_PHARMACIST" : "MEDICAL_SUPERINTENDENT" }, update: { archivedAt: null }, select: { id: true } });
    const wards: [string, number | null][] = pharmacy ? [["Outpatient dispensary", null], ["Inpatient pharmacy", null]] : [["Medical ward", 40], ["Surgical ward", 30]];
    const wardIds: string[] = [];
    for (const [name, beds] of wards) wardIds.push((await db.clinicalDepartment.upsert({ where: { siteId_name: { siteId: site.id, name } }, create: { schoolId: s, siteId: site.id, name, beds }, update: { beds }, select: { id: true } })).id);
    const division = await db.division.findFirst({ where: { schoolId: s, class: { name: divisionNames(spec).A2 } }, select: { id: true } });
    if (division) {
      const rotation: [number, string, string, string, Member][] = [[1, wardIds[0]!, K("2026-09-21"), K("2026-10-18"), other], [2, wardIds[1]!, K("2026-10-19"), K("2026-11-15"), coordinator]];
      const postingIds: string[] = [];
      for (const [order, departmentId, from, to, by] of rotation) {
        const data = { siteId: site.id, departmentId, divisionId: division.id, labBatchId: null, supervisorMembershipId: by.id, fromKey: from, toKey: to, rotationOrder: order };
        const found = await db.clinicalPosting.findFirst({ where: { schoolId: s, divisionId: division.id, rotationOrder: order, departmentId }, select: { id: true } });
        postingIds.push(found ? (await db.clinicalPosting.update({ where: { id: found.id }, data, select: { id: true } })).id : (await db.clinicalPosting.create({ data: { schoolId: s, createdByUserId: coordinator.userId, ...data }, select: { id: true } })).id);
      }
      const kindA = pharmacy ? "DISPENSING" : "CASE";
      const kindB = pharmacy ? "SKILL" : "PROCEDURE";
      const entries: [number, number, string, string, number, string, string, Record<string, unknown>][] = [
        [1, 1, K("2026-09-24"), kindA, 2, pharmacy ? "Two prescriptions dispensed under the pharmacist's check; labels verified." : "Two admissions with fever; vitals charted four-hourly.", "SIGNED", { submittedAt: T("2026-09-25T04:30:00Z"), signedAt: T("2026-09-26T05:30:00Z"), signedByMembershipId: other.id, remark: "Clear and complete." }],
        [2, 1, K("2026-09-30"), kindB, 1, pharmacy ? "Counselled a patient on an inhaler's use." : "Assisted an intravenous cannulation.", "RETURNED", { submittedAt: T("2026-10-01T03:30:00Z"), signedAt: null, signedByMembershipId: other.id, remark: "Say what you checked first and what the outcome was." }],
        [3, 2, K("2026-10-03"), "SKILL", 3, pharmacy ? "Three stock entries reconciled against the ward's indent." : "Three bed baths given under supervision.", "SUBMITTED", { submittedAt: T("2026-10-04T03:30:00Z"), signedAt: null, signedByMembershipId: null, remark: "" }],
        [4, 3, K("2026-10-06"), kindA, 1, pharmacy ? "Observed the morning dispensing round." : "Observed a ward round on the male medical side.", "DRAFT", { submittedAt: null, signedAt: null, signedByMembershipId: null, remark: "" }],
      ];
      for (const [n, who, on, kind, count, note, state, rest] of entries) {
        const student = st(who);
        const clientId = `demo-${spec.prefix}-entry-${n}`;
        const data = { postingId: postingIds[0]!, onKey: on, kind, count, note, state, ...rest };
        await db.logbookEntry.upsert({ where: { studentMembershipId_clientId: { studentMembershipId: student.id, clientId } }, create: { schoolId: s, studentMembershipId: student.id, clientId, ...data }, update: data });
      }
    }
  }
  if (spec.stream === "ARCHITECTURE") {
    // The studio desk (R-56, the studio half, 10 Oct 2026): one studio on the second years' design course with its four
    // stages, the interim jury held and signed with marks for students 1–3 (f2 chairs, f3 and an external juror sit),
    // the final jury ahead with its panel, and the three students' pin-up submissions (one late, one draft for the final).
    const offering = await db.courseOffering.findFirst({ where: { schoolId: s, termId: { not: undefined }, course: { code: "AR301" } }, select: { id: true, termId: true } });
    const coordinator = people.staff[dutyHolder(spec, "STUDIO_COORDINATOR") ?? "f1"];
    if (offering) {
      const title = "Architectural Design III: a primary school for Aundh";
      const studio =
        (await db.studio.findFirst({ where: { schoolId: s, offeringId: offering.id, title }, select: { id: true } })) ??
        (await db.studio.create({ data: { schoolId: s, offeringId: offering.id, termId: offering.termId, title, brief: "A twelve-classroom primary school on a 4,000 m² plot off Baner Road: site and user study, two schemes at the interim pin-up, one developed scheme with sections, services and a 1:200 model at the final.", maxMarks: 100, coordinatorMembershipId: coordinator.id, briefIssuedOn: K("2026-08-03"), interimOn: K("2026-09-14"), finalOn: K("2026-10-26"), juryOn: K("2026-11-02"), createdByUserId: coordinator.userId }, select: { id: true } }));
      const { f2, f3, f1 } = people.staff;
      const interim =
        (await db.studioJury.findFirst({ where: { studioId: studio.id, on: K("2026-09-16") }, select: { id: true } })) ??
        (await db.studioJury.create({ data: { schoolId: s, studioId: studio.id, on: K("2026-09-16"), title: "Interim jury", panelJson: JSON.stringify([f2.id, f3.id]), chairMembershipId: f2.id, externalJson: JSON.stringify([{ role: "PRACTISING_ARCHITECT", institution: spec.recruiter?.company ?? "Studio Vastu Architects LLP" }]), signedByMembershipId: f2.id, signedAt: new Date(`${K("2026-09-16")}T12:30:00Z`), createdByUserId: coordinator.userId }, select: { id: true } }));
      const sheet: [number, number, string][] = [[1, 740, "A confident parti; the sections need daylight studies."], [2, 620, "Two schemes, the second under-resolved at the entrance."], [3, 815, "Strong site reading; carry the model's scale into the plans."]];
      for (const [n, marksTenths, remark] of sheet) {
        await db.studioJuryMark.upsert({ where: { juryId_studentMembershipId: { juryId: interim.id, studentMembershipId: st(n).id } }, create: { schoolId: s, juryId: interim.id, studentMembershipId: st(n).id, marksTenths, remark, markedByMembershipId: f3.id, markedAt: new Date(`${K("2026-09-16")}T11:00:00Z`) }, update: {} });
      }
      if (!(await db.studioJury.findFirst({ where: { studioId: studio.id, on: K("2026-11-02") }, select: { id: true } }))) {
        await db.studioJury.create({ data: { schoolId: s, studioId: studio.id, on: K("2026-11-02"), title: "Final jury", panelJson: JSON.stringify([f1.id, f2.id, f3.id]), chairMembershipId: f1.id, externalJson: JSON.stringify([{ role: "ACADEMIC", institution: "School of Planning and Architecture" }, { role: "STRUCTURAL_ENGINEER", institution: "Vastu Shilpa Consultants" }]), createdByUserId: coordinator.userId } });
      }
      const subs: [number, string, string, string, Date | null][] = [[1, "INTERIM_PINUP", "SUBMITTED", "Site study and two schemes, pinned up.", new Date(`${K("2026-09-13")}T09:00:00Z`)], [2, "INTERIM_PINUP", "LATE", "Two schemes; the sections follow.", new Date(`${K("2026-09-15")}T16:00:00Z`)], [3, "INTERIM_PINUP", "SUBMITTED", "Site study, two schemes and a massing model.", new Date(`${K("2026-09-14")}T08:30:00Z`)], [3, "FINAL_SUBMISSION", "DRAFT", "Developed scheme in progress.", null]];
      for (const [n, stage, state, note, submittedAt] of subs) {
        await db.studioSubmission.upsert({ where: { studioId_studentMembershipId_stage: { studioId: studio.id, studentMembershipId: st(n).id, stage } }, create: { schoolId: s, studioId: studio.id, studentMembershipId: st(n).id, stage, state, note, submittedAt }, update: {} });
      }
    }
  }
  // NSS and NCC where the stream offers them: the officer enrols, and one activity with its hours.
  for (const [corps, duty, ids, title, at, hours] of [["NSS", "NSS_OFFICER", NSS_STUDENTS, "Cleanliness drive and a blood-donation camp", K("2026-09-19"), 6], ["NCC", "NCC_OFFICER", NCC_STUDENTS, "Drill and a map-reading exercise", K("2026-09-12"), 4]] as const) {
    const officer = dutyHolder(spec, duty);
    if (!officer) continue;
    const by = people.staff[officer];
    const unit = `${spec.prefix.toUpperCase()} ${corps} Unit 1`;
    for (const n of ids) await db.corpsEnrolment.upsert({ where: { corps_studentMembershipId: { corps, studentMembershipId: st(n).id } }, create: { schoolId: s, corps, studentMembershipId: st(n).id, unit, enrolledOn: K("2026-08-10"), createdByUserId: by.userId }, update: {} });
    if (!(await db.activity.findFirst({ where: { schoolId: s, kind: corps, title }, select: { id: true } }))) {
      await db.activity.create({ data: { schoolId: s, kind: corps, title, at, participants: ids.length, participantIdsJson: JSON.stringify(ids.map((n) => st(n).id)), hours, camp: false, createdByUserId: by.userId } });
    }
  }
}

/* -------------------------------------------------------------------------- */
/* the IQAC: records, committees, a survey, the cycle, the filings, the visit  */
/* -------------------------------------------------------------------------- */

/** The filings this run generates, with their year: the council's return (BCI last year's, see the header), NIRF, the AICTE disclosure. */
export function filingsPlanned(spec: StreamSpec): { kind: string; year: number }[] {
  const preset = STREAM_PRESETS[spec.stream].filings as readonly string[];
  const out: { kind: string; year: number }[] = [];
  for (const kind of ["PCI_INSPECTION", "BCI_RETURN", "NCTE_RETURN"]) if (preset.includes(kind)) out.push({ kind, year: kind === "BCI_RETURN" ? Y(2025) : Y(2026) });
  if (preset.includes("NIRF")) out.push({ kind: "NIRF", year: Y(2026) });
  if (preset.includes("AICTE_DISCLOSURE")) out.push({ kind: "AICTE_DISCLOSURE", year: Y(2026) });
  return out;
}

async function buildIqac(spec: StreamSpec, college: College, people: People, academics: Academics) {
  const s = college.id;
  const { staff } = people;
  const deptOf = (prog: 0 | 1) => academics.programmes[prog]!.deptId;
  const records: [StaffKey, string, string, boolean, number, string, 0 | 1][] = [
    ["principal", "PRINCIPAL", "PHD", true, 14, K("2012-06-15"), 0],
    ["hodA", "PROFESSOR", "PHD", true, 11, K("2013-07-01"), 0],
    ["f1", "ASSISTANT_PROFESSOR", "PG", true, 3, K("2019-07-15"), 0],
    ["f2", "ASSISTANT_PROFESSOR", "PHD", true, 2, K("2020-08-01"), 0],
    ["hodB", "ASSOCIATE_PROFESSOR", "PHD", false, 9, K("2014-06-20"), 1],
    ["f3", "ASSISTANT_PROFESSOR", "PG", true, 4, K("2018-07-02"), 1],
    ["f4", "ASSISTANT_PROFESSOR", "PG", false, 1, K("2022-07-11"), 1],
  ];
  for (const [key, designation, highestQualification, netSetQualified, experienceBeforeYears, joinedOn, dept] of records) {
    // The staff record's gender (UDISE+ codes), which NIRF's women-in-faculty share reads.
    await db.staffRecord.upsert({ where: { membershipId: staff[key].id }, create: { schoolId: s, membershipId: staff[key].id, designation, gender: genderOf(nameOfKey(spec, key)), joinedOn: day(joinedOn) }, update: {} });
    await db.facultyRecord.upsert({ where: { membershipId: staff[key].id }, create: { schoolId: s, membershipId: staff[key].id, designation, appointment: "REGULAR", highestQualification, netSetQualified, experienceBeforeYears, joinedOn, departmentId: deptOf(dept), apiScoreJson: JSON.stringify({ teaching: 82, research: key.startsWith("hod") ? 55 : 30, service: 18 }), updatedByUserId: staff.registrar.userId }, update: {} });
  }
  for (const [kind, title, indexing, year, amountLakhs, by] of spec.research) {
    if (await db.researchItem.findFirst({ where: { schoolId: s, title }, select: { id: true } })) continue;
    await db.researchItem.create({ data: { schoolId: s, kind, title, indexing, year: Y(year), amountLakhs, facultyMembershipId: staff[by].id, departmentId: deptOf(by === "hodA" || by === "f1" || by === "f2" ? 0 : 1), createdByUserId: staff.iqac.userId } });
  }
  const squad = dutyHolder(spec, "ANTI_RAGGING_SQUAD");
  const committees: [string, string, { name: string; role: string; membershipId: string | null }[], string, string][] = [
    ["ANTI_RAGGING", "Anti-ragging Committee and Squad", [{ name: spec.staff.principal, role: "Chair", membershipId: staff.principal.id }, ...(squad ? [{ name: spec.staff[squad], role: "Squad member", membershipId: staff[squad].id }] : []), { name: spec.staff.warden, role: "Warden", membershipId: staff.warden.id }], K("2026-08-05"), "Undertakings collected from every first-year student; the squad's night rounds of the hostel fixed."],
    ["GRIEVANCE", "Students' Grievance Redressal Committee", [{ name: spec.staff.principal, role: "Chair", membershipId: staff.principal.id }, { name: spec.depts[1].hod, role: "Member", membershipId: staff.hodB.id }], K("2026-09-02"), "One case heard and closed within the limit."],
    ["IQAC", "Internal Quality Assurance Cell", [{ name: spec.staff.principal, role: "Chair", membershipId: staff.principal.id }, { name: spec.staff.iqac, role: "Coordinator", membershipId: staff.iqac.id }, { name: spec.depts[0].hod, role: "Member", membershipId: staff.hodA.id }], K("2026-09-12"), "The council's return and the peer-team visit file assigned; the cycle's metrics reviewed."],
  ];
  for (const [kind, name, members, at, actionTaken] of committees) {
    const committee = (await db.committee.findFirst({ where: { schoolId: s, kind, name }, select: { id: true } })) ?? (await db.committee.create({ data: { schoolId: s, kind, name, membersJson: JSON.stringify(members) }, select: { id: true } }));
    if (!(await db.committeeMeeting.findFirst({ where: { committeeId: committee.id, at }, select: { id: true } }))) await db.committeeMeeting.create({ data: { schoolId: s, committeeId: committee.id, at, actionTaken, createdByUserId: staff.registrar.userId } });
  }
  // Last year's student satisfaction survey, closed with every student's answers, its action taken; one grievance closed in time.
  const salt = `demo-${spec.prefix}-sss-2025`;
  const SSS_TITLE = `Student Satisfaction Survey ${CAL.ay(-1)}`;
  const sss = (await db.survey.findFirst({ where: { schoolId: s, kind: "SSS", title: SSS_TITLE }, select: { id: true } })) ?? (await db.survey.create({ data: { schoolId: s, kind: "SSS", title: SSS_TITLE, opensOn: K("2026-03-02"), closesOn: K("2026-03-31"), questionsJson: JSON.stringify(Array.from({ length: 20 }, (_, i) => `Q${pad(i + 1)}`)), salt, createdByUserId: staff.iqac.userId }, select: { id: true } }));
  for (const st of people.students.filter((x) => x.year === 2)) {
    const respondent = respondentHash(sss.id, st.id, salt);
    const base = st.n % 3 === 0 ? 3 : 4;
    const answers = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`Q${pad(i + 1)}`, Math.max(1, base - (i % 4 === 0 ? 1 : 0))]));
    await db.surveyResponse.upsert({ where: { surveyId_respondentHash: { surveyId: sss.id, respondentHash: respondent } }, create: { schoolId: s, surveyId: sss.id, respondentHash: respondent, answersJson: JSON.stringify(answers), createdAt: T("2026-03-20T06:00:00Z") }, update: {} });
  }
  await db.survey.updateMany({ where: { id: sss.id, closedAt: null }, data: { closedAt: T("2026-04-01T06:00:00Z"), salt: "" } });
  await db.actionTakenReport.upsert({ where: { surveyId: sss.id }, create: { schoolId: s, surveyId: sss.id, text: "Library hours extended before the semester examinations; a second tutorial a week in the first-year courses.", publishedAt: T("2026-04-15T06:00:00Z"), createdByUserId: staff.iqac.userId }, update: {} });
  const gText = "The odd-semester timetable puts two of my lectures in the same hour on Thursdays.";
  if (!(await db.grievance.findFirst({ where: { schoolId: s, text: gText }, select: { id: true } }))) {
    const filed = K("2026-07-20");
    await db.grievance.create({ data: { schoolId: s, byMembershipId: people.students.find((x) => x.n === 2)!.id, kind: "ACADEMIC", committeeKind: "GRIEVANCE", text: gText, status: "RESOLVED", filedAt: new Date(`${filed}T05:00:00Z`), dueOn: addWorkingDays(filed, 15), response: "The timetable committee moved the second lecture to Friday.", acknowledgedAt: new Date(`${filed}T09:00:00Z`), resolvedAt: T("2026-07-29T06:00:00Z"), decidedByUserId: staff.registrar.userId } });
  }

  // The NAAC cycle (the affiliated or the autonomous framework), two figures the platform does not hold entered; computed once.
  const framework = spec.kind === "AUTONOMOUS_COLLEGE" ? "AUTONOMOUS" : "AFFILIATED_UG";
  const entered = JSON.stringify({ SANCTIONED_POSTS: { value: 10, byUserId: staff.iqac.userId, at: TI("2026-09-01T06:00:00.000Z"), fileIds: [] }, BANDWIDTH_MBPS: { value: 200, byUserId: staff.iqac.userId, at: TI("2026-09-01T06:00:00.000Z"), fileIds: [] } });
  const cycle =
    (await db.accreditationCycle.findFirst({ where: { schoolId: s, framework }, select: { id: true } })) ??
    (await db.accreditationCycle.create({ data: { schoolId: s, framework, institutionType: spec.kind, windowFrom: K("2022-06-01"), windowTo: K("2027-05-31"), status: "OPEN", enteredJson: entered, createdByUserId: staff.iqac.userId }, select: { id: true } }));
  if ((await db.metricScore.count({ where: { cycleId: cycle.id } })) === 0) await recomputeAsSystem(s, cycle.id, staff.iqac.userId);

  // Last year's AQAR, cut from the rows by the filings library, signed off and filed.
  if (!(await db.collegeFiling.findFirst({ where: { schoolId: s, kind: "AQAR", year: Y(2025) }, select: { id: true } }))) {
    const built = await buildFiling(s, "AQAR", Y(2025), cycle.id);
    await db.collegeFiling.create({ data: { schoolId: s, kind: "AQAR", cycleId: cycle.id, year: Y(2025), format: built.format, body: built.body, hash: iqacHash(built.body), figuresJson: JSON.stringify(built.figures), status: "FILED", checked: true, principalNote: "Approved for submission to the NAAC portal.", generatedAt: T("2026-09-08T06:00:00Z"), submittedAt: T("2026-09-10T06:00:00Z"), signedOffAt: T("2026-09-12T06:00:00Z"), signedOffByUserId: staff.principal.userId, generatedByUserId: staff.iqac.userId } });
  }
  // The year's filings, through the generator the desk's button calls (audited), once each.
  const iqac = await actor(staff.iqac.userId, s, "IQAC", staff.iqac.id);
  // A DRAFT the rows have moved past (a fix to this script's data) is taken back and made again; one that agrees is kept.
  for (const f of filingsPlanned(spec)) {
    const kind = f.kind as Parameters<typeof generateFiling>[1]["kind"];
    const cycleId = f.kind === "NIRF" ? cycle.id : null;
    const rows = await db.collegeFiling.findMany({ where: { schoolId: s, kind, year: f.year }, select: { id: true, status: true, hash: true } });
    if (rows.length) {
      const fresh = await buildFiling(s, kind, f.year, cycleId, null, { snapshot: "live" });
      if (rows.some((r) => r.status !== "DRAFT" || r.hash === iqacHash(fresh.body))) continue;
      await db.collegeFiling.deleteMany({ where: { schoolId: s, id: { in: rows.map((r) => r.id) }, status: "DRAFT" } });
    }
    await generateFiling(iqac, { kind, year: f.year, cycleId });
  }
  // The AICTE disclosure, published where AICTE approves (once: setDisclosure stamps the day).
  if (filingsPlanned(spec).some((f) => f.kind === "AICTE_DISCLOSURE") && !(await db.disclosurePage.findFirst({ where: { schoolId: s, publishedAt: { not: null } }, select: { id: true } }))) {
    await setDisclosure(iqac, true);
  }

  // The peer-team visit file: NAAC's visit next February, its first day's schedule and two lines of evidence.
  const title = `NAAC peer-team visit, ${spec.name}`;
  let visit = await db.peerTeamVisit.findFirst({ where: { schoolId: s, title }, select: { id: true } });
  if (!visit) {
    const made = await createVisit(iqac, { framework: "NAAC", cycleId: cycle.id, departmentId: null, year: Y(2026), title, fromDate: K("2027-02-15"), toDate: K("2027-02-17"), team: [{ name: "Prof R. Iyer", role: "Chair" }, { name: "Dr S. Banerjee", role: "Member coordinator" }, { name: "Dr P. Menon", role: "Member" }] });
    visit = { id: made.id };
    const filing = await db.collegeFiling.findFirst({ where: { schoolId: s, kind: "AQAR", year: Y(2025) }, select: { id: true } });
    const items: Parameters<typeof addVisitItem>[2][] = [
      { kind: "SCHEDULE", dayKey: K("2027-02-15"), startMinute: 600, endMinute: 660, activity: "The principal's presentation to the peer team", venue: "Seminar hall", ownerName: spec.staff.principal },
      { kind: "SCHEDULE", dayKey: K("2027-02-15"), startMinute: 690, endMinute: 780, activity: `Visit to the departments: ${spec.depts.map((d) => d.name.replace(/^Department of /, "")).join(" and ")}`, venue: "Academic block", ownerName: spec.staff.iqac },
      { kind: "EVIDENCE", criterion: "6.5.3", title: `The AQAR for ${CAL.ay(-1)}, filed`, linkKind: "FILING", linkId: filing?.id ?? null, url: null, note: "" },
      { kind: "EVIDENCE", criterion: "2.6.3", title: "Last term's pass percentage from the published results", linkKind: "NOTE", linkId: null, url: null, note: "The exam cell's run 1 of last term's sitting." },
    ];
    for (const item of items) await addVisitItem(iqac, made.id, item);
  }
  return { cycleId: cycle.id, visitId: visit.id };
}

/* -------------------------------------------------------------------------- */
/* the campus: library, hostel, transport, inventory, payroll                   */
/* -------------------------------------------------------------------------- */

async function buildCampus(spec: StreamSpec, college: College, people: People) {
  const s = college.id;
  const { staff, students } = people;
  const P = spec.prefix.toUpperCase();
  const student = (n: number) => students.find((x) => x.n === n)!;

  await db.librarySettings.upsert({ where: { schoolId: s }, create: { schoolId: s, pupilLimit: 3, pupilLoanDays: 14, staffLimit: 6, staffLoanDays: 30, maxRenewals: 1, finePerDayPaise: 200, fineHeadId: null }, update: {} });
  let accession = 0;
  for (const [isbn, title, author, publisher, year] of spec.library) {
    const t = await db.libraryTitle.upsert({ where: { schoolId_isbn: { schoolId: s, isbn } }, create: { schoolId: s, isbn, title, author, publisher, year, subject: spec.stream.replace("_", " ").toLowerCase(), language: "EN", category: "GENERAL" }, update: {}, select: { id: true } });
    for (let c = 0; c < 3; c += 1) {
      accession += 1;
      await db.libraryCopy.upsert({ where: { schoolId_accession: { schoolId: s, accession: `${P}-${pad(accession, 5)}` } }, create: { schoolId: s, titleId: t.id, accession: `${P}-${pad(accession, 5)}`, rack: "R1" }, update: {} });
    }
  }
  const borrower = student(LIBRARY_BORROWER);
  const card = await db.libraryMember.upsert({ where: { membershipId: borrower.id }, create: { schoolId: s, membershipId: borrower.id, kind: "PUPIL", cardNumber: `${P}-L${pad(LIBRARY_BORROWER, 4)}` }, update: {}, select: { id: true } });
  const copy = await db.libraryCopy.findUniqueOrThrow({ where: { schoolId_accession: { schoolId: s, accession: `${P}-00001` } }, select: { id: true } });
  if (!(await db.libraryIssue.findFirst({ where: { schoolId: s, copyId: copy.id }, select: { id: true } }))) {
    await db.libraryIssue.create({ data: { schoolId: s, copyId: copy.id, memberId: card.id, issuedAt: T("2026-09-28T06:00:00Z"), dueOn: K("2026-10-12"), issuedByUserId: staff.librarian.userId } });
    await db.libraryCopy.update({ where: { id: copy.id }, data: { status: "ISSUED" } });
  }

  // The hostel: its boarders those of its kind (one a minor), and the anti-ragging squad's night round.
  const hostel = await db.hostel.upsert({ where: { schoolId_name: { schoolId: s, name: spec.hostel.name } }, create: { schoolId: s, name: spec.hostel.name, kind: spec.hostel.kind, wardenMembershipId: staff.warden.id, capacity: 8, messAttendance: false, curfewMinute: 22 * 60, nightOutAllowed: true }, update: { wardenMembershipId: staff.warden.id }, select: { id: true } });
  const roomIds: string[] = [];
  for (const [number, floor] of [["G-01", "Ground"], ["G-02", "Ground"]] as const) roomIds.push((await db.hostelRoom.upsert({ where: { hostelId_number: { hostelId: hostel.id, number } }, create: { schoolId: s, hostelId: hostel.id, number, floor, beds: 4, kind: "SHARED" }, update: {}, select: { id: true } })).id);
  for (const [i, st] of boardersOf(spec).map(student).entries()) {
    if (await db.hostelAllotment.findFirst({ where: { schoolId: s, membershipId: st.id, status: "ACTIVE" }, select: { id: true } })) continue;
    const roomId = roomIds[i < 2 ? 0 : 1]!;
    const bed = (i % 2) + 1;
    await db.hostelAllotment.create({ data: { schoolId: s, membershipId: st.id, roomId, bed, fromDate: K("2026-07-01"), status: "ACTIVE", activePupilKey: st.id, activeBedKey: `${roomId}:${bed}`, allottedByUserId: staff.registrar.userId } });
  }
  const squad = dutyHolder(spec, "ANTI_RAGGING_SQUAD");
  if (squad && !(await db.hostelSquadRound.findFirst({ where: { schoolId: s, hostelId: hostel.id }, select: { id: true } }))) {
    await db.hostelSquadRound.create({ data: { schoolId: s, hostelId: hostel.id, at: T("2026-09-25T16:30:00Z"), members: `${spec.staff[squad]}, ${spec.staff.warden}`, note: "First-year rooms visited after dinner; nothing to report.", flagged: false, loggedByUserId: staff[squad].userId } });
  }

  // Transport: Route 1, its stops, one bus the driver drives, three riders (the twins among them).
  let route = await db.transportRoute.findFirst({ where: { schoolId: s, name: spec.route.name }, select: { id: true } });
  if (!route) {
    route = await db.transportRoute.create({ data: { schoolId: s, name: spec.route.name, direction: "BOTH", note: "Two public stops and the college's gate." }, select: { id: true } });
    for (const [i, [name, lat, lng]] of spec.route.stops.entries()) await db.transportStop.create({ data: { schoolId: s, routeId: route.id, order: i + 1, name, lat, lng, morningMinute: 7 * 60 + 35 + i * 15, eveningMinute: 17 * 60 + 25 - i * 15, radiusM: 150 } });
  }
  const registration = `MH 12 ${P} ${spec.aishe.slice(-4)}`;
  const bus = await db.bus.upsert({ where: { schoolId_registration: { schoolId: s, registration } }, create: { schoolId: s, registration, capacity: 42, note: "The college's own bus." }, update: {}, select: { id: true } });
  if (!(await db.busAssignment.findFirst({ where: { schoolId: s, busId: bus.id, routeId: route.id }, select: { id: true } }))) await db.busAssignment.create({ data: { schoolId: s, busId: bus.id, routeId: route.id, driverMembershipId: staff.driver.id, fromDateKey: K("2026-07-01"), createdByUserId: staff.registrar.userId } });
  const stops = await db.transportStop.findMany({ where: { routeId: route.id }, orderBy: { order: "asc" }, select: { id: true } });
  for (const [i, n] of RIDERS.entries()) {
    const st = student(n);
    if (await db.transportAllotment.findFirst({ where: { schoolId: s, studentMembershipId: st.id, routeId: route.id }, select: { id: true } })) continue;
    await db.transportAllotment.create({ data: { schoolId: s, studentMembershipId: st.id, routeId: route.id, stopId: stops[i % 2]!.id, fromDateKey: K("2026-07-01"), createdByUserId: staff.registrar.userId } });
  }

  // Inventory, where the preset switches it on (pharmacy): each lab's stock from a purchase, its assets, one breakage.
  if (inventoryOn(spec)) {
    const labs = spec.depts.map((d) => d.lab).filter((x): x is string => Boolean(x));
    const inCharge = dutyHolder(spec, "LAB_INCHARGE") ?? "f1";
    const category = await db.inventoryCategory.upsert({ where: { schoolId_name: { schoolId: s, name: "Laboratory equipment" } }, create: { schoolId: s, name: "Laboratory equipment", depreciationRateBp: 1500 }, update: {}, select: { id: true } });
    const vendor = await db.vendor.upsert({ where: { schoolId_name: { schoolId: s, name: "Deccan Scientific Suppliers" } }, create: { schoolId: s, name: "Deccan Scientific Suppliers", phone: "+912026870044" }, update: {}, select: { id: true, name: true } });
    const item = (code: string, name: string, unit: string, reorderLevel: number, kind = "CONSUMABLE") => db.inventoryItem.upsert({ where: { schoolId_code: { schoolId: s, code } }, create: { schoolId: s, code, name, unit, reorderLevel, kind, categoryId: category.id }, update: {}, select: { id: true } });
    const beaker = await item(`${P}-BEAKER`, "Borosilicate beaker, 250 ml", "piece", 20);
    const pipette = await item(`${P}-PIPETTE`, "Graduated pipette, 10 ml", "piece", 10);
    const meter = await item(`${P}-ASSET-EQ`, "Laboratory instrument", "piece", 0, "ASSET");
    for (const [ref, location, lines, moves] of [
      [`${P}/LAB/2026/011`, labs[0]!, [{ itemCode: `${P}-BEAKER`, description: "Borosilicate beaker, 250 ml", quantity: 40, unitPaise: 9_000, totalPaise: 360_000 }], [[beaker.id, 40]]],
      [`${P}/LAB/2026/012`, labs[1] ?? labs[0]!, [{ itemCode: `${P}-PIPETTE`, description: "Graduated pipette, 10 ml", quantity: 25, unitPaise: 6_000, totalPaise: 150_000 }], [[pipette.id, 25]]],
    ] as const) {
      if (await db.purchaseRecord.findFirst({ where: { schoolId: s, invoiceRef: ref }, select: { id: true } })) continue;
      await db.$transaction(async (tx) => {
        const bill = await tx.purchaseRecord.create({ data: { schoolId: s, vendorId: vendor.id, vendorName: vendor.name, dateKey: K("2026-07-20"), invoiceRef: ref, location, linesJson: JSON.stringify(lines), totalPaise: lines.reduce((a, l) => a + l.totalPaise, 0), note: "Odd-term lab stock.", createdByUserId: staff.registrar.userId }, select: { id: true } });
        for (const [itemId, qty] of moves) {
          await tx.stockMovement.create({ data: { schoolId: s, itemId, kind: "PURCHASE", delta: qty, location, purchaseRecordId: bill.id, reference: ref, byUserId: staff.registrar.userId, note: "" } });
          await tx.inventoryStock.upsert({ where: { itemId_location: { itemId, location } }, create: { schoolId: s, itemId, location, quantity: qty }, update: { quantity: { increment: qty } } });
        }
      });
    }
    if (!(await db.stockMovement.findFirst({ where: { schoolId: s, kind: "WRITE_OFF", reference: "BREAKAGE" }, select: { id: true } }))) {
      await db.$transaction(async (tx) => {
        await tx.stockMovement.create({ data: { schoolId: s, itemId: beaker.id, kind: "WRITE_OFF", delta: -1, location: labs[0]!, reference: "BREAKAGE", note: "Cracked on the hot plate during experiment 1.", byUserId: staff[inCharge].userId } });
        await tx.inventoryStock.update({ where: { itemId_location: { itemId: beaker.id, location: labs[0]! } }, data: { quantity: { decrement: 1 } } });
      });
    }
    for (const [i, location] of labs.entries()) {
      const tagNumber = `${P}-A-${pad(i + 1, 4)}`;
      if (await db.asset.findUnique({ where: { schoolId_tagNumber: { schoolId: s, tagNumber } }, select: { id: true } })) continue;
      const a = await db.asset.create({ data: { schoolId: s, tagNumber, name: i === 0 ? "UV–visible spectrophotometer" : "Digital pH meter", itemId: meter.id, categoryId: category.id, vendorId: vendor.id, purchaseDate: day(K("2024-07-10")), costPaise: i === 0 ? 3_800_000 : 650_000, location, custodianMembershipId: staff[inCharge].id, status: "IN_USE" }, select: { id: true } });
      await db.assetEvent.create({ data: { schoolId: s, assetId: a.id, kind: "CREATED", byUserId: staff.registrar.userId } });
    }
  }

  // Payroll: the statutory settings, one structure, a salary for every member of staff, September locked.
  const settings = { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH" as const, employerName: "Saraswati Education Society", pfEstablishmentCode: `PUPUN00${spec.aishe.slice(-5)}000`, esiEmployerCode: `330007${spec.aishe.slice(-5)}001001` };
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
  const structure = await db.salaryStructure.upsert({ where: { schoolId_name: { schoolId: s, name: "College staff" } }, create: { schoolId: s, name: "College staff" }, update: {}, select: { id: true } });
  if ((await db.salaryComponent.count({ where: { structureId: structure.id } })) === 0) {
    await db.salaryComponent.createMany({ data: STRUCTURE.map((c, i) => ({ schoolId: s, structureId: structure.id, code: c.code, label: "", kind: COMPONENT_KIND[c.code], formula: c.formula, value: c.value, statutory: STATUTORY_CODES.includes(c.code), position: i })) });
  }
  const STAFF = staffOf(spec);
  for (const [i, p] of STAFF.entries()) {
    await db.staffSalary.upsert({ where: { membershipId_effectiveFromKey: { membershipId: staff[p.key].id, effectiveFromKey: K("2026-04-01") } }, create: { schoolId: s, membershipId: staff[p.key].id, effectiveFromKey: K("2026-04-01"), structureId: structure.id, basicPaise: p.basic, pfUan: `1012${spec.aishe.slice(-2)}${pad(i + 1, 6)}`, paymentMode: "CASH" }, update: {} });
  }
  const month = `${Y(2026)}-09`;
  if (!(await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId: s, month } }, select: { id: true } }))) {
    const comps = STRUCTURE.map((c) => ({ code: c.code, label: "", formula: c.formula, value: c.value }));
    const slips = STAFF.map((p) => {
      const f = computeSlip({ month, daysInMonth: daysInMonthOf(month), lopHalfDays: 0, basicPaise: p.basic, components: comps, overrides: {}, settings, gender: null, arrearsPaise: 0, tdsOverridePaise: p.basic >= 7_500_000 ? 800_000 : null, advances: [] });
      return { schoolId: s, membershipId: staff[p.key].id, staffName: p.name, department: p.role, designation: p.title, daysInMonth: daysInMonthOf(month), lopHalfDays: 0, lopOverrideHalfDays: null, linesJson: JSON.stringify(f.lines), grossPaise: f.grossPaise, deductionsPaise: f.deductionsPaise, employerPaise: f.employerPaise, netPaise: f.netPaise, arrearsPaise: 0, tdsOverridePaise: p.basic >= 7_500_000 ? 800_000 : null, notes: "", paymentMode: "CASH", bankLast4: null as string | null };
    });
    const sum = (k: "grossPaise" | "deductionsPaise" | "employerPaise" | "netPaise") => slips.reduce((a, x) => a + x[k], 0);
    await db.$transaction(async (tx) => {
      const r = await tx.payrollRun.create({ data: { schoolId: s, month, status: "LOCKED", headcount: slips.length, grossPaise: sum("grossPaise"), deductionsPaise: sum("deductionsPaise"), employerPaise: sum("employerPaise"), netPaise: sum("netPaise"), lockDigest: slipDigest(slips), sharedWithPrincipal: true, createdByUserId: staff.accounts.userId, lockedByUserId: staff.accounts.userId, lockedAt: T("2026-09-30T11:00:00Z") }, select: { id: true } });
      await tx.payslip.createMany({ data: slips.map((x) => ({ ...x, runId: r.id })) });
    });
  }
}

/** A member of staff's name by key. */
function nameOfKey(spec: StreamSpec, key: StaffKey): string {
  return staffOf(spec).find((p) => p.key === key)?.name ?? "";
}
/** The spec's staff carry no gender; the women among them by first name (the spec's names are the only ones it reads). */
const WOMEN = new Set("Rekha Amruta Nandini Shubhangi Sarika Vaishali Bharati Medha Jayashree Ketaki Leena Asmita Deepa Shailaja Vandana Manisha Swapnali Kalpana Archana Usha Sunita Shilpa Madhuri Aparna Priti Seema Jyoti Sunanda Anuradha Gayatri Mitali Vrushali Sangeeta Rajani Rupali Priyanka Manjusha Kavita Smita Shubhada Sneha Kirti Nanda Shobha Varsha Jayashri Manasi Asha Lata Shalini".split(" "));
export function genderOf(name: string): "M" | "F" {
  const first = name.replace(/^(Dr|Prof)\s+/, "").split(/\s+/)[0] ?? "";
  return WOMEN.has(first) ? "F" : "M";
}

/** The hostel's boarders: up to four students of the hostel's kind, the twin of that kind among them. */
export function boardersOf(spec: StreamSpec): number[] {
  const want = spec.hostel.kind === "BOYS" ? "M" : "F";
  return studentsOf(spec).filter((s) => s.gender === want).map((s) => s.n).slice(-4);
}

/** The adult child's consents to the parent, through the student's own function (audited `student.consent.grant`). */
async function giveConsent(college: College, people: People) {
  const elder = people.students.find((x) => x.n === 1)!;
  const me = await actor(elder.userId, college.id, "STUDENT", elder.id);
  for (const grant of CONSENTS) await setStudentConsent(me, grant, true);
}

/* -------------------------------------------------------------------------- */
/* the feed, the work, the alumni's note, an e-resource, an anti-ragging case   */
/* -------------------------------------------------------------------------- */

async function buildCommunity(spec: StreamSpec, college: College, people: People, academics: Academics) {
  const s = college.id;
  const { staff } = people;
  // The registrar's notice on the bulletin, approved (every role's /bulletin).
  const title = `Winter ${Y(2026)} examinations: the date sheet is out`;
  if (!(await db.post.findFirst({ where: { schoolId: s, title }, select: { id: true } }))) {
    const at = T("2026-10-01T06:00:00Z");
    await db.post.create({ data: { schoolId: s, authorUserId: staff.registrar.userId, authorMembershipId: staff.registrar.id, scope: "SCHOOL", title, body: `The Winter ${Y(2026)} papers begin on 16 November. Hall tickets are on your exams page; bring your college identity card to every paper.`, category: "UPDATES", audience: "ALL", status: "APPROVED", reviewedAt: at, reviewedByMembershipId: staff.registrar.id, createdAt: at } });
  }
  // Work set on the three first courses (R-48's college homework), published, due a week after the first run; one handed in.
  for (const o of academics.offerings.filter((_, i) => TEACHING[i]![1] === 0)) {
    const workTitle = `${o.code}: assignment 1`;
    const work =
      (await db.assignment.findFirst({ where: { schoolId: s, offeringId: o.id, title: workTitle }, select: { id: true } })) ??
      (await db.assignment.create({ data: { schoolId: s, offeringId: o.id, classId: null, authorMembershipId: o.teacher.id, title: workTitle, body: `Answer the three questions on unit 1 of ${academics.courses[o.code]!.name.toLowerCase()}; cite what you read.`, category: "Assignment", pointsMilli: 20_000, dueAt: new Date(Date.now() + 7 * 86_400_000), publishedAt: T("2026-09-28T06:00:00Z") }, select: { id: true } }));
    const first = o.roster[0]!;
    if (!(await db.submission.findFirst({ where: { assignmentId: work.id, studentMembershipId: first.id }, select: { id: true } }))) {
      await db.submission.create({ data: { schoolId: s, assignmentId: work.id, studentMembershipId: first.id, body: "My answers to the three questions, with the two readings cited.", status: "SUBMITTED", submittedAt: T("2026-10-03T12:00:00Z") } });
    }
  }
  // The office's note to the alumni, through its own function (once).
  const noteTitle = `Alumni meet ${Y(2026)}`;
  if (!(await db.alumniNote.findFirst({ where: { schoolId: s, title: noteTitle }, select: { id: true } }))) {
    const office = await actor(staff.registrar.userId, s, "ADMIN", staff.registrar.id);
    await sendAlumniNote(office, { batchYear: null, title: noteTitle, body: `The alumni meet is on the last Saturday of December at the college. Write to the office if you can speak to the final years.` });
  }
  await db.libraryEResource.upsert({ where: { schoolId_nameKey: { schoolId: s, nameKey: eResourceNameKey("N-LIST (INFLIBNET e-books and e-journals)") } }, create: { schoolId: s, name: "N-LIST (INFLIBNET e-books and e-journals)", nameKey: eResourceNameKey("N-LIST (INFLIBNET e-books and e-journals)"), url: "https://nlist.inflibnet.ac.in/", kind: "NLIST" }, update: {} });
  // A case before the anti-ragging committee, heard and closed (the squad's register lists that it exists, never its words).
  const text = "Seniors in the hostel asked first-years to stand outside their rooms after dinner.";
  if (dutyHolder(spec, "ANTI_RAGGING_SQUAD") && !(await db.grievance.findFirst({ where: { schoolId: s, text }, select: { id: true } }))) {
    const filed = K("2026-08-18");
    await db.grievance.create({ data: { schoolId: s, byMembershipId: people.students.find((x) => x.n === 7)!.id, kind: "RAGGING", committeeKind: "ANTI_RAGGING", text, status: "RESOLVED", filedAt: new Date(`${filed}T05:00:00Z`), dueOn: addWorkingDays(filed, 15), response: "The committee met the seniors and their parents; a written warning issued and the squad's rounds doubled.", acknowledgedAt: new Date(`${filed}T08:00:00Z`), resolvedAt: T("2026-08-21T06:00:00Z"), decidedByUserId: staff.registrar.userId } });
  }
}

/* -------------------------------------------------------------------------- */
/* counts and the roster                                                       */
/* -------------------------------------------------------------------------- */

export async function countBlock(spec: StreamSpec, schoolId: string) {
  const s = { schoolId };
  const emails = [...staffOf(spec).map((p) => p.email), ...studentsOf(spec).map((st) => studentEmail(spec, st.n)), parentEmail(spec), alumnusEmail(spec), ...(spec.recruiter && placementOn(spec) ? [recruiterEmail(spec)] : [])];
  const dutyHolders = await db.membership.findMany({ where: { schoolId, role: { in: ["FACULTY", "HOD"] } }, select: { dutiesJson: true } });
  const cycle = await db.accreditationCycle.findFirst({ where: s, select: { cgpa: true } });
  return {
    users: await db.user.count({ where: { email: { in: emails } } }),
    memberships: await db.membership.count({ where: s }),
    duties: dutyHolders.reduce((a, m) => a + (JSON.parse(m.dutiesJson) as string[]).length, 0),
    modulesOn: await db.schoolModule.count({ where: s }),
    guardianships: await db.guardianship.count({ where: { studentSchoolId: schoolId } }),
    consents: await db.studentConsent.count({ where: { ...s, revokedAt: null } }),
    departments: await db.department.count({ where: s }),
    programmes: await db.programme.count({ where: s }),
    courses: await db.course.count({ where: s }),
    divisions: await db.division.count({ where: s }),
    labBatches: await db.labBatch.count({ where: s }),
    offerings: await db.courseOffering.count({ where: s }),
    offeringSlots: await db.offeringSlot.count({ where: s }),
    registrations: await db.courseRegistration.count({ where: s }),
    lectures: await db.lecture.count({ where: s }),
    lectureMarks: await db.lectureAttendance.count({ where: s }),
    practicalRecords: await db.practicalRecord.count({ where: s }),
    practicalSigned: await db.practicalRecord.count({ where: { ...s, signedAt: { not: null } } }),
    internalMarks: await db.internalMark.count({ where: s }),
    internalLocks: await db.internalLock.count({ where: s }),
    examSessions: await db.examSession.count({ where: s }),
    conductSessions: await db.examSession.count({ where: { ...s, status: "CONDUCT" } }),
    questionPapers: await db.questionPaper.count({ where: s }),
    examForms: await db.examForm.count({ where: s }),
    hallTickets: await db.hallTicket.count({ where: s }),
    examMarks: await db.examMark.count({ where: s }),
    publishedRuns: await db.resultRun.count({ where: { ...s, status: "PUBLISHED" } }),
    termResults: await db.termResult.count({ where: s }),
    backlogs: await db.backlog.count({ where: s }),
    gradeCards: await db.examDocument.count({ where: { ...s, kind: "GRADE_CARD" } }),
    squadVisits: await db.examSquadVisit.count({ where: s }),
    drives: await db.drive.count({ where: s }),
    applications: await db.driveApplication.count({ where: s }),
    offers: await db.offer.count({ where: s }),
    internships: await db.internship.count({ where: s }),
    mootCourts: await db.mootCourt.count({ where: s }),
    practiceSchools: await db.practiceSchool.count({ where: s }),
    practicePostings: await db.teachingPracticePosting.count({ where: s }),
    lessonObservations: await db.lessonObservation.count({ where: s }),
    clinicalSites: await db.clinicalSite.count({ where: s }),
    clinicalPostings: await db.clinicalPosting.count({ where: s }),
    logbookEntries: await db.logbookEntry.count({ where: s }),
    corpsEnrolments: await db.corpsEnrolment.count({ where: s }),
    corpsActivities: await db.activity.count({ where: { ...s, kind: { in: ["NSS", "NCC"] } } }),
    researchItems: await db.researchItem.count({ where: s }),
    committees: await db.committee.count({ where: s }),
    accreditationCycles: await db.accreditationCycle.count({ where: s }),
    metricScores: await db.metricScore.count({ where: s }),
    cycleCgpa: (cycle?.cgpa ?? 0).toFixed(2),
    collegeFilings: await db.collegeFiling.count({ where: s }),
    disclosurePublished: await db.disclosurePage.count({ where: { ...s, publishedAt: { not: null } } }),
    peerVisits: await db.peerTeamVisit.count({ where: s }),
    peerVisitItems: await db.peerVisitItem.count({ where: s }),
    feeStructures: await db.feeStructure.count({ where: s }),
    feeDemands: await db.feeDemand.count({ where: s }),
    feeReceipts: await db.feeReceipt.count({ where: s }),
    scholarshipClaims: await db.scholarshipClaim.count({ where: s }),
    libraryCopies: await db.libraryCopy.count({ where: s }),
    libraryIssues: await db.libraryIssue.count({ where: s }),
    hostelAllotments: await db.hostelAllotment.count({ where: { ...s, status: "ACTIVE" } }),
    transportRiders: await db.transportAllotment.count({ where: s }),
    stockMovements: await db.stockMovement.count({ where: s }),
    assets: await db.asset.count({ where: s }),
    payslips: await db.payslip.count({ where: s }),
    posts: await db.post.count({ where: s }),
    assignments: await db.assignment.count({ where: s }),
    submissions: await db.submission.count({ where: s }),
    alumniNotes: await db.alumniNote.count({ where: s }),
    grievances: await db.grievance.count({ where: s }),
  };
}

const HOME: Record<string, string> = { ADMIN: "/admin", PRINCIPAL: "/principal", HOD: "/hod", FACULTY: "/faculty", EXAM_CONTROLLER: "/exam-cell", IQAC: "/iqac", TPO: "/placement", ACCOUNTS: "/accounts", LIBRARIAN: "/library", WARDEN: "/hostel", DRIVER: "/driver", STUDENT: "/student", PARENT: "/parent", ALUMNUS: "/alumni", RECRUITER: "/recruiter" };
export const homeOf = (role: string) => HOME[role] ?? "/";
const DUTY_PAGE: Partial<Record<DutyCode, string>> = { LAB_INCHARGE: "/duties/lab", PRACTICE_TEACHING_COORDINATOR: "/duties/teaching-practice", NSS_OFFICER: "/duties/nss", NCC_OFFICER: "/duties/ncc", ANTI_RAGGING_SQUAD: "/duties/anti-ragging", RESEARCH_DEAN: "/duties/research", EXAM_SQUAD: "/duties/exam-squad", CLINICAL_COORDINATOR: "/duties/clinical", STUDIO_COORDINATOR: "/duties/studio" };
export const dutyPage = (d: DutyCode) => DUTY_PAGE[d] ?? `/duties/${d.toLowerCase()}`;

function notBuiltLine(spec: StreamSpec): string {
  const nb = STREAM_PRESETS[spec.stream].notBuilt;
  const parts: string[] = [];
  // The clinical desk is built since 10 Oct 2026 (R-56, the clinical half): the councils' returns are what remains.
  if (spec.stream === "HEALTH_SCIENCES") parts.push("the councils' returns (NMC, DCI, INC) are not built; the clinical desk is (/duties/clinical: the hospital with two wards, a rotation of two postings, a logbook entry in each state)");
  if (spec.stream === "ARCHITECTURE") parts.push("the Council of Architecture has no return kind in the app (DS-12); studios and juries are kept since 10 Oct 2026 (R-56, the studio half)");
  if (spec.stream === "AGRICULTURE") parts.push("the farm and field work are not kept (the registrar's home says so); ICAR has no return kind in the app");
  if (!parts.length && nb.length) parts.push(`not kept: ${nb.join(", ")}`);
  return parts.length ? `**Not built here:** ${parts.join("; ")}.` : "";
}

function rosterSection(spec: StreamSpec, college: { code: string; twinId: string | null }): string {
  const plan = dutyPlan(spec);
  const names = divisionNames(spec);
  const [a, b] = spec.depts;
  const staffLook: Record<StaffKey, string> = {
    registrar: "/admin (the stream's home tiles), /admin/people (duties on the row menu), /admin/academics, /admin/stream-records, /accounts",
    principal: "/principal/college, /principal/accreditation, /iqac/documents",
    hodA: `/hod (${a.name.replace(/^Department of /, "")}), the locked internal marks of ${coursesOf(spec, 0, 3)[0]![0]}, teaches ${coursesOf(spec, 0, 3)[1]![0]}`,
    hodB: `/hod (${b.name.replace(/^Department of /, "")}), ${coursesOf(spec, 1, 3)[0]![0]}'s unit test waiting for the countersign, teaches ${coursesOf(spec, 1, 3)[1]![0]}`,
    f1: `teaches ${coursesOf(spec, 0, 3)[0]![0]} in ${names.A2}`,
    f2: `teaches ${coursesOf(spec, 0, 1)[0]![0]} in ${names.A1}`,
    f3: `teaches ${coursesOf(spec, 1, 3)[0]![0]} in ${names.B2}`,
    f4: `teaches ${coursesOf(spec, 0, 1)[1]![0]} in ${names.A1}`,
    exams: `Winter ${Y(2026)} in CONDUCT${spec.kind === "AUTONOMOUS_COLLEGE" ? " (a paper sealed, one assigned)" : ""}; Summer ${Y(2026)} published (${spec.kind === "AUTONOMOUS_COLLEGE" ? "double entry" : "the university's file imported"}), grade cards, one ATKT`,
    iqac: `/iqac/predictor, /iqac/documents (${filingsPlanned(spec).map((f) => f.kind).join(", ")}), /iqac/visits (the NAAC visit file)`,
    tpo: "/placement/drives (the OPEN drive, two applicants), /placement/internships",
    accounts: "/accounts (collection, defaulters), /accounts/scholarships (one sanctioned), /admin/payroll (September locked)",
    librarian: "the catalogue, one book out",
    warden: `${spec.hostel.name}: its boarders, the squad's night round`,
    driver: `${spec.route.name}, three riders`,
  };
  const staffRows = staffOf(spec).map((p) => {
    const duties = p.key === "f1" || p.key === "f2" || p.key === "f3" || p.key === "f4" ? plan[p.key] : [];
    const look = [staffLook[p.key], ...duties.map((d) => dutyPage(d))].join("; ");
    return `| ${p.email} | ${p.name} | ${p.role === "ADMIN" ? "ADMIN (registrar)" : p.role}${duties.length ? ` · ${duties.join(", ")}` : ""} | ${homeOf(p.role)} | ${look}${p.role === "ADMIN" ? HEAD_PAGES_NOTE : ""} |`;
  });
  const studentRows = studentsOf(spec).map((st) => {
    const notes: string[] = [`${names[st.div]}`];
    if (st.n === 1) notes.push(`granted ${CONSENTS.join(" and ")} to ${spec.parent}`);
    if (st.minor) notes.push(`a minor of seventeen; ${spec.parent} sees everything`);
    if (st.n === SCHOLAR) notes.push("OBC post-matric scholarship sanctioned");
    if (st.n === ATKT_STUDENT) notes.push("ATKT with a backlog");
    if (st.n === SHORT_STUDENT) notes.push("under 75 % in one course");
    if (APPLICANTS.includes(st.n) && placementOn(spec) && spec.recruiter) notes.push("applied to the open drive");
    if (boardersOf(spec).includes(st.n)) notes.push(`boards at ${spec.hostel.name}`);
    if (RIDERS.includes(st.n)) notes.push("rides Route 1");
    if (st.n === LIBRARY_BORROWER) notes.push("a library book out");
    if (PAID_ODD.includes(st.n)) notes.push("odd semester paid");
    if (spec.stream === "LAW" && [1, 2, 3, 4, 5, 6].includes(st.n)) notes.push("in a moot");
    if (spec.stream === "EDUCATION" && [4, 5, 6].includes(st.n)) notes.push("posted for teaching practice");
    if (internshipsOf(spec).some((i) => i.n === st.n) && placementOn(spec)) notes.push("an internship");
    return `| ${studentEmail(spec, st.n)} | ${st.name} | STUDENT (${st.category}) | /student | ${notes.join("; ")} |`;
  });
  const duties = dutiesOffered(spec);
  return `### ${spec.name} (${spec.stream})

Slug \`${spec.slug}\`, join code \`${college.code}\`, kind ${spec.kind}, stream ${spec.stream}, ${spec.city}, affiliated to ${spec.university} (AISHE ${spec.aishe}, made up). Modules: the ${spec.stream} preset's (${STREAM_PRESETS[spec.stream].modulesOn.join(", ")}) and ${CAMPUS_MODULES.join(", ")}. ${a.programme.name} (${a.name}, head ${a.hod}) and ${b.programme.name} (${b.name}, head ${b.hod}), regulator ${[...new Set([a.programme.regulator, b.programme.regulator])].join(" and ")}. Duties offered and given: ${duties.join(", ")}. Filings generated: ${filingsPlanned(spec).map((f) => `${f.kind} ${f.year}–${String((f.year + 1) % 100).padStart(2, "0")}`).join(", ")}, and last year's AQAR filed. ${notBuiltLine(spec)}

| Account | Name | Role | Home | Where to look |
|---|---|---|---|---|
${staffRows.join("\n")}
${studentRows.join("\n")}
| ${parentEmail(spec)} | ${spec.parent} | PARENT of ${CHILDREN.map((n) => spec.students[n - 1]!.name).join(", ")} | /parent?child=${college.twinId ?? ""} | the twins' attendance, results and fees; the elder child's attendance and results by consent. Plain /parent opens on the elder (adult) child's home, which says what they share (DS-1 fixed 10 Oct 2026); the twins are on the switcher |
| ${alumnusEmail(spec)} | ${spec.alumnus.name} | ALUMNUS (left May ${Y(2025)}) | /alumni | /alumni/college${placementOn(spec) && spec.recruiter ? " (placed through last season's drive)" : ""} |
${spec.recruiter && placementOn(spec) ? `| ${recruiterEmail(spec)} | ${spec.recruiter.name} | RECRUITER, ${spec.recruiter.company} (no membership) | /recruiter | the OPEN drive and its two consented applicants |\n` : ""}`;
}

async function writeRoster(): Promise<string> {
  const built = await db.school.findMany({ where: { slug: { in: STREAM_SPECS.map((x) => x.slug) } }, select: { id: true, slug: true, code: true } });
  const bySlug = new Map<string, { code: string; twinId: string | null }>();
  for (const b of built) {
    const spec = STREAM_SPECS.find((x) => x.slug === b.slug)!;
    const twin = await db.membership.findFirst({ where: { schoolId: b.id, role: "STUDENT", user: { email: studentEmail(spec, 7) } }, select: { id: true } });
    bySlug.set(b.slug, { code: b.code, twinId: twin?.id ?? null });
  }
  const sections = STREAM_SPECS.filter((spec) => bySlug.has(spec.slug)).map((spec) => rosterSection(spec, bySlug.get(spec.slug)!));
  const block = `<!-- demo-college-stream:begin -->
## The demo colleges for every stream (demo:college-stream)

Built by \`npm run demo:college-stream -- --all\` (or \`--stream=LAW\`; from \`apps/web\`; \`scripts/demo-college-stream.ts\` with the spec table in \`scripts/demo-college-stream-specs.ts\`; idempotent, run it again to put things back) and checked by \`npm run demo:college-check -- --slug=<slug>\`. One generic script: the modules, filings and duties of each college are its stream's preset (STREAM_PRESETS, DUTY_BUILT). **The password for every account below is \`${PASSWORD}\`.** For a browser check mint a session: \`npm run zz:token -- ROLE email@${DOMAIN}\` (then \`--purge\`).

Dates (G4-29): dated from the day the script runs (\`scripts/demo-calendar.ts\`), as the other demo colleges. In each college: this odd term's offerings with registers for the four weeks before the run's week, internal marks locked on one offering and waiting on another, last term's sitting published with grade cards (imported at an affiliated college, double entry at the autonomous one), this term's sitting in CONDUCT, fee structures with one scholarship sanctioned, a NAAC cycle computed, the year's filings generated, a NAAC peer-team visit file, the library, a hostel with its boarders, Route 1 with three riders, September's payroll locked. The law college's BCI return is last year's: generating a year's return freezes that year's moots (R-53), so this year's moot desk stays open.

${sections.join("\n")}<!-- demo-college-stream:end -->
`;
  const docPath = join(process.cwd(), "..", "..", "docs", "demo-schools.md");
  await mkdir(join(process.cwd(), "..", "..", "docs"), { recursive: true });
  const before = await readFile(docPath, "utf8").catch(() => "");
  const marked = /<!-- demo-college-stream:begin -->[\s\S]*?<!-- demo-college-stream:end -->\n?/;
  const after = marked.test(before) ? before.replace(marked, block) : `${before.trimEnd()}${before ? "\n\n" : ""}${block}`;
  if (after !== before) await writeFile(docPath, after);
  return docPath;
}

/* -------------------------------------------------------------------------- */

async function buildOne(ctx: Ctx, spec: StreamSpec) {
  await refuseAnotherYear(db, spec.slug, CAL);
  const college = await buildCollege(spec);
  const people = await buildPeople(ctx, spec, college);
  await switchModulesOn(college, CAMPUS_MODULES, people.staff.registrar.userId);
  await giveDuties(spec, college, people);
  // owner-batch-item9 (decision 7): the principal gives the registrar the head's pages, audited once.
  const headPages = await giveHeadPages(db, college.id);
  console.log(`  ${spec.slug}: the head's pages ${headPages.given} given this run, ${headPages.already} already held`);
  await giveConsent(college, people);
  const academics = await buildAcademics(spec, college, people);
  const office = await buildOffice(spec, college, people, academics);
  const exams = await buildExams(spec, college, people, academics, office.examHeadId);
  const placement = await buildPlacement(spec, college, people, academics, exams.sgpa);
  await buildInternships(spec, college, people, placement.companyId);
  await buildStreamRecords(spec, college, people);
  await buildCampus(spec, college, people);
  await buildCommunity(spec, college, people, academics);
  const iqac = await buildIqac(spec, college, people, academics);
  const counts = await countBlock(spec, college.id);
  console.log(`\n  ── ${college.name} (${spec.stream}) ── slug ${spec.slug}, join code ${college.code}, school id ${college.id}`);
  console.log(`     duties    ${Object.entries(dutyPlan(spec)).map(([k, v]) => `${k}: ${v.join("+") || "—"}`).join("; ")}`);
  console.log(`     filings   ${filingsPlanned(spec).map((f) => `${f.kind} ${f.year}`).join(", ")}; visit ${iqac.visitId}`);
  console.log(`     counts (compare two runs line for line)`);
  for (const [k, v] of Object.entries(counts)) console.log(`       ${k.padEnd(22)} ${v}`);
}

async function main() {
  if (process.argv.includes("--calendar")) return void console.log(describeCalendar(CAL));
  const arg = process.argv.find((a) => a.startsWith("--stream="))?.slice(9);
  const specs = process.argv.includes("--all") ? STREAM_SPECS : arg ? [specOf(arg)].filter((x): x is StreamSpec => Boolean(x)) : [];
  if (!specs.length) throw new Error(`usage: demo:college-stream -- --stream=<${STREAM_SPECS.map((x) => x.stream).join("|")}> | --all | --calendar`);
  await refuseUnlessLocal("demo:college-stream");
  const ctx: Ctx = { passwordHash: await hash(PASSWORD, ARGON), setPassword: true };
  console.log(`\n  Demo colleges for every stream. Password for EVERY account: ${PASSWORD}\n${describeCalendar(CAL).replace(/^/gm, "     ")}`);
  for (const spec of specs) await buildOne(ctx, spec);
  const docPath = await writeRoster();
  console.log(`\n  Roster written to ${docPath}\n`);
}

if (process.argv[1]?.endsWith("demo-college-stream.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (sessionIds.length) await db.session.deleteMany({ where: { id: { in: sessionIds } } });
      await db.$disconnect();
    });
}
