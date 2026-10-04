import { TagIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listPlans } from "@/lib/plans";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { PlanForm, PlanRowCard } from "./plan-form";
import { AddTierButton } from "./tier-button";
import { COLLEGE_TIERS } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { getLocale } from "@/lib/i18n/server";
import { GraduationCapIcon } from "@phosphor-icons/react/ssr";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.plansMeta"), robots: { index: false, follow: false } };
}

/**
 * The plans the operator offers. A plan is a name, three caps and a price
 * that is RECORDED here and collected nowhere (decision 0003): the page says
 * so in its own words. A school is put on a plan from its own page, so this
 * page lists how many are on each and stops a plan with schools on it from
 * being removed.
 */
export default async function PlansPage() {
  const t = await getT();
  const session = await requireSuperuser();
  const plans = await listPlans(session);
  const locale = await getLocale();

  return (
    <div className="space-y-5">
      <PageHeader title={t("root.plans")} description={t("root.plansIntro")} />

      {plans.length === 0 ? (
        <EmptyState icon={<TagIcon weight="duotone" className="size-8" />} title={t("root.noPlansYet")} description={t("root.noPlansBody")} />
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanRowCard plan={{ ...plan, createdAt: plan.createdAt.toISOString() }} />
            </li>
          ))}
        </ul>
      )}

      {/* The college tiers (4 Oct 2026): coded prices a student a year, offered to a college only; one plan row each, added once. */}
      <Card>
        <CardHeader icon={<GraduationCapIcon weight="duotone" className="size-5" />} title={t("operatorCollege.tiersTitle")} description={t("operatorCollege.tiersIntro")} />
        <CardBody>
          <ul className="space-y-2">
            {COLLEGE_TIERS.map((tier) => {
              const listed = plans.find((p) => p.code === tier.code);
              return (
                <li key={tier.code} className="flex flex-wrap items-center justify-between gap-2 rounded-[--radius-md] border border-border px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium text-fg">{t(tier.code === "college-affiliated" ? "operatorCollege.tierAffiliated" : "operatorCollege.tierAutonomous")}</span>
                    <span className="block text-xs text-fg-muted">{t("operatorCollege.tierPrice", { amount: formatPaise(tier.perStudentYearPaise, locale) })}</span>
                  </span>
                  {listed ? <span className="text-xs text-fg-muted">{t("operatorCollege.tierListed", { code: tier.code, count: listed.schools })}</span> : <AddTierButton code={tier.code} />}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<TagIcon weight="duotone" className="size-5" />} title={t("root.planAdd")} description={t("root.planCapHint")} />
        <CardBody>
          <PlanForm />
        </CardBody>
      </Card>
    </div>
  );
}
