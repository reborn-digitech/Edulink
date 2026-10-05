import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, LockKeyIcon } from "@phosphor-icons/react/ssr";
import { requireUser, AccessError } from "@/lib/tenancy";
import { getThread, markThreadRead } from "@/lib/remarks";
import { getT } from "@/lib/i18n/server";
import { Avatar } from "@/components/ui/avatar";
import { PersonLink } from "@/components/person-link";
import { ReplyBox } from "./reply-box";
import { ThreadLive } from "./thread-live";
import { formatInZone, relativeTime } from "@/lib/dates";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.message"), robots: { index: false, follow: false } };
}

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const t = await getT();
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

  // Opening the thread is what marks it read. The write goes straight to the
  // library, not through a server action: an action calls revalidatePath, and
  // revalidatePath during a render is an error in Next 15 (the dev overlay showed
  // it on every open). The list is rendered per request, so it reads the new
  // state without a revalidation; a failed receipt never breaks the thread.
  await markThreadRead(session, threadId).catch((error: unknown) => {
    if (!(error instanceof AccessError)) console.error("[markThreadRead]", error);
  });

  const school = await db.school.findUnique({
    where: { id: thread.schoolId },
    select: { timezone: true },
  });
  const timezone = school?.timezone ?? "UTC";

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <ThreadLive threadId={thread.id} />
      <Link
        href="/remarks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("remarks.all")}
      </Link>

      <header className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <PersonLink membershipId={thread.student.membershipId} name={thread.student.fullName} className="shrink-0 rounded-full">
          <Avatar avatarKey={thread.student.avatarKey} name={thread.student.fullName} size="md" />
        </PersonLink>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight text-fg">{thread.subject}</h1>
          {/* "About X, with Y" was true when this was a note a teacher wrote to
              a family. The child is in the room now, so it is a conversation
              BETWEEN people rather than one about somebody. */}
          <p className="text-sm text-fg-muted">
            <PersonLink membershipId={thread.student.membershipId} name={thread.student.fullName} className="text-fg" />
            {" · "}
            <PersonLink membershipId={thread.teacher.membershipId} name={thread.teacher.name} className="text-fg" />
            {" · "}
            {t("remarks.guardiansWord")}
          </p>
        </div>
      </header>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
        <LockKeyIcon weight="fill" className="size-3.5" />
        {/* NAMES THE PUPIL, because they are in it. Leaving them out of the
            list while they read it is the kind of small untruth that makes
            somebody wonder what else the page is not saying. */}
        {t("remarks.onlyVisibleTo", { student: thread.student.name, teacher: thread.teacher.name })}
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
                <PersonLink
                  membershipId={message.mine ? null : message.authorMembershipId}
                  name={message.mine ? t("convo.you") : message.authorName}
                  className="font-semibold text-fg"
                />{" "}
                · <time dateTime={message.createdAt.toISOString()}>
                  {relativeTime(message.createdAt)}
                </time>
              </p>
              <div
                className={cn(
                  "mt-1 inline-block whitespace-pre-wrap rounded-[var(--radius-lg)] px-4 py-2.5 text-left text-[0.9375rem] leading-relaxed",
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
                {message.mine && ` · ${message.readByOthers ? t("convo.readMark") : t("convo.sentMark")}`}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {thread.closedAt ? (
        <p className="mt-6 rounded-[var(--radius-md)] bg-surface-muted p-4 text-center text-sm text-fg-muted">
          {t("remarks.closed")}
        </p>
      ) : (
        <ReplyBox threadId={thread.id} className="mt-6" />
      )}
    </div>
  );
}
