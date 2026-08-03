"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon, LockIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { offer, withdraw } from "./actions";

type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  note: string | null;
  bookedBy: string | null;
};

/**
 * Offering and withdrawing times.
 *
 * A BOOKED SLOT SHOWS A LOCK, NOT A DISABLED BIN. The difference matters: a
 * greyed-out delete says "you cannot do this", which is untrue — the expert can
 * free the time, by cancelling the booking, and needs to be told that rather
 * than left guessing.
 */
export function SlotManager({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");

  function act(work: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error ?? "Could not do that.");
        return;
      }
      setStart("");
      setEnd("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {slots.length === 0 && (
          <li className="text-sm text-fg-muted">You have not offered any times yet.</li>
        )}
        {slots.map((slot) => (
          <li
            key={slot.id}
            className="flex flex-wrap items-center gap-3 rounded-[--radius-md] border border-border p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">
                {new Date(slot.startsAt).toUTCString().slice(0, 22)} —{" "}
                {new Date(slot.endsAt).toUTCString().slice(17, 22)}
              </p>
              {slot.note && <p className="text-xs text-fg-muted">{slot.note}</p>}
            </div>
            {slot.bookedBy ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                <LockIcon weight="fill" className="size-3.5" />
                Booked by {slot.bookedBy}
              </span>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                loading={pending}
                aria-label="Withdraw this time"
                icon={<TrashIcon weight="bold" className="size-4" />}
                onClick={() => act(() => withdraw(slot.id))}
              />
            )}
          </li>
        ))}
      </ul>

      <div className="space-y-2 rounded-[--radius-md] border border-border bg-surface-muted p-3">
        <div className="flex flex-wrap gap-2">
          <label className="flex-1 text-xs text-fg-muted">
            Starts
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
            />
          </label>
          <label className="flex-1 text-xs text-fg-muted">
            Ends
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
            />
          </label>
        </div>
        <input
          type="text"
          value={note}
          placeholder="What this time is for (optional)"
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button
          size="sm"
          loading={pending}
          disabled={!start || !end}
          icon={<PlusIcon weight="bold" className="size-4" />}
          onClick={() => act(() => offer(new Date(start).toISOString(), new Date(end).toISOString(), note))}
        >
          Offer this time
        </Button>
      </div>
    </div>
  );
}
