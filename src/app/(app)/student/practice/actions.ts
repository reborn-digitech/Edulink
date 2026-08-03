"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { getSession, DEFAULT_PREFS, type UserPrefs } from "@/lib/session";
import { readJson, writeJson } from "@/lib/json";
import {
  startAttempt,
  nextQuestion,
  submitAnswer,
  revealSolution,
  normaliseLanguage,
  type ServedQuestion,
  type AnswerResult,
  type QuizLanguage,
} from "@/lib/quiz";
import type { ActiveContext } from "@/lib/session";

/**
 * Practice, from the child's side.
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
  console.error("[practice]", error);
  return { ok: false, error: "Something went wrong. Try again in a moment." };
}

/**
 * The reading language, taken from the SESSION and never from the caller.
 *
 * A language argument sent by the client would be harmless here — the worst a
 * forged one could do is show a child Marathi — but it would also be a second
 * source of truth that drifts from the stored preference the moment one of them
 * is updated and the other is not. One source, read where the role is read.
 */
function languageOf(ctx: ActiveContext): QuizLanguage {
  return normaliseLanguage(ctx.user.prefs.locale);
}

export async function begin(slug: string): Promise<Ok<{ attemptId: string; question: ServedQuestion | null }> | Failure> {
  try {
    const ctx = await requireApiRole("STUDENT");
    const { attemptId } = await startAttempt(ctx, slug);
    const question = await nextQuestion(ctx, attemptId, languageOf(ctx));
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
    const result = await submitAnswer(ctx, attemptId, questionId, chosenIndex, languageOf(ctx));
    return { ok: true, result };
  } catch (error) {
    return failure(error);
  }
}

export async function advance(attemptId: string): Promise<Ok<{ question: ServedQuestion | null }> | Failure> {
  try {
    const ctx = await requireApiRole("STUDENT");
    const question = await nextQuestion(ctx, attemptId, languageOf(ctx));
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
    const revealed = await revealSolution(ctx, attemptId, questionId, languageOf(ctx));
    return { ok: true, ...revealed };
  } catch (error) {
    return failure(error);
  }
}
