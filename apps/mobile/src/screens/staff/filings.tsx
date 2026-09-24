import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filingsViewSchema, MANAGEMENT_TYPES, officeCsvExportSchema, SCHOOL_BOARDS, type FilingIdentitySave, type FilingKind, type FilingsView, type PupilRecordField } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { fieldLabel } from "../shared/pupil-record";
import { shareCsv } from "./attendance";
import { Chips, must, Refusal } from "./shared";

export const FILINGS_PATH = "/api/v1/office/filings";
export const FILINGS_KEY = ["office", "filings"];

/** The five sheets by their literal path, so the catalog gate sees each one the document names. */
const EXPORT_PATH: Record<FilingKind, string> = {
  "udise-students": "/api/v1/office/filings/export/udise-students",
  "udise-enrolment": "/api/v1/office/filings/export/udise-enrolment",
  "udise-teachers": "/api/v1/office/filings/export/udise-teachers",
  "cbse-candidates": "/api/v1/office/filings/export/cbse-candidates",
  "msbshse-candidates": "/api/v1/office/filings/export/msbshse-candidates",
};

const SHEETS: { kind: FilingKind; titleKey: TranslationKey; bodyKey: TranslationKey; byGrade: boolean }[] = [
  { kind: "udise-students", titleKey: "filings.udiseStudents", bodyKey: "filings.udiseStudentsBody", byGrade: false },
  { kind: "udise-enrolment", titleKey: "filings.udiseEnrolment", bodyKey: "filings.udiseEnrolmentBody", byGrade: false },
  { kind: "udise-teachers", titleKey: "filings.udiseTeachers", bodyKey: "filings.udiseTeachersBody", byGrade: false },
  { kind: "cbse-candidates", titleKey: "filings.cbseCandidates", bodyKey: "filings.cbseCandidatesBody", byGrade: true },
  { kind: "msbshse-candidates", titleKey: "filings.msbshseCandidates", bodyKey: "filings.msbshseCandidatesBody", byGrade: true },
];

type IdentityField = keyof FilingIdentitySave;
const IDENTITY_FIELDS: IdentityField[] = ["udiseCode", "board", "affiliationNumber", "district", "block", "medium", "managementType"];
type IdentityForm = Record<IdentityField, string>;

/** The teacher-profile fields the readiness view counts, by the label the staff record uses for each. */
const STAFF_FIELD_KEY: Record<string, TranslationKey> = {
  gender: "staff.filingGender",
  socialCategory: "staff.filingSocialCategory",
  academicQualification: "staff.filingAcademic",
  professionalQualification: "staff.filingProfessional",
  appointmentType: "staff.filingAppointment",
  joinedOn: "staff.joinedOn",
  serviceJoinedOn: "staff.serviceJoinedOn",
};

/** The readiness counts beyond the record's own fields; the rest are record fields the shared form names. */
const PUPIL_FIELD_KEY: Record<string, TranslationKey> = { birthdate: "pupilRecord.dob", parents: "filings.missingParents", classCode: "filings.missingClassCode" };

/** "UDISE+ code, Board" — the identity fields still blank, in the reader's language. */
export function identityFieldList(t: Translate, fields: string[]): string {
  return fields.map((f) => t(`filings.${f}` as TranslationKey)).join(", ");
}

const UDISE = /^(\d{11})?$/;

/**
 * The returns the school files with UDISE+ and its board — the web's
 * /admin/filings on the phone: what the portals know the school as (the
 * office writes it; the head reads it), who is ready and what is still
 * blank on the pupils' and the teachers' records, and the five sheets,
 * each cut on the server and handed to the share sheet as the web's CSV.
 * Nothing is uploaded from here.
 */
export function Filings() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const query = useQuery({ queryKey: FILINGS_KEY, queryFn: async () => filingsViewSchema.parse(unwrap(await api().get(FILINGS_PATH))) });
  const d = query.data;
  if (role !== null && role !== "ADMIN" && role !== "PRINCIPAL") {
    return (
      <Screen title={t("filings.title")}>
        <Empty icon="fileText" title={t("filings.title")} body={t("filings.intro")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
      </Screen>
    );
  }
  const admin = role === "ADMIN";
  return (
    <Screen title={t("filings.title")} description={t("filings.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <IdentityCard key={IDENTITY_FIELDS.map((f) => d.identity[f] ?? "").join("|")} d={d} admin={admin} />
          <ReadinessCard d={d} />
          <SheetsCard d={d} admin={admin} />
        </>
      ) : null}
    </Screen>
  );
}

/** What the portals know the school as. The office edits and saves; the head reads. A blank clears the field. */
function IdentityCard({ d, admin }: { d: FilingsView; admin: boolean }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<IdentityForm>(() => Object.fromEntries(IDENTITY_FIELDS.map((f) => [f, d.identity[f] ?? ""])) as IdentityForm);
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const set = (field: IdentityField, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const udiseBad = !UDISE.test(form.udiseCode.trim());
  const save = useMutation({
    mutationFn: async (body: FilingIdentitySave) => filingsViewSchema.parse(must(await api().post("/api/v1/office/filings/identity", body), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(FILINGS_KEY, next);
      setRefusal(null);
      toast.show(t("filings.identitySaved"), "ok");
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  const issue = (field: IdentityField) => refusal?.issues[field];
  const address = [d.identity.city, d.identity.state, d.identity.postalCode].filter(Boolean).join(" · ");
  return (
    <Card title={t("filings.identityTitle")}>
      <Text variant="xs" tone="subtle">
        {t("filings.identityIntro")}
      </Text>
      {d.identityMissing.length > 0 ? (
        <Text variant="xs" tone="warn" accessibilityLiveRegion="polite">
          {t("filings.identityMissing", { fields: identityFieldList(t, d.identityMissing) })}
        </Text>
      ) : null}
      {refusal ? <Failed message={refusal.message} /> : null}
      <Field
        label={t("filings.udiseCode")}
        hint={t("filings.udiseHint")}
        value={form.udiseCode}
        onChangeText={(v) => set("udiseCode", v)}
        keyboardType="number-pad"
        maxLength={11}
        editable={admin && !save.isPending}
        error={tried && udiseBad ? t("filings.udiseHint") : issue("udiseCode")}
      />
      <Chips
        label={t("filings.board")}
        value={form.board}
        options={[{ value: "", label: t("filings.boardNone") }, ...SCHOOL_BOARDS.map((b) => ({ value: b as string, label: t(`filings.board${b}` as TranslationKey) }))]}
        onChange={(v) => set("board", v)}
        disabled={!admin || save.isPending}
      />
      <Field label={t("filings.affiliationNumber")} hint={t("filings.affiliationHint")} value={form.affiliationNumber} onChangeText={(v) => set("affiliationNumber", v)} maxLength={40} autoCapitalize="characters" editable={admin && !save.isPending} error={issue("affiliationNumber")} />
      <Field label={t("filings.district")} value={form.district} onChangeText={(v) => set("district", v)} maxLength={80} autoCapitalize="words" editable={admin && !save.isPending} error={issue("district")} />
      <Field label={t("filings.block")} value={form.block} onChangeText={(v) => set("block", v)} maxLength={80} autoCapitalize="words" editable={admin && !save.isPending} error={issue("block")} />
      <Field label={t("filings.medium")} hint={t("filings.mediumHint")} value={form.medium} onChangeText={(v) => set("medium", v)} maxLength={40} autoCapitalize="words" editable={admin && !save.isPending} error={issue("medium")} />
      <Chips
        label={t("filings.managementType")}
        value={form.managementType}
        options={[{ value: "", label: t("filings.mgmtNone") }, ...MANAGEMENT_TYPES.map((m) => ({ value: m as string, label: t(`filings.mgmt${m}` as TranslationKey) }))]}
        onChange={(v) => set("managementType", v)}
        disabled={!admin || save.isPending}
      />
      {/* The address the portals ask for beside the code comes from the school's own details, read here and changed in settings. */}
      <View accessible accessibilityLabel={`${t("settings.region")}: ${address || "—"}`} style={{ gap: 2, paddingVertical: th.space[1] }}>
        <Text variant="xs" bold tone="subtle" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {t("settings.region")}
        </Text>
        <Text variant="base" tone={address ? "fg" : "subtle"}>
          {address || "—"}
        </Text>
      </View>
      {admin ? (
        <Button
          label={t("filings.saveIdentity")}
          busy={save.isPending}
          accessibilityLabel={`${t("filings.saveIdentity")}: ${t("filings.identityTitle")}`}
          onPress={() => {
            setTried(true);
            if (udiseBad) return;
            const body = {} as Record<IdentityField, string>;
            for (const f of IDENTITY_FIELDS) body[f] = form[f].trim();
            save.mutate(body as FilingIdentitySave);
          }}
        />
      ) : null}
    </Card>
  );
}

/** Who is ready: the pupils and the teachers with every field, what is still blank and how many lack it, and the doors to the records. */
function ReadinessCard({ d }: { d: FilingsView }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const pupilMissing = Object.entries(d.pupils.missing).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const staffMissing = Object.entries(d.staff.missing).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return (
    <Card title={t("filings.readinessTitle")}>
      <Text variant="sm" tone={d.pupils.ready < d.pupils.total ? "warn" : "fg"}>
        {t("filings.pupilsReady", { ready: d.pupils.ready, total: d.pupils.total })}
      </Text>
      <Text variant="sm" tone={d.staff.ready < d.staff.total ? "warn" : "fg"}>
        {t("filings.staffReady", { ready: d.staff.ready, total: d.staff.total })}
      </Text>
      {d.pupils.withoutLocalName > 0 ? (
        <Text variant="xs" tone="subtle">
          {t("filings.withoutLocalName", { count: d.pupils.withoutLocalName })}
        </Text>
      ) : null}
      {pupilMissing.length > 0 ? (
        <View style={{ gap: th.space[1] }}>
          <Text variant="xs" bold tone="subtle">
            {t("filings.pupilsMissing")}
          </Text>
          {pupilMissing.map(([field, n]) => (
            <Row key={field} title={PUPIL_FIELD_KEY[field] ? t(PUPIL_FIELD_KEY[field]) : fieldLabel(t, field as PupilRecordField)} right={<Text variant="base" bold tone="warn">{n}</Text>} />
          ))}
        </View>
      ) : null}
      {staffMissing.length > 0 ? (
        <View style={{ gap: th.space[1] }}>
          <Text variant="xs" bold tone="subtle">
            {t("filings.staffMissing")}
          </Text>
          {staffMissing.map(([field, n]) => (
            <Row key={field} title={STAFF_FIELD_KEY[field] ? t(STAFF_FIELD_KEY[field]) : field} right={<Text variant="base" bold tone="warn">{n}</Text>} />
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={t("filings.openRecords")} variant="secondary" onPress={() => router.push("/(app)/pupil-records" as never)} />
        <Button label={t("filings.openStaff")} variant="secondary" onPress={() => router.push("/(app)/staff" as never)} />
      </View>
    </Card>
  );
}

/** The five sheets. Each is cut on the server (and audited there) and handed to the share sheet; the board sheets take a grade. */
function SheetsCard({ d, admin }: { d: FilingsView; admin: boolean }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [grade, setGrade] = useState(d.grades[0]?.gradeLevel ?? "");
  const share = useMutation({
    mutationFn: async (input: { kind: FilingKind; grade?: string }) => officeCsvExportSchema.parse(unwrap(await api().get(`${EXPORT_PATH[input.kind]}${input.grade ? `?grade=${encodeURIComponent(input.grade)}` : ""}`))),
    onSuccess: shareCsv,
    onError: (e) => toast.show(e.message, "danger"),
  });
  const busy = (kind: FilingKind) => share.isPending && share.variables?.kind === kind;
  const sheet = (s: (typeof SHEETS)[number], enabled: boolean) => (
    <View key={s.kind} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
      <Text variant="base" bold>
        {t(s.titleKey)}
      </Text>
      <Text variant="xs" tone="subtle">
        {t(s.bodyKey)}
      </Text>
      {admin && enabled ? (
        <Button label={t("filings.share")} variant="secondary" busy={busy(s.kind)} disabled={share.isPending && !busy(s.kind)} accessibilityLabel={`${t("filings.share")}: ${t(s.titleKey)}`} onPress={() => share.mutate(s.byGrade ? { kind: s.kind, grade } : { kind: s.kind })} />
      ) : null}
    </View>
  );
  return (
    <Card title={t("filings.sheetsTitle")}>
      <Text variant="xs" tone="subtle">
        {[d.academicYearName ? t("filings.year", { name: d.academicYearName }) : null, t("filings.sheetsIntro")].filter(Boolean).join(" · ")}
      </Text>
      {SHEETS.filter((s) => !s.byGrade).map((s) => sheet(s, true))}
      {d.grades.length === 0 ? (
        <Empty icon="chalkboard" title={t("filings.noGrades")} body={t("filings.noGradesBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
      ) : (
        <Chips label={t("filings.grade")} value={grade} options={d.grades.map((g) => ({ value: g.gradeLevel, label: `${g.gradeLevel} (${g.pupils})` }))} onChange={setGrade} />
      )}
      {SHEETS.filter((s) => s.byGrade).map((s) => sheet(s, d.grades.length > 0))}
      <Text variant="xs" tone="subtle">
        {t("filings.codesNote")}
      </Text>
    </Card>
  );
}

/**
 * "Filings" — the card the office's and the head's homes carry while the
 * school's filing identity has a blank or a pupil's record lacks a UDISE+
 * field. It asks for the view itself and draws nothing while it loads,
 * fails, or finds everything ready: a nudge, not a section.
 */
export function FilingsCard() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({ queryKey: FILINGS_KEY, queryFn: async () => filingsViewSchema.parse(unwrap(await api().get(FILINGS_PATH))) });
  const d = query.data;
  if (!d || (d.identityMissing.length === 0 && d.pupils.ready >= d.pupils.total)) return null;
  return (
    <Card title={t("filings.title")}>
      <Row
        title={t("filings.pupilsReady", { ready: d.pupils.ready, total: d.pupils.total })}
        caption={d.identityMissing.length > 0 ? t("filings.identityMissing", { fields: identityFieldList(t, d.identityMissing) }) : undefined}
        onPress={() => router.push("/(app)/filings" as never)}
      />
    </Card>
  );
}
