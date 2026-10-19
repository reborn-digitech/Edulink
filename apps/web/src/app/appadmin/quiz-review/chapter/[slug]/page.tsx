import { getT } from "@/lib/i18n/server";
import { ChapterQuestionsPage } from "@/components/quiz-review/chapter-page";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("bankDesk.chaptersTitle") };
}

/** One chapter's questions for the content team (bank-desk, 20 Oct 2026); the operator's twin is /root/quiz-review/chapter/[slug]. */
export default async function AppAdminBankChapterPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  return <ChapterQuestionsPage base="/appadmin/quiz-review" slug={slug} searchParams={searchParams} bankEditor />;
}
