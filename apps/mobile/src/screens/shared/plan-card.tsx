import { Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { passOverviewSchema, type PlanCode } from "@edulink/contracts";
import { Button, Card, Text } from "@/components";
import { api, API_BASE } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";

/**
 * YOUR PLAN on the account screen (plans-pay, 17 October 2026): the plans this account holds and until when, the web's
 * "Your plan" line, and — while there is a pass this person may buy or ask a guardian for — a button that opens the
 * web's Plans page in the system browser. No payment happens in the app: the gateway's own page takes the card or
 * UPI on the web (policy 0002). Draws nothing when the read fails (an older server without the door).
 */
const NAME_KEY = { STUDENT: "plans.nameStudent", TEACHER: "plans.nameTeacher", EXPERT: "plans.nameExpert" } as const satisfies Record<PlanCode, string>;

export function PlanCard() {
  const t = useT();
  const overview = useQuery({
    queryKey: ["account", "pass"],
    queryFn: async () => passOverviewSchema.parse(unwrap(await api().get("/api/v1/account/pass"))),
  });
  const d = overview.data;
  if (!d) return null;
  // The last day held: a window ends at an instant, midnight after its last day.
  const lastDay = (iso: string) => formatDate(new Date(new Date(iso).getTime() - 1), "Asia/Kolkata");
  const canBuy = d.offers.some((o) => o.buy === "PAY" || o.buy === "ASK_GUARDIAN");
  return (
    <Card title={t("plans.yourPlanTitle")}>
      {d.held.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("plans.yourPlanNone")}
        </Text>
      ) : (
        d.held.map((h) => (
          <Text key={h.plan} variant="sm">
            {t("plans.yourPlanUntil", { name: t(NAME_KEY[h.plan]), date: lastDay(h.validTo) })}
          </Text>
        ))
      )}
      {canBuy ? (
        <>
          <Button label={t("passes.buyOnWeb")} variant="secondary" onPress={() => void Linking.openURL(`${API_BASE}/account/plan`)} />
          <Text variant="xs" tone="muted">
            {t("passes.buyOnWebNote")}
          </Text>
        </>
      ) : null}
    </Card>
  );
}
