"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { assignPlanAction } from "../actions";
import { useT } from "@/lib/i18n";

/** Which plan the school is on: a select and a button; the lib audits and tells the office. */
export function PlanPanel({ schoolId, planId, plans }: { schoolId: string; planId: string | null; plans: { id: string; code: string; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string>(planId ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await assignPlanAction(schoolId, chosen || null);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.planAssigned") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <SelectField label={t("root.planTitle")} value={chosen} onChange={(e) => setChosen(e.target.value)}>
        <option value="">{t("root.planNone")}</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.code})
          </option>
        ))}
      </SelectField>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button loading={pending} disabled={chosen === (planId ?? "")} onClick={save}>
          {t("root.planAssign")}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/root/plans">{t("root.planManage")}</Link>
        </Button>
      </div>
    </div>
  );
}
