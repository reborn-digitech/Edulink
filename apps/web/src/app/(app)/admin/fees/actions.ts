"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { carryForward } from "@/lib/fees-reports";
import { failure, type ActionResult } from "./action-result";

/**
 * The fees overview's one write: the year-end carry-forward. Every action
 * under /admin/fees re-reads the role and the school from the SESSION and
 * never from the form (§6); the libraries refuse anything but the office.
 */
export async function carryForwardAction(input: { fromYearId: string; toYearId: string }): Promise<ActionResult & { pupils?: number; carriedPaise?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const result = await carryForward(ctx, input);
    revalidatePath("/admin/fees");
    revalidatePath("/admin/fees/dues");
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}
