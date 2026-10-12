import Link from "next/link";
import { BrainIcon, ClockCounterClockwiseIcon, FlagIcon, GraduationCapIcon, MedalIcon, PlayIcon, TargetIcon } from "@phosphor-icons/react/ssr";
import type { PracticeTenant } from "@edulink/contracts";
import { listTopics, normaliseLanguage, QUIZ_LEVELS, SUBJECT_KEY, type TopicSummary } from "@/lib/quiz";
import { continueCard, revisionQueue, assignmentsForStudent, weeklyPracticeCount, WEEKLY_GOAL } from "@/lib/practice-insights";
import { collegeSubjectLabel, collegeTermLabel, prepListing, sectionFromQuery, streamListing } from "@/lib/college-practice";
import { classLevelLabel } from "@/lib/quiz-board";
import { getT } from "@/lib/i18n/server";
import type { ActiveContext } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ChipLinks, SegmentLinks } from "./segment-links";

export type CollegePracticeQuery = { section?: string; programme?: string; term?: string; grade?: string; subject?: string; page?: string };

/**
 * A COLLEGE STUDENT'S PRACTICE (college-content, the owner's decisions of 12 October 2026), drawn by
 * /student/practice when the tenant is a college (a school's page is unchanged):
 *
 *   "My stream" — the college's own streams' banks (generated from the syllabus units, and the college-wide
 *     placement banks), grouped by programme and subject, with a programme and a year-or-semester filter;
 *   "Competitive Exams Prep" — NCERT's chapters by class and subject, paged.
 *
 * Nothing else from the school bank lists (src/lib/practice-audience.ts). The cards above the list —
 * continue, the week's goal, revision, what a teacher set — are the school page's, read from the same
 * helpers, which apply the same rule.
 */
export async function CollegeStudentPractice({ ctx, tenant, query }: { ctx: ActiveContext; tenant: PracticeTenant; query: CollegePracticeQuery }) {
  const t = await getT();
  const language = normaliseLanguage(ctx.user.prefs.locale);
  const section = sectionFromQuery(query.section);
  const [topics, resume, weekly, revision, assigned] = await Promise.all([
    listTopics(ctx, { language, tenant }),
    continueCard(ctx, language),
    weeklyPracticeCount(ctx),
    revisionQueue(ctx, { language }),
    assignmentsForStudent(ctx, language),
  ]);
  const subjectName = (code: string) => collegeSubjectLabel(t, code, SUBJECT_KEY);
  const streamNames = tenant.streams.map((s) => t(`streams.${s}.name`)).join(", ");

  const href = (q: Record<string, string | number | null | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v !== null && v !== undefined && v !== "") p.set(k, String(v));
    return `/student/practice${p.size ? `?${p.toString()}` : ""}`;
  };

  const stream = streamListing(topics, { programme: query.programme, term: query.term });
  const prep = prepListing(topics, { grade: query.grade, subject: query.subject, page: query.page });

  return (
    <div className="space-y-6" data-testid="college-practice">
      <SegmentLinks
        label={t("collegePractice.sectionLabel")}
        icon={<GraduationCapIcon weight="bold" className="size-4" aria-hidden="true" />}
        current={section}
        options={[
          { value: "STREAM", label: t("collegePractice.sectionSTREAM"), href: href({}) },
          { value: "PREP", label: t("collegePractice.sectionPREP"), href: href({ section: "prep" }) },
        ]}
      />
      <p className="text-sm text-fg-muted">{section === "STREAM" ? t("collegePractice.streamIntro", { streams: streamNames || "—" }) : t("collegePractice.prepIntro")}</p>

      {(resume || revision.length > 0 || weekly > 0 || assigned.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {resume && (
            <Card interactive>
              <Link href={`/student/practice/${resume.slug}`} className="block h-full p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                  <PlayIcon weight="fill" className="size-3.5" />
                  {t("practice.continueTitle")}
                </p>
                <p className="mt-1 font-semibold text-fg">{resume.name}</p>
                <Badge tone="accent" size="sm" className="mt-2">
                  {t(QUIZ_LEVELS[resume.level - 1]?.labelKey ?? "practice.level1")}
                </Badge>
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
              <p className="mt-2 text-xs text-fg-muted">{t("practice.goalHint", { n: weekly, goal: WEEKLY_GOAL })}</p>
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
                <p className="mt-2 text-sm font-medium text-accent-strong">{t("practice.revisionStart")} →</p>
              </Link>
            </Card>
          )}
          {assigned.length > 0 && (
            <Card className="sm:col-span-3">
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                  <TargetIcon weight="duotone" className="size-3.5" />
                  {t("practice.assignedTitle")}
                </p>
                <ul className="mt-2 divide-y divide-border">
                  {assigned.map((a) => (
                    <li key={a.id} className="py-2">
                      <Link href={`/student/practice/${a.topicSlug}`} className="inline-flex min-h-11 items-center font-medium text-fg hover:underline">
                        {a.topicName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}

      {section === "STREAM" ? (
        stream.available === 0 ? (
          <EmptyState
            icon={<BrainIcon weight="duotone" className="size-8" />}
            title={t("collegePractice.noStreamTopics")}
            description={t("collegePractice.noStreamTopicsBody", { streams: streamNames || "—" })}
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href={href({ section: "prep" })}>{t("collegePractice.openPrep")}</Link>
              </Button>
            }
          />
        ) : (
          <>
            {stream.programmes.length > 1 && (
              <ChipLinks
                label={t("collegePractice.programmeLabel")}
                current={stream.programme ?? "all"}
                options={[
                  { value: "all", label: t("collegePractice.allProgrammes"), href: href({ term: stream.term }) },
                  ...stream.programmes.map((p) => ({ value: p, label: p, href: href({ programme: p, term: stream.term }) })),
                ]}
              />
            )}
            {stream.terms.length > 0 && (
              <ChipLinks
                label={t("collegePractice.termLabel")}
                current={stream.term ?? "all"}
                options={[
                  { value: "all", label: t("collegePractice.allTerms"), href: href({ programme: stream.programme }) },
                  ...stream.terms.map((term) => ({ value: term, label: collegeTermLabel(t, term), href: href({ programme: stream.programme, term }) })),
                ]}
              />
            )}
            {stream.groups.map((group) => (
              <section key={group.programme ?? "college-wide"} className="space-y-3" aria-label={group.programme ?? t("collegePractice.collegeWide")}>
                <h2 className="text-base font-semibold text-fg">{group.programme ?? t("collegePractice.collegeWide")}</h2>
                {group.subjects.map((s) => (
                  <div key={s.subject} className="space-y-2">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-fg-muted">{subjectName(s.subject)}</h3>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {s.topics.map((topic) => (
                        <li key={topic.id}>
                          <TopicCard topic={topic} caption={[topic.yearOrSemester ? collegeTermLabel(t, topic.yearOrSemester) : null].filter(Boolean).join(" · ")} t={t} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </>
        )
      ) : prep.available === 0 ? (
        <EmptyState icon={<BrainIcon weight="duotone" className="size-8" />} title={t("collegePractice.noPrepTopics")} />
      ) : (
        <>
          {prep.grades.length > 1 && (
            <ChipLinks
              label={t("practice.allClasses")}
              current={prep.grade ? String(prep.grade) : "all"}
              options={[
                { value: "all", label: t("practice.allClasses"), href: href({ section: "prep" }) },
                ...prep.grades.map((g) => ({ value: String(g), label: classLevelLabel(t, g), href: href({ section: "prep", grade: g }) })),
              ]}
            />
          )}
          {prep.subjects.length > 1 && (
            <ChipLinks
              label={t("student.subjects")}
              current={prep.subject ?? "all"}
              options={[
                { value: "all", label: t("practice.allSubjects"), href: href({ section: "prep", grade: prep.grade }) },
                ...prep.subjects.map((s) => ({ value: s, label: subjectName(s), href: href({ section: "prep", grade: prep.grade, subject: s }) })),
              ]}
            />
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {prep.shown.map((topic) => (
              <li key={topic.id}>
                <TopicCard topic={topic} caption={`${subjectName(topic.subject)} · ${classLevelLabel(t, topic.classLevel)} · ${t("quizBoard.NCERT")}`} t={t} />
              </li>
            ))}
          </ul>
          {prep.pages > 1 && (
            <nav aria-label={t("people.pageOf", { page: prep.page, pages: prep.pages })} className="flex items-center justify-between gap-3">
              <Button asChild={prep.page > 1} variant="secondary" size="sm" disabled={prep.page === 1}>
                {prep.page > 1 ? <Link href={href({ section: "prep", grade: prep.grade, subject: prep.subject, page: prep.page - 1 })}>{t("people.previous")}</Link> : <span>{t("people.previous")}</span>}
              </Button>
              <span className="text-sm text-fg-muted">{t("people.pageOf", { page: prep.page, pages: prep.pages })}</span>
              <Button asChild={prep.page < prep.pages} variant="secondary" size="sm" disabled={prep.page >= prep.pages}>
                {prep.page < prep.pages ? <Link href={href({ section: "prep", grade: prep.grade, subject: prep.subject, page: prep.page + 1 })}>{t("people.next")}</Link> : <span>{t("people.next")}</span>}
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function TopicCard({ topic, caption, t }: { topic: TopicSummary; caption: string; t: Awaited<ReturnType<typeof getT>> }) {
  return (
    <Card interactive className="h-full">
      <Link href={`/student/practice/${topic.slug}`} className="block p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {caption ? <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{caption}</p> : null}
            <p className="mt-0.5 font-semibold text-fg">{topic.name}</p>
          </div>
          {topic.badgeEarned && <MedalIcon weight="fill" className="size-6 shrink-0 text-accent-strong" aria-label={t("student.badgeEarned")} />}
        </div>
        {topic.summary && <p className="mt-1.5 hidden text-sm text-fg-muted sm:line-clamp-2 sm:block">{topic.summary}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="accent" size="sm">
            {t(QUIZ_LEVELS[topic.level - 1]?.labelKey ?? "practice.level1")}
          </Badge>
          <span className="text-xs text-fg-muted">{t("practice.triedOfTotal", { seen: topic.seenCount, total: topic.questionCount })}</span>
          {topic.tierCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong">
              <MedalIcon weight="fill" className="size-3.5" />
              {topic.tierCount}/6
            </span>
          )}
        </div>
      </Link>
    </Card>
  );
}
