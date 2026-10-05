import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationSchema, cyclesViewSchema, type ApplicationSave } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { param } from "../family/shared";
import { dateProblem } from "../shared/pupil-record";
import { Chips, must, openWeb, Refusal } from "./shared";
import { CYCLES_KEY } from "./admissions";

type Relation = "PARENT" | "GUARDIAN" | "OTHER";

/**
 * A walk-in family's application — the web's /admin/admissions/applications/new:
 * the office picks an open cycle and a grade it takes, writes the child and
 * the family from the paper form, and the application opens as it would
 * have from the family's own phone. There is no account behind it, so the
 * office answers for them from then on.
 */
export function ApplicationNew() {
  const params = useLocalSearchParams<{ cycleId?: string }>();
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [cycleId, setCycleId] = useState(param(params.cycleId) ?? "");
  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [grade, setGrade] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [penNumber, setPenNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<Relation>("PARENT");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const cycles = useQuery({ queryKey: CYCLES_KEY, queryFn: async () => cyclesViewSchema.parse(unwrap(await api().get("/api/v1/office/admissions/cycles"))) });
  const open = (cycles.data?.cycles ?? []).filter((c) => c.status === "OPEN");
  const chosen = open.find((c) => c.id === cycleId) ?? null;
  const create = useMutation({
    mutationFn: async (body: ApplicationSave) => applicationSchema.parse(must(await api().post("/api/v1/office/admissions/applications", body), t("common.somethingWrong"))),
    onSuccess: (a) => {
      qc.setQueryData(["office", "admissions", "application", a.id], a);
      void qc.invalidateQueries({ queryKey: ["office", "admissions", "applications"] });
      void qc.invalidateQueries({ queryKey: CYCLES_KEY });
      toast.show(t("admissions.submitted"), "ok");
      router.replace({ pathname: "/(app)/application", params: { id: a.id } } as never);
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  const dateBad = dateProblem(t, birthdate);
  const penDigits = penNumber.replace(/[\s-]/g, "");
  const penBad = penDigits && !/^\d{11}$/.test(penDigits) ? t("pupilRecord.penFormat") : undefined;
  const required = (value: string) => (tried && !value.trim() ? t("refusal.required") : undefined);
  const send = () => {
    setTried(true);
    if (!chosen || !childName.trim() || !grade || !applicantName.trim() || dateBad || penBad) return;
    create.mutate({
      cycleId: chosen.id,
      childName: childName.trim(),
      childBirthdate: birthdate.trim() || null,
      gradeApplied: grade,
      applicantName: applicantName.trim(),
      relation,
      ...(previousSchool.trim() ? { previousSchool: previousSchool.trim() } : {}),
      ...(penDigits ? { penNumber: penDigits } : {}),
      ...(address.trim() ? { addressLine: address.trim() } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(phone.trim() ? { applicantPhone: phone.trim() } : {}),
      ...(email.trim() ? { applicantEmail: email.trim() } : {}),
    });
  };
  return (
    <Screen title={t("admissions.walkIn")} description={t("admissions.walkInIntro")}>
      {cycles.isPending ? <Loading /> : null}
      {cycles.isError ? <Failed error={cycles.error} onRetry={() => void cycles.refetch()} /> : null}
      {cycles.data ? (
        open.length === 0 ? (
          <Empty icon="users" title={t("admissions.noCycles")} body={t("admissions.noCyclesBody")} action={<Button label={t("admissions.newCycle")} variant="secondary" onPress={() => openWeb("/admin/admissions")} />} />
        ) : (
          <>
            <Card title={t("admissions.child")}>
              {refusal ? <Failed message={refusal.message} /> : null}
              <Chips label={t("admissions.cyclesTitle")} value={cycleId} options={open.map((c) => ({ value: c.id, label: `${c.name} · ${c.academicYearName}` }))} onChange={(next) => { setCycleId(next); setGrade(""); }} disabled={create.isPending} />
              {tried && !chosen ? (
                <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
                  {t("refusal.required")}
                </Text>
              ) : null}
              {chosen ? <Chips label={t("admissions.gradeApplied")} value={grade} options={chosen.grades.map((g) => ({ value: g.grade, label: `${g.grade} · ${g.seats} ${t("admissions.seats").toLowerCase()}` }))} onChange={setGrade} disabled={create.isPending} /> : null}
              {tried && chosen && !grade ? (
                <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
                  {t("refusal.required")}
                </Text>
              ) : null}
              <Field label={t("admissions.childName")} value={childName} onChangeText={setChildName} maxLength={120} error={required(childName) ?? refusal?.issues.childName} />
              <Field label={t("admissions.childBirthdate")} hint="YYYY-MM-DD" value={birthdate} onChangeText={setBirthdate} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} error={(tried ? dateBad : undefined) ?? refusal?.issues.childBirthdate} />
              <Field label={t("admissions.previousSchool")} value={previousSchool} onChangeText={setPreviousSchool} maxLength={160} error={refusal?.issues.previousSchool} />
              <Field label={t("admissions.penNumber")} hint={t("pupilRecord.penHint")} value={penNumber} onChangeText={setPenNumber} autoCapitalize="none" keyboardType="number-pad" maxLength={11} error={(tried ? penBad : undefined) ?? refusal?.issues.penNumber} />
              <Field label={t("admissions.address")} value={address} onChangeText={setAddress} maxLength={200} error={refusal?.issues.addressLine} />
              <Field label={t("admissions.city")} value={city} onChangeText={setCity} maxLength={120} error={refusal?.issues.city} />
              <Field label={t("admissions.note")} value={note} onChangeText={setNote} maxLength={2000} multiline error={refusal?.issues.note} />
            </Card>
            <Card title={t("admissions.applicant")}>
              <Field label={t("admissions.applicantName")} value={applicantName} onChangeText={setApplicantName} maxLength={120} error={required(applicantName) ?? refusal?.issues.applicantName} />
              <Field label={t("admissions.applicantPhone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={40} error={refusal?.issues.applicantPhone} />
              <Field label={t("admissions.applicantEmail")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={200} error={refusal?.issues.applicantEmail} />
              <Chips<Relation> label={t("admissions.relation")} value={relation} options={[{ value: "PARENT", label: t("admissions.relationParent") }, { value: "GUARDIAN", label: t("admissions.relationGuardian") }, { value: "OTHER", label: t("admissions.relationOther") }]} onChange={setRelation} disabled={create.isPending} />
              <View style={{ paddingTop: th.space[2] }}>
                <Button label={t("admissions.submit")} busy={create.isPending} onPress={send} />
              </View>
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}
