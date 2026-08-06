"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  formatTimeOfDay,
  formatTimeRange,
  overlappingPeriods,
  parseTimeOfDay,
  periodTimeError,
  PERIOD_KIND_META,
  type PeriodKind,
} from "@/lib/school-day";
import { savePeriod, retirePeriod, bringBackPeriod, seedSuggestedDay } from "./actions";
import type { PeriodRow } from "@/lib/timetable";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

/**
 * Step one: what time is this school open, and where are the bells.
 *
 * FIRST ON THE PAGE, AND THE GRID IS DISABLED UNTIL IT IS DONE. A lesson has to
 * go in a period, so a builder that offered the grid first would present an
 * admin with an empty box and no way to add a column to it. The order on screen
 * is the order the work happens in.
 *
 * TIMES ARE TYPED, NOT PICKED. `<input type="time">` renders a spinner in some
 * browsers and a 12-hour AM/PM pair in others, and neither is quick for eight
 * rows in a row. A text box that accepts "8:30" is faster for somebody who knows
 * their own school day, and `parseTimeOfDay` refuses anything that is not a
 * time rather than guessing.
 */
export function DayPanel({ periods }: { periods: PeriodRow[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const live = periods.filter((period) => period.archivedAt === null);
  const retired = periods.filter((period) => period.archivedAt !== null);
  const clashes = overlappingPeriods(live);

  function seed() {
    startTransition(async () => {
      const result = await seedSuggestedDay();
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "timetable.couldNotSetUp") });
        return;
      }
      toast({ tone: "ok", title: t("timetable.periodsAdded", { count: result.created ?? 0 }) });
      router.refresh();
    });
  }

  function retire(period: PeriodRow) {
    startTransition(async () => {
      const result = await retirePeriod(period.id);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "timetable.couldNotRetire") });
        return;
      }
      toast({ tone: "ok", title: t("timetable.retired", { name: period.name }) });
      router.refresh();
    });
  }

  function restore(period: PeriodRow) {
    startTransition(async () => {
      const result = await bringBackPeriod(period.id);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "timetable.couldNotBringBack") });
        return;
      }
      toast({ tone: "ok", title: t("timetable.broughtBack", { name: period.name }) });
      router.refresh();
    });
  }

  if (periods.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-fg-muted">{t("timetable.nothingSetUp")}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={seed} loading={pending}>
            {t("timetable.startTypicalDay")}
          </Button>
          <Button variant="secondary" onClick={() => setAdding(true)}>
            {t("timetable.addOnePeriod")}
          </Button>
        </div>
        {adding && (
          <PeriodForm
            onDone={() => {
              setAdding(false);
              router.refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clashes.length > 0 && (
        <p
          role="status"
          className="rounded-[--radius-md] border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning"
        >
          {clashes.map(([a, b]) => t("timetable.overlaps", { a, b })).join("; ")}
          {t("timetable.overlapNote")}
        </p>
      )}

      <ul className="space-y-1.5">
        {live.map((period) =>
          editing === period.id ? (
            <li key={period.id}>
              <PeriodForm
                period={period}
                onDone={() => {
                  setEditing(null);
                  router.refresh();
                }}
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <li
              key={period.id}
              className="flex flex-wrap items-center gap-3 rounded-[--radius-sm] bg-surface-muted p-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{period.name}</span>
                <span className="block text-xs tabular-nums text-fg-muted">
                  {formatTimeRange(period.startMinute, period.endMinute)}
                  {period.kind === "BREAK" && t("timetable.breakSuffix")}
                </span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => setEditing(period.id)}>
                {t("common.edit")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => retire(period)} disabled={pending}>
                {t("timetable.retire")}
              </Button>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <PeriodForm
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          {t("timetable.addAPeriod")}
        </Button>
      )}

      {retired.length > 0 && (
        <details className="rounded-[--radius-sm] border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium text-fg-muted">
            {retired.length === 1
              ? t("timetable.retiredCountOne")
              : t("timetable.retiredCountMany", { count: retired.length })}
          </summary>
          {/* Said out loud, because "retire" reading as "delete" is the fear
              that stops an admin from tidying a day up. */}
          <p className="mt-2 text-xs text-fg-muted">{t("timetable.retiredNote")}</p>
          <ul className="mt-2 space-y-1.5">
            {retired.map((period) => (
              <li key={period.id} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-fg-muted">
                  {period.name} · {formatTimeRange(period.startMinute, period.endMinute)}
                </span>
                <Button size="sm" variant="ghost" onClick={() => restore(period)} disabled={pending}>
                  {t("timetable.bringBack")}
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function PeriodForm({
  period,
  onDone,
  onCancel,
}: {
  period?: PeriodRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(period?.name ?? "");
  const [start, setStart] = useState(period ? formatTimeOfDay(period.startMinute) : "");
  const [end, setEnd] = useState(period ? formatTimeOfDay(period.endMinute) : "");
  const [kind, setKind] = useState<PeriodKind>(period?.kind ?? "LESSON");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const startMinute = parseTimeOfDay(start);
    const endMinute = parseTimeOfDay(end);
    if (startMinute === null || endMinute === null) {
      setError(t("timetable.bothTimes"));
      return;
    }
    // The SAME function the server calls, so the two cannot disagree about
    // which times are usable.
    const timeError = periodTimeError({ startMinute, endMinute });
    if (timeError) {
      setError(t(timeError.key, timeError.vars));
      return;
    }
    if (name.trim().length < 1) {
      setError(t("timetable.needPeriodName"));
      return;
    }

    startTransition(async () => {
      const result = await savePeriod({
        periodId: period?.id ?? null,
        name: name.trim(),
        startMinute,
        endMinute,
        kind,
      });
      if (!result.ok) {
        setError(actionError(t, result, "timetable.couldNotSave"));
        return;
      }
      toast({
        tone: "ok",
        title: period
          ? t("timetable.periodUpdated", { name: name.trim() })
          : t("timetable.periodAdded", { name: name.trim() }),
      });
      onDone();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-[--radius-sm] border border-border bg-surface p-3"
      noValidate
    >
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
      <TextField
        label={t("timetable.name")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("timetable.namePlaceholder")}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t("timetable.starts")}
          required
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="08:30"
          inputMode="numeric"
        />
        <TextField
          label={t("timetable.ends")}
          required
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          placeholder="09:15"
          inputMode="numeric"
        />
      </div>
      <SelectField
        label={t("timetable.kind")}
        value={kind}
        onChange={(e) => setKind(e.target.value as PeriodKind)}
        hint={t(PERIOD_KIND_META[kind].descriptionKey)}
      >
        {(Object.keys(PERIOD_KIND_META) as PeriodKind[]).map((option) => (
          <option key={option} value={option}>
            {t(PERIOD_KIND_META[option].labelKey)}
          </option>
        ))}
      </SelectField>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {period ? t("common.save") : t("timetable.add")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        <ClockIcon className="size-3.5" /> {t("timetable.twentyFourHour")}
      </p>
    </form>
  );
}
