"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ChatCircleIcon,
  FlagIcon,
  GlobeIcon,
  PushPinIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/dates";
import { acknowledge, pin, review, report } from "./actions";
import { publish as publishGlobal } from "./global/actions";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { ROLE_META, type PostCategory, type ReactionKind, type Role } from "@/lib/constants";
import { CATEGORY_KEYS } from "./categories";
import { fontStack } from "@/lib/fonts";
import { PostMedia } from "./media";
import { ReactionRow } from "./reactions";

type Post = {
  id: string;
  scope: string;
  category: PostCategory;
  font?: string;
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
  /** The author's membership at this school, when they still hold one — the
   * door to their profile. Null on the global feed and for a leaver. */
  authorMembershipId?: string | null;
  className: string | null;
  commentCount: number;
  reactions: Record<ReactionKind, number>;
  myReactions: ReactionKind[];
  canModerate: boolean;
  mine: boolean;
  audience: "ALL" | "PARENTS" | "TEACHERS" | "STUDENTS";
  audienceGrade: string | null;
  requiresAck: boolean;
  acked: boolean;
  ackCount: number;
};

const AUDIENCE_LABEL: Record<"PARENTS" | "TEACHERS" | "STUDENTS", TranslationKey> = {
  PARENTS: "bulletin.forParents",
  TEACHERS: "bulletin.forTeachers",
  STUDENTS: "bulletin.forStudents",
};


const REPORT_REASONS = [
  { value: "BULLYING", labelKey: "bulletin.reasonBullying" },
  { value: "UNSAFE", labelKey: "bulletin.reasonUnsafe" },
  { value: "PRIVACY", labelKey: "bulletin.reasonPrivacy" },
  { value: "WRONG_INFO", labelKey: "bulletin.reasonWrong" },
  { value: "SPAM", labelKey: "bulletin.reasonSpam" },
  { value: "OTHER", labelKey: "bulletin.reasonOther" },
] as const satisfies readonly { value: string; labelKey: TranslationKey }[];

export function PostCard({ post, viewerRole }: { post: Post; viewerRole: Role | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [ackedNow, setAckedNow] = useState(false);
  const acked = post.acked || ackedNow;

  const isPending = post.status === "PENDING";
  const isRejected = post.status === "REJECTED";

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
              {t("bulletin.pinnedBySchool")}
            </>
          )}
          {isPending && (
            <>
              <ChatCircleIcon weight="fill" className="size-3.5" />
              {post.mine ? t("bulletin.waitingForCheck") : t("bulletin.needsReview")}
            </>
          )}
          {isRejected && (
            <>
              <XCircleIcon weight="fill" className="size-3.5" />
              {t("bulletin.notPublished")}
            </>
          )}
        </div>
      )}

      <div className="p-4">
        {/* The author is a door, not a caption: name and avatar open their
            profile, where the "Message" button lives. A post from somebody
            who has since left, or on the global feed, stays plain text. */}
        <header className="flex items-start gap-3">
          {post.authorMembershipId ? (
            <Link href={`/people/${post.authorMembershipId}`} className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" aria-label={post.authorName}>
              <Avatar avatarKey={post.authorAvatar} name={post.authorName} size="sm" />
            </Link>
          ) : (
            <Avatar avatarKey={post.authorAvatar} name={post.authorName} size="sm" />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-sm">
              {post.authorMembershipId ? (
                <Link href={`/people/${post.authorMembershipId}`} className="font-semibold text-fg hover:underline">
                  {post.authorName}
                </Link>
              ) : (
                <span className="font-semibold text-fg">{post.authorName}</span>
              )}
              {post.authorRole && (
                <Badge tone="neutral" size="sm">
                  {t(ROLE_META[post.authorRole].labelKey)}
                </Badge>
              )}
            </p>
            <p className="text-xs text-fg-muted">
              {post.scope === "CLASS" ? (post.className ?? t("bulletin.classField")) : t("bulletin.wholeSchool")} ·{" "}
              {relativeTime(post.createdAt)}
              {post.audience !== "ALL" && <> · {t(AUDIENCE_LABEL[post.audience])}</>}
              {post.audienceGrade && <> · {t("practice.classN", { n: post.audienceGrade })}</>}
            </p>
          </div>
        </header>

        <h2 style={{ fontFamily: fontStack(post.font, "en") }} className="mt-3 text-lg font-bold leading-snug text-fg">
          <Link href={`/bulletin/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>

        {/* The category, linking to its filtered feed — a chip, not prose,
            because it is the axis the feed filters on. */}
        <Link
          href={`/bulletin?category=${post.category}`}
          className="mt-1.5 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong hover:underline"
        >
          {t(CATEGORY_KEYS[post.category].name)}
        </Link>

        {post.body && (
          <p style={{ fontFamily: fontStack(post.font, "en") }} className="mt-1.5 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-fg-muted" data-testid="post-body">
            {post.body}
          </p>
        )}

        {/*
          Served through /api/files, never from public/ — the route re-checks
          who is allowed to see this post before returning a byte, so a pending
          post's picture is as private as the post itself.
        */}
        <PostMedia media={post.media} />

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
              {t("bulletin.whatTeacherSaid")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fg">{post.rejectionReason}</p>
            <p className="mt-2 text-xs text-fg-muted">{t("bulletin.writeNewPost")}</p>
          </div>
        )}
      </div>

      {/* ---- moderation ---- */}
      {isPending && post.canModerate && !post.mine && (
        <div className="border-t border-border p-3.5">
          {rejecting ? (
            <div className="space-y-2">
              <label htmlFor={`reason-${post.id}`} className="block text-sm font-medium text-fg">
                {t("bulletin.whyNot")}
              </label>
              <textarea
                id={`reason-${post.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                rows={2}
                autoFocus
                placeholder={t("bulletin.rejectPlaceholder")}
                className="w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" block onClick={() => setRejecting(false)}>
                  {t("common.cancel")}
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
                          ? { tone: "neutral", title: t("bulletin.sentBackWithNote") }
                          : { tone: "danger", title: t("bulletin.couldNotDo"), description: result.error },
                      );
                      setRejecting(false);
                      router.refresh();
                    })
                  }
                >
                  {t("bulletin.sendBack")}
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
                {t("bulletin.sendBack")}
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
                        ? { tone: "ok", title: t("bulletin.published"), description: t("bulletin.classCanSee") }
                        : { tone: "danger", title: t("bulletin.couldNotPublish"), description: result.error },
                    );
                    router.refresh();
                  })
                }
              >
                {t("bulletin.publishIt")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ---- seen and understood ---- */}
      {post.requiresAck && post.status === "APPROVED" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-accent-soft/40 px-3.5 py-2.5">
          {acked ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ok">
              <CheckCircleIcon weight="fill" className="size-4" />
              {t("bulletin.ackDone")}
            </p>
          ) : (
            <Button
              size="sm"
              loading={pending}
              icon={<CheckCircleIcon weight="bold" />}
              onClick={() =>
                startTransition(async () => {
                  const result = await acknowledge(post.id);
                  if (result.ok) {
                    setAckedNow(true);
                  } else {
                    toast({ tone: "danger", title: t("bulletin.couldNotDo"), description: result.error });
                  }
                  router.refresh();
                })
              }
            >
              {t("bulletin.ackButton")}
            </Button>
          )}
          {post.canModerate && (
            <Link
              href={`/bulletin/${post.id}`}
              className="text-xs font-medium text-accent-strong underline underline-offset-2"
            >
              {t("bulletin.ackCount", { count: post.ackCount + (ackedNow && !post.acked ? 1 : 0) })}
            </Link>
          )}
        </div>
      )}

      {/* ---- reactions + actions ---- */}
      {post.status === "APPROVED" && (
        <footer className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2.5">
          {/* The shared row — one place owns the pills, their optimistic
              toggle, and the hover tooltip naming each emoticon. */}
          <ReactionRow
            postId={post.id}
            reactions={post.reactions}
            myReactions={post.myReactions}
          />

          <Link
            href={`/bulletin/${post.id}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            <ChatCircleIcon className="size-4" />
            {post.commentCount > 0 ? post.commentCount : t("bulletin.comment")}
          </Link>

          <div className="ml-auto flex items-center gap-1">
            {/* Promote to the global feed — the write half of the surface the
                global page's hide/unpublish controls read. Admin-only, and only
                for an approved school-wide post: the lib refuses anything else,
                this just doesn't offer the button. Publishing signs the body
                with #Category #School, so the toast says so. */}
            {viewerRole === "ADMIN" && post.scope === "SCHOOL" && post.status === "APPROVED" && (
              <button
                type="button"
                title={t("bulletin.shareGlobal")}
                aria-label={t("bulletin.shareGlobal")}
                className="tap grid place-items-center rounded-full text-fg-subtle hover:text-fg"
                onClick={() =>
                  startTransition(async () => {
                    const result = await publishGlobal(post.id);
                    toast(
                      result.ok
                        ? { tone: "ok", title: t("bulletin.sharedGlobal"), description: t("bulletin.sharedGlobalBody") }
                        : { tone: "danger", title: t("bulletin.couldNotDo"), description: result.error },
                    );
                    router.refresh();
                  })
                }
              >
                <GlobeIcon weight="regular" className="size-4" />
              </button>
            )}
            {post.scope === "GLOBAL" && (
              <Link
                href="/bulletin/global"
                title={t("bulletin.onGlobalFeed")}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong"
              >
                <GlobeIcon weight="fill" className="size-3" />
                {t("bulletin.onGlobalFeed")}
              </Link>
            )}
            {viewerRole === "ADMIN" && (
              <button
                type="button"
                aria-label={post.pinned ? t("bulletin.unpinThisPost") : t("bulletin.pinThisPost")}
                title={post.pinned ? t("bulletin.unpin") : t("bulletin.pinToTop")}
                className={cn(
                  "tap grid place-items-center rounded-full",
                  post.pinned ? "text-accent-strong" : "text-fg-subtle hover:text-fg",
                )}
                onClick={() =>
                  startTransition(async () => {
                    const result = await pin(post.id);
                    toast(
                      result.ok
                        ? { tone: "ok", title: result.pinned ? t("bulletin.pinnedToTop") : t("bulletin.unpinned") }
                        : { tone: "danger", title: t("bulletin.couldNotPin"), description: result.error },
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
                aria-label={t("bulletin.reportThisPost")}
                title={t("bulletin.report")}
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
                    title: t("bulletin.thanksForTelling"),
                    description: t("bulletin.teacherWillLook"),
                  }
                : { tone: "danger", duration: null, title: t("bulletin.didNotSend"), description: error },
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
  const t = useT();
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
          {t("bulletin.tellWhatWrong")}
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          {t("bulletin.teacherWillSee")}
        </p>

        <div role="radiogroup" aria-label={t("bulletin.reasonLabel")} className="mt-3 space-y-1.5">
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
              {t(option.labelKey)}
            </button>
          ))}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value.slice(0, 2000))}
          rows={2}
          placeholder={t("bulletin.detailPlaceholder")}
          aria-label={t("bulletin.moreDetail")}
          className="mt-3 w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
        />

        <div className="mt-3 flex gap-2">
          <Button variant="ghost" block onClick={onClose}>
            {t("common.cancel")}
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
            {t("common.send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
