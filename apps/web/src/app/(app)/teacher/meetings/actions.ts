"use server";

import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { publishSlots, cancelSlot } from "@/lib/meetings";
import { zonedStartOfDay, isDateKey } from "@/lib/dates";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * The teacher types a wall-clock time; the school's timezone turns it into an
 * instant. `new Date("...")` on the server would use the SERVER's zone, which
 * is exactly the bug zonedStartOfDay exists to prevent.
 *
 * Both forms answer in place (A3-journeys-27): a refusal keeps the day, time
 * and place typed, and a day or time that does not read is marked on its box.
 */
export async function publishSlotsAction(previous: FormState, formData: FormData): Promise<FormState> {
  const dateKey = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiRole("TEACHER");
      const durationMinutes = Number(formData.get("duration") ?? 15);
      const count = Number(formData.get("count") ?? 1);
      const location = String(formData.get("location") ?? "");
      if (!isDateKey(dateKey)) throw Object.assign(new AccessError("access.pickAMeetingTime"), { field: "date" });
      const match = /^(\d{1,2}):(\d{2})$/.exec(time);
      if (!match) throw Object.assign(new AccessError("access.pickAMeetingTime"), { field: "time" });
      const school = await db.school.findUniqueOrThrow({
        where: { id: ctx.schoolId! },
        select: { timezone: true },
      });
      const startsAt = new Date(zonedStartOfDay(dateKey, school.timezone).getTime() + (Number(match[1]) * 60 + Number(match[2])) * 60_000);
      await publishSlots(ctx, { startsAt, durationMinutes, count, location });
      return null;
    },
    { revalidate: ["/teacher/meetings"] },
  );
}

export async function cancelSlotAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiRole("TEACHER");
      await cancelSlot(ctx, String(formData.get("slotId") ?? ""));
      return null;
    },
    { revalidate: ["/teacher/meetings"] },
  );
}
