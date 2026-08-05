"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { startThread } from "../actions";

export type TeacherChoice = {
  membershipId: string;
  name: string;
  title: string | null;
  avatarKey: string | null;
  classes: string[];
  lead: boolean;
};

export type ChildChoice = {
  membershipId: string;
  name: string;
  teachers: TeacherChoice[];
};

/**
 * A pupil or a guardian starting a conversation with a teacher.
 *
 * SEPARATE FROM THE TEACHER'S COMPOSE FORM ON PURPOSE. That one picks a PUPIL
 * out of a class list and is built around searching a roll of thirty; this one
 * picks a TEACHER out of the four or five who teach you. Sharing a component
 * between them would mean a props object where half the fields are inert
 * depending on who is looking at it.
 *
 * IT SAYS WHO ELSE IS IN THE ROOM, before anything is typed. A child writing to
 * a teacher should know their guardians will read it, and a guardian should know
 * their child will — not because either is a problem, but because finding out
 * afterwards is.
 */
export function AskForm({
  children,
  className,
}: {
  /** One entry per child. A pupil messaging their own teachers gets exactly one. */
  children: ChildChoice[];
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [childId, setChildId] = useState(children.length === 1 ? children[0]!.membershipId : "");
  const [teacherId, setTeacherId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const child = children.find((c) => c.membershipId === childId);
  const teachers = child?.teachers ?? [];
  const selfOnly = children.length === 1 && children[0]!.name === "";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!childId) next.child = "Choose who this is about.";
    if (!teacherId) next.teacher = "Choose a teacher.";
    if (subject.trim().length < 2) next.subject = "Give it a short subject.";
    if (body.trim().length < 1) next.body = "Write your message.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await startThread({
        // A pupil's own membership is resolved on the SERVER from their session
        // — sending it from here would be the client naming the person it is
        // about, which is the one thing `createThread` will not accept.
        studentMembershipId: selfOnly ? undefined : childId,
        teacherMembershipId: teacherId,
        subject: subject.trim(),
        body: body.trim(),
      });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      toast({ tone: "ok", title: "Message sent" });
      router.push(`/remarks/${result.threadId}`);
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

      {children.length > 1 && (
        <div>
          <p className="text-sm font-medium text-fg">Which child?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {children.map((c) => (
              <Button
                key={c.membershipId}
                type="button"
                size="sm"
                variant={childId === c.membershipId ? "primary" : "secondary"}
                onClick={() => {
                  setChildId(c.membershipId);
                  setTeacherId("");
                }}
              >
                {c.name}
              </Button>
            ))}
          </div>
          {errors.child && <p className="mt-1.5 text-sm text-danger">{errors.child}</p>}
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-fg">Who are you writing to?</p>
        {teachers.length === 0 ? (
          <p className="mt-1.5 text-sm text-fg-muted">
            No teachers to write to yet — that appears once {selfOnly ? "you are" : "they are"} on a
            class roll.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {teachers.map((t) => (
              <li key={t.membershipId}>
                <button
                  type="button"
                  onClick={() => setTeacherId(t.membershipId)}
                  aria-pressed={teacherId === t.membershipId}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[--radius-md] border p-3 text-left",
                    teacherId === t.membershipId
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <Avatar avatarKey={t.avatarKey} name={t.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">
                      {t.name}
                      {t.lead && <span className="ml-2 text-xs font-normal text-fg-muted">class teacher</span>}
                    </span>
                    <span className="block truncate text-xs text-fg-muted">
                      {t.title ? `${t.title} · ` : ""}
                      {t.classes.join(", ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {errors.teacher && <p className="mt-1.5 text-sm text-danger">{errors.teacher}</p>}
      </div>

      {/*
        WHO ELSE IS IN THE ROOM, said before anything is typed rather than
        discovered afterwards. A pupil should know their guardians read this; a
        guardian should know their child does.
      */}
      <p className="flex items-start gap-2 rounded-[--radius-md] border border-border bg-surface-muted p-3 text-xs leading-relaxed text-fg-muted">
        <UsersThreeIcon weight="duotone" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          {selfOnly ? (
            <>
              This is one conversation between you, your teacher and the grown-ups at home linked to
              you. Everyone in it sees everything.
            </>
          ) : (
            <>
              This is one conversation between you, the teacher and your child. Everyone in it sees
              everything.
            </>
          )}{" "}
          Your school can also read it, as it can any message between staff and families.
        </span>
      </p>

      <TextField
        label="Subject"
        required
        value={subject}
        error={errors.subject}
        maxLength={160}
        placeholder="A question about homework"
        onChange={(e) => setSubject(e.target.value)}
      />

      <TextAreaField
        label="Your message"
        required
        rows={6}
        value={body}
        error={errors.body}
        maxLength={8000}
        onChange={(e) => setBody(e.target.value)}
      />

      <Button
        type="submit"
        loading={pending}
        disabled={pending || teachers.length === 0}
        icon={<PaperPlaneTiltIcon weight="bold" />}
        block
      >
        Send
      </Button>
    </form>
  );
}
