"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useLocale, useT } from "@/lib/i18n";
import { weekdayName } from "@/lib/school-day";
import { saveTeachingWeek } from "./actions";

/** Monday first, Sunday last: the order a school's week is read in. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/**
 * The days the school teaches on, seven boxes. An empty week is refused
 * here before it reaches the server, because a school with no day in it
 * would close every register at once.
 */
export function TeachingWeekForm({ initialDays }: { initialDays: number[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState<Set<number>>(() => new Set(initialDays));
  const [error, setError] = useState<string | null>(null);

  const toggle = (day: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const chosen = WEEK.filter((d) => days.has(d));
    if (chosen.length === 0) return setError(t("substitutions.weekAtLeastOne"));
    startTransition(async () => {
      const result = await saveTeachingWeek(chosen);
      if (!result.ok) {
        setError(result.error ?? t("common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("substitutions.weekSaved") });
      if (result.orphanedSlots && result.orphanedSlots > 0) toast({ tone: "warn", title: t("substitutions.weekOrphaned", { count: result.orphanedSlots }) });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3" data-testid="teaching-week-form">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <fieldset>
        <legend className="sr-only">{t("substitutions.weekTitle")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEK.map((day) => {
            const on = days.has(day);
            return (
              <label
                key={day}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors hover:bg-surface-muted ${on ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-border text-fg"}`}
              >
                <input type="checkbox" name="teachingDay" value={day} checked={on} onChange={() => toggle(day)} className="size-4 accent-[var(--accent)]" />
                {weekdayName(day, locale)}
              </label>
            );
          })}
        </div>
      </fieldset>
      <Button type="submit" size="sm" loading={pending}>
        {t("substitutions.weekSave")}
      </Button>
    </form>
  );
}
