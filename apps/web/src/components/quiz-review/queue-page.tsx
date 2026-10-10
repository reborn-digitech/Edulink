import Link from "next/link";
import { COLLEGE_CLASS_LEVEL, isCollegeClassLevel, quizReviewQuerySchema, type QuizReviewQuery } from "@edulink/contracts";
import { requireAppAdmin } from "@/lib/tenancy";
import { listQueue, nextItem } from "@/lib/quiz-review";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import { ReviewDesk } from "./desk";
import { quizBoardKey } from "@/lib/quiz-board";

type Params = Record<string, string | string[] | undefined>;

/** The filters from the URL; anything that does not parse is dropped rather than refused. */
function filtersOf(sp: Params): Omit<QuizReviewQuery, "skip"> {
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([k, v]) => k !== "skip" && v));
  const parsed = quizReviewQuerySchema.omit({ skip: true }).safeParse(flat);
  return parsed.success ? parsed.data : {};
}

/**
 * The review queue, one page for the content team (/appadmin/quiz-review) and the operator
 * (/root/quiz-review): the counts a reviewer works against (the queue's remaining, under the filter,
 * their own today and in all, the languages still waiting), the filters, the desk with one item, the
 * waiting items by chapter and level in the queue's order, and every reviewer's count.
 */
export async function QuizReviewQueuePage({ base, searchParams }: { base: string; searchParams: Promise<Params> }) {
  const session = await requireAppAdmin();
  const t = await getT();
  const query = filtersOf(await searchParams);
  const [list, first] = await Promise.all([listQueue(session, query), nextItem(session, query)]);
  const subjectLabel = (s: string) => (s in SUBJECT_KEY ? t(SUBJECT_KEY[s as QuizSubject]) : s);
  const subjectLabels = Object.fromEntries([...new Set([...list.subjects, ...list.groups.map((g) => g.subject), ...(first.item ? [first.item.topic.subject] : [])])].map((s) => [s, subjectLabel(s)]));
  const all = { value: "", label: t("quizReview.all") };
  // quiz-board (11 Oct 2026): the board is a code (QUIZ_BOARDS); its name in the reader's language.
  const boardLabel = (b: string) => (quizBoardKey(b) ? t(quizBoardKey(b)!) : b);
  const chapterHref = (topicId: string, board: string | null) => {
    const q = new URLSearchParams({ topic: topicId, ...(board ? { board } : {}) });
    return `${base}?${q.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("quizReview.title")} description={t("quizReview.intro")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("quizReview.remaining")} value={list.remaining} tone="accent" />
        <StatTile label={t("quizReview.filteredLabel")} value={list.filtered} />
        <StatTile label={t("quizReview.mineToday")} value={list.mine.today} tone="ok" />
        <StatTile label={t("quizReview.mineTotal")} value={list.mine.total} />
      </div>
      <p className="text-sm text-fg-muted">{t("quizReview.languagesWaiting", { hi: list.languagesWaiting.hi, mr: list.languagesWaiting.mr })}</p>

      <DataToolbar
        facets={[
          { key: "board", label: t("quizReview.boardFacet"), value: query.board ?? "", options: [all, ...list.boards.map((b) => ({ value: b, label: boardLabel(b) }))], clears: ["topic"] },
          {
            key: "grade",
            label: t("quizReview.gradeFacet"),
            value: query.grade ? String(query.grade) : "",
            as: "select",
            options: [all, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: t("quizReview.gradeOption", { grade: i + 1 }) })), { value: String(COLLEGE_CLASS_LEVEL), label: t("practice.collegeLevel") }],
            clears: ["topic"],
          },
          { key: "subject", label: t("quizReview.subjectFacet"), value: query.subject ?? "", as: "select", options: [all, ...list.subjects.map((s) => ({ value: s, label: subjectLabel(s) }))], clears: ["topic"] },
          { key: "level", label: t("quizReview.levelFacet"), value: query.level ? String(query.level) : "", as: "select", options: [all, ...[1, 2, 3, 4, 5, 6].map((l) => ({ value: String(l), label: t("quizReview.levelOption", { level: l }) }))] },
        ]}
        extra={query.topic ? { topic: query.topic } : {}}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />

      {/* Keyed by the filters: a new filter is a fresh desk on the new queue's first item. */}
      <ReviewDesk key={JSON.stringify(query)} initial={first} query={query} subjectLabels={subjectLabels} translationsHref="/appadmin/translations" />

      {list.groups.length > 0 && (
        <Card>
          <CardHeader title={t("quizReview.byChapter")} description={t("quizReview.byChapterHint")} />
          <CardBody>
            <TableScroll>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t("quizReview.chapterCol")}</th>
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <th key={l} className="px-1 py-2 text-right font-medium">
                        {t("quizReview.levelOption", { level: l })}
                      </th>
                    ))}
                    <th className="py-2 pl-3 text-right font-medium">{t("quizReview.waitingCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.groups.map((g) => (
                    <tr key={`${g.topicId}|${g.board ?? ""}`} className="border-t border-border">
                      <td className="py-2 pr-3">
                        <Link href={chapterHref(g.topicId, g.board)} className="inline-flex min-h-11 flex-col justify-center text-accent-strong underline-offset-4 hover:underline">
                          <span>{g.name}</span>
                          <span className="text-xs text-fg-muted">
                            {[g.board ? boardLabel(g.board) : null, subjectLabel(g.subject), (isCollegeClassLevel(g.grade) ? t("practice.collegeLevel") : t("quizReview.gradeOption", { grade: g.grade }))].filter(Boolean).join(" · ")}
                          </span>
                        </Link>
                        {g.first && (
                          <Badge tone="accent" size="sm" className="ml-2">
                            {t("quizReview.firstBand")}
                          </Badge>
                        )}
                      </td>
                      {g.levels.map((n, i) => (
                        <td key={i} className="px-1 py-2 text-right tabular-nums">
                          {n || ""}
                        </td>
                      ))}
                      <td className="py-2 pl-3 text-right font-semibold tabular-nums">{g.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </CardBody>
        </Card>
      )}

      {list.reviewers.length > 0 && (
        <Card>
          <CardHeader title={t("quizReview.reviewers")} />
          <CardBody>
            <ul className="space-y-2 text-sm">
              {list.reviewers.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {r.name} <Badge tone="outline" size="sm">{t(r.role === "OPERATOR" ? "quizReview.roleOPERATOR" : "quizReview.roleAPP_ADMIN")}</Badge>
                  </span>
                  <span className="text-fg-muted">{t("quizReview.reviewerCounts", { accepted: r.accepted, discarded: r.discarded, languages: r.languages })}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
