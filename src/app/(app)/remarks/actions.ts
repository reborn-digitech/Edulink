"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { createThread, replyToThread, markThreadRead } from "@/lib/remarks";
import { remarkReplySchema, remarkThreadSchema, fieldErrors, type FieldErrors } from "@/lib/validation";

export type RemarkState = { ok: boolean; errors: FieldErrors; threadId?: string };

export async function startThread(input: unknown): Promise<RemarkState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: "Please log in again." } };

  const parsed = remarkThreadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    const { threadId } = await createThread(session, parsed.data);
    revalidatePath("/remarks");
    return { ok: true, errors: {}, threadId };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errors: { _form: error.message } };
    console.error("[startThread]", error);
    return { ok: false, errors: { _form: "We could not send that. Please try again." } };
  }
}

export async function sendReply(input: unknown): Promise<RemarkState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: "Please log in again." } };

  const parsed = remarkReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    await replyToThread(session, parsed.data);
    revalidatePath(`/remarks/${parsed.data.threadId}`);
    revalidatePath("/remarks");
    return { ok: true, errors: {}, threadId: parsed.data.threadId };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errors: { _form: error.message } };
    console.error("[sendReply]", error);
    return { ok: false, errors: { _form: "We could not send that. Please try again." } };
  }
}

export async function markRead(threadId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  try {
    await markThreadRead(session, threadId);
    revalidatePath("/remarks");
  } catch (error) {
    // A read receipt failing must never break opening a thread.
    if (!(error instanceof AccessError)) console.error("[markRead]", error);
  }
}
