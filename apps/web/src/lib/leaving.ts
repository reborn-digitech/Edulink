import "server-only";
import { db } from "./db";
import { todayKey } from "./dates";
import { recordDeparture, scheduleDeparture, type DepartureInput } from "./school-record";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * A pupil's leaving, as the office records it from either door.
 *
 * A LAST DAY IN THE FUTURE SCHEDULES. The pupil keeps access through that
 * day; the daily job records the departure the morning after — the first
 * functional test found the date being written on the certificate and
 * ignored by everything else. "After today" is the school's today, not the
 * server's.
 *
 * This was the body of the web's `recordLeaving` action. It is here so that
 * the phone's endpoint decides by the same rule and not by a copy of it.
 */
export type LeavingInput = { reason: string; destination?: string | null; note?: string | null; leftOn?: string | null; conduct?: string | null };
export type LeavingOutcome = { ok: true; recordId: string | null; scheduledFor: string | null } | { ok: false; errorKey: TranslationKey };

export async function recordOrScheduleLeaving(ctx: ActiveContext, membershipId: string, input: LeavingInput): Promise<LeavingOutcome> {
  const details = {
    reason: input.reason as DepartureInput["reason"],
    conduct: (input.conduct || null) as DepartureInput["conduct"],
    destination: input.destination ?? "",
    note: input.note ?? "",
  };
  if (input.leftOn && ctx.schoolId) {
    const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
    if (input.leftOn > todayKey(school.timezone)) {
      const scheduled = await scheduleDeparture(ctx, membershipId, { ...details, leaveOnKey: input.leftOn });
      if (!scheduled.ok) return { ok: false, errorKey: scheduled.errorKey };
      return { ok: true, recordId: null, scheduledFor: scheduled.leaveOnKey };
    }
  }
  // An empty date means today, which is what it means on paper. A date that
  // is not a date is refused by the library rather than becoming today.
  const result = await recordDeparture(ctx, membershipId, { ...details, leftOn: input.leftOn ? new Date(input.leftOn) : undefined });
  if (!result.ok) return { ok: false, errorKey: result.errorKey };
  return { ok: true, recordId: result.recordId, scheduledFor: null };
}
