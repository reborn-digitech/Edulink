"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { UsersThreeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { AssignResult } from "@/lib/fees";
import { assignClassAction } from "../actions";

/**
 * Put a whole class on this structure. The result is reported in words —
 * how many were assigned, moved, unchanged — and anyone refused (something
 * already paid this year) is named, because a silent skip is a pupil whose
 * fees nobody notices are on the old plan.
 */
export function AssignCard({ structureId, classes, selectedClassId }: { structureId: string; classes: { id: string; name: string; gradeLevel: string | null }[]; selectedClassId: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [classId, setClassId] = useState(selectedClassId ?? "");
  const [result, setResult] = useState<AssignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!classId) return setError(t("fees.refuseNobody"));
    startTransition(async () => {
      const r = await assignClassAction(structureId, classId);
      if (!r.ok || !r.result) {
        setError(actionError(t, r, "common.tryAgain"));
        return;
      }
      setResult(r.result);
      toast({ tone: "ok", title: t("fees.assignResult", { assigned: r.result.assigned, moved: r.result.moved, unchanged: r.result.unchanged }) });
      router.push(`/admin/fees/structures/${structureId}?classId=${classId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <SelectField label={t("fees.assignClass")} value={classId} onChange={(e) => setClassId(e.target.value)} hint={t("fees.assignHint")}>
          <option value="">{t("fees.assignChoose")}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.gradeLevel ? ` · ${c.gradeLevel}` : ""}
            </option>
          ))}
        </SelectField>
        <Button type="submit" icon={<UsersThreeIcon weight="bold" />} loading={pending} disabled={!classId} className="sm:mb-6">
          {t("fees.assignGo")}
        </Button>
      </div>
      {result && (
        <div className="space-y-1 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm">
          <p className="text-fg">{t("fees.assignResult", { assigned: result.assigned, moved: result.moved, unchanged: result.unchanged })}</p>
          {result.refused.length > 0 && <p className="text-warn">{t("fees.assignRefused", { names: result.refused.map((r) => r.name).join(", ") })}</p>}
        </div>
      )}
    </form>
  );
}
