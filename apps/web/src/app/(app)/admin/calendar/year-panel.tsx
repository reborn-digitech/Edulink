"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, GraduationCapIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateKey } from "@/lib/dates";
import { startAcademicYear, rollOverAcademicYear, reopenYear } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

type Year = {
  id: string;
  name: string;
  startDateKey: string;
  endDateKey: string;
  isCurrent: boolean;
  closedAt: string | null;
};

/**
 * Starting a year, and ending one.
 *
 * The two are deliberately not the same control. Starting is cheap and reversible
 * in practice — nothing has happened yet. CLOSING archives every child's badges
 * and empties the board for a fresh year, so it asks for confirmation and states
 * plainly what it is about to do, in the numbers the admin will see afterwards.
 */
export function YearPanel({ years, today }: { years: Year[]; today: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const current = years.find((year) => year.isCurrent) ?? null;
  const candidates = years.filter((year) => !year.isCurrent && !year.closedAt);

  // One source for all three defaults. Deriving the name from one calculation
  // and the dates from another is how a form ends up suggesting "2026–27"
  // running from June 2027.
  const suggested = suggestYear(today, current !== null);

  const [showForm, setShowForm] = useState(current === null);
  const [name, setName] = useState(suggested.name);
  const [start, setStart] = useState(suggested.startDateKey);
  const [end, setEnd] = useState(suggested.endDateKey);
  const [error, setError] = useState<string | null>(null);

  const [nextYearId, setNextYearId] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [confirmingReopen, setConfirmingReopen] = useState(false);

  // The undo lives on the LATEST closed year only — reopening an older one
  // would leave a running year after a still-closed one.
  const lastClosed = years
    .filter((year) => year.closedAt !== null)
    .sort((a, b) => (b.closedAt! < a.closedAt! ? -1 : 1))[0];

  function reopen() {
    if (!lastClosed) return;
    startTransition(async () => {
      const result = await reopenYear(lastClosed.id);
      if (!result.ok) {
        toast({ tone: "warn", title: t("calendar.couldNotReopen"), description: actionError(t, result) });
        return;
      }
      toast({
        tone: "ok",
        title: t("calendar.yearReopened", { name: lastClosed.name }),
        description: t("calendar.reopenedBody", { series: result.seriesRestored ?? 0 }),
      });
      setConfirmingReopen(false);
      router.refresh();
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError(t("calendar.yearNeedName"));
      return;
    }
    if (end <= start) {
      setError(t("calendar.yearEndAfterStart"));
      return;
    }

    startTransition(async () => {
      const result = await startAcademicYear({
        name: name.trim(),
        startDateKey: start,
        endDateKey: end,
      });
      if (!result.ok) {
        setError(actionError(t, result, "calendar.couldNotSaveYear"));
        return;
      }
      toast({
        tone: "ok",
        title: t("calendar.yearAdded", { name: name.trim() }),
        description: current ? t("calendar.yearIsWaiting") : t("calendar.yearNowCurrent"),
      });
      setShowForm(false);
      router.refresh();
    });
  }

  function rollOver() {
    if (!current || !nextYearId) return;
    startTransition(async () => {
      const result = await rollOverAcademicYear(current.id, nextYearId);
      if (!result.ok) {
        toast({ tone: "warn", title: t("calendar.couldNotClose"), description: actionError(t, result) });
        return;
      }
      toast({
        tone: "ok",
        title: t("calendar.yearClosed", { name: current.name }),
        description: [
          t("calendar.badgesKept", {
            badges: result.badgesArchived ?? 0,
            students: result.studentsArchived ?? 0,
          }),
          t("calendar.yearTidied", {
            series: result.seriesArchived ?? 0,
            rounds: result.roundsClosed ?? 0,
          }),
        ].join(" "),
      });
      setConfirming(false);
      setNextYearId("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* ---------------- what is running ---------------- */}
      {current ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-ok/40 bg-ok-soft/40 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ok text-white">
            <CheckCircleIcon weight="fill" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">{current.name}</p>
            <p className="text-sm text-fg-muted">
              {t("calendar.rangeTo", {
                from: formatDateKey(current.startDateKey, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
                to: formatDateKey(current.endDateKey, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              })}
            </p>
          </div>
          <Badge tone="ok" size="sm">
            {t("calendar.current")}
          </Badge>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">{t("calendar.noYearBody")}</p>
      )}

      {/* ---------------- years waiting or finished ---------------- */}
      {years.length > 1 && (
        <ul className="space-y-1.5">
          {years
            .filter((year) => !year.isCurrent)
            .map((year) => (
              <li
                key={year.id}
                className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border p-2.5 text-sm"
              >
                <span className="flex-1 font-medium text-fg">{year.name}</span>
                <span className="text-fg-muted">
                  {formatDateKey(year.startDateKey, { day: "numeric", month: "short" })} –{" "}
                  {formatDateKey(year.endDateKey, { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <Badge tone={year.closedAt ? "neutral" : "info"} size="sm">
                  {year.closedAt ? t("calendar.closed") : t("calendar.waiting")}
                </Badge>
                {/* The undo for a close pressed by mistake, offered only on
                    the latest closed year. It confirms, because reopening
                    unfreezes marks a teacher may believe are final. */}
                {lastClosed && year.id === lastClosed.id && !confirmingReopen && (
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmingReopen(true)}>
                    {t("calendar.reopenCta")}
                  </Button>
                )}
                {lastClosed && year.id === lastClosed.id && confirmingReopen && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Button variant="danger" size="sm" loading={pending} onClick={reopen}>
                      {t("calendar.confirmReopen", { name: lastClosed.name })}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingReopen(false)}>
                      {t("calendar.notYet")}
                    </Button>
                  </span>
                )}
              </li>
            ))}
        </ul>
      )}

      {/* ---------------- add a year ---------------- */}
      {showForm ? (
        <form onSubmit={submit} className="space-y-4 rounded-[var(--radius-md)] border border-border p-4" noValidate>
          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <TextField
            label={t("calendar.yearName")}
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="2026–27"
            hint={t("calendar.yearNameHint")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              label={t("calendar.starts")}
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <DateField
              label={t("calendar.ends")}
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              hint={t("calendar.yearEndsHint")}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" loading={pending}>
              {current ? t("calendar.addThisYear") : t("calendar.startTheYear")}
            </Button>
            {current && (
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          {t("calendar.addNextYear")}
        </Button>
      )}

      {/* ---------------- close the year ---------------- */}
      {current && candidates.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft/30 p-4">
          <div className="flex items-start gap-2.5">
            <WarningIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-warn" />
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-fg">
                {t("calendar.endYear", { name: current.name })}
              </p>
              {/*
                Said in full, because this is the one irreversible thing on the
                page. An admin who does not know that badges are archived rather
                than deleted will not press it; one who thinks nothing happens
                will press it in the middle of term.
              */}
              <p className="text-sm text-fg-muted">{t("calendar.endYearBody")}</p>
              <p className="text-sm text-fg-muted">{t("calendar.endYearTidy")}</p>
              {/* Closing the year flips the date; it moves nobody. The move
                  is its own page, linked here because this is where an admin
                  stands at the end of the year. */}
              <Link
                href="/admin/promotion"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
              >
                <GraduationCapIcon weight="bold" className="size-4" />
                {t("promotion.link")}
              </Link>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <SelectField
              label={t("calendar.moveInto")}
              value={nextYearId}
              onChange={(e) => {
                setNextYearId(e.target.value);
                setConfirming(false);
              }}
            >
              <option value="">{t("calendar.chooseYear")}</option>
              {candidates.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </SelectField>

            {confirming ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="danger" loading={pending} onClick={rollOver}>
                  {t("calendar.confirmClose", { name: current.name })}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  {t("calendar.notYet")}
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                disabled={!nextYearId}
                onClick={() => setConfirming(true)}
              >
                {t("calendar.closeTheYear")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A first guess at the year being set up: name and both dates, together.
 *
 * The Indian school year runs roughly June to April, so before June the year
 * currently running started in the PREVIOUS calendar year — a naive
 * `today.getFullYear()` suggests 2027–28 to somebody setting up in February 2027
 * and is wrong by a whole year.
 *
 * `alreadyHasOne` shifts the guess forward, because an admin who already has a
 * current year and presses "Add next year" means next year.
 *
 * Only a default. Every field stays editable, and a school that runs April to
 * March just types over it.
 */
export function suggestYear(
  today: string,
  alreadyHasOne: boolean,
): { name: string; startDateKey: string; endDateKey: string } {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const running = month >= 6 ? year : year - 1;
  const startYear = alreadyHasOne ? running + 1 : running;

  return {
    name: `${startYear}–${String(startYear + 1).slice(2)}`,
    startDateKey: `${startYear}-06-01`,
    endDateKey: `${startYear + 1}-04-30`,
  };
}
