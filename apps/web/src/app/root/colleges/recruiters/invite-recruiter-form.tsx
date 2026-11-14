"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "@/lib/navigation";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { inviteCompanyRecruiterAction } from "../actions";

/**
 * A company's first recruiter (TA-090): for a company on the platform that no
 * recruiter works on yet, the operator names it by its GSTIN or CIN and gives
 * the address of a recruiter account; they are bound once they accept. The
 * answer is the same whether or not the address is a recruiter's.
 */
export function InviteRecruiterForm() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await inviteCompanyRecruiterAction({ identifier: String(data.get("identifier") ?? ""), email: String(data.get("email") ?? "") });
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("placement.colleagueInvited") });
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-fg">{t("operatorCollege.inviteTitle")}</h2>
        <p className="text-sm text-fg-muted">{t("operatorCollege.inviteIntro")}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <TextField label={t("placement.fieldIdentifier")} name="identifier" required maxLength={30} hint={t("placement.fieldIdentifierHint")} />
        <TextField label={t("placement.fieldColleagueEmail")} name="email" type="email" required maxLength={200} />
        <Button type="submit" size="sm" variant="secondary" icon={<EnvelopeSimpleIcon weight="bold" />} loading={busy}>
          {t("placement.inviteRecruiter")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
