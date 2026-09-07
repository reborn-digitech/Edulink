import { publishSlotsSchema, slotsPublishedSchema, staffMeetingsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffMeetings } from "@/lib/api-reads/staff";
import { publishSlots } from "@/lib/meetings";
import { db } from "@/lib/db";
import { zonedStartOfDay } from "@/lib/dates";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/staff/meetings — the teacher's upcoming meeting slots, booked or open. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER");
    return ok(staffMeetingsSchema.parse(await staffMeetings(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/meetings");
  }
}

/**
 * POST /api/v1/staff/meetings — a run of back-to-back slots. The teacher
 * gives a wall-clock time; the school's timezone turns it into an instant,
 * exactly as the form's action does. An exact duplicate start is skipped by
 * the lib, so sending the same run twice does not double the afternoon.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = publishSlotsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { date, time, durationMinutes, count, location } = parsed.data;
    const [hours, minutes] = time.split(":").map(Number) as [number, number];
    const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
    const startsAt = new Date(zonedStartOfDay(date, school.timezone).getTime() + (hours * 60 + minutes) * 60_000);
    const result = await publishSlots(ctx, { startsAt, durationMinutes, count, location });
    return ok(slotsPublishedSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/meetings");
  }
}
