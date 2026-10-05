import { nbaSimulateQuerySchema, nbaSimulationSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { simulateNbaDoor } from "@/lib/iqac-insights";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/simulate/nba?year=&departmentId=&scenarioId= — a department's SAR figures today (or a scenario's) and the marks the SAR's formulas give them. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    const parsed = nbaSimulateQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(nbaSimulationSchema.parse(await simulateNbaDoor(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/simulate/nba");
  }
}
