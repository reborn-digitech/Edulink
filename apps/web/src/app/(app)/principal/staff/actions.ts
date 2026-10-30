"use server";

import { requireApiUser } from "@/lib/tenancy";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";
import { setHeadDuty } from "@/lib/duties";

/**
 * THE HEAD GIVES AN ADMIN THE HEAD'S PAGES, or takes them back (owner-batch-item9, 27 Oct 2026): leave approval, the
 * trends, the review rounds and the safety centre. From the head's staff roster, a row of the office's; the rule —
 * the head's alone, an active admin of the school, audited — is `setHeadDuty`'s (lib/duties.ts). Answers in place
 * through <ActionForm>.
 */
export async function headDutyAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiUser();
      const held = String(formData.get("held") ?? "") === "true";
      await setHeadDuty(ctx, String(formData.get("membershipId") ?? ""), held);
      return held ? "headDuty.given" : "headDuty.takenBack";
    },
    { revalidate: ["/principal/staff"] },
  );
}
