import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  createPost,
  getPost,
  listFeed,
  moderatePost,
  pendingCount,
  toggleReaction,
  togglePin,
} from "@/lib/bulletin";
import type { ActiveContext } from "@/lib/session";

/**
 * Bulletin safety model.
 *
 * The claim being tested is narrow and important: a child's post is invisible to
 * everyone except the child and the specific adult who can review it, until that
 * adult approves it. If that leaks, an unreviewed post from a nine-year-old is
 * readable by the whole school — which is the exact thing moderation exists to
 * prevent.
 */

const db = new PrismaClient();

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

let author: ActiveContext; // student in Priya's class
let classmate: ActiveContext; // another student in the SAME class
let owningTeacher: ActiveContext; // teaches that class
let otherTeacher: ActiveContext; // same school, different class
let admin: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let parent: ActiveContext;

let classId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const parentUser = await db.user.findUniqueOrThrow({ where: { email: "parent@example.com" } });

  const priyaTeacher = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfield.id, role: "ADMIN" },
  });

  const priyaClass = await db.classTeacher.findFirstOrThrow({
    where: { teacherMembershipId: priyaTeacher.id },
  });
  classId = priyaClass.classId;

  const enrolled = await db.enrollment.findMany({
    where: { classId, status: "ACTIVE" },
    include: { student: { select: { id: true, userId: true } } },
    take: 2,
  });
  expect(enrolled.length).toBe(2);

  author = ctx({
    userId: enrolled[0]!.student.userId,
    membershipId: enrolled[0]!.studentMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  classmate = ctx({
    userId: enrolled[1]!.student.userId,
    membershipId: enrolled[1]!.studentMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  owningTeacher = ctx({
    userId: priya.id,
    membershipId: priyaTeacher.id,
    schoolId: riverside.id,
    role: "TEACHER",
  });
  otherTeacher = ctx({
    userId: tom.id,
    membershipId: tomTeacher.id,
    schoolId: riverside.id,
    role: "TEACHER",
  });
  admin = ctx({
    userId: priya.id,
    membershipId: priyaAdmin.id,
    schoolId: riverside.id,
    role: "ADMIN",
  });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfield.id,
    role: "ADMIN",
  });
  parent = ctx({ userId: parentUser.id, role: "PARENT", schoolId: riverside.id });

  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

async function cleanup() {
  const doomed = await db.post.findMany({
    where: { title: { startsWith: "TEST post" } },
    select: { id: true },
  });
  const ids = doomed.map((p) => p.id);
  if (ids.length === 0) return;
  await db.reaction.deleteMany({ where: { postId: { in: ids } } });
  await db.comment.deleteMany({ where: { postId: { in: ids } } });
  await db.post.deleteMany({ where: { id: { in: ids } } });
}

function newStudentPost(title: string) {
  return createPost(author, {
    scope: "CLASS",
    classId,
    title,
    body: "Body text.",
    tags: ["science"],
    media: [],
  });
}

async function expectNotFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toBeInstanceOf(AccessError);
  await promise.catch((error: AccessError) => expect(error.code).toBe("NOT_FOUND"));
}

/* -------------------------------------------------------------------------- */

describe("who needs approval", () => {
  it("holds a STUDENT post as PENDING", async () => {
    const result = await newStudentPost("TEST post student");
    expect(result.status).toBe("PENDING");
  });

  it("publishes a TEACHER post immediately", async () => {
    const result = await createPost(owningTeacher, {
      scope: "CLASS",
      classId,
      title: "TEST post teacher",
      body: "",
      tags: [],
      media: [],
    });
    expect(result.status).toBe("APPROVED");
  });

  it("publishes an ADMIN school-wide post immediately", async () => {
    const result = await createPost(admin, {
      scope: "SCHOOL",
      title: "TEST post admin",
      body: "",
      tags: [],
      media: [],
    });
    expect(result.status).toBe("APPROVED");
  });

  it("refuses a student posting to a class they are not in", async () => {
    const otherClass = await db.class.findFirstOrThrow({
      where: { schoolId: author.schoolId!, id: { not: classId } },
    });
    await expectNotFound(
      createPost(author, {
        scope: "CLASS",
        classId: otherClass.id,
        title: "TEST post trespass",
        body: "",
        tags: [],
        media: [],
      }),
    );
  });

  it("refuses global-feed posting rather than silently downgrading it", async () => {
    // Quietly turning a GLOBAL post into a SCHOOL post would put a child's work
    // somewhere they did not choose.
    await expect(
      createPost(owningTeacher, {
        scope: "GLOBAL",
        title: "TEST post global",
        body: "",
        tags: [],
        media: [],
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("a pending student post is hidden", () => {
  let postId: string;

  beforeAll(async () => {
    postId = (await newStudentPost("TEST post hidden")).postId;
  });

  it("is visible to its author", async () => {
    await expect(getPost(author, postId)).resolves.toBeTruthy();
    const feed = await listFeed(author);
    expect(feed.some((p) => p.id === postId)).toBe(true);
  });

  it("is visible to the teacher of that class", async () => {
    await expect(getPost(owningTeacher, postId)).resolves.toBeTruthy();
  });

  it("is visible to an admin of the school", async () => {
    await expect(getPost(admin, postId)).resolves.toBeTruthy();
  });

  it("⚠ is NOT visible to a classmate", async () => {
    // The single most important assertion in this file.
    await expectNotFound(getPost(classmate, postId));
    const feed = await listFeed(classmate);
    expect(feed.some((p) => p.id === postId)).toBe(false);
  });

  it("is NOT visible to a teacher of a different class", async () => {
    await expectNotFound(getPost(otherTeacher, postId));
    const feed = await listFeed(otherTeacher);
    expect(feed.some((p) => p.id === postId)).toBe(false);
  });

  it("is NOT visible to a parent", async () => {
    await expectNotFound(getPost(parent, postId));
  });

  it("is NOT visible to another school's admin", async () => {
    await expectNotFound(getPost(otherSchoolAdmin, postId));
    const feed = await listFeed(otherSchoolAdmin);
    expect(feed.some((p) => p.id === postId)).toBe(false);
  });

  it("cannot be reacted to while pending", async () => {
    await expectNotFound(toggleReaction(classmate, postId, "CLAP"));
  });
});

describe("moderation", () => {
  it("makes an approved post visible to the class", async () => {
    const { postId } = await newStudentPost("TEST post approve me");
    expect((await listFeed(classmate)).some((p) => p.id === postId)).toBe(false);

    await moderatePost(owningTeacher, postId, "APPROVE");

    expect((await listFeed(classmate)).some((p) => p.id === postId)).toBe(true);
  });

  it("requires a reason to reject", async () => {
    const { postId } = await newStudentPost("TEST post reject no reason");
    await expect(moderatePost(owningTeacher, postId, "REJECT")).rejects.toBeInstanceOf(AccessError);
    await expect(moderatePost(owningTeacher, postId, "REJECT", "   ")).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("stores the reason and shows it to the author only", async () => {
    const { postId } = await newStudentPost("TEST post reject with reason");
    await moderatePost(owningTeacher, postId, "REJECT", "Please remove Ella's surname.");

    const mine = (await listFeed(author)).find((p) => p.id === postId)!;
    expect(mine.status).toBe("REJECTED");
    expect(mine.rejectionReason).toBe("Please remove Ella's surname.");

    // A rejected post stays invisible to everyone else.
    expect((await listFeed(classmate)).some((p) => p.id === postId)).toBe(false);
  });

  it("refuses a teacher who does not teach the class", async () => {
    const { postId } = await newStudentPost("TEST post wrong teacher");
    await expectNotFound(moderatePost(otherTeacher, postId, "APPROVE"));
  });

  it("⚠ refuses a TEACHER approving a school-wide student post", async () => {
    // A school-wide post reaches every family, so it needs an admin.
    const { postId } = await createPost(author, {
      scope: "SCHOOL",
      title: "TEST post school-wide student",
      body: "",
      tags: [],
      media: [],
    });
    await expect(moderatePost(owningTeacher, postId, "APPROVE")).rejects.toBeInstanceOf(AccessError);
    await expect(moderatePost(admin, postId, "APPROVE")).resolves.toBeUndefined();
  });

  it("refuses a student moderating anything, including their own post", async () => {
    const { postId } = await newStudentPost("TEST post self approve");
    await expect(moderatePost(author, postId, "APPROVE")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses to review the same post twice", async () => {
    const { postId } = await newStudentPost("TEST post double review");
    await moderatePost(owningTeacher, postId, "APPROVE");
    await expect(moderatePost(owningTeacher, postId, "APPROVE")).rejects.toBeInstanceOf(AccessError);
  });
});

describe("pendingCount", () => {
  it("counts only what the caller can actually review", async () => {
    await cleanup();
    await newStudentPost("TEST post queue one");
    await newStudentPost("TEST post queue two");

    expect(await pendingCount(owningTeacher)).toBe(2);
    expect(await pendingCount(admin)).toBe(2);
    // Tom teaches a different class.
    expect(await pendingCount(otherTeacher)).toBe(0);
    expect(await pendingCount(otherSchoolAdmin)).toBe(0);
    // Students and parents have no queue.
    expect(await pendingCount(author)).toBe(0);
    expect(await pendingCount(parent)).toBe(0);
  });
});

describe("pinning", () => {
  it("is admin-only", async () => {
    const { postId } = await createPost(owningTeacher, {
      scope: "CLASS",
      classId,
      title: "TEST post pin me",
      body: "",
      tags: [],
      media: [],
    });

    await expect(togglePin(owningTeacher, postId)).rejects.toBeInstanceOf(AccessError);
    await expect(togglePin(author, postId)).rejects.toBeInstanceOf(AccessError);

    expect(await togglePin(admin, postId)).toBe(true);
    expect(await togglePin(admin, postId)).toBe(false);
  });

  it("cannot pin another school's post", async () => {
    const { postId } = await createPost(owningTeacher, {
      scope: "CLASS",
      classId,
      title: "TEST post cross pin",
      body: "",
      tags: [],
      media: [],
    });
    await expectNotFound(togglePin(otherSchoolAdmin, postId));
  });
});

describe("reactions", () => {
  it("toggles and is idempotent per kind", async () => {
    const { postId } = await createPost(owningTeacher, {
      scope: "CLASS",
      classId,
      title: "TEST post reactions",
      body: "",
      tags: [],
      media: [],
    });

    expect(await toggleReaction(classmate, postId, "CLAP")).toEqual({ added: true });
    expect(await toggleReaction(classmate, postId, "CLAP")).toEqual({ added: false });
    expect(await toggleReaction(classmate, postId, "STAR")).toEqual({ added: true });

    const feed = await listFeed(classmate);
    const seen = feed.find((p) => p.id === postId)!;
    expect(seen.reactions.STAR).toBe(1);
    expect(seen.myReactions).toContain("STAR");
    expect(seen.myReactions).not.toContain("CLAP");
  });

  it("cannot react to another school's post", async () => {
    const { postId } = await createPost(owningTeacher, {
      scope: "CLASS",
      classId,
      title: "TEST post cross react",
      body: "",
      tags: [],
      media: [],
    });
    await expectNotFound(toggleReaction(otherSchoolAdmin, postId, "HEART"));
  });
});
