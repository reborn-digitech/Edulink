"use server";

import { resendVerification } from "@/lib/passwords";

/**
 * A second copy of the link, to the address it already went to.
 *
 * TAKES THE EXPIRED TOKEN, NOT A USER ID. A server action's arguments are client
 * input, so an action handed an id would email whichever account it was given —
 * an unauthenticated mailer aimed by the caller. Holding the token is the proof;
 * the account comes off the server's own record. See `resendVerification`.
 */
export async function resend(token: string): Promise<{ ok: boolean; error?: string }> {
  return resendVerification(token);
}
