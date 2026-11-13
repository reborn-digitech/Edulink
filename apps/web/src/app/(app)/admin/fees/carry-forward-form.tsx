"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { formatPaise } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useLocale, useT } from "@/lib/i18n";
import { carryForwardAction } from "./actions";

/**
 * Year end: what is still owed in one year becomes an opening balance in the
 * next. Two selects and a button; the library refuses the same year twice
 * and a "new" year that starts before the old one.
 */
export function CarryForwardForm({ years, currentYearId }: { years: { id: string; name: string }[]; currentYearId: string | null }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  // Years arrive newest first: the default "from" is the one before the
  // current year, the default "to" the current one.
  const currentIndex = years.findIndex((y) => y.id === currentYearId);
  const [fromYearId, setFrom] = useState(years[currentIndex + 1]?.id ?? years[1]?.id ?? "");
  const [toYearId, setTo] = useState(currentYearId ?? years[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await carryForwardAction({ fromYearId, toYearId });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.carryDone", { pupils: result.pupils ?? 0, amount: formatPaise(result.carriedPaise ?? 0, locale) }) });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t("fees.carryFrom")} value={fromYearId} onChange={(e) => setFrom(e.target.value)}>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("fees.carryTo")} value={toYearId} onChange={(e) => setTo(e.target.value)}>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </SelectField>
      </div>
      <Button type="submit" variant="secondary" loading={pending} disabled={!fromYearId || !toYearId || fromYearId === toYearId}>
        {t("fees.carryGo")}
      </Button>
    </form>
  );
}
