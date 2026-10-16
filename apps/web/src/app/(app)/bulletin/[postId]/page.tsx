import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { requireUser, AccessError } from "@/lib/tenancy";
import { getPost } from "@/lib/bulletin";
import { circularReach } from "@/lib/circulars";
import type { CircularReach } from "@edulink/contracts";
import { db } from "@/lib/db";
import { AckButton } from "./ack-button";
import { SlipAnswers, SlipReport } from "./slip";
import { slipForReader, slipReport } from "@/lib/permission-slips";
import { ReachReport } from "./reach-report";
import { readJsonArray, type MediaItem } from "@/lib/json";
import { formatDateKey, relativeTime } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { PersonLink } from "@/components/person-link";
import { Badge } from "@/components/ui/badge";
import { CommentBox } from "./comment-box";
import { CommentReview } from "../comment-review";
import { ReplyToggle } from "./reply-toggle";
import { ReactionRow } from "../reactions";
import { PostMedia } from "../media";
import { CATEGORY_KEYS } from "../categories";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { ROLE_META, type PostCategory, type Role } from "@/lib/constants";
import { PAGE_TITLE } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
// meta-posting (16 Oct 2026)
import { socialPostsFor } from "@/lib/social";
import { getRelativeTime } from "@/lib/i18n/server";
import { SocialStatus } from "./social-status";
// website-two (16 Oct 2026)
import { postOnSite } from "@/lib/site-admin";
import { SiteTick } from "./site-tick";
// end website-two
// end meta-posting

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

export default async function PostPage({ params, searchParams }: { params: Promise<{ postId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const session = await requireUser();
  const { postId } = await params;
  const sp = await searchParams;

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

  // A child's comment is held for review inside a school; on a GLOBAL post
  // everybody's is — see addComment, which owns this rule. The flag only
  // shapes the hint text, so it must tell the same truth.
  // A minor alumnus is held as a pupil is (alumni.ts, bulletin.ts addComment).
  const willBeHeld = session.role === "STUDENT" || (session.role === "ALUMNUS" && session.user.isMinor) || post.scope === "GLOBAL";

  // The reach report, for the people who chase it up: the office, the head
  // and the class teachers of the post's own school. A teacher of no class,
  // or of no class the circular is for, simply gets no report.
  let reach: CircularReach | null = null;
  let timezone = "UTC";
  const readsReach = (session.role === "ADMIN" || session.role === "PRINCIPAL" || session.role === "TEACHER") && session.schoolId === post.schoolId;
  if (readsReach && post.requiresAck && post.status === "APPROVED" && post.schoolId) {
    try {
      reach = await circularReach(session, post.id);
      const school = await db.school.findUnique({ where: { id: post.schoolId }, select: { timezone: true } });
      timezone = school?.timezone ?? "UTC";
    } catch (error) {
      if (!(error instanceof AccessError)) throw error;
    }
  }

  // A permission slip (5 Oct 2026, permission-slips.ts): the family's answers to give, or the staff's list of them.
  let slip: Awaited<ReturnType<typeof slipForReader>> | null = null;
  let slipAnswers: Awaited<ReturnType<typeof slipReport>> | null = null;
  if (post.consentQuestion && post.status === "APPROVED") {
    try {
      if (session.role === "PARENT" || session.role === "STUDENT") slip = await slipForReader(session, post.id);
      else if (readsReach) slipAnswers = await slipReport(session, post.id);
    } catch (error) {
      if (!(error instanceof AccessError)) throw error;
    }
  }
  // meta-posting (16 Oct 2026): the copies of a school-wide post sent to Facebook and Instagram, for the school's ADMIN.
  const socialItems = session.role === "ADMIN" && post.scope === "SCHOOL" && session.schoolId === post.schoolId ? await socialPostsFor(session, post.id) : [];
  const relative = socialItems.length > 0 ? await getRelativeTime() : null;
  // end meta-posting
  // website-two (16 Oct 2026): "Show on the website" for the office and the head, on a post the school's website may carry.
  const onSite = (session.role === "ADMIN" || session.role === "PRINCIPAL") && session.schoolId === post.schoolId && post.scope === "SCHOOL" ? await postOnSite(session, post.id) : null;
  // end website-two
  const slipDay = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {sp.ok ? <p role="status" className="rounded-[var(--radius-md)] bg-ok-soft px-3 py-2 text-sm text-ok">{sp.ok}</p> : null}
      {sp.error ? <p role="alert" className="rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger">{sp.error}</p> : null}
      <Link
        href="/bulletin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("bulletin.title")}
      </Link>

      <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <header className="flex items-start gap-3">
          <PersonLink membershipId={post.membershipByUser.get(post.author.id)} name={post.author.preferredName ?? post.author.name} className="shrink-0 rounded-full">
            <Avatar
              avatarKey={post.author.avatarKey}
              name={post.author.name}
              size="md"
            />
          </PersonLink>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-sm">
              <PersonLink
                membershipId={post.membershipByUser.get(post.author.id)}
                name={post.author.preferredName ?? post.author.name}
                className="font-semibold text-fg"
              />
              {post.authorship?.role && (
                <Badge tone={post.authorship.role === "ALUMNUS" ? "accent" : "neutral"} size="sm">
                  {post.authorship.role === "ALUMNUS" && post.authorBatch ? t("alumni.tag", { year: post.authorBatch }) : t(ROLE_META[post.authorship.role as Role].labelKey)}
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

        {/* Under the author's line in an article, so not a PageHeader; the title has its look (A3-states-9). */}
        <h1 className={cn(PAGE_TITLE, "mt-4 leading-snug")}>

          {post.title}
        </h1>

        <Link
          href={`/bulletin?category=${post.category}`}
          className="inline-flex min-h-11 items-center hover:underline"
        >
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong">{t(CATEGORY_KEYS[post.category as PostCategory].name)}</span>
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
        {/* A permission slip's yes or no for each child (5 Oct 2026); answering is also "seen and understood". */}
        {slip ? <SlipAnswers postId={post.id} slip={slip} t={t} day={slipDay} /> : null}
        {post.canAck && !slip && (
          <div className="mt-4 rounded-[var(--radius-md)] bg-accent-soft/40 p-3.5">
            <AckButton postId={post.id} acked={post.acks.length > 0} />
          </div>
        )}
      </article>

      {/* ---- who this circular has reached, class by class ---- */}
      {reach && <ReachReport reach={reach} office={session.role === "ADMIN" || session.role === "PRINCIPAL"} timezone={timezone} />}
      {slipAnswers && <SlipReport report={slipAnswers} t={t} day={slipDay} />}
      {/* meta-posting (16 Oct 2026) */}
      {relative ? <SocialStatus items={socialItems} postId={post.id} t={t} relative={relative} /> : null}
      {/* end meta-posting */}
      {onSite ? <SiteTick postId={post.id} on={onSite.on} /> : null}

      <section aria-labelledby="comments">
        <h2 id="comments" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {post.comments.length === 0
            ? t("bulletin.comments")
            : post.comments.length === 1
              ? t("bulletin.commentsOne")
              : t("bulletin.commentsMany", { count: post.comments.length })}
        </h2>

        {post.comments.length === 0 ? (
          <p className="mt-2 rounded-[var(--radius-md)] bg-surface-muted p-4 text-sm text-fg-muted">
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
                  className={`flex gap-3 rounded-[var(--radius-md)] border p-3 ${
                    held ? "border-warn/40 bg-warn-soft/40" : "border-border bg-surface"
                  }`}
                >
                  <PersonLink membershipId={post.membershipByUser.get(entry.author.id)} name={entry.author.preferredName ?? entry.author.name} className="shrink-0 rounded-full">
                    <Avatar
                      avatarKey={entry.author.avatarKey}
                      name={entry.author.name}
                      size={isReply ? "xs" : "sm"}
                    />
                  </PersonLink>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg-muted">
                      <PersonLink
                        membershipId={post.membershipByUser.get(entry.author.id)}
                        name={mine ? t("common.you") : (entry.author.preferredName ?? entry.author.name)}
                        className="font-semibold text-fg"
                      />{" "}
                      {/* The commenter's tag at this school (3 Oct 2026): Student, Alumni with the year, or a staff role. */}
                      {(() => {
                        const tag = post.tagByUser.get(entry.author.id);
                        if (!tag) return null;
                        return (
                          <Badge tone={tag.role === "ALUMNUS" ? "accent" : "neutral"} size="sm" className="mx-1 align-middle">
                            {tag.role === "ALUMNUS" && tag.batch ? t("alumni.tag", { year: tag.batch }) : t(ROLE_META[tag.role].labelKey)}
                          </Badge>
                        );
                      })()}
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
                    {/* Only where pressing would be accepted: the lib works out
                        which held comments this reader may decide. */}
                    {held && post.reviewableCommentIds.has(entry.id) && (
                      <CommentReview commentId={entry.id} postId={post.id} authorName={entry.author.preferredName ?? entry.author.name} />
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
