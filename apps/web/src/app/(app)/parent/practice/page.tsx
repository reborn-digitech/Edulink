import type { Metadata } from "next";
import { ChildLeftBanner } from "../child-left";
import { BrainIcon, MedalIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { familyChildren, pickChild, childAccess } from "@/lib/family-child";
import { NotSharedState } from "@/components/family/not-shared";
import { normaliseLanguage, QUIZ_LEVELS, SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { childPracticeProgress } from "@/lib/practice-insights";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { quizBoardChoice, topicOnBoard, type QuizBoardChoice } from "@edulink/contracts";
import { classLevelLabel, QUIZ_BOARD_KEY, quizBoardKey, quizBoardOptions } from "@/lib/quiz-board";
import { PracticeBoardSwitch } from "@/components/practice-board-switch";

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
  searchParams: Promise<{ child?: string; board?: string }>;
}) {
  const session = await requireParent();
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };
  const { child: requested, board: boardParam } = await searchParams;

  // The children with what each lets the guardian see, opening on one the guardian may read (DS-1, 10 Oct 2026).
  const children = await familyChildren(session.user.id);
  const chosen = pickChild(children, requested) ?? children[0]!;
  const selectedId = chosen.studentMembershipId;

  // Quiz progress is learning results: an adult at a college shares it under RESULTS (practice-insights.ts asks the same).
  const access = await childAccess(session.user.id, selectedId, "RESULTS");
  if (access.refused) {
    return (
      <div className="space-y-5">
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/practice" />}
        <PageHeader title={t("practice.parentPracticeTitle", { name: chosen.name })} />
        <NotSharedState name={chosen.name} />
      </div>
    );
  }

  const language = normaliseLanguage(session.user.prefs.locale);
  const { childName, topics: everyTopic, weeklyCount, schoolBoard } = await childPracticeProgress(
    session.user.id,
    selectedId,
    language,
  );
  // quiz-board (11 Oct 2026): the child's school's board first, a switch to the other and to both, as on the child's own page.
  const board = quizBoardChoice(boardParam, schoolBoard);
  const boardHref = (value: QuizBoardChoice) => {
    const q = new URLSearchParams({ child: selectedId });
    if (value !== (schoolBoard ?? "ALL")) q.set("board", value);
    return `/parent/practice?${q.toString()}`;
  };
  const topics = everyTopic.filter((row) => topicOnBoard(row.board, board));

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

      {everyTopic.length > 0 && (
        <PracticeBoardSwitch
          label={t("quizBoard.switchLabel")}
          options={quizBoardOptions(schoolBoard).map((value) => ({ value, label: t(QUIZ_BOARD_KEY[value]) }))}
          current={board}
          hrefFor={boardHref}
        />
      )}

      {topics.length === 0 ? (
        <EmptyState
          icon={<BrainIcon weight="duotone" className="size-8" />}
          title={t("feature.practice")}
          description={everyTopic.length > 0 ? t("quizBoard.nothingOnBoard", { name: childName, board: t(QUIZ_BOARD_KEY[board]) }) : t("practice.parentPracticeEmpty", { name: childName })}
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
                <CardBody className="relative overflow-x-auto p-0" tabIndex={0} role="group">
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
                              {classLevelLabel(t, row.classLevel)}
                              {quizBoardKey(row.board) ? ` · ${t(quizBoardKey(row.board)!)}` : null}
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
