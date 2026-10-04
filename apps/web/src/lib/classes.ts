import "server-only";
import { db } from "./db";
import { classCode } from "./codes";
import { audit } from "./audit";
import { gradesInRange } from "./superuser";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * MAKING A CLASS, as a library function (LIFECYCLE-11, 4 Oct 2026). Promotion
 * makes next year's classes from this year's, but a new lowest grade could
 * only be made by the office's server action, so a script, a test or a
 * future API door had to write the row by hand. The action now calls this.
 *
 * The caller has established that the person is the school's ADMIN; the
 * school comes from the caller, never the form. The grade must be one the
 * school teaches, a live class may not share a name, and the join code is
 * globally unique (retried on the unlikely collision rather than pre-checked).
 */
export type ClassInput = { name: string; subject?: string | null; gradeLevel?: string | null; section?: string | null; room?: string | null; color?: string | null };
export type ClassCreated =
  | { ok: true; classId: string; joinCode: string }
  | { ok: false; field: "name" | "gradeLevel" | "_form"; errorKey: TranslationKey; vars?: Record<string, string | number> };

export async function createClassIn(schoolId: string, actorUserId: string, input: ClassInput): Promise<ClassCreated> {
  const { name, subject, gradeLevel, section, room, color } = input;
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { gradeLow: true, gradeHigh: true } });
  const offered = gradesInRange(school.gradeLow, school.gradeHigh);
  if (gradeLevel && offered.length > 0 && !offered.includes(gradeLevel)) {
    return { ok: false, field: "gradeLevel", errorKey: "classes.gradeOutOfRange", vars: { low: school.gradeLow ?? "", high: school.gradeHigh ?? "" } };
  }
  const duplicate = await db.class.findFirst({ where: { schoolId, name, archivedAt: null }, select: { id: true } });
  if (duplicate) return { ok: false, field: "name", errorKey: "classes.duplicateName" };

  let created: { id: string; joinCode: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = classCode();
    const clash = await db.class.findUnique({ where: { joinCode: code }, select: { id: true } });
    if (clash) continue;
    created = await db.class.create({
      data: { schoolId, name, subject: subject || null, gradeLevel: gradeLevel || null, section: section || null, room: room || null, color: color || null, joinCode: code },
      select: { id: true, joinCode: true },
    });
    break;
  }
  if (!created) return { ok: false, field: "_form", errorKey: "classes.couldNotAllocateCode" };
  await audit({ schoolId, actorUserId, action: "class.create", targetType: "Class", targetId: created.id, meta: { name } });
  return { ok: true, classId: created.id, joinCode: created.joinCode };
}
