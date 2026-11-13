"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { BookmarkSimpleIcon, CopyIcon, TrashIcon } from "@phosphor-icons/react";
import type { PlanTemplate } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { DateField, SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { applyPlanTemplateAction, deletePlanTemplateAction, savePlanTemplateAction } from "./actions";

/** "Keep as template" beside a lesson: one press copies its words into the school's templates under the plan's topic. */
export function SaveTemplateButton({ lessonId, topic }: { lessonId: string; topic: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const label = [t("planTemplates.keep"), topic].join(": ");
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      loading={pending}
      aria-label={label}
      icon={<BookmarkSimpleIcon weight="bold" />}
      onClick={() =>
        startTransition(async () => {
          const result = await savePlanTemplateAction({ lessonId });
          if (!result.ok) {
            toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
            return;
          }
          toast({ tone: "ok", title: t("planTemplates.kept") });
          router.refresh();
        })
      }
    >
      {t("planTemplates.keep")}
    </Button>
  );
}

/**
 * The school's templates for this subject and a form to copy one into this
 * class: the template, the chapter it goes under, the day. Copying makes a
 * new planned lesson; the template is untouched and unlinked. The author
 * (or the office) may take a template out of the list.
 */
export function ApplyTemplatePanel({ classId, templates, units, today }: { classId: string; templates: PlanTemplate[]; units: { id: string; title: string }[]; today: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [unitId, setUnitId] = useState("");
  const [dateKey, setDateKey] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const chosen = templates.find((x) => x.id === templateId) ?? null;

  if (templates.length === 0) return <p className="text-sm text-fg-muted">{t("planTemplates.none")}</p>;

  function apply() {
    setError(null);
    startTransition(async () => {
      const result = await applyPlanTemplateAction({ templateId, classId, unitId: unitId || null, dateKey });
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t("planTemplates.applied") });
      router.refresh();
    });
  }

  function remove() {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePlanTemplateAction({ templateId: chosen.id });
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t("planTemplates.removed") });
      setTemplateId(templates.find((x) => x.id !== chosen.id)?.id ?? "");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      noValidate
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField label={t("planTemplates.template")} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((x) => (
            <option key={x.id} value={x.id}>
              {x.own ? t("planTemplates.ownLabel", { title: x.title }) : t("planTemplates.othersLabel", { title: x.title, name: x.authorName })}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("syllabus.lessonUnit")} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="">{t("syllabus.lessonNoUnit")}</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </SelectField>
        <DateField label={t("syllabus.lessonDate")} value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
      </div>
      {chosen && (
        <div className="rounded-[var(--radius-md)] bg-surface-muted p-3 text-sm">
          <p className="font-medium text-fg">{chosen.topic}</p>
          {chosen.notes && <p className="mt-1 whitespace-pre-line text-fg-muted">{chosen.notes}</p>}
          {chosen.homework && (
            <p className="mt-1 text-fg-muted">
              <span className="font-medium">{t("syllabus.lessonHomework")}:</span> {chosen.homework}
            </p>
          )}
          <p className="mt-1 text-xs text-fg-subtle">{[chosen.subject, chosen.grade ? t("planTemplates.forGrade", { grade: chosen.grade }) : null, t("syllabus.byTeacher", { name: chosen.authorName })].filter(Boolean).join(" · ")}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" loading={pending} disabled={!templateId} icon={<CopyIcon weight="bold" />}>
          {t("planTemplates.apply")}
        </Button>
        {chosen?.own && (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={remove} icon={<TrashIcon weight="bold" />}>
            {t("planTemplates.remove")}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
