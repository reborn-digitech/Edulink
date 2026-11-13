/**
 * The hostel findings of the 'campus-transport-hostel' batch of the testing analysis of 13 November 2026.
 *
 *   TA-050  a room change left a pending or approved expulsion on the ended place, so it ended nothing; so did a
 *           bed given up and given again before an approved expulsion's day.
 *   TA-557  a room change left the boarder's leave on the ended place: the sheet said PRESENT, not on leave.
 *   TA-295  a taken roll call was drawn from the places live now, so a moved boarder read PRESENT and the
 *           office's correction, posting the sheet's rows, was refused whole.
 *   TA-054  a roll call sent later from the outbox was refused whole when one boarder's place changed in between.
 *   TA-052  a place's own dates were stored and not read: a last day ahead ended the place at once, a first
 *           day ahead put the pupil on tonight's roll call. Both are now refused, and the year's walk
 *           (scripts/zz-lifecycle.ts) gives and gives up its beds on their own days.
 *   TA-298  a hostel incident was stamped "guardians told" when nobody was told.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) with HOSTEL on: one hostel of two
 * rooms, a warden and a principal; each case gives its own pupils their beds.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { allotBed, correctRollCall, endAllotment, familyHostel, hostelIncidents, listBoarders, recordHostelIncident, rollCallSheet, takeRollCall } from "@/lib/hostel";
import { changeRoom } from "@/lib/college-campus";
import { decideExpulsion, proposeExpulsion } from "@/lib/head-approvals";

let c: College;
let today = "";
const warden = { userId: "", membershipId: "" };
const principal = { userId: "", membershipId: "" };
const ids = { hostel: "", room1: "", room2: "" };
let n = 0;

async function staff(who: string, role: string) {
  const u = await c.db.user.create({ data: { name: `ZZ TA CTH ${who}`, email: `zz-tacons-hostel-${who}-${c.stamp}@test.invalid`, prefs: "{}" }, select: { id: true } });
  const m = await c.db.membership.create({ data: { userId: u.id, schoolId: c.schoolId, role, status: "ACTIVE" }, select: { id: true } });
  return { userId: u.id, membershipId: m.id };
}

/** A new adult pupil of the college with a bed in room 1, bed `bed`, from today. */
async function boarder(bed: number) {
  const p = await c.addStudent(`b${++n}`, true);
  const b = await allotBed(c.ctx(warden, "WARDEN"), { membershipId: p.membershipId, roomId: ids.room1, bed, fromDate: today, feeDemandId: null });
  return { ...p, allotmentId: b.allotmentId };
}

beforeAll(async () => {
  c = await makeCollege("hostel");
  today = todayKey("Asia/Kolkata");
  await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "HOSTEL" } });
  Object.assign(warden, await staff("warden", "WARDEN"));
  Object.assign(principal, await staff("principal", "PRINCIPAL"));
  ids.hostel = (await c.db.hostel.create({ data: { schoolId: c.schoolId, name: `ZZ TA CTH Hall ${c.stamp}`, kind: "MIXED", capacity: 40 }, select: { id: true } })).id;
  ids.room1 = (await c.db.hostelRoom.create({ data: { schoolId: c.schoolId, hostelId: ids.hostel, number: "101", beds: 20 }, select: { id: true } })).id;
  ids.room2 = (await c.db.hostelRoom.create({ data: { schoolId: c.schoolId, hostelId: ids.hostel, number: "201", beds: 20 }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await c.cleanup();
});

const W = () => c.ctx(warden, "WARDEN");
const boarderIds = async () => (await listBoarders(W(), ids.hostel)).items.map((b) => b.membershipId);

describe("TA-050: a room change carries the place's expulsion", () => {
  it("TA-050: proposed, then moved, then approved: on the day the boarder's new place has ended", async () => {
    const p = await boarder(1);
    const x = await proposeExpulsion(W(), { allotmentId: p.allotmentId, reason: "ZZ TA-050 a serious breach", incidentId: null, effectiveOn: addDaysToKey(today, 5) });
    const moved = await changeRoom(W(), { allotmentId: p.allotmentId, roomId: ids.room2, bed: 1 });
    expect(moved.allotmentId).not.toBe(p.allotmentId);
    await decideExpulsion(c.ctx(principal, "PRINCIPAL"), x.id, { approve: true, note: "" });
    expect(await boarderIds()).toContain(p.membershipId);
    // The day comes (as tests/smaller-security-items.test.ts brings it).
    await c.db.hostelExpulsion.update({ where: { id: x.id }, data: { effectiveOn: addDaysToKey(today, -1) } });
    expect(await boarderIds()).not.toContain(p.membershipId);
  });

  it("TA-050: approved, then moved before the day: on the day the new place has ended", async () => {
    const p = await boarder(2);
    const x = await proposeExpulsion(W(), { allotmentId: p.allotmentId, reason: "ZZ TA-050 a second breach", incidentId: null, effectiveOn: addDaysToKey(today, 5) });
    await decideExpulsion(c.ctx(principal, "PRINCIPAL"), x.id, { approve: true, note: "" });
    await changeRoom(W(), { allotmentId: p.allotmentId, roomId: ids.room2, bed: 2 });
    expect(await boarderIds()).toContain(p.membershipId);
    await c.db.hostelExpulsion.update({ where: { id: x.id }, data: { effectiveOn: addDaysToKey(today, -1) } });
    expect(await boarderIds()).not.toContain(p.membershipId);
  });
});

describe("TA-050: an approval of a place already ended", () => {
  it("TA-050: the bed given up while the proposal waits: the principal's approval is refused, a refusal still goes through", async () => {
    const p = await boarder(13);
    const x = await proposeExpulsion(W(), { allotmentId: p.allotmentId, reason: "ZZ TA-050 a third breach", incidentId: null, effectiveOn: addDaysToKey(today, 5) });
    await endAllotment(W(), p.allotmentId, today);
    await expect(decideExpulsion(c.ctx(principal, "PRINCIPAL"), x.id, { approve: true, note: "" })).rejects.toMatchObject({ key: "collegeDesks.refuseExpulsionNotActive" });
    expect((await c.db.hostelExpulsion.findUniqueOrThrow({ where: { id: x.id }, select: { status: true } })).status).toBe("ASKED");
    expect((await decideExpulsion(c.ctx(principal, "PRINCIPAL"), x.id, { approve: false, note: "" })).status).toBe("REFUSED");
  });

  it("TA-050: approved, then the bed given up and given again before the day: on the day the new place has ended", async () => {
    const p = await boarder(14);
    const x = await proposeExpulsion(W(), { allotmentId: p.allotmentId, reason: "ZZ TA-050 a fourth breach", incidentId: null, effectiveOn: addDaysToKey(today, 5) });
    await decideExpulsion(c.ctx(principal, "PRINCIPAL"), x.id, { approve: true, note: "" });
    await endAllotment(W(), p.allotmentId, today);
    const again = await allotBed(W(), { membershipId: p.membershipId, roomId: ids.room2, bed: 14, fromDate: today, feeDemandId: null });
    expect(again.allotmentId).not.toBe(p.allotmentId);
    expect((await c.db.hostelExpulsion.findUniqueOrThrow({ where: { id: x.id }, select: { allotmentId: true } })).allotmentId).toBe(again.allotmentId);
    const row = await c.db.auditLog.findFirst({ where: { schoolId: c.schoolId, action: "hostel.allot", targetId: again.allotmentId }, select: { meta: true } });
    expect(JSON.parse(row?.meta ?? "{}")).toMatchObject({ expulsionsCarried: 1 });
    expect(await boarderIds()).toContain(p.membershipId);
    await c.db.hostelExpulsion.update({ where: { id: x.id }, data: { effectiveOn: addDaysToKey(today, -1) } });
    expect(await boarderIds()).not.toContain(p.membershipId);
  });

  it("TA-050: an expulsion whose day has passed is not carried to a bed given afterwards", async () => {
    const p = await boarder(15);
    const x = await proposeExpulsion(W(), { allotmentId: p.allotmentId, reason: "ZZ TA-050 a fifth breach", incidentId: null, effectiveOn: addDaysToKey(today, 5) });
    await decideExpulsion(c.ctx(principal, "PRINCIPAL"), x.id, { approve: true, note: "" });
    await endAllotment(W(), p.allotmentId, today);
    await c.db.hostelExpulsion.update({ where: { id: x.id }, data: { effectiveOn: today } });
    const again = await allotBed(W(), { membershipId: p.membershipId, roomId: ids.room2, bed: 15, fromDate: today, feeDemandId: null });
    expect((await c.db.hostelExpulsion.findUniqueOrThrow({ where: { id: x.id }, select: { allotmentId: true } })).allotmentId).toBe(p.allotmentId);
    expect(await boarderIds()).toContain(p.membershipId);
    expect(again.allotmentId).not.toBe(p.allotmentId);
  });
});

describe("TA-557: a room change carries the boarder's leave", () => {
  it("TA-557: a boarder out on approved leave and moved reads ON_LEAVE on tonight's sheet", async () => {
    const p = await boarder(3);
    const now = Date.now();
    await c.db.hostelLeave.create({ data: { schoolId: c.schoolId, allotmentId: p.allotmentId, membershipId: p.membershipId, kind: "HOME", fromAt: new Date(now - 3_600_000), toAt: new Date(now + 86_400_000), destination: "ZZ home", status: "APPROVED", requestedByUserId: p.userId, outAt: new Date(now - 1_800_000), outByUserId: warden.userId } });
    const moved = await changeRoom(W(), { allotmentId: p.allotmentId, roomId: ids.room2, bed: 3 });
    const sheet = await rollCallSheet(W(), ids.hostel, "NIGHT", today);
    const row = sheet.entries.find((e) => e.membershipId === p.membershipId)!;
    expect(row.allotmentId).toBe(moved.allotmentId);
    expect(row.onLeave).toBe(true);
    expect(row.status).toBe("ON_LEAVE");
    const listed = (await listBoarders(W(), ids.hostel)).items.find((b) => b.membershipId === p.membershipId)!;
    expect(listed.onLeave).toBe(true);
  });
});

describe("TA-054 and TA-295: a roll call when a place changed", () => {
  it("TA-054: a sheet replayed after one boarder moved and another gave up the bed is stored for the rest, the mover under the new place", async () => {
    const a = await boarder(4);
    const b = await boarder(5);
    const g = await boarder(6);
    const sheet = await rollCallSheet(W(), ids.hostel, "MORNING", today);
    const body = { hostelId: ids.hostel, dateKey: today, slot: "MORNING" as const, clientId: `zz-ta054-${c.stamp}`, entries: sheet.entries.map((e) => ({ allotmentId: e.allotmentId, status: e.membershipId === a.membershipId ? ("ABSENT" as const) : ("PRESENT" as const) })) };
    // Between the sheet and its replay: one boarder is moved, another gives up the bed.
    const moved = await changeRoom(W(), { allotmentId: a.allotmentId, roomId: ids.room2, bed: 4 });
    await endAllotment(W(), g.allotmentId, today);
    const r = await takeRollCall(W(), body);
    expect(r.replay).toBe(false);
    expect(r.skipped).toBe(1);
    const stored = await c.db.hostelRollCallEntry.findMany({ where: { rollCallId: r.rollCallId }, select: { allotmentId: true, membershipId: true, status: true } });
    expect(stored.find((e) => e.membershipId === a.membershipId)).toEqual({ allotmentId: moved.allotmentId, membershipId: a.membershipId, status: "ABSENT" });
    expect(stored.some((e) => e.membershipId === b.membershipId)).toBe(true);
    expect(stored.some((e) => e.membershipId === g.membershipId)).toBe(false);
    // The moved boarder's own page reads the entry on the place they hold now (TA-295).
    expect((await familyHostel(c.ctx(a, "STUDENT"))).tonight.status).toBe("ABSENT");
    // The same sheet sent again is the same call.
    expect((await takeRollCall(W(), body)).replay).toBe(true);
  });

  it("TA-295: a taken call is drawn from its own entries, so a boarder marked ABSENT and then moved still reads ABSENT, and the office's correction of the sheet's rows goes through", async () => {
    const a = await boarder(7);
    const date = addDaysToKey(today, -1);
    const sheet = await rollCallSheet(W(), ids.hostel, "NIGHT", date);
    const r = await takeRollCall(W(), { hostelId: ids.hostel, dateKey: date, slot: "NIGHT", clientId: `zz-ta295-${c.stamp}`, entries: sheet.entries.map((e) => ({ allotmentId: e.allotmentId, status: e.membershipId === a.membershipId ? ("ABSENT" as const) : ("PRESENT" as const) })) });
    await changeRoom(W(), { allotmentId: a.allotmentId, roomId: ids.room2, bed: 7 });
    // A boarder given a bed after the call was not on it.
    const late = await boarder(8);
    const after = await rollCallSheet(c.ctx(c.admin, "ADMIN"), ids.hostel, "NIGHT", date);
    expect(after.entries.find((e) => e.membershipId === a.membershipId)?.status).toBe("ABSENT");
    expect(after.entries.some((e) => e.membershipId === late.membershipId)).toBe(false);
    const fixed = await correctRollCall(c.ctx(c.admin, "ADMIN"), r.rollCallId, { reason: "ZZ TA-295 was in the common room", entries: after.entries.map((e) => ({ allotmentId: e.allotmentId, status: e.membershipId === a.membershipId ? ("PRESENT" as const) : e.status })) });
    expect(fixed.changed).toBe(1);
  });
});

describe("TA-052: a place's dates are not ahead of today", () => {
  it("TA-052: a last day ahead is refused and the boarder stays; a first day ahead is refused", async () => {
    const p = await boarder(9);
    await expect(endAllotment(W(), p.allotmentId, addDaysToKey(today, 5))).rejects.toMatchObject({ key: "hostel.refuseEndAhead" });
    expect(await boarderIds()).toContain(p.membershipId);
    const q = await c.addStudent(`b${++n}`, true);
    await expect(allotBed(W(), { membershipId: q.membershipId, roomId: ids.room1, bed: 10, fromDate: addDaysToKey(today, 5), feeDemandId: null })).rejects.toMatchObject({ key: "hostel.refuseFromAhead" });
    expect(await boarderIds()).not.toContain(q.membershipId);
  });

  it("TA-052: the year's walk (scripts/zz-lifecycle.ts) gives and gives up its beds on their own days, which the refusals allow", () => {
    const src = readFileSync(join(process.cwd(), "scripts", "zz-lifecycle.ts"), "utf8");
    // The day of the nearest setClock before a call: the simulated today the call runs on.
    const clockBefore = (call: string) => {
      const at = src.indexOf(call);
      expect(at).toBeGreaterThan(0);
      const clocks = [...src.slice(0, at).matchAll(/setClock\(([^,)]+)/g)];
      return clocks[clocks.length - 1]?.[1];
    };
    expect(src).toMatch(/L\.hostel\.allotBed\([^)]*fromDate: start\b/);
    expect(clockBefore("L.hostel.allotBed(")).toBe("start");
    expect(src).toMatch(/L\.hostel\.endAllotment\(W\.warden\.ctx, id, end\)/);
    expect(clockBefore("L.hostel.endAllotment(")).toBe("end");
  });
});

describe("TA-298: 'guardians told' only when somebody was told", () => {
  it("TA-298: an adult boarder who granted nothing: the incident is not stamped and no guardian is told", async () => {
    const p = await boarder(11);
    await recordHostelIncident(W(), { allotmentId: p.allotmentId, kind: "INJURY", severity: "MINOR", title: "ZZ TA-298 twisted an ankle", body: "ZZ TA-298 a short note.", actionTaken: "", notifyGuardians: true });
    const row = (await hostelIncidents(W())).items.find((i) => i.title === "ZZ TA-298 twisted an ankle")!;
    expect(row.guardiansNotifiedAt).toBeNull();
    expect(await c.db.notification.count({ where: { userId: c.guardian.userId, titleKey: "notifTitle.incident" } })).toBe(0);
  });

  it("TA-298: once the boarder grants HOSTEL_TRANSPORT, the guardian is told and the incident stamped", async () => {
    const p = await boarder(12);
    await c.grant(p.membershipId, "HOSTEL_TRANSPORT");
    await recordHostelIncident(W(), { allotmentId: p.allotmentId, kind: "INJURY", severity: "MINOR", title: "ZZ TA-298 grazed a knee", body: "ZZ TA-298 a short note.", actionTaken: "", notifyGuardians: true });
    const row = (await hostelIncidents(W())).items.find((i) => i.title === "ZZ TA-298 grazed a knee")!;
    expect(row.guardiansNotifiedAt).not.toBeNull();
  });
});
