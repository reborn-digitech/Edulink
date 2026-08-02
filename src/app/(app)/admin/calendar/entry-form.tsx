"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { addCalendarEntry } from "./actions";

const KINDS = [
  { value: "HOLIDAY", label: "Holiday — school is shut" },
  { value: "EXAM", label: "Exam — school is open" },
  { value: "EVENT", label: "Event — school is open" },
] as const;

/**
 * Adding a day, or a stretch of days.
 *
 * ONE DATE, NOT TWO, unless the admin wants two. Most entries are a single day
 * — Republic Day, a sports day — and asking for an end date every time is a
 * field to be got wrong on the way to the common case. So the end date starts
 * hidden and mirrors the start; opening it is one click for the breaks.
 *
 * The kind is a select rather than a colour swatch because the difference is
 * behavioural, not decorative: only HOLIDAY makes the register warn a teacher
 * that the school is shut.
 */
export function EntryForm({ today }: { today: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("HOLIDAY");
  const [note, setNote] = useState("");
  const [multiDay, setMultiDay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Give it a name — “Diwali” or “Half-yearly exams”.");
      return;
    }
    if (!start) {
      setError("Pick the date it starts.");
      return;
    }
    // Caught here for a fast, in-place message; re-checked on the server, which
    // is the check that counts.
    if (multiDay && end && end < start) {
      setError("The end date cannot be before the start date.");
      return;
    }

    startTransition(async () => {
      const result = await addCalendarEntry({
        name: name.trim(),
        startDateKey: start,
        endDateKey: multiDay && end ? end : start,
        kind,
        note: note.trim(),
      });

      if (!result.ok) {
        setError(result.error ?? "Could not add that.");
        return;
      }

      toast({ tone: "ok", title: `${name.trim()} added to the calendar` });
      setName("");
      setNote("");
      setEnd("");
      setMultiDay(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <TextField
        label="What is it"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Diwali"
      />

      <SelectField
        label="Kind"
        value={kind}
        onChange={(e) => setKind(e.target.value as (typeof KINDS)[number]["value"])}
        hint="Only a holiday warns teachers off taking the register."
      >
        {KINDS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <TextField
        label={multiDay ? "Starts" : "Date"}
        type="date"
        required
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />

      {multiDay ? (
        <TextField
          label="Ends"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          hint="Included — the last day the school is shut."
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setMultiDay(true);
            setEnd(start);
          }}
          className="text-sm font-medium text-accent-strong underline underline-offset-4"
        >
          It lasts more than a day
        </button>
      )}

      <TextAreaField
        label="Note"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint="Optional. Anything staff should know."
      />

      <Button type="submit" block loading={pending}>
        {pending ? "Adding…" : "Add to calendar"}
      </Button>
    </form>
  );
}
