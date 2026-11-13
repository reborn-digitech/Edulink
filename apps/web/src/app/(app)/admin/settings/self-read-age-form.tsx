"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { saveSelfReadAge } from "./actions";

/**
 * One number: the age from which a pupil reads their own health card and
 * incident log. Blank is "never", which is every school's default; the
 * server holds the range and the audit row.
 */
export function SelfReadAgeForm({ initialAge }: { initialAge: number | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [age, setAge] = useState(initialAge === null ? "" : String(initialAge));
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveSelfReadAge({ age });
      if (!result.ok) {
        setError(result.error ?? t("common.tryAgain"));
        return;
      }
      const saved = result.selfReadAge ?? null;
      toast({ tone: "ok", title: saved === null ? t("familyCare.selfReadSavedOff") : t("familyCare.selfReadSaved", { age: saved }) });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3" data-testid="self-read-age-form">
      <TextField label={t("familyCare.selfReadLabel")} hint={t("familyCare.selfReadHint")} error={error ?? undefined} value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" maxLength={2} className="max-w-xs" />
      <Button type="submit" size="sm" loading={pending}>
        {t("common.save")}
      </Button>
    </form>
  );
}
