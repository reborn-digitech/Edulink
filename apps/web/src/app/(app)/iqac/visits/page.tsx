import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { listVisits } from "@/lib/peer-visits";
import { schoolZone } from "@/lib/school-zone";
import { todayKey } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { VisitListView } from "@/components/peer-visits/visit-pages";
import { DeskNav } from "@/components/iqac/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("peerVisit.title"), robots: { index: false, follow: false } };
}

/** The peer-team visits (R-2, 5 Oct 2026): each visit's file, and the form for a new one. */
export default async function VisitsPage() {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("peerVisit.title")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(await institutionKindOf(ctx.schoolId))} />
      </div>
    );
  }
  const [list, zone] = await Promise.all([listVisits(ctx), schoolZone(ctx.schoolId)]);
  const today = todayKey(zone);
  // The academic year's first calendar year: from June it is this year's.
  const thisYear = Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 6 ? 1 : 0);
  return (
    <div className="space-y-5">
      <PageHeader title={t("peerVisit.title")} description={t("peerVisit.intro")} back={{ href: "/iqac", label: t("peerVisit.backIqac") }} />
      <DeskNav t={t} here="/iqac/visits" />
      <VisitListView list={list} base="/iqac/visits" t={t} locale={locale} thisYear={thisYear} />
    </div>
  );
}
