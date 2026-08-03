"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EnvelopeSimpleIcon, LockKeyIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { login, completeLogin, requestMagicLink } from "./actions";
import { cn } from "@/lib/cn";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
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
      toast({ tone: "ok", title: "Welcome back" });
      router.push(result.redirectTo ?? "/");
      router.refresh();
    });
  }

  if (challenge) {
    return (
      <div className={cn("rounded-[--radius-lg] border border-border bg-surface p-6", className)}>
        <h2 className="font-semibold text-fg">Enter your code</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          Open your authenticator app and type the six-digit code. No recovery code to hand? Any of
          the ones you saved works here too.
        </p>
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
                  title: "Recovery code used",
                  description: `${result.remainingRecoveryCodes} left. Set two-factor up again to get a fresh set.`,
                });
              } else {
                toast({ tone: "ok", title: "Welcome back" });
              }
              router.push(result.redirectTo ?? "/");
              router.refresh();
            })
          }
        >
          Sign in
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
        <h2 className="font-semibold text-fg">Check your email</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          If an account exists for <strong className="text-fg">{email}</strong>, a sign-in link is
          on its way. It works once and expires in 20 minutes.
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => setMagicSent(false)}>
          Use a different email
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
        label={mode === "password" ? "Email or login name" : "Email"}
        // Not type="email": students log in with a handle like `amara.k4f9`,
        // and the browser's built-in email validation would block it.
        type={mode === "password" ? "text" : "email"}
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        autoFocus
        placeholder={mode === "password" ? "you@school.org or amara.k4f9" : "you@school.org"}
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
        hint={mode === "password" ? "Students: use the login name your school gave you." : undefined}
      />

      {mode === "password" && (
        <TextField
          label="Password"
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
        {mode === "password" ? "Log in" : "Email me a link"}
      </Button>

      <div className="relative py-1 text-center">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative bg-bg px-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">
          or
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
        {mode === "password" ? "Email me a sign-in link instead" : "Use my password instead"}
      </Button>
    </form>
  );
}
