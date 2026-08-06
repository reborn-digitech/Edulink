"use server";

import { resendVerification } from "@/lib/passwords";
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
