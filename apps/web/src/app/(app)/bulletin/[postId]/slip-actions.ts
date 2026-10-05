"use server";

import { slipAnswerSchema } from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { answerSlip, assertSlipAnswerRole } from "@/lib/permission-slips";
import { NOTICE_WRITE_BUDGET } from "@/lib/api-v1";
import { consume, retryHintKey } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * A family's yes or no for one child on a permission slip (5 Oct 2026; R-1,
 * risks batch): the same library call as the consent door
 * (POST /api/v1/shared/bulletin/{postId}/consent), answering in place — a
 * done is a toast and the post shows the answer and who gave it, a refusal
 * (another family's child, a closed slip) sits by the buttons.
 */
export async function answerSlipAction(previous: FormState, formData: FormData): Promise<FormState> {
  const postId = String(formData.get("postId") ?? "");
  const back = /^[a-z0-9]{10,40}$/i.test(postId) ? `/bulletin/${postId}` : "/bulletin";
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiUser();
      assertSlipAnswerRole(ctx);
      // The door's budget, on the same bucket, so the web is no way around it (A3-S-9).
      const gate = await consume(`slip-answer:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
      if (!gate.allowed) {
        const h = retryHintKey(gate.retryAfterSeconds);
        throw new AccessError("refusal.tooManyRequests", "FORBIDDEN", { hint: (await getT())(h.key, h.vars) });
      }
      const input = slipAnswerSchema.parse({ studentMembershipId: String(formData.get("studentMembershipId") ?? ""), answer: String(formData.get("answer") ?? "") });
      await answerSlip(ctx, postId, input);
      return "collegeDesks.slipSaved";
    },
    { revalidate: [back, "/parent"] },
  );
}
