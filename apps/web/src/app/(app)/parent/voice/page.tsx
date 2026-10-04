import type { Metadata } from "next";
import { requireParent } from "@/lib/tenancy";
import { myVoice } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { IqacFlash, SurveyForms } from "@/components/iqac/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.navParentVoice"), robots: { index: false, follow: false } };
}

/**
 * A guardian's surveys (G-5, 4 Oct 2026): the PARENT surveys open at each
 * college a child of theirs is at, with IQAC on, answered once and anonymous.
 * Before, a parent survey could only be typed in by the desk from paper.
 */
export default async function ParentVoicePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireParent();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { ok, error } = await searchParams;
  const v = await myVoice(ctx);
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.navParentVoice")} description={t("iqac.parentVoiceIntro")} />
      <IqacFlash ok={ok} error={error} />
      <SurveyForms t={t} surveys={v.surveys} back="/parent/voice" locale={locale} />
    </div>
  );
}
