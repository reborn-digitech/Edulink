"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { saveFeeSettingsAction } from "./actions";

type Values = { upiId: string; upiPayee: string; receiptPrefix: string; bankNote: string };

/**
 * The UPI id, the receipt series and the bank note. Three cards on the page
 * but ONE row on the school, so one form saves all three: a UPI id typed
 * and a prefix changed in the same sitting go together.
 */
export function SettingsForms({ initial, yearName }: { initial: Values; yearName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Values>(initial);
  const [error, setError] = useState<string | null>(null);
  const dirty = values.upiId !== initial.upiId || values.upiPayee !== initial.upiPayee || values.receiptPrefix !== initial.receiptPrefix || values.bankNote !== initial.bankNote;
  const set = (key: keyof Values, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveFeeSettingsAction({ upiId: values.upiId.trim() || null, upiPayee: values.upiPayee.trim() || null, receiptPrefix: values.receiptPrefix.trim(), bankNote: values.bankNote.trim() || null });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.settingsSaved") });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-fg">{t("fees.upiTitle")}</h3>
        <p className="text-xs text-fg-muted">{t("fees.upiIntro")}</p>
        {!initial.upiId && <p className="text-xs text-warn">{t("fees.upiOff")}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("fees.upiId")} inputMode="email" autoComplete="off" value={values.upiId} onChange={(e) => set("upiId", e.target.value)} />
          <TextField label={t("fees.upiPayee")} maxLength={80} value={values.upiPayee} onChange={(e) => set("upiPayee", e.target.value)} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-fg">{t("fees.receiptTitle")}</h3>
        <TextField label={t("fees.receiptPrefix")} maxLength={12} value={values.receiptPrefix} hint={t("fees.receiptPrefixHint", { prefix: values.receiptPrefix.trim().toUpperCase() || "RCPT", year: yearName })} onChange={(e) => set("receiptPrefix", e.target.value.toUpperCase())} />
      </section>

      <section className="space-y-3">
        <TextAreaField label={t("fees.bankNote")} rows={3} maxLength={600} hint={t("fees.bankNoteHint")} value={values.bankNote} onChange={(e) => set("bankNote", e.target.value)} />
      </section>

      <Button type="submit" loading={pending} disabled={!dirty} icon={<FloppyDiskIcon weight="bold" />}>
        {t("common.save")}
      </Button>
    </form>
  );
}
