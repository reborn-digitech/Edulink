import "server-only";
import { db } from "./db";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Admin setup checklist.
 *
 * Every step is DERIVED from real data rather than read from a stored "done"
 * flag. A flag drifts the moment someone deletes their only class, and then the
 * checklist cheerfully claims the school is set up when it is not. Deriving
 * costs five indexed counts and is always honest.
 *
 * ⚠ KEYS AND THEIR NUMBERS, NOT SENTENCES — the same rule as `ROLE_META` and
 * `ATTENDANCE_META`. This runs on the server with no idea who is reading, and
 * the honest thing for it to return is "the teachers step, with three" rather
 * than a finished English clause. `t` is applied by the page, in the reader's
 * language. It is also why the counted lines come in `…One`/`…Many` pairs:
 * "1 teachers have joined" is wrong in all three languages, and choosing
 * between two keys is the smallest thing that is right.
 */

export type ChecklistStep = {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  /** Substituted into `descriptionKey` by `t`. Absent when it has no `{…}`. */
  descriptionVars?: Record<string, string | number>;
  href: string;
  ctaKey: TranslationKey;
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
  const [teachers, classes, students, invites, school, posts, verifiedAdmins] = await Promise.all([
    db.membership.count({ where: { schoolId, role: "TEACHER", status: "ACTIVE" } }),
    db.class.count({ where: { schoolId, archivedAt: null } }),
    db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE" } }),
    db.invite.count({ where: { schoolId, status: "PENDING" } }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { logoPath: true, brandPrimary: true, verifiedAt: true },
    }),
    db.post.count({ where: { schoolId, status: "APPROVED" } }),
    // The verification link an admin is sent stamps THEIR account, not the
    // school; `school.verifiedAt` is the operator's own mark. The step is
    // done by either, otherwise a school that registered itself could never
    // tick it and "Finish setting up" sat at five of six forever.
    db.membership.count({
      where: { schoolId, role: "ADMIN", status: "ACTIVE", user: { emailVerifiedAt: { not: null } } },
    }),
  ]);

  const steps: ChecklistStep[] = [
    {
      id: "verify",
      titleKey: "checklist.verifyTitle",
      descriptionKey: "checklist.verifyBody",
      href: "/account/verify",
      ctaKey: "checklist.verifyCta",
      done: Boolean(school?.verifiedAt) || verifiedAdmins > 0,
    },
    {
      id: "teachers",
      titleKey: "checklist.teachersTitle",
      descriptionKey:
        teachers > 0
          ? teachers === 1
            ? "checklist.teachersJoinedOne"
            : "checklist.teachersJoinedMany"
          : invites > 0
            ? invites === 1
              ? "checklist.invitesWaitingOne"
              : "checklist.invitesWaitingMany"
            : "checklist.teachersBody",
      descriptionVars: { count: teachers > 0 ? teachers : invites },
      href: "/admin/invites/new?role=TEACHER",
      ctaKey: teachers > 0 ? "checklist.teachersMoreCta" : "checklist.teachersCta",
      done: teachers > 0,
    },
    {
      id: "classes",
      titleKey: "checklist.classesTitle",
      descriptionKey:
        classes > 0
          ? classes === 1
            ? "checklist.classesSetUpOne"
            : "checklist.classesSetUpMany"
          : "checklist.classesBody",
      descriptionVars: { count: classes },
      href: "/admin/classes/new",
      ctaKey: classes > 0 ? "checklist.classesMoreCta" : "checklist.classesCta",
      done: classes > 0,
    },
    {
      id: "students",
      titleKey: "checklist.studentsTitle",
      descriptionKey:
        students > 0
          ? students === 1
            ? "checklist.studentsJoinedOne"
            : "checklist.studentsJoinedMany"
          : "checklist.studentsBody",
      descriptionVars: { count: students },
      href: "/admin/invites/new?role=STUDENT",
      ctaKey: students > 0 ? "checklist.studentsMoreCta" : "checklist.studentsCta",
      done: students > 0,
      blockedBy: classes === 0 ? "classes" : undefined,
    },
    {
      id: "branding",
      titleKey: "checklist.brandingTitle",
      descriptionKey:
        school?.logoPath || school?.brandPrimary
          ? "checklist.brandingDone"
          : "checklist.brandingBody",
      href: "/admin/settings",
      ctaKey: "checklist.brandingCta",
      done: Boolean(school?.logoPath || school?.brandPrimary),
    },
    {
      id: "bulletin",
      titleKey: "checklist.bulletinTitle",
      descriptionKey: posts > 0 ? "checklist.bulletinDone" : "checklist.bulletinBody",
      href: "/bulletin/new",
      ctaKey: "checklist.bulletinCta",
      done: posts > 0,
    },
  ];

  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, complete: done === steps.length };
}
