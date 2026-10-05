/**
 * The night-out register and the curfew at the gate (5 Oct 2026; the warden's campaign recommendation, office
 * decision 9 "stored, not enforced"). At a college an outing (LOCAL) coming back after the hostel's curfew that
 * evening is late even before the leave's end; a night out and a trip home are due at their own end; a school's
 * hostel keeps no curfew. The night's register lists every approved leave covering it, due back by when, and where
 * each stands, the ones not back with the time past first.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateIn, gateOut } from "@/lib/hostel";
import { curfewInstant, dueBack, nightRegister, returnIsLate } from "@/lib/hostel-night";
import { zonedStartOfDay } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const DAY = "2026-09-15";
/** An instant on DAY at hh:mm in the school's zone (IST, no daylight saving). */
const at = (hhmm: string, day = DAY) => new Date(`${day}T${hhmm}:00+05:30`);
const ids = { college: "", school: "", users: [] as string[], wardenC: "", wardenS: "", boarders: {} as Record<string, string>, leaves: {} as Record<string, string> };

async function ctxAs(userId: string, schoolId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

async function house(schoolId: string, tag: string, wardenUserId: string) {
  await db.schoolModule.create({ data: { schoolId, module: "HOSTEL" } });
  const warden = await db.membership.create({ data: { userId: wardenUserId, schoolId, role: "WARDEN", status: "ACTIVE" }, select: { id: true } });
  const hostel = await db.hostel.create({ data: { schoolId, name: `ZZ Night House ${tag}`, kind: "MIXED", wardenMembershipId: warden.id, curfewMinute: 21 * 60 + 30, nightOutAllowed: true }, select: { id: true } });
  const room = await db.hostelRoom.create({ data: { schoolId, hostelId: hostel.id, number: `N${tag}1`, beds: 4 }, select: { id: true } });
  return { hostelId: hostel.id, roomId: room.id };
}

async function boarder(schoolId: string, roomId: string, name: string, bed: number, wardenUserId: string) {
  const u = await db.user.create({ data: { name, email: `zz-night-${name.toLowerCase().replace(/\W/g, "")}-${STAMP}@test.invalid`, birthdate: new Date("2005-01-01T00:00:00Z"), isMinor: false }, select: { id: true } });
  ids.users.push(u.id);
  const m = await db.membership.create({ data: { userId: u.id, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  const a = await db.hostelAllotment.create({ data: { schoolId, membershipId: m.id, roomId, bed, fromDate: "2026-07-01", status: "ACTIVE", allottedByUserId: wardenUserId }, select: { id: true } });
  return { membershipId: m.id, allotmentId: a.id };
}

async function approved(schoolId: string, who: { membershipId: string; allotmentId: string }, kind: string, fromAt: Date, toAt: Date, byUserId: string) {
  return (await db.hostelLeave.create({ data: { schoolId, allotmentId: who.allotmentId, membershipId: who.membershipId, kind, fromAt, toAt, destination: "ZZ Town", status: "APPROVED", requestedByUserId: byUserId, decidedAt: fromAt, decidedByUserId: byUserId }, select: { id: true } })).id;
}

beforeAll(async () => {
  const mk = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ Night ${tag} ${STAMP}`, slug: `zz-night-${tag.toLowerCase()}-${STAMP}`, code: `ZN${tag[0]}${SUFFIX}`, contactEmail: `zz-night-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ, kind }, select: { id: true } });
  ids.college = (await mk("College", "COLLEGE")).id;
  ids.school = (await mk("School", "SCHOOL")).id;
  for (const who of ["WardenC", "WardenS"]) {
    const u = await db.user.create({ data: { name: `ZZ Night ${who}`, email: `zz-night-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
    ids.users.push(u.id);
    if (who === "WardenC") ids.wardenC = u.id;
    else ids.wardenS = u.id;
  }
  const c = await house(ids.college, "C", ids.wardenC);
  const s = await house(ids.school, "S", ids.wardenS);
  const outing = await boarder(ids.college, c.roomId, "ZZ Outing Asha", 1, ids.wardenC);
  const nightOut = await boarder(ids.college, c.roomId, "ZZ NightOut Kunal", 2, ids.wardenC);
  const stillOut = await boarder(ids.college, c.roomId, "ZZ StillOut Meera", 3, ids.wardenC);
  const schoolOuting = await boarder(ids.school, s.roomId, "ZZ School Outing Ravi", 1, ids.wardenS);
  // An outing from 18:00 until 23:30: at a college the curfew (21:30) comes first.
  ids.leaves.outing = await approved(ids.college, outing, "LOCAL", at("18:00"), at("23:30"), ids.wardenC);
  // A night out until 08:00 the next morning: due at its own end.
  ids.leaves.nightOut = await approved(ids.college, nightOut, "NIGHT_OUT", at("19:00"), at("08:00", "2026-09-16"), ids.wardenC);
  // Another outing, gone out and not back.
  ids.leaves.stillOut = await approved(ids.college, stillOut, "LOCAL", at("17:00"), at("22:00"), ids.wardenC);
  // The same outing at a school: no curfew.
  ids.leaves.schoolOuting = await approved(ids.school, schoolOuting, "LOCAL", at("18:00"), at("23:30"), ids.wardenS);
});

afterAll(async () => {
  __resetCookies();
  await db.notification.deleteMany({ where: { userId: { in: ids.users } } });
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college, ids.school] } } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("the curfew rule", () => {
  const college = { college: true, curfewMinute: 21 * 60 + 30, timeZone: TZ };
  it("puts the curfew on the evening the outing began, and an outing due back by it at a college", () => {
    expect(curfewInstant(at("18:00"), 21 * 60 + 30, TZ).toISOString()).toBe(at("21:30").toISOString());
    expect(curfewInstant(at("18:00"), 21 * 60 + 30, TZ).getTime() - zonedStartOfDay(DAY, TZ).getTime()).toBe((21 * 60 + 30) * 60_000);
    expect(dueBack({ kind: "LOCAL", fromAt: at("18:00"), toAt: at("23:30") }, college)).toEqual({ at: at("21:30"), curfew: true });
    // An outing ending before the curfew is due at its end.
    expect(dueBack({ kind: "LOCAL", fromAt: at("15:00"), toAt: at("19:00") }, college)).toEqual({ at: at("19:00"), curfew: false });
    // A night out, a trip home: their own end.
    expect(dueBack({ kind: "NIGHT_OUT", fromAt: at("19:00"), toAt: at("08:00", "2026-09-16") }, college).curfew).toBe(false);
    expect(returnIsLate({ kind: "LOCAL", fromAt: at("18:00"), toAt: at("23:30") }, college, at("21:45"))).toBe(true);
    expect(returnIsLate({ kind: "LOCAL", fromAt: at("18:00"), toAt: at("23:30") }, { ...college, college: false }, at("21:45"))).toBe(false);
  });
});

describe("the gate and the night's register", () => {
  it("marks an outing back after the curfew late at a college, and not at a school", async () => {
    const warden = await ctxAs(ids.wardenC, ids.college, "WARDEN");
    await gateOut(warden, ids.leaves.outing!);
    const back = await gateIn(warden, ids.leaves.outing!, at("21:45"));
    expect(back.late).toBe(true);
    await gateOut(warden, ids.leaves.nightOut!);
    expect((await gateIn(warden, ids.leaves.nightOut!, at("07:30", "2026-09-16"))).late).toBe(false);
    await gateOut(warden, ids.leaves.stillOut!);
    const schoolWarden = await ctxAs(ids.wardenS, ids.school, "WARDEN");
    await gateOut(schoolWarden, ids.leaves.schoolOuting!);
    expect((await gateIn(schoolWarden, ids.leaves.schoolOuting!, at("21:45"))).late).toBe(false);
  });

  it("lists the night: the one not back past the curfew first, then those back late and back", async () => {
    const warden = await ctxAs(ids.wardenC, ids.college, "WARDEN");
    const night = await nightRegister(warden, DAY, at("23:00"));
    expect(night.college).toBe(true);
    expect(night.hostels.map((h) => h.curfewMinute)).toEqual([21 * 60 + 30]);
    expect(night.leaves.map((l) => [l.name, l.state, l.curfew])).toEqual([
      ["ZZ StillOut Meera", "OVERDUE", true],
      ["ZZ Outing Asha", "BACK_LATE", true],
      ["ZZ NightOut Kunal", "BACK", false],
    ]);
    // Read at 21:00 the one still out is not yet overdue.
    expect((await nightRegister(warden, DAY, at("21:00"))).leaves.find((l) => l.name === "ZZ StillOut Meera")?.state).toBe("OUT");
    // A school's register keeps no curfew.
    const schoolWarden = await ctxAs(ids.wardenS, ids.school, "WARDEN");
    const schoolNight = await nightRegister(schoolWarden, DAY, at("23:00"));
    expect(schoolNight.college).toBe(false);
    expect(schoolNight.leaves.map((l) => [l.state, l.curfew])).toEqual([["BACK", false]]);
  });

  it("is the hostel's staff's alone", async () => {
    const studentUser = (await db.membership.findFirstOrThrow({ where: { schoolId: ids.college, role: "STUDENT" }, select: { userId: true } })).userId;
    const student = await ctxAs(studentUser, ids.college, "STUDENT");
    await expect(nightRegister(student, DAY)).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
  });
});
