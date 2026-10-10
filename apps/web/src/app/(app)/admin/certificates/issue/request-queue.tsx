"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProhibitIcon, SealCheckIcon, TrayIcon } from "@phosphor-icons/react";
import type { CertificateRequestView } from "@edulink/contracts";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { CERTIFICATE_KIND_KEY } from "@/components/certificates/labels";
import { requestStatus } from "@/components/certificates/request-list";
import { declineRequestAction, setRequestFeeAction } from "../actions";
import { formatPaise } from "@edulink/i18n";

/**
 * The queue above the issue form: what families have asked for, pending
 * first. "Issue this" carries the pupil, the request and the kind into the
 * form beneath, which preselects the first template of that kind and takes
 * the request's purpose; "Decline" opens a reason on the row — it will not
 * go without one, because the reason is what the family reads.
 */
/**
 * 10 October 2026 (the owner's report): a fee field sat under an issued and a withdrawn request, where the
 * server refuses it anyway, and the request being issued above still sat in the queue below. Now the fee is
 * set on a waiting request only; answered requests fold away under their own heading with no controls; and the
 * request the form above is issuing for is left out of the queue (`excludeId`).
 */
export function RequestQueue({ items, excludeId }: { items: CertificateRequestView[]; pending?: number; excludeId?: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, startTransition] = useTransition();
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<Record<string, string>>({});

  /** G-6: the office sets what a paper costs; a demand on the pupil's ledger, paid at the office. */
  function setFee(id: string) {
    startTransition(async () => {
      const result = await setRequestFeeAction(id, fees[id] ?? "");
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("certificateRequests.feeSet") });
      router.refresh();
    });
  }

  function open(id: string) {
    setDeclining((current) => (current === id ? null : id));
    setReason("");
    setError(null);
  }

  function decline(id: string) {
    setError(null);
    if (!reason.trim()) {
      setError(t("common.checkTheForm"));
      return;
    }
    startTransition(async () => {
      const result = await declineRequestAction(id, reason.trim().slice(0, 400));
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("certificateRequests.declined") });
      setDeclining(null);
      setReason("");
      router.refresh();
    });
  }

  const shown = items.filter((item) => item.id !== excludeId);
  const waiting = shown.filter((item) => item.status === "PENDING");
  const answered = shown.filter((item) => item.status !== "PENDING");
  const row = (item: CertificateRequestView) => {
    const status = requestStatus(item);
    const isPending = item.status === "PENDING";
    return (
      <li key={item.id} className="space-y-3 py-3" data-status={item.status}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 basis-56">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-fg">{item.studentName}</span>
              {item.className && <span className="text-sm text-fg-muted">{item.className}</span>}
              <Badge tone={status.tone} size="sm">
                {t(status.key)}
              </Badge>
            </p>
            <p className="mt-0.5 text-sm text-fg">
              <span className="font-medium">{t(CERTIFICATE_KIND_KEY[item.kind])}</span>
              {item.purpose ? ` — ${item.purpose}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {[item.requestedByName, t("certificateRequests.askedOn", { date: formatDate(new Date(item.createdAt)) }), item.status === "ISSUED" && item.serial ? t("certificateRequests.issuedAs", { serial: item.serial }) : null, item.revokedAt ? t("certificateRequests.revokedOn", { date: formatDate(new Date(item.revokedAt)) }) : null, item.status === "DECLINED" && item.declineReason ? t("certificateRequests.declinedBecause", { reason: item.declineReason }) : null, item.feePaise ? t(item.feePaid ? "certificateRequests.feePaidLine" : "certificateRequests.feeDue", { amount: formatPaise(item.feePaise) }) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {isPending && (
            <span className="flex shrink-0 flex-wrap items-center gap-2">
              <Button asChild size="sm" icon={<SealCheckIcon weight="bold" />}>
                <Link href={`/admin/certificates/issue?membershipId=${item.studentMembershipId}&requestId=${item.id}&kind=${item.kind}#issue`} data-testid={`issue-from-${item.id}`}>
                  {t("certificateRequests.issueFromRequest")}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" icon={<ProhibitIcon weight="bold" />} onClick={() => open(item.id)} aria-expanded={declining === item.id} data-testid={`decline-${item.id}`}>
                {t("certificateRequests.decline")}
              </Button>
            </span>
          )}
        </div>
        {isPending && !item.feePaid && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setFee(item.id);
            }}
            className="flex flex-wrap items-end gap-3"
            data-testid={`fee-form-${item.id}`}
          >
            <TextField
              label={t("certificateRequests.feeAmount")}
              inputMode="decimal"
              autoComplete="off"
              value={fees[item.id] ?? (item.feePaise ? (item.feePaise / 100).toFixed(2) : "")}
              onChange={(e) => setFees((f) => ({ ...f, [item.id]: e.target.value }))}
              className="w-40"
            />
            <Button type="submit" variant="secondary" size="sm" loading={busy}>
              {t("certificateRequests.setFee")}
            </Button>
          </form>
        )}
        {isPending && declining === item.id && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              decline(item.id);
            }}
            noValidate
            className="flex flex-wrap items-end gap-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft/40 p-3"
            data-testid={`decline-form-${item.id}`}
          >
            <TextField
              label={t("certificateRequests.declineReason")}
              value={reason}
              maxLength={400}
              required
              autoFocus
              autoComplete="off"
              placeholder={t("certificateRequests.declineReasonPlaceholder")}
              error={error ?? undefined}
              onChange={(e) => setReason(e.target.value)}
              className="min-w-0 flex-1 basis-64"
            />
            <Button type="submit" variant="danger" size="sm" loading={busy} icon={<ProhibitIcon weight="bold" />} data-testid={`decline-submit-${item.id}`}>
              {t("certificateRequests.decline")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => open(item.id)}>
              {t("common.cancel")}
            </Button>
          </form>
        )}
      </li>
    );
  };

  return (
    <Card data-testid="request-queue">
      <CardHeader
        icon={<TrayIcon weight="duotone" className="size-5" />}
        title={t("certificateRequests.queueTitle")}
        description={t("certificateRequests.queueIntro")}
        action={
          waiting.length > 0 ? (
            <span data-testid="request-pending-count">
              <Badge tone="warn">{t("certificateRequests.pendingCount", { count: waiting.length })}</Badge>
            </span>
          ) : undefined
        }
      />
      <CardBody>
        {shown.length === 0 ? (
          <EmptyState className="border-0 bg-transparent py-6" icon={<TrayIcon weight="duotone" className="size-6" />} title={t("certificateRequests.queueEmpty")} description={t("certificateRequests.queueEmptyBody")} />
        ) : (
          <>
            {waiting.length > 0 ? (
              <ul className="divide-y divide-border" data-testid="request-waiting">
                {waiting.map(row)}
              </ul>
            ) : (
              <p className="py-2 text-sm text-fg-muted" data-testid="request-none-waiting">
                {t("certificateRequests.noneWaiting")}
              </p>
            )}
            {answered.length > 0 && (
              <details className="mt-3 border-t border-border pt-3" data-testid="request-answered">
                <summary className="tap flex cursor-pointer items-center text-sm font-medium text-fg-muted">{t("certificateRequests.answeredTitle", { count: answered.length })}</summary>
                <ul className="divide-y divide-border">{answered.map(row)}</ul>
              </details>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
