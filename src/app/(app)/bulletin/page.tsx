import type { Metadata } from "next";
import Link from "next/link";
import { MegaphoneIcon, PlusIcon, GlobeIcon} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { listFeed, pendingCount } from "@/lib/bulletin";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PostCard } from "./post-card";
import type { PostStatus } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.bulletin") };
}

export default async function BulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tag?: string }>;
}) {
  const session = await requireUser();
  const { filter, tag } = await searchParams;

  if (!session.schoolId) {
    return (
      <EmptyState
        icon={<MegaphoneIcon weight="duotone" className="size-8" />}
        title="No school selected"
        description="The bulletin belongs to a school. Pick one to see its notices."
        action={
          <Button asChild>
            <Link href="/switch">Choose a school</Link>
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
    }),
    pendingCount(session),
    db.school.findUniqueOrThrow({
      where: { id: session.schoolId },
      select: { name: true },
    }),
  ]);

  const tabs = [
    { id: "", label: "Everything" },
    ...(isStaff ? [{ id: "pending", label: `To review${queue > 0 ? ` (${queue})` : ""}` }] : []),
    { id: "mine", label: session.role === "STUDENT" ? "My posts" : "Mine" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Bulletin</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {tag ? (
              <>
                Tagged <strong className="text-fg">#{tag}</strong> ·{" "}
                <Link href="/bulletin" className="text-accent-strong underline underline-offset-2">
                  clear
                </Link>
              </>
            ) : (
              school.name
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" icon={<GlobeIcon weight="bold" />}>
            <Link href="/bulletin/global">Global feed</Link>
          </Button>
          <Button asChild icon={<PlusIcon weight="bold" />}>
            <Link href="/bulletin/new">
              {session.role === "STUDENT" ? "Share something" : "New post"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Students get told the rule up front, not after their post disappears. */}
      {session.role === "STUDENT" && !showMine && (
        <p className="rounded-[--radius-md] bg-accent-soft p-3.5 text-xs leading-relaxed text-fg-muted">
          Anything you post is read by a teacher before anyone else sees it. That usually
          takes a few hours — you can always see where yours are up to under{" "}
          <Link href="/bulletin?filter=mine" className="font-semibold text-accent-strong underline underline-offset-2">
            My posts
          </Link>
          .
        </p>
      )}

      <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label="Filter">
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

      {posts.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon weight="duotone" className="size-8" />}
          title={
            showPending
              ? "Nothing waiting for review"
              : showMine
                ? "You have not posted yet"
                : "The bulletin is empty"
          }
          description={
            showPending
              ? "Student posts appear here for you to approve before anyone else sees them."
              : showMine
                ? "Share something you have made or found. A teacher checks it first."
                : "Notices, celebrations and reminders from the school will show up here."
          }
          action={
            !showPending ? (
              <Button asChild>
                <Link href="/bulletin/new">
                  {session.role === "STUDENT" ? "Share something" : "Write the first post"}
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
