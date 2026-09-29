import { z } from "zod";

/**
 * Certificates the office designs and issues — transfer certificate, Nirgam
 * Utara, bonafide, character, study, or the school's own — in English, Hindi
 * or Marathi, filled from the pupil record the family keeps.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const count = z.number().int().min(0);

export const certificateKindSchema = z.enum(["TC", "NIRGAM", "BONAFIDE", "CHARACTER", "STUDY", "CUSTOM"]);
export type CertificateKind = z.infer<typeof certificateKindSchema>;
export const documentLocaleSchema = z.enum(["en", "hi", "mr"]);

/** One numbered row of the document: a label and a value written with [[placeholders]]. */
export const certificateRowSchema = z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().max(200) });
export type CertificateRow = z.infer<typeof certificateRowSchema>;

export const certificateLayoutSchema = z.object({
  showLogo: z.boolean(),
  showAddress: z.boolean(),
  useBrandColour: z.boolean(),
  signatureLeft: z.string().trim().max(40),
  signatureRight: z.string().trim().max(40),
  footerNote: z.string().trim().max(240).nullable(),
  paper: z.enum(["A4", "LETTER"]),
});
export type CertificateLayout = z.infer<typeof certificateLayoutSchema>;

/** POST /api/v1/office/certificate-templates (create) and /{templateId} (replace). */
export const certificateTemplateSaveSchema = z.object({
  kind: certificateKindSchema,
  name: z.string().trim().min(1).max(80),
  locale: documentLocaleSchema,
  title: z.string().trim().min(1).max(120),
  intro: z.string().trim().max(2000),
  rows: z.array(certificateRowSchema).max(40),
  outro: z.string().trim().max(2000),
  layout: certificateLayoutSchema,
  /** "TC", "NU", "BC": letters, digits and dashes; the serial is prefix/year/number. */
  serialPrefix: z.string().trim().regex(/^[A-Za-z0-9-]{1,12}$/, "prefix"),
  active: z.boolean().default(true),
});
export type CertificateTemplateSave = z.infer<typeof certificateTemplateSaveSchema>;

export const certificateTemplateSchema = certificateTemplateSaveSchema.extend({
  id: z.string(),
  issuedCount: count,
  updatedAt: iso,
});

/** A placeholder the editor offers: its key, a label for the picker and what it would print for the sample pupil. */
export const certificatePlaceholderSchema = z.object({ key: z.string(), label: z.string(), sample: z.string() });

/** GET /api/v1/office/certificate-templates — the school's templates, the presets to copy from, the placeholders. */
export const certificateTemplatesViewSchema = z.object({
  templates: z.array(certificateTemplateSchema),
  presets: z.array(certificateTemplateSaveSchema.omit({ active: true }).extend({ key: z.string() })),
  placeholders: z.array(certificatePlaceholderSchema),
});
export type CertificateTemplatesView = z.infer<typeof certificateTemplatesViewSchema>;

/* -------------------------------------------------------------------------- */
/* The pupil record                                                             */
/* -------------------------------------------------------------------------- */

const text = z.string().trim().max(120);
export const pupilRecordFieldSchema = z.enum([
  "fatherName", "motherName", "placeOfBirth", "nationality", "religion", "caste", "category", "motherTongue",
  "addressLine", "city", "postalCode", "admissionNumber", "admissionDate", "admittedToGrade", "previousSchool", "penNumber",
  // The filing fields: what UDISE+ and the boards ask beyond a certificate.
  "gender", "nameLocal", "fatherNameLocal", "motherNameLocal", "bpl", "ews", "cwsnType", "bloodGroup",
  // The collection gaps the data-flow audit named: the previous school's TC, the household, the roll number.
  "previousSchoolTcNumber", "previousSchoolTcDate", "fatherOccupation", "motherOccupation", "annualIncome", "rollNumber",
  // The number the school rings: the record's, not the account's sign-in phone.
  "guardianPhone",
  // What the UDISE+ sheet used to guess: admitted under the RTE quota, and repeating the class (kept on the enrolment).
  "rte", "repeating",
]);
/**
 * The fields a family — a guardian, or the pupil themselves — may write on
 * /api/v1/family/record. Everything else on the record is the office's:
 * the admission number, date and grade, the previous school's TC, the
 * category, caste, gender and the BPL/EWS/impairment answers feed the
 * leaving certificate and the filings, so a family's save leaves them as
 * they stand (as it already left the roll number and the PEN) and the family
 * forms show them read-only. The office forms keep every field.
 */
export const FAMILY_RECORD_FIELDS = [
  "fatherName", "motherName", "placeOfBirth", "nationality", "religion", "motherTongue", "addressLine", "city", "postalCode",
  "nameLocal", "fatherNameLocal", "motherNameLocal", "bloodGroup", "fatherOccupation", "motherOccupation", "annualIncome", "previousSchool",
  "guardianPhone",
] as const satisfies readonly PupilRecordField[];
/** Social category as a coded choice: the four UDISE+ codes, plus Maharashtra's VJ, NT and SBC, which file as OBC. */
export const PUPIL_CATEGORIES = ["GENERAL", "SC", "ST", "OBC", "VJ", "NT", "SBC"] as const;
export const pupilCategorySchema = z.enum(PUPIL_CATEGORIES);
/** Religion as a coded choice, so the minority code is exact: Hindu and Other file as "not minority". */
export const PUPIL_RELIGIONS = ["HINDU", "MUSLIM", "CHRISTIAN", "SIKH", "BUDDHIST", "PARSI", "JAIN", "OTHER"] as const;
export const pupilReligionSchema = z.enum(PUPIL_RELIGIONS);
/**
 * Mother tongue as a coded choice: the twenty-two languages of the Eighth
 * Schedule, English, and "another". A NAME FROM A LIST, so "Marathi",
 * "marathi " and "मराठी" are one language on every sheet. The list is of
 * languages and not of any portal's numbers: a sheet that wants a number
 * maps from these.
 */
export const MOTHER_TONGUES = ["ASSAMESE", "BENGALI", "BODO", "DOGRI", "ENGLISH", "GUJARATI", "HINDI", "KANNADA", "KASHMIRI", "KONKANI", "MAITHILI", "MALAYALAM", "MANIPURI", "MARATHI", "NEPALI", "ODIA", "PUNJABI", "SANSKRIT", "SANTALI", "SINDHI", "TAMIL", "TELUGU", "URDU", "OTHER"] as const;
export const motherTongueSchema = z.enum(MOTHER_TONGUES);
export type MotherTongue = z.infer<typeof motherTongueSchema>;
/** Nationality as a coded choice: the filing asks only whether the child is an Indian national, and a regex on a typed word answered it. */
export const NATIONALITIES = ["INDIAN", "NEPALI", "BHUTANESE", "BANGLADESHI", "SRI_LANKAN", "OTHER"] as const;
export const nationalitySchema = z.enum(NATIONALITIES);
export type Nationality = z.infer<typeof nationalitySchema>;
/** An Indian PIN code: six digits, the first never zero. */
export const PIN_CODE = /^[1-9]\d{5}$/;
/**
 * What somebody typed, as the list's code when it is one: the code itself,
 * or the language's or nationality's English name in any capitals. Anything
 * else comes back null, for the caller to refuse or to leave as it stands.
 */
export function codeFromList<T extends string>(list: readonly T[], typed: string): T | null {
  const key = typed.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return (list as readonly string[]).includes(key) ? (key as T) : null;
}
/** Gender as UDISE+ codes it: male, female, transgender. */
export const pupilGenderSchema = z.enum(["M", "F", "T"]);
/** The 21 impairment types of the UDISE+ student module, by their portal code. */
export const CWSN_TYPES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"] as const;
export const cwsnTypeSchema = z.enum(CWSN_TYPES);
/** "Asked, and none": apart from a blank, which is "nobody has asked" and is filed blank. */
export const CWSN_NONE = "NONE";
/** The same eight groups the health card takes (health.ts); named apart so both modules export cleanly. */
export const RECORD_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const recordBloodGroupSchema = z.enum(RECORD_BLOOD_GROUPS);
/** A yes/no the form sends as text; blank clears. */
const yesNo = z.enum(["yes", "no", ""]);
export type PupilRecordField = z.infer<typeof pupilRecordFieldSchema>;

/** POST /api/v1/family/record and /api/v1/office/pupil-records/{membershipId} — the whole record; a blank clears the field. */
export const pupilRecordSaveSchema = z.object({
  fatherName: text.optional(),
  motherName: text.optional(),
  placeOfBirth: text.optional(),
  nationality: text.optional(),
  religion: z.union([pupilReligionSchema, z.literal("")]).optional(),
  caste: text.optional(),
  category: z.union([pupilCategorySchema, z.literal("")]).optional(),
  motherTongue: text.optional(),
  addressLine: z.string().trim().max(200).optional(),
  city: text.optional(),
  postalCode: z.string().trim().max(12).optional(),
  admissionNumber: z.string().trim().max(40).optional(),
  admissionDate: dateKey.nullable().optional(),
  admittedToGrade: z.string().trim().max(20).optional(),
  previousSchool: z.string().trim().max(160).optional(),
  penNumber: z.string().trim().max(40).optional(),
  gender: z.union([pupilGenderSchema, z.literal("")]).optional(),
  nameLocal: text.optional(),
  fatherNameLocal: text.optional(),
  motherNameLocal: text.optional(),
  bpl: yesNo.optional(),
  ews: yesNo.optional(),
  cwsnType: z.union([cwsnTypeSchema, z.literal(CWSN_NONE), z.literal("")]).optional(),
  /** The office's two answers for the filing; a family's body naming them changes nothing. */
  rte: yesNo.optional(),
  repeating: yesNo.optional(),
  bloodGroup: z.union([recordBloodGroupSchema, z.literal("")]).optional(),
  previousSchoolTcNumber: z.string().trim().max(40).optional(),
  previousSchoolTcDate: dateKey.nullable().optional(),
  fatherOccupation: text.optional(),
  motherOccupation: text.optional(),
  /** Rupees a year, digits only; blank clears. */
  annualIncome: z.string().trim().regex(/^\d{0,9}$/).optional(),
  /** The family's contact number as typed; the server keeps it as E.164 or refuses it. Blank clears. */
  guardianPhone: z.string().trim().max(24).optional(),
  /** The roll number in the pupil's present class, digits only; the office's to set, ignored from a family. */
  rollNumber: z.string().trim().regex(/^\d{0,4}$/).optional(),
});
export type PupilRecordSave = z.infer<typeof pupilRecordSaveSchema>;

export const pupilRecordSchema = z.object({
  fatherName: z.string().nullable(),
  motherName: z.string().nullable(),
  placeOfBirth: z.string().nullable(),
  nationality: z.string().nullable(),
  religion: z.string().nullable(),
  caste: z.string().nullable(),
  category: z.string().nullable(),
  motherTongue: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  admissionNumber: z.string().nullable(),
  admissionDate: dateKey.nullable(),
  admittedToGrade: z.string().nullable(),
  previousSchool: z.string().nullable(),
  penNumber: z.string().nullable(),
  gender: z.string().nullable(),
  nameLocal: z.string().nullable(),
  fatherNameLocal: z.string().nullable(),
  motherNameLocal: z.string().nullable(),
  /** "yes" | "no" | null, the way the form shows and sends it. */
  bpl: z.string().nullable(),
  ews: z.string().nullable(),
  cwsnType: z.string().nullable(),
  bloodGroup: z.string().nullable(),
  previousSchoolTcNumber: z.string().nullable().default(null),
  previousSchoolTcDate: dateKey.nullable().default(null),
  fatherOccupation: z.string().nullable().default(null),
  motherOccupation: z.string().nullable().default(null),
  /** Rupees a year as digits, the way the form shows and sends it. */
  annualIncome: z.string().nullable().default(null),
  /** The family's contact number, E.164. */
  guardianPhone: z.string().nullable().default(null),
  /** "yes" | "no" | null: admitted under the RTE quota. */
  rte: z.string().nullable().default(null),
  /** "yes" | "no": repeating the class, from the pupil's present enrolment; null when they are in no class. */
  repeating: z.string().nullable().default(null),
  /** The roll number on the pupil's present enrolment. */
  rollNumber: z.string().nullable().default(null),
  requestedAt: iso.nullable(),
  familyFilledAt: iso.nullable(),
  updatedAt: iso.nullable(),
});

/* -------------------------------------------------------------------------- */
/* PEN change requests                                                          */
/* -------------------------------------------------------------------------- */

export const penChangeStatusSchema = z.enum(["PENDING", "APPLIED", "REJECTED", "WITHDRAWN"]);
export type PenChangeStatus = z.infer<typeof penChangeStatusSchema>;
/** POST /api/v1/office/pupil-records/{membershipId}/pen-change — the admin proposes; null removes the number. */
export const penChangeProposeSchema = z.object({
  toPen: z.string().trim().regex(/^\d{11}$/, "pen").nullable(),
  reason: z.string().trim().min(1).max(400),
});
export const penChangeDecideSchema = z.object({ approve: z.boolean(), reason: z.string().trim().max(400).optional() });
export const penChangeRequestSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  fromPen: z.string().nullable(),
  toPen: z.string().nullable(),
  reason: z.string(),
  status: penChangeStatusSchema,
  requestedByName: z.string(),
  principal: z.object({ decided: z.boolean(), approved: z.boolean().nullable(), by: z.string().nullable() }),
  guardian: z.object({ decided: z.boolean(), approved: z.boolean().nullable(), by: z.string().nullable(), waived: z.boolean() }),
  decisionReason: z.string().nullable(),
  /** What this reader may do: the head decides, a guardian decides, the admin withdraws. */
  can: z.object({ decide: z.boolean(), withdraw: z.boolean() }),
  createdAt: iso,
  appliedAt: iso.nullable(),
});
export type PenChangeRequestView = z.infer<typeof penChangeRequestSchema>;
export const penChangesListSchema = z.object({ items: z.array(penChangeRequestSchema), pending: count });
export const penChangesQuerySchema = z.object({ status: penChangeStatusSchema.optional() });

/** GET /api/v1/family/record?childId= and /api/v1/office/pupil-records/{membershipId}. */
export const pupilRecordViewSchema = z.object({
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  studentCode: z.string().nullable(),
  birthdate: dateKey.nullable(),
  record: pupilRecordSchema.nullable(),
  /** The fields a certificate needs that are still blank. */
  missing: z.array(pupilRecordFieldSchema),
  /** The fields the UDISE+ filing needs that are still blank. */
  missingForFiling: z.array(pupilRecordFieldSchema),
  complete: z.boolean(),
  canEdit: z.boolean(),
  /** True only for an admin while the account has no PEN: the first entry. A correction goes through a change request. */
  penEditable: z.boolean(),
  /** The pending correction to the PEN, if any, and what this reader may do about it. */
  penChange: penChangeRequestSchema.nullable(),
});
export type PupilRecordView = z.infer<typeof pupilRecordViewSchema>;

export const familyRecordQuerySchema = z.object({ childId: cuid.optional() });

/** GET /api/v1/office/pupil-records?missing=1 — every pupil with what is still blank. */
export const officeRecordsQuerySchema = z.object({ missing: z.enum(["1"]).optional() });
export const officeRecordsSchema = z.object({
  rows: z.array(
    z.object({
      studentMembershipId: z.string(),
      studentName: z.string(),
      className: z.string().nullable(),
      missing: z.array(pupilRecordFieldSchema),
      /** The fields the UDISE+ filing needs that are still blank. */
      missingForFiling: z.array(pupilRecordFieldSchema),
      requestedAt: iso.nullable(),
      familyFilledAt: iso.nullable(),
    }),
  ),
  total: count,
  complete: count,
  incomplete: count,
});

/** POST /api/v1/office/pupil-records/request — ask the families to fill what is blank; every incomplete pupil when none are named. */
export const recordRequestSchema = z.object({ membershipIds: z.array(cuid).max(500).optional() });
export const recordRequestedSchema = z.object({ asked: count, families: count });

/* -------------------------------------------------------------------------- */
/* Issuing                                                                      */
/* -------------------------------------------------------------------------- */

/** POST /api/v1/office/certificates — issue one certificate to one pupil from a template. */
export const certificateIssueSchema = z.object({
  templateId: cuid,
  studentMembershipId: cuid,
  /** What a bonafide is for; printed where the template says [[issue.purpose]]. */
  purpose: z.string().trim().max(200).optional(),
  remark: z.string().trim().max(400).optional(),
  /** For a TC issued before the pupil's last day: the date the document should carry. */
  leftOn: dateKey.optional(),
  /** Issued from a family's request: the request is marked issued and points at the paper. */
  requestId: cuid.optional(),
});

export const issuedCertificateSchema = z.object({
  id: z.string(),
  kind: certificateKindSchema,
  locale: documentLocaleSchema,
  serial: z.string(),
  title: z.string(),
  intro: z.string(),
  rows: z.array(certificateRowSchema),
  outro: z.string(),
  layout: certificateLayoutSchema,
  purpose: z.string().nullable(),
  remark: z.string().nullable(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  school: z.object({
    name: z.string(),
    code: z.string(),
    logoPath: z.string().nullable(),
    addressLine: z.string().nullable(),
    city: z.string().nullable(),
    region: z.string().nullable(),
    postalCode: z.string().nullable(),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
    brandPrimary: z.string().nullable(),
  }),
  code: z.string(),
  issuedAt: iso,
  issuedByName: z.string().nullable(),
  revokedAt: iso.nullable(),
  revokedReason: z.string().nullable(),
  /** Placeholders that printed blank because the record had nothing for them. */
  missing: z.array(z.string()),
  canRevoke: z.boolean(),
});
export type IssuedCertificateView = z.infer<typeof issuedCertificateSchema>;

export const certificateRowViewSchema = z.object({
  id: z.string(),
  kind: certificateKindSchema,
  locale: documentLocaleSchema,
  serial: z.string(),
  title: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  issuedAt: iso,
  revokedAt: iso.nullable(),
});
export const certificatesListSchema = z.object({ items: z.array(certificateRowViewSchema) });
export const officeCertificatesQuerySchema = z.object({ membershipId: cuid.optional() });

export const certificateRevokeSchema = z.object({ reason: z.string().trim().min(1).max(200) });

/** GET /api/v1/public/certificates/{code} — what anyone with the code may learn: that it is real, nothing about the pupil. */
export const certificateVerifySchema = z.object({
  valid: z.boolean(),
  kind: certificateKindSchema.nullable(),
  serial: z.string().nullable(),
  title: z.string().nullable(),
  schoolName: z.string().nullable(),
  issuedAt: iso.nullable(),
  revokedAt: iso.nullable(),
});

/* -------------------------------------------------------------------------- */
/* Certificate requests                                                         */
/* -------------------------------------------------------------------------- */

export const certificateRequestStatusSchema = z.enum(["PENDING", "ISSUED", "DECLINED", "CANCELLED"]);
export type CertificateRequestStatus = z.infer<typeof certificateRequestStatusSchema>;

/** POST /api/v1/family/certificate-requests — a pupil for themselves, a guardian for a child (?childId=). */
export const certificateRequestSaveSchema = z.object({
  kind: certificateKindSchema,
  purpose: z.string().trim().min(1).max(200),
});
export type CertificateRequestSave = z.infer<typeof certificateRequestSaveSchema>;

export const certificateRequestSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  kind: certificateKindSchema,
  purpose: z.string(),
  status: certificateRequestStatusSchema,
  requestedByName: z.string(),
  certificateId: z.string().nullable(),
  serial: z.string().nullable(),
  declineReason: z.string().nullable(),
  decidedAt: iso.nullable(),
  /**
   * When the certificate this request was answered with was withdrawn; null
   * while it stands. Read from the certificate, not kept on the request: an
   * ISSUED request whose paper was revoked is shown as withdrawn.
   */
  revokedAt: iso.nullable().default(null),
  createdAt: iso,
});
export type CertificateRequestView = z.infer<typeof certificateRequestSchema>;

/** GET /api/v1/family/certificate-requests — mine (or my children's), with the kinds the school offers. */
export const familyCertificateRequestsSchema = z.object({
  items: z.array(certificateRequestSchema),
  /** The kinds with an active template: what may be asked for. */
  kinds: z.array(certificateKindSchema),
});
/** GET /api/v1/office/certificate-requests?status= — the queue, pending first. */
export const officeCertificateRequestsSchema = z.object({ items: z.array(certificateRequestSchema), pending: count });
export const officeCertificateRequestsQuerySchema = z.object({ status: certificateRequestStatusSchema.optional() });
export const certificateRequestDeclineSchema = z.object({ reason: z.string().trim().min(1).max(400) });

/** GET /api/v1/office/pupils/by-pen/{pen} — who holds a UDISE+ PEN: a pupil here in full, a pupil elsewhere by state alone, or nobody. */
export const penLookupSchema = z.object({
  pen: z.string().regex(/^\d{11}$/),
  found: z.enum(["HERE", "ELSEWHERE_ACTIVE", "ELSEWHERE_LEFT", "NONE"]),
  pupil: z.object({ membershipId: z.string(), name: z.string(), className: z.string().nullable(), studentCode: z.string().nullable() }).nullable(),
});
export type PenLookup = z.infer<typeof penLookupSchema>;
