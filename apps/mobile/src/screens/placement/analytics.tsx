import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { placementAnalyticsSchema, type PlacementTable } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { ModuleOffScreen, useModuleOn } from "@/screens/shared/desk";
import { lpa } from "./words";

/**
 * The placement table on the phone (the parity batch, 10 Oct 2026, R-4), the
 * web's /placement/analytics, read only: the season and the three years
 * before it, each with NBA's N, X, Y and Z and the index, NIRF's median,
 * the offers, the salary bands, the rates by programme and the sectors —
 * computed on every read from the offers and the profiles, never typed. For
 * the TPO and the IQAC (the predictor and the filings read the same rows);
 * the sheets' export and publishing a season stay on the web.
 */
export function PlacementTableScreen() {
  const t = useT();
  const th = useTheme();
  const on = useModuleOn("PLACEMENT");
  const query = useQuery({ queryKey: ["placement", "analytics"], enabled: on, queryFn: async () => placementAnalyticsSchema.parse(unwrap(await api().get("/api/v1/placement/analytics"))) });
  if (!on) return <ModuleOffScreen title={t("placement.tabAnalytics")} module="PLACEMENT" />;
  const tables = query.data?.tables ?? [];
  const published = new Map((query.data?.seasons ?? []).map((s) => [s.batchYear, s]));
  const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");
  const table = (x: PlacementTable) => (
    <Card key={x.batchYear} title={t("deskParity.tableBatch", { year: x.batchYear })}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Stat label={t("placement.colN")} value={x.finalYear} />
        <Stat label={t("placement.colX")} value={x.placed} tone="ok" />
        <Stat label={t("placement.colY")} value={x.higherStudies} />
        <Stat label={t("placement.colZ")} value={x.entrepreneurs} />
      </View>
      <Row title={t("placement.colIndex")} right={<Text bold>{x.placementIndex === null ? "—" : x.placementIndex.toFixed(2)}</Text>} />
      <Row title={t("placement.colMedian")} right={<Text bold>{x.medianSalaryRupees === null ? "—" : lpa(x.medianSalaryRupees, t)}</Text>} />
      <Row title={t("placement.colOffers")} caption={x.offersPerStudent === null ? undefined : t("deskParity.tableOffersPerStudent", { n: x.offersPerStudent.toFixed(2) })} right={<Text bold>{String(x.offers)}</Text>} />
      <Text variant="xs" tone={published.has(x.batchYear) ? "ok" : "muted"}>
        {published.has(x.batchYear) ? t("deskParity.tablePublished") : t("deskParity.tableNotPublished")}
      </Text>
      {x.bands.some((b) => b.count > 0) ? (
        <>
          <Text variant="sm" bold>
            {t("placement.bandsTitle")}
          </Text>
          {x.bands.map((b) => (
            <Row key={b.band} title={t(`placement.band${b.band}` as TranslationKey)} right={<Text>{String(b.count)}</Text>} />
          ))}
        </>
      ) : null}
      {x.byProgramme.length > 0 ? (
        <>
          <Text variant="sm" bold>
            {t("placement.colProgramme")}
          </Text>
          {x.byProgramme.map((p) => (
            <Row key={p.programmeId} title={p.programmeName} caption={`${t("placement.colX")} ${p.placed} / ${t("placement.colN")} ${p.finalYear}`} right={<Text>{pct(p.placed, p.finalYear)}</Text>} />
          ))}
        </>
      ) : null}
      {x.bySector.length > 0 ? (
        <>
          <Text variant="sm" bold>
            {t("placement.colSectors")}
          </Text>
          {x.bySector.map((s) => (
            <Row key={s.sector} title={t(`placement.sector${s.sector}` as TranslationKey)} caption={t("placement.sectorLine", { companies: s.companies, offers: s.offers })} />
          ))}
        </>
      ) : null}
    </Card>
  );
  return (
    <Screen title={t("placement.tabAnalytics")} description={t("placement.analyticsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && tables.length === 0 ? <Empty icon="chartLine" title={t("deskParity.tableNone")} body={t("deskParity.tableNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {tables.map(table)}
    </Screen>
  );
}
