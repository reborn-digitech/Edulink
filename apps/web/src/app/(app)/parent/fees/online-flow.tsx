"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
import { Button, Spinner } from "@/components/ui/button";
import { formatPaise } from "@edulink/i18n";
import { useLocale, useT } from "@/lib/i18n";
import { feesApi, feesErrorMessage, pollPayment, type Checkout, type PaymentStatus } from "./api";

/**
 * Paying online: an order at the SCHOOL'S gateway, the gateway's own checkout
 * in front of it, and a poll until the platform hears the money arrived.
 *
 * TWO TRANSPORTS, decided by the server. With a real gateway the checkout
 * script is loaded from checkout.razorpay.com (once) and opened on the order;
 * its handler posts the signature back so the payment settles even when the
 * webhook is slow. In devbox mode there is no script and no page — the order
 * sits INITIATED until somebody marks it paid on /dev/payments — so the flow
 * just says so and polls the same status route.
 */
const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScript: Promise<void> | null = null;

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

type Phase =
  | { kind: "starting" }
  | { kind: "devbox"; paymentId: string }
  | { kind: "open" }
  | { kind: "checking" }
  | { kind: "paid"; status: PaymentStatus }
  | { kind: "failed"; reason: string | null }
  | { kind: "cancelled" }
  | { kind: "unconfirmed" }
  | { kind: "error"; message: string };

export function OnlineFlow({ studentMembershipId, demandIds, resumePaymentId = null, onClose }: { studentMembershipId: string; demandIds: string[]; resumePaymentId?: string | null; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "starting" });
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // ⚠ ONE ORDER PER MOUNT, AND ITS ANSWER IS ALWAYS KEPT. React's strict
    // mode runs this effect twice in development; the ref stops the second
    // order, and there is deliberately NO cleanup that aborts the first —
    // it used to, so the first run's answer was thrown away and the second
    // run never started, and the panel sat on "opening…" with a 201 in the
    // network tab. The poll is bounded to a minute, so a panel closed early
    // costs a few harmless status reads and then stops on its own.
    if (started.current) return;
    started.current = true;
    const abort = new AbortController();

    const finish = (status: PaymentStatus | null) => {
      if (abort.signal.aborted) return;
      if (status?.status === "PAID") {
        setPhase({ kind: "paid", status });
        router.refresh();
      } else if (status?.status === "FAILED") {
        setPhase({ kind: "failed", reason: status.failedReason });
        router.refresh();
      } else {
        setPhase({ kind: "unconfirmed" });
      }
    };

    (async () => {
      let order: Checkout;
      try {
        if (resumePaymentId) {
          // An order the phone app already created: pick it up rather than
          // make a second one. Already settled or failed, and the poll's
          // usual ending says so.
          const status = await feesApi<PaymentStatus>(`/api/v1/fees/family/payments/${encodeURIComponent(resumePaymentId)}`);
          if (!status.checkout) {
            finish(status.status === "PAID" || status.status === "FAILED" ? status : null);
            return;
          }
          order = status.checkout;
        } else {
          order = await feesApi<Checkout>("/api/v1/fees/family/checkout", { method: "POST", body: { studentMembershipId, demandIds } });
        }
      } catch (error) {
        setPhase({ kind: "error", message: feesErrorMessage(error, t("common.tryAgainMoment")) });
        return;
      }
      if (abort.signal.aborted) return;
      setCheckout(order);

      if (order.transport === "devbox") {
        setPhase({ kind: "devbox", paymentId: order.paymentId });
        finish(await pollPayment(order.paymentId, abort.signal));
        return;
      }

      try {
        await loadCheckoutScript();
      } catch {
        setPhase({ kind: "error", message: t("fees.refuseGatewayDown") });
        return;
      }
      if (abort.signal.aborted || !window.Razorpay) return;

      let handled = false;
      const gateway = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        order_id: order.orderId,
        name: order.schoolName,
        description: order.pupilName,
        prefill: { name: order.payerName, email: order.payerEmail ?? undefined },
        handler: (response) => {
          handled = true;
          setPhase({ kind: "checking" });
          void (async () => {
            try {
              await feesApi("/api/v1/fees/family/checkout/confirm", {
                method: "POST",
                body: { paymentId: order.paymentId, gatewayPaymentId: response.razorpay_payment_id, signature: response.razorpay_signature },
              });
            } catch {
              // The webhook is the settlement of record; the poll below
              // still finds a payment the confirm could not verify in time.
            }
            finish(await pollPayment(order.paymentId, abort.signal));
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

    // The ids are fixed for the life of one attempt; a new choice mounts a new flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amount = checkout ? formatPaise(checkout.amountPaise, locale) : null;

  return (
    <div className="space-y-3 rounded-[--radius-md] border border-border bg-surface-muted p-4" aria-live="polite" data-testid="fees-online-flow">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-fg">{t("fees.onlineTitle")}</p>
        {amount && <p className="text-sm font-semibold tabular-nums text-fg">{amount}</p>}
      </div>

      {(phase.kind === "starting" || phase.kind === "open") && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner className="size-4" />
          {t("fees.onlineOpening")}
        </p>
      )}
      {phase.kind === "checking" && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner className="size-4" />
          {t("fees.onlineChecking")}
        </p>
      )}
      {phase.kind === "devbox" && (
        <div className="space-y-2 text-sm text-fg-muted" data-testid="fees-online-devbox" data-payment-id={phase.paymentId}>
          <p className="flex items-center gap-2">
            <Spinner className="size-4" />
            {t("fees.onlineChecking")}
          </p>
          <p>
            {t("fees.onlineDevbox")}{" "}
            <Link href="/dev/payments" target="_blank" className="font-semibold text-accent-strong underline underline-offset-2">
              /dev/payments
            </Link>
          </p>
        </div>
      )}
      {phase.kind === "paid" && (
        <div className="space-y-2" data-testid="fees-online-paid">
          <p className="flex items-center gap-2 text-sm font-medium text-ok">
            <CheckCircleIcon weight="fill" className="size-4 shrink-0" />
            {t("fees.onlineDone", { serial: phase.status.serial ?? "—" })}
          </p>
          {phase.status.receiptId && (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/fees/receipts/${phase.status.receiptId}`}>{t("fees.receiptOpen")}</Link>
            </Button>
          )}
        </div>
      )}
      {phase.kind === "failed" && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <WarningIcon weight="fill" className="size-4 shrink-0" />
          {t("fees.parentFailed")}
          {phase.reason ? ` · ${phase.reason}` : ""}
        </p>
      )}
      {phase.kind === "cancelled" && <p className="text-sm text-fg-muted">{t("fees.onlineCancelled")}</p>}
      {phase.kind === "unconfirmed" && <p className="text-sm text-fg-muted">{t("fees.onlineNotYet")}</p>}
      {phase.kind === "error" && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <WarningIcon weight="fill" className="size-4 shrink-0" />
          {phase.message}
        </p>
      )}

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
