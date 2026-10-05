"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { EXPERT_OFFERING_META, type ExpertOffering } from "@/lib/constants";
import { setStanding, decideKycAction } from "./actions";
import type { CurationEntry } from "@/lib/superuser";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import { TextAreaField } from "@/components/ui/field";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ExpertKyc } from "@edulink/contracts";

const KYC_KEY: Record<ExpertKyc["status"], TranslationKey> = { NONE: "expert.kycStatusNONE", SUBMITTED: "expert.kycStatusSUBMITTED", VERIFIED: "expert.kycStatusVERIFIED", REJECTED: "expert.kycStatusREJECTED" };
const KYC_TONE: Record<ExpertKyc["status"], "neutral" | "warn" | "ok" | "danger"> = { NONE: "neutral", SUBMITTED: "warn", VERIFIED: "ok", REJECTED: "danger" };

/**
 * One expert, and the two decisions an operator makes about them.
 *
 * THEY ARE TWO DECISIONS AND THE CONTROL SAYS SO. Published is "may schools
 * find this person"; verified is "has a human checked who they are". A single
 * approve button would collapse them, and a marketplace where being listed
 * implies being checked is one that tells schools something nobody did.
 *
 * Verify is offered only alongside publishing, because a verified badge on
 * somebody no school can see is a claim with no reader.
 */
export function CurationRow({ entry }: { entry: CurationEntry }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const published = entry.publishedAt !== null;
  const verified = entry.verifiedAt !== null;
  const kyc = entry.kyc;

  function decide(decision: "VERIFIED" | "REJECTED") {
    setError(null);
    startTransition(async () => {
      const result = await decideKycAction(entry.profileId, { decision, note: reason });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      setRejecting(false);
      setReason("");
      toast({ tone: "ok", title: decision === "VERIFIED" ? t("expert.kycVerifiedToast", { name: entry.name }) : t("expert.kycRejectedToast", { name: entry.name }) });
      router.refresh();
    });
  }

  function apply(next: { published: boolean; verified: boolean }, done: string) {
    setError(null);
    startTransition(async () => {
      const result = await setStanding(entry.profileId, next);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: done });
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-base font-bold text-fg">
            {entry.name}
            {published ? (
              <Badge tone="ok" size="sm">
                {t("expert.listed")}
              </Badge>
            ) : (
              <Badge tone="warn" size="sm">
                {t("expert.waiting")}
              </Badge>
            )}
            {verified && (
              <Badge tone="accent" size="sm">
                {t("expert.identityChecked")}
              </Badge>
            )}
          </p>
          <p className="mt-0.5 truncate text-sm text-fg-muted">
            {entry.headline || <em>{t("expert.noHeadline")}</em>}
            {entry.organisation && <> · {entry.organisation}</>}
          </p>
          {entry.email && <p className="mt-0.5 font-mono text-xs text-fg-subtle">{entry.email}</p>}
        </div>
      </div>

      <p className="mt-3 text-sm text-fg">
        <span className="font-semibold">
          {EXPERT_OFFERING_META[entry.offering as ExpertOffering]
            ? t(EXPERT_OFFERING_META[entry.offering as ExpertOffering].labelKey)
            : entry.offering}
        </span>
        {entry.mentorCapacity !== null && (
          <span className="text-fg-muted">
            {" · "}
            {t("expert.capacityAndActive", {
              cap: entry.mentorCapacity,
              active: entry.activeMentorships,
            })}
          </span>
        )}
      </p>

      {entry.specialisms.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {entry.specialisms.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-fg-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {entry.bio && (
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-fg-muted">{entry.bio}</p>
      )}

      {/* The papers: the KYC column. The ids open through /api/files, which admits the expert and the operator only. */}
      <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3" data-testid="kyc-row">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-fg">{t("expert.kycColumn")}</span>
          <Badge tone={KYC_TONE[kyc.status]} size="sm">
            {t(KYC_KEY[kyc.status])}
          </Badge>
          {kyc.submittedAt && <span className="text-xs text-fg-muted">{t("expert.kycSubmittedOn", { date: formatDate(new Date(kyc.submittedAt)) })}</span>}
          {kyc.decidedAt && <span className="text-xs text-fg-muted">{t("expert.kycDecidedOn", { date: formatDate(new Date(kyc.decidedAt)) })}</span>}
        </p>
        {kyc.note && <p className="text-sm text-fg-muted">{kyc.note}</p>}
        {kyc.documents.length === 0 ? (
          <p className="text-xs text-fg-muted">{t("expert.kycNoPapers")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2 text-sm">
            {kyc.documents.map((d, i) => (
              <li key={d.fileId}>
                <a href={`/api/files/${encodeURIComponent(d.fileId)}`} target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
                  {t("expert.kycOpenDocument", { n: i + 1 })}
                </a>
              </li>
            ))}
          </ul>
        )}
        {kyc.documents.length > 0 && kyc.status !== "VERIFIED" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={pending} onClick={() => decide("VERIFIED")} data-testid="kyc-verify">
              {t("expert.kycVerify")}
            </Button>
            {!rejecting && (
              <Button size="sm" variant="secondary" loading={pending} onClick={() => setRejecting(true)}>
                {t("expert.kycReject")}
              </Button>
            )}
          </div>
        )}
        {rejecting && (
          <div className="space-y-2">
            <TextAreaField label={t("expert.kycRejectReason")} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={2} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="danger" loading={pending} disabled={reason.trim().length === 0} onClick={() => decide("REJECTED")} data-testid="kyc-reject">
                {t("expert.kycReject")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
                {t("common.keep")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {published ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() =>
                apply(
                  { published: false, verified: false },
                  t("expert.offListToast", { name: entry.name }),
                )
              }
            >
              {t("expert.takeOffList")}
            </Button>
            {!verified && (
              <Button
                size="sm"
                variant="ghost"
                loading={pending}
                onClick={() =>
                  apply({ published: true, verified: true }, t("expert.markedCheckedToast"))
                }
              >
                {t("expert.markIdentityChecked")}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              loading={pending}
              onClick={() =>
                apply(
                  { published: true, verified: false },
                  t("expert.nowListedToast", { name: entry.name }),
                )
              }
            >
              {t("expert.listThem")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() =>
                apply(
                  { published: true, verified: true },
                  t("expert.listedAndCheckedToast", { name: entry.name }),
                )
              }
            >
              {t("expert.listAndCheck")}
            </Button>
          </>
        )}
      </div>

      {published && (
        <p className="mt-3 text-xs leading-relaxed text-fg-muted">{t("expert.takeOffNote")}</p>
      )}
    </div>
  );
}
