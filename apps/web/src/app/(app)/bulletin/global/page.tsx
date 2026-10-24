import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ChatCircleIcon, GlobeIcon, EyeSlashIcon } from "@phosphor-icons/react/ssr";
import { requireRole, requireParent, requireUser } from "@/lib/tenancy";
import { listGlobalFeed } from "@/lib/global-feed";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { GlobalPostControls } from "./controls";
import { FeedFilters } from "../feed-filters";
import { PostMedia } from "../media";
import { ReactionRow } from "../reactions";
import { CATEGORY_KEYS } from "../categories";
import { COLLEGE_ROLES, POST_CATEGORIES, type PostCategory } from "@/lib/constants";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { pageOpener } from "@/lib/page-links";
import { institutionKindOf } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.globalFeed") };
}

/**
 * The global feed.
 *
 * A SEPARATE PAGE, not a filter on the school bulletin. Content from other
 * schools is a different thing from a notice by your own head teacher, and
 * mixing them would mean a child scrolling their school's feed cannot tell
 * which is which. It also keeps the school feed's query untouched — the one
 * that carries pending student posts and rejection reasons.
 */
export default async function GlobalFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; tag?: string }>;
}) {
  // The reader's language, not English under a Hindi or Marathi page (QA-20).
  const relativeTime = await getRelativeTime();
  const t = await getT();
  /* A parent's session deliberately carries NO active school, so requireRole's
   * school demand bounced every guardian to a switcher that had no school to
   * offer them — the global feed was unreachable for exactly the people with
   * children at more than one school. Same guard split as /reviews: parents
   * through the guard shaped for them, everyone else through requireRole —
   * which also now admits the PRINCIPAL, who was locked out by omission. */
  const who = await requireUser();
  const ctx =
    who.role === "PARENT"
      ? await requireParent()
      : // Every role of a school or a college reads it (4 Oct 2026, global-feed.ts globalReader); the
        // gate (role-gate.ts) lets a limited role reach this page only where its NAV names the feed.
        await requireRole("ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", ...COLLEGE_ROLES);
  const isAdmin = ctx.role === "ADMIN";
  // A driver, the library desk or a warden reads this feed and nothing else of the bulletin: the school's
  // feed, the birthdays and a post's own page are not theirs, so those links are left out (QA-19).
  const opens = await pageOpener(ctx);
  // A college's feed is the college's (QA-69).
  const college = isCollegeKind(await institutionKindOf(ctx.schoolId));

  const { category: rawCategory, q: rawQ, tag: rawTag } = await searchParams;
  const category = POST_CATEGORIES.includes(rawCategory as PostCategory)
    ? (rawCategory as PostCategory)
    : undefined;
  const q = rawQ?.trim() || undefined;
  const tag = rawTag?.trim().replace(/^#/, "").slice(0, 40) || undefined;

  const posts = await listGlobalFeed(ctx, { category, q, tag });

  return (
    <div className="space-y-5">
      {opens("/bulletin") && (
        <Link
          href="/bulletin"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t(college ? "qaInterface.ourCollegeFeed" : "bulletin.ourBulletin")}
        </Link>
      )}

      <PageHeader title={t("bulletin.globalFeed")} description={t("bulletin.globalIntro")} />

      <FeedFilters basePath="/bulletin/global" category={category} q={q} tag={tag} upcoming={opens("/bulletin/celebrations")} />

      {posts.length === 0 ? (
        <EmptyState
          icon={<GlobeIcon weight="duotone" className="size-8" />}
          title={category || q || tag ? t("bulletin.noMatchesTitle") : t("bulletin.nothingShared")}
          description={category || q || tag ? t("bulletin.noMatchesBody") : t("bulletin.nothingSharedBody")}
        />
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card className={post.hiddenHere ? "opacity-70" : undefined}>
                <CardBody className="space-y-3 pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={post.ours ? "accent" : "neutral"} size="sm">
                      {post.schoolName || t("bulletin.unknownSchool")}
                    </Badge>
                    {post.ours && (
                      <Badge tone="accent" size="sm">
                        {t("bulletin.ours")}
                      </Badge>
                    )}
                    {post.hiddenHere && (
                      <Badge tone="warn" size="sm">
                        <EyeSlashIcon weight="fill" className="mr-1 inline size-3" />
                        {t("bulletin.hiddenHere")}
                      </Badge>
                    )}
                    <span className="ml-auto text-xs text-fg-muted">
                      {relativeTime(post.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-fg">{post.title}</h2>
                    <p className="mt-1 text-xs text-fg-muted">{t("bulletin.byAuthor", { name: post.authorName })}</p>
                  </div>

                  <Link
                    href={`/bulletin/global?category=${post.category}`}
                    className="inline-flex min-h-11 items-center hover:underline w-fit"
                  >
                    <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong">{t(CATEGORY_KEYS[post.category].name)}</span>
                  </Link>

                  {post.body && (
                    <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-fg-muted">
                      {post.body}
                    </p>
                  )}

                  <PostMedia media={post.media} />

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs text-fg-subtle">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* The conversation crosses with the post: any signed-in
                      reader from any school reacts here and comments on the
                      post page — the widened row policies are what allow
                      exactly this and nothing more. */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    <ReactionRow
                      postId={post.id}
                      reactions={post.reactions}
                      myReactions={post.myReactions}
                    />
                    {opens(`/bulletin/${post.id}`) ? (
                      <Link
                        href={`/bulletin/${post.id}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
                      >
                        <ChatCircleIcon className="size-4" aria-hidden="true" />
                        {post.commentCount > 0
                          ? post.commentCount === 1
                            ? t("bulletin.commentsOne")
                            : t("bulletin.commentsMany", { count: post.commentCount })
                          : t("bulletin.comment")}
                      </Link>
                    ) : post.commentCount > 0 ? (
                      // The post's own page is not this reader's: the count is said, not offered as a door.
                      <span className="inline-flex min-h-10 items-center gap-1.5 px-3 text-sm text-fg-muted">
                        <ChatCircleIcon className="size-4" aria-hidden="true" />
                        {post.commentCount === 1 ? t("bulletin.commentsOne") : t("bulletin.commentsMany", { count: post.commentCount })}
                      </span>
                    ) : null}
                  </div>

                  {isAdmin && (
                    <GlobalPostControls
                      postId={post.id}
                      ours={post.ours}
                      hiddenHere={post.hiddenHere}
                    />
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <p className="max-w-prose text-xs text-fg-muted">
          {t("bulletin.hideExplainer")}
        </p>
      )}
    </div>
  );
}
