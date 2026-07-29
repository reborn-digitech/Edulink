"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { comment } from "../actions";

export function CommentBox({
  postId,
  willBeHeld,
  className,
}: {
  postId: string;
  willBeHeld: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={cn("space-y-2", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (body.trim().length === 0) {
          setError("Write something first.");
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await comment(postId, body);
          if (!result.ok) {
            setError(result.error ?? "Could not send that.");
            return;
          }
          setBody("");
          toast(
            result.held
              ? {
                  tone: "ok",
                  title: "Sent to a teacher",
                  description: "Others will see it once it has been checked.",
                }
              : { tone: "ok", title: "Posted" },
          );
          router.refresh();
        });
      }}
    >
      <label htmlFor="comment" className="sr-only">
        Write a comment
      </label>
      <textarea
        id="comment"
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, 4000));
          if (error) setError(null);
        }}
        rows={3}
        placeholder="Say something kind…"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? "comment-error" : "comment-hint"}
        className={cn(
          "w-full resize-y rounded-[--radius-md] border bg-surface p-3.5 text-[0.9375rem] leading-relaxed outline-none",
          error ? "border-danger ring-2 ring-danger/25" : "border-border focus:border-accent",
        )}
      />

      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p id="comment-error" role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : (
          <p id="comment-hint" className="text-xs text-fg-muted">
            {/* Stated before they write, not after it disappears. */}
            {willBeHeld
              ? "A teacher checks your comment before others see it."
              : "Everyone who can see this post can read your comment."}
          </p>
        )}
        <Button
          type="submit"
          size="sm"
          loading={pending}
          disabled={body.trim().length === 0}
          icon={<PaperPlaneTiltIcon weight="bold" />}
        >
          Send
        </Button>
      </div>
    </form>
  );
}
