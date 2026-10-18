"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { reviewRendering } from "@/lib/assistant/renderings";

/**
 * The operator's word on one of the guide's Hindi or Marathi renderings (Vidura pass 2). The session is read again
 * and the library asserts the operator: a server action is reachable by anybody who can POST.
 */
export async function reviewRenderingAction(renderingId: string, action: "APPROVE" | "EDIT" | "REJECT", text?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireApiUser();
    await reviewRendering(session, renderingId, { action, ...(action === "EDIT" ? { text } : {}) });
    revalidatePath("/root/vidura-review");
    revalidatePath("/appadmin/vidura-review");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[vidura-review]", error);
    return { ok: false, error: (await getT())("root.didNotWork") };
  }
}
