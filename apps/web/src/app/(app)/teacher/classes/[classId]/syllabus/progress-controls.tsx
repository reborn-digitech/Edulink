"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { saveSyllabusProgressAction, setLessonStatusAction } from "./actions";

type UnitStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";
type LessonStatus = "PLANNED" | "TAUGHT" | "SKIPPED";

const UNIT_STATUSES: readonly { status: UnitStatus; labelKey: TranslationKey; on: string }[] = [
  { status: "NOT_STARTED", labelKey: "syllabus.markNotStarted", on: "border-border-strong bg-surface-muted font-medium text-fg" },
  { status: "IN_PROGRESS", labelKey: "syllabus.markInProgress", on: "border-accent bg-accent-soft font-medium text-accent-strong" },
  { status: "DONE", labelKey: "syllabus.markDone", on: "border-ok bg-ok-soft font-medium text-ok" },
];

const LESSON_STATUSES: readonly { status: LessonStatus; labelKey: TranslationKey; on: string }[] = [
  { status: "PLANNED", labelKey: "syllabus.markPlanned", on: "border-border-strong bg-surface-muted font-medium text-fg" },
  { status: "TAUGHT", labelKey: "syllabus.markTaught", on: "border-ok bg-ok-soft font-medium text-ok" },
  { status: "SKIPPED", labelKey: "syllabus.markSkipped", on: "border-warn bg-warn-soft font-medium text-warn" },
];

const pill = (on: boolean, onClass: string) =>
  `min-h-9 rounded-full border px-3 text-xs transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60 ${on ? onClass : "border-border text-fg-muted"}`;

/**
 * Where a chapter is for this class: three pressed-state buttons in a
 * fieldset whose legend names the chapter, so a screen reader hears "Where
 * we are, Fractions" before "Done". One tap saves; the page refreshes to
 * show who moved it and when.
 */
export function UnitStatusControl({ classId, unitId, title, status }: { classId: string; unitId: string; title: string; status: UnitStatus }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(next: UnitStatus) {
    if (next === status || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await saveSyllabusProgressAction({ classId, unitId, status: next });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("syllabus.progressSaved") });
      router.refresh();
    });
  }

  return (
    <fieldset className="space-y-1" disabled={pending} aria-busy={pending || undefined}>
      <legend className="sr-only">
        {t("syllabus.status")}: {title}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {UNIT_STATUSES.map((s) => (
          <button key={s.status} type="button" aria-pressed={s.status === status} className={pill(s.status === status, s.on)} onClick={() => set(s.status)}>
            {t(s.labelKey)}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** A lesson's status, the same shape: planned, taught, skipped. Marking taught nudges its chapter to in progress on the server. */
export function LessonStatusControl({ lessonId, topic, status }: { lessonId: string; topic: string; status: LessonStatus }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(next: LessonStatus) {
    if (next === status || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await setLessonStatusAction({ lessonId, status: next });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("syllabus.lessonSaved") });
      router.refresh();
    });
  }

  return (
    <fieldset className="space-y-1" disabled={pending} aria-busy={pending || undefined}>
      <legend className="sr-only">
        {t("syllabus.lessonStatus")}: {topic}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {LESSON_STATUSES.map((s) => (
          <button key={s.status} type="button" aria-pressed={s.status === status} className={pill(s.status === status, s.on)} onClick={() => set(s.status)}>
            {t(s.labelKey)}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
