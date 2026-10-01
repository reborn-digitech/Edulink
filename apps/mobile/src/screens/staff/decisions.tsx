import { useState } from "react";
import { View } from "react-native";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { DECISION_KINDS, decisionsSchema, type DecisionKind } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { useRouter } from "expo-router";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, formatDateKey, shiftMonth, thisMonthKey } from "./shared";

type KindFilter = DecisionKind | "ALL";
const PATH = "/api/v1/principal/decisions";
const PAGE = 30;

export const DECISION_KIND_KEY: Record<DecisionKind, TranslationKey> = {
  leave: "decisions.kindLeave",
  pen: "decisions.kindPen",
  record: "decisions.kindRecord",
  certificate: "decisions.kindCertificate",
  join: "decisions.kindJoin",
  admission: "decisions.kindAdmission",
};

/** The first and last day keys of a YYYY-MM month. */
export function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

/** The query string the server reads, built by hand: React Native's URLSearchParams is a partial polyfill. */
export function decisionsQuery(kind: KindFilter, month: string | null, cursor: string | null): string {
  const parts = [`limit=${PAGE}`];
  if (kind !== "ALL") parts.push(`kind=${kind}`);
  if (month) {
    const { from, to } = monthBounds(month);
    parts.push(`from=${from}`, `to=${to}`);
  }
  if (cursor) parts.push(`cursor=${encodeURIComponent(cursor)}`);
  return `?${parts.join("&")}`;
}

/**
 * The head's decision log — the web's /principal/decisions: what the head
 * decided (leave, PEN and record changes, certificates, joins, admissions),
 * one sentence each, newest first, read from the audit rows the decisions
 * wrote. Read-only. Kind chips and a month stepper narrow it; thirty rows a
 * page, the next page fetched on "Show more". The office reads the head's.
 */
export function StaffDecisions() {
  const t = useT();
  const router = useRouter();
  const th = useTheme();
  const { locale } = useLocale();
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [month, setMonth] = useState<string | null>(null);
  const query = useInfiniteQuery({
    queryKey: ["principal", "decisions", kind, month],
    queryFn: async ({ pageParam }) => decisionsSchema.parse(unwrap(await api().get(`${PATH}${decisionsQuery(kind, month, pageParam)}`))),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
  const first = query.data?.pages[0];
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const remaining = first ? Math.min(PAGE, Math.max(0, first.total - items.length)) : 0;
  const narrowed = kind !== "ALL" || month !== null;
  const monthLabel = month ? formatDateKey(`${month}-01`, locale, { month: "long", year: "numeric" }) : t("decisions.allMonths");
  const when = (iso: string) => formatDateKey(iso.slice(0, 10), locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <Screen title={first && !first.own ? t("decisions.headsTitle") : t("decisions.title")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text variant="sm" tone="muted">
        {first && !first.own ? t("decisions.headsIntro") : t("decisions.intro")}
      </Text>
      <Chips<KindFilter>
        label={t("decisions.kindFilter")}
        value={kind}
        onChange={setKind}
        options={[{ value: "ALL", label: t("decisions.allKinds") }, ...DECISION_KINDS.map((k) => ({ value: k, label: t(DECISION_KIND_KEY[k]) }))]}
      />
      <View accessibilityLabel={t("decisions.monthFilter")} style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
        <Button variant="secondary" label={t("attendanceHistory.previousMonth")} onPress={() => setMonth(month ? shiftMonth(month, -1) : thisMonthKey())} />
        <Text variant="sm" bold style={{ flex: 1, textAlign: "center" }}>
          {monthLabel}
        </Text>
        {/* Forward from this month is "all months"; from there, nothing lies ahead. */}
        <Button variant="secondary" label={t("attendanceHistory.nextMonth")} disabled={month === null} onPress={() => setMonth(month && month < thisMonthKey() ? shiftMonth(month, 1) : null)} />
      </View>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {first ? (
        items.length === 0 ? (
          <Empty
            icon="clipboard"
            title={narrowed ? t("common.noResultsTitle") : first.own ? t("decisions.empty") : t("decisions.emptyHeads")}
            body={narrowed ? t("common.noResultsBody") : first.own ? t("decisions.emptyBody") : undefined}
            action={
              narrowed ? (
                <Button label={t("people.clearFilters")} variant="secondary" onPress={() => { setKind("ALL"); setMonth(null); }} />
              ) : (
                <Button label={t("nav.leave")} variant="secondary" onPress={() => router.push("/(app)/leave" as never)} />
              )
            }
          />
        ) : (
          <Card title={t("decisions.shownOf", { shown: items.length, total: first.total })}>
            {items.map((d) => (
              <Row key={d.id} title={d.sentence} caption={[when(d.at), t(DECISION_KIND_KEY[d.kind])].join(" · ")} icon={d.approved ? "checks" : "clipboard"} />
            ))}
            {query.hasNextPage && remaining > 0 ? <Button label={t("common.showMore", { count: remaining })} variant="secondary" busy={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} /> : null}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
