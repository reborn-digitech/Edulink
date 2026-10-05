"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { completeFirstSignIn } from "./actions";
import { useT } from "@/lib/i18n";

export function FirstSignInForm({ className, initialHandle = "" }: { className?: string; initialHandle?: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [handle, setHandle] = useState(initialHandle);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await completeFirstSignIn({ handle, code, password });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      router.push(result.redirectTo ?? "/student");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className={cn("space-y-4", className)} noValidate data-testid="first-signin-form">
      {errors._form && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {errors._form}
        </p>
      )}
      <TextField
        label={t("firstSignin.handleField")}
        hint={t("firstSignin.handleHint")}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={handle}
        error={errors.handle}
        onChange={(e) => setHandle(e.target.value)}
        data-testid="first-signin-handle"
      />
      <TextField
        label={t("firstSignin.codeField")}
        hint={t("firstSignin.codeHint")}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        required
        value={code}
        error={errors.code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        data-testid="first-signin-code"
      />
      <TextField
        label={t("firstSignin.passwordField")}
        hint={t("firstSignin.passwordHint")}
        type="password"
        autoComplete="new-password"
        required
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="first-signin-password"
      />
      <Button type="submit" block size="lg" loading={pending} icon={<KeyIcon weight="bold" />}>
        {pending ? t("firstSignin.signingIn") : t("firstSignin.submit")}
      </Button>
    </form>
  );
}
