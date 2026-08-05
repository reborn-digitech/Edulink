import "server-only";
import { db } from "./db";
import { formatPhone } from "./phone";

/**
 * SMS transport.
 *
 * DELIBERATELY THE SAME SHAPE AS `email.ts`, including the honest bit: v1 ships
 * the "devbox" transport only, which persists the message and renders it at
 * /dev/mailbox alongside the emails. That is not a stub standing in for work not
 * done — it is what makes the whole password-reset flow exercisable end to end
 * with no provider account, which is the same reason the email transport was
 * built that way.
 *
 * WIRING A REAL PROVIDER IS ONE BRANCH. Twilio, MSG91, Gupshup — implement the
 * `send` for the non-devbox case and nothing else in the app changes. It is
 * deliberately not abstracted further than that: an interface with one
 * implementation is a guess about the second one.
 *
 * IT FAILS LOUDLY. An unimplemented transport throws rather than returning, for
 * the reason spelled out next door: a password-reset code that is silently
 * dropped looks identical, to the person waiting for it, to one that was never
 * requested — and they will keep asking.
 */

type TextMessage = {
  /** E.164. Normalise before calling; this does not guess. */
  to: string;
  text: string;
  purpose?: string;
};

/**
 * A text message is stored in `OutboundEmail` when the transport is devbox.
 *
 * ONE MAILBOX, NOT TWO, and it is worth saying why rather than apologising for
 * it. The dev mailbox exists so a developer can read what the app tried to send;
 * splitting it in two would mean a reset code sent by SMS is missing from the
 * page somebody is staring at, which is exactly the confusion the mailbox exists
 * to remove. The `subject` says which channel it went down, so nothing is
 * ambiguous once it is on the page.
 */
export async function sendSms(message: TextMessage): Promise<void> {
  const transport = process.env.SMS_TRANSPORT ?? "devbox";

  if (transport === "devbox") {
    await db.outboundEmail.create({
      data: {
        to: message.to,
        subject: `SMS to ${formatPhone(message.to)}`,
        text: message.text,
        // Rendered in the same list as the emails, and visibly a text message
        // rather than something that merely failed to have a body.
        html: `<p style="font-family:ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(message.text)}</p>`,
        purpose: message.purpose ?? "SMS",
      },
    });
    if (process.env.NODE_ENV === "development") {
      const app = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      console.info(`[sms] -> ${message.to}  (read at ${app}/dev/mailbox)`);
    }
    return;
  }

  throw new Error(
    `SMS_TRANSPORT="${transport}" is not implemented. Use "devbox", or add the transport in src/lib/sms.ts.`,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The one message this file actually sends today. */
export async function sendResetCode(to: string, code: string, minutes: number): Promise<void> {
  await sendSms({
    to,
    // Short, and the code first: a phone shows the first line in the
    // notification, and somebody holding a laptop wants to read it without
    // unlocking anything.
    text: `${code} is your EduLink code to set a new password. It works once and expires in ${minutes} minutes. If you did not ask for it, ignore this message.`,
    purpose: "PASSWORD_RESET",
  });
}
