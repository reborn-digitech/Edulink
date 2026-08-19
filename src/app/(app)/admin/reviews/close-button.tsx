"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { closeRound } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

export function CloseRoundButton({ roundId }: { roundId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await closeRound(roundId);
          if (!result.ok) {
            toast({ tone: "danger", title: t("common.somethingWrong"), description: actionError(t, result) });
            return;
          }
          router.refresh();
        })
      }
    >
      {t("reviews.closeNow")}
    </Button>
  );
}
