"use server";

import { revalidatePath } from "next/cache";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { beginEnrolment, confirmEnrolment, disable } from "@/lib/two-factor";

export type StartResult = { ok: boolean; error?: string; secret?: string; uri?: string };
export type ConfirmResult = { ok: boolean; error?: string; recoveryCodes?: string[] };
export type PlainResult = { ok: boolean; error?: string };

function failed(error: unknown): PlainResult {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[two-factor]", error);
  return { ok: false, error: "Something went wrong." };
}

export async function start(): Promise<StartResult> {
  try {
    const { secret, uri } = await beginEnrolment(await requireApiUser());
    return { ok: true, secret, uri };
  } catch (error) {
    return failed(error);
  }
}

/**
 * Confirms and returns the recovery codes.
 *
 * This is the ONE moment they exist in plaintext anywhere. Only hashes are
 * stored, so a caller that drops this response has to start enrolment again —
 * which is why the page shows them before it offers a way to continue.
 */
export async function confirm(code: string): Promise<ConfirmResult> {
  try {
    const { recoveryCodes } = await confirmEnrolment(await requireApiUser(), code);
    revalidatePath("/account");
    return { ok: true, recoveryCodes };
  } catch (error) {
    return failed(error);
  }
}

export async function turnOff(password: string): Promise<PlainResult> {
  try {
    await disable(await requireApiUser(), password);
    revalidatePath("/account");
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}
