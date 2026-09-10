"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import {
  assertAppAdmin,
  createPlatformCompetition,
  readPlatformCompetitionForm,
  setPlatformCompetitionStatus,
  createBankQuestion,
  updateBankQuestion,
  deleteBankQuestion,
  type QuestionInput,
} from "@/lib/app-admin";

/**
 * Content-team actions. Every one re-reads the session and re-asserts the flag
 * — a server action is reachable by anybody who can POST, layout or no layout.
 */

type Result = { ok: boolean; error?: string; competitionId?: string };
type QuestionResult = {
  ok: boolean;
  error?: string;
  questionId?: string;
  /** False when the question saved but auto-translation did not run/succeed. */
  translated?: boolean;
};

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError)
    return { ok: false, error: (await getT())(error.key, error.vars) };
  console.error("[appadmin]", error);
  return { ok: false, error: (await getT())("common.tryAgainMoment") };
}

export async function createPlatformCompetitionAction(
  form: Record<string, unknown>,
): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertAppAdmin(session);

    const read = readPlatformCompetitionForm(form);
    if (!read.ok) return { ok: false, error: (await getT())(read.errorKey) };

    const competitionId = await createPlatformCompetition(session, read.input);

    revalidatePath("/appadmin");
    revalidatePath("/competitions");
    return { ok: true, competitionId };
  } catch (error) {
    return failure(error);
  }
}

export async function setCompetitionStatusAction(
  competitionId: string,
  status: "PUBLISHED" | "ARCHIVED" | "DRAFT",
): Promise<Result> {
  try {
    const session = await requireApiUser();
    await setPlatformCompetitionStatus(session, competitionId, status);
    revalidatePath("/appadmin");
    revalidatePath("/competitions");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/* ------------------------------ question bank ----------------------------- */

export async function createQuestionAction(
  topicId: string,
  input: QuestionInput,
): Promise<QuestionResult> {
  try {
    const session = await requireApiUser();
    const result = await createBankQuestion(session, topicId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/appadmin/bank/${topicId}`);
    return { ok: true, questionId: result.questionId, translated: result.translated };
  } catch (error) {
    return failure(error);
  }
}

export async function updateQuestionAction(
  topicId: string,
  questionId: string,
  input: QuestionInput,
): Promise<QuestionResult> {
  try {
    const session = await requireApiUser();
    const result = await updateBankQuestion(session, questionId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/appadmin/bank/${topicId}`);
    return { ok: true, questionId, translated: result.translated };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteQuestionAction(
  topicId: string,
  questionId: string,
): Promise<Result> {
  try {
    const session = await requireApiUser();
    const result = await deleteBankQuestion(session, questionId);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/appadmin/bank/${topicId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
