import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listActivities, researchRegister } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash } from "@/components/iqac/parts";
import { ActivityRegister, ResearchRegister } from "@/components/iqac/registers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.registersTitle"), robots: { index: false, follow: false } };
}

/** The college's research and activity registers (module IQAC, 4 Oct 2026), the desk's to keep and the principal's to read. */
export default async function RegistersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.registersTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const [research, activities, people] = await Promise.all([
    researchRegister(ctx),
    listActivities(ctx),
    db.membership.findMany({ where: { schoolId: ctx.schoolId, role: { notIn: ["STUDENT", "ALUMNUS", "PARENT"] }, status: "ACTIVE", leftAt: null }, orderBy: { user: { name: "asc" } }, select: { id: true, role: true, user: { select: { name: true } } } }),
  ]);
  const back = "/iqac/registers";
  const desk = ctx.role !== "PRINCIPAL";
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.registersTitle")} description={t("iqac.researchIntro")} />
      <DeskNav t={t} here={back} />
      <IqacFlash ok={ok} error={error} />
      <ResearchRegister t={t} back={back} items={research.items} perTeacher={research.perTeacher} scope={research.scope} teachers={people.filter((p) => p.role === "FACULTY" || p.role === "HOD").map((p) => ({ id: p.id, name: p.user.name }))} canRemoveAll={desk} canAdd={desk} />
      <ActivityRegister t={t} back={back} items={activities.items} canEdit={activities.canEdit} staff={people.map((p) => ({ id: p.id, name: p.user.name }))} locale={locale} />
    </div>
  );
}
