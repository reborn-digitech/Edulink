"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { isoToDisplayDate } from "@/lib/dates";
import type { MergeCounts, OtherAccount } from "@/lib/account-merge";
import { check, join } from "./actions";

/**
 * Joining two accounts, in three screens.
 *
 * THE MIDDLE SCREEN IS THE FEATURE. This is the only action in the app that
 * ends an account, and the thing most likely to go wrong is not a bug — it is a
 * parent typing the login name of the wrong child, or of a sibling. So nothing
 * is written until the person has been shown a NAME, their SCHOOLS and their
 * DATES and has agreed that this is who they meant.
 *
 * The password lives in React state between the two steps and is submitted
 * again on confirm. Deliberately not a hidden input rendered by the server, and
 * deliberately not a token the first step hands out: the server re-verifies
 * from scratch, so a preview left open on a shared laptop is worth nothing.
 */

type Phase =
  | { kind: "enter" }
  | { kind: "confirm"; other: OtherAccount }
  | { kind: "done"; counts: MergeCounts; name: string };

function displayDate(value: Date | string | null): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  return isoToDisplayDate(iso.slice(0, 10));
}

export function MergeForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "enter" });

  function submitCheck(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await check({ identifier, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPhase({ kind: "confirm", other: result.other });
    });
  }

  function submitJoin() {
    setError(null);
    startTransition(async () => {
      const result = await join({ identifier, password });
      if (!result.ok) {
        setError(result.error);
        // Back to the form: whatever went wrong, the answer is to check the
        // credentials again, and the confirm screen has nothing left to offer.
        setPhase({ kind: "enter" });
        return;
      }
      const name = phase.kind === "confirm" ? phase.other.name : "";
      setPassword("");
      setPhase({ kind: "done", counts: result.counts, name });
      router.refresh();
    });
  }

  /* ------------------------------------------------------------------ done */

  if (phase.kind === "done") {
    const { counts } = phase;
    return (
      <Card className="border-ok/40">
        <CardHeader
          icon={<CheckCircleIcon weight="duotone" className="size-5 text-ok" />}
          title="Your accounts are now one"
          description="Everything below is on the account you are signed in to right now."
        />
        <CardBody className="space-y-4">
          <ul className="space-y-1.5 text-sm text-fg">
            <li className="rounded-[--radius-sm] bg-surface-muted p-3">
              <strong className="font-semibold">{counts.schools}</strong>{" "}
              {counts.schools === 1 ? "school" : "schools"} moved across, with every mark, register
              and report card that belonged to them.
            </li>
            {counts.certificates > 0 && (
              <li className="rounded-[--radius-sm] bg-surface-muted p-3">
                <strong className="font-semibold">{counts.certificates}</strong>{" "}
                {counts.certificates === 1 ? "school record" : "school records"} — your previous
                school, now on your profile.
              </li>
            )}
            {counts.children > 0 && (
              <li className="rounded-[--radius-sm] bg-surface-muted p-3">
                <strong className="font-semibold">{counts.children}</strong>{" "}
                {counts.children === 1 ? "child" : "children"} linked to you.
              </li>
            )}
          </ul>
          <p className="text-sm leading-relaxed text-fg-muted">
            The old login no longer works. Nothing was deleted — anything it had already written is
            still there, and still has {phase.name ? `${phase.name}’s` : "their"} name on it.
          </p>
          <Button asChild block>
            <Link href="/account">Back to your account</Link>
          </Button>
        </CardBody>
      </Card>
    );
  }

  /* --------------------------------------------------------------- confirm */

  if (phase.kind === "confirm") {
    const { other } = phase;
    return (
      <Card className="border-warn/40">
        <CardHeader
          icon={<WarningIcon weight="duotone" className="size-5 text-warn" />}
          title="Is this the right account?"
          description="Nothing has changed yet. Check the name and the schools before you go on."
        />
        <CardBody className="space-y-5">
          <div className="rounded-[--radius-md] border border-border bg-surface-muted p-4">
            <p className="text-lg font-bold text-fg">{other.name}</p>
            <p className="mt-0.5 font-mono text-sm text-fg-muted">{other.loginName}</p>

            {other.schools.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {other.schools.map((school) => (
                  <li
                    key={school.schoolId}
                    className="flex items-center justify-between gap-3 rounded-[--radius-sm] bg-surface p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {school.schoolName}
                      </span>
                      {school.leftAt && (
                        <span className="block text-xs text-fg-muted">
                          Left {displayDate(school.leftAt)}
                        </span>
                      )}
                    </span>
                    <Badge tone="accent" size="sm">
                      {school.role.toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">No schools on that account.</p>
            )}

            {(other.certificates > 0 || other.children > 0) && (
              <p className="mt-3 text-sm text-fg-muted">
                {other.certificates > 0 && (
                  <>
                    {other.certificates}{" "}
                    {other.certificates === 1 ? "school record" : "school records"}
                  </>
                )}
                {other.certificates > 0 && other.children > 0 && " · "}
                {other.children > 0 && (
                  <>
                    {other.children} {other.children === 1 ? "child" : "children"} linked
                  </>
                )}
              </p>
            )}
          </div>

          <div className="rounded-[--radius-md] border border-warn/30 bg-warn-soft p-4">
            <p className="text-sm font-semibold text-fg">This cannot be undone from here.</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              <span className="font-mono">{other.loginName}</span> will stop being a way to sign in.
              Nothing is deleted — everything above moves onto the account you are using now.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={submitJoin} loading={pending} disabled={pending}>
              Yes, join these accounts
            </Button>
            <Button variant="secondary" onClick={() => setPhase({ kind: "enter" })} disabled={pending}>
              No, go back
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  /* ----------------------------------------------------------------- enter */

  return (
    <form onSubmit={submitCheck} className="space-y-5" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <TextField
        label="The other account's login name or email"
        required
        autoFocus
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        placeholder="amara.k4f9"
        hint="A pupil's login name is not an email address — it looks like a name followed by four characters."
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />

      <TextField
        label="That account's password"
        required
        type="password"
        autoComplete="off"
        placeholder="••••••••••"
        hint="You have to be able to sign in to both accounts. Nobody else — not even your school — can do this for you."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        type="submit"
        loading={pending}
        disabled={pending || identifier.trim().length === 0 || password.length === 0}
        iconRight={<ArrowRightIcon weight="bold" className="size-4" />}
        block
      >
        Find that account
      </Button>
    </form>
  );
}
