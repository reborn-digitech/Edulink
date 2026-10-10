"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatsCircleIcon, TrashIcon } from "@phosphor-icons/react";
import type { AssistantConversation, AssistantConversationDetail, AssistantStatus } from "@edulink/contracts";
import { Button, Spinner } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { relativeTime } from "@/lib/dates";
import { useLocale, useT, type Translate } from "@/lib/i18n";
import { AssistantChat, FailureLine } from "./chat";
import { deleteConversation, type DoorFailure } from "./doors";
import { useDoor } from "./use-door";
import { ASSISTANT_DOORS, conversationHref } from "./model";

function Loading({ t }: { t: Translate }) {
  return (
    <div className="grid min-h-40 place-items-center" role="status" aria-label={t("ui.loading")}>
      <Spinner className="size-6 text-accent-strong" />
    </div>
  );
}

/**
 * /assistant: a new conversation, and the person's conversations of the last thirty days under it (the door lists
 * their own only; each one opens on its own page). The list is re-read once a question has opened a new one.
 */
export function AssistantHome({ role }: { role: string | null }) {
  const t = useT();
  const status = useDoor<AssistantStatus>(ASSISTANT_DOORS.status);
  const list = useDoor<{ conversations: AssistantConversation[] }>(status.data ? ASSISTANT_DOORS.conversations : null);
  const failure = status.failure ?? list.failure;
  if (failure) return <FailureLine failure={failure} t={t} onRetry={status.failure ? status.retry : list.retry} />;
  if (!status.data) return <Loading t={t} />;
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader icon={<ChatsCircleIcon weight="duotone" className="size-5" />} title={t("assistantUi.newConversation")} />
        <CardBody>
          <AssistantChat status={status.data} role={role} onConversation={list.retry} />
        </CardBody>
      </Card>
      <ConversationList list={list.data?.conversations ?? null} t={t} />
    </div>
  );
}

export function ConversationList({ list, t }: { list: AssistantConversation[] | null; t: Translate }) {
  const locale = useLocale();
  return (
    <Card>
      <CardHeader title={t("assistantUi.conversations")} description={t("assistantUi.conversationsBody")} />
      <CardBody>
        {list === null ? (
          <Loading t={t} />
        ) : list.length === 0 ? (
          // Two lines rather than the empty-state card: the way on is the box just above, not a button leading to it.
          <div data-testid="assistant-no-conversations">
            <p className="text-sm font-medium text-fg">{t("assistantUi.noConversations")}</p>
            <p className="text-sm text-fg-muted">{t("assistantUi.noConversationsBody")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border" data-testid="assistant-conversations">
            {list.map((c) => (
              <li key={c.id}>
                <Link href={conversationHref(c.id)} className="flex min-h-11 flex-col justify-center gap-0.5 rounded-[var(--radius-sm)] px-2 py-2.5 hover:bg-surface-muted">
                  <span className="line-clamp-2 break-words text-sm font-medium text-fg">{c.title ?? t("assistantUi.newConversation")}</span>
                  <span className="text-xs text-fg-muted">{t("assistantUi.lastWhen", { when: relativeTime(new Date(c.lastAt), new Date(), locale) })}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/** /assistant/{id}: one conversation to re-read and go on with, and the way to delete it now. */
export function AssistantConversationView({ id, role }: { id: string; role: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const status = useDoor<AssistantStatus>(ASSISTANT_DOORS.status);
  const detail = useDoor<AssistantConversationDetail>(ASSISTANT_DOORS.conversation(id));
  const [failure, setFailure] = useState<DoorFailure | null>(null);
  const [deleting, setDeleting] = useState(false);
  const gone = detail.failure?.status === 404;
  const readFailure = status.failure ?? (gone ? null : detail.failure);

  const remove = async () => {
    if (!window.confirm(t("assistantUi.deleteConfirm"))) return;
    setDeleting(true);
    const done = await deleteConversation(id);
    setDeleting(false);
    if (!done.ok) return setFailure(done);
    toast({ tone: "ok", title: t("assistantUi.deleted") });
    router.push("/assistant");
    router.refresh();
  };

  if (gone) return <EmptyState icon={<ChatsCircleIcon weight="duotone" className="size-7" />} title={t("assistantUi.unavailableTitle")} description={t("assistantUi.conversationGone")} action={<Button asChild variant="secondary"><Link href="/assistant">{t("assistantUi.allConversations")}</Link></Button>} />;
  if (readFailure) return <FailureLine failure={readFailure} t={t} onRetry={() => (status.failure ? status.retry() : detail.retry())} />;
  if (!status.data || !detail.data) return <Loading t={t} />;
  return (
    <div className="space-y-4">
      {failure ? <FailureLine failure={failure} t={t} /> : null}
      <div className="flex flex-wrap justify-end">
        <Button type="button" size="sm" variant="secondary" loading={deleting} onClick={() => void remove()} icon={<TrashIcon className="size-4" aria-hidden="true" />}>
          {t("assistantUi.deleteConversation")}
        </Button>
      </div>
      <Card>
        <CardBody className="pt-5">
          <AssistantChat status={status.data} role={role} conversationId={detail.data.conversation.id} messages={detail.data.messages} />
        </CardBody>
      </Card>
    </div>
  );
}
