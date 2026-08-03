"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EnvelopeSimpleIcon, LockKeyIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { login, completeLogin, requestMagicLink } from "./actions";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [challenge, setChallenge] = useState<string | null>(null);
  const [secondFactor, setSecondFactor] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    startTransition(async () => {
      if (mode === "magic") {
        const result = await requestMagicLink({ email });
        if (!result.ok) {
          setErrors(result.errors);
          return;
        }
        // Deliberately unconditional: telling the user "no account with that
        // email" would let anyone test which addresses are registered.
        setMagicSent(true);
        return;
      }

      const result = await login({ email, password });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      // The password was right and there is still no session. What came back is
      // a challenge token, not a way in.
      if (result.needsSecondFactor && result.challenge) {
        setChallenge(result.challenge);
        setErrors({});
        return;
      }
      toast({ tone: "ok", title: t("login.welcome") });
      router.push(result.redirectTo ?? "/");
      router.refresh();
    });
  }

  if (challenge) {
    return (
      <div className={cn("rounded-[--radius-lg] border border-border bg-surface p-6", className)}>
        <h2 className="font-semibold text-fg">{t("login.codeTitle")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("login.codeHint")}</p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={secondFactor}
          onChange={(event) => setSecondFactor(event.target.value)}
          className="mt-4 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2.5 text-center font-mono text-lg tracking-widest text-fg"
        />
        {errors._form && <p className="mt-2 text-sm font-medium text-danger">{errors._form}</p>}
        <Button
          block
          className="mt-3"
          loading={pending}
          disabled={secondFactor.trim().length < 6}
          onClick={() =>
            startTransition(async () => {
              const result = await completeLogin(challenge, secondFactor);
              if (!result.ok) {
                setErrors(result.errors);
                return;
              }
              if (result.remainingRecoveryCodes !== undefined) {
                toast({
                  tone: "warn",
                  title: t("login.recoveryUsed"),
                  description: t("login.recoveryUsedHint", {
                    count: result.remainingRecoveryCodes,
                  }),
                });
              } else {
                toast({ tone: "ok", title: t("login.welcome") });
              }
              router.push(result.redirectTo ?? "/");
              router.refresh();
            })
          }
        >
          {t("login.signIn")}
        </Button>
      </div>
    );
  }

  if (magicSent) {
    return (
      <div className={cn("rounded-[--radius-lg] border border-border bg-surface p-6 text-center", className)}>
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-accent-soft text-accent-strong animate-pop">
          <PaperPlaneTiltIcon weight="duotone" className="size-7" />
        </div>
        <h2 className="font-semibold text-fg">{t("login.checkEmail")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          {t("login.magicSent", { email })}
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => setMagicSent(false)}>
          {t("login.useDifferentEmail")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label={mode === "password" ? t("login.emailOrLoginName") : t("login.emailLabel")}
        // Not type="email": students log in with a handle like `amara.k4f9`,
        // and the browser's built-in email validation would block it.
        type={mode === "password" ? "text" : "email"}
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        autoFocus
        placeholder={
          mode === "password" ? t("login.emailOrHandlePlaceholder") : t("login.emailPlaceholder")
        }
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
        hint={mode === "password" ? t("login.studentHint") : undefined}
      />

      {mode === "password" && (
        <TextField
          label={t("login.password")}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        icon={mode === "password" ? <LockKeyIcon weight="bold" /> : <PaperPlaneTiltIcon weight="bold" />}
      >
        {mode === "password" ? t("login.submit") : t("login.emailMeALink")}
      </Button>

      <div className="relative py-1 text-center">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative bg-bg px-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {t("login.or")}
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        block
        icon={mode === "password" ? <EnvelopeSimpleIcon weight="bold" /> : <LockKeyIcon weight="bold" />}
        onClick={() => {
          setMode((m) => (m === "password" ? "magic" : "password"));
          setErrors({});
        }}
      >
        {mode === "password" ? t("login.useMagicLink") : t("login.usePassword")}
      </Button>
    </form>
  );
}
