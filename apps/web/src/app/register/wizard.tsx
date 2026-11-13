"use client";

import Link from "next/link";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { INSTITUTION_KINDS, isCollegeKind } from "@edulink/contracts";
import { StreamPicker } from "@/components/college/stream-picker";
import { LocationFields } from "@/components/location-fields";
import { useToast } from "@/components/ui/toast";
import { INDIA } from "@/lib/places";
import { cn } from "@/lib/cn";
import { registerSchool } from "./actions";
import { passwordStrength } from "@/lib/password-strength";
import { useT } from "@/lib/i18n";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { fieldClass } from "@/components/ui/field-class";

/**
 * Three-step school registration.
 *
 * Design decisions worth stating:
 *   * The draft is persisted to sessionStorage on every change, so a
 *     mis-tapped back button or an accidental refresh half-way through does not
 *     cost the user everything they typed.
 *   * Validation runs on blur, not on every keystroke — showing "invalid email"
 *     after the user has typed one character is hostile.
 *   * Steps are not skippable forward, but always navigable backward.
 */

/** ⚠ KEYS, NOT WORDS — the step rail is rendered on every step. */
const STEPS = [
  { id: "school", labelKey: "register.stepSchool", icon: BuildingsIcon },
  { id: "admin", labelKey: "register.stepAccount", icon: UserCircleIcon },
  { id: "confirm", labelKey: "register.stepConfirm", icon: ShieldCheckIcon },
] as const satisfies readonly { id: string; labelKey: TranslationKey; icon: unknown }[];

const DRAFT_KEY = "edulink.register.draft";

type Draft = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  about: string;
  city: string;
  region: string;
  country: string;
  gradeLow: string;
  gradeHigh: string;
  timezone: string;
  /** A school, a junior college, a college or an autonomous college (4 Oct 2026). */
  kind: string;
  /** A college's streams (5 Oct 2026): at least one for a college. */
  streams: string[];
  adminName: string;
  adminEmail: string;
};

const EMPTY: Draft = {
  name: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  about: "",
  city: "",
  region: "",
  // India is the product's home; a school elsewhere overtypes it.
  country: INDIA,
  gradeLow: "",
  gradeHigh: "",
  timezone: "UTC",
  kind: "SCHOOL",
  streams: [],
  adminName: "",
  adminEmail: "",
};

export function RegisterWizard() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // The one answer a form in order gets, whether or not the address had an account (QA-25).
  const [done, setDone] = useState<{ sent: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* ---- draft persistence ----------------------------------------------------
   *
   * A mount effect on purpose, and the one case in this file where setting
   * state from an effect is right rather than tolerated. sessionStorage does
   * not exist on the server, so the first HTML has to be the empty form or
   * hydration would mismatch; and unlike connectivity or the user agent there
   * is nothing here to subscribe to, because the restored draft is then EDITED
   * — it is a starting point, not a live external value.
   */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft({ ...EMPTY, ...parsed });
        // Come back to the STEP they were on, not step 1 — a refresh
        // mid-wizard used to keep every answer and still lose their place.
        // Never past the password step: the password is deliberately not
        // saved, so the review would be confirming an account with none.
        if (typeof parsed.step === "number") {
          setStep(Math.min(Math.max(0, parsed.step), 1));
        }
      }
    } catch {
      // Corrupt draft is not worth surfacing; the user just starts fresh.
    }
    // Default to the browser's own timezone — almost always right, and saves a
    // scroll through 400 options.
    const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (guess) setDraft((d) => (d.timezone === "UTC" ? { ...d, timezone: guess } : d));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, step }));
    } catch {
      // Private mode / quota. Losing the draft is acceptable; crashing is not.
    }
  }, [draft, step]);

  /* ---- move focus to the new step heading for screen readers ---- */
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const strength = useMemo(
    () => passwordStrength(password, [draft.adminName, draft.adminEmail, draft.name]),
    [password, draft.adminName, draft.adminEmail, draft.name],
  );

  const timezones = useMemo(() => {
    const supported = (Intl as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    // Some ICU builds still hand out colonial-era aliases; a school in Pune
    // should be offered the city's own name. Both are valid IANA zones.
    const list = (supported ? supported("timeZone") : ["UTC"]).map((z) =>
      z === "Asia/Calcutta" ? "Asia/Kolkata" : z,
    );
    return list.includes("UTC") ? list : ["UTC", ...list];
  }, []);

  /* ---- per-step validation ---- */
  function validateStep(index: number): boolean {
    const next: Record<string, string> = {};

    if (index === 0) {
      if (draft.name.trim().length < 2) next.name = t("register.enterSchoolName");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contactEmail.trim())) {
        next.contactEmail = t("register.enterContactEmail");
      }
      if (draft.website && !/^https?:\/\/\S+\.\S+/.test(draft.website.trim())) {
        next.website = t("register.websiteScheme");
      }
      // A college says which streams it teaches (5 Oct 2026).
      if (isCollegeKind(draft.kind) && (draft.streams ?? []).length === 0) next.streams = t("streams.refuseNone");
    }

    if (index === 1) {
      if (draft.adminName.trim().length < 2) next.adminName = t("register.enterFullName");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.adminEmail.trim())) {
        next.adminEmail = t("register.enterValidEmail");
      }
      if (strength.problemKeys.length > 0) next.password = t(strength.problemKeys[0]!);
    }

    if (index === 2 && !accepted) {
      next.accepted = t("register.confirmAuthorised");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit() {
    if (!validateStep(2)) return;

    startTransition(async () => {
      const result = await registerSchool({
        school: {
          name: draft.name.trim(),
          contactEmail: draft.contactEmail.trim().toLowerCase(),
          contactPhone: draft.contactPhone.trim(),
          website: draft.website.trim(),
          about: draft.about.trim(),
          city: draft.city.trim(),
          region: draft.region.trim(),
          country: draft.country.trim(),
          gradeLow: draft.gradeLow.trim(),
          gradeHigh: draft.gradeHigh.trim(),
          timezone: draft.timezone,
        },
        kind: draft.kind,
        streams: isCollegeKind(draft.kind) ? (draft.streams ?? []) : [],
        admin: {
          name: draft.adminName.trim(),
          email: draft.adminEmail.trim().toLowerCase(),
          password,
        },
        acceptedTerms: accepted as true,
      });

      if (!result.ok) {
        // The server names fields by their schema path ("admin.email"); the
        // form names them by its own state ("adminEmail"). Left unmapped, the
        // duplicate-email refusal bounced the wizard back to step 2 with the
        // message stored under a key no field ever reads — a silent no.
        const FIELD_KEY: Record<string, string> = {
          "school.name": "name",
          "school.contactEmail": "contactEmail",
          "school.website": "website",
          "admin.name": "adminName",
          "admin.email": "adminEmail",
          "admin.password": "password",
          acceptedTerms: "accepted",
          streams: "streams",
        };
        setErrors(
          Object.fromEntries(
            Object.entries(result.errors).map(([k, v]) => [FIELD_KEY[k] ?? k, v]),
          ),
        );
        // Send the user back to the step that owns the failing field, rather
        // than showing an error they cannot see or fix from here.
        const keys = Object.keys(result.errors);
        if (keys.some((k) => k.startsWith("school.") || k === "streams")) setStep(0);
        else if (keys.some((k) => k.startsWith("admin."))) setStep(1);
        toast({
          tone: "danger",
          title: t("register.couldNotFinish"),
          description: result.errors._form ?? t("register.checkFields"),
        });
        return;
      }

      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* nothing to clean up */
      }
      setDone({ sent: result.sent ?? t("accountGuard.signupSentPlain") });
    });
  }

  if (done) {
    return <SuccessPanel t={t} sent={done.sent} onContinue={() => router.push("/login")} />;
  }

  const StepIcon = STEPS[step]!.icon;

  return (
    <div>
      <ol className="mb-8 flex items-center gap-2" aria-label={t("register.progress")}>
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                // Backward navigation only: jumping ahead would skip validation.
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex min-h-11 flex-1 items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-left transition-colors",
                  i < step && "cursor-pointer hover:bg-surface-muted",
                  i >= step && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors",
                    state === "done" && "bg-ok text-white",
                    state === "current" && "bg-accent text-accent-fg animate-pulse-ring",
                    state === "todo" && "bg-surface-muted text-fg-subtle",
                  )}
                >
                  {state === "done" ? <CheckCircleIcon weight="fill" className="size-5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-semibold sm:block",
                    state === "current" ? "text-fg" : "text-fg-muted",
                  )}
                >
                  {t(s.labelKey)}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn("h-0.5 w-4 rounded-full", i < step ? "bg-ok" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
            <StepIcon weight="duotone" className="size-6" />
          </span>
          <div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-bold tracking-tight text-fg outline-none sm:text-2xl"
            >
              {step === 0 && t("register.schoolTitle")}
              {step === 1 && t("register.accountTitle")}
              {step === 2 && t("register.confirmTitle")}
            </h1>
            <p className="mt-0.5 text-sm text-fg-muted">
              {step === 0 && t("register.schoolBody")}
              {step === 1 && t("register.accountBody")}
              {step === 2 && t("register.confirmBody")}
            </p>
          </div>
        </div>

        {errors._form && (
          <p
            role="alert"
            className="mb-5 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {errors._form}
          </p>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <TextField
              label={t("register.schoolName")}
              required
              autoFocus
              autoComplete="organization"
              placeholder={t("register.schoolNamePlaceholder")}
              value={draft.name}
              error={errors.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => validateStep(0)}
              hint={t("register.schoolNameHint")}
            />

            {/* What kind of institution (4 Oct 2026): a college is offered the college modules and roles. */}
            <SelectField label={t("institution.kindLabel")} value={draft.kind} onChange={(e) => set("kind", e.target.value)} hint={t("institution.kindHint")}>
              {INSTITUTION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`institution.kind.${k}`)}
                </option>
              ))}
            </SelectField>
            {/* A college's streams (5 Oct 2026), chosen beside the kind: its modules, regulators and duties follow them. */}
            {isCollegeKind(draft.kind) && <StreamPicker value={draft.streams ?? []} onChange={(next) => set("streams", next)} error={errors.streams} />}

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label={t("register.contactEmail")}
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("register.contactEmailPlaceholder")}
                value={draft.contactEmail}
                error={errors.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
              <TextField
                label={t("register.phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("common.optional")}
                value={draft.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
            </div>

            <TextField
              label={t("register.website")}
              type="url"
              inputMode="url"
              placeholder={t("register.websitePlaceholder")}
              value={draft.website}
              error={errors.website}
              onChange={(e) => set("website", e.target.value)}
            />

            <label className="block text-sm font-medium text-fg">
              {t("register.about")}
              <textarea
                value={draft.about}
                onChange={(e) => set("about", e.target.value)}
                rows={3}
                placeholder={t("register.aboutHint")}
                className={fieldClass("mt-1")}
              />
              <span className="mt-1 block text-xs font-normal text-fg-muted">
                {t("register.aboutWhy")}
              </span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label={t("register.city")}
                autoComplete="address-level2"
                placeholder={t("common.optional")}
                value={draft.city}
                onChange={(e) => set("city", e.target.value)}
              />
              <LocationFields
                country={draft.country}
                region={draft.region}
                onCountryChange={(value) => set("country", value)}
                onRegionChange={(value) => set("region", value)}
                countryLabel={t("register.country")}
                regionLabel={t("register.region")}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label={t("register.gradeLow")}
                placeholder={t("register.gradeLowPlaceholder")}
                value={draft.gradeLow}
                onChange={(e) => set("gradeLow", e.target.value)}
              />
              <TextField
                label={t("register.gradeHigh")}
                placeholder={t("register.gradeHighPlaceholder")}
                value={draft.gradeHigh}
                onChange={(e) => set("gradeHigh", e.target.value)}
              />
            </div>

            <SelectField
              label={t("register.timezone")}
              required
              value={draft.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              hint={t("register.timezoneHint")}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </SelectField>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <TextField
              label={t("register.yourName")}
              required
              autoFocus
              autoComplete="name"
              placeholder={t("register.yourNamePlaceholder")}
              value={draft.adminName}
              error={errors.adminName}
              onChange={(e) => set("adminName", e.target.value)}
            />

            <TextField
              label={t("register.yourEmail")}
              required
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("register.yourEmailPlaceholder")}
              value={draft.adminEmail}
              error={errors.adminEmail}
              // No "is this address free?" on blur (QA-25): the answer said whether anybody's address had an account.
              onChange={(e) => set("adminEmail", e.target.value)}
              hint={t("register.yourEmailHint")}
            />

            <div>
              <TextField
                label={t("register.password")}
                required
                type="password"
                autoComplete="new-password"
                value={password}
                error={errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((err) => {
                    const nextErrors = { ...err };
                    delete nextErrors.password;
                    return nextErrors;
                  });
                }}
                hint={t("register.passwordHint")}
              />
              {password.length > 0 && <StrengthMeter strength={strength} />}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <dl className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
              <Row label={t("register.rowSchool")} value={draft.name} />
              <Row label={t("register.rowContact")} value={draft.contactEmail} />
              {draft.city && (
                <Row
                  label={t("register.rowLocation")}
                  value={[draft.city, draft.region, draft.country].filter(Boolean).join(", ")}
                />
              )}
              <Row label={t("register.rowTimezone")} value={draft.timezone} />
              <Row label={t("register.rowAdmin")} value={`${draft.adminName} · ${draft.adminEmail}`} />
            </dl>

            <CheckboxField
              label={t("register.authorisedLabel")}
              description={t("register.authorisedDescription")}
              checked={accepted}
              error={errors.accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                setErrors((err) => {
                  const nextErrors = { ...err };
                  delete nextErrors.accepted;
                  return nextErrors;
                });
              }}
            />

            <p className="rounded-[var(--radius-md)] bg-surface-muted p-4 text-xs leading-relaxed text-fg-muted">
              {t("register.dataNote")}
            </p>
            <p className="text-xs">
              <Link href="/privacy" className="font-medium text-accent-strong underline underline-offset-4">
                {t("register.privacyLink")}
              </Link>
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
            icon={<ArrowLeftIcon weight="bold" />}
          >
            {t("common.back")}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={next} iconRight={<ArrowRightIcon weight="bold" />}>
              {t("register.continue")}
            </Button>
          ) : (
            <Button onClick={submit} loading={pending} iconRight={<ArrowRightIcon weight="bold" />}>
              {pending ? t("register.creating") : t("register.createSchool")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}

function StrengthMeter({ strength }: { strength: ReturnType<typeof passwordStrength> }) {
  const t = useT();
  const tones = ["bg-danger", "bg-danger", "bg-warn", "bg-ok", "bg-ok"];
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-[var(--dur)]",
              i < strength.score ? tones[strength.score] : "bg-border",
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "mt-1.5 text-xs font-medium",
          strength.score >= 3 ? "text-ok" : strength.score === 2 ? "text-warn" : "text-fg-muted",
        )}
        aria-live="polite"
      >
        {t(strength.labelKey)}
      </p>
    </div>
  );
}

/**
 * What a form in order is answered with (QA-25, 24 Oct 2026): one sentence,
 * the same whether the school was made or the address already had an
 * account, and the way to the sign-in page. The school's join code is on the
 * admin's dashboard once they sign in.
 */
function SuccessPanel({
  t,
  sent,
  onContinue,
}: {
  t: Translate;
  sent: string;
  onContinue: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center shadow-sm" role="status">
      <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-accent-soft text-accent">
        <EnvelopeSimpleIcon weight="duotone" className="size-12" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-fg">{t("accountGuard.signupSentTitle")}</h1>
      <p className="mx-auto mt-2 max-w-md text-fg-muted">{sent}</p>

      <Button className="mt-8" size="lg" onClick={onContinue} iconRight={<ArrowRightIcon weight="bold" />}>
        {t("accountGuard.goToSignIn")}
      </Button>
    </div>
  );
}
