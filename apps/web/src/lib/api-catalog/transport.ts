import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * transport (3 Oct 2026): the office's routes, buses, assignments and seats
 * under /admin/transport (the head reads), the driver's day under
 * /transport, and a family's view of their child's bus under /family. Every
 * door is the TRANSPORT module's: a school that has not switched it on
 * answers 403 MODULE_OFF before the handler runs (role-gate.ts).
 *
 * SAMPLES. The ZZ Northgate rows the sweep reads have fixed ids
 * (scripts/zz-transport.ts), so a sample is a fixed path. The driver's doors
 * that change a trip are sampled on the fixture's ENDED trip, where an empty
 * body is refused for its shape (422) and End answers the trip as it stands
 * (200) — nothing the sweep sends starts, moves or ticks a bus; the
 * office's end doors are sampled on an assignment and a seat already ended.
 */
export const ZZ_TRANSPORT = {
  routeId: "czztransportroutenorthgate01",
  stopIds: ["czztransportstopnorthgate001", "czztransportstopnorthgate002", "czztransportstopnorthgate003"],
  busId: "czztransportbusnorthgate0001",
  assignmentId: "czztransportassignnorthgate1",
  allotmentIds: ["czztransportallotnorthgate01", "czztransportallotnorthgate02"],
  /** An assignment and a seat already ended, for the sweep's end doors to answer as they stand. */
  endedAssignmentId: "czztransportassignendednorth1",
  endedAllotmentId: "czztransportallotendednorth01",
  endedTripId: "czztransporttripendednorthg1",
  todayTripId: "czztransporttriptodaynorthg1",
} as const;

const M = "TRANSPORT" as const;
const OFFICE: c.RoleCode[] = ["ADMIN", "PRINCIPAL"];
const trip = (rest: string) => `/api/v1/transport/trips/${ZZ_TRANSPORT.endedTripId}${rest}`;

export const TRANSPORT: Endpoint[] = [
  // The office (the head reads every GET; only the ADMIN writes).
  { method: "GET", path: "/api/v1/admin/transport", summary: "Transport at a glance: routes with their stops and riders, buses, assignments, the school's drivers, its transport fee heads and the module's settings", access: OFFICE, module: M, response: c.transportOverviewSchema },
  { method: "PUT", path: "/api/v1/admin/transport/settings", summary: "The module's settings: whether families see the driver's name and telephone beside the bus number (off by default)", access: ["ADMIN"], module: M, request: c.transportSettingsSchema, response: c.transportSettingsSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/transport/routes", summary: "Make a route with its stops in the morning's order (name, place, the morning's and evening's times, the geofence)", access: ["ADMIN"], module: M, request: c.transportRouteInputSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "PUT", path: "/api/v1/admin/transport/routes/{routeId}", summary: "Rewrite a route and its stops: a stop sent with its id keeps its pupils; one left out is removed, refused while a seat names it", access: ["ADMIN"], module: M, request: c.transportRouteInputSchema, response: c.okSchema, emptyBodyStatus: 422, sample: `/api/v1/admin/transport/routes/${ZZ_TRANSPORT.routeId}` },
  { method: "POST", path: "/api/v1/admin/transport/buses", summary: "Add a bus: its registration, seats and a note", access: ["ADMIN"], module: M, request: c.busInputSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "PUT", path: "/api/v1/admin/transport/buses/{busId}", summary: "Change a bus, or take it off the road (active false)", access: ["ADMIN"], module: M, request: c.busInputSchema, response: c.okSchema, emptyBodyStatus: 422, sample: `/api/v1/admin/transport/buses/${ZZ_TRANSPORT.busId}` },
  { method: "GET", path: "/api/v1/admin/transport/buses/{busId}/roster", summary: "One bus's roster as a file (?format=csv|xlsx): every pupil on every route it runs today, by stop, with the morning and evening times", access: OFFICE, module: M, response: c.okSchema, sample: `/api/v1/admin/transport/buses/${ZZ_TRANSPORT.busId}/roster` },
  { method: "POST", path: "/api/v1/admin/transport/assignments", summary: "Put a bus on a route with a driver (a DRIVER member of staff) and an attendant if any, from a day (today when not said)", access: ["ADMIN"], module: M, request: c.busAssignmentInputSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/transport/assignments/{assignmentId}/end", summary: "Its last day is today (one not begun never runs); ending an ended one changes nothing", access: ["ADMIN"], module: M, response: c.okSchema, sample: `/api/v1/admin/transport/assignments/${ZZ_TRANSPORT.endedAssignmentId}/end` },
  { method: "GET", path: "/api/v1/admin/transport/allotments", summary: "The seats held today (?routeId=), the classes, and a class's pupils with the seat each holds (?classId=)", access: OFFICE, module: M, request: c.transportAllotmentsQuerySchema, response: c.transportAllotmentsSchema },
  { method: "POST", path: "/api/v1/admin/transport/allotments", summary: "Give pupils a seat: a route, a stop, morning pick-up and evening drop, from a day; a seat held before ends the day before", access: ["ADMIN"], module: M, request: c.transportAllotInputSchema, response: c.transportAllotResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/transport/allotments/{allotmentId}/end", summary: "A pupil's seat's last day is today; ending an ended seat changes nothing", access: ["ADMIN"], module: M, response: c.okSchema, sample: `/api/v1/admin/transport/allotments/${ZZ_TRANSPORT.endedAllotmentId}/end` },
  { method: "GET", path: "/api/v1/admin/transport/trips", summary: "A day's trips (?date=, today when not said): live with the bus's last position, waiting, ended, and missed (not started ten minutes after the first stop's time; the office is told once)", access: OFFICE, module: M, request: c.transportTripsQuerySchema, response: c.transportTripsSchema },
  { method: "GET", path: "/api/v1/admin/transport/trips/{tripId}", summary: "One trip: its stops in order with when the bus passed each, the bus's track and the roster with its ticks", access: OFFICE, module: M, response: c.tripDetailSchema, sample: `/api/v1/admin/transport/trips/${ZZ_TRANSPORT.endedTripId}` },
  // The driver (or attendant): their own trips today.
  { method: "GET", path: "/api/v1/transport/today", summary: "The driver's trips today, each with its stops, roster and whether it may start, and whether the location sentence still needs a yes", access: ["DRIVER"], module: M, response: c.driverTodaySchema },
  { method: "POST", path: "/api/v1/transport/consent", summary: "The driver's yes to the location sentence: the phone's location is sent between Start and End of a trip only; once", access: ["DRIVER"], module: M, response: c.transportConsentSchema },
  { method: "POST", path: "/api/v1/transport/trips/{tripId}/start", summary: "Start a trip of today's: at the first stop (inside its geofence), or anywhere with a reason; refused twice, before the location sentence, or with another trip live", access: ["DRIVER"], module: M, request: c.tripStartSchema, response: c.okSchema, emptyBodyStatus: 422, sample: trip("/start") },
  { method: "POST", path: "/api/v1/transport/trips/{tripId}/positions", summary: "A batch of the bus's positions from the driver's phone (live or from its outbox, the same instant stored once), with a low-battery flag; refused unless the trip is live", access: ["DRIVER"], module: M, request: c.tripPositionsSchema, response: c.tripPositionsResultSchema, emptyBodyStatus: 422, sample: trip("/positions") },
  { method: "POST", path: "/api/v1/transport/trips/{tripId}/boardings", summary: "Tick a pupil on or off the bus, or take the tick back, on a live trip", access: ["DRIVER"], module: M, request: c.tripBoardingSchema, response: c.rosterEntrySchema, emptyBodyStatus: 422, sample: trip("/boardings") },
  { method: "POST", path: "/api/v1/transport/trips/{tripId}/end", summary: "End a live trip; an ended one answers as it stands", access: ["DRIVER"], module: M, response: c.okSchema, sample: trip("/end") },
  // A family: their own child's bus.
  { method: "GET", path: "/api/v1/family/transport", summary: "A child's route, stop and times, the bus's number, this guardian's near-stop alert, and today's trip with the bus's position, staleness, stops passed and the arrival range (?childId=) — or the pupil's own", access: ["PARENT", "STUDENT"], module: M, request: c.familyTransportQuerySchema, response: c.familyTransportSchema },
  { method: "POST", path: "/api/v1/family/transport/alerts", summary: "Switch the \"bus is near\" notification for one child, for this guardian", access: ["PARENT"], module: M, request: c.transportAlertsSchema, response: c.transportAlertsResultSchema, emptyBodyStatus: 422 },
];
