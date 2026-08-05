import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlankIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { classWeek, timetableClasses, weekStartKey } from "@/lib/timetable";
import { todayKey, addDaysToKey, formatDateKey, isDateKey } from "@/lib/dates";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { WeekGridView } from "@/components/timetable/week-grid";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.classTimetables") };
}

/**
 * Any class's week, read-only.
 *
 * THE PRINCIPAL READS AND DOES NOT EDIT, which is the same split the calendar
 * makes and for the same reason: the timetable is the admin's to build, and a
 * role that can do everything is a role that means nothing. What a principal
 * needs is the answer to "is anybody standing in front of 6B on Thursday", and
 * that is a reading question.
 *
 * DATED, so the uncovered lessons are real ones. A template cannot tell anybody
 * that Mrs Rao is away on Thursday with nobody arranged; a resolved week can,
 * and that is the single most useful thing on this page.
 */
export default async function ClassTimetablesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; week?: string }>;
}) {
  const locale = await getLocale();
  // ADMIN too — they build these, and being sent to the editor to read one
  // week's cover would be a detour. The editor stays theirs alone.
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const params = await searchParams;

  const [school, classes] = await Promise.all([
    db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { timezone: true },
    }),
    timetableClasses(ctx),
  ]);

  const today = todayKey(school.timezone);
  const anchor = params.week && isDateKey(params.week) ? params.week : today;
  const monday = weekStartKey(anchor);

  const selected = classes.find((klass) => klass.id === params.class) ?? classes[0] ?? null;
  const grid = selected
    ? await classWeek(ctx, selected.id, { weekOf: monday, todayKey: today })
    : null;

  const gaps = grid?.slots.filter((slot) => slot.uncovered) ?? [];
  const unstaffed = grid?.slots.filter((slot) => !slot.teacherMembershipId) ?? [];

  const previous = addDaysToKey(monday, -7);
  const next = addDaysToKey(monday, 7);
  const isThisWeek = monday === weekStartKey(today);
  const link = (week: string, classId: string | undefined) =>
    `/principal/timetable?${new URLSearchParams({ ...(classId ? { class: classId } : {}), week }).toString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Class timetables</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Any class, any week — with cover and closures already worked in.
        </p>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
          title="No classes yet"
          description="There is nothing to timetable until this school has classes."
        />
      ) : (
        <>
          <nav aria-label="Choose a class" className="flex flex-wrap gap-2">
            {classes.map((klass) => (
              <Link
                key={klass.id}
                href={link(monday, klass.id)}
                aria-current={selected?.id === klass.id ? "page" : undefined}
                className={
                  selected?.id === klass.id
                    ? "rounded-[--radius-md] bg-accent px-3 py-2 text-sm font-semibold text-accent-fg"
                    : "rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:border-border-strong hover:text-fg"
                }
              >
                {klass.name}
                {klass.section ? ` ${klass.section}` : ""}
              </Link>
            ))}
          </nav>

          <nav aria-label="Week" className="flex flex-wrap items-center gap-2">
            <Link
              href={link(previous, selected?.id)}
              className="rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
            >
              ← Previous
            </Link>
            {!isThisWeek && (
              <Link
                href={link(weekStartKey(today), selected?.id)}
                className="rounded-[--radius-md] bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-strong"
              >
                This week
              </Link>
            )}
            <span className="px-1 text-sm font-medium text-fg">
              Week of {formatDateKey(monday, { day: "numeric", month: "long" }, locale)}
            </span>
            <Link
              href={link(next, selected?.id)}
              className="rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg"
            >
              Next →
            </Link>
          </nav>

          {/* The one thing worth interrupting for: a lesson this week with
              nobody down to take it. Counted rather than left to be spotted in
              a grid of forty cells. */}
          {gaps.length > 0 && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
            >
              <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
              <span>
                {gaps.length} {gaps.length === 1 ? "lesson has" : "lessons have"} a teacher on leave
                and no cover this week.{" "}
                <Link href="/principal/leave" className="underline underline-offset-4">
                  Arrange cover
                </Link>
              </span>
            </p>
          )}

          {selected && grid && (
            <Card>
              <CardHeader
                title={selected.name}
                description={
                  unstaffed.length > 0
                    ? `${unstaffed.length} ${unstaffed.length === 1 ? "lesson has" : "lessons have"} no teacher assigned at all.`
                    : "Every lesson has a teacher assigned."
                }
              />
              <CardBody>
                <WeekGridView {...grid} showTeacher emptyLabel="Free" locale={locale} />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
