import { getT } from "@/lib/i18n/server";
import { QuizReviewQueuePage } from "@/components/quiz-review/queue-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("quizReview.nav") };
}

/** The generated bank's desk for the content team (the operator's copy is /root/quiz-review): edit, take down, put back, and generation started and stopped. */
export default function AppAdminQuizReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <QuizReviewQueuePage base="/appadmin/quiz-review" searchParams={searchParams} />;
}
