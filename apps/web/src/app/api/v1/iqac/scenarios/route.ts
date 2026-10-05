import { scenarioQuerySchema, scenarioSaveSchema, scenariosSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listScenarios, saveScenario } from "@/lib/iqac-insights";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/scenarios?kind=&cycleId=&year=&departmentId= — the saved scenarios, each recomputed now with its lead over today; an HOD their department's NBA ones. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    const parsed = scenarioQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(scenariosSchema.parse(await listScenarios(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/scenarios");
  }
}

/** POST /api/v1/iqac/scenarios — save a scenario (the IQAC and the principal; an HOD their department's NBA ones); the result is recomputed here. Audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "PRINCIPAL", "HOD");
    const parsed = scenarioSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(scenariosSchema.parse(await saveScenario(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/scenarios");
  }
}
