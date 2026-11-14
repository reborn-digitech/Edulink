import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { readJsonArray, type MediaItem } from "./json";
import { CATEGORY_HASHTAGS, schoolHashtag, searchWhere } from "./bulletin";
import type { ActiveContext } from "./session";
import { isCollegeRole, isTeachingRole, type PostCategory, type Role } from "./constants";
import { forOwnSchools, forUser } from "./tenant-context";
import { INSTITUTION_KINDS, type InstitutionKind } from "@edulink/contracts";
import { parentMaySee } from "./student-consent";

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
 * THE MODERATION PROBLEM, AND THE ANSWER. Every school role is scoped to one
 * school, so no school can moderate the feed on everyone's behalf. The
 * authority is split along the line that already exists:
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
 * Neither school can reach into the other. THE ACTOR ABOVE A SCHOOL IS THE
 * PLATFORM, and it is the one that takes a post down for everyone: the
 * operator (or the content team the operator appoints) takes a GLOBAL post
 * down with a reason from /appadmin/moderation — reached from the operator's
 * console — or POST /api/v1/appadmin/moderation/{postId}/takedown, and puts
 * it back the same way (bulletin.ts platformTakedown / platformRestore, the
 * PlatformTakedown row). The post's status becomes TAKEN_DOWN, which the
 * global clause no longer admits, so it is gone from every tenant at once;
 * the publishing school's office and the author are told the reason, and the
 * act is in that school's audit log with the platform as actor
 * (`post.platformTakedown`). This was "missing on purpose" until 2 October
 * 2026, when the actor existed; it is not missing any more.
 *
 * WHO READS IT (4 October 2026, `globalReader`). Every role of a school or a
 * college: the office, the head, a teacher and the module and college staff
 * roles read as staff; a pupil and an alumnus read under the age on their own
 * User row (a minor's comment is held, as every global comment is, by their
 * own school); a guardian reads through their children — an adult student's
 * only through the MESSAGES grant (student-consent.ts). An expert and a
 * recruiter belong to no school and do not reach it. A PERSON READS IT ONCE:
 * a pupil or an alumnus with rows at several schools (left two, moved to a
 * third) reads one feed whose hide set is the union of every school they
 * belong to, as a guardian's is the union of their children's.
 *
 * WHICH KINDS (4 October 2026). Each tenant's admin chooses whether its
 * people read posts from schools, colleges or both (School.globalFeedKinds);
 * a post carries its publisher's kind, stamped at publish beside its name
 * (Post.globalSchoolKind). A reader who belongs to several reads only the
 * kinds every one of them allows — curation narrows, it never widens.
 */

export type GlobalPost = {
  id: string;
  category: PostCategory;
  title: string;
  body: string;
  media: MediaItem[];
  tags: string[];
  /** Cross-school conversation: counts by kind, and this reader's own taps. */
  reactions: Record<string, number>;
  myReactions: string[];
  commentCount: number;
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
  opts: { includeHidden?: boolean; category?: PostCategory; q?: string; tag?: string } = {},
): Promise<GlobalPost[]> {
  if (!globalReader(session.role)) return [];
  const schoolId = session.schoolId;
  // Who sees a hidden post marked rather than not at all: the office, and a teacher of the school that hid it.
  const isStaff = session.role === "ADMIN" || isTeachingRole(session.role);

  /**
   * A GUARDIAN READS THROUGH THEIR CHILDREN'S SCHOOLS. A parent binds no
   * school of their own, and for as long as this function keyed hides on
   * `session.schoolId` alone, the page above it had to demand a school —
   * which sent every parent to the switcher, which offered them no school
   * to pick: a locked door with a sign saying "use the door". The parent of
   * two children at two schools is exactly who reported it.
   *
   * Their hide set is the UNION across their children's schools: a school
   * hiding a post is curating what its community sees, and a guardian
   * belongs to every community their children do — content one child's
   * school deliberately took down does not become fine because the other
   * child's school never looked at it. Their guardianship schools are
   * already their tenant set, so these hide rows are theirs to read.
   */
  const hideScopeSchoolIds: string[] =
    session.role === "PARENT" && !schoolId
      ? await familyReadingSchools(session.user.id)
      : (session.role === "ALUMNUS" || session.role === "STUDENT") && schoolId
        ? await personSchools(session.user.id, schoolId)
        : schoolId
          ? [schoolId]
          : [];
  // A guardian whose every child is an adult at a college who has not granted MESSAGES reads nothing.
  if (hideScopeSchoolIds.length === 0) return [];

  // The hides and the kind settings of every school in the scope: the person's own schools, widened to exactly those.
  const { hides, kinds } = await forOwnSchools(session.user.id, hideScopeSchoolIds, async () => {
    const [hideRows, schools] = await Promise.all([
      db.globalPostHide.findMany({ where: { schoolId: { in: hideScopeSchoolIds } }, select: { postId: true } }),
      db.school.findMany({ where: { id: { in: hideScopeSchoolIds } }, select: { globalFeedKinds: true } }),
    ]);
    return { hides: hideRows, kinds: allowedKinds(schools.map((s) => s.globalFeedKinds)) };
  });
  if (kinds.length === 0) return [];

  const [posts] = await Promise.all([
    db.post.findMany({
      where: {
        scope: "GLOBAL",
        status: "APPROVED",
        // The kind filter: a post published before kinds were stamped is a school's.
        OR: [{ globalSchoolKind: { in: kinds } }, ...(kinds.includes("SCHOOL") ? [{ globalSchoolKind: null }] : [])],
        ...(opts.category ? { category: opts.category } : {}),
        ...(opts.q ? { AND: [searchWhere(opts.q)] } : {}),
        // Same rule as the school feed: a tag is a quoted JSON member.
        ...(opts.tag ? { tags: { contains: `"${opts.tag}"` } } : {}),
      },
      include: {
        author: { select: { name: true, preferredName: true, isMinor: true } },
        // The author's membership is behind its own school's policy, so it
        // reads null for another school's post; `isMinor` on the User row is
        // the fact that crosses. Either says "a pupil" for the name rule below.
        authorship: { select: { role: true } },
        // Readable only for our OWN school's posts — another school's School row
        // is behind its own policy, correctly. `globalSchoolName` is the copy
        // that survives the boundary; this relation is the nicer name when it
        // happens to be readable.
        school: { select: { id: true, name: true } },
        // The conversation crosses with the post: reaction rows and APPROVED
        // comment counts are readable here through the widened RLS clauses.
        reactions: { select: { kind: true, userId: true } },
        _count: { select: { comments: { where: { status: "APPROVED" } } } },
      },
      orderBy: [{ pinnedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 100,
    }),
  ]);

  const hidden = new Set(hides.map((h) => h.postId));
  const showHidden = isStaff && opts.includeHidden !== false;

  return posts
    .filter((post) => showHidden || !hidden.has(post.id))
    .map((post) => {
      const reactions: Record<string, number> = {};
      const myReactions: string[] = [];
      for (const reaction of post.reactions) {
        reactions[reaction.kind] = (reactions[reaction.kind] ?? 0) + 1;
        if (reaction.userId === session.user.id) myReactions.push(reaction.kind);
      }
      return {
      id: post.id,
      category: post.category as PostCategory,
      title: post.title,
      body: post.body,
      reactions,
      myReactions,
      commentCount: post._count.comments,
      media: readJsonArray<MediaItem>(post.media),
      tags: readJsonArray<string>(post.tags),
      createdAt: post.createdAt,
      // A PUPIL IS A FIRST NAME on the global feed. This is the one page the
      // whole server reads, and a child's full name beside their school is
      // enough to find them; staff and parents are adults and keep theirs.
      authorName:
        post.author.isMinor || post.authorship?.role === "STUDENT"
          ? firstNameOf(post.author.preferredName ?? post.author.name)
          : (post.author.preferredName ?? post.author.name),
      // The denormalised name FIRST: it is the only one readable from another
      // school. The relation is the fallback for our own posts and for any row
      // published before this column existed.
      // Empty when the school is gone; the page renders its own words for that.
      schoolName: post.globalSchoolName ?? post.school?.name ?? "",
      schoolId: post.school?.id ?? "",
      // For a guardian, "ours" means a school one of their children attends.
      ours: schoolId ? post.schoolId === schoolId : hideScopeSchoolIds.includes(post.schoolId ?? ""),
      hiddenHere: hidden.has(post.id),
      };
    });
}

/**
 * HOW THE GLOBAL FEED READS A ROLE (4 October 2026), every role named:
 * "staff" for the office, the head, a teacher, the module staff (driver,
 * library, warden) and the college's six staff roles; "pupil" for a pupil and
 * an alumnus, whose minor rules come from their own User row; "family" for a
 * guardian; null — no feed — for an expert, a recruiter or no role.
 */
export function globalReader(role: Role | null | undefined): "staff" | "pupil" | "family" | null {
  if (!role) return null;
  if (role === "ADMIN" || role === "PRINCIPAL" || role === "TEACHER" || role === "DRIVER" || role === "LIBRARIAN" || role === "WARDEN" || isCollegeRole(role)) return "staff";
  if (role === "STUDENT" || role === "ALUMNUS") return "pupil";
  if (role === "PARENT") return "family";
  return null;
}

/** The kinds every one of these settings allows; an unreadable setting allows every kind. */
function allowedKinds(settings: string[]): InstitutionKind[] {
  let kinds: InstitutionKind[] = [...INSTITUTION_KINDS];
  for (const raw of settings) {
    const set = readJsonArray<string>(raw);
    const named = set.filter((k): k is InstitutionKind => (INSTITUTION_KINDS as readonly string[]).includes(k));
    if (named.length > 0 || raw.trim() === "[]") kinds = kinds.filter((k) => named.includes(k));
  }
  return kinds;
}

/** The schools a pupil or an alumnus belongs to now, the session's first: a person with several rows reads one feed. */
async function personSchools(userId: string, sessionSchoolId: string): Promise<string[]> {
  const rows = await forUser(userId, () => db.membership.findMany({ where: { userId, status: "ACTIVE", leftAt: null }, select: { schoolId: true } }));
  return [...new Set([sessionSchoolId, ...rows.map((r) => r.schoolId)])];
}

/**
 * The schools a guardian reads the feed through: each child's, except an
 * adult's at a college who has not granted MESSAGES (student-consent.ts).
 */
async function familyReadingSchools(userId: string): Promise<string[]> {
  // A child still on the roll (TA-092): a leaver's family keeps the link for the record, not the school's feed.
  const links = await db.guardianship.findMany({ where: { parentUserId: userId, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true, studentSchoolId: true } });
  const schools = new Set<string>();
  for (const link of links) {
    if (schools.has(link.studentSchoolId)) continue;
    if (await parentMaySee(link.studentMembershipId, "MESSAGES")) schools.add(link.studentSchoolId);
  }
  return [...schools];
}

/** "Aarav Sharma" → "Aarav"; a single word stays as it is. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
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
    throw new AccessError("access.onlyASchoolAdminCanPublishTo");
  }

  // Scoped find before the write. RLS would refuse a cross-school update, but
  // an unscoped `update` would report success on zero rows.
  const post = await db.post.findFirst({
    where: { id: postId, schoolId: session.schoolId },
    select: {
      id: true,
      status: true,
      scope: true,
      title: true,
      body: true,
      category: true,
      school: { select: { name: true, kind: true } },
    },
  });
  if (!post) throw new AccessError("access.noSuchPost", "NOT_FOUND");
  if (post.status !== "APPROVED") {
    throw new AccessError("access.approveThePostForYourOwnSchool");
  }
  if (post.scope === "GLOBAL") return; // already there; not an error

  /**
   * A global post signs itself: "#CategoryName #SchoolName" on its own line,
   * appended at the moment of publishing — the same moment the school name is
   * stamped, and for the same reason: this is the last point the publishing
   * school's row is readable. In the BODY rather than synthesised at render so
   * the search finds it, every reader sees the same thing, and taking the post
   * back off the feed can remove exactly what publishing added. Idempotent:
   * a re-publish after an unpublish must not stack signatures.
   */
  const signature = [CATEGORY_HASHTAGS[post.category as PostCategory], schoolHashtag(post.school?.name ?? "")]
    .filter(Boolean)
    .join(" ");
  const body =
    signature && !post.body.includes(signature)
      ? `${post.body.trimEnd()}\n\n${signature}`.trimStart()
      : post.body;

  await db.post.update({
    where: { id: post.id },
    // The kind crosses with the name, for the readers' kind filter (4 Oct 2026).
    data: { scope: "GLOBAL", globalSchoolName: post.school?.name ?? null, globalSchoolKind: post.school?.kind ?? "SCHOOL", body },
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
    throw new AccessError("access.onlyASchoolAdminCanChangeWhat");
  }

  const post = await db.post.findFirst({
    where: { id: postId, schoolId: session.schoolId, scope: "GLOBAL" },
    select: { id: true, title: true, body: true, category: true, globalSchoolName: true },
  });
  if (!post) throw new AccessError("access.noSuchPost", "NOT_FOUND");

  // Publishing signed the body; unpublishing removes exactly that signature —
  // and only as the trailing line publishing wrote, so a hashtag the author
  // typed themselves mid-text is left alone.
  const signature = [
    CATEGORY_HASHTAGS[post.category as PostCategory],
    schoolHashtag(post.globalSchoolName ?? ""),
  ]
    .filter(Boolean)
    .join(" ");
  // A post signed before the tag kept its vowel signs (TA-554) carries the tag without them: that form is removed too.
  const legacy = signature.replace(/\p{M}/gu, "");
  const signed = signature && post.body.endsWith(signature) ? signature : legacy && post.body.endsWith(legacy) ? legacy : "";
  const body = signed ? post.body.slice(0, -signed.length).trimEnd() : post.body;

  await db.post.update({ where: { id: post.id }, data: { scope: "SCHOOL", body } });

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
    throw new AccessError("access.onlyASchoolAdminCanHideA");
  }

  // Readable through the global clause, which is exactly the set that may be
  // hidden. A school-private post of another school is not findable here.
  const post = await db.post.findFirst({
    where: { id: postId, scope: "GLOBAL", status: "APPROVED" },
    select: { id: true, title: true, schoolId: true },
  });
  if (!post) throw new AccessError("access.noSuchPost", "NOT_FOUND");

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
    throw new AccessError("access.onlyASchoolAdminCanUnhideA");
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
