import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  departuresFrom,
  myRecords,
  recordDeparture,
  recordsForStudentMembership,
  recordsForStudentUser,
  undoDeparture,
} from "@/lib/school-record";
import type { ActiveContext } from "@/lib/session";

/**
 * A pupil leaving a school, and the certificate that goes with them.
 *
 * WHAT THIS FILE CAN AND CANNOT SHOW, said up front because the gap is the
 * whole point of the feature. The suite connects as the database OWNER, so
 * row-level security is NOT in force — which means the central claim, that
 * Oakfield may read Riverside's certificate for a child who is now theirs and
 * may read nothing else of Riverside's, cannot be made here. Every read in this
 * file would come back the same with the policy deleted.
 *
 * That claim is made in `npm run rls:verify`, live, against the real policy.
 * What is left for this file is everything the application decides: what a
 * departure does to the membership and the roll, that the numbers on the
 * certificate are a snapshot rather than a view, who may issue one, and that
 * undoing works.
 *
 * THE ONE THAT MATTERS HERE is the snapshot. A certificate that recomputes is
 * not a certificate — it is a query wearing one — and the difference only
 * shows up months later when the issuing school marks another register and a
 * document somebody has already handed over quietly changes.
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

const PUPIL_EMAIL = "leaver.record.unit@riverside.test";
/**
 * OUR OWN member of staff, and the reason is worth writing down.
 *
 * The "refuses to issue one for a member of staff" test below used seeded Tom.
 * Normally harmless — the call is refused, nothing happens. Then MUTATION
 * TESTING deleted the guard, the refusal became an action, and the run recorded
 * a seeded TEACHER as having left Riverside and wrote him a certificate. Four
 * other suites then failed in files nobody had edited.
 *
 * THE LESSON IS SHARPER THAN "MAKE YOUR OWN FIXTURES". A negative test is only
 * harmless while the guard it tests is present, and mutation testing exists
 * precisely to remove that guard. So the subject of a negative test has to be
 * disposable too — it is the case most likely to actually run.
 */
const STAFF_EMAIL = "leaver.record.staff.unit@riverside.test";
const CLASS_CODE = "ZZZ-LEAVE-REC";

let riversideId: string;
let oakfieldId: string;
let classId: string;
let admin: ActiveContext;
let teacher: ActiveContext;
let otherSchoolAdmin: ActiveContext;

let pupilUserId: string;
let pupilMembershipId: string;
let teacherMembershipId: string;
/** Disposable staff, for the one test that tries to make them leave. */
let spareStaffMembershipId: string;

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
  teacherMembershipId = tomTeacher.id;

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  teacher = ctx({
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

  // OUR OWN pupil and OUR OWN class. The rule this codebase learned the hard
  // way: a fixture that touches shared seed data breaks suites that have not
  // changed, and ADDING is as destructive as deleting because other suites
  // assert on what is not there.
  const spareUser = await db.user.upsert({
    where: { email: STAFF_EMAIL },
    create: { email: STAFF_EMAIL, name: "Spare Staff", prefs: "{}" },
    update: {},
  });
  const spareStaff = await db.membership.upsert({
    where: {
      userId_schoolId_role: { userId: spareUser.id, schoolId: riversideId, role: "TEACHER" },
    },
    create: { userId: spareUser.id, schoolId: riversideId, role: "TEACHER", status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  spareStaffMembershipId = spareStaff.id;

  const klass = await db.class.upsert({
    where: { joinCode: CLASS_CODE },
    create: {
      schoolId: riversideId,
      name: "ZZ Leaving Record Test Class",
      gradeLevel: "5",
      joinCode: CLASS_CODE,
    },
    update: {},
  });
  classId = klass.id;
});

/** A pupil with a term of history behind them, rebuilt before every test. */
async function makePupil(): Promise<void> {
  const user = await db.user.upsert({
    where: { email: PUPIL_EMAIL },
    create: { email: PUPIL_EMAIL, name: "Leaver Pupil", prefs: "{}" },
    update: {},
  });
  pupilUserId = user.id;

  const membership = await db.membership.create({
    data: {
      userId: user.id,
      schoolId: riversideId,
      role: "STUDENT",
      status: "ACTIVE",
      gradeLevel: "5",
      joinedAt: new Date("2024-04-01T00:00:00Z"),
    },
  });
  pupilMembershipId = membership.id;

  await db.enrollment.create({
    data: { classId, schoolId: riversideId, studentMembershipId: membership.id, status: "ACTIVE" },
  });

  // Four DAYS marked, three of them present — one of those LATE, which counts
  // as present everywhere else in this codebase and must here too. Four
  // sessions rather than four records: a register is one row per pupil per day,
  // and the unique constraint says so.
  const days = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"] as const;
  const statuses = ["PRESENT", "LATE", "ABSENT", "PRESENT"] as const;
  for (let i = 0; i < days.length; i += 1) {
    const session = await db.attendanceSession.create({
      data: {
        schoolId: riversideId,
        classId,
        dateKey: days[i]!,
        takenByMembershipId: teacherMembershipId,
      },
    });
    await db.attendanceRecord.create({
      data: {
        schoolId: riversideId,
        sessionId: session.id,
        studentMembershipId: membership.id,
        status: statuses[i]!,
        clientId: `zz-leave-${days[i]}-${Math.random().toString(36).slice(2)}`,
      },
    });
  }

  await db.reportCard.create({
    data: {
      schoolId: riversideId,
      classId,
      studentMembershipId: membership.id,
      title: "ZZ Leaving Term",
      status: "PUBLISHED",
      publishedAt: new Date(),
      fromDateKey: "2026-01-01",
      toDateKey: "2026-03-31",
    },
  });
}

async function wipePupil(): Promise<void> {
  const memberships = await db.membership.findMany({
    where: { user: { email: PUPIL_EMAIL } },
    select: { id: true },
  });
  const ids = memberships.map((m) => m.id);
  await db.schoolRecord.deleteMany({ where: { studentMembershipId: { in: ids } } });
  await db.reportCard.deleteMany({ where: { studentMembershipId: { in: ids } } });
  await db.attendanceRecord.deleteMany({ where: { studentMembershipId: { in: ids } } });
  await db.enrollment.deleteMany({ where: { studentMembershipId: { in: ids } } });
  await db.notification.deleteMany({ where: { user: { email: PUPIL_EMAIL } } });
  await db.membership.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(makePupil);

afterEach(async () => {
  await wipePupil();
  await db.attendanceSession.deleteMany({ where: { classId } });
  // Defensive, not decorative: if a guard is ever removed — by an edit or by a
  // mutation run — this is what stops the damage leaving this file.
  await db.schoolRecord.deleteMany({ where: { studentMembershipId: spareStaffMembershipId } });
  await db.membership.updateMany({
    where: { id: spareStaffMembershipId },
    data: { leftAt: null },
  });
  await makePupil();
});

afterAll(async () => {
  await wipePupil();
  await db.attendanceSession.deleteMany({ where: { classId } });
  await db.schoolRecord.deleteMany({ where: { studentMembershipId: spareStaffMembershipId } });
  await db.membership.deleteMany({ where: { user: { email: STAFF_EMAIL } } });
  await db.user.deleteMany({ where: { email: { in: [PUPIL_EMAIL, STAFF_EMAIL] } } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.$disconnect();
});

const LEAVING = { reason: "TRANSFERRED" as const, destination: "Oakfield Academy" };

describe("who may record a departure", () => {
  it("⚠ refuses a teacher", async () => {
    // A class teacher can take a child off their roll. Deciding that a child
    // has left the SCHOOL, and signing a document saying so, is not the same
    // act and does not belong to the same person.
    await expect(recordDeparture(teacher, pupilMembershipId, LEAVING)).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("⚠ refuses another school's admin, and does not confirm the pupil exists", async () => {
    const result = await recordDeparture(otherSchoolAdmin, pupilMembershipId, LEAVING);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.ok === false && result.errorKey).toBe("refusal.pupilNotHere");
  });

  it("⚠ refuses to issue one for a member of staff", async () => {
    // A leaving certificate describes attendance and report cards. Handing one
    // to a departing teacher would produce a document that reads as nonsense.
    const result = await recordDeparture(admin, spareStaffMembershipId, LEAVING);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.ok === false && result.errorKey).toBe("refusal.onlyPupilLeaves");
  });

  it("refuses a reason it does not recognise", async () => {
    const result = await recordDeparture(admin, pupilMembershipId, {
      reason: "EXPELLED" as never,
    });
    expect(result.ok).toBe(false);
  });
});

describe("what a departure does", () => {
  it("closes the membership and takes them off every roll", async () => {
    expect((await recordDeparture(admin, pupilMembershipId, LEAVING)).ok).toBe(true);

    const membership = await db.membership.findUniqueOrThrow({
      where: { id: pupilMembershipId },
    });
    expect(membership.leftAt).not.toBeNull();
    // ⚠ NOT suspended. The two mean different things and a school in September
    // needs to tell them apart.
    expect(membership.status).toBe("ACTIVE");

    const enrolments = await db.enrollment.findMany({
      where: { studentMembershipId: pupilMembershipId },
    });
    expect(enrolments).toHaveLength(1);
    expect(enrolments[0]!.status).toBe("REMOVED");
  });

  it("⚠ deletes nothing", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);

    // The school is still the school that holds this, and is very often
    // required to for years. A departure that tidied up would be the app
    // destroying a record on a school's behalf.
    expect(
      await db.attendanceRecord.count({ where: { studentMembershipId: pupilMembershipId } }),
    ).toBe(4);
    expect(await db.reportCard.count({ where: { studentMembershipId: pupilMembershipId } })).toBe(1);
  });

  it("tells the family, and points at the page the record is on", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    const notifications = await db.notification.findMany({
      where: { schoolId: riversideId, title: { contains: "recorded as leaving" } },
    });
    // The seeded pupil has no guardian, so this asserts the shape rather than a
    // count — see the guardian case in the sweep, which has a real one.
    for (const row of notifications) {
      expect(row.url).toBe(`/reports/${pupilMembershipId}`);
    }
  });

  it("refuses to record the same departure twice", async () => {
    expect((await recordDeparture(admin, pupilMembershipId, LEAVING)).ok).toBe(true);
    const second = await recordDeparture(admin, pupilMembershipId, LEAVING);
    expect(second.ok).toBe(false);
  });

  it("⚠ refuses a leaving date before the day they joined", async () => {
    const result = await recordDeparture(admin, pupilMembershipId, {
      ...LEAVING,
      leftOn: new Date("2020-01-01T00:00:00Z"),
    });
    expect(result.ok).toBe(false);
  });
});

describe("⚠ the certificate is a snapshot, not a query", () => {
  it("freezes the figures at the moment it is issued", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);

    const before = (await recordsForStudentUser(admin, pupilUserId))[0]!;
    expect(before.attendanceMarked).toBe(4);
    // LATE counts as present, matching every other attendance figure here.
    expect(before.attendancePresent).toBe(3);
    expect(before.attendancePercent).toBe(75);
    expect(before.reportCardCount).toBe(1);

    // The school carries on: another register, another report card. A pupil who
    // left in March cannot acquire an April attendance mark, but a school
    // correcting last term's register can — and a document already handed to
    // another school must not change underneath it.
    const later = await db.attendanceSession.create({
      data: {
        schoolId: riversideId,
        classId,
        dateKey: "2026-04-02",
        takenByMembershipId: teacherMembershipId,
      },
    });
    await db.attendanceRecord.create({
      data: {
        schoolId: riversideId,
        sessionId: later.id,
        studentMembershipId: pupilMembershipId,
        status: "ABSENT",
        clientId: `zz-leave-after-${Math.random().toString(36).slice(2)}`,
      },
    });
    await db.reportCard.create({
      data: {
        schoolId: riversideId,
        classId,
        studentMembershipId: pupilMembershipId,
        title: "ZZ After They Left",
        status: "PUBLISHED",
        publishedAt: new Date(),
        fromDateKey: "2026-04-01",
        toDateKey: "2026-04-30",
      },
    });

    const after = (await recordsForStudentUser(admin, pupilUserId))[0]!;
    expect(after.attendanceMarked).toBe(4);
    expect(after.attendancePresent).toBe(3);
    expect(after.reportCardCount).toBe(1);
  });

  /**
   * ⚠ THE NAME IS COPIED, NOT JOINED.
   *
   * A certificate signed in 2026 must not start saying something else because
   * the school rebranded in 2028 — so the view has to read the column on the
   * record rather than following the relation to School.
   *
   * PROVED BY DIVERGING THE TWO RATHER THAN BY RENAMING THE SCHOOL. Renaming
   * Riverside is what the first draft did, inside a try/finally, and it broke
   * four suites that look the school up BY NAME while it was renamed — vitest
   * runs files in parallel, so "I put it back" is not a defence. Writing a
   * different name onto this record makes exactly the same distinction and
   * touches nothing anybody else reads.
   */
  it("⚠ freezes the school's NAME, so a rename does not rewrite history", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    const record = await db.schoolRecord.findFirstOrThrow({
      where: { studentMembershipId: pupilMembershipId },
    });
    expect(record.schoolName).toBe("Riverside Primary School");

    await db.schoolRecord.update({
      where: { id: record.id },
      data: { schoolName: "Riverside Primary School (as it was called then)" },
    });

    const view = (await recordsForStudentUser(admin, pupilUserId))[0]!;
    // If this followed the relation it would read "Riverside Primary School",
    // the school's name today, and this assertion would fail.
    expect(view.schoolName).toBe("Riverside Primary School (as it was called then)");
  });

  it("⚠ reports no attendance as nothing, never as 0%", async () => {
    // A pupil who joined in the last week of term has no attendance. That is
    // not the same as never having turned up, and a certificate that says 0%
    // follows them to their next school.
    await db.attendanceRecord.deleteMany({ where: { studentMembershipId: pupilMembershipId } });
    await recordDeparture(admin, pupilMembershipId, LEAVING);

    const view = (await recordsForStudentUser(admin, pupilUserId))[0]!;
    expect(view.attendanceMarked).toBe(0);
    expect(view.attendancePercent).toBeNull();
  });

  it("carries what the school typed, trimmed and bounded", async () => {
    await recordDeparture(admin, pupilMembershipId, {
      reason: "GRADUATED",
      destination: "  Oakfield Academy  ",
      note: "  A pleasure to teach.  ",
    });
    const view = (await recordsForStudentUser(admin, pupilUserId))[0]!;
    expect(view.reason).toBe("GRADUATED");
    expect(view.destination).toBe("Oakfield Academy");
    expect(view.note).toBe("A pleasure to teach.");
  });

  it("treats an empty destination as absent rather than as an empty string", async () => {
    await recordDeparture(admin, pupilMembershipId, { reason: "LEFT", destination: "   " });
    const view = (await recordsForStudentUser(admin, pupilUserId))[0]!;
    expect(view.destination).toBeNull();
  });
});

describe("reading it back", () => {
  it("the pupil reads their own", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    // Their session has no school any more — that is the situation the whole
    // `studentUserId` column exists for.
    const asPupil = ctx({ userId: pupilUserId, role: "STUDENT", schoolId: null });
    const mine = await myRecords(asPupil);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.schoolName).toBe("Riverside Primary School");
  });

  it("⚠ says who issued it, so the same document reads correctly to both schools", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    const toIssuer = (await recordsForStudentUser(admin, pupilUserId))[0]!;
    const toSomebodyElse = (await recordsForStudentUser(otherSchoolAdmin, pupilUserId))[0]!;
    expect(toIssuer.issuedHere).toBe(true);
    expect(toSomebodyElse.issuedHere).toBe(false);
  });

  it("resolves a membership at THIS school to the person, and refuses a stranger's", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    expect(await recordsForStudentMembership(admin, pupilMembershipId)).toHaveLength(1);
    // A membership id from another school resolves to nobody rather than to
    // somebody else's child.
    expect(await recordsForStudentMembership(otherSchoolAdmin, pupilMembershipId)).toEqual([]);
  });

  it("lists this school's departures for an admin, and refuses everybody else", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    const leavers = await departuresFrom(admin);
    expect(leavers.some((row) => row.studentMembershipId === pupilMembershipId)).toBe(true);

    await expect(departuresFrom(teacher)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("⚠ undoing one", () => {
  it("puts them back and withdraws the certificate", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    expect((await undoDeparture(admin, pupilMembershipId)).ok).toBe(true);

    const membership = await db.membership.findUniqueOrThrow({ where: { id: pupilMembershipId } });
    expect(membership.leftAt).toBeNull();

    // Withdrawn rather than left behind: a receiving school must not be able to
    // read a document its issuer has retracted.
    expect(await db.schoolRecord.count({ where: { studentMembershipId: pupilMembershipId } })).toBe(
      0,
    );
  });

  it("⚠ does NOT put them back in their classes", async () => {
    // Which classes a returning child joins is the school's decision. Guessing
    // would silently re-add them to a class the school had moved them out of.
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    await undoDeparture(admin, pupilMembershipId);
    const enrolments = await db.enrollment.findMany({
      where: { studentMembershipId: pupilMembershipId },
    });
    expect(enrolments[0]!.status).toBe("REMOVED");
  });

  it("refuses for somebody who has not left, and for another school's pupil", async () => {
    expect((await undoDeparture(admin, pupilMembershipId)).ok).toBe(false);
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    expect((await undoDeparture(otherSchoolAdmin, pupilMembershipId)).ok).toBe(false);
  });

  it("⚠ leaves their marks and attendance alone", async () => {
    await recordDeparture(admin, pupilMembershipId, LEAVING);
    await undoDeparture(admin, pupilMembershipId);
    expect(
      await db.attendanceRecord.count({ where: { studentMembershipId: pupilMembershipId } }),
    ).toBe(4);
    expect(await db.reportCard.count({ where: { studentMembershipId: pupilMembershipId } })).toBe(1);
  });
});
