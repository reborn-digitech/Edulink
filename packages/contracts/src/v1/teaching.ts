import { z } from "zod";
import { newAssignmentSchema } from "./staff";

/**
 * teaching: request and response shapes for the phone's remaining teaching
 * screens — one assignment's gradebook, handouts on a new assignment, the
 * report-card builder and writing to a family about a pupil. Area-prefixed
 * export names, because `export *` from the index collides otherwise.
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const isoDate = z.string().datetime();
const count = z.number().int();

/** A stored file as a record names it: `{fileId, name, size, mime}`, read back through /api/files/{fileId}. */
export const teachingAttachmentSchema = z.object({ fileId: z.string(), name: z.string(), size: count, mime: z.string() });
export type TeachingAttachment = z.infer<typeof teachingAttachmentSchema>;

/* ------------------------------------------------------------------------- */
/* /teacher/assignments/new — the form, with handouts                         */
/* ------------------------------------------------------------------------- */

/**
 * The staff form's fields plus handouts: files the caller uploaded through
 * POST /api/v1/uploads, named by the id that came back. Each must be one this
 * person uploaded and nobody has attached yet (the upload ticket); the name is
 * for display only, as the web keeps a file's own name.
 */
export const teachingNewAssignmentSchema = newAssignmentSchema.extend({
  handouts: z
    .array(z.object({ fileId: z.string().min(1).max(200), name: z.string().trim().min(1).max(200) }))
    .max(5)
    .default([]),
});
export type TeachingNewAssignmentBody = z.infer<typeof teachingNewAssignmentSchema>;

export const teachingAssignmentCreatedSchema = z.object({ assignmentId: z.string(), notified: count, handouts: count });

/* ------------------------------------------------------------------------- */
/* /teacher/assignments/[assignmentId] — the gradebook                        */
/* ------------------------------------------------------------------------- */

export const teachingGradebookSchema = z.object({
  assignment: z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    category: z.string().nullable(),
    pointsMilli: count.nullable(),
    dueAt: isoDate.nullable(),
    publishedAt: isoDate.nullable(),
    classId: z.string(),
    className: z.string(),
    attachments: z.array(teachingAttachmentSchema),
  }),
  /** One row per pupil on the roll, by name; `work` is what they handed in, null until they have. */
  rows: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      fullName: z.string(),
      avatarKey: z.string().nullable(),
      submittedAt: isoDate.nullable(),
      submissionStatus: z.string().nullable(),
      late: z.boolean(),
      scoreMilli: count.nullable(),
      letter: z.string().nullable(),
      comment: z.string().nullable(),
      gradedAt: isoDate.nullable(),
      work: z.object({ body: z.string(), attachments: z.array(teachingAttachmentSchema) }).nullable(),
    }),
  ),
  stats: z.object({ total: count, submitted: count, graded: count, averagePercent: z.number().nullable() }),
});
export type TeachingGradebook = z.infer<typeof teachingGradebookSchema>;

/**
 * Marks for one assignment, as a batch. Replay-safe: each grade is the current
 * state of that pupil's mark, so a second delivery leaves the same marks and
 * notifies nobody twice (a family is told on a FIRST grade only). `score: null`
 * clears a mark; `comment` is always sent, because leaving it out clears it.
 */
export const teachingGradesBodySchema = z.object({
  grades: z
    .array(
      z.object({
        studentMembershipId: cuid,
        score: z.number().min(0).max(10_000).nullable(),
        letter: z.string().trim().max(8).optional(),
        comment: z.string().trim().max(4_000).optional(),
      }),
    )
    .min(1)
    .max(500),
});
export type TeachingGradesBody = z.infer<typeof teachingGradesBodySchema>;

export const teachingGradesSavedSchema = z.object({ saved: count, cleared: count, rejected: count });

/* ------------------------------------------------------------------------- */
/* /teacher/classes/[classId]/report-cards — the builder                      */
/* ------------------------------------------------------------------------- */

export const teachingReportCardsQuerySchema = z.object({ title: z.string().trim().min(1).max(120).optional() });

export const teachingReportCardsSchema = z.object({
  class: z.object({ id: z.string(), name: z.string(), heading: z.string() }),
  /** The class's scheduled papers, grouped on the phone by series; `gradedCount` of `classSize` have a mark. */
  assessments: z.array(
    z.object({
      assignmentId: z.string(),
      title: z.string(),
      category: z.string().nullable(),
      subject: z.string(),
      seriesId: z.string(),
      seriesName: z.string(),
      seriesKind: z.enum(["UNIT_TEST", "MID_TERM", "FINAL"]),
      termId: z.string().nullable(),
      gradedCount: count,
      classSize: count,
    }),
  ),
  /** The current year's terms; empty for a school that reports once a year. */
  terms: z.array(z.object({ id: z.string(), name: z.string(), current: z.boolean() })),
  titles: z.array(z.string()),
  selectedTitle: z.string().nullable(),
  cards: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(["DRAFT", "PUBLISHED"]),
      remark: z.string().nullable(),
      overallPercentMilli: count.nullable(),
      attendancePresent: count,
      attendanceTotal: count,
      studentName: z.string(),
    }),
  ),
});
export type TeachingReportCards = z.infer<typeof teachingReportCardsSchema>;

export const teachingGenerateCardsSchema = z.object({
  title: z.string().trim().min(2).max(120),
  assignmentIds: z.array(cuid).min(1).max(100),
  termId: cuid.nullable().optional(),
});
export type TeachingGenerateCardsBody = z.infer<typeof teachingGenerateCardsSchema>;

export const teachingCardsGeneratedSchema = z.object({ created: count, updated: count, skippedPublished: count });

export const teachingCardRemarkSchema = z.object({ cardId: cuid, remark: z.string().max(2_000) });
export type TeachingCardRemarkBody = z.infer<typeof teachingCardRemarkSchema>;

/** Publish and withdraw act on a whole set: every card of the class under one title. */
export const teachingCardsTitleSchema = z.object({ title: z.string().trim().min(1).max(120) });
export type TeachingCardsTitleBody = z.infer<typeof teachingCardsTitleSchema>;

export const teachingCardsPublishedSchema = z.object({ published: count });
export const teachingCardsWithdrawnSchema = z.object({ withdrawn: count });

/* ------------------------------------------------------------------------- */
/* /remarks/new — writing about a pupil                                       */
/* ------------------------------------------------------------------------- */

/**
 * Who this person may start a conversation about or with. A teacher gets
 * `students` (the pupils in classes they teach); a pupil gets one entry in
 * `pupils` — themselves, `selfOnly` — with the teachers who teach them; a
 * guardian one entry per child. The list that does not apply is empty.
 */
export const teachingRemarkPeopleSchema = z.object({
  role: z.enum(["TEACHER", "STUDENT", "PARENT"]),
  selfOnly: z.boolean(),
  students: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      fullName: z.string(),
      avatarKey: z.string().nullable(),
      className: z.string(),
      guardianCount: count,
    }),
  ),
  pupils: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      teachers: z.array(
        z.object({
          membershipId: z.string(),
          name: z.string(),
          title: z.string().nullable(),
          avatarKey: z.string().nullable(),
          classes: z.array(z.string()),
          lead: z.boolean(),
        }),
      ),
    }),
  ),
});
export type TeachingRemarkPeople = z.infer<typeof teachingRemarkPeopleSchema>;

/**
 * The web's startThread input. A teacher names the pupil; a pupil names the
 * teacher (their own membership comes from the session, never the body); a
 * guardian names both.
 */
export const teachingStartRemarkSchema = z.object({
  studentMembershipId: cuid.optional(),
  teacherMembershipId: cuid.optional(),
  subject: z.string().trim().min(2).max(160),
  body: z.string().trim().min(1).max(8_000),
});
export type TeachingStartRemarkBody = z.infer<typeof teachingStartRemarkSchema>;

export const teachingRemarkStartedSchema = z.object({ threadId: z.string() });
