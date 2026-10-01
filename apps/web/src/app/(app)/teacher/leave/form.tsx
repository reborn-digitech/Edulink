"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  LEAVE_KINDS,
  LEAVE_KIND_LABEL_KEY,
  LEAVE_STATUS_KEY,
  type LeaveKind,
  type LeaveStatus,
  type LeaveRow,
} from "@/lib/leave-kinds";
import { apply, withdraw } from "./actions";
import { DateField } from "@/components/ui/field";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { formatDateKey } from "@/lib/dates";

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
  const t = useT();
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
        setError(actionError(t, result, "people.didNotWork"));
        return;
      }
      setReason("");
      setNominee("");
      setOpen(false);
      toast({ tone: "ok", title: t("teacher.sentToPrincipal") });
      router.refresh();
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      const result = await withdraw(id);
      if (!result.ok) {
        toast({
          tone: "danger",
          title: t("teacher.notWithdrawn"),
          description: actionError(t, result),
        });
        return;
      }
      toast({ tone: "ok", title: t("teacher.withdrawn") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {!open && (
        <Button icon={<PaperPlaneTiltIcon weight="bold" />} onClick={() => setOpen(true)} data-testid="leave-open">
          {t("teacher.applyForLeave")}
        </Button>
      )}

      {open && (
        <form onSubmit={submit} className="rounded-[--radius-lg] border border-border bg-surface p-5" data-testid="leave-form">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              label={t("teacher.firstDay")}
              required
              data-testid="leave-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <DateField
              label={t("teacher.lastDay")}
              required
              data-testid="leave-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              />
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-fg">{t("teacher.kindOfLeave")}</legend>
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
                  {t(LEAVE_KIND_LABEL_KEY[option])}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 block">
            <span className="block text-sm font-medium text-fg">{t("teacher.whyLabel")}</span>
            {/* Says who reads it, right next to the box. Without that, people
                either write nothing useful or write something private they did
                not mean the whole staff room to see. */}
            <span className="mt-0.5 block text-xs text-fg-muted">{t("teacher.whyHint")}</span>
            <textarea
              required
              rows={3}
              maxLength={1000}
              data-testid="leave-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
          </label>

          <label className="mt-4 block">
            <span className="block text-sm font-medium text-fg">
              {t("teacher.whoCouldCover")}
            </span>
            <span className="mt-0.5 block text-xs text-fg-muted">
              {t("teacher.coverHint")}
            </span>
            <select
              value={nominee}
              data-testid="leave-nominee"
              onChange={(e) => setNominee(e.target.value)}
              className="mt-1.5 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-[0.9375rem] text-fg outline-none focus:border-accent"
            >
              <option value="">{t("teacher.noSuggestion")}</option>
              {staff.map((person) => (
                <option key={person.membershipId} value={person.membershipId}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 flex gap-2">
            <Button type="submit" loading={pending} icon={<PaperPlaneTiltIcon weight="bold" />} data-testid="leave-send">
              {t("teacher.sendToPrincipal")}
            </Button>
            {requests.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("teacher.cancel")}
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
              data-testid="leave-request"
              data-leave-id={request.id}
              data-status={request.status}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">
                    {request.toDateKey !== request.fromDateKey
                      ? t("calendar.rangeTo", {
                          from: formatDateKey(request.fromDateKey, { day: "numeric", month: "short" }),
                          to: formatDateKey(request.toDateKey, { day: "numeric", month: "short" }),
                        })
                      : formatDateKey(request.fromDateKey, { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind]
                      ? t(LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind])
                      : request.kind}
                    {request.nominatedName ? ` · ${t("teacher.suggestedCover", { name: request.nominatedName })}` : ""}
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
                  {t(LEAVE_STATUS_KEY[request.status as LeaveStatus] ?? "leaveStatus.pending")}
                </Badge>

                {(request.status === "PENDING" || request.status === "APPROVED") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
                    aria-label={t("teacher.withdrawRequest")}
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
