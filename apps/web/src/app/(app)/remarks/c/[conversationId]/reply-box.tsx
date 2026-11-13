"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { sendConversationReply } from "../../conversation-actions";
import { useT } from "@/lib/i18n";
import { enqueue, newClientId } from "@/lib/offline-queue";
import { fieldClass } from "@/components/ui/field-class";

const MAX = 8000;

/** The same box as a remark thread's, posting into a conversation instead. */
export function ConversationReplyBox({ conversationId, className }: { conversationId: string; className?: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      setError(t("remarks.writeSomethingFirst"));
      return;
    }
    setError(null);
    if (!navigator.onLine) {
      // Into the outbox, with an id minted here so the replay lands once. The
      // room shows it after the reconnection's refresh; the shell counts it
      // until then.
      void enqueue({
        url: "/api/v1/messages",
        method: "POST",
        body: JSON.stringify({ conversationId, body: trimmed, clientId: newClientId() }),
        tag: `message:${conversationId}`,
      }).then(() => {
        setBody("");
        toast({ tone: "accent", title: t("common.queuedOffline") });
        ref.current?.focus();
      });
      return;
    }
    startTransition(async () => {
      const result = await sendConversationReply({ conversationId, body: trimmed });
      if (!result.ok) {
        setError(result.errors._form ?? result.errors.body ?? t("remarks.couldNotSend"));
        return;
      }
      setBody("");
      router.refresh();
      toast({ tone: "ok", title: t("remarks.sent") });
      ref.current?.focus();
    });
  }

  return (
    <form onSubmit={submit} className={cn("space-y-2", className)}>
      <label htmlFor="conversation-reply" className="sr-only">
        {t("remarks.writeReply")}
      </label>
      <textarea
        id="conversation-reply"
        ref={ref}
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, MAX));
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit(e as unknown as React.FormEvent);
          }
        }}
        rows={3}
        placeholder={t("remarks.writeReplyPlaceholder")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? "conversation-reply-error" : "conversation-reply-hint"}
        className={fieldClass("resize-y leading-relaxed", Boolean(error))}
      />
      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p id="conversation-reply-error" role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : (
          <p id="conversation-reply-hint" className="text-xs text-fg-subtle">
            {body.length > MAX - 500 ? t("remarks.charactersLeft", { count: MAX - body.length }) : t("convo.sendShortcut")}
          </p>
        )}
        <Button type="submit" loading={pending} disabled={body.trim().length === 0} icon={<PaperPlaneTiltIcon weight="bold" />}>
          {t("common.send")}
        </Button>
      </div>
    </form>
  );
}
