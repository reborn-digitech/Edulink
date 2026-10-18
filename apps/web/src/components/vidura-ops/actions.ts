"use server";

import { revalidatePath } from "next/cache";
import type { ViduraAnswer, ViduraAnswerAct, ViduraAnswerTry, ViduraEvalRequest, ViduraEvals } from "@edulink/contracts";
import { viduraAnswerActSchema, viduraAnswerTrySchema, viduraEvalRequestSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { actOnStandardAnswer, tryStandardAnswer } from "@/lib/assistant/standard";
import { panelEvals, panelStartEval, panelStopEval } from "@/lib/eval-jobs-desk";
import { EvalRefusal } from "@/lib/eval-jobs";

/**
 * The operator's presses on Vidura's desks (pass 3, 18 Oct 2026): ask as a role, mark, revoke and discard a standard
 * answer; start, stop and read an evaluation run. Each re-reads the session and the library asserts the operator; a
 * server action is reachable by anybody who can POST.
 */
type Failure = { ok: false; error: string };

async function failure(error: unknown): Promise<Failure> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  if (error instanceof EvalRefusal) return { ok: false, error: t(error.errorKey) };
  console.error("[vidura-ops]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}

export async function tryAnswerAction(input: ViduraAnswerTry): Promise<{ ok: true; answer: ViduraAnswer } | Failure> {
  try {
    const session = await requireApiUser();
    const parsed = viduraAnswerTrySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())("viduraOps.tryInvalid") };
    const answer = await tryStandardAnswer(session, parsed.data);
    revalidatePath("/root/vidura-answers");
    return { ok: true, answer };
  } catch (error) {
    return failure(error);
  }
}

export async function actAnswerAction(answerId: string, action: ViduraAnswerAct["action"]): Promise<{ ok: true } | Failure> {
  try {
    const session = await requireApiUser();
    await actOnStandardAnswer(session, answerId, viduraAnswerActSchema.parse({ action }));
    revalidatePath("/root/vidura-answers");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function evalsStateAction(): Promise<{ ok: true; state: ViduraEvals } | Failure> {
  try {
    return { ok: true, state: await panelEvals(await requireApiUser()) };
  } catch (error) {
    return failure(error);
  }
}

export async function startEvalAction(request: ViduraEvalRequest): Promise<{ ok: true; state: ViduraEvals } | Failure> {
  try {
    const session = await requireApiUser();
    const parsed = viduraEvalRequestSchema.safeParse(request);
    if (!parsed.success) return { ok: false, error: (await getT())("viduraOps.evalPickSet") };
    await panelStartEval(session, parsed.data);
    return { ok: true, state: await panelEvals(session) };
  } catch (error) {
    return failure(error);
  }
}

export async function stopEvalAction(jobId: string): Promise<{ ok: true; state: ViduraEvals } | Failure> {
  try {
    const session = await requireApiUser();
    await panelStopEval(session, jobId);
    return { ok: true, state: await panelEvals(session) };
  } catch (error) {
    return failure(error);
  }
}
