"use server";

import { requireApiRole } from "@/lib/tenancy";
import { sendAbsenceAlert } from "@/lib/attendance-intel";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/** One tap, one family, audited — never a bulk blast. Answers in place (A3-journeys-27): what came of it is a toast, a refusal sits by the button. */
export async function alertGuardiansAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiRole("ADMIN");
      const result = await sendAbsenceAlert(ctx, String(formData.get("studentMembershipId") ?? ""));
      if (result.skipped) return "attendanceIntel.alreadyNotified";
      if (result.notified === 0) return "attendanceIntel.noGuardians";
      return { key: "attendanceIntel.notified", vars: { n: result.notified } };
    },
    { revalidate: ["/admin/attendance"] },
  );
}
