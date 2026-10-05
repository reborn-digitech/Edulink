import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PUNCH_SKEW_SECONDS } from "@edulink/contracts";

/**
 * THE SIGNATURE ON A DEVICE'S PUNCHES (R-2, 5 Oct 2026), the one place it is
 * made and checked: the server's door (attendance-devices.ts) and the vendor
 * adapter (scripts/punch-adapter.ts) both use these, so they cannot disagree.
 *
 *   signature = "sha256=" + hex(HMAC-SHA256(key, timestamp + "." + body))
 *
 * over the exact bytes of the body, the timestamp in whole seconds since 1970.
 * No server-only marker: the adapter script imports it. Pure apart from the
 * clock, which the caller passes.
 */

/** A fresh device key: 32 random bytes, base64url (43 characters). */
export function newDeviceKey(): string {
  return randomBytes(32).toString("base64url");
}

export function signPunches(key: string, timestamp: number | string, body: string): string {
  return `sha256=${createHmac("sha256", key).update(`${timestamp}.${body}`).digest("hex")}`;
}

/**
 * Whether a request is the key holder's and fresh: the timestamp an integer
 * within PUNCH_SKEW_SECONDS of `nowSeconds`, the signature the right length
 * and equal in constant time. Anything malformed is simply false.
 */
export function verifyPunches(key: string, timestamp: string | null, signature: string | null, body: string, nowSeconds: number): boolean {
  if (!timestamp || !signature || !/^\d{1,12}$/.test(timestamp)) return false;
  if (Math.abs(Number(timestamp) - nowSeconds) > PUNCH_SKEW_SECONDS) return false;
  const expected = Buffer.from(signPunches(key, timestamp, body));
  const given = Buffer.from(signature.trim());
  return expected.length === given.length && timingSafeEqual(expected, given);
}
