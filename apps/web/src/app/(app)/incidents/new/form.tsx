"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { INCIDENT_KINDS, INCIDENT_SEVERITIES, type IncidentKind, type IncidentSeverity } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { INCIDENT_KIND_KEY, INCIDENT_SEVERITY_KEY } from "@/lib/incident-labels";
import { useT } from "@/lib/i18n";
import { recordIncidentAction } from "../actions";

/** A `datetime-local` value for an instant, in the browser's own zone — the zone the teacher is standing in. */
function localValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * The browser's clock to the minute, as an external store: blank on the
 * server, so the page hydrates without a mismatch, and the local minute in
 * the browser, ticking so the cap on "when" stays at now during a long form.
 */
const subscribeMinute = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};
const readMinute = () => localValue(new Date());
const readServerMinute = () => "";

/**
 * The incident form: what kind, how serious, when and where, one line for
 * the family to read first, what happened, what was done, and whether to
 * tell the family now. Written once — the record is never edited, so the
 * hints say so — and on success the page moves to the record with a toast
 * saying whether the family was told.
 */
export function IncidentForm({ studentMembershipId }: { studentMembershipId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<IncidentKind>("INJURY");
  const [severity, setSeverity] = useState<IncidentSeverity>("MINOR");
  // "" until the teacher touches the field, so it follows the clock until then.
  const [occurredAt, setOccurredAt] = useState("");
  const now = useSyncExternalStore(subscribeMinute, readMinute, readServerMinute);
  const [place, setPlace] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [notifyGuardians, setNotifyGuardians] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) return setError(t("common.checkTheForm"));
    const when = occurredAt ? new Date(occurredAt) : new Date();
    if (Number.isNaN(when.getTime())) return setError(t("common.checkTheForm"));
    if (when.getTime() > Date.now() + 5 * 60_000) return setError(t("incidents.refuseFuture"));
    startTransition(async () => {
      const result = await recordIncidentAction({
        studentMembershipId,
        kind,
        severity,
        occurredAt: when.toISOString(),
        place: place.trim(),
        title: title.trim(),
        body: body.trim(),
        actionTaken: actionTaken.trim(),
        notifyGuardians,
      });
      if (!result.ok || !result.id) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t(notifyGuardians ? "incidents.recorded" : "incidents.recordedQuiet") });
      router.push(`/incidents/${result.id}`);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="incident-form">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium text-fg">{t("incidents.kind")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {INCIDENT_KINDS.map((k) => (
            <label
              key={k}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-3.5 py-2 text-sm transition-colors hover:bg-surface-muted ${kind === k ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-fg"}`}
            >
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="size-4 accent-[var(--accent)]" />
              <span className="font-medium">{t(INCIDENT_KIND_KEY[k])}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t("incidents.severity")} value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}>
          {INCIDENT_SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {t(INCIDENT_SEVERITY_KEY[s])}
            </option>
          ))}
        </SelectField>
        <TextField label={t("incidents.occurredAt")} type="datetime-local" required value={occurredAt || now} max={now || undefined} onChange={(e) => setOccurredAt(e.target.value)} />
      </div>

      <TextField label={t("incidents.place")} hint={t("incidents.placeHint")} maxLength={80} autoComplete="off" value={place} onChange={(e) => setPlace(e.target.value)} />
      <TextField label={t("incidents.titleField")} hint={t("incidents.titleHint")} required maxLength={120} autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextAreaField label={t("incidents.body")} hint={t("incidents.bodyHint")} required rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
      <TextAreaField label={t("incidents.actionTaken")} hint={t("incidents.actionTakenHint")} rows={3} maxLength={2000} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />

      <CheckboxField label={t("incidents.notifyGuardians")} description={t("incidents.notifyGuardiansHint")} checked={notifyGuardians} onChange={(e) => setNotifyGuardians(e.target.checked)} />

      <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
        {t("incidents.save")}
      </Button>
    </form>
  );
}
