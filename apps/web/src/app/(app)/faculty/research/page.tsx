import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TeacherResearch } from "@/components/iqac/teacher-research";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.navResearch"), robots: { index: false, follow: false } };
}

/** My research, my record and my course feedback (module IQAC, 4 Oct 2026), under the faculty home. */
export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  return <TeacherResearch role="FACULTY" back="/faculty/research" ok={ok} error={error} />;
}
