"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPaise } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import { pupilHref } from "../labels";
import { confirmClaimAction, rejectClaimAction } from "./actions";

export type ClaimView = { paymentId: string; studentMembershipId: string; pupilName: string; className: string | null; amountPaise: number; utr: string | null; reference: string | null; claimedAt: string | null; payer: string | null; stale: boolean };

/** One waiting claim: confirm issues the receipt; reject asks why, and the family is told. */
export function ClaimRow({ claim, timezone, staleAfterDays }: { claim: ClaimView; timezone: string; staleAfterDays: number }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    startTransition(async () => {
      const result = await confirmClaimAction(claim.paymentId);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("fees.claimConfirmed", { serial: result.serial ?? "" }) });
      router.refresh();
    });
  }

  function reject() {
    setError(null);
    if (reason.trim().length < 3) return setError(t("fees.refuseReason"));
    startTransition(async () => {
      const result = await rejectClaimAction(claim.paymentId, reason.trim());
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.claimRejected") });
      setRejecting(false);
      router.refresh();
    });
  }

  return (
    <>
      <tr className={rejecting ? "bg-surface-muted" : undefined} data-testid="claim-row" data-payment-id={claim.paymentId}>
        <td className="px-4 py-3">
          <Link href={pupilHref(claim.studentMembershipId)} className="font-medium text-fg hover:underline">
            {claim.pupilName}
          </Link>
          {claim.className && <span className="ml-2 text-xs text-fg-muted">{claim.className}</span>}
        </td>
        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPaise(claim.amountPaise, locale)}</td>
        <td className="px-4 py-3 font-mono text-xs">{claim.utr ?? "—"}</td>
        <td className="px-4 py-3 font-mono text-xs text-fg-muted">{claim.reference ?? "—"}</td>
        <td className="px-4 py-3 text-fg-muted">
          <span className="flex flex-wrap items-center gap-2">
            {claim.claimedAt ? formatDate(new Date(claim.claimedAt), timezone) : "—"}
            {claim.stale && <Badge tone="danger" size="sm">{t("fees.claimStale", { days: staleAfterDays })}</Badge>}
          </span>
        </td>
        <td className="px-4 py-3 text-fg-muted">{claim.payer ?? "—"}</td>
        <td className="px-4 py-3 text-right">
          <span className="flex justify-end gap-1">
            <Button size="sm" loading={pending} onClick={confirm} disabled={rejecting} data-testid="claim-confirm">
              {t("fees.claimConfirm")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setError(null); setRejecting((r) => !r); }} disabled={pending}>
              {rejecting ? t("common.cancel") : t("fees.claimReject")}
            </Button>
          </span>
        </td>
      </tr>
      {rejecting && (
        <tr className="bg-surface-muted">
          <td colSpan={7} className="px-4 pb-3">
            <div className="flex flex-wrap items-end gap-2">
              <TextField label={t("fees.claimRejectWhy")} required maxLength={300} value={reason} error={error ?? undefined} onChange={(e) => setReason(e.target.value)} className="min-w-[16rem] flex-1" />
              <Button size="sm" variant="danger" loading={pending} onClick={reject} className="mb-1">
                {t("fees.claimReject")}
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
