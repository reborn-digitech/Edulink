"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { completeTwoFactor } from "./actions";

/** The six-digit box, and the way back when the step has died. */
export function CodeForm() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await completeTwoFactor({ code });
      if (!result.ok) {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
          return;
        }
        setErrors(result.errors);
        return;
      }
      toast({ tone: "ok", title: t("login.welcome") });
      router.push(result.redirectTo ?? "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {errors._form && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {errors._form}
        </p>
      )}
      <TextField
        label={t("totp.codeLabel")}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        autoFocus
        required
        placeholder="000000"
        maxLength={12}
        value={code}
        error={errors.code}
        onChange={(e) => setCode(e.target.value)}
        hint={t("totp.stepHint")}
      />
      <Button type="submit" block size="lg" loading={pending} disabled={code.trim().length < 6} icon={<ShieldCheckIcon weight="bold" />}>
        {t("totp.stepSubmit")}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-accent-strong underline underline-offset-4">
          {t("totp.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
