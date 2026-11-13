/**
 * TA-048 (testing analysis of 13 November 2026, Medium, Privacy): the bus's near-stop alert (tellNear in
 * src/lib/transport.ts) read every ACTIVE guardianship and called notify() directly, so the guardians of an
 * adult college rider who had granted nothing were told the bus, the student's name and the stop, every
 * trip; the reading doors ask HOSTEL_TRANSPORT. (The live positions on the student's event channel are
 * TA-240's half, in tests/ta-consent-family-reads.test.ts.)
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts) with TRANSPORT on, open every day:
 * a route of two stops, a bus, a driver, and the adult and the minor seated at the first stop, whose
 * guardians are told as the bus sets off.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { allotPupils, consentToLocation, createAssignment, driverToday, endTrip, saveBus, saveRoute, startTrip } from "@/lib/transport";

let c: College;
const driver = { userId: "", membershipId: "" };
const STOPS = [
  { name: "ZZ TA-048 Corner", lat: 18.5, lng: 73.8, morningMinute: 0, eveningMinute: 960, radiusM: 150 },
  { name: "ZZ TA-048 Gate", lat: 18.52, lng: 73.82, morningMinute: 10, eveningMinute: 940, radiusM: 150 },
];

beforeAll(async () => {
  c = await makeCollege("bus");
  await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "TRANSPORT" } });
  driver.userId = (await c.db.user.create({ data: { name: "ZZ TA-048 Driver", email: `zz-tacons-bus-driver-${c.stamp}@test.invalid`, phone: `+9198${String(c.stamp).slice(-8)}`, prefs: "{}" }, select: { id: true } })).id;
  driver.membershipId = (await c.db.membership.create({ data: { userId: driver.userId, schoolId: c.schoolId, role: "DRIVER", status: "ACTIVE" }, select: { id: true } })).id;
  const admin = c.ctx(c.admin, "ADMIN");
  const route = await saveRoute(admin, null, { name: "ZZ TA-048 Route", direction: "BOTH", active: true, note: "", stops: STOPS });
  const stops = await c.db.transportStop.findMany({ where: { routeId: route.id }, orderBy: { order: "asc" }, select: { id: true } });
  const bus = await saveBus(admin, null, { registration: `MH 12 ZC ${String(c.stamp).slice(-4)}`, capacity: 30, note: "", active: true });
  await createAssignment(admin, { busId: bus.id, routeId: route.id, driverMembershipId: driver.membershipId, attendantMembershipId: null, fromDateKey: "2026-01-01" });
  await allotPupils(admin, { studentMembershipIds: [c.adult.membershipId, c.minor.membershipId], routeId: route.id, stopId: stops[0]!.id, boards: true, alights: true, feeHeadId: null, fromDateKey: "2026-01-01" });
}, 60_000);

afterAll(async () => {
  await c.cleanup();
});

describe("TA-048: the near-stop alert", () => {
  it("TA-048: as the bus sets off, the minor's guardian is told and the adult's is not; once HOSTEL_TRANSPORT is granted, the next trip tells them", async () => {
    const d = c.ctx(driver, "DRIVER");
    await consentToLocation(d);
    const day = await driverToday(d);
    const morning = day.trips.find((t) => t.direction === "MORNING")!;
    const evening = day.trips.find((t) => t.direction === "EVENING")!;
    await startTrip(d, morning.id, { lat: STOPS[0]!.lat, lng: STOPS[0]!.lng, accuracy: 10 });
    const near = (userId: string) => c.db.notification.count({ where: { userId, titleKey: "transport.notifNearTitle" } });
    expect(await near(c.guardian.userId)).toBe(1);
    expect(await near(c.guardianOfAdult.userId)).toBe(0);
    await endTrip(d, morning.id);
    await c.grant(c.adult.membershipId, "HOSTEL_TRANSPORT");
    // The evening run starts at the Gate (its first stop by the evening's times), the stop before the Corner.
    await startTrip(d, evening.id, { lat: STOPS[1]!.lat, lng: STOPS[1]!.lng, accuracy: 10 });
    expect(await near(c.guardianOfAdult.userId)).toBe(1);
  });
});
