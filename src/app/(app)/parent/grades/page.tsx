import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ChartLineUpIcon } from "@phosphor-icons/react/ssr";
import { requireParent, assertGuardianAccess } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { db } from "@/lib/db";
import { relativeTime } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { overallPercent } from "@/lib/grading";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChildSwitcher } from "../child-switcher";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Grades" };

export default async function ParentGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await requireParent();
  const { child: requested } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const selectedId =
    requested && children.some((c) => c.studentMembershipId === requested)
      ? requested
      : children[0]!.studentMembershipId;

  const link = await assertGuardianAccess(session.user.id, selectedId);
  const student = link.student;
  const childName = student.user.preferredName ?? student.user.name;

  const grades = await db.grade.findMany({
    where: { studentMembershipId: selectedId, schoolId: student.schoolId },
    include: {
      assignment: {
        select: {
          title: true,
          pointsMilli: true,
          category: true,
          class: { select: { name: true } },
        },
      },
      grader: { include: { user: { select: { name: true } } } },
    },
    orderBy: { gradedAt: "desc" },
    take: 100,
  });

  // One shared implementation (see overallPercent) so the number a parent sees
  // cannot drift from the one the student sees. (§10)
  const scored = grades.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli);
  const earned = scored.reduce((sum, g) => sum + g.scoreMilli!, 0);
  const available = scored.reduce((sum, g) => sum + g.assignment.pointsMilli!, 0);
  const overall = overallPercent(
    grades.map((g) => ({ scoreMilli: g.scoreMilli, maxMilli: g.assignment.pointsMilli })),
  );

  // Per-category breakdown, same integer arithmetic.
  const categories = new Map<string, { earned: number; available: number; count: number }>();
  for (const grade of scored) {
    const key = grade.assignment.category ?? "Other";
    const current = categories.get(key) ?? { earned: 0, available: 0, count: 0 };
    current.earned += grade.scoreMilli!;
    current.available += grade.assignment.pointsMilli!;
    current.count += 1;
    categories.set(key, current);
  }

  return (
    <div className="space-y-5">
      <Link
        href="/parent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        Overview
      </Link>

      {children.length > 1 && <ChildSwitcher children={children} selectedId={selectedId} />}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {childName}&rsquo;s grades
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{student.school.name}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Overall"
          value={overall === null ? "—" : `${overall}%`}
          tone={overall === null ? "neutral" : overall >= 70 ? "ok" : overall >= 50 ? "warn" : "danger"}
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          hint={
            scored.length === 0
              ? "Nothing graded yet"
              : `${formatMilli(earned)} of ${formatMilli(available)} points`
          }
        />
        <StatTile
          label="Pieces graded"
          value={grades.length}
          hint={grades.length === 0 ? "None yet" : "Returned by a teacher"}
        />
        <StatTile
          label="Subjects"
          value={categories.size}
          hint={categories.size === 0 ? "None yet" : "With graded work"}
        />
      </div>

      {categories.size > 1 && (
        <Card>
          <CardHeader title="By category" description="Where the marks are coming from" />
          <CardBody>
            <ul className="space-y-3">
              {[...categories.entries()].map(([name, stats]) => {
                const percent =
                  overallPercent([{ scoreMilli: stats.earned, maxMilli: stats.available }]) ?? 0;
                return (
                  <li key={name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-fg">{name}</span>
                      <span className="text-sm font-bold tabular-nums text-fg">
                        {percent}%
                        <span className="ml-1.5 text-xs font-normal text-fg-muted">
                          ({stats.count})
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          title="Every piece of work"
          description={grades.length === 0 ? "Nothing graded yet" : "Newest first"}
        />
        <CardBody>
          {grades.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title="No grades yet"
              description="As soon as a teacher returns a piece of work, it will appear here with any comment they left."
            />
          ) : (
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
                          <Badge
                            tone={percent >= 70 ? "ok" : percent >= 50 ? "warn" : "danger"}
                            size="sm"
                          >
                            {percent}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    {grade.comment && (
                      <p className="mt-1.5 rounded-[--radius-sm] bg-surface-muted p-2.5 text-sm italic leading-relaxed text-fg-muted">
                        &ldquo;{grade.comment}&rdquo;
                        {grade.grader && (
                          <span className="not-italic"> — {grade.grader.user.name}</span>
                        )}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
