import { z } from "zod";

/**
 * THE STUDIO COORDINATOR'S DESK (the studio half of R-56, 10 October 2026).
 * An architecture college teaches by the design studio: a course offering's
 * studio for a term carries a brief, a coordinator (a FACULTY or HOD holding
 * STUDIO_COORDINATOR) and four stage dates — the brief issued, the interim
 * pin-up, the final submission and the jury. A student submits work for a
 * pin-up or the final (a note and, where they have one, a file through an
 * upload ticket); the state of a submission is DRAFT until it is sent,
 * SUBMITTED when sent by the stage's day and LATE after it. A jury is a
 * sitting on a day with a panel of the college's own teachers and up to two
 * external jurors, named by role word and institution only (never personal
 * details; a coded role, as a filing wants), chaired by one of the panel. A
 * juror on the panel writes marks out of the studio's maximum with a remark;
 * the chair signs the sheet, and only a signed sheet reaches the student. The
 * grade band is read from the marks (gradeBandFor), never stored.
 *
 * Coded lists here; what each says to a person is `duties.studio.*`.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const text = (max: number) => z.string().trim().max(max);

/* ------------------------------------------------------------- the codes */

/** A studio's four stages, in order. */
export const STUDIO_STAGES = ["BRIEF_ISSUED", "INTERIM_PINUP", "FINAL_SUBMISSION", "JURY"] as const;
export const studioStageSchema = z.enum(STUDIO_STAGES);
export type StudioStage = z.infer<typeof studioStageSchema>;
/** The stages a student submits work for. */
export const STUDIO_SUBMISSION_STAGES = ["INTERIM_PINUP", "FINAL_SUBMISSION"] as const;
export const studioSubmissionStageSchema = z.enum(STUDIO_SUBMISSION_STAGES);
export type StudioSubmissionStage = z.infer<typeof studioSubmissionStageSchema>;
/** Where a submission stands: saved and not sent, sent by the day, sent after it. */
export const STUDIO_SUBMISSION_STATES = ["DRAFT", "SUBMITTED", "LATE"] as const;
export const studioSubmissionStateSchema = z.enum(STUDIO_SUBMISSION_STATES);
export type StudioSubmissionState = z.infer<typeof studioSubmissionStateSchema>;
/** Where a stage stands against today: no day set, ahead, open today, done. */
export const STUDIO_STAGE_STATES = ["UNSET", "AHEAD", "TODAY", "DONE"] as const;
export const studioStageStateSchema = z.enum(STUDIO_STAGE_STATES);
/**
 * THE GRADE BANDS a jury's marks fall in (the ten-point letter scale the
 * universities' B.Arch. ordinances use, O to F): read from the marks as a
 * fraction of the studio's maximum, never typed.
 */
export const STUDIO_GRADE_BANDS = ["O", "A_PLUS", "A", "B_PLUS", "B", "C", "P", "F"] as const;
export const studioGradeBandSchema = z.enum(STUDIO_GRADE_BANDS);
export type StudioGradeBand = z.infer<typeof studioGradeBandSchema>;
const BAND_FLOORS: readonly [StudioGradeBand, number][] = [
  ["O", 0.9],
  ["A_PLUS", 0.8],
  ["A", 0.7],
  ["B_PLUS", 0.6],
  ["B", 0.55],
  ["C", 0.5],
  ["P", 0.4],
];
/** The band for `marks` out of `maxMarks`; null for an absent student (null marks) or a maximum of nothing. */
export function gradeBandFor(marks: number | null, maxMarks: number): StudioGradeBand | null {
  if (marks === null || !(maxMarks > 0)) return null;
  const fraction = marks / maxMarks;
  for (const [band, floor] of BAND_FLOORS) if (fraction >= floor) return band;
  return "F";
}
/** The role words an external juror may be named by — a code, so no personal detail is ever asked for. */
export const EXTERNAL_JUROR_ROLES = ["PRACTISING_ARCHITECT", "ACADEMIC", "URBAN_DESIGNER", "STRUCTURAL_ENGINEER", "LANDSCAPE_ARCHITECT", "CONSERVATION_ARCHITECT", "INTERIOR_DESIGNER"] as const;
export const externalJurorRoleSchema = z.enum(EXTERNAL_JUROR_ROLES);
export type ExternalJurorRole = z.infer<typeof externalJurorRoleSchema>;
export const STUDIO_MAX_EXTERNAL_JURORS = 2;
export const STUDIO_MAX_PANEL = 12;
export const STUDIO_MIN_MAX_MARKS = 10;
export const STUDIO_MAX_MAX_MARKS = 1000;

/* ------------------------------------------------------------ the writes */

/** POST /api/v1/duties/studio/studios — a studio and its stages, new or corrected by its id (the coordinator, the office). */
export const studioSaveSchema = z
  .object({
    id: cuid.optional(),
    offeringId: cuid,
    title: text(160).min(2),
    brief: text(4000),
    maxMarks: z.number().int().min(STUDIO_MIN_MAX_MARKS).max(STUDIO_MAX_MAX_MARKS),
    /** The coordinator; a holder of the duty saving a new studio may leave it out and is the coordinator themself. */
    coordinatorMembershipId: cuid.nullable().optional(),
    briefIssuedOn: dateKey,
    interimOn: dateKey.nullable(),
    finalOn: dateKey.nullable(),
    juryOn: dateKey.nullable(),
  })
  .strict();
export type StudioSave = z.infer<typeof studioSaveSchema>;

export const externalJurorSchema = z.object({ role: externalJurorRoleSchema, institution: text(160).min(2) });
/** POST /api/v1/duties/studio/studios/{studioId}/juries — a jury and its panel, new or corrected by its id while unsigned (the coordinator). */
export const studioJurySaveSchema = z
  .object({
    id: cuid.optional(),
    on: dateKey,
    title: text(160),
    jurorMembershipIds: z.array(cuid).min(1).max(STUDIO_MAX_PANEL),
    chairMembershipId: cuid,
    externalJurors: z.array(externalJurorSchema).max(STUDIO_MAX_EXTERNAL_JURORS),
  })
  .strict();
export type StudioJurySave = z.infer<typeof studioJurySaveSchema>;

/** POST /api/v1/faculty/studios/juries/{juryId}/marks — a juror's marks for some of the studio's students; null marks is absent. */
export const studioJuryMarksSchema = z.object({
  entries: z.array(z.object({ studentMembershipId: cuid, marks: z.number().min(0).max(STUDIO_MAX_MAX_MARKS).nullable(), remark: text(400) })).min(1).max(500),
});
export type StudioJuryMarks = z.infer<typeof studioJuryMarksSchema>;
export const studioJuryMarksSavedSchema = z.object({ saved: z.number().int().min(0) });
/** POST …/juries/{juryId}/sign — the chair signs the sheet; already signed answers as it stands. */
export const studioJurySignedSchema = z.object({ signed: z.boolean(), changed: z.boolean() });
/** POST …/juries/{juryId}/internal — the signed totals into one of the offering's internal components. */
export const studioJuryInternalPostSchema = z.object({ componentId: cuid });
export const studioJuryInternalPostedSchema = z.object({ posted: z.number().int().min(0), componentId: cuid });

/** POST /api/v1/family/studios/{studioId}/submissions — a student's work for a stage: a note, a file by upload ticket, sent or kept as a draft. */
export const studioSubmissionSaveSchema = z.object({
  stage: studioSubmissionStageSchema,
  note: text(1000),
  /** A file uploaded through POST /api/v1/uploads (the ticket is the caller's and spent here); null keeps the file already there. */
  fileId: z.string().trim().min(1).max(120).nullable(),
  submit: z.boolean(),
});
export type StudioSubmissionSave = z.infer<typeof studioSubmissionSaveSchema>;
export const studioSubmissionSavedSchema = z.object({ id: cuid, state: studioSubmissionStateSchema });
export const studioIdSchema = z.object({ id: cuid });

/* ------------------------------------------------------------- the reads */

export const studioStageRowSchema = z.object({
  stage: studioStageSchema,
  on: dateKey.nullable(),
  state: studioStageStateSchema,
  /** For a submission stage, the registered students who have not sent work; for the jury, the juries not yet signed. */
  waiting: z.number().int().min(0),
});
export const studioSubmissionRowSchema = z.object({
  stage: studioSubmissionStageSchema,
  state: studioSubmissionStateSchema,
  submittedAt: iso.nullable(),
  note: z.string(),
  fileId: z.string().nullable(),
  fileName: z.string().nullable(),
});
export const studioPanelMemberSchema = z.object({ membershipId: cuid, name: z.string(), chair: z.boolean() });
export const studioJuryRowSchema = z.object({
  id: cuid,
  studioId: cuid,
  on: dateKey,
  title: z.string(),
  panel: z.array(studioPanelMemberSchema),
  externalJurors: z.array(externalJurorSchema),
  signedAt: iso.nullable(),
  signedByName: z.string().nullable(),
  /** Students with a mark entered, and the students registered on the studio's offering. */
  marked: z.number().int().min(0),
  students: z.number().int().min(0),
  past: z.boolean(),
});
export const studioStudentRowSchema = z.object({
  studentMembershipId: cuid,
  name: z.string(),
  submissions: z.array(studioSubmissionRowSchema),
  /** The signed juries' marks, latest sitting first. */
  results: z.array(z.object({ juryId: cuid, on: dateKey, marks: z.number().nullable(), band: studioGradeBandSchema.nullable(), remark: z.string() })),
});
export const studioRowSchema = z.object({
  id: cuid,
  offeringId: cuid,
  courseCode: z.string(),
  courseName: z.string(),
  termId: cuid,
  termName: z.string(),
  title: z.string(),
  brief: z.string(),
  maxMarks: z.number().int(),
  coordinatorMembershipId: cuid,
  coordinatorName: z.string(),
  facultyName: z.string().nullable(),
  briefIssuedOn: dateKey,
  interimOn: dateKey.nullable(),
  finalOn: dateKey.nullable(),
  juryOn: dateKey.nullable(),
  stages: z.array(studioStageRowSchema),
  students: z.array(studioStudentRowSchema),
  juries: z.array(studioJuryRowSchema),
});
export type StudioRow = z.infer<typeof studioRowSchema>;

/** GET /api/v1/duties/studio — the coordinator's desk; the office and the head read it. */
export const studioDeskSchema = z.object({
  today: dateKey,
  /** Whether the college's streams include ARCHITECTURE; false answers every write with 409. */
  offered: z.boolean(),
  /** Studios and stages: the office and a holder of the duty. */
  canManage: z.boolean(),
  /** Juries and panels: a holder of the duty. */
  canConvene: z.boolean(),
  studios: z.array(studioRowSchema),
  /** The offerings a studio may be kept on (the current terms'), for the form. */
  offerings: z.array(z.object({ id: cuid, courseCode: z.string(), courseName: z.string(), termName: z.string(), facultyName: z.string().nullable() })),
  /** The teachers who hold the duty, for the office's form; and every active teacher, for a panel. */
  coordinators: z.array(z.object({ membershipId: cuid, name: z.string() })),
  teachers: z.array(z.object({ membershipId: cuid, name: z.string(), role: z.enum(["FACULTY", "HOD"]) })),
  /** Juries with marks waiting for the chair's signature. */
  toSign: z.array(z.object({ juryId: cuid, studioId: cuid, studioTitle: z.string(), on: dateKey, chairName: z.string(), marked: z.number().int(), students: z.number().int() })),
});
export type StudioDesk = z.infer<typeof studioDeskSchema>;

/** A jury as a juror reads it: the sheet with each student's mark, and what this reader may do to it. */
export const facultyJurySchema = studioJuryRowSchema.extend({
  studioTitle: z.string(),
  courseCode: z.string(),
  maxMarks: z.number().int(),
  canMark: z.boolean(),
  canSign: z.boolean(),
  canPost: z.boolean(),
  sheet: z.array(z.object({ studentMembershipId: cuid, name: z.string(), marks: z.number().nullable(), band: studioGradeBandSchema.nullable(), remark: z.string(), entered: z.boolean() })),
  /** The offering's internal components still open, for the posting; [] unless canPost. */
  components: z.array(z.object({ id: cuid, name: z.string(), maxMarks: z.number().int() })),
});
export type FacultyJury = z.infer<typeof facultyJurySchema>;
/** GET /api/v1/faculty/studios — the studios I teach, coordinate or sit on a jury for (an HOD: the department's too), and those juries. */
export const facultyStudiosSchema = z.object({
  offered: z.boolean(),
  studios: z.array(studioRowSchema.extend({ mine: z.object({ teaches: z.boolean(), coordinates: z.boolean(), juror: z.boolean(), heads: z.boolean() }) })),
  juries: z.array(facultyJurySchema),
});
export type FacultyStudios = z.infer<typeof facultyStudiosSchema>;

/** GET /api/v1/family/studios — a student's studios: the brief, the stages, their submissions and the signed results. */
export const studentStudiosSchema = z.object({
  today: dateKey,
  offered: z.boolean(),
  studios: z.array(
    z.object({
      id: cuid,
      title: z.string(),
      courseCode: z.string(),
      courseName: z.string(),
      termName: z.string(),
      brief: z.string(),
      maxMarks: z.number().int(),
      coordinatorName: z.string(),
      stages: z.array(studioStageRowSchema.omit({ waiting: true })),
      submissions: z.array(studioSubmissionRowSchema),
      /** Whether a submission may still be saved: no signed jury yet. */
      canSubmit: z.boolean(),
      results: z.array(z.object({ juryId: cuid, on: dateKey, title: z.string(), marks: z.number().nullable(), band: studioGradeBandSchema.nullable(), remark: z.string() })),
    }),
  ),
});
export type StudentStudios = z.infer<typeof studentStudiosSchema>;
