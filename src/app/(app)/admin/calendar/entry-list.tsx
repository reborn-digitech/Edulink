"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, PencilSimpleIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField, SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { formatDateKey } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { editCalendarEntry, removeCalendarEntry } from "./actions";
import type { HolidayKind } from "@/lib/holidays";

export type Entry = {
  id: string;
  name: string;
  startDateKey: string;
  endDateKey: string;
  kind: HolidayKind;
  kindLabel: string;
  closesSchool: boolean;
  note: string | null;
};

const KINDS: { value: HolidayKind; label: string }[] = [
  { value: "HOLIDAY", label: "Holiday — school is shut" },
  { value: "EXAM", label: "Exam — school is open" },
  { value: "EVENT", label: "Event — school is open" },
];

/**
 * The year's calendar, grouped by month.
 *
 * Grouped because that is how anyone reads a school calendar — "what is on in
 * November" is the question, not "show me all 34 entries". A break spanning two
 * months appears once, under the month it starts in, with its full range shown,
 * rather than being repeated under both and looking like two holidays.
 *
 * Past entries are dimmed, not hidden. An admin checking why last month's
 * attendance looks odd needs to see that the school was shut for a week.
 */
export function EntryList({ entries, today }: { entries: Entry[]; today: string }) {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const month = entry.startDateKey.slice(0, 7);
    const list = groups.get(month) ?? [];
    list.push(entry);
    groups.set(month, list);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([month, monthEntries]) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <h3
            id={`month-${month}`}
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted"
          >
            {formatDateKey(`${month}-01`, { month: "long", year: "numeric" })}
          </h3>
          <ul className="space-y-1.5">
            {monthEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} past={entry.endDateKey < today} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EntryRow({ entry, past }: { entry: Entry; past: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState(entry.name);
  const [start, setStart] = useState(entry.startDateKey);
  const [end, setEnd] = useState(entry.endDateKey);
  const [kind, setKind] = useState<HolidayKind>(entry.kind);
  const [error, setError] = useState<string | null>(null);

  const single = entry.startDateKey === entry.endDateKey;

  function save() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Give it a name.");
      return;
    }
    if (end < start) {
      setError("The end date cannot be before the start date.");
      return;
    }
    startTransition(async () => {
      const result = await editCalendarEntry(entry.id, {
        name: name.trim(),
        startDateKey: start,
        endDateKey: end,
        kind,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save that.");
        return;
      }
      toast({ tone: "ok", title: "Calendar updated" });
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeCalendarEntry(entry.id);
      if (!result.ok) {
        toast({ tone: "warn", title: "Could not remove it", description: result.error });
        return;
      }
      toast({ tone: "ok", title: `${entry.name} removed` });
      router.refresh();
    });
  }

  if (editing) {
    return (
      <li className="space-y-3 rounded-[--radius-md] border border-accent bg-accent-soft/30 p-3">
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <TextField label="What is it" value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Kind" value={kind} onChange={(e) => setKind(e.target.value as HolidayKind)}>
          {KINDS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Starts" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <TextField label="Ends" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" loading={pending} icon={<CheckIcon weight="bold" className="size-4" />} onClick={save}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<XIcon weight="bold" className="size-4" />}
            onClick={() => {
              setEditing(false);
              setError(null);
              setName(entry.name);
              setStart(entry.startDateKey);
              setEnd(entry.endDateKey);
              setKind(entry.kind);
            }}
          >
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[--radius-md] border border-border p-3",
        past && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{entry.name}</p>
        <p className="text-sm text-fg-muted">
          {single
            ? formatDateKey(entry.startDateKey, { weekday: "short", day: "numeric", month: "long" })
            : `${formatDateKey(entry.startDateKey, { day: "numeric", month: "short" })} – ${formatDateKey(
                entry.endDateKey,
                { day: "numeric", month: "short" },
              )}`}
          {entry.note ? ` · ${entry.note}` : ""}
        </p>
      </div>

      {/* Label as well as tone — the difference between an exam and a holiday is
          never carried by colour alone. WCAG 1.4.1. */}
      <Badge tone={entry.closesSchool ? "accent" : "neutral"} size="sm">
        {entry.kindLabel}
      </Badge>

      {confirmDelete ? (
        <span className="flex items-center gap-1.5">
          <Button size="sm" variant="danger" loading={pending} onClick={remove}>
            Remove
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
            Keep
          </Button>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${entry.name}`}
            onClick={() => setEditing(true)}
          >
            <PencilSimpleIcon weight="bold" className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Remove ${entry.name}`}
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon weight="bold" className="size-4" />
          </Button>
        </span>
      )}
    </li>
  );
}
