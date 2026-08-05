"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PauseCircleIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { suspend, reinstate } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

/**
 * Pause and restore, per person, from the directory.
 *
 * PAUSING ASKS FOR A REASON AND WILL NOT PROCEED WITHOUT ONE. This is the only
 * destructive-feeling action in the directory, it is the one somebody will be
 * asked to justify months later, and a free-text box at the moment of the
 * decision is the only time anybody actually remembers why. The server enforces
 * it too — this is the prompt, not the check.
 *
 * The word on screen is "pause", not "suspend" or "remove". It is accurate —
 * nothing is deleted and it is reversible in one click — and it does not read
 * as a punishment handed down, which matters when the subject is a child.
 */
export function RowActions({
  membershipId,
  name,
  suspended,
}: {
  membershipId: string;
  name: string;
  suspended: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function doSuspend() {
    setError(null);
    startTransition(async () => {
      const result = await suspend(membershipId, reason);
      if (!result.ok) {
        setError(actionError(t, result, "people.didNotWork"));
        return;
      }
      setOpen(false);
      setReason("");
      toast({ tone: "ok", title: t("people.paused", { name }) });
      router.refresh();
    });
  }

  function doReinstate() {
    startTransition(async () => {
      const result = await reinstate(membershipId);
      if (!result.ok) {
        toast({ tone: "danger", title: t("people.notRestored"), description: actionError(t, result) });
        return;
      }
      toast({ tone: "ok", title: t("people.canSignInAgain", { name }) });
      router.refresh();
    });
  }

  if (suspended) {
    return (
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        icon={<ArrowCounterClockwiseIcon weight="bold" />}
        onClick={doReinstate}
      >
        {t("people.restore")}
      </Button>
    );
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        icon={<PauseCircleIcon weight="bold" />}
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">{t("people.pauseAccessFor", { name })}</span>
        <span aria-hidden="true">{t("people.pause")}</span>
      </Button>
    );
  }

  return (
    <div className="w-full rounded-[--radius-md] border border-warn/30 bg-warn-soft p-3">
      <p className="text-sm font-semibold text-fg">{t("people.pauseTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("people.pauseBody")}</p>

      <label className="mt-3 block">
        <span className="block text-xs font-medium text-fg">{t("people.pauseWhy")}</span>
        <textarea
          value={reason}
          autoFocus
          rows={2}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 w-full rounded-[--radius-sm] border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="danger" loading={pending} onClick={doSuspend}>
          {t("people.pauseAction")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
