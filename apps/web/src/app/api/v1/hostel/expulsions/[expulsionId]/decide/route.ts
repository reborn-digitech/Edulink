import { headDecisionSchema, hostelExpulsionSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideExpulsion } from "@/lib/head-approvals";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ expulsionId: string }> };

/** POST /api/v1/hostel/expulsions/{expulsionId}/decide — the principal approves (the place ends on the proposal's day) or refuses (5 Oct 2026). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PRINCIPAL");
    const { expulsionId } = await params;
    const parsed = headDecisionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(hostelExpulsionSchema.parse(await decideExpulsion(ctx, expulsionId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/expulsions/[expulsionId]/decide");
  }
}
