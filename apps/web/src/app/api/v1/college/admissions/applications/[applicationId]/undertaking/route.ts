import { antiRaggingBodySchema, collegeApplicationSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recordUndertaking } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/undertaking — Record the anti-ragging undertaking as given by the student or a parent (the UGC portal remains the legal record). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { applicationId } = await params;
    const parsed = antiRaggingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeApplicationSchema.parse(await recordUndertaking(ctx, applicationId, b.by)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications/[applicationId]/undertaking");
  }
}
