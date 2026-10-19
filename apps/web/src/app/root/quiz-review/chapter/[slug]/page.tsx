import { getT } from "@/lib/i18n/server";
import { ChapterQuestionsPage } from "@/components/quiz-review/chapter-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("bankDesk.chaptersTitle") };
}

/**
 * One chapter's questions for the operator (bank-desk, 20 Oct 2026), inside the operator's frame; the content team's
 * twin is /appadmin/quiz-review/chapter/[slug]. The same list, language toggle and desk actions; an act here records
 * the role OPERATOR.
 */
export default async function RootBankChapterPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  return <ChapterQuestionsPage base="/root/quiz-review" slug={slug} searchParams={searchParams} bankEditor />;
}
