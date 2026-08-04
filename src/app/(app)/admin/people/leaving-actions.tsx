"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwiseIcon, SignOutIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { recordLeaving, undoLeaving } from "./actions";

const REASONS = [
  { value: "TRANSFERRED", label: "Transferred to another school" },
  { value: "GRADUATED", label: "Finished their schooling here" },
  { value: "LEFT", label: "Left, for another reason" },
] as const;

/**
 * Recording that a pupil has left, from the directory.
 *
 * A SEPARATE BUTTON FROM PAUSE, AND A DIFFERENT COLOUR, because they are
 * different facts and the recovery from confusing them is different. Pausing is
 * "not for now" and is undone in one click by anybody. Leaving issues a document
 * with the school's name on it, and while it is also undoable, a certificate
 * that briefly existed is a thing that may already have been shown to somebody.
 *
 * THE FORM SAYS WHAT THE FAMILY WILL GET, in the box, before the button is
 * pressed. Everything typed here ends up on a document a family hands to their
 * child's next school — and an admin who does not know that writes an internal
 * note in the note field.
 */
export function LeavingActions({
  membershipId,
  name,
  hasLeft,
}: {
  membershipId: string;
  name: string;
  hasLeft: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("TRANSFERRED");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [leftOn, setLeftOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (hasLeft) {
    return (
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        icon={<ArrowCounterClockwiseIcon weight="bold" />}
        onClick={() =>
          startTransition(async () => {
            const result = await undoLeaving(membershipId);
            if (!result.ok) {
              toast({ tone: "danger", title: "Not undone", description: result.error });
              return;
            }
            toast({
              tone: "ok",
              title: `${name} is back on the roll`,
              description: "Add them to a class again from the class page.",
            });
            router.refresh();
          })
        }
      >
        Undo leaving
      </Button>
    );
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        icon={<SignOutIcon weight="bold" />}
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Record that {name} has left</span>
        <span aria-hidden="true">Left</span>
      </Button>
    );
  }

  return (
    <div className="w-full rounded-[--radius-md] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">Record that {name} has left?</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">
        Their access to this school ends today and they come off every class roll. Nothing is
        deleted — their marks and attendance stay here. They and their family get a school record
        they can show to their next school, and you can undo this.
      </p>

      <label className="mt-3 block">
        <span className="block text-xs font-medium text-fg">Why</span>
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-[--radius-sm] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
        >
          {REASONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-2 flex flex-wrap gap-2">
        <label className="min-w-[10rem] flex-1">
          <span className="block text-xs font-medium text-fg">
            Where they went <span className="font-normal text-fg-muted">(optional)</span>
          </span>
          <input
            type="text"
            value={destination}
            maxLength={200}
            placeholder="Oakfield Academy"
            onChange={(event) => setDestination(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-[--radius-sm] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
        <label>
          <span className="block text-xs font-medium text-fg">Last day</span>
          <input
            type="date"
            value={leftOn}
            onChange={(event) => setLeftOn(event.target.value)}
            className="mt-1 min-h-11 rounded-[--radius-sm] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
      </div>

      <label className="mt-2 block">
        <span className="block text-xs font-medium text-fg">
          A line for their next school{" "}
          <span className="font-normal text-fg-muted">(optional — the family reads this)</span>
        </span>
        <textarea
          value={note}
          rows={2}
          maxLength={1000}
          onChange={(event) => setNote(event.target.value)}
          className="mt-1 w-full rounded-[--radius-sm] border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          loading={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await recordLeaving(membershipId, {
                reason,
                destination,
                note,
                leftOn,
              });
              if (!result.ok) {
                setError(result.error ?? "That did not work.");
                return;
              }
              setOpen(false);
              toast({
                tone: "ok",
                title: `${name} is recorded as having left`,
                description: "Their family has been told and can see the record.",
              });
              router.refresh();
            });
          }}
        >
          Record it
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
