"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { formatPaise } from "@edulink/i18n";
import type { FamilyFeePlans } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateKey } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import { feesApi, feesErrorMessage } from "./api";

/**
 * The plans the office opened to families, for this child. One "choose"
 * per plan with a confirm step; the server re-checks everything (open,
 * grade, no plan yet, nothing paid) and writes the plan through the one
 * writer the office uses. Nothing here moves money.
 */
export function PlanChooser({ plans, childName }: { plans: FamilyFeePlans; childName: string }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const date = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);

  function choose(planId: string, planName: string) {
    setError(null);
    startTransition(async () => {
      try {
        await feesApi("/api/v1/family/fees/plans/enrol", { method: "POST", body: { student: plans.student.studentMembershipId, planId } });
        setDone(planName);
        setConfirming(null);
        router.refresh();
      } catch (e) {
        setError(feesErrorMessage(e, t("common.tryAgain")));
      }
    });
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-ok" role="status" data-testid="fees-plan-enrolled">
        <CheckCircleIcon weight="fill" className="size-4 shrink-0" />
        {t("fees.plansEnrolled", { name: childName, plan: done })}
      </p>
    );
  }
  if (plans.current) return <p className="text-sm text-fg-muted">{t("fees.plansCurrent", { name: childName, plan: plans.current.structureName })}</p>;
  if (!plans.canEnrol) return <p className="text-sm text-fg-muted">{t("fees.plansCannotPaid")}</p>;
  if (plans.plans.length === 0) return <p className="py-4 text-center text-sm text-fg-muted">{t("fees.plansNone")}</p>;

  return (
    <div className="space-y-3" data-testid="fees-plan-chooser">
      <p className="text-sm text-fg-muted">{t("fees.plansIntro", { name: childName })}</p>
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <ul className="divide-y divide-border rounded-[--radius-md] border border-border">
        {plans.plans.map((p) => (
          <li key={p.id} className="space-y-2 px-4 py-3" data-testid="fees-plan" data-plan={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{p.name}</span>
                <span className="block text-xs text-fg-muted">
                  {t("fees.plansInstalmentsCount", { count: p.instalments.length, total: formatPaise(p.totalPaise, locale) })}
                  {p.gradeLevel ? ` · ${t("fees.structureGrade")} ${p.gradeLevel}` : ` · ${t("fees.structureAllGrades")}`}
                </span>
              </span>
              {confirming === p.id ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-fg">{t("fees.plansConfirm", { name: childName, plan: p.name })}</span>
                  <Button size="sm" loading={pending} onClick={() => choose(p.id, p.name)}>
                    {t("common.confirm")}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => setConfirming(null)}>
                    {t("common.cancel")}
                  </Button>
                </span>
              ) : (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => setConfirming(p.id)}>
                  {t("fees.plansChoose")}
                </Button>
              )}
            </div>
            <ul className="flex flex-wrap gap-2">
              {p.instalments.map((i) => (
                <li key={i.id}>
                  <Badge tone="outline" size="sm">
                    {i.label} · {date(i.dueDateKey)} · {formatPaise(i.totalPaise, locale)}
                  </Badge>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
