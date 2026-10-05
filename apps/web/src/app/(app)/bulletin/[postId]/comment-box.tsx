"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { comment } from "../actions";

export function CommentBox({
  postId,
  willBeHeld,
  className,
  parentCommentId,
  compact = false,
  onSent,
}: {
  postId: string;
  willBeHeld: boolean;
  className?: string;
  /** Set on a reply box — the comment this answers. */
  parentCommentId?: string;
  /** Smaller box for the inline reply under a comment. */
  compact?: boolean;
  /** Lets a reply box fold itself away once the reply is in. */
  onSent?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = parentCommentId ? `reply-${parentCommentId}` : "comment";

  return (
    <form
      className={cn("space-y-2", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (body.trim().length === 0) {
          setError(t("bulletin.writeSomethingFirst"));
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await comment(postId, body, parentCommentId);
          if (!result.ok) {
            setError(result.error ?? t("bulletin.couldNotSend"));
            return;
          }
          setBody("");
          toast(
            result.held
              ? {
                  tone: "ok",
                  title: t("bulletin.sentToATeacher"),
                  description: t("bulletin.visibleOnceChecked"),
                }
              : { tone: "ok", title: t("bulletin.posted") },
          );
          onSent?.();
          router.refresh();
        });
      }}
    >
      <label htmlFor={id} className="sr-only">
        {parentCommentId ? t("bulletin.writeReply") : t("bulletin.writeComment")}
      </label>
      <textarea
        id={id}
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, 4000));
          if (error) setError(null);
        }}
        rows={compact ? 2 : 3}
        autoFocus={compact}
        placeholder={t("bulletin.sayKind")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className={cn(
          "w-full resize-y rounded-[var(--radius-md)] border bg-surface p-3.5 text-[0.9375rem] leading-relaxed outline-none",
          error ? "border-danger ring-2 ring-danger/25" : "border-border focus:border-accent",
        )}
      />

      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : (
          <p id={`${id}-hint`} className="text-xs text-fg-muted">
            {/* Stated before they write, not after it disappears. */}
            {willBeHeld ? t("bulletin.teacherChecksComment") : t("bulletin.everyoneCanRead")}
          </p>
        )}
        <Button
          type="submit"
          size="sm"
          loading={pending}
          disabled={body.trim().length === 0}
          icon={<PaperPlaneTiltIcon weight="bold" />}
        >
          {t("common.send")}
        </Button>
      </div>
    </form>
  );
}
