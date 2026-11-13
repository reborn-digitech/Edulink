"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PenNibIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { decideSignatureAction } from "@/app/(app)/admin/signatures/actions";

/**
 * The two decisions of somebody whose signature a paper waits for. It sits
 * on the paper itself and in the list of papers waiting, so that a paper can
 * be signed where it has just been read; `label` names the paper for a
 * screen reader in a list of many.
 */
export function SignPaper({ signatureId, label }: { signatureId: string; label: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const decide = (approve: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await decideSignatureAction(signatureId, approve);
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t(approve ? "signatures.signedToast" : "signatures.declinedToast") });
      router.refresh();
    });
  };

  return (
    <div className="space-y-2" data-testid="sign-paper">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" loading={pending} icon={<PenNibIcon weight="bold" />} onClick={() => decide(true)} aria-label={[t("signatures.sign"), label].join(": ")} data-testid="sign-approve">
          {t("signatures.sign")}
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={pending} icon={<XIcon weight="bold" />} onClick={() => decide(false)} aria-label={[t("signatures.decline"), label].join(": ")} data-testid="sign-decline">
          {t("signatures.decline")}
        </Button>
      </div>
    </div>
  );
}
