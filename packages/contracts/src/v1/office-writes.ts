import { z } from "zod";
import { guardianRelationSchema } from "./community";

/**
 * The rest of the web-only writes that a phone user needs, as doors
 * (A3-inventory-7, R-3, R-50; risks batch of 5 October 2026): reopen a closed
 * year, pin a post, close a review round, a class's teachers and who marks its
 * register, cancel a register cover, invite one parent or one expert, take a
 * paper off a date sheet, lay out the suggested school day, and the content
 * team's delete of a bank question. Each body is what the web's server action
 * already takes; the rules stay in the library the action and the door call.
 */

const id = z.string().min(1).max(64);
const count = z.number().int();

/** POST /api/v1/admin/calendar/years/{yearId}/reopen — the exam series the close archived, put back. */
export const academicYearReopenedSchema = z.object({ seriesRestored: count });

/** POST /api/v1/shared/bulletin/{postId}/pin — the state asked for (a replay is a no-op), answered with the post's state after the call. */
export const postPinBodySchema = z.object({ pinned: z.boolean() });
export const postPinnedSchema = z.object({ pinned: z.boolean() });

/** POST /api/v1/admin/classes/{classId}/teachers — a teacher on the class: the lead, a co-teacher, or a subject teacher who never marks the register. */
export const classTeacherRoleSchema = z.enum(["LEAD", "CO", "SUBJECT"]);
export const classTeacherAddBodySchema = z.object({ teacherMembershipId: id, role: classTeacherRoleSchema });
/** POST /api/v1/admin/classes/{classId}/teachers/remove — one teacher off the class. */
export const classTeacherRemoveBodySchema = z.object({ teacherMembershipId: id });
/** POST /api/v1/admin/classes/{classId}/teachers/register — whether a teacher on the class may mark its register. */
export const attendanceRightBodySchema = z.object({ teacherMembershipId: id, canTake: z.boolean() });

/** POST /api/v1/admin/people/{membershipId}/parents — invite one parent or guardian to a pupil by email. */
export const parentInviteBodySchema = z.object({
  email: z.string().trim().min(3).max(254),
  name: z.string().trim().max(120).optional(),
  relation: guardianRelationSchema,
});
export const parentInvitedSchema = z.object({ inviteId: id });

/**
 * POST /api/v1/staff/experts/invite — invite an expert BY ADDRESS. The
 * invitation's link goes to that mailbox and nowhere else (QA-01, 24 Oct
 * 2026): the door once answered the link itself, so any staff member could
 * hold a working link to somebody else's address, and the invite page's
 * reclaim of an unproved address rests on "whoever opens the link controls
 * the mailbox". An address is therefore required; a name alone is refused.
 */
export const expertInviteBodySchema = z.object({ email: z.string().trim().email().max(254), name: z.string().trim().min(1).max(120).optional() });
/** The invitation's id, whether its mail went, and when it lapses. Never the token or the link. */
export const expertInvitedSchema = z.object({ inviteId: id, sent: z.boolean(), expiresAt: z.string().datetime() });

/** POST /api/v1/admin/timetable/periods/suggested — a first school day for a school that has none. */
export const suggestedDayAppliedSchema = z.object({ created: count });
