"use server";

import { revalidatePath } from "next/cache";
import { requireApiUser, requireApiRole, AccessError } from "@/lib/tenancy";
import { createMentorship, consentToMentorship, closeMentorship, postMentorMessage, requestMentor, decideMentorRequest } from "@/lib/mentoring";
import { getT } from "@/lib/i18n/server";

type Result = { ok: boolean; error?: string };

async function run(work: () => Promise<unknown>): Promise<Result> {
  try {
    await work();
    revalidatePath("/mentoring");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[mentoring]", error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

export async function pair(expertProfileId: string, studentMembershipId: string, purpose: string) {
  return run(async () =>
    createMentorship(await requireApiRole("ADMIN", "TEACHER"), {
      expertProfileId,
      studentMembershipId,
      purpose,
    }),
  );
}

export async function consent(threadId: string) {
  return run(async () => consentToMentorship(await requireApiUser(), threadId));
}

export async function close(threadId: string) {
  return run(async () => closeMentorship(await requireApiUser(), threadId));
}

export async function say(threadId: string, body: string) {
  return run(async () => postMentorMessage(await requireApiUser(), threadId, body));
}

/**
 * A pupil asking, and a school answering.
 *
 * Both re-read the role from the SESSION rather than trusting anything sent —
 * the ids travel in the request and the libraries re-scope them, which is the
 * assert-don't-accept rule the rest of this codebase runs on.
 */
export async function askForMentor(input: {
  expertProfileId: string;
  purpose: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireApiUser();
    const result = await requestMentor(session, input);
    // The lib mints a KEY; this boundary is where it becomes the reader's words.
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey, result.errorVars) };
    revalidatePath("/mentoring");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[askForMentor]", error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

export async function decideRequest(
  threadId: string,
  decision: { approve: boolean; reason?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireApiUser();
    const result = await decideMentorRequest(session, threadId, decision);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey, result.errorVars) };
    revalidatePath("/mentoring");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[decideRequest]", error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}
