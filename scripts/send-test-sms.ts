/**
 * Proves the configured SMS transport with one real message.
 *
 *   npm run sms:test -- +15551234567
 *
 * Under "devbox" it lands in /dev/mailbox; under "twilio" it goes to the
 * carrier, and any config, network or provider refusal prints here instead of
 * surfacing as a parent who never got their reset code. The auth token is
 * never printed.
 *
 * ⚠ A 201 FROM TWILIO IS NOT A DELIVERED MESSAGE, and for an Indian number it
 * is not even close: DLT filtering happens at the carrier, after Twilio has
 * accepted. Read the handset.
 */
import { sendSms } from "../src/lib/sms";
import { readTwilioConfig } from "../src/lib/env";

async function main() {
  const to = process.argv[2]?.trim();
  if (!to || !/^\+[1-9]\d{6,14}$/.test(to)) {
    console.error("Usage: npm run sms:test -- +15551234567   (E.164, starting +)");
    process.exit(2);
  }

  const transport = process.env.SMS_TRANSPORT ?? "devbox";
  if (transport === "twilio") {
    const read = readTwilioConfig();
    if (!read.ok) {
      console.error('SMS_TRANSPORT is "twilio" but the config is incomplete:');
      for (const p of read.problems) console.error(`  - ${p.key}: ${p.message}`);
      process.exit(1);
    }
    const { accountSid, from } = read.config;
    const base = process.env.TWILIO_API_BASE?.trim() || "https://api.twilio.com";
    // The SID is an identifier, not a secret; the token is never printed.
    console.log(`transport twilio — account ${accountSid.slice(0, 8)}… from ${from} via ${base}`);
  } else {
    console.log(`transport ${transport}`);
  }

  await sendSms({
    to,
    text: `EduLink transport test at ${new Date().toISOString()}. If you are reading this, the wiring works.`,
    purpose: "TEST",
  });
  console.log(
    `sent to ${to}${transport === "devbox" ? " — read it at /dev/mailbox" : " — accepted by the provider; now read the handset"}`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("send failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
