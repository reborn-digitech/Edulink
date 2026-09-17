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
import { hash } from "@node-rs/argon2";
import { config } from "dotenv";
import { classCode, schoolCode, studentCode } from "../src/lib/codes";

config();
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

/**
 * Same dev password as `prisma/seed.ts`, so ZZ accounts log in by hand too.
 * ZZ_PASSWORD overrides it for the accounts this run CREATES; an account that
 * already exists keeps whatever hash it has (upsertUser never rewrites one).
 */
const PASSWORD = process.env.ZZ_PASSWORD ?? "copper-lantern-47-brook";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const DOMAIN = "zz.test";
/** Fixed so birthdates do not drift between runs and break a claim mid-test. */
const THIS_YEAR = 2026;

type Ctx = { passwordHash: string };

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

function studentName(index: number): string {
  return `ZZ ${FIRST[index % FIRST.length]!} ${LAST[index % LAST.length]!}`;
}

/* -------------------------------------------------------------------------- */
/* small helpers                                                               */
/* -------------------------------------------------------------------------- */

async function upsertUser(
  ctx: Ctx,
  email: string,
  name: string,
  extra: { birthdate?: Date; isMinor?: boolean } = {},
) {
  return db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash: ctx.passwordHash,
      emailVerifiedAt: new Date(),
      prefs: JSON.stringify({ theme: "system", channels: { push: true, email: true } }),
      ...extra,
    },
  });
}

async function upsertMembership(
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

async function upsertSchool(input: {
  name: string;
  slug: string;
  city: string;
  contactEmail: string;
  gradeLow: string;
  gradeHigh: string;
  brandPrimary: string;
}) {
  const existing = await db.school.findUnique({ where: { slug: input.slug } });
  if (existing) return existing;
  return db.school.create({
    data: {
      name: input.name,
      slug: input.slug,
      code: schoolCode(input.name.replace(/^ZZ /, "")),
      city: input.city,
      country: "India",
      contactEmail: input.contactEmail,
      timezone: "Asia/Kolkata",
      locale: "en",
      gradeLow: input.gradeLow,
      gradeHigh: input.gradeHigh,
      brandPrimary: input.brandPrimary,
      verifiedAt: new Date(),
    },
  });
}

async function upsertClass(
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

async function attachTeacher(classId: string, schoolId: string, teacherMembershipId: string, role = "LEAD") {
  const existing = await db.classTeacher.findUnique({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId } },
  });
  if (existing) return existing;
  return db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId, role } });
}

async function enrol(classId: string, schoolId: string, studentMembershipId: string) {
  const existing = await db.enrollment.findUnique({
    where: { classId_studentMembershipId: { classId, studentMembershipId } },
  });
  if (existing) return existing;
  return db.enrollment.create({ data: { classId, schoolId, studentMembershipId, status: "ACTIVE" } });
}

async function upsertPeriod(
  schoolId: string,
  spec: { name: string; startMinute: number; endMinute: number; kind: string; position: number },
) {
  const existing = await db.timetablePeriod.findFirst({ where: { schoolId, name: spec.name } });
  if (existing) return existing;
  return db.timetablePeriod.create({ data: { schoolId, ...spec } });
}

async function upsertSlot(data: {
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

async function link(parentUserId: string, studentMembershipId: string, studentSchoolId: string) {
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
  console.log(`\n  Removed ${schools.count} ZZ school(s) and ${users.count} ZZ user(s).\n`);
}

/* -------------------------------------------------------------------------- */
/* school A — populated                                                        */
/* -------------------------------------------------------------------------- */

const GRADES = ["3", "4", "5", "6", "7", "8", "9", "10"];
const PER_CLASS = 6;
/** Pupils at these indices in each class get a parent; the rest stay unclaimed. */
const CLAIMED = [0, 1, 2];

const CLASS_COLOURS = [
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
async function buildFees(school: { id: string }, adminUserId: string) {
  const year =
    (await db.academicYear.findFirst({ where: { schoolId: school.id, isCurrent: true } })) ??
    (await db.academicYear.create({
      data: { schoolId: school.id, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true },
    }));
  const headSpecs = [
    { code: "TUI", name: "Tuition", kind: "TUITION", sortOrder: 0 },
    { code: "TRN", name: "Transport", kind: "TRANSPORT", sortOrder: 1 },
    { code: "EXM", name: "Examination", kind: "EXAM", sortOrder: 2 },
  ];
  const heads: Record<string, string> = {};
  for (const spec of headSpecs) {
    const row = await db.feeHead.upsert({ where: { schoolId_code: { schoolId: school.id, code: spec.code } }, update: {}, create: { schoolId: school.id, ...spec } });
    heads[spec.code] = row.id;
  }
  let structure = await db.feeStructure.findFirst({ where: { schoolId: school.id, academicYearId: year.id, name: "ZZ Grade 3 fees" }, include: { instalments: true } });
  if (!structure) {
    structure = await db.feeStructure.create({
      data: {
        schoolId: school.id,
        academicYearId: year.id,
        name: "ZZ Grade 3 fees",
        gradeLevel: "3",
        publishedAt: new Date(),
        instalments: {
          create: [
            { schoolId: school.id, label: "Term 1", sortOrder: 0, dueDate: new Date("2026-07-15T00:00:00Z"), lines: { create: [{ schoolId: school.id, headId: heads.TUI!, amountPaise: 12_000_00 }, { schoolId: school.id, headId: heads.TRN!, amountPaise: 3_000_00 }] } },
            { schoolId: school.id, label: "Term 2", sortOrder: 1, dueDate: new Date("2026-12-15T00:00:00Z"), lines: { create: [{ schoolId: school.id, headId: heads.TUI!, amountPaise: 12_000_00 }, { schoolId: school.id, headId: heads.EXM!, amountPaise: 500_00 }] } },
          ],
        },
      },
      include: { instalments: true },
    });
  }
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: "3", archivedAt: null }, select: { id: true } });
  const pupils = klass ? await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true } }) : [];
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
  }
  // One cash payment from the first pupil against Term 1, with its receipt.
  const first = pupils[0]?.studentMembershipId;
  let receipts = await db.feeReceipt.count({ where: { schoolId: school.id } });
  if (first && receipts === 0) {
    const term1 = structure.instalments.find((i) => i.label === "Term 1")!;
    const demand = await db.feeDemand.findUniqueOrThrow({ where: { studentMembershipId_instalmentId: { studentMembershipId: first, instalmentId: term1.id } } });
    const payment = await db.feePayment.create({
      data: { schoolId: school.id, studentMembershipId: first, amountPaise: demand.netPaise, method: "CASH", status: "PAID", clientId: "zz-fixture-term1", collectedByUserId: adminUserId, paidAt: new Date("2026-07-10T05:30:00Z"), intentJson: "[]" },
    });
    await db.feeAllocation.create({ data: { schoolId: school.id, paymentId: payment.id, demandId: demand.id, amountPaise: demand.netPaise } });
    await db.feeDemand.update({ where: { id: demand.id }, data: { paidPaise: demand.netPaise, status: "PAID" } });
    const pupil = await db.membership.findUniqueOrThrow({ where: { id: first }, select: { studentCode: true, gradeLevel: true, user: { select: { name: true } } } });
    const number = year.feeReceiptNext;
    await db.academicYear.update({ where: { id: year.id }, data: { feeReceiptNext: number + 1 } });
    await db.feeReceipt.create({
      data: {
        schoolId: school.id,
        paymentId: payment.id,
        academicYearId: year.id,
        number,
        serial: `RCPT/${year.name}/${String(number).padStart(6, "0")}`,
        issuedAt: new Date("2026-07-10T05:30:00Z"),
        snapshotJson: JSON.stringify({
          school: { name: "ZZ Northgate School", addressLine: null, city: "Pune", contactPhone: null, bankNote: null },
          pupil: { name: pupil.user.name, studentCode: pupil.studentCode, className: "Grade 3 · A", gradeLevel: pupil.gradeLevel },
          payment: { amountPaise: demand.netPaise, method: "CASH", reference: null, gatewayMethod: null, paidAt: "2026-07-10T05:30:00.000Z", collectedBy: "ZZ Anita Deshmukh", note: null },
          year: year.name,
          lines: [{ demandLabel: "Term 1", head: "Tuition", code: "TUI", amountPaise: 12_000_00 }, { demandLabel: "Term 1", head: "Transport", code: "TRN", amountPaise: 3_000_00 }],
          allocations: [{ demandLabel: "Term 1", amountPaise: demand.netPaise }],
        }),
      },
    });
    receipts = 1;
  }
  return { year, structure, pupils: pupils.length, receipts };
}

/* -------------------------------------------------------------------------- */
/* timetable                                                                   */
/* -------------------------------------------------------------------------- */

/** Weekday is 0=Sunday…6=Saturday, matching `Date.getUTCDay()`. Mon–Fri. */
const SCHOOL_DAYS = [1, 2, 3, 4, 5];

const PERIODS = [
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
async function buildTimetable(
  schoolId: string,
  classes: { id: string; grade: string }[],
  staff: { membership: { id: string } }[],
) {
  const periods = [];
  for (const spec of PERIODS) periods.push(await upsertPeriod(schoolId, spec));

  const lessons = periods.filter((p) => p.kind === "LESSON");
  let created = 0;
  let unstaffed = 0;

  for (const weekday of SCHOOL_DAYS) {
    for (const [lessonIndex, period] of lessons.entries()) {
      // Friday, last lesson: laid out but not yet staffed.
      const leaveUnstaffed = weekday === 5 && lessonIndex === lessons.length - 1;
      for (const [classIndex, cls] of classes.entries()) {
        const offset = weekday * lessons.length + lessonIndex;
        const rota = (classIndex + offset) % staff.length;
        const teacher = staff[rota]!;
        await upsertSlot({
          schoolId,
          classId: cls.id,
          periodId: period.id,
          weekday,
          subject: ROTA_SUBJECTS[rota]!,
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

async function main() {
  if (process.argv.includes("--teardown")) {
    await teardown();
    return;
  }

  const passwordHash = await hash(PASSWORD, ARGON);
  const ctx: Ctx = { passwordHash };

  const northgate = await buildNorthgate(ctx);
  const fees = await buildFees(northgate.school, northgate.admin.id);
  const southbank = await buildSouthbank(ctx);
  const banyan = await buildBanyan(ctx, southbank.school.id);
  const experts = await buildExperts(ctx);
  const operator = await buildOperator(ctx);
  const contentTeam = await buildContentTeam(ctx);

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
  ZZ fixtures ready. Password for every account below: ${PASSWORD}

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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
