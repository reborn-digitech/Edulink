/**
 * A cover answered (substitutions.ts acknowledgeCover/declineCover through
 * the two /teaching/covers doors): the person named takes it or declines it
 * with a reason, the office and the head are told of a decline, the board
 * shows the lesson uncovered again with the reason, a declined cover frees
 * the person for that period, the same answer twice is a no-op, anyone
 * else's cover is not found, and reassigning to someone else clears the
 * answer.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as boardGet, POST as assignPost } from "@/app/api/v1/office/substitutions/route";
import { GET as mineGet } from "@/app/api/v1/staff/substitutions/me/route";
import { POST as ackPost } from "@/app/api/v1/teaching/covers/[id]/acknowledge/route";
import { POST as declinePost } from "@/app/api/v1/teaching/covers/[id]/decline/route";
import { todayKey, weekdayOfKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let userA = "";
let userB = "";
let userC = "";
let teacherA = "";
let teacherB = "";
let teacherC = "";
let slotP1 = "";
let coverId = "";
const today = todayKey(TZ);
const weekday = weekdayOfKey(today);

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const ack = (id: string) => ackPost(json(`/api/v1/teaching/covers/${id}/acknowledge`, {}), { params: Promise.resolve({ id }) });
const decline = (id: string, body: unknown) => declinePost(json(`/api/v1/teaching/covers/${id}/decline`, body), { params: Promise.resolve({ id }) });
async function as(who: "ADMIN" | "PRINCIPAL" | "A" | "B" | "C" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "A") await createSession(userA, { schoolId, role: "TEACHER" });
  if (who === "B") await createSession(userB, { schoolId, role: "TEACHER" });
  if (who === "C") await createSession(userC, { schoolId, role: "TEACHER" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Cover School ${STAMP}`, slug: `zz-cover-${STAMP}`, code: `ZC${suffix}`, contactEmail: `zz-cover-${STAMP}@test.invalid`, timezone: TZ, teachingDays: "1,2,3,4,5,6,0" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Cover ${who}`, email: `zz-cover-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, a, b, c] = await Promise.all([mk("Admin"), mk("Principal"), mk("Asha Away"), mk("Bhavna Cover"), mk("Chetan Other")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  userA = a.id;
  userB = b.id;
  userC = c.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }] });
  teacherA = (await db.membership.create({ data: { userId: userA, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  teacherB = (await db.membership.create({ data: { userId: userB, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  teacherC = (await db.membership.create({ data: { userId: userC, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const k1 = await db.class.create({ data: { schoolId, name: "ZZ 7A", gradeLevel: "7", joinCode: `ZC1${suffix}` }, select: { id: true } });
  const p1 = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ P1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 }, select: { id: true } });
  slotP1 = (await db.timetableSlot.create({ data: { schoolId, classId: k1.id, periodId: p1.id, weekday, subject: "Mathematics", teacherMembershipId: teacherA }, select: { id: true } })).id;
  await db.staffAttendance.create({ data: { schoolId, membershipId: teacherA, dateKey: today, status: "ABSENT", source: "OFFICE", markedByUserId: adminUserId } });
  await as("ADMIN");
  expect((await assignPost(json("/api/v1/office/substitutions", { dateKey: today, slotId: slotP1, substituteMembershipId: teacherB }))).status).toBe(200);
  coverId = (await db.substitution.findUniqueOrThrow({ where: { slotId_dateKey: { slotId: slotP1, dateKey: today } }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const users = [adminUserId, principalUserId, userA, userB, userC];
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the covering teacher's answer", () => {
  it("my covers carry the row's id and no answer yet; anyone else's cover is 404; signed out is 401", async () => {
    await as("B");
    const mine = await (await mineGet(get("/api/v1/staff/substitutions/me"))).json();
    expect(mine.items).toHaveLength(1);
    expect(mine.items[0]).toMatchObject({ id: coverId, slotId: slotP1, acknowledgedAt: null, declinedAt: null, declineReason: null });
    await as("C");
    expect((await ack(coverId)).status).toBe(404);
    expect((await decline(coverId, { reason: "Not mine" })).status).toBe(404);
    await as("ADMIN");
    expect((await ack(coverId)).status).toBe(404);
    await as(null);
    expect((await ack(coverId)).status).toBe(401);
    expect(await db.substitution.findUniqueOrThrow({ where: { id: coverId }, select: { acknowledgedAt: true, declinedAt: true } })).toEqual({ acknowledgedAt: null, declinedAt: null });
  });

  it("acknowledging takes it (twice a no-op), the board shows it taken, and the audit row names the kind", async () => {
    await as("B");
    let res = await ack(coverId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ changed: true, state: "ACKNOWLEDGED" });
    res = await ack(coverId);
    expect(await res.json()).toEqual({ changed: false, state: "ACKNOWLEDGED" });
    const mine = await (await mineGet(get("/api/v1/staff/substitutions/me"))).json();
    expect(mine.items[0].acknowledgedAt).toBeTruthy();
    await as("PRINCIPAL");
    const board = await (await boardGet(get("/api/v1/office/substitutions"))).json();
    expect(board).toMatchObject({ covered: 1, uncovered: 0 });
    expect(board.lessons[0].substitute).toMatchObject({ membershipId: teacherB, declinedAt: null });
    expect(board.lessons[0].substitute.acknowledgedAt).toBeTruthy();
    expect(await db.auditLog.count({ where: { schoolId, action: "substitutions.acknowledge", targetId: coverId } })).toBe(1);
  });

  it("declining with a reason tells the office and the head once (event cover.declined), shows the lesson uncovered with the reason, frees the person for that period, and the same reason again is a no-op", async () => {
    await as("B");
    expect((await decline(coverId, {})).status).toBe(422);
    expect((await decline(coverId, { reason: "   " })).status).toBe(422);
    let res = await decline(coverId, { reason: "A clash with my own duty." });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ changed: true, state: "DECLINED" });
    res = await decline(coverId, { reason: "A clash with my own duty." });
    expect(await res.json()).toEqual({ changed: false, state: "DECLINED" });
    const told = await db.notification.findMany({ where: { schoolId, userId: { in: [adminUserId, principalUserId] } }, select: { userId: true, title: true, body: true, meta: true } });
    expect(told.map((n) => n.userId).sort()).toEqual([adminUserId, principalUserId].sort());
    expect(told[0]!.title).toContain("ZZ Cover Bhavna Cover");
    expect(told[0]!.body).toContain("A clash with my own duty.");
    expect(JSON.parse(told[0]!.meta)).toMatchObject({ event: "cover.declined", coverId });
    const mine = await (await mineGet(get("/api/v1/staff/substitutions/me"))).json();
    expect(mine.items[0]).toMatchObject({ acknowledgedAt: null, declineReason: "A clash with my own duty." });
    expect(mine.items[0].declinedAt).toBeTruthy();
    await as("ADMIN");
    const board = await (await boardGet(get("/api/v1/office/substitutions"))).json();
    expect(board).toMatchObject({ covered: 0, uncovered: 1 });
    expect(board.lessons[0].substitute).toMatchObject({ membershipId: teacherB, declineReason: "A clash with my own duty." });
    expect(board.absent[0]).toMatchObject({ lessons: 1, covered: 0 });
    // Bhavna said no, so she is free for the period again and carries no load from it.
    expect(board.lessons[0].candidates.find((c: { membershipId: string }) => c.membershipId === teacherB)).toMatchObject({ free: true, load: 0 });
    expect(await db.auditLog.count({ where: { schoolId, action: "substitutions.decline", targetId: coverId } })).toBe(1);
  });

  it("acknowledging after a decline takes the decline back; reassigning to someone else clears the answer, and the new person starts unanswered", async () => {
    await as("B");
    expect(await (await ack(coverId)).json()).toEqual({ changed: true, state: "ACKNOWLEDGED" });
    expect(await db.substitution.findUniqueOrThrow({ where: { id: coverId }, select: { declinedAt: true, declineReason: true } })).toEqual({ declinedAt: null, declineReason: null });
    await as("ADMIN");
    expect((await assignPost(json("/api/v1/office/substitutions", { dateKey: today, slotId: slotP1, substituteMembershipId: teacherC }))).status).toBe(200);
    const row = await db.substitution.findUniqueOrThrow({ where: { id: coverId }, select: { substituteMembershipId: true, acknowledgedAt: true, declinedAt: true } });
    expect(row).toEqual({ substituteMembershipId: teacherC, acknowledgedAt: null, declinedAt: null });
    // The cover is Chetan's now: Bhavna's answer is not found, Chetan's is taken.
    await as("B");
    expect((await ack(coverId)).status).toBe(404);
    await as("C");
    expect(await (await ack(coverId)).json()).toEqual({ changed: true, state: "ACKNOWLEDGED" });
  });
});
