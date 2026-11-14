import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { admittedSchema, applicationSchema, type ApplicationView } from "@edulink/contracts";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateKey, Note, param } from "../family/shared";
import { DetailsCard, DocumentsCard, Line, slotLine, StagePill } from "../shared/application";
import { dateProblem } from "../shared/pupil-record";
import { must, Refusal } from "./shared";
import { CYCLES_KEY } from "./admissions";

type Admitted = z.infer<typeof admittedSchema>;
const day = (iso: string, locale: string) => formatDateKey(iso.slice(0, 10), locale);
/**
 * The answer-by day (R-62, risks batch 5 Oct 2026): the server's `offerExpiresOn`, the school-zone day the office typed;
 * an older server's answer has only the instant, whose UTC day is right east of UTC (India) and a day late west of it.
 */
const answerBy = (a: { offerExpiresOn?: string | null; offerExpiresAt: string | null }, locale: string) => (a.offerExpiresOn ? formatDateKey(a.offerExpiresOn, locale) : a.offerExpiresAt ? day(a.offerExpiresAt, locale) : null);

/**
 * One application as the office sees it — the web's
 * /admin/admissions/applications/[id]: the child and the family, the
 * documents against the cycle's list with the office attaching a walk-in's
 * and marking them checked, the sitting and the result, the offer, the
 * decision, and the seat. Every button is there only while the server says
 * it may be pressed (`can`), and each answer replaces the view in place.
 * Admitting shows what the server made once: the student code and the
 * first sign-in code that goes home on a slip.
 */
export function StaffApplication() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = param(params.id);
  // Keyed by the application (TA-155): the route stays mounted as a tab, so without the key the next applicant opened
  // here kept the last one's admitted box (its student code and first sign-in code), its typed notes and a hidden Admit.
  return <ApplicationBody key={id ?? ""} id={id} />;
}

function ApplicationBody({ id }: { id: string | undefined }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [score, setScore] = useState("");
  const [testNote, setTestNote] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [admitted, setAdmitted] = useState<Admitted | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const key = ["office", "admissions", "application", id];
  const base = `/api/v1/office/admissions/applications/${id}`;
  const query = useQuery({ queryKey: key, enabled: Boolean(id), queryFn: async () => applicationSchema.parse(unwrap(await api().get(base))) });
  const landed = (next: ApplicationView) => {
    qc.setQueryData(key, next);
    setRefusal(null);
    void qc.invalidateQueries({ queryKey: ["office", "admissions", "applications"] });
    void qc.invalidateQueries({ queryKey: CYCLES_KEY });
  };
  const refuse = (e: Error) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {}));
  const post = async (tail: string, body: unknown) => applicationSchema.parse(must(await api().post(`${base}${tail}`, body), t("common.somethingWrong")));
  const attach = useMutation({ mutationFn: (doc: { key: string; fileId: string; name: string }) => post("/documents", { documents: [doc] }), onSuccess: landed, onError: refuse });
  const verify = useMutation({ mutationFn: () => post("/verify", {}), onSuccess: landed, onError: refuse });
  const test = useMutation({
    mutationFn: () => post("/test", { score: score.trim() || null, ...(testNote.trim() ? { note: testNote.trim() } : {}) }),
    onSuccess: (next) => {
      landed(next);
      toast.show(t("admissions.testRecorded"), "ok");
    },
    onError: refuse,
  });
  const offer = useMutation({
    mutationFn: () => post("/offer", { expiresOn: expiresOn.trim() || null, ...(offerNote.trim() ? { note: offerNote.trim() } : {}) }),
    onSuccess: landed,
    onError: refuse,
  });
  // A walk-in family's answer, said at the counter (TA-179): the server draws `can.respond` for the office only when no account stands behind the application.
  const answer = useMutation({
    mutationFn: (choice: "ACCEPT" | "DECLINE") => post("/respond", { answer: choice }),
    onSuccess: (next) => {
      landed(next);
      toast.show(t("admissions.answerRecorded"), "ok");
    },
    onError: refuse,
  });
  const decide = useMutation({
    mutationFn: (status: "DECLINED" | "WAITLISTED" | "SUBMITTED") => post("/decide", { status, ...(decisionNote.trim() ? { note: decisionNote.trim() } : {}) }),
    onSuccess: (next) => {
      landed(next);
      setDecisionNote("");
    },
    onError: refuse,
  });
  const admit = useMutation({
    mutationFn: async () => admittedSchema.parse(must(await api().post(`${base}/admit`, admissionNumber.trim() ? { admissionNumber: admissionNumber.trim() } : {}), t("common.somethingWrong"))),
    onSuccess: (result) => {
      setAdmitted(result);
      setRefusal(null);
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["office", "admissions", "applications"] });
      void qc.invalidateQueries({ queryKey: CYCLES_KEY });
    },
    onError: refuse,
  });
  if (!id) {
    return (
      <Screen title={t("admissions.pipelineTitle")}>
        <Empty icon="users" title={t("admissions.notFound")} action={<Button label={t("admissions.pipelineTitle")} variant="secondary" onPress={() => router.push("/(app)/applications" as never)} />} />
      </Screen>
    );
  }
  const a = query.data;
  const expiresBad = dateProblem(t, expiresOn);
  return (
    <Screen title={a ? t("admissions.applicationTitle", { serial: a.serial }) : t("admissions.pipelineTitle")} description={a ? `${a.childName} · ${a.cycle.name}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {a ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
            <StagePill status={a.status} />
          </View>
          {refusal ? <Failed message={refusal.message} /> : null}
          {admitted ? (
            <Note tone="ok">
              <Text variant="base" bold>
                {t("admissions.admittedResult", { name: a.childName })}
              </Text>
              <Line label={t("admissions.studentCode")} value={admitted.studentCode} />
              <Line label={t("admissions.className")} value={admitted.className ?? t("admissions.noClass")} />
              {admitted.firstSignInCode ? (
                <>
                  <Line label={t("admissions.firstSignInCode")} value={admitted.firstSignInCode} />
                  <Text variant="xs" tone="muted">
                    {t("admissions.firstSignInHint")}
                  </Text>
                </>
              ) : null}
              <Text variant="sm">{admitted.feePlan ? t("admissions.feePlanCreated") : t("admissions.feePlanNone")}</Text>
              <Text variant="sm">{admitted.guardianLinked ? t("admissions.guardianLinked") : t("admissions.guardianStandin")}</Text>
              <Button label={t("admissions.openRoll")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/pupil-record", params: { membershipId: admitted.studentMembershipId } } as never)} />
            </Note>
          ) : null}
          <DetailsCard a={a} />
          <DocumentsCard a={a} canUpload={a.can.uploadDocuments} onAttach={(doc) => attach.mutateAsync(doc)} verify={{ can: a.can.verifyDocuments, busy: verify.isPending, onVerify: () => verify.mutate() }} />
          {a.cycle.testRequired ? (
            <Card title={t("admissions.testTitle")}>
              <Line label={t("admissions.testSlot")} value={a.testSlot ? slotLine(a.testSlot, locale) : t("admissions.noSlotBooked")} />
              {a.testedAt ? (
                <>
                  <Text variant="sm" tone="ok" bold>
                    {t("admissions.testedOn", { date: day(a.testedAt, locale) })}
                  </Text>
                  <Line label={t("admissions.score")} value={a.testScore} />
                  {a.testNote ? <Line label={t("admissions.testNote")} value={a.testNote} /> : null}
                </>
              ) : null}
              {a.can.recordTest ? (
                <>
                  <Field label={t("admissions.score")} value={score} onChangeText={setScore} maxLength={40} error={refusal?.issues.score} />
                  <Field label={t("admissions.testNote")} value={testNote} onChangeText={setTestNote} maxLength={400} multiline error={refusal?.issues.note} />
                  <Button label={t("admissions.recordTest")} busy={test.isPending} onPress={() => test.mutate()} />
                </>
              ) : null}
            </Card>
          ) : null}
          {a.offeredAt || a.can.offer ? (
            <Card title={t("admissions.offerTitle")}>
              {a.offeredAt ? (
                <>
                  <Text variant="sm" tone="muted">
                    {[t("admissions.offeredOn", { date: day(a.offeredAt, locale) }), answerBy(a, locale) ? t("admissions.respondBy", { date: answerBy(a, locale)! }) : null, a.feeStructureName].filter(Boolean).join(" · ")}
                  </Text>
                  {a.offerNote ? <Line label={t("admissions.offerNote")} value={a.offerNote} /> : null}
                  {a.respondedAt && (a.status === "ACCEPTED" || a.status === "ADMITTED") ? (
                    <Text variant="sm" tone="ok" bold>
                      {t("admissions.acceptedOn", { date: day(a.respondedAt, locale) })}
                    </Text>
                  ) : null}
                  {a.respondedAt && a.status === "DECLINED" ? (
                    <Text variant="sm" tone="danger" bold>
                      {t("admissions.declinedOn", { date: day(a.respondedAt, locale) })}
                    </Text>
                  ) : null}
                </>
              ) : null}
              {a.can.offer ? (
                <>
                  <Field label={t("admissions.offerExpires")} hint="YYYY-MM-DD" value={expiresOn} onChangeText={setExpiresOn} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} error={expiresBad ?? refusal?.issues.expiresOn} />
                  <Field label={t("admissions.offerNote")} value={offerNote} onChangeText={setOfferNote} maxLength={400} multiline error={refusal?.issues.note} />
                  <Button
                    label={t("admissions.makeOffer")}
                    busy={offer.isPending}
                    onPress={() => {
                      if (!expiresBad) offer.mutate();
                    }}
                  />
                </>
              ) : null}
              {a.can.respond ? (
                <>
                  <Text variant="sm" bold>
                    {t("admissions.answerAtOffice")}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    <Button label={t("admissions.acceptedAtOffice")} busy={answer.isPending && answer.variables === "ACCEPT"} onPress={() => answer.mutate("ACCEPT")} />
                    <Button label={t("admissions.declinedAtOffice")} variant="secondary" busy={answer.isPending && answer.variables === "DECLINE"} onPress={() => answer.mutate("DECLINE")} />
                  </View>
                </>
              ) : null}
            </Card>
          ) : null}
          {a.decidedAt || a.can.decide ? (
            <Card title={t("admissions.decideTitle")}>
              {a.decidedAt ? (
                <Text variant="sm" tone="muted">
                  {[t("admissions.decidedOn", { date: day(a.decidedAt, locale) }), a.decisionNote].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              {a.can.decide ? (
                <>
                  <Field label={t("admissions.decisionNote")} value={decisionNote} onChangeText={setDecisionNote} maxLength={400} multiline error={refusal?.issues.note} />
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    {a.status !== "WAITLISTED" ? <Button label={t("admissions.waitlist")} variant="secondary" busy={decide.isPending && decide.variables === "WAITLISTED"} onPress={() => decide.mutate("WAITLISTED")} /> : null}
                    {a.status !== "DECLINED" ? <Button label={t("admissions.declineApplication")} variant="danger" busy={decide.isPending && decide.variables === "DECLINED"} onPress={() => decide.mutate("DECLINED")} /> : null}
                    {a.status !== "SUBMITTED" ? <Button label={t("admissions.backToPool")} variant="secondary" busy={decide.isPending && decide.variables === "SUBMITTED"} onPress={() => decide.mutate("SUBMITTED")} /> : null}
                  </View>
                </>
              ) : null}
            </Card>
          ) : null}
          {a.status === "ADMITTED" || a.can.admit ? (
            <Card title={t("admissions.admitTitle")}>
              {a.admittedAt ? (
                <>
                  <Text variant="sm" tone="ok" bold>
                    {t("admissions.admittedOn", { date: day(a.admittedAt, locale) })}
                  </Text>
                  {a.admittedMembershipId ? <Button label={t("admissions.openRoll")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/pupil-record", params: { membershipId: a.admittedMembershipId } } as never)} /> : null}
                </>
              ) : null}
              {a.can.admit && !admitted ? (
                <>
                  <Text variant="sm" tone="muted">
                    {t("admissions.admitHint")}
                  </Text>
                  <Field label={t("admissions.admissionNumber")} hint={t("admissions.admissionNumberHint")} value={admissionNumber} onChangeText={setAdmissionNumber} maxLength={40} error={refusal?.issues.admissionNumber} />
                  <Button label={t("admissions.admit")} busy={admit.isPending} onPress={() => admit.mutate()} />
                </>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
