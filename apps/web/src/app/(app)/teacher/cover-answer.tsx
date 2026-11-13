"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { acknowledgeCoverAction, declineCoverAction } from "./cover-actions";

/**
 * A cover's answer, beside the lesson on the teacher's Today: "I'll take
 * it" marks it acknowledged; "I can't" asks why in one line and tells the
 * office. Either can be changed until the office reassigns the lesson.
 */
export function CoverAnswer({ coverId, acknowledgedAt, declinedAt, declineReason }: { coverId: string; acknowledgedAt: string | null; declinedAt: string | null; declineReason: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function acknowledge() {
    setError(null);
    startTransition(async () => {
      const result = await acknowledgeCoverAction({ coverId });
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t("covers.acknowledged") });
      setDeclining(false);
      router.refresh();
    });
  }

  function decline() {
    if (!reason.trim()) return setError(t("covers.reasonRequired"));
    setError(null);
    startTransition(async () => {
      const result = await declineCoverAction({ coverId, reason: reason.trim() });
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t("covers.declinedToast") });
      setDeclining(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {acknowledgedAt && !declinedAt && (
          <Badge tone="ok" size="sm">
            {t("covers.stateTaken")}
          </Badge>
        )}
        {declinedAt && (
          <Badge tone="danger" size="sm">
            {t("covers.stateDeclined")}
          </Badge>
        )}
        {!(acknowledgedAt && !declinedAt) && (
          <Button type="button" size="sm" variant="soft" loading={pending && !declining} disabled={pending} onClick={acknowledge} icon={<CheckIcon weight="bold" />}>
            {t("covers.take")}
          </Button>
        )}
        {!declinedAt && !declining && (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setDeclining(true)} icon={<XIcon weight="bold" />}>
            {t("covers.cannot")}
          </Button>
        )}
      </div>
      {declinedAt && declineReason && !declining && <p className="text-xs text-fg-muted">{t("covers.yourReason", { reason: declineReason })}</p>}
      {declining && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            decline();
          }}
          noValidate
          className="flex w-full flex-col gap-2 sm:w-80"
        >
          <TextField label={t("covers.reasonLabel")} placeholder={t("covers.reasonPlaceholder")} maxLength={300} autoComplete="off" value={reason} onChange={(e) => setReason(e.target.value)} className="[&_input]:min-h-10 [&_input]:py-2" />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" variant="danger" loading={pending}>
              {t("covers.declineSend")}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setDeclining(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
