import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { readBounded, WEBHOOK_BODY_LIMIT } from "@/lib/api-v1";
import { db } from "@/lib/db";
import { verifySessionsWebhook, webhookSecret } from "@/lib/gig-gateway";
import { markPassFailed, markPassPaid, markPassRefundFailed } from "@/lib/pass-orders";
import { writeJson } from "@/lib/json";

/**
 * POST /api/webhooks/razorpay/platform — the COMPANY'S gateway telling us what happened to a PASS's order (17 October
 * 2026; decision 0006), so a person who closed the browser before the checkout's own confirm still gets their pass.
 * No school in the path: the account is the company's, and the signature is checked with the company's webhook secret
 * (GATEWAY_PLATFORM_WEBHOOK_SECRET, the devbox one without a key) over the raw body, read under the 64 KB cap, before
 * a byte of it is believed. Subscribe it to payment.captured, payment.failed and refund.failed. A static segment, so
 * Next serves it before /api/webhooks/razorpay/{schoolId}, the schools' fees door with their own secrets.
 *
 * THE SEATS' RULES. The event is stored once by the id the SIGNED BODY states (its own `id`, else the kind plus the
 * entity plus the gateway's `created_at`, else a digest of the body), never a header, under the provider
 * "RAZORPAY_PASS" — not the sessions webhook's "RAZORPAY", so when the company points both URLs at the same events
 * each door hears each event once. A capture goes through markPassPaid, the one door the checkout's confirm and the
 * devbox page use too, idempotent on the order and the gateway's payment id; an order that is not a pass (a seat) is
 * answered "ignored". After a good signature the answer is 200 whatever happened, since a non-2xx only makes the
 * gateway send it again. 404 when this server has no gateway, 401 for a bad signature.
 */
type WebhookBody = { event?: string; id?: string; created_at?: number; payload?: Record<string, { entity?: Record<string, unknown> }> };

const PROVIDER = "RAZORPAY_PASS";

function signedEventId(event: WebhookBody, kind: string, raw: string): string | null {
  if (typeof event.id === "string" && event.id.trim()) return event.id.trim().slice(0, 120);
  if (!event.event) return null;
  const entity = (event.payload?.payment?.entity ?? event.payload?.refund?.entity) as { id?: unknown } | undefined;
  const entityId = typeof entity?.id === "string" ? entity.id : null;
  const stamp = typeof event.created_at === "number" ? String(event.created_at) : "";
  if (entityId) return `${kind}:${entityId}:${stamp}`.slice(0, 120);
  return `${kind}:sha256:${createHash("sha256").update(raw).digest("hex").slice(0, 32)}`;
}

export async function POST(request: Request) {
  const raw = await readBounded(request, WEBHOOK_BODY_LIMIT);
  if (raw === null) return NextResponse.json({ code: "TOO_LARGE" }, { status: 413 });
  if (!webhookSecret()) return NextResponse.json({ code: "NO_GATEWAY" }, { status: 404 });
  if (!verifySessionsWebhook(raw, request.headers.get("x-razorpay-signature"))) return NextResponse.json({ code: "BAD_SIGNATURE" }, { status: 401 });

  let event: WebhookBody;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ code: "NOT_JSON" }, { status: 400 });
  }
  const kind = event.event ?? "unknown";
  const eventId = signedEventId(event, kind, raw);
  if (!eventId) return NextResponse.json({ code: "NO_EVENT_ID" }, { status: 400 });

  const seen = await db.gigGatewayEvent.findUnique({ where: { provider_eventId: { provider: PROVIDER, eventId } }, select: { id: true } });
  if (seen) return NextResponse.json({ ok: true, outcome: "already" });
  const row = await db.gigGatewayEvent.create({ data: { provider: PROVIDER, eventId, kind, payloadJson: raw.slice(0, 20_000) }, select: { id: true } });

  let outcome = "ignored";
  const payment = event.payload?.payment?.entity as { id?: string; order_id?: string; amount?: number; error_description?: string } | undefined;
  const refund = event.payload?.refund?.entity as { id?: string; error_description?: string; status_details?: { description?: string } } | undefined;
  if (kind === "payment.captured" && payment?.id && payment.order_id && typeof payment.amount === "number") {
    const result = await markPassPaid({ orderId: payment.order_id, gatewayPaymentId: payment.id, amountPaise: payment.amount });
    outcome = result.outcome === "unknown-order" ? "ignored" : result.outcome;
  } else if (kind === "payment.failed" && payment?.order_id) {
    outcome = (await markPassFailed(payment.order_id, payment.error_description ?? "failed at the gateway")) ? "failed" : "ignored";
  } else if (kind === "refund.failed" && refund?.id) {
    outcome = (await markPassRefundFailed(refund.id, refund.error_description ?? refund.status_details?.description ?? "failed at the gateway")) ? "refund-failed" : "ignored";
  }
  await db.gigGatewayEvent.update({ where: { id: row.id }, data: { processedAt: new Date(), outcome } });
  return NextResponse.json({ ok: true, outcome, meta: writeJson({ kind }) });
}
