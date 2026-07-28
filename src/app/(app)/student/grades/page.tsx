import type { Metadata } from "next";
import { ChartLineUpIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { relativeTime } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { overallPercent } from "@/lib/grading";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "My grades" };

export default async function StudentGradesPage() {
  const ctx = await requireRole("STUDENT");

  const grades = await db.grade.findMany({
    where: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId },
    include: {
      assignment: {
        select: {
          title: true,
          pointsMilli: true,
          category: true,
          class: { select: { name: true } },
        },
      },
    },
    orderBy: { gradedAt: "desc" },
    take: 100,
  });

  // Same shared helper the parent view uses, so the two can never disagree.
  const scored = grades.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli);
  const earned = scored.reduce((sum, g) => sum + g.scoreMilli!, 0);
  const available = scored.reduce((sum, g) => sum + g.assignment.pointsMilli!, 0);
  const overall = overallPercent(
    grades.map((g) => ({ scoreMilli: g.scoreMilli, maxMilli: g.assignment.pointsMilli })),
  );

  const best = scored.reduce<{ title: string; percent: number } | null>((top, grade) => {
    const percent = Math.round((grade.scoreMilli! * 100) / grade.assignment.pointsMilli!);
    return !top || percent > top.percent ? { title: grade.assignment.title, percent } : top;
  }, null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">My grades</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {grades.length === 0
            ? "Nothing marked yet"
            : `${grades.length} piece${grades.length === 1 ? "" : "s"} marked`}
        </p>
      </div>

      {grades.length === 0 ? (
        <EmptyState
          icon={<ChartLineUpIcon weight="duotone" className="size-8" />}
          title="No grades yet"
          description="When a teacher marks your work it appears here, along with anything they wrote to you."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Overall"
              value={overall === null ? "—" : `${overall}%`}
              tone={overall !== null && overall >= 70 ? "ok" : "neutral"}
              icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
              hint={`${formatMilli(earned)} of ${formatMilli(available)} points`}
            />
            <StatTile label="Marked" value={grades.length} hint="Pieces of work" />
            <StatTile
              label="Your best"
              value={best ? `${best.percent}%` : "—"}
              tone="ok"
              hint={best ? best.title : "Nothing yet"}
            />
          </div>

          <Card>
            <CardHeader title="Everything, newest first" />
            <CardBody>
              <ul className="divide-y divide-border">
                {grades.map((grade) => {
                  const max = grade.assignment.pointsMilli;
                  const percent =
                    grade.scoreMilli !== null && max
                      ? Math.round((grade.scoreMilli * 100) / max)
                      : null;
                  return (
                    <li key={grade.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-fg">
                            {grade.assignment.title}
                          </p>
                          <p className="truncate text-xs text-fg-muted">
                            {grade.assignment.class.name}
                            {grade.assignment.category ? ` · ${grade.assignment.category}` : ""} ·{" "}
                            {relativeTime(grade.gradedAt)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold tabular-nums text-fg">
                            {formatMilli(grade.scoreMilli)}
                            {max ? <span className="text-fg-muted">/{formatMilli(max)}</span> : null}
                          </p>
                          {percent !== null && (
                            <Badge tone={percent >= 70 ? "ok" : "neutral"} size="sm">
                              {percent}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      {grade.comment && (
                        <p className="mt-1.5 rounded-[--radius-sm] bg-surface-muted p-2.5 text-sm italic leading-relaxed text-fg-muted">
                          &ldquo;{grade.comment}&rdquo;
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
