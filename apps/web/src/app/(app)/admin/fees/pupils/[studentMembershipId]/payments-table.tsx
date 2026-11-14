"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import { formatPaise, parseRupees } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import { METHOD_KEY, PAY_STATUS_KEY, PAY_STATUS_TONE, receiptHref } from "../../labels";
import { refundPaymentAction, reversePaymentAction } from "./actions";

export type PaymentRow = {
  id: string;
  amountPaise: number;
  method: string;
  status: string;
  reference: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  collectedBy: string | null;
  payer: string | null;
  receipt: { id: string; serial: string } | null;
  reversalReason: string | null;
  refundedPaise: number;
};

type Open = { paymentId: string; what: "reverse" | "refund" } | null;

/**
 * The pupil's payments. A PAID one can be reversed (a mistake at the
 * counter) or refunded (money going back); a REFUNDED one can be refunded
 * further up to what was paid. Both ask why inline, on the row.
 */
export function PaymentsTable({ studentMembershipId, payments, timezone, office }: { studentMembershipId: string; payments: PaymentRow[]; timezone: string; office: boolean }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<Open>(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function begin(paymentId: string, what: "reverse" | "refund", p: PaymentRow) {
    setError(null);
    setReason("");
    setAmount(what === "refund" ? String((p.amountPaise - p.refundedPaise) / 100) : "");
    setOpen({ paymentId, what });
  }

  function go(p: PaymentRow) {
    if (!open) return;
    setError(null);
    if (reason.trim().length < 3) return setError(t("fees.refuseReason"));
    startTransition(async () => {
      let result;
      if (open.what === "reverse") result = await reversePaymentAction(studentMembershipId, p.id, reason.trim());
      else {
        const amountPaise = parseRupees(amount);
        if (amountPaise === null || amountPaise < 100) return setError(t("fees.refuseAmount"));
        result = await refundPaymentAction(studentMembershipId, p.id, amountPaise, reason.trim());
      }
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: open.what === "reverse" ? t("fees.reverseDone") : t("fees.refundDone") });
      setOpen(null);
      router.refresh();
    });
  }

  if (payments.length === 0) return <p className="text-sm text-fg-muted">{t("fees.parentNoHistory")}</p>;

  return (
    <ul className="divide-y divide-border">
      {payments.map((p) => {
        // Money the gateway captured goes back with Refund; Reverse is for a mistake at the counter (TA-256).
        const canReverse = office && p.status === "PAID" && p.method !== "ONLINE";
        const canRefund = office && (p.status === "PAID" || p.status === "REFUNDED" || p.status === "UNALLOCATED") && p.refundedPaise < p.amountPaise;
        const editing = open?.paymentId === p.id ? open : null;
        return (
          <li key={p.id} className="space-y-2 py-3" data-testid="fee-payment-row" data-payment-id={p.id} data-status={p.status}>
            <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tabular-nums text-fg">{formatPaise(p.amountPaise, locale)}</span>
                  <Badge tone={PAY_STATUS_TONE[p.status] ?? "neutral"} size="sm">
                    {PAY_STATUS_KEY[p.status] ? t(PAY_STATUS_KEY[p.status]!) : p.status}
                  </Badge>
                  <span className="text-fg-muted">{METHOD_KEY[p.method] ? t(METHOD_KEY[p.method]!) : p.method}</span>
                  {p.reference && <span className="font-mono text-xs text-fg-muted">{p.reference}</span>}
                </div>
                <div className="mt-0.5 text-xs text-fg-muted">
                  {formatDate(new Date(p.paidAt ?? p.createdAt), timezone)}
                  {p.collectedBy && <> · {t("fees.collectedBy", { name: p.collectedBy })}</>}
                  {p.payer && <> · {t("fees.paidBy", { name: p.payer })}</>}
                  {p.receipt && (
                    <>
                      {" · "}
                      <Link href={receiptHref(p.receipt.id)} className="font-medium text-accent-strong hover:underline" data-testid="fee-payment-receipt">
                        {t("fees.receiptOpen")} {p.receipt.serial}
                      </Link>
                    </>
                  )}
                  {p.refundedPaise > 0 && <> · {t("fees.receiptRefundedBanner", { amount: formatPaise(p.refundedPaise, locale) })}</>}
                  {p.reversalReason && <> · {t("fees.receiptReversedBanner", { reason: p.reversalReason })}</>}
                  {p.note && <> · {p.note}</>}
                </div>
              </div>
              {(canReverse || canRefund) && !editing && (
                <span className="flex gap-1">
                  {canReverse && (
                    <Button size="sm" variant="ghost" onClick={() => begin(p.id, "reverse", p)} disabled={pending}>
                      {t("fees.reverseTitle")}
                    </Button>
                  )}
                  {canRefund && (
                    <Button size="sm" variant="ghost" onClick={() => begin(p.id, "refund", p)} disabled={pending}>
                      {t("fees.refundTitle")}
                    </Button>
                  )}
                </span>
              )}
            </div>
            {editing && (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
                {error && (
                  <p role="alert" className="text-sm font-medium text-danger">
                    {error}
                  </p>
                )}
                {editing.what === "refund" && <p className="text-xs text-fg-muted">{p.method === "ONLINE" ? t("fees.refundOnlineNote") : t("fees.refundOfflineNote")}</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {editing.what === "refund" && <TextField label={t("fees.refundAmount")} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}
                  <TextField label={editing.what === "reverse" ? t("fees.reverseWhy") : t("fees.refundWhy")} required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={editing.what === "reverse" ? "danger" : "primary"} loading={pending} onClick={() => go(p)}>
                    {editing.what === "reverse" ? t("fees.reverseGo") : t("fees.refundGo")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpen(null)} disabled={pending}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
