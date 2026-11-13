"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import { CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
import type { GigCheckout, GigPaymentStatus } from "@edulink/contracts";
import { Button, Spinner } from "@/components/ui/button";
import { formatPaise } from "@edulink/i18n";
import { useLocale, useT } from "@/lib/i18n";

/**
 * Paying for a workshop seat: the order at the COMPANY'S gateway, the
 * gateway's own checkout in front of it, and a poll until the platform hears
 * the money arrived — the fees panel's shape (parent/fees/online-flow.tsx),
 * on the sessions' own doors. With a real gateway the checkout script is
 * loaded once and opened on the order; its handler posts the signature back
 * so the seat confirms even when the webhook is slow. Under devbox there is
 * no script: the order sits INITIATED until it is marked paid on
 * /dev/payments, and the panel says so and polls the same status route.
 *
 * `checkout` is the order the booking (or consent) just made; `paymentId`
 * alone resumes one the phone started, read back from the status route.
 */
const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScript: Promise<void> | null = null;
const POLL_EVERY_MS = 2_000;
const POLL_FOR_MS = 60_000;

function loadCheckoutScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (!checkoutScript) {
    checkoutScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        checkoutScript = null;
        reject(new Error("checkout script"));
      };
      document.head.appendChild(script);
    });
  }
  return checkoutScript;
}

async function call<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, { method: init.method ?? "GET", credentials: "include", headers: { accept: "application/json", ...(init.body !== undefined ? { "content-type": "application/json" } : {}) }, body: init.body !== undefined ? JSON.stringify(init.body) : undefined, cache: "no-store" });
  const json = (await response.json().catch(() => null)) as { error?: unknown } | null;
  if (!response.ok) throw new Error(typeof json?.error === "string" ? json.error : `HTTP ${response.status}`);
  return json as T;
}

/**
 * WHICH DOORS THE PANEL SPEAKS TO (plans-pay, 17 Oct 2026): a seat's by default; a pass bought for a plan
 * (src/lib/pass-orders.ts) passes its own status and confirm doors, its title and its note, and is otherwise the same
 * panel — the gateway's script, the devbox wait, the poll. A pass waits as CREATED where a seat waits as INITIATED.
 */
export type CheckoutDoors = { status: (paymentId: string) => string; confirm: (paymentId: string) => string; confirmBody?: (paymentId: string) => Record<string, string>; title?: string; doneText?: string; note?: string };
const SEAT_DOORS: CheckoutDoors = { status: (id) => `/api/v1/gigs/payments/${encodeURIComponent(id)}`, confirm: (id) => `/api/v1/gigs/payments/${encodeURIComponent(id)}/confirm` };
/** A status read by either kind of door: the seat's GigPaymentStatus, or a pass's { status, reason, checkout }. */
type PolledStatus = { status: string; reason: string | null; checkout: GigCheckout | null };
const WAITING = new Set(["INITIATED", "CREATED"]);

async function poll(paymentId: string, signal: AbortSignal, doors: CheckoutDoors = SEAT_DOORS): Promise<PolledStatus | null> {
  const until = Date.now() + POLL_FOR_MS;
  while (!signal.aborted && Date.now() < until) {
    try {
      const status = await call<PolledStatus>(doors.status(paymentId));
      if (!WAITING.has(status.status)) return status;
    } catch {
      // A blip between polls is not a failed payment; the next tick asks again.
    }
    await new Promise((r) => setTimeout(r, POLL_EVERY_MS));
  }
  return null;
}

type Phase = { kind: "starting" } | { kind: "devbox"; paymentId: string } | { kind: "open" } | { kind: "checking" } | { kind: "paid" } | { kind: "failed"; reason: string | null } | { kind: "cancelled" } | { kind: "unconfirmed" } | { kind: "error"; message: string };

export function SeatCheckout({ checkout, paymentId, onClose, doors = SEAT_DOORS }: { checkout?: GigCheckout | null; paymentId?: string | null; onClose: () => void; doors?: CheckoutDoors }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "starting" });
  const [order, setOrder] = useState<GigCheckout | null>(checkout ?? null);
  const started = useRef(false);

  useEffect(() => {
    // One attempt per mount, its answer always kept (see online-flow.tsx on why there is no abort in cleanup).
    if (started.current) return;
    started.current = true;
    const abort = new AbortController();
    const finish = (status: PolledStatus | GigPaymentStatus | null) => {
      if (abort.signal.aborted) return;
      if (status && (status.status === "PAID" || status.status === "HELD" || status.status === "DUE" || status.status === "PAID_OUT")) {
        setPhase({ kind: "paid" });
        router.refresh();
      } else if (status?.status === "FAILED") {
        setPhase({ kind: "failed", reason: status.reason });
        router.refresh();
      } else setPhase({ kind: "unconfirmed" });
    };

    (async () => {
      let made: GigCheckout | null = checkout ?? null;
      if (!made && paymentId) {
        try {
          const status = await call<PolledStatus>(doors.status(paymentId));
          if (!status.checkout) {
            finish(WAITING.has(status.status) ? null : status);
            return;
          }
          made = status.checkout;
        } catch (error) {
          setPhase({ kind: "error", message: error instanceof Error ? error.message : t("common.tryAgainMoment") });
          return;
        }
      }
      if (!made) {
        setPhase({ kind: "error", message: t("gigs.refuseGatewayDown") });
        return;
      }
      setOrder(made);
      if (made.transport !== "razorpay") {
        setPhase({ kind: "devbox", paymentId: made.paymentId });
        finish(await poll(made.paymentId, abort.signal, doors));
        return;
      }
      try {
        await loadCheckoutScript();
      } catch {
        setPhase({ kind: "error", message: t("gigs.refuseGatewayDown") });
        return;
      }
      if (abort.signal.aborted || !window.Razorpay) return;
      const theOrder = made;
      let handled = false;
      const gateway = new window.Razorpay({
        key: theOrder.keyId,
        amount: theOrder.amountPaise,
        currency: theOrder.currency,
        order_id: theOrder.orderId,
        name: theOrder.title,
        description: theOrder.pupilName,
        prefill: { name: theOrder.payerName, email: theOrder.payerEmail ?? undefined },
        handler: (response) => {
          handled = true;
          setPhase({ kind: "checking" });
          void (async () => {
            try {
              await call(doors.confirm(theOrder.paymentId), { method: "POST", body: { ...(doors.confirmBody?.(theOrder.paymentId) ?? {}), gatewayPaymentId: response.razorpay_payment_id, signature: response.razorpay_signature } });
            } catch {
              // The webhook is the settlement of record; the poll still finds a payment the confirm could not verify in time.
            }
            finish(await poll(theOrder.paymentId, abort.signal, doors));
          })();
        },
        modal: {
          ondismiss: () => {
            if (!handled) setPhase({ kind: "cancelled" });
          },
        },
      });
      gateway.on("payment.failed", (response) => {
        handled = true;
        setPhase({ kind: "failed", reason: response.error?.description ?? null });
      });
      setPhase({ kind: "open" });
      gateway.open();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amount = order ? formatPaise(order.amountPaise, locale) : null;
  return (
    <div className="w-full space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-4" aria-live="polite" data-testid="seat-checkout">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-fg">{doors.title ?? t("gigs.payTitle")}</p>
        {amount && <p className="text-sm font-semibold tabular-nums text-fg">{amount}</p>}
      </div>
      {(phase.kind === "starting" || phase.kind === "open") && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner className="size-4" />
          {t("gigs.payOpening")}
        </p>
      )}
      {phase.kind === "checking" && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner className="size-4" />
          {t("gigs.payChecking")}
        </p>
      )}
      {phase.kind === "devbox" && (
        <div className="space-y-2 text-sm text-fg-muted" data-testid="seat-checkout-devbox" data-payment-id={phase.paymentId}>
          <p className="flex items-center gap-2">
            <Spinner className="size-4" />
            {t("gigs.payChecking")}
          </p>
          <p>
            {t("gigs.payDevbox")}{" "}
            <Link href="/dev/payments" target="_blank" className="font-semibold text-accent-strong underline underline-offset-2">
              /dev/payments
            </Link>
          </p>
        </div>
      )}
      {phase.kind === "paid" && (
        <p className="flex items-center gap-2 text-sm font-medium text-ok" data-testid="seat-checkout-paid">
          <CheckCircleIcon weight="fill" className="size-4 shrink-0" />
          {doors.doneText ?? t("gigs.payDone")}
        </p>
      )}
      {phase.kind === "failed" && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <WarningIcon weight="fill" className="size-4 shrink-0" />
          {t("gigs.payFailed")}
          {phase.reason ? ` · ${phase.reason}` : ""}
        </p>
      )}
      {phase.kind === "cancelled" && <p className="text-sm text-fg-muted">{t("gigs.payCancelled")}</p>}
      {phase.kind === "unconfirmed" && <p className="text-sm text-fg-muted">{t("gigs.payNotYet")}</p>}
      {phase.kind === "error" && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <WarningIcon weight="fill" className="size-4 shrink-0" />
          {phase.message}
        </p>
      )}
      <p className="text-xs text-fg-muted">{doors.note ?? t("gigs.payeeNote")}</p>
      {phase.kind !== "starting" && phase.kind !== "open" && phase.kind !== "checking" && (
        <div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {phase.kind === "paid" ? t("common.back") : t("common.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}
