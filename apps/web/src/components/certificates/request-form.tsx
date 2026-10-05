"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import type { CertificateKind } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { requestCertificateAction } from "@/app/(app)/parent/certificates/actions";
import { CERTIFICATE_KIND_KEY } from "./labels";

/**
 * The family's ask: which certificate, and what it is for. `kinds` is what
 * the school has an active template for — a kind it cannot issue is not
 * offered — and with none the form gives way to a sentence. A guardian's
 * form names the child; a pupil's does not. The library answers the same
 * pending ask for a form sent twice, so the toast is honest either way.
 */
export function CertificateRequestForm({ kinds, childId }: { kinds: CertificateKind[]; childId?: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<CertificateKind | "">(kinds[0] ?? "");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (kinds.length === 0) {
    return <p className="text-sm text-fg-muted" data-testid="request-no-kinds">{t("certificateRequests.noKinds")}</p>;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!kind || !purpose.trim()) {
      setError(t("common.checkTheForm"));
      return;
    }
    startTransition(async () => {
      const result = await requestCertificateAction({ kind, purpose: purpose.trim().slice(0, 200) }, childId);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("certificateRequests.asked") });
      setPurpose("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="request-form">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label={t("certificateRequests.kind")} required value={kind} onChange={(e) => setKind(e.target.value as CertificateKind)} data-testid="request-kind">
          {kinds.map((k) => (
            <option key={k} value={k}>
              {t(CERTIFICATE_KIND_KEY[k])}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t("certificateRequests.purpose")}
          required
          value={purpose}
          maxLength={200}
          autoComplete="off"
          placeholder={t("certificateRequests.purposePlaceholder")}
          onChange={(e) => setPurpose(e.target.value)}
          data-testid="request-purpose"
        />
      </div>
      <Button type="submit" loading={pending} icon={<PaperPlaneTiltIcon weight="bold" />} data-testid="request-submit">
        {t("certificateRequests.ask")}
      </Button>
    </form>
  );
}
