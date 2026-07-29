import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { readJsonArray, writeJson, type MediaItem } from "./json";
import { publish, channel } from "./realtime";
import { notify } from "./notify";
import { audit } from "./audit";
import { AccessError, assertClassAccess } from "./tenancy";
import type { ActiveContext } from "./session";
import type { PostScope, PostStatus, ReactionKind, Role } from "./constants";

/**
 * Bulletin board.
 *
 * The safety model is the whole point, so it is stated once here:
 *
 *   * A TEACHER or ADMIN post is published immediately. They are accountable
 *     adults employed by the school.
 *   * A STUDENT post is created PENDING and is invisible to everyone except its
 *     author and the staff who can review it. Approval is required — for a
 *     CLASS post from a teacher of that class, for a SCHOOL post from an admin.
 *   * A rejection carries a reason, and the author sees it. "Rejected" with no
 *     explanation teaches a child that the system is arbitrary.
 *   * Comments from students are held for review the same way; comments from
 *     staff are not.
 *
 * Reactions are a fixed, kid-safe set (see REACTION_KINDS) so there is no
 * thumbs-down and nothing to weaponise.
 */

export type FeedPost = {
  id: string;
  scope: PostScope;
  title: string;
  body: string;
  tags: string[];
  media: MediaItem[];
  status: PostStatus;
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

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The visibility filter, in one place.
 *
 * Everyone sees APPROVED posts for their school (plus their own classes). On top
 * of that, an author sees their own posts in any state, and staff see the
 * pending queue. Nobody else ever sees a PENDING or REJECTED student post.
 */
function visibilityWhere(session: ActiveContext, classIds: string[]): Prisma.PostWhereInput {
  const { schoolId, user, role } = session;

  const approved: Prisma.PostWhereInput = {
    schoolId,
    status: "APPROVED",
    OR: [{ scope: "SCHOOL" }, { scope: "CLASS", classId: { in: classIds } }],
  };

  const mine: Prisma.PostWhereInput = { schoolId, authorUserId: user.id };

  if (role === "ADMIN") {
    // Admins can see everything in their own school, including the queue.
    return { schoolId };
  }
  if (role === "TEACHER") {
    return {
      OR: [
        approved,
        mine,
        // Pending student posts for classes this teacher actually teaches.
        { schoolId, status: "PENDING", scope: "CLASS", classId: { in: classIds } },
      ],
    };
  }
  // Students and parents: approved, plus a student's own drafts/pending.
  return { OR: [approved, mine] };
}

async function classIdsFor(session: ActiveContext): Promise<string[]> {
  const { schoolId, membershipId, role } = session;
  if (!schoolId) return [];

  if (role === "ADMIN") {
    const all = await db.class.findMany({ where: { schoolId }, select: { id: true } });
    return all.map((c) => c.id);
  }
  if (role === "TEACHER" && membershipId) {
    const rows = await db.classTeacher.findMany({
      where: { teacherMembershipId: membershipId, class: { schoolId } },
      select: { classId: true },
    });
    return rows.map((r) => r.classId);
  }
  if (role === "STUDENT" && membershipId) {
    const rows = await db.enrollment.findMany({
      where: { studentMembershipId: membershipId, status: "ACTIVE", class: { schoolId } },
      select: { classId: true },
    });
    return rows.map((r) => r.classId);
  }
  return [];
}

export async function listFeed(
  session: ActiveContext,
  opts: { tag?: string; status?: PostStatus; mineOnly?: boolean } = {},
): Promise<FeedPost[]> {
  if (!session.schoolId) return [];

  const classIds = await classIdsFor(session);
  const base = visibilityWhere(session, classIds);

  const where: Prisma.PostWhereInput = {
    AND: [
      base,
      ...(opts.status ? [{ status: opts.status }] : []),
      ...(opts.mineOnly ? [{ authorUserId: session.user.id }] : []),
      // Tags are a JSON string column, so this is a substring match on the
      // serialised array. Adequate for a handful of tags per post; a real tag
      // table is the fix if this ever needs to scale.
      ...(opts.tag ? [{ tags: { contains: `"${opts.tag}"` } }] : []),
    ],
  };

  const posts = await db.post.findMany({
    where,
    include: {
      author: { select: { name: true, preferredName: true, avatarKey: true } },
      authorship: { select: { role: true } },
      class: { select: { name: true } },
      reactions: { select: { kind: true, userId: true } },
      _count: { select: { comments: true } },
    },
    // Pinned first, then newest. Two keys so a pinned post does not need its
    // createdAt fudged to stay at the top.
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const canModerate = session.role === "ADMIN" || session.role === "TEACHER";

  return posts.map((post) => {
    const reactions: Record<string, number> = {};
    const myReactions: ReactionKind[] = [];
    for (const reaction of post.reactions) {
      reactions[reaction.kind] = (reactions[reaction.kind] ?? 0) + 1;
      if (reaction.userId === session.user.id) myReactions.push(reaction.kind as ReactionKind);
    }

    return {
      id: post.id,
      scope: post.scope as PostScope,
      title: post.title,
      body: post.body,
      tags: readJsonArray<string>(post.tags),
      media: readJsonArray<MediaItem>(post.media),
      status: post.status as PostStatus,
      rejectionReason: post.rejectionReason,
      pinned: post.pinnedAt !== null,
      createdAt: post.createdAt,
      authorName: post.author.preferredName ?? post.author.name,
      authorAvatar: post.author.avatarKey,
      authorRole: (post.authorship?.role as Role | undefined) ?? null,
      className: post.class?.name ?? null,
      commentCount: post._count.comments,
      reactions: reactions as Record<ReactionKind, number>,
      myReactions,
      canModerate,
      mine: post.authorUserId === session.user.id,
    };
  });
}

/** How many student posts are waiting on this person specifically. */
export async function pendingCount(session: ActiveContext): Promise<number> {
  if (!session.schoolId) return 0;
  if (session.role === "ADMIN") {
    return db.post.count({ where: { schoolId: session.schoolId, status: "PENDING" } });
  }
  if (session.role === "TEACHER") {
    const classIds = await classIdsFor(session);
    return db.post.count({
      where: {
        schoolId: session.schoolId,
        status: "PENDING",
        scope: "CLASS",
        classId: { in: classIds },
      },
    });
  }
  return 0;
}

export async function getPost(session: ActiveContext, postId: string) {
  const classIds = await classIdsFor(session);
  const post = await db.post.findFirst({
    where: { AND: [{ id: postId }, visibilityWhere(session, classIds)] },
    include: {
      author: { select: { id: true, name: true, preferredName: true, avatarKey: true } },
      authorship: { select: { role: true } },
      class: { select: { name: true } },
      reactions: { select: { kind: true, userId: true } },
      comments: {
        where:
          session.role === "ADMIN" || session.role === "TEACHER"
            ? {}
            : // Students and parents never see held comments other than their own.
              { OR: [{ status: "APPROVED" }, { authorUserId: session.user.id }] },
        include: { author: { select: { id: true, name: true, preferredName: true, avatarKey: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) throw new AccessError("Post not found", "NOT_FOUND");
  return post;
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                     */
/* -------------------------------------------------------------------------- */

export async function createPost(
  session: ActiveContext,
  input: {
    scope: PostScope;
    classId?: string;
    title: string;
    body: string;
    tags: string[];
    media: MediaItem[];
  },
): Promise<{ postId: string; status: PostStatus }> {
  const { schoolId, membershipId, role, user } = session;
  if (!schoolId || !role) throw new AccessError("No active school selected");

  // GLOBAL (cross-school) posting is not built. Refuse rather than silently
  // downgrading it to a school post, which would put a child's work somewhere
  // they did not choose.
  if (input.scope === "GLOBAL") {
    throw new AccessError("Posting to the global feed is not available yet.");
  }

  if (input.scope === "CLASS") {
    if (!input.classId) throw new AccessError("Choose a class.");
    if (role === "STUDENT") {
      // A student may only post to a class they are actually enrolled in.
      const enrolled = await db.enrollment.findFirst({
        where: {
          classId: input.classId,
          studentMembershipId: membershipId ?? "",
          status: "ACTIVE",
          class: { schoolId },
        },
        select: { id: true },
      });
      if (!enrolled) throw new AccessError("You are not in that class", "NOT_FOUND");
    } else {
      await assertClassAccess({ schoolId, membershipId: membershipId ?? "", role }, input.classId);
    }
  }

  if (input.scope === "SCHOOL" && role === "STUDENT") {
    // Allowed, but it goes to an admin rather than a class teacher.
  }

  // The single safety decision.
  const status: PostStatus = role === "STUDENT" ? "PENDING" : "APPROVED";

  const post = await db.post.create({
    data: {
      schoolId,
      classId: input.scope === "CLASS" ? input.classId! : null,
      authorUserId: user.id,
      authorMembershipId: membershipId,
      scope: input.scope,
      title: input.title,
      body: input.body,
      tags: writeJson(input.tags),
      media: writeJson(input.media),
      status,
      reviewedAt: status === "APPROVED" ? new Date() : null,
      reviewedByMembershipId: status === "APPROVED" ? membershipId : null,
    },
  });

  await audit({
    schoolId,
    actorUserId: user.id,
    action: status === "PENDING" ? "post.submit" : "post.publish",
    targetType: "Post",
    targetId: post.id,
    meta: { scope: input.scope },
  });

  if (status === "PENDING") {
    await notifyReviewers(schoolId, input.scope, input.classId ?? null, post.id, input.title);
  } else {
    publish(
      [channel.school(schoolId), ...(input.classId ? [channel.class(input.classId)] : [])],
      { type: "post.status", postId: post.id, status },
    );
  }

  return { postId: post.id, status };
}

/** Tells the people who can actually approve it — not the whole staff room. */
async function notifyReviewers(
  schoolId: string,
  scope: PostScope,
  classId: string | null,
  postId: string,
  title: string,
): Promise<void> {
  const reviewers =
    scope === "CLASS" && classId
      ? await db.membership.findMany({
          where: { schoolId, role: "TEACHER", status: "ACTIVE", classTeachers: { some: { classId } } },
          select: { userId: true },
        })
      : await db.membership.findMany({
          where: { schoolId, role: "ADMIN", status: "ACTIVE" },
          select: { userId: true },
        });

  await Promise.all(
    reviewers.map((reviewer) =>
      notify({
        userId: reviewer.userId,
        schoolId,
        kind: "POST",
        title: "A student post needs review",
        body: title,
        url: `/bulletin?filter=pending`,
      }),
    ),
  );
}

/**
 * Approve or reject a pending post.
 *
 * Re-derives who may review from the post itself: a CLASS post needs a teacher
 * of that class (or an admin), a SCHOOL post needs an admin. A teacher cannot
 * approve a school-wide post just because they can see it in their queue.
 */
export async function moderatePost(
  session: ActiveContext,
  postId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string,
): Promise<void> {
  const { schoolId, membershipId, role, user } = session;
  if (!schoolId || !membershipId || (role !== "TEACHER" && role !== "ADMIN")) {
    throw new AccessError("You cannot review posts");
  }

  const post = await db.post.findFirst({
    where: { id: postId, schoolId },
    select: { id: true, scope: true, classId: true, status: true, authorUserId: true, title: true },
  });
  if (!post) throw new AccessError("Post not found", "NOT_FOUND");
  if (post.status !== "PENDING") throw new AccessError("That post has already been reviewed");

  if (role === "TEACHER") {
    if (post.scope !== "CLASS" || !post.classId) {
      throw new AccessError("Only an admin can review a school-wide post");
    }
    const teaches = await db.classTeacher.findFirst({
      where: { classId: post.classId, teacherMembershipId: membershipId },
      select: { id: true },
    });
    if (!teaches) throw new AccessError("Post not found", "NOT_FOUND");
  }

  if (decision === "REJECT" && !reason?.trim()) {
    // A rejection with no reason teaches a child the system is arbitrary.
    throw new AccessError("Give a reason so the student knows what to change.");
  }

  await db.post.update({
    where: { id: postId },
    data: {
      status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
      rejectionReason: decision === "REJECT" ? reason!.trim() : null,
      reviewedAt: new Date(),
      reviewedByMembershipId: membershipId,
    },
  });

  await notify({
    userId: post.authorUserId,
    schoolId,
    kind: "POST",
    title: decision === "APPROVE" ? "Your post is live" : "Your post needs a change",
    body:
      decision === "APPROVE"
        ? post.title
        : `${post.title} — ${reason!.trim()}`,
    url: "/bulletin?filter=mine",
  });

  publish([channel.school(schoolId), ...(post.classId ? [channel.class(post.classId)] : [])], {
    type: "post.status",
    postId,
    status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
  });

  await audit({
    schoolId,
    actorUserId: user.id,
    action: decision === "APPROVE" ? "post.approve" : "post.reject",
    targetType: "Post",
    targetId: postId,
    meta: { reason: reason?.trim() ?? null },
  });
}

/** Pin / unpin. Admin-only: pinning is a whole-school editorial decision. */
export async function togglePin(session: ActiveContext, postId: string): Promise<boolean> {
  const { schoolId, role, user } = session;
  if (role !== "ADMIN" || !schoolId) throw new AccessError("Only an admin can pin a post");

  const post = await db.post.findFirst({
    where: { id: postId, schoolId, status: "APPROVED" },
    select: { pinnedAt: true },
  });
  if (!post) throw new AccessError("Post not found", "NOT_FOUND");

  const pinned = post.pinnedAt === null;
  await db.post.update({
    where: { id: postId },
    data: { pinnedAt: pinned ? new Date() : null },
  });

  await audit({
    schoolId,
    actorUserId: user.id,
    action: pinned ? "post.pin" : "post.unpin",
    targetType: "Post",
    targetId: postId,
  });

  return pinned;
}

/** Toggles one reaction. Unique per (post, user, kind), so this is idempotent. */
export async function toggleReaction(
  session: ActiveContext,
  postId: string,
  kind: ReactionKind,
): Promise<{ added: boolean }> {
  const classIds = await classIdsFor(session);
  const visible = await db.post.findFirst({
    where: { AND: [{ id: postId, status: "APPROVED" }, visibilityWhere(session, classIds)] },
    select: { id: true },
  });
  if (!visible) throw new AccessError("Post not found", "NOT_FOUND");

  const existing = await db.reaction.findUnique({
    where: { postId_userId_kind: { postId, userId: session.user.id, kind } },
    select: { id: true },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    return { added: false };
  }

  await db.reaction.create({ data: { postId, userId: session.user.id, kind } });
  return { added: true };
}

export async function addComment(
  session: ActiveContext,
  postId: string,
  body: string,
): Promise<{ status: "APPROVED" | "PENDING" }> {
  const classIds = await classIdsFor(session);
  const visible = await db.post.findFirst({
    where: { AND: [{ id: postId, status: "APPROVED" }, visibilityWhere(session, classIds)] },
    select: { id: true, authorUserId: true, schoolId: true, title: true },
  });
  if (!visible) throw new AccessError("Post not found", "NOT_FOUND");

  // Same rule as posts: a child's words are reviewed, an adult's are not.
  const status = session.role === "STUDENT" ? "PENDING" : "APPROVED";

  await db.comment.create({
    data: { postId, authorUserId: session.user.id, body: body.trim(), status },
  });

  if (status === "APPROVED" && visible.authorUserId !== session.user.id) {
    await notify({
      userId: visible.authorUserId,
      schoolId: visible.schoolId,
      kind: "POST",
      title: "New comment on your post",
      body: visible.title,
      url: `/bulletin/${postId}`,
    });
  }

  return { status };
}

/**
 * One-tap report.
 *
 * Never rejects a duplicate: if a child reports the same thing twice because
 * they were not sure it worked, that must not read as a failure.
 */
export async function reportContent(
  session: ActiveContext,
  input: { targetType: "POST" | "COMMENT" | "USER"; targetId: string; reason: string; detail?: string },
): Promise<void> {
  await db.report.create({
    data: {
      schoolId: session.schoolId,
      targetType: input.targetType,
      targetId: input.targetId,
      reporterUserId: session.user.id,
      reason: input.reason,
      detail: input.detail?.trim() || null,
    },
  });

  if (session.schoolId) {
    const admins = await db.membership.findMany({
      where: { schoolId: session.schoolId, role: "ADMIN", status: "ACTIVE" },
      select: { userId: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notify({
          userId: admin.userId,
          schoolId: session.schoolId,
          kind: "SYSTEM",
          title: "Something was reported",
          body: `A ${input.targetType.toLowerCase()} was reported as ${input.reason.toLowerCase().replace(/_/g, " ")}.`,
          url: "/bulletin?filter=pending",
          urgent: true, // safeguarding: bypasses quiet hours
        }),
      ),
    );
  }

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "content.report",
    targetType: input.targetType,
    targetId: input.targetId,
    meta: { reason: input.reason },
  });
}

/** Classes this person may post to. */
export async function postableClasses(session: ActiveContext) {
  const ids = await classIdsFor(session);
  if (ids.length === 0) return [];
  return db.class.findMany({
    where: { id: { in: ids }, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
