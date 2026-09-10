import type { PracticeQuestion } from "@edulink/contracts";
import type { ServedQuestion } from "@/lib/quiz";

/**
 * A served question as the contract carries it. The level's label is a web
 * dictionary key; the phone names the rung from `difficulty` itself.
 */
export function servedQuestion(q: ServedQuestion): PracticeQuestion {
  return { questionId: q.questionId, stem: q.stem, choices: q.choices, difficulty: q.difficulty, askedCount: q.askedCount, totalCount: q.totalCount };
}
