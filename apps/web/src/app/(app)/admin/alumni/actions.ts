"use server";

import { revalidatePath } from "next/cache";
import { alumniFeedModeSchema, alumniNoteSendSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { sendAlumniNote, setAlumniFeedMode, setAlumnusMentor, setAlumnusMuted } from "@/lib/alumni";

/** The office's alumni actions (3 Oct 2026); every rule and audit row is the library's (alumni.ts). */
type Result = { ok: boolean; error?: string; count?: number };

async function refusal(error: unknown, where: string): Promise<Result> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error(`[${where}]`, error);
  return { ok: false, error: t("common.tryAgain") };
}

export async function saveFeedModeAction(feedMode: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = alumniFeedModeSchema.safeParse(feedMode);
    if (!parsed.success) return { ok: false, error: (await getT())("common.tryAgain") };
    await setAlumniFeedMode(ctx, parsed.data);
    revalidatePath("/admin/alumni");
    return { ok: true };
  } catch (error) {
    return refusal(error, "saveFeedModeAction");
  }
}

export async function sendNoteAction(input: { batchYear: number | null; title: string; body: string }): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = alumniNoteSendSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())("common.tryAgain") };
    const sent = await sendAlumniNote(ctx, parsed.data);
    revalidatePath("/admin/alumni");
    return { ok: true, count: sent.recipientCount };
  } catch (error) {
    return refusal(error, "sendNoteAction");
  }
}

export async function setMutedAction(membershipId: string, muted: boolean, reason?: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await setAlumnusMuted(ctx, String(membershipId), Boolean(muted), typeof reason === "string" ? reason : undefined);
    revalidatePath("/admin/alumni");
    return { ok: true };
  } catch (error) {
    return refusal(error, "setMutedAction");
  }
}

export async function setMentorAction(membershipId: string, mentor: boolean): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await setAlumnusMentor(ctx, String(membershipId), Boolean(mentor));
    revalidatePath("/admin/alumni");
    return { ok: true };
  } catch (error) {
    return refusal(error, "setMentorAction");
  }
}
