import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, SealQuestionIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { getBankTopic, listBankQuestions } from "@/lib/app-admin";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { QuestionRow } from "./question-row";
import { getT } from "@/lib/i18n/server";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.questionBank") };
}

export default async function BankTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ difficulty?: string; lang?: string }>;
}) {
  const { difficulty: rawDifficulty, lang } = await searchParams;
  const t = await getT();
  const session = await requireAppAdmin();
  const { topicId } = await params;

  const topic = await getBankTopic(session, topicId);
  if (!topic) notFound();

  const allQuestions = await listBankQuestions(session, topicId);
  const difficulties = [...new Set(allQuestions.map((q) => q.difficulty))].sort((a, b) => a - b);
  const difficulty = rawDifficulty && difficulties.includes(Number(rawDifficulty)) ? Number(rawDifficulty) : null;
  // "Missing Hindi" is the curator's question; the chip names the language a
  // question still lacks.
  const langFilter = lang === "hi" || lang === "mr" ? lang : null;
  const questions = allQuestions.filter(
    (q) => (difficulty === null || q.difficulty === difficulty) && (!langFilter || !q.languages.includes(langFilter)),
  );
  const narrowed = difficulty !== null || Boolean(langFilter);

  return (
    <div className="space-y-5">
      <Link
        href="/appadmin/bank"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("appadmin.questionBank")}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={topic.name} description={<>{t("appadmin.classN", { n: topic.classLevel })} · {topic.chapter}</>} />
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href={`/appadmin/bank/${topic.id}/new`}>{t("appadmin.addQuestion")}</Link>
        </Button>
      </div>

      {(allQuestions.length > 3 || narrowed) && (
        <DataToolbar
          facets={[
            ...(difficulties.length > 1
              ? [{ key: "difficulty", label: t("appadmin.difficultyFilter"), value: difficulty === null ? "" : String(difficulty), options: [{ value: "", label: t("vacancies.filterAll"), count: allQuestions.length }, ...difficulties.map((d) => ({ value: String(d), label: t("appadmin.difficultyN", { n: d }), count: allQuestions.filter((q) => q.difficulty === d).length }))] }]
              : []),
            {
              key: "lang",
              label: t("appadmin.missingFilter"),
              value: langFilter ?? "",
              options: [
                { value: "", label: t("vacancies.filterAll") },
                { value: "hi", label: t("appadmin.missingHindi"), count: allQuestions.filter((q) => !q.languages.includes("hi")).length },
                { value: "mr", label: t("appadmin.missingMarathi"), count: allQuestions.filter((q) => !q.languages.includes("mr")).length },
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {questions.length === 0 && narrowed ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<SealQuestionIcon weight="duotone" className="size-8" />}
          title={t("appadmin.noQuestionsYet")}
          description={t("appadmin.noQuestionsBody")}
          action={
            <Button asChild>
              <Link href={`/appadmin/bank/${topic.id}/new`}>{t("appadmin.addQuestion")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {questions.map((question) => (
            <QuestionRow key={question.id} topicId={topic.id} question={question} />
          ))}
        </ul>
      )}
    </div>
  );
}
