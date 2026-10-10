import { getT } from "@/lib/i18n/server";
import { QuizReviewQueuePage } from "@/components/quiz-review/queue-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("quizReview.nav") };
}

/**
 * The generated bank's review queue for the operator, inside the operator's own frame (the layout
 * asks for the superuser). The same queue, the same stamps and the same counts as the content team's
 * /appadmin/quiz-review; a stamp made here records the role OPERATOR.
 */
export default function RootQuizReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <QuizReviewQueuePage base="/root/quiz-review" searchParams={searchParams} />;
}
