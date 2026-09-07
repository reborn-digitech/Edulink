"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, PaperPlaneTiltIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { submitWork } from "./actions";
import { useT } from "@/lib/i18n";

/**
 * Hand-in panel, collapsed until the student opens it.
 *
 * Kept deliberately plain: a text box and one button. File attachments are a
 * later increment, and pretending to offer them with a disabled control would
 * be worse than not showing them.
 */
export function SubmitPanel({
  assignmentId,
  title,
  submittedAt,
  existingBody,
}: {
  assignmentId: string;
  title: string;
  submittedAt: Date | null;
  existingBody: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(existingBody);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(Boolean(submittedAt));

  function submit() {
    if (body.trim().length === 0) {
      setError(t("student.writeBeforeHandIn"));
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitWork({ assignmentId, body: body.trim() });
      if (!result.ok) {
        setError(result.error ?? t("student.notGoThrough"));
        return;
      }
      setDone(true);
      setOpen(false);
      toast({
        tone: "ok",
        title: t("student.handedInCheer"),
        description: t("student.teacherTold", { title }),
      });
      router.refresh();
    });
  }

  if (done && !open) {
    return (
      <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-[--radius-md] bg-ok-soft p-2.5">
        <CheckCircleIcon weight="fill" className="size-5 shrink-0 text-ok" />
        <p className="min-w-0 flex-1 text-sm font-medium text-ok">{t("student.handedIn")}</p>
        <Button
          size="sm"
          variant="ghost"
          icon={<PencilSimpleIcon weight="bold" />}
          onClick={() => setOpen(true)}
        >
          {t("student.changeIt")}
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="soft"
        className="mt-2.5"
        icon={<PaperPlaneTiltIcon weight="bold" />}
        onClick={() => setOpen(true)}
      >
        {t("student.handItIn")}
      </Button>
    );
  }

  return (
    <div className="mt-2.5 space-y-2 rounded-[--radius-md] border border-accent bg-accent-soft/40 p-3">
      <label htmlFor={`submit-${assignmentId}`} className="block text-sm font-medium text-fg">
        {t("student.yourAnswer")}
      </label>
      <textarea
        id={`submit-${assignmentId}`}
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, 20_000));
          if (error) setError(null);
        }}
        rows={5}
        autoFocus
        placeholder={t("student.answerPlaceholder")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `submit-error-${assignmentId}` : undefined}
        className={cn(
          "w-full resize-y rounded-[--radius-sm] border bg-surface p-3 text-[0.9375rem] leading-relaxed outline-none",
          error ? "border-danger ring-2 ring-danger/25" : "border-border focus:border-accent",
        )}
      />

      {error && (
        <p
          id={`submit-error-${assignmentId}`}
          role="alert"
          className="text-xs font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          block
          onClick={() => {
            setOpen(false);
            setBody(existingBody);
            setError(null);
          }}
        >
          {t("student.cancel")}
        </Button>
        <Button
          size="sm"
          block
          loading={pending}
          icon={<PaperPlaneTiltIcon weight="bold" />}
          onClick={submit}
        >
          {done ? t("student.changeIt") : t("student.handItIn")}
        </Button>
      </div>
    </div>
  );
}
