import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { grievanceDeskSchema } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useTheme } from "@/lib/theme";
import { Notice, formatDateKey } from "../staff/shared";
import { Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";

type Grievance = z.infer<typeof grievanceDeskSchema>["items"][number];
type Action = "ACKNOWLEDGE" | "RESOLVE" | "ESCALATE";

/**
 * The grievance line on the phone (the parity batch, 10 Oct 2026, R-4), the
 * web's /iqac/grievances: every student grievance with its UGC 2023
 * fifteen-working-day limit and the month's summary. The IQAC reads and
 * counts; the office and the head act (the door and the web page both give
 * the act to ADMIN and PRINCIPAL alone, `canAct`): acknowledge, resolve or
 * send to the Ombudsperson, each with a note, through the web's door (POST
 * /iqac/grievances/{id}); the student is told. Ragging and harassment are
 * held by the office and the head, as the server sends them. A decision is
 * sent live and never queued.
 */
export function GrievancesDeskScreen() {
  // No screenshots while it is up (A3-S-12): students' grievances.
  usePrivateScreen();
  const t = useT();
  const th = useTheme();
  const on = useModuleOn("IQAC");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["iqac", "grievances"], enabled: on, queryFn: async () => grievanceDeskSchema.parse(unwrap(await api().get("/api/v1/iqac/grievances"))) });
  if (!on) return <ModuleOffScreen title={t("iqac.grievancesTitle")} module="IQAC" />;
  const d = query.data;
  const open = d?.items.filter((g) => g.status !== "RESOLVED") ?? [];
  const closed = d?.items.filter((g) => g.status === "RESOLVED") ?? [];
  return (
    <Screen title={t("iqac.grievancesTitle")} description={t("iqac.grievancesIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <Card title={t("iqac.summaryTitle", { month: d.summary.month })}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("iqac.summary.filed")} value={d.summary.filed} />
            <Stat label={t("iqac.summary.resolved")} value={d.summary.resolved} tone="ok" />
            <Stat label={t("iqac.summary.overdue")} value={d.summary.overdue} tone={d.summary.overdue > 0 ? "danger" : "fg"} />
            <Stat label={t("iqac.summary.escalated")} value={d.summary.escalated} />
            <Stat label={t("iqac.summary.open")} value={d.summary.open} tone={d.summary.open > 0 ? "warn" : "fg"} />
          </View>
          {!d.canAct ? (
            <Text variant="xs" tone="muted">
              {t("deskParity.grievancesReadOnly")}
            </Text>
          ) : null}
        </Card>
      ) : null}
      {d && d.items.length === 0 ? <Empty icon="shield" title={t("iqac.noGrievancesDesk")} body={t("iqac.grievancesIntro")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {open.length > 0 ? (
        <Card title={t("deskParity.grievancesOpen", { count: open.length })}>
          {open.map((g) => (
            <GrievanceCard key={g.id} item={g} canAct={Boolean(d?.canAct)} onDone={setNotice} />
          ))}
        </Card>
      ) : null}
      {closed.length > 0 ? (
        <Card title={t("deskParity.grievancesResolved", { count: closed.length })}>
          {closed.map((g) => (
            <GrievanceCard key={g.id} item={g} canAct={false} onDone={setNotice} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const TONE: Record<Grievance["status"], "warn" | "accent" | "ok" | "danger"> = { OPEN: "warn", ACKNOWLEDGED: "accent", RESOLVED: "ok", ESCALATED: "danger" };

function GrievanceCard({ item, canAct, onDone }: { item: Grievance; canAct: boolean; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const act = useMutation({
    mutationFn: async () => unwrap(await api().post(`/api/v1/iqac/grievances/${item.id}`, { action, note: note.trim() })),
    onSuccess: () => {
      setAction(null);
      setNote("");
      setError(null);
      onDone({ tone: "ok", text: t("iqac.acted") });
      void qc.invalidateQueries({ queryKey: ["iqac"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const label = (a: Action) => t(a === "ACKNOWLEDGE" ? "iqac.acknowledgeButton" : a === "RESOLVE" ? "iqac.resolveButton" : "iqac.escalateDeskButton");
  const actions: Action[] = item.status === "OPEN" ? ["ACKNOWLEDGE", "RESOLVE", "ESCALATE"] : item.status === "ACKNOWLEDGED" ? ["RESOLVE", "ESCALATE"] : [];
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <Row
        title={t(`iqac.grievanceKind.${item.kind}` as TranslationKey)}
        caption={[item.by || t("iqac.grievanceNameWithheld"), t("iqac.dueLine", { date: formatDateKey(item.dueOn, locale) }), item.overdue ? t("iqac.overdueBadge") : null, t(`iqac.committeeKind.${item.committee}` as TranslationKey)].filter(Boolean).join(" · ")}
        right={<Pill label={t(`iqac.grievanceStatus.${item.status}` as TranslationKey)} tone={TONE[item.status]} />}
      />
      <Text variant="sm">{item.text || t("iqac.grievanceConfidential")}</Text>
      {item.response ? (
        <Text variant="sm" tone="muted">
          {t("deskParity.grievanceResponse", { text: item.response })}
        </Text>
      ) : null}
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {canAct && actions.length > 0 && action === null ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          {actions.map((a) => (
            <Button key={a} label={label(a)} accessibilityLabel={`${label(a)}: ${t(`iqac.grievanceKind.${item.kind}` as TranslationKey)}`} variant={a === "RESOLVE" ? "primary" : "secondary"} onPress={() => setAction(a)} />
          ))}
        </View>
      ) : null}
      {action !== null ? (
        <>
          <Field label={t("iqac.noteField")} value={note} onChangeText={setNote} maxLength={4000} multiline />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={label(action)} disabled={note.trim().length < 2 || act.isPending} busy={act.isPending} onPress={() => act.mutate()} />
            <Button label={t("common.cancel")} variant="secondary" disabled={act.isPending} onPress={() => setAction(null)} />
          </View>
          <OfflineDecisionNote />
        </>
      ) : null}
    </View>
  );
}
