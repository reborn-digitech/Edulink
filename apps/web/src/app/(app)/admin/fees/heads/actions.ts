"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { saveHead, retireHead } from "@/lib/fees";
import type { FeeHeadKind } from "@/lib/constants";
import { failure, type ActionResult } from "../action-result";

function refresh() {
  revalidatePath("/admin/fees/heads");
  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/structures");
}

export async function saveHeadAction(input: { id?: string; name: string; code: string; kind: FeeHeadKind; sortOrder?: number }): Promise<ActionResult & { id?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const id = await saveHead(ctx, input);
    refresh();
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

export async function retireHeadAction(headId: string, restore: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await retireHead(ctx, headId, restore);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
