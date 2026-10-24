"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField, TextField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { passwordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/cn";
import { acceptInvite } from "./actions";
import type { Role } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { fieldClass } from "@/components/ui/field-class";

export function AcceptForm({
  token,
  defaultName,
  defaultSubjects,
  role,
  hasAccount,
  needsPassword = false,
  className,
}: {
  token: string;
  defaultName: string;
  defaultSubjects: string[];
  role: Role;
  /**
   * The invited address already has an account, so this is a TRANSFER rather
   * than a sign-up: no password is asked for, because theirs does not change.
   * Resolved on the server — the client must not be the thing that decides
   * whether a credential is needed.
   */
  hasAccount: boolean;
  /** The holder is not signed in as themselves: their existing password is asked for, as proof, and sent with the acceptance. */
  needsPassword?: boolean;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState<string[]>(defaultSubjects);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => passwordStrength(password, [name]), [password, name]);

  function addSubject() {
    const value = subjectDraft.trim();
    if (!value) return;
    if (subjects.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSubjectDraft("");
      return;
    }
    if (subjects.length >= 20) return;
    setSubjects((current) => [...current, value]);
    setSubjectDraft("");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t("register.enterFullName");
    if (!hasAccount && strength.problemKeys.length > 0) next.password = t(strength.problemKeys[0]!);
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    startTransition(async () => {
      const result = await acceptInvite({
        token,
        name: name.trim(),
        // Undefined, not "" — the action refuses a password for an account that
        // already has one, precisely so nobody can type into a field that goes
        // nowhere. Sending an empty string would be doing it by the back door.
        password: hasAccount ? (needsPassword ? password : undefined) : password,
        birthdate: birthdate || undefined,
        title: title.trim() || undefined,
        bio: bio.trim() || undefined,
        subjects,
      });

      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: t("invite.didNotWork"),
          description: result.errors._form ?? t("register.checkFields"),
        });
        return;
      }

      toast({
        tone: "ok",
        title: hasAccount ? t("invite.addedToAccount") : t("invite.welcomeAboard"),
        // Two-step sign-in on: the code from the app is asked next (QA-21).
        description: result.twoFactor ? t("totp.stepBody") : hasAccount ? t("invite.signInAsAlways") : undefined,
      });
      router.push(result.redirectTo ?? "/");
      router.refresh();
    });
  }

  return (
    <form id="accept-invite" onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label={t("invite.fullName")}
        required
        autoFocus
        autoComplete="name"
        placeholder={t("invite.fullNamePlaceholder")}
        value={name}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
      />

      {/*
        ASKED, NOT DEMANDED. `joinAsStudent` has always taken a birthday and an
        invitation never did — so every invited pupil and every member of staff
        had none, the school calendar could show a birthday for almost nobody,
        and a guardian claiming an invited child was refused outright for want
        of a second factor. Optional because an invitation is often the first
        thing somebody does on a Monday morning, and a date they would rather
        not give must not be what stops them accepting a job.
      */}
      {role !== "PARENT" && (
      <DateField
        name="birthdate"
        label={t("invite.birthdate")}
        hint={t("invite.birthdateHint")}
        value={birthdate}
        error={errors.birthdate}
        onChange={(e) => setBirthdate(e.target.value)}
      />
      )}

      {hasAccount && needsPassword && (
        <TextField
          label={t("invite.enterYourPassword")}
          required
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}

      {!hasAccount && (
      <div>
        <TextField
          label={t("invite.choosePassword")}
          required
          type="password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          hint={t("invite.passwordHint")}
        />
        {password.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
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
                "mt-1.5 text-xs font-medium",
                strength.score >= 3 ? "text-ok" : strength.score === 2 ? "text-warn" : "text-fg-muted",
              )}
            >
              {t(strength.labelKey)}
            </p>
          </div>
        )}
      </div>
      )}

      {role === "TEACHER" && (
        <>
          <TextField
            label={t("invite.roleAtSchool")}
            placeholder={t("invite.roleAtSchoolPlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            hint={t("invite.roleAtSchoolHint")}
          />

          <div>
            <label htmlFor="subject-input" className="block text-sm font-medium text-fg">
              {t("invite.subjects")}
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="subject-input"
                value={subjectDraft}
                onChange={(e) => setSubjectDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter adds a subject; it must not submit the whole form.
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSubject();
                  }
                }}
                placeholder={t("invite.subjectPlaceholder")}
                className={fieldClass("w-auto flex-1")}
              />
              <Button type="button" variant="secondary" onClick={addSubject}>
                Add
              </Button>
            </div>
            {subjects.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {subjects.map((subject) => (
                  <li key={subject}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1 text-xs font-semibold text-accent-strong">
                      {subject}
                      <button
                        type="button"
                        onClick={() => setSubjects((c) => c.filter((s) => s !== subject))}
                        aria-label={t("invite.removeSubject", { subject })}
                        className="grid size-6 place-items-center rounded-full hover:bg-surface/60"
                      >
                        <XIcon weight="bold" className="size-3" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <TextAreaField
            label={t("invite.bio")}
            placeholder={t("invite.bioPlaceholder")}
            value={bio}
            rows={3}
            maxLength={600}
            onChange={(e) => setBio(e.target.value)}
            hint={t("invite.bioHint")}
          />
        </>
      )}

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        iconRight={<ArrowRightIcon weight="bold" />}
      >
        {pending
          ? hasAccount
            ? t("invite.addingIt")
            : t("invite.settingYouUp")
          : role === "PARENT"
            ? t("invite.acceptTheLink")
            : hasAccount
              ? t("invite.addThisSchool")
              : t("invite.acceptAndJoin")}
      </Button>
    </form>
  );
}
