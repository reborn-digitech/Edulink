import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  listPeriods,
  createPeriod,
  updatePeriod,
  archivePeriod,
  restorePeriod,
  applySuggestedDay,
  setSlot,
  clearSlot,
  copyDay,
  classWeek,
  teacherWeek,
  studentWeek,
  teacherAvailability,
  schoolBusyMap,
  teachingLoad,
  timetableClasses,
} from "@/lib/timetable";
import { decideLeave } from "@/lib/leave";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * The weekly timetable.
 *
 * WHAT IS WORTH TESTING HERE is not that a lesson can be saved — it is the
 * three places where a plausible implementation is quietly wrong:
 *
 *   THE DOUBLE BOOKING. A teacher in two rooms at 11:15 is a timetable somebody
 *   builds a term around before anybody notices. Refused in the application with
 *   a message, and refused again by a unique index, because two admins pressing
 *   save at the same moment both pass the first check.
 *
 *   THE RESOLUTION. The grid is a template with no dates in it; leave, cover and
 *   holidays only exist on real days. Everything about "the replacement shows up
 *   automatically" lives in that one function, including the case it must NOT
 *   get wrong: a teacher away with nobody arranged has to read as a gap, not as
 *   an ordinary lesson.
 *
 *   THE BORROWED WEEK. The person covering has to see the lesson in their own
 *   timetable, at the right time, on the right days — a Monday-to-Wednesday
 *   cover must not put Friday's lesson in anybody's week.
 *
 * The suite connects as the database OWNER, so RLS is not in force here and
 * nothing below proves a tenant boundary. What it proves is the application's
 * own rules. The boundary is `npm run rls:verify`; the route gates are
 * `npm run sweep`.
 */

const db = new PrismaClient();

const SCHOOL_SLUG = "zz-timetable-school";
const OTHER_SLUG = "zz-timetable-other";
const EMAIL_SUFFIX = "@zztimetable.test";

let schoolId: string;
let otherSchoolId: string;

let admin: ActiveContext;
let principal: ActiveContext;
let rao: string; // teacher membership
let khan: string; // teacher membership
let pupil: string; // student membership
let classA: string;
let classB: string;

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

async function member(
  name: string,
  role: string,
  school = schoolId,
): Promise<{ membershipId: string; userId: string }> {
  const user = await db.user.create({
    data: {
      email: `${name.toLowerCase().replace(/\W/g, "")}${EMAIL_SUFFIX}`,
      name,
      preferredName: name,
      prefs: "{}",
    },
  });
  const membership = await db.membership.create({
    data: { userId: user.id, schoolId: school, role, status: "ACTIVE" },
  });
  return { membershipId: membership.id, userId: user.id };
}

async function makeClass(name: string, school = schoolId): Promise<string> {
  const klass = await db.class.create({
    data: {
      schoolId: school,
      name,
      joinCode: `ZZTT${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    },
  });
  return klass.id;
}

/** One lesson period, so a slot has somewhere to go. */
async function period(name: string, startMinute: number): Promise<string> {
  const result = await createPeriod(admin, {
    name,
    startMinute,
    endMinute: startMinute + 45,
    kind: "LESSON",
  });
  if (!result.ok || !result.id) throw new Error(result.error ?? "period not created");
  return result.id;
}

beforeAll(async () => {
  const school = await db.school.upsert({
    where: { slug: SCHOOL_SLUG },
    create: {
      name: "ZZ Timetable School",
      slug: SCHOOL_SLUG,
      code: "ZZTTBL",
      contactEmail: `office${EMAIL_SUFFIX}`,
      timezone: "Asia/Kolkata",
    },
    update: {},
  });
  schoolId = school.id;

  const other = await db.school.upsert({
    where: { slug: OTHER_SLUG },
    create: {
      name: "ZZ Timetable Other",
      slug: OTHER_SLUG,
      code: "ZZTTBL2",
      contactEmail: `other${EMAIL_SUFFIX}`,
    },
    update: {},
  });
  otherSchoolId = other.id;
});

beforeEach(async () => {
  const adminMember = await member("Adhira", "ADMIN");
  admin = context({
    userId: adminMember.userId,
    membershipId: adminMember.membershipId,
    schoolId,
    role: "ADMIN",
  });

  const principalMember = await member("Priya", "PRINCIPAL");
  principal = context({
    userId: principalMember.userId,
    membershipId: principalMember.membershipId,
    schoolId,
    role: "PRINCIPAL",
  });

  rao = (await member("Rao", "TEACHER")).membershipId;
  khan = (await member("Khan", "TEACHER")).membershipId;
  pupil = (await member("Asha", "STUDENT")).membershipId;

  classA = await makeClass("Class 5A");
  classB = await makeClass("Class 6B");
});

/**
 * Cleaned between tests, and the ORDER is not incidental: slots and periods
 * belong to the school rather than to a user, so deleting the users first
 * leaves them behind to clash with the next test's unique constraints.
 */
afterEach(async () => {
  for (const school of [schoolId, otherSchoolId]) {
    await db.timetableSlot.deleteMany({ where: { schoolId: school } });
    await db.timetablePeriod.deleteMany({ where: { schoolId: school } });
    await db.attendanceCover.deleteMany({ where: { schoolId: school } });
    await db.leaveRequest.deleteMany({ where: { schoolId: school } });
    await db.holiday.deleteMany({ where: { schoolId: school } });
    await db.class.deleteMany({ where: { schoolId: school } });
  }
  await db.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { slug: { in: [SCHOOL_SLUG, OTHER_SLUG] } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* The school day                                                              */
/* -------------------------------------------------------------------------- */

describe("the school day", () => {
  it("adds a period and reads it back", async () => {
    const result = await createPeriod(admin, {
      name: "Period 1",
      startMinute: 510,
      endMinute: 555,
      kind: "LESSON",
    });
    expect(result.ok).toBe(true);

    const periods = await listPeriods(schoolId);
    expect(periods.map((p) => [p.name, p.startMinute, p.kind])).toEqual([
      ["Period 1", 510, "LESSON"],
    ]);
  });

  it("⚠ orders the day by the clock, not by the order it was typed", async () => {
    // An admin who adds the afternoon first would otherwise get a grid whose
    // times run backwards, which reads as corrupted data rather than as a
    // list in insertion order.
    await period("Afternoon", 780);
    await period("Morning", 510);

    expect((await listPeriods(schoolId)).map((p) => p.name)).toEqual(["Morning", "Afternoon"]);
  });

  it("⚠ re-sorts after an edit moves a period across the day", async () => {
    const morning = await period("First", 510);
    await period("Second", 600);
    await updatePeriod(admin, morning, {
      name: "First",
      startMinute: 900,
      endMinute: 945,
      kind: "LESSON",
    });

    expect((await listPeriods(schoolId)).map((p) => p.name)).toEqual(["Second", "First"]);
  });

  it("refuses a period with unusable times, with the message the form uses", async () => {
    const result = await createPeriod(admin, {
      name: "Backwards",
      startMinute: 600,
      endMinute: 510,
      kind: "LESSON",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/end after it starts/);
  });

  it("refuses a period with no name", async () => {
    const result = await createPeriod(admin, {
      name: "   ",
      startMinute: 510,
      endMinute: 555,
      kind: "LESSON",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/name/);
  });

  it("⚠ retiring a period keeps the lessons that were in it", async () => {
    const p1 = await period("Period 1", 510);
    await setSlot(admin, { classId: classA, periodId: p1, weekday: 1, subject: "Maths" });

    await archivePeriod(admin, p1);

    // Off the grid…
    expect(await listPeriods(schoolId)).toEqual([]);
    // …and the lesson is still there, which is the whole difference between
    // retiring and deleting. `periodId` cascades; an archive does not.
    expect(await db.timetableSlot.count({ where: { classId: classA } })).toBe(1);

    await restorePeriod(admin, p1);
    const grid = await classWeek(admin, classA);
    expect(grid.slots.map((s) => s.subject)).toEqual(["Maths"]);
  });

  it("refuses to retire the same period twice", async () => {
    const p1 = await period("Period 1", 510);
    expect((await archivePeriod(admin, p1)).ok).toBe(true);
    const again = await archivePeriod(admin, p1);
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already retired/);
  });

  it("lays out a first day for a school with none, and refuses to do it twice", async () => {
    const first = await applySuggestedDay(admin);
    expect(first.ok).toBe(true);
    expect(first.created).toBeGreaterThan(0);

    const again = await applySuggestedDay(admin);
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already has a day/);
  });

  it("⚠ will not lay out a day over one that was retired", async () => {
    // Counting only the LIVE periods would let "start from a typical day" append
    // eight more rows to a school that had built and tidied its own day.
    const p1 = await period("Period 1", 510);
    await archivePeriod(admin, p1);
    expect((await applySuggestedDay(admin)).ok).toBe(false);
  });

  it("refuses everybody who is not an admin", async () => {
    await expect(
      createPeriod(principal, { name: "P", startMinute: 510, endMinute: 555, kind: "LESSON" }),
    ).rejects.toThrow(AccessError);
  });
});

/* -------------------------------------------------------------------------- */
/* Putting a lesson on the grid                                                */
/* -------------------------------------------------------------------------- */

describe("a lesson on the grid", () => {
  let p1: string;
  let p2: string;

  beforeEach(async () => {
    p1 = await period("Period 1", 510);
    p2 = await period("Period 2", 600);
  });

  it("saves subject, teacher and room", async () => {
    const result = await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Mathematics",
      teacherMembershipId: rao,
      room: "Lab 2",
    });
    expect(result.ok).toBe(true);

    const grid = await classWeek(admin, classA);
    expect(grid.slots).toHaveLength(1);
    expect(grid.slots[0]).toMatchObject({
      subject: "Mathematics",
      room: "Lab 2",
      teacherName: "Rao",
      weekday: 2,
      uncovered: false,
    });
  });

  it("saves a lesson with no teacher, so a grid can be laid out before it is staffed", async () => {
    const result = await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "Art",
    });
    expect(result.ok).toBe(true);
    const grid = await classWeek(admin, classA);
    expect(grid.slots[0]!.teacherMembershipId).toBeNull();
  });

  it("changes the lesson already in a cell rather than making a second one", async () => {
    await setSlot(admin, { classId: classA, periodId: p1, weekday: 1, subject: "Art" });
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "Music",
      teacherMembershipId: khan,
    });

    const grid = await classWeek(admin, classA);
    expect(grid.slots).toHaveLength(1);
    expect(grid.slots[0]).toMatchObject({ subject: "Music", teacherName: "Khan" });
  });

  it("clears a cell", async () => {
    await setSlot(admin, { classId: classA, periodId: p1, weekday: 1, subject: "Art" });
    expect((await clearSlot(admin, classA, 1, p1)).ok).toBe(true);
    expect((await classWeek(admin, classA)).slots).toEqual([]);

    const again = await clearSlot(admin, classA, 1, p1);
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/no lesson/);
  });

  it("requires a subject", async () => {
    const result = await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "   ",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/what is taught/);
  });

  it("⚠ refuses a break — nothing is timetabled into lunch", async () => {
    const lunch = await createPeriod(admin, {
      name: "Lunch",
      startMinute: 700,
      endMinute: 740,
      kind: "BREAK",
    });
    const result = await setSlot(admin, {
      classId: classA,
      periodId: lunch.id!,
      weekday: 1,
      subject: "Maths",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/is a break/);
  });

  it("refuses Sunday and anything that is not a day", async () => {
    for (const weekday of [0, 7, -1, 1.5]) {
      const result = await setSlot(admin, {
        classId: classA,
        periodId: p1,
        weekday,
        subject: "Maths",
      });
      expect(result.ok, `weekday ${weekday}`).toBe(false);
    }
  });

  it("⚠ refuses a class from another school, however real the id is", async () => {
    const foreign = await makeClass("Someone else's class", otherSchoolId);
    const result = await setSlot(admin, {
      classId: foreign,
      periodId: p1,
      weekday: 1,
      subject: "Maths",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not in this school/);
  });

  it("⚠ refuses a period from another school", async () => {
    const foreignPeriod = await db.timetablePeriod.create({
      data: {
        schoolId: otherSchoolId,
        name: "Their period",
        startMinute: 510,
        endMinute: 555,
        kind: "LESSON",
        position: 0,
      },
    });
    const result = await setSlot(admin, {
      classId: classA,
      periodId: foreignPeriod.id,
      weekday: 1,
      subject: "Maths",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not on this school's day/);
  });

  it("⚠ refuses a teacher from another school", async () => {
    const outsider = await member("Outsider", "TEACHER", otherSchoolId);
    const result = await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "Maths",
      teacherMembershipId: outsider.membershipId,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not teaching staff/);
  });

  it("refuses a pupil as the teacher of a lesson", async () => {
    const result = await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "Maths",
      teacherMembershipId: pupil,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not teaching staff/);
  });

  it("truncates rather than refusing an over-long subject", async () => {
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "x".repeat(500),
    });
    const grid = await classWeek(admin, classA);
    expect(grid.slots[0]!.subject.length).toBe(60);
  });

  it("refuses everybody who is not an admin", async () => {
    await expect(
      setSlot(principal, { classId: classA, periodId: p1, weekday: 1, subject: "Maths" }),
    ).rejects.toThrow(AccessError);
  });

  /* ---------------------------------------------------------------------- */

  describe("⚠ nobody is in two rooms at once", () => {
    it("refuses the second class, and names the first", async () => {
      await setSlot(admin, {
        classId: classA,
        periodId: p1,
        weekday: 2,
        subject: "Maths",
        teacherMembershipId: rao,
      });

      const result = await setSlot(admin, {
        classId: classB,
        periodId: p1,
        weekday: 2,
        subject: "Science",
        teacherMembershipId: rao,
      });
      expect(result.ok).toBe(false);
      // The message has to say WHICH lesson is in the way; "unavailable" leaves
      // the admin to go looking through six days for it.
      expect(result.error).toContain("Class 5A");
      expect(result.error).toContain("Maths");
    });

    it("allows the same teacher at the same time on a DIFFERENT day", async () => {
      await setSlot(admin, {
        classId: classA,
        periodId: p1,
        weekday: 2,
        subject: "Maths",
        teacherMembershipId: rao,
      });
      const result = await setSlot(admin, {
        classId: classB,
        periodId: p1,
        weekday: 3,
        subject: "Science",
        teacherMembershipId: rao,
      });
      expect(result.ok).toBe(true);
    });

    it("allows the same teacher on the same day in a DIFFERENT period", async () => {
      await setSlot(admin, {
        classId: classA,
        periodId: p1,
        weekday: 2,
        subject: "Maths",
        teacherMembershipId: rao,
      });
      const result = await setSlot(admin, {
        classId: classB,
        periodId: p2,
        weekday: 2,
        subject: "Science",
        teacherMembershipId: rao,
      });
      expect(result.ok).toBe(true);
    });

    it("⚠ does not treat a lesson as clashing with itself", async () => {
      await setSlot(admin, {
        classId: classA,
        periodId: p1,
        weekday: 2,
        subject: "Maths",
        teacherMembershipId: rao,
      });
      // Editing the room on the SAME cell must not be refused because the
      // teacher already teaches it. Excluding the class from the clash query
      // is what makes an edit possible at all.
      const result = await setSlot(admin, {
        classId: classA,
        periodId: p1,
        weekday: 2,
        subject: "Maths",
        teacherMembershipId: rao,
        room: "Lab 1",
      });
      expect(result.ok).toBe(true);
    });

    it("⚠ lets many unstaffed lessons share a time", async () => {
      // The unique index includes the teacher, and Postgres treats NULLs as
      // distinct — which is exactly what makes laying a grid out before
      // staffing it possible. If this ever fails, that index has been made
      // NULLS NOT DISTINCT and the builder cannot be used in the order an
      // admin actually works.
      await setSlot(admin, { classId: classA, periodId: p1, weekday: 2, subject: "Maths" });
      const result = await setSlot(admin, {
        classId: classB,
        periodId: p1,
        weekday: 2,
        subject: "Science",
      });
      expect(result.ok).toBe(true);
    });

    it("⚠ the database refuses it too, when the check is bypassed", async () => {
      /**
       * THE CHECK ABOVE IS A COURTESY; THIS IS THE GUARANTEE. Two admins saving
       * at the same instant both read an empty clash query and both proceed, so
       * the application check cannot be the thing that holds. Written directly
       * through Prisma here to skip `setSlot` entirely — which is the closest
       * this suite can get to that race.
       */
      await setSlot(admin, {
        classId: classA,
        periodId: p1,
        weekday: 2,
        subject: "Maths",
        teacherMembershipId: rao,
      });

      await expect(
        db.timetableSlot.create({
          data: {
            schoolId,
            classId: classB,
            periodId: p1,
            weekday: 2,
            subject: "Science",
            teacherMembershipId: rao,
          },
        }),
      ).rejects.toThrow();
    });
  });
});

/* -------------------------------------------------------------------------- */
/* Who is free                                                                 */
/* -------------------------------------------------------------------------- */

describe("who is free", () => {
  let p1: string;

  beforeEach(async () => {
    p1 = await period("Period 1", 510);
  });

  it("lists everyone, with the busy ones named and put last", async () => {
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Maths",
      teacherMembershipId: rao,
    });

    const options = await teacherAvailability(admin, 2, p1, { forClassId: classB });
    const busy = options.filter((o) => o.busyWith !== null);
    const free = options.filter((o) => o.busyWith === null);

    expect(busy.map((o) => o.name)).toEqual(["Rao"]);
    expect(busy[0]!.busyWith).toBe("Class 5A — Maths");
    // Free names come first, because the list exists to answer "who can take
    // this" rather than "who is here".
    expect(options.slice(0, free.length).every((o) => o.busyWith === null)).toBe(true);
    // A principal may teach; an admin is an office role and is not offered.
    expect(free.map((o) => o.name).sort()).toEqual(["Khan", "Priya"]);
  });

  it("⚠ does not count the lesson being edited as making its own teacher busy", async () => {
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Maths",
      teacherMembershipId: rao,
    });
    const options = await teacherAvailability(admin, 2, p1, { forClassId: classA });
    expect(options.find((o) => o.name === "Rao")!.busyWith).toBeNull();
  });

  it("builds the whole grid's answer in one map", async () => {
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Maths",
      teacherMembershipId: rao,
    });
    const busy = await schoolBusyMap(admin, classB);
    expect(busy[`2:${p1}`]?.[rao]).toBe("Class 5A — Maths");
    expect(busy[`3:${p1}`]).toBeUndefined();

    // Excluding the class being edited is the same rule as above, applied to
    // every cell at once.
    expect(await schoolBusyMap(admin, classA)).toEqual({});
  });

  it("counts how many lessons a week each teacher carries", async () => {
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Maths",
      teacherMembershipId: rao,
    });
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 3,
      subject: "Maths",
      teacherMembershipId: rao,
    });
    const load = await teachingLoad(admin);
    expect(load.get(rao)).toBe(2);
    expect(load.get(khan)).toBeUndefined();
  });

  it("refuses everybody who is not an admin", async () => {
    await expect(teacherAvailability(principal, 2, p1)).rejects.toThrow(AccessError);
    await expect(schoolBusyMap(principal, null)).rejects.toThrow(AccessError);
  });
});

/* -------------------------------------------------------------------------- */
/* Copying a day                                                               */
/* -------------------------------------------------------------------------- */

describe("copying a day", () => {
  let p1: string;
  let p2: string;

  beforeEach(async () => {
    p1 = await period("Period 1", 510);
    p2 = await period("Period 2", 600);
  });

  it("copies every lesson, teachers and all", async () => {
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "Maths",
      teacherMembershipId: rao,
      room: "Lab 2",
    });
    await setSlot(admin, { classId: classA, periodId: p2, weekday: 1, subject: "Art" });

    const result = await copyDay(admin, classA, 1, 3);
    expect(result).toMatchObject({ ok: true, copied: 2, unstaffed: 0 });

    const grid = await classWeek(admin, classA);
    const wednesday = grid.slots.filter((s) => s.weekday === 3);
    expect(wednesday.map((s) => s.subject).sort()).toEqual(["Art", "Maths"]);
    expect(wednesday.find((s) => s.subject === "Maths")).toMatchObject({
      teacherName: "Rao",
      room: "Lab 2",
    });
  });

  it("⚠ replaces the target day rather than merging into it", async () => {
    await setSlot(admin, { classId: classA, periodId: p1, weekday: 1, subject: "Maths" });
    await setSlot(admin, { classId: classA, periodId: p2, weekday: 3, subject: "Games" });

    await copyDay(admin, classA, 1, 3);

    const grid = await classWeek(admin, classA);
    // Games is gone. A merge would leave Wednesday holding a mixture of two
    // days with no way to tell which was intended.
    expect(grid.slots.filter((s) => s.weekday === 3).map((s) => s.subject)).toEqual(["Maths"]);
  });

  it("⚠ brings a lesson across without its teacher when they are already busy", async () => {
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 1,
      subject: "Maths",
      teacherMembershipId: rao,
    });
    // Rao already teaches somebody else at that time on Wednesday.
    await setSlot(admin, {
      classId: classB,
      periodId: p1,
      weekday: 3,
      subject: "Science",
      teacherMembershipId: rao,
    });

    const result = await copyDay(admin, classA, 1, 3);
    expect(result).toMatchObject({ ok: true, copied: 1, unstaffed: 1 });

    const grid = await classWeek(admin, classA);
    const copied = grid.slots.find((s) => s.weekday === 3)!;
    // The lesson exists and is visibly unstaffed. Dropping it silently would
    // leave a hole in the day that nobody was told about.
    expect(copied.subject).toBe("Maths");
    expect(copied.teacherMembershipId).toBeNull();
  });

  it("refuses copying a day onto itself, and an empty day", async () => {
    await setSlot(admin, { classId: classA, periodId: p1, weekday: 1, subject: "Maths" });
    expect((await copyDay(admin, classA, 1, 1)).error).toMatch(/same day/);
    expect((await copyDay(admin, classA, 4, 5)).error).toMatch(/nothing on that day/);
  });

  it("refuses Sunday at either end", async () => {
    await setSlot(admin, { classId: classA, periodId: p1, weekday: 1, subject: "Maths" });
    expect((await copyDay(admin, classA, 1, 0)).ok).toBe(false);
    expect((await copyDay(admin, classA, 0, 1)).ok).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* The resolved week                                                           */
/* -------------------------------------------------------------------------- */

/** 2026-08-03 is a Monday; 2026-08-04 a Tuesday. */
const MONDAY = "2026-08-03";
const TUESDAY = "2026-08-04";

async function approvedLeave(
  teacherMembershipId: string,
  fromDateKey: string,
  toDateKey: string,
): Promise<string> {
  const request = await db.leaveRequest.create({
    data: {
      schoolId,
      teacherMembershipId,
      fromDateKey,
      toDateKey,
      kind: "SICK",
      reason: "Unwell",
      status: "APPROVED",
    },
  });
  return request.id;
}

describe("the resolved week", () => {
  let p1: string;

  beforeEach(async () => {
    p1 = await period("Period 1", 510);
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2, // Tuesday
      subject: "Maths",
      teacherMembershipId: rao,
    });
  });

  it("an ordinary week shows the assigned teacher and nothing else", async () => {
    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    expect(grid.slots[0]).toMatchObject({
      teacherName: "Rao",
      coveringName: null,
      uncovered: false,
    });
    expect(grid.days.map((d) => d.dateKey)).toEqual([
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
    ]);
  });

  it("⚠ the template has no dates and no cover in it at all", async () => {
    await approvedLeave(rao, TUESDAY, TUESDAY);
    const template = await classWeek(admin, classA);
    // The grid an admin edits must not change shape because somebody is ill on
    // Tuesday — the lesson is still Rao's every other week of the year.
    expect(template.slots[0]).toMatchObject({ teacherName: "Rao", uncovered: false });
    expect(template.days.every((d) => d.dateKey === null)).toBe(true);
  });

  it("⚠ a teacher away with nobody arranged reads as a gap", async () => {
    await approvedLeave(rao, TUESDAY, TUESDAY);

    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    expect(grid.slots[0]).toMatchObject({
      teacherName: "Rao",
      coveringName: null,
      uncovered: true,
    });
  });

  it("⚠ shows the replacement automatically once cover is arranged", async () => {
    const leaveId = await approvedLeave(rao, TUESDAY, TUESDAY);
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        leaveRequestId: leaveId,
      },
    });

    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    expect(grid.slots[0]).toMatchObject({
      teacherName: "Rao",
      coveringName: "Khan",
      uncovered: false,
    });
    // The assigned teacher is NOT overwritten. "Khan covering for Rao" is the
    // sentence a pupil needs; a silent swap is how a timetable stops being
    // trusted.
    expect(grid.slots[0]!.teacherMembershipId).toBe(rao);
  });

  it("⚠ ignores cover on a day the teacher is not away", async () => {
    // A cover row spanning the week, and no leave at all behind it. Reading the
    // cover alone would replace the teacher on the timetable of somebody who is
    // standing in the room.
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: MONDAY,
        toDateKey: "2026-08-08",
      },
    });

    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    expect(grid.slots[0]).toMatchObject({ teacherName: "Rao", coveringName: null });
  });

  it("⚠ ignores leave outside the week, and leave that was never approved", async () => {
    await approvedLeave(rao, "2026-09-01", "2026-09-05");
    await db.leaveRequest.create({
      data: {
        schoolId,
        teacherMembershipId: rao,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        kind: "CASUAL",
        reason: "Pending still",
        status: "PENDING",
      },
    });

    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    expect(grid.slots[0]!.uncovered).toBe(false);
  });

  it("⚠ prefers the cover arranged for THIS absence over an unrelated one", async () => {
    const leaveId = await approvedLeave(rao, TUESDAY, TUESDAY);
    // An older, hand-arranged cover for the same class and the same day.
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: pupil, // deliberately wrong, to be sure which won
        fromDateKey: MONDAY,
        toDateKey: "2026-08-08",
      },
    });
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        leaveRequestId: leaveId,
      },
    });

    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    expect(grid.slots[0]!.coveringMembershipId).toBe(khan);
  });

  it("marks the day the school is shut, by name", async () => {
    await db.holiday.create({
      data: {
        schoolId,
        name: "Independence Day",
        startDateKey: TUESDAY,
        endDateKey: TUESDAY,
        kind: "HOLIDAY",
      },
    });

    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    const tuesday = grid.days.find((d) => d.dateKey === TUESDAY)!;
    expect(tuesday.closed).toBe(true);
    expect(tuesday.closedName).toBe("Independence Day");
  });

  it("⚠ an exam week does not close the school", async () => {
    await db.holiday.create({
      data: {
        schoolId,
        name: "Half-yearly",
        startDateKey: MONDAY,
        endDateKey: "2026-08-08",
        kind: "EXAM",
      },
    });
    const grid = await classWeek(admin, classA, { weekOf: MONDAY });
    expect(grid.days.every((d) => d.closed === false)).toBe(true);
  });

  it("marks today, and only today", async () => {
    const grid = await classWeek(admin, classA, { weekOf: MONDAY, todayKey: TUESDAY });
    expect(grid.days.filter((d) => d.isToday).map((d) => d.dateKey)).toEqual([TUESDAY]);
  });

  it("a principal reads any class; a pupil and a teacher cannot ask for one", async () => {
    expect((await classWeek(principal, classA, { weekOf: MONDAY })).slots).toHaveLength(1);

    const teacherCtx = context({ userId: "x", membershipId: rao, schoolId, role: "TEACHER" });
    const studentCtx = context({ userId: "y", membershipId: pupil, schoolId, role: "STUDENT" });
    await expect(classWeek(teacherCtx, classA)).rejects.toThrow(AccessError);
    await expect(classWeek(studentCtx, classA)).rejects.toThrow(AccessError);
  });

  it("⚠ refuses a class in another school", async () => {
    const foreign = await makeClass("Theirs", otherSchoolId);
    await expect(classWeek(admin, foreign)).rejects.toThrow(AccessError);
  });
});

/* -------------------------------------------------------------------------- */
/* A teacher's own week                                                        */
/* -------------------------------------------------------------------------- */

describe("a teacher's own week", () => {
  let p1: string;
  let raoCtx: ActiveContext;
  let khanCtx: ActiveContext;

  beforeEach(async () => {
    p1 = await period("Period 1", 510);
    raoCtx = context({ userId: "r", membershipId: rao, schoolId, role: "TEACHER" });
    khanCtx = context({ userId: "k", membershipId: khan, schoolId, role: "TEACHER" });

    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Maths",
      teacherMembershipId: rao,
    });
  });

  it("shows their own lessons and nobody else's", async () => {
    await setSlot(admin, {
      classId: classB,
      periodId: p1,
      weekday: 3,
      subject: "Science",
      teacherMembershipId: khan,
    });

    const mine = await teacherWeek(raoCtx, rao, { weekOf: MONDAY });
    expect(mine.slots.map((s) => [s.className, s.subject])).toEqual([["Class 5A", "Maths"]]);
  });

  it("⚠ puts a lesson they are covering into their week, marked as somebody else's", async () => {
    const leaveId = await approvedLeave(rao, TUESDAY, TUESDAY);
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        leaveRequestId: leaveId,
      },
    });

    const theirs = await teacherWeek(khanCtx, khan, { weekOf: MONDAY });
    expect(theirs.slots).toHaveLength(1);
    expect(theirs.slots[0]).toMatchObject({
      subject: "Maths",
      borrowed: true,
      teacherName: "Rao",
      coveringName: "Khan",
    });
  });

  it("⚠ does not put a covered lesson on a day the cover does not reach", async () => {
    // Wednesday's lesson, and a cover for Tuesday only. The two are the same
    // class, which is what makes this easy to get wrong.
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 3,
      subject: "Geography",
      teacherMembershipId: rao,
    });
    const leaveId = await approvedLeave(rao, TUESDAY, TUESDAY);
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        leaveRequestId: leaveId,
      },
    });

    const theirs = await teacherWeek(khanCtx, khan, { weekOf: MONDAY });
    expect(theirs.slots.map((s) => s.subject)).toEqual(["Maths"]);
  });

  it("⚠ a cover whose leave was cancelled puts nothing in anybody's week", async () => {
    // The cover row outlives a cancelled absence in more than one path — and a
    // lesson appearing in the week of somebody who is not needed is how two
    // teachers end up at the same door.
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
      },
    });

    const theirs = await teacherWeek(khanCtx, khan, { weekOf: MONDAY });
    expect(theirs.slots).toEqual([]);
  });

  it("⚠ the teacher who is away still sees the lesson, and who is taking it", async () => {
    const leaveId = await approvedLeave(rao, TUESDAY, TUESDAY);
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        leaveRequestId: leaveId,
      },
    });

    const mine = await teacherWeek(raoCtx, rao, { weekOf: MONDAY });
    expect(mine.slots[0]).toMatchObject({ coveringName: "Khan", borrowed: false });
  });
});

/* -------------------------------------------------------------------------- */
/* A pupil's own week                                                          */
/* -------------------------------------------------------------------------- */

describe("a pupil's own week", () => {
  let p1: string;
  let studentCtx: ActiveContext;

  beforeEach(async () => {
    p1 = await period("Period 1", 510);
    studentCtx = context({ userId: "s", membershipId: pupil, schoolId, role: "STUDENT" });
    await db.enrollment.create({
      data: { schoolId, classId: classA, studentMembershipId: pupil, status: "ACTIVE" },
    });
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Maths",
      teacherMembershipId: rao,
    });
  });

  it("shows the classes they are in", async () => {
    const week = await studentWeek(studentCtx, pupil, { weekOf: MONDAY });
    expect(week.slots.map((s) => s.subject)).toEqual(["Maths"]);
  });

  it("⚠ shows nothing for a class they were taken off", async () => {
    await db.enrollment.updateMany({
      where: { classId: classA, studentMembershipId: pupil },
      data: { status: "REMOVED", removedAt: new Date() },
    });
    expect((await studentWeek(studentCtx, pupil, { weekOf: MONDAY })).slots).toEqual([]);
  });

  it("shows the replacement, like everybody else's week does", async () => {
    const leaveId = await approvedLeave(rao, TUESDAY, TUESDAY);
    await db.attendanceCover.create({
      data: {
        schoolId,
        classId: classA,
        coveringMembershipId: khan,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        leaveRequestId: leaveId,
      },
    });

    const week = await studentWeek(studentCtx, pupil, { weekOf: MONDAY });
    expect(week.slots[0]!.coveringName).toBe("Khan");
  });

  it("a pupil in no class gets an empty week rather than an error", async () => {
    const orphan = await member("Nobody", "STUDENT");
    const ctx = context({
      userId: orphan.userId,
      membershipId: orphan.membershipId,
      schoolId,
      role: "STUDENT",
    });
    const week = await studentWeek(ctx, orphan.membershipId, { weekOf: MONDAY });
    expect(week.slots).toEqual([]);
    expect(week.periods).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------- */
/* Approving leave arranges cover for the lessons too                          */
/* -------------------------------------------------------------------------- */

describe("⚠ approving leave covers timetabled lessons, not just registers", () => {
  it("arranges cover for a class the applicant only meets on the timetable", async () => {
    const p1 = await period("Period 1", 510);
    // Rao teaches one period of Class 6B and is NOT a class teacher of it —
    // the visiting-music-teacher case. Before this, approving their leave
    // arranged nothing for 6B and the timetable reported the gap correctly.
    await setSlot(admin, {
      classId: classB,
      periodId: p1,
      weekday: 2,
      subject: "Music",
      teacherMembershipId: rao,
    });

    const request = await db.leaveRequest.create({
      data: {
        schoolId,
        teacherMembershipId: rao,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        kind: "SICK",
        reason: "Unwell",
        status: "PENDING",
      },
    });

    const decision = await decideLeave(principal, request.id, "APPROVED", {
      coverMembershipId: khan,
    });
    expect(decision.ok).toBe(true);
    expect(decision.coversCreated).toBe(1);

    const grid = await classWeek(admin, classB, { weekOf: MONDAY });
    expect(grid.slots[0]).toMatchObject({ coveringName: "Khan", uncovered: false });
  });

  it("⚠ does not arrange the same class twice when they are both class teacher and timetabled", async () => {
    const p1 = await period("Period 1", 510);
    await db.classTeacher.create({
      data: { schoolId, classId: classA, teacherMembershipId: rao, canTakeAttendance: true },
    });
    await setSlot(admin, {
      classId: classA,
      periodId: p1,
      weekday: 2,
      subject: "Maths",
      teacherMembershipId: rao,
    });

    const request = await db.leaveRequest.create({
      data: {
        schoolId,
        teacherMembershipId: rao,
        fromDateKey: TUESDAY,
        toDateKey: TUESDAY,
        kind: "SICK",
        reason: "Unwell",
        status: "PENDING",
      },
    });
    const decision = await decideLeave(principal, request.id, "APPROVED", {
      coverMembershipId: khan,
    });

    // Two cover rows for one class and one absence would notify the covering
    // teacher twice and read as two separate arrangements.
    expect(decision.coversCreated).toBe(1);
    expect(await db.attendanceCover.count({ where: { schoolId, classId: classA } })).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */

describe("the class list", () => {
  it("offers the school's live classes to staff, and refuses everybody else", async () => {
    await db.class.update({ where: { id: classB }, data: { archivedAt: new Date() } });
    expect((await timetableClasses(admin)).map((c) => c.name)).toEqual(["Class 5A"]);
    expect((await timetableClasses(principal)).map((c) => c.name)).toEqual(["Class 5A"]);

    const studentCtx = context({ userId: "s", membershipId: pupil, schoolId, role: "STUDENT" });
    await expect(timetableClasses(studentCtx)).rejects.toThrow(AccessError);
  });
});
