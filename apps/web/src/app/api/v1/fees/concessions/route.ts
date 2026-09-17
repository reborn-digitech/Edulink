import { feeConcessionBodySchema, feeConcessionCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { grantConcession } from "@/lib/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/concessions — grant one and recalculate the pupil's untouched instalments. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = feeConcessionBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeConcessionCreatedSchema.parse({ id: await grantConcession(ctx, { ...parsed.data, headId: parsed.data.headId ?? null }) }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/fees/concessions");
  }
}
