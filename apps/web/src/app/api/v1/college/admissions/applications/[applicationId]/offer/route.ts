import { collegeApplicationSchema, collegeOfferBodySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { offerSeat } from "@/lib/college-admissions";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/offer — Offer the seat: scrutiny complete and both undertakings recorded; the admission fee is the category's first-year first term. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { applicationId } = await params;
    const parsed = collegeOfferBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeApplicationSchema.parse(await offerSeat(ctx, applicationId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/college/admissions/applications/[applicationId]/offer");
  }
}
