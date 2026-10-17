import "server-only";
import type { AssistantAskPerson } from "@edulink/contracts";
import { db } from "../db";
import { mayConverse } from "../conversations";
import type { Role } from "../constants";
import { pageIsRoles } from "./pages";

/**
 * "ASK A PERSON" (docs/plans/vidura.md, the coordinator's recommendation accepted into the plan; pass 1, 17 Oct 2026).
 *
 * When Vidura cannot answer, the one human at the conversation's school who can, reached through the messaging the
 * platform already has (src/lib/conversations.ts): the surfaces open — or find — the room with that person, exactly
 * as the "Message" button on a profile does, and nothing of the question is carried into it.
 *
 *   a pupil, and a guardian (for the first of their children at the school): the class teacher of the pupil's class;
 *   anyone else, and a pupil or a guardian whose class has no teacher: the office — at a college, the registrar's
 *   office (the college's ADMIN), and for the office itself the head.
 *
 * Offered only to a role whose menu carries the messages (`/remarks`), and only where the messaging rule lets the
 * pair write (`mayConverse`): never widened here. The person's own membership is never the answer.
 */
export async function askPersonFor(input: { role: Role; userId: string; membershipId: string | null; schoolId: string; college: boolean }): Promise<AssistantAskPerson | null> {
  if (!pageIsRoles("/remarks", input.role)) return null;
  const { schoolId } = input;

  let pupilMembershipId: string | null = input.role === "STUDENT" ? input.membershipId : null;
  if (input.role === "PARENT") {
    const link = await db.guardianship.findFirst({
      where: { parentUserId: input.userId, studentSchoolId: schoolId, status: "ACTIVE", relation: { not: "SCHOOL" }, student: { status: "ACTIVE", leftAt: null } },
      orderBy: { createdAt: "asc" },
      select: { studentMembershipId: true },
    });
    pupilMembershipId = link?.studentMembershipId ?? null;
  }
  if (pupilMembershipId && mayConverse(input.role, "TEACHER")) {
    const enrolment = await db.enrollment.findFirst({ where: { schoolId, studentMembershipId: pupilMembershipId, status: "ACTIVE" }, orderBy: { enrolledAt: "desc" }, select: { classId: true } });
    const lead = enrolment
      ? await db.classTeacher.findFirst({ where: { schoolId, classId: enrolment.classId, role: "LEAD" }, orderBy: { id: "asc" }, select: { teacherMembershipId: true } })
      : null;
    const teacher = lead ? await db.membership.findFirst({ where: { id: lead.teacherMembershipId, schoolId, status: "ACTIVE", leftAt: null }, select: { userId: true } }) : null;
    if (teacher && teacher.userId !== input.userId) return { who: "CLASS_TEACHER", schoolId, userId: teacher.userId };
  }

  const want: Role = input.role === "ADMIN" ? "PRINCIPAL" : "ADMIN";
  if (!mayConverse(input.role, want)) return null;
  const person = await db.membership.findFirst({
    where: { schoolId, role: want, status: "ACTIVE", leftAt: null, userId: { not: input.userId } },
    orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
    select: { userId: true },
  });
  if (!person) return null;
  return { who: want === "PRINCIPAL" ? "HEAD" : input.college ? "REGISTRAR" : "OFFICE", schoolId, userId: person.userId };
}
