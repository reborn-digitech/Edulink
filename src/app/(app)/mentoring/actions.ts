"use server";

import { revalidatePath } from "next/cache";
import { requireApiUser, requireApiRole, AccessError } from "@/lib/tenancy";
import {
  createMentorship,
  consentToMentorship,
  closeMentorship,
  postMentorMessage,
} from "@/lib/mentoring";

type Result = { ok: boolean; error?: string };

async function run(work: () => Promise<unknown>): Promise<Result> {
  try {
    await work();
    revalidatePath("/mentoring");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[mentoring]", error);
    return { ok: false, error: "Something went wrong." };
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
