import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { surveyResultsSchema, surveysSchema } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Notice, formatDateKey } from "../staff/shared";
import { Confirm, Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";

type Survey = z.infer<typeof surveysSchema>["items"][number];

/**
 * The college's surveys on the phone (the parity batch, 10 Oct 2026, R-4),
 * the web's /iqac/surveys: each with its kind, window, responses and
 * whether it is anonymous; one opened shows its aggregates — never a
 * respondent, hidden below five answers (GET /iqac/surveys/{id}); the desk
 * closes a survey now through the web's door (POST .../close), asked once
 * since the salt is wiped and no answer can be matched to a person after.
 * Opening a survey, the action-taken report and the signed links stay on
 * the web. A close is a decision, sent live and never queued.
 */
export function SurveysDeskScreen() {
  const t = useT();
  const on = useModuleOn("IQAC");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["iqac", "surveys"], enabled: on, queryFn: async () => surveysSchema.parse(unwrap(await api().get("/api/v1/iqac/surveys"))) });
  if (!on) return <ModuleOffScreen title={t("iqac.navSurveys")} module="IQAC" />;
  const d = query.data;
  const live = d?.items.filter((s) => s.status !== "CLOSED") ?? [];
  const closed = d?.items.filter((s) => s.status === "CLOSED") ?? [];
  return (
    <Screen title={t("iqac.surveysTitle")} description={t("iqac.surveysIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.items.length === 0 ? <Empty icon="star" title={t("iqac.noSurveys")} body={t("deskParity.surveysNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {live.length > 0 ? (
        <Card title={t("deskParity.surveysLive", { count: live.length })}>
          {live.map((s) => (
            <SurveyCard key={s.id} survey={s} canEdit={Boolean(d?.canEdit)} onDone={setNotice} />
          ))}
        </Card>
      ) : null}
      {closed.length > 0 ? (
        <Card title={t("deskParity.surveysClosed", { count: closed.length })}>
          {closed.map((s) => (
            <SurveyCard key={s.id} survey={s} canEdit={false} onDone={setNotice} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function SurveyCard({ survey, canEdit, onDone }: { survey: Survey; canEdit: boolean; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const results = useQuery({ queryKey: ["iqac", "survey", survey.id], enabled: open, queryFn: async () => surveyResultsSchema.parse(unwrap(await api().get(`/api/v1/iqac/surveys/${survey.id}`))) });
  const close = useMutation({
    mutationFn: async () => unwrap(await api().post(`/api/v1/iqac/surveys/${survey.id}/close`, {})),
    onSuccess: () => {
      setAsked(false);
      setError(null);
      onDone({ tone: "ok", text: t("iqac.closed") });
      void qc.invalidateQueries({ queryKey: ["iqac"] });
    },
    onError: (e: Error) => {
      setAsked(false);
      setError(e.message);
    },
  });
  const r = results.data;
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <Row
        title={survey.title}
        caption={[t(`iqac.surveyKind.${survey.kind}` as TranslationKey), `${formatDateKey(survey.opensOn, locale)} – ${formatDateKey(survey.closesOn, locale)}`, t("iqac.responsesLine", { n: survey.responses }), t(survey.anonymous ? "iqac.anonymous" : "iqac.named")].join(" · ")}
        right={<Pill label={t(`iqac.surveyStatus.${survey.status}` as TranslationKey)} tone={survey.status === "OPEN" ? "ok" : survey.status === "UPCOMING" ? "accent" : "muted"} />}
        onPress={() => setOpen((v) => !v)}
      />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {open ? (
        <View style={{ gap: th.space[1], paddingLeft: th.space[3] }}>
          {results.isPending ? <Loading /> : null}
          {results.isError ? <Failed message={results.error.message} onRetry={() => void results.refetch()} /> : null}
          {r?.suppressed ? (
            <Text variant="sm" tone="muted">
              {t("deskParity.surveySuppressed")}
            </Text>
          ) : null}
          {r && !r.suppressed ? (
            <Text variant="sm" bold>
              {t("deskParity.surveyOverall", { mean: r.overall === null ? "—" : r.overall.toFixed(2) })}
            </Text>
          ) : null}
          {r && !r.suppressed ? r.questions.map((q) => <Row key={q.code} title={q.label} caption={q.code} right={<Text>{q.mean === null ? "—" : q.mean.toFixed(2)}</Text>} />) : null}
          {r?.atr?.publishedAt ? (
            <Text variant="xs" tone="ok">
              {t("deskParity.surveyAtrPublished")}
            </Text>
          ) : null}
        </View>
      ) : null}
      {canEdit && survey.status !== "CLOSED" ? (
        <>
          {asked ? <Confirm question={t("deskParity.surveyCloseConfirm", { title: survey.title })} confirmLabel={t("iqac.closeButton")} busy={close.isPending} onConfirm={() => close.mutate()} onCancel={() => setAsked(false)} /> : <Button label={t("iqac.closeButton")} accessibilityLabel={`${t("iqac.closeButton")}: ${survey.title}`} variant="ghost" onPress={() => setAsked(true)} />}
          {asked ? <OfflineDecisionNote /> : null}
        </>
      ) : null}
    </View>
  );
}
