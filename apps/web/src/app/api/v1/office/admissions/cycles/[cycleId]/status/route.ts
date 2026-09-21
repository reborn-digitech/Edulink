import { cycleSchema, cycleStatusSaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setCycleStatus } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/cycles/{cycleId}/status — open or close. */
export async function POST(request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { cycleId } = await params;
    const parsed = cycleStatusSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(cycleSchema.parse(await setCycleStatus(ctx, cycleId, parsed.data.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/cycles/[cycleId]/status");
  }
}
