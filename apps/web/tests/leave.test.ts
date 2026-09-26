import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  applyForLeave,
  approvedLeaveBetween,
  cancelLeave,
  decideLeave,
  myLeave,
  schoolLeave,
} from "@/lib/leave";
import { registerDuty } from "@/lib/register-duty";
import { forSchool } from "@/lib/tenant-context";
import type { ActiveContext } from "@/lib/session";
import { leaveBalanceFor, leaveDayCounterFor, leaveDays, setStaffRecord, staffRecordFor } from "@/lib/staff-records";

/**
 * Staff leave, and the cover that must follow it.
 *
 * THE CLAIM WORTH TESTING is not that a row gets written — it is that approving
 * leave leaves nobody's register unmarked. A leave feature that records an
 * absence and leaves somebody to remember the register separately has moved the
 * problem rather than solved it, and the failure is invisible until a Tuesday
 * morning when thirty children go unmarked.
 *
 * So the load-bearing block below is "approving arranges the cover", and it
 * checks the effect through `registerDuty` — the function the register itself
 * asks — rather than by counting rows in a table.
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

const APPLICANT_EMAIL = "leave.applicant.unit@riverside.test";
const COVER_EMAIL = "leave.cover.unit@riverside.test";
const PRINCIPAL_EMAIL = "leave.principal.unit@riverside.test";
const MADE = [APPLICANT_EMAIL, COVER_EMAIL, PRINCIPAL_EMAIL];

const FROM = "2026-05-04";
const TO = "2026-05-08";
const OUTSIDE = "2026-05-11";

let riversideId: string;
let oakfieldId: string;
let classId: string;

let applicant: ActiveContext;
let coverStaff: ActiveContext;
let principal: ActiveContext;
let admin: ActiveContext;
let otherSchoolAdmin: ActiveContext;

let applicantMembershipId: string;
let coverMembershipId: string;
let principalMembershipId: string;

async function makeStaff(email: string, name: string, role: string, schoolId: string) {
  const user =
    (await db.user.findUnique({ where: { email } })) ??
    (await db.user.create({ data: { email, name, prefs: "{}" } }));
  const membership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: user.id, schoolId, role } },
    create: { userId: user.id, schoolId, role, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
  return { userId: user.id, membershipId: membership.id };
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;
  oakfieldId = oakfield.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfieldId, role: "ADMIN" },
  });

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfieldId,
    role: "ADMIN",
  });

  const a = await makeStaff(APPLICANT_EMAIL, "Leave Applicant", "TEACHER", riversideId);
  const c = await makeStaff(COVER_EMAIL, "Cover Teacher", "TEACHER", riversideId);
  const p = await makeStaff(PRINCIPAL_EMAIL, "Leave Principal", "PRINCIPAL", riversideId);
  applicantMembershipId = a.membershipId;
  coverMembershipId = c.membershipId;
  principalMembershipId = p.membershipId;

  applicant = ctx({
    userId: a.userId,
    membershipId: a.membershipId,
    schoolId: riversideId,
    role: "TEACHER",
  });
  coverStaff = ctx({
    userId: c.userId,
    membershipId: c.membershipId,
    schoolId: riversideId,
    role: "TEACHER",
  });
  principal = ctx({
    userId: p.userId,
    membershipId: p.membershipId,
    schoolId: riversideId,
    role: "PRINCIPAL",
  });

  // This suite's OWN class, with the applicant down to mark its register.
  // Nothing here touches a seeded class — see the note in register-duty.test.ts.
  const klass = await db.class.upsert({
    where: { joinCode: "ZZZ-LEAVE" },
    create: {
      schoolId: riversideId,
      name: "ZZ Leave Test Class",
      gradeLevel: "5",
      joinCode: "ZZZ-LEAVE",
    },
    update: {},
  });
  classId = klass.id;

  await db.classTeacher.upsert({
    where: {
      classId_teacherMembershipId: { classId, teacherMembershipId: applicantMembershipId },
    },
    create: {
      classId,
      schoolId: riversideId,
      teacherMembershipId: applicantMembershipId,
      role: "LEAD",
      canTakeAttendance: true,
    },
    update: { canTakeAttendance: true },
  });
});

/**
 * The memberships THIS FILE created, and only those.
 *
 * ⚠ THE CLEANUP USED TO BE `{ schoolId: riversideId }`, which deletes every
 * leave request in a real seeded school — not just the ones these tests made.
 * A walkthrough fixture vanished mid-session and that is how it was found; a
 * school's actual requests would have gone the same way. `npm test` runs
 * against the dev database, so a suite that tidies by tenant is a suite that
 * destroys somebody else's rows.
 *
 * Scoped to the three memberships created in `beforeAll` instead. Exact, and it
 * cannot widen by accident the way a school filter did.
 */
function ownMemberships(): string[] {
  return [applicantMembershipId, coverMembershipId, principalMembershipId].filter(Boolean);
}

afterEach(async () => {
  await db.attendanceCover.deleteMany({ where: { classId } });
  await db.leaveRequest.deleteMany({ where: { teacherMembershipId: { in: ownMemberships() } } });
  // Notifications too. Without this they accumulate across tests in this file
  // and the "tells the applicant" assertion counts six approvals instead of one
  // — a test failing because of its neighbours rather than its subject.
  await db.notification.deleteMany({ where: { user: { email: { in: MADE } } } });
});

afterAll(async () => {
  await db.attendanceCover.deleteMany({ where: { classId } });
  await db.leaveRequest.deleteMany({ where: { teacherMembershipId: { in: ownMemberships() } } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.notification.deleteMany({ where: { user: { email: { in: MADE } } } });
  await db.membership.deleteMany({ where: { user: { email: { in: MADE } } } });
  await db.user.deleteMany({ where: { email: { in: MADE } } });
  await db.$disconnect();
});

const BASE = { fromDateKey: FROM, toDateKey: TO, kind: "SICK" as const, reason: "Hospital appointment" };

async function pendingId(): Promise<string> {
  const row = await db.leaveRequest.findFirstOrThrow({
    // Its OWN pending request, not the school's. See `ownMemberships`.
    where: { teacherMembershipId: { in: ownMemberships() }, status: "PENDING" },
  });
  return row.id;
}

describe("applying", () => {
  it("records a pending request", async () => {
    const result = await applyForLeave(applicant, BASE);
    expect(result.ok).toBe(true);

    const rows = await myLeave(applicant);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "PENDING", kind: "SICK", fromDateKey: FROM });
  });

  it("refuses a backwards range, a malformed date and an absurd span", async () => {
    expect((await applyForLeave(applicant, { ...BASE, toDateKey: "2026-05-01" })).ok).toBe(false);
    expect((await applyForLeave(applicant, { ...BASE, fromDateKey: "04/05/2026" })).ok).toBe(false);
    // A mistyped year, not a policy about how much leave anybody may take.
    expect(
      (await applyForLeave(applicant, { ...BASE, fromDateKey: "2026-05-04", toDateKey: "2027-05-04" }))
        .ok,
    ).toBe(false);
  });

  it("⚠ requires a reason", async () => {
    expect((await applyForLeave(applicant, { ...BASE, reason: "  " })).ok).toBe(false);
    // ⚠ SCOPED LIKE THE CLEANUP IS, and for the same reason: counting the
    // whole school asserted that nobody else in Riverside has ever asked for
    // leave, which is a fact about the fixtures rather than about this code.
    expect(
      await db.leaveRequest.count({ where: { teacherMembershipId: { in: ownMemberships() } } }),
    ).toBe(0);
  });

  it("⚠ refuses a second request overlapping one already open", async () => {
    expect((await applyForLeave(applicant, BASE)).ok).toBe(true);
    // Almost always a double submission, and creating both leaves somebody to
    // reconcile two decisions about the same days.
    const again = await applyForLeave(applicant, { ...BASE, fromDateKey: "2026-05-06" });
    expect(again.ok).toBe(false);
  });

  it("allows a request that does not overlap", async () => {
    expect((await applyForLeave(applicant, BASE)).ok).toBe(true);
    expect(
      (await applyForLeave(applicant, { ...BASE, fromDateKey: "2026-06-01", toDateKey: "2026-06-02" }))
        .ok,
    ).toBe(true);
  });

  it("⚠ refuses a nominee who is not staff here, and refuses self-nomination", async () => {
    const oakTeacher = await db.membership.findFirstOrThrow({
      where: { schoolId: oakfieldId, role: "TEACHER" },
    });
    expect(
      (await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: oakTeacher.id })).ok,
    ).toBe(false);
    expect(
      (await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: applicantMembershipId }))
        .ok,
    ).toBe(false);
  });

  it("⚠ is not open to students or parents", async () => {
    const pupil = ctx({ userId: "x", membershipId: "y", schoolId: riversideId, role: "STUDENT" });
    await expect(applyForLeave(pupil, BASE)).rejects.toBeInstanceOf(AccessError);
  });

  it("tells the people who can decide it", async () => {
    await applyForLeave(applicant, BASE);
    const notified = await db.notification.count({
      where: { user: { email: { in: MADE } }, title: "Leave request waiting" },
    });
    expect(notified).toBeGreaterThan(0);
  });
});

describe("⚠ approving arranges the cover", () => {
  it("makes the named person able to mark the register, for exactly those days", async () => {
    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    const id = await pendingId();

    // Before: the cover teacher is on no class and may mark nothing.
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(false);

    const result = await decideLeave(principal, id, "APPROVED");
    expect(result.ok).toBe(true);
    expect(result.coversCreated).toBe(1);

    // ⚠ Checked through the function the REGISTER asks, not by counting rows.
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(true);
    expect((await registerDuty(coverStaff, classId, TO)).may).toBe(true);
    expect((await registerDuty(coverStaff, classId, OUTSIDE)).may).toBe(false);
  });

  it("⚠ the applicant can still mark their own register — cover adds, never removes", async () => {
    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    await decideLeave(principal, await pendingId(), "APPROVED");
    // They may come in anyway, or the leave may be cancelled.
    expect((await registerDuty(applicant, classId, FROM)).may).toBe(true);
  });

  it("⚠ uses whoever the DECIDER chose, not the applicant's suggestion", async () => {
    // Otherwise a teacher hands their classes to anybody by applying for a day
    // off, which is a staffing decision they do not get to make alone.
    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    await decideLeave(principal, await pendingId(), "APPROVED", {
      coverMembershipId: principalMembershipId,
    });

    expect((await registerDuty(principal, classId, FROM)).may).toBe(true);
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(false);
  });

  it("approves with no cover when none was chosen, rather than refusing", async () => {
    await applyForLeave(applicant, BASE);
    const result = await decideLeave(principal, await pendingId(), "APPROVED");
    expect(result.ok).toBe(true);
    expect(result.coversCreated).toBe(0);
  });

  it("does not arrange cover for a class the applicant does not mark", async () => {
    await db.classTeacher.updateMany({
      where: { classId, teacherMembershipId: applicantMembershipId },
      data: { canTakeAttendance: false },
    });
    try {
      await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
      const result = await decideLeave(principal, await pendingId(), "APPROVED");
      expect(result.coversCreated).toBe(0);
    } finally {
      await db.classTeacher.updateMany({
        where: { classId, teacherMembershipId: applicantMembershipId },
        data: { canTakeAttendance: true },
      });
    }
  });

  it("declining arranges nothing", async () => {
    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    await decideLeave(principal, await pendingId(), "DECLINED", { note: "Exam week" });
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(false);
  });

  it("tells the applicant either way", async () => {
    await applyForLeave(applicant, BASE);
    await decideLeave(principal, await pendingId(), "APPROVED");
    const told = await db.notification.count({
      where: { user: { email: APPLICANT_EMAIL }, title: "Your leave was approved" },
    });
    expect(told).toBe(1);
  });
});

describe("⚠ who may decide", () => {
  it("refuses a teacher", async () => {
    await applyForLeave(applicant, BASE);
    const id = await pendingId();
    await expect(decideLeave(coverStaff, id, "APPROVED")).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses somebody deciding their OWN request", async () => {
    // A principal takes leave like anybody else, and somebody who is not them
    // has to answer it.
    await applyForLeave(principal, BASE);
    const id = await pendingId();
    const result = await decideLeave(principal, id, "APPROVED");
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("leaveKind.notYourOwn");
  });

  it("lets an admin decide a principal's request", async () => {
    await applyForLeave(principal, BASE);
    expect((await decideLeave(admin, await pendingId(), "APPROVED")).ok).toBe(true);
  });

  it("⚠ refuses a request from another school", async () => {
    await applyForLeave(applicant, BASE);
    const id = await pendingId();
    const result = await decideLeave(otherSchoolAdmin, id, "APPROVED");
    expect(result.ok).toBe(false);
  });

  it("refuses to decide the same request twice", async () => {
    await applyForLeave(applicant, BASE);
    const id = await pendingId();
    expect((await decideLeave(principal, id, "APPROVED")).ok).toBe(true);
    expect((await decideLeave(principal, id, "DECLINED")).ok).toBe(false);
  });
});

describe("⚠ withdrawing takes the cover with it", () => {
  it("cancels approved leave and removes the cover it caused", async () => {
    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    const id = await pendingId();
    await decideLeave(principal, id, "APPROVED");
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(true);

    expect((await cancelLeave(applicant, id)).ok).toBe(true);
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(false);
  });

  /**
   * ⚠ AND THE PERSON RELEASED IS TOLD.
   *
   * The test above proves the duty is gone from the database. It says nothing
   * about whether the teacher who was told to turn up knows not to — and the
   * assertion above passes either way. Somebody who arranged their Tuesday
   * around a register that no longer exists has been failed by a feature that
   * technically worked.
   */
  /**
   * ⚠ AND IT WORKS WITH THE TENANT ACTUALLY BOUND.
   *
   * Every other test in this file runs with NO tenant — there is no session
   * cookie, so `db.ts` short-circuits its per-query wrapping entirely. That is
   * precisely the state in which `db.$transaction` looked fine here for as long
   * as it was wrong: the extension never engaged, so the array form behaved
   * like a normal Prisma batch and nothing could see the missing atomicity.
   *
   * `forSchool` binds one, the same override `audit()` uses, so this exercises
   * the code path a real request takes. What it can still NOT show is the
   * policy — the suite connects as the database owner — but it does show that
   * `$tenantTransaction` inside a bound tenant completes rather than tripping
   * over a nested transaction, which is the failure a real request would have
   * hit first.
   *
   * The atomicity itself is proved in `transaction-atomicity.test.ts`.
   */
  it("⚠ works with a tenant bound, which is the path a real request takes", async () => {
    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    const id = await pendingId();
    await decideLeave(principal, id, "APPROVED");
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(true);

    const result = await forSchool(riversideId, () => cancelLeave(applicant, id));
    expect(result.ok).toBe(true);

    // Both halves of the transaction landed, not just the first.
    const request = await db.leaveRequest.findUniqueOrThrow({ where: { id } });
    expect(request.status).toBe("CANCELLED");
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(false);
  });

  it("⚠ tells the released cover teacher", async () => {
    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    const id = await pendingId();
    await decideLeave(principal, id, "APPROVED");
    await cancelLeave(applicant, id);

    const told = await db.notification.findMany({
      where: { user: { email: COVER_EMAIL } },
      orderBy: { createdAt: "asc" },
    });
    // One when the cover was arranged, one when it was taken away.
    expect(told.map((n) => n.title)).toEqual([
      expect.stringContaining("You are marking"),
      expect.stringContaining("no longer marking"),
    ]);
  });

  it("⚠ removes ONLY the cover this request caused", async () => {
    // Cover arranged by hand, for other reasons, belongs to whoever arranged it.
    await db.attendanceCover.create({
      data: {
        schoolId: riversideId,
        classId,
        coveringMembershipId: principalMembershipId,
        fromDateKey: FROM,
        toDateKey: TO,
        reason: "Arranged separately",
      },
    });

    await applyForLeave(applicant, { ...BASE, nominatedCoverMembershipId: coverMembershipId });
    const id = await pendingId();
    await decideLeave(principal, id, "APPROVED");
    await cancelLeave(applicant, id);

    // The leave's cover is gone; the hand-arranged one is untouched.
    expect((await registerDuty(coverStaff, classId, FROM)).may).toBe(false);
    expect((await registerDuty(principal, classId, FROM)).may).toBe(true);
  });

  it("lets the applicant withdraw a pending request", async () => {
    await applyForLeave(applicant, BASE);
    expect((await cancelLeave(applicant, await pendingId())).ok).toBe(true);
  });

  it("⚠ refuses somebody else's request", async () => {
    await applyForLeave(applicant, BASE);
    const id = await pendingId();
    await expect(cancelLeave(coverStaff, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("lets the principal withdraw one on the applicant's behalf", async () => {
    await applyForLeave(applicant, BASE);
    expect((await cancelLeave(principal, await pendingId())).ok).toBe(true);
  });

  it("refuses to cancel one already closed", async () => {
    await applyForLeave(applicant, BASE);
    const id = await pendingId();
    await decideLeave(principal, id, "DECLINED");
    expect((await cancelLeave(applicant, id)).ok).toBe(false);
  });
});

describe("⚠ staff-only by construction", () => {
  it("shows approved leave to staff", async () => {
    await applyForLeave(applicant, BASE);
    await decideLeave(principal, await pendingId(), "APPROVED");

    const forPrincipal = await approvedLeaveBetween(principal, "2026-05-01", "2026-05-31");
    expect(forPrincipal).toHaveLength(1);
    const forTeacher = await approvedLeaveBetween(coverStaff, "2026-05-01", "2026-05-31");
    expect(forTeacher).toHaveLength(1);
  });

  it("⚠ refuses a student or a parent outright, rather than returning nothing", async () => {
    // Returning an empty list would be indistinguishable from "there is none",
    // and would quietly start leaking the day somebody widened the query.
    const pupil = ctx({ userId: "x", membershipId: "y", schoolId: riversideId, role: "STUDENT" });
    const parent = ctx({ userId: "x", schoolId: riversideId, role: "PARENT" });
    await expect(approvedLeaveBetween(pupil, FROM, TO)).rejects.toBeInstanceOf(AccessError);
    await expect(approvedLeaveBetween(parent, FROM, TO)).rejects.toBeInstanceOf(AccessError);
  });

  it("leaves out anything not approved", async () => {
    await applyForLeave(applicant, BASE);
    expect(await approvedLeaveBetween(principal, "2026-05-01", "2026-05-31")).toHaveLength(0);
  });

  it("⚠ the whole-school list is not open to teachers", async () => {
    await expect(schoolLeave(coverStaff)).rejects.toBeInstanceOf(AccessError);
    await expect(schoolLeave(principal)).resolves.toBeInstanceOf(Array);
  });

  it("⚠ the whole-school list puts the queue first and whole, before any history", async () => {
    // Planted directly: an old declined request and a pending one dated before
    // it, so an alphabetical order by status would list DECLINED first.
    const planted = await Promise.all([
      db.leaveRequest.create({ data: { schoolId: riversideId, teacherMembershipId: applicantMembershipId, fromDateKey: "2026-01-12", toDateKey: "2026-01-12", kind: "CASUAL", reason: "planted decided", status: "DECLINED", decidedAt: new Date() }, select: { id: true } }),
      db.leaveRequest.create({ data: { schoolId: riversideId, teacherMembershipId: applicantMembershipId, fromDateKey: "2026-01-05", toDateKey: "2026-01-05", kind: "CASUAL", reason: "planted pending", status: "PENDING" }, select: { id: true } }),
    ]);
    try {
      const rows = await schoolLeave(principal);
      const firstDecided = rows.findIndex((r) => r.status !== "PENDING");
      const lastPending = rows.map((r) => r.status).lastIndexOf("PENDING");
      expect(lastPending).toBeGreaterThanOrEqual(0);
      if (firstDecided >= 0) expect(lastPending).toBeLessThan(firstDecided);
      expect(rows.filter((r) => r.status === "PENDING").length).toBe(await db.leaveRequest.count({ where: { schoolId: riversideId, status: "PENDING" } }));
    } finally {
      await db.leaveRequest.deleteMany({ where: { id: { in: planted.map((p) => p.id) } } });
    }
  });

  it("⚠ the desk's 'this request' count runs on the school's calendar: a closed Wednesday is not leave", async () => {
    const holiday = await db.holiday.create({ data: { schoolId: riversideId, name: "ZZ counter closure", startDateKey: "2026-05-06", endDateKey: "2026-05-06", kind: "HOLIDAY" }, select: { id: true } });
    try {
      const count = await leaveDayCounterFor(riversideId, FROM, TO);
      expect(leaveDays(FROM, TO)).toBe(5); // the default week knows nothing of the closure
      expect(count(FROM, TO)).toBe(4);
      expect(count("2026-05-06", "2026-05-06")).toBe(0);
    } finally {
      await db.holiday.delete({ where: { id: holiday.id } });
    }
  });

  it("shows a teacher only their own requests", async () => {
    await applyForLeave(applicant, BASE);
    expect(await myLeave(applicant)).toHaveLength(1);
    expect(await myLeave(coverStaff)).toHaveLength(0);
  });
});


describe("the staff record, and the balance the desk reads from it", () => {
  it("⚠ the office writes it, the member reads their own, nobody else sees it", async () => {
    await expect(setStaffRecord(applicant, applicantMembershipId, { designation: "x" })).rejects.toBeInstanceOf(AccessError);
    expect(await setStaffRecord(otherSchoolAdmin, applicantMembershipId, { designation: "x" })).toMatchObject({ ok: false, errorKey: "staff.notStaffHere" });
    expect(await setStaffRecord(admin, applicantMembershipId, { joinedOnKey: "2999-01-01" })).toMatchObject({ ok: false, errorKey: "staff.joinedInFuture" });
    expect(await setStaffRecord(admin, applicantMembershipId, { leaveDaysPerYear: 400 })).toMatchObject({ ok: false, errorKey: "staff.badLeaveDays" });
    expect(
      await setStaffRecord(admin, applicantMembershipId, { staffNumber: "T-042", designation: "PGT Maths", qualification: "M.Sc., B.Ed.", joinedOnKey: "2019-06-03", leaveDaysPerYear: 12 }),
    ).toEqual({ ok: true });
    const own = await staffRecordFor(applicant, applicantMembershipId);
    expect(own).toMatchObject({ staffNumber: "T-042", designation: "PGT Maths", joinedOnKey: "2019-06-03", leaveDaysPerYear: 12 });
    expect(await staffRecordFor(coverStaff, applicantMembershipId)).toBeNull(); // a colleague, not the office
    expect(await staffRecordFor(principal, applicantMembershipId)).not.toBeNull(); // the desk
    expect(await staffRecordFor(otherSchoolAdmin, applicantMembershipId)).toBeNull();
  });

  it("counts school days — Sunday off, Saturday a school day, the calendar's closures not leave — and only the kinds that draw on the entitlement", async () => {
    expect(leaveDays("2026-05-01", "2026-05-04")).toBe(3); // Fri, Sat, Mon
    expect(leaveDays("2026-05-04", "2026-05-08")).toBe(5);
    expect(leaveDays("2026-05-02", "2026-05-02")).toBe(1); // a Saturday alone draws a day
    expect(leaveDays("2026-05-04", "2026-05-08", new Set(["2026-05-06"]))).toBe(4); // a closed Wednesday is not leave
    await setStaffRecord(admin, applicantMembershipId, { leaveDaysPerYear: 12 });
    // Balance is against the CURRENT year; BASE's dates may sit outside it, so ask with a window of this year's.
    const year = await db.academicYear.findFirst({ where: { schoolId: riversideId, isCurrent: true } });
    const inYear = year ? year.startDate.toISOString().slice(0, 10) : `${new Date().getUTCFullYear()}-02-02`;
    const mon = (() => { const d = new Date(`${inYear}T00:00:00Z`); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
    const fri = (() => { const d = new Date(`${mon}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 4); return d.toISOString().slice(0, 10); })();
    const before = await leaveBalanceFor(riversideId, applicantMembershipId);
    const r = await applyForLeave(applicant, { fromDateKey: mon, toDateKey: fri, kind: "CASUAL", reason: "Wedding" });
    expect(r.ok).toBe(true);
    const pendingNow = await leaveBalanceFor(riversideId, applicantMembershipId);
    expect(pendingNow.pending).toBe(before.pending + 5);
    expect(pendingNow.used).toBe(before.used);
    const id = (await db.leaveRequest.findFirstOrThrow({ where: { teacherMembershipId: applicantMembershipId, status: "PENDING" } })).id;
    expect((await decideLeave(principal, id, "APPROVED", { note: undefined, coverMembershipId: null })).ok).toBe(true);
    const after = await leaveBalanceFor(riversideId, applicantMembershipId);
    expect(after.used).toBe(before.used + 5);
    expect(after.remaining).toBe(12 - after.used);
    // Unpaid leave does not draw on it.
    const nextMon = (() => { const d = new Date(`${mon}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10); })();
    expect((await applyForLeave(applicant, { fromDateKey: nextMon, toDateKey: nextMon, kind: "UNPAID", reason: "Travel" })).ok).toBe(true);
    expect((await leaveBalanceFor(riversideId, applicantMembershipId)).pending).toBe(0);
    await db.staffRecord.deleteMany({ where: { membershipId: applicantMembershipId } });
  });
});
