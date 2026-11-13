"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { setSelfEnrolAction } from "./actions";

/**
 * One checkbox per published plan: open to families, or the office's alone.
 * The office turns it; a draft cannot be opened (its numbers may change) and
 * the server says so. Pupils already on the plan are untouched either way.
 */
export function SelfEnrolToggle({ structureId, open, canEdit, name }: { structureId: string; open: boolean; canEdit: boolean; name: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState(open);

  function change(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await setSelfEnrolAction(structureId, next);
      if (!result.ok) {
        setChecked(!next);
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("fees.selfEnrolSaved") });
      router.refresh();
    });
  }

  const label = [t("fees.selfEnrolColumn"), name].join(" · ");
  return (
    <CheckboxField
      label={<span className="sr-only">{label}</span>}
      aria-label={label}
      checked={checked}
      disabled={!canEdit || pending}
      onChange={(e) => change(e.target.checked)}
      data-testid="fees-self-enrol"
      data-structure={structureId}
    />
  );
}
