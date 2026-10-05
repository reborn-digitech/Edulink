import { z } from "zod";
import { teachingAttachmentSchema, teachingGradebookSchema, teachingGradesBodySchema, teachingGradesSavedSchema } from "./teaching";

/**
 * HOMEWORK AT A COLLEGE (R-48 / A3-inventory-6, the risks batch of
 * 5 October 2026). A piece of work set to one course offering rather than a
 * class: set and published by the offering's faculty member or the HOD of its
 * department, for the offering's REGISTERED students. It is the school's
 * Assignment row with `offeringId` instead of `classId`, so the hand-in, the
 * photographs of it and the marks are the school's own doors and tables; the
 * student reads it in their ordinary work list (/api/v1/family/student/assignments)
 * and hands it in through /api/v1/family/student/submissions. What is new is
 * the teacher's side, under /api/v1/academics, and posting the marks into one
 * of the offering's internal components (through the internal marks' one
 * writer, saveInternalMarks).
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const isoDate = z.string().datetime();
const count = z.number().int();

/** One piece of work in a list, with how far its marking has got. */
export const collegeWorkRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string().nullable(),
  pointsMilli: count.nullable(),
  dueAt: isoDate.nullable(),
  publishedAt: isoDate.nullable(),
  /** Handed in, and marked, of `registered`. */
  submitted: count,
  graded: count,
  registered: count,
});
export type CollegeWorkRow = z.infer<typeof collegeWorkRowSchema>;

/** GET /api/v1/academics/work — the offerings the caller teaches (an HOD: their department's too), each with its work. */
export const collegeWorkHomeSchema = z.object({
  offerings: z.array(
    z.object({
      offeringId: z.string(),
      courseCode: z.string(),
      courseName: z.string(),
      termName: z.string(),
      /** The division's name, or null for an elective shared across divisions. */
      divisionName: z.string().nullable(),
      registered: count,
      /** True when the caller teaches it; false for an HOD's department offering taught by a colleague. */
      mine: z.boolean(),
      work: count,
      toMark: count,
    }),
  ),
});
export type CollegeWorkHome = z.infer<typeof collegeWorkHomeSchema>;

/** GET /api/v1/academics/offerings/{offeringId}/work — one offering's work, and the internal components marks may be posted into. */
export const collegeOfferingWorkSchema = z.object({
  offeringId: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  termName: z.string(),
  divisionName: z.string().nullable(),
  registered: count,
  items: z.array(collegeWorkRowSchema),
  /** The offering's internal components still open to marks (not released, the offering not locked). */
  components: z.array(z.object({ id: z.string(), name: z.string(), maxMarks: count })),
  locked: z.boolean(),
});
export type CollegeOfferingWork = z.infer<typeof collegeOfferingWorkSchema>;

/**
 * POST /api/v1/academics/offerings/{offeringId}/work — set a piece of work.
 * Handouts are files the caller uploaded through POST /api/v1/uploads, named
 * by the id that came back (the upload ticket), as on the school's door.
 */
export const collegeWorkSaveSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(20_000).default(""),
  category: z.string().trim().max(60).optional(),
  points: z.number().min(0).max(10_000).optional(),
  dueAt: isoDate.optional(),
  publish: z.boolean().default(true),
  /** The teacher means a due date that has already passed; without it such a date is refused, 422 on dueAt. */
  confirmPastDue: z.boolean().optional(),
  handouts: z
    .array(z.object({ fileId: z.string().min(1).max(200), name: z.string().trim().min(1).max(200) }))
    .max(5)
    .default([]),
});
export type CollegeWorkSave = z.infer<typeof collegeWorkSaveSchema>;
export const collegeWorkCreatedSchema = z.object({ assignmentId: z.string(), notified: count, handouts: count });

/** GET /api/v1/academics/work/{assignmentId} — one piece of work's marking sheet: the offering's registered students, what each handed in, their marks. */
export const collegeWorkGradebookSchema = z.object({
  assignment: z.object({
    id: z.string(),
    offeringId: z.string(),
    title: z.string(),
    body: z.string(),
    category: z.string().nullable(),
    pointsMilli: count.nullable(),
    dueAt: isoDate.nullable(),
    publishedAt: isoDate.nullable(),
    /** The course's code and name. */
    label: z.string(),
    attachments: z.array(teachingAttachmentSchema),
  }),
  /** The school's marking rows and figures, so the phone's marking card serves both (teaching.ts). */
  rows: teachingGradebookSchema.shape.rows,
  stats: teachingGradebookSchema.shape.stats,
  components: z.array(z.object({ id: z.string(), name: z.string(), maxMarks: count })),
  locked: z.boolean(),
});
export type CollegeWorkGradebook = z.infer<typeof collegeWorkGradebookSchema>;

/** POST /api/v1/academics/work/{assignmentId}/grades — the school's marks body, as a batch, replay-safe. */
export const collegeWorkGradesSchema = teachingGradesBodySchema;
export const collegeWorkGradesSavedSchema = teachingGradesSavedSchema;

/** POST /api/v1/academics/work/{assignmentId}/publish — publish a draft; the registered students are told. */
export const collegeWorkPublishedSchema = z.object({ ok: z.literal(true) });

/**
 * POST /api/v1/academics/work/{assignmentId}/internal — post this work's marks
 * into one of the offering's internal components, scaled from the work's
 * points to the component's maximum (to a tenth of a mark). Only marked
 * students are posted; the rest keep what the component holds. A change takes
 * the component's countersign away, as any change of its marks does.
 */
export const collegeWorkPostSchema = z.object({ componentId: cuid });
export const collegeWorkPostedSchema = z.object({ posted: count, notMarked: count, componentId: z.string() });
