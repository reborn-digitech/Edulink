/**
 * Demo data for the features `prisma/seed.ts` does not cover.
 *
 * WHY THIS EXISTS SEPARATELY. The main seed creates schools, people, classes,
 * attendance and marks — everything the app had when it was written. Four
 * features shipped after it and left it behind: the academic year, the school
 * calendar, the global feed and Experts. A freshly seeded database therefore
 * shows all four as EMPTY, which is indistinguishable from broken to anybody
 * testing by hand, and is why the route sweep passed for weeks against pages
 * that had never rendered a single row.
 *
 * IDEMPOTENT. Every write is find-or-create keyed on something stable, so
 * running it twice changes nothing and running it after `db:seed` is safe.
 *
 * Run: npm run demo:seed
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { config } from "dotenv";
import { fixtureExpertStanding, standingRepair } from "./zz-expert-standing"; // TA-583

config();
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

const EXPERT_EMAIL = "anjali.rao@expert.test";
// The same password and parameters as prisma/seed.ts, so the expert can be
// logged into by hand like every other demo account. An expert account with no
// password is an account nobody can test.
const PASSWORD = "copper-lantern-47-brook";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const done: string[] = [];

async function main() {
  const riverside = await db.school.findFirst({
    where: { memberships: { some: { user: { email: "priya@riverside.school" } } } },
    select: { id: true, name: true },
  });
  if (!riverside) {
    console.error("No seeded school found. Run `npm run db:seed` first.");
    process.exit(1);
  }

  /* ---- a principal for Riverside ---------------------------------------- */
  // The main seed predates the PRINCIPAL role, so a fresh database has nobody
  // to show the leave-approval and whole-school views. Same password as every
  // other demo account, for the same reason as the expert below.
  const passwordHash = await hash(PASSWORD, ARGON);
  const principalUser = await db.user.upsert({
    where: { email: "meera@riverside.school" },
    create: {
      email: "meera@riverside.school",
      name: "Meera Nair",
      prefs: "{}",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash },
  });
  const principalMembership = await db.membership.findUnique({
    where: {
      userId_schoolId_role: {
        userId: principalUser.id,
        schoolId: riverside.id,
        role: "PRINCIPAL",
      },
    },
  });
  if (!principalMembership) {
    await db.membership.create({
      data: {
        userId: principalUser.id,
        schoolId: riverside.id,
        role: "PRINCIPAL",
        status: "ACTIVE",
        title: "Principal",
      },
    });
    done.push("principal Meera Nair at Riverside");
  }

  /* ---- academic year + calendar ---------------------------------------- */
  // Keyed on the UNIQUE field (schoolId, name), not on `isCurrent` — a year that
  // exists but is not current is exactly the state a second run finds, and
  // looking it up by `isCurrent` makes the script create a duplicate and fail.
  const existingYear = await db.academicYear.findFirst({
    where: { schoolId: riverside.id, name: "2026–27" },
  });
  const anyCurrent = await db.academicYear.findFirst({
    where: { schoolId: riverside.id, isCurrent: true },
    select: { id: true },
  });
  const year =
    existingYear ??
    (await db.academicYear.create({
      data: {
        schoolId: riverside.id,
        name: "2026–27",
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        endDate: new Date("2027-04-30T00:00:00.000Z"),
        isCurrent: anyCurrent === null,
      },
    }));
  if (!anyCurrent) {
    await db.academicYear.update({ where: { id: year.id }, data: { isCurrent: true } });
  }
  done.push(`academic year ${year.name}`);

  const entries = [
    { name: "Independence Day", startDateKey: "2026-08-15", endDateKey: "2026-08-15", kind: "HOLIDAY" },
    { name: "Ganesh Chaturthi", startDateKey: "2026-09-14", endDateKey: "2026-09-16", kind: "HOLIDAY" },
    { name: "Half-yearly exams", startDateKey: "2026-10-05", endDateKey: "2026-10-14", kind: "EXAM" },
    { name: "Diwali break", startDateKey: "2026-11-06", endDateKey: "2026-11-14", kind: "HOLIDAY" },
    { name: "Annual sports day", startDateKey: "2026-12-12", endDateKey: "2026-12-12", kind: "EVENT" },
  ];
  let madeEntries = 0;
  for (const entry of entries) {
    const exists = await db.holiday.findFirst({
      where: { schoolId: riverside.id, name: entry.name, startDateKey: entry.startDateKey },
    });
    if (exists) continue;
    await db.holiday.create({
      data: { ...entry, schoolId: riverside.id, academicYearId: year.id },
    });
    madeEntries++;
  }
  done.push(`${madeEntries} calendar entries (${entries.length} total)`);

  // NOTE: grade weights are deliberately NOT seeded. Adding them makes any
  // uncategorised work in that class stop counting towards the overall mark --
  // which is the correct, documented behaviour, and exactly why it should be a
  // deliberate step taken through the UI while testing rather than a hidden
  // default that quietly changes every number on a report card.

  /* ---- a global-feed post ---------------------------------------------- */
  const author = await db.user.findFirst({ where: { email: "priya@riverside.school" } });
  if (author) {
    const TITLE = "Inter-school science fair — all schools welcome";
    const existing = await db.post.findFirst({ where: { title: TITLE } });
    if (!existing) {
      await db.post.create({
        data: {
          schoolId: riverside.id,
          authorUserId: author.id,
          scope: "GLOBAL",
          title: TITLE,
          body: "We are opening our science fair to every school on EduLink. Entries close at the end of the month.",
          status: "APPROVED",
          globalSchoolName: riverside.name,
          tags: JSON.stringify(["science", "open"]),
        },
      });
      done.push("1 global-feed post");
    }
  }

  /* ---- a published expert with free slots ------------------------------ */
  const expertUser = await db.user.upsert({
    where: { email: EXPERT_EMAIL },
    create: { email: EXPERT_EMAIL, name: "Dr Anjali Rao", prefs: "{}", passwordHash },
    update: { passwordHash },
  });

  const profile =
    (await db.expertProfile.findUnique({ where: { userId: expertUser.id } })) ??
    (await db.expertProfile.create({
      data: {
        userId: expertUser.id,
        headline: "Careers guidance and university applications",
        bio: "Fifteen years advising secondary students on engineering and medicine routes.",
        organisation: "National Careers Trust",
        specialisms: JSON.stringify(["Careers", "University applications"]),
        publishedAt: new Date(),
        // verifiedAt and kycStatus together, never verifiedAt alone (TA-583: the badge's one truth).
        ...fixtureExpertStanding(true, new Date(), "demo-seed"),
      },
    }));
  // A profile an earlier run made with verifiedAt alone is put in step (TA-583); one that agrees with itself is left.
  const standing = standingRepair(profile, true, new Date(), "demo-seed");
  if (standing) await db.expertProfile.update({ where: { id: profile.id }, data: standing });

  const slotCount = await db.expertSlot.count({ where: { expertProfileId: profile.id } });
  if (slotCount === 0) {
    const day = 86_400_000;
    for (const [index, note] of ["Careers clinic", "University applications", "Open questions"].entries()) {
      const startsAt = new Date(Date.now() + (index + 3) * day);
      startsAt.setUTCHours(10, 0, 0, 0);
      await db.expertSlot.create({
        data: {
          expertProfileId: profile.id,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 3_600_000),
          note,
        },
      });
    }
    done.push("expert Dr Anjali Rao with 3 free slots");
  }

  console.log("\nDemo data ready:\n");
  for (const line of done) console.log(`  · ${line}`);
  console.log(`
  One account per role, all at Riverside Primary except the expert,
  all with the password ${PASSWORD}:

    PRINCIPAL  meera@riverside.school
    ADMIN      priya@riverside.school
    TEACHER    tom@riverside.school
    STUDENT    amara@riverside.school
    PARENT     parent@example.com        (children in both seeded schools)
    EXPERT     ${EXPERT_EMAIL}
`);
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
