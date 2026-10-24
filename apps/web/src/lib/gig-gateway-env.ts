/**
 * The COMPANY'S OWN gateway account, for paid sessions (decision 0004, amended
 * 2026-10-02) — and nothing else. School fees never touch it (decision 0003):
 * tests/fees-invariants.test.ts reads src/lib/env.ts and refuses any variable
 * naming a platform key there, which is why these names are read here, in a
 * module env.ts calls into but does not spell them out in.
 *
 * Razorpay Route (the third amendment to decision 0004, 2 October 2026): an
 * expert's seat is an order carrying a transfer of the expert's net to the
 * expert's own linked account, on hold until the session is delivered; the
 * commission and its GST stay here. So the account must have Route enabled.
 * The adapter (gig-gateway.ts) may make exactly the eleven calls in its
 * ALLOWED_CALLS: the order, the payment read, the payment's transfers (read
 * and made), the hold released, the refund, and the four that build and read
 * a linked account (account, stakeholder, Route product, its bank). A pass
 * (decision 0006) and a teacher's seat are plain orders on the same account
 * with no transfer. The sessions webhook hears payment.captured,
 * payment.failed, refund.failed, transfer.processed, transfer.failed and the
 * Route product's review events; the passes webhook the first three.
 * (QA-76: this paragraph described the company-collects form of 2 October,
 * three calls and no Route, which the code no longer is.)
 *
 *   GATEWAY_PLATFORM_KEY_ID          the company's key id (rzp_live_… / rzp_test_…)
 *   GATEWAY_PLATFORM_SECRET_ENC      its secret, SEALED under FEES_SECRET_KEY by
 *                                    src/lib/secret-box.ts with the binding
 *                                    "gateway:platform:secret" — `npm run secret:seal`
 *                                    prints it; the plain secret is never in .env
 *   GATEWAY_PLATFORM_WEBHOOK_SECRET  what the webhook route checks signatures with
 *
 * THREE TRANSPORTS, as school fees have: "devbox" (a laptop with no key set)
 * mints local ids and /dev/payments settles them through the same code path
 * the webhook uses; "razorpay" (a key id set) talks to the real API; "off"
 * (deployed with no key) refuses every paid door — a price cannot be stored
 * and the kill switch reads as off — while free sessions carry on.
 *
 * No node imports at module scope: env.ts is compiled for the edge on the
 * middleware path (see instrumentation.ts), and this is on it.
 */
export type GigGatewayTransport = "devbox" | "razorpay" | "off";

const KEY_ID = "GATEWAY_PLATFORM_KEY_ID";
const SECRET_ENC = "GATEWAY_PLATFORM_SECRET_ENC";
const WEBHOOK_SECRET = "GATEWAY_PLATFORM_WEBHOOK_SECRET";
/** The signature secret the devbox transport uses when none is set, so the webhook can be exercised with no account anywhere. */
export const DEVBOX_WEBHOOK_SECRET = "devbox-sessions-webhook";

const raw = (name: string): string => process.env[name]?.trim() ?? "";

export function readGigGatewayTransport(deployed: boolean): GigGatewayTransport {
  if (raw(KEY_ID)) return "razorpay";
  return deployed ? "off" : "devbox";
}

/** The three values as set, unsealed by nobody: the adapter opens the secret under the fees key. */
export function readGigGatewayRaw(): { keyId: string; secretEnc: string; webhookSecret: string } {
  return { keyId: raw(KEY_ID), secretEnc: raw(SECRET_ENC), webhookSecret: raw(WEBHOOK_SECRET) };
}

/**
 * A key id is a promise: the sealed secret and the webhook secret must come
 * with it, and the fees key that opens the seal must be set. Said at boot,
 * fatal when deployed, like the SMTP block in env.ts.
 */
export function checkGigGatewayEnv(deployed: boolean): { key: string; message: string; fatal: boolean }[] {
  const problems: { key: string; message: string; fatal: boolean }[] = [];
  const { keyId, secretEnc, webhookSecret } = readGigGatewayRaw();
  if (!keyId) return problems;
  if (!secretEnc) problems.push({ key: SECRET_ENC, message: `${KEY_ID} is set and ${SECRET_ENC} is not: the key's secret, sealed with \`npm run secret:seal -- gateway:platform:secret <secret>\`. Paid sessions are refused until it is.`, fatal: deployed });
  else if (!/^v[12]\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(secretEnc)) problems.push({ key: SECRET_ENC, message: `${SECRET_ENC} is not a sealed value (v2.<nonce>.<body>.<tag>); seal the plain secret with \`npm run secret:seal\`, never paste it as text.`, fatal: deployed });
  if (!process.env.FEES_SECRET_KEY?.trim()) problems.push({ key: "FEES_SECRET_KEY", message: `${KEY_ID} is set and FEES_SECRET_KEY is not: the sealed gateway secret cannot be opened without it.`, fatal: deployed });
  if (!webhookSecret) problems.push({ key: WEBHOOK_SECRET, message: `${KEY_ID} is set and ${WEBHOOK_SECRET} is not: the sessions webhook cannot check a signature and refuses every delivery.`, fatal: deployed });
  return problems;
}
