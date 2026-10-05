"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { removeGatewayAccount, saveFeeSettings, saveGatewayAccount } from "@/lib/fees";
import { failure, type ActionResult } from "../action-result";

function refresh() {
  revalidatePath("/admin/fees/settings");
  revalidatePath("/admin/fees");
  revalidatePath("/parent/fees");
}

export async function saveFeeSettingsAction(input: { upiId?: string | null; upiPayee?: string | null; receiptPrefix?: string; bankNote?: string | null; pupilFeeViewAge?: number | null }): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await saveFeeSettings(ctx, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The secrets pass through this action once, to be sealed; the page never sees them again. */
export async function saveGatewayAction(input: { keyId: string; secret: string; webhookSecret: string; mode: "TEST" | "LIVE" }): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await saveGatewayAccount(ctx, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function removeGatewayAction(): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await removeGatewayAccount(ctx);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
