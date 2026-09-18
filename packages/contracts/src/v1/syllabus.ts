import { z } from "zod";

/**
 * Syllabus coverage: the office's chapter list per grade and subject, a
 * class's progress through it, the lessons a teacher plans and marks
 * taught, and the coverage percent the head reads.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const count = z.number().int().min(0);

export const syllabusStatusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE"]);
export const lessonStatusSchema = z.enum(["PLANNED", "TAUGHT", "SKIPPED"]);

export const syllabusUnitSchema = z.object({
  id: z.string(),
  position: count,
  title: z.string(),
  periodsPlanned: count.nullable(),
});

/** GET /api/v1/office/syllabus?gradeLevel=&subject= */
export const officeSyllabusQuerySchema = z.object({ gradeLevel: z.string().trim().min(1).max(20).optional(), subject: z.string().trim().min(1).max(60).optional() });
export const officeSyllabusSchema = z.object({
  /** Every grade/subject pair that has units, with how many. */
  lists: z.array(z.object({ gradeLevel: z.string(), subject: z.string(), units: count })),
  /** The grades the school's classes carry and the subjects on its timetable, for the pickers. */
  grades: z.array(z.string()),
  subjects: z.array(z.string()),
  /** The chosen list, when gradeLevel and subject were given. */
  gradeLevel: z.string().nullable(),
  subject: z.string().nullable(),
  units: z.array(syllabusUnitSchema),
});

/** POST /api/v1/office/syllabus — replace the list for one grade and subject, in order; existing titles keep their ids and progress. */
export const officeSyllabusSaveSchema = z.object({
  gradeLevel: z.string().trim().min(1).max(20),
  subject: z.string().trim().min(1).max(60),
  units: z.array(z.object({ id: cuid.optional(), title: z.string().trim().min(1).max(160), periodsPlanned: z.number().int().min(0).max(999).nullable().optional() })).max(200),
});
export const officeSyllabusSavedSchema = z.object({ units: count, removed: count });

const coverageRowSchema = z.object({
  classId: z.string(),
  className: z.string(),
  gradeLevel: z.string().nullable(),
  subject: z.string(),
  units: count,
  done: count,
  inProgress: count,
  percent: count,
  /** Where the year says the class should be by today, as units; behind when done falls two or more short. */
  expected: count,
  behind: z.boolean(),
  lastTaughtOn: dateKey.nullable(),
});

/** GET /api/v1/office/syllabus/coverage — the head's picture. */
export const syllabusCoverageSchema = z.object({
  yearName: z.string().nullable(),
  /** How far through the academic year today is, in percent. */
  yearElapsedPercent: count,
  overallPercent: count.nullable(),
  classesBehind: count,
  rows: z.array(coverageRowSchema),
});

export const lessonPlanSchema = z.object({
  id: z.string(),
  subject: z.string(),
  unitId: z.string().nullable(),
  unitTitle: z.string().nullable(),
  dateKey,
  topic: z.string(),
  notes: z.string(),
  homework: z.string(),
  status: lessonStatusSchema,
  teacherName: z.string(),
  updatedAt: iso,
});

/** GET /api/v1/staff/syllabus?classId=&subject= — the class's units with progress, and its lessons. */
export const staffSyllabusQuerySchema = z.object({ classId: cuid, subject: z.string().trim().min(1).max(60).optional() });
export const staffSyllabusSchema = z.object({
  classId: z.string(),
  className: z.string(),
  gradeLevel: z.string().nullable(),
  subjects: z.array(z.string()),
  subject: z.string().nullable(),
  units: z.array(syllabusUnitSchema.extend({ status: syllabusStatusSchema, doneOn: dateKey.nullable(), byName: z.string().nullable(), lessons: count })),
  percent: count.nullable(),
  lessons: z.array(lessonPlanSchema),
  canEdit: z.boolean(),
});

/** POST /api/v1/staff/syllabus/progress */
export const syllabusProgressSaveSchema = z.object({ classId: cuid, unitId: cuid, status: syllabusStatusSchema, doneOn: dateKey.optional() });

/** POST /api/v1/staff/lessons */
export const lessonPlanSaveSchema = z.object({
  classId: cuid,
  subject: z.string().trim().min(1).max(60),
  unitId: cuid.nullable().optional(),
  dateKey,
  topic: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(2000).default(""),
  homework: z.string().trim().max(1000).default(""),
  status: lessonStatusSchema.default("PLANNED"),
});
export const lessonPlanSavedSchema = z.object({ id: z.string() });

/** POST /api/v1/staff/lessons/{lessonId}/status */
export const lessonStatusSaveSchema = z.object({ status: lessonStatusSchema });
