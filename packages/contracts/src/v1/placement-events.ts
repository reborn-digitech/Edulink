import { z } from "zod";

/**
 * PRE-PLACEMENT TALKS AND SOFT-SKILLS TRAINING (the risks batch, R-2, 5 October
 * 2026): two placement events the TPO runs beside the drives.
 *
 *   - A TALK is a company's pre-placement talk: the TPO sets it (with the
 *     drive it belongs to, when there is one), each student answers GOING or
 *     NOT_GOING while it is ahead, and the TPO marks who came once it is held.
 *   - A TRAINING is a soft-skills course (SOFT_SKILLS) with sessions; students
 *     enrol while it is OPEN, the TPO marks each session, and a student has
 *     COMPLETED it once present at the training's `minAttendancePercent` of
 *     its sessions that were not cancelled (`softSkillsCompleted`, computed on
 *     read and stored nowhere). The count of completions is the TPO's figure
 *     and a line on the student's placement profile.
 *
 * Coded lists here; what each says to a person is a key under `talks.*` and
 * `softSkills.*` in the dictionary.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const text = (max: number) => z.string().trim().max(max);

/* ------------------------------------------------------------- the talks */

export const TALK_STATUSES = ["SCHEDULED", "CANCELLED"] as const;
export const talkStatusSchema = z.enum(TALK_STATUSES);
export type TalkStatus = z.infer<typeof talkStatusSchema>;
export const TALK_ANSWERS = ["GOING", "NOT_GOING"] as const;
export const talkAnswerSchema = z.enum(TALK_ANSWERS);
export type TalkAnswer = z.infer<typeof talkAnswerSchema>;
export const TALK_ATTENDANCE = ["PRESENT", "ABSENT"] as const;
export const talkAttendanceSchema = z.enum(TALK_ATTENDANCE);
export type TalkAttendance = z.infer<typeof talkAttendanceSchema>;

/** The longest roster a talk's page draws (the students who answered come first). */
export const TALK_ROSTER_MAX = 2000;

export const talkSaveSchema = z.object({
  title: text(160).min(2),
  companyName: text(120).min(2),
  /** The drive the talk belongs to: one talk a drive. */
  driveId: cuid.nullable().optional(),
  startsAt: iso,
  durationMinutes: z.number().int().min(15).max(480).default(60),
  venue: text(160).default(""),
  note: text(1000).default(""),
  capacity: z.number().int().min(1).max(5000).nullable().optional(),
});
export type TalkSave = z.infer<typeof talkSaveSchema>;

/** The TPO moves or cancels a talk; every field may be left out. */
export const talkUpdateSchema = z.object({
  title: text(160).min(2).optional(),
  companyName: text(120).min(2).optional(),
  driveId: cuid.nullable().optional(),
  startsAt: iso.optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  venue: text(160).optional(),
  note: text(1000).optional(),
  capacity: z.number().int().min(1).max(5000).nullable().optional(),
  status: talkStatusSchema.optional(),
});
export type TalkUpdate = z.infer<typeof talkUpdateSchema>;

export const talkViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  driveId: z.string().nullable(),
  driveTitle: z.string().nullable(),
  startsAt: iso,
  durationMinutes: z.number().int(),
  venue: z.string(),
  note: z.string(),
  capacity: z.number().int().nullable(),
  status: talkStatusSchema,
  heldAt: iso.nullable(),
  /** The talk has begun (in the school's clock): answers close, attendance opens. */
  started: z.boolean(),
  counts: z.object({ going: z.number().int(), notGoing: z.number().int(), present: z.number().int(), absent: z.number().int() }),
  /** A student's own answer and mark; null for the cell. */
  mine: z.object({ answer: talkAnswerSchema.nullable(), attendance: talkAttendanceSchema.nullable() }).nullable(),
  /** A student may answer: scheduled, ahead, and a seat left for GOING (or already going). */
  canAnswer: z.boolean(),
});
export type TalkView = z.infer<typeof talkViewSchema>;

export const talkListSchema = z.object({ talks: z.array(talkViewSchema), canEdit: z.boolean() });
export type TalkList = z.infer<typeof talkListSchema>;

export const talkRosterRowSchema = z.object({
  studentMembershipId: z.string(),
  name: z.string(),
  prn: z.string().nullable(),
  answer: talkAnswerSchema.nullable(),
  attendance: talkAttendanceSchema.nullable(),
});
export const talkDetailSchema = talkViewSchema.extend({
  roster: z.array(talkRosterRowSchema),
  /** More students than TALK_ROSTER_MAX: those who answered are all in. */
  truncated: z.boolean(),
  canEdit: z.boolean(),
  /** Attendance may be marked: the talk has started and is not cancelled, and the reader is the TPO. */
  canMark: z.boolean(),
});
export type TalkDetail = z.infer<typeof talkDetailSchema>;

export const talkRsvpSchema = z.object({ answer: talkAnswerSchema });
export type TalkRsvp = z.infer<typeof talkRsvpSchema>;

export const talkAttendanceSaveSchema = z.object({
  marks: z.array(z.object({ studentMembershipId: cuid, attendance: talkAttendanceSchema })).min(1).max(TALK_ROSTER_MAX),
});
export type TalkAttendanceSave = z.infer<typeof talkAttendanceSaveSchema>;
export const talkAttendanceResultSchema = z.object({ saved: z.number().int(), talk: talkDetailSchema });

/* ------------------------------------------------------- soft-skills training */

export const SOFT_SKILLS = ["COMMUNICATION", "APTITUDE", "GROUP_DISCUSSION", "INTERVIEW", "RESUME_WRITING", "TEAMWORK", "LEADERSHIP", "EMAIL_ETIQUETTE", "OTHER"] as const;
export const softSkillSchema = z.enum(SOFT_SKILLS);
export type SoftSkill = z.infer<typeof softSkillSchema>;
export const TRAINING_STATUSES = ["OPEN", "CLOSED"] as const;
export const trainingStatusSchema = z.enum(TRAINING_STATUSES);
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;
/** The share of a training's sessions a student attends to complete it, unless the training says otherwise. */
export const TRAINING_DEFAULT_MIN_PERCENT = 75;

/**
 * WHETHER A STUDENT HAS COMPLETED A TRAINING, the one rule both the cell's
 * count and the student's profile read: present at least `minPercent` of the
 * sessions that were not cancelled, rounded up, and at least one session.
 */
export function softSkillsCompleted(attended: number, sessions: number, minPercent: number): boolean {
  if (sessions <= 0) return false;
  return attended >= Math.max(1, Math.ceil((sessions * minPercent) / 100));
}

export const trainingSaveSchema = z.object({
  title: text(160).min(2),
  skill: softSkillSchema,
  trainer: text(120).default(""),
  description: text(2000).default(""),
  capacity: z.number().int().min(1).max(5000).nullable().optional(),
  minAttendancePercent: z.number().int().min(1).max(100).default(TRAINING_DEFAULT_MIN_PERCENT),
});
export type TrainingSave = z.infer<typeof trainingSaveSchema>;

export const trainingUpdateSchema = z.object({
  title: text(160).min(2).optional(),
  skill: softSkillSchema.optional(),
  trainer: text(120).optional(),
  description: text(2000).optional(),
  capacity: z.number().int().min(1).max(5000).nullable().optional(),
  minAttendancePercent: z.number().int().min(1).max(100).optional(),
  status: trainingStatusSchema.optional(),
});
export type TrainingUpdate = z.infer<typeof trainingUpdateSchema>;

export const trainingSessionSaveSchema = z.object({
  startsAt: iso,
  durationMinutes: z.number().int().min(15).max(480).default(60),
  topic: text(160).default(""),
  venue: text(160).default(""),
});
export type TrainingSessionSave = z.infer<typeof trainingSessionSaveSchema>;
/** Cancel a session (or bring it back); a session with marks cannot be cancelled. */
export const trainingSessionUpdateSchema = z.object({ cancelled: z.boolean() });

export const trainingSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  skill: softSkillSchema,
  trainer: z.string(),
  status: trainingStatusSchema,
  capacity: z.number().int().nullable(),
  minAttendancePercent: z.number().int(),
  /** Sessions not cancelled, and of those the ones whose attendance is marked. */
  sessions: z.number().int(),
  held: z.number().int(),
  enrolled: z.number().int(),
  completed: z.number().int(),
  nextSessionAt: iso.nullable(),
  /** A student's own place; null for the cell. */
  mine: z.object({ enrolled: z.boolean(), attended: z.number().int(), completed: z.boolean() }).nullable(),
  /** A student may enrol: OPEN, a seat left, not already on it. */
  canEnrol: z.boolean(),
});
export type TrainingSummary = z.infer<typeof trainingSummarySchema>;

export const trainingListSchema = z.object({
  trainings: z.array(trainingSummarySchema),
  /** Students who completed at least one training: the cell's figure. */
  studentsCompleted: z.number().int(),
  canEdit: z.boolean(),
});
export type TrainingList = z.infer<typeof trainingListSchema>;

export const trainingSessionViewSchema = z.object({
  id: z.string(),
  startsAt: iso,
  durationMinutes: z.number().int(),
  topic: z.string(),
  venue: z.string(),
  cancelled: z.boolean(),
  held: z.boolean(),
  present: z.number().int(),
});
export const trainingDetailSchema = trainingSummarySchema.extend({
  description: z.string(),
  sessionList: z.array(trainingSessionViewSchema),
  roster: z.array(
    z.object({
      studentMembershipId: z.string(),
      name: z.string(),
      prn: z.string().nullable(),
      attended: z.number().int(),
      completed: z.boolean(),
      /** By session id: true present, false absent; a session not marked for the student is absent from the map. */
      marks: z.record(z.string(), z.boolean()),
    }),
  ),
  canEdit: z.boolean(),
});
export type TrainingDetail = z.infer<typeof trainingDetailSchema>;

/** A student enrols themselves (true) or withdraws (false). */
export const trainingEnrolSelfSchema = z.object({ enrol: z.boolean() });

/** The TPO puts students on a training's roll, or takes them off (`remove`). */
export const trainingEnrolmentSaveSchema = z.object({ studentMembershipIds: z.array(cuid).min(1).max(TALK_ROSTER_MAX), remove: z.boolean().default(false) });
export const trainingAttendanceSaveSchema = z.object({
  marks: z.array(z.object({ studentMembershipId: cuid, present: z.boolean() })).min(1).max(TALK_ROSTER_MAX),
});
export type TrainingAttendanceSave = z.infer<typeof trainingAttendanceSaveSchema>;
export const trainingAttendanceResultSchema = z.object({ saved: z.number().int(), training: trainingDetailSchema });

/** The student's trainings and the ones completed (the line on their placement profile). */
export const studentTrainingsSchema = z.object({
  trainings: z.array(trainingSummarySchema),
  completed: z.array(z.object({ trainingId: z.string(), title: z.string(), skill: softSkillSchema })),
});
export type StudentTrainings = z.infer<typeof studentTrainingsSchema>;
