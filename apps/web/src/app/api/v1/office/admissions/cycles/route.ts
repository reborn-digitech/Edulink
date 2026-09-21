import { cycleSaveSchema, cycleSchema, cyclesViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createCycle, cyclesView } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/admissions/cycles — every cycle with its seats and counts. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(cyclesViewSchema.parse(await cyclesView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/cycles");
  }
}

/** POST /api/v1/office/admissions/cycles — create one. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = cycleSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(cycleSchema.parse(await createCycle(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/cycles");
  }
}
