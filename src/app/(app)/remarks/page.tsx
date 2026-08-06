import type { Metadata } from "next";
import Link from "next/link";
import { CaretRightIcon, ChatCircleDotsIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listThreads } from "@/lib/remarks";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.messages") };
}

export default async function RemarksPage() {
  const t = await getT();
  const session = await requireUser();
  const threads = await listThreads(session);
  const isTeacher = session.role === "TEACHER";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("remarks.title")}</h1>
          {/* Each of these described a two-sided conversation, which is what
              this was. The room now holds the teacher, the pupil and the
              pupil's guardians, and every one of them reads this line. */}
          <p className="mt-1 text-sm text-fg-muted">
            {isTeacher
              ? t("remarks.introTeacher")
              : session.role === "ADMIN"
                ? t("remarks.introAdmin")
                : session.role === "STUDENT"
                  ? t("remarks.introStudent")
                  : t("remarks.introParent")}
          </p>
        </div>
        {/* All three can start one now — a pupil and a guardian previously had
            to wait to be messaged first. */}
        {session.role !== "ADMIN" && (
          <Button asChild icon={<PlusIcon weight="bold" />}>
            <Link href="/remarks/new">{t("remarks.newMessage")}</Link>
          </Button>
        )}
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon={<ChatCircleDotsIcon weight="duotone" className="size-8" />}
          title={t("remarks.noMessagesYet")}
          description={isTeacher ? t("remarks.emptyTeacher") : t("remarks.emptyOther")}
          action={
            isTeacher ? (
              <Button asChild>
                <Link href="/remarks/new">{t("remarks.writeMessage")}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Card interactive className="overflow-hidden">
                <Link href={`/remarks/${thread.id}`} className="flex items-center gap-3 p-4">
                  <Avatar
                    avatarKey={isTeacher ? thread.studentAvatar : thread.teacherAvatar}
                    name={isTeacher ? thread.studentName : thread.teacherName}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={
                          thread.unread
                            ? "truncate font-bold text-fg"
                            : "truncate font-semibold text-fg"
                        }
                      >
                        {thread.subject}
                      </p>
                      {thread.unread && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-accent"
                          aria-label={t("remarks.unread")}
                        />
                      )}
                    </div>
                    <p className="truncate text-xs text-fg-muted">
                      {isTeacher
                        ? `About ${thread.studentName}`
                        : `${thread.teacherName} · about ${thread.studentName}`}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-fg-muted">{thread.preview}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-fg-muted">{relativeTime(thread.lastMessageAt)}</p>
                    <p className="text-xs text-fg-subtle">
                      {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
