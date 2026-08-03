"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, requireApiUser, AccessError } from "@/lib/tenancy";
import { bookSlot, cancelBooking, postMessage, inviteExpert } from "@/lib/experts";

type Result = { ok: boolean; error?: string };

async function run<T>(work: () => Promise<T>): Promise<(Result & { data?: T })> {
  try {
    const data = await work();
    revalidatePath("/experts");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[experts]", error);
    return { ok: false, error: "Something went wrong." };
  }
}

export async function book(slotId: string, topic: string) {
  return run(async () => bookSlot(await requireApiRole("ADMIN", "TEACHER"), slotId, topic));
}

/** Either side may cancel, so this takes any signed-in user and checks inside. */
export async function cancel(bookingId: string) {
  return run(async () => cancelBooking(await requireApiUser(), bookingId));
}

/** Shared by the school view and the expert view — the lib decides who may. */
export async function send(bookingId: string, body: string) {
  return run(async () => postMessage(await requireApiUser(), bookingId, body));
}

export async function invite(email: string, name: string) {
  return run(async () => inviteExpert(await requireApiRole("ADMIN", "TEACHER"), { email, name }));
}
