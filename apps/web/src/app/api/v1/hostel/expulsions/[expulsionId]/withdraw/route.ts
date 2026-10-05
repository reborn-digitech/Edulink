import { hostelExpulsionSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { withdrawExpulsion } from "@/lib/head-approvals";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ expulsionId: string }> };

/** POST /api/v1/hostel/expulsions/{expulsionId}/withdraw — the proposer (or the office) takes back a proposal still waiting (5 Oct 2026). */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const { expulsionId } = await params;
    return ok(hostelExpulsionSchema.parse(await withdrawExpulsion(ctx, expulsionId)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/expulsions/[expulsionId]/withdraw");
  }
}
