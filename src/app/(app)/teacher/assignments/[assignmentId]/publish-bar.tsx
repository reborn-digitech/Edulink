"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { publishNow } from "../actions";

export function PublishBar({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[--radius-md] border border-warn/40 bg-warn-soft p-4">
      <WarningIcon weight="fill" className="size-5 shrink-0 text-warn" />
      <p className="min-w-0 flex-1 text-sm font-medium text-warn">
        This is still a draft. Students cannot see it and nobody has been told.
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
                    title: "Published",
                    description: "The class and their guardians have been told.",
                  }
                : { tone: "danger", title: "Could not publish", description: result.error },
            );
            router.refresh();
          })
        }
      >
        Publish now
      </Button>
    </div>
  );
}
