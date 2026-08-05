import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, LockKeyIcon } from "@phosphor-icons/react/ssr";
import { requireUser, AccessError } from "@/lib/tenancy";
import { getThread } from "@/lib/remarks";
import { markRead } from "../actions";
import { Avatar } from "@/components/ui/avatar";
import { ReplyBox } from "./reply-box";
import { formatInZone, relativeTime } from "@/lib/dates";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.message"), robots: { index: false, follow: false } };
}

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const locale = await getLocale();
  const session = await requireUser();
  const { threadId } = await params;

  let thread;
  try {
    thread = await getThread(session, threadId);
  } catch (error) {
    // A thread from another school, or another parent's child, is a 404 — not a
    // 403, which would confirm it exists. (§6)
    if (error instanceof AccessError) notFound();
    throw error;
  }

  // Opening the thread is what marks it read.
  await markRead(threadId);

  const school = await db.school.findUnique({
    where: { id: thread.schoolId },
    select: { timezone: true },
  });
  const timezone = school?.timezone ?? "UTC";

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <Link
        href="/remarks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        All messages
      </Link>

      <header className="flex items-start gap-3 rounded-[--radius-lg] border border-border bg-surface p-4">
        <Avatar avatarKey={thread.student.avatarKey} name={thread.student.fullName} size="md" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight text-fg">{thread.subject}</h1>
          {/* "About X, with Y" was true when this was a note a teacher wrote to
              a family. The child is in the room now, so it is a conversation
              BETWEEN people rather than one about somebody. */}
          <p className="text-sm text-fg-muted">
            {thread.student.fullName} · {thread.teacher.name} · guardians
          </p>
        </div>
      </header>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
        <LockKeyIcon weight="fill" className="size-3.5" />
        {/* NAMES THE PUPIL, because they are in it. Leaving them out of the
            list while they read it is the kind of small untruth that makes
            somebody wonder what else the page is not saying. */}
        Only {thread.student.name}, {thread.teacher.name}, {thread.student.name}&rsquo;s guardians
        and school admins can see this
      </p>

      <ol className="mt-5 space-y-4">
        {thread.messages.map((message) => (
          <li
            key={message.id}
            className={cn("flex gap-3", message.mine && "flex-row-reverse")}
          >
            <Avatar avatarKey={message.authorAvatar} name={message.authorName} size="sm" />
            <div className={cn("min-w-0 max-w-[85%]", message.mine && "text-right")}>
              <p className="text-xs text-fg-muted">
                <span className="font-semibold text-fg">
                  {message.mine ? "You" : message.authorName}
                </span>{" "}
                · <time dateTime={message.createdAt.toISOString()}>
                  {relativeTime(message.createdAt, undefined, locale)}
                </time>
              </p>
              <div
                className={cn(
                  "mt-1 inline-block whitespace-pre-wrap rounded-[--radius-lg] px-4 py-2.5 text-left text-[0.9375rem] leading-relaxed",
                  message.mine
                    ? "bg-accent text-accent-fg"
                    : "border border-border bg-surface text-fg",
                )}
              >
                {message.body}
              </div>
              <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                {formatInZone(message.createdAt, timezone, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {message.mine && (message.readByOthers ? " · Read" : " · Sent")}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {thread.closedAt ? (
        <p className="mt-6 rounded-[--radius-md] bg-surface-muted p-4 text-center text-sm text-fg-muted">
          This conversation has been closed.
        </p>
      ) : (
        <ReplyBox threadId={thread.id} className="mt-6" />
      )}
    </div>
  );
}
