/**
 * QA-73 (QA campaign of 24 October 2026, UI-13): the Playwright harness's own exam ("ZZ E2E Unit Test", made by
 * e2e/global-setup.ts so the viewport matrix can open a marks sheet) stayed behind after every run and sat on the
 * fixture teacher's home, "0 of 6 marked", in every picture taken afterwards. The run's teardown and zz:fixtures now
 * remove it through removeHarnessExam: the series, its papers and the sittings the marks sheet made, at the one
 * school named, and nothing else.
 *
 * At two ZZ schools of this suite's own (people at @test.invalid), deleted by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { HARNESS_EXAM_NAME, removeHarnessExam } from "../e2e/harness-exam";

const db = new PrismaClient();
const STAMP = Date.now();
const schools: string[] = [];

async function schoolWithExams(tag: string, names: string[]) {
  const schoolId = (await db.school.create({ data: { name: `ZZ Harness Exam ${tag} ${STAMP}`, slug: `zz-harness-exam-${tag}-${STAMP}`, code: `ZHE${tag}${String(STAMP).slice(-5)}`, contactEmail: `zz-harness-exam-${tag}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", locale: "en", gradeLow: "1", gradeHigh: "10" }, select: { id: true } })).id;
  schools.push(schoolId);
  const userId = (await db.user.create({ data: { name: `ZZ Harness Teacher ${tag}`, email: `zz-harness-exam-${tag}-${STAMP}-t@test.invalid` }, select: { id: true } })).id;
  const teacher = (await db.membership.create({ data: { userId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const classId = (await db.class.create({ data: { schoolId, name: "ZZ Grade 10 · A", gradeLevel: "10", section: "A", joinCode: `zzhe${tag}${STAMP}`.slice(0, 20) }, select: { id: true } })).id;
  const made: Record<string, { seriesId: string; slotId: string; assignmentId: string }> = {};
  for (const name of names) {
    const series = await db.examSeries.create({ data: { schoolId, name, gradeLevel: "10", slots: { create: { schoolId, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 } } }, select: { id: true, slots: { select: { id: true } } } });
    const slotId = series.slots[0]!.id;
    const assignmentId = (await db.assignment.create({ data: { schoolId, classId, authorMembershipId: teacher, title: `${name} · Mathematics`, pointsMilli: 50_000, examSlotId: slotId }, select: { id: true } })).id;
    made[name] = { seriesId: series.id, slotId, assignmentId };
  }
  return { schoolId, made };
}

let here: Awaited<ReturnType<typeof schoolWithExams>>;
let elsewhere: Awaited<ReturnType<typeof schoolWithExams>>;

beforeAll(async () => {
  here = await schoolWithExams("a", [HARNESS_EXAM_NAME, "ZZ Unit Test 1"]);
  elsewhere = await schoolWithExams("b", [HARNESS_EXAM_NAME]);
});

afterAll(async () => {
  for (const id of schools) await db.school.deleteMany({ where: { id } });
  await db.user.deleteMany({ where: { email: { startsWith: "zz-harness-exam-", endsWith: `-${STAMP}-t@test.invalid` } } });
  await db.$disconnect();
});

describe("the harness's exam is removed after a run", () => {
  it("takes the series, its paper and its sitting at the school named, and leaves every other exam", async () => {
    const harness = here.made[HARNESS_EXAM_NAME]!;
    const kept = here.made["ZZ Unit Test 1"]!;
    expect(await removeHarnessExam(db, here.schoolId)).toEqual({ series: 1, sittings: 1 });
    expect(await db.examSeries.count({ where: { id: harness.seriesId } })).toBe(0);
    expect(await db.examSlot.count({ where: { id: harness.slotId } })).toBe(0);
    // The sitting goes too: left to the relation's SetNull it would stay on the class as an orphaned paper.
    expect(await db.assignment.count({ where: { id: harness.assignmentId } })).toBe(0);
    expect(await db.examSeries.count({ where: { id: kept.seriesId } })).toBe(1);
    expect(await db.assignment.findUnique({ where: { id: kept.assignmentId }, select: { examSlotId: true } })).toEqual({ examSlotId: kept.slotId });
    // Another school's exam of the same name is not this school's to remove.
    expect(await db.examSeries.count({ where: { id: elsewhere.made[HARNESS_EXAM_NAME]!.seriesId } })).toBe(1);
  });

  it("is a no-op the second time", async () => {
    expect(await removeHarnessExam(db, here.schoolId)).toEqual({ series: 0, sittings: 0 });
  });
});
