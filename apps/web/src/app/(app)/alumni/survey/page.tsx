import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { myVoice } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash, SurveyForms } from "@/components/iqac/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.alumniSurveyTitle"), robots: { index: false, follow: false } };
}

/** The alumni survey NAAC asks for (module IQAC, 4 Oct 2026), under the alumnus's home: anonymous, once per survey. */
export default async function AlumniSurveyPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ALUMNUS");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { ok, error } = await searchParams;
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.alumniSurveyTitle")} />
        <ModuleOff module="IQAC" t={t} college />
      </div>
    );
  }
  const v = await myVoice(ctx);
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.alumniSurveyTitle")} description={t("iqac.alumniSurveyIntro")} />
      <IqacFlash ok={ok} error={error} />
      <SurveyForms t={t} surveys={v.surveys} back="/alumni/survey" locale={locale} />
    </div>
  );
}
