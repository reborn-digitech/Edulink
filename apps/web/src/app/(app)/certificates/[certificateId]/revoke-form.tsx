"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ProhibitIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { revokeAction } from "@/app/(app)/admin/certificates/actions";

/**
 * The office's revoke, under the document. It asks for a reason and will
 * not proceed without one: the paper already handed over stays on the list
 * and the verify page says why the school no longer stands behind it.
 */
export function RevokeForm({ certificateId }: { certificateId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError(t("common.checkTheForm"));
      return;
    }
    if (!window.confirm(`${t("certificates.revoke")}?`)) return;
    startTransition(async () => {
      const result = await revokeAction(certificateId, reason.trim().slice(0, 200));
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("certificates.revokedDone") });
      router.refresh();
    });
  }

  return (
    <Card className="border-danger/30">
      <CardHeader title={t("certificates.revoke")} />
      <CardBody>
        <form onSubmit={submit} noValidate className="flex flex-wrap items-end gap-3" data-testid="revoke-form">
          <TextField label={t("certificates.revokeReason")} value={reason} maxLength={200} required autoComplete="off" error={error ?? undefined} onChange={(e) => setReason(e.target.value)} className="min-w-0 flex-1 basis-64" />
          <Button type="submit" variant="danger" loading={pending} icon={<ProhibitIcon weight="bold" />} data-testid="revoke-submit">
            {t("certificates.revoke")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
