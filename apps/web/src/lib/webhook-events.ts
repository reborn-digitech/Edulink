import "server-only";
import { NextResponse } from "next/server";
import { writeJson } from "./json";

/**
 * ONE GATEWAY EVENT, HANDLED ONCE AND NEVER ACKNOWLEDGED UNHANDLED (QA-02, QA campaign of 24 October 2026).
 *
 * The three payment webhooks — the school's fees door and the company's passes and seats doors — each stored the
 * event row first and took the row's EXISTENCE as "seen". A settlement that threw after the row was written left it
 * there with `processedAt` null, the throw went out as a bare 500 (or a 404 with no body, "stop sending"), and the
 * gateway's retry was answered 200 "already": a captured payment never recorded, nobody told.
 *
 * Now the row is a ledger of where the work stands, read by `processedAt` and `outcome`:
 *
 *   processedAt set               handled; a redelivery is "already".
 *   null, outcome "processing"    a delivery is working on it now; another is answered 409 so the gateway sends it
 *                                 again later. Each claim stamps `receivedAt` (the row's first insert, then every
 *                                 delivery that claims it), and a claim older than CLAIM_STALE_MS is taken to be a
 *                                 delivery that died: it may be claimed again.
 *   null, outcome "error"         the last try threw; the next delivery claims it and does the work again.
 *   null, outcome null            a row written before this fix and never finished; claimed like "error".
 *
 * The claim is one conditional update (or the row's own unique insert), so two deliveries of one event never both
 * work at once; the settlement functions behind it are idempotent besides (an order settles once whichever of the
 * webhook, the checkout's confirm and the reconcile job gets there first). A throw anywhere in the work or in
 * marking it done is answered 500 with a body, and the event stays re-processable.
 */

export const CLAIM_STALE_MS = 5 * 60_000;

export type EventRow = { id: string; processedAt: Date | null; outcome: string | null };

/** The four writes a door makes to its own event table, under whatever tenant binding it needs. */
export type EventLedger = {
  find(): Promise<EventRow | null>;
  /** Inserts the row already claimed (`outcome: "processing"`); throws P2002 when another delivery inserted it first. */
  create(): Promise<EventRow>;
  /** `updateMany` the row (`claimableWhere`) to outcome "processing" and `receivedAt` now; the count it changed. */
  claim(id: string, staleBefore: Date, now: Date): Promise<number>;
  finish(id: string, outcome: string): Promise<void>;
  release(id: string): Promise<void>;
};

const isUniqueViolation = (error: unknown) => (error as { code?: string } | null)?.code === "P2002";

/**
 * Runs `work` for one signed event at most once at a time, and answers the gateway: 200 with the outcome when it is
 * done (or was already), 409 while another delivery holds it, 500 with a body when it threw.
 */
export async function handleEventOnce(ledger: EventLedger, kind: string, label: string, work: () => Promise<string>, now: () => Date = () => new Date()): Promise<NextResponse> {
  let rowId: string | null = null;
  try {
    let row = await ledger.find();
    let claimed = false;
    if (!row) {
      try {
        row = await ledger.create();
        claimed = true;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        row = await ledger.find();
      }
    }
    if (!row) throw new Error("the event row vanished between its insert and its read");
    if (row.processedAt) return NextResponse.json({ ok: true, outcome: "already" });
    if (!claimed) {
      const at = now();
      claimed = (await ledger.claim(row.id, new Date(at.getTime() - CLAIM_STALE_MS), at)) === 1;
      if (!claimed) {
        const again = await ledger.find();
        if (again?.processedAt) return NextResponse.json({ ok: true, outcome: "already" });
        return NextResponse.json({ ok: false, code: "IN_PROGRESS", retry: true }, { status: 409 });
      }
    }
    rowId = row.id;
    const outcome = await work();
    await ledger.finish(row.id, outcome);
    return NextResponse.json({ ok: true, outcome, meta: writeJson({ kind }) });
  } catch (error) {
    console.error(`[${label}] event not processed; the gateway will retry`, error instanceof Error ? error.message : error);
    if (rowId) await ledger.release(rowId).catch(() => undefined);
    return NextResponse.json({ ok: false, code: "NOT_PROCESSED", retry: true }, { status: 500 });
  }
}

/**
 * The claim's condition, the same for every event table: not yet handled, and either unclaimed (null, "error") or
 * claimed so long ago that the delivery holding it must have died.
 */
export function claimableWhere(id: string, staleBefore: Date) {
  return {
    id,
    processedAt: null,
    OR: [{ outcome: null }, { outcome: { not: "processing" } }, { receivedAt: { lt: staleBefore } }],
  };
}
