"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { remindNow } from "@/lib/fees-reports";
import { failure, type ActionResult } from "../action-result";

/** Everyone overdue hears now, whatever the daily job's buckets say. One notice per pupil. */
export async function remindOverdueAction(): Promise<ActionResult & { families?: number; demands?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await remindNow(ctx);
    revalidatePath("/admin/fees/dues");
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}
