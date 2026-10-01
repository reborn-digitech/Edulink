"use server";

import { revalidatePath } from "next/cache";
import { coverDeclineSchema } from "@edulink/contracts";
import { z } from "zod";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { acknowledgeCover, declineCover } from "@/lib/substitutions";

/**
 * The covering teacher's two answers, as the home page's card calls them.
 * Who may answer is settled in src/lib/substitutions.ts (the person named
 * on the cover); this file checks the shape and turns a refusal into a key.
 */
export type CoverActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/);

function failure(error: unknown): CoverActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[covers]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

export async function acknowledgeCoverAction(input: { coverId: string }): Promise<CoverActionResult> {
  try {
    const ctx = await requireApiUser();
    const id = cuid.safeParse(input.coverId);
    if (!id.success) return { ok: false, errorKey: "common.checkTheForm" };
    await acknowledgeCover(ctx, id.data);
    revalidatePath("/teacher");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function declineCoverAction(input: { coverId: string; reason: string }): Promise<CoverActionResult> {
  try {
    const ctx = await requireApiUser();
    const id = cuid.safeParse(input.coverId);
    const body = coverDeclineSchema.safeParse({ reason: input.reason });
    if (!id.success || !body.success) return { ok: false, errorKey: "common.checkTheForm" };
    await declineCover(ctx, id.data, body.data.reason);
    revalidatePath("/teacher");
    revalidatePath("/admin/substitutions");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
