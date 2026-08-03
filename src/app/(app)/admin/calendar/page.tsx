import type { Metadata } from "next";
import { CalendarBlankIcon, GraduationCapIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listHolidays, HOLIDAY_KIND_META, type HolidayKind } from "@/lib/holidays";
import { listAcademicYears } from "@/lib/academic-year";
import { todayKey } from "@/lib/dates";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { YearPanel } from "./year-panel";
import { EntryForm } from "./entry-form";
import { EntryList } from "./entry-list";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "School calendar" };

/**
 * The school's year, on one page.
 *
 * The academic year and the holiday calendar are the same afternoon's work —
 * somebody sits down in June with the year's dates and the list of festivals and
 * types both. Splitting them across two screens would mean setting up a year and
 * then having to be told where the calendar lives.
 *
 * The year comes FIRST on the page, because a calendar entry gets pinned to
 * whichever year is running and an admin who adds Diwali before setting the year
 * up gets an entry attached to nothing.
 */
export default async function CalendarPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });
  const today = todayKey(school.timezone);

  const [years, entries] = await Promise.all([
    listAcademicYears(ctx),
    listHolidays(ctx.schoolId),
  ]);

  const current = years.find((year) => year.isCurrent) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("feature.calendar")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          The school year, and the days the school is shut.
        </p>
      </div>

      {/* ---------------- the academic year ---------------- */}
      <section aria-labelledby="year-heading">
        <Card>
          <CardHeader
            icon={<GraduationCapIcon weight="duotone" className="size-5" />}
            title={<span id="year-heading">{t("feature.academicYear")}</span>}
            description={
              current
                ? `Running ${current.name}. Badges earned this year reset when it is closed — and are kept forever once they are.`
                : "Nothing set up yet. Attendance badges fall back to a rolling 60 days until a year exists."
            }
          />
          <CardBody>
            <YearPanel
              years={years.map((year) => ({
                id: year.id,
                name: year.name,
                startDateKey: year.startDate.toISOString().slice(0, 10),
                endDateKey: year.endDate.toISOString().slice(0, 10),
                isCurrent: year.isCurrent,
                closedAt: year.closedAt ? year.closedAt.toISOString() : null,
              }))}
              today={today}
            />
          </CardBody>
        </Card>
      </section>

      {/* ---------------- the calendar itself ---------------- */}
      <section aria-labelledby="calendar-heading" className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader
            icon={<CalendarBlankIcon weight="duotone" className="size-5" />}
            title="Add to the calendar"
            description="A festival, a break, an exam week or a sports day."
          />
          <CardBody>
            <EntryForm today={today} />
          </CardBody>
        </Card>

        <div className="space-y-3">
          <h2 id="calendar-heading" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            This school's calendar
          </h2>

          {entries.length === 0 ? (
            <EmptyState
              icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
              title="Nothing on the calendar yet"
              description="Add the year's festivals and breaks so teachers are warned before they take a register on a day the school is shut."
            />
          ) : (
            <EntryList
              today={today}
              entries={entries.map((entry) => ({
                id: entry.id,
                name: entry.name,
                startDateKey: entry.startDateKey,
                endDateKey: entry.endDateKey,
                kind: entry.kind as HolidayKind,
                kindLabel: HOLIDAY_KIND_META[entry.kind as HolidayKind]?.label ?? entry.kind,
                closesSchool:
                  HOLIDAY_KIND_META[entry.kind as HolidayKind]?.closesSchool ?? false,
                note: entry.note,
              }))}
            />
          )}
        </div>
      </section>
    </div>
  );
}
