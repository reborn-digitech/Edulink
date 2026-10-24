import { COLLEGE_CLASS_LEVEL, QUIZ_BANK_STATES, QUIZ_GEN_SUBJECTS, quizBankChaptersQuerySchema, quizReviewQuerySchema, type QuizReviewQuery } from "@edulink/contracts";
import { requireAppAdmin } from "@/lib/tenancy";
import { listQueue, nextItem } from "@/lib/quiz-review";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { bankChapters, bankMatrix } from "@/lib/bank-desk";
import { BankChapterGroups, BankMatrixCard, bankSubjectLabel } from "./bank-views";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewDesk } from "./desk";
import { GenerationCard } from "./generation-card";
import { deskJobs } from "@/lib/quiz-jobs-desk";
import { deskCollegeSyllabi } from "@/lib/quiz-college"; // college-content (12 Oct 2026)

type Params = Record<string, string | string[] | undefined>;

/** The filters from the URL; anything that does not parse is dropped rather than refused. */
function filtersOf(sp: Params): Omit<QuizReviewQuery, "skip"> {
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([k, v]) => k !== "skip" && v));
  const parsed = quizReviewQuerySchema.omit({ skip: true }).safeParse(flat);
  return parsed.success ? parsed.data : {};
}

/** The page's own parameters as they came, for the links that change some of them. */
function flatOf(sp: Params): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

/**
 * The generated bank's desk, one page for the content team (/appadmin/quiz-review) and the operator
 * (/root/quiz-review), as the owner decided on 11 October 2026 (it was the review queue): the bank's
 * counts (generated, served, taken down, held for a figure, under the filter, the reader's own changes),
 * the filters, the desk with one item (Edit, Take down, Put back, Skip), the generation card (Start,
 * Stop, the live line, the model servers), the items by chapter and level in the plan's order, and who
 * changed what.
 *
 * Since 20 October 2026 (bank-desk, the owner's ask) the page reads the whole bank by class and subject under the
 * generation card: a matrix of classes by subjects with a board switch, then every chapter grouped by class and subject
 * in its book's order (each opening its own page of questions in three languages, chapter/[slug]), then the one-at-a-time
 * desk. The board, class and subject in the URL narrow all three.
 */
export async function QuizReviewQueuePage({ base, searchParams }: { base: string; searchParams: Promise<Params> }) {
  const session = await requireAppAdmin();
  const t = await getT();
  const raw = await searchParams;
  const current = flatOf(raw);
  const query = filtersOf(raw);
  const parsedPick = quizBankChaptersQuerySchema.safeParse({ board: current.board, grade: current.grade, subject: current.subject });
  const pick = parsedPick.success ? parsedPick.data : {};
  const [list, first, jobs, college, matrix, chapters] = await Promise.all([
    listQueue(session, query),
    nextItem(session, query),
    deskJobs(session),
    deskCollegeSyllabi(session),
    bankMatrix(session, { board: pick.board }),
    bankChapters(session, pick),
  ]);
  const subjectLabel = (s: string) => (s in SUBJECT_KEY ? t(SUBJECT_KEY[s as QuizSubject]) : bankSubjectLabel(s, t));
  const subjectLabels = Object.fromEntries([...new Set([...list.subjects, ...list.groups.map((g) => g.subject), ...(first.item ? [first.item.topic.subject] : [])])].map((s) => [s, subjectLabel(s)]));
  const all = { value: "", label: t("quizReview.all") };
  const genSubjects = Object.fromEntries(QUIZ_GEN_SUBJECTS.map((s) => [s, subjectLabel(s)]));
  const pickSubjects = [...new Set([...QUIZ_GEN_SUBJECTS, ...matrix.college.subjects, ...list.subjects])];
  const keep = (keys: string[]) => Object.fromEntries(keys.filter((k) => current[k]).map((k) => [k, current[k]!]));

  return (
    <div className="space-y-5">
      <PageHeader title={t("quizReview.title")} description={t("quizReview.intro")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("quizReview.total")} value={list.total} tone="accent" />
        <StatTile label={t("quizReview.served")} value={list.served} tone="ok" />
        <StatTile label={t("quizReview.takenDown")} value={list.takenDown} tone={list.takenDown > 0 ? "danger" : "neutral"} />
        <StatTile label={t("quizReview.held")} value={list.held} tone={list.held > 0 ? "warn" : "neutral"} />
      </div>
      <GenerationCard initial={jobs} subjectLabels={genSubjects} college={college} />

      <BankMatrixCard matrix={matrix} base={base} current={current} t={t} />

      <Card id="chapters" className="scroll-mt-20">
        <CardHeader title={t("bankDesk.chaptersTitle")} description={t("bankDesk.chaptersHint")} />
        <CardBody className="space-y-4">
          <DataToolbar
            facets={[
              {
                key: "grade",
                label: t("quizReview.gradeFacet"),
                value: pick.grade ? String(pick.grade) : "",
                as: "select",
                options: [all, ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 3), label: t("quizReview.gradeOption", { grade: i + 3 }) })), { value: String(COLLEGE_CLASS_LEVEL), label: t("practice.collegeLevel") }],
              },
              { key: "subject", label: t("quizReview.subjectFacet"), value: pick.subject ?? "", as: "select", options: [all, ...pickSubjects.map((s) => ({ value: s, label: subjectLabel(s) }))] },
            ]}
            extra={keep(["board", "level", "state"])}
            label={t("bankDesk.chaptersTitle")}
            labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
          />
          <BankChapterGroups data={chapters} base={base} t={t} />
        </CardBody>
      </Card>

      <section className="space-y-3" aria-labelledby="bank-walk">
        <div>
          <h2 id="bank-walk" className="text-base font-semibold">
            {t("bankDesk.walkTitle")}
          </h2>
          <p className="text-sm text-fg-muted">{t("bankDesk.walkHint")}</p>
          <p className="text-sm text-fg-muted">
            {t("quizReview.filtered", { count: list.filtered })} · {t("quizReview.mineToday")}: {list.mine.today} · {t("quizReview.mineTotal")}: {list.mine.total}
          </p>
        </div>
        <DataToolbar
          facets={[
            { key: "level", label: t("quizReview.levelFacet"), value: query.level ? String(query.level) : "", as: "select", options: [all, ...[1, 2, 3, 4, 5, 6].map((l) => ({ value: String(l), label: t("quizReview.levelOption", { level: l }) }))] },
            { key: "state", label: t("quizReview.stateFacet"), value: query.state ?? "", options: [all, ...QUIZ_BANK_STATES.map((st) => ({ value: st, label: t(`quizReview.state${st}`) }))] },
          ]}
          extra={keep(["board", "grade", "subject", "topic"])}
          label={t("bankDesk.walkTitle")}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
        {/* Keyed by the filters: a new filter is a fresh desk on the new queue's first item. */}
        <ReviewDesk key={JSON.stringify(query)} initial={first} query={query} subjectLabels={subjectLabels} />
      </section>

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
                  <span className="text-fg-muted">{t("quizReview.reviewerCounts", { edits: r.edits, takenDown: r.takenDown, putBack: r.putBack })}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
