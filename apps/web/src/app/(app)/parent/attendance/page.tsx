import type { Metadata } from "next";
import { ChildLeftBanner } from "../child-left";
import Link from "next/link";
import { ArrowLeftIcon, CalendarCheckIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { familyChildren, pickChild, childAccess } from "@/lib/family-child";
import { familyLectureAttendance } from "@/lib/family-college";
import { AttendanceTable } from "@/components/academics/parts";
import { NotSharedState } from "@/components/family/not-shared";
import { getAttendanceSummary } from "@/lib/attendance";
import { listAbsenceNotes } from "@/lib/absence-notes";
import { AbsenceNotesCard } from "./absence-notes";
import { formatDateKey, isTeachingDay, parseTeachingDays, todayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { MONTH_KEY, shiftMonth } from "@/lib/attendance-history";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { AttendanceBadge } from "@/components/ui/badge";
import { ChildSwitcher } from "../child-switcher";
import { EmptyState } from "@/components/ui/states";
import { ATTENDANCE_META, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.attendance") };
}

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; month?: string }>;
}) {
  const session = await requireParent();
  const t = await getT();
  const locale = await getLocale();
  const { child: requested, month: requestedMonth } = await searchParams;

  // The children with what each lets the guardian see, opening on one the guardian may read (DS-1, 10 Oct 2026).
  const children = await familyChildren(session.user.id);
  const chosen = pickChild(children, requested) ?? children[0]!;
  const selectedId = chosen.studentMembershipId;

  const access = await childAccess(session.user.id, selectedId, "ATTENDANCE");
  if (access.refused) {
    return (
      <div className="space-y-5">
        <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("parent.overview")}
        </Link>
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/attendance" />}
        <PageHeader title={t("parent.childsAttendance", { name: chosen.name })} description={chosen.schoolName} />
        <NotSharedState name={chosen.name} />
      </div>
    );
  }
  const link = access.link;
  const student = link.student;
  const childName = student.user.preferredName ?? student.user.name;

  /**
   * A COLLEGE CHILD (DS-2 of the stream demos' walk, 10 Oct 2026): a college keeps no
   * day register, so this page read nothing and said "No attendance recorded yet" at
   * every demo college. The entry is a primary one on the family's bar and a family
   * may have a child at a school and one at a college, so rather than hide it the
   * page draws here what /parent/academics draws: lecture attendance per course
   * against the college's threshold (the 75 % view), under the same ATTENDANCE grant.
   */
  if (chosen.college) {
    const rows = await familyLectureAttendance(session, selectedId);
    return (
      <div className="space-y-5">
        <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("parent.overview")}
        </Link>
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/attendance" />}
        <PageHeader title={t("familyGaps.lectureAttendanceTitle", { name: childName })} description={[student.school.name, t("familyGaps.lectureAttendanceBody")].join(" · ")} />
        <Card data-testid="family-lecture-attendance">
          <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("academics.childAttendance", { name: childName })} />
          <CardBody>
            <AttendanceTable t={t} rows={rows} />
          </CardBody>
        </Card>
        <p className="text-sm text-fg-muted">
          <Link href={`/parent/academics?child=${selectedId}`} className="font-medium text-accent hover:underline">{t("academics.familyTitle")}</Link>
        </p>
      </div>
    );
  }
  const teachingDays = parseTeachingDays((await db.school.findUnique({ where: { id: student.schoolId }, select: { teachingDays: true } }))?.teachingDays);

  // ONE MONTH AT A TIME, any month. A rolling "last 60 days" answered "how
  // is it going" and nothing else; a parent asked in March about January
  // had nowhere to look. The month is in the URL so it can be bookmarked,
  // and the switcher keeps the child while the arrows keep the month.
  const today = todayKey(student.school.timezone);
  const thisMonth = today.slice(0, 7);
  const month =
    requestedMonth && MONTH_KEY.test(requestedMonth) && requestedMonth <= thisMonth
      ? requestedMonth
      : thisMonth;
  const monthLabel = formatDateKey(`${month}-01`, { month: "long", year: "numeric" }, locale);
  const summary = await getAttendanceSummary(student.schoolId, selectedId, `${month}-01`, `${month}-31`);
  // The days away the family has told the school about, for a child still at the school.
  const absenceNotes = student.leftAt ? null : await listAbsenceNotes(session, selectedId);

  // Only days that actually have a record, newest first — showing a blank row
  // for every weekend and holiday would bury the days that matter.
  const days = [...summary.recent].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  const monthHref = (m: string) => `/parent/attendance?child=${selectedId}&month=${m}`;
  const next = shiftMonth(month, 1);

  return (
    <div className="space-y-5">
      <Link
        href="/parent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>

      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/attendance" />}
      {(() => {
        const sel = children.find((c) => c.studentMembershipId === selectedId);
        return sel?.leftAt ? (
          <ChildLeftBanner child={{ studentMembershipId: sel.studentMembershipId, studentUserId: sel.studentUserId, name: sel.name, schoolName: sel.schoolName, leftAt: sel.leftAt }} />
        ) : null;
      })()}

      <PageHeader title={t("parent.childsAttendance", { name: childName })} description={[student.school.name, monthLabel].join(" · ")} />

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="secondary" size="sm" icon={<CaretLeftIcon weight="bold" />}>
          <Link href={monthHref(shiftMonth(month, -1))}>{t("parent.previousMonth")}</Link>
        </Button>
        {next <= thisMonth ? (
          <Button asChild variant="secondary" size="sm" iconRight={<CaretRightIcon weight="bold" />}>
            <Link href={monthHref(next)}>{t("parent.nextMonth")}</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled iconRight={<CaretRightIcon weight="bold" />}>
            {t("parent.nextMonth")}
          </Button>
        )}
        {month !== thisMonth && (
          <Button asChild variant="ghost" size="sm">
            <Link href={monthHref(thisMonth)}>{t("parent.thisMonth")}</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t("parent.overall")}
          value={summary.percent === null ? "—" : `${summary.percent}%`}
          tone={
            summary.percent === null
              ? "neutral"
              : summary.percent >= 95
                ? "ok"
                : summary.percent >= 90
                  ? "warn"
                  : "danger"
          }
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          hint={
            summary.total === 0
              ? t("parent.noRecords")
              : t("parent.thereOfDays", { there: summary.counts.PRESENT + summary.counts.LATE, total: summary.total })
          }
        />
        {ATTENDANCE_STATUSES.filter((s) => s !== "PRESENT").map((status) => (
          <StatTile
            key={status}
            label={t(ATTENDANCE_META[status].labelKey)}
            value={summary.counts[status]}
            tone={
              summary.counts[status] === 0
                ? "neutral"
                : status === "ABSENT"
                  ? "danger"
                  : status === "LATE"
                    ? "warn"
                    : "neutral"
            }
            hint={t(ATTENDANCE_META[status].hintKey)}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          title={t("parent.dayByDay")}
          description={
            summary.total === 0
              ? t("parent.nothingRecordedYet")
              : summary.total === 1
                ? t("parent.daysRecordedOne")
                : t("parent.daysRecordedMany", { count: summary.total })
          }
        />
        <CardBody>
          {days.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title={t("parent.noAttendanceYet")}
              description={t("parent.nothingInMonth", { name: childName, month: monthLabel })}
            />
          ) : (
            <ul className="divide-y divide-border">
              {days.map((day) => (
                <li key={day.dateKey} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {formatDateKey(day.dateKey, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      }, locale)}
                    </p>
                    {day.note ? (
                      <p className="text-xs text-fg-muted">&ldquo;{day.note}&rdquo;</p>
                    ) : (
                      /*
                        Only a SUNDAY is worth flagging. The school teaches
                        Monday to Saturday, so labelling every Saturday
                        "Weekend session" told a parent that an ordinary school
                        day was unusual — noise on the six-sevenths of the week
                        that are perfectly normal.
                      */
                      !isTeachingDay(day.dateKey, teachingDays) && (
                        <p className="text-xs text-fg-subtle">{t("parent.sundaySession")}</p>
                      )
                    )}
                  </div>
                  <AttendanceBadge status={day.status as AttendanceStatus} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {absenceNotes && <AbsenceNotesCard initial={absenceNotes} />}

      {summary.percent !== null && summary.percent < 90 && (
        <p className="rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft p-4 text-sm leading-relaxed text-warn">
          {t("parent.below90Body", { name: childName })}{" "}
          <Link href="/remarks" className="font-semibold underline underline-offset-2">
            {t("parent.messagesPageLink")}
          </Link>
          .
        </p>
      )}

      <p className="pb-4 text-xs text-fg-subtle">{t("parent.changesAppearImmediately")}</p>
    </div>
  );
}
