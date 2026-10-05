import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { visitDetail } from "@/lib/peer-visits";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { VisitFileView } from "@/components/peer-visits/visit-pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("peerVisit.title"), robots: { index: false, follow: false } };
}

/** One visit's file (R-2, 5 Oct 2026): the SAR pack, the schedule and the evidence index. */
export default async function VisitPage({ params }: { params: Promise<{ visitId: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale, { visitId }] = await Promise.all([getT(), getLocale(), params]);
  const back = { href: "/iqac/visits", label: t("peerVisit.title") };
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("peerVisit.title")} back={back} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(await institutionKindOf(ctx.schoolId))} />
      </div>
    );
  }
  const v = await visitDetail(ctx, visitId);
  return (
    <div className="space-y-5">
      <PageHeader title={v.title} description={t("peerVisit.fileIntro")} back={back} />
      <VisitFileView v={v} base="/iqac/visits" t={t} locale={locale} />
    </div>
  );
}
