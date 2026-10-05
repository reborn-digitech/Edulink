import { z } from "zod";

/**
 * THE PEER-TEAM VISIT FILE (the risks batch, R-2, 5 October 2026): what a
 * college has open on the table when NAAC's peer team or NBA's expert team
 * comes — the visit's schedule, the evidence index (each criterion or metric
 * and what answers it) and the SAR pack (the filings the visit reads, with
 * their state and hash) — in one place, for the IQAC, an HOD and the
 * principal. The pack is read from the filings each time; the file stores
 * only the schedule and the evidence lines.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const text = (max: number) => z.string().trim().max(max);

export const PEER_FRAMEWORKS = ["NAAC", "NBA"] as const;
export const peerFrameworkSchema = z.enum(PEER_FRAMEWORKS);
export type PeerFramework = z.infer<typeof peerFrameworkSchema>;
export const VISIT_STATUSES = ["PLANNED", "DONE"] as const;
export const visitStatusSchema = z.enum(VISIT_STATUSES);
export type VisitStatus = z.infer<typeof visitStatusSchema>;
export const EVIDENCE_LINK_KINDS = ["FILING", "FILE", "METRIC", "WORKSHEET", "LINK", "NOTE"] as const;
export const evidenceLinkKindSchema = z.enum(EVIDENCE_LINK_KINDS);
export type EvidenceLinkKind = z.infer<typeof evidenceLinkKindSchema>;
/** A visit lasts at most this many days; the schedule's days fall inside it. */
export const VISIT_MAX_DAYS = 7;
export const VISIT_ITEMS_MAX = 400;

/** NAAC's seven criteria, and NBA Tier-II's ten: the evidence index counts its lines by these. */
export const VISIT_NAAC_CRITERIA = ["1", "2", "3", "4", "5", "6", "7"] as const;
export const VISIT_NBA_CRITERIA = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
/** The criterion a code belongs to: "3.2.1" → "3", "C4" → "4". */
export function criterionOf(code: string): string {
  const m = /^[Cc]?(\d{1,2})/.exec(code.trim());
  return m ? String(Number(m[1])) : "";
}

export const visitSaveSchema = z.object({
  framework: peerFrameworkSchema,
  cycleId: cuid.nullable().optional(),
  departmentId: cuid.nullable().optional(),
  year: z.number().int().min(2000).max(2100),
  title: text(160).min(2),
  fromDate: dateKey,
  toDate: dateKey,
  team: z.array(z.object({ name: text(120).min(2), role: text(80).default("") })).max(20).default([]),
});
export type VisitSave = z.infer<typeof visitSaveSchema>;
export const visitUpdateSchema = z.object({
  title: text(160).min(2).optional(),
  fromDate: dateKey.optional(),
  toDate: dateKey.optional(),
  team: z.array(z.object({ name: text(120).min(2), role: text(80).default("") })).max(20).optional(),
  status: visitStatusSchema.optional(),
});
export type VisitUpdate = z.infer<typeof visitUpdateSchema>;

export const scheduleItemSaveSchema = z.object({
  kind: z.literal("SCHEDULE"),
  dayKey: dateKey,
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  activity: text(200).min(2),
  venue: text(120).default(""),
  ownerName: text(120).default(""),
});
export const evidenceItemSaveSchema = z.object({
  kind: z.literal("EVIDENCE"),
  /** A metric's code ("3.2.1") or an NBA item ("4.5"); the criterion is read from it. */
  criterion: text(20).regex(/^[Cc]?\d{1,2}(\.\d{1,2}){0,3}$/, "criterion"),
  title: text(200).min(2),
  linkKind: evidenceLinkKindSchema,
  /** A CollegeFiling id (FILING), an IQAC file's id (FILE), a metric code (METRIC); for WORKSHEET the visit's own. */
  linkId: text(80).nullable().optional(),
  /** LINK only: an https address. */
  url: z.string().trim().url().max(500).nullable().optional(),
  note: text(1000).default(""),
});
export const visitItemSaveSchema = z.discriminatedUnion("kind", [scheduleItemSaveSchema, evidenceItemSaveSchema]);
export type VisitItemSave = z.infer<typeof visitItemSaveSchema>;

export const visitItemViewSchema = z.object({
  id: z.string(),
  kind: z.enum(["SCHEDULE", "EVIDENCE"]),
  dayKey: z.string().nullable(),
  startMinute: z.number().int().nullable(),
  endMinute: z.number().int().nullable(),
  activity: z.string(),
  venue: z.string(),
  ownerName: z.string(),
  criterion: z.string(),
  title: z.string(),
  linkKind: evidenceLinkKindSchema.nullable(),
  linkId: z.string().nullable(),
  url: z.string().nullable(),
  note: z.string(),
  /** What the link stands for today: OK, or MISSING when the filing, file or metric is gone. */
  resolved: z.object({ ok: z.boolean(), label: z.string(), href: z.string().nullable() }).nullable(),
});
export type VisitItemView = z.infer<typeof visitItemViewSchema>;

export const visitSummarySchema = z.object({
  id: z.string(),
  framework: peerFrameworkSchema,
  title: z.string(),
  year: z.number().int(),
  fromDate: z.string(),
  toDate: z.string(),
  status: visitStatusSchema,
  departmentId: z.string().nullable(),
  departmentName: z.string().nullable(),
  cycleId: z.string().nullable(),
  scheduleCount: z.number().int(),
  evidenceCount: z.number().int(),
  canEdit: z.boolean(),
});
export type VisitSummary = z.infer<typeof visitSummarySchema>;

export const visitListSchema = z.object({
  visits: z.array(visitSummarySchema),
  canCreateNaac: z.boolean(),
  /** The engineering departments the reader may file an NBA visit for (an HOD: their own). */
  nbaDepartments: z.array(z.object({ id: z.string(), name: z.string() })),
  cycles: z.array(z.object({ id: z.string(), label: z.string() })),
});
export type VisitList = z.infer<typeof visitListSchema>;

export const packFilingSchema = z.object({
  id: z.string(),
  kind: z.string(),
  year: z.number().int(),
  status: z.string(),
  hash: z.string(),
  generatedAt: iso,
  href: z.string(),
});
export const visitDetailSchema = visitSummarySchema.extend({
  team: z.array(z.object({ name: z.string(), role: z.string() })),
  schedule: z.array(visitItemViewSchema),
  evidence: z.array(visitItemViewSchema),
  pack: z.object({
    filings: z.array(packFilingSchema),
    /** What the framework's pack would hold that the college has not generated: filing kinds. */
    missing: z.array(z.string()),
    /** NAAC: the cycle's CGPA as last computed; NBA: the SAR's marks as drafted. */
    figure: z.number().nullable(),
    /** Evidence lines per criterion, every criterion of the framework listed. */
    coverage: z.array(z.object({ criterion: z.string(), lines: z.number().int(), missing: z.number().int() })),
  }),
  /** What an evidence line may point at: the college's filings and IQAC files. */
  options: z.object({
    filings: z.array(z.object({ id: z.string(), label: z.string() })),
    files: z.array(z.object({ id: z.string(), label: z.string() })),
  }),
});
export type VisitDetail = z.infer<typeof visitDetailSchema>;
