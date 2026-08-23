"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { issueFirstSignInAction } from "./actions";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { FIRST_SIGNIN_TTL_DAYS } from "@/lib/first-signin-constants";

/**
 * "Issue sign-in code", from a pupil's row. The code is shown ONCE, here,
 * and nowhere else: the office writes it on the slip that goes home, and a
 * second look means a second code. The panel says so before the button.
 */
export function FirstSignInPanel({
  membershipId,
  name,
  onClose,
}: {
  membershipId: string;
  name: string;
  onClose: () => void;
}) {
  const t = useT();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [issued, setIssued] = useState<{ code: string; handle: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = typeof window === "undefined" ? "/first-signin" : `${window.location.origin}/first-signin`;

  function issue() {
    setError(null);
    startTransition(async () => {
      const result = await issueFirstSignInAction(membershipId);
      if (!result.ok) {
        setError(actionError(t, result, "firstSignin.notIssued"));
        return;
      }
      setIssued(result.issued);
      toast({ tone: "ok", title: t("firstSignin.issued") });
    });
  }

  return (
    <div className="w-full rounded-[--radius-md] border border-border bg-surface-muted p-3" data-testid="first-signin-panel">
      <p className="text-sm font-semibold text-fg">{t("firstSignin.panelTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("firstSignin.panelBody", { name, url, days: FIRST_SIGNIN_TTL_DAYS })}</p>

      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}

      {issued && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-[--radius-md] bg-surface p-3 text-sm">
          <dt className="text-fg-muted">{t("firstSignin.handleLabel")}</dt>
          <dd className="font-mono font-semibold text-fg" data-testid="issued-handle">{issued.handle}</dd>
          <dt className="text-fg-muted">{t("firstSignin.codeLabel")}</dt>
          <dd className="font-mono text-lg font-bold tracking-widest text-fg" data-testid="issued-code">{issued.code}</dd>
          <dd className="col-span-2 text-xs text-fg-muted">
            {t("firstSignin.expires", { when: formatDate(new Date(issued.expiresAt)) })} · {t("firstSignin.shownOnce")}
          </dd>
        </dl>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={issue} loading={pending}>
          {issued ? t("firstSignin.reissue") : t("firstSignin.issue")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
          {issued ? t("firstSignin.done") : t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
