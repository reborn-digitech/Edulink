import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { birthdaysBetween } from "@/lib/birthdays";
import type { ActiveContext } from "@/lib/session";

/**
 * Birthdays on the school calendar.
 *
 * DERIVED, NEVER STORED, so the whole of this file is arithmetic about
 * recurrence — and the two cases that break a naive implementation both have
 * tests below and neither is exotic:
 *
 *   THE YEAR WRAP. "The next 120 days" asked in November spans two years, and
 *   any implementation comparing months as numbers returns nothing at all for
 *   the whole of it.
 *
 *   THE 29th OF FEBRUARY. Three years in four do not have one, and a child born
 *   on it is simply missing from the calendar while their classmates are named.
 *
 * WHAT THIS FILE DOES NOT TEST is that pupils cannot see this. That is a
 * property of where it is rendered — `/admin/calendar`, behind
 * `requireRole("ADMIN", "PRINCIPAL")` — and is checked by `npm run sweep`,
 * which requests it as every role.
 */

const db = new PrismaClient();

const SCHOOL_SLUG = "zz-birthday-school";
const EMAIL_SUFFIX = "@zzbirthday.test";

let schoolId: string;
let ctx: ActiveContext;

function context(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

/** Adds somebody with a birthday, and returns their membership id. */
async function member(
  name: string,
  role: string,
  birthdate: string | null,
  opts: { leftAt?: Date; status?: string } = {},
): Promise<string> {
  const email = `${name.toLowerCase().replace(/\W/g, "")}${EMAIL_SUFFIX}`;
  const user = await db.user.create({
    data: {
      email,
      name,
      preferredName: name,
      birthdate: birthdate ? new Date(`${birthdate}T00:00:00Z`) : null,
      prefs: "{}",
    },
  });
  const membership = await db.membership.create({
    data: {
      userId: user.id,
      schoolId,
      role,
      status: opts.status ?? "ACTIVE",
      leftAt: opts.leftAt ?? null,
    },
  });
  return membership.id;
}

beforeAll(async () => {
  const school = await db.school.upsert({
    where: { slug: SCHOOL_SLUG },
    create: {
      name: "ZZ Birthday School",
      slug: SCHOOL_SLUG,
      code: "ZZBIRTH",
      contactEmail: `office${EMAIL_SUFFIX}`,
    },
    update: {},
  });
  schoolId = school.id;
  ctx = context({ userId: "unused", schoolId, role: "ADMIN" });
});

afterEach(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
  await db.school.deleteMany({ where: { slug: SCHOOL_SLUG } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("whose birthday appears", () => {
  it("finds a pupil and a teacher in the window, on the right day", async () => {
    await member("Asha", "STUDENT", "2015-04-05");
    await member("Tomas", "TEACHER", "1988-04-07");

    const rows = await birthdaysBetween(ctx, "2026-04-01", "2026-04-30");
    expect(rows.map((r) => [r.name, r.dateKey, r.turning])).toEqual([
      ["Asha", "2026-04-05", 11],
      ["Tomas", "2026-04-07", 38],
    ]);
  });

  it("leaves out anybody with no date on file", async () => {
    await member("Nodate", "STUDENT", null);
    expect(await birthdaysBetween(ctx, "2026-01-01", "2026-12-31")).toEqual([]);
  });

  it("⚠ leaves out somebody who has left, and somebody paused", async () => {
    await member("Gone", "STUDENT", "2015-04-05", { leftAt: new Date("2026-03-20") });
    await member("Paused", "STUDENT", "2015-04-06", { status: "SUSPENDED" });

    // A calendar naming a child who left last term reads as the school not
    // having noticed, and a paused member is not in the room either.
    expect(await birthdaysBetween(ctx, "2026-04-01", "2026-04-30")).toEqual([]);
  });

  it("leaves out a birthday outside the window", async () => {
    await member("Later", "STUDENT", "2015-09-09");
    expect(await birthdaysBetween(ctx, "2026-04-01", "2026-04-30")).toEqual([]);
  });
});

describe("⚠ the arithmetic that goes wrong", () => {
  it("⚠ spans the new year, which is what 'the next 120 days' means in November", async () => {
    await member("Dec", "STUDENT", "2015-12-20");
    await member("Jan", "STUDENT", "2015-01-14");

    /**
     * THE TEST THAT KILLS THE OBVIOUS IMPLEMENTATION. Comparing months as
     * numbers — `month >= 11 && month <= 2` — is empty for every day of this
     * range, so a calendar opened in November would show nothing at all and
     * look merely quiet rather than broken.
     */
    const rows = await birthdaysBetween(ctx, "2026-11-15", "2027-02-15");
    expect(rows.map((r) => [r.name, r.dateKey])).toEqual([
      ["Dec", "2026-12-20"],
      ["Jan", "2027-01-14"],
    ]);
  });

  it("⚠ shows a leap-day birthday on the 28th in a year with no 29th", async () => {
    await member("Leaper", "STUDENT", "2016-02-29");

    const rows = await birthdaysBetween(ctx, "2027-02-01", "2027-02-28");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.dateKey).toBe("2027-02-28");
    // Flagged, so nobody looking for the 29th wonders whether the date is wrong.
    expect(rows[0]!.movedFromLeapDay).toBe(true);
    expect(rows[0]!.turning).toBe(11);
  });

  it("⚠ shows it on the 29th in a leap year, and only once", async () => {
    await member("Leaper", "STUDENT", "2016-02-29");

    const rows = await birthdaysBetween(ctx, "2028-02-01", "2028-02-29");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.dateKey).toBe("2028-02-29");
    expect(rows[0]!.movedFromLeapDay).toBe(false);
  });

  it("⚠ knows 2100 is not a leap year", async () => {
    /**
     * `year % 4 === 0` passes every other test in this file — mutation testing
     * said so — because it is only wrong at century years not divisible by 400,
     * and the rest of the suite lives in the 2020s.
     *
     * Worth a test rather than a shrug: the simplification is genuinely wrong,
     * a school using this in 2100 would find its leap-day pupils missing for a
     * year, and the cost of pinning it is four lines. The alternative — leaving
     * an untested branch in a date function — is how the century rule gets
     * "simplified" by somebody in a hurry.
     */
    await member("Leaper", "STUDENT", "2096-02-29");

    const rows = await birthdaysBetween(ctx, "2100-02-01", "2100-02-28");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.dateKey).toBe("2100-02-28");
    expect(rows[0]!.movedFromLeapDay).toBe(true);
  });

  it("⚠ does not move a 28 February birthday anywhere", async () => {
    // The mirror of the case above: somebody genuinely born on the 28th must
    // appear once, on the 28th, in every kind of year.
    await member("Twentyeighth", "STUDENT", "2015-02-28");

    const leap = await birthdaysBetween(ctx, "2028-02-01", "2028-02-29");
    const notLeap = await birthdaysBetween(ctx, "2027-02-01", "2027-02-28");
    expect(leap.map((r) => r.dateKey)).toEqual(["2028-02-28"]);
    expect(notLeap.map((r) => r.dateKey)).toEqual(["2027-02-28"]);
    expect(notLeap[0]!.movedFromLeapDay).toBe(false);
  });

  it("⚠ reports no age rather than a wrong one for a nonsense year", async () => {
    // A mistyped year is how "turning 1,026" gets onto a school calendar, and
    // printing it as fact is how nobody notices it is wrong.
    await member("Mistyped", "STUDENT", "1000-04-05");

    const rows = await birthdaysBetween(ctx, "2026-04-01", "2026-04-30");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.turning).toBeNull();
  });

  it("counts the day itself at both ends of the window", async () => {
    await member("First", "STUDENT", "2015-04-01");
    await member("Last", "STUDENT", "2015-04-30");

    const rows = await birthdaysBetween(ctx, "2026-04-01", "2026-04-30");
    expect(rows.map((r) => r.name)).toEqual(["First", "Last"]);
  });
});

describe("⚠ it is one school's", () => {
  it("says nothing when the session has no school", async () => {
    await member("Asha", "STUDENT", "2015-04-05");
    const noSchool = context({ userId: "unused", schoolId: null, role: null });
    expect(await birthdaysBetween(noSchool, "2026-04-01", "2026-04-30")).toEqual([]);
  });
});
