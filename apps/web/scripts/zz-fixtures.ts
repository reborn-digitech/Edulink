/**
 * End-to-end test fixtures, all prefixed ZZ.
 *
 *   npm run zz:fixtures              create (or top up) everything
 *   npm run zz:fixtures -- --teardown   remove every ZZ row
 *
 * WHY A SEPARATE SCRIPT AND NOT `db:seed`. The main seed calls `wipe()` — it
 * owns the database and starts by emptying it. That is correct for a fresh
 * checkout and catastrophic against a database somebody is already using. This
 * script only ever ADDS, and everything it adds is identifiable: every email is
 * on `@zz.test`, every school slug starts `zz-`, every person's name starts
 * "ZZ ". Teardown is therefore exact, and nothing here can reach a row that
 * belongs to the seeded schools or to anybody's real data.
 *
 * IDEMPOTENT. Every write is find-or-create keyed on something stable (email,
 * school slug, class name within a school), so a second run changes nothing and
 * a half-finished run can simply be repeated.
 *
 * WHAT IT BUILDS
 *   ZZ Northgate School — populated. One class per grade 3–10, six pupils in
 *     each, an admin, a principal, four form tutors holding two classes apiece,
 *     four subject teachers who tutor nobody, and two teachers attached to
 *     nothing at all. A full Mon–Fri timetable over every class. Half the pupils
 *     have a parent linked; the other half are deliberately UNCLAIMED so the
 *     parent-claim flow has something to claim. Their codes are printed.
 *   ZZ Southbank School — small. An admin, a principal, three teachers holding
 *     one class each and two attached to nothing, ten pupils across two of its
 *     three classes, and four of those pupils claimed by a parent. Grade 8 is
 *     left with no pupils on purpose: a zero-row register still needs a home.
 *   ZZ Banyan School — one person, several hats. Its admin also teaches a
 *     class and has a child in another; a teacher and the principal each have
 *     a child at the school; one parent has a child here and one at Southbank;
 *     one teacher is on the staff of both schools. Every account is a reason
 *     for the role switcher to exist, so the switcher can be walked as each.
 *   Four experts spanning the curation states: published+verified, published
 *     unverified, and one still unpublished.
 *   One operator account, already carrying the superuser flag.
 *
 * Runs on the ADMIN connection: it creates schools, and a row that belongs to no
 * tenant yet cannot be written through the app's row-level-security role.
 */
import { PrismaClient } from "@prisma/client";
import { removeEmptyRegisters, removeSweepRegister } from "./zz-cleanup";
import { fixturePng } from "./png";
import { hash } from "@node-rs/argon2";
import { config } from "dotenv";
import { createHash } from "node:crypto";
import { classCode, schoolCode, studentCode } from "../src/lib/codes";
import { buildSweepDoors } from "./sweep-doors";
import { buildInventory, buildPayroll } from "./zz-fixtures-inventory-payroll";
import { buildLibraryHostel } from "./zz-library-hostel";
import { buildTransport } from "./zz-transport";
import { buildAlumni } from "./zz-alumni";
// website-builder A (15 Oct 2026)
import { buildWebsite } from "./zz-website";
// end website-builder A
import { buildColleges } from "./zz-college";
import { buildAcademics } from "./zz-academics";
import { buildCollegeExams } from "./zz-exams";
import { buildIqac } from "./zz-iqac";
import { buildCollegeOffice } from "./zz-college-office";
import { buildPlacement } from "./zz-placement";
import { buildStreamFixtures } from "./zz-streams";
import { buildStreamRecords } from "./zz-stream-records";
// The studio desk (R-56, the studio half, 10 Oct 2026).
import { buildStudioFixtures } from "./zz-studio";
// The clinical desk (R-56, the clinical half; 10 Oct 2026): its own ZZ health-sciences college.
import { buildClinical } from "./zz-clinical";
import { buildCouncilFilings } from "./zz-council-filings";
// R-20 (decisions builder, 10 Oct 2026): ZZ Shastri's graduating batches for the SAR's success indices.
import { buildNbaBatches } from "./zz-nba-batches";
import { buildCollegeExtras } from "./zz-college-extras";
import { buildCollegeHomework } from "./zz-college-homework";
import { buildPlanItems } from "./zz-plan-items";
import { seedCompetitionSources } from "./competitions-crawl/sources"; // competitions-crawler (12 Oct 2026)
import { openAlumnus } from "../src/lib/alumni-membership";
import { SCHOOL_MODULES, DEFAULT_SCHOOL_MODULES, SCHOOL_VERSION_MODULES, modulesForKind } from "@edulink/contracts";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";

/** A fictitious eleven-digit PEN for seed data, deterministic per membership so re-runs agree. The government issues real ones; the app never generates any. */
export function fakePen(membershipId: string): string {
  const n = BigInt(`0x${createHash("sha1").update(membershipId).digest("hex").slice(0, 12)}`) % 1_000_000_000n;
  return `27${String(n).padStart(9, "0")}`;
}
import { bandFor, DEFAULT_REPORT_CARD_CONFIG, kindWeighted, meanPercent, meanPoints, shownPercent } from "../src/lib/report-card-rules";
import { dataFor, fill, fillRows, presetsFor, wordsFor, type PupilFacts } from "../src/lib/certificate-rules";

config();
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

/**
 * Same dev password as `prisma/seed.ts`, so ZZ accounts log in by hand too.
 * ZZ_PASSWORD overrides it for the accounts this run CREATES; an account that
 * already exists keeps whatever hash it has (upsertUser never rewrites one).
 * The value is never printed: this runs in CI, whose log anyone can read.
 */
const PASSWORD = process.env.ZZ_PASSWORD ?? "copper-lantern-47-brook";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const DOMAIN = "zz.test";
/** Fixed so birthdates do not drift between runs and break a claim mid-test. */
const THIS_YEAR = 2026;

/**
 * THE PREFIX ON EVERY HUMAN-VISIBLE NAME THIS MODULE MINTS. "ZZ " for the
 * fixtures, which is what makes teardown exact and keeps the sweeps' fixture
 * names stable. `scripts/demo-schools.ts` imports the same builders and sets
 * it to "" so the demo schools carry plain names. Emails, slugs and the
 * teardown predicate are NOT covered by it — a demo school is not a fixture
 * and must never be swept up by `--teardown`.
 */
const TAG = { prefix: "ZZ " };
export function setTag(prefix: string): void {
  TAG.prefix = prefix;
}
/** Strips the tag from a name it minted, for codes and record fields. */
function untagged(name: string): string {
  return TAG.prefix && name.startsWith(TAG.prefix) ? name.slice(TAG.prefix.length) : name;
}

export { db, THIS_YEAR };

/**
 * `setPassword` rewrites the hash of an account that already exists. The
 * fixtures never do (a ZZ account keeps whatever it was given); the demo
 * schools always do, so one printed password is true after every run.
 */
export type Ctx = { passwordHash: string; setPassword?: boolean };

/* -------------------------------------------------------------------------- */
/* names                                                                       */
/* -------------------------------------------------------------------------- */

const FIRST = [
  "Aarav", "Bhavna", "Chetan", "Divya", "Eshan", "Falguni", "Gaurav", "Harini",
  "Ishaan", "Jyoti", "Kabir", "Lalita", "Manav", "Nandini", "Omkar", "Pallavi",
  "Qadir", "Ritika", "Sahil", "Tanvi", "Uday", "Vaishali", "Wasim", "Yamini",
  "Zoya", "Arjun", "Bhoomi", "Chirag", "Deepa", "Ekta", "Farhan", "Gitanjali",
  "Hemant", "Indira", "Jatin", "Kavya", "Lokesh", "Meera", "Nikhil", "Ojas",
  "Priyanka", "Rahul", "Sneha", "Tarun", "Urvashi", "Vikram", "Waheeda", "Yash",
];
const LAST = [
  "Apte", "Bhatt", "Chavan", "Desai", "Engineer", "Fernandes", "Gokhale",
  "Hegde", "Iyengar", "Joshi", "Kulkarni", "Limaye", "Mhatre", "Naik",
];

export function studentName(index: number): string {
  return `${TAG.prefix}${FIRST[index % FIRST.length]!} ${LAST[index % LAST.length]!}`;
}

/* -------------------------------------------------------------------------- */
/* record vocabularies                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Category and religion are CODED values on the pupil record (the filing
 * sheets code them; see @edulink/contracts PUPIL_CATEGORIES and
 * PUPIL_RELIGIONS). The builders write only these, never "General" or "Hindu",
 * and a caste name plausible for the category and the state. A record that is
 * not Hindu carries no caste.
 */
const CATEGORY_CYCLE = ["GENERAL", "OBC", "GENERAL", "SC", "OBC", "GENERAL", "NT", "OBC", "ST", "GENERAL", "VJ", "SBC"] as const;
const RELIGION_CYCLE = ["HINDU", "HINDU", "HINDU", "MUSLIM", "HINDU", "HINDU", "CHRISTIAN", "HINDU", "BUDDHIST", "HINDU", "JAIN", "HINDU"] as const;
const CASTES: Record<string, string[]> = {
  GENERAL: ["Maratha", "Deshastha Brahmin", "Kayastha", "Lingayat"],
  OBC: ["Kunbi", "Mali", "Teli", "Sonar"],
  SC: ["Mahar", "Chambhar", "Matang"],
  ST: ["Bhil", "Gond", "Warli"],
  VJ: ["Banjara", "Lamani"],
  NT: ["Dhangar", "Vanjari", "Gosavi"],
  SBC: ["Koli"],
};
const FATHER_OCCUPATIONS = ["Farmer", "Bank clerk", "Shop owner", "Auto-rickshaw driver", "Software engineer", "Teacher", "Police constable", "Electrician"];
const MOTHER_OCCUPATIONS = ["Homemaker", "Nurse", "Tailor", "Anganwadi worker", "Accountant", "Homemaker", "Teacher", "Shop assistant"];
const ANNUAL_INCOMES = [180_000, 420_000, 350_000, 240_000, 1_500_000, 600_000, 480_000, 300_000];

/** The household and social fields of one pupil's record, deterministic in (seat, grade). */
export function recordFacts(seat: number, grade: number, flags: { bpl: boolean; ews: boolean }) {
  const category = CATEGORY_CYCLE[(seat + grade) % CATEGORY_CYCLE.length]!;
  const religion = RELIGION_CYCLE[(seat * 3 + grade) % RELIGION_CYCLE.length]!;
  const castes = CASTES[category]!;
  return {
    category,
    religion,
    caste: religion === "HINDU" ? castes[(seat + grade) % castes.length]! : null,
    fatherOccupation: FATHER_OCCUPATIONS[(seat + grade) % FATHER_OCCUPATIONS.length]!,
    motherOccupation: MOTHER_OCCUPATIONS[(seat * 2 + grade) % MOTHER_OCCUPATIONS.length]!,
    // BPL is under a lakh, EWS under eight; the rest as the list says.
    annualIncome: flags.bpl ? 72_000 : flags.ews ? 450_000 : ANNUAL_INCOMES[(seat + grade) % ANNUAL_INCOMES.length]!,
  };
}

/**
 * The school calendar, two years of it: what a Maharashtra school shuts for,
 * with the names in both languages the demo schools use. The register
 * builders skip the HOLIDAY spans; the EXAM span matches the mid-term papers
 * buildExams writes (day 100 and 101 of a year that starts on 1 June), and
 * the EVENT is the annual day the demo feed talks about.
 */
export type HolidaySpec = { en: string; mr: string; start: string; end?: string; kind?: "HOLIDAY" | "EXAM" | "EVENT"; note?: string };
export const CALENDAR_2025_26: HolidaySpec[] = [
  { en: "Independence Day", mr: "स्वातंत्र्य दिन", start: "2025-08-15" },
  { en: "Ganesh Chaturthi", mr: "गणेश चतुर्थी", start: "2025-08-27", end: "2025-08-30" },
  { en: "Anant Chaturdashi", mr: "अनंत चतुर्दशी", start: "2025-09-06" },
  { en: "Gandhi Jayanti and Dussehra", mr: "गांधी जयंती व दसरा", start: "2025-10-02" },
  { en: "Diwali break", mr: "दिवाळी सुट्टी", start: "2025-10-18", end: "2025-11-02" },
  { en: "Christmas break", mr: "नाताळ सुट्टी", start: "2025-12-24", end: "2026-01-01" },
  { en: "Republic Day", mr: "प्रजासत्ताक दिन", start: "2026-01-26" },
  { en: "Holi", mr: "होळी", start: "2026-03-03", end: "2026-03-04" },
  { en: "Gudi Padwa", mr: "गुढी पाडवा", start: "2026-03-19" },
  { en: "Ambedkar Jayanti", mr: "आंबेडकर जयंती", start: "2026-04-14" },
];
export const CALENDAR_2026_27: HolidaySpec[] = [
  { en: "Independence Day", mr: "स्वातंत्र्य दिन", start: "2026-08-15" },
  { en: "Mid-term examinations", mr: "सहामाही परीक्षा", start: "2026-09-09", end: "2026-09-10", kind: "EXAM", note: "Timetable on the notice board; pupils leave after the paper." },
  { en: "Ganesh Chaturthi", mr: "गणेश चतुर्थी", start: "2026-09-14", end: "2026-09-16" },
  { en: "Anant Chaturdashi", mr: "अनंत चतुर्दशी", start: "2026-09-25" },
  { en: "Gandhi Jayanti", mr: "गांधी जयंती", start: "2026-10-02" },
  { en: "Dussehra", mr: "दसरा", start: "2026-10-20" },
  { en: "Diwali break", mr: "दिवाळी सुट्टी", start: "2026-11-05", end: "2026-11-15" },
  { en: "Annual day", mr: "वार्षिक स्नेहसंमेलन", start: "2026-12-18", kind: "EVENT", note: "School ground, 5 pm; parents welcome from 4.30." },
  { en: "Christmas", mr: "नाताळ", start: "2026-12-25" },
  { en: "Republic Day", mr: "प्रजासत्ताक दिन", start: "2027-01-26" },
  { en: "Holi", mr: "होळी", start: "2027-03-22", end: "2027-03-23" },
];

/** Every date key from `from` to `to` inclusive. */
export function dateKeysBetween(from: string, to: string): string[] {
  const keys: string[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86_400_000) keys.push(new Date(t).toISOString().slice(0, 10));
  return keys;
}

/** The days a register is expected between two dates: the school's teaching weekdays (Mon–Sat unless told otherwise) less the days it is shut. */
export function teachingDaysBetween(from: string, to: string, closed: Set<string>, weekdays: readonly number[] = [1, 2, 3, 4, 5, 6]): string[] {
  return dateKeysBetween(from, to).filter((k) => weekdays.includes(new Date(`${k}T00:00:00Z`).getUTCDay()) && !closed.has(k));
}

/** The set of date keys a school's calendar closes it on (HOLIDAY kind only; exams and events keep it open). */
export async function closedDays(schoolId: string): Promise<Set<string>> {
  const rows = await db.holiday.findMany({ where: { schoolId, kind: "HOLIDAY" }, select: { startDateKey: true, endDateKey: true } });
  const closed = new Set<string>();
  for (const r of rows) for (const k of dateKeysBetween(r.startDateKey, r.endDateKey)) closed.add(k);
  return closed;
}

/* -------------------------------------------------------------------------- */
/* small helpers                                                               */
/* -------------------------------------------------------------------------- */

export async function upsertUser(
  ctx: Ctx,
  email: string,
  name: string,
  extra: { birthdate?: Date; isMinor?: boolean; phone?: string; phoneVerifiedAt?: Date } = {},
) {
  return db.user.upsert({
    where: { email },
    update: { isTestFixture: true, ...(ctx.setPassword ? { passwordHash: ctx.passwordHash } : {}) },
    create: {
      email,
      name,
      isTestFixture: true,
      passwordHash: ctx.passwordHash,
      emailVerifiedAt: new Date(),
      prefs: JSON.stringify({ theme: "system", channels: { push: true, email: true } }),
      ...extra,
    },
  });
}

export async function upsertMembership(
  userId: string,
  schoolId: string,
  role: string,
  extra: { studentCode?: string; gradeLevel?: string; title?: string; subjects?: string } = {},
) {
  const existing = await db.membership.findUnique({
    where: { userId_schoolId_role: { userId, schoolId, role } },
  });
  if (existing) return existing;
  return db.membership.create({
    data: { userId, schoolId, role, status: "ACTIVE", ...extra },
  });
}

export async function upsertSchool(input: {
  name: string;
  slug: string;
  city: string;
  contactEmail: string;
  gradeLow: string;
  gradeHigh: string;
  brandPrimary: string;
  locale?: string;
  addressLine?: string;
  contactPhone?: string;
}) {
  const existing = await db.school.findUnique({ where: { slug: input.slug } });
  if (existing) return existing;
  const made = await db.school.create({
    data: {
      name: input.name,
      slug: input.slug,
      isTestFixture: true,
      code: schoolCode(untagged(input.name)),
      city: input.city,
      country: "India",
      contactEmail: input.contactEmail,
      timezone: "Asia/Kolkata",
      locale: input.locale ?? "en",
      addressLine: input.addressLine ?? null,
      contactPhone: input.contactPhone ?? null,
      gradeLow: input.gradeLow,
      gradeHigh: input.gradeHigh,
      brandPrimary: input.brandPrimary,
      verifiedAt: new Date(),
    },
  });
  // Every school starts with ALUMNI on, as createSchool and registration write it (3 Oct 2026).
  await db.schoolModule.createMany({ data: DEFAULT_SCHOOL_MODULES.map((module) => ({ schoolId: made.id, module })), skipDuplicates: true });
  return made;
}

export async function upsertClass(
  schoolId: string,
  name: string,
  data: { subject: string; gradeLevel: string; section?: string; color: string; room?: string },
) {
  const existing = await db.class.findFirst({ where: { schoolId, name } });
  if (existing) return existing;
  return db.class.create({
    data: { schoolId, name, joinCode: classCode(), ...data },
  });
}

export async function attachTeacher(classId: string, schoolId: string, teacherMembershipId: string, role = "LEAD") {
  const existing = await db.classTeacher.findUnique({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId } },
  });
  if (existing) return existing;
  return db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId, role } });
}

export async function enrol(classId: string, schoolId: string, studentMembershipId: string) {
  const existing = await db.enrollment.findUnique({
    where: { classId_studentMembershipId: { classId, studentMembershipId } },
  });
  if (existing) return existing;
  return db.enrollment.create({ data: { classId, schoolId, studentMembershipId, status: "ACTIVE" } });
}

export async function upsertPeriod(
  schoolId: string,
  spec: { name: string; startMinute: number; endMinute: number; kind: string; position: number },
) {
  const existing = await db.timetablePeriod.findFirst({ where: { schoolId, name: spec.name } });
  if (existing) return existing;
  return db.timetablePeriod.create({ data: { schoolId, ...spec } });
}

export async function upsertSlot(data: {
  schoolId: string;
  classId: string;
  periodId: string;
  weekday: number;
  subject: string;
  teacherMembershipId: string | null;
  room?: string;
}) {
  const existing = await db.timetableSlot.findUnique({
    where: {
      classId_weekday_periodId: {
        classId: data.classId,
        weekday: data.weekday,
        periodId: data.periodId,
      },
    },
  });
  if (existing) return existing;
  return db.timetableSlot.create({ data });
}

export async function link(parentUserId: string, studentMembershipId: string, studentSchoolId: string) {
  const existing = await db.guardianship.findUnique({
    where: { parentUserId_studentMembershipId: { parentUserId, studentMembershipId } },
  });
  if (existing) return existing;
  const now = new Date();
  return db.guardianship.create({
    data: {
      parentUserId,
      studentMembershipId,
      studentSchoolId,
      relation: "PARENT",
      status: "ACTIVE",
      consentSharingAt: now,
      consentNotificationsAt: now,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* teardown                                                                    */
/* -------------------------------------------------------------------------- */

async function teardown() {
  // Schools first: Membership, Class, Enrollment and ClassTeacher all cascade
  // from School, so this clears the school-owned side in one statement.
  const schools = await db.school.deleteMany({ where: { slug: { startsWith: "zz-" } } });
  // Users next: ExpertProfile, Guardianship and any surviving Membership all
  // cascade from User. Matching on the domain is what makes this exact.
  const users = await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
  // expert-registration (15 Oct 2026): a ZZ application is no User, so it goes by its address too.
  await db.expertApplication.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
  console.log(`\n  Removed ${schools.count} ZZ school(s) and ${users.count} ZZ user(s).\n`);
}

/* -------------------------------------------------------------------------- */
/* school A — populated                                                        */
/* -------------------------------------------------------------------------- */

const GRADES = ["3", "4", "5", "6", "7", "8", "9", "10"];
const PER_CLASS = 6;
/** Pupils at these indices in each class get a parent; the rest stay unclaimed. */
const CLAIMED = [0, 1, 2];

export const CLASS_COLOURS = [
  "#f59e0b", "#10b981", "#6366f1", "#ec4899",
  "#0ea5e9", "#84cc16", "#f43f5e", "#8b5cf6",
];

async function buildNorthgate(ctx: Ctx) {
  const school = await upsertSchool({
    name: "ZZ Northgate School",
    slug: "zz-northgate-school",
    city: "Pune",
    contactEmail: `office@${DOMAIN}`,
    gradeLow: "3",
    gradeHigh: "10",
    brandPrimary: "#0f766e",
  });

  /* staff ------------------------------------------------------------------ */
  const admin = await upsertUser(ctx, `zz.admin@${DOMAIN}`, "ZZ Anita Deshmukh");
  await upsertMembership(admin.id, school.id, "ADMIN", { title: "School administrator" });

  const principal = await upsertUser(ctx, `zz.principal@${DOMAIN}`, "ZZ Rohan Iyer");
  await upsertMembership(principal.id, school.id, "PRINCIPAL", { title: "Principal" });

  const teacherSpecs = [
    { email: `zz.teacher1@${DOMAIN}`, name: "ZZ Sunita Kale", title: "Primary lead", subjects: ["Mathematics", "EVS"] },
    { email: `zz.teacher2@${DOMAIN}`, name: "ZZ Imran Shaikh", title: "Class teacher", subjects: ["Science", "Mathematics"] },
    { email: `zz.teacher3@${DOMAIN}`, name: "ZZ Leela Menon", title: "Class teacher", subjects: ["History", "Geography"] },
    { email: `zz.teacher4@${DOMAIN}`, name: "ZZ Vikas Rane", title: "Senior teacher", subjects: ["Science", "Economics"] },
  ];
  const teachers = [];
  for (const spec of teacherSpecs) {
    const user = await upsertUser(ctx, spec.email, spec.name);
    const membership = await upsertMembership(user.id, school.id, "TEACHER", {
      title: spec.title,
      subjects: JSON.stringify(spec.subjects),
    });
    teachers.push({ user, membership });
  }

  // Subject teachers: they appear all over the timetable but are form tutor to
  // nobody, which is the ordinary shape of a music or PE teacher and a case the
  // staffing screens have to handle — "has no class" and "has nothing to do"
  // are different states and only one of them is a problem.
  const subjectSpecs = [
    { email: `zz.subject1@${DOMAIN}`, name: "ZZ Rekha Bhagat", title: "Subject teacher", subjects: ["English"] },
    { email: `zz.subject2@${DOMAIN}`, name: "ZZ Tanmay Godse", title: "Subject teacher", subjects: ["Marathi", "Hindi"] },
    { email: `zz.subject3@${DOMAIN}`, name: "ZZ Nasreen Mirza", title: "Subject teacher", subjects: ["Art", "Music"] },
    { email: `zz.subject4@${DOMAIN}`, name: "ZZ Prakash Salunkhe", title: "Subject teacher", subjects: ["Physical education"] },
  ];
  const subjectTeachers = [];
  for (const spec of subjectSpecs) {
    const user = await upsertUser(ctx, spec.email, spec.name);
    const membership = await upsertMembership(user.id, school.id, "TEACHER", {
      title: spec.title,
      subjects: JSON.stringify(spec.subjects),
    });
    subjectTeachers.push({ user, membership });
  }

  // Genuinely unattached: no form class, no timetable lesson, nothing. What a
  // teacher sees on the morning they are added to a school and before anybody
  // has given them anything — an empty state that only exists for real people.
  const idleSpecs = [
    { email: `zz.spare1@${DOMAIN}`, name: "ZZ Kiran Vaidya", title: "Newly joined", subjects: ["Mathematics"] },
    { email: `zz.spare2@${DOMAIN}`, name: "ZZ Deepak Aher", title: "Relief teacher", subjects: ["Science"] },
  ];
  const idleTeachers = [];
  for (const spec of idleSpecs) {
    const user = await upsertUser(ctx, spec.email, spec.name);
    const membership = await upsertMembership(user.id, school.id, "TEACHER", {
      title: spec.title,
      subjects: JSON.stringify(spec.subjects),
    });
    idleTeachers.push({ user, membership });
  }

  /* classes, pupils, parents ------------------------------------------------ */
  const unclaimed: { name: string; code: string; birthdate: string; grade: string }[] = [];
  const builtClasses: { id: string; grade: string }[] = [];
  const claimedParents: { parent: string; child: string }[] = [];
  let nameIndex = 0;
  let studentSeq = 0;
  // Held back so one parent can be given a second child in a different grade —
  // the multi-pupil case a parent dashboard has to order correctly.
  let firstClaimedParentUserId: string | null = null;
  let secondChildDone = false;

  for (const [gradeIndex, grade] of GRADES.entries()) {
    const cls = await upsertClass(school.id, `ZZ Grade ${grade} · A`, {
      subject: "Form group",
      gradeLevel: grade,
      section: "A",
      color: CLASS_COLOURS[gradeIndex % CLASS_COLOURS.length]!,
      room: `R${grade}01`,
    });
    // Four teachers, eight classes: each holds two, so every teacher has a
    // realistic load and no class is left without a register-taker.
    const teacher = teachers[gradeIndex % teachers.length]!;
    await attachTeacher(cls.id, school.id, teacher.membership.id);
    builtClasses.push({ id: cls.id, grade });

    for (let seat = 0; seat < PER_CLASS; seat++) {
      studentSeq++;
      const name = studentName(nameIndex++);
      const email = `zz.pupil${String(studentSeq).padStart(2, "0")}@${DOMAIN}`;
      // A pupil in grade G is about G+5 years old. Fixed day and month so the
      // birthdate a parent must type to claim does not move between runs.
      const birthYear = THIS_YEAR - (Number(grade) + 5);
      const birthdate = new Date(Date.UTC(birthYear, (seat * 2) % 12, 10 + seat));

      const user = await upsertUser(ctx, email, name, { birthdate, isMinor: true });
      const existing = await db.membership.findUnique({
        where: { userId_schoolId_role: { userId: user.id, schoolId: school.id, role: "STUDENT" } },
      });
      const membership =
        existing ??
        (await db.membership.create({
          data: {
            userId: user.id,
            schoolId: school.id,
            role: "STUDENT",
            status: "ACTIVE",
            gradeLevel: grade,
            studentCode: studentCode(),
          },
        }));
      await enrol(cls.id, school.id, membership.id);

      if (CLAIMED.includes(seat)) {
        const parentEmail = `zz.parent${String(studentSeq).padStart(2, "0")}@${DOMAIN}`;
        const parent = await upsertUser(ctx, parentEmail, `ZZ ${name.split(" ")[2]} (parent)`);
        await link(parent.id, membership.id, school.id);
        claimedParents.push({ parent: parentEmail, child: name });
        if (firstClaimedParentUserId === null) firstClaimedParentUserId = parent.id;
      } else {
        unclaimed.push({
          name,
          code: membership.studentCode!,
          birthdate: birthdate.toISOString().slice(0, 10),
          grade,
        });
      }

      // Give the very first parent a second child, three grades up, so the
      // multi-pupil switcher has a real case to render.
      if (grade === "6" && seat === 3 && firstClaimedParentUserId && !secondChildDone) {
        await link(firstClaimedParentUserId, membership.id, school.id);
        secondChildDone = true;
        // It is now claimed after all, so take it back out of the unclaimed list.
        unclaimed.pop();
      }
    }
  }

  const timetable = await buildTimetable(school.id, builtClasses, [...teachers, ...subjectTeachers]);

  return {
    school, unclaimed, claimedParents, teachers, subjectTeachers, idleTeachers,
    admin, principal, timetable,
  };
}

/* -------------------------------------------------------------------------- */
/* the modules and their roles (3 Oct 2026)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Switches modules on for a fixture school, as its admin would: Northgate has
 * every module on, so the sweeps reach every module's doors; Southbank keeps
 * the default (ALUMNI alone), which is where a MODULE_OFF refusal is tried
 * (tests/modules.test.ts).
 */
export async function switchModulesOn(school: { id: string }, modules: readonly string[] = SCHOOL_MODULES, byUserId: string | null = null) {
  // Only what the institution's kind is offered (4 Oct 2026): a school asked for "every module" gets the school version's six, not the college's.
  const kind = (await db.school.findUnique({ where: { id: school.id }, select: { kind: true } }))?.kind;
  const offered = modulesForKind(kind);
  await db.schoolModule.createMany({ data: modules.filter((module) => (offered as readonly string[]).includes(module)).map((module) => ({ schoolId: school.id, module, enabledByUserId: byUserId })), skipDuplicates: true });
  return db.schoolModule.count({ where: { schoolId: school.id } });
}

/**
 * One person in each module role (3 Oct 2026): a bus driver, the library's
 * desk and a warden as staff memberships, and an alumnus — a pupil who left
 * last April, whose closed STUDENT membership and leaving record sit beside
 * the open ALUMNUS one, exactly as recordDeparture leaves them. `tag` keeps
 * the demo schools' names apart from Northgate's.
 */
export async function buildModuleRoles(
  ctx: Ctx,
  school: { id: string; name: string },
  adminMembershipId: string,
  spec: { domain: string; prefix: string; driver: string; librarian: string; warden: string; alumnus: { name: string; email: string; classId: string; grade: string; birthdate: Date } },
) {
  const staff = [
    { email: `${spec.prefix}driver01@${spec.domain}`, name: spec.driver, role: "DRIVER", title: "Bus driver, route 1" },
    { email: `${spec.prefix}librarian@${spec.domain}`, name: spec.librarian, role: "LIBRARIAN", title: "Librarian" },
    { email: `${spec.prefix}warden@${spec.domain}`, name: spec.warden, role: "WARDEN", title: "Hostel warden" },
  ];
  const made: Record<string, string> = {};
  for (const p of staff) {
    const user = await upsertUser(ctx, p.email, p.name);
    const membership = await upsertMembership(user.id, school.id, p.role, { title: p.title });
    made[p.role] = membership.id;
  }
  const departed = await buildDepartures(ctx, school, adminMembershipId, {
    leaver: { email: spec.alumnus.email, name: spec.alumnus.name, classId: spec.alumnus.classId, grade: spec.alumnus.grade, birthdate: spec.alumnus.birthdate, joinedOn: new Date("2020-06-15T04:00:00Z"), leftOn: new Date("2026-04-30T06:30:00Z"), destination: "Junior college, Pune", note: "Finished grade 10.", conduct: "GOOD" },
    scheduled: null,
  });
  const alumnus = await db.membership.findFirst({ where: { schoolId: school.id, role: "ALUMNUS", user: { email: spec.alumnus.email } }, select: { id: true } });
  return { driver: made.DRIVER!, librarian: made.LIBRARIAN!, warden: made.WARDEN!, alumnus: alumnus?.id ?? null, leaverRecordId: departed.recordId };
}

/* -------------------------------------------------------------------------- */
/* people waiting for a yes                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fixed ids, so the API sweep can renew the rows before it reads them
 * (scripts/api-sweep.ts). Northgate's are the first pair, as they always
 * were; every other school's carry the school's tag.
 */
export const WAITING_JOIN_ID = "zz-fixture-join";
export const WAITING_CLAIM_ID = "zz-fixture-claim";
export const waitingIds = (tag: string) => ({
  join: tag ? `${WAITING_JOIN_ID}-${tag}` : WAITING_JOIN_ID,
  claim: tag ? `${WAITING_CLAIM_ID}-${tag}` : WAITING_CLAIM_ID,
  /** A join by another class's code, and a claim on another family's child: what the sweep's own teacher and parent may not decide. */
  otherJoin: `${WAITING_JOIN_ID}-other${tag ? `-${tag}` : ""}`,
  otherClaim: `${WAITING_CLAIM_ID}-other${tag ? `-${tag}` : ""}`,
});

/**
 * People waiting for a yes. At Northgate: one pupil who typed the grade-3
 * class's code and one person who claimed pupil 01, so the class's teacher,
 * the office and pupil 01's parent each have something in their queue and
 * the API sweep has an id for each decide endpoint; and beside them a join
 * by ANOTHER class's code and a claim on ANOTHER family's child, which the
 * sweep's teacher and parent must be refused (the cross-person probe). At
 * every other school the first pair alone, for the cross-school probe to
 * try from outside. The sweep sends no decision the door accepts, so they
 * stay waiting; a second run finds the same rows and makes them new again,
 * which keeps them inside the thirty days a request lives
 * (lib/request-expiry.ts).
 */
/**
 * A family's asks to change the pupil record: one the office declined, on
 * the named pupil (the sweep's own, so that deciding it and taking it back
 * are both answered as it stands and change nothing), and with `waiting`
 * one still waiting on another pupil, so the office's page has a row. Fixed
 * ids, so a second run finds the same rows.
 */
export async function buildRecordChanges(school: { id: string }, adminUserId: string, opts: { tag?: string; pupilEmail?: string; waiting?: boolean } = {}) {
  const suffix = opts.tag ? `-${opts.tag}` : "";
  const pupils = await db.membership.findMany({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", leftAt: null }, orderBy: { id: "asc" }, select: { id: true, userId: true, user: { select: { email: true } } } });
  const own = pupils.find((p) => p.user.email === opts.pupilEmail) ?? pupils[0];
  if (!own) throw new Error("buildRecordChanges: the school has no pupil");
  const guardianOf = async (studentMembershipId: string, fallback: string) => (await db.guardianship.findFirst({ where: { studentMembershipId, status: "ACTIVE", relation: { not: "SCHOOL" } }, orderBy: { id: "asc" }, select: { parentUserId: true } }))?.parentUserId ?? fallback;
  // What the API sweep left waiting on its own pupil goes, so a rebuilt fixture is the fixture and nothing more.
  await db.recordChangeRequest.deleteMany({ where: { schoolId: school.id, reason: "ZZ sweep" } });
  const declinedId = `zz-fixture-record-change${suffix}`;
  const declined = { schoolId: school.id, studentMembershipId: own.id, requestedByUserId: await guardianOf(own.id, own.userId), byPupil: false, changesJson: JSON.stringify([{ field: "addressLine", from: null, to: "ZZ 14 Shivaji Nagar" }]), reason: "We have moved house.", status: "DECLINED", decidedAt: new Date(), decidedByUserId: adminUserId, declineReason: "Please bring the rent agreement to the office." };
  await db.recordChangeRequest.upsert({ where: { id: declinedId }, create: { id: declinedId, ...declined }, update: declined });
  let waiting: string | null = null;
  const other = pupils.find((p) => p.id !== own.id);
  if (opts.waiting && other) {
    waiting = `zz-fixture-record-change-waiting${suffix}`;
    const data = { schoolId: school.id, studentMembershipId: other.id, requestedByUserId: await guardianOf(other.id, other.userId), byPupil: false, changesJson: JSON.stringify([{ field: "motherOccupation", from: null, to: "Nurse" }, { field: "bloodGroup", from: null, to: "B+" }]), reason: "These were blank on the form.", status: "PENDING", decidedAt: null, decidedByUserId: null, declineReason: null, createdAt: new Date() };
    // Whatever else waits on that pupil gives way: one waits per pupil.
    await db.recordChangeRequest.deleteMany({ where: { schoolId: school.id, studentMembershipId: other.id, status: "PENDING", id: { not: waiting } } });
    await db.recordChangeRequest.upsert({ where: { id: waiting }, create: { id: waiting, ...data }, update: data });
  }
  return { declined: declinedId, waiting };
}

/**
 * Signatures and the seal: the admin's and the head's own, the school's
 * seal, and on the school's first issued certificate the admin's signature
 * already drawn (deciding it again answers it as it stands, which is what
 * the sweep does) and the head's still waiting, so the head's page has a
 * paper to sign. The pictures are made here and are in no file.
 */
export async function buildSignatures(school: { id: string }, people: { adminUserId: string; principalUserId?: string | null }) {
  const signature = new Uint8Array(fixturePng(300, 100));
  const seal = new Uint8Array(fixturePng(200, 200));
  const member = (userId: string, role: string) => db.membership.findFirst({ where: { schoolId: school.id, userId, role, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } } });
  const admin = await member(people.adminUserId, "ADMIN");
  const head = people.principalUserId ? await member(people.principalUserId, "PRINCIPAL") : null;
  for (const who of [admin, head]) {
    if (who) await db.signatureImage.upsert({ where: { membershipId: who.id }, create: { schoolId: school.id, kind: "PERSON", membershipId: who.id, png: signature }, update: { png: signature } });
  }
  await db.signatureImage.deleteMany({ where: { schoolId: school.id, kind: "SEAL" } });
  await db.signatureImage.create({ data: { schoolId: school.id, kind: "SEAL", png: seal } });
  const paper = await db.issuedCertificate.findFirst({ where: { schoolId: school.id, revokedAt: null }, orderBy: { issuedAt: "asc" }, select: { id: true } });
  await db.paperSignature.deleteMany({ where: { schoolId: school.id } });
  if (paper && admin) {
    await db.paperSignature.create({ data: { schoolId: school.id, paperKind: "CERTIFICATE", paperId: paper.id, slot: "LEFT", role: "ADMIN", status: "SIGNED", signerUserId: people.adminUserId, signerName: admin.user.name, png: signature, requestedByUserId: people.adminUserId, decidedAt: new Date() } });
    await db.paperSignature.create({ data: { schoolId: school.id, paperKind: "CERTIFICATE", paperId: paper.id, slot: "RIGHT", role: "PRINCIPAL", status: "PENDING", requestedByUserId: people.adminUserId } });
    await db.paperSignature.create({ data: { schoolId: school.id, paperKind: "CERTIFICATE", paperId: paper.id, slot: "SEAL", status: "SIGNED", png: seal, requestedByUserId: people.adminUserId, decidedAt: new Date() } });
  }
  // And the admin's signature on a second certificate, another pupil's, for the cross-person probe to be refused.
  const other = await db.issuedCertificate.findFirst({ where: { schoolId: school.id, revokedAt: null, ...(paper ? { id: { not: paper.id } } : {}) }, orderBy: { issuedAt: "asc" }, select: { id: true } });
  if (other && admin) await db.paperSignature.create({ data: { schoolId: school.id, paperKind: "CERTIFICATE", paperId: other.id, slot: "LEFT", role: "ADMIN", status: "SIGNED", signerUserId: people.adminUserId, signerName: admin.user.name, png: signature, requestedByUserId: people.adminUserId, decidedAt: new Date() } });
  // A published set of report cards, signed as a set: its class teacher's drawn, the head's waiting on all of its cards at once.
  const card = await db.reportCard.findFirst({ where: { schoolId: school.id, status: "PUBLISHED" }, orderBy: [{ publishedAt: "asc" }, { id: "asc" }], select: { classId: true, title: true } });
  const lead = card ? await db.classTeacher.findFirst({ where: { classId: card.classId, schoolId: school.id, role: "LEAD" }, select: { teacher: { select: { id: true, userId: true, user: { select: { name: true } } } } } }) : null;
  if (card && lead) {
    await db.signatureImage.upsert({ where: { membershipId: lead.teacher.id }, create: { schoolId: school.id, kind: "PERSON", membershipId: lead.teacher.id, png: signature }, update: { png: signature } });
    const set = `${card.classId}|${card.title}`;
    await db.paperSignature.create({ data: { schoolId: school.id, paperKind: "REPORT_CARD_SET", paperId: set, slot: "LEFT", role: "TEACHER", status: "SIGNED", signerUserId: lead.teacher.userId, signerName: lead.teacher.user.name, png: signature, requestedByUserId: lead.teacher.userId, decidedAt: new Date() } });
    await db.paperSignature.create({ data: { schoolId: school.id, paperKind: "REPORT_CARD_SET", paperId: set, slot: "RIGHT", role: "PRINCIPAL", status: "PENDING", requestedByUserId: lead.teacher.userId } });
  }
  return { paperId: paper?.id ?? null, cardSet: card ? `${card.title}` : null };
}

/**
 * A teacher's questions for the practice bank (gigs, decision 0004): one that
 * waits for the content team, one returned with a note and one the teacher
 * took back, all by the lead of Grade 3, who is the teacher the sweep signs
 * in as; and where that teacher is paid. NONE IS ADDED TO THE BANK: the bank
 * is every school's, and a fixture's question in it would be set to real
 * pupils. The rows are this teacher's own and are rebuilt each run.
 */
export async function buildGigQuestions(school: { id: string; name: string }) {
  const lead = await db.classTeacher.findFirst({ where: { schoolId: school.id, role: "LEAD", class: { gradeLevel: "3", archivedAt: null } }, select: { teacher: { select: { userId: true } } } });
  const topic = await db.quizTopic.findFirst({ where: { retiredAt: null, subject: "MATHS" }, orderBy: [{ classLevel: "asc" }, { position: "asc" }], select: { id: true, name: true } });
  await db.gigSettings.upsert({ where: { id: "gigs" }, create: { id: "gigs" }, update: {} });
  if (!lead || !topic) return { waiting: null, topic: null };
  const userId = lead.teacher.userId;
  await db.gigPayee.upsert({ where: { userId }, create: { userId, upiId: "zz.teacher@zzbank", payeeName: "ZZ Teacher" }, update: {} });
  // Only what the fixtures made and nobody added to the bank: an accepted one has an earning, and is somebody's test or somebody's work.
  await db.questionContribution.deleteMany({ where: { authorUserId: userId, stem: { startsWith: "ZZ " }, status: { not: "ACCEPTED" } } });
  const base = { authorUserId: userId, authorSchoolId: school.id, authorSchoolName: school.name, topicId: topic.id, difficulty: 1, answerIndex: 1, choices: JSON.stringify(["7", "8", "9", "10"]), choicesHi: JSON.stringify(["7", "8", "9", "10"]), choicesMr: JSON.stringify(["7", "8", "9", "10"]), termsAcceptedAt: new Date() };
  const text = (n: string) => ({ stem: `ZZ What is three more than ${n}?`, solution: "Count on three from the number.", stemHi: `ZZ ${n} से तीन अधिक कितना है?`, solutionHi: "संख्या से आगे तीन गिनें।", stemMr: `ZZ ${n} पेक्षा तीन जास्त किती?`, solutionMr: "संख्येपासून पुढे तीन मोजा." });
  const waiting = await db.questionContribution.create({ data: { ...base, ...text("five"), status: "SUBMITTED" }, select: { id: true } });
  await db.questionContribution.create({ data: { ...base, ...text("six"), answerIndex: 2, status: "RETURNED", reviewNote: "ZZ Write the number as a numeral in all three languages.", reviewedAt: new Date() } });
  await db.questionContribution.create({ data: { ...base, ...text("seven"), answerIndex: 3, status: "WITHDRAWN" } });
  // And one by ANOTHER teacher, which the first must not be able to read, change or take back (the cross-person probe).
  const other = await db.classTeacher.findFirst({ where: { schoolId: school.id, role: "LEAD", teacher: { userId: { not: userId } } }, orderBy: { id: "asc" }, select: { teacher: { select: { userId: true } } } });
  if (other) {
    await db.questionContribution.deleteMany({ where: { authorUserId: other.teacher.userId, stem: { startsWith: "ZZ " }, status: { not: "ACCEPTED" } } });
    await db.questionContribution.create({ data: { ...base, ...text("eight"), authorUserId: other.teacher.userId, answerIndex: 0, status: "SUBMITTED" } });
  }
  return { waiting: waiting.id, topic: topic.name };
}

/**
 * Sessions and workshops (gigs, decision 0004). Northgate's teachers may offer guidance; the first ZZ
 * expert offers a one-to-one that pupil 01 has a confirmed seat in (booked by their parent), a workshop
 * with pupil 02 in it, an open one-to-one, and one last week that pupil 01's family said was not held;
 * the lead of Grade 3 offers an open half hour. At the second school a teacher offers one that a pupil
 * of theirs has a seat in, so that the cross-school probe has a booking to be refused. Rebuilt each run.
 */
export async function buildGigSessions(northgate: { id: string }, southbank: { id: string }) {
  const expert = await db.user.findUnique({ where: { email: `zz.expert1@${DOMAIN}` }, select: { id: true, expertProfile: { select: { publishedAt: true } } } });
  const lead = await db.classTeacher.findFirst({ where: { schoolId: northgate.id, role: "LEAD", class: { gradeLevel: "3", archivedAt: null } }, select: { teacher: { select: { userId: true } } } });
  const otherTeacher = await db.membership.findFirst({ where: { schoolId: southbank.id, role: "TEACHER", status: "ACTIVE", leftAt: null }, orderBy: { id: "asc" }, select: { userId: true } });
  // The guidance switch on; and the two ages the office sets for what a
  // pupil may read of their own (health card and incidents, fee dues) at
  // eight, so the sweep's pupil — zz.pupil01, in grade 3 — is let through
  // the doors the catalog lists STUDENT on. A fixture, not a real school.
  await db.school.updateMany({ where: { id: { in: [northgate.id, southbank.id] } }, data: { teacherGuidanceOn: true, selfReadAge: 8, pupilFeeViewAge: 8 } });
  const providers = [expert?.id, lead?.teacher.userId, otherTeacher?.userId].filter((id): id is string => Boolean(id));
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: providers }, title: { startsWith: "ZZ " } } });
  if (!expert?.expertProfile?.publishedAt) return { confirmed: null };
  const pupil = async (email: string) => db.membership.findFirst({ where: { schoolId: northgate.id, role: "STUDENT", status: "ACTIVE", user: { email } }, select: { id: true, guardianships: { where: { status: "ACTIVE" }, take: 1, select: { parentUserId: true } } } });
  const [p1, p2] = [await pupil(`zz.pupil01@${DOMAIN}`), await pupil(`zz.pupil02@${DOMAIN}`)];
  const year = async (schoolId: string) => (await db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true } }))?.id ?? null;
  // Whole hours from now, so a rebuild never leaves a slot in the past that should be ahead.
  const at = (days: number, hour = 10) => { const d = new Date(Date.now() + days * 86_400_000); d.setUTCHours(hour, 0, 0, 0); return d; };
  const slot = (providerUserId: string, providerKind: string, teacherSchoolId: string | null, kind: string, title: string, startsAt: Date, minutes: number, seats: number, seatsTaken: number) =>
    db.gigSlot.create({ data: { providerUserId, providerKind, teacherSchoolId, kind, title, startsAt, endsAt: new Date(startsAt.getTime() + minutes * 60_000), meetingUrl: `https://meet.zz.test/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, seats, seatsTaken }, select: { id: true } });
  const seat = (schoolId: string, slotId: string, studentMembershipId: string, providerUserId: string, kind: string, status: string, bookedByUserId: string, academicYearId: string | null, purpose: string) =>
    db.gigBooking.create({ data: { schoolId, slotId, studentMembershipId, providerUserId, kind, status, bookedByUserId, purpose, academicYearId, consentAt: new Date(), consentUserId: bookedByUserId, closedAt: status === "UNHELD" ? new Date() : null }, select: { id: true } });
  const yearN = await year(northgate.id);
  let confirmed: string | null = null;
  if (p1) {
    const by = p1.guardianships[0]?.parentUserId ?? expert.id;
    const a = await slot(expert.id, "EXPERT", null, "ONE_TO_ONE", "ZZ Ask an engineer about her work", at(7), 30, 1, 1);
    confirmed = (await seat(northgate.id, a.id, p1.id, expert.id, "ONE_TO_ONE", "CONFIRMED", by, yearN, "ZZ How does somebody become an engineer?")).id;
    const d = await slot(expert.id, "EXPERT", null, "ONE_TO_ONE", "ZZ Olympiad maths, one to one", at(-3), 30, 1, 1);
    await seat(northgate.id, d.id, p1.id, expert.id, "ONE_TO_ONE", "UNHELD", by, yearN, "ZZ Help with last year's paper.");
  }
  const b = await slot(expert.id, "EXPERT", null, "WORKSHOP", "ZZ Bridges: build one from paper", at(10), 60, 20, (p2 ? 1 : 0) + (p1?.guardianships[0] ? 1 : 0));
  if (p2) await seat(northgate.id, b.id, p2.id, expert.id, "WORKSHOP", "CONFIRMED", p2.guardianships[0]?.parentUserId ?? expert.id, yearN, "ZZ She builds things from card at home.");
  // A PAID seat for pupil 01 in the same workshop, bought by their guardian and on hold for the expert
  // (decision 0004 as amended): the row the sweep reads GET /gigs/payments/{paymentId} with. The slot
  // carries the price the seat was bought at; the expert's own gate is not asked for a fixture row.
  // Razorpay Route (decision 0004, third amendment of 2 October 2026): ₹100 gross, ₹15 commission, ₹2.70 GST on it, ₹82.30 held by the gateway for the expert.
  // The fixture's receipt and invoice numbers sit in their own "ZZ" series, so a real capture on the same server never meets them.
  const fy = (() => { const d = new Date(); const y = d.getUTCMonth() + 1 >= 4 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; return `${y}-${String((y + 1) % 100).padStart(2, "0")}`; })();
  const payer = p1?.guardianships[0]?.parentUserId ?? null;
  await db.expertPayout.deleteMany({ where: { expertUserId: expert.id, reference: { startsWith: "ZZFIXTURE" } } });
  // The ZZ expert's Route linked account, as the devbox gateway would have activated it: no sealed bank account or PAN
  // in a fixture (the "Get paid" card shows none), the gateway's ids made up in the fixture's own namespace.
  const linked = { payeeName: "Meenakshi Rao", upiId: null, bankAccountEnc: null, bankLast4: null, ifsc: null, panEnc: null, panLast4: null, addressLine: "ZZ 12 Shaniwar Peth", city: "Pune", postalCode: "411030", phone: "9800000001", gstStateCode: "27", gstin: null, status: "ACTIVE", note: null, linkedAccountId: "acc_zzfixturerao01", stakeholderId: "sth_zzfixturerao01", routeProductId: "acc_prd_zzfixturerao01", routeStatus: "ACTIVATED", routeRequirements: "[]", routeSubmittedKey: null, routeCheckedAt: new Date(), routeError: null };
  await db.expertPayoutAccount.upsert({ where: { expertUserId: expert.id }, create: { expertUserId: expert.id, ...linked }, update: linked });
  if (p1 && payer) {
    await db.gigSlot.update({ where: { id: b.id }, data: { pricePaise: 10000 } });
    const paidSeat = await db.gigBooking.create({ data: { schoolId: northgate.id, slotId: b.id, studentMembershipId: p1.id, providerUserId: expert.id, kind: "WORKSHOP", status: "CONFIRMED", bookedByUserId: payer, purpose: "ZZ A second workshop past the free two: paid for.", academicYearId: yearN, consentAt: new Date(), consentUserId: payer, paid: true }, select: { id: true } });
    await db.sessionPayment.create({ data: { bookingId: paidSeat.id, slotId: b.id, payerUserId: payer, expertUserId: expert.id, amountPaise: 10000, commissionPaise: 1500, gstPaise: 270, netPaise: 8230, receiptNumber: `ZZ-R/${fy}/0001`, receiptSerial: 1, orderId: `order_zzfixture${paidSeat.id.slice(-10)}`, paymentId: `pay_zzfixture${paidSeat.id.slice(-10)}`, paidAt: new Date(), status: "HELD", path: "ROUTE", transferId: `trf_zzfixture${paidSeat.id.slice(-10)}` } });
  }
  // A workshop held last month whose seat the company paid the expert for by hand (the second amendment's path, kept readable), with the tax invoice for its commission:
  // the rows the expert's earnings, the operator's "paid" list and the invoice PDF doors read.
  const payer2 = p2?.guardianships[0]?.parentUserId ?? null;
  if (p2 && payer2) {
    const past = await slot(expert.id, "EXPERT", null, "WORKSHOP", "ZZ Paper bridges, the first workshop", at(-30), 60, 20, 1);
    await db.gigSlot.update({ where: { id: past.id }, data: { pricePaise: 10000 } });
    const paidOut = await db.gigBooking.create({ data: { schoolId: northgate.id, slotId: past.id, studentMembershipId: p2.id, providerUserId: expert.id, kind: "WORKSHOP", status: "DELIVERED", bookedByUserId: payer2, purpose: "ZZ A paid seat the company has settled with the expert.", academicYearId: yearN, consentAt: at(-31), consentUserId: payer2, closedAt: at(-30, 11), paid: true }, select: { id: true } });
    const payout = await db.expertPayout.create({ data: { expertUserId: expert.id, netPaise: 8230, paymentsCount: 1, status: "PAID", reference: "ZZFIXTUREUTR0001", paidAt: at(-26), note: "ZZ fixture: paid from the company's bank" }, select: { id: true } });
    await db.sessionPayment.create({ data: { bookingId: paidOut.id, slotId: past.id, payerUserId: payer2, expertUserId: expert.id, amountPaise: 10000, commissionPaise: 1500, gstPaise: 270, netPaise: 8230, receiptNumber: `ZZ-R/${fy}/0002`, receiptSerial: 2, orderId: `order_zzfixture${paidOut.id.slice(-10)}`, paymentId: `pay_zzfixture${paidOut.id.slice(-10)}`, paidAt: at(-31), holdUntil: at(-28, 11), dueAt: at(-27), paidOutAt: at(-26), status: "PAID_OUT", path: "COMPANY", payoutId: payout.id } });
    await db.gigInvoice.create({
      data: {
        number: `ZZ/${fy}/0001`, series: `ZZ/${fy}`, serial: 1, payoutId: payout.id, expertUserId: expert.id, issuedAt: at(-26), locale: "en",
        taxableValuePaise: 1500, cgstPaise: 135, sgstPaise: 135, igstPaise: 0, totalPaise: 1770, sacCode: "998599",
        sellerJson: JSON.stringify({ name: "ZZ Shalaghar Fixtures Private Limited", gstin: "27AAACZ9999Z1Z5", address: "ZZ 1, Fixture Road, Pune 411001", stateCode: "27" }),
        buyerJson: JSON.stringify({ name: "Meenakshi Rao", gstin: null, address: null, stateCode: "27" }),
        linesJson: JSON.stringify([{ paymentId: "zz-fixture", title: "ZZ Paper bridges, the first workshop", date: at(-30).toISOString().slice(0, 10), grossPaise: 10000, commissionPaise: 1500, gstPaise: 270 }]),
      },
    });
  }
  await slot(expert.id, "EXPERT", null, "ONE_TO_ONE", "ZZ Careers in applied science", at(14), 30, 1, 0);
  if (lead) await slot(lead.teacher.userId, "TEACHER", northgate.id, "ONE_TO_ONE", "ZZ Reading aloud, a half hour", at(5, 9), 30, 1, 0);
  const southPupil = await db.membership.findFirst({ where: { schoolId: southbank.id, role: "STUDENT", status: "ACTIVE", leftAt: null }, orderBy: { id: "asc" }, select: { id: true, userId: true } });
  if (otherTeacher && southPupil) {
    const f = await slot(otherTeacher.userId, "TEACHER", southbank.id, "ONE_TO_ONE", "ZZ Fractions before the unit test", at(6, 9), 30, 1, 1);
    await seat(southbank.id, f.id, southPupil.id, otherTeacher.userId, "ONE_TO_ONE", "CONFIRMED", southPupil.userId, await year(southbank.id), "ZZ Fractions with unlike denominators.");
  }
  return { confirmed };
}

export async function buildWaiting(ctx: Ctx, school: { id: string }, opts: { tag?: string; pupilEmail?: string; others?: boolean } = {}) {
  const ids = waitingIds(opts.tag ?? "");
  const joiner = await upsertUser(ctx, `zz.joiner01@${DOMAIN}`, "ZZ Ira Gokhale", { birthdate: new Date("2017-08-14T00:00:00Z"), isMinor: true });
  const claimant = await upsertUser(ctx, `zz.claimant01@${DOMAIN}`, "ZZ Vasant Apte");
  const classes = await db.class.findMany({ where: { schoolId: school.id, archivedAt: null }, orderBy: [{ gradeLevel: "asc" }, { name: "asc" }], select: { id: true, gradeLevel: true } });
  const sorted = [...classes].sort((a, b) => Number(a.gradeLevel) - Number(b.gradeLevel));
  const first = sorted[0];
  if (!first) throw new Error("buildWaiting: the school has no class to ask to join");
  const pupil = await db.membership.findFirstOrThrow({
    where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", leftAt: null, ...(opts.pupilEmail ? { user: { email: opts.pupilEmail } } : {}) },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  const fresh = { status: "PENDING", createdAt: new Date(), decidedAt: null, declineReason: null };
  const join = (id: string, classId: string) =>
    db.joinRequest.upsert({ where: { id }, create: { id, schoolId: school.id, userId: joiner.id, classId, via: "CLASS" }, update: { ...fresh, decidedByMembershipId: null, classId }, select: { id: true } });
  const claim = (id: string, studentMembershipId: string) =>
    db.guardianClaim.upsert({ where: { id }, create: { id, schoolId: school.id, studentMembershipId, claimantUserId: claimant.id, relation: "GUARDIAN" }, update: { ...fresh, decidedByUserId: null, studentMembershipId }, select: { id: true } });
  const made = { join: await join(ids.join, first.id), claim: await claim(ids.claim, pupil.id), otherJoin: null as { id: string } | null, otherClaim: null as { id: string } | null };
  if (opts.others) {
    // A class the first class's teachers do not teach, and a pupil the first pupil's guardians do not guard.
    const teachers = (await db.classTeacher.findMany({ where: { classId: first.id }, select: { teacherMembershipId: true } })).map((t) => t.teacherMembershipId);
    const otherClass = await db.class.findFirst({ where: { schoolId: school.id, archivedAt: null, id: { not: first.id }, teachers: { none: { teacherMembershipId: { in: teachers } } } }, orderBy: { name: "asc" }, select: { id: true } });
    const guardians = (await db.guardianship.findMany({ where: { studentMembershipId: pupil.id, status: "ACTIVE" }, select: { parentUserId: true } })).map((g) => g.parentUserId);
    const otherPupil = await db.membership.findFirst({
      where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", leftAt: null, id: { not: pupil.id }, guardianships: { none: { parentUserId: { in: guardians }, status: "ACTIVE" } } },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (otherClass) made.otherJoin = await join(ids.otherJoin, otherClass.id);
    if (otherPupil) made.otherClaim = await claim(ids.otherClaim, otherPupil.id);
  }
  return made;
}

/* -------------------------------------------------------------------------- */
/* fees                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Northgate's fees: the current academic year (the fixture had none, and a
 * structure needs one), three heads, one published structure for grade 3
 * with a past and a future instalment, every grade-3 pupil on it, and one
 * cash payment with its receipt so the API sweep has a PAID payment and a
 * receipt to read. Written directly in the shapes fees.ts produces, so a
 * second run finds the same rows and adds nothing.
 */
export async function buildFees(
  school: { id: string; name: string; city?: string | null },
  adminUserId: string,
  opts: { grades?: string[]; payers?: number; clientTag?: string } = {},
) {
  const grades = opts.grades ?? ["3"];
  const payers = opts.payers ?? 1;
  const clientTag = opts.clientTag ?? "zz-fixture";
  const year =
    (await db.academicYear.findFirst({ where: { schoolId: school.id, isCurrent: true } })) ??
    (await db.academicYear.create({
      data: { schoolId: school.id, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true },
    }));
  const headSpecs = [
    { code: "TUI", name: "Tuition", kind: "TUITION", sortOrder: 0 },
    { code: "TRN", name: "Transport", kind: "TRANSPORT", sortOrder: 1 },
    { code: "EXM", name: "Examination", kind: "EXAM", sortOrder: 2 },
    // A head of the kind Other: the fee on a certificate request lands on it (10 Oct 2026, the demo office could set none).
    { code: "OTH", name: "Certificates and other charges", kind: "OTHER", sortOrder: 3 },
  ];
  const heads: Record<string, string> = {};
  for (const spec of headSpecs) {
    const row = await db.feeHead.upsert({ where: { schoolId_code: { schoolId: school.id, code: spec.code } }, update: {}, create: { schoolId: school.id, ...spec } });
    heads[spec.code] = row.id;
  }
  const collector = await db.user.findUniqueOrThrow({ where: { id: adminUserId }, select: { name: true } });
  const structures: { id: string; name: string; gradeLevel: string | null }[] = [];
  let onPlans = 0;
  for (const [gi, grade] of grades.entries()) {
    const name = `${TAG.prefix}Grade ${grade} fees`;
    // Tuition rises a little with the grade so two structures never read the same.
    const tuition = 12_000_00 + gi * 500_00;
    let structure = await db.feeStructure.findFirst({ where: { schoolId: school.id, academicYearId: year.id, name }, include: { instalments: true } });
    if (!structure) {
      structure = await db.feeStructure.create({
        data: {
          schoolId: school.id,
          academicYearId: year.id,
          name,
          gradeLevel: grade,
          publishedAt: new Date(),
          instalments: {
            create: [
              { schoolId: school.id, label: "Term 1", sortOrder: 0, dueDate: new Date("2026-07-15T00:00:00Z"), lines: { create: [{ schoolId: school.id, headId: heads.TUI!, amountPaise: tuition }, { schoolId: school.id, headId: heads.TRN!, amountPaise: 3_000_00 }] } },
              { schoolId: school.id, label: "Term 2", sortOrder: 1, dueDate: new Date("2026-12-15T00:00:00Z"), lines: { create: [{ schoolId: school.id, headId: heads.TUI!, amountPaise: tuition }, { schoolId: school.id, headId: heads.EXM!, amountPaise: 500_00 }] } },
            ],
          },
        },
        include: { instalments: true },
      });
    }
    structures.push({ id: structure.id, name: structure.name, gradeLevel: structure.gradeLevel });
    const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: grade, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    const pupils = klass ? await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true }, orderBy: { studentMembershipId: "asc" } }) : [];
    const lines = await db.feeLine.findMany({ where: { instalmentId: { in: structure.instalments.map((i) => i.id) } }, include: { head: { select: { code: true, name: true } } } });
    for (const { studentMembershipId } of pupils) {
      await db.studentFeePlan.upsert({
        where: { studentMembershipId_academicYearId: { studentMembershipId, academicYearId: year.id } },
        update: {},
        create: { schoolId: school.id, studentMembershipId, structureId: structure.id, academicYearId: year.id },
      });
      for (const inst of structure.instalments) {
        const mine = lines.filter((l) => l.instalmentId === inst.id);
        const gross = mine.reduce((a, l) => a + l.amountPaise, 0);
        await db.feeDemand.upsert({
          where: { studentMembershipId_instalmentId: { studentMembershipId, instalmentId: inst.id } },
          update: {},
          create: {
            schoolId: school.id,
            studentMembershipId,
            academicYearId: year.id,
            instalmentId: inst.id,
            label: inst.label,
            dueDate: inst.dueDate,
            grossPaise: gross,
            concessionPaise: 0,
            netPaise: gross,
            linesJson: JSON.stringify(mine.map((l) => ({ headId: l.headId, code: l.head.code, name: l.head.name, grossPaise: l.amountPaise, concessionPaise: 0 }))),
          },
        });
      }
      onPlans += 1;
    }
    // Cash payments against Term 1 from the first `payers` pupils, each with
    // its receipt. A pupil who has already paid (any PAID payment) is skipped,
    // so a second run neither pays twice nor numbers a second receipt.
    const term1 = structure.instalments.find((i) => i.label === "Term 1")!;
    for (const [pi, { studentMembershipId }] of pupils.slice(0, payers).entries()) {
      const already = await db.feePayment.findFirst({ where: { schoolId: school.id, studentMembershipId, status: "PAID" }, select: { id: true } });
      if (already) continue;
      const demand = await db.feeDemand.findUniqueOrThrow({ where: { studentMembershipId_instalmentId: { studentMembershipId, instalmentId: term1.id } } });
      const paidAt = new Date(Date.UTC(2026, 6, 10 + pi, 5, 30));
      const payment = await db.feePayment.create({
        data: { schoolId: school.id, studentMembershipId, amountPaise: demand.netPaise, method: "CASH", status: "PAID", clientId: grades.length === 1 && pi === 0 ? `${clientTag}-term1` : `${clientTag}-term1-${grade}-${pi}`, collectedByUserId: adminUserId, paidAt, intentJson: "[]" },
      });
      await db.feeAllocation.create({ data: { schoolId: school.id, paymentId: payment.id, demandId: demand.id, amountPaise: demand.netPaise } });
      await db.feeDemand.update({ where: { id: demand.id }, data: { paidPaise: demand.netPaise, status: "PAID" } });
      const pupil = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { studentCode: true, gradeLevel: true, user: { select: { name: true } } } });
      const fresh = await db.academicYear.findUniqueOrThrow({ where: { id: year.id }, select: { feeReceiptNext: true } });
      const number = fresh.feeReceiptNext;
      await db.academicYear.update({ where: { id: year.id }, data: { feeReceiptNext: number + 1 } });
      const term1Lines = lines.filter((l) => l.instalmentId === term1.id);
      await db.feeReceipt.create({
        data: {
          schoolId: school.id,
          paymentId: payment.id,
          academicYearId: year.id,
          number,
          serial: `RCPT/${year.name}/${String(number).padStart(6, "0")}`,
          issuedAt: paidAt,
          snapshotJson: JSON.stringify({
            school: { name: school.name, addressLine: null, city: school.city ?? null, contactPhone: null, bankNote: null },
            pupil: { name: pupil.user.name, studentCode: pupil.studentCode, className: klass ? untagged(klass.name) : null, gradeLevel: pupil.gradeLevel },
            payment: { amountPaise: demand.netPaise, method: "CASH", reference: null, gatewayMethod: null, paidAt: paidAt.toISOString(), collectedBy: collector.name, note: null },
            year: year.name,
            lines: term1Lines.map((l) => ({ demandLabel: "Term 1", head: l.head.name, code: l.head.code, amountPaise: l.amountPaise })),
            allocations: [{ demandLabel: "Term 1", amountPaise: demand.netPaise }],
          }),
        },
      });
    }
  }
  const receipts = await db.feeReceipt.count({ where: { schoolId: school.id } });
  return { year, structure: structures[0]!, structures, pupils: onPlans, receipts };
}

/* -------------------------------------------------------------------------- */
/* texts to families                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Every Northgate guardian gets a mobile number (+91 98765 00001 upwards —
 * a reserved-looking range, never dialled), the school switches both
 * channels on, and one notice with its per-person rows exists so the API
 * sweep can read a broadcast. The rows are written as SENT under the devbox
 * transport's own sid shape; nothing is actually sent by the fixture.
 */
export async function buildMessaging(
  school: { id: string; name: string },
  adminUserId: string,
  opts: { phonePrefix?: string; keepPhones?: boolean; locale?: string } = {},
) {
  const phonePrefix = opts.phonePrefix ?? "+919876400";
  const guardians = await db.guardianship.findMany({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true }, distinct: ["parentUserId"] });
  let n = 0;
  for (const g of guardians) {
    n += 1;
    const phone = `${phonePrefix}${String(n).padStart(3, "0")}`;
    // A guardian who already carries a number keeps it when the caller says so
    // (the demo schools set every phone at creation, one of them by name).
    if (opts.keepPhones && (await db.user.findUnique({ where: { id: g.parentUserId }, select: { phone: true } }))?.phone) continue;
    const taken = await db.user.findUnique({ where: { phone }, select: { id: true } });
    if (taken && taken.id !== g.parentUserId) continue;
    await db.user.update({ where: { id: g.parentUserId }, data: { phone, phoneVerifiedAt: new Date() } });
  }
  await db.school.update({ where: { id: school.id }, data: { msgSmsEnabled: true, msgWhatsappEnabled: true } });
  const title = `${TAG.prefix}Sports day`;
  let broadcast = await db.broadcast.findFirst({ where: { schoolId: school.id, title }, select: { id: true } });
  if (!broadcast) {
    broadcast = await db.broadcast.create({
      data: { schoolId: school.id, authorUserId: adminUserId, title, body: "Sports day is on Friday. Pupils come in house colours; the gates open at 8.", channelsJson: JSON.stringify(["TEXT"]), audienceJson: JSON.stringify({ kind: "ALL_PARENTS" }), recipients: guardians.length, status: "DONE", doneAt: new Date() },
      select: { id: true },
    });
    const users = await db.user.findMany({ where: { id: { in: guardians.map((g) => g.parentUserId) } }, select: { id: true, phone: true } });
    for (const u of users) {
      if (!u.phone) continue;
      await db.outboundMessage.create({
        data: { schoolId: school.id, userId: u.id, to: u.phone, channel: "WHATSAPP", templateKey: "circular", locale: opts.locale ?? "en", varsJson: JSON.stringify({ notice: "Sports day is on Friday." }), body: `Notice from ${school.name}: Sports day is on Friday. Pupils come in house colours; the gates open at 8. - EduLink`, status: "SENT", providerSid: `devbox_fixture_${broadcast.id}_${u.id}`, providerStatus: "sent", broadcastId: broadcast.id, purpose: "broadcast", sentAt: new Date() },
      });
    }
    await db.broadcast.update({ where: { id: broadcast.id }, data: { sent: users.filter((u) => u.phone).length } });
  }
  return { numbered: n, broadcastId: broadcast.id };
}



/** Weekday is 0=Sunday…6=Saturday, matching `Date.getUTCDay()`. Mon–Fri. */
const SCHOOL_DAYS = [1, 2, 3, 4, 5];

export const PERIODS = [
  { name: "Period 1", startMinute: 8 * 60, endMinute: 8 * 60 + 45, kind: "LESSON", position: 1 },
  { name: "Period 2", startMinute: 8 * 60 + 45, endMinute: 9 * 60 + 30, kind: "LESSON", position: 2 },
  { name: "Period 3", startMinute: 9 * 60 + 30, endMinute: 10 * 60 + 15, kind: "LESSON", position: 3 },
  { name: "Break", startMinute: 10 * 60 + 15, endMinute: 10 * 60 + 45, kind: "BREAK", position: 4 },
  { name: "Period 4", startMinute: 10 * 60 + 45, endMinute: 11 * 60 + 30, kind: "LESSON", position: 5 },
  { name: "Period 5", startMinute: 11 * 60 + 30, endMinute: 12 * 60 + 15, kind: "LESSON", position: 6 },
  { name: "Period 6", startMinute: 12 * 60 + 15, endMinute: 13 * 60, kind: "LESSON", position: 7 },
];

/** One subject per teaching slot in the rota, in the rota's own order. */
const ROTA_SUBJECTS = [
  "Mathematics", "Science", "History", "Geography",
  "English", "Marathi", "Art", "Physical education",
];

/**
 * Lays a full week over every class.
 *
 * THE ROTATION IS THE WHOLE POINT. `TimetableSlot` carries a unique constraint
 * on (school, weekday, period, teacher) — nobody is in two rooms at 11:15 — so
 * a naive "assign a teacher at random" fixture fails on the second insert. With
 * exactly as many teaching staff as classes, `(classIndex + offset) % n` is a
 * bijection for any fixed offset, so every teacher gets exactly one class in
 * each cell of the grid and the constraint can never fire.
 *
 * Friday's last period is deliberately left UNSTAFFED, because a slot with no
 * teacher is a real state the schema documents and the staffing screen has to
 * render loudly rather than hide.
 */
/**
 * Health cards for the first three ZZ Northgate pupils, so the sweep and the
 * screens have a card with an allergy, one with a condition and one blank
 * card with a check-up to read. Re-run safe: the card is upserted whole.
 */
export async function buildHealth(school: { id: string }, adminUserId: string, opts: { pupils?: string[] } = {}) {
  const emails = opts.pupils ?? ["zz.pupil01@zz.test", "zz.pupil02@zz.test", "zz.pupil03@zz.test"];
  const cards: { bloodGroup: string | null; allergies: string; conditions: string; medications: string; notes: string; doctorName: string | null; doctorPhone: string | null; contacts: { name: string; relation: string; phone: string }[]; check: boolean }[] = [
    { bloodGroup: "B+", allergies: "Peanuts — carries an EpiPen in the school bag", conditions: "", medications: "", notes: "Sits near the door in the dining hall.", doctorName: `${TAG.prefix}Dr S. Kulkarni`, doctorPhone: "+912024567890", contacts: [{ name: `${TAG.prefix}Rekha Apte`, relation: "mother", phone: "+919876400001" }, { name: `${TAG.prefix}Dr Kulkarni`, relation: "family doctor", phone: "+912024567890" }], check: false },
    { bloodGroup: "O+", allergies: "", conditions: "Asthma", medications: "Salbutamol inhaler, kept with the class teacher", notes: "", doctorName: `${TAG.prefix}Dr Meera Joshi`, doctorPhone: "+912025533120", contacts: [{ name: `${TAG.prefix}Sunil Joshi`, relation: "father", phone: "+919876400002" }], check: false },
    // The blank card: nothing filled yet, which is a state the screens must show as such.
    { bloodGroup: null, allergies: "", conditions: "", medications: "", notes: "", doctorName: null, doctorPhone: null, contacts: [], check: true },
  ];
  let n = 0;
  for (const [i, email] of emails.entries()) {
    const card = cards[i % cards.length]!;
    const p = await db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", user: { email } }, select: { id: true } });
    if (!p) continue;
    const data = { bloodGroup: card.bloodGroup, allergies: card.allergies, conditions: card.conditions, medications: card.medications, notes: card.notes, doctorName: card.doctorName, doctorPhone: card.doctorPhone, contactsJson: JSON.stringify(card.contacts), updatedByUserId: adminUserId };
    const row = await db.healthCard.upsert({ where: { studentMembershipId: p.id }, create: { schoolId: school.id, studentMembershipId: p.id, ...data }, update: data, select: { id: true } });
    if (card.check && !(await db.healthCheck.findFirst({ where: { cardId: row.id }, select: { id: true } }))) {
      await db.healthCheck.create({ data: { schoolId: school.id, cardId: row.id, studentMembershipId: p.id, dateKey: "2026-07-15", heightCm: 128, weightGrams: 27_400, visionLeft: "6/6", visionRight: "6/9", notes: "Annual camp.", recordedByUserId: adminUserId } });
    }
    n += 1;
  }
  return { cards: n };
}

/**
 * The incident log for ZZ Northgate: a closed grazed knee on pupil01 from
 * last week and an OPEN sick-room visit on pupil02 with one follow-up note,
 * so the sweep's note and close have a door and the screens have both
 * states. Re-run safe: an open one is recreated if the sweep closed it.
 */
export async function buildIncidents(school: { id: string }, adminUserId: string, opts: { pupils?: [string, string] } = {}) {
  const [p1, p2] = await Promise.all((opts.pupils ?? ["zz.pupil01@zz.test", "zz.pupil02@zz.test"]).map((email) => db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", user: { email } }, select: { id: true } })));
  const teacher = await db.membership.findFirst({ where: { schoolId: school.id, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  if (!p1 || !p2 || !teacher) return { incidents: 0 };
  const day = 86_400_000;
  if (!(await db.incident.findFirst({ where: { studentMembershipId: p1.id, title: `${TAG.prefix}Fell on the steps, grazed knee` }, select: { id: true } }))) {
    await db.incident.create({ data: { schoolId: school.id, studentMembershipId: p1.id, reportedByMembershipId: teacher.id, kind: "INJURY", severity: "MINOR", occurredAt: new Date(Date.now() - 6 * day), place: "Playground steps", title: `${TAG.prefix}Fell on the steps, grazed knee`, body: "Slipped on the wet steps at the end of break. Small graze on the right knee, no other injury.", actionTaken: "Cleaned and dressed in the sick room; back to class after ten minutes.", guardiansNotifiedAt: new Date(Date.now() - 6 * day), status: "CLOSED", closedAt: new Date(Date.now() - 5 * day), closedByUserId: adminUserId, notes: { create: { schoolId: school.id, authorUserId: adminUserId, body: "Mother called back in the evening; knee fine the next morning." } } } });
  }
  const open = await db.incident.findFirst({ where: { studentMembershipId: p2.id, status: "OPEN" }, select: { id: true } });
  if (!open) {
    await db.incident.create({ data: { schoolId: school.id, studentMembershipId: p2.id, reportedByMembershipId: teacher.id, kind: "ILLNESS", severity: "MODERATE", occurredAt: new Date(Date.now() - 2 * 3_600_000), place: "Classroom", title: `${TAG.prefix}Wheezing after PE, used inhaler`, body: "Short of breath after the run in PE. Sat down, used her inhaler as on the health card, settled within five minutes.", actionTaken: "Rested in the sick room for twenty minutes; father telephoned.", guardiansNotifiedAt: new Date(Date.now() - 2 * 3_600_000), notes: { create: { schoolId: school.id, authorUserId: adminUserId, body: "Father will bring the spare inhaler tomorrow." } } } });
  }
  return { incidents: await db.incident.count({ where: { schoolId: school.id } }) };
}

/**
 * One circular for ZZ Northgate: a school-wide notice to families that
 * asks for an acknowledgement, already told (deliveredAt set, a push row
 * per guardian and a devbox text per guardian with a number), opened by two
 * guardians and acknowledged by one, so the reach report has every state to
 * show and the sweep has a circular id. Re-run safe.
 */
export async function buildCircular(school: { id: string; name: string }, adminUserId: string, opts: { locale?: string } = {}) {
  const title = `${TAG.prefix}Annual day: consent and costumes`;
  let post = await db.post.findFirst({ where: { schoolId: school.id, title }, select: { id: true } });
  if (!post) {
    post = await db.post.create({
      data: { schoolId: school.id, authorUserId: adminUserId, scope: "SCHOOL", category: "EVENTS", title, body: "Annual day is on the 30th. Every pupil needs a signed consent slip and a white kurta by the 25th. Please acknowledge so the class teacher knows you have seen this.", audience: "PARENTS", requiresAck: true, status: "APPROVED", reviewedAt: new Date(), deliveryQueuedAt: new Date(Date.now() - 86_400_000), deliveredAt: new Date(Date.now() - 86_400_000 + 60_000) },
      select: { id: true },
    });
    const guardians = await db.guardianship.findMany({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true, parent: { select: { phone: true } } }, distinct: ["parentUserId"] });
    for (const g of guardians) {
      await db.notification.create({ data: { userId: g.parentUserId, schoolId: school.id, kind: "POST", title: `A notice from ${school.name} asks for your acknowledgement`, body: title, url: `/bulletin/${post.id}`, createdAt: new Date(Date.now() - 86_400_000 + 60_000) } });
      if (g.parent.phone) {
        await db.outboundMessage.create({ data: { schoolId: school.id, userId: g.parentUserId, to: g.parent.phone, channel: "WHATSAPP", templateKey: "circular", locale: opts.locale ?? "en", varsJson: JSON.stringify({ notice: title }), body: `Notice from ${school.name}: ${title} - EduLink`, status: "SENT", providerSid: `devbox_fixture_circular_${post.id}_${g.parentUserId}`, providerStatus: "sent", purpose: `circular:${post.id}`, sentAt: new Date() } });
      }
    }
    const [g1, g2] = guardians;
    if (g1) await db.postRead.create({ data: { postId: post.id, schoolId: school.id, userId: g1.parentUserId } });
    if (g1) await db.postAck.create({ data: { postId: post.id, schoolId: school.id, userId: g1.parentUserId } });
    if (g2) await db.postRead.create({ data: { postId: post.id, schoolId: school.id, userId: g2.parentUserId } });
  }
  return { postId: post.id };
}

/**
 * The staff register for ZZ Northgate: the last five working days marked by
 * the office, everyone present but one teacher late once and one absent
 * once, and today's row for the first teacher a check-in. Re-run safe.
 */
export async function buildStaffAttendance(school: { id: string }, adminUserId: string, opts: { days?: number } = {}) {
  const wanted = opts.days ?? 5;
  const staff = await db.membership.findMany({ where: { schoolId: school.id, role: { in: ["ADMIN", "PRINCIPAL", "TEACHER"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true }, orderBy: [{ role: "asc" }, { id: "asc" }] });
  const teachers = staff.filter((m) => m.role === "TEACHER");
  const today = new Date().toISOString().slice(0, 10);
  const days: string[] = [];
  for (let back = 1; days.length < wanted && back < wanted * 3; back += 1) {
    const d = new Date(Date.now() - back * 86_400_000);
    if (d.getUTCDay() !== 0) days.push(d.toISOString().slice(0, 10));
  }
  let n = 0;
  for (const [i, day] of days.entries()) {
    for (const [j, m] of staff.entries()) {
      const status = i === 1 && m.id === teachers[0]?.id ? "LATE" : i === 3 && m.id === teachers[1]?.id ? "ABSENT" : "PRESENT";
      await db.staffAttendance.upsert({ where: { membershipId_dateKey: { membershipId: m.id, dateKey: day } }, create: { schoolId: school.id, membershipId: m.id, dateKey: day, status, source: "OFFICE", markedByUserId: adminUserId, note: status === "ABSENT" ? "Rang in unwell." : null }, update: {} });
      n += 1;
      void j;
    }
  }
  if (teachers[0]) {
    // A self check-in at the moment the fixture runs, marked the way the app marks it: late once past the school's start plus grace.
    const checkedInAt = new Date();
    const settings = await db.school.findUniqueOrThrow({ where: { id: school.id }, select: { timezone: true, staffCheckInMinute: true, staffLateGraceMinutes: true } });
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: settings.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(checkedInAt);
    const minute = (Number(parts.find((x) => x.type === "hour")?.value ?? 0) % 24) * 60 + Number(parts.find((x) => x.type === "minute")?.value ?? 0);
    const selfStatus = minute > settings.staffCheckInMinute + settings.staffLateGraceMinutes ? "LATE" : "PRESENT";
    await db.staffAttendance.upsert({ where: { membershipId_dateKey: { membershipId: teachers[0].id, dateKey: today } }, create: { schoolId: school.id, membershipId: teachers[0].id, dateKey: today, status: selfStatus, source: "SELF", checkedInAt, markedByUserId: adminUserId }, update: { status: selfStatus, source: "SELF", checkedInAt } });
  }
  return { marked: n, staff: staff.length };
}

/**
 * Exams and report cards for ZZ Northgate's grade 3: the year's two terms
 * with shares of 40 and 60, a unit test and a mid-term in Term 1 with
 * Mathematics and English papers, marks for every grade-3 pupil (one pupil
 * missing the mid-term), and the Term 1 cards built the way the app builds
 * them — subject rows weighted by exam kind and banded on the default CBSE
 * scale — published, with a draft set under another title for the sweep's
 * co-scholastic write. The school's rules are written out explicitly so the
 * sweep can send them back. Re-run safe.
 */
/**
 * One sitting still ahead (the exam-scope reader, 10 Oct 2026): a published "Half-yearly" series for the grade with
 * two papers about six weeks from today, so a demo pupil's "when is my next exam" has a date to be answered with.
 * Idempotent; the dates move forward with each run so the sitting stays ahead. No marks: nothing has been sat.
 */
export async function buildUpcomingExam(school: { id: string }, adminUserId: string, opts: { grade: string; subjects: [string, string]; daysAhead?: number }) {
  const admin = await db.membership.findFirstOrThrow({ where: { schoolId: school.id, userId: adminUserId }, select: { id: true } });
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: opts.grade, archivedAt: null }, select: { id: true } });
  if (!klass) return { series: 0, papers: 0 };
  const ahead = opts.daysAhead ?? 45;
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
  const first = new Date(`${day(ahead)}T00:00:00.000Z`);
  const term = await db.term.findFirst({ where: { schoolId: school.id, startDate: { lte: first }, endDate: { gte: first } }, select: { id: true } });
  const series = await db.examSeries.upsert({
    where: { schoolId_gradeLevel_name: { schoolId: school.id, gradeLevel: opts.grade, name: "Half-yearly" } },
    create: { schoolId: school.id, name: "Half-yearly", gradeLevel: opts.grade, kind: "MID_TERM", termId: term?.id ?? null, publishedAt: new Date(), createdByMembershipId: admin.id },
    update: { kind: "MID_TERM", termId: term?.id ?? null, publishedAt: new Date(), archivedAt: null },
    select: { id: true },
  });
  let papers = 0;
  for (const [i, subject] of opts.subjects.entries()) {
    await db.examSlot.upsert({
      where: { seriesId_subject: { seriesId: series.id, subject } },
      create: { schoolId: school.id, seriesId: series.id, subject, dateKey: day(ahead + i), startMinute: 9 * 60, endMinute: 11 * 60 + 30, pointsMilli: 80_000, position: i + 1 },
      update: { dateKey: day(ahead + i), startMinute: 9 * 60, endMinute: 11 * 60 + 30, pointsMilli: 80_000, position: i + 1 },
    });
    papers++;
  }
  return { series: 1, papers };
}

export async function buildExams(school: { id: string }, adminUserId: string, opts: { grade?: string; subjects?: [string, string] } = {}) {
  const grade = opts.grade ?? "3";
  const [subjectA, subjectB] = opts.subjects ?? ["Mathematics", "English"];
  const year = await db.academicYear.findFirstOrThrow({ where: { schoolId: school.id, isCurrent: true }, select: { id: true, name: true, startDate: true, endDate: true } });
  const admin = await db.membership.findFirstOrThrow({ where: { schoolId: school.id, userId: adminUserId }, select: { id: true } });
  await db.school.update({ where: { id: school.id }, data: { reportCardConfig: JSON.stringify(DEFAULT_REPORT_CARD_CONFIG) } });
  const mid = new Date((year.startDate.getTime() + year.endDate.getTime()) / 2);
  const termSpecs = [
    { name: "Term 1", start: year.startDate, end: new Date(mid.getTime() - 86_400_000), weight: 40 },
    { name: "Term 2", start: mid, end: year.endDate, weight: 60 },
  ];
  const terms = [];
  for (const [i, spec] of termSpecs.entries()) {
    const term = await db.term.upsert({
      where: { academicYearId_name: { academicYearId: year.id, name: spec.name } },
      create: { schoolId: school.id, academicYearId: year.id, name: spec.name, startDate: spec.start, endDate: spec.end, position: i + 1, weightPercent: spec.weight },
      update: { weightPercent: spec.weight },
      select: { id: true, name: true, startDate: true, endDate: true },
    });
    terms.push(term);
  }
  const term1 = terms[0]!;
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: grade, archivedAt: null }, select: { id: true }, orderBy: { name: "asc" } });
  if (!klass) return { series: 0, papers: 0, marks: 0, cards: 0 };
  const day = (offset: number) => new Date(term1.startDate.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
  // A unit test is an hour from nine; the mid-term two and a half. Minutes from midnight, the slot's own columns.
  const seriesSpecs = [
    { name: "Unit test 1", kind: "UNIT_TEST", startMinute: 9 * 60, endMinute: 10 * 60, papers: [{ subject: subjectA, max: 25, date: day(40) }, { subject: subjectB, max: 25, date: day(41) }] },
    { name: "Mid-term", kind: "MID_TERM", startMinute: 9 * 60, endMinute: 11 * 60 + 30, papers: [{ subject: subjectA, max: 80, date: day(100) }, { subject: subjectB, max: 80, date: day(101) }] },
  ];
  const papers: { id: string; title: string; subject: string; kind: string; seriesName: string; max: number; position: number; seriesAt: number }[] = [];
  for (const spec of seriesSpecs) {
    const series = await db.examSeries.upsert({
      where: { schoolId_gradeLevel_name: { schoolId: school.id, gradeLevel: grade, name: spec.name } },
      create: { schoolId: school.id, name: spec.name, gradeLevel: grade, kind: spec.kind, termId: term1.id, publishedAt: new Date(), createdByMembershipId: admin.id },
      update: { kind: spec.kind, termId: term1.id, publishedAt: new Date() },
      select: { id: true, createdAt: true },
    });
    for (const [i, p] of spec.papers.entries()) {
      const slot = await db.examSlot.upsert({
        where: { seriesId_subject: { seriesId: series.id, subject: p.subject } },
        create: { schoolId: school.id, seriesId: series.id, subject: p.subject, dateKey: p.date, startMinute: spec.startMinute, endMinute: spec.endMinute, pointsMilli: p.max * 1000, position: i + 1 },
        update: { dateKey: p.date, startMinute: spec.startMinute, endMinute: spec.endMinute, pointsMilli: p.max * 1000 },
        select: { id: true },
      });
      const sitting = await db.assignment.upsert({
        where: { examSlotId_classId: { examSlotId: slot.id, classId: klass.id } },
        create: { schoolId: school.id, classId: klass.id, authorMembershipId: admin.id, title: `${spec.name} · ${p.subject}`, category: "Exam", pointsMilli: p.max * 1000, examSlotId: slot.id, publishedAt: new Date(), dueAt: new Date(`${p.date}T10:00:00Z`) },
        update: { pointsMilli: p.max * 1000 },
        select: { id: true, title: true },
      });
      papers.push({ id: sitting.id, title: sitting.title, subject: p.subject, kind: spec.kind, seriesName: spec.name, max: p.max, position: i + 1, seriesAt: series.createdAt.getTime() });
    }
  }
  papers.sort((a, b) => a.seriesAt - b.seriesAt || a.position - b.position);
  const roll = await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true }, orderBy: { studentMembershipId: "asc" } });
  let marks = 0;
  const marksBy = new Map<string, number | null>();
  for (const [pi, row] of roll.entries()) {
    for (const [ai, p] of papers.entries()) {
      // Deterministic marks between 55 % and 96 %; the last pupil missed the mid-term.
      const missed = pi === roll.length - 1 && p.kind === "MID_TERM";
      const score = missed ? null : Math.round(p.max * (0.55 + (((pi * 7 + ai * 13) % 21) / 50)) * 1000);
      marksBy.set(`${p.id}:${row.studentMembershipId}`, score);
      if (score === null) {
        await db.grade.deleteMany({ where: { assignmentId: p.id, studentMembershipId: row.studentMembershipId } });
        continue;
      }
      await db.grade.upsert({
        where: { assignmentId_studentMembershipId: { assignmentId: p.id, studentMembershipId: row.studentMembershipId } },
        create: { schoolId: school.id, assignmentId: p.id, studentMembershipId: row.studentMembershipId, scoreMilli: score, gradedByMembershipId: admin.id },
        update: { scoreMilli: score },
      });
      marks += 1;
    }
  }
  const config = DEFAULT_REPORT_CARD_CONFIG;
  let cards = 0;
  for (const [title, status] of [[term1.name, "PUBLISHED"], ["Mid-term review", "DRAFT"]] as const) {
    for (const row of roll) {
      const bySubject = new Map<string, typeof papers>();
      for (const p of papers) bySubject.set(p.subject, [...(bySubject.get(p.subject) ?? []), p]);
      const subjects = [...bySubject].map(([subject, ps]) => {
        const w = kindWeighted(ps.map((p) => ({ label: p.seriesName, kind: p.kind, scoreMilli: marksBy.get(`${p.id}:${row.studentMembershipId}`) ?? null, pointsMilli: p.max * 1000 })), config.kindWeights);
        // Rounded once to what the card shows, and the letter read from that — as the generator does.
        const percent = shownPercent(w.percent);
        const band = bandFor(percent, config.bands);
        return { subject, percent, letter: band?.label ?? null, points: band?.points ?? null, parts: w.parts };
      });
      const overall = shownPercent(meanPercent(subjects));
      const points = meanPoints(subjects);
      const data = {
        schoolId: school.id,
        classId: klass.id,
        studentMembershipId: row.studentMembershipId,
        academicYearId: year.id,
        termId: status === "PUBLISHED" ? term1.id : null,
        title,
        status,
        fromDateKey: term1.startDate.toISOString().slice(0, 10),
        toDateKey: term1.endDate.toISOString().slice(0, 10),
        // The register between the card's dates, as the generator counts it: late is there, excused is in the total.
        ...(await (async () => {
          const marks = await db.attendanceRecord.findMany({ where: { schoolId: school.id, studentMembershipId: row.studentMembershipId, session: { dateKey: { gte: term1.startDate.toISOString().slice(0, 10), lte: term1.endDate.toISOString().slice(0, 10) } } }, select: { status: true } });
          return { attendancePresent: marks.filter((m) => m.status === "PRESENT" || m.status === "LATE").length, attendanceTotal: marks.length };
        })()),
        overallPercentMilli: overall === null ? null : Math.round(overall * 1000),
        gradingMethod: "weighted",
        overallLetter: bandFor(overall, config.bands)?.label ?? null,
        gradePointsMilli: points === null ? null : Math.round(points * 1000),
        subjects: JSON.stringify(subjects),
        scale: JSON.stringify({ bands: config.bands, coScale: config.coScholastic.scale }),
        layout: JSON.stringify(config.layout),
        remark: status === "PUBLISHED" ? "Works steadily; reads aloud with confidence." : null,
        createdByMembershipId: admin.id,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      };
      const card = await db.reportCard.upsert({ where: { classId_studentMembershipId_title: { classId: klass.id, studentMembershipId: row.studentMembershipId, title } }, create: data, update: data, select: { id: true } });
      await db.reportCardItem.deleteMany({ where: { reportCardId: card.id } });
      await db.reportCardItem.createMany({
        data: [
          ...papers.map((p, position) => {
            const scoreMilli = marksBy.get(`${p.id}:${row.studentMembershipId}`) ?? null;
            return { schoolId: school.id, reportCardId: card.id, assignmentId: p.id, title: p.title, category: "Exam", scoreMilli, pointsMilli: p.max * 1000, position, subject: p.subject, kind: "SCHOLASTIC", letter: bandFor(scoreMilli === null ? null : (scoreMilli / (p.max * 1000)) * 100, config.bands)?.label ?? null };
          }),
          ...(status === "PUBLISHED"
            ? config.coScholastic.areas.map((area, position) => ({ schoolId: school.id, reportCardId: card.id, title: area, kind: "CO_SCHOLASTIC", letter: config.coScholastic.scale[position % config.coScholastic.scale.length]!.label, position: papers.length + position }))
            : []),
        ],
      });
      cards += 1;
    }
  }
  return { series: seriesSpecs.length, papers: papers.length, marks, cards };
}

/**
 * Certificates for ZZ Northgate: templates from the presets — the bonafide,
 * character and study certificates in English, the transfer certificate and
 * the Nirgam Utara in Marathi, and a retired Hindi bonafide for the sweep's
 * archive no-op; pupil records filled for the grade-3 class (one left with
 * the admission date blank, so the office's list has someone to ask); a
 * bonafide issued to the first pupil in English, a study certificate to the
 * second in Marathi and one revoked, built the way the app builds them.
 * Re-run safe: today's issues are rebuilt under fixed serials.
 */
export type CertTemplateSpec = { kind: string; locale: "en" | "hi" | "mr"; name?: string; active?: boolean };
export type CertIssueSpec = { key: string; pupil: number; number: number; purpose: string | null; revoked?: boolean; fromRequest?: boolean };
export type CertRequestSpec = { pupil: number; kind: string; purpose: string; status?: "PENDING" | "DECLINED" | "CANCELLED"; reason?: string };
export type CertificatesOpts = {
  /** The class the certificates are issued in; the pupil indices below are seats on its roll. */
  grade?: string;
  /** Every class whose pupils get a record (default: the issuing grade alone). */
  recordGrades?: string[];
  templates?: CertTemplateSpec[];
  issues?: CertIssueSpec[];
  requests?: CertRequestSpec[];
  /** Two letters at the head of the public check code. */
  codePrefix?: string;
  city?: string;
  previousSchool?: string;
  /** Records the family has already completed are left as they are (the demo's named children). */
  keepRecords?: string[];
};

export async function buildCertificates(school: { id: string; name: string; code: string }, adminUserId: string, opts: CertificatesOpts = {}) {
  const grade = opts.grade ?? "3";
  // Find or create, as buildFees does: on CI's fresh database ZZ Southbank
  // has no year of its own, and e16af4d0's call for Southbank found none
  // (the first run after billing returned, 2026-10-01).
  const year =
    (await db.academicYear.findFirst({ where: { schoolId: school.id, isCurrent: true }, select: { id: true, name: true } })) ??
    (await db.academicYear.create({
      data: { schoolId: school.id, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true },
      select: { id: true, name: true },
    }));
  const templateSpecs: CertTemplateSpec[] = opts.templates ?? [
    { kind: "BONAFIDE", locale: "en" }, { kind: "CHARACTER", locale: "en" }, { kind: "STUDY", locale: "en" },
    { kind: "TC", locale: "mr" }, { kind: "NIRGAM", locale: "mr" },
    { kind: "BONAFIDE", locale: "hi", name: "बोनाफाइड (जुना)", active: false },
  ];
  const specs = templateSpecs.map((t) => {
    const preset = presetsFor(t.locale).find((p) => p.kind === t.kind);
    if (!preset) throw new Error(`no ${t.locale} preset for ${t.kind}`);
    return { ...preset, name: t.name ?? preset.name, active: t.active ?? true };
  });
  const templates = new Map<string, { id: string; kind: string; locale: string; title: string; intro: string; rowsJson: string; outro: string; layoutJson: string; serialPrefix: string }>();
  for (const spec of specs) {
    const data = { kind: spec.kind, locale: spec.locale, title: spec.title, intro: spec.intro, rowsJson: JSON.stringify(spec.rows), outro: spec.outro, layoutJson: JSON.stringify(spec.layout), serialPrefix: spec.serialPrefix, active: spec.active, createdByUserId: adminUserId };
    const t = await db.certificateTemplate.upsert({ where: { schoolId_name: { schoolId: school.id, name: spec.name } }, create: { schoolId: school.id, name: spec.name, ...data }, update: data });
    templates.set(`${spec.kind}-${spec.locale}`, t);
  }
  const city = opts.city ?? "Pune";
  const fathers = ["Rohan", "Prakash", "Sunil", "Mahesh", "Anil", "Vijay"];
  const mothers = ["Sneha", "Kavita", "Rekha", "Vandana", "Meena", "Priya"];
  const keep = new Set(opts.keepRecords ?? []);
  let records = 0;
  for (const recordGrade of opts.recordGrades ?? [grade]) {
    const cls = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: recordGrade, archivedAt: null }, select: { id: true }, orderBy: { name: "asc" } });
    if (!cls) continue;
    const roll = await db.enrollment.findMany({ where: { classId: cls.id, status: "ACTIVE" }, select: { studentMembershipId: true, student: { select: { user: { select: { name: true } } } } }, orderBy: { studentMembershipId: "asc" } });
    for (const [i, row] of roll.entries()) {
      if (keep.has(row.studentMembershipId)) { records += 1; continue; }
      const surname = untagged(row.student.user.name).split(" ").pop() ?? "Patil";
      const last = i === roll.length - 1;
      const facts = recordFacts(i, Number(recordGrade), { bpl: i === 2, ews: i === 2 || i === 4 });
      const data = {
        // Category and religion are coded (see recordFacts); the caste is a name plausible for the category.
        fatherName: `${fathers[i % fathers.length]} ${surname}`, motherName: `${mothers[i % mothers.length]} ${surname}`, placeOfBirth: city, nationality: "INDIAN", religion: facts.religion, caste: facts.caste, category: facts.category, motherTongue: "MARATHI",
        // The household as the RTE and EWS verifications ask for it.
        fatherOccupation: facts.fatherOccupation, motherOccupation: facts.motherOccupation, annualIncome: facts.annualIncome,
        addressLine: `${10 + i} Shivaji Nagar`, city, postalCode: "411005", admissionNumber: `GR-${(opts.recordGrades ? Number(recordGrade) * 100 : 0) + 1000 + i}`,
        // A stand-in for the number the UDISE+ portal issues — fictitious, deterministic per pupil, eleven digits; the app never makes one.
        // The last pupil's admission is left undated, and with it the previous school's TC, so the office's list has someone to ask.
        admissionDate: last ? null : new Date("2024-06-15T00:00:00Z"), admittedToGrade: "1", previousSchool: opts.previousSchool ?? "Sunrise Nursery", penNumber: fakePen(row.studentMembershipId), updatedByUserId: adminUserId, familyFilledAt: new Date(),
        previousSchoolTcNumber: last ? null : `TC/2024/${String(100 + Number(recordGrade) * 10 + i).padStart(4, "0")}`, previousSchoolTcDate: last ? null : new Date("2024-06-05T00:00:00Z"),
        // The filing fields: gender for all but the last (so the UDISE sheet has a blank to name), a BPL and an EWS flag, one child with an impairment, Marathi names on two.
        gender: last ? null : i % 2 === 0 ? "M" : "F", bpl: i === 2, ews: i === 2 || i === 4, rte: i === 4, cwsnType: i === 1 ? "2" : "NONE", bloodGroup: ["A+", "O+", "B+", null, "AB+", "O-"][i % 6] ?? null,
        nameLocal: i === 0 ? "आरव पाटील" : i === 1 ? "भक्ती भोसले" : null, fatherNameLocal: i === 0 ? "रोहन पाटील" : null, motherNameLocal: i === 0 ? "स्नेहा पाटील" : null,
      };
      await db.pupilRecord.upsert({ where: { studentMembershipId: row.studentMembershipId }, create: { schoolId: school.id, studentMembershipId: row.studentMembershipId, ...data }, update: data });
      await db.user.update({ where: { id: (await db.membership.findUniqueOrThrow({ where: { id: row.studentMembershipId }, select: { userId: true } })).userId }, data: { penNumber: data.penNumber } });
      records += 1;
    }
  }
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: grade, archivedAt: null }, select: { id: true, name: true, gradeLevel: true }, orderBy: { name: "asc" } });
  if (!klass) return { templates: specs.length, records, issued: 0, requests: 0 };
  const roll = await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true, student: { select: { studentCode: true, user: { select: { name: true, preferredName: true, birthdate: true } } } } }, orderBy: { studentMembershipId: "asc" } });
  await db.issuedCertificate.deleteMany({ where: { schoolId: school.id, academicYearId: year.id } });
  await db.certificateRequest.deleteMany({ where: { schoolId: school.id } });
  const today = new Date().toISOString().slice(0, 10);
  const issueSpecs: CertIssueSpec[] = opts.issues ?? [
    { key: "BONAFIDE-en", pupil: 0, number: 1, purpose: "a passport" },
    { key: "STUDY-en", pupil: 1, number: 1, purpose: "a scholarship" },
    { key: "STUDY-en", pupil: 2, number: 2, purpose: "a bus pass" },
    { key: "BONAFIDE-en", pupil: 1, number: 2, purpose: "a bank account", revoked: true },
  ];
  const pupilUser = async (m: (typeof roll)[number]) => (await db.membership.findUniqueOrThrow({ where: { id: m.studentMembershipId }, select: { userId: true } })).userId;
  let issued = 0;
  let requests = 0;
  for (const spec of issueSpecs) {
    const pupil = roll[spec.pupil];
    if (!pupil) continue;
    const t = templates.get(spec.key)!;
    const locale = t.locale as "en" | "hi" | "mr";
    const words = wordsFor(locale);
    const rec = await db.pupilRecord.findUnique({ where: { studentMembershipId: pupil.studentMembershipId } });
    const serial = `${t.serialPrefix}/${year.name}/${String(spec.number).padStart(4, "0")}`;
    const facts: PupilFacts = {
      name: pupil.student.user.preferredName ?? pupil.student.user.name,
      studentCode: pupil.student.studentCode,
      birthdateKey: pupil.student.user.birthdate?.toISOString().slice(0, 10) ?? null,
      ageYears: null,
      record: rec ? { fatherName: rec.fatherName, motherName: rec.motherName, placeOfBirth: rec.placeOfBirth, nationality: rec.nationality, religion: rec.religion, caste: rec.caste, category: rec.category, motherTongue: rec.motherTongue, addressLine: rec.addressLine, city: rec.city, postalCode: rec.postalCode, admissionNumber: rec.admissionNumber, admissionDateKey: rec.admissionDate?.toISOString().slice(0, 10) ?? null, admittedToGrade: rec.admittedToGrade, previousSchool: rec.previousSchool, penNumber: rec.penNumber } : null,
      className: klass.name,
      gradeLevel: klass.gradeLevel,
      school: { name: school.name, code: school.code, address: city },
      yearName: year.name,
      leaving: null,
      issue: { dateKey: today, serial, purpose: spec.purpose, remark: null },
    };
    const data = dataFor(facts, locale, words);
    const intro = fill(t.intro, data);
    const rows = fillRows(JSON.parse(t.rowsJson), data);
    const outro = fill(t.outro, data);
    const code = `${opts.codePrefix ?? "ZZ"}${String(issued + 1).padStart(2, "0")}${pupil.studentMembershipId.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`;
    const cert = await db.issuedCertificate.create({
      data: {
        schoolId: school.id, templateId: t.id, studentMembershipId: pupil.studentMembershipId, academicYearId: year.id, kind: t.kind, locale, serial, number: spec.number, title: t.title,
        intro: intro.text, rowsJson: JSON.stringify(rows.rows), outro: outro.text, layoutJson: t.layoutJson, dataJson: JSON.stringify({ ...data, missing: [...new Set([...intro.missing, ...rows.missing, ...outro.missing])] }),
        purpose: spec.purpose, code, issuedByUserId: adminUserId, revokedAt: spec.revoked ? new Date() : null, revokedReason: spec.revoked ? "Issued to the wrong pupil." : null,
      },
      select: { id: true },
    });
    issued += 1;
    // The ask this paper answered: a request marked ISSUED and pointed at it.
    if (spec.fromRequest) {
      await db.certificateRequest.create({ data: { schoolId: school.id, studentMembershipId: pupil.studentMembershipId, requestedByUserId: await pupilUser(pupil), kind: t.kind, purpose: spec.purpose ?? "", status: "ISSUED", certificateId: cert.id, decidedAt: new Date(), createdAt: new Date(Date.now() - 3 * 86_400_000) } });
      requests += 1;
    }
  }
  // One PEN correction awaiting the head and the family on the first pupil, so the approval pages have a row and the sweep a request to decide.
  await db.penChangeRequest.deleteMany({ where: { schoolId: school.id } });
  if (roll[0]) {
    await db.penChangeRequest.create({ data: { schoolId: school.id, studentMembershipId: roll[0].studentMembershipId, fromPen: fakePen(roll[0].studentMembershipId), toPen: fakePen(`${roll[0].studentMembershipId}:corrected`), reason: "Two digits were swapped when the number was typed in; the UDISE+ portal shows the corrected one.", requestedByUserId: adminUserId, guardianWaived: !(await db.guardianship.findFirst({ where: { studentMembershipId: roll[0].studentMembershipId, status: "ACTIVE" }, select: { id: true } })) } });
  }
  // The asks: a pending bonafide from the second pupil (the queue on the issue page), a declined study certificate from the third, and a cancelled one from the first — so the sweep's cancel and decline are no-ops.
  const requestSpecs: CertRequestSpec[] = opts.requests ?? [
    { pupil: 1, kind: "BONAFIDE", purpose: "a bus pass" },
    { pupil: 2, kind: "STUDY", purpose: "a scholarship", status: "DECLINED", reason: "Fees for Term 1 are outstanding." },
    { pupil: 0, kind: "CHARACTER", purpose: "a sports trial", status: "CANCELLED" },
  ];
  for (const spec of requestSpecs) {
    const pupil = roll[spec.pupil];
    if (!pupil) continue;
    const status = spec.status ?? "PENDING";
    await db.certificateRequest.create({
      data: {
        schoolId: school.id, studentMembershipId: pupil.studentMembershipId, requestedByUserId: await pupilUser(pupil), kind: spec.kind, purpose: spec.purpose, status,
        declineReason: status === "DECLINED" ? (spec.reason ?? "Not at this time.") : null,
        decidedByUserId: status === "DECLINED" ? adminUserId : null,
        decidedAt: status === "PENDING" ? null : new Date(),
      },
    });
    requests += 1;
  }
  return { templates: specs.length, records, issued, requests };
}

/**
 * Admissions at ZZ Northgate: one OPEN cycle for the current year taking
 * grades 3 and 6 with a birth certificate and a photograph asked for and an
 * entrance test, three future sittings and one cancelled; one CLOSED empty
 * cycle for the purge; and, from the first guardian (the same one the API
 * sweep signs in as), an application in every state — submitted with a
 * sitting booked and a result, offered, accepted, admitted onto a grade-3
 * pupil, waitlisted, withdrawn — plus one walk-in the office entered.
 * Publishes the school's directory profile, which is the door the form is
 * on. Re-run safe: the school's cycles are rebuilt.
 */
export type AdmissionsOpts = {
  /** The directory profile and filing identity written on the school; `null` leaves the school row alone. */
  profile?: Record<string, unknown> | null;
  /** The year the cycle admits INTO (default: the current year). */
  academicYearId?: string;
  grades?: { grade: string; seats: number }[];
  /** Who applied (default: the school's first guardian); `null` for nobody, which leaves the walk-in alone. */
  applicant?: { userId: string; name: string; email: string | null } | null;
  /** The applying family's surname on the six children. */
  family?: string;
  /** The grade the ADMITTED application's pupil is drawn from. */
  admittedGrade?: string;
  fileTag?: string;
  city?: string;
  addressLine?: string;
  previousSchool?: string;
  notice?: string;
  walkIn?: { applicantName: string; applicantPhone: string; childName: string; grade: string };
  /** A second, closed cycle for the purge (the fixture's). */
  closedCycle?: boolean;
};

export async function buildAdmissions(school: { id: string; name: string }, adminUserId: string, structureId: string | null, opts: AdmissionsOpts = {}) {
  const current = await db.academicYear.findFirstOrThrow({ where: { schoolId: school.id, isCurrent: true }, select: { id: true, name: true } });
  const year = opts.academicYearId ? await db.academicYear.findUniqueOrThrow({ where: { id: opts.academicYearId }, select: { id: true, name: true } }) : current;
  const profile = opts.profile === undefined
    ? { profilePublishedAt: new Date(), profileAbout: "A neighbourhood school in Pune, grades 3 to 10, with a bilingual primary section.", udiseCode: "27250100101", board: "MSBSHSE", affiliationNumber: "25.01.001", district: "Pune", block: "Haveli", medium: "Marathi", managementType: "PRIVATE_UNAIDED" }
    : opts.profile;
  if (profile) await db.school.update({ where: { id: school.id }, data: profile });
  const grades = opts.grades ?? [{ grade: "3", seats: 3 }, { grade: "6", seats: 2 }];
  await db.admissionCycle.deleteMany({ where: { schoolId: school.id } });
  const cycle = await db.admissionCycle.create({
    data: {
      schoolId: school.id, academicYearId: year.id, name: `Admissions ${year.name}`, status: "OPEN", testRequired: true, feeStructureId: structureId, createdByUserId: adminUserId,
      gradesJson: JSON.stringify(grades),
      documentsJson: JSON.stringify([{ key: "birth_certificate", name: "Birth certificate", required: true }, { key: "photo", name: "Passport photograph", required: true }, { key: "previous_report", name: "Last report card", required: false }]),
      notice: opts.notice ?? "Bring the originals to the entrance test. The office is open 9 to 1 on Saturdays.",
    },
  });
  let cycles = 1;
  if (opts.closedCycle ?? true) {
    await db.admissionCycle.create({ data: { schoolId: school.id, academicYearId: current.id, name: `Late admissions ${current.name}`, status: "CLOSED", gradesJson: JSON.stringify([{ grade: grades[0]!.grade, seats: 1 }]), createdByUserId: adminUserId } });
    cycles += 1;
  }
  const day = new Date(); day.setUTCDate(day.getUTCDate() + 14); day.setUTCHours(4, 30, 0, 0);
  const slots = [];
  for (let i = 0; i < 3; i += 1) {
    const startsAt = new Date(day.getTime() + i * 45 * 60_000);
    slots.push(await db.entranceSlot.create({ data: { schoolId: school.id, cycleId: cycle.id, startsAt, endsAt: new Date(startsAt.getTime() + 45 * 60_000), capacity: 4, location: "Room 3, ground floor" }, select: { id: true } }));
  }
  await db.entranceSlot.create({ data: { schoolId: school.id, cycleId: cycle.id, startsAt: new Date(day.getTime() + 3 * 45 * 60_000), endsAt: new Date(day.getTime() + 4 * 45 * 60_000), capacity: 4, cancelledAt: new Date() } });
  let applicant = opts.applicant;
  if (applicant === undefined) {
    const guardian = await db.guardianship.findFirst({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true, parent: { select: { name: true, email: true } } } });
    applicant = guardian ? { userId: guardian.parentUserId, name: guardian.parent.name, email: guardian.parent.email } : null;
  }
  if (!applicant) return { cycles, slots: 4, applications: 0, cycleId: cycle.id };
  const gradeA = grades[0]!.grade;
  const gradeB = (grades[1] ?? grades[0]!).grade;
  const admittedGrade = opts.admittedGrade ?? gradeA;
  const pupil = await db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", admittedFrom: null, enrollments: { some: { status: "ACTIVE", class: { gradeLevel: admittedGrade } } } }, orderBy: { id: "desc" }, select: { id: true, user: { select: { penNumber: true } } } });
  // The admitted application carries the child's PEN: the seat went to the account the number names (an existing pupil here, whose account already holds it).
  const admittedPen = pupil ? (pupil.user.penNumber ?? fakePen(pupil.id)) : null;
  const fileTag = opts.fileTag ?? "zz-fixture";
  const docs = (n: number) => JSON.stringify([{ key: "birth_certificate", fileId: `${fileTag}-birth-${n}.pdf`, name: "birth-certificate.pdf", mime: "application/pdf", size: 120_000, uploadedAt: new Date().toISOString() }, { key: "photo", fileId: `${fileTag}-photo-${n}.jpg`, name: "photo.jpg", mime: "image/jpeg", size: 80_000, uploadedAt: new Date().toISOString() }]);
  const base = { schoolId: school.id, cycleId: cycle.id, applicantUserId: applicant.userId, applicantName: applicant.name, applicantEmail: applicant.email, relation: "PARENT", addressLine: opts.addressLine ?? "14 Shivaji Nagar", city: opts.city ?? "Pune", previousSchool: opts.previousSchool ?? "Sunrise Nursery" };
  const soon = new Date(); soon.setUTCDate(soon.getUTCDate() + 10);
  const family = opts.family ?? "Deshpande";
  const child = (first: string) => `${TAG.prefix}${first} ${family}`;
  // Birth years follow the grade applied for: a pupil in grade G is about G+5.
  const born = (grade: string, month: number, dayOfMonth: number) => new Date(Date.UTC(THIS_YEAR + 1 - (Number(grade) + 5), month - 1, dayOfMonth));
  const specs = [
    { number: 1, childName: child("Aarohi"), gradeApplied: gradeA, childBirthdate: born(gradeA, 2, 11), status: "SUBMITTED", documentsJson: docs(1), documentsVerifiedAt: new Date(), testSlotId: slots[0]!.id, testScore: "38/50", testNote: "Reads fluently.", testedAt: new Date() },
    { number: 2, childName: child("Kabir"), gradeApplied: gradeB, childBirthdate: born(gradeB, 8, 30), status: "OFFERED", documentsJson: docs(2), documentsVerifiedAt: new Date(), testSlotId: slots[1]!.id, testScore: "44/50", testedAt: new Date(), offeredAt: new Date(), offerExpiresAt: soon, offerNote: "Please bring the originals when you accept." },
    { number: 3, childName: child("Meera"), gradeApplied: gradeA, childBirthdate: born(gradeA, 5, 2), status: "ACCEPTED", documentsJson: docs(3), documentsVerifiedAt: new Date(), testScore: "41/50", testedAt: new Date(), offeredAt: new Date(), offerExpiresAt: soon, respondedAt: new Date() },
    { number: 4, childName: child("Dhruv"), gradeApplied: admittedGrade, childBirthdate: born(admittedGrade, 1, 20), status: "ADMITTED", documentsJson: docs(4), documentsVerifiedAt: new Date(), testScore: "45/50", testedAt: new Date(), offeredAt: new Date(), respondedAt: new Date(), admittedAt: new Date(), admittedMembershipId: pupil?.id ?? null, penNumber: admittedPen, feeStructureId: structureId },
    { number: 5, childName: child("Ira"), gradeApplied: gradeB, childBirthdate: born(gradeB, 11, 11), status: "WAITLISTED", documentsJson: docs(5), testScore: "29/50", testedAt: new Date(), decidedAt: new Date(), decisionNote: `Second on the list for grade ${gradeB}.` },
    { number: 6, childName: child("Vihaan"), gradeApplied: gradeA, childBirthdate: born(gradeA, 7, 7), status: "WITHDRAWN", decidedAt: new Date() },
  ] as const;
  for (const spec of specs) await db.application.create({ data: { ...base, ...spec, serial: `APP/${year.name}/${String(spec.number).padStart(4, "0")}` } });
  const walkIn = opts.walkIn ?? { applicantName: "Sujata Kulkarni", applicantPhone: "+91 98764 00077", childName: `${TAG.prefix}Anvi Kulkarni`, grade: gradeA };
  await db.application.create({ data: { schoolId: school.id, cycleId: cycle.id, number: 7, serial: `APP/${year.name}/0007`, applicantUserId: null, applicantName: walkIn.applicantName, applicantPhone: walkIn.applicantPhone, relation: "PARENT", childName: walkIn.childName, gradeApplied: walkIn.grade, childBirthdate: born(walkIn.grade, 3, 3), status: "SUBMITTED", note: "Came to the office on Saturday with the paper form.", createdByUserId: adminUserId } });
  return { cycles, slots: 4, applications: 7, cycleId: cycle.id };
}

/**
 * The staff records the UDISE+ teacher profile is cut from: every form tutor
 * and subject teacher gets a gender, a category, qualifications and an
 * appointment type; the two idle teachers are left blank so the filings page
 * has staff to name. Re-run safe.
 */
export async function buildStaffRecords(school: { id: string }, staff: { membership: { id: string } }[]) {
  const specs = [
    { gender: "F", socialCategory: "GENERAL", academicQualification: "5", professionalQualification: "3", appointmentType: "REGULAR", designation: "Primary teacher" },
    { gender: "M", socialCategory: "OBC", academicQualification: "4", professionalQualification: "3", appointmentType: "REGULAR", designation: "Class teacher" },
    { gender: "F", socialCategory: "GENERAL", academicQualification: "4", professionalQualification: "10", appointmentType: "CONTRACT", designation: "Class teacher" },
    { gender: "M", socialCategory: "SC", academicQualification: "5", professionalQualification: "4", appointmentType: "REGULAR", designation: "Senior teacher" },
  ];
  let n = 0;
  for (const [i, s] of staff.entries()) {
    const spec = specs[i % specs.length]!;
    const data = { ...spec, ...staffDates(i, 2015 + (i % 8)), staffNumber: `EMP-${String(i + 1).padStart(3, "0")}`, leaveDaysPerYear: 12 };
    await db.staffRecord.upsert({ where: { membershipId: s.membership.id }, create: { schoolId: school.id, membershipId: s.membership.id, ...data }, update: data });
    n += 1;
  }
  return { records: n };
}

/**
 * The DCF's three dates for one member of staff: when they joined this school
 * (1 June of the year given), when they first joined service anywhere (two to
 * seven years earlier), and when they were born (at least twenty-four before
 * that). Deterministic in the index.
 */
export function staffDates(i: number, joinedYear: number): { joinedOn: Date; serviceJoinedOn: Date; birthdate: Date } {
  const serviceYear = joinedYear - (2 + (i % 6));
  return {
    joinedOn: new Date(Date.UTC(joinedYear, 5, 1)),
    serviceJoinedOn: new Date(Date.UTC(serviceYear, 5 + (i % 3), 1)),
    birthdate: new Date(Date.UTC(serviceYear - 24 - ((i * 3) % 9), (i * 5) % 12, 1 + ((i * 7) % 28))),
  };
}

/**
 * The substitution board for today: one subject teacher (timetable only, so
 * never the sweep's form teacher, whom the sweep marks present) is absent
 * today and their first lesson of the day is covered by a free colleague.
 * Nothing on a day the ZZ timetable has no lessons. Re-run safe: today's
 * rows are rebuilt.
 */
export async function buildSubstitutions(school: { id: string }, adminUserId: string, absent: { membership: { id: string } } | undefined) {
  const today = new Date().toISOString().slice(0, 10);
  await db.substitution.deleteMany({ where: { schoolId: school.id, dateKey: today } });
  if (!absent) return { covered: 0 };
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const slot = await db.timetableSlot.findFirst({ where: { schoolId: school.id, weekday, teacherMembershipId: absent.membership.id, class: { archivedAt: null } }, orderBy: { period: { position: "asc" } }, select: { id: true, periodId: true } });
  if (!slot) return { covered: 0 };
  await db.staffAttendance.upsert({
    where: { membershipId_dateKey: { membershipId: absent.membership.id, dateKey: today } },
    create: { schoolId: school.id, membershipId: absent.membership.id, dateKey: today, status: "ABSENT", source: "OFFICE", markedByUserId: adminUserId, note: "Rang in unwell." },
    update: { status: "ABSENT", source: "OFFICE", checkedInAt: null },
  });
  const busy = (await db.timetableSlot.findMany({ where: { schoolId: school.id, weekday, periodId: slot.periodId, teacherMembershipId: { not: null } }, select: { teacherMembershipId: true } })).map((s) => s.teacherMembershipId!);
  const away = (await db.staffAttendance.findMany({ where: { schoolId: school.id, dateKey: today, status: { in: ["ABSENT", "ON_LEAVE"] } }, select: { membershipId: true } })).map((r) => r.membershipId);
  const sub = await db.membership.findFirst({ where: { schoolId: school.id, role: "TEACHER", status: "ACTIVE", leftAt: null, id: { notIn: [...busy, ...away, absent.membership.id] } }, orderBy: { id: "asc" }, select: { id: true } });
  if (!sub) return { covered: 0 };
  await db.substitution.create({ data: { schoolId: school.id, dateKey: today, slotId: slot.id, absentMembershipId: absent.membership.id, substituteMembershipId: sub.id, note: "Worksheet is on the desk.", createdByUserId: adminUserId } });
  return { covered: 1 };
}

/**
 * A second lesson of today's absent teacher, covered by the head, so the
 * covering person's own doors (/teaching/covers/{id}/acknowledge and
 * /decline) have a row the API sweep's PRINCIPAL is named on. Not the
 * sweep's teacher: the grade-3 lead teaches every staffed period of the ZZ
 * week (free only in Friday's last period, which the fixture leaves
 * unstaffed), so no honest cover could name them. The head teaches nothing
 * and is free in every period. ZZ Northgate only (demo:schools does not
 * call it); run after buildSubstitutions, whose delete of today's rows it
 * relies on.
 */
export async function buildHeadCover(school: { id: string }, adminUserId: string, absent: { membership: { id: string } } | undefined) {
  if (!absent) return { covered: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const head = await db.membership.findFirst({ where: { schoolId: school.id, role: "PRINCIPAL", status: "ACTIVE", leftAt: null, user: { email: `zz.principal@${DOMAIN}` } }, select: { id: true } });
  if (!head) return { covered: 0 };
  const away = await db.staffAttendance.findFirst({ where: { membershipId: head.id, dateKey: today, status: { in: ["ABSENT", "ON_LEAVE"] } }, select: { id: true } });
  if (away) return { covered: 0 };
  const taken = (await db.substitution.findMany({ where: { schoolId: school.id, dateKey: today }, select: { slotId: true } })).map((r) => r.slotId);
  const slots = await db.timetableSlot.findMany({ where: { schoolId: school.id, weekday, teacherMembershipId: absent.membership.id, class: { archivedAt: null }, id: { notIn: taken } }, orderBy: { period: { position: "asc" } }, select: { id: true, periodId: true } });
  for (const slot of slots) {
    const busy = await db.timetableSlot.findFirst({ where: { schoolId: school.id, weekday, periodId: slot.periodId, teacherMembershipId: head.id }, select: { id: true } });
    if (busy) continue;
    await db.substitution.create({ data: { schoolId: school.id, dateKey: today, slotId: slot.id, absentMembershipId: absent.membership.id, substituteMembershipId: head.id, note: "ZZ the head takes this one.", createdByUserId: adminUserId } });
    return { covered: 1 };
  }
  return { covered: 0 };
}

/**
 * The syllabus for ZZ Northgate's grade 3: Mathematics and English lists,
 * the grade-3 class two chapters into each with one in progress, and two
 * lessons (one taught, one planned), so the head's coverage has rows and
 * the sweep has a unit and a lesson to move. Re-run safe.
 */
export async function buildSyllabus(school: { id: string }, opts: { grade?: string; lists?: Record<string, string[]> } = {}) {
  const grade = opts.grade ?? "3";
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: grade, archivedAt: null }, select: { id: true, gradeLevel: true, teachers: { where: { role: "LEAD" }, select: { teacherMembershipId: true }, take: 1 } }, orderBy: { name: "asc" } });
  if (!klass || !klass.teachers[0]) return { units: 0 };
  const lists: Record<string, string[]> = opts.lists ?? {
    Mathematics: ["Numbers to 10,000", "Addition and subtraction", "Multiplication tables", "Division", "Fractions", "Shapes and patterns", "Measurement", "Time and money", "Data handling"],
    English: ["The sentence", "Nouns and pronouns", "Reading: The clever crow", "Verbs and tenses", "Writing a paragraph", "Reading: Rain in the village", "Adjectives", "Letters and notices"],
  };
  let n = 0;
  for (const [subject, titles] of Object.entries(lists)) {
    const existing = await db.syllabusUnit.findMany({ where: { schoolId: school.id, gradeLevel: grade, subject }, orderBy: { position: "asc" }, select: { id: true } });
    const ids: string[] = [];
    for (const [i, title] of titles.entries()) {
      const id = existing[i]?.id;
      const row = id ? await db.syllabusUnit.update({ where: { id }, data: { position: i + 1, title }, select: { id: true } }) : await db.syllabusUnit.create({ data: { schoolId: school.id, gradeLevel: grade, subject, position: i + 1, title, periodsPlanned: 6 + (i % 3) * 2 }, select: { id: true } });
      ids.push(row.id);
      n += 1;
    }
    const states = ["DONE", "DONE", "IN_PROGRESS"] as const;
    for (const [i, status] of states.entries()) {
      await db.syllabusProgress.upsert({ where: { classId_unitId: { classId: klass.id, unitId: ids[i]! } }, create: { schoolId: school.id, classId: klass.id, unitId: ids[i]!, status, doneOn: status === "DONE" ? new Date(Date.now() - (30 - i * 10) * 86_400_000).toISOString().slice(0, 10) : null, byMembershipId: klass.teachers[0]!.teacherMembershipId }, update: { status } });
    }
    if (!(await db.lessonPlan.findFirst({ where: { classId: klass.id, subject, topic: `${TAG.prefix}${subject}: revision of chapter two` }, select: { id: true } }))) {
      await db.lessonPlan.create({ data: { schoolId: school.id, classId: klass.id, teacherMembershipId: klass.teachers[0]!.teacherMembershipId, subject, unitId: ids[1], dateKey: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10), topic: `${TAG.prefix}${subject}: revision of chapter two`, notes: "Worked examples on the board; the back row needs another go.", homework: "Exercise 2.4, questions 1 to 8.", status: "TAUGHT" } });
      await db.lessonPlan.create({ data: { schoolId: school.id, classId: klass.id, teacherMembershipId: klass.teachers[0]!.teacherMembershipId, subject, unitId: ids[2], dateKey: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), topic: `${TAG.prefix}${subject}: chapter three, first lesson`, status: "PLANNED" } });
    }
  }
  return { units: n };
}

/* -------------------------------------------------------------------------- */
/* the collection gaps: the calendar, roll numbers, fee adjustments, an        */
/* invite, a remark thread, a report, a practice assignment, departures, a     */
/* competition entry — the rows the data audit found nobody had seeded        */
/* -------------------------------------------------------------------------- */

/**
 * The school calendar for one year, in the school's language. Keyed on
 * (school, first day, kind), so a second run adds nothing and an entry the
 * office renamed keeps its name.
 */
export async function buildHolidays(school: { id: string }, entries: HolidaySpec[], opts: { academicYearId?: string | null; locale?: string } = {}) {
  let n = 0;
  for (const spec of entries) {
    const kind = spec.kind ?? "HOLIDAY";
    const existing = await db.holiday.findFirst({ where: { schoolId: school.id, startDateKey: spec.start, kind }, select: { id: true } });
    if (!existing) {
      await db.holiday.create({ data: { schoolId: school.id, academicYearId: opts.academicYearId ?? null, name: opts.locale === "mr" ? spec.mr : spec.en, startDateKey: spec.start, endDateKey: spec.end ?? spec.start, kind, note: spec.note ?? null } });
    }
    n += 1;
  }
  return { entries: n };
}

/**
 * The roll number the school assigned in each class: alphabetical, 1..n, the
 * way most Indian schools number a register. Live classes number their ACTIVE
 * enrolments; an archived class numbers everyone who sat in it. Only rows
 * whose number is wrong are written.
 */
export async function buildRollNumbers(school: { id: string }) {
  const classes = await db.class.findMany({ where: { schoolId: school.id }, select: { id: true, archivedAt: true } });
  let numbered = 0;
  for (const cls of classes) {
    const rows = await db.enrollment.findMany({ where: { classId: cls.id, ...(cls.archivedAt ? {} : { status: "ACTIVE" }) }, select: { id: true, rollNumber: true, student: { select: { user: { select: { name: true } } } } } });
    rows.sort((a, b) => untagged(a.student.user.name).localeCompare(untagged(b.student.user.name)));
    for (const [i, row] of rows.entries()) {
      if (row.rollNumber !== i + 1) await db.enrollment.update({ where: { id: row.id }, data: { rollNumber: i + 1 } });
      numbered += 1;
    }
  }
  return { numbered };
}

/**
 * Two things a fee office does that the plain structure never shows: a
 * concession (a percentage off one head for one pupil, with that pupil's
 * untouched demands recomputed line by line the way fees.ts does it — net is
 * gross less concession, status by what is paid) and a refund on a counter
 * payment (DONE, the newest allocation cut by the amount, the demand's paid
 * figure and status recomputed from what is left, the payment still PAID
 * because only part came back). Not called for the ZZ schools: the API sweep
 * reads Northgate's one payment and its demands as the fixture wrote them.
 */
export async function buildFeeAdjustments(
  school: { id: string },
  adminUserId: string,
  opts: { concession: { grade: string; headCode: string; percentBp: number; reason: string }; refund: { clientId: string; amountPaise: number; reason: string; on: Date } },
) {
  const year = await db.academicYear.findFirstOrThrow({ where: { schoolId: school.id, isCurrent: true }, select: { id: true } });
  const out = { concessions: 0, refunds: 0 };

  /* the concession: the first pupil of the grade who has paid nothing */
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: opts.concession.grade, archivedAt: null }, select: { id: true }, orderBy: { name: "asc" } });
  const head = await db.feeHead.findUnique({ where: { schoolId_code: { schoolId: school.id, code: opts.concession.headCode } }, select: { id: true } });
  if (klass && head) {
    const roll = await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true }, orderBy: { studentMembershipId: "asc" } });
    let pupil: string | null = null;
    for (const r of roll) {
      if (await db.feePayment.findFirst({ where: { studentMembershipId: r.studentMembershipId, status: { in: ["PAID", "REFUNDED"] } }, select: { id: true } })) continue;
      pupil = r.studentMembershipId;
      break;
    }
    if (pupil) {
      const concessions = await db.feeConcession.findMany({ where: { studentMembershipId: pupil, academicYearId: year.id, revokedAt: null }, select: { headId: true, kind: true, value: true } });
      if (!concessions.some((c) => c.headId === head.id && c.kind === "PERCENT")) {
        await db.feeConcession.create({ data: { schoolId: school.id, studentMembershipId: pupil, academicYearId: year.id, headId: head.id, kind: "PERCENT", value: opts.concession.percentBp, reason: opts.concession.reason, grantedByUserId: adminUserId } });
        concessions.push({ headId: head.id, kind: "PERCENT", value: opts.concession.percentBp });
      }
      // fees.ts: percentages on the line, amounts capped at the line, rounded to the paisa; untouched demands only.
      const demands = await db.feeDemand.findMany({ where: { studentMembershipId: pupil, academicYearId: year.id, instalmentId: { not: null }, paidPaise: 0 }, select: { id: true, status: true, instalment: { select: { lines: { select: { headId: true, amountPaise: true, head: { select: { code: true, name: true } } } } } } } });
      for (const d of demands) {
        if (!d.instalment || ["WAIVED", "CANCELLED", "CARRIED"].includes(d.status)) continue;
        const lines = d.instalment.lines.map((l) => {
          let off = 0;
          for (const c of concessions) {
            if (c.headId && c.headId !== l.headId) continue;
            off += c.kind === "PERCENT" ? Math.round((l.amountPaise * c.value) / 10000) : c.value;
          }
          return { headId: l.headId, code: l.head.code, name: l.head.name, grossPaise: l.amountPaise, concessionPaise: Math.max(0, Math.min(l.amountPaise, off)) };
        });
        const grossPaise = lines.reduce((a, l) => a + l.grossPaise, 0);
        const concessionPaise = lines.reduce((a, l) => a + l.concessionPaise, 0);
        const netPaise = grossPaise - concessionPaise;
        await db.feeDemand.update({ where: { id: d.id }, data: { grossPaise, concessionPaise, netPaise, linesJson: JSON.stringify(lines), status: netPaise === 0 ? "PAID" : "OPEN" } });
      }
      out.concessions = 1;
    }
  }

  /* the refund: part of one cash payment returned */
  const payment = await db.feePayment.findFirst({ where: { schoolId: school.id, clientId: opts.refund.clientId, status: "PAID" }, select: { id: true, amountPaise: true, refunds: { select: { id: true } }, allocations: { select: { id: true, demandId: true, amountPaise: true }, orderBy: { id: "desc" } } } });
  if (payment) {
    if (payment.refunds.length === 0 && opts.refund.amountPaise < payment.amountPaise) {
      await db.feeRefund.create({ data: { schoolId: school.id, paymentId: payment.id, amountPaise: opts.refund.amountPaise, reason: opts.refund.reason, status: "DONE", requestedByUserId: adminUserId, settledAt: opts.refund.on, createdAt: opts.refund.on } });
      // fees-payments.ts: the newest allocations are cut first, then paid and status come back from what is left.
      let left = opts.refund.amountPaise;
      for (const a of payment.allocations) {
        if (left <= 0) break;
        const cut = Math.min(a.amountPaise, left);
        await db.feeAllocation.update({ where: { id: a.id }, data: { amountPaise: a.amountPaise - cut } });
        left -= cut;
      }
      for (const demandId of new Set(payment.allocations.map((a) => a.demandId))) {
        const demand = await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { netPaise: true } });
        const paid = await db.feeAllocation.aggregate({ where: { demandId, payment: { status: { in: ["PAID", "REFUNDED"] } } }, _sum: { amountPaise: true } });
        const paidPaise = paid._sum.amountPaise ?? 0;
        await db.feeDemand.update({ where: { id: demandId }, data: { paidPaise, status: paidPaise >= demand.netPaise ? "PAID" : paidPaise > 0 ? "PART" : "OPEN" } });
      }
    }
    out.refunds = await db.feeRefund.count({ where: { paymentId: payment.id } });
  }
  return out;
}

/**
 * One pending teacher invitation, as the office's form writes it: the hash of
 * a token (never the token), fourteen days to accept. Keyed on the hash, which
 * is deterministic in the email, so a second run finds it; a revoked or
 * accepted one is left as it stands.
 */
export async function buildInvite(school: { id: string }, createdByMembershipId: string, spec: { email: string; name: string; subjects: string[]; classId?: string | null }) {
  const tokenHash = createHash("sha256").update(`fixture-invite:${school.id}:${spec.email}`).digest("hex");
  const existing = await db.invite.findUnique({ where: { tokenHash }, select: { id: true, status: true } });
  if (existing) return { inviteId: existing.id, status: existing.status };
  const row = await db.invite.create({ data: { schoolId: school.id, role: "TEACHER", email: spec.email, name: spec.name, subjects: JSON.stringify(spec.subjects), classId: spec.classId ?? null, tokenHash, status: "PENDING", createdByMembershipId, expiresAt: new Date(Date.now() + 14 * 86_400_000) }, select: { id: true, status: true } });
  return { inviteId: row.id, status: row.status };
}

/**
 * A remark thread between a form teacher and a parent about one pupil, two
 * messages: the teacher's remark, read by both, and the parent's reply, which
 * the teacher has not opened yet. Keyed on (pupil, teacher, subject).
 */
export async function buildRemarkThread(
  school: { id: string },
  spec: { studentMembershipId: string; teacherMembershipId: string; teacherUserId: string; parentUserId: string; subject: string; remark: string; reply: string; daysAgo?: number },
) {
  const existing = await db.remarkThread.findFirst({ where: { studentMembershipId: spec.studentMembershipId, teacherMembershipId: spec.teacherMembershipId, subject: spec.subject }, select: { id: true } });
  if (existing) return { threadId: existing.id, created: false };
  const first = new Date(Date.now() - (spec.daysAgo ?? 3) * 86_400_000);
  const second = new Date(first.getTime() + 5 * 3_600_000);
  const thread = await db.remarkThread.create({ data: { schoolId: school.id, studentMembershipId: spec.studentMembershipId, teacherMembershipId: spec.teacherMembershipId, subject: spec.subject, createdAt: first, lastMessageAt: second }, select: { id: true } });
  await db.remarkMessage.create({ data: { threadId: thread.id, schoolId: school.id, authorUserId: spec.teacherUserId, body: spec.remark, readBy: JSON.stringify([spec.teacherUserId, spec.parentUserId]), createdAt: first } });
  await db.remarkMessage.create({ data: { threadId: thread.id, schoolId: school.id, authorUserId: spec.parentUserId, body: spec.reply, readBy: JSON.stringify([spec.parentUserId]), createdAt: second } });
  return { threadId: thread.id, created: true };
}

/** One OPEN report on a comment (or a post), as the bulletin's report form files it. Keyed on (target, reporter). */
export async function buildReport(school: { id: string }, spec: { targetType: "POST" | "COMMENT"; targetId: string; reporterUserId: string; reason: "BULLYING" | "UNSAFE" | "SPAM" | "WRONG_INFO" | "PRIVACY" | "OTHER"; detail: string }) {
  const existing = await db.report.findFirst({ where: { targetType: spec.targetType, targetId: spec.targetId, reporterUserId: spec.reporterUserId }, select: { id: true } });
  if (existing) return { reportId: existing.id };
  const row = await db.report.create({ data: { schoolId: school.id, targetType: spec.targetType, targetId: spec.targetId, reporterUserId: spec.reporterUserId, reason: spec.reason, detail: spec.detail, status: "OPEN", createdAt: new Date(Date.now() - 86_400_000) }, select: { id: true } });
  return { reportId: row.id };
}

/**
 * A practice assignment: the class teacher asks the class to reach a level
 * on one topic of the shared bank at the class's own level, by a date. The
 * topic is the first of the preferred slugs that exists with questions, else
 * the first topic at that level. Nothing when the bank is not imported.
 */
export async function buildPracticeAssignment(school: { id: string }, spec: { classId: string; classLevel: number; createdByMembershipId: string; preferSlugs: string[]; targetLevel: number; note: string; dueAt: Date }) {
  const topics = await db.quizTopic.findMany({ where: { classLevel: spec.classLevel, retiredAt: null, questions: { some: {} } }, select: { id: true, slug: true, name: true }, orderBy: [{ subject: "asc" }, { position: "asc" }] });
  const topic = spec.preferSlugs.map((s) => topics.find((t) => t.slug === s)).find(Boolean) ?? topics[0];
  if (!topic) return { assignments: 0, topic: null };
  const existing = await db.practiceAssignment.findFirst({ where: { classId: spec.classId, topicId: topic.id, archivedAt: null }, select: { id: true } });
  if (!existing) await db.practiceAssignment.create({ data: { schoolId: school.id, classId: spec.classId, topicId: topic.id, targetLevel: spec.targetLevel, note: spec.note, dueAt: spec.dueAt, createdById: spec.createdByMembershipId } });
  return { assignments: 1, topic: topic.name };
}

/**
 * Departures, both halves. A pupil who has LEFT: a membership with `leftAt`
 * set (status stays ACTIVE — see school-record.ts), the enrolment REMOVED
 * and dated, and the SchoolRecord the office issued with every column
 * `recordDeparture` freezes — the school's name, the class as printed, the
 * conduct, the reason, the attendance counted over the stay, the serial in
 * the school's own TC/<year>/<n> series. And a pupil still on the roll whose
 * departure is SCHEDULED for a day to come. Both keyed so a second run finds
 * them.
 */
export async function buildDepartures(
  ctx: Ctx,
  school: { id: string; name: string },
  adminMembershipId: string,
  spec: {
    leaver: { email: string; name: string; classId: string; grade: string; birthdate: Date; joinedOn: Date; leftOn: Date; destination: string; note: string; conduct: "EXCELLENT" | "GOOD" | "SATISFACTORY" };
    scheduled: { membershipId: string; leaveOnKey: string; reason: "TRANSFERRED" | "GRADUATED" | "LEFT"; destination: string; note: string; conduct: "EXCELLENT" | "GOOD" | "SATISFACTORY" } | null;
  },
) {
  const { leaver } = spec;
  const user = await upsertUser(ctx, leaver.email, leaver.name, { birthdate: leaver.birthdate, isMinor: true });
  let membership = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: user.id, schoolId: school.id, role: "STUDENT" } }, select: { id: true, leftAt: true, joinedAt: true, studentCode: true, gradeLevel: true } });
  if (!membership) {
    membership = await db.membership.create({ data: { userId: user.id, schoolId: school.id, role: "STUDENT", status: "ACTIVE", gradeLevel: leaver.grade, studentCode: studentCode(), joinedAt: leaver.joinedOn, leftAt: leaver.leftOn }, select: { id: true, leftAt: true, joinedAt: true, studentCode: true, gradeLevel: true } });
  }
  const enrolment = await db.enrollment.findUnique({ where: { classId_studentMembershipId: { classId: leaver.classId, studentMembershipId: membership.id } }, select: { id: true } });
  if (!enrolment) await db.enrollment.create({ data: { classId: leaver.classId, schoolId: school.id, studentMembershipId: membership.id, status: "REMOVED", enrolledAt: leaver.joinedOn, removedAt: leaver.leftOn } });
  if (!membership.leftAt) await db.membership.update({ where: { id: membership.id }, data: { leftAt: leaver.leftOn } });
  // The leaver stays connected as an alumnus, as recordDeparture makes them (alumni-membership.ts).
  await openAlumnus(db as unknown as Parameters<typeof openAlumnus>[0], user.id, school.id, membership.leftAt ?? leaver.leftOn);
  let record = await db.schoolRecord.findUnique({ where: { studentMembershipId: membership.id }, select: { id: true } });
  if (!record) {
    const klass = await db.class.findUniqueOrThrow({ where: { id: leaver.classId }, select: { name: true, section: true } });
    const className = klass.section && !klass.name.toLowerCase().endsWith(klass.section.toLowerCase()) ? `${klass.name} ${klass.section}` : klass.name;
    const marks = await db.attendanceRecord.groupBy({ by: ["status"], where: { schoolId: school.id, studentMembershipId: membership.id }, _count: { _all: true } });
    const counted = marks.reduce((a, r) => a + r._count._all, 0);
    const present = marks.filter((r) => r.status === "PRESENT" || r.status === "LATE").reduce((a, r) => a + r._count._all, 0);
    const reportCardCount = await db.reportCard.count({ where: { schoolId: school.id, studentMembershipId: membership.id, status: "PUBLISHED" } });
    const prefix = `TC/${leaver.leftOn.getUTCFullYear()}/`;
    const last = await db.schoolRecord.findFirst({ where: { schoolId: school.id, serial: { startsWith: prefix } }, orderBy: { serial: "desc" }, select: { serial: true } });
    const serial = `${prefix}${String(last?.serial ? Number(last.serial.slice(prefix.length)) + 1 : 1).padStart(4, "0")}`;
    record = await db.schoolRecord.create({
      data: {
        schoolId: school.id, studentUserId: user.id, studentMembershipId: membership.id, schoolName: school.name, gradeLevel: membership.gradeLevel, joinedAt: membership.joinedAt, leftAt: leaver.leftOn,
        serial, studentName: untagged(leaver.name), admissionNumber: null, birthdate: leaver.birthdate, className: untagged(className), conduct: leaver.conduct,
        reason: "TRANSFERRED", destination: leaver.destination, note: leaver.note, attendanceMarked: counted, attendancePresent: present, reportCardCount, issuedByMembershipId: adminMembershipId, createdAt: leaver.leftOn,
      },
      select: { id: true },
    });
  }
  let scheduled = 0;
  if (spec.scheduled) {
    const s = spec.scheduled;
    await db.scheduledDeparture.upsert({
      where: { membershipId: s.membershipId },
      create: { schoolId: school.id, membershipId: s.membershipId, leaveOnKey: s.leaveOnKey, reason: s.reason, destination: s.destination, note: s.note, conduct: s.conduct, scheduledByMembershipId: adminMembershipId },
      update: {},
    });
    scheduled = 1;
  }
  return { leaverMembershipId: membership.id, recordId: record.id, scheduled };
}

/**
 * One entry in a PUBLISHED platform competition (no organising school — the
 * platform's own, which nothing here may create) with a result recorded, the
 * guardian's consent given, and the school's standing written the way
 * `refreshStanding` writes it: entrants with a result, best place, best score.
 * Skipped, with the reason, when no such competition exists.
 */
export async function buildCompetitionEntry(
  school: { id: string; name: string },
  spec: { title: string; studentMembershipId: string; parentUserId: string | null; rank: number; scoreMilli: number; submissionUrl: string; enteredOn: Date },
) {
  const competition = await db.competition.findFirst({ where: { title: spec.title, status: "PUBLISHED", organizerSchoolId: null }, select: { id: true, requiresParentConsent: true, gradeLow: true, gradeHigh: true } });
  if (!competition) return { entries: 0, skipped: `no published platform competition titled "${spec.title}"` };
  if (competition.requiresParentConsent && !spec.parentUserId) return { entries: 0, skipped: "the competition needs a guardian's consent and the pupil has no guardian" };
  await db.competitionEntry.upsert({
    where: { competitionId_studentMembershipId: { competitionId: competition.id, studentMembershipId: spec.studentMembershipId } },
    create: { competitionId: competition.id, studentMembershipId: spec.studentMembershipId, schoolId: school.id, status: "RESULTS", parentConsentAt: spec.parentUserId ? spec.enteredOn : null, parentConsentBy: spec.parentUserId, submissionUrl: spec.submissionUrl, scoreMilli: spec.scoreMilli, rank: spec.rank, createdAt: spec.enteredOn },
    update: {},
  });
  const scored = await db.competitionEntry.findMany({ where: { competitionId: competition.id, schoolId: school.id, OR: [{ rank: { not: null } }, { scoreMilli: { not: null } }], ...(competition.requiresParentConsent ? { parentConsentAt: { not: null } } : {}) }, select: { rank: true, scoreMilli: true } });
  const ranks = scored.map((e) => e.rank).filter((r): r is number => r !== null);
  const scores = scored.map((e) => e.scoreMilli).filter((s): s is number => s !== null);
  const standing = { schoolName: school.name, entrants: scored.length, bestRank: ranks.length ? Math.min(...ranks) : null, bestScoreMilli: scores.length ? Math.max(...scores) : null };
  await db.competitionStanding.upsert({ where: { competitionId_schoolId: { competitionId: competition.id, schoolId: school.id } }, create: { competitionId: competition.id, schoolId: school.id, ...standing }, update: standing });
  return { entries: 1, skipped: null, competitionId: competition.id };
}

export async function buildTimetable(
  schoolId: string,
  classes: { id: string; grade: string }[],
  staff: { membership: { id: string } }[],
  opts: { days?: number[]; unstaffedWeekday?: number | null; subjects?: string[] } = {},
) {
  const days = opts.days ?? SCHOOL_DAYS;
  const unstaffedWeekday = opts.unstaffedWeekday === undefined ? 5 : opts.unstaffedWeekday;
  const subjects = opts.subjects ?? ROTA_SUBJECTS;
  const periods = [];
  for (const spec of PERIODS) periods.push(await upsertPeriod(schoolId, spec));

  const lessons = periods.filter((p) => p.kind === "LESSON");
  let created = 0;
  let unstaffed = 0;

  for (const weekday of days) {
    for (const [lessonIndex, period] of lessons.entries()) {
      // Friday, last lesson: laid out but not yet staffed.
      const leaveUnstaffed = weekday === unstaffedWeekday && lessonIndex === lessons.length - 1;
      for (const [classIndex, cls] of classes.entries()) {
        const offset = weekday * lessons.length + lessonIndex;
        const rota = (classIndex + offset) % staff.length;
        const teacher = staff[rota]!;
        await upsertSlot({
          schoolId,
          classId: cls.id,
          periodId: period.id,
          weekday,
          subject: subjects[rota % subjects.length]!,
          teacherMembershipId: leaveUnstaffed ? null : teacher.membership.id,
          room: `R${cls.grade}01`,
        });
        created++;
        if (leaveUnstaffed) unstaffed++;
      }
    }
  }
  return { periods: periods.length, lessonPeriods: lessons.length, slots: created, unstaffed };
}

/* -------------------------------------------------------------------------- */
/* school B — deliberately empty                                               */
/* -------------------------------------------------------------------------- */

async function buildSouthbank(ctx: Ctx) {
  const school = await upsertSchool({
    name: "ZZ Southbank School",
    slug: "zz-southbank-school",
    city: "Nashik",
    contactEmail: `office.southbank@${DOMAIN}`,
    gradeLow: "5",
    gradeHigh: "8",
    brandPrimary: "#b45309",
  });

  const admin = await upsertUser(ctx, `zz.admin.b@${DOMAIN}`, "ZZ Gopal Shirke");
  await upsertMembership(admin.id, school.id, "ADMIN", { title: "School administrator" });

  const principal = await upsertUser(ctx, `zz.principal.b@${DOMAIN}`, "ZZ Farida Qureshi");
  await upsertMembership(principal.id, school.id, "PRINCIPAL", { title: "Principal" });

  const teacherSpecs = [
    { email: `zz.teacher.b1@${DOMAIN}`, name: "ZZ Nitin Wagh", title: "Class teacher", subjects: ["Mathematics"] },
    { email: `zz.teacher.b2@${DOMAIN}`, name: "ZZ Asha Pillai", title: "Class teacher", subjects: ["English"] },
    { email: `zz.teacher.b3@${DOMAIN}`, name: "ZZ Sameer Bhosale", title: "Class teacher", subjects: ["Science"] },
  ];
  const teachers = [];
  for (const spec of teacherSpecs) {
    const user = await upsertUser(ctx, spec.email, spec.name);
    const membership = await upsertMembership(user.id, school.id, "TEACHER", {
      title: spec.title,
      subjects: JSON.stringify(spec.subjects),
    });
    teachers.push({ user, membership });
  }

  const idleSpecs = [
    { email: `zz.spare.b1@${DOMAIN}`, name: "ZZ Manisha Kadam", title: "Newly joined", subjects: ["Mathematics"] },
    { email: `zz.spare.b2@${DOMAIN}`, name: "ZZ Yusuf Tamboli", title: "Relief teacher", subjects: ["Geography"] },
  ];
  const idleTeachers = [];
  for (const spec of idleSpecs) {
    const user = await upsertUser(ctx, spec.email, spec.name);
    const membership = await upsertMembership(user.id, school.id, "TEACHER", {
      title: spec.title,
      subjects: JSON.stringify(spec.subjects),
    });
    idleTeachers.push({ user, membership });
  }

  // Two classes carry pupils; Grade 8 is left deliberately EMPTY. A class with
  // no pupils is a state the register, the mark sheet and the analytics panel
  // all have to survive, and once every class has children in it there is
  // nowhere left in either school to see that happen.
  const classSpecs = [
    { name: "ZZ Grade 6 · A", gradeLevel: "6", color: "#0ea5e9", room: "S601", pupils: 5 },
    { name: "ZZ Grade 7 · A", gradeLevel: "7", color: "#8b5cf6", room: "S701", pupils: 5 },
    { name: "ZZ Grade 8 · A", gradeLevel: "8", color: "#14b8a6", room: "S801", pupils: 0 },
  ];

  const unclaimed: { name: string; code: string; birthdate: string; grade: string }[] = [];
  let studentSeq = 0;
  // Offset past Northgate's 48 so the two schools never share a pupil's name.
  let nameIndex = GRADES.length * PER_CLASS;

  for (const [index, spec] of classSpecs.entries()) {
    const cls = await upsertClass(school.id, spec.name, {
      subject: "Form group",
      gradeLevel: spec.gradeLevel,
      section: "A",
      color: spec.color,
      room: spec.room,
    });
    await attachTeacher(cls.id, school.id, teachers[index]!.membership.id);

    for (let seat = 0; seat < spec.pupils; seat++) {
      studentSeq++;
      const name = studentName(nameIndex++);
      const email = `zz.sb.pupil${String(studentSeq).padStart(2, "0")}@${DOMAIN}`;
      const birthYear = THIS_YEAR - (Number(spec.gradeLevel) + 5);
      const birthdate = new Date(Date.UTC(birthYear, (seat * 2) % 12, 10 + seat));

      const user = await upsertUser(ctx, email, name, { birthdate, isMinor: true });
      const existing = await db.membership.findUnique({
        where: { userId_schoolId_role: { userId: user.id, schoolId: school.id, role: "STUDENT" } },
      });
      const membership =
        existing ??
        (await db.membership.create({
          data: {
            userId: user.id,
            schoolId: school.id,
            role: "STUDENT",
            status: "ACTIVE",
            gradeLevel: spec.gradeLevel,
            studentCode: studentCode(),
          },
        }));
      await enrol(cls.id, school.id, membership.id);

      // Only the first two seats in each class get a parent — the rest stay
      // unclaimed, which is the state the claim flow needs to have something
      // to work on in this school too.
      if (seat < 2) {
        const parent = await upsertUser(
          ctx,
          `zz.sb.parent${String(studentSeq).padStart(2, "0")}@${DOMAIN}`,
          `ZZ ${name.split(" ")[2]} (parent)`,
        );
        await link(parent.id, membership.id, school.id);
      } else {
        unclaimed.push({
          name,
          code: membership.studentCode!,
          birthdate: birthdate.toISOString().slice(0, 10),
          grade: spec.gradeLevel,
        });
      }
    }
  }

  return { school, teachers, idleTeachers, principal, admin, unclaimed };
}

/* -------------------------------------------------------------------------- */
/* school C — one person, several hats                                         */
/* -------------------------------------------------------------------------- */

/**
 * Every adult here holds more than one context, which is what the switcher
 * (/switch on the web, "Where you belong" on the phone) exists for:
 *
 *   admin      ADMIN + TEACHER at Banyan, and a parent of a Banyan pupil
 *   principal  PRINCIPAL at Banyan, and a parent of a Banyan pupil
 *   teacher 1  TEACHER at Banyan, and a parent of a Banyan pupil in ANOTHER
 *              class — so they are never their own child's teacher
 *   teacher 2  TEACHER at Banyan AND at Southbank
 *   parent     a child at Banyan and a child at Southbank — the parent whose
 *              one PARENT context has to span two schools
 *
 * The Southbank child is zz.sb.pupil01, who already has a parent: a second
 * guardian is ordinary, and it leaves Southbank's unclaimed list untouched.
 */
async function buildBanyan(ctx: Ctx, southbankSchoolId: string) {
  const school = await upsertSchool({
    name: "ZZ Banyan School",
    slug: "zz-banyan-school",
    city: "Kolhapur",
    contactEmail: `office.banyan@${DOMAIN}`,
    gradeLow: "3",
    gradeHigh: "5",
    brandPrimary: "#6d28d9",
  });

  const admin = await upsertUser(ctx, `zz.admin.c@${DOMAIN}`, "ZZ Priya Naik");
  await upsertMembership(admin.id, school.id, "ADMIN", { title: "School administrator" });
  const adminAsTeacher = await upsertMembership(admin.id, school.id, "TEACHER", {
    title: "Class teacher",
    subjects: JSON.stringify(["Mathematics"]),
  });

  const principal = await upsertUser(ctx, `zz.principal.c@${DOMAIN}`, "ZZ Lata Bhonsle");
  await upsertMembership(principal.id, school.id, "PRINCIPAL", { title: "Principal" });

  const teacher1 = await upsertUser(ctx, `zz.teacher.c1@${DOMAIN}`, "ZZ Suresh Kale");
  const teacher1Membership = await upsertMembership(teacher1.id, school.id, "TEACHER", {
    title: "Class teacher",
    subjects: JSON.stringify(["English"]),
  });

  const teacher2 = await upsertUser(ctx, `zz.teacher.c2@${DOMAIN}`, "ZZ Nilesh Gaikwad");
  const teacher2Membership = await upsertMembership(teacher2.id, school.id, "TEACHER", {
    title: "Class teacher",
    subjects: JSON.stringify(["Science"]),
  });
  await upsertMembership(teacher2.id, southbankSchoolId, "TEACHER", {
    title: "Visiting teacher",
    subjects: JSON.stringify(["Science"]),
  });

  const parent = await upsertUser(ctx, `zz.parent.c@${DOMAIN}`, "ZZ Rekha Sawant");

  // Three classes, one per grade; who leads which is the point of the school.
  const classSpecs = [
    { name: "ZZ Grade 3 · A", gradeLevel: "3", color: "#f59e0b", room: "B301", pupils: 4, lead: teacher1Membership.id },
    { name: "ZZ Grade 4 · A", gradeLevel: "4", color: "#10b981", room: "B401", pupils: 4, lead: adminAsTeacher.id },
    { name: "ZZ Grade 5 · A", gradeLevel: "5", color: "#6366f1", room: "B501", pupils: 3, lead: teacher2Membership.id },
  ];

  const pupils: { email: string; name: string; membershipId: string; grade: string }[] = [];
  let studentSeq = 0;
  // Offset past Northgate's 48 and Southbank's 10, so no pupil shares a name.
  let nameIndex = GRADES.length * PER_CLASS + 10;

  for (const spec of classSpecs) {
    const cls = await upsertClass(school.id, spec.name, {
      subject: "Form group",
      gradeLevel: spec.gradeLevel,
      section: "A",
      color: spec.color,
      room: spec.room,
    });
    await attachTeacher(cls.id, school.id, spec.lead);

    for (let seat = 0; seat < spec.pupils; seat++) {
      studentSeq++;
      const name = studentName(nameIndex++);
      const email = `zz.by.pupil${String(studentSeq).padStart(2, "0")}@${DOMAIN}`;
      const birthYear = THIS_YEAR - (Number(spec.gradeLevel) + 5);
      const birthdate = new Date(Date.UTC(birthYear, (seat * 3) % 12, 12 + seat));
      const user = await upsertUser(ctx, email, name, { birthdate, isMinor: true });
      const existing = await db.membership.findUnique({
        where: { userId_schoolId_role: { userId: user.id, schoolId: school.id, role: "STUDENT" } },
      });
      const membership =
        existing ??
        (await db.membership.create({
          data: { userId: user.id, schoolId: school.id, role: "STUDENT", status: "ACTIVE", gradeLevel: spec.gradeLevel, studentCode: studentCode() },
        }));
      await enrol(cls.id, school.id, membership.id);
      pupils.push({ email, name, membershipId: membership.id, grade: spec.gradeLevel });
    }
  }

  // Who is whose parent. Grade 3 · A is pupils 1–4, Grade 4 · A is 5–8, Grade 5 · A is 9–11.
  const [p1, p2, , , p5, , , , p9] = pupils;
  await link(admin.id, p1!.membershipId, school.id); //     admin's child, Grade 3 (not the class they lead)
  await link(principal.id, p9!.membershipId, school.id); // principal's child, Grade 5
  await link(teacher1.id, p5!.membershipId, school.id); //  teacher 1's child, Grade 4 (they lead Grade 3)
  await link(parent.id, p2!.membershipId, school.id); //    the two-school parent's Banyan child
  const southbankChild = await db.membership.findFirst({
    where: { schoolId: southbankSchoolId, role: "STUDENT", user: { email: `zz.sb.pupil01@${DOMAIN}` } },
    select: { id: true },
  });
  if (southbankChild) await link(parent.id, southbankChild.id, southbankSchoolId);

  return { school, pupils, hats: { admin, principal, teacher1, teacher2, parent }, children: { p1: p1!, p2: p2!, p5: p5!, p9: p9! }, southbankChild: Boolean(southbankChild) };
}

/* -------------------------------------------------------------------------- */
/* experts + operator                                                          */
/* -------------------------------------------------------------------------- */

const EXPERTS = [
  {
    email: `zz.expert1@${DOMAIN}`,
    name: "ZZ Dr Meenakshi Rao",
    headline: "Careers in engineering and applied science",
    organisation: "ZZ Institute of Technology",
    specialisms: ["Careers", "Engineering", "Olympiad maths"],
    offering: "BOTH",
    mentorCapacity: 3,
    published: true,
    verified: true,
    slots: 3,
  },
  {
    email: `zz.expert2@${DOMAIN}`,
    name: "ZZ Captain Arun Bhide",
    headline: "Talks on navigation, weather and the sea",
    organisation: "ZZ Merchant Marine (retired)",
    specialisms: ["Careers", "Geography"],
    offering: "SESSIONS",
    mentorCapacity: null,
    published: true,
    verified: true,
    slots: 2,
  },
  {
    email: `zz.expert3@${DOMAIN}`,
    name: "ZZ Dr Sara Thomas",
    headline: "Dyslexia support and inclusive classrooms",
    organisation: "ZZ Learning Trust",
    specialisms: ["Dyslexia support", "Inclusion"],
    offering: "MENTORING",
    mentorCapacity: 2,
    published: true,
    verified: false, // published but unverified — the curation queue's middle state
    slots: 0,
  },
  {
    email: `zz.expert4@${DOMAIN}`,
    name: "ZZ Anand Kher",
    headline: "Financial literacy for senior grades",
    organisation: "ZZ Cooperative Bank",
    specialisms: ["Economics", "Financial literacy"],
    offering: "BOTH",
    mentorCapacity: 1,
    published: false, // invisible to every school until an operator publishes
    verified: false,
    slots: 0,
  },
] as const;

async function buildExperts(ctx: Ctx) {
  const made: string[] = [];
  for (const spec of EXPERTS) {
    const user = await upsertUser(ctx, spec.email, spec.name);
    const existing = await db.expertProfile.findUnique({ where: { userId: user.id } });
    const profile =
      existing ??
      (await db.expertProfile.create({
        data: {
          userId: user.id,
          headline: spec.headline,
          bio: `${spec.name} is a ZZ test fixture. Nothing here describes a real person.`,
          specialisms: JSON.stringify(spec.specialisms),
          organisation: spec.organisation,
          timezone: "Asia/Kolkata",
          offering: spec.offering,
          mentorCapacity: spec.mentorCapacity,
          publishedAt: spec.published ? new Date() : null,
          verifiedAt: spec.verified ? new Date() : null,
          verifiedBy: spec.verified ? "zz-fixtures" : null,
        },
      }));

    // Free slots, one a week from a fixed Monday so they never fall in the past
    // relative to each other and a booking test always has something to book.
    const existingSlots = await db.expertSlot.count({ where: { expertProfileId: profile.id } });
    if (existingSlots === 0) {
      for (let i = 0; i < spec.slots; i++) {
        const startsAt = new Date(Date.UTC(2026, 8, 7 + i * 7, 10, 0, 0)); // Sept 2026 Mondays
        await db.expertSlot.create({
          data: {
            expertProfileId: profile.id,
            startsAt,
            endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
            note: "One-hour session",
          },
        });
      }
    }
    made.push(
      `${spec.name} — ${spec.offering}, ${spec.published ? "published" : "UNPUBLISHED"}` +
        `${spec.verified ? " + verified" : spec.published ? " (unverified)" : ""}, ${spec.slots} slot(s)`,
    );
  }
  return made;
}

/**
 * The operator account, WITH the superuser flag already set.
 *
 * `make-superuser.ts` exists because there is deliberately no UI for this: the
 * first superuser cannot be invited by a superuser, so somebody with shell
 * access has to say so once. This script has exactly that authorisation — it is
 * already running as the database owner to create schools — so making the
 * fixture complete in one command rather than two is the same decision, not a
 * weaker one. The flag dies with the account on teardown.
 */
async function buildOperator(ctx: Ctx) {
  const user = await upsertUser(ctx, `zz.operator@${DOMAIN}`, "ZZ Platform Operator");
  if (!user.isSuperuser) {
    return db.user.update({ where: { id: user.id }, data: { isSuperuser: true } });
  }
  return user;
}

/**
 * A content-team account carrying the app-admin flag and NOTHING else.
 *
 * Deliberately separate from the operator above, which holds both flags. The
 * two are different jobs and the app has to be walkable as each: an operator
 * runs the platform, while an app admin only curates the shared question bank
 * and posts platform-wide competitions. Testing curation while signed in as a
 * superuser proves nothing, because a superuser can reach those screens for a
 * different reason — so the flag is granted here on its own, and the account
 * is the one to use for asking whether the content team can actually work.
 */
async function buildContentTeam(ctx: Ctx) {
  const user = await upsertUser(ctx, `zz.appadmin@${DOMAIN}`, "ZZ Content Curator");
  if (!user.isAppAdmin) {
    return db.user.update({ where: { id: user.id }, data: { isAppAdmin: true } });
  }
  return user;
}

/* -------------------------------------------------------------------------- */

/**
 * The fixtures mint known passwords and a superuser: never against a database
 * that is not on this machine, never on production. The URL's host is checked
 * first, then the server itself is asked where it answered (a `fly proxy` to
 * production is "localhost" too) — scripts/local-db-guard.mjs.
 */
export async function refuseUnlessLocal(what = "zz:fixtures"): Promise<void> {
  const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL ?? "";
  let host = "";
  try { host = new URL(url).hostname; } catch { host = ""; }
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  if (process.env.NODE_ENV === "production" || !local) {
    throw new Error(`refusing to build fixtures: NODE_ENV=${process.env.NODE_ENV ?? "unset"}, database host "${host || "unknown"}" is not local`);
  }
  await refuseUnlessLocalDatabase(db, what);
}

async function main() {
  await refuseUnlessLocal();
  if (process.argv.includes("--teardown")) {
    await teardown();
    return;
  }

  const passwordHash = await hash(PASSWORD, ARGON);
  const ctx: Ctx = { passwordHash };

  // Every ZZ school and person is a fixture, whichever script made it (the
  // seed, a sweep, an older run of this one): the flag is what keeps them out
  // of the directories real schools read.
  await db.school.updateMany({ where: { name: { startsWith: "ZZ " }, isTestFixture: false }, data: { isTestFixture: true } });
  await db.user.updateMany({ where: { OR: [{ email: { endsWith: "@zz.test" } }, { email: { startsWith: "zz." } }, { name: { startsWith: "ZZ " } }], isTestFixture: false }, data: { isTestFixture: true } });
  // What a walk or a sweep left that no fixture should hold, at the ZZ schools alone, school by school (zz-cleanup.ts):
  // registers with no marks (R-25) and the API sweep's fixed-day register at Northgate (R-51).
  const emptied = await removeEmptyRegisters(db);
  const sweepRegister = await removeSweepRegister(db);
  console.log(`  Clean-up: ${emptied.removed} register(s) with no marks at ${emptied.schools} ZZ school(s)${emptied.removed ? ` (${Object.entries(emptied.bySchool).map(([slug, n]) => `${slug} ${n}`).join(", ")})` : ""}; the sweep's fixed-day register ${sweepRegister ? "removed" : "not there"}`);

  const northgate = await buildNorthgate(ctx);
  const fees = await buildFees(northgate.school, northgate.admin.id);
  const texts = await buildMessaging(northgate.school, northgate.admin.id);
  const health = await buildHealth(northgate.school, northgate.admin.id);
  const incidents = await buildIncidents(northgate.school, northgate.admin.id);
  const circular = await buildCircular(northgate.school, northgate.admin.id);
  const staffAtt = await buildStaffAttendance(northgate.school, northgate.admin.id);
  const syllabus = await buildSyllabus(northgate.school);
  const subs = await buildSubstitutions(northgate.school, northgate.admin.id, northgate.subjectTeachers[0]);
  const headCover = await buildHeadCover(northgate.school, northgate.admin.id, northgate.subjectTeachers[0]);
  const exams = await buildExams(northgate.school, northgate.admin.id);
  const certs = await buildCertificates(northgate.school, northgate.admin.id);
  const admissions = await buildAdmissions(northgate.school, northgate.admin.id, fees.structure.id);
  const staffRecords = await buildStaffRecords(northgate.school, [...northgate.teachers, ...northgate.subjectTeachers]);
  // The collection gaps, for Northgate: this year's calendar, roll numbers, a pending invite, a remark
  // thread, a practice assignment. Fee adjustments, departures and competition entries are the demo
  // schools' alone — the sweeps read Northgate's one payment, its rolls and its competitions as they are.
  const calendar = await buildHolidays(northgate.school, CALENDAR_2026_27, { academicYearId: fees.year.id });
  const rolls = await buildRollNumbers(northgate.school);
  const adminMembership = await db.membership.findFirstOrThrow({ where: { schoolId: northgate.school.id, userId: northgate.admin.id, role: "ADMIN" }, select: { id: true } });
  const invite = await buildInvite(northgate.school, adminMembership.id, { email: `zz.invite1@${DOMAIN}`, name: "ZZ Sadhana Pawar", subjects: ["Hindi"] });
  const pupil01 = await db.membership.findFirstOrThrow({ where: { schoolId: northgate.school.id, role: "STUDENT", user: { email: `zz.pupil01@${DOMAIN}` } }, select: { id: true } });
  const parent01 = await db.user.findUniqueOrThrow({ where: { email: `zz.parent01@${DOMAIN}` }, select: { id: true } });
  await buildRemarkThread(northgate.school, { studentMembershipId: pupil01.id, teacherMembershipId: northgate.teachers[0]!.membership.id, teacherUserId: northgate.teachers[0]!.user.id, parentUserId: parent01.id, subject: "ZZ Reading at home", remark: "Reads aloud well in class now; twenty minutes a day at home would carry it further.", reply: "Thank you — we have started with the library book each evening." });
  const grade6 = await db.class.findFirstOrThrow({ where: { schoolId: northgate.school.id, gradeLevel: "6", archivedAt: null }, select: { id: true, teachers: { where: { role: "LEAD" }, select: { teacherMembershipId: true }, take: 1 } } });
  const practice = await buildPracticeAssignment(northgate.school, { classId: grade6.id, classLevel: 6, createdByMembershipId: grade6.teachers[0]!.teacherMembershipId, preferSlugs: ["maths-6-integers", "maths-6-knowing-our-numbers"], targetLevel: 3, note: "Reach level 3 before the unit test.", dueAt: new Date("2026-10-16T12:30:00Z") });
  const waiting = await buildWaiting(ctx, northgate.school, { pupilEmail: `zz.pupil01@${DOMAIN}`, others: true });
  console.log(`  Waiting for a yes: join ${waiting.join.id}, claim ${waiting.claim.id}; not the sweep's to decide: ${waiting.otherJoin?.id ?? "none"}, ${waiting.otherClaim?.id ?? "none"}`);
  const principal = await db.user.findUnique({ where: { email: `zz.principal@${DOMAIN}` }, select: { id: true } });
  const signatures = await buildSignatures(northgate.school, { adminUserId: northgate.admin.id, principalUserId: principal?.id });
  console.log(`  Signatures: the admin's, the head's and the seal; on certificate ${signatures.paperId ?? "none"} the admin's drawn and the head's waiting; on the report cards "${signatures.cardSet ?? "none"}" the class teacher's drawn and the head's waiting`);
  const gigs = await buildGigQuestions(northgate.school);
  console.log(`  Questions for the bank: ${gigs.waiting ? `one waiting (${gigs.waiting}), one returned, one taken back, in "${gigs.topic}"` : "none (no bank imported, or no lead for Grade 3)"}`);
  const recordChanges = await buildRecordChanges(northgate.school, northgate.admin.id, { pupilEmail: `zz.pupil01@${DOMAIN}`, waiting: true });
  console.log(`  Asks to change a record: declined ${recordChanges.declined}, waiting ${recordChanges.waiting ?? "none"}`);
  const southbank = await buildSouthbank(ctx);
  await buildRecordChanges(southbank.school, southbank.admin.id, { tag: "southbank" });
  // One certificate at the second school, with a signed line on it, so the cross-school probe has a picture address to be refused.
  await buildCertificates(southbank.school, southbank.admin.id, { grade: "6", recordGrades: [], templates: [{ kind: "BONAFIDE", locale: "en" }], issues: [{ key: "BONAFIDE-en", pupil: 0, number: 1, purpose: "a bus pass" }] });
  await buildSignatures(southbank.school, { adminUserId: southbank.admin.id });
  // The same pair at the second school, for Northgate's staff to be refused from outside.
  await buildWaiting(ctx, southbank.school, { tag: "southbank" });
  await buildRollNumbers(southbank.school);
  const banyan = await buildBanyan(ctx, southbank.school.id);
  await buildRollNumbers(banyan.school);
  const experts = await buildExperts(ctx);
  const sessions = await buildGigSessions(northgate.school, southbank.school);
  console.log(`  Sessions: ${sessions.confirmed ? `pupil 01's confirmed seat ${sessions.confirmed}, one not held, a workshop with pupil 02, two open times, a teacher's half hour; one at Southbank` : "none (no published ZZ expert)"}`);
  // The rows the API sweep's otherwise-skipped doors are sampled with (scripts/sweep-doors.ts), after the experts and Southbank they name.
  const doors = await buildSweepDoors(db, northgate.school.id);
  console.log(`  Sweep doors: ${doors.length ? doors.join(", ") : "none (Northgate's people not found)"}`);
  const operator = await buildOperator(ctx);
  const contentTeam = await buildContentTeam(ctx);
  // The modules: every one on at Northgate, the four module roles there; Southbank and Banyan keep the default (ALUMNI).
  const moduleCount = await switchModulesOn(northgate.school, SCHOOL_MODULES, northgate.admin.id);
  const grade10 = await db.class.findFirstOrThrow({ where: { schoolId: northgate.school.id, gradeLevel: "10", archivedAt: null }, select: { id: true } });
  const moduleRoles = await buildModuleRoles(ctx, northgate.school, adminMembership.id, {
    domain: DOMAIN, prefix: "zz.", driver: "ZZ Ganesh Pawar", librarian: "ZZ Meera Joshi", warden: "ZZ Sudhir Patil",
    alumnus: { name: "ZZ Kavya Shinde", email: `zz.alumni01@${DOMAIN}`, classId: grade10.id, grade: "10", birthdate: new Date("2010-03-12T00:00:00Z") },
  });
  // Transport (3 Oct 2026): a route, a bus, zz.driver01 on it, pupils 01 and 02 riding, yesterday's trip ended, today's waiting.
  const transport = await buildTransport(db, northgate.school);
  // Alumni (3 Oct 2026): zz.alumni01's room with her former teacher and two tagged posts; zz.alumni02, an adult, in the directory as a mentor.
  const alumni = await buildAlumni(db, northgate.school);
  // Library and hostel (3 Oct 2026): 20 titles, 30 copies, two loans (pupil 01's overdue), a queue, two fines; ZZ Tilak House with pupils 01–03, a leave, last night's roll call, a menu.
  const libraryHostel = await buildLibraryHostel(db, northgate.school);

  // Inventory and payroll (3 Oct 2026): the stores, the asset register and one locked payroll month at Northgate (zz-fixtures-inventory-payroll.ts).
  const stores = await buildInventory(db, northgate.school, northgate.admin.id);
  const payroll = await buildPayroll(db, northgate.school, northgate.admin.id);
  // The college foundation (4 Oct 2026): ZZ Vidya College with every module and a person in every college role, ZZ Shastri Autonomous College, and a recruiter.
  const colleges = await buildColleges(db, ctx.passwordHash);
  // The same locked payroll month at ZZ Vidya College (6 Oct 2026): the ACCOUNTS actor lives there, and the API sweep's
  // valid-body probe of POST /admin/payroll/runs/{month}/share needs a run of its own school to share (it answered 404).
  const vidyaAdmin = await db.membership.findFirst({ where: { schoolId: colleges.vidya.id, role: "ADMIN", status: "ACTIVE" }, select: { userId: true } });
  const collegePayroll = vidyaAdmin ? await buildPayroll(db, { id: colleges.vidya.id, code: colleges.vidya.code }, vidyaAdmin.userId) : null;
  if (collegePayroll) console.log(`  Payroll at ZZ Vidya College: ${collegePayroll.slips} slips for ${collegePayroll.month}${collegePayroll.made ? "" : " (already there)"}`);
  // The college's academics (4 Oct 2026): Vidya's departments, scheme, courses, this term, PHY101's twenty lectures, a condonation and locked internal marks (zz-academics.ts).
  const academics = await buildAcademics(db);
  if (academics) console.log(`  Academics at ZZ Vidya College: ${academics.lectures} PHY101 lectures, internal marks ${academics.locked ? "locked" : "open"}`);
  // The college exam cell (4 Oct 2026): Vidya's last-term sitting published with a backlog, a revaluation and a grade card; this term's taking forms; Shastri's in conduct with a sealed paper (zz-exams.ts).
  const collegeExams = await buildCollegeExams(db);
  console.log(collegeExams ? `  Exam cell: ${collegeExams.published} results published at ZZ Vidya College, ${collegeExams.forms} forms, Shastri's question paper ${collegeExams.sealed ? "sealed" : "NOT sealed (no FEES_SECRET_KEY)"} — /exam-cell, /student/exams, /faculty/exams` : "  Exam cell: NOT built (the colleges or their academics are missing)");
  // The college office (4 Oct 2026): fee structures by category, demands and a paid term, scholarship claims, a CAP round with applications in each state, a no-dues with the library line open, college certificates, the library, hostel and bus at a college (zz-college-office.ts).
  const office = await buildCollegeOffice(db);
  console.log(office ? `  College office at ZZ Vidya College: ${office.demands} demands for ${office.students - 1} students, ${office.claims} scholarship claims, ${office.applications} applications — /accounts, /admin/college-admissions, /student/money` : "  College office at ZZ Vidya College: NOT built (the college, its people or its programme are missing)");
  // Placement (4 Oct 2026): ZZ Zeta Analytics checked with zz.recruiter01 bound, this season's open drive and last season's closed one with zz.calumni01's offer, an internship, a project, the alumna as a mentor, the aptitude bank (zz-placement.ts).
  const placement = await buildPlacement(db);
  console.log(placement ? `  Placement at ZZ Vidya College: ${placement.drives} drives (one OPEN, one CLOSED), season ${placement.season}, ${placement.bank} new bank questions${placement.backlogForStudent03 ? "" : " — zz.cstudent03 has no live backlog yet (the exam cell's fixture), so the open drive shows them eligible"} — /placement, /recruiter, /student/placement` : "  Placement at ZZ Vidya College: NOT built (the college or its people are missing)");
  // The IQAC desk (4 Oct 2026), last of the college builders so its predictor reads their rows: Vidya's NAAC cycle computed, three qualitative scores, the registers, committees, surveys, grievances, an AQAR filed and the disclosure published where the streams bring it — not at Vidya since 5 Oct 2026 (zz-iqac.ts).
  const iqac = await buildIqac(db);
  console.log(iqac ? `  IQAC at ZZ Vidya College: CGPA ${iqac.cgpa.toFixed(2)} over ${iqac.metrics} metrics scored, ${iqac.research} research items, ${iqac.activities} activities, ${iqac.filings} filing(s) — /iqac, /student/voice (no AICTE disclosure: Vidya's streams do not bring it)` : "  IQAC at ZZ Vidya College: NOT built (the college or its people are missing)");
  // The streams (5 Oct 2026): Vidya's programmes given their stream; the colleges' streams and zz.faculty01's duties are zz-college.ts's.
  const streamFx = await buildStreamFixtures(db);
  console.log(streamFx ? `  Streams: ZZ Vidya College ARTS + SCIENCE + COMMERCE (${streamFx.programmes} programmes given a stream), ZZ Shastri ENGINEERING; zz.faculty01 LAB_INCHARGE + ANTI_RAGGING_SQUAD — /duties/anti-ragging` : "  Streams: NOT built (ZZ Vidya College is missing)");
  // Stream records and the duties' desks (S2, 5 Oct 2026): Vidya's lab batch, practical record, NSS unit and a squad visit, zz.faculty01's duties widened; Shastri's BTech division in two lab batches with a practical record each (zz-stream-records.ts).
  const streamRecords = await buildStreamRecords(db);
  console.log(streamRecords ? `  Stream records: ZZ Vidya College ${streamRecords.vidyaRecords} practical rows, ${streamRecords.nssEnrolled} NSS volunteers, zz.faculty01 now LAB_INCHARGE + NSS_OFFICER + NCC_OFFICER + ANTI_RAGGING_SQUAD + RESEARCH_DEAN + EXAM_SQUAD; ZZ Shastri ${streamRecords.shastriBatches} lab batches, ${streamRecords.shastriRecords} practical rows — /duties/lab, /admin/stream-records` : "  Stream records: NOT built (the colleges or their academics are missing)");
  // The clinical desk (R-56, the clinical half; 10 Oct 2026): ZZ Dhanvantari Nursing College (HEALTH_SCIENCES) with its people,
  // a B.Sc. Nursing division of three, the civil hospital with two wards, a rotation of two postings and an entry in each
  // state (zz-clinical.ts). Its own college, so no other fixture's streams change.
  const clinical = await buildClinical(db, ctx.passwordHash);
  console.log(clinical ? `  Clinical desk at ZZ Dhanvantari Nursing College: ${clinical.students} students posted, ${clinical.postings} postings, ${clinical.entries} logbook entries (SIGNED, RETURNED, SUBMITTED, DRAFT); zz.faculty.d1 CLINICAL_COORDINATOR, zz.faculty.d2 supervises — /duties/clinical, /faculty/clinical, /student/clinical` : "  Clinical desk: NOT built");
  // R-20 (decisions builder, 10 Oct 2026): ZZ Shastri's graduating batches for the NBA SAR's success indices — a batch that
  // completed last year (one in time, one late, one exited) and one still running (zz-nba-batches.ts). KEEP IT AFTER the
  // stream records' builder (the programme) and BEFORE the council filings (the SAR reads them).
  const nbaBatches = await buildNbaBatches(db);
  console.log(nbaBatches ? `  NBA batches at ZZ Shastri: ${nbaBatches.students} students in ${nbaBatches.batches} earlier batches (2022: one graduated in time, one late, one exited; 2023 running) — /iqac/documents/nba` : "  NBA batches: NOT built (ZZ Shastri's engineering programme is missing: run the stream records first)");
  // The councils' returns (5 Oct 2026, the filings builder): ZZ Shastri's mechanical department's NBA SAR, drafted with three
  // criteria written (zz-council-filings.ts). KEEP IT AFTER the stream records' builder, which makes that department.
  const councilFx = await buildCouncilFilings(db);
  console.log(councilFx ? `  Council filings: ZZ Shastri's NBA SAR drafted (${councilFx.computed} marks from the records + ${councilFx.self} self-assessed) — /iqac/documents/nba` : "  Council filings: NOT built (ZZ Shastri's engineering department is missing: run the stream records first)");
  // The studio desk (R-56, the studio half, 10 Oct 2026): ZZ Vidya College gains ARCHITECTURE, a BArch programme with AR101 offered this term to zz.cstudent01–03,
  // one studio with four stages, the interim jury signed and the final jury ahead; zz.faculty01 adds STUDIO_COORDINATOR (zz-studio.ts). KEEP IT AFTER the stream records' builder, which sets zz.faculty01's duties.
  const studioFx = await buildStudioFixtures(db);
  console.log(studioFx ? `  Studio desk: ZZ Vidya College + ARCHITECTURE, ${studioFx.studios} studio on AR101, ${studioFx.juries} juries (${studioFx.signed} signed), ${studioFx.submissions} submissions; zz.faculty01 also STUDIO_COORDINATOR — /duties/studio, /faculty/studios, /student/studios` : "  Studio desk: NOT built (ZZ Vidya College, its people or its term are missing)");
  // The risks batch's college builds (package 5B, 5 Oct 2026): a pre-placement talk for the open drive and one held, a soft-skills
  // training with sessions and marks, the gate reader with its badges, the NAAC peer-team visit file (zz-college-extras.ts).
  // KEEP IT AFTER the placement and IQAC builders, whose drive, cycle and AQAR it names.
  const extras = await buildCollegeExtras(db);
  console.log(extras ? `  College extras at ZZ Vidya College: ${extras.talks} talks, a training of ${extras.sessions} sessions (${extras.completed} completed), the gate reader${extras.deviceSealed ? "" : " (key NOT sealed: FEES_SECRET_KEY unset)"}, the NAAC visit file with ${extras.visitLines} evidence lines — /placement/talks, /placement/training, /admin/attendance-devices, /iqac/visits` : "  College extras at ZZ Vidya College: NOT built (the college or its people are missing)");
  // Homework at a college (R-48, risks batch 5A, 5 Oct 2026): PHY101's lab report with two hand-ins and a mark, the PHY103 elective's reading, a draft (zz-college-homework.ts). KEEP IT AFTER the academics.
  const homework = await buildCollegeHomework(db);
  console.log(homework ? `  College homework: ZZ Vidya College ${homework.work} pieces of work (one a draft, one on the elective with no class), ${homework.handedIn} hand-ins, ${homework.marked} marked — /faculty/work, /student/assignments` : "  College homework: NOT built (ZZ Vidya College or its academics are missing)");
  // The plan items of risks batch 5A (5 Oct 2026): Vidya's reading-room register today, its student council with two notices, the appointment letter templates and zz.faculty02's letter (zz-plan-items.ts). KEEP IT AFTER the college office (Vidya's current year).
  const planItems = await buildPlanItems(db);
  console.log(planItems ? `  Plan items at ZZ Vidya College: ${planItems.visits} reading-room visits today (one still inside), "ZZ Student Council" of ${planItems.councilMembers} with ${planItems.notices} notices (one waiting for review), ${planItems.templates} appointment letter templates${planItems.letter ? `, zz.faculty02's letter ${planItems.letter}` : " (no current year: no letter)"} — /library/reading-room, /bulletin/council, /admin/certificates/appointments, /account/letters` : "  Plan items: NOT built (ZZ Vidya College or its people are missing)");
  console.log(`  Inventory: ${stores.items} items, ${stores.movements} movements, ${stores.assets} assets${stores.made ? "" : " (already there)"}; payroll: ${payroll.salaries} salaries, ${payroll.slips} payslips, ${payroll.month} locked${payroll.made ? "" : " (already there)"}`);
  // ---- competitions-crawler (12 Oct 2026): the official organisers the competitions crawler reads. Platform
  // configuration, not school data: added only when the root URL is not in the table at all, so a source the
  // desk disabled or removed stays as the desk left it, and --teardown leaves them alone. ----
  const competitionSources = await seedCompetitionSources(db);
  console.log(`  Competition sources: ${competitionSources.added} official organisers added, ${competitionSources.present} already listed — /appadmin?tab=sources, /root/competitions?tab=sources`);
  // ---- end competitions-crawler ----
  // ---- expert-registration (15 Oct 2026): one PENDING expert application, so the operator's queue at /root/experts has
  // a row. Idempotent: made only when no application from the address is waiting; no document (the form's upload is
  // what the test proves), so "No document was sent." shows. Removed by --teardown with the ZZ people. ----
  const applicantEmail = `zz.expert.applicant@${DOMAIN}`;
  const waitingApplication = await db.expertApplication.findFirst({ where: { email: applicantEmail, status: "PENDING" }, select: { id: true } });
  if (!waitingApplication) {
    await db.expertApplication.create({
      data: {
        name: "ZZ Expert Applicant",
        email: applicantEmail,
        phone: "+919876500001",
        city: "Pune",
        organisation: "ZZ Robotics Lab",
        headline: "ZZ robotics engineer who coaches school teams",
        specialisms: JSON.stringify(["ENGINEERING", "CODING", "OLYMPIADS"]),
        languages: JSON.stringify(["en", "mr"]),
        yearsExperience: 9,
        bio: "ZZ Expert Applicant is a ZZ test fixture. Nothing here describes a real person.",
        links: JSON.stringify(["https://example.org/zz-expert-applicant"]),
        offering: "SESSIONS",
        declarationAt: new Date(),
        locale: "en",
      },
    });
  }
  console.log(`  Expert application: ZZ Expert Applicant <${applicantEmail}> ${waitingApplication ? "already waiting" : "added, waiting"} — /root/experts`);
  // ---- end expert-registration ----
  // website-builder A (15 Oct 2026): ZZ Northgate's public website — the module on, a draft with every section and number on,
  // one approved post with a consented picture, and a published version (zz-website.ts; idempotent).
  const website = await buildWebsite(db, northgate.school, northgate.admin.id);
  console.log(`  Website: ZZ Northgate ${website.published ? "published now" : "already published"}, every section on — /admin/website, /sites/${website.slug}`);
  // end website-builder A
  // website-builder B (15 Oct 2026): ZZ Northgate's own website domain, waiting for DNS (a .test name never resolves,
  // so Verify leaves it there with "No record was found"). Idempotent: kept when it is there; any other domain the
  // school was given since (a test, a hand) is put back to this one. Removed with the school by --teardown.
  const zzDomain = "www.zz-northgate.test";
  const domainRows = await db.schoolSiteDomain.findMany({ where: { schoolId: northgate.school.id }, select: { id: true, domain: true } });
  const keptDomain = domainRows.some((r) => r.domain === zzDomain);
  await db.schoolSiteDomain.deleteMany({ where: { schoolId: northgate.school.id, domain: { not: zzDomain } } });
  if (!keptDomain) await db.schoolSiteDomain.create({ data: { schoolId: northgate.school.id, domain: zzDomain, status: "PENDING_DNS", certStatus: "NONE", createdByUserId: northgate.admin.id } });
  console.log(`  Website domain: ${zzDomain} at ZZ Northgate ${keptDomain ? "already there" : "added, waiting for DNS"} — /admin/website/domain, /root/sites`);
  // end website-builder B

  const studentCount = await db.membership.count({
    where: { schoolId: northgate.school.id, role: "STUDENT" },
  });
  const guardianCount = await db.guardianship.count({
    where: { studentSchoolId: northgate.school.id },
  });
  const sbPupils = await db.membership.count({
    where: { schoolId: southbank.school.id, role: "STUDENT" },
  });
  const sbGuardians = await db.guardianship.count({
    where: { studentSchoolId: southbank.school.id },
  });

  console.log(`
  ZZ fixtures ready. Password for every account below: ${process.env.ZZ_PASSWORD ? "set from ZZ_PASSWORD" : "the usual fixture value (prisma/seed.ts)"}, not shown

  ── ZZ Northgate School (populated) ──────────────────────────────────
     join code   ${northgate.school.code}
     admin       zz.admin@${DOMAIN}         (ZZ Anita Deshmukh)
     principal   zz.principal@${DOMAIN}     (ZZ Rohan Iyer)
     teachers    zz.teacher1..4@${DOMAIN}   — form tutors, two classes each
     subject     zz.subject1..4@${DOMAIN}   — timetable only, no form class
     unattached  zz.spare1..2@${DOMAIN}     — no class, no lessons, nothing
     classes     ${GRADES.length} (grades ${GRADES[0]}–${GRADES[GRADES.length - 1]}, section A)
     timetable   ${northgate.timetable.lessonPeriods} lesson periods + a break, Mon–Fri,
                 ${northgate.timetable.slots} slots (${northgate.timetable.unstaffed} left unstaffed on Friday, last period)
     pupils      ${studentCount}  (zz.pupil01..${String(studentCount).padStart(2, "0")}@${DOMAIN})
     guardians   ${guardianCount} link(s) — zz.parentNN@${DOMAIN} matches zz.pupilNN
     fees        year ${fees.year.name}; "${fees.structure.name}" published, ${fees.pupils} grade-3 pupils on it,
                 ${fees.receipts} receipt (zz.pupil01's Term 1, cash) — /admin/fees, /parent/fees
     texts       ${texts.numbered} guardians numbered +91 98764 00001…, SMS and WhatsApp on, one notice sent — /admin/messaging
     health      ${health.cards} health cards on the first three pupils (peanut allergy, asthma, a check-up) — /parent/health, /people/<id>
     incidents   ${incidents.incidents} incidents (a closed grazed knee, an open sick-room visit) — /admin/incidents, /parent/incidents
     circular    one notice asking for an acknowledgement, told to every guardian, opened by two, acknowledged by one — /admin/circulars, /bulletin/${circular.postId}
     staff       ${staffAtt.marked} staff-register marks over five working days for ${staffAtt.staff} staff, one late and one absent — /admin/staff-attendance
     syllabus    ${syllabus.units} chapters for grade 3 (Mathematics, English), the grade-3 class two chapters in with one in progress — /admin/syllabus, /principal
     exams       ${exams.series} series in Term 1 with ${exams.papers} papers, ${exams.marks} marks; ${exams.cards} report cards (Term 1 published with co-scholastic grades, a draft set) — /admin/report-cards
     certificates ${certs.templates} templates (en, mr, one retired hi), ${certs.records} grade-3 pupil records (the last missing its admission date), ${certs.issued} issued (one revoked), ${certs.requests} asks (one pending, one declined, one cancelled) — /admin/certificates
     filings     UDISE 27250100101, MSBSHSE, Marathi medium; grade-3 records carry gender, BPL/EWS, one impairment, two Marathi names; ${staffRecords.records} staff records — /admin/filings
     admissions  ${admissions.cycles} cycles (one open for grades 3 and 6 with a test, one closed), ${admissions.slots} sittings (one cancelled), ${admissions.applications} applications from zz.parent01 in every state and one walk-in — /admin/admissions, /parent/applications
     substitutes ${subs.covered + headCover.covered} lesson(s) covered today (zz.subject1 absent, a free colleague on their first lesson, zz.principal on the next) — /admin/substitutions
     calendar    ${calendar.entries} entries for 2026–27 (holidays, the mid-term exam span, the annual day); ${rolls.numbered} roll numbers — /admin/calendar
     modules     ${moduleCount} of ${SCHOOL_VERSION_MODULES.length} on; zz.driver01, zz.librarian, zz.warden@${DOMAIN}; alumnus zz.alumni01@${DOMAIN} (left grade 10 in April 2026${moduleRoles.alumnus ? "" : ", alumnus row NOT found"}) — /driver, /library, /hostel, /alumni
     alumni      ${alumni ? `zz.alumni01 writes to her grade-10 teacher${alumni.room ? "" : " (no class teacher found: no room)"}, ${alumni.posts} tagged posts; zz.alumni02@${DOMAIN} (left 2018) in the directory as a mentor` : "NOT built (alumnus, admin or grade 10 missing)"} — /alumni, /alumni/directory, /admin/alumni
     library     ${libraryHostel ? `${libraryHostel.titles} titles, ${libraryHostel.copies} copies; zz.pupil01 five days overdue, zz.pupil02 first in the queue for title 1, a fine due and one settled` : "NOT built (pupils 01–03, librarian, warden or admin missing)"} — /library, /student/library, /parent/library
     hostel      ${libraryHostel ? `ZZ Tilak House, ${libraryHostel.rooms} rooms, zz.pupil01–03 boarding, last night's roll call taken, a leave approved and back` : "NOT built"} — /hostel, /admin/hostel, /parent/hostel
     transport   ${transport ? `${transport.route}: ${transport.stops} stops, bus MH 12 ZZ 1001 with zz.driver01, ${transport.riders} pupils riding, yesterday's morning trip ended (${transport.positions} positions), today's (${transport.today}) waiting` : "NOT built (driver or pupils missing)"} — /admin/transport, /driver, /parent/transport
     also        invite ${invite.status} for zz.invite1@${DOMAIN}; a remark thread (zz.teacher1 ↔ zz.parent01 about zz.pupil01); practice assignment for grade 6${practice.topic ? ` on "${practice.topic}"` : " (no bank imported: none)"}

  ── ZZ Vidya College (kind COLLEGE, every module on) ─────────────────
     join code   ${colleges.vidya.code}
     office      zz.cadmin@${DOMAIN} (registrar), zz.cprincipal@${DOMAIN}
     staff       zz.faculty01, zz.faculty02, zz.hod01, zz.examctrl, zz.iqac, zz.tpo, zz.accounts @${DOMAIN} — /faculty, /hod, /exam-cell, /iqac, /placement, /accounts
     students    zz.cstudent01 (17, a minor), zz.cstudent02 (20), zz.cstudent03 (19) @${DOMAIN} — /student/consent
     guardian    zz.cparent01@${DOMAIN}: of cstudent01 (sees everything) and cstudent02 (sees only what she grants; nothing yet)
     alumnus     zz.calumni01@${DOMAIN}, left in 2025

  ── ZZ Shastri Autonomous College (kind AUTONOMOUS_COLLEGE) ──────────
     join code   ${colleges.shastri.code}; ACADEMICS, EXAMS and ALUMNI on, the rest off
     people      zz.cadmin.s, zz.faculty.s1, zz.cstudent.s1 @${DOMAIN}

  ── Recruiter (no college) ───────────────────────────────────────────
     zz.recruiter01@${DOMAIN} (ZZ Zeta Analytics) — /recruiter

  ── ZZ Southbank School (small) ──────────────────────────────────────
     join code   ${southbank.school.code}
     admin       zz.admin.b@${DOMAIN}       (ZZ Gopal Shirke)
     principal   zz.principal.b@${DOMAIN}   (ZZ Farida Qureshi)
     teachers    zz.teacher.b1..b3@${DOMAIN} — one class each
     unattached  zz.spare.b1..b2@${DOMAIN}  — no class, no lessons, nothing
     classes     3 (grades 6–8); Grade 8 · A deliberately has NO pupils
     timetable   none — Southbank has no grid at all, by design
     pupils      ${sbPupils}  (zz.sb.pupil01..${String(sbPupils).padStart(2, "0")}@${DOMAIN})
     guardians   ${sbGuardians} link(s) — zz.sb.parentNN matches zz.sb.pupilNN
     unclaimed   ${southbank.unclaimed.length} pupil(s), codes listed below

  ── ZZ Banyan School (one person, several hats) ──────────────────────
     join code   ${banyan.school.code}
     admin       zz.admin.c@${DOMAIN}       (ZZ Priya Naik)     admin + teacher of Grade 4 · A + parent of ${banyan.children.p1.name} (grade 3)
     principal   zz.principal.c@${DOMAIN}   (ZZ Lata Bhonsle)   principal + parent of ${banyan.children.p9.name} (grade 5)
     teacher     zz.teacher.c1@${DOMAIN}    (ZZ Suresh Kale)    teacher of Grade 3 · A + parent of ${banyan.children.p5.name} (grade 4)
     teacher     zz.teacher.c2@${DOMAIN}    (ZZ Nilesh Gaikwad) teacher of Grade 5 · A + teacher at Southbank
     parent      zz.parent.c@${DOMAIN}      (ZZ Rekha Sawant)   parent of ${banyan.children.p2.name} here and zz.sb.pupil01 at Southbank${banyan.southbankChild ? "" : " (Southbank child NOT found)"}
     pupils      ${banyan.pupils.length}  (zz.by.pupil01..${String(banyan.pupils.length).padStart(2, "0")}@${DOMAIN}), grades 3–5, one class each

  ── Experts ──────────────────────────────────────────────────────────
${experts.map((e) => `     ${e}`).join("\n")}

  ── Operator ─────────────────────────────────────────────────────────
     ${operator.email}   superuser: ${operator.isSuperuser ? "GRANTED" : "not granted"}
     Opens /root. Revoke with:  npm run superuser -- ${operator.email} --revoke

  ── Content team (app admin, NOT a superuser) ────────────────────────
     ${contentTeam.email}   app admin: ${contentTeam.isAppAdmin ? "GRANTED" : "not granted"}
     Curates the shared bank; cannot reach /root. Revoke with:
     npm run appadmin -- ${contentTeam.email} --revoke

  ── Unclaimed pupils (for walking the parent-claim flow) ─────────────
     Claiming needs the code AND the child's birthdate.
     Northgate:
${northgate.unclaimed
  .slice(0, 6)
  .map((u) => `       grade ${u.grade.padEnd(2)}  ${u.code}   ${u.birthdate}   ${u.name}`)
  .join("\n")}
       …and ${Math.max(0, northgate.unclaimed.length - 6)} more at Northgate.
     Southbank:
${southbank.unclaimed
  .map((u) => `       grade ${u.grade.padEnd(2)}  ${u.code}   ${u.birthdate}   ${u.name}`)
  .join("\n")}

  Remove everything again with:  npm run zz:fixtures -- --teardown
`);
}

// Only when run as a script: `demo-schools.ts` imports the builders above and
// must not build the ZZ fixtures as a side effect of the import.
if (process.argv[1]?.endsWith("zz-fixtures.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
