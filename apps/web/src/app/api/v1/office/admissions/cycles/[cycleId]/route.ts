import { cycleSaveSchema, cycleSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { updateCycle } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/cycles/{cycleId} — rewrite it. */
export async function POST(request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { cycleId } = await params;
    const parsed = cycleSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(cycleSchema.parse(await updateCycle(ctx, cycleId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/cycles/[cycleId]");
  }
}
