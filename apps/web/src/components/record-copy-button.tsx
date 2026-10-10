"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { copyPreviousRecordAction } from "@/app/(app)/admin/records/copy-actions";

/** The button of the copy panel (R-69): one press, the result in a toast and the page refreshed so the record below shows the lines. */
export function RecordCopyButton({ studentMembershipId }: { studentMembershipId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        icon={<CopyIcon weight="bold" />}
        loading={pending}
        data-testid="record-copy-button"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await copyPreviousRecordAction(studentMembershipId);
            if (!result.ok) {
              setError(actionError(t, result, "common.tryAgain"));
              return;
            }
            toast({ tone: "ok", title: result.copied ? t("ownerDecisions.copyDone", { count: result.copied, school: result.school ?? "" }) : t("ownerDecisions.copyNothing") });
            router.refresh();
          });
        }}
      >
        {t("ownerDecisions.copyButton")}
      </Button>
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}
