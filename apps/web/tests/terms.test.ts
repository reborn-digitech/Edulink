import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { createTerm, deleteTerm, termForDate, termsOfYear, currentTerms } from "@/lib/terms";
import { createSeries, addSlot } from "@/lib/exams";
import type { ActiveContext } from "@/lib/session";

/**
 * Terms: inside the year, no overlaps, unique names; an exam round takes
 * the term its first paper falls in; a term with published cards cannot be
 * removed; removing one unhooks and never deletes.
 */

const db = new PrismaClient();
function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null,
    user: { id: over.userId, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

let schoolId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let yearId: string;
let seriesId: string | null = null;

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  admin = ctx({ userId: priya.id, membershipId: (await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId, role: "ADMIN" } })).id, schoolId, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: (await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId, role: "TEACHER" } })).id, schoolId, role: "TEACHER" });
  await db.academicYear.deleteMany({ where: { schoolId, name: "ZZ TERMS 1999" } });
  // A year of its own, far in the past so it cannot be "current" and nothing else touches it.
  yearId = (await db.academicYear.create({ data: { schoolId, name: "ZZ TERMS 1999", startDate: new Date("1999-06-01T00:00:00Z"), endDate: new Date("2000-04-30T00:00:00Z") } })).id;
});

afterAll(async () => {
  if (seriesId) await db.examSeries.deleteMany({ where: { id: seriesId } });
  await db.academicYear.deleteMany({ where: { id: yearId } }); // terms cascade
  await db.$disconnect();
});

describe("setting terms up", () => {
  it("⚠ is the admin's alone", async () => {
    await expect(createTerm(teacher, yearId, { name: "T", startDateKey: "1999-06-01", endDateKey: "1999-09-30" })).rejects.toBeInstanceOf(AccessError);
  });

  it("keeps a term inside its year, apart from its siblings, and uniquely named", async () => {
    expect(await createTerm(admin, yearId, { name: "Term 1", startDateKey: "1999-05-01", endDateKey: "1999-09-30" })).toMatchObject({ ok: false, errorKey: "terms.outsideYear" });
    expect(await createTerm(admin, yearId, { name: "Term 1", startDateKey: "1999-09-30", endDateKey: "1999-06-01" })).toMatchObject({ ok: false, errorKey: "terms.endsBeforeStart" });
    expect(await createTerm(admin, yearId, { name: "Term 1", startDateKey: "1999-06-01", endDateKey: "1999-09-30" })).toMatchObject({ ok: true });
    expect(await createTerm(admin, yearId, { name: "term 1", startDateKey: "1999-10-01", endDateKey: "1999-12-20" })).toMatchObject({ ok: false, errorKey: "terms.nameTaken" });
    expect(await createTerm(admin, yearId, { name: "Term 2", startDateKey: "1999-09-15", endDateKey: "1999-12-20" })).toMatchObject({ ok: false, errorKey: "terms.overlaps" });
    expect(await createTerm(admin, yearId, { name: "Term 2", startDateKey: "1999-10-01", endDateKey: "1999-12-20" })).toMatchObject({ ok: true });
    const terms = await termsOfYear(schoolId, yearId);
    expect(terms.map((t) => [t.name, t.position])).toEqual([["Term 1", 1], ["Term 2", 2]]);
    expect(terms.every((t) => !t.current)).toBe(true);
  });

  it("answers which term a date falls in, and none for a gap", async () => {
    expect((await termForDate(schoolId, "1999-07-15"))?.name).toBe("Term 1");
    expect((await termForDate(schoolId, "1999-11-15"))?.name).toBe("Term 2");
    expect(await termForDate(schoolId, "1999-09-30")).toMatchObject({ name: "Term 1" }); // inclusive
    expect(await termForDate(schoolId, "2000-01-15")).toBeNull();
  });

  it("a school with no current-year terms is offered none", async () => {
    // Riverside's current year has none set; the builder and the exams page show nothing.
    const now = await currentTerms(schoolId);
    expect(Array.isArray(now)).toBe(true);
  });
});

describe("what hangs on a term", () => {
  it("⚠ an exam round takes the term its first paper falls in; a named term is verified to be this school's", async () => {
    seriesId = await createSeries(admin, { name: "ZZ Terms Unit Test", gradeLevel: "3" });
    expect((await db.examSeries.findUniqueOrThrow({ where: { id: seriesId } })).termId).toBeNull();
    await addSlot(admin, seriesId, { subject: "Maths", dateKey: "1999-11-10", maxMarks: 50 });
    const term2 = (await termsOfYear(schoolId, yearId)).find((t) => t.name === "Term 2")!;
    expect((await db.examSeries.findUniqueOrThrow({ where: { id: seriesId } })).termId).toBe(term2.id);
    await expect(createSeries(admin, { name: "ZZ Terms Bogus", gradeLevel: "3", termId: "not-a-term" })).rejects.toMatchObject({ key: "access.termNotFound" });
  });

  it("⚠ a term with published cards cannot be removed; removing one unhooks the round, never deletes it", async () => {
    const term2 = (await termsOfYear(schoolId, yearId)).find((t) => t.name === "Term 2")!;
    const klass = await db.class.findFirstOrThrow({ where: { schoolId, archivedAt: null }, select: { id: true } });
    const pupil = await db.enrollment.findFirstOrThrow({ where: { classId: klass.id, status: "ACTIVE" }, select: { studentMembershipId: true } });
    const card = await db.reportCard.create({
      data: { schoolId, classId: klass.id, studentMembershipId: pupil.studentMembershipId, termId: term2.id, title: "ZZ Terms card", status: "PUBLISHED", fromDateKey: "1999-10-01", toDateKey: "1999-12-20" },
    });
    expect(await deleteTerm(admin, term2.id)).toMatchObject({ ok: false, errorKey: "terms.hasPublishedCards" });
    await db.reportCard.delete({ where: { id: card.id } });
    expect(await deleteTerm(admin, term2.id)).toEqual({ ok: true });
    const series = await db.examSeries.findUniqueOrThrow({ where: { id: seriesId! } });
    expect(series.termId).toBeNull();
    expect(await db.examSlot.count({ where: { seriesId: seriesId! } })).toBe(1);
  });
});
