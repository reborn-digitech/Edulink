import { createCipheriv, randomBytes } from "node:crypto";

/**
 * Seals one secret under FEES_SECRET_KEY the way src/lib/secret-box.ts does
 * (AES-256-GCM, v2, the binding as associated data), for a value that lives
 * in the environment rather than a row: the company's gateway secret for paid
 * seats (GATEWAY_PLATFORM_SECRET_ENC, binding "gateway:platform:secret").
 *
 *   npm run secret:seal -- gateway:platform:secret <the plain secret>
 *
 * Prints the sealed value and nothing else; the plain secret is read from the
 * argument and never echoed. The box itself is "server-only" and cannot be
 * imported by a script, so the few lines are repeated here on purpose.
 */
const [binding, plain] = process.argv.slice(2);
const raw = process.env.FEES_SECRET_KEY?.trim();
if (!binding || !plain) {
  console.error("usage: npm run secret:seal -- <binding> <secret>");
  process.exit(2);
}
if (!raw) {
  console.error("FEES_SECRET_KEY is not set: generate one with `openssl rand -base64 32` and put it in .env first.");
  process.exit(2);
}
const key = Buffer.from(raw, "base64");
if (key.length !== 32) {
  console.error(`FEES_SECRET_KEY decodes to ${key.length} bytes — expected 32.`);
  process.exit(2);
}
const nonce = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, nonce);
cipher.setAAD(Buffer.from(binding, "utf8"));
const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
console.log(["v2", nonce.toString("base64url"), body.toString("base64url"), cipher.getAuthTag().toString("base64url")].join("."));
