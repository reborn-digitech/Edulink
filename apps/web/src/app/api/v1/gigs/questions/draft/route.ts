import { gigDraftBodySchema, gigDraftSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { draftTranslations } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/gigs/questions/draft — a machine draft of the Hindi and the Marathi from the English, for the teacher to correct; nothing is saved. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = gigDraftBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await draftTranslations(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigDraftSchema.parse({ hi: result.hi, mr: result.mr }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/questions/draft");
  }
}
