"use server";

import type { TranslationKey } from "@/lib/i18n/dictionary";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { dismissReports, removeContent } from "@/lib/safety";

/**
 * ⚠ `errorKey` AND `error`, and the split is honest rather than untidy.
 *
 * `errorKey` is everything this file decides itself, returned as a key so the
 * form resolves it in the reader's language. `error` is the one case it cannot:
 * an `AccessError` from the tenancy layer, whose message is minted app-wide.
 */
export type SafetyResult = { ok: boolean; error?: string;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
};

export async function takeDown(input: {
  targetType: "POST" | "COMMENT";
  targetId: string;
  note: string;
}): Promise<SafetyResult> {
  const session = await getSession();
  if (!session) return { ok: false, errorKey: "common.logInAgain" };

  try {
    await removeContent(session, input);
    revalidatePath("/admin/safety");
    revalidatePath("/bulletin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[takeDown]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

export async function dismiss(input: {
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
  note: string;
}): Promise<SafetyResult> {
  const session = await getSession();
  if (!session) return { ok: false, errorKey: "common.logInAgain" };

  try {
    await dismissReports(session, input);
    revalidatePath("/admin/safety");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[dismiss]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}
