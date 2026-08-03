"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { book } from "./actions";

/**
 * Booking a slot, with the topic asked for BEFORE the claim.
 *
 * The topic is what the expert sees first and is the only thing telling them
 * what the meeting is for, so it is required rather than optional — an expert
 * accepting a booking that says nothing has agreed to an unknown.
 */
export function BookButton({ slotId, expertName }: { slotId: string; expertName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Book
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <label className="block text-xs text-fg-muted">
        What would you like to discuss with {expertName}?
        <input
          type="text"
          autoFocus
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={pending}
          disabled={topic.trim().length < 3}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await book(slotId, topic);
              if (!result.ok) {
                setError(result.error ?? "Could not book that time.");
                return;
              }
              setOpen(false);
              router.refresh();
            })
          }
        >
          Confirm booking
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
