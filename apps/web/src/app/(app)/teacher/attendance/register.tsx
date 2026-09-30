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

export type RosterEntry = {
  membershipId: string;
  name: string;
  fullName: string;
  avatarKey: string | null;
  status: AttendanceStatus | null;
  note: string | null;
};

type Pending = "idle" | "saving" | "queued" | "saved" | "error";

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
  readOnly,
}: {
  classId: string;
  className: string;
  dateKey: string;
  dateLabel: string;
  initialRoster: RosterEntry[];
  readOnly?: boolean;
}) {
  const t = useT();
  const { toast } = useToast();
  const [roster, setRoster] = useState(initialRoster);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<Pending>("idle");
  const [queued, setQueued] = useState(0);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  // Marks the user has changed but not yet sent, keyed by membershipId.
  const dirty = useRef(new Map<string, { status: AttendanceStatus; note: string | null; clientId: string; markedAt: string }>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const marks = [...dirty.current.entries()].map(([studentMembershipId, mark]) => ({
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

      const result = (await response.json()) as { applied: number; rejected: unknown[] };
      setState("saved");
      if (result.rejected.length > 0) {
        toast({
          tone: "warn",
          title: t("teacher.someNotSaved"),
          description: t("teacher.noLongerInClass", { count: result.rejected.length }),
        });
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

  // A teacher closing the tab mid-register must not lose the last marks.
  useEffect(() => {
    const onHide = () => {
      if (dirty.current.size > 0) void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flush]);

  function mark(membershipId: string, status: AttendanceStatus, note?: string | null) {
    const previous = roster.find((r) => r.membershipId === membershipId);

    setRoster((current) =>
      current.map((entry) =>
        entry.membershipId === membershipId
          ? { ...entry, status, note: note !== undefined ? note : entry.note }
          : entry,
      ),
    );

    dirty.current.set(membershipId, {
      status,
      note: note !== undefined ? note : (previous?.note ?? null),
      clientId: newClientId(),
      markedAt: new Date().toISOString(),
    });

    scheduleSave();
  }

  function markAllPresent() {
    const unmarked = roster.filter((entry) => !entry.status);
    if (unmarked.length === 0) return;

    const snapshot = roster;
    const stamp = new Date().toISOString();

    setRoster((current) =>
      current.map((entry) => (entry.status ? entry : { ...entry, status: "PRESENT" as const })),
    );
    for (const entry of unmarked) {
      dirty.current.set(entry.membershipId, {
        status: "PRESENT",
        note: entry.note,
        clientId: newClientId(),
        markedAt: stamp,
      });
    }
    scheduleSave();

    toast({
      tone: "ok",
      title: t("teacher.markedPresent", { count: unmarked.length }),
      description: t("teacher.nowChange"),
      onUndo: () => {
        setRoster(snapshot);
        for (const entry of unmarked) {
          dirty.current.delete(entry.membershipId);
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
            <h1 className="truncate text-lg font-bold tracking-tight text-fg">{className}</h1>
            <p className="text-xs text-fg-muted">
              {dateLabel} · {roster.length} student{roster.length === 1 ? "" : "s"}
            </p>
          </div>
          <SyncPill state={state} queued={queued} online={online} complete={complete} />
        </div>

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
              {counts.unmarked} not marked
            </span>
          )}
        </div>
      </div>

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
          className="min-h-12 w-full rounded-[--radius-md] border border-border bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
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
        "flex flex-wrap items-center gap-3 rounded-[--radius-lg] border bg-surface p-2.5 pl-3 transition-colors",
        entry.status ? "border-border" : "border-dashed border-border-strong",
      )}
    >
      <Avatar avatarKey={entry.avatarKey} name={entry.fullName} size="sm" />

      <div className="min-w-0 flex-1 basis-28">
        <p className="truncate text-sm font-semibold text-fg">{entry.name}</p>
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
            "tap grid shrink-0 place-items-center rounded-[--radius-sm]",
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
              className={cn(
                "grid size-11 place-items-center rounded-[--radius-sm] text-sm font-bold",
                "transition-[transform,background-color,color] duration-[--dur-fast]",
                "active:scale-90 disabled:opacity-50",
                active ? "shadow-sm" : "text-fg-subtle hover:bg-surface-muted",
              )}
              style={
                active
                  ? {
                      backgroundColor: `var(--att-${meta.token})`,
                      color: "#fff",
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
        className="w-full max-w-md rounded-t-[--radius-xl] border border-border bg-surface p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] shadow-lg animate-sheet-up sm:rounded-[--radius-xl] sm:pb-5"
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
          className="mt-3 w-full rounded-[--radius-md] border border-border bg-surface p-3 text-[0.9375rem] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
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
