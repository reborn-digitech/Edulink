import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import { requireParent, assertGuardianAccess } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { childWeek, weekStartKey } from "@/lib/timetable";
import { todayKey, addDaysToKey, formatDateKey, isDateKey } from "@/lib/dates";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { WeekGridView } from "@/components/timetable/week-grid";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";

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

  const { children } = await listContexts(session.user.id);
  const selectedId =
    params.child && children.some((c) => c.studentMembershipId === params.child)
      ? params.child
      : children[0]!.studentMembershipId;

  const link = await assertGuardianAccess(session.user.id, selectedId);
  const student = link.student;
  const childName = student.user.preferredName ?? student.user.name;

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

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("parent.childsTimetable", { name: childName })}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{student.school.name}</p>
      </div>

      <nav aria-label={t("parent.week")} className="flex flex-wrap items-center gap-2">
        <Link
          href={link_(previous)}
          className="rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          {t("parent.previousWeek")}
        </Link>
        {!isThisWeek && (
          <Link
            href={link_(weekStartKey(today))}
            className="rounded-[--radius-md] bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-strong"
          >
            {t("parent.thisWeek")}
          </Link>
        )}
        <span className="px-1 text-sm font-medium text-fg">
          {t("parent.weekOf", { date: formatDateKey(monday, { day: "numeric", month: "long" }) })}
        </span>
        <Link
          href={link_(next)}
          className="rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
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
            title={isThisWeek ? t("parent.thisWeek") : `${t("parent.week")} ${formatDateKey(monday)}`}
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
