"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArchiveIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { ActionResult } from "../../action-result";
import { archiveStructureAction, publishStructureAction } from "../actions";

/** Publish freezes; archive hides from assignment. Neither touches a pupil already on the structure. */
export function StructureButtons({ structureId, published, archived }: { structureId: string; published: boolean; archived: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action(structureId);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      router.refresh();
    });
  }

  if (archived) return null;
  return (
    <span className="flex flex-wrap gap-2">
      {!published && (
        <Button icon={<CheckCircleIcon weight="bold" />} loading={pending} onClick={() => run(publishStructureAction)}>
          {t("fees.structurePublish")}
        </Button>
      )}
      <Button variant="secondary" icon={<ArchiveIcon weight="bold" />} loading={pending} onClick={() => run(archiveStructureAction)}>
        {t("fees.structureArchive")}
      </Button>
    </span>
  );
}
