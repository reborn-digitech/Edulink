"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { addCalendarEntry } from "./actions";
import { HOLIDAY_KINDS, HOLIDAY_KIND_META, type HolidayKind } from "@/lib/holiday-kinds";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [kind, setKind] = useState<HolidayKind>("HOLIDAY");
  const [note, setNote] = useState("");
  const [multiDay, setMultiDay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError(t("calendar.needName"));
      return;
    }
    if (!start) {
      setError(t("calendar.needStart"));
      return;
    }
    // Caught here for a fast, in-place message; re-checked on the server, which
    // is the check that counts.
    if (multiDay && end && end < start) {
      setError(t("calendar.endBeforeStart"));
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
        setError(actionError(t, result, "calendar.couldNotAdd"));
        return;
      }

      toast({ tone: "ok", title: t("calendar.added", { name: name.trim() }) });
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
        label={t("calendar.whatIsIt")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("calendar.namePlaceholder")}
      />

      <SelectField
        label={t("calendar.kind")}
        value={kind}
        onChange={(e) => setKind(e.target.value as HolidayKind)}
        hint={t("calendar.kindHint")}
      >
        {HOLIDAY_KINDS.map((option) => (
          <option key={option} value={option}>
            {t(HOLIDAY_KIND_META[option].optionKey)}
          </option>
        ))}
      </SelectField>

      <DateField
        label={multiDay ? t("calendar.starts") : t("calendar.date")}
        required
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />

      {multiDay ? (
        <DateField
          label={t("calendar.ends")}
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          hint={t("calendar.endsHint")}
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
          {t("calendar.lastsLonger")}
        </button>
      )}

      <TextAreaField
        label={t("calendar.note")}
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint={t("calendar.noteHint")}
      />

      <Button type="submit" block loading={pending}>
        {pending ? t("common.adding") : t("calendar.addAction")}
      </Button>
    </form>
  );
}
