import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { talkAttendanceResultSchema, talkDetailSchema, talkListSchema, talkViewSchema, type TalkAnswer, type TalkAttendance, type TalkView } from "@edulink/contracts";
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
 * PRE-PLACEMENT TALKS ON THE PHONE (R-2, 5 Oct 2026). A student answers going
 * or not while a talk is ahead and sees whether they were marked; the TPO,
 * standing at the hall door, opens a talk that has started and taps Present
 * or Absent per student, each tap one mark through the same door the web's
 * roster posts to. Setting and cancelling a talk stay on the web.
 */
export function TalksScreen() {
  const role = useRole();
  return role === "TPO" ? <CellTalks /> : <StudentTalks />;
}

function statusLine(x: TalkView, t: ReturnType<typeof useT>): string {
  const state = x.status === "CANCELLED" ? t("talks.statusCancelled") : x.heldAt ? t("talks.statusHeld") : x.started ? t("talks.statusStarted") : t("talks.statusAhead");
  return [x.companyName, formatDateTime(x.startsAt), x.venue, state].filter(Boolean).join(" · ");
}

function StudentTalks() {
  const t = useT();
  const router = useRouter();
  const th = useTheme();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["talks", "mine"], queryFn: async () => talkListSchema.parse(unwrap(await api().get("/api/v1/student/placement/talks"))) });
  const answer = useMutation({
    mutationFn: async (v: { talkId: string; answer: TalkAnswer }) => talkViewSchema.parse(unwrap(await api().post(`/api/v1/student/placement/talks/${v.talkId}/rsvp`, { answer: v.answer }))),
    onSuccess: (x) => {
      setNotice({ tone: "ok", text: x.mine?.answer === "GOING" ? t("talks.answeredGoing") : t("talks.answeredNotGoing") });
      void qc.invalidateQueries({ queryKey: ["talks"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const talks = query.data?.talks ?? [];
  return (
    <Screen title={t("talks.studentTitle")} description={t("talks.studentIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.data && talks.length === 0 ? <Empty icon="megaphone" title={t("talks.studentNoneTitle")} body={t("talks.studentNoneBody")} action={<Button label={t("placement.navStudent")} variant="secondary" onPress={() => router.push("/(app)/placement" as never)} />} /> : null}
      {talks.map((x) => (
        <Card key={x.id} title={x.title}>
          <Text variant="sm" tone="muted">
            {statusLine(x, t)}
          </Text>
          {x.mine?.answer ? <Text>{x.mine.answer === "GOING" ? t("talks.youGoing") : t("talks.youNotGoing")}</Text> : null}
          {x.mine?.attendance ? <Text bold>{x.mine.attendance === "PRESENT" ? t("talks.youPresent") : t("talks.youAbsent")}</Text> : null}
          {x.status === "SCHEDULED" && !x.started ? (
            <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
              {x.canAnswer && x.mine?.answer !== "GOING" ? <Button label={t("talks.imGoing")} disabled={answer.isPending} onPress={() => answer.mutate({ talkId: x.id, answer: "GOING" })} /> : null}
              {x.mine?.answer !== "NOT_GOING" ? <Button label={t("talks.imNotGoing")} variant="secondary" disabled={answer.isPending} onPress={() => answer.mutate({ talkId: x.id, answer: "NOT_GOING" })} /> : null}
              {!x.canAnswer && x.mine?.answer !== "GOING" ? <Text tone="muted">{t("talks.full")}</Text> : null}
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

function CellTalks() {
  const t = useT();
  const [open, setOpen] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["talks", "cell"], queryFn: async () => talkListSchema.parse(unwrap(await api().get("/api/v1/placement/talks"))) });
  const talks = query.data?.talks ?? [];
  return (
    <Screen title={t("talks.title")} description={t("talks.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.data && talks.length === 0 ? <Empty icon="megaphone" title={t("talks.noneTitle")} body={t("talks.noneBody")} action={<Button label={t("mobile.openOnWeb")} variant="secondary" onPress={() => openWeb("/placement/talks")} />} /> : null}
      {talks.map((x) => (
        <Card key={x.id} title={x.title}>
          <Row title={statusLine(x, t)} caption={t("talks.countsLine", { going: x.counts.going, present: x.counts.present })} onPress={x.started && x.status === "SCHEDULED" ? () => setOpen(open === x.id ? null : x.id) : undefined} />
          {open === x.id ? <TalkRoster talkId={x.id} /> : null}
        </Card>
      ))}
    </Screen>
  );
}

function TalkRoster({ talkId }: { talkId: string }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["talks", "detail", talkId], queryFn: async () => talkDetailSchema.parse(unwrap(await api().get(`/api/v1/placement/talks/${talkId}`))) });
  const mark = useMutation({
    mutationFn: async (v: { studentMembershipId: string; attendance: TalkAttendance }) => talkAttendanceResultSchema.parse(unwrap(await api().post(`/api/v1/placement/talks/${talkId}/attendance`, { marks: [v] }))),
    onSuccess: (r) => {
      setNotice({ tone: "ok", text: t("talks.marked", { count: r.saved }) });
      qc.setQueryData(["talks", "detail", talkId], r.talk);
      void qc.invalidateQueries({ queryKey: ["talks", "cell"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  return (
    <View style={{ gap: th.space[2] }}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Text variant="sm" tone="muted">
            {t("talks.phoneMarkIntro")}
          </Text>
          {d.roster.map((r) => (
            <View key={r.studentMembershipId} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
              <Row title={r.name} caption={[r.prn, r.answer === "GOING" ? t("talks.answerGoing") : r.answer === "NOT_GOING" ? t("talks.answerNotGoing") : t("talks.answerNone"), r.attendance === "PRESENT" ? t("talks.present") : r.attendance === "ABSENT" ? t("talks.absent") : null].filter(Boolean).join(" · ")} />
              {d.canMark ? (
                <View style={{ flexDirection: "row", gap: th.space[2] }}>
                  <Button label={t("talks.present")} variant={r.attendance === "PRESENT" ? "primary" : "secondary"} disabled={mark.isPending} onPress={() => mark.mutate({ studentMembershipId: r.studentMembershipId, attendance: "PRESENT" })} />
                  <Button label={t("talks.absent")} variant={r.attendance === "ABSENT" ? "primary" : "secondary"} disabled={mark.isPending} onPress={() => mark.mutate({ studentMembershipId: r.studentMembershipId, attendance: "ABSENT" })} />
                </View>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}
