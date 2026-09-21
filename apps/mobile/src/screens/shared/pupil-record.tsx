import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { RECORD_BLOOD_GROUPS, CWSN_TYPES, type PupilRecordField, type PupilRecordSave, type PupilRecordView } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Text } from "@/components";
import { cwsnLabel } from "@/lib/filing-codes";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateKey, Pill } from "../family/shared";
import { Chips, type Refusal } from "../staff/shared";

/**
 * The pupil record — the details a school certificate names — as both sides
 * write it: the family on /record for their own child (or the pupil for
 * themselves), the office on /pupil-record for any pupil. The form is every
 * field at once, the ones a certificate needs first and the rest marked
 * optional, then what the UDISE+ and board filings ask beyond a certificate;
 * the server keeps the whole record as sent, so a cleared field stays
 * cleared. The date of birth is the school's and is only read here.
 */
export const REQUIRED_FIELDS: PupilRecordField[] = ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue", "addressLine", "city", "admissionNumber", "admissionDate"];
export const OPTIONAL_FIELDS: PupilRecordField[] = ["religion", "caste", "category", "postalCode", "admittedToGrade", "previousSchool", "penNumber"];
/** The filing fields: the chip-picked ones send the portal's code ("M", "yes", "9", "B+") and a blank clears. */
export const FILING_FIELDS: PupilRecordField[] = ["gender", "nameLocal", "fatherNameLocal", "motherNameLocal", "bpl", "ews", "cwsnType", "bloodGroup"];
const ALL_FIELDS: PupilRecordField[] = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, ...FILING_FIELDS];
const HINT: Partial<Record<PupilRecordField, TranslationKey>> = { category: "pupilRecord.categoryHint", admissionNumber: "pupilRecord.admissionNumberHint", penNumber: "pupilRecord.penHint", nameLocal: "pupilRecord.nameLocalHint" };
const MAX: Partial<Record<PupilRecordField, number>> = { addressLine: 200, postalCode: 12, admissionNumber: 40, admissionDate: 10, admittedToGrade: 20, previousSchool: 160, penNumber: 40 };

export type RecordForm = Record<PupilRecordField, string>;

/** A field's label in the reader's language — the dictionary's pupilRecord.<field>. */
export function fieldLabel(t: Translate, field: PupilRecordField): string {
  return t(`pupilRecord.${field}` as TranslationKey);
}

/** "Father's name, Place of birth" — the still-blank fields as one line. */
export function fieldList(t: Translate, fields: PupilRecordField[]): string {
  return fields.map((f) => fieldLabel(t, f)).join(", ");
}

/** The form's starting state: the record as stored, or every line empty for a record nobody has written. */
export function formFrom(record: PupilRecordView["record"]): RecordForm {
  const out = {} as RecordForm;
  for (const field of ALL_FIELDS) out[field] = record?.[field] ?? "";
  return out;
}

/** What the server is sent: every field trimmed (a blank clears it), the admission date as a day key or null. */
export function bodyFrom(form: RecordForm): PupilRecordSave {
  const body: Record<string, string | null> = {};
  for (const field of ALL_FIELDS) body[field] = form[field].trim();
  body.admissionDate = form.admissionDate.trim() || null;
  return body as PupilRecordSave;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A typed admission date that is not a day key is refused before anything is sent. */
export function dateProblem(t: Translate, value: string): string | undefined {
  const s = value.trim();
  return !s || DAY.test(s) ? undefined : t("refusal.useRealDateForm");
}

/** "Complete" or "3 missing" — the record's standing as a pill. */
export function RecordStanding({ view }: { view: PupilRecordView }) {
  const t = useT();
  return view.complete ? <Pill label={t("pupilRecord.complete")} tone="ok" /> : <Pill label={t("pupilRecord.incomplete", { count: view.missing.length })} tone="warn" />;
}

/**
 * The whole record as one form. The date of birth leads it, read-only with
 * the school's note; then the fields a certificate needs, then the optional
 * ones. Nothing is sent until Save, and the parent screen owns the request
 * so it can put the server's sentence above the button and refresh its own
 * copy. `intro` is the sentence for whoever is filling it in.
 */
export function PupilRecordForm({ view, intro, busy, refusal, onSave, extra }: { view: PupilRecordView; intro: string; busy: boolean; refusal: Refusal | null; onSave: (body: PupilRecordSave) => void; extra?: ReactNode }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [form, setForm] = useState<RecordForm>(() => formFrom(view.record));
  const [tried, setTried] = useState(false);
  const set = (field: PupilRecordField, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const issue = (field: PupilRecordField) => refusal?.issues[field];
  const dateBad = dateProblem(t, form.admissionDate);
  const editable = !busy && view.canEdit;
  const yesNo = [
    { value: "", label: t("pupilRecord.notSaid") },
    { value: "yes", label: t("pupilRecord.yes") },
    { value: "no", label: t("pupilRecord.no") },
  ];
  const input = (field: PupilRecordField, optional: boolean) => {
    const hintKey = HINT[field];
    const hint = [optional ? t("pupilRecord.optional") : null, hintKey ? t(hintKey) : null, field === "admissionDate" ? "YYYY-MM-DD" : null].filter(Boolean).join(" · ") || undefined;
    return (
      <Field
        key={field}
        label={fieldLabel(t, field)}
        hint={hint}
        value={form[field]}
        onChangeText={(v) => set(field, v)}
        maxLength={MAX[field] ?? 120}
        editable={editable}
        autoCapitalize={field === "admissionDate" || field === "penNumber" || field === "postalCode" ? "none" : "words"}
        keyboardType={field === "admissionDate" ? "numbers-and-punctuation" : field === "postalCode" ? "number-pad" : "default"}
        error={field === "admissionDate" && tried && dateBad ? dateBad : issue(field)}
      />
    );
  };
  return (
    <Card title={t("pupilRecord.title")} action={<RecordStanding view={view} />}>
      <Text variant="sm" tone="muted">
        {intro}
      </Text>
      {!view.complete ? (
        <Text variant="xs" tone="warn" accessibilityLiveRegion="polite">
          {t("pupilRecord.missingList", { fields: fieldList(t, view.missing) })}
        </Text>
      ) : null}
      {view.missingForFiling.length > 0 ? (
        <Text variant="xs" tone="warn">
          {t("filings.recordMissing", { fields: fieldList(t, view.missingForFiling) })}
        </Text>
      ) : null}
      <View accessible accessibilityLabel={`${t("pupilRecord.dob")}: ${view.birthdate ? formatDateKey(view.birthdate, locale) : "—"}. ${t("pupilRecord.dobNote")}`} style={{ gap: 2, paddingVertical: th.space[1] }}>
        <Text variant="xs" bold tone="subtle" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {t("pupilRecord.dob")}
        </Text>
        <Text variant="base" tone={view.birthdate ? "fg" : "subtle"}>
          {view.birthdate ? formatDateKey(view.birthdate, locale) : "—"}
        </Text>
        <Text variant="xs" tone="subtle">
          {t("pupilRecord.dobNote")}
        </Text>
      </View>
      {refusal ? <Failed message={refusal.message} /> : null}
      {REQUIRED_FIELDS.map((field) => input(field, false))}
      <View style={{ gap: th.space[3], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header">
          {t("pupilRecord.optional")}
        </Text>
        {OPTIONAL_FIELDS.map((field) => input(field, true))}
      </View>
      <View style={{ gap: th.space[3], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header">
          {t("pupilRecord.filingSection")}
        </Text>
        <Text variant="xs" tone="subtle">
          {t("pupilRecord.filingIntro")}
        </Text>
        <Chips
          label={fieldLabel(t, "gender")}
          value={form.gender}
          options={[
            { value: "", label: t("pupilRecord.notSaid") },
            { value: "M", label: t("pupilRecord.genderM") },
            { value: "F", label: t("pupilRecord.genderF") },
            { value: "T", label: t("pupilRecord.genderT") },
          ]}
          onChange={(v) => set("gender", v)}
          disabled={!editable}
        />
        {input("nameLocal", true)}
        {input("fatherNameLocal", true)}
        {input("motherNameLocal", true)}
        <Chips label={fieldLabel(t, "bpl")} value={form.bpl} options={yesNo} onChange={(v) => set("bpl", v)} disabled={!editable} />
        <Chips label={fieldLabel(t, "ews")} value={form.ews} options={yesNo} onChange={(v) => set("ews", v)} disabled={!editable} />
        <Chips label={fieldLabel(t, "cwsnType")} value={form.cwsnType} options={[{ value: "", label: t("pupilRecord.cwsnNone") }, ...CWSN_TYPES.map((code) => ({ value: code as string, label: cwsnLabel(code) }))]} onChange={(v) => set("cwsnType", v)} disabled={!editable} />
        <Text variant="xs" tone="subtle">
          {t("pupilRecord.cwsnHint")}
        </Text>
        <Chips label={fieldLabel(t, "bloodGroup")} value={form.bloodGroup} options={[{ value: "", label: t("pupilRecord.notSaid") }, ...RECORD_BLOOD_GROUPS.map((g) => ({ value: g as string, label: g }))]} onChange={(v) => set("bloodGroup", v)} disabled={!editable} />
      </View>
      {view.canEdit ? (
        <Button
          label={t("pupilRecord.save")}
          busy={busy}
          onPress={() => {
            setTried(true);
            if (!dateBad) onSave(bodyFrom(form));
          }}
        />
      ) : null}
      {extra}
    </Card>
  );
}
