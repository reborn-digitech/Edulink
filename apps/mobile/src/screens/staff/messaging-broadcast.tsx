import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { broadcastDetailSchema, broadcastResentSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatInstant, Pill } from "../family/shared";
import { audienceLabel, channelLabel, messageCaption, STATUS_TONE, statusLabel } from "../shared/messaging";
import { must } from "./shared";

/**
 * One notice's delivery report — the web's /admin/messaging/[broadcastId]:
 * the counts, the words that went, and every family it was for with the
 * channel it went on, where it got to, and why it stopped there when it
 * did. The office may queue the failed ones again; the head reads.
 */
export function MessagingBroadcast() {
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const office = role === "ADMIN";
  const id = typeof broadcastId === "string" && broadcastId ? broadcastId : null;
  const query = useQuery({
    queryKey: ["messaging", "broadcast", id],
    queryFn: async () => broadcastDetailSchema.parse(unwrap(await api().get(`/api/v1/messaging/broadcasts/${id}`))),
    enabled: id !== null,
  });
  const resend = useMutation({
    mutationFn: async () => broadcastResentSchema.parse(must(await api().post(`/api/v1/messaging/broadcasts/${id}/resend`, {}), t("common.somethingWrong"))),
    onSuccess: (r) => {
      toast.show(t("messaging.detailResent", { count: r.requeued }));
      void qc.invalidateQueries({ queryKey: ["messaging"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const d = query.data;
  const b = d?.broadcast;
  const back = <Button label={t("messaging.title")} variant="secondary" onPress={() => router.push("/(app)/messaging" as never)} />;
  const failed = b ? b.failed : 0;
  return (
    <Screen title={b ? t("messaging.detailTitle", { title: b.title }) : t("messaging.broadcastsTitle")} description={b ? [audienceLabel(t, b.audience), `${t("messaging.colBy")} ${b.author}`, formatInstant(b.createdAt, locale)].join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {id === null ? <Empty title={t("messaging.notFound")} action={back} /> : null}
      {id !== null && query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && b ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("messaging.detailRecipients")} value={b.recipients} />
            <Stat label={t("messaging.colSent")} value={b.sent} />
            <Stat label={t("messaging.colDelivered")} value={b.delivered} tone="ok" />
            <Stat label={t("messaging.colFailed")} value={b.failed} tone={b.failed > 0 ? "danger" : "fg"} />
            <Stat label={t("messaging.colSkipped")} value={b.skipped} tone={b.skipped > 0 ? "warn" : "fg"} />
          </View>
          <Card title={t("messaging.colNotice")} action={<Pill label={statusLabel(t, b.status)} tone={STATUS_TONE[b.status.toUpperCase()] ?? "muted"} />}>
            <Text variant="base" selectable>
              {b.body}
            </Text>
            <Text variant="xs" tone="muted">
              {b.channels.map((c) => channelLabel(t, c)).join(" · ")}
            </Text>
          </Card>
          {office && failed > 0 ? <Button label={t("messaging.detailResend")} variant="secondary" busy={resend.isPending} onPress={() => resend.mutate()} /> : null}
          <Card title={t("messaging.detailRecipients")}>
            {d.messages.length === 0 ? (
              <Empty title={t("messaging.detailEmpty")} action={back} />
            ) : (
              d.messages.map((m) => <Row key={m.id} title={m.name ?? m.to} caption={messageCaption(t, m, m.name !== null)} right={<Pill label={statusLabel(t, m.status)} tone={STATUS_TONE[m.status.toUpperCase()] ?? "muted"} />} />)
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
