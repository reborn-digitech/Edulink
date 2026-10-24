import type { Metadata } from "next";
import Link from "next/link";
import {
  CaretRightIcon,
  ChatCircleDotsIcon,
  ChatsCircleIcon,
  PlusIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listThreads } from "@/lib/remarks";
import { listConversations } from "@/lib/conversations";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ROLE_META } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.messages") };
}

/**
 * One inbox, two kinds of room.
 *
 * "Conversations" are people writing to people — a principal to a teacher,
 * the office to a parent, a pupil to their class teacher. "About a pupil" is
 * the older, narrower room keyed on a child, with the family in it by
 * construction. They stay separate lists because they are different
 * promises about who is reading; they share one page because a person
 * looking for "that message from Mrs Dave" should not have to know which
 * kind it was.
 *
 * `?q=` filters both by name and subject on the server, so a URL is a saved
 * search and the page needs no client state.
 */
export default async function RemarksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; unread?: string }>;
}) {
  // The reader's language, not English under a Hindi or Marathi page (QA-20).
  const relativeTime = await getRelativeTime();
  const t = await getT();
  const session = await requireUser();
  const { q: rawQ, unread } = await searchParams;
  const q = rawQ?.trim().toLowerCase() ?? "";
  const unreadOnly = unread === "1";

  const [conversations, threads] = await Promise.all([listConversations(session), listThreads(session)]);
  const isTeacher = session.role === "TEACHER";
  const canWriteAboutPupil =
    session.role === "TEACHER" || session.role === "STUDENT" || session.role === "PARENT";

  const shownConversations = conversations.filter(
    (c) =>
      (!unreadOnly || c.unread) &&
      (!q || c.others.some((o) => o.name.toLowerCase().includes(q)) || c.preview.toLowerCase().includes(q)),
  );
  const shownThreads = threads.filter(
    (th) =>
      (!unreadOnly || th.unread) &&
      (!q ||
        th.subject.toLowerCase().includes(q) ||
        th.studentName.toLowerCase().includes(q) ||
        th.teacherName.toLowerCase().includes(q)),
  );
  const unreadTotal = conversations.filter((c) => c.unread).length + threads.filter((th) => th.unread).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("remarks.title")} description={unreadTotal > 0 ? t("convo.unreadCount", { count: unreadTotal }) : t("convo.intro")} />
        {/* One door. "Write about a pupil" lives on the people page as the
            first row for those who may — two primary buttons on a phone
            read as a choice nobody asked to make. */}
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/remarks/people">{t("convo.newMessage")}</Link>
        </Button>
      </div>

      {(conversations.length > 0 || threads.length > 0) && (
        <DataToolbar
          search={{ value: rawQ ?? "", placeholder: t("convo.searchMessages"), label: t("convo.searchMessages") }}
          facets={[
            {
              key: "unread",
              label: t("remarks.unread"),
              value: unreadOnly ? "1" : "",
              options: [
                { value: "", label: t("vacancies.filterAll"), count: conversations.length + threads.length },
                { value: "1", label: t("notif.tabUnread"), count: unreadTotal },
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {conversations.length === 0 && threads.length === 0 ? (
        // One button for the one action, in the header above; a second here read as a choice.
        <EmptyState
          icon={<ChatCircleDotsIcon weight="duotone" className="size-8" />}
          title={t("remarks.noMessagesYet")}
          description={t("convo.emptyBody")}
        />
      ) : (
        <div className="space-y-6">
          {/* ---- people ---- */}
          <section aria-labelledby="conversations-heading">
            <h2 id="conversations-heading" className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
              <ChatsCircleIcon weight="duotone" className="size-4 text-accent" />
              {t("convo.title")}
              <span className="font-normal text-fg-muted">· {shownConversations.length}</span>
            </h2>
            {shownConversations.length === 0 ? (
              <p className="rounded-[var(--radius-md)] bg-surface-muted p-4 text-sm text-fg-muted">
                {q ? t("convo.nothingMatches", { query: rawQ ?? "" }) : t("convo.none")}
              </p>
            ) : (
              <ul className="space-y-2">
                {shownConversations.map((c) => {
                  const other = c.others[0];
                  const name = c.others.map((o) => o.name).join(", ");
                  return (
                    <li key={c.id}>
                      <Card interactive className="overflow-hidden">
                        <Link href={`/remarks/c/${c.id}`} className="flex items-center gap-3 p-4">
                          <Avatar avatarKey={other?.avatarKey} name={name} size="md" />
                          {/* Name on its own line, everything else under it. A
                              name sharing a flex row with a badge and a
                              timestamp was the first thing to vanish on a
                              phone — the one thing the row is for. */}
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2">
                              <span className={cn("truncate", c.unread ? "font-bold text-fg" : "font-semibold text-fg")}>{name}</span>
                              {c.unread && (
                                <span className="size-2 shrink-0 rounded-full bg-accent" aria-label={t("remarks.unread")} />
                              )}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-fg-muted">
                              {other?.role && (
                                <Badge tone="neutral" size="sm">
                                  {t(ROLE_META[other.role].labelKey)}
                                </Badge>
                              )}
                              <span>{relativeTime(c.lastMessageAt)}</span>
                              <span className="text-fg-subtle">
                                · {c.messageCount === 1 ? t("convo.messageOne") : t("convo.messageMany", { count: c.messageCount })}
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-sm text-fg-muted">
                              {c.preview
                                ? `${c.previewMine ? `${t("convo.you")}: ` : ""}${c.preview}`
                                : t("convo.noMessagesInRoom")}
                            </p>
                          </div>
                          <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                        </Link>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ---- about a pupil ---- */}
          {(threads.length > 0 || canWriteAboutPupil) && (
            <section aria-labelledby="threads-heading">
              <h2 id="threads-heading" className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-fg">
                <UserCircleIcon weight="duotone" className="size-4 text-accent" />
                {t("convo.aboutPupil")}
                <span className="font-normal text-fg-muted">· {shownThreads.length}</span>
              </h2>
              <p className="mb-2 text-xs text-fg-muted">
                {isTeacher
                  ? t("remarks.introTeacher")
                  : session.role === "ADMIN" || session.role === "PRINCIPAL"
                    ? t("remarks.introAdmin")
                    : session.role === "STUDENT"
                      ? t("remarks.introStudent")
                      : t("remarks.introParent")}
              </p>
              {shownThreads.length === 0 ? (
                <p className="rounded-[var(--radius-md)] bg-surface-muted p-4 text-sm text-fg-muted">
                  {q
                    ? t("convo.nothingMatches", { query: rawQ ?? "" })
                    : isTeacher
                      ? t("remarks.emptyTeacher")
                      : t("remarks.emptyOther")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {shownThreads.map((thread) => (
                    <li key={thread.id}>
                      <Card interactive className="overflow-hidden">
                        <Link href={`/remarks/${thread.id}`} className="flex items-center gap-3 p-4">
                          <Avatar
                            avatarKey={isTeacher ? thread.studentAvatar : thread.teacherAvatar}
                            name={isTeacher ? thread.studentName : thread.teacherName}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2">
                              <span className={cn("truncate", thread.unread ? "font-bold text-fg" : "font-semibold text-fg")}>
                                {thread.subject}
                              </span>
                              {thread.unread && (
                                <span className="size-2 shrink-0 rounded-full bg-accent" aria-label={t("remarks.unread")} />
                              )}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-fg-muted">
                              {isTeacher
                                ? t("convo.aboutName", { name: thread.studentName })
                                : t("convo.withAbout", { teacher: thread.teacherName, name: thread.studentName })}
                              {" · "}
                              {relativeTime(thread.lastMessageAt)}
                              <span className="text-fg-subtle">
                                {" · "}
                                {thread.messageCount === 1 ? t("convo.messageOne") : t("convo.messageMany", { count: thread.messageCount })}
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-sm text-fg-muted">{thread.preview}</p>
                          </div>
                          <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                        </Link>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
