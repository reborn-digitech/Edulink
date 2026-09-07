import type { TranslationKey } from "./i18n/dictionary";
import type { ReviewAudience, ReviewQuestion } from "./constants";

/**
 * Keys, not words — the ROLE_META precedent. Shared by the admin's aggregate
 * table, the respondent's questionnaire and the teacher's own profile, which
 * must all name a question identically in the reader's language.
 */
export const QUESTION_KEY: Record<ReviewQuestion, TranslationKey> = {
  CLARITY: "reviews.qClarity",
  SUPPORT: "reviews.qSupport",
  FAIRNESS: "reviews.qFairness",
  ENGAGEMENT: "reviews.qEngagement",
  RESPECT: "reviews.qRespect",
};

export const AUDIENCE_KEY: Record<ReviewAudience, TranslationKey> = {
  STUDENTS: "reviews.audienceStudents",
  PARENTS: "reviews.audienceParents",
  BOTH: "reviews.audienceBoth",
};
