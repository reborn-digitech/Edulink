"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import {
  markConversationRead,
  openConversation,
  sendConversationMessage,
} from "@/lib/conversations";
import { conversationMessageSchema, openConversationSchema, fieldErrors, type FieldErrors } from "@/lib/validation";

export type ConversationState = { ok: boolean; errors: FieldErrors; conversationId?: string };

/**
 * Opens (or finds) the room with one person and goes there. A form action,
 * so a "Message" button anywhere in the app is a two-field form and no
 * client code — a profile page, a people picker, a post card.
 */
export async function openConversationAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = openConversationSchema.safeParse({
    schoolId: formData.get("schoolId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) redirect("/remarks/people?error=invalid");

  let conversationId: string;
  try {
    ({ conversationId } = await openConversation(session, parsed.data.schoolId, parsed.data.userId));
  } catch (error) {
    if (error instanceof AccessError) redirect(`/remarks/people?error=${encodeURIComponent(error.key)}`);
    throw error;
  }
  revalidatePath("/remarks");
  redirect(`/remarks/c/${conversationId}`);
}

export async function sendConversationReply(input: unknown): Promise<ConversationState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: (await getT())("common.logInAgain") } };

  const parsed = conversationMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, await getT()) };

  try {
    await sendConversationMessage(session, parsed.data.conversationId, parsed.data.body);
    revalidatePath(`/remarks/c/${parsed.data.conversationId}`);
    revalidatePath("/remarks");
    return { ok: true, errors: {}, conversationId: parsed.data.conversationId };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, errors: { _form: (await getT())(error.key, error.vars) } };
    console.error("[sendConversationReply]", error);
    return { ok: false, errors: { _form: (await getT())("remarks.couldNotSendTryAgain") } };
  }
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  try {
    await markConversationRead(session, conversationId);
    revalidatePath("/remarks");
  } catch (error) {
    if (!(error instanceof AccessError)) console.error("[markConversationRead]", error);
  }
}
