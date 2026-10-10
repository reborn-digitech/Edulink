import type { Metadata } from "next";
import { ChildLeftBanner } from "../child-left";
import Link from "next/link";
import { ArrowLeftIcon, CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { familyChildren, pickChild, childAccess } from "@/lib/family-child";
import { familyCollegeWeek } from "@/lib/family-college";
import { streamsOf } from "@/lib/streams";
import { WeekList } from "@/components/academics/parts";
import { NotSharedState } from "@/components/family/not-shared";
import { childWeek, weekStartKey } from "@/lib/timetable";
import { todayKey, addDaysToKey, formatDateKey, isDateKey } from "@/lib/dates";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { WeekGridView } from "@/components/timetable/week-grid";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.timetable") };
}

/**
 * A guardian reading their child's week.
 *
 * THE SAME WEEK THE CHILD SEES, and deliberately not a summary of it. A parent
 * asking "what has she got on Thursday" wants the answer the child has, and
 * showing them a reduced version would make the two disagree in the one
 * conversation this page exists to support.
 *
 * NO CLASS PICKER, only a child picker. `childWeek` re-reads the guardianship
 * and takes the school from it, so a guardian reaches their own children's
 * classes and nothing else — see the note there.
 */
export default async function ParentTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; week?: string }>;
}) {
  const locale = await getLocale();
  const session = await requireParent();
  const t = await getT();
  const params = await searchParams;

  // The children with what each lets the guardian see, opening on one the guardian may read (DS-1, 10 Oct 2026).
  const children = await familyChildren(session.user.id);
  const chosen = pickChild(children, params.child) ?? children[0]!;
  const selectedId = chosen.studentMembershipId;

  // The week is what the register is taken against: an adult at a college shares it under ATTENDANCE.
  const access = await childAccess(session.user.id, selectedId, "ATTENDANCE");
  if (access.refused) {
    return (
      <div className="space-y-5">
        <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("parent.overview")}
        </Link>
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/timetable" />}
        <PageHeader title={t("parent.childsTimetable", { name: chosen.name })} description={chosen.schoolName} />
        <NotSharedState name={chosen.name} />
      </div>
    );
  }
  const link = access.link;
  const student = link.student;
  const childName = student.user.preferredName ?? student.user.name;

  // A COLLEGE CHILD (DS-3, 10 Oct 2026): the week is the lectures of the offerings the child is registered on this
  // term (lib/family-college.ts), not the school grid, which a college never fills. The term's grid has no dates.
  if (chosen.college) {
    const [week, streams] = await Promise.all([familyCollegeWeek(session, selectedId), streamsOf(student.schoolId)]);
    return (
      <div className="space-y-5">
        <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("parent.overview")}
        </Link>
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/timetable" />}
        <PageHeader title={t("familyGaps.collegeWeekTitle", { name: childName })} description={[student.school.name, week.termName ? t("familyGaps.termLabel", { term: week.termName }) : null].filter(Boolean).join(" · ")} />
        {week.termId === null ? (
          <EmptyState icon={<CalendarBlankIcon weight="duotone" className="size-8" />} title={t("parent.nothingTimetabled")} description={t("familyGaps.noTermYet")} />
        ) : (
          <Card data-testid="family-college-week">
            <CardHeader title={t("familyGaps.collegeWeekTitle", { name: childName })} description={t("familyGaps.collegeWeekBody", { name: childName })} />
            <CardBody>
              <WeekList t={t} locale={locale} weekdays={week.weekdays} cells={week.cells} streams={streams} />
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  const today = todayKey(student.school.timezone);
  const anchor = params.week && isDateKey(params.week) ? params.week : today;
  const monday = weekStartKey(anchor);

  const grid = await childWeek(session, selectedId, { weekOf: monday, todayKey: today });

  const previous = addDaysToKey(monday, -7);
  const next = addDaysToKey(monday, 7);
  const isThisWeek = monday === weekStartKey(today);
  // The child has to survive the week arrows, or paging forward silently
  // switches which child you are reading about.
  const link_ = (week: string) =>
    `/parent/timetable?${new URLSearchParams({ child: selectedId, week }).toString()}`;

  const spansClasses = new Set(grid.slots.map((slot) => slot.classId)).size > 1;

  return (
    <div className="space-y-5">
      <Link
        href="/parent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>

      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/timetable" />}
      {(() => {
        const sel = children.find((c) => c.studentMembershipId === selectedId);
        return sel?.leftAt ? (
          <ChildLeftBanner child={{ studentMembershipId: sel.studentMembershipId, studentUserId: sel.studentUserId, name: sel.name, schoolName: sel.schoolName, leftAt: sel.leftAt }} />
        ) : null;
      })()}

      <PageHeader title={t("parent.childsTimetable", { name: childName })} description={student.school.name} />

      <nav aria-label={t("parent.week")} className="flex flex-wrap items-center gap-2">
        <Link
          href={link_(previous)}
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          {t("parent.previousWeek")}
        </Link>
        {!isThisWeek && (
          <Link
            href={link_(weekStartKey(today))}
            className="rounded-[var(--radius-md)] bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-strong"
          >
            {t("parent.thisWeek")}
          </Link>
        )}
        <span className="px-1 text-sm font-medium text-fg">
          {t("parent.weekOf", { date: formatDateKey(monday, { day: "numeric", month: "long" }) })}
        </span>
        <Link
          href={link_(next)}
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          {t("parent.nextWeek")}
        </Link>
      </nav>

      {grid.periods.length === 0 ? (
        <EmptyState
          icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
          title={t("parent.noTimetableYet")}
          description={t("parent.noSchoolDay", { school: student.school.name })}
        />
      ) : grid.slots.length === 0 ? (
        <EmptyState
          icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
          title={t("parent.nothingTimetabled")}
          description={t("parent.noLessonsThisWeek", { name: childName })}
        />
      ) : (
        <Card>
          <CardHeader
            title={isThisWeek ? t("parent.thisWeek") : `${t("parent.week")} ${formatDateKey(monday, undefined, locale)}`}
            description={t("parent.coverNote")}
          />
          <CardBody>
            <WeekGridView {...grid} showTeacher showClass={spansClasses} emptyLabel={t("timetable.free")} locale={locale} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
