"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckCircleIcon, CopyIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { confirmTotp, disableTotp, startTotp, type TotpStartState } from "./totp-actions";

/**
 * Two-step sign-in, for the office, the head and the operator (the page
 * shows this card to them alone). Off: one button starts it, the QR and the
 * key appear, one code from the app confirms it and the eight recovery
 * codes are shown this once. On: how many recovery codes are left, and a
 * code box that turns it off.
 */
export function TotpCard({ enabled, recoveryLeft, available, hasPassword = true }: { enabled: boolean; recoveryLeft: number; available: boolean; hasPassword?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [started, setStarted] = useState<Extract<TotpStartState, { ok: true }> | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offCode, setOffCode] = useState("");
  const [turningOff, setTurningOff] = useState(false);
  // Turning it on asks for the password first (QA-23); an account with none was asked to have signed in just now.
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function start(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setPasswordError(null);
    startTransition(async () => {
      const result = await startTotp(hasPassword ? password : undefined);
      if (!result.ok) {
        if (result.field === "password") setPasswordError(result.error);
        else setError(result.error);
        return;
      }
      setPassword("");
      setStarted(result);
    });
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmTotp(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRecoveryCodes(result.recoveryCodes);
      setStarted(null);
      setCode("");
      toast({ tone: "ok", title: t("totp.turnedOn") });
    });
  }

  function turnOff(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await disableTotp(offCode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTurningOff(false);
      setOffCode("");
      toast({ tone: "ok", title: t("totp.turnedOff") });
      router.refresh();
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ tone: "ok", title: t("totp.copied") });
    } catch {
      setError(t("account.didNotWork"));
    }
  }

  return (
    <Card>
      <CardHeader icon={<ShieldCheckIcon weight="duotone" className="size-5" />} title={t("totp.title")} description={t("totp.description")} />
      <CardBody className="space-y-4">
        {error && (
          <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {/* ---- the recovery codes, this once ---- */}
        {recoveryCodes && (
          <div className="space-y-3 rounded-[var(--radius-md)] border border-ok/30 bg-ok-soft p-4">
            <p className="text-sm font-semibold text-fg">{t("totp.recoveryTitle")}</p>
            <p className="text-sm leading-relaxed text-fg-muted">{t("totp.recoveryBody")}</p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm" data-testid="recovery-codes">
              {recoveryCodes.map((c) => (
                <li key={c} className="rounded bg-surface px-2 py-1 text-fg">
                  {c}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" icon={<CopyIcon weight="bold" />} onClick={() => void copy(recoveryCodes.join("\n"))}>
                {t("totp.copy")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setRecoveryCodes(null);
                  router.refresh();
                }}
              >
                {t("totp.recoveryDone")}
              </Button>
            </div>
          </div>
        )}

        {/* ---- on ---- */}
        {enabled && !recoveryCodes && (
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2.5 text-sm">
              <CheckCircleIcon weight="fill" className="size-4 shrink-0 text-ok" />
              <span className="font-medium text-fg">{t("totp.on")}</span>
              <span className="text-xs text-fg-muted">{t("totp.recoveryLeft", { count: recoveryLeft })}</span>
              {!turningOff && (
                <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => setTurningOff(true)}>
                  {t("totp.turnOff")}
                </Button>
              )}
            </p>
            {turningOff && (
              <form onSubmit={turnOff} className="space-y-3" noValidate>
                <TextField
                  label={t("totp.codeLabel")}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  placeholder="000000"
                  maxLength={12}
                  value={offCode}
                  onChange={(e) => setOffCode(e.target.value)}
                  hint={t("totp.turnOffBody")}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" size="sm" variant="danger" loading={pending} disabled={offCode.trim().length < 6}>
                    {t("totp.turnOff")}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => { setTurningOff(false); setOffCode(""); setError(null); }}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ---- off, not started ---- */}
        {!enabled && !started && !recoveryCodes && (
          <form onSubmit={start} className="space-y-3" noValidate>
            <p className="text-sm text-fg-muted">{available ? t("totp.off") : t("totp.unavailable")}</p>
            {available && hasPassword && (
              <TextField
                label={t("accountGuard.totpPasswordLabel")}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(null);
                }}
                error={passwordError ?? undefined}
                hint={t("accountGuard.totpPasswordHint")}
              />
            )}
            {available && !hasPassword && <p className="text-xs text-fg-muted">{t("accountGuard.totpFreshSignInHint")}</p>}
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={pending} disabled={!available || (hasPassword && password.length === 0)}>
                {t("totp.turnOn")}
              </Button>
            </div>
          </form>
        )}

        {/* ---- scanning ---- */}
        {!enabled && started && (
          <form onSubmit={confirm} className="space-y-4" noValidate>
            <p className="text-sm font-semibold text-fg">{t("totp.scanTitle")}</p>
            <p className="text-sm leading-relaxed text-fg-muted">{t("totp.scanBody")}</p>
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <svg viewBox={started.qr.viewBox} role="img" aria-label={t("totp.qrLabel")} className="size-44 shrink-0 rounded bg-white" shapeRendering="crispEdges" data-testid="totp-qr">
                <path d={started.qr.d} fill="#000" />
              </svg>
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{t("totp.secretLabel")}</p>
                <p className="flex flex-wrap items-center gap-2">
                  <code className="break-all rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-fg" data-testid="totp-secret">
                    {started.secret.match(/.{1,4}/g)?.join(" ")}
                  </code>
                  <Button type="button" size="sm" variant="ghost" icon={<CopyIcon weight="bold" />} aria-label={t("totp.copy") + ": " + t("totp.secretLabel")} onClick={() => void copy(started.secret)}>
                    {t("totp.copy")}
                  </Button>
                </p>
                <p className="text-xs text-fg-muted">{t("totp.accountShown", { account: started.account })}</p>
              </div>
            </div>
            <TextField
              label={t("totp.codeLabel")}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="000000"
              maxLength={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" loading={pending} disabled={code.trim().length < 6}>
                {t("totp.confirm")}
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => { setStarted(null); setCode(""); setError(null); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
