import { z } from "zod";

/**
 * The substitution board: for one day, every lesson whose teacher is away —
 * absent or on leave on the staff register, or inside an approved leave —
 * who is standing in, and who could. And the school's own teaching week,
 * which decides which days have a board at all.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const count = z.number().int().min(0);
const weekday = z.number().int().min(0).max(6);

export const absentReasonSchema = z.enum(["ABSENT", "ON_LEAVE"]);

/** Someone who could take the lesson, ranked: free that period first, then teaches the subject, then the lightest day. */
export const substitutionCandidateSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  role: z.string(),
  /** No lesson of their own, and no other cover, in that period. */
  free: z.boolean(),
  teachesSubject: z.boolean(),
  /** Lessons and covers they already have that day. */
  load: count,
});

export const substitutionLessonSchema = z.object({
  slotId: z.string(),
  periodId: z.string(),
  periodName: z.string().nullable(),
  position: count,
  startMinute: z.number().int().nullable(),
  endMinute: z.number().int().nullable(),
  classId: z.string(),
  className: z.string(),
  subject: z.string(),
  room: z.string().nullable(),
  absentMembershipId: z.string(),
  absentName: z.string(),
  absentReason: absentReasonSchema,
  substitute: z.object({ membershipId: z.string(), name: z.string(), note: z.string().nullable() }).nullable(),
  candidates: z.array(substitutionCandidateSchema),
});

/** GET /api/v1/office/substitutions?date= */
export const substitutionBoardQuerySchema = z.object({ date: dateKey.optional() });
export const substitutionBoardSchema = z.object({
  dateKey: dateKey,
  /** Not a teaching day, or shut by the calendar: no lessons, no board. */
  closed: z.boolean(),
  closedName: z.string().nullable(),
  absent: z.array(z.object({ membershipId: z.string(), name: z.string(), reason: absentReasonSchema, lessons: count, covered: count })),
  lessons: z.array(substitutionLessonSchema),
  covered: count,
  uncovered: count,
});
export type SubstitutionBoard = z.infer<typeof substitutionBoardSchema>;
export type SubstitutionLesson = z.infer<typeof substitutionLessonSchema>;

/** POST /api/v1/office/substitutions — who takes the lesson; the same person again changes nothing. */
export const substitutionAssignSchema = z.object({
  dateKey,
  slotId: cuid,
  substituteMembershipId: cuid,
  note: z.string().trim().max(200).optional(),
});
export const substitutionAssignedSchema = z.object({ changed: z.boolean() });

/** POST /api/v1/office/substitutions/clear — the lesson is uncovered again; nothing there is a no-op. */
export const substitutionClearSchema = z.object({ dateKey, slotId: cuid });

/** GET /api/v1/staff/substitutions/me?date= — the lessons I am covering that day. */
export const myCoversQuerySchema = z.object({ date: dateKey.optional() });
export const myCoverSchema = z.object({
  slotId: z.string(),
  periodName: z.string().nullable(),
  position: count,
  startMinute: z.number().int().nullable(),
  endMinute: z.number().int().nullable(),
  classId: z.string(),
  className: z.string(),
  subject: z.string(),
  room: z.string().nullable(),
  absentName: z.string(),
  note: z.string().nullable(),
});
export const myCoversSchema = z.object({ dateKey, items: z.array(myCoverSchema) });
export type MyCover = z.infer<typeof myCoverSchema>;

/** GET and POST /api/v1/office/school-week — the weekday numbers the school teaches on, Monday first (1 … 6, 0 = Sunday). */
export const schoolWeekSchema = z.object({ days: z.array(weekday).min(1).max(7) });
export const schoolWeekSavedSchema = z.object({ days: z.array(weekday), orphanedSlots: count });
export type SchoolWeek = z.infer<typeof schoolWeekSchema>;
