import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getT } from "@/lib/i18n/server";
import { formsCsv, sessionView } from "@/lib/exam-cell";
import { resultsCsv } from "@/lib/exam-cell-marks";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CellOff, SessionFrame } from "@/components/exam-cell/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.exportTitle"), robots: { index: false, follow: false } };
}

/**
 * The file for the university, cut once per visit (and audited): the exam
 * forms, or a run's results, as CSV — shown to copy and offered to save.
 * File headings are the university's and stay in English.
 */
export default async function ExportPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ kind?: string; runId?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, on, kind] = await Promise.all([getT(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { sessionId } = await params;
  const { kind: which, runId } = await searchParams;
  const s = await sessionView(ctx, sessionId);
  const file = which === "results" ? await resultsCsv(ctx, sessionId, runId) : await formsCsv(ctx, sessionId);
  return (
    <SessionFrame t={t} session={s} current={which === "results" ? "results" : "forms"} autonomous={s.autonomous}>
      <Card>
        <CardHeader title={which === "results" ? t("examCell.exportResults") : t("examCell.exportForms")} description={t("examCell.exportHint")} action={<Button asChild variant="secondary"><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(file.csv)}`} download={file.name}>{t("examCell.download")}</a></Button>} />
        <CardBody>
          <textarea readOnly value={file.csv} aria-label={t("examCell.exportTitle")} className="h-80 w-full rounded-[var(--radius-md)] border border-border bg-surface p-3 font-mono text-xs" />
        </CardBody>
      </Card>
    </SessionFrame>
  );
}
