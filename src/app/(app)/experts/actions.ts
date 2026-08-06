"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, requireApiUser, AccessError } from "@/lib/tenancy";
import { bookSlot, cancelBooking, postMessage, inviteExpert } from "@/lib/experts";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** See the note in `expert/availability/actions.ts` on the two-field shape. */
type Result = { ok: boolean; errorKey?: TranslationKey; error?: string };

async function run<T>(work: () => Promise<T>): Promise<(Result & { data?: T })> {
  try {
    const data = await work();
    revalidatePath("/experts");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[experts]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

export async function book(slotId: string, topic: string) {
  return run(async () => bookSlot(await requireApiRole("ADMIN", "TEACHER"), slotId, topic));
}

/**
 * Either side may cancel, so this takes any signed-in user and checks inside.
 *
 * REVALIDATES BOTH LISTS, not just the school's. `run` refreshes `/experts`;
 * the expert's own bookings live at `/expert`, and when the EXPERT is the one
 * cancelling that is the page they are about to walk back to. Missing it means
 * they cancel, press back, and see the booking still sitting there.
 */
export async function cancel(bookingId: string) {
  const result = await run(async () => cancelBooking(await requireApiUser(), bookingId));
  if (result.ok) revalidatePath("/expert");
  return result;
}

/** Shared by the school view and the expert view — the lib decides who may. */
export async function send(bookingId: string, body: string) {
  return run(async () => postMessage(await requireApiUser(), bookingId, body));
}

export async function invite(email: string, name: string) {
  return run(async () => inviteExpert(await requireApiRole("ADMIN", "TEACHER"), { email, name }));
}
