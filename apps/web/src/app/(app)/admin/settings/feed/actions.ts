"use server";

import { revalidatePath } from "next/cache";
import { GLOBAL_FEED_KIND_CHOICES, type GlobalFeedKindChoice } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setGlobalFeedKinds } from "@/lib/college-profile";

/** The global feed's kind filter from /admin/settings/feed: the admin's alone, audited by setGlobalFeedKinds. */
export async function saveFeedKinds(choice: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    if (!(GLOBAL_FEED_KIND_CHOICES as readonly string[]).includes(choice)) return { ok: false, error: (await getT())("common.tryAgain") };
    await setGlobalFeedKinds(ctx, choice as GlobalFeedKindChoice);
    revalidatePath("/admin/settings/feed");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[saveFeedKinds]", error);
    return { ok: false, error: (await getT())("common.tryAgain") };
  }
}
