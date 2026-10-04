import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  localeForAddress,
  localeForUser,
  sendAdmissionOffer,
  sendEmail,
  sendEmailChangeCode,
  sendEmailChangedNotice,
  sendExpertInvite,
  sendExpertNotice,
  sendHealthDigestEmail,
  sendMagicLink,
  sendParentClaimNotice,
  sendParentLinkInvite,
  sendResetCode,
  sendTeacherInvite,
  sendVerifyEmail,
} from "@/lib/email";
import { requestPasswordReset } from "@/lib/passwords";
import type { Locale } from "@/lib/i18n/locales";

/**
 * The email transport and its templates — eleven exports and no test until
 * now. The devbox branch persists what would have been sent; the smtp branch
 * fails loudly on a half-configured server rather than dropping a reset code;
 * anything else is refused by name.
 */
const db = new PrismaClient();
const TO = `zz-email-${Date.now()}@test.invalid`;
const KEYS = ["EMAIL_TRANSPORT", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;
const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

beforeEach(() => {
  process.env.EMAIL_TRANSPORT = "devbox";
});
afterEach(async () => {
  for (const key of KEYS) {
    if (original[key] === undefined) delete (process.env as Record<string, string | undefined>)[key];
    else (process.env as Record<string, string | undefined>)[key] = original[key];
  }
  await db.outboundEmail.deleteMany({ where: { to: TO } });
});

describe("the devbox transport", () => {
  it("persists the message with its purpose, and the templates render their one fact", async () => {
    await sendMagicLink(TO, "http://localhost:3000/magic?token=abc", 20, "en");
    await sendResetCode(TO, "482913", 15, "en");
    await sendEmail({ to: TO, subject: "Plain", text: "hello", html: "<p>hello</p>" });
    const rows = await db.outboundEmail.findMany({ where: { to: TO }, orderBy: { createdAt: "asc" } });
    expect(rows).toHaveLength(3);
    expect(rows[0]!.text).toContain("http://localhost:3000/magic?token=abc");
    expect(rows[0]!.text).toContain("20");
    expect(rows[1]!.subject).toContain("482913");
    expect(rows[1]!.html).toContain("482913");
    expect(rows[2]!.purpose).toBeNull();
    expect(rows[0]!.purpose).toBeTruthy();
    expect(rows[1]!.purpose).toBeTruthy();
  });
});

describe("the other transports", () => {
  it("an unknown transport is refused by name rather than dropping the message", async () => {
    process.env.EMAIL_TRANSPORT = "carrier-pigeon";
    await expect(sendEmail({ to: TO, subject: "x", text: "y", html: "z" })).rejects.toThrow(/carrier-pigeon/);
    expect(await db.outboundEmail.count({ where: { to: TO } })).toBe(0);
  });

  it("smtp with an incomplete configuration throws listing the problem, and persists nothing", async () => {
    process.env.EMAIL_TRANSPORT = "smtp";
    for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]) delete (process.env as Record<string, string | undefined>)[key];
    await expect(sendEmail({ to: TO, subject: "x", text: "y", html: "z" })).rejects.toThrow(/incomplete/);
    expect(await db.outboundEmail.count({ where: { to: TO } })).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* The reader's language (G-7, campaign of 4 October 2026)                     */
/* -------------------------------------------------------------------------- */

/**
 * Every sender, once, in one language. The values a person would type — a
 * school's name, a child's — are Devanagari here so that any Latin left in a
 * Hindi or Marathi email can only be the template's own English.
 */
const URL = "http://localhost:3000/x?token=abc";
const NAMES = { school: "विद्यालय-झेड", child: "आरव", inviter: "सुनीता", company: "कंपनी-झेड" };
async function sendEveryEmail(to: string, locale: Locale): Promise<void> {
  await sendMagicLink(to, URL, 20, locale);
  await sendResetCode(to, "482913", 15, locale);
  await sendVerifyEmail(to, URL, NAMES.school, locale);
  await sendEmailChangeCode(to, "730114", 15, locale);
  await sendEmailChangedNotice(to, "zz-new@test.invalid", locale);
  await sendTeacherInvite(to, URL, NAMES.school, NAMES.inviter, locale);
  await sendTeacherInvite(to, URL, NAMES.school, null, locale);
  await sendExpertInvite(to, URL, NAMES.school, locale);
  await sendExpertInvite(to, URL, null, locale);
  await sendParentLinkInvite(to, URL, NAMES.child, NAMES.school, NAMES.inviter, locale);
  await sendParentClaimNotice(to, NAMES.child, NAMES.school, URL, locale);
  // The three whose words the caller brings: only the frame is this file's.
  await sendHealthDigestEmail(to, "१", "२", "<p>२</p>", locale);
  await sendAdmissionOffer({ to, subject: "१", heading: "२", lines: ["३"], cta: { label: "४", path: "/x" }, locale });
  await sendExpertNotice({ to, subject: "१", heading: "२", lines: ["३"], cta: null, locale });
}
const SENT_PER_RUN = 14;

/** What a reader sees of the HTML: tags gone (inline ones without a gap), entities decoded. */
function visible(html: string): string {
  return html
    .replace(/<\/?strong>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Latin words left once links, addresses and the purpose-built placeholders are taken out. */
function englishLeft(text: string): string[] {
  const stripped = text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\S+@\S+/g, " ")
    .replace(/\/x\b/g, " ");
  return stripped.match(/[A-Za-z]{2,}/g) ?? [];
}

const BY_LOCALE = Object.fromEntries((["en", "hi", "mr"] as const).map((l) => [l, `zz-email-${l}-${Date.now()}@test.invalid`])) as Record<Locale, string>;

describe("every email in the reader's language", () => {
  afterAll(async () => {
    await db.outboundEmail.deleteMany({ where: { to: { in: Object.values(BY_LOCALE) } } });
  });

  it.each(["en", "hi", "mr"] as const)("renders all fourteen in %s, subject, text and HTML saying the same", async (locale) => {
    const to = BY_LOCALE[locale];
    await sendEveryEmail(to, locale);
    const rows = await db.outboundEmail.findMany({ where: { to }, orderBy: { createdAt: "asc" } });
    expect(rows).toHaveLength(SENT_PER_RUN);

    for (const row of rows) {
      const shown = visible(row.html);
      expect(row.html, row.subject).toContain(`lang="${locale}"`);
      // The plain text and the HTML are the same email: every paragraph of one is in the other.
      for (const paragraph of row.text.split("\n\n")) {
        const cta = /^(.*): (https?:\/\/\S+)$/.exec(paragraph);
        if (cta) {
          expect(shown, `${row.subject}: CTA label`).toContain(cta[1]);
          expect(shown, `${row.subject}: CTA link`).toContain(cta[2]);
        } else {
          expect(shown, `${row.subject}: "${paragraph}"`).toContain(paragraph.replace(/\s+/g, " "));
        }
      }
      if (locale === "en") continue;
      // ⚠ The point of G-7: nothing English is left in a Hindi or Marathi email.
      expect(englishLeft(row.subject), `${locale} subject: ${row.subject}`).toEqual([]);
      expect(englishLeft(row.text), `${locale} text of "${row.subject}"`).toEqual([]);
      expect(englishLeft(shown), `${locale} HTML of "${row.subject}"`).toEqual([]);
    }

    const all = rows.map((r) => `${r.subject}\n${r.text}\n${visible(r.html)}`).join("\n");
    if (locale === "en") {
      expect(all).toContain("Shalaghar");
      expect(all).toContain("Or paste this link:");
    }
    if (locale === "hi") {
      expect(all).toContain("शालाघर");
      expect(all).toContain("।");
    }
    if (locale === "mr") {
      expect(all).toContain("शाळाघर");
      // House style: a school is शाळा in Marathi, never स्कूल; a sentence ends with a full stop, not the danda.
      expect(all).not.toContain("स्कूल");
      expect(all).not.toContain("।");
    }
  });

  it("escapes a name in the HTML and leaves it whole in the text", async () => {
    const to = BY_LOCALE.en;
    await sendParentClaimNotice(to, "<b>Ria</b> & co", "O'Neil School", URL, "en");
    const row = await db.outboundEmail.findFirst({ where: { to, purpose: "PARENT_CLAIM" }, orderBy: { createdAt: "desc" } });
    expect(row!.html).not.toContain("<b>Ria</b>");
    expect(row!.html).toContain("&lt;b&gt;Ria&lt;/b&gt; &amp; co");
    expect(row!.html).toContain("O&#39;Neil School");
    expect(row!.text).toContain("<b>Ria</b> & co");
  });
});

describe("which language: the recipient's, else the fallback the caller names", () => {
  const suffix = Date.now();
  const made: string[] = [];
  async function person(locale: string | null, tag: string): Promise<{ id: string; email: string }> {
    const email = `zz-email-lang-${tag}-${suffix}@demo.relay.test`;
    const user = await db.user.create({
      data: { email, name: `ZZ Email ${tag}`, passwordHash: null, prefs: JSON.stringify(locale ? { theme: "system", locale } : { theme: "system" }) },
    });
    made.push(user.id);
    return { id: user.id, email };
  }
  afterAll(async () => {
    await db.authToken.deleteMany({ where: { userId: { in: made } } });
    await db.outboundEmail.deleteMany({ where: { to: { contains: `-${suffix}@demo.relay.test` } } });
    await db.user.deleteMany({ where: { id: { in: made } } });
  });

  it("reads prefs.locale off the account, by id and by address, over the school's language", async () => {
    const marathi = await person("mr", "mr");
    expect(await localeForUser(marathi.id)).toBe("mr");
    expect(await localeForAddress(marathi.email, "hi")).toBe("mr");
    expect(await localeForAddress(marathi.email.toUpperCase(), "hi")).toBe("mr");
  });

  it("falls back to the school's language for an address with no account, or an account that never chose", async () => {
    const silent = await person(null, "none");
    expect(await localeForAddress(`zz-email-nobody-${suffix}@demo.relay.test`, "hi")).toBe("hi");
    expect(await localeForAddress(silent.email, "mr")).toBe("mr");
    expect(await localeForAddress(`zz-email-nobody-${suffix}@demo.relay.test`)).toBe("en");
    expect(await localeForAddress(`zz-email-nobody-${suffix}@demo.relay.test`, "fr")).toBe("en");
  });

  it("a real caller — the password reset — writes to a Marathi reader in Marathi and an English one in English", async () => {
    const marathi = await person("mr", "reset-mr");
    const english = await person("en", "reset-en");
    expect((await requestPasswordReset(marathi.email)).ok).toBe(true);
    expect((await requestPasswordReset(english.email)).ok).toBe(true);
    const toMr = await db.outboundEmail.findFirst({ where: { to: marathi.email, purpose: "PASSWORD_RESET" } });
    const toEn = await db.outboundEmail.findFirst({ where: { to: english.email, purpose: "PASSWORD_RESET" } });
    expect(toMr!.subject).toContain("शाळाघर");
    expect(englishLeft(toMr!.text)).toEqual([]);
    expect(toEn!.subject).toContain("Shalaghar");
    expect(toEn!.text).toContain("Use this code to set a new Shalaghar password.");
  });
});
