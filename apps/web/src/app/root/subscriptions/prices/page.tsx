import Link from "next/link";
import { COLLEGE_TIERS, PLAN_FEATURES, PREMIUM_PLANS } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireSuperuser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { listSubscriptions, readOfferAnswer } from "@/lib/school-terms";
import { activePlans, PLAN_NAME_KEY } from "@/lib/person-plans";
import { FEATURE_META } from "@/lib/feature-meta";
import { partCell } from "@/lib/terms-sentences";
import { todayKey } from "@/lib/dates";
import { consoleFmt } from "../fmt";
import { SubscriptionsHeader } from "../header";
import { PricesForm } from "./prices-form";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("subs.pricesMeta"), robots: { index: false, follow: false } };
}

/**
 * THE PRICES TAB (/root/subscriptions/prices; decision 0010, the brief's §2.2, phase 5): our offer for all schools, both parts
 * a student a year before GST, the free months for a new school and the onboarding ticks, changed through Review change (the
 * server's sentence, rule 9) and a reason; beside it what the offer means (how the live schools stand against it), who is
 * asked for a plan, the schools on their own terms, and the recent changes with Put back.
 */
export default async function PricesPage() {
  const t = await getT();
  const f = await consoleFmt();
  const session = await requireSuperuser();
  const [answer, asked, list] = await Promise.all([readOfferAnswer(session), activePlans(), listSubscriptions(session, {})]);
  const g = answer.groups;
  const groups: string[] = [
    g.follow === 1 ? t("subs.groupFollowOne") : t("subs.groupFollowMany", { count: g.follow }),
    g.ownDiscount === 1 ? t("subs.groupOwnDiscountOne") : t("subs.groupOwnDiscountMany", { count: g.ownDiscount }),
    g.ownPrice === 1 ? t("subs.groupOwnPriceOne") : t("subs.groupOwnPriceMany", { count: g.ownPrice }),
    g.colleges === 1 ? t("subs.groupCollegesOne") : t("subs.groupCollegesMany", { count: g.colleges }),
    g.notSet === 1 ? t("subs.groupNotSetOne") : t("subs.groupNotSetMany", { count: g.notSet }),
    g.premiumOn === 1 ? t("subs.groupPremiumOne") : t("subs.groupPremiumMany", { count: g.premiumOn }),
  ];
  const names = (codes: readonly string[]) => codes.map((c) => t(FEATURE_META[c as keyof typeof FEATURE_META].nameKey)).join(" · ");
  const teachersAlso = PLAN_FEATURES.TEACHER.filter((c) => !PLAN_FEATURES.STUDENT.includes(c));
  const tier = (code: string) => f.money(COLLEGE_TIERS.find((x) => x.code === code)?.perStudentYearPaise ?? 0);
  const own = list.rows.filter((r) => r.termsSet && (r.subscription.mode !== "OURS" || r.premium.mode !== "OURS"));
  const offer = answer.offer;

  return (
    <div className="space-y-5" data-testid="subscriptions-prices">
      <SubscriptionsHeader current="prices" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <PricesForm
          offer={{ subscription: offer.subscription, premium: offer.premium, freeMonths: offer.freeMonths, studentsByDefault: offer.studentsByDefault, teachersByDefault: offer.teachersByDefault }}
          updatedAt={offer.updatedAt}
          starting={offer.starting}
          asked={{ students: asked.has("STUDENT"), teachers: asked.has("TEACHER") }}
          // The day of a change on the operator's own clock, India's (the review of phase 5, A5 and B9).
          recent={answer.recent.map((r) => ({ key: r.at, date: f.day(todayKey("Asia/Kolkata", new Date(r.at))), reason: r.reason, before: { subscription: r.before.subscription, premium: r.before.premium, freeMonths: r.before.freeMonths, studentsByDefault: r.before.studentsByDefault, teachersByDefault: r.before.teachersByDefault } }))}
          lines={{
            students: t("subs.premiumStudentsGet", { features: names(PLAN_FEATURES.STUDENT) }),
            teachers: t("subs.premiumTeachersGet", { features: names(teachersAlso) }),
            colleges: t("subs.collegesLine", { affiliated: tier("college-affiliated"), autonomous: tier("college-autonomous") }),
          }}
        />
        <div className="space-y-4">
          <Card>
            <CardHeader title={t("subs.whatItMeans")} />
            <CardBody>
              <ul className="space-y-1 text-sm text-fg">
                {groups.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("subs.whoAskedTitle")} />
            <CardBody className="space-y-1 text-sm text-fg">
              {PREMIUM_PLANS.map((plan) => (
                <p key={plan}>{t(asked.has(plan) ? "subs.planAsked" : "subs.planNotAsked", { plan: t(PLAN_NAME_KEY[plan] as TranslationKey) })}</p>
              ))}
              <Link href="/root/features#plans-heading" className="text-xs font-semibold text-accent-strong hover:underline">
                {t("subs.whoIsAsked")}
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("subs.ownTermsTitle")} />
            <CardBody>
              {own.length === 0 ? (
                <p className="text-sm text-fg-muted">{t("subs.ownTermsNone")}</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {own.map((r) => (
                    <li key={r.schoolId}>
                      <Link href={`/root/${r.schoolId}#subscription`} className="font-medium text-fg hover:underline">
                        {r.name}
                      </Link>
                      {/* Both parts: a school may be on its own terms for premium alone (the reader). */}
                      <span className="block text-xs text-fg-muted">
                        {t("subs.partSubscription")}: {r.subscriptionFigure ? partCell(f, r.subscriptionFigure) : t("operatorCollege.noTierChosen")}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {t("subs.partPremium")}: {partCell(f, r.premiumFigure)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
