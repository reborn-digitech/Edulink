import { concessionDecidedSchema, concessionDecisionBodySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideConcession } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ concessionId: string }> };

/** POST /api/v1/accounts/concessions/{concessionId}/decide — The principal approves (applied now) or refuses a concession above the limit. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PRINCIPAL");
    const { concessionId } = await params;
    const parsed = concessionDecisionBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(concessionDecidedSchema.parse(await decideConcession(ctx, concessionId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/concessions/[concessionId]/decide");
  }
}
