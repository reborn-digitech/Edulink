"use server";

import { claimCodeRotateSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { rotateClaimCode } from "@/lib/id-card";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * R-52 (risks batch, 5 Oct 2026): the office gives one student a new guardian
 * claim code — the same library call as POST /api/v1/id-cards/claim-code, so
 * the old code claims nothing and the claim still needs the birthdate. The
 * new code is said once, in the toast, for the office to hand to the family;
 * the record's page shows it after the refresh.
 */
export async function rotateClaimCodeAction(previous: FormState, formData: FormData): Promise<FormState> {
  const studentMembershipId = String(formData.get("studentMembershipId") ?? "");
  return answerForm(
    previous,
    formData,
    async () => {
      const input = claimCodeRotateSchema.parse({ studentMembershipId });
      const done = await rotateClaimCode(await requireApiUser(), input.studentMembershipId);
      return { key: "riskDecisions.claimCodeRotated", vars: { code: done.studentCode } };
    },
    { revalidate: [`/admin/records/${encodeURIComponent(studentMembershipId)}`, "/admin/records"] },
  );
}
