"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { formatDateKey } from "@/lib/dates";
import { addTerm, removeTerm, markTermFinished } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

/** `rounds` and `cards`: the exam rounds and draft report cards that removing the term unhooks (TA-234). */
type Term = { id: string; name: string; startDateKey: string; endDateKey: string; current: boolean; finished: boolean; rounds?: number; cards?: number };

/**
 * The current year's terms. A short list and a one-line form: name, from,
 * to. The suggested name counts on from the last one; the suggested start
 * is the day after the last term ends, so three presses of Add make a
 * year of three terms with no typing.
 */
export function TermsPanel({
  academicYearId,
  yearStartKey,
  yearEndKey,
  terms,
}: {
  academicYearId: string;
  yearStartKey: string;
  yearEndKey: string;
  terms: Term[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const last = terms[terms.length - 1];
  const nextStart = last ? addDays(last.endDateKey, 1) : yearStartKey;
  const [name, setName] = useState(`${t("terms.namePlaceholder").replace(/\d+$/, "").trim()} ${terms.length + 1}`);
  const [start, setStart] = useState(nextStart);
  const [end, setEnd] = useState(yearEndKey);
  const [error, setError] = useState<string | null>(null);

  function add(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addTerm(academicYearId, { name, startDateKey: start, endDateKey: end });
      if (!result.ok) {
        setError(actionError(t, result, "terms.notAdded"));
        return;
      }
      toast({ tone: "ok", title: t("terms.added") });
      setName(`${t("terms.namePlaceholder").replace(/\d+$/, "").trim()} ${terms.length + 2}`);
      setStart(addDays(end, 1));
      setEnd(yearEndKey);
      router.refresh();
    });
  }

  function remove(term: Term) {
    // One press on an X took the term at once, and its exam rounds and draft cards lost it for good (TA-234):
    // the office now confirms, told what is attached.
    if (!window.confirm(t("terms.removeConfirm", { name: term.name, rounds: term.rounds ?? 0, cards: term.cards ?? 0 }))) return;
    startTransition(async () => {
      const result = await removeTerm(term.id);
      if (!result.ok) {
        toast({ tone: "warn", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("terms.removed") });
      router.refresh();
    });
  }

  function setFinished(term: Term, finished: boolean) {
    startTransition(async () => {
      const result = await markTermFinished(term.id, finished);
      if (!result.ok) {
        toast({ tone: "warn", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({
        tone: "ok",
        title: finished ? t("terms.finishedToast", { name: term.name }) : t("terms.reopenedToast", { name: term.name }),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3" data-testid="terms-panel">
      <div>
        <p className="text-sm font-semibold text-fg">{t("terms.title")}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{t("terms.intro")}</p>
      </div>

      {terms.length === 0 ? (
        <p className="text-sm text-fg-subtle">{t("terms.none")}</p>
      ) : (
        <ul className="space-y-1.5">
          {terms.map((term) => (
            <li key={term.id} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border p-2.5 text-sm">
              <span className="flex-1 font-medium text-fg">{term.name}</span>
              <span className="text-fg-muted">
                {formatDateKey(term.startDateKey, { day: "numeric", month: "short" })} – {formatDateKey(term.endDateKey, { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {term.finished ? (
                <Badge tone="neutral" size="sm">{t("terms.finished")}</Badge>
              ) : (
                term.current && <Badge tone="ok" size="sm">{t("terms.current")}</Badge>
              )}
              {/* The milestone CTA: mark a term done, or take it back. A
                  milestone, not a lock — the freeze belongs to closing the
                  YEAR, below. */}
              <Button
                type="button"
                variant={term.finished ? "ghost" : "secondary"}
                size="sm"
                disabled={pending}
                onClick={() => setFinished(term, !term.finished)}
              >
                {term.finished ? t("terms.reopenCta") : t("terms.finishCta")}
              </Button>
              <Button type="button" variant="ghost" size="sm" icon={<XIcon />} aria-label={t("terms.remove")} disabled={pending} onClick={() => remove(term)} />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="grid gap-2 rounded-[var(--radius-md)] border border-dashed border-border p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end" noValidate>
        {error && <p role="alert" className="text-sm font-medium text-danger sm:col-span-4">{error}</p>}
        <TextField label={t("terms.name")} value={name} required onChange={(e) => setName(e.target.value)} placeholder={t("terms.namePlaceholder")} data-testid="term-name" />
        <DateField label={t("terms.starts")} value={start} required onChange={(e) => setStart(e.target.value)} />
        <DateField label={t("terms.ends")} value={end} required onChange={(e) => setEnd(e.target.value)} />
        <Button type="submit" size="sm" loading={pending} icon={<PlusIcon weight="bold" />}>
          {t("terms.add")}
        </Button>
      </form>
    </div>
  );
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
