import { useQuery } from "@tanstack/react-query";
import { myInventorySchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { Pill } from "../family/shared";
import { ModuleOffScreen, useModuleOn } from "@/screens/shared/desk";

/**
 * Things issued to me on the phone (the parity batch, 10 Oct 2026, R-4),
 * the web's /account/items read only: what the stores have given me and I
 * still have, the assets I am the custodian of, and my own asks with where
 * each stands (GET /account/inventory, which names every member of staff).
 * Asking the stores for something stays on the web.
 */
export function MyItemsScreen() {
  const t = useT();
  const on = useModuleOn("INVENTORY");
  const query = useQuery({ queryKey: ["account", "inventory"], enabled: on, queryFn: async () => myInventorySchema.parse(unwrap(await api().get("/api/v1/account/inventory"))) });
  if (!on) return <ModuleOffScreen title={t("inventory.myTitle")} module="INVENTORY" />;
  const d = query.data;
  return (
    <Screen title={t("inventory.myTitle")} description={t("inventory.myIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("inventory.myIssued")}>
            {d.issued.length === 0 ? <Empty icon="archive" title={t("inventory.myIssuedNone")} body={t("inventory.myIssuedNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
            {d.issued.map((i) => (
              <Row key={i.itemCode} title={i.itemName} caption={`${i.quantity} ${i.unit}`} />
            ))}
          </Card>
          <Card title={t("inventory.myAssets")}>
            <Text variant="xs" tone="muted">
              {t("inventory.myAssetsBody")}
            </Text>
            {d.assets.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("inventory.myAssetsNone")}
              </Text>
            ) : null}
            {d.assets.map((a) => (
              <Row key={a.tagNumber} title={a.name} caption={`${a.tagNumber} · ${a.location}`} right={<Pill label={t(`inventory.condition${a.condition}` as TranslationKey)} tone={a.condition === "GOOD" ? "ok" : a.condition === "FAIR" ? "warn" : "danger"} />} />
            ))}
          </Card>
          {d.requests.length > 0 ? (
            <Card title={t("inventory.myAsks")}>
              {d.requests.map((r) => (
                <Row key={r.id} title={t("inventory.askLine", { quantity: r.quantity, item: r.itemName })} caption={r.decisionNote ?? undefined} right={<Pill label={t(`inventory.request${r.status}` as TranslationKey)} tone={r.status === "FULFILLED" ? "ok" : r.status === "PENDING" ? "warn" : "muted"} />} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
