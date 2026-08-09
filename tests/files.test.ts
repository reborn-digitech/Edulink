import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { authorizeFileRead } from "@/lib/files";
import { createPost, moderatePost } from "@/lib/bulletin";
import type { ActiveContext } from "@/lib/session";

/**
 * Per-file read authorisation.
 *
 * Written before any upload UI existed, because the failure mode here is a
 * child's own submitted work becoming readable by their classmates — and that
 * would look completely fine in the app.
 *
 * The reverse lookup (fileId -> owning record) has no foreign key behind it, so
 * the risky cases are: an orphan file nobody claims, a file id that belongs to
 * another school, and a substring collision between two ids.
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

const SUB_FILE = "aaaaaaaa-1111-2222-3333-444444444444.pdf";
const ASSIGN_FILE = "bbbbbbbb-1111-2222-3333-444444444444.pdf";
const DRAFT_FILE = "cccccccc-1111-2222-3333-444444444444.pdf";
const POST_FILE = "dddddddd-1111-2222-3333-444444444444.png";
const PENDING_POST_FILE = "eeeeeeee-1111-2222-3333-444444444444.png";
const ORPHAN_FILE = "ffffffff-1111-2222-3333-444444444444.pdf";
const OTHER_SCHOOL_FILE = "99999999-1111-2222-3333-444444444444.pdf";

let owner: ActiveContext; // the student whose work it is
let guardian: ActiveContext; // their parent
let classmate: ActiveContext; // same class, NOT their work
let owningTeacher: ActiveContext; // teaches the class
let otherTeacher: ActiveContext; // same school, different class
let admin: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let strangerParent: ActiveContext; // a parent with no child in that class

let assignmentId: string;
let draftAssignmentId: string;
let submissionId: string;
let postId: string;
let pendingPostId: string;
let otherSchoolAssignmentId: string;
let ownerClassId: string;

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

  // The guardianship in the seed points at a child in Priya's class, so use
  // that child as the owner — then the parent is a real guardian of them.
  const link = await db.guardianship.findFirstOrThrow({
    where: { parentUserId: parentUser.id, student: { schoolId: riverside.id } },
    include: { student: { select: { id: true, userId: true } } },
  });

  /**
   * ⚠ THE CLASS THAT CHILD IS ACTUALLY IN, not whichever row came back first.
   *
   * Priya teaches three classes and this was `findFirst` with no `orderBy`.
   * Every check below needs the owner, their classmate and the teacher to be in
   * the SAME class — so when Postgres handed back a different one of Priya's
   * three, the suite failed in a file nobody had edited. Re-seeding was enough
   * to change which. Selecting on the relationship the test depends on is the
   * fix; an `orderBy` would only have made it fail consistently.
   */
  const classId = (
    await db.enrollment.findFirstOrThrow({
      where: {
        studentMembershipId: link.studentMembershipId,
        status: "ACTIVE",
        class: { teachers: { some: { teacherMembershipId: priyaTeacher.id } } },
      },
      select: { classId: true },
    })
  ).classId;
  ownerClassId = classId;

  const others = await db.enrollment.findMany({
    where: { classId, status: "ACTIVE", studentMembershipId: { not: link.studentMembershipId } },
    include: { student: { select: { id: true, userId: true } } },
    take: 1,
  });

  owner = ctx({
    userId: link.student.userId,
    membershipId: link.studentMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  classmate = ctx({
    userId: others[0]!.student.userId,
    membershipId: others[0]!.studentMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  guardian = ctx({ userId: parentUser.id, role: "PARENT" });
  strangerParent = ctx({ userId: sam.id, role: "PARENT" });
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
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riverside.id, role: "ADMIN" });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfield.id,
    role: "ADMIN",
  });

  await cleanup();

  const attach = (fileId: string) =>
    JSON.stringify([{ fileId, name: "work.pdf", size: 1234, mime: "application/pdf" }]);
  const media = (fileId: string) =>
    JSON.stringify([{ fileId, kind: "image", alt: "A picture" }]);

  const published = await db.assignment.create({
    data: {
      schoolId: riverside.id,
      classId,
      authorMembershipId: priyaTeacher.id,
      title: "TEST files published",
      publishedAt: new Date(),
      attachments: attach(ASSIGN_FILE),
    },
  });
  assignmentId = published.id;

  const draft = await db.assignment.create({
    data: {
      schoolId: riverside.id,
      classId,
      authorMembershipId: priyaTeacher.id,
      title: "TEST files draft",
      publishedAt: null,
      attachments: attach(DRAFT_FILE),
    },
  });
  draftAssignmentId = draft.id;

  const submission = await db.submission.create({
    data: {
      schoolId: riverside.id,
      assignmentId: published.id,
      studentMembershipId: link.studentMembershipId,
      status: "SUBMITTED",
      submittedAt: new Date(),
      attachments: attach(SUB_FILE),
    },
  });
  submissionId = submission.id;

  const approvedPost = await db.post.create({
    data: {
      schoolId: riverside.id,
      classId,
      authorUserId: priya.id,
      authorMembershipId: priyaTeacher.id,
      scope: "CLASS",
      title: "TEST files post",
      status: "APPROVED",
      reviewedAt: new Date(),
      media: media(POST_FILE),
    },
  });
  postId = approvedPost.id;

  const pendingPost = await db.post.create({
    data: {
      schoolId: riverside.id,
      classId,
      authorUserId: owner.user.id,
      authorMembershipId: link.studentMembershipId,
      scope: "CLASS",
      title: "TEST files pending post",
      status: "PENDING",
      media: media(PENDING_POST_FILE),
    },
  });
  pendingPostId = pendingPost.id;

  const oakClass = await db.class.findFirstOrThrow({ where: { schoolId: oakfield.id } });
  const oakTeacher = await db.membership.findFirstOrThrow({
    where: { schoolId: oakfield.id, role: "TEACHER" },
  });
  const otherSchoolAssignment = await db.assignment.create({
    data: {
      schoolId: oakfield.id,
      classId: oakClass.id,
      authorMembershipId: oakTeacher.id,
      title: "TEST files other school",
      publishedAt: new Date(),
      attachments: attach(OTHER_SCHOOL_FILE),
    },
  });
  otherSchoolAssignmentId = otherSchoolAssignment.id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

async function cleanup() {
  const assignments = await db.assignment.findMany({
    where: { title: { startsWith: "TEST files" } },
    select: { id: true },
  });
  const ids = assignments.map((a) => a.id);
  if (ids.length > 0) {
    await db.grade.deleteMany({ where: { assignmentId: { in: ids } } });
    await db.submission.deleteMany({ where: { assignmentId: { in: ids } } });
    await db.assignment.deleteMany({ where: { id: { in: ids } } });
  }
  const posts = await db.post.findMany({
    where: { title: { startsWith: "TEST files" } },
    select: { id: true },
  });
  if (posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    await db.reaction.deleteMany({ where: { postId: { in: postIds } } });
    await db.comment.deleteMany({ where: { postId: { in: postIds } } });
    await db.post.deleteMany({ where: { id: { in: postIds } } });
  }
}

const allow = (r: Awaited<ReturnType<typeof authorizeFileRead>>) => r.allowed;

/* -------------------------------------------------------------------------- */

describe("default deny", () => {
  it("⚠ refuses a file referenced by nothing", async () => {
    // An orphan — from a failed write, or a row deleted since — must not become
    // a world-readable URL just because nobody claims it.
    expect(allow(await authorizeFileRead(ORPHAN_FILE, admin))).toBe(false);
    expect(allow(await authorizeFileRead(ORPHAN_FILE, owner))).toBe(false);
    expect(allow(await authorizeFileRead(ORPHAN_FILE, null))).toBe(false);
  });

  it("refuses everything non-logo when unauthenticated", async () => {
    for (const id of [SUB_FILE, ASSIGN_FILE, POST_FILE]) {
      const result = await authorizeFileRead(id, null);
      expect(result.allowed, id).toBe(false);
      if (!result.allowed) expect(result.reason).toBe("unauthenticated");
    }
  });

  it("refuses a garbage id", async () => {
    for (const id of ["", "../../.env", "not-a-uuid", "%2e%2e%2f.env"]) {
      expect(allow(await authorizeFileRead(id, admin)), id).toBe(false);
    }
  });
});

describe("submission attachment — a child's own work", () => {
  it("is readable by the student themselves", async () => {
    expect(allow(await authorizeFileRead(SUB_FILE, owner))).toBe(true);
  });

  it("is readable by their active guardian", async () => {
    expect(allow(await authorizeFileRead(SUB_FILE, guardian))).toBe(true);
  });

  it("is readable by a teacher of the class it was set for", async () => {
    expect(allow(await authorizeFileRead(SUB_FILE, owningTeacher))).toBe(true);
  });

  it("is readable by an admin of that school", async () => {
    expect(allow(await authorizeFileRead(SUB_FILE, admin))).toBe(true);
  });

  it("⚠ is NOT readable by a classmate", async () => {
    // The single most important assertion in this file.
    expect(allow(await authorizeFileRead(SUB_FILE, classmate))).toBe(false);
  });

  it("is NOT readable by a teacher of a different class", async () => {
    expect(allow(await authorizeFileRead(SUB_FILE, otherTeacher))).toBe(false);
  });

  it("is NOT readable by another school's admin", async () => {
    expect(allow(await authorizeFileRead(SUB_FILE, otherSchoolAdmin))).toBe(false);
  });

  it("is NOT readable by a parent who does not guard that child", async () => {
    expect(allow(await authorizeFileRead(SUB_FILE, strangerParent))).toBe(false);
  });

  it("stops being readable once the guardianship is revoked", async () => {
    const link = await db.guardianship.findFirstOrThrow({
      where: { parentUserId: guardian.user.id, studentMembershipId: owner.membershipId! },
    });
    await db.guardianship.update({ where: { id: link.id }, data: { status: "REVOKED" } });
    expect(allow(await authorizeFileRead(SUB_FILE, guardian))).toBe(false);
    await db.guardianship.update({ where: { id: link.id }, data: { status: "ACTIVE" } });
    expect(allow(await authorizeFileRead(SUB_FILE, guardian))).toBe(true);
  });
});

describe("assignment attachment", () => {
  it("is readable by enrolled students, their guardians, the teacher and admins", async () => {
    expect(allow(await authorizeFileRead(ASSIGN_FILE, owner))).toBe(true);
    expect(allow(await authorizeFileRead(ASSIGN_FILE, classmate))).toBe(true);
    expect(allow(await authorizeFileRead(ASSIGN_FILE, guardian))).toBe(true);
    expect(allow(await authorizeFileRead(ASSIGN_FILE, owningTeacher))).toBe(true);
    expect(allow(await authorizeFileRead(ASSIGN_FILE, admin))).toBe(true);
  });

  it("is NOT readable by a teacher of a different class", async () => {
    expect(allow(await authorizeFileRead(ASSIGN_FILE, otherTeacher))).toBe(false);
  });

  it("⚠ an UNPUBLISHED draft's attachment is hidden from students and parents", async () => {
    expect(allow(await authorizeFileRead(DRAFT_FILE, owner))).toBe(false);
    expect(allow(await authorizeFileRead(DRAFT_FILE, guardian))).toBe(false);
    // But the teacher who wrote it, and admins, can still see it.
    expect(allow(await authorizeFileRead(DRAFT_FILE, owningTeacher))).toBe(true);
    expect(allow(await authorizeFileRead(DRAFT_FILE, admin))).toBe(true);
  });

  it("⚠ is NOT readable across schools even with a valid id", async () => {
    expect(allow(await authorizeFileRead(OTHER_SCHOOL_FILE, admin))).toBe(false);
    expect(allow(await authorizeFileRead(OTHER_SCHOOL_FILE, owner))).toBe(false);
    expect(allow(await authorizeFileRead(OTHER_SCHOOL_FILE, owningTeacher))).toBe(false);
    // And is readable by that school's own admin.
    expect(allow(await authorizeFileRead(OTHER_SCHOOL_FILE, otherSchoolAdmin))).toBe(true);
  });
});

describe("bulletin post media", () => {
  it("follows the post's visibility for an approved class post", async () => {
    expect(allow(await authorizeFileRead(POST_FILE, owner))).toBe(true);
    expect(allow(await authorizeFileRead(POST_FILE, classmate))).toBe(true);
    expect(allow(await authorizeFileRead(POST_FILE, guardian))).toBe(true);
    expect(allow(await authorizeFileRead(POST_FILE, admin))).toBe(true);
    expect(allow(await authorizeFileRead(POST_FILE, otherSchoolAdmin))).toBe(false);
  });

  it("⚠ a PENDING student post's media is hidden from classmates", async () => {
    // Mirrors the post itself: unreviewed content from a child is not public.
    expect(allow(await authorizeFileRead(PENDING_POST_FILE, classmate))).toBe(false);
    // The author sees their own.
    expect(allow(await authorizeFileRead(PENDING_POST_FILE, owner))).toBe(true);
    // The reviewing teacher and admins see it.
    expect(allow(await authorizeFileRead(PENDING_POST_FILE, owningTeacher))).toBe(true);
    expect(allow(await authorizeFileRead(PENDING_POST_FILE, admin))).toBe(true);
    // A teacher of another class does not.
    expect(allow(await authorizeFileRead(PENDING_POST_FILE, otherTeacher))).toBe(false);
  });
});

describe("a picture becomes visible only when the post does", () => {
  /**
   * The lifecycle the upload feature actually depends on. The two ends were
   * already covered separately — a PENDING post's media is private, an APPROVED
   * post's media follows the post — but nothing asserted that APPROVING is what
   * moves a file from one to the other. If moderation ever stopped flipping
   * that, both existing tests would still pass and children's unreviewed
   * pictures would be readable by the class.
   */
  it("⚠ a classmate is refused while it waits, and served once a teacher approves", async () => {
    const fileId = "12345678-aaaa-bbbb-cccc-444444444444.jpg";

    const created = await createPost(owner, {
      scope: "CLASS",
      classId: ownerClassId,
      title: "TEST files media lifecycle",
      body: "",
      tags: [],
      media: [{ fileId, kind: "image", alt: "A model volcano erupting" }],
    });

    // A student's post is held for review — that is what makes the picture private.
    expect(created.status).toBe("PENDING");
    expect(allow(await authorizeFileRead(fileId, classmate))).toBe(false);
    expect(allow(await authorizeFileRead(fileId, owner))).toBe(true);
    expect(allow(await authorizeFileRead(fileId, owningTeacher))).toBe(true);

    await moderatePost(owningTeacher, created.postId, "APPROVE");

    expect(allow(await authorizeFileRead(fileId, classmate))).toBe(true);
    // Approval widens it to the class, not beyond it.
    expect(allow(await authorizeFileRead(fileId, otherSchoolAdmin))).toBe(false);
  });

  it("⚠ rejecting a post does not publish its picture", async () => {
    const fileId = "87654321-aaaa-bbbb-cccc-444444444444.jpg";

    const created = await createPost(owner, {
      scope: "CLASS",
      classId: ownerClassId,
      title: "TEST files media rejected",
      body: "",
      tags: [],
      media: [{ fileId, kind: "image", alt: "Something a teacher said no to" }],
    });

    await moderatePost(owningTeacher, created.postId, "REJECT", "Please do not share this one.");

    expect(allow(await authorizeFileRead(fileId, classmate))).toBe(false);
    // The child can still see their own, so they know what was turned down.
    expect(allow(await authorizeFileRead(fileId, owner))).toBe(true);
  });
});

describe("reference matching", () => {
  it("⚠ does not match a fileId that is a substring of another", async () => {
    // Without quoting the reference, id "a.png" would match a record holding
    // "aa.png" and authorise the wrong file.
    const shortId = "1111.png";
    const longId = "xx1111.png";
    await db.assignment.create({
      data: {
        schoolId: admin.schoolId!,
        classId: (await db.class.findFirstOrThrow({ where: { schoolId: admin.schoolId! } })).id,
        authorMembershipId: owningTeacher.membershipId!,
        title: "TEST files substring",
        publishedAt: new Date(),
        attachments: JSON.stringify([
          { fileId: longId, name: "a.pdf", size: 1, mime: "application/pdf" },
        ]),
      },
    });

    // The long id resolves; the short one must not piggy-back on it.
    expect(allow(await authorizeFileRead(longId, admin))).toBe(true);
    expect(allow(await authorizeFileRead(shortId, admin))).toBe(false);
  });
});
