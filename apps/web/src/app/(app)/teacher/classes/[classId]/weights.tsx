"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon, ScalesIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { saveWeights } from "./actions";
import { useT } from "@/lib/i18n";

type Row = { name: string; percent: string };

/**
 * Grade weights for one class.
 *
 * THE RUNNING TOTAL IS THE WHOLE INTERFACE. The one rule a teacher has to
 * satisfy is that the weights add to 100%, so the total is shown at all times
 * and Save is disabled until it is right — rather than letting them fill the
 * form, press Save, and be told. The server enforces the same rule regardless;
 * this just means they find out while they can still see what they typed.
 *
 * Clearing every row is a legitimate action, not an error state: it turns
 * weighting off and returns the class to a straight points total. Save stays
 * enabled for an empty list and the caption says what will happen.
 */
export function GradeWeights({
  classId,
  initial,
  categoriesInUse,
}: {
  classId: string;
  initial: { name: string; weightBps: number }[];
  /** Category names that assignments actually use, for the "not weighted" hint. */
  categoriesInUse: string[];
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [rows, setRows] = useState<Row[]>(
    initial.length > 0
      ? initial.map((c) => ({ name: c.name, percent: String(c.weightBps / 100) }))
      : [{ name: "", percent: "" }],
  );

  const totalPercent = rows.reduce((sum, r) => {
    const value = Number.parseFloat(r.percent);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const named = rows.filter((r) => r.name.trim().length > 0);
  const isEmpty = named.length === 0;
  // Compared in basis points, because 0.1 + 0.2 in floating point is exactly
  // the sort of thing that would make a correct form refuse to save.
  const totalBps = Math.round((totalPercent * 10000) / 100);
  const balanced = isEmpty || totalBps === 10000;

  const unweighted = categoriesInUse.filter(
    (c) => !named.some((r) => r.name.trim() === c),
  );

  function update(index: number, patch: Partial<Row>) {
    setSaved(false);
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveWeights(classId, rows);
      if (!result.ok) {
        setError(result.error ?? t("teacher.couldNotSave"));
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        title={t("teacher.gradeWeights")}
        description={t("teacher.weightsBlurb")}
        icon={<ScalesIcon weight="duotone" className="size-5" />}
      />
      <CardBody className="space-y-4">
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={row.name}
                placeholder={t("teacher.categoryPlaceholder")}
                aria-label={t("teacher.categoryName", { n: index + 1 })}
                onChange={(e) => update(index, { name: e.target.value })}
                className="min-w-0 flex-1 rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  value={row.percent}
                  placeholder="20"
                  aria-label={t("teacher.categoryWeight", { n: index + 1 })}
                  onChange={(e) => update(index, { percent: e.target.value })}
                  className="w-20 rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-right text-sm tabular-nums text-fg"
                />
                <span className="text-sm text-fg-muted">%</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("teacher.removeCategory", { n: index + 1 })}
                onClick={() => {
                  setSaved(false);
                  setRows((current) => current.filter((_, i) => i !== index));
                }}
                icon={<TrashIcon weight="bold" className="size-4" />}
              />
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon weight="bold" className="size-4" />}
            onClick={() => {
              setSaved(false);
              setRows((current) => [...current, { name: "", percent: "" }]);
            }}
          >
            {t("teacher.addCategory")}
          </Button>

          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              isEmpty ? "text-fg-muted" : balanced ? "text-ok" : "text-warn",
            )}
            aria-live="polite"
          >
            {isEmpty
              ? t("teacher.noWeighting")
              : t("teacher.totalPercent", { percent: totalPercent.toFixed(2).replace(/\.00$/, "") })}
            {!isEmpty && !balanced && ` ${t("teacher.mustBe100")}`}
          </p>
        </div>

        {unweighted.length > 0 && (
          <p className="flex items-start gap-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft/40 p-3 text-xs text-fg">
            <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-warn" />
            <span>
              {t("teacher.unweightedWarning", {
                categories: unweighted.map((c) => `“${c}”`).join(", "),
              })}
            </span>
          </p>
        )}

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        {saved && !error && <p className="text-sm font-medium text-ok">{t("teacher.weightsSaved")}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={submit} loading={pending} disabled={!balanced}>
            {t("teacher.saveWeights")}
          </Button>
          <p className="text-xs text-fg-muted">
            {isEmpty
              ? t("teacher.weightsOffHint")
              : t("teacher.weightsScaleHint")}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
