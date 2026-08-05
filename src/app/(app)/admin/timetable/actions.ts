"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import {
  createPeriod,
  updatePeriod,
  archivePeriod,
  restorePeriod,
  applySuggestedDay,
  setSlot,
  clearSlot,
  copyDay,
  type Result,
} from "@/lib/timetable";
import type { PeriodKind } from "@/lib/school-day";

/**
 * The timetable, from the admin's side.
 *
 * Role and school come from the SESSION on every call, never from the form —
 * the same rule as everywhere else. A forged `classId` is refused by the library
 * because every write re-queries the class with `schoolId` in the WHERE clause.
 */

function failure(error: unknown): Result {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[timetable]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/**
 * Every page that renders a timetable, because all of them read the same rows.
 *
 * A cached `/timetable` still showing yesterday's grid is the failure this
 * prevents, and it is a quiet one: the admin's page updates, so the change
 * looks like it landed, and the pupil who has to be somewhere sees the old one.
 */
function refresh() {
  revalidatePath("/admin/timetable");
  revalidatePath("/principal/timetable");
  revalidatePath("/timetable");
}

export async function savePeriod(input: {
  periodId?: string | null;
  name: string;
  startMinute: number;
  endMinute: number;
  kind: PeriodKind;
}): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = input.periodId
      ? await updatePeriod(ctx, input.periodId, input)
      : await createPeriod(ctx, input);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function retirePeriod(periodId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await archivePeriod(ctx, periodId);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function bringBackPeriod(periodId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await restorePeriod(ctx, periodId);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function useSuggestedDay(): Promise<Result & { created?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await applySuggestedDay(ctx);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function saveLesson(input: {
  classId: string;
  periodId: string;
  weekday: number;
  subject: string;
  teacherMembershipId?: string | null;
  room?: string | null;
}): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await setSlot(ctx, input);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function removeLesson(
  classId: string,
  weekday: number,
  periodId: string,
): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await clearSlot(ctx, classId, weekday, periodId);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function duplicateDay(
  classId: string,
  fromWeekday: number,
  toWeekday: number,
): Promise<Result & { copied?: number; unstaffed?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await copyDay(ctx, classId, fromWeekday, toWeekday);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}
