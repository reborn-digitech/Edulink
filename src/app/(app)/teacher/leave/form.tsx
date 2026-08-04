"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { LEAVE_KINDS, LEAVE_KIND_LABEL, type LeaveKind, type LeaveRow } from "@/lib/leave-kinds";
import { apply, withdraw } from "./actions";

/**
 * Applying to be away.
 *
 * THE REASON IS REQUIRED AND THE FORM SAYS WHO READS IT. "Say briefly why" with
 * no indication of the audience is how somebody either writes nothing useful or
 * writes something medical they did not intend the whole staff room to see. The
 * answer here is that the principal reads it and nobody else, and the form says
 * so next to the box.
 *
 * The nomination is offered as a suggestion and labelled as one. A teacher
 * cannot hand their register to somebody by applying for a day off — the
 * principal decides who actually covers, and may pick somebody else.
 */
export function LeaveForm({
  requests,
  staff,
  today,
}: {
  requests: LeaveRow[];
  staff: { membershipId: string; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(requests.length === 0);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [kind, setKind] = useState<LeaveKind>("CASUAL");
  const [reason, setReason] = useState("");
  const [nominee, setNominee] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await apply({
        fromDateKey: from,
        toDateKey: to,
        kind,
        reason,
        nominatedCoverMembershipId: nominee || null,
      });
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      setReason("");
      setNominee("");
      setOpen(false);
      toast({ tone: "ok", title: "Sent to the principal" });
      router.refresh();
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      const result = await withdraw(id);
      if (!result.ok) {
        toast({ tone: "danger", title: "Not withdrawn", description: result.error });
        return;
      }
      toast({ tone: "ok", title: "Withdrawn" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {!open && (
        <Button icon={<PaperPlaneTiltIcon weight="bold" />} onClick={() => setOpen(true)}>
          Apply for leave
        </Button>
      )}

      {open && (
        <form onSubmit={submit} className="rounded-[--radius-lg] border border-border bg-surface p-5">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm font-medium text-fg">First day away</span>
              <input
                type="date"
                required
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-fg outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-fg">Last day away</span>
              <input
                type="date"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-fg outline-none focus:border-accent"
              />
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-fg">Kind of leave</legend>
            <div className="mt-2 flex flex-wrap gap-1 rounded-[--radius-md] bg-surface-muted p-1">
              {LEAVE_KINDS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={kind === option}
                  onClick={() => setKind(option)}
                  className={cn(
                    "min-h-11 flex-1 rounded-[--radius-sm] px-3 text-sm font-medium transition-colors",
                    kind === option ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {LEAVE_KIND_LABEL[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 block">
            <span className="block text-sm font-medium text-fg">Why</span>
            {/* Says who reads it, right next to the box. Without that, people
                either write nothing useful or write something private they did
                not mean the whole staff room to see. */}
            <span className="mt-0.5 block text-xs text-fg-muted">
              The principal reads this. It is not shown to other staff, and never to students or
              parents.
            </span>
            <textarea
              required
              rows={3}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2.5 text-sm text-fg outline-none focus:border-accent"
            />
          </label>

          <label className="mt-4 block">
            <span className="block text-sm font-medium text-fg">
              Who could cover your classes (optional)
            </span>
            <span className="mt-0.5 block text-xs text-fg-muted">
              A suggestion. The principal decides, and may name somebody else.
            </span>
            <select
              value={nominee}
              onChange={(e) => setNominee(e.target.value)}
              className="mt-1.5 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-[0.9375rem] text-fg outline-none focus:border-accent"
            >
              <option value="">No suggestion</option>
              {staff.map((person) => (
                <option key={person.membershipId} value={person.membershipId}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 flex gap-2">
            <Button type="submit" loading={pending} icon={<PaperPlaneTiltIcon weight="bold" />}>
              Send to the principal
            </Button>
            {requests.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      {requests.length > 0 && (
        <ul className="space-y-2">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-[--radius-md] border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">
                    {request.fromDateKey}
                    {request.toDateKey !== request.fromDateKey ? ` to ${request.toDateKey}` : ""}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {LEAVE_KIND_LABEL[request.kind as LeaveKind] ?? request.kind}
                    {request.nominatedName ? ` · suggested cover: ${request.nominatedName}` : ""}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                    {request.reason}
                  </p>
                  {request.decisionNote && (
                    <p className="mt-2 rounded-[--radius-sm] bg-surface-muted p-2.5 text-sm leading-relaxed text-fg-muted">
                      {request.decidedByName ? `${request.decidedByName}: ` : ""}
                      {request.decisionNote}
                    </p>
                  )}
                </div>

                <Badge
                  tone={
                    request.status === "APPROVED"
                      ? "ok"
                      : request.status === "PENDING"
                        ? "warn"
                        : "neutral"
                  }
                  size="sm"
                >
                  {request.status.toLowerCase()}
                </Badge>

                {(request.status === "PENDING" || request.status === "APPROVED") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
                    aria-label="Withdraw this request"
                    onClick={() => cancel(request.id)}
                  >
                    <XIcon weight="bold" className="size-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
