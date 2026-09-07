"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { acknowledge } from "../actions";

/** The one tap a circular asks for. Optimistic, and idempotent server-side. */
export function AckButton({ postId, acked }: { postId: string; acked: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [ackedNow, setAckedNow] = useState(false);

  if (acked || ackedNow) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ok">
        <CheckCircleIcon weight="fill" className="size-4" />
        {t("bulletin.ackDone")}
      </p>
    );
  }

  return (
    <Button
      size="sm"
      loading={pending}
      icon={<CheckCircleIcon weight="bold" />}
      onClick={() =>
        startTransition(async () => {
          const result = await acknowledge(postId);
          if (result.ok) {
            setAckedNow(true);
          } else {
            toast({ tone: "danger", title: t("bulletin.couldNotDo"), description: result.error });
          }
          router.refresh();
        })
      }
    >
      {t("bulletin.ackButton")}
    </Button>
  );
}
