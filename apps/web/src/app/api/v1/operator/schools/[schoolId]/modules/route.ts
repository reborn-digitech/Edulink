import { operatorModuleSwitchBodySchema, operatorSchoolModulesSchema } from "@edulink/contracts";
import { requireApiOperator, AccessError } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { operatorSchoolModules, setModuleAsOperator } from "@/lib/operator-college";
import { operatorRefused } from "@/lib/api-reads/operator-school";
import type { ActiveContext } from "@/lib/session";

async function body(ctx: ActiveContext, schoolId: string) {
  const modules = await operatorSchoolModules(ctx, schoolId);
  if (!modules) throw new AccessError("root.noSuchSchool", "NOT_FOUND");
  return operatorSchoolModulesSchema.parse(modules);
}

/** GET /api/v1/operator/schools/{schoolId}/modules — what the institution is offered, on or off, and whether the platform switched it. */
export async function GET(_request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    return ok(await body(ctx, schoolId));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/modules");
  }
}

/** POST /api/v1/operator/schools/{schoolId}/modules — switch one module on the institution's behalf; audited (school.module.on|off with byOperator, superuser.school.module), the admins told. */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorModuleSwitchBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setModuleAsOperator(ctx, schoolId, parsed.data.module, parsed.data.on);
    if (!result.ok) return operatorRefused(result);
    return ok(await body(ctx, schoolId));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/modules");
  }
}
