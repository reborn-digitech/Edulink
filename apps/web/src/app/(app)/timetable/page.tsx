import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { teacherWeek, studentWeek, weekStartKey } from "@/lib/timetable";
import { todayKey, addDaysToKey, formatDateKey, isDateKey } from "@/lib/dates";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { WeekGridView } from "@/components/timetable/week-grid";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { isCollegeKind } from "@edulink/contracts";
import { myCollegeWeek } from "@/lib/family-college";
import { streamsOf } from "@/lib/streams";
import { WeekList } from "@/components/academics/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.timetable") };
}

/**
 * Your own week.
 *
 * ONE ROUTE, TWO PERSPECTIVES, and they are genuinely the same page: a teacher's
 * week is the lessons they teach, a pupil's is the lessons they attend, and
 * both are the same grid with a different filter. What neither of them gets is
 * a class picker — a pupil browsing every class's timetable is not harmful, but
 * it is not theirs, and "not harmful" is a poor reason to build a door.
 *
 * DATED, ALWAYS. This page never shows the bare template. The whole value of it
 * over a printed sheet on a noticeboard is that it knows about this Tuesday in
 * particular — who is away, who is covering, and whether the school is even
 * open — so the week it shows is a real week with real dates on it.
 */
export default async function MyTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const locale = await getLocale();
  const t = await getT();
  const ctx = await requireRole("TEACHER", "STUDENT");
  const params = await searchParams;

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true, kind: true },
  });
  const today = todayKey(school.timezone);

  /**
   * A COLLEGE STUDENT'S WEEK (DS-3 of the stream demos' walk, 10 Oct 2026): the
   * lectures of the offerings they are registered on this term (lib/family-college.ts),
   * drawn the way /student/academics draws its week — the school grid below is one a
   * college never fills, so this page said "Nothing timetabled yet" at every college.
   * The term's grid is a template, not a dated week, so there are no week arrows here.
   */
  if (ctx.role === "STUDENT" && isCollegeKind(school.kind)) {
    const [week, streams] = await Promise.all([myCollegeWeek(ctx), streamsOf(ctx.schoolId)]);
    return (
      <div className="space-y-6">
        <PageHeader title={t("timetable.myTitle")} description={[t("familyGaps.myCollegeWeekBody"), week.termName ? t("familyGaps.termLabel", { term: week.termName }) : null].filter(Boolean).join(" ")} />
        {week.termId === null ? (
          <EmptyState icon={<CalendarBlankIcon weight="duotone" className="size-8" />} title={t("timetable.nothingYet")} description={t("familyGaps.noTermYet")} />
        ) : (
          <Card data-testid="my-college-week">
            <CardBody>
              <WeekList t={t} locale={locale} weekdays={week.weekdays} cells={week.cells} streams={streams} linkFor={(c) => `/student/academics/${c.offeringId}`} />
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  // A `week` that is not a date falls back to this week rather than throwing.
  // The parameter is a convenience for the two arrows below; a mangled one
  // should not be a broken page.
  const anchor = params.week && isDateKey(params.week) ? params.week : today;
  const monday = weekStartKey(anchor);

  const grid =
    ctx.role === "TEACHER"
      ? await teacherWeek(ctx, ctx.membershipId, { weekOf: monday, todayKey: today })
      : await studentWeek(ctx, ctx.membershipId, { weekOf: monday, todayKey: today });

  const previous = addDaysToKey(monday, -7);
  const next = addDaysToKey(monday, 7);
  const isThisWeek = monday === weekStartKey(today);

  /**
   * Name the class only when there is more than one of them.
   *
   * A pupil's week is MERGED across every class they are enrolled in, and most
   * pupils are in exactly one — so labelling every lesson "Class 5A" is noise
   * that pushes the subject out of a narrow cell. A pupil in a form class and a
   * maths set is the case where two lessons can land in the same slot, and
   * there the label is the only thing telling them apart.
   */
  const spansClasses = new Set(grid.slots.map((slot) => slot.classId)).size > 1;

  return (
    <div className="space-y-6">
      <PageHeader title={t("timetable.myTitle")} description={ctx.role === "TEACHER" ? t("timetable.myTeacherBody") : t("timetable.myBody")} />

      <nav aria-label={t("principal.week")} className="flex flex-wrap items-center gap-2">
        <Link
          href={`/timetable?week=${previous}`}
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          {t("principal.previous")}
        </Link>
        {!isThisWeek && (
          <Link
            href="/timetable"
            className="rounded-[var(--radius-md)] bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-strong"
          >
            {t("principal.thisWeek")}
          </Link>
        )}
        <span className="px-1 text-sm font-medium text-fg">
          {t("principal.weekOf", {
            date: formatDateKey(monday, { day: "numeric", month: "long" }),
          })}
        </span>
        <Link
          href={`/timetable?week=${next}`}
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          {t("principal.next")}
        </Link>
      </nav>

      {grid.periods.length === 0 ? (
        <EmptyState
          icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
          title={t("timetable.noTimetableYet")}
          description={t("timetable.noTimetableYetBody")}
        />
      ) : grid.slots.length === 0 ? (
        <EmptyState
          icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
          title={
            ctx.role === "TEACHER" ? t("timetable.nothingForYou") : t("timetable.nothingYet")
          }
          description={
            ctx.role === "TEACHER"
              ? t("timetable.nothingForYouBody")
              : t("timetable.nothingYetBody")
          }
        />
      ) : (
        <Card>
          {/* The week is named once, in the nav above; the card carries only
              the note about cover. */}
          <CardBody className="space-y-3">
            <p className="text-xs text-fg-muted">
              {ctx.role === "TEACHER" ? t("timetable.coverShowsHere") : t("timetable.coverInTheirPlace")}
            </p>
            <WeekGridView
              locale={locale}
              {...grid}
              showClass={ctx.role === "TEACHER" || spansClasses}
              showTeacher={ctx.role === "STUDENT"}
              viewerMembershipId={ctx.membershipId}
              emptyLabel={t("timetable.free")}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
