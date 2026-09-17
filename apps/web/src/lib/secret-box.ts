import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFeesSecretKey } from "./env";

/**
 * Sealing a school's gateway secrets at rest.
 *
 * A school's Razorpay secret and webhook secret let anybody holding them
 * create orders and forge webhooks in that school's name, so they do not sit
 * in the database as text. AES-256-GCM under FEES_SECRET_KEY, a 32-byte key
 * the operator generates once (`openssl rand -base64 32`) and keeps out of
 * the database, so a copy of the database alone yields nothing. The nonce is
 * fresh per seal and stored beside the ciphertext; GCM's tag is what makes a
 * tampered row fail to open rather than open to garbage.
 *
 * Format: `v1.<nonce b64url>.<ciphertext b64url>.<tag b64url>`. The version
 * prefix is there so a key rotation can be a "reseal everything under v2"
 * job rather than a guess about which rows are which.
 */

const ALG = "aes-256-gcm";

function key(): Buffer {
  const read = readFeesSecretKey();
  if (!read.ok) throw new Error(read.problem);
  return read.key;
}

export function seal(plain: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALG, key(), nonce);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", nonce.toString("base64url"), body.toString("base64url"), tag.toString("base64url")].join(".");
}

export function open(sealed: string): string {
  const [version, nonce, body, tag] = sealed.split(".");
  if (version !== "v1" || !nonce || !body || !tag) throw new Error("secret-box: not a sealed value");
  const decipher = createDecipheriv(ALG, key(), Buffer.from(nonce, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}

/** Whether sealing is possible at all — the settings page says so before the form is filled. */
export function sealingAvailable(): boolean {
  return readFeesSecretKey().ok;
}
