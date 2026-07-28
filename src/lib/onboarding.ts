import "server-only";
import { db } from "./db";

/**
 * Admin setup checklist.
 *
 * Every step is DERIVED from real data rather than read from a stored "done"
 * flag. A flag drifts the moment someone deletes their only class, and then the
 * checklist cheerfully claims the school is set up when it is not. Deriving
 * costs five indexed counts and is always honest.
 */

export type ChecklistStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
  /** Steps that only make sense once an earlier one is done. */
  blockedBy?: string;
};

export async function getChecklist(schoolId: string): Promise<{
  steps: ChecklistStep[];
  done: number;
  total: number;
  complete: boolean;
}> {
  const [teachers, classes, students, invites, school, posts] = await Promise.all([
    db.membership.count({ where: { schoolId, role: "TEACHER", status: "ACTIVE" } }),
    db.class.count({ where: { schoolId, archivedAt: null } }),
    db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE" } }),
    db.invite.count({ where: { schoolId, status: "PENDING" } }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { logoPath: true, brandPrimary: true, verifiedAt: true },
    }),
    db.post.count({ where: { schoolId, status: "APPROVED" } }),
  ]);

  const steps: ChecklistStep[] = [
    {
      id: "verify",
      title: "Confirm your email address",
      description: "We sent you a link. It keeps your school's account recoverable.",
      href: "/account/verify",
      cta: "Resend link",
      done: Boolean(school?.verifiedAt),
    },
    {
      id: "teachers",
      title: "Invite your teachers",
      description:
        teachers > 0
          ? `${teachers} ${teachers === 1 ? "teacher has" : "teachers have"} joined.`
          : invites > 0
            ? `${invites} ${invites === 1 ? "invitation is" : "invitations are"} waiting to be accepted.`
            : "Send invitations by email, or paste a list of everyone at once.",
      href: "/admin/invites/new?role=TEACHER",
      cta: teachers > 0 ? "Invite more" : "Invite teachers",
      done: teachers > 0,
    },
    {
      id: "classes",
      title: "Create your classes",
      description:
        classes > 0
          ? `${classes} ${classes === 1 ? "class" : "classes"} set up.`
          : "Each class gets its own join code and QR for students.",
      href: "/admin/classes/new",
      cta: classes > 0 ? "Add another" : "Create a class",
      done: classes > 0,
    },
    {
      id: "students",
      title: "Add your students",
      description:
        students > 0
          ? `${students} ${students === 1 ? "student has" : "students have"} joined.`
          : "Share the class code, or invite them by email.",
      href: "/admin/invites/new?role=STUDENT",
      cta: students > 0 ? "Add more" : "Add students",
      done: students > 0,
      blockedBy: classes === 0 ? "classes" : undefined,
    },
    {
      id: "branding",
      title: "Make it look like your school",
      description:
        school?.logoPath || school?.brandPrimary
          ? "Your colours are applied across the app."
          : "Add your logo and colour so families recognise it instantly.",
      href: "/admin/settings",
      cta: "Customise",
      done: Boolean(school?.logoPath || school?.brandPrimary),
    },
    {
      id: "bulletin",
      title: "Post your first bulletin",
      description:
        posts > 0
          ? "Your noticeboard is live."
          : "Say hello. It is the first thing families will see.",
      href: "/bulletin/new",
      cta: "Write a post",
      done: posts > 0,
    },
  ];

  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, complete: done === steps.length };
}
