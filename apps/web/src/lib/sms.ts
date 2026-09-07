import "server-only";
import { db } from "./db";
import { formatPhone } from "./phone";
import { readTwilioConfig } from "./env";

/**
 * SMS transport.
 *
 * DELIBERATELY THE SAME SHAPE AS `email.ts`: "devbox" persists the message and
 * renders it at /dev/mailbox alongside the emails — not a stub standing in for
 * work not done, but what makes the whole password-reset flow exercisable end
 * to end with no provider account — and "twilio" hands it to a real carrier.
 * The config contract lives in env.ts (`readTwilioConfig`) so the boot check
 * and this file cannot disagree, and `npm run sms:test -- +15551234567` proves
 * the wiring before the first person is locked out.
 *
 * NO SDK. Twilio's send is one form-encoded POST with Basic auth; a dependency
 * to build that would be a dependency to keep updated. `fetch` is native.
 *
 * ⚠ INDIA NEEDS A REGISTERED TEMPLATE, AND THIS IS NOT A TWILIO DETAIL. Under
 * TRAI's DLT rules every domestic transactional SMS must match a template
 * registered against the sender's entity ID, and an unregistered body is
 * dropped by the carrier — not by Twilio, which will happily report the
 * message accepted. So a deployment serving Indian numbers registers the two
 * bodies below verbatim (they are deliberately fixed strings with only the
 * code and the minutes varying), points TWILIO_FROM at a Messaging Service
 * configured with that entity, and — this is the part worth writing down —
 * verifies with `npm run sms:test` to a real handset, because the API
 * answering 201 proves Twilio accepted it and nothing more.
 *
 * WIRING A DIFFERENT PROVIDER IS ONE MORE BRANCH. MSG91 and Gupshup are
 * template-first APIs rather than text-first ones, which is a different shape,
 * not a harder one. Still not abstracted behind an interface: with one
 * implementation an interface is a guess about the second.
 *
 * IT FAILS LOUDLY. A transport that cannot send throws rather than returning,
 * for the reason spelled out next door: a password-reset code that is silently
 * dropped looks identical, to the person waiting for it, to one that was never
 * requested — and they will keep asking.
 */

/** How long a provider gets to answer before the person waiting is told. */
const SEND_TIMEOUT_MS = 15_000;

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

  if (transport === "twilio") {
    const read = readTwilioConfig();
    if (!read.ok) {
      throw new Error(
        `SMS_TRANSPORT is "twilio" but the config is incomplete — ${read.problems.map((p) => p.message).join(" ")}`,
      );
    }
    const { accountSid, authToken, from } = read.config;

    // A Messaging Service SID goes in its own field; a number goes in From.
    const body = new URLSearchParams({ To: message.to, Body: message.text });
    if (/^MG/i.test(from)) body.set("MessagingServiceSid", from);
    else body.set("From", from);

    /**
     * The API root, overridable for two real reasons and no invented one:
     * Twilio publishes regional endpoints (api.sydney.au1.twilio.com and
     * friends) for data-residency, and pointing `sms:test` at a local stand-in
     * is how the wiring gets proven before it is aimed at a live account and a
     * real handset. Unset — which is what almost every deployment leaves it —
     * it is the global endpoint.
     */
    const apiBase = process.env.TWILIO_API_BASE?.trim().replace(/\/$/, "") || "https://api.twilio.com";

    /**
     * A CEILING, because `fetch` has none. This runs inside the request a
     * person made by pressing "Send me a code": a provider that accepts the
     * connection and then says nothing would hold that request open until
     * something upstream gives up, and the person watching a spinner learns
     * nothing. Fifteen seconds is far longer than a healthy Twilio call and
     * far shorter than anybody's patience.
     */
    let response: Response;
    try {
      response = await fetch(
        `${apiBase}/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
        {
          method: "POST",
          headers: {
            // Basic auth, built here rather than pulled in: the token must not
            // reach a log, so it is never interpolated into a string that is.
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        },
      );
    } catch (error) {
      /**
       * ⚠ `fetch` REPORTS "fetch failed" AND HIDES THE REASON IN `.cause`.
       * A wrong host, a firewall, an expired certificate and a DNS typo all
       * arrive as that same useless sentence, while the actionable one —
       * "connect ECONNREFUSED 10.0.0.5:443" — sits one level down. The SMTP
       * transport next door reports the real thing because nodemailer does
       * not wrap; this makes the two match. Found by pointing `sms:test` at a
       * closed port and reading what it said.
       */
      const cause = (error as { cause?: { message?: string; code?: string } }).cause;
      const detail = cause?.message ?? (error instanceof Error ? error.message : String(error));
      const timedOut = (error as { name?: string }).name === "TimeoutError";
      throw new Error(
        timedOut
          ? `Twilio did not answer within ${SEND_TIMEOUT_MS / 1000}s (${apiBase})`
          : `Could not reach Twilio at ${apiBase}: ${detail}`,
      );
    }

    if (!response.ok) {
      // Twilio's own message is the useful part — "The 'To' number is not a
      // valid phone number" beats "request failed". The body is small and
      // carries no secret; the token is in the header, which is not read back.
      const detail = await response.text().catch(() => "");
      let reason = detail.slice(0, 300);
      try {
        const parsed = JSON.parse(detail) as { message?: string; code?: number };
        if (parsed.message) reason = `${parsed.message}${parsed.code ? ` (code ${parsed.code})` : ""}`;
      } catch {
        /* not JSON: the raw prefix above is what there is */
      }
      throw new Error(`Twilio refused the message: HTTP ${response.status} — ${reason}`);
    }
    return;
  }

  throw new Error(
    `SMS_TRANSPORT="${transport}" is not implemented. Use "devbox" or "twilio" (see src/lib/sms.ts).`,
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

/** Confirming that somebody holds the number they just typed. */
export async function sendPhoneCode(to: string, code: string, minutes: number): Promise<void> {
  await sendSms({
    to,
    text: `${code} is your EduLink code to confirm this mobile number. It expires in ${minutes} minutes. If you did not add your number to EduLink, ignore this message — nothing will happen.`,
    purpose: "PHONE_VERIFY",
  });
}
