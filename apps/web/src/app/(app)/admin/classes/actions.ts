"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "@/lib/db";
import { requireApiRole, assertClassAccess, AccessError } from "@/lib/tenancy";
import { classSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { classCode } from "@/lib/codes";
import { audit } from "@/lib/audit";
import { syncStandinsForClass } from "@/lib/standin-guardian";
import { createClassIn } from "@/lib/classes";

/**
 * ⚠ `errorKey` AND `error`, and the split is honest rather than untidy.
 *
 * `errorKey` is everything this file decides itself, returned as a key so the
 * form resolves it in the reader's language. `error` is the one case it cannot:
 * an `AccessError` from the tenancy layer, whose message is minted app-wide.
 */
export type ClassActionResult = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  error?: string;
};

/**
 * ⚠ TWO ERROR CHANNELS, AND THE SPLIT IS THE ZOD LAYER'S FAULT, NOT A WHIM.
 *
 * `errors` is filled by `fieldErrors(parsed.error, t)` — the custom messages on
 * the shared schemas are keys and arrive translated. What remains English in
 * that channel is zod's own DEFAULTS (a bare `.min(2)` on a name bound);
 * keying every last bound is its own change, noted in `validation.ts`.
 *
 * `errorKeys` is what THIS file decides, keyed, so the three messages an admin
 * actually meets on the class form — a duplicate name, a grade the school does
 * not teach, a code that would not mint — arrive in their language.
 *
 * The form merges them, keyed last. Mixing keys and finished sentences in one
 * map is what this avoids: the renderer would have no way to tell which it held.
 */
export type ClassState = {
  ok: boolean;
  errors: FieldErrors;
  errorKeys?: Record<string, TranslationKey>;
  errorVars?: Record<string, Record<string, string | number>>;
  classId?: string;
  joinCode?: string;
};

/**
 * Creates a class.
 *
 * `schoolId` comes from the session, never the form — so a forged hidden field
 * cannot plant a class in another school. Same rule everywhere. (§6)
 */
export async function createClass(input: unknown): Promise<ClassState> {
  let ctx;
  try {
    ctx = await requireApiRole("ADMIN");
  } catch (error) {
    return accessFailure(error);
  }

  const parsed = classSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, await getT()) };

  // The rules live in lib/classes.ts (LIFECYCLE-11), so a script or a door makes a class the same way.
  const made = await createClassIn(ctx.schoolId, ctx.user.id, parsed.data);
  if (!made.ok) {
    return { ok: false, errors: {}, errorKeys: { [made.field]: made.errorKey }, ...(made.vars ? { errorVars: { [made.field]: made.vars } } : {}) };
  }

  revalidatePath("/admin/classes");
  revalidatePath("/admin");
  return { ok: true, errors: {}, classId: made.classId, joinCode: made.joinCode };
}

/** Assigns or unassigns a teacher. Both ids are re-checked against the school. */
export async function setClassTeacher(
  classId: string,
  teacherMembershipId: string,
  assign: boolean,
): Promise<ClassActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await assertClassAccess(ctx, classId, { write: true });

    // The teacher must belong to THIS school — otherwise an admin could attach
    // a membership id copied from anywhere.
    const teacher = await db.membership.findFirst({
      where: {
        id: teacherMembershipId,
        schoolId: ctx.schoolId,
        role: "TEACHER",
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!teacher) return { ok: false, errorKey: "classes.teacherNotInSchool" };

    if (assign) {
      await db.classTeacher.upsert({
        where: { classId_teacherMembershipId: { classId, teacherMembershipId } },
        create: { classId, schoolId: ctx.schoolId, teacherMembershipId, role: "LEAD" },
        update: {},
      });
    } else {
      await db.classTeacher.deleteMany({ where: { classId, teacherMembershipId } });
    }

    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: assign ? "class.teacher.assign" : "class.teacher.remove",
      targetType: "Class",
      targetId: classId,
      meta: { teacherMembershipId },
    });

    // Either direction changes who the right stand-in guardian is for the
    // class's unclaimed pupils — the new teacher takes over, or the departing
    // one's guardianships pass to whoever remains. See standin-guardian.ts.
    await syncStandinsForClass({
      schoolId: ctx.schoolId!,
      classId,
      actorUserId: ctx.user.id,
    }).catch((error) => console.error("[setClassTeacher] standin sync failed", error));

    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[setClassTeacher]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

/**
 * Archive rather than delete.
 *
 * A class owns attendance history and grades. Deleting it would take a term of
 * a child's record with it, so archiving is the only destructive action offered
 * here — and it is reversible. (§10)
 */
export async function archiveClass(classId: string): Promise<ClassActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await assertClassAccess(ctx, classId, { write: true });

    await db.class.update({ where: { id: classId }, data: { archivedAt: new Date() } });
    // The archived class releases its teachers: slots keep subject and room
    // as history, but must not block the living timetable's clash checks.
    // (Restoring the class brings back its shape, not its staffing — the
    // classes page already flags unstaffed lessons.)
    await db.timetableSlot.updateMany({
      where: { classId, teacherMembershipId: { not: null } },
      data: { teacherMembershipId: null },
    });
    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "class.archive",
      targetType: "Class",
      targetId: classId,
    });

    revalidatePath("/admin/classes");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[archiveClass]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

export async function restoreClass(classId: string): Promise<ClassActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    // assertClassAccess rejects archived classes for writes, so scope by hand.
    const klass = await db.class.findFirst({
      where: { id: classId, schoolId: ctx.schoolId },
      select: { id: true },
    });
    if (!klass) return { ok: false, errorKey: "classes.classNotFound" };

    await db.class.update({ where: { id: classId }, data: { archivedAt: null } });
    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "class.restore",
      targetType: "Class",
      targetId: classId,
    });
    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

/** Rotates the join code — the fix when a class code leaks outside the school. */
export async function regenerateJoinCode(
  classId: string,
): Promise<ClassActionResult & { joinCode?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await assertClassAccess(ctx, classId, { write: true });

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = classCode();
      const clash = await db.class.findUnique({ where: { joinCode: code }, select: { id: true } });
      if (clash) continue;
      await db.class.update({ where: { id: classId }, data: { joinCode: code } });
      await audit({
        schoolId: ctx.schoolId,
        actorUserId: ctx.user.id,
        action: "class.code.rotate",
        targetType: "Class",
        targetId: classId,
      });
      revalidatePath("/admin/classes");
      return { ok: true, joinCode: code };
    }
    return { ok: false, errorKey: "classes.couldNotAllocateNewCode" };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

async function accessFailure(error: unknown): Promise<ClassState> {
  if (error instanceof AccessError) {
    // The throw site mints a KEY; this boundary owns the words.
    return { ok: false, errors: { _form: (await getT())(error.key, error.vars) } };
  }
  console.error("[classes] unexpected", error);
  return { ok: false, errors: {}, errorKeys: { _form: "common.somethingWrong" } };
}
