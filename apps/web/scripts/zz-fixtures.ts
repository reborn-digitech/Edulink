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
import { bandFor, DEFAULT_REPORT_CARD_CONFIG, kindWeighted, meanPercent, meanPoints } from "../src/lib/report-card-rules";
import { dataFor, fill, fillRows, presetsFor, wordsFor, type PupilFacts } from "../src/lib/certificate-rules";

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
/* texts to families                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Every Northgate guardian gets a mobile number (+91 98765 00001 upwards —
 * a reserved-looking range, never dialled), the school switches both
 * channels on, and one notice with its per-person rows exists so the API
 * sweep can read a broadcast. The rows are written as SENT under the devbox
 * transport's own sid shape; nothing is actually sent by the fixture.
 */
async function buildMessaging(school: { id: string; name: string }, adminUserId: string) {
  const guardians = await db.guardianship.findMany({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true }, distinct: ["parentUserId"] });
  let n = 0;
  for (const g of guardians) {
    n += 1;
    const phone = `+919876400${String(n).padStart(3, "0")}`;
    const taken = await db.user.findUnique({ where: { phone }, select: { id: true } });
    if (taken && taken.id !== g.parentUserId) continue;
    await db.user.update({ where: { id: g.parentUserId }, data: { phone, phoneVerifiedAt: new Date() } });
  }
  await db.school.update({ where: { id: school.id }, data: { msgSmsEnabled: true, msgWhatsappEnabled: true } });
  let broadcast = await db.broadcast.findFirst({ where: { schoolId: school.id, title: "ZZ Sports day" }, select: { id: true } });
  if (!broadcast) {
    broadcast = await db.broadcast.create({
      data: { schoolId: school.id, authorUserId: adminUserId, title: "ZZ Sports day", body: "Sports day is on Friday. Pupils come in house colours; the gates open at 8.", channelsJson: JSON.stringify(["TEXT"]), audienceJson: JSON.stringify({ kind: "ALL_PARENTS" }), recipients: guardians.length, status: "DONE", doneAt: new Date() },
      select: { id: true },
    });
    const users = await db.user.findMany({ where: { id: { in: guardians.map((g) => g.parentUserId) } }, select: { id: true, phone: true } });
    for (const u of users) {
      if (!u.phone) continue;
      await db.outboundMessage.create({
        data: { schoolId: school.id, userId: u.id, to: u.phone, channel: "WHATSAPP", templateKey: "circular", locale: "en", varsJson: JSON.stringify({ notice: "Sports day is on Friday." }), body: `Notice from ${school.name}: Sports day is on Friday. Pupils come in house colours; the gates open at 8. - EduLink`, status: "SENT", providerSid: `devbox_fixture_${broadcast.id}_${u.id}`, providerStatus: "sent", broadcastId: broadcast.id, purpose: "broadcast", sentAt: new Date() },
      });
    }
    await db.broadcast.update({ where: { id: broadcast.id }, data: { sent: users.filter((u) => u.phone).length } });
  }
  return { numbered: n, broadcastId: broadcast.id };
}



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
/**
 * Health cards for the first three ZZ Northgate pupils, so the sweep and the
 * screens have a card with an allergy, one with a condition and one blank
 * card with a check-up to read. Re-run safe: the card is upserted whole.
 */
async function buildHealth(school: { id: string }, adminUserId: string) {
  const pupils = await db.membership.findMany({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", user: { email: { in: ["zz.pupil01@zz.test", "zz.pupil02@zz.test", "zz.pupil03@zz.test"] } } }, select: { id: true, user: { select: { email: true } } }, orderBy: { user: { email: "asc" } } });
  const cards: Record<string, { bloodGroup: string | null; allergies: string; conditions: string; medications: string; notes: string; contacts: { name: string; relation: string; phone: string }[] }> = {
    "zz.pupil01@zz.test": { bloodGroup: "B+", allergies: "Peanuts — carries an EpiPen in the school bag", conditions: "", medications: "", notes: "Sits near the door in the dining hall.", contacts: [{ name: "ZZ Rekha Apte", relation: "mother", phone: "+919876400001" }, { name: "ZZ Dr Kulkarni", relation: "family doctor", phone: "+912024567890" }] },
    "zz.pupil02@zz.test": { bloodGroup: "O+", allergies: "", conditions: "Asthma", medications: "Salbutamol inhaler, kept with the class teacher", notes: "", contacts: [{ name: "ZZ Sunil Joshi", relation: "father", phone: "+919876400002" }] },
    "zz.pupil03@zz.test": { bloodGroup: null, allergies: "", conditions: "", medications: "", notes: "", contacts: [] },
  };
  let n = 0;
  for (const p of pupils) {
    const card = cards[p.user.email ?? ""];
    if (!card) continue;
    const data = { bloodGroup: card.bloodGroup, allergies: card.allergies, conditions: card.conditions, medications: card.medications, notes: card.notes, contactsJson: JSON.stringify(card.contacts), updatedByUserId: adminUserId };
    const row = await db.healthCard.upsert({ where: { studentMembershipId: p.id }, create: { schoolId: school.id, studentMembershipId: p.id, ...data }, update: data, select: { id: true } });
    if (p.user.email === "zz.pupil03@zz.test" && !(await db.healthCheck.findFirst({ where: { cardId: row.id }, select: { id: true } }))) {
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
async function buildIncidents(school: { id: string }, adminUserId: string) {
  const [p1, p2] = await Promise.all(["zz.pupil01@zz.test", "zz.pupil02@zz.test"].map((email) => db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", user: { email } }, select: { id: true } })));
  const teacher = await db.membership.findFirst({ where: { schoolId: school.id, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  if (!p1 || !p2 || !teacher) return { incidents: 0 };
  const day = 86_400_000;
  if (!(await db.incident.findFirst({ where: { studentMembershipId: p1.id, title: "ZZ Fell on the steps, grazed knee" }, select: { id: true } }))) {
    await db.incident.create({ data: { schoolId: school.id, studentMembershipId: p1.id, reportedByMembershipId: teacher.id, kind: "INJURY", severity: "MINOR", occurredAt: new Date(Date.now() - 6 * day), place: "Playground steps", title: "ZZ Fell on the steps, grazed knee", body: "Slipped on the wet steps at the end of break. Small graze on the right knee, no other injury.", actionTaken: "Cleaned and dressed in the sick room; back to class after ten minutes.", guardiansNotifiedAt: new Date(Date.now() - 6 * day), status: "CLOSED", closedAt: new Date(Date.now() - 5 * day), closedByUserId: adminUserId, notes: { create: { schoolId: school.id, authorUserId: adminUserId, body: "Mother called back in the evening; knee fine the next morning." } } } });
  }
  const open = await db.incident.findFirst({ where: { studentMembershipId: p2.id, status: "OPEN" }, select: { id: true } });
  if (!open) {
    await db.incident.create({ data: { schoolId: school.id, studentMembershipId: p2.id, reportedByMembershipId: teacher.id, kind: "ILLNESS", severity: "MODERATE", occurredAt: new Date(Date.now() - 2 * 3_600_000), place: "Classroom", title: "ZZ Wheezing after PE, used inhaler", body: "Short of breath after the run in PE. Sat down, used her inhaler as on the health card, settled within five minutes.", actionTaken: "Rested in the sick room for twenty minutes; father telephoned.", guardiansNotifiedAt: new Date(Date.now() - 2 * 3_600_000), notes: { create: { schoolId: school.id, authorUserId: adminUserId, body: "Father will bring the spare inhaler tomorrow." } } } });
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
async function buildCircular(school: { id: string; name: string }, adminUserId: string) {
  let post = await db.post.findFirst({ where: { schoolId: school.id, title: "ZZ Annual day: consent and costumes" }, select: { id: true } });
  if (!post) {
    post = await db.post.create({
      data: { schoolId: school.id, authorUserId: adminUserId, scope: "SCHOOL", category: "EVENTS", title: "ZZ Annual day: consent and costumes", body: "Annual day is on the 30th. Every pupil needs a signed consent slip and a white kurta by the 25th. Please acknowledge so the class teacher knows you have seen this.", audience: "PARENTS", requiresAck: true, status: "APPROVED", reviewedAt: new Date(), deliveryQueuedAt: new Date(Date.now() - 86_400_000), deliveredAt: new Date(Date.now() - 86_400_000 + 60_000) },
      select: { id: true },
    });
    const guardians = await db.guardianship.findMany({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true, parent: { select: { phone: true } } }, distinct: ["parentUserId"] });
    for (const g of guardians) {
      await db.notification.create({ data: { userId: g.parentUserId, schoolId: school.id, kind: "POST", title: `A notice from ${school.name} asks for your acknowledgement`, body: "ZZ Annual day: consent and costumes", url: `/bulletin/${post.id}`, createdAt: new Date(Date.now() - 86_400_000 + 60_000) } });
      if (g.parent.phone) {
        await db.outboundMessage.create({ data: { schoolId: school.id, userId: g.parentUserId, to: g.parent.phone, channel: "WHATSAPP", templateKey: "circular", locale: "en", varsJson: JSON.stringify({ notice: "ZZ Annual day: consent and costumes" }), body: `Notice from ${school.name}: ZZ Annual day: consent and costumes - EduLink`, status: "SENT", providerSid: `devbox_fixture_circular_${post.id}_${g.parentUserId}`, providerStatus: "sent", purpose: `circular:${post.id}`, sentAt: new Date() } });
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
async function buildStaffAttendance(school: { id: string }, adminUserId: string) {
  const staff = await db.membership.findMany({ where: { schoolId: school.id, role: { in: ["ADMIN", "PRINCIPAL", "TEACHER"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true }, orderBy: [{ role: "asc" }, { id: "asc" }] });
  const teachers = staff.filter((m) => m.role === "TEACHER");
  const today = new Date().toISOString().slice(0, 10);
  const days: string[] = [];
  for (let back = 1; days.length < 5 && back < 14; back += 1) {
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
    await db.staffAttendance.upsert({ where: { membershipId_dateKey: { membershipId: teachers[0].id, dateKey: today } }, create: { schoolId: school.id, membershipId: teachers[0].id, dateKey: today, status: "PRESENT", source: "SELF", checkedInAt: new Date(), markedByUserId: adminUserId }, update: {} });
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
async function buildExams(school: { id: string }, adminUserId: string) {
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
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: "3", archivedAt: null }, select: { id: true }, orderBy: { name: "asc" } });
  if (!klass) return { series: 0, papers: 0, marks: 0, cards: 0 };
  const day = (offset: number) => new Date(term1.startDate.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
  const seriesSpecs = [
    { name: "Unit test 1", kind: "UNIT_TEST", papers: [{ subject: "Mathematics", max: 25, date: day(40) }, { subject: "English", max: 25, date: day(41) }] },
    { name: "Mid-term", kind: "MID_TERM", papers: [{ subject: "Mathematics", max: 80, date: day(100) }, { subject: "English", max: 80, date: day(101) }] },
  ];
  const papers: { id: string; title: string; subject: string; kind: string; seriesName: string; max: number; position: number; seriesAt: number }[] = [];
  for (const spec of seriesSpecs) {
    const series = await db.examSeries.upsert({
      where: { schoolId_gradeLevel_name: { schoolId: school.id, gradeLevel: "3", name: spec.name } },
      create: { schoolId: school.id, name: spec.name, gradeLevel: "3", kind: spec.kind, termId: term1.id, publishedAt: new Date(), createdByMembershipId: admin.id },
      update: { kind: spec.kind, termId: term1.id, publishedAt: new Date() },
      select: { id: true, createdAt: true },
    });
    for (const [i, p] of spec.papers.entries()) {
      const slot = await db.examSlot.upsert({
        where: { seriesId_subject: { seriesId: series.id, subject: p.subject } },
        create: { schoolId: school.id, seriesId: series.id, subject: p.subject, dateKey: p.date, pointsMilli: p.max * 1000, position: i + 1 },
        update: { dateKey: p.date, pointsMilli: p.max * 1000 },
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
        const band = bandFor(w.percent, config.bands);
        return { subject, percent: w.percent, letter: band?.label ?? null, points: band?.points ?? null, parts: w.parts };
      });
      const overall = meanPercent(subjects);
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
        attendancePresent: 0,
        attendanceTotal: 0,
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
async function buildCertificates(school: { id: string; name: string; code: string }, adminUserId: string) {
  const year = await db.academicYear.findFirstOrThrow({ where: { schoolId: school.id, isCurrent: true }, select: { id: true, name: true } });
  const specs = [
    ...presetsFor("en").filter((p) => ["BONAFIDE", "CHARACTER", "STUDY"].includes(p.kind)).map((p) => ({ ...p, active: true })),
    ...presetsFor("mr").filter((p) => ["TC", "NIRGAM"].includes(p.kind)).map((p) => ({ ...p, active: true })),
    { ...presetsFor("hi").find((p) => p.kind === "BONAFIDE")!, name: "बोनाफाइड (जुना)", active: false },
  ];
  const templates = new Map<string, { id: string; kind: string; locale: string; title: string; intro: string; rowsJson: string; outro: string; layoutJson: string; serialPrefix: string }>();
  for (const spec of specs) {
    const data = { kind: spec.kind, locale: spec.locale, title: spec.title, intro: spec.intro, rowsJson: JSON.stringify(spec.rows), outro: spec.outro, layoutJson: JSON.stringify(spec.layout), serialPrefix: spec.serialPrefix, active: spec.active, createdByUserId: adminUserId };
    const t = await db.certificateTemplate.upsert({ where: { schoolId_name: { schoolId: school.id, name: spec.name } }, create: { schoolId: school.id, name: spec.name, ...data }, update: data });
    templates.set(`${spec.kind}-${spec.locale}`, t);
  }
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: "3", archivedAt: null }, select: { id: true, name: true, gradeLevel: true }, orderBy: { name: "asc" } });
  if (!klass) return { templates: specs.length, records: 0, issued: 0, requests: 0 };
  const roll = await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true, student: { select: { studentCode: true, user: { select: { name: true, preferredName: true, birthdate: true } } } } }, orderBy: { studentMembershipId: "asc" } });
  const fathers = ["Rohan", "Prakash", "Sunil", "Mahesh", "Anil", "Vijay"];
  const mothers = ["Sneha", "Kavita", "Rekha", "Vandana", "Meena", "Priya"];
  let records = 0;
  for (const [i, row] of roll.entries()) {
    const surname = (row.student.user.name.replace(/^ZZ\s+/, "").split(" ").pop() ?? "Patil");
    const data = {
      fatherName: `${fathers[i % fathers.length]} ${surname}`, motherName: `${mothers[i % mothers.length]} ${surname}`, placeOfBirth: "Pune", nationality: "Indian", religion: "Hindu", caste: null, category: i % 3 === 0 ? "General" : "OBC", motherTongue: "Marathi",
      addressLine: `${10 + i} Shivaji Nagar`, city: "Pune", postalCode: "411005", admissionNumber: `GR-${1000 + i}`,
      admissionDate: i === roll.length - 1 ? null : new Date("2024-06-15T00:00:00Z"), admittedToGrade: "1", previousSchool: "Sunrise Nursery", penNumber: null, updatedByUserId: adminUserId, familyFilledAt: new Date(),
      // The filing fields: gender for all but the last (so the UDISE sheet has a blank to name), a BPL and an EWS flag, one child with an impairment, Marathi names on two.
      gender: i === roll.length - 1 ? null : i % 2 === 0 ? "M" : "F", bpl: i === 2, ews: i === 2 || i === 4, cwsnType: i === 1 ? "2" : null, bloodGroup: ["A+", "O+", "B+", null, "AB+", "O-"][i % 6] ?? null,
      nameLocal: i === 0 ? "आरव पाटील" : i === 1 ? "भक्ती भोसले" : null, fatherNameLocal: i === 0 ? "रोहन पाटील" : null, motherNameLocal: i === 0 ? "स्नेहा पाटील" : null,
    };
    await db.pupilRecord.upsert({ where: { studentMembershipId: row.studentMembershipId }, create: { schoolId: school.id, studentMembershipId: row.studentMembershipId, ...data }, update: data });
    records += 1;
  }
  await db.issuedCertificate.deleteMany({ where: { schoolId: school.id, academicYearId: year.id } });
  const today = new Date().toISOString().slice(0, 10);
  const issues: { key: string; pupil: (typeof roll)[number]; number: number; purpose: string | null; revoked: boolean }[] = [
    { key: "BONAFIDE-en", pupil: roll[0]!, number: 1, purpose: "a passport", revoked: false },
    { key: "STUDY-en", pupil: roll[1]!, number: 1, purpose: "a scholarship", revoked: false },
    { key: "STUDY-en", pupil: roll[2]!, number: 2, purpose: "a bus pass", revoked: false },
    { key: "BONAFIDE-en", pupil: roll[1]!, number: 2, purpose: "a bank account", revoked: true },
  ].filter((i) => i.pupil);
  let issued = 0;
  for (const spec of issues) {
    const t = templates.get(spec.key)!;
    const locale = t.locale as "en" | "hi" | "mr";
    const words = wordsFor(locale);
    const rec = await db.pupilRecord.findUnique({ where: { studentMembershipId: spec.pupil.studentMembershipId } });
    const serial = `${t.serialPrefix}/${year.name}/${String(spec.number).padStart(4, "0")}`;
    const facts: PupilFacts = {
      name: spec.pupil.student.user.preferredName ?? spec.pupil.student.user.name,
      studentCode: spec.pupil.student.studentCode,
      birthdateKey: spec.pupil.student.user.birthdate?.toISOString().slice(0, 10) ?? null,
      ageYears: null,
      record: rec ? { fatherName: rec.fatherName, motherName: rec.motherName, placeOfBirth: rec.placeOfBirth, nationality: rec.nationality, religion: rec.religion, caste: rec.caste, category: rec.category, motherTongue: rec.motherTongue, addressLine: rec.addressLine, city: rec.city, postalCode: rec.postalCode, admissionNumber: rec.admissionNumber, admissionDateKey: rec.admissionDate?.toISOString().slice(0, 10) ?? null, admittedToGrade: rec.admittedToGrade, previousSchool: rec.previousSchool, penNumber: rec.penNumber } : null,
      className: klass.name,
      gradeLevel: klass.gradeLevel,
      school: { name: school.name, code: school.code, address: "Pune" },
      yearName: year.name,
      leaving: null,
      issue: { dateKey: today, serial, purpose: spec.purpose, remark: null },
    };
    const data = dataFor(facts, locale, words);
    const intro = fill(t.intro, data);
    const rows = fillRows(JSON.parse(t.rowsJson), data);
    const outro = fill(t.outro, data);
    const code = `ZZ${String(issued + 1).padStart(2, "0")}${spec.pupil.studentMembershipId.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`;
    await db.issuedCertificate.create({
      data: {
        schoolId: school.id, templateId: t.id, studentMembershipId: spec.pupil.studentMembershipId, academicYearId: year.id, kind: t.kind, locale, serial, number: spec.number, title: t.title,
        intro: intro.text, rowsJson: JSON.stringify(rows.rows), outro: outro.text, layoutJson: t.layoutJson, dataJson: JSON.stringify({ ...data, missing: [...new Set([...intro.missing, ...rows.missing, ...outro.missing])] }),
        purpose: spec.purpose, code, issuedByUserId: adminUserId, revokedAt: spec.revoked ? new Date() : null, revokedReason: spec.revoked ? "Issued to the wrong pupil." : null,
      },
    });
    issued += 1;
  }
  // The asks: a pending bonafide from the second pupil (the queue on the issue page), a declined study certificate from the third, and a cancelled one from the first — so the sweep's cancel and decline are no-ops.
  await db.certificateRequest.deleteMany({ where: { schoolId: school.id } });
  const pupilUser = async (m: (typeof roll)[number]) => (await db.membership.findUniqueOrThrow({ where: { id: m.studentMembershipId }, select: { userId: true } })).userId;
  let requests = 0;
  if (roll[1]) { await db.certificateRequest.create({ data: { schoolId: school.id, studentMembershipId: roll[1].studentMembershipId, requestedByUserId: await pupilUser(roll[1]), kind: "BONAFIDE", purpose: "a bus pass" } }); requests += 1; }
  if (roll[2]) { await db.certificateRequest.create({ data: { schoolId: school.id, studentMembershipId: roll[2].studentMembershipId, requestedByUserId: await pupilUser(roll[2]), kind: "STUDY", purpose: "a scholarship", status: "DECLINED", declineReason: "Fees for Term 1 are outstanding.", decidedByUserId: adminUserId, decidedAt: new Date() } }); requests += 1; }
  if (roll[0]) { await db.certificateRequest.create({ data: { schoolId: school.id, studentMembershipId: roll[0].studentMembershipId, requestedByUserId: await pupilUser(roll[0]), kind: "CHARACTER", purpose: "a sports trial", status: "CANCELLED", decidedAt: new Date() } }); requests += 1; }
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
async function buildAdmissions(school: { id: string; name: string }, adminUserId: string, structureId: string | null) {
  const year = await db.academicYear.findFirstOrThrow({ where: { schoolId: school.id, isCurrent: true }, select: { id: true, name: true } });
  await db.school.update({ where: { id: school.id }, data: { profilePublishedAt: new Date(), profileAbout: "A neighbourhood school in Pune, grades 3 to 10, with a bilingual primary section.", udiseCode: "27250100101", board: "MSBSHSE", affiliationNumber: "25.01.001", district: "Pune", block: "Haveli", medium: "Marathi", managementType: "PRIVATE_UNAIDED" } });
  await db.admissionCycle.deleteMany({ where: { schoolId: school.id } });
  const cycle = await db.admissionCycle.create({
    data: {
      schoolId: school.id, academicYearId: year.id, name: `Admissions ${year.name}`, status: "OPEN", testRequired: true, feeStructureId: structureId, createdByUserId: adminUserId,
      gradesJson: JSON.stringify([{ grade: "3", seats: 3 }, { grade: "6", seats: 2 }]),
      documentsJson: JSON.stringify([{ key: "birth_certificate", name: "Birth certificate", required: true }, { key: "photo", name: "Passport photograph", required: true }, { key: "previous_report", name: "Last report card", required: false }]),
      notice: "Bring the originals to the entrance test. The office is open 9 to 1 on Saturdays.",
    },
  });
  await db.admissionCycle.create({ data: { schoolId: school.id, academicYearId: year.id, name: `Late admissions ${year.name}`, status: "CLOSED", gradesJson: JSON.stringify([{ grade: "3", seats: 1 }]), createdByUserId: adminUserId } });
  const day = new Date(); day.setUTCDate(day.getUTCDate() + 14); day.setUTCHours(4, 30, 0, 0);
  const slots = [];
  for (let i = 0; i < 3; i += 1) {
    const startsAt = new Date(day.getTime() + i * 45 * 60_000);
    slots.push(await db.entranceSlot.create({ data: { schoolId: school.id, cycleId: cycle.id, startsAt, endsAt: new Date(startsAt.getTime() + 45 * 60_000), capacity: 4, location: "Room 3, ground floor" }, select: { id: true } }));
  }
  await db.entranceSlot.create({ data: { schoolId: school.id, cycleId: cycle.id, startsAt: new Date(day.getTime() + 3 * 45 * 60_000), endsAt: new Date(day.getTime() + 4 * 45 * 60_000), capacity: 4, cancelledAt: new Date() } });
  const guardian = await db.guardianship.findFirst({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true, parent: { select: { name: true, email: true } } } });
  if (!guardian) return { cycles: 2, slots: 4, applications: 0 };
  const pupil = await db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", enrollments: { some: { status: "ACTIVE", class: { gradeLevel: "3" } } } }, orderBy: { id: "desc" }, select: { id: true } });
  const docs = (n: number) => JSON.stringify([{ key: "birth_certificate", fileId: `zz-fixture-birth-${n}.pdf`, name: "birth-certificate.pdf", mime: "application/pdf", size: 120_000, uploadedAt: new Date().toISOString() }, { key: "photo", fileId: `zz-fixture-photo-${n}.jpg`, name: "photo.jpg", mime: "image/jpeg", size: 80_000, uploadedAt: new Date().toISOString() }]);
  const base = { schoolId: school.id, cycleId: cycle.id, applicantUserId: guardian.parentUserId, applicantName: guardian.parent.name, applicantEmail: guardian.parent.email, relation: "PARENT", addressLine: "14 Shivaji Nagar", city: "Pune", previousSchool: "Sunrise Nursery" };
  const soon = new Date(); soon.setUTCDate(soon.getUTCDate() + 10);
  const specs = [
    { number: 1, childName: "ZZ Aarohi Deshpande", gradeApplied: "3", childBirthdate: new Date("2019-02-11T00:00:00Z"), status: "SUBMITTED", documentsJson: docs(1), documentsVerifiedAt: new Date(), testSlotId: slots[0]!.id, testScore: "38/50", testNote: "Reads fluently.", testedAt: new Date() },
    { number: 2, childName: "ZZ Kabir Deshpande", gradeApplied: "6", childBirthdate: new Date("2016-08-30T00:00:00Z"), status: "OFFERED", documentsJson: docs(2), documentsVerifiedAt: new Date(), testSlotId: slots[1]!.id, testScore: "44/50", testedAt: new Date(), offeredAt: new Date(), offerExpiresAt: soon, offerNote: "Please bring the originals when you accept." },
    { number: 3, childName: "ZZ Meera Deshpande", gradeApplied: "3", childBirthdate: new Date("2019-05-02T00:00:00Z"), status: "ACCEPTED", documentsJson: docs(3), documentsVerifiedAt: new Date(), testScore: "41/50", testedAt: new Date(), offeredAt: new Date(), offerExpiresAt: soon, respondedAt: new Date() },
    { number: 4, childName: "ZZ Dhruv Deshpande", gradeApplied: "3", childBirthdate: new Date("2019-01-20T00:00:00Z"), status: "ADMITTED", documentsJson: docs(4), documentsVerifiedAt: new Date(), testScore: "45/50", testedAt: new Date(), offeredAt: new Date(), respondedAt: new Date(), admittedAt: new Date(), admittedMembershipId: pupil?.id ?? null, feeStructureId: structureId },
    { number: 5, childName: "ZZ Ira Deshpande", gradeApplied: "6", childBirthdate: new Date("2016-11-11T00:00:00Z"), status: "WAITLISTED", documentsJson: docs(5), testScore: "29/50", testedAt: new Date(), decidedAt: new Date(), decisionNote: "Second on the list for grade 6." },
    { number: 6, childName: "ZZ Vihaan Deshpande", gradeApplied: "3", childBirthdate: new Date("2019-07-07T00:00:00Z"), status: "WITHDRAWN", decidedAt: new Date() },
  ] as const;
  for (const spec of specs) await db.application.create({ data: { ...base, ...spec, serial: `APP/${year.name}/${String(spec.number).padStart(4, "0")}` } });
  await db.application.create({ data: { schoolId: school.id, cycleId: cycle.id, number: 7, serial: `APP/${year.name}/0007`, applicantUserId: null, applicantName: "Sujata Kulkarni", applicantPhone: "+91 98764 00077", relation: "PARENT", childName: "ZZ Anvi Kulkarni", gradeApplied: "3", childBirthdate: new Date("2019-03-03T00:00:00Z"), status: "SUBMITTED", note: "Came to the office on Saturday with the paper form.", createdByUserId: adminUserId } });
  return { cycles: 2, slots: 4, applications: 7 };
}

/**
 * The staff records the UDISE+ teacher profile is cut from: every form tutor
 * and subject teacher gets a gender, a category, qualifications and an
 * appointment type; the two idle teachers are left blank so the filings page
 * has staff to name. Re-run safe.
 */
async function buildStaffRecords(school: { id: string }, staff: { membership: { id: string } }[]) {
  const specs = [
    { gender: "F", socialCategory: "GENERAL", academicQualification: "5", professionalQualification: "3", appointmentType: "REGULAR", designation: "Primary teacher" },
    { gender: "M", socialCategory: "OBC", academicQualification: "4", professionalQualification: "3", appointmentType: "REGULAR", designation: "Class teacher" },
    { gender: "F", socialCategory: "GENERAL", academicQualification: "4", professionalQualification: "10", appointmentType: "CONTRACT", designation: "Class teacher" },
    { gender: "M", socialCategory: "SC", academicQualification: "5", professionalQualification: "4", appointmentType: "REGULAR", designation: "Senior teacher" },
  ];
  let n = 0;
  for (const [i, s] of staff.entries()) {
    const spec = specs[i % specs.length]!;
    const data = { ...spec, joinedOn: new Date(`${2015 + (i % 8)}-06-01T00:00:00Z`), leaveDaysPerYear: 12 };
    await db.staffRecord.upsert({ where: { membershipId: s.membership.id }, create: { schoolId: school.id, membershipId: s.membership.id, ...data }, update: data });
    n += 1;
  }
  return { records: n };
}

/**
 * The substitution board for today: one subject teacher (timetable only, so
 * never the sweep's form teacher, whom the sweep marks present) is absent
 * today and their first lesson of the day is covered by a free colleague.
 * Nothing on a day the ZZ timetable has no lessons. Re-run safe: today's
 * rows are rebuilt.
 */
async function buildSubstitutions(school: { id: string }, adminUserId: string, absent: { membership: { id: string } } | undefined) {
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
 * The syllabus for ZZ Northgate's grade 3: Mathematics and English lists,
 * the grade-3 class two chapters into each with one in progress, and two
 * lessons (one taught, one planned), so the head's coverage has rows and
 * the sweep has a unit and a lesson to move. Re-run safe.
 */
async function buildSyllabus(school: { id: string }) {
  const klass = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: "3", archivedAt: null }, select: { id: true, gradeLevel: true, teachers: { where: { role: "LEAD" }, select: { teacherMembershipId: true }, take: 1 } }, orderBy: { name: "asc" } });
  if (!klass || !klass.teachers[0]) return { units: 0 };
  const lists: Record<string, string[]> = {
    Mathematics: ["Numbers to 10,000", "Addition and subtraction", "Multiplication tables", "Division", "Fractions", "Shapes and patterns", "Measurement", "Time and money", "Data handling"],
    English: ["The sentence", "Nouns and pronouns", "Reading: The clever crow", "Verbs and tenses", "Writing a paragraph", "Reading: Rain in the village", "Adjectives", "Letters and notices"],
  };
  let n = 0;
  for (const [subject, titles] of Object.entries(lists)) {
    const existing = await db.syllabusUnit.findMany({ where: { schoolId: school.id, gradeLevel: "3", subject }, orderBy: { position: "asc" }, select: { id: true } });
    const ids: string[] = [];
    for (const [i, title] of titles.entries()) {
      const id = existing[i]?.id;
      const row = id ? await db.syllabusUnit.update({ where: { id }, data: { position: i + 1, title }, select: { id: true } }) : await db.syllabusUnit.create({ data: { schoolId: school.id, gradeLevel: "3", subject, position: i + 1, title, periodsPlanned: 6 + (i % 3) * 2 }, select: { id: true } });
      ids.push(row.id);
      n += 1;
    }
    const states = ["DONE", "DONE", "IN_PROGRESS"] as const;
    for (const [i, status] of states.entries()) {
      await db.syllabusProgress.upsert({ where: { classId_unitId: { classId: klass.id, unitId: ids[i]! } }, create: { schoolId: school.id, classId: klass.id, unitId: ids[i]!, status, doneOn: status === "DONE" ? new Date(Date.now() - (30 - i * 10) * 86_400_000).toISOString().slice(0, 10) : null, byMembershipId: klass.teachers[0]!.teacherMembershipId }, update: { status } });
    }
    if (!(await db.lessonPlan.findFirst({ where: { classId: klass.id, subject, topic: `ZZ ${subject}: revision of chapter two` }, select: { id: true } }))) {
      await db.lessonPlan.create({ data: { schoolId: school.id, classId: klass.id, teacherMembershipId: klass.teachers[0]!.teacherMembershipId, subject, unitId: ids[1], dateKey: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10), topic: `ZZ ${subject}: revision of chapter two`, notes: "Worked examples on the board; the back row needs another go.", homework: "Exercise 2.4, questions 1 to 8.", status: "TAUGHT" } });
      await db.lessonPlan.create({ data: { schoolId: school.id, classId: klass.id, teacherMembershipId: klass.teachers[0]!.teacherMembershipId, subject, unitId: ids[2], dateKey: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), topic: `ZZ ${subject}: chapter three, first lesson`, status: "PLANNED" } });
    }
  }
  return { units: n };
}

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
  const texts = await buildMessaging(northgate.school, northgate.admin.id);
  const health = await buildHealth(northgate.school, northgate.admin.id);
  const incidents = await buildIncidents(northgate.school, northgate.admin.id);
  const circular = await buildCircular(northgate.school, northgate.admin.id);
  const staffAtt = await buildStaffAttendance(northgate.school, northgate.admin.id);
  const syllabus = await buildSyllabus(northgate.school);
  const subs = await buildSubstitutions(northgate.school, northgate.admin.id, northgate.subjectTeachers[0]);
  const exams = await buildExams(northgate.school, northgate.admin.id);
  const certs = await buildCertificates(northgate.school, northgate.admin.id);
  const admissions = await buildAdmissions(northgate.school, northgate.admin.id, fees.structure.id);
  const staffRecords = await buildStaffRecords(northgate.school, [...northgate.teachers, ...northgate.subjectTeachers]);
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
     substitutes ${subs.covered} lesson covered today (zz.subject1 absent, a free colleague on their first lesson) — /admin/substitutions

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
