import { iqacCycleCreateSchema, iqacCyclesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listCycles, openCycle } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/cycles — The college's NAAC cycles. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(iqacCyclesSchema.parse(await listCycles(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/cycles");
  }
}

/** POST /api/v1/iqac/cycles — Open a NAAC cycle over a window of up to five years; its quantitative metrics are computed at once. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const parsed = iqacCycleCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(iqacCyclesSchema.parse(await openCycle(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/cycles");
  }
}
