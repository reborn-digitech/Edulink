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
import { ROLE_META, type Role } from "@/lib/constants";
import { useT } from "@/lib/i18n";
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
  const t = useT();
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
          title={t("merge.nowOne")}
          description={t("merge.everythingBelowHere")}
        />
        <CardBody className="space-y-4">
          {/* Paired One/Many keys, whole sentences — the bold on the number
              went with the fragments, the way it did on the invitation page. */}
          <ul className="space-y-1.5 text-sm text-fg">
            <li className="rounded-[var(--radius-sm)] bg-surface-muted p-3">
              {counts.schools === 1
                ? t("merge.schoolsMovedOne")
                : t("merge.schoolsMovedMany", { count: counts.schools })}
            </li>
            {counts.certificates > 0 && (
              <li className="rounded-[var(--radius-sm)] bg-surface-muted p-3">
                {counts.certificates === 1
                  ? t("merge.recordsMovedOne")
                  : t("merge.recordsMovedMany", { count: counts.certificates })}
              </li>
            )}
            {counts.children > 0 && (
              <li className="rounded-[var(--radius-sm)] bg-surface-muted p-3">
                {counts.children === 1
                  ? t("merge.childrenMovedOne")
                  : t("merge.childrenMovedMany", { count: counts.children })}
              </li>
            )}
          </ul>
          <p className="text-sm leading-relaxed text-fg-muted">
            {/* The possessive is exactly what Hindi and Marathi restructure, so
                the named and unnamed cases are two whole sentences. */}
            {phase.name ? t("merge.doneNoteNamed", { name: phase.name }) : t("merge.doneNote")}
          </p>
          <Button asChild block>
            <Link href="/account">{t("merge.backToAccount")}</Link>
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
          title={t("merge.isRightAccount")}
          description={t("merge.nothingChangedYet")}
        />
        <CardBody className="space-y-5">
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-4">
            <p className="text-lg font-bold text-fg">{other.name}</p>
            <p className="mt-0.5 font-mono text-sm text-fg-muted">{other.loginName}</p>

            {other.schools.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {other.schools.map((school) => (
                  <li
                    key={school.schoolId}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-surface p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {school.schoolName}
                      </span>
                      {school.leftAt && (
                        <span className="block text-xs text-fg-muted">
                          {/* The date is a value and renders in English. */}
                          {t("merge.leftOn", { date: displayDate(school.leftAt) })}
                        </span>
                      )}
                    </span>
                    <Badge tone="accent" size="sm">
                      {/* The role TABLE, not `.toLowerCase()` — a role name is
                          a label, and labels toggle. */}
                      {t(ROLE_META[school.role as Role]?.labelKey ?? "role.student")}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">{t("merge.noSchools")}</p>
            )}

            {(other.certificates > 0 || other.children > 0) && (
              <p className="mt-3 text-sm text-fg-muted">
                {other.certificates > 0 &&
                  (other.certificates === 1
                    ? t("merge.recordsCountOne")
                    : t("merge.recordsCountMany", { count: other.certificates }))}
                {other.certificates > 0 && other.children > 0 && " · "}
                {other.children > 0 &&
                  (other.children === 1
                    ? t("merge.childrenLinkedOne")
                    : t("merge.childrenLinkedMany", { count: other.children }))}
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft p-4">
            <p className="text-sm font-semibold text-fg">{t("merge.cannotBeUndone")}</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              {/* Whole sentence with a placeholder; the mono styling on the
                  login went with the fragments. */}
              {t("merge.stopsSignIn", { login: other.loginName })}
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={submitJoin} loading={pending} disabled={pending}>
              {t("merge.yesJoin")}
            </Button>
            <Button variant="secondary" onClick={() => setPhase({ kind: "enter" })} disabled={pending}>
              {t("merge.noGoBack")}
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
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <TextField
        label={t("merge.otherLogin")}
        required
        autoFocus
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="none"
        placeholder="amara.k4f9"
        hint={t("merge.pupilLoginHint")}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />

      <TextField
        label={t("merge.thatPassword")}
        required
        type="password"
        autoComplete="off"
        placeholder="••••••••••"
        hint={t("merge.bothPasswordsHint")}
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
        {t("merge.findThatAccount")}
      </Button>
    </form>
  );
}
