import { busInputSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveBus } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/transport/buses — add a bus. The ADMIN's. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = busInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { id } = await saveBus(ctx, null, parsed.data);
    return ok({ ok: true as const, id }, 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/buses");
  }
}
