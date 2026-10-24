import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { readBounded, WEBHOOK_BODY_LIMIT } from "@/lib/api-v1";
import { db } from "@/lib/db";
import { verifySessionsWebhook, webhookSecret } from "@/lib/gig-gateway";
import { markOrderFailed, markRouteProduct, markSeatRefundFailed, markTransferFailed, markTransferProcessed } from "@/lib/gig-payments";
import { settleSeatPayment } from "@/lib/gig-sessions";
import { claimableWhere, handleEventOnce, type EventLedger } from "@/lib/webhook-events";

/**
 * POST /api/webhooks/gateway/sessions — the COMPANY'S gateway telling us what
 * happened to a paid seat (decision 0004, third amendment of 2 October
 * 2026: Razorpay Route): a capture, a failed attempt, a failed refund, and
 * the held transfer of the expert's share — made (transfer.processed names
 * it, and the seat is held) or failed (the share sits with the company until
 * the operator's retry makes it again). Subscribe the webhook to
 * payment.captured, payment.failed, refund.failed, transfer.processed and
 * transfer.failed, and to product.route.under_review, needs_clarification and
 * activated, which move an expert's linked account through the gateway's
 * review (the hourly job asks after it as well). The school
 * fees webhook (/api/webhooks/razorpay/{schoolId}) is a different door with
 * a different secret: a school's account is the school's, this one is the
 * company's, and neither can forge the other's.
 *
 * THE SAME RULES AS THE FEES WEBHOOK. The signature is checked over the raw
 * body, read under the 64 KB cap, before a byte of it is believed; the event
 * is stored once by the id the SIGNED BODY states (its own `id`, else the
 * kind plus the entity it names plus the gateway's `created_at`, else a
 * digest of the body), never a header, so a redelivery of a handled event answers "already" and
 * settles nothing twice; every capture goes through settleSeatPayment, the
 * one door the checkout's confirm and the devbox page use too; and after a
 * good signature the answer is 200 once the work is done, even for an
 * unknown order, since a non-2xx would only make the gateway retry the same
 * thing. 404 when this server has no gateway, 401 for a bad signature.
 *
 * ⚠ HANDLED MEANS DONE (QA-02, QA campaign of 24 October 2026; SEC-2). The
 * row's existence used to count as "seen", so a settlement that threw after
 * the row was written was answered "already" on the retry and the capture
 * never recorded. An event is handled only once `processedAt` is set after
 * its work; a throw answers 500 with a body and leaves it for the retry; a
 * second delivery while the first works is 409. See src/lib/webhook-events.ts.
 */
type WebhookBody = { event?: string; id?: string; account_id?: string; created_at?: number; payload?: Record<string, { entity?: Record<string, unknown>; data?: unknown }> };

function signedEventId(event: WebhookBody, kind: string, raw: string): string | null {
  if (typeof event.id === "string" && event.id.trim()) return event.id.trim().slice(0, 120);
  if (!event.event) return null;
  const entity = (event.payload?.payment?.entity ?? event.payload?.refund?.entity ?? event.payload?.transfer?.entity ?? event.payload?.merchant_product?.entity) as { id?: unknown } | undefined;
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

  // QA-02 (24 Oct 2026): handled means processedAt set, and only after the work; a throw is a 500 the gateway retries.
  const key = { provider_eventId: { provider: "RAZORPAY", eventId } };
  const ledger: EventLedger = {
    find: () => db.gigGatewayEvent.findUnique({ where: key, select: { id: true, processedAt: true, outcome: true } }),
    create: () => db.gigGatewayEvent.create({ data: { provider: "RAZORPAY", eventId, kind, payloadJson: raw.slice(0, 20_000), outcome: "processing" }, select: { id: true, processedAt: true, outcome: true } }),
    claim: async (id, staleBefore, now) => (await db.gigGatewayEvent.updateMany({ where: claimableWhere(id, staleBefore), data: { outcome: "processing", receivedAt: now } })).count,
    finish: async (id, outcome) => void (await db.gigGatewayEvent.updateMany({ where: { id, processedAt: null }, data: { processedAt: new Date(), outcome } })),
    release: async (id) => void (await db.gigGatewayEvent.updateMany({ where: { id, processedAt: null }, data: { outcome: "error" } })),
  };

  return handleEventOnce(ledger, kind, "webhooks/gateway/sessions", async () => {
    const payment = event.payload?.payment?.entity as { id?: string; order_id?: string; amount?: number; error_description?: string } | undefined;
    const refund = event.payload?.refund?.entity as { id?: string; error_description?: string; status_details?: { description?: string } } | undefined;
    const transfer = event.payload?.transfer?.entity as { id?: string; source?: string; error?: { description?: string } } | undefined;
    const product = event.payload?.merchant_product as { entity?: { id?: string; merchant_id?: string; activation_status?: string }; data?: { requirements?: { field_reference?: string; reason_code?: string }[] } } | undefined;
    const isSource = (s: string | undefined): s is string => Boolean(s && (s.startsWith("pay_") || s.startsWith("order_")));
    if (kind === "payment.captured" && payment?.id && payment.order_id && typeof payment.amount === "number") {
      return (await settleSeatPayment({ orderId: payment.order_id, gatewayPaymentId: payment.id, amountPaise: payment.amount })).outcome;
    }
    if (kind === "payment.failed" && payment?.order_id) {
      return (await markOrderFailed(payment.order_id, payment.error_description ?? "failed at the gateway")) ? "failed" : "ignored";
    }
    if (kind === "transfer.processed" && transfer?.id && isSource(transfer.source)) {
      return (await markTransferProcessed({ transferId: transfer.id, source: transfer.source })) ? "transfer-known" : "ignored";
    }
    if ((kind === "transfer.failed" || kind === "transfers.failed") && isSource(transfer?.source)) {
      return (await markTransferFailed({ source: transfer.source, reason: transfer.error?.description ?? "the transfer failed at the gateway" })) ? "transfer-failed" : "ignored";
    }
    if (kind.startsWith("product.route.") && product?.entity?.id) {
      const accountId = product.entity.merchant_id ?? event.account_id;
      if (!accountId) return "ignored";
      return (await markRouteProduct({ accountId, productId: product.entity.id, status: product.entity.activation_status ?? kind.slice("product.route.".length), requirements: Array.isArray(product.data?.requirements) ? product.data.requirements : [] })) ? "route-status" : "ignored";
    }
    if (kind === "refund.failed" && refund?.id) {
      return (await markSeatRefundFailed(refund.id, refund.error_description ?? refund.status_details?.description ?? "failed at the gateway")) ? "refund-failed" : "ignored";
    }
    return "ignored";
  });
}
