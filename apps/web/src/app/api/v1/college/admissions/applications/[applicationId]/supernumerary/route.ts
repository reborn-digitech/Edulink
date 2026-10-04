import { collegeApplicationSchema, collegeSupernumeraryBodySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { approveSupernumerary } from "@/lib/college-admissions";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/supernumerary — The principal gives a seat beyond the round's seats or the intake, with the reason (LIFECYCLE-4). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PRINCIPAL");
    const { applicationId } = await params;
    const parsed = collegeSupernumeraryBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(collegeApplicationSchema.parse(await approveSupernumerary(ctx, applicationId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/college/admissions/applications/[applicationId]/supernumerary");
  }
}
