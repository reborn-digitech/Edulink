"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { passwordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/cn";
import { acceptInvite } from "./actions";
import type { Role } from "@/lib/constants";

export function AcceptForm({
  token,
  defaultName,
  defaultSubjects,
  role,
  className,
}: {
  token: string;
  defaultName: string;
  defaultSubjects: string[];
  role: Role;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState<string[]>(defaultSubjects);
  const [subjectDraft, setSubjectDraft] = useState("");
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
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (strength.problems.length > 0) next.password = strength.problems[0]!;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    startTransition(async () => {
      const result = await acceptInvite({
        token,
        name: name.trim(),
        password,
        title: title.trim() || undefined,
        bio: bio.trim() || undefined,
        subjects,
      });

      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: "That did not work",
          description: result.errors._form ?? "Please check the highlighted fields.",
        });
        return;
      }

      toast({ tone: "ok", title: "You're in — welcome aboard" });
      router.push(result.redirectTo ?? "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label="Your full name"
        required
        autoFocus
        autoComplete="name"
        placeholder="Tom Fielding"
        value={name}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
      />

      <div>
        <TextField
          label="Choose a password"
          required
          type="password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 10 characters. A short sentence works well."
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
              {strength.label}
            </p>
          </div>
        )}
      </div>

      {role === "TEACHER" && (
        <>
          <TextField
            label="Your role at the school"
            placeholder="Class teacher"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            hint="Optional — shown in the school directory."
          />

          <div>
            <label htmlFor="subject-input" className="block text-sm font-medium text-fg">
              Subjects you teach
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
                placeholder="Mathematics"
                className="min-h-12 flex-1 rounded-[--radius-md] border border-border bg-surface px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
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
                        aria-label={`Remove ${subject}`}
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
            label="A short bio"
            placeholder="I have taught Year 5 at Riverside for six years."
            value={bio}
            rows={3}
            maxLength={600}
            onChange={(e) => setBio(e.target.value)}
            hint="Optional — parents and students see this."
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
        {pending ? "Setting you up…" : "Accept and join"}
      </Button>
    </form>
  );
}
