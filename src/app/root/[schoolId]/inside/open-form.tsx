"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyOpenIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { open } from "./actions";

/**
 * The door, and the reason it needs.
 *
 * THE FORM IS THE FEATURE. Anybody could have written a button that binds a
 * school; what makes this defensible is that it costs a sentence, that the
 * sentence is shown to the school, and that saying so here — before the door
 * opens, in the place somebody is standing — is different from saying it in a
 * privacy policy.
 */
export function OpenForm({ schoolId, minutes }: { schoolId: string; minutes: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-[--radius-md] border border-warn/30 bg-warn-soft p-4">
        <p className="text-sm font-semibold text-fg">This school will be told.</p>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          Opening writes a line into <strong className="text-fg">their</strong> Safety Centre with
          your name, the time and the reason below — and so does everything you do while you are
          in. It closes itself after {minutes} minutes.
        </p>
      </div>

      <TextAreaField
        label="Why are you opening this school?"
        required
        rows={3}
        value={reason}
        error={error ?? undefined}
        onChange={(e) => setReason(e.target.value)}
        hint="A sentence. The school reads this, so write it for them."
        placeholder="Investigating a safeguarding report about a post on the global feed."
      />

      <Button
        icon={<LockKeyOpenIcon weight="bold" />}
        loading={pending}
        disabled={pending || reason.trim().length < 10}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await open(schoolId, reason);
            if (!result.ok) {
              setError(result.error ?? "That did not work.");
              return;
            }
            router.refresh();
          });
        }}
      >
        Open this school
      </Button>
    </div>
  );
}
