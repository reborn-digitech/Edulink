import { z } from "zod";

/**
 * Filings: the returns a school files with the UDISE+ portal and its board,
 * built from what the app already holds. The school's filing identity (its
 * UDISE code, board and affiliation, district, block, medium, management
 * type), a readiness view naming what is still blank, and the five exports
 * as CSV text the way the other compliance exports travel.
 */
const count = z.number().int().min(0);

export const SCHOOL_BOARDS = ["CBSE", "CISCE", "MSBSHSE", "OTHER_STATE", "NIOS", "IB", "OTHER"] as const;
export const schoolBoardSchema = z.enum(SCHOOL_BOARDS);
/** The UDISE+ school-management codes a private or aided school picks from. */
export const MANAGEMENT_TYPES = ["GOVT", "GOVT_AIDED", "PRIVATE_UNAIDED", "CENTRAL_GOVT", "LOCAL_BODY", "OTHER"] as const;
export const managementTypeSchema = z.enum(MANAGEMENT_TYPES);

/** POST /api/v1/office/filings/identity — a blank clears the field. */
export const filingIdentitySaveSchema = z.object({
  udiseCode: z.string().trim().regex(/^(\d{11})?$/, "udise").optional(),
  board: z.union([schoolBoardSchema, z.literal("")]).optional(),
  affiliationNumber: z.string().trim().max(40).optional(),
  district: z.string().trim().max(80).optional(),
  block: z.string().trim().max(80).optional(),
  medium: z.string().trim().max(40).optional(),
  managementType: z.union([managementTypeSchema, z.literal("")]).optional(),
});
export type FilingIdentitySave = z.infer<typeof filingIdentitySaveSchema>;

export const filingIdentitySchema = z.object({
  udiseCode: z.string().nullable(),
  board: z.string().nullable(),
  affiliationNumber: z.string().nullable(),
  district: z.string().nullable(),
  block: z.string().nullable(),
  medium: z.string().nullable(),
  managementType: z.string().nullable(),
  /** From the school's own details: named here because the portals ask for them beside the code. */
  state: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
});

export const FILING_KINDS = ["udise-students", "udise-enrolment", "udise-teachers", "cbse-candidates", "msbshse-candidates"] as const;
export const filingKindSchema = z.enum(FILING_KINDS);
export type FilingKind = z.infer<typeof filingKindSchema>;

/** GET /api/v1/office/filings — the identity, what is blank, and the grades a board sheet can be cut for. */
export const filingsViewSchema = z.object({
  identity: filingIdentitySchema,
  /** The identity fields still blank. */
  identityMissing: z.array(z.string()),
  pupils: z.object({
    total: count,
    /** Pupils with every UDISE+ field filled. */
    ready: count,
    /** Field → how many pupils still lack it. */
    missing: z.record(z.string(), count),
    /** Pupils with no name in the school's script, for a state board that files in it. */
    withoutLocalName: count,
  }),
  staff: z.object({
    total: count,
    ready: count,
    missing: z.record(z.string(), count),
  }),
  grades: z.array(z.object({ gradeLevel: z.string(), pupils: count })),
  academicYearName: z.string().nullable(),
});
export type FilingsView = z.infer<typeof filingsViewSchema>;

/** ?grade= for the two board sheets: the grade is required. */
export const filingExportQuerySchema = z.object({ grade: z.string().trim().min(1).max(20) });
