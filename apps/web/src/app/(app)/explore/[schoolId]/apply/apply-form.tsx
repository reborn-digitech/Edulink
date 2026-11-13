"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DateField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import {
  RELATIONS,
  RELATION_KEY,
  type Relation,
} from "@/components/admissions/labels";
import { applyAction } from "@/app/(app)/parent/applications/actions";

/**
 * A guardian's application for a child. The applicant's own name, phone
 * and email come from the account, never from this form; what is asked is
 * the child and where they are coming from. The same child sent twice from
 * a slow connection is one application, and lands on it either way.
 */
export function ApplyForm({
  schoolId,
  cycleId,
  grades,
  existing,
}: {
  schoolId: string;
  cycleId: string;
  grades: string[];
  existing: { id: string; childName: string }[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [grade, setGrade] = useState(grades[0] ?? "");
  const [previousSchool, setPreviousSchool] = useState("");
  const [penNumber, setPenNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [relation, setRelation] = useState<Relation>("PARENT");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    // Each box says what is wrong with it, and the line at the top names the
    // first one (A3-journeys-27) — not "Some of this needs another look." twice.
    const errors: Record<string, string> = {};
    const labels: Record<string, string> = { childName: t("admissions.childName"), grade: t("admissions.gradeApplied"), penNumber: t("admissions.penNumber") };
    if (!childName.trim()) errors.childName = t("refusal.required");
    if (!grade) errors.grade = t("refusal.required");
    const pen = penNumber.replace(/[\s-]/g, "");
    if (pen && !/^\d{11}$/.test(pen)) errors.penNumber = t("pupilRecord.penFormat");
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) {
      setError(t("common.checkField", { field: labels[first]! }));
      return;
    }
    startTransition(async () => {
      const result = await applyAction({
        schoolId,
        cycleId,
        childName: childName.trim().slice(0, 120),
        childBirthdate: birthdate || null,
        gradeApplied: grade,
        ...(previousSchool.trim()
          ? { previousSchool: previousSchool.trim().slice(0, 160) }
          : {}),
        ...(pen ? { penNumber: pen } : {}),
        ...(addressLine.trim()
          ? { addressLine: addressLine.trim().slice(0, 200) }
          : {}),
        ...(city.trim() ? { city: city.trim().slice(0, 120) } : {}),
        ...(note.trim() ? { note: note.trim().slice(0, 2000) } : {}),
        relation,
      });
      if (!result.ok || !result.id) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      const again = existing.some((e) => e.id === result.id);
      toast({
        tone: "ok",
        title: t("admissions.submitted"),
        description: again ? undefined : t("admissions.submittedBody"),
      });
      router.push(`/parent/applications/${result.id}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4"
      data-testid="apply-form"
    >
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("admissions.childName")}
          required
          value={childName}
          maxLength={120}
          autoComplete="off"
          error={fieldErrors.childName}
          onChange={(e) => setChildName(e.target.value)}
          data-testid="apply-child"
        />
        <DateField
          label={t("admissions.childBirthdate")}
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
        <SelectField
          label={t("admissions.gradeApplied")}
          required
          value={grade}
          error={fieldErrors.grade}
          onChange={(e) => setGrade(e.target.value)}
          data-testid="apply-grade"
        >
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t("admissions.relation")}
          value={relation}
          onChange={(e) => setRelation(e.target.value as Relation)}
        >
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {t(RELATION_KEY[r])}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t("admissions.previousSchool")}
          value={previousSchool}
          maxLength={160}
          autoComplete="off"
          onChange={(e) => setPreviousSchool(e.target.value)}
        />
        <TextField
          label={t("admissions.city")}
          value={city}
          maxLength={120}
          autoComplete="off"
          onChange={(e) => setCity(e.target.value)}
        />
        <TextField
          label={t("admissions.penNumber")}
          hint={t("pupilRecord.penHint")}
          value={penNumber}
          maxLength={11}
          inputMode="numeric"
          autoComplete="off"
          error={fieldErrors.penNumber}
          onChange={(e) => setPenNumber(e.target.value)}
          data-testid="apply-pen"
        />
      </div>
      <TextField
        label={t("admissions.address")}
        value={addressLine}
        maxLength={200}
        autoComplete="off"
        onChange={(e) => setAddressLine(e.target.value)}
      />
      <TextAreaField
        label={t("admissions.note")}
        rows={3}
        value={note}
        maxLength={2000}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          loading={pending}
          icon={<PaperPlaneTiltIcon weight="bold" />}
          data-testid="apply-submit"
        >
          {t("admissions.submit")}
        </Button>
      </div>
    </form>
  );
}
