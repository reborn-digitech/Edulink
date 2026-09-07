import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { getBankQuestion, getBankTopic } from "@/lib/app-admin";
import { translationConfigured } from "@/lib/translate";
import { Card, CardBody } from "@/components/ui/card";
import { QuestionForm } from "../../question-form";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.editQuestion") };
}

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ topicId: string; questionId: string }>;
}) {
  const t = await getT();
  const session = await requireAppAdmin();
  const { topicId, questionId } = await params;

  const [topic, question] = await Promise.all([
    getBankTopic(session, topicId),
    getBankQuestion(session, questionId),
  ]);
  if (!topic || !question || question.topicId !== topic.id) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/appadmin/bank/${topic.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {topic.name}
      </Link>

      <PageHeader title={t("appadmin.editQuestion")} description={t("appadmin.editIntro")} />

      <Card>
        <CardBody>
          <QuestionForm
            topicId={topic.id}
            questionId={question.id}
            translationOn={translationConfigured()}
            initial={{
              difficulty: question.difficulty,
              stem: question.stem,
              choices: question.choices,
              answerIndex: question.answerIndex,
              solution: question.solution,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
