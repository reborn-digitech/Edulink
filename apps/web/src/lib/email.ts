import "server-only";
import { createTransport, type Transporter } from "nodemailer";
import { db } from "./db";
import { readSmtpConfig } from "./env";
import { readJson } from "./json";
import { translator } from "./i18n/dictionary";
import { normaliseLocale, type Locale } from "./i18n/locales";
import type { en } from "@edulink/i18n/en";

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
  // website-three (17 Oct 2026): a website enquiry's reply answers to the school and keeps one thread in the enquirer's mail.
  replyTo?: string | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[];
  // end website-three
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
    // website-three (17 Oct 2026): the Reply-To and the threading headers kept beside the message, as a real mail carries
    // them — written only for a message that has them, so every other mail keeps the row's old shape.
    const threaded = Boolean(message.replyTo || message.messageId || message.inReplyTo || message.references?.length);
    const headers = { messageId: message.messageId ?? null, inReplyTo: message.inReplyTo ?? null, references: message.references ?? [] };
    await db.outboundEmail.create({
      data: { to: message.to, subject: message.subject, text: message.text, html: message.html, purpose: message.purpose ?? null, ...(threaded ? { replyTo: message.replyTo ?? null, headersJson: JSON.stringify(headers) } : {}) },
    });
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
      // website-three (17 Oct 2026)
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      ...(message.messageId ? { messageId: message.messageId } : {}),
      ...(message.inReplyTo ? { inReplyTo: message.inReplyTo } : {}),
      ...(message.references?.length ? { references: message.references } : {}),
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

/**
 * EVERY EMAIL IS WRITTEN IN ITS READER'S LANGUAGE, the way a text message and a
 * notification already were (messaging.ts, notify.ts). Each sender takes the
 * locale; the caller decides it with one of the two helpers below, and the
 * rule they encode is the one admissions.ts set for the offer letter:
 *
 *  - the recipient's own `prefs.locale` when the address belongs to an account;
 *  - otherwise the SCHOOL'S language (`School.locale`), for the invitation to
 *    somebody who has no account yet. Not the inviter's: the office clerk who
 *    reads the app in English says nothing about the family she invites, while
 *    the school's setting is the one choice made for its whole community.
 *
 * The words are dictionary keys under `email.*` in en, hi and mr; the subject,
 * the plain text and the HTML are built from the same sentences, so the three
 * cannot drift into saying different things.
 */
function localeFromPrefs(prefs: string | null | undefined, fallback?: string | null): Locale {
  const saved = readJson<{ locale?: string }>(prefs ?? null, {}).locale;
  return normaliseLocale(saved ?? fallback ?? null);
}

/** The language of a known person: their saved choice, else the fallback, else English. */
export async function localeForUser(userId: string, fallback?: string | null): Promise<Locale> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { prefs: true } });
  return localeFromPrefs(user?.prefs, fallback);
}

/**
 * The language for an address that may or may not be somebody's yet — an
 * invitation. `User` carries no school policy, so this reads the same under
 * any binding.
 */
export async function localeForAddress(email: string, fallback?: string | null): Promise<Locale> {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { prefs: true } });
  return localeFromPrefs(user?.prefs, fallback);
}

type Vars = Record<string, string | number>;

/** The words of one email in one language: `say` for subjects and plain text, `html` for the body. */
function wordsIn(locale: Locale) {
  const t = translator(locale);
  return {
    say: (key: EmailKey, vars?: Vars) => t(`email.${key}`, vars),
    /**
     * The sentence escaped, then its values escaped and dropped in — bold when
     * named in `strong`. Escaping is not optional: school names and children's
     * names go in here. (§6)
     */
    html: (key: EmailKey, vars: Vars = {}, strong: string[] = []) =>
      escapeHtml(t(`email.${key}`)).replace(/\{(\w+)\}/g, (whole, name: string) => {
        if (!(name in vars)) return whole;
        const value = escapeHtml(String(vars[name]));
        return strong.includes(name) ? `<strong>${value}</strong>` : value;
      }),
  };
}

type EmailKey = keyof (typeof en)["email"];

function layout(locale: Locale, heading: string, bodyHtml: string, cta?: { label: string; url: string }) {
  const { say } = wordsIn(locale);
  return `<!doctype html><html lang="${locale}"><body style="margin:0;padding:24px;background:#f6f7fb;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#101420">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:18px;padding:32px;box-shadow:0 1px 3px rgba(16,20,32,.06)">
      <tr><td>
        <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px">${escapeHtml(say("brand"))}</div>
        <h1 style="font-size:22px;line-height:1.25;margin:16px 0 12px">${escapeHtml(heading)}</h1>
        <div style="font-size:15px;line-height:1.6;color:#57607a">${bodyHtml}</div>
        ${
          cta
            ? `<div style="margin:28px 0 8px"><a href="${escapeAttr(cta.url)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px">${escapeHtml(cta.label)}</a></div>
               <p style="font-size:13px;color:#7b849c;word-break:break-all">${escapeHtml(say("orPaste"))}<br>${escapeHtml(cta.url)}</p>`
            : ""
        }
        <hr style="border:none;border-top:1px solid #e0e5ef;margin:28px 0 16px">
        <p style="font-size:12px;color:#7b849c;margin:0">${escapeHtml(say("footer"))}</p>
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

/** The six digits, large, in the HTML body of a code email. */
function codeBlock(code: string): string {
  return `<p style="font-size:30px;font-weight:700;letter-spacing:.18em;margin:24px 0;font-family:ui-monospace,monospace">${escapeHtml(code)}</p>`;
}

export async function sendMagicLink(to: string, url: string, minutes: number, locale: Locale) {
  const { say, html } = wordsIn(locale);
  await sendEmail({
    to,
    purpose: "MAGIC_LINK",
    subject: say("magicSubject"),
    text: `${say("magicCta")}: ${url}\n\n${say("magicExpires", { minutes })}`,
    html: layout(
      locale,
      say("magicHeading"),
      `<p>${html("magicTap")} ${html("magicExpires", { minutes }, ["minutes"])}</p>`,
      { label: say("magicCta"), url },
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
export async function sendResetCode(to: string, code: string, minutes: number, locale: Locale) {
  const { say, html } = wordsIn(locale);
  await sendEmail({
    to,
    subject: say("codeSubject", { code }),
    text: `${code}\n\n${say("resetLead")} ${say("codeExpiry", { minutes })}\n\n${say("resetIgnore")}`,
    html: layout(
      locale,
      say("resetHeading"),
      `<p>${html("resetLead")} ${html("codeExpiry", { minutes })}</p>
       ${codeBlock(code)}
       <p>${html("resetIgnore")}</p>`,
    ),
    purpose: "PASSWORD_RESET",
  });
}

/** `name` is the school's — or, for a recruiter's account, the company's. */
export async function sendVerifyEmail(to: string, url: string, name: string, locale: Locale) {
  const { say, html } = wordsIn(locale);
  await sendEmail({
    to,
    purpose: "EMAIL_VERIFY",
    subject: say("verifySubject", { name }),
    text: `${say("verifyBody", { name })}\n\n${say("verifyCta")}: ${url}`,
    html: layout(locale, say("verifySubject", { name }), `<p>${html("verifyBody", { name }, ["name"])}</p>`, {
      label: say("verifyCta"),
      url,
    }),
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
export async function sendEmailChangeCode(to: string, code: string, minutes: number, locale: Locale) {
  const { say, html } = wordsIn(locale);
  await sendEmail({
    to,
    purpose: "EMAIL_CHANGE",
    subject: say("codeSubject", { code }),
    text: `${code}\n\n${say("changeLead")} ${say("codeExpiry", { minutes })}\n\n${say("changeIgnore")}`,
    html: layout(
      locale,
      say("changeHeading"),
      `<p>${html("changeLead")} ${html("codeExpiry", { minutes })}</p>
       ${codeBlock(code)}
       <p>${html("changeIgnore")}</p>`,
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
export async function sendEmailChangedNotice(to: string, newEmail: string, locale: Locale) {
  const { say, html } = wordsIn(locale);
  await sendEmail({
    to,
    purpose: "EMAIL_CHANGE",
    subject: say("changedSubject"),
    text: `${say("changedBody", { email: newEmail })}\n\n${say("changedFromNow")}\n\n${say("changedNotYou")}`,
    html: layout(
      locale,
      say("changedHeading"),
      `<p>${html("changedBody", { email: newEmail }, ["email"])}</p>
       <p>${html("changedFromNow")}</p>
       <p><strong>${html("changedNotYou")}</strong></p>`,
    ),
  });
}

/**
 * An invitation to join a school — a teacher's, and the operator's to a
 * school's first administrator or principal, which is why the words name no
 * role. `inviterName` null means the platform itself ("the Shalaghar team").
 */
export async function sendTeacherInvite(
  to: string,
  url: string,
  schoolName: string,
  inviterName: string | null,
  locale: Locale,
) {
  const { say, html } = wordsIn(locale);
  const vars = { inviter: inviterName ?? say("platformInviter"), school: schoolName };
  await sendEmail({
    to,
    purpose: "INVITE",
    subject: say("inviteSubject", vars),
    text: `${say("inviteBody", vars)}\n\n${say("inviteSteps")}\n\n${say("inviteCta")}: ${url}`,
    html: layout(
      locale,
      say("inviteHeading", vars),
      `<p>${html("inviteBody", vars, ["inviter", "school"])}</p>
       <p>${html("inviteSteps")}</p>`,
      { label: say("inviteCta"), url },
    ),
  });
}

/**
 * The expert invitation. It existed as a copyable link long before it was an
 * email — the invite form collected an address and quietly never used it,
 * which the three-school simulation flagged as a promise the control never
 * kept. The link stays copyable on screen; when an address was given, this
 * now travels too. `schoolName` null when the school's row could not be read.
 */
export async function sendExpertInvite(to: string, url: string, schoolName: string | null, locale: Locale) {
  const { say, html } = wordsIn(locale);
  const line = schoolName ? say("expertLine", { school: schoolName }) : say("expertLineAnySchool");
  const lineHtml = schoolName ? html("expertLine", { school: schoolName }, ["school"]) : html("expertLineAnySchool");
  await sendEmail({
    to,
    purpose: "INVITE",
    subject: say("expertSubject"),
    text: `${line}\n\n${say("expertSteps")}\n\n${say("inviteCta")}: ${url}`,
    html: layout(
      locale,
      say("expertHeading"),
      `<p>${lineHtml}</p>
       <p>${html("expertSteps")}</p>`,
      { label: say("inviteCta"), url },
    ),
  });
}

/**
 * The operator's health digest — sent ONLY when something needs a person. The
 * callers compose the subject and body in English, like the crontab whose jobs
 * it reports on, and pass "en"; the frame around them takes the locale like
 * every other email, so a caller that composes in the operator's language can
 * pass theirs.
 */
export async function sendHealthDigestEmail(to: string, subject: string, text: string, bodyHtml: string, locale: Locale) {
  const { say } = wordsIn(locale);
  await sendEmail({
    to,
    purpose: "HEALTH",
    subject,
    text,
    html: layout(locale, say("healthHeading"), bodyHtml, {
      label: say("healthCta"),
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
  locale: Locale,
) {
  const { say, html } = wordsIn(locale);
  const vars = { child: childName, school: schoolName, inviter: inviterName };
  await sendEmail({
    to,
    purpose: "INVITE",
    subject: say("linkSubject", vars),
    text: `${say("linkBody", vars)}\n\n${say("linkSees")}\n\n${say("linkCta")}: ${url}`,
    html: layout(
      locale,
      say("linkHeading", vars),
      `<p>${html("linkBody", vars, ["inviter", "school", "child"])}</p>
       <p>${html("linkSees")}</p>`,
      { label: say("linkCta"), url },
    ),
  });
}

/**
 * An admission offer. The words arrive already in the family's language
 * (admissions.ts picks them from the dictionary), because the reader of an
 * offer is one known person; this only lays them out, in the frame of the same
 * `locale`. Sent whether or not there is an account behind the address — a
 * walk-in family gets the same sentences with no button, because there is no
 * page of theirs to open.
 */
export async function sendAdmissionOffer(input: { to: string; subject: string; heading: string; lines: string[]; cta: { label: string; path: string } | null; locale: Locale }) {
  await sendEmail({
    to: input.to,
    purpose: "ADMISSION",
    subject: input.subject,
    text: `${input.lines.join("\n\n")}${input.cta ? `\n\n${input.cta.label}: ${APP}${input.cta.path}` : ""}`,
    html: layout(
      input.locale,
      input.heading,
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
  locale: Locale,
) {
  const { say, html } = wordsIn(locale);
  const vars = { child: childName, school: schoolName };
  await sendEmail({
    to,
    purpose: "PARENT_CLAIM",
    subject: say("claimSubject", vars),
    text: `${say("claimBody", vars)}\n\n${say("claimControl")}\n\n${say("claimCta")}: ${url}`,
    html: layout(
      locale,
      say("claimHeading", vars),
      `<p>${html("claimBody", vars, ["child", "school"])}</p>
       <p>${html("claimControl")}</p>`,
      { label: say("claimCta"), url },
    ),
  });
}

/**
 * A notice to an expert, who belongs to no school: the operator's answer to
 * their identity papers (src/lib/expert-kyc.ts). An in-app notification is a
 * school's row and an expert's tenant set is empty, so for them the mail is
 * the channel; the words come translated into their own language, and
 * `locale` is that language for the frame.
 */
export async function sendExpertNotice(input: { to: string; subject: string; heading: string; lines: string[]; cta: { label: string; path: string } | null; locale: Locale }) {
  await sendEmail({
    to: input.to,
    purpose: "EXPERT_KYC",
    subject: input.subject,
    text: `${input.lines.join("\n\n")}${input.cta ? `\n\n${input.cta.label}: ${APP}${input.cta.path}` : ""}`,
    html: layout(
      input.locale,
      input.heading,
      input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n       "),
      input.cta ? { label: input.cta.label, url: `${APP}${input.cta.path}` } : undefined,
    ),
  });
}

/**
 * AN EXPERT'S APPLICATION FROM THE LOGIN PAGE (15 Oct 2026): "we received it" and the operator's refusal with its
 * reason, to an applicant who has no account, in the language they applied in. The caller translates the lines
 * (src/lib/expert-applications.ts); an approval sends the invitation's own mail (`sendExpertInvite`) instead.
 */
export async function sendExpertApplicationNotice(input: { to: string; subject: string; lines: string[]; cta: { label: string; path: string } | null; locale: Locale }) {
  await sendEmail({
    to: input.to,
    purpose: "EXPERT_APPLICATION",
    subject: input.subject,
    text: `${input.lines.join("\n\n")}${input.cta ? `\n\n${input.cta.label}: ${APP}${input.cta.path}` : ""}`,
    html: layout(
      input.locale,
      input.subject,
      input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n       "),
      input.cta ? { label: input.cta.label, url: `${APP}${input.cta.path}` } : undefined,
    ),
  });
}

/**
 * THE OPERATOR CLOSED (OR REOPENED) AN OUTSIDE ACCOUNT (G4-28, risks batch 5 Oct 2026): a recruiter or an expert
 * belongs to no school, so no school notice reaches them and the mail is the channel; the words come translated
 * into their own language (operator-college.ts `tellStanding`).
 */
export async function sendStandingNotice(input: { to: string; subject: string; lines: string[]; locale: Locale }) {
  await sendEmail({
    to: input.to,
    purpose: "ACCOUNT_STANDING",
    subject: input.subject,
    text: input.lines.join("\n\n"),
    html: layout(input.locale, input.subject, input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n       ")),
  });
}

// website-two (16 Oct 2026)
/**
 * THE OFFICE'S REPLY TO AN ENQUIRY FROM THE SCHOOL'S WEBSITE (src/lib/site-inbox.ts): the enquirer has no account, so
 * the mail is the channel, in the language of the page the form was on; the caller translates the greeting and the
 * footer and passes the office's own words between them as typed (escaped here like every line).
 */
export async function sendSiteEnquiryReply(input: {
  to: string;
  subject: string;
  lines: string[];
  locale: Locale;
  // website-three (17 Oct 2026): the thread quoted under the words, the school's address to answer to, and the thread's ids.
  quoted?: { intro: string; lines: string[] }[];
  replyTo?: string | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[];
}) {
  const quoted = input.quoted ?? [];
  const quotedText = quoted.map((q) => [q.intro, ...q.lines].join("\n"));
  const quotedHtml = quoted.map(
    (q) => `<p style="color:#555;margin:16px 0 4px">${escapeHtml(q.intro)}</p><blockquote style="margin:0;padding-left:12px;border-left:3px solid #ccc;color:#555">${q.lines.map((l) => escapeHtml(l.replace(/^> ?/, ""))).join("<br>")}</blockquote>`,
  );
  await sendEmail({
    to: input.to,
    purpose: "SITE_ENQUIRY_REPLY",
    subject: input.subject,
    text: [...input.lines, ...quotedText].join("\n\n"),
    html: layout(input.locale, input.subject, [...input.lines.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`), ...quotedHtml].join("\n       ")),
    replyTo: input.replyTo ?? null,
    messageId: input.messageId ?? null,
    inReplyTo: input.inReplyTo ?? null,
    references: input.references ?? [],
  });
}
// end website-two
