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
import { REQUEST_STATUS } from "@/components/certificates/request-list";
import { declineRequestAction } from "../actions";

/**
 * The queue above the issue form: what families have asked for, pending
 * first. "Issue this" carries the pupil, the request and the kind into the
 * form beneath, which preselects the first template of that kind and takes
 * the request's purpose; "Decline" opens a reason on the row — it will not
 * go without one, because the reason is what the family reads.
 */
export function RequestQueue({ items, pending }: { items: CertificateRequestView[]; pending: number }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, startTransition] = useTransition();
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Card data-testid="request-queue">
      <CardHeader
        icon={<TrayIcon weight="duotone" className="size-5" />}
        title={t("certificateRequests.queueTitle")}
        description={t("certificateRequests.queueIntro")}
        action={
          pending > 0 ? (
            <span data-testid="request-pending-count">
              <Badge tone="warn">{t("certificateRequests.pendingCount", { count: pending })}</Badge>
            </span>
          ) : undefined
        }
      />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState className="border-0 bg-transparent py-6" icon={<TrayIcon weight="duotone" className="size-6" />} title={t("certificateRequests.queueEmpty")} description={t("certificateRequests.queueEmptyBody")} />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const status = REQUEST_STATUS[item.status];
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
                        {[item.requestedByName, t("certificateRequests.askedOn", { date: formatDate(new Date(item.createdAt)) }), item.status === "ISSUED" && item.serial ? t("certificateRequests.issuedAs", { serial: item.serial }) : null, item.status === "DECLINED" && item.declineReason ? t("certificateRequests.declinedBecause", { reason: item.declineReason }) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {isPending && (
                      <span className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button asChild size="sm" icon={<SealCheckIcon weight="bold" />}>
                          <Link href={`/admin/certificates/issue?membershipId=${item.studentMembershipId}&requestId=${item.id}&kind=${item.kind}`} data-testid={`issue-from-${item.id}`}>
                            {t("certificateRequests.issueFromRequest")}
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" icon={<ProhibitIcon weight="bold" />} onClick={() => open(item.id)} aria-expanded={declining === item.id} data-testid={`decline-${item.id}`}>
                          {t("certificateRequests.decline")}
                        </Button>
                      </span>
                    )}
                  </div>
                  {isPending && declining === item.id && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        decline(item.id);
                      }}
                      noValidate
                      className="flex flex-wrap items-end gap-3 rounded-[--radius-md] border border-danger/30 bg-danger-soft/40 p-3"
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
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
