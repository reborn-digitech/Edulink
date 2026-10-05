"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { assignPupilAction, removePlanAction } from "./actions";

/** One pupil onto a published structure; the demands are generated on assignment. Off it again while nothing is paid. */
export function AssignPlanForm({ studentMembershipId, structures, currentStructureId, academicYearId }: { studentMembershipId: string; structures: { id: string; name: string; gradeLevel: string | null }[]; currentStructureId: string | null; academicYearId: string }) {
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

  function remove() {
    if (!window.confirm(t("fees.pupilRemovePlanConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await removePlanAction(studentMembershipId, academicYearId);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      setStructureId("");
      toast({ tone: "ok", title: t("fees.pupilPlanRemoved") });
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
      {currentStructureId ? (
        <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={pending}>
          {t("fees.pupilRemovePlan")}
        </Button>
      ) : null}
    </form>
  );
}
