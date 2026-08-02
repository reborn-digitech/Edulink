"use server";

import { requireApiRole, AccessError } from "@/lib/tenancy";
import {
  startAttempt,
  nextQuestion,
  submitAnswer,
  revealSolution,
  type ServedQuestion,
  type AnswerResult,
} from "@/lib/quiz";

/**
 * Abhyaas, from the child's side.
 *
 * Every action re-reads the role from the SESSION. The attempt id travels in the
 * request, so it is re-scoped to this pupil's school and membership on every
 * call inside `quiz.ts` — a guessed attempt id belonging to another child is a
 * NOT_FOUND, not somebody else's practice run.
 */

type Failure = { ok: false; error: string };
type Ok<T> = { ok: true } & T;

function failure(error: unknown): Failure {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[abhyaas]", error);
  return { ok: false, error: "Something went wrong. Try again in a moment." };
}

export async function begin(slug: string): Promise<Ok<{ attemptId: string; question: ServedQuestion | null }> | Failure> {
  try {
    const ctx = await requireApiRole("STUDENT");
    const { attemptId } = await startAttempt(ctx, slug);
    const question = await nextQuestion(ctx, attemptId);
    return { ok: true, attemptId, question };
  } catch (error) {
    return failure(error);
  }
}

export async function answer(
  attemptId: string,
  questionId: string,
  chosenIndex: number,
): Promise<Ok<{ result: AnswerResult }> | Failure> {
  try {
    const ctx = await requireApiRole("STUDENT");
    const result = await submitAnswer(ctx, attemptId, questionId, chosenIndex);
    return { ok: true, result };
  } catch (error) {
    return failure(error);
  }
}

export async function advance(attemptId: string): Promise<Ok<{ question: ServedQuestion | null }> | Failure> {
  try {
    const ctx = await requireApiRole("STUDENT");
    const question = await nextQuestion(ctx, attemptId);
    return { ok: true, question };
  } catch (error) {
    return failure(error);
  }
}

/** Costs the topic badge for this run. The UI says so before calling this. */
export async function reveal(
  attemptId: string,
  questionId: string,
): Promise<Ok<{ solution: string; answerIndex: number; badgeForfeited: boolean }> | Failure> {
  try {
    const ctx = await requireApiRole("STUDENT");
    const revealed = await revealSolution(ctx, attemptId, questionId);
    return { ok: true, ...revealed };
  } catch (error) {
    return failure(error);
  }
}
