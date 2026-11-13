"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckCircleIcon, FloppyDiskIcon, ClockIcon } from "@phosphor-icons/react";
import { STAFF_ATTENDANCE_STATUSES } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { ROLE_META, type Role } from "@/lib/constants";
import { formatInZone } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import { STAFF_SOURCE_KEY, STAFF_STATUS_KEY, clockToMinute, minuteToClock } from "@/lib/staff-attendance-labels";
import type { StaffAttendanceStatus, StaffRegisterView } from "@/lib/staff-attendance-types";
import { markStaffRegisterAction, saveStaffAttendanceSettingsAction } from "./actions";

type Row = StaffRegisterView["rows"][number];
type Draft = { status: StaffAttendanceStatus | null; note: string };

/**
 * The register as a form: a row per staff member with a labelled radio group
 * for the five statuses and a small note, "mark everyone present" for the
 * unmarked, and one save. Only the rows that CHANGED go to the server: an
 * idle save must not rewrite a phone check-in as the office's mark, nor turn
 * an approved leave into a row of its own.
 */
export function RegisterForm({ register, timezone }: { register: StaffRegisterView; timezone: string }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(register.rows.map((r) => [r.membershipId, { status: r.status, note: r.note ?? "" }])));
  const [error, setError] = useState<string | null>(null);

  const draftOf = (row: Row): Draft => drafts[row.membershipId] ?? { status: row.status, note: row.note ?? "" };
  const changed = (row: Row) => {
    const d = draftOf(row);
    return d.status !== row.status || d.note.trim() !== (row.note ?? "");
  };
  const set = (id: string, patch: Partial<Draft>) => setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { status: null, note: "" }), ...patch } }));

  function everyonePresent() {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const row of register.rows) {
        const d = next[row.membershipId] ?? { status: row.status, note: row.note ?? "" };
        if (d.status === null) next[row.membershipId] = { ...d, status: "PRESENT" };
      }
      return next;
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const entries = register.rows
      .filter((row) => changed(row) && draftOf(row).status !== null)
      .map((row) => {
        const d = draftOf(row);
        return { membershipId: row.membershipId, status: d.status as StaffAttendanceStatus, note: d.note.trim() || undefined };
      });
    if (entries.length === 0) {
      toast({ tone: "neutral", title: t("staffAttendance.saved") });
      return;
    }
    startTransition(async () => {
      const result = await markStaffRegisterAction({ date: register.dateKey, entries });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("staffAttendance.saved") });
      router.refresh();
    });
  }

  const unmarked = register.rows.filter((row) => draftOf(row).status === null).length;

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="staff-register-form">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={unmarked === 0 || pending} onClick={everyonePresent} icon={<CheckCircleIcon weight="bold" />}>
          {t("staffAttendance.everyonePresent")}
        </Button>
        <Button type="submit" size="sm" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
          {t("staffAttendance.save")}
        </Button>
      </div>

      <ul className="divide-y divide-border">
        {register.rows.map((row) => {
          const d = draftOf(row);
          const time = row.checkedInAt ? formatInZone(new Date(row.checkedInAt), timezone, { timeStyle: "short" }, locale) : null;
          return (
            <li key={row.membershipId} className="py-3">
              <fieldset className="space-y-2">
                <legend className="flex items-center gap-3">
                  <Avatar avatarKey={row.avatarKey} name={row.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{row.name}</span>
                    <span className="block text-xs text-fg-muted">{t(ROLE_META[row.role as Role]?.labelKey ?? "role.teacher")}</span>
                  </span>
                  {row.onLeave && (
                    <Badge tone="neutral" size="sm" className="ml-auto">
                      {t("staffAttendance.onLeave")}
                    </Badge>
                  )}
                </legend>
                {row.onLeave && <p className="text-xs text-fg-muted">{t("staffAttendance.onLeaveHint")}</p>}
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={row.name}>
                  {STAFF_ATTENDANCE_STATUSES.map((status) => {
                    const on = d.status === status;
                    return (
                      <label
                        key={status}
                        className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors hover:bg-surface-muted ${on ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-border text-fg"}`}
                      >
                        <input type="radio" name={`status-${row.membershipId}`} value={status} checked={on} onChange={() => set(row.membershipId, { status })} className="size-4 accent-[var(--accent)]" />
                        {t(STAFF_STATUS_KEY[status])}
                      </label>
                    );
                  })}
                  {d.status === null && <span className="self-center text-xs text-fg-subtle">{t("staffAttendance.unmarked")}</span>}
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-end">
                  <TextField label={t("staffAttendance.note")} maxLength={200} autoComplete="off" value={d.note} onChange={(e) => set(row.membershipId, { note: e.target.value })} className="[&_input]:min-h-10 [&_input]:py-2" />
                  {row.source && (
                    <p className="flex items-center gap-1.5 text-xs text-fg-muted">
                      <ClockIcon weight="regular" className="size-3.5 shrink-0" aria-hidden="true" />
                      {t("staffAttendance.source")} {t(STAFF_SOURCE_KEY[row.source])}
                      {time && ` · ${time}`}
                    </p>
                  )}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
          {t("staffAttendance.save")}
        </Button>
      </div>
    </form>
  );
}

/**
 * When the staff day starts and the grace before a check-in is late, behind a
 * disclosure: changed a few times a year, read every day in the header.
 */
export function SettingsForm({ checkInMinute, lateGraceMinutes }: { checkInMinute: number; lateGraceMinutes: number }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [clock, setClock] = useState(minuteToClock(checkInMinute));
  const [grace, setGrace] = useState(String(lateGraceMinutes));
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const minute = clockToMinute(clock);
    const graceMinutes = Number(grace);
    if (minute === null || !Number.isInteger(graceMinutes) || graceMinutes < 0 || graceMinutes > 180) return setError(t("common.checkTheForm"));
    startTransition(async () => {
      const result = await saveStaffAttendanceSettingsAction({ checkInMinute: minute, lateGraceMinutes: graceMinutes });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("staffAttendance.settingsSaved") });
      router.refresh();
    });
  }

  return (
    <details className="rounded-[var(--radius-md)] border border-border">
      <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-medium text-fg">{t("staffAttendance.changeSettings")}</summary>
      <form onSubmit={submit} noValidate className="space-y-3 border-t border-border px-3.5 py-3">
        {error && (
          <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={t("staffAttendance.dayStart")} type="time" required value={clock} onChange={(e) => setClock(e.target.value)} />
          <TextField label={t("staffAttendance.grace")} type="number" inputMode="numeric" min={0} max={180} step={1} required value={grace} onChange={(e) => setGrace(e.target.value)} hint={t("staffAttendance.graceMinutes", { count: Number(grace) || 0 })} />
        </div>
        <Button type="submit" size="sm" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
          {t("common.save")}
        </Button>
      </form>
    </details>
  );
}
