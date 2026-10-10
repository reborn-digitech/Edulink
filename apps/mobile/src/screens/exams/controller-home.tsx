import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { examCellHomeSchema, examResultsSchema, type ExamSessionRow } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { CollegeRoleHome } from "../college/role-home";
import { openWeb } from "../family/shared";
import { SESSION_STATUS_KEY } from "./words";
import { formatDateKey } from "../staff/shared";

/**
 * The EXAM_CONTROLLER's home on the phone (module EXAMS, 4 Oct 2026): the
 * sessions and where each stands, the grace proposals waiting for the
 * principal, and the exam cell itself on the web — marks entry, seating and
 * results are desk work. While the college has EXAMS off, the college role
 * home says so.
 *
 * Where each result stands (5 Oct 2026, the campaign's controller
 * recommendation): a session in assessment or published carries its latest
 * run — its number, draft or published and when, the pass line — and a run
 * that corrects a published result says the principal publishes it (S-10).
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
            <View key={s.id}>
              {/* The session itself (the parity batch, 10 Oct 2026, R-4): the forms waiting, the runs to publish, the step on. */}
              <Row title={s.name} caption={`${t(SESSION_STATUS_KEY[s.status]!)} · ${t("examCell.formsCount", { forms: s.forms, submitted: s.submitted, approved: s.approved })}`} onPress={() => router.push({ pathname: "/(app)/exam-session", params: { sessionId: s.id } } as never)} />
              {s.status === "ASSESSMENT" || s.status === "PUBLISHED" ? <LatestRun session={s} /> : null}
            </View>
          ))}
        </Card>
      ) : null}
      {/* After results (the parity batch, 10 Oct 2026): the photocopies and revaluations waiting, decided here. */}
      {d ? <Button label={t("examCell.afterTitle")} variant="secondary" onPress={() => router.push("/(app)/exam-after" as never)} /> : null}
      <View style={{ gap: th.space[2] }}>
        {web}
        <Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />
        <Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />
      </View>
    </Screen>
  );
}

const RUN_STATUS_KEY = { DRAFT: "examCell.runDRAFT", PUBLISHED: "examCell.runPUBLISHED", SUPERSEDED: "examCell.runSUPERSEDED" } as const;

/** A session's latest result run, read from GET /api/v1/exam-cell/sessions/{id}/results: one line under the session. */
function LatestRun({ session }: { session: ExamSessionRow }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({ queryKey: ["exam-cell", "results", session.id], queryFn: async () => examResultsSchema.parse(unwrap(await api().get(`/api/v1/exam-cell/sessions/${session.id}/results`))) });
  const run = query.data?.run;
  if (!run) return null;
  const when = run.publishedAt ? ` · ${t("examCell.publishedOn", { date: formatDateKey(run.publishedAt.slice(0, 10), locale) })}` : "";
  // A draft after a published run corrects it: only the principal publishes that one (campaign S-10).
  const waits = run.status === "DRAFT" && run.number > 1;
  return (
    <View style={{ paddingLeft: th.space[3] }}>
      <Text variant="sm" tone={run.status === "PUBLISHED" ? "ok" : "muted"}>
        {`${t("examCell.runNumber", { number: run.number })} · ${t(RUN_STATUS_KEY[run.status])}${when}`}
      </Text>
      <Text variant="xs" tone="muted">
        {t("examCell.runSummary", { students: run.students, passed: run.passed, atkt: run.atkt, failed: run.failed, rate: run.passRatePercent })}
      </Text>
      {waits ? (
        <Text variant="xs" tone="warn">
          {t("examCell.republishWaitsPrincipal")}
        </Text>
      ) : null}
    </View>
  );
}
