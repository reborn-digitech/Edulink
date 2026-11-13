"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowUUpLeftIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import type { RecordChangeView } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { recordValueText } from "@/components/pupil-record-words";
import { decideRecordChangeAction, withdrawRecordChangeAction } from "@/app/(app)/parent/record/actions";
import { fieldClass } from "@/components/ui/field-class";

const STATUS = { PENDING: { key: "recordChanges.statusPending", tone: "warn" }, APPLIED: { key: "recordChanges.statusApplied", tone: "ok" }, DECLINED: { key: "recordChanges.statusDeclined", tone: "danger" }, WITHDRAWN: { key: "recordChanges.statusWithdrawn", tone: "neutral" } } as const;

/**
 * One ask to change a pupil's record, as both sides read it: each field with
 * what the record held and what is proposed, who asked and why. The office
 * gets the two decisions — declining opens a box for a sentence the family
 * will read — and the family the way to take a waiting ask back. What the
 * reader may do is the server's answer (`can`), not this component's guess.
 */
export function RecordChangePanel({ change }: { change: RecordChangeView }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const reasonId = useId();
  const [pending, startTransition] = useTransition();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const status = STATUS[change.status];

  function run(work: () => Promise<{ ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> }>, done: TranslationKey) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t(done) });
      setDeclining(false);
      setReason("");
      router.refresh();
    });
  }
  const approve = () => run(() => decideRecordChangeAction(change.id, { approve: true }), "recordChanges.approved");
  const decline = () => run(() => decideRecordChangeAction(change.id, { approve: false, reason: reason.trim() || undefined }), "recordChanges.declined");
  const withdraw = () => run(() => withdrawRecordChangeAction(change.id), "recordChanges.withdrawn");

  return (
    <div className="space-y-3" data-testid="record-change" data-status={change.status}>
      <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <Badge tone={status.tone} size="sm">
          {t(status.key)}
        </Badge>
        {t(change.byPupil ? "recordChanges.askedByPupil" : "recordChanges.askedBy", { name: change.requestedByName, date: formatDate(new Date(change.createdAt)) })}
      </p>
      <ul className="space-y-1 text-sm text-fg">
        {change.changes.map((c) => (
          <li key={c.field} data-testid={`record-change-${c.field}`}>
            {t("recordChanges.changeLine", { field: t(`pupilRecord.${c.field}` as TranslationKey), from: recordValueText(t, c.field, c.from), to: recordValueText(t, c.field, c.to) })}
          </li>
        ))}
      </ul>
      <p className="text-sm text-fg-muted">{t("recordChanges.reasonGiven", { reason: change.reason })}</p>
      {change.declineReason && <p className="text-sm font-medium text-fg">{t("recordChanges.officeSaid", { reason: change.declineReason })}</p>}
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {change.can.decide &&
        (declining ? (
          <div className="space-y-2">
            <label htmlFor={reasonId} className="block text-xs font-semibold text-fg">
              {t("recordChanges.declineReasonLabel")}
            </label>
            <textarea id={reasonId} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={400} rows={2} className={fieldClass()} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="danger" loading={pending} onClick={decline} data-testid="record-change-decline-confirm">
                {t("recordChanges.decline")}
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => setDeclining(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={pending} icon={<CheckIcon weight="bold" />} onClick={approve} data-testid="record-change-approve">
              {t("recordChanges.approve")}
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} icon={<XIcon weight="bold" />} onClick={() => setDeclining(true)} data-testid="record-change-decline">
              {t("recordChanges.decline")}
            </Button>
          </div>
        ))}
      {change.can.withdraw && (
        <Button size="sm" variant="secondary" loading={pending} icon={<ArrowUUpLeftIcon weight="bold" />} onClick={withdraw} data-testid="record-change-withdraw">
          {t("recordChanges.withdraw")}
        </Button>
      )}
    </div>
  );
}
