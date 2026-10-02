import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { readBounded, WEBHOOK_BODY_LIMIT } from "@/lib/api-v1";
import { db } from "@/lib/db";
import { verifySessionsWebhook, webhookSecret } from "@/lib/gig-gateway";
import { activatePayoutAccount, markOrderFailed, markSeatRefundFailed, markTransferFailed, recordSettlement, suspendPayoutAccount } from "@/lib/gig-payments";
import { settleSeatPayment } from "@/lib/gig-sessions";
import { writeJson } from "@/lib/json";

/**
 * POST /api/webhooks/gateway/sessions — the COMPANY'S gateway telling us what
 * happened to a paid seat (decision 0004, amended 2026-10-02). The school
 * fees webhook (/api/webhooks/razorpay/{schoolId}) is a different door with
 * a different secret: a school's account is the school's, this one is the
 * company's, and neither can forge the other's.
 *
 * THE SAME RULES AS THE FEES WEBHOOK. The signature is checked over the raw
 * body, read under the 64 KB cap, before a byte of it is believed; the event
 * is stored once by the id the SIGNED BODY states (its own `id`, else the
 * kind plus the entity it names plus the gateway's `created_at`, else a
 * digest of the body), never a header, so a redelivery answers "already" and
 * settles nothing twice; every capture goes through settleSeatPayment, the
 * one door the checkout's confirm and the devbox page use too; and after a
 * good signature the answer is 200 even for an unknown order, since a
 * non-2xx would only make the gateway retry the same thing. 404 when this
 * server has no gateway, 401 for a bad signature.
 */
type WebhookBody = { event?: string; id?: string; created_at?: number; payload?: Record<string, { entity?: Record<string, unknown> }> };

function signedEventId(event: WebhookBody, kind: string, raw: string): string | null {
  if (typeof event.id === "string" && event.id.trim()) return event.id.trim().slice(0, 120);
  if (!event.event) return null;
  const entity = (event.payload?.payment?.entity ?? event.payload?.transfer?.entity ?? event.payload?.refund?.entity ?? event.payload?.account?.entity) as { id?: unknown } | undefined;
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

  const seen = await db.gigGatewayEvent.findUnique({ where: { provider_eventId: { provider: "RAZORPAY", eventId } }, select: { id: true } });
  if (seen) return NextResponse.json({ ok: true, outcome: "already" });
  const row = await db.gigGatewayEvent.create({ data: { provider: "RAZORPAY", eventId, kind, payloadJson: raw.slice(0, 20_000) }, select: { id: true } });

  let outcome = "ignored";
  const payment = event.payload?.payment?.entity as { id?: string; order_id?: string; amount?: number; error_description?: string } | undefined;
  const transfer = event.payload?.transfer?.entity as { id?: string; settlement_id?: string | null; error?: { description?: string } | null } | undefined;
  const refund = event.payload?.refund?.entity as { id?: string; error_description?: string; status_details?: { description?: string } } | undefined;
  const account = event.payload?.account?.entity as { id?: string; status?: string } | undefined;
  if (kind === "payment.captured" && payment?.id && payment.order_id && typeof payment.amount === "number") {
    outcome = (await settleSeatPayment({ orderId: payment.order_id, gatewayPaymentId: payment.id, amountPaise: payment.amount })).outcome;
  } else if (kind === "payment.failed" && payment?.order_id) {
    outcome = (await markOrderFailed(payment.order_id, payment.error_description ?? "failed at the gateway")) ? "failed" : "ignored";
  } else if (kind === "transfer.settled" && transfer?.id && transfer.settlement_id) {
    outcome = (await recordSettlement(transfer.id, transfer.settlement_id)) ? "settled" : "ignored";
  } else if (kind === "transfer.failed" && transfer?.id) {
    outcome = (await markTransferFailed(transfer.id, transfer.error?.description ?? "failed at the gateway")) ? "transfer-failed" : "ignored";
  } else if (kind === "refund.failed" && refund?.id) {
    outcome = (await markSeatRefundFailed(refund.id, refund.error_description ?? refund.status_details?.description ?? "failed at the gateway")) ? "refund-failed" : "ignored";
  } else if (kind === "account.activated" && account?.id) {
    const owner = await db.expertPayoutAccount.findFirst({ where: { linkedAccountId: account.id }, select: { expertUserId: true } });
    outcome = owner && (await activatePayoutAccount(owner.expertUserId, "webhook")) ? "account-active" : "ignored";
  } else if ((kind === "account.suspended" || kind === "account.rejected") && account?.id) {
    outcome = (await suspendPayoutAccount(account.id, kind)) ? "account-suspended" : "ignored";
  }
  await db.gigGatewayEvent.update({ where: { id: row.id }, data: { processedAt: new Date(), outcome } });
  return NextResponse.json({ ok: true, outcome, meta: writeJson({ kind }) });
}
