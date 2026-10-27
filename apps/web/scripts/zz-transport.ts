import type { PrismaClient } from "@prisma/client";
import { ZZ_TRANSPORT } from "../src/lib/api-catalog/transport";
import { addDaysToKey, todayKey, zonedStartOfDay } from "../src/lib/dates";

/**
 * ZZ Northgate's transport (3 Oct 2026), for the sweeps, the suite's
 * neighbours and a walk by hand: one route, "ZZ Route 1 — Kothrud", with
 * three stops (two street corners and the school gate) running both ways;
 * one bus, MH 12 ZZ 1001; zz.driver01 driving it since 1 September (and an
 * earlier assignment of the same bus, ended on 31 August, for the sweep's
 * end door); pupils 01 and 02 with seats (and pupil 03's seat, ended);
 * yesterday's morning trip ENDED with the bus's track and both pupils
 * ticked on and off; today's morning trip SCHEDULED and untouched. Every id
 * is fixed (ZZ_TRANSPORT in the catalog), so the API sweep's samples are
 * plain paths. Re-run safe: each run puts the rows back as they were, and
 * the driver's yes to the location sentence is taken back, so a walk by
 * hand sees the sentence.
 *
 * The coordinates are of public places in Pune, near enough to each other
 * for a map to be worth looking at; nothing here locates a pupil.
 */
const STOPS = [
  { name: "ZZ Paud Phata corner", lat: 18.50895, lng: 73.80762, morning: 7 * 60 + 10, evening: 16 * 60 + 10 },
  { name: "ZZ Karve Statue", lat: 18.50612, lng: 73.81664, morning: 7 * 60 + 20, evening: 16 * 60 },
  { name: "ZZ Northgate School gate", lat: 18.51673, lng: 73.84152, morning: 7 * 60 + 40, evening: 15 * 60 + 45 },
];

export async function buildTransport(db: PrismaClient, school: { id: string }): Promise<{ route: string; stops: number; riders: number; positions: number; today: string } | null> {
  const ids = ZZ_TRANSPORT;
  const schoolId = school.id;
  const driver = await db.membership.findFirst({ where: { schoolId, role: "DRIVER", user: { email: "zz.driver01@zz.test" } }, select: { id: true } });
  const [p1, p2, p3] = await Promise.all(["zz.pupil01@zz.test", "zz.pupil02@zz.test", "zz.pupil03@zz.test"].map((email) => db.membership.findFirst({ where: { schoolId, role: "STUDENT", user: { email } }, select: { id: true } })));
  const admin = await db.membership.findFirst({ where: { schoolId, role: "ADMIN", status: "ACTIVE" }, select: { userId: true } });
  if (!driver || !p1 || !p2 || !p3) return null;
  const tz = (await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } })).timezone;
  const today = todayKey(tz);
  const yesterday = addDaysToKey(today, -1);

  // owner-batch-item5 (27 Oct 2026): the route charges a fee per term, so the office's "raise the term's route fees" has riders to charge.
  const routeData = { schoolId, name: "ZZ Route 1 — Kothrud", direction: "BOTH", active: true, note: "Fixture route: two corners and the school gate.", kind: "FIXED", feePerTermPaise: 1_800_00 };
  // end owner-batch-item5
  await db.transportRoute.upsert({ where: { id: ids.routeId }, create: { id: ids.routeId, ...routeData }, update: routeData });
  // Any stop the hand walk added goes, with the seats on it, so the three stops are the route.
  await db.transportAllotment.deleteMany({ where: { routeId: ids.routeId, id: { notIn: [...ids.allotmentIds, ids.endedAllotmentId] } } });
  await db.transportStop.deleteMany({ where: { routeId: ids.routeId, id: { notIn: [...ids.stopIds] } } });
  for (const [i, s] of STOPS.entries()) {
    const data = { schoolId, routeId: ids.routeId, order: i + 1, name: s.name, lat: s.lat, lng: s.lng, morningMinute: s.morning, eveningMinute: s.evening, radiusM: 150 };
    await db.transportStop.upsert({ where: { id: ids.stopIds[i]! }, create: { id: ids.stopIds[i]!, ...data }, update: data });
  }

  const busData = { schoolId, registration: "MH 12 ZZ 1001", capacity: 40, note: "Fixture bus.", active: true };
  // A bus another run renamed to this registration would clash on the unique pair.
  await db.bus.deleteMany({ where: { schoolId, registration: busData.registration, id: { not: ids.busId } } });
  await db.bus.upsert({ where: { id: ids.busId }, create: { id: ids.busId, ...busData }, update: busData });

  const current = { schoolId, busId: ids.busId, routeId: ids.routeId, driverMembershipId: driver.id, attendantMembershipId: null, fromDateKey: "2026-09-01", toDateKey: null, createdByUserId: admin?.userId ?? null };
  const ended = { ...current, fromDateKey: "2026-06-01", toDateKey: "2026-08-31" };
  await db.busAssignment.upsert({ where: { id: ids.assignmentId }, create: { id: ids.assignmentId, ...current }, update: current });
  await db.busAssignment.upsert({ where: { id: ids.endedAssignmentId }, create: { id: ids.endedAssignmentId, ...ended }, update: ended });
  // Assignments a hand walk made on the fixture route go, so the day reads one bus.
  await db.busAssignment.deleteMany({ where: { schoolId, routeId: ids.routeId, id: { notIn: [ids.assignmentId, ids.endedAssignmentId] } } });

  const seat = (studentMembershipId: string, stop: number, from: string, to: string | null) => ({ schoolId, studentMembershipId, routeId: ids.routeId, stopId: ids.stopIds[stop]!, boards: true, alights: true, fromDateKey: from, toDateKey: to, feeHeadId: null, createdByUserId: admin?.userId ?? null });
  const seats = [
    { id: ids.allotmentIds[0], data: seat(p1.id, 0, "2026-09-01", null) },
    { id: ids.allotmentIds[1], data: seat(p2.id, 1, "2026-09-01", null) },
    { id: ids.endedAllotmentId, data: seat(p3.id, 0, "2026-06-01", "2026-08-31") },
  ];
  for (const s of seats) await db.transportAllotment.upsert({ where: { id: s.id }, create: { id: s.id, ...s.data }, update: s.data });

  // Yesterday's morning, run and ended: a position every fifteen seconds from the first stop to the gate.
  const dayStart = zonedStartOfDay(yesterday, tz);
  const at = (minute: number, second = 0) => new Date(dayStart.getTime() + minute * 60_000 + second * 1000);
  const startedAt = at(STOPS[0]!.morning - 2);
  const endedAt = at(STOPS[2]!.morning + 3);
  await db.trip.deleteMany({ where: { assignmentId: ids.assignmentId, OR: [{ dateKey: yesterday, direction: "MORNING", id: { not: ids.endedTripId } }, { dateKey: today, direction: "MORNING", id: { not: ids.todayTripId } }] } });
  const endedTrip = { schoolId, assignmentId: ids.assignmentId, dateKey: yesterday, direction: "MORNING", status: "ENDED", startedAt, startedByMembershipId: driver.id, startReason: null, endedAt, endedByMembershipId: driver.id, lowBatteryAt: null, missedNotifiedAt: null };
  await db.trip.upsert({ where: { id: ids.endedTripId }, create: { id: ids.endedTripId, ...endedTrip }, update: endedTrip });
  await db.tripPosition.deleteMany({ where: { tripId: ids.endedTripId } });
  const legs: { from: (typeof STOPS)[number]; to: (typeof STOPS)[number]; start: number; end: number }[] = [
    { from: STOPS[0]!, to: STOPS[0]!, start: STOPS[0]!.morning - 2, end: STOPS[0]!.morning },
    { from: STOPS[0]!, to: STOPS[1]!, start: STOPS[0]!.morning, end: STOPS[1]!.morning },
    { from: STOPS[1]!, to: STOPS[2]!, start: STOPS[1]!.morning, end: STOPS[2]!.morning },
    { from: STOPS[2]!, to: STOPS[2]!, start: STOPS[2]!.morning, end: STOPS[2]!.morning + 3 },
  ];
  const positions: { schoolId: string; tripId: string; at: Date; lat: number; lng: number; speed: number; accuracy: number }[] = [];
  for (const leg of legs) {
    const steps = ((leg.end - leg.start) * 60) / 15;
    for (let k = 0; k < steps; k++) {
      const f = k / steps;
      positions.push({ schoolId, tripId: ids.endedTripId, at: at(leg.start, k * 15), lat: leg.from.lat + (leg.to.lat - leg.from.lat) * f, lng: leg.from.lng + (leg.to.lng - leg.from.lng) * f, speed: leg.from === leg.to ? 0 : 6.5, accuracy: 12 });
    }
  }
  await db.tripPosition.createMany({ data: positions, skipDuplicates: true });
  await db.tripBoarding.deleteMany({ where: { tripId: ids.endedTripId } });
  await db.tripBoarding.createMany({
    data: [
      { schoolId, tripId: ids.endedTripId, allotmentId: ids.allotmentIds[0], boardedAt: at(STOPS[0]!.morning, 30), alightedAt: at(STOPS[2]!.morning, 60), markedByMembershipId: driver.id, nearNotifiedAt: startedAt },
      { schoolId, tripId: ids.endedTripId, allotmentId: ids.allotmentIds[1], boardedAt: at(STOPS[1]!.morning, 20), alightedAt: at(STOPS[2]!.morning, 60), markedByMembershipId: driver.id, nearNotifiedAt: at(STOPS[0]!.morning) },
    ],
  });

  // Today's morning: waiting, never started, nothing on it.
  const todayTrip = { schoolId, assignmentId: ids.assignmentId, dateKey: today, direction: "MORNING", status: "SCHEDULED", startedAt: null, startedByMembershipId: null, startReason: null, endedAt: null, endedByMembershipId: null, lowBatteryAt: null, missedNotifiedAt: null };
  await db.trip.upsert({ where: { id: ids.todayTripId }, create: { id: ids.todayTripId, ...todayTrip }, update: todayTrip });
  await db.tripPosition.deleteMany({ where: { tripId: ids.todayTripId } });
  await db.tripBoarding.deleteMany({ where: { tripId: ids.todayTripId } });
  // Today's evening trip, if a read made one, goes back to waiting too.
  const evening = await db.trip.findMany({ where: { assignmentId: ids.assignmentId, dateKey: today, direction: "EVENING" }, select: { id: true } });
  await db.tripPosition.deleteMany({ where: { tripId: { in: evening.map((t) => t.id) } } });
  await db.tripBoarding.deleteMany({ where: { tripId: { in: evening.map((t) => t.id) } } });
  await db.trip.updateMany({ where: { assignmentId: ids.assignmentId, dateKey: today, direction: "EVENING" }, data: { status: "SCHEDULED", startedAt: null, startedByMembershipId: null, startReason: null, endedAt: null, endedByMembershipId: null, lowBatteryAt: null, missedNotifiedAt: null } });

  await db.transportConsent.deleteMany({ where: { membershipId: driver.id } });
  await db.transportAlertPref.deleteMany({ where: { schoolId } });
  return { route: routeData.name, stops: STOPS.length, riders: 2, positions: positions.length, today };
}
