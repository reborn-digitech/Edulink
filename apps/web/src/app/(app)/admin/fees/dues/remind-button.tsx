"use client";

import { useTransition } from "react";
import { BellRingingIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { remindOverdueAction } from "./actions";

export function RemindButton({ disabled }: { disabled?: boolean }) {
  const t = useT();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      icon={<BellRingingIcon weight="bold" />}
      loading={pending}
      disabled={disabled}
      onClick={() =>
        startTransition(async () => {
          const result = await remindOverdueAction();
          if (!result.ok) {
            toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
            return;
          }
          toast({ tone: "ok", title: t("fees.duesRemindSent", { count: result.families ?? 0 }) });
        })
      }
    >
      {t("fees.duesRemind")}
    </Button>
  );
}
