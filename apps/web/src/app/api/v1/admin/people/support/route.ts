import { supportStaffCreatedSchema, supportStaffCreateSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";
import { addSupportStaff } from "@/lib/support-staff";

/**
 * POST /api/v1/admin/people/support — owner-batch-item2a (27 Oct 2026): the office adds a support worker with no
 * login (a cleaner, cook, guard or peon): an account nobody signs in as, an ACTIVE SUPPORT membership and a staff
 * record, with a salary when one is given. A second identical press within ten minutes answers the first worker.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = supportStaffCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(supportStaffCreatedSchema.parse(await addSupportStaff(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/people/support");
  }
}
