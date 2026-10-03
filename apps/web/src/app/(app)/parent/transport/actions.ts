"use server";

import { revalidatePath } from "next/cache";
import { transportAlertsSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { setNearAlerts } from "@/lib/transport";

/** A guardian's "tell me when the bus is near" for one child, from /parent/transport: the same call as POST /api/v1/family/transport/alerts. */
export async function nearAlertsAction(input: { childId: string; nearAlerts: boolean }): Promise<{ ok: boolean; error?: string }> {
  const t = await getT();
  try {
    const ctx = await requireApiUser();
    const parsed = transportAlertsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t("common.checkTheForm") };
    await setNearAlerts(ctx, parsed.data.childId, parsed.data.nearAlerts);
    revalidatePath("/parent/transport");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[nearAlertsAction]", error);
    return { ok: false, error: t("common.tryAgain") };
  }
}
