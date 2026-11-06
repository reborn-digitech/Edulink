"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { addCalendarEntry, addCompetitionEvent } from "./actions";
import { HOLIDAY_KINDS, HOLIDAY_KIND_META, type HolidayKind } from "@/lib/holiday-kinds";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { competitionBody, CompetitionFieldset, EMPTY_COMPETITION_FIELDS, type CompetitionFields } from "./competition-fields";

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
 * that the school is shut. COMPETITION (decision 0007, 6 Nov 2026) grows the
 * form by the competition's own fields and makes the competition pupils enrol
 * in together with the calendar row, in one transaction.
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
  const [competition, setCompetition] = useState<CompetitionFields>(EMPTY_COMPETITION_FIELDS);
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

    if (kind === "COMPETITION" && competition.summary.trim().length < 3) {
      setError(t("competitions.oneLinePlease"));
      return;
    }

    startTransition(async () => {
      const entry = { name: name.trim(), startDateKey: start, endDateKey: multiDay && end ? end : start, note: note.trim() };
      const result =
        kind === "COMPETITION"
          ? await addCompetitionEvent(competitionBody(entry, competition))
          : await addCalendarEntry({ ...entry, kind });

      if (!result.ok) {
        setError(actionError(t, result, "calendar.couldNotAdd"));
        return;
      }

      toast({ tone: "ok", title: t("calendar.added", { name: name.trim() }), description: kind === "COMPETITION" ? t("calendar.competitionAdded") : undefined });
      setName("");
      setNote("");
      setEnd("");
      setMultiDay(false);
      setCompetition(EMPTY_COMPETITION_FIELDS);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
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

      {kind === "COMPETITION" && <CompetitionFieldset value={competition} onChange={setCompetition} />}

      {multiDay ? (
        <DateField
          label={t("calendar.ends")}
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          hint={t("calendar.endsHint")}
        />
      ) : (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="self-start px-0"
          onClick={() => {
            setMultiDay(true);
            setEnd(start);
          }}
        >
          {t("calendar.lastsLonger")}
        </Button>

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
