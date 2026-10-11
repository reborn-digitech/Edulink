import { getT } from "@/lib/i18n/server";
import { QuizReviewQueuePage } from "@/components/quiz-review/queue-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("quizReview.nav") };
}

/**
 * The generated bank's desk for the operator, inside the operator's own frame (the layout asks for the
 * superuser). The same bank, the same acts and the same generation card as the content team's
 * /appadmin/quiz-review; an edit or a take-down made here records the role OPERATOR.
 */
export default function RootQuizReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <QuizReviewQueuePage base="/root/quiz-review" searchParams={searchParams} />;
}
