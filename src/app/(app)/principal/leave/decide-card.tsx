"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { LEAVE_KIND_LABEL_KEY, LEAVE_STATUS_KEY, type LeaveKind, type LeaveStatus, type LeaveRow } from "@/lib/leave-kinds";
import { actionError } from "@/lib/action-error";
import { decide } from "./actions";
import { useT } from "@/lib/i18n";

/**
 * One request, and the decision.
 *
 * THE COVER CHOICE IS PART OF APPROVING, not a separate job afterwards. A leave
 * screen that records an absence and leaves somebody to remember the register is
 * how a class ends up unmarked on a Tuesday — the register is the thing that
 * must happen whether or not anybody remembered. So the cover picker sits
 * inside the approve action, pre-filled with the applicant's suggestion and
 * freely overridable, and the count of classes it will cover is shown before
 * the button is pressed.
 */
export function DecideCard({
  request,
  staff,
  classesCovered,
}: {
  request: LeaveRow;
  /** Ranked by the timetable: free people first, each with a why. */
  staff: { membershipId: string; name: string; hint: string | null }[];
  /**
   * How many CLASSES this person is due in — the registers they mark and the
   * lessons they teach, de-duplicated. Exactly the number of cover rows
   * approving will write.
   */
  classesCovered: number;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [cover, setCover] = useState(
    staff.find((s) => s.name === request.nominatedName)?.membershipId ?? "",
  );
  const [note, setNote] = useState("");
  const [declining, setDeclining] = useState(false);

  function answer(decision: "APPROVED" | "DECLINED") {
    startTransition(async () => {
      const result = await decide(request.id, decision, {
        note,
        coverMembershipId: decision === "APPROVED" ? cover || null : null,
      });
      if (!result.ok) {
        toast({ tone: "danger", title: t("principal.notSaved"), description: actionError(t, result) });
        return;
      }
      toast({
        tone: "ok",
        title:
          decision === "APPROVED" ? t("principal.leaveApproved") : t("principal.leaveDeclined"),
        description:
          decision === "APPROVED" && result.coversCreated
            ? result.coversCreated === 1
              ? t("principal.coverArrangedOne")
              : t("principal.coverArrangedMany", { count: result.coversCreated })
            : undefined,
      });
      router.refresh();
    });
  }

  return (
    <div className="rounded-[--radius-md] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-fg">{request.applicantName}</p>
          <p className="text-xs text-fg-muted">
            {request.toDateKey !== request.fromDateKey
              ? t("calendar.rangeTo", { from: request.fromDateKey, to: request.toDateKey })
              : request.fromDateKey}{" "}
            ·{" "}
            {LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind]
              ? t(LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind])
              : request.kind}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg">
            {request.reason}
          </p>
        </div>
        <Badge tone="warn" size="sm">
          {t(LEAVE_STATUS_KEY[request.status as LeaveStatus] ?? "leaveStatus.pending")}
        </Badge>
      </div>

      <div className="mt-4 rounded-[--radius-sm] bg-surface-muted p-3">
        <label className="block">
          <span className="block text-xs font-medium text-fg">{t("principal.whoCovers")}</span>
          <span className="mt-0.5 block text-xs text-fg-muted">
            {classesCovered === 0
              ? t("principal.noCoverNeeded")
              : classesCovered === 1
                ? t("principal.appliesToOne")
                : t("principal.appliesToMany", { count: classesCovered })}
            {request.nominatedName
              ? ` ${t("principal.theySuggested", { name: request.nominatedName })}`
              : ""}
          </span>
          <select
            value={cover}
            disabled={classesCovered === 0}
            onChange={(e) => setCover(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent disabled:opacity-60"
          >
            <option value="">{t("principal.nobodyYet")}</option>
            {staff.map((person) => (
              <option key={person.membershipId} value={person.membershipId}>
                {person.name}
                {person.hint ? ` — ${person.hint}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {declining && (
        <label className="mt-3 block">
          <span className="block text-xs font-medium text-fg">{t("principal.whyTheyWillSee")}</span>
          <textarea
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          loading={pending}
          icon={<CheckIcon weight="bold" />}
          onClick={() => answer("APPROVED")}
        >
          {cover && classesCovered > 0 ? t("principal.approveAndCover") : t("principal.approve")}
        </Button>
        {declining ? (
          <Button
            size="sm"
            variant="danger"
            loading={pending}
            icon={<XIcon weight="bold" />}
            onClick={() => answer("DECLINED")}
          >
            {t("principal.confirmDecline")}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setDeclining(true)}>
            {t("principal.decline")}
          </Button>
        )}
      </div>
    </div>
  );
}
