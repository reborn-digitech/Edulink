import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { requireUser, AccessError } from "@/lib/tenancy";
import { getPost, ackReport, type AckGroup } from "@/lib/bulletin";
import { AckButton } from "./ack-button";
import { readJsonArray, type MediaItem } from "@/lib/json";
import { relativeTime } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CommentBox } from "./comment-box";
import { ReplyToggle } from "./reply-toggle";
import { ReactionRow } from "../reactions";
import { PostMedia } from "../media";
import { CATEGORY_KEYS } from "../categories";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { ROLE_META, type PostCategory, type Role } from "@/lib/constants";

/* Same keys the feed card uses — the deep link must not say less than the
   card the reader clicked. */
const AUDIENCE_LABEL: Record<string, TranslationKey> = {
  PARENTS: "bulletin.forParents",
  TEACHERS: "bulletin.forTeachers",
  STUDENTS: "bulletin.forStudents",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.post") };
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const t = await getT();
  const session = await requireUser();
  const { postId } = await params;

  let post;
  try {
    post = await getPost(session, postId);
  } catch (error) {
    // A post from another school, or a pending post you are not allowed to see,
    // is a 404 — not a 403, which would confirm it exists.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const tags = readJsonArray<string>(post.tags);
  const media = readJsonArray<MediaItem>(post.media);
  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";

  const reactionCounts: Record<string, number> = {};
  const myReactions: string[] = [];
  for (const reaction of post.reactions) {
    reactionCounts[reaction.kind] = (reactionCounts[reaction.kind] ?? 0) + 1;
    if (reaction.userId === session.user.id) myReactions.push(reaction.kind);
  }

  // A child's comment is held for review inside a school; on a GLOBAL post it
  // is not — see addComment, which owns this rule. The flag only shapes the
  // hint text, so it must tell the same truth.
  const willBeHeld = session.role === "STUDENT" && post.scope !== "GLOBAL";

  // The delivery checklist, for the people who can chase it up.
  let ackGroups: AckGroup[] = [];
  if (isStaff && post.requiresAck && post.status === "APPROVED") {
    try {
      ackGroups = await ackReport(session, post.id);
    } catch {
      // A teacher with no classes simply gets no breakdown.
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/bulletin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("bulletin.title")}
      </Link>

      <article className="rounded-[--radius-lg] border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <Avatar
            avatarKey={post.author.avatarKey}
            name={post.author.name}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-sm">
              <span className="font-semibold text-fg">
                {post.author.preferredName ?? post.author.name}
              </span>
              {post.authorship?.role && (
                <Badge tone="neutral" size="sm">
                  {t(ROLE_META[post.authorship.role as Role].labelKey)}
                </Badge>
              )}
            </p>
            <p className="text-xs text-fg-muted">
              {post.scope === "CLASS" ? (post.class?.name ?? t("bulletin.classField")) : t("bulletin.wholeSchool")} ·{" "}
              {relativeTime(post.createdAt)}
              {post.audience !== "ALL" && AUDIENCE_LABEL[post.audience] && (
                <> · {t(AUDIENCE_LABEL[post.audience]!)}</>
              )}
              {post.audienceGrade && <> · {t("practice.classN", { n: post.audienceGrade })}</>}
            </p>
          </div>
          {post.status !== "APPROVED" && (
            <Badge tone={post.status === "PENDING" ? "warn" : "danger"} size="sm">
              {post.status === "PENDING" ? t("bulletin.awaitingReview") : t("bulletin.notPublished")}
            </Badge>
          )}
        </header>

        <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-fg">
          {post.title}
        </h1>

        <Link
          href={`/bulletin?category=${post.category}`}
          className="mt-1.5 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong hover:underline"
        >
          {t(CATEGORY_KEYS[post.category as PostCategory].name)}
        </Link>

        {post.body && (
          <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-fg">
            {post.body}
          </p>
        )}

        {/* The full post is where the media matters most — the card had it,
            this page did not, and a video post opened to nothing. */}
        <PostMedia media={media} />

        {/* The reaction row, on the post itself — it lived only on the feed
            cards, so anyone who opened a post found nowhere to react. Same
            seven pills, same action, any signed-in reader of this post. */}
        {post.status === "APPROVED" && (
          <div className="mt-4 border-t border-border pt-3">
            <ReactionRow
              postId={post.id}
              reactions={reactionCounts}
              myReactions={myReactions}
            />
          </div>
        )}

        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/bulletin?tag=${encodeURIComponent(tag)}`}
                  className="inline-block rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-fg-muted hover:text-fg"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* "Seen and understood" is the school's own instrument — a reader
            from another school on a global post is not on anyone's checklist
            and gets no button to press. */}
        {post.requiresAck && post.status === "APPROVED" && session.schoolId === post.schoolId && (
          <div className="mt-4 rounded-[--radius-md] bg-accent-soft/40 p-3.5">
            <AckButton postId={post.id} acked={post.acks.length > 0} />
          </div>
        )}
      </article>

      {/* ---- who this circular has reached, class by class ---- */}
      {ackGroups.length > 0 && (
        <section
          aria-labelledby="ack-report"
          className="rounded-[--radius-lg] border border-border bg-surface p-5"
        >
          <h2 id="ack-report" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("bulletin.ackOutstandingTitle")}
          </h2>
          <ul className="mt-3 space-y-3">
            {ackGroups.map((group) => (
              <li key={group.classId ?? "staff"}>
                <p className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-fg">
                    {group.className || t("bulletin.audienceTeachers")}
                  </span>
                  <span className="text-fg-muted">
                    {t("bulletin.ackReached", { reached: group.reached, total: group.total })}
                  </span>
                </p>
                {group.outstanding.length > 0 && (
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                    {t("bulletin.ackStillWaiting")} {group.outstanding.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="comments">
        <h2 id="comments" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {post.comments.length === 0
            ? t("bulletin.comments")
            : post.comments.length === 1
              ? t("bulletin.commentsOne")
              : t("bulletin.commentsMany", { count: post.comments.length })}
        </h2>

        {post.comments.length === 0 ? (
          <p className="mt-2 rounded-[--radius-md] bg-surface-muted p-4 text-sm text-fg-muted">
            {t("bulletin.noCommentsYet")}
          </p>
        ) : (
          (() => {
            /**
             * The flat, time-ordered list becomes THREADS here rather than in
             * the query: top-level comments in order, each with its replies in
             * order underneath. A reply whose parent the viewer cannot see (a
             * held student comment being answered by staff) still finds its
             * place, because staff see held comments and nobody else sees such
             * replies' parents missing — visibility was already filtered.
             */
            const replies = new Map<string, typeof post.comments>();
            for (const entry of post.comments) {
              if (!entry.parentCommentId) continue;
              const bucket = replies.get(entry.parentCommentId) ?? [];
              bucket.push(entry);
              replies.set(entry.parentCommentId, bucket);
            }
            const tops = post.comments.filter((entry) => !entry.parentCommentId);
            const canReply = post.status === "APPROVED";

            const renderComment = (entry: (typeof post.comments)[number], isReply: boolean) => {
              const held = entry.status === "PENDING";
              const mine = entry.authorUserId === session.user.id;
              return (
                <div
                  className={`flex gap-3 rounded-[--radius-md] border p-3 ${
                    held ? "border-warn/40 bg-warn-soft/40" : "border-border bg-surface"
                  }`}
                >
                  <Avatar
                    avatarKey={entry.author.avatarKey}
                    name={entry.author.name}
                    size={isReply ? "xs" : "sm"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg-muted">
                      <span className="font-semibold text-fg">
                        {mine ? t("common.you") : (entry.author.preferredName ?? entry.author.name)}
                      </span>{" "}
                      · {relativeTime(entry.createdAt)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                      {entry.body}
                    </p>
                    {held && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warn">
                        <ClockIcon weight="fill" className="size-3.5" />
                        {mine ? t("bulletin.checkingBeforeOthers") : t("bulletin.awaitingReview")}
                      </p>
                    )}
                    {/* Replying to a reply answers the same thread — the lib
                        re-points it at the top comment either way. */}
                    {canReply && !held && (
                      <ReplyToggle
                        postId={post.id}
                        parentCommentId={entry.parentCommentId ?? entry.id}
                        willBeHeld={willBeHeld}
                      />
                    )}
                  </div>
                </div>
              );
            };

            return (
              <ul className="mt-2 space-y-2">
                {tops.map((entry) => (
                  <li key={entry.id}>
                    {renderComment(entry, false)}
                    {(replies.get(entry.id) ?? []).length > 0 && (
                      <ul className="ml-8 mt-1.5 space-y-1.5 border-l-2 border-border pl-3">
                        {(replies.get(entry.id) ?? []).map((reply) => (
                          <li key={reply.id}>{renderComment(reply, true)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            );
          })()
        )}

        {post.status === "APPROVED" && (
          <CommentBox
            postId={post.id}
            className="mt-4"
            willBeHeld={willBeHeld}
          />
        )}

        {isStaff && post.comments.some((c) => c.status === "PENDING") && (
          <p className="mt-3 text-xs text-fg-muted">{t("bulletin.pendingVisibleToYou")}</p>
        )}
      </section>
    </div>
  );
}
