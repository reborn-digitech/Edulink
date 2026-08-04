/**
 * Development seed.
 *
 * Builds TWO schools on purpose. A single-tenant seed makes tenant-isolation
 * bugs invisible — every query looks correct when there is only one school's
 * data to return. Oakfield exists so the isolation tests have something they
 * must NOT be able to see.
 *
 * Run: npm run db:seed   (or `npm run db:reset` to wipe first)
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { classCode, schoolCode, slugify, studentCode } from "../src/lib/codes";
import { addDaysToKey, todayKey, isTeachingDay } from "../src/lib/dates";

const db = new PrismaClient();

const PASSWORD = "copper-lantern-47-brook";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

async function main() {
  console.log("Seeding EduLink…");

  // One hash, reused: argon2 is deliberately slow, and hashing 40 identical
  // dev passwords separately turns a 2-second seed into a 40-second one.
  const passwordHash = await hash(PASSWORD, ARGON);

  await wipe();

  const riverside = await createSchool({
    name: "Riverside Primary School",
    timezone: "Europe/London",
    city: "Bristol",
    country: "United Kingdom",
    brandPrimary: "#2563eb",
    passwordHash,
    domain: "riverside.school",
    gradeLow: "3",
    gradeHigh: "6",
    classes: [
      { name: "Grade 5 · Sunflower", subject: "Form group", gradeLevel: "5", color: "#f59e0b" },
      { name: "Grade 5 · Willow", subject: "Form group", gradeLevel: "5", color: "#10b981" },
      { name: "Grade 6 · Maths", subject: "Mathematics", gradeLevel: "6", color: "#6366f1" },
    ],
    teachers: [
      { name: "Priya Raman", email: "priya@riverside.school", title: "Head of Year 5", subjects: ["Mathematics", "Science"] },
      { name: "Tom Fielding", email: "tom@riverside.school", title: "Class teacher", subjects: ["English", "History"] },
    ],
    students: [
      "Amara Okafor", "Ben Carter", "Chloé Dubois", "Dev Patel", "Elif Kaya",
      "Farid Hassan", "Grace Lin", "Hugo Martins", "Isla Robertson", "Jonah Weiss",
      "Kaia Nakamura", "Liam O'Sullivan", "Maya Sharma", "Noah Bergström", "Olivia Nwosu",
      "Pedro Alvarez", "Quinn Tremblay", "Rania Haddad", "Sami Ali", "Tara Novak",
      "Umar Sheikh", "Vera Petrova", "Wren Ashby", "Yusuf Demir",
    ],
  });

  const oakfield = await createSchool({
    name: "Oakfield Academy",
    timezone: "America/New_York",
    city: "Providence",
    country: "United States",
    brandPrimary: "#7e22ce",
    passwordHash,
    domain: "oakfield.school",
    gradeLow: "5",
    gradeHigh: "8",
    classes: [{ name: "Homeroom 7B", subject: "Homeroom", gradeLevel: "7", color: "#ec4899" }],
    teachers: [
      { name: "Sam Whitfield", email: "sam@oakfield.school", title: "Homeroom teacher", subjects: ["Science"] },
    ],
    students: ["Ava Bennett", "Caleb Ford", "Nia Johnson", "Owen Reyes"],
  });

  // ---- parents -----------------------------------------------------------
  // Deliberately linked to children in BOTH schools, to exercise the
  // cross-school guardianship model the spec requires.
  const parent = await db.user.create({
    data: {
      email: "parent@example.com",
      name: "Jordan Okafor",
      passwordHash,
      emailVerifiedAt: new Date(),
      prefs: JSON.stringify({ theme: "system", channels: { push: true, email: true } }),
    },
  });

  const amara = riverside.students.find((s) => s.name === "Amara Okafor")!;
  const ava = oakfield.students.find((s) => s.name === "Ava Bennett")!;

  for (const child of [{ ...amara, schoolId: riverside.id }, { ...ava, schoolId: oakfield.id }]) {
    await db.guardianship.create({
      data: {
        parentUserId: parent.id,
        studentMembershipId: child.membershipId,
        studentSchoolId: child.schoolId,
        relation: "PARENT",
        status: "ACTIVE",
        consentSharingAt: new Date(),
        consentNotificationsAt: new Date(),
      },
    });
  }

  // ---- a term of attendance history -------------------------------------
  await seedAttendance(riverside);

  // ---- assignments + grades ---------------------------------------------
  await seedAssignments(riverside);

  // ---- the competitions marketplace -------------------------------------
  await seedCompetitions(riverside.id);

  console.log(`
Seeded.

  Riverside Primary School   code ${riverside.code}   (Europe/London)
    admin    priya@riverside.school
    teacher  tom@riverside.school
    student  amara@riverside.school
  Oakfield Academy           code ${oakfield.code}   (America/New_York)
    admin    sam@oakfield.school
  Parent (children in BOTH schools)
             parent@example.com

  Password for every account:  ${PASSWORD}

  Class join codes:
${riverside.classes.map((c) => `    ${c.joinCode}  ${c.name}`).join("\n")}
`);
}

/**
 * Competitions.
 *
 * NOT school-owned, which is the whole point of the marketplace: these rows have
 * no schoolId and no policy, so both schools see the same four. One is organised
 * BY Riverside to prove `organizerSchoolId` works and that a school's own event
 * still shows up at the other school; one needs no parent consent because
 * nothing leaves the building; one is already closed so the "only ones I can
 * still enter" filter has something to filter; and one is a draft, which nobody
 * outside the organising school may see at all.
 */
async function seedCompetitions(riversideId: string) {
  const days = (n: number) => new Date(Date.now() + n * 86_400_000);

  await db.competition.createMany({
    data: [
      {
        title: "Junior Maths Challenge",
        summary: "Thirty puzzles, twenty-five minutes, no calculators.",
        body: "A national paper sat in school. Everyone who takes part gets a certificate, and the top scorers go through to the Junior Kangaroo in the spring.\n\nBring a pencil and a rubber. Nothing else is needed.",
        organizerName: "The Mathematical Trust",
        subject: "Maths",
        gradeLow: "4",
        gradeHigh: "6",
        eligibility: "Any pupil in Years 4 to 6.",
        rules: "Sat under exam conditions in school. No calculators.",
        prizes: "Bronze, silver and gold certificates. Gold goes through to the next round.",
        externalUrl: "https://example.org/junior-maths-challenge",
        registrationClosesAt: days(30),
        startsAt: days(45),
        status: "PUBLISHED",
        verified: true,
        requiresParentConsent: true,
      },
      {
        title: "Young Writers: 500 Words",
        summary: "Tell a story in five hundred words or fewer.",
        body: "Any story you like, as long as it is yours and it fits in five hundred words. Shortlisted stories are read out on the radio.",
        organizerName: "The Reading Foundation",
        subject: "English",
        gradeLow: "3",
        gradeHigh: "6",
        prizes: "A pile of books for your class, and your story read aloud.",
        registrationClosesAt: days(12),
        endsAt: days(20),
        status: "PUBLISHED",
        verified: true,
        requiresParentConsent: true,
      },
      {
        title: "Riverside Spelling Bee",
        summary: "Our own spelling bee, in the hall, on a Friday afternoon.",
        body: "Three rounds. Parents welcome to come and watch the final.",
        organizerName: "Riverside Primary School",
        organizerSchoolId: riversideId,
        subject: "English",
        registrationClosesAt: days(9),
        startsAt: days(14),
        status: "PUBLISHED",
        // Nothing leaves the school, so there is nothing to consent to.
        requiresParentConsent: false,
      },
      {
        title: "Autumn Science Fair",
        summary: "Entries closed — here so you can see what one looks like.",
        organizerName: "The Science Museum",
        subject: "Science",
        registrationClosesAt: days(-14),
        startsAt: days(-2),
        status: "PUBLISHED",
        requiresParentConsent: true,
      },
      {
        title: "Summer Art Prize",
        summary: "Still being written by the office.",
        organizerName: "Riverside Primary School",
        organizerSchoolId: riversideId,
        status: "DRAFT",
        requiresParentConsent: true,
      },
    ],
  });
}

/* -------------------------------------------------------------------------- */

async function wipe() {
  // Order matters even with cascades: SQLite enforces FKs, and deleting the
  // parents first is the only order that never trips a constraint.
  await db.attendanceRecord.deleteMany();
  await db.attendanceSession.deleteMany();
  await db.grade.deleteMany();
  await db.submission.deleteMany();
  await db.assignment.deleteMany();
  await db.remarkMessage.deleteMany();
  await db.remarkThread.deleteMany();
  await db.reaction.deleteMany();
  await db.comment.deleteMany();
  await db.report.deleteMany();
  await db.post.deleteMany();
  await db.competitionEntry.deleteMany();
  await db.competition.deleteMany();
  await db.notification.deleteMany();
  await db.pushSubscription.deleteMany();
  await db.guardianship.deleteMany();
  await db.enrollment.deleteMany();
  await db.classTeacher.deleteMany();
  await db.class.deleteMany();
  await db.invite.deleteMany();
  await db.authToken.deleteMany();
  await db.session.deleteMany();
  await db.auditLog.deleteMany();
  await db.membership.deleteMany();
  await db.outboundEmail.deleteMany();
  await db.user.deleteMany();
  await db.school.deleteMany();
}

type SeedSchoolInput = {
  name: string;
  timezone: string;
  city: string;
  country: string;
  brandPrimary: string;
  passwordHash: string;
  domain: string;
  /**
   * The grades this school actually teaches.
   *
   * SET, rather than left null, because the operator area flags a school with
   * no range as "Needs setup" — and a freshly seeded install showed that
   * warning against both of its schools, which is the app telling the truth
   * about a gap the SEED left. Found by walking /root in a browser.
   */
  gradeLow: string;
  gradeHigh: string;
  classes: { name: string; subject: string; gradeLevel: string; color: string }[];
  teachers: { name: string; email: string; title: string; subjects: string[] }[];
  students: string[];
};

async function createSchool(input: SeedSchoolInput) {
  const school = await db.school.create({
    data: {
      name: input.name,
      slug: slugify(input.name),
      code: schoolCode(input.name),
      contactEmail: `office@${input.domain}`,
      city: input.city,
      country: input.country,
      timezone: input.timezone,
      gradeLow: input.gradeLow,
      gradeHigh: input.gradeHigh,
      brandPrimary: input.brandPrimary,
      verifiedAt: new Date(),
      onboardingState: "{}",
    },
  });

  // First teacher doubles as the admin, which is how small schools actually run.
  const teachers = [];
  for (const [index, t] of input.teachers.entries()) {
    const user = await db.user.create({
      data: {
        email: t.email,
        name: t.name,
        passwordHash: input.passwordHash,
        emailVerifiedAt: new Date(),
        prefs: JSON.stringify({ theme: "system" }),
      },
    });

    const membership = await db.membership.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        role: "TEACHER",
        status: "ACTIVE",
        title: t.title,
        subjects: JSON.stringify(t.subjects),
      },
    });

    if (index === 0) {
      await db.membership.create({
        data: { userId: user.id, schoolId: school.id, role: "ADMIN", status: "ACTIVE" },
      });
    }

    teachers.push({ userId: user.id, membershipId: membership.id, name: t.name });
  }

  const classes = [];
  for (const c of input.classes) {
    const created = await db.class.create({
      data: {
        schoolId: school.id,
        name: c.name,
        subject: c.subject,
        gradeLevel: c.gradeLevel,
        color: c.color,
        joinCode: classCode(),
      },
    });
    classes.push(created);
  }

  // Every teacher leads their own class; the first teacher co-teaches the rest
  // so "classes I teach" is not trivially "all classes".
  for (const [index, klass] of classes.entries()) {
    const lead = teachers[index % teachers.length]!;
    await db.classTeacher.create({
      data: {
        classId: klass.id,
        schoolId: school.id,
        teacherMembershipId: lead.membershipId,
        role: "LEAD",
      },
    });
  }

  const students = [];
  for (const [index, name] of input.students.entries()) {
    const local = name.toLowerCase().split(" ")[0]!.replace(/[^a-z]/g, "");
    const user = await db.user.create({
      data: {
        email: `${local}@${input.domain}`,
        name,
        preferredName: name.split(" ")[0],
        passwordHash: input.passwordHash,
        // 10 and 11 year olds: below the consent age, so the stricter defaults
        // and parent-consent gates are exercised by the seed.
        birthdate: new Date(Date.UTC(2015 - (index % 2), ((index * 7) % 12) + 1, ((index * 3) % 27) + 1)),
        isMinor: true,
        avatarKey: null,
        prefs: JSON.stringify({ theme: "system" }),
      },
    });

    const membership = await db.membership.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        role: "STUDENT",
        status: "ACTIVE",
        gradeLevel: input.classes[0]?.gradeLevel ?? "5",
        studentCode: studentCode(),
      },
    });

    // Spread students across classes, with the first class getting the bulk so
    // there is one realistically full register.
    const target = index < input.students.length * 0.6 ? classes[0]! : classes[(index % classes.length)]!;
    await db.enrollment.create({
      data: {
        classId: target.id,
        schoolId: school.id,
        studentMembershipId: membership.id,
        status: "ACTIVE",
      },
    });

    students.push({ name, userId: user.id, membershipId: membership.id, classId: target.id });
  }

  return { ...school, classes, teachers, students };
}

/**
 * Which of the ten school days a child misses, counted back from the most
 * recent (0 = the last day marked).
 *
 * The spread is CHOSEN, not emergent. The previous rule rolled one modular
 * expression per (child, day) with roughly a 7% chance of an absence, which over
 * ten days gave every child either 100% or exactly 90% and nothing in between.
 * That looks like plausible data and quietly makes two things untestable: the
 * class page counts children below 90% and always found none, and "Rock solid"
 * (95%) was earned by precisely the children on 100%. A threshold no seeded row
 * ever crosses is a threshold nobody has ever seen work.
 *
 * Over the 18-child roster this gives six on 100%, eight on 90%, two on 80% and
 * two on 70% — four below the line a teacher actually acts on.
 *
 * WHICH days are missed matters as much as how many, because the streak badge
 * reads the most recent run: a child whose only absence is a fortnight ago still
 * has a streak, and one who was out yesterday does not.
 */
function missedSchoolDays(index: number, total: number): Set<number> {
  const missed = new Set<number>();
  const block = (startFromLatest: number, length: number) => {
    for (let i = 0; i < length; i++) {
      const position = startFromLatest + i;
      if (position < total) missed.add(position);
    }
  };

  if (index % 9 === 4) {
    // Off ill for a fortnight, a month ago, and fine since. Whole-window
    // attendance lands below 90% so the teacher still sees them — that follow-up
    // is the point of the tile — while the badges still credit the clean spell
    // either side, because being ill is not a thing a child chose.
    block(Math.floor(total * 0.35), Math.round(total * 0.3));
  } else if (index % 9 === 7) {
    // Off during the last fortnight. Recent, so the streak really is broken.
    block(0, Math.round(total * 0.18));
  } else if (index % 3 !== 0) {
    // The ordinary shape: the odd day here and there, none of them recent.
    for (let i = 1; i <= Math.round(total * 0.08); i++) missed.add((i * 7) % total);
  }
  // index % 3 === 0 misses nothing.

  return missed;
}

async function seedAttendance(school: Awaited<ReturnType<typeof createSchool>>) {
  const today = todayKey(school.timezone);
  const klass = school.classes[0]!;
  const roster = school.students.filter((s) => s.classId === klass.id);
  const teacher = school.teachers[0]!;

  // Nine weeks, skipping weekends — about 45 school days, roughly a term. Today
  // is deliberately left UNMARKED so the teacher's first screen has something to
  // do.
  //
  // It used to be a fortnight, which is ten school days, which is exactly the
  // minimum `bestAttendanceSpell` needs before it will judge a percentage. With
  // one window and no other, "the best stretch" and "the whole window" were the
  // same number, so the badge could not tell an ill fortnight from a bad term
  // and there was no seeded row that showed the difference.
  const schoolDays: string[] = [];
  for (let back = 63; back >= 1; back--) {
    const dateKey = addDaysToKey(today, -back);
    // The school teaches MONDAY TO SATURDAY, so the register runs on Saturdays
    // too. Asking the shared predicate rather than inlining `=== 0 || === 6`
    // again is the whole reason it exists: a seed that skipped Saturdays would
    // quietly disagree with every denominator computed from it.
    if (!isTeachingDay(dateKey)) continue;
    schoolDays.push(dateKey);
  }

  for (const [dayIndex, dateKey] of schoolDays.entries()) {
    // 0 = the most recent school day, which is what missedSchoolDays counts in.
    const fromLatest = schoolDays.length - 1 - dayIndex;

    const session = await db.attendanceSession.create({
      data: {
        schoolId: school.id,
        classId: klass.id,
        dateKey,
        takenByMembershipId: teacher.membershipId,
        finalizedAt: new Date(),
      },
    });

    for (const [index, student] of roster.entries()) {
      const missed = missedSchoolDays(index, schoolDays.length);
      let status: string;

      if (missed.has(fromLatest)) {
        // The oldest of a child's absences is the explained one, so the note
        // and the EXCUSED-counts-against-you rules both get exercised.
        status = fromLatest === Math.max(...missed) ? "EXCUSED" : "ABSENT";
      } else {
        // Sparse and deterministic — no Math.random, so a seeded database is
        // reproducible and a failing test can be re-run against the same data.
        status = (index + fromLatest) % 11 === 0 ? "LATE" : "PRESENT";
      }

      await db.attendanceRecord.create({
        data: {
          sessionId: session.id,
          schoolId: school.id,
          studentMembershipId: student.membershipId,
          status,
          note: status === "EXCUSED" ? "Medical appointment" : null,
        },
      });
    }
  }
}

async function seedAssignments(school: Awaited<ReturnType<typeof createSchool>>) {
  const klass = school.classes[0]!;
  const teacher = school.teachers[0]!;
  const roster = school.students.filter((s) => s.classId === klass.id);
  const today = todayKey(school.timezone);

  const specs = [
    { title: "Fractions worksheet 3", points: 20, dueIn: -3, category: "Homework" },
    { title: "Reading journal — chapter 4", points: 10, dueIn: 1, category: "Reading" },
    { title: "Water cycle poster", points: 30, dueIn: 5, category: "Project" },
  ];

  for (const spec of specs) {
    const assignment = await db.assignment.create({
      data: {
        schoolId: school.id,
        classId: klass.id,
        authorMembershipId: teacher.membershipId,
        title: spec.title,
        body: "See the sheet handed out in class. Ask me if anything is unclear.",
        category: spec.category,
        pointsMilli: spec.points * 1000,
        dueAt: new Date(`${addDaysToKey(today, spec.dueIn)}T16:00:00Z`),
        publishedAt: new Date(),
      },
    });

    // Only the overdue assignment has been graded.
    if (spec.dueIn >= 0) continue;

    for (const [index, student] of roster.entries()) {
      const submitted = index % 9 !== 0; // roughly one in nine did not hand it in
      if (!submitted) continue;

      const submission = await db.submission.create({
        data: {
          schoolId: school.id,
          assignmentId: assignment.id,
          studentMembershipId: student.membershipId,
          status: "RETURNED",
          body: "Handed in.",
          submittedAt: new Date(),
        },
      });

      // Scores in integer thousandths — never floats. (§10)
      const scoreMilli = (spec.points - ((index * 3) % 7)) * 1000 + (index % 2 === 0 ? 500 : 0);

      await db.grade.create({
        data: {
          schoolId: school.id,
          assignmentId: assignment.id,
          studentMembershipId: student.membershipId,
          submissionId: submission.id,
          scoreMilli: Math.min(scoreMilli, spec.points * 1000),
          gradedByMembershipId: teacher.membershipId,
          comment: index % 5 === 0 ? "Lovely working out — keep showing your steps." : null,
        },
      });
    }
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
