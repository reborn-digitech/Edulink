import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listPlans } from "@/lib/plans";
import { listPartners } from "@/lib/subscriptions";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { OnboardForm } from "./onboard-form";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.onboardMeta"), robots: { index: false, follow: false } };
}

/** The guided flow: one form, one call (onboardSchool), which reuses the create, assign-plan and invite doors. */
export default async function OnboardPage() {
  const t = await getT();
  const session = await requireSuperuser();
  const [plans, partners] = await Promise.all([listPlans(session), listPartners(session)]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/root" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("root.dashboard")}
      </Link>
      <PageHeader title={t("root.onboardCta")} description={t("root.onboardIntro")} />
      <OnboardForm plans={plans.map((p) => ({ id: p.id, code: p.code, name: p.name }))} partners={partners.map((p) => ({ id: p.id, name: p.name, percentTenths: p.percentTenths }))} />
    </div>
  );
}
