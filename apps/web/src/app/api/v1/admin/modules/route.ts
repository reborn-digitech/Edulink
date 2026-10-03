import { schoolModulesSchema, schoolModuleSwitchSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { schoolModules, setModule } from "@/lib/modules";
import type { ActiveContext } from "@/lib/session";

async function body(ctx: ActiveContext) {
  const rows = await schoolModules(ctx);
  return schoolModulesSchema.parse({ modules: rows.map((r) => ({ module: r.module, on: r.on, enabledAt: r.enabledAt?.toISOString() ?? null })) });
}

/** GET /api/v1/admin/modules — every optional module and whether this school has it on. The office and the head. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(await body(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/modules");
  }
}

/** POST /api/v1/admin/modules — switch one module on or off (the admin's alone; audited school.module.on|off). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = schoolModuleSwitchSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setModule(ctx, parsed.data.module, parsed.data.on);
    return ok(await body(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/modules");
  }
}
