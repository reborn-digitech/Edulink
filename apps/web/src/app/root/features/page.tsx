import type { Metadata } from "next";
import { requireSuperuser } from "@/lib/tenancy";
import { listFeatures } from "@/lib/platform-features";
import { FEATURE_META } from "@/lib/feature-meta";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureSwitch } from "./switch";
// plans (16 Oct 2026)
import { formatPaise } from "@edulink/i18n";
import { operatorEntitlementsQuerySchema } from "@edulink/contracts";
import { listEntitlements, listPersonPlans, PLAN_NAME_KEY, PLAN_WHO_KEY, EXPIRING_SOON_DAYS } from "@/lib/person-plans";
import { formatInZone } from "@/lib/dates";
import { getLocale } from "@/lib/i18n/server";
import { fieldClass } from "@/components/ui/field-class";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { GrantForm, PlanPrices, RevokeButton } from "./plans";
// end plans

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("platformFeatures.title") };
}

/**
 * THE PLATFORM'S FEATURE SWITCHES (the owner's ask of 15 October 2026): one row per feature with its name and
 * what it is, Running or Off, when and by whom it was last switched, one count that explains it, and the
 * switch. Every feature is off until switched on here; switching off deletes nothing. The operator's alone:
 * the app admin's desk has no such page. The library is src/lib/platform-features.ts.
 */
export default async function FeaturesPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const session = await requireSuperuser();
  const t = await getT();
  const relative = await getRelativeTime();
  const features = await listFeatures(session);
  // plans (16 Oct 2026): the plans sold per person, the grant, and one person's entitlements by email.
  const locale = await getLocale();
  const day = (iso: string) => formatInZone(new Date(iso), "Asia/Kolkata", { dateStyle: "medium" }, locale);
  const plans = await listPersonPlans(session);
  const asked = operatorEntitlementsQuerySchema.safeParse({ email: (await searchParams).email ?? "" });
  const lookup = asked.success ? await listEntitlements(session, asked.data.email) : null;
  // end plans

  return (
    <div className="space-y-5">
      <PageHeader title={t("platformFeatures.title")} description={t("platformFeatures.intro")} />
      <ul className="space-y-3" data-testid="platform-features">
        {features.map((f) => {
          const meta = FEATURE_META[f.code];
          const changed = f.changedAt
            ? f.changedByName
              ? t("platformFeatures.changedBy", { when: relative(new Date(f.changedAt)), name: f.changedByName })
              : t("platformFeatures.changedAt", { when: relative(new Date(f.changedAt)) })
            : t("platformFeatures.neverChanged");
          return (
            <li key={f.code}>
              <Card data-testid={`feature-${f.code}`} data-on={f.enabled ? "yes" : "no"}>
                <CardBody className="flex flex-wrap items-start justify-between gap-3 pt-5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-fg">{t(meta.nameKey)}</span>
                      <Badge size="sm" tone={f.enabled ? "ok" : "neutral"}>
                        {f.enabled ? t("platformFeatures.running") : t("platformFeatures.off")}
                      </Badge>
                    </p>
                    <p className="text-sm text-fg-muted">{t(meta.whatKey)}</p>
                    <p className="text-sm text-fg">{t(meta.countKey, { count: f.count.toLocaleString() })}</p>
                    <p className="text-xs text-fg-subtle">{changed}</p>
                  </div>
                  <FeatureSwitch code={f.code} on={f.enabled} />
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-fg-subtle">{t("platformFeatures.countNote")}</p>

      {/* plans (16 Oct 2026): the plans sold per person (src/lib/person-plans.ts, decision 0006). */}
      <section className="space-y-3" aria-labelledby="plans-heading" data-testid="person-plans">
        <h2 id="plans-heading" className="text-lg font-semibold text-fg">
          {t("plans.sectionTitle")}
        </h2>
        <p className="text-sm text-fg-muted">{t("plans.sectionIntro")}</p>
        <ul className="space-y-3">
          {plans.map((p) => (
            <li key={p.code}>
              <Card data-testid={`plan-${p.code}`} data-active={p.active ? "yes" : "no"}>
                <CardBody className="space-y-3 pt-5">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-fg">{t(PLAN_NAME_KEY[p.code])}</span>
                    <Badge size="sm" tone={p.active ? "ok" : "neutral"}>
                      {p.active ? t("plans.active") : t("plans.inactive")}
                    </Badge>
                  </p>
                  <p className="text-sm text-fg-muted">{t(PLAN_WHO_KEY[p.code])}</p>
                  <p className="text-sm text-fg">{p.features.map((f) => t(FEATURE_META[f].nameKey)).join(" · ")}</p>
                  <p className="text-sm text-fg">
                    {t("plans.pricesNow", { monthly: formatPaise(p.pricePaise, locale), yearly: formatPaise(p.yearlyPricePaise, locale) })}
                  </p>
                  <p className="text-sm text-fg">{t("plans.holders", { count: p.entitledNow.toLocaleString(), soon: p.expiringSoon.toLocaleString(), days: EXPIRING_SOON_DAYS })}</p>
                  <p className="text-xs text-fg-subtle">
                    {p.updatedAt
                      ? p.updatedByName
                        ? t("platformFeatures.changedBy", { when: relative(new Date(p.updatedAt)), name: p.updatedByName })
                        : t("platformFeatures.changedAt", { when: relative(new Date(p.updatedAt)) })
                      : t("platformFeatures.neverChanged")}
                  </p>
                  <PlanPrices code={p.code} pricePaise={p.pricePaise} yearlyPricePaise={p.yearlyPricePaise} active={p.active} />
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="grant-heading" id="entitlements">
        <h2 id="grant-heading" className="text-lg font-semibold text-fg">
          {t("plans.grantTitle")}
        </h2>
        <Card>
          <CardBody className="pt-5">
            <GrantForm email={asked.success ? asked.data.email : ""} />
          </CardBody>
        </Card>
        <Card data-testid="entitlement-lookup">
          <CardHeader title={t("plans.lookupTitle")} description={t("plans.lookupIntro")} />
          <CardBody className="space-y-4">
            <form method="get" action="/root/features#entitlements" className="flex flex-wrap items-end gap-2">
              <label className="min-w-0 flex-1 space-y-1">
                <span className="text-sm font-medium text-fg">{t("plans.grantEmail")}</span>
                <input name="email" type="email" required autoCapitalize="none" maxLength={254} defaultValue={asked.success ? asked.data.email : ""} className={fieldClass()} />
              </label>
              <Button type="submit" variant="secondary">
                {t("plans.lookupButton")}
              </Button>
            </form>
            {lookup && !lookup.person && <p className="text-sm text-fg-muted">{t("plans.lookupNobody")}</p>}
            {lookup?.person && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-fg">
                  {lookup.person.name} · {lookup.person.email}
                </p>
                {lookup.entitlements.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t("plans.lookupNone")}</p>
                ) : (
                  <ul className="divide-y divide-border" data-testid="entitlements">
                    {lookup.entitlements.map((e) => (
                      <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
                            <span className="font-medium">{t(FEATURE_META[e.feature].nameKey)}</span>
                            {e.planCode && <span className="text-fg-muted">{t(PLAN_NAME_KEY[e.planCode])}</span>}
                            <Badge size="sm" tone={e.live ? "ok" : "neutral"}>
                              {e.revokedAt ? t("plans.stateRevoked") : e.live ? t("plans.stateLive") : t("plans.stateNotLive")}
                            </Badge>
                          </p>
                          <p className="text-xs text-fg-subtle">
                            {t("plans.window", { from: day(e.validFrom), to: day(e.validTo) })}
                            {e.grantedByName ? ` · ${t("plans.grantedBy", { name: e.grantedByName })}` : ""}
                          </p>
                          {e.note && <p className="text-xs text-fg-muted">{e.note}</p>}
                        </div>
                        {!e.revokedAt && new Date(e.validTo) > new Date() && <RevokeButton id={e.id} />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
