import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { isRealDateKey, penChangeRequestSchema, penChangesListSchema, RECORD_CHANGE_FIELDS, recordChangeSchema, recordChangesListSchema, type RecordChangeFile, type RecordChangeView, PUPIL_CATEGORIES, PUPIL_RELIGIONS, RECORD_BLOOD_GROUPS, CWSN_TYPES, type PenChangeRequestView, type PupilRecordField, type PupilRecordSave, type PupilRecordView, CWSN_NONE, MOTHER_TONGUES, NATIONALITIES, type MotherTongue, type Nationality } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Row, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { cwsnLabel } from "@/lib/filing-codes";
import { useLocale, useT } from "@/lib/i18n";
import { unwrap } from "@/lib/query";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Confirm, formatDateKey, Note, Pill } from "../family/shared";
import { Chips, must, Refusal } from "../staff/shared";

/**
 * The pupil record — the details a school certificate names — as both sides
 * meet it: the office writes it on /pupil-record for any pupil; the family
 * on /record reads it for their own child (or the pupil for themselves) and
 * asks the office to change it. The form is every field at once, the ones a
 * certificate needs first and the rest marked optional, then what the UDISE+
 * and board filings ask beyond a certificate; the server keeps the whole
 * record as the office sends it, so a cleared field stays cleared. The date
 * of birth is the school's and is only read here.
 */
export const REQUIRED_FIELDS: PupilRecordField[] = ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue", "addressLine", "city", "admissionNumber", "admissionDate"];
export const OPTIONAL_FIELDS: PupilRecordField[] = ["religion", "caste", "category", "postalCode", "admittedToGrade", "previousSchool", "previousSchoolTcNumber", "previousSchoolTcDate", "penNumber", "rollNumber", "fatherOccupation", "motherOccupation", "annualIncome", "guardianPhone"];
/** The filing fields: the chip-picked ones send the portal's code ("M", "yes", "9", "B+") and a blank clears. */
export const FILING_FIELDS: PupilRecordField[] = ["gender", "nameLocal", "fatherNameLocal", "motherNameLocal", "bpl", "ews", "rte", "repeating", "cwsnType", "bloodGroup"];
const ALL_FIELDS: PupilRecordField[] = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, ...FILING_FIELDS];
/**
 * What a family may ask to have changed: the contracts' RECORD_CHANGE_FIELDS,
 * every field but the PEN (which has a correction of its own), the roll
 * number and "repeating the class" (which are the enrolment's). A family
 * writes none of them: since 2026-09-29 the record is the office's alone to
 * write, and what the family types is an ask the office approves or
 * declines. Exported so a test can walk the split.
 */
export const ASKABLE: ReadonlySet<PupilRecordField> = new Set<PupilRecordField>(RECORD_CHANGE_FIELDS);
const HINT: Partial<Record<PupilRecordField, TranslationKey>> = { postalCode: "pupilRecord.pinHint", guardianPhone: "pupilRecord.guardianPhoneHint", category: "pupilRecord.categoryHint", admissionNumber: "pupilRecord.admissionNumberHint", penNumber: "pupilRecord.penHint", nameLocal: "pupilRecord.nameLocalHint", previousSchoolTcNumber: "pupilRecord.tcHint", annualIncome: "pupilRecord.annualIncomeHint", rollNumber: "pupilRecord.rollNumberHint" };
const MAX: Partial<Record<PupilRecordField, number>> = { guardianPhone: 24, addressLine: 200, postalCode: 12, admissionNumber: 40, admissionDate: 10, admittedToGrade: 20, previousSchool: 160, penNumber: 11, previousSchoolTcNumber: 40, previousSchoolTcDate: 10, fatherOccupation: 120, motherOccupation: 120, annualIncome: 9, rollNumber: 4 };
/** The fields typed as a day key and sent as one, or null when blank. */
const DATE_FIELDS: PupilRecordField[] = ["admissionDate", "previousSchoolTcDate"];
/** Digits only, on the number pad: rupees a year and the roll number in the present class. */
const DIGIT_FIELDS: PupilRecordField[] = ["postalCode", "penNumber", "annualIncome", "rollNumber"];
/**
 * The coded choices and their labels: the category as UDISE+ files it plus
 * Maharashtra's three, the religion so the minority code is exact. Exported
 * so a test can walk the chips the form offers.
 */
export const CATEGORY_VALUES = PUPIL_CATEGORIES;
export const LANGUAGE_VALUES = MOTHER_TONGUES;
export const NATIONALITY_VALUES = NATIONALITIES;
const LANGUAGE_LABEL: Record<MotherTongue, TranslationKey> = { ASSAMESE: "pupilRecord.langAssamese", BENGALI: "pupilRecord.langBengali", BODO: "pupilRecord.langBodo", DOGRI: "pupilRecord.langDogri", ENGLISH: "pupilRecord.langEnglish", GUJARATI: "pupilRecord.langGujarati", HINDI: "pupilRecord.langHindi", KANNADA: "pupilRecord.langKannada", KASHMIRI: "pupilRecord.langKashmiri", KONKANI: "pupilRecord.langKonkani", MAITHILI: "pupilRecord.langMaithili", MALAYALAM: "pupilRecord.langMalayalam", MANIPURI: "pupilRecord.langManipuri", MARATHI: "pupilRecord.langMarathi", NEPALI: "pupilRecord.langNepali", ODIA: "pupilRecord.langOdia", PUNJABI: "pupilRecord.langPunjabi", SANSKRIT: "pupilRecord.langSanskrit", SANTALI: "pupilRecord.langSantali", SINDHI: "pupilRecord.langSindhi", TAMIL: "pupilRecord.langTamil", TELUGU: "pupilRecord.langTelugu", URDU: "pupilRecord.langUrdu", OTHER: "pupilRecord.langOther" };
const NATIONALITY_LABEL: Record<Nationality, TranslationKey> = { INDIAN: "pupilRecord.natIndian", NEPALI: "pupilRecord.natNepali", BHUTANESE: "pupilRecord.natBhutanese", BANGLADESHI: "pupilRecord.natBangladeshi", SRI_LANKAN: "pupilRecord.natSriLankan", OTHER: "pupilRecord.natOther" };
export const RELIGION_VALUES = PUPIL_RELIGIONS;
const CATEGORY_LABEL: Record<(typeof PUPIL_CATEGORIES)[number], TranslationKey> = { GENERAL: "pupilRecord.catGeneral", SC: "pupilRecord.catSC", ST: "pupilRecord.catST", OBC: "pupilRecord.catOBC", VJ: "pupilRecord.catVJ", NT: "pupilRecord.catNT", SBC: "pupilRecord.catSBC" };
const RELIGION_LABEL: Record<(typeof PUPIL_RELIGIONS)[number], TranslationKey> = { HINDU: "pupilRecord.relHindu", MUSLIM: "pupilRecord.relMuslim", CHRISTIAN: "pupilRecord.relChristian", SIKH: "pupilRecord.relSikh", BUDDHIST: "pupilRecord.relBuddhist", PARSI: "pupilRecord.relParsi", JAIN: "pupilRecord.relJain", OTHER: "pupilRecord.relOther" };

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

/**
 * What the server is sent: every field trimmed (a blank clears it), the
 * two dates as a day key or null. `omit` leaves fields out altogether —
 * the PEN once it is locked, which the server would refuse changed and which
 * has no business in the body at all, and the roll number from a family,
 * which is the office's to set.
 */
export function bodyFrom(form: RecordForm, omit: PupilRecordField[] = []): PupilRecordSave {
  const body: Record<string, string | null> = {};
  for (const field of ALL_FIELDS) if (!omit.includes(field)) body[field] = form[field].trim();
  for (const field of DATE_FIELDS) if (!omit.includes(field)) body[field] = form[field].trim() || null;
  return body as PupilRecordSave;
}

/**
 * What a family's ask carries: only the askable fields whose trimmed value
 * differs from the record's, a blank asking for the field to be cleared (a
 * blank date as null). Nothing in it means there is nothing to ask.
 */
export function changesFrom(form: RecordForm, record: PupilRecordView["record"]): RecordChangeFile["changes"] {
  const changes: Record<string, string | null> = {};
  for (const field of ALL_FIELDS) {
    if (!ASKABLE.has(field)) continue;
    const value = form[field].trim();
    if (value === (record?.[field] ?? "").trim()) continue;
    changes[field] = DATE_FIELDS.includes(field) && !value ? null : value;
  }
  return changes as RecordChangeFile["changes"];
}

/** One stored value as the word a reader sees, so "MARATHI" is never shown as a code; a value typed before the lists shows as itself. */
export function valueWords(t: Translate, field: PupilRecordField, value: string): string {
  if (field === "bpl" || field === "ews" || field === "rte" || field === "repeating") return value === "yes" ? t("pupilRecord.yes") : value === "no" ? t("pupilRecord.no") : value;
  if (field === "gender") return value === "M" ? t("pupilRecord.genderM") : value === "F" ? t("pupilRecord.genderF") : value === "T" ? t("pupilRecord.genderT") : value;
  if (field === "cwsnType") return value === CWSN_NONE ? t("pupilRecord.cwsnNone") : cwsnLabel(value);
  if (field === "motherTongue") return (LANGUAGE_VALUES as readonly string[]).includes(value) ? t(LANGUAGE_LABEL[value as MotherTongue]) : value;
  if (field === "nationality") return (NATIONALITY_VALUES as readonly string[]).includes(value) ? t(NATIONALITY_LABEL[value as Nationality]) : value;
  if (field === "category") return (CATEGORY_VALUES as readonly string[]).includes(value) ? t(CATEGORY_LABEL[value as (typeof PUPIL_CATEGORIES)[number]]) : value;
  if (field === "religion") return (RELIGION_VALUES as readonly string[]).includes(value) ? t(RELIGION_LABEL[value as (typeof PUPIL_RELIGIONS)[number]]) : value;
  return value;
}

/** A typed date that is not a day on the calendar is refused before anything is sent (TA-420): 2027-02-30 too. */
export function dateProblem(t: Translate, value: string): string | undefined {
  const s = value.trim();
  return !s || isRealDateKey(s) ? undefined : t("refusal.useRealDateForm");
}

/** "Complete" or "3 missing" — the record's standing as a pill. */
export function RecordStanding({ view }: { view: PupilRecordView }) {
  const t = useT();
  return view.complete ? <Pill label={t("pupilRecord.complete")} tone="ok" /> : <Pill label={t("pupilRecord.incomplete", { count: view.missing.length })} tone="warn" />;
}

/**
 * The whole record as one form. The date of birth leads it, read-only with
 * the school's note; then the fields a certificate needs, then the optional
 * ones. `intro` is the sentence for whoever is reading it.
 *
 * WHO WRITES: the office's form has every field and Save. A family's form —
 * a guardian's or the pupil's own — is READ until "Ask for a change" is
 * pressed; then every field but the PEN, the roll number and "repeating"
 * can be typed in, a reason is asked for, and `onAsk` is handed only the
 * fields that differ from the record. Nothing is sent until Save or Send,
 * and the parent screen owns the request so it can put the server's
 * sentence beside the button and refresh its own copy.
 */
export function PupilRecordForm({ view, intro, busy, refusal, onSave, onAsk, extra }: { view: PupilRecordView; intro: string; busy: boolean; refusal: Refusal | null; onSave?: (body: PupilRecordSave) => void; onAsk?: (body: RecordChangeFile) => void; extra?: ReactNode }) {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const { locale } = useLocale();
  const [form, setForm] = useState<RecordForm>(() => formFrom(view.record));
  const [tried, setTried] = useState(false);
  // The family's form: read first, and typed in only once they have said they want something changed.
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const set = (field: PupilRecordField, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const issue = (field: PupilRecordField) => refusal?.issues[field] ?? refusal?.issues[`changes.${field}`];
  const dateBad = dateProblem(t, form.admissionDate) ?? dateProblem(t, form.previousSchoolTcDate);
  const familySide = role === "PARENT" || role === "STUDENT";
  const editable = !busy && (familySide ? asking : view.canEdit);
  /** Read, not typed: the whole record until the family asks for a change, and the three fields that are never theirs to ask about. */
  const reads = (field: PupilRecordField) => familySide && (!asking || !ASKABLE.has(field));
  const omitted: PupilRecordField[] = view.penEditable ? [] : ["penNumber"];
  const yesNo = [
    { value: "", label: t("pupilRecord.notSaid") },
    { value: "yes", label: t("pupilRecord.yes") },
    { value: "no", label: t("pupilRecord.no") },
  ];
  /** A field shown, never typed: the value or a dash, and — where there is one — the note that says whose it is. */
  const readOnly = (field: PupilRecordField, note: string | undefined, testID: string, display?: string) => {
    const shown = display || form[field] || "—";
    return (
      <View key={field} accessible accessibilityLabel={note ? `${fieldLabel(t, field)}: ${shown}. ${note}` : `${fieldLabel(t, field)}: ${shown}`} testID={testID} style={{ gap: 2, paddingVertical: th.space[1] }}>
        <Text variant="xs" bold tone="subtle" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {fieldLabel(t, field)}
        </Text>
        <Text variant="base" tone={form[field] ? "fg" : "subtle"}>
          {shown}
        </Text>
        {note ? (
          <Text variant="xs" tone="subtle">
            {note}
          </Text>
        ) : null}
      </View>
    );
  };
  /** What the family reads: the stored code as its word, and the office's note only on what they cannot ask about. */
  const read = (field: PupilRecordField) => readOnly(field, ASKABLE.has(field) ? undefined : t("pupilRecord.rollNumberOffice"), field === "rollNumber" ? "record-roll-office" : `record-read-${field}`, valueWords(t, field, form[field]));
  /** A coded filing answer: chips for whoever may type, the picked word for a family that is reading. */
  const codedChips = (field: "gender" | "bpl" | "ews" | "rte" | "repeating" | "cwsnType" | "bloodGroup", options: { value: string; label: string }[]) =>
    reads(field) ? read(field) : <Chips key={field} label={fieldLabel(t, field)} value={form[field]} options={options} onChange={(v) => set(field, v)} disabled={!editable} />;
  /**
   * A coded choice as chips: blank, the codes with their labels, and — for
   * a value typed before the codes existed — the stored word as one more
   * chip, so it still shows and goes back only as it is.
   */
  const coded = (field: "category" | "religion" | "motherTongue" | "nationality") => {
    const codes: readonly string[] = field === "category" ? CATEGORY_VALUES : field === "religion" ? RELIGION_VALUES : field === "motherTongue" ? LANGUAGE_VALUES : NATIONALITY_VALUES;
    const stored = view.record?.[field] ?? "";
    const options = [{ value: "", label: t("pupilRecord.notSaid") }, ...codes.map((code) => ({ value: code, label: valueWords(t, field, code) }))];
    if (stored && !codes.includes(stored)) options.push({ value: stored, label: stored });
    const hintKey = HINT[field];
    return (
      <View key={field} style={{ gap: th.space[1] }}>
        <Chips label={fieldLabel(t, field)} value={form[field]} options={options} onChange={(v) => set(field, v)} disabled={!editable} />
        {hintKey || issue(field) ? (
          <Text variant="xs" tone={issue(field) ? "danger" : "subtle"}>
            {issue(field) ?? t(hintKey!)}
          </Text>
        ) : null}
      </View>
    );
  };
  const input = (field: PupilRecordField, optional: boolean) => {
    if (field === "penNumber" && !view.penEditable) {
      // The PEN is the admin's to enter once; after that it is shown, never
      // typed, and a correction goes through the change below.
      return readOnly(field, form.penNumber ? t(role === "ADMIN" ? "pupilRecord.penEnteredBy" : "pupilRecord.penLocked") : t("pupilRecord.penOnlyAdmin"), "record-pen-locked");
    }
    if (reads(field)) return read(field);
    if (field === "category" || field === "religion" || field === "motherTongue" || field === "nationality") return coded(field);
    const isDate = DATE_FIELDS.includes(field);
    const isDigits = DIGIT_FIELDS.includes(field);
    const hintKey = HINT[field];
    const hint = [optional ? t("pupilRecord.optional") : null, hintKey ? t(hintKey) : null, isDate ? "YYYY-MM-DD" : null].filter(Boolean).join(" · ") || undefined;
    const ownDateBad = isDate ? dateProblem(t, form[field]) : undefined;
    return (
      <Field
        key={field}
        label={fieldLabel(t, field)}
        hint={hint}
        value={form[field]}
        onChangeText={(v) => set(field, v)}
        maxLength={MAX[field] ?? 120}
        editable={editable}
        autoCapitalize={isDate || isDigits || field === "previousSchoolTcNumber" ? "none" : "words"}
        keyboardType={isDate ? "numbers-and-punctuation" : isDigits ? "number-pad" : "default"}
        error={isDate && tried && ownDateBad ? ownDateBad : issue(field)}
      />
    );
  };
  /** The family's ask: only what differs from the record, and why. Refused here when there is nothing to ask or no reason. */
  const ask = () => {
    setTried(true);
    if (dateBad) return;
    const changes = changesFrom(form, view.record);
    if (Object.keys(changes).length === 0) {
      setProblem(t("recordChanges.nothingChanges"));
      return;
    }
    setProblem(null);
    if (!reason.trim()) return;
    onAsk?.({ changes, reason: reason.trim() });
  };
  /** Leaving the ask puts the form back to the record: what was typed was never the record's. */
  const stopAsking = () => {
    setAsking(false);
    setTried(false);
    setReason("");
    setProblem(null);
    setForm(formFrom(view.record));
  };
  const said = problem ?? refusal?.message ?? null;
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
      {/* The office's refusal sits above its fields; a family's sits in the ask, beside the button that sent it. */}
      {refusal && !familySide ? <Failed message={refusal.message} /> : null}
      {REQUIRED_FIELDS.map((field) => input(field, false))}
      <View style={{ gap: th.space[3], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header" level={3}>
          {t("pupilRecord.optional")}
        </Text>
        {OPTIONAL_FIELDS.map((field) => input(field, true))}
      </View>
      <View style={{ gap: th.space[3], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header" level={3}>
          {t("pupilRecord.filingSection")}
        </Text>
        <Text variant="xs" tone="subtle">
          {t("pupilRecord.filingIntro")}
        </Text>
        {codedChips("gender", [
          { value: "", label: t("pupilRecord.notSaid") },
          { value: "M", label: t("pupilRecord.genderM") },
          { value: "F", label: t("pupilRecord.genderF") },
          { value: "T", label: t("pupilRecord.genderT") },
        ])}
        {input("nameLocal", true)}
        {input("fatherNameLocal", true)}
        {input("motherNameLocal", true)}
        {codedChips("bpl", yesNo)}
        {codedChips("ews", yesNo)}
        {codedChips("rte", yesNo)}
        <Text variant="xs" tone="subtle">
          {t("pupilRecord.rteHint")}
        </Text>
        {codedChips("repeating", [{ value: "no", label: t("pupilRecord.no") }, { value: "yes", label: t("pupilRecord.yes") }])}
        <Text variant="xs" tone="subtle">
          {t("pupilRecord.repeatingHint")}
        </Text>
        {codedChips("cwsnType", [{ value: "", label: t("pupilRecord.notSaid") }, { value: CWSN_NONE, label: t("pupilRecord.cwsnNone") }, ...CWSN_TYPES.map((code) => ({ value: code as string, label: cwsnLabel(code) }))])}
        <Text variant="xs" tone="subtle">
          {t("pupilRecord.cwsnHint")}
        </Text>
        {codedChips("bloodGroup", [{ value: "", label: t("pupilRecord.notSaid") }, ...RECORD_BLOOD_GROUPS.map((g) => ({ value: g as string, label: g }))])}
      </View>
      {!familySide && view.canEdit ? (
        <Button
          label={t("pupilRecord.save")}
          busy={busy}
          onPress={() => {
            setTried(true);
            if (!dateBad) onSave?.(bodyFrom(form, omitted));
          }}
        />
      ) : null}
      {familySide && view.canRequest && !asking ? (
        <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
          <Text variant="sm" tone="muted">
            {t("recordChanges.readOnlyNote")}
          </Text>
          <Button label={t("recordChanges.askForChange")} variant="secondary" onPress={() => setAsking(true)} />
        </View>
      ) : null}
      {familySide && asking ? (
        <Note tone="accent">
          <Text variant="sm" tone="muted">
            {view.change ? `${t("recordChanges.formIntro")} ${t("recordChanges.replaceNote")}` : t("recordChanges.formIntro")}
          </Text>
          {said ? <Failed message={said} /> : null}
          <Field label={t("recordChanges.reasonLabel")} hint={t("recordChanges.reasonHint")} value={reason} onChangeText={setReason} maxLength={400} multiline editable={!busy} error={tried && !reason.trim() ? t("root.sayWhyShort") : undefined} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("recordChanges.send")} busy={busy} onPress={ask} />
            <Button label={t("recordChanges.stopAsking")} variant="secondary" disabled={busy} onPress={stopAsking} />
          </View>
        </Note>
      ) : null}
      {extra}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* The PEN correction                                                           */
/* -------------------------------------------------------------------------- */

const OFFICE_CHANGES = "/api/v1/office/pen-changes";
const FAMILY_CHANGES = "/api/v1/family/pen-changes";
const OFFICE_CHANGES_KEY = ["office", "pen-changes"];
const FAMILY_CHANGES_KEY = ["family", "pen-changes"];

const CHANGE_STATUS: Record<PenChangeRequestView["status"], { label: TranslationKey; tone: "warn" | "ok" | "danger" | "muted" }> = {
  PENDING: { label: "pupilRecord.statusPending", tone: "warn" },
  APPLIED: { label: "pupilRecord.statusApplied", tone: "ok" },
  REJECTED: { label: "pupilRecord.statusRejected", tone: "danger" },
  WITHDRAWN: { label: "pupilRecord.statusWithdrawn", tone: "muted" },
};

/** "From 1234… to 5678…" or "Remove the number 1234…". */
export function changeLine(t: Translate, r: PenChangeRequestView): string {
  return r.toPen ? t("pupilRecord.penChangeFromTo", { from: r.fromPen ?? "—", to: r.toPen }) : t("pupilRecord.penChangeRemoval", { from: r.fromPen ?? "—" });
}

/**
 * A correction to the pupil's PEN, under the record on every side of it.
 * With nothing pending, the admin's door to proposing one — a number or its
 * removal, and why — and nothing at all for anyone else; with a proposal
 * pending, the card that says what would change, who has said what, and
 * the one thing this reader may do: approve or reject for the head (the
 * office endpoint) and the guardian (the family's), withdraw for the admin.
 * The server's `can` decides the buttons, not the role. `recordKey` is the
 * record query this sits under, refetched after every write so the card
 * and the locked field follow the server.
 */
export function PenChangeSection({ view, recordKey }: { view: PupilRecordView; recordKey: QueryKey }) {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const qc = useQueryClient();
  const toast = useToast();
  const [refusal, setRefusal] = useState<string | null>(null);
  const [toPen, setToPen] = useState("");
  const [remove, setRemove] = useState(false);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [why, setWhy] = useState("");
  const settle = (message: string) => {
    setRefusal(null);
    setRejecting(false);
    setWhy("");
    toast.show(message, "ok");
    void qc.invalidateQueries({ queryKey: recordKey });
    void qc.invalidateQueries({ queryKey: OFFICE_CHANGES_KEY });
    void qc.invalidateQueries({ queryKey: FAMILY_CHANGES_KEY });
  };
  const fail = (e: unknown) => setRefusal(e instanceof Refusal ? e.message : t("common.somethingWrong"));
  const propose = useMutation({
    mutationFn: async (body: { toPen: string | null; reason: string }) => penChangeRequestSchema.parse(must(await api().post(`/api/v1/office/pupil-records/${view.studentMembershipId}/pen-change`, body), t("common.somethingWrong"))),
    onSuccess: () => {
      setToPen("");
      setRemove(false);
      setReason("");
      settle(t("pupilRecord.penProposed"));
    },
    onError: fail,
  });
  const decide = useMutation({
    mutationFn: async ({ id, approve, reason: r }: { id: string; approve: boolean; reason?: string }) => {
      const path = role === "PARENT" ? `/api/v1/family/pen-changes/${id}/decide` : `/api/v1/office/pen-changes/${id}/decide`;
      return penChangeRequestSchema.parse(must(await api().post(path, approve ? { approve: true } : { approve: false, ...(r ? { reason: r } : {}) }), t("common.somethingWrong")));
    },
    onSuccess: () => settle(t("pupilRecord.penChangeDecided")),
    onError: fail,
  });
  const withdraw = useMutation({
    mutationFn: async (id: string) => penChangeRequestSchema.parse(must(await api().post(`/api/v1/office/pen-changes/${id}/withdraw`, {}), t("common.somethingWrong"))),
    onSuccess: () => settle(t("pupilRecord.penChangeWithdrawn")),
    onError: fail,
  });
  const busy = propose.isPending || decide.isPending || withdraw.isPending;

  const r = view.penChange;
  if (!r) {
    // Nothing pending: only the admin proposes, and only once a number is on record.
    if (role !== "ADMIN" || view.penEditable || !view.record?.penNumber) return null;
    const digits = toPen.replace(/\D/g, "");
    const shapeBad = !remove && toPen.trim().length > 0 && digits.length !== 11;
    const ready = reason.trim().length > 0 && (remove || digits.length === 11);
    return (
      <Card title={t("pupilRecord.penProposeTitle")} testID="pen-propose">
        <Text variant="sm" tone="muted">
          {t("pupilRecord.penProposeIntro")}
        </Text>
        {refusal ? <Failed message={refusal} /> : null}
        <Field label={t("pupilRecord.penProposeNew")} hint={t("pupilRecord.penHint")} value={toPen} onChangeText={setToPen} maxLength={11} keyboardType="number-pad" autoCapitalize="none" editable={!busy && !remove} error={shapeBad ? t("pupilRecord.penFormat") : undefined} />
        <SwitchRow label={t("pupilRecord.penProposeRemove")} value={remove} onChange={setRemove} disabled={busy} />
        <Field label={t("pupilRecord.penProposeReason")} placeholder={t("pupilRecord.penProposeReasonPlaceholder")} value={reason} onChangeText={setReason} maxLength={400} multiline editable={!busy} />
        <Button label={t("pupilRecord.penPropose")} busy={propose.isPending} disabled={!ready} onPress={() => propose.mutate({ toPen: remove ? null : digits, reason: reason.trim() })} />
      </Card>
    );
  }

  const status = CHANGE_STATUS[r.status];
  const word = (d: { decided: boolean; approved: boolean | null; by: string | null }, waived = false): { text: string; tone: "muted" | "ok" | "warn" | "danger" } => {
    if (waived) return { text: t("pupilRecord.penChangeWaived"), tone: "muted" };
    if (!d.decided) return { text: t("pupilRecord.penChangeWaiting"), tone: "warn" };
    return d.approved ? { text: t("pupilRecord.penChangeApproved", { name: d.by ?? "" }), tone: "ok" } : { text: t("pupilRecord.penChangeRejected", { name: d.by ?? "" }), tone: "danger" };
  };
  const head = word(r.principal);
  const guardian = word(r.guardian, r.guardian.waived);
  return (
    <Card title={t("pupilRecord.penChangeTitle")} action={<Pill label={t(status.label)} tone={status.tone} />} testID="pen-change">
      <Text variant="base" bold>
        {changeLine(t, r)}
      </Text>
      <Text variant="sm" tone="muted">
        {`${t("pupilRecord.penChangeProposedBy", { name: r.requestedByName })} · ${t("pupilRecord.penChangeReason", { reason: r.reason })}`}
      </Text>
      <Row title={t("pupilRecord.penChangePrincipal")} right={<Pill label={head.text} tone={head.tone} />} />
      <Row title={t("pupilRecord.penChangeGuardian")} right={<Pill label={guardian.text} tone={guardian.tone} />} />
      {r.status === "APPLIED" ? (
        <Text variant="sm" tone="ok">
          {t("pupilRecord.penChangeAppliedNote")}
        </Text>
      ) : null}
      {r.status === "REJECTED" ? (
        <Text variant="sm" tone="danger">
          {t("pupilRecord.penChangeRejectedNote", { reason: r.decisionReason ?? "—" })}
        </Text>
      ) : null}
      {refusal ? <Failed message={refusal} /> : null}
      {r.can.decide && !rejecting ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("pupilRecord.penChangeApprove")} busy={decide.isPending} disabled={busy} onPress={() => decide.mutate({ id: r.id, approve: true })} />
          <Button label={t("pupilRecord.penChangeReject")} variant="secondary" disabled={busy} onPress={() => setRejecting(true)} />
        </View>
      ) : null}
      {r.can.decide && rejecting ? (
        <Note tone="danger">
          <Field label={t("pupilRecord.penChangeRejectReason")} value={why} onChangeText={setWhy} maxLength={400} multiline editable={!busy} />
          <Confirm question={changeLine(t, r)} confirmLabel={t("pupilRecord.penChangeReject")} busy={decide.isPending} onConfirm={() => decide.mutate({ id: r.id, approve: false, reason: why.trim() || undefined })} onCancel={() => setRejecting(false)} />
        </Note>
      ) : null}
      {r.can.withdraw ? <Button label={t("pupilRecord.penChangeWithdraw")} variant="secondary" busy={withdraw.isPending} disabled={busy} onPress={() => withdraw.mutate(r.id)} /> : null}
    </Card>
  );
}

/**
 * The office's home card while a correction waits for the head or a
 * guardian: the count, and the door to the records list where each is
 * named. Nothing while none wait, or while the list cannot be read.
 */
export function OfficePenChangesCard() {
  const t = useT();
  const router = useRouter();
  const role = useRole();
  const query = useQuery({
    queryKey: OFFICE_CHANGES_KEY,
    enabled: role === "ADMIN" || role === "PRINCIPAL",
    queryFn: async () => penChangesListSchema.parse(unwrap(await api().get(`${OFFICE_CHANGES}?status=PENDING`))),
  });
  const d = query.data;
  if (!d || d.pending === 0) return null;
  return (
    <Card title={t("pupilRecord.penChangesTitle")} testID="pen-changes-card">
      <Row title={t("certificateRequests.pendingCount", { count: d.pending })} caption={t("pupilRecord.penChangesIntro")} onPress={() => router.push("/(app)/pupil-records" as never)} />
    </Card>
  );
}

/**
 * The guardian's home card while a correction to a child's PEN waits for
 * their word: the child named, and the door to that child's record where
 * the decision is made.
 */
export function FamilyPenChangesCard() {
  const t = useT();
  const router = useRouter();
  const role = useRole();
  const query = useQuery({
    queryKey: FAMILY_CHANGES_KEY,
    enabled: role === "PARENT",
    queryFn: async () => penChangesListSchema.parse(unwrap(await api().get(FAMILY_CHANGES))),
  });
  const d = query.data;
  const waiting = d?.items.find((item) => item.status === "PENDING" && item.can.decide);
  if (!d || d.pending === 0 || !waiting) return null;
  return (
    <Card title={t("pupilRecord.penChangesTitle")} testID="pen-changes-card">
      <Row title={t("pupilRecord.notifPenProposed", { name: waiting.studentName })} caption={t("certificateRequests.pendingCount", { count: d.pending })} onPress={() => router.push({ pathname: "/(app)/record", params: { child: waiting.studentMembershipId } } as never)} />
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* A family's ask to change the record                                          */
/* -------------------------------------------------------------------------- */

const OFFICE_RECORD_CHANGES_KEY = ["office", "record-changes"];
const FAMILY_RECORD_CHANGES_KEY = ["family", "record-changes"];

const RECORD_CHANGE_STATUS: Record<RecordChangeView["status"], { label: TranslationKey; tone: "warn" | "ok" | "danger" | "muted" }> = {
  PENDING: { label: "recordChanges.statusPending", tone: "warn" },
  APPLIED: { label: "recordChanges.statusApplied", tone: "ok" },
  DECLINED: { label: "recordChanges.statusDeclined", tone: "danger" },
  WITHDRAWN: { label: "recordChanges.statusWithdrawn", tone: "muted" },
};

/** "Town or city: Pune → Nashik", one line per field asked about, a code as its word and nothing as "blank". */
export function recordChangeLines(t: Translate, change: RecordChangeView): { field: PupilRecordField; line: string }[] {
  const words = (field: PupilRecordField, value: string | null) => (value === null || value === "" ? t("recordChanges.blank") : valueWords(t, field, value));
  return change.changes.map((c) => ({ field: c.field, line: t("recordChanges.changeLine", { field: fieldLabel(t, c.field), from: words(c.field, c.from), to: words(c.field, c.to) }) }));
}

/**
 * One ask to change a pupil's record, as both sides read it: where it
 * stands, who asked and when, each field with what the record held and what
 * is proposed, and why. The office gets the two decisions — declining opens
 * a box for a sentence the family will read — and the family the way to
 * take a waiting ask back. What the reader may do is the server's answer
 * (`can`), not this card's guess. `recordKey` is the record query the card
 * sits beside, refetched after every write so the form shows what the
 * record now holds. `bare` draws the ask without a card of its own, for a
 * list of earlier ones inside one card.
 */
export function RecordChangeCard({ change, recordKey, bare }: { change: RecordChangeView; recordKey?: QueryKey; bare?: boolean }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { locale } = useLocale();
  const [refusal, setRefusal] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [why, setWhy] = useState("");
  const settle = (message: string) => {
    setRefusal(null);
    setDeclining(false);
    setWhy("");
    toast.show(message, "ok");
    if (recordKey) void qc.invalidateQueries({ queryKey: recordKey });
    void qc.invalidateQueries({ queryKey: OFFICE_RECORD_CHANGES_KEY });
    void qc.invalidateQueries({ queryKey: ["office", "pupil-records"] });
    void qc.invalidateQueries({ queryKey: FAMILY_RECORD_CHANGES_KEY });
  };
  const fail = (e: unknown) => setRefusal(e instanceof Refusal ? e.message : t("common.somethingWrong"));
  const decide = useMutation({
    mutationFn: async ({ approve, reason }: { approve: boolean; reason?: string }) => recordChangeSchema.parse(must(await api().post(`/api/v1/office/record-changes/${encodeURIComponent(change.id)}/decide`, approve ? { approve: true } : { approve: false, ...(reason ? { reason } : {}) }), t("common.somethingWrong"))),
    onSuccess: (_next, sent) => settle(t(sent.approve ? "recordChanges.approved" : "recordChanges.declined")),
    onError: fail,
  });
  const withdraw = useMutation({
    mutationFn: async () => recordChangeSchema.parse(must(await api().post(`/api/v1/family/record/changes/${encodeURIComponent(change.id)}/withdraw`, {}), t("common.somethingWrong"))),
    onSuccess: () => settle(t("recordChanges.withdrawn")),
    onError: fail,
  });
  const busy = decide.isPending || withdraw.isPending;
  const status = RECORD_CHANGE_STATUS[change.status];
  const pill = <Pill label={t(status.label)} tone={status.tone} />;
  const body = (
    <>
      {bare ? pill : null}
      <Text variant="sm" tone="muted">
        {t(change.byPupil ? "recordChanges.askedByPupil" : "recordChanges.askedBy", { name: change.requestedByName, date: formatDateKey(change.createdAt.slice(0, 10), locale) })}
      </Text>
      {recordChangeLines(t, change).map((c) => (
        <Text key={c.field} variant="base" testID={`record-change-${c.field}`}>
          {c.line}
        </Text>
      ))}
      <Text variant="sm" tone="muted">
        {t("recordChanges.reasonGiven", { reason: change.reason })}
      </Text>
      {change.declineReason ? (
        <Text variant="sm" bold>
          {t("recordChanges.officeSaid", { reason: change.declineReason })}
        </Text>
      ) : null}
      {refusal ? <Failed message={refusal} /> : null}
      {change.can.decide && !declining ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("recordChanges.approve")} busy={decide.isPending} disabled={busy} onPress={() => decide.mutate({ approve: true })} />
          <Button label={t("recordChanges.decline")} variant="secondary" disabled={busy} onPress={() => setDeclining(true)} />
        </View>
      ) : null}
      {change.can.decide && declining ? (
        <Note tone="danger">
          <Field label={t("recordChanges.declineReasonLabel")} value={why} onChangeText={setWhy} maxLength={400} multiline editable={!busy} />
          <Confirm question={`${change.studentName}: ${fieldList(t, change.changes.map((c) => c.field))}`} confirmLabel={t("recordChanges.decline")} busy={decide.isPending} onConfirm={() => decide.mutate({ approve: false, reason: why.trim() || undefined })} onCancel={() => setDeclining(false)} />
        </Note>
      ) : null}
      {change.can.withdraw ? <Button label={t("recordChanges.withdraw")} variant="secondary" busy={withdraw.isPending} disabled={busy} onPress={() => withdraw.mutate()} /> : null}
    </>
  );
  if (bare) return <View testID="record-change" style={{ gap: th.space[2] }}>{body}</View>;
  return (
    <Card title={t(change.can.decide ? "recordChanges.officeTitle" : change.status === "PENDING" ? "recordChanges.waitingTitle" : "recordChanges.earlier")} action={pill} testID="record-change">
      {body}
    </Card>
  );
}

/**
 * The asks on one pupil's record, beside the form: the one that waits in a
 * card of its own, then the earlier ones — updated, declined, taken back —
 * together in one card, the newest first as the server sends them. Five at
 * most: the list is what happened lately, not an archive. Nothing at all
 * while nobody has asked.
 */
export function RecordChangesSection({ items, recordKey }: { items: RecordChangeView[]; recordKey?: QueryKey }) {
  const t = useT();
  const th = useTheme();
  const shown = items.slice(0, 5);
  const waiting = shown.filter((c) => c.status === "PENDING");
  const earlier = shown.filter((c) => c.status !== "PENDING");
  return (
    <>
      {waiting.map((c) => (
        <RecordChangeCard key={c.id} change={c} recordKey={recordKey} />
      ))}
      {earlier.length > 0 ? (
        <Card title={t("recordChanges.earlier")} testID="record-changes-earlier">
          {earlier.map((c, i) => (
            <View key={c.id} style={i > 0 ? { paddingTop: th.space[3], borderTopWidth: 1, borderTopColor: th.border } : undefined}>
              <RecordChangeCard change={c} recordKey={recordKey} bare />
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}

/** The asks that wait for the office, as the home card and the records list both read them: one query, one key. */
export function useOfficeRecordChanges() {
  const role = useRole();
  return useQuery({
    queryKey: OFFICE_RECORD_CHANGES_KEY,
    enabled: role === "ADMIN" || role === "PRINCIPAL",
    queryFn: async () => recordChangesListSchema.parse(unwrap(await api().get("/api/v1/office/record-changes?status=PENDING"))),
  });
}

/**
 * The office's home card while a family's ask waits: the count, and the
 * door to the records list where each is named. Nothing while none wait, or
 * while the list cannot be read.
 */
export function OfficeRecordChangesCard() {
  const t = useT();
  const router = useRouter();
  const d = useOfficeRecordChanges().data;
  if (!d || d.pending === 0) return null;
  return (
    <Card title={t("recordChanges.officeTitle")} testID="record-changes-card">
      <Row title={t("recordChanges.waitingCount", { count: d.pending })} caption={t("recordChanges.officeIntro")} onPress={() => router.push("/(app)/pupil-records" as never)} />
    </Card>
  );
}
