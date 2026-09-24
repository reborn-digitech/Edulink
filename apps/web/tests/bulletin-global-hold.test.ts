/**
 * The global feed's safeguarding rules, stated by their tests:
 *
 *   * EVERY comment on a GLOBAL post is held — a pupil's, a teacher's from
 *     another school — and it files with the COMMENTER'S school for review.
 *   * A reply from another school never notifies a minor.
 *   * A pupil appears on the global feed by first name only.
 *   * Reports: ten an hour per person, one row per reporter and target per
 *     day, and a report of nothing is refused.
 *   * Comments: sixty an hour per person.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { addComment, createPost, getPost, moderatePost, reportContent, COMMENTS_PER_HOUR, REPORTS_PER_HOUR } from "@/lib/bulletin";
import { firstNameOf, listGlobalFeed, publishGlobally } from "@/lib/global-feed";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolA = "";
let schoolB = "";
let pupilUserId = "";
let pupilMembershipId = "";
let adminAUserId = "";
let adminAMembershipId = "";
let teacherBUserId = "";
let teacherBMembershipId = "";
let postId = "";
const userIds: string[] = [];

function ctx(over: { userId: string; membershipId?: string | null; schoolId?: string | null; role?: ActiveContext["role"]; isMinor?: boolean }): ActiveContext {
  return {
    sessionId: "t",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: over.isMinor ?? false, isSuperuser: false, isAppAdmin: false, prefs: {} as never },
  };
}
const pupil = () => ctx({ userId: pupilUserId, membershipId: pupilMembershipId, schoolId: schoolA, role: "STUDENT", isMinor: true });
const adminA = () => ctx({ userId: adminAUserId, membershipId: adminAMembershipId, schoolId: schoolA, role: "ADMIN" });
const teacherB = () => ctx({ userId: teacherBUserId, membershipId: teacherBMembershipId, schoolId: schoolB, role: "TEACHER" });

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolA = (await db.school.create({ data: { name: `ZZ Global Hold A ${STAMP}`, slug: `zz-gh-a-${STAMP}`, code: `ZGA${suffix}`, contactEmail: `zz-gh-a-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  schoolB = (await db.school.create({ data: { name: `ZZ Global Hold B ${STAMP}`, slug: `zz-gh-b-${STAMP}`, code: `ZGB${suffix}`, contactEmail: `zz-gh-b-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (name: string, extra: { isMinor?: boolean } = {}) => db.user.create({ data: { name, email: `zz-gh-${name.toLowerCase().replace(/\s+/g, "-")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [pupilUser, adminUser, teacherUser] = await Promise.all([mk("Aarav ZZSharma", { isMinor: true }), mk("ZZ Admin A"), mk("ZZ Teacher B")]);
  pupilUserId = pupilUser.id;
  adminAUserId = adminUser.id;
  teacherBUserId = teacherUser.id;
  userIds.push(pupilUserId, adminAUserId, teacherBUserId);
  pupilMembershipId = (await db.membership.create({ data: { userId: pupilUserId, schoolId: schoolA, role: "STUDENT", status: "ACTIVE", studentCode: `ZGH${STAMP}` }, select: { id: true } })).id;
  adminAMembershipId = (await db.membership.create({ data: { userId: adminAUserId, schoolId: schoolA, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  teacherBMembershipId = (await db.membership.create({ data: { userId: teacherBUserId, schoolId: schoolB, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;

  // A pupil's school post, approved by their own school and then published to every school.
  const created = await createPost(pupil(), { scope: "SCHOOL", title: `ZZ Global hold ${STAMP}`, body: "Our science fair", tags: [], media: [] });
  postId = created.postId;
  await moderatePost(adminA(), postId, "APPROVE");
  await publishGlobally(adminA(), postId);
});

afterAll(async () => {
  await db.rateLimit.deleteMany({ where: { bucket: { in: [...userIds.map((id) => `comment:${id}`), ...userIds.map((id) => `report:${id}`), `report-urgent:${schoolA}`, `report-urgent:${schoolB}`] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolA, schoolB] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("comments on a global post", () => {
  it("a pupil's comment is held for their own school; an adult's from another school is held for THEIR school", async () => {
    const mine = await addComment(pupil(), postId, "I made the volcano");
    expect(mine.status).toBe("PENDING");
    const theirs = await addComment(teacherB(), postId, "Lovely work");
    expect(theirs.status).toBe("PENDING");
    const rows = await db.comment.findMany({ where: { postId }, orderBy: { createdAt: "asc" }, select: { authorUserId: true, status: true, schoolId: true } });
    expect(rows).toEqual([
      { authorUserId: pupilUserId, status: "PENDING", schoolId: schoolA },
      { authorUserId: teacherBUserId, status: "PENDING", schoolId: schoolB },
    ]);
    // The publishing school's staff see their own pupil's held comment and not the other school's queue.
    const view = await getPost(adminA(), postId);
    expect(view.comments.map((c) => c.authorUserId)).toEqual([pupilUserId]);
  });

  it("a reply from another school to a minor is held and tells the child nothing", async () => {
    const parent = await db.comment.findFirstOrThrow({ where: { postId, authorUserId: pupilUserId }, select: { id: true } });
    const before = await db.notification.count({ where: { userId: pupilUserId } });
    const reply = await addComment(teacherB(), postId, "Tell us how you built it", parent.id);
    expect(reply.status).toBe("PENDING");
    expect(await db.notification.count({ where: { userId: pupilUserId } })).toBe(before);
    expect((await db.comment.findFirstOrThrow({ where: { postId, parentCommentId: parent.id } })).schoolId).toBe(schoolB);
  });

  it("sixty an hour per person, then a refusal that says when", async () => {
    // The two above count; fill the rest of the window.
    for (let i = 2; i < COMMENTS_PER_HOUR; i += 1) await db.rateLimit.update({ where: { bucket: `comment:${teacherBUserId}` }, data: { hits: { increment: 1 } } });
    await expect(addComment(teacherB(), postId, "one more")).rejects.toMatchObject({ key: "access.youArePostingALot", code: "FORBIDDEN" });
  });
});

describe("the global feed", () => {
  it("shows a pupil by first name only, and an adult in full", async () => {
    const feed = await listGlobalFeed(teacherB());
    const mine = feed.find((p) => p.id === postId);
    expect(mine?.authorName).toBe("Aarav");
    expect(firstNameOf("Aarav ZZSharma")).toBe("Aarav");
    expect(firstNameOf("Meera")).toBe("Meera");
  });
});

describe("reports", () => {
  it("a report of nothing is refused; the same report twice in a day is one row; the school's admins are told", async () => {
    await expect(reportContent(teacherB(), { targetType: "POST", targetId: "clzznope00000000000000000", reason: "SPAM" })).rejects.toBeInstanceOf(AccessError);
    const before = await db.notification.count({ where: { userId: adminAUserId, titleKey: "bulletin.notifReported" } });
    await reportContent(pupil(), { targetType: "POST", targetId: postId, reason: "SPAM" });
    await reportContent(pupil(), { targetType: "POST", targetId: postId, reason: "SPAM" });
    await reportContent(pupil(), { targetType: "POST", targetId: postId, reason: "BULLYING" });
    expect(await db.report.count({ where: { reporterUserId: pupilUserId, targetId: postId } })).toBe(1);
    expect(await db.notification.count({ where: { userId: adminAUserId, titleKey: "bulletin.notifReported" } })).toBe(before + 1);
    // A different target is a new report, told quietly inside the ten-minute window.
    const comment = await db.comment.findFirstOrThrow({ where: { postId, authorUserId: teacherBUserId }, select: { id: true } });
    await reportContent(pupil(), { targetType: "COMMENT", targetId: comment.id, reason: "OTHER" });
    expect(await db.report.count({ where: { reporterUserId: pupilUserId } })).toBe(2);
    expect(await db.notification.count({ where: { userId: adminAUserId, titleKey: "bulletin.notifReported" } })).toBe(before + 2);
  });

  it("the eleventh report in an hour is refused", async () => {
    const bucket = `report:${pupilUserId}`;
    const row = await db.rateLimit.findUniqueOrThrow({ where: { bucket } });
    await db.rateLimit.update({ where: { bucket }, data: { hits: REPORTS_PER_HOUR } });
    expect(row.hits).toBeGreaterThanOrEqual(3);
    await expect(reportContent(pupil(), { targetType: "USER", targetId: teacherBUserId, reason: "OTHER" })).rejects.toMatchObject({ key: "access.youAreReportingALot" });
    expect(await db.report.count({ where: { reporterUserId: pupilUserId, targetType: "USER" } })).toBe(0);
  });
});
