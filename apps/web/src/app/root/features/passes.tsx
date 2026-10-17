"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { refundPassAction } from "./pass-actions";

/** plans-pay (17 Oct 2026): the operator's Refund on one pass, behind a confirm naming the amount and the payer. */
export function RefundPassButton({ id, total, name }: { id: string; total: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={pending}
        data-testid={`pass-refund-${id}`}
        onClick={() => {
          if (!window.confirm(t("passes.confirmRefund", { total, name }))) return;
          setError(null);
          startTransition(async () => {
            const result = await refundPassAction(id);
            if (!result.ok) return setError(result.error);
            toast({ tone: "ok", title: result.message });
            router.refresh();
          });
        }}
      >
        {t("passes.refund")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
