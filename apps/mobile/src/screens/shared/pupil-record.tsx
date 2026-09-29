import { MOTHER_TONGUES, NATIONALITIES, type MotherTongue, type Nationality } from "@edulink/contracts";
import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { FAMILY_RECORD_FIELDS, penChangeRequestSchema, penChangesListSchema, PUPIL_CATEGORIES, PUPIL_RELIGIONS, RECORD_BLOOD_GROUPS, CWSN_TYPES, type PenChangeRequestView, type PupilRecordField, type PupilRecordSave, type PupilRecordView } from "@edulink/contracts";
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
 * write it: the family on /record for their own child (or the pupil for
 * themselves), the office on /pupil-record for any pupil. The form is every
 * field at once, the ones a certificate needs first and the rest marked
 * optional, then what the UDISE+ and board filings ask beyond a certificate;
 * the server keeps the whole record as sent, so a cleared field stays
 * cleared. The date of birth is the school's and is only read here.
 */
export const REQUIRED_FIELDS: PupilRecordField[] = ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue", "addressLine", "city", "admissionNumber", "admissionDate"];
export const OPTIONAL_FIELDS: PupilRecordField[] = ["religion", "caste", "category", "postalCode", "admittedToGrade", "previousSchool", "previousSchoolTcNumber", "previousSchoolTcDate", "penNumber", "rollNumber", "fatherOccupation", "motherOccupation", "annualIncome", "guardianPhone"];
/** The filing fields: the chip-picked ones send the portal's code ("M", "yes", "9", "B+") and a blank clears. */
export const FILING_FIELDS: PupilRecordField[] = ["gender", "nameLocal", "fatherNameLocal", "motherNameLocal", "bpl", "ews", "cwsnType", "bloodGroup"];
const ALL_FIELDS: PupilRecordField[] = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, ...FILING_FIELDS];
/**
 * What a family's form types: the contracts' FAMILY_RECORD_FIELDS. The rest —
 * the admission number and date, the grade admitted to, the previous
 * school's TC, the category, caste, gender, the BPL, EWS and impairment
 * answers, the roll number and the PEN — is the office's, feeds the leaving
 * certificate and the filings, and is shown to the family under the
 * office's note and never sent. Exported so a test can walk the split.
 */
export const FAMILY_WRITABLE: ReadonlySet<PupilRecordField> = new Set<PupilRecordField>(FAMILY_RECORD_FIELDS);
/** The fields a family's body leaves out: everything that is the office's, the PEN included. */
export const OFFICE_FIELDS: PupilRecordField[] = ALL_FIELDS.filter((f) => !FAMILY_WRITABLE.has(f));
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

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A typed date that is not a day key is refused before anything is sent. */
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
  const role = useRole();
  const { locale } = useLocale();
  const [form, setForm] = useState<RecordForm>(() => formFrom(view.record));
  const [tried, setTried] = useState(false);
  const set = (field: PupilRecordField, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const issue = (field: PupilRecordField) => refusal?.issues[field];
  const dateBad = dateProblem(t, form.admissionDate) ?? dateProblem(t, form.previousSchoolTcDate);
  const editable = !busy && view.canEdit;
  // The office's fields — the roll number among them — the family reads and never sends.
  const familySide = role === "PARENT" || role === "STUDENT";
  const omitted: PupilRecordField[] = familySide ? OFFICE_FIELDS : view.penEditable ? [] : ["penNumber"];
  const yesNo = [
    { value: "", label: t("pupilRecord.notSaid") },
    { value: "yes", label: t("pupilRecord.yes") },
    { value: "no", label: t("pupilRecord.no") },
  ];
  /** A coded filing answer: chips for the office, the picked word under the office's note for the family. */
  const codedChips = (field: "gender" | "bpl" | "ews" | "cwsnType", options: { value: string; label: string }[]) =>
    familySide ? readOnly(field, t("pupilRecord.rollNumberOffice"), `record-office-${field}`, options.find((o) => o.value === form[field] && o.value !== "")?.label ?? form[field]) : <Chips key={field} label={fieldLabel(t, field)} value={form[field]} options={options} onChange={(v) => set(field, v)} disabled={!editable} />;
  /** A field shown, never typed: the value or a dash, and the note that says whose it is. */
  const readOnly = (field: PupilRecordField, note: string, testID: string, display?: string) => {
    const shown = display || form[field] || "—";
    return (
      <View key={field} accessible accessibilityLabel={`${fieldLabel(t, field)}: ${shown}. ${note}`} testID={testID} style={{ gap: 2, paddingVertical: th.space[1] }}>
        <Text variant="xs" bold tone="subtle" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {fieldLabel(t, field)}
        </Text>
        <Text variant="base" tone={form[field] ? "fg" : "subtle"}>
          {shown}
        </Text>
        <Text variant="xs" tone="subtle">
          {note}
        </Text>
      </View>
    );
  };
  /**
   * A coded choice as chips: blank, the codes with their labels, and — for
   * a value typed before the codes existed — the stored word as one more
   * chip, so it still shows and goes back only as it is.
   */
  const coded = (field: "category" | "religion" | "motherTongue" | "nationality") => {
    const codes: readonly string[] = field === "category" ? CATEGORY_VALUES : field === "religion" ? RELIGION_VALUES : field === "motherTongue" ? LANGUAGE_VALUES : NATIONALITY_VALUES;
    const labelOf = (code: string): string =>
      t(
        field === "category"
          ? CATEGORY_LABEL[code as (typeof PUPIL_CATEGORIES)[number]]
          : field === "religion"
            ? RELIGION_LABEL[code as (typeof PUPIL_RELIGIONS)[number]]
            : field === "motherTongue"
              ? LANGUAGE_LABEL[code as MotherTongue]
              : NATIONALITY_LABEL[code as Nationality],
      );
    const stored = view.record?.[field] ?? "";
    const options = [{ value: "", label: t("pupilRecord.notSaid") }, ...codes.map((code) => ({ value: code, label: labelOf(code) }))];
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
    if (field === "rollNumber" && familySide) return readOnly(field, t("pupilRecord.rollNumberOffice"), "record-roll-office");
    if (familySide && !FAMILY_WRITABLE.has(field)) {
      // The office's, shown as the word the office picked (a category code as its label), never typed here.
      const stored = form[field];
      const shown = field === "category" && (CATEGORY_VALUES as readonly string[]).includes(stored) ? t(CATEGORY_LABEL[stored as (typeof PUPIL_CATEGORIES)[number]]) : stored;
      return readOnly(field, t("pupilRecord.rollNumberOffice"), `record-office-${field}`, shown);
    }
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
        {codedChips("cwsnType", [{ value: "", label: t("pupilRecord.cwsnNone") }, ...CWSN_TYPES.map((code) => ({ value: code as string, label: cwsnLabel(code) }))])}
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
            if (!dateBad) onSave(bodyFrom(form, omitted));
          }}
        />
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
