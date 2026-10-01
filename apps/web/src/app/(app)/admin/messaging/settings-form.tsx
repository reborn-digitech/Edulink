"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { MESSAGE_EVENTS, type MessageEvent } from "@/lib/message-templates";
import type { MessagingSettings } from "@/lib/messaging";
import { EVENT_KEY } from "./labels";
import { saveMessagingSettingsAction } from "./actions";

/**
 * The school's channel switches, the monthly cap and the four event
 * switches — one row on the school, so one form saves them together.
 */
export function SettingsForm({ initial }: { initial: MessagingSettings }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<MessagingSettings>(initial);
  const [cap, setCap] = useState(String(initial.monthlyCap));
  const [error, setError] = useState<string | null>(null);
  const capNumber = Number(cap);
  const dirty = JSON.stringify({ ...values, monthlyCap: capNumber }) !== JSON.stringify(initial);
  const setEvent = (event: MessageEvent, on: boolean) => setValues((v) => ({ ...v, events: { ...v.events, [event]: on } }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!Number.isInteger(capNumber) || capNumber < 0 || capNumber > 1_000_000) return setError(t("messaging.refuseCap"));
    startTransition(async () => {
      const result = await saveMessagingSettingsAction({ ...values, monthlyCap: capNumber });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("messaging.settingsSaved") });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <CheckboxField label={t("messaging.smsToggle")} checked={values.smsEnabled} onChange={(e) => setValues((v) => ({ ...v, smsEnabled: e.target.checked }))} />
        <CheckboxField label={t("messaging.whatsappToggle")} checked={values.whatsappEnabled} onChange={(e) => setValues((v) => ({ ...v, whatsappEnabled: e.target.checked }))} />
      </div>

      <TextField label={t("messaging.monthlyCap")} hint={t("messaging.monthlyCapHint")} inputMode="numeric" type="number" min={0} max={1_000_000} step={1} value={cap} onChange={(e) => setCap(e.target.value)} className="sm:max-w-xs" />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-fg">{t("messaging.eventsTitle")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MESSAGE_EVENTS.map((event) => (
            <CheckboxField key={event} label={t(EVENT_KEY[event]!)} checked={values.events[event]} onChange={(e) => setEvent(event, e.target.checked)} />
          ))}
        </div>
      </fieldset>

      {/* The number the office typed: a wrong one on a record texts a stranger about the child, so the risk is on the switch itself. */}
      <CheckboxField
        label={t("officeBulk.textOfficePhonesToggle")}
        description={t("officeBulk.textOfficePhonesHint")}
        checked={values.textOfficePhones}
        onChange={(e) => setValues((v) => ({ ...v, textOfficePhones: e.target.checked }))}
      />

      <Button type="submit" loading={pending} disabled={!dirty} icon={<FloppyDiskIcon weight="bold" />}>
        {t("common.save")}
      </Button>
    </form>
  );
}
