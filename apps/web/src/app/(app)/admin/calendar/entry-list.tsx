"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import { TrashIcon, PencilSimpleIcon, CheckIcon, XIcon, TrophyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { formatDateKey } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { editCalendarEntry, editCompetitionEvent, removeCalendarEntry, removeCompetitionEventAction } from "./actions";
import { HOLIDAY_KINDS, HOLIDAY_KIND_META, type HolidayKind } from "@/lib/holiday-kinds";
import { actionError } from "@/lib/action-error";
import { useLocale, useT } from "@/lib/i18n";
import { BOARD_OPTION_KEY, competitionBody, CompetitionFieldset, type CompetitionFields } from "./competition-fields";

/** A COMPETITION row's competition half (decision 0007): what the office set, and how many have entered. */
export type EntryCompetition = CompetitionFields & { competitionId: string; status: string; entered: number };

export type Entry = {
  id: string;
  name: string;
  startDateKey: string;
  endDateKey: string;
  kind: HolidayKind;
  note: string | null;
  competition?: EntryCompetition | null;
};

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
  const locale = useLocale();
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
            {formatDateKey(`${month}-01`, { month: "long", year: "numeric" }, locale)}
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
  const locale = useLocale();
  /* The hook, not a prop — this whole file is `"use client"`, so unlike the
     leaf date components in server pages there is a provider above it. */
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState(entry.name);
  const [start, setStart] = useState(entry.startDateKey);
  const [end, setEnd] = useState(entry.endDateKey);
  const [kind, setKind] = useState<HolidayKind>(entry.kind);
  const competition = entry.competition ?? null;
  const [fields, setFields] = useState<CompetitionFields>(competition ?? { summary: "", registrationClosesDateKey: "", gradeLow: "", gradeHigh: "", enrolmentOpen: true, internalBoard: "OFF", requiresParentConsent: true, body: "" });
  const [error, setError] = useState<string | null>(null);

  const single = entry.startDateKey === entry.endDateKey;

  function save() {
    setError(null);
    if (name.trim().length < 2) {
      setError(t("calendar.needNameShort"));
      return;
    }
    if (end < start) {
      setError(t("calendar.endBeforeStart"));
      return;
    }
    startTransition(async () => {
      // A competition's row is edited with its competition, in one transaction (decision 0007); the kind cannot change.
      const result = competition
        ? await editCompetitionEvent(entry.id, competitionBody({ name: name.trim(), startDateKey: start, endDateKey: end, note: entry.note ?? "" }, fields))
        : await editCalendarEntry(entry.id, {
            name: name.trim(),
            startDateKey: start,
            endDateKey: end,
            kind,
          });
      if (!result.ok) {
        setError(actionError(t, result, "calendar.couldNotSave"));
        return;
      }
      toast({ tone: "ok", title: t("calendar.updated") });
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = competition ? await removeCompetitionEventAction(entry.id) : await removeCalendarEntry(entry.id);
      if (!result.ok) {
        toast({ tone: "warn", title: t("calendar.couldNotRemove"), description: actionError(t, result) });
        return;
      }
      toast({
        tone: "ok",
        title: t("calendar.removed", { name: entry.name }),
        description: competition ? ("competition" in result && result.competition === "ARCHIVED" ? t("calendar.competitionArchived") : t("calendar.competitionDeleted")) : undefined,
      });
      router.refresh();
    });
  }

  if (editing) {
    return (
      <li className="space-y-3 rounded-[var(--radius-md)] border border-accent bg-accent-soft/30 p-3">
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <TextField
          label={t("calendar.whatIsIt")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {competition ? (
          <p className="text-xs text-fg-muted">{t("calendar.competitionKindFixed")}</p>
        ) : (
          <SelectField
            label={t("calendar.kind")}
            value={kind}
            onChange={(e) => setKind(e.target.value as HolidayKind)}
          >
            {HOLIDAY_KINDS.filter((option) => option !== "COMPETITION").map((option) => (
              <option key={option} value={option}>
                {t(HOLIDAY_KIND_META[option].optionKey)}
              </option>
            ))}
          </SelectField>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <DateField
            label={t("calendar.starts")}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <DateField
            label={t("calendar.ends")}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        {competition && <CompetitionFieldset value={fields} onChange={setFields} compact />}
        <div className="flex gap-2">
          <Button size="sm" loading={pending} icon={<CheckIcon weight="bold" className="size-4" />} onClick={save}>
            {t("common.save")}
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
            {t("common.cancel")}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[var(--radius-md)] border border-border p-3",
        past && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{entry.name}</p>
        <p className="text-sm text-fg-muted">
          {single
            ? formatDateKey(entry.startDateKey, { weekday: "short", day: "numeric", month: "long" }, locale)
            : `${formatDateKey(entry.startDateKey, { day: "numeric", month: "short" })} – ${formatDateKey(entry.endDateKey, { day: "numeric", month: "short" })}`}
          {entry.note ? ` · ${entry.note}` : ""}
        </p>
        {competition && (
          /* The competition half, in a line: enrolment, the board, who has entered, and the way to its page. */
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted" data-testid="competition-line">
            <span>{competition.enrolmentOpen ? t("calendar.enrolmentOpenShort", { date: formatDateKey(competition.registrationClosesDateKey, { day: "numeric", month: "short" }, locale) }) : t("calendar.enrolmentOffShort")}</span>
            <span>· {t(BOARD_OPTION_KEY[competition.internalBoard])}</span>
            <span>· {competition.entered === 1 ? t("competitions.pupilsTakingPartOne") : t("competitions.pupilsTakingPartMany", { count: competition.entered })}</span>
            <Link href={`/competitions/${competition.competitionId}`} className="inline-flex items-center gap-1 font-medium text-accent-strong underline underline-offset-2">
              <TrophyIcon weight="bold" className="size-3.5" />
              {t("calendar.openCompetition")}
            </Link>
          </p>
        )}
      </div>

      {/* Label as well as tone — the difference between an exam and a holiday is
          never carried by colour alone. WCAG 1.4.1. */}
      <Badge tone={HOLIDAY_KIND_META[entry.kind].closesSchool ? "accent" : "neutral"} size="sm">
        {t(HOLIDAY_KIND_META[entry.kind].labelKey)}
      </Badge>

      {confirmDelete ? (
        <span className="flex items-center gap-1.5">
          <Button size="sm" variant="danger" loading={pending} onClick={remove}>
            {t("common.remove")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
            {t("common.keep")}
          </Button>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("calendar.editEntry", { name: entry.name })}
            onClick={() => setEditing(true)}
          >
            <PencilSimpleIcon weight="bold" className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("calendar.removeEntry", { name: entry.name })}
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon weight="bold" className="size-4" />
          </Button>
        </span>
      )}
    </li>
  );
}
