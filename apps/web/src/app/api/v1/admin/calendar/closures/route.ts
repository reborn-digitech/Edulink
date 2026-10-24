import { closureCreateBodySchema, createdIdSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createHoliday } from "@/lib/holidays";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/** POST /api/v1/admin/calendar/closures — add a holiday, exam window or event to the calendar. The admin's alone: the head reads the calendar, the office sets it. A rule the entry breaks is a 422 in words. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = closureCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    // The library's rules (an end before the start, a day that is not real, a span too long) are a 422 in words, as the
    // correction's door answers them, not 403 FORBIDDEN (QA-54): the role is proved above.
    return await underRules("api/v1/admin/calendar/closures", async () => {
      const id = await createHoliday(ctx, parsed.data);
      return ok(createdIdSchema.parse({ id }), 201);
    });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/closures");
  }
}
