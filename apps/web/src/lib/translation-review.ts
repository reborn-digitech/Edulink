import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { assertAppAdmin, type BankResult } from "./app-admin";
import { parseChoices } from "./quiz";
import type { ActiveContext } from "./session";

/**
 * Native review of the bank's Hindi and Marathi.
 *
 * EVERY TRANSLATION ROW STARTS AS A DRAFT. app-admin.ts writes the Hindi and
 * Marathi of a question from the model the moment the English is saved, and
 * the JSON files scripts/import-quiz.ts loads carry translations nobody has
 * said they read. The practice engine serves either, by design (quiz.ts,
 * pick): a draft a child can read beats English a child cannot. What was
 * missing was any record of which rows a person had actually read — decision
 * 0002's gap 8 — and that is the whole of this module: a list of what is
 * unread in a language, a corrected text, and a stamp with a name on it.
 *
 * The stamp is on the QUESTION (hiReviewedAt, mrReviewedAt), not on the
 * translation row, so that re-translating the question (an English edit)
 * clears it in the same write that replaces the words. Reviewed is a
 * content-quality flag, never a gate.
 */

export type ReviewLanguage = "hi" | "mr";
export type ReviewStatus = "unreviewed" | "reviewed" | "missing";
export const REVIEW_PAGE = 30;

export type ReviewItem = {
  id: string;
  topic: { id: string; name: string; subject: string; classLevel: number };
  difficulty: number;
  english: { stem: string; choices: string[]; solution: string };
  /** Null when the language has no row yet (status "missing"). */
  translation: { stem: string; choices: string[]; solution: string } | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
};

export type ReviewList = {
  language: ReviewLanguage;
  status: ReviewStatus;
  page: number;
  pages: number;
  counts: Record<ReviewStatus, number>;
  items: ReviewItem[];
};

function stampOf(q: { hiReviewedAt: Date | null; mrReviewedAt: Date | null; hiReviewedBy: string | null; mrReviewedBy: string | null }, language: ReviewLanguage) {
  return language === "hi" ? { at: q.hiReviewedAt, by: q.hiReviewedBy } : { at: q.mrReviewedAt, by: q.mrReviewedBy };
}

export async function listTranslationReview(
  session: ActiveContext,
  opts: { language: ReviewLanguage; status?: ReviewStatus; page?: number; topicId?: string },
): Promise<ReviewList> {
  assertAppAdmin(session);
  const language = opts.language;
  const status = opts.status ?? "unreviewed";
  const stampAt = language === "hi" ? "hiReviewedAt" : "mrReviewedAt";
  const base = { topic: { retiredAt: null }, ...(opts.topicId ? { topicId: opts.topicId } : {}) };
  const hasRow = { translations: { some: { language } } };
  const whereFor: Record<ReviewStatus, object> = {
    unreviewed: { ...base, ...hasRow, [stampAt]: null },
    reviewed: { ...base, ...hasRow, [stampAt]: { not: null } },
    missing: { ...base, translations: { none: { language } } },
  };
  const [unreviewed, reviewed, missing] = await Promise.all([
    db.quizQuestion.count({ where: whereFor.unreviewed }),
    db.quizQuestion.count({ where: whereFor.reviewed }),
    db.quizQuestion.count({ where: whereFor.missing }),
  ]);
  const counts = { unreviewed, reviewed, missing };
  const pages = Math.max(1, Math.ceil(counts[status] / REVIEW_PAGE));
  const page = Math.min(pages, Math.max(1, Math.trunc(opts.page ?? 1)));
  const rows = await db.quizQuestion.findMany({
    where: whereFor[status],
    orderBy: [{ topic: { subject: "asc" } }, { topic: { classLevel: "asc" } }, { topic: { position: "asc" } }, { difficulty: "asc" }, { createdAt: "asc" }],
    skip: (page - 1) * REVIEW_PAGE,
    take: REVIEW_PAGE,
    select: {
      id: true,
      difficulty: true,
      stem: true,
      choices: true,
      solution: true,
      hiReviewedAt: true,
      mrReviewedAt: true,
      hiReviewedBy: true,
      mrReviewedBy: true,
      topic: { select: { id: true, name: true, subject: true, classLevel: true } },
      translations: { where: { language }, select: { stem: true, choices: true, solution: true }, take: 1 },
    },
  });
  const reviewerIds = [...new Set(rows.map((r) => stampOf(r, language).by).filter((x): x is string => !!x))];
  const reviewers = reviewerIds.length ? await db.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, name: true, preferredName: true } }) : [];
  const nameOf = new Map(reviewers.map((u) => [u.id, u.preferredName ?? u.name]));
  return {
    language,
    status,
    page,
    pages,
    counts,
    items: rows.map((r) => {
      const stamp = stampOf(r, language);
      const t = r.translations[0];
      return {
        id: r.id,
        topic: r.topic,
        difficulty: r.difficulty,
        english: { stem: r.stem, choices: parseChoices(r.choices), solution: r.solution },
        translation: t ? { stem: t.stem, choices: t.choices ? parseChoices(t.choices) : [], solution: t.solution } : null,
        reviewedAt: stamp.at,
        reviewedBy: stamp.by ? (nameOf.get(stamp.by) ?? null) : null,
      };
    }),
  };
}

export type ReviewInput = {
  language: ReviewLanguage;
  /** A corrected text; omitted, the row's words stand. Choices must be as many as the English. */
  text?: { stem: string; choices: string[]; solution: string };
  reviewed: boolean;
};

function checkText(text: NonNullable<ReviewInput["text"]>, englishChoices: number): TranslationKey | null {
  if (text.stem.trim().length === 0) return "appadmin.stemTooShort";
  const choices = text.choices.map((c) => c.trim());
  if (choices.length !== englishChoices || choices.some((c) => c.length === 0)) return "translationReview.choicesMustMatch";
  if (text.solution.trim().length === 0) return "appadmin.solutionTooShort";
  return null;
}

/**
 * Saves a corrected text and stamps the language read, or takes the stamp
 * off. A text without a stamp is allowed (a partial correction, to come back
 * to); a stamp without a text marks the draft as read as it stands.
 */
export async function reviewTranslation(session: ActiveContext, questionId: string, input: ReviewInput): Promise<BankResult<{ reviewed: boolean }>> {
  assertAppAdmin(session);
  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, choices: true, translations: { where: { language: input.language }, select: { id: true }, take: 1 } },
  });
  if (!question) return { ok: false, errorKey: "appadmin.noSuchQuestion" };

  if (input.text) {
    const problem = checkText(input.text, parseChoices(question.choices).length);
    if (problem) return { ok: false, errorKey: problem };
    const payload = { stem: input.text.stem.trim(), choices: JSON.stringify(input.text.choices.map((c) => c.trim())), solution: input.text.solution.trim() };
    await db.quizQuestionTranslation.upsert({
      where: { questionId_language: { questionId, language: input.language } },
      create: { questionId, language: input.language, ...payload },
      update: payload,
    });
  } else if (question.translations.length === 0 && input.reviewed) {
    // Nothing to have read.
    return { ok: false, errorKey: "translationReview.nothingToReview" };
  }

  const at = input.reviewed ? new Date() : null;
  const by = input.reviewed ? session.user.id : null;
  await db.quizQuestion.update({
    where: { id: questionId },
    data: input.language === "hi" ? { hiReviewedAt: at, hiReviewedBy: by } : { mrReviewedAt: at, mrReviewedBy: by },
  });

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.translation.review",
    targetType: "QuizQuestion",
    targetId: questionId,
    meta: { language: input.language, reviewed: input.reviewed, corrected: Boolean(input.text) },
  });

  return { ok: true, reviewed: input.reviewed };
}
