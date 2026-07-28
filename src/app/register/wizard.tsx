"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CheckCircleIcon,
  CopyIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { registerSchool, checkEmailAvailable } from "./actions";
import { passwordStrength } from "@/lib/password-strength";

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

const STEPS = [
  { id: "school", label: "Your school", icon: BuildingsIcon },
  { id: "admin", label: "Your account", icon: UserCircleIcon },
  { id: "confirm", label: "Confirm", icon: ShieldCheckIcon },
] as const;

const DRAFT_KEY = "edulink.register.draft";

type Draft = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  city: string;
  country: string;
  gradeLow: string;
  gradeHigh: string;
  timezone: string;
  adminName: string;
  adminEmail: string;
};

const EMPTY: Draft = {
  name: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  city: "",
  country: "",
  gradeLow: "",
  gradeHigh: "",
  timezone: "UTC",
  adminName: "",
  adminEmail: "",
};

export function RegisterWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* ---- draft persistence ---- */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) setDraft({ ...EMPTY, ...JSON.parse(saved) });
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
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Private mode / quota. Losing the draft is acceptable; crashing is not.
    }
  }, [draft]);

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
    const list = supported ? supported("timeZone") : ["UTC"];
    return list.includes("UTC") ? list : ["UTC", ...list];
  }, []);

  /* ---- per-step validation ---- */
  function validateStep(index: number): boolean {
    const next: Record<string, string> = {};

    if (index === 0) {
      if (draft.name.trim().length < 2) next.name = "Enter your school's name.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contactEmail.trim())) {
        next.contactEmail = "Enter a valid contact email for the school.";
      }
      if (draft.website && !/^https?:\/\/\S+\.\S+/.test(draft.website.trim())) {
        next.website = "Start with http:// or https://";
      }
    }

    if (index === 1) {
      if (draft.adminName.trim().length < 2) next.adminName = "Enter your full name.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.adminEmail.trim())) {
        next.adminEmail = "Enter a valid email address.";
      } else if (emailTaken) {
        next.adminEmail = "An account already uses this email. Log in instead.";
      }
      if (strength.problems.length > 0) next.password = strength.problems[0]!;
    }

    if (index === 2 && !accepted) {
      next.accepted = "Please confirm you are authorised to set up this school.";
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
          city: draft.city.trim(),
          country: draft.country.trim(),
          gradeLow: draft.gradeLow.trim(),
          gradeHigh: draft.gradeHigh.trim(),
          timezone: draft.timezone,
        },
        admin: {
          name: draft.adminName.trim(),
          email: draft.adminEmail.trim().toLowerCase(),
          password,
        },
        acceptedTerms: accepted as true,
      });

      if (!result.ok) {
        setErrors(result.errors);
        // Send the user back to the step that owns the failing field, rather
        // than showing an error they cannot see or fix from here.
        const keys = Object.keys(result.errors);
        if (keys.some((k) => k.startsWith("school."))) setStep(0);
        else if (keys.some((k) => k.startsWith("admin."))) setStep(1);
        toast({
          tone: "danger",
          title: "We could not finish that",
          description: result.errors._form ?? "Please check the highlighted fields.",
        });
        return;
      }

      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* nothing to clean up */
      }
      setDone({ code: result.schoolCode! });
    });
  }

  if (done) return <SuccessPanel code={done.code} onContinue={() => router.push("/admin?welcome=1")} />;

  const StepIcon = STEPS[step]!.icon;

  return (
    <div>
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
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
                  "flex min-h-11 flex-1 items-center gap-2 rounded-[--radius-md] px-2.5 py-2 text-left transition-colors",
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
                  {s.label}
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

      <div className="rounded-[--radius-lg] border border-border bg-surface p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[--radius-md] bg-accent-soft text-accent-strong">
            <StepIcon weight="duotone" className="size-6" />
          </span>
          <div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-bold tracking-tight text-fg outline-none sm:text-2xl"
            >
              {step === 0 && "Tell us about your school"}
              {step === 1 && "Create your admin account"}
              {step === 2 && "One last check"}
            </h1>
            <p className="mt-0.5 text-sm text-fg-muted">
              {step === 0 && "Only the name and a contact email are required — the rest can wait."}
              {step === 1 && "This is the account you will use to run the school."}
              {step === 2 && "Confirm and we will set everything up."}
            </p>
          </div>
        </div>

        {errors._form && (
          <p
            role="alert"
            className="mb-5 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {errors._form}
          </p>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <TextField
              label="School name"
              required
              autoFocus
              autoComplete="organization"
              placeholder="Riverside Primary School"
              value={draft.name}
              error={errors.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => validateStep(0)}
              hint="This is what students, parents and teachers will see."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="School contact email"
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="office@riverside.school"
                value={draft.contactEmail}
                error={errors.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
              <TextField
                label="Phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Optional"
                value={draft.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
            </div>

            <TextField
              label="Website"
              type="url"
              inputMode="url"
              placeholder="https://riverside.school"
              value={draft.website}
              error={errors.website}
              onChange={(e) => set("website", e.target.value)}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Town or city"
                autoComplete="address-level2"
                placeholder="Optional"
                value={draft.city}
                onChange={(e) => set("city", e.target.value)}
              />
              <TextField
                label="Country"
                autoComplete="country-name"
                placeholder="Optional"
                value={draft.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Lowest grade"
                placeholder="e.g. K"
                value={draft.gradeLow}
                onChange={(e) => set("gradeLow", e.target.value)}
              />
              <TextField
                label="Highest grade"
                placeholder="e.g. 6"
                value={draft.gradeHigh}
                onChange={(e) => set("gradeHigh", e.target.value)}
              />
            </div>

            <SelectField
              label="Timezone"
              required
              value={draft.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              hint="Attendance days and due dates are worked out in this timezone."
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
              label="Your full name"
              required
              autoFocus
              autoComplete="name"
              placeholder="Priya Raman"
              value={draft.adminName}
              error={errors.adminName}
              onChange={(e) => set("adminName", e.target.value)}
            />

            <TextField
              label="Your email"
              required
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="priya@riverside.school"
              value={draft.adminEmail}
              error={errors.adminEmail}
              onChange={(e) => {
                set("adminEmail", e.target.value);
                setEmailTaken(false);
              }}
              onBlur={async () => {
                const email = draft.adminEmail.trim().toLowerCase();
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
                const available = await checkEmailAvailable(email);
                setEmailTaken(!available);
                if (!available) {
                  setErrors((e) => ({
                    ...e,
                    adminEmail: "An account already uses this email. Log in instead.",
                  }));
                }
              }}
              hint="We will send a confirmation link here."
            />

            <div>
              <TextField
                label="Password"
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
                hint="At least 10 characters. A short sentence works well."
              />
              {password.length > 0 && <StrengthMeter strength={strength} />}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <dl className="divide-y divide-border rounded-[--radius-md] border border-border">
              <Row label="School" value={draft.name} />
              <Row label="Contact" value={draft.contactEmail} />
              {draft.city && <Row label="Location" value={[draft.city, draft.country].filter(Boolean).join(", ")} />}
              <Row label="Timezone" value={draft.timezone} />
              <Row label="Admin" value={`${draft.adminName} · ${draft.adminEmail}`} />
            </dl>

            <CheckboxField
              label="I am authorised to set up EduLink for this school"
              description="You will be the first admin. You can add more admins straight afterwards."
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

            <p className="rounded-[--radius-md] bg-surface-muted p-4 text-xs leading-relaxed text-fg-muted">
              EduLink stores children&rsquo;s data on behalf of your school. Student profiles are never
              public, posts to the wider feed are reviewed before anyone outside the school sees
              them, and you can export or delete everything at any time from your settings.
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
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={next} iconRight={<ArrowRightIcon weight="bold" />}>
              Continue
            </Button>
          ) : (
            <Button onClick={submit} loading={pending} iconRight={<ArrowRightIcon weight="bold" />}>
              {pending ? "Creating your school…" : "Create my school"}
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
  const tones = ["bg-danger", "bg-danger", "bg-warn", "bg-ok", "bg-ok"];
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-[--dur]",
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
        {strength.label}
      </p>
    </div>
  );
}

function SuccessPanel({ code, onContinue }: { code: string; onContinue: () => void }) {
  const { toast } = useToast();

  return (
    <div className="rounded-[--radius-lg] border border-border bg-surface p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-ok-soft text-ok animate-confetti">
        <CheckCircleIcon weight="fill" className="size-12" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-fg">Your school is ready</h1>
      <p className="mx-auto mt-2 max-w-md text-fg-muted">
        This is your school code. Teachers and students use it to join — write it on the board, or
        share it in the invite emails we are about to help you send.
      </p>

      <div className="mx-auto mt-6 flex max-w-xs items-center gap-2">
        <code className="flex-1 rounded-[--radius-md] border-2 border-dashed border-accent bg-accent-soft px-4 py-3.5 text-xl font-bold tracking-[0.15em] text-accent-strong">
          {code}
        </code>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Copy school code"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              toast({ tone: "ok", title: "School code copied" });
            } catch {
              // Clipboard is permission-gated and blocked in some contexts;
              // the code is visible on screen either way.
              toast({ tone: "warn", title: "Could not copy", description: "Select the code to copy it." });
            }
          }}
        >
          <CopyIcon weight="bold" className="size-5" />
        </Button>
      </div>

      <Button className="mt-8" size="lg" onClick={onContinue} iconRight={<ArrowRightIcon weight="bold" />}>
        Go to my dashboard
      </Button>
    </div>
  );
}
