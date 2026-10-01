import { expertKycSchema, expertKycSubmitBodySchema } from "@edulink/contracts";
import { readKyc, submitKyc } from "@/lib/expert-kyc";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiExpertRole } from "../guard";

/** GET /api/v1/expert/kyc — where the expert's papers stand. */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertKycSchema.parse(await readKyc(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/kyc");
  }
}

/** POST /api/v1/expert/kyc — send the papers: ids from POST /api/v1/uploads in the expert's own name, and a note. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiExpertRole();
    const parsed = expertKycSubmitBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await submitKyc(ctx, parsed.data);
    return ok(expertKycSchema.parse(await readKyc(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/kyc");
  }
}
