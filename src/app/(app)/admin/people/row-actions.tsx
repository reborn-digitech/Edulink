"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { suspend } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

/**
 * The pause form, opened from the row's action menu (directory-menu.tsx).
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
export function PausePanel({
  membershipId,
  name,
  onClose,
}: {
  membershipId: string;
  name: string;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
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
      toast({ tone: "ok", title: t("people.paused", { name }) });
      onClose();
      router.refresh();
    });
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
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
