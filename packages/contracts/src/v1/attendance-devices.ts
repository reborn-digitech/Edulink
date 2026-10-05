import { z } from "zod";

/**
 * ATTENDANCE DEVICES (the risks batch, R-2, 5 October 2026): a biometric or
 * RFID reader posts its punches to a signed endpoint, format-agnostic — the
 * body below is the platform's own; a vendor's export is turned into it by an
 * adapter (scripts/punch-adapter.ts, untested against any vendor's device).
 *
 * THE SIGNATURE. Each device has its own key, shown once when the office
 * registers the device or rotates the key. A request carries
 *   PUNCH_HEADERS.device     the device's id
 *   PUNCH_HEADERS.timestamp  seconds since 1970, within PUNCH_SKEW_SECONDS of the server's clock
 *   PUNCH_HEADERS.signature  "sha256=" + hex(HMAC-SHA256(key, timestamp + "." + body))
 * over the exact bytes of the body. A punch is kept once per device and the
 * device's own punch id, so a device that resends a batch changes nothing.
 *
 * A badge code is what the device sends for a person — a card's number or a
 * reader's enrolment number — never a fingerprint template and never an
 * Aadhaar number (decision 0002).
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const text = (max: number) => z.string().trim().max(max);

export const DEVICE_KINDS = ["BIOMETRIC", "RFID", "FACE", "OTHER"] as const;
export const deviceKindSchema = z.enum(DEVICE_KINDS);
export type DeviceKind = z.infer<typeof deviceKindSchema>;
export const DEVICE_SCOPES = ["STAFF", "STUDENTS", "BOTH"] as const;
export const deviceScopeSchema = z.enum(DEVICE_SCOPES);
export type DeviceScope = z.infer<typeof deviceScopeSchema>;
/** LOGGED: an OUT punch, kept and nothing more (a register and a check-in record arriving, not leaving). */
export const PUNCH_OUTCOMES = ["APPLIED", "ALREADY_MARKED", "LOGGED", "UNKNOWN_BADGE", "NO_REGISTER", "CLOSED_DAY", "OUT_OF_SCOPE", "NOT_RECENT"] as const;
export const punchOutcomeSchema = z.enum(PUNCH_OUTCOMES);
export type PunchOutcome = z.infer<typeof punchOutcomeSchema>;

export const PUNCH_HEADERS = { device: "x-shalaghar-device", timestamp: "x-shalaghar-timestamp", signature: "x-shalaghar-signature" } as const;
/** How far a request's timestamp may be from the server's clock. */
export const PUNCH_SKEW_SECONDS = 300;
/** How many days back a punch may still mark a register or a check-in (a reader that was offline). */
export const PUNCH_RECENT_DAYS = 7;
export const PUNCH_BATCH_MAX = 500;
/** The badge code's shape: letters, digits and - _ . : up to 64. */
export const BADGE_CODE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export const deviceSaveSchema = z.object({
  name: text(80).min(2),
  kind: deviceKindSchema,
  location: text(120).default(""),
  scope: deviceScopeSchema.default("BOTH"),
});
export type DeviceSave = z.infer<typeof deviceSaveSchema>;
export const deviceUpdateSchema = z.object({
  name: text(80).min(2).optional(),
  kind: deviceKindSchema.optional(),
  location: text(120).optional(),
  scope: deviceScopeSchema.optional(),
  disabled: z.boolean().optional(),
});
export type DeviceUpdate = z.infer<typeof deviceUpdateSchema>;

export const deviceViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: deviceKindSchema,
  location: z.string(),
  scope: deviceScopeSchema,
  keyLast4: z.string(),
  keyVersion: z.number().int(),
  keyRotatedAt: iso,
  disabled: z.boolean(),
  lastPunchAt: iso.nullable(),
  punchesToday: z.number().int(),
});
export type DeviceView = z.infer<typeof deviceViewSchema>;

/** A new device or a rotated key: the key is in this answer and in no other. */
export const deviceKeyIssuedSchema = z.object({
  device: deviceViewSchema,
  key: z.string(),
  endpoint: z.string(),
  headers: z.object({ device: z.string(), timestamp: z.string(), signature: z.string() }),
});
export type DeviceKeyIssued = z.infer<typeof deviceKeyIssuedSchema>;

/** Rotating is an act: the body says so, so an empty request changes nothing. */
export const deviceRotateSchema = z.object({ confirm: z.literal(true) });

export const badgeSaveSchema = z.object({ code: z.string().trim().regex(BADGE_CODE, "code"), membershipId: cuid });
export type BadgeSave = z.infer<typeof badgeSaveSchema>;
export const badgeSavedSchema = z.object({ id: z.string() });
export const badgeViewSchema = z.object({ id: z.string(), code: z.string(), membershipId: z.string(), name: z.string(), role: z.string() });
export type BadgeView = z.infer<typeof badgeViewSchema>;

export const punchViewSchema = z.object({
  id: z.string(),
  deviceName: z.string(),
  code: z.string(),
  name: z.string().nullable(),
  punchedAt: iso,
  dateKey: z.string(),
  direction: z.enum(["IN", "OUT"]).nullable(),
  outcome: punchOutcomeSchema,
});
export type PunchView = z.infer<typeof punchViewSchema>;

export const devicesViewSchema = z.object({
  devices: z.array(deviceViewSchema),
  badges: z.array(badgeViewSchema),
  recent: z.array(punchViewSchema),
  /** The people a badge may name: the school's active staff and students. */
  people: z.array(z.object({ membershipId: z.string(), name: z.string(), role: z.string() })),
  /** FEES_SECRET_KEY is set: a key can be sealed, so a device can be registered. */
  sealingAvailable: z.boolean(),
  canEdit: z.boolean(),
});
export type DevicesView = z.infer<typeof devicesViewSchema>;

/** The body a device posts: one punch or a batch, each with the device's own id for it. */
export const punchBatchSchema = z.object({
  punches: z
    .array(
      z.object({
        id: z.string().trim().regex(/^[A-Za-z0-9._:-]{1,64}$/, "id"),
        code: z.string().trim().regex(BADGE_CODE, "code"),
        /** The moment of the punch, with its offset ("2026-10-05T09:02:11+05:30") or in UTC. */
        at: z.string().datetime({ offset: true }),
        direction: z.enum(["IN", "OUT"]).optional(),
      }),
    )
    .min(1)
    .max(PUNCH_BATCH_MAX),
});
export type PunchBatch = z.infer<typeof punchBatchSchema>;

export const punchResultSchema = z.object({
  received: z.number().int(),
  applied: z.number().int(),
  /** Punches this device had sent before: answered with what became of them then. */
  replayed: z.number().int(),
  results: z.array(z.object({ id: z.string(), outcome: punchOutcomeSchema, replayed: z.boolean() })),
});
export type PunchResult = z.infer<typeof punchResultSchema>;
