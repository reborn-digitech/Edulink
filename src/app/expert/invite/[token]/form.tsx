"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "./actions";

/**
 * The accept form.
 *
 * It says the profile is reviewed BEFORE the button is pressed, not after.
 * Somebody signing up and then finding they are invisible to every school will
 * assume it is broken; told first, it reads as the curation it is.
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(suggestedName ?? "");
  const [email, setEmail] = useState(suggestedEmail ?? "");
  const [password, setPassword] = useState("");
  const [headline, setHeadline] = useState("");

  const ready =
    name.trim().length >= 2 && email.includes("@") && password.length > 0 && headline.trim().length >= 3;

  return (
    <div className="mt-6 space-y-3">
      <label className="block text-sm text-fg-muted">
        Your name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        Email
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        Choose a password
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        What you do, in a line
        <input
          type="text"
          value={headline}
          placeholder="Careers adviser, 12 years in engineering"
          onChange={(e) => setHeadline(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <Button
        block
        loading={pending}
        disabled={!ready}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await acceptInvite(token, { name, email, password, headline });
            if (result && !result.ok) setError(result.error ?? "Could not create the account.");
          })
        }
      >
        Create my expert account
      </Button>
      <p className="text-xs text-fg-muted">
        Your profile is reviewed before any school can see or book you. You will not need to do
        anything else.
      </p>
    </div>
  );
}
