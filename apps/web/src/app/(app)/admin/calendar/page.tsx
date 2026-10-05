import type { Metadata } from "next";
import { CakeIcon, CalendarBlankIcon, GraduationCapIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { approvedLeaveBetween, LEAVE_KIND_LABEL_KEY, type LeaveKind } from "@/lib/leave";
import { db } from "@/lib/db";
import { listHolidays, type HolidayKind } from "@/lib/holidays";
import { listAcademicYears } from "@/lib/academic-year";
import { todayKey, addDaysToKey, isoToDisplayDate, formatDateKey } from "@/lib/dates";
import { birthdaysBetween } from "@/lib/birthdays";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { YearPanel } from "./year-panel";
import { TermsPanel } from "./terms-panel";
import { termsOfYear } from "@/lib/terms";
import { EntryForm } from "./entry-form";
import { EntryList } from "./entry-list";
import { getT } from "@/lib/i18n/server";
import { PersonLink } from "@/components/person-link";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.schoolCalendar") };
}

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
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ when?: string }>;
}) {
  const t = await getT();
  // PRINCIPAL reads it too — approved staff leave shows here, and deciding it
  // without being able to see the term dates around it is half a job. Editing
  // stays with the admin: the year and the holidays are theirs to set.
  const ctx = await requireRole("ADMIN", "PRINCIPAL");

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
  const terms = current ? await termsOfYear(ctx.schoolId!, current.id, school.timezone) : [];

  // Staff leave for the next term or so. STAFF-ONLY BY CONSTRUCTION: it comes
  // from LeaveRequest, which no student or parent page reads, rather than from a
  // Holiday row with a filter on it. A filter is something somebody forgets once.
  const leave = await approvedLeaveBetween(ctx, today, addDaysToKey(today, 120));

  /**
   * Birthdays, over the same window as the leave above.
   *
   * DERIVED FROM `User.birthdate` and never stored — see birthdays.ts. And
   * STAFF-ONLY for the same reason the leave list is, but with a sharper edge:
   * a child's date of birth is the second factor when a guardian claims them
   * with a student code, so a page pupils could open would quietly reduce that
   * to one factor. This page is behind `requireRole("ADMIN", "PRINCIPAL")` and
   * pupils have no calendar at all.
   */
  const birthdays = await birthdaysBetween(ctx, today, addDaysToKey(today, 120));
  const { when } = await searchParams;
  const showAll = when === "all";
  const upcomingEntries = entries.filter((entry) => entry.endDateKey >= today);
  const shownEntries = showAll ? entries : upcomingEntries;

  return (
    <div className="space-y-6">
      <PageHeader title={t("feature.calendar")} description={t("calendar.subtitle")} />

      {/* ---------------- the academic year ---------------- */}
      <section aria-labelledby="year-heading">
        <Card>
          <CardHeader
            icon={<GraduationCapIcon weight="duotone" className="size-5" />}
            title={<span id="year-heading">{t("feature.academicYear")}</span>}
            description={
              current ? t("calendar.yearRunning", { name: current.name }) : t("calendar.yearNone")
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
            {current && (
              <div id="terms" className="mt-6 scroll-mt-24 border-t border-border pt-5">
                <TermsPanel
                  academicYearId={current.id}
                  yearStartKey={current.startDate.toISOString().slice(0, 10)}
                  yearEndKey={current.endDate.toISOString().slice(0, 10)}
                  terms={terms.map((term) => ({
                    id: term.id,
                    name: term.name,
                    startDateKey: term.startDateKey,
                    endDateKey: term.endDateKey,
                    current: term.current,
                    finished: term.finishedAt !== null,
                  }))}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* ---------------- the calendar itself ---------------- */}
      <section aria-labelledby="calendar-heading" className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader
            icon={<CalendarBlankIcon weight="duotone" className="size-5" />}
            title={t("calendar.addTitle")}
            description={t("calendar.addBody")}
          />
          <CardBody>
            <EntryForm today={today} />
          </CardBody>
        </Card>

        <div className="space-y-3">
          <h2 id="calendar-heading" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("calendar.listTitle")}
          </h2>

          {/* A school in March scrolled eight dead months to reach next
              term; the list opens on what is still to come, with the past
              one chip away. */}
          {entries.length > 0 && (
            <DataToolbar
              facets={[
                {
                  key: "when",
                  label: t("calendar.whenLabel"),
                  value: showAll ? "all" : "",
                  options: [
                    { value: "", label: t("calendar.upcoming"), count: upcomingEntries.length },
                    { value: "all", label: t("calendar.wholeYear"), count: entries.length },
                  ],
                },
              ]}
              labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
            />
          )}
          {shownEntries.length === 0 ? (
            <EmptyState
              icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
              title={entries.length > 0 ? t("calendar.nothingAhead") : t("calendar.nothingYet")}
              description={entries.length > 0 ? t("calendar.nothingAheadBody") : t("calendar.nothingYetBody")}
            />
          ) : (
            <EntryList
              today={today}
              entries={shownEntries.map((entry) => ({
                id: entry.id,
                name: entry.name,
                startDateKey: entry.startDateKey,
                endDateKey: entry.endDateKey,
                /* The KIND crosses over, not a label. `EntryList` is a client
                   component with the reader's `t`; resolving the word here
                   would resolve it in nobody's language in particular. */
                kind: entry.kind as HolidayKind,
                note: entry.note,
              }))}
            />
          )}
        </div>
      </section>
      {/* ---------------- who is away, and whose birthday ----------------
          Below the calendar, not above it: both are read a few times a term,
          the calendar every week, and for a year they pushed the thing the
          page is named after under the fold. */}
      {/* ---------------- staff away ---------------- */}
      {leave.length > 0 && (
        <section aria-labelledby="leave-heading">
          <Card>
            <CardHeader
              title={<span id="leave-heading">{t("calendar.staffAway")}</span>}
              description={t("calendar.staffAwayBody")}
            />
            <CardBody>
              <ul className="space-y-1.5">
                {leave.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3"
                  >
                    <span className="min-w-0 flex-1">
                      <PersonLink membershipId={row.applicantMembershipId} name={row.applicantName} className="block truncate text-sm font-medium text-fg" />
                      <span className="block truncate text-xs text-fg-muted">
                        {row.toDateKey !== row.fromDateKey
                          ? t("calendar.rangeTo", {
                              from: formatDateKey(row.fromDateKey, { day: "numeric", month: "short" }),
                              to: formatDateKey(row.toDateKey, { day: "numeric", month: "short" }),
                            })
                          : formatDateKey(row.fromDateKey, { day: "numeric", month: "short" })}{" "}
                        ·{" "}
                        {LEAVE_KIND_LABEL_KEY[row.kind as LeaveKind]
                          ? t(LEAVE_KIND_LABEL_KEY[row.kind as LeaveKind])
                          : row.kind}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {/* The REASON is deliberately absent here. The principal read it
                  when deciding; the staff room does not need to know whose
                  absence is medical. */}
            </CardBody>
          </Card>
        </section>
      )}

      {/* ---------------- birthdays ---------------- */}
      <section aria-labelledby="birthday-heading">
        <Card>
          <CardHeader
            icon={<CakeIcon weight="duotone" className="size-5" />}
            title={<span id="birthday-heading">{t("calendar.birthdays")}</span>}
            description={t("calendar.birthdaysBody")}
          />
          <CardBody>
            {birthdays.length === 0 ? (
              /* NOT AN ERROR STATE. Almost nobody has a birthday on file until
                 people start joining with one, and saying so is more use than
                 an empty box that reads as broken. */
              <p className="text-sm leading-relaxed text-fg-muted">{t("calendar.noBirthdays")}</p>
            ) : (
              <ul className="space-y-1.5">
                {birthdays.map((row) => (
                  <li
                    key={`${row.membershipId}-${row.dateKey}`}
                    className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3"
                  >
                    <span className="min-w-0 flex-1">
                      <PersonLink membershipId={row.membershipId} name={row.name} className="block truncate text-sm font-medium text-fg" />
                      <span className="block truncate text-xs text-fg-muted">
                        {isoToDisplayDate(row.dateKey)}
                        {row.turning !== null && <> · {t("calendar.turning", { age: row.turning })}</>}
                        {/* Said rather than silently shifted: somebody looking
                            for the 29th needs to know why it is on the 28th. */}
                        {row.movedFromLeapDay && <> · {t("calendar.bornLeapDay")}</>}
                      </span>
                    </span>
                    <Badge tone="neutral" size="sm">
                      {row.role === "STUDENT" ? t("role.student") : t("role.teacher")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

    </div>
  );
}
