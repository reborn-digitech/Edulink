"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, FileTextIcon, ProhibitIcon } from "@phosphor-icons/react";
import { EXPERT_APPLICATION_REFUSALS, type ExpertApplicationRefusal, type OperatorExpertApplication } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { EXPERT_OFFERING_META, type ExpertOffering } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { decideExpertApplicationAction } from "./actions";

/**
 * One expert's application in the operator's queue (expert-registration, 15 Oct 2026): every field they sent,
 * the document behind an operator-only door, and the two answers. Approve asks first, because it makes an account
 * and sends mail at once; Refuse opens the coded reason and the note the applicant reads.
 */
export function ApplicationRow({ entry }: { entry: OperatorExpertApplication }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState<ExpertApplicationRefusal | "">("");
  const [note, setNote] = useState("");
  const offering = EXPERT_OFFERING_META[entry.offering as ExpertOffering];

  function approve() {
    setError(null);
    if (!window.confirm(t("expertApply.approveConfirm", { name: entry.name }))) return;
    startTransition(async () => {
      const result = await decideExpertApplicationAction(entry.id, { decision: "APPROVE" });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: result.inviteSent === false ? "warn" : "ok", title: result.inviteSent === false ? t("expertApply.approvedMailFailed") : t("expertApply.approved", { email: entry.email }) });
      router.refresh();
    });
  }

  function refuse() {
    setError(null);
    if (!reason) {
      setError(t("expertApply.needReason"));
      return;
    }
    startTransition(async () => {
      const result = await decideExpertApplicationAction(entry.id, { decision: "REFUSE", reason, note: note.trim() || undefined });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("expertApply.refused") });
      router.refresh();
    });
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-fg">{value}</dd>
    </div>
  );

  return (
    <article className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
      <header className="space-y-1">
        <h3 className="text-base font-semibold text-fg">{entry.name}</h3>
        <p className="text-sm text-fg-muted">{entry.headline}</p>
        <p className="text-xs text-fg-subtle">{t("expertApply.appliedOn", { date: formatDate(new Date(entry.createdAt)) })}</p>
      </header>

      <dl className="space-y-2">
        {row(t("expertApply.labelEmail"), entry.email)}
        {row(t("expertApply.labelPhone"), entry.phone)}
        {row(t("expertApply.labelCity"), entry.city)}
        {row(t("expertApply.labelOrganisation"), entry.organisation ?? t("expertApply.noneGiven"))}
        {row(t("expertApply.labelYears"), t("expertApply.yearsValue", { count: entry.yearsExperience }))}
        {row(t("expertApply.labelSpecialisms"), entry.specialisms.map((code) => t(`expertApply.specialism${code}` as TranslationKey)).join(", "))}
        {row(t("expertApply.labelLanguages"), entry.languages.map((code) => t(`expertApply.language${code}` as TranslationKey)).join(", "))}
        {row(t("expertApply.labelOffering"), offering ? t(offering.labelKey) : entry.offering)}
        {row(
          t("expertApply.labelLinks"),
          entry.links.length === 0 ? (
            t("expertApply.noneGiven")
          ) : (
            <ul className="space-y-1">
              {entry.links.map((link) => (
                <li key={link}>
                  <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-accent-strong underline underline-offset-4">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          ),
        )}
        {row(t("expertApply.labelBio"), <span className="whitespace-pre-line">{entry.bio}</span>)}
        {row("", <span className="text-xs text-fg-muted">{t("expertApply.labelDeclared", { date: formatDate(new Date(entry.declarationAt)) })}</span>)}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        {entry.hasDocument ? (
          <Button asChild variant="secondary" size="sm" icon={<FileTextIcon weight="bold" />}>
            <a href={`/api/v1/operator/expert-applications/${entry.id}/document`} target="_blank" rel="noopener noreferrer">
              {t("expertApply.viewDocument")}
            </a>
          </Button>
        ) : (
          <span className="text-sm text-fg-muted">{t("expertApply.noDocument")}</span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {refusing ? (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
          <SelectField label={t("expertApply.refuseReasonLabel")} value={reason} onChange={(e) => setReason(e.target.value as ExpertApplicationRefusal | "")}>
            <option value="">—</option>
            {EXPERT_APPLICATION_REFUSALS.map((code) => (
              <option key={code} value={code}>
                {t(`expertApply.refusal${code}` as TranslationKey)}
              </option>
            ))}
          </SelectField>
          <TextAreaField label={t("expertApply.refuseNoteLabel")} hint={t("expertApply.refuseNoteHint")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} />
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" size="sm" loading={pending} icon={<ProhibitIcon weight="bold" />} onClick={refuse}>
              {t("expertApply.refuseSubmit")}
            </Button>
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => setRefusing(false)}>
              {t("expertApply.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" loading={pending} icon={<CheckIcon weight="bold" />} onClick={approve}>
            {t("expertApply.approve")}
          </Button>
          <Button variant="secondary" size="sm" disabled={pending} icon={<ProhibitIcon weight="bold" />} onClick={() => setRefusing(true)}>
            {t("expertApply.refuse")}
          </Button>
        </div>
      )}
    </article>
  );
}
