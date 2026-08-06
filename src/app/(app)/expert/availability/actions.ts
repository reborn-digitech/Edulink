"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { addSlot, removeSlot } from "@/lib/experts";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * ⚠ `errorKey` AND `error`, and the split is honest rather than untidy — the
 * same shape `admin/classes/actions.ts` settled on. What this file decides
 * itself travels as a key and is resolved in the reader's language; an
 * `AccessError` message is minted app-wide and is still English, so it travels
 * as a string and `actionError` picks whichever arrived.
 */
type Result = { ok: boolean; errorKey?: TranslationKey; error?: string };

async function run(work: () => Promise<void>): Promise<Result> {
  try {
    await work();
    revalidatePath("/expert/availability");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[expert-availability]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

export async function offer(startsAt: string, endsAt: string, note: string): Promise<Result> {
  return run(async () =>
    addSlot(await requireApiUser(), {
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      note,
    }),
  );
}

export async function withdraw(slotId: string): Promise<Result> {
  return run(async () => removeSlot(await requireApiUser(), slotId));
}
