/**
 * POST /api/v1/join/lookup and POST /api/v1/join, invoked directly with a
 * primed session the way api-v1-operator.test.ts does: 401 signed out; a ZZ
 * person with no school looks up a ZZ school's code and a ZZ class code,
 * then ASKS to join with the class code — a 202, a request waiting and no
 * membership; the class's teacher sees it and lets them in, another class's
 * teacher and another school's office cannot, and only then is there a
 * pupil membership and the enrolment on their own id; a
 * too-short code and a parent's account are 422s with the lib's sentence;
 * the code-guessing limit is a 429. Every row is a ZZ row made here and
 * deleted afterwards; the requests carry an address of their own, so the
 * limit's bucket is this file's alone.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { apiErrorSchema, joinFiledSchema, joinLookupSchema, joinRequestsSchema, waitingQueueSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { CODE_LOOKUPS } from "@/lib/rate-limit";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as lookupPost } from "@/app/api/v1/join/lookup/route";
import { POST as joinPost } from "@/app/api/v1/join/route";
import { GET as requestsGet } from "@/app/api/v1/join/requests/route";
import { GET as queueGet } from "@/app/api/v1/shared/joins/route";
import { POST as decidePost } from "@/app/api/v1/shared/joins/[requestId]/decide/route";

const db = new PrismaClient();
const STAMP = Date.now();
const DIGITS = String(STAMP).slice(-6);
const SCHOOL_CODE = `ZJ${DIGITS}`;
const CLASS_CODE = `ZJC-${DIGITS.slice(-4)}`;
const IP = `198.51.100.${(STAMP % 250) + 1}`;
const LIMITED_IP = `198.51.100.${((STAMP + 1) % 250) + 1}`;

let schoolId = "";
let classId = "";
let joinerUserId = "";
let parentUserId = "";
let pupilUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let adminUserId = "";

const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function signInAs(userId: string | null, role?: "TEACHER" | "ADMIN") {
  __resetCookies();
  if (userId) await createSession(userId, role ? { schoolId, role } : undefined);
}
const decide = (requestId: string, decision: "APPROVE" | "DECLINE") =>
  decidePost(post("/api/v1/shared/joins/x/decide", { decision }), { params: Promise.resolve({ requestId }) });

beforeAll(async () => {
  __setHeaders({ "x-forwarded-for": IP });
  const school = await db.school.create({
    data: { name: `ZZ V1J School ${STAMP}`, slug: `zz-v1j-${STAMP}`, code: SCHOOL_CODE, contactEmail: `zz-v1j-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "ZZ Town" },
    select: { id: true },
  });
  schoolId = school.id;
  const klass = await db.class.create({ data: { schoolId, name: `ZZ V1J Class ${STAMP}`, gradeLevel: "5", joinCode: CLASS_CODE }, select: { id: true } });
  classId = klass.id;

  const [joiner, parent, pupil] = await Promise.all([
    db.user.create({ data: { name: "ZZ V1J Joiner", email: `zz-v1j-joiner-${STAMP}@test.invalid`, birthdate: new Date("2014-02-02T00:00:00Z") }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1J Parent", email: `zz-v1j-parent-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1J Pupil", email: `zz-v1j-pupil-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  joinerUserId = joiner.id;
  parentUserId = parent.id;
  pupilUserId = pupil.id;
  // The parent guards a ZZ pupil, which is what makes theirs a parent's account.
  const pupilMembership = await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilMembership.id, studentSchoolId: schoolId, status: "ACTIVE" } });

  // The class's own teacher, a teacher of another class, and the office.
  const staff = await Promise.all(
    ["teacher", "other-teacher", "admin"].map((who) => db.user.create({ data: { name: `ZZ V1J ${who}`, email: `zz-v1j-${who}-${STAMP}@test.invalid` }, select: { id: true } })),
  );
  [teacherUserId, otherTeacherUserId, adminUserId] = staff.map((user) => user.id) as [string, string, string];
  const teacher = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const otherTeacher = await db.membership.create({ data: { userId: otherTeacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  const otherClass = await db.class.create({ data: { schoolId, name: `ZZ V1J Other ${STAMP}`, gradeLevel: "6", joinCode: `ZJO-${DIGITS.slice(-4)}` }, select: { id: true } });
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: teacher.id } });
  await db.classTeacher.create({ data: { classId: otherClass.id, schoolId, teacherMembershipId: otherTeacher.id } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const ids = [joinerUserId, parentUserId, pupilUserId, teacherUserId, otherTeacherUserId, adminUserId].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`code-lookup:${IP}`, `code-lookup:${LIMITED_IP}`] } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  if (schoolId) {
    await db.auditLog.deleteMany({ where: { schoolId } });
    await db.notification.deleteMany({ where: { schoolId } });
    await db.joinRequest.deleteMany({ where: { schoolId } });
    await db.enrollment.deleteMany({ where: { schoolId } });
    await db.classTeacher.deleteMany({ where: { schoolId } });
    await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
    await db.membership.deleteMany({ where: { schoolId } });
    await db.class.deleteMany({ where: { schoolId } });
  }
  await db.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("is a 401 on both", async () => {
    await signInAs(null);
    expect((await lookupPost(post("/api/v1/join/lookup", { code: CLASS_CODE }))).status).toBe(401);
    expect((await joinPost(post("/api/v1/join", { code: CLASS_CODE }))).status).toBe(401);
  });
});

describe("a person with no school", () => {
  it("looks up a school's code and a class's code", async () => {
    await signInAs(joinerUserId);
    const school = await lookupPost(post("/api/v1/join/lookup", { code: SCHOOL_CODE.toLowerCase() }));
    expect(school.status).toBe(200);
    expect(joinLookupSchema.parse(await school.json())).toEqual({ kind: "school", schoolName: `ZZ V1J School ${STAMP}`, className: null });

    const klass = await lookupPost(post("/api/v1/join/lookup", { code: CLASS_CODE }));
    expect(klass.status).toBe(200);
    expect(joinLookupSchema.parse(await klass.json())).toEqual({ kind: "class", schoolName: `ZZ V1J School ${STAMP}`, className: `ZZ V1J Class ${STAMP}` });
  });

  it("a too-short code is a 422 with the sentence on the code, on both; an empty body is a 422", async () => {
    await signInAs(joinerUserId);
    for (const [path, handler] of [["/api/v1/join/lookup", lookupPost], ["/api/v1/join", joinPost]] as const) {
      const res = await handler(post(path, { code: "AB" }));
      expect(res.status).toBe(422);
      const body = apiErrorSchema.parse(await res.json());
      expect(body.error).toBe("That code looks too short.");
      expect(body.issues?.code).toBe("That code looks too short.");
      expect((await handler(post(path, {}))).status).toBe(422);
    }
  });

  it("⚠ asks with the class code: a 202, a request waiting, and nothing of the school — no membership, no enrolment, no moved session", async () => {
    await signInAs(joinerUserId);
    const res = await joinPost(post("/api/v1/join", { code: CLASS_CODE }));
    expect(res.status).toBe(202);
    const filed = joinFiledSchema.parse(await res.json());
    expect(filed).toMatchObject({ schoolName: `ZZ V1J School ${STAMP}`, className: `ZZ V1J Class ${STAMP}`, alreadyWaiting: false });

    expect(await db.membership.count({ where: { userId: joinerUserId } })).toBe(0);
    expect(await db.enrollment.count({ where: { classId } })).toBe(0);
    const session = await db.session.findFirstOrThrow({ where: { userId: joinerUserId }, orderBy: { createdAt: "desc" } });
    expect(session).toMatchObject({ activeSchoolId: null, activeRole: null });

    // Asking twice is asking once, and tells the teacher once.
    const again = joinFiledSchema.parse(await (await joinPost(post("/api/v1/join", { code: CLASS_CODE }))).json());
    expect(again).toMatchObject({ requestId: filed.requestId, alreadyWaiting: true });
    expect(await db.joinRequest.count({ where: { userId: joinerUserId } })).toBe(1);
    expect(await db.notification.count({ where: { userId: teacherUserId } })).toBe(1);
    // The class has a teacher, so the office is not rung for it.
    expect(await db.notification.count({ where: { userId: adminUserId } })).toBe(0);

    const mine = joinRequestsSchema.parse(await (await requestsGet()).json());
    expect(mine.requests).toEqual([expect.objectContaining({ id: filed.requestId, status: "PENDING", schoolName: `ZZ V1J School ${STAMP}`, className: `ZZ V1J Class ${STAMP}` })]);
  });

  it("⚠ the class's teacher sees it and lets them in; another class's teacher sees nothing and decides nothing; a person with no role is refused", async () => {
    const request = await db.joinRequest.findFirstOrThrow({ where: { userId: joinerUserId, status: "PENDING" } });

    await signInAs(joinerUserId);
    expect((await queueGet()).status).toBe(403);
    expect((await decide(request.id, "APPROVE")).status).toBe(403);

    await signInAs(otherTeacherUserId, "TEACHER");
    expect(waitingQueueSchema.parse(await (await queueGet()).json())).toEqual({ joins: [], claims: [] });
    expect((await decide(request.id, "APPROVE")).status).toBe(404);
    expect(await db.membership.count({ where: { userId: joinerUserId } })).toBe(0);

    await signInAs(teacherUserId, "TEACHER");
    const queue = waitingQueueSchema.parse(await (await queueGet()).json());
    expect(queue.joins).toEqual([expect.objectContaining({ id: request.id, name: "ZZ V1J Joiner", via: "CLASS", className: `ZZ V1J Class ${STAMP}`, onRoll: false })]);
    expect(queue.joins[0]?.age).toBeGreaterThanOrEqual(12);
    expect((await decide(request.id, "BOTH" as "APPROVE")).status).toBe(422);
    expect((await decide(request.id, "APPROVE")).status).toBe(200);

    const membership = await db.membership.findFirstOrThrow({ where: { userId: joinerUserId, schoolId, role: "STUDENT", status: "ACTIVE" } });
    expect(membership.studentCode).toMatch(/^STU-/);
    expect(await db.enrollment.count({ where: { classId, studentMembershipId: membership.id, status: "ACTIVE" } })).toBe(1);
    // No second account: still exactly one user by that address.
    expect(await db.user.count({ where: { email: `zz-v1j-joiner-${STAMP}@test.invalid` } })).toBe(1);
    // The asker is told, and the request has left their list and the queue.
    expect((await db.notification.findFirst({ where: { userId: joinerUserId } }))?.url).toBe("/student");
    expect(waitingQueueSchema.parse(await (await queueGet()).json()).joins).toEqual([]);

    // Decided once.
    const twice = await decide(request.id, "DECLINE");
    expect(twice.status).toBe(403);
    expect(apiErrorSchema.parse(await twice.json()).error).toBe("That request has already been decided.");
    expect(await db.membership.count({ where: { userId: joinerUserId, schoolId } })).toBe(1);
  });

  it("⚠ a join by the school's code is the office's to decide, not a teacher's; declined, it leaves nothing behind", async () => {
    const was = (await db.membership.findMany({ where: { userId: joinerUserId }, select: { id: true } })).map((m) => m.id);
    await db.enrollment.deleteMany({ where: { studentMembershipId: { in: was } } });
    await db.guardianship.deleteMany({ where: { studentMembershipId: { in: was } } });
    await db.membership.deleteMany({ where: { userId: joinerUserId } });

    await signInAs(joinerUserId);
    const filed = joinFiledSchema.parse(await (await joinPost(post("/api/v1/join", { code: SCHOOL_CODE }))).json());
    expect(filed.className).toBeNull();
    expect(await db.notification.count({ where: { userId: adminUserId } })).toBe(1);

    await signInAs(teacherUserId, "TEACHER");
    expect(waitingQueueSchema.parse(await (await queueGet()).json()).joins).toEqual([]);
    expect((await decide(filed.requestId, "APPROVE")).status).toBe(403);

    await signInAs(adminUserId, "ADMIN");
    expect(waitingQueueSchema.parse(await (await queueGet()).json()).joins.map((join) => join.id)).toEqual([filed.requestId]);
    const declined = await decidePost(post("/api/v1/shared/joins/x/decide", { decision: "DECLINE", reason: "  Please ask the office in person.  " }), { params: Promise.resolve({ requestId: filed.requestId }) });
    expect(declined.status).toBe(200);
    expect(await db.membership.count({ where: { userId: joinerUserId } })).toBe(0);

    await signInAs(joinerUserId);
    const mine = joinRequestsSchema.parse(await (await requestsGet()).json());
    expect(mine.requests.map((request) => [request.status, request.declineReason])).toEqual([["DECLINED", "Please ask the office in person."]]);
    // Told what the school said, and the log holds that something was said and not what.
    const told = await db.notification.findFirst({ where: { userId: joinerUserId, titleKey: "joinRequests.notifDeclined" } });
    expect(told?.body).toBe("The school said: Please ask the office in person.");
    const logged = await db.auditLog.findFirst({ where: { schoolId, action: "student.join.decline" } });
    expect(logged?.meta).toContain("reasonGiven");
    expect(logged?.meta).not.toContain("office in person");
  });

  it("⚠ after a decline the same request cannot be made again for seven days — and can on the eighth", async () => {
    await signInAs(joinerUserId);
    const soon = await joinPost(post("/api/v1/join", { code: SCHOOL_CODE }));
    expect(soon.status).toBe(422);
    expect(apiErrorSchema.parse(await soon.json()).error).toBe("Your request was not accepted. After a request is not accepted, it cannot be made again for 7 days.");
    expect(await db.joinRequest.count({ where: { userId: joinerUserId, status: "PENDING" } })).toBe(0);
    // Another door is another question: the class's teacher has not said no.
    expect((await joinPost(post("/api/v1/join", { code: CLASS_CODE }))).status).toBe(202);
    await db.joinRequest.deleteMany({ where: { userId: joinerUserId, status: "PENDING" } });

    await db.joinRequest.updateMany({ where: { userId: joinerUserId, status: "DECLINED" }, data: { decidedAt: new Date(Date.now() - 8 * 86_400_000) } });
    expect((await joinPost(post("/api/v1/join", { code: SCHOOL_CODE }))).status).toBe(202);
  });

  it("⚠ a request nobody decided in thirty days waits on nobody: out of the queue, refused if decided, EXPIRED to the asker, and asking again is a new request", async () => {
    const stale = await db.joinRequest.findFirstOrThrow({ where: { userId: joinerUserId, status: "PENDING" } });
    await db.joinRequest.update({ where: { id: stale.id }, data: { createdAt: new Date(Date.now() - 31 * 86_400_000) } });

    await signInAs(adminUserId, "ADMIN");
    expect(waitingQueueSchema.parse(await (await queueGet()).json()).joins).toEqual([]);
    const late = await decide(stale.id, "APPROVE");
    expect(late.status).toBe(403);
    expect(apiErrorSchema.parse(await late.json()).error).toMatch(/has expired/);
    expect(await db.membership.count({ where: { userId: joinerUserId } })).toBe(0);

    await signInAs(joinerUserId);
    // The column still says PENDING; the date is what the asker is shown.
    expect(joinRequestsSchema.parse(await (await requestsGet()).json()).requests.find((request) => request.id === stale.id)?.status).toBe("EXPIRED");
    const again = joinFiledSchema.parse(await (await joinPost(post("/api/v1/join", { code: SCHOOL_CODE }))).json());
    expect(again.alreadyWaiting).toBe(false);
    expect(again.requestId).not.toBe(stale.id);
    expect((await db.joinRequest.findUniqueOrThrow({ where: { id: stale.id } })).status).toBe("EXPIRED");
  });

  it("⚠ the nightly job expires what is past its thirty days, tells the asker once, counts per school, and leaves the rest", async () => {
    const { expireRequests } = await import("@/lib/request-expiry");
    const live = await db.joinRequest.findFirstOrThrow({ where: { userId: joinerUserId, status: "PENDING" } });
    const old = await db.joinRequest.create({ data: { userId: pupilUserId, schoolId, via: "SCHOOL", createdAt: new Date(Date.now() - 40 * 86_400_000) } });

    const out = await expireRequests(new Date(), { schoolIds: [schoolId] });
    expect(out).toMatchObject({ joins: 1, claims: 0, perSchool: { [schoolId]: { joinsExpired: 1 } } });
    expect((await db.joinRequest.findUniqueOrThrow({ where: { id: old.id } })).status).toBe("EXPIRED");
    expect((await db.joinRequest.findUniqueOrThrow({ where: { id: live.id } })).status).toBe("PENDING");
    expect(await db.notification.count({ where: { userId: pupilUserId, titleKey: "joinRequests.notifExpired" } })).toBe(1);

    expect(await expireRequests(new Date(), { schoolIds: [schoolId] })).toMatchObject({ joins: 0, claims: 0, perSchool: {} });
    expect(await db.notification.count({ where: { userId: pupilUserId, titleKey: "joinRequests.notifExpired" } })).toBe(1);
  });

  it("a parent's account is refused with the parent sentence, and joins nothing", async () => {
    await signInAs(parentUserId);
    const res = await joinPost(post("/api/v1/join", { code: CLASS_CODE }));
    expect(res.status).toBe(422);
    const body = apiErrorSchema.parse(await res.json());
    expect(body.error).toBe("This account is linked to a child as a parent, so it cannot join a class as a pupil. Sign out and use the pupil's own account.");
    expect(body.issues).toBeUndefined();
    expect(await db.membership.count({ where: { userId: parentUserId } })).toBe(0);
  });
});

describe("⚠ guessing codes", () => {
  it("counts against the web's allowance per caller, and is a 429 with Retry-After at the limit", async () => {
    await signInAs(joinerUserId);
    __setHeaders({ "x-forwarded-for": LIMITED_IP });
    try {
      await db.rateLimit.upsert({
        where: { bucket: `code-lookup:${LIMITED_IP}` },
        create: { bucket: `code-lookup:${LIMITED_IP}`, hits: CODE_LOOKUPS.limit, windowEndsAt: new Date(Date.now() + CODE_LOOKUPS.windowMs) },
        update: { hits: CODE_LOOKUPS.limit, windowEndsAt: new Date(Date.now() + CODE_LOOKUPS.windowMs) },
      });
      const res = await lookupPost(post("/api/v1/join/lookup", { code: CLASS_CODE }));
      expect(res.status).toBe(429);
      expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
      const body = apiErrorSchema.parse(await res.json());
      expect(body.code).toBe("RATE_LIMITED");
      expect(body.error).toMatch(/^Too many tries\. Wait /);
    } finally {
      __setHeaders({ "x-forwarded-for": IP });
    }
  });
});
