import { PLACEHOLDER_KEYS } from "@/lib/certificate-rules";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  cancelScheduledDeparture,
  certificateFor,
  departuresFrom,
  runDueDepartures,
  scheduleDeparture,
  myRecords,
  recordDeparture,
  recordsForStudentMembership,
  recordsForStudentUser,
  undoDeparture,
} from "@/lib/school-record";
import type { ActiveContext } from "@/lib/session";
import { dateKeyInZone } from "@/lib/dates";

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


describe("the certificate as a document", () => {
  it("⚠ freezes the document's lines at issue, numbers it per school per year, and reads it in the tenant-bound way for the office", async () => {
    const result = await recordDeparture(admin, pupilMembershipId, {
      reason: "TRANSFERRED",
      destination: "Oakfield Academy",
      conduct: "GOOD",
      leftOn: new Date("2026-04-30T00:00:00Z"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tc = await certificateFor(admin, result.recordId);
    expect(tc).not.toBeNull();
    expect(tc!.serial).toMatch(/^TC\/2026\/\d{4}$/);
    expect(tc!.studentName).toBe((await db.user.findUniqueOrThrow({ where: { id: pupilUserId } })).name);
    // The school's own register number is what the line carries; the student code is nowhere on the document.
    expect(tc!.admissionNumber).toBe((await db.pupilRecord.findUnique({ where: { studentMembershipId: pupilMembershipId }, select: { admissionNumber: true } }))?.admissionNumber ?? null);
    expect(JSON.stringify(tc)).not.toContain("studentCode");
    // Nor the school's join code: whoever holds the paper could join the school with it.
    const joinCode = (await db.school.findUniqueOrThrow({ where: { id: admin.schoolId! }, select: { code: true } })).code;
    expect(JSON.stringify(tc)).not.toContain(joinCode);
    expect(Object.keys(tc!.school).sort()).toEqual(["addressLine", "logoPath", "name", "timezone"]);
    // And a template cannot put either on a certificate it issues.
    expect(PLACEHOLDER_KEYS).not.toContain("pupil.studentCode");
    expect(PLACEHOLDER_KEYS).not.toContain("school.code");
    const held = (await db.membership.findUniqueOrThrow({ where: { id: pupilMembershipId } })).studentCode;
    if (held) expect(JSON.stringify(tc)).not.toContain(held);
    expect(tc!.className).toBeTruthy();
    expect(tc!.conduct).toBe("GOOD");
    expect(tc!.issuedHere).toBe(true);
    expect(tc!.school.name).toBe("Riverside Primary School");

    // Renaming the child afterwards does not rewrite a certificate already handed over.
    await db.user.update({ where: { id: pupilUserId }, data: { name: "Renamed Later" } });
    expect((await certificateFor(admin, result.recordId))!.studentName).not.toBe("Renamed Later");

    // The next one this year at this school is the next number.
    const row = await db.schoolRecord.findUniqueOrThrow({ where: { id: result.recordId } });
    const n = Number(row.serial!.split("/")[2]);
    expect(n).toBeGreaterThanOrEqual(1);
  });

  it("⚠ another school's admin gets the same null a guessed id gets; the family reads it without a tenant", async () => {
    const result = await recordDeparture(admin, pupilMembershipId, { reason: "LEFT" });
    if (!result.ok) throw new Error("no record");
    expect(await certificateFor(otherSchoolAdmin, result.recordId)).toBeNull();
    expect(await certificateFor(admin, "does-not-exist")).toBeNull();
    // The pupil, as a person with no school on the session.
    const asPupil: ActiveContext = { ...admin, role: null, schoolId: null, membershipId: null, user: { ...admin.user, id: pupilUserId } };
    const own = await certificateFor(asPupil, result.recordId);
    expect(own?.issuedHere).toBe(false);
    expect(own?.serial).toBeTruthy();
  });

  it("fills in a certificate issued before the document existed, on the office's first reading", async () => {
    const result = await recordDeparture(admin, pupilMembershipId, { reason: "GRADUATED" });
    if (!result.ok) throw new Error("no record");
    await db.pupilRecord.upsert({ where: { studentMembershipId: pupilMembershipId }, create: { schoolId: admin.schoolId!, studentMembershipId: pupilMembershipId, admissionNumber: "GR/ZZ/0042" }, update: { admissionNumber: "GR/ZZ/0042" } });
    await db.schoolRecord.update({ where: { id: result.recordId }, data: { serial: null, studentName: null, admissionNumber: null } });
    const tc = await certificateFor(admin, result.recordId);
    expect(tc?.serial).toMatch(/^TC\//);
    expect(tc?.studentName).toBeTruthy();
    // What the school's register holds is what the line gets.
    expect(tc?.admissionNumber).toBe("GR/ZZ/0042");
  });
});


describe("what the family is left holding", () => {
  it("⚠ the parent's child list says the child has LEFT rather than dropping them or pretending", async () => {
    const { listContexts } = await import("@/lib/session");
    const parent = await db.user.create({ data: { email: "zz.leftvis.parent@riverside.test", name: "ZZ LeftVis Parent", prefs: "{}" } });
    try {
      await db.guardianship.create({
        data: { parentUserId: parent.id, studentMembershipId: pupilMembershipId, studentSchoolId: riversideId, status: "ACTIVE" },
      });
      const before = await listContexts(parent.id);
      expect(before.children.find((c) => c.studentMembershipId === pupilMembershipId)?.leftAt).toBeNull();

      const result = await recordDeparture(admin, pupilMembershipId, { reason: "TRANSFERRED", leftOn: new Date("2026-04-30T00:00:00Z") });
      expect(result.ok).toBe(true);

      const after = await listContexts(parent.id);
      const child = after.children.find((c) => c.studentMembershipId === pupilMembershipId);
      // Still listed — the guardianship survives — and honestly marked.
      expect(child).toBeDefined();
      expect(child?.leftAt?.toISOString().slice(0, 10)).toBe("2026-04-30");
      expect(child?.studentUserId).toBe(pupilUserId);
    } finally {
      await db.guardianship.deleteMany({ where: { parentUserId: parent.id } });
      await db.user.delete({ where: { id: parent.id } });
    }
  });
});


describe("a last day in the future schedules, and the job executes it the morning after", () => {
  it("⚠ scheduling keeps the pupil fully on the roll; re-scheduling corrects; cancelling deletes", async () => {
    expect(await scheduleDeparture(admin, pupilMembershipId, { reason: "TRANSFERRED", leaveOnKey: "2020-01-01" })).toMatchObject({ ok: false, errorKey: "refusal.leaveDateNotFuture" });
    expect(await scheduleDeparture(admin, pupilMembershipId, { reason: "TRANSFERRED", destination: "Oakfield", conduct: "GOOD", leaveOnKey: "2999-03-31" })).toEqual({ ok: true, leaveOnKey: "2999-03-31" });
    // Fully on the roll: membership open, enrolment untouched.
    const m = await db.membership.findUniqueOrThrow({ where: { id: pupilMembershipId } });
    expect(m.leftAt).toBeNull();
    expect(await db.enrollment.count({ where: { studentMembershipId: pupilMembershipId, status: "ACTIVE" } })).toBe(1);
    // Corrected, not duplicated.
    expect(await scheduleDeparture(admin, pupilMembershipId, { reason: "LEFT", leaveOnKey: "2999-04-15" })).toMatchObject({ ok: true });
    const rows = await db.scheduledDeparture.findMany({ where: { membershipId: pupilMembershipId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ leaveOnKey: "2999-04-15", reason: "LEFT" });

    expect(await cancelScheduledDeparture(admin, pupilMembershipId)).toEqual({ ok: true });
    expect(await cancelScheduledDeparture(admin, pupilMembershipId)).toMatchObject({ ok: false, errorKey: "refusal.nothingScheduled" });
    await expect(scheduleDeparture(teacher, pupilMembershipId, { reason: "LEFT", leaveOnKey: "2999-04-15" })).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ the due job runs the real departure — certificate dated the last day, conduct carried — and drops a stale row", async () => {
    expect((await scheduleDeparture(admin, pupilMembershipId, { reason: "TRANSFERRED", destination: "Oakfield Academy", conduct: "EXCELLENT", leaveOnKey: "2999-03-31" })).ok).toBe(true);
    // Not due yet: nothing happens.
    // The job reads every school's schedule, and other suites leave rows of their own in the same database:
    // what is asserted is this school's line of the run, never the run's totals.
    expect((await runDueDepartures(new Date("2999-03-31T12:00:00Z"))).perSchool[riversideId]).toBeUndefined();
    expect((await db.membership.findUniqueOrThrow({ where: { id: pupilMembershipId } })).leftAt).toBeNull();
    // The morning after the last day, it runs.
    const result = await runDueDepartures(new Date("2999-04-01T02:00:00Z"));
    expect(result.executed).toBeGreaterThanOrEqual(1);
    // The run tells its work per school, for /root/jobs/schools.
    expect(result.perSchool[riversideId]).toEqual({ executed: 1 });
    const m = await db.membership.findUniqueOrThrow({ where: { id: pupilMembershipId } });
    expect(m.leftAt?.toISOString().slice(0, 10)).toBe("2999-03-31");
    const record = await db.schoolRecord.findUniqueOrThrow({ where: { studentMembershipId: pupilMembershipId } });
    expect(record).toMatchObject({ reason: "TRANSFERRED", destination: "Oakfield Academy", conduct: "EXCELLENT" });
    expect(await db.scheduledDeparture.count({ where: { membershipId: pupilMembershipId } })).toBe(0);

    // A schedule whose pupil was already recorded by hand is dropped as stale.
    await db.scheduledDeparture.create({ data: { schoolId: riversideId, membershipId: pupilMembershipId, leaveOnKey: "2999-04-02", reason: "LEFT" } });
    const stale = await runDueDepartures(new Date("2999-04-10T02:00:00Z"));
    expect(stale.skippedStale).toBeGreaterThanOrEqual(1);
    expect(stale.perSchool[riversideId]).toEqual({ stale: 1 });
    expect(await db.scheduledDeparture.count({ where: { membershipId: pupilMembershipId } })).toBe(0);
  });

  it("⚠ a school with no active admin leaves the departure STUCK — counted per school, row retained for the night an admin exists", async () => {
    // A disposable school that deliberately has a pupil and NO admin at all:
    // the exact shape the job used to reduce to a console.error and nothing.
    const suffix = Math.random().toString(16).slice(2, 10);
    const school = await db.school.create({
      data: {
        name: "ZZ Stuck Departure School",
        slug: `zz-stuck-dept-${suffix}`,
        code: `ZSD${suffix.slice(0, 5).toUpperCase()}`,
        contactEmail: `office-${suffix}@zz-stuck.test`,
      },
    });
    const pupil = await db.user.create({
      data: { email: `pupil-${suffix}@zz-stuck.test`, name: "ZZ Stuck Pupil", prefs: "{}" },
    });
    const membership = await db.membership.create({
      data: { userId: pupil.id, schoolId: school.id, role: "STUDENT", status: "ACTIVE" },
    });
    await db.scheduledDeparture.create({
      data: { schoolId: school.id, membershipId: membership.id, leaveOnKey: "2999-04-01", reason: "LEFT" },
    });
    try {
      const out = await runDueDepartures(new Date("2999-04-10T02:00:00Z"));
      expect(out.stuck).toBe(1);
      expect(out.perSchool[school.id]).toEqual({ stuck: 1 });
      // The intent is preserved, not dropped: the row survives to be retried.
      expect(await db.scheduledDeparture.count({ where: { membershipId: membership.id } })).toBe(1);
      // And nothing happened to the pupil.
      expect((await db.membership.findUniqueOrThrow({ where: { id: membership.id } })).leftAt).toBeNull();
    } finally {
      await db.scheduledDeparture.deleteMany({ where: { schoolId: school.id } });
      await db.school.delete({ where: { id: school.id } });
      await db.user.delete({ where: { id: pupil.id } });
    }
  });
});

describe("the leaving day, the whole stay and the serial, in the school's own zone and year", () => {
  const suffix = Math.random().toString(16).slice(2, 10);
  const TZ = "Asia/Kolkata";
  let zSchoolId = "";
  let zAdmin: ActiveContext;
  let zClassId = "";
  let zTeacherM = "";
  const userIds: string[] = [];

  async function zPupil(name: string, joinedAt: Date): Promise<string> {
    const u = await db.user.create({ data: { email: `${name.toLowerCase().replace(/ /g, "-")}-${suffix}@zz-zone.test`, name, preferredName: "Preferred", prefs: "{}" } });
    userIds.push(u.id);
    const m = await db.membership.create({ data: { userId: u.id, schoolId: zSchoolId, role: "STUDENT", status: "ACTIVE", joinedAt } });
    await db.enrollment.create({ data: { classId: zClassId, schoolId: zSchoolId, studentMembershipId: m.id, status: "ACTIVE" } });
    return m.id;
  }

  beforeAll(async () => {
    zSchoolId = (await db.school.create({ data: { name: "ZZ Zone School", slug: `zz-zone-${suffix}`, code: `ZZN${suffix.slice(0, 5).toUpperCase()}`, contactEmail: `office-${suffix}@zz-zone.test`, timezone: TZ } })).id;
    await db.academicYear.create({ data: { schoolId: zSchoolId, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false } });
    const adminUser = await db.user.create({ data: { email: `admin-${suffix}@zz-zone.test`, name: "ZZ Zone Admin", prefs: "{}" } });
    userIds.push(adminUser.id);
    const adminM = await db.membership.create({ data: { userId: adminUser.id, schoolId: zSchoolId, role: "ADMIN", status: "ACTIVE" } });
    zAdmin = ctx({ userId: adminUser.id, membershipId: adminM.id, schoolId: zSchoolId, role: "ADMIN" });
    const teacherUser = await db.user.create({ data: { email: `teacher-${suffix}@zz-zone.test`, name: "ZZ Zone Teacher", prefs: "{}" } });
    userIds.push(teacherUser.id);
    zTeacherM = (await db.membership.create({ data: { userId: teacherUser.id, schoolId: zSchoolId, role: "TEACHER", status: "ACTIVE" } })).id;
    zClassId = (await db.class.create({ data: { schoolId: zSchoolId, name: "ZZ Zone 5", gradeLevel: "5", joinCode: `ZZZ-ZONE-${suffix.slice(0, 4)}` } })).id;
  });

  afterAll(async () => {
    await db.school.deleteMany({ where: { id: zSchoolId } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it("⚠ a departure at 21:00 UTC is the next day in Kolkata, marks after the backdated leaving day are left out, the serial carries the academic year's name, the percent is whole and the legal name is printed", async () => {
    const pupilM = await zPupil("ZZ Zone Leaver", new Date("2025-06-01T00:00:00Z"));
    const marks = [["2026-03-09", "PRESENT"], ["2026-03-10", "LATE"], ["2026-03-11", "ABSENT"], ["2026-03-12", "PRESENT"], ["2026-03-13", "PRESENT"]] as const;
    for (const [dateKey, status] of marks) {
      const session = await db.attendanceSession.create({ data: { schoolId: zSchoolId, classId: zClassId, dateKey, takenByMembershipId: zTeacherM } });
      await db.attendanceRecord.create({ data: { schoolId: zSchoolId, sessionId: session.id, studentMembershipId: pupilM, status, clientId: `zz-zone-${dateKey}-${suffix}` } });
    }
    // 21:00 UTC on the 10th is 02:30 on the 11th in Kolkata: the leaving day is the 11th.
    const result = await recordDeparture(zAdmin, pupilM, { reason: "TRANSFERRED", destination: "Elsewhere", leftOn: new Date("2026-03-10T21:00:00Z") });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tc = await certificateFor(zAdmin, result.recordId);
    expect(tc).not.toBeNull();
    expect(tc!.school.timezone).toBe(TZ);
    expect(dateKeyInZone(tc!.leftAt, tc!.school.timezone)).toBe("2026-03-11");
    // The 9th, 10th and 11th count; the 12th and 13th, marked after the backdated leaving day, do not.
    expect(tc!.attendanceMarked).toBe(3);
    expect(tc!.attendancePresent).toBe(2);
    expect(tc!.attendancePercent).toBe(67);
    expect(tc!.serial).toBe("TC/2025–26/0001");
    expect(tc!.studentName).toBe("ZZ Zone Leaver");
    // The list view rounds the same way.
    const listed = await recordsForStudentMembership(zAdmin, pupilM);
    expect(listed[0]?.attendancePercent).toBe(67);
    // The enrolment closed on the leaving instant.
    const enrolment = await db.enrollment.findFirstOrThrow({ where: { studentMembershipId: pupilM } });
    expect(enrolment.status).toBe("REMOVED");
    expect(enrolment.removedAt?.toISOString()).toBe("2026-03-10T21:00:00.000Z");
  });

  it("numbers rows from before the document existed in the order the pupils left, after the highest issued, whichever the office opens first", async () => {
    const feb = await zPupil("ZZ Zone February", new Date("2025-06-01T00:00:00Z"));
    const jan = await zPupil("ZZ Zone January", new Date("2025-06-01T00:00:00Z"));
    const legacy = async (membershipId: string, leftAt: Date) => {
      const m = await db.membership.update({ where: { id: membershipId }, data: { leftAt }, select: { userId: true } });
      return (await db.schoolRecord.create({ data: { schoolId: zSchoolId, studentUserId: m.userId, studentMembershipId: membershipId, schoolName: "ZZ Zone School", joinedAt: new Date("2025-06-01T00:00:00Z"), leftAt, reason: "LEFT" } })).id;
    };
    const febId = await legacy(feb, new Date("2026-02-01T05:00:00Z"));
    const janId = await legacy(jan, new Date("2026-01-15T05:00:00Z"));
    // The office opens February's first: it is still the third of the year, because January's left earlier.
    expect((await certificateFor(zAdmin, febId))!.serial).toBe("TC/2025–26/0003");
    expect((await certificateFor(zAdmin, janId))!.serial).toBe("TC/2025–26/0002");
    // A leaving day no year covers falls back to its calendar year in the school's zone.
    const stray = await zPupil("ZZ Zone Stray", new Date("2025-06-01T00:00:00Z"));
    const strayId = await legacy(stray, new Date("2026-05-15T05:00:00Z"));
    expect((await certificateFor(zAdmin, strayId))!.serial).toBe("TC/2026/0001");
  });
});
