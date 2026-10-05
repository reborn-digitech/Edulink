import { z } from "zod";
import { practiceAnsweredSchema } from "./practice";

/**
 * The office's year, a class's roll and a teacher's own leave, as the phone
 * reaches them (A3-inventory-7, audit of 5 October 2026), and the two doors
 * outside /api/v1 that the catalog now lists (A3-inventory-9). Each body is
 * what the web's server action already takes; the rules stay in the library
 * the action and the door both call.
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const id = z.string().min(1).max(64);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const count = z.number().int();

/* ------------------------------------------------------------------------- */
/* The academic year and its terms                                             */
/* ------------------------------------------------------------------------- */

/** POST /api/v1/admin/calendar/years — a year by its years ("2026-27"), its first and last day. */
export const academicYearCreateBodySchema = z.object({ name: z.string().trim().min(1).max(40), startDateKey: dateKey, endDateKey: dateKey });
export const academicYearCreatedSchema = z.object({ id });

/** POST /api/v1/admin/calendar/years/{yearId}/close — the year already made to move into. */
export const academicYearCloseBodySchema = z.object({ nextYearId: id });
/** A second close is a no-op, said in zeros. */
export const academicYearClosedSchema = z.object({ studentsArchived: count, badgesArchived: count, seriesArchived: count, roundsClosed: count });

/** POST /api/v1/admin/calendar/years/{yearId}/terms — a term inside the year, not overlapping its siblings. */
export const schoolTermCreateBodySchema = z.object({ name: z.string().trim().min(1).max(60), startDateKey: dateKey, endDateKey: dateKey });
export const schoolTermCreatedSchema = z.object({ termId: id });

/* ------------------------------------------------------------------------- */
/* The year-end promotion and a class's roll                                   */
/* ------------------------------------------------------------------------- */

const newClassSchema = z.object({
  kind: z.literal("NEW"),
  /** Every destination with this key is the same new class; absent, the class is the move's own. */
  key: z.string().max(64).optional(),
  name: z.string().max(120),
  gradeLevel: z.string().max(40).nullable(),
  section: z.string().max(40).nullable().optional(),
});
const classDestinationSchema = z.object({ kind: z.literal("CLASS"), classId: id });
const leaveDestinationSchema = z.object({ kind: z.literal("LEAVE") });
/** Where a class (or one pupil of it) goes at the year's end. */
export const promotionDestinationSchema = z.discriminatedUnion("kind", [classDestinationSchema, newClassSchema, leaveDestinationSchema, z.object({ kind: z.literal("STAY") })]);

/** POST /api/v1/admin/classes/promotion — the plan as GET /api/v1/admin/classes/promotion suggests it, as decided; one way. */
export const promotionBodySchema = z.object({
  moves: z
    .array(
      z.object({
        fromClassId: id,
        to: promotionDestinationSchema,
        /** Pupils who stay in the old class: repeaters. */
        holdBack: z.array(id).max(500),
        /** Pupils who go somewhere other than the class's destination. */
        reassign: z.array(z.object({ membershipId: id, to: z.discriminatedUnion("kind", [classDestinationSchema, newClassSchema, leaveDestinationSchema]) })).max(500).optional(),
      }),
    )
    .min(1)
    .max(300),
  /** The leavers' last day; absent, today. */
  lastDayKey: dateKey.optional(),
});
export const promotionDoneSchema = z.object({ ok: z.literal(true), moved: count, left: count, heldBack: count, created: count, archived: count });

/** POST /api/v1/admin/classes/{classId}/pupils — pupils of the school put on the class's roll; one already on it is a no-op. */
export const cohortAddBodySchema = z.object({ studentMembershipIds: z.array(id).min(1).max(500) });
export const cohortAddedSchema = z.object({ added: count });
/** POST /api/v1/admin/classes/{classId}/pupils/remove — one pupil off the roll, everything they did in it kept. */
export const cohortRemoveBodySchema = z.object({ studentMembershipId: id });

/* ------------------------------------------------------------------------- */
/* The register and the web's practice answer: /api, not /api/v1               */
/* ------------------------------------------------------------------------- */

/**
 * POST /api/attendance — the register's write, the web's and the phone's
 * outbox target, safe to send twice: a mark whose `clientId` is already
 * stored is skipped, an older `markedAt` never overwrites a newer one. The
 * handler validates with the web's own schema (src/lib/validation.ts
 * attendanceBatchSchema); tests/api-catalog-unversioned.test.ts holds the two
 * to the same answers.
 */
export const attendanceRegisterBodySchema = z.object({
  classId: cuid,
  dateKey,
  marks: z
    .array(
      z.object({
        studentMembershipId: cuid,
        status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]),
        note: z.string().trim().max(500).optional(),
        /** The idempotency key minted on the device before the mark is queued. */
        clientId: z.string().min(8).max(64),
        /** The device's clock when the mark was made: the later mark wins. */
        markedAt: z.string().datetime().optional(),
      }),
    )
    .min(1)
    .max(500),
});
export const attendanceRegisterSavedSchema = z.object({
  applied: count,
  skipped: count,
  rejected: z.array(z.object({ studentMembershipId: z.string(), reason: z.string() })),
  /** Null when nothing in the batch could be stored. */
  sessionId: z.string().nullable(),
});

/** GET /api/attendance?classId=&date= — the roster and the marks already made, for the register to start from. */
export const attendanceRegisterQuerySchema = z.object({ classId: cuid, date: dateKey.optional() });
export const attendanceRegisterRosterSchema = z.object({
  class: z.object({ id: z.string(), name: z.string(), subject: z.string().nullable(), color: z.string().nullable() }),
  dateKey,
  roster: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      fullName: z.string(),
      avatarKey: z.string().nullable(),
      status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]).nullable(),
      note: z.string().nullable(),
      absenceNote: z.unknown().nullable(),
    }),
  ),
  finalizedAt: z.string().nullable(),
  takenAt: z.string().nullable(),
});

/** POST /api/practice/answer — the web's outbox twin of POST /api/v1/practice/answer, replay-safe the same way. */
export const webPracticeAnswerBodySchema = z.object({ attemptId: z.string(), questionId: z.string(), chosenIndex: z.number() });
export const webPracticeAnsweredSchema = practiceAnsweredSchema.extend({ ok: z.literal(true) });
