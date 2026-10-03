"use server";

import { revalidatePath } from "next/cache";
import { schoolModuleSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setModule } from "@/lib/modules";

/** Switch one module on or off from /admin/settings/modules: the admin's alone, audited by setModule. */
export async function switchModule(input: { module: string; on: boolean }): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const which = schoolModuleSchema.safeParse(input?.module);
    if (!which.success || typeof input?.on !== "boolean") return { ok: false, error: (await getT())("common.tryAgain") };
    await setModule(ctx, which.data, input.on);
    revalidatePath("/admin/settings/modules");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[switchModule]", error);
    return { ok: false, error: (await getT())("common.tryAgain") };
  }
}
