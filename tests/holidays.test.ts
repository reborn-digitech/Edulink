import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  MAX_HOLIDAY_SPAN_DAYS,
  closedDayKeys,
  closedOn,
  createHoliday,
  deleteHoliday,
  entriesOn,
  isSchoolClosed,
  listHolidays,
  nextEntry,
  schoolDaysBetween,
  spanDayKeys,
  spanLengthDays,
  updateHoliday,
} from "@/lib/holidays";
import type { ActiveContext } from "@/lib/session";

/**
 * The school calendar.
 *
 * Two things are being checked and they are not the same thing.
 *
 * The pure half is range maths, and it is where the bugs live: inclusive ends,
 * overlapping windows, and — the one that actually bit — a range so long that
 * the underlying helper silently truncates it and hands back a plausible-looking
 * answer for the wrong dates. Every one of those is a wrong number shown to a
 * parent, so they are tested without a database.
 *
 * The database half is authorisation, which is short: only an admin writes, and
 * only inside their own school. Tenant isolation is checked at the QUERY level
 * here as everywhere in this suite — it runs as the database owner, so the
 * policies are not in play. `npm run rls:verify` covers those.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      email: `${over.userId}@example.test`,
      name: over.userId,
      preferredName: null,
      avatarKey: null,
    },
  } as ActiveContext;
}

let schoolA = "";
let schoolB = "";
let adminA: ActiveContext;
let adminB: ActiveContext;
let teacherA: ActiveContext;

beforeAll(async () => {
  const a = await db.school.create({
    data: {
      name: "Holiday Test A",
      slug: `hol-a-${Date.now()}`,
      code: `HOLA${Date.now() % 100000}`,
      contactEmail: "hol-a@example.test",
      timezone: "Asia/Kolkata",
    },
  });
  const b = await db.school.create({
    data: {
      name: "Holiday Test B",
      slug: `hol-b-${Date.now()}`,
      code: `HOLB${Date.now() % 100000}`,
      contactEmail: "hol-b@example.test",
      timezone: "Asia/Kolkata",
    },
  });
  schoolA = a.id;
  schoolB = b.id;

  const userA = await db.user.create({
    data: { email: `hol-admin-a-${Date.now()}@example.test`, name: "Admin A", passwordHash: "x" },
  });
  const userB = await db.user.create({
    data: { email: `hol-admin-b-${Date.now()}@example.test`, name: "Admin B", passwordHash: "x" },
  });
  const userT = await db.user.create({
    data: { email: `hol-teacher-${Date.now()}@example.test`, name: "Teacher", passwordHash: "x" },
  });

  adminA = ctx({ userId: userA.id, schoolId: schoolA, role: "ADMIN" });
  adminB = ctx({ userId: userB.id, schoolId: schoolB, role: "ADMIN" });
  teacherA = ctx({ userId: userT.id, schoolId: schoolA, role: "TEACHER" });
});

beforeEach(async () => {
  await db.holiday.deleteMany({ where: { schoolId: { in: [schoolA, schoolB] } } });
  await db.academicYear.deleteMany({ where: { schoolId: { in: [schoolA, schoolB] } } });
});

afterAll(async () => {
  await db.holiday.deleteMany({ where: { schoolId: { in: [schoolA, schoolB] } } });
  await db.academicYear.deleteMany({ where: { schoolId: { in: [schoolA, schoolB] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolA, schoolB] } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("span maths", () => {
  const holiday = (start: string, end: string, kind = "HOLIDAY") => ({
    startDateKey: start,
    endDateKey: end,
    kind,
  });

  it("counts both ends of a span", () => {
    expect(spanLengthDays(holiday("2026-10-19", "2026-10-23"))).toBe(5);
  });

  it("counts a single day as one day, not zero", () => {
    expect(spanLengthDays(holiday("2026-10-19", "2026-10-19"))).toBe(1);
  });

  it("counts across a month boundary", () => {
    expect(spanLengthDays(holiday("2026-10-30", "2026-11-02"))).toBe(4);
  });

  it("counts across a leap day", () => {
    expect(spanLengthDays(holiday("2028-02-28", "2028-03-01"))).toBe(3);
  });

  it("rejects a backwards span", () => {
    expect(spanLengthDays(holiday("2026-10-23", "2026-10-19"))).toBe(-1);
  });

  it("rejects a span whose dates are not dates", () => {
    expect(spanLengthDays(holiday("2026-13-01", "2026-13-02"))).toBe(-1);
  });

  /**
   * The regression this file exists for.
   *
   * `dateKeyRange` caps its output and truncates SILENTLY. So an over-long span
   * used to come back as exactly 366 keys — a number that looks like a real
   * range, passes a length check, and answers "is the school shut in June" with
   * a confident no because June fell off the end.
   */
  it("returns nothing for a span longer than a year rather than a truncated one", () => {
    const tooLong = holiday("2026-01-01", "2028-01-01");
    expect(spanLengthDays(tooLong)).toBeGreaterThan(MAX_HOLIDAY_SPAN_DAYS);
    expect(spanDayKeys(tooLong)).toEqual([]);
  });

  it("expands a span to every day inside it", () => {
    expect(spanDayKeys(holiday("2026-10-19", "2026-10-22"))).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
    ]);
  });
});

describe("what closes the school", () => {
  const diwali = { startDateKey: "2026-11-06", endDateKey: "2026-11-10", kind: "HOLIDAY" };
  const exams = { startDateKey: "2026-12-01", endDateKey: "2026-12-05", kind: "EXAM" };
  const sportsDay = { startDateKey: "2026-12-11", endDateKey: "2026-12-11", kind: "EVENT" };

  it("treats a holiday as closed", () => {
    expect(closedDayKeys([diwali]).has("2026-11-08")).toBe(true);
  });

  /**
   * The distinction the `kind` column exists for. An exam week is on the
   * calendar and the school is OPEN — counting it as closed would quietly take a
   * week a term out of every "out of N school days" figure in the app.
   */
  it("does not treat an exam week as closed", () => {
    expect(closedDayKeys([exams]).has("2026-12-02")).toBe(false);
  });

  it("does not treat an event as closed", () => {
    expect(closedDayKeys([sportsDay]).has("2026-12-11")).toBe(false);
  });

  it("still lists an exam among the day's entries even though school is open", () => {
    const on = entriesOn([diwali, exams, sportsDay], "2026-12-02");
    expect(on).toHaveLength(1);
    expect(on[0]!.kind).toBe("EXAM");
  });

  it("counts a Sunday as closed without anyone declaring it", () => {
    // 2026-11-15 is a Sunday.
    expect(isSchoolClosed([], "2026-11-15")).toBe(true);
  });

  /** Mon–Sat week: an undeclared Saturday is a school day, not a day off. */
  it("counts an undeclared Saturday as OPEN", () => {
    // 2026-11-14 is a Saturday.
    expect(isSchoolClosed([], "2026-11-14")).toBe(false);
  });

  it("counts a Saturday the school declared shut as closed", () => {
    const spans = [{ startDateKey: "2026-11-14", endDateKey: "2026-11-14", kind: "HOLIDAY" }];
    expect(isSchoolClosed(spans, "2026-11-14")).toBe(true);
  });

  it("counts an ordinary weekday with nothing on it as open", () => {
    expect(isSchoolClosed([diwali, exams], "2026-11-18")).toBe(false);
  });

  it("counts a declared holiday on a weekday as closed", () => {
    expect(isSchoolClosed([diwali], "2026-11-09")).toBe(true);
  });
});

describe("school days between two dates", () => {
  /**
   * THE WEEK IS MONDAY TO SATURDAY. Six teaching days, Sunday off.
   *
   * Every count below turns on that and would be wrong by a sixth under a
   * Mon–Fri assumption — a whole day a week on a figure families compare. The
   * dates are pinned to real weekdays: 2026-11-16 is a Monday, 11-21 a
   * Saturday, 11-22 a Sunday.
   */
  it("counts Monday to Saturday as six school days and drops only Sunday", () => {
    expect(schoolDaysBetween("2026-11-16", "2026-11-22", [])).toBe(6);
  });

  it("counts a Saturday as an ordinary school day", () => {
    // Sat 2026-11-21 alone.
    expect(schoolDaysBetween("2026-11-21", "2026-11-21", [])).toBe(1);
  });

  it("counts a Sunday as no school day at all", () => {
    expect(schoolDaysBetween("2026-11-22", "2026-11-22", [])).toBe(0);
  });

  it("subtracts a holiday that falls on a weekday", () => {
    const spans = [{ startDateKey: "2026-11-18", endDateKey: "2026-11-18", kind: "HOLIDAY" }];
    expect(schoolDaysBetween("2026-11-16", "2026-11-20", spans)).toBe(4);
  });

  /**
   * The one that flipped when the week became Mon–Sat. A Saturday holiday used
   * to be a no-op because Saturday was already off; now it is a real day the
   * school would otherwise have taught, so declaring it MUST subtract.
   */
  it("subtracts a holiday declared on a Saturday, because Saturday is taught", () => {
    const spans = [{ startDateKey: "2026-11-21", endDateKey: "2026-11-21", kind: "HOLIDAY" }];
    expect(schoolDaysBetween("2026-11-16", "2026-11-22", spans)).toBe(5);
  });

  it("still does not subtract a holiday declared on a Sunday", () => {
    const spans = [{ startDateKey: "2026-11-22", endDateKey: "2026-11-22", kind: "HOLIDAY" }];
    expect(schoolDaysBetween("2026-11-16", "2026-11-22", spans)).toBe(6);
  });

  it("does not subtract an exam week — the school is open", () => {
    const spans = [{ startDateKey: "2026-11-16", endDateKey: "2026-11-20", kind: "EXAM" }];
    expect(schoolDaysBetween("2026-11-16", "2026-11-20", spans)).toBe(5);
  });

  it("counts a single school day as one", () => {
    expect(schoolDaysBetween("2026-11-16", "2026-11-16", [])).toBe(1);
  });

  it("returns zero for a backwards window rather than a negative count", () => {
    expect(schoolDaysBetween("2026-11-20", "2026-11-16", [])).toBe(0);
  });

  /** Loud, not truncated — a capped count reads as a real one and is wrong. */
  it("throws rather than silently truncating an over-long window", () => {
    expect(() => schoolDaysBetween("2026-01-01", "2028-01-01", [])).toThrow(/exceeds/);
  });
});

describe("what is coming up", () => {
  const spans = [
    { name: "Diwali", startDateKey: "2026-11-06", endDateKey: "2026-11-10", kind: "HOLIDAY" },
    { name: "Exams", startDateKey: "2026-12-01", endDateKey: "2026-12-05", kind: "EXAM" },
  ];

  it("picks the earliest entry still ahead", () => {
    expect(nextEntry(spans, "2026-10-01")?.name).toBe("Diwali");
  });

  /** Mid-break, the break itself is still "what is on" — not the next one. */
  it("keeps showing a break the school is currently inside", () => {
    expect(nextEntry(spans, "2026-11-08")?.name).toBe("Diwali");
  });

  it("moves on once an entry has finished", () => {
    expect(nextEntry(spans, "2026-11-11")?.name).toBe("Exams");
  });

  it("returns null when the calendar is empty", () => {
    expect(nextEntry([], "2026-11-11")).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */

describe("creating calendar entries", () => {
  it("stores a range an admin gives it", async () => {
    const id = await createHoliday(adminA, {
      name: "Diwali break",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-10",
      kind: "HOLIDAY",
    });

    const row = await db.holiday.findUniqueOrThrow({ where: { id } });
    expect(row.schoolId).toBe(schoolA);
    expect(row.startDateKey).toBe("2026-11-06");
    expect(row.endDateKey).toBe("2026-11-10");
  });

  it("treats a blank end date as a single day", async () => {
    const id = await createHoliday(adminA, {
      name: "Republic Day",
      startDateKey: "2027-01-26",
      endDateKey: "",
      kind: "HOLIDAY",
    });
    const row = await db.holiday.findUniqueOrThrow({ where: { id } });
    expect(row.endDateKey).toBe("2027-01-26");
  });

  it("pins a new entry to the year the school is running", async () => {
    const year = await db.academicYear.create({
      data: {
        schoolId: schoolA,
        name: "2026–27",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2027-04-30"),
        isCurrent: true,
      },
    });

    const id = await createHoliday(adminA, {
      name: "Holi",
      startDateKey: "2027-03-03",
      endDateKey: "2027-03-04",
      kind: "HOLIDAY",
    });

    const row = await db.holiday.findUniqueOrThrow({ where: { id } });
    expect(row.academicYearId).toBe(year.id);
  });

  it("still stores an entry when no year has been set up", async () => {
    const id = await createHoliday(adminA, {
      name: "Founders Day",
      startDateKey: "2026-09-09",
      endDateKey: "2026-09-09",
      kind: "EVENT",
    });
    const row = await db.holiday.findUniqueOrThrow({ where: { id } });
    expect(row.academicYearId).toBeNull();
  });

  it("refuses a teacher", async () => {
    await expect(
      createHoliday(teacherA, {
        name: "Nope",
        startDateKey: "2026-11-06",
        endDateKey: "2026-11-06",
        kind: "HOLIDAY",
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses an end date before the start", async () => {
    await expect(
      createHoliday(adminA, {
        name: "Backwards",
        startDateKey: "2026-11-10",
        endDateKey: "2026-11-06",
        kind: "HOLIDAY",
      }),
    ).rejects.toThrow(/before the start/);
  });

  it("refuses a range longer than a year", async () => {
    await expect(
      createHoliday(adminA, {
        name: "Forever",
        startDateKey: "2026-01-01",
        endDateKey: "2028-01-01",
        kind: "HOLIDAY",
      }),
    ).rejects.toThrow(/longer than a year/);
  });

  it("refuses a date that is not a date", async () => {
    await expect(
      createHoliday(adminA, {
        name: "Nonsense",
        startDateKey: "2026-02-30",
        endDateKey: "2026-02-30",
        kind: "HOLIDAY",
      }),
    ).rejects.toThrow(/not a real date/);
  });

  it("refuses a nameless entry", async () => {
    await expect(
      createHoliday(adminA, {
        name: "  ",
        startDateKey: "2026-11-06",
        endDateKey: "2026-11-06",
        kind: "HOLIDAY",
      }),
    ).rejects.toThrow(/name/);
  });

  it("refuses a kind it does not know", async () => {
    await expect(
      createHoliday(adminA, {
        name: "Mystery",
        startDateKey: "2026-11-06",
        endDateKey: "2026-11-06",
        kind: "STRIKE" as never,
      }),
    ).rejects.toThrow(/holiday, exam or event/);
  });
});

describe("editing and removing", () => {
  it("updates an entry in the admin's own school", async () => {
    const id = await createHoliday(adminA, {
      name: "Diwali break",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-10",
      kind: "HOLIDAY",
    });

    await updateHoliday(adminA, id, {
      name: "Diwali break (extended)",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-12",
      kind: "HOLIDAY",
    });

    const row = await db.holiday.findUniqueOrThrow({ where: { id } });
    expect(row.name).toBe("Diwali break (extended)");
    expect(row.endDateKey).toBe("2026-11-12");
  });

  /**
   * A scoped find precedes the write. Without it Prisma updates zero rows and
   * reports success, which is indistinguishable from having worked.
   */
  it("refuses to edit another school's entry, and does not touch it", async () => {
    const id = await createHoliday(adminB, {
      name: "B's holiday",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-06",
      kind: "HOLIDAY",
    });

    await expect(
      updateHoliday(adminA, id, {
        name: "Hijacked",
        startDateKey: "2026-11-06",
        endDateKey: "2026-11-06",
        kind: "HOLIDAY",
      }),
    ).rejects.toBeInstanceOf(AccessError);

    const row = await db.holiday.findUniqueOrThrow({ where: { id } });
    expect(row.name).toBe("B's holiday");
  });

  it("deletes an entry", async () => {
    const id = await createHoliday(adminA, {
      name: "Cancelled",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-06",
      kind: "EVENT",
    });
    await deleteHoliday(adminA, id);
    expect(await db.holiday.findUnique({ where: { id } })).toBeNull();
  });

  it("refuses to delete another school's entry", async () => {
    const id = await createHoliday(adminB, {
      name: "B's holiday",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-06",
      kind: "HOLIDAY",
    });
    await expect(deleteHoliday(adminA, id)).rejects.toBeInstanceOf(AccessError);
    expect(await db.holiday.findUnique({ where: { id } })).not.toBeNull();
  });
});

describe("listing", () => {
  beforeEach(async () => {
    await createHoliday(adminA, {
      name: "Summer break",
      startDateKey: "2027-05-01",
      endDateKey: "2027-06-15",
      kind: "HOLIDAY",
    });
    await createHoliday(adminA, {
      name: "Diwali",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-10",
      kind: "HOLIDAY",
    });
    await createHoliday(adminB, {
      name: "B only",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-10",
      kind: "HOLIDAY",
    });
  });

  it("returns only the asking school's entries", async () => {
    const rows = await listHolidays(schoolA);
    expect(rows.map((r) => r.name).sort()).toEqual(["Diwali", "Summer break"]);
  });

  it("returns them in date order", async () => {
    const rows = await listHolidays(schoolA);
    expect(rows[0]!.name).toBe("Diwali");
  });

  /**
   * Overlap, not containment. A break running May to June belongs on the
   * calendar for the whole of May AND the whole of June; a containment test
   * would drop it from every month it covers except the one it starts in.
   */
  it("includes a span that merely overlaps the window", async () => {
    const rows = await listHolidays(schoolA, { fromKey: "2027-06-01", toKey: "2027-06-30" });
    expect(rows.map((r) => r.name)).toEqual(["Summer break"]);
  });

  it("excludes a span entirely outside the window", async () => {
    const rows = await listHolidays(schoolA, { fromKey: "2026-12-01", toKey: "2026-12-31" });
    expect(rows).toHaveLength(0);
  });

  it("ignores a window whose dates are junk rather than returning nothing", async () => {
    const rows = await listHolidays(schoolA, { fromKey: "not-a-date", toKey: "also-not" });
    expect(rows).toHaveLength(2);
  });
});

describe("closedOn — the question the register asks", () => {
  beforeEach(async () => {
    await createHoliday(adminA, {
      name: "Diwali",
      startDateKey: "2026-11-06",
      endDateKey: "2026-11-10",
      kind: "HOLIDAY",
    });
    await createHoliday(adminA, {
      name: "Half-yearly exams",
      startDateKey: "2026-12-01",
      endDateKey: "2026-12-05",
      kind: "EXAM",
    });
  });

  it("says closed in the MIDDLE of a break, not only on its first day", async () => {
    const answer = await closedOn(schoolA, "2026-11-08");
    expect(answer.closed).toBe(true);
    expect(answer.entries[0]!.name).toBe("Diwali");
  });

  it("says open during exam week, but still names it", async () => {
    const answer = await closedOn(schoolA, "2026-12-02");
    expect(answer.closed).toBe(false);
    expect(answer.entries[0]!.name).toBe("Half-yearly exams");
  });

  it("says open on an ordinary day with nothing on it", async () => {
    const answer = await closedOn(schoolA, "2026-11-18");
    expect(answer.closed).toBe(false);
    expect(answer.entries).toEqual([]);
  });

  it("does not leak another school's calendar", async () => {
    const answer = await closedOn(schoolB, "2026-11-08");
    expect(answer.closed).toBe(false);
  });

  it("treats a junk date as open rather than throwing at the register", async () => {
    const answer = await closedOn(schoolA, "yesterday");
    expect(answer.closed).toBe(false);
  });
});
