"use server";

import type { TranslationKey } from "@/lib/i18n/dictionary";
import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setAttendanceRight, arrangeCover, cancelCover, type CoverInput } from "@/lib/register-duty";
import {
  assignTeacher,
  candidatesFor,
  enrolStudents,
  removeFromCohort,
  unassignTeacher,
} from "@/lib/cohort";

/**
 * Staffing one class: who teaches it, who marks its register, and who covers.
 *
 * Every action re-reads the role from the SESSION and every id is re-scoped to
 * that session's school inside the library. A class id typed into the URL from
 * another school reaches "that class is not in this school", never somebody
 * else's staffing.
 */

/**
 * ⚠ `errorKey` AND `error`, and the split is honest rather than untidy.
 *
 * `errorKey` is everything this file decides itself, returned as a key so the
 * form resolves it in the reader's language. `error` is the one case it cannot:
 * an `AccessError` from the tenancy layer, whose message is minted app-wide.
 */
type Result = { ok: boolean; error?: string;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
};

function failure(error: unknown): Result {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[class-staffing]", error);
  return { ok: false, errorKey: "common.tryAgainMoment" };
}

export async function toggleAttendanceRight(
  classId: string,
  classTeacherId: string,
  canTake: boolean,
): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await setAttendanceRight(ctx, classTeacherId, canTake);
    revalidatePath(`/admin/classes/${classId}`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function addCover(input: CoverInput): Promise<Result> {
  try {
    // PRINCIPAL as well as ADMIN: arranging cover is half of approving leave,
    // and a principal who could approve the leave but not arrange the cover
    // would be approving an unmarked register.
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const result = await arrangeCover(ctx, input);
    revalidatePath(`/admin/classes/${input.classId}`);
    return { ok: result.ok, errorKey: result.errorKey };
  } catch (error) {
    return failure(error);
  }
}

export async function removeCover(classId: string, coverId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const result = await cancelCover(ctx, coverId);
    revalidatePath(`/admin/classes/${classId}`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Staff                                                                       */
/* -------------------------------------------------------------------------- */

export async function addTeacher(
  classId: string,
  teacherMembershipId: string,
  role: "LEAD" | "CO",
): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await assignTeacher(ctx, classId, teacherMembershipId, { role });
    revalidatePath(`/admin/classes/${classId}`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function dropTeacher(classId: string, teacherMembershipId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await unassignTeacher(ctx, classId, teacherMembershipId);
    revalidatePath(`/admin/classes/${classId}`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Cohort                                                                      */
/* -------------------------------------------------------------------------- */

export async function searchCandidates(classId: string, query: string) {
  try {
    const ctx = await requireApiRole("ADMIN");
    return { ok: true as const, candidates: await candidatesFor(ctx, classId, query) };
  } catch (error) {
    return { ok: false as const, candidates: [], error: failure(error).error };
  }
}

export async function addToCohort(
  classId: string,
  studentMembershipIds: string[],
): Promise<Result & { added?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await enrolStudents(ctx, classId, studentMembershipIds);
    revalidatePath(`/admin/classes/${classId}`);
    return { ok: result.ok, errorKey: result.errorKey, added: result.added };
  } catch (error) {
    return failure(error);
  }
}

export async function dropFromCohort(
  classId: string,
  studentMembershipId: string,
): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await removeFromCohort(ctx, classId, studentMembershipId);
    revalidatePath(`/admin/classes/${classId}`);
    return result;
  } catch (error) {
    return failure(error);
  }
}
