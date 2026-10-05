"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsLeftRightIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import type { SubstitutionBoard, SubstitutionLesson } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { periodLabel } from "@/lib/coded-defaults";
import { useEvents } from "@/lib/use-events";
import { formatTimeRange } from "@/lib/school-day";
import { LiveNotice } from "@/components/live-notice";
import { assignSubstituteAction, clearSubstitutionAction } from "./actions";

/**
 * The board as a list: one row per lesson whose teacher is away, with who
 * is covering it and the office's controls. A row with nobody yet shows the
 * chooser straight away; a row already covered shows the name and opens the
 * chooser on "Change". Every write is one lesson at a time — the board is
 * worked at eleven with the bell about to go, not saved in a batch.
 */
/**
 * The board's ear: a cover named, taken away, taken up or declined by
 * anyone in the school on this day (src/lib/substitutions.ts publishes
 * `substitution.updated` on the school channel) re-reads the page, so two
 * people at the office desk see one board. Rendered by the page whether or
 * not there are lessons yet, since the first cover of the day is the one
 * that makes a board. A row being edited keeps its chooser and its note:
 * the refresh brings new props, not new state.
 */
export function BoardLive({ dateKey }: { dateKey: string }) {
  const t = useT();
  const router = useRouter();
  const [changedAt, setChangedAt] = useState<number | null>(null);
  useEvents(
    (event) => {
      if (event.type !== "substitution.updated" || event.dateKey !== dateKey) return;
      router.refresh();
      setChangedAt(Date.now());
    },
    // Back from a hidden tab: the board is re-read, quietly.
    { types: ["substitution.updated"], onResume: () => router.refresh() },
  );
  return <LiveNotice stamp={changedAt}>{t("substitutions.boardChanged")}</LiveNotice>;
}

export function Board({ board }: { board: SubstitutionBoard }) {
  return (
    <ul className="divide-y divide-border">
      {board.lessons.map((lesson) => (
        <LessonRow key={lesson.slotId} dateKey={board.dateKey} lesson={lesson} />
      ))}
    </ul>
  );
}

function LessonRow({ dateKey, lesson }: { dateKey: string; lesson: SubstitutionLesson }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  // "Change" on a covered lesson opens the chooser by hand. An uncovered or
  // declined lesson shows it whatever was pressed: derived from the lesson,
  // not copied into state at mount, so a cover cleared by this row or by a
  // colleague (the board refreshes live) hands the chooser straight back.
  const [opened, setOpened] = useState(false);
  const open = opened || lesson.substitute === null || Boolean(lesson.substitute.declinedAt);
  const setOpen = setOpened;
  const [who, setWho] = useState(lesson.substitute?.membershipId ?? lesson.candidates[0]?.membershipId ?? "");
  const [note, setNote] = useState(lesson.substitute?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const time = lesson.startMinute !== null && lesson.endMinute !== null ? formatTimeRange(lesson.startMinute, lesson.endMinute) : null;
  const reason = lesson.absentReason === "ABSENT" ? t("substitutions.reasonAbsent") : t("substitutions.reasonOnLeave");

  const candidateLabel = (c: SubstitutionLesson["candidates"][number]) =>
    [
      `${c.name} — ${c.free ? t("substitutions.candidateFree") : t("substitutions.candidateBusy")}`,
      c.teachesSubject ? t("substitutions.teachesSubject", { subject: lesson.subject }) : null,
      t("substitutions.load", { count: c.load }),
    ]
      .filter(Boolean)
      .join(" · ");

  function assign(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!who) return setError(t("common.checkTheForm"));
    startTransition(async () => {
      const result = await assignSubstituteAction({ dateKey, slotId: lesson.slotId, substituteMembershipId: who, note: note.trim() || undefined });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      if (result.changed) {
        const name = lesson.candidates.find((c) => c.membershipId === who)?.name ?? "";
        toast({ tone: "ok", title: t("substitutions.assignDone", { name, subject: lesson.subject, className: lesson.className }) });
      } else {
        toast({ tone: "neutral", title: t("substitutions.unchanged") });
      }
      setOpen(false);
      router.refresh();
    });
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      const result = await clearSubstitutionAction({ dateKey, slotId: lesson.slotId });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: result.changed ? "ok" : "neutral", title: result.changed ? t("substitutions.clearDone") : t("substitutions.unchanged") });
      router.refresh();
    });
  }

  return (
    <li className="space-y-3 py-3" data-testid="substitution-row" data-slot-id={lesson.slotId}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
        <span className="w-28 shrink-0">
          <span className="block text-sm font-medium text-fg">{lesson.periodName ? periodLabel(lesson.periodName, t) : t("substitutions.period")}</span>
          {time && <span className="block text-xs tabular-nums text-fg-muted">{time}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-fg">
            {lesson.subject} · {lesson.className}
            {lesson.room ? ` · ${lesson.room}` : ""}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
            <span>
              {t("substitutions.absentTeacher")}: {lesson.absentName}
            </span>
            <Badge tone={lesson.absentReason === "ABSENT" ? "danger" : "neutral"} size="sm">
              {reason}
            </Badge>
          </span>
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {lesson.substitute ? (
            <>
              <Badge tone={lesson.substitute.declinedAt ? "danger" : "ok"} size="md" className="max-w-full">
                <ArrowsLeftRightIcon weight="bold" className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{lesson.substitute.name}</span>
              </Badge>
              {/* The covering teacher's answer: taken, declined (the office reassigns), or nothing yet. */}
              {lesson.substitute.declinedAt ? (
                <Badge tone="danger" size="sm">
                  {t("covers.stateDeclined")}
                </Badge>
              ) : lesson.substitute.acknowledgedAt ? (
                <Badge tone="ok" size="sm">
                  {t("covers.stateTaken")}
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  {t("covers.stateWaiting")}
                </Badge>
              )}
              {!open && (
                <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(true)} icon={<PencilSimpleIcon weight="bold" />}>
                  {t("substitutions.change")}
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" loading={pending} onClick={clear} icon={<XIcon weight="bold" />}>
                {t("substitutions.clear")}
              </Button>
            </>
          ) : (
            <Badge tone="warn" size="md">
              {t("substitutions.noSubstitute")}
            </Badge>
          )}
        </span>
      </div>

      {lesson.substitute?.note && !open && <p className="text-xs text-fg-muted">{t("substitutions.note")}: {lesson.substitute.note}</p>}
      {lesson.substitute?.declinedAt && !open && (
        <p className="text-xs font-medium text-danger">{t("covers.declinedBecause", { name: lesson.substitute.name, reason: lesson.substitute.declineReason ?? "" })}</p>
      )}

      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {open && (
        <form onSubmit={assign} noValidate className="grid gap-2 sm:grid-cols-[minmax(0,24rem)_minmax(0,1fr)_auto] sm:items-end">
          <SelectField label={t("substitutions.choose")} value={who} onChange={(e) => setWho(e.target.value)} className="[&_select]:min-h-10 [&_select]:py-2" data-testid="substitution-choose">
            {lesson.candidates.map((c) => (
              <option key={c.membershipId} value={c.membershipId} data-free={c.free ? "1" : "0"}>
                {candidateLabel(c)}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t("substitutions.note")}
            placeholder={t("substitutions.notePlaceholder")}
            maxLength={200}
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="[&_input]:min-h-10 [&_input]:py-2"
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={pending} disabled={lesson.candidates.length === 0} icon={<ArrowsLeftRightIcon weight="bold" />} data-testid="substitution-assign">
              {t("substitutions.assign")}
            </Button>
            {lesson.substitute && (
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      )}
    </li>
  );
}
