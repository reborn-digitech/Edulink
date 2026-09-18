"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { CHANNEL_KEY, SKIP_KEY, word } from "./labels";
import { sendTestAction } from "./actions";

/** One text to the office's own number. The toast says which channel carried it, or why nothing went. */
export function TestButton() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      icon={<PaperPlaneTiltIcon weight="bold" />}
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await sendTestAction();
          if (!result.ok || !result.outcome) {
            toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
            return;
          }
          const o = result.outcome;
          if (o.status === "SKIPPED") toast({ tone: "warn", title: t("messaging.testSkipped", { reason: word(t, SKIP_KEY, o.skipReason) }) });
          else if (o.status === "FAILED") toast({ tone: "danger", title: t("messaging.statusFailed") });
          else toast({ tone: "ok", title: t("messaging.testSent", { channel: word(t, CHANNEL_KEY, o.channel) }) });
          router.refresh();
        })
      }
    >
      {t("messaging.testGo")}
    </Button>
  );
}
