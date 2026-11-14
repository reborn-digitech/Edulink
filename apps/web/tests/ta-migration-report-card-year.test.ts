/**
 * TA-009's database rule (the follow-up the High fix 6ba7ec95 left; the migration of 14 November 2026).
 *
 * A report-card set was the class row and the title, with no year, and the database's own key said the same:
 * one card per class, pupil and title. The key is now class, pupil, title AND academic year, so the database
 * lets a class row that outlives a year hold last year's "Term 1" and this year's for the same pupil, and still
 * refuses a second card of one pupil, one title and one year. A card built from hand-picked papers carries no
 * year (academicYearId null); Postgres counts two NULLs as different in a unique index unless told otherwise, so
 * the index is NULLS NOT DISTINCT: two cards with no year under one title are still one.
 *
 * generateCards still gives a clashing set the year in its title (6ba7ec95): publish, take back, the set's
 * signatures, the PDF bundle and the builder's list find a set by its class and title alone, so two years under
 * one title would be one set to all of them (tests/ta-report-card-set-year.test.ts and
 * tests/ta-high-rules-b-card-set-year.test.ts hold that).
 *
 * A scratch ZZ school of this suite's own, made through the owner connection and removed by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const ids = { school: "", klass: "", pupil: "", y1: "", y2: "" };

const card = (title: string, academicYearId: string | null) =>
  db.reportCard.create({ data: { schoolId: ids.school, classId: ids.klass, studentMembershipId: ids.pupil, title, academicYearId, fromDateKey: "2026-06-01", toDateKey: "2026-10-31" }, select: { id: true } });
const outcome = (run: Promise<unknown>) =>
  run.then(
    () => "made",
    (error: { code?: string }) => error.code ?? "refused",
  );

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Migration Cards ${STAMP}`, slug: `zz-tamig-cards-${STAMP}`, code: `ZMR${TAIL}`, contactEmail: `zz-tamig-cards-office-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const user = await db.user.create({ data: { name: "ZZ TA Migration Pupil", email: `zz-tamig-cards-pupil-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } });
  ids.pupil = (await db.membership.create({ data: { userId: user.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ TA 5A", gradeLevel: "5", joinCode: `ZMR${TAIL}` }, select: { id: true } })).id;
  ids.y1 = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-05-31T00:00:00Z"), isCurrent: false }, select: { id: true } })).id;
  ids.y2 = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { startsWith: "zz-tamig-cards-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-009: a report card's key carries its academic year", () => {
  it("TA-009: one pupil holds one title in two academic years in the same class row", async () => {
    expect(await outcome(card("ZZ Term 1", ids.y1))).toBe("made");
    expect(await outcome(card("ZZ Term 1", ids.y2))).toBe("made");
    expect(await db.reportCard.count({ where: { classId: ids.klass, studentMembershipId: ids.pupil, title: "ZZ Term 1" } })).toBe(2);
  });

  it("TA-009: a second card of the same pupil, title and year is refused by the database", async () => {
    expect(await outcome(card("ZZ Term 1", ids.y2))).toBe("P2002");
    expect(await db.reportCard.count({ where: { classId: ids.klass, studentMembershipId: ids.pupil, title: "ZZ Term 1" } })).toBe(2);
  });

  it("TA-009: two cards with no year under one title are still one (the index is NULLS NOT DISTINCT)", async () => {
    expect(await outcome(card("ZZ Unit tests", null))).toBe("made");
    expect(await outcome(card("ZZ Unit tests", null))).toBe("P2002");
    // A card with a year beside one with none is a different card.
    expect(await outcome(card("ZZ Unit tests", ids.y2))).toBe("made");
  });

  it("TA-009: the client names the key by class, pupil, title and year", async () => {
    const found = await db.reportCard.findUnique({
      where: { classId_studentMembershipId_title_academicYearId: { classId: ids.klass, studentMembershipId: ids.pupil, title: "ZZ Term 1", academicYearId: ids.y1 } },
      select: { academicYearId: true },
    });
    expect(found?.academicYearId).toBe(ids.y1);
    const model = Prisma.dmmf.datamodel.models.find((m) => m.name === "ReportCard")!;
    expect(model.uniqueFields).toEqual([["classId", "studentMembershipId", "title", "academicYearId"]]);
  });
});
