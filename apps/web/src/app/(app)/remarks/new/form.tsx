"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, PaperPlaneTiltIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

import { TextField } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { startThread } from "../actions";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { fieldClass } from "@/components/ui/field-class";

type Student = {
  membershipId: string;
  name: string;
  fullName: string;
  avatarKey: string | null;
  className: string;
  guardianCount: number;
};

/* Keys, not words — looked up at render time in the reader's language. */
const SUGGESTIONS: TranslationKey[] = [
  "remarks.suggestionUpdate",
  "remarks.suggestionLovely",
  "remarks.suggestionConcern",
  "remarks.suggestionHomework",
  "remarks.suggestionAbsence",
];

export function ComposeForm({
  students,
  preselected,
  className,
}: {
  students: Student[];
  preselected?: string;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [studentId, setStudentId] = useState(preselected ?? "");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.className.toLowerCase().includes(q),
    );
  }, [students, query]);

  const selected = students.find((s) => s.membershipId === studentId);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!studentId) next.studentMembershipId = t("remarks.chooseStudentDot");
    if (subject.trim().length < 2) next.subject = t("remarks.shortSubject");
    if (body.trim().length < 1) next.body = t("remarks.writeYourMessage");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      const result = await startThread({
        studentMembershipId: studentId,
        subject: subject.trim(),
        body: body.trim(),
      });

      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: t("remarks.couldNotSend"),
          description: result.errors._form ?? t("remarks.checkHighlighted"),
        });
        return;
      }

      toast({ tone: "ok", title: t("remarks.messageSent"), description: t("remarks.guardiansNotified") });
      router.push(`/remarks/${result.threadId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className={cn("space-y-6", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-fg">{t("remarks.whichStudent")}</legend>

        <div className="relative mt-2">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("remarks.findStudent")}
            aria-label={t("remarks.searchStudents")}
            className={fieldClass("pl-11")}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] bg-surface-muted p-4 text-center text-sm text-fg-muted">
            {t("remarks.nobodyMatches", { query })}
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label={t("remarks.chooseStudent")}
            className="mt-2 max-h-64 space-y-1.5 overflow-y-auto rounded-[var(--radius-md)] border border-border p-2 scrollbar-thin"
          >
            {filtered.map((student) => {
              const active = student.membershipId === studentId;
              return (
                <button
                  key={student.membershipId}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setStudentId(student.membershipId);
                    setErrors((e) => {
                      const next = { ...e };
                      delete next.studentMembershipId;
                      return next;
                    });
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-2.5 text-left transition-colors",
                    active ? "bg-accent-soft" : "hover:bg-surface-muted",
                  )}
                >
                  <Avatar avatarKey={student.avatarKey} name={student.fullName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        active ? "text-accent-strong" : "text-fg",
                      )}
                    >
                      {student.fullName}
                    </span>
                    <span className="block truncate text-xs text-fg-muted">
                      {student.className}
                    </span>
                  </span>
                  {student.guardianCount === 0 && (
                    <span className="shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-warn">
                      {t("remarks.noGuardian")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {errors.studentMembershipId && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
            {errors.studentMembershipId}
          </p>
        )}
      </fieldset>

      {/* Told BEFORE writing, not after sending into the void. (§9) */}
      {selected && selected.guardianCount === 0 && (
        <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft p-3.5 text-sm text-warn">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
          <span>{t("remarks.noGuardianWarning", { name: selected.fullName })}</span>
        </p>
      )}

      <div>
        <TextField
          label={t("remarks.subject")}
          required
          placeholder={t("remarks.subjectPlaceholder")}
          value={subject}
          error={errors.subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={160}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <Chip key={suggestion} onClick={() => setSubject(t(suggestion))}>
              {t(suggestion)}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="remark-body" className="block text-sm font-medium text-fg">
          {t("remarks.message")} <span className="text-danger">*</span>
        </label>
        <textarea
          id="remark-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 8000))}
          rows={6}
          placeholder={t("remarks.messagePlaceholder")}
          aria-invalid={Boolean(errors.body) || undefined}
          className={fieldClass("mt-1.5 resize-y leading-relaxed", Boolean(errors.body))}
        />
        {errors.body && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
            {errors.body}
          </p>
        )}
      </div>

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        icon={<PaperPlaneTiltIcon weight="bold" />}
      >
        {pending ? t("common.sending") : t("common.send")}
      </Button>
    </form>
  );
}
