import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { practiceJourneySchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatWith } from "@/lib/dates";
import { relativeTime } from "../family/shared";

/**
 * The pupil's own journey (A3-inventory-14, risks batch 5 Oct 2026): GET /api/v1/practice/journey, the web's
 * /student/practice/journey. Private by design: three numbers that are only theirs, the tier badges of the last six
 * months, and every badge newest first — compared with their own past only, never with anyone else.
 */
export function PracticeJourney() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({ queryKey: ["practice", "journey"], queryFn: async () => practiceJourneySchema.parse(unwrap(await api().get("/api/v1/practice/journey"))) });
  const d = query.data;
  const most = Math.max(1, ...(d?.monthly ?? []).map((m) => m.tiers));
  // The month in the reader's own language (the server's `label` is the English short name).
  const monthName = (month: string) => formatWith(`${month}-01`, { month: "short" }, locale);
  return (
    <Screen title={t("journey.title")} description={t("journey.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("journey.weeksInARow")} value={d.practiceWeeks} tone="accent" />
            <Stat label={t("journey.tierBadges")} value={d.totalTiers} />
            <Stat label={t("journey.questionsAnswered")} value={d.totalAnswers} />
          </View>
          <Card title={t("journey.monthlyTitle")}>
            <Text variant="xs" tone="muted">
              {t("journey.monthlyHint")}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: th.space[2] }}>
              {d.monthly.map((m) => (
                <View key={m.month} accessible accessibilityLabel={`${monthName(m.month)}: ${m.tiers}`} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                  <Text variant="xs" bold>
                    {m.tiers > 0 ? String(m.tiers) : " "}
                  </Text>
                  <View style={{ width: "100%", height: Math.max(4, Math.round((m.tiers / most) * 96)), borderTopLeftRadius: th.radius.sm, borderTopRightRadius: th.radius.sm, backgroundColor: th.accentSoft }} />
                  <Text variant="xs" tone="muted">
                    {monthName(m.month)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
          <Card title={t("journey.timelineTitle")}>
            {d.badges.length === 0 ? (
              <Empty icon="medal" title={t("journey.emptyTitle")} body={t("journey.emptyBody")} action={<Button label={t("feature.practice")} variant="secondary" onPress={() => router.push("/(app)/practice" as never)} />} />
            ) : (
              d.badges.map((b, i) => <Row key={`${b.earnedAt}:${i}`} icon="medal" title={b.label} caption={[b.description, relativeTime(b.earnedAt, locale)].filter(Boolean).join(" · ")} />)
            )}
          </Card>
          <View style={{ flexDirection: "row", gap: th.space[2], alignItems: "center" }}>
            <Icon name="shield" size={16} color={th.fgSubtle} />
            <Text variant="xs" tone="muted" style={{ flex: 1 }}>
              {t("journey.privateNote")}
            </Text>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
