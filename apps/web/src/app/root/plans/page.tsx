import { TagIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listPlans } from "@/lib/plans";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { PlanForm, PlanRowCard } from "./plan-form";

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

      <Card>
        <CardHeader icon={<TagIcon weight="duotone" className="size-5" />} title={t("root.planAdd")} description={t("root.planCapHint")} />
        <CardBody>
          <PlanForm />
        </CardBody>
      </Card>
    </div>
  );
}
