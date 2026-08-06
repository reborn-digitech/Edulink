"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { passwordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/cn";
import { signUpParent } from "../actions";
import { useT } from "@/lib/i18n";

export function ParentSignupForm({ className }: { className?: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consentSharing, setConsentSharing] = useState(false);
  const [consentNotifications, setConsentNotifications] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => passwordStrength(password, [name, email]), [password, name, email]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t("register.enterFullName");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = t("register.enterValidEmail");
    if (strength.problems.length > 0) next.password = strength.problems[0]!;
    if (!consentSharing) next.consentSharing = t("join.needConsent");
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    startTransition(async () => {
      const result = await signUpParent({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        consentSharing: true,
        consentNotifications,
      });

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      toast({ tone: "ok", title: t("join.accountCreated") });
      router.push(result.redirectTo ?? "/parent/link");
      router.refresh();
    });
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
        label={t("register.yourName")}
        required
        autoFocus
        autoComplete="name"
        placeholder={t("join.parentNamePlaceholder")}
        value={name}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
      />

      <TextField
        label={t("register.yourEmail")}
        required
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t("join.genericEmailPlaceholder")}
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div>
        <TextField
          label={t("register.password")}
          required
          type="password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          hint={t("join.passwordHintShort")}
        />
        {password.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i < strength.score
                      ? strength.score >= 3
                        ? "bg-ok"
                        : strength.score === 2
                          ? "bg-warn"
                          : "bg-danger"
                      : "bg-border",
                  )}
                />
              ))}
            </div>
            <p aria-live="polite" className="mt-1.5 text-xs font-medium text-fg-muted">
              {strength.label}
            </p>
          </div>
        )}
      </div>

      {/* Consent is recorded separately for sharing and for notifications, and
          both are timestamped on the guardianship row. (§6) */}
      <CheckboxField
        label={t("join.consentSharing")}
        description={t("join.consentSharingBody")}
        checked={consentSharing}
        error={errors.consentSharing}
        onChange={(e) => setConsentSharing(e.target.checked)}
      />

      <CheckboxField
        label={t("join.consentNotifications")}
        description={t("join.consentNotificationsBody")}
        checked={consentNotifications}
        onChange={(e) => setConsentNotifications(e.target.checked)}
      />

      <Button type="submit" block size="lg" loading={pending} iconRight={<ArrowRightIcon weight="bold" />}>
        {pending ? t("join.creatingAccount") : t("join.createAccountCta")}
      </Button>
    </form>
  );
}
