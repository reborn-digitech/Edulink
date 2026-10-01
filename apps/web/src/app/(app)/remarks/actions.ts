"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { createThread, replyToThread } from "@/lib/remarks";
import { remarkReplySchema, remarkThreadSchema, fieldErrors, type FieldErrors } from "@/lib/validation";

export type RemarkState = { ok: boolean; errors: FieldErrors; threadId?: string };

export async function startThread(input: unknown): Promise<RemarkState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: (await getT())("common.logInAgain") } };

  const parsed = remarkThreadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, await getT()) };

  try {
    const { threadId } = await createThread(session, parsed.data);
    revalidatePath("/remarks");
    return { ok: true, errors: {}, threadId };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, errors: { _form: (await getT())(error.key, error.vars) } };
    console.error("[startThread]", error);
    return { ok: false, errors: { _form: (await getT())("remarks.couldNotSendTryAgain") } };
  }
}

export async function sendReply(input: unknown): Promise<RemarkState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: (await getT())("common.logInAgain") } };

  const parsed = remarkReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, await getT()) };

  try {
    await replyToThread(session, parsed.data);
    revalidatePath(`/remarks/${parsed.data.threadId}`);
    revalidatePath("/remarks");
    return { ok: true, errors: {}, threadId: parsed.data.threadId };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, errors: { _form: (await getT())(error.key, error.vars) } };
    console.error("[sendReply]", error);
    return { ok: false, errors: { _form: (await getT())("remarks.couldNotSendTryAgain") } };
  }
}
