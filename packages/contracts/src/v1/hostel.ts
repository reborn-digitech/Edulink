import { z } from "zod";
import { bloodGroupSchema, healthContactSchema } from "./health";
import { incidentKindSchema, incidentSeveritySchema } from "./incidents";

/**
 * The hostel module (module HOSTEL, role WARDEN; the owner's decision of
 * 3 October 2026). Houses, rooms and beds; who boards where; leave that a
 * pupil asks for, a guardian consents to and the warden approves; the gate's
 * out and in; the morning and night roll call; the mess menu; the visitor
 * book. A hostel incident is the school's incident log with a hostel tag, and
 * a hostel fee is the fees module's demand — the allotment only links it.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");

export const HOSTEL_KINDS = ["BOYS", "GIRLS", "MIXED"] as const;
export const hostelKindSchema = z.enum(HOSTEL_KINDS);
export const HOSTEL_ROOM_KINDS = ["DORMITORY", "SHARED", "SINGLE", "SICK_BAY"] as const;
export const hostelRoomKindSchema = z.enum(HOSTEL_ROOM_KINDS);
export const HOSTEL_LEAVE_KINDS = ["HOME", "LOCAL", "MEDICAL"] as const;
export const hostelLeaveKindSchema = z.enum(HOSTEL_LEAVE_KINDS);
export type HostelLeaveKind = z.infer<typeof hostelLeaveKindSchema>;
export const HOSTEL_LEAVE_STATUSES = ["AWAITING_CONSENT", "PENDING", "APPROVED", "DECLINED", "CANCELLED"] as const;
export const hostelLeaveStatusSchema = z.enum(HOSTEL_LEAVE_STATUSES);
export type HostelLeaveStatus = z.infer<typeof hostelLeaveStatusSchema>;
export const HOSTEL_ROLL_SLOTS = ["MORNING", "NIGHT"] as const;
export const hostelRollSlotSchema = z.enum(HOSTEL_ROLL_SLOTS);
export type HostelRollSlot = z.infer<typeof hostelRollSlotSchema>;
export const HOSTEL_ROLL_STATUSES = ["PRESENT", "ON_LEAVE", "ABSENT"] as const;
export const hostelRollStatusSchema = z.enum(HOSTEL_ROLL_STATUSES);
export type HostelRollStatus = z.infer<typeof hostelRollStatusSchema>;
export const MESS_MEALS = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"] as const;
export const messMealSchema = z.enum(MESS_MEALS);
export type MessMeal = z.infer<typeof messMealSchema>;

/* ---- houses, rooms, beds ------------------------------------------------- */

export const hostelSaveSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(1).max(80),
  kind: hostelKindSchema,
  capacity: z.number().int().min(0).max(5000),
  wardenMembershipId: cuid.nullable().default(null),
  messAttendance: z.boolean().default(false),
});
export type HostelSave = z.infer<typeof hostelSaveSchema>;

export const hostelRoomSaveSchema = z.object({
  id: cuid.optional(),
  hostelId: cuid,
  number: z.string().trim().min(1).max(20),
  floor: z.string().trim().max(20).default(""),
  beds: z.number().int().min(1).max(100),
  kind: hostelRoomKindSchema.default("SHARED"),
});
export type HostelRoomSave = z.infer<typeof hostelRoomSaveSchema>;

export const hostelBoarderSchema = z.object({
  allotmentId: z.string(),
  membershipId: z.string(),
  name: z.string(),
  className: z.string().nullable(),
  hostelId: z.string(),
  hostelName: z.string(),
  roomId: z.string(),
  roomNumber: z.string(),
  bed: z.number().int(),
  fromDate: dateKey,
  toDate: dateKey.nullable(),
  /** Out of the hostel on approved leave right now. */
  onLeave: z.boolean(),
  feeDemandId: z.string().nullable(),
});
export type HostelBoarder = z.infer<typeof hostelBoarderSchema>;

export const hostelRoomRowSchema = z.object({
  id: z.string(),
  number: z.string(),
  floor: z.string(),
  beds: z.number().int(),
  kind: hostelRoomKindSchema,
  occupied: z.number().int(),
  boarders: z.array(hostelBoarderSchema),
});

export const hostelRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: hostelKindSchema,
  capacity: z.number().int(),
  wardenMembershipId: z.string().nullable(),
  wardenName: z.string().nullable(),
  messAttendance: z.boolean(),
  beds: z.number().int(),
  occupied: z.number().int(),
  rooms: z.array(hostelRoomRowSchema),
});
export type HostelRow = z.infer<typeof hostelRowSchema>;

export const hostelsSchema = z.object({
  hostels: z.array(hostelRowSchema),
  /** The school's wardens, to put in charge of a house. */
  wardens: z.array(z.object({ membershipId: z.string(), name: z.string() })),
  /** The office makes houses; the office and the warden make rooms and allot beds. */
  canManage: z.boolean(),
  canAllot: z.boolean(),
});
export type HostelsView = z.infer<typeof hostelsSchema>;

export const hostelBoardersQuerySchema = z.object({ hostelId: cuid.optional() });
export const hostelBoardersSchema = z.object({ items: z.array(hostelBoarderSchema) });

export const hostelAllotSchema = z.object({
  membershipId: cuid,
  roomId: cuid,
  bed: z.number().int().min(1).max(100),
  fromDate: dateKey,
  /** The hostel fee's demand on the pupil's ledger, made under the fees module; only linked here. */
  feeDemandId: cuid.nullable().default(null),
});
export type HostelAllot = z.infer<typeof hostelAllotSchema>;
export const hostelAllotmentEndSchema = z.object({ toDate: dateKey });

/* ---- roll call ----------------------------------------------------------- */

export const hostelRollCallQuerySchema = z.object({ hostelId: cuid, date: dateKey.optional(), slot: hostelRollSlotSchema.default("NIGHT") });
export const hostelRollCallSheetSchema = z.object({
  hostelId: z.string(),
  hostelName: z.string(),
  dateKey,
  slot: hostelRollSlotSchema,
  taken: z.object({ at: iso, byName: z.string() }).nullable(),
  entries: z.array(
    z.object({
      allotmentId: z.string(),
      membershipId: z.string(),
      name: z.string(),
      roomNumber: z.string(),
      bed: z.number().int(),
      /** As recorded, or — before the call is taken — ON_LEAVE for a boarder out on approved leave and PRESENT otherwise. */
      status: hostelRollStatusSchema,
      onLeave: z.boolean(),
    }),
  ),
});
export type HostelRollCallSheet = z.infer<typeof hostelRollCallSheetSchema>;

/**
 * One roll call, once per hostel, day and slot. `clientId` is minted on the
 * phone, so the outbox replaying the same sheet answers with the call it
 * already made; a different sheet for a slot already taken is refused.
 */
export const hostelRollCallTakeSchema = z.object({
  hostelId: cuid,
  dateKey,
  slot: hostelRollSlotSchema,
  clientId: z.string().min(8).max(80),
  entries: z.array(z.object({ allotmentId: cuid, status: hostelRollStatusSchema })).min(1).max(2000),
});
export type HostelRollCallTake = z.infer<typeof hostelRollCallTakeSchema>;
export const hostelRollCallResultSchema = z.object({ rollCallId: z.string(), present: z.number().int(), onLeave: z.number().int(), absent: z.number().int(), replay: z.boolean() });

/* ---- leave and the gate ---------------------------------------------------- */

export const hostelLeaveRowSchema = z.object({
  id: z.string(),
  allotmentId: z.string(),
  membershipId: z.string(),
  name: z.string(),
  className: z.string().nullable(),
  hostelName: z.string(),
  roomNumber: z.string(),
  kind: hostelLeaveKindSchema,
  fromAt: iso,
  toAt: iso,
  destination: z.string(),
  reason: z.string(),
  status: hostelLeaveStatusSchema,
  requestedByName: z.string(),
  consentAt: iso.nullable(),
  consentByName: z.string().nullable(),
  decidedAt: iso.nullable(),
  decidedByName: z.string().nullable(),
  decisionNote: z.string().nullable(),
  outAt: iso.nullable(),
  inAt: iso.nullable(),
  late: z.boolean(),
  /** A minor's leave needs a guardian's consent before the warden decides. */
  isMinor: z.boolean(),
});
export type HostelLeaveRow = z.infer<typeof hostelLeaveRowSchema>;

export const hostelLeaveListQuerySchema = z.object({ status: z.enum(["OPEN", "TODAY", "ALL"]).default("OPEN") });
export const hostelLeaveListSchema = z.object({ items: z.array(hostelLeaveRowSchema) });
export const hostelLeaveDecideSchema = z.object({ approve: z.boolean(), note: z.string().trim().max(300).default("") });

/* ---- the visitor book ---------------------------------------------------- */

export const hostelVisitorRowSchema = z.object({
  id: z.string(),
  allotmentId: z.string(),
  boarderName: z.string(),
  hostelName: z.string(),
  roomNumber: z.string(),
  name: z.string(),
  relation: z.string(),
  note: z.string(),
  inAt: iso,
  outAt: iso.nullable(),
  allowedByName: z.string(),
});
export const hostelVisitorsQuerySchema = z.object({ date: dateKey.optional() });
export const hostelVisitorsSchema = z.object({ dateKey, items: z.array(hostelVisitorRowSchema) });
export const hostelVisitorCreateSchema = z.object({
  allotmentId: cuid,
  name: z.string().trim().min(1).max(80),
  relation: z.string().trim().min(1).max(40),
  note: z.string().trim().max(200).default(""),
});

/* ---- the mess -------------------------------------------------------------- */

export const messMenuEntrySchema = z.object({ weekday: z.number().int().min(1).max(7), meal: messMealSchema, items: z.string().trim().max(300) });
export const messMenuQuerySchema = z.object({ hostelId: cuid.optional(), childId: cuid.optional() });
export const messMenuSchema = z.object({
  hostels: z.array(z.object({ hostelId: z.string(), hostelName: z.string(), messAttendance: z.boolean(), entries: z.array(messMenuEntrySchema) })),
  canEdit: z.boolean(),
});
export type MessMenuView = z.infer<typeof messMenuSchema>;
export const messMenuSaveSchema = z.object({ hostelId: cuid, entries: z.array(messMenuEntrySchema).max(28) });
export const messAttendanceSaveSchema = z.object({
  hostelId: cuid,
  dateKey,
  meal: messMealSchema,
  entries: z.array(z.object({ allotmentId: cuid, present: z.boolean() })).min(1).max(2000),
});
export const messAttendanceResultSchema = z.object({ saved: z.number().int() });

/* ---- incidents and health ------------------------------------------------ */

export const hostelIncidentCreateSchema = z.object({
  allotmentId: cuid,
  kind: incidentKindSchema,
  severity: incidentSeveritySchema.default("MINOR"),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  actionTaken: z.string().trim().max(2000).default(""),
  notifyGuardians: z.boolean().default(true),
});
export type HostelIncidentCreate = z.infer<typeof hostelIncidentCreateSchema>;
export const hostelIncidentRowSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  hostelName: z.string(),
  kind: incidentKindSchema,
  severity: incidentSeveritySchema,
  occurredAt: iso,
  title: z.string(),
  status: z.enum(["OPEN", "CLOSED"]),
  reportedByName: z.string(),
  guardiansNotifiedAt: iso.nullable(),
});
export const hostelIncidentsSchema = z.object({ items: z.array(hostelIncidentRowSchema) });

/** What the warden needs from a boarder's health card at night; reading it is a row the family sees. */
export const hostelBoarderHealthSchema = z.object({
  allotmentId: z.string(),
  name: z.string(),
  hasCard: z.boolean(),
  bloodGroup: bloodGroupSchema.nullable(),
  allergies: z.string(),
  conditions: z.string(),
  medications: z.string(),
  dietary: z.string(),
  doctorName: z.string(),
  doctorPhone: z.string(),
  contacts: z.array(healthContactSchema),
});
export type HostelBoarderHealth = z.infer<typeof hostelBoarderHealthSchema>;

/* ---- the office's overview ------------------------------------------------- */

export const hostelOverviewSchema = z.object({
  dateKey,
  hostels: z.array(z.object({ id: z.string(), name: z.string(), beds: z.number().int(), occupied: z.number().int() })),
  /** Leave that covers today (approved), and who is out now. */
  leaveToday: z.array(hostelLeaveRowSchema),
  outNow: z.number().int(),
  /** Waiting for a guardian or the warden. */
  pendingLeave: z.number().int(),
  /** Came back late in the last seven days. */
  lateReturns: z.array(hostelLeaveRowSchema),
  /** Marked ABSENT at the latest roll call of each hostel. */
  absentees: z.array(z.object({ hostelName: z.string(), dateKey, slot: hostelRollSlotSchema, name: z.string(), roomNumber: z.string() })),
  visitorsToday: z.number().int(),
});
export type HostelOverview = z.infer<typeof hostelOverviewSchema>;

/* ---- the family ------------------------------------------------------------ */

export const familyHostelQuerySchema = z.object({ childId: cuid.optional() });
export const familyHostelSchema = z.object({
  child: z.object({ membershipId: z.string(), name: z.string() }),
  allotment: z
    .object({ hostelName: z.string(), hostelKind: hostelKindSchema, roomNumber: z.string(), floor: z.string(), bed: z.number().int(), fromDate: dateKey, wardenName: z.string().nullable() })
    .nullable(),
  /** The latest roll call today: NOT_TAKEN before the warden has called it. */
  tonight: z.object({ dateKey, slot: hostelRollSlotSchema, status: z.enum(["PRESENT", "ON_LEAVE", "ABSENT", "NOT_TAKEN"]) }),
  leave: z.array(hostelLeaveRowSchema),
  menuToday: z.array(z.object({ meal: messMealSchema, items: z.string() })),
  canRequestLeave: z.boolean(),
  /** The reader is a guardian, who consents to the pupil's own asks. */
  canConsent: z.boolean(),
});
export type FamilyHostel = z.infer<typeof familyHostelSchema>;

export const familyHostelLeaveCreateSchema = z
  .object({
    childId: cuid.optional(),
    kind: hostelLeaveKindSchema,
    fromAt: iso,
    toAt: iso,
    destination: z.string().trim().min(1).max(120),
    reason: z.string().trim().max(300).default(""),
  })
  .refine((v) => new Date(v.toAt).getTime() > new Date(v.fromAt).getTime(), { message: "order", path: ["toAt"] });
export type FamilyHostelLeaveCreate = z.infer<typeof familyHostelLeaveCreateSchema>;
export const familyHostelConsentSchema = z.object({ approve: z.boolean() });
