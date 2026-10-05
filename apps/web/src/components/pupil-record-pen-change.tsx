"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUUpLeftIcon, CheckIcon, IdentificationCardIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import type { PenChangeRequestView, PupilRecordView } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { decidePenChangeAction, proposePenChangeAction, withdrawPenChangeAction } from "@/app/(app)/admin/records/actions";

/**
 * A correction to a pupil's UDISE+ PEN, under the record form on every side
 * of it. The number is entered once by the admin; after that it is the
 * child's identity on every transfer certificate, so a change is proposed
 * by the admin with a reason and approved by the principal and a guardian
 * both. This component is the two states of that: with nothing pending,
 * the admin's door to proposing (and nothing at all for anyone else); with
 * a proposal pending, the card that says what would change, who has said
 * what, and the one button this reader may press — approve or reject for
 * the head and the guardian, withdraw for the admin. The server view
 * carries `can`, so the buttons follow it rather than the role.
 */
type Role = "ADMIN" | "PRINCIPAL" | "PARENT" | "STUDENT";

const STATUS: Record<PenChangeRequestView["status"], { key: TranslationKey; tone: "warn" | "ok" | "danger" | "neutral" }> = {
  PENDING: { key: "pupilRecord.statusPending", tone: "warn" },
  APPLIED: { key: "pupilRecord.statusApplied", tone: "ok" },
  REJECTED: { key: "pupilRecord.statusRejected", tone: "danger" },
  WITHDRAWN: { key: "pupilRecord.statusWithdrawn", tone: "neutral" },
};

export function PupilRecordPenChange({ view, role }: { view: PupilRecordView; role: Role }) {
  if (view.penChange) return <PenChangeCard request={view.penChange} />;
  // Nothing pending: only the admin, and only once a number is on record —
  // the first entry is the form's own field.
  if (role === "ADMIN" && !view.penEditable && view.record?.penNumber) return <ProposeForm membershipId={view.studentMembershipId} />;
  return null;
}

function ProposeForm({ membershipId }: { membershipId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [toPen, setToPen] = useState("");
  const [remove, setRemove] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const digits = toPen.replace(/\D/g, "");
  const ready = reason.trim().length > 0 && (remove || digits.length === 11);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!remove && digits.length !== 11) {
      setError(t("pupilRecord.penFormat"));
      return;
    }
    startTransition(async () => {
      const result = await proposePenChangeAction(membershipId, { toPen: remove ? null : digits, reason: reason.trim() });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("pupilRecord.penProposed") });
      router.refresh();
    });
  }

  return (
    <Card data-testid="pen-propose">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start gap-3 p-5 pb-3 [&::-webkit-details-marker]:hidden">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-accent-soft text-accent-strong">
            <IdentificationCardIcon weight="duotone" className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-fg">{t("pupilRecord.penProposeTitle")}</span>
            <span className="mt-0.5 block text-sm text-fg-muted">{t("pupilRecord.penChangeNeedsApproval")}</span>
          </span>
        </summary>
        <CardBody>
          <form onSubmit={submit} noValidate className="space-y-4">
            <p className="text-sm text-fg-muted">{t("pupilRecord.penProposeIntro")}</p>
            {error && (
              <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <TextField label={t("pupilRecord.penProposeNew")} hint={t("pupilRecord.penHint")} value={toPen} onChange={(e) => setToPen(e.target.value)} inputMode="numeric" pattern="[0-9]{11}" maxLength={11} autoComplete="off" disabled={remove} required={!remove} className="max-w-xs" data-testid="pen-propose-new" />
            <CheckboxField label={t("pupilRecord.penProposeRemove")} checked={remove} onChange={(e) => setRemove(e.target.checked)} data-testid="pen-propose-remove" />
            <TextAreaField label={t("pupilRecord.penProposeReason")} placeholder={t("pupilRecord.penProposeReasonPlaceholder")} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={400} rows={3} required data-testid="pen-propose-reason" />
            <Button type="submit" loading={pending} disabled={!ready} icon={<PaperPlaneTiltIcon weight="bold" />} data-testid="pen-propose-send">
              {t("pupilRecord.penPropose")}
            </Button>
          </form>
        </CardBody>
      </details>
    </Card>
  );
}

function PenChangeCard({ request }: { request: PenChangeRequestView }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const status = STATUS[request.status];

  function decide(approve: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await decidePenChangeAction(request.id, approve ? { approve: true } : { approve: false, reason: reason.trim() || undefined });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("pupilRecord.penChangeDecided") });
      router.refresh();
    });
  }

  function withdraw() {
    setError(null);
    startTransition(async () => {
      const result = await withdrawPenChangeAction(request.id);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("pupilRecord.penChangeWithdrawn") });
      router.refresh();
    });
  }

  const decision = (d: { decided: boolean; approved: boolean | null; by: string | null }, waived = false) => {
    if (waived) return { text: t("pupilRecord.penChangeWaived"), tone: "neutral" as const };
    if (!d.decided) return { text: t("pupilRecord.penChangeWaiting"), tone: "warn" as const };
    return d.approved ? { text: t("pupilRecord.penChangeApproved", { name: d.by ?? "" }), tone: "ok" as const } : { text: t("pupilRecord.penChangeRejected", { name: d.by ?? "" }), tone: "danger" as const };
  };
  const rows = [
    { label: t("pupilRecord.penChangePrincipal"), ...decision(request.principal) },
    { label: t("pupilRecord.penChangeGuardian"), ...decision(request.guardian, request.guardian.waived) },
  ];

  return (
    <Card className={request.status === "PENDING" ? "border-warn/40" : undefined} data-testid="pen-change" data-status={request.status}>
      <CardHeader
        icon={<IdentificationCardIcon weight="duotone" className="size-5" />}
        title={t("pupilRecord.penChangeTitle")}
        description={request.toPen ? t("pupilRecord.penChangeFromTo", { from: request.fromPen ?? "—", to: request.toPen }) : t("pupilRecord.penChangeRemoval", { from: request.fromPen ?? "—" })}
        action={
          <Badge tone={status.tone} size="sm">
            {t(status.key)}
          </Badge>
        }
      />
      <CardBody className="space-y-4">
        <p className="text-sm text-fg-muted">
          {t("pupilRecord.penChangeProposedBy", { name: request.requestedByName })}
          {" · "}
          {t("pupilRecord.penChangeReason", { reason: request.reason })}
        </p>
        <dl className="grid gap-2 sm:grid-cols-2" data-testid="pen-change-decisions">
          {rows.map((row) => (
            <div key={row.label} className="rounded-[var(--radius-md)] border border-border px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{row.label}</dt>
              <dd className="mt-0.5">
                <Badge tone={row.tone} size="sm">
                  {row.text}
                </Badge>
              </dd>
            </div>
          ))}
        </dl>
        {request.status === "APPLIED" && <p className="text-sm font-medium text-ok">{t("pupilRecord.penChangeAppliedNote")}</p>}
        {request.status === "REJECTED" && <p className="text-sm font-medium text-danger">{t("pupilRecord.penChangeRejectedNote", { reason: request.decisionReason ?? "—" })}</p>}
        {error && (
          <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        {request.can.decide && !rejecting && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" loading={pending} onClick={() => decide(true)} icon={<CheckIcon weight="bold" />} data-testid="pen-change-approve">
              {t("pupilRecord.penChangeApprove")}
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => setRejecting(true)} icon={<XIcon weight="bold" />} data-testid="pen-change-reject">
              {t("pupilRecord.penChangeReject")}
            </Button>
          </div>
        )}
        {request.can.decide && rejecting && (
          <div className="space-y-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft/40 p-3">
            <TextAreaField label={t("pupilRecord.penChangeRejectReason")} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={400} rows={2} data-testid="pen-change-reject-reason" />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="danger" loading={pending} onClick={() => decide(false)} icon={<XIcon weight="bold" />} data-testid="pen-change-reject-send">
                {t("pupilRecord.penChangeReject")}
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
        {request.can.withdraw && (
          <Button size="sm" variant="secondary" loading={pending} onClick={withdraw} icon={<ArrowUUpLeftIcon weight="bold" />} data-testid="pen-change-withdraw">
            {t("pupilRecord.penChangeWithdraw")}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
