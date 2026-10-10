import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examActionResultSchema, examSessionViewSchema, type ExamFormRow, type ExamSessionView } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Row, Screen, ShowMore, Stat, SwitchRow, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Notice, formatDateKey } from "../staff/shared";
import { Confirm, Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";
import { FORM_STATUS_KEY, SESSION_STATUS_KEY } from "./words";

/** The step after each status (the web's examSessionStatusSetSchema): DRAFT → FORMS → CONDUCT → ASSESSMENT; PUBLISHED → CLOSED. */
const NEXT: Partial<Record<ExamSessionView["status"], "FORMS" | "CONDUCT" | "ASSESSMENT" | "CLOSED">> = { DRAFT: "FORMS", FORMS: "CONDUCT", CONDUCT: "ASSESSMENT", PUBLISHED: "CLOSED" };

/**
 * One exam session on the controller's phone (the parity batch, 10 Oct
 * 2026, R-4), the web's /exam-cell/sessions/[id] at corridor size: where
 * the session stands with its counts (forms, submitted, approved, hall
 * tickets issued), the forms waiting for a decision — approved, the fee
 * waived with a reason or not, or refused with one — the result runs with
 * the draft one to publish, and the step that moves the session on. Every
 * write is the web's door (POST .../forms/{id}/decide, .../results/publish,
 * .../status); each is a decision, sent live and never queued, and a step
 * asks once since a session only moves forward. The date sheet, halls,
 * marks and grace stay on the web.
 */
export function ExamSessionScreen() {
  // No screenshots while it is up (A3-S-12): students' forms and results.
  usePrivateScreen();
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const qc = useQueryClient();
  const on = useModuleOn("EXAMS");
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [asked, setAsked] = useState(false);
  const query = useQuery({ queryKey: ["exam-cell", "session", sessionId], enabled: on && Boolean(sessionId), queryFn: async () => examSessionViewSchema.parse(unwrap(await api().get(`/api/v1/exam-cell/sessions/${sessionId}`))) });
  const done = (text: string) => {
    setNotice({ tone: "ok", text });
    void qc.invalidateQueries({ queryKey: ["exam-cell"] });
  };
  const move = useMutation({
    mutationFn: async (status: string) => examActionResultSchema.parse(unwrap(await api().post(`/api/v1/exam-cell/sessions/${sessionId}/status`, { status }))),
    onSuccess: () => {
      setAsked(false);
      done(t("examCell.statusMoved"));
    },
    onError: (e: Error) => {
      setAsked(false);
      setNotice({ tone: "danger", text: e.message });
    },
  });
  const publish = useMutation({
    mutationFn: async (runId: string) => examActionResultSchema.parse(unwrap(await api().post(`/api/v1/exam-cell/sessions/${sessionId}/results/publish`, { runId }))),
    onSuccess: () => done(t("examCell.runPublished")),
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (!on) return <ModuleOffScreen title={t("examCell.title")} module="EXAMS" />;
  const s = query.data;
  const next = s ? NEXT[s.status] : undefined;
  const waiting = s?.forms.filter((f) => f.status === "SUBMITTED") ?? [];
  const issued = s?.forms.filter((f) => f.hallTicket !== null).length ?? 0;
  const approved = s?.forms.filter((f) => f.status === "APPROVED").length ?? 0;
  const published = s?.runs.some((r) => r.status === "PUBLISHED" || r.status === "SUPERSEDED") ?? false;
  return (
    <Screen title={s?.name ?? t("examCell.title")} description={s ? `${t("examCell.sessionIntro", { term: s.termName })} · ${t(SESSION_STATUS_KEY[s.status]!)}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {s ? (
        <>
          <Card>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Stat label={t("examCell.formsTitle")} value={s.forms.length} />
              <Stat label={t("examCell.formSUBMITTED")} value={waiting.length} tone={waiting.length > 0 ? "warn" : "fg"} />
              <Stat label={t("examCell.formAPPROVED")} value={approved} tone="ok" />
              <Stat label={t("deskParity.hallTicketsIssued")} value={issued} />
            </View>
            {s.canWrite && next ? (
              <>
                {asked ? (
                  <Confirm question={t("deskParity.examMoveConfirm", { step: t(`examCell.moveTo${next}` as TranslationKey) })} confirmLabel={t(`examCell.moveTo${next}` as TranslationKey)} busy={move.isPending} onConfirm={() => move.mutate(next)} onCancel={() => setAsked(false)} />
                ) : (
                  <Button label={t(`examCell.moveTo${next}` as TranslationKey)} variant="secondary" onPress={() => setAsked(true)} />
                )}
                <OfflineDecisionNote />
              </>
            ) : null}
          </Card>
          <Card title={t("deskParity.formsWaiting", { count: waiting.length })}>
            {waiting.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("deskParity.formsNoneWaiting")}
              </Text>
            ) : null}
            <ShowMore items={waiting}>{(page) => page.map((f) => <FormRow key={f.id} form={f} canWrite={s.canWrite} onDone={done} onError={(text) => setNotice({ tone: "danger", text })} />)}</ShowMore>
          </Card>
          <Card title={t("examCell.runsTitle")}>
            {s.runs.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("examCell.noPublished")}
              </Text>
            ) : null}
            {s.runs.map((r) => {
              // A draft after a published run corrects it: only the principal publishes that one (campaign S-10).
              const corrects = r.status === "DRAFT" && published;
              const mayPublish = r.status === "DRAFT" && (corrects ? role === "PRINCIPAL" : s.canWrite || role === "PRINCIPAL");
              return (
                <View key={r.id} style={{ gap: th.space[1] }}>
                  <Row
                    title={t("examCell.runNumber", { number: r.number })}
                    caption={[t("examCell.runSummary", { students: r.students, passed: r.passed, atkt: r.atkt, failed: r.failed, rate: r.passRatePercent }), r.reason].filter(Boolean).join(" · ")}
                    right={<Pill label={t(`examCell.run${r.status}` as TranslationKey)} tone={r.status === "PUBLISHED" ? "ok" : r.status === "DRAFT" ? "warn" : "muted"} />}
                  />
                  {mayPublish ? <Button label={t("examCell.publish")} accessibilityLabel={`${t("examCell.publish")}: ${t("examCell.runNumber", { number: r.number })}`} disabled={publish.isPending} busy={publish.isPending} onPress={() => publish.mutate(r.id)} /> : null}
                  {corrects && role !== "PRINCIPAL" ? (
                    <Text variant="xs" tone="warn">
                      {t("examCell.republishWaitsPrincipal")}
                    </Text>
                  ) : null}
                </View>
              );
            })}
            {s.runs.some((r) => r.status === "DRAFT") ? <OfflineDecisionNote /> : null}
          </Card>
          <Card title={t("examCell.formsTitle")}>
            <Text variant="sm" tone="muted">
              {s.forms.filter((f) => f.status !== "SUBMITTED").length === 0 ? t("examCell.noForms") : t("deskParity.formsByStatus", { draft: s.forms.filter((f) => f.status === "DRAFT").length, approved, refused: s.forms.filter((f) => f.status === "REFUSED").length })}
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** One submitted form: the student, the courses, eligibility and no-dues, the fee; approve (the fee waived with a reason) or refuse with one. */
function FormRow({ form, canWrite, onDone, onError }: { form: ExamFormRow; canWrite: boolean; onDone: (text: string) => void; onError: (text: string) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [mode, setMode] = useState<"none" | "approve" | "refuse">("none");
  const [waive, setWaive] = useState(false);
  const [reason, setReason] = useState("");
  const decide = useMutation({
    mutationFn: async (approve: boolean) => examActionResultSchema.parse(unwrap(await api().post(`/api/v1/exam-cell/forms/${form.id}/decide`, approve ? { approve: true, waiveFee: waive, ...(waive ? { reason: reason.trim() } : {}) } : { approve: false, reason: reason.trim() }))),
    onSuccess: (_r, approve) => {
      setMode("none");
      setReason("");
      setWaive(false);
      onDone(t(approve ? "examCell.formApproved" : "examCell.formRefused"));
    },
    onError: (e: Error) => onError(e.message),
  });
  const caption = [
    form.code,
    form.courses.map((c) => c.code + (c.kind === "BACKLOG" ? ` (${t("examCell.backlogShort")})` : "")).join(", "),
    form.eligible ? null : t("deskParity.formNotEligible"),
    form.noDues ? null : t("deskParity.formNoDuesOpen"),
    `${t("deskParity.formFee")} ${(form.feePaise / 100).toLocaleString(locale)}${form.lateFeePaise > 0 ? ` + ${(form.lateFeePaise / 100).toLocaleString(locale)}` : ""}`,
    form.submittedAt ? t("deskParity.formSubmittedOn", { date: formatDateKey(form.submittedAt.slice(0, 10), locale) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const needsReason = mode === "refuse" || (mode === "approve" && waive);
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <Row title={form.name} caption={caption} right={<Pill label={t(FORM_STATUS_KEY[form.status]!)} tone="warn" />} />
      {canWrite && mode === "none" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("examCell.approve")} accessibilityLabel={`${t("examCell.approve")}: ${form.name}`} onPress={() => setMode("approve")} />
          <Button label={t("examCell.refuse")} accessibilityLabel={`${t("examCell.refuse")}: ${form.name}`} variant="secondary" onPress={() => setMode("refuse")} />
        </View>
      ) : null}
      {mode === "approve" ? <SwitchRow label={t("examCell.waiveFee")} value={waive} onChange={setWaive} /> : null}
      {needsReason ? <Field label={t("examCell.reason")} value={reason} onChangeText={setReason} maxLength={300} /> : null}
      {mode !== "none" ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t(mode === "approve" ? "examCell.approve" : "examCell.refuse")} variant={mode === "approve" ? "primary" : "danger"} disabled={decide.isPending || (needsReason && reason.trim().length < 3)} busy={decide.isPending} onPress={() => decide.mutate(mode === "approve")} />
            <Button label={t("common.cancel")} variant="secondary" disabled={decide.isPending} onPress={() => setMode("none")} />
          </View>
          <OfflineDecisionNote />
        </>
      ) : null}
    </View>
  );
}
