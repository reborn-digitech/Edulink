/**
 * The substitution board through its handlers: the office reads the day's
 * lessons of staff who are away with who could take each, names a
 * substitute — the same one again a no-op, a clash refused, the absent
 * teacher refused for their own lesson — clears one, the substitute sees
 * their covers, and the school's teaching week is a setting that closes the
 * board on a day the school does not teach.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as boardGet, POST as assignPost } from "@/app/api/v1/office/substitutions/route";
import { POST as clearPost } from "@/app/api/v1/office/substitutions/clear/route";
import { GET as mineGet } from "@/app/api/v1/staff/substitutions/me/route";
import { GET as weekGet, POST as weekPost } from "@/app/api/v1/office/school-week/route";
import { GET as todayGet } from "@/app/api/v1/staff/today/route";
import { closedOn } from "@/lib/holidays";
import { channel, subscribe, type RealtimeEvent } from "@/lib/realtime";
import { addDaysToKey, parseTeachingDays, todayKey, weekdayOfKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let parentUserId = "";
let userA = "";
let userB = "";
let userC = "";
let teacherA = "";
let teacherB = "";
let teacherC = "";
let slotP1 = "";
let slotP2 = "";
const today = todayKey(TZ);
const weekday = weekdayOfKey(today);

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function as(who: "ADMIN" | "PRINCIPAL" | "A" | "B" | "C" | "PARENT" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "A") await createSession(userA, { schoolId, role: "TEACHER" });
  if (who === "B") await createSession(userB, { schoolId, role: "TEACHER" });
  if (who === "C") await createSession(userC, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  // The school teaches every day of the week for this test, so today — whatever it is — has a board.
  schoolId = (await db.school.create({ data: { name: `ZZ Subs School ${STAMP}`, slug: `zz-subs-${STAMP}`, code: `ZS${suffix}`, contactEmail: `zz-subs-${STAMP}@test.invalid`, timezone: TZ, teachingDays: "1,2,3,4,5,6,0" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Subs ${who}`, email: `zz-subs-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, a, b, c, parent, pupil] = await Promise.all([mk("Admin"), mk("Principal"), mk("Asha Away"), mk("Bhavna Free"), mk("Chetan Busy"), mk("Parent"), mk("Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  userA = a.id;
  userB = b.id;
  userC = c.id;
  parentUserId = parent.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }] });
  teacherA = (await db.membership.create({ data: { userId: userA, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  teacherB = (await db.membership.create({ data: { userId: userB, schoolId, role: "TEACHER", status: "ACTIVE", subjects: JSON.stringify(["Mathematics"]) }, select: { id: true } })).id;
  teacherC = (await db.membership.create({ data: { userId: userC, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSP${STAMP}` }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
  const [k1, k2] = await Promise.all([
    db.class.create({ data: { schoolId, name: "ZZ 7A", gradeLevel: "7", joinCode: `ZS1${suffix}` }, select: { id: true } }),
    db.class.create({ data: { schoolId, name: "ZZ 7B", gradeLevel: "7", joinCode: `ZS2${suffix}` }, select: { id: true } }),
  ]);
  const [p1, p2] = await Promise.all([
    db.timetablePeriod.create({ data: { schoolId, name: "ZZ P1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 }, select: { id: true } }),
    db.timetablePeriod.create({ data: { schoolId, name: "ZZ P2", startMinute: 585, endMinute: 630, kind: "LESSON", position: 2 }, select: { id: true } }),
  ]);
  slotP1 = (await db.timetableSlot.create({ data: { schoolId, classId: k1.id, periodId: p1.id, weekday, subject: "Mathematics", teacherMembershipId: teacherA }, select: { id: true } })).id;
  slotP2 = (await db.timetableSlot.create({ data: { schoolId, classId: k1.id, periodId: p2.id, weekday, subject: "English", teacherMembershipId: teacherA }, select: { id: true } })).id;
  // Chetan teaches 7B in the first period: busy for P1, free for P2.
  await db.timetableSlot.create({ data: { schoolId, classId: k2.id, periodId: p1.id, weekday, subject: "Science", teacherMembershipId: teacherC } });
  // Asha is absent today on the register.
  await db.staffAttendance.create({ data: { schoolId, membershipId: teacherA, dateKey: today, status: "ABSENT", source: "OFFICE", markedByUserId: adminUserId } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, userA, userB, userC, parentUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the teaching week", () => {
  it("parses the column: order Monday-first, junk dropped, empty falls back to Monday to Saturday", () => {
    expect(parseTeachingDays("1,2,3,4,5,6")).toEqual([1, 2, 3, 4, 5, 6]);
    expect(parseTeachingDays("0,6,1,x,9,1")).toEqual([1, 6, 0]);
    expect(parseTeachingDays("")).toEqual([1, 2, 3, 4, 5, 6]);
    expect(parseTeachingDays(null)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("the board", () => {
  it("401 signed out; a teacher and a guardian are refused; the office reads the day with the absent teacher's lessons and who could take each", async () => {
    await as(null);
    expect((await boardGet(get("/api/v1/office/substitutions"))).status).toBe(401);
    await as("A");
    expect((await boardGet(get("/api/v1/office/substitutions"))).status).toBe(403);
    await as("PARENT");
    expect((await boardGet(get("/api/v1/office/substitutions"))).status).toBe(403);
    await as("PRINCIPAL");
    const res = await boardGet(get("/api/v1/office/substitutions"));
    expect(res.status).toBe(200);
    const board = await res.json();
    expect(board).toMatchObject({ dateKey: today, closed: false, covered: 0, uncovered: 2 });
    expect(board.absent).toEqual([{ membershipId: teacherA, name: "ZZ Subs Asha Away", reason: "ABSENT", lessons: 2, covered: 0 }]);
    expect(board.lessons.map((l: { slotId: string }) => l.slotId)).toEqual([slotP1, slotP2]);
    const first = board.lessons[0];
    expect(first).toMatchObject({ subject: "Mathematics", className: "ZZ 7A", absentName: "ZZ Subs Asha Away", absentReason: "ABSENT", substitute: null });
    const names = first.candidates.map((c: { membershipId: string }) => c.membershipId);
    // Bhavna first: free and teaches the subject. Chetan is busy in P1. Asha is not offered her own lesson.
    expect(names[0]).toBe(teacherB);
    expect(names).not.toContain(teacherA);
    expect(first.candidates.find((c: { membershipId: string }) => c.membershipId === teacherB)).toMatchObject({ free: true, teachesSubject: true, load: 0 });
    expect(first.candidates.find((c: { membershipId: string }) => c.membershipId === teacherC)).toMatchObject({ free: false, load: 1 });
    expect(board.lessons[1].candidates.find((c: { membershipId: string }) => c.membershipId === teacherC)).toMatchObject({ free: true });
  });

  it("assigns — the same person again a no-op, a clash refused, the absent teacher refused, the wrong day refused — clears, and the substitute sees the covers on their Today", async () => {
    await as("ADMIN");
    // The office's open board hears each change on the school channel; a no-op says nothing.
    const heard: RealtimeEvent[] = [];
    const unsubscribe = subscribe([channel.school(schoolId)], (event) => heard.push(event));
    const assign = (body: unknown) => assignPost(json("/api/v1/office/substitutions", body));
    let res = await assign({ dateKey: today, slotId: slotP1, substituteMembershipId: teacherB });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ changed: true });
    expect(heard).toEqual([{ type: "substitution.updated", dateKey: today, slotId: slotP1 }]);
    res = await assign({ dateKey: today, slotId: slotP1, substituteMembershipId: teacherB });
    expect(await res.json()).toEqual({ changed: false });
    expect(heard).toHaveLength(1);
    expect((await assign({ dateKey: today, slotId: slotP1, substituteMembershipId: teacherC })).status).toBe(403);
    expect((await assign({ dateKey: today, slotId: slotP1, substituteMembershipId: teacherA })).status).toBe(403);
    expect((await assign({ dateKey: addDaysToKey(today, 1), slotId: slotP1, substituteMembershipId: teacherB })).status).toBe(403);
    expect((await assign({ dateKey: today, slotId: slotP2, substituteMembershipId: teacherC, note: "Worksheet on the desk" })).status).toBe(200);
    // Bhavna covers P1; a second cover for her in P1 would clash, but P2 is another period.
    expect((await assign({ dateKey: today, slotId: slotP2, substituteMembershipId: teacherB })).status).toBe(200);

    let board = await (await boardGet(get(`/api/v1/office/substitutions?date=${today}`))).json();
    expect(board).toMatchObject({ covered: 2, uncovered: 0 });
    expect(board.lessons[1].substitute).toMatchObject({ membershipId: teacherB, note: null });
    expect(board.absent[0]).toMatchObject({ lessons: 2, covered: 2 });

    // The substitute's own view, and the covers on Today.
    await as("B");
    const mine = await (await mineGet(get("/api/v1/staff/substitutions/me"))).json();
    expect(mine.dateKey).toBe(today);
    expect(mine.items.map((i: { slotId: string }) => i.slotId)).toEqual([slotP1, slotP2]);
    expect(mine.items[0]).toMatchObject({ subject: "Mathematics", className: "ZZ 7A", absentName: "ZZ Subs Asha Away", periodName: "ZZ P1" });
    const todayView = await (await todayGet()).json();
    expect(todayView.covers).toHaveLength(2);
    // Chetan was told he had P2 and then that it was taken off him.
    const chetan = await db.notification.findMany({ where: { userId: userC, schoolId }, orderBy: { createdAt: "asc" }, select: { kind: true, meta: true } });
    expect(chetan).toHaveLength(2);
    expect(chetan.every((n) => n.kind === "SYSTEM")).toBe(true);
    await as("A");
    expect((await mineGet(get("/api/v1/staff/substitutions/me"))).status).toBe(200);
    await expect((await mineGet(get("/api/v1/staff/substitutions/me"))).json().then((v) => v.items)).resolves.toEqual([]);

    await as("PRINCIPAL");
    heard.length = 0;
    res = await clearPost(json("/api/v1/office/substitutions/clear", { dateKey: today, slotId: slotP2 }));
    expect(await res.json()).toEqual({ changed: true });
    expect(heard).toEqual([{ type: "substitution.updated", dateKey: today, slotId: slotP2 }]);
    res = await clearPost(json("/api/v1/office/substitutions/clear", { dateKey: today, slotId: slotP2 }));
    expect(await res.json()).toEqual({ changed: false });
    expect(heard).toHaveLength(1);
    unsubscribe();
    board = await (await boardGet(get("/api/v1/office/substitutions"))).json();
    expect(board).toMatchObject({ covered: 1, uncovered: 1 });
    await as("B");
    expect((await assignPost(json("/api/v1/office/substitutions", { dateKey: today, slotId: slotP2, substituteMembershipId: teacherB }))).status).toBe(403);

    const rows = await db.auditLog.findMany({ where: { schoolId, action: { in: ["substitutions.assign", "substitutions.clear"] } }, select: { action: true, meta: true } });
    expect(rows.map((r) => r.action).sort()).toEqual(["substitutions.assign", "substitutions.assign", "substitutions.assign", "substitutions.clear"]);
    expect(rows.every((r) => !(r.meta ?? "").includes("Asha") && !(r.meta ?? "").includes("Worksheet"))).toBe(true);
  });

  it("the school's week is a setting: a day dropped from it closes the board and the timetable's slots on it are counted; a teacher may not set it", async () => {
    await as("B");
    expect((await weekGet())).toHaveProperty("status", 403);
    expect((await weekPost(json("/api/v1/office/school-week", { days: [1, 2, 3, 4, 5] }))).status).toBe(403);
    // The head reads the week and may not set it: the week is how the school is set up.
    await as("PRINCIPAL");
    expect(await (await weekGet()).json()).toEqual({ days: [1, 2, 3, 4, 5, 6, 0] });
    expect((await weekPost(json("/api/v1/office/school-week", { days: [1, 2, 3, 4, 5] }))).status).toBe(403);
    await as("ADMIN");
    expect(await (await weekGet()).json()).toEqual({ days: [1, 2, 3, 4, 5, 6, 0] });
    const without = [1, 2, 3, 4, 5, 6, 0].filter((d) => d !== weekday);
    let res = await weekPost(json("/api/v1/office/school-week", { days: without }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ days: parseTeachingDays(without.join(",")), orphanedSlots: 3 });
    expect((await closedOn(schoolId, today)).teachingDay).toBe(false);
    const board = await (await boardGet(get("/api/v1/office/substitutions"))).json();
    expect(board).toMatchObject({ closed: true, lessons: [], absent: [] });
    expect((await assignPost(json("/api/v1/office/substitutions", { dateKey: today, slotId: slotP2, substituteMembershipId: teacherB }))).status).toBe(403);
    expect((await weekPost(json("/api/v1/office/school-week", { days: [] }))).status).toBe(422);
    res = await weekPost(json("/api/v1/office/school-week", { days: [0, 1, 2, 3, 4, 5, 6] }));
    expect(await res.json()).toEqual({ days: [1, 2, 3, 4, 5, 6, 0], orphanedSlots: 0 });
    expect((await closedOn(schoolId, today)).teachingDay).toBe(true);
    const audits = await db.auditLog.findMany({ where: { schoolId, action: "school.week" }, select: { id: true } });
    expect(audits).toHaveLength(2);
  });
});
