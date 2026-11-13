"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { formatPaise, parseRupees } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useLocale, useT } from "@/lib/i18n";
import type { StructureInput } from "@/lib/fees";
import { saveStructureAction } from "./actions";

export type EditorHead = { id: string; name: string; code: string };
export type EditorInstalment = { label: string; dueDateKey: string; lines: { headId: string; amount: string }[] };
export type EditorValue = { name: string; gradeLevel: string; instalments: EditorInstalment[] };

/**
 * The structure editor: a name, a grade, and instalments each made of head
 * lines. Amounts are typed in rupees and sent as paise; the totals update as
 * they are typed so the office can see "₹42,000 a year" before saving. Only
 * a draft reaches this editor — a published structure is frozen and its
 * page says so instead of drawing this.
 */
export function StructureEditor({ structureId, initial, heads, todayKey }: { structureId: string | null; initial: EditorValue | null; heads: EditorHead[]; todayKey: string }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const firstHead = heads[0]?.id ?? "";
  const [value, setValue] = useState<EditorValue>(initial ?? { name: "", gradeLevel: "", instalments: [{ label: "", dueDateKey: todayKey, lines: [{ headId: firstHead, amount: "" }] }] });
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const per = value.instalments.map((i) => i.lines.reduce((sum, l) => sum + (parseRupees(l.amount || "0") ?? 0), 0));
    return { per, all: per.reduce((a, b) => a + b, 0) };
  }, [value.instalments]);

  function patchInstalment(index: number, patch: Partial<EditorInstalment>) {
    setValue((v) => ({ ...v, instalments: v.instalments.map((i, n) => (n === index ? { ...i, ...patch } : i)) }));
  }
  function patchLine(index: number, lineIndex: number, patch: Partial<EditorInstalment["lines"][number]>) {
    setValue((v) => ({ ...v, instalments: v.instalments.map((i, n) => (n === index ? { ...i, lines: i.lines.map((l, m) => (m === lineIndex ? { ...l, ...patch } : l)) } : i)) }));
  }
  function addInstalment() {
    setValue((v) => {
      const last = v.instalments[v.instalments.length - 1];
      return { ...v, instalments: [...v.instalments, { label: "", dueDateKey: last?.dueDateKey ?? todayKey, lines: last ? last.lines.map((l) => ({ ...l })) : [{ headId: firstHead, amount: "" }] }] };
    });
  }
  function removeInstalment(index: number) {
    setValue((v) => ({ ...v, instalments: v.instalments.filter((_, n) => n !== index) }));
  }
  function addLine(index: number) {
    const used = new Set(value.instalments[index]?.lines.map((l) => l.headId));
    const next = heads.find((h) => !used.has(h.id))?.id ?? firstHead;
    patchInstalment(index, { lines: [...(value.instalments[index]?.lines ?? []), { headId: next, amount: "" }] });
  }
  function removeLine(index: number, lineIndex: number) {
    patchInstalment(index, { lines: (value.instalments[index]?.lines ?? []).filter((_, m) => m !== lineIndex) });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (value.name.trim().length < 2) return setError(t("fees.refuseStructureName"));
    if (value.instalments.length === 0 || value.instalments.length > 12) return setError(t("fees.refuseInstalments"));
    const instalments: StructureInput["instalments"] = [];
    for (const i of value.instalments) {
      if (!i.label.trim()) return setError(t("fees.refuseInstalmentLabel"));
      if (!i.dueDateKey) return setError(t("fees.refuseDate"));
      if (i.lines.length === 0) return setError(t("fees.refuseLines"));
      const lines: StructureInput["instalments"][number]["lines"] = [];
      for (const l of i.lines) {
        const amountPaise = parseRupees(l.amount || "0");
        if (amountPaise === null) return setError(t("fees.refuseAmount"));
        if (!l.headId) return setError(t("fees.refuseUnknownHead"));
        lines.push({ headId: l.headId, amountPaise });
      }
      instalments.push({ label: i.label.trim(), dueDateKey: i.dueDateKey, lines });
    }
    if (totals.all === 0) return setError(t("fees.refuseZeroStructure"));
    startTransition(async () => {
      const result = await saveStructureAction(structureId, { name: value.name.trim(), gradeLevel: value.gradeLevel.trim() || null, instalments });
      if (!result.ok || !result.id) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.settingsSaved") });
      router.push(`/admin/fees/structures/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <TextField label={t("fees.structureName")} required value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} />
        <TextField label={t("fees.structureGrade")} value={value.gradeLevel} maxLength={12} placeholder={t("fees.structureAllGrades")} onChange={(e) => setValue({ ...value, gradeLevel: e.target.value })} />
      </div>

      <ol className="space-y-4">
        {value.instalments.map((inst, index) => (
          <li key={index} className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <TextField label={t("fees.structureInstalmentLabel")} required maxLength={40} value={inst.label} onChange={(e) => patchInstalment(index, { label: e.target.value })} />
              <DateField label={t("fees.structureDueDate")} required value={inst.dueDateKey} onChange={(e) => patchInstalment(index, { dueDateKey: e.target.value })} />
              <Button type="button" variant="ghost" size="sm" icon={<TrashIcon />} onClick={() => removeInstalment(index)} disabled={value.instalments.length === 1} className="sm:mb-1">
                {t("fees.structureRemoveInstalment")}
              </Button>
            </div>
            <ul className="space-y-2">
              {inst.lines.map((line, lineIndex) => (
                <li key={lineIndex} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
                  <SelectField label={t("fees.structureHead")} value={line.headId} onChange={(e) => patchLine(index, lineIndex, { headId: e.target.value })}>
                    {heads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code})
                      </option>
                    ))}
                  </SelectField>
                  <TextField label={t("fees.structureAmount")} inputMode="decimal" value={line.amount} onChange={(e) => patchLine(index, lineIndex, { amount: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.remove")} onClick={() => removeLine(index, lineIndex)} disabled={inst.lines.length === 1} className="sm:mb-1">
                    <TrashIcon />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" icon={<PlusIcon weight="bold" />} onClick={() => addLine(index)} disabled={inst.lines.length >= heads.length || inst.lines.length >= 30}>
                {t("fees.structureAddLine")}
              </Button>
              <span className="text-sm tabular-nums text-fg-muted">
                {t("fees.lineNet")}: <strong className="text-fg">{formatPaise(totals.per[index] ?? 0, locale)}</strong>
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" icon={<PlusIcon weight="bold" />} onClick={addInstalment} disabled={value.instalments.length >= 12}>
          {t("fees.structureAddInstalment")}
        </Button>
        <span className="text-sm tabular-nums text-fg-muted">
          {t("fees.structureTotal")}: <strong className="text-lg text-fg">{formatPaise(totals.all, locale)}</strong>
        </span>
      </div>

      <Button type="submit" loading={pending} block>
        {t("fees.structureSave")}
      </Button>
    </form>
  );
}
