import { busAssignmentInputSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createAssignment } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/transport/assignments — a bus on a route with its driver and attendant. The ADMIN's. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = busAssignmentInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { id } = await createAssignment(ctx, parsed.data);
    return ok({ ok: true as const, id }, 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/assignments");
  }
}
