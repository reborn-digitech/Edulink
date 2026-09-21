"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import type { PupilRecordField, PupilRecordSave, PupilRecordView } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { DateField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
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
 * The lists of which fields are required and which optional come from the
 * server page (src/lib/certificate-rules.ts), so this file never has to
 * agree with it by hand.
 */
type FieldGroup = { fields: PupilRecordField[] };

export function PupilRecordForm({ view, required, optional }: { view: PupilRecordView; required: PupilRecordField[]; optional: PupilRecordField[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<PupilRecordField, string>>(() => {
    const r = view.record;
    const all = [...required, ...optional];
    return Object.fromEntries(all.map((f) => [f, r?.[f] ?? ""])) as Record<PupilRecordField, string>;
  });
  const [error, setError] = useState<string | null>(null);

  const isRequired = (f: PupilRecordField) => required.includes(f);
  const groups: FieldGroup[] = [
    { fields: ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue"] },
    { fields: ["religion", "caste", "category"] },
    { fields: ["addressLine", "city", "postalCode"] },
    { fields: ["admissionNumber", "admissionDate", "admittedToGrade", "previousSchool", "penNumber"] },
  ];
  const hintFor: Partial<Record<PupilRecordField, TranslationKey>> = { category: "pupilRecord.categoryHint", admissionNumber: "pupilRecord.admissionNumberHint", penNumber: "pupilRecord.penHint" };
  const maxFor: Partial<Record<PupilRecordField, number>> = { addressLine: 200, postalCode: 12, admissionNumber: 40, admittedToGrade: 20, previousSchool: 160, penNumber: 40 };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input: PupilRecordSave = {};
    for (const f of [...required, ...optional]) {
      const v = values[f].trim();
      if (f === "admissionDate") input.admissionDate = v || null;
      else input[f] = v;
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
            const label = t(`pupilRecord.${f}` as TranslationKey);
            const hint = isRequired(f) ? (hintFor[f] ? t(hintFor[f]!) : undefined) : [t("pupilRecord.optional"), hintFor[f] ? t(hintFor[f]!) : null].filter(Boolean).join(" · ");
            if (f === "admissionDate") {
              return <DateField key={f} label={label} hint={hint} required={isRequired(f)} value={values[f]} disabled={readOnly} onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))} data-testid={`record-${f}`} />;
            }
            return (
              <TextField
                key={f}
                label={label}
                hint={hint}
                required={isRequired(f)}
                value={values[f]}
                maxLength={maxFor[f] ?? 120}
                autoComplete="off"
                readOnly={readOnly}
                disabled={readOnly}
                onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
                data-testid={`record-${f}`}
              />
            );
          })}
        </div>
      ))}

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
