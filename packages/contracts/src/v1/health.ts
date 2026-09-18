import { z } from "zod";

/**
 * The pupil's health and emergency card. Read by the child's teachers, the
 * office and the guardians; written by the office and the guardians. Every
 * field is optional and short: this is the laminated card in the school bag,
 * not a medical record.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const line = z.string().trim().max(500);

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const bloodGroupSchema = z.enum(BLOOD_GROUPS);

export const healthContactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  relation: z.string().trim().max(40).default(""),
  phone: z.string().trim().min(6).max(20),
});
export type HealthContact = z.infer<typeof healthContactSchema>;

/** What the office or a guardian saves. Omitted fields are cleared, not kept: the form is the card. */
export const healthCardSaveSchema = z.object({
  bloodGroup: bloodGroupSchema.nullable().default(null),
  allergies: line.default(""),
  conditions: line.default(""),
  medications: line.default(""),
  dietary: line.default(""),
  notes: line.default(""),
  doctorName: z.string().trim().max(80).default(""),
  doctorPhone: z.string().trim().max(20).default(""),
  contacts: z.array(healthContactSchema).max(3).default([]),
});
export type HealthCardSave = z.infer<typeof healthCardSaveSchema>;

export const healthCheckSchema = z.object({
  id: z.string(),
  dateKey,
  heightCm: z.number().int().nullable(),
  weightGrams: z.number().int().nullable(),
  visionLeft: z.string().nullable(),
  visionRight: z.string().nullable(),
  notes: z.string(),
});

/** A check-up the office records: at least one measurement. */
export const healthCheckSaveSchema = z
  .object({
    dateKey,
    heightCm: z.number().int().min(30).max(250).nullable().default(null),
    weightGrams: z.number().int().min(1000).max(300_000).nullable().default(null),
    visionLeft: z.string().trim().max(20).default(""),
    visionRight: z.string().trim().max(20).default(""),
    notes: line.default(""),
  })
  .refine((v) => v.heightCm !== null || v.weightGrams !== null || v.visionLeft || v.visionRight || v.notes, { message: "empty", path: ["notes"] });

export const healthCardSchema = z.object({
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  /** Null until somebody has written the card. */
  card: z
    .object({
      bloodGroup: bloodGroupSchema.nullable(),
      allergies: z.string(),
      conditions: z.string(),
      medications: z.string(),
      dietary: z.string(),
      notes: z.string(),
      doctorName: z.string(),
      doctorPhone: z.string(),
      contacts: z.array(healthContactSchema),
      updatedAt: iso,
      updatedByName: z.string().nullable(),
    })
    .nullable(),
  checks: z.array(healthCheckSchema),
  /** Whether this viewer may write the card (the office, a guardian) and record a check-up (the office). */
  canEdit: z.boolean(),
  canRecordCheck: z.boolean(),
});
export type HealthCardView = z.infer<typeof healthCardSchema>;

/** GET /api/v1/family/health?childId= — the guardian's view, with the switcher's children. */
export const familyHealthQuerySchema = z.object({ childId: cuid.optional() });
export const familyHealthSaveSchema = healthCardSaveSchema.extend({ childId: cuid.optional() });
