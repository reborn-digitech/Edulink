import { Linking, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { PLAN_FEATURES, passOverviewSchema, type FeatureCode, type PlanCode } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { api, API_BASE } from "@/lib/api";
import { unwrap, type PlanLockInfo } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Text } from "./text";
import { Button } from "./button";
import { Card } from "./card";
import { Icon } from "./icon";

/**
 * WHAT A LOCKED PERSON SEES ON THE PHONE (QA-18, 24 Oct 2026): a door whose feature is on but needs a plan this
 * person does not hold answers 402 PLAN_REQUIRED naming the plan and the feature, and `Failed` draws this card in
 * place of a red error with a "Try again" that could only fail again. The web's PlanCard (apps/web
 * src/components/plan-card.tsx) says the same: the feature needs a plan, the plan's name, why, who it is for, what
 * it includes, its monthly and yearly price, and Subscribe. No payment happens in the app (policy 0002): Subscribe
 * opens the web's plan page in the system browser, as the account screen's plan card does. The prices come from
 * the person's own offers (GET /api/v1/account/pass); while they are loading or unread the price line is left out.
 */
const NAME_KEY = { STUDENT: "plans.nameStudent", TEACHER: "plans.nameTeacher", EXPERT: "plans.nameExpert" } as const satisfies Record<PlanCode, string>;
const WHO_KEY = { STUDENT: "plans.whoStudent", TEACHER: "plans.whoTeacher", EXPERT: "plans.whoExpert" } as const satisfies Record<PlanCode, string>;
const FEATURE_NAME_KEY = {
  ASSISTANT: "platformFeatures.assistantName",
  QUESTION_BANK: "platformFeatures.questionBankName",
  QUESTION_GIG: "platformFeatures.questionGigName",
  EXPERT_SESSIONS: "platformFeatures.expertSessionsName",
  TEACHER_SESSIONS: "platformFeatures.teacherSessionsName",
  JOB_BOARD: "platformFeatures.jobBoardName",
  TEXT_MESSAGING: "platformFeatures.textMessagingName",
} as const satisfies Record<FeatureCode, string>;

/** `message` is the server's own sentence ("This needs the Expert plan…"), said when the answer names no feature. */
export function PlanLock({ plan, feature, message }: PlanLockInfo & { message?: string }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const overview = useQuery({
    queryKey: ["account", "pass"],
    queryFn: async () => passOverviewSchema.parse(unwrap(await api().get("/api/v1/account/pass"))),
  });
  const name = t(NAME_KEY[plan]);
  // A door names its feature; an older server's answer names only the plan: then the plan's name heads the card and the server's sentence says why.
  const featureName = feature ? t(FEATURE_NAME_KEY[feature]) : null;
  const offers = (overview.data?.offers ?? []).filter((o) => o.plan === plan);
  const offer = offers.find((o) => o.holder.self) ?? offers[0];
  const price = (period: "MONTH" | "YEAR") => offer?.prices.find((p) => p.period === period)?.amountPaise ?? 0;
  const priced = offer ? price("MONTH") > 0 || price("YEAR") > 0 : null;
  return (
    <View testID="plan-lock" style={{ gap: th.space[3] }}>
      <Text variant="xl" bold accessibilityRole="header">
        {featureName ? t("plans.lockedTitle", { feature: featureName }) : name}
      </Text>
      <Card title={name}>
        {featureName ? <Text variant="base">{t("plans.cardWhy", { feature: featureName, plan: name })}</Text> : message ? <Text variant="base">{message}</Text> : null}
        <Text variant="sm" tone="muted">
          {t(WHO_KEY[plan])}
        </Text>
        <Text variant="sm" bold>
          {t("plans.cardIncludes")}
        </Text>
        <View style={{ gap: th.space[1] }}>
          {PLAN_FEATURES[plan].map((f) => (
            <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
              <Icon name="checkCircle" size={16} color={th.ok} weight="fill" />
              <Text variant="sm">{t(FEATURE_NAME_KEY[f])}</Text>
            </View>
          ))}
        </View>
        {priced === true ? (
          <Text variant="sm">
            {t("plans.priceMonthly", { amount: formatPaise(price("MONTH"), locale) })} · {t("plans.priceYearly", { amount: formatPaise(price("YEAR"), locale) })}
          </Text>
        ) : priced === false ? (
          <Text variant="sm" tone="muted">
            {t("plans.priceNotSet")}
          </Text>
        ) : null}
        <Button label={t("plans.subscribe")} onPress={() => void Linking.openURL(`${API_BASE}/account/plan?plan=${plan}`)} />
        <Text variant="xs" tone="muted">
          {t("passes.buyOnWebNote")}
        </Text>
      </Card>
    </View>
  );
}
