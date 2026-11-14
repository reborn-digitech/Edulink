import { z } from "zod";
import { realDateKey } from "./calendar-keys";
import { DUTY_STREAMS } from "./duties";
import type { StreamCode } from "./streams";

/**
 * THE CLINICAL COORDINATOR'S DESK (R-56, the clinical half; 10 October
 * 2026). A health-sciences or pharmacy college posts its students to a
 * teaching hospital, a primary health centre, a clinic or a hospital
 * pharmacy, department by department in rotations, under a supervising
 * faculty member; each student keeps a logbook of the cases, procedures and
 * skills of a posting, which the supervisor or the coordinator signs or
 * returns. The desk is lib/clinical.ts; the doors are /api/v1/duties/clinical
 * (the coordinator, the office and the head), /duties/clinical/supervising
 * (any faculty member, for the postings they supervise) and the student's
 * own /api/v1/family/clinical.
 *
 * NO PATIENT IDENTIFIERS, EVER: a logbook note is free text that carries no
 * name, number or address (the minors' policy's stripping rule, decision
 * 0002; lib/assistant/strip.ts finds a phone number, an e-mail, a link, a
 * platform id or a hospital-style code and the save is refused). The site's
 * contact is a role word (CLINICAL_CONTACT_ROLES), never a person's details.
 */
export const CLINICAL_STREAMS: readonly StreamCode[] = DUTY_STREAMS.CLINICAL_COORDINATOR === "ALL" ? [] : DUTY_STREAMS.CLINICAL_COORDINATOR;

/** Where students are posted: the teaching hospital or an attached one, a PHC, a clinic, a hospital pharmacy (the pharmacy stream's). */
export const CLINICAL_SITE_KINDS = ["HOSPITAL", "PRIMARY_HEALTH_CENTRE", "CLINIC", "PHARMACY"] as const;
export const clinicalSiteKindSchema = z.enum(CLINICAL_SITE_KINDS);
export type ClinicalSiteKind = z.infer<typeof clinicalSiteKindSchema>;

/** The site's contact as a role, not a person: whom the college writes to about the agreement and the postings. */
export const CLINICAL_CONTACT_ROLES = ["MEDICAL_SUPERINTENDENT", "NURSING_SUPERINTENDENT", "MEDICAL_OFFICER", "CHIEF_PHARMACIST", "ADMINISTRATOR"] as const;
export const clinicalContactRoleSchema = z.enum(CLINICAL_CONTACT_ROLES);
export type ClinicalContactRole = z.infer<typeof clinicalContactRoleSchema>;

/** What a logbook entry records: a case seen, a procedure done or assisted, a skill practised, or (a pharmacy posting) prescriptions dispensed. */
export const LOGBOOK_KINDS = ["CASE", "PROCEDURE", "SKILL", "DISPENSING"] as const;
export const logbookKindSchema = z.enum(LOGBOOK_KINDS);
export type LogbookKind = z.infer<typeof logbookKindSchema>;

/**
 * An entry's life: the student drafts it (DRAFT), hands it in (SUBMITTED),
 * and the supervisor signs it (SIGNED, final) or returns it with a remark
 * (RETURNED), after which the student corrects and hands it in again.
 */
export const LOGBOOK_STATES = ["DRAFT", "SUBMITTED", "SIGNED", "RETURNED"] as const;
export const logbookStateSchema = z.enum(LOGBOOK_STATES);
export type LogbookState = z.infer<typeof logbookStateSchema>;

/**
 * THE COUNCILS' MINIMUM COUNTS PER PROGRAMME. Left empty on purpose (10 Oct
 * 2026): the INC's B.Sc. (N) syllabus states clinical HOURS per course and the
 * NMC's CBME logbook asks for certifiable competencies per subject, neither a
 * count of cases, procedures or skills per year that this logbook could be
 * held against, and no figure is written here that cannot be cited to the
 * council's own document. A builder who can cite one adds a row with its
 * source; the desk prints the list as it stands.
 */
export const clinicalRequirementSchema = z.object({
  /** INC | NMC | DCI | PCI: whose figure it is. */
  regulator: z.string(),
  /** The programme code the figure is for (BSCN, MBBS, BDS, BPHARM…), as the college names it. */
  programmeCode: z.string(),
  kind: logbookKindSchema,
  minimumPerYear: z.number().int().min(1),
  source: z.string(),
});
export type ClinicalRequirement = z.infer<typeof clinicalRequirementSchema>;
export const CLINICAL_REQUIREMENTS: readonly ClinicalRequirement[] = [];

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const text = (max: number) => z.string().trim().max(max);

/* ---------------------------------------------------------------- writes */

/** POST /api/v1/duties/clinical/sites — a site added or corrected (the coordinator or the office). */
export const clinicalSiteSaveSchema = z.object({
  id: cuid.optional(),
  name: text(160).min(2),
  kind: clinicalSiteKindSchema,
  address: text(300),
  /** Every day a write carries is a day on the calendar (TA-382). */
  agreementFrom: realDateKey.nullable(),
  agreementTo: realDateKey.nullable(),
  contactRole: clinicalContactRoleSchema,
});
export type ClinicalSiteSave = z.infer<typeof clinicalSiteSaveSchema>;

/** POST /api/v1/duties/clinical/departments — a ward or department of a site, with its beds (or chairs) when counted. */
export const clinicalDepartmentSaveSchema = z.object({
  id: cuid.optional(),
  siteId: cuid,
  name: text(120).min(2),
  beds: z.number().int().min(0).max(5000).nullable(),
});
export type ClinicalDepartmentSave = z.infer<typeof clinicalDepartmentSaveSchema>;

/** POST /api/v1/duties/clinical/postings — a division (or one of its lab batches) posted to a department for a span of days under a supervisor, in a rotation's order. */
export const clinicalPostingSaveSchema = z.object({
  id: cuid.optional(),
  departmentId: cuid,
  divisionId: cuid,
  labBatchId: cuid.nullable(),
  supervisorMembershipId: cuid,
  from: realDateKey,
  to: realDateKey,
  rotationOrder: z.number().int().min(1).max(99),
});
export type ClinicalPostingSave = z.infer<typeof clinicalPostingSaveSchema>;

/** The client id a student's device mints for an entry, so a replay from the outbox writes one row. */
export const logbookClientIdSchema = z.string().trim().min(8).max(64);

/** POST /api/v1/family/clinical/logbook — a student's new entry, or a DRAFT or RETURNED one corrected (`id`); idempotent by `clientId`. */
export const logbookEntrySaveSchema = z.object({
  id: cuid.optional(),
  clientId: logbookClientIdSchema,
  postingId: cuid,
  on: realDateKey,
  kind: logbookKindSchema,
  count: z.number().int().min(1).max(500),
  note: text(1000),
});
export type LogbookEntrySave = z.infer<typeof logbookEntrySaveSchema>;

/** POST …/logbook/{entryId}/sign — the supervisor's remark may be empty; …/return — a returned entry needs a reason. */
export const logbookSignSchema = z.object({ remark: text(400) });
export const logbookReturnSchema = z.object({ remark: text(400).min(3) });
export type LogbookDecision = z.infer<typeof logbookSignSchema>;

/* ----------------------------------------------------------------- reads */

export const clinicalSiteSchema = z.object({
  id: cuid,
  name: z.string(),
  kind: clinicalSiteKindSchema,
  address: z.string(),
  agreementFrom: dateKey.nullable(),
  agreementTo: dateKey.nullable(),
  /** The agreement has run out, or none is recorded: the desk says so beside the site. */
  agreementLapsed: z.boolean(),
  contactRole: clinicalContactRoleSchema,
  departments: z.array(z.object({ id: cuid, name: z.string(), beds: z.number().int().nullable(), postings: z.number().int() })),
});
export type ClinicalSite = z.infer<typeof clinicalSiteSchema>;

/** One student of a posting with their logbook counts, from the rows on read. */
export const clinicalPostingStudentSchema = z.object({
  membershipId: cuid,
  name: z.string(),
  rollNumber: z.number().int().nullable(),
  signed: z.number().int(),
  waiting: z.number().int(),
  returned: z.number().int(),
  draft: z.number().int(),
});

export const clinicalPostingSchema = z.object({
  id: cuid,
  siteId: cuid,
  siteName: z.string(),
  departmentId: cuid,
  departmentName: z.string(),
  divisionId: cuid,
  divisionName: z.string(),
  programmeCode: z.string(),
  labBatchId: cuid.nullable(),
  batchName: z.string().nullable(),
  supervisorMembershipId: cuid,
  supervisorName: z.string(),
  from: dateKey,
  to: dateKey,
  rotationOrder: z.number().int(),
  /** Today falls in the span. */
  current: z.boolean(),
  students: z.array(clinicalPostingStudentSchema),
});
export type ClinicalPosting = z.infer<typeof clinicalPostingSchema>;

/** An entry waiting for a signature, as the queue lists it. */
export const logbookQueueRowSchema = z.object({
  id: cuid,
  postingId: cuid,
  studentMembershipId: cuid,
  studentName: z.string(),
  departmentName: z.string(),
  siteName: z.string(),
  on: dateKey,
  kind: logbookKindSchema,
  count: z.number().int(),
  note: z.string(),
  submittedAt: iso.nullable(),
  /** The reader may sign or return it: the posting's supervisor, or a holder of the duty. */
  canSign: z.boolean(),
});
export type LogbookQueueRow = z.infer<typeof logbookQueueRowSchema>;

/** GET /api/v1/duties/clinical — the coordinator's desk; `offered` false at a college with neither clinical stream. */
export const clinicalDeskSchema = z.object({
  offered: z.boolean(),
  /** Sites and departments: the coordinator or the office. */
  canManage: z.boolean(),
  /** Postings: the coordinator alone. */
  canPost: z.boolean(),
  today: dateKey,
  sites: z.array(clinicalSiteSchema),
  /** Today's postings first, then the rest by rotation and start. */
  postings: z.array(clinicalPostingSchema),
  /** Every SUBMITTED entry of the college, oldest first. */
  queue: z.array(logbookQueueRowSchema),
  /** The divisions (with their lab batches) a posting may name: the clinical programmes' seats. */
  divisions: z.array(z.object({ id: cuid, name: z.string(), programmeCode: z.string(), students: z.number().int(), batches: z.array(z.object({ id: cuid, name: z.string() })) })),
  /** The teachers a posting may name as supervisor. */
  supervisors: z.array(z.object({ membershipId: cuid, name: z.string() })),
  requirements: z.array(clinicalRequirementSchema),
  summary: z.object({ sites: z.number().int(), postings: z.number().int(), current: z.number().int(), students: z.number().int(), entries: z.number().int(), signed: z.number().int(), waiting: z.number().int() }),
});
export type ClinicalDesk = z.infer<typeof clinicalDeskSchema>;

/** GET /api/v1/duties/clinical/supervising — a faculty member's own postings and the entries waiting for their signature. */
export const clinicalSupervisionSchema = z.object({
  offered: z.boolean(),
  today: dateKey,
  postings: z.array(clinicalPostingSchema),
  queue: z.array(logbookQueueRowSchema),
});
export type ClinicalSupervision = z.infer<typeof clinicalSupervisionSchema>;

/** A student's own entry. */
export const logbookEntrySchema = z.object({
  id: cuid,
  clientId: z.string(),
  postingId: cuid,
  departmentName: z.string(),
  siteName: z.string(),
  on: dateKey,
  kind: logbookKindSchema,
  count: z.number().int(),
  note: z.string(),
  state: logbookStateSchema,
  submittedAt: iso.nullable(),
  signedAt: iso.nullable(),
  signedByName: z.string().nullable(),
  remark: z.string(),
});
export type LogbookEntry = z.infer<typeof logbookEntrySchema>;

/** GET /api/v1/family/clinical — the student's postings (current first) and their whole logbook, newest first. */
export const familyClinicalSchema = z.object({
  offered: z.boolean(),
  today: dateKey,
  postings: z.array(clinicalPostingSchema.omit({ students: true })),
  entries: z.array(logbookEntrySchema),
  summary: z.object({ signed: z.number().int(), waiting: z.number().int(), returned: z.number().int(), draft: z.number().int() }),
});
export type FamilyClinical = z.infer<typeof familyClinicalSchema>;

/** The six words of a logbook row, for a sentence or a chip. */
export function logbookStateTone(state: LogbookState): "ok" | "warn" | "danger" | "neutral" {
  if (state === "SIGNED") return "ok";
  if (state === "SUBMITTED") return "warn";
  if (state === "RETURNED") return "danger";
  return "neutral";
}
