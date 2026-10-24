import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockKeyIcon } from "@phosphor-icons/react/ssr";
import { requireUser, AccessError } from "@/lib/tenancy";
import { getConversation, markConversationRead } from "@/lib/conversations";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { Avatar } from "@/components/ui/avatar";
import { PersonLink } from "@/components/person-link";
import { pageOpener } from "@/lib/page-links";
import { Badge } from "@/components/ui/badge";
import { ConversationReplyBox } from "./reply-box";
import { formatInZone } from "@/lib/dates";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";
import { ROLE_META } from "@/lib/constants";
import { CloseConversationButton } from "../../../alumni/close-conversation";
import { BackLink, PAGE_TITLE } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.message"), robots: { index: false, follow: false } };
}

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  // The reader's language, not English under a Hindi or Marathi page (QA-20).
  const relativeTime = await getRelativeTime();
  const t = await getT();
  const session = await requireUser();
  // Names are doors to profiles only where the reader's gate opens /people (QA-19).
  const profiles = (await pageOpener(session))("/people/x");
  const { conversationId } = await params;

  let conversation;
  try {
    conversation = await getConversation(session, conversationId);
  } catch (error) {
    // Somebody else's room is a 404, not a 403 — a 403 confirms it exists.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  // Opening the room is what marks it read. The lib, not the action: an
  // action revalidates paths, which a page may not do while it renders, and
  // the badge is recounted on the next request anyway.
  await markConversationRead(session, conversationId).catch(() => undefined);

  const school = await db.school.findUnique({
    where: { id: conversation.schoolId },
    select: { name: true, timezone: true },
  });
  const timezone = school?.timezone ?? "UTC";
  const other = conversation.others[0];
  const names = conversation.others.map((o) => o.name).join(", ");

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <BackLink href="/remarks" label={t("remarks.all")} className="mb-4" />

      <header className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <PersonLink linked={profiles} membershipId={other?.membershipId} name={names} className="shrink-0 rounded-full">
          <Avatar avatarKey={other?.avatarKey} name={names} size="md" />
        </PersonLink>
        <div className="min-w-0 flex-1">
          {/* The avatar beside the title is why this is not a PageHeader; the title has its look (A3-states-9). */}
          <h1 className={PAGE_TITLE}>

            <PersonLink linked={profiles} membershipId={other?.membershipId} name={names} />
            {other?.role && (
              <Badge tone="neutral" size="sm">
                {t(ROLE_META[other.role].labelKey)}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-fg-muted">{school?.name}</p>
        </div>
      </header>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
        <LockKeyIcon weight="fill" className="size-3.5" />
        {t("convo.onlyYouAnd", { names })}
      </p>

      {conversation.messages.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-md)] bg-surface-muted p-4 text-center text-sm text-fg-muted">
          {t("convo.sayHello", { name: other?.name ?? names })}
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {conversation.messages.map((message) => (
            <li key={message.id} className={cn("flex gap-3", message.mine && "flex-row-reverse")}>
              <Avatar avatarKey={message.authorAvatar} name={message.authorName} size="sm" />
              <div className={cn("min-w-0 max-w-[85%]", message.mine && "text-right")}>
                <p className="text-xs text-fg-muted">
                  <PersonLink linked={profiles}
                    membershipId={message.mine ? null : message.authorMembershipId}
                    name={message.mine ? t("convo.you") : message.authorName}
                    className="font-semibold text-fg"
                  />{" "}
                  · <time dateTime={message.createdAt.toISOString()}>{relativeTime(message.createdAt)}</time>
                </p>
                <div
                  className={cn(
                    "mt-1 inline-block whitespace-pre-wrap rounded-[var(--radius-lg)] px-4 py-2.5 text-left text-[0.9375rem] leading-relaxed",
                    message.mine ? "bg-accent text-accent-fg" : "border border-border bg-surface text-fg",
                  )}
                >
                  {message.body}
                </div>
                <p className="mt-1 text-[0.6875rem] text-fg-subtle">
                  {formatInZone(message.createdAt, timezone, { dateStyle: "medium", timeStyle: "short" })}
                  {message.mine && ` · ${message.readByOthers ? t("convo.readMark") : t("convo.sentMark")}`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* A room with a former pupil (the alumni module): staff may close it; closed, the alumnus reads and does not write. */}
      {(conversation.canClose || conversation.closedAt) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface-muted p-3 text-sm text-fg-muted">
          {conversation.closedAt && <p>{conversation.canClose ? t("alumni.closedStaffNotice") : t("alumni.closedNotice")}</p>}
          {conversation.canClose && <CloseConversationButton conversationId={conversation.id} closed={conversation.closedAt !== null} />}
        </div>
      )}
      {(!conversation.closedAt || conversation.canClose) && <ConversationReplyBox conversationId={conversation.id} className="mt-6" />}
    </div>
  );
}
