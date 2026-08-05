"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ChatCircleIcon,
  FlagIcon,
  HandsClappingIcon,
  HeartIcon,
  LightbulbIcon,
  PushPinIcon,
  StarIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/dates";
import { pin, react, review, report } from "./actions";
import { useT } from "@/lib/i18n";
import { REACTION_KINDS, ROLE_META, type ReactionKind, type Role } from "@/lib/constants";
import { useLocale } from "@/lib/i18n";

type Post = {
  id: string;
  scope: string;
  title: string;
  body: string;
  tags: string[];
  media: { fileId: string; kind: string; alt: string }[];
  status: string;
  rejectionReason: string | null;
  pinned: boolean;
  createdAt: Date;
  authorName: string;
  authorAvatar: string | null;
  authorRole: Role | null;
  className: string | null;
  commentCount: number;
  reactions: Record<ReactionKind, number>;
  myReactions: ReactionKind[];
  canModerate: boolean;
  mine: boolean;
};

const REACTION_META: Record<
  ReactionKind,
  { icon: React.ComponentType<{ className?: string; weight?: "fill" | "bold" }>; label: string }
> = {
  CLAP: { icon: HandsClappingIcon, label: "Well done" },
  STAR: { icon: StarIcon, label: "Brilliant" },
  IDEA: { icon: LightbulbIcon, label: "Made me think" },
  HEART: { icon: HeartIcon, label: "Love this" },
};

const REPORT_REASONS = [
  { value: "BULLYING", label: "It is unkind or bullying" },
  { value: "UNSAFE", label: "Someone might be unsafe" },
  { value: "PRIVACY", label: "It shares private information" },
  { value: "WRONG_INFO", label: "It is not true" },
  { value: "SPAM", label: "It is spam" },
  { value: "OTHER", label: "Something else" },
] as const;

export function PostCard({ post, viewerRole }: { post: Post; viewerRole: Role | null }) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [optimistic, setOptimistic] = useState<{ kind: ReactionKind; added: boolean } | null>(null);

  const isPending = post.status === "PENDING";
  const isRejected = post.status === "REJECTED";

  function reactionCount(kind: ReactionKind): number {
    const base = post.reactions[kind] ?? 0;
    if (optimistic?.kind !== kind) return base;
    return base + (optimistic.added ? 1 : -1);
  }

  function isMine(kind: ReactionKind): boolean {
    if (optimistic?.kind === kind) return optimistic.added;
    return post.myReactions.includes(kind);
  }

  return (
    <article
      className={cn(
        "rounded-[--radius-lg] border bg-surface shadow-sm",
        isPending && "border-warn/50",
        isRejected && "border-danger/40",
        !isPending && !isRejected && "border-border",
      )}
    >
      {/* ---- status strip ---- */}
      {(isPending || isRejected || post.pinned) && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 rounded-t-[--radius-lg] px-4 py-2 text-xs font-semibold",
            isPending && "bg-warn-soft text-warn",
            isRejected && "bg-danger-soft text-danger",
            !isPending && !isRejected && "bg-accent-soft text-accent-strong",
          )}
        >
          {post.pinned && !isPending && !isRejected && (
            <>
              <PushPinIcon weight="fill" className="size-3.5" />
              Pinned by the school
            </>
          )}
          {isPending && (
            <>
              <ChatCircleIcon weight="fill" className="size-3.5" />
              {post.mine ? "Waiting for a teacher to check it" : "Needs review"}
            </>
          )}
          {isRejected && (
            <>
              <XCircleIcon weight="fill" className="size-3.5" />
              Not published
            </>
          )}
        </div>
      )}

      <div className="p-4">
        <header className="flex items-start gap-3">
          <Avatar avatarKey={post.authorAvatar} name={post.authorName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-sm">
              <span className="font-semibold text-fg">{post.authorName}</span>
              {post.authorRole && (
                <Badge tone="neutral" size="sm">
                  {t(ROLE_META[post.authorRole].labelKey)}
                </Badge>
              )}
            </p>
            <p className="text-xs text-fg-muted">
              {post.scope === "CLASS" ? (post.className ?? "Class") : "Whole school"} ·{" "}
              {relativeTime(post.createdAt, undefined, locale)}
            </p>
          </div>
        </header>

        <h2 className="mt-3 text-lg font-bold leading-snug text-fg">
          <Link href={`/bulletin/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>

        {post.body && (
          <p className="mt-1.5 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-fg-muted">
            {post.body}
          </p>
        )}

        {/*
          Served through /api/files, never from public/ — the route re-checks
          who is allowed to see this post before returning a byte, so a pending
          post's picture is as private as the post itself.
        */}
        {(() => {
          const pictures = post.media.filter((item) => item.kind === "image");
          if (pictures.length === 0) return null;

          // One picture gets the full width and keeps its own proportions —
          // cropping somebody's drawing to a tidy square is not a neutral act.
          // Several are laid out as a grid and cropped, because a column of
          // full-height photographs buries the comments and the reactions.
          const single = pictures.length === 1;

          return (
            <ul
              className={cn(
                "mt-3",
                single ? "" : "grid gap-1.5 sm:grid-cols-2",
              )}
            >
              {pictures.map((item) => (
                <li key={item.fileId}>
                  <img
                    src={`/api/files/${item.fileId}`}
                    alt={item.alt}
                    loading="lazy"
                    className={cn(
                      "w-full rounded-[--radius-md] border border-border bg-surface-muted",
                      single ? "max-h-[28rem] object-contain" : "aspect-4/3 object-cover",
                    )}
                  />
                </li>
              ))}
            </ul>
          );
        })()}

        {post.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
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

        {/* ---- the author sees exactly why, and what to do ---- */}
        {isRejected && post.mine && post.rejectionReason && (
          <div className="mt-3 rounded-[--radius-md] bg-danger-soft p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-danger">
              What your teacher said
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fg">{post.rejectionReason}</p>
            <p className="mt-2 text-xs text-fg-muted">
              You can write a new post with this changed — nothing is held against you.
            </p>
          </div>
        )}
      </div>

      {/* ---- moderation ---- */}
      {isPending && post.canModerate && !post.mine && (
        <div className="border-t border-border p-3.5">
          {rejecting ? (
            <div className="space-y-2">
              <label htmlFor={`reason-${post.id}`} className="block text-sm font-medium text-fg">
                Why not? The student will see this.
              </label>
              <textarea
                id={`reason-${post.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                rows={2}
                autoFocus
                placeholder="Lovely idea — but it has Ella's surname in it. Take that out and repost?"
                className="w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" block onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  block
                  loading={pending}
                  disabled={reason.trim().length === 0}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await review(post.id, "REJECT", reason);
                      toast(
                        result.ok
                          ? { tone: "neutral", title: "Sent back with your note" }
                          : { tone: "danger", title: "Could not do that", description: result.error },
                      );
                      setRejecting(false);
                      router.refresh();
                    })
                  }
                >
                  Send back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                block
                disabled={pending}
                icon={<XCircleIcon weight="bold" />}
                onClick={() => setRejecting(true)}
              >
                Send back
              </Button>
              <Button
                size="sm"
                block
                loading={pending}
                icon={<CheckCircleIcon weight="bold" />}
                onClick={() =>
                  startTransition(async () => {
                    const result = await review(post.id, "APPROVE");
                    toast(
                      result.ok
                        ? { tone: "ok", title: "Published", description: "The class can see it now." }
                        : { tone: "danger", title: "Could not publish", description: result.error },
                    );
                    router.refresh();
                  })
                }
              >
                Publish it
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ---- reactions + actions ---- */}
      {post.status === "APPROVED" && (
        <footer className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2.5">
          {REACTION_KINDS.map((kind) => {
            const meta = REACTION_META[kind];
            const Icon = meta.icon;
            const count = reactionCount(kind);
            const mine = isMine(kind);
            return (
              <button
                key={kind}
                type="button"
                aria-label={`${meta.label}${count > 0 ? ` (${count})` : ""}`}
                aria-pressed={mine}
                title={meta.label}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold",
                  "transition-[transform,background-color] duration-[--dur-fast] active:scale-90",
                  mine
                    ? "bg-accent-soft text-accent-strong"
                    : "text-fg-muted hover:bg-surface-muted hover:text-fg",
                )}
                onClick={() => {
                  // Optimistic: a tap on a reaction should never feel like a
                  // form submission.
                  setOptimistic({ kind, added: !mine });
                  startTransition(async () => {
                    const result = await react({ postId: post.id, kind });
                    if (!result.ok) {
                      setOptimistic(null);
                      toast({ tone: "danger", title: "Could not react", description: result.error });
                      return;
                    }
                    router.refresh();
                    setOptimistic(null);
                  });
                }}
              >
                <Icon className="size-4" weight={mine ? "fill" : "bold"} />
                {count > 0 && <span className="tabular-nums">{count}</span>}
              </button>
            );
          })}

          <Link
            href={`/bulletin/${post.id}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            <ChatCircleIcon className="size-4" />
            {post.commentCount > 0 ? post.commentCount : "Comment"}
          </Link>

          <div className="ml-auto flex items-center gap-1">
            {viewerRole === "ADMIN" && (
              <button
                type="button"
                aria-label={post.pinned ? "Unpin this post" : "Pin this post"}
                title={post.pinned ? "Unpin" : "Pin to the top"}
                className={cn(
                  "tap grid place-items-center rounded-full",
                  post.pinned ? "text-accent-strong" : "text-fg-subtle hover:text-fg",
                )}
                onClick={() =>
                  startTransition(async () => {
                    const result = await pin(post.id);
                    toast(
                      result.ok
                        ? { tone: "ok", title: result.pinned ? "Pinned to the top" : "Unpinned" }
                        : { tone: "danger", title: "Could not pin", description: result.error },
                    );
                    router.refresh();
                  })
                }
              >
                <PushPinIcon weight={post.pinned ? "fill" : "regular"} className="size-4" />
              </button>
            )}

            {!post.mine && (
              <button
                type="button"
                aria-label="Report this post"
                title="Report"
                className="tap grid place-items-center rounded-full text-fg-subtle hover:text-danger"
                onClick={() => setReporting(true)}
              >
                <FlagIcon className="size-4" />
              </button>
            )}
          </div>
        </footer>
      )}

      {reporting && (
        <ReportSheet
          postId={post.id}
          onClose={() => setReporting(false)}
          onDone={(ok, error) => {
            setReporting(false);
            toast(
              ok
                ? {
                    tone: "ok",
                    title: "Thank you for telling us",
                    description: "A teacher will look at this. You do not need to do anything else.",
                  }
                : { tone: "danger", duration: null, title: "That did not send", description: error },
            );
          }}
        />
      )}
    </article>
  );
}

function ReportSheet({
  postId,
  onClose,
  onDone,
}: {
  postId: string;
  onClose: () => void;
  onDone: (ok: boolean, error?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`report-title-${postId}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[--radius-xl] border border-border bg-surface p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] shadow-lg animate-sheet-up sm:rounded-[--radius-xl] sm:pb-5"
      >
        <h2 id={`report-title-${postId}`} className="text-base font-bold text-fg">
          Tell us what is wrong
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          A teacher will see this. The person who posted it will not be told who reported it.
        </p>

        <div role="radiogroup" aria-label="Reason" className="mt-3 space-y-1.5">
          {REPORT_REASONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={reason === option.value}
              onClick={() => setReason(option.value)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[--radius-md] border p-3 text-left text-sm font-medium transition-colors",
                reason === option.value
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border text-fg hover:bg-surface-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value.slice(0, 2000))}
          rows={2}
          placeholder="Anything else you want to say (you do not have to)"
          aria-label="More detail"
          className="mt-3 w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
        />

        <div className="mt-3 flex gap-2">
          <Button variant="ghost" block onClick={onClose}>
            Cancel
          </Button>
          <Button
            block
            loading={pending}
            disabled={!reason}
            onClick={() =>
              startTransition(async () => {
                const result = await report({
                  targetType: "POST",
                  targetId: postId,
                  reason,
                  detail: detail.trim() || undefined,
                });
                onDone(result.ok, result.error);
              })
            }
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
