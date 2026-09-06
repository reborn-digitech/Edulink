import type { Metadata } from "next";
import { nameCarriesSection } from "@/lib/codes";
import Link from "next/link";
import {
  CalendarCheckIcon,
  CaretRightIcon,
  ChalkboardTeacherIcon,
  StarIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import {
  ATTENDANCE_CONCERN_PERCENT,
  classInsights,
  parseSpan, windowFor,
  schoolSummary,
} from "@/lib/insights";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { CelebrationsLink } from "@/components/celebrations/celebrations-link";
import { EmptyState } from "@/components/ui/states";
import { formatDateKey } from "@/lib/dates";
import { WindowPicker } from "./window-picker";
import { schoolReviewDashboard } from "@/lib/reviews";
import { ReviewDashboard } from "@/components/reviews/review-dashboard";
import { currentAcademicYear } from "@/lib/academic-year";
import { currentTerms } from "@/lib/terms";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.dashboard") };
}

/**
 * The school, seen whole.
 *
 * THE TOP OF THE PAGE IS WHAT CAN STILL BE FIXED TODAY — registers not taken,
 * leave waiting for a decision — and the rest is the term's shape. A dashboard
 * that opens with a large number nobody can act on is decoration; a principal
 * looks at this between two meetings and needs the actionable thing first.
 *
 * NOTHING HERE RANKS A CHILD. Classes carry figures, because comparing classes
 * is a management question and no eleven-year-old is compared with their friend
 * by it. Pupils appear only inside a class, alphabetically, with concerns
 * flagged rather than ordered — see the note at the top of insights.ts.
 */
export default async function PrincipalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const { days } = await searchParams;

  // Clamped rather than trusted: this lands in a date range and then a query.
  const span = parseSpan(days);
  const window = await windowFor(ctx.schoolId, span);

  const insights = await classInsights(ctx, window);
  const summary = await schoolSummary(ctx, insights);
  const reviews = await schoolReviewDashboard(ctx);
  // The head shares the year's milestones with the office: start it, finish a
  // term, finish the year, take an accidental close back. The controls live on
  // the calendar page; this card is the head's door to them.
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const academicYear = await currentAcademicYear(ctx.schoolId);
  const terms = academicYear ? await currentTerms(ctx.schoolId, school.timezone) : [];
  const runningTerm = terms.find((term) => term.current && !term.finishedAt) ?? terms.filter((term) => !term.finishedAt).at(-1) ?? null;
  const concerns = insights.filter(
    (k) => k.attendance.percent !== null && k.attendance.percent < ATTENDANCE_CONCERN_PERCENT,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("principal.dashboard")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("principal.rangeTo", {
              from: formatDateKey(window.fromDateKey, { day: "numeric", month: "short" }),
              to: formatDateKey(window.toDateKey, { day: "numeric", month: "short" }),
            })}
          </p>
        </div>
        <WindowPicker span={span} />
      </div>

      {/* ---------------- the year's milestones ---------------- */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
          <CalendarCheckIcon weight="duotone" className="size-6 shrink-0 text-fg-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">
              {academicYear ? academicYear.name : t("admin.startYear")}
              <span className="ml-2 font-normal text-fg-muted">
                {academicYear
                  ? runningTerm
                    ? t("principal.termRuns", {
                        name: runningTerm.name,
                        date: formatDateKey(runningTerm.endDateKey, { day: "numeric", month: "long" }),
                      })
                    : t("principal.allTermsFinished")
                  : t("admin.startYearBody")}
              </span>
            </p>
          </div>
          {!academicYear ? (
            <Button asChild size="sm">
              <Link href="/admin/calendar">{t("admin.setUpYear")}</Link>
            </Button>
          ) : (
            <>
              {runningTerm && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin/calendar">{t("admin.finishTermCta", { name: runningTerm.name })}</Link>
                </Button>
              )}
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin/calendar">{t("admin.finishYearCta", { name: academicYear.name })}</Link>
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      {/* The head sends the wishes too. */}
      <CelebrationsLink session={ctx} />

      {/* ---------------- what can still be fixed today ---------------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t("principal.registersMissing")}
          value={String(summary.registersMissingToday)}
          tone={summary.registersMissingToday > 0 ? "warn" : "ok"}
        />
        <StatTile
          label={t("principal.leaveWaiting")}
          value={String(summary.pendingLeave)}
          tone={summary.pendingLeave > 0 ? "warn" : "ok"}
        />
        <StatTile
          label={t("principal.attendance")}
          value={summary.attendancePercent === null ? "—" : `${summary.attendancePercent}%`}
          hint={
            <>
              {t("principal.attendanceHint")}
              {" · "}
              <Link href="/attendance/history" className="font-medium text-accent-strong hover:underline">
                {t("attendanceHistory.link")}
              </Link>
            </>
          }
          tone={
            summary.attendancePercent !== null &&
            summary.attendancePercent < ATTENDANCE_CONCERN_PERCENT
              ? "warn"
              : "ok"
          }
        />
        <StatTile label={t("principal.pupils")} value={String(summary.pupils)} />
      </div>

      {summary.pendingLeave > 0 && (
        <Card>
          <Link href="/principal/leave" className="flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-warn-soft text-warn">
              <CalendarCheckIcon weight="duotone" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-fg">
                {summary.pendingLeave === 1
                  ? t("principal.leaveWaitingOne")
                  : t("principal.leaveWaitingMany", { count: summary.pendingLeave })}
              </span>
              <span className="block text-xs text-fg-muted">
                {t("principal.approvingArranges")}
              </span>
            </span>
            <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          </Link>
        </Card>
      )}

      {/* ---------------- classes needing a look ---------------- */}
      <Card>
        <CardHeader
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
          title={
            concerns.length > 0 ? t("principal.classesWorthALook") : t("principal.classes")
          }
          description={
            concerns.length > 0
              ? t("principal.belowLine", { percent: ATTENDANCE_CONCERN_PERCENT })
              : t("principal.nothingBelowLine")
          }
          action={
            <Link
              href={`/principal/classes?days=${span}`}
              className="text-sm font-semibold text-accent-strong hover:underline"
            >
              {t("principal.allOf", { count: insights.length })}
            </Link>
          }
        />
        <CardBody>
          {insights.length === 0 ? (
            <EmptyState
              title={t("principal.noClasses")}
              description={t("principal.noClassesBody")}
            />
          ) : concerns.length === 0 ? (
            <p className="text-sm text-fg-muted">
              {t("principal.everyClassAbove", { percent: ATTENDANCE_CONCERN_PERCENT })}
            </p>
          ) : (
            <ul className="space-y-2">
              {concerns.map((klass) => (
                <li key={klass.classId}>
                  <Link
                    href={`/principal/classes/${klass.classId}?days=${span}`}
                    className="flex flex-wrap items-center gap-3 rounded-[--radius-md] bg-surface-muted p-3.5 transition-colors hover:bg-surface"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-fg">
                        {klass.name}
                        {klass.section && !nameCarriesSection(klass.name, klass.section) ? ` · ${klass.section}` : ""}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {klass.pupils === 1
                          ? t("principal.pupilsOne")
                          : t("principal.pupilsMany", { count: klass.pupils })}{" "}
                        ·{" "}
                        {klass.sessionsTaken === 1
                          ? t("principal.registersTakenOne")
                          : t("principal.registersTakenMany", { count: klass.sessionsTaken })}
                      </span>
                    </span>
                    <span className="text-lg font-bold tabular-nums text-warn">
                      {klass.attendance.percent}%
                    </span>
                    <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* The teacher-review dashboard, the same one the admin's desk renders —
          the principal reads the numbers here and manages rounds on
          /admin/reviews, which their role already opens. Shown only once
          somebody has been rated: an empty promise is not a dashboard. */}
      {reviews.some((row) => row.allTime.responseCount > 0) && (
        <Card>
          <CardHeader
            title={t("reviews.title")}
            icon={<StarIcon weight="duotone" className="size-5" />}
            action={
              <Link
                href="/admin/reviews"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {t("reviews.manageRounds")}
                <CaretRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody>
            <ReviewDashboard rows={reviews} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
