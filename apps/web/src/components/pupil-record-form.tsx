"use client";

import { CWSN_NONE, MOTHER_TONGUES, NATIONALITIES, PUPIL_STREAMS, RECORD_CHANGE_FIELDS } from "@edulink/contracts";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon, PaperPlaneTiltIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import { CWSN_TYPES, RECORD_BLOOD_GROUPS, type PupilRecordField, type PupilRecordSave, type PupilRecordView, PUPIL_CATEGORIES, PUPIL_RELIGIONS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { LANGUAGE_KEY, NATIONALITY_KEY } from "@/components/pupil-record-words";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { CWSN_TYPE_NAMES } from "@/lib/filing-codes";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { fileRecordChangeAction, savePupilRecordAction } from "@/app/(app)/parent/record/actions";

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
 *
 * WHO WRITES: the office form (`office`) has every field and saves them.
 * A family's form — a guardian's or the pupil's own — is READ-ONLY until
 * "Ask for a change" is pressed; then every field but the PEN, the roll
 * number and "repeating" can be typed in, a reason is asked for, and the
 * form sends the office only the fields that differ from the record. The
 * record itself does not change until the office approves
 * (src/lib/record-changes.ts); the server refuses a family's save outright.
 */
type FieldGroup = { fields: PupilRecordField[] };
const ASKABLE: ReadonlySet<PupilRecordField> = new Set<PupilRecordField>(RECORD_CHANGE_FIELDS);


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
  // The family's form: read first, and typed in only once they have said they want something changed.
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const initial = (f: PupilRecordField) => view.record?.[f] ?? "";

  const isRequired = (f: PupilRecordField) => required.includes(f);
  const groups: FieldGroup[] = [
    { fields: ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue"] },
    { fields: ["religion", "caste", "category"] },
    { fields: ["addressLine", "city", "postalCode", "guardianPhone"] },
    { fields: ["admissionNumber", "admissionDate", "admittedToGrade", "rollNumber", "previousSchool", "previousSchoolTcNumber", "previousSchoolTcDate", "penNumber"] },
    // The household, as the RTE and EWS verifications ask for it.
    { fields: ["fatherOccupation", "motherOccupation", "annualIncome"] },
  ];
  const hintFor: Partial<Record<PupilRecordField, TranslationKey>> = { alternatePhone: "pupilRecord.alternatePhoneHint", stream: "pupilRecord.streamHint", vocationalTradeId: "pupilRecord.vocationalIdHint", vocationalJobRoleId: "pupilRecord.vocationalIdHint", rte: "pupilRecord.rteHint", repeating: "pupilRecord.repeatingHint", postalCode: "pupilRecord.pinHint", guardianPhone: "pupilRecord.guardianPhoneHint", category: "pupilRecord.categoryHint", admissionNumber: "pupilRecord.admissionNumberHint", penNumber: "pupilRecord.penHint", nameLocal: "pupilRecord.nameLocalHint", cwsnType: "pupilRecord.cwsnHint", previousSchoolTcNumber: "pupilRecord.tcHint", annualIncome: "pupilRecord.annualIncomeHint", rollNumber: "pupilRecord.rollNumberHint" };
  const maxFor: Partial<Record<PupilRecordField, number>> = { alternatePhone: 24, vocationalTradeId: 20, vocationalJobRoleId: 20, guardianPhone: 24, addressLine: 200, postalCode: 12, admissionNumber: 40, admittedToGrade: 20, previousSchool: 160, penNumber: 11, previousSchoolTcNumber: 40, fatherOccupation: 120, motherOccupation: 120, annualIncome: 9, rollNumber: 4 };
  /** The coded filing answers: the value the contract takes and the words the reader sees. */
  const choicesFor: Partial<Record<PupilRecordField, { value: string; text: string }[]>> = {
    gender: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "M", text: t("pupilRecord.genderM") }, { value: "F", text: t("pupilRecord.genderF") }, { value: "T", text: t("pupilRecord.genderT") }],
    bpl: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    ews: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    rte: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    repeating: [{ value: "no", text: t("pupilRecord.no") }, { value: "yes", text: t("pupilRecord.yes") }],
    freeUniform: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    freeTextbook: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    extracurricular: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    vocationalCourse: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    vocationalExamAppeared: [{ value: "", text: t("pupilRecord.notSaid") }, { value: "yes", text: t("pupilRecord.yes") }, { value: "no", text: t("pupilRecord.no") }],
    stream: [{ value: "", text: t("pupilRecord.notSaid") }, ...PUPIL_STREAMS.map((code) => ({ value: code, text: t(`pupilRecord.stream${code}` as TranslationKey) }))],
    cwsnType: [{ value: "", text: t("pupilRecord.notSaid") }, { value: CWSN_NONE, text: t("pupilRecord.cwsnNone") }, ...CWSN_TYPES.map((code) => ({ value: code, text: `${code} — ${CWSN_TYPE_NAMES[code] ?? ""}` }))],
    bloodGroup: [{ value: "", text: t("pupilRecord.notSaid") }, ...RECORD_BLOOD_GROUPS.map((g) => ({ value: g, text: g }))],
    // Names from a list, so a sheet reads one spelling; a word typed before the list shows as itself until one is picked.
    motherTongue: [{ value: "", text: t("pupilRecord.notSaid") }, ...MOTHER_TONGUES.map((c) => ({ value: c as string, text: t(LANGUAGE_KEY[c]) })), ...(values.motherTongue && !(MOTHER_TONGUES as readonly string[]).includes(values.motherTongue) ? [{ value: values.motherTongue, text: values.motherTongue }] : [])],
    nationality: [{ value: "", text: t("pupilRecord.notSaid") }, ...NATIONALITIES.map((c) => ({ value: c as string, text: t(NATIONALITY_KEY[c]) })), ...(values.nationality && !(NATIONALITIES as readonly string[]).includes(values.nationality) ? [{ value: values.nationality, text: values.nationality }] : [])],
    // Coded so the filings are exact; a value typed before the codes shows as itself until it is picked again.
    category: [{ value: "", text: t("pupilRecord.notSaid") }, ...PUPIL_CATEGORIES.map((c) => ({ value: c, text: t(`pupilRecord.cat${c === "GENERAL" ? "General" : c}` as TranslationKey) })), ...(values.category && !(PUPIL_CATEGORIES as readonly string[]).includes(values.category) ? [{ value: values.category, text: values.category }] : [])],
    religion: [{ value: "", text: t("pupilRecord.notSaid") }, ...PUPIL_RELIGIONS.map((r) => ({ value: r, text: t(`pupilRecord.rel${r[0]}${r.slice(1).toLowerCase()}` as TranslationKey) })), ...(values.religion && !(PUPIL_RELIGIONS as readonly string[]).includes(values.religion) ? [{ value: values.religion, text: values.religion }] : [])],
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!office) return ask();
    const input: PupilRecordSave = {};
    for (const f of all) {
      // The PEN is the admin's to enter once; after that it changes only
      // through a correction the head and a guardian approve, so a locked
      // number is not sent back at all.
      if (f === "penNumber" && !view.penEditable) continue;
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

  /** The family's ask: only what differs from the record, and why. */
  function ask() {
    const changes: Record<string, string | null> = {};
    for (const f of all) {
      if (!ASKABLE.has(f)) continue;
      const v = values[f].trim();
      if (v === initial(f).trim()) continue;
      changes[f] = (f === "admissionDate" || f === "previousSchoolTcDate") && !v ? null : v;
    }
    if (Object.keys(changes).length === 0) {
      setError(t("recordChanges.nothingChanges"));
      return;
    }
    if (!reason.trim()) {
      setError(t("common.checkTheForm"));
      return;
    }
    startTransition(async () => {
      const result = await fileRecordChangeAction(view.studentMembershipId, { changes, reason: reason.trim() });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("recordChanges.sent") });
      setAsking(false);
      setReason("");
      router.refresh();
    });
  }

  function stopAsking() {
    setAsking(false);
    setError(null);
    setReason("");
    setValues(Object.fromEntries(all.map((f) => [f, initial(f)])) as Record<PupilRecordField, string>);
  }

  const readOnly = office ? !view.canEdit : !asking;

  const field = (f: PupilRecordField, hint: string | undefined) => {
    const label = t(`pupilRecord.${f}` as TranslationKey);
    if (f === "penNumber" && !view.penEditable) {
      // Shown, never typed: the office entered it once, or has yet to.
      const locked = values.penNumber ? t(admin ? "pupilRecord.penEnteredBy" : "pupilRecord.penLocked") : t("pupilRecord.penOnlyAdmin");
      return <TextField key={f} label={label} hint={locked} value={values.penNumber || "—"} readOnly disabled autoComplete="off" data-testid={`record-${f}`} data-locked="true" />;
    }
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [f]: e.target.value }));
    if (!office && (!asking || !ASKABLE.has(f))) {
      // Read, not typed: the whole record until the family asks for a change, and the enrolment's two fields always.
      const shown = choicesFor[f]?.find((c) => c.value === values[f] && c.value !== "")?.text ?? values[f];
      return <TextField key={f} label={label} hint={asking ? t("pupilRecord.rollNumberOffice") : undefined} value={shown || "—"} readOnly disabled autoComplete="off" data-testid={`record-${f}`} data-locked="true" />;
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
        inputMode={f === "annualIncome" || f === "rollNumber" || f === "postalCode" ? "numeric" : f === "guardianPhone" || f === "alternatePhone" ? "tel" : undefined}
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
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
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
        <fieldset className="space-y-3 rounded-[var(--radius-md)] border border-border p-4" data-testid="record-filing-section">
          <legend className="px-1 text-sm font-semibold text-fg">{t("pupilRecord.filingSection")}</legend>
          <p className="text-xs leading-relaxed text-fg-muted">{t("pupilRecord.filingIntro")}</p>
          <div className="grid gap-3 sm:grid-cols-2">{filing.map((f) => field(f, hintFor[f] ? t(hintFor[f]!) : undefined))}</div>
        </fieldset>
      )}

      {office && !readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />} data-testid="record-save">
            {t("pupilRecord.save")}
          </Button>
        </div>
      )}

      {!office && view.canRequest && !asking && (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-fg-muted">{t("recordChanges.readOnlyNote")}</p>
          <Button type="button" variant="secondary" icon={<PencilSimpleLineIcon weight="bold" />} onClick={() => setAsking(true)} data-testid="record-ask">
            {t("recordChanges.askForChange")}
          </Button>
        </div>
      )}

      {!office && asking && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-4" data-testid="record-ask-box">
          <p className="text-sm leading-relaxed text-fg-muted">
            {t("recordChanges.formIntro")}
            {view.change ? ` ${t("recordChanges.replaceNote")}` : ""}
          </p>
          <TextAreaField label={t("recordChanges.reasonLabel")} hint={t("recordChanges.reasonHint")} required value={reason} maxLength={400} rows={2} onChange={(e) => setReason(e.target.value)} data-testid="record-ask-reason" />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" loading={pending} icon={<PaperPlaneTiltIcon weight="bold" />} data-testid="record-ask-send">
              {t("recordChanges.send")}
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={stopAsking}>
              {t("recordChanges.stopAsking")}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
