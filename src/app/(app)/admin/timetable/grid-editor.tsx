"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatTimeRange, WEEK_DAYS, weekdayName, weekdayShortName } from "@/lib/school-day";
import { saveLesson, removeLesson, duplicateDay } from "./actions";
import type { PeriodRow, SlotView } from "@/lib/timetable";

/**
 * The grid an admin builds.
 *
 * EVERY CELL IS A BUTTON, including the empty ones. The alternative — a form
 * above the grid with three dropdowns for day, period and class — is the shape
 * this feature takes when it is built as a form, and it makes an admin choose
 * coordinates they can already see. Clicking Tuesday's third row says where the
 * lesson goes without anybody having to name it.
 *
 * WHO IS FREE IS SHOWN AT THE MOMENT OF CHOOSING. The teacher list in the editor
 * is split into free and busy, computed from the whole school's grid at that day
 * and period, with the clash named. It is the same fact the server refuses on,
 * offered before the mistake rather than after it — and the busy names are shown
 * rather than hidden, so "why can I not pick Mrs Rao" has an answer on screen.
 */

export type StaffOption = { membershipId: string; name: string; load: number };

type Cell = { weekday: number; periodId: string };

export function GridEditor({
  classId,
  className,
  periods,
  slots,
  staff,
  busy,
}: {
  classId: string;
  className: string;
  periods: PeriodRow[];
  slots: SlotView[];
  staff: StaffOption[];
  /** `weekday:periodId` → membershipId → what they are already teaching. */
  busy: Record<string, Record<string, string>>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<Cell | null>(null);
  const [copySource, setCopySource] = useState<number | "">("");
  const [copyTarget, setCopyTarget] = useState<number | "">("");

  const lessonPeriods = periods.filter((period) => period.kind === "LESSON");
  const index = new Map(slots.map((slot) => [`${slot.weekday}:${slot.periodId}`, slot]));
  const unstaffed = slots.filter((slot) => !slot.teacherMembershipId).length;

  function copy() {
    if (copySource === "" || copyTarget === "") return;
    startTransition(async () => {
      const result = await duplicateDay(classId, Number(copySource), Number(copyTarget));
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? "Could not copy that day." });
        return;
      }
      toast({
        tone: "ok",
        title: `${result.copied} lessons copied to ${weekdayName(Number(copyTarget))}`,
        description:
          result.unstaffed && result.unstaffed > 0
            ? `${result.unstaffed} came across without a teacher — they were already busy then.`
            : undefined,
      });
      setCopySource("");
      setCopyTarget("");
      router.refresh();
    });
  }

  if (lessonPeriods.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-fg-muted">
        Set the school day up first — a lesson has to go in a period, and this school has none
        that are not breaks.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {unstaffed > 0 && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-[--radius-md] border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning"
        >
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
          <span>
            {unstaffed} {unstaffed === 1 ? "lesson has" : "lessons have"} no teacher yet. They are
            on the timetable and will show as unstaffed to the class.
          </span>
        </p>
      )}

      {/* ---------------- phone: a day at a time ---------------- */}
      <div className="space-y-4 md:hidden">
        {WEEK_DAYS.map((weekday) => (
          <section key={weekday} aria-label={weekdayName(weekday)}>
            <h3 className="mb-2 border-b border-border pb-1 text-sm font-semibold text-fg">
              {weekdayName(weekday)}
            </h3>
            <ul className="space-y-1.5">
              {lessonPeriods.map((period) => {
                const slot = index.get(`${weekday}:${period.id}`);
                return (
                  <li key={period.id}>
                    <CellButton
                      slot={slot}
                      label={`${period.name}, ${weekdayName(weekday)}`}
                      onClick={() => setOpen({ weekday, periodId: period.id })}
                      lead={
                        <span className="w-24 shrink-0">
                          <span className="block text-xs font-medium text-fg">{period.name}</span>
                          <span className="block text-xs tabular-nums text-fg-muted">
                            {formatTimeRange(period.startMinute, period.endMinute)}
                          </span>
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* ---------------- desktop: the grid ---------------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[46rem] border-separate border-spacing-1">
          <caption className="sr-only">{className} — click a cell to set the lesson</caption>
          <thead>
            <tr>
              <th scope="col" className="w-28 p-2 text-left">
                <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                  Period
                </span>
              </th>
              {WEEK_DAYS.map((weekday) => (
                <th key={weekday} scope="col" className="p-2 text-left text-sm font-semibold text-fg">
                  <abbr title={weekdayName(weekday)} className="no-underline lg:hidden">
                    {weekdayShortName(weekday)}
                  </abbr>
                  <span className="hidden lg:inline">{weekdayName(weekday)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <th scope="row" className="p-2 text-left align-top">
                  <span className="block text-sm font-medium text-fg">{period.name}</span>
                  <span className="block text-xs tabular-nums text-fg-muted">
                    {formatTimeRange(period.startMinute, period.endMinute)}
                  </span>
                </th>
                {WEEK_DAYS.map((weekday) =>
                  period.kind === "BREAK" ? (
                    <td
                      key={weekday}
                      className="rounded-[--radius-sm] bg-surface-muted/60 p-2 align-top text-xs text-fg-muted"
                    >
                      {period.name}
                    </td>
                  ) : (
                    <td key={weekday} className="p-0 align-top">
                      <CellButton
                        slot={index.get(`${weekday}:${period.id}`)}
                        label={`${period.name}, ${weekdayName(weekday)}`}
                        onClick={() => setOpen({ weekday, periodId: period.id })}
                      />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- copy a day ---------------- */}
      <div className="flex flex-wrap items-end gap-3 rounded-[--radius-sm] border border-border p-3">
        <SelectField
          label="Copy"
          className="w-40"
          value={copySource}
          onChange={(e) => setCopySource(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">Pick a day</option>
          {WEEK_DAYS.map((weekday) => (
            <option key={weekday} value={weekday}>
              {weekdayName(weekday)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Onto"
          className="w-40"
          value={copyTarget}
          onChange={(e) => setCopyTarget(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">Pick a day</option>
          {WEEK_DAYS.map((weekday) => (
            <option key={weekday} value={weekday}>
              {weekdayName(weekday)}
            </option>
          ))}
        </SelectField>
        <Button
          variant="secondary"
          onClick={copy}
          disabled={copySource === "" || copyTarget === "" || pending}
        >
          Copy day
        </Button>
        <p className="basis-full text-xs text-fg-muted">
          Replaces everything on the target day. A teacher already busy at that time comes across
          without a name rather than being dropped.
        </p>
      </div>

      {open && (
        <LessonDialog
          classId={classId}
          className={className}
          cell={open}
          period={periods.find((p) => p.id === open.periodId)!}
          slot={index.get(`${open.weekday}:${open.periodId}`)}
          staff={staff}
          busyHere={busy[`${open.weekday}:${open.periodId}`] ?? {}}
          onClose={() => setOpen(null)}
          onSaved={() => {
            setOpen(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CellButton({
  slot,
  label,
  onClick,
  lead,
}: {
  slot: SlotView | undefined;
  label: string;
  onClick: () => void;
  lead?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={slot ? `${slot.subject} — ${label}. Change it.` : `Add a lesson at ${label}`}
      className={cn(
        "flex w-full items-start gap-3 rounded-[--radius-sm] p-2.5 text-left transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        slot ? "bg-surface-muted hover:bg-accent-soft" : "bg-surface-muted/40 hover:bg-surface-muted",
      )}
    >
      {lead}
      <span className="min-w-0 flex-1">
        {slot ? (
          <>
            <span className="block truncate text-sm font-semibold text-fg">{slot.subject}</span>
            <span
              className={cn(
                "block truncate text-xs",
                slot.teacherName ? "text-fg-muted" : "text-warning",
              )}
            >
              {slot.teacherName ?? "No teacher yet"}
            </span>
            {slot.room && <span className="block truncate text-xs text-fg-muted">{slot.room}</span>}
          </>
        ) : (
          <span className="flex items-center gap-1 text-xs text-fg-muted">
            <PlusIcon className="size-3.5" /> Add
          </span>
        )}
      </span>
    </button>
  );
}

function LessonDialog({
  classId,
  className,
  cell,
  period,
  slot,
  staff,
  busyHere,
  onClose,
  onSaved,
}: {
  classId: string;
  className: string;
  cell: Cell;
  period: PeriodRow;
  slot: SlotView | undefined;
  staff: StaffOption[];
  busyHere: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [subject, setSubject] = useState(slot?.subject ?? "");
  const [teacher, setTeacher] = useState(slot?.teacherMembershipId ?? "");
  const [room, setRoom] = useState(slot?.room ?? "");
  const [error, setError] = useState<string | null>(null);

  // Escape closes it. A dialog that can only be dismissed by finding the Cancel
  // button is the sort of thing that gets noticed on a phone at 8am.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const free = staff.filter((option) => !busyHere[option.membershipId]);
  const taken = staff.filter((option) => busyHere[option.membershipId]);

  function save() {
    setError(null);
    if (subject.trim().length < 1) {
      setError("Say what is taught in this lesson.");
      return;
    }
    startTransition(async () => {
      const result = await saveLesson({
        classId,
        periodId: cell.periodId,
        weekday: cell.weekday,
        subject: subject.trim(),
        teacherMembershipId: teacher || null,
        room: room.trim() || null,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save that.");
        return;
      }
      toast({ tone: "ok", title: `${subject.trim()} set for ${weekdayName(cell.weekday)}` });
      onSaved();
    });
  }

  function clear() {
    startTransition(async () => {
      const result = await removeLesson(classId, cell.weekday, cell.periodId);
      if (!result.ok) {
        setError(result.error ?? "Could not remove that.");
        return;
      }
      toast({ tone: "ok", title: "Lesson removed" });
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[--radius-lg] border border-border bg-surface p-5 shadow-lg animate-pop"
      >
        <h2 id="lesson-title" className="text-lg font-bold text-fg">
          {weekdayName(cell.weekday)}, {period.name}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          {className} · {formatTimeRange(period.startMinute, period.endMinute)}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <TextField
            label="Subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Mathematics"
          />

          <SelectField
            label="Teacher"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            hint={
              taken.length > 0
                ? `${free.length} free at this time; ${taken.length} already teaching.`
                : "Everybody is free at this time."
            }
          >
            <option value="">No teacher yet</option>
            {free.length > 0 && (
              <optgroup label="Free at this time">
                {free.map((option) => (
                  <option key={option.membershipId} value={option.membershipId}>
                    {option.name}
                    {option.load > 0 ? ` · ${option.load} lessons a week` : ""}
                  </option>
                ))}
              </optgroup>
            )}
            {taken.length > 0 && (
              <optgroup label="Already teaching then">
                {taken.map((option) => (
                  /* Disabled rather than absent: "why is she not in the list"
                     is a question the list should answer itself. */
                  <option key={option.membershipId} value={option.membershipId} disabled>
                    {option.name} — {busyHere[option.membershipId]}
                  </option>
                ))}
              </optgroup>
            )}
          </SelectField>

          <TextField
            label="Room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Optional — lab, hall, field"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={save} loading={pending} className="flex-1">
            Save
          </Button>
          {slot && (
            <Button variant="ghost" onClick={clear} disabled={pending}>
              Remove
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
