import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STAFF_APPOINTED_SUBJECTS, staffRecordViewSchema, type StaffAppointedSubject, type StaffRecordPage, type StaffRecordSave } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { Chips } from "./shared";

/** The form as it is typed: every field a string, a blank for "not said". */
export type StaffForm = Record<keyof StaffRecordSave, string>;
const TEXT_FIELDS = ["staffNumber", "designation", "qualification"] as const;
const DATE_FIELDS = ["joinedOnKey", "birthdateKey", "serviceJoinedOnKey"] as const;
const CODED_FIELDS = ["gender", "socialCategory", "academicQualification", "professionalQualification", "appointmentType", "appointedSubject"] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const SUBJECT_KEY: Record<StaffAppointedSubject, TranslationKey> = { MATHEMATICS: "staff.subjectMathematics", EVS: "staff.subjectEvs", MUSIC: "staff.subjectMusic", SCIENCE: "staff.subjectScience", SOCIAL_SCIENCE: "staff.subjectSocialScience", ACCOUNTANCY: "staff.subjectAccountancy", BIOLOGY: "staff.subjectBiology", BUSINESS_STUDIES: "staff.subjectBusinessStudies", CHEMISTRY: "staff.subjectChemistry", COMPUTER_SCIENCE: "staff.subjectComputerScience", ECONOMICS: "staff.subjectEconomics", GEOGRAPHY: "staff.subjectGeography", HISTORY: "staff.subjectHistory", PHYSICS: "staff.subjectPhysics", POLITICAL_SCIENCE: "staff.subjectPoliticalScience", PSYCHOLOGY: "staff.subjectPsychology", HINDI: "staff.subjectHindi", SANSKRIT: "staff.subjectSanskrit", URDU: "staff.subjectUrdu", ENGLISH: "staff.subjectEnglish", REGIONAL_LANGUAGE: "staff.subjectRegionalLanguage", SOCIOLOGY: "staff.subjectSociology", STATISTICS: "staff.subjectStatistics", ART: "staff.subjectArt", PHYSICAL_EDUCATION: "staff.subjectPhysicalEducation", WORK_EDUCATION: "staff.subjectWorkEducation" };
/** The coded answers and the words for them: the portal's own codes, as the web's panel offers them. */
export const CHOICES: Record<(typeof CODED_FIELDS)[number], { value: string; key: TranslationKey }[]> = {
  gender: [{ value: "M", key: "pupilRecord.genderM" }, { value: "F", key: "pupilRecord.genderF" }, { value: "T", key: "pupilRecord.genderT" }],
  socialCategory: [{ value: "GENERAL", key: "filings.catGeneral" }, { value: "SC", key: "filings.catSC" }, { value: "ST", key: "filings.catST" }, { value: "OBC", key: "filings.catOBC" }, { value: "VJ", key: "pupilRecord.catVJ" }, { value: "NT", key: "pupilRecord.catNT" }, { value: "SBC", key: "pupilRecord.catSBC" }],
  academicQualification: ["1", "2", "3", "4", "5", "6", "7", "8"].map((code) => ({ value: code, key: `staff.aq${code}` as TranslationKey })),
  professionalQualification: ["1", "2", "3", "4", "5", "6", "7", "8", "10", "11", "12"].map((code) => ({ value: code, key: `staff.pq${code}` as TranslationKey })),
  appointmentType: [{ value: "REGULAR", key: "staff.apptRegular" }, { value: "CONTRACT", key: "staff.apptContract" }, { value: "PART_TIME", key: "staff.apptPartTime" }],
  appointedSubject: STAFF_APPOINTED_SUBJECTS.map((code) => ({ value: code as string, key: SUBJECT_KEY[code] })),
};
const LABEL: Record<keyof StaffRecordSave, TranslationKey> = {
  staffNumber: "staff.staffNumber", designation: "staff.designation", qualification: "staff.qualification", joinedOnKey: "staff.joinedOn", birthdateKey: "staff.birthdate", serviceJoinedOnKey: "staff.serviceJoinedOn",
  leaveDaysPerYear: "staff.leaveDays", gender: "staff.filingGender", socialCategory: "staff.filingSocialCategory", academicQualification: "staff.filingAcademic", professionalQualification: "staff.filingProfessional",
  appointmentType: "staff.filingAppointment", appointedSubject: "staff.filingAppointedSubject",
};

export function staffFormFrom(record: StaffRecordSave): StaffForm {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, v === null ? "" : String(v)])) as StaffForm;
}
/**
 * THE WHOLE RECORD, every key: the server replaces the record with what it
 * is sent, so a blank goes as null and nothing is left out.
 */
export function staffBodyFrom(form: StaffForm): StaffRecordSave {
  const text = (v: string) => v.trim() || null;
  const days = form.leaveDaysPerYear.trim();
  return {
    staffNumber: text(form.staffNumber), designation: text(form.designation), qualification: text(form.qualification),
    joinedOnKey: text(form.joinedOnKey), birthdateKey: text(form.birthdateKey), serviceJoinedOnKey: text(form.serviceJoinedOnKey),
    leaveDaysPerYear: days === "" ? null : Number(days),
    gender: text(form.gender), socialCategory: text(form.socialCategory), academicQualification: text(form.academicQualification), professionalQualification: text(form.professionalQualification),
    appointmentType: text(form.appointmentType), appointedSubject: text(form.appointedSubject),
  };
}

/**
 * A member of staff's record — the web's panel on the directory row: the
 * desk's fields (number, designation, qualification, the three dates, the
 * leave allowance) and the teacher filing's coded answers, one save. The
 * office edits; the head reads the same screen with nothing to press.
 */
export function StaffRecord() {
  const t = useT();
  const { membershipId } = useLocalSearchParams<{ membershipId?: string }>();
  const id = membershipId ?? "";
  const query = useQuery({
    queryKey: ["admin", "staff-record", membershipId],
    enabled: Boolean(membershipId),
    queryFn: async () => staffRecordViewSchema.parse(unwrap(await api().get(`/api/v1/admin/people/${encodeURIComponent(id)}/staff-record`))),
  });
  const d = query.data;
  return (
    <Screen title={d ? t("staff.title", { name: d.name }) : t("people.staffRecordAction")} description={d ? t("staff.body", { name: d.name }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {/* Keyed by what was read: a record read again starts the form again from it. */}
      {d ? <RecordForm key={JSON.stringify(d.record)} id={id} view={d} /> : null}
    </Screen>
  );
}

function RecordForm({ id, view }: { id: string; view: StaffRecordPage }) {
  const t = useT();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<StaffForm>(() => staffFormFrom(view.record));
  const [issues, setIssues] = useState<Partial<Record<keyof StaffRecordSave, string>>>({});
  const save = useMutation({
    mutationFn: async (body: StaffRecordSave) => {
      const result = await api().post(`/api/v1/admin/people/${encodeURIComponent(id)}/staff-record`, body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
    },
    onSuccess: () => {
      toast.show(t("staff.saved"));
      void qc.invalidateQueries({ queryKey: ["admin", "staff"] });
      void qc.invalidateQueries({ queryKey: ["admin", "staff-record", id] });
    },
  });
  const editable = view.canEdit;
  const set = (field: keyof StaffRecordSave, value: string) => {
    setForm((was) => ({ ...was, [field]: value }));
    if (save.isError) save.reset();
  };
  const submit = () => {
    const next: typeof issues = {};
    for (const f of DATE_FIELDS) if (form[f].trim() && !DATE.test(form[f].trim())) next[f] = t("staff.badDate");
    const days = form.leaveDaysPerYear.trim();
    if (days && (!/^\d{1,3}$/.test(days) || Number(days) > 365)) next.leaveDaysPerYear = t("staff.badLeaveDays");
    setIssues(next);
    if (Object.keys(next).length === 0) save.mutate(staffBodyFrom(form));
  };
  return (
    <>
      {!editable ? (
        <Text variant="xs" tone="subtle">
          {t("staff.rosterReadOnly")}
        </Text>
      ) : null}
      <Card>
        {TEXT_FIELDS.map((f) => (
          <Field key={f} label={t(LABEL[f])} value={form[f]} onChangeText={(v) => set(f, v)} editable={editable} maxLength={f === "qualification" ? 200 : f === "designation" ? 80 : 40} autoCorrect={false} />
        ))}
        {DATE_FIELDS.map((f) => (
          <Field key={f} label={t(LABEL[f])} hint={f === "serviceJoinedOnKey" ? `${t("staff.serviceJoinedOnHint")} · YYYY-MM-DD` : "YYYY-MM-DD"} value={form[f]} onChangeText={(v) => set(f, v)} editable={editable} maxLength={10} keyboardType="numbers-and-punctuation" autoCapitalize="none" autoCorrect={false} error={issues[f]} />
        ))}
        <Field label={t(LABEL.leaveDaysPerYear)} hint={t("staff.leaveDaysHint")} value={form.leaveDaysPerYear} onChangeText={(v) => set("leaveDaysPerYear", v.replace(/\D/g, ""))} editable={editable} maxLength={3} keyboardType="number-pad" error={issues.leaveDaysPerYear} />
      </Card>
      <Card>
        <Text variant="xs" tone="muted">
          {t("staff.filingHint")}
        </Text>
        {CODED_FIELDS.map((f) => (
          <View key={f}>
            <Chips label={t(LABEL[f])} value={form[f]} options={[{ value: "", label: t("pupilRecord.notSaid") }, ...CHOICES[f].map((c) => ({ value: c.value, label: t(c.key) }))]} onChange={(v) => set(f, v)} disabled={!editable} />
          </View>
        ))}
      </Card>
      {save.isError ? <Failed message={save.error.message} /> : null}
      {editable ? <Button label={t("common.save")} busy={save.isPending} onPress={submit} /> : null}
    </>
  );
}
