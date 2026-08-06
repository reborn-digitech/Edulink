import type { Metadata } from "next";
import Link from "next/link";
import { BrainIcon, MedalIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import {
  listTopics,
  normaliseLanguage,
  QUIZ_LEVELS,
  SUBJECT_LABEL,
  type QuizSubject,
} from "@/lib/quiz";
import { LanguageSwitch } from "@/components/language-switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

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
  searchParams: Promise<{ subject?: string; grade?: string }>;
}) {
  const ctx = await requireRole("STUDENT");
  const { subject, grade } = await searchParams;
  const t = await getT();

  const language = normaliseLanguage(ctx.user.prefs.locale);
  const topics = await listTopics(ctx, { subject, language });
  const subjects = [...new Set(topics.map((t) => t.subject))];
  // The drill bank made this list ten grades deep, so a class filter joined
  // the subject filter. Filtered AFTER the query on purpose: the grade chips
  // must list every class that exists, which the filtered rows can't tell us.
  const grades = [...new Set(topics.map((t) => t.classLevel))].sort((a, b) => a - b);
  const gradeNum = grade ? Number(grade) : null;
  const shown = gradeNum ? topics.filter((t) => t.classLevel === gradeNum) : topics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("feature.practice")}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t("practice.intro")}</p>
        </div>
        <LanguageSwitch showLabel />
      </div>

      {topics.length === 0 ? (
        <EmptyState
          icon={<BrainIcon weight="duotone" className="size-8" />}
          title={t("student.noTopics")}
          description={t("student.noTopicsBody")}
        />
      ) : (
        <>
          {subjects.length > 1 && (
            <nav aria-label={t("student.subjects")} className="flex flex-wrap gap-2">
              <Link
                href={`/student/practice${gradeNum ? `?grade=${gradeNum}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  !subject ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                }`}
              >
                {t("practice.allSubjects")}
              </Link>
              {subjects.map((s) => (
                <Link
                  key={s}
                  href={`/student/practice?subject=${s}${gradeNum ? `&grade=${gradeNum}` : ""}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    subject === s ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                  }`}
                >
                  {SUBJECT_LABEL[s as QuizSubject] ?? s}
                </Link>
              ))}
            </nav>
          )}

          {grades.length > 1 && (
            <nav aria-label={t("practice.allClasses")} className="flex flex-wrap gap-2">
              <Link
                href={`/student/practice${subject ? `?subject=${subject}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  !gradeNum ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                }`}
              >
                {t("practice.allClasses")}
              </Link>
              {grades.map((g) => (
                <Link
                  key={g}
                  href={`/student/practice?${subject ? `subject=${subject}&` : ""}grade=${g}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    gradeNum === g ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
                  }`}
                >
                  {t("practice.classN", { n: g })}
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
                          {SUBJECT_LABEL[topic.subject as QuizSubject] ?? topic.subject} ·{" "}
                          {t("practice.classN", { n: topic.classLevel })}
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

                    {topic.summary && (
                      <p className="mt-1.5 text-sm text-fg-muted">{topic.summary}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="accent" size="sm">
                        {t(QUIZ_LEVELS[topic.level - 1]?.labelKey ?? "practice.level1")}
                      </Badge>
                      <span className="text-xs text-fg-muted">
                        {t("practice.triedOfTotal", { seen: topic.seenCount, total: topic.questionCount })}
                      </span>
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
        </>
      )}
    </div>
  );
}
