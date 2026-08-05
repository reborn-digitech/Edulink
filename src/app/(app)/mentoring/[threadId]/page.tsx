import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, EyeIcon } from "@phosphor-icons/react/ssr";
import { requireUser, AccessError } from "@/lib/tenancy";
import { getMentorship } from "@/lib/mentoring";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MentorPanel } from "./panel";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.mentoring"),
  robots: { index: false, follow: false },
};
}

export default async function MentorThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const ctx = await requireUser();
  const { threadId } = await params;

  let thread;
  try {
    thread = await getMentorship(ctx, threadId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/mentoring"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        All mentoring
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          {thread.studentName} &amp; {thread.expertName}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{thread.purpose}</p>
      </div>

      {/* Said to EVERY reader, including the child, before they read a word.
          Nobody should discover afterwards that their messages were visible. */}
      <p className="flex items-start gap-2 rounded-[--radius-md] border border-border bg-surface-muted p-3 text-xs text-fg-muted">
        <EyeIcon weight="bold" className="mt-0.5 size-4 shrink-0" />
        <span>
          This conversation is not private. {thread.studentName}&apos;s guardians and
          {" "}{thread.schoolName} can read every message.
        </span>
      </p>

      {thread.awaitingConsent && (
        <Badge tone="warn" size="sm">
          Waiting for a guardian to agree — nobody can send a message yet
        </Badge>
      )}
      {thread.status === "CLOSED" && (
        <Badge tone="neutral" size="sm">This mentorship has ended</Badge>
      )}

      <Card>
        <CardBody className="pt-5">
          <MentorPanel
            threadId={thread.id}
            canPost={thread.canPost}
            awaitingConsent={thread.awaitingConsent}
            isGuardian={thread.isGuardian}
            canClose={thread.isGuardian || thread.isStaff}
            messages={thread.messages.map((m) => ({
              id: m.id,
              body: m.body,
              createdAt: m.createdAt.toISOString(),
              authorName: m.authorName,
              mine: m.mine,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
