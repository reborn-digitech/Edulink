import { claimCodeRotateSchema, claimCodeRotatedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { rotateClaimCode } from "@/lib/id-card";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/id-cards/claim-code — the office gives one student a new guardian claim code; the old one claims nothing (R-52). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = claimCodeRotateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(claimCodeRotatedSchema.parse(await rotateClaimCode(ctx, parsed.data.studentMembershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/id-cards/claim-code");
  }
}
