import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCapIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { promotionPlan } from "@/lib/promotion";
import { currentAcademicYear } from "@/lib/academic-year";
import { EmptyState } from "@/components/ui/states";
import { PromotionPlanner } from "./planner";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

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
  const year = ctx.schoolId ? await currentAcademicYear(ctx.schoolId) : null;

  return (
    <div className="space-y-5">
      <div>
        <PageHeader title={t("promotion.title")} description={t("promotion.intro")} back={{ href: "/admin/classes", label: t("nav.classes") }} />
        {/* The calendar's close-year panel links here; this is the link back.

            The two are separate doors on purpose — moving children is a
            decision, filing the year is another — but an admin who only finds
            one of them leaves every pupil's Past years empty, which is exactly
            how this sentence got written. */}
        {year && (
          <p className="mt-1 max-w-prose text-sm text-fg-muted">
            {t("promotion.closeYearNote", { name: year.name })}{" "}
            <Link href="/admin/calendar" className="font-medium text-accent-strong hover:underline">
              {t("promotion.calendarLink")}
            </Link>
          </p>
        )}
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
