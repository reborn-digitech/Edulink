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
  audience: PostAudience;
  audienceGrade: string | null;
  requiresAck: boolean;
  acked: boolean;
  ackCount: number;
};

export const POST_AUDIENCES = ["ALL", "PARENTS", "TEACHERS", "STUDENTS"] as const;
export type PostAudience = (typeof POST_AUDIENCES)[number];

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
function visibilityWhere(
  session: ActiveContext,
  classIds: string[],
  grades: string[],
): Prisma.PostWhereInput {
  const { schoolId, user, role } = session;

  const approved: Prisma.PostWhereInput = {
    schoolId,
    status: "APPROVED",
    AND: [
      { OR: [{ scope: "SCHOOL" }, { scope: "CLASS", classId: { in: classIds } }] },
      ...audienceWhere(role, grades),
    ],
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

/**
 * The audience filter — a COURTESY, not a secrecy boundary. RLS still lets the
 * whole school read the row; this only keeps a sports-day notice for Grade 5
 * families out of a Grade 9 teenager's feed. Staff keep seeing TEACHERS posts
 * plus everything untargeted; admins are filtered nowhere.
 */
function audienceWhere(role: Role | null, grades: string[]): Prisma.PostWhereInput[] {
  if (role === "ADMIN") return [];
  if (role === "TEACHER" || role === "PRINCIPAL") {
    return [{ audience: { in: ["ALL", "TEACHERS"] } }];
  }
  const audiences = role === "PARENT" ? ["ALL", "PARENTS"] : ["ALL", "STUDENTS"];
  return [
    { audience: { in: audiences } },
    { OR: [{ audienceGrade: null }, { audienceGrade: { in: grades } }] },
  ];
}

/**
 * The grades this reader is connected to: a pupil's own classes' grades, or —
 * for a guardian — the grades of every child of theirs enrolled at this school.
 * Staff never need the answer, so this stays cheap for the roles that do.
 */
async function gradesFor(session: ActiveContext): Promise<string[]> {
  const { schoolId, membershipId, role, user } = session;
  if (!schoolId) return [];

  if (role === "STUDENT" && membershipId) {
    const rows = await db.enrollment.findMany({
      where: { studentMembershipId: membershipId, status: "ACTIVE", class: { schoolId } },
      select: { class: { select: { gradeLevel: true } } },
    });
    return [...new Set(rows.map((r) => r.class.gradeLevel).filter((g): g is string => g !== null))];
  }
  if (role === "PARENT") {
    const rows = await db.enrollment.findMany({
      where: {
        status: "ACTIVE",
        class: { schoolId },
        student: {
          guardianships: { some: { parentUserId: user.id, status: "ACTIVE" } },
        },
      },
      select: { class: { select: { gradeLevel: true } } },
    });
    return [...new Set(rows.map((r) => r.class.gradeLevel).filter((g): g is string => g !== null))];
  }
  return [];
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
  const grades = await gradesFor(session);
  const base = visibilityWhere(session, classIds, grades);

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
      acks: { where: { userId: session.user.id }, select: { id: true } },
      _count: { select: { comments: true, acks: true } },
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
      audience: post.audience as PostAudience,
      audienceGrade: post.audienceGrade,
      requiresAck: post.requiresAck,
      acked: post.acks.length > 0,
      ackCount: post._count.acks,
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
  const grades = await gradesFor(session);
  const post = await db.post.findFirst({
    where: { AND: [{ id: postId }, visibilityWhere(session, classIds, grades)] },
    include: {
      author: { select: { id: true, name: true, preferredName: true, avatarKey: true } },
      authorship: { select: { role: true } },
      class: { select: { name: true } },
      reactions: { select: { kind: true, userId: true } },
      acks: { where: { userId: session.user.id }, select: { id: true } },
      _count: { select: { acks: true } },
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

  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");
  return post;
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The school a comment or reaction inherits, taken from the post itself.
 *
 * Not from the session: the denormalised `schoolId` is only worth having if it
 * provably equals its parent's, and a session's school is a different fact that
 * merely usually agrees. `Post.schoolId` is nullable because the schema allows a
 * GLOBAL post by an outside organiser; posting GLOBAL is refused, so meeting one
 * here means something is wrong and refusing is the same stance `files.ts` takes
 * rather than guessing a tenant for it.
 */
function schoolOf(post: { schoolId: string | null }): string {
  if (!post.schoolId) throw new AccessError("access.postNotFound", "NOT_FOUND");
  return post.schoolId;
}

export async function createPost(
  session: ActiveContext,
  input: {
    scope: PostScope;
    classId?: string;
    title: string;
    body: string;
    tags: string[];
    media: MediaItem[];
    audience?: PostAudience;
    audienceGrade?: string;
    requiresAck?: boolean;
  },
): Promise<{ postId: string; status: PostStatus }> {
  const { schoolId, membershipId, role, user } = session;
  if (!schoolId || !role) throw new AccessError("access.noActiveSchoolSelected");

  // Targeting and "seen and understood" are staff instruments — a circular is
  // something the SCHOOL sends. A student post is for everyone, always.
  const isStaff = role === "ADMIN" || role === "PRINCIPAL" || role === "TEACHER";
  const audience: PostAudience =
    isStaff && input.audience && POST_AUDIENCES.includes(input.audience) ? input.audience : "ALL";
  // A grade filter only means something on a school-wide notice aimed at pupils
  // or their families; a class post already names its readers.
  const audienceGrade =
    isStaff && input.scope === "SCHOOL" && audience !== "TEACHERS"
      ? input.audienceGrade?.trim() || null
      : null;
  const requiresAck = isStaff && input.requiresAck === true;

  // GLOBAL (cross-school) posting is not built. Refuse rather than silently
  // downgrading it to a school post, which would put a child's work somewhere
  // they did not choose.
  if (input.scope === "GLOBAL") {
    throw new AccessError("access.postingToTheGlobalFeedIsNot");
  }

  if (input.scope === "CLASS") {
    if (!input.classId) throw new AccessError("access.chooseAClass");
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
      if (!enrolled) throw new AccessError("access.youAreNotInThatClass", "NOT_FOUND");
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
      audience,
      audienceGrade,
      requiresAck,
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
    throw new AccessError("access.youCannotReviewPosts");
  }

  const post = await db.post.findFirst({
    where: { id: postId, schoolId },
    select: { id: true, scope: true, classId: true, status: true, authorUserId: true, title: true },
  });
  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");
  if (post.status !== "PENDING") throw new AccessError("access.thatPostHasAlreadyBeenReviewed");

  if (role === "TEACHER") {
    if (post.scope !== "CLASS" || !post.classId) {
      throw new AccessError("access.onlyAnAdminCanReviewASchool");
    }
    const teaches = await db.classTeacher.findFirst({
      where: { classId: post.classId, teacherMembershipId: membershipId },
      select: { id: true },
    });
    if (!teaches) throw new AccessError("access.postNotFound", "NOT_FOUND");
  }

  if (decision === "REJECT" && !reason?.trim()) {
    // A rejection with no reason teaches a child the system is arbitrary.
    throw new AccessError("access.giveAReasonSoTheStudentKnows");
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
  if (role !== "ADMIN" || !schoolId) throw new AccessError("access.onlyAnAdminCanPinAPost");

  const post = await db.post.findFirst({
    where: { id: postId, schoolId, status: "APPROVED" },
    select: { pinnedAt: true },
  });
  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");

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
  const grades = await gradesFor(session);
  const visible = await db.post.findFirst({
    where: { AND: [{ id: postId, status: "APPROVED" }, visibilityWhere(session, classIds, grades)] },
    select: { id: true, schoolId: true },
  });
  if (!visible) throw new AccessError("access.postNotFound", "NOT_FOUND");

  const existing = await db.reaction.findUnique({
    where: { postId_userId_kind: { postId, userId: session.user.id, kind } },
    select: { id: true },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    return { added: false };
  }

  await db.reaction.create({
    data: { postId, userId: session.user.id, kind, schoolId: schoolOf(visible) },
  });
  return { added: true };
}

export async function addComment(
  session: ActiveContext,
  postId: string,
  body: string,
): Promise<{ status: "APPROVED" | "PENDING" }> {
  const classIds = await classIdsFor(session);
  const grades = await gradesFor(session);
  const visible = await db.post.findFirst({
    where: { AND: [{ id: postId, status: "APPROVED" }, visibilityWhere(session, classIds, grades)] },
    select: { id: true, authorUserId: true, schoolId: true, title: true },
  });
  if (!visible) throw new AccessError("access.postNotFound", "NOT_FOUND");

  // Same rule as posts: a child's words are reviewed, an adult's are not.
  const status = session.role === "STUDENT" ? "PENDING" : "APPROVED";

  await db.comment.create({
    data: {
      postId,
      authorUserId: session.user.id,
      body: body.trim(),
      status,
      schoolId: schoolOf(visible),
    },
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

/* -------------------------------------------------------------------------- */
/* Acknowledgements                                                            */
/* -------------------------------------------------------------------------- */

/**
 * One tap: "seen and understood". Idempotent — tapping twice because the first
 * tap felt uncertain must read as success, the same stance reportContent takes.
 */
export async function acknowledgePost(session: ActiveContext, postId: string): Promise<void> {
  const classIds = await classIdsFor(session);
  const grades = await gradesFor(session);
  const visible = await db.post.findFirst({
    where: {
      AND: [{ id: postId, status: "APPROVED", requiresAck: true }, visibilityWhere(session, classIds, grades)],
    },
    select: { id: true, schoolId: true },
  });
  if (!visible) throw new AccessError("access.postNotFound", "NOT_FOUND");

  await db.postAck.upsert({
    where: { postId_userId: { postId, userId: session.user.id } },
    update: {},
    create: { postId, userId: session.user.id, schoolId: schoolOf(visible) },
  });
}

export type AckGroup = {
  classId: string | null;
  className: string;
  total: number;
  reached: number;
  outstanding: string[];
};

/**
 * Who a circular has reached, for the staff who sent it — grouped by class,
 * because "chase up 5B" is the action a school can actually take.
 *
 * THE UNIT IS THE CHILD'S FAMILY, not the tapping finger: for a PARENTS
 * circular a pupil counts as reached when ANY of their guardians acknowledged;
 * for ALL, when the pupil or any guardian did. This is a delivery checklist —
 * naming who has not seen a notice is the whole point, and nothing here ranks
 * anybody.
 *
 * A teacher sees only their own classes; an admin sees every class. A TEACHERS
 * circular has no classes to group by, so it comes back as one staff group.
 */
export async function ackReport(session: ActiveContext, postId: string): Promise<AckGroup[]> {
  const { schoolId, membershipId, role } = session;
  if (!schoolId || (role !== "ADMIN" && role !== "TEACHER")) {
    throw new AccessError("access.postNotFound", "NOT_FOUND");
  }

  const post = await db.post.findFirst({
    where: { id: postId, schoolId, requiresAck: true, status: "APPROVED" },
    select: { id: true, audience: true, audienceGrade: true },
  });
  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");

  const acks = await db.postAck.findMany({ where: { postId }, select: { userId: true } });
  const ackSet = new Set(acks.map((a) => a.userId));

  if (post.audience === "TEACHERS") {
    // Staff notice: one group, every active teacher and admin by name.
    const staff = await db.membership.findMany({
      where: { schoolId, role: { in: ["ADMIN", "TEACHER"] }, status: "ACTIVE" },
      select: { userId: true, user: { select: { name: true, preferredName: true } } },
    });
    // A user with two staff memberships is still one reader.
    const byUser = new Map(staff.map((m) => [m.userId, m.user.preferredName ?? m.user.name]));
    const outstanding = [...byUser.entries()].filter(([id]) => !ackSet.has(id)).map(([, name]) => name);
    return [
      {
        classId: null,
        className: "",
        total: byUser.size,
        reached: byUser.size - outstanding.length,
        outstanding: outstanding.sort(),
      },
    ];
  }

  const classes = await db.class.findMany({
    where: {
      schoolId,
      archivedAt: null,
      ...(post.audienceGrade ? { gradeLevel: post.audienceGrade } : {}),
      ...(role === "TEACHER" ? { teachers: { some: { teacherMembershipId: membershipId ?? "" } } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          student: {
            select: {
              id: true,
              userId: true,
              user: { select: { name: true, preferredName: true } },
              guardianships: { where: { status: "ACTIVE" }, select: { parentUserId: true } },
            },
          },
        },
      },
    },
  });

  return classes.map((klass) => {
    const outstanding: string[] = [];
    let reached = 0;
    for (const { student } of klass.enrollments) {
      const guardianAcked = student.guardianships.some((g) => ackSet.has(g.parentUserId));
      const pupilAcked = ackSet.has(student.userId);
      const ok =
        post.audience === "PARENTS"
          ? guardianAcked
          : post.audience === "STUDENTS"
            ? pupilAcked
            : pupilAcked || guardianAcked;
      if (ok) reached += 1;
      else outstanding.push(student.user.preferredName ?? student.user.name);
    }
    return {
      classId: klass.id,
      className: klass.name,
      total: klass.enrollments.length,
      reached,
      outstanding: outstanding.sort(),
    };
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
