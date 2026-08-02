/**
 * Counts who holds which badge in the seeded class, under whatever rule
 * badges.ts currently implements.
 *
 * Exists because the README quoted counts measured under the OLD "best spell in
 * the window" rule and those numbers stopped being true the moment the rule was
 * reversed. Re-measured rather than reasoned about.
 *
 * Run: tsx --tsconfig scripts/tsconfig.json scripts/badge-count.ts
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
// The PURE helpers only. `getAttendanceSummary` reads through the RLS-bound app
// client, which outside a request has no tenant set and returns zero rows for
// everybody — a measurement script that used it would report "no badges" with
// total confidence. The register is read here on the admin connection instead.
import { computeStreak, currentAttendanceRate } from "../src/lib/attendance";
import type { AttendanceStatus } from "../src/lib/constants";

config();

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

// The same constant badges.ts uses. Imported by value would drag server-only in.
const MIN_DAYS = 20;

async function main() {
  const klass = await db.class.findFirstOrThrow({
    where: { archivedAt: null },
    include: { school: { select: { timezone: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const year = await db.academicYear.findFirst({
    where: { schoolId: klass.schoolId, isCurrent: true },
    select: { name: true, startDate: true },
  });

  const enrolments = await db.enrollment.findMany({
    where: { classId: klass.id, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });

  const today = new Date().toISOString().slice(0, 10);
  const windowStart = year
    ? year.startDate.toISOString().slice(0, 10)
    : new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);

  let rockSolid = 0;
  let hereAllWeek = 0;
  let notEnough = 0;
  const percents: number[] = [];

  for (const row of enrolments) {
    const records = await db.attendanceRecord.findMany({
      where: {
        schoolId: klass.schoolId,
        studentMembershipId: row.studentMembershipId,
        session: { dateKey: { gte: windowStart, lte: today } },
      },
      include: { session: { select: { dateKey: true } } },
    });
    const days = records.map((r) => ({
      dateKey: r.session.dateKey,
      status: r.status as AttendanceStatus,
    }));

    const rate = currentAttendanceRate(days, MIN_DAYS);
    const streak = computeStreak(days);

    if (rate === null) notEnough++;
    else {
      percents.push(rate);
      if (rate >= 95) rockSolid++;
    }
    if (streak >= 5) hereAllWeek++;
  }

  console.log(`class:        ${klass.name} (${klass.school.name})`);
  console.log(`academic year: ${year ? year.name : "none — 60-day fallback"}`);
  console.log(`window:       ${windowStart} → ${today}`);
  console.log(`students:     ${enrolments.length}`);
  console.log(`Rock solid (current rate ≥95% over last ${MIN_DAYS} days): ${rockSolid}`);
  console.log(`Here all week (current streak ≥5):                        ${hereAllWeek}`);
  console.log(`Not enough history to judge:                              ${notEnough}`);
  console.log(`rates: ${percents.sort((a, b) => b - a).join(", ")}`);

  await db.$disconnect();
}

main();
