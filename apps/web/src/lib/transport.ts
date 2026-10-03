import "server-only";
import type { Prisma } from "@prisma/client";
import {
  POSITION_STALE_SECONDS,
  TRIP_MISSED_AFTER_MINUTES,
  type BusAssignmentInput,
  type BusInput,
  type DriverToday,
  type FamilyTransport,
  type RosterEntry,
  type TransportAllotInput,
  type TransportAllotments,
  type TransportOverview,
  type TransportRouteInput,
  type TransportSettings,
  type TripBoardingBody,
  type TripDetail,
  type TripDirection,
  type TripPositions,
  type TripRow,
  type TripStart,
  type TripStatus,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { assertModuleOn, isModuleOn } from "./modules";
import { notify } from "./notify";
import { channel, publish } from "./realtime";
import { addDaysToKey, todayKey, zonedStartOfDay } from "./dates";
import { closedOn } from "./holidays";
import { toCsv } from "./csv";
import { translator } from "./i18n/dictionary";
import { normaliseLocale } from "@edulink/i18n";
import type { ExportFile } from "./export-file";
import type { ActiveContext } from "./session";
import { atMinute, etaRange, isMissed, passTimes, withinFence, minuteLabel } from "./transport-geo";

/**
 * TRANSPORT (the owner's decision of 3 October 2026), an optional module.
 *
 * WHO DOES WHAT. The office (ADMIN) keeps the routes and their stops, the
 * buses, which bus runs which route with which DRIVER (and attendant), and
 * which pupil rides from which stop; the head reads all of it. A DRIVER sees
 * their own trips today: says yes once to the location sentence, starts a
 * trip at the first stop (or elsewhere with a reason), ticks the roster, and
 * ends it; while the trip is LIVE their phone sends the bus's position. A
 * family reads their own child's route, stop and — while a trip runs — the
 * bus on a map with an arrival range, and is told when the bus reaches the
 * stop before theirs, unless they switched that off for the child.
 *
 * WHAT IS NEVER HERE. A child's location: positions are the bus's, sent only
 * between Start and End, kept RETENTION_TRIP_POSITIONS_DAYS; no allotment or
 * boarding row has a coordinate (decision 0002). A fee: an allotment may
 * name the fees module's transport head, nothing more (decision 0003). A
 * claim to satisfy a state's certified-tracker rule: the module's
 * description says so.
 *
 * DERIVED ON READ, NOT STORED. When the bus passed each stop (from its
 * positions), the arrival range, a trip read as MISSED (SCHEDULED and ten
 * minutes past its first stop's time) and how stale the feed is. The stored
 * markers are of things that happened once: the office told of a missed
 * start (Trip.missedNotifiedAt), a family told the bus was near
 * (TripBoarding.nearNotifiedAt), the phone's low battery (Trip.lowBatteryAt).
 *
 * MISSED STARTS, WITHOUT A JOB. No new scheduled job (the brief's rule), and
 * no morning job runs that could carry it. So the day's trips are read — and
 * today's SCHEDULED rows made, idempotently, for every assignment running on
 * an open day — whenever anyone with a reason to look reads them: the
 * office's or the head's day, a driver's home, a family's transport page.
 * The first such read after a trip passes its ten minutes tells the office
 * (every ADMIN) once, through the ordinary notification path.
 */

const OFFICE = ["ADMIN", "PRINCIPAL"] as const;
/** The sentence a driver says yes to; a new key asks again. */
export const CONSENT_TEXT_KEY = "transport.consentBody";
/** At most one live position event per trip in this many milliseconds. */
const PUBLISH_EVERY_MS = 15_000;
/** Positions this far before the start or after now are not the trip's. */
const BEFORE_START_MS = 60_000;
const FUTURE_SLACK_MS = 120_000;

type Office = { schoolId: string; userId: string; role: (typeof OFFICE)[number] };
type Driver = { schoolId: string; userId: string; membershipId: string };

async function officeOf(ctx: ActiveContext, write: boolean): Promise<Office> {
  if (!ctx.schoolId || !ctx.role || !(OFFICE as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  if (write && ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "TRANSPORT");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role as Office["role"] };
}

async function driverOf(ctx: ActiveContext): Promise<Driver> {
  if (!ctx.schoolId || !ctx.membershipId || ctx.role !== "DRIVER") throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "TRANSPORT");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, membershipId: ctx.membershipId };
}

async function schoolZone(schoolId: string): Promise<{ timezone: string; name: string }> {
  return db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, name: true } });
}

const personName = (u: { name: string; preferredName?: string | null }) => u.preferredName ?? u.name;
const isCurrent = (row: { fromDateKey: string; toDateKey: string | null }, day: string) => row.fromDateKey <= day && (row.toDateKey === null || row.toDateKey >= day);
const currentWhere = (day: string) => ({ fromDateKey: { lte: day }, OR: [{ toDateKey: null }, { toDateKey: { gte: day } }] });

/** The trip directions a route runs. */
export function directionsOf(routeDirection: string): TripDirection[] {
  if (routeDirection === "MORNING") return ["MORNING"];
  if (routeDirection === "EVENING") return ["EVENING"];
  return ["MORNING", "EVENING"];
}

type StopRow = { id: string; order: number; name: string; lat: number; lng: number; morningMinute: number | null; eveningMinute: number | null; radiusM: number };

/** A route's stops in the order a trip calls at them: the morning's order, or its reverse in the evening, each with its time on that trip. */
export function tripStops(stops: StopRow[], direction: TripDirection): (StopRow & { scheduledMinute: number | null })[] {
  const sorted = [...stops].sort((a, b) => a.order - b.order);
  if (direction === "EVENING") sorted.reverse();
  return sorted.map((s) => ({ ...s, scheduledMinute: direction === "MORNING" ? s.morningMinute : s.eveningMinute }));
}

/** Whether an allotment rides a trip of this direction: picked up in the morning, set down in the evening. */
const ridesOn = (a: { boards: boolean; alights: boolean }, direction: string) => (direction === "MORNING" ? a.boards : a.alights);

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function transportSettings(schoolId: string): Promise<TransportSettings> {
  const row = await db.schoolModule.findUnique({ where: { schoolId_module: { schoolId, module: "TRANSPORT" } }, select: { settingsJson: true } });
  let parsed: Partial<TransportSettings> = {};
  try {
    parsed = row?.settingsJson ? (JSON.parse(row.settingsJson) as Partial<TransportSettings>) : {};
  } catch {
    parsed = {};
  }
  return { showDriverToParents: parsed.showDriverToParents === true };
}

export async function setTransportSettings(ctx: ActiveContext, input: TransportSettings): Promise<TransportSettings> {
  const office = await officeOf(ctx, true);
  const before = await transportSettings(office.schoolId);
  const next = { ...before, ...input };
  await db.schoolModule.update({ where: { schoolId_module: { schoolId: office.schoolId, module: "TRANSPORT" } }, data: { settingsJson: JSON.stringify(next) } });
  if (before.showDriverToParents !== next.showDriverToParents) {
    await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: "transport.settings", targetType: "School", targetId: office.schoolId, meta: { showDriverToParents: next.showDriverToParents } });
  }
  return next;
}

/* -------------------------------------------------------------------------- */
/* The office: the overview, routes, buses, assignments                       */
/* -------------------------------------------------------------------------- */

export async function transportOverview(ctx: ActiveContext): Promise<TransportOverview> {
  const office = await officeOf(ctx, false);
  const { timezone } = await schoolZone(office.schoolId);
  const today = todayKey(timezone);
  const [settings, routes, buses, assignments, drivers, feeHeads, riders] = await Promise.all([
    transportSettings(office.schoolId),
    db.transportRoute.findMany({ where: { schoolId: office.schoolId }, include: { stops: { orderBy: { order: "asc" } } }, orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.bus.findMany({ where: { schoolId: office.schoolId }, orderBy: [{ active: "desc" }, { registration: "asc" }] }),
    db.busAssignment.findMany({
      where: { schoolId: office.schoolId },
      include: { bus: { select: { registration: true } }, route: { select: { name: true } }, driver: { select: { user: { select: { name: true } } } }, attendant: { select: { user: { select: { name: true } } } } },
      orderBy: [{ fromDateKey: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    db.membership.findMany({ where: { schoolId: office.schoolId, role: "DRIVER", status: "ACTIVE", leftAt: null }, select: { id: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
    db.feeHead.findMany({ where: { schoolId: office.schoolId, kind: "TRANSPORT", retiredAt: null }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
    db.transportAllotment.groupBy({ by: ["routeId"], where: { schoolId: office.schoolId, ...currentWhere(today) }, _count: { _all: true } }),
  ]);
  const ridersOf = new Map(riders.map((r) => [r.routeId, r._count._all]));
  return {
    todayKey: today,
    settings,
    routes: routes.map((r) => ({
      id: r.id,
      name: r.name,
      direction: r.direction as TransportOverview["routes"][number]["direction"],
      active: r.active,
      note: r.note,
      stops: r.stops.map((s) => ({ id: s.id, order: s.order, name: s.name, lat: s.lat, lng: s.lng, morningMinute: s.morningMinute, eveningMinute: s.eveningMinute, radiusM: s.radiusM })),
      riders: ridersOf.get(r.id) ?? 0,
    })),
    buses: buses.map((b) => ({ id: b.id, registration: b.registration, capacity: b.capacity, note: b.note, active: b.active })),
    assignments: assignments.map((a) => ({
      id: a.id,
      busId: a.busId,
      busRegistration: a.bus.registration,
      routeId: a.routeId,
      routeName: a.route.name,
      driverMembershipId: a.driverMembershipId,
      driverName: a.driver.user.name,
      attendantMembershipId: a.attendantMembershipId,
      attendantName: a.attendant?.user.name ?? null,
      fromDateKey: a.fromDateKey,
      toDateKey: a.toDateKey,
      current: isCurrent(a, today),
    })),
    drivers: drivers.map((d) => ({ membershipId: d.id, name: d.user.name })),
    feeHeads,
    canEdit: office.role === "ADMIN",
  };
}

/** Each stop needs its time for every way the route runs: the morning's time on a MORNING or BOTH route, the evening's on EVENING or BOTH. */
function checkStopTimes(input: TransportRouteInput) {
  const dirs = directionsOf(input.direction);
  for (const s of input.stops) {
    if (dirs.includes("MORNING") && s.morningMinute === null) throw new AccessError("transport.refuseStopTimes");
    if (dirs.includes("EVENING") && s.eveningMinute === null) throw new AccessError("transport.refuseStopTimes");
  }
}

/**
 * Make a route or rewrite one. On a rewrite, a stop sent with its id is kept
 * (so the pupils allotted to it stay with it) and renumbered to its place in
 * the list; a new stop is made; a stop left out is removed — refused while
 * any seat, current or past, names it, since a past trip's roster reads it.
 */
export async function saveRoute(ctx: ActiveContext, routeId: string | null, input: TransportRouteInput): Promise<{ id: string }> {
  const office = await officeOf(ctx, true);
  checkStopTimes(input);
  const schoolId = office.schoolId;
  const id = await db.$tenantTransaction(async (raw: unknown) => {
    const tx = raw as Prisma.TransactionClient;
    let rid = routeId;
    if (rid) {
      const route = await tx.transportRoute.findFirst({ where: { id: rid, schoolId }, select: { id: true, stops: { select: { id: true } } } });
      if (!route) throw new AccessError("transport.notFound", "NOT_FOUND");
      await tx.transportRoute.update({ where: { id: rid }, data: { name: input.name, direction: input.direction, active: input.active, note: input.note } });
      const kept = new Set(input.stops.map((s) => s.id).filter((x): x is string => Boolean(x)));
      for (const k of kept) if (!route.stops.some((s) => s.id === k)) throw new AccessError("transport.refuseStopNotOnRoute");
      const gone = route.stops.map((s) => s.id).filter((s) => !kept.has(s));
      if (gone.length > 0) {
        const used = await tx.transportAllotment.count({ where: { stopId: { in: gone } } });
        if (used > 0) throw new AccessError("transport.refuseStopInUse");
        await tx.transportStop.deleteMany({ where: { id: { in: gone }, routeId: rid } });
      }
    } else {
      rid = (await tx.transportRoute.create({ data: { schoolId, name: input.name, direction: input.direction, active: input.active, note: input.note }, select: { id: true } })).id;
    }
    for (const [i, s] of input.stops.entries()) {
      const data = { name: s.name, lat: s.lat, lng: s.lng, morningMinute: s.morningMinute, eveningMinute: s.eveningMinute, radiusM: s.radiusM, order: i + 1 };
      if (s.id) await tx.transportStop.update({ where: { id: s.id }, data });
      else await tx.transportStop.create({ data: { ...data, schoolId, routeId: rid } });
    }
    return rid;
  });
  await audit({ schoolId, actorUserId: office.userId, action: routeId ? "transport.route.update" : "transport.route.create", targetType: "TransportRoute", targetId: id, meta: { stops: input.stops.length, direction: input.direction, active: input.active } });
  return { id };
}

export async function saveBus(ctx: ActiveContext, busId: string | null, input: BusInput): Promise<{ id: string }> {
  const office = await officeOf(ctx, true);
  const clash = await db.bus.findFirst({ where: { schoolId: office.schoolId, registration: input.registration, ...(busId ? { id: { not: busId } } : {}) }, select: { id: true } });
  if (clash) throw new AccessError("transport.refuseDuplicateBus");
  let id = busId;
  if (id) {
    const found = await db.bus.findFirst({ where: { id, schoolId: office.schoolId }, select: { id: true } });
    if (!found) throw new AccessError("transport.notFound", "NOT_FOUND");
    await db.bus.update({ where: { id }, data: input });
  } else {
    id = (await db.bus.create({ data: { ...input, schoolId: office.schoolId }, select: { id: true } })).id;
  }
  await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: busId ? "transport.bus.update" : "transport.bus.create", targetType: "Bus", targetId: id, meta: { registration: input.registration, capacity: input.capacity, active: input.active } });
  return { id };
}

async function assertDriverMember(schoolId: string, membershipId: string) {
  const m = await db.membership.findFirst({ where: { id: membershipId, schoolId, role: "DRIVER", status: "ACTIVE", leftAt: null }, select: { id: true } });
  if (!m) throw new AccessError("transport.refuseNotDriver");
}

export async function createAssignment(ctx: ActiveContext, input: BusAssignmentInput): Promise<{ id: string }> {
  const office = await officeOf(ctx, true);
  const { timezone } = await schoolZone(office.schoolId);
  const from = input.fromDateKey ?? todayKey(timezone);
  const [bus, route] = await Promise.all([
    db.bus.findFirst({ where: { id: input.busId, schoolId: office.schoolId }, select: { id: true, active: true } }),
    db.transportRoute.findFirst({ where: { id: input.routeId, schoolId: office.schoolId }, select: { id: true, active: true } }),
  ]);
  if (!bus || !route) throw new AccessError("transport.notFound", "NOT_FOUND");
  if (!bus.active || !route.active) throw new AccessError("transport.refuseArchived");
  await assertDriverMember(office.schoolId, input.driverMembershipId);
  if (input.attendantMembershipId) {
    if (input.attendantMembershipId === input.driverMembershipId) throw new AccessError("transport.refuseSameAttendant");
    await assertDriverMember(office.schoolId, input.attendantMembershipId);
  }
  const created = await db.busAssignment.create({
    data: { schoolId: office.schoolId, busId: input.busId, routeId: input.routeId, driverMembershipId: input.driverMembershipId, attendantMembershipId: input.attendantMembershipId, fromDateKey: from, createdByUserId: office.userId },
    select: { id: true },
  });
  await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: "transport.assignment.create", targetType: "BusAssignment", targetId: created.id, meta: { busId: input.busId, routeId: input.routeId, driverMembershipId: input.driverMembershipId, attendant: Boolean(input.attendantMembershipId), from } });
  return created;
}

/** The last day an assignment runs is today; one not begun yet never runs. Ending an ended one changes nothing. */
export async function endAssignment(ctx: ActiveContext, assignmentId: string): Promise<{ toDateKey: string }> {
  const office = await officeOf(ctx, true);
  const a = await db.busAssignment.findFirst({ where: { id: assignmentId, schoolId: office.schoolId }, select: { id: true, fromDateKey: true, toDateKey: true } });
  if (!a) throw new AccessError("transport.notFound", "NOT_FOUND");
  const { timezone } = await schoolZone(office.schoolId);
  const today = todayKey(timezone);
  const last = a.fromDateKey > today ? addDaysToKey(a.fromDateKey, -1) : today;
  if (a.toDateKey !== null && a.toDateKey <= last) return { toDateKey: a.toDateKey };
  await db.busAssignment.update({ where: { id: a.id }, data: { toDateKey: last } });
  await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: "transport.assignment.end", targetType: "BusAssignment", targetId: a.id, meta: { toDateKey: last } });
  return { toDateKey: last };
}

/* -------------------------------------------------------------------------- */
/* Allotments                                                                  */
/* -------------------------------------------------------------------------- */

export async function listAllotments(ctx: ActiveContext, query: { routeId?: string; classId?: string }): Promise<TransportAllotments> {
  const office = await officeOf(ctx, false);
  const { timezone } = await schoolZone(office.schoolId);
  const today = todayKey(timezone);
  const [rows, classes] = await Promise.all([
    db.transportAllotment.findMany({
      where: { schoolId: office.schoolId, ...currentWhere(today), ...(query.routeId ? { routeId: query.routeId } : {}) },
      include: {
        student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } },
        route: { select: { name: true } },
        stop: { select: { name: true, order: true } },
      },
      orderBy: [{ routeId: "asc" }, { stop: { order: "asc" } }],
    }),
    db.class.findMany({ where: { schoolId: office.schoolId, archivedAt: null }, select: { id: true, name: true }, orderBy: [{ gradeLevel: "asc" }, { name: "asc" }] }),
  ]);
  const allotments = rows.map((a) => ({
    id: a.id,
    studentMembershipId: a.studentMembershipId,
    studentName: personName(a.student.user),
    className: a.student.enrollments[0]?.class.name ?? null,
    routeId: a.routeId,
    routeName: a.route.name,
    stopId: a.stopId,
    stopName: a.stop.name,
    boards: a.boards,
    alights: a.alights,
    fromDateKey: a.fromDateKey,
    toDateKey: a.toDateKey,
    feeHeadId: a.feeHeadId,
  }));
  let pupils: TransportAllotments["pupils"] = [];
  if (query.classId) {
    const enrolled = await db.enrollment.findMany({
      where: { classId: query.classId, status: "ACTIVE", class: { schoolId: office.schoolId } },
      select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
    });
    const seats = await db.transportAllotment.findMany({
      where: { schoolId: office.schoolId, studentMembershipId: { in: enrolled.map((e) => e.studentMembershipId) }, ...currentWhere(today) },
      select: { id: true, studentMembershipId: true, route: { select: { name: true } }, stop: { select: { name: true } } },
    });
    const seatOf = new Map(seats.map((s) => [s.studentMembershipId, s]));
    pupils = enrolled
      .map((e) => {
        const seat = seatOf.get(e.studentMembershipId);
        return { studentMembershipId: e.studentMembershipId, name: personName(e.student.user), allotmentId: seat?.id ?? null, routeName: seat?.route.name ?? null, stopName: seat?.stop.name ?? null };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return { allotments, classes, pupils };
}

/**
 * Give pupils a seat: this route, this stop, from this day (today when not
 * said). A seat a pupil already holds that began earlier ends the day
 * before; one beginning the same day or later is rewritten in place, so
 * choosing again on the same day does not leave a trail of one-day seats.
 */
export async function allotPupils(ctx: ActiveContext, input: TransportAllotInput): Promise<{ allotted: number; ended: number }> {
  const office = await officeOf(ctx, true);
  const schoolId = office.schoolId;
  const { timezone } = await schoolZone(schoolId);
  const from = input.fromDateKey ?? todayKey(timezone);
  const stop = await db.transportStop.findFirst({ where: { id: input.stopId, schoolId, routeId: input.routeId }, select: { id: true, route: { select: { active: true } } } });
  if (!stop) throw new AccessError("transport.refuseStopNotOnRoute");
  if (!stop.route.active) throw new AccessError("transport.refuseArchived");
  if (input.feeHeadId) {
    const head = await db.feeHead.findFirst({ where: { id: input.feeHeadId, schoolId, kind: "TRANSPORT", retiredAt: null }, select: { id: true } });
    if (!head) throw new AccessError("transport.refuseFeeHead");
  }
  const ids = [...new Set(input.studentMembershipIds)];
  const pupils = await db.membership.count({ where: { id: { in: ids }, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } });
  if (pupils !== ids.length) throw new AccessError("transport.refuseNotPupil");
  const result = await db.$tenantTransaction(async (raw: unknown) => {
    const tx = raw as Prisma.TransactionClient;
    let ended = 0;
    let allotted = 0;
    for (const studentMembershipId of ids) {
      const open = await tx.transportAllotment.findMany({ where: { schoolId, studentMembershipId, OR: [{ toDateKey: null }, { toDateKey: { gte: from } }] }, select: { id: true, fromDateKey: true }, orderBy: { fromDateKey: "asc" } });
      let rewritten = false;
      for (const seat of open) {
        if (seat.fromDateKey < from) {
          await tx.transportAllotment.update({ where: { id: seat.id }, data: { toDateKey: addDaysToKey(from, -1) } });
          ended++;
        } else if (!rewritten) {
          await tx.transportAllotment.update({ where: { id: seat.id }, data: { routeId: input.routeId, stopId: input.stopId, boards: input.boards, alights: input.alights, feeHeadId: input.feeHeadId, fromDateKey: from, toDateKey: null, createdByUserId: office.userId } });
          rewritten = true;
        } else {
          await tx.transportAllotment.update({ where: { id: seat.id }, data: { toDateKey: addDaysToKey(seat.fromDateKey, -1) } });
          ended++;
        }
      }
      if (!rewritten) {
        await tx.transportAllotment.create({ data: { schoolId, studentMembershipId, routeId: input.routeId, stopId: input.stopId, boards: input.boards, alights: input.alights, feeHeadId: input.feeHeadId, fromDateKey: from, createdByUserId: office.userId } });
      }
      allotted++;
    }
    return { allotted, ended };
  });
  await audit({ schoolId, actorUserId: office.userId, action: "transport.allot", targetType: "TransportRoute", targetId: input.routeId, meta: { pupils: result.allotted, stopId: input.stopId, from, boards: input.boards, alights: input.alights } });
  return result;
}

/** A seat's last day is today. Ending an ended seat changes nothing. */
export async function endAllotment(ctx: ActiveContext, allotmentId: string): Promise<{ toDateKey: string }> {
  const office = await officeOf(ctx, true);
  const a = await db.transportAllotment.findFirst({ where: { id: allotmentId, schoolId: office.schoolId }, select: { id: true, fromDateKey: true, toDateKey: true, studentMembershipId: true } });
  if (!a) throw new AccessError("transport.notFound", "NOT_FOUND");
  const { timezone } = await schoolZone(office.schoolId);
  const today = todayKey(timezone);
  const last = a.fromDateKey > today ? addDaysToKey(a.fromDateKey, -1) : today;
  if (a.toDateKey !== null && a.toDateKey <= last) return { toDateKey: a.toDateKey };
  await db.transportAllotment.update({ where: { id: a.id }, data: { toDateKey: last } });
  await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: "transport.allotment.end", targetType: "TransportAllotment", targetId: a.id, meta: { studentMembershipId: a.studentMembershipId, toDateKey: last } });
  return { toDateKey: last };
}

/** The roster of one bus as a file: every pupil on every route it runs today, by stop. Audited. */
export async function rosterExport(ctx: ActiveContext, busId: string): Promise<ExportFile> {
  const office = await officeOf(ctx, false);
  const bus = await db.bus.findFirst({ where: { id: busId, schoolId: office.schoolId }, select: { id: true, registration: true } });
  if (!bus) throw new AccessError("transport.notFound", "NOT_FOUND");
  const { timezone } = await schoolZone(office.schoolId);
  const today = todayKey(timezone);
  const assignments = await db.busAssignment.findMany({ where: { busId, schoolId: office.schoolId, ...currentWhere(today) }, select: { routeId: true } });
  const routeIds = [...new Set(assignments.map((a) => a.routeId))];
  const seats = await db.transportAllotment.findMany({
    where: { schoolId: office.schoolId, routeId: { in: routeIds }, ...currentWhere(today) },
    include: {
      route: { select: { name: true } },
      stop: { select: { name: true, order: true, morningMinute: true, eveningMinute: true } },
      student: { select: { studentCode: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } },
    },
    orderBy: [{ routeId: "asc" }, { stop: { order: "asc" } }],
  });
  // The headings and the yes/no cells in the school's own language: the roster goes to a driver or a clerk, not to a government portal.
  const school = await db.school.findUniqueOrThrow({ where: { id: office.schoolId }, select: { locale: true } });
  const t = translator(normaliseLocale(school.locale));
  const h = {
    bus: t("transport.colBus"), route: t("transport.colRoute"), stop: t("transport.colStop"), order: t("transport.colStopOrder"), morning: t("transport.colMorningTime"), evening: t("transport.colEveningTime"),
    pupil: t("transport.colPupil"), code: t("transport.colPupilCode"), cls: t("transport.colClass"), pickUp: t("transport.colMorningPickUp"), drop: t("transport.colEveningDrop"),
  };
  const yes = t("pupilRecord.yes"), no = t("pupilRecord.no");
  const rows = seats.map((s) => ({
    [h.bus]: bus.registration,
    [h.route]: s.route.name,
    [h.stop]: s.stop.name,
    [h.order]: String(s.stop.order),
    [h.morning]: minuteLabel(s.stop.morningMinute),
    [h.evening]: minuteLabel(s.stop.eveningMinute),
    [h.pupil]: personName(s.student.user),
    [h.code]: s.student.studentCode ?? "",
    [h.cls]: s.student.enrollments[0]?.class.name ?? "",
    [h.pickUp]: s.boards ? yes : no,
    [h.drop]: s.alights ? yes : no,
  }));
  const headers = [h.bus, h.route, h.stop, h.order, h.morning, h.evening, h.pupil, h.code, h.cls, h.pickUp, h.drop];
  await audit({ schoolId: office.schoolId, actorUserId: office.userId, action: "transport.roster.export", targetType: "Bus", targetId: bus.id, meta: { rows: rows.length } });
  return { filename: `roster-${bus.registration.replace(/[^A-Z0-9]+/g, "-")}-${today}.csv`, csv: toCsv(rows, headers) };
}

/* -------------------------------------------------------------------------- */
/* The day's trips                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Today's SCHEDULED rows, made idempotently for every assignment that runs
 * today on a route that is on and a bus that is on, one per direction the
 * route runs — on an open day of the school's calendar and week only.
 */
async function ensureTrips(schoolId: string, dateKey: string): Promise<void> {
  const day = await closedOn(schoolId, dateKey);
  if (day.closed || !day.teachingDay) return;
  const assignments = await db.busAssignment.findMany({ where: { schoolId, ...currentWhere(dateKey), route: { active: true }, bus: { active: true } }, select: { id: true, route: { select: { direction: true } } } });
  const data = assignments.flatMap((a) => directionsOf(a.route.direction).map((direction) => ({ schoolId, assignmentId: a.id, dateKey, direction })));
  if (data.length > 0) await db.trip.createMany({ data, skipDuplicates: true });
}

const tripInclude = {
  assignment: {
    select: {
      id: true,
      routeId: true,
      driverMembershipId: true,
      attendantMembershipId: true,
      bus: { select: { registration: true } },
      driver: { select: { user: { select: { name: true, phone: true } } } },
      route: { select: { id: true, name: true, stops: { select: { id: true, order: true, name: true, lat: true, lng: true, morningMinute: true, eveningMinute: true, radiusM: true } } } },
    },
  },
} as const;
type LoadedTrip = Prisma.TripGetPayload<{ include: typeof tripInclude }>;

/** The status a trip reads as now: MISSED for a SCHEDULED trip ten minutes past its first stop's time. */
function readStatus(trip: { status: string; dateKey: string; direction: string }, stops: StopRow[], timezone: string, now: Date): { status: TripStatus; scheduledMinute: number | null; scheduledStart: Date | null } {
  const ordered = tripStops(stops, trip.direction as TripDirection);
  const scheduledMinute = ordered[0]?.scheduledMinute ?? null;
  const scheduledStart = scheduledMinute === null ? null : atMinute(zonedStartOfDay(trip.dateKey, timezone), scheduledMinute);
  const missed = isMissed({ status: trip.status, scheduledStart, now, graceMinutes: TRIP_MISSED_AFTER_MINUTES });
  return { status: missed ? "MISSED" : (trip.status as TripStatus), scheduledMinute, scheduledStart };
}

/** Riders of a trip: the seats current on its day on its route that ride its way. */
async function ridersOf(schoolId: string, routeId: string, dateKey: string, direction: string) {
  const seats = await db.transportAllotment.findMany({
    where: { schoolId, routeId, ...currentWhere(dateKey) },
    select: {
      id: true,
      studentMembershipId: true,
      stopId: true,
      boards: true,
      alights: true,
      stop: { select: { name: true } },
      student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } },
    },
  });
  return seats.filter((s) => ridesOn(s, direction));
}

async function lastPositions(tripIds: string[]): Promise<Map<string, { at: Date; lat: number; lng: number; speed: number | null; accuracy: number | null }>> {
  if (tripIds.length === 0) return new Map();
  const rows = await db.tripPosition.findMany({ where: { tripId: { in: tripIds } }, orderBy: { at: "desc" }, distinct: ["tripId"], select: { tripId: true, at: true, lat: true, lng: true, speed: true, accuracy: true } });
  return new Map(rows.map((r) => [r.tripId, r]));
}

const positionView = (p: { at: Date; lat: number; lng: number; speed: number | null; accuracy: number | null } | undefined | null) =>
  p ? { at: p.at.toISOString(), lat: p.lat, lng: p.lng, speed: p.speed, accuracy: p.accuracy } : null;

/**
 * The office is told once of each trip read as missed: every ADMIN at the
 * school gets a notification, and the trip remembers it was said. Two reads
 * at once tell it once (the conditional update decides).
 */
async function tellOfficeOfMissed(schoolId: string, missed: { id: string; bus: string; route: string; minute: number | null }[]): Promise<void> {
  if (missed.length === 0) return;
  const admins = await db.membership.findMany({ where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  for (const trip of missed) {
    const claimed = await db.trip.updateMany({ where: { id: trip.id, status: "SCHEDULED", missedNotifiedAt: null }, data: { missedNotifiedAt: new Date() } });
    if (claimed.count === 0) continue;
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.userId,
          schoolId,
          kind: "SYSTEM",
          titleKey: "transport.notifMissedTitle",
          titleVars: { bus: trip.bus },
          bodyKey: "transport.notifMissedBody",
          bodyVars: { bus: trip.bus, route: trip.route, time: minuteLabel(trip.minute) },
          url: "/admin/transport?tab=today",
        }).catch((error) => console.error("[transport] missed notice", error instanceof Error ? error.message : error)),
      ),
    );
  }
}

/** The day's trips for one school, as rows; today's are made first, and a newly missed start is said to the office. */
async function readDay(schoolId: string, dateKey: string, filter: Prisma.TripWhereInput = {}): Promise<{ rows: TripRow[]; loaded: LoadedTrip[] }> {
  const { timezone } = await schoolZone(schoolId);
  const today = todayKey(timezone);
  if (dateKey === today) await ensureTrips(schoolId, dateKey);
  const trips = await db.trip.findMany({ where: { schoolId, dateKey, ...filter }, include: tripInclude, orderBy: [{ direction: "asc" }, { createdAt: "asc" }] });
  const now = new Date();
  const last = await lastPositions(trips.map((t) => t.id));
  const counts = await Promise.all(
    trips.map(async (t) => {
      const riders = await ridersOf(schoolId, t.assignment.routeId, t.dateKey, t.direction);
      const boarded = await db.tripBoarding.count({ where: { tripId: t.id, boardedAt: { not: null } } });
      return { riders: riders.length, boarded };
    }),
  );
  const missed: { id: string; bus: string; route: string; minute: number | null }[] = [];
  const rows = trips.map((t, i) => {
    const read = readStatus(t, t.assignment.route.stops, timezone, now);
    if (read.status === "MISSED" && !t.missedNotifiedAt && t.dateKey === today) missed.push({ id: t.id, bus: t.assignment.bus.registration, route: t.assignment.route.name, minute: read.scheduledMinute });
    return {
      id: t.id,
      dateKey: t.dateKey,
      direction: t.direction as TripDirection,
      status: read.status,
      scheduledMinute: read.scheduledMinute,
      startedAt: t.startedAt?.toISOString() ?? null,
      endedAt: t.endedAt?.toISOString() ?? null,
      startReason: t.startReason,
      busRegistration: t.assignment.bus.registration,
      routeId: t.assignment.routeId,
      routeName: t.assignment.route.name,
      driverName: t.assignment.driver.user.name,
      lastPosition: positionView(last.get(t.id)),
      lowBattery: Boolean(t.lowBatteryAt) && t.status === "LIVE",
      riders: counts[i]!.riders,
      boarded: counts[i]!.boarded,
    } satisfies TripRow;
  });
  await tellOfficeOfMissed(schoolId, missed);
  return { rows, loaded: trips };
}

/** The office's and the head's day: every trip, live, waiting, ended and missed. */
export async function dayTrips(ctx: ActiveContext, dateKey?: string): Promise<{ dateKey: string; trips: TripRow[] }> {
  const office = await officeOf(ctx, false);
  const { timezone } = await schoolZone(office.schoolId);
  const day = dateKey ?? todayKey(timezone);
  const { rows } = await readDay(office.schoolId, day);
  return { dateKey: day, trips: rows };
}

/** One trip in full: its stops in its order with when the bus passed them, the bus's track and the roster with the ticks. */
async function detailOf(schoolId: string, trip: LoadedTrip, row: TripRow): Promise<TripDetail> {
  const [positions, riders, boardings] = await Promise.all([
    db.tripPosition.findMany({ where: { tripId: trip.id }, orderBy: { at: "asc" }, select: { at: true, lat: true, lng: true, speed: true, accuracy: true } }),
    ridersOf(schoolId, trip.assignment.routeId, trip.dateKey, trip.direction),
    db.tripBoarding.findMany({ where: { tripId: trip.id }, select: { allotmentId: true, boardedAt: true, alightedAt: true } }),
  ]);
  const ordered = tripStops(trip.assignment.route.stops, trip.direction as TripDirection);
  const passed = passTimes(ordered, positions);
  const tick = new Map(boardings.map((b) => [b.allotmentId, b]));
  const orderOf = new Map(ordered.map((s, i) => [s.id, i]));
  const roster: RosterEntry[] = riders
    .map((r) => ({
      allotmentId: r.id,
      studentMembershipId: r.studentMembershipId,
      name: personName(r.student.user),
      className: r.student.enrollments[0]?.class.name ?? null,
      stopId: r.stopId,
      stopName: r.stop.name,
      rides: true,
      boardedAt: tick.get(r.id)?.boardedAt?.toISOString() ?? null,
      alightedAt: tick.get(r.id)?.alightedAt?.toISOString() ?? null,
    }))
    .sort((a, b) => (orderOf.get(a.stopId) ?? 0) - (orderOf.get(b.stopId) ?? 0) || a.name.localeCompare(b.name));
  return {
    ...row,
    stops: ordered.map((s) => ({ id: s.id, order: s.order, name: s.name, lat: s.lat, lng: s.lng, morningMinute: s.morningMinute, eveningMinute: s.eveningMinute, radiusM: s.radiusM, scheduledMinute: s.scheduledMinute, passedAt: passed.get(s.id)?.toISOString() ?? null })),
    track: positions.map((p) => positionView(p)!),
    roster,
  };
}

export async function tripDetail(ctx: ActiveContext, tripId: string): Promise<TripDetail> {
  const office = await officeOf(ctx, false);
  const trip = await db.trip.findFirst({ where: { id: tripId, schoolId: office.schoolId }, select: { dateKey: true } });
  if (!trip) throw new AccessError("transport.notFound", "NOT_FOUND");
  const { rows, loaded } = await readDay(office.schoolId, trip.dateKey, { id: tripId });
  return detailOf(office.schoolId, loaded[0]!, rows[0]!);
}

/* -------------------------------------------------------------------------- */
/* The driver                                                                  */
/* -------------------------------------------------------------------------- */

const mine = (d: Driver): Prisma.TripWhereInput => ({ assignment: { OR: [{ driverMembershipId: d.membershipId }, { attendantMembershipId: d.membershipId }] } });

export async function driverToday(ctx: ActiveContext): Promise<DriverToday> {
  const d = await driverOf(ctx);
  const { timezone } = await schoolZone(d.schoolId);
  const today = todayKey(timezone);
  const [{ rows, loaded }, consent, liveElsewhere] = await Promise.all([
    readDay(d.schoolId, today, mine(d)),
    db.transportConsent.findUnique({ where: { membershipId: d.membershipId }, select: { textKey: true, consentedAt: true } }),
    db.trip.count({ where: { schoolId: d.schoolId, status: "LIVE", ...mine(d) } }),
  ]);
  const trips = await Promise.all(
    loaded.map(async (t, i) => {
      const detail = await detailOf(d.schoolId, t, rows[i]!);
      const startable = (detail.status === "SCHEDULED" || detail.status === "MISSED") && t.dateKey === today && liveElsewhere === 0;
      return { ...detail, canStart: startable };
    }),
  );
  const agreed = consent?.textKey === CONSENT_TEXT_KEY;
  return { dateKey: today, consent: { needed: !agreed, textKey: CONSENT_TEXT_KEY, consentedAt: agreed ? consent!.consentedAt.toISOString() : null }, trips };
}

/** The driver's yes to the location sentence: once; saying it again changes nothing. */
export async function consentToLocation(ctx: ActiveContext): Promise<{ consentedAt: string; textKey: string }> {
  const d = await driverOf(ctx);
  const existing = await db.transportConsent.findUnique({ where: { membershipId: d.membershipId }, select: { textKey: true, consentedAt: true } });
  if (existing?.textKey === CONSENT_TEXT_KEY) return { consentedAt: existing.consentedAt.toISOString(), textKey: CONSENT_TEXT_KEY };
  const row = await db.transportConsent.upsert({
    where: { membershipId: d.membershipId },
    create: { schoolId: d.schoolId, membershipId: d.membershipId, textKey: CONSENT_TEXT_KEY },
    update: { textKey: CONSENT_TEXT_KEY, consentedAt: new Date() },
    select: { consentedAt: true },
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "transport.consent", targetType: "Membership", targetId: d.membershipId, meta: { textKey: CONSENT_TEXT_KEY } });
  return { consentedAt: row.consentedAt.toISOString(), textKey: CONSENT_TEXT_KEY };
}

async function driversTrip(d: Driver, tripId: string): Promise<LoadedTrip> {
  const trip = await db.trip.findFirst({ where: { id: tripId, schoolId: d.schoolId, ...mine(d) }, include: tripInclude });
  if (!trip) throw new AccessError("transport.notFound", "NOT_FOUND");
  return trip;
}

/**
 * Start a trip: today's, not started, the driver's (or attendant's), with
 * nothing else of theirs live, after the location sentence. At the first
 * stop (inside its fence, the phone's accuracy allowed) it starts; anywhere
 * else, or with no fix, only with the driver's reason, which the trip keeps.
 */
export async function startTrip(ctx: ActiveContext, tripId: string, body: TripStart): Promise<{ status: "LIVE" }> {
  const d = await driverOf(ctx);
  const trip = await driversTrip(d, tripId);
  const { timezone } = await schoolZone(d.schoolId);
  if (trip.status !== "SCHEDULED") throw new AccessError("transport.refuseStarted");
  if (trip.dateKey !== todayKey(timezone)) throw new AccessError("transport.refuseNotToday");
  const consent = await db.transportConsent.findUnique({ where: { membershipId: d.membershipId }, select: { textKey: true } });
  if (consent?.textKey !== CONSENT_TEXT_KEY) throw new AccessError("transport.refuseConsent");
  const live = await db.trip.count({ where: { schoolId: d.schoolId, status: "LIVE", ...mine(d) } });
  if (live > 0) throw new AccessError("transport.refuseOtherLive");
  const first = tripStops(trip.assignment.route.stops, trip.direction as TripDirection)[0];
  const here = body.lat !== undefined && body.lng !== undefined ? { lat: body.lat, lng: body.lng, accuracy: body.accuracy ?? null } : null;
  const atFirst = Boolean(first && here && withinFence(here, first));
  if (!atFirst && !body.reason) throw new AccessError("transport.refuseAway");
  const now = new Date();
  const claimed = await db.trip.updateMany({ where: { id: trip.id, status: "SCHEDULED" }, data: { status: "LIVE", startedAt: now, startedByMembershipId: d.membershipId, startReason: atFirst ? null : (body.reason ?? null) } });
  if (claimed.count === 0) throw new AccessError("transport.refuseStarted");
  if (here) await db.tripPosition.createMany({ data: [{ schoolId: d.schoolId, tripId: trip.id, at: now, lat: here.lat, lng: here.lng, accuracy: here.accuracy }], skipDuplicates: true });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "transport.trip.start", targetType: "Trip", targetId: trip.id, meta: { direction: trip.direction, atFirstStop: atFirst, reason: atFirst ? null : body.reason } });
  const riders = await ridersOf(d.schoolId, trip.assignment.routeId, trip.dateKey, trip.direction);
  publish([channel.school(d.schoolId), ...riders.map((r) => channel.student(r.studentMembershipId))], { type: "transport.trip", tripId: trip.id, status: "LIVE" });
  // The pupils at the first stop have no stop before theirs: they are told as the bus sets off.
  await tellNear(d.schoolId, { ...trip, status: "LIVE", startedAt: now }, riders);
  return { status: "LIVE" };
}

/** End a live trip. Ending an ended one answers as it stands; a trip never started cannot end. */
export async function endTrip(ctx: ActiveContext, tripId: string): Promise<{ status: "ENDED"; endedAt: string }> {
  const d = await driverOf(ctx);
  const trip = await driversTrip(d, tripId);
  if (trip.status === "ENDED") return { status: "ENDED", endedAt: trip.endedAt!.toISOString() };
  if (trip.status !== "LIVE") throw new AccessError("transport.refuseNotLive");
  const now = new Date();
  const claimed = await db.trip.updateMany({ where: { id: trip.id, status: "LIVE" }, data: { status: "ENDED", endedAt: now, endedByMembershipId: d.membershipId } });
  if (claimed.count === 0) {
    const again = await db.trip.findUniqueOrThrow({ where: { id: trip.id }, select: { endedAt: true } });
    return { status: "ENDED", endedAt: (again.endedAt ?? now).toISOString() };
  }
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "transport.trip.end", targetType: "Trip", targetId: trip.id, meta: { direction: trip.direction } });
  const riders = await ridersOf(d.schoolId, trip.assignment.routeId, trip.dateKey, trip.direction);
  publish([channel.school(d.schoolId), ...riders.map((r) => channel.student(r.studentMembershipId))], { type: "transport.trip", tripId: trip.id, status: "ENDED" });
  return { status: "ENDED", endedAt: now.toISOString() };
}

const lastPublished = new Map<string, number>();

/**
 * A batch of the bus's positions from the driver's phone, live or from its
 * outbox. Only a LIVE trip takes them (refused before the start and after
 * the end); positions outside the trip's time are dropped; one already
 * stored (the same instant) is not stored twice. A low battery flags the
 * trip for the office. Then the families whose stop comes next are told,
 * and the bus's place goes out on the school's and the riders' channels —
 * at most once in fifteen seconds per trip.
 */
export async function recordPositions(ctx: ActiveContext, tripId: string, body: TripPositions): Promise<{ accepted: number; duplicates: number }> {
  const d = await driverOf(ctx);
  const trip = await driversTrip(d, tripId);
  if (trip.status === "ENDED") throw new AccessError("transport.refuseEnded");
  if (trip.status !== "LIVE" || !trip.startedAt) throw new AccessError("transport.refuseNotLive");
  const now = Date.now();
  const from = trip.startedAt.getTime() - BEFORE_START_MS;
  const fresh = body.positions
    .map((p) => ({ ...p, at: new Date(p.at) }))
    .filter((p) => p.at.getTime() >= from && p.at.getTime() <= now + FUTURE_SLACK_MS);
  const created = fresh.length
    ? await db.tripPosition.createMany({
        data: fresh.map((p) => ({ schoolId: d.schoolId, tripId: trip.id, at: p.at, lat: p.lat, lng: p.lng, speed: p.speed ?? null, accuracy: p.accuracy ?? null })),
        skipDuplicates: true,
      })
    : { count: 0 };
  if (body.lowBattery && !trip.lowBatteryAt) {
    await db.trip.updateMany({ where: { id: trip.id, lowBatteryAt: null }, data: { lowBatteryAt: new Date() } });
  }
  if (created.count > 0) {
    const riders = await ridersOf(d.schoolId, trip.assignment.routeId, trip.dateKey, trip.direction);
    await tellNear(d.schoolId, trip, riders);
    const newest = fresh.reduce((a, b) => (a.at > b.at ? a : b));
    const lastAt = lastPublished.get(trip.id) ?? 0;
    if (now - lastAt >= PUBLISH_EVERY_MS) {
      lastPublished.set(trip.id, now);
      publish([channel.school(d.schoolId), ...riders.map((r) => channel.student(r.studentMembershipId))], { type: "transport.position", tripId: trip.id, lat: newest.lat, lng: newest.lng, at: newest.at.toISOString() });
    }
  }
  return { accepted: created.count, duplicates: body.positions.length - created.count };
}

/**
 * Tell each riding pupil's guardians, once per trip, that the bus has reached
 * the stop before theirs (as the bus sets off, for the first stop's pupils).
 * A guardian who switched it off for that child is not told. The pupil's
 * boarding row on the trip carries the "told" mark.
 */
async function tellNear(schoolId: string, trip: Pick<LoadedTrip, "id" | "direction" | "dateKey" | "status" | "assignment"> & { startedAt: Date | null }, riders: Awaited<ReturnType<typeof ridersOf>>): Promise<void> {
  if (trip.status !== "LIVE" || riders.length === 0) return;
  const ordered = tripStops(trip.assignment.route.stops, trip.direction as TripDirection);
  const positions = await db.tripPosition.findMany({ where: { tripId: trip.id }, select: { at: true, lat: true, lng: true } });
  const passed = passTimes(ordered, positions);
  const indexOf = new Map(ordered.map((s, i) => [s.id, i]));
  const due = riders.filter((r) => {
    const i = indexOf.get(r.stopId);
    if (i === undefined) return false;
    if (i === 0) return true;
    // Reached the stop before, or any stop after it (a missed fence still counts once the bus is past).
    return ordered.slice(i - 1).some((s) => passed.get(s.id));
  });
  if (due.length === 0) return;
  const already = await db.tripBoarding.findMany({ where: { tripId: trip.id, allotmentId: { in: due.map((r) => r.id) }, nearNotifiedAt: { not: null } }, select: { allotmentId: true } });
  const done = new Set(already.map((b) => b.allotmentId));
  const bus = trip.assignment.bus.registration;
  for (const r of due) {
    if (done.has(r.id)) continue;
    const row = await db.tripBoarding.upsert({ where: { tripId_allotmentId: { tripId: trip.id, allotmentId: r.id } }, create: { schoolId, tripId: trip.id, allotmentId: r.id }, update: {}, select: { id: true } });
    const claimed = await db.tripBoarding.updateMany({ where: { id: row.id, nearNotifiedAt: null }, data: { nearNotifiedAt: new Date() } });
    if (claimed.count === 0) continue;
    publish([channel.student(r.studentMembershipId)], { type: "transport.near", tripId: trip.id, studentMembershipId: r.studentMembershipId });
    const [guardians, off] = await Promise.all([
      db.guardianship.findMany({ where: { studentMembershipId: r.studentMembershipId, status: "ACTIVE" }, select: { parentUserId: true } }),
      db.transportAlertPref.findMany({ where: { studentMembershipId: r.studentMembershipId, nearAlerts: false }, select: { userId: true } }),
    ]);
    const quiet = new Set(off.map((o) => o.userId));
    const child = personName(r.student.user);
    await Promise.all(
      guardians
        .filter((g) => !quiet.has(g.parentUserId))
        .map((g) =>
          notify({
            userId: g.parentUserId,
            schoolId,
            kind: "SYSTEM",
            titleKey: "transport.notifNearTitle",
            titleVars: { bus },
            bodyKey: trip.direction === "MORNING" ? "transport.notifNearBodyMorning" : "transport.notifNearBodyEvening",
            bodyVars: { bus, name: child, stop: r.stop.name },
            url: `/parent/transport?child=${r.studentMembershipId}`,
          }).catch((error) => console.error("[transport] near notice", error instanceof Error ? error.message : error)),
        ),
    );
  }
}

/** Tick a pupil on or off the bus, or take a tick back, on a LIVE trip of the driver's; the pupil must ride this trip. */
export async function markBoarding(ctx: ActiveContext, tripId: string, body: TripBoardingBody): Promise<RosterEntry> {
  const d = await driverOf(ctx);
  const trip = await driversTrip(d, tripId);
  if (trip.status !== "LIVE") throw new AccessError("transport.refuseNotLive");
  const riders = await ridersOf(d.schoolId, trip.assignment.routeId, trip.dateKey, trip.direction);
  const seat = riders.find((r) => r.id === body.allotmentId);
  if (!seat) throw new AccessError("transport.refuseNotOnTrip");
  const at = body.at ? new Date(body.at) : new Date();
  const data: Prisma.TripBoardingUncheckedUpdateInput = { markedByMembershipId: d.membershipId };
  if (body.boarded !== undefined) data.boardedAt = body.boarded ? at : null;
  if (body.alighted !== undefined) data.alightedAt = body.alighted ? at : null;
  const row = await db.tripBoarding.upsert({
    where: { tripId_allotmentId: { tripId: trip.id, allotmentId: seat.id } },
    create: { schoolId: d.schoolId, tripId: trip.id, allotmentId: seat.id, markedByMembershipId: d.membershipId, boardedAt: body.boarded ? at : null, alightedAt: body.alighted ? at : null },
    update: data,
    select: { boardedAt: true, alightedAt: true },
  });
  return {
    allotmentId: seat.id,
    studentMembershipId: seat.studentMembershipId,
    name: personName(seat.student.user),
    className: seat.student.enrollments[0]?.class.name ?? null,
    stopId: seat.stopId,
    stopName: seat.stop.name,
    rides: true,
    boardedAt: row.boardedAt?.toISOString() ?? null,
    alightedAt: row.alightedAt?.toISOString() ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* The family                                                                  */
/* -------------------------------------------------------------------------- */

/** Which child a request is about: a guardian's own (refused otherwise), or the pupil themself. */
async function childOf(ctx: ActiveContext, childId?: string | null): Promise<{ studentMembershipId: string; name: string; schoolId: string; schoolName: string }> {
  if (ctx.role === "STUDENT") {
    if (!ctx.membershipId || !ctx.schoolId) throw new AccessError("access.notAllowed");
    const m = await db.membership.findUniqueOrThrow({ where: { id: ctx.membershipId }, select: { schoolId: true, school: { select: { name: true } }, user: { select: { name: true, preferredName: true } } } });
    return { studentMembershipId: ctx.membershipId, name: personName(m.user), schoolId: m.schoolId, schoolName: m.school.name };
  }
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  let id = childId ?? null;
  if (!id) {
    const first = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentMembershipId: true }, orderBy: { createdAt: "asc" } });
    if (!first) throw new AccessError("access.notYourChild", "NOT_FOUND");
    id = first.studentMembershipId;
  }
  const link = await assertGuardianAccess(ctx.user.id, id);
  return { studentMembershipId: id, name: personName(link.student.user), schoolId: link.student.school.id, schoolName: link.student.school.name };
}

/**
 * A child's transport for their family: the route, the stop and its times,
 * the bus's number (the driver's name and telephone only when the school
 * says so), this guardian's alert switch, and today's trip that the child
 * rides — LIVE first, else the latest — with the bus's last position, how
 * stale it is, when it passed each stop and the arrival range at theirs.
 */
export async function familyTransport(ctx: ActiveContext, childId?: string | null): Promise<FamilyTransport> {
  const child = await childOf(ctx, childId);
  const base = { studentMembershipId: child.studentMembershipId, childName: child.name, schoolName: child.schoolName };
  if (!(await isModuleOn(child.schoolId, "TRANSPORT"))) return { ...base, moduleOn: false, seat: null, nearAlerts: true, trip: null };
  const { timezone } = await schoolZone(child.schoolId);
  const today = todayKey(timezone);
  const [seat, pref, settings] = await Promise.all([
    db.transportAllotment.findFirst({
      where: { schoolId: child.schoolId, studentMembershipId: child.studentMembershipId, ...currentWhere(today) },
      select: { id: true, routeId: true, stopId: true, boards: true, alights: true, route: { select: { name: true } }, stop: { select: { name: true, morningMinute: true, eveningMinute: true } } },
      orderBy: { fromDateKey: "desc" },
    }),
    db.transportAlertPref.findUnique({ where: { studentMembershipId_userId: { studentMembershipId: child.studentMembershipId, userId: ctx.user.id } }, select: { nearAlerts: true } }),
    transportSettings(child.schoolId),
  ]);
  const nearAlerts = pref?.nearAlerts ?? true;
  if (!seat) return { ...base, moduleOn: true, seat: null, nearAlerts, trip: null };

  const { rows, loaded } = await readDay(child.schoolId, today, { assignment: { routeId: seat.routeId } });
  const assignment = await db.busAssignment.findFirst({
    where: { schoolId: child.schoolId, routeId: seat.routeId, ...currentWhere(today) },
    select: { bus: { select: { registration: true } }, driver: { select: { user: { select: { name: true, phone: true } } } } },
    orderBy: { fromDateKey: "desc" },
  });
  const seatView = {
    routeName: seat.route.name,
    stopName: seat.stop.name,
    boards: seat.boards,
    alights: seat.alights,
    morningMinute: seat.stop.morningMinute,
    eveningMinute: seat.stop.eveningMinute,
    busRegistration: assignment?.bus.registration ?? null,
    driverName: settings.showDriverToParents ? (assignment?.driver.user.name ?? null) : null,
    driverPhone: settings.showDriverToParents ? (assignment?.driver.user.phone ?? null) : null,
  };
  const candidates = loaded.map((t, i) => ({ t, row: rows[i]! })).filter(({ t }) => ridesOn(seat, t.direction));
  const pick = candidates.find((c) => c.row.status === "LIVE") ?? [...candidates].sort((a, b) => (b.t.startedAt?.getTime() ?? 0) - (a.t.startedAt?.getTime() ?? 0))[0];
  if (!pick) return { ...base, moduleOn: true, seat: seatView, nearAlerts, trip: null };

  const { t, row } = pick;
  const now = new Date();
  const [positions, tick] = await Promise.all([
    db.tripPosition.findMany({ where: { tripId: t.id }, orderBy: { at: "asc" }, select: { at: true, lat: true, lng: true, speed: true, accuracy: true } }),
    db.tripBoarding.findUnique({ where: { tripId_allotmentId: { tripId: t.id, allotmentId: seat.id } }, select: { boardedAt: true, alightedAt: true } }),
  ]);
  const ordered = tripStops(t.assignment.route.stops, t.direction as TripDirection);
  const passed = passTimes(ordered, positions);
  const dayStart = zonedStartOfDay(t.dateKey, timezone);
  const last = positions[positions.length - 1];
  const staleSeconds = last ? (now.getTime() - last.at.getTime()) / 1000 : null;
  let eta: { earliest: string; latest: string } | null = null;
  const mineStop = ordered.find((s) => s.id === seat.stopId);
  if (row.status === "LIVE" && mineStop && mineStop.scheduledMinute !== null && !passed.get(mineStop.id)) {
    const mineIndex = ordered.indexOf(mineStop);
    const before = ordered
      .slice(0, mineIndex)
      .filter((s) => s.scheduledMinute !== null && passed.get(s.id))
      .map((s) => ({ scheduled: atMinute(dayStart, s.scheduledMinute!), passedAt: passed.get(s.id)! }));
    const range = etaRange({ target: atMinute(dayStart, mineStop.scheduledMinute), passed: before, now });
    eta = { earliest: range.earliest.toISOString(), latest: range.latest.toISOString() };
  }
  return {
    ...base,
    moduleOn: true,
    seat: seatView,
    nearAlerts,
    trip: {
      id: t.id,
      direction: t.direction as TripDirection,
      status: row.status,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      lastPosition: row.status === "LIVE" ? positionView(last) : null,
      staleMinutes: row.status === "LIVE" && staleSeconds !== null && staleSeconds > POSITION_STALE_SECONDS ? Math.floor(staleSeconds / 60) : null,
      eta,
      stops: ordered.map((s) => ({ id: s.id, order: s.order, name: s.name, lat: s.lat, lng: s.lng, scheduledMinute: s.scheduledMinute, passedAt: passed.get(s.id)?.toISOString() ?? null, mine: s.id === seat.stopId })),
      boardedAt: tick?.boardedAt?.toISOString() ?? null,
      alightedAt: tick?.alightedAt?.toISOString() ?? null,
    },
  };
}

/** A guardian switches the near-stop alert for one of their children. Audited only when it changes. */
export async function setNearAlerts(ctx: ActiveContext, childId: string, nearAlerts: boolean): Promise<{ nearAlerts: boolean }> {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const link = await assertGuardianAccess(ctx.user.id, childId);
  const schoolId = link.student.school.id;
  await assertModuleOn(schoolId, "TRANSPORT");
  const before = await db.transportAlertPref.findUnique({ where: { studentMembershipId_userId: { studentMembershipId: childId, userId: ctx.user.id } }, select: { nearAlerts: true } });
  if ((before?.nearAlerts ?? true) === nearAlerts) return { nearAlerts };
  await db.transportAlertPref.upsert({
    where: { studentMembershipId_userId: { studentMembershipId: childId, userId: ctx.user.id } },
    create: { schoolId, studentMembershipId: childId, userId: ctx.user.id, nearAlerts },
    update: { nearAlerts },
  });
  await audit({ schoolId, actorUserId: ctx.user.id, action: nearAlerts ? "transport.alerts.on" : "transport.alerts.off", targetType: "Membership", targetId: childId });
  return { nearAlerts };
}
