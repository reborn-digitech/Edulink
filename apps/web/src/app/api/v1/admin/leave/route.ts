import { adminLeaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { adminLeave } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/leave — the leave queue: every pending request with the applicant's balance, the classes approving would cover, and who is free to cover them; then the decided ones. */
export async function GET() {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    return ok(adminLeaveSchema.parse(await adminLeave(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/leave");
  }
}
