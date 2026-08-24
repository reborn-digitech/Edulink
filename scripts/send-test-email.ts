/**
 * Proves the configured email transport with one real message.
 *
 *   npm run email:test -- you@example.com
 *
 * Under "devbox" the message lands in /dev/mailbox; under "smtp" it goes to
 * the real server, and any config or connection failure prints here instead
 * of surfacing as a parent who never got their reset code. The password is
 * never printed.
 */
import { sendEmail } from "../src/lib/email";
import { readSmtpConfig } from "../src/lib/env";

async function main() {
  const to = process.argv[2]?.trim();
  if (!to || !/@/.test(to)) {
    console.error("Usage: npm run email:test -- someone@example.com");
    process.exit(2);
  }

  const transport = process.env.EMAIL_TRANSPORT ?? "devbox";
  if (transport === "smtp") {
    const read = readSmtpConfig();
    if (!read.ok) {
      console.error("EMAIL_TRANSPORT is \"smtp\" but the config is incomplete:");
      for (const p of read.problems) console.error(`  - ${p.key}: ${p.message}`);
      process.exit(1);
    }
    const { host, port, secure, auth, from } = read.config;
    console.log(`transport smtp — ${host}:${port} secure=${secure} auth=${auth ? auth.user : "none"} from=${from}`);
  } else {
    console.log(`transport ${transport}`);
  }

  const at = new Date().toISOString();
  await sendEmail({
    to,
    purpose: "TEST",
    subject: "EduLink test email",
    text: `This is EduLink's transport test, sent ${at}. If you are reading it, the wiring works.`,
    html: `<p>This is EduLink's transport test, sent ${at}.</p><p>If you are reading it, the wiring works.</p>`,
  });
  console.log(`sent to ${to}${transport === "devbox" ? " — read it at /dev/mailbox" : ""}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("send failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
