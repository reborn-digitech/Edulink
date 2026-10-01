/**
 * Releasing a held comment, stated by its tests:
 *
 *   * A comment is held at ONE school and only that school's reviewers see
 *     it in their queue: an admin everything held there, a teacher the
 *     comments on the class posts of classes they teach.
 *   * Approving makes it public and tells the people posting would have
 *     told — but never a child in another school about a stranger's reply.
 *   * Removing needs a reason, the author is told it, and the reason stays
 *     out of the audit row.
 *   * A decision is made once.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { addComment, createPost, getPost, heldCommentCount, heldComments, moderateComment, moderatePost } from "@/lib/bulletin";
import { publishGlobally } from "@/lib/global-feed";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolA = "";
let schoolB = "";
let classId = "";
let classPostId = "";
let globalPostId = "";
const userIds: string[] = [];
const people: Record<string, { userId: string; membershipId: string; schoolId: string; role: NonNullable<ActiveContext["role"]>; isMinor: boolean }> = {};

function as(name: string): ActiveContext {
  const p = people[name]!;
  return {
    sessionId: "t",
    membershipId: p.membershipId,
    schoolId: p.schoolId,
    role: p.role,
    user: { id: p.userId, name: `ZZ ${name}`, preferredName: null, email: null, avatarKey: null, isMinor: p.isMinor, isSuperuser: false, isAppAdmin: false, prefs: {} as never },
  };
}
const told = (name: string, titleKey: string) => db.notification.count({ where: { userId: people[name]!.userId, titleKey } });
const statusOf = async (id: string) => (await db.comment.findUniqueOrThrow({ where: { id }, select: { status: true } })).status;
const newest = async (postId: string, name: string) => (await db.comment.findFirstOrThrow({ where: { postId, authorUserId: people[name]!.userId }, orderBy: { createdAt: "desc" }, select: { id: true } })).id;

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolA = (await db.school.create({ data: { name: `ZZ Comment Review A ${STAMP}`, slug: `zz-cr-a-${STAMP}`, code: `ZCA${suffix}`, contactEmail: `zz-cr-a-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  schoolB = (await db.school.create({ data: { name: `ZZ Comment Review B ${STAMP}`, slug: `zz-cr-b-${STAMP}`, code: `ZCB${suffix}`, contactEmail: `zz-cr-b-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = async (name: string, schoolId: string, role: NonNullable<ActiveContext["role"]>, isMinor = false) => {
    const user = await db.user.create({ data: { name: `ZZ ${name}`, email: `zz-cr-${name.toLowerCase()}-${STAMP}@test.invalid`, isMinor }, select: { id: true } });
    const membership = await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZCR${name}${suffix}` } : {}) }, select: { id: true } });
    userIds.push(user.id);
    people[name] = { userId: user.id, membershipId: membership.id, schoolId, role, isMinor };
  };
  await mk("PupilA", schoolA, "STUDENT", true);
  await mk("AdminA", schoolA, "ADMIN");
  await mk("TeacherA", schoolA, "TEACHER");
  await mk("OtherTeacherA", schoolA, "TEACHER");
  await mk("AdminB", schoolB, "ADMIN");
  await mk("TeacherB", schoolB, "TEACHER");

  classId = (await db.class.create({ data: { schoolId: schoolA, name: `ZZ CR Class ${suffix}`, gradeLevel: "6", joinCode: `ZCR${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId, teacherMembershipId: people.TeacherA!.membershipId, schoolId: schoolA } });
  await db.enrollment.create({ data: { classId, studentMembershipId: people.PupilA!.membershipId, schoolId: schoolA, status: "ACTIVE" } });

  // A class post by the office, and a school post by the pupil that goes to every school.
  classPostId = (await createPost(as("AdminA"), { scope: "CLASS", classId, title: `ZZ CR class post ${STAMP}`, body: "Bring your atlas", tags: [], media: [] })).postId;
  globalPostId = (await createPost(as("PupilA"), { scope: "SCHOOL", title: `ZZ CR shared post ${STAMP}`, body: "Our science fair", tags: [], media: [] })).postId;
  await moderatePost(as("AdminA"), globalPostId, "APPROVE");
  await publishGlobally(as("AdminA"), globalPostId);
});

afterAll(async () => {
  await db.rateLimit.deleteMany({ where: { bucket: { in: userIds.map((id) => `comment:${id}`) } } });
  await db.school.deleteMany({ where: { id: { in: [schoolA, schoolB] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("a pupil's comment on a class post", () => {
  let commentId = "";

  it("waits in the queue of the office and of the class's teacher, and of nobody else", async () => {
    expect((await addComment(as("PupilA"), classPostId, "Which atlas?")).status).toBe("PENDING");
    commentId = await newest(classPostId, "PupilA");

    // Held: the post's author, office staff who may decide it, is told once with the review page; the class's
    // other teacher is not (the author came first); the pupil is told once that it waits for a teacher.
    const held = await db.notification.findMany({ where: { userId: people.AdminA!.userId, titleKey: "notifTitle.commentHeld" } });
    expect(held).toHaveLength(1);
    expect(held[0]).toMatchObject({ schoolId: schoolA, kind: "POST", url: "/bulletin?filter=pending", body: `ZZ PupilA commented on "ZZ CR class post ${STAMP}". It stays hidden until a teacher or the office approves it.` });
    expect(JSON.parse(held[0]!.meta)).toEqual({ event: "comment.held", postId: classPostId });
    expect(await told("TeacherA", "notifTitle.commentHeld")).toBe(0);
    const waiting = await db.notification.findMany({ where: { userId: people.PupilA!.userId, titleKey: "notifTitle.commentWaiting" } });
    expect(waiting).toHaveLength(1);
    expect(waiting[0]).toMatchObject({ url: `/bulletin/${classPostId}`, body: `A teacher or the office will read your comment on "ZZ CR class post ${STAMP}" before it is shown. You will be told when it is.` });

    const office = await heldComments(as("AdminA"));
    expect(office.map((c) => c.id)).toEqual([commentId]);
    expect(office[0]).toMatchObject({ postId: classPostId, shared: false, reply: false, body: "Which atlas?", authorName: "ZZ PupilA" });
    expect(await heldCommentCount(as("AdminA"))).toBe(1);
    expect((await heldComments(as("TeacherA"))).map((c) => c.id)).toEqual([commentId]);

    // A teacher of another class, another school's office, and the pupil: nothing.
    expect(await heldComments(as("OtherTeacherA"))).toEqual([]);
    expect(await heldCommentCount(as("OtherTeacherA"))).toBe(0);
    expect(await heldComments(as("AdminB"))).toEqual([]);
    expect(await heldCommentCount(as("PupilA"))).toBe(0);
  });

  it("the post says which held comments its reader may decide", async () => {
    expect([...(await getPost(as("AdminA"), classPostId)).reviewableCommentIds]).toEqual([commentId]);
    expect([...(await getPost(as("TeacherA"), classPostId)).reviewableCommentIds]).toEqual([commentId]);
    expect([...(await getPost(as("PupilA"), classPostId)).reviewableCommentIds]).toEqual([]);
  });

  it("is refused to everybody who may not decide it, and stays held", async () => {
    await expect(moderateComment(as("PupilA"), commentId, "APPROVE")).rejects.toMatchObject({ key: "access.youCannotReviewComments" });
    await expect(moderateComment(as("OtherTeacherA"), commentId, "APPROVE")).rejects.toMatchObject({ key: "access.thatContentNoLongerExists", code: "NOT_FOUND" });
    await expect(moderateComment(as("AdminB"), commentId, "APPROVE")).rejects.toMatchObject({ key: "access.thatContentNoLongerExists", code: "NOT_FOUND" });
    await expect(moderateComment(as("TeacherB"), commentId, "REMOVE", "no")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(moderateComment(as("AdminA"), "clzznope00000000000000000", "APPROVE")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await statusOf(commentId)).toBe("PENDING");
  });

  it("approved by the class's teacher: public, the pupil and the post's author are told, and it is decided once", async () => {
    const live = await told("PupilA", "bulletin.notifCommentLive");
    const comment = await told("AdminA", "bulletin.notifNewComment");
    await moderateComment(as("TeacherA"), commentId, "APPROVE");
    expect(await statusOf(commentId)).toBe("APPROVED");
    expect(await told("PupilA", "bulletin.notifCommentLive")).toBe(live + 1);
    expect(await told("AdminA", "bulletin.notifNewComment")).toBe(comment + 1);
    expect(await heldCommentCount(as("AdminA"))).toBe(0);

    await expect(moderateComment(as("AdminA"), commentId, "REMOVE", "too late")).rejects.toMatchObject({ key: "access.thatCommentHasAlreadyBeenReviewed" });
    expect(await statusOf(commentId)).toBe("APPROVED");

    const row = await db.auditLog.findFirstOrThrow({ where: { action: "comment.approve", targetId: commentId } });
    expect(row).toMatchObject({ schoolId: schoolA, actorUserId: people.TeacherA!.userId, targetType: "Comment" });
  });

  it("removed only with a reason, which the author is told and the log does not keep", async () => {
    await addComment(as("PupilA"), classPostId, "ZZ silly words");
    const id = await newest(classPostId, "PupilA");
    // A second held comment on the same post: the reviewer hears again, the pupil is not told twice.
    expect(await told("AdminA", "notifTitle.commentHeld")).toBe(2);
    expect(await told("PupilA", "notifTitle.commentWaiting")).toBe(1);
    await expect(moderateComment(as("AdminA"), id, "REMOVE")).rejects.toMatchObject({ key: "access.writeANoteSoTheAuthorKnows" });
    await expect(moderateComment(as("AdminA"), id, "REMOVE", "   ")).rejects.toMatchObject({ key: "access.writeANoteSoTheAuthorKnows" });
    expect(await statusOf(id)).toBe("PENDING");

    await moderateComment(as("AdminA"), id, "REMOVE", "Please keep it about the lesson");
    expect(await statusOf(id)).toBe("REMOVED");
    const note = await db.notification.findFirstOrThrow({ where: { userId: people.PupilA!.userId, titleKey: "notifTitle.commentRemoved" }, orderBy: { createdAt: "desc" } });
    expect(note.body).toBe("Please keep it about the lesson");
    const row = await db.auditLog.findFirstOrThrow({ where: { action: "comment.remove", targetId: id } });
    expect(JSON.stringify(row.meta)).not.toContain("lesson");
    // Removed, it is out of the queue and off the page for everybody: the office that removed it and the pupil who wrote it too.
    expect(await heldCommentCount(as("AdminA"))).toBe(0);
    expect((await getPost(as("AdminA"), classPostId)).comments.map((c) => c.id)).not.toContain(id);
    expect((await getPost(as("PupilA"), classPostId)).comments.map((c) => c.id)).not.toContain(id);
  });
});

describe("comments on the cross-school feed", () => {
  it("each is held at its author's school: that school's admin decides it, its teachers and the publishing school do not", async () => {
    await addComment(as("TeacherB"), globalPostId, "Lovely work");
    const id = await newest(globalPostId, "TeacherB");
    // Held at B: the post's author (a pupil of A) cannot decide it and there is no class, so B's office is told; A hears nothing.
    expect(await told("AdminB", "notifTitle.commentHeld")).toBe(1);
    expect(await told("AdminA", "notifTitle.commentHeld")).toBe(2);
    expect(await told("TeacherB", "notifTitle.commentWaiting")).toBe(1);
    expect((await heldComments(as("AdminB"))).map((c) => c.id)).toEqual([id]);
    expect((await heldComments(as("AdminB")))[0]).toMatchObject({ shared: true, postTitle: `ZZ CR shared post ${STAMP}` });
    expect(await heldComments(as("AdminA"))).toEqual([]);
    expect(await heldComments(as("TeacherB"))).toEqual([]);

    await expect(moderateComment(as("AdminA"), id, "APPROVE")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(moderateComment(as("TeacherB"), id, "APPROVE")).rejects.toMatchObject({ key: "access.onlyAnAdminCanReviewThisComment" });
    expect(await statusOf(id)).toBe("PENDING");

    // Before: the publishing school does not see it. After: everybody who can read the post does.
    expect((await getPost(as("AdminA"), globalPostId)).comments.map((c) => c.id)).not.toContain(id);
    const live = await told("TeacherB", "bulletin.notifCommentLive");
    await moderateComment(as("AdminB"), id, "APPROVE");
    expect(await statusOf(id)).toBe("APPROVED");
    expect(await told("TeacherB", "bulletin.notifCommentLive")).toBe(live + 1);
    expect((await getPost(as("AdminA"), globalPostId)).comments.map((c) => c.id)).toContain(id);
    expect((await getPost(as("PupilA"), globalPostId)).comments.map((c) => c.id)).toContain(id);
  });

  it("a stranger's reply to a child, approved, still tells the child nothing", async () => {
    await addComment(as("PupilA"), globalPostId, "I made the volcano");
    const parent = await newest(globalPostId, "PupilA");
    await moderateComment(as("AdminA"), parent, "APPROVE");

    await addComment(as("TeacherB"), globalPostId, "Tell us how you built it", parent);
    const reply = await newest(globalPostId, "TeacherB");
    const before = await db.notification.count({ where: { userId: people.PupilA!.userId } });
    await moderateComment(as("AdminB"), reply, "APPROVE");
    expect(await statusOf(reply)).toBe("APPROVED");
    expect(await db.notification.count({ where: { userId: people.PupilA!.userId } })).toBe(before);
  });

  it("an admin's own comment there is held like anybody's, and is theirs to release", async () => {
    expect((await addComment(as("AdminB"), globalPostId, "Well done, all")).status).toBe("PENDING");
    const id = await newest(globalPostId, "AdminB");
    const before = await told("AdminB", "bulletin.notifCommentLive");
    await moderateComment(as("AdminB"), id, "APPROVE");
    expect(await statusOf(id)).toBe("APPROVED");
    // Nobody is told their own decision.
    expect(await told("AdminB", "bulletin.notifCommentLive")).toBe(before);
  });
});
