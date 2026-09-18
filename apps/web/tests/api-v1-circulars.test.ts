/**
 * Circular reach, end to end through the handlers: publishing a circular
 * tells its audience (a push row per reader, a text per guardian with a
 * number), opening it is "seen", the tap is "acknowledged", the reach
 * report counts the family and names the ones still waiting, the chase
 * tells only them and only once a day, and the office list sums it up.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { createPost } from "@/lib/bulletin";
import { deliverQueuedCirculars, INLINE_DELIVERY_MAX } from "@/lib/circulars";
import { GET as postGet } from "@/app/api/v1/shared/bulletin/[postId]/route";
import { POST as ackPost } from "@/app/api/v1/shared/bulletin/[postId]/ack/route";
import { GET as reachGet } from "@/app/api/v1/shared/bulletin/[postId]/reach/route";
import { POST as remindPost } from "@/app/api/v1/shared/bulletin/[postId]/remind/route";
import { GET as circularsGet } from "@/app/api/v1/office/circulars/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let parentAUserId = "";
let parentBUserId = "";
let parentCUserId = "";
let adminMembershipId = "";
let classId = "";
let postId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const post = (path: string) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
const params = (postId: string) => ({ params: Promise.resolve({ postId }) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER_TEACHER" | "PARENT_A" | "PARENT_B" | "PARENT_C" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER_TEACHER") await createSession(otherTeacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT_A") await createSession(parentAUserId, { schoolId: null, role: "PARENT" });
  if (who === "PARENT_B") await createSession(parentBUserId, { schoolId: null, role: "PARENT" });
  if (who === "PARENT_C") await createSession(parentCUserId, { schoolId: null, role: "PARENT" });
}

beforeAll(async () => {
  process.env.SMS_TRANSPORT = "devbox";
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Circular School ${STAMP}`, slug: `zz-circ-${STAMP}`, code: `ZL${suffix}`, contactEmail: `zz-circ-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", msgSmsEnabled: true }, select: { id: true } })).id;
  const mk = (who: string, phone?: string) => db.user.create({ data: { name: `ZZ Circ ${who}`, email: `zz-circ-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid`, phone }, select: { id: true } });
  const [admin, principal, teacher, otherTeacher, parentA, parentB, parentC, pupilA, pupilB, pupilC] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Other Teacher"), mk("Parent A", `+9198713${suffix}`), mk("Parent B"), mk("Parent C", `+9198714${suffix}`), mk("Pupil A"), mk("Pupil B"), mk("Pupil C")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = otherTeacher.id;
  parentAUserId = parentA.id;
  parentBUserId = parentB.id;
  parentCUserId = parentC.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: otherTeacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ Circ Class 5", gradeLevel: "5", joinCode: `ZL${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId, classId, teacherMembershipId: tm.id, role: "LEAD" } });
  let n = 0;
  for (const [pupil, parents] of [[pupilA, [parentA, parentB]], [pupilB, [parentC]], [pupilC, []]] as const) {
    n += 1;
    const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZLP${STAMP}${n}`, gradeLevel: "5" }, select: { id: true } });
    await db.enrollment.create({ data: { schoolId, classId, studentMembershipId: pm.id, status: "ACTIVE" } });
    for (const parent of parents) await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
  }

});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, otherTeacherUserId, parentAUserId, parentBUserId, parentCUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("telling the audience", () => {
  it("a small PARENTS circular is told in the request: a push row per guardian, a text per guardian with a number, and the post says when", async () => {
    const created = await createPost({ user: { id: adminUserId } as never, sessionId: "s", membershipId: adminMembershipId, schoolId, role: "ADMIN" }, { scope: "SCHOOL", title: "ZZ Annual day consent", body: "Please sign the slip.", tags: [], media: [], audience: "PARENTS", requiresAck: true });
    postId = created.postId;
    const row = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(row.deliveryQueuedAt).not.toBeNull();
    expect(row.deliveredAt).not.toBeNull();
    const pushes = await db.notification.findMany({ where: { url: `/bulletin/${postId}` }, select: { userId: true, kind: true, title: true } });
    expect(pushes.map((p) => p.userId).sort()).toEqual([parentAUserId, parentBUserId, parentCUserId].sort());
    expect(pushes[0]!.title).toContain("ZZ Circular School");
    const texts = await db.outboundMessage.findMany({ where: { purpose: `circular:${postId}`, status: "SENT" }, select: { userId: true, status: true, body: true } });
    expect(texts.map((t) => t.userId).sort()).toEqual([parentAUserId, parentCUserId].sort());
    expect(texts[0]!.body).toContain("ZZ Annual day consent");
    // A plain post tells nobody.
    const plain = await createPost({ user: { id: adminUserId } as never, sessionId: "s", membershipId: adminMembershipId, schoolId, role: "ADMIN" }, { scope: "SCHOOL", title: "ZZ Plain post", body: "Nothing to acknowledge.", tags: [], media: [] });
    expect(await db.notification.count({ where: { url: `/bulletin/${plain.postId}` } })).toBe(0);
    expect((await db.post.findUniqueOrThrow({ where: { id: plain.postId } })).deliveryQueuedAt).toBeNull();
  });

  it("a large audience is queued for the job, which tells it within the minute", async () => {
    expect(INLINE_DELIVERY_MAX).toBe(60);
    const big = await db.post.create({ data: { schoolId, authorUserId: adminUserId, authorMembershipId: adminMembershipId, scope: "SCHOOL", title: "ZZ Queued circular", body: "x", audience: "PARENTS", requiresAck: true, status: "APPROVED", reviewedAt: new Date(), deliveryQueuedAt: new Date() }, select: { id: true } });
    const run = await deliverQueuedCirculars();
    expect(run.delivered).toBeGreaterThanOrEqual(1);
    expect((await db.post.findUniqueOrThrow({ where: { id: big.id } })).deliveredAt).not.toBeNull();
    expect(await db.notification.count({ where: { url: `/bulletin/${big.id}` } })).toBe(3);
    await db.post.delete({ where: { id: big.id } });
  });
});

describe("reach", () => {
  it("opening the post is seen; the tap is acknowledged and idempotent; a plain post cannot be acknowledged", async () => {
    await as("PARENT_B");
    expect((await postGet(get("/x"), params(postId))).status).toBe(200);
    expect(await db.postRead.count({ where: { postId, userId: parentBUserId } })).toBe(1);
    expect((await postGet(get("/x"), params(postId))).status).toBe(200);
    expect(await db.postRead.count({ where: { postId, userId: parentBUserId } })).toBe(1);
    await as("PARENT_C");
    expect((await ackPost(post("/x"), params(postId))).status).toBe(200);
    expect((await ackPost(post("/x"), params(postId))).status).toBe(200);
    expect(await db.postAck.count({ where: { postId } })).toBe(1);
    const plain = await db.post.findFirstOrThrow({ where: { schoolId, title: "ZZ Plain post" }, select: { id: true } });
    expect((await ackPost(post("/x"), params(plain.id))).status).toBe(404);
    await as(null);
    expect((await ackPost(post("/x"), params(postId))).status).toBe(401);
  });

  it("the report counts the family: pupil A seen via parent B, pupil B acknowledged via parent C, pupil C unreached; the office sees phones, a teacher does not, another teacher nothing", async () => {
    // Parent A has the app on a phone; nobody else does. Registered after the
    // delivery above: a push to a token Expo has never seen is retired, which
    // is the right thing for a real phone and would blank the flag here.
    await db.deviceToken.create({ data: { userId: parentAUserId, expoPushToken: `ExponentPushToken[zz-circ-${STAMP}]`, platform: "android" } });
    await as("ADMIN");
    const res = await reachGet(get("/x"), params(postId));
    expect(res.status).toBe(200);
    const reach = await res.json();
    expect(reach.totals).toEqual({ total: 3, told: 2, seen: 2, acked: 1 });
    expect(reach.groups).toHaveLength(1);
    const g = reach.groups[0];
    expect(g.className).toBe("ZZ Circ Class 5");
    expect(g.outstanding.map((f: { studentName: string; state: string }) => [f.studentName, f.state])).toEqual([["ZZ Circ Pupil A", "SEEN"], ["ZZ Circ Pupil C", "UNREACHED"]]);
    const a = g.outstanding[0];
    expect(a.guardians.map((x: { name: string; state: string; hasApp: boolean; texted: boolean; phone: string | null }) => [x.name, x.state, x.hasApp, x.texted, x.phone !== null])).toEqual([["ZZ Circ Parent A", "TOLD", true, true, true], ["ZZ Circ Parent B", "SEEN", false, false, false]]);
    expect(reach.canRemind).toBe(true);
    expect(reach.remindBlocked).toBe("none");
    await as("TEACHER");
    const teacherView = await (await reachGet(get("/x"), params(postId))).json();
    expect(teacherView.groups[0].outstanding[0].guardians[0].phone).toBeNull();
    expect(teacherView.canRemind).toBe(false);
    expect(teacherView.remindBlocked).toBe("not-office");
    await as("OTHER_TEACHER");
    expect((await (await reachGet(get("/x"), params(postId))).json()).groups).toEqual([]);
    await as("PARENT_A");
    expect((await reachGet(get("/x"), params(postId))).status).toBe(403);
  });

  it("the chase tells only the families still waiting, then refuses for a day; a teacher may not chase", async () => {
    await as("TEACHER");
    expect((await remindPost(post("/x"), params(postId))).status).toBe(403);
    await as("PRINCIPAL");
    const before = await db.notification.count({ where: { url: `/bulletin/${postId}` } });
    const res = await remindPost(post("/x"), params(postId));
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out.reminded).toBe(2); // parents A and B; parent C acknowledged; pupil C has no guardian
    expect(out.texted).toBe(2);
    expect(await db.notification.count({ where: { url: `/bulletin/${postId}` } })).toBe(before + 2);
    expect(await db.outboundMessage.count({ where: { purpose: `circular-remind:${postId}`, userId: parentAUserId } })).toBe(1);
    expect(await db.outboundMessage.count({ where: { purpose: `circular-remind:${postId}`, userId: parentCUserId } })).toBe(0);
    // Within the day a second chase is a no-op, not a refusal: the sweep and a double tap both get 200 and nothing sent.
    const again = await remindPost(post("/x"), params(postId));
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ reminded: 0, texted: 0 });
    expect(await db.notification.count({ where: { url: `/bulletin/${postId}` } })).toBe(before + 2);
    const row = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(row.remindCount).toBe(1);
    expect(row.remindedAt).not.toBeNull();
    const reach = await (await reachGet(get("/x"), params(postId))).json();
    expect(reach.remindBlocked).toBe("too-soon");
    expect(reach.remindCount).toBe(1);
    const audits = await db.auditLog.findMany({ where: { schoolId, targetId: postId, action: { in: ["circular.deliver", "circular.remind"] } }, select: { action: true } });
    expect(audits.map((a) => a.action).sort()).toEqual(["circular.deliver", "circular.remind"]);
  });

  it("the office list sums every circular; a teacher is refused", async () => {
    await as("ADMIN");
    const list = await (await circularsGet()).json();
    expect(list.rows.map((r: { title: string; total: number; acked: number; seen: number; told: number }) => [r.title, r.total, r.told, r.seen, r.acked])).toEqual([["ZZ Annual day consent", 3, 2, 2, 1]]);
    await as("TEACHER");
    expect((await circularsGet()).status).toBe(403);
  });
});
