import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { readJsonArray, type MediaItem } from "./json";
import type { ActiveContext } from "./session";

/**
 * The global feed — the one surface where a school reads another school's post.
 *
 * WHY THIS IS NOT JUST `scope = "GLOBAL"` IN `listFeed`. The bulletin's
 * visibility filter pins `schoolId` in every branch, deliberately, and the RLS
 * policy behind it does the same. Widening either to let other schools' rows
 * through would put cross-school content one forgotten `AND` away from the
 * school feed — and the school feed carries pending student posts, rejection
 * reasons and class-private notices. So the global feed is a separate module
 * against a separately-widened policy clause, and the school feed is untouched.
 *
 * THE MODERATION PROBLEM, AND THE ANSWER. There is no role in this app above a
 * school: ROLES is ADMIN, TEACHER, STUDENT, PARENT and all four are scoped to
 * one school. A global feed therefore has nobody who could moderate it on
 * everyone's behalf, and inventing that actor is a much larger decision than a
 * feed — it means someone outside every school with read access to content from
 * all of them.
 *
 * So no such actor is invented. Instead the authority is split along the line
 * that already exists:
 *
 *   PUBLISHING is a write inside the owning school. Only that school's admin
 *   can promote one of their own already-APPROVED posts, and `schoolId` stays
 *   on the row, so provenance and accountability never leave the school that
 *   published it. The RLS clause is read-only, so no school can edit, approve or
 *   delete another's post — not "is not offered a button", but cannot.
 *
 *   SHOWING is a decision inside the consuming school. Any school's admin can
 *   hide any global post from their OWN people, and that hide is a tenant-scoped
 *   row invisible to everybody else.
 *
 * Neither school can reach into the other. What is missing — a way to take a
 * post down for everyone — is missing ON PURPOSE and is written up in the README
 * rather than papered over: it needs the actor above a school that does not
 * exist yet.
 */

export type GlobalPost = {
  id: string;
  title: string;
  body: string;
  media: MediaItem[];
  tags: string[];
  createdAt: Date;
  authorName: string;
  /** The school that published it. Never null — provenance is the point. */
  schoolName: string;
  schoolId: string;
  /** True when this is the reader's own school's post. */
  ours: boolean;
  /** True when this school's admin has hidden it locally. Staff-only view. */
  hiddenHere: boolean;
};

/**
 * Approved global posts from every school, newest first.
 *
 * Hidden posts are removed for everyone EXCEPT staff of the school that hid
 * them, who keep seeing them marked as hidden — otherwise an admin cannot undo
 * their own hide, because the thing they need to click has vanished.
 */
export async function listGlobalFeed(
  session: ActiveContext,
  opts: { includeHidden?: boolean } = {},
): Promise<GlobalPost[]> {
  const schoolId = session.schoolId;
  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";

  const [posts, hides] = await Promise.all([
    db.post.findMany({
      where: { scope: "GLOBAL", status: "APPROVED" },
      include: {
        author: { select: { name: true, preferredName: true } },
        // Readable only for our OWN school's posts — another school's School row
        // is behind its own policy, correctly. `globalSchoolName` is the copy
        // that survives the boundary; this relation is the nicer name when it
        // happens to be readable.
        school: { select: { id: true, name: true } },
      },
      orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    schoolId
      ? db.globalPostHide.findMany({ where: { schoolId }, select: { postId: true } })
      : Promise.resolve([]),
  ]);

  const hidden = new Set(hides.map((h) => h.postId));
  const showHidden = isStaff && opts.includeHidden !== false;

  return posts
    .filter((post) => showHidden || !hidden.has(post.id))
    .map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      media: readJsonArray<MediaItem>(post.media),
      tags: readJsonArray<string>(post.tags),
      createdAt: post.createdAt,
      authorName: post.author.preferredName ?? post.author.name,
      // The denormalised name FIRST: it is the only one readable from another
      // school. The relation is the fallback for our own posts and for any row
      // published before this column existed.
      schoolName: post.globalSchoolName ?? post.school?.name ?? "Unknown school",
      schoolId: post.school?.id ?? "",
      ours: post.schoolId === schoolId,
      hiddenHere: hidden.has(post.id),
    }));
}

/**
 * Promotes one of this school's approved posts to the global feed.
 *
 * ALREADY-APPROVED ONLY, and admin-only. A post that its own school has not
 * approved has not been read by anybody with responsibility for it, and the
 * global feed is the last place that should be the first check. This also means
 * publishing globally is never a way to skip moderation: the school queue comes
 * first, always.
 */
export async function publishGlobally(session: ActiveContext, postId: string): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("Only a school admin can publish to the global feed");
  }

  // Scoped find before the write. RLS would refuse a cross-school update, but
  // an unscoped `update` would report success on zero rows.
  const post = await db.post.findFirst({
    where: { id: postId, schoolId: session.schoolId },
    select: { id: true, status: true, scope: true, title: true, school: { select: { name: true } } },
  });
  if (!post) throw new AccessError("No such post", "NOT_FOUND");
  if (post.status !== "APPROVED") {
    throw new AccessError("Approve the post for your own school first");
  }
  if (post.scope === "GLOBAL") return; // already there; not an error

  // The name is stamped HERE, at the moment of publishing, because this is the
  // last point at which the publishing school's own row is readable.
  await db.post.update({
    where: { id: post.id },
    data: { scope: "GLOBAL", globalSchoolName: post.school?.name ?? null },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "post.publishGlobal",
    targetType: "Post",
    targetId: post.id,
    meta: { title: post.title },
  });
}

/** Takes this school's post back off the global feed. Returns it to SCHOOL scope. */
export async function unpublishGlobally(session: ActiveContext, postId: string): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("Only a school admin can change what their school publishes");
  }

  const post = await db.post.findFirst({
    where: { id: postId, schoolId: session.schoolId, scope: "GLOBAL" },
    select: { id: true, title: true },
  });
  if (!post) throw new AccessError("No such post", "NOT_FOUND");

  await db.post.update({ where: { id: post.id }, data: { scope: "SCHOOL" } });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "post.unpublishGlobal",
    targetType: "Post",
    targetId: post.id,
    meta: { title: post.title },
  });
}

/**
 * Hides a global post from this school's people only.
 *
 * Works on ANY global post, including another school's — that is the whole
 * point, and it is safe because the row written is this school's own. It does
 * not touch the post, so the publishing school sees no change and no other
 * school is affected.
 */
export async function hideGlobalPost(
  session: ActiveContext,
  postId: string,
  reason?: string,
): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("Only a school admin can hide a global post");
  }

  // Readable through the global clause, which is exactly the set that may be
  // hidden. A school-private post of another school is not findable here.
  const post = await db.post.findFirst({
    where: { id: postId, scope: "GLOBAL", status: "APPROVED" },
    select: { id: true, title: true, schoolId: true },
  });
  if (!post) throw new AccessError("No such post", "NOT_FOUND");

  await db.globalPostHide.upsert({
    where: { schoolId_postId: { schoolId: session.schoolId, postId } },
    create: {
      schoolId: session.schoolId,
      postId,
      hiddenByMembershipId: session.membershipId,
      reason: reason?.trim() || null,
    },
    update: { reason: reason?.trim() || null },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "globalPost.hide",
    targetType: "Post",
    targetId: postId,
    meta: { title: post.title, publishedBy: post.schoolId },
  });
}

/** Undoes a hide. Deleting the row is the whole operation. */
export async function unhideGlobalPost(session: ActiveContext, postId: string): Promise<void> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("Only a school admin can unhide a global post");
  }

  await db.globalPostHide.deleteMany({ where: { schoolId: session.schoolId, postId } });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "globalPost.unhide",
    targetType: "Post",
    targetId: postId,
  });
}
