import { familyPlacementConsentSchema, familyPlacementSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { guardianConsentToApplication } from "@/lib/placement-student";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/family/placement/applications/{applicationId}/consent — a guardian's consent to a minor's drive application (campaign S-6). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PARENT");
    const { applicationId } = await params;
    const parsed = familyPlacementConsentSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyPlacementSchema.parse(await guardianConsentToApplication(ctx, applicationId, parsed.data.childId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/family/placement/applications/[applicationId]/consent");
  }
}
