import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentTrainingsSchema, trainingAttendanceResultSchema, trainingDetailSchema, trainingListSchema, trainingSummarySchema, type SoftSkill, type TrainingSummary } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { formatDateTime } from "@/lib/dates";
import { Notice, openWeb } from "../staff/shared";

/**
 * SOFT-SKILLS TRAINING ON THE PHONE (R-2, 5 Oct 2026). A student enrols or
 * withdraws and reads their attendance and completions; the TPO opens a
 * training, picks a session that has started and taps Present or Absent per
 * student on its roll, through the web's own doors. Making a training, its
 * sessions and its roll stays on the web.
 */
export const SKILL_KEY: Record<SoftSkill, TranslationKey> = {
  COMMUNICATION: "softSkills.skillCOMMUNICATION",
  APTITUDE: "softSkills.skillAPTITUDE",
  GROUP_DISCUSSION: "softSkills.skillGROUP_DISCUSSION",
  INTERVIEW: "softSkills.skillINTERVIEW",
  RESUME_WRITING: "softSkills.skillRESUME_WRITING",
  TEAMWORK: "softSkills.skillTEAMWORK",
  LEADERSHIP: "softSkills.skillLEADERSHIP",
  EMAIL_ETIQUETTE: "softSkills.skillEMAIL_ETIQUETTE",
  OTHER: "softSkills.skillOTHER",
};

export function SoftSkillsScreen() {
  const role = useRole();
  return role === "TPO" ? <CellTrainings /> : <StudentTrainings />;
}

function caption(x: TrainingSummary, t: ReturnType<typeof useT>): string {
  return [t(SKILL_KEY[x.skill]), x.trainer, x.status === "OPEN" ? t("softSkills.statusOPEN") : t("softSkills.statusCLOSED"), x.nextSessionAt ? t("softSkills.nextAt", { when: formatDateTime(x.nextSessionAt) }) : null].filter(Boolean).join(" · ");
}

function StudentTrainings() {
  const t = useT();
  const router = useRouter();
  const th = useTheme();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["trainings", "mine"], queryFn: async () => studentTrainingsSchema.parse(unwrap(await api().get("/api/v1/student/placement/trainings"))) });
  const enrol = useMutation({
    mutationFn: async (v: { trainingId: string; enrol: boolean }) => trainingSummarySchema.parse(unwrap(await api().post(`/api/v1/student/placement/trainings/${v.trainingId}/enrol`, { enrol: v.enrol }))),
    onSuccess: (x) => {
      setNotice({ tone: "ok", text: x.mine?.enrolled ? t("softSkills.youEnrolled") : t("softSkills.youWithdrew") });
      void qc.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  return (
    <Screen title={t("softSkills.studentTitle")} description={t("softSkills.studentIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && d.completed.length ? <Text bold>{t("softSkills.youCompleted", { count: d.completed.length })}</Text> : null}
      {d && d.trainings.length === 0 ? <Empty icon="graduationCap" title={t("softSkills.studentNoneTitle")} body={t("softSkills.studentNoneBody")} action={<Button label={t("placement.navStudent")} variant="secondary" onPress={() => router.push("/(app)/placement" as never)} />} /> : null}
      {d?.trainings.map((x) => (
        <Card key={x.id} title={x.title}>
          <Text variant="sm" tone="muted">
            {caption(x, t)}
          </Text>
          {x.mine?.enrolled ? <Text>{t("softSkills.yourAttendance", { attended: x.mine.attended, sessions: x.sessions, percent: x.minAttendancePercent })}</Text> : null}
          {x.mine?.completed ? <Text bold>{t("softSkills.completedYes")}</Text> : null}
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            {x.canEnrol ? <Button label={t("softSkills.enrol")} disabled={enrol.isPending} onPress={() => enrol.mutate({ trainingId: x.id, enrol: true })} /> : null}
            {x.mine?.enrolled ? <Button label={t("softSkills.withdraw")} variant="secondary" disabled={enrol.isPending} onPress={() => enrol.mutate({ trainingId: x.id, enrol: false })} /> : null}
            {!x.canEnrol && !x.mine?.enrolled && x.status === "OPEN" ? <Text tone="muted">{t("softSkills.full")}</Text> : null}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function CellTrainings() {
  const t = useT();
  const [open, setOpen] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["trainings", "cell"], queryFn: async () => trainingListSchema.parse(unwrap(await api().get("/api/v1/placement/trainings"))) });
  const d = query.data;
  return (
    <Screen title={t("softSkills.title")} description={d ? t("softSkills.tileOpen", { count: d.trainings.filter((x) => x.status === "OPEN").length }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? <Text bold>{`${t("softSkills.tileCompleted")}: ${d.studentsCompleted}`}</Text> : null}
      {d && d.trainings.length === 0 ? <Empty icon="graduationCap" title={t("softSkills.noneTitle")} body={t("softSkills.noneBody")} action={<Button label={t("mobile.openOnWeb")} variant="secondary" onPress={() => openWeb("/placement/training")} />} /> : null}
      {d?.trainings.map((x) => (
        <Card key={x.id} title={x.title}>
          <Row title={caption(x, t)} caption={t("softSkills.summaryLine", { enrolled: x.enrolled, completed: x.completed })} onPress={() => setOpen(open === x.id ? null : x.id)} />
          {open === x.id ? <TrainingMarks trainingId={x.id} /> : null}
        </Card>
      ))}
    </Screen>
  );
}

function TrainingMarks({ trainingId }: { trainingId: string }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  // The moment the roster opened: a session that starts while it is open is marked after a refresh.
  const [openedAt] = useState(() => Date.now());
  const query = useQuery({ queryKey: ["trainings", "detail", trainingId], queryFn: async () => trainingDetailSchema.parse(unwrap(await api().get(`/api/v1/placement/trainings/${trainingId}`))) });
  const d = query.data;
  const started = (d?.sessionList ?? []).filter((s) => !s.cancelled && new Date(s.startsAt).getTime() <= openedAt);
  const sessionId = picked ?? started[started.length - 1]?.id ?? null;
  const mark = useMutation({
    mutationFn: async (v: { studentMembershipId: string; present: boolean }) => trainingAttendanceResultSchema.parse(unwrap(await api().post(`/api/v1/placement/trainings/${trainingId}/sessions/${sessionId}/attendance`, { marks: [v] }))),
    onSuccess: (r) => {
      setNotice({ tone: "ok", text: t("softSkills.marked", { count: r.saved }) });
      qc.setQueryData(["trainings", "detail", trainingId], r.training);
      void qc.invalidateQueries({ queryKey: ["trainings", "cell"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  return (
    <View style={{ gap: th.space[2] }}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && started.length === 0 ? <Text tone="muted">{t("softSkills.phoneNoSessionToMark")}</Text> : null}
      {d && started.length ? (
        <>
          <Text variant="sm" bold>
            {t("softSkills.phoneSessionPick")}
          </Text>
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            {started.map((s) => (
              <Button key={s.id} label={formatDateTime(s.startsAt)} variant={s.id === sessionId ? "primary" : "secondary"} onPress={() => setPicked(s.id)} />
            ))}
          </View>
          {d.roster.length === 0 ? <Text tone="muted">{t("softSkills.noRoster")}</Text> : null}
          {d.roster.map((r) => {
            const here = sessionId ? r.marks[sessionId] : undefined;
            return (
              <View key={r.studentMembershipId} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
                <Row title={r.name} caption={[t("softSkills.attendedOf", { attended: r.attended, sessions: d.sessions }), r.completed ? t("softSkills.completedYes") : null].filter(Boolean).join(" · ")} />
                <View style={{ flexDirection: "row", gap: th.space[2] }}>
                  <Button label={t("talks.present")} variant={here === true ? "primary" : "secondary"} disabled={mark.isPending || !sessionId} onPress={() => mark.mutate({ studentMembershipId: r.studentMembershipId, present: true })} />
                  <Button label={t("talks.absent")} variant={here === false ? "primary" : "secondary"} disabled={mark.isPending || !sessionId} onPress={() => mark.mutate({ studentMembershipId: r.studentMembershipId, present: false })} />
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}
