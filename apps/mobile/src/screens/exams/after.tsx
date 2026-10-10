import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examActionResultSchema, examAfterSchema, type RevaluationRow } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useTheme } from "@/lib/theme";
import { Chips, Notice, formatDateKey } from "../staff/shared";
import { Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";
import { BACKLOG_KEY, REVAL_KIND_KEY, REVAL_OUTCOME_KEY } from "./words";

type Outcome = "PROVIDED" | "UNCHANGED" | "CHANGED";

/**
 * After results on the controller's phone (the parity batch, 10 Oct 2026,
 * R-4), the web's /exam-cell/after as far as the queue goes: the photocopies
 * and revaluations asked and not yet decided — each decided here through
 * the web's door (POST .../revaluations/{id}/decide: a photocopy given;
 * marks unchanged; marks changed, with the new mark, which becomes a new
 * version and goes to the result at the next run) — then the decided ones
 * and the open backlogs with their last day, read. A decision is sent live
 * and never queued. The papers issued, the credits push and the convocation
 * stay on the web.
 */
export function ExamAfterScreen() {
  // No screenshots while it is up (A3-S-12): students' marks and backlogs.
  usePrivateScreen();
  const t = useT();
  const { locale } = useLocale();
  const on = useModuleOn("EXAMS");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["exam-cell", "after"], enabled: on, queryFn: async () => examAfterSchema.parse(unwrap(await api().get("/api/v1/exam-cell/after"))) });
  if (!on) return <ModuleOffScreen title={t("examCell.afterTitle")} module="EXAMS" />;
  const d = query.data;
  const asked = d?.revaluations.filter((r) => r.status === "ASKED") ?? [];
  const decided = d?.revaluations.filter((r) => r.status !== "ASKED") ?? [];
  const openBacklogs = d?.backlogs.filter((b) => b.status === "OPEN") ?? [];
  return (
    <Screen title={t("examCell.afterTitle")} description={t("examCell.afterIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("deskParity.revaluationsWaiting", { count: asked.length })}>
            {asked.length === 0 ? <Empty icon="checks" title={t("examCell.noRevaluations")} body={t("deskParity.revaluationsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
            {asked.map((r) => (
              <RevaluationCard key={r.id} row={r} canWrite={d.canWrite} onDone={setNotice} />
            ))}
          </Card>
          {decided.length > 0 ? (
            <Card title={t("deskParity.revaluationsDecided", { count: decided.length })}>
              {decided.map((r) => (
                <Row key={r.id} title={`${r.studentName} · ${r.courseCode}`} caption={[r.sessionName, t(REVAL_KIND_KEY[r.kind]!), r.outcome ? t(REVAL_OUTCOME_KEY[r.outcome]!) : null, r.correction ? t("deskParity.underCorrection") : null].filter(Boolean).join(" · ")} />
              ))}
            </Card>
          ) : null}
          <Card title={t("examCell.backlogsTitle")}>
            <Text variant="xs" tone="muted">
              {t("examCell.backlogsHint")}
            </Text>
            {openBacklogs.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("deskParity.backlogsNone")}
              </Text>
            ) : null}
            {openBacklogs.slice(0, 30).map((b) => (
              <Row key={b.id} title={`${b.studentName} · ${b.courseCode}`} caption={[b.courseName, t("deskParity.backlogAttempts", { count: b.attempts }), t("deskParity.backlogLastDay", { date: formatDateKey(b.lastDay, locale) })].join(" · ")} right={<Pill label={t(BACKLOG_KEY[b.status]!)} tone="warn" />} />
            ))}
            {openBacklogs.length > 30 ? (
              <Text variant="xs" tone="muted">
                {t("common.showMore", { count: openBacklogs.length - 30 })}
              </Text>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** One revaluation asked: the facts, the outcome chips (a photocopy's one outcome; a revaluation's two), the new mark, the note. */
function RevaluationCard({ row, canWrite, onDone }: { row: RevaluationRow; canWrite: boolean; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const options: Outcome[] = row.kind === "PHOTOCOPY" ? ["PROVIDED"] : ["UNCHANGED", "CHANGED"];
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(options[0]!);
  const [marks, setMarks] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const decide = useMutation({
    mutationFn: async () => {
      const m = outcome === "CHANGED" ? Number(marks.trim()) : null;
      if (outcome === "CHANGED" && (marks.trim() === "" || !Number.isFinite(m) || m! < 0 || m! > 1000)) throw new Error(t("deskParity.checkMarks"));
      return examActionResultSchema.parse(unwrap(await api().post(`/api/v1/exam-cell/revaluations/${row.id}/decide`, { outcome, marks: m, ...(note.trim() ? { note: note.trim() } : {}) })));
    },
    onSuccess: () => {
      setOpen(false);
      setError(null);
      onDone({ tone: "ok", text: t("examCell.revalDecided") });
      void qc.invalidateQueries({ queryKey: ["exam-cell"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <Row title={`${row.studentName} · ${row.courseCode}`} caption={[row.sessionName, t(REVAL_KIND_KEY[row.kind]!), row.oldExternalMilli === null ? null : t("deskParity.revalOldMark", { marks: row.oldExternalMilli / 1000 }), t("deskParity.askedOn", { date: formatDateKey(row.askedAt.slice(0, 10), locale) }), row.demandStatus ? `${t("deskParity.revalFee")} ${row.demandStatus}` : null].filter(Boolean).join(" · ")} />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {canWrite && !open ? <Button label={t("examCell.decide")} accessibilityLabel={`${t("examCell.decide")}: ${row.studentName}`} variant="secondary" onPress={() => setOpen(true)} /> : null}
      {open ? (
        <>
          <Chips label={t("examCell.outcome")} value={outcome} options={options.map((o) => ({ value: o, label: t(REVAL_OUTCOME_KEY[o] as TranslationKey) }))} onChange={setOutcome} />
          {outcome === "CHANGED" ? <Field label={t("examCell.graceMarks")} value={marks} onChangeText={setMarks} keyboardType="decimal-pad" maxLength={6} /> : null}
          <Field label={t("examCell.note")} value={note} onChangeText={setNote} maxLength={300} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("examCell.decide")} disabled={decide.isPending} busy={decide.isPending} onPress={() => decide.mutate()} />
            <Button label={t("common.cancel")} variant="secondary" disabled={decide.isPending} onPress={() => setOpen(false)} />
          </View>
          <OfflineDecisionNote />
        </>
      ) : null}
    </View>
  );
}
