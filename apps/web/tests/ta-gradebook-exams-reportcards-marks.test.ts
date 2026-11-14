/**
 * The marks and report-card findings of the testing analysis of 13 November 2026, batch
 * gradebook-exams-reportcards:
 *
 *   TA-140  An exam sitting marked through the homework gradebook took up to twice the paper's maximum, and its
 *           finished-year lock was judged by the day the sitting's row was made, not the paper's date.
 *   TA-346  The homework lock missed work set on the year's last day (the end date is 00:00 UTC of that day).
 *   TA-345  A save of marks was audited by counts alone: not whose mark, nor from what to what.
 *   TA-141  The office could not save exam marks through the web's form: its action asked for a TEACHER only.
 *   TA-248 / TA-515  The web's marks form named no version, so a sheet sent late (the outbox) or from a page
 *           opened earlier put its marks over newer ones and its blanks deleted them.
 *   TA-347  A paper's maximum lowered under marks already saved was accepted.
 *   TA-143  "Maths" and "maths" were two subjects: two papers, two card rows.
 *   TA-142  A series' term was derived again only when a paper changed, never when a term was made or removed.
 *   TA-587  A term share of 0 beside a term with no share passed the annual card's check.
 *   TA-343  The class teacher's remark on a card was written with no audit row.
 *   TA-451  Publishing a set told every pupil and guardian one after another inside the press.
 *
 * One scratch ZZ school of this suite's own (made through the owner connection, removed after): the office, the
 * head, a class teacher, a class of two pupils with a guardian each, a current year and a closed one.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { saveGrades } from "@/lib/grading";
import { addSlot, saveMarks } from "@/lib/exams";
import { createTerm, deleteTerm } from "@/lib/terms";
import { generateCards, publishCards, setRemark } from "@/lib/report-cards";
import { termSharesComplete } from "@/lib/report-card-rules";
import { AccessError } from "@/lib/tenancy";
import { FORM_IDLE } from "@/lib/form-state";
import { saveMarksAction } from "@/app/(app)/teacher/exams/actions";

// The action's answer marks its page for a refresh; outside Next there is no page to refresh.
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tagb-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}
const grader = (who: string, role: "TEACHER" | "ADMIN") => ({ schoolId: ids.school!, membershipId: ids[`${who}M`]!, role, userId: ids[who]! });

/** A paper of grade 6 with the class's sitting: the series, its slot and the sitting's assignment. */
async function paper(tag: string, subject: string, dateKey: string, outOf: number, kind = "UNIT_TEST") {
  const S = ids.school!;
  const series = await db.examSeries.create({ data: { schoolId: S, name: `ZZ TAGB ${tag}`, gradeLevel: "6", kind, publishedAt: new Date() }, select: { id: true } });
  const slot = await db.examSlot.create({ data: { schoolId: S, seriesId: series.id, subject, dateKey, pointsMilli: outOf * 1000 }, select: { id: true } });
  const sitting = await db.assignment.create({
    data: { schoolId: S, classId: ids.klass!, authorMembershipId: ids.leadM!, title: `ZZ TAGB ${tag} · ${subject}`, category: "Exam", pointsMilli: outOf * 1000, examSlotId: slot.id, publishedAt: new Date() },
    select: { id: true },
  });
  return { seriesId: series.id, slotId: slot.id, sittingId: sitting.id };
}
async function markOf(assignmentId: string, who: string): Promise<number | null> {
  const g = await db.grade.findUnique({ where: { assignmentId_studentMembershipId: { assignmentId, studentMembershipId: ids[`${who}M`]! } }, select: { scoreMilli: true } });
  return g?.scoreMilli == null ? null : g.scoreMilli / 1000;
}
async function lastAudit(action: string, targetId: string): Promise<Record<string, unknown> | null> {
  const row = await db.auditLog.findFirst({ where: { schoolId: ids.school!, action, targetId }, orderBy: { createdAt: "desc" }, select: { meta: true } });
  return row ? (JSON.parse(row.meta) as Record<string, unknown>) : null;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA Gradebook ${STAMP}`, slug: `zz-tagb-${STAMP}`, code: `ZTGB${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  for (const [who, role] of [["admin", "ADMIN"], ["head", "PRINCIPAL"], ["lead", "TEACHER"], ["p1", "STUDENT"], ["p2", "STUDENT"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA Gradebook ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZTGB${who}${TAIL}` } : {}) }, select: { id: true } })).id;
  }
  for (const [who, child] of [["g1", "p1M"], ["g2", "p2M"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA Gradebook ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    await db.guardianship.create({ data: { parentUserId: ids[who]!, studentMembershipId: ids[child]!, studentSchoolId: S, status: "ACTIVE" } });
  }
  ids.klass = (await db.class.create({ data: { schoolId: S, name: "ZZ TA Gradebook 6A", gradeLevel: "6", joinCode: `ZTGB${TAIL}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.klass, schoolId: S, teacherMembershipId: ids.leadM!, role: "LEAD" } });
  for (const p of ["p1M", "p2M"]) await db.enrollment.create({ data: { classId: ids.klass, schoolId: S, studentMembershipId: ids[p]!, status: "ACTIVE" } });
  ids.closedYear = (
    await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2024–25", startDate: new Date("2024-06-01T00:00:00Z"), endDate: new Date("2025-03-31T00:00:00Z"), closedAt: new Date("2025-04-15T00:00:00Z") }, select: { id: true } })
  ).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = ["admin", "head", "lead", "p1", "p2", "g1", "g2"].map((w) => ids[w]).filter((id): id is string => Boolean(id));
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.guardianship.deleteMany({ where: { parentUserId: { in: users } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 60_000);

describe("TA-140 / TA-346: the homework gradebook's rules for a sitting and for the year's last day", () => {
  it("TA-140: a sitting's mark above its paper's maximum is refused by saveGrades, as the grid refuses it", async () => {
    const p = await paper("Unit Test 1", "Mathematics", "2026-09-01", 50);
    const result = await saveGrades(grader("lead", "TEACHER"), p.sittingId, [{ studentMembershipId: ids.p1M!, score: 91 }, { studentMembershipId: ids.p2M!, score: 48 }]);
    expect(result.rejected).toEqual([ids.p1M]);
    expect(await markOf(p.sittingId, "p1")).toBeNull();
    expect(await markOf(p.sittingId, "p2")).toBe(48);
  });

  it("TA-140: a sitting of a paper inside a closed year is locked for the teacher though its row was made after the year's end", async () => {
    const p = await paper("Final 2024–25", "Mathematics", "2025-03-15", 80, "FINAL");
    await expect(saveGrades(grader("lead", "TEACHER"), p.sittingId, [{ studentMembershipId: ids.p1M!, score: 60 }])).rejects.toMatchObject({ key: "access.yearFinishedMarksLocked" });
    expect(await markOf(p.sittingId, "p1")).toBeNull();
    // The office keeps the pen, as on the grid.
    expect((await saveGrades(grader("admin", "ADMIN"), p.sittingId, [{ studentMembershipId: ids.p1M!, score: 60 }])).saved).toBe(1);
  });

  it("TA-346: homework set at 10:00 in Kolkata on a closed year's last day is locked for the teacher", async () => {
    const work = await db.assignment.create({
      data: { schoolId: ids.school!, classId: ids.klass!, authorMembershipId: ids.leadM!, title: "ZZ TAGB last-day work", pointsMilli: 20_000, publishedAt: new Date("2025-03-31T04:30:00Z"), createdAt: new Date("2025-03-31T04:30:00Z") },
      select: { id: true },
    });
    await expect(saveGrades(grader("lead", "TEACHER"), work.id, [{ studentMembershipId: ids.p1M!, score: 15 }])).rejects.toBeInstanceOf(AccessError);
    expect(await markOf(work.id, "p1")).toBeNull();
  });
});

describe("TA-345: a change of marks names the pupil and the marks before and after", () => {
  it("TA-345: the grid's save lists only the cell that changed, with its old and new marks", async () => {
    const p = await paper("Unit Test 2", "English", "2026-09-02", 50);
    const lead = await as("lead", "TEACHER");
    await saveMarks(lead, p.slotId, ids.klass!, [{ membershipId: ids.p1M!, marks: 40 }, { membershipId: ids.p2M!, marks: 35 }]);
    await saveMarks(lead, p.slotId, ids.klass!, [{ membershipId: ids.p1M!, marks: 45 }, { membershipId: ids.p2M!, marks: 35 }]);
    expect((await lastAudit("exam.marksSave", p.sittingId))?.changes).toEqual([{ m: ids.p1M, from: 40, to: 45 }]);
    await saveMarks(lead, p.slotId, ids.klass!, [{ membershipId: ids.p1M!, marks: 45 }, { membershipId: ids.p2M!, marks: null }]);
    expect((await lastAudit("exam.marksSave", p.sittingId))?.changes).toEqual([{ m: ids.p2M, from: 35, to: null }]);
  });

  it("TA-345: the gradebook's save does the same, a cleared mark with its old value", async () => {
    const work = await db.assignment.create({ data: { schoolId: ids.school!, classId: ids.klass!, authorMembershipId: ids.leadM!, title: "ZZ TAGB fractions", pointsMilli: 20_000, publishedAt: new Date() }, select: { id: true } });
    await saveGrades(grader("lead", "TEACHER"), work.id, [{ studentMembershipId: ids.p1M!, score: 15 }, { studentMembershipId: ids.p2M!, score: 12 }], { notifyStudents: false });
    expect((await lastAudit("grade.save", work.id))?.changes).toEqual([{ m: ids.p1M, from: null, to: 15 }, { m: ids.p2M, from: null, to: 12 }]);
    await saveGrades(grader("lead", "TEACHER"), work.id, [{ studentMembershipId: ids.p1M!, score: null }, { studentMembershipId: ids.p2M!, score: 12 }], { notifyStudents: false });
    expect((await lastAudit("grade.save", work.id))?.changes).toEqual([{ m: ids.p1M, from: 15, to: null }]);
  });
});

describe("TA-141 / TA-248 / TA-515: the web's marks form", () => {
  const form = (p: { slotId: string }, marks: Record<string, string>, basedOn?: string) => {
    const f = new FormData();
    f.set("slotId", p.slotId);
    f.set("classId", ids.klass!);
    if (basedOn) f.set("basedOn", basedOn);
    for (const [who, value] of Object.entries(marks)) f.set(`marks-${ids[`${who}M`]}`, value);
    return f;
  };

  it("TA-141: the office saves a sheet through the form's action", async () => {
    const p = await paper("Unit Test 3", "Science", "2026-09-03", 50);
    await as("admin", "ADMIN");
    const answer = await saveMarksAction(FORM_IDLE, form(p, { p1: "33", p2: "" }));
    expect(answer.ok).toBe(true);
    expect(await markOf(p.sittingId, "p1")).toBe(33);
  });

  it("TA-248 / TA-515: a sheet based on the page as it was opened leaves alone a mark saved since, its blank included", async () => {
    const p = await paper("Unit Test 4", "Hindi", "2026-09-04", 50);
    const lead = await as("lead", "TEACHER");
    await saveMarks(lead, p.slotId, ids.klass!, [{ membershipId: ids.p1M!, marks: 40 }, { membershipId: ids.p2M!, marks: 35 }]);
    await tick();
    // The teacher opens the page (its version), and the office corrects the first pupil afterwards.
    const opened = new Date().toISOString();
    await tick();
    await saveMarks(await as("admin", "ADMIN"), p.slotId, ids.klass!, [{ membershipId: ids.p1M!, marks: 45 }]);
    await tick();
    // The teacher's sheet, typed on the page opened before, goes in (online now, or later from the outbox).
    await as("lead", "TEACHER");
    const answer = await saveMarksAction(FORM_IDLE, form(p, { p1: "", p2: "38" }, opened));
    expect(answer.ok).toBe(true);
    expect(answer.message).toBeTruthy();
    expect(await markOf(p.sittingId, "p1")).toBe(45);
    expect(await markOf(p.sittingId, "p2")).toBe(38);
  });

  it("TA-248 / TA-515: the page draws the version into the form and the outbox sends it", () => {
    const page = readFileSync(join(__dirname, "../src/app/(app)/teacher/exams/page.tsx"), "utf8");
    expect(page).toMatch(/name="basedOn" value=\{version\}/);
    // Taken before the marks are read.
    expect(page.indexOf("const version = new Date().toISOString()")).toBeLessThan(page.indexOf("await marksGrid("));
    const outbox = readFileSync(join(__dirname, "../src/app/(app)/teacher/exams/marks-form.tsx"), "utf8");
    expect(outbox).toMatch(/JSON\.stringify\(\{ slotId, classId, entries, \.\.\.\(basedOn \? \{ basedOn \} : \{\}\) \}\)/);
  });
});

describe("TA-347 / TA-143: the office's date sheet", () => {
  it("TA-347: a maximum under a mark already saved is refused, and the paper keeps its maximum", async () => {
    const admin = await as("admin", "ADMIN");
    const series = await db.examSeries.create({ data: { schoolId: ids.school!, name: "ZZ TAGB Unit Test 5", gradeLevel: "6" }, select: { id: true } });
    await addSlot(admin, series.id, { subject: "Marathi", dateKey: "2026-09-07", maxMarks: 100, evenIfClosed: true });
    const slot = await db.examSlot.findFirstOrThrow({ where: { seriesId: series.id }, select: { id: true } });
    await saveMarks(admin, slot.id, ids.klass!, [{ membershipId: ids.p1M!, marks: 92 }, { membershipId: ids.p2M!, marks: 70 }]);
    await expect(addSlot(admin, series.id, { subject: "Marathi", dateKey: "2026-09-07", maxMarks: 80, evenIfClosed: true })).rejects.toMatchObject({ key: "access.maxBelowSavedMarks" });
    expect((await db.examSlot.findUniqueOrThrow({ where: { id: slot.id }, select: { pointsMilli: true } })).pointsMilli).toBe(100_000);
    // At or above the highest mark it is an ordinary edit.
    await addSlot(admin, series.id, { subject: "Marathi", dateKey: "2026-09-07", maxMarks: 95, evenIfClosed: true });
    expect((await db.examSlot.findUniqueOrThrow({ where: { id: slot.id }, select: { pointsMilli: true } })).pointsMilli).toBe(95_000);
  });

  it("TA-143: a subject typed in another case or spacing takes the grade's spelling, and re-adding it edits that paper", async () => {
    const admin = await as("admin", "ADMIN");
    const first = await db.examSeries.create({ data: { schoolId: ids.school!, name: "ZZ TAGB Unit Test 6", gradeLevel: "6" }, select: { id: true } });
    const second = await db.examSeries.create({ data: { schoolId: ids.school!, name: "ZZ TAGB Mid-term 6", gradeLevel: "6", kind: "MID_TERM" }, select: { id: true } });
    await addSlot(admin, first.id, { subject: "Social Science", dateKey: "2026-09-08", maxMarks: 25, evenIfClosed: true });
    await addSlot(admin, second.id, { subject: "  social   science ", dateKey: "2026-10-08", maxMarks: 80, evenIfClosed: true });
    expect((await db.examSlot.findMany({ where: { seriesId: second.id }, select: { subject: true } })).map((s) => s.subject)).toEqual(["Social Science"]);
    await addSlot(admin, second.id, { subject: "SOCIAL SCIENCE", dateKey: "2026-10-09", maxMarks: 80, evenIfClosed: true });
    expect(await db.examSlot.findMany({ where: { seriesId: second.id }, select: { subject: true, dateKey: true } })).toEqual([{ subject: "Social Science", dateKey: "2026-10-09" }]);
  });

  it("TA-143: papers stored as \"Science\" and \"science\" make one subject row on the card, the two kinds weighted together", async () => {
    const ut = await paper("Unit Test 7", "Science", "2026-09-09", 25);
    const mt = await paper("Mid-term 7", "science", "2026-10-09", 75, "MID_TERM");
    await db.grade.createMany({
      data: [
        { schoolId: ids.school!, assignmentId: ut.sittingId, studentMembershipId: ids.p1M!, scoreMilli: 20_000 },
        { schoolId: ids.school!, assignmentId: mt.sittingId, studentMembershipId: ids.p1M!, scoreMilli: 60_000 },
      ],
    });
    const lead = await as("lead", "TEACHER");
    const made = await generateCards(lead, ids.klass!, { title: "ZZ TAGB Science card", assignmentIds: [ut.sittingId, mt.sittingId] });
    expect(made.ok).toBe(true);
    const card = await db.reportCard.findFirstOrThrow({ where: { classId: ids.klass!, studentMembershipId: ids.p1M!, title: "ZZ TAGB Science card" }, select: { subjects: true } });
    const subjects = JSON.parse(card.subjects ?? "[]") as { subject: string; parts: unknown[] }[];
    expect(subjects.map((s) => s.subject)).toEqual(["Science"]);
    expect(subjects[0]!.parts).toHaveLength(2);
  });
});

describe("TA-142: a series' term follows the terms as well as its papers", () => {
  it("TA-142: a term made over a series' earliest paper takes the series, and so does a term made again after a delete", async () => {
    const series = await db.examSeries.create({ data: { schoolId: ids.school!, name: "ZZ TAGB Early Test", gradeLevel: "6" }, select: { id: true } });
    await db.examSlot.create({ data: { schoolId: ids.school!, seriesId: series.id, subject: "Mathematics", dateKey: "2026-06-20", pointsMilli: 20_000 } });
    const termOf = async () => (await db.examSeries.findUniqueOrThrow({ where: { id: series.id }, select: { termId: true } })).termId;
    expect(await termOf()).toBeNull();
    const admin = await as("admin", "ADMIN");
    const made = await createTerm(admin, ids.year!, { name: "ZZ TAGB Term 1", startDateKey: "2026-06-01", endDateKey: "2026-10-31" });
    expect(made.ok).toBe(true);
    expect(await termOf()).toBe(made.ok ? made.termId : "");
    expect(await deleteTerm(admin, made.ok ? made.termId : "")).toEqual({ ok: true });
    expect(await termOf()).toBeNull();
    const again = await createTerm(admin, ids.year!, { name: "ZZ TAGB Term 1", startDateKey: "2026-06-01", endDateKey: "2026-10-31" });
    expect(again.ok).toBe(true);
    expect(await termOf()).toBe(again.ok ? again.termId : "");
  });
});

describe("TA-587: a share of 0 beside a term with no share", () => {
  it("TA-587: termSharesComplete reads (0, none) as half set", () => {
    expect(termSharesComplete([{ weightPercent: 0 }, { weightPercent: null }])).toBe(false);
    expect(termSharesComplete([{ weightPercent: null }, { weightPercent: 0 }, { weightPercent: null }])).toBe(false);
    expect(termSharesComplete([{ weightPercent: 0 }, { weightPercent: 100 }])).toBe(true);
    expect(termSharesComplete([{ weightPercent: null }, { weightPercent: null }])).toBe(true);
  });

  it("TA-587: the annual card over such a year is refused with giveEveryTermAShare and no card is made", async () => {
    const S = ids.school!;
    const year = await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2027–28", startDate: new Date("2027-06-01T00:00:00Z"), endDate: new Date("2028-04-30T00:00:00Z") }, select: { id: true } });
    await db.term.create({ data: { schoolId: S, academicYearId: year.id, name: "ZZ TAGB 27 T1", startDate: new Date("2027-06-01T00:00:00Z"), endDate: new Date("2027-10-31T00:00:00Z"), weightPercent: 0 } });
    await db.term.create({ data: { schoolId: S, academicYearId: year.id, name: "ZZ TAGB 27 T2", startDate: new Date("2027-11-01T00:00:00Z"), endDate: new Date("2028-04-30T00:00:00Z") } });
    const result = await generateCards(await as("lead", "TEACHER"), ids.klass!, { title: "ZZ TAGB annual", academicYearId: year.id });
    expect(result).toEqual({ ok: false, errorKey: "reportCards.giveEveryTermAShare" });
    expect(await db.reportCard.count({ where: { classId: ids.klass!, academicYearId: year.id } })).toBe(0);
  });
});

describe("TA-343 / TA-451: a set's remark and its publication", () => {
  const TITLE = "ZZ TAGB Term card";
  it("TA-343: the remark is on the record, who and when, never its words", async () => {
    const p = await paper("Unit Test 8", "Art", "2026-09-10", 20);
    await db.grade.create({ data: { schoolId: ids.school!, assignmentId: p.sittingId, studentMembershipId: ids.p1M!, scoreMilli: 18_000 } });
    const lead = await as("lead", "TEACHER");
    expect((await generateCards(lead, ids.klass!, { title: TITLE, assignmentIds: [p.sittingId] })).ok).toBe(true);
    const card = await db.reportCard.findFirstOrThrow({ where: { classId: ids.klass!, studentMembershipId: ids.p1M!, title: TITLE }, select: { id: true } });
    expect(await setRemark(lead, card.id, "ZZ quiet but very careful words", { classId: ids.klass! })).toEqual({ ok: true });
    const row = await db.auditLog.findFirst({ where: { schoolId: ids.school!, action: "reportCard.remark", targetId: card.id }, select: { actorUserId: true, meta: true } });
    expect(row?.actorUserId).toBe(ids.lead);
    expect(row?.meta).not.toContain("careful");
  });

  it("TA-451: the families are told after the answer where the caller defers, each once, and nobody of another child", async () => {
    const lead = await as("lead", "TEACHER");
    const deferred: (() => Promise<void>)[] = [];
    const told = (who: string, key: string) => db.notification.count({ where: { userId: ids[who]!, titleKey: key, body: TITLE } });
    const published = await publishCards(lead, ids.klass!, TITLE, { defer: (task) => void deferred.push(task) });
    expect(published).toEqual({ ok: true, published: 2 });
    // Nothing was sent inside the press.
    expect(await told("g1", "notifTitle.childReportCardReady")).toBe(0);
    expect(await told("p1", "notifTitle.reportCardReady")).toBe(0);
    expect(deferred).toHaveLength(1);
    await deferred[0]!();
    expect(await told("p1", "notifTitle.reportCardReady")).toBe(1);
    expect(await told("p2", "notifTitle.reportCardReady")).toBe(1);
    expect(await told("g1", "notifTitle.childReportCardReady")).toBe(1);
    expect(await told("g2", "notifTitle.childReportCardReady")).toBe(1);
    const g1 = await db.notification.findFirstOrThrow({ where: { userId: ids.g1!, titleKey: "notifTitle.childReportCardReady", body: TITLE }, select: { titleVars: true } });
    expect(g1.titleVars).toContain("ZZ TA Gradebook p1");
  });
});
