"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { APPRAISAL_KINDS, type AppraisalEntry, type AppraisalKind } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField, DateField, SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDateKey } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { createAppraisalAction, deleteAppraisalAction, updateAppraisalAction } from "./actions";

export const APPRAISAL_KIND_KEY: Record<AppraisalKind, TranslationKey> = { OBSERVATION: "appraisal.kindObservation", TARGET: "appraisal.kindTarget", APPRAISAL: "appraisal.kindAppraisal" };
const KIND_TONE: Record<AppraisalKind, "accent" | "warn" | "ok"> = { OBSERVATION: "accent", TARGET: "warn", APPRAISAL: "ok" };

type Draft = { kind: AppraisalKind; dateKey: string; summary: string; strengths: string; targets: string; rating: string; visibleToStaff: boolean };
const blank = (today: string): Draft => ({ kind: "OBSERVATION", dateKey: today, summary: "", strengths: "", targets: "", rating: "", visibleToStaff: false });
const fromEntry = (e: AppraisalEntry): Draft => ({ kind: e.kind, dateKey: e.dateKey, summary: e.summary, strengths: e.strengths ?? "", targets: e.targets ?? "", rating: e.rating === null ? "" : String(e.rating), visibleToStaff: e.visibleToStaff });
const toBody = (d: Draft) => ({ kind: d.kind, dateKey: d.dateKey, summary: d.summary.trim(), strengths: d.strengths.trim() || null, targets: d.targets.trim() || null, rating: d.rating === "" ? null : Number(d.rating), visibleToStaff: d.visibleToStaff });

/**
 * One member of staff's timeline and the head's form: a new entry at the
 * top, each entry editable in place, removable, and shown to the member of
 * staff only when the head ticks it. The office reads the same list with
 * nothing to press.
 */
export function AppraisalPanel({ membershipId, items, canEdit, today }: { membershipId: string; items: AppraisalEntry[]; canEdit: boolean; today: string }) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {canEdit && !adding && (
        <Button type="button" onClick={() => setAdding(true)} icon={<PlusIcon weight="bold" />}>
          {t("appraisal.add")}
        </Button>
      )}
      {canEdit && adding && (
        <section aria-label={t("appraisal.add")} className="rounded-[--radius-md] border border-border p-3.5">
          <h3 className="mb-3 text-sm font-semibold text-fg">{t("appraisal.add")}</h3>
          <EntryForm membershipId={membershipId} initial={blank(today)} onDone={() => setAdding(false)} />
        </section>
      )}
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-fg-muted">{canEdit ? t("appraisal.emptyHead") : t("appraisal.emptyOffice")}</p>
      ) : (
        <ol className="divide-y divide-border">
          {items.map((e) => (
            <li key={e.id} className="py-3">
              {editing === e.id ? (
                <EntryForm membershipId={membershipId} appraisalId={e.id} initial={fromEntry(e)} onDone={() => setEditing(null)} />
              ) : (
                <EntryView entry={e} canEdit={canEdit} membershipId={membershipId} onEdit={() => setEditing(e.id)} />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** An entry as read: kind, day, year, the rating as stars-in-words, the three texts, and whether the member of staff can see it. */
export function EntryView({ entry, canEdit, membershipId, onEdit }: { entry: AppraisalEntry; canEdit: boolean; membershipId: string; onEdit?: () => void }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const day = formatDateKey(entry.dateKey, { day: "numeric", month: "short", year: "numeric" }, locale);

  function remove() {
    startTransition(async () => {
      const result = await deleteAppraisalAction({ membershipId, appraisalId: entry.id });
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("appraisal.removed") });
      router.refresh();
    });
  }

  function toggleVisible() {
    startTransition(async () => {
      const result = await updateAppraisalAction({ membershipId, appraisalId: entry.id, entry: { ...toBody(fromEntry(entry)), visibleToStaff: !entry.visibleToStaff } });
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: entry.visibleToStaff ? t("appraisal.hidden") : t("appraisal.shown") });
      router.refresh();
    });
  }

  return (
    <article className="space-y-2">
      <header className="flex flex-wrap items-center gap-2">
        <Badge tone={KIND_TONE[entry.kind]} size="sm">
          {t(APPRAISAL_KIND_KEY[entry.kind])}
        </Badge>
        <span className="text-sm font-medium text-fg">{day}</span>
        <span className="text-xs text-fg-muted">{[entry.year, t("appraisal.byHead", { name: entry.appraiserName })].join(" · ")}</span>
        {entry.rating !== null && (
          <span className="text-xs font-semibold text-fg" aria-label={t("appraisal.ratingOf", { rating: entry.rating })}>
            {t("appraisal.ratingShort", { rating: entry.rating })}
          </span>
        )}
        <Badge tone={entry.visibleToStaff ? "ok" : "neutral"} size="sm">
          {entry.visibleToStaff ? t("appraisal.visible") : t("appraisal.private")}
        </Badge>
      </header>
      <p className="whitespace-pre-line text-sm text-fg">{entry.summary}</p>
      {entry.strengths && (
        <p className="text-sm text-fg">
          <span className="font-medium">{t("appraisal.strengths")}:</span> <span className="whitespace-pre-line">{entry.strengths}</span>
        </p>
      )}
      {entry.targets && (
        <p className="text-sm text-fg">
          <span className="font-medium">{t("appraisal.targets")}:</span> <span className="whitespace-pre-line">{entry.targets}</span>
        </p>
      )}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onEdit} icon={<PencilSimpleIcon weight="bold" />}>
            {t("common.edit")}
          </Button>
          <Button type="button" size="sm" variant="ghost" loading={pending} onClick={toggleVisible} icon={entry.visibleToStaff ? <EyeSlashIcon weight="bold" /> : <EyeIcon weight="bold" />}>
            {entry.visibleToStaff ? t("appraisal.hide") : t("appraisal.show")}
          </Button>
          {confirming ? (
            <>
              <Button type="button" size="sm" variant="danger" loading={pending} onClick={remove}>
                {t("appraisal.removeConfirm")}
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(true)} icon={<TrashIcon weight="bold" />}>
              {t("common.remove")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

function EntryForm({ membershipId, appraisalId, initial, onDone }: { membershipId: string; appraisalId?: string; initial: Draft; onDone: () => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function submit() {
    if (!draft.summary.trim()) return setError(t("appraisal.summaryRequired"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dateKey)) return setError(t("refusal.useRealDateForm"));
    setError(null);
    startTransition(async () => {
      const entry = toBody(draft);
      const result = appraisalId ? await updateAppraisalAction({ membershipId, appraisalId, entry }) : await createAppraisalAction({ membershipId, entry });
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t("appraisal.saved") });
      onDone();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField label={t("appraisal.kind")} value={draft.kind} onChange={(e) => set("kind", e.target.value as AppraisalKind)}>
          {APPRAISAL_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(APPRAISAL_KIND_KEY[k])}
            </option>
          ))}
        </SelectField>
        <DateField label={t("appraisal.date")} required value={draft.dateKey} onChange={(e) => set("dateKey", e.target.value)} />
        <SelectField label={t("appraisal.rating")} hint={t("appraisal.ratingHint")} value={draft.rating} onChange={(e) => set("rating", e.target.value)}>
          <option value="">{t("appraisal.noRating")}</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>
              {t("appraisal.ratingShort", { rating: n })}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField label={t("appraisal.summary")} required maxLength={4000} value={draft.summary} onChange={(e) => set("summary", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextAreaField label={t("appraisal.strengths")} maxLength={4000} rows={3} value={draft.strengths} onChange={(e) => set("strengths", e.target.value)} />
        <TextAreaField label={t("appraisal.targets")} maxLength={4000} rows={3} value={draft.targets} onChange={(e) => set("targets", e.target.value)} />
      </div>
      <CheckboxField label={t("appraisal.visibleLabel")} description={t("appraisal.visibleHint")} checked={draft.visibleToStaff} onChange={(e) => set("visibleToStaff", e.target.checked)} />
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {appraisalId ? t("common.save") : t("appraisal.add")}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
