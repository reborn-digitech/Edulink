import { expertsQuerySchema, staffExpertsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffExperts } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/experts?q=&offering=&specialism= — the expert marketplace and this school's live bookings. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const parsed = expertsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffExpertsSchema.parse(await staffExperts(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/experts");
  }
}
