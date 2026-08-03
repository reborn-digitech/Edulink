"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon, WarningIcon, CopyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { start, confirm, turnOff } from "./two-factor-actions";

/**
 * Two-factor, from the account page.
 *
 * THE RECOVERY CODES ARE SHOWN BEFORE THERE IS A WAY PAST THEM. They exist in
 * plaintext exactly once, in the response that turns 2FA on, and only their
 * hashes are stored — so the screen that shows them has no "skip", and says
 * plainly that they cannot be shown again. A person who clicks past this and
 * later changes phone has lost the account.
 */
export function TwoFactor({
  enabled,
  hasPassword,
  remaining,
}: {
  enabled: boolean;
  hasPassword: boolean;
  remaining: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [password, setPassword] = useState("");
  const [confirmingOff, setConfirmingOff] = useState(false);

  /* ---------------- the one-time recovery codes ---------------- */
  if (codes) {
    return (
      <Card className="border-ok/40">
        <CardHeader
          title="Two-factor is on. Save these now."
          description="Each code works once, if you ever lose your phone. They cannot be shown again."
          icon={<ShieldCheckIcon weight="duotone" className="size-5 text-ok" />}
        />
        <CardBody className="space-y-3">
          <ul className="grid grid-cols-2 gap-2 rounded-[--radius-md] border border-border bg-surface-muted p-3 font-mono text-sm">
            {codes.map((c) => (
              <li key={c} className="tabular-nums text-fg">{c}</li>
            ))}
          </ul>
          <Button
            variant="secondary"
            size="sm"
            icon={<CopyIcon weight="bold" className="size-4" />}
            onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}
          >
            Copy all
          </Button>
          <p className="text-xs text-fg-muted">
            Keep them somewhere that is not your phone — a password manager, or on paper.
          </p>
          <Button
            block
            onClick={() => {
              setCodes(null);
              router.refresh();
            }}
          >
            I have saved them
          </Button>
        </CardBody>
      </Card>
    );
  }

  /* ---------------- enrolling ---------------- */
  if (secret) {
    return (
      <Card>
        <CardHeader
          title="Scan this in your authenticator app"
          description="Google Authenticator, 1Password, Authy — any of them."
          icon={<ShieldCheckIcon weight="duotone" className="size-5" />}
        />
        <CardBody className="space-y-3">
          <p className="text-sm text-fg-muted">
            Can&apos;t scan? Type this key in instead:
          </p>
          <code className="block break-all rounded-[--radius-md] border border-border bg-surface-muted p-3 font-mono text-sm text-fg">
            {secret}
          </code>
          {uri && (
            <a href={uri} className="text-xs text-accent-strong underline underline-offset-2">
              Open in an app on this device
            </a>
          )}
          <label className="block text-sm text-fg-muted">
            Then enter the six-digit code it shows
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 font-mono text-lg tracking-widest text-fg"
            />
          </label>
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              loading={pending}
              disabled={code.replace(/\s/g, "").length !== 6}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await confirm(code);
                  if (!result.ok || !result.recoveryCodes) {
                    setError(result.error ?? "That code is not right.");
                    return;
                  }
                  setSecret(null);
                  setCode("");
                  setCodes(result.recoveryCodes);
                })
              }
            >
              Turn on two-factor
            </Button>
            <Button variant="ghost" onClick={() => { setSecret(null); setCode(""); setError(null); }}>
              Cancel
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  /* ---------------- the resting states ---------------- */
  return (
    <Card>
      <CardHeader
        title="Two-factor authentication"
        description="A code from your phone, on top of your password."
        icon={<ShieldCheckIcon weight="duotone" className="size-5" />}
      />
      <CardBody className="space-y-3">
        {enabled ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="ok" size="sm">On</Badge>
              <span className="text-sm text-fg-muted">
                {remaining} recovery {remaining === 1 ? "code" : "codes"} left
              </span>
            </div>
            {remaining <= 2 && (
              <p className="flex items-start gap-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft/40 p-3 text-xs text-fg">
                <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-warn" />
                <span>
                  You are nearly out of recovery codes. Turn two-factor off and on again to get a
                  fresh set.
                </span>
              </p>
            )}

            {confirmingOff ? (
              <div className="space-y-2 rounded-[--radius-md] border border-danger/40 bg-danger-soft/30 p-3.5">
                <p className="text-sm font-medium text-fg">
                  Enter your password to turn two-factor off.
                </p>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
                />
                {error && <p className="text-sm font-medium text-danger">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={pending}
                    disabled={!password}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const result = await turnOff(password);
                        if (!result.ok) {
                          setError(result.error ?? "Could not turn it off.");
                          return;
                        }
                        setPassword("");
                        setConfirmingOff(false);
                        router.refresh();
                      })
                    }
                  >
                    Turn it off
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingOff(false)}>
                    Keep it on
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmingOff(true)}>
                Turn off two-factor
              </Button>
            )}
          </>
        ) : !hasPassword ? (
          <p className="text-sm text-fg-muted">
            This account signs in with a link rather than a password, so there is nothing yet for a
            second factor to sit on top of.
          </p>
        ) : (
          <>
            <p className="text-sm text-fg-muted">
              If somebody learns your password, they still cannot sign in without your phone.
            </p>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await start();
                  if (!result.ok || !result.secret) {
                    setError(result.error ?? "Could not start.");
                    return;
                  }
                  setSecret(result.secret);
                  setUri(result.uri ?? null);
                })
              }
            >
              Set up two-factor
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
