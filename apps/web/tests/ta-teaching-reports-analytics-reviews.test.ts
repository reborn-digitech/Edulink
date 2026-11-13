/**
 * Teacher reviews (src/lib/reviews.ts), two findings of the testing analysis
 * of 13 November 2026.
 *
 * TA-213: an average of one answer is that person's answer, and it was shown
 * live: the teacher's Ratings and the office's dashboard drew the per-question
 * means from the first answer, while the respondent is told teachers and the
 * school only see averages (decision 0002 row 15: never traceable). Now no
 * figure is drawn from a round under five answers (the count alone is), and a teacher reads
 * their own figures only from rounds that have closed.
 *
 * TA-209: a class teacher who holds the school's stand-in guardianship (a
 * pupil with no family on the app) could take the PARENT role and rate
 * themself and their colleagues; a real parent who also teaches their child
 * could rate themself. Now a stand-in guardianship makes nobody a respondent,
 * and nobody is offered or accepted for their own membership.
 *
 * One ZZ school of this suite's own, made through the owner connection and
 * removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  closeReviewRound,
  openReviewRound,
  pendingReviews,
  schoolReviewDashboard,
  submitReview,
  teacherReviewAggregate,
} from "@/lib/reviews";
import type { ActiveContext } from "@/lib/session";
import { REVIEW_QUESTIONS } from "@/lib/constants";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-reviews-${who}-${STAMP}@test.invalid`;
let schoolId = "";
const ids: Record<string, string> = {};
const ctxs: Record<string, ActiveContext> = {};
const full = (n: number) => Object.fromEntries(REVIEW_QUESTIONS.map((q) => [q, n]));

function ctx(userId: string, membershipId: string | null, role: ActiveContext["role"]): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId,
    role,
    user: { id: userId, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false },
  } as ActiveContext;
}

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA Reviews ${STAMP}`, slug: `zz-ta-reviews-${STAMP}`, code: `ZTV${SUFFIX}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const user = async (who: string) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA Reviews ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  };
  const member = async (who: string, role: string) => {
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  for (const who of ["admin", "lead", "colleague", "parentTeacher", "orphan", "child", "rated", "p1", "p2", "p3", "p4", "p5"]) await user(who);
  await member("admin", "ADMIN");
  await member("lead", "TEACHER");
  await member("colleague", "TEACHER");
  await member("parentTeacher", "TEACHER");
  await member("rated", "TEACHER");
  for (const who of ["orphan", "child", "p1", "p2", "p3", "p4", "p5"]) await member(who, "STUDENT");

  // 6A: the lead and the parent-teacher are its class teachers, the colleague takes it on the timetable.
  const klass = await db.class.create({ data: { schoolId, name: "ZZ TA 6A", joinCode: `ZTV${SUFFIX}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: ids.leadM!, role: "LEAD" } });
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: ids.parentTeacherM!, role: "CO" } });
  const period = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ P1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 }, select: { id: true } });
  await db.timetableSlot.create({ data: { schoolId, classId: klass.id, periodId: period.id, weekday: 1, subject: "Hindi", teacherMembershipId: ids.colleagueM! } });
  for (const who of ["orphan", "child"]) {
    await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: ids[`${who}M`]!, status: "ACTIVE" } });
  }
  // The orphan has no family on the app: the lead holds the school's stand-in guardianship.
  await db.guardianship.create({ data: { parentUserId: ids.lead!, studentMembershipId: ids.orphanM!, studentSchoolId: schoolId, relation: "SCHOOL", status: "ACTIVE" } });
  // The parent-teacher is also the child's own parent.
  await db.guardianship.create({ data: { parentUserId: ids.parentTeacher!, studentMembershipId: ids.childM!, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });

  // 7B: the rated teacher's class of five pupils.
  const seven = await db.class.create({ data: { schoolId, name: "ZZ TA 7B", joinCode: `ZTW${SUFFIX}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId: seven.id, teacherMembershipId: ids.ratedM!, role: "LEAD" } });
  for (const who of ["p1", "p2", "p3", "p4", "p5"]) {
    await db.enrollment.create({ data: { schoolId, classId: seven.id, studentMembershipId: ids[`${who}M`]!, status: "ACTIVE" } });
    ctxs[who] = ctx(ids[who]!, ids[`${who}M`]!, "STUDENT");
  }

  ctxs.admin = ctx(ids.admin!, ids.adminM!, "ADMIN");
  ctxs.ratedTeacher = ctx(ids.rated!, ids.ratedM!, "TEACHER");
  ctxs.leadAsParent = ctx(ids.lead!, null, "PARENT");
  ctxs.parentTeacherAsParent = ctx(ids.parentTeacher!, null, "PARENT");
});

afterAll(async () => {
  if (schoolId) {
    await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
    await db.auditLog.deleteMany({ where: { schoolId } });
    await db.school.deleteMany({ where: { id: schoolId } });
  }
  await db.user.deleteMany({ where: { email: { startsWith: "zz-ta-reviews-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-209: nobody rates themself, and the school's stand-in is not a parent here", () => {
  let roundId = "";
  beforeAll(async () => {
    const opened = await openReviewRound(ctxs.admin!, {
      teacherMembershipIds: [ids.leadM!, ids.colleagueM!, ids.parentTeacherM!],
      audience: "PARENTS",
      closesDateKey: "2099-01-01",
    });
    if (!opened.ok) throw new Error(`the round was refused: ${opened.errorKey}`);
    roundId = opened.roundId!;
  });

  it("TA-209: the class teacher standing in as guardian is asked about nobody", async () => {
    expect(await pendingReviews(ctxs.leadAsParent!, schoolId)).toEqual([]);
  });

  it("TA-209: the stand-in cannot rate themself or a colleague, and nothing is written", async () => {
    for (const teacherMembershipId of [ids.leadM!, ids.colleagueM!]) {
      expect(await submitReview(ctxs.leadAsParent!, { roundId, teacherMembershipId, scores: full(teacherMembershipId === ids.leadM ? 5 : 1) })).toEqual({ ok: false, errorKey: "reviews.notYourTeacher" });
    }
    expect(await db.reviewResponse.count({ where: { roundId, respondentUserId: ids.lead! } })).toBe(0);
  });

  it("TA-209: a real parent who teaches their child's class keeps the other teachers and is refused their own card", async () => {
    const mine = await pendingReviews(ctxs.parentTeacherAsParent!, schoolId);
    expect(mine.map((p) => p.teacherMembershipId).sort()).toEqual([ids.leadM!, ids.colleagueM!].sort());
    expect(await submitReview(ctxs.parentTeacherAsParent!, { roundId, teacherMembershipId: ids.parentTeacherM!, scores: full(5) })).toEqual({ ok: false, errorKey: "reviews.notYourTeacher" });
    expect(await submitReview(ctxs.parentTeacherAsParent!, { roundId, teacherMembershipId: ids.leadM!, scores: full(4) })).toEqual({ ok: true });
    expect(await db.reviewResponse.count({ where: { roundId, respondentUserId: ids.parentTeacher!, teacherMembershipId: ids.parentTeacherM! } })).toBe(0);
  });
});

describe("TA-213: one answer is not an average", () => {
  let roundId = "";
  beforeAll(async () => {
    const opened = await openReviewRound(ctxs.admin!, { teacherMembershipIds: [ids.ratedM!], audience: "STUDENTS", closesDateKey: "2099-01-01" });
    if (!opened.ok) throw new Error(`the round was refused: ${opened.errorKey}`);
    roundId = opened.roundId!;
  });

  it("TA-213: after one pupil's answer the office sees the count and no figure", async () => {
    expect(await submitReview(ctxs.p1!, { roundId, teacherMembershipId: ids.ratedM!, scores: { ...full(4), CLARITY: 1 } })).toEqual({ ok: true });
    const agg = await teacherReviewAggregate(ctxs.admin!, ids.ratedM!);
    expect(agg).toEqual({ responseCount: 1, byQuestion: {}, overall: null });
    const row = (await schoolReviewDashboard(ctxs.admin!)).find((r) => r.membershipId === ids.ratedM);
    expect(row?.allTime).toEqual({ responseCount: 1, byQuestion: {}, overall: null });
    expect(row?.latest).toBeNull();
  });

  it("TA-213: the teacher reads nothing of an open round, even at four answers", async () => {
    for (const who of ["p2", "p3", "p4"]) {
      expect(await submitReview(ctxs[who]!, { roundId, teacherMembershipId: ids.ratedM!, scores: full(4) })).toEqual({ ok: true });
    }
    const office = await teacherReviewAggregate(ctxs.admin!, ids.ratedM!);
    expect(office.overall).toBeNull();
    expect(office.byQuestion).toEqual({});
    const own = await teacherReviewAggregate(ctxs.ratedTeacher!, ids.ratedM!);
    expect(own.overall).toBeNull();
    expect(own.byQuestion).toEqual({});
  });

  it("TA-213: five answers give the office figures; the teacher has them once the round closes", async () => {
    expect(await submitReview(ctxs.p5!, { roundId, teacherMembershipId: ids.ratedM!, scores: full(4) })).toEqual({ ok: true });
    const office = await teacherReviewAggregate(ctxs.admin!, ids.ratedM!);
    // CLARITY (1 + 4 + 4 + 4 + 4) / 5 = 3.4; the others 4; overall (3.4 + 4 × 4) / 5 = 3.88 → 3.9.
    expect(office).toEqual({ responseCount: 5, byQuestion: { ...full(4), CLARITY: 3.4 }, overall: 3.9 });
    expect((await schoolReviewDashboard(ctxs.admin!)).find((r) => r.membershipId === ids.ratedM)?.latest).toEqual({ overall: 3.9, count: 5 });
    expect((await teacherReviewAggregate(ctxs.ratedTeacher!, ids.ratedM!)).overall).toBeNull();

    expect(await closeReviewRound(ctxs.admin!, roundId)).toEqual({ ok: true });
    expect(await teacherReviewAggregate(ctxs.ratedTeacher!, ids.ratedM!)).toEqual(office);
  });

  it("TA-213: a later round closed with one answer is counted and moves no figure", async () => {
    const before = await teacherReviewAggregate(ctxs.ratedTeacher!, ids.ratedM!);
    const opened = await openReviewRound(ctxs.admin!, { teacherMembershipIds: [ids.ratedM!], audience: "STUDENTS", closesDateKey: "2099-01-01" });
    if (!opened.ok) throw new Error(`the round was refused: ${opened.errorKey}`);
    expect(await submitReview(ctxs.p1!, { roundId: opened.roundId!, teacherMembershipId: ids.ratedM!, scores: full(1) })).toEqual({ ok: true });
    expect(await closeReviewRound(ctxs.admin!, opened.roundId!)).toEqual({ ok: true });

    // Six answers in all, the figures still the first round's five: the sixth cannot be read off the change.
    const expected = { ...before, responseCount: 6 };
    expect(await teacherReviewAggregate(ctxs.ratedTeacher!, ids.ratedM!)).toEqual(expected);
    expect(await teacherReviewAggregate(ctxs.admin!, ids.ratedM!)).toEqual(expected);
    expect((await schoolReviewDashboard(ctxs.admin!)).find((r) => r.membershipId === ids.ratedM)?.allTime).toEqual(expected);
  });
});
