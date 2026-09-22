"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlusIcon } from "@phosphor-icons/react";
import type { ApplicationSave } from "@edulink/contracts";
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
import { officeApplyAction } from "../../actions";

type CycleOption = { id: string; name: string; year: string; grades: string[] };

/**
 * The walk-in form. The cycle is chosen first because the grades offered
 * are its own; the applicant's name is required because there is no
 * account behind this application to carry it. Lands on the application
 * so the office can attach the papers the family brought.
 */
export function WalkInForm({ cycles }: { cycles: CycleOption[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? "");
  const cycle = cycles.find((c) => c.id === cycleId) ?? cycles[0] ?? null;
  const [grade, setGrade] = useState(cycle?.grades[0] ?? "");
  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [penNumber, setPenNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<Relation>("PARENT");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function chooseCycle(id: string) {
    setCycleId(id);
    const next = cycles.find((c) => c.id === id);
    if (next && !next.grades.includes(grade)) setGrade(next.grades[0] ?? "");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    const needed = t("common.checkTheForm");
    if (!cycleId) errors.cycle = needed;
    if (!childName.trim()) errors.childName = needed;
    if (!grade) errors.grade = needed;
    if (!applicantName.trim())
      errors.applicantName = t("admissions.refuseApplicantName");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = needed;
    const pen = penNumber.replace(/[\s-]/g, "");
    if (pen && !/^\d{11}$/.test(pen)) errors.penNumber = t("pupilRecord.penFormat");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(needed);
      return;
    }
    const input: ApplicationSave = {
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
      applicantName: applicantName.trim().slice(0, 120),
      ...(phone.trim() ? { applicantPhone: phone.trim().slice(0, 40) } : {}),
      ...(email.trim() ? { applicantEmail: email.trim().slice(0, 200) } : {}),
      relation,
    };
    startTransition(async () => {
      const result = await officeApplyAction(input);
      if (!result.ok || !result.id) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.submitted") });
      router.push(`/admin/admissions/applications/${result.id}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4"
      data-testid="walk-in-form"
    >
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label={t("admissions.cycleLabel")}
          required
          value={cycleId}
          error={fieldErrors.cycle}
          onChange={(e) => chooseCycle(e.target.value)}
          data-testid="walk-in-cycle"
        >
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.name, c.year].join(" · ")}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t("admissions.gradeApplied")}
          required
          value={grade}
          error={fieldErrors.grade}
          onChange={(e) => setGrade(e.target.value)}
          data-testid="walk-in-grade"
        >
          {(cycle?.grades ?? []).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t("admissions.childName")}
          required
          value={childName}
          maxLength={120}
          autoComplete="off"
          error={fieldErrors.childName}
          onChange={(e) => setChildName(e.target.value)}
          data-testid="walk-in-child"
        />
        <DateField
          label={t("admissions.childBirthdate")}
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
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
          data-testid="walk-in-pen"
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
        rows={2}
        value={note}
        maxLength={2000}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("admissions.applicantName")}
          required
          value={applicantName}
          maxLength={120}
          autoComplete="off"
          error={fieldErrors.applicantName}
          onChange={(e) => setApplicantName(e.target.value)}
          data-testid="walk-in-applicant"
        />
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
          label={t("admissions.applicantPhone")}
          type="tel"
          value={phone}
          maxLength={40}
          autoComplete="off"
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField
          label={t("admissions.applicantEmail")}
          type="email"
          value={email}
          maxLength={200}
          autoComplete="off"
          error={fieldErrors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          loading={pending}
          icon={<UserPlusIcon weight="bold" />}
          data-testid="walk-in-submit"
        >
          {t("admissions.walkInSubmit")}
        </Button>
      </div>
    </form>
  );
}
