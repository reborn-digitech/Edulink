import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { examCellHomeSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { CollegeRoleHome } from "../college/role-home";
import { openWeb } from "../family/shared";
import { SESSION_STATUS_KEY } from "./words";

/**
 * The EXAM_CONTROLLER's home on the phone (module EXAMS, 4 Oct 2026): the
 * sessions and where each stands, the grace proposals waiting for the
 * principal, and the exam cell itself on the web — marks entry, seating and
 * results are desk work. While the college has EXAMS off, the college role
 * home says so.
 */
export function ExamCellHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("EXAMS");
  const query = useQuery({ queryKey: ["exam-cell", "home"], enabled: on, queryFn: async () => examCellHomeSchema.parse(unwrap(await api().get("/api/v1/exam-cell"))) });
  if (!on) return <CollegeRoleHome role="EXAM_CONTROLLER" />;
  const d = query.data;
  const web = <Button label={t("examCell.openOnWeb")} onPress={() => openWeb("/exam-cell")} />;
  return (
    <Screen title={t("examCell.title")} description={d ? t(d.autonomous ? "examCell.introAutonomous" : "examCell.introAffiliated") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.graceWaiting.length > 0 ? (
        <Card title={t("examCell.graceWaitingTitle")}>
          <Text tone="muted">{t("examCell.graceWaitingOthers")}</Text>
          {d.graceWaiting.map((g) => (
            <Row key={g.id} title={t("examCell.graceLine", { student: g.studentName, marks: g.marks, course: g.courseCode })} caption={g.sessionName} />
          ))}
        </Card>
      ) : null}
      {d ? (
        <Card title={t("examCell.sessionsTitle")}>
          {d.sessions.length === 0 ? <Empty icon="clipboard" title={t("examCell.noSessions")} body={t("examCell.noSessionsBody")} action={web} /> : null}
          {d.sessions.map((s) => (
            <Row key={s.id} title={s.name} caption={`${t(SESSION_STATUS_KEY[s.status]!)} · ${t("examCell.formsCount", { forms: s.forms, submitted: s.submitted, approved: s.approved })}`} />
          ))}
        </Card>
      ) : null}
      <View style={{ gap: th.space[2] }}>
        {web}
        <Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />
        <Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />
      </View>
    </Screen>
  );
}
