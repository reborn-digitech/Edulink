import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  anyOpenReviews,
  closeReviewRound,
  listReviewRounds,
  openReviewRound,
  pendingReviews,
  schoolReviewDashboard,
  submitReview,
  teacherReviewAggregate,
} from "@/lib/reviews";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";
import { REVIEW_QUESTIONS } from "@/lib/constants";

/**
 * Teacher reviews, end to end — the largest module in src/lib that no suite
 * had touched (only the out-of-suite three-year simulation drove it).
 *
 * The promises pinned here: only the office opens and closes rounds; a round
 * asks only its audience and only about teachers who actually teach the
 * respondent; every question must be answered; an answer can be amended but
 * never duplicated; ratings leave the module only as aggregates, readable by
 * the office and the teacher themselves; the dashboard's delta compares the
 * two most recent ANSWERED rounds; and the nav's "any open reviews" bit goes
 * dark the moment the round closes.
 */
const db = new PrismaClient();
const STAMP = Date.now();

let schoolId = "";
let classId = "";
let adminCtx: ActiveContext;
let teacherCtx: ActiveContext;
let otherTeacherCtx: ActiveContext;
let pupilCtx: ActiveContext;
let outsiderPupilCtx: ActiveContext;
let parentCtx: ActiveContext;
let teacherMembershipId = "";
let otherTeacherMembershipId = "";

function ctx(over: { userId: string; membershipId?: string | null; role: ActiveContext["role"] }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId,
    role: over.role,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
    },
  } as ActiveContext;
}

const full = (n: number) => Object.fromEntries(REVIEW_QUESTIONS.map((q) => [q, n]));

beforeAll(async () => {
  const school = await db.school.create({
    data: {
      name: `ZZ Reviews School ${STAMP}`,
      slug: `zz-reviews-${STAMP}`,
      code: `ZR${String(STAMP).slice(-6)}`,
      contactEmail: `zz-reviews-school-${STAMP}@test.invalid`,
      timezone: "Asia/Kolkata",
    },
    select: { id: true },
  });
  schoolId = school.id;
  const mkUser = (name: string) =>
    db.user.create({
      data: { name, email: `zz-reviews-${name.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` },
      select: { id: true },
    });
  const [admin, teacher, other, pupil, outsider, parent] = await Promise.all([
    mkUser("Admin"), mkUser("Teacher"), mkUser("Other Teacher"), mkUser("Pupil"), mkUser("Outsider"), mkUser("Parent"),
  ]);
  const mk = (userId: string, role: string, code?: string) =>
    db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", studentCode: code ?? null }, select: { id: true } });
  const [adminM, teacherM, otherM, pupilM, outsiderM] = await Promise.all([
    mk(admin.id, "ADMIN"), mk(teacher.id, "TEACHER"), mk(other.id, "TEACHER"), mk(pupil.id, "STUDENT", `ZRP${STAMP}`), mk(outsider.id, "STUDENT", `ZRO${STAMP}`),
  ]);
  teacherMembershipId = teacherM.id;
  otherTeacherMembershipId = otherM.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Reviews 7", joinCode: `ZR${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: teacherM.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pupilM.id, status: "ACTIVE" } });
  await db.guardianship.create({
    data: { parentUserId: parent.id, studentMembershipId: pupilM.id, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" },
  });

  adminCtx = ctx({ userId: admin.id, membershipId: adminM.id, role: "ADMIN" });
  teacherCtx = ctx({ userId: teacher.id, membershipId: teacherM.id, role: "TEACHER" });
  otherTeacherCtx = ctx({ userId: other.id, membershipId: otherM.id, role: "TEACHER" });
  pupilCtx = ctx({ userId: pupil.id, membershipId: pupilM.id, role: "STUDENT" });
  outsiderPupilCtx = ctx({ userId: outsider.id, membershipId: outsiderM.id, role: "STUDENT" });
  parentCtx = ctx({ userId: parent.id, membershipId: null, role: "PARENT" });
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("opening a round", () => {
  it("is the office's to do, and refuses a teacher by name", async () => {
    await expect(
      openReviewRound(teacherCtx, { teacherMembershipIds: [teacherMembershipId], audience: "STUDENTS", closesDateKey: "2099-01-01" }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses a bad audience, a malformed or past date, and a round about nobody", async () => {
    const base = { teacherMembershipIds: [teacherMembershipId], audience: "STUDENTS" as const, closesDateKey: "2099-01-01" };
    expect(await openReviewRound(adminCtx, { ...base, audience: "EVERYONE" as never })).toEqual({ ok: false, errorKey: "reviews.badAudience" });
    expect(await openReviewRound(adminCtx, { ...base, closesDateKey: "next week" })).toEqual({ ok: false, errorKey: "reviews.badCloseDate" });
    expect(await openReviewRound(adminCtx, { ...base, closesDateKey: "2001-01-01" })).toEqual({ ok: false, errorKey: "reviews.closeDateInPast" });
    expect(await openReviewRound(adminCtx, { ...base, teacherMembershipIds: ["nobody"] })).toEqual({ ok: false, errorKey: "reviews.pickATeacher" });
  });

  it("opens, lists as OPEN, and the pupil sees only the teacher who teaches them", async () => {
    const r = await openReviewRound(adminCtx, {
      teacherMembershipIds: [teacherMembershipId, otherTeacherMembershipId],
      audience: "STUDENTS",
      closesDateKey: "2099-01-01",
    });
    expect(r.ok).toBe(true);
    const rounds = await listReviewRounds(adminCtx, { status: "OPEN" });
    expect(rounds.map((x) => x.id)).toContain(r.roundId);
    expect(rounds.find((x) => x.id === r.roundId)?.teacherCount).toBe(2);

    const mine = await pendingReviews(pupilCtx, schoolId);
    expect(mine.map((p) => p.teacherMembershipId)).toEqual([teacherMembershipId]);
    // An outsider pupil is in no class of theirs — nothing to answer.
    expect(await pendingReviews(outsiderPupilCtx, schoolId)).toEqual([]);
    // A parent is not this round's audience.
    expect(await pendingReviews(parentCtx, schoolId)).toEqual([]);
    expect(await anyOpenReviews(pupilCtx)).toBe(true);
    expect(await anyOpenReviews(parentCtx)).toBe(false);
  });
});

describe("answering", () => {
  let roundId = "";
  beforeAll(async () => {
    roundId = (await listReviewRounds(adminCtx, { status: "OPEN" }))[0]!.id;
  });

  it("refuses staff, the wrong teacher, and a half-filled scale", async () => {
    await expect(submitReview(teacherCtx, { roundId, teacherMembershipId, scores: full(5) })).rejects.toBeInstanceOf(AccessError);
    expect(await submitReview(pupilCtx, { roundId, teacherMembershipId: otherTeacherMembershipId, scores: full(5) })).toEqual({ ok: false, errorKey: "reviews.notYourTeacher" });
    expect(await submitReview(pupilCtx, { roundId, teacherMembershipId, scores: { CLARITY: 5 } })).toEqual({ ok: false, errorKey: "reviews.answerEverything" });
    expect(await submitReview(pupilCtx, { roundId, teacherMembershipId, scores: { ...full(3), RESPECT: 6 } })).toEqual({ ok: false, errorKey: "reviews.answerEverything" });
    expect(await submitReview(pupilCtx, { roundId, teacherMembershipId, scores: { ...full(3), RESPECT: 2.5 } })).toEqual({ ok: false, errorKey: "reviews.answerEverything" });
  });

  it("accepts a full answer, and an amendment replaces rather than duplicates it", async () => {
    expect(await submitReview(pupilCtx, { roundId, teacherMembershipId, scores: full(4) })).toEqual({ ok: true });
    expect(await submitReview(pupilCtx, { roundId, teacherMembershipId, scores: { ...full(4), CLARITY: 2 } })).toEqual({ ok: true });
    expect(await db.reviewResponse.count({ where: { roundId, teacherMembershipId } })).toBe(1);
    const mine = await pendingReviews(pupilCtx, schoolId);
    expect(mine[0]?.myScores).toEqual({ ...full(4), CLARITY: 2 });
  });

  it("aggregates for the office and the teacher themselves, and for nobody else", async () => {
    const agg = await teacherReviewAggregate(adminCtx, teacherMembershipId);
    expect(agg.responseCount).toBe(1);
    expect(agg.byQuestion.CLARITY).toBe(2);
    expect(agg.byQuestion.SUPPORT).toBe(4);
    // mean of per-question means: (2 + 4 + 4 + 4 + 4) / 5 = 3.6
    expect(agg.overall).toBe(3.6);
    expect((await teacherReviewAggregate(teacherCtx, teacherMembershipId)).overall).toBe(3.6);
    await expect(teacherReviewAggregate(otherTeacherCtx, teacherMembershipId)).rejects.toBeInstanceOf(AccessError);
    await expect(teacherReviewAggregate(pupilCtx, teacherMembershipId)).rejects.toBeInstanceOf(AccessError);
    // The unrated teacher has nothing, not a zero.
    expect((await teacherReviewAggregate(adminCtx, otherTeacherMembershipId)).overall).toBeNull();
  });
});

describe("closing and the dashboard", () => {
  it("closes once; a late answer is refused; the nav bit goes dark", async () => {
    const roundId = (await listReviewRounds(adminCtx, { status: "OPEN" }))[0]!.id;
    await expect(closeReviewRound(pupilCtx, roundId)).rejects.toBeInstanceOf(AccessError);
    expect(await closeReviewRound(adminCtx, roundId)).toEqual({ ok: true });
    expect(await closeReviewRound(adminCtx, roundId)).toEqual({ ok: false, errorKey: "reviews.roundGone" });
    expect(await submitReview(pupilCtx, { roundId, teacherMembershipId, scores: full(5) })).toEqual({ ok: false, errorKey: "reviews.roundClosed" });
    expect(await listReviewRounds(adminCtx, { status: "OPEN" })).toEqual([]);
    expect(await anyOpenReviews(pupilCtx)).toBe(false);
  });

  it("delta compares the two most recent answered rounds, and an ignored round is not a zero", async () => {
    // Round two, answered higher by the pupil and by the parent (audience BOTH).
    const two = await openReviewRound(adminCtx, { teacherMembershipIds: [teacherMembershipId], audience: "BOTH", closesDateKey: "2099-01-01" });
    expect(two.ok).toBe(true);
    expect(await anyOpenReviews(parentCtx)).toBe(true);
    expect((await pendingReviews(parentCtx, schoolId)).map((p) => p.teacherMembershipId)).toEqual([teacherMembershipId]);
    expect(await submitReview(pupilCtx, { roundId: two.roundId!, teacherMembershipId, scores: full(5) })).toEqual({ ok: true });
    expect(await submitReview(parentCtx, { roundId: two.roundId!, teacherMembershipId, scores: full(4) })).toEqual({ ok: true });
    // Round three: opened, ignored by everybody.
    const three = await openReviewRound(adminCtx, { teacherMembershipIds: [teacherMembershipId], audience: "STUDENTS", closesDateKey: "2099-01-01" });
    expect(three.ok).toBe(true);

    const rows = await schoolReviewDashboard(adminCtx);
    const row = rows.find((r) => r.membershipId === teacherMembershipId)!;
    expect(row.latest).toEqual({ overall: 4.5, count: 2 });
    expect(row.previous).toEqual({ overall: 3.6, count: 1 });
    expect(row.delta).toBe(0.9);
    expect(row.allTime.responseCount).toBe(3);
    const other = rows.find((r) => r.membershipId === otherTeacherMembershipId)!;
    expect(other.latest).toBeNull();
    expect(other.delta).toBeNull();
    await expect(schoolReviewDashboard(teacherCtx)).rejects.toBeInstanceOf(AccessError);
  });
});
