import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listPlans } from "@/lib/plans";
import { listPartners } from "@/lib/subscriptions";
import { readOffer } from "@/lib/school-terms";
import { activePlans } from "@/lib/person-plans";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { OnboardForm } from "./onboard-form";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.onboardMeta"), robots: { index: false, follow: false } };
}

/** The guided flow: one form, one call (onboardSchool), which reuses the create, assign-plan and invite doors; our offer and the plans asked for set the terms' chips and ticks (§2.5; C3). */
export default async function OnboardPage() {
  const t = await getT();
  const session = await requireSuperuser();
  const [plans, partners, offer, asked] = await Promise.all([listPlans(session), listPartners(session), readOffer(), activePlans()]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/root" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("root.dashboard")}
      </Link>
      <PageHeader title={t("root.onboardCta")} description={t("root.onboardIntro")} />
      <OnboardForm
        plans={plans.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        partners={partners.map((p) => ({ id: p.id, name: p.name, percentTenths: p.percentTenths }))}
        offer={{
          subscriptionPricePaise: offer.subscriptionPricePaise,
          subscriptionDiscountBps: offer.subscriptionDiscountBps,
          premiumPricePaise: offer.premiumPricePaise,
          premiumDiscountBps: offer.premiumDiscountBps,
          freeMonths: offer.freeMonths,
          studentsByDefault: offer.studentsByDefault,
          teachersByDefault: offer.teachersByDefault,
        }}
        asked={[...asked]}
        // The moment this page was served, by the server's clock: C7.8's look asks only for a school made since (C7a point 1).
        servedAt={new Date().toISOString()}
      />
    </div>
  );
}
