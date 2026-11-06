/**
 * Two complete demo schools with plain names, every role populated and every
 * workflow carrying data, behind ONE shared password.
 *
 *   npm run demo:schools
 *
 * WHY THIS IS NOT THE ZZ SCRIPT. `zz-fixtures.ts` builds the sweeps' fixtures:
 * every name carries "ZZ ", every email is on @zz.test, and the sweeps key on
 * those. A pitch needs Sunrise Public School and Saraswati Vidya Mandir with
 * real-looking people in them. So this script IMPORTS the ZZ builders — fees,
 * texts, health, incidents, the circular, the staff register, exams, the
 * certificates, admissions, staff records, substitutions, the syllabus and the
 * timetable — sets their name tag to "", and builds what they do not: the
 * previous year's cards, the class registers, the social feed, the quiz
 * activity, an expert with bookings and a mentorship, vacancies with their
 * enquiries, meetings, leave, and the one parent with a child at each school.
 *
 * IDEMPOTENT. Every write is find-or-create keyed on something stable (email,
 * slug, class name, title, a unique pair), so a second run adds nothing; the
 * builders that rebuild a day's or a year's rows (certificates, admissions,
 * today's substitutions) end with the same counts. The block of counts at the
 * end is there so two runs can be compared line for line.
 *
 * WHAT IT NEVER TOUCHES: any row that is not a demo row. It finds schools by
 * these two slugs and people by @demo.relay.test, and nothing else. The one
 * exception is the existing expert anjali.rao@expert.test, who is GIVEN a slot
 * and a booking at Saraswati if she exists, and left alone if she does not.
 *
 * Runs on the ADMIN connection, like the ZZ script: it creates schools.
 */
import { hash } from "@node-rs/argon2";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { classCode, studentCode } from "../src/lib/codes";
import { bandFor, combineTerms, DEFAULT_REPORT_CARD_CONFIG, meanPercent, meanPoints, shownPercent } from "../src/lib/report-card-rules";
import {
  attachTeacher, buildAdmissions, buildCertificates, buildCircular, buildSignatures, buildCompetitionEntry, buildCompetitionEvent, buildDepartures, buildExams, buildUpcomingExam, buildFeeAdjustments, buildFees, buildHealth, buildHolidays, buildIncidents,
  buildInvite, buildMessaging, buildPracticeAssignment, buildRemarkThread, buildReport, buildRollNumbers, buildStaffAttendance, buildStaffRecords, buildSubstitutions, buildSyllabus, buildTimetable,
  CALENDAR_2025_26, CALENDAR_2026_27, CLASS_COLOURS, closedDays, db, enrol, link, setTag, staffDates, teachingDaysBetween, THIS_YEAR, upsertClass, upsertMembership, upsertSchool, upsertUser, type Ctx, fakePen, refuseUnlessLocal, switchModulesOn } from "./zz-fixtures";
import { PLATFORM_FEATURES, SCHOOL_MODULES } from "@edulink/contracts";
// owner-batch-item4a: imports of Sunrise's transport, hostel and library builders (end of file)
import { addDaysToKey, todayKey, weekdayOfKey, zonedStartOfDay } from "../src/lib/dates";
// owner-batch-item4a end
// owner-batch-item5: Sunrise's route fees and mess bill through the office's own functions, as a script actor of the admin
import { randomBytes } from "node:crypto";
import { billMess, raiseRouteFees } from "../src/lib/college-fees";
import { giveHeadPages, HEAD_PAGES_NOTE } from "./head-pages"; // owner-batch-item9
import type { ActiveContext } from "../src/lib/session";
// owner-batch-item5 end
// owner-batch-item4b: Sunrise's inventory, payroll, website, alumni, review rounds and online fees (scripts/demo-schools-item4b.ts)
import { buildSunriseItem4b, item4bRosterSection } from "./demo-schools-item4b";
import { featureLegend, markFeatureGated } from "./demo-feature-paths"; // qb-C
// owner-batch-item4b end

setTag("");

const DOMAIN = "demo.relay.test";
export const PASSWORD = "Relay-Demo-2026";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const GRADES = ["5", "6", "7", "8", "9", "10"];
const PER_CLASS = 8;
const PARENTS_PER_CLASS = 5;
const DAY = 86_400_000;

const SUNITA = { email: `sunita.deshmukh@${DOMAIN}`, name: "Sunita Deshmukh", phone: "+919822011223" };
const VIKRAM = { email: `vikram.sethi@${DOMAIN}`, name: "Dr Vikram Sethi" };
const ANJALI_EMAIL = "anjali.rao@expert.test";

/* -------------------------------------------------------------------------- */
/* the two schools                                                             */
/* -------------------------------------------------------------------------- */

type StaffSpec = { name: string; title: string; subjects: string[] };
type SchoolSpec = {
  key: "sunrise" | "svm";
  name: string;
  slug: string;
  city: string;
  locale: "en" | "mr";
  brand: string;
  addressLine: string;
  contactPhone: string;
  about: string;
  filing: { udiseCode: string; board: string; affiliationNumber: string; district: string; block: string; medium: string; managementType: string };
  admin: { name: string };
  principal: { name: string };
  formTeachers: StaffSpec[];
  subjectTeachers: StaffSpec[];
  spare: StaffSpec;
  /** The language paper on the exams and the annual card. */
  language: string;
  /** The child of the cross-school parent: which grade, and the child's name. */
  deshmukh: { grade: string; first: string; email: string };
  phonePrefix: string;
  codePrefix: string;
  previousSchool: string;
  /** The grade-8 pupil who joined in June and left in August, and where they went. */
  leaver: { name: string; destination: string; note: string };
  /** Where the grade-8 pupil whose departure is scheduled for the year's end is going. */
  scheduledDestination: string;
  /** The teacher the office has invited and who has not yet accepted. */
  invite: { name: string; subjects: string[] };
  pupilFirst: string[];
  pupilLast: string[];
  parentFirst: string[];
};

const SUNRISE: SchoolSpec = {
  key: "sunrise",
  name: "Sunrise Public School",
  slug: "sunrise-public-school",
  city: "Pune",
  locale: "en",
  brand: "#0f766e",
  addressLine: "Plot 14, Baner Road",
  contactPhone: "+912027290150",
  about: "A CBSE school in Baner, Pune, for grades 5 to 10. English medium, with a strong science and robotics programme, a library open till six, and an entrance test for grades 5 and 6 each January.",
  filing: { udiseCode: "27250200201", board: "CBSE", affiliationNumber: "1130456", district: "Pune", block: "Haveli", medium: "English", managementType: "PRIVATE_UNAIDED" },
  admin: { name: "Meenal Joshi" },
  principal: { name: "Dr Rajesh Kulkarni" },
  formTeachers: [
    { name: "Priya Nair", title: "Class teacher, Grade 5", subjects: ["Mathematics", "Science"] },
    { name: "Sameer Deshpande", title: "Class teacher, Grade 6", subjects: ["Science", "Mathematics"] },
    { name: "Kavita Rao", title: "Class teacher, Grade 7", subjects: ["Social Science", "English"] },
    { name: "Arjun Mehta", title: "Class teacher, Grade 8", subjects: ["Mathematics", "Computer Science"] },
    { name: "Neha Bhosale", title: "Class teacher, Grade 9", subjects: ["Science", "Mathematics"] },
    { name: "Vinod Sharma", title: "Class teacher, Grade 10", subjects: ["Social Science", "Hindi"] },
  ],
  subjectTeachers: [
    { name: "Farida Sheikh", title: "English teacher", subjects: ["English"] },
    { name: "Rohit Patil", title: "Art and PE teacher", subjects: ["Art", "Physical education"] },
  ],
  spare: { name: "Anjum Qureshi", title: "Newly joined", subjects: ["Mathematics"] },
  language: "English",
  deshmukh: { grade: "6", first: "Aarav", email: `aarav.deshmukh@${DOMAIN}` },
  phonePrefix: "+919822050",
  codePrefix: "SP",
  previousSchool: "Little Flowers Nursery, Pune",
  leaver: { name: "Ayaan Bhatt", destination: "Kendriya Vidyalaya, Nagpur", note: "Father transferred; TC handed to the mother on the last day." },
  scheduledDestination: "Bengaluru — the family moves after the annual examinations.",
  invite: { name: "Ritu Malhotra", subjects: ["Hindi"] },
  pupilFirst: [
    "Advait", "Bhavya", "Chirag", "Diya", "Eshaan", "Falak", "Gauri", "Harsh",
    "Ishita", "Jai", "Kiara", "Laksh", "Mihika", "Nakul", "Ojaswini", "Parth",
    "Rhea", "Sarthak", "Tara", "Utkarsh", "Vanya", "Yuvraj", "Zara", "Aditya",
    "Bhumi", "Dhruv", "Esha", "Gautam", "Hiya", "Ishaan", "Jiya", "Kabir",
    "Lavanya", "Manas", "Nitya", "Om", "Pari", "Reyansh", "Saanvi", "Tanish",
    "Urvi", "Vivaan", "Yashvi", "Aarna", "Darsh", "Ira", "Krish", "Myra",
  ],
  pupilLast: ["Kulkarni", "Patil", "Joshi", "Shinde", "Deshpande", "Gokhale", "Pawar", "Jadhav", "Iyer", "Mehta", "Sharma", "Verma", "Nair", "Reddy", "Bhosale", "Kadam"],
  parentFirst: ["Sachin", "Madhuri", "Nitin", "Swati", "Rahul", "Pooja", "Amit", "Shraddha", "Manoj", "Deepa"],
};

const SARASWATI: SchoolSpec = {
  key: "svm",
  name: "Saraswati Vidya Mandir",
  slug: "saraswati-vidya-mandir",
  city: "Nashik",
  locale: "mr",
  brand: "#b45309",
  addressLine: "Gangapur Road, near Someshwar",
  contactPhone: "+912532310220",
  about: "नाशिकमधील मराठी माध्यमाची शाळा, इयत्ता ५ ते १०. महाराष्ट्र राज्य मंडळाचा अभ्यासक्रम, संगणक कक्ष, ग्रंथालय आणि क्रीडांगण. इयत्ता ५ व ६ साठी प्रवेश परीक्षा दरवर्षी जानेवारीत.",
  filing: { udiseCode: "27200300301", board: "MSBSHSE", affiliationNumber: "20.03.001", district: "Nashik", block: "Nashik", medium: "Marathi", managementType: "PRIVATE_UNAIDED" },
  admin: { name: "Sunil Wagh" },
  principal: { name: "Vandana Pathak" },
  formTeachers: [
    { name: "Manisha Kale", title: "वर्गशिक्षिका, इयत्ता ५", subjects: ["Mathematics", "Science"] },
    { name: "Prashant Gaikwad", title: "वर्गशिक्षक, इयत्ता ६", subjects: ["Science", "Mathematics"] },
    { name: "Sarika Bhagat", title: "वर्गशिक्षिका, इयत्ता ७", subjects: ["Social Science", "Marathi"] },
    { name: "Yogesh Sonawane", title: "वर्गशिक्षक, इयत्ता ८", subjects: ["Mathematics", "Hindi"] },
    { name: "Archana More", title: "वर्गशिक्षिका, इयत्ता ९", subjects: ["Science", "Mathematics"] },
    { name: "Dattatray Pagar", title: "वर्गशिक्षक, इयत्ता १०", subjects: ["Social Science", "Marathi"] },
  ],
  subjectTeachers: [
    { name: "Sheetal Ahire", title: "मराठी शिक्षिका", subjects: ["Marathi"] },
    { name: "Ganesh Tambe", title: "कला व क्रीडा शिक्षक", subjects: ["Art", "Physical education"] },
  ],
  spare: { name: "Rupali Chavan", title: "नवीन रुजू", subjects: ["English"] },
  language: "Marathi",
  deshmukh: { grade: "7", first: "Anaya", email: `anaya.deshmukh@${DOMAIN}` },
  phonePrefix: "+919822060",
  codePrefix: "SV",
  previousSchool: "Bal Vikas Mandir, Nashik",
  leaver: { name: "Siddhesh Thakare", destination: "जिल्हा परिषद शाळा, सिन्नर", note: "वडिलांची बदली; दाखला शेवटच्या दिवशी आईकडे दिला." },
  scheduledDestination: "पुणे — वार्षिक परीक्षेनंतर कुटुंब स्थलांतरित होत आहे.",
  invite: { name: "Pallavi Deshpande", subjects: ["English"] },
  pupilFirst: [
    "Aarohi", "Bhushan", "Chaitanya", "Devika", "Eknath", "Gargi", "Hrishikesh", "Ishwari",
    "Jayesh", "Ketaki", "Lalit", "Mrunal", "Ninad", "Omkar", "Pranali", "Rutuja",
    "Shreyas", "Tejas", "Uma", "Vedant", "Yash", "Aditi", "Bhargav", "Chinmay",
    "Dnyaneshwari", "Girish", "Hemangi", "Ishan", "Janhavi", "Kunal", "Madhura", "Nachiket",
        "Onkar", "Pradnya", "Rohan", "Sanika", "Tanmay", "Vaibhavi", "Yogita", "Abhishek",
    "Bhakti", "Darshan", "Gayatri", "Harshad", "Kalyani", "Mandar", "Nupur", "Prathamesh",
  ],
  pupilLast: ["Sonawane", "Gaikwad", "Pawar", "Jadhav", "Shinde", "Deshmukh", "Kale", "Bhosale", "Patil", "More", "Ahire", "Wagh", "Pagar", "Nikam", "Thakare", "Borse"],
  parentFirst: ["Santosh", "Vaishali", "Dnyaneshwar", "Sangita", "Prakash", "Rekha", "Sunil", "Jyoti", "Ramesh", "Manjusha"],
};

/* -------------------------------------------------------------------------- */
/* what one school comes back with                                             */
/* -------------------------------------------------------------------------- */

type Person = { user: { id: string; email: string | null; name: string }; membership: { id: string } };
type Built = {
  spec: SchoolSpec;
  school: { id: string; name: string; code: string; city: string | null; slug: string };
  admin: Person;
  principal: Person;
  formTeachers: Person[];
  subjectTeachers: Person[];
  spare: Person;
  classes: { id: string; grade: string; name: string; teacher: Person }[];
  pupils: { membershipId: string; userId: string; email: string; name: string; grade: string; seat: number; parentUserId: string | null }[];
  parents: { userId: string; email: string; name: string }[];
  deshmukh: { membershipId: string; userId: string; classId: string; teacher: Person };
  years: { prev: { id: string; name: string }; current: { id: string; name: string }; next: { id: string; name: string } };
  counts: Record<string, number | string>;
  /** The module roles at Sunrise (3 Oct 2026): a driver, the library's desk, a warden; and each school's leaver, now its alumnus. */
  moduleStaff?: { email: string; name: string; role: string; look: string }[];
};

function pupilName(spec: SchoolSpec, index: number): string {
  return `${spec.pupilFirst[index % spec.pupilFirst.length]!} ${spec.pupilLast[(index * 3) % spec.pupilLast.length]!}`;
}

/** A pupil in grade G is about G+5; fixed day and month so nothing drifts between runs. */
function birthdateFor(grade: string, seat: number): Date {
  return new Date(Date.UTC(THIS_YEAR - (Number(grade) + 5), (seat * 2 + Number(grade)) % 12, 3 + seat * 3));
}

function key(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The most recent `n` teaching days before today (Mon–Sat), oldest first. */
function recentTeachingDays(n: number): string[] {
  const days: string[] = [];
  for (let back = 1; days.length < n && back < n * 3; back += 1) {
    const d = new Date(Date.now() - back * DAY);
    if (d.getUTCDay() !== 0) days.push(key(d));
  }
  return days.reverse();
}

/** The next Monday at the given UTC hour (10:00 IST is 04:30Z). */
function nextMonday(hourUtc = 4, minuteUtc = 30): Date {
  const d = new Date();
  d.setUTCHours(hourUtc, minuteUtc, 0, 0);
  const shift = ((8 - d.getUTCDay()) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + shift);
  return d;
}

/* -------------------------------------------------------------------------- */
/* people, classes, years                                                      */
/* -------------------------------------------------------------------------- */

async function buildSchool(ctx: Ctx, spec: SchoolSpec, sunita: { id: string }): Promise<Built> {
  const school = await upsertSchool({
    name: spec.name, slug: spec.slug, city: spec.city, contactEmail: `office.${spec.key}@${DOMAIN}`,
    gradeLow: GRADES[0]!, gradeHigh: GRADES[GRADES.length - 1]!, brandPrimary: spec.brand, locale: spec.locale,
    addressLine: spec.addressLine, contactPhone: spec.contactPhone,
  });
  const person = async (email: string, name: string, role: string, extra: Parameters<typeof upsertMembership>[3] = {}): Promise<Person> => {
    const user = await upsertUser(ctx, email, name);
    const membership = await upsertMembership(user.id, school.id, role, extra);
    return { user: { id: user.id, email: user.email, name: user.name }, membership: { id: membership.id } };
  };
  const admin = await person(`${spec.key}.admin@${DOMAIN}`, spec.admin.name, "ADMIN", { title: "School administrator" });
  const principal = await person(`${spec.key}.principal@${DOMAIN}`, spec.principal.name, "PRINCIPAL", { title: "Principal" });
  const formTeachers: Person[] = [];
  for (const [i, t] of spec.formTeachers.entries()) {
    formTeachers.push(await person(`${spec.key}.teacher${i + 1}@${DOMAIN}`, t.name, "TEACHER", { title: t.title, subjects: JSON.stringify(t.subjects) }));
  }
  const subjectTeachers: Person[] = [];
  for (const [i, t] of spec.subjectTeachers.entries()) {
    subjectTeachers.push(await person(`${spec.key}.subject${i + 1}@${DOMAIN}`, t.name, "TEACHER", { title: t.title, subjects: JSON.stringify(t.subjects) }));
  }
  const spare = await person(`${spec.key}.spare1@${DOMAIN}`, spec.spare.name, "TEACHER", { title: spec.spare.title, subjects: JSON.stringify(spec.spare.subjects) });

  /* years: last year closed, this year current, next year waiting for admissions */
  const yearRow = async (name: string, from: string, to: string, data: { isCurrent: boolean; closedAt: Date | null }) => {
    const existing = await db.academicYear.findUnique({ where: { schoolId_name: { schoolId: school.id, name } }, select: { id: true, name: true } });
    if (existing) return existing;
    return db.academicYear.create({ data: { schoolId: school.id, name, startDate: new Date(`${from}T00:00:00Z`), endDate: new Date(`${to}T00:00:00Z`), ...data }, select: { id: true, name: true } });
  };
  const prev = await yearRow("2025–26", "2025-06-01", "2026-04-30", { isCurrent: false, closedAt: new Date("2026-05-02T00:00:00Z") });
  const current = await yearRow("2026–27", "2026-06-01", "2027-04-30", { isCurrent: true, closedAt: null });
  const next = await yearRow("2027–28", "2027-06-01", "2028-04-30", { isCurrent: false, closedAt: null });
  for (const [i, name] of ["Term 1", "Term 2"].entries()) {
    const startDate = new Date(i === 0 ? "2025-06-01T00:00:00Z" : "2025-11-01T00:00:00Z");
    const endDate = new Date(i === 0 ? "2025-10-31T00:00:00Z" : "2026-04-30T00:00:00Z");
    await db.term.upsert({
      where: { academicYearId_name: { academicYearId: prev.id, name } },
      create: { schoolId: school.id, academicYearId: prev.id, name, startDate, endDate, position: i + 1, weightPercent: i === 0 ? 40 : 60, finishedAt: endDate },
      update: {},
    });
  }

  /* classes, pupils, parents */
  const classes: Built["classes"] = [];
  const pupils: Built["pupils"] = [];
  const parents: Built["parents"] = [];
  let deshmukh: Built["deshmukh"] | null = null;
  let seq = 0;
  let parentSeq = 0;
  for (const [gi, grade] of GRADES.entries()) {
    const teacher = formTeachers[gi]!;
    const cls = await upsertClass(school.id, `Grade ${grade} · A`, { subject: "Form group", gradeLevel: grade, section: "A", color: CLASS_COLOURS[gi % CLASS_COLOURS.length]!, room: `Room ${grade}01` });
    await attachTeacher(cls.id, school.id, teacher.membership.id);
    classes.push({ id: cls.id, grade, name: cls.name, teacher });
    for (let seat = 0; seat < PER_CLASS; seat += 1) {
      seq += 1;
      const isDeshmukh = grade === spec.deshmukh.grade && seat === 0;
      const name = isDeshmukh ? `${spec.deshmukh.first} Deshmukh` : pupilName(spec, seq - 1);
      const email = isDeshmukh ? spec.deshmukh.email : `${spec.key}.pupil${String(seq).padStart(2, "0")}@${DOMAIN}`;
      const user = await upsertUser(ctx, email, name, { birthdate: birthdateFor(grade, seat), isMinor: true });
      const existing = await db.membership.findUnique({ where: { userId_schoolId_role: { userId: user.id, schoolId: school.id, role: "STUDENT" } } });
      const membership = existing ?? (await db.membership.create({ data: { userId: user.id, schoolId: school.id, role: "STUDENT", status: "ACTIVE", gradeLevel: grade, studentCode: studentCode() } }));
      await enrol(cls.id, school.id, membership.id);
      let parentUserId: string | null = null;
      if (isDeshmukh) {
        await link(sunita.id, membership.id, school.id);
        parentUserId = sunita.id;
        deshmukh = { membershipId: membership.id, userId: user.id, classId: cls.id, teacher };
      } else if (seat < PARENTS_PER_CLASS) {
        parentSeq += 1;
        const surname = name.split(" ").pop()!;
        const parentName = `${spec.parentFirst[(seq - 1) % spec.parentFirst.length]!} ${surname}`;
        const parent = await upsertUser(ctx, `${spec.key}.parent${String(seq).padStart(2, "0")}@${DOMAIN}`, parentName, {
          phone: `${spec.phonePrefix}${String(parentSeq).padStart(3, "0")}`, phoneVerifiedAt: new Date(),
        });
        await link(parent.id, membership.id, school.id);
        parentUserId = parent.id;
        parents.push({ userId: parent.id, email: parent.email!, name: parent.name });
      }
      pupils.push({ membershipId: membership.id, userId: user.id, email, name, grade, seat, parentUserId });
    }
  }
  if (!deshmukh) throw new Error("the Deshmukh child was not placed");

  return { spec, school: { id: school.id, name: school.name, code: school.code, city: school.city, slug: school.slug }, admin, principal, formTeachers, subjectTeachers, spare, classes, pupils, parents, deshmukh, years: { prev, current, next }, counts: {} };
}

/* -------------------------------------------------------------------------- */
/* last year: the archived classes and the annual cards                        */
/* -------------------------------------------------------------------------- */

/**
 * Every pupil in grades 6–10 was in the grade below last year. The class
 * they sat in is an ARCHIVED class the way promotion leaves one (archivedAt
 * and promotedAt set, the enrolment REMOVED and dated); on it the whole
 * year's register, taken by the form teacher of that grade on every teaching
 * day the calendar left open (Mon–Sat from the June reopening to the April
 * closing, less the holidays), a few late, fewer absent; and the annual card
 * the year-end wrote: four subjects, each term's percent combined by the
 * terms' shares, banded on the school's scale, published, with the
 * attendance counted from that register between the card's dates exactly as
 * the generator counts it. The grade-5 pupils joined this year and have no
 * card here.
 */
async function buildLastYear(b: Built, closed: Set<string>) {
  const config = DEFAULT_REPORT_CARD_CONFIG;
  const subjects = [b.spec.language, "Mathematics", "Science", "Social Science"];
  const leftOn = new Date("2026-04-30T00:00:00Z");
  const days = teachingDaysBetween("2025-06-16", "2026-04-25", closed);
  const terms = await db.term.findMany({ where: { academicYearId: b.years.prev.id }, orderBy: { position: "asc" }, select: { id: true, name: true, weightPercent: true } });
  let cards = 0;
  let sessions = 0;
  for (const cls of b.classes) {
    const lastGrade = String(Number(cls.grade) - 1);
    if (!GRADES.includes(lastGrade)) continue;
    const name = `Grade ${lastGrade} · A (${b.years.prev.name})`;
    const old =
      (await db.class.findFirst({ where: { schoolId: b.school.id, name }, select: { id: true } })) ??
      (await db.class.create({ data: { schoolId: b.school.id, name, joinCode: classCode(), subject: "Form group", gradeLevel: lastGrade, section: "A", color: "#94a3b8", room: `Room ${lastGrade}01`, archivedAt: new Date("2026-05-01T00:00:00Z"), promotedAt: new Date("2026-05-01T00:00:00Z") }, select: { id: true } }));
    const roll = b.pupils.filter((p) => p.grade === cls.grade);
    for (const p of roll) {
      const enrolment = await db.enrollment.findUnique({ where: { classId_studentMembershipId: { classId: old.id, studentMembershipId: p.membershipId } }, select: { id: true } });
      if (!enrolment) await db.enrollment.create({ data: { classId: old.id, schoolId: b.school.id, studentMembershipId: p.membershipId, status: "REMOVED", enrolledAt: new Date("2025-06-16T00:00:00Z"), removedAt: leftOn } });
    }
    // The year's register: sessions first (in one statement, duplicates skipped), then every pupil's mark on each.
    const teacher = b.formTeachers[GRADES.indexOf(lastGrade)]!;
    if ((await db.attendanceSession.count({ where: { classId: old.id } })) < days.length) {
      await db.attendanceSession.createMany({ data: days.map((day) => ({ schoolId: b.school.id, classId: old.id, dateKey: day, takenAt: new Date(`${day}T03:45:00Z`), takenByMembershipId: teacher.membership.id, finalizedAt: new Date(`${day}T03:45:00Z`) })), skipDuplicates: true });
    }
    const taken = await db.attendanceSession.findMany({ where: { classId: old.id }, select: { id: true, dateKey: true }, orderBy: { dateKey: "asc" } });
    if ((await db.attendanceRecord.count({ where: { session: { classId: old.id } } })) < taken.length * roll.length) {
      const marks: { schoolId: string; sessionId: string; studentMembershipId: string; status: string; markedAt: Date }[] = [];
      for (const [di, s] of taken.entries()) {
        for (const p of roll) {
          const r = (p.seat * 7 + di * 3) % 17;
          marks.push({ schoolId: b.school.id, sessionId: s.id, studentMembershipId: p.membershipId, status: r === 0 ? "ABSENT" : r === 1 ? "LATE" : r === 2 && di % 6 === 0 ? "EXCUSED" : "PRESENT", markedAt: new Date(`${s.dateKey}T03:45:00Z`) });
        }
      }
      await db.attendanceRecord.createMany({ data: marks, skipDuplicates: true });
    }
    sessions += taken.length;
    for (const p of roll) {
      // The register between the card's dates, as the generator counts it: late is there, excused is in the total.
      const marks = await db.attendanceRecord.findMany({ where: { schoolId: b.school.id, studentMembershipId: p.membershipId, session: { dateKey: { gte: "2025-06-01", lte: "2026-04-30" } } }, select: { status: true } });
      const attendance = { attendancePresent: marks.filter((m) => m.status === "PRESENT" || m.status === "LATE").length, attendanceTotal: marks.length };
      const rows = subjects.map((subject, si) => {
        const termParts = terms.map((t, ti) => ({ termId: t.id, name: t.name, percent: 52 + ((p.seat * 11 + si * 7 + ti * 5) % 41), weightPercent: t.weightPercent }));
        const combined = combineTerms(termParts);
        // Rounded once to what the card shows, and the letter read from that — as the generator does.
        const shown = shownPercent(combined.percent);
        const band = bandFor(shown, config.bands);
        return { subject, percent: shown, letter: band?.label ?? null, points: band?.points ?? null, parts: combined.parts.map((x) => ({ label: x.name, kind: "TERM", scoreMilli: null, pointsMilli: null, percent: x.percent, weight: x.weight })), termParts };
      });
      const overall = shownPercent(meanPercent(rows));
      const points = meanPoints(rows);
      const title = `Annual report ${b.years.prev.name}`;
      const data = {
        schoolId: b.school.id, classId: old.id, studentMembershipId: p.membershipId, academicYearId: b.years.prev.id, termId: null, title, status: "PUBLISHED",
        fromDateKey: "2025-06-01", toDateKey: "2026-04-30", ...attendance,
        overallPercentMilli: overall === null ? null : Math.round(overall * 1000), gradingMethod: "weighted", overallLetter: bandFor(overall, config.bands)?.label ?? null,
        gradePointsMilli: points === null ? null : Math.round(points * 1000),
        subjects: JSON.stringify(rows.map((r) => ({ subject: r.subject, percent: r.percent, letter: r.letter, points: r.points, parts: r.parts }))),
        scale: JSON.stringify({ bands: config.bands, coScale: config.coScholastic.scale }), layout: JSON.stringify(config.layout),
        remark: ["Promoted to the next grade. Consistent through the year.", "Promoted. Reads widely; should show working in mathematics.", "Promoted. A quiet, steady year; more confident in the second term.", "Promoted. Excellent in science; attendance could be better."][p.seat % 4]!,
        createdByMembershipId: b.admin.membership.id, publishedAt: new Date("2026-04-25T09:00:00Z"),
      };
      // A card already written keeps its marks; only its attendance is held to the register.
      const card = await db.reportCard.upsert({ where: { classId_studentMembershipId_title: { classId: old.id, studentMembershipId: p.membershipId, title } }, create: data, update: data, select: { id: true, items: { select: { id: true }, take: 1 } } });
      if (card.items.length === 0) {
        await db.reportCardItem.createMany({
          data: [
            ...rows.flatMap((r, si) => r.termParts.map((t, ti) => ({ schoolId: b.school.id, reportCardId: card.id, title: `${t.name} · ${r.subject}`, category: "Exam", scoreMilli: t.percent * 1000, pointsMilli: 100_000, position: si * terms.length + ti, subject: r.subject, kind: "SCHOLASTIC", letter: bandFor(t.percent, config.bands)?.label ?? null }))),
            ...config.coScholastic.areas.map((area, position) => ({ schoolId: b.school.id, reportCardId: card.id, title: area, kind: "CO_SCHOLASTIC", letter: config.coScholastic.scale[(position + p.seat) % config.coScholastic.scale.length]!.label, position: subjects.length * terms.length + position })),
          ],
        });
      }
      cards += 1;
    }
  }
  return { cards, sessions, days: days.length };
}

/* -------------------------------------------------------------------------- */
/* the class registers                                                         */
/* -------------------------------------------------------------------------- */

/** The most recent `n` days the school was open (Mon–Sat, not on the calendar's closed list), oldest first. */
function recentOpenDays(n: number, closed: Set<string>): string[] {
  const days: string[] = [];
  for (let back = 1; days.length < n && back < n * 4; back += 1) {
    const d = new Date(Date.now() - back * DAY);
    const k = key(d);
    if (d.getUTCDay() !== 0 && !closed.has(k)) days.push(k);
  }
  return days.reverse();
}

/**
 * The last ten days the school was open, every class marked by its form
 * teacher; a few late, fewer absent. A register on a day the calendar shuts
 * the school is the anomaly the calendar exists to warn about, so one an
 * earlier run took on such a day is removed.
 */
async function buildRegisters(b: Built, closed: Set<string>) {
  await db.attendanceSession.deleteMany({ where: { classId: { in: b.classes.map((c) => c.id) }, dateKey: { in: [...closed] } } });
  const days = recentOpenDays(10, closed);
  for (const day of days) {
    for (const cls of b.classes) {
      const existing = await db.attendanceSession.findUnique({ where: { classId_dateKey: { classId: cls.id, dateKey: day } }, select: { id: true } });
      if (existing) continue;
      const takenAt = new Date(`${day}T03:45:00Z`);
      const roll = b.pupils.filter((p) => p.grade === cls.grade);
      await db.attendanceSession.create({
        data: {
          schoolId: b.school.id, classId: cls.id, dateKey: day, takenAt, takenByMembershipId: cls.teacher.membership.id, finalizedAt: takenAt,
          records: { create: roll.map((p) => { const r = (p.seat * 7 + Number(day.slice(8)) * 3) % 17; return { schoolId: b.school.id, studentMembershipId: p.membershipId, status: r === 0 ? "ABSENT" : r === 1 ? "LATE" : "PRESENT", markedAt: takenAt }; }) },
        },
      });
    }
  }
  return { sessions: await db.attendanceSession.count({ where: { classId: { in: b.classes.map((c) => c.id) }, dateKey: { in: days } } }) };
}

/* -------------------------------------------------------------------------- */
/* the feed                                                                    */
/* -------------------------------------------------------------------------- */

type PostSpec = { title: string; body: string; scope: "SCHOOL" | "CLASS" | "GLOBAL"; category: string; tags: string[]; author: { user: { id: string }; membership: { id: string } }; classId?: string; status?: "PENDING" | "APPROVED"; reviewer?: { membership: { id: string } }; audience?: string; daysAgo: number };

async function upsertPost(schoolId: string, schoolName: string, spec: PostSpec) {
  const existing = await db.post.findFirst({ where: { schoolId, title: spec.title }, select: { id: true } });
  if (existing) return existing;
  const status = spec.status ?? "APPROVED";
  const createdAt = new Date(Date.now() - spec.daysAgo * DAY);
  return db.post.create({
    data: {
      schoolId, classId: spec.classId ?? null, authorUserId: spec.author.user.id, authorMembershipId: spec.author.membership.id, scope: spec.scope, title: spec.title, body: spec.body,
      tags: JSON.stringify(spec.tags), category: spec.category, audience: spec.audience ?? "ALL", status,
      reviewedAt: status === "APPROVED" ? createdAt : null, reviewedByMembershipId: status === "APPROVED" ? (spec.reviewer ?? spec.author).membership.id : null,
      globalSchoolName: spec.scope === "GLOBAL" ? schoolName : null, createdAt,
    },
    select: { id: true },
  });
}

async function comment(postId: string, schoolId: string, authorUserId: string, body: string, daysAgo: number) {
  const existing = await db.comment.findFirst({ where: { postId, authorUserId, body }, select: { id: true } });
  if (existing) return existing;
  return db.comment.create({ data: { postId, schoolId, authorUserId, body, status: "APPROVED", createdAt: new Date(Date.now() - daysAgo * DAY) }, select: { id: true } });
}

async function read(postId: string, schoolId: string, userId: string) {
  await db.postRead.upsert({ where: { postId_userId: { postId, userId } }, create: { postId, schoolId, userId }, update: {} });
}

async function buildFeed(b: Built, sunita: { id: string }) {
  const en = b.spec.locale === "en";
  const g6 = b.classes.find((c) => c.grade === "6")!;
  const g8 = b.classes.find((c) => c.grade === "8")!;
  const g9 = b.classes.find((c) => c.grade === "9")!;
  const pupilIn = (grade: string, seat: number) => b.pupils.find((p) => p.grade === grade && p.seat === seat)!;
  const parentOf = (p: { parentUserId: string | null }) => p.parentUserId!;
  const p8 = pupilIn("8", 2);
  const p9 = pupilIn("9", 3);
  const p8b = pupilIn("8", 4);
  const specs: PostSpec[] = [
    { title: en ? "Annual day on 18 December — save the date" : "वार्षिक स्नेहसंमेलन १८ डिसेंबर रोजी", body: en ? "The annual day is on Thursday 18 December at 5 pm in the school ground. Every class performs; costumes and rehearsal times will come through the class teachers. Parents are welcome from 4.30." : "वार्षिक स्नेहसंमेलन गुरुवार १८ डिसेंबर रोजी संध्याकाळी ५ वाजता शाळेच्या मैदानावर. प्रत्येक वर्गाचा कार्यक्रम आहे; वेशभूषा व तालमीच्या वेळा वर्गशिक्षकांकडून कळतील. पालकांनी ४.३० पासून यावे.", scope: "SCHOOL", category: "EVENTS", tags: ["annual-day", "events"], author: b.admin, daysAgo: 6 },
    { title: en ? "Welcome back after the Ganesh festival" : "गणेशोत्सवानंतर पुन्हा स्वागत", body: en ? "School reopens on Monday. The half-yearly timetable is on the notice board and on Shalaghar. Please check the bus timings; two routes have changed." : "सोमवारी शाळा पुन्हा सुरू. सहामाही वेळापत्रक सूचना फलकावर आणि शाळाघरावर आहे. बसच्या वेळा तपासा; दोन मार्ग बदलले आहेत.", scope: "SCHOOL", category: "UPDATES", tags: ["reopening", "timetable"], author: b.principal, daysAgo: 5 },
    { title: en ? "Science exhibition: entries open till the 30th" : "विज्ञान प्रदर्शन: ३० तारखेपर्यंत नोंदणी", body: en ? "Grades 6 to 10 may enter a working model or a poster. Teams of up to three. Hand the entry slip to your class teacher; the robotics workshop next week is a good place to start." : "इयत्ता ६ ते १० चे विद्यार्थी कार्यरत मॉडेल किंवा पोस्टर सादर करू शकतात. तीन जणांपर्यंत गट. नोंदणी चिठ्ठी वर्गशिक्षकांकडे द्या; पुढील आठवड्यातील रोबोटिक्स कार्यशाळा सुरुवात करण्यास चांगली.", scope: "SCHOOL", category: "LEARNING", tags: ["science", "exhibition", "robotics"], author: b.formTeachers[1]!, daysAgo: 4 },
    { title: en ? "Library open till 6 pm from this week" : "ग्रंथालय या आठवड्यापासून सायंकाळी ६ पर्यंत खुले", body: en ? "The library stays open till 6 pm on weekdays for pupils of grades 8 to 10. Bring your library card; two books at a time." : "इयत्ता ८ ते १० च्या विद्यार्थ्यांसाठी ग्रंथालय आठवड्याच्या दिवशी सायंकाळी ६ पर्यंत खुले. ग्रंथालय कार्ड आणा; एकावेळी दोन पुस्तके.", scope: "SCHOOL", category: "CAMPUS", tags: ["library"], author: b.admin, daysAgo: 3 },
    { title: en ? "Grade 6: geometry box on Monday" : "इयत्ता ६: सोमवारी भूमिती पेटी आणा", body: en ? "We start constructions on Monday. Everyone brings a compass, a protractor and a sharp pencil. The worksheet is on Shalaghar under Practice." : "सोमवारपासून रचना सुरू. प्रत्येकाने कंपास, कोनमापक आणि टोकदार पेन्सिल आणावी. सराव पत्रक शाळाघरावर 'सराव' मध्ये आहे.", scope: "CLASS", classId: g6.id, category: "LEARNING", tags: ["mathematics", "grade-6"], author: g6.teacher, daysAgo: 2 },
    { title: en ? "Our robot climbed the ramp!" : "आमचा रोबो उतारावर चढला!", body: en ? "After four tries the line-follower finally made it up the ramp in the lab. Thanks to Sameer sir for the extra hour on Saturday. Video coming at the exhibition." : "चार प्रयत्नांनंतर आमचा लाईन-फॉलोअर प्रयोगशाळेतील उतारावर चढला. शनिवारी जास्तीच्या तासासाठी सरांचे आभार. प्रदर्शनात व्हिडिओ.", scope: "CLASS", classId: g8.id, category: "LEARNING", tags: ["robotics", "grade-8"], author: { user: { id: p8.userId }, membership: { id: p8.membershipId } }, reviewer: g8.teacher, daysAgo: 2 },
    { title: en ? "Inter-house cricket: Blue house through to the final" : "आंतरगृह क्रिकेट: निळे घर अंतिम फेरीत", body: en ? "Blue beat Green by 12 runs on Friday. Final next Saturday on the back field. Come and cheer." : "शुक्रवारी निळ्या घराने हिरव्या घरावर १२ धावांनी मात केली. पुढील शनिवारी मागच्या मैदानावर अंतिम सामना.", scope: "CLASS", classId: g9.id, category: "EVENTS", tags: ["sports", "cricket"], author: { user: { id: p9.userId }, membership: { id: p9.membershipId } }, reviewer: g9.teacher, daysAgo: 1 },
    { title: en ? "Can we have a chess club on Wednesdays?" : "बुधवारी बुद्धिबळ क्लब सुरू करता येईल का?", body: en ? "Six of us in grade 8 play after school already. Could the library corner be ours on Wednesdays?" : "इयत्ता ८ मधील आम्ही सहा जण शाळेनंतर खेळतो. बुधवारी ग्रंथालयाचा कोपरा आम्हाला मिळेल का?", scope: "CLASS", classId: g8.id, category: "PEOPLE", tags: ["chess", "clubs"], author: { user: { id: p8b.userId }, membership: { id: p8b.membershipId } }, status: "PENDING", daysAgo: 0 },
  ];
  const posts: { id: string }[] = [];
  for (const spec of specs) posts.push(await upsertPost(b.school.id, b.school.name, spec));
  const [annual, , exhibition, , geometry, robot, cricket] = posts as [{ id: string }, { id: string }, { id: string }, { id: string }, { id: string }, { id: string }, { id: string }, { id: string }];
  // Comments from pupils and parents, in the language of the school.
  const c = (postId: string, userId: string, body: string, daysAgo: number) => comment(postId, b.school.id, userId, body, daysAgo);
  await c(annual.id, parentOf(pupilIn("7", 1)), en ? "Will there be seating for grandparents this year?" : "यंदा आजी-आजोबांसाठी बसण्याची व्यवस्था असेल का?", 5);
  await c(annual.id, sunita.id, en ? "Noted, thank you. Does grade 6 perform in the first half?" : "धन्यवाद. इयत्ता ६ चा कार्यक्रम पहिल्या सत्रात आहे का?", 5);
  await c(annual.id, b.admin.user.id, en ? "Yes — grades 5 to 7 are in the first half, before the break." : "हो — इयत्ता ५ ते ७ मध्यंतरापूर्वी पहिल्या सत्रात.", 4);
  await c(exhibition.id, pupilIn("9", 1).userId, en ? "Can a team be from two different classes?" : "गट दोन वेगवेगळ्या वर्गांतील असू शकतो का?", 3);
  await c(exhibition.id, b.formTeachers[1]!.user.id, en ? "Yes, as long as all three are in grades 6 to 10." : "हो, तिघेही इयत्ता ६ ते १० मध्ये असले तर चालेल.", 3);
  await c(geometry.id, parentOf(pupilIn("6", 2)), en ? "Is a plastic compass fine?" : "प्लास्टिकचा कंपास चालेल का?", 1);
  await c(geometry.id, b.deshmukh.userId, en ? "Got mine. Do we need the set square too?" : "माझी आहे. सेट स्क्वेअरही लागेल का?", 1);
  const fifthTry = await c(robot.id, pupilIn("8", 0).userId, en ? "It was the fifth try but who's counting" : "पाचवा प्रयत्न होता, पण मोजतंय कोण", 1);
  await c(robot.id, parentOf(pupilIn("8", 2)), en ? "So proud of the team!" : "संघाचा खूप अभिमान!", 1);
  await c(cricket.id, pupilIn("9", 0).userId, en ? "Green will be back next year." : "हिरवे घर पुढच्या वर्षी परत येईल.", 0);
  // Reads: the parents who opened the annual-day notice, and the pupils who read the class posts.
  for (const p of b.pupils.filter((x) => x.grade === "7").slice(0, 4)) if (p.parentUserId) await read(annual.id, b.school.id, p.parentUserId);
  await read(annual.id, b.school.id, sunita.id);
  for (const p of b.pupils.filter((x) => x.grade === "6")) await read(geometry.id, b.school.id, p.userId);
  for (const p of b.pupils.filter((x) => x.grade === "8").slice(0, 6)) await read(robot.id, b.school.id, p.userId);
  // The one comment somebody reports (see main): the parent of the robot's builder disputes the count.
  const report = await buildReport(b.school, { targetType: "COMMENT", targetId: fifthTry.id, reporterUserId: parentOf(pupilIn("8", 2)), reason: "WRONG_INFO", detail: en ? "It was the fourth try — the post says so. Please correct it before the exhibition." : "चौथा प्रयत्न होता — पोस्टमध्ये तसेच लिहिले आहे. प्रदर्शनापूर्वी दुरुस्त करा." });
  return { posts: posts.length, comments: await db.comment.count({ where: { schoolId: b.school.id } }), reportId: report.reportId };
}

/** One post on the platform feed from Sunrise's office. */
async function buildGlobalPost(sunrise: Built) {
  const post = await upsertPost(sunrise.school.id, sunrise.school.name, { title: "Pune inter-school robotics meet — entries from any school", body: "Sunrise hosts a one-day robotics meet on 14 November for grades 7 to 10. Line-follower and sumo categories, kits available on loan. Teams from any school on Shalaghar are welcome; write to the office through Enquiries.", scope: "GLOBAL", category: "EVENTS", tags: ["robotics", "inter-school", "pune"], author: sunrise.admin, daysAgo: 2 });
  return { postId: post.id };
}

/* -------------------------------------------------------------------------- */
/* quiz activity (mirrors src/lib/quiz.ts, which is server-only)               */
/* -------------------------------------------------------------------------- */

const MIN_LEVEL = 1;
const MAX_LEVEL = 6;
const PROMOTE_AFTER = 2;
const DEMOTE_AFTER = 2;
const TIER_NAMES = ["Beginner", "Learner", "Amateur", "Expert", "Pro", "Master"] as const;
type MasteryState = { level: number; streakRight: number; streakWrong: number };
/** The adaptive step, copied from quiz.ts's `nextMastery` so the mastery row reads as the app would have written it. */
function nextMastery(current: MasteryState, correct: boolean): MasteryState {
  const level = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, current.level));
  if (correct) {
    const streakRight = current.streakRight + 1;
    if (streakRight >= PROMOTE_AFTER && level < MAX_LEVEL) return { level: level + 1, streakRight: 0, streakWrong: 0 };
    return { level, streakRight, streakWrong: 0 };
  }
  const streakWrong = current.streakWrong + 1;
  if (streakWrong >= DEMOTE_AFTER && level > MIN_LEVEL) return { level: level - 1, streakRight: 0, streakWrong: 0 };
  return { level, streakRight: 0, streakWrong };
}

async function badge(schoolId: string, studentMembershipId: string, badgeId: string, label: string, description: string) {
  const existing = await db.earnedBadge.findFirst({ where: { studentMembershipId, badgeId, academicYearId: null }, select: { id: true } });
  if (existing) return false;
  await db.earnedBadge.create({ data: { schoolId, studentMembershipId, academicYearId: null, badgeId, label, description, permanent: true } });
  return true;
}

/**
 * Every pupil in grades 6–9 has two to five FINISHED attempts on topics of
 * their own class level, one response per question with about seven in ten
 * right, the mastery row walked question by question the way the app walks
 * it, and the badges a clean finish earns. Keyed on (pupil, topic): a second
 * run finds the attempt and moves on.
 */
async function buildQuizzes(b: Built) {
  let attempts = 0;
  let responses = 0;
  let badges = 0;
  const topicsByLevel = new Map<number, { id: string; slug: string; name: string; questions: { id: string; difficulty: number; answerIndex: number; choices: string }[] }[]>();
  for (const level of [6, 7, 8, 9]) {
    const topics = await db.quizTopic.findMany({ where: { classLevel: level, retiredAt: null }, orderBy: [{ subject: "asc" }, { position: "asc" }], select: { id: true, slug: true, name: true, questions: { orderBy: [{ difficulty: "asc" }, { id: "asc" }], select: { id: true, difficulty: true, answerIndex: true, choices: true } } } });
    topicsByLevel.set(level, topics.filter((t) => t.questions.length > 0));
  }
  for (const p of b.pupils) {
    const topics = topicsByLevel.get(Number(p.grade));
    if (!topics || topics.length === 0) continue;
    const count = 2 + (p.seat % 4);
    for (let k = 0; k < count; k += 1) {
      const topic = topics[(p.seat * 5 + k * 7) % topics.length]!;
      const done = await db.quizAttempt.findFirst({ where: { studentMembershipId: p.membershipId, topicId: topic.id, finishedAt: { not: null } }, select: { id: true } });
      if (done) continue;
      const startedAt = new Date(Date.now() - (k * 3 + 1 + (p.seat % 3)) * DAY + 6 * 3_600_000);
      const finishedAt = new Date(startedAt.getTime() + topic.questions.length * 45_000);
      const attempt = await db.quizAttempt.create({ data: { schoolId: b.school.id, studentMembershipId: p.membershipId, topicId: topic.id, startedAt, finishedAt, revealedAny: false }, select: { id: true } });
      let state: MasteryState = { level: MIN_LEVEL, streakRight: 0, streakWrong: 0 };
      let correctCount = 0;
      let provedMax = 0;
      const rows = topic.questions.map((q, qi) => {
        const correct = (p.seat * 7 + qi * 13 + k * 5) % 10 < 7;
        const choices = JSON.parse(q.choices) as unknown[];
        const before = state;
        state = nextMastery(state, correct);
        if (state.level > before.level) provedMax = Math.max(provedMax, before.level);
        if (correct) correctCount += 1;
        return { schoolId: b.school.id, attemptId: attempt.id, questionId: q.id, chosenIndex: correct ? q.answerIndex : (q.answerIndex + 1) % Math.max(2, choices.length), correct, revealedSolution: false, servedDifficulty: q.difficulty, answeredAt: new Date(startedAt.getTime() + qi * 45_000) };
      });
      await db.quizResponse.createMany({ data: rows });
      await db.quizMastery.upsert({
        where: { studentMembershipId_topicId: { studentMembershipId: p.membershipId, topicId: topic.id } },
        create: { schoolId: b.school.id, studentMembershipId: p.membershipId, topicId: topic.id, level: state.level, seenCount: rows.length, correctCount, streakRight: state.streakRight, streakWrong: state.streakWrong, cleanCompletionAt: finishedAt },
        update: { level: state.level, seenCount: { increment: rows.length }, correctCount: { increment: correctCount }, streakRight: state.streakRight, streakWrong: state.streakWrong, cleanCompletionAt: finishedAt },
      });
      if (await badge(b.school.id, p.membershipId, `abhyaas:${topic.slug}`, topic.name, "Finished every question without looking at a single solution")) badges += 1;
      for (let level = 1; level <= provedMax; level += 1) {
        if (await badge(b.school.id, p.membershipId, `abhyaas:${topic.slug}:tier-${level}`, `${topic.name} · ${TIER_NAMES[level - 1]}`, `Answered ${PROMOTE_AFTER} in a row right at Level ${level} of ${topic.name}`)) badges += 1;
      }
      attempts += 1;
      responses += rows.length;
    }
  }
  return { attempts, responses, badges };
}

/* -------------------------------------------------------------------------- */
/* meetings, leave, the Deshmukh cards and records                             */
/* -------------------------------------------------------------------------- */

/** Two teachers publish next week's slots; Sunita books one with her child's class teacher. */
async function buildMeetings(b: Built, sunita: { id: string }) {
  const teachers = [b.deshmukh.teacher, b.formTeachers.find((t) => t.membership.id !== b.deshmukh.teacher.membership.id)!];
  const monday = nextMonday(4, 30);
  let slots = 0;
  let firstSlotId: string | null = null;
  for (const [ti, t] of teachers.entries()) {
    for (let i = 0; i < 4; i += 1) {
      const startsAt = new Date(monday.getTime() + (ti + 1) * DAY + i * 15 * 60_000);
      const existing = await db.meetingSlot.findFirst({ where: { teacherMembershipId: t.membership.id, startsAt, cancelledAt: null }, select: { id: true } });
      const slot = existing ?? (await db.meetingSlot.create({ data: { schoolId: b.school.id, teacherMembershipId: t.membership.id, startsAt, endsAt: new Date(startsAt.getTime() + 15 * 60_000), location: b.spec.locale === "en" ? "Staff room" : "शिक्षक कक्ष", note: b.spec.locale === "en" ? "Parent–teacher slot, 15 minutes" : "पालक-शिक्षक भेट, १५ मिनिटे" }, select: { id: true } }));
      if (ti === 0 && i === 0) firstSlotId = slot.id;
      slots += 1;
    }
  }
  if (firstSlotId && !(await db.meetingBooking.findUnique({ where: { slotId: firstSlotId }, select: { id: true } }))) {
    await db.meetingBooking.create({ data: { schoolId: b.school.id, slotId: firstSlotId, studentMembershipId: b.deshmukh.membershipId, parentUserId: sunita.id, note: b.spec.locale === "en" ? "Would like to talk about the science project and reading at home." : "विज्ञान प्रकल्प आणि घरी वाचन याबद्दल बोलायचे आहे." } });
  }
  return { slots, booked: 1 };
}

/** One pending ask from a teacher (cover nominated) and one the principal approved last week. */
async function buildLeave(b: Built) {
  const monday = nextMonday();
  const pending = { teacher: b.formTeachers[2]!, from: key(new Date(monday.getTime() + 2 * DAY)), to: key(new Date(monday.getTime() + 3 * DAY)), kind: "CASUAL", reason: b.spec.locale === "en" ? "Cousin's wedding in Kolhapur." : "कोल्हापूरला चुलत बहिणीचे लग्न." };
  const approved = { teacher: b.formTeachers[3]!, from: recentTeachingDays(10)[3]!, to: recentTeachingDays(10)[4]!, kind: "SICK", reason: b.spec.locale === "en" ? "Fever; doctor's note attached at the office." : "ताप; डॉक्टरांची चिठ्ठी कार्यालयात दिली आहे." };
  let n = 0;
  for (const [i, spec] of [pending, approved].entries()) {
    const existing = await db.leaveRequest.findFirst({ where: { teacherMembershipId: spec.teacher.membership.id, fromDateKey: spec.from }, select: { id: true } });
    if (existing) { n += 1; continue; }
    await db.leaveRequest.create({
      data: {
        schoolId: b.school.id, teacherMembershipId: spec.teacher.membership.id, fromDateKey: spec.from, toDateKey: spec.to, kind: spec.kind, reason: spec.reason, nominatedCoverMembershipId: b.spare.membership.id,
        status: i === 0 ? "PENDING" : "APPROVED", decidedByMembershipId: i === 0 ? null : b.principal.membership.id, decidedAt: i === 0 ? null : new Date(`${spec.from}T02:00:00Z`), decisionNote: i === 0 ? null : "Get well soon.",
      },
    });
    n += 1;
  }
  return { requests: n };
}

/** The Deshmukh child's health card and pupil record, complete, with Sunita on both. */
async function buildDeshmukh(b: Built, sunita: { id: string }) {
  const first = b.spec.deshmukh.first;
  const local = first === "Aarav" ? { name: "आरव देशमुख", father: "प्रसाद देशमुख", mother: "सुनीता देशमुख" } : { name: "अनया देशमुख", father: "प्रसाद देशमुख", mother: "सुनीता देशमुख" };
  const card = { bloodGroup: first === "Aarav" ? "A+" : "O+", allergies: first === "Aarav" ? "Dust — mild; carries an inhaler on sports days" : "", conditions: "", medications: first === "Aarav" ? "Salbutamol inhaler, in the school bag" : "", notes: "Mother is the first contact.", doctorName: "Dr Anjali Phadke", doctorPhone: "+912025431190", contactsJson: JSON.stringify([{ name: SUNITA.name, relation: "mother", phone: SUNITA.phone }, { name: "Prasad Deshmukh", relation: "father", phone: "+919822011224" }]), updatedByUserId: sunita.id };
  await db.healthCard.upsert({ where: { studentMembershipId: b.deshmukh.membershipId }, create: { schoolId: b.school.id, studentMembershipId: b.deshmukh.membershipId, ...card }, update: card });
  const record = {
    // Category and religion are coded values on the record; the caste is the family's own word.
    fatherName: "Prasad Deshmukh", motherName: SUNITA.name, placeOfBirth: "Pune", nationality: "INDIAN", religion: "HINDU", caste: "Maratha", category: "GENERAL", motherTongue: "MARATHI",
    fatherOccupation: "Mechanical engineer", motherOccupation: "Bank officer", annualIncome: 1_800_000,
    addressLine: "B-402, Sahil Residency, Aundh", city: "Pune", postalCode: "411007", admissionNumber: first === "Aarav" ? "SPS-2022-0416" : "SVM-2021-0287", admissionDate: new Date(first === "Aarav" ? "2022-06-13T00:00:00Z" : "2021-06-14T00:00:00Z"), admittedToGrade: first === "Aarav" ? "2" : "2",
    previousSchool: first === "Aarav" ? "Little Flowers Nursery, Pune" : "Bal Vikas Mandir, Nashik", previousSchoolTcNumber: first === "Aarav" ? "LFN/2022/031" : "BVM/2021/117", previousSchoolTcDate: new Date(first === "Aarav" ? "2022-06-01T00:00:00Z" : "2021-06-01T00:00:00Z"),
    penNumber: fakePen(b.deshmukh.membershipId), gender: first === "Aarav" ? "M" : "F", nameLocal: local.name, fatherNameLocal: local.father, motherNameLocal: local.mother, bpl: false, ews: false, rte: false, cwsnType: "NONE", bloodGroup: card.bloodGroup,
    updatedByUserId: sunita.id, familyFilledAt: new Date(Date.now() - 20 * DAY),
  };
  await db.pupilRecord.upsert({ where: { studentMembershipId: b.deshmukh.membershipId }, create: { schoolId: b.school.id, studentMembershipId: b.deshmukh.membershipId, ...record }, update: record });
  await db.user.update({ where: { id: b.deshmukh.userId }, data: { penNumber: record.penNumber } });
  if (first === "Aarav") {
    await db.penChangeRequest.deleteMany({ where: { studentMembershipId: b.deshmukh.membershipId } });
    await db.penChangeRequest.create({ data: { schoolId: b.school.id, studentMembershipId: b.deshmukh.membershipId, fromPen: record.penNumber, toPen: fakePen(`${b.deshmukh.membershipId}:corrected`), reason: "The transfer certificate from the previous school shows a different last digit.", requestedByUserId: b.admin.user.id } });
  }
}

/* -------------------------------------------------------------------------- */
/* across the two schools                                                      */
/* -------------------------------------------------------------------------- */

/** An open posting at each school, and a teacher of the other applying through the vacancies board. */
async function buildVacancies(sunrise: Built, saraswati: Built) {
  const posting = async (b: Built, title: string, body: string, subjects: string[]) => {
    const existing = await db.jobPosting.findFirst({ where: { schoolId: b.school.id, title }, select: { id: true } });
    return existing ?? (await db.jobPosting.create({ data: { schoolId: b.school.id, title, body, subjects: JSON.stringify(subjects), employmentType: "FULL_TIME", hiringContactMembershipId: b.principal.membership.id, postedByMembershipId: b.admin.membership.id, status: "OPEN" }, select: { id: true } }));
  };
  const pgt = await posting(sunrise, "PGT Mathematics", "A postgraduate teacher of mathematics for grades 9 and 10 from January. M.Sc. with B.Ed.; CBSE experience preferred. Five-day week, salary as per the school scale.", ["Mathematics"]);
  const primary = await posting(saraswati, "Primary English teacher", "इयत्ता ५ ते ७ साठी इंग्रजी शिक्षक/शिक्षिका. B.A. (English) व B.Ed. आवश्यक; मराठी माध्यमातील अनुभव असल्यास प्राधान्य. जून २०२७ पासून.", ["English"]);
  const apply = async (b: Built, postingId: string, applicant: Person, subject: string, ask: string, reply: string, replier: Person) => {
    let enquiry = await db.enquiry.findFirst({ where: { schoolId: b.school.id, kind: "JOB", jobPostingId: postingId, fromUserId: applicant.user.id }, select: { id: true } });
    if (!enquiry) {
      enquiry = await db.enquiry.create({ data: { schoolId: b.school.id, kind: "JOB", jobPostingId: postingId, fromUserId: applicant.user.id, schoolName: b.school.name, subject, createdAt: new Date(Date.now() - 3 * DAY) }, select: { id: true } });
      await db.enquiryMessage.create({ data: { schoolId: b.school.id, enquiryId: enquiry.id, authorUserId: applicant.user.id, body: ask, readBy: JSON.stringify([applicant.user.id, replier.user.id]), createdAt: new Date(Date.now() - 3 * DAY) } });
      await db.enquiryMessage.create({ data: { schoolId: b.school.id, enquiryId: enquiry.id, authorUserId: replier.user.id, body: reply, readBy: JSON.stringify([replier.user.id]), createdAt: new Date(Date.now() - 2 * DAY) } });
      await db.notification.create({ data: { userId: applicant.user.id, schoolId: b.school.id, kind: "ENQUIRY", title: `${b.school.name} replied to your enquiry`, body: subject, url: `/enquiries/${enquiry.id}`, createdAt: new Date(Date.now() - 2 * DAY) } });
    }
    return enquiry;
  };
  const a1 = await apply(sunrise, pgt.id, saraswati.spare, "PGT Mathematics", "I teach mathematics at Saraswati Vidya Mandir in Nashik and am moving to Pune in December. M.Sc. Mathematics (Pune University), B.Ed., six years with the state board. Could I send my CV and visit the school?", "Thank you for writing. Yes, please send the CV to the office and we can arrange a demonstration lesson with grade 9 in the first week of October. — Dr Kulkarni", sunrise.principal);
  const a2 = await apply(saraswati, primary.id, sunrise.spare, "Primary English teacher", "नमस्कार. मी सध्या पुण्यात Sunrise Public School येथे शिकवते; नाशिकला परतण्याचा विचार आहे. B.A. English, B.Ed., चार वर्षांचा अनुभव. अर्ज कसा करावा?", "नमस्कार. कृपया आपला बायोडाटा कार्यालयात पाठवा. ऑक्टोबरच्या पहिल्या आठवड्यात इयत्ता ६ मध्ये एक प्रात्यक्षिक तास ठेवू. — वंदना पाठक", saraswati.principal);
  return { postings: 2, enquiries: [a1.id, a2.id] };
}

/** Parents asking the other school about admission, and Sunita asking Saraswati about a third child. */
async function buildAdmissionEnquiries(sunrise: Built, saraswati: Built, sunita: { id: string }) {
  const ask = async (b: Built, fromUserId: string, body: string, reply: string, replier: Person) => {
    let enquiry = await db.enquiry.findFirst({ where: { schoolId: b.school.id, kind: "ADMISSION", jobPostingId: null, fromUserId }, select: { id: true } });
    if (!enquiry) {
      enquiry = await db.enquiry.create({ data: { schoolId: b.school.id, kind: "ADMISSION", fromUserId, schoolName: b.school.name, subject: "", createdAt: new Date(Date.now() - 4 * DAY) }, select: { id: true } });
      await db.enquiryMessage.create({ data: { schoolId: b.school.id, enquiryId: enquiry.id, authorUserId: fromUserId, body, readBy: JSON.stringify([fromUserId, replier.user.id]), createdAt: new Date(Date.now() - 4 * DAY) } });
      await db.enquiryMessage.create({ data: { schoolId: b.school.id, enquiryId: enquiry.id, authorUserId: replier.user.id, body: reply, readBy: JSON.stringify([replier.user.id]), createdAt: new Date(Date.now() - 3 * DAY) } });
      await db.notification.create({ data: { userId: fromUserId, schoolId: b.school.id, kind: "ENQUIRY", title: `${b.school.name} replied to your admission enquiry`, body: reply.slice(0, 120), url: `/enquiries/${enquiry.id}`, createdAt: new Date(Date.now() - 3 * DAY) } });
    }
    return enquiry;
  };
  const e1 = await ask(sunrise, saraswati.parents[1]!.userId, "We are moving to Pune next summer. Is there a seat in grade 7 for 2027–28, and is the entrance test only for grades 5 and 6?", "Welcome. Grade 7 admission is on the previous school's report and an interview; the written test is for grades 5 and 6 only. The 2027–28 cycle opens on Shalaghar in January — please apply there and we will call you. — Meenal Joshi, office", sunrise.admin);
  const e2 = await ask(saraswati, sunrise.parents[2]!.userId, "आमचा मुलगा सध्या इंग्रजी माध्यमात इयत्ता ५ मध्ये आहे. मराठी माध्यमात इयत्ता ६ साठी प्रवेश शक्य आहे का?", "नक्कीच. इयत्ता ६ साठी प्रवेश परीक्षा जानेवारीत आहे; मराठी वाचन-लेखनाची छोटी चाचणी असते. शाळाघरावरून अर्ज करा. — सुनील वाघ, कार्यालय", saraswati.admin);
  const e3 = await ask(saraswati, sunita.id, "अनयाची धाकटी बहीण पुढच्या वर्षी इयत्ता ५ मध्ये येईल. भावंडांसाठी प्रवेशात प्राधान्य आहे का, आणि शुल्क सवलत?", "हो — भावंडांना प्रवेशात प्राधान्य आहे आणि दुसऱ्या मुलाच्या शिक्षण शुल्कात १० टक्के सवलत. जानेवारीत अर्ज करा; प्रवेश परीक्षा द्यावी लागेल. — सुनील वाघ", saraswati.admin);
  return { enquiries: [e1.id, e2.id, e3.id] };
}

/**
 * Dr Vikram Sethi: a published, verified expert with slots over the next two
 * weeks, a confirmed "Robotics for grade 8" workshop at each school booked by
 * its office with a message either way, and an active mentorship with a
 * grade-9 pupil at Sunrise whose parent has consented. Anjali Rao, the
 * long-standing demo expert, gets a careers talk at Saraswati if she exists.
 */
async function buildExperts(ctx: Ctx, sunrise: Built, saraswati: Built) {
  const user = await upsertUser(ctx, VIKRAM.email, VIKRAM.name);
  const profile =
    (await db.expertProfile.findUnique({ where: { userId: user.id } })) ??
    (await db.expertProfile.create({
      data: {
        userId: user.id, headline: "Science communication and school robotics", bio: "Twelve years running maker workshops for schools across Maharashtra — line-followers, weather stations, and how to explain what you built. Former research engineer; now with the Pune Makers' Collective.",
        specialisms: JSON.stringify(["Science communication", "Robotics", "STEM careers"]), organisation: "Pune Makers' Collective", timezone: "Asia/Kolkata", offering: "BOTH", mentorCapacity: 3, publishedAt: new Date(), verifiedAt: new Date(), verifiedBy: "demo-schools",
      },
    }));
  // Six slots: Mon, Wed, Fri of the next two weeks at 10:00 IST.
  const monday = nextMonday(4, 30);
  const slots: { id: string; startsAt: Date }[] = [];
  for (const offset of [0, 2, 4, 7, 9, 11]) {
    const startsAt = new Date(monday.getTime() + offset * DAY);
    const existing = await db.expertSlot.findFirst({ where: { expertProfileId: profile.id, startsAt }, select: { id: true, startsAt: true } });
    slots.push(existing ?? (await db.expertSlot.create({ data: { expertProfileId: profile.id, startsAt, endsAt: new Date(startsAt.getTime() + 90 * 60_000), note: "90-minute workshop or talk" }, select: { id: true, startsAt: true } })));
  }
  const book = async (b: Built, slot: { id: string }, topic: string, ask: string, reply: string) => {
    let booking = await db.expertBooking.findUnique({ where: { slotId: slot.id }, select: { id: true } });
    if (!booking) {
      await db.expertSlot.update({ where: { id: slot.id }, data: { bookedAt: new Date() } });
      booking = await db.expertBooking.create({ data: { schoolId: b.school.id, expertProfileId: profile.id, expertUserId: user.id, slotId: slot.id, bookedByMembershipId: b.admin.membership.id, topic, status: "CONFIRMED" }, select: { id: true } });
      await db.expertMessage.create({ data: { schoolId: b.school.id, bookingId: booking.id, authorUserId: b.admin.user.id, body: ask, readBy: JSON.stringify([b.admin.user.id, user.id]) } });
      await db.expertMessage.create({ data: { schoolId: b.school.id, bookingId: booking.id, authorUserId: user.id, body: reply, readBy: JSON.stringify([user.id]) } });
      await db.notification.create({ data: { userId: user.id, schoolId: b.school.id, kind: "EXPERT", title: `${b.school.name} booked you`, body: topic, url: `/expert/bookings/${booking.id}` } });
    }
    return booking;
  };
  const b1 = await book(sunrise, slots[0]!, "Robotics for grade 8", "Looking forward to it. We have 32 pupils, the physics lab, and eight sockets. Should we ask them to bring anything?", "Nothing to bring — I carry six kits and a spare. Eight sockets is plenty. Could a teacher stay in the room throughout?");
  const b2 = await book(saraswati, slots[2]!, "Robotics for grade 8", "नमस्कार. इयत्ता ८ चे ३२ विद्यार्थी, संगणक कक्ष. कार्यशाळा मराठीत घेता येईल का?", "नक्की — कार्यशाळा मराठीत घेईन, साहित्य इंग्रजी-मराठी दोन्हीत. सहा किट आणतो.");
  // Mentoring: a grade-9 pupil at Sunrise with a parent, consented.
  const mentee = sunrise.pupils.find((p) => p.grade === "9" && p.parentUserId)!;
  let thread = await db.mentorThread.findUnique({ where: { expertProfileId_studentMembershipId: { expertProfileId: profile.id, studentMembershipId: mentee.membershipId } }, select: { id: true } });
  if (!thread) {
    const when = new Date(Date.now() - 6 * DAY);
    thread = await db.mentorThread.create({
      data: {
        schoolId: sunrise.school.id, expertProfileId: profile.id, expertUserId: user.id, studentMembershipId: mentee.membershipId, createdByMembershipId: sunrise.admin.membership.id,
        purpose: "Preparing a line-following robot for the state science fair", status: "ACTIVE", decidedByMembershipId: sunrise.admin.membership.id, decidedAt: when, parentConsentAt: when, parentConsentUserId: mentee.parentUserId!, createdAt: when,
      },
      select: { id: true },
    });
    await db.expertProfile.update({ where: { id: profile.id }, data: { activeMentorships: { increment: 1 } } });
    const messages = [
      { author: user.id, body: "Hello! Your teacher says you have a chassis and two motors already. What sensor are you using for the line?", daysAgo: 5 },
      { author: mentee.userId, body: "Two IR sensors from a kit. It follows a straight line but loses it on curves.", daysAgo: 4 },
      { author: user.id, body: "Classic. Move the sensors closer to the front and slow the outer wheel instead of stopping it — try a 70/30 split. Send me a short video of a curve and we'll tune from there.", daysAgo: 3 },
    ];
    for (const m of messages) await db.mentorMessage.create({ data: { schoolId: sunrise.school.id, threadId: thread.id, authorUserId: m.author, body: m.body, readBy: JSON.stringify([m.author]), createdAt: new Date(Date.now() - m.daysAgo * DAY) } });
  }
  // The long-standing demo expert, if the demo seed has been run.
  let anjali: { bookingId: string } | null = null;
  const anjaliUser = await db.user.findUnique({ where: { email: ANJALI_EMAIL }, select: { id: true, expertProfile: { select: { id: true, publishedAt: true } } } });
  if (anjaliUser?.expertProfile?.publishedAt) {
    const startsAt = new Date(monday.getTime() + 3 * DAY);
    const slot = (await db.expertSlot.findFirst({ where: { expertProfileId: anjaliUser.expertProfile.id, startsAt }, select: { id: true } })) ?? (await db.expertSlot.create({ data: { expertProfileId: anjaliUser.expertProfile.id, startsAt, endsAt: new Date(startsAt.getTime() + 60 * 60_000), note: "Careers talk" }, select: { id: true } }));
    let booking = await db.expertBooking.findUnique({ where: { slotId: slot.id }, select: { id: true } });
    if (!booking) {
      await db.expertSlot.update({ where: { id: slot.id }, data: { bookedAt: new Date() } });
      booking = await db.expertBooking.create({ data: { schoolId: saraswati.school.id, expertProfileId: anjaliUser.expertProfile.id, expertUserId: anjaliUser.id, slotId: slot.id, bookedByMembershipId: saraswati.admin.membership.id, topic: "Careers after grade 10: streams and scholarships", status: "CONFIRMED" }, select: { id: true } });
      await db.expertMessage.create({ data: { schoolId: saraswati.school.id, bookingId: booking.id, authorUserId: saraswati.admin.user.id, body: "Thank you for taking the session. Grade 10, 48 pupils, mostly Marathi-speaking; a few parents may join.", readBy: JSON.stringify([saraswati.admin.user.id]) } });
    }
    anjali = { bookingId: booking.id };
  }
  return { user, profile, slots: slots.length, bookings: [b1.id, b2.id], threadId: thread.id, mentee, anjali };
}

/** The bell for the demo parent: rows the libraries would have written on the way. */
async function buildSunitaNotifications(sunita: { id: string }, sunrise: Built, saraswati: Built, meetings: { sunriseSlot: string | null }) {
  const rows = [
    { schoolId: sunrise.school.id, kind: "FEES", title: "Term 2 fees are due on 15 December", body: `${sunrise.school.name} · Aarav Deshmukh · Grade 6 · A`, url: "/parent/fees", daysAgo: 2 },
    { schoolId: saraswati.school.id, kind: "POST", title: "अनयाच्या वर्गशिक्षिकेने एक सूचना दिली आहे", body: "इयत्ता ७: सहामाही परीक्षेचे वेळापत्रक", url: "/bulletin", daysAgo: 1 },
    { schoolId: sunrise.school.id, kind: "SYSTEM", title: "Your meeting with Sameer Deshpande is confirmed", body: meetings.sunriseSlot ? "Next week, staff room, 15 minutes." : "Next week.", url: "/parent/meetings", daysAgo: 0 },
  ];
  let n = 0;
  for (const r of rows) {
    const existing = await db.notification.findFirst({ where: { userId: sunita.id, title: r.title }, select: { id: true } });
    if (existing) continue;
    const { daysAgo, ...data } = r;
    await db.notification.create({ data: { userId: sunita.id, ...data, createdAt: new Date(Date.now() - daysAgo * DAY) } });
    n += 1;
  }
  return { created: n, total: await db.notification.count({ where: { userId: sunita.id } }) };
}

/* -------------------------------------------------------------------------- */
/* the count block, so two runs can be compared                                */
/* -------------------------------------------------------------------------- */

async function countBlock(schoolIds: string[], sunitaId: string) {
  const s = { schoolId: { in: schoolIds } };
  const c = {
    users: await db.user.count({ where: { email: { endsWith: `@${DOMAIN}` } } }),
    memberships: await db.membership.count({ where: s }),
    classes: await db.class.count({ where: s }),
    enrollments: await db.enrollment.count({ where: s }),
    guardianships: await db.guardianship.count({ where: { studentSchoolId: { in: schoolIds } } }),
    academicYears: await db.academicYear.count({ where: s }),
    terms: await db.term.count({ where: s }),
    timetableSlots: await db.timetableSlot.count({ where: s }),
    attendanceSessions: await db.attendanceSession.count({ where: s }),
    attendanceRecords: await db.attendanceRecord.count({ where: s }),
    staffAttendance: await db.staffAttendance.count({ where: s }),
    staffRecords: await db.staffRecord.count({ where: s }),
    leaveRequests: await db.leaveRequest.count({ where: s }),
    examSeries: await db.examSeries.count({ where: s }),
    grades: await db.grade.count({ where: s }),
    reportCards: await db.reportCard.count({ where: s }),
    reportCardItems: await db.reportCardItem.count({ where: s }),
    feeStructures: await db.feeStructure.count({ where: s }),
    feePlans: await db.studentFeePlan.count({ where: s }),
    feeDemands: await db.feeDemand.count({ where: s }),
    feePayments: await db.feePayment.count({ where: s }),
    feeReceipts: await db.feeReceipt.count({ where: s }),
    broadcasts: await db.broadcast.count({ where: s }),
    outboundMessages: await db.outboundMessage.count({ where: s }),
    healthCards: await db.healthCard.count({ where: s }),
    incidents: await db.incident.count({ where: s }),
    posts: await db.post.count({ where: s }),
    comments: await db.comment.count({ where: s }),
    postReads: await db.postRead.count({ where: s }),
    postAcks: await db.postAck.count({ where: s }),
    syllabusUnits: await db.syllabusUnit.count({ where: s }),
    lessonPlans: await db.lessonPlan.count({ where: s }),
    substitutions: await db.substitution.count({ where: s }),
    pupilRecords: await db.pupilRecord.count({ where: s }),
    certificateTemplates: await db.certificateTemplate.count({ where: s }),
    issuedCertificates: await db.issuedCertificate.count({ where: s }),
    certificateRequests: await db.certificateRequest.count({ where: s }),
    admissionCycles: await db.admissionCycle.count({ where: s }),
    entranceSlots: await db.entranceSlot.count({ where: s }),
    applications: await db.application.count({ where: s }),
    quizAttempts: await db.quizAttempt.count({ where: s }),
    quizResponses: await db.quizResponse.count({ where: s }),
    quizMastery: await db.quizMastery.count({ where: s }),
    earnedBadges: await db.earnedBadge.count({ where: s }),
    meetingSlots: await db.meetingSlot.count({ where: s }),
    meetingBookings: await db.meetingBooking.count({ where: s }),
    jobPostings: await db.jobPosting.count({ where: s }),
    enquiries: await db.enquiry.count({ where: s }),
    enquiryMessages: await db.enquiryMessage.count({ where: s }),
    expertBookings: await db.expertBooking.count({ where: s }),
    expertMessages: await db.expertMessage.count({ where: s }),
    mentorThreads: await db.mentorThread.count({ where: s }),
    mentorMessages: await db.mentorMessage.count({ where: s }),
    holidays: await db.holiday.count({ where: s }),
    feeConcessions: await db.feeConcession.count({ where: s }),
    feeRefunds: await db.feeRefund.count({ where: s }),
    invites: await db.invite.count({ where: s }),
    remarkThreads: await db.remarkThread.count({ where: s }),
    remarkMessages: await db.remarkMessage.count({ where: s }),
    reports: await db.report.count({ where: s }),
    practiceAssignments: await db.practiceAssignment.count({ where: s }),
    scheduledDepartures: await db.scheduledDeparture.count({ where: s }),
    schoolRecords: await db.schoolRecord.count({ where: s }),
    leftPupils: await db.membership.count({ where: { ...s, role: "STUDENT", leftAt: { not: null } } }),
    competitionEntries: await db.competitionEntry.count({ where: s }),
    competitionStandings: await db.competitionStanding.count({ where: s }),
    rollNumbers: await db.enrollment.count({ where: { ...s, rollNumber: { not: null } } }),
    sunitaNotifications: await db.notification.count({ where: { userId: sunitaId } }),
    // owner-batch-item4b
    inventoryItems: await db.inventoryItem.count({ where: s }),
    purchaseRecords: await db.purchaseRecord.count({ where: s }),
    stockMovements: await db.stockMovement.count({ where: s }),
    assets: await db.asset.count({ where: s }),
    staffSalaries: await db.staffSalary.count({ where: s }),
    payrollRuns: await db.payrollRun.count({ where: s }),
    payslips: await db.payslip.count({ where: s }),
    salaryPayments: await db.salaryPayment.count({ where: s }),
    staffAdvances: await db.staffAdvance.count({ where: s }),
    siteVersions: await db.schoolSiteVersion.count({ where: s }),
    siteFiles: await db.schoolSiteFile.count({ where: s }),
    siteDomains: await db.schoolSiteDomain.count({ where: s }),
    siteVisits: await db.schoolSiteVisit.count({ where: s }),
    alumniProfiles: await db.alumniProfile.count({ where: s }),
    alumniNotes: await db.alumniNote.count({ where: s }),
    reviewRounds: await db.reviewRound.count({ where: s }),
    reviewResponses: await db.reviewResponse.count({ where: s }),
    feeGatewayAccounts: await db.feeGatewayAccount.count({ where: s }),
    familyPayments: await db.feePayment.count({ where: { ...s, method: { in: ["ONLINE", "UPI"] } } }),
    // owner-batch-item4b end
  };
  return c;
}

/* -------------------------------------------------------------------------- */
/* the roster document                                                         */
/* -------------------------------------------------------------------------- */

/** qb-C: each platform switch as it stands now, for the roster's legend (a missing row is off, as platform-features.ts reads it). */
async function featureStates(): Promise<Record<string, boolean>> {
  const rows = await db.platformFeature.findMany({ select: { code: true, enabled: true } });
  return Object.fromEntries(PLATFORM_FEATURES.map((code) => [code, rows.some((r) => r.code === code && r.enabled)]));
}

function rosterMarkdown(input: { sunrise: Built; saraswati: Built; sunita: { id: string }; expert: { threadId: string; bookings: string[]; mentee: { name: string; grade: string }; anjali: { bookingId: string } | null }; vacancies: { enquiries: string[] }; admissionEnquiries: { enquiries: string[] }; circulars: Record<string, string>; globalPostId: string; features: Record<string, boolean> }): string {
  const { sunrise, saraswati } = input;
  const staffRows = (b: Built) => {
    const rows = [
      [b.admin.user.email, b.admin.user.name, "Admin", `/admin, /admin/people, /admin/fees, /admin/admissions, /admin/certificates, /admin/filings, /admin/messaging, /admin/vacancies, /enquiries${HEAD_PAGES_NOTE}`],
      [b.principal.user.email, b.principal.user.name, "Principal", `/principal, /principal/staff, /principal/leave (one pending ask), /enquiries (the vacancy applicant)`],
      ...b.formTeachers.map((t, i) => [t.user.email, t.user.name, `Teacher · form, Grade ${GRADES[i]}`, `/teacher, /teacher/classes/${b.classes[i]!.id}, /teacher/attendance?classId=${b.classes[i]!.id}, /bulletin`]),
      ...b.subjectTeachers.map((t) => [t.user.email, t.user.name, "Teacher · subject only", `/teacher (timetable, no form class)`]),
      [b.spare.user.email, b.spare.user.name, "Teacher · unattached", `/teacher (empty state), /vacancies (has applied to the other school), /enquiries`],
      ...(b.moduleStaff ?? []).map((m) => [m.email, m.name, m.role, m.look]),
    ];
    return rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  };
  const pupilRows = (b: Built) =>
    b.classes.map((c) => {
      const roll = b.pupils.filter((p) => p.grade === c.grade);
      const withParent = roll.filter((p) => p.parentUserId).length;
      return `| Grade ${c.grade} · A | ${roll.map((p) => `${p.name} (${p.email})`).join(", ")} | ${withParent} of ${roll.length} have a parent: \`${b.spec.key}.parentNN@${DOMAIN}\` for pupil NN${c.grade === b.spec.deshmukh.grade ? `; ${b.spec.deshmukh.first}'s parent is Sunita` : ""} |`;
    }).join("\n");
  const cls = (b: Built, grade: string) => b.classes.find((c) => c.grade === grade)!;
  // A roster is not help: the marker keeps this file out of the assistant's help index (scripts/help-index.ts).
  // qb-C (QB-15): every path a platform switch closes is marked "(behind X)" and the legend says how each switch
  // stood at this run, so nobody is sent to a 404 the roster did not warn of (scripts/demo-feature-paths.ts).
  return markFeatureGated(`<!-- helpIndex: false -->
# Demo schools

Two complete demo schools built by \`npm run demo:schools\` (apps/web). Every account below signs in with the same password:

**Password for every demo account: \`${PASSWORD}\`**

Re-running the script is safe; it adds nothing the second time and resets every password to the one above.

${featureLegend(input.features)}

| | Sunrise Public School | Saraswati Vidya Mandir |
|---|---|---|
| Slug / school id | \`${sunrise.school.slug}\` / \`${sunrise.school.id}\` | \`${saraswati.school.slug}\` / \`${saraswati.school.id}\` |
| Join code | ${sunrise.school.code} | ${saraswati.school.code} |
| City, board, medium | Pune · CBSE · English | Nashik · MSBSHSE · Marathi (app locale \`mr\`) |
| Filing identity | UDISE 27250200201, affiliation 1130456, Haveli block | UDISE 27200300301, index 20.03.001, Nashik block |
| Grades | 5–10, one class per grade (section A), 8 pupils each | 5–10, one class per grade (section A), 8 pupils each |
| Directory page | /explore/${sunrise.school.id} | /explore/${saraswati.school.id} |

## Staff — Sunrise Public School

| Email | Name | Role | Look at |
|---|---|---|---|
${staffRows(sunrise)}

## Staff — Saraswati Vidya Mandir

| Email | Name | Role | Look at |
|---|---|---|---|
${staffRows(saraswati)}

## Pupils

Every pupil is a minor with a birthdate that fits the grade. Pupil accounts open /student, /student/practice, /student/record, /student/certificates, /report-cards and /bulletin. Parent accounts open /parent with the child switcher, /parent/fees, /parent/health, /parent/meetings, /parent/practice, /parent/certificates, /parent/applications and /enquiries.

### Sunrise Public School

| Class | Pupils | Parents |
|---|---|---|
${pupilRows(sunrise)}

### Saraswati Vidya Mandir

| Class | Pupils | Parents |
|---|---|---|
${pupilRows(saraswati)}

## The cross-school parent

| Email | Name | Phone | Children |
|---|---|---|---|
| ${SUNITA.email} | ${SUNITA.name} | +91 98220 11223 | **Aarav Deshmukh** (${sunrise.spec.deshmukh.email}) in Sunrise Grade 6 · A, and **Anaya Deshmukh** (${saraswati.spec.deshmukh.email}) in Saraswati Grade 7 · A |

Sunita's pages: /parent (switch between the children with \`?child=<membershipId>\` — Aarav \`${sunrise.deshmukh.membershipId}\`, Anaya \`${saraswati.deshmukh.membershipId}\`), /parent/fees (a plan and demands at each school), /parent/health (both cards), /parent/certificates (a bonafide issued to Aarav; Anaya's pending ask), /parent/meetings (one booked at each school), /parent/practice (both children's quiz activity), /parent/applications, /enquiries (her admission enquiry to Saraswati about a third child: /enquiries/${input.admissionEnquiries.enquiries[2]}), /explore/${sunrise.school.id} and /explore/${saraswati.school.id}, and the bell.

## The expert

| Email | Name | Look at |
|---|---|---|
| ${VIKRAM.email} | ${VIKRAM.name} | /expert (two confirmed "Robotics for grade 8" workshops next week: /expert/bookings/${input.expert.bookings[0]} at Sunrise, /expert/bookings/${input.expert.bookings[1]} at Saraswati), /expert/availability (slots over the next two weeks), /mentoring/${input.expert.threadId} (active mentorship with ${input.expert.mentee.name}, grade ${input.expert.mentee.grade} at Sunrise, three messages), /expert/profile |
${input.expert.anjali ? `| ${ANJALI_EMAIL} | Dr Anjali Rao (existing demo expert) | /expert/bookings/${input.expert.anjali.bookingId} — a careers talk booked by Saraswati |` : `| ${ANJALI_EMAIL} | Dr Anjali Rao | not present in this database (run \`npm run demo:seed\` first if wanted) |`}

## Workflows seeded, and where to see each

| Workflow | Where |
|---|---|
| People, roles, classes | /admin/people, /admin/classes, /admin/classes/<id>; /principal/staff |
| Timetable, Mon–Sat, 6 periods + a break, every class staffed | /admin/timetable, /teacher (today's lessons), /principal/timetable |
| Class registers, last 10 open days; the whole of last year's register on the archived classes | /admin/attendance, /teacher/attendance?classId=<id>, /parent/attendance |
| School calendar for both years: holidays, an exam span, the annual day | /admin/calendar |
| Staff register, last 10 days, one late, one absent, today a check-in | /admin/staff-attendance |
| Leave: one pending (cover nominated), one approved | /principal/leave, /teacher/leave |
| Substitutions today (a subject teacher absent, a free colleague covering) | /admin/substitutions |
| Academic years: 2025–26 closed, 2026–27 current with two terms, 2027–28 waiting | /admin/settings, /admin/calendar |
| Last year's annual report card, published, for every pupil in grades 6–10 | /report-cards (pupil), /parent/grades → cards, /admin/report-cards |
| Term 1 exams and published term cards for grades 6 and 9 (a draft set too) | /admin/exams, /admin/report-cards, /teacher/classes/${cls(sunrise, "6").id}/report-cards |
| Fees: a structure per grade, every pupil on a plan, two cash receipts per grade, a 25 % tuition concession (grade 7), a bus-fee refund on a cash payment (grade 6) | /admin/fees, /admin/fees/dues, /parent/fees, /fees/receipts |
| Texts: every parent numbered, SMS and WhatsApp on, one broadcast sent | /admin/messaging |
| Health cards (three per school plus both Deshmukh children), one check-up | /parent/health, /admin/people → a pupil |
| Incidents: one closed, one open with a note | /admin/incidents, /teacher/incidents, /parent/incidents |
| Circular asking for an acknowledgement, told to every parent, opened by some | /admin/circulars, /bulletin/${input.circulars.sunrise} (Sunrise), /bulletin/${input.circulars.saraswati} (Saraswati) |
| Social feed: 8 posts per school (school, class, two by pupils, one pending review), comments, reads; a global post | /bulletin, /bulletin/global (post ${input.globalPostId}), /teacher (review queue) |
| Syllabus for grades 6 and 9, progress and two lesson plans | /admin/syllabus, /admin/syllabus/coverage, /teacher/classes/<id>/syllabus |
| Certificates: templates in the school's language, issued papers (one answering an ask), asks pending and declined, pupil records for every class | /admin/certificates, /admin/certificates/issue, /admin/certificates/issued, /admin/records, /student/certificates, /certificates/check |
| Filings identity and readiness | /admin/filings |
| Admissions: an OPEN 2027–28 cycle for grades 5 and 6 with a test and sittings, seven applications from a parent of the other school in every state, one walk-in | /admin/admissions, /admin/admissions/applications, /explore/<schoolId>, /parent/applications (as the applying parent) |
| Vacancies: an open posting at each school with the other school's spare teacher applying | /admin/vacancies, /vacancies, /enquiries/${input.vacancies.enquiries[0]} (as ${saraswati.spare.user.email} or Sunrise's principal), /enquiries/${input.vacancies.enquiries[1]} |
| Admission enquiries from parents of the other school | /enquiries (as each school's admin) |
| Quiz practice: 2–5 finished attempts per pupil in grades 6–9 with badges | /student/practice, /parent/practice, /teacher/practice, /principal (practice insights) |
| Meetings: two teachers per school with slots next week, Sunita booked at each | /teacher/meetings, /parent/meetings |
| Experts: a published expert, slots, a confirmed workshop at each school with messages, an active mentorship | /experts, /experts/bookings/<id> (as an admin), /expert, /mentoring |
| A pending teacher invitation (\`<school>.invite1@${DOMAIN}\`) | /admin/people → invitations |
| A remark thread between the grade-7 form teacher and a parent, the reply unread by the teacher | /teacher/remarks, /parent/remarks |
| An OPEN report on a comment under the robotics post | /admin/safety (or the review queue) |
| A practice assignment for grade 6 with a target level | /teacher/practice, /student/practice |
| A grade-9 entry in the platform's "Autumn Science Fair" with a result and the school's standing | /competitions (the platform's section, while the operator has the COMPETITIONS feature on) |
| A competition event on the calendar — the inter-house quiz on 11 December, enrolment open until the 8th for classes 5–10, the SCHOOL board — with a grade-9 entry placed 2nd (decision 0007) | /admin/calendar, /student/agenda, /parent/agenda, /competitions/{id} |
| A pupil who left in August with a transfer record (\`<school>.pupil49\`, ${sunrise.spec.leaver.name} / ${saraswati.spec.leaver.name}); a grade-8 departure scheduled for 30 April | /admin/people → departures, /admin/certificates |
| Pupil records with coded category and religion, caste, parents' occupations, income, the previous school's TC; staff records with dates of birth and of joining service; roll numbers in every class | /admin/records, /admin/filings, /student/record |
${/* owner-batch-item4a: Sunrise's bus, hostel and library rows */ campusRosterRows(SUNRISE_CAMPUS)}

${/* owner-batch-item4b: the review round and online payments are seeded now; this section says what and where. */ item4bRosterSection()}
`);
}

/* -------------------------------------------------------------------------- */

async function main() {
  await refuseUnlessLocal("demo:schools");
  const passwordHash = await hash(PASSWORD, ARGON);
  const ctx: Ctx = { passwordHash, setPassword: true };

  const sunita = await upsertUser(ctx, SUNITA.email, SUNITA.name, { phone: SUNITA.phone, phoneVerifiedAt: new Date() });
  if (sunita.phone !== SUNITA.phone) {
    const taken = await db.user.findUnique({ where: { phone: SUNITA.phone }, select: { id: true } });
    if (!taken) await db.user.update({ where: { id: sunita.id }, data: { phone: SUNITA.phone, phoneVerifiedAt: new Date() } });
  }

  const built: Built[] = [];
  for (const spec of [SUNRISE, SARASWATI]) {
    const b = await buildSchool(ctx, spec, sunita);
    const admin = b.admin.user.id;
    const staff = [...b.formTeachers, ...b.subjectTeachers];
    const en = spec.locale === "en";
    // The calendar first: last year's register and this year's skip the days it shuts the school.
    const calendar = (await buildHolidays(b.school, CALENDAR_2025_26, { academicYearId: b.years.prev.id, locale: spec.locale })).entries + (await buildHolidays(b.school, CALENDAR_2026_27, { academicYearId: b.years.current.id, locale: spec.locale })).entries;
    const closed = await closedDays(b.school.id);
    const lastYear = await buildLastYear(b, closed);
    const timetable = await buildTimetable(b.school.id, b.classes.map((c) => ({ id: c.id, grade: c.grade })), staff, { days: [1, 2, 3, 4, 5, 6], unstaffedWeekday: null, subjects: [...spec.formTeachers, ...spec.subjectTeachers].map((t) => t.subjects[0]!) });
    const records = await buildStaffRecords(b.school, staff);
    for (const [i, p] of [b.admin, b.principal, b.spare].entries()) {
      const data = { gender: i === 0 ? (spec.key === "sunrise" ? "F" : "M") : i === 1 ? (spec.key === "sunrise" ? "M" : "F") : "F", socialCategory: "GENERAL", academicQualification: "5", professionalQualification: i === 2 ? "3" : "4", appointmentType: "REGULAR", designation: i === 0 ? "Administrator" : i === 1 ? "Principal" : "Assistant teacher", ...staffDates(10 + i, [2012, 2010, 2026][i]!), staffNumber: `EMP-${101 + i}`, leaveDaysPerYear: 12 };
      await db.staffRecord.upsert({ where: { membershipId: p.membership.id }, create: { schoolId: b.school.id, membershipId: p.membership.id, ...data }, update: data });
    }
    // The departures before anything that reads the roll: the leaver's enrolment is REMOVED from the start, so no plan, record or mark is ever written for them.
    const g8 = b.classes.find((c) => c.grade === "8")!;
    const departures = await buildDepartures(ctx, b.school, b.admin.membership.id, {
      leaver: { email: `${spec.key}.pupil49@${DOMAIN}`, name: spec.leaver.name, classId: g8.id, grade: "8", birthdate: birthdateFor("8", 8), joinedOn: new Date("2026-06-15T00:00:00Z"), leftOn: new Date("2026-08-31T00:00:00Z"), destination: spec.leaver.destination, note: spec.leaver.note, conduct: "GOOD" },
      scheduled: { membershipId: b.pupils.find((p) => p.grade === "8" && p.seat === 7)!.membershipId, leaveOnKey: "2027-04-30", reason: "TRANSFERRED", destination: spec.scheduledDestination, note: en ? "Parents asked for the TC to be ready by the first week of May." : "पालकांनी मे महिन्याच्या पहिल्या आठवड्यापर्यंत दाखला तयार ठेवण्यास सांगितले.", conduct: "GOOD" },
    });
    // The modules (3 Oct 2026): Sunrise has every module on and one person in each module role; Saraswati keeps the default (ALUMNI). Each school's leaver is its alumnus.
    b.moduleStaff = [{ email: `${spec.key}.pupil49@${DOMAIN}`, name: spec.leaver.name, role: "Alumnus (left grade 8)", look: "/alumni, /bulletin, /remarks, /record" }];
    if (spec.key === "sunrise") {
      await switchModulesOn(b.school, SCHOOL_MODULES, admin);
      for (const m of [
        { email: `${spec.key}.driver01@${DOMAIN}`, name: "Ramesh Gaikwad", role: "DRIVER", label: "Driver", title: "Bus driver, route 1", look: "/driver" },
        { email: `${spec.key}.librarian@${DOMAIN}`, name: "Shalini Apte", role: "LIBRARIAN", label: "Librarian", title: "Librarian", look: "/library" },
        { email: `${spec.key}.warden@${DOMAIN}`, name: "Prakash More", role: "WARDEN", label: "Warden", title: "Hostel warden", look: "/hostel" },
      ]) {
        const user = await upsertUser(ctx, m.email, m.name);
        await upsertMembership(user.id, b.school.id, m.role, { title: m.title });
        b.moduleStaff.push({ email: m.email, name: m.name, role: m.label, look: m.look });
      }
    }
    const registers = await buildRegisters(b, closed);
    const fees = await buildFees(b.school, admin, { grades: GRADES, payers: 2, clientTag: `demo-${spec.key}` });
    const adjustments = await buildFeeAdjustments(b.school, admin, {
      concession: { grade: "7", headCode: "TUI", percentBp: 2500, reason: en ? "Sibling concession: second child at the school." : "भावंड सवलत: शाळेतील दुसरे मूल." },
      refund: { clientId: `demo-${spec.key}-term1-6-1`, amountPaise: 3_000_00, reason: en ? "Transport withdrawn from August; the Term 1 bus fee returned in cash." : "ऑगस्टपासून वाहतूक सेवा बंद; पहिल्या सत्राचे बस शुल्क रोखीने परत.", on: new Date("2026-08-05T05:30:00Z") },
    });
    const texts = await buildMessaging(b.school, admin, { keepPhones: true, phonePrefix: spec.phonePrefix.replace(/0$/, "9"), locale: spec.locale });
    const others = b.pupils.filter((p) => p.grade === spec.deshmukh.grade && p.seat > 0).map((p) => p.email);
    const health = await buildHealth(b.school, admin, { pupils: others.slice(0, 3) });
    await buildDeshmukh(b, sunita);
    const incidents = await buildIncidents(b.school, admin, { pupils: [others[0]!, others[1]!] });
    const circular = await buildCircular(b.school, admin, { locale: spec.locale });
    await read(circular.postId, b.school.id, sunita.id);
    await db.postAck.upsert({ where: { postId_userId: { postId: circular.postId, userId: sunita.id } }, create: { postId: circular.postId, schoolId: b.school.id, userId: sunita.id }, update: {} });
    const staffAtt = await buildStaffAttendance(b.school, admin, { days: 10 });
    const syllabus6 = await buildSyllabus(b.school, { grade: "6", lists: { Mathematics: ["Knowing our numbers", "Whole numbers", "Playing with numbers", "Basic geometrical ideas", "Understanding elementary shapes", "Integers", "Fractions", "Decimals", "Data handling", "Mensuration"], Science: ["Food: where does it come from?", "Components of food", "Fibre to fabric", "Sorting materials into groups", "Separation of substances", "Changes around us", "Getting to know plants", "Body movements", "The living organisms", "Motion and measurement"] } });
    const syllabus9 = await buildSyllabus(b.school, { grade: "9", lists: { Mathematics: ["Number systems", "Polynomials", "Coordinate geometry", "Linear equations in two variables", "Introduction to Euclid's geometry", "Lines and angles", "Triangles", "Quadrilaterals", "Circles", "Heron's formula", "Statistics"], Science: ["Matter in our surroundings", "Is matter around us pure?", "Atoms and molecules", "Structure of the atom", "The fundamental unit of life", "Tissues", "Motion", "Force and laws of motion", "Gravitation", "Work and energy", "Sound"] } });
    const subs = await buildSubstitutions(b.school, admin, b.subjectTeachers[0]);
    const exams6 = await buildExams(b.school, admin, { grade: "6", subjects: ["Mathematics", spec.language] });
    const exams9 = await buildExams(b.school, admin, { grade: "9", subjects: ["Mathematics", "Science"] });
    // A sitting still ahead for each grade, so the assistant's exam-scope reader has a date to answer with (10 Oct 2026).
    await buildUpcomingExam(b.school, admin, { grade: "6", subjects: ["Mathematics", spec.language] });
    await buildUpcomingExam(b.school, admin, { grade: "9", subjects: ["Mathematics", "Science"] });
    const certs = await buildCertificates(b.school, admin, spec.locale === "en"
      ? { grade: "6", recordGrades: GRADES, keepRecords: [b.deshmukh.membershipId], codePrefix: spec.codePrefix, city: spec.city, previousSchool: spec.previousSchool,
          templates: [{ kind: "BONAFIDE", locale: "en" }, { kind: "CHARACTER", locale: "en" }, { kind: "STUDY", locale: "en" }, { kind: "TC", locale: "en" }],
          issues: [{ key: "BONAFIDE-en", pupil: 0, number: 1, purpose: "a passport application", fromRequest: true }, { key: "STUDY-en", pupil: 1, number: 1, purpose: "a scholarship" }, { key: "CHARACTER-en", pupil: 2, number: 1, purpose: "a sports academy trial" }],
          requests: [{ pupil: 3, kind: "BONAFIDE", purpose: "a bus pass" }, { pupil: 4, kind: "STUDY", purpose: "a bank account" }, { pupil: 5, kind: "CHARACTER", purpose: "an NCC camp", status: "DECLINED", reason: "Term 1 fees are outstanding; please clear them first." }] }
      : { grade: "7", recordGrades: GRADES, keepRecords: [b.deshmukh.membershipId], codePrefix: spec.codePrefix, city: spec.city, previousSchool: spec.previousSchool,
          templates: [{ kind: "BONAFIDE", locale: "mr" }, { kind: "CHARACTER", locale: "mr" }, { kind: "STUDY", locale: "mr" }, { kind: "TC", locale: "mr" }, { kind: "NIRGAM", locale: "mr" }],
          issues: [{ key: "BONAFIDE-mr", pupil: 1, number: 1, purpose: "बस पास" }, { key: "STUDY-mr", pupil: 2, number: 1, purpose: "शिष्यवृत्ती", fromRequest: true }, { key: "CHARACTER-mr", pupil: 3, number: 1, purpose: "क्रीडा शिबिर" }],
          requests: [{ pupil: 0, kind: "BONAFIDE", purpose: "पासपोर्ट अर्ज" }, { pupil: 4, kind: "CHARACTER", purpose: "क्रीडा चाचणी" }, { pupil: 5, kind: "STUDY", purpose: "बँक खाते", status: "DECLINED", reason: "पहिल्या सत्राचे शुल्क थकीत आहे." }] });
    // The office's and the head's signatures and the school's seal (10 Oct 2026), so a paper issued in the demo prints signed.
    await buildSignatures(b.school, { adminUserId: admin, principalUserId: b.principal.user.id });
    const leave = await buildLeave(b);
    const meetings = await buildMeetings(b, sunita);
    const feed = await buildFeed(b, sunita);
    const quizzes = await buildQuizzes(b);
    // The rest of what the audit found nobody had seeded: a pending invite, a remark thread, a practice
    // assignment, a competition entry with the school's standing, and the roll number in every class.
    const invite = await buildInvite(b.school, b.admin.membership.id, { email: `${spec.key}.invite1@${DOMAIN}`, name: spec.invite.name, subjects: spec.invite.subjects });
    const g7 = b.classes.find((c) => c.grade === "7")!;
    const remarked = b.pupils.find((p) => p.grade === "7" && p.seat === 1)!;
    const remarks = await buildRemarkThread(b.school, {
      studentMembershipId: remarked.membershipId, teacherMembershipId: g7.teacher.membership.id, teacherUserId: g7.teacher.user.id, parentUserId: remarked.parentUserId!,
      subject: en ? "Homework diary" : "गृहपाठ वही",
      remark: en ? `${remarked.name.split(" ")[0]} has not brought the homework diary for a week; could you check it is signed each evening?` : `${remarked.name.split(" ")[0]}ने आठवडाभर गृहपाठ वही आणलेली नाही; रोज संध्याकाळी सही होते का ते पाहाल का?`,
      reply: en ? "Sorry — it was left at the grandparents'. It will be in the bag from tomorrow." : "क्षमस्व — आजी-आजोबांकडे राहिली होती. उद्यापासून दप्तरात असेल.",
    });
    const g6 = b.classes.find((c) => c.grade === "6")!;
    const practice = await buildPracticeAssignment(b.school, { classId: g6.id, classLevel: 6, createdByMembershipId: g6.teacher.membership.id, preferSlugs: ["maths-6-integers", "maths-6-knowing-our-numbers"], targetLevel: 3, note: en ? "Reach level 3 before the unit test on the 16th." : "१६ तारखेच्या घटक चाचणीपूर्वी पातळी ३ गाठा.", dueAt: new Date("2026-10-16T12:30:00Z") });
    const competitor = b.pupils.find((p) => p.grade === "9" && p.seat === 1)!;
    const competition = await buildCompetitionEntry(b.school, { title: "Autumn Science Fair", studentMembershipId: competitor.membershipId, parentUserId: competitor.parentUserId, rank: spec.key === "sunrise" ? 3 : 7, scoreMilli: spec.key === "sunrise" ? 84_500 : 78_250, submissionUrl: `https://sciencefair.example.org/entries/${spec.key}-2026-09`, enteredOn: new Date("2026-07-15T04:30:00Z") });
    // decision 0007 (6 Nov 2026): the school's own competition is a calendar event — the inter-house quiz in
    // December, enrolment open until the 8th, classes 5–10, the SCHOOL board, with the grade-9 second seat entered
    // (consented) and placed, so the agenda shows an Enrol button to the others and the board a first name.
    const quizzer = b.pupils.find((p) => p.grade === "9" && p.seat === 2)!;
    const event = await buildCompetitionEvent(b.school, {
      title: en ? "Inter-house quiz" : "आंतरगृह प्रश्नमंजुषा",
      summary: en ? "The houses' general-knowledge quiz; two rounds in the hall, prizes at assembly." : "गृहांची सामान्यज्ञान प्रश्नमंजुषा; सभागृहात दोन फेऱ्या, प्रार्थनेच्या वेळी बक्षिसे.",
      startKey: "2026-12-11",
      closesKey: "2026-12-08",
      gradeLow: "5",
      gradeHigh: "10",
      internalBoard: "SCHOOL",
      academicYearId: b.years.current.id,
      entrant: { studentMembershipId: quizzer.membershipId, parentUserId: quizzer.parentUserId, scoreMilli: 42_000, rank: 2 },
    });
    const rolls = await buildRollNumbers(b.school);
    b.counts = { calendar, competitionEvent: `"${en ? "Inter-house quiz" : "आंतरगृह प्रश्नमंजुषा"}" on 11 Dec (${event.made ? "made" : "present"}), 1 entry placed 2nd`, lastYearCards: lastYear.cards, lastYearRegisters: lastYear.sessions, lastYearDays: lastYear.days, timetableSlots: timetable.slots, staffRecords: records.records + 3, registers: registers.sessions, feeStructures: fees.structures.length, feePupils: fees.pupils, receipts: fees.receipts, concessions: adjustments.concessions, refunds: adjustments.refunds, textsNumbered: texts.numbered, health: health.cards + 1, incidents: incidents.incidents, circular: circular.postId, staffMarks: staffAtt.marked, syllabus: syllabus6.units + syllabus9.units, subs: subs.covered, exams: `${exams6.series + exams9.series} series, ${exams6.papers + exams9.papers} papers, ${exams6.marks + exams9.marks} marks, ${exams6.cards + exams9.cards} cards`, certs: `${certs.templates} templates, ${certs.records} records, ${certs.issued} issued, ${certs.requests} asks`, leave: leave.requests, meetingSlots: meetings.slots, posts: feed.posts, comments: feed.comments, reportId: feed.reportId, quizAttempts: quizzes.attempts, quizResponses: quizzes.responses, badges: quizzes.badges, invite: invite.status, remarkThread: remarks.threadId, practice: practice.topic ?? "none (no bank imported)", competition: competition.skipped ?? `1 entry in "Autumn Science Fair", standing written`, leaver: departures.leaverMembershipId, scheduledDepartures: departures.scheduled, rolls: rolls.numbered };
    built.push(b);
  }
  const [sunrise, saraswati] = built as [Built, Built];

  // Across the two: admissions (a parent of the other school applies), vacancies, enquiries, experts, the parent's bell.
  const admissions: Record<string, { cycles: number; slots: number; applications: number }> = {};
  for (const [b, other, family, walkIn] of [
    [sunrise, saraswati, "Pawar", { applicantName: "Sujata Kulkarni", applicantPhone: "+919822077001", childName: "Anvi Kulkarni", grade: "5" }],
    [saraswati, sunrise, "Kadam", { applicantName: "Rajendra Nikam", applicantPhone: "+919822077002", childName: "Sai Nikam", grade: "5" }],
  ] as const) {
    const applicant = other.parents[3]!;
    const structure = (await db.feeStructure.findFirst({ where: { schoolId: b.school.id, gradeLevel: "5", academicYearId: b.years.current.id }, select: { id: true } }))?.id ?? null;
    admissions[b.spec.key] = await buildAdmissions(b.school, b.admin.user.id, structure, {
      profile: { profilePublishedAt: new Date(), profileAbout: b.spec.about, admissionsContactMembershipId: b.admin.membership.id, ...b.spec.filing },
      academicYearId: b.years.next.id, grades: [{ grade: "5", seats: 8 }, { grade: "6", seats: 4 }], applicant: { userId: applicant.userId, name: applicant.name, email: applicant.email }, family, admittedGrade: "5",
      fileTag: `demo-${b.spec.key}`, city: other.spec.city, addressLine: b.spec.key === "sunrise" ? "7 College Road, Nashik" : "22 Karve Nagar, Pune", previousSchool: other.school.name, walkIn, closedCycle: false,
      notice: b.spec.locale === "en" ? "Entrance test for grades 5 and 6 in January; bring the originals. The office is open 9 to 1 on Saturdays." : "इयत्ता ५ व ६ साठी प्रवेश परीक्षा जानेवारीत; मूळ कागदपत्रे आणा. कार्यालय शनिवारी ९ ते १ उघडे.",
    });
  }
  const vacancies = await buildVacancies(sunrise, saraswati);
  const admissionEnquiries = await buildAdmissionEnquiries(sunrise, saraswati, sunita);
  const experts = await buildExperts(ctx, sunrise, saraswati);
  const globalPost = await buildGlobalPost(sunrise);
  const bell = await buildSunitaNotifications(sunita, sunrise, saraswati, { sunriseSlot: "booked" });

  // owner-batch-item4a: Sunrise's bus, hostel and library (owner's batch of 27 October 2026, item 4a); Saraswati stays the plain school.
  await buildCampusModules(ctx, sunrise, SUNRISE_CAMPUS);
  // owner-batch-item4a end

  // owner-batch-item4b: Sunrise's inventory, payroll, website, alumni, review rounds and online fees, after every other builder so the payroll's roll holds all the staff.
  const item4b = await buildSunriseItem4b(ctx, sunrise);
  sunrise.moduleStaff?.push(...item4b.accounts);
  // owner-batch-item4b end

  // owner-batch-item9 (27 Oct 2026; decision 7): the head gives each school's admin the head's pages (leave approval,
  // trends, reviews, safety) through setHeadDuty, audited once; a second run finds them held and writes nothing.
  const headPages = { sunrise: await giveHeadPages(db, sunrise.school.id), svm: await giveHeadPages(db, saraswati.school.id) };
  // owner-batch-item9 end

  const counts = await countBlock([sunrise.school.id, saraswati.school.id], sunita.id);

  const doc = rosterMarkdown({ sunrise, saraswati, sunita, expert: { threadId: experts.threadId, bookings: experts.bookings, mentee: { name: experts.mentee.name, grade: experts.mentee.grade }, anjali: experts.anjali }, vacancies, admissionEnquiries, circulars: { sunrise: String(sunrise.counts.circular), saraswati: String(saraswati.counts.circular) }, globalPostId: globalPost.postId, features: await featureStates() });
  const docPath = join(process.cwd(), "..", "..", "docs", "demo-schools.md");
  await mkdir(join(process.cwd(), "..", "..", "docs"), { recursive: true });
  // The other generators' sections (demo:college, demo:college-stream, demo:college-engineering, demo:transfer) are
  // written between their own markers; a rewrite of the schools' roster keeps every one of them, in order
  // (integration, 11 Oct 2026: it kept the first college's alone, so a demo:schools run dropped the stream
  // colleges' and the transfer's rosters until those scripts ran again).
  const before = await readFile(docPath, "utf8").catch(() => "");
  const kept = [...before.matchAll(/<!-- ([a-z-]+):begin -->[\s\S]*?<!-- \1:end -->\n?/g)].map((m) => m[0].trimEnd());
  await writeFile(docPath, kept.length ? `${doc.trimEnd()}\n\n${kept.join("\n\n")}\n` : doc);

  const line = (b: Built) => `
  ── ${b.school.name} ──────────────────────────────────────────
     school id   ${b.school.id}   join code ${b.school.code}   slug ${b.school.slug}
     admin       ${b.admin.user.email}   (${b.admin.user.name}); the head's pages: ${headPages[b.spec.key].given} given this run, ${headPages[b.spec.key].already} already held
     principal   ${b.principal.user.email}   (${b.principal.user.name})
     teachers    ${b.spec.key}.teacher1..6@${DOMAIN}  form teachers of grades 5–10; ${b.spec.key}.subject1..2 subject only; ${b.spec.key}.spare1 unattached
     pupils      ${b.pupils.length} in ${b.classes.length} classes (${b.spec.key}.pupil01..48@${DOMAIN}; ${b.spec.deshmukh.email} in grade ${b.spec.deshmukh.grade})
     parents     ${b.parents.length} (${b.spec.key}.parentNN@${DOMAIN} for pupil NN) + Sunita Deshmukh
     calendar    ${b.counts.calendar} entries over ${b.years.prev.name} and ${b.years.current.name} (holidays, an exam span, the annual day)
     last year   ${b.counts.lastYearCards} annual cards on archived ${b.years.prev.name} classes, each with the year's register behind it: ${b.counts.lastYearRegisters} sessions over ${b.counts.lastYearDays} open days
     timetable   ${b.counts.timetableSlots} slots, Mon–Sat, every one staffed
     registers   ${b.counts.registers} class sessions over the last 10 open days; ${b.counts.staffMarks} staff marks; ${b.counts.rolls} roll numbers
     fees        ${b.counts.feeStructures} structures, ${b.counts.feePupils} pupils on plans, ${b.counts.receipts} receipts, ${b.counts.concessions} concession (25 % off tuition, grade 7), ${b.counts.refunds} refund (bus fee, grade 6)
     leavers     ${b.spec.leaver.name} (${b.spec.key}.pupil49) left grade 8 on 31 August with a TC record; ${b.counts.scheduledDepartures} departure scheduled for 30 April; membership ${b.counts.leaver}
     also        invite ${b.counts.invite} for ${b.spec.key}.invite1@${DOMAIN}; remark thread ${b.counts.remarkThread}; report ${b.counts.reportId} on a comment; practice on "${b.counts.practice}"; competition: ${b.counts.competition}
     texts       SMS and WhatsApp on, one broadcast; health ${b.counts.health} cards; incidents ${b.counts.incidents}; circular /bulletin/${b.counts.circular}
     syllabus    ${b.counts.syllabus} chapters (grades 6 and 9); substitutions today: ${b.counts.subs}
     exams       ${b.counts.exams} (grades 6 and 9, Term 1)
     certs       ${b.counts.certs}
     admissions  ${admissions[b.spec.key]!.cycles} open cycle for ${b.years.next.name}, ${admissions[b.spec.key]!.slots} sittings, ${admissions[b.spec.key]!.applications} applications
     leave       ${b.counts.leave} requests (one pending, one approved); meetings ${b.counts.meetingSlots} slots, one booked by Sunita
     feed        ${b.counts.posts} posts, ${b.counts.comments} comments
     quizzes     ${b.counts.quizAttempts} new attempts, ${b.counts.quizResponses} responses, ${b.counts.badges} badges this run`;

  console.log(`
  Demo schools ready. Password for EVERY account below: ${PASSWORD}
${line(sunrise)}
${line(saraswati)}

  ── The cross-school parent ──────────────────────────────────────────
     ${SUNITA.email}   (${SUNITA.name}, ${SUNITA.phone})
     Aarav Deshmukh at Sunrise (grade 6, membership ${sunrise.deshmukh.membershipId})
     Anaya Deshmukh at Saraswati (grade 7, membership ${saraswati.deshmukh.membershipId})
     admission enquiry to Saraswati: /enquiries/${admissionEnquiries.enquiries[2]}; bell: ${bell.total} notifications

  ── Experts ──────────────────────────────────────────────────────────
     ${VIKRAM.email}   (${VIKRAM.name}) — ${experts.slots} slots; bookings /expert/bookings/${experts.bookings[0]} (Sunrise) and /expert/bookings/${experts.bookings[1]} (Saraswati); mentoring /mentoring/${experts.threadId} with ${experts.mentee.name}
     ${experts.anjali ? `${ANJALI_EMAIL} — careers talk at Saraswati, /expert/bookings/${experts.anjali.bookingId}` : `${ANJALI_EMAIL} — not in this database, skipped`}

  ── Vacancies and enquiries ──────────────────────────────────────────
     Sunrise "PGT Mathematics" ← ${saraswati.spare.user.email}: /enquiries/${vacancies.enquiries[0]}
     Saraswati "Primary English teacher" ← ${sunrise.spare.user.email}: /enquiries/${vacancies.enquiries[1]}
     admission enquiries: /enquiries/${admissionEnquiries.enquiries[0]} (at Sunrise), /enquiries/${admissionEnquiries.enquiries[1]} (at Saraswati)
     global post: /bulletin/${globalPost.postId}

  Roster written to ${docPath}

  ── Counts (compare two runs line for line) ──────────────────────────
${Object.entries(counts).map(([k, v]) => `     ${k.padEnd(22)} ${v}`).join("\n")}
`);
}

// owner-batch-item4a ─────────────────────────────────────────────────────────────────────────────────────────
/* -------------------------------------------------------------------------- */
/* Sunrise's bus, hostel and library (owner's batch of 27 October 2026, 4a)    */
/* -------------------------------------------------------------------------- */

/**
 * SUNRISE'S THREE CAMPUS MODULES, WITH A WORKING WEEK IN THEM. Sunrise has had
 * TRANSPORT, HOSTEL and LIBRARY on since 3 October, with a driver, a warden and
 * a librarian who had nothing to do. These builders write what a week of using
 * the modules leaves behind, in the shape the modules' own writers leave it
 * (src/lib/transport.ts, hostel.ts, library.ts, reading-room.ts, and
 * college-fees.ts raiseOnce for the two charges), from a spec per school
 * (CampusSpec; demo-college-stream.ts buildCampus is the model):
 *
 *   transport  two routes on one bus (Route 2 runs first, then Route 1, morning
 *              and evening), four stops each with the school gate last, the
 *              times rising along the morning and falling along the evening
 *              (QA-46); sunrise.driver01 drives and a new attendant,
 *              sunrise.attendant01, rides (an attendant is a DRIVER membership);
 *              twelve riders in all six classes; the driver's yes to the
 *              location sentence; every trip of the last six open days ENDED
 *              with the bus's track and the riders ticked on and off (one away
 *              now and then), and today's trips that are already over; one OPEN
 *              incident on Route 1; the Term 2 route fee raised for each rider
 *              under the Transport head (raisedKey ROUTE:<year>:<route>:term 2),
 *              by the office's own raiseRouteFees since owner-batch-item5.
 *   hostel     a boys' house (sunrise.warden) and a girls' house (a new warden,
 *              sunrise.warden2), two rooms each, ten boarders from grades 5 and
 *              10, the week's mess menu, both roll calls of the last seven days
 *              (and this morning's once it is past), one boarder out on home
 *              leave since yesterday (consented, approved, through the gate),
 *              one back from last weekend's, one ask waiting for the warden, a
 *              visitor yesterday, and this month's mess bill for every boarder
 *              under a Mess head (raisedKey MESS:<month>), by the office's own
 *              billMess since owner-batch-item5.
 *   library    the lending rules (₹2 a day overdue, counter dues), forty titles
 *              in English, Hindi, Marathi and Sanskrit (fourteen in Devanagari)
 *              with 66 copies, fifteen loans (eight out, four overdue, three
 *              back late with their fines: one due, one settled at the counter,
 *              one waived), two reservations (a copy held, a place in a queue),
 *              and the reading-room register.
 *
 * THE TWO CHARGES AT A SCHOOL. The product raises route and mess fees from a
 * college's accounts desk only (raiseRouteFees and billMess go through
 * collegeDesk, which refuses a school). The rows written here are the shape
 * raiseOnce writes — instalment-less, keyed, labelled in the school's language
 * — so the family's fee page and the office's dues read them as any extra
 * demand.
 *
 * IDEMPOTENT. Every row is found by a stable key (a name, an email, an
 * accession or card number, a trip's assignment-day-direction, a roll call's
 * house-day-slot, a demand's raisedKey) before it is made. The days are the
 * school's, counted back from today, so a run on a later day adds that day's
 * trips and roll calls and nothing else; two runs on one day print the same
 * counts. Rows a person made by hand (a trip a driver ended, a roll call a
 * warden took) are found and kept.
 */

type CampusStop = { name: string; lat: number; lng: number; morning: number; evening: number };
type CampusRoute = { name: string; note: string; feePerTermPaise: number; stops: CampusStop[]; riders: { email: string; stop: number }[] };
type CampusLeave = { pupil: string; kind: "HOME" | "LOCAL" | "MEDICAL"; destination: string; reason: string };
type CampusTitle = { title: string; author: string; publisher: string; year: number | null; subject: string; language: "EN" | "HI" | "MR" | "SA"; category: string; copies: number; periodical?: { frequency: string; from: string; until: string } };
type CampusLoan = { who: string; title: number; issuedAgo: number; returnedAgo?: number; fine?: "DUE" | "SETTLED" | "WAIVED" };
type CampusSpec = {
  transport: {
    driver: string;
    driverTitle: string;
    attendant: { email: string; name: string; title: string };
    bus: { registration: string; capacity: number; note: string };
    from: string;
    routes: CampusRoute[];
    term: { label: string; due: string };
    incident: { route: number; pupil: string; title: string; body: string; actionTaken: string; place: string; note: string };
  };
  hostel: {
    from: string;
    messMonthlyPaise: number;
    houses: { name: string; kind: "BOYS" | "GIRLS"; warden: { email: string; name: string; title: string }; rooms: { number: string; floor: string; beds: number; boarders: string[] }[] }[];
    menu: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, [breakfast: string, lunch: string, snacks: string, dinner: string]>;
    out: CampusLeave;
    returned: CampusLeave;
    ask: CampusLeave;
    visitor: { pupil: string; note: string };
  };
  library: {
    librarian: string;
    accessionPrefix: string;
    titles: CampusTitle[];
    loans: CampusLoan[];
    reservations: { who: string; title: number; placedAgo: number; ready: boolean }[];
    readingRoom: { who: string; openDaysAgo: number; inMinute: number; outMinute: number }[];
    waiveReason: string;
  };
};

const sp = (local: string) => `sunrise.${local}@${DOMAIN}`;

const SUNRISE_CAMPUS: CampusSpec = {
  transport: {
    driver: sp("driver01"),
    driverTitle: "Bus driver, routes 1 and 2",
    attendant: { email: sp("attendant01"), name: "Sakharam Jadhav", title: "Bus attendant, routes 1 and 2" },
    bus: { registration: "MH 12 SR 4521", capacity: 32, note: "The school's own bus; first aid box under the front seat." },
    from: "2026-06-15",
    routes: [
      // Each route's stops in the morning's order, the school gate last: the morning's minutes rise to the gate and the
      // evening's fall along the same list (the bus leaves the gate first in the evening), as saveRoute requires (QA-46).
      {
        name: "Route 1 — Aundh and Baner", note: "Aundh to the school; leaves the gate first in the evening.", feePerTermPaise: 4_500_00,
        stops: [
          { name: "Aundh, Parihar Chowk", lat: 18.55981, lng: 73.80771, morning: 7 * 60 + 35, evening: 15 * 60 + 5 },
          { name: "Aundh, ITI Road corner", lat: 18.55662, lng: 73.80152, morning: 7 * 60 + 43, evening: 14 * 60 + 57 },
          { name: "Baner, Pan Card Club Road", lat: 18.55371, lng: 73.79122, morning: 7 * 60 + 51, evening: 14 * 60 + 49 },
          { name: "Sunrise Public School gate, Baner Road", lat: 18.55902, lng: 73.78681, morning: 8 * 60, evening: 14 * 60 + 40 },
        ],
        riders: [{ email: `aarav.deshmukh@${DOMAIN}`, stop: 0 }, { email: sp("pupil11"), stop: 0 }, { email: sp("pupil17"), stop: 1 }, { email: sp("pupil25"), stop: 1 }, { email: sp("pupil33"), stop: 2 }, { email: sp("pupil41"), stop: 2 }],
      },
      {
        name: "Route 2 — Sus and Pashan", note: "Runs before Route 1 in the morning and after it in the evening.", feePerTermPaise: 5_200_00,
        stops: [
          { name: "Sus Gaon chowk", lat: 18.54463, lng: 73.75962, morning: 6 * 60 + 55, evening: 15 * 60 + 50 },
          { name: "Sus Road, Pashan", lat: 18.53792, lng: 73.77903, morning: 7 * 60 + 5, evening: 15 * 60 + 40 },
          { name: "Balewadi Phata", lat: 18.56261, lng: 73.78003, morning: 7 * 60 + 15, evening: 15 * 60 + 30 },
          { name: "Sunrise Public School gate, Baner Road", lat: 18.55902, lng: 73.78681, morning: 7 * 60 + 25, evening: 15 * 60 + 20 },
        ],
        riders: [{ email: sp("pupil07"), stop: 0 }, { email: sp("pupil12"), stop: 0 }, { email: sp("pupil18"), stop: 1 }, { email: sp("pupil26"), stop: 1 }, { email: sp("pupil34"), stop: 2 }, { email: sp("pupil42"), stop: 2 }],
      },
    ],
    term: { label: "Term 2", due: "2026-12-15" },
    incident: {
      route: 0, pupil: sp("pupil17"), title: "Knocked head on the bus window at the Aundh turn", place: "Bus MH 12 SR 4521, Route 1, near Aundh ITI Road",
      body: "The bus braked at the ITI Road turn and Rhea's head knocked the side window. No cut; a small swelling above the left ear.",
      actionTaken: "The attendant gave a cold pack on the bus; the office checked at arrival and Rhea went to class. Mother telephoned from the bus.",
      note: "The contractor will check the left-side window latch on Saturday; until then the attendant seats the younger pupils on the right.",
    },
  },
  hostel: {
    from: "2026-06-15",
    messMonthlyPaise: 3_200_00,
    houses: [
      { name: "Tilak House", kind: "BOYS", warden: { email: sp("warden"), name: "Prakash More", title: "Hostel warden, Tilak House" }, rooms: [{ number: "T-1", floor: "Ground", beds: 4, boarders: [sp("pupil01"), sp("pupil03"), sp("pupil05")] }, { number: "T-2", floor: "First", beds: 4, boarders: [sp("pupil45"), sp("pupil47")] }] },
      { name: "Savitribai House", kind: "GIRLS", warden: { email: sp("warden2"), name: "Sunanda Gokhale", title: "Hostel warden, Savitribai House" }, rooms: [{ number: "S-1", floor: "Ground", beds: 4, boarders: [sp("pupil02"), sp("pupil04"), sp("pupil06")] }, { number: "S-2", floor: "First", beds: 4, boarders: [sp("pupil44"), sp("pupil46")] }] },
    ],
    menu: {
      1: ["Poha, banana, milk", "Chapati, matki usal, rice, dal, salad", "Biscuits, milk or tea", "Chapati, aloo gobi, dal khichdi, buttermilk"],
      2: ["Upma, sprouts, milk", "Chapati, bhindi, rice, varan, koshimbir", "Bhel", "Chapati, paneer bhurji, jeera rice, dal"],
      3: ["Idli, sambar, milk", "Chapati, chole, rice, dal, salad", "Seasonal fruit", "Bhakri, pithla, rice, dal"],
      4: ["Sheera, milk", "Chapati, mixed vegetable, rice, dal, curd", "Sabudana khichdi", "Chapati, rajma, rice, salad"],
      5: ["Thalipeeth, curd, milk", "Chapati, chawli usal, rice, amti", "Biscuits, milk or tea", "Chapati, palak paneer, rice, dal"],
      6: ["Misal pav, milk", "Puri, batata bhaji, masale bhat", "Seasonal fruit", "Chapati, cabbage, dal khichdi"],
      7: ["Aloo paratha, curd, milk", "Chapati, paneer masala, rice, kheer", "Vada pav", "Chapati, dal fry, jeera rice, shrikhand"],
    },
    out: { pupil: sp("pupil05"), kind: "HOME", destination: "Home, Kothrud, Pune", reason: "A cousin's thread ceremony" },
    returned: { pupil: sp("pupil02"), kind: "HOME", destination: "Home, Wakad, Pune", reason: "Weekend at home" },
    ask: { pupil: sp("pupil04"), kind: "LOCAL", destination: "Dental clinic, Baner", reason: "Braces check-up" },
    visitor: { pupil: sp("pupil45"), note: "Brought warm clothes for the term." },
  },
  library: {
    librarian: sp("librarian"),
    accessionPrefix: "SPS",
    titles: [
      { title: "Malgudi Days", author: "R. K. Narayan", publisher: "Indian Thought Publications", year: 1943, subject: "English literature", language: "EN", category: "FICTION", copies: 3 },
      { title: "Swami and Friends", author: "R. K. Narayan", publisher: "Indian Thought Publications", year: 1935, subject: "English literature", language: "EN", category: "FICTION", copies: 2 },
      { title: "The Room on the Roof", author: "Ruskin Bond", publisher: "Penguin", year: 1956, subject: "English literature", language: "EN", category: "FICTION", copies: 2 },
      { title: "The Blue Umbrella", author: "Ruskin Bond", publisher: "Rupa", year: 1980, subject: "English literature", language: "EN", category: "CHILDREN", copies: 3 },
      { title: "Grandma's Bag of Stories", author: "Sudha Murty", publisher: "Puffin", year: 2012, subject: "English literature", language: "EN", category: "CHILDREN", copies: 3 },
      { title: "Wings of Fire", author: "A. P. J. Abdul Kalam, Arun Tiwari", publisher: "Universities Press", year: 1999, subject: "Biography", language: "EN", category: "NON_FICTION", copies: 3 },
      { title: "Ignited Minds", author: "A. P. J. Abdul Kalam", publisher: "Penguin", year: 2002, subject: "General", language: "EN", category: "NON_FICTION", copies: 1 },
      { title: "The Story of My Experiments with Truth", author: "M. K. Gandhi", publisher: "Navajivan", year: 1927, subject: "Biography", language: "EN", category: "NON_FICTION", copies: 2 },
      { title: "The Discovery of India", author: "Jawaharlal Nehru", publisher: "", year: 1946, subject: "History", language: "EN", category: "NON_FICTION", copies: 1 },
      { title: "Gitanjali", author: "Rabindranath Tagore", publisher: "", year: 1912, subject: "Poetry", language: "EN", category: "FICTION", copies: 1 },
      { title: "The Jungle Book", author: "Rudyard Kipling", publisher: "", year: 1894, subject: "English literature", language: "EN", category: "CHILDREN", copies: 2 },
      { title: "Treasure Island", author: "R. L. Stevenson", publisher: "", year: 1883, subject: "English literature", language: "EN", category: "FICTION", copies: 2 },
      { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", publisher: "", year: 1865, subject: "English literature", language: "EN", category: "CHILDREN", copies: 1 },
      { title: "Little Women", author: "Louisa May Alcott", publisher: "", year: 1868, subject: "English literature", language: "EN", category: "FICTION", copies: 1 },
      { title: "The Diary of a Young Girl", author: "Anne Frank", publisher: "", year: 1947, subject: "History", language: "EN", category: "NON_FICTION", copies: 2 },
      { title: "A Brief History of Time", author: "Stephen Hawking", publisher: "Bantam", year: 1988, subject: "Science", language: "EN", category: "NON_FICTION", copies: 1 },
      { title: "Make: Electronics", author: "Charles Platt", publisher: "Maker Media", year: 2009, subject: "Robotics", language: "EN", category: "NON_FICTION", copies: 1 },
      { title: "Tales from the Panchatantra", author: "Vishnu Sharma (retold)", publisher: "", year: null, subject: "Stories", language: "EN", category: "CHILDREN", copies: 2 },
      { title: "Oxford Advanced Learner's Dictionary", author: "A. S. Hornby", publisher: "Oxford University Press", year: null, subject: "English", language: "EN", category: "REFERENCE", copies: 2 },
      { title: "Oxford School Atlas", author: "", publisher: "Oxford University Press", year: null, subject: "Geography", language: "EN", category: "REFERENCE", copies: 2 },
      { title: "Mathematics, Class X", author: "NCERT", publisher: "NCERT", year: null, subject: "Mathematics", language: "EN", category: "TEXTBOOK", copies: 2 },
      { title: "Science, Class IX", author: "NCERT", publisher: "NCERT", year: null, subject: "Science", language: "EN", category: "TEXTBOOK", copies: 2 },
      { title: "Honeydew, English for Class VIII", author: "NCERT", publisher: "NCERT", year: null, subject: "English", language: "EN", category: "TEXTBOOK", copies: 2 },
      { title: "Our Pasts – III, History for Class VIII", author: "NCERT", publisher: "NCERT", year: null, subject: "Social Science", language: "EN", category: "TEXTBOOK", copies: 1 },
      { title: "Contemporary India – I, Geography for Class IX", author: "NCERT", publisher: "NCERT", year: null, subject: "Social Science", language: "EN", category: "TEXTBOOK", copies: 1 },
      { title: "Science Reporter", author: "CSIR-NIScPR", publisher: "CSIR-NIScPR", year: null, subject: "Science", language: "EN", category: "PERIODICAL", copies: 1, periodical: { frequency: "MONTHLY", from: "2026-04-01", until: "2027-03-31" } },
      { title: "गोदान", author: "प्रेमचंद", publisher: "", year: 1936, subject: "Hindi literature", language: "HI", category: "FICTION", copies: 2 },
      { title: "निर्मला", author: "प्रेमचंद", publisher: "", year: 1927, subject: "Hindi literature", language: "HI", category: "FICTION", copies: 1 },
      { title: "ईदगाह और अन्य कहानियाँ", author: "प्रेमचंद", publisher: "", year: null, subject: "Hindi literature", language: "HI", category: "CHILDREN", copies: 2 },
      { title: "मधुशाला", author: "हरिवंशराय बच्चन", publisher: "", year: 1935, subject: "Hindi poetry", language: "HI", category: "FICTION", copies: 1 },
      { title: "रश्मिरथी", author: "रामधारी सिंह 'दिनकर'", publisher: "", year: 1952, subject: "Hindi poetry", language: "HI", category: "FICTION", copies: 1 },
      { title: "वसंत भाग 3, कक्षा 8", author: "NCERT", publisher: "NCERT", year: null, subject: "Hindi", language: "HI", category: "TEXTBOOK", copies: 2 },
      { title: "श्यामची आई", author: "साने गुरुजी", publisher: "", year: 1935, subject: "Marathi literature", language: "MR", category: "FICTION", copies: 2 },
      { title: "ययाति", author: "वि. स. खांडेकर", publisher: "", year: 1959, subject: "Marathi literature", language: "MR", category: "FICTION", copies: 1 },
      { title: "बटाट्याची चाळ", author: "पु. ल. देशपांडे", publisher: "", year: 1958, subject: "Marathi literature", language: "MR", category: "FICTION", copies: 1 },
      { title: "व्यक्ती आणि वल्ली", author: "पु. ल. देशपांडे", publisher: "", year: 1944, subject: "Marathi literature", language: "MR", category: "FICTION", copies: 1 },
      { title: "मृत्युंजय", author: "शिवाजी सावंत", publisher: "", year: 1967, subject: "Marathi literature", language: "MR", category: "FICTION", copies: 2 },
      { title: "अग्निपंख", author: "ए. पी. जे. अब्दुल कलाम; अनुवाद माधुरी शानभाग", publisher: "", year: null, subject: "Biography", language: "MR", category: "NON_FICTION", copies: 1 },
      { title: "श्रीमद्भगवद्गीता", author: "वेदव्यास", publisher: "Gita Press", year: null, subject: "Sanskrit", language: "SA", category: "GENERAL", copies: 1 },
      { title: "रुचिरा भाग 1, कक्षा 6", author: "NCERT", publisher: "NCERT", year: null, subject: "Sanskrit", language: "SA", category: "TEXTBOOK", copies: 2 },
    ],
    // Titles by their place in the list above, 1-based; each loan takes the title's first copy. Pupils borrow for 14 days, staff for 30.
    loans: [
      { who: `aarav.deshmukh@${DOMAIN}`, title: 6, issuedAgo: 3 },
      { who: sp("pupil11"), title: 4, issuedAgo: 6 },
      { who: sp("pupil01"), title: 11, issuedAgo: 2 },
      { who: sp("pupil02"), title: 5, issuedAgo: 10 },
      { who: sp("pupil44"), title: 37, issuedAgo: 8 },
      { who: sp("pupil33"), title: 16, issuedAgo: 12 },
      { who: sp("teacher2"), title: 17, issuedAgo: 15 },
      { who: sp("pupil41"), title: 27, issuedAgo: 1 },
      // Overdue and still out.
      { who: sp("pupil17"), title: 12, issuedAgo: 20 },
      { who: sp("pupil25"), title: 33, issuedAgo: 17 },
      { who: sp("pupil45"), title: 1, issuedAgo: 25 },
      { who: sp("pupil34"), title: 15, issuedAgo: 16 },
      // Back late, each with its overdue fine.
      { who: sp("pupil18"), title: 2, issuedAgo: 40, returnedAgo: 21, fine: "DUE" },
      { who: sp("pupil26"), title: 14, issuedAgo: 35, returnedAgo: 18, fine: "SETTLED" },
      { who: sp("pupil42"), title: 7, issuedAgo: 30, returnedAgo: 12, fine: "WAIVED" },
    ],
    reservations: [
      // A Brief History of Time has one copy, out: a place in the queue.
      { who: sp("pupil12"), title: 16, placedAgo: 4, ready: false },
      // Alice's one copy came back and is held on the shelf for the first in its queue.
      { who: sp("pupil03"), title: 13, placedAgo: 6, ready: true },
    ],
    readingRoom: [
      { who: sp("pupil44"), openDaysAgo: 2, inMinute: 15 * 60 + 5, outMinute: 16 * 60 },
      { who: sp("pupil33"), openDaysAgo: 1, inMinute: 15 * 60, outMinute: 16 * 60 + 10 },
      { who: sp("pupil41"), openDaysAgo: 1, inMinute: 15 * 60 + 20, outMinute: 16 * 60 + 40 },
      { who: sp("teacher2"), openDaysAgo: 1, inMinute: 13 * 60, outMinute: 13 * 60 + 40 },
      { who: sp("pupil34"), openDaysAgo: 0, inMinute: 8 * 60 + 30, outMinute: 9 * 60 + 10 },
    ],
    waiveReason: "First late return this year; the book came back in good condition.",
  },
};

/** The school's clock: today, an instant on a day at a minute, and the open days before today. */
async function campusClock(schoolId: string) {
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  const tz = school.timezone;
  const today = todayKey(tz);
  const at = (dateKey: string, minute: number, second = 0) => new Date(zonedStartOfDay(dateKey, tz).getTime() + minute * 60_000 + second * 1000);
  const nowMinute = (Date.now() - zonedStartOfDay(today, tz).getTime()) / 60_000;
  const closed = await closedDays(schoolId);
  const isOpen = (k: string) => weekdayOfKey(k) !== 0 && !closed.has(k);
  /** The `n` most recent open days before today, oldest first. */
  const openDaysBefore = (n: number) => {
    const out: string[] = [];
    for (let back = 1; out.length < n && back < n * 5; back += 1) {
      const k = addDaysToKey(today, -back);
      if (isOpen(k)) out.push(k);
    }
    return out.reverse();
  };
  return { tz, today, at, nowMinute, isOpen, openDaysBefore };
}

async function memberByEmail(schoolId: string, email: string, role: string) {
  return db.membership.findFirst({ where: { schoolId, role, status: "ACTIVE", user: { email } }, select: { id: true, userId: true, user: { select: { name: true } } } });
}

// owner-batch-item5 (27 Oct 2026): the route fees and the mess bill are raised by the office's own functions
// (college-fees.ts raiseRouteFees and billMess, which a school's office may now call), not written here in their shape.
// The office acts through a session made for the call (userAgent "zz-walk") and deleted after it, as item 4b's actors.
const OFFICE_PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
async function asOffice<T>(b: Built, work: (ctx: ActiveContext) => Promise<T>): Promise<T> {
  const u = await db.user.findUniqueOrThrow({ where: { id: b.admin.user.id }, select: { id: true, name: true, email: true, isMinor: true, isSuperuser: true, isAppAdmin: true } });
  const session = await db.session.create({ data: { userId: u.id, tokenHash: `zz-walk-${randomBytes(24).toString("hex")}`, activeSchoolId: b.school.id, activeRole: "ADMIN", userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });
  try {
    const ctx = { sessionId: session.id, membershipId: b.admin.membership.id, schoolId: b.school.id, role: "ADMIN", user: { id: u.id, name: u.name, preferredName: null, email: u.email, avatarKey: null, isMinor: u.isMinor, isSuperuser: u.isSuperuser, isAppAdmin: u.isAppAdmin, prefs: OFFICE_PREFS } } as unknown as ActiveContext;
    return await work(ctx);
  } finally {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
  }
}
// owner-batch-item5 end

/* ---- transport ---- */

async function buildCampusTransport(ctx: Ctx, b: Built, spec: CampusSpec["transport"]) {
  const s = b.school.id;
  const clock = await campusClock(s);
  const driver = await memberByEmail(s, spec.driver, "DRIVER");
  if (!driver) throw new Error(`no DRIVER ${spec.driver} at ${b.school.name}`);
  await db.membership.update({ where: { id: driver.id }, data: { title: spec.driverTitle } });
  const attendantUser = await upsertUser(ctx, spec.attendant.email, spec.attendant.name);
  const attendant = await upsertMembership(attendantUser.id, s, "DRIVER", { title: spec.attendant.title });
  const adminUserId = b.admin.user.id;
  const head = await db.feeHead.findUniqueOrThrow({ where: { schoolId_code: { schoolId: s, code: "TRN" } }, select: { id: true, code: true, name: true } });
  // owner-batch-item5: the TRN head must be the office's Transport head for raiseRouteFees to charge under it.
  if (head.id !== (await db.feeHead.findFirst({ where: { schoolId: s, kind: "TRANSPORT", retiredAt: null }, orderBy: { sortOrder: "asc" }, select: { id: true } }))?.id) throw new Error(`TRN is not ${b.school.name}'s first Transport fee head`);

  const bus = await db.bus.upsert({ where: { schoolId_registration: { schoolId: s, registration: spec.bus.registration } }, create: { schoolId: s, ...spec.bus }, update: {}, select: { id: true } });
  // The driver has driven a week: their yes to the location sentence (transport.ts CONSENT_TEXT_KEY) is on record.
  await db.transportConsent.upsert({ where: { membershipId: driver.id }, create: { schoolId: s, membershipId: driver.id, textKey: "transport.consentBody", consentedAt: new Date(`${spec.from}T02:00:00Z`) }, update: {} });

  let trips = 0;
  let boardings = 0;
  let positions = 0;
  let charged = 0;
  const routes: { id: string; name: string; assignmentId: string }[] = [];
  for (const [ri, r] of spec.routes.entries()) {
    const routeData = { direction: "BOTH", active: true, note: r.note, kind: "FIXED", feePerTermPaise: r.feePerTermPaise };
    const route = (await db.transportRoute.findFirst({ where: { schoolId: s, name: r.name }, select: { id: true } })) ?? (await db.transportRoute.create({ data: { schoolId: s, name: r.name, ...routeData }, select: { id: true } }));
    const stops: { id: string; spec: CampusStop }[] = [];
    for (const [i, st] of r.stops.entries()) {
      const data = { name: st.name, lat: st.lat, lng: st.lng, morningMinute: st.morning, eveningMinute: st.evening, radiusM: 150 };
      const found = await db.transportStop.findFirst({ where: { routeId: route.id, order: i + 1 }, select: { id: true } });
      stops.push({ id: (found ?? (await db.transportStop.create({ data: { schoolId: s, routeId: route.id, order: i + 1, ...data }, select: { id: true } }))).id, spec: st });
    }
    const assignment =
      (await db.busAssignment.findFirst({ where: { schoolId: s, busId: bus.id, routeId: route.id, toDateKey: null }, select: { id: true } })) ??
      (await db.busAssignment.create({ data: { schoolId: s, busId: bus.id, routeId: route.id, driverMembershipId: driver.id, attendantMembershipId: attendant.id, fromDateKey: spec.from, createdByUserId: adminUserId }, select: { id: true } }));
    routes.push({ id: route.id, name: r.name, assignmentId: assignment.id });

    // The riders' seats, from the first day of term, with the transport head named.
    const seats: { id: string; studentMembershipId: string; stop: number }[] = [];
    for (const rider of r.riders) {
      const pupil = await memberByEmail(s, rider.email, "STUDENT");
      if (!pupil) throw new Error(`no pupil ${rider.email} at ${b.school.name}`);
      const seat =
        (await db.transportAllotment.findFirst({ where: { schoolId: s, studentMembershipId: pupil.id, routeId: route.id }, select: { id: true } })) ??
        (await db.transportAllotment.create({ data: { schoolId: s, studentMembershipId: pupil.id, routeId: route.id, stopId: stops[rider.stop]!.id, boards: true, alights: true, fromDateKey: spec.from, feeHeadId: head.id, createdByUserId: adminUserId }, select: { id: true } }));
      seats.push({ id: seat.id, studentMembershipId: pupil.id, stop: rider.stop });
    }

    // The week's trips, and today's that are already over: ENDED, the bus's track every twenty seconds, the riders ticked.
    const gate = stops.length - 1;
    const days = clock.openDaysBefore(6);
    const tripDays = clock.isOpen(clock.today) ? [...days, clock.today] : days;
    for (const [di, day] of tripDays.entries()) {
      for (const direction of ["MORNING", "EVENING"] as const) {
        const ordered = direction === "MORNING" ? stops : [...stops].reverse();
        const minuteOf = (st: CampusStop) => (direction === "MORNING" ? st.morning : st.evening);
        const start = minuteOf(ordered[0]!.spec) - 2;
        const end = minuteOf(ordered[ordered.length - 1]!.spec) + 3;
        if (day === clock.today && clock.nowMinute < end + 5) continue;
        const data = { status: "ENDED", startedAt: clock.at(day, start), startedByMembershipId: driver.id, startReason: null, endedAt: clock.at(day, end), endedByMembershipId: driver.id, lowBatteryAt: null, missedNotifiedAt: null };
        const found = await db.trip.findUnique({ where: { assignmentId_dateKey_direction: { assignmentId: assignment.id, dateKey: day, direction } }, select: { id: true, status: true } });
        // A trip made by a read (SCHEDULED) is the one that ran; one a driver ended by hand is kept as it is.
        const trip = found ?? (await db.trip.create({ data: { schoolId: s, assignmentId: assignment.id, dateKey: day, direction, ...data }, select: { id: true, status: true } }));
        if (found && found.status === "SCHEDULED") await db.trip.update({ where: { id: found.id }, data });
        trips += 1;
        if ((await db.tripPosition.count({ where: { tripId: trip.id } })) === 0) {
          const rows: { schoolId: string; tripId: string; at: Date; lat: number; lng: number; speed: number; accuracy: number }[] = [];
          const legs = [{ from: ordered[0]!.spec, to: ordered[0]!.spec, a: start, z: start + 2 }, ...ordered.slice(1).map((x, k) => ({ from: ordered[k]!.spec, to: x.spec, a: minuteOf(ordered[k]!.spec), z: minuteOf(x.spec) })), { from: ordered[ordered.length - 1]!.spec, to: ordered[ordered.length - 1]!.spec, a: end - 3, z: end }];
          for (const leg of legs) {
            const steps = Math.max(1, ((leg.z - leg.a) * 60) / 20);
            for (let k = 0; k < steps; k += 1) {
              const f = k / steps;
              rows.push({ schoolId: s, tripId: trip.id, at: clock.at(day, leg.a, k * 20), lat: leg.from.lat + (leg.to.lat - leg.from.lat) * f, lng: leg.from.lng + (leg.to.lng - leg.from.lng) * f, speed: leg.from === leg.to ? 0 : 7, accuracy: 10 + (k % 5) });
            }
          }
          positions += (await db.tripPosition.createMany({ data: rows, skipDuplicates: true })).count;
        }
        // A rider is away now and then (the same day both ways).
        const ticks = seats
          .filter((seat, si) => (si * 5 + di * 3 + ri) % 13 !== 0)
          .map((seat) => {
            const stopMinute = minuteOf(stops[seat.stop]!.spec);
            const gateMinute = minuteOf(stops[gate]!.spec);
            const on = direction === "MORNING" ? clock.at(day, stopMinute, 30) : clock.at(day, gateMinute, 40);
            const off = direction === "MORNING" ? clock.at(day, gateMinute, 50) : clock.at(day, stopMinute, 20);
            return { schoolId: s, tripId: trip.id, allotmentId: seat.id, boardedAt: on, alightedAt: off, markedByMembershipId: driver.id, nearNotifiedAt: direction === "MORNING" ? clock.at(day, stopMinute - 5) : null };
          });
        boardings += (await db.tripBoarding.createMany({ data: ticks, skipDuplicates: true })).count;
      }
    }
  }

  // owner-batch-item5: the term's route fee on every rider's ledger, raised by the office as a school's office raises it
  // (raiseRouteFees: each rider of a priced route once for the term, keyed ROUTE:<year>:<route>:<term>); a second run is "already".
  const fees = await asOffice(b, (office) => raiseRouteFees(office, { termLabel: spec.term.label, dueDateKey: spec.term.due }));
  charged = fees.raised;
  // end owner-batch-item5

  // One incident on Route 1, two open days ago, reported by the driver, still open with the office's note.
  const inc = spec.incident;
  const pupil = await memberByEmail(s, inc.pupil, "STUDENT");
  if (pupil && !(await db.incident.findFirst({ where: { schoolId: s, studentMembershipId: pupil.id, title: inc.title }, select: { id: true } }))) {
    const day = clock.openDaysBefore(2)[0]!;
    const when = clock.at(day, spec.routes[inc.route]!.stops[1]!.morning + 1);
    await db.incident.create({ data: { schoolId: s, studentMembershipId: pupil.id, reportedByMembershipId: driver.id, kind: "INJURY", severity: "MINOR", occurredAt: when, place: inc.place, title: inc.title, body: inc.body, actionTaken: inc.actionTaken, guardiansNotifiedAt: new Date(when.getTime() + 10 * 60_000), status: "OPEN", notes: { create: { schoolId: s, authorUserId: adminUserId, body: inc.note, createdAt: new Date(when.getTime() + 3 * 3_600_000) } } } });
  }
  return { routes, busId: bus.id, driverMembershipId: driver.id, attendantMembershipId: attendant.id, tripsWritten: trips, boardingsNew: boardings, positionsNew: positions, chargesNew: charged };
}

/* ---- hostel ---- */

async function buildCampusHostel(ctx: Ctx, b: Built, spec: CampusSpec["hostel"]) {
  const s = b.school.id;
  const clock = await campusClock(s);
  const adminUserId = b.admin.user.id;
  // The Mess fee head the office's mess bill charges under (billMess takes the school's first MESS head).
  await db.feeHead.upsert({ where: { schoolId_code: { schoolId: s, code: "MES" } }, create: { schoolId: s, code: "MES", name: "Mess", kind: "MESS", sortOrder: 4 }, update: {}, select: { id: true } });
  const parentOf = async (studentMembershipId: string) => (await db.guardianship.findFirst({ where: { studentMembershipId, status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { parent: { select: { id: true, name: true } } } }))?.parent ?? null;

  type Place = { allotmentId: string; membershipId: string; fromDate: string; hostelId: string };
  const places: Place[] = [];
  const wardens = new Map<string, string>();
  const month = clock.today.slice(0, 7);
  for (const house of spec.houses) {
    const wardenUser = await upsertUser(ctx, house.warden.email, house.warden.name);
    const warden = await upsertMembership(wardenUser.id, s, "WARDEN", { title: house.warden.title });
    await db.membership.update({ where: { id: warden.id }, data: { title: house.warden.title } });
    const capacity = house.rooms.reduce((a, r) => a + r.beds, 0);
    const hostel = await db.hostel.upsert({ where: { schoolId_name: { schoolId: s, name: house.name } }, create: { schoolId: s, name: house.name, kind: house.kind, wardenMembershipId: warden.id, capacity, messAttendance: false, messMonthlyPaise: spec.messMonthlyPaise }, update: { wardenMembershipId: warden.id }, select: { id: true } });
    wardens.set(hostel.id, wardenUser.id);
    for (const room of house.rooms) {
      const row = await db.hostelRoom.upsert({ where: { hostelId_number: { hostelId: hostel.id, number: room.number } }, create: { schoolId: s, hostelId: hostel.id, number: room.number, floor: room.floor, beds: room.beds, kind: "SHARED" }, update: {}, select: { id: true } });
      for (const [bi, email] of room.boarders.entries()) {
        const pupil = await memberByEmail(s, email, "STUDENT");
        if (!pupil) throw new Error(`no pupil ${email} at ${b.school.name}`);
        const live = await db.hostelAllotment.findFirst({ where: { schoolId: s, membershipId: pupil.id, status: "ACTIVE" }, select: { id: true, fromDate: true, room: { select: { hostelId: true } } } });
        const place = live ?? (await db.hostelAllotment.create({ data: { schoolId: s, membershipId: pupil.id, roomId: row.id, bed: bi + 1, fromDate: spec.from, status: "ACTIVE", activePupilKey: pupil.id, activeBedKey: `${row.id}:${bi + 1}`, allottedByUserId: adminUserId }, select: { id: true, fromDate: true, room: { select: { hostelId: true } } } }));
        places.push({ allotmentId: place.id, membershipId: pupil.id, fromDate: place.fromDate, hostelId: place.room.hostelId });
      }
    }
    // The week's menu: a row per weekday and meal (an edit the warden made is kept).
    for (const [weekday, meals] of Object.entries(spec.menu)) {
      for (const [mi, meal] of (["BREAKFAST", "LUNCH", "SNACKS", "DINNER"] as const).entries()) {
        await db.messMenu.upsert({ where: { hostelId_weekday_meal: { hostelId: hostel.id, weekday: Number(weekday), meal } }, create: { schoolId: s, hostelId: hostel.id, weekday: Number(weekday), meal, items: meals[mi]! }, update: {} });
      }
    }
  }

  // owner-batch-item5: this month's mess bill on every boarder's ledger, by the office as a school's office bills it
  // (billMess: each boarder with a bed in the month once, at the house's charge, keyed MESS:<month>); a second run is "already".
  const { billed } = await asOffice(b, (office) => billMess(office, { month }));
  // end owner-batch-item5

  // Leave: one out since yesterday (consented, approved, through the gate), one back from last weekend, one ask waiting.
  const placeOf = async (email: string) => {
    const pupil = await memberByEmail(s, email, "STUDENT");
    const place = pupil ? places.find((p) => p.membershipId === pupil.id) : undefined;
    if (!pupil || !place) throw new Error(`${email} is not a boarder`);
    return { pupil, place, parent: await parentOf(pupil.id) };
  };
  const leave = async (l: CampusLeave, times: { fromAt: Date; toAt: Date }, state: { status: string; consentAt: Date | null; decidedAt: Date | null; outAt: Date | null; inAt: Date | null }, refresh: boolean) => {
    const { pupil, place, parent } = await placeOf(l.pupil);
    const warden = wardens.get(place.hostelId)!;
    const data = {
      ...times, status: state.status, requestedByUserId: parent?.id ?? warden, consentAt: state.consentAt, consentUserId: state.consentAt ? (parent?.id ?? null) : null,
      decidedAt: state.decidedAt, decidedByUserId: state.decidedAt ? warden : null, decisionNote: null,
      outAt: state.outAt, outByUserId: state.outAt ? warden : null, inAt: state.inAt, inByUserId: state.inAt ? warden : null, late: false,
    };
    const found = await db.hostelLeave.findFirst({ where: { schoolId: s, allotmentId: place.allotmentId, destination: l.destination, reason: l.reason }, select: { id: true, status: true, inAt: true } });
    if (!found) return db.hostelLeave.create({ data: { schoolId: s, allotmentId: place.allotmentId, membershipId: pupil.id, kind: l.kind, destination: l.destination, reason: l.reason, ...data }, select: { id: true } });
    // The leave that is happening now, and the ask still waiting, follow today; one the warden has since closed (back in, decided) is kept.
    if (refresh && found.inAt === null && (found.status === "APPROVED" || found.status === "PENDING")) await db.hostelLeave.update({ where: { id: found.id }, data: { ...times, consentAt: data.consentAt, decidedAt: data.decidedAt, outAt: data.outAt } });
    return found;
  };
  const yesterday = addDaysToKey(clock.today, -1);
  const tomorrow = addDaysToKey(clock.today, 1);
  await leave(spec.out, { fromAt: clock.at(yesterday, 17 * 60), toAt: clock.at(tomorrow, 18 * 60) }, { status: "APPROVED", consentAt: clock.at(addDaysToKey(clock.today, -2), 9 * 60), decidedAt: clock.at(addDaysToKey(clock.today, -2), 11 * 60), outAt: clock.at(yesterday, 17 * 60 + 5), inAt: null }, true);
  // Last weekend: the Saturday at least two days back.
  let saturday = addDaysToKey(clock.today, -2);
  while (weekdayOfKey(saturday) !== 6) saturday = addDaysToKey(saturday, -1);
  const sunday = addDaysToKey(saturday, 1);
  await leave(spec.returned, { fromAt: clock.at(saturday, 16 * 60), toAt: clock.at(sunday, 18 * 60) }, { status: "APPROVED", consentAt: clock.at(addDaysToKey(saturday, -2), 20 * 60), decidedAt: clock.at(addDaysToKey(saturday, -1), 10 * 60), outAt: clock.at(saturday, 16 * 60 + 5), inAt: clock.at(sunday, 17 * 60 + 40) }, false);
  let nextSaturday = tomorrow;
  while (weekdayOfKey(nextSaturday) !== 6) nextSaturday = addDaysToKey(nextSaturday, 1);
  // A guardian's own ask is their consent: it waits for the warden (PENDING).
  await leave(spec.ask, { fromAt: clock.at(nextSaturday, 10 * 60), toAt: clock.at(nextSaturday, 16 * 60) }, { status: "PENDING", consentAt: clock.at(yesterday, 20 * 60), decidedAt: null, outAt: null, inAt: null }, true);

  // The roll calls: both slots of the last seven days, and this morning's once it is past. A boarder out through the gate is ON_LEAVE.
  const leaves = await db.hostelLeave.findMany({ where: { schoolId: s, status: "APPROVED", outAt: { not: null } }, select: { allotmentId: true, outAt: true, inAt: true } });
  const away = (allotmentId: string, at: Date) => leaves.some((l) => l.allotmentId === allotmentId && l.outAt! <= at && (l.inAt === null || l.inAt > at));
  let calls = 0;
  for (let back = 7; back >= 0; back -= 1) {
    const day = addDaysToKey(clock.today, -back);
    for (const [slot, minute] of [["MORNING", 6 * 60 + 50], ["NIGHT", 21 * 60 + 30]] as const) {
      if (back === 0 && (slot === "NIGHT" || clock.nowMinute < minute + 10)) continue;
      for (const [hostelId, wardenUserId] of wardens) {
        const takenAt = clock.at(day, minute);
        const call = (await db.hostelRollCall.findUnique({ where: { hostelId_dateKey_slot: { hostelId, dateKey: day, slot } }, select: { id: true } })) ?? (await db.hostelRollCall.create({ data: { schoolId: s, hostelId, dateKey: day, slot, takenByUserId: wardenUserId, takenAt, clientId: `demo-roll-${hostelId}-${day}-${slot}` }, select: { id: true } }));
        const here = places.filter((p) => p.hostelId === hostelId && p.fromDate <= day);
        await db.hostelRollCallEntry.createMany({ data: here.map((p) => ({ schoolId: s, rollCallId: call.id, allotmentId: p.allotmentId, membershipId: p.membershipId, status: away(p.allotmentId, takenAt) ? "ON_LEAVE" : "PRESENT" })), skipDuplicates: true });
        calls += 1;
      }
    }
  }

  // The visitor book: a parent yesterday afternoon, signed in and out.
  const v = await placeOf(spec.visitor.pupil);
  const visitorName = v.parent?.name ?? "Guardian";
  if (!(await db.hostelVisitor.findFirst({ where: { schoolId: s, allotmentId: v.place.allotmentId, name: visitorName }, select: { id: true } }))) {
    await db.hostelVisitor.create({ data: { schoolId: s, allotmentId: v.place.allotmentId, name: visitorName, relation: "parent", note: spec.visitor.note, inAt: clock.at(yesterday, 16 * 60 + 30), outAt: clock.at(yesterday, 17 * 60 + 45), allowedByUserId: wardens.get(v.place.hostelId)! } });
  }
  return { houses: spec.houses.length, boarders: places.length, rollCalls: calls, messBilledNew: billed, month };
}

/* ---- library ---- */

async function buildCampusLibrary(b: Built, spec: CampusSpec["library"]) {
  const s = b.school.id;
  const clock = await campusClock(s);
  const librarian = await memberByEmail(s, spec.librarian, "LIBRARIAN");
  if (!librarian) throw new Error(`no LIBRARIAN ${spec.librarian} at ${b.school.name}`);
  const settings = await db.librarySettings.upsert({ where: { schoolId: s }, create: { schoolId: s, pupilLimit: 2, pupilLoanDays: 14, staffLimit: 5, staffLoanDays: 30, maxRenewals: 2, finePerDayPaise: 200, fineHeadId: null, updatedByUserId: b.admin.user.id }, update: {}, select: { pupilLoanDays: true, staffLoanDays: true, finePerDayPaise: true } });
  const rack: Record<string, string> = { FICTION: "A", CHILDREN: "B", NON_FICTION: "C", REFERENCE: "R", TEXTBOOK: "T", PERIODICAL: "P", GENERAL: "G" };
  const shelf: Record<string, string> = { EN: "1", HI: "2", MR: "3", SA: "4" };
  const titleIds: string[] = [];
  const firstCopy: string[] = [];
  let accession = 0;
  for (const t of spec.titles) {
    const data = { isbn: null, title: t.title, author: t.author, publisher: t.publisher, year: t.year, subject: t.subject, language: t.language, category: t.category, frequency: t.periodical?.frequency ?? null, subscriptionFrom: t.periodical?.from ?? null, subscriptionUntil: t.periodical?.until ?? null };
    const title = (await db.libraryTitle.findFirst({ where: { schoolId: s, title: t.title, author: t.author }, select: { id: true } })) ?? (await db.libraryTitle.create({ data: { schoolId: s, ...data }, select: { id: true } }));
    titleIds.push(title.id);
    for (let c = 0; c < t.copies; c += 1) {
      accession += 1;
      const acc = `${spec.accessionPrefix}-${String(accession).padStart(4, "0")}`;
      const copy = await db.libraryCopy.upsert({ where: { schoolId_accession: { schoolId: s, accession: acc } }, create: { schoolId: s, titleId: title.id, accession: acc, rack: `${rack[t.category] ?? "G"}${shelf[t.language] ?? "1"}` }, update: {}, select: { id: true } });
      if (c === 0) firstCopy.push(copy.id);
    }
  }

  // The members, carded in a fixed order (L00001…), so a second run finds every card.
  const people = [...new Set([...spec.loans.map((l) => l.who), ...spec.reservations.map((r) => r.who), ...spec.readingRoom.map((r) => r.who)])];
  const members = new Map<string, { memberId: string; membershipId: string; staff: boolean }>();
  for (const [i, email] of people.entries()) {
    const m = (await memberByEmail(s, email, "STUDENT")) ?? (await memberByEmail(s, email, "TEACHER"));
    if (!m) throw new Error(`no pupil or teacher ${email} at ${b.school.name}`);
    const staff = !(await memberByEmail(s, email, "STUDENT"));
    const row = await db.libraryMember.upsert({ where: { membershipId: m.id }, create: { schoolId: s, membershipId: m.id, kind: staff ? "STAFF" : "PUPIL", cardNumber: `L${String(i + 1).padStart(5, "0")}` }, update: {}, select: { id: true } });
    members.set(email, { memberId: row.id, membershipId: m.id, staff });
  }

  // The loans: a book out is ISSUED; one back late carries its overdue fine, due, settled at the counter or waived.
  let fines = 0;
  for (const l of spec.loans) {
    const member = members.get(l.who)!;
    const copyId = firstCopy[l.title - 1]!;
    const issuedOn = addDaysToKey(clock.today, -l.issuedAgo);
    const dueOn = addDaysToKey(issuedOn, member.staff ? settings.staffLoanDays : settings.pupilLoanDays);
    let issue = await db.libraryIssue.findFirst({ where: { schoolId: s, copyId, memberId: member.memberId }, select: { id: true, dueOn: true, returnedAt: true } });
    if (!issue) {
      const returnedAt = l.returnedAgo === undefined ? null : clock.at(addDaysToKey(clock.today, -l.returnedAgo), 11 * 60);
      issue = await db.libraryIssue.create({ data: { schoolId: s, copyId, memberId: member.memberId, issuedAt: clock.at(issuedOn, 11 * 60 + 15), dueOn, returnedAt, issuedByUserId: librarian.userId, returnedByUserId: returnedAt ? librarian.userId : null }, select: { id: true, dueOn: true, returnedAt: true } });
      if (!returnedAt) await db.libraryCopy.update({ where: { id: copyId }, data: { status: "ISSUED" } });
    }
    if (l.fine && issue.returnedAt && l.returnedAgo !== undefined) {
      // The return's own rule (library.ts overdueFine): whole days from the due day to the day it came back.
      const back = addDaysToKey(clock.today, -l.returnedAgo);
      const [dy, dm, dd] = issue.dueOn.split("-").map(Number) as [number, number, number];
      const [ry, rm, rd] = back.split("-").map(Number) as [number, number, number];
      const lateDays = Math.max(0, Math.round((Date.UTC(ry, rm - 1, rd) - Date.UTC(dy, dm - 1, dd)) / DAY));
      const returnedOn = issue.returnedAt;
      const settled = l.fine === "SETTLED" ? { settledAt: new Date(returnedOn.getTime() + DAY), settledByUserId: b.admin.user.id } : {};
      const waived = l.fine === "WAIVED" ? { waivedAt: new Date(returnedOn.getTime() + DAY), waivedByUserId: librarian.userId, waivedReason: spec.waiveReason } : {};
      await db.libraryFine.upsert({ where: { issueId_reason: { issueId: issue.id, reason: "OVERDUE" } }, create: { schoolId: s, issueId: issue.id, memberId: member.memberId, paise: lateDays * settings.finePerDayPaise, reason: "OVERDUE", raisedByUserId: librarian.userId, createdAt: returnedOn, ...settled, ...waived }, update: {} });
      fines += 1;
    }
  }

  // The queue: one place waiting behind a loan, one copy back on the shelf and held for the first in line.
  for (const r of spec.reservations) {
    const member = members.get(r.who)!;
    const titleId = titleIds[r.title - 1]!;
    if (await db.libraryReservation.findFirst({ where: { schoolId: s, titleId, memberId: member.memberId, fulfilledAt: null, cancelledAt: null }, select: { id: true } })) continue;
    const placedAt = clock.at(addDaysToKey(clock.today, -r.placedAgo), 13 * 60);
    const pupilUser = await db.membership.findUniqueOrThrow({ where: { id: member.membershipId }, select: { userId: true } });
    await db.libraryReservation.create({ data: { schoolId: s, titleId, memberId: member.memberId, placedAt, placedByUserId: pupilUser.userId, readyAt: r.ready ? clock.at(addDaysToKey(clock.today, -1), 12 * 60) : null, readyCopyId: r.ready ? firstCopy[r.title - 1]! : null } });
  }

  // The reading-room register: the last open days', and this morning's once it is over.
  let visits = 0;
  const openDays = clock.openDaysBefore(3);
  for (const v of spec.readingRoom) {
    const day = v.openDaysAgo === 0 ? clock.today : openDays[openDays.length - v.openDaysAgo]!;
    if (v.openDaysAgo === 0 && (!clock.isOpen(clock.today) || clock.nowMinute < v.outMinute + 5)) continue;
    const member = members.get(v.who)!;
    if (!(await db.readingRoomVisit.findFirst({ where: { schoolId: s, membershipId: member.membershipId, dayKey: day }, select: { id: true } }))) {
      await db.readingRoomVisit.create({ data: { schoolId: s, membershipId: member.membershipId, dayKey: day, inAt: clock.at(day, v.inMinute), outAt: clock.at(day, v.outMinute), inByUserId: librarian.userId, outByUserId: librarian.userId } });
    }
    visits += 1;
  }
  return { titles: titleIds.length, copies: accession, members: members.size, loans: spec.loans.length, fines, visits };
}

/** The roster's workflow rows for the three modules (rosterMarkdown's table), from the spec. */
function campusRosterRows(spec: CampusSpec): string {
  const local = (email: string) => email.replace(`@${DOMAIN}`, "");
  const riders = spec.transport.routes.map((r) => `${r.name.split(" — ")[0]}: ${r.riders.map((x) => local(x.email)).join(", ")}`).join("; ");
  const houses = spec.hostel.houses.map((h) => `${h.name} (${h.kind === "BOYS" ? "boys" : "girls"}, ${local(h.warden.email)}): ${h.rooms.flatMap((r) => r.boarders.map(local)).join(", ")}`).join("; ");
  const devanagari = spec.library.titles.filter((t) => t.language !== "EN").length;
  return [
    `| Sunrise transport: ${spec.transport.routes.length} routes with ${spec.transport.routes.reduce((a, r) => a + r.stops.length, 0)} stops on ${spec.transport.bus.registration} (${local(spec.transport.driver)} driving, ${local(spec.transport.attendant.email)} attending), 12 riders (${riders}), the last six open days' trips ended with the bus's track and the ticks, today's once over, the driver's location consent, an OPEN incident on Route 1, the ${spec.transport.term.label} route fee raised per rider by the office's own route fees | /admin/transport, /admin/transport/trips/<id>, /driver, /parent/transport (as a rider's parent), /student/transport (as a rider), /admin/incidents, /parent/fees |`,
    `| Sunrise hostel: ${houses}; the week's menu, both roll calls of the last seven days, one boarder out on home leave (${local(spec.hostel.out.pupil)}), one back from last weekend, one ask waiting (${local(spec.hostel.ask.pupil)}), a visitor yesterday, this month's mess bill per boarder by the office's own mess bill | /admin/hostel, /hostel, /hostel/rollcall, /hostel/leave, /hostel/night, /hostel/visitors, /hostel/menu, /student/hostel, /parent/hostel, /parent/fees |`,
    `| Sunrise library: ${spec.library.titles.length} titles (${devanagari} in Devanagari: Hindi, Marathi, Sanskrit), ${spec.library.loans.length} loans (four overdue, three back late with a fine due, settled and waived), two reservations (one copy held), the reading-room register; ${local(spec.library.librarian)} at the desk | /library, /library/catalogue, /library/overdue, /library/reservations, /library/fines, /library/reading-room, /student/library, /parent/library, /teacher/library (as ${local(spec.library.loans.find((l) => l.who.includes("teacher"))?.who ?? spec.library.librarian)}) |`,
  ].join("\n");
}

/** The three, for one school, and the counts two runs are compared by. */
async function buildCampusModules(ctx: Ctx, b: Built, spec: CampusSpec) {
  const transport = await buildCampusTransport(ctx, b, spec.transport);
  const hostel = await buildCampusHostel(ctx, b, spec.hostel);
  const library = await buildCampusLibrary(b, spec.library);
  const s = { schoolId: b.school.id };
  const clock = await campusClock(b.school.id);
  const counts = {
    transportRoutes: await db.transportRoute.count({ where: s }),
    transportStops: await db.transportStop.count({ where: s }),
    buses: await db.bus.count({ where: s }),
    busAssignments: await db.busAssignment.count({ where: s }),
    transportSeats: await db.transportAllotment.count({ where: s }),
    tripsBeforeToday: await db.trip.count({ where: { ...s, dateKey: { lt: clock.today } } }),
    boardingsBeforeToday: await db.tripBoarding.count({ where: { ...s, trip: { dateKey: { lt: clock.today } } } }),
    positionsBeforeToday: await db.tripPosition.count({ where: { ...s, trip: { dateKey: { lt: clock.today } } } }),
    routeFeeDemands: await db.feeDemand.count({ where: { ...s, raisedKey: { startsWith: "ROUTE:" } } }),
    hostels: await db.hostel.count({ where: s }),
    hostelRooms: await db.hostelRoom.count({ where: s }),
    boarders: await db.hostelAllotment.count({ where: { ...s, status: "ACTIVE" } }),
    rollCallsBeforeToday: await db.hostelRollCall.count({ where: { ...s, dateKey: { lt: clock.today } } }),
    rollCallEntriesBeforeToday: await db.hostelRollCallEntry.count({ where: { ...s, rollCall: { dateKey: { lt: clock.today } } } }),
    hostelLeave: await db.hostelLeave.count({ where: s }),
    messMenu: await db.messMenu.count({ where: s }),
    hostelVisitors: await db.hostelVisitor.count({ where: s }),
    messDemands: await db.feeDemand.count({ where: { ...s, raisedKey: { startsWith: "MESS:" } } }),
    libraryTitles: await db.libraryTitle.count({ where: s }),
    libraryCopies: await db.libraryCopy.count({ where: s }),
    libraryMembers: await db.libraryMember.count({ where: s }),
    libraryLoans: await db.libraryIssue.count({ where: s }),
    libraryOut: await db.libraryIssue.count({ where: { ...s, returnedAt: null } }),
    libraryOverdue: await db.libraryIssue.count({ where: { ...s, returnedAt: null, dueOn: { lt: clock.today } } }),
    libraryFines: await db.libraryFine.count({ where: s }),
    libraryReservations: await db.libraryReservation.count({ where: { ...s, fulfilledAt: null, cancelledAt: null } }),
    readingRoomVisits: await db.readingRoomVisit.count({ where: s }),
    incidents: await db.incident.count({ where: s }),
  };
  // The roster: what each module role and the two new accounts open, and whose families to sign in as.
  const riders = spec.transport.routes.flatMap((r) => r.riders.map((x) => x.email.replace(`@${DOMAIN}`, "")));
  const boarders = spec.hostel.houses.flatMap((h) => h.rooms.flatMap((r) => r.boarders.map((x) => x.replace(`@${DOMAIN}`, ""))));
  const look: Record<string, string> = {
    [spec.transport.driver]: `/driver (${spec.transport.routes.length} routes on ${spec.transport.bus.registration}: Route 2 then Route 1, morning and evening; the week's trips ended, today's still to run until their time); riders ${riders.join(", ")}`,
    [spec.library.librarian]: `/library, /library/catalogue (${library.titles} titles, ${library.copies} copies, ${spec.library.titles.filter((t) => t.language !== "EN").length} in Devanagari), /library/overdue (four overdue), /library/reservations (one held, one queued), /library/fines (due, settled, waived), /library/reading-room`,
    [spec.hostel.houses[0]!.warden.email]: `/hostel, /hostel/rollcall, /hostel/leave (one out, one asking), /hostel/rooms, /hostel/visitors, /hostel/menu — ${spec.hostel.houses[0]!.name}; boarders ${boarders.join(", ")}`,
  };
  for (const row of b.moduleStaff ?? []) if (look[row.email]) row.look = look[row.email]!;
  b.moduleStaff?.push(
    { email: spec.transport.attendant.email, name: spec.transport.attendant.name, role: "Driver (bus attendant)", look: "/driver (rides both routes as the attendant)" },
    { email: spec.hostel.houses[1]!.warden.email, name: spec.hostel.houses[1]!.warden.name, role: "Warden", look: `/hostel — ${spec.hostel.houses[1]!.name}` },
  );
  console.log(`\n  ── ${b.school.name}: bus, hostel and library (owner-batch-item4a) ──\n     this run  ${transport.tripsWritten} trips written or found (${transport.positionsNew} new positions, ${transport.boardingsNew} new ticks), ${transport.chargesNew} route fees raised; ${hostel.rollCalls} roll calls, ${hostel.messBilledNew} mess bills raised for ${hostel.month}; ${library.loans} loans, ${library.fines} fines, ${library.visits} reading-room visits\n${Object.entries(counts).map(([k, v]) => `     ${k.padEnd(28)} ${v}`).join("\n")}`);
  return { transport, hostel, library, counts };
}
// owner-batch-item4a end ─────────────────────────────────────────────────────────────────────────────────────

// Only when run as a script: `demo-college.ts` imports PASSWORD and must not build the schools as a side effect of the import.
if (process.argv[1]?.endsWith("demo-schools.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
