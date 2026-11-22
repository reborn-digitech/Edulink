import Link from "next/link";
import { BuildingsIcon, InfoIcon, StarIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { PLAN_FEATURES, PREMIUM_PLANS, isCollegeKind, subscriptionsQuerySchema } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { requireSuperuser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { listSubscriptions, readOfferAnswer } from "@/lib/school-terms";
import { activePlans } from "@/lib/person-plans";
import { featureOn } from "@/lib/platform-features";
import { FEATURE_META } from "@/lib/feature-meta";
import { notCountedLine, offerLines, partCell, premiumCell, premiumInfoLines, stateLabel, stateTone } from "@/lib/terms-sentences";
import { consoleFmt } from "./fmt";
import { SubscriptionsHeader } from "./header";
import { SchoolsTable, type SchoolRow } from "./schools-table";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("subs.meta"), robots: { index: false, follow: false } };
}

/**
 * THE SCHOOLS TAB (/root/subscriptions; decision 0010, the brief's §2.1, phase 5): every school not removed with what it pays
 * a student a year for its Shalaghar subscription, its premium switches and what premium costs it, its renewal and its state,
 * narrowed by filters kept in the address. Above it, the sentences the operator must read where the act is made (C2): a plan
 * not asked for gives every student or teacher premium's features today; a plan's feature switched off for everyone is not
 * opened by premium; schools with no terms set pay what was agreed before. And our offer for all schools, with the year
 * billed at today's prices, last count, and what that leaves out. The words are the server's (src/lib/terms-sentences.ts).
 */
export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  const f = await consoleFmt();
  const session = await requireSuperuser();
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const parsed = subscriptionsQuerySchema.safeParse({ q: one("q") || undefined, premium: one("premium"), terms: one("terms"), renewal: one("renewal") });
  const query = parsed.success ? parsed.data : {};

  const [list, offer, asked] = await Promise.all([listSubscriptions(session, query), readOfferAnswer(session), activePlans()]);
  const bundle = [...new Set(PREMIUM_PLANS.flatMap((plan) => PLAN_FEATURES[plan]))];
  const offForAll = (await Promise.all(bundle.map(async (code) => ((await featureOn(code)) ? null : code)))).filter((c): c is NonNullable<typeof c> => c !== null);
  const notAsked = PREMIUM_PLANS.filter((plan) => !asked.has(plan));
  // At most two lines above the list (C5 point 6): the plans not asked for, and the features switched off for everyone.
  const info = premiumInfoLines(f, { notAsked, offForAll: offForAll.map((code) => t(FEATURE_META[code].nameKey)) });

  const rows: SchoolRow[] = list.rows.map((r) => ({
    id: r.schoolId,
    name: r.name,
    college: isCollegeKind(r.kind),
    termsSet: r.termsSet,
    pays: r.termsSet ? (r.subscriptionFigure ? partCell(f, r.subscriptionFigure) : t("operatorCollege.noTierChosen")) : null,
    premium: premiumCell(f, r),
    students: r.premiumStudents,
    teachers: r.premiumTeachers,
    renews: r.renewsOn ? f.day(r.renewsOn) : null,
    state: stateLabel(f, r),
    tone: stateTone(r.state),
    seen: { termsSetAt: r.termsSetAt, premiumStudents: r.premiumStudents, premiumTeachers: r.premiumTeachers, subscription: r.subscription, premium: r.premium },
  }));
  const notSet = offer.groups.notSet;
  const notCounted = notCountedLine(f, offer.totals);

  return (
    <div className="space-y-5" data-testid="subscriptions-schools">
      <SubscriptionsHeader current="schools" />

      {info.length > 0 && (
        <div className="space-y-1.5 rounded-[var(--radius-md)] border border-info/30 bg-info-soft px-4 py-3 text-sm text-fg" data-testid="premium-lines">
          {info.map((line, i) => (
            <p key={line} className="flex items-start gap-2">
              <InfoIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-info" />
              <span>
                {line}
                {i === 0 && notAsked.length > 0 && (
                  <>
                    {" "}
                    <Link href="/root/features#plans-heading" className="font-semibold text-accent-strong hover:underline">
                      {t("subs.whoIsAsked")}
                    </Link>
                  </>
                )}
              </span>
            </p>
          ))}
        </div>
      )}

      {notSet > 0 && (
        <p className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-fg">
          <WarningIcon weight="bold" className="size-4 shrink-0 text-warn" />
          <span>{notSet === 1 ? t("subs.notSetOne") : t("subs.notSetMany", { count: notSet })}</span>
          <Link href="/root/subscriptions?terms=notset" className="font-semibold text-accent-strong hover:underline">
            {t("subs.showThem")}
          </Link>
        </p>
      )}

      <Card>
        <CardBody className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("subs.forAllSchools")}</p>
              {offerLines(f, offer.offer).map((line, i) => (
                <p key={line} className="flex items-center gap-1.5 text-fg">
                  {i === 0 && <BuildingsIcon weight="duotone" className="size-4 shrink-0 text-fg-muted" />}
                  {i === 1 && <StarIcon weight="duotone" className="size-4 shrink-0 text-fg-muted" />}
                  {line}
                </p>
              ))}
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/root/subscriptions/prices">{t("subs.change")}</Link>
            </Button>
          </div>
          <p className="text-sm text-fg">{t("subs.totals", { amount: f.money(offer.totals.billedYearPaise) })}</p>
          {notCounted && <p className="text-xs text-fg-muted">{notCounted}</p>}
          <details className="text-xs text-fg-muted">
            <summary className="tap inline-flex cursor-pointer items-center font-semibold text-accent-strong">{t("subs.why")}</summary>
            <p className="mt-1 leading-relaxed">{t("subs.whyBody")}</p>
          </details>
        </CardBody>
      </Card>

      <DataToolbar
        search={{ value: query.q ?? "", placeholder: t("subs.search"), label: t("subs.search") }}
        facets={[
          { showLabel: true, key: "premium", label: t("subs.filterPremium"), value: query.premium ?? "all", defaultValue: "all", options: [{ value: "all", label: t("subs.optAll") }, { value: "on", label: t("subs.optOn") }, { value: "off", label: t("subs.optOff") }] },
          {
            showLabel: true, key: "terms",
            label: t("subs.filterTerms"),
            value: query.terms ?? "all",
            defaultValue: "all",
            options: [{ value: "all", label: t("subs.optAll") }, { value: "ours", label: t("subs.optOurs") }, { value: "own", label: t("subs.optOwn") }, { value: "notset", label: t("subs.optNotSet") }],
          },
          { showLabel: true, key: "renewal", label: t("subs.filterRenewal"), value: query.renewal ?? "any", defaultValue: "any", options: [{ value: "any", label: t("subs.optAny") }, { value: "30", label: t("subs.opt30") }, { value: "passed", label: t("subs.optPassed") }] },
        ]}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        resultCount={rows.length}
      />

      {rows.length === 0 ? <p className="text-sm text-fg-muted">{t("subs.noSchools")}</p> : <SchoolsTable rows={rows} />}
    </div>
  );
}
