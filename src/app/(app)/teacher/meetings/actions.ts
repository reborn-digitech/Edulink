"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { publishSlots, cancelSlot } from "@/lib/meetings";
import { zonedStartOfDay, isDateKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

/**
 * The teacher types a wall-clock time; the school's timezone turns it into an
 * instant. `new Date("...")` on the server would use the SERVER's zone, which
 * is exactly the bug zonedStartOfDay exists to prevent.
 */
export async function publishSlotsAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("TEACHER");
  const dateKey = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const durationMinutes = Number(formData.get("duration") ?? 15);
  const count = Number(formData.get("count") ?? 1);
  const location = String(formData.get("location") ?? "");

  try {
    if (!isDateKey(dateKey)) throw new AccessError("access.pickAMeetingTime");
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) throw new AccessError("access.pickAMeetingTime");
    const school = await db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId! },
      select: { timezone: true },
    });
    const startsAt = new Date(
      zonedStartOfDay(dateKey, school.timezone).getTime() +
        (Number(match[1]) * 60 + Number(match[2])) * 60_000,
    );
    await publishSlots(ctx, { startsAt, durationMinutes, count, location });
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`/teacher/meetings?error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
  revalidatePath("/teacher/meetings");
  redirect("/teacher/meetings");
}

export async function cancelSlotAction(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("TEACHER");
  try {
    await cancelSlot(ctx, String(formData.get("slotId") ?? ""));
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`/teacher/meetings?error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
  revalidatePath("/teacher/meetings");
  redirect("/teacher/meetings");
}
