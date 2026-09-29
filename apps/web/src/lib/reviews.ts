import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { readJson, writeJson } from "./json";
import { todayKey } from "./dates";
import {
  REVIEW_QUESTIONS,
  REVIEW_SCALE_MIN,
  REVIEW_SCALE_MAX,
  REVIEW_AUDIENCES,
  type ReviewAudience,
  type ReviewQuestion,
} from "./constants";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Teacher reviews: the admin opens a ROUND, the chosen audience answers a
 * fixed RATINGS questionnaire, and everybody ever sees only aggregates.
 *
 * RATINGS, NOT PROSE, BY DESIGN. The request behind this feature was explicit:
 * a questionnaire, not free text. A school collecting children's sentences
 * about named adults owns a moderation problem and a safeguarding archive; a
 * school collecting "1 to 5, how clearly do they explain" owns a number that
 * can be compared across terms and translated into every reader's language.
 *
 * THE RESPONDENT IS RECORDED AND NEVER SURFACED. One row per person per
 * teacher per round is unenforceable anonymously, so the row names its author
 * — and every read path below returns aggregates only. No caller gets a list
 * of who said what; the promise made in the UI ("your name is not shown") is
 * kept here, where it cannot be forgotten by a new page.
 *
 * WHO MAY RATE WHOM: only somebody the teacher actually teaches. A student
 * rates the teachers timetabled for their class (or its class teachers); a
 * parent rates through their children's classes. An admin cannot widen this —
 * a rating from somebody who never sat in the room is noise wearing a number.
 */

export type ReviewResult = { ok: true } | { ok: false; errorKey: TranslationKey };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------------- */
/* Admin: opening, closing, reading rounds                                    */
/* ------------------------------------------------------------------------- */

function requireAdmin(ctx: ActiveContext): string {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) {
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan");
  }
  return ctx.schoolId;
}

export async function openReviewRound(
  ctx: ActiveContext,
  input: { teacherMembershipIds: string[]; audience: ReviewAudience; closesDateKey: string },
): Promise<ReviewResult & { roundId?: string }> {
  const schoolId = requireAdmin(ctx);

  if (!REVIEW_AUDIENCES.includes(input.audience)) return { ok: false, errorKey: "reviews.badAudience" };
  if (!DATE_KEY.test(input.closesDateKey)) return { ok: false, errorKey: "reviews.badCloseDate" };

  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });
  if (input.closesDateKey < todayKey(school.timezone)) {
    return { ok: false, errorKey: "reviews.closeDateInPast" };
  }

  // Only real, present teachers of this school can be asked about.
  const teachers = await db.membership.findMany({
    where: {
      id: { in: input.teacherMembershipIds },
      schoolId,
      role: "TEACHER",
      status: "ACTIVE",
      leftAt: null,
    },
    select: { id: true },
  });
  if (teachers.length === 0) return { ok: false, errorKey: "reviews.pickATeacher" };

  const round = await db.reviewRound.create({
    data: {
      schoolId,
      audience: input.audience,
      closesDateKey: input.closesDateKey,
      createdByMembershipId: ctx.membershipId,
      teachers: {
        create: teachers.map((teacher) => ({ schoolId, teacherMembershipId: teacher.id })),
      },
    },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "review.round.open",
    targetType: "ReviewRound",
    targetId: round.id,
    meta: { audience: input.audience, closesDateKey: input.closesDateKey, teachers: teachers.length },
  });

  return { ok: true, roundId: round.id };
}

export async function closeReviewRound(ctx: ActiveContext, roundId: string): Promise<ReviewResult> {
  const schoolId = requireAdmin(ctx);
  const updated = await db.reviewRound.updateMany({
    where: { id: roundId, schoolId, status: "OPEN" },
    data: { status: "CLOSED" },
  });
  if (updated.count === 0) return { ok: false, errorKey: "reviews.roundGone" };

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "review.round.close",
    targetType: "ReviewRound",
    targetId: roundId,
  });
  return { ok: true };
}

export type RoundSummary = {
  id: string;
  audience: ReviewAudience;
  closesDateKey: string;
  status: string;
  createdAt: Date;
  teacherCount: number;
  responseCount: number;
};

export async function listReviewRounds(
  ctx: ActiveContext,
  opts: { status?: "OPEN" | "CLOSED" } = {},
): Promise<RoundSummary[]> {
  const schoolId = requireAdmin(ctx);
  const rounds = await db.reviewRound.findMany({
    where: { schoolId, ...(opts.status ? { status: opts.status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { teachers: true, responses: true } } },
  });
  return rounds.map((round) => ({
    id: round.id,
    audience: round.audience as ReviewAudience,
    closesDateKey: round.closesDateKey,
    status: round.status,
    createdAt: round.createdAt,
    teacherCount: round._count.teachers,
    responseCount: round._count.responses,
  }));
}

/* ------------------------------------------------------------------------- */
/* Aggregates — the ONLY way ratings leave this module                        */
/* ------------------------------------------------------------------------- */

export type TeacherReviewAggregate = {
  /** Answers across every round. */
  responseCount: number;
  /** Mean per question, 1..5, absent until somebody has answered it. */
  byQuestion: Partial<Record<ReviewQuestion, number>>;
  /** Mean of the per-question means — the one number a card can wear. */
  overall: number | null;
};

/**
 * Readable by the school's admin and principal, and by the teacher about
 * themselves. Not by other teachers, and not by the people who answered —
 * a respondent's window onto the result is the same public aggregate the
 * teacher sees, later, if the school chooses to share it out of band.
 */
export async function teacherReviewAggregate(
  ctx: ActiveContext,
  teacherMembershipId: string,
): Promise<TeacherReviewAggregate> {
  if (!ctx.schoolId) throw new AccessError("access.pleaseLogInAgain");
  const isStaffReader = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL";
  const isSelf = ctx.role === "TEACHER" && ctx.membershipId === teacherMembershipId;
  if (!isStaffReader && !isSelf) throw new AccessError("access.notYourPage");

  const rows = await db.reviewResponse.findMany({
    where: { schoolId: ctx.schoolId, teacherMembershipId },
    select: { scores: true },
  });

  const sums = new Map<ReviewQuestion, { total: number; n: number }>();
  for (const row of rows) {
    const scores = readJson<Record<string, number>>(row.scores, {});
    for (const question of REVIEW_QUESTIONS) {
      const value = scores[question];
      if (typeof value !== "number") continue;
      const entry = sums.get(question) ?? { total: 0, n: 0 };
      entry.total += value;
      entry.n += 1;
      sums.set(question, entry);
    }
  }

  const byQuestion: Partial<Record<ReviewQuestion, number>> = {};
  for (const [question, { total, n }] of sums) {
    byQuestion[question] = Math.round((total / n) * 10) / 10;
  }
  const means = Object.values(byQuestion);
  const overall = means.length
    ? Math.round((means.reduce((a, b) => a + b, 0) / means.length) * 10) / 10
    : null;

  return { responseCount: rows.length, byQuestion, overall };
}

/* ------------------------------------------------------------------------- */
/* Respondents: what awaits me, and answering                                 */
/* ------------------------------------------------------------------------- */

/** Which teachers this respondent may rate: the ones who actually teach them. */
async function rateableTeacherIds(ctx: ActiveContext, schoolId: string): Promise<Set<string>> {
  let classIds: string[] = [];

  if (ctx.role === "STUDENT" && ctx.membershipId) {
    const enrollments = await db.enrollment.findMany({
      where: { studentMembershipId: ctx.membershipId, status: "ACTIVE" },
      select: { classId: true },
    });
    classIds = enrollments.map((row) => row.classId);
  } else if (ctx.role === "PARENT") {
    const children = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE", studentSchoolId: schoolId },
      select: { student: { select: { enrollments: { where: { status: "ACTIVE" }, select: { classId: true } } } } },
    });
    classIds = children.flatMap((g) => g.student.enrollments.map((e) => e.classId));
  }

  if (classIds.length === 0) return new Set();

  const [slots, classTeachers] = await Promise.all([
    db.timetableSlot.findMany({
      where: { schoolId, classId: { in: classIds }, teacherMembershipId: { not: null } },
      select: { teacherMembershipId: true },
    }),
    db.classTeacher.findMany({
      where: { classId: { in: classIds } },
      select: { teacherMembershipId: true },
    }),
  ]);

  return new Set([
    ...slots.map((slot) => slot.teacherMembershipId!),
    ...classTeachers.map((row) => row.teacherMembershipId),
  ]);
}

function audienceAdmits(audience: string, role: string | null): boolean {
  if (audience === "BOTH") return role === "STUDENT" || role === "PARENT";
  if (audience === "STUDENTS") return role === "STUDENT";
  if (audience === "PARENTS") return role === "PARENT";
  return false;
}

export type PendingReview = {
  roundId: string;
  closesDateKey: string;
  teacherMembershipId: string;
  teacherName: string;
  /** Their previous answer in this round, if they gave one — editable. */
  myScores: Partial<Record<ReviewQuestion, number>> | null;
};

/**
 * The questionnaires waiting for this student or parent: open rounds in this
 * school, teachers in the round who actually teach them, latest answer if any.
 */
export async function pendingReviews(ctx: ActiveContext, schoolId: string): Promise<PendingReview[]> {
  if (ctx.role !== "STUDENT" && ctx.role !== "PARENT") return [];

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
  if (!school) return [];
  const today = todayKey(school.timezone);

  const rounds = await db.reviewRound.findMany({
    where: { schoolId, status: "OPEN", closesDateKey: { gte: today } },
    include: {
      teachers: {
        include: {
          teacher: { include: { user: { select: { name: true, preferredName: true } } } },
        },
      },
      responses: {
        where: { respondentUserId: ctx.user.id },
        select: { teacherMembershipId: true, scores: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const admitted = rounds.filter((round) => audienceAdmits(round.audience, ctx.role));
  if (admitted.length === 0) return [];

  const rateable = await rateableTeacherIds(ctx, schoolId);
  const out: PendingReview[] = [];
  for (const round of admitted) {
    const mine = new Map(round.responses.map((r) => [r.teacherMembershipId, r.scores]));
    for (const entry of round.teachers) {
      if (!rateable.has(entry.teacherMembershipId)) continue;
      const previous = mine.get(entry.teacherMembershipId);
      out.push({
        roundId: round.id,
        closesDateKey: round.closesDateKey,
        teacherMembershipId: entry.teacherMembershipId,
        teacherName: entry.teacher.user.preferredName ?? entry.teacher.user.name,
        myScores: previous ? readJson<Partial<Record<ReviewQuestion, number>>>(previous, {}) : null,
      });
    }
  }
  return out;
}

/**
 * Answer (or amend, while the round is open) one teacher's questionnaire.
 * Every question must be answered — a half-filled scale averages as a verdict
 * the respondent never gave.
 */
export async function submitReview(
  ctx: ActiveContext,
  input: { roundId: string; teacherMembershipId: string; scores: Record<string, number> },
): Promise<ReviewResult> {
  if (ctx.role !== "STUDENT" && ctx.role !== "PARENT") {
    throw new AccessError("access.notYourPage");
  }

  const round = await db.reviewRound.findUnique({
    where: { id: input.roundId },
    select: {
      id: true,
      schoolId: true,
      status: true,
      audience: true,
      closesDateKey: true,
      school: { select: { timezone: true } },
      teachers: { select: { teacherMembershipId: true } },
    },
  });
  if (!round) return { ok: false, errorKey: "reviews.roundGone" };
  if (round.status !== "OPEN") return { ok: false, errorKey: "reviews.roundClosed" };
  if (round.closesDateKey < todayKey(round.school.timezone)) {
    return { ok: false, errorKey: "reviews.roundClosed" };
  }
  if (!audienceAdmits(round.audience, ctx.role)) return { ok: false, errorKey: "reviews.notAskedOfYou" };
  if (!round.teachers.some((t) => t.teacherMembershipId === input.teacherMembershipId)) {
    return { ok: false, errorKey: "reviews.roundGone" };
  }

  const rateable = await rateableTeacherIds(ctx, round.schoolId);
  if (!rateable.has(input.teacherMembershipId)) {
    return { ok: false, errorKey: "reviews.notYourTeacher" };
  }

  const scores: Record<string, number> = {};
  for (const question of REVIEW_QUESTIONS) {
    const value = input.scores[question];
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < REVIEW_SCALE_MIN ||
      value > REVIEW_SCALE_MAX
    ) {
      return { ok: false, errorKey: "reviews.answerEverything" };
    }
    scores[question] = value;
  }

  await db.reviewResponse.upsert({
    where: {
      roundId_teacherMembershipId_respondentUserId: {
        roundId: round.id,
        teacherMembershipId: input.teacherMembershipId,
        respondentUserId: ctx.user.id,
      },
    },
    create: {
      schoolId: round.schoolId,
      roundId: round.id,
      teacherMembershipId: input.teacherMembershipId,
      respondentUserId: ctx.user.id,
      scores: writeJson(scores),
    },
    update: { scores: writeJson(scores) },
  });

  // Deliberately NOT audited with the respondent's identity next to the
  // teacher's: the audit log is staff-readable, and "who rated whom" is the
  // exact edge the anonymity promise lives on.
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* Teacher subjects — the admin's half of the signup picker                   */
/* ------------------------------------------------------------------------- */

/**
 * Replace a teacher's subject list. Admin-only: the teacher chose at signup,
 * and from then on the school's office owns the record — the same authority
 * that assigns them lessons in those subjects.
 *
 * THE HEAD TEACHES TOO. A principal was invited as a principal and never
 * passed the subject picker, so a head who takes Class 9 for mathematics had
 * no subjects and nobody could give them any: the teacher filing printed a
 * blank for them and the cover board never suggested them. The office sets a
 * principal's the same way. The head does not set their own — the twelve
 * settings doors that are the admin's alone stay the admin's (decided
 * 2026-09-29), and this is one more record the office keeps.
 */
export async function setTeacherSubjects(
  ctx: ActiveContext,
  teacherMembershipId: string,
  subjects: string[],
): Promise<ReviewResult> {
  // The ADMIN'S alone, here in the library and not only at the page's door:
  // `requireAdmin` above admits the head, which is right for review rounds
  // and let a principal write anybody's subjects, their own included.
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyTheOfficeSetsSubjects");
  const schoolId = ctx.schoolId;

  const cleaned = [
    ...new Map(
      subjects
        .map((s) => s.trim().replace(/\s+/g, " ").slice(0, 60))
        .filter((s) => s.length > 0)
        .map((s) => [s.toLowerCase(), s] as const),
    ).values(),
  ].slice(0, 20);

  const updated = await db.membership.updateMany({
    where: { id: teacherMembershipId, schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, leftAt: null },
    data: { subjects: cleaned.length > 0 ? writeJson(cleaned) : null },
  });
  if (updated.count === 0) return { ok: false, errorKey: "reviews.noSuchTeacher" };

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "teacher.subjects.set",
    targetType: "Membership",
    targetId: teacherMembershipId,
    meta: { subjects: cleaned },
  });

  const target = await db.membership.findUnique({
    where: { id: teacherMembershipId },
    select: { userId: true, role: true },
  });
  if (target) {
    await notify({
      userId: target.userId,
      schoolId,
      kind: "SYSTEM",
      titleKey: "reviews.notifSubjectsChanged",
      body: cleaned.join(", "),
      // A head has no teacher's profile page; their account is where they are sent.
      url: target.role === "PRINCIPAL" ? "/account" : "/teacher/profile",
    }).catch(() => undefined);
  }

  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* The dashboard: every teacher, their standing, and the direction            */
/* ------------------------------------------------------------------------- */

export type TeacherReviewRow = {
  membershipId: string;
  name: string;
  /** Across every round — the number the school stands behind. */
  allTime: TeacherReviewAggregate;
  /** The most recent round this teacher was rated in, if any. */
  latest: { overall: number; count: number } | null;
  /** The round before that — the comparison "change of ratings" needs. */
  previous: { overall: number; count: number } | null;
  /** latest.overall − previous.overall, rounded to one decimal. Null until
   * a second rated round exists: one number has no direction. */
  delta: number | null;
};

function roundOverall(rows: { scores: string }[]): { overall: number; count: number } | null {
  if (rows.length === 0) return null;
  const sums = new Map<ReviewQuestion, { total: number; n: number }>();
  for (const row of rows) {
    const scores = readJson<Record<string, number>>(row.scores, {});
    for (const question of REVIEW_QUESTIONS) {
      const value = scores[question];
      if (typeof value !== "number") continue;
      const entry = sums.get(question) ?? { total: 0, n: 0 };
      entry.total += value;
      entry.n += 1;
      sums.set(question, entry);
    }
  }
  const means = [...sums.values()].map(({ total, n }) => total / n);
  if (means.length === 0) return null;
  return {
    overall: Math.round((means.reduce((a, b) => a + b, 0) / means.length) * 10) / 10,
    count: rows.length,
  };
}

/**
 * The whole staff room in one read, for the admin's desk AND the principal's
 * dashboard — one function so the two pages cannot disagree about a number.
 *
 * THE DELTA COMPARES ROUNDS, NOT DAYS: a school that asks once a term gets
 * "since last term" without this code knowing what a term is. Rounds are
 * ordered by when they were opened, and only rounds somebody actually answered
 * in count — an ignored round is an absence of data, not a zero.
 */
export async function schoolReviewDashboard(ctx: ActiveContext): Promise<TeacherReviewRow[]> {
  const schoolId = requireAdmin(ctx);

  const [teachers, rounds, responses] = await Promise.all([
    db.membership.findMany({
      where: { schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.reviewRound.findMany({
      where: { schoolId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.reviewResponse.findMany({
      where: { schoolId },
      select: { teacherMembershipId: true, roundId: true, scores: true },
    }),
  ]);

  const roundOrder = new Map(rounds.map((round, index) => [round.id, index]));

  const byTeacher = new Map<string, Map<string, { scores: string }[]>>();
  for (const response of responses) {
    const perRound = byTeacher.get(response.teacherMembershipId) ?? new Map();
    const bucket = perRound.get(response.roundId) ?? [];
    bucket.push({ scores: response.scores });
    perRound.set(response.roundId, bucket);
    byTeacher.set(response.teacherMembershipId, perRound);
  }

  const out: TeacherReviewRow[] = [];
  for (const teacher of teachers) {
    const perRound = byTeacher.get(teacher.id) ?? new Map<string, { scores: string }[]>();
    const ratedRounds = [...perRound.entries()]
      .map(([roundId, rows]) => ({ order: roundOrder.get(roundId) ?? -1, agg: roundOverall(rows) }))
      .filter((entry) => entry.agg !== null)
      .sort((a, b) => a.order - b.order);

    const latest = ratedRounds.at(-1)?.agg ?? null;
    const previous = ratedRounds.at(-2)?.agg ?? null;

    out.push({
      membershipId: teacher.id,
      name: teacher.user.preferredName ?? teacher.user.name,
      allTime: await teacherReviewAggregate(ctx, teacher.id),
      latest,
      previous,
      delta:
        latest && previous ? Math.round((latest.overall - previous.overall) * 10) / 10 : null,
    });
  }
  return out;
}

/**
 * Whether ANY open round is asking this student or parent anything — the one
 * bit the navigation needs. The Feedback entry exists only while the school
 * has a question; a permanent menu item pointing at a permanent "nothing to
 * answer" teaches people to stop looking.
 */
export async function anyOpenReviews(ctx: ActiveContext): Promise<boolean> {
  let schoolIds: string[] = [];
  if (ctx.role === "STUDENT" && ctx.schoolId) {
    schoolIds = [ctx.schoolId];
  } else if (ctx.role === "PARENT") {
    const children = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE" },
      select: { studentSchoolId: true },
      distinct: ["studentSchoolId"],
    });
    schoolIds = children.map((child) => child.studentSchoolId);
  }
  if (schoolIds.length === 0) return false;

  const [rounds, schools] = await Promise.all([
    db.reviewRound.findMany({
      where: { schoolId: { in: schoolIds }, status: "OPEN" },
      select: { schoolId: true, audience: true, closesDateKey: true },
    }),
    db.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, timezone: true },
    }),
  ]);
  const zones = new Map(schools.map((school) => [school.id, school.timezone]));

  return rounds.some(
    (round) =>
      audienceAdmits(round.audience, ctx.role) &&
      round.closesDateKey >= todayKey(zones.get(round.schoolId) ?? "UTC"),
  );
}
