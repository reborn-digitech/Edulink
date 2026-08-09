import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createPost, addComment, toggleReaction } from "@/lib/bulletin";
import { createThread, replyToThread } from "@/lib/remarks";
import type { ActiveContext } from "@/lib/session";

/**
 * The invariant the denormalised `schoolId` lives or dies by.
 *
 * Five tables carry a `schoolId` they could have derived through a join. That is
 * what makes every RLS policy the same one-line predicate — and it is only safe
 * while the copy AGREES with the row it was copied from. A comment whose
 * `schoolId` says Riverside on a post that belongs to Oakfield is a row that one
 * school can read and the other cannot see to correct.
 *
 * Nothing in the database enforces the agreement; it is a promise each write site
 * makes. So the write sites are the thing to test, not the column. The seed
 * happens to create no comments, reactions or remark messages at all, which is
 * exactly how this would have gone unnoticed.
 *
 * What these tests prove is agreement — write a wrong id at any of these sites
 * and they fail. What they CANNOT currently prove is the related choice to read
 * the id off the parent rather than off the session, because at every one of
 * these call sites the visibility check has already established that the two are
 * the same school; there is no reachable case where they differ. Taking it from
 * the parent is still the right call, for a reason a test cannot show: it is
 * correct on its own terms, instead of being correct only while "you can see
 * this post" continues to imply "it is in your school".
 */

const db = new PrismaClient();

let riversideId: string;
let teacher: ActiveContext;
let student: ActiveContext;
let classId: string;
let studentMembershipId: string;

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  riversideId = riverside.id;

  const teacherMembership = await db.membership.findFirstOrThrow({
    where: { schoolId: riversideId, role: "TEACHER", status: "ACTIVE" },
  });
  classId = (
    await db.classTeacher.findFirstOrThrow({ where: { teacherMembershipId: teacherMembership.id } })
  ).classId;

  const enrollment = await db.enrollment.findFirstOrThrow({
    where: { classId, status: "ACTIVE" },
    select: { studentMembershipId: true, student: { select: { userId: true } } },
  });
  studentMembershipId = enrollment.studentMembershipId;

  teacher = ctx({
    userId: teacherMembership.userId,
    membershipId: teacherMembership.id,
    schoolId: riversideId,
    role: "TEACHER",
  });
  student = ctx({
    userId: enrollment.student.userId,
    membershipId: studentMembershipId,
    schoolId: riversideId,
    role: "STUDENT",
  });

  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

async function cleanup() {
  const posts = await db.post.findMany({
    where: { title: { startsWith: "TEST denorm" } },
    select: { id: true },
  });
  const postIds = posts.map((p) => p.id);
  if (postIds.length > 0) {
    await db.reaction.deleteMany({ where: { postId: { in: postIds } } });
    await db.comment.deleteMany({ where: { postId: { in: postIds } } });
    await db.post.deleteMany({ where: { id: { in: postIds } } });
  }
  const threads = await db.remarkThread.findMany({
    where: { subject: { startsWith: "TEST denorm" } },
    select: { id: true },
  });
  const threadIds = threads.map((t) => t.id);
  if (threadIds.length > 0) {
    await db.remarkMessage.deleteMany({ where: { threadId: { in: threadIds } } });
    await db.remarkThread.deleteMany({ where: { id: { in: threadIds } } });
  }
}

async function approvedPost(title: string): Promise<string> {
  const { postId } = await createPost(teacher, {
    scope: "CLASS",
    classId,
    title,
    body: "",
    tags: [],
    media: [],
  });
  return postId;
}

describe("a comment inherits its post's school", () => {
  it("⚠ stores the school the post belongs to", async () => {
    const postId = await approvedPost("TEST denorm comment");
    await addComment(student, postId, "Nice work everyone.");

    const comment = await db.comment.findFirstOrThrow({ where: { postId } });
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });

    expect(comment.schoolId).toBe(post.schoolId);
    expect(comment.schoolId).toBe(riversideId);
  });
});

describe("a reaction inherits its post's school", () => {
  it("⚠ stores the school the post belongs to", async () => {
    const postId = await approvedPost("TEST denorm reaction");
    const result = await toggleReaction(student, postId, "CLAP");
    expect(result.added).toBe(true);

    const reaction = await db.reaction.findFirstOrThrow({ where: { postId } });
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });

    expect(reaction.schoolId).toBe(post.schoolId);
  });

  it("puts it back correctly after being removed and added again", async () => {
    const postId = await approvedPost("TEST denorm reaction twice");
    await toggleReaction(student, postId, "STAR");
    await toggleReaction(student, postId, "STAR"); // off
    await toggleReaction(student, postId, "STAR"); // on again

    const reaction = await db.reaction.findFirstOrThrow({ where: { postId } });
    expect(reaction.schoolId).toBe(riversideId);
  });
});

describe("a remark message inherits its thread's school", () => {
  it("⚠ stores it on the opening message and on a reply", async () => {
    const { threadId } = await createThread(teacher, {
      studentMembershipId,
      subject: "TEST denorm thread",
      body: "Opening message.",
    });
    await replyToThread(teacher, { threadId, body: "A reply." });

    const thread = await db.remarkThread.findUniqueOrThrow({ where: { id: threadId } });
    const messages = await db.remarkMessage.findMany({ where: { threadId } });

    expect(messages).toHaveLength(2);
    for (const message of messages) {
      expect(message.schoolId).toBe(thread.schoolId);
    }
  });
});

describe("a post carries all of its pictures", () => {
  /**
   * Media is stored as one JSON array, and the alt text is paired with its file
   * by position. Pairing by position is only safe while the two lists are built
   * in step, so what is worth pinning is that a post with several pictures comes
   * back with each caption still attached to the right one.
   */
  it("keeps every picture, in order, with its own alt text", async () => {
    const media = [
      { fileId: "aaaa0000-1111-2222-3333-000000000001.jpg", kind: "image" as const, alt: "First" },
      { fileId: "aaaa0000-1111-2222-3333-000000000002.jpg", kind: "image" as const, alt: "Second" },
      { fileId: "aaaa0000-1111-2222-3333-000000000003.jpg", kind: "image" as const, alt: "Third" },
    ];

    const { postId } = await createPost(teacher, {
      scope: "CLASS",
      classId,
      title: "TEST denorm three pictures",
      body: "",
      tags: [],
      media,
    });

    const stored = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(JSON.parse(stored.media)).toEqual(media);
  });
});

describe("nothing already stored disagrees", () => {
  /**
   * A sweep of what is actually in the database, not just what these tests
   * created. If a write site is ever added that sets the column from the session
   * — or forgets and copies the wrong id — this is what notices.
   */
  it("⚠ every denormalised schoolId matches its parent", async () => {
    const disagreements: string[] = [];

    for (const row of await db.classTeacher.findMany({ include: { class: true } })) {
      if (row.schoolId !== row.class.schoolId) disagreements.push(`ClassTeacher ${row.id}`);
    }
    for (const row of await db.enrollment.findMany({ include: { class: true } })) {
      if (row.schoolId !== row.class.schoolId) disagreements.push(`Enrollment ${row.id}`);
    }
    for (const row of await db.comment.findMany({ include: { post: true } })) {
      if (row.schoolId !== row.post.schoolId) disagreements.push(`Comment ${row.id}`);
    }
    for (const row of await db.reaction.findMany({ include: { post: true } })) {
      if (row.schoolId !== row.post.schoolId) disagreements.push(`Reaction ${row.id}`);
    }
    for (const row of await db.remarkMessage.findMany({ include: { thread: true } })) {
      if (row.schoolId !== row.thread.schoolId) disagreements.push(`RemarkMessage ${row.id}`);
    }

    expect(disagreements, `Rows whose school disagrees with their parent: ${disagreements.join(", ")}`).toEqual([]);
  });
});
