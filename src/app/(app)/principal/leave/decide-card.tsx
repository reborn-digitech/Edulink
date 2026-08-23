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
import { cn } from "@/lib/cn";
import { formatDateKey } from "@/lib/dates";

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
export type GroupOption = {
  membershipId: string;
  name: string;
  hint: string | null;
  teachesSubject: boolean;
};

export type GroupPick = {
  classId: string;
  className: string;
  subject: string;
  lessonCount: number;
  /** Ranked for this group: teaches the subject first, then free-ness. */
  options: GroupOption[];
};

export function DecideCard({
  request,
  staff,
  groups,
  classesCovered,
  balance,
}: {
  request: LeaveRow;
  /** Ranked by the timetable: free people first, each with a why. */
  staff: { membershipId: string; name: string; hint: string | null }[];
  /**
   * The applicant's week sliced by (class, subject) — one picker each, so a
   * teacher of Maths and History can be replaced by a mathematician AND a
   * historian, and two classes of one subject can go to two people. Empty for
   * an applicant with no timetabled lessons, where the single picker is the
   * whole story.
   */
  groups: GroupPick[];
  /**
   * How many CLASSES this person is due in — the registers they mark and the
   * lessons they teach, de-duplicated. Exactly the number of cover rows
   * approving will write.
   */
  classesCovered: number;
  /** The applicant's leave this year, from the staff record. Null when the desk has no record at all. */
  balance?: { entitlement: number | null; used: number; pending: number; remaining: number | null; thisRequest: number } | null;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [cover, setCover] = useState(
    staff.find((s) => s.name === request.nominatedName)?.membershipId ?? "",
  );
  /** classId|subject → chosen membershipId ("" = follow the single picker). */
  const [groupCover, setGroupCover] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [declining, setDeclining] = useState(false);

  function answer(decision: "APPROVED" | "DECLINED") {
    startTransition(async () => {
      const coverAssignments =
        decision === "APPROVED"
          ? groups
              .map((group) => ({
                classId: group.classId,
                subject: group.subject,
                coverMembershipId: groupCover[`${group.classId}|${group.subject}`] || cover || "",
              }))
              .filter((a) => a.coverMembershipId)
          : [];
      const result = await decide(request.id, decision, {
        note,
        coverMembershipId: decision === "APPROVED" ? cover || null : null,
        coverAssignments: coverAssignments.length > 0 ? coverAssignments : undefined,
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
              ? t("calendar.rangeTo", {
                  from: formatDateKey(request.fromDateKey, { day: "numeric", month: "short" }),
                  to: formatDateKey(request.toDateKey, { day: "numeric", month: "short" }),
                })
              : formatDateKey(request.fromDateKey, { day: "numeric", month: "short" })}{" "}
            ·{" "}
            {LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind]
              ? t(LEAVE_KIND_LABEL_KEY[request.kind as LeaveKind])
              : request.kind}
          </p>
          {balance && (
            <p className="mt-1 text-xs" data-testid="leave-balance">
              {balance.entitlement === null ? (
                <span className="text-fg-muted">{t("staff.deskNoEntitlement", { used: balance.used })}</span>
              ) : (
                <>
                  <span className={cn(balance.remaining !== null && balance.remaining - balance.thisRequest < 0 ? "text-danger" : "text-fg-muted")}>
                    {t("staff.deskBalance", { used: balance.used, entitlement: balance.entitlement, remaining: balance.remaining ?? 0 })}
                  </span>
                  {balance.remaining !== null && balance.remaining - balance.thisRequest < 0 && (
                    <span className="ml-1 font-semibold text-danger">· {t("staff.deskOver", { over: balance.thisRequest - balance.remaining })}</span>
                  )}
                </>
              )}
            </p>
          )}
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

        {/* The combinations: one picker per (class, subject), each defaulting
            to the single choice above so naming one person still covers
            everything — and any slice can be handed to somebody else, with
            the subject-teachers listed first and labelled. */}
        {groups.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-fg">
              {t("reviews.coverBySubject")}
            </summary>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              {t("reviews.coverBySubjectHint")}
            </p>
            <ul className="mt-2 space-y-2">
              {groups.map((group) => {
                const key = `${group.classId}|${group.subject}`;
                return (
                  <li key={key}>
                    <label className="block">
                      <span className="block text-xs font-medium text-fg">
                        {group.className} · {group.subject}{" "}
                        <span className="font-normal text-fg-muted">
                          ({t("reviews.lessonsN", { count: group.lessonCount })})
                        </span>
                      </span>
                      <select
                        value={groupCover[key] ?? ""}
                        onChange={(e) =>
                          setGroupCover((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="mt-1 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
                      >
                        <option value="">{t("principal.nobodyYet")}</option>
                        {group.options.map((person) => (
                          <option key={person.membershipId} value={person.membershipId}>
                            {person.name}
                            {person.teachesSubject ? ` ★ ${t("reviews.teachesSubjectMark")}` : ""}
                            {person.hint ? ` — ${person.hint}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
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
