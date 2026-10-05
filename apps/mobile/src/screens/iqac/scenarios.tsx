import { useQuery } from "@tanstack/react-query";
import { scenariosSchema, type Scenario } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { openWeb } from "@/screens/family/shared";
import { noCycle } from "./insights";
import { formatDate } from "@/lib/dates";

/**
 * The saved scenarios on the phone (5 Oct 2026), read-only: GET
 * /api/v1/iqac/scenarios?kind=NAAC, each with the CGPA the simulator gave it,
 * the band, and its difference from today's figures. Changing figures, saving
 * and removing a scenario are the web's simulator; the server recomputes each
 * result with today's formulas, so a number here is never a stale copy.
 */
const delta = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}`;

function ScenarioRow({ s }: { s: Scenario }) {
  const t = useT();
  return (
    <Row
      title={s.name}
      caption={`${t("insightsPhone.scenarioBy", { by: s.by, date: formatDate(s.at) })} · ${s.delta === 0 ? t("insightsPhone.scenarioSame") : t("insightsPhone.scenarioDelta", { delta: delta(s.delta) })}`}
      right={
        <Text bold tone={s.delta > 0 ? "ok" : s.delta < 0 ? "warn" : "fg"}>
          {t("insightsPhone.scenarioResult", { cgpa: s.result.toFixed(2), grade: s.grade ?? "—" })}
        </Text>
      }
    />
  );
}

export function ScenariosScreen() {
  const t = useT();
  const q = useQuery({
    queryKey: ["iqac", "scenarios", "NAAC"],
    queryFn: async () => scenariosSchema.parse(unwrap(await api().get("/api/v1/iqac/scenarios?kind=NAAC"))),
  });
  const items = q.data?.items ?? [];
  return (
    <Screen title={t("insightsPhone.scenariosTitle")} description={t("insightsPhone.scenariosIntro")} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      {q.isPending ? <Loading /> : null}
      {q.isError && noCycle(q.error) ? <Empty icon="medal" title={t("iqac.noCycleTitle")} body={t("insightsPhone.scenariosNoCycle")} action={<Button label={t("mobile.openOnWeb")} variant="secondary" onPress={() => openWeb("/iqac/predictor")} />} /> : null}
      {q.isError && !noCycle(q.error) ? <Failed message={q.error.message} onRetry={() => void q.refetch()} /> : null}
      {q.data && items.length === 0 ? <Empty icon="medal" title={t("insightsPhone.scenariosEmptyTitle")} body={t("insightsPhone.scenariosEmptyBody")} action={<Button label={t("insightsPhone.simulatorButton")} variant="secondary" onPress={() => openWeb("/iqac/simulator")} />} /> : null}
      {items.length ? (
        <Card>
          <Text variant="sm" tone="muted">
            {t("insightsPhone.scenarioToday", { cgpa: items[0]!.today.toFixed(2) })}
          </Text>
          {items.map((s) => (
            <ScenarioRow key={s.id} s={s} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
