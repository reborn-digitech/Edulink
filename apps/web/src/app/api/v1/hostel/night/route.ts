import { hostelNightQuerySchema, hostelNightSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { nightRegister } from "@/lib/hostel-night";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/hostel/night?date= — the night-out register: every approved leave covering the night, due back by when, and where each stands (5 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    const parsed = hostelNightQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(hostelNightSchema.parse(await nightRegister(ctx, parsed.data.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/night");
  }
}
