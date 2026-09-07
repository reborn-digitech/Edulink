import type { Metadata } from "next";
import { ChildLeftBanner } from "../child-left";
import { BrainIcon, MedalIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { normaliseLanguage, QUIZ_LEVELS, SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { childPracticeProgress } from "@/lib/practice-insights";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.practice") };
}

/**
 * A child's practice, for their guardian: the chapters touched, the rung they
 * stand on, and the badges they keep. Encouragement needs visibility — the
 * strongest home–school loop in the app was invisible to the one person meant
 * to close it.
 *
 * Same non-negotiable as the child's own page: THIS child against THIS ladder,
 * no comparison with anybody else's child, anywhere, ever.
 */
export default async function ParentPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await requireParent();
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };
  const { child: requested } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const selectedId =
    requested && children.some((c) => c.studentMembershipId === requested)
      ? requested
      : children[0]!.studentMembershipId;

  const language = normaliseLanguage(session.user.prefs.locale);
  const { childName, topics, weeklyCount } = await childPracticeProgress(
    session.user.id,
    selectedId,
    language,
  );

  const subjects = [...new Set(topics.map((row) => row.subject))];

  return (
    <div className="space-y-5">
      {children.length > 1 && (
        <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/practice" />
      )}
      {(() => {
        const sel = children.find((c) => c.studentMembershipId === selectedId);
        return sel?.leftAt ? (
          <ChildLeftBanner child={{ studentMembershipId: sel.studentMembershipId, studentUserId: sel.studentUserId, name: sel.name, schoolName: sel.schoolName, leftAt: sel.leftAt }} />
        ) : null;
      })()}

      <PageHeader title={t("practice.parentPracticeTitle", { name: childName })} description={t("practice.parentPracticeIntro", { name: childName })} />

      {topics.length === 0 ? (
        <EmptyState
          icon={<BrainIcon weight="duotone" className="size-8" />}
          title={t("feature.practice")}
          description={t("practice.parentPracticeEmpty", { name: childName })}
        />
      ) : (
        <>
          <Card>
            <CardBody className="flex items-center gap-3">
              <BrainIcon weight="duotone" className="size-6 text-accent-strong" />
              <p className="text-sm text-fg">
                {t("practice.parentWeekly", { n: weeklyCount })}
              </p>
            </CardBody>
          </Card>

          {subjects.map((subjectKey) => {
            const rows = topics.filter((row) => row.subject === subjectKey);
            return (
              <Card key={subjectKey}>
                <CardHeader
                  icon={<BrainIcon weight="duotone" className="size-5" />}
                  title={subjectName(subjectKey)}
                />
                <CardBody className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                        <th className="px-4 py-2 font-medium">{t("practice.colChapter")}</th>
                        <th className="px-4 py-2 font-medium">{t("practice.colLevel")}</th>
                        <th className="px-4 py-2 text-right font-medium">{t("practice.colTried")}</th>
                        <th className="px-4 py-2 text-right font-medium">{t("practice.colBadges")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.slug} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-fg">{row.name}</span>
                            <span className="ml-2 text-xs text-fg-muted">
                              {t("practice.classN", { n: row.classLevel })}
                            </span>
                            {row.cleanCompletion && (
                              <CheckCircleIcon
                                weight="fill"
                                className="ml-1.5 inline size-4 text-ok"
                                aria-label={t("student.badgeEarned")}
                              />
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge tone="accent" size="sm">
                              {t(QUIZ_LEVELS[row.level - 1]?.labelKey ?? "practice.level1")}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right text-fg-muted">{row.seenCount}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="inline-flex items-center gap-1 font-medium text-accent-strong">
                              <MedalIcon weight="fill" className="size-3.5" />
                              {row.tierCount}/6
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
