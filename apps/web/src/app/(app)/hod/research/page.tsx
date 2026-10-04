import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TeacherResearch } from "@/components/iqac/teacher-research";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.navDeptResearch"), robots: { index: false, follow: false } };
}

/** The department's research, activities and course feedback (module IQAC, 4 Oct 2026), under the HOD's home. */
export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  return <TeacherResearch role="HOD" back="/hod/research" ok={ok} error={error} />;
}
