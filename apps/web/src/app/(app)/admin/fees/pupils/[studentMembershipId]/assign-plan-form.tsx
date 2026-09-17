"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { assignPupilAction } from "./actions";

/** One pupil onto a published structure; the demands are generated on assignment. */
export function AssignPlanForm({ studentMembershipId, structures, currentStructureId }: { studentMembershipId: string; structures: { id: string; name: string; gradeLevel: string | null }[]; currentStructureId: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [structureId, setStructureId] = useState(currentStructureId ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!structureId) return setError(t("fees.refuseNobody"));
    startTransition(async () => {
      const result = await assignPupilAction(studentMembershipId, structureId);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.settingsSaved") });
      router.refresh();
    });
  }

  if (structures.length === 0) return <p className="text-sm text-fg-muted">{t("fees.noStructures")}</p>;

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <SelectField label={t("fees.pupilAssign")} value={structureId} onChange={(e) => setStructureId(e.target.value)}>
          <option value="">—</option>
          {structures.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.gradeLevel ? ` · ${s.gradeLevel}` : ""}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="secondary" loading={pending} disabled={!structureId || structureId === currentStructureId} className="sm:mb-1">
          {t("fees.assignGo")}
        </Button>
      </div>
    </form>
  );
}
