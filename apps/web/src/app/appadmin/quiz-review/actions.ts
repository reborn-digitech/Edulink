"use server";

import { revalidatePath } from "next/cache";
import type { ModelServer, ModelServerStatus, QuizGenRequest, QuizJobsState, QuizReviewEditBody, QuizReviewItem, QuizReviewNext, QuizReviewQuery, QuizTakeDownReason } from "@edulink/contracts";
import { quizGenRequestSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { editItem, getItem, nextItem, putBackItem, takeDownItem } from "@/lib/quiz-review";
import { deskJobs, deskStartJob, deskStartServer, deskStopJob, deskStopServer } from "@/lib/quiz-jobs-desk";
import { JobRefusal } from "@/lib/quiz-jobs";

/**
 * The bank desk's presses (/appadmin/quiz-review and /root/quiz-review): the item's Edit, Take down,
 * Put back and Skip, and the generation card's Start, Stop and the model servers' own Start and Stop.
 * Every one re-reads the session and the library asserts the content team's gate (the operator passes
 * it too); a server action is reachable by anybody who can POST. Take down moves on to the next item
 * under the same filters; Edit and Put back answer the item as it now stands.
 */

type Failure = { ok: false; error: string };
type Moved = { ok: true; next: QuizReviewNext } | Failure;
type Refreshed = { ok: true; item: QuizReviewItem } | Failure;
type Jobs = { ok: true; state: QuizJobsState } | Failure;
type Servers = { ok: true; servers: ModelServerStatus[] } | Failure;

async function failure(error: unknown): Promise<Failure> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  if (error instanceof JobRefusal) return { ok: false, error: t(error.errorKey) };
  console.error("[quiz-review]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}

function touched() {
  // "layout": the desk and its chapter pages under it (bank-desk, 20 Oct 2026).
  revalidatePath("/appadmin/quiz-review", "layout");
  revalidatePath("/root/quiz-review", "layout");
}

export async function nextItemAction(query: QuizReviewQuery): Promise<Moved> {
  try {
    const session = await requireApiUser();
    return { ok: true, next: await nextItem(session, query) };
  } catch (error) {
    return failure(error);
  }
}

export async function editAction(questionId: string, input: QuizReviewEditBody): Promise<Refreshed> {
  try {
    const session = await requireApiUser();
    const result = await editItem(session, questionId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, item: await getItem(session, questionId) };
  } catch (error) {
    return failure(error);
  }
}

export async function takeDownAction(questionId: string, reason: QuizTakeDownReason, query: QuizReviewQuery): Promise<Moved> {
  try {
    const session = await requireApiUser();
    const result = await takeDownItem(session, questionId, reason);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, next: await nextItem(session, query) };
  } catch (error) {
    return failure(error);
  }
}

export async function putBackAction(questionId: string): Promise<Refreshed> {
  try {
    const session = await requireApiUser();
    const result = await putBackItem(session, questionId);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, item: await getItem(session, questionId) };
  } catch (error) {
    return failure(error);
  }
}

/* ---- a chapter's page (bank-desk, 20 Oct 2026): one item read in full for its Edit, and Take down in place ---- */

export async function itemAction(questionId: string): Promise<Refreshed> {
  try {
    const session = await requireApiUser();
    return { ok: true, item: await getItem(session, questionId) };
  } catch (error) {
    return failure(error);
  }
}

export async function takeDownHereAction(questionId: string, reason: QuizTakeDownReason): Promise<Refreshed> {
  try {
    const session = await requireApiUser();
    const result = await takeDownItem(session, questionId, reason);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    touched();
    return { ok: true, item: await getItem(session, questionId) };
  } catch (error) {
    return failure(error);
  }
}

/* ---- the generation card ---------------------------------------------------------------------------- */

export async function jobsStateAction(): Promise<Jobs> {
  try {
    const session = await requireApiUser();
    return { ok: true, state: await deskJobs(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function startJobAction(request: QuizGenRequest): Promise<Jobs> {
  try {
    const session = await requireApiUser();
    const parsed = quizGenRequestSchema.safeParse(request);
    if (!parsed.success) return { ok: false, error: (await getT())("quizJobs.needBoard") };
    await deskStartJob(session, parsed.data);
    return { ok: true, state: await deskJobs(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function stopJobAction(jobId: string): Promise<Jobs> {
  try {
    const session = await requireApiUser();
    await deskStopJob(session, jobId);
    return { ok: true, state: await deskJobs(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function serverAction(server: ModelServer, start: boolean): Promise<Servers> {
  try {
    const session = await requireApiUser();
    return { ok: true, servers: start ? await deskStartServer(session, server) : await deskStopServer(session, server) };
  } catch (error) {
    return failure(error);
  }
}
