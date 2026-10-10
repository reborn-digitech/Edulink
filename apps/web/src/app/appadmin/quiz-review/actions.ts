"use server";

import { revalidatePath } from "next/cache";
import type { QuizDiscardReason, QuizReviewEditBody, QuizReviewItem, QuizReviewNext, QuizReviewQuery } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { acceptItem, discardItem, editAndAccept, getItem, nextItem, stampTranslation } from "@/lib/quiz-review";

/**
 * The review queue's presses (/appadmin/quiz-review and /root/quiz-review). Every one re-reads the
 * session and the library asserts the content team's gate (the operator passes it too); a server action
 * is reachable by anybody who can POST. A press that moves past the item answers with the next one under
 * the same filters, so the desk needs one round trip per item.
 */

type Failure = { ok: false; error: string };
type Moved = { ok: true; next: QuizReviewNext } | Failure;
type Refreshed = { ok: true; item: QuizReviewItem } | Failure;

async function failure(error: unknown): Promise<Failure> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error("[quiz-review]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}

function touched() {
  revalidatePath("/appadmin/quiz-review");
  revalidatePath("/root/quiz-review");
}

export async function nextItemAction(query: QuizReviewQuery): Promise<Moved> {
  try {
    const session = await requireApiUser();
    return { ok: true, next: await nextItem(session, query) };
  } catch (error) {
    return failure(error);
  }
}

export async function acceptAction(questionId: string, query: QuizReviewQuery): Promise<Moved> {
  try {
    const session = await requireApiUser();
    const result = await acceptItem(session, questionId);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, next: await nextItem(session, query) };
  } catch (error) {
    return failure(error);
  }
}

export async function editAcceptAction(questionId: string, input: QuizReviewEditBody, query: QuizReviewQuery): Promise<Moved> {
  try {
    const session = await requireApiUser();
    const result = await editAndAccept(session, questionId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, next: await nextItem(session, query) };
  } catch (error) {
    return failure(error);
  }
}

export async function discardAction(questionId: string, reason: QuizDiscardReason, query: QuizReviewQuery): Promise<Moved> {
  try {
    const session = await requireApiUser();
    const result = await discardItem(session, questionId, reason);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, next: await nextItem(session, query) };
  } catch (error) {
    return failure(error);
  }
}

export async function stampLanguageAction(questionId: string, language: "hi" | "mr", stamped: boolean): Promise<Refreshed> {
  try {
    const session = await requireApiUser();
    const result = await stampTranslation(session, questionId, language, stamped);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, item: await getItem(session, questionId) };
  } catch (error) {
    return failure(error);
  }
}
