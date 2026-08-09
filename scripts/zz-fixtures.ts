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
 *     each, an admin, a principal and four teachers holding two classes apiece.
 *     Half the pupils have a parent linked; the other half are deliberately
 *     UNCLAIMED so the parent-claim flow has something to claim. Their codes
 *     are printed at the end.
 *   ZZ Southbank School — deliberately empty. A principal and three teachers,
 *     two classes with nobody in them, and no pupils at all. This is the school
 *     for testing every empty state.
 *   Four experts spanning the curation states: published+verified, published
 *     unverified, and one still unpublished.
 *   One operator account for the superuser flag.
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

/** Same dev password as `prisma/seed.ts`, so ZZ accounts log in by hand too. */
const PASSWORD = "copper-lantern-47-brook";
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

  /* classes, pupils, parents ------------------------------------------------ */
  const unclaimed: { name: string; code: string; birthdate: string; grade: string }[] = [];
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

  return { school, unclaimed, claimedParents, teachers, admin, principal };
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

  // Two classes with nobody in them. A school with no classes at all tests one
  // empty state; a class with no pupils tests a different and more interesting
  // one — the register, the mark sheet and the analytics panel all have to say
  // something sensible with zero rows.
  const classA = await upsertClass(school.id, "ZZ Grade 6 · A", {
    subject: "Form group", gradeLevel: "6", section: "A", color: "#0ea5e9", room: "S601",
  });
  const classB = await upsertClass(school.id, "ZZ Grade 7 · A", {
    subject: "Form group", gradeLevel: "7", section: "A", color: "#8b5cf6", room: "S701",
  });
  await attachTeacher(classA.id, school.id, teachers[0]!.membership.id);
  await attachTeacher(classB.id, school.id, teachers[1]!.membership.id);

  return { school, teachers, principal };
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

async function buildOperator(ctx: Ctx) {
  const user = await upsertUser(ctx, `zz.operator@${DOMAIN}`, "ZZ Platform Operator");
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
  const southbank = await buildSouthbank(ctx);
  const experts = await buildExperts(ctx);
  const operator = await buildOperator(ctx);

  const studentCount = await db.membership.count({
    where: { schoolId: northgate.school.id, role: "STUDENT" },
  });
  const guardianCount = await db.guardianship.count({
    where: { studentSchoolId: northgate.school.id },
  });

  console.log(`
  ZZ fixtures ready. Password for every account below: ${PASSWORD}

  ── ZZ Northgate School (populated) ──────────────────────────────────
     join code   ${northgate.school.code}
     admin       zz.admin@${DOMAIN}         (ZZ Anita Deshmukh)
     principal   zz.principal@${DOMAIN}     (ZZ Rohan Iyer)
     teachers    zz.teacher1..4@${DOMAIN}   — two classes each
     classes     ${GRADES.length} (grades ${GRADES[0]}–${GRADES[GRADES.length - 1]}, section A)
     pupils      ${studentCount}  (zz.pupil01..${String(studentCount).padStart(2, "0")}@${DOMAIN})
     guardians   ${guardianCount} link(s) — zz.parentNN@${DOMAIN} matches zz.pupilNN

  ── ZZ Southbank School (empty by design) ────────────────────────────
     join code   ${southbank.school.code}
     principal   zz.principal.b@${DOMAIN}   (ZZ Farida Qureshi)
     teachers    zz.teacher.b1..b3@${DOMAIN}
     classes     2, both with zero pupils
     pupils      none — this is the school for empty states
     NOTE        no ADMIN here, as asked: only teachers and a principal.
                 Admin-only pages are therefore unreachable in this school.

  ── Experts ──────────────────────────────────────────────────────────
${experts.map((e) => `     ${e}`).join("\n")}

  ── Operator ─────────────────────────────────────────────────────────
     ${operator.email}   — grant the flag with:
       npm run superuser -- ${operator.email}

  ── Unclaimed pupils (for walking the parent-claim flow) ─────────────
     Claiming needs the code AND the child's birthdate.
${northgate.unclaimed
  .slice(0, 8)
  .map((u) => `     grade ${u.grade.padEnd(2)}  ${u.code}   ${u.birthdate}   ${u.name}`)
  .join("\n")}
     …and ${Math.max(0, northgate.unclaimed.length - 8)} more unclaimed.

  Remove everything again with:  npm run zz:fixtures -- --teardown
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
