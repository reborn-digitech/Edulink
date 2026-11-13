"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { resendFailuresAction } from "../actions";

/** The failed and undelivered rows, queued and sent again. Disabled when there are none. */
export function ResendButton({ broadcastId, disabled }: { broadcastId: string; disabled?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      icon={<ArrowsClockwiseIcon weight="bold" />}
      loading={pending}
      disabled={disabled}
      onClick={() =>
        startTransition(async () => {
          const result = await resendFailuresAction(broadcastId);
          if (!result.ok) {
            toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
            return;
          }
          toast({ tone: "ok", title: t("messaging.detailResent", { count: result.requeued ?? 0 }) });
          router.refresh();
        })
      }
    >
      {t("messaging.detailResend")}
    </Button>
  );
}
