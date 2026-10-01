import "server-only";
import { createTransport, type Transporter } from "nodemailer";
import { db } from "./db";
import { readSmtpConfig } from "./env";

/**
 * Email transport.
 *
 * TWO TRANSPORTS, ONE CONTRACT. "devbox" persists messages and renders them at
 * /dev/mailbox — a deliberate choice, not a stub: it makes every magic-link,
 * invite and verification flow fully exercisable end to end with no
 * credentials. "smtp" hands the same messages to a real mail server through
 * nodemailer — SES, Postmark, a school district's own relay; SMTP is the one
 * door they all have. The config contract lives in env.ts (`readSmtpConfig`)
 * so the boot check and this file can never disagree about what "configured"
 * means, and `npm run email:test -- you@example.com` proves the wiring
 * through whichever transport is set before a single person registers.
 */

type Message = {
  to: string;
  subject: string;
  text: string;
  html: string;
  purpose?: string;
};

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * One transporter per process, built on first send. Nodemailer pools the
 * connection; rebuilding it per message would renegotiate TLS for every
 * digest. Config errors throw HERE, listing every missing variable at once —
 * one failed deploy that names all three beats three that name one each.
 */
let smtpTransporter: Transporter | null = null;
let smtpFrom: string | null = null;

function smtp(): { transporter: Transporter; from: string } {
  if (smtpTransporter && smtpFrom) return { transporter: smtpTransporter, from: smtpFrom };
  const read = readSmtpConfig();
  if (!read.ok) {
    throw new Error(
      `EMAIL_TRANSPORT is "smtp" but the config is incomplete — ${read.problems
        .map((p) => p.message)
        .join(" ")}`,
    );
  }
  const { host, port, secure, auth, from } = read.config;
  smtpTransporter = createTransport({ host, port, secure, auth: auth ?? undefined });
  smtpFrom = from;
  return { transporter: smtpTransporter, from };
}

export async function sendEmail(message: Message): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? "devbox";

  if (transport === "devbox") {
    await db.outboundEmail.create({ data: { ...message, purpose: message.purpose ?? null } });
    if (process.env.NODE_ENV === "development") {
      console.info(`[mail] "${message.subject}" -> ${message.to}  (read at ${APP}/dev/mailbox)`);
    }
    return;
  }

  if (transport === "smtp") {
    const { transporter, from } = smtp();
    // Errors propagate: a magic link that was not sent must not report sent.
    await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return;
  }

  // Fails loudly rather than silently dropping a password-reset email.
  throw new Error(
    `EMAIL_TRANSPORT="${transport}" is not implemented. Use "devbox" or "smtp" (see src/lib/email.ts).`,
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
        <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px">Shalaghar</div>
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
    subject: "Your Shalaghar sign-in link",
    text: `Sign in to Shalaghar: ${url}\n\nThis link expires in ${minutes} minutes and can only be used once.`,
    html: layout(
      "Here is your sign-in link",
      `<p>Tap the button below to sign in. The link expires in <strong>${minutes} minutes</strong> and works once.</p>`,
      { label: "Sign in to Shalaghar", url },
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
    subject: `${code} is your Shalaghar code`,
    text:
      `${code} is your code to set a new Shalaghar password.\n\n` +
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
    text: `Confirm your email to finish setting up ${schoolName} on Shalaghar: ${url}`,
    html: layout(
      `Confirm your email for ${schoolName}`,
      `<p>One tap and your school is ready to set up.</p>`,
      { label: "Confirm my email", url },
    ),
  });
}

/**
 * A code confirming an address somebody just typed into their own settings.
 *
 * A CODE RATHER THAN A LINK, for a different reason than the reset above. This
 * is confirmed by somebody who is ALREADY SIGNED IN, on the device in front of
 * them, with the form open and waiting. A link is a promise that whatever opens
 * it is the same session — and the address being confirmed is usually a new one,
 * on a phone, in a mail app that opens its own browser. They would land signed
 * out, on a page that cannot tell them apart from anyone else holding the link.
 * Six digits typed back into the open form has none of that failure mode.
 *
 * It also keeps ONE SHAPE for "prove you hold this contact" across the two
 * things an account can be reached at, which is what `MobileForm` and
 * `EmailForm` being the same two steps is worth.
 */
export async function sendEmailChangeCode(to: string, code: string, minutes: number) {
  await sendEmail({
    to,
    purpose: "EMAIL_CHANGE",
    subject: `${code} is your Shalaghar code`,
    text:
      `${code} is your code to confirm this email address on Shalaghar.\n\n` +
      `It works once and expires in ${minutes} minutes.\n\n` +
      `If you did not ask for it, ignore this email — nothing will change, and ` +
      `this address has not been added to any account.`,
    html: layout(
      "Confirm this email address",
      `<p>Use this code to confirm this address on your Shalaghar account. It works once and expires in ${minutes} minutes.</p>
       <p style="font-size:30px;font-weight:700;letter-spacing:.18em;margin:24px 0;font-family:ui-monospace,monospace">${escapeHtml(code)}</p>
       <p>If you did not ask for it, ignore this email. Nothing will change, and this address has not been added to any account.</p>`,
    ),
  });
}

/**
 * ⚠ TOLD TO THE ADDRESS BEING LEFT, NOT THE ONE BEING ADDED.
 *
 * This is the part of the feature that matters most, and it is easy to leave
 * out because nobody asks for it. Changing the email on an account changes where
 * a password reset goes — so somebody who has got into an account can point its
 * recovery at themselves, and every future "forgot password" reaches them
 * instead of the owner. Session revocation does not help: the attacker's own
 * session survives it.
 *
 * The one thing that does help is the previous address finding out while it is
 * still the one on record everywhere else. So this goes out AFTER the change,
 * unconditionally, and says what happened plainly enough to act on.
 *
 * Not sent when the old address was a pupil's `@edulink.local` handle — see
 * `isDeliverableEmail`. There is no previous owner to warn, and the domain does
 * not route.
 */
export async function sendEmailChangedNotice(to: string, newEmail: string) {
  await sendEmail({
    to,
    purpose: "EMAIL_CHANGE",
    subject: "The email on your Shalaghar account was changed",
    text:
      `The email address on your Shalaghar account was changed to ${newEmail}.\n\n` +
      `Sign-in and password-reset messages will go there from now on.\n\n` +
      `If you did not do this, contact your school straight away — whoever made ` +
      `the change can now reset the password on this account.`,
    html: layout(
      "Your Shalaghar email was changed",
      `<p>The email address on your Shalaghar account was changed to <strong>${escapeHtml(newEmail)}</strong>.</p>
       <p>Sign-in and password-reset messages will go there from now on.</p>
       <p><strong>If you did not do this</strong>, contact your school straight away — whoever made the change can now reset the password on this account.</p>`,
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
    subject: `${inviterName} invited you to ${schoolName} on Shalaghar`,
    text: `${inviterName} invited you to join ${schoolName} on Shalaghar.\n\nAccept: ${url}`,
    html: layout(
      `You are invited to ${schoolName}`,
      `<p><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(schoolName)}</strong> on Shalaghar as a teacher.</p>
       <p>Accepting takes about a minute: set a password, add your subjects, and your classes are waiting.</p>`,
      { label: "Accept invitation", url },
    ),
  });
}

/**
 * The expert invitation. It existed as a copyable link long before it was an
 * email — the invite form collected an address and quietly never used it,
 * which the three-school simulation flagged as a promise the control never
 * kept. The link stays copyable on screen; when an address was given, this
 * now travels too.
 */
export async function sendExpertInvite(
  to: string,
  url: string,
  inviterLine: string,
) {
  await sendEmail({
    to,
    purpose: "INVITE",
    subject: `You are invited to Shalaghar as an expert`,
    text: `${inviterLine}\n\nAccept: ${url}\n\nYour profile is reviewed before any school can see or book you.`,
    html: layout(
      `You are invited as an expert`,
      `<p>${escapeHtml(inviterLine)}</p>
       <p>Accepting takes a minute: say what you do, set a password, and the platform team reviews your profile before any school can see or book you.</p>`,
      { label: "Accept invitation", url },
    ),
  });
}

/**
 * The operator's health digest — sent ONLY when something needs a person.
 * English like every transactional email here, and like the crontab whose
 * jobs it reports on.
 */
export async function sendHealthDigestEmail(to: string, subject: string, text: string, bodyHtml: string) {
  await sendEmail({
    to,
    purpose: "HEALTH",
    subject,
    text,
    html: layout("The platform needs a person", bodyHtml, {
      label: "Open the jobs page",
      url: `${APP}/root/jobs`,
    }),
  });
}

/**
 * The office linking a family, rather than the family claiming a child. The
 * sentence names the child and the school because the recipient may never
 * have heard of Shalaghar — the school is the thing they trust.
 */
export async function sendParentLinkInvite(
  to: string,
  url: string,
  childName: string,
  schoolName: string,
  inviterName: string,
) {
  await sendEmail({
    to,
    purpose: "INVITE",
    subject: `${schoolName} has linked you to ${childName} on Shalaghar`,
    text: `${inviterName} at ${schoolName} has linked you to ${childName} on Shalaghar, so you can see their attendance, homework and marks.\n\nAccept: ${url}`,
    html: layout(
      `See ${escapeHtml(childName)}'s day at ${escapeHtml(schoolName)}`,
      `<p><strong>${escapeHtml(inviterName)}</strong> at <strong>${escapeHtml(schoolName)}</strong> has linked you to <strong>${escapeHtml(childName)}</strong> on Shalaghar.</p>
       <p>Accept and you will see their attendance, homework, exam marks and teachers' messages. If you were not expecting this, ignore it — nothing is shared until you accept.</p>`,
      { label: "Accept the link", url },
    ),
  });
}

/**
 * An admission offer. The words arrive already in the family's language
 * (admissions.ts picks them from the dictionary), because the reader of an
 * offer is one known person; this only lays them out. Sent whether or not
 * there is an account behind the address — a walk-in family gets the same
 * sentences with no button, because there is no page of theirs to open.
 */
export async function sendAdmissionOffer(input: { to: string; subject: string; heading: string; lines: string[]; cta: { label: string; path: string } | null }) {
  await sendEmail({
    to: input.to,
    purpose: "ADMISSION",
    subject: input.subject,
    text: `${input.lines.join("\n\n")}${input.cta ? `\n\n${input.cta.label}: ${APP}${input.cta.path}` : ""}`,
    html: layout(
      escapeHtml(input.heading),
      input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n       "),
      input.cta ? { label: input.cta.label, url: `${APP}${input.cta.path}` } : undefined,
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

/**
 * A notice to an expert, who belongs to no school: the operator's answer to
 * their identity papers (src/lib/expert-kyc.ts). An in-app notification is a
 * school's row and an expert's tenant set is empty, so for them the mail is
 * the channel; the words come translated into their own language.
 */
export async function sendExpertNotice(input: { to: string; subject: string; heading: string; lines: string[]; cta: { label: string; path: string } | null }) {
  await sendEmail({
    to: input.to,
    purpose: "EXPERT_KYC",
    subject: input.subject,
    text: `${input.lines.join("\n\n")}${input.cta ? `\n\n${input.cta.label}: ${APP}${input.cta.path}` : ""}`,
    html: layout(
      escapeHtml(input.heading),
      input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n       "),
      input.cta ? { label: input.cta.label, url: `${APP}${input.cta.path}` } : undefined,
    ),
  });
}
