import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { clampLevel, parseChoices, QUIZ_SUBJECTS } from "./quiz";
import { translateQuestion } from "./translate";
import { statsFor, type QuestionStatSummary } from "./bank-tools";
import { CONTENT_TEAM_SOURCE } from "./bank-source";
import type { ActiveContext } from "./session";

/**
 * The application's content team.
 *
 * An app admin curates the two things on this installation that belong to no
 * school and are read by all of them: the practice question bank and the
 * competitions marketplace. Both live in tables with no school policy (see the
 * foot of prisma/rls.sql), so the authorisation is this flag, asserted at
 * every entry point rather than trusted from a layout.
 *
 * WHAT AN APP ADMIN IS NOT: the operator. They cannot see inside a school, and
 * nothing here takes an id that names one. A platform competition is stamped
 * `organizerSchoolId: null` and the bank has no school column at all, so the
 * write surface simply has no tenant to leak. The operator, who holds more,
 * passes this surface's gate too — that containment is what makes the
 * one-way inheritance safe.
 */

/**
 * The operator passes too, BY DESIGN and not as a convenience. The person who
 * runs the server appoints the content team (see appointAppAdmin in
 * superuser.ts) and holds everything the team holds — a curator the operator
 * could hire but not oversee would be an odd shape of trust. The direction
 * never reverses: an app admin gains nothing of the operator's, because
 * nothing here checks `isAppAdmin` where a school could leak through it.
 */
export function assertAppAdmin(session: ActiveContext): void {
  if (!session.user.isAppAdmin && !session.user.isSuperuser) {
    throw new AccessError("access.thisAreaBelongsToTheContentTeam", "NOT_FOUND");
  }
}

export type BankResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; errorKey: TranslationKey };

/* -------------------------------------------------------------------------- */
/* Platform competitions                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Competitions the platform itself posts, i.e. `organizerSchoolId` null.
 *
 * The school-organised path (competitions.ts) scopes everything by the
 * session's school; this one scopes by the null organiser instead, which is
 * exactly the set no school's admin can touch through that path.
 */
export async function listPlatformCompetitions(session: ActiveContext) {
  assertAppAdmin(session);
  return db.competition.findMany({
    where: { organizerSchoolId: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      status: true,
      organizerName: true,
      registrationClosesAt: true,
      createdAt: true,
    },
    take: 200,
  });
}

export type PlatformCompetitionInput = {
  title: string;
  summary: string;
  body?: string | null;
  organizerName?: string | null;
  subject?: string | null;
  gradeLow?: string | null;
  gradeHigh?: string | null;
  eligibility?: string | null;
  rules?: string | null;
  prizes?: string | null;
  externalUrl?: string | null;
  registrationClosesAt?: Date | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  requiresParentConsent: boolean;
  leaderboardEnabled?: boolean;
};

/**
 * The "Post a competition" form of the content team's area, read into the
 * input `createPlatformCompetition` takes: the web's server action and the
 * phone's POST /api/v1/appadmin/competitions/drafts both come through here, so
 * the two doors refuse the same things in the same words. A checkbox is "on"
 * from a web form and `true` from the phone's JSON; empty text is "not given".
 */
export function readPlatformCompetitionForm(
  form: Record<string, unknown>,
): { ok: true; input: PlatformCompetitionInput } | { ok: false; errorKey: TranslationKey } {
  const title = String(form.title ?? "").trim();
  const summary = String(form.summary ?? "").trim();
  if (title.length < 3) return { ok: false, errorKey: "appadmin.titleTooShort" };
  if (summary.length < 3) return { ok: false, errorKey: "appadmin.summaryTooShort" };
  const text = (value: unknown) => String(value ?? "") || null;
  const checked = (value: unknown) => value === "on" || value === true;
  const externalUrl = text(form.externalUrl);
  if (externalUrl && !isHttpsUrl(externalUrl)) return { ok: false, errorKey: "appadmin.linkMustBeHttps" };
  return {
    ok: true,
    input: {
      title,
      summary,
      body: text(form.body),
      organizerName: text(form.organizerName),
      subject: text(form.subject),
      gradeLow: text(form.gradeLow),
      gradeHigh: text(form.gradeHigh),
      eligibility: text(form.eligibility),
      rules: text(form.rules),
      prizes: text(form.prizes),
      externalUrl,
      registrationClosesAt: parseFormDate(form.registrationClosesAt),
      startsAt: parseFormDate(form.startsAt),
      endsAt: parseFormDate(form.endsAt),
      requiresParentConsent: checked(form.requiresParentConsent),
      leaderboardEnabled: checked(form.leaderboardEnabled),
    },
  };
}

/**
 * An organiser's page opens on every child's phone from a link the content
 * team typed: https and nothing else — no http, no javascript:, no custom
 * scheme that hands the phone to another app. The phone refuses the same.
 */
export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function parseFormDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Posts a competition for every school.
 *
 * DRAFT first, like the school path — publishing puts this in front of every
 * child on the installation and deserves its own deliberate press. `verified`
 * is set, and honestly: this is the one author for whom "checked by the people
 * running Shalaghar" is true by construction.
 */
export async function createPlatformCompetition(
  session: ActiveContext,
  input: PlatformCompetitionInput,
): Promise<string> {
  assertAppAdmin(session);
  if (input.externalUrl && !isHttpsUrl(input.externalUrl)) throw new AccessError("appadmin.linkMustBeHttps");

  const competition = await db.competition.create({
    data: {
      title: input.title,
      summary: input.summary,
      body: input.body ?? "",
      organizerName: input.organizerName?.trim() || "Shalaghar",
      organizerSchoolId: null,
      subject: input.subject ?? null,
      gradeLow: input.gradeLow ?? null,
      gradeHigh: input.gradeHigh ?? null,
      eligibility: input.eligibility ?? null,
      rules: input.rules ?? null,
      prizes: input.prizes ?? null,
      externalUrl: input.externalUrl ?? null,
      registrationClosesAt: input.registrationClosesAt ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      requiresParentConsent: input.requiresParentConsent,
      leaderboardEnabled: input.leaderboardEnabled ?? false,
      verified: true,
      status: "DRAFT",
    },
  });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.competition.create",
    targetType: "Competition",
    targetId: competition.id,
    meta: { title: input.title },
  });

  return competition.id;
}

/**
 * Publish, withdraw or re-draft a platform competition.
 *
 * Scoped by `organizerSchoolId: null` in the WHERE for the same reason the
 * school path scopes by its own id: an id belonging to a school's competition
 * simply matches nothing here.
 */
export async function setPlatformCompetitionStatus(
  session: ActiveContext,
  competitionId: string,
  status: "PUBLISHED" | "ARCHIVED" | "DRAFT",
): Promise<void> {
  assertAppAdmin(session);

  const updated = await db.competition.updateMany({
    where: { id: competitionId, organizerSchoolId: null },
    data: { status },
  });
  if (updated.count === 0) throw new AccessError("access.competitionNotFound", "NOT_FOUND");

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: `appadmin.competition.${status.toLowerCase()}`,
    targetType: "Competition",
    targetId: competitionId,
  });
}

/* -------------------------------------------------------------------------- */
/* The question bank                                                           */
/* -------------------------------------------------------------------------- */

/** Topics with their question counts, for the bank dashboard. */
export async function listBankTopics(session: ActiveContext) {
  assertAppAdmin(session);

  const [topics, counts] = await Promise.all([
    db.quizTopic.findMany({
      where: { retiredAt: null },
      orderBy: [{ subject: "asc" }, { classLevel: "asc" }, { position: "asc" }],
      select: { id: true, subject: true, classLevel: true, chapter: true, name: true, slug: true },
    }),
    db.quizQuestion.groupBy({ by: ["topicId"], _count: { _all: true } }),
  ]);
  const byTopic = new Map(counts.map((c) => [c.topicId, c._count._all]));

  return topics.map((topic) => ({ ...topic, questionCount: byTopic.get(topic.id) ?? 0 }));
}

export async function getBankTopic(session: ActiveContext, topicId: string) {
  assertAppAdmin(session);
  return db.quizTopic.findUnique({
    where: { id: topicId },
    select: { id: true, subject: true, classLevel: true, chapter: true, name: true, slug: true },
  });
}

export type BankQuestion = {
  id: string;
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  /** Which languages this question is translated into. */
  languages: string[];
  /** Which of those a native speaker has read (translation-review.ts). */
  reviewed: { hi: boolean; mr: boolean };
  /** How it is doing, from the nightly bank:stats job; null until a child has answered it. */
  stats: QuestionStatSummary | null;
};

export async function listBankQuestions(
  session: ActiveContext,
  topicId: string,
): Promise<BankQuestion[]> {
  assertAppAdmin(session);

  const questions = await db.quizQuestion.findMany({
    where: { topicId },
    orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      difficulty: true,
      stem: true,
      choices: true,
      answerIndex: true,
      solution: true,
      hiReviewedAt: true,
      mrReviewedAt: true,
      translations: { select: { language: true } },
    },
    take: 1000,
  });
  const stats = await statsFor(questions.map((q) => q.id));

  return questions.map((q) => ({
    id: q.id,
    difficulty: q.difficulty,
    stem: q.stem,
    choices: parseChoices(q.choices),
    answerIndex: q.answerIndex,
    solution: q.solution,
    languages: q.translations.map((t) => t.language).sort(),
    reviewed: { hi: q.hiReviewedAt !== null, mr: q.mrReviewedAt !== null },
    stats: stats.get(q.id) ?? null,
  }));
}

export async function getBankQuestion(session: ActiveContext, questionId: string) {
  assertAppAdmin(session);
  const q = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      topicId: true,
      difficulty: true,
      stem: true,
      choices: true,
      answerIndex: true,
      solution: true,
      hiReviewedAt: true,
      mrReviewedAt: true,
      translations: { select: { language: true } },
    },
  });
  if (!q) return null;
  return {
    id: q.id,
    topicId: q.topicId,
    difficulty: q.difficulty,
    stem: q.stem,
    choices: parseChoices(q.choices),
    answerIndex: q.answerIndex,
    solution: q.solution,
    languages: q.translations.map((t) => t.language).sort(),
    reviewed: { hi: q.hiReviewedAt !== null, mr: q.mrReviewedAt !== null },
  };
}

export type QuestionInput = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
};

function checkQuestionInput(input: QuestionInput): TranslationKey | null {
  if (input.stem.trim().length < 5) return "appadmin.stemTooShort";
  const choices = input.choices.map((c) => c.trim());
  if (choices.length < 2 || choices.some((c) => c.length === 0)) {
    return "appadmin.needTwoChoices";
  }
  if (
    !Number.isInteger(input.answerIndex) ||
    input.answerIndex < 0 ||
    input.answerIndex >= choices.length
  ) {
    return "appadmin.pickTheAnswer";
  }
  if (input.solution.trim().length < 5) return "appadmin.solutionTooShort";
  return null;
}

/**
 * Writes (or rewrites) a question's Hindi and Marathi rows from the model's
 * translation. A null translation writes nothing — the reading path falls back
 * to English field by field, so the question works either way.
 */
async function upsertTranslations(questionId: string, input: QuestionInput): Promise<boolean> {
  const translated = await translateQuestion({
    stem: input.stem.trim(),
    choices: input.choices.map((c) => c.trim()),
    solution: input.solution.trim(),
  });
  if (!translated) return false;

  for (const language of ["hi", "mr"] as const) {
    const t = translated[language];
    await db.quizQuestionTranslation.upsert({
      where: { questionId_language: { questionId, language } },
      create: {
        questionId,
        language,
        stem: t.stem,
        choices: JSON.stringify(t.choices),
        solution: t.solution,
      },
      update: {
        stem: t.stem,
        choices: JSON.stringify(t.choices),
        solution: t.solution,
      },
    });
  }
  // The words a native speaker read are gone; so is the record that they read
  // them. The question goes back on the review list (translation-review.ts).
  await db.quizQuestion.update({
    where: { id: questionId },
    data: { hiReviewedAt: null, hiReviewedBy: null, mrReviewedAt: null, mrReviewedBy: null },
  });
  return true;
}

/**
 * Adds a question in English and translates it to Hindi and Marathi.
 *
 * The English row is written FIRST and the translations after, so a failed
 * translation costs the reader a language, never the author their question.
 * `translated` in the result is what lets the dashboard say which happened.
 */
export async function createBankQuestion(
  session: ActiveContext,
  topicId: string,
  input: QuestionInput,
): Promise<BankResult<{ questionId: string; translated: boolean }>> {
  assertAppAdmin(session);

  const topic = await db.quizTopic.findUnique({ where: { id: topicId }, select: { id: true, slug: true } });
  if (!topic) return { ok: false, errorKey: "appadmin.noSuchTopic" };

  const problem = checkQuestionInput(input);
  if (problem) return { ok: false, errorKey: problem };

  const question = await db.quizQuestion.create({
    data: {
      topicId,
      difficulty: clampLevel(input.difficulty),
      stem: input.stem.trim(),
      choices: JSON.stringify(input.choices.map((c) => c.trim())),
      answerIndex: input.answerIndex,
      solution: input.solution.trim(),
      // The provenance tag scripts/import-quiz.ts spares; one constant for every writer (bank-source.ts).
      source: CONTENT_TEAM_SOURCE,
      licence: "proprietary",
      // Typed by a person who read it as they typed it — reviewed by author.
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
    select: { id: true },
  });

  const translated = await upsertTranslations(question.id, input);

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.question.create",
    targetType: "QuizQuestion",
    targetId: question.id,
    meta: { topicSlug: topic.slug, translated },
  });

  return { ok: true, questionId: question.id, translated };
}

/**
 * Edits a question and re-translates it, so the three languages cannot drift.
 */
export async function updateBankQuestion(
  session: ActiveContext,
  questionId: string,
  input: QuestionInput,
): Promise<BankResult<{ translated: boolean }>> {
  assertAppAdmin(session);

  const existing = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: { id: true },
  });
  if (!existing) return { ok: false, errorKey: "appadmin.noSuchQuestion" };

  const problem = checkQuestionInput(input);
  if (problem) return { ok: false, errorKey: problem };

  await db.quizQuestion.update({
    where: { id: questionId },
    data: {
      difficulty: clampLevel(input.difficulty),
      stem: input.stem.trim(),
      choices: JSON.stringify(input.choices.map((c) => c.trim())),
      answerIndex: input.answerIndex,
      solution: input.solution.trim(),
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  const translated = await upsertTranslations(questionId, input);

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.question.update",
    targetType: "QuizQuestion",
    targetId: questionId,
    meta: { translated },
  });

  return { ok: true, translated };
}

/**
 * Removes a question outright.
 *
 * THIS IS A REAL DELETE, and it cascades: a child's QuizResponse rows to this
 * question go with it, which nudges their seen-count back down and re-opens a
 * "finished" topic by one question. That is the honest consequence of pulling
 * a bad question — a wrong question that stays servable is worse. Mastery
 * levels and badges already earned are untouched.
 */
export async function deleteBankQuestion(
  session: ActiveContext,
  questionId: string,
): Promise<BankResult> {
  assertAppAdmin(session);

  const existing = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, topic: { select: { slug: true } } },
  });
  if (!existing) return { ok: false, errorKey: "appadmin.noSuchQuestion" };

  await db.quizQuestion.delete({ where: { id: questionId } });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.question.delete",
    targetType: "QuizQuestion",
    targetId: questionId,
    meta: { topicSlug: existing.topic.slug },
  });

  return { ok: true };
}

export { QUIZ_SUBJECTS };
