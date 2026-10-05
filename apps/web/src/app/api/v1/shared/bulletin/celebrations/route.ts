import { celebrationsQuerySchema, celebrationsSchema } from "@edulink/contracts";
import { celebrationsFor } from "@/lib/birthdays";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * GET /api/v1/shared/bulletin/celebrations?days= — the upcoming birthdays and
 * work anniversaries the web's /bulletin/celebrations shows (A3-inventory-14,
 * audit of 5 October 2026): the viewer's school, or each child's for a
 * guardian; staff see every birthday, pupils and families the staff's
 * (birthdays.ts decides). `days` 1 to 183, default 30 (the page's month; it
 * asks for the half-year when the month is empty). Read only.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = celebrationsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const items = await celebrationsFor(ctx, parsed.data.days);
    return ok(celebrationsSchema.parse({ days: parsed.data.days, items }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/celebrations");
  }
}
