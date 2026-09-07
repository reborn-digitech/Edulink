"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { sendReply } from "../actions";
import { useT } from "@/lib/i18n";

const MAX = 8000;

export function ReplyBox({ threadId, className }: { threadId: string; className?: string }) {
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

    startTransition(async () => {
      const result = await sendReply({ threadId, body: trimmed });
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
      <label htmlFor="reply" className="sr-only">
        {t("remarks.writeReply")}
      </label>
      <textarea
        id="reply"
        ref={ref}
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, MAX));
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          // Enter alone inserts a newline — people write paragraphs here, and
          // send-on-Enter fires half-written messages to a child's parent.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit(e as unknown as React.FormEvent);
          }
        }}
        rows={3}
        placeholder={t("remarks.writeReplyPlaceholder")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? "reply-error" : "reply-hint"}
        className={cn(
          "w-full resize-y rounded-[--radius-md] border bg-surface p-3.5 text-[0.9375rem] leading-relaxed outline-none",
          error
            ? "border-danger ring-2 ring-danger/25"
            : "border-border focus:border-accent focus:ring-2 focus:ring-accent-ring/40",
        )}
      />

      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p id="reply-error" role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : (
          <p id="reply-hint" className="text-xs text-fg-subtle">
            {body.length > MAX - 500 ? t("remarks.charactersLeft", { count: MAX - body.length }) : t("convo.sendShortcut")}
          </p>
        )}
        <Button
          type="submit"
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
