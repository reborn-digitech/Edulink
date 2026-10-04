import { salaryStructureSaveSchema, salaryStructureSchema, salaryStructuresSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { listStructures, saveStructure } from "@/lib/payroll";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/payroll/structures — the structures and their components. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    return ok(salaryStructuresSchema.parse(await listStructures(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/structures");
  }
}

/** POST /api/v1/admin/payroll/structures — a structure whole. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = salaryStructureSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(salaryStructureSchema.parse(await saveStructure(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/payroll/structures");
  }
}
