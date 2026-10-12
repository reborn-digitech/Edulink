import type { Metadata } from "next";
import Link from "next/link";
import {
  BrainIcon,
  MedalIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  FlagIcon,
  PlayIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import {
  listTopics,
  normaliseLanguage,
  schoolQuizBoard,
  QUIZ_LEVELS,
  SUBJECT_KEY,
  type QuizSubject,
} from "@/lib/quiz";
import { LanguageSwitch } from "@/components/language-switch";
import {
  enrolledGradeLevel,
  continueCard,
  weeklyPracticeCount,
  WEEKLY_GOAL,
  revisionQueue,
  assignmentsForStudent,
} from "@/lib/practice-insights";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { isCollegeKind } from "@edulink/contracts";
import { institutionKindOf } from "@/lib/modules";
import { practiceListing } from "@/lib/practice-list";
import { quizBoardChoice, type QuizBoardChoice } from "@edulink/contracts";
import { classLevelLabel, QUIZ_BOARD_KEY, quizBoardKey, quizBoardOptions } from "@/lib/quiz-board";
import { PracticeBoardSwitch } from "@/components/practice-board-switch";
// college-content (12 Oct 2026): a college's page is its own (its streams' banks and the prep section).
import { practiceTenantOf } from "@/lib/practice-audience";
import { CollegeStudentPractice } from "@/components/college-practice/student-practice";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.practice") };
}

/**
 * Practice — the topic list.
 *
 * NO LEADERBOARD, NO TOTAL, NO "3 OF 7". Same rule as the profile page: a child
 * comparing their number with the child next to them is the thing this app is
 * meant not to do. What each card shows is where THIS child is on THIS topic's
 * ladder, which is a fact about them and about nobody else.
 */
export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; grade?: string; page?: string; board?: string; section?: string; programme?: string; term?: string }>;
}) {
  const ctx = await requireRole("STUDENT");
  const { subject, grade, page: pageParam, board: boardParam, section, programme, term } = await searchParams;
  // college-content (12 Oct 2026): a college draws its two sections below the same header; a school's page goes on exactly as before.
  const tenant = await practiceTenantOf(ctx.schoolId);
  if (tenant.college) {
    const t = await getT();
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader title={t("feature.practice")} description={t("practice.intro")} />
          <div className="flex items-center gap-3">
            <Link href="/student/practice/journey" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent-strong underline-offset-2 hover:underline">
              <MedalIcon weight="fill" className="size-4" />
              {t("journey.title")}
            </Link>
            <LanguageSwitch showLabel />
          </div>
        </div>
        <CollegeStudentPractice ctx={ctx} tenant={tenant} query={{ section, programme, term, grade, subject, page: pageParam }} />
      </div>
    );
  }
  // quiz-board (11 Oct 2026): the school's board first (School.board → NCERT or Balbharati), a switch to
  // the other and to both; a school with neither opens on both. The choice lives in the URL.
  const schoolBoard = await schoolQuizBoard(ctx.schoolId);
  const board = quizBoardChoice(boardParam, schoolBoard);
  const boardQuery = board === (schoolBoard ?? "ALL") ? "" : `board=${board}&`;
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };

  const language = normaliseLanguage(ctx.user.prefs.locale);
  // BOTH filters are applied AFTER the query, on purpose: each chip row must
  // list every option that exists, which filtered rows can't tell us. Passing
  // `subject` into the query once made the subject row list only the selected
  // subject — one entry, which the `length > 1` guard below then hid, so
  // choosing a subject deleted the only way back out of it.
  const [topics, enrolledGrade, resume, weekly, revision, assigned, kind] = await Promise.all([
    listTopics(ctx, { language, board }),
    enrolledGradeLevel(ctx),
    continueCard(ctx, language),
    weeklyPracticeCount(ctx),
    revisionQueue(ctx, { language }),
    assignmentsForStudent(ctx, language),
    institutionKindOf(ctx.schoolId),
  ]);
  // No explicit choice defaults to the child's OWN grade — a Grade 5 pupil
  // should land on Grade 5 chapters, not on Class 3 civics. "all" is the
  // explicit way out. The subject row lists the SELECTED class's own lineup
  // from unfiltered rows. A college student gets no class chips and the
  // placement banks first, and every list is paged (B-13, lib/practice-list.ts).
  const college = isCollegeKind(kind ?? "SCHOOL");
  const listing = practiceListing(topics, { college, subject, grade, enrolledGrade, page: pageParam });
  const { grades, gradeNum, shown } = listing;
  const subjectsShown = listing.subjects;
  const pageHref = (n: number) => `/student/practice?${boardQuery}${subject ? `subject=${subject}&` : ""}grade=${gradeNum ?? "all"}&page=${n}`;
  // A board's chapters list its own classes and subjects: switching keeps the class, drops the subject.
  const boardHref = (value: QuizBoardChoice) => {
    const q = new URLSearchParams();
    if (value !== (schoolBoard ?? "ALL")) q.set("board", value);
    if (gradeNum || grade === "all") q.set("grade", gradeNum ? String(gradeNum) : "all");
    return `/student/practice${q.size ? `?${q.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t("feature.practice")} description={t("practice.intro")} />
        <div className="flex items-center gap-3">
          <Link
            href="/student/practice/journey"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong underline-offset-2 hover:underline"
          >
            <MedalIcon weight="fill" className="size-4" />
            {t("journey.title")}
          </Link>
          <LanguageSwitch showLabel />
        </div>
      </div>

      {/* quiz-board: the school's board first; a college (no board of the two) opens on both, its placement banks (no board) in every position. */}
      <PracticeBoardSwitch
        label={t("quizBoard.switchLabel")}
        options={quizBoardOptions(schoolBoard).map((value) => ({ value, label: t(QUIZ_BOARD_KEY[value]) }))}
        current={board}
        hrefFor={boardHref}
      />

      {topics.length === 0 ? (
        <EmptyState
          icon={<BrainIcon weight="duotone" className="size-8" />}
          title={t("student.noTopics")}
          description={t("student.noTopicsBody")}
        />
      ) : (
        <>
          {(resume || revision.length > 0 || weekly > 0) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {resume && (
                <Card interactive>
                  <Link href={`/student/practice/${resume.slug}`} className="block h-full p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                      <PlayIcon weight="fill" className="size-3.5" />
                      {t("practice.continueTitle")}
                    </p>
                    <p className="mt-1 font-semibold text-fg">{resume.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone="accent" size="sm">
                        {t(QUIZ_LEVELS[resume.level - 1]?.labelKey ?? "practice.level1")}
                      </Badge>
                      {resume.tierCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong">
                          <MedalIcon weight="fill" className="size-3.5" />
                          {resume.tierCount}/6
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-fg-muted">
                      {resume.remainingForBadge !== null && resume.nextTierName
                        ? t("practice.continueBadgeHint", {
                            n: resume.remainingForBadge,
                            tier: resume.nextTierName,
                          })
                        : t("practice.continueAllProven")}
                    </p>
                  </Link>
                </Card>
              )}
              <Card>
                <div className="p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                    <FlagIcon weight="fill" className="size-3.5" />
                    {t("practice.goalTitle")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-fg">
                    {Math.min(weekly, WEEKLY_GOAL)}
                    <span className="text-sm font-medium text-fg-muted"> / {WEEKLY_GOAL}</span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, Math.round((weekly * 100) / WEEKLY_GOAL))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-fg-muted">
                    {t("practice.goalHint", { n: weekly, goal: WEEKLY_GOAL })}
                  </p>
                </div>
              </Card>
              {revision.length > 0 && (
                <Card interactive>
                  <Link href="/student/practice/revision" className="block h-full p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                      <ClockCounterClockwiseIcon weight="fill" className="size-3.5" />
                      {t("practice.revisionTitle")}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-fg">{revision.length}</p>
                    <p className="mt-2 text-xs text-fg-muted">
                      {t("practice.revisionHint", { n: revision.length })}
                    </p>
                    <p className="mt-2 text-sm font-medium text-accent-strong">
                      {t("practice.revisionStart")} →
                    </p>
                  </Link>
                </Card>
              )}
            </div>
          )}

          {assigned.length > 0 && (
            <Card>
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                  <FlagIcon weight="duotone" className="size-3.5" />
                  {t("practice.assignedTitle")}
                </p>
                <ul className="mt-2 divide-y divide-border">
                  {assigned.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link
                        href={`/student/practice/${a.topicSlug}`}
                        className="min-w-0 font-medium text-fg hover:underline"
                      >
                        {a.topicName}
                      </Link>
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-fg-muted">
                          {t("practice.assignedTarget", { tier: a.targetTierName, level: a.targetLevel })}
                        </span>
                        {a.reached ? (
                          <span className="inline-flex items-center gap-1 font-medium text-ok">
                            <CheckCircleIcon weight="fill" className="size-3.5" />
                            {t("practice.assignedReached")}
                          </span>
                        ) : (
                          <span className="font-medium text-accent-strong">
                            {t("practice.assignedKeepGoing")}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Class first, then subject — you pick where you are before what
              you study, and the subject row below lists that class's own
              NCERT lineup. */}
          {grades.length > 1 && (
            <nav aria-label={t("practice.allClasses")} className="flex flex-wrap gap-2">
              <Link
                href={`/student/practice?${boardQuery}${subject ? `subject=${subject}&` : ""}grade=all`}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium ${
                  !gradeNum ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                }`}
              >
                {t("practice.allClasses")}
              </Link>
              {grades.map((g) => (
                <Link
                  key={g}
                  href={`/student/practice?${boardQuery}${subject ? `subject=${subject}&` : ""}grade=${g}`}
                  className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium ${
                    gradeNum === g ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                  }`}
                >
                  {classLevelLabel(t, g)}
                </Link>
              ))}
            </nav>
          )}

          {subjectsShown.length > 1 && (
            <nav aria-label={t("student.subjects")} className="flex flex-wrap gap-2">
              <Link
                href={`/student/practice?${boardQuery}grade=${gradeNum ?? "all"}`}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium ${
                  !subject ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                }`}
              >
                {t("practice.allSubjects")}
              </Link>
              {subjectsShown.map((s) => (
                <Link
                  key={s}
                  href={`/student/practice?${boardQuery}subject=${s}&grade=${gradeNum ?? "all"}`}
                  className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium ${
                    subject === s ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                  }`}
                >
                  {subjectName(s)}
                </Link>
              ))}
            </nav>
          )}

          <ul className="grid gap-3 sm:grid-cols-2">
            {shown.map((topic) => (
              <li key={topic.id}>
                <Card interactive className="h-full">
                  <Link href={`/student/practice/${topic.slug}`} className="block p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                          {subjectName(topic.subject)}
                          {college ? null : <> · {classLevelLabel(t, topic.classLevel)}</>}
                          {/* quiz-board: the card says its board. */}
                          {quizBoardKey(topic.board) ? <> · {t(quizBoardKey(topic.board)!)}</> : null}
                        </p>
                        <p className="mt-0.5 font-semibold text-fg">{topic.name}</p>
                      </div>
                      {topic.badgeEarned && (
                        <MedalIcon
                          weight="fill"
                          className="size-6 shrink-0 text-accent-strong"
                          aria-label={t("student.badgeEarned")}
                        />
                      )}
                    </div>

                    {/* The chapter's description is read on the chapter, not on the list: 34 of them made the page 5,000 px on a phone. Two lines of it on a desk. */}
                    {topic.summary && (
                      <p className="mt-1.5 hidden text-sm text-fg-muted sm:line-clamp-2 sm:block">{topic.summary}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="accent" size="sm">
                        {t(QUIZ_LEVELS[topic.level - 1]?.labelKey ?? "practice.level1")}
                      </Badge>
                      <span className="text-xs text-fg-muted">
                        {t("practice.triedOfTotal", { seen: topic.seenCount, total: topic.questionCount })}
                      </span>
                      {topic.tierCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong"
                          title={t("practice.tierBadges", { n: topic.tierCount })}
                        >
                          <MedalIcon weight="fill" className="size-3.5" />
                          {topic.tierCount}/6
                        </span>
                      )}
                      {topic.completed && !topic.badgeEarned && (
                        <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
                          <CheckCircleIcon weight="fill" className="size-3.5" />
                          {t("practice.finished")}
                        </span>
                      )}
                    </div>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>

          {listing.pages > 1 && (
            <nav aria-label={t("people.pageOf", { page: listing.page, pages: listing.pages })} className="flex items-center justify-between gap-3">
              <Button asChild={listing.page > 1} variant="secondary" size="sm" disabled={listing.page === 1}>
                {listing.page > 1 ? <Link href={pageHref(listing.page - 1)}>{t("people.previous")}</Link> : <span>{t("people.previous")}</span>}
              </Button>
              <span className="text-sm text-fg-muted">{t("people.pageOf", { page: listing.page, pages: listing.pages })}</span>
              <Button asChild={listing.page < listing.pages} variant="secondary" size="sm" disabled={listing.page >= listing.pages}>
                {listing.page < listing.pages ? <Link href={pageHref(listing.page + 1)}>{t("people.next")}</Link> : <span>{t("people.next")}</span>}
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
