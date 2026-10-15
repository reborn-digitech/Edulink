"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { createPosting, closePosting } from "@/lib/vacancies";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { assertFeatureForAction } from "@/lib/feature-page";

type Result = { ok: boolean; errorKey?: TranslationKey; error?: string; postingId?: string };

async function run<T extends { ok: boolean }>(work: () => Promise<T>): Promise<Result & T> {
  try {
    // The job board (15 Oct 2026): posting and closing wait while the platform has it off.
    await assertFeatureForAction("JOB_BOARD");
    const result = await work();
    revalidatePath("/admin/vacancies");
    revalidatePath("/vacancies");
    return result as Result & T;
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) } as Result & T;
    console.error("[admin/vacancies]", error);
    return { ok: false, errorKey: "common.somethingWrong" } as Result & T;
  }
}

export async function post(input: {
  title: string;
  body: string;
  subjects: string[];
  employmentType: string;
  hiringContactMembershipId: string;
}) {
  return run(async () => {
    const ctx = await requireApiRole("ADMIN");
    const result = await createPosting(ctx, input);
    return result.ok ? { ok: true as const, postingId: result.postingId } : result;
  });
}

export async function close(postingId: string) {
  return run(async () => closePosting(await requireApiRole("ADMIN"), postingId));
}
