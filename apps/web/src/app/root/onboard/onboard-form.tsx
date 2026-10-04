"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RocketLaunchIcon } from "@phosphor-icons/react";
import { INSTITUTION_KINDS, isCollegeKind, SCHOOL_BOARDS, type InstitutionKind, type OperatorOnboardBody, type StreamCode } from "@edulink/contracts";
import { StreamPicker } from "@/components/college/stream-picker";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { CheckboxField, DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { LocationFields } from "@/components/location-fields";
import { useToast } from "@/components/ui/toast";
import { INDIA } from "@/lib/places";
import { onboardSchoolAction } from "../actions";
import { useT } from "@/lib/i18n";

type PlanOption = { id: string; code: string; name: string };
type PartnerOption = { id: string; name: string; percentTenths: number };
type CommissionMode = "none" | "existing" | "new";

const DAY_MS = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const plusDays = (key: string, days: number) => dayKey(new Date(new Date(`${key}T00:00:00.000Z`).getTime() + days * DAY_MS));

/**
 * The guided flow, one form: the school, its plan and subscription, who
 * to call there, the partner if there is one, and the first
 * administrator. The dates follow the trial box — today and thirty days,
 * or today and a year — until the operator types their own. The percent
 * is typed as a percentage with one decimal and sent as tenths, the
 * integer the row holds. Every refusal is the server's own sentence,
 * shown above the button; nothing is created until everything passes.
 */
export function OnboardForm({ plans, partners }: { plans: PlanOption[]; partners: PartnerOption[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = dayKey(new Date());

  const [school, setSchool] = useState({ name: "", slug: "", contactEmail: "", timezone: "Asia/Kolkata", board: "", city: "", region: "", country: INDIA, gradeLow: "", gradeHigh: "", kind: "SCHOOL", university: "", aishe: "" });
  // A college's streams (5 Oct 2026), chosen beside the kind.
  const [streams, setStreams] = useState<StreamCode[]>([]);
  const [planId, setPlanId] = useState("");
  const [trial, setTrial] = useState(false);
  const [datesTyped, setDatesTyped] = useState(false);
  const [dates, setDates] = useState({ startsAt: today, dueAt: plusDays(today, 365) });
  const [contact, setContact] = useState({ name: "", role: "", phone: "", email: "" });
  const [mode, setMode] = useState<CommissionMode>(partners.length ? "existing" : "none");
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? "");
  const [newPartner, setNewPartner] = useState({ name: "", percent: "", phone: "", email: "", notes: "" });
  const [admin, setAdmin] = useState({ email: "", name: "" });

  const setS = (key: keyof typeof school) => (value: string) => setSchool((f) => ({ ...f, [key]: value }));
  const setC = (key: keyof typeof contact) => (value: string) => setContact((f) => ({ ...f, [key]: value }));
  const setP = (key: keyof typeof newPartner) => (value: string) => setNewPartner((f) => ({ ...f, [key]: value }));

  function toggleTrial(next: boolean) {
    setTrial(next);
    if (!datesTyped) setDates((d) => ({ startsAt: d.startsAt, dueAt: plusDays(d.startsAt, next ? 30 : 365) }));
  }
  function setDate(key: "startsAt" | "dueAt", value: string) {
    setDatesTyped(true);
    setDates((d) => ({ ...d, [key]: value }));
  }

  const percentTenths = Math.round(Number(newPartner.percent || "0") * 10);
  const ready = school.name.trim().length >= 2 && school.contactEmail.trim() && school.timezone.trim() && admin.email.trim() && dates.startsAt && dates.dueAt && (mode !== "new" || (newPartner.name.trim() && newPartner.percent.trim())) && (!isCollegeKind(school.kind) || streams.length > 0);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const body: OperatorOnboardBody = {
      name: school.name,
      slug: school.slug.trim() || undefined,
      contactEmail: school.contactEmail,
      timezone: school.timezone,
      board: (school.board || null) as OperatorOnboardBody["board"],
      city: school.city || null,
      region: school.region || null,
      country: school.country || null,
      gradeLow: school.gradeLow || null,
      gradeHigh: school.gradeHigh || null,
      kind: school.kind as InstitutionKind,
      // A college's two references (4 Oct 2026), sent only for a college.
      ...(isCollegeKind(school.kind) ? { affiliatingUniversity: school.university.trim() || null, aisheCode: school.aishe.trim().toUpperCase() || null, streams } : {}),
      planId: planId || null,
      trial,
      startsAt: dates.startsAt,
      dueAt: dates.dueAt,
      contact: { name: contact.name || null, role: contact.role || null, phone: contact.phone || null, email: contact.email || null },
      commission: mode === "none" ? null : mode === "existing" ? { partnerId } : { newPartner: { name: newPartner.name, percentTenths, phone: newPartner.phone || null, email: newPartner.email || null, notes: newPartner.notes } },
      adminEmail: admin.email,
      adminName: admin.name.trim() || undefined,
    };
    startTransition(async () => {
      const result = await onboardSchoolAction(body);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.onboardDone", { name: school.name }), description: t("root.joinCodeIs", { code: result.code ?? "" }) });
      router.push(`/root/${result.schoolId}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.theSchool")}</legend>
        <TextField label={t("root.name")} required value={school.name} onChange={(e) => setS("name")(e.target.value)} hint={t("root.nameHint")} maxLength={200} />
        {/* A school, a junior college, a college or an autonomous college (4 Oct 2026): a college is offered the college modules and roles. */}
        <SelectField label={t("institution.kindLabel")} value={school.kind} onChange={(e) => setS("kind")(e.target.value)} hint={t("institution.kindHint")}>
          {INSTITUTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`institution.kind.${k}`)}
            </option>
          ))}
        </SelectField>
        {/* The streams (5 Oct 2026), beside affiliated or autonomous: the college's modules, regulators and duties follow them. */}
        {isCollegeKind(school.kind) && <StreamPicker value={streams} onChange={setStreams} />}
        {isCollegeKind(school.kind) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t("college.fieldUniversity")} value={school.university} onChange={(e) => setS("university")(e.target.value)} maxLength={200} />
            <TextField label={t("college.fieldAishe")} value={school.aishe} onChange={(e) => setS("aishe")(e.target.value)} hint={t("college.fieldAisheHint")} maxLength={12} autoCapitalize="characters" />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("root.slug")} value={school.slug} onChange={(e) => setS("slug")(e.target.value)} hint={t("root.slugHint")} maxLength={48} autoCapitalize="none" />
          <TextField label={t("root.contactEmail")} type="email" required value={school.contactEmail} onChange={(e) => setS("contactEmail")(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("root.timezone")} required value={school.timezone} onChange={(e) => setS("timezone")(e.target.value)} hint={t("root.timezoneHint")} />
          <SelectField label={t("root.board")} value={school.board} onChange={(e) => setS("board")(e.target.value)}>
            <option value="">{t("root.boardNone")}</option>
            {SCHOOL_BOARDS.map((b) => (
              <option key={b} value={b}>
                {t(`filings.board${b}` as TranslationKey)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("root.lowestGrade")} value={school.gradeLow} placeholder="3" onChange={(e) => setS("gradeLow")(e.target.value)} />
          <TextField label={t("root.highestGrade")} value={school.gradeHigh} placeholder="10" onChange={(e) => setS("gradeHigh")(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("root.city")} value={school.city} onChange={(e) => setS("city")(e.target.value)} />
          <LocationFields country={school.country} region={school.region} onCountryChange={setS("country")} onRegionChange={setS("region")} countryLabel={t("root.country")} regionLabel={t("root.stateRegion")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.subscriptionTitle")}</legend>
        <p className="text-xs leading-relaxed text-fg-muted">{t("root.subscriptionDefaults")}</p>
        <SelectField label={t("root.planTitle")} value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">{t("root.planNone")}</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </SelectField>
        <CheckboxField label={t("root.trialOption")} description={t("root.trialHint")} checked={trial} onChange={(e) => toggleTrial(e.target.checked)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField label={t("root.subscriptionStarts")} required value={dates.startsAt} onChange={(e) => setDate("startsAt", e.target.value)} />
          <DateField label={t("root.subscriptionDue")} required value={dates.dueAt} onChange={(e) => setDate("dueAt", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.contactTitle")}</legend>
        <p className="text-xs leading-relaxed text-fg-muted">{t("root.contactExplainer")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("root.contactName")} value={contact.name} onChange={(e) => setC("name")(e.target.value)} maxLength={120} />
          <TextField label={t("root.contactRole")} value={contact.role} onChange={(e) => setC("role")(e.target.value)} maxLength={80} />
          <TextField label={t("root.contactPhone")} type="tel" value={contact.phone} onChange={(e) => setC("phone")(e.target.value)} maxLength={40} />
          <TextField label={t("root.pocEmail")} type="email" value={contact.email} onChange={(e) => setC("email")(e.target.value)} maxLength={320} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.commissionTitle")}</legend>
        <SelectField label={t("root.commissionPartner")} value={mode} onChange={(e) => setMode(e.target.value as CommissionMode)}>
          <option value="none">{t("root.commissionNoneOption")}</option>
          {partners.length > 0 && <option value="existing">{t("root.commissionPickPartner")}</option>}
          <option value="new">{t("root.commissionNewPartner")}</option>
        </SelectField>
        {mode === "existing" && (
          <SelectField label={t("root.partners")} value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {(p.percentTenths / 10).toLocaleString()}%
              </option>
            ))}
          </SelectField>
        )}
        {mode === "new" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t("root.partnerName")} required value={newPartner.name} onChange={(e) => setP("name")(e.target.value)} maxLength={120} />
            <TextField label={t("root.commissionPercent")} required hint={t("root.commissionPercentHint")} inputMode="decimal" value={newPartner.percent} onChange={(e) => setP("percent")(e.target.value)} />
            <TextField label={t("root.partnerPhone")} type="tel" value={newPartner.phone} onChange={(e) => setP("phone")(e.target.value)} maxLength={40} />
            <TextField label={t("root.partnerEmail")} type="email" value={newPartner.email} onChange={(e) => setP("email")(e.target.value)} maxLength={320} />
            <div className="sm:col-span-2">
              <TextAreaField label={t("root.partnerNotes")} value={newPartner.notes} onChange={(e) => setP("notes")(e.target.value)} rows={2} maxLength={2000} />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.firstAdmin")}</legend>
        <p className="text-xs leading-relaxed text-fg-muted">{t("root.firstAdminHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("root.firstAdminEmail")} type="email" required value={admin.email} onChange={(e) => setAdmin((a) => ({ ...a, email: e.target.value }))} maxLength={320} />
          <TextField label={t("root.firstAdminName")} value={admin.name} onChange={(e) => setAdmin((a) => ({ ...a, name: e.target.value }))} maxLength={120} />
        </div>
      </fieldset>

      <Button type="submit" loading={pending} disabled={!ready} icon={<RocketLaunchIcon weight="bold" />}>
        {t("root.onboardCta")}
      </Button>
    </form>
  );
}
