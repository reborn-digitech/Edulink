/**
 * Platform moderation of the global feed (src/lib/bulletin.ts, the foot):
 * the content team takes a GLOBAL post down and it is gone for every school
 * at once — the other school's feed, the home school's feed, the author's
 * own list, the post page — the school's office and the author are told
 * with the reason, the act is in the school's audit log with the platform
 * as actor, the platform's list shows it under "taken down", a restore puts
 * it back everywhere, and a school admin is refused at the library and at
 * the door (403). A school's own hide is untouched. Every row is a ZZ row
 * made here and removed after.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { moderationPostSchema, moderationSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { createPost, getPost, listFeed, listPlatformModeration, moderatePost, platformRestore, platformTakedown, readPlatformPost } from "@/lib/bulletin";
import { hideGlobalPost, listGlobalFeed, publishGlobally } from "@/lib/global-feed";
import { GET as moderationGet } from "@/app/api/v1/appadmin/moderation/route";
import { GET as postGet } from "@/app/api/v1/appadmin/moderation/[postId]/route";
import { POST as takedownPost } from "@/app/api/v1/appadmin/moderation/[postId]/takedown/route";
import { POST as restorePost } from "@/app/api/v1/appadmin/moderation/[postId]/restore/route";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolA = "";
let schoolB = "";
let curatorId = "";
let pupilUserId = "";
let pupilMembershipId = "";
let adminAUserId = "";
let adminAMembershipId = "";
let teacherBUserId = "";
let teacherBMembershipId = "";
let adminBUserId = "";
let adminBMembershipId = "";
let postId = "";
const userIds: string[] = [];

function ctx(over: { userId: string; membershipId?: string | null; schoolId?: string | null; role?: ActiveContext["role"]; isMinor?: boolean; isAppAdmin?: boolean }): ActiveContext {
  return {
    sessionId: "t",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: over.isMinor ?? false, isSuperuser: false, isAppAdmin: over.isAppAdmin ?? false, prefs: {} as never },
  };
}
const curator = () => ctx({ userId: curatorId, isAppAdmin: true });
const pupil = () => ctx({ userId: pupilUserId, membershipId: pupilMembershipId, schoolId: schoolA, role: "STUDENT", isMinor: true });
const adminA = () => ctx({ userId: adminAUserId, membershipId: adminAMembershipId, schoolId: schoolA, role: "ADMIN" });
const teacherB = () => ctx({ userId: teacherBUserId, membershipId: teacherBMembershipId, schoolId: schoolB, role: "TEACHER" });
const adminB = () => ctx({ userId: adminBUserId, membershipId: adminBMembershipId, schoolId: schoolB, role: "ADMIN" });

const P = "http://localhost/api/v1/appadmin/moderation";
const params = (postId: string) => ({ params: Promise.resolve({ postId }) });
const send = (path: string, body?: unknown) => new Request(`${P}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolA = (await db.school.create({ data: { name: `ZZ Platform Mod A ${STAMP}`, slug: `zz-pm-a-${STAMP}`, code: `ZPA${suffix}`, contactEmail: `zz-pm-a-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  schoolB = (await db.school.create({ data: { name: `ZZ Platform Mod B ${STAMP}`, slug: `zz-pm-b-${STAMP}`, code: `ZPB${suffix}`, contactEmail: `zz-pm-b-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (name: string, extra: { isMinor?: boolean; isAppAdmin?: boolean } = {}) => db.user.create({ data: { name, email: `zz-pm-${name.toLowerCase().replace(/\s+/g, "-")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [pupilUser, adminUser, teacherUser, adminBUser, curatorUser] = await Promise.all([mk("Aarav ZZSharma", { isMinor: true }), mk("ZZ Admin A"), mk("ZZ Teacher B"), mk("ZZ Admin B"), mk("ZZ Curator", { isAppAdmin: true })]);
  pupilUserId = pupilUser.id;
  adminAUserId = adminUser.id;
  teacherBUserId = teacherUser.id;
  adminBUserId = adminBUser.id;
  curatorId = curatorUser.id;
  userIds.push(pupilUserId, adminAUserId, teacherBUserId, adminBUserId, curatorId);
  pupilMembershipId = (await db.membership.create({ data: { userId: pupilUserId, schoolId: schoolA, role: "STUDENT", status: "ACTIVE", studentCode: `ZPM${STAMP}` }, select: { id: true } })).id;
  adminAMembershipId = (await db.membership.create({ data: { userId: adminAUserId, schoolId: schoolA, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  teacherBMembershipId = (await db.membership.create({ data: { userId: teacherBUserId, schoolId: schoolB, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  adminBMembershipId = (await db.membership.create({ data: { userId: adminBUserId, schoolId: schoolB, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;

  const created = await createPost(pupil(), { scope: "SCHOOL", title: `ZZ Platform mod ${STAMP}`, body: "Our science fair, open to every school", tags: [], media: [] });
  postId = created.postId;
  await moderatePost(adminA(), postId, "APPROVE");
  await publishGlobally(adminA(), postId);
});

afterAll(async () => {
  await db.platformTakedown.deleteMany({ where: { postId } });
  await db.school.deleteMany({ where: { id: { in: [schoolA, schoolB] } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

const onFeed = async (who: ActiveContext) => (await listGlobalFeed(who)).some((p) => p.id === postId);
const atHome = async (who: ActiveContext, mineOnly = false) => (await listFeed(who, { mineOnly })).some((p) => p.id === postId);

describe("the platform's list", () => {
  it("shows the live post with the school named and the pupil by first name; a school admin is refused", async () => {
    const list = await listPlatformModeration(curator());
    const mine = list.items.find((i) => i.postId === postId);
    expect(mine).toMatchObject({ status: "APPROVED", schoolName: `ZZ Platform Mod A ${STAMP}`, authorName: "Aarav", title: `ZZ Platform mod ${STAMP}` });
    expect(list.counts.live).toBeGreaterThanOrEqual(1);
    const one = await readPlatformPost(curator(), postId);
    expect(one.body).toContain("science fair");
    await expect(listPlatformModeration(adminA())).rejects.toBeInstanceOf(AccessError);
    await expect(platformTakedown(adminB(), postId, "not from a school")).rejects.toBeInstanceOf(AccessError);
  });
});

describe("a take-down", () => {
  it("needs a reason, then hides the post everywhere, tells the school and the author, and is in the school's log with the platform as actor", async () => {
    expect(await onFeed(teacherB())).toBe(true);
    expect(await atHome(adminA())).toBe(true);
    await expect(platformTakedown(curator(), postId, " ")).rejects.toMatchObject({ key: "moderation.reasonRequired" });

    const notifsBefore = await db.notification.count({ where: { userId: { in: [adminAUserId, pupilUserId] }, titleKey: "notifTitle.postPlatformTakedown" } });
    await platformTakedown(curator(), postId, "Names a child in full");

    expect((await db.post.findUniqueOrThrow({ where: { id: postId }, select: { status: true } })).status).toBe("TAKEN_DOWN");
    expect(await onFeed(teacherB())).toBe(false);
    expect(await atHome(adminA())).toBe(false);
    expect(await atHome(pupil(), true)).toBe(false);
    await expect(getPost(teacherB(), postId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getPost(pupil(), postId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(readPlatformPost(curator(), postId)).rejects.toMatchObject({ code: "NOT_FOUND" });

    const row = await db.platformTakedown.findUniqueOrThrow({ where: { postId } });
    expect(row).toMatchObject({ postSchoolId: schoolA, schoolName: `ZZ Platform Mod A ${STAMP}`, reason: "Names a child in full", takenDownByUserId: curatorId, restoredAt: null });
    const log = await db.auditLog.findFirst({ where: { action: "post.platformTakedown", targetId: postId }, select: { schoolId: true, actorUserId: true, meta: true } });
    expect(log).toMatchObject({ schoolId: schoolA, actorUserId: curatorId });
    expect(JSON.parse(log!.meta)).toMatchObject({ platform: true, reason: "Names a child in full" });
    expect(await db.notification.count({ where: { userId: { in: [adminAUserId, pupilUserId] }, titleKey: "notifTitle.postPlatformTakedown" } })).toBe(notifsBefore + 2);
    expect((await db.notification.findFirst({ where: { userId: adminAUserId, titleKey: "notifTitle.postPlatformTakedown" }, select: { body: true } }))!.body).toContain("Names a child in full");

    await expect(platformTakedown(curator(), postId, "again")).rejects.toMatchObject({ key: "moderation.alreadyTakenDown" });
    const list = await listPlatformModeration(curator(), { status: "takenDown" });
    expect(list.items.find((i) => i.postId === postId)).toMatchObject({ status: "TAKEN_DOWN", takedown: { reason: "Names a child in full", by: "ZZ Curator", restoredAt: null } });
    expect((await listPlatformModeration(curator())).items.some((i) => i.postId === postId)).toBe(false);
  });

  it("a restore puts it back everywhere and tells the school; a school's own hide is untouched by either", async () => {
    await platformRestore(curator(), postId);
    expect((await db.post.findUniqueOrThrow({ where: { id: postId }, select: { status: true } })).status).toBe("APPROVED");
    expect(await onFeed(teacherB())).toBe(true);
    expect(await atHome(adminA())).toBe(true);
    expect(await atHome(pupil(), true)).toBe(true);
    expect((await getPost(teacherB(), postId)).id).toBe(postId);
    expect(await db.notification.count({ where: { userId: { in: [adminAUserId, pupilUserId] }, titleKey: "notifTitle.postPlatformRestored" } })).toBe(2);
    expect(await db.auditLog.count({ where: { action: "post.platformRestore", targetId: postId, schoolId: schoolA } })).toBe(1);
    await expect(platformRestore(curator(), postId)).rejects.toMatchObject({ key: "moderation.alreadyRestored" });
    const restored = await listPlatformModeration(curator(), { status: "restored" });
    expect(restored.items.find((i) => i.postId === postId)!.takedown).toMatchObject({ restoredBy: "ZZ Curator" });

    // School B hides it for its own people; the platform's act neither reads nor removes that.
    await hideGlobalPost(adminB(), postId, "Not for us");
    await platformTakedown(curator(), postId, "Once more");
    await platformRestore(curator(), postId);
    expect(await db.globalPostHide.count({ where: { schoolId: schoolB, postId } })).toBe(1);
    expect(await onFeed(ctx({ userId: teacherBUserId, membershipId: teacherBMembershipId, schoolId: schoolB, role: "STUDENT" }))).toBe(false);
    expect(await onFeed(adminA())).toBe(true);
  });
});

describe("the doors", () => {
  it("answer the content team in the contracts' shapes and refuse a school admin with 403", async () => {
    __resetCookies();
    await createSession(curatorId);
    const list = await moderationGet(new Request(`${P}?status=live`));
    expect(list.status).toBe(200);
    expect(moderationSchema.parse(await list.json()).items.some((i) => i.postId === postId)).toBe(true);
    const one = await postGet(new Request(`${P}/${postId}`), params(postId));
    expect(one.status).toBe(200);
    expect(moderationPostSchema.parse(await one.json()).postId).toBe(postId);
    expect((await takedownPost(send(`/${postId}/takedown`, { reason: "x" }), params(postId))).status).toBe(422);
    const down = await takedownPost(send(`/${postId}/takedown`, { reason: "Through the door" }), params(postId));
    expect(down.status).toBe(200);
    expect(await down.json()).toEqual({ ok: true });
    expect(moderationSchema.parse(await (await moderationGet(new Request(`${P}?status=takenDown`))).json()).items.some((i) => i.postId === postId)).toBe(true);
    const up = await restorePost(send(`/${postId}/restore`), params(postId));
    expect(up.status).toBe(200);
    expect((await restorePost(send(`/${postId}/restore`), params(postId))).status).toBe(403);
    expect((await takedownPost(send("/nope/takedown", { reason: "Through the door" }), params("nope"))).status).toBe(404);

    __resetCookies();
    await createSession(adminAUserId, { schoolId: schoolA, role: "ADMIN" });
    expect((await moderationGet(new Request(P))).status).toBe(403);
    expect((await takedownPost(send(`/${postId}/takedown`, { reason: "Through the door" }), params(postId))).status).toBe(403);
    expect((await restorePost(send(`/${postId}/restore`), params(postId))).status).toBe(403);
    __resetCookies();
    expect((await moderationGet(new Request(P))).status).toBe(401);
  });
});
