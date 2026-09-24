import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BroomIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ChalkboardTeacherIcon,
  ConfettiIcon,
  EnvelopeSimpleIcon,
  GraduationCapIcon,
  UsersThreeIcon,
  ExamIcon,
  WarningIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getChecklist } from "@/lib/onboarding";
import { db } from "@/lib/db";
import { currentAcademicYear } from "@/lib/academic-year";
import { currentTerms } from "@/lib/terms";
import { unstaffedLessons } from "@/lib/timetable";
import { listHolidays, nextEntry } from "@/lib/holidays";
import { registersDue } from "@/lib/attendance";
import { todayKey, formatDateKey } from "@/lib/dates";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { CelebrationsLink } from "@/components/celebrations/celebrations-link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { WelcomeBanner } from "./welcome-banner";
import { cn } from "@/lib/cn";
import { getT, getRelativeTime, getLocale } from "@/lib/i18n/server";
import { schoolJobStory, JOB_COUNT_LABELS, JOB_ATTENTION_KEYS } from "@/lib/job-health";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.schoolOverview") };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
  const when = await getRelativeTime();
  const ctx = await requireRole("ADMIN");
  const { welcome } = await searchParams;

  const [school, jobStory] = await Promise.all([
    db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { name: true, code: true, timezone: true },
    }),
    schoolJobStory(ctx),
  ]);

  const dateKey = todayKey(school.timezone);
  const [examSeriesCount, examPublishedCount, reportCardsPublished] = await Promise.all([
    db.examSeries.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
    db.examSeries.count({ where: { schoolId: ctx.schoolId, archivedAt: null, publishedAt: { not: null } } }),
    db.reportCard.count({ where: { schoolId: ctx.schoolId, status: "PUBLISHED" } }),
  ]);

  const [
    checklist,
    teacherCount,
    studentCount,
    classCount,
    pendingInvites,
    registers,
    academicYear,
    calendar,
  ] = await Promise.all([
      getChecklist(ctx.schoolId),
      // ON ROLL / ON STAFF, not "ever": a leaver keeps status ACTIVE and gets
      // a `leftAt` (school-record.ts is explicit that every "who is here" query
      // filters leftAt), so a count without it silently grows by every pupil
      // who ever graduated — the headline read 48 for a 40-pupil school after
      // two years of a three-year simulation.
      db.membership.count({ where: { schoolId: ctx.schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null } }),
      db.membership.count({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
      db.class.count({ where: { schoolId: ctx.schoolId, archivedAt: null } }),
      db.invite.count({ where: { schoolId: ctx.schoolId, status: "PENDING" } }),
      // The registers the school EXPECTS today — none on a closed day, none
      // from a class with nobody in it — against the ones taken.
      registersDue(ctx.schoolId, dateKey),
      currentAcademicYear(ctx.schoolId),
      // From today on: the dashboard is asking "what is coming up", and a
      // finished break is not that. The calendar page shows the whole year.
      listHolidays(ctx.schoolId, { fromKey: dateKey }),
    ]);

  const classesTotal = registers.expected.length;
  const todaySessions = registers.taken.length;
  // Null when nothing is expected — a holiday, a Sunday, or no class with
  // pupils yet — so the card neither warns nor claims 0 % of nothing.
  const attendanceTaken = classesTotal === 0 ? null : Math.round((todaySessions / classesTotal) * 100);
  const coming = nextEntry(calendar, dateKey);
  // The running term, for the year strip's milestone CTA. The one to offer is
  // the term today falls in (or the last unfinished one once the dates have
  // run out) — finishing and closing both live on the calendar page.
  const terms = academicYear ? await currentTerms(ctx.schoolId, school.timezone) : [];
  const runningTerm = terms.find((term) => term.current && !term.finishedAt) ?? terms.filter((term) => !term.finishedAt).at(-1) ?? null;
  // The gap between a drawn timetable and a staffed one — the office's cue to
  // hire, shown only when there is a hole and there are classes to have one.
  const staffing = classCount > 0 ? await unstaffedLessons(ctx.schoolId) : { slots: 0, classes: 0 };

  return (
    <div className="space-y-6">
      {welcome === "1" && <WelcomeBanner schoolName={school.name} schoolCode={school.code} />}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={school.name} description={<>{formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" }, locale)} ·{" "}
            {t("admin.schoolCode")}{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-fg">
              {school.code}
            </code></>} />
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/invites/new">{t("admin.invitePeople")}</Link>
        </Button>
      </div>

      {/*
        ---------------- the school year ----------------

        Two states, and the difference between them is the whole point. With no
        year set up this is a call to action, because badges cannot reset until
        one exists and nobody would guess that from anywhere else in the app.
        Once a year is running it collapses to one quiet line: a banner that
        never changes is wallpaper, and the next thing an admin needs from this
        area is not "start a year" but "when is the next holiday".
      */}
      {!academicYear ? (
        <Card className="border-accent/40 bg-accent-soft/30">
          <CardBody className="flex flex-wrap items-center gap-4 pt-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">
              <GraduationCapIcon weight="fill" className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-fg">{t("admin.startYear")}</p>
              <p className="mt-0.5 text-sm text-fg-muted">{t("admin.startYearBody")}</p>
            </div>
            <Button asChild>
              <Link href="/admin/calendar">{t("admin.setUpYear")}</Link>
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
            <CalendarBlankIcon weight="duotone" className="size-6 shrink-0 text-fg-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">
                {academicYear.name}
                <span className="ml-2 font-normal text-fg-muted">
                  {coming
                    ? t("admin.nextUp", {
                        name: coming.name,
                        date: formatDateKey(coming.startDateKey, {
                          day: "numeric",
                          month: "long",
                        }),
                      })
                    : t("admin.nothingAhead")}
                </span>
              </p>
            </div>
            {/* The year's milestone CTAs, shared with the principal's page:
                finish the running term, finish the year. Both are links —
                the calendar page carries the confirmations. */}
            {runningTerm && (
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin/calendar#terms">{t("admin.finishTermCta", { name: runningTerm.name })}</Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/calendar#year-heading">{t("admin.finishYearCta", { name: academicYear.name })}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/calendar#calendar-heading">{t("admin.updateCalendar")}</Link>
            </Button>
          </CardBody>
        </Card>
      )}

      {/* ---------------- setup checklist ---------------- */}
      {!checklist.complete ? (
        <Card>
          <CardHeader
            icon={<ConfettiIcon weight="duotone" className="size-5" />}
            title={t("admin.finishSetup")}
            description={t("admin.setupCount", {
              done: checklist.done,
              total: checklist.total,
            })}
            action={
              <span className="text-sm font-bold tabular-nums text-accent-strong">
                {Math.round((checklist.done / checklist.total) * 100)}%
              </span>
            }
          />
          <CardBody>
            <div
              className="mb-4 h-2 overflow-hidden rounded-full bg-surface-sunken"
              role="progressbar"
              aria-valuenow={checklist.done}
              aria-valuemin={0}
              aria-valuemax={checklist.total}
              aria-label={t("admin.setupProgress")}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-[--dur-slow] ease-[--ease-out]"
                style={{ width: `${(checklist.done / checklist.total) * 100}%` }}
              />
            </div>

            <ul className="space-y-1.5">
              {checklist.steps.map((step) => (
                <li key={step.id}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-[--radius-md] border p-3",
                      step.done ? "border-transparent bg-ok-soft/50" : "border-border bg-surface",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full",
                        step.done ? "bg-ok text-white" : "border-2 border-border-strong",
                      )}
                    >
                      {step.done && <CheckCircleIcon weight="fill" className="size-5" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          step.done ? "text-fg-muted line-through" : "text-fg",
                        )}
                      >
                        {t(step.titleKey)}
                      </p>
                      <p className="truncate text-xs text-fg-muted">
                        {t(step.descriptionKey, step.descriptionVars)}
                      </p>
                    </div>

                    {!step.done &&
                      (step.blockedBy ? (
                        <Badge tone="neutral" size="sm">
                          {t("admin.createClassFirst")}
                        </Badge>
                      ) : (
                        <Button asChild size="sm" variant="soft">
                          <Link href={step.href}>{t(step.ctaKey)}</Link>
                        </Button>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : (
        <Card className="border-ok/40 bg-ok-soft/40">
          <CardBody className="flex items-center gap-3 pt-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ok text-white">
              <CheckCircleIcon weight="fill" className="size-6" />
            </span>
            <div>
              <p className="font-semibold text-fg">{t("admin.fullySetUp")}</p>
              <p className="text-sm text-fg-muted">{t("admin.fullySetUpBody")}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---------------- what needs the office today ---------------- */}
      {/* Two doors, not four counts. "48 pupils" is a fact the directory
          already holds; "7 of 8 registers taken" and "3 invitations waiting"
          are things somebody can act on before lunch. */}
      {/* Who to wish today: the office keeps the birthday list, and this is
          where it looks for it. */}
      <CelebrationsLink session={ctx} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className={attendanceTaken !== null && attendanceTaken < 100 ? "border-warn/40" : undefined}>
          <Link href="/admin/attendance" className="flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
              <EnvelopeSimpleIcon weight="duotone" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-fg">{t("admin.registerTaken")}</span>
              <span className="block text-xs text-fg-muted">
                {classCount === 0
                  ? t("admin.noClassesYet")
                  : t("admin.takenToday", { done: todaySessions, total: classesTotal })}
              </span>
            </span>
            <span className="shrink-0 text-lg font-bold tabular-nums text-fg">
              {attendanceTaken === null ? "—" : `${attendanceTaken}%`}
            </span>
          </Link>
        </Card>
        <Card className={pendingInvites > 0 ? "border-warn/40" : undefined}>
          <Link href="/admin/invites" className="flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
              <UsersThreeIcon weight="duotone" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-fg">{t("nav.people")}</span>
              <span className="block text-xs text-fg-muted">
                {pendingInvites > 0
                  ? t("admin.invitesPending", { count: pendingInvites })
                  : t("admin.peopleSummary", { teachers: teacherCount, students: studentCount, classes: classCount })}
              </span>
            </span>
          </Link>
        </Card>
      </div>

      {/* ---------------- exams & report cards ---------------- */}
      {classCount > 0 && (
        <Card>
          <CardHeader
            icon={<ExamIcon weight="duotone" className="size-5" />}
            title={t("exams.adminCardTitle")}
            description={
              examSeriesCount === 0
                ? t("exams.adminCardNone")
                : t("exams.adminCardBody", { scheduled: examSeriesCount, published: examPublishedCount, cards: reportCardsPublished })
            }
          />
          <CardBody className="flex flex-wrap gap-2 pt-0">
            <Button asChild size="sm">
              <Link href="/admin/exams">{t("exams.scheduleExams")}</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/teacher/exams">{t("exams.enterMarks")}</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/classes">{t("classes.reportCards")}</Link>
            </Button>
          </CardBody>
        </Card>
      )}

      {/* ---------------- lessons nobody teaches ----------------
          Shown only when the grid has a hole. A lesson with no teacher is a
          vacancy, and the answer is to hire — so this card names the gap and
          points at both doors: the timetable, to fill it from existing staff,
          and the vacancies board, to advertise for someone new. */}
      {staffing.slots > 0 && (
        <Card className="border-warn/40">
          <CardHeader
            icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
            title={t("admin.staffingGapTitle")}
            description={
              staffing.classes === 1
                ? t("admin.staffingGapBodyOne", { slots: staffing.slots })
                : t("admin.staffingGapBody", { slots: staffing.slots, classes: staffing.classes })
            }
          />
          <CardBody className="flex flex-wrap gap-2 pt-0">
            <Button asChild size="sm">
              <Link href="/admin/vacancies/new">{t("admin.staffingPostVacancy")}</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/timetable">{t("admin.staffingOpenTimetable")}</Link>
            </Button>
          </CardBody>
        </Card>
      )}

      {/* ---------------- overnight housekeeping ----------------
          Shown ONLY when the latest runs actually touched this school — a
          permanent card pointing at a permanent "nothing happened" teaches
          people to stop looking, the Feedback-menu rule. */}
      {jobStory.entries.length > 0 && (
        <Card>
          <CardHeader
            icon={<BroomIcon weight="duotone" className="size-5" />}
            title={t("admin.jobStoryTitle")}
            description={t("admin.jobStoryBody")}
          />
          <CardBody className="pt-0">
            {jobStory.entries.some((e) => (e.counts.stuck ?? 0) > 0) && (
              <p className="mb-3 flex items-start gap-2 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium leading-relaxed text-danger">
                <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("admin.jobStoryStuck")}
              </p>
            )}
            {jobStory.entries.some((e) => (e.counts.missing ?? 0) > 0) && (
              <p className="mb-3 flex items-start gap-2 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium leading-relaxed text-danger">
                <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("admin.jobStoryMissing")}
              </p>
            )}
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
              {jobStory.entries.map((entry) => (
                <div key={entry.job} className="contents">
                  <dt className="font-mono text-xs leading-6 text-fg-muted">{entry.job}</dt>
                  <dd className="flex flex-wrap items-center gap-x-3 gap-y-1 text-fg">
                    {Object.entries(entry.counts).map(([key, value]) => (
                      <span key={key} className={JOB_ATTENTION_KEYS.has(key) ? "inline-flex items-center gap-1 font-semibold text-danger" : "inline-flex items-center gap-1"}>
                        <span className="font-semibold tabular-nums">{value}</span>
                        <span className={JOB_ATTENTION_KEYS.has(key) ? "" : "text-fg-muted"}>
                          {JOB_COUNT_LABELS[key] ? t(JOB_COUNT_LABELS[key]) : key}
                        </span>
                      </span>
                    ))}
                    <span className="text-xs text-fg-subtle">{when(entry.at)}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      )}

      {/* ---------------- next steps ---------------- */}
      {teacherCount === 0 && (
        <EmptyState
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
          title={t("admin.noTeachersYet")}
          description={t("admin.noTeachersBody")}
          action={
            <Button asChild iconRight={<ArrowRightIcon weight="bold" />}>
              <Link href="/admin/invites/new?role=TEACHER">{t("admin.inviteFirstTeacher")}</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="ghost">
              <Link href="/admin/classes/new">{t("admin.orCreateClass")}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
