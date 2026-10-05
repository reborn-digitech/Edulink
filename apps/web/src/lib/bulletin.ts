import "server-only";
import { audienceTokensFor, isTargetToken, targetToken } from "./college-audience";
import type { AudienceTarget } from "@edulink/contracts";
import { queueCircularDelivery, recordPostRead } from "./circulars";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { readJsonArray, writeJson, type MediaItem } from "./json";
import { publish, channel } from "./realtime";
import { notify } from "./notify";
import { audit } from "./audit";
import { AccessError, assertClassAccess } from "./tenancy";
import { forSchool } from "./tenant-context";
import { assertAppAdmin } from "./app-admin";
import { consume } from "./rate-limit";
import type { ActiveContext } from "./session";
import { assertAlumnusMay } from "./alumni";
import { authorTagsAt, batchYearOf, type AuthorTag } from "./alumni-tags";
import { isCollegeRole, isModuleRole, type PostCategory, type PostScope, type PostStatus, type ReactionKind, type Role } from "./constants";

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
  category: PostCategory;
  /** The typeface the post is set in, by the web's key (src/lib/fonts.ts). */
  font: string;
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
  /** The year an ALUMNUS author left: the feed's "Alumni · 2026" tag; null for everyone else. */
  authorBatch: number | null;
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

/**
 * The English hashtag form of each category — the tag a GLOBAL post carries in
 * its body. Deliberately NOT translated: a hashtag is an identifier shared by
 * every school on the server, and one school reading Marathi must land on the
 * same tag as one reading English, or the tag stops collecting anything.
 */
export const CATEGORY_HASHTAGS: Record<PostCategory, string> = {
  PEOPLE: "#PeopleAndSpotlights",
  CAMPUS: "#CampusLifeAndExperience",
  EVENTS: "#EventsAndCommunity",
  LEARNING: "#LearningAndAcademics",
  UPDATES: "#UpdatesAndEngagement",
  COUNCIL: "#StudentCouncil",
};


/**
 * A COLLEGE'S STAFF ON THE FEED (4 October 2026): faculty, the HOD, the exam
 * controller, IQAC, placement and accounts read, post, react and comment on
 * their own college's feed exactly as a teacher does on a school's — the
 * catalog opens those doors to them (api-catalog/shared.ts FEED_ROLES) and
 * every function the doors reach reads them as TEACHER here, so nothing below
 * needs a seventh branch. Reviewing a pupil's post or comment stays the
 * TEACHER's and the ADMIN's: those functions do not call this.
 */
function asFeedReader(session: ActiveContext): ActiveContext {
  return isCollegeRole(session.role) ? { ...session, role: "TEACHER" } : session;
}

/** "ZZ Northgate School" → "#ZZNorthgateSchool". Empty when nothing survives. */
export function schoolHashtag(name: string): string {
  const compact = name
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
    .replace(/[^\p{L}\p{N}]/gu, "");
  return compact ? `#${compact}` : "";
}

/**
 * The one post shape every school may read AND join: on the global feed,
 * approved by its own school. This is the application-side mirror of the RLS
 * global clauses — `getPost`, `toggleReaction` and `addComment` accept it as
 * an alternative to school visibility, so a reader from any school can open a
 * global post, react to it and comment on it. The database enforces the same
 * boundary independently (see scripts/gen-rls.ts), so neither layer is alone.
 */
const GLOBAL_POST_READABLE: Prisma.PostWhereInput = { scope: "GLOBAL", status: "APPROVED" };

/**
 * A text search that matches how people actually look for a post: words from
 * the title or body, or a #tag with or without its hash. Case-insensitive on
 * text; the tag match is a substring of the serialised JSON array, the same
 * trade `listFeed`'s tag filter already documents.
 */
export function searchWhere(q: string): Prisma.PostWhereInput {
  const term = q.trim().replace(/^#/, "");
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: "insensitive" } },
      { body: { contains: term, mode: "insensitive" } },
      { tags: { contains: term, mode: "insensitive" } },
    ],
  };
}

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
      /**
       * GLOBAL is included here ON PURPOSE, and the schoolId pin above is what
       * makes it safe: this shows a school ITS OWN posts that went global,
       * never another school's. Without it, promoting a post to the global
       * feed silently removed it from the school's own feed — taking the
       * reactions, comments and threads with it, since those live on the
       * school surfaces. Sharing with every school must not mean losing the
       * conversation at home.
       */
      {
        OR: [
          { scope: "SCHOOL" },
          { scope: "GLOBAL" },
          { scope: "CLASS", classId: { in: classIds } },
        ],
      },
      ...audienceWhere(role, grades),
    ],
  };

  // An author sees their own post in any state BUT one: taken down by the
  // platform (platformTakedown below) it is gone for everyone, the author
  // included, who was told why in a notification. The admin's whole-school
  // view below says the same.
  const mine: Prisma.PostWhereInput = { schoolId, authorUserId: user.id, status: { not: "TAKEN_DOWN" } };

  if (role === "ADMIN") {
    // Admins can see everything in their own school, including the queue.
    return { schoolId, status: { not: "TAKEN_DOWN" } };
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
function audienceWhere(role: Role | null, gradesAndTargets: string[]): Prisma.PostWhereInput[] {
  if (role === "ADMIN") return [];
  // A module role (an alumnus reading the school's feed, 3 Oct 2026) reads what is for everyone, and nothing aimed at a group.
  if (isModuleRole(role)) return [{ audience: "ALL" }, { audienceGrade: null }, { audienceTarget: null }];
  if (role === "TEACHER" || role === "PRINCIPAL") {
    // A circular to families is the class teacher's to chase, so a staff
    // member reads every post that asks for an acknowledgement, whoever it
    // was addressed to; a plain post for parents stays out of their feed.
    return [{ OR: [{ audience: { in: ["ALL", "TEACHERS"] } }, { requiresAck: true }] }];
  }
  const audiences = role === "PARENT" ? ["ALL", "PARENTS"] : ["ALL", "STUDENTS"];
  // A college notice's programme, department, division or batch (college-audience.ts): the reader's tokens ride with their grades.
  const grades = gradesAndTargets.filter((g) => !isTargetToken(g));
  const targets = gradesAndTargets.filter(isTargetToken);
  return [
    { audience: { in: audiences } },
    { OR: [{ audienceGrade: null }, { audienceGrade: { in: grades } }] },
    { OR: [{ audienceTarget: null }, { audienceTarget: { in: targets } }] },
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
    return [...new Set(rows.map((r) => r.class.gradeLevel).filter((g): g is string => g !== null)), ...(await audienceTokensFor(session))];
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
    return [...new Set(rows.map((r) => r.class.gradeLevel).filter((g): g is string => g !== null)), ...(await audienceTokensFor(session))];
  }
  return [];
}

/**
 * The schools a guardian's children attend, oldest link first — the same
 * ordering rule as listContexts' children, so "the default school" is always
 * the same school everywhere.
 */
async function guardianSchoolIds(userId: string): Promise<string[]> {
  const links = await db.guardianship.findMany({
    where: { parentUserId: userId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { studentSchoolId: true },
  });
  return [...new Set(links.map((link) => link.studentSchoolId))];
}

/**
 * A guardian's session deliberately carries NO school — parents are
 * cross-school by design (see setActiveContext). But a bulletin belongs to a
 * school, so every read in this module resolves one first: the school of the
 * post being opened when a postId is known, an explicitly chosen school when
 * the feed offers a picker, or the family's first school otherwise. A school
 * the caller has no child in never resolves — the session stays school-less
 * and every query downstream answers "not found", which is the truth.
 *
 * Non-parent sessions, and parent sessions that somehow carry a school, pass
 * through untouched.
 */
async function scoped(
  session: ActiveContext,
  opts: { schoolId?: string | null; postId?: string } = {},
): Promise<ActiveContext> {
  if (session.schoolId || session.role !== "PARENT") return session;
  const schools = await guardianSchoolIds(session.user.id);
  if (schools.length === 0) return session;

  if (opts.postId) {
    const post = await db.post.findUnique({
      where: { id: opts.postId },
      select: { schoolId: true },
    });
    if (post?.schoolId && schools.includes(post.schoolId)) {
      return { ...session, schoolId: post.schoolId };
    }
    return session;
  }

  if (opts.schoolId && schools.includes(opts.schoolId)) {
    return { ...session, schoolId: opts.schoolId };
  }
  return { ...session, schoolId: schools[0]! };
}

/**
 * The schools whose bulletins this guardian may read, with names, for the
 * feed's school picker. Empty for everyone who is not a school-less parent.
 */
export async function parentBulletinSchools(
  session: ActiveContext,
): Promise<{ id: string; name: string }[]> {
  if (session.schoolId || session.role !== "PARENT") return [];
  const ids = await guardianSchoolIds(session.user.id);
  if (ids.length === 0) return [];
  const schools = await db.school.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  // Keep the guardianship ordering, not the database's.
  const byId = new Map(schools.map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter((s): s is { id: string; name: string } => Boolean(s));
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
  /**
   * A GUARDIAN READS THEIR CHILDREN'S CLASSES' POSTS (A3-journeys-1, 5 Oct
   * 2026). This answered [] for a parent, so a class circular — and a class
   * permission slip, whose notification opens it — never reached the family
   * it asked: the feed, the post page and the phone all said "not here". The
   * classes of every child this guardian holds an ACTIVE link to, enrolled
   * ACTIVE at this school (the session is already scoped to it), as
   * gradesFor reads their grades.
   */
  if (role === "PARENT") {
    const rows = await db.enrollment.findMany({
      where: {
        status: "ACTIVE",
        class: { schoolId },
        student: { status: "ACTIVE", leftAt: null, guardianships: { some: { parentUserId: session.user.id, status: "ACTIVE" } } },
      },
      select: { classId: true },
    });
    return [...new Set(rows.map((r) => r.classId))];
  }
  return [];
}

export async function listFeed(
  session: ActiveContext,
  opts: {
    tag?: string;
    status?: PostStatus;
    mineOnly?: boolean;
    schoolId?: string | null;
    category?: PostCategory;
    q?: string;
  } = {},
): Promise<FeedPost[]> {
  session = asFeedReader(session);
  session = await scoped(session, { schoolId: opts.schoolId });
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
      ...(opts.category ? [{ category: opts.category }] : []),
      ...(opts.q ? [searchWhere(opts.q)] : []),
    ],
  };

  const posts = await db.post.findMany({
    where,
    include: {
      author: { select: { name: true, preferredName: true, avatarKey: true } },
      authorship: { select: { id: true, role: true, joinedAt: true } },
      authorCommittee: { select: { name: true } },
      class: { select: { name: true } },
      reactions: { select: { kind: true, userId: true } },
      acks: { where: { userId: session.user.id }, select: { id: true } },
      // What a reader will find on opening the post: held and removed comments are not counted, as on the cross-school feed.
      _count: { select: { comments: { where: { status: "APPROVED" } }, acks: true } },
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
      category: post.category as PostCategory,
      font: post.font,
      title: post.title,
      body: post.body,
      tags: readJsonArray<string>(post.tags),
      media: readJsonArray<MediaItem>(post.media),
      status: post.status as PostStatus,
      rejectionReason: post.rejectionReason,
      pinned: post.pinnedAt !== null,
      createdAt: post.createdAt,
      // A council notice is signed by the council (council-notices.ts); the review desk still sees who wrote it.
      authorName: post.authorCommittee ? (canModerate ? `${post.authorCommittee.name} · ${post.author.preferredName ?? post.author.name}` : post.authorCommittee.name) : (post.author.preferredName ?? post.author.name),
      authorAvatar: post.authorCommittee ? null : post.author.avatarKey,
      authorRole: post.authorCommittee ? null : ((post.authorship?.role as Role | undefined) ?? null),
      // The "Alumni · 2026" tag: the year a former pupil left (alumni-tags.ts).
      authorBatch: !post.authorCommittee && post.authorship?.role === "ALUMNUS" ? batchYearOf(post.authorship.joinedAt) : null,
      authorMembershipId: post.authorCommittee ? null : (post.authorship?.id ?? null),
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
  session = asFeedReader(session);
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

/**
 * Whether this reader may open the post — the feed's own visibility, nothing
 * else: a school-less guardian scoped to the post's school, their children's
 * classes and grades. The permission slip asks it before it answers a
 * question (A3-S-9, 5 Oct 2026), so a family with a child elsewhere in the
 * school no longer reads another class's slip by its id.
 */
export async function canReadPost(session: ActiveContext, postId: string): Promise<boolean> {
  session = asFeedReader(session);
  session = await scoped(session, { postId });
  if (!session.schoolId) return false;
  const [classIds, grades] = await Promise.all([classIdsFor(session), gradesFor(session)]);
  const post = await db.post.findFirst({ where: { AND: [{ id: postId }, visibilityWhere(session, classIds, grades)] }, select: { id: true } });
  return post !== null;
}

export async function getPost(session: ActiveContext, postId: string) {
  session = asFeedReader(session);
  session = await scoped(session, { postId });
  const classIds = await classIdsFor(session);
  const grades = await gradesFor(session);
  const post = await db.post.findFirst({
    where: {
      AND: [
        { id: postId },
        { OR: [visibilityWhere(session, classIds, grades), GLOBAL_POST_READABLE] },
      ],
    },
    include: {
      author: { select: { id: true, name: true, preferredName: true, avatarKey: true } },
      authorship: { select: { role: true, joinedAt: true } },
      authorCommittee: { select: { name: true } },
      class: { select: { name: true } },
      reactions: { select: { kind: true, userId: true } },
      acks: { where: { userId: session.user.id }, select: { id: true } },
      _count: { select: { acks: true } },
      comments: {
        where:
          // The review queue is the PUBLISHING school's: its staff see held
          // comments; staff of any other school reading a global post do not.
          // RLS enforces the same line, so this filter and the policy agree.
          // A REMOVED comment is gone for every reader, its author and the
          // staff who removed it included: "own" and "our school's" used to
          // let it through, so a comment taken down stayed on the page
          // looking like any other. The author was told why when it went.
          (session.role === "ADMIN" || session.role === "TEACHER") && session.schoolId
            ? { status: { not: "REMOVED" }, OR: [{ status: "APPROVED" }, { authorUserId: session.user.id }, { schoolId: session.schoolId }] }
            : // Students and parents never see held comments other than their own.
              { status: { not: "REMOVED" }, OR: [{ status: "APPROVED" }, { authorUserId: session.user.id }] },
        include: { author: { select: { id: true, name: true, preferredName: true, avatarKey: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");

  // A name on this page is a door to a profile, and a profile is keyed on a
  // MEMBERSHIP. Comments carry only a user id, so the authors' live
  // memberships at the post's school are looked up once here — one query,
  // not one per comment — and a commenter with none (a parent, a leaver,
  // a reader from another school on a global post) simply gets no link.
  // Opening a circular is "seen" on its reach report; a plain post records nothing.
  await recordPostRead(session, post);

  const authorIds = [...new Set([post.author.id, ...post.comments.map((c) => c.author.id)])];
  // Profiles open only within the READER's own school: a global post's
  // authors at another school are names, not doors.
  const profileSchoolId = post.schoolId && post.schoolId === session.schoolId ? post.schoolId : null;
  const memberships = profileSchoolId
    ? await db.membership.findMany({
        where: { schoolId: profileSchoolId, userId: { in: authorIds }, status: "ACTIVE", leftAt: null },
        select: { id: true, userId: true },
      })
    : [];
  const membershipByUser = new Map(memberships.map((m) => [m.userId, m.id]));
  // Each commenter's tag at the post's school — Student, Alumni with the year, or a staff role (alumni-tags.ts).
  const tagByUser: Map<string, AuthorTag> = await authorTagsAt(post.schoolId, authorIds);
  const authorBatch = post.authorship?.role === "ALUMNUS" ? batchYearOf(post.authorship.joinedAt) : null;
  // Whether THIS reader may acknowledge: decided on the scoped session, because
  // a guardian's own session carries no school — comparing the raw session's
  // schoolId with the post's, as the page and the phone once did, left the
  // people a circular is for without the button.
  const canAck = post.requiresAck && post.status === "APPROVED" && post.schoolId !== null && session.schoolId === post.schoolId;
  // Which held comments THIS reader may decide — the same rule moderateComment
  // applies, worked out once here so the page and the phone draw the buttons
  // only where pressing one would be accepted.
  const teachesPostClass = post.scope === "CLASS" && post.classId !== null && post.schoolId === session.schoolId && classIds.includes(post.classId);
  const reviewableCommentIds = new Set(
    post.comments
      .filter((c) => c.status === "PENDING" && session.schoolId !== null && c.schoolId === session.schoolId)
      .filter(() => session.role === "ADMIN" || (session.role === "TEACHER" && teachesPostClass))
      .map((c) => c.id),
  );
  /*
   * A COUNCIL NOTICE IS SIGNED BY THE COUNCIL (risks batch 5A, 5 Oct 2026): every reader of this function
   * — the web page and the API's post — prints `author`, so the council's name stands in it, with no
   * picture, no role tag and no profile door to the student who wrote it. The review desk of the school
   * still sees the writer beside the council, as the feed shows them.
   */
  if (post.authorCommittee) {
    const reviewer = (session.role === "ADMIN" || session.role === "TEACHER") && session.schoolId === post.schoolId;
    const writer = post.author.preferredName ?? post.author.name;
    const author = { ...post.author, name: reviewer ? `${post.authorCommittee.name} · ${writer}` : post.authorCommittee.name, preferredName: null, avatarKey: null };
    // No door from the council's name to the writer's profile (their own comments are named, without one).
    const councilLinks = new Map([...membershipByUser].filter(([userId]) => userId !== post.author.id));
    return { ...post, author, authorship: null, membershipByUser: councilLinks, tagByUser, authorBatch: null, canAck, reviewableCommentIds };
  }
  return { ...post, membershipByUser, tagByUser, authorBatch, canAck, reviewableCommentIds };
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
    category?: PostCategory;
    font?: string;
    audience?: PostAudience;
    audienceGrade?: string;
    /** A college's notice for one programme, department, division or batch (college-audience.ts). */
    audienceTarget?: AudienceTarget | null;
    requiresAck?: boolean;
    /** A permission slip (5 Oct 2026, permission-slips.ts): the family's yes-or-no per child, until `consentBy`. */
    consentQuestion?: string;
    consentBy?: string;
    /**
     * A STUDENT COUNCIL NOTICE (risks batch 5A, 5 Oct 2026): the council it is
     * published as. Passed only by council-notices.ts, after it has checked the
     * writer is on the council or in the office; category COUNCIL without it is refused.
     */
    authorCommitteeId?: string | null;
  },
): Promise<{ postId: string; status: PostStatus }> {
  // Only the council's own door writes a council notice: anyone else picking the category would sign as the council.
  if ((input.category === "COUNCIL") !== Boolean(input.authorCommitteeId)) throw new AccessError("councilNotices.refuseCategory");
  session = asFeedReader(session);
  // A module role writes nothing here (3 Oct 2026) — but an ALUMNUS posts
  // when the school lets its alumni (alumni.ts): school-wide, held for the office.
  if (session.role === "ALUMNUS") {
    if (!session.schoolId || input.scope !== "SCHOOL") throw new AccessError("access.wrongRoleForThisAction");
    await assertAlumnusMay(session, session.schoolId, "post");
  } else if (isModuleRole(session.role)) throw new AccessError("access.wrongRoleForThisAction");
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
  // A permission slip is the school asking every family in the audience, so it is staff's, never a staff-only notice,
  // and always a circular — the reach report and the reminders come with it (5 Oct 2026).
  const consentQuestion = isStaff && audience !== "TEACHERS" && input.consentQuestion?.trim() ? input.consentQuestion.trim().slice(0, 300) : null;
  const consentBy = consentQuestion && input.consentBy && /^\d{4}-\d{2}-\d{2}$/.test(input.consentBy) ? input.consentBy : null;
  const requiresAck = isStaff && (input.requiresAck === true || consentQuestion !== null);
  // A college's target narrows a school-wide notice; checked to be this college's programme, department, division or batch.
  const audienceTarget = isStaff && input.scope === "SCHOOL" && audience !== "TEACHERS" && input.audienceTarget ? await targetToken(schoolId, input.audienceTarget) : null;

  // GLOBAL (cross-school) posting is not built. Refuse rather than silently
  // downgrading it to a school post, which would put a child's work somewhere
  // they did not choose.
  if (input.scope === "GLOBAL") {
    throw new AccessError("access.postingToTheGlobalFeedIsNot");
  }

  /**
   * A CEILING ON ENTHUSIASM. The three-school simulation fired fifteen posts
   * from one pupil in a few seconds and every one entered the review queue —
   * one bored child could bury a school's moderation desk. Pupils get five
   * an hour; staff get thirty, because a circular-writing morning is real
   * and a staff account spamming is a compromised account, which thirty an
   * hour still caps. The window rides the same RateLimit table sign-in uses.
   */
  const postLimit = role === "STUDENT" || role === "ALUMNUS" ? 5 : 30;
  const limiter = await consume(`post:${membershipId ?? user.id}`, postLimit, 60 * 60 * 1000);
  if (!limiter.allowed) {
    throw new AccessError("access.youArePostingALot", "FORBIDDEN", {
      minutes: Math.max(1, Math.ceil(limiter.retryAfterSeconds / 60)),
    });
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

  // The single safety decision. A former pupil's post waits for the office too.
  const status: PostStatus = role === "STUDENT" || role === "ALUMNUS" ? "PENDING" : "APPROVED";

  const post = await db.post.create({
    data: {
      schoolId,
      classId: input.scope === "CLASS" ? input.classId! : null,
      authorUserId: user.id,
      authorMembershipId: membershipId,
      scope: input.scope,
      category: input.category ?? "UPDATES",
      authorCommitteeId: input.authorCommitteeId ?? null,
      font: input.font ?? "default",
      title: input.title,
      body: input.body,
      tags: writeJson(input.tags),
      media: writeJson(input.media),
      audience,
      audienceGrade,
      audienceTarget,
      requiresAck,
      consentQuestion,
      consentBy,
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
    // A circular tells its audience the moment it is live (circulars.ts):
    // a small audience in this request, a large one by the job within the minute.
    if (requiresAck) await queueCircularDelivery(post.id);
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
          // A post's reviewers are people still here — a left teacher or admin
          // is not notified to moderate.
          where: { schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null, classTeachers: { some: { classId } } },
          select: { userId: true },
        })
      : await db.membership.findMany({
          where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null },
          select: { userId: true },
        });

  await Promise.all(
    reviewers.map((reviewer) =>
      notify({
        userId: reviewer.userId,
        schoolId,
        kind: "POST",
        titleKey: "bulletin.notifNeedsReview",
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
    titleKey: decision === "APPROVE" ? "bulletin.notifPostLive" : "bulletin.notifPostChange",
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

/**
 * The review queue, grouped by author — the shape a FLOOD has.
 *
 * Fifteen posts waiting are almost never fifteen children; they are one
 * child fifteen times, and clearing them one click each is what made the
 * simulation's spam incident thirty clicks of admin time. Admin only: a
 * teacher's queue is one class and stays per-post.
 */
export async function pendingByAuthor(
  session: ActiveContext,
): Promise<{ authorUserId: string; name: string; count: number }[]> {
  const { schoolId, role } = session;
  if (role !== "ADMIN" || !schoolId) return [];
  const groups = await db.post.groupBy({
    by: ["authorUserId"],
    where: { schoolId, status: "PENDING" },
    _count: { _all: true },
  });
  const authors = await db.user.findMany({
    where: { id: { in: groups.map((g) => g.authorUserId) } },
    select: { id: true, name: true, preferredName: true },
  });
  const nameOf = new Map(authors.map((a) => [a.id, a.preferredName ?? a.name]));
  return groups
    .map((g) => ({ authorUserId: g.authorUserId, name: nameOf.get(g.authorUserId) ?? "?", count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}

/**
 * One decision over everything an author has waiting. Runs the ordinary
 * `moderatePost` per post — same status writes, same notification to the
 * author per post, same audit line — so a bulk decision is exactly many
 * single ones, not a second reviewing code path that could drift.
 */
export async function moderateAuthorPending(
  session: ActiveContext,
  authorUserId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string,
): Promise<{ decided: number }> {
  const { schoolId, role } = session;
  if (role !== "ADMIN" || !schoolId) throw new AccessError("access.youCannotReviewPosts");
  const pending = await db.post.findMany({
    where: { schoolId, status: "PENDING", authorUserId },
    select: { id: true },
  });
  let decided = 0;
  for (const post of pending) {
    await moderatePost(session, post.id, decision, reason);
    decided++;
  }
  return { decided };
}

/* -------------------------------------------------------------------------- */
/* Held comments                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The comments waiting on this reviewer, as a WHERE.
 *
 * A comment is held in two cases (addComment owns the rule): a pupil's, on a
 * post inside their school; and anybody's, on a GLOBAL post. Either way the
 * row carries the school whose staff review it in `schoolId` — the post's
 * school for the first, the AUTHOR'S OWN school for the second — so the queue
 * is one predicate on the comment, and a school never reviews another
 * school's people.
 *
 * Who may decide mirrors `moderatePost`: an admin decides anything held at
 * their school; a teacher decides comments on the CLASS posts of classes
 * they teach, and nothing school-wide or global.
 */
async function heldCommentsWhere(session: ActiveContext): Promise<Prisma.CommentWhereInput | null> {
  const { schoolId, membershipId, role } = session;
  if (!schoolId || !membershipId) return null;
  if (role === "ADMIN") return { schoolId, status: "PENDING" };
  if (role === "TEACHER") {
    const classIds = await classIdsFor(session);
    if (classIds.length === 0) return null;
    return { schoolId, status: "PENDING", post: { schoolId, scope: "CLASS", classId: { in: classIds } } };
  }
  return null;
}

/** How many comments are waiting on this person specifically. */
export async function heldCommentCount(session: ActiveContext): Promise<number> {
  const where = await heldCommentsWhere(session);
  return where ? db.comment.count({ where }) : 0;
}

export type HeldComment = {
  id: string;
  postId: string;
  postTitle: string;
  /** On the cross-school feed: held here because its author is one of ours. */
  shared: boolean;
  className: string | null;
  reply: boolean;
  body: string;
  createdAt: Date;
  authorName: string;
};

/** The comments waiting on this person, oldest first — the one who has waited longest is read first. At most a hundred. */
export async function heldComments(session: ActiveContext): Promise<HeldComment[]> {
  const where = await heldCommentsWhere(session);
  if (!where) return [];
  const rows = await db.comment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      postId: true,
      body: true,
      createdAt: true,
      parentCommentId: true,
      author: { select: { name: true, preferredName: true } },
      post: { select: { title: true, scope: true, class: { select: { name: true } } } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    postId: row.postId,
    postTitle: row.post.title,
    shared: row.post.scope === "GLOBAL",
    className: row.post.class?.name ?? null,
    reply: row.parentCommentId !== null,
    body: row.body,
    createdAt: row.createdAt,
    authorName: row.author.preferredName ?? row.author.name,
  }));
}

/**
 * Approve or remove a held comment.
 *
 * THE MISSING HALF. Holding was built (a pupil's comment, and since the
 * security assessment every comment on the cross-school feed) and releasing
 * was not: a held comment stayed held until somebody removed it, so the hold
 * was in practice a deletion with a delay.
 *
 * APPROVING DOES WHAT POSTING WOULD HAVE DONE. `addComment` tells the person
 * replied to, or the post's author, only when the comment goes live at once;
 * for a held one that moment is now, so the same two notifications are sent
 * here, under the same safeguard: nothing about a stranger's reply reaches a
 * child across schools. They are best-effort for the reason given there — a
 * notification lives in its recipient's tenant, which a reviewer from another
 * school cannot write into. The author is told their comment is live.
 *
 * REMOVING NEEDS A REASON, and the author is told it, as `removeContent`
 * does. The reason stays out of the audit row: free text about a child does
 * not belong in a log kept for two years (decision 0002).
 *
 * AN ADMIN MAY DECIDE THEIR OWN COMMENT on the cross-school feed. It is held
 * like anybody's, and they are the school's reviewer; an admin may already
 * publish a whole post to that feed unreviewed, and a school with one admin
 * would otherwise never be heard there.
 *
 * The status write is conditional on PENDING, so two reviewers pressing at
 * once decide it once: the second is told it has already been reviewed.
 */
export async function moderateComment(
  session: ActiveContext,
  commentId: string,
  decision: "APPROVE" | "REMOVE",
  reason?: string,
): Promise<void> {
  const { schoolId, membershipId, role, user } = session;
  if (!schoolId || !membershipId || (role !== "TEACHER" && role !== "ADMIN")) {
    throw new AccessError("access.youCannotReviewComments");
  }

  const comment = await db.comment.findFirst({
    where: { id: commentId, schoolId },
    select: {
      id: true,
      status: true,
      authorUserId: true,
      postId: true,
      parentCommentId: true,
      post: { select: { title: true, scope: true, classId: true, schoolId: true, authorUserId: true } },
      parent: { select: { authorUserId: true, schoolId: true, author: { select: { isMinor: true } } } },
    },
  });
  if (!comment) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");

  if (role === "TEACHER") {
    if (comment.post.scope !== "CLASS" || !comment.post.classId || comment.post.schoolId !== schoolId) {
      throw new AccessError("access.onlyAnAdminCanReviewThisComment");
    }
    const teaches = await db.classTeacher.findFirst({
      where: { classId: comment.post.classId, teacherMembershipId: membershipId },
      select: { id: true },
    });
    if (!teaches) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");
  }

  if (comment.status !== "PENDING") throw new AccessError("access.thatCommentHasAlreadyBeenReviewed");
  const note = reason?.trim() ?? "";
  if (decision === "REMOVE" && !note) throw new AccessError("access.writeANoteSoTheAuthorKnows");

  const decided = await db.comment.updateMany({
    where: { id: comment.id, schoolId, status: "PENDING" },
    data: { status: decision === "APPROVE" ? "APPROVED" : "REMOVED" },
  });
  if (decided.count === 0) throw new AccessError("access.thatCommentHasAlreadyBeenReviewed");

  const url = `/bulletin/${comment.postId}`;
  const tell = (input: Parameters<typeof notify>[0]) => notify(input).catch(() => undefined);

  if (decision === "REMOVE") {
    if (comment.authorUserId !== user.id) {
      await tell({ userId: comment.authorUserId, schoolId, kind: "POST", titleKey: "notifTitle.commentRemoved", body: note, url });
    }
  } else {
    const told = new Set<string>([user.id]);
    if (!told.has(comment.authorUserId)) {
      told.add(comment.authorUserId);
      await tell({ userId: comment.authorUserId, schoolId, kind: "POST", titleKey: "bulletin.notifCommentLive", body: comment.post.title, url });
    }
    const crossSchoolToMinor = Boolean(comment.parent?.author.isMinor) && comment.parent?.schoolId !== schoolId;
    if (comment.parent && !told.has(comment.parent.authorUserId) && !crossSchoolToMinor) {
      told.add(comment.parent.authorUserId);
      await tell({ userId: comment.parent.authorUserId, schoolId: comment.post.schoolId, kind: "POST", titleKey: "bulletin.notifNewReply", body: comment.post.title, url });
    }
    if (!comment.parentCommentId && !told.has(comment.post.authorUserId)) {
      await tell({ userId: comment.post.authorUserId, schoolId: comment.post.schoolId, kind: "POST", titleKey: "bulletin.notifNewComment", body: comment.post.title, url });
    }
  }

  await audit({
    schoolId,
    actorUserId: user.id,
    action: decision === "APPROVE" ? "comment.approve" : "comment.remove",
    targetType: "Comment",
    targetId: comment.id,
    meta: { postId: comment.postId, shared: comment.post.scope === "GLOBAL" },
  });
}

/** Pin / unpin. Admin-only: pinning is a whole-school editorial decision. */
export async function togglePin(session: ActiveContext, postId: string): Promise<boolean> {
  return setPinned(session, postId, null);
}

/**
 * Pin or unpin as asked (`pinned`), or flip (`null`, the web's button). The
 * phone's door says which it wants (R-50), so a call replayed from its outbox
 * is a no-op rather than a second flip: the state already asked for writes
 * nothing and no audit row.
 */
export async function setPinned(session: ActiveContext, postId: string, want: boolean | null): Promise<boolean> {
  const { schoolId, role, user } = session;
  if (role !== "ADMIN" || !schoolId) throw new AccessError("access.onlyAnAdminCanPinAPost");

  const post = await db.post.findFirst({
    where: { id: postId, schoolId, status: "APPROVED" },
    select: { pinnedAt: true },
  });
  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");

  const pinned = want ?? post.pinnedAt === null;
  if (pinned === (post.pinnedAt !== null)) return pinned;
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
  session = asFeedReader(session);
  // A module role reacts to nothing — but an ALUMNUS may, on their old school's own posts while the school lets its
  // alumni comment (alumni.ts), and on the global feed's posts as any reader of it may (4 Oct 2026); checked below.
  if (isModuleRole(session.role) && session.role !== "ALUMNUS") throw new AccessError("access.wrongRoleForThisAction");
  session = await scoped(session, { postId });
  const classIds = await classIdsFor(session);
  const grades = await gradesFor(session);
  const visible = await db.post.findFirst({
    where: {
      AND: [
        { id: postId, status: "APPROVED" },
        { OR: [visibilityWhere(session, classIds, grades), GLOBAL_POST_READABLE] },
      ],
    },
    select: { id: true, schoolId: true, scope: true },
  });
  if (!visible || (session.role === "ALUMNUS" && visible.schoolId !== session.schoolId && visible.scope !== "GLOBAL")) throw new AccessError("access.postNotFound", "NOT_FOUND");
  // On a global post the old school's feed setting does not apply; the module and the office's mute still do.
  if (session.role === "ALUMNUS") await assertAlumnusMay(session, session.schoolId ?? "", visible.scope === "GLOBAL" ? "reach" : "react");

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
  parentCommentId?: string,
): Promise<{ status: "APPROVED" | "PENDING" }> {
  session = asFeedReader(session);
  // A module role comments on nothing — but an ALUMNUS may, on their old school's own posts while the school lets its
  // alumni comment (alumni.ts), and on the global feed's posts as any reader of it may (4 Oct 2026), held there as
  // every global comment is; checked below.
  if (isModuleRole(session.role) && session.role !== "ALUMNUS") throw new AccessError("access.wrongRoleForThisAction");
  session = await scoped(session, { postId });
  const classIds = await classIdsFor(session);
  const grades = await gradesFor(session);
  const visible = await db.post.findFirst({
    where: {
      AND: [
        { id: postId, status: "APPROVED" },
        { OR: [visibilityWhere(session, classIds, grades), GLOBAL_POST_READABLE] },
      ],
    },
    select: { id: true, authorUserId: true, schoolId: true, title: true, scope: true, classId: true },
  });
  if (!visible || (session.role === "ALUMNUS" && visible.schoolId !== session.schoolId && visible.scope !== "GLOBAL")) throw new AccessError("access.postNotFound", "NOT_FOUND");
  // On a global post the old school's feed setting does not apply; the module and the office's mute still do.
  if (session.role === "ALUMNUS") await assertAlumnusMay(session, session.schoolId ?? "", visible.scope === "GLOBAL" ? "reach" : "comment");

  /**
   * The same ceiling createPost puts on posts, a little higher because a
   * comment is smaller: sixty an hour per person. One person answering a
   * whole class's questions is real; sixty-one in an hour is a loop.
   */
  const commentLimiter = await consume(`comment:${session.user.id}`, COMMENTS_PER_HOUR, 60 * 60 * 1000);
  if (!commentLimiter.allowed) {
    throw new AccessError("access.youArePostingALot", "FORBIDDEN", {
      minutes: Math.max(1, Math.ceil(commentLimiter.retryAfterSeconds / 60)),
    });
  }

  /**
   * A reply attaches to a comment ON THIS POST, and threads stay ONE LEVEL
   * DEEP: replying to a reply re-points at the thread's top comment, the way
   * every feed people know does it, so a discussion is a list of comments
   * each with its answers rather than a tree nobody can moderate at a glance.
   * A removed parent takes its thread with it (the FK cascades), so replying
   * under one is refused rather than resurrecting it.
   */
  let parentId: string | null = null;
  let parentAuthorUserId: string | null = null;
  let parentAuthorIsMinor = false;
  let parentAuthorSchoolId: string | null = null;
  if (parentCommentId) {
    const parent = await db.comment.findFirst({
      where: { id: parentCommentId, postId, status: { not: "REMOVED" } },
      select: { id: true, parentCommentId: true, authorUserId: true, schoolId: true, author: { select: { isMinor: true } } },
    });
    if (!parent) throw new AccessError("access.postNotFound", "NOT_FOUND");
    parentId = parent.parentCommentId ?? parent.id;
    parentAuthorUserId = parent.authorUserId;
    parentAuthorIsMinor = parent.author.isMinor;
    parentAuthorSchoolId = parent.schoolId;
  }

  /**
   * Same rule as posts inside a school: a child's words are reviewed, an
   * adult's are not. On a GLOBAL post EVERY comment is held — the global
   * feed is the one place a child from any school can be answered by an
   * adult from any other, and the hold used to be off there "so that one
   * school's staff would not review every school's children". They do not:
   * a global comment files with the AUTHOR'S OWN school, whose staff review
   * their own people's words exactly as they review a school post's. The
   * one-tap report remains for everything else.
   */
  const isGlobal = visible.scope === "GLOBAL";
  // A minor alumnus is still a minor (decision 0002): their words are held as a pupil's are.
  const status = session.role === "STUDENT" || (session.role === "ALUMNUS" && session.user.isMinor) || isGlobal ? "PENDING" : "APPROVED";

  /**
   * Which school reviews it. A school post's comment belongs to the post's
   * school as ever; a global post's comment belongs to the commenter's own
   * school — the session's, or for a school-less guardian the first school a
   * child of theirs attends — and only when the commenter has no school at
   * all does it fall to the post's, which is the tenant the RLS global insert
   * clause already lets them write into.
   */
  let reviewSchoolId = schoolOf(visible);
  if (isGlobal) {
    if (session.schoolId) reviewSchoolId = session.schoolId;
    else if (session.role === "PARENT") reviewSchoolId = (await guardianSchoolIds(session.user.id))[0] ?? reviewSchoolId;
  }

  await db.comment.create({
    data: {
      postId,
      authorUserId: session.user.id,
      body: body.trim(),
      status,
      schoolId: reviewSchoolId,
      parentCommentId: parentId,
    },
  });

  /**
   * SAFEGUARDING, stated once: no notification about a stranger's reply ever
   * reaches a child across schools. A minor is told of a reply only by
   * somebody of their own school; the reply itself still waits in the
   * queue above, so on a global post this guard is belt and braces.
   */
  const crossSchoolToMinor = parentAuthorIsMinor && parentAuthorSchoolId !== (session.schoolId ?? reviewSchoolId);

  if (status === "PENDING") {
    await tellOfHeldComment(session, reviewSchoolId, { id: postId, title: visible.title, scope: visible.scope as PostScope, classId: visible.classId, authorUserId: visible.authorUserId, schoolId: visible.schoolId });
  }

  if (status === "APPROVED") {
    /**
     * Who gets told: a reply tells the person being replied to, a comment
     * tells the post's author — and someone who is both hears it once,
     * as the more specific of the two.
     *
     * BEST-EFFORT ACROSS SCHOOLS: a notification row lives in the recipient's
     * tenant, and a commenter from another school on a GLOBAL post cannot
     * write there — the Notification policy is strictly tenant-scoped, and
     * this module does not widen it for a nicety. The comment itself is the
     * record; if telling the author fails, the comment must still stand.
     */
    const tell = (input: Parameters<typeof notify>[0]) =>
      notify(input).catch(() => undefined);
    const told = new Set<string>([session.user.id]);
    if (parentAuthorUserId && !told.has(parentAuthorUserId) && !crossSchoolToMinor) {
      told.add(parentAuthorUserId);
      await tell({
        userId: parentAuthorUserId,
        schoolId: visible.schoolId,
        kind: "POST",
        titleKey: "bulletin.notifNewReply",
        body: visible.title,
        url: `/bulletin/${postId}`,
      });
    }
    if (!parentId && !told.has(visible.authorUserId)) {
      await tell({
        userId: visible.authorUserId,
        schoolId: visible.schoolId,
        kind: "POST",
        titleKey: "bulletin.notifNewComment",
        body: visible.title,
        url: `/bulletin/${postId}`,
      });
    }
  }

  return { status };
}

/**
 * A held comment is told to somebody who can release it, and to the person
 * who wrote it.
 *
 * WHO IS TOLD, in order, the first that applies: the post's author, when
 * they are staff of the reviewing school who may decide it (an admin, or
 * the teacher of a class post's class — moderateComment's rule); else the
 * teachers of the class, for a class post; else the office. One event,
 * "comment.held", to that set, with the review page as its link. The
 * commenter is told once per post that their words wait for a teacher —
 * a second comment on the same post, still waiting, says nothing new.
 *
 * BEST-EFFORT, like every notification in this file: a global post's
 * comment reviewed by the commenter's own school writes rows inside that
 * tenant, and a row that cannot be written must not refuse the comment.
 */
async function tellOfHeldComment(
  session: ActiveContext,
  reviewSchoolId: string,
  post: { id: string; title: string; scope: PostScope; classId: string | null; authorUserId: string; schoolId: string | null },
): Promise<void> {
  const tell = (input: Parameters<typeof notify>[0]) => notify(input).catch(() => undefined);
  const commenterName = session.user.preferredName ?? session.user.name;
  const classId = post.scope === "CLASS" && post.schoolId === reviewSchoolId ? post.classId : null;

  let reviewers: string[] = [];
  const author = await db.membership.findFirst({
    where: {
      userId: post.authorUserId,
      schoolId: reviewSchoolId,
      status: "ACTIVE",
      leftAt: null,
      OR: [{ role: "ADMIN" }, ...(classId ? [{ role: "TEACHER" as const, classTeachers: { some: { classId } } }] : [])],
    },
    select: { userId: true },
  });
  if (author) reviewers = [author.userId];
  else if (classId) {
    const teachers = await db.membership.findMany({
      where: { schoolId: reviewSchoolId, role: "TEACHER", status: "ACTIVE", leftAt: null, classTeachers: { some: { classId } } },
      select: { userId: true },
    });
    reviewers = teachers.map((m) => m.userId);
  }
  if (reviewers.length === 0) {
    const office = await db.membership.findMany({ where: { schoolId: reviewSchoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true } });
    reviewers = office.map((m) => m.userId);
  }

  await Promise.all(
    [...new Set(reviewers)]
      .filter((userId) => userId !== session.user.id)
      .map((userId) =>
        tell({
          userId,
          schoolId: reviewSchoolId,
          kind: "POST",
          titleKey: "notifTitle.commentHeld",
          bodyKey: "notifBody.commentHeld",
          bodyVars: { name: commenterName, title: post.title },
          url: "/bulletin?filter=pending",
          meta: { event: "comment.held", postId: post.id },
        }),
      ),
  );

  const already = await db.notification.findFirst({
    where: { userId: session.user.id, titleKey: "notifTitle.commentWaiting", url: `/bulletin/${post.id}` },
    select: { id: true },
  });
  if (!already) {
    await tell({
      userId: session.user.id,
      schoolId: reviewSchoolId,
      kind: "POST",
      titleKey: "notifTitle.commentWaiting",
      bodyKey: "notifBody.commentWaiting",
      bodyVars: { title: post.title },
      url: `/bulletin/${post.id}`,
      meta: { event: "comment.waiting", postId: post.id },
    });
  }
}

/** Comments per person per hour; see addComment. */
export const COMMENTS_PER_HOUR = 60;
/** Reports per person per hour; see reportContent. */
export const REPORTS_PER_HOUR = 10;
/** One urgent burst to a school's admins per this many milliseconds; later reports in the window queue quietly. */
export const REPORT_URGENT_WINDOW_MS = 10 * 60 * 1000;

/**
 * One-tap report.
 *
 * Never rejects a duplicate: if a child reports the same thing twice because
 * they were not sure it worked, that must not read as a failure — the second
 * tap within a day is answered as the first was and files nothing new, so a
 * held finger cannot turn one worry into a hundred rows and a hundred
 * wake-ups. The target is checked to exist so the queue never carries a
 * report of nothing, ten an hour is the ceiling per person, and a school's
 * admins are woken URGENTLY once per ten minutes: the first report in the
 * window bypasses quiet hours, the rest of the window's arrive quietly.
 */
export async function reportContent(
  session: ActiveContext,
  input: { targetType: "POST" | "COMMENT" | "USER"; targetId: string; reason: string; detail?: string },
): Promise<void> {
  session = asFeedReader(session);
  const limiter = await consume(`report:${session.user.id}`, REPORTS_PER_HOUR, 60 * 60 * 1000);
  if (!limiter.allowed) {
    throw new AccessError("access.youAreReportingALot", "FORBIDDEN", {
      minutes: Math.max(1, Math.ceil(limiter.retryAfterSeconds / 60)),
    });
  }

  // The target must be something: a post or comment this reader can see (a
  // global one included, through the same clauses the feed uses), or a person.
  const exists =
    input.targetType === "POST"
      ? await db.post.findFirst({ where: { id: input.targetId }, select: { id: true } })
      : input.targetType === "COMMENT"
        ? await db.comment.findFirst({ where: { id: input.targetId }, select: { id: true } })
        : await db.user.findUnique({ where: { id: input.targetId }, select: { id: true } });
  if (!exists) throw new AccessError("access.thatContentNoLongerExists", "NOT_FOUND");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await db.report.findFirst({
    where: { reporterUserId: session.user.id, targetType: input.targetType, targetId: input.targetId, createdAt: { gte: since } },
    select: { id: true },
  });
  if (duplicate) return;

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
    const burst = await consume(`report-urgent:${session.schoolId}`, 1, REPORT_URGENT_WINDOW_MS);
    const admins = await db.membership.findMany({
      where: { schoolId: session.schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null },
      select: { userId: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notify({
          userId: admin.userId,
          schoolId: session.schoolId,
          kind: "SYSTEM",
          titleKey: "bulletin.notifReported",
          bodyKey: "notifBody.reportedAs",
          bodyVars: { type: input.targetType.toLowerCase(), reason: input.reason.toLowerCase().replace(/_/g, " ") },
          url: "/bulletin?filter=pending",
          // safeguarding: the window's first report bypasses quiet hours; the
          // rest wait for the morning with everything else.
          urgent: burst.allowed,
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
  session = asFeedReader(session);
  // READ ONLY for a module role (an alumnus reads the school's feed, 3 Oct 2026): no post, comment, reaction or acknowledgement.
  if (isModuleRole(session.role)) throw new AccessError("access.wrongRoleForThisAction");
  session = await scoped(session, { postId });
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
      where: { schoolId, role: { in: ["ADMIN", "TEACHER"] }, status: "ACTIVE", leftAt: null },
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
  session = asFeedReader(session);
  // A guardian READS their children's classes (classIdsFor) but posts to none.
  if (session.role === "PARENT") return [];
  const ids = await classIdsFor(session);
  if (ids.length === 0) return [];
  return db.class.findMany({
    where: { id: { in: ids }, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/* -------------------------------------------------------------------------- */
/* Platform moderation of the global feed                                      */
/* -------------------------------------------------------------------------- */

/**
 * THE ACTOR ABOVE A SCHOOL, for the one surface that crosses schools.
 *
 * global-feed.ts states the design: publishing is the owning school's write,
 * showing is each consuming school's choice, and a take-down for everyone
 * was missing because nobody stood above a school. The content team and the
 * operator now do, for GLOBAL posts only. The mechanism is the status: a
 * taken-down post is TAKEN_DOWN, which the database's global clause (scope
 * GLOBAL and status APPROVED) no longer admits — so every other school, its
 * reactions and its comments lose the row at once, without a policy change —
 * and which every feed and queue in this file filters out at home, the
 * author's own view included. A PlatformTakedown row keeps what the platform
 * needs to list and restore it, because once taken down the post is no longer
 * readable from outside its school.
 *
 * WRITING UNDER THE SCHOOL. The platform's session has no school, and the
 * app role may only write Post rows under a tenant, so the status write runs
 * under forSchool with the id the DATABASE returned on the post — the rule
 * tenant-context.ts states for that function. The school is told (its office
 * and the author, with the reason) and the act is in the school's own audit
 * log with the platform member as actor and `platform: true` in the meta.
 * A school's own hide (GlobalPostHide) is untouched by any of this.
 */
export type ModerationStatus = "live" | "takenDown" | "restored";
export const MODERATION_PAGE = 30;

export type ModerationItem = {
  postId: string;
  title: string;
  excerpt: string;
  category: string;
  schoolName: string;
  authorName: string;
  createdAt: Date;
  commentCount: number;
  status: "APPROVED" | "TAKEN_DOWN" | "RESTORED";
  takedown: { reason: string; at: Date; by: string; restoredAt: Date | null; restoredBy: string | null } | null;
};

export type ModerationList = { status: ModerationStatus; page: number; pages: number; counts: Record<ModerationStatus, number>; items: ModerationItem[] };

/** "Aarav Sharma" → "Aarav", as global-feed.ts shows a pupil (spelt here too, since that module imports this one). */
function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function excerptOf(body: string): string {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 240 ? `${text.slice(0, 239)}…` : text;
}

async function namesOf(userIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

/**
 * Every school's global posts, newest first, with the school named: what is
 * live (readable through the global clause), what the platform has taken
 * down, and what it has since restored. Held comments are not here — a held
 * comment is the review queue of the school that holds it (moderateComment),
 * and the platform does not read a school's queue.
 */
export async function listPlatformModeration(session: ActiveContext, opts: { status?: ModerationStatus; page?: number } = {}): Promise<ModerationList> {
  assertAppAdmin(session);
  const status = opts.status ?? "live";
  const liveWhere: Prisma.PostWhereInput = { scope: "GLOBAL", status: "APPROVED" };
  const [live, takenDown, restored] = await Promise.all([
    db.post.count({ where: liveWhere }),
    db.platformTakedown.count({ where: { restoredAt: null } }),
    db.platformTakedown.count({ where: { restoredAt: { not: null } } }),
  ]);
  const counts = { live, takenDown, restored };
  const pages = Math.max(1, Math.ceil(counts[status] / MODERATION_PAGE));
  const page = Math.min(pages, Math.max(1, Math.trunc(opts.page ?? 1)));
  const skip = (page - 1) * MODERATION_PAGE;

  if (status === "live") {
    const posts = await db.post.findMany({
      where: liveWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: MODERATION_PAGE,
      select: {
        id: true,
        title: true,
        body: true,
        category: true,
        createdAt: true,
        globalSchoolName: true,
        author: { select: { name: true, preferredName: true, isMinor: true } },
        authorship: { select: { role: true } },
        _count: { select: { comments: { where: { status: "APPROVED" } } } },
      },
    });
    return {
      status,
      page,
      pages,
      counts,
      items: posts.map((post) => ({
        postId: post.id,
        title: post.title,
        excerpt: excerptOf(post.body),
        category: post.category,
        schoolName: post.globalSchoolName ?? "",
        // A pupil is a first name on every cross-school surface (global-feed.ts).
        authorName: post.author.isMinor || post.authorship?.role === "STUDENT" ? firstNameOf(post.author.preferredName ?? post.author.name) : (post.author.preferredName ?? post.author.name),
        createdAt: post.createdAt,
        commentCount: post._count.comments,
        status: "APPROVED" as const,
        takedown: null,
      })),
    };
  }

  const rows = await db.platformTakedown.findMany({
    where: status === "takenDown" ? { restoredAt: null } : { restoredAt: { not: null } },
    orderBy: status === "takenDown" ? { takenDownAt: "desc" } : { restoredAt: "desc" },
    skip,
    take: MODERATION_PAGE,
  });
  const names = await namesOf(rows.flatMap((r) => [r.takenDownByUserId, ...(r.restoredByUserId ? [r.restoredByUserId] : [])]));
  return {
    status,
    page,
    pages,
    counts,
    items: rows.map((r) => ({
      postId: r.postId,
      title: r.title,
      excerpt: "",
      category: "",
      schoolName: r.schoolName,
      authorName: "",
      createdAt: r.takenDownAt,
      commentCount: 0,
      status: r.restoredAt ? ("RESTORED" as const) : ("TAKEN_DOWN" as const),
      takedown: { reason: r.reason, at: r.takenDownAt, by: names.get(r.takenDownByUserId) ?? "", restoredAt: r.restoredAt, restoredBy: r.restoredByUserId ? (names.get(r.restoredByUserId) ?? "") : null },
    })),
  };
}

/** One live global post with its approved comments, for the platform's reader. */
export async function readPlatformPost(session: ActiveContext, postId: string) {
  assertAppAdmin(session);
  const post = await db.post.findFirst({
    where: { id: postId, scope: "GLOBAL", status: "APPROVED" },
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      tags: true,
      createdAt: true,
      globalSchoolName: true,
      author: { select: { name: true, preferredName: true, isMinor: true } },
      authorship: { select: { role: true } },
      comments: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, author: { select: { name: true, preferredName: true, isMinor: true } } } },
    },
  });
  if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");
  const shown = (a: { name: string; preferredName: string | null; isMinor: boolean }, pupil: boolean) => (a.isMinor || pupil ? firstNameOf(a.preferredName ?? a.name) : (a.preferredName ?? a.name));
  return {
    postId: post.id,
    title: post.title,
    body: post.body,
    category: post.category,
    tags: readJsonArray<string>(post.tags),
    schoolName: post.globalSchoolName ?? "",
    authorName: shown(post.author, post.authorship?.role === "STUDENT"),
    createdAt: post.createdAt,
    comments: post.comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, authorName: shown(c.author, false) })),
  };
}

/** The office of the publishing school and the author: who is told of a take-down and a restore. */
async function tellSchool(schoolId: string, authorUserId: string, input: { titleKey: "notifTitle.postPlatformTakedown" | "notifTitle.postPlatformRestored"; body: string; url: string }) {
  const admins = await db.membership.findMany({ where: { schoolId, role: "ADMIN", status: "ACTIVE" }, select: { userId: true } });
  const told = new Set<string>([authorUserId, ...admins.map((m) => m.userId)]);
  for (const userId of told) {
    await notify({ userId, schoolId, kind: "POST", titleKey: input.titleKey, body: input.body, url: input.url }).catch(() => undefined);
  }
}

export async function platformTakedown(session: ActiveContext, postId: string, reason: string): Promise<void> {
  assertAppAdmin(session);
  const note = reason.trim();
  if (note.length < 3) throw new AccessError("moderation.reasonRequired");

  const standing = await db.platformTakedown.findUnique({ where: { postId }, select: { restoredAt: true } });
  if (standing && !standing.restoredAt) throw new AccessError("moderation.alreadyTakenDown");

  // Readable through the global clause exactly when it may be taken down.
  const post = await db.post.findFirst({
    where: { id: postId, scope: "GLOBAL", status: "APPROVED" },
    select: { id: true, schoolId: true, title: true, globalSchoolName: true, authorUserId: true },
  });
  if (!post || !post.schoolId) throw new AccessError("access.postNotFound", "NOT_FOUND");
  const schoolId = post.schoolId;

  await forSchool(schoolId, async () => {
    const changed = await db.post.updateMany({ where: { id: post.id, schoolId, status: "APPROVED" }, data: { status: "TAKEN_DOWN" } });
    if (changed.count === 0) throw new AccessError("moderation.alreadyTakenDown");
    await db.platformTakedown.upsert({
      where: { postId: post.id },
      create: { postId: post.id, postSchoolId: schoolId, schoolName: post.globalSchoolName ?? "", title: post.title, reason: note, takenDownByUserId: session.user.id },
      update: { reason: note, takenDownByUserId: session.user.id, takenDownAt: new Date(), restoredAt: null, restoredByUserId: null, title: post.title },
    });
    await audit({
      schoolId,
      actorUserId: session.user.id,
      action: "post.platformTakedown",
      targetType: "Post",
      targetId: post.id,
      meta: { title: post.title, reason: note, platform: true },
    });
    await tellSchool(schoolId, post.authorUserId, { titleKey: "notifTitle.postPlatformTakedown", body: `${post.title} — ${note}`, url: "/bulletin" });
    publish([channel.school(schoolId)], { type: "post.status", postId: post.id, status: "TAKEN_DOWN" });
  });
}

export async function platformRestore(session: ActiveContext, postId: string): Promise<void> {
  assertAppAdmin(session);
  const row = await db.platformTakedown.findUnique({ where: { postId } });
  if (!row) throw new AccessError("access.postNotFound", "NOT_FOUND");
  if (row.restoredAt) throw new AccessError("moderation.alreadyRestored");
  const schoolId = row.postSchoolId;

  await forSchool(schoolId, async () => {
    const post = await db.post.findFirst({ where: { id: postId, schoolId, status: "TAKEN_DOWN" }, select: { id: true, title: true, authorUserId: true } });
    if (!post) throw new AccessError("access.postNotFound", "NOT_FOUND");
    await db.post.update({ where: { id: post.id }, data: { status: "APPROVED" } });
    await db.platformTakedown.update({ where: { postId }, data: { restoredAt: new Date(), restoredByUserId: session.user.id } });
    await audit({
      schoolId,
      actorUserId: session.user.id,
      action: "post.platformRestore",
      targetType: "Post",
      targetId: post.id,
      meta: { title: post.title, platform: true },
    });
    await tellSchool(schoolId, post.authorUserId, { titleKey: "notifTitle.postPlatformRestored", body: post.title, url: `/bulletin/${post.id}` });
    publish([channel.school(schoolId)], { type: "post.status", postId: post.id, status: "APPROVED" });
  });
}
