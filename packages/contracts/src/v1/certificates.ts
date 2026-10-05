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

/** A college adds MIGRATION, PROVISIONAL and COURSE_COMPLETION (4 Oct 2026). */
export const certificateKindSchema = z.enum(["TC", "NIRGAM", "BONAFIDE", "CHARACTER", "STUDY", "CUSTOM", "MIGRATION", "PROVISIONAL", "COURSE_COMPLETION"]);
export type CertificateKind = z.infer<typeof certificateKindSchema>;
export const documentLocaleSchema = z.enum(["en", "hi", "mr"]);

/** One numbered row of the document: a label and a value written with [[placeholders]]. */
export const certificateRowSchema = z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().max(200) });
export type CertificateRow = z.infer<typeof certificateRowSchema>;

/**
 * Who signs a paper's line. NONE prints the line and the title under it, as
 * every paper did before 2026-09-30; ADMIN or PRINCIPAL also draws that
 * person's signature — at once when they issue the paper themselves, and
 * once they have approved it when somebody else did.
 */
export const paperSignerSchema = z.enum(["NONE", "ADMIN", "PRINCIPAL"]);
export type PaperSigner = z.infer<typeof paperSignerSchema>;
/**
 * Who signs a line of a REPORT CARD: the same, and the class's teacher, whose
 * line a report card has and a certificate has not. A report card is
 * published a class at a time, so its signatures are put and waited for a
 * class at a time: one approval signs every card of the set.
 */
export const cardSignerSchema = z.enum(["NONE", "TEACHER", "ADMIN", "PRINCIPAL"]);
export type CardSigner = z.infer<typeof cardSignerSchema>;
export const signingRoleSchema = z.enum(["TEACHER", "ADMIN", "PRINCIPAL"]);
export const paperKindSchema = z.enum(["CERTIFICATE", "REPORT_CARD_SET"]);

/** A typeface the web bundles (apps/web/src/lib/fonts.ts), by key; "default" is the paper's own stack. */
export const fontKeySchema = z.string().trim().regex(/^[a-z]{1,40}$/).default("default");

export const certificateLayoutSchema = z.object({
  font: fontKeySchema,
  /** The opening and closing paragraphs' own faces; "default" here is the paper's. What is typed into a paragraph follows its face's script. */
  introFont: fontKeySchema,
  outroFont: fontKeySchema,
  signerLeft: paperSignerSchema.default("NONE"),
  signerRight: paperSignerSchema.default("NONE"),
  /** The school's seal, drawn between the two signatures. */
  showSeal: z.boolean().default(false),
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
  // The sheet's plain answers (2026-09-30): a second number, free uniform and textbooks, extracurricular activity,
  // and the higher secondary's stream and vocational course by the portal's codes.
  "alternatePhone", "freeUniform", "freeTextbook", "extracurricular", "stream", "vocationalCourse", "vocationalTradeId", "vocationalJobRoleId", "vocationalExamAppeared",
]);
/** The higher secondary's stream as UDISE+ codes it: 1 Arts, 2 Science, 3 Commerce, 4 Vocational, 5 Other. */
export const PUPIL_STREAMS = ["1", "2", "3", "4", "5"] as const;
export const pupilStreamSchema = z.enum(PUPIL_STREAMS);
/**
 * The fields a family knows of itself: the ones the office's "ask the
 * families" is about. A FAMILY WRITES NONE OF THEM. Since 2026-09-29 the
 * record is the office's alone to write; a guardian or the pupil reads it
 * and asks for a change (RECORD_CHANGE_FIELDS, below), and the office
 * applies it or declines. The list is kept because it still says which
 * blanks a family can be asked about.
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

/** POST /api/v1/office/pupil-records/{membershipId} — the whole record; a blank clears the field. The family's ask carries the same shape. */
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
  alternatePhone: z.string().trim().max(24).optional(),
  freeUniform: yesNo.optional(),
  freeTextbook: yesNo.optional(),
  extracurricular: yesNo.optional(),
  stream: z.union([pupilStreamSchema, z.literal("")]).optional(),
  vocationalCourse: yesNo.optional(),
  /** The portal's own ids for the trade or sector and the job role; digits and dashes. */
  vocationalTradeId: z.string().trim().regex(/^[0-9A-Za-z-]{0,20}$/).optional(),
  vocationalJobRoleId: z.string().trim().regex(/^[0-9A-Za-z-]{0,20}$/).optional(),
  vocationalExamAppeared: yesNo.optional(),
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
  alternatePhone: z.string().nullable().default(null),
  freeUniform: z.string().nullable().default(null),
  freeTextbook: z.string().nullable().default(null),
  extracurricular: z.string().nullable().default(null),
  stream: z.string().nullable().default(null),
  vocationalCourse: z.string().nullable().default(null),
  vocationalTradeId: z.string().nullable().default(null),
  vocationalJobRoleId: z.string().nullable().default(null),
  vocationalExamAppeared: z.string().nullable().default(null),
  requestedAt: iso.nullable(),
  familyFilledAt: iso.nullable(),
  updatedAt: iso.nullable(),
});

/* -------------------------------------------------------------------------- */
/* Signatures and the seal                                                      */
/* -------------------------------------------------------------------------- */

/** A picture as the browser hands it over: a PNG as a data URL. The server reads the bytes and refuses anything else. */
export const pngDataUrlSchema = z.string().regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "png").max(400_000);
export const signatureSaveSchema = z.object({ image: pngDataUrlSchema });
export const paperSignatureStatusSchema = z.enum(["PENDING", "SIGNED", "DECLINED"]);
/** One signature on one issued paper, as its reader sees it. */
export const paperSignatureSchema = z.object({
  id: z.string(),
  slot: z.enum(["LEFT", "RIGHT"]),
  role: signingRoleSchema,
  status: paperSignatureStatusSchema,
  signerName: z.string().nullable(),
  /** The paper's own copy of the picture, once signed. */
  image: z.string().nullable(),
  decidedAt: iso.nullable(),
  /** True for the person whose word this signature waits for. */
  can: z.object({ decide: z.boolean() }),
});
export type PaperSignatureView = z.infer<typeof paperSignatureSchema>;
/** GET /api/v1/office/signatures — the reader's own signature, the school's seal, and the papers waiting for the reader. */
export const signaturesViewSchema = z.object({
  mine: z.object({ image: z.string().nullable(), updatedAt: iso.nullable() }),
  seal: z.object({ image: z.string().nullable(), updatedAt: iso.nullable() }),
  /** True for an admin: the seal is the school's and the admin's to set. */
  canSetSeal: z.boolean(),
  waiting: z.array(
    z.object({
      id: z.string(),
      paperKind: paperKindSchema,
      /** The certificate; or, for a set of report cards, one card of the set to open and read. */
      paperId: z.string(),
      /** How many papers the one signature signs: 1 for a certificate, the class's cards for a set. */
      count: count.default(1),
      title: z.string(),
      serial: z.string().nullable(),
      studentName: z.string(),
      requestedByName: z.string().nullable(),
      createdAt: iso,
    }),
  ),
});
export type SignaturesView = z.infer<typeof signaturesViewSchema>;
export const paperSignatureDecideSchema = z.object({ approve: z.boolean() });
/** The paper the decision was about, and how the signature now stands. */
export const paperSignatureDecidedSchema = z.object({ paperKind: paperKindSchema, paperId: z.string(), status: paperSignatureStatusSchema });

/* -------------------------------------------------------------------------- */
/* A family's ask to change the record                                          */
/* -------------------------------------------------------------------------- */

/**
 * What a family may ask to have changed: every field of the record but
 * three. The PEN has a correction of its own that the head and a guardian
 * both approve; the roll number and "repeating the class" are the
 * enrolment's and not the record's.
 */
export const RECORD_CHANGE_EXCLUDED = ["penNumber", "rollNumber", "repeating"] as const satisfies readonly PupilRecordField[];
export const RECORD_CHANGE_FIELDS = pupilRecordFieldSchema.options.filter((f) => !(RECORD_CHANGE_EXCLUDED as readonly string[]).includes(f)) as Exclude<PupilRecordField, (typeof RECORD_CHANGE_EXCLUDED)[number]>[];
export const recordChangeStatusSchema = z.enum(["PENDING", "APPLIED", "DECLINED", "WITHDRAWN"]);
export type RecordChangeStatus = z.infer<typeof recordChangeStatusSchema>;
/**
 * POST /api/v1/family/record/changes — the values the family proposes, as the
 * record's own form sends them (a blank asks for the field to be cleared),
 * and why. Only the fields that differ from the record are kept.
 */
export const recordChangeFileSchema = z.object({
  changes: pupilRecordSaveSchema.omit({ penNumber: true, rollNumber: true, repeating: true }).strict(),
  reason: z.string().trim().min(1).max(400),
});
export type RecordChangeFile = z.infer<typeof recordChangeFileSchema>;
/** POST /api/v1/office/record-changes/{requestId}/decide — approve applies the values; a decline may carry a sentence for the family. */
export const recordChangeDecideSchema = z.object({ approve: z.boolean(), reason: z.string().trim().max(400).optional() });
export const recordChangeSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  requestedByName: z.string(),
  /** True when the pupil asked for themselves. */
  byPupil: z.boolean(),
  reason: z.string(),
  status: recordChangeStatusSchema,
  /** Each field asked about: what the record held when it was asked, and what is proposed. Null is a blank. */
  changes: z.array(z.object({ field: pupilRecordFieldSchema, from: z.string().nullable(), to: z.string().nullable() })),
  declineReason: z.string().nullable(),
  decidedByName: z.string().nullable(),
  decidedAt: iso.nullable(),
  /** What this reader may do: the office decides, the family takes it back. */
  can: z.object({ decide: z.boolean(), withdraw: z.boolean() }),
  createdAt: iso,
});
export type RecordChangeView = z.infer<typeof recordChangeSchema>;
export const recordChangesListSchema = z.object({ items: z.array(recordChangeSchema), pending: count });
export const recordChangesQuerySchema = z.object({ status: recordChangeStatusSchema.optional() });

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
  /** True for a guardian and for the pupil: they read the record and may ask the office to change it. */
  canRequest: z.boolean().default(false),
  /** The request waiting on this pupil's record, if any, and what this reader may do about it. */
  change: recordChangeSchema.nullable().default(null),
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
  /** The signatures this paper's template asks for, and the school's seal as this paper keeps it. */
  signatures: z.array(paperSignatureSchema).default([]),
  seal: z.string().nullable().default(null),
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
  /** G-6: the fee the office set on this paper (a demand on the pupil's ledger, paid outside the platform), and whether it is paid; null when there is none. */
  feePaise: z.number().int().nullable().optional(),
  feePaid: z.boolean().nullable().optional(),
  createdAt: iso,
});
export type CertificateRequestView = z.infer<typeof certificateRequestSchema>;
export const certificateRequestFeeSchema = z.object({ amountPaise: z.number().int().min(100).max(10_000_000) });

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

/**
 * THE STUDENT'S IDENTITY CARD (5 Oct 2026, apps/web/src/lib/id-card.ts). GET /api/v1/id-cards/pdf?student= — one
 * card as a PDF: a student's own (no `student`), a guardian's child's, the office's or the head's for anyone on the
 * roll. GET /api/v1/id-cards/check?c= — the gate's read of a scanned card's code at the checker's own school.
 */
export const idCardPdfQuerySchema = z.object({ student: z.string().min(1).max(64).optional() });
export const idCardCheckQuerySchema = z.object({ c: z.string().trim().min(1).max(40) });
export const idCardCheckSchema = z.object({ found: z.boolean(), onRoll: z.boolean(), name: z.string().nullable(), group: z.string().nullable(), studentCode: z.string(), photoFileId: z.string().nullable(), schoolName: z.string().nullable() });
