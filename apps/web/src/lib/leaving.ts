import "server-only";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { leaveCollege } from "./college-records";
import { noDuesFor } from "./no-dues";
import { isDateKey, todayKey } from "./dates";
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
  // A day that is not on the calendar is refused before it decides anything (TA-601): "2026-11-31" is later than
  // today and would be kept, and as a Date it rolls over into December.
  if (input.leftOn && !isDateKey(input.leftOn)) return { ok: false, errorKey: "refusal.leaveDateInvalid" };
  const school = ctx.schoolId ? await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true, kind: true } }) : null;
  /**
   * A COLLEGE'S LEAVING IS THE COLLEGE'S (TA-268), from whichever door. The people page, the phone's person screen
   * and this endpoint used to record it as a school's: no LEAVING clearance read, the programme enrolment left
   * ACTIVE, no caution return recorded — what the college's own door, `leaveCollege`, refuses and does. Now a
   * student with a line open on the clearance is refused here, today or on a later day, and a leaving that is due
   * now goes through `leaveCollege`; a later day is kept, and the night job carries it out the same way.
   */
  if (school && ctx.schoolId && isCollegeKind(school.kind)) {
    const student = await db.membership.findFirst({ where: { id: membershipId, schoolId: ctx.schoolId, role: "STUDENT", leftAt: null }, select: { id: true } });
    if (student) {
      if (!(await noDuesFor(student.id, "LEAVING")).completed) return { ok: false, errorKey: "collegeOffice.refuseNoDuesOpen" };
      if (!(input.leftOn && input.leftOn > todayKey(school.timezone))) {
        try {
          await leaveCollege(ctx, student.id, { leftOn: input.leftOn || todayKey(school.timezone), reason: details.reason });
        } catch (error) {
          if (error instanceof AccessError) return { ok: false, errorKey: error.key };
          throw error;
        }
        const record = await db.schoolRecord.findFirst({ where: { studentMembershipId: student.id }, select: { id: true } });
        return { ok: true, recordId: record?.id ?? null, scheduledFor: null };
      }
    }
  }
  if (input.leftOn && school) {
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
