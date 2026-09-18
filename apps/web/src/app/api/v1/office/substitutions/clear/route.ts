import { substitutionAssignedSchema, substitutionClearSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { clearSubstitution } from "@/lib/substitutions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/substitutions/clear — uncover a lesson again. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = substitutionClearSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(substitutionAssignedSchema.parse(await clearSubstitution(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/substitutions/clear");
  }
}
