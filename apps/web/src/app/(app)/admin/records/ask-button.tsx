"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { requestRecordsAction } from "@/app/(app)/parent/record/actions";

/**
 * "Ask the families": every incomplete pupil when no ids are given, one
 * family from its row. The toast says how many were asked, because a button
 * that reaches a hundred phones should say so.
 */
export function AskFamiliesButton({ membershipIds, label, size = "sm", variant = "primary", disabled }: { membershipIds?: string[]; label: string; size?: "sm" | "md"; variant?: "primary" | "secondary" | "ghost"; disabled?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function ask() {
    startTransition(async () => {
      const result = await requestRecordsAction(membershipIds);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("pupilRecord.asked", { families: result.families ?? 0, asked: result.asked ?? 0 }) });
      router.refresh();
    });
  }

  return (
    <Button size={size} variant={variant} loading={pending} disabled={disabled} onClick={ask} icon={<PaperPlaneTiltIcon weight="bold" />}>
      {label}
    </Button>
  );
}
