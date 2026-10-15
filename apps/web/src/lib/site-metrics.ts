import "server-only";
import { SITE_METRICS, type SiteMetric } from "@edulink/contracts";
import { db } from "./db";
import { readJson } from "./json";
import { todayKey } from "./dates";
import { forSchool } from "./tenant-context";
import { placementOn, placementSettings } from "./placement";
import { placementTable } from "./placement-analytics";
import { batchStudents } from "./placement-record";

/**
 * THE NUMBERS A SCHOOL'S WEBSITE MAY SHOW (website-builder A, 15 October 2026) — AND ONLY THESE.
 *
 * A public site is read by anyone, so what it carries is the school's own public words and AGGREGATES: one
 * number for the whole school, never a name, never a class-level figure, never anything about one person.
 * The list (website-shared.md; SITE_METRICS in packages/contracts v1/website.ts):
 *
 *   PUPILS               pupils enrolled: ACTIVE student memberships still on the roll (a count);
 *   TEACHING_STAFF       teaching staff: distinct people holding an ACTIVE TEACHER, PRINCIPAL, FACULTY or HOD
 *                        membership (a count);
 *   ATTENDANCE_MONTH     attendance this month, school-wide: present and late over every mark in the class
 *                        registers dated this calendar month in the school's zone (one percentage) — summed
 *                        over the school as insights.ts schoolSummary does, recomputed here because that
 *                        library reads for a signed-in head and the nightly job has nobody signed in;
 *   CLASSES              classes offered: the distinct grade levels of the classes not archived (a count);
 *   BOARD                the board or affiliation, as the office typed it on the About screen (text);
 *   YEARS_SINCE_FOUNDING years since the founding year the office typed, when it typed one;
 *   PASS_RATE            the result pass rate where the school has recorded results: the latest PUBLISHED
 *                        result run's own summary (passed over students, exam-cell-results.ts) — one
 *                        percentage; a school with no published run shows nothing;
 *   PROGRAMMES           a college's programmes not archived (a count);
 *   PLACEMENT_OFFERS     this season's placement offers (placement-analytics.ts placementTable `offers`);
 *   PLACEMENT_HIGHEST    the highest package among this season's standing offers, and
 *   PLACEMENT_MEDIAN     the median best package of the placed (placementTable `medianSalaryRupees`),
 *                        both only when the college runs placement and has offers this season.
 *
 * A number the school has no data for is LEFT OUT, never shown as zero or a dash: "0 % attendance" on a site
 * whose school simply does not keep registers here would be a lie. Every read runs under the school's own
 * binding (`forSchool`), so the admin's page and the nightly job get the same answer.
 */

export type SiteNumber =
  | { metric: SiteMetric; kind: "count" | "percent" | "rupees" | "years"; value: number }
  | { metric: SiteMetric; kind: "text"; value: string };

const TEACHING_ROLES = ["TEACHER", "PRINCIPAL", "FACULTY", "HOD"] as const;

/** Every number the school has data for, in SITE_METRICS order. `board` and `foundedYear` are the draft's own. */
export async function siteMetrics(schoolId: string, input: { board: string; foundedYear: number | null }, now: Date = new Date()): Promise<SiteNumber[]> {
  return forSchool(schoolId, async () => {
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true, kind: true } });
    if (!school) return [];
    const college = school.kind === "COLLEGE" || school.kind === "AUTONOMOUS_COLLEGE";
    const month = todayKey(school.timezone, now).slice(0, 7);

    const [pupils, staff, attendance, grades, classCount, passRate, programmes, placement] = await Promise.all([
      db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
      db.membership.findMany({ where: { schoolId, role: { in: [...TEACHING_ROLES] }, status: "ACTIVE", leftAt: null }, select: { userId: true }, distinct: ["userId"] }),
      db.attendanceRecord.groupBy({ by: ["status"], where: { schoolId, session: { dateKey: { gte: `${month}-01`, lte: `${month}-31` } } }, _count: { _all: true } }),
      db.class.findMany({ where: { schoolId, archivedAt: null, gradeLevel: { not: null } }, select: { gradeLevel: true }, distinct: ["gradeLevel"] }),
      db.class.count({ where: { schoolId, archivedAt: null } }),
      latestPassRate(schoolId),
      college ? db.programme.count({ where: { schoolId, archivedAt: null } }) : Promise.resolve(0),
      college ? placementNumbers(schoolId) : Promise.resolve(null),
    ]);

    let present = 0;
    let marks = 0;
    for (const row of attendance) {
      marks += row._count._all;
      if (row.status === "PRESENT" || row.status === "LATE") present += row._count._all;
    }

    const out: SiteNumber[] = [];
    const add = (n: SiteNumber) => out.push(n);
    if (pupils > 0) add({ metric: "PUPILS", kind: "count", value: pupils });
    if (staff.length > 0) add({ metric: "TEACHING_STAFF", kind: "count", value: staff.length });
    if (marks > 0) add({ metric: "ATTENDANCE_MONTH", kind: "percent", value: Math.round((present * 100) / marks) });
    const classes = grades.length > 0 ? grades.length : classCount;
    if (!college && classes > 0) add({ metric: "CLASSES", kind: "count", value: classes });
    if (input.board.trim()) add({ metric: "BOARD", kind: "text", value: input.board.trim() });
    const year = Number(todayKey(school.timezone, now).slice(0, 4));
    if (input.foundedYear !== null && input.foundedYear <= year) add({ metric: "YEARS_SINCE_FOUNDING", kind: "years", value: year - input.foundedYear });
    if (passRate !== null) add({ metric: "PASS_RATE", kind: "percent", value: passRate });
    if (programmes > 0) add({ metric: "PROGRAMMES", kind: "count", value: programmes });
    if (placement && placement.offers > 0) {
      add({ metric: "PLACEMENT_OFFERS", kind: "count", value: placement.offers });
      if (placement.highest !== null) add({ metric: "PLACEMENT_HIGHEST", kind: "rupees", value: placement.highest });
      if (placement.median !== null) add({ metric: "PLACEMENT_MEDIAN", kind: "rupees", value: placement.median });
    }
    return SITE_METRICS.flatMap((m) => out.filter((n) => n.metric === m));
  });
}

/** The latest published result run's pass rate (its own stored summary), or null when there is none. */
async function latestPassRate(schoolId: string): Promise<number | null> {
  const run = await db.resultRun.findFirst({ where: { schoolId, status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, select: { summaryJson: true } });
  if (!run) return null;
  const summary = readJson<{ students?: number; passed?: number }>(run.summaryJson, {});
  const students = Number(summary.students ?? 0);
  const passed = Number(summary.passed ?? 0);
  if (!Number.isFinite(students) || students <= 0 || !Number.isFinite(passed)) return null;
  return Math.round((Math.min(passed, students) * 100) / students);
}

/** This season's offers, highest and median package, when the college runs placement. */
async function placementNumbers(schoolId: string): Promise<{ offers: number; highest: number | null; median: number | null } | null> {
  if (!(await placementOn(schoolId))) return null;
  const { seasonBatchYear } = await placementSettings(schoolId);
  const table = await placementTable(schoolId, seasonBatchYear);
  if (table.offers === 0) return { offers: 0, highest: null, median: null };
  const ids = (await batchStudents(schoolId, seasonBatchYear)).map((s) => s.id);
  const top = ids.length ? await db.offer.aggregate({ where: { schoolId, studentMembershipId: { in: ids }, declinedAt: null }, _max: { packageRupees: true } }) : null;
  return { offers: table.offers, highest: top?._max.packageRupees ?? null, median: table.medianSalaryRupees };
}

/** A stable fingerprint of the numbers, so the nightly job stores a new version only when one changed. */
export function numbersHash(numbers: SiteNumber[]): string {
  return numbers.map((n) => `${n.metric}=${n.value}`).join("|");
}
