import { collegeFeeStructureBodySchema, collegeFeeStructuresSchema, collegeSavedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createCollegeStructure, listCollegeStructures } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/accounts/fee-structures — This year's structures by programme, year of study and category. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    return ok(collegeFeeStructuresSchema.parse(await listCollegeStructures(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/fee-structures");
  }
}

/** POST /api/v1/accounts/fee-structures — A structure as the fee regulating authority approved it: terms with lines by head, the approval reference, late-fee slabs; published at once. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN");
    const parsed = collegeFeeStructureBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeSavedSchema.parse(await createCollegeStructure(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/fee-structures");
  }
}
