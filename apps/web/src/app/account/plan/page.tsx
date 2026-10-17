import type { Metadata } from "next";
import { CheckCircleIcon, ReceiptIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { PERSON_PLANS, personPlanSchema, type PassOffer } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/tenancy";
import { FEATURE_META } from "@/lib/feature-meta";
import { planForCard, PLAN_NAME_KEY, PLAN_WHO_KEY } from "@/lib/person-plans";
import { myPassOrders, passOverview } from "@/lib/pass-orders";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AskGuardian, BuyPass } from "./buy";

const STATUS_KEY = { CREATED: "passes.statusCREATED", PAID: "passes.statusPAID", FAILED: "passes.statusFAILED", REFUNDED: "passes.statusREFUNDED" } as const;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("plans.pageTitle") };
}

/**
 * YOUR PLAN (16 October 2026; payment since 17 October, src/lib/pass-orders.ts, decision 0006): the plans this account
 * holds and until when; each pass it may buy — for oneself by the session's role, or a guardian for each child under
 * eighteen — with the period, the plan's price, the GST on it and the total, and Pay, which opens the company's
 * gateway in the seat flow's panel; "Ask your parent" in place of Pay for a pupil under eighteen; the passes bought
 * with their invoices; and what each plan includes. The plan card's Subscribe leads here (?plan=, and ?child= for a
 * guardian's child).
 */
export default async function YourPlanPage({ searchParams }: { searchParams: Promise<{ plan?: string; child?: string }> }) {
  const ctx = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const params = await searchParams;
  const asked = personPlanSchema.safeParse(params.plan);
  const overview = await passOverview(ctx);
  const orders = await myPassOrders(ctx);
  const cards = await Promise.all(PERSON_PLANS.map((code) => planForCard(code)));
  const day = (iso: string | Date) => formatInZone(new Date(iso), "Asia/Kolkata", { dateStyle: "medium" }, locale);
  // A window's end is an instant; the last day held is the day before it when it ends at midnight.
  const lastDay = (iso: string) => day(new Date(new Date(iso).getTime() - 1));
  const money = (paise: number) => formatPaise(paise, locale, { always: true });
  const highlighted = (o: PassOffer) => (params.child ? o.holder.studentMembershipId === params.child : asked.success && asked.data === o.plan);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("plans.pageTitle")} description={t("plans.pageIntro")} back={{ href: "/account", label: t("nav.account") }} />

      <Card data-testid="your-plan-now">
        <CardHeader title={t("plans.yourPlanTitle")} />
        <CardBody>
          {overview.held.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("plans.yourPlanNone")}</p>
          ) : (
            <ul className="space-y-1">
              {overview.held.map((h) => (
                <li key={h.plan} className="text-sm text-fg">
                  {t("plans.yourPlanUntil", { name: t(PLAN_NAME_KEY[h.plan]), date: lastDay(h.validTo) })}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <section className="space-y-3" aria-labelledby="buy-heading" data-testid="pass-offers">
        <h2 id="buy-heading" className="text-lg font-semibold text-fg">
          {t("passes.buyTitle")}
        </h2>
        <p className="text-sm text-fg-muted">{t("passes.buyIntro")}</p>
        {overview.offers.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("passes.noOffers")}</p>
        ) : (
          <ul className="space-y-3">
            {overview.offers.map((o) => (
              <li key={`${o.plan}-${o.holder.userId}`}>
                <Card data-testid={`pass-offer-${o.plan}`} data-buy={o.buy} className={highlighted(o) ? "border-accent" : undefined}>
                  <CardHeader title={t(PLAN_NAME_KEY[o.plan])} description={o.holder.self ? t("passes.forYou") : t("passes.forChild", { name: o.holder.name })} />
                  <CardBody className="space-y-3">
                    {o.holdsUntil && <p className="text-sm text-fg">{t("passes.extendsFrom", { date: lastDay(o.holdsUntil) })}</p>}
                    {o.buy === "PAY" && (
                      <>
                        <p className="text-xs text-fg-subtle">{t("passes.gstNote", { percent: overview.gstPercent })}</p>
                        <BuyPass offer={o} />
                      </>
                    )}
                    {o.buy === "ASK_GUARDIAN" && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-fg">{t("passes.askTitle")}</p>
                        <AskGuardian />
                      </div>
                    )}
                    {o.buy === "ADULT_BUYS_OWN" && <p className="text-sm text-fg-muted">{t("passes.adultBuysOwn", { name: o.holder.name })}</p>}
                    {o.buy === "NOT_ASKED" && <p className="text-sm text-fg-muted">{t("passes.notAsked")}</p>}
                    {o.buy === "NOT_ON_SALE" && <p className="text-sm text-fg-muted">{t("passes.notOnSale")}</p>}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card data-testid="pass-orders">
        <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={t("passes.ordersTitle")} />
        <CardBody>
          {orders.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("passes.ordersNone")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-start justify-between gap-3 py-3" data-testid="pass-order" data-status={o.status}>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
                      <span className="font-medium">{t(o.period === "MONTH" ? "passes.titleMonth" : "passes.titleYear", { plan: t(PLAN_NAME_KEY[o.plan]) })}</span>
                      {o.holderUserId !== ctx.user.id && <span className="text-fg-muted">{t("passes.orderFor", { name: o.holderName })}</span>}
                      <Badge size="sm" tone={o.status === "PAID" ? "ok" : o.status === "FAILED" ? "danger" : "neutral"}>
                        {t(STATUS_KEY[o.status])}
                      </Badge>
                    </p>
                    <p className="text-xs tabular-nums text-fg-subtle">
                      {money(o.totalPaise)}
                      {o.validFrom && o.validTo ? ` · ${t("passes.orderWindow", { from: day(o.validFrom), to: lastDay(o.validTo) })}` : ""}
                    </p>
                  </div>
                  {o.invoiceNumber && o.payerUserId === ctx.user.id && (
                    <a href={`/api/v1/account/pass/orders/${encodeURIComponent(o.id)}/invoice`} target="_blank" rel="noopener" className="text-sm font-semibold text-accent-strong underline underline-offset-2" data-testid="pass-invoice">
                      {t("passes.invoice")} {o.invoiceNumber}
                    </a>
                  )}
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
                    {overview.held.some((h) => h.plan === c.code) && (
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
