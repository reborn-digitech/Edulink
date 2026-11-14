"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  NoteIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { ATTENDANCE_META, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/constants";
import { enqueue, newClientId, countQueued } from "@/lib/offline-queue";
import { useT } from "@/lib/i18n";
import { useEvents } from "@/lib/use-events";
import { LiveNotice } from "@/components/live-notice";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { RegisterAbsenceNote } from "@edulink/contracts";
import { fieldClass } from "@/components/ui/field-class";
import { PAGE_TITLE } from "@/components/ui/page-title";
import { todayKey } from "@/lib/dates";

export type RosterEntry = {
  membershipId: string;
  name: string;
  fullName: string;
  avatarKey: string | null;
  status: AttendanceStatus | null;
  note: string | null;
  /** The family said the pupil would be away today (absence-notes.ts): shown, never edited here. */
  absenceNote?: RegisterAbsenceNote | null;
};

/** One key per coded reason, so the audit sees a key and not a template. */
const REASON_KEY: Record<RegisterAbsenceNote["reason"], TranslationKey> = {
  ILLNESS: "familyCare.reasonILLNESS",
  FAMILY: "familyCare.reasonFAMILY",
  RELIGIOUS: "familyCare.reasonRELIGIOUS",
  TRAVEL: "familyCare.reasonTRAVEL",
  OTHER: "familyCare.reasonOTHER",
};

type Pending = "idle" | "saving" | "queued" | "saved" | "error";

type DirtyMark = { status: AttendanceStatus; note: string | null; clientId: string; markedAt: string };

/**
 * The register.
 *
 * The interaction the whole product is judged on, so the rules are strict:
 *   * a tap NEVER waits on the network — state changes instantly, the write
 *     goes to the outbox, and the row shows its own sync state
 *   * "Mark all present" fills the common case in one tap, and every individual
 *     mark stays editable afterwards
 *   * going offline changes nothing about how it behaves, only what it says
 */
export function Register({
  classId,
  className,
  dateKey,
  dateLabel,
  initialRoster,
  readOnly: readOnlyByDay,
  forToday,
  timezone,
}: {
  classId: string;
  className: string;
  dateKey: string;
  dateLabel: string;
  initialRoster: RosterEntry[];
  readOnly?: boolean;
  /** Drawn as today's register (no ?date=): marking stops if the school's day has moved on since (TA-221). */
  forToday?: boolean;
  /** The school's timezone, for "today" as the school counts it. */
  timezone?: string;
}) {
  const t = useT();
  const { toast } = useToast();
  const [roster, setRoster] = useState(initialRoster);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<Pending>("idle");
  const [queued, setQueued] = useState(0);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  /*
   * A register drawn as "today's" and shown on a later day (TA-221): a copy the worker's page cache answered when the
   * network failed, or a tab left open overnight. Its marks would go to the day it was drawn for, which the server
   * accepts from the class teacher, so marking stops and the page offers a reload. Checked on mount, when the tab
   * comes back and once a minute.
   */
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!forToday || !timezone) return;
    const check = () => setStale(todayKey(timezone) !== dateKey);
    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    const timer = setInterval(check, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      clearInterval(timer);
    };
  }, [forToday, timezone, dateKey]);
  const readOnly = readOnlyByDay || stale;

  // Marks the user has changed but not yet sent, keyed by membershipId.
  const dirty = useRef(new Map<string, DirtyMark>());
  // "Mark all present" marks waiting for their Undo to pass (TA-216): sent when the toast goes without Undo, or when the page is hidden.
  const held = useRef(new Map<string, DirtyMark>());
  // The client ids of held marks that went out before their Undo was pressed (the page was hidden): too late to take back.
  const sentEarly = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- a colleague's marks, live ----
   *
   * The events stream says the register for this class and day changed. If
   * every clientId on the event is one this tab minted, the save was ours
   * and the roster already shows it. Otherwise the marks are refetched and
   * laid over the roster — except where this tab has a mark of its own that
   * is not yet confirmed by the server (unsent, in flight, or queued in the
   * outbox): the teacher's own hand wins over a stale read every time.
   */
  const minted = useRef(new Set<string>());
  const unconfirmed = useRef(new Map<string, string>());
  const refetching = useRef<{ again: boolean } | null>(null);
  const [colleagueAt, setColleagueAt] = useState<number | null>(null);
  // The roster as last rendered, for a refetch to merge against and compare with.
  const rosterRef = useRef(roster);
  useEffect(() => {
    rosterRef.current = roster;
  });

  const refetch = useCallback(async () => {
    if (refetching.current) {
      refetching.current.again = true;
      return;
    }
    refetching.current = { again: false };
    try {
      do {
        refetching.current.again = false;
        const response = await fetch(`/api/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(dateKey)}`, { cache: "no-store" });
        if (!response.ok) return;
        const fresh = (await response.json()) as { roster: RosterEntry[] };
        const current = rosterRef.current;
        const mine = new Map(current.map((entry) => [entry.membershipId, entry]));
        const merged = fresh.roster.map((entry) => {
          const own = mine.get(entry.membershipId);
          const held = own && (dirty.current.has(entry.membershipId) || unconfirmed.current.has(entry.membershipId));
          return held ? { ...entry, status: own.status, note: own.note } : entry;
        });
        const changed =
          merged.length !== current.length ||
          merged.some((entry, i) => entry.membershipId !== current[i]!.membershipId || entry.status !== current[i]!.status || entry.note !== current[i]!.note);
        if (!changed) continue;
        setRoster(merged);
        // Said only when something on the page moved: a re-read that found nothing new is silent.
        setColleagueAt(Date.now());
      } while (refetching.current.again);
    } catch {
      // Offline or a dropped read: the roster stays as it was, as it would without the stream.
    } finally {
      refetching.current = null;
    }
  }, [classId, dateKey]);

  useEvents(
    (event) => {
      if (event.type !== "attendance.updated" || event.classId !== classId || event.dateKey !== dateKey) return;
      const ids = event.clientIds ?? [];
      const ours = ids.length > 0 && ids.every((id) => minted.current.has(id));
      if (!ours) void refetch();
    },
    // Back from a hidden tab: whatever colleagues marked meanwhile is read now.
    { types: ["attendance.updated"], onResume: () => void refetch() },
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    void countQueued(`attendance:${classId}`).then(setQueued);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [classId]);

  const counts = useMemo(() => {
    const tally = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0, unmarked: 0 };
    for (const entry of roster) {
      if (entry.status) tally[entry.status]++;
      else tally.unmarked++;
    }
    return tally;
  }, [roster]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) || entry.fullName.toLowerCase().includes(q),
    );
  }, [roster, query]);

  /* ---- saving ------------------------------------------------------------ */

  const flush = useCallback(async () => {
    if (dirty.current.size === 0) return;

    const batch = [...dirty.current.entries()];
    const marks = batch.map(([studentMembershipId, mark]) => ({
      studentMembershipId,
      status: mark.status,
      note: mark.note ?? undefined,
      clientId: mark.clientId,
      markedAt: mark.markedAt,
    }));
    dirty.current.clear();

    const body = JSON.stringify({ classId, dateKey, marks });
    setState("saving");

    // Offline: straight to the outbox, no doomed fetch first.
    if (!navigator.onLine) {
      await enqueue({ url: "/api/attendance", method: "POST", body, tag: `attendance:${classId}` });
      setQueued(await countQueued(`attendance:${classId}`));
      setState("queued");
      return;
    }

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });

      if (!response.ok) {
        // 5xx and network-shaped failures are worth retrying, so they go to the
        // outbox. A 4xx is our bug or a stale session — surface it instead of
        // burying it in a retry loop the teacher never sees.
        if (response.status >= 500) {
          await enqueue({ url: "/api/attendance", method: "POST", body, tag: `attendance:${classId}` });
          setQueued(await countQueued(`attendance:${classId}`));
          setState("queued");
          return;
        }
        const detail = await response.json().catch(() => ({}));
        // Refused and not queued (TA-217): the batch goes back to wait, so Retry, or the next mark's save, sends it
        // again, and nothing says Saved while it was never stored. A pupil marked again since keeps the newer mark.
        for (const [membershipId, mark] of batch) {
          if (!dirty.current.has(membershipId) && unconfirmed.current.get(membershipId) === mark.clientId) dirty.current.set(membershipId, mark);
        }
        setState("error");
        toast({
          tone: "danger",
          duration: null,
          title: t("teacher.didNotSave"),
          description: detail.error ?? t("teacher.checkConnection"),
          // Self-reference is safe: the retry can only be tapped long after
          // `flush` finishes initialising.
          // eslint-disable-next-line react-hooks/immutability
          action: { label: t("teacher.retry"), onClick: () => void flush() },
        });
        return;
      }

      const result = (await response.json()) as { applied: number; skipped?: number; rejected: unknown[] };
      // Confirmed: a later refetch may show these pupils as the server has them, unless re-marked since.
      for (const sent of marks) {
        if (unconfirmed.current.get(sent.studentMembershipId) === sent.clientId) unconfirmed.current.delete(sent.studentMembershipId);
      }
      setState("saved");
      if (result.rejected.length > 0) {
        toast({
          tone: "warn",
          title: t("teacher.someNotSaved"),
          description: t("teacher.noLongerInClass", { count: result.rejected.length }),
        });
      }
      // Every mark sent here carries a fresh key, so a skipped one lost to a later mark already stored (TA-029):
      // said, rather than shown as Saved.
      if ((result.skipped ?? 0) > 0) {
        toast({ tone: "warn", title: t("teacher.someNotSaved"), description: t("teacher.supersededMarks", { count: result.skipped ?? 0 }) });
      }
    } catch {
      await enqueue({ url: "/api/attendance", method: "POST", body, tag: `attendance:${classId}` });
      setQueued(await countQueued(`attendance:${classId}`));
      setState("queued");
    }
  }, [classId, dateKey, toast, t]);

  /** Debounced: tapping down a roster of 24 sends one request, not 24. */
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flush(), 700);
  }, [flush]);

  /**
   * "Mark all present" waits for its Undo to pass (TA-216): the marks of one press go out once its toast goes without
   * Undo, or at once if the page is hidden first. A pupil marked by hand since keeps that mark, which is already on its way.
   */
  const commitHeld = useCallback(
    (only?: Map<string, DirtyMark>) => {
      let moved = 0;
      for (const [membershipId, mark] of [...(only ?? held.current)]) {
        if (held.current.get(membershipId)?.clientId !== mark.clientId) continue;
        held.current.delete(membershipId);
        if (dirty.current.has(membershipId) || unconfirmed.current.get(membershipId) !== mark.clientId) continue;
        dirty.current.set(membershipId, mark);
        sentEarly.current.add(mark.clientId);
        moved++;
      }
      if (moved > 0) void flush();
    },
    [flush],
  );

  // A teacher closing the tab mid-register must not lose the last marks.
  useEffect(() => {
    const onHide = () => {
      if (held.current.size > 0) commitHeld();
      if (dirty.current.size > 0) void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flush, commitHeld]);

  function mark(membershipId: string, status: AttendanceStatus, note?: string | null) {
    if (readOnly) return;
    const previous = roster.find((r) => r.membershipId === membershipId);

    setRoster((current) =>
      current.map((entry) =>
        entry.membershipId === membershipId
          ? { ...entry, status, note: note !== undefined ? note : entry.note }
          : entry,
      ),
    );

    const clientId = newClientId();
    minted.current.add(clientId);
    unconfirmed.current.set(membershipId, clientId);
    // A hand mark wins over a "Mark all present" still waiting for its Undo to pass.
    held.current.delete(membershipId);
    dirty.current.set(membershipId, {
      status,
      note: note !== undefined ? note : (previous?.note ?? null),
      clientId,
      markedAt: new Date().toISOString(),
    });

    scheduleSave();
  }

  function markAllPresent() {
    const unmarked = roster.filter((entry) => !entry.status);
    if (unmarked.length === 0) return;

    const stamp = new Date().toISOString();
    // This press's marks, held rather than sent (TA-216): nothing reaches the server while the Undo is on the screen.
    const batch = new Map<string, DirtyMark>();

    setRoster((current) =>
      current.map((entry) => (entry.status ? entry : { ...entry, status: "PRESENT" as const })),
    );
    for (const entry of unmarked) {
      const clientId = newClientId();
      minted.current.add(clientId);
      unconfirmed.current.set(entry.membershipId, clientId);
      const mark: DirtyMark = { status: "PRESENT", note: entry.note, clientId, markedAt: stamp };
      batch.set(entry.membershipId, mark);
      held.current.set(entry.membershipId, mark);
    }

    toast({
      tone: "ok",
      title: t("teacher.markedPresent", { count: unmarked.length }),
      description: t("teacher.nowChange"),
      onCommit: () => commitHeld(batch),
      onUndo: () => {
        // Only what is still held is taken back: a pupil marked by hand since keeps that mark, and marks the page
        // already sent (it was hidden meanwhile) are not shown as taken back when they were not.
        const undone = new Set<string>();
        let tooLate = 0;
        for (const [membershipId, mark] of batch) {
          if (sentEarly.current.has(mark.clientId)) tooLate++;
          if (held.current.get(membershipId)?.clientId !== mark.clientId) continue;
          held.current.delete(membershipId);
          if (unconfirmed.current.get(membershipId) === mark.clientId) unconfirmed.current.delete(membershipId);
          undone.add(membershipId);
        }
        if (undone.size > 0) {
          setRoster((current) => current.map((entry) => (undone.has(entry.membershipId) ? { ...entry, status: null } : entry)));
        }
        if (tooLate > 0) {
          toast({ tone: "warn", title: t("teacher.someNotSaved"), description: t("teacher.undoAfterSave") });
        }
      },
    });
  }

  const complete = counts.unmarked === 0;

  return (
    <div className="space-y-4">
      {/* ---- summary bar ---- */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {/* In the sticky bar that stays while the roll is marked, so not a PageHeader; the title has its look (A3-states-9). */}
            <h1 className={cn(PAGE_TITLE, "block truncate")}>{className}</h1>

            <p className="text-xs text-fg-muted">
              {dateLabel} · {roster.length === 1 ? t("teacher.studentsCountOne") : t("teacher.studentsCount", { count: roster.length })}
            </p>
          </div>
          <span data-testid="register-sync" data-state={state}>
            <SyncPill state={state} queued={queued} online={online} complete={complete} />
          </span>
        </div>
        <LiveNotice stamp={colleagueAt} className="mt-1.5">
          {t("teacher.updatedByColleague")}
        </LiveNotice>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {ATTENDANCE_STATUSES.map((status) => (
            <span
              key={status}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
              style={{
                backgroundColor: `var(--att-${ATTENDANCE_META[status].token}-soft)`,
                color: `var(--att-${ATTENDANCE_META[status].token})`,
              }}
            >
              {counts[status]} {t(ATTENDANCE_META[status].labelKey)}
            </span>
          ))}
          {counts.unmarked > 0 && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-fg-muted">
              {t("teacher.notMarkedCount", { count: counts.unmarked })}
            </span>
          )}
        </div>
      </div>

      {stale && (
        <div role="alert" data-testid="register-stale" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
          <span>{t("teacher.registerStale", { date: dateLabel })}</span>
          <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
            {t("ui.refresh")}
          </Button>
        </div>
      )}

      {!readOnly && counts.unmarked > 0 && (
        <Button block variant="soft" size="lg" onClick={markAllPresent} icon={<CheckCircleIcon weight="bold" />}>
          {t("teacher.markAllPresent", { count: counts.unmarked })}
        </Button>
      )}

      <label className="relative block">
        <span className="sr-only">{t("teacher.searchClass")}</span>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("teacher.findStudent")}
          className={fieldClass("pl-11")}
        />
      </label>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? t("teacher.noOneMatches", { query }) : t("teacher.nobodyInClassYet")}
          description={
            query
              ? t("teacher.checkSpellingClear")
              : t("teacher.addStudentsAppear")
          }
          action={
            query ? (
              <Button variant="secondary" onClick={() => setQuery("")}>
                {t("teacher.clearSearch")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((entry) => (
            <li key={entry.membershipId}>
              <StudentRow
                entry={entry}
                readOnly={readOnly}
                onMark={(status) => mark(entry.membershipId, status)}
                onOpenNote={() => setNoteFor(entry.membershipId)}
              />
            </li>
          ))}
        </ul>
      )}

      {noteFor && (
        <NoteSheet
          entry={roster.find((r) => r.membershipId === noteFor)!}
          onClose={() => setNoteFor(null)}
          onSave={(note) => {
            const entry = roster.find((r) => r.membershipId === noteFor)!;
            mark(noteFor, entry.status ?? "PRESENT", note);
            setNoteFor(null);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StudentRow({
  entry,
  readOnly,
  onMark,
  onOpenNote,
}: {
  entry: RosterEntry;
  readOnly?: boolean;
  onMark: (status: AttendanceStatus) => void;
  onOpenNote: () => void;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        // Wraps: on a phone the four status buttons (188 px) plus the note
        // button left the name 18 px — "Z…" at 390 px, nothing at 360 px —
        // so the name keeps at least 7 rem and the buttons drop to a second
        // line, right-aligned, when the row cannot hold them all.
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border bg-surface p-2.5 pl-3 transition-colors",
        // Clear of the sticky summary (and, on a phone, the top bar) when a mark is reached with Tab (TA-399).
        "scroll-mt-[7.5rem] lg:scroll-mt-[8rem]",
        entry.status ? "border-border" : "border-dashed border-border-strong",
      )}
      data-testid="register-row"
      data-membership-id={entry.membershipId}
      data-status={entry.status ?? ""}
    >
      <Avatar avatarKey={entry.avatarKey} name={entry.fullName} size="sm" />

      <div className="min-w-0 flex-1 basis-28">
        <p className="truncate text-sm font-semibold text-fg">{entry.name}</p>
        {entry.absenceNote ? (
          // The family told the school first: the line sits under the name before the teacher marks anything.
          <p className="truncate text-xs font-medium text-warn" data-testid="absence-note-line" title={entry.absenceNote.text || undefined}>
            {t(entry.absenceNote.byFamily ? "familyCare.registerLine" : "familyCare.registerLineSelf", { reason: t(REASON_KEY[entry.absenceNote.reason]) })}
            {entry.absenceNote.text ? ` · “${entry.absenceNote.text}”` : ""}
          </p>
        ) : null}
        {entry.note ? (
          <p className="truncate text-xs text-fg-muted">{entry.note}</p>
        ) : entry.fullName !== entry.name ? (
          // The legal name, under the preferred one — a second line only when
          // it says something the first line does not. Most pupils have no
          // preferred name set, and printing the same name twice reads as a
          // rendering mistake rather than information.
          <p className="truncate text-xs text-fg-subtle">{entry.fullName}</p>
        ) : null}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={onOpenNote}
          aria-label={
            entry.note
              ? t("teacher.editNoteFor", { name: entry.name })
              : t("teacher.addNoteFor", { name: entry.name })
          }
          className={cn(
            "tap grid shrink-0 place-items-center rounded-[var(--radius-sm)]",
            entry.note ? "text-accent-strong" : "text-fg-subtle hover:text-fg",
          )}
        >
          <NoteIcon weight={entry.note ? "fill" : "regular"} className="size-5" />
        </button>
      )}

      <div
        role="group"
        aria-label={t("teacher.attendanceFor", { name: entry.name })}
        className="ml-auto flex shrink-0 gap-1"
      >
        {ATTENDANCE_STATUSES.map((status) => {
          const meta = ATTENDANCE_META[status];
          const active = entry.status === status;
          // Hoisted so the audit sees a translated variable, not a template
          // literal it cannot read. Fully translated either way.
          const statusLabel = `${t(meta.labelKey)} — ${t(meta.hintKey)}`;
          return (
            <button
              key={status}
              type="button"
              disabled={readOnly}
              onClick={() => onMark(status)}
              aria-pressed={active}
              // The full word is in the accessible name; the visible glyph is
              // the initial. Colour alone never carries the meaning.
              aria-label={statusLabel}
              title={t(meta.labelKey)}
              data-testid={`register-mark-${status}`}
              className={cn(
                "grid size-11 place-items-center rounded-[var(--radius-sm)] text-sm font-bold",
                "transition-[transform,background-color,color] duration-[var(--dur-fast)]",
                "active:scale-90 disabled:opacity-50",
                active ? "shadow-sm" : "text-fg-subtle hover:bg-surface-muted",
              )}
              style={
                active
                  ? {
                      backgroundColor: `var(--att-${meta.token})`,
                      // White on light's status fills, dark on dark's pale ones (TA-230): globals.css --status-fg.
                      color: "var(--status-fg)",
                    }
                  : undefined
              }
            >
              <span aria-hidden="true">{t(meta.shortKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SyncPill({
  state,
  queued,
  online,
  complete,
}: {
  state: Pending;
  queued: number;
  online: boolean;
  complete: boolean;
}) {
  const t = useT();
  if (!online || state === "queued" || queued > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1.5 text-xs font-semibold text-warn">
        <WifiSlashIcon weight="bold" className="size-4" />
        {queued > 0
          ? queued === 1
            ? t("teacher.waitingToSyncOne")
            : t("teacher.waitingToSyncMany", { count: queued })
          : t("teacher.savedOnDevice")}
      </span>
    );
  }
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-fg-muted">
        <CloudArrowUpIcon weight="bold" className="size-4 animate-pulse" />
        {t("teacher.saving")}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger">
        {t("teacher.notSaved")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        complete ? "bg-ok-soft text-ok" : "bg-surface-muted text-fg-muted",
      )}
    >
      <CheckCircleIcon weight="fill" className="size-4" />
      {complete ? t("teacher.registerComplete") : state === "saved" ? t("teacher.savedShort") : t("teacher.readyShort")}
    </span>
  );
}

function NoteSheet({
  entry,
  onClose,
  onSave,
}: {
  entry: RosterEntry;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const t = useT();
  const [value, setValue] = useState(entry.note ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("teacher.noteFor", { name: entry.name })}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-t-[var(--radius-xl)] border border-border bg-surface p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] shadow-lg animate-sheet-up sm:rounded-[var(--radius-xl)] sm:pb-5"
      >
        <h2 className="text-base font-bold text-fg">{t("teacher.noteFor", { name: entry.name })}</h2>
        <p className="mt-0.5 text-xs text-fg-muted">
          {t("teacher.guardiansSeeNote")}
        </p>

        <textarea
          ref={ref}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t("teacher.notePlaceholder")}
          className={fieldClass("mt-3")}
        />
        <p className="mt-1 text-right text-xs text-fg-subtle">{value.length}/500</p>

        <div className="mt-3 flex gap-2">
          <Button variant="ghost" block onClick={onClose}>
            {t("teacher.cancel")}
          </Button>
          <Button block onClick={() => onSave(value.trim())}>
            {t("teacher.saveNote")}
          </Button>
        </div>
      </div>
    </div>
  );
}
