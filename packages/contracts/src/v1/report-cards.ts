import { z } from "zod";

/**
 * The configurable report card: the school's grading scale (a board's
 * bands), the co-scholastic areas and their own scale, the weight of each
 * exam kind inside a term and of each term inside the year, and the printed
 * layout. A card snapshots the scale and layout it was built with.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const count = z.number().int().min(0);
const percent = z.number().min(0).max(100);
const label = z.string().trim().min(1).max(12);

/** One band of the scale: everything from `minPercent` up to the next band. */
export const gradeBandSchema = z.object({
  label,
  minPercent: percent,
  /** Grade points, for a CGPA-style scale; null on a scale that has none. */
  points: z.number().min(0).max(10).nullable(),
  descriptor: z.string().trim().max(60).nullable(),
});
export type GradeBand = z.infer<typeof gradeBandSchema>;

/** One grade on the co-scholastic scale, e.g. A · Outstanding. */
export const coScholasticGradeSchema = z.object({ label, descriptor: z.string().trim().max(60).nullable() });

export const examKindWeightsSchema = z.object({ UNIT_TEST: percent, MID_TERM: percent, FINAL: percent });
export type ExamKindWeights = z.infer<typeof examKindWeightsSchema>;

export const reportCardLayoutSchema = z.object({
  showAttendance: z.boolean(),
  showPractice: z.boolean(),
  showCoScholastic: z.boolean(),
  showGradePoints: z.boolean(),
  showAddress: z.boolean(),
  showSignatures: z.boolean(),
  showRemark: z.boolean(),
  /** Tint the letterhead with the school's brand colour. */
  useBrandColour: z.boolean(),
  signatureLeft: z.string().trim().max(40),
  signatureRight: z.string().trim().max(40),
  /** A line under the school's name: the board, the affiliation number. */
  headerNote: z.string().trim().max(160).nullable(),
  footerNote: z.string().trim().max(240).nullable(),
  paper: z.enum(["A4", "LETTER"]),
});
export type ReportCardLayout = z.infer<typeof reportCardLayoutSchema>;

/** The whole document the office edits; POST /api/v1/office/report-card-config takes exactly this. */
export const reportCardConfigSchema = z.object({
  /** Which preset the bands came from, or "custom" once edited. */
  preset: z.string().trim().max(20),
  /** The scholastic scale, highest band first. Empty means percentages only, no letters. */
  bands: z.array(gradeBandSchema).max(12),
  coScholastic: z.object({
    areas: z.array(z.string().trim().min(1).max(40)).max(20),
    scale: z.array(coScholasticGradeSchema).max(8),
  }),
  /** How the kinds of exam combine inside a term; renormalised over the kinds a subject actually has. All zero: marks over maximum. */
  kindWeights: examKindWeightsSchema,
  layout: reportCardLayoutSchema,
});
export type ReportCardConfig = z.infer<typeof reportCardConfigSchema>;

/** GET /api/v1/office/report-card-config — the document plus the presets to pick from and the year's terms with their weights. */
export const reportCardConfigViewSchema = reportCardConfigSchema.extend({
  presets: z.array(z.object({ key: z.string(), name: z.string(), bands: z.array(gradeBandSchema) })),
  terms: z.array(z.object({ id: z.string(), name: z.string(), weightPercent: z.number().int().nullable() })),
});
export type ReportCardConfigView = z.infer<typeof reportCardConfigViewSchema>;

/** POST /api/v1/office/terms/{termId}/weight — the term's share of the annual card; null clears it. */
export const termWeightSchema = z.object({ weightPercent: z.number().int().min(0).max(100).nullable() });

/** POST /api/v1/teaching/classes/{classId}/report-cards/co-scholastic — the class teacher's grades on one draft card. */
export const coScholasticSaveSchema = z.object({
  cardId: cuid,
  grades: z
    .array(z.object({ area: z.string().trim().min(1).max(40), grade: label.nullable(), note: z.string().trim().max(200).optional() }))
    .max(20),
});

/**
 * A subject row on a card: its percent (one decimal, as printed), band and the
 * parts that made it, plus the marks and maximum its marked papers contributed.
 * On an "exams" card the overall is the sum of every row's `scoreMilli` over
 * the sum of its `pointsMilli` — the figure a parent reproduces from the rows —
 * so the two never disagree. Optional: a card built before they were kept
 * still parses.
 */
export const cardSubjectSchema = z.object({
  subject: z.string(),
  percent: z.number().nullable(),
  letter: z.string().nullable(),
  points: z.number().nullable(),
  /** Marks the subject's marked papers scored, totalled; null on an annual card, whose rows are terms. */
  scoreMilli: z.number().int().nullable().optional(),
  /** The maximum those same papers carried, totalled. */
  pointsMilli: z.number().int().nullable().optional(),
  parts: z.array(
    z.object({
      /** The paper's series on a term card; the term on an annual card. */
      label: z.string(),
      kind: z.string(),
      scoreMilli: z.number().int().nullable(),
      pointsMilli: z.number().int().nullable(),
      percent: z.number().nullable(),
      /** The share this part carried in the subject's percent, 0–100; null when marks over maximum. */
      weight: z.number().nullable(),
    }),
  ),
});
export type CardSubject = z.infer<typeof cardSubjectSchema>;

export const cardCoScholasticSchema = z.object({ area: z.string(), grade: z.string().nullable(), note: z.string().nullable() });
export type CardCoScholastic = z.infer<typeof cardCoScholasticSchema>;

/** The extra fields a configurable card carries; every one optional so an older reader still parses. */
export const cardExtrasSchema = z.object({
  subjects: z.array(cardSubjectSchema).optional(),
  overallLetter: z.string().nullable().optional(),
  gradePoints: z.number().nullable().optional(),
  coScholastic: z.array(cardCoScholasticSchema).optional(),
  scale: z.object({ bands: z.array(gradeBandSchema), coScale: z.array(coScholasticGradeSchema) }).optional(),
  layout: reportCardLayoutSchema.optional(),
  /** "TERM" when built from one term, "YEAR" from the whole year, "PAPERS" from hand-picked papers. */
  scope: z.enum(["TERM", "YEAR", "PAPERS"]).optional(),
  pdfPath: z.string().optional(),
});

export const teachingCardsBundleQuerySchema = z.object({ title: z.string().trim().min(1).max(120) });
export const cardsCountSchema = z.object({ count: count });
