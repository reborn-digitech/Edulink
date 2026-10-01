import { z } from "zod";

/**
 * The teacher's and the head's second wave (2026-10-01): a cover answered,
 * lesson plans kept as templates, a class read as numbers, the head's
 * notes on a member of staff, and the school read across terms and years.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const count = z.number().int().min(0);
const percent = z.number().min(0).max(100);

/* -------------------------------------------------------------------------- */
/* Covers: acknowledged or declined                                            */
/* -------------------------------------------------------------------------- */

/** POST /api/v1/teaching/covers/{id}/decline — why the covering teacher cannot take it; the office reassigns. */
export const coverDeclineSchema = z.object({ reason: z.string().trim().min(1).max(300) });
/** Both answers: `changed` is false when the cover already stood as asked (the sweep's second run). */
export const coverAnsweredSchema = z.object({ changed: z.boolean(), state: z.enum(["ACKNOWLEDGED", "DECLINED"]) });
export type CoverAnswered = z.infer<typeof coverAnsweredSchema>;

/* -------------------------------------------------------------------------- */
/* Lesson plan templates                                                       */
/* -------------------------------------------------------------------------- */

export const planTemplateSchema = z.object({
  id: z.string(),
  subject: z.string(),
  grade: z.string().nullable(),
  title: z.string(),
  topic: z.string(),
  notes: z.string(),
  homework: z.string(),
  authorName: z.string(),
  /** The caller wrote it: theirs to remove. */
  own: z.boolean(),
  createdAt: iso,
});
export type PlanTemplate = z.infer<typeof planTemplateSchema>;

/** GET /api/v1/teaching/plan-templates?subject= — the caller's own first, then the rest of the school's. */
export const planTemplatesQuerySchema = z.object({ subject: z.string().trim().min(1).max(60).optional() });
export const planTemplatesSchema = z.object({ items: z.array(planTemplateSchema) });
export type PlanTemplates = z.infer<typeof planTemplatesSchema>;

/** POST /api/v1/teaching/plan-templates — keep a lesson plan of a class the caller teaches as a template; the title defaults to the plan's topic. */
export const planTemplateSaveSchema = z.object({ lessonId: cuid, title: z.string().trim().min(1).max(160).optional() });
export const planTemplateSavedSchema = z.object({ id: z.string() });

/** POST /api/v1/teaching/plan-templates/{id}/apply — copy the template into a new plan for a class (and a chapter, a day); never a link. */
export const planTemplateApplySchema = z.object({ classId: cuid, unitId: cuid.nullable().optional(), dateKey: dateKey.optional() });
export const planTemplateAppliedSchema = z.object({ lessonId: z.string() });

/* -------------------------------------------------------------------------- */
/* Class analytics                                                             */
/* -------------------------------------------------------------------------- */

export const ANALYTICS_WINDOWS = ["term", "month"] as const;
export const analyticsWindowSchema = z.enum(ANALYTICS_WINDOWS);
export type AnalyticsWindow = z.infer<typeof analyticsWindowSchema>;

/** GET /api/v1/teaching/classes/{classId}/analytics?window=term|month */
export const classAnalyticsQuerySchema = z.object({ window: analyticsWindowSchema.default("term") });

export const CLASS_FLAGS = ["ATTENDANCE", "MARKS_FALLING", "LATE_WORK"] as const;
export const classFlagSchema = z.enum(CLASS_FLAGS);
export type ClassFlag = z.infer<typeof classFlagSchema>;

export const classExamPointSchema = z.object({
  seriesId: z.string(),
  name: z.string(),
  /** UNIT_TEST | MID_TERM | FINAL */
  kind: z.string(),
  /** The first paper's day, for the order. */
  dateKey: dateKey.nullable(),
  /** Pupils with at least one paper marked. */
  marked: count,
  averagePercent: percent.nullable(),
  /** How many pupils fell in each quarter of the scale: under 33, 33–49, 50–74, 75 and over. */
  distribution: z.object({ under33: count, from33: count, from50: count, from75: count }),
});

export const classAnalyticsSchema = z.object({
  classId: z.string(),
  className: z.string(),
  window: analyticsWindowSchema,
  fromDateKey: dateKey,
  toDateKey: dateKey,
  /** What the window turned out to be: the term's name, or the last thirty days. */
  windowName: z.string().nullable(),
  pupils: count,
  attendance: z.object({
    /** Present and late over every mark in the window; null with no register. */
    percent: percent.nullable(),
    marks: count,
    registers: count,
    /** Week by week, oldest first, each named by the day it ends on. */
    trend: z.array(z.object({ label: z.string(), percent: percent.nullable(), marks: count })),
  }),
  exams: z.array(classExamPointSchema),
  work: z.object({
    assignments: count,
    /** Hand-ins expected: assignments × pupils on the roll. */
    expected: count,
    submitted: count,
    late: count,
    missing: count,
    completionPercent: percent.nullable(),
  }),
  flagged: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      flags: z.array(classFlagSchema),
      attendancePercent: percent.nullable(),
      /** The last three exam percents, oldest first, when marks are falling. */
      recentPercents: z.array(percent),
      lateHandIns: count,
    }),
  ),
});
export type ClassAnalytics = z.infer<typeof classAnalyticsSchema>;

/* -------------------------------------------------------------------------- */
/* Staff appraisal and observations                                            */
/* -------------------------------------------------------------------------- */

export const APPRAISAL_KINDS = ["OBSERVATION", "TARGET", "APPRAISAL"] as const;
export const appraisalKindSchema = z.enum(APPRAISAL_KINDS);
export type AppraisalKind = z.infer<typeof appraisalKindSchema>;

export const appraisalEntrySchema = z.object({
  id: z.string(),
  staffMembershipId: z.string(),
  year: z.string(),
  kind: appraisalKindSchema,
  dateKey,
  summary: z.string(),
  strengths: z.string().nullable(),
  targets: z.string().nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  visibleToStaff: z.boolean(),
  appraiserName: z.string(),
  updatedAt: iso,
});
export type AppraisalEntry = z.infer<typeof appraisalEntrySchema>;

/** GET /api/v1/principal/staff/{membershipId}/appraisals — the timeline, newest first; the head writes, the office reads. */
export const appraisalsSchema = z.object({
  staffMembershipId: z.string(),
  name: z.string(),
  role: z.string(),
  /** The current academic year's name, what a new entry is filed under. */
  year: z.string().nullable(),
  canEdit: z.boolean(),
  items: z.array(appraisalEntrySchema),
});
export type Appraisals = z.infer<typeof appraisalsSchema>;

/** POST /api/v1/principal/staff/{membershipId}/appraisals and PUT /api/v1/principal/appraisals/{id}. */
export const appraisalSaveSchema = z.object({
  kind: appraisalKindSchema,
  dateKey,
  summary: z.string().trim().min(1).max(4000),
  strengths: z.string().trim().max(4000).nullable().optional(),
  targets: z.string().trim().max(4000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  visibleToStaff: z.boolean().optional(),
});
export type AppraisalSave = z.infer<typeof appraisalSaveSchema>;
export const appraisalSavedSchema = z.object({ id: z.string() });

/** GET /api/v1/staff/me/appraisals — what the head has shown me, newest first. */
export const myAppraisalsSchema = z.object({ items: z.array(appraisalEntrySchema) });

/* -------------------------------------------------------------------------- */
/* Longitudinal trends                                                         */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/principal/trends?years=1..3 — this year and the ones before it. */
export const trendsQuerySchema = z.object({ years: z.coerce.number().int().min(1).max(3).default(2) });

export const trendTermSchema = z.object({
  termId: z.string(),
  yearName: z.string(),
  termName: z.string(),
  fromDateKey: dateKey,
  toDateKey: dateKey,
  attendancePercent: percent.nullable(),
  /** Mean of every marked paper's percent, and the pupils whose term mean cleared the school's pass line. */
  examAveragePercent: percent.nullable(),
  passPercent: percent.nullable(),
  pupilsWithMarks: count,
  bySubject: z.array(z.object({ subject: z.string(), averagePercent: percent, papers: count })),
  byTeacher: z.array(z.object({ membershipId: z.string(), name: z.string(), averagePercent: percent, papers: count })),
  /** Collected over demanded, for fee demands due in the term; null with no demand. */
  feeCollectionPercent: percent.nullable(),
  incidents: count,
});
export type TrendTerm = z.infer<typeof trendTermSchema>;

/** The same grade in two years: this year's cohort against last year's at the same grade. */
export const cohortComparisonSchema = z.object({
  gradeLevel: z.string(),
  thisYear: z.object({ yearName: z.string(), attendancePercent: percent.nullable(), examAveragePercent: percent.nullable(), pupils: count }),
  lastYear: z.object({ yearName: z.string(), attendancePercent: percent.nullable(), examAveragePercent: percent.nullable(), pupils: count }).nullable(),
});

export const trendsSchema = z.object({
  years: z.array(z.object({ id: z.string(), name: z.string(), fromDateKey: dateKey, toDateKey: dateKey, current: z.boolean() })),
  /** The pass line the school's report-card bands imply, in percent. */
  passLinePercent: percent,
  terms: z.array(trendTermSchema),
  cohorts: z.array(cohortComparisonSchema),
});
export type Trends = z.infer<typeof trendsSchema>;
