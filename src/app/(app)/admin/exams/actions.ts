"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { createSeries, addSlot, removeSlot, publishSeries, archiveSeries } from "@/lib/exams";
import { getT } from "@/lib/i18n/server";

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

export async function createSeriesAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("ADMIN");
  await run(() =>
    createSeries(ctx, {
      name: String(formData.get("name") ?? ""),
      gradeLevel: String(formData.get("gradeLevel") ?? ""),
      kind: String(formData.get("kind") ?? ""),
      termId: String(formData.get("termId") ?? "") || null,
    }).then(() => undefined),
  );
}

export async function addSlotAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("ADMIN");
  await run(() =>
    addSlot(ctx, String(formData.get("seriesId") ?? ""), {
      subject: String(formData.get("subject") ?? ""),
      dateKey: String(formData.get("dateKey") ?? ""),
      maxMarks: Number(formData.get("maxMarks") ?? 0),
      startMinute: parseTime(String(formData.get("startTime") ?? "")),
      endMinute: parseTime(String(formData.get("endTime") ?? "")),
    }),
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
