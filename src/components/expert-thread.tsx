"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  mine: boolean;
};

/**
 * The conversation on a booking. ONE component for both sides.
 *
 * Which side is reading is decided entirely by `mine` on each message, computed
 * on the server from the session — so there is no prop that could be passed
 * wrongly to make somebody else's message look like your own.
 */
export function ExpertThread({
  messages,
  onSend,
  disabled,
}: {
  messages: ThreadMessage[];
  onSend: (body: string) => Promise<{ ok: boolean; error?: string }>;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {messages.length === 0 && (
          <li className="text-sm text-fg-muted">No messages yet. Say hello.</li>
        )}
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn("flex flex-col gap-1", message.mine ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-[--radius-md] px-3.5 py-2.5 text-[0.9375rem]",
                message.mine
                  ? "bg-accent text-accent-fg"
                  : "border border-border bg-surface-muted text-fg",
              )}
            >
              <p className="whitespace-pre-wrap">{message.body}</p>
            </div>
            <span className="text-xs text-fg-muted">
              {message.mine ? "You" : message.authorName}
            </span>
          </li>
        ))}
      </ul>

      {!disabled && (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            className="w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
          />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button
            loading={pending}
            disabled={body.trim().length === 0}
            icon={<PaperPlaneRightIcon weight="bold" className="size-4" />}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await onSend(body);
                if (!result.ok) {
                  setError(result.error ?? "Could not send that.");
                  return;
                }
                setBody("");
                router.refresh();
              })
            }
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
