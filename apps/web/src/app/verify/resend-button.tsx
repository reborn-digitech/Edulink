"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resend } from "./actions";
import { useT } from "@/lib/i18n";

/**
 * "Send me another one", for a link that has run out.
 *
 * THREE STATES AND NO TOAST. This page has no shell and no toast provider — it
 * is rendered for somebody who may be signed in to nothing — so the result is
 * shown in place, which is where they are looking anyway.
 */
export function ResendButton({ token }: { token: string }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <p className="mt-4 rounded-[--radius-md] border border-ok/30 bg-ok-soft px-3 py-2.5 text-sm font-medium text-ok">
        {t("verify.resendSent")}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
      <Button
        size="sm"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await resend(token);
            if (result.ok) setSent(true);
            else setError(result.error ?? t("verify.resendFailed"));
          })
        }
      >
        {t("verify.resendCta")}
      </Button>
    </div>
  );
}
