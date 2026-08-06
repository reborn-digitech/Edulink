"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "./actions";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";

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
  const t = useT();
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
        {t("expert.yourName")}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        {t("expert.email")}
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        {t("expert.choosePassword")}
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
      </label>
      <label className="block text-sm text-fg-muted">
        {t("expert.whatYouDo")}
        <input
          type="text"
          value={headline}
          placeholder={t("expert.whatYouDoPlaceholder")}
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
            if (result && !result.ok) setError(actionError(t, result, "expert.couldNotCreate"));
          })
        }
      >
        {t("expert.createAccount")}
      </Button>
      <p className="text-xs text-fg-muted">{t("expert.reviewedNote")}</p>
    </div>
  );
}
