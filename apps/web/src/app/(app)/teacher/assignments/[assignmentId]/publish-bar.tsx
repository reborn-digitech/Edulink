"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PaperPlaneTiltIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { publishNow } from "../actions";
import { useT } from "@/lib/i18n";

export function PublishBar({ assignmentId }: { assignmentId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft p-4">
      <WarningIcon weight="fill" className="size-5 shrink-0 text-warn" />
      <p className="min-w-0 flex-1 text-sm font-medium text-warn">
        {t("teacher.stillDraft")}
      </p>
      <Button
        size="sm"
        loading={pending}
        icon={<PaperPlaneTiltIcon weight="bold" />}
        onClick={() =>
          startTransition(async () => {
            const result = await publishNow(assignmentId);
            toast(
              result.ok
                ? {
                    tone: "ok",
                    title: t("teacher.published"),
                    description: t("teacher.classTold"),
                  }
                : { tone: "danger", title: t("teacher.couldNotPublish"), description: result.error },
            );
            router.refresh();
          })
        }
      >
        {t("teacher.publishNow")}
      </Button>
    </div>
  );
}
