import "server-only";
import type { z } from "zod";
import type { CourseAttendance, academicsTimetableSchema } from "@edulink/contracts";
import { academicsCaller, timetableFor } from "./academics";
import { familyAcademics } from "./academics-homes";
import { assertModuleOn } from "./modules";
import { AccessError } from "./access-error";
import { assertGuardianAccess } from "./tenancy";
import type { ActiveContext } from "./session";

/**
 * THE WEEK OF LECTURES, FOR A STUDENT AND FOR A GUARDIAN (DS-3 of the stream
 * demos' walk, 10 Oct 2026). /timetable and /parent/timetable read the
 * school's TimetableSlot grid, which a college never fills, so a college
 * student's week said "Nothing timetabled yet" while the registrar's
 * timetable at /admin/academics held every lecture. The college's week is
 * the OfferingSlot rows of the offerings the student is registered on this
 * term — exactly what `timetableFor` builds for a STUDENT caller — so these
 * two call it: the student as themselves, the guardian through the
 * guardianship (an adult's under ATTENDANCE, the grant the lecture register
 * already opens on). The term's grid is a template, not a dated week, so a
 * college page draws no week arrows.
 */

export type CollegeWeek = z.infer<typeof academicsTimetableSchema>;

/**
 * A college child's lecture attendance for the guardian (DS-2): what
 * /parent/academics draws, under ATTENDANCE for an adult. A child with no
 * academic seat yet is not on that page's list at all (it answers 404 for
 * the id), and has no lectures: an empty list here, not a refusal.
 */
export async function familyLectureAttendance(ctx: ActiveContext, childId: string): Promise<CourseAttendance[]> {
  try {
    return (await familyAcademics(ctx, childId)).attendance;
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") return [];
    throw error;
  }
}

/** A college student's own week: the lectures of the offerings they are registered on this term. */
export async function myCollegeWeek(ctx: ActiveContext): Promise<CollegeWeek> {
  const c = await academicsCaller(ctx, ["STUDENT"]);
  return timetableFor(c, {});
}

/** A guardian's read of a college child's week; the child's college must have ACADEMICS on (every college has). */
export async function familyCollegeWeek(ctx: ActiveContext, childId: string): Promise<CollegeWeek> {
  const link = await assertGuardianAccess(ctx.user.id, childId, "ATTENDANCE");
  await assertModuleOn(link.student.schoolId, "ACADEMICS");
  return timetableFor({ schoolId: link.student.schoolId, userId: link.student.user.id, membershipId: childId, role: "STUDENT", timeZone: link.student.school.timezone }, {});
}
