"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import { registerRecruiterAction } from "./actions";

/** The recruiter's sign-up: four fields, one button; the account is theirs and no college's (4 Oct 2026). */
export function RecruiterRegisterForm() {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "" });
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerRecruiterAction(form);
      if (!result.ok) {
        setError({ text: result.error ?? t("common.checkTheForm"), field: result.field });
        return;
      }
      router.push("/recruiter");
    });
  }

  const fieldError = (field: string) => (error?.field === field ? error.text : undefined);
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {error && !error.field && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error.text}
        </p>
      )}
      <TextField label={t("recruiter.fieldName")} required autoComplete="name" value={form.name} onChange={set("name")} error={fieldError("name")} maxLength={120} />
      <TextField label={t("recruiter.fieldCompany")} required autoComplete="organization" value={form.companyName} onChange={set("companyName")} error={fieldError("companyName")} hint={t("recruiter.fieldCompanyHint")} maxLength={160} />
      <TextField label={t("recruiter.fieldEmail")} required type="email" autoComplete="email" value={form.email} onChange={set("email")} error={fieldError("email")} maxLength={200} />
      <TextField label={t("recruiter.fieldPassword")} required type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={fieldError("password")} hint={t("recruiter.fieldPasswordHint")} maxLength={200} />
      <Button type="submit" variant="primary" loading={pending}>
        <BriefcaseIcon weight="bold" className="size-5" aria-hidden />
        {t("recruiter.registerButton")}
      </Button>
    </form>
  );
}
