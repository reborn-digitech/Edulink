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
]);
export type PupilRecordField = z.infer<typeof pupilRecordFieldSchema>;

/** POST /api/v1/family/record and /api/v1/office/pupil-records/{membershipId} — the whole record; a blank clears the field. */
export const pupilRecordSaveSchema = z.object({
  fatherName: text.optional(),
  motherName: text.optional(),
  placeOfBirth: text.optional(),
  nationality: text.optional(),
  religion: text.optional(),
  caste: text.optional(),
  category: text.optional(),
  motherTongue: text.optional(),
  addressLine: z.string().trim().max(200).optional(),
  city: text.optional(),
  postalCode: z.string().trim().max(12).optional(),
  admissionNumber: z.string().trim().max(40).optional(),
  admissionDate: dateKey.nullable().optional(),
  admittedToGrade: z.string().trim().max(20).optional(),
  previousSchool: z.string().trim().max(160).optional(),
  penNumber: z.string().trim().max(40).optional(),
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
  requestedAt: iso.nullable(),
  familyFilledAt: iso.nullable(),
  updatedAt: iso.nullable(),
});

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
  complete: z.boolean(),
  canEdit: z.boolean(),
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
