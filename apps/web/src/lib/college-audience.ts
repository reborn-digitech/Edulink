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
    if (!(await parentMaySee(c.studentMembershipId, "MESSAGES", user.id))) continue;
    for (const t of await studentTokens(c.studentMembershipId)) out.add(t);
  }
  return [...out];
}

/** One student's audience tokens, for a reader of a notice who is not the student (a permission slip's audience, 5 Oct 2026). */
export const studentTokensOf = (studentMembershipId: string): Promise<string[]> => studentTokens(studentMembershipId);

/**
 * MANY STUDENTS' TOKENS IN A BOUNDED NUMBER OF READS (R-54, 5 October 2026):
 * the same tokens as `studentTokens`, for a whole slip's audience at once —
 * three reads per thousand students (their seats, their live programme
 * enrolments, the programmes' departments) instead of up to three per
 * student, which for a college-wide slip was up to 15,000 reads per report.
 */
export async function studentTokensMany(studentMembershipIds: readonly string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const ids = [...new Set(studentMembershipIds)];
  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000);
    const [seats, enrolments] = await Promise.all([
      db.studentProgramme.findMany({ where: { studentMembershipId: { in: chunk } }, select: { studentMembershipId: true, programmeId: true, divisionId: true, entryYear: true, programme: { select: { departmentId: true } } } }),
      db.programmeEnrolment.findMany({ where: { studentMembershipId: { in: chunk }, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, select: { studentMembershipId: true, programmeId: true, yearOfEntry: true } }),
    ]);
    const seatOf = new Map(seats.map((s) => [s.studentMembershipId, s]));
    // The newest live enrolment, as studentTokens's findFirst takes it.
    const enrolmentOf = new Map<string, (typeof enrolments)[number]>();
    for (const e of enrolments) if (!enrolmentOf.has(e.studentMembershipId)) enrolmentOf.set(e.studentMembershipId, e);
    const bare = [...new Set(chunk.filter((id) => !seatOf.has(id)).map((id) => enrolmentOf.get(id)?.programmeId).filter((x): x is string => Boolean(x)))];
    const deptOf = new Map(bare.length ? (await db.programme.findMany({ where: { id: { in: bare } }, select: { id: true, departmentId: true } })).map((p) => [p.id, p.departmentId]) : []);
    for (const id of chunk) {
      const seat = seatOf.get(id);
      const enrolment = enrolmentOf.get(id);
      const programmeId = seat?.programmeId ?? enrolment?.programmeId ?? null;
      const departmentId = seat?.programme.departmentId ?? (programmeId ? deptOf.get(programmeId) : null) ?? null;
      const entry = seat?.entryYear ?? enrolment?.yearOfEntry ?? null;
      out.set(id, [
        ...(programmeId ? [`PROGRAMME:${programmeId}`] : []),
        ...(departmentId ? [`DEPARTMENT:${departmentId}`] : []),
        ...(seat?.divisionId ? [`DIVISION:${seat.divisionId}`] : []),
        ...(entry ? [`BATCH:${entry}`] : []),
      ]);
    }
  }
  return out;
}
