"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removePerson } from "./actions";
import type { RemovalBlocker } from "@/lib/membership";

/**
 * Removing a pupil who was added by mistake.
 *
 * THE THIRD BUTTON, and the copy is most of the work — because the failure this
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
export function RemoveActions({
  membershipId,
  name,
}: {
  membershipId: string;
  name: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<RemovalBlocker | null>(null);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        icon={<TrashIcon weight="bold" />}
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Remove {name} from this school</span>
        <span aria-hidden="true">Remove</span>
      </Button>
    );
  }

  return (
    <div className="w-full rounded-[--radius-md] border border-danger/30 bg-danger-soft p-3">
      <p className="text-sm font-semibold text-fg">Remove {name} from this school?</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">
        For somebody added by mistake — a duplicate, a typo, the wrong school. Their row here and
        their place on every class roll are <strong className="text-fg">deleted</strong>, and this
        cannot be undone.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">
        <strong className="text-fg">Changed school instead?</strong> Use <em>Left</em>. That keeps
        everything and gives the family a school record to hand to their next school — this does
        neither.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">
        Their EduLink account is not touched. They may be a pupil somewhere else, or somebody&rsquo;s
        parent.
      </p>

      {error && (
        <div role="alert" className="mt-3 rounded-[--radius-sm] bg-surface p-2.5">
          <p className="text-xs font-semibold text-danger">{error}</p>
          {blockers && (
            <ul className="mt-1.5 space-y-0.5 text-xs text-fg-muted">
              {blockers.attendance > 0 && (
                <li>{blockers.attendance} day{blockers.attendance === 1 ? "" : "s"} on a register</li>
              )}
              {blockers.marks > 0 && (
                <li>{blockers.marks} mark{blockers.marks === 1 ? "" : "s"}</li>
              )}
              {blockers.submissions > 0 && (
                <li>
                  {blockers.submissions} piece{blockers.submissions === 1 ? "" : "s"} of work handed
                  in
                </li>
              )}
              {blockers.reportCards > 0 && (
                <li>
                  {blockers.reportCards} report card{blockers.reportCards === 1 ? "" : "s"}
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
                setError(result.error ?? "That did not work.");
                setBlockers(result.blockers ?? null);
                return;
              }
              setOpen(false);
              toast({
                tone: "ok",
                title: `${name} has been removed`,
                description: "Their account is untouched — only this school's row is gone.",
              });
              router.refresh();
            });
          }}
        >
          Remove them
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
            setBlockers(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
