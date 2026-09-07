import { adminStaffQuerySchema, adminStaffSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { adminStaff } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/staff — the staff roster with each person's record, lead classes and leave balance, narrowed by name, role or subject. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const parsed = adminStaffQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminStaffSchema.parse(await adminStaff(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/staff");
  }
}
