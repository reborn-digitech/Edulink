import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  arrangeCover,
  assertMayTakeRegister,
  cancelCover,
  classesIMayTake,
  listCovers,
  registerDuty,
  registerTakersFor,
  setAttendanceRight,
} from "@/lib/register-duty";
import type { ActiveContext } from "@/lib/session";
import { formatDateKey } from "@/lib/dates";

/**
 * Who may take a class's register today.
 *
 * THE FAILURE MODES POINT IN OPPOSITE DIRECTIONS, which is why this has its own
 * file. Too tight and a register cannot be taken at all — thirty children
 * unmarked because the one person authorised is off sick. Too loose and any
 * teacher in the building can mark any class, which is how a register stops
 * being evidence of anything.
 *
 * So the tests below are in two halves that pull against each other: what must
 * be refused, and what must never be refusable. The second half is the one that
 * is easy to forget and expensive to get wrong.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
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

const TODAY = "2026-03-10";
const YESTERDAY = "2026-03-09";
const NEXT_WEEK = "2026-03-17";

let riversideId: string;
let oakfieldId: string;
let classId: string;
let otherSchoolClassId: string;

let admin: ActiveContext;
let principal: ActiveContext;
let classTeacher: ActiveContext;
let otherTeacher: ActiveContext;
let otherSchoolAdmin: ActiveContext;

let classTeacherRowId: string;
let classTeacherMembershipId: string;
let otherTeacherMembershipId: string;
let principalMembershipId: string;
let otherSchoolMembershipId: string;

const PRINCIPAL_EMAIL = "principal.duty.unit@riverside.test";
const SPARE_TEACHER_EMAIL = "spare.teacher.duty.unit@riverside.test";

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;
  oakfieldId = oakfield.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });

  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riversideId, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfieldId, role: "ADMIN" },
  });

  classTeacherMembershipId = tomTeacher.id;
  otherSchoolMembershipId = samAdmin.id;

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  classTeacher = ctx({
    userId: tom.id,
    membershipId: tomTeacher.id,
    schoolId: riversideId,
    role: "TEACHER",
  });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfieldId,
    role: "ADMIN",
  });

  // A principal, so "senior but not on the register" can actually be tested.
  const principalUser =
    (await db.user.findUnique({ where: { email: PRINCIPAL_EMAIL } })) ??
    (await db.user.create({
      data: { email: PRINCIPAL_EMAIL, name: "The Principal", prefs: "{}" },
    }));
  const principalMembership = await db.membership.upsert({
    where: {
      userId_schoolId_role: {
        userId: principalUser.id,
        schoolId: riversideId,
        role: "PRINCIPAL",
      },
    },
    create: {
      userId: principalUser.id,
      schoolId: riversideId,
      role: "PRINCIPAL",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });
  principalMembershipId = principalMembership.id;
  principal = ctx({
    userId: principalUser.id,
    membershipId: principalMembership.id,
    schoolId: riversideId,
    role: "PRINCIPAL",
  });

  // A class of this suite's OWN. Nothing here touches a seeded one.
  //
  // THE SECOND TIME THIS FILE BROKE FOUR OTHERS. First it DELETED a seeded
  // ClassTeacher row to get a teacher who was not on the class; then, fixed, it
  // still ADDED Tom as class teacher of the first seeded class and never took
  // him off — so `bulletin` and `files`, which use Tom as "a teacher of a
  // different class", started letting him read what he should not. Adding is as
  // destructive as deleting when the row is shared. The rule that actually holds
  // is: make your own fixtures, touch nobody else's.
  const klass = await db.class.upsert({
    where: { joinCode: "ZZZ-DUTY" },
    create: {
      schoolId: riversideId,
      name: "ZZ Register Duty Test Class",
      gradeLevel: "5",
      joinCode: "ZZZ-DUTY",
    },
    update: {},
  });
  classId = klass.id;

  const otherKlass = await db.class.findFirstOrThrow({ where: { schoolId: oakfieldId } });
  otherSchoolClassId = otherKlass.id;

  // Tom is the class teacher, with register duty.
  const row = await db.classTeacher.upsert({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId: tomTeacher.id } },
    create: {
      classId,
      schoolId: riversideId,
      teacherMembershipId: tomTeacher.id,
      role: "LEAD",
      canTakeAttendance: true,
    },
    update: { canTakeAttendance: true, role: "LEAD" },
  });
  classTeacherRowId = row.id;

  // A teacher who is deliberately NOT on this class.
  //
  // MADE, NOT BORROWED, and that was a real bug before it was a comment: this
  // used to delete the seeded ClassTeacher row linking Priya to the class, which
  // is shared fixture data. Four other suites read it, vitest runs files in
  // parallel, and they started failing with "Student not found in your classes"
  // — a failure in files that had not changed, caused by a setup step here.
  // Test fixtures may add; deleting somebody else's is how a suite becomes
  // order-dependent.
  const spare =
    (await db.user.findUnique({ where: { email: SPARE_TEACHER_EMAIL } })) ??
    (await db.user.create({
      data: { email: SPARE_TEACHER_EMAIL, name: "Spare Teacher", prefs: "{}" },
    }));
  const spareMembership = await db.membership.upsert({
    where: {
      userId_schoolId_role: { userId: spare.id, schoolId: riversideId, role: "TEACHER" },
    },
    create: { userId: spare.id, schoolId: riversideId, role: "TEACHER", status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
  otherTeacherMembershipId = spareMembership.id;
  otherTeacher = ctx({
    userId: spare.id,
    membershipId: spareMembership.id,
    schoolId: riversideId,
    role: "TEACHER",
  });
});

afterEach(async () => {
  await db.attendanceCover.deleteMany({ where: { schoolId: { in: [riversideId, oakfieldId] } } });
  // Cover now notifies the person covering, so the rows accumulate across tests
  // in this file and a count assertion would read its neighbours' work.
  await db.notification.deleteMany({
    where: { user: { email: { in: [PRINCIPAL_EMAIL, SPARE_TEACHER_EMAIL] } } },
  });
  await db.classTeacher.update({
    where: { id: classTeacherRowId },
    data: { canTakeAttendance: true },
  });
});

afterAll(async () => {
  await db.attendanceCover.deleteMany({ where: { schoolId: { in: [riversideId, oakfieldId] } } });
  const made = [PRINCIPAL_EMAIL, SPARE_TEACHER_EMAIL];
  await db.notification.deleteMany({ where: { user: { email: { in: made } } } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { teacher: { user: { email: { in: made } } } } });
  await db.membership.deleteMany({ where: { user: { email: { in: made } } } });
  await db.user.deleteMany({ where: { email: { in: made } } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.$disconnect();
});

describe("the ordinary case", () => {
  it("lets the class teacher take their own register", async () => {
    const duty = await registerDuty(classTeacher, classId, TODAY);
    expect(duty).toMatchObject({ may: true, reason: "CLASS_TEACHER" });
  });

  it("⚠ refuses a teacher at the same school who is not on this class", async () => {
    // The register is evidence. Any teacher in the building being able to mark
    // any class is how it stops being that.
    const duty = await registerDuty(otherTeacher, classId, TODAY);
    expect(duty).toMatchObject({ may: false, reason: "NONE" });
  });

  it("⚠ refuses a class in another school outright", async () => {
    const duty = await registerDuty(admin, otherSchoolClassId, TODAY);
    expect(duty.may).toBe(false);
  });

  it("⚠ refuses even an admin of the other school", async () => {
    const duty = await registerDuty(otherSchoolAdmin, classId, TODAY);
    expect(duty.may).toBe(false);
  });
});

describe("⚠ an admin is the last failsafe", () => {
  it("may take any register in their own school", async () => {
    // Not a convenience. If the class teacher is ill, the cover is ill, and
    // nobody set anything up, the register still has to happen this morning.
    const duty = await registerDuty(admin, classId, TODAY);
    expect(duty).toMatchObject({ may: true, reason: "ADMIN" });
  });

  it("⚠ can still take it when every class teacher's duty is withdrawn", async () => {
    await setAttendanceRight(admin, classTeacherRowId, false);
    expect((await registerDuty(classTeacher, classId, TODAY)).may).toBe(false);
    expect((await registerDuty(admin, classId, TODAY)).may).toBe(true);
  });
});

describe("⚠ a principal is not on the register", () => {
  it("cannot take a register merely for being senior", async () => {
    // Adding them "because they outrank a teacher" is exactly how a role stops
    // meaning anything. They read the school and decide who may be away.
    const duty = await registerDuty(principal, classId, TODAY);
    expect(duty).toMatchObject({ may: false, reason: "NONE" });
  });

  it("…but may take one they have actually been asked to cover", async () => {
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: principalMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect((await registerDuty(principal, classId, TODAY)).may).toBe(true);
  });
});

describe("withdrawing register duty", () => {
  it("stops that teacher, and says so", async () => {
    await setAttendanceRight(admin, classTeacherRowId, false);
    const duty = await registerDuty(classTeacher, classId, TODAY);
    expect(duty).toMatchObject({ may: false, reason: "NONE" });
  });

  it("gives it back", async () => {
    await setAttendanceRight(admin, classTeacherRowId, false);
    await setAttendanceRight(admin, classTeacherRowId, true);
    expect((await registerDuty(classTeacher, classId, TODAY)).may).toBe(true);
  });

  it("⚠ is an admin decision, not a teacher's own", async () => {
    await expect(setAttendanceRight(classTeacher, classTeacherRowId, false)).rejects.toBeInstanceOf(
      AccessError,
    );
    await expect(setAttendanceRight(principal, classTeacherRowId, false)).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("refuses a class-teacher row from another school", async () => {
    const result = await setAttendanceRight(otherSchoolAdmin, classTeacherRowId, false);
    expect(result.ok).toBe(false);
  });
});

describe("⚠ cover", () => {
  it("lets somebody else mark it, inside the dates", async () => {
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: NEXT_WEEK,
      reason: "Tom is on leave",
    });

    const duty = await registerDuty(otherTeacher, classId, TODAY);
    expect(duty).toMatchObject({ may: true, reason: "COVER", coverUntil: NEXT_WEEK });
  });

  it("⚠ and not one day outside them, at either end", async () => {
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });

    expect((await registerDuty(otherTeacher, classId, YESTERDAY)).may).toBe(false);
    expect((await registerDuty(otherTeacher, classId, "2026-03-11")).may).toBe(false);
    expect((await registerDuty(otherTeacher, classId, TODAY)).may).toBe(true);
  });

  it("is inclusive at both ends, because that is what a school means", async () => {
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: NEXT_WEEK,
    });
    expect((await registerDuty(otherTeacher, classId, TODAY)).may).toBe(true);
    expect((await registerDuty(otherTeacher, classId, NEXT_WEEK)).may).toBe(true);
  });

  it("⚠ ADDS a taker and never removes one", async () => {
    // A teacher whose leave is cancelled, or who comes in anyway, must not find
    // themselves locked out of their own register. Nobody is harmed by two
    // people being able to mark it; a class is harmed by nobody being able to.
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: NEXT_WEEK,
    });

    expect((await registerDuty(otherTeacher, classId, TODAY)).may).toBe(true);
    expect((await registerDuty(classTeacher, classId, TODAY)).may).toBe(true);
  });

  it("⚠ works for a class the coverer does not teach at all", async () => {
    // The entire point. Cover is for when the usual person is not there.
    // The spare teacher is on no class at all, which is the situation cover is
    // for: the usual person is away and somebody else steps in.
    const before = await db.classTeacher.findFirst({
      where: { classId, teacherMembershipId: otherTeacherMembershipId },
    });
    expect(before).toBeNull();

    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect((await registerDuty(otherTeacher, classId, TODAY)).may).toBe(true);
  });

  it("refuses a backwards range and a malformed date", async () => {
    expect(
      (
        await arrangeCover(admin, {
          classId,
          coveringMembershipId: otherTeacherMembershipId,
          fromDateKey: NEXT_WEEK,
          toDateKey: TODAY,
        })
      ).ok,
    ).toBe(false);

    expect(
      (
        await arrangeCover(admin, {
          classId,
          coveringMembershipId: otherTeacherMembershipId,
          fromDateKey: "10/03/2026",
          toDateKey: NEXT_WEEK,
        })
      ).ok,
    ).toBe(false);
  });

  it("⚠ refuses to name somebody who is not staff at this school", async () => {
    const oakfieldTeacher = await db.membership.findFirstOrThrow({
      where: { schoolId: oakfieldId, role: "TEACHER" },
    });
    const result = await arrangeCover(admin, {
      classId,
      coveringMembershipId: oakfieldTeacher.id,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect(result.ok).toBe(false);
  });

  it("⚠ refuses to name a pupil", async () => {
    const pupil = await db.membership.findFirstOrThrow({
      where: { schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
    });
    const result = await arrangeCover(admin, {
      classId,
      coveringMembershipId: pupil.id,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect(result.ok).toBe(false);
  });

  it("refuses a class in another school", async () => {
    const result = await arrangeCover(admin, {
      classId: otherSchoolClassId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect(result.ok).toBe(false);
  });

  it("⚠ a teacher cannot hand their own register to somebody else", async () => {
    // A staffing decision, not a personal one.
    await expect(
      arrangeCover(classTeacher, {
        classId,
        coveringMembershipId: otherTeacherMembershipId,
        fromDateKey: TODAY,
        toDateKey: TODAY,
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("a principal may arrange it, because approving leave is theirs", async () => {
    const result = await arrangeCover(principal, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect(result.ok).toBe(true);
  });

  it("cancels, and the duty goes with it", async () => {
    const created = await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: NEXT_WEEK,
    });
    expect(created.ok).toBe(true);
    if (!created.ok || !created.coverId) return;

    expect((await registerDuty(otherTeacher, classId, TODAY)).may).toBe(true);
    await cancelCover(admin, created.coverId);
    expect((await registerDuty(otherTeacher, classId, TODAY)).may).toBe(false);
  });

  /**
   * THE PERSON DOING THE WORK IS TOLD.
   *
   * This was the whole failure: cover was arranged correctly, the register
   * appeared on somebody's attendance page, and nothing said so. Every
   * assertion above would have passed with the notification missing — `may` was
   * true, the dates were right — which is exactly why it went unnoticed. Duty
   * without notice is thirty children unmarked by somebody who never knew.
   */
  it("⚠ tells the person who now has to mark it", async () => {
    const created = await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: NEXT_WEEK,
    });
    expect(created.ok).toBe(true);

    const told = await db.notification.findMany({
      where: { user: { email: SPARE_TEACHER_EMAIL } },
    });
    expect(told).toHaveLength(1);
    expect(told[0]!.title).toContain("ZZ Register Duty Test Class");
    // Dates as the school reads them — dd/mm/yyyy — not the raw key.
    expect(told[0]!.body).toContain(formatDateKey(TODAY));
    expect(told[0]!.body).toContain(formatDateKey(NEXT_WEEK));
    // Somewhere they can act on it, not a dead end.
    expect(told[0]!.url).toBe("/teacher/attendance");
  });

  it("⚠ tells them again when the cover is cancelled", async () => {
    const created = await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    if (!created.ok || !created.coverId) throw new Error("setup");

    await cancelCover(admin, created.coverId);

    // Being told you are covering and never told you are not is how somebody
    // walks into a room that already has a teacher in it.
    const titles = (
      await db.notification.findMany({
        where: { user: { email: SPARE_TEACHER_EMAIL } },
        orderBy: { createdAt: "asc" },
      })
    ).map((n) => n.title);
    expect(titles).toHaveLength(2);
    expect(titles[1]).toContain("no longer");
  });

  it("does not notify when the cover was refused", async () => {
    // A membership from another school: refused, and nobody hears about it.
    //
    // ⚠ A REAL MEMBERSHIP OF OAKFIELD, not a mangled id. This used to be
    // `principalMembershipId.replace(/.$/, "x")` — the principal's own id with
    // its last character overwritten — on the assumption that the result names
    // nobody. A cuid ends in a random base36 character, so roughly one run in
    // thirty-six it already ended in "x", the "bogus" id WAS the principal's,
    // cover was arranged for real, and this test failed on both of its
    // assertions in a file nobody had touched. The odds were the only thing
    // holding it up.
    //
    // Sam's Oakfield membership is refused for the reason the test is actually
    // about — `arrangeCover` looks the covering member up `schoolId`-scoped, so
    // somebody else's staff cannot be put on this register — rather than for
    // the incidental reason that a made-up string matches no row.
    const result = await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherSchoolMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect(result.ok).toBe(false);
    expect(
      await db.notification.count({
        where: { user: { email: { in: [PRINCIPAL_EMAIL, SPARE_TEACHER_EMAIL] } } },
      }),
    ).toBe(0);
  });

  it("refuses to cancel another school's cover", async () => {
    const created = await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    if (!created.ok || !created.coverId) throw new Error("setup");
    expect((await cancelCover(otherSchoolAdmin, created.coverId)).ok).toBe(false);
  });
});

describe("the lists the pages are built from", () => {
  it("names everyone down to take a register", async () => {
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });

    const takers = await registerTakersFor(riversideId, classId, TODAY);
    expect(takers.classTeachers).toContain(classTeacherMembershipId);
    expect(takers.covering).toContain(otherTeacherMembershipId);
  });

  it("leaves a withdrawn teacher out of the list", async () => {
    await setAttendanceRight(admin, classTeacherRowId, false);
    const takers = await registerTakersFor(riversideId, classId, TODAY);
    expect(takers.classTeachers).not.toContain(classTeacherMembershipId);
  });

  it("⚠ gives a teacher the classes they may MARK, not the ones they teach", async () => {
    const mine = await classesIMayTake(classTeacher, TODAY);
    expect(mine).toContain(classId);

    await setAttendanceRight(admin, classTeacherRowId, false);
    expect(await classesIMayTake(classTeacher, TODAY)).not.toContain(classId);
  });

  it("includes a class somebody is covering today, and drops it tomorrow", async () => {
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect(await classesIMayTake(otherTeacher, TODAY)).toContain(classId);
    expect(await classesIMayTake(otherTeacher, "2026-03-11")).not.toContain(classId);
  });

  it("gives an admin every class in their school", async () => {
    const all = await db.class.count({ where: { schoolId: riversideId, archivedAt: null } });
    expect(await classesIMayTake(admin, TODAY)).toHaveLength(all);
  });

  it("⚠ lists cover for admins and principals, and nobody else", async () => {
    await arrangeCover(admin, {
      classId,
      coveringMembershipId: otherTeacherMembershipId,
      fromDateKey: TODAY,
      toDateKey: TODAY,
    });
    expect(await listCovers(admin)).toHaveLength(1);
    expect(await listCovers(principal)).toHaveLength(1);
    await expect(listCovers(classTeacher)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the throwing variant", () => {
  it("throws for somebody with no duty, and returns it for somebody with one", async () => {
    await expect(assertMayTakeRegister(otherTeacher, classId, TODAY)).rejects.toBeInstanceOf(
      AccessError,
    );
    await expect(assertMayTakeRegister(classTeacher, classId, TODAY)).resolves.toMatchObject({
      may: true,
    });
  });
});
