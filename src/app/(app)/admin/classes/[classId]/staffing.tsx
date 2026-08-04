"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { toggleAttendanceRight, addCover, removeCover, addTeacher, dropTeacher } from "./actions";

type ClassTeacherRow = {
  id: string;
  membershipId: string;
  name: string;
  role: string;
  canTakeAttendance: boolean;
};

type CoverRow = {
  id: string;
  name: string;
  fromDateKey: string;
  toDateKey: string;
  reason: string | null;
  fromLeave: boolean;
};

type StaffOption = { membershipId: string; name: string; role: string };

/**
 * Who marks this register, and who is covering it.
 *
 * TWO LISTS, NOT ONE, because they answer different questions and a school asks
 * them at different times. "Who is down for this class" is a decision made once
 * a term; "who is marking it this week" is a decision made the night before
 * somebody goes into hospital. Merging them into one editable list would make
 * the second one look like a permanent change to the first.
 */
export function Staffing({
  classId,
  teachers,
  covers,
  staff,
  today,
}: {
  classId: string;
  teachers: ClassTeacherRow[];
  covers: CoverRow[];
  staff: StaffOption[];
  today: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newTeacher, setNewTeacher] = useState("");
  const [newRole, setNewRole] = useState<"LEAD" | "CO">("LEAD");

  const takers = teachers.filter((t) => t.canTakeAttendance).length + covers.length;

  function assign(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addTeacher(classId, newTeacher, newRole);
      if (!result.ok) {
        toast({ tone: "danger", title: "Not assigned", description: result.error });
        return;
      }
      setNewTeacher("");
      toast({ tone: "ok", title: newRole === "LEAD" ? "Class teacher assigned" : "Teacher added" });
      router.refresh();
    });
  }

  function unassign(row: ClassTeacherRow) {
    startTransition(async () => {
      const result = await dropTeacher(classId, row.membershipId);
      if (!result.ok) {
        toast({ tone: "danger", title: "Not removed", description: result.error });
        return;
      }
      router.refresh();
    });
  }

  function toggle(row: ClassTeacherRow) {
    startTransition(async () => {
      const result = await toggleAttendanceRight(classId, row.id, !row.canTakeAttendance);
      if (!result.ok) {
        toast({ tone: "danger", title: "Not changed", description: result.error });
        return;
      }
      router.refresh();
    });
  }

  function submitCover(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCover({
        classId,
        coveringMembershipId: who,
        fromDateKey: from,
        toDateKey: to,
        reason,
      });
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      setOpen(false);
      setWho("");
      setReason("");
      toast({ tone: "ok", title: "Cover arranged" });
      router.refresh();
    });
  }

  function drop(coverId: string) {
    startTransition(async () => {
      const result = await removeCover(classId, coverId);
      if (!result.ok) {
        toast({ tone: "danger", title: "Not cancelled", description: result.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-fg">Class teachers</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          Turn the register off for anybody who teaches this class but should not be marking it — a
          visiting subject teacher attached to six classes does not mark six registers.
        </p>

        {teachers.length === 0 ? (
          <p className="mt-3 rounded-[--radius-md] border border-dashed border-border p-4 text-sm text-fg-muted">
            Nobody is assigned to this class yet. Until somebody is, only an admin can mark its
            register.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {teachers.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-[--radius-sm] bg-surface-muted p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{row.name}</span>
                  <span className="block text-xs text-fg-muted">
                    {row.role === "LEAD" ? "Class teacher" : "Also teaches this class"}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={pending}
                  aria-label={`Take ${row.name} off this class`}
                  onClick={() => unassign(row)}
                >
                  <XIcon weight="bold" className="size-4" />
                </Button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.canTakeAttendance}
                  aria-label={`Register duty for ${row.name}`}
                  disabled={pending}
                  onClick={() => toggle(row)}
                  className={cn(
                    "min-h-10 rounded-full px-3.5 text-xs font-semibold transition-colors disabled:opacity-60",
                    row.canTakeAttendance
                      ? "bg-ok-soft text-ok"
                      : "bg-surface text-fg-muted ring-1 ring-border",
                  )}
                >
                  {row.canTakeAttendance ? "Takes the register" : "Does not"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={assign} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1">
            <span className="block text-xs font-medium text-fg">Add a teacher</span>
            <select
              value={newTeacher}
              onChange={(e) => setNewTeacher(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
            >
              <option value="">Choose somebody…</option>
              {staff
                .filter((person) => person.role !== "ADMIN")
                .filter((person) => !teachers.some((t) => t.membershipId === person.membershipId))
                .map((person) => (
                  <option key={person.membershipId} value={person.membershipId}>
                    {person.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span className="block text-xs font-medium text-fg">As</span>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "LEAD" | "CO")}
              className="mt-1 min-h-11 rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
            >
              <option value="LEAD">Class teacher</option>
              <option value="CO">Also teaches</option>
            </select>
          </label>
          <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={!newTeacher}>
            Assign
          </Button>
        </form>

        {teachers.length > 0 && !teachers.some((t) => t.role === "LEAD") && (
          // No database constraint forces exactly one — a job share is real, and
          // a school mid-handover has two for a fortnight. Having NONE is the
          // case nobody intends, so that is the one worth saying.
          <p className="mt-3 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
            This class has no class teacher. Nobody is down to write its report cards.
          </p>
        )}

        {takers === 0 && (
          // Said out loud rather than discovered on a Monday morning. It is
          // allowed — an admin can always mark it — but it is rarely intended.
          <p className="mt-3 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
            Nobody but an admin can mark this register.
          </p>
        )}
      </section>

      <section className="border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-fg">Cover</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
              Somebody else may mark this register for a few days. It adds a person and never
              removes one, so the class teacher can still mark it if they come in after all.
            </p>
          </div>
          {!open && (
            <Button size="sm" variant="secondary" icon={<PlusIcon weight="bold" />} onClick={() => setOpen(true)}>
              Arrange cover
            </Button>
          )}
        </div>

        {open && (
          <form onSubmit={submitCover} className="mt-3 rounded-[--radius-md] border border-border p-4">
            {error && (
              <p role="alert" className="mb-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            <label className="block">
              <span className="block text-sm font-medium text-fg">Who is covering</span>
              <select
                value={who}
                required
                onChange={(e) => setWho(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-[0.9375rem] text-fg outline-none focus:border-accent"
              >
                <option value="">Choose somebody…</option>
                {staff.map((person) => (
                  <option key={person.membershipId} value={person.membershipId}>
                    {person.name}
                    {person.role !== "TEACHER" ? ` (${person.role.toLowerCase()})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-medium text-fg">First day</span>
                <input
                  type="date"
                  value={from}
                  required
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-fg outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-fg">Last day</span>
                <input
                  type="date"
                  value={to}
                  required
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-fg outline-none focus:border-accent"
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="block text-sm font-medium text-fg">Why (optional)</span>
              <input
                type="text"
                value={reason}
                maxLength={200}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-fg outline-none focus:border-accent"
              />
            </label>

            <div className="mt-4 flex gap-2">
              <Button type="submit" size="sm" loading={pending} disabled={!who}>
                Arrange cover
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {covers.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {covers.map((cover) => (
              <li
                key={cover.id}
                className="flex flex-wrap items-center gap-3 rounded-[--radius-sm] bg-surface-muted p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{cover.name}</span>
                  <span className="block text-xs text-fg-muted">
                    {cover.fromDateKey}
                    {cover.toDateKey !== cover.fromDateKey ? ` to ${cover.toDateKey}` : ""}
                    {cover.reason ? ` · ${cover.reason}` : ""}
                  </span>
                </span>
                {cover.fromLeave && (
                  <Badge tone="neutral" size="sm">
                    from approved leave
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  loading={pending}
                  aria-label={`Cancel cover for ${cover.name}`}
                  onClick={() => drop(cover.id)}
                >
                  <XIcon weight="bold" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
