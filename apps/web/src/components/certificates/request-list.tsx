"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUUpLeftIcon, EnvelopeOpenIcon } from "@phosphor-icons/react";
import type { CertificateRequestStatus, CertificateRequestView } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { cancelRequestAction } from "@/app/(app)/parent/certificates/actions";
import { CERTIFICATE_KIND_KEY } from "./labels";

/** The words and the colour for each state a request can be in. */
export const REQUEST_STATUS: Record<CertificateRequestStatus, { key: TranslationKey; tone: "warn" | "ok" | "danger" | "neutral" }> = {
  PENDING: { key: "certificateRequests.statusPending", tone: "warn" },
  ISSUED: { key: "certificateRequests.statusIssued", tone: "ok" },
  DECLINED: { key: "certificateRequests.statusDeclined", tone: "danger" },
  CANCELLED: { key: "certificateRequests.statusCancelled", tone: "neutral" },
};

/**
 * The family's requests, newest first: what was asked, when, and what came
 * of it. An issued one links to the paper; a declined one carries the
 * office's reason; a pending one can be taken back, after one question,
 * because the office may already be looking at it.
 */
export function CertificateRequestList({ items, from }: { items: CertificateRequestView[]; from: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <EmptyState className="border-0 bg-transparent py-6" icon={<EnvelopeOpenIcon weight="duotone" className="size-6" />} title={t("certificateRequests.none")} description={t("certificateRequests.noneBody")} />;
  }

  function cancel(item: CertificateRequestView) {
    if (!window.confirm(`${t("certificateRequests.cancel")}: ${t(CERTIFICATE_KIND_KEY[item.kind])}?`)) return;
    startTransition(async () => {
      const result = await cancelRequestAction(item.id);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("certificateRequests.cancelled") });
      router.refresh();
    });
  }

  const link = "inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent-strong underline underline-offset-2 hover:text-accent";
  return (
    <ul className="divide-y divide-border" data-testid="certificate-requests">
      {items.map((item) => {
        const status = REQUEST_STATUS[item.status];
        return (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3" data-status={item.status}>
            <div className="min-w-0 flex-1 basis-56">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-fg">{t(CERTIFICATE_KIND_KEY[item.kind])}</span>
                <Badge tone={status.tone} size="sm">
                  {t(status.key)}
                </Badge>
              </p>
              <p className="mt-0.5 text-sm text-fg">{item.purpose}</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                {[t("certificateRequests.askedOn", { date: formatDate(new Date(item.createdAt)) }), item.status === "ISSUED" && item.serial ? t("certificateRequests.issuedAs", { serial: item.serial }) : null, item.status === "DECLINED" && item.declineReason ? t("certificateRequests.declinedBecause", { reason: item.declineReason }) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className="flex shrink-0 flex-wrap items-center gap-3">
              {item.status === "ISSUED" && item.certificateId && (
                <Link href={`/certificates/${item.certificateId}?from=${encodeURIComponent(from)}`} className={link}>
                  {t("certificateRequests.openCertificate")}
                </Link>
              )}
              {item.status === "PENDING" && (
                <Button variant="ghost" size="sm" icon={<ArrowUUpLeftIcon weight="bold" />} loading={pending} onClick={() => cancel(item)} data-testid={`cancel-${item.id}`}>
                  {t("certificateRequests.cancel")}
                </Button>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
