"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { sendAbsenceAlert } from "@/lib/attendance-intel";
import { getT } from "@/lib/i18n/server";

/** One tap, one family, audited — never a bulk blast. */
export async function alertGuardiansAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("ADMIN");
  const studentMembershipId = String(formData.get("studentMembershipId") ?? "");
  try {
    const result = await sendAbsenceAlert(ctx, studentMembershipId);
    const t = await getT();
    const note = result.skipped
      ? t("attendanceIntel.alreadyNotified")
      : result.notified === 0
        ? t("attendanceIntel.noGuardians")
        : t("attendanceIntel.notified", { n: result.notified });
    revalidatePath("/admin/attendance");
    redirect(`/admin/attendance?note=${encodeURIComponent(note)}`);
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`/admin/attendance?error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
}
