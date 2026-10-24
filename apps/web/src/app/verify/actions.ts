"use server";

import { redirect } from "next/navigation";
import { resendVerification, verifyEmailByToken } from "@/lib/passwords";
import { getT } from "@/lib/i18n/server";
import { refusalText } from "@/lib/i18n/refusal";

/**
 * A second copy of the link, to the address it already went to.
 *
 * TAKES THE EXPIRED TOKEN, NOT A USER ID. A server action's arguments are client
 * input, so an action handed an id would email whichever account it was given —
 * an unauthenticated mailer aimed by the caller. Holding the token is the proof;
 * the account comes off the server's own record. See `resendVerification`.
 */
export async function resend(token: string): Promise<{ ok: boolean; error?: string }> {
  const result = await resendVerification(token);
  if (result.ok || !result.errorKey) return { ok: result.ok };
  // The lib mints a KEY; this boundary turns it into the reader's words.
  return {
    ok: false,
    error: refusalText(await getT(), {
      errorKey: result.errorKey,
      retryAfterSeconds: result.retryAfterSeconds,
    }),
  };
}

/**
 * The confirm button: the only thing that spends the link (QA-13). A GET of
 * `/verify` shows the button and writes nothing, so a mail scanner or a
 * preview that fetches the link confirms nobody; the person's press posts the
 * token here. A server action is a POST that Next.js accepts only from this
 * site's own pages. Whatever the press found, the page says it: the answer is a
 * redirect back to the same link, marked done, and the page reads the token's
 * state afresh (a spent link then reads as confirmed).
 */
export async function confirmEmail(form: FormData): Promise<never> {
  const raw = form.get("token");
  const token = typeof raw === "string" ? raw.trim() : "";
  if (token) await verifyEmailByToken(token);
  redirect(`/verify?token=${encodeURIComponent(token)}&done=1`);
}
