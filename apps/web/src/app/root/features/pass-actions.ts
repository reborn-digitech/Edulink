"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { refundPassOrder } from "@/lib/pass-orders";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { assertSuperuser } from "@/lib/superuser";

/**
 * plans-pay (17 Oct 2026): the operator's refund of a pass from /root/features. Re-reads the session and re-asserts
 * the flag, as every operator action does; the library refuses anybody but the operator, refunds in full within
 * seven days of payment, revokes the pass's entitlements and audits it.
 */
type Result = { ok: true; message: string } | { ok: false; error: string };

export async function refundPassAction(id: string): Promise<Result> {
  const t = await getT();
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await refundPassOrder(session, id);
    revalidatePath("/root/features");
    if (!result.ok) return { ok: false, error: t(result.errorKey, result.vars) };
    return { ok: true, message: t("passes.refundDone") };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[root/features pass refund]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}
