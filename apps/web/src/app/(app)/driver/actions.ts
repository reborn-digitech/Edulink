"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { consentToLocation } from "@/lib/transport";

/** The driver's yes to the location sentence, from /driver: the same library call as POST /api/v1/transport/consent. */
export async function consentAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("DRIVER");
    await consentToLocation(ctx);
    revalidatePath("/driver");
    return { ok: true };
  } catch (error) {
    const t = await getT();
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[consentAction]", error);
    return { ok: false, error: t("common.tryAgain") };
  }
}
