"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, PaperPlaneTiltIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { startThread } from "../actions";

type Student = {
  membershipId: string;
  name: string;
  fullName: string;
  avatarKey: string | null;
  className: string;
  guardianCount: number;
};

const SUGGESTIONS = [
  "A quick update",
  "Something lovely today",
  "A small concern",
  "Homework check-in",
  "Absence follow-up",
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
    if (!studentId) next.studentMembershipId = "Choose a student.";
    if (subject.trim().length < 2) next.subject = "Give it a short subject.";
    if (body.trim().length < 1) next.body = "Write your message.";
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
          title: "Could not send",
          description: result.errors._form ?? "Check the highlighted fields.",
        });
        return;
      }

      toast({ tone: "ok", title: "Message sent", description: "Their guardians are notified." });
      router.push(`/remarks/${result.threadId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className={cn("space-y-6", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-fg">Which student?</legend>

        <div className="relative mt-2">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a student…"
            aria-label="Search students"
            className="min-h-12 w-full rounded-[--radius-md] border border-border bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-3 rounded-[--radius-md] bg-surface-muted p-4 text-center text-sm text-fg-muted">
            Nobody matches &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label="Choose a student"
            className="mt-2 max-h-64 space-y-1.5 overflow-y-auto rounded-[--radius-md] border border-border p-2 scrollbar-thin"
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
                    "flex w-full items-center gap-3 rounded-[--radius-sm] p-2.5 text-left transition-colors",
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
                      No guardian
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
        <p className="flex items-start gap-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft p-3.5 text-sm text-warn">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>{selected.fullName}</strong> has no guardian linked yet, so nobody will
            receive this. The thread will be waiting for them when someone links.
          </span>
        </p>
      )}

      <div>
        <TextField
          label="Subject"
          required
          placeholder="A quick update"
          value={subject}
          error={errors.subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={160}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setSubject(suggestion)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="remark-body" className="block text-sm font-medium text-fg">
          Message <span className="text-danger">*</span>
        </label>
        <textarea
          id="remark-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 8000))}
          rows={6}
          placeholder="Hello — I wanted to let you know…"
          aria-invalid={Boolean(errors.body) || undefined}
          className={cn(
            "mt-1.5 w-full resize-y rounded-[--radius-md] border bg-surface p-3.5 text-[0.9375rem] leading-relaxed outline-none",
            errors.body
              ? "border-danger ring-2 ring-danger/25"
              : "border-border focus:border-accent focus:ring-2 focus:ring-accent-ring/40",
          )}
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
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
