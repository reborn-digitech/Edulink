import Link from "next/link";
import type { HeldComment } from "@/lib/bulletin";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { CommentReview } from "./comment-review";

/**
 * The comments waiting on this reader, above the posts waiting on them: a
 * held comment used to be found only by opening the post it sat under, so
 * one on a post nobody reopened waited for ever. Oldest first.
 */
export async function HeldComments({ comments }: { comments: HeldComment[] }) {
  if (comments.length === 0) return null;
  const t = await getT();
  const relativeTime = await getRelativeTime();
  return (
    <section aria-labelledby="held-comments" className="rounded-[--radius-lg] border border-warn/40 bg-warn-soft/30 p-4">
      <h2 id="held-comments" className="text-sm font-semibold text-fg">
        {t("bulletin.heldCommentsTitle")} ({comments.length})
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("bulletin.heldCommentsBody")}</p>
      <ul className="mt-3 space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-[--radius-md] border border-border bg-surface p-3">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
              <span className="font-semibold text-fg">{comment.authorName}</span>
              <span>· {relativeTime(comment.createdAt)}</span>
              {comment.shared && (
                <Badge tone="neutral" size="sm">
                  {t("bulletin.heldOnShared")}
                </Badge>
              )}
              {comment.reply && (
                <Badge tone="neutral" size="sm">
                  {t("bulletin.heldIsReply")}
                </Badge>
              )}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg">{comment.body}</p>
            <p className="mt-1 text-xs text-fg-muted">
              <Link href={`/bulletin/${comment.postId}`} className="text-accent-strong underline underline-offset-2">
                {t("bulletin.heldOnPost", { title: comment.postTitle })}
              </Link>
              {comment.className ? ` · ${comment.className}` : ""}
            </p>
            <CommentReview commentId={comment.id} postId={comment.postId} authorName={comment.authorName} />
          </li>
        ))}
      </ul>
    </section>
  );
}
