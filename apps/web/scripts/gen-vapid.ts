/**
 * Generates a VAPID keypair for Web Push and prints .env lines.
 * Run: npm run vapid
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
process.stdout.write(
  [
    "",
    "Add these to .env:",
    "",
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`,
    `VAPID_PRIVATE_KEY="${keys.privateKey}"`,
    "",
  ].join("\n"),
);
