import { scholarshipClaimSchema, scholarshipClaimUpdateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { updateClaim } from "@/lib/scholarships";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ claimId: string }> };

/** POST /api/v1/college/scholarships/claims/{claimId} — Sanction, disbursement (a bank payment on the ledger), lapse or rejection (the demand reverts, the student is told), or the portal's id. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN");
    const { claimId } = await params;
    const parsed = scholarshipClaimUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(scholarshipClaimSchema.parse(await updateClaim(ctx, claimId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/scholarships/claims/[claimId]");
  }
}
