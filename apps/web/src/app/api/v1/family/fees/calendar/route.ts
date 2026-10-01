import { familyChildFeesQuerySchema, familyFeeCalendarSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { paymentCalendar } from "@/lib/fees-family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../../_shared";

/** GET /api/v1/family/fees/calendar?student= — the year's due dates for one child: instalments, other dues and the reminders still to come. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyChildFeesQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyFeeCalendarSchema.parse(await paymentCalendar(ctx, parsed.data.student ?? parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/fees/calendar");
  }
}
