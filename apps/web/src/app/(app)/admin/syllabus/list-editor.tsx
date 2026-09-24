"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, FloppyDiskIcon, PlusIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { saveOfficeSyllabusAction } from "./actions";

type Unit = { id: string; position: number; title: string; periodsPlanned: number | null };
/** A row of the editor: `id` is the saved unit's, absent for one added here; `key` is only for React. */
type Draft = { key: string; id?: string; title: string; periods: string };

let seq = 0;
const nextKey = () => `new-${++seq}`;

/**
 * One pasted line becomes a chapter: the whole line is the title, unless a
 * tab or a comma separates a small number at the end, which is its periods.
 * "Numbers to 10,000" stays one title — the comma there follows a digit —
 * while "Fractions, 8" and "Fractions<tab>8" are a chapter of eight periods.
 */
export function parsePastedChapters(text: string): { title: string; periods: string }[] {
  const out: { title: string; periods: string }[] = [];
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const tab = line.lastIndexOf("\t");
    if (tab >= 0) {
      const title = line.slice(0, tab).trim();
      const tail = line.slice(tab + 1).trim();
      if (title) out.push({ title, periods: /^\d{1,3}$/.test(tail) ? tail : "" });
      continue;
    }
    const m = /^(.*\D)\s*,\s*(\d{1,3})$/.exec(line);
    if (m) out.push({ title: m[1]!.trim(), periods: m[2]! });
    else out.push({ title: line, periods: "" });
  }
  return out;
}

/**
 * The chapter list for one grade and subject, in teaching order. Every row
 * keeps the id it came with so a class's progress on that chapter survives
 * a retitle or a move; a row removed here removes that progress, which the
 * warning under the list says before the save does it.
 */
/** `readOnly` is the head's view: the list as it stands, nothing to move, add or save, because the lists are the admin's. */
export function ListEditor({ gradeLevel, subject, units, readOnly = false }: { gradeLevel: string; subject: string; units: Unit[]; readOnly?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<Draft[]>(() => units.map((u) => ({ key: u.id, id: u.id, title: u.title, periods: u.periodsPlanned === null ? "" : String(u.periodsPlanned) })));
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);

  const removedCount = units.filter((u) => !rows.some((r) => r.id === u.id)).length;

  const update = (key: string, patch: Partial<Draft>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (index: number, delta: number) =>
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row!);
      return next;
    });
  const remove = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));
  const add = () => setRows((prev) => [...prev, { key: nextKey(), title: "", periods: "" }]);
  const appendPasted = () => {
    const parsed = parsePastedChapters(paste);
    if (parsed.length === 0) return;
    setRows((prev) => [...prev, ...parsed.map((p) => ({ key: nextKey(), title: p.title, periods: p.periods }))]);
    setPaste("");
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = rows
      .map((r) => ({ id: r.id, title: r.title.trim(), periodsPlanned: r.periods.trim() === "" ? null : Number(r.periods) }))
      .filter((r) => r.title.length > 0);
    if (payload.some((r) => r.periodsPlanned !== null && (!Number.isInteger(r.periodsPlanned) || r.periodsPlanned < 0 || r.periodsPlanned > 999))) {
      setError(t("common.checkTheForm"));
      return;
    }
    startTransition(async () => {
      const result = await saveOfficeSyllabusAction({ gradeLevel, subject, units: payload.map((r) => (r.id ? r : { title: r.title, periodsPlanned: r.periodsPlanned })) });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("syllabus.saved") });
      router.refresh();
    });
  }

  const iconButton = "grid size-10 shrink-0 place-items-center rounded-[--radius-md] text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="syllabus-list-editor">
      {readOnly && (
        <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted" data-testid="office-sets-this">
          {t("common.officeSetsThis")}
        </p>
      )}
      <fieldset disabled={readOnly} className="min-w-0 space-y-5">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <ol className="space-y-2" aria-label={t("syllabus.chapters")}>
        {rows.map((row, index) => {
          // The row's name for a screen reader: its title, or its number until it has one.
          const name = row.title.trim() || String(index + 1);
          const chapterLabel = [t("syllabus.chapter"), String(index + 1)].join(" ");
          const moveUpLabel = [t("syllabus.moveUp"), name].join(": ");
          const moveDownLabel = [t("syllabus.moveDown"), name].join(": ");
          return (
            <li key={row.key} className="flex flex-wrap items-end gap-2 rounded-[--radius-md] border border-border p-3 sm:flex-nowrap">
              <span className="w-6 shrink-0 pb-3 text-right text-sm tabular-nums text-fg-muted" aria-hidden="true">
                {index + 1}.
              </span>
              <TextField label={chapterLabel} value={row.title} maxLength={160} autoComplete="off" onChange={(e) => update(row.key, { title: e.target.value })} className="min-w-0 flex-1 [&_input]:min-h-10 [&_input]:py-2" />
              <TextField label={t("syllabus.periodsPlanned")} type="number" inputMode="numeric" min={0} max={999} step={1} value={row.periods} onChange={(e) => update(row.key, { periods: e.target.value })} className="w-24 shrink-0 [&_input]:min-h-10 [&_input]:py-2" />
              <span className="flex shrink-0 items-center gap-0.5 pb-0.5">
                <button type="button" className={iconButton} disabled={index === 0} onClick={() => move(index, -1)} aria-label={moveUpLabel} title={t("syllabus.moveUp")}>
                  <ArrowUpIcon weight="bold" className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className={iconButton} disabled={index === rows.length - 1} onClick={() => move(index, 1)} aria-label={moveDownLabel} title={t("syllabus.moveDown")}>
                  <ArrowDownIcon weight="bold" className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className={`${iconButton} hover:text-danger`} onClick={() => remove(row.key)} aria-label={t("syllabus.removeChapter", { title: name })} title={t("common.remove")}>
                  <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={add} icon={<PlusIcon weight="bold" />}>
            {t("syllabus.addChapter")}
          </Button>
        </div>
      )}

      {!readOnly && (
        <div className="space-y-2 rounded-[--radius-md] border border-dashed border-border p-3">
          <TextAreaField label={t("syllabus.paste")} hint={t("syllabus.pasteHint")} rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} />
          <Button type="button" variant="secondary" size="sm" disabled={paste.trim() === ""} onClick={appendPasted} icon={<PlusIcon weight="bold" />}>
            {t("common.add")}
          </Button>
        </div>
      )}

      {(removedCount > 0 || units.length > 0) && (
        <p className={`flex items-start gap-2 text-sm ${removedCount > 0 ? "rounded-[--radius-md] border border-warn/40 bg-warn-soft px-3 py-2 text-warn" : "text-fg-muted"}`}>
          <WarningIcon weight={removedCount > 0 ? "fill" : "regular"} className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("syllabus.removedNote")}
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
            {t("syllabus.save")}
          </Button>
        </div>
      )}
      </fieldset>
    </form>
  );
}
