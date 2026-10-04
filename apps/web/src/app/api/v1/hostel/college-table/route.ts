import { hostelTableSchema, yearQuerySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { hostelTableFor } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/hostel/college-table — Occupancy and discipline for a year (criterion 5). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL", "IQAC");
    const parsed = yearQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(hostelTableSchema.parse(await hostelTableFor(ctx, q.year)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/college-table");
  }
}
