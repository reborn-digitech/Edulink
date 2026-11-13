/**
 * The transport findings of the 'campus-transport-hostel' batch of the testing analysis of 13 November 2026.
 *
 *   TA-053  a roster tick queued with no signal and sent after End was refused (and dropped by the phone).
 *   TA-051  a trip left LIVE overnight was not listed on the driver's day, so nothing could end it, and it
 *           refused every later start.
 *   TA-297  creating a route with a stop id rewrote that stop on another route.
 *   TA-299  two allotments of one pupil at once left two open seats.
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) with TRANSPORT on, open every day;
 * each case makes its own route, bus and driver.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { allotPupils, consentToLocation, createAssignment, dayTrips, driverToday, endTrip, familyTransport, markBoarding, saveBus, saveRoute, startTrip } from "@/lib/transport";

let c: College;
let today = "";
let n = 0;
const STOPS = [
  { name: "ZZ TA CTH Corner", lat: 18.5, lng: 73.8, morningMinute: 0, eveningMinute: 960, radiusM: 150 },
  { name: "ZZ TA CTH Gate", lat: 18.52, lng: 73.82, morningMinute: 10, eveningMinute: 940, radiusM: 150 },
];
const A = () => c.ctx(c.admin, "ADMIN");

/** A route of the two stops, a bus, a driver who has said yes to the location sentence, and the adult seated at the first stop. */
async function line(rider?: string) {
  const k = ++n;
  const u = await c.db.user.create({ data: { name: `ZZ TA CTH Driver ${k}`, email: `zz-tacons-cthbus-driver${k}-${c.stamp}@test.invalid`, phone: `+9197${String(c.stamp + k).slice(-8)}`, prefs: "{}" }, select: { id: true } });
  const m = await c.db.membership.create({ data: { userId: u.id, schoolId: c.schoolId, role: "DRIVER", status: "ACTIVE" }, select: { id: true } });
  const driver = { userId: u.id, membershipId: m.id };
  const route = await saveRoute(A(), null, { name: `ZZ TA CTH Route ${k}`, direction: "BOTH", active: true, note: "", stops: STOPS });
  const stops = await c.db.transportStop.findMany({ where: { routeId: route.id }, orderBy: { order: "asc" }, select: { id: true, name: true } });
  const bus = await saveBus(A(), null, { registration: `MH 12 ZT ${String(c.stamp + k).slice(-4)}`, capacity: 30, note: "", active: true });
  await createAssignment(A(), { busId: bus.id, routeId: route.id, driverMembershipId: m.id, attendantMembershipId: null, fromDateKey: "2026-01-01" });
  if (rider) await allotPupils(A(), { studentMembershipIds: [rider], routeId: route.id, stopId: stops[0]!.id, boards: true, alights: true, feeHeadId: null, fromDateKey: "2026-01-01" });
  const d = c.ctx(driver, "DRIVER");
  await consentToLocation(d);
  return { d, routeId: route.id, stops };
}

beforeAll(async () => {
  c = await makeCollege("cthbus");
  today = todayKey("Asia/Kolkata");
  await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "TRANSPORT" } });
}, 60_000);

afterAll(async () => {
  await c.cleanup();
});

describe("TA-053: a tick sent after End", () => {
  it("TA-053: a tick whose own time lies inside the ended trip is kept; one dated after the end is refused", async () => {
    const rider = await c.addStudent("r053", true);
    const { d } = await line(rider.membershipId);
    const morning = (await driverToday(d)).trips.find((t) => t.direction === "MORNING")!;
    await startTrip(d, morning.id, { lat: STOPS[0]!.lat, lng: STOPS[0]!.lng, accuracy: 10 });
    const seat = await c.db.transportAllotment.findFirstOrThrow({ where: { studentMembershipId: rider.membershipId }, select: { id: true } });
    const tickedAt = new Date().toISOString();
    await endTrip(d, morning.id);
    const r = await markBoarding(d, morning.id, { allotmentId: seat.id, boarded: true, at: tickedAt });
    expect(r.boardedAt).toBe(tickedAt);
    await expect(markBoarding(d, morning.id, { allotmentId: seat.id, alighted: true, at: new Date(Date.now() + 3_600_000).toISOString() })).rejects.toThrow("transport.refuseNotLive");
    await expect(markBoarding(d, morning.id, { allotmentId: seat.id, alighted: true })).rejects.toThrow("transport.refuseNotLive");
  });
});

describe("TA-051: a trip left live overnight", () => {
  it("TA-051: yesterday's LIVE trip is on the driver's day with nothing startable; once it is ended, today's trip starts", async () => {
    const { d } = await line();
    const first = (await driverToday(d)).trips.find((t) => t.direction === "EVENING")!;
    await startTrip(d, first.id, { lat: STOPS[1]!.lat, lng: STOPS[1]!.lng, accuracy: 10 });
    const yesterday = addDaysToKey(today, -1);
    await c.db.trip.update({ where: { id: first.id }, data: { dateKey: yesterday, startedAt: new Date(Date.now() - 86_400_000) } });
    const day = await driverToday(d);
    const stale = day.trips.find((t) => t.id === first.id);
    expect(stale?.status).toBe("LIVE");
    expect(day.trips.some((t) => t.canStart)).toBe(false);
    await endTrip(d, first.id);
    const after = await driverToday(d);
    expect(after.trips.some((t) => t.id === first.id)).toBe(false);
    const morning = after.trips.find((t) => t.direction === "MORNING" && t.dateKey === today)!;
    expect(morning.canStart).toBe(true);
    await expect(startTrip(d, morning.id, { lat: STOPS[0]!.lat, lng: STOPS[0]!.lng, accuracy: 10 })).resolves.toEqual({ status: "LIVE" });
  });
});

describe("TA-297: a stop id on a new route", () => {
  it("TA-297: creating a route with another route's stop id is refused and that stop is unchanged", async () => {
    const { stops } = await line();
    const before = await c.db.transportStop.findUniqueOrThrow({ where: { id: stops[1]!.id } });
    await expect(saveRoute(A(), null, { name: `ZZ TA-297 Copy ${c.stamp}`, direction: "BOTH", active: true, note: "", stops: [{ ...STOPS[0]!, id: stops[1]!.id, name: "ZZ TA-297 Moved" }] })).rejects.toThrow("transport.refuseStopNotOnRoute");
    expect(await c.db.transportStop.findUniqueOrThrow({ where: { id: stops[1]!.id } })).toEqual(before);
    expect(await c.db.transportRoute.count({ where: { schoolId: c.schoolId, name: `ZZ TA-297 Copy ${c.stamp}` } })).toBe(0);
  });
});

describe("TA-299: two allotments of one pupil at once", () => {
  it("TA-299: two allotments of one pupil to two routes at the same moment leave one seat current", async () => {
    const rider = await c.addStudent("r299", true);
    const one = await line();
    const two = await line();
    for (let round = 0; round < 3; round++) {
      await Promise.all([
        allotPupils(A(), { studentMembershipIds: [rider.membershipId], routeId: one.routeId, stopId: one.stops[0]!.id, boards: true, alights: true, feeHeadId: null, fromDateKey: today }),
        allotPupils(A(), { studentMembershipIds: [rider.membershipId], routeId: two.routeId, stopId: two.stops[0]!.id, boards: true, alights: true, feeHeadId: null, fromDateKey: today }),
      ]);
      const open = await c.db.transportAllotment.count({ where: { studentMembershipId: rider.membershipId, fromDateKey: { lte: today }, OR: [{ toDateKey: null }, { toDateKey: { gte: today } }] } });
      expect(open).toBe(1);
    }
  });
});

describe("TA-452: the family's bus screen, read every fifteen seconds", () => {
  it("TA-452: a read once the day's trips exist inserts nothing, and the bus's place is the newest of its 450 positions", async () => {
    const rider = await c.addStudent("r452", true);
    const { d } = await line(rider.membershipId);
    const morning = (await driverToday(d)).trips.find((t) => t.direction === "MORNING")!;
    await startTrip(d, morning.id, { lat: STOPS[0]!.lat, lng: STOPS[0]!.lng, accuracy: 10 });
    // The newest a few seconds after the start's own position.
    const t0 = Date.now() + 5_000 - 449 * 12_000;
    await c.db.tripPosition.createMany({ data: Array.from({ length: 450 }, (_, i) => ({ schoolId: c.schoolId, tripId: morning.id, at: new Date(t0 + i * 12_000), lat: 18.5 + i / 100_000, lng: 73.8 })) });
    const newest = new Date(t0 + 449 * 12_000).toISOString();
    const inserts = vi.spyOn(db.trip, "createMany");
    try {
      const shown = await familyTransport(c.ctx(rider, "STUDENT"));
      expect(shown.trip?.id).toBe(morning.id);
      expect(shown.trip?.lastPosition?.at).toBe(newest);
      const row = (await dayTrips(A())).trips.find((t) => t.id === morning.id)!;
      expect(row.lastPosition?.at).toBe(newest);
      expect(row.riders).toBe(1);
      expect(inserts).not.toHaveBeenCalled();
    } finally {
      inserts.mockRestore();
    }
  });
});
