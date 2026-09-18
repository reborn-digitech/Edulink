import { z } from "zod";

/**
 * The sick-room and incident log. A teacher records what happened to a
 * pupil and what was done; the family is told at once; the office follows
 * up in notes and closes it. The record itself is never edited.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();

export const INCIDENT_KINDS = ["INJURY", "ILLNESS", "BEHAVIOUR", "SAFEGUARDING", "OTHER"] as const;
export const INCIDENT_SEVERITIES = ["MINOR", "MODERATE", "SERIOUS"] as const;
export const incidentKindSchema = z.enum(INCIDENT_KINDS);
export const incidentSeveritySchema = z.enum(INCIDENT_SEVERITIES);
export type IncidentKind = z.infer<typeof incidentKindSchema>;
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;

/** What a teacher or the office records. `occurredAt` defaults to now on the server when omitted. */
export const incidentCreateSchema = z.object({
  studentMembershipId: cuid,
  kind: incidentKindSchema,
  severity: incidentSeveritySchema.default("MINOR"),
  occurredAt: iso.optional(),
  place: z.string().trim().max(80).default(""),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  actionTaken: z.string().trim().max(2000).default(""),
  /** Tell the guardians now, by push and text. On by default; off for a behaviour note the head wants to raise in person. */
  notifyGuardians: z.boolean().default(true),
});
export type IncidentCreate = z.infer<typeof incidentCreateSchema>;

export const incidentNoteCreateSchema = z.object({ body: z.string().trim().min(1).max(2000) });

export const incidentNoteSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  body: z.string(),
  createdAt: iso,
});

export const incidentSchema = z.object({
  id: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  reportedByName: z.string(),
  kind: incidentKindSchema,
  severity: incidentSeveritySchema,
  occurredAt: iso,
  place: z.string(),
  title: z.string(),
  body: z.string(),
  actionTaken: z.string(),
  guardiansNotifiedAt: iso.nullable(),
  status: z.enum(["OPEN", "CLOSED"]),
  closedAt: iso.nullable(),
  closedByName: z.string().nullable(),
  notes: z.array(incidentNoteSchema),
  /** Whether this viewer may add a note (staff) and close it (the office and the head). */
  canNote: z.boolean(),
  canClose: z.boolean(),
});
export type IncidentView = z.infer<typeof incidentSchema>;

/** A row of a list: the incident without its notes and body. */
export const incidentRowSchema = incidentSchema.omit({ notes: true, body: true, actionTaken: true, canNote: true, canClose: true }).extend({ noteCount: z.number().int() });
export type IncidentRow = z.infer<typeof incidentRowSchema>;

/** GET /api/v1/staff/incidents — the office and the head see the school's; a teacher their own pupils'. */
export const incidentsQuerySchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "ALL"]).default("OPEN"),
  studentMembershipId: cuid.optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export const incidentsListSchema = z.object({
  rows: z.array(incidentRowSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  openCount: z.number().int(),
});

/** GET /api/v1/family/incidents?childId= — a child's incidents, read-only for the guardian. */
export const familyIncidentsQuerySchema = z.object({ childId: cuid.optional() });
export const familyIncidentsSchema = z.object({
  childName: z.string(),
  incidents: z.array(incidentSchema),
});
