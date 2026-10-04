import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArchiveIcon,
  CalendarBlankIcon,
  CaretRightIcon,
  ChalkboardTeacherIcon,
  ChartLineUpIcon,
  ChecksIcon,
  ClipboardTextIcon,
  ExamIcon,
  MedalIcon,
  SignOutIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import {
  listClosedYears,
  closedYearsForPupil,
  pupilYearArchive,
  teacherYearArchive,
  schoolYearArchive,
  type ArchiveYear,
} from "@/lib/year-archive";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatInZone } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("archive.metaTitle") };
}

/**
 * The past-years section, one page for every school role.
 *
 * ONE ROUTE, FIVE READERS, deliberately: what changes by role is which slice
 * of a closed year a person may see — their own (pupil), their child's
 * (guardian), their classes' (teacher), the school's (admin and principal) —
 * and that decision belongs in year-archive.ts where each function asserts
 * it, not in five near-identical pages.
 *
 * THE SHAPE OF THE PAGE. A closed year is a shelf, not a feed: the reader
 * picks a year off a rail on the left (chips on a phone), and the year opens
 * as a set of tiles with the numbers first and the lists under them. Every
 * figure wears the icon the live pages use for the same thing, so "12
 * report cards" here looks like "12 report cards" on the exams page. The
 * year's own dates sit under the picker, because "2026–27" is a name and
 * "1 April 2026 to 31 March 2027, closed 3 April" is the fact.
 *
 * The year and child pickers are plain links. Nothing here is interactive
 * enough to earn client state: a year is a URL, which also makes any view of
 * the archive shareable within the people allowed to see it.
 */
export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; child?: string }>;
}) {
  const t = await getT();
  const session = await requireUser();
  const { year: requestedYear, child: requestedChild } = await searchParams;

  let schoolId: string | null = null;
  let pupilMembershipId: string | null = null;
  let children: { studentMembershipId: string; name: string; schoolId: string }[] = [];

  if (session.role === "PARENT") {
    const contexts = await listContexts(session.user.id);
    children = contexts.children.map((c) => ({
      studentMembershipId: c.studentMembershipId,
      name: c.name,
      schoolId: c.schoolId,
    }));
    if (children.length === 0) redirect("/");
    const selected = children.find((c) => c.studentMembershipId === requestedChild) ?? children[0]!;
    schoolId = selected.schoolId;
    pupilMembershipId = selected.studentMembershipId;
  } else if (session.role === "STUDENT") {
    schoolId = session.schoolId;
    pupilMembershipId = session.membershipId;
  } else if (session.role === "TEACHER" || session.role === "ADMIN" || session.role === "PRINCIPAL") {
    schoolId = session.schoolId;
  } else {
    redirect("/");
  }
  if (!schoolId) redirect("/");

  const [years, school] = await Promise.all([
    pupilMembershipId ? closedYearsForPupil(schoolId, pupilMembershipId) : listClosedYears(schoolId),
    db.school.findUnique({ where: { id: schoolId }, select: { name: true, timezone: true } }),
  ]);
  const timezone = school?.timezone ?? "UTC";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            <ArchiveIcon weight="duotone" className="size-7 text-accent" />
            {t("archive.title")}
          </h1>
          <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("archive.intro")}</p>
        </div>
        {years.length > 0 && (
          <Badge tone="neutral">
            {years.length === 1 ? t("archive.yearsCountOne") : t("archive.yearsCount", { count: years.length })}
          </Badge>
        )}
      </header>

      {children.length > 1 && (
        <nav aria-label={t("archive.childLabel")} className="flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.studentMembershipId}
              href={`/archive?child=${child.studentMembershipId}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                child.studentMembershipId === pupilMembershipId
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-muted text-fg-muted hover:text-fg",
              )}
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}

      {years.length === 0 ? (
        <EmptyState
          icon={<ArchiveIcon weight="duotone" className="size-8" />}
          title={t("archive.noYearsTitle")}
          description={
            session.role === "ADMIN"
              ? t("archive.noYearsAdminBody")
              : pupilMembershipId
                ? t("archive.noYearsPupilBody")
                : t("archive.noYearsBody")
          }
          action={
            session.role === "ADMIN" ? (
              <Link href="/admin/calendar" className="text-sm font-medium text-accent-strong hover:underline">
                {t("archive.closeYearCta")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <YearView
          t={t}
          years={years}
          requestedYear={requestedYear}
          childParam={children.length > 1 ? pupilMembershipId : null}
          session={session}
          pupilMembershipId={pupilMembershipId}
          timezone={timezone}
        />
      )}
    </div>
  );
}

async function YearView({
  t,
  years,
  requestedYear,
  childParam,
  session,
  pupilMembershipId,
  timezone,
}: {
  t: Translate;
  years: ArchiveYear[];
  requestedYear: string | undefined;
  childParam: string | null;
  session: Awaited<ReturnType<typeof requireUser>>;
  pupilMembershipId: string | null;
  timezone: string;
}) {
  const selectedYear = years.find((y) => y.id === requestedYear) ?? years[0]!;
  const childSuffix = childParam ? `&child=${childParam}` : "";
  const date = (d: Date) => formatInZone(d, timezone, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
      {/* ---- the shelf ---- */}
      <nav aria-label={t("archive.yearLabel")} className="lg:sticky lg:top-20 lg:self-start">
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {years.map((year) => {
            const active = year.id === selectedYear.id;
            return (
              <li key={year.id} className="shrink-0">
                <Link
                  href={`/archive?year=${year.id}${childSuffix}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-[--radius-md] border px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                  )}
                >
                  <CalendarBlankIcon weight={active ? "fill" : "regular"} className="size-4 shrink-0" />
                  <span className="flex-1">{year.name}</span>
                  <CaretRightIcon className={cn("hidden size-4 lg:block", active ? "opacity-80" : "text-fg-subtle")} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---- the year ---- */}
      <div className="min-w-0 space-y-4">
        <div className="rounded-[--radius-lg] border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("archive.yearLabel")}</p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-fg">{selectedYear.name}</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {t("archive.yearRan", { from: date(selectedYear.startDate), to: date(selectedYear.endDate) })}
            {" · "}
            {t("archive.closedOn", { date: date(selectedYear.closedAt) })}
          </p>
        </div>

        {pupilMembershipId ? (
          <PupilYear t={t} session={session} membershipId={pupilMembershipId} yearId={selectedYear.id} />
        ) : session.role === "TEACHER" ? (
          <TeacherYear t={t} session={session} yearId={selectedYear.id} />
        ) : (
          <SchoolYear t={t} session={session} yearId={selectedYear.id} />
        )}
      </div>
    </div>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Figure({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      {/* Icon above the words on a phone, beside them on a desk: two tiles
          across a 360px screen leave no room for "Pupils on the roll" next
          to a circle. */}
      <CardBody className="flex flex-col items-start gap-2 sm:flex-row sm:gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong sm:size-10">{icon}</span>
        <span className="min-w-0">
          <dt className="text-xs text-fg-muted">{label}</dt>
          <dd className="text-2xl font-bold tabular-nums tracking-tight text-fg">{value}</dd>
          {hint && <dd className="text-xs text-fg-muted">{hint}</dd>}
        </span>
      </CardBody>
    </Card>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
        <span className="text-accent">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/* ---- the pupil's (and guardian's) view ----------------------------------- */

async function PupilYear({
  t,
  session,
  membershipId,
  yearId,
}: {
  t: Translate;
  session: Awaited<ReturnType<typeof requireUser>>;
  membershipId: string;
  yearId: string;
}) {
  const data = await pupilYearArchive(session, membershipId, yearId);
  const attendancePercent =
    data.attendance.marked === 0 ? null : Math.round((data.attendance.present / data.attendance.marked) * 100);

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Figure
          icon={<ChecksIcon weight="duotone" className="size-5" />}
          label={t("archive.attendance")}
          value={attendancePercent === null ? "—" : `${attendancePercent}%`}
          hint={
            data.attendance.marked === 0
              ? t("archive.attendanceNone")
              : t("archive.presentOfMarked", { present: data.attendance.present, marked: data.attendance.marked })
          }
        />
        <Figure
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          label={t("archive.marks")}
          value={data.marks.averagePercent === null ? "—" : `${data.marks.averagePercent}%`}
          hint={data.marks.graded === 0 ? t("archive.marksNone") : t("archive.gradedCount", { count: data.marks.graded })}
        />
        <Figure
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          label={t("archive.reportCards")}
          value={data.reportCards.length}
        />
      </dl>

      <Section icon={<ClipboardTextIcon weight="duotone" className="size-4" />} title={t("archive.reportCards")}>
        {data.reportCards.length === 0 ? (
          <p className="rounded-[--radius-md] bg-surface-muted p-4 text-sm text-fg-muted">{t("archive.noReportCards")}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.reportCards.map((card) => (
              <li key={card.id}>
                <Card interactive>
                  <Link href={`/report-cards/${card.id}`} className="flex items-center gap-3 p-3.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-fg">{card.title}</span>
                      <span className="block text-xs text-fg-muted">{card.className}</span>
                    </span>
                    <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={<MedalIcon weight="duotone" className="size-4" />} title={t("archive.badges")}>
        {data.badges.length === 0 ? (
          <p className="rounded-[--radius-md] bg-surface-muted p-4 text-sm text-fg-muted">{t("archive.badgesNone")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.badges.map((badge) => (
              <li key={badge.badgeId}>
                {/* Stored artifacts render as stored — the archive shows what
                    was written when the year closed, in the language it was
                    written in. */}
                <span title={badge.description}>
                  <Badge tone="accent">{badge.label}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/* ---- the teacher's view -------------------------------------------------- */

async function TeacherYear({
  t,
  session,
  yearId,
}: {
  t: Translate;
  session: Awaited<ReturnType<typeof requireUser>>;
  yearId: string;
}) {
  const data = await teacherYearArchive(session, yearId);
  const totals = data.classes.reduce(
    (acc, k) => ({
      registers: acc.registers + k.registersTaken,
      assignments: acc.assignments + k.assignmentsSet,
      cards: acc.cards + k.reportCardsPublished,
    }),
    { registers: 0, assignments: 0, cards: 0 },
  );

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Figure icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} label={t("archive.classes")} value={data.classes.length} />
        <Figure icon={<ChecksIcon weight="duotone" className="size-5" />} label={t("archive.attendance")} value={totals.registers} />
        <Figure icon={<ClipboardTextIcon weight="duotone" className="size-5" />} label={t("archive.assignmentsLabel")} value={totals.assignments} />
        <Figure icon={<ExamIcon weight="duotone" className="size-5" />} label={t("archive.reportCards")} value={totals.cards} />
      </dl>

      <Section icon={<ChalkboardTeacherIcon weight="duotone" className="size-4" />} title={t("archive.classes")}>
        {data.classes.length === 0 ? (
          <p className="rounded-[--radius-md] bg-surface-muted p-4 text-sm text-fg-muted">{t("archive.classesNone")}</p>
        ) : (
          <TableScroll className="rounded-[--radius-lg] border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-fg-muted">
                  <th className="px-4 py-2.5 font-semibold">{t("archive.classes")}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{t("archive.attendance")}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{t("archive.assignmentsLabel")}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{t("archive.reportCards")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.classes.map((klass) => (
                  <tr key={klass.classId}>
                    <td className="px-4 py-2.5 font-medium text-fg">{klass.className}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg">{klass.registersTaken}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg">{klass.assignmentsSet}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg">{klass.reportCardsPublished}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Section>
    </div>
  );
}

/* ---- the admin's and principal's view ------------------------------------ */

async function SchoolYear({
  t,
  session,
  yearId,
}: {
  t: Translate;
  session: Awaited<ReturnType<typeof requireUser>>;
  yearId: string;
}) {
  const data = await schoolYearArchive(session, yearId);
  const attendance =
    data.attendance.marked === 0 ? "—" : `${Math.round((data.attendance.present / data.attendance.marked) * 100)}%`;

  return (
    <div className="space-y-5">
      <p className="text-sm text-fg-muted">{t("archive.schoolYearIntro")}</p>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Figure icon={<UsersThreeIcon weight="duotone" className="size-5" />} label={t("archive.pupilsOnRoll")} value={data.pupilsOnRoll} />
        <Figure
          icon={<ChecksIcon weight="duotone" className="size-5" />}
          label={t("archive.attendance")}
          value={attendance}
          hint={
            data.attendance.marked === 0
              ? undefined
              : t("archive.presentOfMarked", { present: data.attendance.present, marked: data.attendance.marked })
          }
        />
        <Figure icon={<ClipboardTextIcon weight="duotone" className="size-5" />} label={t("archive.reportCardsPublished")} value={data.reportCardsPublished} />
        <Figure icon={<SignOutIcon weight="duotone" className="size-5" />} label={t("archive.leavers")} value={data.leavers} />
        <Figure icon={<MedalIcon weight="duotone" className="size-5" />} label={t("archive.badgesArchived")} value={data.badgesArchived} />
        <Figure icon={<ExamIcon weight="duotone" className="size-5" />} label={t("archive.examSeriesTitle")} value={data.examSeries.length} />
      </dl>

      <Section icon={<ExamIcon weight="duotone" className="size-4" />} title={t("archive.examSeriesTitle")}>
        {data.examSeries.length === 0 ? (
          <p className="rounded-[--radius-md] bg-surface-muted p-4 text-sm text-fg-muted">{t("archive.examSeriesNone")}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.examSeries.map((series) => (
              <li key={series.id} className="flex items-center justify-between gap-3 rounded-[--radius-md] border border-border bg-surface px-3.5 py-2.5 text-sm">
                <span className="truncate font-medium text-fg">{series.name}</span>
                <Badge tone="neutral" size="sm">
                  {series.gradeLevel}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
