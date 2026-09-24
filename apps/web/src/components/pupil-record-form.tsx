"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { CWSN_TYPES, RECORD_BLOOD_GROUPS, type PupilRecordField, type PupilRecordSave, type PupilRecordView, PUPIL_CATEGORIES, PUPIL_RELIGIONS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { CWSN_TYPE_NAMES } from "@/lib/filing-codes";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { savePupilRecordAction } from "@/app/(app)/parent/record/actions";

/**
 * The pupil record as a form: the identity and admission details a
 * certificate names, written by the family or corrected by the office
 * through the same fields. The fields a certificate needs are marked
 * required; the rest say so. The date of birth is shown, never edited —
 * it lives on the account under birthdate.ts's own rules.
 *
 * The lists of which fields are required, which optional and which belong
 * to the filing group come from the server page
 * (src/lib/certificate-rules.ts), so this file never has to agree with it
 * by hand. The filing group holds what UDISE+ and the boards ask beyond a
 * certificate — coded answers picked from the portal's own lists, sent as
 * the same strings every other field is, a blank clearing the value.
 */
type FieldGroup = { fields: PupilRecordField[] };

export function PupilRecordForm({ view, required, optional, filing = [], admin = false, office = false }: { view: PupilRecordView; required: PupilRecordField[]; optional: PupilRecordField[]; filing?: PupilRecordField[]; admin?: boolean; office?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const all = [...required, ...optional, ...filing];
  const [values, setValues] = useState<Record<PupilRecordField, string>>(() => {
    const r = view.record;
    return Object.fromEntries(all.map((f) => [f, r?.[f] ?? ""])) as Record<PupilRecordField, string>;
  });
  const [error, setError] = useState<string | null>(null);

  const isRequired = (f: PupilRecordField) => required.includes(f);
  const groups: FieldGroup[] = [
    { fields: ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue"] },
    { fields: ["religion", "caste", "category"] },
    { fields: ["addressLine", "city", "postalCode"] },
    { fields: ["admissionNumber", "admissionDate", "admittedToGrade", "rollNumber", "previousSchool", "previousSchoolTcNumber", "previousSchoolTcDate", "penNumber"] },
    // The household, as the RTE and EWS verifications ask for it.
    { fields: ["fatherOccupation", "motherOccupation", "annualIncome"] },
  ];
  const hintFor: Partial<Record<PupilRecordField, TranslationKey>> = { category: "pupilRecord.categoryHint", admissionNumber: "pupilRecord.admissionNumberHint", penNumber: "pupilRecord.penHint", nameLocal: "pupilRecord.nameLocalHint", cwsnType: "pupilRecord.cwsnHint", previousSchoolTcNumber: "pupilRecord.tcHint", annualIncome: "pupilRecord.annualIncomeHint", rollNumber: "pupilRecord.rollNumberHint" };
  const maxFor: Partial<Record<PupilRecordField, number>> = { addressLine: 200, postalCode: 12, admissionNumber: 40, admittedToGrade: 20, previousSchool: 160, penNumber: 11, previousSchoolTcNumber: 40, fatherOccupation: 120, motherOccupation: 120, annualIncome: 9, rollNumber: 4 };
  /** The coded filing answers: the value the contract takes and the words the reader sees. */
  const choicesFor: Partial<Record<PupilRecordField, { value: string; text: string }[]>> = {
    gender: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "M", text: t("pupilRecord.genderM") }, { value: "F", text: t("pupilRecord.genderF") }, { value: "T", text: t("pupilRecord.genderT") }],
    bpl: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    ews: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    cwsnType: [{ value: "", text: t("pupilRecord.cwsnNone") }, ...CWSN_TYPES.map((code) => ({ value: code, text: `${code} — ${CWSN_TYPE_NAMES[code] ?? ""}` }))],
    bloodGroup: [{ value: "", text: t("pupilRecord.notSaid") }, ...RECORD_BLOOD_GROUPS.map((g) => ({ value: g, text: g }))],
    // Coded so the filings are exact; a value typed before the codes shows as itself until it is picked again.
    category: [{ value: "", text: t("pupilRecord.notSaid") }, ...PUPIL_CATEGORIES.map((c) => ({ value: c, text: t(`pupilRecord.cat${c === "GENERAL" ? "General" : c}` as TranslationKey) })), ...(values.category && !(PUPIL_CATEGORIES as readonly string[]).includes(values.category) ? [{ value: values.category, text: values.category }] : [])],
    religion: [{ value: "", text: t("pupilRecord.notSaid") }, ...PUPIL_RELIGIONS.map((r) => ({ value: r, text: t(`pupilRecord.rel${r[0]}${r.slice(1).toLowerCase()}` as TranslationKey) })), ...(values.religion && !(PUPIL_RELIGIONS as readonly string[]).includes(values.religion) ? [{ value: values.religion, text: values.religion }] : [])],
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: PupilRecordSave = {};
    for (const f of all) {
      // The PEN is the admin's to enter once; after that it changes only
      // through a correction the head and a guardian approve, so a locked
      // number is not sent back at all.
      if (f === "penNumber" && !view.penEditable) continue;
      // The roll number is the office's; a family's form shows it and never sends it.
      if (f === "rollNumber" && !office) continue;
      const v = values[f].trim();
      if (f === "admissionDate") input.admissionDate = v || null;
      else if (f === "previousSchoolTcDate") input.previousSchoolTcDate = v || null;
      else (input as Record<string, string>)[f] = v;
    }
    startTransition(async () => {
      const result = await savePupilRecordAction(view.studentMembershipId, input);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("pupilRecord.saved") });
      router.refresh();
    });
  }

  const readOnly = !view.canEdit;

  const field = (f: PupilRecordField, hint: string | undefined) => {
    const label = t(`pupilRecord.${f}` as TranslationKey);
    if (f === "penNumber" && !view.penEditable) {
      // Shown, never typed: the office entered it once, or has yet to.
      const locked = values.penNumber ? t(admin ? "pupilRecord.penEnteredBy" : "pupilRecord.penLocked") : t("pupilRecord.penOnlyAdmin");
      return <TextField key={f} label={label} hint={locked} value={values.penNumber || "—"} readOnly disabled autoComplete="off" data-testid={`record-${f}`} data-locked="true" />;
    }
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [f]: e.target.value }));
    if (f === "rollNumber" && !office) {
      return <TextField key={f} label={label} hint={t("pupilRecord.rollNumberOffice")} value={values.rollNumber || "—"} readOnly disabled autoComplete="off" data-testid={`record-${f}`} data-locked="true" />;
    }
    if (f === "admissionDate" || f === "previousSchoolTcDate") {
      return <DateField key={f} label={label} hint={hint} required={isRequired(f)} value={values[f]} disabled={readOnly} onChange={onChange} data-testid={`record-${f}`} />;
    }
    const choices = choicesFor[f];
    if (choices) {
      return (
        <SelectField key={f} label={label} hint={hint} value={values[f]} disabled={readOnly} onChange={onChange} data-testid={`record-${f}`}>
          {choices.map((c) => (
            <option key={c.value || "none"} value={c.value}>
              {c.text}
            </option>
          ))}
        </SelectField>
      );
    }
    return (
      <TextField
        key={f}
        label={label}
        hint={hint}
        required={isRequired(f)}
        value={values[f]}
        maxLength={maxFor[f] ?? 120}
        inputMode={f === "annualIncome" || f === "rollNumber" ? "numeric" : undefined}
        autoComplete="off"
        readOnly={readOnly}
        disabled={readOnly}
        onChange={onChange}
        data-testid={`record-${f}`}
      />
    );
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="pupil-record-form">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* The date of birth: shown, never edited here. */}
      <TextField label={t("pupilRecord.dob")} value={view.birthdate ?? "—"} readOnly disabled hint={t("pupilRecord.dobNote")} className="max-w-xs" />

      {groups.map((group, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-2">
          {group.fields.map((f) => {
            const hint = isRequired(f) ? (hintFor[f] ? t(hintFor[f]!) : undefined) : [t("pupilRecord.optional"), hintFor[f] ? t(hintFor[f]!) : null].filter(Boolean).join(" · ");
            return field(f, hint);
          })}
        </div>
      ))}

      {filing.length > 0 && (
        <fieldset className="space-y-3 rounded-[--radius-md] border border-border p-4" data-testid="record-filing-section">
          <legend className="px-1 text-sm font-semibold text-fg">{t("pupilRecord.filingSection")}</legend>
          <p className="text-xs leading-relaxed text-fg-muted">{t("pupilRecord.filingIntro")}</p>
          <div className="grid gap-3 sm:grid-cols-2">{filing.map((f) => field(f, hintFor[f] ? t(hintFor[f]!) : undefined))}</div>
        </fieldset>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />} data-testid="record-save">
            {t("pupilRecord.save")}
          </Button>
        </div>
      )}
    </form>
  );
}
