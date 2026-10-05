import type { Metadata } from "next";
import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { reportCardConfigView } from "@/lib/report-card-config";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { reportCardDefaultLabels } from "@/lib/certificate-names";
import { RulesForm } from "./rules-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("reportCardConfig.metaTitle") };
}

/**
 * The office's report card rules: the scale, the co-scholastic areas, the
 * weights and the printed layout, one document read by every card the
 * school generates from now on. A card already issued keeps the rules it
 * was built with, which is why the preview link goes to the newest one
 * published — the office can see what the last set looked like before
 * changing what the next set will.
 */
export default async function ReportCardRulesPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();

  const [view, school, newest] = await Promise.all([
    reportCardConfigView(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { name: true, locale: true } }),
    db.reportCard.findFirst({ where: { schoolId: ctx.schoolId, status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, select: { id: true } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("reportCardConfig.title")}
        description={t("reportCardConfig.intro")}
        actions={
          newest ? (
            <Button asChild variant="secondary" size="sm" icon={<ArrowSquareOutIcon weight="bold" />}>
              <Link href={`/report-cards/${newest.id}?from=${encodeURIComponent("/admin/report-cards")}`}>{t("reportCardConfig.preview")}</Link>
            </Button>
          ) : undefined
        }
      />
      {/* No key on the form: a save refreshes the page, and what the office has typed since must survive that. */}
      <RulesForm view={view} schoolName={school.name} schoolLocale={school.locale ?? "en"} readOnly={ctx.role !== "ADMIN"} defaultLabels={reportCardDefaultLabels(t)} />
    </div>
  );
}
