import Link from "next/link";
import { CaretRightIcon, ExamIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateKey } from "@/lib/dates";
import { EXAM_KIND_KEY } from "@/lib/constants";
import type { ExamMarks } from "@/lib/exams";
import { getT, getLocale } from "@/lib/i18n/server";

/**
 * One pupil's exam marks, series by series. Rendered in full on the Exams
 * page and in a compact form on the pupil's Today and the parent's overview —
 * the same component, so the three places cannot show three different totals.
 */
export async function ExamMarksCards({
  marks,
  compact = false,
  showStudent = false,
}: {
  marks: ExamMarks;
  /** Latest series only, with a link to the full page. */
  compact?: boolean;
  showStudent?: boolean;
}) {
  const t = await getT();
  const locale = await getLocale();
  const series = compact ? marks.series.slice(-1) : marks.series;
  if (series.length === 0) return null;

  return (
    <div className="space-y-3">
      {series.map((s) => {
        const marked = s.papers.filter((p) => p.marks !== null).length;
        return (
          <Card key={s.id}>
            <CardHeader
              icon={<ExamIcon weight="duotone" className="size-5" />}
              title={
                showStudent ? `${marks.studentName} · ${s.name}` : s.name
              }
              description={[t(EXAM_KIND_KEY[s.kind]), marks.className].join(" · ")}
              action={
                s.percent !== null ? (
                  <span className="text-right">
                    <span className="block text-xl font-bold tabular-nums text-fg">{s.percent}%</span>
                    <span className="block text-xs text-fg-muted">
                      {s.totalMarks} / {s.totalMax}
                    </span>
                  </span>
                ) : (
                  <Badge tone="neutral" size="sm">
                    {t("exams.noMarksYet")}
                  </Badge>
                )
              }
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {s.papers.map((paper) => (
                  <li
                    key={paper.subject}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-fg">{paper.subject}</span>
                      <span className="block text-xs text-fg-muted">{formatDateKey(paper.dateKey, undefined, locale)}</span>
                    </span>
                    <span className="tabular-nums">
                      {paper.marks === null ? (
                        <span className="text-fg-subtle">{t("exams.awaitingMarks")}</span>
                      ) : (
                        <>
                          <span className="font-semibold text-fg">{paper.marks}</span>
                          <span className="text-fg-muted"> / {paper.maxMarks}</span>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {compact && (
                <Link
                  href="/exams"
                  className="flex items-center justify-between gap-2 border-t border-border px-5 py-2.5 text-sm font-medium text-accent hover:underline"
                >
                  {marked < s.papers.length
                    ? t("exams.markedOf", { marked, total: s.papers.length })
                    : t("exams.seeAllMarks")}
                  <CaretRightIcon className="size-4" aria-hidden="true" />
                </Link>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
