import { entranceSlotsListSchema, entranceSlotsPublishSchema, entranceSlotsPublishedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { listSlots, publishSlots } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/admissions/cycles/{cycleId}/slots — the sittings. */
export async function GET(_request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { cycleId } = await params;
    return ok(entranceSlotsListSchema.parse(await listSlots(ctx, cycleId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/cycles/[cycleId]/slots");
  }
}

/** POST /api/v1/office/admissions/cycles/{cycleId}/slots — publish sittings. */
export async function POST(request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { cycleId } = await params;
    const parsed = entranceSlotsPublishSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(entranceSlotsPublishedSchema.parse(await publishSlots(ctx, cycleId, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/cycles/[cycleId]/slots");
  }
}
