import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cardsForClass, generateCards, getCard, gradingHintKey, publishCards } from "@/lib/report-cards";
import { bandFor, DEFAULT_REPORT_CARD_CONFIG, shownPercent } from "@/lib/report-card-rules";
import type { ActiveContext } from "@/lib/session";

/**
 * The figures on a report card, cell by cell — the data-flow audit's gaps 15
 * and 16 and its UTC list, for the card.
 *
 * A school of its own, in Asia/Kolkata, whose exam kinds carry no weight, so
 * every card it makes is "marks over maximum" and the overall must be the
 * sum of the rows; a second school is not needed because the weighted rule
 * is pinned by api-v1-report-cards.test.ts. The rows carry the marks they
 * were made from, every percent is rounded once to the decimal the card
 * prints and banded from that, the card prints the legal name, the class
 * label freezes when the cards go out, and "issued on" is the school's day.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const suffix = String(STAMP).slice(-6);

let schoolId = "";
let classId = "";
let teacher: ActiveContext;
let pupilA = ""; // Maths 50/100, Science 50/50 → rows 50.0 and 100.0, overall 100/150 = 66.7
let pupilB = ""; // Maths 90.96/100 only → 91.0 → the band of 91.0, not of 90.96
let maths = "";
let science = "";

function ctx(userId: string, membershipId: string, role: "TEACHER"): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId,
    role,
    user: {
      id: userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: {
        name: `ZZ Figures School ${STAMP}`,
        slug: `zz-figures-${STAMP}`,
        code: `ZY${suffix}`,
        contactEmail: `zz-figures-${STAMP}@test.invalid`,
        timezone: "Asia/Kolkata",
        // No kind carries weight: every subject and the overall are marks over maximum.
        reportCardConfig: JSON.stringify({ ...DEFAULT_REPORT_CARD_CONFIG, kindWeights: { UNIT_TEST: 0, MID_TERM: 0, FINAL: 0 } }),
      },
      select: { id: true },
    })
  ).id;
  const mk = (who: string, preferredName: string | null = null) =>
    db.user.create({ data: { name: `ZZ Figures ${who}`, preferredName, email: `zz-figures-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [lead, a, b] = await Promise.all([mk("Teacher"), mk("Aarav Apte", "Chintu"), mk("Bhakti Bhosale")]);
  const tm = await db.membership.create({ data: { userId: lead.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  teacher = ctx(lead.id, tm.id, "TEACHER");
  pupilA = (await db.membership.create({ data: { userId: a.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFA${STAMP}` }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: b.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFB${STAMP}` }, select: { id: true } })).id;
  classId = (await db.class.create({ data: { schoolId, name: "ZZ 6", section: "A", gradeLevel: "6", joinCode: `ZF1${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId, classId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.createMany({ data: [{ schoolId, classId, studentMembershipId: pupilA, status: "ACTIVE" }, { schoolId, classId, studentMembershipId: pupilB, status: "ACTIVE" }] });

  const series = await db.examSeries.create({ data: { schoolId, name: "ZZ Mid-term", gradeLevel: "6", kind: "MID_TERM", publishedAt: new Date(), createdByMembershipId: tm.id }, select: { id: true } });
  const paper = async (subject: string, max: number, dateKey: string, position: number) => {
    const slot = await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject, dateKey, pointsMilli: max * 1000, position }, select: { id: true } });
    return (await db.assignment.create({ data: { schoolId, classId, authorMembershipId: tm.id, title: `ZZ Mid-term · ${subject}`, category: "Exam", pointsMilli: max * 1000, examSlotId: slot.id, publishedAt: new Date() }, select: { id: true } })).id;
  };
  // Different maximums on purpose: the mean of the rows' percents (75) is not marks over maximum (66.7).
  maths = await paper("Mathematics", 100, "2026-09-14", 1);
  science = await paper("Science", 50, "2026-09-15", 2);
  const mark = (assignmentId: string, studentMembershipId: string, scoreMilli: number) =>
    db.grade.create({ data: { schoolId, assignmentId, studentMembershipId, scoreMilli, gradedByMembershipId: tm.id } });
  await mark(maths, pupilA, 50_000);
  await mark(science, pupilA, 50_000);
  await mark(maths, pupilB, 90_960);
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `zz-figures-` , endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

async function cardOf(studentMembershipId: string, title: string) {
  const rows = await cardsForClass(teacher, classId, title);
  const row = rows.find((r) => r.studentMembershipId === studentMembershipId)!;
  return (await getCard(teacher, row.id))!;
}

describe("the figures on the card", () => {
  it("on a marks-over-maximum card the rows carry their marks and the overall is their sum, and the page and the PDF name that rule", async () => {
    expect((await generateCards(teacher, classId, { title: "ZZ Term 1", assignmentIds: [maths, science] })).ok).toBe(true);
    const card = await cardOf(pupilA, "ZZ Term 1");
    expect(card.gradingMethod).toBe("exams");
    expect(card.subjects.map((s) => [s.subject, s.scoreMilli, s.pointsMilli, s.percent, s.letter])).toEqual([
      ["Mathematics", 50_000, 100_000, 50, "C2"],
      ["Science", 50_000, 50_000, 100, "A1"],
    ]);
    const scored = card.subjects.reduce((n, s) => n + (s.scoreMilli ?? 0), 0);
    const max = card.subjects.reduce((n, s) => n + (s.pointsMilli ?? 0), 0);
    expect(card.overallPercent).toBe(shownPercent((scored / max) * 100));
    expect(card.overallPercent).toBe(66.7);
    expect(card.overallLetter).toBe("B2");
    // …and not the mean of the rows, which a reader adding percents would get.
    expect((50 + 100) / 2).not.toBe(card.overallPercent);
    expect(gradingHintKey(card)).toBe("reportView.examsOnly");
    expect(gradingHintKey({ ...card, gradingMethod: "weighted" })).toBe("reportView.weightedExplainerShort");
    expect(gradingHintKey({ ...card, overallPercent: null })).toBe("reportView.noMarksCounted");
  });

  it("⚠ rounds once: 90.96 prints 91.0 and carries the band of 91.0, on the stored row and on the view", async () => {
    const card = await cardOf(pupilB, "ZZ Term 1");
    expect(card.overallPercent).toBe(91);
    expect(card.overallPercent!.toFixed(1)).toBe("91.0");
    expect(card.overallLetter).toBe("A1");
    expect(bandFor(91, card.scale.bands)?.label).toBe("A1");
    expect(bandFor(90.96, card.scale.bands)?.label).toBe("A2"); // what it used to print beside "91.0 %"
    expect(card.subjects.map((s) => [s.subject, s.percent, s.letter])).toEqual([["Mathematics", 91, "A1"], ["Science", null, null]]);
    const stored = await db.reportCard.findFirstOrThrow({ where: { classId, studentMembershipId: pupilB, title: "ZZ Term 1" }, select: { overallPercentMilli: true, overallLetter: true, subjects: true, items: { select: { letter: true }, where: { kind: "SCHOLASTIC", assignmentId: maths } } } });
    expect(stored.overallPercentMilli).toBe(91_000);
    expect(stored.overallLetter).toBe("A1");
    expect((JSON.parse(stored.subjects!) as { percent: number; letter: string }[]).map((s) => [s.percent, s.letter])).toEqual([[91, "A1"], [null, null]]);
    expect(stored.items.map((i) => i.letter)).toEqual(["A1"]);
  });

  it("⚠ an older card whose letter was read from the raw figure shows the band of the printed percent", async () => {
    const row = await db.reportCard.findFirstOrThrow({ where: { classId, studentMembershipId: pupilB, title: "ZZ Term 1" }, select: { id: true } });
    await db.reportCard.update({ where: { id: row.id }, data: { overallPercentMilli: 90_960, overallLetter: "A2" } });
    const card = (await getCard(teacher, row.id))!;
    expect([card.overallPercent, card.overallLetter]).toEqual([91, "A1"]);
    await db.reportCard.update({ where: { id: row.id }, data: { overallPercentMilli: 91_000, overallLetter: "A1" } });
  });

  it("prints the legal name, not the preferred name the app shows elsewhere", async () => {
    const card = await cardOf(pupilA, "ZZ Term 1");
    expect(card.studentName).toBe("ZZ Figures Aarav Apte");
    expect(card.studentName).not.toContain("Chintu");
  });

  it("⚠ freezes the class label when the cards go out; a draft follows the rename", async () => {
    expect((await publishCards(teacher, classId, "ZZ Term 1")).ok).toBe(true);
    expect((await generateCards(teacher, classId, { title: "ZZ Draft", assignmentIds: [maths, science] })).ok).toBe(true);
    await db.class.update({ where: { id: classId }, data: { name: "ZZ 6 Renamed", section: "B" } });

    const published = await cardOf(pupilA, "ZZ Term 1");
    expect([published.status, published.className, published.classSection]).toEqual(["PUBLISHED", "ZZ 6", "A"]);
    // The label lives in the layout snapshot and stays out of the printed layout.
    expect(published.layout).not.toHaveProperty("className");

    const draft = await cardOf(pupilA, "ZZ Draft");
    expect([draft.status, draft.className, draft.classSection]).toEqual(["DRAFT", "ZZ 6 Renamed", "B"]);
  });

  it("⚠ dates the issue in the school's zone: published at 20:00 UTC on the 3rd, issued on the 4th in Kolkata", async () => {
    const row = await db.reportCard.findFirstOrThrow({ where: { classId, studentMembershipId: pupilA, title: "ZZ Term 1" }, select: { id: true } });
    await db.reportCard.update({ where: { id: row.id }, data: { publishedAt: new Date("2026-03-03T20:00:00Z") } });
    const card = (await getCard(teacher, row.id))!;
    expect(card.school.timezone).toBe("Asia/Kolkata");
    expect(card.issuedDateKey).toBe("2026-03-04");
    expect(card.publishedAt?.toISOString()).toBe("2026-03-03T20:00:00.000Z");

    const draft = await cardOf(pupilA, "ZZ Draft");
    expect(draft.issuedDateKey).toBeNull();
  });
});
