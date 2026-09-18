"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { createBroadcast, previewBroadcast, resendBroadcastFailures, saveMessagingSettings, sendTestMessage, type Audience, type AudiencePreview, type SendOutcome } from "@/lib/messaging";
import type { MessageEvent } from "@/lib/message-templates";
import { failure, type ActionResult } from "./action-result";

function refresh(broadcastId?: string) {
  revalidatePath("/admin/messaging");
  if (broadcastId) revalidatePath(`/admin/messaging/${broadcastId}`);
}

export async function saveMessagingSettingsAction(input: { smsEnabled: boolean; whatsappEnabled: boolean; monthlyCap: number; events: Record<MessageEvent, boolean> }): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await saveMessagingSettings(ctx, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The office's own number, past the caps, to prove the wiring. */
export async function sendTestAction(): Promise<ActionResult & { outcome?: SendOutcome }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const outcome = await sendTestMessage(ctx);
    refresh();
    return { ok: true, outcome };
  } catch (error) {
    return failure(error);
  }
}

/** Writes nothing: who a notice would reach and on which channel. */
export async function previewBroadcastAction(input: { audience: Audience; body: string }): Promise<ActionResult & { preview?: AudiencePreview }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const preview = await previewBroadcast(ctx, input);
    return { ok: true, preview };
  } catch (error) {
    return failure(error);
  }
}

export async function createBroadcastAction(input: { title: string; body: string; audience: Audience; channels: ("TEXT" | "PUSH")[] }): Promise<ActionResult & { broadcastId?: string; queued?: number; skipped?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await createBroadcast(ctx, input);
    refresh(result.broadcastId);
    return { ok: true, broadcastId: result.broadcastId, queued: result.queued, skipped: result.skipped };
  } catch (error) {
    return failure(error);
  }
}

export async function resendFailuresAction(broadcastId: string): Promise<ActionResult & { requeued?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await resendBroadcastFailures(ctx, broadcastId);
    refresh(broadcastId);
    return { ok: true, requeued: result.requeued };
  } catch (error) {
    return failure(error);
  }
}
