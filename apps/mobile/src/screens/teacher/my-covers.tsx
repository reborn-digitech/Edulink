import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { myCoversSchema, type MyCover } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { addDaysToKey, formatDateKey } from "../staff/shared";
import { periodLine } from "../staff/substitutions";

/**
 * The lessons I am covering — the web's /staff/substitutions/me for every
 * member of staff: what the office has asked me to take on a day, in period
 * order, with whose lesson it is and the note the office left. One GET; the
 * day arrows ask for another day.
 */
export const MY_COVERS_PATH = "/api/v1/staff/substitutions/me";
export const MY_COVERS_KEY = ["staff", "my-covers"] as const;

/** A lesson I am covering as one block: subject and class, the period and room, whose it is, and the office's note. */
export function CoverItem({ item }: { item: MyCover }) {
  const t = useT();
  const th = useTheme();
  return (
    <View style={{ gap: 2, paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <Text variant="base" bold>
        {`${item.subject} · ${item.className}`}
      </Text>
      <Text variant="sm" tone="muted">
        {[periodLine(t, item), item.room, t("substitutions.coveringFor", { name: item.absentName })].filter(Boolean).join(" · ")}
      </Text>
      {item.note ? (
        <Text variant="xs" tone="muted">
          {`${t("staffAttendance.note")}: ${item.note}`}
        </Text>
      ) : null}
    </View>
  );
}

export function MyCovers() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [date, setDate] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...MY_COVERS_KEY, date ?? "today"],
    placeholderData: keepPreviousData,
    queryFn: async () => myCoversSchema.parse(unwrap(await api().get(`${MY_COVERS_PATH}${date ? `?date=${date}` : ""}`))),
  });
  const d = query.data;
  const dayLabel = d ? formatDateKey(d.dateKey, locale, { weekday: "short", day: "numeric", month: "short" }) : "";
  return (
    <Screen title={t("substitutions.myCoversTitle")} description={t("substitutions.myCoversIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
          <Button label={t("substitutions.previousDay")} variant="secondary" onPress={() => setDate(addDaysToKey(d.dateKey, -1))} />
          <Text variant="base" bold style={{ flex: 1, textAlign: "center" }} accessibilityLabel={t("substitutions.forDay", { date: dayLabel })}>
            {dayLabel}
          </Text>
          <Button label={t("substitutions.nextDay")} variant="secondary" onPress={() => setDate(addDaysToKey(d.dateKey, 1))} />
          {date !== null ? <Button label={t("substitutions.today")} variant="ghost" onPress={() => setDate(null)} /> : null}
        </View>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.items.length === 0 ? (
          <Empty icon="users" title={t("substitutions.noCovers")} body={t("substitutions.noCoversBody")} action={<Button label={t("teacher.openTimetable")} variant="secondary" onPress={() => router.push("/(app)/timetable" as never)} />} />
        ) : (
          <Card>
            {d.items.map((item) => (
              <CoverItem key={item.slotId} item={item} />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
