import { z } from "zod";

/**
 * Admissions: the office opens a cycle for a year, a family applies for a
 * child, attaches documents, books an entrance-test sitting, receives and
 * answers an offer, and the office admits the child onto the roll and the
 * fee structure. The applicant is a signed-in guardian account, or nobody
 * when the office enters a walk-in family.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const count = z.number().int().min(0);

/** EXPIRED: an offer the family never answered by its date — set by the hourly `admissions:expire-offers` job, and read as such before the job reaches it. */
export const admissionStatusSchema = z.enum(["SUBMITTED", "OFFERED", "ACCEPTED", "ADMITTED", "DECLINED", "WAITLISTED", "WITHDRAWN", "EXPIRED"]);
export type AdmissionStatus = z.infer<typeof admissionStatusSchema>;
export const cycleStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED"]);

export const cycleGradeSchema = z.object({ grade: z.string().trim().min(1).max(20), seats: count.max(999) });
export const cycleDocumentSchema = z.object({ key: z.string().trim().regex(/^[a-z][a-z0-9_-]{0,30}$/, "key"), name: z.string().trim().min(1).max(60), required: z.boolean() });

/** POST /api/v1/office/admissions/cycles (create) and /{cycleId} (update). */
export const cycleSaveSchema = z.object({
  academicYearId: cuid,
  name: z.string().trim().min(1).max(80),
  grades: z.array(cycleGradeSchema).min(1).max(30),
  documents: z.array(cycleDocumentSchema).max(12),
  testRequired: z.boolean(),
  notice: z.string().trim().max(2000),
  feeStructureId: cuid.nullable(),
  opensAt: dateKey.nullable(),
  closesAt: dateKey.nullable(),
});
export type CycleSave = z.infer<typeof cycleSaveSchema>;

export const cycleSchema = cycleSaveSchema.extend({
  id: z.string(),
  status: cycleStatusSchema,
  academicYearName: z.string(),
  feeStructureName: z.string().nullable(),
  /** Per grade: seats, and how many applications stand at each stage. */
  seats: z.array(z.object({ grade: z.string(), seats: count, applied: count, offered: count, accepted: count, admitted: count, waitlisted: count })),
  counts: z.record(admissionStatusSchema, count),
  updatedAt: iso,
});
export type CycleView = z.infer<typeof cycleSchema>;

/** GET /api/v1/office/admissions/cycles — every cycle, newest first, with the years and structures the editor offers. */
export const cyclesViewSchema = z.object({
  cycles: z.array(cycleSchema),
  years: z.array(z.object({ id: z.string(), name: z.string(), isCurrent: z.boolean() })),
  structures: z.array(z.object({ id: z.string(), name: z.string(), academicYearId: z.string(), gradeLevel: z.string().nullable() })),
});

export const cycleStatusSaveSchema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

/* -------------------------------------------------------------------------- */
/* Applying                                                                     */
/* -------------------------------------------------------------------------- */

const text = z.string().trim().max(120);

/** The form: POST /api/v1/family/applications (a guardian, for a child) and /api/v1/office/admissions/applications (the office, for a walk-in). */
export const applicationSaveSchema = z.object({
  cycleId: cuid,
  childName: z.string().trim().min(1).max(120),
  childBirthdate: dateKey.nullable(),
  gradeApplied: z.string().trim().min(1).max(20),
  previousSchool: z.string().trim().max(160).optional(),
  /** The child's UDISE+ PEN, eleven digits, when the family has it: admission then recognises a pupil known on Shalaghar. */
  penNumber: z.string().trim().regex(/^(\d{11})?$/, "pen").optional(),
  addressLine: z.string().trim().max(200).optional(),
  city: text.optional(),
  note: z.string().trim().max(2000).optional(),
  /** The office's walk-in: who the family is; a guardian's own application takes these from their account. */
  applicantName: text.optional(),
  applicantPhone: z.string().trim().max(40).optional(),
  applicantEmail: z.string().trim().email().max(200).optional(),
  relation: z.enum(["PARENT", "GUARDIAN", "OTHER"]).optional(),
});
export type ApplicationSave = z.infer<typeof applicationSaveSchema>;
/** POST /api/v1/family/applications — the same form, naming the school. */
export const applyBodySchema = applicationSaveSchema.extend({ schoolId: cuid });

export const applicationDocumentSchema = z.object({ key: z.string(), fileId: z.string(), name: z.string(), mime: z.string(), size: count, uploadedAt: iso });

export const entranceSlotSchema = z.object({
  id: z.string(),
  startsAt: iso,
  endsAt: iso,
  location: z.string().nullable(),
  note: z.string().nullable(),
  capacity: count,
  booked: count,
  cancelledAt: iso.nullable(),
});

export const applicationSchema = z.object({
  id: z.string(),
  serial: z.string(),
  status: admissionStatusSchema,
  cycle: z.object({ id: z.string(), name: z.string(), academicYearName: z.string(), testRequired: z.boolean(), documents: z.array(cycleDocumentSchema), status: cycleStatusSchema }),
  school: z.object({ id: z.string(), name: z.string() }),
  applicantUserId: z.string().nullable(),
  applicantName: z.string(),
  applicantPhone: z.string().nullable(),
  applicantEmail: z.string().nullable(),
  relation: z.string(),
  childName: z.string(),
  childBirthdate: dateKey.nullable(),
  gradeApplied: z.string(),
  previousSchool: z.string().nullable(),
  penNumber: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  note: z.string().nullable(),
  documents: z.array(applicationDocumentSchema),
  /** The required document keys still missing. */
  documentsMissing: z.array(z.string()),
  documentsVerifiedAt: iso.nullable(),
  testSlot: entranceSlotSchema.nullable(),
  testScore: z.string().nullable(),
  testNote: z.string().nullable(),
  testedAt: iso.nullable(),
  offeredAt: iso.nullable(),
  offerExpiresAt: iso.nullable(),
  /**
   * The answer-by DAY in the school's own zone (R-62, 5 October 2026): what to
   * print. `offerExpiresAt` is the instant (the school's end of that day), and
   * its first ten characters are a day late west of UTC. Defaults to null so
   * an older payload parses.
   */
  offerExpiresOn: dateKey.nullable().default(null),
  offerNote: z.string().nullable(),
  respondedAt: iso.nullable(),
  decisionNote: z.string().nullable(),
  decidedAt: iso.nullable(),
  admittedMembershipId: z.string().nullable(),
  admittedAt: iso.nullable(),
  feeStructureName: z.string().nullable(),
  createdAt: iso,
  /** What this reader may do next. */
  can: z.object({
    uploadDocuments: z.boolean(),
    bookTest: z.boolean(),
    respond: z.boolean(),
    withdraw: z.boolean(),
    verifyDocuments: z.boolean(),
    recordTest: z.boolean(),
    offer: z.boolean(),
    decide: z.boolean(),
    admit: z.boolean(),
  }),
  /** Open sittings the family may still book, when a test is required and none is booked. */
  openSlots: z.array(entranceSlotSchema),
});
export type ApplicationView = z.infer<typeof applicationSchema>;

export const applicationRowSchema = z.object({
  id: z.string(),
  serial: z.string(),
  status: admissionStatusSchema,
  childName: z.string(),
  gradeApplied: z.string(),
  applicantName: z.string(),
  cycleName: z.string(),
  schoolName: z.string(),
  documentsMissing: count,
  testBooked: z.boolean(),
  createdAt: iso,
  updatedAt: iso,
});
export const applicationsListSchema = z.object({ items: z.array(applicationRowSchema) });
export const officeApplicationsQuerySchema = z.object({ cycleId: cuid.optional(), status: admissionStatusSchema.optional(), grade: z.string().trim().max(20).optional() });

/** POST /api/v1/family/applications/{id}/documents — phone tickets or web-stored files, keyed to the cycle's document list. */
export const applicationDocumentsSaveSchema = z.object({
  documents: z.array(z.object({ key: z.string().trim().min(1).max(32), fileId: z.string().min(1).max(64), name: z.string().trim().min(1).max(120) })).min(1).max(12),
});

export const applicationBookSchema = z.object({ slotId: cuid });
export const applicationRespondSchema = z.object({ answer: z.enum(["ACCEPT", "DECLINE"]), note: z.string().trim().max(400).optional() });

/* -------------------------------------------------------------------------- */
/* The office's decisions                                                       */
/* -------------------------------------------------------------------------- */

export const entranceSlotsPublishSchema = z.object({
  startsAt: iso,
  durationMinutes: z.number().int().min(10).max(240),
  count: z.number().int().min(1).max(20),
  capacity: z.number().int().min(1).max(200),
  location: z.string().trim().max(120).optional(),
  note: z.string().trim().max(400).optional(),
});
export const entranceSlotsPublishedSchema = z.object({ created: count });
export const slotCancelledSchema = z.object({ ok: z.literal(true), released: count });
export const cyclePurgedSchema = z.object({ ok: z.literal(true), removed: count });
export const entranceSlotsListSchema = z.object({ slots: z.array(entranceSlotSchema) });

export const testResultSchema = z.object({ score: z.string().trim().max(40).nullable(), note: z.string().trim().max(400).optional() });
export const offerSchema = z.object({ expiresOn: dateKey.nullable(), note: z.string().trim().max(400).optional(), feeStructureId: cuid.nullable().optional() });
export const decisionSchema = z.object({ status: z.enum(["DECLINED", "WAITLISTED", "SUBMITTED"]), note: z.string().trim().max(400).optional() });
export const admitSchema = z.object({ classId: cuid.nullable().optional(), feeStructureId: cuid.nullable().optional(), admissionNumber: z.string().trim().max(40).optional() });
export const admittedSchema = z.object({ studentMembershipId: z.string(), studentCode: z.string(), className: z.string().nullable(), feePlan: z.boolean(), guardianLinked: z.boolean(), firstSignInCode: z.string().nullable(), /** Set when the applicant had an account but was not linked: the seat went to an existing pupil. */ noteKey: z.string().optional() });

/** GET /api/v1/shared/schools/{schoolId}/admissions — what a family sees on the school's page: the open cycle, its grades, documents and notice. */
export const schoolAdmissionsSchema = z.object({
  open: z
    .object({
      cycleId: z.string(),
      name: z.string(),
      academicYearName: z.string(),
      grades: z.array(z.object({ grade: z.string(), seats: count, remaining: count })),
      documents: z.array(cycleDocumentSchema),
      testRequired: z.boolean(),
      notice: z.string(),
      closesAt: dateKey.nullable(),
    })
    .nullable(),
  mine: z.array(applicationRowSchema),
});
