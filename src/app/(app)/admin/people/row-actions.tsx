"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PauseCircleIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { suspend, reinstate } from "./actions";

/**
 * Pause and restore, per person, from the directory.
 *
 * PAUSING ASKS FOR A REASON AND WILL NOT PROCEED WITHOUT ONE. This is the only
 * destructive-feeling action in the directory, it is the one somebody will be
 * asked to justify months later, and a free-text box at the moment of the
 * decision is the only time anybody actually remembers why. The server enforces
 * it too — this is the prompt, not the check.
 *
 * The word on screen is "pause", not "suspend" or "remove". It is accurate —
 * nothing is deleted and it is reversible in one click — and it does not read
 * as a punishment handed down, which matters when the subject is a child.
 */
export function RowActions({
  membershipId,
  name,
  suspended,
}: {
  membershipId: string;
  name: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function doSuspend() {
    setError(null);
    startTransition(async () => {
      const result = await suspend(membershipId, reason);
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      setOpen(false);
      setReason("");
      toast({ tone: "ok", title: `${name}'s access is paused` });
      router.refresh();
    });
  }

  function doReinstate() {
    startTransition(async () => {
      const result = await reinstate(membershipId);
      if (!result.ok) {
        toast({ tone: "danger", title: "Not restored", description: result.error });
        return;
      }
      toast({ tone: "ok", title: `${name} can sign in again` });
      router.refresh();
    });
  }

  if (suspended) {
    return (
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        icon={<ArrowCounterClockwiseIcon weight="bold" />}
        onClick={doReinstate}
      >
        Restore
      </Button>
    );
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        icon={<PauseCircleIcon weight="bold" />}
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Pause access for {name}</span>
        <span aria-hidden="true">Pause</span>
      </Button>
    );
  }

  return (
    <div className="w-full rounded-[--radius-md] border border-warn/30 bg-warn-soft p-3">
      <p className="text-sm font-semibold text-fg">Pause {name}&rsquo;s access?</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">
        They will not be able to open this school until you restore it. Nothing is deleted, and
        this does not affect any other school they belong to.
      </p>

      <label className="mt-3 block">
        <span className="block text-xs font-medium text-fg">Why (kept in the audit log)</span>
        <textarea
          value={reason}
          autoFocus
          rows={2}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 w-full rounded-[--radius-sm] border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="danger" loading={pending} onClick={doSuspend}>
          Pause access
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
