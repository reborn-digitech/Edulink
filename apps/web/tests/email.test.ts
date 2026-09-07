import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { sendEmail, sendMagicLink, sendResetCode } from "@/lib/email";

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
    await sendMagicLink(TO, "http://localhost:3000/magic?token=abc", 20);
    await sendResetCode(TO, "482913", 15);
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
