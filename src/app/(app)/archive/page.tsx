import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArchiveIcon,
  ChalkboardTeacherIcon,
  ChartLineUpIcon,
  ChecksIcon,
  ClipboardTextIcon,
  MedalIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import {
  listClosedYears,
  pupilYearArchive,
  teacherYearArchive,
  schoolYearArchive,
  type ArchiveYear,
} from "@/lib/year-archive";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";

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
 * it, not in five near-identical pages. The layout stays the same everywhere:
 * pick a closed year, read what it left behind.
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

  // Which school's years, and which pupil if any. A parent's school comes
  // from the selected child, never from their own session — they may have
  // children at two schools.
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
    const selected =
      children.find((c) => c.studentMembershipId === requestedChild) ?? children[0]!;
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

  const years = await listClosedYears(schoolId);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("archive.title")}</h1>
        <p className="text-sm text-fg-muted">{t("archive.intro")}</p>
      </header>

      {children.length > 1 && (
        <nav aria-label={t("archive.childLabel")} className="flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.studentMembershipId}
              href={`/archive?child=${child.studentMembershipId}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                child.studentMembershipId === pupilMembershipId
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-muted text-fg-muted hover:text-fg"
              }`}
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
          description={t("archive.noYearsBody")}
        />
      ) : (
        <YearView
          t={t}
          years={years}
          requestedYear={requestedYear}
          childParam={children.length > 1 ? pupilMembershipId : null}
          session={session}
          pupilMembershipId={pupilMembershipId}
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
}: {
  t: Translate;
  years: ArchiveYear[];
  requestedYear: string | undefined;
  childParam: string | null;
  session: Awaited<ReturnType<typeof requireUser>>;
  pupilMembershipId: string | null;
}) {
  const selectedYear = years.find((y) => y.id === requestedYear) ?? years[0]!;
  const childSuffix = childParam ? `&child=${childParam}` : "";

  return (
    <>
      <nav aria-label={t("archive.yearLabel")} className="flex flex-wrap gap-2">
        {years.map((year) => (
          <Link
            key={year.id}
            href={`/archive?year=${year.id}${childSuffix}`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              year.id === selectedYear.id
                ? "bg-accent text-accent-fg"
                : "bg-surface-muted text-fg-muted hover:text-fg"
            }`}
          >
            {year.name}
          </Link>
        ))}
      </nav>

      {pupilMembershipId ? (
        <PupilYear t={t} session={session} membershipId={pupilMembershipId} yearId={selectedYear.id} />
      ) : session.role === "TEACHER" ? (
        <TeacherYear t={t} session={session} yearId={selectedYear.id} />
      ) : (
        <SchoolYear t={t} session={session} yearId={selectedYear.id} />
      )}
    </>
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

  return (
    <div className="space-y-4">
      <section aria-label={t("archive.reportCards")}>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <ClipboardTextIcon weight="duotone" className="size-4 text-accent" />
          {t("archive.reportCards")}
        </h2>
        {data.reportCards.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("archive.noReportCards")}</p>
        ) : (
          <ul className="space-y-2">
            {data.reportCards.map((card) => (
              <li key={card.id}>
                <Card interactive>
                  <Link href={`/report-cards/${card.id}`} className="block p-3.5">
                    <p className="font-medium">{card.title}</p>
                    <p className="text-xs text-fg-muted">{card.className}</p>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label={t("archive.attendance")}>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <ChecksIcon weight="duotone" className="size-4 text-accent" />
          {t("archive.attendance")}
        </h2>
        <p className="text-sm text-fg-muted">
          {data.attendance.marked === 0
            ? t("archive.attendanceNone")
            : t("archive.presentOfMarked", {
                present: data.attendance.present,
                marked: data.attendance.marked,
              })}
        </p>
      </section>

      <section aria-label={t("archive.marks")}>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <ChartLineUpIcon weight="duotone" className="size-4 text-accent" />
          {t("archive.marks")}
        </h2>
        <p className="text-sm text-fg-muted">
          {data.marks.graded === 0
            ? t("archive.marksNone")
            : `${t("archive.gradedCount", { count: data.marks.graded })}${
                data.marks.averagePercent === null
                  ? ""
                  : `, ${t("archive.averagePercent", { percent: data.marks.averagePercent })}`
              }`}
        </p>
      </section>

      <section aria-label={t("archive.badges")}>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <MedalIcon weight="duotone" className="size-4 text-accent" />
          {t("archive.badges")}
        </h2>
        {data.badges.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("archive.badgesNone")}</p>
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
      </section>
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

  return (
    <section aria-label={t("archive.classes")}>
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <ChalkboardTeacherIcon weight="duotone" className="size-4 text-accent" />
        {t("archive.classes")}
      </h2>
      {data.classes.length === 0 ? (
        <p className="text-sm text-fg-muted">{t("archive.classesNone")}</p>
      ) : (
        <ul className="space-y-2">
          {data.classes.map((klass) => (
            <li key={klass.classId}>
              <Card>
                <CardBody>
                  <p className="font-medium">{klass.className}</p>
                  <p className="text-xs text-fg-muted">
                    {[
                      t("archive.registersTaken", { count: klass.registersTaken }),
                      t("archive.assignmentsSet", { count: klass.assignmentsSet }),
                      t("archive.cardsPublished", { count: klass.reportCardsPublished }),
                    ].join(" · ")}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
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

  const figures = [
    { label: t("archive.pupilsOnRoll"), value: data.pupilsOnRoll },
    {
      label: t("archive.attendance"),
      value:
        data.attendance.marked === 0
          ? "—"
          : `${Math.round((data.attendance.present / data.attendance.marked) * 100)}%`,
    },
    { label: t("archive.reportCardsPublished"), value: data.reportCardsPublished },
    { label: t("archive.leavers"), value: data.leavers },
    { label: t("archive.badgesArchived"), value: data.badgesArchived },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">{t("archive.schoolYearIntro")}</p>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {figures.map((figure) => (
          <Card key={figure.label}>
            <CardBody>
              <dt className="text-xs text-fg-muted">{figure.label}</dt>
              <dd className="text-2xl font-bold tracking-tight">{figure.value}</dd>
            </CardBody>
          </Card>
        ))}
      </dl>

      <section aria-label={t("archive.examSeriesTitle")}>
        <h2 className="mb-2 text-sm font-semibold">{t("archive.examSeriesTitle")}</h2>
        {data.examSeries.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("archive.examSeriesNone")}</p>
        ) : (
          <ul className="space-y-1.5">
            {data.examSeries.map((series) => (
              <li key={series.id} className="text-sm">
                <span className="font-medium">{series.name}</span>
                <span className="text-fg-muted"> · {series.gradeLevel}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
