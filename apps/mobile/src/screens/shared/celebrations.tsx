import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { celebrationsSchema, type Celebrations as CelebrationsView } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSessionIfAny } from "@/lib/session";
import { formatDayWithWeekday } from "@/lib/dates";
import { formatDateKey, Note, Pill } from "../family/shared";

/**
 * Birthdays and work anniversaries (A3-inventory-14, risks batch 5 Oct 2026): GET /api/v1/shared/bulletin/celebrations,
 * the web's /bulletin/celebrations and its CelebrationsLink. The month first; when the month is quiet, the next ones
 * up to half a year ahead, labelled as such. Who appears is the server's rule (birthdays.ts).
 */
type Item = CelebrationsView["items"][number];
export type Upcoming = { items: Item[]; later: boolean };

export const CELEBRATIONS_KEY = ["shared", "celebrations"] as const;

async function readUpcoming(): Promise<Upcoming> {
  const read = async (days: number) => celebrationsSchema.parse(unwrap(await api().get(`/api/v1/shared/bulletin/celebrations?days=${days}`))).items;
  const month = await read(30);
  if (month.length > 0) return { items: month, later: false };
  const half = await read(183);
  return { items: half, later: half.length > 0 };
}

export function useUpcomingCelebrations() {
  return useQuery({ queryKey: CELEBRATIONS_KEY, queryFn: readUpcoming });
}

/** The one door on a home: the next birthday or anniversary by name and day; nothing at all while it loads or fails. */
export function CelebrationsCard() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useUpcomingCelebrations();
  const d = query.data;
  if (!d) return null;
  const next = d.items[0];
  const caption = next
    ? d.later
      ? t("celebrations.nextLater", { name: next.name, date: formatDateKey(next.dateKey, locale) })
      : t("celebrations.nextUp", { name: next.name, date: formatDateKey(next.dateKey, locale), count: d.items.length })
    : t("celebrations.noneSoon");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("celebrations.title")}, ${caption}`}
      onPress={() => router.push("/(app)/celebrations" as never)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3], padding: th.space[3], borderRadius: th.radius.md, borderWidth: 1, borderColor: th.border, backgroundColor: th.surface })}
    >
      <Icon name="confetti" size={24} color={th.accentStrong} weight="duotone" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="sm" bold>
          {t("celebrations.title")}
        </Text>
        <Text variant="xs" tone="muted" numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <Icon name="caretRight" size={16} color={th.fgSubtle} />
    </Pressable>
  );
}

/** The list, grouped by day so three birthdays on Friday read as one Friday. */
export function Celebrations() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const session = useSessionIfAny();
  const mine = session?.status === "signed-in" ? session.me.active.membershipId : null;
  const query = useUpcomingCelebrations();
  const d = query.data;
  const byDay = new Map<string, Item[]>();
  for (const item of d?.items ?? []) byDay.set(item.dateKey, [...(byDay.get(item.dateKey) ?? []), item]);
  const multiSchool = new Set((d?.items ?? []).map((i) => i.schoolName)).size > 1;
  const line = (item: Item) =>
    [
      item.kind === "BIRTHDAY" ? t("celebrations.birthday") : item.years === 1 ? t("celebrations.anniversaryOne") : t("celebrations.anniversaryMany", { years: item.years ?? 0 }),
      t(`role.${item.role.toLowerCase()}` as TranslationKey),
      multiSchool ? item.schoolName : null,
    ]
      .filter(Boolean)
      .join(" · ");
  return (
    <Screen title={t("celebrations.title")} description={t("celebrations.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && d.items.length === 0 ? <Empty icon="confetti" title={t("celebrations.noneTitle")} body={t("celebrations.noneBody")} action={<Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />} /> : null}
      {d?.later ? (
        <Note tone="accent">
          <Text variant="sm">{t("celebrations.laterNote")}</Text>
        </Note>
      ) : null}
      {[...byDay.entries()].map(([dateKey, list]) => (
        <Card key={dateKey} title={formatDayWithWeekday(dateKey, locale)}>
          {list.map((item) => (
            <Row key={`${item.kind}:${item.membershipId}`} icon={item.kind === "BIRTHDAY" ? "confetti" : "medal"} title={item.name} caption={line(item)} right={item.membershipId === mine ? <Pill tone="accent" label={t("celebrations.you")} /> : undefined} />
          ))}
        </Card>
      ))}
    </Screen>
  );
}
