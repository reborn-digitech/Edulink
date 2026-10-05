"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slipAnswerSchema } from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { answerSlip } from "@/lib/permission-slips";

/** A family's yes or no for one child on a permission slip (5 Oct 2026); back to the post with ?ok= or ?error=. */
export async function answerSlipAction(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId") ?? "");
  const back = /^[a-z0-9]{10,40}$/i.test(postId) ? `/bulletin/${postId}` : "/bulletin";
  const t = await getT();
  try {
    const input = slipAnswerSchema.safeParse({ studentMembershipId: String(formData.get("studentMembershipId") ?? ""), answer: String(formData.get("answer") ?? "") });
    if (!input.success) throw new AccessError("common.checkTheForm");
    await answerSlip(await requireApiUser(), postId, input.data);
  } catch (error) {
    if (error instanceof AccessError) redirect(`${back}?error=${encodeURIComponent(t(error.key, error.vars))}`);
    throw error;
  }
  revalidatePath(back);
  redirect(`${back}?ok=${encodeURIComponent(t("collegeDesks.slipSaved"))}`);
}
