"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { saveGradeCategories, WEIGHT_SCALE } from "@/lib/grading";

export type WeightsState = { ok: boolean; error?: string };

/**
 * Saves a class's grade weights.
 *
 * Takes PERCENTAGES as the teacher typed them and converts to basis points
 * here, at the boundary, so nothing above this line has to know the storage
 * unit. `20.5` becomes 2050; anything unparseable becomes 0 and is then caught
 * by the total check rather than being silently treated as a valid zero.
 */
export async function saveWeights(
  classId: string,
  rows: { name: string; percent: string }[],
): Promise<WeightsState> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");

    const categories = rows
      .filter((r) => r.name.trim().length > 0)
      .map((r) => {
        const parsed = Number.parseFloat(r.percent);
        const percent = Number.isFinite(parsed) ? parsed : 0;
        return {
          name: r.name,
          // Rounded to the nearest basis point, so 33.333 stores as 3333 and
          // the teacher is told the total is 99.99% rather than being silently
          // corrected to something they did not type.
          weightBps: Math.round((percent * WEIGHT_SCALE) / 100),
        };
      });

    await saveGradeCategories(ctx, classId, categories);
    revalidatePath(`/teacher/classes/${classId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[grade-weights]", error);
    return { ok: false, error: (await getT())("teacher.weightsSaveFailed") };
  }
}
