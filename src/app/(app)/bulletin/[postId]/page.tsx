import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { requireUser, AccessError } from "@/lib/tenancy";
import { getPost } from "@/lib/bulletin";
import { readJsonArray } from "@/lib/json";
import { relativeTime } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CommentBox } from "./comment-box";
import { getT } from "@/lib/i18n/server";
import { ROLE_META, type Role } from "@/lib/constants";

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
  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";

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

        {post.body && (
          <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-fg">
            {post.body}
          </p>
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
      </article>

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
          <ul className="mt-2 space-y-2">
            {post.comments.map((entry) => {
              const held = entry.status === "PENDING";
              const mine = entry.authorUserId === session.user.id;
              return (
                <li
                  key={entry.id}
                  className={`flex gap-3 rounded-[--radius-md] border p-3 ${
                    held ? "border-warn/40 bg-warn-soft/40" : "border-border bg-surface"
                  }`}
                >
                  <Avatar
                    avatarKey={entry.author.avatarKey}
                    name={entry.author.name}
                    size="sm"
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {post.status === "APPROVED" && (
          <CommentBox
            postId={post.id}
            className="mt-4"
            willBeHeld={session.role === "STUDENT"}
          />
        )}

        {isStaff && post.comments.some((c) => c.status === "PENDING") && (
          <p className="mt-3 text-xs text-fg-muted">{t("bulletin.pendingVisibleToYou")}</p>
        )}
      </section>
    </div>
  );
}
