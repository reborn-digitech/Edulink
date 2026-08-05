import "server-only";
import { db } from "./db";

/**
 * Email transport.
 *
 * v1 ships the "devbox" transport only: messages are persisted and rendered at
 * /dev/mailbox. That is a deliberate choice, not a stub — it makes every
 * magic-link, invite and verification flow fully exercisable end to end with no
 * SMTP credentials, which is exactly what the self-contained build was chosen
 * for. Swapping in Resend/SES/Postmark means implementing `send` for the "smtp"
 * branch; nothing else in the app changes.
 */

type Message = {
  to: string;
  subject: string;
  text: string;
  html: string;
  purpose?: string;
};

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendEmail(message: Message): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? "devbox";

  if (transport === "devbox") {
    await db.outboundEmail.create({ data: { ...message, purpose: message.purpose ?? null } });
    if (process.env.NODE_ENV === "development") {
      console.info(`[mail] "${message.subject}" -> ${message.to}  (read at ${APP}/dev/mailbox)`);
    }
    return;
  }

  // Fails loudly rather than silently dropping a password-reset email.
  throw new Error(
    `EMAIL_TRANSPORT="${transport}" is not implemented in v1. Use "devbox", or add the transport in src/lib/email.ts.`,
  );
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

function layout(heading: string, bodyHtml: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7fb;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#101420">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:18px;padding:32px;box-shadow:0 1px 3px rgba(16,20,32,.06)">
      <tr><td>
        <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px">EduLink</div>
        <h1 style="font-size:22px;line-height:1.25;margin:16px 0 12px">${escapeHtml(heading)}</h1>
        <div style="font-size:15px;line-height:1.6;color:#57607a">${bodyHtml}</div>
        ${
          cta
            ? `<div style="margin:28px 0 8px"><a href="${escapeAttr(cta.url)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px">${escapeHtml(cta.label)}</a></div>
               <p style="font-size:13px;color:#7b849c;word-break:break-all">Or paste this link:<br>${escapeHtml(cta.url)}</p>`
            : ""
        }
        <hr style="border:none;border-top:1px solid #e0e5ef;margin:28px 0 16px">
        <p style="font-size:12px;color:#7b849c;margin:0">If you were not expecting this email you can safely ignore it. Nothing will change.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Escaping is not optional: school names and children's names go in here. (§6) */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(value: string): string {
  return escapeHtml(value);
}

export async function sendMagicLink(to: string, url: string, minutes: number) {
  await sendEmail({
    to,
    purpose: "MAGIC_LINK",
    subject: "Your EduLink sign-in link",
    text: `Sign in to EduLink: ${url}\n\nThis link expires in ${minutes} minutes and can only be used once.`,
    html: layout(
      "Here is your sign-in link",
      `<p>Tap the button below to sign in. The link expires in <strong>${minutes} minutes</strong> and works once.</p>`,
      { label: "Sign in to EduLink", url },
    ),
  });
}

/**
 * A password-reset code, by email.
 *
 * A CODE RATHER THAN A LINK, and the same six digits the SMS carries. The two
 * channels reach one screen, so a person who has both an address and a number on
 * file does not meet a different flow depending on which message they opened
 * first. A link would be the nicer email on its own; two flows that must stay in
 * step is the worse system.
 */
export async function sendResetCode(to: string, code: string, minutes: number) {
  await sendEmail({
    to,
    subject: `${code} is your EduLink code`,
    text:
      `${code} is your code to set a new EduLink password.\n\n` +
      `It works once and expires in ${minutes} minutes.\n\n` +
      `If you did not ask for it, you can ignore this email — nothing has changed.`,
    html: layout(
      "Set a new password",
      `<p>Use this code to set a new password. It works once and expires in ${minutes} minutes.</p>
       <p style="font-size:30px;font-weight:700;letter-spacing:.18em;margin:24px 0;font-family:ui-monospace,monospace">${escapeHtml(code)}</p>
       <p>If you did not ask for it, ignore this email — nothing has changed, and nobody can use the code without it.</p>`,
    ),
    purpose: "PASSWORD_RESET",
  });
}

export async function sendVerifyEmail(to: string, url: string, schoolName: string) {
  await sendEmail({
    to,
    purpose: "EMAIL_VERIFY",
    subject: `Confirm your email for ${schoolName}`,
    text: `Confirm your email to finish setting up ${schoolName} on EduLink: ${url}`,
    html: layout(
      `Confirm your email for ${schoolName}`,
      `<p>One tap and your school is ready to set up.</p>`,
      { label: "Confirm my email", url },
    ),
  });
}

export async function sendTeacherInvite(
  to: string,
  url: string,
  schoolName: string,
  inviterName: string,
) {
  await sendEmail({
    to,
    purpose: "INVITE",
    subject: `${inviterName} invited you to ${schoolName} on EduLink`,
    text: `${inviterName} invited you to join ${schoolName} on EduLink.\n\nAccept: ${url}`,
    html: layout(
      `You are invited to ${schoolName}`,
      `<p><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(schoolName)}</strong> on EduLink as a teacher.</p>
       <p>Accepting takes about a minute: set a password, add your subjects, and your classes are waiting.</p>`,
      { label: "Accept invitation", url },
    ),
  });
}

export async function sendParentClaimNotice(
  to: string,
  childName: string,
  schoolName: string,
  url: string,
) {
  await sendEmail({
    to,
    purpose: "PARENT_CLAIM",
    subject: `You are now linked to ${childName}`,
    text: `You are linked to ${childName} at ${schoolName}. View their dashboard: ${url}`,
    html: layout(
      `You are linked to ${escapeHtml(childName)}`,
      `<p>You can now see attendance, grades and teacher remarks for <strong>${escapeHtml(childName)}</strong> at <strong>${escapeHtml(schoolName)}</strong>.</p>
       <p>You control what you are notified about, and you can unlink at any time from your settings.</p>`,
      { label: "Open my dashboard", url },
    ),
  });
}
