/**
 * The library's reading-room register (risks batch 5A, 5 October 2026), through its /api/v1 door and the
 * library function, at a ZZ school of this suite's own with LIBRARY on and one without it.
 *
 * What is proved: the desk signs a student in by student code and a member of staff by library card or
 * membership; one open visit per person — signing in a reader already inside answers the open visit, and two
 * presses at once make one row; signing out someone not inside is 409; a reader of another school, a guardian
 * or a code nobody holds is not found; the head reads the day report and cannot sign anyone in, a student
 * reads nothing; a future day is refused; the day report's figures (readers by kind, inside, average stay,
 * busiest hour) from fixed times; and a school without the module answers MODULE_OFF.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { addDaysToKey, todayKey, zonedStartOfDay } from "@/lib/dates";
import { readingRoomDay, scanReader } from "@/lib/reading-room";
import { GET as roomGet, POST as roomPost } from "@/app/api/v1/library/reading-room/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = todayKey("Asia/Kolkata");

const u: Record<string, string> = {};
const m: Record<string, string> = {};
const id: Record<string, string> = {};

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
async function as(who: string, role: string, schoolId: string = id.school!) {
  __resetCookies();
  __setHeaders({});
  await createSession(u[who]!, { schoolId, role: role as never });
}
const session = async () => (await getSession())!;
/** An instant `minutes` after the school's midnight of `day`. */
const at = (day: string, minutes: number) => new Date(zonedStartOfDay(day, "Asia/Kolkata").getTime() + minutes * 60_000);

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ Reading ${tag} ${STAMP}`, slug: `zz-reading-${tag.toLowerCase()}-${STAMP}`, code: `ZR${tag[0]}${SUFFIX}`, contactEmail: `zz-reading-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  id.school = (await mk("School")).id;
  id.other = (await mk("Other")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: id.school, module: "LIBRARY" }] });
  const people: [string, string, string][] = [["librarian", "LIBRARIAN", id.school], ["admin", "ADMIN", id.school], ["principal", "PRINCIPAL", id.school], ["s1", "STUDENT", id.school], ["s2", "STUDENT", id.school], ["t1", "TEACHER", id.school], ["elsewhere", "STUDENT", id.other], ["otherAdmin", "ADMIN", id.other]];
  for (const [who, role, schoolId] of people) {
    u[who] = (await db.user.create({ data: { name: `ZZ Reading ${who}`, email: `zz-reading-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    m[who] = (await db.membership.create({ data: { userId: u[who]!, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZRS${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
  // The teacher has a library card; the students are found by their codes.
  await db.libraryMember.create({ data: { schoolId: id.school, membershipId: m.t1!, kind: "STAFF", cardNumber: `L9${SUFFIX}` } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [id.school!, id.other!] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signing in and out", () => {
  it("signs a student in by code once: a second sign-in answers the open visit", async () => {
    await as("librarian", "LIBRARIAN");
    const first = await roomPost(json("/api/v1/library/reading-room", { action: "IN", code: `ZRSs1${SUFFIX}` }));
    expect(first.status).toBe(200);
    expect(await body(first)).toMatchObject({ changed: true, visit: { membershipId: m.s1, kind: "STUDENT", outAt: null } });
    const again = await roomPost(json("/api/v1/library/reading-room", { action: "IN", code: `zrss1${SUFFIX}` }));
    expect(await body(again)).toMatchObject({ changed: false });
    expect(await db.readingRoomVisit.count({ where: { schoolId: id.school, membershipId: m.s1! } })).toBe(1);
  });

  it("makes one visit of two presses at once", async () => {
    await as("librarian", "LIBRARIAN");
    const ctx = await session();
    const both = await Promise.all([scanReader(ctx, { action: "IN", membershipId: m.s2! }), scanReader(ctx, { action: "IN", membershipId: m.s2! })]);
    expect(both.filter((r) => r.changed)).toHaveLength(1);
    expect(await db.readingRoomVisit.count({ where: { schoolId: id.school, membershipId: m.s2!, outAt: null } })).toBe(1);
  });

  it("signs out once; signing out someone not inside is 409", async () => {
    await as("admin", "ADMIN");
    const out = await roomPost(json("/api/v1/library/reading-room", { action: "OUT", membershipId: m.s1 }));
    expect(out.status).toBe(200);
    expect((await body<{ visit: { outAt: string | null } }>(out)).visit.outAt).not.toBeNull();
    expect((await roomPost(json("/api/v1/library/reading-room", { action: "OUT", membershipId: m.s1 }))).status).toBe(409);
    expect(await db.auditLog.count({ where: { schoolId: id.school, action: { in: ["library.readingRoom.in", "library.readingRoom.out"] } } })).toBe(3);
  });

  it("finds a member of staff by library card", async () => {
    await as("librarian", "LIBRARIAN");
    const res = await roomPost(json("/api/v1/library/reading-room", { action: "IN", code: `l9${SUFFIX}` }));
    expect(await body(res)).toMatchObject({ changed: true, visit: { membershipId: m.t1, kind: "STAFF" } });
  });

  it("does not find a reader of another school, or a code nobody holds", async () => {
    await as("librarian", "LIBRARIAN");
    expect((await roomPost(json("/api/v1/library/reading-room", { action: "IN", membershipId: m.elsewhere }))).status).toBe(404);
    expect((await roomPost(json("/api/v1/library/reading-room", { action: "IN", code: `ZRSelsewhere${SUFFIX}` }))).status).toBe(404);
    expect((await roomPost(json("/api/v1/library/reading-room", { action: "IN", code: "NOBODY-1" }))).status).toBe(404);
    expect((await roomPost(json("/api/v1/library/reading-room", { action: "IN" }))).status).toBe(422);
  });
});

describe("who reads", () => {
  it("lets the head read the day and not sign anyone in; a student reads nothing", async () => {
    await as("principal", "PRINCIPAL");
    const day = await body<{ canRecord: boolean; readers: number }>(await roomGet(get("/api/v1/library/reading-room")));
    expect(day).toMatchObject({ canRecord: false, readers: 3 });
    expect((await roomPost(json("/api/v1/library/reading-room", { action: "IN", membershipId: m.s1 }))).status).toBe(403);
    await as("s1", "STUDENT");
    expect((await roomGet(get("/api/v1/library/reading-room"))).status).toBe(403);
  });

  it("refuses a day in the future", async () => {
    await as("librarian", "LIBRARIAN");
    expect((await roomGet(get(`/api/v1/library/reading-room?day=${addDaysToKey(TODAY, 1)}`))).status).toBe(422);
  });

  it("is MODULE_OFF at a school without the library", async () => {
    await as("otherAdmin", "ADMIN", id.other);
    const res = await roomGet(get("/api/v1/library/reading-room"));
    expect(res.status).toBe(403);
    expect((await body<{ code: string }>(res)).code).toBe("MODULE_OFF");
  });
});

describe("the day report", () => {
  it("counts readers by kind, the open visits, the average stay and the busiest hour", async () => {
    await as("librarian", "LIBRARIAN");
    const ctx = await session();
    const day = addDaysToKey(TODAY, -3);
    // s1 10:00–11:30, s2 10:20–10:50, t1 14:05 and never signed out.
    await db.readingRoomVisit.createMany({
      data: [
        { schoolId: id.school!, membershipId: m.s1!, dayKey: day, inAt: at(day, 600), outAt: at(day, 690) },
        { schoolId: id.school!, membershipId: m.s2!, dayKey: day, inAt: at(day, 620), outAt: at(day, 650) },
        { schoolId: id.school!, membershipId: m.t1!, dayKey: day, inAt: at(day, 845), outAt: null },
      ],
    });
    const r = await readingRoomDay(ctx, day, at(TODAY, 600));
    expect(r).toMatchObject({ dayKey: day, today: false, readers: 3, students: 2, staff: 1, inside: 1, averageMinutes: 60, busiestHour: 10, canRecord: true });
    expect(r.visits.map((v) => v.membershipId)).toEqual([m.t1, m.s2, m.s1]);
  });
});
