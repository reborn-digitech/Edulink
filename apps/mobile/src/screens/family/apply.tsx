import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationSchema, schoolAdmissionsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { dateProblem } from "../shared/pupil-record";
import { Chips, must, Refusal } from "../staff/shared";
import { MY_APPLICATIONS_KEY } from "./applications";
import { formatDateKey, Note, param } from "./shared";

type Relation = "PARENT" | "GUARDIAN" | "OTHER";

/**
 * Apply to a school — the web's /explore/[schoolId]/apply: the open cycle
 * as the school's page shows it (the grades and seats left, the documents
 * it will ask for, the test, the notice), then the form for one child. The
 * applicant is this account; the server takes their name and phone from
 * it. The application opens as soon as it is sent, where the documents
 * are attached.
 */
export function Apply() {
  const params = useLocalSearchParams<{ schoolId?: string; school?: string }>();
  const schoolId = param(params.schoolId);
  const schoolName = param(params.school);
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [grade, setGrade] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [penNumber, setPenNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [relation, setRelation] = useState<Relation>("PARENT");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const query = useQuery({
    queryKey: ["shared", "school-admissions", schoolId],
    enabled: Boolean(schoolId),
    queryFn: async () => schoolAdmissionsSchema.parse(unwrap(await api().get(`/api/v1/shared/schools/${schoolId}/admissions`))),
  });
  const open = query.data?.open ?? null;
  const apply = useMutation({
    mutationFn: async () =>
      applicationSchema.parse(
        must(
          await api().post("/api/v1/family/applications", {
            schoolId,
            cycleId: open!.cycleId,
            childName: childName.trim(),
            childBirthdate: birthdate.trim() || null,
            gradeApplied: grade,
            relation,
            ...(previousSchool.trim() ? { previousSchool: previousSchool.trim() } : {}),
            ...(penDigits ? { penNumber: penDigits } : {}),
            ...(address.trim() ? { addressLine: address.trim() } : {}),
            ...(city.trim() ? { city: city.trim() } : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
          }),
          t("common.somethingWrong"),
        ),
      ),
    onSuccess: (a) => {
      qc.setQueryData(["family", "application", a.id], a);
      void qc.invalidateQueries({ queryKey: MY_APPLICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: ["shared", "school-admissions", schoolId] });
      toast.show(t("admissions.submitted"), "ok");
      router.replace({ pathname: "/(app)/my-application", params: { id: a.id } } as never);
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (!schoolId) {
    return (
      <Screen title={t("admissions.applyHere")}>
        <Empty icon="buildings" title={t("admissions.noOpenCycle")} action={<Button label={t("admissions.findSchools")} variant="secondary" onPress={() => router.push("/(app)/explore" as never)} />} />
      </Screen>
    );
  }
  const dateBad = dateProblem(t, birthdate);
  const penDigits = penNumber.replace(/[\s-]/g, "");
  const penBad = penDigits && !/^\d{11}$/.test(penDigits) ? t("pupilRecord.penFormat") : undefined;
  const required = (value: string) => (tried && !value.trim() ? t("refusal.required") : undefined);
  const send = () => {
    setTried(true);
    if (!open || !childName.trim() || !grade || dateBad || penBad) return;
    apply.mutate();
  };
  const title = schoolName ? t("admissions.applyTitle", { school: schoolName }) : t("admissions.applyHere");
  return (
    <Screen title={title} description={open ? t("admissions.applyIntro", { cycle: open.name, year: open.academicYearName }) : undefined}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        !open ? (
          <Empty icon="buildings" title={t("admissions.noOpenCycle")} action={<Button label={t("admissions.findSchools")} variant="secondary" onPress={() => router.push("/(app)/explore" as never)} />} />
        ) : (
          <>
            <Card title={open.name}>
              {open.grades.map((g) => (
                <Text key={g.grade} variant="sm">
                  {`${t("admissions.grade")} ${g.grade} · ${t("admissions.seatsLeft", { remaining: g.remaining, seats: g.seats })}`}
                </Text>
              ))}
              {open.documents.length > 0 ? (
                <Text variant="sm" tone="muted">
                  {t("admissions.documentsAsked", { names: open.documents.map((d) => d.name).join(", ") })}
                </Text>
              ) : null}
              {open.testRequired ? (
                <Text variant="sm" tone="muted">
                  {t("admissions.testAsked")}
                </Text>
              ) : null}
              {open.closesAt ? (
                <Text variant="sm" tone="warn">
                  {t("admissions.closesOn", { date: formatDateKey(open.closesAt, locale) })}
                </Text>
              ) : null}
              {open.notice ? (
                <Note tone="accent">
                  <Text variant="sm">{open.notice}</Text>
                </Note>
              ) : null}
            </Card>
            <Card title={t("admissions.child")}>
              {refusal ? <Failed message={refusal.message} /> : null}
              <Field label={t("admissions.childName")} value={childName} onChangeText={setChildName} maxLength={120} error={required(childName) ?? refusal?.issues.childName} />
              <Field label={t("admissions.childBirthdate")} hint="YYYY-MM-DD" value={birthdate} onChangeText={setBirthdate} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} error={(tried ? dateBad : undefined) ?? refusal?.issues.childBirthdate} />
              <Chips label={t("admissions.gradeApplied")} value={grade} options={open.grades.map((g) => ({ value: g.grade, label: `${g.grade} · ${t("admissions.seatsLeft", { remaining: g.remaining, seats: g.seats })}` }))} onChange={setGrade} disabled={apply.isPending} />
              {tried && !grade ? (
                <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
                  {t("refusal.required")}
                </Text>
              ) : null}
              <Field label={t("admissions.previousSchool")} value={previousSchool} onChangeText={setPreviousSchool} maxLength={160} error={refusal?.issues.previousSchool} />
              <Field label={t("admissions.penNumber")} hint={t("pupilRecord.penHint")} value={penNumber} onChangeText={setPenNumber} autoCapitalize="none" keyboardType="number-pad" maxLength={11} error={(tried ? penBad : undefined) ?? refusal?.issues.penNumber} />
              <Field label={t("admissions.address")} value={address} onChangeText={setAddress} maxLength={200} error={refusal?.issues.addressLine} />
              <Field label={t("admissions.city")} value={city} onChangeText={setCity} maxLength={120} error={refusal?.issues.city} />
              <Field label={t("admissions.note")} value={note} onChangeText={setNote} maxLength={2000} multiline error={refusal?.issues.note} />
              <Chips<Relation> label={t("admissions.relation")} value={relation} options={[{ value: "PARENT", label: t("admissions.relationParent") }, { value: "GUARDIAN", label: t("admissions.relationGuardian") }, { value: "OTHER", label: t("admissions.relationOther") }]} onChange={setRelation} disabled={apply.isPending} />
              <View style={{ paddingTop: th.space[2] }}>
                <Button label={t("admissions.submit")} busy={apply.isPending} onPress={send} />
              </View>
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}
