import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { practiceTopicsWhereFor } from "@/lib/practice-audience"; // college-content (12 Oct 2026)
import { listTopics, normaliseLanguage } from "@/lib/quiz";
import { LanguageSwitch } from "@/components/language-switch";
import { Player } from "./player";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.practice"), robots: { index: false, follow: false } };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getT();
  const ctx = await requireRole("STUDENT");
  const { slug } = await params;

  // college-content (12 Oct 2026): a chapter this school or college does not list is not found here either.
  const topic = await db.quizTopic.findFirst({
    where: { slug, ...(await practiceTopicsWhereFor(ctx.schoolId)) },
    select: { id: true, name: true, chapter: true, slug: true },
  });
  if (!topic) notFound();

  const language = normaliseLanguage(ctx.user.prefs.locale);

  // The pupil's own progress against this topic, read through the same helper
  // the list uses so the two can never disagree about the level.
  const mine = (await listTopics(ctx, { language })).find((t) => t.slug === slug);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/student/practice"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("practice.allPractice")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={mine?.name ?? topic.name} description={topic.chapter} />
        <LanguageSwitch showLabel />
      </div>

      <Player
        // Keyed on the reading language: the switcher saves and refreshes, this
        // page re-renders with the new locale, and the remount makes the player
        // re-fetch the question it is showing — otherwise the stem fetched at
        // mount stays in the old language until "Next".
        key={language}
        slug={topic.slug}
        topicName={mine?.name ?? topic.name}
        totalCount={mine?.questionCount ?? 0}
        alreadyEarned={mine?.badgeEarned ?? false}
      />
    </div>
  );
}
