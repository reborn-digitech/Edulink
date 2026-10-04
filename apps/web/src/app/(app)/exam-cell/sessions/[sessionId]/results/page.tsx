import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { sessionView } from "@/lib/exam-cell";
import { resultsView } from "@/lib/exam-cell-marks";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CellOff, Hidden, Labelled, RUN_STATUS_KEY, SessionFrame, TermResultCard, inputClass, when } from "@/components/exam-cell/parts";
import { publishRunAction, runResultsAction } from "../../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.tabResults"), robots: { index: false, follow: false } };
}

/**
 * The results: compute a run under the schemes, read it, publish it (the
 * one before is superseded and kept), and cut the file for the university.
 * After publication a run needs a reason: a change is a new run.
 */
export default async function ResultsPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ run?: string; ok?: string; error?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { sessionId } = await params;
  const { run, ok, error } = await searchParams;
  const s = await sessionView(ctx, sessionId);
  const results = await resultsView(ctx, s.id, s.runs.some((r) => r.id === run) ? run : undefined);
  const back = `/exam-cell/sessions/${s.id}/results`;
  return (
    <SessionFrame t={t} session={s} current="results" autonomous={s.autonomous} ok={ok} error={error}>
      <Card>
        <CardHeader title={t("examCell.runsTitle")} description={t("examCell.runsHint")} />
        <CardBody className="space-y-3">
          {s.runs.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link href={`${back}?run=${r.id}`} className="font-medium text-accent-strong hover:underline">
                {t("examCell.runNumber", { number: r.number })}
              </Link>
              <span className="text-fg-muted">
                {when(r.computedAt, locale)} · {t("examCell.runSummary", { students: r.students, passed: r.passed, atkt: r.atkt, failed: r.failed, rate: r.passRatePercent })}
                {r.reason ? ` · ${r.reason}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone={r.status === "PUBLISHED" ? "ok" : r.status === "DRAFT" ? "accent" : "neutral"}>{t(RUN_STATUS_KEY[r.status]!)}</Badge>
                {s.canWrite && r.status === "DRAFT" ? (
                  <form action={publishRunAction}>
                    <Hidden fields={{ sessionId: s.id, runId: r.id, back }} />
                    <Button type="submit" size="sm">
                      {t("examCell.publish")}
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
          {s.canWrite ? (
            <form action={runResultsAction} className="flex flex-wrap items-end gap-2">
              <Hidden fields={{ sessionId: s.id, back }} />
              {s.published ? (
                <Labelled label={t("examCell.rerunReason")} className="min-w-64 flex-1">
                  <input name="reason" required maxLength={300} className={inputClass} />
                </Labelled>
              ) : null}
              <Button type="submit" variant="secondary">
                {t("examCell.runResults")}
              </Button>
            </form>
          ) : null}
          {results.run ? (
            <Button asChild variant="ghost">
              <Link href={`/exam-cell/sessions/${s.id}/export?kind=results&runId=${results.run.id}`}>{t("examCell.exportResults")}</Link>
            </Button>
          ) : null}
        </CardBody>
      </Card>
      {results.rows.map((r) => (
        <TermResultCard key={r.studentMembershipId} result={r} t={t} title={[r.name, r.code].filter(Boolean).join(" · ")} />
      ))}
    </SessionFrame>
  );
}
