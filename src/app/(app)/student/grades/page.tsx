import type { Metadata } from "next";
import { ChartLineUpIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { relativeTime } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { overallForStudent } from "@/lib/grading";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import Link from "next/link";
import { myCards } from "@/lib/report-cards";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myGrades") };
}

export default async function StudentGradesPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const cards = await myCards(ctx);

  const grades = await db.grade.findMany({
    where: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId },
    include: {
      assignment: {
        select: {
          title: true,
          pointsMilli: true,
          category: true,
          classId: true,
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
  // Weights are per class, so every class this child has marked work in is
  // fetched and `overallForStudent` decides which rule applies. With no weights
  // anywhere it returns exactly the number this page showed before.
  const classIds = [...new Set(grades.map((g) => g.assignment.classId))];
  const categories = await db.gradeCategory.findMany({
    where: { schoolId: ctx.schoolId, classId: { in: classIds } },
    select: { classId: true, name: true, weightBps: true },
    orderBy: { position: "asc" },
  });
  const weightsByClass = new Map<string, { name: string; weightBps: number }[]>();
  for (const category of categories) {
    const list = weightsByClass.get(category.classId) ?? [];
    list.push({ name: category.name, weightBps: category.weightBps });
    weightsByClass.set(category.classId, list);
  }

  const result = overallForStudent(
    grades.map((g) => ({
      classId: g.assignment.classId,
      scoreMilli: g.scoreMilli,
      maxMilli: g.assignment.pointsMilli,
      category: g.assignment.category,
    })),
    weightsByClass,
  );
  const overall = result.percent;

  const best = scored.reduce<{ title: string; percent: number } | null>((top, grade) => {
    const percent = Math.round((grade.scoreMilli! * 100) / grade.assignment.pointsMilli!);
    return !top || percent > top.percent ? { title: grade.assignment.title, percent } : top;
  }, null);

  return (
    <div className="space-y-5">

      {/* Published report cards, if there are any. The one place a child can
          find the document their family was sent. */}
      {cards.length > 0 && (
        <Card>
          <CardHeader title={t("student.reportCards")} description={t("student.issuedBy")} />
          <CardBody>
            <ul className="space-y-1.5">
              {cards.map((card) => (
                <li key={card.id}>
                  <Link
                    href={`/report-cards/${card.id}`}
                    className="flex items-center gap-3 rounded-[--radius-sm] bg-surface-muted p-3 hover:bg-surface"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                      {card.title}
                    </span>
                    {card.overallPercentMilli !== null && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                        {(card.overallPercentMilli / 1000).toFixed(1)}%
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("student.myGrades")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {grades.length === 0
            ? t("student.nothingMarkedYet")
            : grades.length === 1
              ? t("student.piecesMarkedOne")
              : t("student.piecesMarkedMany", { count: grades.length })}
        </p>
      </div>

      {grades.length === 0 ? (
        <EmptyState
          icon={<ChartLineUpIcon weight="duotone" className="size-8" />}
          title={t("student.noGradesYet")}
          description={t("student.gradesEmpty")}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label={t("student.overall")}
              value={overall === null ? "—" : `${overall}%`}
              tone={overall !== null && overall >= 70 ? "ok" : "neutral"}
              icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
              hint={t("student.pointsOf", { earned: formatMilli(earned), available: formatMilli(available) })}
            />
            <StatTile label={t("student.marked")} value={grades.length} hint={t("student.piecesOfWork")} />
            <StatTile
              label={t("student.yourBest")}
              value={best ? `${best.percent}%` : "—"}
              tone="ok"
              hint={best ? best.title : t("student.nothingYet")}
            />
          </div>

          <Card>
            <CardHeader title={t("student.newestFirst")} />
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
