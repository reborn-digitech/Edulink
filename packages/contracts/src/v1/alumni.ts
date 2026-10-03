import { z } from "zod";
import { roleSchema } from "./auth";

/**
 * THE ALUMNI MODULE (the owner's decision of 3 October 2026). A pupil who
 * leaves keeps an ALUMNUS membership at the old school: they read its feed
 * (with an Alumni tag on what they write), write to its staff, and may list
 * themselves in a directory of the school's former pupils. Every door below
 * carries `module: "ALUMNI"` in the catalog, so a school that has switched
 * alumni off answers 403 MODULE_OFF.
 */

const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");

/**
 * What the school's alumni may do on its feed, the admin's choice: READ only,
 * read and COMMENT (the default), or also POST (a post is held for the
 * office's review). Stored in the ALUMNI module's settings.
 */
export const ALUMNI_FEED_MODES = ["READ", "COMMENT", "POST"] as const;
export const alumniFeedModeSchema = z.enum(ALUMNI_FEED_MODES);
export type AlumniFeedMode = z.infer<typeof alumniFeedModeSchema>;
export const DEFAULT_ALUMNI_FEED_MODE: AlumniFeedMode = "COMMENT";

/**
 * How a listed alumnus would like to be reached by the directory's readers:
 * NONE (just listed), OFFICE (through the school office), EMAIL (their
 * account's email shown to the directory's readers).
 */
export const ALUMNI_CONTACT_PREFS = ["NONE", "OFFICE", "EMAIL"] as const;
export const alumniContactPrefSchema = z.enum(ALUMNI_CONTACT_PREFS);
export type AlumniContactPref = z.infer<typeof alumniContactPrefSchema>;

/** A member of staff an alumnus may write to. */
export const alumniStaffPersonSchema = z.object({
  userId: z.string(),
  membershipId: z.string(),
  name: z.string(),
  avatarKey: z.string().nullable(),
  role: roleSchema,
  /** A teacher's subjects; null otherwise. */
  detail: z.string().nullable(),
  /** Taught a class the alumnus was in. */
  formerTeacher: z.boolean(),
});

/** GET /api/v1/alumni/staff — former teachers first, then the rest of the staff, `?q=` on the name. */
export const alumniStaffSchema = z.object({
  schoolId: z.string(),
  people: z.array(alumniStaffPersonSchema),
});

export const alumniNoteSchema = z.object({
  id: z.string(),
  batchYear: z.number().int().nullable(),
  title: z.string(),
  body: z.string(),
  createdAt: iso,
});

export const alumniDirectoryMeSchema = z.object({
  listed: z.boolean(),
  city: z.string().nullable(),
  occupation: z.string().nullable(),
  contactPref: alumniContactPrefSchema,
  mentor: z.boolean(),
});

/** GET /api/v1/alumni/home — the alumnus's own page. */
export const alumniHomeSchema = z.object({
  schoolId: z.string(),
  schoolName: z.string(),
  /** The year they left. */
  batchYear: z.number().int(),
  leftAt: iso,
  /** The class on their leaving record, when there is one. */
  lastClass: z.string().nullable(),
  feedMode: alumniFeedModeSchema,
  /** Muted by the office: no new rooms, messages, comments or posts. */
  muted: z.boolean(),
  /** A minor may not join the directory. */
  isMinor: z.boolean(),
  formerTeachers: z.array(alumniStaffPersonSchema),
  notes: z.array(alumniNoteSchema),
  directory: alumniDirectoryMeSchema,
});

export const alumniDirectoryEntrySchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  name: z.string(),
  avatarKey: z.string().nullable(),
  batchYear: z.number().int(),
  city: z.string().nullable(),
  occupation: z.string().nullable(),
  contactPref: alumniContactPrefSchema,
  /** Only when contactPref is EMAIL. */
  email: z.string().nullable(),
  mentor: z.boolean(),
  mine: z.boolean(),
});

/** GET /api/v1/alumni/directory — the listed alumni, by batch, newest first. */
export const alumniDirectorySchema = z.object({
  schoolName: z.string(),
  entries: z.array(alumniDirectoryEntrySchema),
  /** The reader's own entry, for an alumnus; null for staff. */
  me: alumniDirectoryMeSchema.nullable(),
  /** Whether the reader may list themselves: an adult alumnus. */
  canJoin: z.boolean(),
});

/** PUT /api/v1/alumni/directory — join the directory, or change what it shows. */
export const alumniDirectoryJoinSchema = z.object({
  city: z.string().trim().max(80).optional().default(""),
  occupation: z.string().trim().max(120).optional().default(""),
  /** Required, so an empty body is a 422 rather than a join. */
  contactPref: alumniContactPrefSchema,
});
export type AlumniDirectoryJoin = z.infer<typeof alumniDirectoryJoinSchema>;

/** POST /api/v1/alumni/posts — share a post with the old school, held for the office. */
export const alumniPostSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(5_000).default(""),
});
export const alumniPostCreatedSchema = z.object({ postId: z.string(), status: z.enum(["PENDING", "APPROVED"]) });

/** POST /api/v1/alumni/conversations/close — staff close a room a former pupil writes in, or open it again. */
export const alumniConversationCloseSchema = z.object({ conversationId: cuid, closed: z.boolean() });
export const alumniConversationClosedSchema = z.object({ conversationId: z.string(), closedAt: isoOrNull, changed: z.boolean() });

export const alumniAdminRowSchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  name: z.string(),
  batchYear: z.number().int(),
  lastClass: z.string().nullable(),
  isMinor: z.boolean(),
  listed: z.boolean(),
  mentor: z.boolean(),
  muted: z.boolean(),
  muteReason: z.string().nullable(),
});

/** GET /api/v1/admin/alumni — the office's view: batches, every alumnus, notes sent. */
export const alumniAdminSchema = z.object({
  feedMode: alumniFeedModeSchema,
  batches: z.array(z.object({ year: z.number().int(), count: z.number().int().min(0), listed: z.number().int().min(0) })),
  alumni: z.array(alumniAdminRowSchema),
  notes: z.array(alumniNoteSchema.extend({ recipientCount: z.number().int().min(0) })),
});

/** POST /api/v1/admin/alumni/settings */
export const alumniSettingsSchema = z.object({ feedMode: alumniFeedModeSchema });
export const alumniSettingsResultSchema = z.object({ feedMode: alumniFeedModeSchema, changed: z.boolean() });

/** POST /api/v1/admin/alumni/mute — the office mutes an alumnus (a reason they are told) or lifts it. */
export const alumniMuteSchema = z.object({
  membershipId: cuid,
  muted: z.boolean(),
  reason: z.string().trim().max(300).optional(),
});

/** POST /api/v1/admin/alumni/mentor */
export const alumniMentorSchema = z.object({ membershipId: cuid, mentor: z.boolean() });

export const alumniFlagResultSchema = z.object({ membershipId: z.string(), changed: z.boolean() });

/** POST /api/v1/admin/alumni/notes — a note to one batch (the year they left), or to every alumnus. */
export const alumniNoteSendSchema = z.object({
  batchYear: z.number().int().min(1950).max(2100).nullable(),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(5_000),
});
export const alumniNoteSentSchema = z.object({ noteId: z.string(), recipientCount: z.number().int().min(0) });
