/**
 * Transport (3 October 2026): the rules the module stands on.
 *
 * One ZZ school of this suite's own, open every day of the week (so today's
 * trips are made whatever day the suite runs), with TRANSPORT on: a route of
 * three stops running both ways, a bus, a driver and a second driver, two
 * pupils (one at the first stop, one at the second) each with a guardian,
 * and a second guardian of the second pupil who switches the near alert off.
 * A second ZZ school keeps transport off.
 *
 * What is proved: a door of the module answers MODULE_OFF where the module
 * is off; a trip starts once, only today, only after the location sentence,
 * at the first stop or with a reason; boardings are taken on a LIVE trip
 * only, and only for the trip's riders; positions are refused before the
 * start and after the end, and the same instant is stored once; the family
 * near the next stop is told once and the guardian who switched it off is
 * not; a trip ten minutes past its first stop is read as missed and the
 * office is told once; a parent reads their own child's bus and no other,
 * with the driver's name only when the school says so; a rewritten route
 * keeps its stops' ids and refuses to drop one a seat names; a new seat
 * ends the old one; retention takes a bus's positions past their days; and
 * the arithmetic (pass times, the arrival range, the map's tiles) holds.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { AccessError } from "@/lib/tenancy";
import { zonedStartOfDay } from "@/lib/dates";
import { RETENTION_DEFAULTS } from "@/lib/env";
import { sweepExpired } from "@/lib/retention";
import { actionKey } from "@/lib/safety-labels";
import { ENDPOINTS } from "@/lib/api-catalog";
import {
  allotPupils,
  consentToLocation,
  createAssignment,
  dayTrips,
  driverToday,
  endTrip,
  familyTransport,
  markBoarding,
  recordPositions,
  saveBus,
  saveRoute,
  setNearAlerts,
  setTransportSettings,
  startTrip,
  transportOverview,
  tripDetail,
} from "@/lib/transport";
import { etaRange, mapView, passTimes, distanceM, withinFence } from "@/lib/transport-geo";
import { GET as familyGet } from "@/app/api/v1/family/transport/route";
import { POST as positionsPost } from "@/app/api/v1/transport/trips/[tripId]/positions/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const ids = { school: "", off: "", admin: "", principal: "", driver: "", driver2: "", parent1: "", parent2: "", parent2b: "", stranger: "", p1: "", p2: "", p3: "", driverM: "", driver2M: "", offAdmin: "", route: "", bus: "", stops: [] as string[] };
const STOPS = [
  { name: "ZZ T Corner", lat: 18.5, lng: 73.8, morningMinute: 0, eveningMinute: 960, radiusM: 150 },
  { name: "ZZ T Temple", lat: 18.51, lng: 73.81, morningMinute: 5, eveningMinute: 950, radiusM: 150 },
  { name: "ZZ T Gate", lat: 18.52, lng: 73.82, morningMinute: 10, eveningMinute: 940, radiusM: 150 },
];

async function as(userId: string, role: string, schoolId: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

beforeAll(async () => {
  const mkSchool = (tag: string) => db.school.create({ data: { name: `ZZ Transport ${tag} ${STAMP}`, slug: `zz-transport-${tag.toLowerCase()}-${STAMP}`, code: `ZTR${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-tr-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ, teachingDays: "0,1,2,3,4,5,6" }, select: { id: true } });
  ids.school = (await mkSchool("Road")).id;
  ids.off = (await mkSchool("Lane")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "TRANSPORT" }, { schoolId: ids.off, module: "ALUMNI" }] });
  const mk = (who: string, phone?: string) => db.user.create({ data: { name: `ZZ Tr ${who}`, email: `zz-tr-${who.toLowerCase()}-${STAMP}@test.invalid`, ...(phone ? { phone } : {}) }, select: { id: true } });
  const users = await Promise.all(["Admin", "Principal", "Driver", "Driver2", "Parent1", "Parent2", "Parent2b", "Stranger", "P1", "P2", "P3", "OffAdmin"].map((w) => mk(w, w === "Driver" ? `+9199${String(STAMP).slice(-8)}` : undefined)));
  const u = users.map((x) => x.id);
  Object.assign(ids, { admin: u[0]!, principal: u[1]!, driver: u[2]!, driver2: u[3]!, parent1: u[4]!, parent2: u[5]!, parent2b: u[6]!, stranger: u[7]! });
  ids.offAdmin = users[11]!.id;
  await db.membership.createMany({
    data: [
      { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: ids.principal, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: ids.offAdmin, schoolId: ids.off, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  ids.driverM = (await db.membership.create({ data: { userId: ids.driver, schoolId: ids.school, role: "DRIVER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.driver2M = (await db.membership.create({ data: { userId: ids.driver2, schoolId: ids.school, role: "DRIVER", status: "ACTIVE" }, select: { id: true } })).id;
  const pupil = (userId: string, n: number) => db.membership.create({ data: { userId, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZTRP${n}${STAMP}` }, select: { id: true } });
  ids.p1 = (await pupil(users[8]!.id, 1)).id;
  ids.p2 = (await pupil(users[9]!.id, 2)).id;
  ids.p3 = (await pupil(users[10]!.id, 3)).id;
  await db.guardianship.createMany({
    data: [
      { parentUserId: ids.parent1, studentMembershipId: ids.p1, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.parent2, studentMembershipId: ids.p2, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.parent2b, studentMembershipId: ids.p2, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.stranger, studentMembershipId: ids.p3, studentSchoolId: ids.school, status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.off] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the module's doors", () => {
  it("every one names TRANSPORT, and the gate answers MODULE_OFF where the school has it off", async () => {
    const doors = ENDPOINTS.filter((e) => e.path.includes("/transport"));
    expect(doors.length).toBeGreaterThanOrEqual(22);
    expect(doors.every((e) => e.module === "TRANSPORT")).toBe(true);
    await expect(gateRequest("GET /api/v1/admin/transport", { role: "ADMIN", schoolId: ids.off })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/admin/transport", { role: "ADMIN", schoolId: ids.school })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/transport/today", { role: "DRIVER", schoolId: ids.school })).resolves.toBe("pass");
    // A driver reaches the driver's doors and not the office's.
    await expect(gateRequest("GET /api/v1/admin/transport", { role: "DRIVER", schoolId: ids.school })).rejects.toBeInstanceOf(AccessError);
    // The library refuses too, for a page or an action that is not an /api/v1 door.
    const offAdmin = await as(ids.offAdmin, "ADMIN", ids.off);
    await expect(transportOverview(offAdmin)).rejects.toBeInstanceOf(ModuleOffError);
  });

  it("every audit action it writes has words in the Safety Centre", () => {
    for (const action of ["transport.settings", "transport.route.create", "transport.route.update", "transport.bus.create", "transport.bus.update", "transport.assignment.create", "transport.assignment.end", "transport.allot", "transport.allotment.end", "transport.roster.export", "transport.consent", "transport.trip.start", "transport.trip.end", "transport.alerts.on", "transport.alerts.off"]) {
      expect(actionKey(action), action).not.toBeNull();
    }
  });
});

describe("the office sets transport up", () => {
  it("makes a route, a bus, an assignment and seats; the head may read but not write", async () => {
    const admin = await as(ids.admin, "ADMIN", ids.school);
    await expect(saveRoute(admin, null, { name: "ZZ T Route", direction: "BOTH", active: true, note: "", stops: STOPS.map((s) => ({ ...s, morningMinute: null })) })).rejects.toThrow("transport.refuseStopTimes");
    ids.route = (await saveRoute(admin, null, { name: "ZZ T Route", direction: "BOTH", active: true, note: "", stops: STOPS })).id;
    const route = await db.transportStop.findMany({ where: { routeId: ids.route }, orderBy: { order: "asc" }, select: { id: true } });
    ids.stops = route.map((s) => s.id);
    ids.bus = (await saveBus(admin, null, { registration: "MH 12 ZT 0001", capacity: 30, note: "", active: true })).id;
    await expect(saveBus(admin, null, { registration: "MH 12 ZT 0001", capacity: 30, note: "", active: true })).rejects.toThrow("transport.refuseDuplicateBus");
    await expect(createAssignment(admin, { busId: ids.bus, routeId: ids.route, driverMembershipId: ids.p1, attendantMembershipId: null })).rejects.toThrow("transport.refuseNotDriver");
    await expect(createAssignment(admin, { busId: ids.bus, routeId: ids.route, driverMembershipId: ids.driverM, attendantMembershipId: ids.driverM })).rejects.toThrow("transport.refuseSameAttendant");
    await createAssignment(admin, { busId: ids.bus, routeId: ids.route, driverMembershipId: ids.driverM, attendantMembershipId: null, fromDateKey: "2026-01-01" });
    await expect(allotPupils(admin, { studentMembershipIds: [ids.p1], routeId: ids.route, stopId: ids.stops[1]!, boards: true, alights: true, feeHeadId: null, fromDateKey: "2026-01-01" })).resolves.toEqual({ allotted: 1, ended: 0 });
    // A new seat ends the old one the day before it begins.
    await expect(allotPupils(admin, { studentMembershipIds: [ids.p1], routeId: ids.route, stopId: ids.stops[0]!, boards: true, alights: true, feeHeadId: null, fromDateKey: "2026-02-01" })).resolves.toEqual({ allotted: 1, ended: 1 });
    await allotPupils(admin, { studentMembershipIds: [ids.p2], routeId: ids.route, stopId: ids.stops[1]!, boards: true, alights: true, feeHeadId: null, fromDateKey: "2026-01-01" });
    const p1Seats = await db.transportAllotment.findMany({ where: { studentMembershipId: ids.p1 }, orderBy: { fromDateKey: "asc" }, select: { toDateKey: true, stopId: true } });
    expect(p1Seats).toEqual([{ toDateKey: "2026-01-31", stopId: ids.stops[1] }, { toDateKey: null, stopId: ids.stops[0] }]);
    await expect(allotPupils(admin, { studentMembershipIds: [ids.driverM], routeId: ids.route, stopId: ids.stops[0]!, boards: true, alights: true, feeHeadId: null })).rejects.toThrow("transport.refuseNotPupil");

    const head = await as(ids.principal, "PRINCIPAL", ids.school);
    const overview = await transportOverview(head);
    expect(overview.canEdit).toBe(false);
    expect(overview.routes[0]!.riders).toBe(2);
    expect(overview.drivers.map((d) => d.membershipId).sort()).toEqual([ids.driverM, ids.driver2M].sort());
    await expect(saveBus(head, null, { registration: "MH 12 ZT 0002", capacity: 30, note: "", active: true })).rejects.toThrow("access.wrongRoleForThisAction");
  });

  it("rewrites a route keeping its stops' ids, and refuses to drop a stop a seat names", async () => {
    const admin = await as(ids.admin, "ADMIN", ids.school);
    const stops = STOPS.map((s, i) => ({ ...s, id: ids.stops[i] }));
    await saveRoute(admin, ids.route, { name: "ZZ T Route", direction: "BOTH", active: true, note: "renamed stop", stops: [{ ...stops[0]!, name: "ZZ T Corner (east)" }, stops[1]!, stops[2]!] });
    const after = await db.transportStop.findMany({ where: { routeId: ids.route }, orderBy: { order: "asc" }, select: { id: true, name: true } });
    expect(after.map((s) => s.id)).toEqual(ids.stops);
    expect(after[0]!.name).toBe("ZZ T Corner (east)");
    await expect(saveRoute(admin, ids.route, { name: "ZZ T Route", direction: "BOTH", active: true, note: "", stops: [stops[1]!, stops[2]!] })).rejects.toThrow("transport.refuseStopInUse");
  });
});

describe("a driver's trip", () => {
  let tripId = "";

  it("is made for today in both directions, and will not start before the location sentence", async () => {
    const driver = await as(ids.driver, "DRIVER", ids.school);
    const day = await driverToday(driver);
    expect(day.trips.map((t) => t.direction).sort()).toEqual(["EVENING", "MORNING"]);
    expect(day.consent.needed).toBe(true);
    tripId = day.trips.find((t) => t.direction === "MORNING")!.id;
    // The morning's first stop is at 00:00: ten minutes on, it reads as missed (and stays startable).
    expect(day.trips.find((t) => t.id === tripId)!.status).toBe("MISSED");
    expect(day.trips.find((t) => t.id === tripId)!.canStart).toBe(true);
    await expect(startTrip(driver, tripId, { lat: STOPS[0]!.lat, lng: STOPS[0]!.lng })).rejects.toThrow("transport.refuseConsent");
    // The other driver does not see it at all.
    const other = await as(ids.driver2, "DRIVER", ids.school);
    expect((await driverToday(other)).trips).toEqual([]);
    await expect(startTrip(other, tripId, { reason: "ZZ testing" })).rejects.toThrow("transport.notFound");
  });

  it("tells the office of a missed start once, however many read the day", async () => {
    const head = await as(ids.principal, "PRINCIPAL", ids.school);
    await dayTrips(head);
    await dayTrips(head);
    const told = await db.notification.count({ where: { userId: ids.admin, titleKey: "transport.notifMissedTitle" } });
    expect(told).toBe(1);
  });

  it("starts at the first stop, or elsewhere only with a reason, and only once", async () => {
    // Pupil 02's second guardian says no to the near alert before the bus sets off.
    const parent2b = await as(ids.parent2b, "PARENT", null);
    await setNearAlerts(parent2b, ids.p2, false);
    await setNearAlerts(parent2b, ids.p2, false);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "transport.alerts.off" } })).toBe(1);
    await expect(setNearAlerts(parent2b, ids.p1, false)).rejects.toThrow("access.notYourChild");
    const driver = await as(ids.driver, "DRIVER", ids.school);
    await consentToLocation(driver);
    await consentToLocation(driver);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "transport.consent" } })).toBe(1);
    // Boardings and positions before the start are refused.
    await expect(markBoarding(driver, tripId, { allotmentId: (await db.transportAllotment.findFirstOrThrow({ where: { studentMembershipId: ids.p2 } })).id, boarded: true })).rejects.toThrow("transport.refuseNotLive");
    await expect(recordPositions(driver, tripId, { positions: [{ at: new Date().toISOString(), lat: 18.5, lng: 73.8 }] })).rejects.toThrow("transport.refuseNotLive");
    // Two kilometres from the first stop, with no reason.
    await expect(startTrip(driver, tripId, { lat: 18.52, lng: 73.8 })).rejects.toThrow("transport.refuseAway");
    await expect(startTrip(driver, tripId, { lat: STOPS[0]!.lat + 0.0005, lng: STOPS[0]!.lng, accuracy: 20 })).resolves.toEqual({ status: "LIVE" });
    await expect(startTrip(driver, tripId, { reason: "ZZ again" })).rejects.toThrow("transport.refuseStarted");
    // The evening's cannot start while the morning's is live.
    const evening = (await driverToday(driver)).trips.find((t) => t.direction === "EVENING")!;
    expect(evening.canStart).toBe(false);
    await expect(startTrip(driver, evening.id, { reason: "ZZ early" })).rejects.toThrow("transport.refuseOtherLive");
    // Pupil 01's stop is the first: their guardian is told as the bus sets off.
    expect(await db.notification.count({ where: { userId: ids.parent1, titleKey: "transport.notifNearTitle" } })).toBe(1);
  });

  it("takes positions while live, once each, and tells the next stop's family once — not the guardian who said no", async () => {
    const driver = await as(ids.driver, "DRIVER", ids.school);
    const now = Date.now();
    const batch = { positions: [0, 1, 2].map((k) => ({ at: new Date(now - (3 - k) * 12_000).toISOString(), lat: STOPS[0]!.lat + k * 0.00002, lng: STOPS[0]!.lng, speed: 5, accuracy: 10 })), lowBattery: true };
    await expect(recordPositions(driver, tripId, batch)).resolves.toEqual({ accepted: 3, duplicates: 0 });
    // The same batch again, from the phone's outbox: nothing new.
    await expect(recordPositions(driver, tripId, batch)).resolves.toEqual({ accepted: 0, duplicates: 3 });
    // A position from last week is not this trip's.
    await expect(recordPositions(driver, tripId, { positions: [{ at: new Date(now - 7 * 86_400_000).toISOString(), lat: 18.5, lng: 73.8 }] })).resolves.toEqual({ accepted: 0, duplicates: 1 });
    expect(await db.notification.count({ where: { userId: ids.parent2, titleKey: "transport.notifNearTitle" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: ids.parent2b, titleKey: "transport.notifNearTitle" } })).toBe(0);
    // Past the first stop again: nobody is told twice.
    await recordPositions(driver, tripId, { positions: [{ at: new Date(now - 1000).toISOString(), lat: STOPS[0]!.lat, lng: STOPS[0]!.lng }] });
    expect(await db.notification.count({ where: { userId: { in: [ids.parent1, ids.parent2] }, titleKey: "transport.notifNearTitle" } })).toBe(2);
    // The office sees the low battery.
    const head = await as(ids.principal, "PRINCIPAL", ids.school);
    const row = (await dayTrips(head)).trips.find((t) => t.id === tripId)!;
    expect(row.status).toBe("LIVE");
    expect(row.lowBattery).toBe(true);
    expect(row.lastPosition).not.toBeNull();
  });

  it("ticks only the trip's riders, only while live", async () => {
    const driver = await as(ids.driver, "DRIVER", ids.school);
    const seat = await db.transportAllotment.findFirstOrThrow({ where: { studentMembershipId: ids.p2, toDateKey: null } });
    const ticked = await markBoarding(driver, tripId, { allotmentId: seat.id, boarded: true });
    expect(ticked.boardedAt).not.toBeNull();
    const untick = await markBoarding(driver, tripId, { allotmentId: seat.id, boarded: false });
    expect(untick.boardedAt).toBeNull();
    await markBoarding(driver, tripId, { allotmentId: seat.id, boarded: true });
    const ended = await db.transportAllotment.findFirstOrThrow({ where: { studentMembershipId: ids.p1, toDateKey: "2026-01-31" } });
    await expect(markBoarding(driver, tripId, { allotmentId: ended.id, boarded: true })).rejects.toThrow("transport.refuseNotOnTrip");
    const detail = await tripDetail(await as(ids.admin, "ADMIN", ids.school), tripId);
    expect(detail.boarded).toBe(1);
    expect(detail.stops[0]!.passedAt).not.toBeNull();
  });

  it("a parent reads their own child's bus, with an arrival range while it runs, and no other child's", async () => {
    const parent2 = await as(ids.parent2, "PARENT", null);
    const view = await familyTransport(parent2, ids.p2);
    expect(view.seat?.stopName).toBe("ZZ T Temple");
    expect(view.seat?.busRegistration).toBe("MH 12 ZT 0001");
    expect(view.seat?.driverName).toBeNull();
    expect(view.trip?.status).toBe("LIVE");
    expect(view.trip?.lastPosition).not.toBeNull();
    expect(view.trip?.eta).not.toBeNull();
    expect(view.trip?.boardedAt).not.toBeNull();
    expect(view.nearAlerts).toBe(true);
    await expect(familyTransport(parent2, ids.p1)).rejects.toThrow("access.notYourChild");
    // Through the door: the stranger's own child has no seat; the other family's child is a 404.
    await as(ids.stranger, "PARENT", null);
    const mine = await familyGet(new Request(`http://localhost/api/v1/family/transport?childId=${ids.p3}`));
    expect(mine.status).toBe(200);
    expect(((await mine.json()) as { seat: unknown }).seat).toBeNull();
    const theirs = await familyGet(new Request(`http://localhost/api/v1/family/transport?childId=${ids.p2}`));
    expect(theirs.status).toBe(404);
    // The driver's name and telephone, once the school says families may see them.
    await setTransportSettings(await as(ids.admin, "ADMIN", ids.school), { showDriverToParents: true });
    const shown = await familyTransport(await as(ids.parent2, "PARENT", null), ids.p2);
    expect(shown.seat?.driverName).toBe("ZZ Tr Driver");
    expect(shown.seat?.driverPhone).toMatch(/^\+9199/);
  });

  it("ends once, and takes no position after", async () => {
    const driver = await as(ids.driver, "DRIVER", ids.school);
    const first = await endTrip(driver, tripId);
    const again = await endTrip(driver, tripId);
    expect(again.endedAt).toBe(first.endedAt);
    await expect(recordPositions(driver, tripId, { positions: [{ at: new Date().toISOString(), lat: 18.5, lng: 73.8 }] })).rejects.toThrow("transport.refuseEnded");
    await expect(markBoarding(driver, tripId, { allotmentId: (await db.transportAllotment.findFirstOrThrow({ where: { studentMembershipId: ids.p2, toDateKey: null } })).id, alighted: true })).rejects.toThrow("transport.refuseNotLive");
    await expect(startTrip(driver, tripId, { reason: "ZZ restart" })).rejects.toThrow("transport.refuseStarted");
    // The door answers the same refusal as a 403 with the driver's session.
    __setHeaders({});
    const res = await positionsPost(new Request(`http://localhost/api/v1/transport/trips/${tripId}/positions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ positions: [{ at: new Date().toISOString(), lat: 18.5, lng: 73.8 }] }) }), { params: Promise.resolve({ tripId }) });
    expect(res.status).toBe(403);
    const bad = await positionsPost(new Request(`http://localhost/api/v1/transport/trips/${tripId}/positions`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), { params: Promise.resolve({ tripId }) });
    expect(bad.status).toBe(422);
  });
});

describe("retention", () => {
  it("takes a bus's positions past their days, at this school only, and keeps the rest", async () => {
    const trip = await db.trip.findFirstOrThrow({ where: { schoolId: ids.school, status: "ENDED" }, select: { id: true } });
    await db.tripPosition.create({ data: { schoolId: ids.school, tripId: trip.id, at: new Date(Date.now() - 40 * 86_400_000), lat: 18.5, lng: 73.8 } });
    const before = await db.tripPosition.count({ where: { tripId: trip.id } });
    const { summary, perSchool } = await sweepExpired(new Date(), { ...RETENTION_DEFAULTS, tripPositionDays: 30 }, { schoolIds: [ids.school], userIds: [ids.admin], buckets: [], outboxTo: "nobody@test.invalid", jobs: ["zz-none"] });
    expect(summary.tripPositions).toBe(1);
    expect(perSchool[ids.school]?.tripPositions).toBe(1);
    expect(await db.tripPosition.count({ where: { tripId: trip.id } })).toBe(before - 1);
  });
});

describe("the arithmetic", () => {
  const stops = [
    { id: "a", lat: 18.5, lng: 73.8, radiusM: 100 },
    { id: "b", lat: 18.51, lng: 73.8, radiusM: 100 },
    { id: "c", lat: 18.52, lng: 73.8, radiusM: 100 },
  ];
  const t0 = new Date("2026-10-05T02:00:00Z");
  const at = (min: number) => new Date(t0.getTime() + min * 60_000);

  it("measures a kilometre and a fence", () => {
    expect(Math.round(distanceM({ lat: 18.5, lng: 73.8 }, { lat: 18.509, lng: 73.8 }))).toBe(1001);
    expect(withinFence({ lat: 18.5009, lng: 73.8 }, { lat: 18.5, lng: 73.8, radiusM: 50 })).toBe(false);
    expect(withinFence({ lat: 18.5009, lng: 73.8, accuracy: 60 }, { lat: 18.5, lng: 73.8, radiusM: 50 })).toBe(true);
  });

  it("reads when each stop was passed, in order, and leaves one not reached empty", () => {
    const passed = passTimes(stops, [
      { at: at(0), lat: 18.5, lng: 73.8 },
      { at: at(5), lat: 18.505, lng: 73.8 },
      { at: at(9), lat: 18.51, lng: 73.8 },
    ]);
    expect(passed.get("a")).toEqual(at(0));
    expect(passed.get("b")).toEqual(at(9));
    expect(passed.get("c")).toBeNull();
  });

  it("gives an arrival range from how late the bus was, never before now", () => {
    const range = etaRange({ target: at(20), passed: [{ scheduled: at(0), passedAt: at(3) }, { scheduled: at(10), passedAt: at(16) }], now: at(16) });
    expect(range.earliest).toEqual(at(23));
    expect(range.latest).toEqual(at(27));
    const none = etaRange({ target: at(20), passed: [], now: at(25) });
    expect(none.earliest).toEqual(at(25));
    expect(none.latest).toEqual(at(35));
  });

  it("places tiles and points in the map's own frame", () => {
    const view = mapView([{ lat: 18.5, lng: 73.8 }, { lat: 18.52, lng: 73.84 }], 640, 360);
    expect(view.zoom).toBeGreaterThanOrEqual(12);
    expect(view.tiles.length).toBeGreaterThan(0);
    expect(view.tiles[0]!.url).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/);
    const p = view.place({ lat: 18.51, lng: 73.82 });
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(640);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(360);
  });

  it("knows midnight in the school's zone", () => {
    expect(zonedStartOfDay("2026-10-05", TZ).toISOString()).toBe("2026-10-04T18:30:00.000Z");
  });
});
