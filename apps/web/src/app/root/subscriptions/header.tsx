import Link from "next/link";
import { RocketLaunchIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { getT } from "@/lib/i18n/server";

/** The console's two tabs under one header (§2.1, §2.2): Schools and Prices, each its own address. */
export async function SubscriptionsHeader({ current }: { current: "schools" | "prices" }) {
  const t = await getT();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("subs.title")} description={t("subs.intro")} />
        <Button asChild icon={<RocketLaunchIcon weight="bold" />}>
          <Link href="/root/onboard">{t("root.onboardCta")}</Link>
        </Button>
      </div>
      <TabBar
        ariaLabel={t("subs.tabsLabel")}
        current={current}
        tabs={[
          { key: "schools", href: "/root/subscriptions", label: t("subs.tabSchools") },
          { key: "prices", href: "/root/subscriptions/prices", label: t("subs.tabPrices") },
        ]}
      />
    </div>
  );
}
