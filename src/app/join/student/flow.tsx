"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { AVATAR_PRESETS, Avatar, describeAvatar } from "@/components/ui/avatar";
import { passwordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/cn";
import { joinAsStudent, lookupCode, type CodeLookup } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * Kid-first join flow.
 *
 * Written for an eight-year-old on a shared tablet:
 *   * one question per screen, in plain words
 *   * the code box auto-uppercases and auto-inserts the hyphen, because typing
 *     an exact code is the single hardest step for a young child
 *   * the school's real name is shown back as confirmation before anything else
 *     is asked — "is this your school?" is a much easier question than "did you
 *     type the code right?"
 *   * no email address is required at all (see joinAsStudent for why)
 */

type Step = "code" | "name" | "avatar" | "password";

const STEP_ORDER: Step[] = ["code", "name", "avatar", "password"];

export function StudentJoinFlow() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Extract<CodeLookup, { ok: true }> | null>(null);
  const [checking, setChecking] = useState(false);

  const [name, setName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [avatarKey, setAvatarKey] = useState(AVATAR_PRESETS[0]!);
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), [step]);

  const strength = useMemo(
    () => passwordStrength(password, [name, preferredName]),
    [password, name, preferredName],
  );

  const index = STEP_ORDER.indexOf(step);

  /** Uppercase, strip junk, and place the hyphen so children need not find it. */
  function formatCode(raw: string): string {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length <= 3) return clean;
    // School codes are 5+4; class codes are 3+4. Hyphen after the longer
    // prefix once we have enough characters to tell them apart.
    if (clean.length > 7) return `${clean.slice(0, 5)}-${clean.slice(5, 9)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
  }

  async function checkCode() {
    setErrors({});
    setChecking(true);
    try {
      const result = await lookupCode(code);
      if (!result.ok) {
        setErrors({ code: result.error });
        setFound(null);
        return;
      }
      setFound(result);
    } finally {
      setChecking(false);
    }
  }

  function next() {
    setErrors({});

    if (step === "code") {
      if (!found) {
        setErrors({ code: t("join.checkCodeFirst") });
        return;
      }
      setStep("name");
      return;
    }

    if (step === "name") {
      if (name.trim().length < 2) {
        setErrors({ name: t("join.typeFullName") });
        return;
      }
      setStep("avatar");
      return;
    }

    if (step === "avatar") {
      setStep("password");
      return;
    }

    if (strength.problems.length > 0) {
      setErrors({ password: strength.problems[0]! });
      return;
    }

    startTransition(async () => {
      const result = await joinAsStudent({
        schoolCode: code,
        name: name.trim(),
        preferredName: preferredName.trim() || undefined,
        avatarKey,
        birthdate: birthdate || undefined,
        password,
      });

      if (!result.ok) {
        setErrors(result.errors);
        if (result.errors.schoolCode) setStep("code");
        toast({
          tone: "danger",
          title: t("join.didNotWork"),
          description: result.errors._form ?? t("join.lookAtHighlighted"),
        });
        return;
      }

      toast({ tone: "ok", title: t("join.youreIn") });
      router.push(result.redirectTo ?? "/student");
      router.refresh();
    });
  }

  return (
    <div>
      {/* Progress dots — deliberately not a percentage bar; "3 of 4" is easier
          for a child to read than "75%". */}
      <div className="mb-7 flex items-center gap-2" role="group" aria-label={t("join.stepOf", { n: index + 1 })}>
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            aria-hidden="true"
            className={cn(
              "h-2 flex-1 rounded-full transition-colors duration-[--dur]",
              i < index ? "bg-ok" : i === index ? "bg-accent" : "bg-border",
            )}
          />
        ))}
        <span className="ml-1 shrink-0 text-xs font-bold tabular-nums text-fg-muted">
          {index + 1}/4
        </span>
      </div>

      {errors._form && (
        <p
          role="alert"
          className="mb-5 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      {/* ---------------------------------------------------------- step 1 */}
      {step === "code" && (
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight text-fg outline-none"
          >
            {t("join.whatsYourCode")}
          </h1>
          <p className="mt-2 text-fg-muted">{t("join.codeBody")}</p>

          <div className="mt-6">
            <label htmlFor="join-code" className="sr-only">
              {t("join.codeLabel")}
            </label>
            <input
              id="join-code"
              value={code}
              onChange={(e) => {
                setCode(formatCode(e.target.value));
                setFound(null);
                setErrors({});
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void checkCode();
                }
              }}
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              placeholder={t("join.codePlaceholder")}
              aria-invalid={Boolean(errors.code) || undefined}
              aria-describedby={errors.code ? "join-code-error" : undefined}
              className={cn(
                "w-full rounded-[--radius-lg] border-2 bg-surface px-4 py-5 text-center",
                "font-mono text-3xl font-bold tracking-[0.2em] uppercase text-fg",
                "outline-none placeholder:text-fg-subtle placeholder:tracking-[0.2em]",
                errors.code
                  ? "border-danger"
                  : found
                    ? "border-ok"
                    : "border-border focus:border-accent",
              )}
            />
            {errors.code && (
              <p id="join-code-error" role="alert" className="mt-2 text-sm font-medium text-danger">
                {errors.code}
              </p>
            )}
          </div>

          {found ? (
            <div className="mt-4 flex items-center gap-3 rounded-[--radius-lg] border-2 border-ok bg-ok-soft p-4 animate-pop">
              <CheckCircleIcon weight="fill" className="size-7 shrink-0 text-ok" />
              <div className="min-w-0">
                <p className="font-bold text-fg">{found.schoolName}</p>
                <p className="text-sm text-fg-muted">
                  {found.kind === "class"
                    ? t("join.classIs", { name: found.className })
                    : t("join.wholeSchool")}
                </p>
              </div>
            </div>
          ) : (
            <Button
              block
              size="lg"
              variant="secondary"
              className="mt-4"
              loading={checking}
              disabled={code.replace(/[^A-Z0-9]/g, "").length < 4}
              onClick={checkCode}
            >
              {t("join.checkMyCode")}
            </Button>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------- step 2 */}
      {step === "name" && (
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight text-fg outline-none"
          >
            {t("join.whatsYourName")}
          </h1>
          <p className="mt-2 text-fg-muted">{t("join.nameBody")}</p>

          <div className="mt-6 space-y-5">
            <TextField
              label={t("register.yourName")}
              required
              autoFocus
              autoComplete="name"
              placeholder={t("join.studentNamePlaceholder")}
              value={name}
              error={errors.name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label={t("join.whatCallYou")}
              placeholder={name.split(" ")[0] || t("join.whatCallYouFallback")}
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              hint={t("join.whatCallYouHint")}
            />
            <DateField
              label={t("join.yourBirthday")}
              value={birthdate}
              error={errors.birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              hint={t("join.birthdayHint")}
            />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- step 3 */}
      {step === "avatar" && (
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight text-fg outline-none"
          >
            {t("join.pickYourLook")}
          </h1>
          <p className="mt-2 text-fg-muted">
            {t("join.pickLookBody", { count: AVATAR_PRESETS.length })}
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Avatar avatarKey={avatarKey} name={preferredName || name || "You"} size="2xl" ring />
            <div>
              <p className="text-lg font-bold text-fg">{preferredName || name || "You"}</p>
              <p className="text-sm text-fg-muted">{describeAvatar(avatarKey)}</p>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label={t("join.chooseAvatar")}
            className="mt-6 grid max-h-80 grid-cols-5 gap-2 overflow-y-auto rounded-[--radius-lg] border border-border bg-surface p-3 scrollbar-thin sm:grid-cols-6"
          >
            {AVATAR_PRESETS.map((preset) => {
              const selected = preset === avatarKey;
              return (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={describeAvatar(preset)}
                  onClick={() => setAvatarKey(preset)}
                  className={cn(
                    "rounded-full transition-transform duration-[--dur-fast] active:scale-90",
                    selected
                      ? "ring-[3px] ring-accent ring-offset-2 ring-offset-[--surface]"
                      : "hover:scale-105",
                  )}
                >
                  <Avatar avatarKey={preset} name={describeAvatar(preset)} size="md" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- step 4 */}
      {step === "password" && (
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight text-fg outline-none"
          >
            {t("join.makePassword")}
          </h1>
          <p className="mt-2 text-fg-muted">
            {t("join.makePasswordLead")}{" "}
            <span className="font-semibold text-fg">{t("join.makePasswordExample")}</span>.{" "}
            {t("join.makePasswordTail")}
          </p>

          <div className="mt-6">
            <TextField
              label={t("join.yourPassword")}
              required
              autoFocus
              type="password"
              autoComplete="new-password"
              value={password}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-colors",
                        i < strength.score
                          ? strength.score >= 3
                            ? "bg-ok"
                            : strength.score === 2
                              ? "bg-warn"
                              : "bg-danger"
                          : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <p
                  aria-live="polite"
                  className={cn(
                    "mt-1.5 text-sm font-medium",
                    strength.score >= 3
                      ? "text-ok"
                      : strength.score === 2
                        ? "text-warn"
                        : "text-fg-muted",
                  )}
                >
                  {strength.score >= 3 ? t("join.greatPassword") : strength.label}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-[--radius-md] bg-accent-soft p-4">
            <SparkleIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-accent-strong" />
            <p className="text-sm leading-relaxed text-fg-muted">
              {/* ⚠ ONE KEY PER SENTENCE, and the bold on the school name is
                  gone on purpose. It used to be `joining <b>{school}</b> in
                  <b>{class}</b>.` — JSX that fixes English word order into the
                  markup. Hindi and Marathi put the postposition after the noun,
                  so no arrangement of those fragments reads correctly in either.
                  A whole sentence with placeholders can be reordered; bold text
                  spliced between them cannot. */}
              {found?.kind === "class"
                ? t("join.joiningClass", {
                    school: found.schoolName,
                    class: found.className,
                  })
                : t("join.joiningSchool", { school: found?.schoolName ?? "" })}
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- nav */}
      <div className="mt-8 flex items-center gap-3">
        {index > 0 && (
          <Button
            variant="ghost"
            size="lg"
            disabled={pending}
            icon={<ArrowLeftIcon weight="bold" />}
            onClick={() => setStep(STEP_ORDER[index - 1]!)}
          >
            {t("common.back")}
          </Button>
        )}
        <Button
          size="lg"
          block
          loading={pending}
          disabled={step === "code" && !found}
          iconRight={<ArrowRightIcon weight="bold" />}
          onClick={next}
        >
          {step === "password" ? (pending ? t("join.settingUp") : t("join.letsGo")) : t("join.next")}
        </Button>
      </div>
    </div>
  );
}
