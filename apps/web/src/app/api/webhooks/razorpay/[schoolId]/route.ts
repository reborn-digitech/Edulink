import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forSchool } from "@/lib/tenant-context";
import { gatewayAccountFor } from "@/lib/fees";
import { failOnlinePayment, markRefundDone, settleOnlinePayment } from "@/lib/fees-payments";
import { verifyWebhookSignature } from "@/lib/gateway";
import { writeJson } from "@/lib/json";
import { createHash } from "node:crypto";

/**
 * POST /api/webhooks/razorpay/{schoolId} — the school's gateway telling us
 * what happened to an order.
 *
 * THE SCHOOL IS IN THE PATH, NOT IN THE PAYLOAD. A webhook carries no
 * session, and the tenant it belongs to has to be known before anything is
 * read — so each school registers its own URL, and the signature is checked
 * with THAT school's webhook secret before a byte of the body is believed.
 * A wrong school in the path means a wrong secret and a refused signature;
 * a right one proves the caller holds the school's own secret. Only then is
 * the work run under forSchool for the school in the path.
 *
 * IDEMPOTENT BY EVENT ID — AN ID TAKEN FROM THE SIGNED BODY, never from a
 * header. `x-razorpay-event-id` travels outside the signature, so a caller
 * holding one signed body could replay it under fresh ids and have each
 * delivery processed as new; the body's own `id` when the gateway sends one,
 * else the event kind and the entity it names, is what the signature
 * actually vouches for. Every delivery is stored once by that id; a
 * redelivery answers "already" and settles nothing twice. Every settlement
 * goes through settleOnlinePayment, the one door the checkout's confirm and
 * the reconcile job use too, so whichever arrives first wins and the rest
 * are told so.
 *
 * ALWAYS 200 AFTER A GOOD SIGNATURE, even for an unknown order or a mismatch
 * — those are recorded for the office, and a non-2xx would only make the
 * gateway retry the same thing. 401 for a bad signature and 404 for a school
 * with no gateway are the two answers that mean "stop sending".
 */
type WebhookBody = { event?: string; id?: string; created_at?: number; payload?: Record<string, { entity?: Record<string, unknown> }> };

/**
 * The event's identity as the SIGNED body states it: its own `id` when there
 * is one; else the kind plus the payment or refund it is about (one capture
 * of one payment is one event however often it is delivered), plus the
 * gateway's `created_at` so a genuine second event about the same entity —
 * a failed attempt and its retry — is not mistaken for a redelivery; else a
 * digest of the body itself. Never the header.
 */
function signedEventId(event: WebhookBody, kind: string, raw: string): string | null {
  if (typeof event.id === "string" && event.id.trim()) return event.id.trim().slice(0, 120);
  if (!event.event) return null;
  const entity = (event.payload?.payment?.entity ?? event.payload?.refund?.entity) as { id?: unknown } | undefined;
  const entityId = typeof entity?.id === "string" ? entity.id : null;
  const stamp = typeof event.created_at === "number" ? String(event.created_at) : "";
  if (entityId) return `${kind}:${entityId}:${stamp}`.slice(0, 120);
  return `${kind}:sha256:${createHash("sha256").update(raw).digest("hex").slice(0, 32)}`;
}

export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const account = await forSchool(schoolId, () => gatewayAccountFor(schoolId)).catch(() => null);
  if (!account) return NextResponse.json({ code: "NO_GATEWAY" }, { status: 404 });
  if (!verifyWebhookSignature(account.webhookSecret, raw, signature)) return NextResponse.json({ code: "BAD_SIGNATURE" }, { status: 401 });

  let event: WebhookBody;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ code: "NOT_JSON" }, { status: 400 });
  }
  const kind = event.event ?? "unknown";
  const eventId = signedEventId(event, kind, raw);
  if (!eventId) return NextResponse.json({ code: "NO_EVENT_ID" }, { status: 400 });

  return forSchool(schoolId, async () => {
    const seen = await db.gatewayEvent.findUnique({ where: { schoolId_provider_eventId: { schoolId, provider: "RAZORPAY", eventId } }, select: { id: true } });
    if (seen) return NextResponse.json({ ok: true, outcome: "already" });
    const row = await db.gatewayEvent.create({ data: { schoolId, provider: "RAZORPAY", eventId, kind, payloadJson: raw.slice(0, 20_000) }, select: { id: true } });

    let outcome = "ignored";
    const payment = event.payload?.payment?.entity as { id?: string; order_id?: string; amount?: number; method?: string; error_description?: string } | undefined;
    const refund = event.payload?.refund?.entity as { id?: string } | undefined;
    if (kind === "payment.captured" && payment?.id && payment.order_id && typeof payment.amount === "number") {
      outcome = (await settleOnlinePayment(schoolId, { orderId: payment.order_id, gatewayPaymentId: payment.id, amountPaise: payment.amount, gatewayMethod: payment.method ?? null })).outcome;
    } else if (kind === "payment.failed" && payment?.order_id) {
      await failOnlinePayment(schoolId, payment.order_id, payment.error_description ?? "failed at the gateway");
      outcome = "failed";
    } else if (kind === "refund.processed" && refund?.id) {
      await markRefundDone(schoolId, refund.id);
      outcome = "refund-done";
    }
    await db.gatewayEvent.update({ where: { id: row.id }, data: { processedAt: new Date(), outcome } });
    return NextResponse.json({ ok: true, outcome, meta: writeJson({ kind }) });
  });
}
