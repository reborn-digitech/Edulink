import { busInputSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveBus } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** PUT /api/v1/admin/transport/buses/{busId} — change a bus or take it off the road. The ADMIN's. */
export async function PUT(request: Request, { params }: { params: Promise<{ busId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { busId } = await params;
    const parsed = busInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { id } = await saveBus(ctx, busId, parsed.data);
    return ok({ ok: true as const, id });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/buses/update");
  }
}
