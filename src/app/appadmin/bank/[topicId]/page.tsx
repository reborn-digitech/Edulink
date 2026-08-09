import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, SealQuestionIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { getBankTopic, listBankQuestions } from "@/lib/app-admin";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { QuestionRow } from "./question-row";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.questionBank") };
}

export default async function BankTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const t = await getT();
  const session = await requireAppAdmin();
  const { topicId } = await params;

  const topic = await getBankTopic(session, topicId);
  if (!topic) notFound();

  const questions = await listBankQuestions(session, topicId);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{topic.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("appadmin.classN", { n: topic.classLevel })} · {topic.chapter}
          </p>
        </div>
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href={`/appadmin/bank/${topic.id}/new`}>{t("appadmin.addQuestion")}</Link>
        </Button>
      </div>

      {questions.length === 0 ? (
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
