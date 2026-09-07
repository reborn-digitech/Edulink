"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { saveMarks } from "@/lib/exams";
import { getT } from "@/lib/i18n/server";

/**
 * One class's marks for one paper, straight off the grid. Field names carry the
 * membership id (`marks-<id>`); a blank clears, which is how an absent child is
 * recorded — the lib refuses anything over the paper's maximum.
 */
export async function saveMarksAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("TEACHER");
  const slotId = String(formData.get("slotId") ?? "");
  const classId = String(formData.get("classId") ?? "");

  const entries: { membershipId: string; marks: number | null }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("marks-")) continue;
    const membershipId = key.slice("marks-".length);
    const raw = String(value).trim();
    entries.push({ membershipId, marks: raw === "" ? null : Number(raw) });
  }

  const back = `/teacher/exams?slotId=${slotId}&classId=${classId}`;
  try {
    await saveMarks(ctx, slotId, classId, entries);
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`${back}&error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
  revalidatePath("/teacher/exams");
  redirect(`${back}&saved=1`);
}
