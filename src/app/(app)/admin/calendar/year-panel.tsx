"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateKey } from "@/lib/dates";
import { startAcademicYear, rollOverAcademicYear } from "./actions";

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

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Give the year a name — “2026–27” is what most schools write.");
      return;
    }
    if (end <= start) {
      setError("The year has to end after it starts.");
      return;
    }

    startTransition(async () => {
      const result = await startAcademicYear({
        name: name.trim(),
        startDateKey: start,
        endDateKey: end,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save that year.");
        return;
      }
      toast({
        tone: "ok",
        title: `${name.trim()} added`,
        description: current
          ? "It is waiting — close the current year when you are ready to move into it."
          : "This is now your current year. Attendance badges are counted from its start date.",
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
        toast({ tone: "warn", title: "Could not close the year", description: result.error });
        return;
      }
      toast({
        tone: "ok",
        title: `${current.name} is closed`,
        description: `${result.badgesArchived ?? 0} badges kept for good across ${
          result.studentsArchived ?? 0
        } students.`,
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
        <div className="flex flex-wrap items-center gap-3 rounded-[--radius-md] border border-ok/40 bg-ok-soft/40 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ok text-white">
            <CheckCircleIcon weight="fill" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">{current.name}</p>
            <p className="text-sm text-fg-muted">
              {formatDateKey(current.startDateKey, { day: "numeric", month: "long", year: "numeric" })}{" "}
              to{" "}
              {formatDateKey(current.endDateKey, { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <Badge tone="ok" size="sm">
            Current
          </Badge>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">
          Until a year is set up, attendance badges look back a rolling 60 days and never reset.
        </p>
      )}

      {/* ---------------- years waiting or finished ---------------- */}
      {years.length > 1 && (
        <ul className="space-y-1.5">
          {years
            .filter((year) => !year.isCurrent)
            .map((year) => (
              <li
                key={year.id}
                className="flex flex-wrap items-center gap-2 rounded-[--radius-md] border border-border p-2.5 text-sm"
              >
                <span className="flex-1 font-medium text-fg">{year.name}</span>
                <span className="text-fg-muted">
                  {formatDateKey(year.startDateKey, { day: "numeric", month: "short" })} –{" "}
                  {formatDateKey(year.endDateKey, { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <Badge tone={year.closedAt ? "neutral" : "info"} size="sm">
                  {year.closedAt ? "Closed" : "Waiting"}
                </Badge>
              </li>
            ))}
        </ul>
      )}

      {/* ---------------- add a year ---------------- */}
      {showForm ? (
        <form onSubmit={submit} className="space-y-4 rounded-[--radius-md] border border-border p-4" noValidate>
          {error && (
            <p
              role="alert"
              className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <TextField
            label="Year name"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="2026–27"
            hint="However your school writes it — this is what parents will see."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              label="Starts"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <DateField
              label="Ends"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              hint="A guide, not a trigger — you close the year yourself."
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" loading={pending}>
              {current ? "Add this year" : "Start the academic year"}
            </Button>
            {current && (
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          Add next year
        </Button>
      )}

      {/* ---------------- close the year ---------------- */}
      {current && candidates.length > 0 && (
        <div className="rounded-[--radius-md] border border-warn/40 bg-warn-soft/30 p-4">
          <div className="flex items-start gap-2.5">
            <WarningIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-warn" />
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-fg">End {current.name}</p>
              {/*
                Said in full, because this is the one irreversible thing on the
                page. An admin who does not know that badges are archived rather
                than deleted will not press it; one who thinks nothing happens
                will press it in the middle of term.
              */}
              <p className="text-sm text-fg-muted">
                Every badge each child holds right now is written into their profile and kept
                forever. The new year then starts empty — nobody holds an attendance badge until
                they have built one up again.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <SelectField
              label="Move into"
              value={nextYearId}
              onChange={(e) => {
                setNextYearId(e.target.value);
                setConfirming(false);
              }}
            >
              <option value="">Choose a year…</option>
              {candidates.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </SelectField>

            {confirming ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="danger" loading={pending} onClick={rollOver}>
                  Yes, close {current.name}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Not yet
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                disabled={!nextYearId}
                onClick={() => setConfirming(true)}
              >
                Close the year
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
