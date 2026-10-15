import Link from "next/link";
import { CheckCircleIcon, LockKeyIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import type { FeatureCode, PlanCode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FEATURE_META } from "@/lib/feature-meta";
import { PLAN_NAME_KEY, PLAN_WHO_KEY, planForCard } from "@/lib/person-plans";
import { getLocale, getT } from "@/lib/i18n/server";

/**
 * WHAT A LOCKED PERSON SEES (16 October 2026; src/lib/person-plans.ts, decision 0006): in place of a page whose
 * feature is on but needs a plan they do not hold, the plan's name, why this page needs it, what the plan
 * includes, its monthly and yearly price in rupees, and Subscribe. In this half nothing can be paid: Subscribe leads
 * to /account/plan, which says payment opens soon and that the office or the operator can switch the plan on.
 * `child` is set on a guardian's page about a pupil, whose plan it is.
 */
export async function PlanCard({
  plan,
  feature,
  child,
}: {
  plan: PlanCode;
  feature: FeatureCode;
  child?: string;
}) {
  const t = await getT();
  const locale = await getLocale();
  const card = await planForCard(plan);
  const name = t(PLAN_NAME_KEY[plan]);
  const featureName = t(FEATURE_META[feature].nameKey);
  const priced = card.pricePaise > 0 || card.yearlyPricePaise > 0;
  return (
    <div className="space-y-5">
      <PageHeader title={t("plans.lockedTitle", { feature: featureName })} />
      <Card data-testid="plan-card" data-plan={plan}>
        <CardHeader
          icon={<LockKeyIcon weight="duotone" className="size-6" />}
          title={name}
          description={
            child
              ? t("plans.cardWhyChild", {
                  feature: featureName,
                  name: child,
                  plan: name,
                })
              : t("plans.cardWhy", { feature: featureName, plan: name })
          }
        />
        <CardBody className="space-y-4">
          <p className="text-sm text-fg-muted">{t(PLAN_WHO_KEY[plan])}</p>
          <div>
            <p className="text-sm font-semibold text-fg">
              {t("plans.cardIncludes")}
            </p>
            <ul className="mt-2 space-y-1" data-testid="plan-card-features">
              {card.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-fg">
                  <CheckCircleIcon
                    weight="fill"
                    className="size-4 shrink-0 text-ok"
                    aria-hidden
                  />
                  {t(FEATURE_META[f].nameKey)}
                </li>
              ))}
            </ul>
          </div>
          {priced ? (
            <p
              className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg"
              data-testid="plan-card-prices"
            >
              <span>
                {t("plans.priceMonthly", {
                  amount: formatPaise(card.pricePaise, locale),
                })}
              </span>
              <span>
                {t("plans.priceYearly", {
                  amount: formatPaise(card.yearlyPricePaise, locale),
                })}
              </span>
            </p>
          ) : (
            <p className="text-sm text-fg-muted" data-testid="plan-card-prices">
              {t("plans.priceNotSet")}
            </p>
          )}
          <Button asChild>
            <Link
              href={`/account/plan?plan=${plan}`}
              data-testid="plan-card-subscribe"
            >
              {t("plans.subscribe")}
            </Link>
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
