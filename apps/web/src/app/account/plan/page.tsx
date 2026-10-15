import type { Metadata } from "next";
import { CheckCircleIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { PERSON_PLANS, personPlanSchema } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/tenancy";
import { FEATURE_META } from "@/lib/feature-meta";
import { myPlans, planForCard, PLAN_NAME_KEY, PLAN_WHO_KEY } from "@/lib/person-plans";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("plans.pageTitle") };
}

/**
 * YOUR PLAN (16 October 2026; src/lib/person-plans.ts, decision 0006): the plans sold per person, what each
 * includes and costs, which one this account holds and until when. The plan card's Subscribe leads here. In this
 * half nothing can be paid: the page says payment opens soon, and that the school's office or the platform's
 * operator can switch a plan on (the operator's grant at /root/features). Under /account because it is the
 * person's own.
 */
export default async function YourPlanPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const ctx = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const asked = personPlanSchema.safeParse((await searchParams).plan);
  const held = await myPlans(ctx.user.id);
  const cards = await Promise.all(PERSON_PLANS.map((code) => planForCard(code)));
  const day = (d: Date) => formatInZone(d, "Asia/Kolkata", { dateStyle: "medium" }, locale);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("plans.pageTitle")} description={t("plans.pageIntro")} back={{ href: "/account", label: t("nav.account") }} />

      <Card data-testid="payment-soon">
        <CardHeader icon={<ClockIcon weight="duotone" className="size-5" />} title={t("plans.paymentSoonTitle")} description={t("plans.paymentSoonBody")} />
      </Card>

      <Card data-testid="your-plan-now">
        <CardHeader title={t("plans.yourPlanTitle")} />
        <CardBody>
          {held.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("plans.yourPlanNone")}</p>
          ) : (
            <ul className="space-y-1">
              {held.map((h) => (
                <li key={h.plan} className="text-sm text-fg">
                  {t("plans.yourPlanUntil", { name: t(PLAN_NAME_KEY[h.plan]), date: day(h.validTo) })}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ul className="space-y-3">
        {cards.map((c) => {
          const priced = c.pricePaise > 0 || c.yearlyPricePaise > 0;
          return (
            <li key={c.code}>
              <Card data-testid={`plan-${c.code}`} className={asked.success && asked.data === c.code ? "border-accent" : undefined}>
                <CardBody className="space-y-3 pt-5">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-fg">{t(PLAN_NAME_KEY[c.code])}</span>
                    {held.some((h) => h.plan === c.code) && (
                      <Badge size="sm" tone="ok">
                        {t("plans.stateLive")}
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-fg-muted">{t(PLAN_WHO_KEY[c.code])}</p>
                  <ul className="space-y-1">
                    {c.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-fg">
                        <CheckCircleIcon weight="fill" className="size-4 shrink-0 text-ok" aria-hidden />
                        {t(FEATURE_META[f].nameKey)}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-fg">
                    {priced
                      ? t("plans.pricesNow", { monthly: formatPaise(c.pricePaise, locale), yearly: formatPaise(c.yearlyPricePaise, locale) })
                      : t("plans.priceNotSet")}
                  </p>
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-fg-subtle">{t("plans.sessionsNote")}</p>
    </div>
  );
}
