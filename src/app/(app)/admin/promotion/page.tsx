import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, GraduationCapIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { promotionPlan } from "@/lib/promotion";
import { EmptyState } from "@/components/ui/states";
import { PromotionPlanner } from "./planner";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("promotion.metaTitle") };
}

/**
 * The year-end move, as one page: every class on the left, where it goes on
 * the right. Reached from the calendar's year panel and the classes page —
 * it is a once-a-year door, not a navigation item.
 */
export default async function PromotionPage() {
  const ctx = await requireRole("ADMIN");
  const t = await getT();
  const plan = await promotionPlan(ctx);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/classes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("nav.classes")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("promotion.title")}</h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("promotion.intro")}</p>
      </div>

      {plan.length === 0 ? (
        <EmptyState
          icon={<GraduationCapIcon weight="duotone" className="size-8" />}
          title={t("promotion.noClasses")}
          description={t("promotion.noClassesBody")}
        />
      ) : (
        <PromotionPlanner plan={plan} />
      )}
    </div>
  );
}
