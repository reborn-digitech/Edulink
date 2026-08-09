import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { getBankTopic } from "@/lib/app-admin";
import { translationConfigured } from "@/lib/translate";
import { Card, CardBody } from "@/components/ui/card";
import { QuestionForm } from "../../question-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.addQuestion") };
}

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const t = await getT();
  const session = await requireAppAdmin();
  const { topicId } = await params;

  const topic = await getBankTopic(session, topicId);
  if (!topic) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/appadmin/bank/${topic.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {topic.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t("appadmin.addQuestion")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("appadmin.addQuestionIntro")}</p>
      </div>

      <Card>
        <CardBody>
          <QuestionForm topicId={topic.id} translationOn={translationConfigured()} />
        </CardBody>
      </Card>
    </div>
  );
}
