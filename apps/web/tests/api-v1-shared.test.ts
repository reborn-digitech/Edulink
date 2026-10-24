/**
 * The /api/v1/shared handlers — the pages every role reads, the expert's own,
 * and the upload — invoked directly with a primed session, the way
 * api-v1-routes.test.ts does: the happy path, 401 signed out, 403 for a role
 * the endpoint refuses, 404 for another school's id, 422 for a bad body.
 *
 * Everything here is ZZ-prefixed and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { openConversation } from "@/lib/conversations";
import { createPost } from "@/lib/bulletin";
import { deleteStoredFile } from "@/lib/storage";
import { GET as bulletinGet, POST as bulletinPost } from "@/app/api/v1/shared/bulletin/route";
import { GET as globalGet } from "@/app/api/v1/shared/bulletin/global/route";
import { GET as postGet } from "@/app/api/v1/shared/bulletin/[postId]/route";
import { POST as reactPost } from "@/app/api/v1/shared/bulletin/[postId]/react/route";
import { POST as commentPost } from "@/app/api/v1/shared/bulletin/[postId]/comments/route";
import { POST as reviewPost } from "@/app/api/v1/shared/bulletin/[postId]/review/route";
import { POST as hidePost } from "@/app/api/v1/shared/bulletin/[postId]/hide/route";
import { GET as heldGet } from "@/app/api/v1/shared/bulletin/comments/held/route";
import { POST as commentReviewPost } from "@/app/api/v1/shared/bulletin/comments/[commentId]/review/route";
import { bulletinFeedSchema, bulletinHeldCommentsSchema, bulletinPostDetailSchema } from "@edulink/contracts";
import { GET as inboxGet } from "@/app/api/v1/shared/inbox/route";
import { POST as conversationsPost } from "@/app/api/v1/shared/conversations/route";
import { GET as conversationGet } from "@/app/api/v1/shared/conversations/[conversationId]/route";
import { GET as threadGet } from "@/app/api/v1/shared/threads/[threadId]/route";
import { POST as threadReplyPost } from "@/app/api/v1/shared/threads/[threadId]/reply/route";
import { GET as peopleGet } from "@/app/api/v1/shared/people/route";
import { GET as notificationsGet } from "@/app/api/v1/shared/notifications/route";
import { POST as notificationReadPost } from "@/app/api/v1/shared/notifications/[notificationId]/read/route";
import { POST as readAllPost } from "@/app/api/v1/shared/notifications/read-all/route";
import { GET as competitionsGet } from "@/app/api/v1/shared/competitions/route";
import { GET as competitionGet } from "@/app/api/v1/shared/competitions/[competitionId]/route";
import { POST as enterPost } from "@/app/api/v1/shared/competitions/[competitionId]/enter/route";
import { POST as consentPost } from "@/app/api/v1/shared/competitions/entries/[entryId]/consent/route";
import { GET as enquiriesGet, POST as enquiriesPost } from "@/app/api/v1/shared/enquiries/route";
import { GET as enquiryGet } from "@/app/api/v1/shared/enquiries/[enquiryId]/route";
import { POST as enquiryReplyPost } from "@/app/api/v1/shared/enquiries/[enquiryId]/reply/route";
import { GET as mentoringGet } from "@/app/api/v1/shared/mentoring/route";
import { GET as mentorshipGet } from "@/app/api/v1/shared/mentoring/[threadId]/route";
import { POST as mentorMessagePost } from "@/app/api/v1/shared/mentoring/[threadId]/messages/route";
import { GET as archiveGet } from "@/app/api/v1/shared/archive/route";
import { GET as vacanciesGet } from "@/app/api/v1/shared/vacancies/route";
import { GET as bookingsGet } from "@/app/api/v1/shared/expert/bookings/route";
import { GET as availabilityGet, POST as availabilityPost } from "@/app/api/v1/shared/expert/availability/route";
import { DELETE as slotDelete } from "@/app/api/v1/shared/expert/availability/[slotId]/route";
import { GET as profileGet, POST as profilePost } from "@/app/api/v1/shared/expert/profile/route";
import { POST as uploadsPost } from "@/app/api/v1/uploads/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);

let schoolId = "";
let otherSchoolId = "";
let adminUserId = "";
let teacherUserId = "";
let pupilUserId = "";
let parentUserId = "";
let expertUserId = "";
let pendingExpertUserId = "";
let otherAdminUserId = "";
let otherTeacherUserId = "";
let pupilMembershipId = "";
let approvedPostId = "";
let pendingPostId = "";
let otherPostId = "";
let threadId = "";
let otherThreadId = "";
let conversationId = "";
let otherConversationId = "";
let notificationIds: string[] = [];
let otherNotificationId = "";
let platformCompetitionId = "";
let otherSchoolCompetitionId = "";
let draftCompetitionId = "";
let mentorThreadId = "";
let otherMentorThreadId = "";
let yearId = "";
let otherYearId = "";
const storedFiles: string[] = [];

const json = (path: string, body: unknown, method = "POST") =>
  new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const get = (path: string) => new Request(`http://localhost${path}`);
const del = (path: string) => new Request(`http://localhost${path}`, { method: "DELETE" });
const p = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });

async function as(userId: string, opts: { schoolId?: string | null; role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT" | "PARENT" | "EXPERT" }) {
  __resetCookies();
  await createSession(userId, opts);
}
const asAdmin = () => as(adminUserId, { schoolId, role: "ADMIN" });
const asTeacher = () => as(teacherUserId, { schoolId, role: "TEACHER" });
const asPupil = () => as(pupilUserId, { schoolId, role: "STUDENT" });
const asParent = () => as(parentUserId, { role: "PARENT" });
const asExpert = () => as(expertUserId, { role: "EXPERT" });
const asOtherAdmin = () => as(otherAdminUserId, { schoolId: otherSchoolId, role: "ADMIN" });

beforeAll(async () => {
  const [a, b] = await Promise.all([
    db.school.create({
      data: { name: `ZZ Shared School ${STAMP}`, slug: `zz-shared-${STAMP}`, code: `ZS${tail}`, contactEmail: `zz-shared-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
      select: { id: true },
    }),
    db.school.create({
      data: {
        name: `ZZ Shared Other ${STAMP}`,
        slug: `zz-shared-o-${STAMP}`,
        code: `ZT${tail}`,
        contactEmail: `zz-shared-o-${STAMP}@test.invalid`,
        timezone: "Asia/Kolkata",
        // Published, so a guardian may ask it about admission.
        profilePublishedAt: new Date(),
      },
      select: { id: true },
    }),
  ]);
  schoolId = a.id;
  otherSchoolId = b.id;

  const mk = (tag: string) => db.user.create({ data: { name: `ZZ Shared ${tag}`, email: `zz-shared-${tag}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, teacher, pupil, parent, expert, pendingExpert, otherAdmin, otherTeacher, otherPupil] = await Promise.all([
    mk("admin"), mk("teacher"), mk("pupil"), mk("parent"), mk("expert"), mk("pending-expert"), mk("other-admin"), mk("other-teacher"), mk("other-pupil"),
  ]);
  adminUserId = admin.id;
  teacherUserId = teacher.id;
  pupilUserId = pupil.id;
  parentUserId = parent.id;
  expertUserId = expert.id;
  pendingExpertUserId = pendingExpert.id;
  otherAdminUserId = otherAdmin.id;
  otherTeacherUserId = otherTeacher.id;

  const [am, tm, pm, oam, otm, opm] = await Promise.all([
    db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }),
    // Joined before the closed year ended, so the archive has a year for them.
    db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSP${STAMP}`, joinedAt: new Date("2024-06-01T00:00:00Z") }, select: { id: true } }),
    db.membership.create({ data: { userId: otherAdmin.id, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: otherTeacher.id, schoolId: otherSchoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: otherPupil.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSQ${STAMP}` }, select: { id: true } }),
  ]);
  pupilMembershipId = pm.id;
  void am;

  const klass = await db.class.create({ data: { schoolId, name: "ZZ Shared Class 5", gradeLevel: "5", joinCode: `ZS${tail}` }, select: { id: true } });
  await db.classTeacher.create({ data: { classId: klass.id, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId: klass.id, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });

  const profile = await db.expertProfile.create({
    data: { userId: expert.id, headline: "ZZ Bridges", bio: "Ask me about bridges.", offering: "BOTH", publishedAt: new Date() },
    select: { id: true },
  });
  await db.expertProfile.create({ data: { userId: pendingExpert.id, headline: "ZZ Not yet", publishedAt: null } });

  // Posts, through the lib so the rules that shape them (a pupil's is PENDING) hold.
  await asAdmin();
  approvedPostId = (await createPost((await getSession())!, { scope: "SCHOOL", title: "ZZ Sports day", body: "Bring a hat.", tags: ["zzshared"], media: [], requiresAck: true })).postId;
  await asPupil();
  pendingPostId = (await createPost((await getSession())!, { scope: "SCHOOL", title: "ZZ My drawing", body: "", tags: [], media: [] })).postId;
  await asOtherAdmin();
  otherPostId = (await createPost((await getSession())!, { scope: "SCHOOL", title: "ZZ Elsewhere", body: "", tags: [], media: [] })).postId;

  // Remark threads, one per school.
  const [ta, tb] = await Promise.all([
    db.remarkThread.create({
      data: { schoolId, studentMembershipId: pm.id, teacherMembershipId: tm.id, subject: "ZZ Reading", messages: { create: { schoolId, authorUserId: teacher.id, body: "Reading well this week.", readBy: JSON.stringify([teacher.id]) } } },
      select: { id: true },
    }),
    db.remarkThread.create({
      data: { schoolId: otherSchoolId, studentMembershipId: opm.id, teacherMembershipId: otm.id, subject: "ZZ Elsewhere", messages: { create: { schoolId: otherSchoolId, authorUserId: otherTeacher.id, body: "Not yours." } } },
      select: { id: true },
    }),
  ]);
  threadId = ta.id;
  otherThreadId = tb.id;

  await asTeacher();
  ({ conversationId } = await openConversation((await getSession())!, schoolId, admin.id));
  await asOtherAdmin();
  ({ conversationId: otherConversationId } = await openConversation((await getSession())!, otherSchoolId, otherTeacher.id));

  const [n1, n2, n3] = await Promise.all([
    db.notification.create({ data: { userId: teacher.id, schoolId, kind: "SYSTEM", title: "ZZ older", createdAt: new Date(STAMP - 60_000) }, select: { id: true } }),
    db.notification.create({ data: { userId: teacher.id, schoolId, kind: "REMARK", title: "ZZ newer", readAt: new Date() }, select: { id: true } }),
    db.notification.create({ data: { userId: otherAdmin.id, schoolId: otherSchoolId, kind: "SYSTEM", title: "ZZ theirs" }, select: { id: true } }),
  ]);
  notificationIds = [n2.id, n1.id];
  otherNotificationId = n3.id;

  const soon = new Date(Date.now() + 7 * 86_400_000);
  const [c1, c2, c3] = await Promise.all([
    db.competition.create({ data: { title: `ZZ Maths Cup ${STAMP}`, summary: "Sums.", organizerName: "ZZ Trust", status: "PUBLISHED", registrationClosesAt: soon, requiresParentConsent: true }, select: { id: true } }),
    db.competition.create({ data: { title: `ZZ Other's Cup ${STAMP}`, summary: "Theirs.", organizerName: "ZZ Other", organizerSchoolId: otherSchoolId, status: "PUBLISHED", registrationClosesAt: soon }, select: { id: true } }),
    db.competition.create({ data: { title: `ZZ Draft Cup ${STAMP}`, summary: "Not yet.", organizerName: "ZZ Trust", status: "DRAFT" }, select: { id: true } }),
  ]);
  platformCompetitionId = c1.id;
  otherSchoolCompetitionId = c2.id;
  draftCompetitionId = c3.id;

  const [m1, m2] = await Promise.all([
    db.mentorThread.create({
      data: { schoolId, expertProfileId: profile.id, expertUserId: expert.id, studentMembershipId: pm.id, purpose: "ZZ Bridges", status: "ACTIVE", parentConsentAt: new Date(), parentConsentUserId: parent.id },
      select: { id: true },
    }),
    db.mentorThread.create({
      data: { schoolId: otherSchoolId, expertProfileId: profile.id, expertUserId: expert.id, studentMembershipId: opm.id, purpose: "ZZ Elsewhere", status: "ACTIVE", parentConsentAt: new Date() },
      select: { id: true },
    }),
  ]);
  mentorThreadId = m1.id;
  otherMentorThreadId = m2.id;

  const [y1, y2] = await Promise.all([
    db.academicYear.create({ data: { schoolId, name: `ZZ 2024–25 ${tail}`, startDate: new Date("2024-06-01T00:00:00Z"), endDate: new Date("2025-04-30T00:00:00Z"), closedAt: new Date("2025-05-01T00:00:00Z") }, select: { id: true } }),
    db.academicYear.create({ data: { schoolId: otherSchoolId, name: `ZZ 2024–25 ${tail}`, startDate: new Date("2024-06-01T00:00:00Z"), endDate: new Date("2025-04-30T00:00:00Z"), closedAt: new Date("2025-05-01T00:00:00Z") }, select: { id: true } }),
  ]);
  yearId = y1.id;
  otherYearId = y2.id;

  await db.jobPosting.create({ data: { schoolId: otherSchoolId, title: `ZZ Physics teacher ${STAMP}`, body: "Come and teach.", subjects: JSON.stringify(["Physics"]), hiringContactMembershipId: oam.id, postedByMembershipId: oam.id } });

  __resetCookies();
});

afterAll(async () => {
  __resetCookies();
  await Promise.all(storedFiles.map((id) => deleteStoredFile(id)));
  const userIds = [adminUserId, teacherUserId, pupilUserId, parentUserId, expertUserId, pendingExpertUserId, otherAdminUserId, otherTeacherUserId];
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.competition.deleteMany({ where: { id: { in: [platformCompetitionId, otherSchoolCompetitionId, draftCompetitionId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("every handler answers 401 in the contract's envelope", async () => {
    __resetCookies();
    const calls: Promise<Response>[] = [
      bulletinGet(get("/api/v1/shared/bulletin")),
      bulletinPost(json("/api/v1/shared/bulletin", {})),
      globalGet(get("/api/v1/shared/bulletin/global")),
      postGet(get("/x"), p({ postId: approvedPostId })),
      reactPost(json("/x", { kind: "CLAP" }), p({ postId: approvedPostId })),
      heldGet(),
      commentReviewPost(json("/x", { decision: "APPROVE" }), p({ commentId: "nope" })),
      inboxGet(get("/api/v1/shared/inbox")),
      conversationsPost(json("/x", {})),
      peopleGet(get("/api/v1/shared/people")),
      notificationsGet(get("/api/v1/shared/notifications")),
      readAllPost(),
      competitionsGet(get("/api/v1/shared/competitions")),
      enquiriesGet(),
      mentoringGet(get("/api/v1/shared/mentoring")),
      archiveGet(get("/api/v1/shared/archive")),
      vacanciesGet(),
      bookingsGet(),
      availabilityGet(),
      profileGet(),
      uploadsPost(new Request("http://localhost/api/v1/uploads", { method: "POST" })),
    ];
    for (const res of await Promise.all(calls)) {
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });
});

describe("bulletin", () => {
  it("the feed shows this school's approved posts, cursor paged, never another school's", async () => {
    await asTeacher();
    const res = await bulletinGet(get("/api/v1/shared/bulletin"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { schoolId: string; schoolName: string; items: { id: string; status: string }[]; nextCursor: string | null; pendingCount: number };
    expect(body.schoolId).toBe(schoolId);
    expect(body.schoolName).toContain("ZZ Shared School");
    expect(body.items.map((i) => i.id)).toContain(approvedPostId);
    expect(body.items.map((i) => i.id)).not.toContain(otherPostId);
    expect(body.items.map((i) => i.id)).not.toContain(pendingPostId);
    expect(body.nextCursor).toBeNull();

    // Paging: one at a time walks the same list without repeats.
    const first = (await (await bulletinGet(get("/api/v1/shared/bulletin?limit=1"))).json()) as { items: { id: string }[]; nextCursor: string | null };
    expect(first.items).toHaveLength(1);
    if (first.nextCursor) {
      const second = (await (await bulletinGet(get(`/api/v1/shared/bulletin?limit=1&cursor=${first.nextCursor}`))).json()) as { items: { id: string }[] };
      expect(second.items[0]?.id).not.toBe(first.items[0]!.id);
    }
    const bad = await bulletinGet(get("/api/v1/shared/bulletin?limit=0"));
    expect(bad.status).toBe(422);
  });

  it("staff see the pending queue; a guardian reads through the child's school", async () => {
    await asAdmin();
    const pending = (await (await bulletinGet(get("/api/v1/shared/bulletin?filter=pending"))).json()) as { items: { id: string }[]; pendingCount: number; filter: string };
    expect(pending.filter).toBe("pending");
    expect(pending.pendingCount).toBeGreaterThanOrEqual(1);
    expect(pending.items.map((i) => i.id)).toContain(pendingPostId);

    await asParent();
    const res = await bulletinGet(get("/api/v1/shared/bulletin"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { schoolId: string; schools: { id: string }[]; items: { id: string }[] };
    expect(body.schoolId).toBe(schoolId);
    expect(body.schools.map((s) => s.id)).toEqual([schoolId]);
    expect(body.items.map((i) => i.id)).toContain(approvedPostId);
  });

  it("the global feed opens for school roles and guardians, not for an expert", async () => {
    await asTeacher();
    const res = await globalGet(get("/api/v1/shared/bulletin/global?limit=5"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ items: expect.any(Array) });
    await asParent();
    expect((await globalGet(get("/api/v1/shared/bulletin/global"))).status).toBe(200);
    await asExpert();
    expect((await globalGet(get("/api/v1/shared/bulletin/global"))).status).toBe(403);
  });

  it("one post reads with its comments; another school's, or a pending one you may not see, is a 404", async () => {
    await asTeacher();
    const res = await postGet(get("/x"), p({ postId: approvedPostId }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; title: string; comments: unknown[]; canAck: boolean; author: { role: string } };
    expect(body.id).toBe(approvedPostId);
    expect(body.canAck).toBe(true);
    expect(body.author.role).toBe("ADMIN");
    expect((await postGet(get("/x"), p({ postId: otherPostId }))).status).toBe(404);
    await asParent();
    expect((await postGet(get("/x"), p({ postId: pendingPostId }))).status).toBe(404);
    await asPupil();
    expect((await postGet(get("/x"), p({ postId: pendingPostId }))).status).toBe(200);
  });

  it("composing: a teacher's post is published, a bad body is 422, a guardian is refused", async () => {
    await asTeacher();
    const res = await bulletinPost(json("/api/v1/shared/bulletin", { scope: "SCHOOL", title: "ZZ Via the API", body: "Hello", tags: ["api"] }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ postId: expect.any(String), status: "APPROVED" });
    const bad = await bulletinPost(json("/api/v1/shared/bulletin", { scope: "SCHOOL", title: "x" }));
    expect(bad.status).toBe(422);
    expect(await bad.json()).toMatchObject({ code: "BAD_REQUEST", issues: { title: expect.any(String) } });
    await asParent();
    expect((await bulletinPost(json("/api/v1/shared/bulletin", { scope: "SCHOOL", title: "ZZ Not allowed" }))).status).toBe(403);
  });

  it("reactions toggle; comments from a pupil are held and from staff are not", async () => {
    await asTeacher();
    const on = await reactPost(json("/x", { kind: "CLAP" }), p({ postId: approvedPostId }));
    expect(on.status).toBe(200);
    expect(await on.json()).toEqual({ added: true });
    const off = await reactPost(json("/x", { kind: "CLAP" }), p({ postId: approvedPostId }));
    expect(await off.json()).toEqual({ added: false });
    expect((await reactPost(json("/x", { kind: "BOO" }), p({ postId: approvedPostId }))).status).toBe(422);
    expect((await reactPost(json("/x", { kind: "CLAP" }), p({ postId: otherPostId }))).status).toBe(404);

    const staff = await commentPost(json("/x", { body: "Well done." }), p({ postId: approvedPostId }));
    expect(staff.status).toBe(201);
    expect(await staff.json()).toEqual({ held: false });
    expect((await commentPost(json("/x", { body: "   " }), p({ postId: approvedPostId }))).status).toBe(422);
    expect((await commentPost(json("/x", { body: "Hi" }), p({ postId: otherPostId }))).status).toBe(404);
    await asPupil();
    const held = await commentPost(json("/x", { body: "Can I come?" }), p({ postId: approvedPostId }));
    expect(await held.json()).toEqual({ held: true });
  });

  it("review is staff's, a school post is the admin's, and a decided post stays decided", async () => {
    await asPupil();
    expect((await reviewPost(json("/x", { decision: "APPROVE" }), p({ postId: pendingPostId }))).status).toBe(403);
    await asTeacher();
    // A teacher may only decide CLASS posts of their classes.
    expect((await reviewPost(json("/x", { decision: "APPROVE" }), p({ postId: pendingPostId }))).status).toBe(403);
    await asAdmin();
    expect((await reviewPost(json("/x", { decision: "MAYBE" }), p({ postId: pendingPostId }))).status).toBe(422);
    expect((await reviewPost(json("/x", { decision: "APPROVE" }), p({ postId: otherPostId }))).status).toBe(404);
    const ok = await reviewPost(json("/x", { decision: "APPROVE" }), p({ postId: pendingPostId }));
    expect(ok.status).toBe(200);
    expect((await reviewPost(json("/x", { decision: "REJECT", reason: "twice" }), p({ postId: pendingPostId }))).status).toBe(403);
    expect((await db.post.findUnique({ where: { id: pendingPostId }, select: { status: true } }))?.status).toBe("APPROVED");
  });

  it("a held comment: in the office's queue and on the post with its buttons, refused to a pupil and to a teacher of no such class, approved once by the admin", async () => {
    const held = await db.comment.findFirstOrThrow({ where: { postId: approvedPostId, authorUserId: pupilUserId, status: "PENDING" }, select: { id: true } });
    const review = (body: unknown, commentId = held.id) => commentReviewPost(json("/x", body), p({ commentId }));

    await asPupil();
    expect((await heldGet()).status).toBe(403);
    expect((await review({ decision: "APPROVE" })).status).toBe(403);
    // The pupil sees their own held comment, with no buttons.
    const own = bulletinPostDetailSchema.parse(await (await postGet(get("/x"), p({ postId: approvedPostId }))).json());
    expect(own.comments.find((c) => c.id === held.id)).toMatchObject({ status: "PENDING", mine: true, canReview: false });

    await asTeacher();
    // A school-wide post's comments are the office's: the teacher's queue is empty and the press is refused.
    expect(bulletinHeldCommentsSchema.parse(await (await heldGet()).json()).items).toEqual([]);
    expect((await review({ decision: "APPROVE" })).status).toBe(403);
    expect(bulletinFeedSchema.parse(await (await bulletinGet(get("/api/v1/shared/bulletin"))).json()).heldCommentCount).toBe(0);

    await asAdmin();
    const queue = bulletinHeldCommentsSchema.parse(await (await heldGet()).json());
    expect(queue.items.map((c) => c.id)).toContain(held.id);
    expect(queue.items.find((c) => c.id === held.id)).toMatchObject({ postId: approvedPostId, body: "Can I come?", shared: false, reply: false });
    expect(bulletinFeedSchema.parse(await (await bulletinGet(get("/api/v1/shared/bulletin"))).json()).heldCommentCount).toBe(queue.items.length);
    const seen = bulletinPostDetailSchema.parse(await (await postGet(get("/x"), p({ postId: approvedPostId }))).json());
    expect(seen.comments.find((c) => c.id === held.id)).toMatchObject({ status: "PENDING", canReview: true });

    expect((await review({ decision: "MAYBE" })).status).toBe(422);
    expect((await review({})).status).toBe(422);
    const noReason = await review({ decision: "REMOVE" });
    expect(noReason.status).toBe(403);
    expect(await noReason.json()).toMatchObject({ error: "Write a note so the author knows what happened." });
    expect((await review({ decision: "APPROVE" }, "clzznope00000000000000000")).status).toBe(404);

    const ok = await review({ decision: "APPROVE" });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true });
    expect((await db.comment.findUniqueOrThrow({ where: { id: held.id }, select: { status: true } })).status).toBe("APPROVED");
    const twice = await review({ decision: "REMOVE", reason: "too late" });
    expect(twice.status).toBe(403);
    expect(await twice.json()).toMatchObject({ error: "That comment has already been reviewed" });

    // Another school's office cannot reach it, held or not.
    await db.comment.update({ where: { id: held.id }, data: { status: "PENDING" } });
    await asOtherAdmin();
    expect((await review({ decision: "APPROVE" })).status).toBe(404);
    expect(bulletinHeldCommentsSchema.parse(await (await heldGet()).json()).items.map((c) => c.id)).not.toContain(held.id);
    await db.comment.update({ where: { id: held.id }, data: { status: "APPROVED" } });
  });

  it("hiding a global post is the admin's lever only", async () => {
    await asTeacher();
    expect((await hidePost(json("/x", { hidden: true }), p({ postId: approvedPostId }))).status).toBe(403);
    await asAdmin();
    expect((await hidePost(json("/x", { hidden: "yes" }), p({ postId: approvedPostId }))).status).toBe(422);
    // Not a global post: the lib refuses rather than hiding a school notice from its own school.
    expect([403, 404]).toContain((await hidePost(json("/x", { hidden: true }), p({ postId: approvedPostId }))).status);
  });
});

describe("inbox", () => {
  it("lists my conversations and threads, and opens each; another school's is a 404", async () => {
    await asTeacher();
    const res = await inboxGet(get("/api/v1/shared/inbox"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { conversations: { id: string }[]; threads: { id: string; subject: string }[]; unreadTotal: number };
    expect(body.conversations.map((c) => c.id)).toContain(conversationId);
    expect(body.threads.map((t) => t.id)).toContain(threadId);
    expect(body.conversations.map((c) => c.id)).not.toContain(otherConversationId);
    const filtered = (await (await inboxGet(get("/api/v1/shared/inbox?q=reading"))).json()) as { threads: { id: string }[] };
    expect(filtered.threads.map((t) => t.id)).toEqual([threadId]);

    const conv = await conversationGet(get("/x"), p({ conversationId }));
    expect(conv.status).toBe(200);
    expect(await conv.json()).toMatchObject({ id: conversationId, schoolId, others: [{ userId: adminUserId, role: "ADMIN" }] });
    expect((await conversationGet(get("/x"), p({ conversationId: otherConversationId }))).status).toBe(404);
    await asPupil();
    expect((await conversationGet(get("/x"), p({ conversationId }))).status).toBe(404);
  });

  it("a thread opens for the teacher and the guardian, marks itself read, and takes a reply", async () => {
    await asParent();
    const res = await threadGet(get("/x"), p({ threadId }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; subject: string; messages: { mine: boolean }[] };
    expect(body.subject).toBe("ZZ Reading");
    expect(body.messages).toHaveLength(1);
    const read = await db.remarkMessage.findFirst({ where: { threadId }, select: { readBy: true } });
    expect(JSON.parse(read!.readBy) as string[]).toContain(parentUserId);
    expect((await threadGet(get("/x"), p({ threadId: otherThreadId }))).status).toBe(404);

    const reply = await threadReplyPost(json("/x", { body: "Thank you, that is lovely to hear." }), p({ threadId }));
    expect(reply.status).toBe(201);
    expect(await reply.json()).toMatchObject({ messageId: expect.any(String) });
    expect((await threadReplyPost(json("/x", { body: "" }), p({ threadId }))).status).toBe(422);
    expect((await threadReplyPost(json("/x", { body: "Hi" }), p({ threadId: otherThreadId }))).status).toBe(404);
    await asOtherAdmin();
    expect((await threadGet(get("/x"), p({ threadId }))).status).toBe(404);
  });

  it("the people picker names who I may write to, and opening a room finds the one that exists", async () => {
    await asTeacher();
    const res = await peopleGet(get("/api/v1/shared/people?q=admin"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { schoolId: string; people: { userId: string; role: string }[] };
    expect(body.schoolId).toBe(schoolId);
    expect(body.people.map((x) => x.userId)).toContain(adminUserId);
    expect(body.people.map((x) => x.userId)).not.toContain(otherAdminUserId);

    const found = await conversationsPost(json("/x", { schoolId, userId: adminUserId }));
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual({ conversationId, created: false });
    expect((await conversationsPost(json("/x", { schoolId, userId: "nope" }))).status).toBe(422);
    expect((await conversationsPost(json("/x", { schoolId: otherSchoolId, userId: otherAdminUserId }))).status).toBe(404);
  });
});

describe("notifications", () => {
  it("lists mine newest first with paging and counts; read-all and read stay mine", async () => {
    await asTeacher();
    const res = await notificationsGet(get("/api/v1/shared/notifications"));
    expect(res.status).toBe(200);
    // The inbox tests above notified the teacher of the guardian's reply, so the list is read from the table rather than remembered.
    const expected = await db.notification.findMany({ where: { userId: teacherUserId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, readAt: true } });
    expect(expected.length).toBeGreaterThanOrEqual(2);
    const body = (await res.json()) as { items: { id: string; read: boolean }[]; unreadCount: number; totalCount: number; nextCursor: string | null };
    expect(body.items.map((i) => i.id)).toEqual(expected.map((e) => e.id));
    expect(body).toMatchObject({ unreadCount: expected.filter((e) => !e.readAt).length, totalCount: expected.length, nextCursor: null });

    const first = (await (await notificationsGet(get("/api/v1/shared/notifications?limit=1"))).json()) as { items: { id: string }[]; nextCursor: string | null };
    expect(first.items.map((i) => i.id)).toEqual([expected[0]!.id]);
    expect(first.nextCursor).toBe(expected[0]!.id);
    const second = (await (await notificationsGet(get(`/api/v1/shared/notifications?limit=1&cursor=${first.nextCursor}`))).json()) as { items: { id: string }[]; nextCursor: string | null };
    expect(second.items.map((i) => i.id)).toEqual([expected[1]!.id]);
    expect(second.nextCursor).toBe(expected.length > 2 ? expected[1]!.id : null);
    const unread = (await (await notificationsGet(get("/api/v1/shared/notifications?filter=unread&kind=SYSTEM"))).json()) as { items: { id: string }[] };
    expect(unread.items.map((i) => i.id)).toEqual([notificationIds[1]]);
    expect((await notificationsGet(get("/api/v1/shared/notifications?limit=500"))).status).toBe(422);

    const all = await readAllPost();
    expect(await all.json()).toEqual({ count: expected.filter((e) => !e.readAt).length });
    expect((await (await notificationsGet(get("/api/v1/shared/notifications"))).json()) as object).toMatchObject({ unreadCount: 0 });
    expect((await notificationReadPost(get("/x"), p({ notificationId: otherNotificationId }))).status).toBe(404);
    expect((await notificationReadPost(get("/x"), p({ notificationId: notificationIds[1]! }))).status).toBe(200);
    expect((await db.notification.findUnique({ where: { id: otherNotificationId }, select: { readAt: true } }))?.readAt).toBeNull();
  });
});

describe("competitions", () => {
  it("lists the platform's and this school's, and opens one; another school's own and a draft are 404", async () => {
    await asPupil();
    const res = await competitionsGet(get("/api/v1/shared/competitions"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { school: { id: string }[]; platform: { id: string }[]; waiting: unknown[] };
    expect(body.platform.map((c) => c.id)).toContain(platformCompetitionId);
    expect([...body.school, ...body.platform].map((c) => c.id)).not.toContain(otherSchoolCompetitionId);
    expect(body.waiting).toEqual([]);

    const one = await competitionGet(get("/x"), p({ competitionId: platformCompetitionId }));
    expect(one.status).toBe(200);
    expect(await one.json()).toMatchObject({ id: platformCompetitionId, open: true, entry: null, isOrganiser: false, board: [] });
    expect((await competitionGet(get("/x"), p({ competitionId: otherSchoolCompetitionId }))).status).toBe(404);
    expect((await competitionGet(get("/x"), p({ competitionId: draftCompetitionId }))).status).toBe(404);
  });

  it("a pupil enters once, and only a guardian consents", async () => {
    await asTeacher();
    expect((await enterPost(get("/x"), p({ competitionId: platformCompetitionId }))).status).toBe(403);
    await asPupil();
    expect((await enterPost(get("/x"), p({ competitionId: otherSchoolCompetitionId }))).status).toBe(404);
    const first = await enterPost(get("/x"), p({ competitionId: platformCompetitionId }));
    expect(first.status).toBe(200);
    const { entryId } = (await first.json()) as { entryId: string; awaitingConsent: boolean };
    expect(await (await enterPost(get("/x"), p({ competitionId: platformCompetitionId }))).json()).toEqual({ entryId, awaitingConsent: true });
    expect((await consentPost(get("/x"), p({ entryId }))).status).toBe(403);

    await asParent();
    const waiting = (await (await competitionsGet(get("/api/v1/shared/competitions"))).json()) as { waiting: { entryId: string }[] };
    expect(waiting.waiting.map((w) => w.entryId)).toEqual([entryId]);
    expect((await consentPost(get("/x"), p({ entryId: "c" + "z".repeat(24) }))).status).toBe(404);
    expect((await consentPost(get("/x"), p({ entryId }))).status).toBe(200);
    const after = (await (await competitionGet(get("/x"), p({ competitionId: platformCompetitionId }))).json()) as { entry: { awaitingConsent: boolean } | null; waiting: unknown[] };
    expect(after.entry?.awaitingConsent).toBe(false);
    expect(after.waiting).toEqual([]);
  });
});

describe("enquiries", () => {
  let enquiryId = "";

  it("a guardian asks a published school about admission; the door matches the knocker", async () => {
    await asTeacher();
    expect((await enquiriesPost(json("/x", { schoolId: otherSchoolId, kind: "ADMISSION", body: "Do you have a place?" }))).status).toBe(403);
    await asParent();
    expect((await enquiriesPost(json("/x", { schoolId: otherSchoolId, kind: "ADMISSION" }))).status).toBe(422);
    // Our own school has not published a profile: refused with a sentence, not a 500.
    const closed = await enquiriesPost(json("/x", { schoolId, kind: "ADMISSION", body: "Hello?" }));
    expect(closed.status).toBe(422);
    expect(await closed.json()).toMatchObject({ code: "BAD_REQUEST" });
    const res = await enquiriesPost(json("/x", { schoolId: otherSchoolId, kind: "ADMISSION", body: "Do you have a place for Class 5?" }));
    expect(res.status).toBe(201);
    ({ enquiryId } = (await res.json()) as { enquiryId: string });
    // The same open thread absorbs a second message rather than starting a twin.
    expect(await (await enquiriesPost(json("/x", { schoolId: otherSchoolId, kind: "ADMISSION", body: "One more thing." }))).json()).toEqual({ enquiryId });
  });

  it("each side sees its own desk; the thread is not found from anywhere else", async () => {
    await asParent();
    const sent = (await (await enquiriesGet()).json()) as { sent: { id: string }[]; inbox: unknown[] };
    expect(sent.sent.map((e) => e.id)).toEqual([enquiryId]);
    expect(sent.inbox).toEqual([]);
    await asOtherAdmin();
    const inbox = (await (await enquiriesGet()).json()) as { sent: unknown[]; inbox: { id: string; unread: boolean }[] };
    expect(inbox.inbox.map((e) => e.id)).toEqual([enquiryId]);
    const one = await enquiryGet(get("/x"), p({ enquiryId }));
    expect(one.status).toBe(200);
    expect(await one.json()).toMatchObject({ id: enquiryId, side: "school", status: "OPEN", messages: [expect.any(Object), expect.any(Object)] });
    await asTeacher();
    const desk = (await (await enquiriesGet()).json()) as { sent: unknown[]; inbox: unknown[] };
    expect(desk).toEqual({ sent: [], inbox: [] });
    expect((await enquiryGet(get("/x"), p({ enquiryId }))).status).toBe(404);
    expect((await enquiryReplyPost(json("/x", { body: "Not mine." }), p({ enquiryId }))).status).toBe(404);
  });

  it("the school replies, and the opener sees it", async () => {
    await asOtherAdmin();
    expect((await enquiryReplyPost(json("/x", { body: " " }), p({ enquiryId }))).status).toBe(422);
    const reply = await enquiryReplyPost(json("/x", { body: "Yes — come and see us." }), p({ enquiryId }));
    expect(reply.status).toBe(201);
    expect(await reply.json()).toEqual({ enquiryId });
    await asParent();
    const thread = (await (await enquiryGet(get("/x"), p({ enquiryId }))).json()) as { side: string; messages: { mine: boolean }[] };
    expect(thread.side).toBe("opener");
    expect(thread.messages.map((m) => m.mine)).toEqual([true, true, false]);
  });
});

describe("mentoring", () => {
  it("lists what each reader may see and opens a thread for the pupil's people", async () => {
    await asPupil();
    const res = await mentoringGet(get("/api/v1/shared/mentoring"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { threads: { id: string; status: string }[]; requests: unknown[] };
    expect(body.threads.map((t) => t.id)).toEqual([mentorThreadId]);
    expect(body.requests).toEqual([]);
    expect(((await (await mentoringGet(get("/api/v1/shared/mentoring?status=CLOSED"))).json()) as { threads: unknown[] }).threads).toEqual([]);

    await asParent();
    const one = await mentorshipGet(get("/x"), p({ threadId: mentorThreadId }));
    expect(one.status).toBe(200);
    expect(await one.json()).toMatchObject({ id: mentorThreadId, isGuardian: true, canPost: false, awaitingConsent: false });
    await asTeacher();
    expect(await (await mentorshipGet(get("/x"), p({ threadId: mentorThreadId }))).json()).toMatchObject({ isStaff: true });
    expect((await mentorshipGet(get("/x"), p({ threadId: otherMentorThreadId }))).status).toBe(404);
    await asOtherAdmin();
    expect((await mentorshipGet(get("/x"), p({ threadId: mentorThreadId }))).status).toBe(404);
  });

  it("only the mentor and the pupil write", async () => {
    await asExpert();
    const res = await mentorMessagePost(json("/x", { body: "Hello — what shall we build first?" }), p({ threadId: mentorThreadId }));
    expect(res.status).toBe(201);
    expect((await mentorMessagePost(json("/x", { body: "" }), p({ threadId: mentorThreadId }))).status).toBe(422);
    await asParent();
    expect((await mentorMessagePost(json("/x", { body: "Me too" }), p({ threadId: mentorThreadId }))).status).toBe(403);
    await asOtherAdmin();
    expect((await mentorMessagePost(json("/x", { body: "Hi" }), p({ threadId: mentorThreadId }))).status).toBe(404);
    expect(await db.mentorMessage.count({ where: { threadId: mentorThreadId } })).toBe(1);
  });
});

describe("the year archive and the vacancies board", () => {
  it("opens the closed year as each role sees it, and not another school's", async () => {
    await asAdmin();
    const admin = await archiveGet(get("/api/v1/shared/archive"));
    expect(admin.status).toBe(200);
    expect(await admin.json()).toMatchObject({ schoolId, years: [{ id: yearId }], selected: { year: { id: yearId }, school: expect.any(Object), pupil: null, teacher: null } });
    await asTeacher();
    expect(await (await archiveGet(get(`/api/v1/shared/archive?year=${yearId}`))).json()).toMatchObject({ selected: { teacher: { classes: expect.any(Array) }, school: null } });
    expect((await archiveGet(get(`/api/v1/shared/archive?year=${otherYearId}`))).status).toBe(404);
    await asPupil();
    expect(await (await archiveGet(get("/api/v1/shared/archive"))).json()).toMatchObject({ child: pupilMembershipId, selected: { pupil: { attendance: expect.any(Object) } } });
    await asParent();
    expect(await (await archiveGet(get("/api/v1/shared/archive"))).json()).toMatchObject({ child: pupilMembershipId, children: [{ studentMembershipId: pupilMembershipId }], selected: { pupil: expect.any(Object) } });
    await asExpert();
    expect((await archiveGet(get("/api/v1/shared/archive"))).status).toBe(403);
  });

  it("the board is staff's, and names every school's open vacancy", async () => {
    await asPupil();
    expect((await vacanciesGet()).status).toBe(403);
    await asTeacher();
    const res = await vacanciesGet();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: { title: string; schoolId: string; ours: boolean; subjects: string[] }[] };
    const ours = body.items.find((i) => i.title === `ZZ Physics teacher ${STAMP}`);
    expect(ours).toMatchObject({ schoolId: otherSchoolId, ours: false, subjects: ["Physics"] });
  });
});

describe("the expert's own pages", () => {
  it("bookings, availability and saving the profile are the published expert's alone; one under review reads their own standing (QA-53)", async () => {
    await asTeacher();
    for (const res of await Promise.all([bookingsGet(), availabilityGet(), profileGet()])) expect(res.status).toBe(403);
    await as(pendingExpertUserId, { role: "EXPERT" });
    for (const res of await Promise.all([bookingsGet(), availabilityGet()])) expect(res.status).toBe(403);
    const standing = await profileGet();
    expect(standing.status).toBe(200);
    expect(await standing.json()).toMatchObject({ profile: { published: false } });
    expect((await profilePost(json("/x", { headline: "ZZ Under review", bio: "", specialisms: [], timezone: "UTC", offering: "BOTH" }))).status).toBe(403);
    await asExpert();
    const bookings = await bookingsGet();
    expect(bookings.status).toBe(200);
    expect(await bookings.json()).toEqual({ bookings: [] });
  });

  it("offers a window, refuses the past and an overlap, and withdraws it", async () => {
    await asExpert();
    expect(await (await availabilityGet()).json()).toEqual({ slots: [] });
    const start = new Date(Date.now() + 2 * 86_400_000);
    const end = new Date(start.getTime() + 3_600_000);
    expect((await availabilityPost(json("/x", { startsAt: "tomorrow", endsAt: end.toISOString() }))).status).toBe(422);
    expect((await availabilityPost(json("/x", { startsAt: new Date(Date.now() - 86_400_000).toISOString(), endsAt: end.toISOString() }))).status).toBe(403);
    const res = await availabilityPost(json("/x", { startsAt: start.toISOString(), endsAt: end.toISOString(), note: "ZZ after school" }));
    expect(res.status).toBe(201);
    expect((await availabilityPost(json("/x", { startsAt: start.toISOString(), endsAt: end.toISOString() }))).status).toBe(403);
    const list = (await (await availabilityGet()).json()) as { slots: { id: string; note: string | null; booking: unknown }[] };
    expect(list.slots).toHaveLength(1);
    expect(list.slots[0]).toMatchObject({ note: "ZZ after school", booking: null });
    const slotId = list.slots[0]!.id;
    await asTeacher();
    expect((await slotDelete(del("/x"), p({ slotId }))).status).toBe(403);
    await asExpert();
    expect((await slotDelete(del("/x"), p({ slotId }))).status).toBe(200);
    // Withdrawing again is the same end state; a slot that is not mine is a 404.
    expect((await slotDelete(del("/x"), p({ slotId }))).status).toBe(200);
    expect((await slotDelete(del("/x"), p({ slotId: "c" + "z".repeat(24) }))).status).toBe(404);
    expect(await (await availabilityGet()).json()).toEqual({ slots: [] });
  });

  it("reads and saves the profile, never its standing", async () => {
    await asExpert();
    const before = await profileGet();
    expect(before.status).toBe(200);
    expect(await before.json()).toMatchObject({ profile: { headline: "ZZ Bridges", published: true, verified: false }, impact: { activeMentorships: 0 } });
    expect((await profilePost(json("/x", { headline: "x" }))).status).toBe(422);
    const saved = await profilePost(json("/x", { headline: "ZZ Bridges and tunnels", bio: "Both.", specialisms: ["Bridges", " bridges ", "Tunnels"], timezone: "Asia/Kolkata", offering: "SESSIONS" }));
    expect(saved.status).toBe(200);
    expect(await (await profileGet()).json()).toMatchObject({ profile: { headline: "ZZ Bridges and tunnels", specialisms: ["Bridges", "Tunnels"], offering: "SESSIONS", published: true } });
    await asTeacher();
    expect((await profilePost(json("/x", { headline: "ZZ Not me", bio: "", specialisms: [], timezone: "UTC", offering: "BOTH" }))).status).toBe(403);
  });
});

describe("uploads", () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array.from({ length: 40 }, (_, i) => i)]);
  const multipart = (file: File | null) => {
    const form = new FormData();
    if (file) form.set("file", file);
    return new Request("http://localhost/api/v1/uploads", { method: "POST", body: form });
  };

  it("stores one file for a signed-in caller and refuses an empty or unknown one", async () => {
    await asTeacher();
    const res = await uploadsPost(multipart(new File([PNG], "photo.png", { type: "image/png" })));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { fileId: string; mime: string; size: number };
    storedFiles.push(body.fileId);
    expect(body).toMatchObject({ mime: "image/png", size: expect.any(Number) });
    expect(body.fileId).toMatch(/^[0-9a-f-]{36}\.png$/);

    const none = await uploadsPost(multipart(null));
    expect(none.status).toBe(422);
    expect(await none.json()).toMatchObject({ code: "BAD_REQUEST", issues: { file: expect.any(String) } });
    const notJson = await uploadsPost(json("/api/v1/uploads", { file: "x" }));
    expect(notJson.status).toBe(422);
    const unknown = await uploadsPost(multipart(new File([new TextEncoder().encode("<svg onload=alert(1)>")], "logo.png", { type: "image/png" })));
    expect(unknown.status).toBe(422);
    expect(await unknown.json()).toMatchObject({ issues: { file: expect.any(String) } });
  });
});
