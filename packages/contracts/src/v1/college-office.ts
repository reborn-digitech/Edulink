import { z } from "zod";

/**
 * college-office: the coded lists and the door shapes of the college office
 * (the owner's college plan of 4 October 2026): admissions from the CET
 * Cell's rounds (module ADMISSIONS), scholarships against the fee ledger
 * (module SCHOLARSHIPS), the accounts desk (role ACCOUNTS, no module), the
 * no-dues clearance, and the college settings of the library, hostel and
 * transport.
 *
 * EVERY AMOUNT IS INTEGER PAISE; the platform holds no money (decision
 * 0003). A refund, a disbursement, a caution deposit returned: each is a
 * RECORD of what the college's own bank or the state's portal did.
 */

const id = z.string().min(1).max(64);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const paise = z.number().int().min(0);
const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

/* ---------------------------------------------------------------------- */
/* Coded lists                                                             */
/* ---------------------------------------------------------------------- */

/**
 * THE CATEGORY A COLLEGE ADMITS AND CHARGES BY. The reservation categories
 * Maharashtra's CET Cell allots under (VJ and NT-1/2/3 are one fee category,
 * VJNT, as the fee regulating authority's structures and MahaDBT's schemes
 * treat them; SEBC is filed under OBC's fee line), plus the seat kinds that
 * carry their own fee: NRI, the institute-level quota and the management
 * quota. Free text where a filing wants one of these is refused.
 */
export const COLLEGE_CATEGORIES = ["OPEN", "SC", "ST", "OBC", "VJNT", "SBC", "EWS", "NRI", "INSTITUTE", "MANAGEMENT"] as const;
export const collegeCategorySchema = z.enum(COLLEGE_CATEGORIES);
export type CollegeCategory = z.infer<typeof collegeCategorySchema>;

/** The quota a seat was filled under: the CET Cell's CAP rounds, the institute-level round, management, NRI, a minority institution's quota, the tuition-fee-waiver scheme. */
export const ADMISSION_QUOTAS = ["CAP", "INSTITUTE", "MANAGEMENT", "NRI", "MINORITY", "TFWS"] as const;
export const admissionQuotaSchema = z.enum(ADMISSION_QUOTAS);
export type AdmissionQuota = z.infer<typeof admissionQuotaSchema>;

/** A round: the CET Cell's three CAP rounds, the institute-level round for the seats left, or merit-list admission for a non-professional programme. */
export const ADMISSION_ROUND_KINDS = ["CAP_1", "CAP_2", "CAP_3", "INSTITUTE", "MERIT"] as const;
export const admissionRoundKindSchema = z.enum(ADMISSION_ROUND_KINDS);
export type AdmissionRoundKind = z.infer<typeof admissionRoundKindSchema>;

export const COLLEGE_APPLICATION_STATUSES = ["APPLIED", "SCRUTINY", "OFFERED", "FEE_DUE", "ADMITTED", "CANCELLED", "REFUNDED"] as const;
export const collegeApplicationStatusSchema = z.enum(COLLEGE_APPLICATION_STATUSES);
export type CollegeApplicationStatus = z.infer<typeof collegeApplicationStatusSchema>;

/** The documents the scrutiny checks: caste and income certificates, domicile, a gap certificate, a migration certificate, the mark sheets. */
export const SCRUTINY_DOCUMENTS = ["caste", "income", "domicile", "gap", "migration", "marksheets"] as const;
export const scrutinyDocumentSchema = z.enum(SCRUTINY_DOCUMENTS);
export type ScrutinyDocument = z.infer<typeof scrutinyDocumentSchema>;
export const SCRUTINY_STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;
export const scrutinyStatusSchema = z.enum(SCRUTINY_STATUSES);

/**
 * WHAT EACH CATEGORY MUST SHOW. A reserved category's seat needs the caste
 * certificate and an income certificate (the non-creamy-layer one for OBC,
 * VJNT and SBC); EWS needs the income certificate; a state-quota seat needs
 * domicile; everyone shows mark sheets. The gap and migration certificates
 * are asked only of a candidate who has a gap year or comes from another
 * board or university — the office adds them to that application's list.
 */
export const DOCUMENTS_BY_CATEGORY: Record<CollegeCategory, readonly ScrutinyDocument[]> = {
  OPEN: ["domicile", "marksheets"],
  SC: ["caste", "income", "domicile", "marksheets"],
  ST: ["caste", "income", "domicile", "marksheets"],
  OBC: ["caste", "income", "domicile", "marksheets"],
  VJNT: ["caste", "income", "domicile", "marksheets"],
  SBC: ["caste", "income", "domicile", "marksheets"],
  EWS: ["income", "domicile", "marksheets"],
  NRI: ["marksheets"],
  INSTITUTE: ["marksheets"],
  MANAGEMENT: ["marksheets"],
};

/**
 * THE CET CELL'S ALLOTMENT LIST, column by column, as the Maharashtra State
 * CET Cell publishes an institute's CAP allotment (the FE/B.Pharm/MBA lists
 * of the 2025 rounds): serial, application id, the candidate's name, gender,
 * category, seat type, the choice code allotted, the merit number. A pasted
 * sheet is read in this order, with or without its heading row.
 */
export const CAP_SHEET_COLUMNS = ["srNo", "applicationId", "name", "gender", "category", "seatType", "choiceCode", "meritNo"] as const;

/**
 * THE REFUND SLABS for a cancelled admission. Source: the UGC's notification
 * on refund of fees, F.No.1-3/2007(CPP-II), 23 April 2018, as the UGC
 * reiterated it for 2024-25 (public notice of 4 June 2024) and the fee
 * regulating authorities apply it to unaided colleges. Measured from the
 * formally notified last date of admission:
 *   ≥ 15 days before … 100 % (less the processing charge: 5 %, at most ₹5,000)
 *   < 15 days before … 90 %
 *   ≤ 15 days after … 80 %
 *   16–30 days after … 50 %
 *   > 30 days after … 0 %
 * A CAUTION DEPOSIT is returned whole, whatever the slab. The office RECORDS
 * the refund the slab allows; the college pays it from its own bank.
 */
export const REFUND_SLABS = [
  { code: "FULL", fromDaysBeforeLast: 15, toDaysAfterLast: null, percent: 100, processing: true },
  { code: "BEFORE_LAST", fromDaysBeforeLast: 0, toDaysAfterLast: null, percent: 90, processing: false },
  { code: "WITHIN_15_AFTER", fromDaysBeforeLast: null, toDaysAfterLast: 15, percent: 80, processing: false },
  { code: "WITHIN_30_AFTER", fromDaysBeforeLast: null, toDaysAfterLast: 30, percent: 50, processing: false },
  { code: "NONE", fromDaysBeforeLast: null, toDaysAfterLast: null, percent: 0, processing: false },
] as const;
export type RefundSlabCode = (typeof REFUND_SLABS)[number]["code"];
export const REFUND_SLAB_SOURCE = { title: "UGC notification on refund of fees, F.No.1-3/2007(CPP-II)", dated: "2018-04-23", reiterated: "2024-06-04" } as const;
/** The processing charge on a full refund: 5 % of the fee, at most ₹5,000 (in paise). */
export const REFUND_PROCESSING = { percent: 5, capPaise: 500_000 } as const;

/**
 * THE SCHOLARSHIP SCHEMES a Maharashtra college files on MahaDBT, with the
 * categories each is open to (null: any), the family-income ceiling in
 * rupees and the share of the eligible fee (tuition, development and exam
 * heads) the scheme covers. Source: MahaDBT's scheme sheet as a college
 * publishes it ("MahaDBT portal scholarship schemes, college based",
 * 7 April 2026) and the central schemes' guidelines; the figures are the
 * office's starting point for the receivable, which the sanctioned amount
 * replaces, and are to be checked against the sheet each year.
 */
export const SCHOLARSHIP_SCHEMES = ["GOI_POST_MATRIC_SC", "GOI_POST_MATRIC_ST", "OBC_POST_MATRIC", "VJNT_SBC", "RSM_FEE_SCHOLARSHIP_100", "RSM_FEE_SCHOLARSHIP_50", "EBC", "MINORITY", "PM_USP", "OTHER"] as const;
export const scholarshipSchemeSchema = z.enum(SCHOLARSHIP_SCHEMES);
export type ScholarshipScheme = z.infer<typeof scholarshipSchemeSchema>;
export const SCHOLARSHIP_SCHEME_TABLE: Record<ScholarshipScheme, { categories: readonly CollegeCategory[] | null; incomeCeilingRupees: number | null; coversPercent: number; portal: "MAHADBT" | "NSP" | "OTHER" }> = {
  GOI_POST_MATRIC_SC: { categories: ["SC"], incomeCeilingRupees: 250_000, coversPercent: 100, portal: "MAHADBT" },
  GOI_POST_MATRIC_ST: { categories: ["ST"], incomeCeilingRupees: 250_000, coversPercent: 100, portal: "MAHADBT" },
  OBC_POST_MATRIC: { categories: ["OBC"], incomeCeilingRupees: 100_000, coversPercent: 100, portal: "MAHADBT" },
  VJNT_SBC: { categories: ["VJNT", "SBC"], incomeCeilingRupees: 100_000, coversPercent: 100, portal: "MAHADBT" },
  RSM_FEE_SCHOLARSHIP_100: { categories: ["OPEN", "EWS"], incomeCeilingRupees: 250_000, coversPercent: 100, portal: "MAHADBT" },
  RSM_FEE_SCHOLARSHIP_50: { categories: ["OPEN", "EWS"], incomeCeilingRupees: 800_000, coversPercent: 50, portal: "MAHADBT" },
  EBC: { categories: ["OPEN", "EWS"], incomeCeilingRupees: 800_000, coversPercent: 50, portal: "MAHADBT" },
  MINORITY: { categories: null, incomeCeilingRupees: 200_000, coversPercent: 100, portal: "NSP" },
  PM_USP: { categories: null, incomeCeilingRupees: 450_000, coversPercent: 0, portal: "NSP" },
  OTHER: { categories: null, incomeCeilingRupees: null, coversPercent: 0, portal: "OTHER" },
};
export const SCHOLARSHIP_SOURCE = { title: "MahaDBT portal scholarship schemes, college based", dated: "2026-04-07" } as const;
export const SCHOLARSHIP_STATUSES = ["APPLIED", "SANCTIONED", "DISBURSED", "LAPSED", "REJECTED"] as const;
export const scholarshipStatusSchema = z.enum(SCHOLARSHIP_STATUSES);
export type ScholarshipStatus = z.infer<typeof scholarshipStatusSchema>;

/** The fee heads a college adds to the school's (TUITION, TRANSPORT, EXAM, ACTIVITY, OTHER). */
export const COLLEGE_FEE_HEAD_KINDS = ["DEVELOPMENT", "LIBRARY", "LABORATORY", "HOSTEL", "MESS", "CAUTION_DEPOSIT"] as const;
/** The heads a scholarship's share is worked out on. */
export const SCHOLARSHIP_ELIGIBLE_HEAD_KINDS = ["TUITION", "DEVELOPMENT", "EXAM"] as const;

/** The events a no-dues clearance is for, and the desks that each clear a line. */
export const NO_DUES_EVENT_CODES = ["EXAM_FORM", "HOSTEL_EXIT", "LEAVING"] as const;
export const noDuesEventSchema = z.enum(NO_DUES_EVENT_CODES);
export const NO_DUES_DESKS = ["ACCOUNTS", "LIBRARY", "HOSTEL", "LAB"] as const;
export const noDuesDeskSchema = z.enum(NO_DUES_DESKS);

/** Whom a college notice is for, beyond the school's ALL/PARENTS/TEACHERS/STUDENTS: one programme, department, division or intake year (batch). */
export const AUDIENCE_TARGET_KINDS = ["PROGRAMME", "DEPARTMENT", "DIVISION", "BATCH"] as const;
export const audienceTargetSchema = z.object({ kind: z.enum(AUDIENCE_TARGET_KINDS), id: trimmed(1, 64) });
export type AudienceTarget = z.infer<typeof audienceTargetSchema>;

export const LIBRARY_ERESOURCE_KINDS = ["NLIST", "DELNET", "EJOURNAL", "EBOOK", "DATABASE", "OTHER"] as const;
export const TRANSPORT_ROUTE_KINDS = ["FIXED", "LOOP"] as const;

/* ---------------------------------------------------------------------- */
/* Admissions                                                              */
/* ---------------------------------------------------------------------- */

export const admissionRoundSchema = z.object({
  id: z.string(),
  programmeId: z.string().nullable(),
  intakeYear: z.number().int(),
  kind: admissionRoundKindSchema,
  name: z.string(),
  opensAt: iso,
  closesAt: iso,
  seats: z.record(z.string(), z.number().int()),
  status: z.enum(["OPEN", "CLOSED"]),
  allotments: z.number().int(),
  applications: z.number().int(),
  admitted: z.number().int(),
});
export type AdmissionRoundView = z.infer<typeof admissionRoundSchema>;
export const admissionRoundsSchema = z.object({ rounds: z.array(admissionRoundSchema) });
export const admissionRoundSaveSchema = z.object({
  programmeId: id.nullable().optional(),
  intakeYear: z.number().int().min(2000).max(2100),
  kind: admissionRoundKindSchema,
  name: trimmed(2, 80),
  opensOn: dateKey,
  closesOn: dateKey,
  seats: z.record(collegeCategorySchema, z.number().int().min(0).max(5000)),
});

export const capImportBodySchema = z.object({ text: z.string().min(1).max(500_000) });
export const capImportResultSchema = z.object({
  added: z.number().int(),
  already: z.number().int(),
  refused: z.array(z.object({ line: z.number().int(), reason: z.string() })),
  unmatchedProgramme: z.number().int(),
});

export const vacancyRowSchema = z.object({ category: collegeCategorySchema, seats: z.number().int(), admitted: z.number().int(), vacant: z.number().int() });
export const vacancyReportSchema = z.object({ roundId: z.string(), programmeId: z.string().nullable(), rows: z.array(vacancyRowSchema), totals: vacancyRowSchema.omit({ category: true }) });

export const scrutinyItemSchema = z.object({ doc: scrutinyDocumentSchema, required: z.boolean(), fileId: z.string().nullable(), status: scrutinyStatusSchema, note: z.string().nullable() });
export const collegeApplicationSchema = z.object({
  id: z.string(),
  roundId: z.string(),
  roundName: z.string(),
  programmeId: z.string(),
  number: z.number().int(),
  applicantName: z.string(),
  birthdateKey: dateKey.nullable(),
  category: collegeCategorySchema,
  quota: admissionQuotaSchema,
  gender: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  cetApplicationId: z.string().nullable(),
  meritRank: z.number().int().nullable(),
  documents: z.array(scrutinyItemSchema),
  scrutinyComplete: z.boolean(),
  antiRaggingStudentAt: isoOrNull,
  antiRaggingParentAt: isoOrNull,
  status: collegeApplicationStatusSchema,
  admissionFeePaise: paise.nullable(),
  admissionFeePaidAt: isoOrNull,
  admittedMembershipId: z.string().nullable(),
  admittedAt: isoOrNull,
  cancelledAt: isoOrNull,
  cancelReason: z.string().nullable(),
  refundPaise: paise.nullable(),
  refundSlab: z.string().nullable(),
  refundRecordedAt: isoOrNull,
  /** LIFECYCLE-4: the principal's approval of a seat beyond the round's seats or the intake. */
  supernumeraryAt: isoOrNull.optional(),
  supernumeraryReason: z.string().nullable().optional(),
  createdAt: iso,
});
export type CollegeApplicationView = z.infer<typeof collegeApplicationSchema>;
export const collegeApplicationsQuerySchema = z.object({ roundId: id.optional(), status: collegeApplicationStatusSchema.optional() });
export const collegeApplicationsSchema = z.object({ items: z.array(collegeApplicationSchema) });
export const collegeApplicationCreateSchema = z.object({
  roundId: id,
  /** From an imported allotment row: name, category and quota come from it. */
  capAllotmentId: id.optional(),
  programmeId: id.optional(),
  applicantName: trimmed(2, 120).optional(),
  birthdateKey: dateKey.optional(),
  category: collegeCategorySchema.optional(),
  quota: admissionQuotaSchema.optional(),
  gender: z.enum(["M", "F", "T"]).optional(),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/).optional(),
  email: z.string().trim().email().max(200).optional(),
  meritRank: z.number().int().min(1).max(10_000_000).optional(),
  /** The gap and migration certificates, when this candidate must show them. */
  extraDocuments: z.array(z.enum(["gap", "migration"])).max(2).optional(),
});
export const collegeDocumentBodySchema = z.object({ doc: scrutinyDocumentSchema, fileId: id.nullable().optional(), status: scrutinyStatusSchema.optional(), note: z.string().trim().max(300).optional() });
export const antiRaggingBodySchema = z.object({ by: z.enum(["STUDENT", "PARENT"]) });
export const admissionFeeBodySchema = z.object({ amountPaise: z.number().int().min(100).max(10_000_000_000), method: z.enum(["CASH", "CHEQUE", "BANK", "UPI"]), reference: trimmed(3, 80) });
export const collegeOfferBodySchema = z.object({ feeStructureId: id.optional() });
export const collegeSupernumeraryBodySchema = z.object({ reason: trimmed(3, 300) });
export const collegeAdmitBodySchema = z.object({ prn: z.string().trim().max(40).optional(), apaarId: z.string().trim().regex(/^\d{12}$/).optional(), abcId: z.string().trim().regex(/^\d{12}$/).optional() });
export const collegeAdmittedSchema = z.object({ studentMembershipId: z.string(), studentCode: z.string(), enrolmentId: z.string(), demands: z.number().int(), receiptSerial: z.string().nullable() });
export const collegeCancelBodySchema = z.object({ reason: trimmed(3, 300), /** The formally notified last date of admission the slab is measured from. */ lastDateKey: dateKey });
export const collegeRefundBodySchema = z.object({ reference: trimmed(3, 80) });
export const admissionRegisterQuerySchema = z.object({ intakeYear: z.coerce.number().int().min(2000).max(2100) });

/* ---------------------------------------------------------------------- */
/* Fee structures, demands, concessions                                    */
/* ---------------------------------------------------------------------- */

export const lateFeeSlabSchema = z.object({ afterDays: z.number().int().min(1).max(365), paise: z.number().int().min(0).max(10_000_000) });
export const collegeFeeStructureBodySchema = z.object({
  academicYearId: id.optional(),
  programmeId: id,
  yearOfStudy: z.number().int().min(1).max(6),
  category: collegeCategorySchema,
  approvalRef: trimmed(3, 120),
  name: trimmed(2, 80),
  /** One instalment per term: its label, due day and lines by head. */
  terms: z.array(z.object({ label: trimmed(1, 40), dueDateKey: dateKey, lines: z.array(z.object({ headId: id, amountPaise: z.number().int().min(0).max(10_000_000_000) })).min(1).max(30) })).min(1).max(4),
  lateFeeSlabs: z.array(lateFeeSlabSchema).max(6).default([]),
});
export const collegeFeeStructureSchema = z.object({
  id: z.string(),
  name: z.string(),
  programmeId: z.string(),
  yearOfStudy: z.number().int(),
  category: collegeCategorySchema,
  approvalRef: z.string().nullable(),
  published: z.boolean(),
  totalPaise: paise,
  terms: z.array(z.object({ label: z.string(), dueDateKey: dateKey, totalPaise: paise })),
  lateFeeSlabs: z.array(lateFeeSlabSchema),
  students: z.number().int(),
});
export const collegeFeeStructuresSchema = z.object({ structures: z.array(collegeFeeStructureSchema), year: z.object({ id: z.string(), name: z.string() }).nullable() });
export const raiseDemandsBodySchema = z.object({ academicYearId: id.optional(), programmeId: id.optional() });
export const raiseDemandsResultSchema = z.object({ students: z.number().int(), assigned: z.number().int(), unchanged: z.number().int(), noStructure: z.array(z.object({ studentMembershipId: z.string(), name: z.string() })), refused: z.number().int() });
export const collegeConcessionBodySchema = z.object({
  studentMembershipId: id,
  headId: id.nullable().optional(),
  kind: z.enum(["PERCENT", "AMOUNT"]),
  value: z.number().int().min(1).max(10_000_000_000),
  reason: trimmed(3, 200),
  /** Who sanctioned it, as the order names them: the governing body, the trust, the fee regulating authority. */
  authority: trimmed(3, 120),
});
export const collegeConcessionResultSchema = z.object({ id: z.string(), approvalStatus: z.enum(["APPROVED", "PENDING"]), valuePaise: paise });
export const concessionDecisionBodySchema = z.object({ approve: z.boolean(), note: z.string().trim().max(300).optional() });
export const pendingConcessionsSchema = z.object({ items: z.array(z.object({ id: z.string(), studentMembershipId: z.string(), studentName: z.string(), kind: z.string(), value: z.number().int(), valuePaise: paise, reason: z.string(), authority: z.string().nullable(), grantedBy: z.string(), createdAt: iso })) });
export const accountsSettingsSchema = z.object({ concessionLimitPaise: paise });

/* ---------------------------------------------------------------------- */
/* The ledger, scholarships                                                */
/* ---------------------------------------------------------------------- */

export const ledgerTermSchema = z.object({
  demandId: z.string(),
  label: z.string(),
  dueDateKey: dateKey,
  demandPaise: paise,
  /** The state's share still to come on this demand (sanctioned or expected, not yet disbursed). */
  scholarshipReceivablePaise: paise,
  paidPaise: paise,
  /** What the family owes on it: demand − paid − receivable, never below 0. */
  netDuePaise: paise,
  status: z.string(),
  overdue: z.boolean(),
  /** The late fee the structure's slabs put on an overdue term, if paid today (the college charges it at its counter; shown, not raised). */
  lateFeePaise: paise,
});
export const studentLedgerSchema = z.object({
  student: z.object({ studentMembershipId: z.string(), name: z.string(), programmeId: z.string().nullable(), category: z.string().nullable(), yearOfStudy: z.number().int().nullable() }),
  year: z.object({ id: z.string(), name: z.string() }).nullable(),
  terms: z.array(ledgerTermSchema),
  claims: z.array(z.object({ id: z.string(), scheme: scholarshipSchemeSchema, status: scholarshipStatusSchema, receivablePaise: paise, sanctionedPaise: paise.nullable(), disbursedPaise: paise.nullable() })),
  totals: z.object({ demandPaise: paise, scholarshipReceivablePaise: paise, paidPaise: paise, netDuePaise: paise }),
  todayKey: dateKey,
});
export type StudentLedger = z.infer<typeof studentLedgerSchema>;
export const studentLedgerQuerySchema = z.object({ childId: id.optional(), academicYearId: id.optional() });

export const scholarshipClaimSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  scheme: scholarshipSchemeSchema,
  academicYear: z.string(),
  portalApplicationId: z.string().nullable(),
  appliedAt: isoOrNull,
  expectedPaise: paise,
  sanctionedPaise: paise.nullable(),
  sanctionedAt: isoOrNull,
  disbursedPaise: paise.nullable(),
  disbursedAt: isoOrNull,
  disbursementRef: z.string().nullable(),
  status: scholarshipStatusSchema,
  documents: z.array(z.object({ key: z.string(), fileId: z.string(), name: z.string(), uploadedAt: iso })),
  alumniGiftId: z.string().nullable(),
  /** Days since applied (or sanctioned) while the money is still to come; null once settled. */
  ageDays: z.number().int().nullable(),
});
export type ScholarshipClaimView = z.infer<typeof scholarshipClaimSchema>;
export const scholarshipClaimsQuerySchema = z.object({ status: scholarshipStatusSchema.optional(), academicYear: z.string().regex(/^\d{4}-\d{2}$/).optional(), scheme: scholarshipSchemeSchema.optional() });
export const scholarshipClaimsSchema = z.object({ items: z.array(scholarshipClaimSchema) });
export const scholarshipClaimCreateSchema = z.object({
  studentMembershipId: id,
  scheme: scholarshipSchemeSchema,
  academicYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  portalApplicationId: z.string().trim().min(4).max(40).optional(),
  appliedOn: dateKey.optional(),
  /** Null: worked out from the scheme's share of the eligible heads this year. */
  expectedPaise: paise.max(10_000_000_000).optional(),
  alumniGiftId: id.optional(),
});
export const scholarshipClaimUpdateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("SANCTION"), amountPaise: paise.max(10_000_000_000), on: dateKey }),
  z.object({ action: z.literal("DISBURSE"), amountPaise: paise.max(10_000_000_000), on: dateKey, reference: trimmed(3, 80) }),
  z.object({ action: z.literal("LAPSE"), reason: trimmed(3, 300) }),
  z.object({ action: z.literal("REJECT"), reason: trimmed(3, 300) }),
  z.object({ action: z.literal("PORTAL_ID"), portalApplicationId: trimmed(4, 40) }),
]);
export const scholarshipSchemesSchema = z.object({
  schemes: z.array(z.object({ scheme: scholarshipSchemeSchema, categories: z.array(collegeCategorySchema).nullable(), incomeCeilingRupees: z.number().int().nullable(), coversPercent: z.number().int(), portal: z.string(), eligible: z.boolean().nullable() })),
  source: z.object({ title: z.string(), dated: z.string() }),
});
export const studentScholarshipsSchema = z.object({ claims: z.array(scholarshipClaimSchema), schemes: scholarshipSchemesSchema.shape.schemes, category: z.string().nullable() });
export const scholarshipDocumentBodySchema = z.object({ key: z.enum(["income", "caste", "domicile", "fee_receipt", "bank_passbook", "marksheet", "other"]), fileId: id, name: trimmed(1, 120) });

/* ---------------------------------------------------------------------- */
/* No-dues                                                                 */
/* ---------------------------------------------------------------------- */

export const noDuesLineSchema = z.object({ desk: noDuesDeskSchema, owedPaise: paise, itemsOut: z.number().int(), cleared: z.boolean(), clearedByName: z.string().nullable(), clearedAt: isoOrNull });
export const noDuesSchema = z.object({ studentMembershipId: z.string(), studentName: z.string(), event: noDuesEventSchema, lines: z.array(noDuesLineSchema), completed: z.boolean(), completedAt: isoOrNull });
export const noDuesQuerySchema = z.object({ event: noDuesEventSchema });
export const noDuesClearBodySchema = z.object({ event: noDuesEventSchema, desk: noDuesDeskSchema, note: z.string().trim().max(300).optional() });
export const noDuesListSchema = z.object({ items: z.array(noDuesSchema.pick({ studentMembershipId: true, studentName: true, completed: true }).extend({ uncleared: z.array(noDuesDeskSchema) })) });
export const collegeLeavingBodySchema = z.object({ leftOn: dateKey, reason: z.enum(["TRANSFERRED", "GRADUATED", "LEFT"]), cautionReturnRef: z.string().trim().max(80).optional() });
export const collegeLeavingResultSchema = z.object({ studentMembershipId: z.string(), cautionReturnPaise: paise, alumnus: z.boolean() });

/* ---------------------------------------------------------------------- */
/* The accounts desk                                                       */
/* ---------------------------------------------------------------------- */

export const accountsOverviewSchema = z.object({
  year: z.object({ id: z.string(), name: z.string() }).nullable(),
  collection: z.array(z.object({ programmeId: z.string().nullable(), term: z.string(), demandPaise: paise, collectedPaise: paise, outstandingPaise: paise })),
  defaulters: z.array(z.object({ studentMembershipId: z.string(), name: z.string(), overduePaise: paise, oldestDueKey: dateKey })),
  receivableAgeing: z.array(z.object({ bucket: z.enum(["0_30", "31_90", "91_180", "OVER_180"]), claims: z.number().int(), receivablePaise: paise })),
  incomeExpense: z.object({ feesCollectedPaise: paise, scholarshipsDisbursedPaise: paise, purchasesPaise: paise, payrollGrossPaise: paise }),
  pendingConcessions: z.number().int(),
});
export const financeTableSchema = z.object({
  years: z.array(z.object({ academicYear: z.string(), feesDemandedPaise: paise, feesCollectedPaise: paise, scholarshipsDisbursedPaise: paise, salariesPaise: paise, purchasesPaise: paise, libraryPaise: paise })),
});
export const financeTableQuerySchema = z.object({ years: z.coerce.number().int().min(1).max(5).default(3) });
export const accountsReportQuerySchema = z.object({ report: z.enum(["collection", "defaulters", "receivable", "income-expense", "finance-table"]) });
export const messBillBodySchema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), hostelId: id.optional() });
export const messBillResultSchema = z.object({ billed: z.number().int(), already: z.number().int(), skipped: z.number().int() });
export const routeFeesBodySchema = z.object({ termLabel: trimmed(1, 40), dueDateKey: dateKey });
export const routeFeesResultSchema = z.object({ raised: z.number().int(), already: z.number().int() });

/* ---------------------------------------------------------------------- */
/* Library, hostel, transport at a college; the calendar                  */
/* ---------------------------------------------------------------------- */

export const eResourceSchema = z.object({ id: z.string(), name: z.string(), url: z.string(), kind: z.enum(LIBRARY_ERESOURCE_KINDS), clicks: z.number().int(), active: z.boolean() });
export const eResourcesSchema = z.object({ items: z.array(eResourceSchema) });
export const eResourceSaveSchema = z.object({ name: trimmed(2, 120), url: z.string().trim().url().max(500).refine((u) => u.startsWith("https://"), "https"), kind: z.enum(LIBRARY_ERESOURCE_KINDS) });
export const eResourceOpenSchema = z.object({ url: z.string(), clicks: z.number().int() });
export const isbnImportBodySchema = z.object({ text: z.string().min(1).max(200_000) });
export const isbnImportResultSchema = z.object({ added: z.number().int(), already: z.number().int(), invalid: z.array(z.string()) });
export const libraryTableSchema = z.object({ academicYear: z.string(), titles: z.number().int(), copies: z.number().int(), periodicals: z.number().int(), eResources: z.number().int(), eResourceClicks: z.number().int(), issues: z.number().int(), members: z.number().int(), issuesPerStudent: z.number(), expenditurePaise: paise });
export const yearQuerySchema = z.object({ year: z.string().regex(/^\d{4}-\d{2}$/).optional() });
export const squadRoundSchema = z.object({ id: z.string(), hostelId: z.string(), hostelName: z.string(), at: iso, members: z.string(), note: z.string(), flagged: z.boolean() });
export const squadRoundsSchema = z.object({ items: z.array(squadRoundSchema) });
export const squadRoundSaveSchema = z.object({ hostelId: id, at: iso, members: trimmed(3, 300), note: z.string().trim().max(1000).default(""), flagged: z.boolean().default(false) });
export const hostelTableSchema = z.object({ academicYear: z.string(), hostels: z.number().int(), beds: z.number().int(), occupied: z.number().int(), occupancyPercent: z.number(), boarders: z.number().int(), incidents: z.number().int(), squadRounds: z.number().int(), flaggedRounds: z.number().int(), lateReturns: z.number().int() });
export const roomChangeBodySchema = z.object({ allotmentId: id, roomId: id, bed: z.number().int().min(1).max(100) });
export const hostelRulesBodySchema = z.object({ curfewMinute: z.number().int().min(0).max(1439), nightOutAllowed: z.boolean(), messMonthlyPaise: paise.max(100_000_000) });
export const routeCollegeBodySchema = z.object({ kind: z.enum(TRANSPORT_ROUTE_KINDS), feePerTermPaise: paise.max(100_000_000) });
export const calendarImportBodySchema = z.object({ text: z.string().min(1).max(200_000) });
export const calendarImportResultSchema = z.object({ added: z.number().int(), already: z.number().int(), refused: z.array(z.object({ line: z.number().int(), reason: z.string() })) });
export const collegeLibrarySettingsSchema = z.object({ facultyLimit: z.number().int().min(0).max(50), facultyLoanDays: z.number().int().min(1).max(365), collegeStudentLimit: z.number().int().min(0).max(30), collegeStudentLoanDays: z.number().int().min(1).max(180), bookBankExtra: z.number().int().min(0).max(20) });

/* ---------------------------------------------------------------------- */
/* The student's own                                                       */
/* ---------------------------------------------------------------------- */

export const studentAccountSchema = z.object({
  consentApplies: z.boolean(),
  grants: z.array(z.object({ grant: z.string(), on: z.boolean() })),
  twoFactorOn: z.boolean(),
  exportPath: z.string(),
  noDues: z.array(z.object({ event: noDuesEventSchema, completed: z.boolean() })),
});
export const studentNoDuesSchema = z.object({ items: z.array(noDuesSchema) });
export const reconciliationQuerySchema = z.object({ scheme: scholarshipSchemeSchema, academicYear: z.string().regex(/^\d{4}-\d{2}$/) });
export const collegeSavedSchema = z.object({ id: z.string() });
export const concessionDecidedSchema = z.object({ approvalStatus: z.string() });
export const roomChangedSchema = z.object({ allotmentId: z.string() });
export const hostelRulesSchema = z.object({ id: z.string(), curfewMinute: z.number().int(), nightOutAllowed: z.boolean(), messMonthlyPaise: z.number().int() });
export const routeCollegeSchema = z.object({ id: z.string(), kind: z.string(), feePerTermPaise: z.number().int() });
