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
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { classCode, studentCode } from "../src/lib/codes";
import { bandFor, combineTerms, DEFAULT_REPORT_CARD_CONFIG, meanPercent, meanPoints, shownPercent } from "../src/lib/report-card-rules";
import {
  attachTeacher, buildAdmissions, buildCertificates, buildCircular, buildCompetitionEntry, buildDepartures, buildExams, buildFeeAdjustments, buildFees, buildHealth, buildHolidays, buildIncidents,
  buildInvite, buildMessaging, buildPracticeAssignment, buildRemarkThread, buildReport, buildRollNumbers, buildStaffAttendance, buildStaffRecords, buildSubstitutions, buildSyllabus, buildTimetable,
  CALENDAR_2025_26, CALENDAR_2026_27, CLASS_COLOURS, closedDays, db, enrol, link, setTag, staffDates, teachingDaysBetween, THIS_YEAR, upsertClass, upsertMembership, upsertSchool, upsertUser, type Ctx, fakePen, refuseUnlessLocal } from "./zz-fixtures";

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
    { title: en ? "Welcome back after the Ganesh festival" : "गणेशोत्सवानंतर पुन्हा स्वागत", body: en ? "School reopens on Monday. The half-yearly timetable is on the notice board and on Relay. Please check the bus timings; two routes have changed." : "सोमवारी शाळा पुन्हा सुरू. सहामाही वेळापत्रक सूचना फलकावर आणि Relay वर आहे. बसच्या वेळा तपासा; दोन मार्ग बदलले आहेत.", scope: "SCHOOL", category: "UPDATES", tags: ["reopening", "timetable"], author: b.principal, daysAgo: 5 },
    { title: en ? "Science exhibition: entries open till the 30th" : "विज्ञान प्रदर्शन: ३० तारखेपर्यंत नोंदणी", body: en ? "Grades 6 to 10 may enter a working model or a poster. Teams of up to three. Hand the entry slip to your class teacher; the robotics workshop next week is a good place to start." : "इयत्ता ६ ते १० चे विद्यार्थी कार्यरत मॉडेल किंवा पोस्टर सादर करू शकतात. तीन जणांपर्यंत गट. नोंदणी चिठ्ठी वर्गशिक्षकांकडे द्या; पुढील आठवड्यातील रोबोटिक्स कार्यशाळा सुरुवात करण्यास चांगली.", scope: "SCHOOL", category: "LEARNING", tags: ["science", "exhibition", "robotics"], author: b.formTeachers[1]!, daysAgo: 4 },
    { title: en ? "Library open till 6 pm from this week" : "ग्रंथालय या आठवड्यापासून सायंकाळी ६ पर्यंत खुले", body: en ? "The library stays open till 6 pm on weekdays for pupils of grades 8 to 10. Bring your library card; two books at a time." : "इयत्ता ८ ते १० च्या विद्यार्थ्यांसाठी ग्रंथालय आठवड्याच्या दिवशी सायंकाळी ६ पर्यंत खुले. ग्रंथालय कार्ड आणा; एकावेळी दोन पुस्तके.", scope: "SCHOOL", category: "CAMPUS", tags: ["library"], author: b.admin, daysAgo: 3 },
    { title: en ? "Grade 6: geometry box on Monday" : "इयत्ता ६: सोमवारी भूमिती पेटी आणा", body: en ? "We start constructions on Monday. Everyone brings a compass, a protractor and a sharp pencil. The worksheet is on Relay under Practice." : "सोमवारपासून रचना सुरू. प्रत्येकाने कंपास, कोनमापक आणि टोकदार पेन्सिल आणावी. सराव पत्रक Relay वर 'सराव' मध्ये आहे.", scope: "CLASS", classId: g6.id, category: "LEARNING", tags: ["mathematics", "grade-6"], author: g6.teacher, daysAgo: 2 },
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
  const post = await upsertPost(sunrise.school.id, sunrise.school.name, { title: "Pune inter-school robotics meet — entries from any school", body: "Sunrise hosts a one-day robotics meet on 14 November for grades 7 to 10. Line-follower and sumo categories, kits available on loan. Teams from any school on Relay are welcome; write to the office through Enquiries.", scope: "GLOBAL", category: "EVENTS", tags: ["robotics", "inter-school", "pune"], author: sunrise.admin, daysAgo: 2 });
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
  const e1 = await ask(sunrise, saraswati.parents[1]!.userId, "We are moving to Pune next summer. Is there a seat in grade 7 for 2027–28, and is the entrance test only for grades 5 and 6?", "Welcome. Grade 7 admission is on the previous school's report and an interview; the written test is for grades 5 and 6 only. The 2027–28 cycle opens on Relay in January — please apply there and we will call you. — Meenal Joshi, office", sunrise.admin);
  const e2 = await ask(saraswati, sunrise.parents[2]!.userId, "आमचा मुलगा सध्या इंग्रजी माध्यमात इयत्ता ५ मध्ये आहे. मराठी माध्यमात इयत्ता ६ साठी प्रवेश शक्य आहे का?", "नक्कीच. इयत्ता ६ साठी प्रवेश परीक्षा जानेवारीत आहे; मराठी वाचन-लेखनाची छोटी चाचणी असते. Relay वरून अर्ज करा. — सुनील वाघ, कार्यालय", saraswati.admin);
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
  };
  return c;
}

/* -------------------------------------------------------------------------- */
/* the roster document                                                         */
/* -------------------------------------------------------------------------- */

function rosterMarkdown(input: { sunrise: Built; saraswati: Built; sunita: { id: string }; expert: { threadId: string; bookings: string[]; mentee: { name: string; grade: string }; anjali: { bookingId: string } | null }; vacancies: { enquiries: string[] }; admissionEnquiries: { enquiries: string[] }; circulars: Record<string, string>; globalPostId: string }): string {
  const { sunrise, saraswati } = input;
  const staffRows = (b: Built) => {
    const rows = [
      [b.admin.user.email, b.admin.user.name, "Admin", `/admin, /admin/people, /admin/fees, /admin/admissions, /admin/certificates, /admin/filings, /admin/messaging, /admin/vacancies, /enquiries`],
      [b.principal.user.email, b.principal.user.name, "Principal", `/principal, /principal/staff, /principal/leave (one pending ask), /enquiries (the vacancy applicant)`],
      ...b.formTeachers.map((t, i) => [t.user.email, t.user.name, `Teacher · form, Grade ${GRADES[i]}`, `/teacher, /teacher/classes/${b.classes[i]!.id}, /teacher/attendance?classId=${b.classes[i]!.id}, /bulletin`]),
      ...b.subjectTeachers.map((t) => [t.user.email, t.user.name, "Teacher · subject only", `/teacher (timetable, no form class)`]),
      [b.spare.user.email, b.spare.user.name, "Teacher · unattached", `/teacher (empty state), /vacancies (has applied to the other school), /enquiries`],
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
  return `# Demo schools

Two complete demo schools built by \`npm run demo:schools\` (apps/web). Every account below signs in with the same password:

**Password for every demo account: \`${PASSWORD}\`**

Re-running the script is safe; it adds nothing the second time and resets every password to the one above.

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
| A grade-9 entry in the platform's "Autumn Science Fair" with a result and the school's standing | /competitions, /admin/competitions |
| A pupil who left in August with a transfer record (\`<school>.pupil49\`, ${sunrise.spec.leaver.name} / ${saraswati.spec.leaver.name}); a grade-8 departure scheduled for 30 April | /admin/people → departures, /admin/certificates |
| Pupil records with coded category and religion, caste, parents' occupations, income, the previous school's TC; staff records with dates of birth and of joining service; roll numbers in every class | /admin/records, /admin/filings, /student/record |

Not seeded: a review round (deliberately skipped as cheap only through the UI), online payments.
`;
}

/* -------------------------------------------------------------------------- */

async function main() {
  refuseUnlessLocal();
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
    const certs = await buildCertificates(b.school, admin, spec.locale === "en"
      ? { grade: "6", recordGrades: GRADES, keepRecords: [b.deshmukh.membershipId], codePrefix: spec.codePrefix, city: spec.city, previousSchool: spec.previousSchool,
          templates: [{ kind: "BONAFIDE", locale: "en" }, { kind: "CHARACTER", locale: "en" }, { kind: "STUDY", locale: "en" }, { kind: "TC", locale: "en" }],
          issues: [{ key: "BONAFIDE-en", pupil: 0, number: 1, purpose: "a passport application", fromRequest: true }, { key: "STUDY-en", pupil: 1, number: 1, purpose: "a scholarship" }, { key: "CHARACTER-en", pupil: 2, number: 1, purpose: "a sports academy trial" }],
          requests: [{ pupil: 3, kind: "BONAFIDE", purpose: "a bus pass" }, { pupil: 4, kind: "STUDY", purpose: "a bank account" }, { pupil: 5, kind: "CHARACTER", purpose: "an NCC camp", status: "DECLINED", reason: "Term 1 fees are outstanding; please clear them first." }] }
      : { grade: "7", recordGrades: GRADES, keepRecords: [b.deshmukh.membershipId], codePrefix: spec.codePrefix, city: spec.city, previousSchool: spec.previousSchool,
          templates: [{ kind: "BONAFIDE", locale: "mr" }, { kind: "CHARACTER", locale: "mr" }, { kind: "STUDY", locale: "mr" }, { kind: "TC", locale: "mr" }, { kind: "NIRGAM", locale: "mr" }],
          issues: [{ key: "BONAFIDE-mr", pupil: 1, number: 1, purpose: "बस पास" }, { key: "STUDY-mr", pupil: 2, number: 1, purpose: "शिष्यवृत्ती", fromRequest: true }, { key: "CHARACTER-mr", pupil: 3, number: 1, purpose: "क्रीडा शिबिर" }],
          requests: [{ pupil: 0, kind: "BONAFIDE", purpose: "पासपोर्ट अर्ज" }, { pupil: 4, kind: "CHARACTER", purpose: "क्रीडा चाचणी" }, { pupil: 5, kind: "STUDY", purpose: "बँक खाते", status: "DECLINED", reason: "पहिल्या सत्राचे शुल्क थकीत आहे." }] });
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
    const rolls = await buildRollNumbers(b.school);
    b.counts = { calendar, lastYearCards: lastYear.cards, lastYearRegisters: lastYear.sessions, lastYearDays: lastYear.days, timetableSlots: timetable.slots, staffRecords: records.records + 3, registers: registers.sessions, feeStructures: fees.structures.length, feePupils: fees.pupils, receipts: fees.receipts, concessions: adjustments.concessions, refunds: adjustments.refunds, textsNumbered: texts.numbered, health: health.cards + 1, incidents: incidents.incidents, circular: circular.postId, staffMarks: staffAtt.marked, syllabus: syllabus6.units + syllabus9.units, subs: subs.covered, exams: `${exams6.series + exams9.series} series, ${exams6.papers + exams9.papers} papers, ${exams6.marks + exams9.marks} marks, ${exams6.cards + exams9.cards} cards`, certs: `${certs.templates} templates, ${certs.records} records, ${certs.issued} issued, ${certs.requests} asks`, leave: leave.requests, meetingSlots: meetings.slots, posts: feed.posts, comments: feed.comments, reportId: feed.reportId, quizAttempts: quizzes.attempts, quizResponses: quizzes.responses, badges: quizzes.badges, invite: invite.status, remarkThread: remarks.threadId, practice: practice.topic ?? "none (no bank imported)", competition: competition.skipped ?? `1 entry in "Autumn Science Fair", standing written`, leaver: departures.leaverMembershipId, scheduledDepartures: departures.scheduled, rolls: rolls.numbered };
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

  const counts = await countBlock([sunrise.school.id, saraswati.school.id], sunita.id);

  const doc = rosterMarkdown({ sunrise, saraswati, sunita, expert: { threadId: experts.threadId, bookings: experts.bookings, mentee: { name: experts.mentee.name, grade: experts.mentee.grade }, anjali: experts.anjali }, vacancies, admissionEnquiries, circulars: { sunrise: String(sunrise.counts.circular), saraswati: String(saraswati.counts.circular) }, globalPostId: globalPost.postId });
  const docPath = join(process.cwd(), "..", "..", "docs", "demo-schools.md");
  await mkdir(join(process.cwd(), "..", "..", "docs"), { recursive: true });
  await writeFile(docPath, doc);

  const line = (b: Built) => `
  ── ${b.school.name} ──────────────────────────────────────────
     school id   ${b.school.id}   join code ${b.school.code}   slug ${b.school.slug}
     admin       ${b.admin.user.email}   (${b.admin.user.name})
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
