import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { GRIEVANCE_KINDS, SURVEY_SCALE, voiceSchema, type Voice } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, SwitchRow, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";

/**
 * The IQAC module's respondent side on the phone (4 Oct 2026), the web's
 * /student/voice and /alumni/survey: the surveys open to me — NAAC's SSS, my
 * offerings' course feedback and the exit survey for a student, the alumni
 * survey for an alumnus, the teachers' survey for faculty — each answered 4
 * to 0 and sent once; and, for a student, a grievance to the committee with
 * its fifteen-working-day limit and the way to the Ombudsperson after it.
 * A guardian (PARENT, campaign 2026-10-04, G-5) answers the parent survey of
 * their child's college here, with no grievance line (the server says
 * `canFileGrievance: false` and sends none).
 */
type Survey = Voice["surveys"][number];
type Grievance = Voice["grievances"][number];
type GrievanceKind = (typeof GRIEVANCE_KINDS)[number];

const KEY = ["voice"] as const;

async function post(path: string, body: unknown, fallback: string): Promise<Voice> {
  const result = await api().post(path, body);
  if (!result.ok) throw new Error(errorText(result, fallback));
  return voiceSchema.parse(result.data);
}

function SurveyCard({ survey }: { survey: Survey }) {
  const t = useT();
  const th = useTheme();
  const client = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const send = useMutation({ mutationFn: () => post(`/api/v1/voice/surveys/${survey.id}`, { answers }, t("common.somethingWrong")), onSuccess: (d) => client.setQueryData(KEY, d) });
  const complete = survey.questions.every((q) => typeof answers[q.code] === "number");
  return (
    <Card title={survey.title}>
      <Text variant="sm" tone="muted">
        {`${t(`iqac.surveyKind.${survey.kind}`)} · ${t("iqac.closesLine", { date: survey.closesOn })}`}
      </Text>
      {survey.answered ? (
        <Text tone="ok">{t("iqac.alreadyAnswered")}</Text>
      ) : (
        <View style={{ gap: th.space[3] }}>
          <Text variant="sm" tone="muted">
            {survey.kind === "COURSE_FEEDBACK" ? t("iqac.namedNote") : t("iqac.anonymousNote")}
          </Text>
          {survey.questions.map((q) => (
            <View key={q.code} style={{ gap: th.space[2] }}>
              <Text bold>{q.label}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                {SURVEY_SCALE.map((v) => (
                  <Button key={v} label={t(`iqac.scale.s${v}`)} variant={answers[q.code] === v ? "primary" : "secondary"} onPress={() => setAnswers((a) => ({ ...a, [q.code]: v }))} accessibilityState={{ selected: answers[q.code] === v }} />
                ))}
              </View>
            </View>
          ))}
          {send.isError ? (
            <Text variant="sm" tone="danger">
              {send.error.message}
            </Text>
          ) : null}
          <Button label={t("iqac.answerButton")} disabled={!complete} busy={send.isPending} onPress={() => send.mutate()} />
        </View>
      )}
    </Card>
  );
}

function GrievanceForm() {
  const t = useT();
  const th = useTheme();
  const client = useQueryClient();
  const [kind, setKind] = useState<GrievanceKind>("ACADEMIC");
  const [text, setText] = useState("");
  const [hidden, setHidden] = useState(false);
  const file = useMutation({
    mutationFn: () => post("/api/v1/voice/grievances", { kind, text, anonymousToStaff: hidden }, t("common.somethingWrong")),
    onSuccess: (d) => {
      client.setQueryData(KEY, d);
      setText("");
    },
  });
  return (
    <Card title={t("iqac.grievanceTitle")}>
      <Text variant="sm" tone="muted">
        {t("iqac.grievanceIntro")}
      </Text>
      <Text variant="sm" tone="muted">
        {t("iqac.raggingNote")}
      </Text>
      <Text bold>{t("iqac.grievanceKindField")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        {GRIEVANCE_KINDS.map((k) => (
          <Button key={k} label={t(`iqac.grievanceKind.${k}`)} variant={kind === k ? "primary" : "secondary"} onPress={() => setKind(k)} accessibilityState={{ selected: kind === k }} />
        ))}
      </View>
      <Field label={t("iqac.grievanceTextField")} value={text} onChangeText={setText} multiline />
      <SwitchRow label={t("iqac.anonymousToStaff")} value={hidden} onChange={setHidden} />
      {file.isError ? (
        <Text variant="sm" tone="danger">
          {file.error.message}
        </Text>
      ) : null}
      {file.isSuccess ? <Text tone="ok">{t("iqac.filedSimple")}</Text> : null}
      <Button label={t("iqac.fileButton")} disabled={text.trim().length < 10} busy={file.isPending} onPress={() => file.mutate()} />
    </Card>
  );
}

function GrievanceRow({ g }: { g: Grievance }) {
  const t = useT();
  const client = useQueryClient();
  const [note, setNote] = useState("");
  const escalate = useMutation({ mutationFn: () => post(`/api/v1/voice/grievances/${g.id}/escalate`, { note }, t("common.somethingWrong")), onSuccess: (d) => client.setQueryData(KEY, d) });
  const canEscalate = g.status !== "ESCALATED" && (g.overdue || g.status === "RESOLVED");
  return (
    <Card>
      <Row title={t(`iqac.grievanceKind.${g.kind}`)} caption={`${t(`iqac.grievanceStatus.${g.status}`)} · ${t("iqac.dueLine", { date: g.dueOn })}${g.overdue ? ` · ${t("iqac.overdueBadge")}` : ""}`} />
      <Text variant="sm">{g.text}</Text>
      {g.response ? <Text variant="sm">{t("iqac.responseLine", { text: g.response })}</Text> : null}
      {canEscalate ? (
        <>
          <Field label={t("iqac.escalateNoteField")} value={note} onChangeText={setNote} />
          {escalate.isError ? (
            <Text variant="sm" tone="danger">
              {escalate.error.message}
            </Text>
          ) : null}
          <Button label={t("iqac.escalateButton")} variant="secondary" disabled={note.trim().length < 2} busy={escalate.isPending} onPress={() => escalate.mutate()} />
        </>
      ) : null}
    </Card>
  );
}

export function VoiceScreen() {
  const t = useT();
  const router = useRouter();
  const guardian = useRole() === "PARENT";
  const query = useQuery({ queryKey: KEY, queryFn: async () => voiceSchema.parse(unwrap(await api().get("/api/v1/voice"))) });
  const d = query.data;
  return (
    <Screen title={guardian ? t("iqac.navParentVoice") : t("iqac.voiceTitle")} description={guardian ? t("iqac.parentVoiceIntro") : t("iqac.voiceIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Text variant="lg" bold>
            {t("iqac.surveysForYou")}
          </Text>
          {d.surveys.length === 0 ? (
            <Empty icon="star" title={t("iqac.noSurveysForYou")} body={t("iqac.anonymousNote")} action={<Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />} />
          ) : (
            d.surveys.map((s) => <SurveyCard key={s.id} survey={s} />)
          )}
          {d.canFileGrievance && !guardian ? (
            <>
              <GrievanceForm />
              <Text variant="lg" bold>
                {t("iqac.myGrievances")}
              </Text>
              {d.grievances.length === 0 ? (
                <Empty icon="chat" title={t("iqac.noGrievances")} action={<Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />} />
              ) : (
                d.grievances.map((g) => <GrievanceRow key={g.id} g={g} />)
              )}
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
