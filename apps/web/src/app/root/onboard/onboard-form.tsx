"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import { RocketLaunchIcon } from "@phosphor-icons/react";
import { INSTITUTION_KINDS, isCollegeKind, SCHOOL_BOARDS, type InstitutionKind, type OperatorOnboardBody, type StreamCode } from "@edulink/contracts";
import { StreamPicker } from "@/components/college/stream-picker";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { LocationFields } from "@/components/location-fields";
import { useToast } from "@/components/ui/toast";
import { INDIA } from "@/lib/places";
import { onboardLookAction, onboardSchoolAction } from "../actions";
import { useT } from "@/lib/i18n";
import { TermsFieldset, useOnboardTerms, type OnboardField, type OnboardOffer } from "./terms-fieldset";

type PlanOption = { id: string; code: string; name: string };
type PartnerOption = { id: string; name: string; percentTenths: number };
type CommissionMode = "none" | "existing" | "new";

/**
 * The guided flow, one form: the school, its subscription and premium
 * (§2.5: our price or its own, the free months that set the renewal, the
 * premium ticks, a college's tier, the optional plan, and the server's
 * summary of it all, terms-fieldset.tsx), who to call there, the partner
 * if there is one, and the first administrator. The percent is typed as a
 * percentage with one decimal and sent as tenths, the integer the row
 * holds. Every refusal is the server's own sentence: the terms' under
 * their fields as they are chosen, the rest above the button; nothing is
 * created until everything passes. A request that goes unanswered may
 * still have made the school, so the next press first asks whether it is
 * there (C7.8, C7a point 1; `servedAt` is when the page was served).
 */
export function OnboardForm({ plans, partners, offer, asked, servedAt }: { plans: PlanOption[]; partners: PartnerOption[]; offer: OnboardOffer; asked: string[]; servedAt: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // A refusal of the terms from the save, shown under the field it names as well as above (the second review's C5).
  const [refused, setRefused] = useState<{ field: OnboardField; error: string } | null>(null);
  // C7.8 (C7a point 1): the name and the administrator's address of the latest request that went unanswered, whatever is
  // typed afterwards, kept until a press is answered by a refusal of the save or by a save; and the school that request made,
  // once the look has found it (every later press finds it again and sends nothing: its link is the way on).
  const [carried, setCarried] = useState<{ name: string; adminEmail: string } | null>(null);
  const [found, setFound] = useState<{ id: string; name: string } | null>(null);

  const [school, setSchool] = useState({ name: "", slug: "", contactEmail: "", timezone: "Asia/Kolkata", board: "", city: "", region: "", country: INDIA, gradeLow: "", gradeHigh: "", kind: "SCHOOL", university: "", aishe: "" });
  // A college's streams (5 Oct 2026), chosen beside the kind.
  const [streams, setStreams] = useState<StreamCode[]>([]);
  const [contact, setContact] = useState({ name: "", role: "", phone: "", email: "" });
  const [mode, setMode] = useState<CommissionMode>(partners.length ? "existing" : "none");
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? "");
  const [newPartner, setNewPartner] = useState({ name: "", percent: "", phone: "", email: "", notes: "" });
  const [admin, setAdmin] = useState({ email: "", name: "" });

  const setS = (key: keyof typeof school) => (value: string) => setSchool((f) => ({ ...f, [key]: value }));
  const setC = (key: keyof typeof contact) => (value: string) => setContact((f) => ({ ...f, [key]: value }));
  const setP = (key: keyof typeof newPartner) => (value: string) => setNewPartner((f) => ({ ...f, [key]: value }));

  // The terms (§2.5): a plan chosen before the kind changed is let go there when its price does not suit the new kind (TA-488).
  const terms = useOnboardTerms({ name: school.name, kind: school.kind, timezone: school.timezone, offer, asked, plans });

  const percentTenths = Math.round(Number(newPartner.percent || "0") * 10);
  // What the button still waits for, each named by its field, so no block is silent (the second review's C3 and W-5, and a
  // college's streams).
  const missing = [
    school.name.trim().length < 2 && t("root.name"),
    !school.contactEmail.trim() && t("root.contactEmail"),
    !school.timezone.trim() && t("root.timezone"),
    isCollegeKind(school.kind) && streams.length === 0 && t("streams.pickerLabel"),
    mode === "new" && !newPartner.name.trim() && t("root.partnerName"),
    mode === "new" && !newPartner.percent.trim() && t("root.commissionPercent"),
    !admin.email.trim() && t("root.firstAdmin"),
    !terms.ticksDone ? t("root.obNeedsTick") : !terms.ready && t("root.obNeedsSummary"),
  ].filter((item): item is string => Boolean(item));
  const ready = missing.length === 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setRefused(null);
    // The start the form took as today must still be the school's today (C7.2); if the day has turned, the summary is asked
    // again and shown, and nothing is sent.
    if (!terms.stillToday()) return;
    // Never without the terms: a body without them would take onboarding's old path (terms not set, a year or a trial).
    if (!terms.body) return;
    const body: OperatorOnboardBody = {
      name: school.name,
      slug: school.slug.trim() || undefined,
      contactEmail: school.contactEmail,
      timezone: school.timezone,
      // A school's board and grades; a college has neither (A3-journeys-40), so a value typed before switching the kind is not sent.
      board: (isCollegeKind(school.kind) ? null : school.board || null) as OperatorOnboardBody["board"],
      city: school.city || null,
      region: school.region || null,
      country: school.country || null,
      gradeLow: isCollegeKind(school.kind) ? null : school.gradeLow || null,
      gradeHigh: isCollegeKind(school.kind) ? null : school.gradeHigh || null,
      kind: school.kind as InstitutionKind,
      // A college's two references (4 Oct 2026), sent only for a college.
      ...(isCollegeKind(school.kind) ? { affiliatingUniversity: school.university.trim() || null, aisheCode: school.aishe.trim().toUpperCase() || null, streams } : {}),
      ...terms.body,
      trial: false,
      contact: { name: contact.name || null, role: contact.role || null, phone: contact.phone || null, email: contact.email || null },
      commission: mode === "none" ? null : mode === "existing" ? { partnerId } : { newPartner: { name: newPartner.name, percentTenths, phone: newPartner.phone || null, email: newPartner.email || null, notes: newPartner.notes } },
      adminEmail: admin.email,
      adminName: admin.name.trim() || undefined,
    };
    startTransition(async () => {
      if (carried) {
        // The request before went unanswered and may have made the school: ask first whether it is there (C7.8).
        let look: Awaited<ReturnType<typeof onboardLookAction>>;
        try {
          look = await onboardLookAction({ since: servedAt, name: carried.name, adminEmail: carried.adminEmail });
        } catch {
          // The question not answered: the first sentence again, and nothing sent.
          setError(t("root.onboardNotReached"));
          return;
        }
        if (!look.ok) {
          // Refused (the session has ended; not the operator): the server's own sentence; an error, the first sentence.
          setError(look.error ?? t("root.onboardNotReached"));
          return;
        }
        if (look.found) {
          setFound(look.found);
          return;
        }
        // None: the form is sent as it stands now, and a school found before and since removed is named no more (the read of
        // 02ec52be, D3).
        setFound(null);
      }
      let result: Awaited<ReturnType<typeof onboardSchoolAction>>;
      try {
        result = await onboardSchoolAction(body);
      } catch {
        // The request did not come back (the connection dropped, or the server could not be reached): the form stays as
        // typed and the button works again, and since the request may have arrived, the operator is told to look for the
        // school before trying again (the coordinating session's capture trial of 22 November 2026, which met the error
        // screen in the form's place); what it carried is kept for the next press's look (C7.8).
        setCarried({ name: body.name, adminEmail: body.adminEmail });
        setError(t("root.onboardNotReached"));
        return;
      }
      if (!result.ok && result.unknown) {
        // The server caught an error and cannot say whether the school was made: neither a refusal nor a save, so, as for a
        // request not answered, what this one carried is kept and the next press looks first (the coordinating session's
        // reading of C7a point 1b in its review of 07d594f3, L3).
        setCarried({ name: body.name, adminEmail: body.adminEmail });
        setError(result.error ?? t("root.onboardNotReached"));
        return;
      }
      // Answered by a refusal or a save: what an unanswered request carried is let go (C7a point 1b).
      setCarried(null);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        if (result.field && result.error) setRefused({ field: result.field, error: result.error });
        // The summary is asked again: the school's day may have turned since it was worded, asking a tick it did not show.
        terms.refresh();
        return;
      }
      toast({ tone: "ok", title: t("root.onboardDone", { name: school.name }), description: t("root.joinCodeIs", { code: result.code ?? "" }) });
      router.push(`/root/${result.schoolId}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {found && (
        // C7.8: the school the unanswered request made, named with its link; nothing was sent again. A later press's own
        // sentence (not reached, refused) is said in the alert above, this staying beside it (the review of 07d594f3, L2).
        <p role="alert" data-testid="onboard-found" className="rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-4 py-3 text-sm font-medium text-fg">
          {t("root.onboardFound", { name: found.name })}{" "}
          <Link href={`/root/${found.id}`} className="font-semibold text-primary underline underline-offset-2">
            {t("root.onboardFoundOpen", { name: found.name })}
          </Link>
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
          <TextField label={t("root.timezone")} required value={school.timezone} onChange={(e) => setS("timezone")(e.target.value)} hint={t("root.timezoneHint")} error={terms.timezoneError ?? (refused?.field === "timezone" ? refused.error : undefined)} />
          {!isCollegeKind(school.kind) && (
            <SelectField label={t("root.board")} value={school.board} onChange={(e) => setS("board")(e.target.value)}>
              <option value="">{t("root.boardNone")}</option>
              {SCHOOL_BOARDS.map((b) => (
                <option key={b} value={b}>
                  {t(`filings.board${b}` as TranslationKey)}
                </option>
              ))}
            </SelectField>
          )}
        </div>
        {!isCollegeKind(school.kind) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t("root.lowestGrade")} value={school.gradeLow} placeholder="3" onChange={(e) => setS("gradeLow")(e.target.value)} />
            <TextField label={t("root.highestGrade")} value={school.gradeHigh} placeholder="10" onChange={(e) => setS("gradeHigh")(e.target.value)} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("root.city")} value={school.city} onChange={(e) => setS("city")(e.target.value)} />
          <LocationFields country={school.country} region={school.region} onCountryChange={setS("country")} onRegionChange={setS("region")} countryLabel={t("root.country")} regionLabel={t("root.stateRegion")} />
        </div>
      </fieldset>

      <TermsFieldset ctl={terms} offer={offer} plans={plans} kind={school.kind} refused={refused} />

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

      {/* By the button too, where it was pressed (the alert above is the one read aloud). */}
      {error && (
        <p aria-hidden="true" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {!ready && !pending && (
        <p className="text-xs text-fg-muted" data-testid="onboard-still-needed">
          {t("root.obStillNeeded", { items: missing.join(", ") })}
        </p>
      )}
      <Button type="submit" loading={pending} disabled={!ready} icon={<RocketLaunchIcon weight="bold" />}>
        {t("root.onboardCta")}
      </Button>
    </form>
  );
}
