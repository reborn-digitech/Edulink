"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removePerson } from "./actions";
import type { RemovalBlocker } from "@/lib/membership";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

/**
 * The removal form, opened from the row's action menu (directory-menu.tsx).
 *
 * THE THIRD VERB, and the copy is most of the work — because the failure this
 * design has to prevent is not a bug, it is an admin reaching for the wrong
 * verb. Three things a school might mean, and only one of them is this:
 *
 *   Pause  — not for now. They are coming back.
 *   Left   — gone to another school. A certificate goes with them.
 *   Remove — never here. A duplicate, a typo, the wrong school.
 *
 * SO IT SAYS WHAT IT IS FOR, IN THE BOX, and it names the alternative. An admin
 * who opens this meaning "transferred" is told, before any button, that the
 * other one is what keeps the record and gives the family something to hand on.
 *
 * AND THE REAL GUARD IS NOT HERE. `removeMembership` refuses outright the moment
 * a pupil has a register mark, a grade, a piece of work or a report card, so for
 * anybody who actually attended this cannot delete anything however hard it is
 * clicked. What the server sends back is WHICH record stood in the way, and
 * this renders it — "cannot remove" with no reason is a dead end, and §7 says
 * there are none.
 */
export function RemovePanel({
  membershipId,
  name,
  onClose,
}: {
  membershipId: string;
  name: string;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<RemovalBlocker | null>(null);

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft p-3">
      <p className="text-sm font-semibold text-fg">{t("people.removeTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">
        {t("people.removeBodyPrefix")}{" "}
        <strong className="text-fg">{t("people.removeBodyDeleted")}</strong>
        {t("people.removeBodySuffix")}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">
        <strong className="text-fg">{t("people.changedSchoolInstead")}</strong>{" "}
        {t("people.changedSchoolUse")} <em>{t("people.left")}</em>. {t("people.changedSchoolBody")}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">{t("people.accountUntouched")}</p>

      {error && (
        <div role="alert" className="mt-3 rounded-[var(--radius-sm)] bg-surface p-2.5">
          <p className="text-xs font-semibold text-danger">{error}</p>
          {blockers && (
            <ul className="mt-1.5 space-y-0.5 text-xs text-fg-muted">
              {blockers.attendance > 0 && (
                <li>
                  {blockers.attendance === 1
                    ? t("people.blockerAttendanceOne")
                    : t("people.blockerAttendanceMany", { count: blockers.attendance })}
                </li>
              )}
              {blockers.marks > 0 && (
                <li>
                  {blockers.marks === 1
                    ? t("people.blockerMarksOne")
                    : t("people.blockerMarksMany", { count: blockers.marks })}
                </li>
              )}
              {blockers.submissions > 0 && (
                <li>
                  {blockers.submissions === 1
                    ? t("people.blockerWorkOne")
                    : t("people.blockerWorkMany", { count: blockers.submissions })}
                </li>
              )}
              {blockers.reportCards > 0 && (
                <li>
                  {blockers.reportCards === 1
                    ? t("people.blockerCardsOne")
                    : t("people.blockerCardsMany", { count: blockers.reportCards })}
                </li>
              )}
              {blockers.records > 0 && (
                <li>
                  {blockers.records === 1
                    ? t("people.blockerRecordsOne")
                    : t("people.blockerRecordsMany", { count: blockers.records })}
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="danger"
          loading={pending}
          onClick={() => {
            setError(null);
            setBlockers(null);
            startTransition(async () => {
              const result = await removePerson(membershipId);
              if (!result.ok) {
                setError(actionError(t, result, "people.didNotWork"));
                setBlockers(result.blockers ?? null);
                return;
              }
              toast({
                tone: "ok",
                title: t("people.removed", { name }),
                description: t("people.removedBody"),
              });
              onClose();
              router.refresh();
            });
          }}
        >
          {t("people.removeThem")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setError(null);
            setBlockers(null);
            onClose();
          }}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
