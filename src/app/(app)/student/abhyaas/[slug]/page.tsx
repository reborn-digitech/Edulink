import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listTopics } from "@/lib/quiz";
import { Player } from "./player";

export const metadata: Metadata = { title: "Abhyaas", robots: { index: false, follow: false } };

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireRole("STUDENT");
  const { slug } = await params;

  const topic = await db.quizTopic.findUnique({
    where: { slug },
    select: { id: true, name: true, chapter: true, slug: true },
  });
  if (!topic) notFound();

  // The pupil's own progress against this topic, read through the same helper
  // the list uses so the two can never disagree about the level.
  const mine = (await listTopics(ctx)).find((t) => t.slug === slug);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/student/abhyaas"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        All practice
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{topic.name}</h1>
        <p className="mt-1 text-sm text-fg-muted">{topic.chapter}</p>
      </div>

      <Player
        slug={topic.slug}
        topicName={topic.name}
        totalCount={mine?.questionCount ?? 0}
        alreadyEarned={mine?.badgeEarned ?? false}
      />
    </div>
  );
}
