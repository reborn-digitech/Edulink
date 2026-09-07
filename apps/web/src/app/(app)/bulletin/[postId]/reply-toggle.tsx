"use client";

import { useState } from "react";
import { ArrowBendUpLeftIcon } from "@phosphor-icons/react";
import { CommentBox } from "./comment-box";
import { useT } from "@/lib/i18n";

/**
 * The "Reply" link under a comment, and the box it unfolds.
 *
 * A separate client island so the comment list itself stays server-rendered:
 * the only state a thread needs is "which reply box is open", and that state
 * lives here, one instance per comment. The box folds itself away when the
 * reply is sent — the refreshed list brings the reply back as content.
 */
export function ReplyToggle({
  postId,
  parentCommentId,
  willBeHeld,
}: {
  postId: string;
  parentCommentId: string;
  willBeHeld: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowBendUpLeftIcon weight="bold" className="size-3.5" />
        {t("bulletin.reply")}
      </button>
    );
  }

  return (
    <CommentBox
      postId={postId}
      parentCommentId={parentCommentId}
      willBeHeld={willBeHeld}
      compact
      onSent={() => setOpen(false)}
      className="mt-2"
    />
  );
}
