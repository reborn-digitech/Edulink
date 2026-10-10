import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { formatPaise, type TranslationKey } from "@edulink/i18n";
import { inventorySummarySchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { StoresAsksCard } from "./office-asks";

export const INVENTORY_PATH = "/api/v1/admin/inventory";
export const INVENTORY_KEY = ["admin", "inventory"] as const;

/**
 * Inventory and assets at a glance, for the office and the head — the web's
 * /admin/inventory overview, READ-ONLY on the phone: what is running low,
 * the asks waiting, the assets by status and what they are worth, and the
 * last movements. Entries are made on the web, where the forms are.
 */
export function StaffInventory() {
  const t = useT();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  // The accounts desk keeps the stores with the office (the parity batch, 10 Oct 2026): the doors name ACCOUNTS.
  const office = role === null || role === "ADMIN" || role === "PRINCIPAL" || role === "ACCOUNTS";
  const query = useQuery({ queryKey: INVENTORY_KEY, enabled: office, queryFn: async () => inventorySummarySchema.parse(unwrap(await api().get(INVENTORY_PATH))) });
  const d = query.data;
  const home = <Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />;
  if (!office) {
    return (
      <Screen title={t("inventory.title")}>
        <Empty icon="archive" title={t("inventory.title")} body={t("inventory.intro")} action={home} />
      </Screen>
    );
  }
  return (
    <Screen title={t("inventory.title")} description={t("inventory.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("inventory.tabOverview")}>
            <Text variant="sm">{[`${t("inventory.statItems")}: ${d.counts.items}`, `${t("inventory.statLow")}: ${d.counts.lowStock}`, `${t("inventory.statAsks")}: ${d.counts.openRequests}`].join(" · ")}</Text>
            <Text variant="sm">{[`${t("inventory.statAssets")}: ${d.counts.assets}`, `${t("inventory.statRepair")}: ${d.counts.inRepair}`].join(" · ")}</Text>
            <Text variant="sm" bold>
              {`${t("inventory.statBookValue")}: ${formatPaise(d.bookValuePaise, locale)} · ${t("inventory.statCost", { cost: formatPaise(d.costPaise, locale) })}`}
            </Text>
            {!d.canEdit ? (
              <Text variant="xs" tone="muted">
                {t("inventory.headReads")}
              </Text>
            ) : null}
          </Card>
          <Card title={t("inventory.lowTitle")}>
            {d.lowStock.length === 0 ? (
              <Empty icon="archive" title={t("inventory.lowNone")} body={t("inventory.lowNoneBody")} action={home} />
            ) : (
              d.lowStock.map((i) => <Row key={i.id} title={i.name} caption={t("inventory.onHandOf", { onHand: i.onHand, unit: i.unit, level: i.reorderLevel })} />)
            )}
          </Card>
          {/* The asks, answered here by the office and the accounts desk (the parity batch, 10 Oct 2026, R-4); the head reads them. */}
          {d.canEdit ? (
            <StoresAsksCard requests={d.openRequests} />
          ) : (
            <Card title={t("inventory.asksTitle")}>
              {d.openRequests.length === 0 ? (
                <Empty icon="tray" title={t("inventory.asksNone")} body={t("inventory.asksNoneBody")} action={home} />
              ) : (
                d.openRequests.map((r) => <Row key={r.id} title={r.requesterName} caption={t("inventory.askLine", { quantity: r.quantity, item: r.itemName })} />)
              )}
            </Card>
          )}
          <Card title={t("inventory.recentTitle")}>
            {d.recentMovements.length === 0 ? (
              <Empty icon="tray" title={t("inventory.movementsNone")} body={t("inventory.movementsNoneBody")} action={home} />
            ) : (
              d.recentMovements.map((m) => (
                <Row key={m.id} title={`${m.itemName} · ${m.delta > 0 ? `+${m.delta}` : m.delta} ${m.unit}`} caption={[t(`inventory.kind${m.kind}` as TranslationKey), m.location, m.toName, m.toRoom, m.toDepartment].filter(Boolean).join(" · ")} />
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
