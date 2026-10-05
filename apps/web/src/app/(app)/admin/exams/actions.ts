"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { createSeries, addSlot, removeSlot, publishSeries, archiveSeries } from "@/lib/exams";
import { getT } from "@/lib/i18n/server";
import { answerForm } from "@/lib/form-action";
import type { FieldMap, FormState } from "@/lib/form-state";

/** "09:15" -> 555. Empty or malformed -> null: the time is optional on a sheet. */
function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes >= 0 && minutes < 1440 ? minutes : null;
}

async function run(block: () => Promise<void>): Promise<void> {
  try {
    await block();
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`/admin/exams?error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

/**
 * The two forms that are typed into answer in place (A3-journeys-27): a
 * refusal keeps what was typed and sits under the box it is about — a Sunday
 * or a holiday under the day, a clash under the start — instead of at the
 * page's top over an emptied form. Which box each of the library's refusals
 * is about:
 */
const SERIES_FIELDS: FieldMap = {
  "access.giveTheExamAName": "name",
  "access.thatExamAlreadyExists": "name",
  "access.chooseAGradeForTheExam": "gradeLevel",
  "access.termNotFound": "termId",
};
const PAPER_FIELDS: FieldMap = {
  "access.giveTheSubjectAName": "subject",
  "access.pickADayForThePaper": "dateKey",
  "access.paperOnSunday": "dateKey",
  "access.paperOnHoliday": "dateKey",
  "access.maxMarksOutOfRange": "maxMarks",
  "access.papersClash": "startTime",
};

/** A new series says so and is brought into view (it is listed by grade, so it may land anywhere on the page). */
export async function createSeriesAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiRole("ADMIN");
      const name = String(formData.get("name") ?? "");
      const id = await createSeries(ctx, {
        name,
        gradeLevel: String(formData.get("gradeLevel") ?? ""),
        kind: String(formData.get("kind") ?? ""),
        termId: String(formData.get("termId") ?? "") || null,
      });
      return { key: "exams.seriesCreated", vars: { name: name.trim() }, reveal: `series-${id}` };
    },
    { revalidate: ["/admin/exams"], fields: SERIES_FIELDS },
  );
}

export async function addSlotAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiRole("ADMIN");
      await addSlot(ctx, String(formData.get("seriesId") ?? ""), {
        subject: String(formData.get("subject") ?? ""),
        dateKey: String(formData.get("dateKey") ?? ""),
        maxMarks: Number(formData.get("maxMarks") ?? 0),
        startMinute: parseTime(String(formData.get("startTime") ?? "")),
        endMinute: parseTime(String(formData.get("endTime") ?? "")),
        evenIfClosed: formData.get("evenIfClosed") === "on",
      });
      return { key: "exams.paperAdded", vars: { subject: String(formData.get("subject") ?? "").trim() } };
    },
    { revalidate: ["/admin/exams"], fields: PAPER_FIELDS },
  );
}

export async function removeSlotAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("ADMIN");
  await run(() => removeSlot(ctx, String(formData.get("slotId") ?? "")));
}

export async function publishSeriesAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("ADMIN");
  await run(() => publishSeries(ctx, String(formData.get("seriesId") ?? "")));
}

export async function archiveSeriesAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("ADMIN");
  await run(() => archiveSeries(ctx, String(formData.get("seriesId") ?? "")));
}
