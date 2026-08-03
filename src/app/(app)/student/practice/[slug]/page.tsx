import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listTopics, normaliseLanguage } from "@/lib/quiz";
import { LanguageSwitch } from "@/components/language-switch";
import { Player } from "./player";

export const metadata: Metadata = { title: "Practice", robots: { index: false, follow: false } };

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireRole("STUDENT");
  const { slug } = await params;

  const topic = await db.quizTopic.findUnique({
    where: { slug },
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
        All practice
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{mine?.name ?? topic.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">{topic.chapter}</p>
        </div>
        <LanguageSwitch showLabel />
      </div>

      <Player
        slug={topic.slug}
        topicName={mine?.name ?? topic.name}
        totalCount={mine?.questionCount ?? 0}
        alreadyEarned={mine?.badgeEarned ?? false}
      />
    </div>
  );
}
