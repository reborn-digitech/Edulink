import "server-only";
import { isCollegeKind, type AudienceTarget } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { parentMaySee } from "./student-consent";
import type { ActiveContext } from "./session";

/**
 * WHOM A COLLEGE NOTICE IS FOR (4 October 2026). The school's bulletin narrows
 * a school-wide post by audience (families, staff, pupils) and by grade; a
 * college narrows it further to one programme, one department, one division
 * or one batch (the intake year). The target is kept on the post as a token
 * — "PROGRAMME:<id>", "DEPARTMENT:<id>", "DIVISION:<id>", "BATCH:2026" —
 * and the feed keeps a targeted post for the students it names and their
 * families (a guardian of an adult only while MESSAGES is granted). Like the
 * grade, it is a courtesy filter at query time, never a secrecy boundary:
 * RLS still shows the row to the whole college.
 *
 * A token always holds a colon; a grade level never does, so the bulletin
 * carries the reader's tokens in the same list as their grades
 * (`isTargetToken` tells them apart).
 */

export const isTargetToken = (s: string) => s.includes(":");

/** The token a post stores for a target, after checking the target is this college's. */
export async function targetToken(schoolId: string, target: AudienceTarget): Promise<string> {
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { kind: true } });
  if (!isCollegeKind(school?.kind ?? "SCHOOL")) throw new AccessError("collegeOffice.refuseNotCollege", "NOT_FOUND");
  const id = target.id.trim();
  const found =
    target.kind === "PROGRAMME"
      ? await db.programme.findFirst({ where: { id, schoolId }, select: { id: true } })
      : target.kind === "DEPARTMENT"
        ? await db.department.findFirst({ where: { id, schoolId }, select: { id: true } })
        : target.kind === "DIVISION"
          ? await db.division.findFirst({ where: { id, schoolId }, select: { id: true } })
          : /^\d{4}$/.test(id)
            ? { id }
            : null;
  if (!found) throw new AccessError("collegeOffice.refuseAudienceTarget");
  return `${target.kind}:${id}`;
}

/** One student's tokens: their programme, its department, their division and their batch. */
async function studentTokens(studentMembershipId: string): Promise<string[]> {
  const [seat, enrolment] = await Promise.all([
    db.studentProgramme.findUnique({ where: { studentMembershipId }, select: { programmeId: true, divisionId: true, entryYear: true, programme: { select: { departmentId: true } } } }),
    db.programmeEnrolment.findFirst({ where: { studentMembershipId, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, select: { programmeId: true, yearOfEntry: true } }),
  ]);
  const programmeId = seat?.programmeId ?? enrolment?.programmeId ?? null;
  const departmentId = seat?.programme.departmentId ?? (programmeId ? (await db.programme.findUnique({ where: { id: programmeId }, select: { departmentId: true } }))?.departmentId : null) ?? null;
  const entry = seat?.entryYear ?? enrolment?.yearOfEntry ?? null;
  return [
    ...(programmeId ? [`PROGRAMME:${programmeId}`] : []),
    ...(departmentId ? [`DEPARTMENT:${departmentId}`] : []),
    ...(seat?.divisionId ? [`DIVISION:${seat.divisionId}`] : []),
    ...(entry ? [`BATCH:${entry}`] : []),
  ];
}

/**
 * The reader's tokens at the session's college: a student's own; a guardian's
 * for each child there whose notices they may read (a minor's always, an
 * adult's while MESSAGES is granted). Empty at a school, and for staff, who
 * read every notice.
 */
export async function audienceTokensFor(session: ActiveContext): Promise<string[]> {
  const { schoolId, membershipId, role, user } = session;
  if (!schoolId || (role !== "STUDENT" && role !== "PARENT")) return [];
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { kind: true } });
  if (!isCollegeKind(school?.kind ?? "SCHOOL")) return [];
  if (role === "STUDENT") return membershipId ? studentTokens(membershipId) : [];
  const children = await db.guardianship.findMany({ where: { parentUserId: user.id, status: "ACTIVE", studentSchoolId: schoolId }, select: { studentMembershipId: true } });
  const out = new Set<string>();
  for (const c of children) {
    if (!(await parentMaySee(c.studentMembershipId, "MESSAGES"))) continue;
    for (const t of await studentTokens(c.studentMembershipId)) out.add(t);
  }
  return [...out];
}
