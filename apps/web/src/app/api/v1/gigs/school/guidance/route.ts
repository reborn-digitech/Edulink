import { gigGuidanceBodySchema, gigGuidanceSetSchema } from "@edulink/contracts";
import { setTeacherGuidance } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../guard";

/** POST /api/v1/gigs/school/guidance — the school lets its teachers offer free one-to-one guidance to its own pupils, or stops. */
export async function POST(request: Request) {
  try {
    const ctx = await requireGigRole("ADMIN");
    const parsed = gigGuidanceBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setTeacherGuidance(ctx, parsed.data.on);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigGuidanceSetSchema.parse({ guidanceOn: result.guidanceOn }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/school/guidance");
  }
}
