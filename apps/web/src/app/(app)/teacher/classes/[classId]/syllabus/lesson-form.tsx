"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { saveLessonPlanAction } from "./actions";

type LessonStatus = "PLANNED" | "TAUGHT" | "SKIPPED";

/**
 * Plan a lesson ahead, or log one just taught: the same form, the status
 * deciding which the button says. The chapter is optional — a revision day
 * or a test is a lesson with no chapter — and the day defaults to today in
 * the school's zone, which the page passes in.
 */
export function LessonForm({ classId, subject, today, units }: { classId: string; subject: string; today: string; units: { id: string; title: string }[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [dateKey, setDateKey] = useState(today);
  const [unitId, setUnitId] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState<LessonStatus>("PLANNED");
  const [error, setError] = useState<string | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setTopicError(null);
    if (!topic.trim()) {
      setTopicError(t("common.checkTheForm"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setError(t("common.checkTheForm"));
      return;
    }
    startTransition(async () => {
      const result = await saveLessonPlanAction({ classId, subject, unitId: unitId || null, dateKey, topic: topic.trim(), notes: notes.trim(), homework: homework.trim(), status });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("syllabus.lessonSaved") });
      setTopic("");
      setNotes("");
      setHomework("");
      setStatus("PLANNED");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3" data-testid="lesson-form">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <DateField label={t("syllabus.lessonDate")} required value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
        <SelectField label={t("syllabus.lessonUnit")} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="">{t("syllabus.lessonNoUnit")}</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField label={t("syllabus.lessonTopic")} required maxLength={160} autoComplete="off" value={topic} error={topicError ?? undefined} onChange={(e) => setTopic(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextAreaField label={t("syllabus.lessonNotes")} rows={3} maxLength={2000} placeholder={t("common.optional")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <TextAreaField label={t("syllabus.lessonHomework")} rows={3} maxLength={1000} placeholder={t("common.optional")} value={homework} onChange={(e) => setHomework(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
        <SelectField label={t("syllabus.lessonStatus")} value={status} onChange={(e) => setStatus(e.target.value as LessonStatus)}>
          <option value="PLANNED">{t("syllabus.planned")}</option>
          <option value="TAUGHT">{t("syllabus.taught")}</option>
          <option value="SKIPPED">{t("syllabus.skipped")}</option>
        </SelectField>
        <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
          {status === "TAUGHT" ? t("syllabus.logLesson") : t("syllabus.planLesson")}
        </Button>
      </div>
    </form>
  );
}
