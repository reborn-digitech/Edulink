import { z } from "zod";

/**
 * Transport (the owner's decision of 3 October 2026), an optional module:
 * the office's routes, stops, buses, who drives which bus and who rides
 * from which stop; the driver's day (start a trip, tick the roster, send
 * the bus's position, end the trip); and a family's view of their child's
 * bus. Every location here is the BUS's or a STOP's — none is a child's
 * (decision 0002) — and the driver's phone sends one only between Start and
 * End of a trip.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const minute = z.number().int().min(0).max(1439);
const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

export const TRANSPORT_DIRECTIONS = ["MORNING", "EVENING", "BOTH"] as const;
export const transportDirectionSchema = z.enum(TRANSPORT_DIRECTIONS);
export type TransportDirection = z.infer<typeof transportDirectionSchema>;
/** A trip runs one way: the morning in stop order to the school, the evening in reverse from it. */
export const TRIP_DIRECTIONS = ["MORNING", "EVENING"] as const;
export const tripDirectionSchema = z.enum(TRIP_DIRECTIONS);
export type TripDirection = z.infer<typeof tripDirectionSchema>;
/** MISSED is read, never stored: a SCHEDULED trip ten minutes past its first stop's time. */
export const TRIP_STATUSES = ["SCHEDULED", "LIVE", "ENDED", "MISSED"] as const;
export const tripStatusSchema = z.enum(TRIP_STATUSES);
export type TripStatus = z.infer<typeof tripStatusSchema>;

/** Minutes past its first stop's time after which a trip that has not started is read as missed. */
export const TRIP_MISSED_AFTER_MINUTES = 10;
/** How often the driver's phone samples the bus's position during a trip, and the most a batch carries. */
export const POSITION_INTERVAL_SECONDS = 12;
export const POSITIONS_PER_BATCH = 200;
/** A live trip whose last position is older than this reads "last seen n minutes ago". */
export const POSITION_STALE_SECONDS = 120;

/* -------------------------------------------------------------------------- */
/* The office: routes, stops, buses, assignments, allotments                   */
/* -------------------------------------------------------------------------- */

export const transportStopInputSchema = z.object({
  /** Kept when the stop already exists, so the pupils allotted to it stay with it. */
  id: cuid.optional(),
  name: z.string().trim().min(1).max(80),
  lat,
  lng,
  morningMinute: minute.nullable().default(null),
  eveningMinute: minute.nullable().default(null),
  radiusM: z.number().int().min(30).max(2000).default(150),
});
export type TransportStopInput = z.infer<typeof transportStopInputSchema>;

/** POST /api/v1/admin/transport/routes and PUT …/routes/{routeId}: the route and its stops in the morning's order. */
export const transportRouteInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  direction: transportDirectionSchema.default("BOTH"),
  active: z.boolean().default(true),
  note: z.string().trim().max(500).default(""),
  stops: z.array(transportStopInputSchema).min(1).max(60),
});
export type TransportRouteInput = z.infer<typeof transportRouteInputSchema>;

export const transportStopSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  morningMinute: z.number().int().nullable(),
  eveningMinute: z.number().int().nullable(),
  radiusM: z.number().int(),
});
export type TransportStop = z.infer<typeof transportStopSchema>;

export const transportRouteSchema = z.object({
  id: z.string(),
  name: z.string(),
  direction: transportDirectionSchema,
  active: z.boolean(),
  note: z.string(),
  stops: z.array(transportStopSchema),
  /** Pupils allotted to it today. */
  riders: z.number().int(),
});
export type TransportRoute = z.infer<typeof transportRouteSchema>;

/** POST /api/v1/admin/transport/buses and PUT …/buses/{busId}. */
export const busInputSchema = z.object({
  registration: z
    .string()
    .trim()
    .min(4)
    .max(16)
    .transform((s) => s.toUpperCase().replace(/\s+/g, " "))
    .refine((s) => /^[A-Z0-9 -]+$/.test(s), "registration"),
  capacity: z.number().int().min(1).max(120),
  note: z.string().trim().max(300).default(""),
  active: z.boolean().default(true),
});
export type BusInput = z.infer<typeof busInputSchema>;

export const busSchema = z.object({
  id: z.string(),
  registration: z.string(),
  capacity: z.number().int(),
  note: z.string(),
  active: z.boolean(),
});
export type BusView = z.infer<typeof busSchema>;

/** POST /api/v1/admin/transport/assignments: this bus on this route, driven by a DRIVER member of staff, from this day. */
export const busAssignmentInputSchema = z.object({
  busId: cuid,
  routeId: cuid,
  driverMembershipId: cuid,
  attendantMembershipId: cuid.nullable().default(null),
  fromDateKey: dateKey.optional(),
});
export type BusAssignmentInput = z.infer<typeof busAssignmentInputSchema>;

export const busAssignmentSchema = z.object({
  id: z.string(),
  busId: z.string(),
  busRegistration: z.string(),
  routeId: z.string(),
  routeName: z.string(),
  driverMembershipId: z.string(),
  driverName: z.string(),
  attendantMembershipId: z.string().nullable(),
  attendantName: z.string().nullable(),
  fromDateKey: z.string(),
  toDateKey: z.string().nullable(),
  /** Runs today. */
  current: z.boolean(),
});
export type BusAssignmentView = z.infer<typeof busAssignmentSchema>;

/** The module's own settings, kept on its SchoolModule row. */
export const transportSettingsSchema = z.object({
  /** Families see the driver's name and telephone beside the bus number. Off by default: the bus number alone. */
  showDriverToParents: z.boolean(),
});
export type TransportSettings = z.infer<typeof transportSettingsSchema>;

/** GET /api/v1/admin/transport — everything the office's transport page draws, the head's to read. */
export const transportOverviewSchema = z.object({
  todayKey: z.string(),
  settings: transportSettingsSchema,
  routes: z.array(transportRouteSchema),
  buses: z.array(busSchema),
  assignments: z.array(busAssignmentSchema),
  /** The school's DRIVER members of staff, for the assignment form. */
  drivers: z.array(z.object({ membershipId: z.string(), name: z.string() })),
  /** The fees module's transport heads, for an allotment to name; empty when the school keeps none. */
  feeHeads: z.array(z.object({ id: z.string(), name: z.string() })),
  canEdit: z.boolean(),
});
export type TransportOverview = z.infer<typeof transportOverviewSchema>;

/** POST /api/v1/admin/transport/allotments: these pupils ride this route from this stop (any seat they held before ends the day before). */
export const transportAllotInputSchema = z.object({
  studentMembershipIds: z.array(cuid).min(1).max(200),
  routeId: cuid,
  stopId: cuid,
  boards: z.boolean().default(true),
  alights: z.boolean().default(true),
  fromDateKey: dateKey.optional(),
  feeHeadId: cuid.nullable().default(null),
});
export type TransportAllotInput = z.infer<typeof transportAllotInputSchema>;

export const transportAllotmentSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  routeId: z.string(),
  routeName: z.string(),
  stopId: z.string(),
  stopName: z.string(),
  boards: z.boolean(),
  alights: z.boolean(),
  fromDateKey: z.string(),
  toDateKey: z.string().nullable(),
  feeHeadId: z.string().nullable(),
});
export type TransportAllotmentView = z.infer<typeof transportAllotmentSchema>;

/** GET /api/v1/admin/transport/allotments?routeId=&classId= — the current seats, and a class's pupils to choose from. */
export const transportAllotmentsQuerySchema = z.object({ routeId: cuid.optional(), classId: cuid.optional() });
export const transportAllotmentsSchema = z.object({
  allotments: z.array(transportAllotmentSchema),
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
  /** The chosen class's pupils, each with the seat they hold today if any; empty without ?classId=. */
  pupils: z.array(z.object({ studentMembershipId: z.string(), name: z.string(), allotmentId: z.string().nullable(), routeName: z.string().nullable(), stopName: z.string().nullable() })),
});
export type TransportAllotments = z.infer<typeof transportAllotmentsSchema>;
export const transportAllotResultSchema = z.object({ allotted: z.number().int(), ended: z.number().int() });

/* -------------------------------------------------------------------------- */
/* Trips                                                                       */
/* -------------------------------------------------------------------------- */

export const busPositionSchema = z.object({
  at: iso,
  lat: z.number(),
  lng: z.number(),
  speed: z.number().nullable(),
  accuracy: z.number().nullable(),
});
export type BusPosition = z.infer<typeof busPositionSchema>;

export const tripRowSchema = z.object({
  id: z.string(),
  dateKey: z.string(),
  direction: tripDirectionSchema,
  status: tripStatusSchema,
  /** The first stop's time on this trip, minutes after midnight in school time; null when the stops carry none. */
  scheduledMinute: z.number().int().nullable(),
  startedAt: iso.nullable(),
  endedAt: iso.nullable(),
  startReason: z.string().nullable(),
  busRegistration: z.string(),
  routeId: z.string(),
  routeName: z.string(),
  driverName: z.string(),
  lastPosition: busPositionSchema.nullable(),
  /** The driver's phone said its battery ran low during the trip. */
  lowBattery: z.boolean(),
  riders: z.number().int(),
  boarded: z.number().int(),
});
export type TripRow = z.infer<typeof tripRowSchema>;

/** GET /api/v1/admin/transport/trips?date= — a day's trips, live, ended, waiting and missed. */
export const transportTripsQuerySchema = z.object({ date: dateKey.optional() });
export const transportTripsSchema = z.object({ dateKey: z.string(), trips: z.array(tripRowSchema) });
export type TransportTrips = z.infer<typeof transportTripsSchema>;

export const rosterEntrySchema = z.object({
  allotmentId: z.string(),
  studentMembershipId: z.string(),
  name: z.string(),
  className: z.string().nullable(),
  stopId: z.string(),
  stopName: z.string(),
  /** Rides this way on this trip: picked up in the morning, set down in the evening. */
  rides: z.boolean(),
  boardedAt: iso.nullable(),
  alightedAt: iso.nullable(),
});
export type RosterEntry = z.infer<typeof rosterEntrySchema>;

/** A stop on one trip, in the trip's order, with when the bus passed it (read from its positions). */
export const tripStopSchema = transportStopSchema.extend({ scheduledMinute: z.number().int().nullable(), passedAt: iso.nullable() });
export type TripStop = z.infer<typeof tripStopSchema>;

/** GET /api/v1/admin/transport/trips/{tripId} — one trip: its stops, the bus's track and the roster. */
export const tripDetailSchema = tripRowSchema.extend({
  stops: z.array(tripStopSchema),
  track: z.array(busPositionSchema),
  roster: z.array(rosterEntrySchema),
});
export type TripDetail = z.infer<typeof tripDetailSchema>;

/* -------------------------------------------------------------------------- */
/* The driver                                                                  */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/transport/today — the driver's (or attendant's) trips today, each with its stops and roster. */
export const driverTodaySchema = z.object({
  dateKey: z.string(),
  /** The location sentence, once: `needed` until the driver has said yes to this one. */
  consent: z.object({ needed: z.boolean(), textKey: z.string(), consentedAt: iso.nullable() }),
  /**
   * Set on a day the school is shut (not one of its teaching days, or a
   * closing holiday, named when there is one): no trip runs and none is
   * waiting to start or read as missed. Null or absent on an open day.
   */
  noSchool: z.object({ holidayName: z.string().nullable() }).nullable().optional(),
  trips: z.array(
    tripDetailSchema.extend({
      /** Startable now: SCHEDULED (or read as MISSED), today, and the driver has no other trip live. */
      canStart: z.boolean(),
    }),
  ),
});
export type DriverToday = z.infer<typeof driverTodaySchema>;

/**
 * POST /api/v1/transport/trips/{tripId}/start. The phone sends where it is;
 * within the first stop's radius the trip starts. Anywhere else — or with no
 * location at all — it starts only with the driver's reason, which is kept.
 */
export const tripStartSchema = z
  .object({
    lat: lat.optional(),
    lng: lng.optional(),
    accuracy: z.number().min(0).max(10_000).optional(),
    reason: z.string().trim().min(3).max(200).optional(),
  })
  .refine((b) => (b.lat !== undefined && b.lng !== undefined) || b.reason !== undefined, { message: "location or reason", path: ["reason"] });
export type TripStart = z.infer<typeof tripStartSchema>;

/** POST /api/v1/transport/trips/{tripId}/positions — a batch from the phone, sent live or later from its outbox. */
export const tripPositionsSchema = z.object({
  positions: z
    .array(
      z.object({
        at: iso,
        lat,
        lng,
        speed: z.number().min(0).max(100).nullable().optional(),
        accuracy: z.number().min(0).max(10_000).nullable().optional(),
      }),
    )
    .min(1)
    .max(POSITIONS_PER_BATCH),
  /** The phone's battery, 0–1, and whether it says it is low: the office sees a flag. */
  battery: z.number().min(0).max(1).optional(),
  lowBattery: z.boolean().optional(),
});
export type TripPositions = z.infer<typeof tripPositionsSchema>;
export const tripPositionsResultSchema = z.object({ accepted: z.number().int(), duplicates: z.number().int() });

/** POST /api/v1/transport/trips/{tripId}/boardings — tick a pupil on or off the bus (or untick) on a LIVE trip. */
export const tripBoardingSchema = z
  .object({
    allotmentId: cuid,
    boarded: z.boolean().optional(),
    alighted: z.boolean().optional(),
    at: iso.optional(),
  })
  .refine((b) => b.boarded !== undefined || b.alighted !== undefined, { message: "boarded or alighted", path: ["boarded"] });
export type TripBoardingBody = z.infer<typeof tripBoardingSchema>;

/** POST /api/v1/transport/consent — the driver's yes to the location sentence. */
export const transportConsentSchema = z.object({ consentedAt: iso, textKey: z.string() });

/* -------------------------------------------------------------------------- */
/* The family                                                                  */
/* -------------------------------------------------------------------------- */

export const familyTransportQuerySchema = z.object({ childId: cuid.optional() });

/** GET /api/v1/family/transport?childId= — the child's route and stop, and the bus while a trip is live. */
export const familyTransportSchema = z.object({
  studentMembershipId: z.string(),
  childName: z.string(),
  schoolName: z.string(),
  /** Whether the child's school has transport on at all. */
  moduleOn: z.boolean(),
  seat: z
    .object({
      routeName: z.string(),
      stopName: z.string(),
      boards: z.boolean(),
      alights: z.boolean(),
      morningMinute: z.number().int().nullable(),
      eveningMinute: z.number().int().nullable(),
      busRegistration: z.string().nullable(),
      /** Only when the school has said families may see them. */
      driverName: z.string().nullable(),
      driverPhone: z.string().nullable(),
    })
    .nullable(),
  /** This guardian's "tell me when the bus is near" for this child. */
  nearAlerts: z.boolean(),
  trip: z
    .object({
      id: z.string(),
      direction: tripDirectionSchema,
      status: tripStatusSchema,
      startedAt: iso.nullable(),
      endedAt: iso.nullable(),
      lastPosition: busPositionSchema.nullable(),
      /** Minutes since the last position when the feed is stale; null while it is fresh. */
      staleMinutes: z.number().int().nullable(),
      /** The bus's estimated arrival at the child's stop, as a range, from how late it was at the stops already passed; null once passed or before the start. */
      eta: z.object({ earliest: iso, latest: iso }).nullable(),
      stops: z.array(z.object({ id: z.string(), order: z.number().int(), name: z.string(), lat: z.number(), lng: z.number(), scheduledMinute: z.number().int().nullable(), passedAt: iso.nullable(), mine: z.boolean() })),
      boardedAt: iso.nullable(),
      alightedAt: iso.nullable(),
    })
    .nullable(),
});
export type FamilyTransport = z.infer<typeof familyTransportSchema>;

/** POST /api/v1/family/transport/alerts — switch the near-stop alert for one child, for this guardian. */
export const transportAlertsSchema = z.object({ childId: cuid, nearAlerts: z.boolean() });
export const transportAlertsResultSchema = z.object({ nearAlerts: z.boolean() });
