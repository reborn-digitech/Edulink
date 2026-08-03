"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setAttendanceRight, arrangeCover, cancelCover, type CoverInput } from "@/lib/register-duty";

/**
 * Staffing one class: who teaches it, who marks its register, and who covers.
 *
 * Every action re-reads the role from the SESSION and every id is re-scoped to
 * that session's school inside the library. A class id typed into the URL from
 * another school reaches "that class is not in this school", never somebody
 * else's staffing.
 */

type Result = { ok: boolean; error?: string };

function failure(error: unknown): Result {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[class-staffing]", error);
  return { ok: false, error: "Something went wrong. Try again in a moment." };
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
    return { ok: result.ok, error: result.error };
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
