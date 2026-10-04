import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { myExams } from "@/lib/exam-cell-after";
import { CellOff } from "@/components/exam-cell/parts";
import { MyExamsView } from "@/components/exam-cell/mine";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.mineTitle"), robots: { index: false, follow: false } };
}

/** A college student's exams: the form, hall ticket and seats, results with revaluation, grade cards and transcript, backlogs and credits. */
export default async function StudentExamsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("STUDENT");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { ok, error } = await searchParams;
  return <MyExamsView data={await myExams(ctx)} t={t} locale={locale} back="/student/exams" ok={ok} error={error} title={t("examCell.mineTitle")} />;
}
