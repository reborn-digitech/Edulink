"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

/**
 * The accept form.
 *
 * Deliberately NOT wired to account creation in this commit — see the note the
 * page returns. Collecting a headline is the part that belongs to Prerna; the
 * password and session belong to the existing registration flow, and joining
 * them together badly is worse than saying so.
 */
export function AcceptForm({
  token,
  suggestedName,
  suggestedEmail,
}: {
  token: string;
  suggestedName: string | null;
  suggestedEmail: string | null;
}) {
  const [pending] = useTransition();
  const [headline, setHeadline] = useState("");

  return (
    <form className="mt-6 space-y-3">
      <label className="block text-sm text-fg-muted">
        Your name
        <input
          type="text"
          defaultValue={suggestedName ?? ""}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        Email
        <input
          type="email"
          defaultValue={suggestedEmail ?? ""}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        What you do, in a line
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Careers adviser, 12 years in engineering"
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <input type="hidden" name="token" value={token} />
      <Button type="submit" block disabled loading={pending}>
        Create my expert account
      </Button>
      <p className="text-xs text-fg-muted">
        Account creation from this link is not wired up yet — the invitation, the profile and the
        expert area all work, but signing up still goes through the ordinary registration flow.
      </p>
    </form>
  );
}
