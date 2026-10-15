"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { connectPage, disconnectSocial, retrySocialPost } from "@/lib/social";
import { META_PICK_COOKIE, META_PICK_COOKIE_PATH } from "@/lib/social-meta";

/**
 * The school's Facebook Page (meta-posting, 16 Oct 2026): choose the Page after Facebook Login, disconnect it, and
 * retry a failed copy from a post's page. Every rule and the audit rows are the library's (src/lib/social.ts).
 */
type Result = { ok: true } | { ok: false; error: string };

async function refusal(error: unknown, where: string): Promise<Result> {
  const t = await getT();
  if (error instanceof AccessError || error instanceof RuleRefusal) return { ok: false, error: t(error.key, error.vars) };
  console.error(`[${where}]`, error);
  return { ok: false, error: t("common.tryAgain") };
}

export async function choosePageAction(pageId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    if (typeof pageId !== "string" || !/^[0-9A-Za-z_-]{1,64}$/.test(pageId)) return { ok: false, error: (await getT())("social.refusePickExpired") };
    const jar = await cookies();
    await connectPage(ctx, jar.get(META_PICK_COOKIE)?.value, pageId);
    // The user token has done its work; it does not stay in the browser.
    jar.set(META_PICK_COOKIE, "", { httpOnly: true, path: META_PICK_COOKIE_PATH, maxAge: 0 });
    revalidatePath("/admin/settings/social");
    return { ok: true };
  } catch (error) {
    return refusal(error, "choosePageAction");
  }
}

export async function cancelPickAction(): Promise<Result> {
  try {
    await requireApiRole("ADMIN");
    (await cookies()).set(META_PICK_COOKIE, "", { httpOnly: true, path: META_PICK_COOKIE_PATH, maxAge: 0 });
    revalidatePath("/admin/settings/social");
    return { ok: true };
  } catch (error) {
    return refusal(error, "cancelPickAction");
  }
}

export async function disconnectAction(pageId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await disconnectSocial(ctx, String(pageId ?? ""));
    revalidatePath("/admin/settings/social");
    return { ok: true };
  } catch (error) {
    return refusal(error, "disconnectAction");
  }
}

export async function retrySocialAction(socialPostId: string, postId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await retrySocialPost(ctx, String(socialPostId ?? ""));
    revalidatePath(`/bulletin/${encodeURIComponent(String(postId ?? ""))}`);
    return { ok: true };
  } catch (error) {
    return refusal(error, "retrySocialAction");
  }
}
