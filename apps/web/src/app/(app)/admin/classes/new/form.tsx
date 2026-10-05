"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, CopyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { createClass, setClassTeacher } from "../actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { fieldClass } from "@/components/ui/field-class";

/* The swatch labels are the `aria-label` a screen reader announces, so they are
   words rather than decoration — keys, like everything else a reader hears. */
const COLORS: { value: string; nameKey: TranslationKey }[] = [
  { value: "#f59e0b", nameKey: "classes.amber" },
  { value: "#10b981", nameKey: "classes.emerald" },
  { value: "#3b82f6", nameKey: "classes.blue" },
  { value: "#6366f1", nameKey: "classes.indigo" },
  { value: "#ec4899", nameKey: "classes.pink" },
  { value: "#8b5cf6", nameKey: "classes.violet" },
  { value: "#14b8a6", nameKey: "classes.teal" },
  { value: "#ef4444", nameKey: "classes.red" },
];

type Teacher = { membershipId: string; name: string; avatarKey: string | null };

export function ClassForm({
  teachers,
  grades,
  gradeRangeLabel,
  className,
}: {
  teachers: Teacher[];
  /** The grades this school teaches. Empty when the range is non-numeric. */
  grades: string[];
  gradeRangeLabel: string | null;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState(COLORS[0]!.value);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ classId: string; joinCode: string } | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    if (name.trim().length < 1) {
      setErrors({ name: t("classes.needName") });
      return;
    }

    startTransition(async () => {
      const result = await createClass({
        name: name.trim(),
        subject: subject.trim(),
        gradeLevel: gradeLevel.trim(),
        section: section.trim(),
        room: room.trim(),
        color,
      });

      if (!result.ok) {
        // Zod's messages first, this action's keyed ones over the top — see the
        // note on `ClassState` for why they arrive in two pieces.
        setErrors({
          ...result.errors,
          ...Object.fromEntries(
            Object.entries(result.errorKeys ?? {}).map(([field, key]) => [
              field,
              t(key, result.errorVars?.[field]),
            ]),
          ),
        });
        return;
      }

      // Assigning the teacher is a separate, individually-authorised step; a
      // failure here must not make the class itself look like it failed.
      if (teacherId && result.classId) {
        const assigned = await setClassTeacher(result.classId, teacherId, true);
        if (!assigned.ok) {
          toast({
            tone: "warn",
            title: t("classes.createdNotAssigned"),
            description: actionError(t, assigned, "classes.assignFromList"),
          });
        }
      }

      setCreated({ classId: result.classId!, joinCode: result.joinCode! });
      router.refresh();
    });
  }

  if (created) {
    return (
      <div className={cn("rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center", className)}>
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-ok-soft text-ok animate-confetti">
          <CheckCircleIcon weight="fill" className="size-10" />
        </div>
        <h2 className="text-xl font-bold text-fg">{t("classes.ready", { name })}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">{t("classes.readyBody")}</p>

        <div className="mx-auto mt-5 flex max-w-xs items-center gap-2">
          <code className="flex-1 rounded-[var(--radius-md)] border-2 border-dashed border-accent bg-accent-soft px-4 py-3.5 text-xl font-bold tracking-[0.15em] text-accent-strong">
            {created.joinCode}
          </code>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t("classes.copyClassCode")}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(created.joinCode);
                toast({ tone: "ok", title: t("classes.classCodeCopied") });
              } catch {
                toast({
                  tone: "warn",
                  title: t("classes.couldNotCopy"),
                  description: t("classes.selectToCopy"),
                });
              }
            }}
          >
            <CopyIcon weight="bold" className="size-5" />
          </Button>
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Button
            block
            variant="secondary"
            onClick={() => {
              setCreated(null);
              setName("");
              setSubject("");
              setRoom("");
            }}
          >
            {t("classes.createAnother")}
          </Button>
          <Button block onClick={() => router.push("/admin/classes")}>
            {t("classes.done")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label={t("classes.name")}
        required
        autoFocus
        placeholder={t("classes.namePlaceholder")}
        value={name}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
        hint={t("classes.nameHint")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={t("classes.subject")}
          placeholder={t("classes.subjectPlaceholder")}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* A DROPDOWN WHEN WE CAN BUILD ONE, a text box when we cannot. The
            list comes from the grade range set for this school, so a primary
            school is never asked whether it wants a Year 12. A school using
            "LKG" or "Nursery" gets the text box instead — a guessed sequence
            would be worse than no help at all. */}
        {grades.length > 0 ? (
          <label className="block">
            <span className="block text-sm font-medium text-fg">{t("classes.gradeOrYear")}</span>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className={fieldClass("mt-1")}
            >
              <option value="">{t("classes.notTiedToGrade")}</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            {gradeRangeLabel && (
              <span className="mt-1 block text-xs text-fg-muted">
                {t("classes.schoolTeaches", { range: gradeRangeLabel })}
              </span>
            )}
          </label>
        ) : (
          <TextField
            label={t("classes.gradeOrYear")}
            placeholder="5"
            value={gradeLevel}
            error={errors.gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            hint={
              gradeRangeLabel
                ? t("classes.schoolTeaches", { range: gradeRangeLabel })
                : t("classes.noGradeRange")
            }
          />
        )}
      </div>

      <TextField
        label={t("classes.sectionOptional")}
        placeholder="A"
        value={section}
        onChange={(e) => setSection(e.target.value)}
        hint={t("classes.sectionHint")}
      />

      <TextField
        label={t("classes.roomLabel")}
        placeholder="B12"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />

      <fieldset>
        <legend className="text-sm font-medium text-fg">{t("classes.colour")}</legend>
        <p className="mt-0.5 text-xs text-fg-muted">{t("classes.colourHint")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setColor(option.value)}
              aria-pressed={color === option.value}
              aria-label={t(option.nameKey)}
              className={cn(
                "grid size-11 place-items-center rounded-full transition-transform active:scale-90",
                color === option.value && "ring-2 ring-accent ring-offset-2 ring-offset-[var(--surface)]",
              )}
            >
              <span className="size-7 rounded-full" style={{ backgroundColor: option.value }} />
              {color === option.value && (
                <CheckCircleIcon
                  weight="fill"
                  className="absolute size-4 text-white mix-blend-difference"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      </fieldset>

      {teachers.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-fg">{t("classes.classTeacher")}</legend>
          <p className="mt-0.5 text-xs text-fg-muted">{t("classes.classTeacherHint")}</p>
          <div className="mt-2 space-y-1.5">
            {teachers.map((teacher) => (
              <button
                key={teacher.membershipId}
                type="button"
                onClick={() =>
                  setTeacherId((current) =>
                    current === teacher.membershipId ? null : teacher.membershipId,
                  )
                }
                aria-pressed={teacherId === teacher.membershipId}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-md)] border p-2.5 text-left transition-colors",
                  teacherId === teacher.membershipId
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                <Avatar avatarKey={teacher.avatarKey} name={teacher.name} size="sm" />
                <span className="flex-1 text-sm font-medium text-fg">{teacher.name}</span>
                {teacherId === teacher.membershipId && (
                  <CheckCircleIcon weight="fill" className="size-5 text-accent-strong" />
                )}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <Button type="submit" block size="lg" loading={pending}>
        {pending ? t("classes.creating") : t("classes.createAction")}
      </Button>
    </form>
  );
}
