import type { Metadata } from "next";
import Link from "next/link";
import { MegaphoneIcon, PlusIcon, GlobeIcon} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listFeed, pendingCount, parentBulletinSchools, pendingByAuthor } from "@/lib/bulletin";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PostCard } from "./post-card";
import { BulkReview } from "./bulk-review";
import { FeedFilters } from "./feed-filters";
import { POST_CATEGORIES, type PostCategory, type PostStatus } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.bulletin") };
}

export default async function BulletinPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    tag?: string;
    school?: string;
    category?: string;
    q?: string;
  }>;
}) {
  const t = await getT();
  const session = await requireUser();
  const { filter, tag, school: requestedSchool, category: rawCategory, q: rawQ } = await searchParams;

  // A mangled category is nobody's filter; ignore it rather than 500 or match nothing.
  const category = POST_CATEGORIES.includes(rawCategory as PostCategory)
    ? (rawCategory as PostCategory)
    : undefined;
  const q = rawQ?.trim() || undefined;

  // A guardian's session carries no school by design; their children's
  // schools are the bulletins they may read. One child-school opens directly,
  // several get a picker below — "no school selected" is reserved for people
  // who genuinely have none.
  const parentSchools = await parentBulletinSchools(session);
  const activeSchoolId =
    session.schoolId ??
    (parentSchools.find((s) => s.id === requestedSchool)?.id ?? parentSchools[0]?.id ?? null);

  if (!activeSchoolId) {
    return (
      <EmptyState
        icon={<MegaphoneIcon weight="duotone" className="size-8" />}
        title={t("bulletin.noSchool")}
        description={t("bulletin.noSchoolBody")}
        action={
          <Button asChild>
            <Link href="/switch">{t("bulletin.chooseSchool")}</Link>
          </Button>
        }
      />
    );
  }

  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";
  const showPending = filter === "pending" && isStaff;
  const showMine = filter === "mine";

  const [posts, queue, school] = await Promise.all([
    listFeed(session, {
      tag,
      status: showPending ? ("PENDING" as PostStatus) : undefined,
      mineOnly: showMine,
      schoolId: activeSchoolId,
      category,
      q,
    }),
    pendingCount(session),
    db.school.findUniqueOrThrow({
      where: { id: activeSchoolId },
      select: { name: true },
    }),
  ]);

  const tabs = [
    { id: "", label: t("bulletin.tabEverything") },
    ...(isStaff
      ? [{ id: "pending", label: t("bulletin.tabToReview") + (queue > 0 ? ` (${queue})` : "") }]
      : []),
    { id: "mine", label: session.role === "STUDENT" ? t("bulletin.tabMyPosts") : t("bulletin.tabMine") },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("bulletin.title")}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {tag ? (
              <>
                {t("bulletin.tagged")} <strong className="text-fg">#{tag}</strong> ·{" "}
                <Link href="/bulletin" className="text-accent-strong underline underline-offset-2">
                  {t("bulletin.clearFilter")}
                </Link>
              </>
            ) : (
              school.name
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" icon={<GlobeIcon weight="bold" />}>
            <Link href="/bulletin/global">{t("bulletin.globalFeed")}</Link>
          </Button>
          {/* Guardians read; they do not post — no membership, no compose. A
              visible button that dead-ends on "pick a school" is worse than
              no button. */}
          {session.role !== "PARENT" && (
            <Button asChild icon={<PlusIcon weight="bold" />}>
              <Link href="/bulletin/new">
                {session.role === "STUDENT" ? t("bulletin.shareSomething") : t("bulletin.newPost")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* A family with children at two schools reads two bulletins. */}
      {parentSchools.length > 1 && (
        <nav aria-label={t("bulletin.chooseSchool")} className="flex flex-wrap gap-2">
          {parentSchools.map((s) => (
            <Link
              key={s.id}
              href={`/bulletin?school=${s.id}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                activeSchoolId === s.id ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      {/* Students get told the rule up front, not after their post disappears. */}
      {session.role === "STUDENT" && !showMine && (
        <p className="rounded-[--radius-md] bg-accent-soft p-3.5 text-xs leading-relaxed text-fg-muted">
          {/* Whole sentences, with the link standing alone after them — a
              fragment on each side of a link cannot be reordered. */}
          {t("bulletin.studentNotice")}{" "}
          <Link href="/bulletin?filter=mine" className="font-semibold text-accent-strong underline underline-offset-2">
            {t("bulletin.tabMyPosts")}
          </Link>
        </p>
      )}

      <FeedFilters
        basePath="/bulletin"
        category={category}
        q={q}
        tag={tag}
        extra={{
          ...(filter ? { filter } : {}),
          ...(requestedSchool ? { school: requestedSchool } : {}),
        }}
      />

      <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label={t("bulletin.filter")}>
        {tabs.map((t) => {
          const active = (filter ?? "") === t.id;
          return (
            <Link
              key={t.id || "all"}
              href={t.id ? `/bulletin?filter=${t.id}` : "/bulletin"}
              aria-current={active ? "page" : undefined}
              className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
                active ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {showPending && session.role === "ADMIN" && (
        <BulkReview authors={await pendingByAuthor(session)} />
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon weight="duotone" className="size-8" />}
          title={
            category || q
              ? t("bulletin.noMatchesTitle")
              : showPending
                ? t("bulletin.emptyPendingTitle")
                : showMine
                  ? t("bulletin.emptyMineTitle")
                  : t("bulletin.emptyTitle")
          }
          description={
            category || q
              ? t("bulletin.noMatchesBody")
              : showPending
                ? t("bulletin.emptyPendingBody")
                : showMine
                  ? t("bulletin.emptyMineBody")
                  : t("bulletin.emptyBody")
          }
          action={
            !showPending && session.role !== "PARENT" ? (
              <Button asChild>
                <Link href="/bulletin/new">
                  {session.role === "STUDENT" ? t("bulletin.shareSomething") : t("bulletin.writeFirst")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} viewerRole={session.role} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
