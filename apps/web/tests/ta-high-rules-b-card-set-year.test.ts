/**
 * TA-009 (testing analysis of 13 November 2026, High), beyond the regression
 * suite tests/ta-report-card-set-year.test.ts: the two cases it does not
 * reach.
 *
 *   - A class row that ALREADY holds one title from two years (written before
 *     generate kept a title to one year): Take back and Publish act on the
 *     latest year's cards alone; the earlier year's issued card stays issued,
 *     with its date and its signature.
 *   - A set built from hand-picked papers under a typed title that the row
 *     holds from last year: its year is the year its window ends in, so it is
 *     made under the title with this year's name after it, and last year's
 *     card is untouched.
 *
 * One ZZ school of this suite's own (made here, removed after): last year
 * (closed) and this year (current), class 5A with its LEAD teacher and three
 * pupils.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { generateCards, publishCards, withdrawCards, type GenerateResult } from "@/lib/report-cards";
import { cardSetId } from "@/lib/signatures";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-hrb-ta009-${who}-${STAMP}@test.invalid`;
const LEGACY = "ZZ Legacy Set";
const TYPED = "ZZ Half-yearly";
const ISSUED_LAST_YEAR = "2025-11-05T06:00:00.000Z";
const ids: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

const card = (who: string, title: string, academicYearId: string, status: "DRAFT" | "PUBLISHED", publishedAt: Date | null) =>
  db.reportCard.create({ data: { schoolId: ids.school!, classId: ids.klass!, studentMembershipId: ids[`${who}M`]!, title, academicYearId, status, publishedAt, fromDateKey: "2025-06-01", toDateKey: "2025-10-31" }, select: { id: true } });
const state = async (id: string) => {
  const c = await db.reportCard.findUniqueOrThrow({ where: { id }, select: { status: true, publishedAt: true, academicYearId: true, title: true } });
  return { ...c, publishedAt: c.publishedAt?.toISOString() ?? null };
};

let legacyWithdrawn: Awaited<ReturnType<typeof withdrawCards>>;
let legacyAfterWithdraw: Awaited<ReturnType<typeof state>>;
let legacySignatures = -1;
let legacyPublished: Awaited<ReturnType<typeof publishCards>>;
let legacyAfterPublish: Awaited<ReturnType<typeof state>>;
let typed: GenerateResult;
let typedLastYear: Awaited<ReturnType<typeof state>>;
let typedThisYear: { title: string; academicYearId: string | null }[] = [];

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ HRB TA009 School ${STAMP}`, slug: `zz-hrb-ta009-${STAMP}`, code: `ZHR9${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const S = ids.school;
  for (const [who, name, role] of [
    ["lead", "ZZ HRB TA009 Class Teacher", "TEACHER"],
    ["older", "ZZ HRB TA009 Pupil Of Last Year", "STUDENT"],
    ["held", "ZZ HRB TA009 Pupil Held Back", "STUDENT"],
    ["newer", "ZZ HRB TA009 Pupil Of This Year", "STUDENT"],
  ] as const) {
    ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  ids.y1 = (await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false, closedAt: new Date("2026-05-01T00:00:00Z") }, select: { id: true } })).id;
  ids.y2 = (await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: S, name: "ZZ HRB TA009 5A", gradeLevel: "5", joinCode: classCode() }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId: S, classId: ids.klass, teacherMembershipId: ids.leadM!, role: "LEAD" } });
  for (const who of ["held", "newer"]) await db.enrollment.create({ data: { schoolId: S, classId: ids.klass, studentMembershipId: ids[`${who}M`]!, status: "ACTIVE" } });

  /* ---- one title from two years, as a row could come to hold it before the fix ---- */
  ids.legacyOld = (await card("older", LEGACY, ids.y1, "PUBLISHED", new Date(ISSUED_LAST_YEAR))).id;
  ids.legacyNew = (await card("newer", LEGACY, ids.y2, "PUBLISHED", new Date())).id;
  await db.paperSignature.create({ data: { schoolId: S, paperKind: "REPORT_CARD_SET", paperId: cardSetId(ids.klass, LEGACY), slot: "RIGHT", role: "PRINCIPAL", status: "SIGNED", signerName: "ZZ HRB TA009 Head", decidedAt: new Date(ISSUED_LAST_YEAR) } });
  legacyWithdrawn = await withdrawCards(await as("lead", "TEACHER"), ids.klass, LEGACY);
  legacyAfterWithdraw = await state(ids.legacyOld);
  legacySignatures = await db.paperSignature.count({ where: { schoolId: S, paperKind: "REPORT_CARD_SET", paperId: cardSetId(ids.klass, LEGACY) } });
  legacyPublished = await publishCards(await as("lead", "TEACHER"), ids.klass, LEGACY);
  legacyAfterPublish = await state(ids.legacyOld);

  /* ---- a typed title the row holds from last year ---- */
  ids.typedOld = (await card("held", TYPED, ids.y1, "PUBLISHED", new Date(ISSUED_LAST_YEAR))).id;
  const series = await db.examSeries.create({ data: { schoolId: S, name: "ZZ HRB TA009 Half-yearly", gradeLevel: "5", kind: "MID_TERM", publishedAt: new Date() }, select: { id: true, name: true } });
  const slot = await db.examSlot.create({ data: { schoolId: S, seriesId: series.id, subject: "ZZ Maths", dateKey: "2026-09-15", pointsMilli: 50_000, position: 0 }, select: { id: true } });
  const sitting = await db.assignment.create({ data: { schoolId: S, classId: ids.klass, authorMembershipId: ids.leadM!, title: `${series.name} · ZZ Maths`, category: "Exam", pointsMilli: 50_000, examSlotId: slot.id, publishedAt: new Date() }, select: { id: true } });
  for (const [who, score] of [["held", 40], ["newer", 30]] as const) await db.grade.create({ data: { schoolId: S, assignmentId: sitting.id, studentMembershipId: ids[`${who}M`]!, scoreMilli: score * 1000, gradedByMembershipId: ids.leadM! } });
  typed = await generateCards(await as("lead", "TEACHER"), ids.klass, { title: TYPED, assignmentIds: [sitting.id], fromDateKey: "2026-06-01", toDateKey: "2026-09-30" });
  typedLastYear = await state(ids.typedOld);
  typedThisYear = await db.reportCard.findMany({ where: { schoolId: S, classId: ids.klass, title: { startsWith: TYPED }, NOT: { id: ids.typedOld } }, select: { title: true, academicYearId: true } });
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-009: one set is one year's cards", () => {
  it("TA-009: Take back on a title held from two years takes back this year's card alone; last year's stays issued and keeps its signature", () => {
    expect(legacyWithdrawn).toMatchObject({ ok: true, withdrawn: 1 });
    expect(legacyAfterWithdraw).toEqual({ status: "PUBLISHED", publishedAt: ISSUED_LAST_YEAR, academicYearId: ids.y1, title: LEGACY });
    expect(legacySignatures).toBe(1);
  });

  it("TA-009: Publish then issues this year's card alone, and last year's keeps its date", () => {
    expect(legacyPublished).toMatchObject({ ok: true, published: 1 });
    expect(legacyAfterPublish).toEqual({ status: "PUBLISHED", publishedAt: ISSUED_LAST_YEAR, academicYearId: ids.y1, title: LEGACY });
  });

  it("TA-009: a typed title the row holds from last year makes this year's set under the title with this year's name, and leaves last year's card as it was", () => {
    expect(typed).toMatchObject({ ok: true, created: 2, updated: 0, skippedPublished: 0, title: `${TYPED} (ZZ 2026–27)` });
    expect(typedThisYear.map((c) => c.title)).toEqual([`${TYPED} (ZZ 2026–27)`, `${TYPED} (ZZ 2026–27)`]);
    expect(typedLastYear).toEqual({ status: "PUBLISHED", publishedAt: ISSUED_LAST_YEAR, academicYearId: ids.y1, title: TYPED });
  });
});
