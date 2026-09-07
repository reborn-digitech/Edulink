import { adminCalendarQuerySchema, adminCalendarSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { adminCalendar } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/calendar — the years, the running year's terms, closures and events, approved staff leave and birthdays over the next 120 days. Staff-only by construction. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = adminCalendarQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminCalendarSchema.parse(await adminCalendar(ctx, { all: parsed.data.when === "all" })));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar");
  }
}
