"use server";

import { requireApiUser } from "@/lib/tenancy";
import { field, runAction } from "@/lib/module-actions";
import { issueAppointmentLetter } from "@/lib/certificates";

/** The office issues an appointment letter (risks batch 5A, 5 Oct 2026); certificates.ts decides who may. */
export async function issueAppointmentAction(form: FormData): Promise<void> {
  await runAction("/admin/certificates/appointments", async () => {
    await issueAppointmentLetter(await requireApiUser(), { templateId: field(form, "templateId"), staffMembershipId: field(form, "staffMembershipId"), purpose: field(form, "purpose") || undefined, remark: field(form, "remark") || undefined });
    return "appointmentLetters.issued";
  }, ["/admin/certificates/issued"]);
}
