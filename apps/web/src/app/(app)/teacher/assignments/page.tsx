import type { Metadata } from "next";
import Link from "next/link";
import { CaretRightIcon, ClipboardTextIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole, teacherClassIds } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { dateKeyInZone, relativeTime } from "@/lib/dates";
import { admissionDaysByClass, rollOn } from "@/lib/exams";
import { formatMilli } from "@/lib/validation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { currentAcademicYear } from "@/lib/academic-year";
import { TabBar } from "@/components/ui/tabs";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.assignments") };
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ years?: string; classId?: string; state?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");
  const { years, classId: rawClassId, state: rawState } = await searchParams;

  const classIds =
    ctx.role === "ADMIN"
      ? (
          await db.class.findMany({
            where: { schoolId: ctx.schoolId, archivedAt: null },
            select: { id: true },
          })
        ).map((c) => c.id)
      : await teacherClassIds(ctx.schoolId, ctx.membershipId);

  if (classIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("teacher.assignments")} />
        <EmptyState
          icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
          title={t("teacher.noClassesYet")}
          description={t("teacher.assignmentsBelong")}
        />
      </div>
    );
  }


  /**
   * THIS YEAR BY DEFAULT. A class row lives for years, and a teacher who
   * has taught it for three saw every piece of work ever set on it — 99 on
   * one class in the simulation — with this year's somewhere in the middle.
   * The list is the current academic year's unless "All years" is chosen;
   * a school with no year set up sees everything, as before.
   */
  const year = await currentAcademicYear(ctx.schoolId!);
  const thisYear = year
    ? { createdAt: { gte: year.startDate, lte: new Date(year.endDate.getTime() + 86_400_000) } }
    : {};
  const showAll = years === "all" || !year;
  const baseWhere = { schoolId: ctx.schoolId, classId: { in: classIds } };
  const [thisYearCount, allCount] = await Promise.all([
    db.assignment.count({ where: { ...baseWhere, ...thisYear } }),
    db.assignment.count({ where: baseWhere }),
  ]);

  const classFilter = classIds.includes(rawClassId ?? "") ? (rawClassId as string) : null;
  const state = rawState === "tomark" || rawState === "draft" || rawState === "overdue" ? rawState : null;
  const classOptions = await db.class.findMany({
    where: { id: { in: classIds }, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // "To mark" means what the Today tile means: a piece with at least one
  // hand-in that has no grade yet. Paper-marked work (grades with no
  // submission) and drafts saved by a pupil never count. It is the query's
  // WHERE, so it is not a filter over the first hundred rows.
  const now = new Date();
  const fetchedRows = await db.assignment.findMany({
    where: {
      ...baseWhere,
      ...(showAll ? {} : thisYear),
      ...(classFilter ? { classId: classFilter } : {}),
      ...(state === "draft" ? { publishedAt: null } : {}),
      ...(state === "tomark" ? { submissions: { some: { status: "SUBMITTED", grade: { is: null } } } } : {}),
      ...(state === "overdue" ? { dueAt: { lt: now } } : {}),
    },
    include: {
      class: { select: { name: true, color: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } },
      examSlot: { select: { dateKey: true } },
      _count: { select: { submissions: true, grades: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  // Every row here is a class's (the WHERE names the teacher's classes); a college offering's work (R-48) is on /faculty/work.
  const fetched = fetchedRows.flatMap((a) => (a.class && a.classId ? [{ ...a, class: a.class, classId: a.classId }] : []));
  // The roll a piece of work is marked against: the class now, less a pupil
  // admitted after its day — an exam paper's date, else the due day, else the
  // day it was set (A3-journeys-16: two children admitted in October read as
  // "2 to mark" on September's papers).
  const [admitted, school] = await Promise.all([
    admissionDaysByClass([...new Set(fetched.map((a) => a.classId))]),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);
  const rollFor = (a: (typeof fetched)[number]) =>
    rollOn(a.class._count.enrollments, admitted.get(a.classId), a.examSlot?.dateKey ?? dateKeyInZone(a.dueAt ?? a.publishedAt ?? a.createdAt, school.timezone));
  // Overdue AND still unmarked for somebody: the second half is arithmetic on
  // the counts the row carries.
  const assignments = fetched.filter((a) =>
    state === "overdue" ? a._count.grades < rollFor(a) : true,
  );
  const total = showAll ? allCount : thisYearCount;
  const carry = new URLSearchParams({ ...(state ? { state } : {}), ...(classFilter ? { classId: classFilter } : {}) }).toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("teacher.assignments")} description={total === 0
              ? t("teacher.nothingSetYetShort")
              : total === 1
                ? t("teacher.piecesOfWorkOne")
                : t("teacher.piecesOfWorkMany", { count: total })} />
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/teacher/assignments/new">{t("teacher.newAssignment")}</Link>
        </Button>
      </div>

      {year && allCount > thisYearCount && (
        <TabBar
          ariaLabel={t("teacher.assignments")}
          current={showAll ? "all" : "year"}
          tabs={[
            { key: "year", href: `/teacher/assignments${carry ? `?${carry}` : ""}`, label: t("teacher.thisYear", { name: year.name }), count: thisYearCount },
            { key: "all", href: `/teacher/assignments?years=all${carry ? `&${carry}` : ""}`, label: t("teacher.allYears"), count: allCount },
          ]}
        />
      )}

      {(allCount > 0 || classFilter || state) && (
        <DataToolbar
          facets={[
            {
              key: "state",
              label: t("teacher.stateFilter"),
              value: state ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll") },
                { value: "tomark", label: t("teacher.toMark") },
                { value: "overdue", label: t("teacher.overdueFilter") },
                { value: "draft", label: t("teacher.draft") },
              ],
            },
            ...(classOptions.length > 1
              ? [{ key: "classId", label: t("teacher.classFilter"), value: classFilter ?? "", as: "select" as const, options: [{ value: "", label: t("teacher.allClasses") }, ...classOptions.map((c) => ({ value: c.id, label: c.name }))] }]
              : []),
          ]}
          extra={showAll ? { years: "all" } : {}}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {assignments.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
          title={classFilter || state ? t("common.noResultsTitle") : t("teacher.noAssignmentsYet")}
          description={classFilter || state ? t("common.noResultsBody") : t("teacher.setWorkBlurb")}
        />
      ) : (
        <ul className="space-y-2">
          {assignments.map((assignment) => {
            const roster = rollFor(assignment);
            const graded = assignment._count.grades;
            const allGraded = roster > 0 && graded >= roster;

            return (
              <li key={assignment.id}>
                <Card interactive className="overflow-hidden">
                  <Link
                    href={`/teacher/assignments/${assignment.id}`}
                    className="flex items-center gap-3 p-4"
                  >
                    <span
                      aria-hidden="true"
                      className="h-11 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: assignment.class.color ?? "var(--accent)" }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fg">{assignment.title}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {assignment.class.name}
                        {assignment.category ? ` · ${assignment.category}` : ""}
                        {assignment.pointsMilli
                          ? ` · ${formatMilli(assignment.pointsMilli)} points`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        {assignment.dueAt
                          ? t("teacher.dueWhen", { when: relativeTime(assignment.dueAt) })
                          : t("teacher.noDueDate")}
                        {" · "}
                        {graded} of {roster} marked
                      </p>
                    </div>

                    {!assignment.publishedAt ? (
                      <Badge tone="warn" size="sm">
                        {t("teacher.draft")}
                      </Badge>
                    ) : allGraded ? (
                      <Badge tone="ok" size="sm">
                        {t("teacher.marked")}
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        {roster - graded} to mark
                      </Badge>
                    )}

                    <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
