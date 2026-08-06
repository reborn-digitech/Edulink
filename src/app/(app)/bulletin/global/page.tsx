import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, GlobeIcon, EyeSlashIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { listGlobalFeed } from "@/lib/global-feed";
import { relativeTime } from "@/lib/dates";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { GlobalPostControls } from "./controls";
import { getT } from "@/lib/i18n/server";

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
export default async function GlobalFeedPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN", "TEACHER", "STUDENT", "PARENT");
  const isAdmin = ctx.role === "ADMIN";
  const posts = await listGlobalFeed(ctx);

  return (
    <div className="space-y-5">
      <Link
        href="/bulletin"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("bulletin.ourBulletin")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("bulletin.globalFeed")}</h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("bulletin.globalIntro")}</p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={<GlobeIcon weight="duotone" className="size-8" />}
          title={t("bulletin.nothingShared")}
          description={t("bulletin.nothingSharedBody")}
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

                  {post.body && (
                    <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-fg-muted">
                      {post.body}
                    </p>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs text-fg-subtle">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

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
