"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { FloppyDiskIcon, PencilSimpleIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { BLOOD_GROUPS, type HealthCardSave, type HealthCardView, type HealthContact } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDateKey, formatInZone } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import { recordHealthCheckAction, saveHealthCardAction } from "@/app/(app)/parent/health/actions";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * The pupil's health and emergency card, as the guardian's page and the
 * person page both draw it: a read-only summary, the edit form behind an
 * Edit button for those who may write (the office, the head, a guardian —
 * the server decides, `canEdit` only says what it decided), the check-ups
 * newest first, and the form the office records a check-up on. One file so
 * the two pages cannot drift apart on what a card looks like.
 */

type CardFields = NonNullable<HealthCardView["card"]>;

const EMPTY_CARD: HealthCardSave = {
  bloodGroup: null,
  allergies: "",
  conditions: "",
  medications: "",
  dietary: "",
  notes: "",
  doctorName: "",
  doctorPhone: "",
  contacts: [],
};

function toSave(card: CardFields | null): HealthCardSave {
  if (!card) return EMPTY_CARD;
  return {
    bloodGroup: card.bloodGroup,
    allergies: card.allergies,
    conditions: card.conditions,
    medications: card.medications,
    dietary: card.dietary,
    notes: card.notes,
    doctorName: card.doctorName,
    doctorPhone: card.doctorPhone,
    contacts: card.contacts.map((c) => ({ ...c })),
  };
}

/* -------------------------------------------------------------------------- */
/* Read-only                                                                   */
/* -------------------------------------------------------------------------- */

export function HealthCardSummary({ card, timezone }: { card: CardFields; timezone: string }) {
  const t = useT();
  const locale = useLocale();
  const none = <span className="text-fg-subtle">{t("health.none")}</span>;
  const line = (value: string) => (value ? <span className="whitespace-pre-wrap">{value}</span> : none);
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("health.bloodGroup"), value: card.bloodGroup ?? <span className="text-fg-subtle">{t("health.bloodGroupUnknown")}</span> },
    { label: t("health.allergies"), value: line(card.allergies) },
    { label: t("health.conditions"), value: line(card.conditions) },
    { label: t("health.medications"), value: line(card.medications) },
    { label: t("health.dietary"), value: line(card.dietary) },
    { label: t("health.notes"), value: line(card.notes) },
    {
      label: t("health.doctor"),
      value: card.doctorName || card.doctorPhone ? [card.doctorName, card.doctorPhone].filter(Boolean).join(" · ") : none,
    },
    {
      label: t("health.contacts"),
      value:
        card.contacts.length === 0 ? (
          none
        ) : (
          <ol className="list-decimal space-y-1 pl-5">
            {card.contacts.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{c.name}</span>
                {c.relation ? <span className="text-fg-muted"> · {c.relation}</span> : null}
                <span className="text-fg-muted"> · </span>
                <a href={`tel:${c.phone}`} className="underline underline-offset-2">
                  {c.phone}
                </a>
              </li>
            ))}
          </ol>
        ),
    },
  ];
  return (
    <div className="space-y-3">
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(9rem,auto)_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-fg-muted">{row.label}</dt>
            <dd className="text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-fg-subtle">
        {t("health.lastUpdated", {
          when: formatInZone(new Date(card.updatedAt), timezone, { day: "numeric", month: "short", year: "numeric" }, locale),
          by: card.updatedByName ? t("health.byName", { name: card.updatedByName }) : "",
        })}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Editor: the summary, and the form behind the Edit button                    */
/* -------------------------------------------------------------------------- */

export function HealthCardEditor({ view, timezone }: { view: HealthCardView; timezone: string }) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  // Why the last save was refused, kept here so it outlives the form drawn again below.
  const [notice, setNotice] = useState<string | null>(null);

  if (editing && view.canEdit) {
    // Keyed by the card it was drawn from (TA-111): when a save is refused because the card changed, the page
    // refreshes and the form is drawn again from the card as it now stands, so the next Save is based on what is shown.
    return (
      <HealthCardForm
        key={view.card?.updatedAt ?? "new"}
        view={view}
        notice={notice}
        onNotice={setNotice}
        onDone={() => {
          setNotice(null);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {view.card ? (
        <HealthCardSummary card={view.card} timezone={timezone} />
      ) : (
        <div className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface/60 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-fg">{t("health.noCardYet")}</p>
          <p className="mt-1 text-sm text-fg-muted">{view.canEdit ? t("health.noCardYetBody", { name: view.studentName }) : t("health.noCardStaffBody")}</p>
        </div>
      )}
      {view.canEdit && (
        <Button variant="secondary" size="sm" icon={<PencilSimpleIcon weight="bold" />} onClick={() => setEditing(true)}>
          {t("health.edit")}
        </Button>
      )}
    </div>
  );
}

type ContactDraft = HealthContact;

function HealthCardForm({ view, notice, onNotice, onDone }: { view: HealthCardView; notice: string | null; onNotice: (notice: string | null) => void; onDone: () => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<HealthCardSave>(() => toSave(view.card));
  const [error, setError] = useState<string | null>(notice);
  const [contactErrors, setContactErrors] = useState<Record<number, string>>({});

  const set = <K extends keyof HealthCardSave>(key: K, value: HealthCardSave[K]) => setValues((v) => ({ ...v, [key]: value }));
  const setContact = (index: number, patch: Partial<ContactDraft>) =>
    setValues((v) => ({ ...v, contacts: v.contacts.map((c, i) => (i === index ? { ...c, ...patch } : c)) }));
  const addContact = () => setValues((v) => (v.contacts.length >= 3 ? v : { ...v, contacts: [...v.contacts, { name: "", relation: "", phone: "" }] }));
  const removeContact = (index: number) => setValues((v) => ({ ...v, contacts: v.contacts.filter((_, i) => i !== index) }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    onNotice(null);
    // A person with a name needs a number and one with a number a name;
    // a row left wholly blank is simply not sent.
    const kept = values.contacts.filter((c) => c.name.trim() || c.phone.trim() || c.relation.trim());
    const errors: Record<number, string> = {};
    kept.forEach((c, i) => {
      if (!c.name.trim() || c.phone.trim().length < 6) errors[i] = t("common.checkTheForm");
    });
    setContactErrors(errors);
    if (Object.keys(errors).length > 0) {
      setValues((v) => ({ ...v, contacts: kept }));
      return;
    }
    // The card this form was drawn from (TA-111): a card changed since is refused and kept, and the page shows it.
    const input: HealthCardSave = { ...values, contacts: kept.map((c) => ({ name: c.name.trim(), relation: c.relation.trim(), phone: c.phone.trim() })), basedOn: view.card?.updatedAt ?? null };
    startTransition(async () => {
      const result = await saveHealthCardAction(view.studentMembershipId, input);
      if (!result.ok) {
        const message = actionError(t, result, "common.tryAgain");
        setError(message);
        if (result.errorKey === "health.cardChanged") {
          onNotice(message);
          router.refresh();
        }
        return;
      }
      toast({ tone: "ok", title: t("health.saved") });
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="health-card-form">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <SelectField label={t("health.bloodGroup")} value={values.bloodGroup ?? ""} onChange={(e) => set("bloodGroup", (e.target.value || null) as HealthCardSave["bloodGroup"])} className="sm:max-w-xs">
        <option value="">{t("health.bloodGroupUnknown")}</option>
        {BLOOD_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </SelectField>

      <TextAreaField label={t("health.allergies")} hint={t("health.allergiesHint")} rows={2} maxLength={500} value={values.allergies} onChange={(e) => set("allergies", e.target.value)} />
      <TextAreaField label={t("health.conditions")} hint={t("health.conditionsHint")} rows={2} maxLength={500} value={values.conditions} onChange={(e) => set("conditions", e.target.value)} />
      <TextAreaField label={t("health.medications")} hint={t("health.medicationsHint")} rows={2} maxLength={500} value={values.medications} onChange={(e) => set("medications", e.target.value)} />
      <TextAreaField label={t("health.dietary")} hint={t("health.dietaryHint")} rows={2} maxLength={500} value={values.dietary} onChange={(e) => set("dietary", e.target.value)} />
      <TextAreaField label={t("health.notes")} hint={t("health.notesHint")} rows={3} maxLength={500} value={values.notes} onChange={(e) => set("notes", e.target.value)} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-fg">{t("health.doctor")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={t("health.doctorName")} maxLength={80} autoComplete="off" value={values.doctorName} onChange={(e) => set("doctorName", e.target.value)} />
          <TextField label={t("health.doctorPhone")} type="tel" inputMode="tel" maxLength={20} autoComplete="off" value={values.doctorPhone} onChange={(e) => set("doctorPhone", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-fg">{t("health.contacts")}</legend>
        <p className="text-xs text-fg-muted">{t("health.contactsHint")}</p>
        {values.contacts.map((contact, index) => (
          <div key={index} className="rounded-[var(--radius-md)] border border-border p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label={t("health.contactName")} required maxLength={80} autoComplete="off" value={contact.name} error={contactErrors[index]} onChange={(e) => setContact(index, { name: e.target.value })} />
              <TextField label={t("health.contactRelation")} maxLength={40} autoComplete="off" value={contact.relation} onChange={(e) => setContact(index, { relation: e.target.value })} />
              <TextField label={t("health.contactPhone")} required type="tel" inputMode="tel" maxLength={20} autoComplete="off" value={contact.phone} onChange={(e) => setContact(index, { phone: e.target.value })} />
            </div>
            <Button type="button" variant="ghost" size="sm" className="mt-2" icon={<XIcon weight="bold" />} onClick={() => removeContact(index)}>
              {t("health.removeContact", { name: contact.name.trim() || String(index + 1) })}
            </Button>
          </div>
        ))}
        {values.contacts.length < 3 && (
          <Button type="button" variant="secondary" size="sm" icon={<PlusIcon weight="bold" />} onClick={addContact}>
            {t("health.addContact")}
          </Button>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
          {t("health.save")}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onDone}>
          {t("health.cancel")}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Check-ups                                                                   */
/* -------------------------------------------------------------------------- */

export function formatWeightKg(grams: number): string {
  return (grams / 1000).toFixed(1);
}

export function HealthChecksList({ checks }: { checks: HealthCardView["checks"] }) {
  const t = useT();
  const locale = useLocale();
  if (checks.length === 0) return <p className="text-sm text-fg-muted">{t("health.noChecks")}</p>;
  const dash = "—";
  return (
    <TableScroll>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase text-fg-muted">
            <th className="py-2 pr-3">{t("health.checkDate")}</th>
            <th className="py-2 pr-3">{t("health.heightCm")}</th>
            <th className="py-2 pr-3">{t("health.weightKg")}</th>
            <th className="py-2 pr-3">{t("health.vision")}</th>
            <th className="py-2">{t("health.checkNotes")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {checks.map((check) => (
            <tr key={check.id}>
              <td className="py-2 pr-3 whitespace-nowrap font-medium text-fg">{formatDateKey(check.dateKey, { day: "numeric", month: "short", year: "numeric" }, locale)}</td>
              <td className="py-2 pr-3 tabular-nums">{check.heightCm ?? dash}</td>
              <td className="py-2 pr-3 tabular-nums">{check.weightGrams === null ? dash : formatWeightKg(check.weightGrams)}</td>
              <td className="py-2 pr-3 whitespace-nowrap">
                {check.visionLeft || check.visionRight ? (
                  <>
                    <span className="text-fg-muted">{t("health.visionLeft")}</span> {check.visionLeft || dash}
                    <span className="text-fg-muted"> · {t("health.visionRight")}</span> {check.visionRight || dash}
                  </>
                ) : (
                  dash
                )}
              </td>
              <td className="py-2 whitespace-pre-wrap text-fg-muted">{check.notes || dash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

export function HealthCheckForm({ studentMembershipId, today }: { studentMembershipId: string; today: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [dateKey, setDateKey] = useState(today);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [visionLeft, setVisionLeft] = useState("");
  const [visionRight, setVisionRight] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDateKey(today);
    setHeight("");
    setWeight("");
    setVisionLeft("");
    setVisionRight("");
    setNotes("");
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const heightCm = height.trim() ? Math.round(Number(height)) : null;
    // Typed in kilograms to one decimal, kept in grams: 32.4 kg is 32400 g, and no float ever reaches the row.
    const weightGrams = weight.trim() ? Math.round(Number(weight) * 1000) : null;
    if ((heightCm !== null && !Number.isFinite(heightCm)) || (weightGrams !== null && !Number.isFinite(weightGrams))) return setError(t("common.checkTheForm"));
    if (heightCm === null && weightGrams === null && !visionLeft.trim() && !visionRight.trim() && !notes.trim()) return setError(t("health.checkNeedsSomething"));
    startTransition(async () => {
      const result = await recordHealthCheckAction(studentMembershipId, { dateKey, heightCm, weightGrams, visionLeft, visionRight, notes });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("health.checkSaved") });
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" icon={<PlusIcon weight="bold" />} onClick={() => setOpen(true)}>
        {t("health.recordCheck")}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-[var(--radius-md)] border border-border p-4" data-testid="health-check-form">
      <p className="text-sm font-semibold text-fg">{t("health.recordCheck")}</p>
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <DateField label={t("health.checkDate")} required value={dateKey} max={today} onChange={(e) => setDateKey(e.target.value)} />
        <TextField label={t("health.heightCm")} type="number" inputMode="numeric" min={30} max={250} step={1} value={height} onChange={(e) => setHeight(e.target.value)} />
        <TextField label={t("health.weightKg")} type="number" inputMode="decimal" min={1} max={300} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("health.visionLeft")} maxLength={20} autoComplete="off" placeholder="6/6" value={visionLeft} onChange={(e) => setVisionLeft(e.target.value)} />
        <TextField label={t("health.visionRight")} maxLength={20} autoComplete="off" placeholder="6/6" value={visionRight} onChange={(e) => setVisionRight(e.target.value)} />
      </div>
      <TextAreaField label={t("health.checkNotes")} rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
          {t("health.recordCheck")}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => {
            reset();
            setOpen(false);
          }}>
          {t("health.cancel")}
        </Button>
      </div>
    </form>
  );
}
