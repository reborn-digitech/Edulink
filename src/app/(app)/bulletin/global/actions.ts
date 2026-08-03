"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import {
  publishGlobally,
  unpublishGlobally,
  hideGlobalPost,
  unhideGlobalPost,
} from "@/lib/global-feed";

type Result = { ok: boolean; error?: string };

async function run(work: () => Promise<void>): Promise<Result> {
  try {
    await work();
    revalidatePath("/bulletin/global");
    revalidatePath("/bulletin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[global-feed]", error);
    return { ok: false, error: "Something went wrong. Try again in a moment." };
  }
}

/** Puts one of THIS school's approved posts on the global feed. */
export async function publish(postId: string): Promise<Result> {
  return run(async () => publishGlobally(await requireApiRole("ADMIN"), postId));
}

/** Takes one of THIS school's posts back off it. */
export async function unpublish(postId: string): Promise<Result> {
  return run(async () => unpublishGlobally(await requireApiRole("ADMIN"), postId));
}

/**
 * Hides any global post from THIS school's people.
 *
 * Works on another school's post, and that is deliberate — it is the only
 * moderation lever a school has over content it did not write, and it changes
 * nothing for anybody else.
 */
export async function hide(postId: string, reason?: string): Promise<Result> {
  return run(async () => hideGlobalPost(await requireApiRole("ADMIN"), postId, reason));
}

export async function unhide(postId: string): Promise<Result> {
  return run(async () => unhideGlobalPost(await requireApiRole("ADMIN"), postId));
}
