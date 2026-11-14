/**
 * The owner's decision on TA-388 of the testing analysis of 13 November 2026.
 *
 * TA-388: the progress report's overall counted every marked piece of the last
 * twelve weeks, exam papers included, while the family's home tile counted
 * homework only, from all time, under the label "Average grade", so the number
 * a guardian saw on the home page was found nowhere on the report printed from
 * the same account. Now the report prints a homework average and a tests
 * average for its twelve weeks with the overall beneath, and the home tile, on
 * the web and on the phone (GET /api/v1/family/overview), is labelled Homework
 * average and counts the same twelve weeks, so the home number is the report's
 * homework average.
 *
 * One ZZ school of this suite's own, made through the owner connection and
 * removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { buildProgressReport, DEFAULT_REPORT_DAYS, isHomeWindow } from "@/lib/reports";
import { parentOverview } from "@/lib/api-reads/family";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-388-${who}-${STAMP}@test.invalid`;
const DAY = 24 * 60 * 60 * 1000;
const ids: Record<string, string> = {};

function ctx(who: string, role: "PARENT" | "STUDENT"): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: role === "PARENT" ? null : ids[`${who}M`]!,
    schoolId: role === "PARENT" ? null : ids.school!,
    role,
    user: { id: ids[who]!, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false },
  } as ActiveContext;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA 388 ${STAMP}`, slug: `zz-ta-388-${STAMP}`, code: `Z388${SUFFIX}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  for (const who of ["teacher", "pupil", "parent"]) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA 388 ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  }
  ids.teacherM = (await db.membership.create({ data: { userId: ids.teacher!, schoolId: S, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: S, role: "STUDENT", status: "ACTIVE", studentCode: `Z388${STAMP}`, gradeLevel: "6" }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: S, name: "ZZ TA 6A", gradeLevel: "6", joinCode: `Z388${SUFFIX}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId: S, classId: klass.id, teacherMembershipId: ids.teacherM!, role: "LEAD" } });
  await db.enrollment.create({ data: { schoolId: S, classId: klass.id, studentMembershipId: ids.pupilM!, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.pupilM!, studentSchoolId: S, relation: "PARENT", status: "ACTIVE" } });

  const now = Date.now();
  const work = async (title: string, points: number, score: number, daysAgo: number, examSlotId: string | null = null) => {
    const a = await db.assignment.create({
      data: { schoolId: S, classId: klass.id, authorMembershipId: ids.teacherM!, title, category: examSlotId ? "Exam" : "Homework", pointsMilli: points * 1000, publishedAt: new Date(now - (daysAgo + 1) * DAY), examSlotId },
      select: { id: true },
    });
    await db.grade.create({ data: { schoolId: S, assignmentId: a.id, studentMembershipId: ids.pupilM!, scoreMilli: score * 1000, gradedAt: new Date(now - daysAgo * DAY) } });
  };
  // Inside the twelve weeks: one piece of homework at 90 %, and a unit-test paper of 80 marks at 50 %.
  await work("ZZ TA 388 reading log", 100, 90, 10);
  const series = await db.examSeries.create({ data: { schoolId: S, name: "ZZ TA 388 unit test", gradeLevel: "6", kind: "UNIT_TEST" }, select: { id: true } });
  const slot = await db.examSlot.create({ data: { schoolId: S, seriesId: series.id, subject: "Mathematics", dateKey: new Date(now - 6 * DAY).toISOString().slice(0, 10), pointsMilli: 80_000 }, select: { id: true } });
  await work("ZZ TA 388 unit test paper", 80, 40, 5, slot.id);
  // Long before the twelve weeks: a piece of homework at 30 %, which neither figure may count.
  await work("ZZ TA 388 old worksheet", 100, 30, DEFAULT_REPORT_DAYS + 120);
});

afterAll(async () => {
  if (ids.school) {
    await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { email: { startsWith: "zz-ta-388-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-388: the home tile's number is found on the progress report", () => {
  it("TA-388: the report prints a homework average and a tests average for its twelve weeks, with the overall of both beneath", async () => {
    const report = await buildProgressReport(ctx("parent", "PARENT"), ids.pupilM!);
    expect(report.grades.homeworkPercent).toBe(90);
    expect(report.grades.homeworkCount).toBe(1);
    expect(report.grades.testsPercent).toBe(50);
    expect(report.grades.testsCount).toBe(1);
    // The overall still counts all marked work of the window: (90 + 40) of (100 + 80).
    expect(report.grades.overallPercent).toBe(72);
    expect(report.grades.marked.map((m) => m.title).sort()).toEqual(["ZZ TA 388 reading log", "ZZ TA 388 unit test paper"]);
  });

  it("TA-388: the family's home (the door the phone reads) counts homework of the same twelve weeks, and its figure is the report's homework average", async () => {
    const report = await buildProgressReport(ctx("parent", "PARENT"), ids.pupilM!);
    const home = await parentOverview(ctx("parent", "PARENT"), ids.pupilM!);
    // Not 60 (all time, the old worksheet counted) and not 72 (the paper counted).
    expect(home.averagePercent).toBe(90);
    expect(home.scoredCount).toBe(1);
    expect(home.averagePercent).toBe(report.grades.homeworkPercent);
    expect(home.scoredCount).toBe(report.grades.homeworkCount);
  });

  it("TA-388: the pupil's own report reads the same two averages", async () => {
    const report = await buildProgressReport(ctx("pupil", "STUDENT"), ids.pupilM!);
    expect([report.grades.homeworkPercent, report.grades.testsPercent]).toEqual([90, 50]);
  });

  it("TA-388: the web home tile is labelled Homework average and reads the shared twelve-week figure; the report page prints both averages above the overall", () => {
    const home = readFileSync(resolve(__dirname, "../src/app/(app)/parent/page.tsx"), "utf8");
    expect(home).toContain("homeworkAverage(");
    expect(home).toContain('t("parent.homeworkAverage")');
    expect(home).not.toContain('t("parent.averageGrade")');
    const phone = readFileSync(resolve(__dirname, "../../mobile/src/screens/family/parent-home.tsx"), "utf8");
    expect(phone).toContain('t("parent.homeworkAverage")');
    expect(phone).not.toContain('t("parent.averageGrade")');
    const page = readFileSync(resolve(__dirname, "../src/app/(app)/reports/[studentMembershipId]/page.tsx"), "utf8");
    const homework = page.indexOf('t("reportView.homeworkAverage")');
    const tests = page.indexOf('t("reportView.testsAverage")');
    const overall = page.indexOf('t("reportView.overallAcrossMany"');
    expect(homework).toBeGreaterThan(-1);
    expect(tests).toBeGreaterThan(homework);
    expect(overall).toBeGreaterThan(tests);
  });

  it("TA-388: the new sentences and the report's overall line have Hindi and Marathi wording", () => {
    expect(en.parent.homeworkAverage).toBe("Homework average");
    for (const key of ["homeworkAverage", "homeworkAcrossPieces", "homeworkAcrossPiecesOne", "homeworkNoneMarked"] as const) {
      expect(hi.parent[key]).not.toBe(en.parent[key]);
      expect(mr.parent[key]).not.toBe(en.parent[key]);
    }
    for (const key of ["overallAcrossOne", "overallAcrossMany", "homeworkAverage", "testsAverage", "homeworkCountOne", "homeworkCountMany", "testsCountOne", "testsCountMany", "noneMarkedHere", "averagesExplainer"] as const) {
      expect(hi.reportView[key]).not.toBe(en.reportView[key]);
      expect(mr.reportView[key]).not.toBe(en.reportView[key]);
    }
    expect(hi.reportView.overallAcrossMany.endsWith("।")).toBe(true);
    expect(mr.reportView.overallAcrossMany.endsWith(".")).toBe(true);
    expect(hi.reportView.averagesExplainer.endsWith("।")).toBe(true);
    expect(mr.reportView.averagesExplainer.endsWith(".")).toBe(true);
    // The home tile's sentences say twelve weeks because the report's window is twelve weeks.
    expect(DEFAULT_REPORT_DAYS).toBe(84);
    expect(en.parent.homeworkAcrossPieces).toContain("12 weeks");
  });
});

describe("TA-388: the second reader's repairs", () => {
  it("TA-388: the report says the homework average is the home figure only for the home tile's own twelve weeks, not for a custom from and to", () => {
    const now = new Date("2026-11-14T06:30:00Z");
    const tz = "Asia/Kolkata";
    // The window the report opens with when no ?from=&to= is given.
    expect(isHomeWindow({ fromKey: "2026-08-22", toKey: "2026-11-14" }, tz, now)).toBe(true);
    // A custom window: another start, another end, or both.
    expect(isHomeWindow({ fromKey: "2026-09-01", toKey: "2026-11-14" }, tz, now)).toBe(false);
    expect(isHomeWindow({ fromKey: "2026-08-22", toKey: "2026-11-13" }, tz, now)).toBe(false);
    expect(isHomeWindow({ fromKey: "2026-05-01", toKey: "2026-06-30" }, tz, now)).toBe(false);
    const page = readFileSync(resolve(__dirname, "../src/app/(app)/reports/[studentMembershipId]/page.tsx"), "utf8");
    const gate = page.indexOf("isHomeWindow(report.window, report.school.timezone)");
    const explainer = page.indexOf('t("reportView.averagesExplainer")');
    expect(gate).toBeGreaterThan(-1);
    expect(explainer).toBeGreaterThan(gate);
    // The explainer is printed in one place only, inside that condition.
    expect(page.indexOf('t("reportView.averagesExplainer")', explainer + 1)).toBe(-1);
  });

  it("TA-388: the guardian's guide (the assistant's corpus) names the tile Homework average over the last twelve weeks", () => {
    const guide = readFileSync(resolve(__dirname, "../../../docs/guide/guardian.md"), "utf8");
    expect(guide).not.toContain('"Average grade"');
    expect(guide).toContain(`"${en.parent.homeworkAverage}" across the homework marked in the last twelve weeks`);
    expect(guide).toContain(`"${en.reportView.testsAverage}"`);
  });
});
