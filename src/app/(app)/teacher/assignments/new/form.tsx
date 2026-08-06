"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { FilePicker } from "@/components/ui/file-picker";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { newAssignment } from "../actions";
import { useT } from "@/lib/i18n";

const CATEGORIES = ["Homework", "Classwork", "Quiz", "Test", "Project", "Reading"];

export function AssignmentForm({
  classes,
  preselected,
  className,
}: {
  classes: { id: string; name: string; studentCount: number }[];
  preselected: string;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [classId, setClassId] = useState(preselected);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Homework");
  const [points, setPoints] = useState("20");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("16:00");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedClass = classes.find((c) => c.id === classId);

  function submit(publish: boolean) {
    setErrors({});

    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = "Give the work a title.";

    const pointsValue = points.trim() === "" ? undefined : Number(points);
    if (pointsValue !== undefined && (!Number.isFinite(pointsValue) || pointsValue < 0)) {
      next.points = "Points must be a number, and cannot be negative.";
    }

    // A date with no time is ambiguous; default to the end of the school day
    // rather than to midnight, which would make everything due "yesterday".
    let dueAt: string | undefined;
    if (dueDate) {
      const combined = new Date(`${dueDate}T${dueTime || "16:00"}:00`);
      if (Number.isNaN(combined.getTime())) next.dueDate = "That is not a real date.";
      else dueAt = combined.toISOString();
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      // FormData so the handouts travel with the assignment and the server
      // mints their ids — the client never names one. (§6)
      const payload = new FormData();
      payload.set("classId", classId);
      payload.set("title", title.trim());
      payload.set("body", body.trim());
      payload.set("category", category || "");
      if (pointsValue !== undefined) payload.set("points", String(pointsValue));
      payload.set("dueAt", dueAt ?? "");
      payload.set("publish", String(publish));
      for (const file of files) payload.append("files", file);

      const result = await newAssignment(payload);

      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: t("teacher.couldNotSave"),
          description: result.errors._form ?? t("teacher.checkHighlighted"),
        });
        return;
      }

      toast({
        tone: "ok",
        title: publish ? t("teacher.workSetToast") : t("teacher.savedAsDraft"),
        description: publish
          ? result.notified === 1
            ? t("teacher.studentsToldOne")
            : t("teacher.studentsToldMany", { count: result.notified ?? 0 })
          : t("teacher.nobodyNotifiedYet"),
      });
      router.push(`/teacher/assignments/${result.assignmentId}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(true);
      }}
      className={cn("space-y-5", className)}
      noValidate
    >
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <SelectField label={t("teacher.classField")} required value={classId} onChange={(e) => setClassId(e.target.value)}>
        {classes.map((klass) => (
          <option key={klass.id} value={klass.id}>
            {klass.name} ({klass.studentCount} student{klass.studentCount === 1 ? "" : "s"})
          </option>
        ))}
      </SelectField>

      <TextField
        label={t("teacher.title")}
        required
        autoFocus
        placeholder={t("teacher.titlePlaceholder")}
        value={title}
        error={errors.title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div>
        <label htmlFor="assignment-body" className="block text-sm font-medium text-fg">
          {t("teacher.instructions")}
        </label>
        <textarea
          id="assignment-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 20_000))}
          rows={5}
          placeholder={t("teacher.instructionsPlaceholder")}
          className="mt-1.5 w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3.5 text-[0.9375rem] leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
        />
        <p className="mt-1 text-xs text-fg-muted">{t("teacher.instructionsHint")}</p>
      </div>

      <FilePicker
        idPrefix="assignment"
        label={t("teacher.handouts")}
        files={files}
        error={errors.files}
        hint={t("teacher.handoutsHint")}
        onChange={(next, error) => {
          setFiles(next);
          setErrors((e) => ({ ...e, files: error ?? "" }));
        }}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label={t("teacher.category")} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>

        <TextField
          label={t("teacher.pointsAvailable")}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          value={points}
          error={errors.points}
          onChange={(e) => setPoints(e.target.value)}
          hint={t("teacher.pointsHint")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <DateField
          label={t("teacher.dueDate")}
          value={dueDate}
          error={errors.dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <TextField
          label={t("teacher.dueTime")}
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          hint={t("teacher.dueTimeHint")}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-5 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          block
          disabled={pending}
          icon={<FloppyDiskIcon weight="bold" />}
          onClick={() => submit(false)}
        >
          {t("teacher.saveAsDraft")}
        </Button>
        <Button
          type="submit"
          block
          loading={pending}
          icon={<PaperPlaneTiltIcon weight="bold" />}
        >
          {pending
            ? t("teacher.settingEllipsis")
            : (selectedClass?.studentCount ?? 0) === 1
              ? t("teacher.publishToOne")
              : t("teacher.publishToMany", { count: selectedClass?.studentCount ?? 0 })}
        </Button>
      </div>
    </form>
  );
}
