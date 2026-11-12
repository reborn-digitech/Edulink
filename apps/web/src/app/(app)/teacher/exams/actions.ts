"use server";

import { requireApiRole } from "@/lib/tenancy";
import { saveMarks } from "@/lib/exams";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * One class's marks for one paper, straight off the grid. Field names carry the
 * membership id (`marks-<id>`); a blank clears, which is how an absent child is
 * recorded — the lib refuses anything over the paper's maximum.
 *
 * The answer comes back in place (<ActionForm>, A3-journeys-27): a refusal
 * sits by the button with every mark still typed, and a save re-draws the
 * sheet with what was kept and shows the saved note under it. Until 13
 * November 2026 the action redirected to the same address with ?saved=1 (or
 * ?error=), and the client router took the new address but never drew the
 * new page when only the query changed — the saved note never appeared, on
 * the runner (CI runs 41415675038, 41454850718, 43309259037) and against a
 * production build here alike, with or without a revalidation marked on the
 * answer, while a fresh document of the same address held it.
 */
export async function saveMarksAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
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

      await saveMarks(ctx, slotId, classId, entries);
      // Nothing for a toast: the sheet itself says it was saved (MarksForm's note).
      return null;
    },
    { revalidate: ["/teacher/exams"] },
  );
}
