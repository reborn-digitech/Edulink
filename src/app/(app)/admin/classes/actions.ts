"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApiRole, assertClassAccess, AccessError } from "@/lib/tenancy";
import { classSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { classCode } from "@/lib/codes";
import { audit } from "@/lib/audit";

export type ClassState = { ok: boolean; errors: FieldErrors; classId?: string; joinCode?: string };

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
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { name, subject, gradeLevel, room, color } = parsed.data;

  const duplicate = await db.class.findFirst({
    where: { schoolId: ctx.schoolId, name, archivedAt: null },
    select: { id: true },
  });
  if (duplicate) {
    return {
      ok: false,
      errors: { name: "A class with that name already exists. Give this one a different name." },
    };
  }

  // joinCode is globally unique; retry on the (very unlikely) collision rather
  // than pre-checking, which would still race.
  let created: { id: string; joinCode: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = classCode();
    const clash = await db.class.findUnique({ where: { joinCode: code }, select: { id: true } });
    if (clash) continue;
    created = await db.class.create({
      data: {
        schoolId: ctx.schoolId,
        name,
        subject: subject || null,
        gradeLevel: gradeLevel || null,
        room: room || null,
        color: color || null,
        joinCode: code,
      },
      select: { id: true, joinCode: true },
    });
    break;
  }

  if (!created) {
    return { ok: false, errors: { _form: "Could not allocate a class code. Please try again." } };
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "class.create",
    targetType: "Class",
    targetId: created.id,
    meta: { name },
  });

  revalidatePath("/admin/classes");
  revalidatePath("/admin");
  return { ok: true, errors: {}, classId: created.id, joinCode: created.joinCode };
}

/** Assigns or unassigns a teacher. Both ids are re-checked against the school. */
export async function setClassTeacher(
  classId: string,
  teacherMembershipId: string,
  assign: boolean,
): Promise<{ ok: boolean; error?: string }> {
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
    if (!teacher) return { ok: false, error: "That teacher is not in your school." };

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

    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[setClassTeacher]", error);
    return { ok: false, error: "Something went wrong." };
  }
}

/**
 * Archive rather than delete.
 *
 * A class owns attendance history and grades. Deleting it would take a term of
 * a child's record with it, so archiving is the only destructive action offered
 * here — and it is reversible. (§10)
 */
export async function archiveClass(classId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await assertClassAccess(ctx, classId, { write: true });

    await db.class.update({ where: { id: classId }, data: { archivedAt: new Date() } });
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
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[archiveClass]", error);
    return { ok: false, error: "Something went wrong." };
  }
}

export async function restoreClass(classId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    // assertClassAccess rejects archived classes for writes, so scope by hand.
    const klass = await db.class.findFirst({
      where: { id: classId, schoolId: ctx.schoolId },
      select: { id: true },
    });
    if (!klass) return { ok: false, error: "Class not found in your school." };

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
    if (error instanceof AccessError) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}

/** Rotates the join code — the fix when a class code leaks outside the school. */
export async function regenerateJoinCode(
  classId: string,
): Promise<{ ok: boolean; joinCode?: string; error?: string }> {
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
    return { ok: false, error: "Could not allocate a new code. Please try again." };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}

function accessFailure(error: unknown): ClassState {
  if (error instanceof AccessError) {
    return { ok: false, errors: { _form: error.message } };
  }
  console.error("[classes] unexpected", error);
  return { ok: false, errors: { _form: "Something went wrong." } };
}
